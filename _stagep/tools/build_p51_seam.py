# P5.1 #7 二館背景接縫 v2：每列用「草地像素」的中位數對齊一館右緣（堆肥箱那幾列用上下內插），往右 480px 淡掉，接縫 8px 柔化。
# 用法：python3 tools/build_p51_seam.py assets/scenes/shelter/
from PIL import Image
import numpy as np, sys
import os; R=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'scenes', 'shelter') + '/'
def fix(a_, y_, dst):
    A = np.asarray(Image.open(R+a_+'.jpg').convert('RGB')).astype(float); Y = np.asarray(Image.open(R+y_+'.jpg').convert('RGB')).astype(float)
    H, W, _ = A.shape; N = 64; FADE = 480
    d = np.zeros((H, 3)); w = np.zeros(H)
    for y in range(H):
        y0, y1 = max(0, y-12), min(H, y+13)
        a = A[y0:y1, :N].reshape(-1, 3); b = Y[y0:y1, -N:].reshape(-1, 3)
        # 同類像素才比：都拿草地（綠>紅）或都拿整體
        ga = a[a[:, 1] > a[:, 0] + 3]; gb = b[b[:, 1] > b[:, 0] + 3]
        if len(ga) > 80 and len(gb) > 80: d[y] = np.median(gb, 0) - np.median(ga, 0); w[y] = 1
        else:
            dd = np.median(b, 0) - np.median(a, 0)
            if np.abs(dd).max() < 22: d[y] = dd; w[y] = .5
    # 平滑＋內插
    ys = np.arange(H); out = np.zeros((H, 3))
    for y in range(H):
        k = np.exp(-((ys - y) / 40.0) ** 2) * w
        out[y] = (d * k[:, None]).sum(0) / k.sum() if k.sum() > 1e-3 else 0
    out = np.clip(out, -30, 30)
    xs = np.arange(FADE); kx = (1 - xs / FADE) ** 1.3
    O = A.copy(); O[:, :FADE] += out[:, None, :] * kx[None, :, None]
    for x in range(8):   # 接縫 8px 柔化
        t = (x + 1) / 9; O[:, x] = Y[:, -1] * (1 - t) + O[:, x] * t
    Image.fromarray(np.clip(O, 0, 255).astype('uint8')).save(dst, quality=92)
for a_, y_ in (('annex_day_bg', 'yard_day_bg'), ('annex_night_bg', 'yard_night_bg'), ('annex_build_day_bg', 'yard_day_bg'), ('annex_build_night_bg', 'yard_night_bg')):
    fix(a_, y_, sys.argv[1] + a_ + '_s.jpg')
print('ok')
