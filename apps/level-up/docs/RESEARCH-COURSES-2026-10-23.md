# Seven course areas: selected reading and authoring — 2026-10-23

The user selected BA foundations, product ownership, advanced databases, messaging/caching, software testing, data engineering and cloud/security. This expansion publishes 28 complete English lessons: 12 existing outlines expanded under stable IDs and 16 new topics. It adds 112 independently written questions, four per lesson. These are educational topic exercises, not official certification questions or a newly verified exam syllabus.

## Existing outline expansions

BA: `elicitation`, `bpmn-process`, `uml-models`, `requirements-documents`, `traceability`, `uat`, `scope-change`.

PO: `jtbd-research`, `story-mapping`, `product-strategy`, `okrs`, `pricing-gtm`.

BA concepts reuse selected passages of the supplied BABOK Guide v3: elicitation §§4.1–4.5, information management §3.4, governance §3.3, trace/change/approval §§5.1–5.5, specification/verification/validation §§7.1–7.3 and relevant techniques including acceptance criteria, interviews, observation, process modelling, use cases and workshops. Earlier selected reading is recorded in [the BABOK audit](reading-audits/babok-reading-audit.md). BRD/FRD/SRS are original examples of organizational views, not mandatory BABOK templates.

PO material uses the previously read Scrum Guide 2020, EBM Guide 2024 and selected chapters of the supplied Professional Product Owner book. The story-mapping passage on pp. 232–236 was revisited. Current Scrum terminology takes precedence over the older book. OKR templates, pricing formulas and numerical targets are original supplemental instruction, not asserted Scrum requirements. Source prose, book figures and uploaded PDFs are not distributed.

## New online reading

Canonical URLs, dates and read statuses are in `data/sources.json`. Thirty-one sources were added after actual text was available and selected material reviewed.

| Sources                                                                                        | Selected scope                                                                                                   | Lesson use                                                 |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| PostgreSQL 18: EXPLAIN, transaction isolation, explicit locking, CREATE INDEX                  | Estimates, execution, loops/buffers, snapshots, serialization failures, deadlocks, concurrent-build restrictions | Query tuning, invariants and safe migration                |
| Kafka 4.1 Design                                                                               | Partition ordering, groups/positions, delivery semantics and transaction boundaries                              | Offsets, replay and external-effect limits                 |
| RabbitMQ acknowledgements/confirms and DLX                                                     | Separate confirmation directions, channel tags, requeue loops, policies, routing and failure safety              | Durable effects and owned failure recovery                 |
| Redis official repository EXPIRE; Microsoft Cache-Aside                                        | Key lifetime, overwrite behavior, source/cache sequence and consistency limits                                   | Freshness, refill races, stampede and outage design        |
| Playwright best practices; Postman post-response scripting; Ham Vocke’s Practical Test Pyramid | Isolation, locators, assertions, doubles, integration and contract evidence                                      | Testing boundaries and reproducible examples               |
| dbt data tests and ref                                                                         | Failing-row assertions, built-in tests, relation resolution and dependency graph                                 | Complementary quality checks and lineage                   |
| Airflow DAGs and best practices                                                                | Dependencies, interval-based work, restartable tasks, UPSERT and durable outputs                                 | Retry-safe orchestration and controlled replay             |
| AWS ETL/ELT; Microsoft Fabric warehousing                                                      | Transformation placement and analytical warehouse context                                                        | Source, staging and publication contracts                  |
| AWS IAM, VPC and ALB overviews                                                                 | Temporary/scoped identity, networking components and HTTP routing                                                | Separate identity/network/application boundaries           |
| AWS Cost Optimization overview and cost allocation tags                                        | Cost-aware design overview, tag activation and allocation                                                        | Unit costs, shared costs and optimization trade-offs       |
| OWASP threat modelling, SSRF prevention and secrets management                                 | Assets/flows, destination/DNS/redirect/egress controls, lifecycle and audit                                      | Layered defensive design and recovery                      |
| GOV.UK interviews; Christensen Institute JTBD; Agile Alliance story mapping                    | Neutral research, desired progress/circumstances and coherent journey slicing                                    | Practical discovery and product choices                    |
| OMG BPMN 2.0.2 and UML 2.5.1 specification indexes                                             | Version identities and normative-reference links only                                                            | Orientation; no full normative-specification reading claim |

## Access and scope limits

The Redis public page returned HTTP 200 with only a tiny non-document body. Actual EXPIRE text was read from the official redis/docs repository instead. A guessed client-caching source path was unavailable. Pact and an obsolete dbt ref path returned HTTP errors; no teaching is attributed to their unavailable contents. The canonical dbt ref reference was subsequently read. A legacy Azure warehouse URL redirected to a generic database page and was excluded; the specific Fabric and AWS pages supplied the actual material. The PostgreSQL indexes overview was only a contents page and is not registered as substantive reading.

OMG index access is not represented as reading the full BPMN or UML normative PDFs. Rendered diagrams are simplified original teaching models. Version-specific behavior is labeled, especially PostgreSQL 18, Kafka 4.1, dbt syntax and Airflow stable documentation. No newest-version, formal-notation-conformance or official-exam coverage claim is inferred.

## Accuracy checks and execution boundary

- EXPLAIN estimates are not milliseconds; EXPLAIN ANALYZE executes. Ordinary rollback is not assumed to reverse external side effects.
- Isolation and atomicity differ. Serializable and deadlock recovery can require whole-transaction retries; external effects need their own replay contract.
- Concurrent index construction is not lock-free and has transaction/failure restrictions. Schema rollback does not automatically restore deleted data.
- Kafka ordering is per partition. Publisher confirms, consumer acknowledgements and external outcomes are distinct. No broker option silently makes arbitrary remote effects exactly once.
- TTL is entry lifetime, not a complete freshness proof. In-flight refill races and fallback capacity remain design concerns.
- Mocks, schemas and passing tests establish bounded evidence. Browser isolation does not reset shared server state.
- dbt relationship tests do not replace required-key null checks or source completeness. A dependency graph may omit external consumers.
- Airflow retries do not make append writes idempotent. Interval identity, durable outputs, validation and publication are explicit.
- IAM, network reachability, TLS and object authorization are separate boundaries. Budget alerts are not universal hard caps.
- SSRF prevention needs destination/connection and egress controls, not just URL substrings. Secret deletion is not revocation; signing/encryption key retirement has different consequences.
- Synthetic pricing: 50 price minus 20 variable cost gives 30 contribution, and 60000 fixed cost needs 2000 customer-months under the simplified model. At variable cost 35, contribution is 15 and simplified break-even is 4000. Cloud examples use invented amounts, not current provider prices.

No production database migration, Kafka/RabbitMQ/Redis service, dbt adapter, Airflow scheduler, AWS infrastructure, SSRF probe or key rotation is executed by this work. SQL, Postman and configuration snippets are explicit learning examples, not evidence of those systems having been deployed. The Playwright example uses the existing local application interface.

The catalog now contains 114 topics, 89 complete English lessons and 25 outlines across 34 modules. New career modules separate mid-level foundations from lead-level operations. Existing IDs, notes, bookmarks, progress storage and certification mock gates are preserved. Five subject filters expose the new technical collections. Thirty dictionary entries provide real English/Azerbaijani contextual explanations; fifteen glossary entries link to lessons. Required legacy AZ metadata/question slots retain English compatibility values; complete AZ translations are not claimed.

Local verification passed: content validation, production build, TypeScript, ESLint, Prettier, all 57 application unit tests and all 46 Chromium browser tests. The browser suite rendered every complete English lesson with its diagram and checked new collections, inline explanations, focused practice, offline terminology, mobile accessibility and existing progress/navigation flows. Career module levels and lesson prerequisite cycles were also checked. Mobile collection and BA lesson screenshots were inspected. Local checks do not establish that a Vercel deployment has completed.
