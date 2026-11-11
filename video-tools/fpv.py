import sys, json, math, subprocess, functools, numpy as np, cv2
from multiprocessing import Pool
MP=sys.argv[1]; OUT=sys.argv[2]; MODE=sys.argv[3]  # preview|final
RW,RH=(640,360) if MODE=="preview" else (2560,1440)
OW,OH=(640,360) if MODE=="preview" else (3840,2160)
FPS=30; HFOV=math.radians(94); PITCH=math.radians(-4); CEIL=2.5
L=json.load(open(f"{MP}/model.json"))['data']['model']['locations']
def quat(q):
    x,y,z,w=q['x'],q['y'],q['z'],q['w']
    return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
POS=[np.array([l['pano']['position'][k] for k in 'xyz']) for l in L]
ROT=[quat(l['pano']['rotation']) for l in L]
DEP={**{i:1.7 for i in (2,9,13,14,20,21,7,10,5,6,12,26,27)},**{i:3.3 for i in (1,8,23,25,15,24,22,17,19,3)},**{i:2.7 for i in (4,16,29,28,18)},0:12.0}

@functools.lru_cache(maxsize=4)
def atlas(i):
    fs=[cv2.imread(f"{MP}/pano/{i:02d}_{f}.jpg") for f in range(6)]
    return np.vstack([cv2.copyMakeBorder(f,2,2,2,2,cv2.BORDER_REPLICATE) for f in fs])

def cam_rays(yaw,pitch,roll,W,H):
    f=(W/2)/math.tan(HFOV/2)
    xs=(np.arange(W,dtype=np.float32)-W/2+0.5)/f; ys=-(np.arange(H,dtype=np.float32)-H/2+0.5)/f
    X,Y=np.meshgrid(xs,ys)
    # camera frame x right,y up,z fwd -> apply roll, pitch, yaw ; world z-up, yaw about z (0 = +x)
    cr,sr=math.cos(roll),math.sin(roll)
    X,Y=X*cr-Y*sr, X*sr+Y*cr
    Z=np.ones_like(X)
    cp,sp=math.cos(pitch),math.sin(pitch)
    Y,Z=Y*cp+Z*sp, -Y*sp+Z*cp      # pitch up positive
    cy,sy=math.cos(yaw),math.sin(yaw)
    # world: fwd(Z)->(cy,sy,0), right(X)->(sy,-cy,0), up(Y)->(0,0,1)
    return np.stack([Z*cy+X*sy, Z*sy-X*cy, Y],-1)

def render_pano(i,C,rays):
    P=POS[i]; D=DEP[i]; floor=P[2]-1.38 if i else P[2]-1.37
    o=C-P
    rx,ry,rz=rays[...,0],rays[...,1],rays[...,2]
    with np.errstate(divide='ignore',invalid='ignore'):
        tz=np.where(rz<-1e-6,(floor-C[2])/rz,np.where(rz>1e-6,(floor+CEIL-C[2])/rz,np.inf))
        a=rx*rx+ry*ry; b=2*(o[0]*rx+o[1]*ry); c=o[0]**2+o[1]**2-D*D
        tc=(-b+np.sqrt(np.maximum(b*b-4*a*c,0)))/(2*a)
    t=np.minimum(tz,tc) if i else tc*0+np.where(rz<-1e-6,np.minimum(tz,tc),tc)
    v=o+rays*t[...,None]
    l=v@ROT[i]                     # = R^T v
    x,y,z=-l[...,1],l[...,2],l[...,0]
    ax,ay,az=np.abs(x),np.abs(y),np.abs(z)
    S=2048; B=S+4
    face=np.where((ay>=ax)&(ay>=az),np.where(y>0,0,5),np.where(az>=ax,np.where(z>0,1,3),np.where(x>0,2,4)))
    with np.errstate(divide='ignore',invalid='ignore'):
        u=np.select([face==0,face==1,face==2,face==3,face==4,face==5],[x/ay,x/az,-z/ax,-x/az,z/ax,x/ay])
        w=np.select([face==0,face==1,face==2,face==3,face==4,face==5],[z/ay,-y/az,-y/ax,-y/az,-y/ax,-z/ay])
    mx=((u+1)*0.5*S-0.5+2).astype(np.float32); my=((w+1)*0.5*S-0.5+2+face*B).astype(np.float32)
    return cv2.remap(atlas(i),mx,my,cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE)

# ---------------- flight plan ----------------
PATH=[21,13,10,1,8,25,23,24,22,15,17,19,3,8,10,7,27,12,6,27,4,16,29,28,18]
# path idx -> (seconds, lon_from, lon_to) ; lon read on the pano's equirect (deg, + = right)
PAUSE={4:(3.2,-110,15),7:(3.4,-75,80),12:(2.2,-95,100),18:(2.4,-45,50),22:(1.8,-140,-165),24:(3.6,-110,-79)}
def lon2yaw(i,lon):
    v=ROT[i]@np.array([math.cos(math.radians(lon)),-math.sin(math.radians(lon)),0]); return math.atan2(v[1],v[0])
SPEED=1.05
pts=np.array([POS[i][:2] for i in PATH]); zs=np.array([POS[i][2] for i in PATH])
def cr(p0,p1,p2,p3,u):
    return 0.5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u**3)
SM=[]  # dense samples (s, xy)
for k in range(len(PATH)-1):
    p0=pts[max(k-1,0)];p1=pts[k];p2=pts[k+1];p3=pts[min(k+2,len(PATH)-1)]
    for u in np.linspace(0,1,60,endpoint=False): SM.append((k+u,cr(p0,p1,p2,p3,u)))
SM.append((len(PATH)-1,pts[-1]))
Ss=np.array([s for s,_ in SM]); XY=np.array([p for _,p in SM])
arc=np.concatenate([[0],np.cumsum(np.linalg.norm(np.diff(XY,axis=0),axis=1))])
def s_at_arc(a): return np.interp(a,arc,Ss)
def xy_at_s(s): return np.array([np.interp(s,Ss,XY[:,0]),np.interp(s,Ss,XY[:,1])])
def arc_at_s(s): return np.interp(s,Ss,arc)
# timeline of interior: list of (t, arc, sweep)
INTRO=5.5; XF=0.7
keys=[]; t=INTRO-XF; a=0.0
def ease_speed(x): return x
for k in range(len(PATH)-1):
    a1=arc_at_s(k+1)
    seg=(a1-a)/SPEED; keys.append(('move',t,seg,a,a1)); t+=seg; a=a1
    if k+1 in PAUSE:
        d,la,lb=PAUSE[k+1]; pi_=PATH[k+1]; keys.append(('hold',t,d,a,(lon2yaw(pi_,la),lon2yaw(pi_,la)-math.radians(lb-la)))); t+=d
TOTAL=t+1.2
# global speed easing: smooth start
def state(t):
    for kd in keys:
        typ,t0,d=kd[0],kd[1],kd[2]
        if t<t0+d:
            u=min(max((t-t0)/d,0),1)
            if typ=='move':
                # ease in/out only around holds and ends
                return kd[3]+(kd[4]-kd[3])*u, 0.0
            else:
                e=u*u*(3-2*u); return kd[3], kd[4][0]+(kd[4][1]-kd[4][0])*e
    return arc[-1],(keys[-1][4][1] if keys[-1][0]=='hold' else None)
# ease velocity near holds: smooth the arc(t) curve
TT=np.arange(0,TOTAL+2,1/FPS)
ST=[state(max(x,INTRO-XF)) for x in TT]
AR=np.array([a for a,_ in ST]); OV=[o for _,o in ST]
def gsmooth(v,sig):
    k=np.exp(-0.5*(np.arange(-3*sig,3*sig+1)/sig)**2); k/=k.sum()
    vp=np.pad(v,(len(k)//2,len(k)//2),mode='edge'); return np.convolve(vp,k,'valid')
AR=gsmooth(AR,int(0.35*FPS))
SV=s_at_arc(AR)
POSX=np.array([xy_at_s(s) for s in SV])
LA=np.array([xy_at_s(s_at_arc(min(a+1.5,arc[-1]))) for a in AR])
dirv=LA-POSX
yaw=np.unwrap(np.arctan2(dirv[:,1],dirv[:,0]))
# where lookahead degenerate (end), keep last
for i in range(1,len(yaw)):
    if np.linalg.norm(dirv[i])<0.05: yaw[i]=yaw[i-1]
yaw=np.unwrap(yaw)
last=None
for i in range(len(yaw)):
    o=OV[i]
    if o is None and i>0 and last is not None and AR[i]>=arc[-1]-1e-6: o=last
    if o is not None:
        yaw[i]=o+2*math.pi*round((yaw[i-1 if i else 0]-o)/(2*math.pi)); last=o
yaw=gsmooth(yaw,int(0.45*FPS))
rate=np.gradient(yaw)*FPS
ROLL=np.clip(-0.07*gsmooth(rate,int(0.2*FPS)),-0.12,0.12)
Z=np.interp(SV,np.arange(len(PATH)),zs)
# intro (exterior pano 0)
l=np.array([math.cos(math.radians(5)),-math.sin(math.radians(5)),0]); house=ROT[0]@l
HY=math.atan2(house[1],house[0])
NF=int(TOTAL*FPS)
FADE_IN=1.0; FADE_OUT=2.2

def interior(f):
    k=min(f,len(SV)-1); s=SV[k]
    C=np.array([POSX[k][0],POSX[k][1],Z[k]])
    rays=cam_rays(yaw[k],PITCH,ROLL[k],RW,RH)
    i0=int(math.floor(s)); fr=s-i0
    if i0>=len(PATH)-1: i0=len(PATH)-2; fr=1.0
    wb=min(max((fr-0.3)/0.4,0),1); wb=wb*wb*(3-2*wb)
    out=None
    if wb<1: out=render_pano(PATH[i0],C,rays)
    if wb>0:
        b=render_pano(PATH[i0+1],C,rays)
        out=b if out is None else cv2.addWeighted(out,1-wb,b,wb,0)
    return out
def exterior(t):
    u=min(t/INTRO,1); e=u*u*(3-2*u)
    y=HY+math.radians(-55)*(1-e)**1.5
    C=POS[0]+np.array([math.cos(HY),math.sin(HY),0])*(3.2*u**1.6)+np.array([0,0,-0.15*e])
    rays=cam_rays(y,math.radians(-2)+math.radians(4)*e,-0.06*(1-u),RW,RH)
    return render_pano(0,C,rays)
def frame(f):
    t=f/FPS
    if t<INTRO-XF: img=exterior(t)
    elif t<INTRO:
        w=(t-(INTRO-XF))/XF; w=w*w*(3-2*w)
        img=cv2.addWeighted(exterior(t),1-w,interior(f),w,0)
    else: img=interior(f)
    g=1.0
    if t<FADE_IN: g=t/FADE_IN
    if t>TOTAL-FADE_OUT: g=max(0,(TOTAL-t)/FADE_OUT)
    if g<1: img=cv2.convertScaleAbs(img,alpha=0.5-0.5*math.cos(math.pi*g))
    if (RW,RH)!=(OW,OH):
        img=cv2.resize(img,(OW,OH),interpolation=cv2.INTER_LANCZOS4)
        bl=cv2.GaussianBlur(img,(0,0),1.6); img=cv2.addWeighted(img,1.35,bl,-0.35,0)
    return img.tobytes()

if __name__=="__main__":
    print(f"total {TOTAL:.1f}s frames {NF}",flush=True)
    enc=["ffmpeg","-y","-v","error","-f","rawvideo","-pix_fmt","bgr24","-s",f"{OW}x{OH}","-r",str(FPS),"-i","-"]
    if MODE=="preview": enc+=["-c:v","libx264","-preset","veryfast","-crf","22","-pix_fmt","yuv420p",OUT]
    else: enc+=["-c:v","libx264","-preset","fast","-crf","17","-profile:v","high","-level:v","5.1","-pix_fmt","yuv420p",
                "-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-movflags","+faststart",OUT]
    p=subprocess.Popen(enc,stdin=subprocess.PIPE)
    with Pool(4) as pool:
        for b0 in range(0,NF,24):
            for buf in pool.map(frame,range(b0,min(NF,b0+24)),chunksize=6): p.stdin.write(buf)
            if b0%480==0: print(b0,flush=True)
    p.stdin.close(); p.wait()
