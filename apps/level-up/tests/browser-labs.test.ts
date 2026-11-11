import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import fixture from '@/data/labs/sql-fixture.json';
import { checkSqlResult, sqlExercises, type SqlResult } from '@/lib/labs/sql';
import { initialSandboxState, runSandboxRequest, type SandboxRequest } from '@/lib/labs/http';
import { POST } from '@/app/api/labs/http/route';

const require = createRequire(import.meta.url);
const engine = initSqlJs({ locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm') });
const workerSource = fs.readFileSync(path.join(process.cwd(), 'public/labs/sql-worker.js'), 'utf8');
type WorkerResult = ({ ok: true } & SqlResult) | { ok: false; error: string };
async function query(sql: string): Promise<WorkerResult> {
  let result: WorkerResult | undefined;
  const sandbox = {
    importScripts: () => undefined,
    initSqlJs: () => engine,
    Error,
    Uint8Array,
    postMessage: (message: WorkerResult | { type: string }) => {
      if ('ok' in message) result = message;
    },
    onmessage: null as unknown as (event: { data: unknown }) => Promise<void>,
  };
  vm.runInNewContext(workerSource, sandbox);
  await sandbox.onmessage({ data: { sql, fixture } });
  expect(result).toBeDefined();
  return result!;
}
beforeAll(async () => {
  await engine;
});

describe('browser SQL worker', () => {
  it('executes joins, null-preserving counts and windows on the actual SQLite engine', async () => {
    const revenue = await query(
      "SELECT SUM(amount_cents) AS paid_revenue_cents FROM orders WHERE status='paid'",
    );
    expect(revenue.ok).toBe(true);
    if (revenue.ok) expect(checkSqlResult(revenue, sqlExercises[0]).correct).toBe(true);
    const naive = await query(
      "SELECT SUM(o.amount_cents) FROM orders o JOIN order_items i ON i.order_id=o.order_id WHERE o.status='paid'",
    );
    expect(naive.ok && naive.rows).toEqual([[17500]]);
    const left = await query(
      "SELECT c.customer_id, COUNT(o.order_id) AS paid_orders FROM customers c LEFT JOIN orders o ON o.customer_id=c.customer_id AND o.status='paid' GROUP BY c.customer_id",
    );
    expect(left.ok && checkSqlResult(left, sqlExercises[1]).correct).toBe(true);
    const window = await query(
      "SELECT order_id,SUM(amount_cents) OVER (PARTITION BY customer_id ORDER BY ordered_at,order_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS customer_running_cents FROM orders WHERE status='paid'",
    );
    expect(window.ok && checkSqlResult(window, sqlExercises[4]).correct).toBe(true);
  });
  it('blocks direct and CTE writes, pragma changes and multiple statements without changing fixtures', async () => {
    for (const sql of [
      'DELETE FROM orders',
      'WITH x AS (SELECT 1) UPDATE orders SET amount_cents=0',
      'PRAGMA query_only=OFF',
      'SELECT 1; SELECT 2',
      "ATTACH DATABASE 'elsewhere' AS other",
    ]) {
      expect((await query(sql)).ok, sql).toBe(false);
    }
    const intact = await query("SELECT SUM(amount_cents) FROM orders WHERE status='paid'");
    expect(intact.ok && intact.rows).toEqual([[16500]]);
  });
  it('caps rows and large cells and reports SQL errors instead of stale success', async () => {
    const large = await query(
      'WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<250) SELECT x FROM n',
    );
    expect(large.ok && large.rows.length).toBe(200);
    expect(large.ok && large.truncated).toBe(true);
    const text = await query("SELECT printf('%02000d', 1) AS long_value");
    expect(text.ok && text.truncated).toBe(true);
    expect((await query('SELECT absent_column FROM orders')).ok).toBe(false);
    expect((await query('SELECT length(hex(zeroblob(40000000)))')).ok).toBe(false);
    const recovered = await query('SELECT COUNT(*) FROM orders');
    expect(recovered.ok && recovered.rows).toEqual([[7]]);
  });
  it('accepts equivalent result ordering and rejects incorrect, duplicate-column or truncated results', () => {
    const expected = sqlExercises[1];
    expect(
      checkSqlResult(
        {
          columns: ['paid_orders', 'customer_id'],
          rows: [...expected.expected.rows].reverse().map(([id, count]) => [count, id]),
          truncated: false,
        },
        expected,
      ).correct,
    ).toBe(true);
    expect(
      checkSqlResult(
        { ...expected.expected, rows: expected.expected.rows.slice(1), truncated: false },
        expected,
      ).correct,
    ).toBe(false);
    expect(checkSqlResult({ ...expected.expected, truncated: true }, expected).correct).toBe(false);
    expect(
      checkSqlResult(
        { columns: ['customer_id', 'customer_id'], rows: [], truncated: false },
        expected,
      ).correct,
    ).toBe(false);
  });
});

const create: SandboxRequest = {
  method: 'POST',
  path: '/orders',
  headers: {
    Authorization: 'Bearer demo-alice',
    'Content-Type': 'application/json',
    'Idempotency-Key': 'operation-01',
  },
  body: '{"sku":"BOOK","quantity":2}',
};
describe('isolated API sandbox', () => {
  it('replays a scoped create once and rejects payload conflicts without changing its snapshot', () => {
    const initial = initialSandboxState();
    const first = runSandboxRequest(create, initial);
    const replay = runSandboxRequest(create, first.state);
    expect(first.response.status).toBe(201);
    expect(replay.response.headers['Idempotency-Replayed']).toBe('true');
    expect(replay.response.body).toEqual(first.response.body);
    expect(replay.state.orders).toHaveLength(3);
    const conflict = runSandboxRequest(
      { ...create, body: '{"sku":"BOOK","quantity":3}' },
      replay.state,
    );
    expect(conflict.response.status).toBe(409);
    expect(conflict.state).toEqual(replay.state);
    expect(initial.orders).toHaveLength(2);
    const bob = runSandboxRequest(
      { ...create, headers: { ...create.headers, Authorization: 'Bearer demo-bob' } },
      replay.state,
    );
    expect(bob.response.status).toBe(201);
    expect(bob.state.orders).toHaveLength(4);
  });
  it('distinguishes authentication, scope and object checks and rejects mass assignment', () => {
    const initial = initialSandboxState();
    expect(runSandboxRequest({ ...create, headers: {} }, initial).response.status).toBe(401);
    expect(
      runSandboxRequest(
        { ...create, headers: { ...create.headers, Authorization: 'Bearer demo-reader' } },
        initial,
      ).response.status,
    ).toBe(403);
    const denied = runSandboxRequest(
      {
        method: 'GET',
        path: '/orders/order-200',
        headers: { Authorization: 'Bearer demo-alice' },
        body: '',
      },
      initial,
    );
    expect(denied.response.status).toBe(404);
    expect(JSON.stringify(denied.response.body)).not.toContain('BOOK');
    const invalid = runSandboxRequest(
      { ...create, body: '{"sku":"BOOK","quantity":2,"ownerId":"bob"}' },
      initial,
    );
    expect(invalid.response.status).toBe(422);
    expect(invalid.state).toEqual(initial);
  });
  it('checks version preconditions and supports a bodyless delete', () => {
    const update: SandboxRequest = {
      method: 'PATCH',
      path: '/orders/order-100',
      headers: {
        Authorization: 'Bearer demo-alice',
        'Content-Type': 'application/json',
        'If-Match': '"v1"',
      },
      body: '{"quantity":3}',
    };
    const changed = runSandboxRequest(update, initialSandboxState());
    expect(changed.response.headers.ETag).toBe('"v2"');
    const stale = runSandboxRequest(update, changed.state);
    expect(stale.response.status).toBe(412);
    expect(stale.state).toEqual(changed.state);
    const missing = runSandboxRequest(
      {
        ...update,
        headers: { Authorization: 'Bearer demo-alice', 'Content-Type': 'application/json' },
      },
      changed.state,
    );
    expect(missing.response.status).toBe(428);
    const removed = runSandboxRequest(
      {
        ...update,
        method: 'DELETE',
        body: '',
        headers: { Authorization: 'Bearer demo-alice', 'If-Match': '"v2"' },
      },
      changed.state,
    );
    expect(removed.response.status).toBe(204);
    expect(removed.response.body).toBeNull();
    expect(removed.state.orders).toHaveLength(1);
  });
  it('never accepts an external URL as a destination and handles malformed body/header input', () => {
    expect(
      runSandboxRequest({ ...create, path: 'https://example.com/' }, initialSandboxState()).response
        .status,
    ).toBe(400);
    expect(
      runSandboxRequest({ ...create, path: '//example.com/' }, initialSandboxState()).response
        .status,
    ).toBe(400);
    expect(runSandboxRequest({ ...create, body: '{' }, initialSandboxState()).response.status).toBe(
      400,
    );
    expect(
      runSandboxRequest(
        { ...create, headers: { ...create.headers, authorization: 'Bearer demo-bob' } },
        initialSandboxState(),
      ).response.status,
    ).toBe(400);
  });
  it('validates bounded HTTP envelopes and carries caller-owned state without process-global storage', async () => {
    const invoke = (value: unknown) =>
      POST(
        new Request('http://localhost/api/labs/http', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        }),
      );
    const first = await invoke({ request: create });
    expect(first.headers.get('cache-control')).toBe('no-store');
    const payload = await first.json();
    expect(payload.response.status).toBe(201);
    const independent = await (await invoke({ request: create })).json();
    expect(independent.state.orders).toHaveLength(3);
    expect(independent.state.nextId).toBe(payload.state.nextId);
    const replay = await (await invoke({ request: create, state: payload.state })).json();
    expect(replay.response.headers['Idempotency-Replayed']).toBe('true');
    expect((await invoke({ request: create, state: { invalid: true } })).status).toBe(400);
    expect((await invoke({ padding: 'x'.repeat(33000) })).status).toBe(413);
  });
});
