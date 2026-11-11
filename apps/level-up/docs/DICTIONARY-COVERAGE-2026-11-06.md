# Translate terminology coverage — 2026-11-06

The reported phrase **Monte Carlo forecast** was absent from the curated dictionary. Both the Translate panel and its API check that dictionary before consulting general English services; those services cannot reliably explain specialized multiword names. This change expands the shared local dictionary from 215 to 285 entries and adds name variants to 14 existing entries.

## Application review

Reviewed lesson text, bilingual question banks (including imported PSPO banks), existing dictionary names/aliases and chart components. Representative material and the gaps it revealed:

| Application material                                                                                                                                                                 | Concepts added or made searchable                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `content/certs/pspo2/pspo2-preparation/pspo2-evidence-uncertainty.en.mdx`                                                                                                            | Monte Carlo forecast/simulation, probabilistic forecast, percentiles, distributions, median, riskiest-assumption test, on-product index |
| `content/certifications/pspo2-forecasting.en.mdx`, `content/po/mid/po-delivery/forecast-release.en.mdx`                                                                              | Burndown, burnup, cumulative flow diagram, release forecasts and forecast ranges                                                        |
| `data/imported-questions/kwestio-pspo1.json`, `data/imported-questions/kwestio-pspo2.json`                                                                                           | Forecasting variants, velocity, story points, Gantt chart, Definition of Ready, WSJF, finance and product metrics terminology           |
| `content/ba/mid/ba-data-analysis/data-dashboards-storytelling.en.mdx`                                                                                                                | Line/bar charts, cohort matrix and chart interpretation                                                                                 |
| `content/ba/junior/ba-visuals/uml-models.en.mdx`                                                                                                                                     | Use-case, sequence, class and state diagrams; domain model; aliases for UML, BPMN and ER diagrams                                       |
| `content/ba/junior/ba-foundations/stakeholder-mapping.en.mdx`, `content/po/junior/po-discovery/story-mapping.en.mdx`, `content/ba/mid/ba-control/traceability.en.mdx`                | Stakeholder map, story map, traceability matrix and related modeling tools                                                              |
| `content/po/mid/po-strategy/product-metrics.en.mdx`, `content/po/mid/po-strategy/po-prioritization.en.mdx`, `content/certs/pspo2/pspo2-preparation/pspo2-portfolio-decisions.en.mdx` | AARRR, HEART, KPI, Kano, Cost of Delay, marginal investment, sunk cost and portfolio decisions                                          |
| `content/ba/lead/ba-analytics-advanced/data-experiments-statistics.en.mdx`                                                                                                           | A/B testing, sample size, selection bias, correlation, causation and statistical significance                                           |
| `components/quiz/attempt-chart.tsx`, `components/progress-chart.tsx`                                                                                                                 | Line and area chart names; funnel terminology also supports the product lessons                                                         |

Companion entries such as histogram, scatter plot, box plot, heatmap, decision table and RACI explain related chart/model names. Their inclusion does not imply that every one was named verbatim in the reviewed lessons. This is an editorial coverage pass, not a claim that every possible phrase in the app has a dictionary entry.

## Explanations and lookup behavior

Each new entry contains an English definition, an Azerbaijani meaning and contextual explanation, and an example in both languages. These are authored study explanations rather than responses obtained from machine translation. Professional names remain English in Azerbaijani prose, following `docs/TRANSLATION_REVIEW.md`.

The explanations distinguish model percentiles from statistical confidence intervals, velocity from customer value, remaining work from completed work, structural diagrams from interactions/lifecycles, and correlation from causation. They describe chart axes or encodings and practical interpretation. Optional practices such as story points, Definition of Ready, Gantt charts and RACI are not presented as Scrum requirements.

Exact aliases handle plurals, acronyms and common name variants. Balanced outer Markdown emphasis, inline backticks and quotation marks can surround a query. Slash spacing in `A / B test` and percentage notation in `95% confidence interval` are accepted. Lookup still requires a known term or alias; an unrelated longer sentence does not inherit the definition of a substring. Existing ambiguous names remain distinct: `CI` means Continuous integration, `readiness` means Learning readiness, and a Use case is separate from a Use-case diagram.

## Verification

Unit coverage checks that every dictionary ID, term and alias is reachable and cannot overwrite another entry after normalization. Regression cases cover the reported Monte Carlo phrase, chart variants, formatted input, statistical punctuation, unknown phrases and invalid links/control characters. API tests verify that these technical queries resolve without provider requests. Browser coverage exercises AZ/EN interfaces, selected lesson text, mobile layout, local results with the API blocked, and the existing light/dark accessibility and online-failure behavior.
