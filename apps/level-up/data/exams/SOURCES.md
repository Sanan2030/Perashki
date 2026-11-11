# Certification configuration provenance

All questions in `../questions/` are original educational practice. They are not real exam questions, are not supplied by an examination provider, and do not establish eligibility or predict an official result. The providers do not endorse this application.

## Verification status — 2026-10-20

Initial requests were denied by the cloud proxy. A later connectivity recheck reached the official IIBA pages and PDFs, allowing the following facts to be verified. Scrum.org assessment pages still return HTTP 202 with an AWS WAF challenge and no usable assessment content.

| Certification               | Verified format and duration                                         | Blueprint                                                     |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| ECBA (current English exam) | 50 standard/situation-based multiple-choice questions, 75 minutes    | Nine domains, using official blueprint v1.1 and 2026 handbook |
| CCBA                        | 130 scenario-based multiple-choice questions, 180 minutes            | Six BABOK knowledge areas with published weights              |
| CBAP                        | 120 case-study/scenario-based multiple-choice questions, 210 minutes | Six BABOK knowledge areas with published weights              |
| PSPO I, II, III             | Unverified; format/count/duration remain null                        | Editorial practice groups only; no asserted official weights  |

The IIBA configurations record `verifiedAt: 2026-10-20`, source URLs, and the published domain weights. A numerical passing threshold was not confirmed in the consulted material and remains null with `TODO: VERIFY`. No passing score is invented. The 30-question banks remain too small for full-length IIBA mocks.

The current English ECBA blueprint uses nine domains, including six core concepts, rather than the older knowledge-area grouping. Original ECBA practice questions have been editorially tagged against those domains; these tags are not an official question mapping. Consult IIBA about other language versions.

Each JSON file includes the canonical official certification page to consult. Scrum-related content should be checked against the [official Scrum Guide](https://scrumguides.org/scrum-guide.html), including the 2020 edition specified by this project. BA content should be checked against official IIBA certification materials and a lawfully accessed BABOK Guide v3; do not copy the guide into this repository.

The official Scrum Guide HTML was accessible and identifies the November 2020 edition. This supports the Scrum framework references; it does not verify PSPO assessment statistics or a passing score.

The PSPO `domains` lists represent editorial groups for practice navigation, not a verified official blueprint. They have no invented weighting. PSPO `format` remains `null`; written PSPO III exercises are an educational practice choice, not a verified claim about the current provider assessment.

## Safe update procedure

1. Open the current official certification page and its linked syllabus/blueprint or handbook.
2. Confirm the assessment format, current question count, permitted duration, published passing policy (which can remain null when undisclosed), and domain definitions/weights.
3. Record any distinctions between learning syllabus, examination blueprint, and eligibility requirements.
4. Update only facts supported by those official documents, retaining the source URLs and setting the verification date.
5. Map practice questions to the verified domains; do not represent a small seed bank as a full-length mock if it cannot supply enough distinct questions or the required response types.
6. Set `verificationStatus` to `verified` only after all configured facts and domains have been checked. If the provider does not publish a passing percentage, leave that value null and explain the policy in `notes`.
7. Run `npm run validate:content` and the assessment tests before publishing.

For written responses, the rubric is for structured self-assessment. No automatic correctness or official pass percentage should be inferred from a model answer.
