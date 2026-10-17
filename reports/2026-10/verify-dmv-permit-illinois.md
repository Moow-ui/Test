# Question verification: dmv-permit-illinois (Illinois DMV Permit Test)

- Date: 2026-10-18 (daily routine, morning)
- Method: a separate agent re-solved a file with only stems and choices (answer, explanation, oneLineConcept, choicesByLevel removed). Picture questions were solved from the rendered PNGs (`npm run images:render -- dmv-permit-illinois`). Illinois-specific numbers were checked against statute text excerpts and official pages (ilsos.gov and ilga.gov cannot be opened directly from the run environment (proxy blocks), so search results and law.cornell.edu were used).
- Exam format: 92 Ill. Adm. Code 1030.80 (law.cornell.edu) — Class D written test has at least 35 questions, 80% correct to pass (28 of 35). SOS posts no time limit; practice mock uses 30 minutes.

| Written | Passed | Passed after fix | Held (review queue) |
|---|---|---|---|
| 95 | 92 | 1 | 2 |

- Re-solve 95/95 matched the key.
- Fixed and re-verified 1: the pass-mark question said "has 35 questions"; reworded to "at least 35 questions, 80% correct" to match 1030.80(b), re-solved by a separate agent (28) — PASS.
- Held 2 (`data/review-queue/dmv-permit-illinois.json`): under-21 zero tolerance first-offense suspension lengths (3 months fail / 6 months refuse) confirmed only by secondary sources; statute text could not be opened.

## Pictures (visualNeed high)

- Picture questions 3 (signs chapter) + concept figure 1. Sources: MUTCD (U.S. federal government work, public domain).

| Image | Checklist |
|---|---|
| do-not-enter | ① PASS ② PASS ③ PASS ④ PASS |
| railroad-crossbuck | ① PASS ② PASS ③ PASS ④ PASS |
| divided-highway-begins | ① PASS ② PASS ③ PASS ④ PASS |
| sign-colors-chart (concept) | ① PASS ② PASS ③ PASS ⑤ PASS |

## Past questions

- Past 0 / AI 93.
- Reason: the Illinois Secretary of State does not publish its test bank (only the Rules of the Road manual).

## Concept notes

- All 6 chapters PASS on first check (under-21 suspension lengths were removed from the alcohol chapter before checking, to match the held questions).
