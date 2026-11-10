# 把使用者全寵物影片裁出來的大頭照（design/pet_refs/<物種>/mm_<階>_<名字>.png）複製成 pettest 用的頭像
# 只讀 design/pet_refs，不改正式版。python3 pettest/tools/sync_portraits.py
# P4.1：有 tools/portraits_v1/<物種>_<階>.png（build_portraits_v1.py 轉好的 48×48 像素版）就用它放大 2x（最近鄰，不糊）；沒有才退回原圖
#       另外 <物種>_4.png = 橘框版（manifest 的 o 欄位）
from PIL import Image, ImageDraw
import os, json, glob, re
HERE = os.path.dirname(os.path.abspath(__file__)); REF = os.path.join(HERE, '..', '..', 'design', 'pet_refs')
OUT = os.path.join(HERE, '..', 'assets', 'portraits'); os.makedirs(OUT, exist_ok=True)
DIR = {'cat': 'cat', 'retriever': 'hound', 'bear': 'bear', 'fox': 'fox', 'pomeranian': 'pomeranian', 'rabbit': 'rabbit', 'raccoon': 'raccoon', 'wolf': 'wolf', 'owl': 'owl', 'shihtzu': 'shihtzu'}
GRADES = ['green', 'blue', 'purple', 'pink']   # 成年(素體)／藍／紫／粉；橘用粉的圖＋橘框
src = open(os.path.join(HERE, '..', 'pet', 'pet_data.js'), encoding='utf-8').read()
LOOKS = {m.group(1): re.findall(r"'([^']+)'", m.group(2)) for m in re.finditer(r"\{ id: '([a-z]+)', name: '[^']*'.*?looks: \[([^\]]*)\]", src)}
S = 96; man = {}; missing = []; V1 = os.path.join(HERE, 'portraits_v1'); used_v1 = 0
mask = Image.new('L', (S * 4, S * 4), 0); ImageDraw.Draw(mask).rounded_rectangle([2, 2, S * 4 - 3, S * 4 - 3], radius=int(S * 4 * 0.2), fill=255); mask = mask.resize((S, S), Image.LANCZOS)
for sp, d in DIR.items():
    man[sp] = {}
    for g, gr in enumerate(GRADES):
        want = (LOOKS.get(sp) or [None] * 4)[g]
        fs = sorted(glob.glob(os.path.join(REF, d, f'mm_{gr}_*.png')))
        f = next((x for x in fs if want and os.path.basename(x) == f'mm_{gr}_{want}.png'), fs[0] if fs else None)
        if not f: missing.append(f'{sp} {gr}'); continue
        name = f'{sp}_{g}.png'; pv = os.path.join(V1, name)
        if os.path.exists(pv): Image.open(pv).convert('RGBA').resize((S, S), Image.NEAREST).save(os.path.join(OUT, name), optimize=True); used_v1 += 1
        else: im = Image.open(f).convert('RGB').resize((S, S), Image.LANCZOS).convert('RGBA'); im.putalpha(mask); im.save(os.path.join(OUT, name), optimize=True)
        nm = os.path.basename(f)[len(f'mm_{gr}_'):-4]
        man[sp][g] = {'f': name, 'name': nm, 'match': nm == want}
        po = os.path.join(V1, f'{sp}_4.png')
        if g == 3 and os.path.exists(po): Image.open(po).convert('RGBA').resize((S, S), Image.NEAREST).save(os.path.join(OUT, f'{sp}_4.png'), optimize=True); man[sp][g]['o'] = f'{sp}_4.png'
open(os.path.join(OUT, 'manifest.js'), 'w', encoding='utf-8').write('window.PET_PORTRAITS=' + json.dumps(man, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('v1 像素版:', used_v1); print('portraits:', sum(len(v) for v in man.values()), '缺:', missing or '無', '名字不對:', [f'{s}:{g}' for s, v in man.items() for g, x in v.items() if not x['match']] or '無')
