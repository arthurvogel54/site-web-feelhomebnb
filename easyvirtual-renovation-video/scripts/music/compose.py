"""
Musique originale + bruitages, générés par synthèse (libres de droits).
Calée sur la timeline de la vidéo (scripts/music/cues.json).

    npx tsx scripts/music/export-cues.ts
    python3 scripts/music/compose.py          # → public/audio/music.mp3, public/audio/sfx.mp3

Structure : intro (nappes) → constat (tension légère) → révélation marque (impact + groove)
→ scènes produit (groove) → collectivités (respiration puis reprise) → montée → « Un seul scan »
(impact) → final (cloches) → logo (impact) → fondu.
"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SR = 44100
rng = np.random.default_rng(7)

# usage : compose.py [cues.json] [préfixe de sortie]
CUES_FILE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "cues.json")
OUT_PREFIX = sys.argv[2] if len(sys.argv) > 2 else ""
cues = json.load(open(CUES_FILE))
TOTAL = cues["total"]
SC = cues["scenes"]
BRAND = SC["marque"]["start"]
ONE_SCAN = cues["hits"]["oneScan"]
OUTRO = SC["outro"]["start"]
COLL = SC["collectivites"]["start"]

# Tempo choisi pour que la marque ET « Un seul scan » tombent sur un premier temps
bars_between = max(1, round((ONE_SCAN - BRAND) / 2.4))
BAR = (ONE_SCAN - BRAND) / bars_between
BEAT = BAR / 4
print(f"tempo {240 / BAR:.2f} BPM · mesure {BAR:.3f}s")

N = int((TOTAL + 1.0) * SR)
music = np.zeros((2, N))
sfx = np.zeros((2, N))


# ------------------------------------------------------------------ outils
def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100) / (SR / 2), "low", output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), "high", output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def add(buf, t, sig, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1] or len(sig) == 0:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    n = min(len(sig), buf.shape[1] - i)
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i : i + n] += sig[:n] * gain * l * 1.414
    buf[1, i : i + n] += sig[:n] * gain * r * 1.414


def env(n, a, r, sustain_len=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if sustain_len is not None:
        e *= np.clip(1 - (t - sustain_len) / max(r, 1e-4), 0, 1)
    return e


def saw(f, n, phase=0.0):
    t = np.arange(n) / SR
    return 2 * ((f * t + phase) % 1) - 1


def section(t):
    if t < SC["constat"]["start"]:
        return "intro"
    if t < BRAND:
        return "constat"
    if COLL <= t < COLL + 2 * BAR:
        return "breakdown"
    if ONE_SCAN - BAR <= t < ONE_SCAN:
        return "build"
    if t >= OUTRO:
        return "outro"
    if t >= ONE_SCAN:
        return "finale"
    return "groove"


# ------------------------------------------------------------------ harmonie (ré majeur : I V vi IV)
VOICINGS = [
    [50, 57, 62, 66],  # D
    [45, 52, 61, 64],  # A
    [47, 54, 62, 66],  # Bm
    [43, 50, 59, 62],  # G
]


def chord_at(t):
    b = int(np.floor((t - BRAND) / BAR))
    return VOICINGS[b % 4], b


first_bar = int(np.floor((0 - BRAND) / BAR))
last_bar = int(np.ceil((TOTAL - BRAND) / BAR))

# ------------------------------------------------------------------ nappes
for b in range(first_bar, last_bar + 1):
    t0 = BRAND + b * BAR
    if t0 > TOTAL:
        break
    sec = section(max(t0, 0))
    voic = VOICINGS[b % 4]
    if sec == "outro":
        voic = [38, 50, 57, 62, 66, 69]  # accord final de ré, large
    length = BAR + 1.2
    if sec == "outro":
        length = TOTAL - t0 + 1.0
    n = int(length * SR)
    pad = np.zeros(n)
    for m in voic:
        for d in (-0.08, 0.0, 0.09):
            pad += saw(hz(m + d), n, rng.random()) / 3
    cutoff = {"intro": 900, "constat": 1100, "breakdown": 1500, "build": 2600, "finale": 2400, "outro": 2000}.get(sec, 1800)
    pad = lp(pad, cutoff, 2)
    e = env(n, 0.35 if sec != "outro" else 0.05, 1.1, BAR if sec != "outro" else length - 2.2)
    g = {"intro": 0.05, "constat": 0.05, "groove": 0.045, "breakdown": 0.06, "build": 0.055, "finale": 0.06, "outro": 0.07}[sec]
    add(music, t0, pad * e, g, pan=-0.25)
    add(music, t0 + 0.012, pad * e, g, pan=0.25)

# ------------------------------------------------------------------ arpèges (pluck)
def pluck(m, n_sec=0.5, bright=3000):
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return lp(s * np.exp(-t / 0.13), bright)


PATTERN = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 1, 3, 2]
arp_bus = np.zeros((2, N))
for b in range(first_bar, last_bar + 1):
    t0 = BRAND + b * BAR
    voic = VOICINGS[b % 4]
    tones = [voic[1] + 12, voic[2] + 12, voic[3] + 12, voic[1] + 24]
    for k in range(16):
        t = t0 + k * BEAT / 4
        if t < 0 or t > TOTAL - 1.5:
            continue
        sec = section(t)
        if sec == "intro" and k % 4:
            continue
        if sec == "constat" and k % 2:
            continue
        if sec == "outro":
            continue
        vel = 0.55 + 0.45 * (k % 4 == 0)
        g = {"intro": 0.10, "constat": 0.08, "breakdown": 0.10, "build": 0.09, "finale": 0.06}.get(sec, 0.075)
        add(arp_bus, t, pluck(tones[PATTERN[k] % 4]), g * vel, pan=0.35 if k % 2 else -0.35)
# écho ping-pong (croche pointée)
d = int(BEAT * 0.75 * SR)
echo = np.zeros_like(arp_bus)
echo[1, d:] += arp_bus[0, :-d] * 0.35
echo[0, 2 * d :] += arp_bus[0, : -2 * d] * 0.2
music += arp_bus + echo

# ------------------------------------------------------------------ batterie & basse
def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.16) + 0.3 * np.exp(-t / 0.004) * rng.standard_normal(n) * 0.2


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t / (0.08 if open_ else 0.018))


def clap():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    s = bp(rng.standard_normal(n), 900, 3500) * np.exp(-t / 0.09)
    for off in (0.008, 0.017):
        k = int(off * SR)
        s[k:] += bp(rng.standard_normal(n - k), 900, 3500) * np.exp(-t[: n - k] / 0.02) * 0.6
    return s


K = kick()
duck = np.ones(N)  # sidechain
total_beats = int((TOTAL - BRAND) / BEAT) + 1
for k in range(int(-BRAND / BEAT) - 1, total_beats):
    t = BRAND + k * BEAT
    if t < 0 or t > TOTAL - 0.5:
        continue
    sec = section(t)
    beat_in_bar = k % 4
    if sec in ("groove", "finale", "build") or (sec == "outro" and t < OUTRO + BAR):
        kg = 0.55 if sec != "finale" else 0.42
        add(music, t, K, kg)
        i = int(t * SR)
        n = int(0.32 * SR)
        duck[i : i + n] = np.minimum(duck[i : i + n], 1 - 0.55 * np.exp(-np.arange(min(n, N - i)) / SR / 0.09))
        if beat_in_bar in (1, 3) and sec in ("groove", "build"):
            add(music, t, clap(), 0.12, pan=0.05)
    if sec in ("constat", "groove", "build", "finale", "breakdown"):
        hg = {"constat": 0.035, "breakdown": 0.03}.get(sec, 0.05)
        add(music, t + BEAT / 2, hat(open_=beat_in_bar == 3 and sec == "groove"), hg, pan=0.3)
        if sec in ("groove", "build"):
            add(music, t + BEAT / 4, hat(), hg * 0.45, pan=-0.3)
            add(music, t + 3 * BEAT / 4, hat(), hg * 0.45, pan=-0.3)
    # basse en croches
    if sec in ("groove", "finale", "build") or (sec == "constat" and t > SC["constat"]["start"] + (BRAND - SC["constat"]["start"]) / 2):
        voic, _ = chord_at(t)
        root = voic[0] - 12 if voic[0] > 44 else voic[0]
        for h in (0, 0.5):
            n = int(BEAT * 0.48 * SR)
            tt = np.arange(n) / SR
            f = hz(root + (12 if h and sec != "constat" else 0))
            s = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)
            s = np.tanh(1.6 * s) * env(n, 0.005, 0.05, BEAT * 0.4)
            add(music, t + h * BEAT, lp(s, 900), 0.16 if sec != "constat" else 0.1)

# roulement de caisse avant « Un seul scan »
for j in range(16):
    t = ONE_SCAN - BAR + j * BAR / 16
    add(music, t, clap(), 0.03 + 0.1 * j / 16, pan=0)

music *= duck  # pompage léger façon sidechain

# ------------------------------------------------------------------ cloches (final)
def bell(m, dur=2.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.12)
    return s * np.exp(-t / 0.9)


MOTIF = [(0, 74), (0.75, 69), (1.5, 78), (2.5, 76), (3, 74)]  # D5 A4 F#5 E5 D5
for start in (ONE_SCAN, ONE_SCAN + 2 * BAR, OUTRO + 0.6):
    for beat, m in MOTIF:
        add(music, start + beat * BEAT, bell(m), 0.07, pan=0.2)

# ------------------------------------------------------------------ montées & impacts
def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    seg = int(0.05 * SR)
    for i in range(0, n, seg):
        p = i / n
        lo = 300 + 5000 * p**2
        out[i : i + seg] = bp(x[i : i + seg + 0], lo, lo * 1.8)[: len(out[i : i + seg])]
    up = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / dur) ** 2) / SR) * 0.15
    return (out + up) * (t / dur) ** 2


def impact():
    n = int(2.8 * SR)
    t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    noise = lp(rng.standard_normal(n), 2500) * np.exp(-t / 0.25) * 0.35
    return boom + noise


def whoosh(dur=0.75):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    seg = int(0.02 * SR)
    for i in range(0, n, seg):
        p = i / n
        c = 400 + 4200 * np.sin(np.pi * p) ** 1.5
        out[i : i + seg] = bp(x[i : i + seg], c * 0.7, c * 1.3)[: len(out[i : i + seg])]
    return out * np.sin(np.pi * t / dur) ** 2


for t_hit, rdur in ((BRAND, BAR), (ONE_SCAN, BAR), (OUTRO, 1.2)):
    add(sfx, t_hit - rdur, riser(rdur), 0.18)
    add(sfx, t_hit, impact(), 0.55)

for c in cues["cuts"]:
    if c["id"] in ("marque", "outro"):
        continue
    add(sfx, c["t"] - 0.42, whoosh(), 0.32, pan=-0.2)

# ------------------------------------------------------------------ réverb + master
def reverb(buf, seconds=2.4, wet=0.22):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(buf)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / (seconds / 5))
        ir = lp(ir, 5000)
        ir /= np.sqrt(np.sum(ir**2))
        out[ch] = fftconvolve(buf[ch], ir)[: buf.shape[1]]
    return buf + out * wet


music = reverb(music, 2.6, 0.28)
sfx = reverb(sfx, 1.8, 0.2)

# fondu final
fade_n = int(2.5 * SR)
end_i = int(TOTAL * SR)
for buf in (music, sfx):
    buf[:, end_i - fade_n : end_i] *= np.linspace(1, 0, fade_n) ** 1.5
    buf[:, end_i:] = 0
music[:, : int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))


def master(buf, peak_db=-1.0):
    buf = np.tanh(buf * 1.1)
    buf = buf / np.max(np.abs(buf)) * 10 ** (peak_db / 20)
    return buf[:, : int((TOTAL + 0.05) * SR)]


def write(buf, name):
    wav = os.path.join(ROOT, "public", "audio", name + ".wav")
    mp3 = os.path.join(ROOT, "public", "audio", name + ".mp3")
    pcm = (buf.T * 32767).astype("<i2").tobytes()
    import wave

    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "256k", mp3], check=True)
    os.remove(wav)
    print("→", os.path.relpath(mp3, ROOT))


write(master(music, -1.5), OUT_PREFIX + "music")
write(master(sfx, -3.0), OUT_PREFIX + "sfx")
