import json,lib,collections
for f in ['q1','q2','q3','q4','q5']: __import__(f)
rows=lib.build('beautician-nail','written')
json.dump(rows,open('all.json','w'),ensure_ascii=False,indent=1)
blind=[dict(n=i+1,chapter=r['chapterId'],stem=r['stem'],choices=r['choices'],**({'image':r['image']} if 'image' in r else {})) for i,r in enumerate(rows)]
json.dump(blind,open('blind.json','w'),ensure_ascii=False,indent=1)
json.dump({i+1:r['answer'] for i,r in enumerate(rows)},open('key.json','w'))
c=collections.Counter((r['level'],bool(r.get('levelLock'))) for r in rows);print(len(rows),c)
print(collections.Counter(r['chapterId'] for r in rows))
print('basic',sum(1 for r in rows if r['level']=='basic' and not r.get('levelLock')),'int',sum(1 for r in rows if r['level'] in('basic','intermediate') and not r.get('levelLock')),'adv',sum(1 for r in rows if r['level'] in('intermediate','advanced')))
print(collections.Counter(r['answer'] for r in rows))
