# PSPO curriculum reading and authoring audit — 2026-10-21

## Work completed

- Added six original English lessons (AZ counterparts were completed before the user's English-only UI steering and may be retained as source assets): `pspo1-empiricism`, `pspo1-refinement`, `pspo2-forecasting`, `pspo2-shared-quality`, `pspo2-discovery`, `pspo2-organization`.
- Expanded the eleven existing PSPO lessons with targeted decision-boundary paragraphs. This is substantive content in each existing lesson's decision section, not new repeated outline headings.
- Combined new lesson metadata: `/tmp/pspo-new-lessons.json`. Existing lesson IDs needing optional competency source mapping: `/tmp/pspo-updated-existing.json`.
- Every affected MDX file still has exactly eleven h2 sections. All 34 affected/new AZ+EN files passed standalone MDX serialization with the project options. All are formatted with Prettier.

## Sources actually read for this work

The full book was not read page by page. Selected actual locally extracted sections were read:

- Scrum Guide 2020: Scrum Definition; Scrum Theory, Transparency, Inspection, Adaptation; Scrum Values; Scrum Team, Developers, Product Owner and Scrum Master; Product Backlog and sizing; Product Goal; Sprint Backlog and Sprint Goal; Increment and Definition of Done. Relevant Sprint, Planning, Review and Retrospective passages consulted from inherited source context and source extract.
- The Professional Product Owner (2018): chapter 1 Vision/Defining a Product excerpts; chapter 2 Business Modeling/Business Model Canvas (customer segments, value propositions and channels); chapter 3 Negative Value/technical debt, Value Neutrality and Perversion of Metrics; chapter 4 Stakeholder Feedback, Marketplace Feedback, Minimum Viable Product and Pivot or Persevere; chapter 5 Types of Complexity and Managing Risk; chapter 7 Product Backlog Ordering, Done, Ready Is a Mindset and Getting to Ready; chapter 8 Managing Multiple Teams/portfolio overload, Forecasting Basics, forecasting uncertainty and scope trade-offs, Forecasting Across Multiple Products.
- EBM Guide 2024: goals and measurable goals, measure categories, experiment loop, four Key Value Areas, CV/UV and A2I/T2M sections. Current EBM guide takes precedence over the older book's treatment.
- Kanban Guide for Scrum Teams 2021: Flow and Empiricism; four Basic Metrics; Little's Law discussion; Definition of Workflow; WIP/pull; active management and SLE.
- User-pasted official Professional Scrum Competencies overview: all five competency groups and 28 focus area names. The pasted overview was read; no claim is made to have read every linked focus-area detail page.

The three applied lessons were delegated and reviewed. Their more specific reading record is `/tmp/pspo-applied-audit.md`.

## Coverage decisions

| Gap                                     | New lesson           | Main reasoning                                                                                                           |
| --------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Empiricism, values and self-management  | pspo1-empiricism     | Pillars need truthful information and empowered adaptation; values are behaviors rather than vocabulary-only recall      |
| Backlog refinement and sizing           | pspo1-refinement     | Ongoing refinement; Developers size; optional Ready/user-story/point techniques; meaningful slices                       |
| Forecasting/release planning            | pspo2-forecasting    | Comparable Done history; uncertainty; scope/date trade-offs; release is not Review-gated; delivery is not proof of value |
| Professional quality and technical risk | pspo2-shared-quality | Shared Done, usable integrated Increment, technical debt nuance, A2I/T2M                                                 |
| Product discovery and validation        | pspo2-discovery      | Stakeholder feedback vs market evidence, testable hypotheses, outcome and harm inspection                                |
| Organizational agility and portfolio    | pspo2-organization   | Capacity fragmentation, decision boundaries, metric distortion, system constraints                                       |

Existing expansions cover event purpose rather than prescribed meeting formats; artifact quality vs item acceptance criteria; buyer/user/impact distinctions; business-model assumptions; guardrails; facilitation/coaching/mentoring/teaching as editorial practical distinctions; flow-based decisions; written answer trade-offs; organizational constraints; and honest treatment of failed experiments.

## Boundaries

- No internet candidate comments were accessible in the parent research. No candidate advice, prevalence statistics, pass guarantees or invented review quotations are included.
- No official question texts, book prose or source figures are copied. Scenarios and diagrams are newly authored.
- Scrum Guide 2020 rules override 2018 terminology; optional practices are not presented as Scrum requirements.
- The supplied competency taxonomy informs teaching scope, not official exam weights or guaranteed PSPO tier coverage.
- New lessons use `<LessonCheck />`. The question author is adding source-tagged single/multiple coverage for all six IDs; parent integrates those and the metadata.
