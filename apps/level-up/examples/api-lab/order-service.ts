import { createHash } from 'node:crypto';
import { z } from 'zod';

// A trusted authentication adapter supplies this context. Request JSON must not.
export type Principal = { userId: string; tenantId: string; scopes: string[] };
export type Order = {
  id: string;
  tenantId: string;
  ownerId: string;
  sku: string;
  quantity: number;
  version: number;
};

export class LabHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
    this.name = 'LabHttpError';
  }
}

const createInput = z
  .object({ sku: z.enum(['BOOK', 'COURSE']), quantity: z.number().int().min(1).max(100) })
  .strict();
const updateInput = z.object({ quantity: z.number().int().min(1).max(100) }).strict();
const keyInput = z.string().regex(/^[A-Za-z0-9_-]{8,128}$/);

function authorize(principal: Principal | null, scope: string): Principal {
  if (!principal) throw new LabHttpError(401, 'authentication-required');
  if (!principal.scopes.includes(scope)) throw new LabHttpError(403, 'scope-required');
  return principal;
}

/**
 * Single-process teaching model, intentionally synchronous and in memory.
 * It does not provide durable or cross-process transaction guarantees.
 */
export function createOrderService() {
  const orders = new Map<string, Order>();
  const operations = new Map<string, { fingerprint: string; result: Order }>();
  let nextId = 1;

  function ownedOrder(actor: Principal, id: string): Order {
    const order = orders.get(id);
    if (!order || order.tenantId !== actor.tenantId || order.ownerId !== actor.userId) {
      throw new LabHttpError(404, 'order-not-found');
    }
    return order;
  }

  return {
    create(principal: Principal | null, input: unknown, key: string): Order {
      const actor = authorize(principal, 'orders:write');
      const parsed = createInput.safeParse(input);
      if (!parsed.success || !keyInput.safeParse(key).success) {
        throw new LabHttpError(400, 'invalid-create-request');
      }
      const identity = JSON.stringify([actor.tenantId, actor.userId, 'create-order', key]);
      const fingerprint = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
      const previous = operations.get(identity);
      if (previous) {
        if (previous.fingerprint !== fingerprint) {
          throw new LabHttpError(409, 'idempotency-key-conflict');
        }
        return structuredClone(previous.result);
      }
      const order: Order = {
        id: `order-${nextId++}`,
        tenantId: actor.tenantId,
        ownerId: actor.userId,
        ...parsed.data,
        version: 1,
      };
      // No awaits occur here. A real deployment needs a durable atomic boundary.
      orders.set(order.id, order);
      operations.set(identity, { fingerprint, result: structuredClone(order) });
      return structuredClone(order);
    },
    get(principal: Principal | null, id: string): Order {
      const actor = authorize(principal, 'orders:read');
      return structuredClone(ownedOrder(actor, id));
    },
    updateQuantity(
      principal: Principal | null,
      id: string,
      expectedVersion: number,
      input: unknown,
    ): Order {
      const actor = authorize(principal, 'orders:write');
      const order = ownedOrder(actor, id);
      const parsed = updateInput.safeParse(input);
      if (!parsed.success || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
        throw new LabHttpError(400, 'invalid-update-request');
      }
      if (order.version !== expectedVersion) throw new LabHttpError(412, 'stale-version');
      const updated = { ...order, quantity: parsed.data.quantity, version: order.version + 1 };
      orders.set(id, updated);
      return structuredClone(updated);
    },
  };
}
