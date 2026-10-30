# cna-nurse-aide — author notes (2026-10-31 KST)

## Files written
- data/certs/US/cna-nurse-aide/meta.json, chapters.json, concepts.json (no verifiedAt)
- data/certs/US/cna-nurse-aide/assets/: fowlers-position.svg, lifting-from-floor.svg, wheelchair-placement.svg, body-mechanics-compare.svg
- scratchpad draft: cna-nurse-aide/draft.json (141 questions, no id, no reviewedAt); generator in cna-nurse-aide/gen/ (q1–q3.py data, build.py shuffles with seed 20261031)
- data/certs/US/cna-nurse-aide/questions/ is empty (questions not imported yet)

## Official facts and where they came from
| Fact | Source | How confirmed |
|---|---|---|
| NNAAP exam determines nurse aide competency; passers go on state registry; **NCSBN no longer develops or owns NNAAP content, contact Credentia** | https://www.ncsbn.org/nnaap-and-mace.htm | Fetched directly (curl) |
| NNAAP written: 70 multiple-choice items, 10 pretest (unscored) → 60 scored; 2 hours | Credentia handbooks, e.g. https://credentia.com/storage/va_handbook_jan24.pdf ; outline https://credentia.com/storage/2024-nnaap-content-outline.pdf | **Search-result extracts only** (credentia.com and kb-*.credentia.com could not be reached) |
| 2024 outline (effective April 2024, from 2019–2020 job analysis): Physical Care Skills — ADL 22%/13, Basic Nursing Skills 35%/21 (infection control, safety/prevention/emergency, technical procedures, data collection & reporting), Self Care/Independence 7%/4; Psychosocial — Emotional & Mental Health 8%/5, Spiritual & Cultural 2%/1; Role of the Nurse Aide — Communication 7%/4, Client Rights 8%/5, Legal & Ethical 5%/3, Member of Health Care Team 6%/4. Total 60 | same Credentia outline PDF / kb pages | Search-result extracts; numbers are internally consistent (13+21+4+5+1+4+5+3+4 = 60; 64%+10%+26% = 100%) |
| Passing standard set by each state (no national cut score published) | Prometric nurse aide FAQ (state selects passing standard) https://www.prometric.com/nurse-aide-frequently-asked-questions/ | Search snippet only (prometric.com returned 403). Not put in meta sources. Site uses 70% as a labeled **practice goal** |
| Federal training ≥75 clock hours incl. ≥16 hours supervised practical; curriculum list | 42 CFR 483.152 | eCFR API full text (2026-10-01 version) |
| Competency eval = written or oral exam + skills demonstration; state sets passing standard; ≥3 attempts; registry entry within 30 days | 42 CFR 483.154 | eCFR API |
| Free from abuse/neglect/misappropriation/involuntary seclusion; restraints not for discipline or convenience, least restrictive; report allegations of abuse or serious bodily injury within 2 h, others within 24 h, results within 5 working days | 42 CFR 483.12 | eCFR API |
| Privacy & confidentiality (483.10(h)); refuse treatment (483.10(c)(6)); grievances; mail | 42 CFR 483.10 | eCFR API |
| Registry verification; retraining after 24 consecutive months without paid nursing-related work | 42 CFR 483.35(d) | eCFR API |
| In-service ≥12 hours/year incl. dementia management and abuse prevention | 42 CFR 483.95(g) | eCFR API |
| Hand hygiene: soap and water when visibly soiled; ABHS preferred otherwise | https://www.cdc.gov/clean-hands/hcp/clinical-safety/index.html | Search snippet only (cdc.gov blocked) |
| Normal adult BP < 120/80 | AHA categories (concepts card source "American Heart Association blood pressure categories") | Not fetched (heart.org blocked); standard textbook fact |

meta.sources uses ecfr.gov "current/title-42/section-483.xxx" URLs (the HTML page redirects bots to a federalregister.gov check page; the API content was read).

## Unreachable / blocked hosts
credentia.com, kb-pa.credentia.com (all kb-*.credentia.com), f4d7qr7samzk8am.productfruits.help (Credentia help center), ncnar.ncdhhs.gov, trademarks.justia.com, www.cdc.gov, www.heart.org, wattsschoolofnursing.org (403), prometric.com (403), unblock.federalregister.gov. ncsbn.org PDFs (2024_nnaap_content_outline.pdf, 16_NNAAP_Content_Outline.pdf, 729.htm) return 404 now.

## Trademark
- NCSBN trademark page https://trust.ncsbn.org/trademarks.page (fetched) lists NCLEX, NCSBN, Nursys, REx-PN, etc. — **NNAAP is no longer listed**.
- Search results show NNAAP registered (USPTO reg. 3821655 per Justia, not fetched) by NCSBN, and an older NCSBN booklet listing NNAAP as an NCSBN registered mark. Current owner after the hand-over to Credentia is unconfirmed.
- trademarkNotice therefore says "registered trademark of its owner; registered by NCSBN; NCSBN says it no longer develops or owns NNAAP content, now handled by Credentia", plus vendor names and a no-affiliation statement.

## 기출 미수록 사유
NNAAP and other vendors' (Prometric, Pearson VUE, Headmaster/D&S) item banks are confidential; 42 CFR 483.154(b)(1)(iv) requires the state to use a system that prevents disclosure of the question pool. Only practice packets exist (vendor copyright, not public-domain past exams). All 141 questions are original AI practice questions (source "predicted").

## Structure decisions
- totalQuestions 60 = scored items (same approach as real-estate-salesperson-national, which uses 80 scored and explains pretest in `format`). timeLimitMinutes 120.
- Subjects follow the 3 outline domains with exact scored counts: physical-care 38, psychosocial-care 6, role-of-aide 16.
- Basic Nursing Skills (21) + ADL (13) + Self-care (4) split into 6 study chapters; examWeight within physical-care (34/18/15/12/11/10) and other subjects (80/20; 25/31/19/25) are study estimates based on the outline item counts.
- relatedCertIds: ["nclex-rn"]. order 440. field "Healthcare" (same as nclex-rn).

## Counts (draft.json, 141)
| Subject | basic | intermediate | advanced (non-lock) | advanced locked | total | questionCount |
|---|---|---|---|---|---|---|
| physical-care | 25 | 32 | 17 | 5 | 79 | 38 |
| psychosocial-care | 5 | 8 | 3 | 2 | 18 | 6 |
| role-of-aide | 11 | 17 | 12 | 4 | 44 | 16 |
| **Total** | **41** | **57** | **32** | **11** | **141** | 60 |

Pools: basic card 41 (non-locked), intermediate card (basic+intermediate, non-locked) 98, advanced card (intermediate+advanced) 100.
Per chapter: daily-living 18, infection-control 14, safety-emergency 12, positioning-mobility 12, restorative-care 9, vital-signs 14, emotional-mental-health 13, spiritual-cultural 5, communication 10, client-rights 13, legal-ethical 11, care-team 10.
Answer positions: 1→33, 2→34, 3→36, 4→38 (seeded random shuffle; figure question with "Position A–D" choices kept in A–D order).
choicesByLevel = answer + the distractors written as most plausible (basic ⊂ intermediate). 11 levelLock questions (all EXCEPT style, all advanced).
`npm run questions:add -- draft.json --cert cna-nurse-aide --dry-run` → 오류 0. Import report deleted.

## Figures (chapter positioning-mobility)
| File | Use | Notes |
|---|---|---|
| fowlers-position.svg | Question (basic): name the position → Fowler's | Side view, head section ~55° |
| lifting-from-floor.svg | Question (intermediate): what to change → bend knees, straight back, load close | Same "poor" figure as left half of concept figure |
| wheelchair-placement.svg | Question (intermediate): wheelchair location → Position A (strong side, next to bed) | Top view, A–D dashed boxes |
| body-mechanics-compare.svg | Concept figure in concepts.json positioning-mobility.figures | Poor vs good lifting |
All hand-drawn SVG (#111 lines, sans-serif, viewBox, < 3 KB each, imageSource kind self). Rendered with `npm run images:render -- cna-nurse-aide` and checked by eye by the author only — still need the separate checklist (①–⑤) by a different agent.

## Points for the verifier to double-check
- Credentia 2024 outline numbers (not read directly).
- "Diabetic toenails: aide does not cut" and "politely refuse tips" are standard textbook teaching; facility policies exist but no state-dependent answer is expected.
- RACE/PASS, PPE donning order (gown, mask, eye protection, gloves) per CDC sequence.
- BP category 136/88 described as "above normal" (AHA stage 1).
