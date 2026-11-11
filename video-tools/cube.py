import numpy as np, cv2
# Local camera frame: x=right, y=up, z=forward (view dir). Faces: 0 up,1 front,2 right,3 back,4 left,5 down
def load_cube(prefix):
    return [cv2.imread(f"{prefix}_{f}.jpg") for f in range(6)]
def sample(cube, d, interp=cv2.INTER_CUBIC):
    """d: HxWx3 directions (x right, y up, z forward). returns image"""
    x,y,z=d[...,0],d[...,1],d[...,2]
    ax,ay,az=np.abs(x),np.abs(y),np.abs(z)
    S=cube[0].shape[0]
    out=np.zeros(d.shape[:2]+(3,),np.uint8)
    # face selection & uv in [-1,1]  (u right, v down in image)
    sel=[
     (ay>=ax)&(ay>=az)&(y>0),   # up
     (az>=ax)&(az>=ay)&(z>0),   # front
     (ax>=ay)&(ax>=az)&(x>0),   # right
     (az>=ax)&(az>=ay)&(z<=0),  # back
     (ax>=ay)&(ax>=az)&(x<=0),  # left
     (ay>=ax)&(ay>=az)&(y<=0)]  # down
    uv=[
     ( x/ay,  z/ay),
     ( x/az, -y/az),
     (-z/ax, -y/ax),
     (-x/az, -y/az),
     ( z/ax, -y/ax),
     ( x/ay, -z/ay)]
    for f in range(6):
        m=sel[f]
        if not m.any(): continue
        with np.errstate(divide='ignore',invalid='ignore'):
            u,v=uv[f]
            mx=((np.nan_to_num(u)+1)*0.5*S-0.5).astype(np.float32)
            my=((np.nan_to_num(v)+1)*0.5*S-0.5).astype(np.float32)
        img=cv2.copyMakeBorder(cube[f],2,2,2,2,cv2.BORDER_REPLICATE)
        r=cv2.remap(img,mx+2,my+2,interp)
        out[m]=r[m]
    return out
def equirect(cube,W=2048):
    H=W//2
    lon=(np.arange(W)+0.5)/W*2*np.pi-np.pi; lat=np.pi/2-(np.arange(H)+0.5)/H*np.pi
    lon,lat=np.meshgrid(lon,lat)
    d=np.stack([np.cos(lat)*np.sin(lon),np.sin(lat),np.cos(lat)*np.cos(lon)],-1)
    return sample(cube,d)
