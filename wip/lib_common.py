import json, random
def make(certId, subjectOf, label, OUT, seed, nchoices=4):
    """OUT items: dict(ch,lvl,stem,correct,wrongs[(text,reason)],concept,core,freq,tags,lock,img)"""
    rnd = random.Random(seed)
    rows = []
    for q in OUT:
        pos = rnd.randrange(nchoices)
        others = [w[0] for w in q['wrongs']]
        rnd.shuffle(others)
        choices = others[:pos] + [q['correct']] + others[pos:]
        assert len(choices) == nchoices and len(set(choices)) == nchoices, q['stem']
        num = {c: k + 1 for k, c in enumerate(choices)}
        expl = q['core'] + "\n\n" + label + "\n" + "\n".join(f"- {c}: {r}" for c, r in q['wrongs'])
        r = dict(subjectId=subjectOf(q['ch']), chapterId=q['ch'], source="predicted", level=q['lvl'], stem=q['stem'],
                 choices=choices, answer=pos + 1, oneLineConcept=q['concept'], explanation=expl,
                 frequency=q['freq'], tags=q['tags'])
        if q['lock']: r['levelLock'] = True
        else: r['distractorOrder'] = "|".join(str(num[w[0]]) for w in q['wrongs'])
        if q.get('img'):
            r['image'], r['imageAlt'] = q['img'][0], q['img'][1]; r['imageSource'] = "self"
        rows.append(r)
    return rows
def emit(rows, d):
    import collections
    json.dump(rows, open(f'{d}/all.json', 'w'), ensure_ascii=False, indent=1)
    blind = [dict(n=i + 1, chapter=r['chapterId'], stem=r['stem'], choices=r['choices'], **({'image': r['image']} if 'image' in r else {})) for i, r in enumerate(rows)]
    json.dump(blind, open(f'{d}/blind.json', 'w'), ensure_ascii=False, indent=1)
    json.dump({i + 1: r['answer'] for i, r in enumerate(rows)}, open(f'{d}/key.json', 'w'))
    print(len(rows), 'basic', sum(1 for r in rows if r['level'] == 'basic' and not r.get('levelLock')),
          'int', sum(1 for r in rows if r['level'] in ('basic', 'intermediate') and not r.get('levelLock')),
          'adv', sum(1 for r in rows if r['level'] in ('intermediate', 'advanced')))
    print(collections.Counter(r['chapterId'] for r in rows))
    print('answers', collections.Counter(r['answer'] for r in rows))
