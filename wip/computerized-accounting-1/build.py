import json, collections, common
ch = json.load(open('/home/user/Test/data/certs/KR/computerized-accounting-1/chapters.json'))
for s in ch['subjects']:
    for c in s['chapters']:
        common.SUBJECT[c['id']] = s['id']
import q_fin, q_cost, q_vat
Q = common.QUESTIONS
json.dump(Q, open('draft.json','w'), ensure_ascii=False, indent=2)
print('total', len(Q))
c = collections.Counter((q['subjectId'], q['level'], bool(q.get('levelLock'))) for q in Q)
for k in sorted(c): print(k, c[k])
print('chapters', collections.Counter(q['chapterId'] for q in Q))
print('answers', collections.Counter(q['answer'] for q in Q))
basic = sum(1 for q in Q if q['level']=='basic' and not q.get('levelLock'))
inter = sum(1 for q in Q if q['level'] in ('basic','intermediate') and not q.get('levelLock'))
adv = sum(1 for q in Q if q['level'] in ('intermediate','advanced'))
print('pools basic', basic, 'inter', inter, 'adv(int+adv)', adv)
print('answer seq', ''.join(str(q['answer']) for q in Q))
