import { describe, expect, it } from 'vitest';
import { createPkce, s256Challenge } from '../examples/api-lab/pkce';
import {
  createOrderService,
  LabHttpError,
  type Principal,
} from '../examples/api-lab/order-service';
import { verifyGithubWebhook } from '../examples/api-lab/webhook';

const actor: Principal = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  scopes: ['orders:read', 'orders:write'],
};

function failsWith(action: () => unknown, status: number, code: string) {
  try {
    action();
    expect.fail('Expected a rejected operation');
  } catch (error) {
    expect(error).toBeInstanceOf(LabHttpError);
    expect(error).toMatchObject({ status, code });
  }
}

describe('PKCE coding exercise', () => {
  it('matches the published RFC 7636 Appendix B S256 vector', () => {
    expect(s256Challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });
  it('rejects invalid verifier lengths and non-ASCII characters', () => {
    for (const invalid of ['short', 'a'.repeat(129), 'ş'.repeat(43)]) {
      expect(() => s256Challenge(invalid)).toThrow();
    }
    const generated = createPkce();
    expect(generated.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generated.challenge).toBe(s256Challenge(generated.verifier));
    expect(generated.method).toBe('S256');
  });
});

describe('order API coding exercise', () => {
  it('reuses one operation result across concurrent callers and equivalent key order', async () => {
    const service = createOrderService();
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        Promise.resolve().then(() =>
          service.create(
            actor,
            i % 2 ? { quantity: 2, sku: 'BOOK' } : { sku: 'BOOK', quantity: 2 },
            'checkout-81',
          ),
        ),
      ),
    );
    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(results.every((r) => r.quantity === 2)).toBe(true);
  });
  it('rejects a changed payload for the same key without changing the order', () => {
    const service = createOrderService();
    const order = service.create(actor, { sku: 'BOOK', quantity: 2 }, 'checkout-81');
    failsWith(
      () => service.create(actor, { sku: 'BOOK', quantity: 3 }, 'checkout-81'),
      409,
      'idempotency-key-conflict',
    );
    expect(service.get(actor, order.id).quantity).toBe(2);
  });
  it('isolates the same operation key between authenticated actors', () => {
    const service = createOrderService();
    const first = service.create(actor, { sku: 'BOOK', quantity: 2 }, 'checkout-81');
    const second = service.create(
      { ...actor, userId: 'user-2' },
      { sku: 'BOOK', quantity: 2 },
      'checkout-81',
    );
    expect(first.id).not.toBe(second.id);
  });
  it('rejects missing authentication and insufficient scopes', () => {
    const service = createOrderService();
    failsWith(
      () => service.create(null, { sku: 'BOOK', quantity: 2 }, 'checkout-81'),
      401,
      'authentication-required',
    );
    failsWith(
      () =>
        service.create(
          { ...actor, scopes: ['orders:read'] },
          { sku: 'BOOK', quantity: 2 },
          'checkout-81',
        ),
      403,
      'scope-required',
    );
  });
  it('conceals cross-tenant and cross-owner reads and updates', () => {
    const service = createOrderService();
    const order = service.create(actor, { sku: 'BOOK', quantity: 2 }, 'checkout-81');
    for (const outsider of [
      { ...actor, tenantId: 'tenant-2' },
      { ...actor, userId: 'user-2' },
    ]) {
      failsWith(() => service.get(outsider, order.id), 404, 'order-not-found');
      failsWith(
        () => service.updateQuantity(outsider, order.id, 1, { quantity: 9 }),
        404,
        'order-not-found',
      );
    }
    expect(service.get(actor, order.id).quantity).toBe(2);
  });
  it('rejects mass assignment and invalid quantities without consuming the operation key', () => {
    const service = createOrderService();
    for (const input of [
      { sku: 'BOOK', quantity: 2, tenantId: 'tenant-2' },
      { sku: 'BOOK', quantity: '2' },
      { sku: 'BOOK', quantity: 101 },
      { sku: 'BOOK', quantity: 1.5 },
    ]) {
      failsWith(() => service.create(actor, input, 'checkout-81'), 400, 'invalid-create-request');
    }
    expect(service.create(actor, { sku: 'BOOK', quantity: 2 }, 'checkout-81').version).toBe(1);
  });
  it('prevents a stale write and preserves the original idempotent response', () => {
    const service = createOrderService();
    const original = service.create(actor, { sku: 'BOOK', quantity: 2 }, 'checkout-81');
    expect(service.updateQuantity(actor, original.id, 1, { quantity: 4 }).version).toBe(2);
    failsWith(
      () => service.updateQuantity(actor, original.id, 1, { quantity: 8 }),
      412,
      'stale-version',
    );
    expect(service.get(actor, original.id)).toMatchObject({ quantity: 4, version: 2 });
    expect(service.create(actor, { sku: 'BOOK', quantity: 2 }, 'checkout-81')).toEqual(original);
  });
  it('does not let callers mutate stored objects through returned references', () => {
    const service = createOrderService();
    const order = service.create(actor, { sku: 'BOOK', quantity: 2 }, 'checkout-81');
    order.tenantId = 'changed';
    expect(service.get(actor, order.id).tenantId).toBe(actor.tenantId);
  });
});

describe('GitHub webhook coding exercise', () => {
  // Public test vector from GitHub's documentation, not an application credential.
  const secret = Buffer.from("It's a Secret to Everybody");
  const signature = 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17';
  it('accepts the documented original-byte signature vector', () => {
    expect(verifyGithubWebhook(Buffer.from('Hello, World!'), signature, secret)).toBe(true);
  });
  it('rejects altered bytes, malformed signatures and an empty secret', () => {
    expect(verifyGithubWebhook(Buffer.from('Hello, World!\n'), signature, secret)).toBe(false);
    for (const invalid of [undefined, 'sha1=abc', 'sha256=zz', 'sha256=']) {
      expect(verifyGithubWebhook(Buffer.from('Hello, World!'), invalid, secret)).toBe(false);
    }
    expect(verifyGithubWebhook(Buffer.from('Hello, World!'), signature, Buffer.alloc(0))).toBe(
      false,
    );
  });
});
