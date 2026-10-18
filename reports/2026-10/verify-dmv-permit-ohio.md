# Question verification: dmv-permit-ohio (Ohio DMV Permit Test)

- Date: 2026-10-19 (daily routine, morning)
- Method: a separate agent re-solved a file with only stems and choices (answer, explanation, oneLineConcept, choicesByLevel removed). Picture questions were solved from the rendered PNGs (`npm run images:render -- dmv-permit-ohio`). Ohio-specific numbers and rules were checked against the current statute text on codes.ohio.gov (direct access).
- Exam format: Ohio Adm. Code 4501:1-1-08 (two written parts — motor vehicle laws; signs, signals and directions — each at least 20 questions, 75% to pass) and bmv.ohio.gov GDL page (40 questions, 75%). BMV posts no time limit; practice mock uses 30 minutes.

| Written | Passed | Passed after fix | Held (review queue) |
|---|---|---|---|
| 100 | 100 | 0 | 0 |

- Re-solve 100/100 matched the key.
- Statutes checked: ORC 4507.05, 4507.071, 4507.21, 4511.13, 4511.132, 4511.21, 4511.25, 4511.27–4511.30, 4511.38, 4511.39, 4511.41–4511.46, 4511.431, 4511.62, 4511.661, 4511.68, 4511.70, 4511.75, 4511.81, 4511.204, 4511.205, 4511.213, 4513.03, 4511.19, 4511.191, 4510.02.
- Wording notes (answer unchanged, kept): speed limits are mostly prima-facie under 4511.21; the permit supervisor for a driver under 16 also includes a person acting in place of a parent under 4507.05.
- Left out while writing (could not confirm in statute text): headlight dimming distances, numeric following distance, four-way-stop arrival order, adult phone-law details, 0.17% high-test penalties.

## Pictures (visualNeed high)

- Picture questions 3 (warning-signs chapter) + concept figure 1. Source: MUTCD (U.S. federal government work, public domain).

| Image | Checklist |
|---|---|
| crossroad-ahead (W2-1) | ① PASS ② PASS ③ PASS ④ PASS |
| stop-ahead (W3-1) | ① PASS ② PASS ③ PASS ④ PASS |
| two-way-traffic (W6-3) | ① PASS ② PASS ③ PASS ④ PASS |
| warning-sign-kinds (concept) | ① PASS ② PASS ③ PASS ⑤ PASS |

## Past questions

- Past 0 / AI 100.
- Reason: the Ohio BMV does not publish its test bank (only sample questions and the Digest of Ohio Motor Vehicle Laws).

## Concept notes

- First check: 5 of 8 chapters PASS. FAIL 3 → fixed and re-checked by a new agent, all PASS:
  - speed-passing-parking: school zone 20 mph was "during school hours"; corrected to recess and while children arrive or leave, with signs posted (ORC 4511.21(B)(1)(a)). The 2 questions using the same wording (speed-passing-parking-0001, -0002) were fixed (version 2) and re-solved blind — PASS. The speed card was shortened to fit 300 characters and checked again — PASS.
  - permit-probationary: driver training and 50 hours (10 at night) apply to every new driver under 21 (ORC 4507.21); source now cites 4507.071 and 4507.21.
  - signals-markings: added sources to two rule cards (ORC 4511.13, 4511.31).
