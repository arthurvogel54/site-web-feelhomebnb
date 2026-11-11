import numpy as np, wave, sys
from numpy.fft import rfft, irfft
SR=48000; DUR=76.5; N=int(SR*DUR); rng=np.random.default_rng(7)
t=np.arange(N)/SR
def hz(m): return 440*2**((m-69)/12)
# D major, 8s per chord: Dmaj9, Bm9, Gmaj7(9), A(sus4->)  
CH=[[50,57,61,64,66],[47,54,57,61,62],[43,50,54,57,62],[45,52,57,59,64]]
L=np.zeros(N);R=np.zeros(N)
seg=8.0
def env(n,a,r):
    e=np.ones(n); ai=int(a*SR); ri=int(r*SR)
    e[:ai]=np.sin(np.linspace(0,np.pi/2,ai))**2
    e[-ri:]*=np.cos(np.linspace(0,np.pi/2,ri))**2
    return e
k=0; st=0.0
while st<DUR:
    ch=CH[k%4]; s0=int(st*SR); n=min(int((seg+3)*SR),N-s0)
    tt=np.arange(n)/SR; e=env(n,2.5,3.0)
    for j,m in enumerate(ch):
        f=hz(m+12 if j>0 else m)
        for det,pan in ((-0.12,0.25),(0.0,0.5),(0.13,0.75)):
            ff=f*2**(det/12/8)
            ph=rng.uniform(0,2*np.pi)
            w=np.sin(2*np.pi*ff*tt+ph)+0.28*np.sin(4*np.pi*ff*tt+ph)+0.08*np.sin(6*np.pi*ff*tt+ph)
            amp=(0.05 if j>0 else 0.07)*e*(1+0.15*np.sin(2*np.pi*0.11*tt+j))
            L[s0:s0+n]+=w*amp*(1-pan); R[s0:s0+n]+=w*amp*pan
    # sparse felt-piano arpeggio
    for b in range(8):
        if rng.random()<0.62:
            m=ch[rng.integers(1,len(ch))]+24 - (12 if rng.random()<0.4 else 0)
            p0=int((st+b*1.0+rng.uniform(0,0.04))*SR)
            if p0>=N-SR: continue
            n2=min(int(3.5*SR),N-p0); t2=np.arange(n2)/SR; f=hz(m)
            v=sum(a*np.sin(2*np.pi*f*h*t2)*np.exp(-t2*(1.6+h*1.2)) for h,a in ((1,1),(2,.35),(3,.12),(4,.05)))
            v*=np.minimum(t2/0.006,1)*0.06*rng.uniform(0.7,1)
            pan=rng.uniform(0.3,0.7)
            L[p0:p0+n2]+=v*(1-pan); R[p0:p0+n2]+=v*pan
    st+=seg; k+=1
# reverb: convolution with decaying noise IR
irn=int(3.2*SR); ti=np.arange(irn)/SR
def ir(): 
    x=rng.standard_normal(irn)*np.exp(-ti*2.2); x[:int(0.02*SR)]*=np.linspace(0,1,int(0.02*SR)); return x/np.sqrt((x**2).sum())
def conv(a,b):
    m=len(a)+len(b); n=1<<(m-1).bit_length(); return irfft(rfft(a,n)*rfft(b,n),n)[:len(a)]
L2=0.7*L+0.55*conv(L,ir()); R2=0.7*R+0.55*conv(R,ir())
fade=np.ones(N); fi=int(2*SR); fo=int(4*SR)
fade[:fi]=np.linspace(0,1,fi)**2; fade[-fo:]=np.linspace(1,0,fo)**1.5
S=np.stack([L2,R2],1)*fade[:,None]
S/=np.abs(S).max(); S*=0.6  # ~ -4.4 dBFS peak
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((S*32767).astype('<i2').tobytes())
