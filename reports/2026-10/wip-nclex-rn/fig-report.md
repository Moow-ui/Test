# NCLEX-RN ECG figures - independent verification (2026-10-12)

Blind solve (stem + picture only, /tmp/claude-0/w/verify/fig.ans.json): Q1 = 2, Q2 = 3, Q3 = 4 -- all high confidence; matches the keyed answers in questions.json.

## Question figures
- ecg-strip-vf.png: ① PASS ② PASS ③ PASS ④ PASS
  - Chaotic waves of varying amplitude/shape, no P/QRS/T, no isoelectric baseline; ~30 deflections in 5 s (~360/min) -- standard coarse VF. Grid 25 large boxes x 0.20 s = 5 s, matches alt "about 5 seconds".
- ecg-strip-asystole.png: ① PASS ② PASS ③ PASS ④ PASS
  - Near-flat line, slight drift + tiny ripple, no complexes. Not a perfectly straight line (realistic). Stem's lead/gain/second-lead check rules out fine VF/artifact.
- ecg-strip-afib.png: ① PASS ② PASS ③ PASS ④ PASS
  - 7 narrow QRS (~0.04-0.06 s) in 5 s = ~84/min (stem "about 90/min" consistent); RR approx 0.78/0.55/0.88/0.60/1.05/0.55 s = irregularly irregular; no P waves; fibrillatory baseline, not sawtooth (flutter excluded).
- Picture does not give answer away: no rhythm names/labels on question strips (only "Lead II" and the scale). imageAlt texts describe morphology only and do not name the rhythm: PASS (all 3).

## Concept figure ecg-rhythms-compare.png: ① PASS ② PASS ③ PASS ⑤ PASS
- NSR: regular RR = 4 large boxes (0.80 s, 75/min), upright P before every QRS, PR ~0.16-0.18 s, narrow QRS, T wave -- standard.
- AFib / VF / asystole panels match the question strips (same morphology); subtitles correct ("shockable" for VF, "not shockable" for asystole).
- Caption and alt accurate and consistent with the panels and with the question explanations.
- Note (not a FAIL): concept panels have no "1 large box = 0.20 s" scale label; no numeric claim depends on it.

## Reduced choice sets (1-based, per lib/schemas.ts)
- Q1 basic [1,2], intermediate [1,2,3]: answer 2 present, exactly one correct, basic subset of intermediate: PASS
- Q2 basic [1,3], intermediate [1,2,3]: answer 3 present, exactly one correct: PASS
- Q3 basic [3,4], intermediate [2,3,4]: answer 4 present, exactly one correct: PASS

## Step 3 - explanation facts vs current AHA adult ACLS guidance
- Q1: PASS. VF/pVT = shockable; defibrillate ASAP, CPR until shock and 2 min after; sync cardioversion needs QRS / for unstable with pulse; amiodarone only for shock-refractory VF/pVT; atropine not in arrest algorithm.
- Q2: PASS. Asystole non-shockable; CPR + epinephrine 1 mg IV/IO ASAP then q3-5 min; rhythm check q2 min; H's & T's; pacing not recommended in asystolic arrest; atropine removed from arrest algorithm (2010) -- all current.
- Q3: PASS. AFib criteria correct; stroke risk -> anticoagulant adherence + bleeding/stroke-sign teaching appropriate for stable client; distractor rationales (VT wide/regular, sinus arrhythmia has P waves, flutter sawtooth) correct.

## Result
All 4 figures PASS all checklist items; all 3 questions PASS. OK to publish.
