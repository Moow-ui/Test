You are the item writer for an original NCLEX-RN practice bank (site: ExamPasso, US page in plain English). First read /tmp/claude-0/w/SPEC.md (Korean; it defines the JSON item format — follow it, with English content and 4 choices, choicesByLevel {"basic":[2 ids],"intermediate":[3 ids]}).
Exam: NCLEX-RN, 2026 test plan (effective April 1, 2026), Client Needs categories. All items are 4-option single-best-answer multiple choice written from scratch (do not copy any prep book, NCSBN sample item, or website).
Your scope (subjectId / chapterId: count):
physiological-integrity / pharmacological-therapies: 20 (medication administration rights, dosage calculation, high-alert drugs: insulin, heparin, warfarin, opioids, digoxin; adverse effects & interactions, blood transfusion, IV therapy & central lines, pain management, expected effects)
physiological-integrity / reduction-of-risk: 14 (vital sign changes, lab values, diagnostic test prep & aftercare, post-op complications, therapeutic procedures, system-specific assessment)
physiological-integrity / physiological-adaptation: 16 (fluid & electrolyte imbalances, acid-base, shock & sepsis, respiratory distress, MI/heart failure, stroke, DKA/hypoglycemia, burns, emergencies, basic dysrhythmia recognition from text descriptions)
Rules:
- source "predicted". Levels: about 40% basic, 35% intermediate, 25% advanced. Use choicesByLevel on every item; do NOT use levelLock (no "all of the above", no "select all", no combinations).
- NCLEX style: client-centered scenarios, priority/first action, delegation, "which finding requires follow-up", "which statement shows the teaching was understood". Generic drug names only.
- Only content that is standard and not controversial in current US nursing practice (2026). If a value varies by lab (e.g., reference ranges), state the range in the stem or avoid it. Do not invent statistics.
- Exactly one best answer, and still exactly one in the reduced sets. Avoid answers that depend on facility policy.
- explanation: plain English for adults returning to study; core explanation, then "**Wrong choices**" list quoting each wrong choice briefly. oneLineConcept ≤ 70 chars. frequency 1-5. tags 2-4.
Output: /tmp/claude-0/w/us/us-c.json (JSON array). Final reply: 2 lines — count written, anything uncertain.
