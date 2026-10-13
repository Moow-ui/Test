import math, random
OUT="/home/user/Test/data/certs/US/nclex-rn/assets/"
PX_S=125.0   # 25 px per 0.2 s
PX_MV=50.0
W=625
def g(t,mu,sd,a): return a*math.exp(-((t-mu)**2)/(2*sd*sd))
def beat(t, p=True):
    v=0
    if p: v+=g(t,-0.16,0.025,0.15)
    v+=g(t,-0.025,0.008,-0.12)+g(t,0,0.011,1.2)+g(t,0.028,0.009,-0.3)
    v+=g(t,0.24,0.045,0.28)
    return v
def nsr(t):
    rr=0.8; return sum(beat(t-(0.3+i*rr)) for i in range(-1,10))
def afib_factory(seed):
    r=random.Random(seed); times=[]; x=0.25
    while x<6.5:
        times.append(x); x+=r.choice([0.42,0.95,0.6,0.78,0.5,1.05,0.68,0.47,0.88,0.55])
    ph=[r.uniform(0,6.28) for _ in range(4)]
    def f(t):
        v=sum(beat(t-tt,p=False) for tt in times)
        v+=0.04*math.sin(2*math.pi*6.3*t+ph[0])+0.03*math.sin(2*math.pi*8.7*t+ph[1])+0.03*math.sin(2*math.pi*5.1*t+ph[2])+0.02*math.sin(2*math.pi*11.3*t+ph[3])
        return v
    return f
def vf_factory(seed):
    r=random.Random(seed); knots=[]; t=-0.1; sign=1
    while t<6.6:
        d=r.uniform(0.06,0.14); a=r.uniform(0.15,0.95)*(0.55+0.45*abs(math.sin(t*0.9+0.4)))
        knots.append((t,t+d,sign*a)); t+=d; sign=-sign
    def f(t):
        for a0,a1,amp in knots:
            if a0<=t<a1:
                u=(t-a0)/(a1-a0); return amp*math.sin(math.pi*u)**1.3+0.02*math.sin(2*math.pi*13*t)
        return 0
    return f
def asys(t):
    return 0.06*math.sin(2*math.pi*0.18*t+0.5)+0.025*math.sin(2*math.pi*0.55*t+2)+0.008*math.sin(2*math.pi*7.3*t)
def grid(x0,y0,w,h):
    s=[]
    for i in range(0,w+1,5):
        if i%25: s.append(f'M{x0+i} {y0}v{h}')
    m=[f'M{x0+i} {y0}v{h}' for i in range(0,w+1,25)]
    for j in range(0,h+1,5):
        (m if j%25==0 else s).append(f'M{x0} {y0+j}h{w}')
    return (f'<path d="{"".join(s)}" stroke="#eee" stroke-width="0.6" fill="none"/>'
            f'<path d="{"".join(m)}" stroke="#ccc" stroke-width="1" fill="none"/>')
def trace(f,x0,ybase,step=1,w=None):
    w=w or W
    pts=[]
    for i in range(0,w+1,step):
        t=i/PX_S; pts.append(f'{x0+i},{ybase-f(t)*PX_MV:.1f}')
    return f'<polyline points="{" ".join(pts)}" fill="none" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>'
def txt(x,y,s,size=15,bold=False,anchor="start"):
    fw=' font-weight="bold"' if bold else ''
    return f'<text x="{x}" y="{y}" font-family="sans-serif" font-size="{size}"{fw} text-anchor="{anchor}" fill="#111">{s}</text>'
def single(name,f):
    H=150; x0=10; y0=30
    body=[grid(x0,y0,W,H),txt(x0,22,"Lead II",18,True),trace(f,x0,y0+90),
          txt(x0+W,22,"1 large box = 0.20 s",16,anchor="end")]
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W+20} {y0+H+10}" width="{W+20}" height="{y0+H+10}"><rect width="100%" height="100%" fill="#fff"/>'+"".join(body)+'</svg>'
    open(OUT+name,"w").write(svg); print(name,len(svg))
single("ecg-strip-vf.svg",vf_factory(7))
single("ecg-strip-asystole.svg",asys)
single("ecg-strip-afib.svg",afib_factory(3))
# concept figure
H=125; x0=10; W2=500; rows=[("Normal sinus rhythm","Regular rhythm; a P wave before every QRS",nsr,80,1),
 ("Atrial fibrillation","Irregularly irregular; no P waves; wavy baseline",afib_factory(3),80,1),
 ("Ventricular fibrillation","Chaotic waves; no QRS; no pulse; shockable",vf_factory(7),62,2),
 ("Asystole","Nearly flat line; no activity; not shockable",asys,62,2)]
parts=[]; y=0
for title,desc,f,base,st in rows:
    parts.append(txt(x0,y+22,title,20,True)+txt(x0,y+46,desc,16))
    parts.append(grid(x0,y+56,W2,H)); parts.append(trace(f,x0,y+56+base,st,W2)); y+=56+H+16
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W2+20} {y}" width="{W2+20}" height="{y}"><rect width="100%" height="100%" fill="#fff"/>'+"".join(parts)+'</svg>'
open(OUT+"ecg-rhythms-compare.svg","w").write(svg); print("compare",len(svg))
