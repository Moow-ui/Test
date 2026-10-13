You are the item writer for an original NCLEX-RN practice bank (site: ExamPasso, US page in plain English). First read /tmp/claude-0/w/SPEC.md (Korean; it defines the JSON item format — follow it, with English content and 4 choices, choicesByLevel {"basic":[2 ids],"intermediate":[3 ids]}).
Exam: NCLEX-RN, 2026 test plan (effective April 1, 2026), Client Needs categories. All items are 4-option single-best-answer multiple choice written from scratch (do not copy any prep book, NCSBN sample item, or website).
Your scope (subjectId / chapterId: count):
health-promotion / lifespan-care: 7 (growth & development milestones, antepartum, intrapartum, postpartum, newborn care, aging process)
health-promotion / prevention-screening: 6 (screening, immunizations principles, health risk behaviors, teaching/learning, self-care)
psychosocial-integrity / therapeutic-communication: 6 (therapeutic communication, grief and loss, crisis intervention, abuse/neglect reporting, cultural awareness, end-of-life)
psychosocial-integrity / mental-health: 7 (anxiety, depression, bipolar, schizophrenia, dementia/delirium, suicide risk, substance use & withdrawal, therapeutic milieu)
physiological-integrity / basic-care-comfort: 12 (mobility/immobility, elimination, nutrition & dysphagia, hygiene, rest & sleep, non-drug comfort, assistive devices)
Rules:
- source "predicted". Levels: about 40% basic, 35% intermediate, 25% advanced. Use choicesByLevel on every item; do NOT use levelLock (no "all of the above", no "select all", no combinations).
- NCLEX style: client-centered scenarios, priority/first action, delegation, "which finding requires follow-up", "which statement shows the teaching was understood". Generic drug names only.
- Only content that is standard and not controversial in current US nursing practice (2026). If a value varies by lab (e.g., reference ranges), state the range in the stem or avoid it. Do not invent statistics.
- Exactly one best answer, and still exactly one in the reduced sets. Avoid answers that depend on facility policy.
- explanation: plain English for adults returning to study; core explanation, then "**Wrong choices**" list quoting each wrong choice briefly. oneLineConcept ≤ 70 chars. frequency 1-5. tags 2-4.
Output: /tmp/claude-0/w/us/us-b.json (JSON array). Final reply: 2 lines — count written, anything uncertain.
