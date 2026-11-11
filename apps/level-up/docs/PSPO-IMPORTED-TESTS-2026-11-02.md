# PSPO provider tests imported on 2 November 2026

The user clarified that external links alone were insufficient and requested the
source questions inside this app, unchanged in English, with Azerbaijani
translations and source-specific widgets. The user explicitly confirmed use and
republication permission in this chat. Provider questions are not attributed to
the app's authors and are not mixed into the original question bank.

## Obtained content

| Source                          | PSPO I | PSPO II | Actual access                                                                                                                                                                                        |
| ------------------------------- | -----: | ------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kwestio                         |    361 |     160 | Public practice-bank assets; all items imported.                                                                                                                                                     |
| ExamDeck                        |      — |      45 | Ten main-page examples plus five examples on each of seven topic pages. These are the accessible public samples, not the paid full bank.                                                             |
| Management Plaza                |     12 |       — | Free PSPO I demo started and submitted anonymously using its public demo endpoints; source answers and feedback read from its review panel. No paid bank, account, payment or personal details used. |
| ScrumPrep                       |      0 |       0 | Public offer pages open, but actual quizzes lead to a student portal requiring login.                                                                                                                |
| Product Owner Open / Scrum Open |      0 |       0 | HTTP 202 with no question content / HTTP 403, respectively.                                                                                                                                          |

The user was notified as each inaccessible test was identified. No questions were
invented to stand in for an inaccessible provider.

## English preservation and provenance

`data/import-provenance/pspo.en.json` records the source text, source IDs, options,
answer keys and overall explanations. Kwestio strings are verbatim. ExamDeck
visible text was extracted from its HTML; the separate answer heading and source
citation were excluded from the explanation body. Management Plaza feedback HTML
was converted to visible text; wording was not rewritten. Metadata and hashes
live in `manifest.json`. Source correctness is distinct from faithful copying:
the app retains the provider's answer key rather than silently correcting or
presenting it as an official Scrum.org key.

The 578 imported questions live under `data/imported-questions/` and use stable
provider-prefixed IDs, a `providerId`, original source-question ID and source
references. `getQuestions()` still returns only the original 706 items.
`getImportedQuestions()` loads the separate collections only for Practice.
Lessons, normal practice, domain drills and original official-format mocks keep
their original bank. Imported collections never borrow questions from another
provider or from the original bank to fill a session.

## Azerbaijani translations

The 3176 distinct question, option and explanation strings have AZ translations.
Initial drafts used a translation service with protected terms, followed by
question/answer review and targeted manual corrections. The recorded review
includes 147 manual field overrides, as well as reusable wording corrections.
Observed problems such as ordering/purchasing, emergent/emergency, spike/grain,
adoption/adopting a child, churn/panic and lost negation were corrected. This is
not an independent linguistic certification of every sentence.

Automated checks cover every imported question/option/explanation for retained
professional terms, untranslated question/explanation text, missing keys and
unresolved placeholders. Source English, option IDs and correct keys are compared
with the English snapshot for every item. `translation-review.json` records the
term list and review scope. English source terminology and meanings take priority
over literal, misleading word substitutions in AZ.

## Native practice behavior

Each source has its own widget with two actions:

- **Study with explanations:** the whole source bank, untimed, with feedback
  after checking an answer.
- **Start test:** a randomized question subset with a timer and feedback deferred
  until submission. App-selected sizes are 80/60 minutes for Kwestio PSPO I,
  40/60 for Kwestio PSPO II and ExamDeck, and 12/15 for the Management Plaza demo.
  These are learning settings, not verified official exam configurations or
  reconstructions of the provider's exact paper selection algorithm.

Questions may be randomized, but imported options retain source order so
explanations referring to A/B/C remain meaningful. Source English option prefixes
are retained without adding duplicate UI letters. Providers supplying one overall
explanation are shown with that explanation, not invented per-option commentary.
Source-question IDs and attribution remain visible in feedback.

Existing scoring, flagging, pause/resume, timestamps, review results and saved
sessions handle the native tests. `practiceSetId` survives saved attempts and
progress export/import; `feedbackMode` survives session reloads. Existing progress
does not require a schema migration. Source name appears in the active session,
result and history. Original exam configuration, verification gates and pass
thresholds are unchanged. External provider links remain in a supplementary,
collapsed section below the native widgets.

## Verification

Unit checks cover all source English/keys, provider isolation, unique selection,
grading, term preservation, source option order and progress round trips. Browser
checks cover source-local study, AZ/EN feedback, timed-test deferred explanations,
reload, results, source-attributed history, mobile layout and the original bank's
continued isolation.
