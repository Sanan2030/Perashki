# API coding lab

Read the English lessons `oauth-pkce-oidc`, `integration-basics`,
`api-idempotency-concurrency` and `secure-api-coding` alongside these exercises.
From the repository root, install the existing project dependencies with `npm ci`,
then run:

```sh
npm test -- tests/api-lab.test.ts
```

The lab has no HTTP listener and makes no network requests. It uses synthetic
orders and trusted actor objects supplied by tests. It does not change platform
authentication or introduce a login requirement.

- `pkce.ts` generates a verifier and S256 challenge. Trace the RFC 7636 Appendix B
  test vector; retain verifiers in the initiating transaction in a real client.
  Use a maintained OAuth/OIDC library for the complete flow.
- `webhook.ts` verifies GitHub's HMAC signature over original body bytes. It does
  not implement event authorization, freshness, durable receipt or deduplication.
  Supply a protected, high-entropy secret. A signature authenticates bytes and can
  still be replayed.
- `order-service.ts` illustrates strict input validation, explicit scopes,
  tenant/object authorization, scoped idempotency and optimistic version checks.
  Its synchronous, in-memory maps work only as a single-process teaching model.
  Data disappears on restart. It is not a production payment or authentication
  service and does not implement multi-instance concurrency or recovery.

Try these changes before reading the tests:

1. Return 409 when a key is reused with a different validated payload. Keep an
   identical retry's original result even after the order is subsequently edited.
2. Reject a cross-tenant or cross-owner read/update without disclosing the object.
3. Enforce version checks so a stale edit returns 412 and leaves state unchanged.
4. Reject an injected `tenantId`, a string quantity and an out-of-range quantity.
5. Explain which transaction and uniqueness constraints would replace the maps.
   Describe lost-response recovery before proposing a real payment integration.

An HTTP adapter would validate real credentials, construct trusted actor context,
enforce body limits, map safe errors/status/challenges, parse ETags, apply the
browser CSRF policy where relevant and provide durable operations. These adapter
responsibilities are deliberately outside the lab.
