# BABOK original-question reading audit

Source: uploaded BABOK_Guide_v3_Member.pdf, extracted as /tmp/babok-v3.txt. Selected sections were read for this task; this is not a claim to have read every page of the book. Source PDF is outside the repository and is not distributed.

## Source sections actually consulted

- §§1.4.2–1.4.3: knowledge-area grouping and absence of a prescribed universal task order.
- §§2.1–2.5: BACCM concepts and relationships, BA practice/key terms, requirement classification, stakeholder roles, requirements and designs.
- §§3.1–3.5: purposes and descriptions of approach, stakeholder engagement, governance, information management and BA performance improvement. §3.3.4 decision roles, escalation and change-control criteria also read.
- §§4.1–4.5: purposes/descriptions of elicitation preparation, collaborative/research/experimental elicitation, confirmation accuracy vs approval, audience-sensitive communication and ongoing collaboration.
- §§5.1–5.5: purposes/descriptions for traceability, ongoing maintenance/reuse, priority and dependency, assessing proposed changes, and approval. Relevant inputs and selected decision guidance were read.
- §§6.1–6.4: purposes/descriptions for current/future state, risk and alternative change strategies. Current-state sufficient detail, success conditions, likelihood/impact/timing, risk acceptance, resources and transitional states informed scenarios.
- §§7.2–7.6: purposes/descriptions and selected input/element guidance. Verification vs validation, validation may start before full verification but cannot complete beforehand (§7.3.3), requirements architecture coherence distinct from traceability, design allocation/trade-offs, potential value uncertainty, PoC options and rejecting all options (§7.6).
- §§8.1–8.5: purposes/descriptions and relevant inputs: measures vs interpretation, internal solution vs external enterprise restrictions, environmental factors outside enterprise, and synthesized recommendations including replacement/retirement.
- §§9.2.1 and 9.2.3: ethics, transparent reasoning, responsibility for errors and trustworthiness.
- Techniques §§10.16, 10.25, 10.31, 10.35, 10.40, 10.45: selected purpose/description material (decision analysis, interviews, observation, process modelling, root cause, survey). Only relevant methods appear in new questions.

No book questions, figures, or lengthy prose were reproduced. All scenarios, answers and distractor explanations are independently authored. Each new answer explanation identifies a BABOK section, and each new record uses sourceIds: ["babok-v3"].

## Changes

- data/questions/ecba.json: 30 original seed items preserved, 34 added, total 64.
- data/questions/ccba.json: 30 original seed items preserved, 30 added, total 60.
- data/questions/cbap.json: 30 original seed items preserved, 30 added, total 60.
- Total additions: 94 (86 single-response, 8 multiple-response).
- New IDs are `<track>-babok-031` onward; existing IDs, keys, options and contents remain unchanged.
- All options have non-empty English/Azerbaijani explanations. English is authored first; AZ fields retained for compatibility with the existing schema.
- New CCBA/CBAP items cover all six configured knowledge-area domains equally (five each per track). Level and scenario complexity differ.
- Current ECBA nine-domain tags remain an editorial mapping to the already verified current exam config; the 2015 book is not described as its current exam blueprint.
- ECBA's final four added items fill genuine Understanding BA and Mindset coverage gaps. The 64-item bank now passes the existing weighted 50-question mock eligibility gate. CCBA/CBAP remain undersized for full-length mocks.
- CCBA strategy, design and evaluation questions link to complete CBAP lessons when those lessons are the accurate shared reference. This mapping was coordinated with the BABOK lesson author.

## Checks

- Compared the first 30 records in each file against HEAD: exact preservation.
- Checked unique IDs, valid answer keys, type/key cardinality, source tags, bilingual option explanations, and correct configured domain membership.
- Prettier formatted only the three owned files.
- Existing mockEligibility function: ECBA eligible; CCBA/CBAP blocked by insufficient bank size.

Remaining integration belongs to parent: register babok-v3 source, mark the nine source-backed lessons published, update counts/notes and e2e mock expectations, and run full content/build/browser validation.
