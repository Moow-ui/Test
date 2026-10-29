OUT=[]
def Q(ch,lvl,stem,correct,wrongs,concept,core,freq=3,tags=(),lock=False,img=None):
    OUT.append(dict(ch=ch,lvl=lvl,stem=stem,correct=correct,wrongs=wrongs,concept=concept,core=core,freq=freq,tags=list(tags),lock=lock,img=img))
