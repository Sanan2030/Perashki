# Independent library and browser labs

Engineering/data additions are library content, not career or certification curriculum. `placement: "library"` on both lesson and module is authoritative. An omitted placement keeps the legacy learning behavior. Forty existing lesson IDs are now library-only; 17 collections group them without adding onboarding targets. Core SQL/API/integration metadata moved from `ba-technical` to a separate library collection; the core module retains its business-analysis subjects. The source file and lesson IDs remain stable.

`generateRoadmap` excludes library modules and lessons before ordering or estimates. The dashboard uses learning-only catalog views and excludes any historical attempt containing an independent question from learning statistics, without deleting the attempt. Generic track practice excludes library questions; focused practice still uses their existing question IDs. Legacy track identifiers are preserved internally for stored-session compatibility, while cards, lesson badges and focused practice use independent subject labels. Existing localStorage version and export/import format remain unchanged.

## SQL execution

`scripts/prepare-labs.mjs` copies the installed sql.js browser build, matching WASM and MIT license to ignored `public/labs/vendor/`. It runs on install, development and build. There is no external CDN or remote database. The classic worker loads same-origin assets and initializes a fresh in-memory SQLite database for every run.

`data/labs/sql-fixture.json` contains five customers, seven cleaned orders and eight item rows from the published synthetic lab. Six orders are paid, totaling 16,500 cents. The intentionally wrong header-to-item sum is 17,500. Monthly paid amounts are 4,000, 6,000 and 6,500. First-paid month-one retention is 50%, 100% and NULL/unobserved for January, February and March respectively, with completeness through March.

Only one SELECT/WITH/EXPLAIN statement is accepted. A keyword screen provides a friendly message, while SQLite `PRAGMA query_only = ON` is the write barrier, including CTE-wrapped writes. The worker sets a 32 MiB SQLite heap limit and accepts at most 8,000 query characters, 30 result columns, 200 rows and bounded cell contents. A loading deadline is separate from the three-second execution deadline. Cancelling, resetting or leaving the lesson terminates the worker. This keeps expensive execution off the UI thread; it is not a formal memory-security guarantee for arbitrary adversarial WebAssembly workloads.

The checker compares named columns and values as a multiset of rows, accepting equivalent result ordering. Duplicate columns, non-finite values and truncated output do not pass. A matching fixture result is not proof that the query generalizes to every dataset. SQL is not evaluated as JavaScript or sent to the server. SQLite dates, plans and concurrency behavior must not be represented as PostgreSQL execution evidence.

SQL labs: `sql-basics`, `data-analysis-grain-quality`, `data-sql-windows-cohorts`, `data-excel-powerbi-models`, `data-dashboards-storytelling`, `data-etl-warehouse`, `data-dbt-quality-lineage`.

## HTTP service simulation

The API editor sends a real POST to `/api/labs/http` containing an envelope of simulated method/path/headers/body and bounded synthetic fixture state. The outer HTTP transport normally returns 200 with the simulated response and updated state. The UI explicitly labels the displayed status as the sandbox service response, not the transport status. Transport failures are displayed separately.

The simulator supports GET/POST/PATCH/DELETE on relative `/orders` paths, strict JSON validation, fixture bearer identities, scoped create-operation keys, payload conflicts, ETag preconditions and bodyless deletes. It uses no outgoing fetch, database, secret, cookie session or process-global state. Each tab supplies its own state, which survives successive requests in that component and resets on reload or reset. State is caller-owned teaching data, not trusted security context for any real resource.

The route streams and bounds its envelope to 32 KB, validates its schema and returns no-store responses. Order/operation arrays and individual fields are bounded. Public demo identities are intentionally simple strings; no JWT signature, OAuth flow or live identity system is implemented. The examples establish the simulator’s sequential behavior, not durable idempotency, real tenant isolation, network concurrency or distributed transaction guarantees. The contract panel makes this scope visible to learners.

API labs: `rest-apis`, `api-idempotency-concurrency`, `api-contracts-evolution`, `secure-api-coding`, `jwt-validation-authorization`, `testing-postman-apis`, `testing-strategy-contracts`. Their default exercises cover read/authentication, validation, idempotency, version checks and object access. JWT lessons use the object-access exercise; the lab does not verify JWT signatures.

## Verification

Unit tests run the actual SQLite worker logic with the installed WASM engine, including joins, windows, read-only enforcement, result caps and comparison behavior. HTTP model and route tests cover replay/conflicts, identity/scope/object boundaries, strict input, versions, independent caller state and envelope limits. Roadmap tests cover every track and preserve old independent completion records while excluding them from BA progress.

Browser tests exercise real same-origin SQL assets and HTTP transport, query timeout/recovery, result feedback, per-tab state isolation, independent library/path separation, preserved notes/bookmarks, keyboard access, mobile width and automated accessibility in both themes. The original API and Python labs remain available as supplementary source exercises.

Local verification on 2026-10-23 passed: 68 unit tests, all 50 Chromium browser tests (including rendering all 89 published lessons), content validation, production build, TypeScript, ESLint and formatting checks. Desktop and mobile lab screenshots were inspected. This verifies the local production build; a Vercel deployment was not inspected.
