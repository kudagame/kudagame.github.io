# v1 像素大頭照批次（使用者選定的「舊樣本」流程）：AI 綠幕／洋紅幕稿 → portrait_pixelize.build → tools/portraits_v1/<物種>_<階>.png（原生 48×48）
# 0-3 = 綠藍紫粉；4 = 橘框（用粉的稿）。貓 1 直接用核准樣本 cat_1_px48.png。之後跑 sync_portraits.py 放大 2x 進 assets/portraits
# 用法：python3 tools/build_portraits_v1.py <AI 稿資料夾(ai_<sp>_<g>.jpg)> [核准的 cat_1_px48.png]
import sys, os, glob, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import portrait_pixelize as pp
SRC = sys.argv[1]; APPROVED = sys.argv[2] if len(sys.argv) > 2 else None
OUT = os.path.join(HERE, 'portraits_v1'); os.makedirs(OUT, exist_ok=True)
PETS = os.path.join(HERE, '..', 'assets', 'pets')
CATREF = [os.path.join(PETS, 'cat_v3', 'body_tier_blue_idle.png'), os.path.join(PETS, 'cat_v3', 'body_calico_idle.png')]
SPDIR = {'cat': 'cat_v3', 'retriever': 'hound_v3', 'bear': 'bear_v3', 'wolf': 'wolf_v3', 'shihtzu': 'shihtzu_v1'}
SPS = ['cat', 'retriever', 'bear', 'fox', 'pomeranian', 'rabbit', 'raccoon', 'wolf', 'owl', 'shihtzu']
for sp in SPS:
    refs = CATREF + (sorted(glob.glob(os.path.join(PETS, SPDIR[sp], 'body_*_idle.png'))) if sp in SPDIR else [])
    for g in range(4):
        src = os.path.join(SRC, f'ai_{sp}_{g}.jpg')
        for t in ([g, 4] if g == 3 else [g]):
            out = os.path.join(OUT, f'{sp}_{t}.png')
            if sp == 'cat' and g == 1 and APPROVED: shutil.copy(APPROVED, out); print(sp, t, 'approved sample'); continue
            print(sp, t, end=' '); pp.build(src, t, out, refs, adaptive=True)
# QA 修補：浣熊 0 的眼睛在黑眼罩裡太暗（亮眼圈被格子中位數吃掉）→ 眼睛周圍的中間灰改成臉的米色，讓眼圈看得出來
from PIL import Image
import numpy as np
def ring(name, boxes):
    p = os.path.join(OUT, name); a = np.asarray(Image.open(p).convert('RGBA')).copy(); light = a[14, 16].copy()
    for x0, y0, x1, y1 in boxes:
        sub = a[y0:y1 + 1, x0:x1 + 1]; v = sub[..., :3].astype(int).mean(-1); sub[(v > 60) & (v < 120)] = light
    Image.fromarray(a).save(p); print('ring fix', name)
ring('raccoon_0.png', [(10, 17, 13, 21), (20, 16, 24, 21)])
