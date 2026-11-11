# PSPO question expansion audit — 2026-10-21

## Files owned

- data/questions/pspo1.json (delegated to child pspo1_bank): 38 to 100, 62 new.
- data/questions/pspo2.json: 38 to 100, 62 new.

All prior records preserve IDs, option IDs, answer keys, wording and references. Only new original scenarios added. No actual assessment questions, dumps or candidate testimonials were used as answer authority. Candidate-experience research is handled separately by the root agent.

## PSPO II sources actually read

- Uploaded The Kanban Guide for Scrum Teams, January 2021: purpose/relation pp.3; all four metrics/Little's Law/practices p.4; workflow/WIP p.5; active management/SLE/policy adaptation p.6; flow-based Scrum events and Increment pp.7–8. Full extract inspected, including source/licensing pages.
- Uploaded EBM Guide 2024: Purpose/Definition p.2; strategic/intermediate/tactical goals pp.3–4; input/activity/output/outcome/impact distinctions pp.5–6; current state and experiment loop pp.6–7; hypotheses/features p.7; KVAs pp.8–11; inspecting/adapting pp.11–12. Appendix excerpts inspected for A2I/T2M examples. The file explicitly credits CC BY-SA 4.0; new prose/scenarios are original adaptations with citations.
- Uploaded Scrum Guide November 2020: Scrum Theory/Transparency/Values, Scrum Team, accountabilities, Sprint and Planning, Daily/Review/Retrospective, artifacts and commitments, Increment and Definition of Done. Guide content used instead of older 2018 book Scrum terminology.
- Uploaded The Professional Product Owner (2018): selected Three Vs/value/validation passages ch.1, product boundaries and Product Owner stances ch.1; metrics distortion ch.3; stakeholder/marketplace feedback and MVP patterns ch.4; Product Backlog Ordering ch.7; release Forecasting/Cone of Uncertainty and portfolio/capacity passages ch.8. No claim of full-book reading.

## PSPO II new coverage

62 original items: 48 single, 12 multiple, 2 matching. Coverage includes 15 applied EBM decisions, 16 flow decisions/calculations, 12 forecasting/product/discovery cases, 17 organization/quality/leadership cases, and 2 definition mappings. Difficulty 2/3; editorial domains remain distinct from any official blueprint.

New source-tagged selectable questions link to root's new lessons pspo2-forecasting, pspo2-discovery, pspo2-shared-quality and pspo2-organization, with at least two per lesson. PSPO I equivalents link to pspo1-empiricism and pspo1-refinement; see /tmp/pspo1-question-audit.md.

## Checks

Question schema, ID uniqueness, English and Azerbaijani text uniqueness, answer-key validity and original-record preservation checked locally. Source sections are named in every new overall explanation. JSON passed Prettier. Full app build belongs to root after concurrent edits integrate.
