# PSPO II practice-platform review — 1 November 2026

The user requested the four supplied practice providers in Practice, and missing
topic coverage in Learning. All changes are local draft changes; nothing was
published, pushed, purchased or registered.

## What was actually read

| Provider                                                                        | Reading scope                                                                                                                                                  | Access and offer                                                                                                                                             |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Kwestio](https://kwestio.jad2advisory.com/certifications/pspo-ii)              | Landing, practice and course pages; the public practice UI's bank asset. All 160 prompts/topic fields reviewed, plus selected explanations for the gaps below. | 160 free items across six topics; provider advertises four mock papers. [Timed mock](https://kwestio.jad2advisory.com/certifications/pspo-ii/mock-exam).     |
| [ScrumPrep](https://scrumprep.com/product/pspo-ii-free-quiz/)                   | Public product page and its access button. The actual quiz was not read.                                                                                       | Twelve random free questions; button goes to the student storefront/cart. Full timed mocks are paid. No cart action, account creation or purchase performed. |
| [ExamDeck](https://examdeck.pro/pspo2-practice-questions)                       | Ten public examples and seven linked topic pages with five examples each, including explanations used for new topics. Some concepts overlap.                   | Ten examples on the public page; six free starter items in the app; full bank/mocks paid. No account created.                                                |
| [Product Owner Open](https://www.scrum.org/open-assessments/product-owner-open) | HTTP 202, empty response / website challenge. Current questions and count not read.                                                                            | Linked as foundational official practice, distinct from a PSPO II mock.                                                                                      |

Scrum Guide HTML was readable and still identifies the November 2020 edition.
The official PSPO II, EBM and online Nexus pages returned HTTP 202. An attempted
official Nexus PDF download returned HTTP 403. Existing supplied Scrum/EBM/book
reading records remain the primary teaching basis. No claim is made to have read
the full Nexus Guide in this review.

## Coverage comparison and resulting changes

| Observed topic                                                                      | Existing coverage                                                                        | Action                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CV, UV, A2I, T2M, output vs outcome                                                 | `pspo2-value`, `pspo2-outcome-experiments`                                               | Retained; added on-product-index interpretation in the evidence lesson.                                                                                 |
| Product Goal, vision, business-model/segment conflict, competitor signals           | `pspo2-strategy` introduces these; `pricing-gtm` covers commercial arithmetic            | Added complete `pspo2-business-models` for advanced trade-offs, user/buyer distinction and transparent pivots.                                          |
| Old backlog, refinement depth, delay consequences, dependencies, vertical slicing   | PSPO I/refinement and PO prioritization cover foundations                                | Added complete `pspo2-backlog-economics`; includes delegation vs Sprint-plan ownership and legal-deadline verification.                                 |
| Marginal investment, opportunity cost, sunk cost, maintenance/retirement            | `pspo2-organization` covers capacity; PO `portfolio-lifecycle` remains a planned outline | Added complete PSPO II `pspo2-portfolio-decisions`, with safe retirement and cross-product distinctions. Did not mark the separate outline complete.    |
| Monte Carlo, forecast percentile, inconclusive intervals, riskiest-assumption tests | `pspo2-forecasting` and `pspo2-discovery` introduce uncertainty but lack these details   | Added complete `pspo2-evidence-uncertainty`, conditional examples and statistical limitations.                                                          |
| Multiple teams/one product, optional Nexus Daily Scrum                              | `pspo2-shared-quality` covers shared Done/integration                                    | Added product-level goal/backlog/PO explanation and a limited, explicitly third-party Nexus example. Does not claim Nexus is mandatory or fully taught. |
| Fixed-cadence vs on-demand release                                                  | Forecasting and feature-flags lessons cover Done vs release                              | Extended both locales of `pspo2-forecasting` with adoption/training context and evidence-lesson links.                                                  |
| Stakeholder conflict, uncertain commitments, continuous discovery, mid-Sprint scope | `pspo2-facilitation`, `pspo2-discovery`, `pspo1-sprint-goal-changes`                     | Existing complete coverage retained and linked.                                                                                                         |

Four new lessons are complete in AZ/EN, included in the PSPO II learning module,
prerequisites, estimates and relevant Professional Scrum study-guide focus areas.
Twenty-four independently written bilingual questions enter the existing lesson
and Practice flows: five per new lesson and four additional scaling/release items.
Existing IDs, answers, progress storage and official exam settings are preserved.

## Provider integration and editorial boundaries

`data/external-assessments.json` stores the four offers, clean URLs, related
lessons and source references. Practice renders them when PSPO II is selected;
Kwestio has an additional direct timed-mock action. Vendor tests run on the vendor
site. Their sessions and scores are not imported into this app or presented as
locally hosted exams. This app's original questions retain its existing scored
practice, explanations and spaced review.

Provider question text and proprietary banks are not redistributed. Provider
claims about exam format, pass-score equivalence, study outcomes and topic weights
do not become verified official facts. Some public explanations are broader than
the Scrum Guide: for example, ordinary stakeholder collaboration is not restricted
to formal events, a PO is not required to adopt subscription pricing, and a
forecast is not guaranteed. The new teaching keeps these distinctions explicit.
Official PSPO II fields remain unverified; the existing full-mock gate is intact.

Source records state the exact read/unavailable scope. A product page being read
does not imply its gated quiz was read. See `data/sources.json` and the existing
reading audits for primary-source provenance.
