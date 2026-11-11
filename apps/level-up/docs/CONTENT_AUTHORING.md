# Author and translate learning content

Lessons, curriculum metadata, question banks, and exam settings live in the repository. You can add lessons through GitHub's file editor or a normal pull request without editing application components. Use a branch and let CI check the proposed content before merging.

## Stable identifiers and locations

Use a unique lowercase, hyphenated lesson ID, such as `acceptance-criteria`. The ID is also the lesson URL segment and the key for progress, notes, bookmarks, and question references. Keep it stable when changing a title or adding a translation.

Use matching locale files:

```text
content/ba/junior/requirements/acceptance-criteria.az.mdx
content/ba/junior/requirements/acceptance-criteria.en.mdx
```

The other roots are `content/po/` and `content/certs/`. For certification content, use the certification ID for the level-or-certification directory, for example `content/certs/pspo1/scrum/`. Track IDs are `ba`, `po`, `ecba`, `ccba`, `cbap`, `pspo1`, `pspo2`, and `pspo3`. Career level IDs are `zero`, `junior`, `mid`, and `lead`; `lead` is displayed as Lead/Senior where appropriate.

The filename must be `<id>.<locale>.mdx`. Each language has its own body and objectives, while both files refer to the same metadata ID. Both files are required by content validation. Publish complete, reviewed content in both languages. Professional terms remain English; translate the surrounding explanation naturally. See [translation review rules](TRANSLATION_REVIEW.md).

## Add a lesson

1. Add an entry to `data/lessons.json`. Both localized strings are required:

   ```json
   {
     "id": "acceptance-criteria",
     "trackId": "ba",
     "level": "junior",
     "moduleId": "ba-requirements",
     "title": {
       "az": "Acceptance criteria",
       "en": "Acceptance criteria"
     },
     "summary": {
       "az": "Tələbin nə vaxt yerinə yetirildiyini aydınlaşdır.",
       "en": "Make clear when a requirement has been met."
     },
     "minutes": 30,
     "status": "planned",
     "topics": ["acceptance criteria", "Gherkin"],
     "prerequisites": []
   }
   ```

2. Add the ID to the appropriate module's `lessonIds` in `data/modules.json`. A module identifies its track, level, localized title and description, estimated minutes, and prerequisite **module IDs**. Lesson prerequisites use **lesson IDs**. Keep relationships valid and acyclic; do not use titles as references. Recalculate module estimates when its lesson list changes.
3. Add matching English and Azerbaijani MDX files. Start each with YAML frontmatter:

   ```mdx
   ---
   id: acceptance-criteria
   locale: en
   title: Acceptance criteria
   objectives:
     - Distinguish an outcome from a proposed implementation.
     - Write examples that a team can verify.
   ---

   ## Learning objectives

   By the end, you can distinguish outcomes from implementation choices and
   write examples a team can verify.
   ```

4. Write the content using the complete lesson structure below. If the file is an outline, say so explicitly and include a useful learning sequence and practice plan. Keep `status: "planned"` until the complete lesson is ready in both languages. `published` means a complete lesson, not simply a file that exists.
5. Add relevant glossary entries or questions if needed. Update related references using the stable lesson ID.
6. Run content validation, formatting, tests, and a production build. Review both rendered language versions and their terminology at a narrow viewport. Submit a pull request; CI must pass before merge.

The canonical field definitions are Zod schemas in `lib/types.ts`. The frontmatter schema is in `lib/content.ts`. Validation checks metadata and content relationships; a valid schema does not replace educational or factual review. Do not silently weaken validation to make a content change pass.

## Complete lesson structure

Every published lesson should contain these eleven parts, in the target language:

1. Learning objectives: observable outcomes, not vague promises.
2. Why it matters: a concrete work situation and consequence.
3. Core theory: explain the idea in original, plain language.
4. Worked example: a realistic banking, commerce, telecom, or similar IT scenario.
5. Diagram: a readable Mermaid flow or an accessible original visual.
6. Interaction: use an appropriate interactive component when it improves understanding.
7. Common mistakes and best practices: explain the consequences and better choices.
8. Practice exercise: include enough context to try it and a sample solution, preferably inside `<details>`.
9. Mini-quiz: three to five original questions with answers and explanations. The lesson's inline quiz may be a self-check; use the JSON question bank for automatically scored practice.
10. Cheat sheet: a compact summary usable after the lesson.
11. Further reading: relevant official documentation and reputable free resources, with working links.

Do not copy BABOK prose, exam questions, paid course exercises, or diagrams you do not have permission to reproduce. Explain concepts in your own words and link to the original authority for further reading. Review Azerbaijani terminology for consistency with `data/glossary.json`.

## Diagrams and interaction

The lesson renderer supplies `Diagram` and `ConceptStepper`; lesson authors do not need to add React imports.

`KubernetesExplorer` is also available for the Docker and Kubernetes masterclass. It provides an image delivery walkthrough, a simplified ReplicaSet recovery and rolling-update simulation, Service label/namespace selection, and ConfigMap/Vault refresh experiments. Embed it as `<KubernetesExplorer />`; it does not access a real cluster. It follows the current AZ/EN interface language and respects reduced motion.

```mdx
<Diagram
  chart={
    'flowchart LR\n  A[Observe a need] --> B[Clarify the outcome]\n  B --> C[Test a small change]\n  C --> D[Review evidence]'
  }
/>

<ConceptStepper locale="en" />
```

The public renderer follows the selected locale. Use the matching locale for `ConceptStepper`. `ConceptStepper` currently explains understanding a goal, choosing a small step, testing, and adapting; use it where that cycle fits the topic. Do not label it as a different simulator or imply that it models every framework.

Keep chart labels short and provide an adjacent text explanation of the relationship, so the lesson remains useful if a diagram cannot render or is not visually accessible. Mermaid uses strict rendering security. Motion must respect the learner's reduced-motion preference. Use standard Markdown headings, lists, links, tables, and fenced code blocks. Give images meaningful alt text; avoid conveying an answer only through color.

**MDX is trusted code.** Only maintainers should approve and publish it. Do not accept arbitrary MDX uploads, fetch executable lessons from untrusted URLs, or render user notes as MDX. Keep expressions limited to reviewed component examples such as the literal diagram above. Never embed credentials, external script tags, or private project information in content.

## Glossary and competencies

`data/glossary.json` contains entries with `id`, localized `term`, localized `definition`, and `relatedLessonId`. Define terms in original words and link to an existing lesson. Keep IDs stable for anchor links.

`data/competencies/index.json` supplies the application with all six career-level competency profiles. The individual JSON files are editorial copies of those profiles; keep the index and individual files synchronized when changing a profile. Each profile includes responsibilities, hard skills, soft skills, tools, deliverables, changes from the previous level, checklist items, and interview questions with model answers. Checklist IDs are persistence keys; do not rename them just to change their display text. Self-assessment results describe the learner's own assessment, not official certification eligibility.

## Question banks

Questions live in `data/questions/` and follow `questionSchema` in `lib/types.ts`. Each needs a unique ID, track, type, domain, difficulty from 1 to 3, localized text, answer options, stable correct-answer IDs, localized explanation, related lesson ID, and `practiceOnly: true`. Each option includes an explanation of why it is appropriate or inappropriate. Use a domain ID from the corresponding certification configuration.

- `single`: exactly one correct option.
- `multiple`: all correct option IDs; selecting only part of the answer is not full credit.
- `ordering`: correct IDs in the intended order; explain why that sequence fits the scenario.
- `matching`: follow the existing matching question examples and the engine's answer encoding in `lib/quiz.ts`; do not invent a separate structure.
- `written`: an original scenario, explanatory guidance, and a localized `rubric`. Written answers are for reflection, not automatic pass/fail grading.

Preserve option IDs when translating or shuffling; array positions are not answer keys. Avoid trick wording and questionable absolutes. Scenario assumptions should make the intended answer defensible. Keep answer options parallel and plausible, and explain the alternatives. Do not present practice questions as real exam questions. When adding many questions, validate the bank and inspect a sample in the UI.

## Exam facts and verification

`data/exams/` contains exam settings, official source URLs, `verificationStatus`, and `verifiedAt`. Check the awarding organization's current pages for the exact certification, format, duration, question count, thresholds, and syllabus before changing these fields. Use official IIBA, Scrum.org, and Scrum Guide sources. Candidate experiences may inform study advice only when actually read and clearly labeled as anecdotes; they do not establish exam rules. Record the verification date and any important qualifications in the localized notes.

If a fact cannot be verified, keep it `null` where the schema allows, set `verificationStatus: "needs-verification"`, and explain `TODO: VERIFY` in the notes. Do not turn an undisclosed pass score into an invented number. Distinguish a question bank's editorial domain organization from an officially verified exam blueprint.

Full-length timed mocks remain unavailable when the format is unverified, the required fields are missing, the unique bank is too small, or domain coverage is insufficient. Written formats need a self-review rubric; they do not receive a fabricated automatic official pass result. Adding seed questions alone does not satisfy the prerequisites for an official-format simulation.

## Validation checklist

```sh
npm run format
npm run validate:content
npm run lint
npm run typecheck
npm test
npm run build
```

Before merging, verify that both language versions render, planned content is clearly labeled, diagrams have a readable text explanation, referenced lessons exist, and the lesson's estimate is reasonable. Review source accuracy and teaching quality separately from automated checks.

## Terminology helper

`data/dictionary.json` contains curated terms and multiword phrases with an English definition, Azerbaijani meaning, Azerbaijani explanation, bilingual example, context and aliases. Keep technical distinctions explicit (for example verification versus validation, or product-user onboarding versus employee induction). Extend this dictionary for important new lesson vocabulary. Unknown-word services are a fallback and their output must be labeled as machine translated.

## Source locators

Add only genuinely read sources to `data/sources.json`. Use stable `sourceIds` on lesson/question metadata and precise chapter/section locators in the lesson text and explanations. A member PDF may be used as supplied source material without being distributed in the repository or product. Unavailable links must retain their blocked/challenge status.
