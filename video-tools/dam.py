import numpy as np, sys
def varint(b,i):
    r=0;s=0
    while True:
        c=b[i];i+=1;r|=(c&0x7f)<<s;s+=7
        if c<0x80: return r,i
def fields(b):
    i=0;n=len(b)
    while i<n:
        k,i=varint(b,i);f,t=k>>3,k&7
        if t==2:
            l,i=varint(b,i);yield f,t,b[i:i+l];i+=l
        elif t==0:
            v,i=varint(b,i);yield f,t,v
        elif t==5: yield f,t,b[i:i+4];i+=4
        elif t==1: yield f,t,b[i:i+8];i+=8
        else: raise ValueError(t)
def packed_varints(b):
    out=[];i=0
    while i<len(b):
        v,i=varint(b,i);out.append(v)
    return out
def load(path):
    b=open(path,'rb').read(); V=[];F=[];off=0;stats={}
    for f,t,c in fields(b):
        stats[f]=stats.get(f,0)+1
        if f!=1: continue
        verts=None;faces=None
        for f2,t2,c2 in fields(c):
            if f2==1:
                for f3,t3,c3 in fields(c2):
                    if f3==1: verts=np.frombuffer(c3,'<f4').reshape(-1,3)
            elif f2==2:
                for f3,t3,c3 in fields(c2):
                    if f3==1: faces=np.array(packed_varints(c3),np.int64).reshape(-1,3)
        if verts is None or faces is None: continue
        V.append(verts);F.append(faces+off);off+=len(verts)
    return np.vstack(V),np.vstack(F),stats
if __name__=="__main__":
    V,F,s=load(sys.argv[1]); print(s,V.shape,F.shape,V.min(0),V.max(0))
