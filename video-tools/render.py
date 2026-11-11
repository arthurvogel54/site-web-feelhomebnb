import sys, math, subprocess, functools, numpy as np, cv2
from multiprocessing import Pool
SRC=sys.argv[1]; OUT=sys.argv[2]; PREVIEW=len(sys.argv)>3
W,H=(3840,2160) if not PREVIEW else (960,540)
FPS=30; XF=1.0  # crossfade seconds
P=lambda n:f"{SRC}/78-Grand-Rue-Apt-1-11112026_{n}.jpg"
# (photo, duration, (cx,cy,zoom) start, end)  -- zoom 1 = full photo frame
SHOTS=[
("151105",6.5,(0.50,0.50,1.00),(0.52,0.50,1.13)),
("150952",5.0,(0.42,0.50,1.18),(0.58,0.50,1.18)),
("151012",5.0,(0.45,0.52,1.15),(0.60,0.55,1.24)),
("151049",5.0,(0.50,0.50,1.22),(0.50,0.50,1.05)),
("151034",4.5,(0.40,0.50,1.16),(0.56,0.50,1.16)),
("150938",5.0,(0.46,0.55,1.05),(0.50,0.60,1.38)),
("151142",5.0,(0.50,0.50,1.00),(0.50,0.48,1.13)),
("151126",5.0,(0.60,0.50,1.18),(0.42,0.50,1.18)),
("150908",4.5,(0.68,0.50,1.55),(0.66,0.50,1.75)),
("151201",5.0,(0.45,0.62,1.28),(0.45,0.40,1.28)),
("151215",4.5,(0.58,0.50,1.10),(0.64,0.50,1.26)),
("151309",5.0,(0.40,0.50,1.16),(0.58,0.50,1.16)),
("151324",4.5,(0.50,0.50,1.00),(0.55,0.50,1.13)),
("151236",4.5,(0.60,0.50,1.16),(0.44,0.50,1.16)),
("151342",4.5,(0.50,0.50,1.05),(0.50,0.45,1.18)),
("151400",4.5,(0.44,0.50,1.16),(0.56,0.50,1.16)),
("151423",5.0,(0.50,0.50,1.00),(0.52,0.46,1.15)),
("151444",4.5,(0.40,0.50,1.13),(0.60,0.50,1.13)),
("151105",7.0,(0.51,0.50,1.16),(0.50,0.50,1.00)),
]
starts=[];t=0
for s in SHOTS: starts.append(t); t+=s[1]-XF
TOTAL=t+XF; NF=int(round(TOTAL*FPS))
FADE_IN=1.2; FADE_OUT=2.0

@functools.lru_cache(maxsize=3)
def load(i):
    name,d,a,b=SHOTS[i]
    im=cv2.imread(P(name),cv2.IMREAD_COLOR)
    zmax=max(a[2],b[2])
    tw=int(round(W*zmax*1.05)); th=int(round(tw*im.shape[0]/im.shape[1]))
    if tw<im.shape[1]: im=cv2.resize(im,(tw,th),interpolation=cv2.INTER_AREA)
    return im

def ease(u):
    s=0.5-0.5*math.cos(math.pi*u)
    return 0.55*u+0.45*s

def render_shot(i,tl):
    name,d,a,b=SHOTS[i]; im=load(i); ih,iw=im.shape[:2]
    u=min(max(tl/d,0),1); e=ease(u)
    cx,cy,z=[a[k]+(b[k]-a[k])*e for k in range(3)]
    # zoom interpolated geometrically for constant perceived speed
    z=a[2]*(b[2]/a[2])**e
    cw=iw/z; ch=cw*H/W
    if ch>ih: ch=ih; cw=ch*W/H
    x0=min(max(cx*iw-cw/2,0),iw-cw); y0=min(max(cy*ih-ch/2,0),ih-ch)
    s=W/cw
    M=np.array([[s,0,-x0*s],[0,s,-y0*s]],np.float32)
    return cv2.warpAffine(im,M,(W,H),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)

def frame(f):
    t=f/FPS; imgs=[]
    for i,(st,s) in enumerate(zip(starts,SHOTS)):
        if st-1e-9<=t<st+s[1]:
            tl=t-st
            w=1.0
            if i>0 and tl<XF: w=min(w,tl/XF)
            if i<len(SHOTS)-1 and tl>s[1]-XF: w=min(w,(s[1]-tl)/XF)
            w=0.5-0.5*math.cos(math.pi*w)
            imgs.append((render_shot(i,tl),w))
    if len(imgs)==1: out=imgs[0][0]
    else:
        (a,wa),(b,wb)=imgs; out=cv2.addWeighted(a,wa/(wa+wb),b,wb/(wa+wb),0)
    g=1.0
    if t<FADE_IN: g=t/FADE_IN
    if t>TOTAL-FADE_OUT: g=max(0,(TOTAL-t)/FADE_OUT)
    g=0.5-0.5*math.cos(math.pi*g) if g<1 else 1
    if g<1: out=cv2.convertScaleAbs(out,alpha=g)
    return out.tobytes()

if __name__=="__main__":
    print(f"{len(SHOTS)} shots, {TOTAL:.2f}s, {NF} frames",flush=True)
    enc=["ffmpeg","-y","-v","error","-f","rawvideo","-pix_fmt","bgr24","-s",f"{W}x{H}","-r",str(FPS),"-i","-"]
    if PREVIEW: enc+=["-c:v","libx264","-preset","veryfast","-crf","23","-pix_fmt","yuv420p",OUT]
    else: enc+=["-c:v","libx264","-preset","fast","-crf","17","-profile:v","high","-level:v","5.1",
                "-pix_fmt","yuv420p","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709",
                "-x264-params","keyint=60:min-keyint=30:aq-mode=3","-tune","film",OUT]
    p=subprocess.Popen(enc,stdin=subprocess.PIPE)
    with Pool(4) as pool:
        for b0 in range(0,NF,24):
            for buf in pool.map(frame,range(b0,min(NF,b0+24)),chunksize=6): p.stdin.write(buf)
            if b0%240==0: print(b0,flush=True)
    p.stdin.close(); p.wait()
