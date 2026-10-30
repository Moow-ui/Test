import random
QUESTIONS = []
SUBJECT = {}
_rng = random.Random(20261031)
def Q(ch, level, stem, choices, concept, core, reasons, freq, tags, lock=False):
    assert len(choices) == 4 and len(reasons) == 3 and len(set(choices)) == 4, stem
    assert len(concept) <= 70, concept
    order = [0, 1, 2, 3]
    _rng.shuffle(order)  # order[newpos] = original index
    new_choices = [choices[i] for i in order]
    pos = {orig: newpos + 1 for newpos, orig in enumerate(order)}
    expl = core + "\n\n**틀린 선지**\n" + "\n".join(f"- {choices[i+1]}: {reasons[i]}" for i in range(3))
    q = {"certId": "computerized-accounting-1", "subjectId": SUBJECT[ch], "chapterId": ch,
         "source": "predicted", "level": level, "stem": stem, "choices": new_choices,
         "answer": pos[0], "oneLineConcept": concept, "explanation": expl,
         "frequency": freq, "tags": tags}
    if lock:
        q["levelLock"] = True
    else:
        q["choicesByLevel"] = {"basic": sorted([pos[0], pos[1]]), "intermediate": sorted([pos[0], pos[1], pos[2]])}
    QUESTIONS.append(q)
