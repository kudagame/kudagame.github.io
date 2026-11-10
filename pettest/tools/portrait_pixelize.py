# 大頭照轉成遊戲像素風（照 chars/pets/STYLE_GUIDE_zh.md 第 1 條的流程）：
# AI 綠幕稿 → 色鍵＋去溢色 → BOX 縮小（premultiplied，alpha>0.45 才算實心）→ 去 <6px 雜點 → 鎖色盤量化（不抖色）→ 1px #1A1016 外框
# → 放進像素位階框（原生 48×48，遊戲裡 2x 顯示）。用法：python3 portrait_pixelize.py 綠幕稿 位階(0-4) 輸出.png [色盤參考 png...]
import sys, numpy as np
from PIL import Image
N = 48; OUTL = (26, 16, 22)
FR = {  # 位階框：外框、亮邊、底色三階（中→邊）
  0: [(86, 160, 72), (150, 214, 120), [(96, 170, 84), (66, 132, 60), (44, 98, 44)]],
  1: [(52, 120, 220), (130, 186, 255), [(84, 150, 230), (56, 112, 196), (36, 80, 156)]],
  2: [(150, 90, 230), (206, 160, 255), [(160, 112, 236), (122, 78, 204), (90, 52, 164)]],
  3: [(236, 90, 180), (255, 170, 220), [(236, 118, 196), (198, 78, 160), (150, 50, 122)]],
  4: [(255, 140, 20), (255, 206, 120), [(255, 176, 80), (228, 132, 40), (180, 92, 22)]]}
def key(img):
    a = np.asarray(img.convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    cn = np.concatenate([a[:8, :8], a[:8, -8:], a[-8:, :8], a[-8:, -8:]]).reshape(-1, 3).mean(0)
    if cn[0] > cn[1] + 60 and cn[2] > cn[1] + 60:   # 洋紅幕（主體有綠色配件／綠眼時用）
        bg = (r > g + 60) & (b > g + 60) & (r > 110); al = (~bg).astype(float)
        sp = (np.minimum(r, b) > g + 25) & ~bg; mx = np.maximum(g, (r + b) // 2 - 25)
        a[..., 0] = np.where(sp, np.minimum(r, mx), r); a[..., 2] = np.where(sp, np.minimum(b, mx), b)
        return a, al
    bg = (g > r + 35) & (g > b + 35) & (g > 110); al = (~bg).astype(float)
    spill = (g > np.maximum(r, b)) & ~bg; a[..., 1] = np.where(spill, np.maximum(r, b), g)   # 去溢色
    return a, al
def box(a, al, w, h):
    H, W = al.shape; out = np.zeros((h, w, 3)); oa = np.zeros((h, w))
    for y in range(h):
        for x in range(w):
            y0, y1, x0, x1 = y * H // h, (y + 1) * H // h, x * W // w, (x + 1) * W // w
            m = al[y0:y1, x0:x1]; s = m.sum(); oa[y, x] = m.mean()
            if s > 0: out[y, x] = (a[y0:y1, x0:x1] * m[..., None]).sum((0, 1)) / s
    return out, oa > 0.45
def despeck(m, n=6):
    m = m.copy(); H, W = m.shape; seen = np.zeros_like(m)
    for y in range(H):
        for x in range(W):
            if m[y, x] and not seen[y, x]:
                st = [(y, x)]; comp = []; seen[y, x] = 1
                while st:
                    cy, cx = st.pop(); comp.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not seen[ny, nx]: seen[ny, nx] = 1; st.append((ny, nx))
                if len(comp) < n:
                    for cy, cx in comp: m[cy, cx] = 0
    return m
def palette(paths, extra):
    cols = set(map(tuple, extra))
    for p in paths:
        im = np.asarray(Image.open(p).convert('RGBA')); px = im[im[..., 3] == 255][:, :3]; cols |= set(map(tuple, px))
    return np.array(sorted(cols)).astype(float)
def quant(rgb, pal):
    d = ((rgb[..., None, :] - pal[None, None]) ** 2).sum(-1); return pal[d.argmin(-1)]
def frame(t):
    oc, hi, bgs = FR[t]; im = np.zeros((N, N, 4), np.uint8); r = 9
    def inside(x, y, ins):   # 像素圓角方形（不反鋸齒）
        rr = r - ins; x0, y0, x1, y1 = ins, ins, N - 1 - ins, N - 1 - ins
        if x < x0 or x > x1 or y < y0 or y > y1: return False
        cx = min(max(x, x0 + rr), x1 - rr); cy = min(max(y, y0 + rr), y1 - rr)
        return (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr + rr * 0.6
    for y in range(N):
        for x in range(N):
            if not inside(x, y, 0): continue
            if not inside(x, y, 1): c = OUTL
            elif not inside(x, y, 3): c = oc
            elif not inside(x, y, 4): c = hi if y < N // 2 else oc
            else:
                d = ((x - N / 2) ** 2 + (y - N * 0.42) ** 2) ** 0.5 / (N / 2)
                c = bgs[0] if d < 0.5 else bgs[1] if d < 0.85 else bgs[2]
            im[y, x] = (*c, 255)
    return im, inside
def adapt(rgb, m, pal, far=36, k=10):
    # 保留影片原色：離鎖色盤太遠的顏色（項圈、配件），用 median-cut 補幾個色進色盤；本來就近的不動（貓樣本不變）
    px = rgb[m]; d = np.sqrt(((px[:, None] - pal[None]) ** 2).sum(-1)).min(1); fp = px[d > far]
    if len(fp) < 3: return pal
    q = Image.fromarray(fp.reshape(1, -1, 3).astype(np.uint8)).quantize(min(k, len(fp)), method=Image.MEDIANCUT)
    add = np.array(q.getpalette()[:3 * min(k, len(fp))]).reshape(-1, 3).astype(float)
    return np.concatenate([pal, add])
def build(src, tier, out, palrefs, adaptive=False):
    a, al = key(Image.open(src)); ys, xs = np.where(al > 0.5); a, al = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1], al[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    H, W = al.shape
    # AI 稿本身就是像素格：先找格子大小（讓每格顏色最一致），每格取中位數，等於還原原生像素
    best = None
    for c in np.arange(12, 22, 0.25):
        tw0, th0 = max(1, round(W / c)), max(1, round(H / c)); ys = (np.arange(th0) + 0.5) * H / th0; xs = (np.arange(tw0) + 0.5) * W / tw0
        v = 0
        for dy in (-0.3, 0.3):
            for dx in (-0.3, 0.3):
                yy = np.clip((ys + dy * H / th0).astype(int), 0, H - 1); xx = np.clip((xs + dx * W / tw0).astype(int), 0, W - 1)
                yc = np.clip(ys.astype(int), 0, H - 1); xc = np.clip(xs.astype(int), 0, W - 1)
                v += np.abs(a[yy][:, xx] - a[yc][:, xc]).sum()
        v /= tw0 * th0
        if best is None or v < best[0]: best = (v, tw0, th0)
    tw, th = best[1], best[2]
    if tw > 42 or th > 42: k = 42 / max(tw, th); tw, th = round(tw * k), round(th * k)
    rgb = np.zeros((th, tw, 3)); m = np.zeros((th, tw), bool)
    for y in range(th):
        for x in range(tw):
            y0, y1, x0, x1 = y * H // th, (y + 1) * H // th, x * W // tw, (x + 1) * W // tw
            cy0, cy1, cx0, cx1 = y0 + (y1 - y0) // 4, y1 - (y1 - y0) // 4, x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4
            mm = al[cy0:cy1 + 1, cx0:cx1 + 1]; m[y, x] = mm.mean() > 0.45
            if m[y, x]: rgb[y, x] = np.median(a[cy0:cy1 + 1, cx0:cx1 + 1][mm > 0.5], 0)
    m = despeck(m); print('native', tw, th)
    extra = [OUTL, (150, 20, 24), (118, 14, 20), (186, 40, 36), (214, 170, 80), (176, 128, 52), (120, 84, 36), (236, 150, 150), (210, 110, 110)]
    pal = palette(palrefs, extra)
    if adaptive: pal = adapt(rgb, m, pal)
    rgb = quant(rgb, pal)
    # 1px 外框：實心像素四鄰的空格塗 #1A1016；底邊貼齊框內不描（被框切掉）
    fim, inside = frame(tier); ox = (N - tw) // 2; oy = N - 4 - th + 1
    sprite = np.zeros((th + 2, tw + 2, 4), np.uint8)
    for y in range(th):
        for x in range(tw):
            if m[y, x]: sprite[y + 1, x + 1] = (*rgb[y, x].astype(np.uint8), 255)
    solid = sprite[..., 3] > 0; edge = np.zeros_like(solid)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): edge |= np.roll(np.roll(solid, dy, 0), dx, 1)
    dark = solid & (sprite[..., :3].astype(int).sum(-1) < 150)   # 稿子自己畫的外框已經是深色 → 不再多描一圈（保持 1px）
    lit = solid & ~dark; edge = np.zeros_like(solid)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): edge |= np.roll(np.roll(lit, dy, 0), dx, 1)
    edge &= ~solid; sprite[edge] = (*OUTL, 255)
    for y in range(th + 2):
        for x in range(tw + 2):
            X, Y = ox + x - 1, oy + y - 1
            if sprite[y, x, 3] and 0 <= X < N and 0 <= Y < N and inside(X, Y, 3): fim[Y, X] = sprite[y, x]
    Image.fromarray(fim).save(out); return fim
if __name__ == '__main__':
    ad = '--adapt' in sys.argv; av = [x for x in sys.argv[1:] if x != '--adapt']
    build(av[0], int(av[1]), av[2], av[3:], ad)
