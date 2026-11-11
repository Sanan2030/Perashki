import { z } from 'zod';

const orderSchema = z
  .object({
    id: z.string().regex(/^order-\d{1,6}$/),
    tenantId: z.enum(['alpha', 'beta']),
    ownerId: z.enum(['alice', 'bob']),
    sku: z.enum(['BOOK', 'COURSE']),
    quantity: z.number().int().min(1).max(100),
    version: z.number().int().min(1).max(10000),
  })
  .strict();
export const sandboxStateSchema = z
  .object({
    orders: z.array(orderSchema).max(20),
    operations: z
      .array(
        z
          .object({
            identity: z.string().max(150),
            fingerprint: z.string().max(100),
            result: orderSchema,
          })
          .strict(),
      )
      .max(20),
    nextId: z.number().int().min(201).max(999999),
  })
  .strict()
  .refine(
    (state) => new Set(state.orders.map((o) => o.id)).size === state.orders.length,
    'Duplicate order IDs',
  );
export type SandboxState = z.infer<typeof sandboxStateSchema>;
export const sandboxRequestSchema = z
  .object({
    method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']),
    path: z.string().min(1).max(200),
    headers: z
      .record(z.string().min(1).max(50), z.string().max(200))
      .refine((headers) => Object.keys(headers).length <= 20),
    body: z.string().max(6000),
  })
  .strict();
export type SandboxRequest = z.infer<typeof sandboxRequestSchema>;
export type SandboxResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
};
export type SandboxResult = { response: SandboxResponse; state: SandboxState };

export function initialSandboxState(): SandboxState {
  return {
    orders: [
      {
        id: 'order-100',
        tenantId: 'alpha',
        ownerId: 'alice',
        sku: 'COURSE',
        quantity: 1,
        version: 1,
      },
      { id: 'order-200', tenantId: 'beta', ownerId: 'bob', sku: 'BOOK', quantity: 2, version: 1 },
    ],
    operations: [],
    nextId: 201,
  };
}

const createInput = z
  .object({ sku: z.enum(['BOOK', 'COURSE']), quantity: z.number().int().min(1).max(100) })
  .strict();
const updateInput = z.object({ quantity: z.number().int().min(1).max(100) }).strict();
const statuses: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  412: 'Precondition Failed',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Content',
  428: 'Precondition Required',
  429: 'Too Many Requests',
};

/** Synthetic, caller-owned state. This is a teaching service, not real authentication or persistence. */
export function runSandboxRequest(
  input: SandboxRequest,
  suppliedState: SandboxState,
): SandboxResult {
  const request = sandboxRequestSchema.parse(input);
  const state = structuredClone(sandboxStateSchema.parse(suppliedState));
  const reply = (
    status: number,
    body: unknown = null,
    extra: Record<string, string> = {},
  ): SandboxResult => ({
    response: {
      status,
      statusText: statuses[status] ?? '',
      headers: { ...(status === 204 ? {} : { 'Content-Type': 'application/json' }), ...extra },
      body,
    },
    state,
  });
  const fail = (status: number, code: string, detail: string, extra: Record<string, string> = {}) =>
    reply(status, { code, detail }, extra);
  const headers: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(request.headers)) {
    const name = key.toLowerCase();
    if (Object.hasOwn(headers, name))
      return fail(400, 'ambiguous-header', 'Use each header name once, regardless of case.');
    headers[name] = value.trim();
  }
  if (
    !request.path.startsWith('/') ||
    request.path.startsWith('//') ||
    /[\\\s#]/.test(request.path)
  )
    return fail(400, 'invalid-path', 'Use a relative /orders path. No external URLs are fetched.');
  const url = new URL(request.path, 'https://sandbox.invalid');
  const match = /^\/orders(?:\/(order-\d{1,6}))?$/.exec(url.pathname);
  if (!match) return fail(404, 'route-not-found', 'Use /orders or /orders/order-100.');
  const token = headers.authorization;
  const actor =
    token === 'Bearer demo-alice'
      ? { tenant: 'alpha', owner: 'alice', write: true }
      : token === 'Bearer demo-bob'
        ? { tenant: 'beta', owner: 'bob', write: true }
        : token === 'Bearer demo-reader'
          ? { tenant: 'alpha', owner: 'alice', write: false }
          : null;
  if (!actor)
    return fail(401, 'authentication-required', 'Use a documented demo bearer token.', {
      'WWW-Authenticate': 'Bearer',
    });
  if (request.method !== 'GET' && !actor.write)
    return fail(403, 'scope-required', 'This demo token has read permission only.');
  const id = match[1];
  const order = id
    ? state.orders.find(
        (o) => o.id === id && o.tenantId === actor.tenant && o.ownerId === actor.owner,
      )
    : undefined;
  if (id && !order)
    return fail(
      404,
      'order-not-found',
      'The order is absent or unavailable to this demo identity.',
    );
  if (request.method === 'GET') {
    if (request.body.trim()) return fail(400, 'unexpected-body', 'Leave the GET body empty.');
    if (id) return reply(200, order, { ETag: `"v${order!.version}"` });
    if (
      [...url.searchParams.keys()].some((key) => key !== 'limit') ||
      url.searchParams.getAll('limit').length > 1
    )
      return fail(400, 'invalid-query', 'The collection supports one limit parameter.');
    const limit = url.searchParams.get('limit') ?? '20';
    if (!/^(?:[1-9]|1\d|20)$/.test(limit))
      return fail(400, 'invalid-limit', 'Use limit from 1 to 20.');
    return reply(200, {
      orders: state.orders
        .filter((o) => o.tenantId === actor.tenant && o.ownerId === actor.owner)
        .slice(0, Number(limit)),
    });
  }
  if ((request.method === 'POST' && id) || (request.method !== 'POST' && !id))
    return fail(405, 'method-not-allowed', 'POST the collection; PATCH or DELETE an order.');
  if (request.method === 'DELETE') {
    if (!headers['if-match'])
      return fail(428, 'version-required', 'Send If-Match using the current ETag.');
    if (headers['if-match'] !== `"v${order!.version}"`)
      return fail(412, 'stale-version', 'Read the current order before deleting.');
    state.orders = state.orders.filter((item) => item.id !== id);
    return reply(204);
  }
  if (headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json')
    return fail(415, 'json-required', 'Send Content-Type: application/json.');
  let body: unknown;
  try {
    body = JSON.parse(request.body);
  } catch {
    return fail(400, 'invalid-json', 'The request body is not valid JSON.');
  }
  if (request.method === 'POST') {
    const parsed = createInput.safeParse(body);
    if (!parsed.success)
      return fail(
        422,
        'invalid-order',
        'Use sku BOOK or COURSE and an integer quantity from 1 to 100; no extra fields.',
      );
    const key = headers['idempotency-key'];
    if (!key || !/^[A-Za-z0-9_-]{8,80}$/.test(key))
      return fail(
        400,
        'operation-key-required',
        'Use an Idempotency-Key of 8–80 letters, digits, underscores or hyphens.',
      );
    const identity = `${actor.tenant}:${actor.owner}:create:${key}`;
    const fingerprint = JSON.stringify(parsed.data);
    const previous = state.operations.find((operation) => operation.identity === identity);
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        return fail(
          409,
          'idempotency-key-conflict',
          'That key already identifies a different create request.',
        );
      return reply(201, previous.result, {
        Location: `/orders/${previous.result.id}`,
        ETag: `"v${previous.result.version}"`,
        'Idempotency-Replayed': 'true',
      });
    }
    if (state.orders.length >= 20 || state.operations.length >= 20)
      return fail(429, 'sandbox-full', 'Reset the sandbox to start with fresh fixtures.');
    if (state.nextId >= 999999)
      return fail(429, 'sandbox-full', 'Reset the sandbox to start with fresh fixtures.');
    const created = {
      id: `order-${state.nextId}`,
      tenantId: actor.tenant,
      ownerId: actor.owner,
      ...parsed.data,
      version: 1,
    } as z.infer<typeof orderSchema>;
    if (state.orders.some((item) => item.id === created.id))
      return fail(409, 'fixture-conflict', 'Reset the sandbox fixtures.');
    state.nextId++;
    state.orders.push(created);
    state.operations.push({ identity, fingerprint, result: structuredClone(created) });
    return reply(201, created, { Location: `/orders/${created.id}`, ETag: '"v1"' });
  }
  const parsed = updateInput.safeParse(body);
  if (!parsed.success)
    return fail(422, 'invalid-update', 'Send only an integer quantity from 1 to 100.');
  if (!headers['if-match'])
    return fail(428, 'version-required', 'Send If-Match using the current ETag.');
  if (headers['if-match'] !== `"v${order!.version}"`)
    return fail(412, 'stale-version', 'The order changed. Read the current ETag before retrying.');
  order!.quantity = parsed.data.quantity;
  order!.version++;
  return reply(200, order, { ETag: `"v${order!.version}"` });
}

export type ApiExercise = {
  id: string;
  title: string;
  task: string;
  starter: SandboxRequest;
  hint: string;
};
const alice = { Authorization: 'Bearer demo-alice' };
const json = { ...alice, 'Content-Type': 'application/json' };
export const apiExercises: ApiExercise[] = [
  {
    id: 'read',
    title: 'Read an order',
    task: 'Read Alice’s order-100 with GET. Inspect its body and ETag.',
    starter: { method: 'GET', path: '/orders/order-100', headers: {}, body: '' },
    hint: 'Add Authorization: Bearer demo-alice. This is a public fixture token, not a real credential.',
  },
  {
    id: 'validation',
    title: 'Validate a create request',
    task: 'Create one COURSE order with quantity 2. Fix the invalid input and inspect the 201 response.',
    starter: {
      method: 'POST',
      path: '/orders',
      headers: { ...json, 'Idempotency-Key': 'validation-01' },
      body: '{"sku":"COURSE","quantity":0}',
    },
    hint: 'Quantity must be an integer from 1 to 100. No owner or tenant fields may be submitted.',
  },
  {
    id: 'idempotency',
    title: 'Replay a create operation',
    task: 'Send the same valid create request twice with the same key. Check that it replays one order. Then try changing the payload under that key.',
    starter: {
      method: 'POST',
      path: '/orders',
      headers: { ...json, 'Idempotency-Key': 'repeat-order-01' },
      body: '{"sku":"BOOK","quantity":1}',
    },
    hint: 'The second identical request should include Idempotency-Replayed: true. Reusing its key for a different payload returns 409.',
  },
  {
    id: 'version',
    title: 'Use a current ETag',
    task: 'Update order-100 quantity to 3. Correct the stale If-Match value so one update succeeds.',
    starter: {
      method: 'PATCH',
      path: '/orders/order-100',
      headers: { ...json, 'If-Match': '"v0"' },
      body: '{"quantity":3}',
    },
    hint: 'The initial fixture is version 1, with ETag "v1". After success its version changes, so repeating the old precondition should fail.',
  },
  {
    id: 'authorization',
    title: 'Check object access',
    task: 'As Alice, request Bob’s order-200. Verify that the response does not disclose the order.',
    starter: { method: 'GET', path: '/orders/order-200', headers: alice, body: '' },
    hint: 'This contract returns 404 for absent or inaccessible orders. Bearer demo-bob can read Bob’s fixture; demo-reader is read-only for Alice.',
  },
];

export function checkApiResult(
  exercise: ApiExercise,
  request: SandboxRequest,
  result: SandboxResult,
): { correct: boolean; message: string } {
  const { response, state } = result;
  const body = response.body as Record<string, unknown> | null;
  let correct = false;
  if (exercise.id === 'read')
    correct =
      request.method === 'GET' &&
      request.path === '/orders/order-100' &&
      response.status === 200 &&
      body?.id === 'order-100' &&
      response.headers.ETag === '"v1"';
  if (exercise.id === 'validation')
    correct =
      request.method === 'POST' &&
      response.status === 201 &&
      body?.sku === 'COURSE' &&
      body.quantity === 2 &&
      state.orders.length === 3;
  if (exercise.id === 'idempotency')
    correct =
      request.method === 'POST' &&
      response.status === 201 &&
      response.headers['Idempotency-Replayed'] === 'true' &&
      state.orders.length === 3 &&
      state.operations.length === 1;
  if (exercise.id === 'version')
    correct =
      request.method === 'PATCH' &&
      request.path === '/orders/order-100' &&
      response.status === 200 &&
      body?.quantity === 3 &&
      body.version === 2 &&
      response.headers.ETag === '"v2"';
  if (exercise.id === 'authorization')
    correct =
      request.method === 'GET' &&
      request.path === '/orders/order-200' &&
      Object.entries(request.headers).some(
        ([name, value]) =>
          name.toLowerCase() === 'authorization' && value.trim() === 'Bearer demo-alice',
      ) &&
      response.status === 404 &&
      body?.code === 'order-not-found';
  return {
    correct,
    message: correct
      ? 'Correct sandbox result.'
      : 'Not yet. Inspect the status, headers, body and fixture state, then adjust the request.',
  };
}
