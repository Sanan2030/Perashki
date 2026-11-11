# AZ/EN translation review

Both `/az` and `/en` are public. The header switch changes the route locale, preserves the path, search parameters and anchor, and saves the preference in `level-up.locale`. Progress and notes use shared stable IDs, never translated titles.

## Editorial rules

- Read each complete sentence and its neighboring sentences before translating. Preserve conditions, negation, uncertainty, units, numbers, citations and punctuation that affect meaning.
- Keep professional names and technical terms in English: Product Backlog, backlog, Product Owner, Sprint Goal, Definition of Done, Pod, Deployment, ReplicaSet, label, selector, namespace, ConfigMap, Vault, authentication and authorization. Attach Azerbaijani case endings naturally, for example `backlog-u`, `Pod-lar` and `Deployment-in`.
- Translate explanatory prose into natural Azerbaijani. Do not transliterate a technical term into a competing Azerbaijani name. An Azerbaijani definition may explain the concept without changing its English name.
- Keep code fences, API fields, identifiers, commands, HTTP statuses and answer IDs unchanged. Review technical example meaning separately from prose fluency.
- Review each question with its options, correct-answer IDs and explanations together. A translation must not change which option is correct or add a hint absent from the English version.
- Check sentence boundaries, quotation marks, spacing around inline code, table cells, links and diagram explanations in the rendered page. Technical diagram labels may remain English; surrounding explanation must be available in the selected language.

## Current coverage and implementation

The catalog contains 115 topics with 230 locale files: 90 complete lessons and 25 labeled outlines per language. This change adds the 42 missing AZ files, brings 18 older AZ lessons up to their current English structure, and translates 232 question records whose AZ text previously duplicated English. All 682 question prompts and explanations are available in both languages. Existing topic and question IDs are preserved.

Interface translations are explicit reviewed strings in `data/i18n/interface-az.json`; they do not call a translation service. Study-guide descriptions have their own reviewed map. Components with existing locale-specific copy continue to use those strings. Unknown keys remain visible for editorial correction rather than being silently machine translated. The optional Translate dictionary labels online machine-generated results separately.

`npm run validate:content` requires both MDX locales and checks published structure in both. Unit tests cover route preferences, terminology and code preservation. Browser tests cover language switching, persisted notes/completion, localized simulations, keyboard use, mobile layout and accessibility. Automated checks complement sentence review; they do not establish translation quality on their own.
