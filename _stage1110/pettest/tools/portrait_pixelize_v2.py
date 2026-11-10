# 大頭照轉像素風 v2（使用者：「我們的風格不要細線條」「多色階」）
# 不描線：形狀靠色階分開。原圖 → 縮到原生 48×48 → 從原圖取色盤（每種材質多階）量化、不抖色 → 清掉孤立雜點 → 像素位階框（也是色階，不描黑線）
# 用法：python3 portrait_pixelize_v2.py 原圖.png 位階(0-4) 輸出.png [色數]
import sys, numpy as np
from PIL import Image, ImageFilter
N = 48
FR = {0: [(30, 74, 34), (64, 140, 58), (120, 200, 104), (170, 232, 150)], 1: [(14, 40, 110), (34, 92, 196), (78, 146, 240), (150, 200, 255)],
      2: [(52, 22, 110), (112, 62, 200), (160, 112, 240), (210, 176, 255)], 3: [(104, 20, 76), (204, 64, 160), (240, 120, 200), (255, 186, 228)],
      4: [(120, 52, 6), (226, 120, 20), (255, 170, 70), (255, 214, 150)]}
R = 9
def inside(x, y, ins):
    rr = R - ins; x0 = y0 = ins; x1 = y1 = N - 1 - ins
    if x < x0 or x > x1 or y < y0 or y > y1: return False
    cx = min(max(x, x0 + rr), x1 - rr); cy = min(max(y, y0 + rr), y1 - rr)
    return (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr + rr * 0.6
def despeck(q, passes=3):
    H, W, _ = q.shape
    for _ in range(passes):
        out = q.copy(); n = 0
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                c = q[y, x]; nb = [q[y - 1, x], q[y + 1, x], q[y, x - 1], q[y, x + 1]]
                if any((c == v).all() for v in nb): continue
                # 孤立的 1 個像素：換成最接近的鄰居顏色（保留明暗方向，不是直接抹平）
                d = [np.abs(c.astype(int) - v.astype(int)).sum() for v in nb]; out[y, x] = nb[int(np.argmin(d))]; n += 1
        q = out
        if not n: break
    return q
def build(src, tier, out, ncol=44, H0=40):
    hi = np.asarray(Image.open(src).convert('RGB').resize((59 * 6, 59 * 6), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=6, percent=90, threshold=1))).astype(float); S = hi.shape[0]
    r, g, b = hi[..., 0], hi[..., 1], hi[..., 2]
    bg = (b > r + 25) & (b > g + 5)                                   # 原圖背景是藍光
    m = ~bg; fr = int(S * 0.11); m[:fr] = m[-fr:] = 0; m[:, :fr] = m[:, -fr:] = 0   # 去掉原圖的框
    mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(9)); m = np.asarray(mi) > 127
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    k = H0 / (y1 - y0); tw, th = max(1, round((x1 - x0) * k)), H0
    if tw > 40: k = 40 / (x1 - x0); tw, th = 40, round((y1 - y0) * k)
    # 只用貓的像素做 BOX 平均（premultiplied）→ 邊緣不會混到藍色
    rgb = np.zeros((th, tw, 3)); al = np.zeros((th, tw))
    for yy in range(th):
        for xx in range(tw):
            a0, a1 = y0 + yy * (y1 - y0) // th, y0 + (yy + 1) * (y1 - y0) // th; b0, b1 = x0 + xx * (x1 - x0) // tw, x0 + (xx + 1) * (x1 - x0) // tw
            mm = m[a0:a1, b0:b1]; al[yy, xx] = mm.mean()
            if mm.any(): rgb[yy, xx] = hi[a0:a1, b0:b1][mm].mean(0)
    solid = al > 0.5
    # 只留最大的一塊（去掉背景光暈誤判的小點）
    lab = np.zeros(solid.shape, int); best = (0, 0); cur = 0
    for sy in range(th):
        for sx in range(tw):
            if solid[sy, sx] and not lab[sy, sx]:
                cur += 1; st = [(sy, sx)]; lab[sy, sx] = cur; n = 0
                while st:
                    cy, cx = st.pop(); n += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < th and 0 <= nx < tw and solid[ny, nx] and not lab[ny, nx]: lab[ny, nx] = cur; st.append((ny, nx))
                if n > best[0]: best = (n, cur)
    solid = lab == best[1]
    px = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    # 色盤只從貓身上取（多色階），不抖色
    sel = rgb[solid].astype(np.uint8).reshape(-1, 1, 3); pal = Image.fromarray(sel).quantize(colors=ncol, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    q = np.asarray(px.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')).copy()
    q = despeck(np.where(solid[..., None], q, 0).astype(np.uint8))
    o = np.zeros((N, N, 4), np.uint8); f = FR[tier]; ox = (N - tw) // 2 + 1; oy = N - 3 - th
    for y in range(N):
        for x in range(N):
            if not inside(x, y, 0): continue
            if not inside(x, y, 1): c = f[0]                          # 最外圈：最深的位階色（不是黑線）
            elif not inside(x, y, 2): c = f[1] if y > 6 else f[2]
            elif not inside(x, y, 3): c = f[2] if y < N * 0.55 else f[1]
            else:                                                     # 底：中間亮、往外 4 階變暗（跟原圖的光一樣，但是分階）
                d = ((x - N / 2 + 0.5) ** 2 + (y - N * 0.4) ** 2) ** 0.5 / (N * 0.5)
                c = tuple(int(v) for v in np.array(f[3]) * 0.55 + np.array(f[1]) * 0.45) if d < 0.38 else f[2] if d < 0.62 else tuple(int(v) for v in (np.array(f[1]) * 0.6 + np.array(f[0]) * 0.4)) if d < 0.9 else f[0]
                X, Y = x - ox, y - oy
                if 0 <= X < tw and 0 <= Y < th and solid[Y, X]: c = tuple(q[Y, X])
            o[y, x] = (*c, 255)
    Image.fromarray(o).save(out); return len(set(map(tuple, q[solid])))
if __name__ == '__main__':
    print('colors', build(sys.argv[1], int(sys.argv[2]), sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 44))
