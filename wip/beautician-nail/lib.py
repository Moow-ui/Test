import json
OUT=[]
def Q(ch,lvl,stem,correct,wrongs,concept,core,freq=3,tags=(),lock=False,img=None):
    # correct: str; wrongs: list of (choice, reason) in plausibility order
    OUT.append(dict(ch=ch,lvl=lvl,stem=stem,correct=correct,wrongs=wrongs,concept=concept,core=core,freq=freq,tags=list(tags),lock=lock,img=img))
def build(certId,subjectId,label="**틀린 선지**"):
    rows=[]
    for i,q in enumerate(OUT):
        pos=i%4
        others=[w[0] for w in q['wrongs']]
        # place wrongs in remaining slots in a rotated order
        slots=[k for k in range(4) if k!=pos]
        rot=(i//4)%3
        order=others[rot:]+others[:rot]
        choices=[None]*4; choices[pos]=q['correct']
        for s,c in zip(slots,order): choices[s]=c
        num={c:k+1 for k,c in enumerate(choices)}
        expl=q['core']+"\n\n"+label+"\n"+"\n".join(f"- {c}: {r}" for c,r in q['wrongs'])
        r=dict(subjectId=subjectId,chapterId=q['ch'],source="predicted",level=q['lvl'],stem=q['stem'],choices=choices,answer=pos+1,
               oneLineConcept=q['concept'],explanation=expl,frequency=q['freq'],tags=q['tags'])
        if q['lock']: r['levelLock']=True
        else: r['distractorOrder']="|".join(str(num[w[0]]) for w in q['wrongs'])
        if q['img']:
            r['image'],r['imageAlt']=q['img'][0],q['img'][1]; r['imageSource']="self"
        rows.append(r)
    return rows
