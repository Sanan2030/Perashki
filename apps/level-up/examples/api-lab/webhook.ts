import { createHmac, timingSafeEqual } from 'node:crypto';

/** GitHub's signature format only. Freshness and deduplication are separate. */
export function verifyGithubWebhook(
  originalBody: Uint8Array,
  signature: string | undefined,
  secret: Uint8Array,
): boolean {
  if (!secret.byteLength || !signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(originalBody).digest();
  const received = Buffer.from(signature.slice(7), 'hex');
  return timingSafeEqual(expected, received);
}
