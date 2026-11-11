# Teaching sources and scope — updated 2026-10-23

The user supplied four PDFs and pasted Scrum Guide text. Files were extracted locally with `pdftotext -layout`. They remain outside the Git repository and are not published.

| Source read                                                                              | Sections consulted                                                                                                                                                                                | Teaching use                                           |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Scrum Guide, November 2020 — Ken Schwaber & Jeff Sutherland                              | Scrum Theory, Scrum Team, all events, all artifacts and commitments                                                                                                                               | PSPO I, shared-quality and accountability reasoning    |
| The Kanban Guide for Scrum Teams, January 2021 — Scrum.org, Daniel Vacanti & Yuval Yeret | pp. 3–8, especially metrics p. 4 and SLE p. 6                                                                                                                                                     | PSPO II flow lesson and original scenario checks       |
| Evidence-Based Management Guide, 2024 — Scrum.org                                        | goals pp. 3–4, measures pp. 5–6, experiments pp. 6–7, KVAs pp. 8–11, inspection pp. 11–12, examples pp. 13–16                                                                                     | Value, strategy, experiments and reflection            |
| The Professional Product Owner, 2018 — Don McGreal & Ralph Jocham, ISBN 9780134686479    | Selected material in chapters 1–5, 7–8: Three Vs, product mindset, empiricism/complexity, value metrics, stakeholder/marketplace feedback, MVP, pivot/persevere, backlog ordering and forecasting | Original product-management explanations and scenarios |

## Version decisions

- Scrum terminology and rules follow the November 2020 Guide. The book's older “Development Team” terminology does not override Developers, self-management, Product Goal and artifact commitments.
- EBM instruction follows the supplied 2024 guide, including all four KVAs and the distinction between inputs, activities, outputs, outcomes and impacts.
- The January 2021 upload is **The Kanban Guide for Scrum Teams**, not the standalone Kanban Guide. Kanban complements Scrum and does not remove Sprints/events.
- Formula examples, experiment thresholds and answer-writing structures are teaching aids, not certification rules or official grading criteria.
- Adapted explanations derived from the Scrum and Kanban guides are shared under CC BY-SA 4.0 with attribution on lesson/source pages. Book prose, figures and quizzes are not copied.

## Initial coverage and practice — 2026-10-21

All eleven PSPO lessons are now complete in Azerbaijani and English. Eight PSPO I/II lessons include source-tagged original questions and interactive inline checks. PSPO III lessons teach written reasoning and link to original written exercises with self-review rubrics. No automatic official grading is claimed. The total question bank has 218 items; sixteen newly authored items carry explicit `sourceIds`. Earlier original items retain their IDs, options and answer keys; their lesson links now point to complete related PSPO teaching. These older items are editorial practice and have not all undergone a topic-by-topic citation audit.

`data/sources.json` is the source register. `data/lessons.json` and the new questions refer to it through `sourceIds`. Validation rejects missing/unread source IDs and source-tagged questions pointing to outlines. The browser checks source status, inline feedback, lesson-focused practice, persistence and existing functionality.

## Unavailable material and limits

On 2026-10-21 the Product Owner Open URL returned HTTP 202 with an AWS WAF challenge and no question content. The ClassMarker URL was denied by the environment proxy (CONNECT 403). Neither assessment was read or reproduced; ClassMarker's official status is unverified. The app links to Product Owner Open for official practice.

Previously requested Scrum.org forum posts were also unavailable behind a challenge. Modern Analyst and AbeBooks links were blocked; an announcement or sales listing would not replace the BABOK text in any case. No newly completed BABOK lessons are attributed to these links. IIBA curricula and exam provenance from the previous implementation remain separately documented.

The uploaded books/guides do not verify current assessment question counts, time limits, pass thresholds or exact exam domain weights. PSPO exam settings therefore remain `needs-verification`; short practice remains available. Do not represent the topic groups as a verified exam blueprint or enable a full official-format mock without verified rules and a sufficiently large bank.

## Expansion and English-only publication — 2026-10-22

The user later supplied BABOK Guide v3 and the official Professional Scrum Competencies page text, then requested English-only visible lessons plus a word/phrase translator with both English and Azerbaijani explanations.

- At that expansion: 73 topics, 33 complete English lessons, 40 outlines. Nine IIBA lessons use selected BABOK sections; seventeen PSPO lessons use the supplied guides/book and competency text. Existing AZ material remains an archive and `/az` URLs redirect to `/en`.
- Bank at that expansion: 446 original questions. PSPO I and II each contain 100 items; PSPO III has 40 unscored written prompts; ECBA has 64, CCBA and CBAP 60 each, BA/PO 11 each. The 228 newly added questions have source IDs and source locators. Together with the earlier 16 this yields 244 explicitly source-tagged items.
- A source-based five-group/28-focus-area study map links related lessons without claiming a verified exam blueprint or complete coaching, mentoring and teaching coverage.
- The 50-question ECBA mock now meets verified domain quotas. PSPO formats remain unverified, and the CCBA/CBAP banks remain smaller than their verified full exam formats.
- `data/dictionary.json` holds 91 contextual word/phrase explanations, Azerbaijani meanings and explanations, and bilingual examples. General English fallback uses optional public services and clearly labels machine-translated output.

See [the research audit](RESEARCH-2026-10-21.md) and [selected BABOK reading record](reading-audits/babok-reading-audit.md). Candidate experience reports could not be read; no candidate-review consensus or real exam claims were fabricated. New source sections were sampled independently for answer ambiguity. The solution-boundary premise in ECBA item 058 and the organizational Done premise in PSPO II item 045 were clarified. Inline answer choices now use deterministic question-specific shuffling so authored position is not a shortcut.

## Community preparation note follow-up — 2026-10-22

A normal public GitHub search was accessible after the earlier Google/Bing/Reddit denials. The README at [ShoSaito/PSPO-II](https://github.com/ShoSaito/PSPO-II) was read. Its study recommendations include reading primary guides, immediate explanations, category review and revisiting weak areas, which align with the app’s practice/review design. Its unsupported and internally inconsistent assessment numbers were excluded. This is not a first-hand exam-result report and does not support claims about question frequency, pass likelihood or the current official exam format. The source register identifies it explicitly as community preparation notes; no question answer keys or official settings were sourced from it.

## Technical and supplementary PSPO expansion — 2026-10-22

At that expansion, the catalog had **86 topics: 48 complete English lessons and 38 outlines**. Two existing BA outlines (`rest-apis`, `integration-basics`) became complete lessons, preserving IDs; nine new technical lessons and four PSPO lessons were added. Eleven technical lessons are searchable through a dedicated Subject filter. Three new career modules provide authentication, API engineering and distributed-systems sequences.

At that expansion, the bank contained **514 original questions**, including **68 new source-tagged items**: 44 technical questions and 24 PSPO items. Track totals are BA 55, PO 11, PSPO I 106, PSPO II 118, PSPO III 40, ECBA 64, CCBA 60 and CBAP 60. There are 312 explicitly source-tagged questions. Existing question IDs, answer keys and saved-attempt encoding were preserved. New supplemental JSON retains the required legacy localized shape; English is the publication text, while new Azerbaijani meanings and explanations are curated in Translate. No complete AZ lesson translations are claimed.

The dictionary has **135** contextual entries, and the glossary has **51** terms. The TypeScript API lab verifies the published PKCE and GitHub HMAC vectors and exercises authorization, validation, duplicate-operation and stale-update invariants. It does not provide production authentication or multi-instance transaction guarantees.

Twenty-two primary/supplementary online sources were added to the register with edition/section notes. Scrum.org requests still returned HTTP 202 with no text; a Nexus PDF request returned 403 and is not used. No current PSPO assessment format, exam questions or candidate-review consensus was inferred from inaccessible pages. See [the selected-source reading audit](RESEARCH-2026-10-22.md).

## DevOps and data analysis expansion — 2026-10-23

At that expansion, the catalog had **98 topics: 61 complete English lessons and 37 outlines**, across **25 modules**. Six new DevOps lessons and six new data lessons were added; the stable `sql-basics` outline became the seventh complete data lesson. Subject filters provide separate DevOps and Data analysis collections while preserving the eleven architecture/API/coding lessons.

There are **566 original questions**, including 52 new source-tagged BA topic questions, four per added/expanded lesson. The BA bank now has 107 items; other track totals and certification mock verification gates are unchanged. There are **364 explicitly source-tagged items**, **175 curated dictionary entries** and **71 glossary entries**. New dictionary entries have real Azerbaijani meanings, contextual explanations and examples. Required legacy AZ lesson metadata/question slots retain English compatibility values; no new complete AZ course translation is claimed.

Nineteen official documentation sources were read selectively and registered, covering Git/Linux, Docker, GitHub Actions, Kubernetes, Terraform, SRE/recovery, PostgreSQL, pandas, Microsoft analytics, experimental design and accessible color use. Prior read GOV.UK guidance supports metric definitions. The short Linux intro is explicitly limited in scope. See [the reading and verification record](RESEARCH-2026-10-23.md).

The synthetic Python lab checks row cleaning/reconciliation, conflicting IDs, nonbuyer denominators, join fanout, explicit windows, cohort observation boundaries and a limited fixed-horizon A/B approximation. Its optional pandas counterpart independently aggregates the cleaned rows. DevOps manifests are instructional fragments, not deployed infrastructure; no Docker/Kubernetes/Terraform deployment or executed Power BI workbook is claimed. Existing lesson/question IDs, progress storage, notes, English publication and navigation are preserved.

## BA/PO and technical course expansion — 2026-10-23

At that expansion, the catalog had **114 topics: 89 complete English lessons and 25 outlines**, across **34 modules**. Seven BA and five PO outlines were expanded under their original IDs. Sixteen new lessons cover advanced databases (3), messaging/caching (3), software testing (3), data engineering (3) and cloud/security (4). Nine modules keep career levels and prerequisites coherent; five new subject filters expose the technical collections.

The bank now has **678 original questions**, including 112 new source-tagged topic items. Totals are BA 199, PO 31, PSPO I 106, PSPO II 118, PSPO III 40, ECBA 64, CCBA 60 and CBAP 60. There are **476 source-tagged questions**, **205 curated dictionary entries** and **86 glossary entries**. Each new lesson has four explained single/multiple-choice checks. No new official-exam or grading claims are introduced.

Thirty-one selectively read online sources supplement the supplied BABOK/Scrum/EBM/Product Owner materials. The [course research record](RESEARCH-COURSES-2026-10-23.md) documents actual reading, version limits, index-only OMG access and unavailable URLs. All lessons, scenarios, diagrams, questions and numerical examples are original. Legacy AZ metadata/question slots preserve schema compatibility while the newly curated terminology has real Azerbaijani explanations and examples. Notes, bookmarks, saved attempts, public access and progress storage remain intact.

## Independent library and browser labs — 2026-10-23

At the user’s request, all 40 engineering/data topics are now independent library lessons and excluded from every learning path. Learning paths retain 74 topics (49 complete, 25 outlines) in 18 modules; 17 independent collections hold the other 40 complete lessons. Total content, lesson/question IDs, sources, notes and stored completions are preserved. Generic BA practice and learning-dashboard calculations exclude independent topic work; explicit lesson practice remains available.

Seven SQL and seven API/testing lessons include in-browser labs. The SQLite fixture reproduces the already published synthetic data and calculations. Six SQL exercises check result values, not a canonical query string. The HTTP lab is an explicitly simulated orders service carried by real same-origin transport, with per-tab caller-owned state and five exercises. It does not call a live external API or provide production authentication, persistence, broker semantics, JWT cryptography or database isolation. Read [the implementation and validation boundaries](BROWSER-LABS.md).
