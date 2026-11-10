# P5.1 衍生圖（不畫新圖）：全部從現有貼圖用程式換算出來
#  1) *_front：正面＝原圖左半邊＋左右鏡像（小屋、家具）
#  2) ware_*：倉庫＝小屋原圖把側牆拉長（長屋）、屋頂改成灰藍石板色；正面版把門中間那幾欄複製加寬
#  3) annex_*_bg_s：二館背景接縫——每一列跟一館右緣對齊亮度/色調，往右 360px 漸漸淡掉，接縫 24px 互相交疊
# 用法：python3 tools/build_p51_art.py（在 pettest/ 底下）
from PIL import Image, ImageOps
import colorsys, os
R = 'assets/scenes/'; O = R + 'p51/'
os.makedirs(O, exist_ok=True)
def front(im, cx):
    w, h = im.size; half = im.crop((0, 0, cx, h)); f = Image.new('RGBA', (cx * 2, h)); f.paste(half, (0, 0)); f.paste(ImageOps.mirror(half), (cx, 0)); return f
def slate(im):
    im = im.copy(); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if (h < 0.04 or h > 0.95) and s > 0.45:   # 紅瓦
                r2, g2, b2 = colorsys.hsv_to_rgb(0.58, s * 0.38, v * 0.92); px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return im
def stretch_cols(im, x0, x1, k):
    w, h = im.size; mid = im.crop((x0, 0, x1, h)).resize((int((x1 - x0) * k), h), Image.NEAREST)
    out = Image.new('RGBA', (x0 + mid.width + (w - x1), h)); out.paste(im.crop((0, 0, x0, h)), (0, 0)); out.paste(mid, (x0, 0)); out.paste(im.crop((x1, 0, w, h)), (x0 + mid.width, 0)); return out
for nt in ('', '_night'):
    hut = Image.open(R + f'shelter/hut{nt}.png').convert('RGBA')
    hf = front(hut, 53); hf.save(O + f'hut_front{nt}.png')
    for k in ('bed', 'chime', 'feeder', 'toybox', 'bowl_full'):
        im = Image.open(R + f'farm/furn_{k}{nt}.png').convert('RGBA'); bb = im.getbbox(); front(im, (bb[0] + bb[2]) // 2).save(O + f'furn_{k}_front{nt}.png')
    slate(stretch_cols(hut, 108, 140, 2.4)).save(O + f'ware{nt}.png')
    slate(stretch_cols(hf, 44, 62, 3.4)).save(O + f'ware_front{nt}.png')
# 二館接縫：只校正「大範圍」的亮度/色調差（每列取上下 ±60 列、左右各 48 欄的中位數，差值限制在 ±28），
# 不拿邊緣的東西（堆肥箱）去抹；最後在接縫左右 6px 做一點水平柔化
import statistics as st
for a_, y_ in (('annex_day_bg', 'yard_day_bg'), ('annex_night_bg', 'yard_night_bg'), ('annex_build_day_bg', 'yard_day_bg'), ('annex_build_night_bg', 'yard_night_bg')):
    A = Image.open(R + f'shelter/{a_}.jpg').convert('RGB'); Y = Image.open(R + f'shelter/{y_}.jpg').convert('RGB')
    W, H = A.size; FADE, N, VW = 420, 48, 60
    ys = A.crop((0, 0, N, H)).resize((1, H), Image.BOX); yy = Y.crop((1280 - N, 0, 1280, H)).resize((1, H), Image.BOX)
    la = [ys.getpixel((0, y)) for y in range(H)]; ly = [yy.getpixel((0, y)) for y in range(H)]
    d0 = [[ly[y][c] - la[y][c] for c in range(3)] for y in range(H)]
    good = [max(abs(v) for v in d0[y]) < 26 and not (465 <= y <= 680) for y in range(H)]   # 兩邊差太多＝不同東西；一館右下是堆肥箱（yard_layout heap），那幾列不拿來算，用上下的草地內插
    d = []
    for y in range(H):
        js = [j for j in range(max(0, y - VW * 2), min(H, y + VW * 2 + 1)) if good[j]]
        d.append([max(-20, min(20, st.median(d0[j][c] for j in js))) if js else 0 for c in range(3)])
    out = A.copy(); op = out.load()
    for y in range(H):
        for x in range(FADE):
            k = (1 - x / FADE) ** 1.4; p = op[x, y]; op[x, y] = tuple(max(0, min(255, int(p[c] + d[y][c] * k))) for c in range(3))
    yp = Y.load()
    for y in range(H):   # 接縫左邊 10px：從一館最右一欄慢慢過渡過來，邊線不再是一條直線
        for x in range(10):
            t = (x + 1) / 11; q = op[x, y]; m = yp[1279, y]; op[x, y] = tuple(int(m[c] * (1 - t) + q[c] * t) for c in range(3))
    out.save(R + f'shelter/{a_}_s.jpg', quality=92)
print('ok')
# ---------- P5.1 #15 櫃檯選單小圖示（16×16 像素，放大 2 倍；遊戲本來的木頭／奶油／紅／金配色） ----------
# 能用現有圖的就用現有圖：寄放處＝育兒籃 basket_empty（加一支小鑰匙）、擴建＝小屋 hut、倉庫＝ware、大會＝村莊金牌、農場＝飯碗 furn_bowl_full
from PIL import ImageDraw
IC = O + 'icons/'; os.makedirs(IC, exist_ok=True)
PAL = dict(k='#3b2418', w='#8a5a33', W='#b77b45', r='#b8402e', R='#e0705a', y='#d9a23c', Y='#f4d47e', c='#fff3d6', C='#e3c99a', g='#5c8a3a', G='#8cbf5a', b='#4a78b8', B='#8fbbe6', p='#f19bb0')
def grid(rows):
    im = Image.new('RGBA', (16, 16)); px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in PAL: px[x, y] = Image.new('RGB', (1, 1), PAL[ch]).getpixel((0, 0)) + (255,)
    return im
ICONS = {
 'rescue': [   # 救援旗：木桿＋紅旗（旗上一顆奶油色愛心）＋草地
  '................',
  '...kk...........',
  '...kWkkkkkkk....',
  '...kWkRRRRRRkk..',
  '...kWkRRcRcRRRk.',
  '...kWkRccccRRk..',
  '...kWkRRccRRk...',
  '...kWkrrRrrrrk..',
  '...kWkrrrrrrrrk.',
  '...kWkkkkkkkkk..',
  '...kWk..........',
  '...kWk..........',
  '...kWk..........',
  '.kkkwkkkk.......',
  'kGGGGGGGGGk.....',
  '.kggggggggk.....'],
 'reroll': [   # 骰子兩顆
  '................',
  '..kkkkkkkk......',
  '.kccccccccK.....',
  '.kcrcccccrk.....',
  '.kcccccccck.....',
  '.kccccrccckkkk..',
  '.kcccccccckBBBk.',
  '.kcrcccccrkBcBBk',
  '.kCCCCCCCkBBBBBk',
  '..kkkkkkkkBBBcBk',
  '..........kbbbbk',
  '...........kkkk.',
  '................',
  '................',
  '................',
  '................'],
 'codex': [    # 圖鑑：咖啡色硬皮書、金色書角、封面一個腳印
  '................',
  '..kkkkkkkkkk....',
  '.kyWWWWWWWWyk...',
  '.kwWWWWWWWWWkc..',
  '.kwWWWccWWWWkCk.',
  '.kwWWcccWWWWkck.',
  '.kwWcWccWcWWkCk.',
  '.kwWWcWWcWWWkck.',
  '.kwWWWWWWWWWkCk.',
  '.kwWWWWWWWWWkck.',
  '.kwWWWWWWWWWkCk.',
  '.kyWWWWWWWWykck.',
  '.kkkkkkkkkkkkCk.',
  '..kccccccccccck.',
  '...kkkkkkkkkkk..',
  '................'],
 'mail': [     # 信封＋紅色封蠟
  '................',
  '................',
  '................',
  '.kkkkkkkkkkkkkk.',
  '.kcCccccccccCck.',
  '.kccCccccccCcck.',
  '.kcccCccccCccck.',
  '.kccccCrrCcccck.',
  '.kcccccrRrcccck.',
  '.kccccCrrCcccck.',
  '.kcccCccccCccck.',
  '.kCCCCCCCCCCCCk.',
  '.kkkkkkkkkkkkkk.',
  '................',
  '................',
  '................'],
 'key': [      # 小鑰匙（疊在育兒籃上）
  '................','................','................','................','................','................','................','................',
  '..........kkk...',
  '.........kYyYk..',
  '.........ky.yk..',
  '.....kkkkkYyYk..',
  '....kYYYYYkkk...',
  '....kykyk.......',
  '.....k.k........',
  '................'],
 'ask': [      # 問答牌：木牌＋問號（給「提示」用）
  '................',
  '...kkkkkkkkkk...',
  '..kWWWWWWWWWWk..',
  '..kWWWkkkkWWWk..',
  '..kWWkcccckWWk..',
  '..kWWkckkcckWk..',
  '..kWWWkWkcckWk..',
  '..kWWWWWkcckWk..',
  '..kWWWWkcckWWk..',
  '..kWWWWkcckWWk..',
  '..kwwwwwkkwwwk..',
  '..kwwwwkcckwwk..',
  '...kkkkkkkkkk...',
  '.......kwk......',
  '.......kwk......',
  '.....kkkkkkk....'],
}
for k, rows in ICONS.items():
    rows = [r.replace('K', 'k') for r in rows]
    grid(rows).resize((32, 32), Image.NEAREST).save(IC + f'{k}.png')
def fit(src, box=30):
    im = Image.open(src).convert('RGBA'); im = im.crop(im.getbbox()); s = min(box / im.width, box / im.height)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS if s < 1 else Image.NEAREST)
    c = Image.new('RGBA', (32, 32)); c.alpha_composite(im, ((32 - im.width) // 2, 32 - im.height - 1)); return c
st_ = fit(R + 'shelter/basket_empty.png', 30); st_.alpha_composite(Image.open(IC + 'key.png').convert('RGBA'), (0, 0)); st_.save(IC + 'stay.png')
fit(R + 'shelter/hut.png').save(IC + 'expand.png'); fit(O + 'ware.png').save(IC + 'ware.png')
fit(R + 'room/medals/medal_village_gold.png', 28).save(IC + 'cup.png'); fit(R + 'farm/furn_bowl_full.png', 28).save(IC + 'farm.png')
os.remove(IC + 'key.png')
print('icons ok')
