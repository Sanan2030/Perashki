# Mərhələ

A bilingual Azerbaijani/English learning workspace for IT Business Analysts and Product Owners, with career roadmaps, original certification practice, and an English–Azerbaijani terminology helper. Both `/az` and `/en` are public; the rounded AZ/EN header switch preserves the current page, filters and anchor. Professional terms remain English in either language.

**Tracks:** BA Junior → Mid → Lead; PO Junior → Mid → Senior/Lead; ECBA, CCBA, CBAP, PSPO I, PSPO II, and PSPO III.

## Run locally

Use **Node.js 24 LTS** and npm. The application requires Node.js 22 or newer.

```sh
git clone https://github.com/Sanan2030/level_up.git
cd level_up
npm ci
npm run dev
```

Open the address printed by Next.js. The root route uses the saved language preference and defaults to English. No database, account, paid API, or secret is required. The curated terminology dictionary works offline; general-word fallback depends on external public services.

For an existing checkout, use `npm ci` to reproduce the committed lockfile. Use `npm install` only when intentionally updating dependencies; commit the resulting `package-lock.json` with that change.

To run the production build locally:

```sh
npm run build
npm start
```

The build validates content before generating the application. To set canonical URLs, sitemap URLs, and social metadata, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` to your site's origin. Its fallback is `https://level-up.example`, a placeholder that must be replaced before a public launch. This is a public setting, not a secret.

## What is included

- The supplied Mərhələ design with a landing-page roadmap builder, horizontal navigation, a personal dashboard at `/[locale]/dashboard`, and a responsive Azerbaijani/English application shell, light/dark appearance, keyboard controls, and reduced-motion support.
- Three-step onboarding with a current level, target level or certification, and daily study time. Roadmaps show the learning gap, prerequisite order, time estimates, and target-level skills. Changing tracks preserves progress.
- Six career competency profiles with expectations, hard and soft skills, tools, deliverables, interview examples, and self-assessment checklists.
- A searchable lesson library and glossary, statically generated MDX lessons, Mermaid diagrams, an interactive learning stepper, notes, bookmarks, and lesson completion.
- 678 original questions (106 PSPO I, 118 PSPO II, 40 PSPO III written reflections, 64 ECBA, 60 each for CCBA/CBAP, 199 BA technical/topic items and 31 PO items), domain drills, mistake review, spaced repetition, shuffled answers, flagged questions, persisted sessions, and attempt history. Selected-response, ordering, matching, and written-reflection formats have separate handling.
- Practice sessions of 5–100 questions with difficulty, response-format and unseen-question filters; weighted 50-question ECBA mocks are enabled by verified configuration and sufficient domain coverage. Other full mocks retain their verification and bank-size gates.
- A top-level **Translate** tool supports words, acronyms and phrases such as _onboarding_, _Monte Carlo forecast_, _CFD_ and _Definition of Done_. Its 285 curated terms have English definitions, Azerbaijani meanings and explanations, and examples in both languages. Chart names, common spelling variants and copied Markdown emphasis resolve locally. Unknown terms use optional public dictionary/machine-translation services with visible limitations. See the [dictionary coverage review](docs/DICTIONARY-COVERAGE-2026-11-06.md).
- A five-group, 28-focus-area Professional Scrum study guide links concepts to available lessons and identifies the coaching/mentoring/teaching coverage gaps.
- A dashboard with measured lesson progress, activity streak, milestones, next steps, and practice history charts.
- Validated JSON progress export/import, typed storage adapters, Zod content validation, Vitest logic tests, and GitHub Actions checks.

The curriculum deliberately distinguishes **complete lessons** from **planned outlines**. There are 115 topics: 90 complete lessons in both languages and 25 detailed outlines. Complete lessons cover BA/PO practice, architecture/APIs, DevOps, data analysis, advanced databases, messaging/caching, software testing, data engineering, cloud/security and certification preparation. The technical collection covers HTTP contracts, access/refresh tokens, OAuth/PKCE/OIDC, JWT/JWKS, browser/BFF security, concurrency/idempotency, outbox/webhooks, API evolution, sagas, resilience and a tested TypeScript lab. Outlines document the remaining topic sequence and cannot be counted as completed lessons. Learning-path estimates include their planned outlines and exclude independent library lessons; they are guidance rather than a guarantee.

## Certification accuracy

The PSPO II update of 1 November 2026 adds four complete AZ/EN lessons and 24 original bilingual questions (119 total topics, 94 complete lessons and 706 questions). In **Practice → PSPO II**, open Kwestio, ScrumPrep, ExamDeck or Product Owner Open, with free/paid scope and matching lessons. Vendor tests run externally; local practice results remain in this app. The new lessons cover backlog economics, portfolio/retirement, business models and evidence uncertainty. See [the provider review and coverage map](docs/RESEARCH-PSPO-PRACTICE-2026-11-01.md) for actual reading scope and access limitations.

The original question bank is independently written educational practice. A separate collection now contains **578 attributed provider questions** imported after the user confirmed use and republication permission: Kwestio PSPO I (361), Kwestio PSPO II (160), ExamDeck public PSPO II samples (45) and the Management Plaza PSPO I demo (12). In **Practice → PSPO I / PSPO II → Tests in this app**, start a local test or study the whole source bank with explanations. Source English and answer keys are retained, with AZ translations and protected terminology; provider banks remain separate from our own questions. See [import scope, translation review and native test behavior](docs/PSPO-IMPORTED-TESTS-2026-11-02.md).

These are **not official exam questions**. The app is not affiliated with IIBA or Scrum.org. It does not reproduce BABOK text, book text, official assessment questions, or exam dumps. Uploaded PDFs are not distributed with the app. ScrumPrep questions and Scrum.org Open questions were inaccessible and have not been imported.

Exam details live in `data/exams/`, with source links, verification status, and a verification date. Fields marked `TODO: VERIFY` or `needs-verification` must be checked against the linked official sources before being presented as current exam facts. A missing or unpublished pass threshold remains `null`; it is never guessed. Certification eligibility must be checked with the awarding organization.

ECBA, CCBA, and CBAP formats, question counts, durations, and blueprint weights were verified against official IIBA pages/documents on 2026-10-20; the CCBA/CBAP page facts were reconfirmed on 2026-10-21. The current English ECBA uses the nine-domain blueprint. Numerical passing thresholds were not confirmed and remain null. Scrum.org assessment pages returned a website challenge, so PSPO exam settings remain unverified. See [exam provenance](data/exams/SOURCES.md) and [teaching provenance](docs/CONTENT-SOURCES.md).

Full-length mock mode is enabled only when the format is verified, required configuration is present, and the bank has enough unique questions with the required domain coverage. A small practice bank is not represented as a full official-format mock. Written answers use a self-review rubric and are excluded from automatic scoring. Pausing is a learning convenience, not a claim about official exam rules. Readiness and practice results do not predict an official exam result.

## Project structure

```text
app/                         App Router pages, metadata, sitemap
components/                  App shell, learning views, lessons, quizzes, charts
content/{ba,po,certs,certifications}/        Locale-specific MDX lessons and outlines
data/modules.json            Roadmap modules and prerequisite relationships
data/lessons.json             Stable lesson metadata
data/competencies/           Career-level expectations and assessment checklists
data/glossary.json            Bilingual terms and related lessons
data/questions/              Original question banks
data/exams/                  Editable exam settings and source provenance
data/sources.json            Read/uploaded and unavailable source register
data/dictionary.json         Curated English–Azerbaijani explanations and examples
data/scrum-competencies.json  Five groups and 28 focus areas
lib/                         Schemas, content loading, roadmap, storage, quiz logic
scripts/                     Build-time content validation
tests/                       Logic and content validation tests
```

Next.js App Router and TypeScript provide the application foundation. Tailwind and shared CSS styles provide the design system. MDX is compiled from trusted repository content; Zod validates metadata and JSON. Mermaid, Framer Motion, and Recharts supply diagrams, motion, and charts. Heavy visual components load separately from the main interface.

See [Content authoring](docs/CONTENT_AUTHORING.md) to add or translate lessons through GitHub without changing UI code.

## Progress and privacy

The `StorageAdapter` interface in `lib/storage.ts` is asynchronous, so a database-backed implementation can replace the local adapter later. Stored progress has a schema version; the parser validates data and supports the defined legacy migration. Lesson IDs stay the same across languages, so translation changes do not erase completion.

Progress, quiz sessions, notes, and bookmarks currently live **only in this browser's localStorage**. They do not automatically synchronize between devices or browsers. Clearing browser data, using private browsing, or reaching the storage quota can lose or prevent persistence. Export progress regularly from Settings; import previews require confirmation before replacing current progress. Imports are validated and limited to 5 MB. Keep exported files private because they include your notes and written responses.

There is no authentication, shared-user database, or analytics service. Do not store confidential client or employer information in lesson notes. Database sync, accounts, and conflict resolution would require a separate integration and deployment configuration.

## Development checks

```sh
npm run validate:content
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
npm run test:e2e
```

`npm run test:e2e` uses Playwright with a production server on port 3100. Install its browser once with `npx playwright install chromium`; to use an existing browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Tests cover functional flows and automated WCAG A/AA checks.

`npm run test:watch` runs Vitest while developing. `npm run format` applies Prettier. The CI workflow runs the checks above on pushes and pull requests; a green run applies only to the revision it tested. For UI changes, also inspect both languages, both themes, the bilingual Translate results, a narrow viewport, keyboard navigation, and the affected functional flow. Source verification is a separate editorial responsibility; passing a schema check does not establish that an exam fact is current.

## Publish through GitHub and Vercel

1. **Use the existing repository.** This project belongs to `Sanan2030/level_up`. If reproducing it in a new GitHub repository, create an empty repository first, then configure its HTTPS remote. Do not overwrite an existing remote or remote history without reviewing it.
2. **Commit and push the project.** After validation, push the intended production branch. The normal commands for this repository are:

   ```sh
   git add .
   git commit -m "Expand BA and PO learning platform"
   git push -u origin main
   ```

   If working on another local branch, review and merge it into `main` first. Subsequent changes should normally use pull requests.

3. **Import into Vercel.** Sign in to Vercel, choose **Add New → Project**, connect your GitHub account, and import `Sanan2030/level_up`. Grant access to that repository when prompted.
4. **Review the build settings.** Select Next.js, keep the repository root as the root directory, use Node.js 24.x when available, use `npm ci` for installation, and `npm run build` for the build command. Keep Next.js's default output settings.
5. **Set the public origin.** Add `NEXT_PUBLIC_SITE_URL` using the canonical HTTPS production origin. No database connection string or API secret is needed for the initial version. Redeploy after changing build-time environment variables.
6. **Set production and preview branches.** Confirm **Settings → Git → Production Branch** is `main`. With the Git integration enabled, pushes to `main` create production deployments; pull requests and other branches receive preview deployments. Review the environment-variable scopes for Production and Preview separately. Preview URLs are for checking changes before merging.
7. **Deploy and check behavior.** Trigger the first deployment, inspect build logs, then verify `/az` and `/en`, a complete lesson, onboarding, a quiz, and export/import. Check browser persistence on the deployed origin; data from another origin does not transfer automatically.
8. **Optional custom domain.** In **Settings → Domains**, add your domain, apply the DNS records Vercel provides, and wait for DNS and HTTPS verification. Set `NEXT_PUBLIC_SITE_URL` to that canonical domain and redeploy. Confirm redirects, canonical links, sitemap, and social metadata.

This guide describes deployment; pushing Git commits alone does not create a Vercel project or prove a deployment succeeded. Verify certification settings and expand outline content before representing the site as a complete exam-preparation course.

## Supplied teaching sources

The curriculum uses selected sections of the user-supplied BABOK Guide v3 (IIBA, 2015), Scrum Guide (November 2020), The Kanban Guide for Scrum Teams (January 2021), Evidence-Based Management Guide (2024), _The Professional Product Owner_ (McGreal & Jocham, 2018), and pasted official Professional Scrum Competencies text. Current guides take precedence over older book terminology. This is selected-section reading, not a claim that every page of both books was read.

There are 476 explicitly source-tagged questions. New lessons and questions cite source sections. Existing question and option IDs remain stable for saved attempts. The source register distinguishes read uploads/pages from inaccessible links. Read [the seven-course research](docs/RESEARCH-COURSES-2026-10-23.md), [the DevOps and data analysis research](docs/RESEARCH-2026-10-23.md), [the technical and supplementary PSPO research](docs/RESEARCH-2026-10-22.md), [the content audit](docs/CONTENT-SOURCES.md), [research findings and limitations](docs/RESEARCH-2026-10-21.md), and [selected reading records](docs/reading-audits/babok-reading-audit.md).

One public community preparation README was read and assessed separately. First-hand candidate exam-result reports could not be read through the current network restrictions. No candidate-review consensus, pass-rate claims or real exam questions were invented. PSPO exam formats remain unverified even though the practice banks are larger.

## Translate

Open **Translate** in the header and enter an English word or short phrase, or select text in a lesson before opening it. Curated entries are available immediately with contextual explanations in English and Azerbaijani. General English results use Free Dictionary API, an exact-match Datamuse definition fallback, and MyMemory and are labeled as machine translated; a provider outage, missing definition or quota limit produces an honest unavailable state.

`GET /api/translate?q=...` accepts short text only, uses fixed upstream hosts, validates responses, applies timeouts, bounds its cache and requires no credentials. Only explicit unknown-term lookups contact these services. Tests mock provider success/failure. A live check on 2026-10-22 confirmed Datamuse definitions and MyMemory translation respond successfully; the primary dictionary returned HTTP 403 in this cloud environment. External services may still be unavailable or quota-limited. The original PDFs are not bundled or made downloadable.

Both languages share stable lesson and question IDs, progress, notes, bookmarks and saved attempts. All 115 topics have matching AZ/EN MDX files, including the Docker/Kubernetes/Vault masterclass. All 682 practice questions have bilingual prompts and explanations. Site copy is stored as reviewed static translations; the optional unknown-word Translate service is separate from interface and lesson localization. See [translation review rules](docs/TRANSLATION_REVIEW.md).

## Technical lessons and coding lab

In **Lesson library → Subject**, choose **Architecture, coding & APIs**, **DevOps**, **Data analysis** or **PSPO preparation**. Direct collection links use `?subject=technical`, `?subject=devops`, `?subject=data` or `?subject=pspo` on `/en/lessons`. Subject, track, publication status, search and bookmark filters compose. Technical lessons are independent library collections, outside all BA/PO and certification learning paths. Existing lesson IDs, notes and completion records remain stable.

The source-backed [API coding lab](examples/api-lab/README.md) includes strict TypeScript/Zod order validation, tenant/object permissions, scoped operation deduplication, version preconditions, PKCE S256 and GitHub webhook HMAC verification. Run `npm test -- tests/api-lab.test.ts`. It has no HTTP listener or external calls and is intentionally an in-memory teaching model, not production authentication, payment processing or distributed persistence.

The added PSPO material applies the supplied Scrum/EBM/book sources to mid-Sprint changes, outcome experiments, feature flags and API-platform value. IETF/OWASP/OpenAPI/Microsoft are primary technical sources; GOV.UK service guidance and the Pete Hodgson feature-toggle article provide explicitly supplementary product/engineering context. They do not define an official PSPO syllabus.

## DevOps and data analysis

Four additional BA career modules contain six DevOps lessons (Linux/Git/network diagnosis, Docker, CI/CD, Kubernetes, Terraform, SRE/incidents) and six new data-analysis lessons (metric grain/quality, advanced SQL/cohorts, Python/pandas, Excel/Power BI, experiments/statistics, dashboards). The existing `sql-basics` outline is now a complete lesson, bringing the data collection to seven lessons. Each lesson includes a diagram, worked example, decision interaction, exercise/solution and four explained original practice questions. The new 52 items are topic practice, not DevOps or data certification exam questions.

The [data analysis lab](examples/data-analysis-lab/README.md) runs synthetic CSV cleaning, SQLite joins/windows/cohorts and a limited A/B arithmetic example with only Python's standard library:

```sh
python3 examples/data-analysis-lab/analysis.py
python3 -m unittest discover -s examples/data-analysis-lab -p 'test_*.py' -v
```

An optional pandas implementation validates merge cardinality and independently reconciles aggregates with SQL. pandas is not an application dependency. The lab runs locally and makes no external calls; Excel/Power BI examples are modeling exercises, and DevOps snippets do not provision infrastructure or deploy this application. See the [selected-source research note](docs/RESEARCH-2026-10-23.md) for official documentation and verification limits.

## BA/PO practice and five additional technical collections

Twelve stable outlines are now complete: elicitation, BPMN-style process modelling, UML view selection, BRD/FRD/SRS, traceability, UAT, scope changes, JTBD, story mapping, product strategy, OKRs and pricing/go-to-market. Filter the library by BA or PO track to find them.

Sixteen new lessons cover query plans/indexes, transaction isolation/locks/deadlocks, safe migrations, Kafka, RabbitMQ/DLQ, Redis/cache invalidation, testing strategy/contracts, Postman, Playwright, ETL/ELT/warehouses, dbt, Airflow, IAM/VPC/load balancing, cloud costs, threat modelling/SSRF and secrets/key rotation. In **Lesson library → Subject**, choose **Advanced databases**, **Messaging & caching**, **Software testing**, **Data engineering** or **Cloud & security**. Direct subject values are `databases`, `messaging`, `testing`, `data-engineering` and `cloud-security`.

Each of these 28 complete lessons has eleven sections, an original diagram, worked scenario, decision interaction, exercise/solution and four explained original questions. These technical modules are independent library collections; existing progress IDs and exam settings are preserved. The [reading record](docs/RESEARCH-COURSES-2026-10-23.md) identifies source scope, inaccessible requests and execution limits. Teaching snippets do not provision infrastructure, migrate a real database or rotate production credentials.

## Independent lessons and in-browser labs

Forty-one engineering/data lessons live in **Lessons → Track → Independent lessons** and the existing Subject collections. They are excluded from every BA/PO/certification roadmap, its estimates, next-lesson recommendation and learning-dashboard progress. Normal BA practice excludes their questions; lesson-focused practice remains available from each independent lesson. Existing completions, notes, bookmarks and saved attempts remain stored. Legacy internal track IDs remain only for saved-question/session compatibility; the interface labels independent topics by subject.

Learning content has 74 topics (49 complete, 25 outlines) in 18 modules; the independent library has 41 complete lessons in 17 collections. The total catalog contains 115 topics and 682 original questions.

Seven SQL lessons and seven API/testing lessons now include an inline **Open practical lab** link. SQL uses sql.js/SQLite in a disposable browser worker on the synthetic orders fixture. Six exercises cover paid revenue, non-buyers, join grain, monthly totals, window functions and observed cohort retention. **Run SQL** executes the query; **Check SQL result** compares column names and row values, accepting equivalent row/column ordering. A match is evidence for this fixture, not a proof of a general algorithm. Only one read query is accepted, SQLite query_only enforces the data boundary, the SQLite heap and results are bounded and a query worker is terminated after three seconds of execution. SQLite syntax/plans differ from PostgreSQL. SQL text is not sent to a server.

The API lab sends a bounded same-origin request to `/api/labs/http`, carrying a simulated `/orders` request and caller-owned synthetic state. It displays the simulated service status, headers, JSON body and exercise checks. The transport status and simulated service status are separate. No external URL is fetched, no real account or secret is used and no global server session or database is maintained. Each tab can create, replay, update or delete its own fixtures; reset/reload starts fresh. Demo authentication, authorization, idempotency and ETag examples are teaching contracts, not production security or distributed-transaction guarantees.

`npm ci` prepares the MIT-licensed sql.js browser JS/WASM and license under ignored `public/labs/vendor/`. Dev/build also run `npm run prepare:labs`, so ignored assets are reproduced on Vercel and fresh checkouts. There is no CDN dependency or additional environment variable for the labs. See [the implementation note](docs/BROWSER-LABS.md).
