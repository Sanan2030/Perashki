import { createHash, randomBytes } from 'node:crypto';

/** RFC 7636 S256 transformation; not a complete OAuth client. */
export function s256Challenge(verifier: string): string {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) {
    throw new Error('A PKCE verifier must contain 43–128 unreserved ASCII characters.');
  }
  return createHash('sha256').update(verifier, 'ascii').digest('base64url');
}

export function createPkce() {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: s256Challenge(verifier), method: 'S256' as const };
}
