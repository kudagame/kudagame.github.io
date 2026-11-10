# 大頭照轉像素風 v3（使用者：v1 細線不要、v2 太糊）→ 清楚的硬邊色塊、每種材質 3–5 階、總共約 20 色、不描黑線
# 做法：原圖高解析度 → 分材質（白毛／橘毛／黑毛／粉／紅項圈／金鈴）→ 縮到原生格（每格取多數材質＋平均亮度）
# → 每種材質照亮度分到固定色階（手調的色階，陰影偏暖）→ 多數決去雜點 → 輪廓用「同材質最深一階」（不是黑）→ 手點眼睛（有高光）
# 用法：python3 portrait_pixelize_v3.py 原圖.png 位階 輸出.png [原生大小=32]
import sys, colorsys, numpy as np
from PIL import Image, ImageFilter
RAMP = {  # 亮 → 暗
  'w': [(255, 251, 240), (238, 226, 204), (208, 190, 162), (156, 136, 112)],
  'o': [(252, 198, 112), (238, 152, 66), (200, 106, 42), (134, 68, 28)],
  'k': [(112, 94, 98), (76, 62, 70), (46, 36, 44)],
  'p': [(252, 192, 182), (228, 136, 136), (170, 86, 92)],
  'r': [(226, 66, 58), (172, 30, 38), (112, 16, 30)],
  'g': [(255, 220, 128), (216, 160, 66), (150, 98, 36)]}
EYE, HL = (36, 22, 26), (255, 255, 255)
FR = {0: [(26, 66, 30), (56, 128, 52), (104, 186, 90), (160, 226, 140)], 1: [(14, 38, 104), (32, 88, 190), (74, 142, 236), (146, 198, 255)],
      2: [(50, 20, 106), (108, 58, 196), (156, 108, 238), (206, 172, 255)], 3: [(100, 18, 72), (200, 60, 156), (238, 116, 198), (255, 182, 226)],
      4: [(116, 50, 6), (222, 116, 18), (255, 166, 66), (255, 212, 146)]}
def lab_px(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255); h *= 360
    if v < 0.36: return 'k'
    if s < 0.24 and v > 0.5: return 'w'
    if (h < 14 or h > 335) and s > 0.5: return 'r'
    if (h < 25 or h > 330) and s <= 0.5 and v > 0.55: return 'p'
    if 36 <= h <= 62 and s > 0.35: return 'g'
    if h < 50: return 'o'
    return 'w' if v > 0.6 else 'k'
def build(src, tier, out, N=32):
    S = 59 * 6; hi = np.asarray(Image.open(src).convert('RGB').resize((S, S), Image.LANCZOS)).astype(int)
    r, g, b = hi[..., 0], hi[..., 1], hi[..., 2]; m = ~((b > r + 25) & (b > g + 5)); fr = int(S * 0.11); m[:fr] = m[-fr:] = 0; m[:, :fr] = m[:, -fr:] = 0
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(9))) > 127
    L = np.full((S, S), '', object); lum = 0.3 * r + 0.59 * g + 0.11 * b
    for y in range(fr, S - fr, 1):
        for x in range(fr, S - fr):
            if m[y, x]: L[y, x] = lab_px(*hi[y, x])
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    th = N - 6; tw = round((x1 - x0) * th / (y1 - y0))
    if tw > N - 5: tw = N - 5; th = round((y1 - y0) * tw / (x1 - x0))
    lab = np.full((th, tw), '', object); lv = np.zeros((th, tw))
    for Y in range(th):
        for X in range(tw):
            a0, a1 = y0 + Y * (y1 - y0) // th, y0 + (Y + 1) * (y1 - y0) // th; b0, b1 = x0 + X * (x1 - x0) // tw, x0 + (X + 1) * (x1 - x0) // tw
            cell = L[a0:a1, b0:b1]; mm = m[a0:a1, b0:b1]
            if mm.mean() < 0.5: continue
            ks, cs = np.unique(cell[mm], return_counts=True); k = ks[cs.argmax()]
            # 小東西（粉、紅、金、黑）只要佔 30% 就算，不然會被白毛吃掉
            for kk in ('k', 'r', 'g', 'p'):
                if kk in ks and cs[list(ks).index(kk)] >= 0.3 * mm.sum(): k = kk; break
            lab[Y, X] = k; lv[Y, X] = lum[a0:a1, b0:b1][(cell == k) & mm].mean()
    # 多數決：孤立的材質像素併到鄰居
    for _ in range(2):
        nl = lab.copy()
        for Y in range(th):
            for X in range(tw):
                if not lab[Y, X]: continue
                nb = [lab[Y + dy, X + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= Y + dy < th and 0 <= X + dx < tw and lab[Y + dy, X + dx]]
                if nb and lab[Y, X] not in nb: nl[Y, X] = max(set(nb), key=nb.count)
        lab = nl
    rows = np.arange(th)[:, None] < th * 0.6; lab[(lab == 'g') & rows] = 'o'    # 金色只在項圈那一帶（頭上的是橘毛）
    # 每種材質照亮度分階（用這種材質自己的亮度分位數 → 對比固定、色塊清楚）
    st = np.zeros((th, tw), int)
    for k, ramp in RAMP.items():
        sel = lab == k
        if not sel.any(): continue
        v = lv[sel]; n = len(ramp) - 1                     # 最暗那階留給輪廓
        qs = np.quantile(v, [i / n for i in range(1, n)]) if len(v) > 3 else []
        st[sel] = [n - 1 - int(np.searchsorted(qs, x)) for x in v]
    # 階層也做一次多數決，清掉單點
    for _ in range(2):
        ns = st.copy()
        for Y in range(1, th - 1):
            for X in range(1, tw - 1):
                if not lab[Y, X]: continue
                nb = [st[Y + dy, X + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)) if lab[Y + dy, X + dx] == lab[Y, X]]
                if len(nb) >= 3 and st[Y, X] not in nb: ns[Y, X] = max(set(nb), key=nb.count)
        st = ns
    col = np.zeros((th, tw, 3), int); solid = lab != ''
    for Y in range(th):
        for X in range(tw):
            if solid[Y, X]:
                rp = RAMP[lab[Y, X]]; edge = any(not (0 <= Y + dy < th and 0 <= X + dx < tw) or not solid[Y + dy, X + dx] for dy, dx in ((-1, 0), (0, 1), (0, -1)))
                col[Y, X] = rp[-1] if edge else rp[min(st[Y, X], len(rp) - 2)]   # 輪廓＝同材質最深一階（不是黑線）
    return lab, st, col, solid, tw, th
def compose(col, solid, tw, th, tier, N, eyes=(), out=None):
    o = np.zeros((N, N, 4), np.uint8); f = FR[tier]; R = 6
    def inside(x, y, ins):
        rr = R - ins; a0 = ins; a1 = N - 1 - ins
        if x < a0 or x > a1 or y < a0 or y > a1: return False
        cx = min(max(x, a0 + rr), a1 - rr); cy = min(max(y, a0 + rr), a1 - rr); return (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr + rr * 0.6
    ox = (N - tw) // 2 + 1; oy = N - 2 - th
    for y in range(N):
        for x in range(N):
            if not inside(x, y, 0): continue
            if not inside(x, y, 1): c = f[0]
            elif not inside(x, y, 2): c = f[2] if y < N * 0.5 else f[1]
            else:
                d = ((x - N / 2 + 0.5) ** 2 + (y - N * 0.42) ** 2) ** 0.5 / (N * 0.5)
                c = f[3] if d < 0.34 else f[2] if d < 0.62 else f[1]
                X, Y = x - ox, y - oy
                if 0 <= X < tw and 0 <= Y < th and solid[Y, X]: c = tuple(col[Y, X])
            o[y, x] = (*c, 255)
    for (x, y, k) in eyes: o[y, x] = (*{'e': EYE, 'h': HL, 'b': (110, 70, 40)}[k], 255)
    if out: Image.fromarray(o).save(out)
    return o
if __name__ == '__main__':
    N = int(sys.argv[4]) if len(sys.argv) > 4 else 32
    lab, st, col, solid, tw, th = build(sys.argv[1], int(sys.argv[2]), sys.argv[3], N)
    import json; feat = json.loads(sys.argv[5]) if len(sys.argv) > 5 else []   # 手修：[[x, y, 顏色名或 [r,g,b]], ...]（原生格座標）
    NAMED = {'e': EYE, 'h': HL, 'i': (176, 124, 40)}
    for x, y, c in feat: col[y, x] = NAMED[c] if isinstance(c, str) and c in NAMED else (RAMP[c[0]][int(c[1])] if isinstance(c, str) else c); solid[y, x] = True
    o = compose(col, solid, tw, th, int(sys.argv[2]), N, out=sys.argv[3])
    print('size', tw, th, 'colors', len(set(map(tuple, o.reshape(-1, 4)[o.reshape(-1, 4)[:, 3] > 0][:, :3].tolist()))))
