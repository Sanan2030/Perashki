# PSPO I question expansion audit — 2026-10-21

Only `data/questions/pspo1.json` edited. Existing 38 records were compared with Git HEAD and preserved in full, including IDs, options, explanations and answer keys. Added 62 original bilingual source-tagged questions with IDs `pspo1-extended-001`–`062`; total 100.

## Actually read

- `/tmp/scrum.txt`: complete uploaded November 2020 Scrum Guide extract, including Purpose, Definition, Theory and all three pillars, Values, Scrum Team and accountabilities, all Events/timeboxes, all Artifacts and Commitments, End Note.
- `/tmp/ebm.txt`: selected material pp. 3–7: goal levels and measurable transparent goals, inputs/activities/outputs/outcomes/impacts, experiment loop, explicit hypotheses and minimum work needed to test value.
- `/tmp/product-owner-book.txt`: selected chapter 1 material around the Three Vs (Vision, Value, Validation) and chapter 7 Product Backlog Ordering, including value/risk/size/dependency considerations and near-term refinement over over-ordering distant work. The book was not read cover to cover for this task. Scrum terminology follows the 2020 Guide.

## Coverage

Values (respect, focus, openness, commitment, courage); inspection-to-adaptation and transparency; lean and a deliberately incomplete framework; non-software products; collective cross-functionality, team size, same-product shared direction and lifecycle activities; Product Owner/Developers/Scrum Master decision boundaries; event cadence, timeboxes and purposes; Daily participants and flexible structure; Planning advice and goal formation; Review/Retrospective order and improvement; formal artifacts versus optional charts; emergent backlog/refinement/ready/sizing; goal and artifact commitments; Increment creation, integration and incompleteness; organizational Done minimum and who defines Done; forecasts based on observed work; value measures/Three Vs/hypothesis experiments.

New types: 49 single, 10 multiple, 3 matching. New editorial topic groups: stakeholder-leadership 6, empiricism 8, scrum-application 37, product-strategy 7, product-value 4. These counts are instructional coverage, not official exam weights.

Four new questions map to new lesson `pspo1-empiricism`; six to `pspo1-refinement`, both supplied by parent/root curriculum work. Each has at least two single/multiple questions available for inline checks. Other links use existing published PSPO I lessons.

No actual official assessment items or candidate recollections copied. Scenarios, translations, options and explanations are original. Every new item identifies a read source and section. Community experiences are not answer authorities. Exam question counts or passing rules are not asserted.

## Validation

- All 100 records pass `questionSchema` via tsx.
- Old-record deep equality against Git HEAD passed.
- IDs unique, new records have `practiceOnly: true`, valid domain and source IDs.
- Formatting: Prettier applied.
