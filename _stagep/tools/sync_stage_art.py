# 把正式版關卡的背景、王、小怪、道具圖做成探險隊用的縮圖（只讀 /workspace/game/web/a，不改正式版）
# python3 pettest/tools/sync_stage_art.py
from PIL import Image, ImageOps, ImageEnhance
import os, colorsys
SRC = '/workspace/game/web/a'; OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'stages'); os.makedirs(OUT, exist_ok=True)
def o(n): return Image.open(os.path.join(SRC, n + '.png')).convert('RGBA')
BG = { 'canyon': ('world', 0.05), 's2': ('world', 0.55), 'mine': ('bossroom', 0), 'spider': ('sp_nest', 0), 'crystal': ('b4room', 0), 'rich': ('ms_glass', 0) }
def hue(im, deg, sat, bri):   # 第二關：正式版用 CSS hue-rotate(150deg) saturate(.5) brightness(.8)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]; h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255); h = (h + deg / 360) % 1; s *= sat
            r, g, b = colorsys.hls_to_rgb(h, l, s); px[x, y] = (int(r * 255 * bri), int(g * 255 * bri), int(b * 255 * bri), a)
    return im
for k, (f, pos) in BG.items():
    im = o(f); w, h = im.size; cw = int(h * 16 / 9); x = int((w - cw) * pos) if w > cw else 0
    t = im.crop((x, 0, x + min(cw, w), h)).resize((320, 180), Image.LANCZOS)
    if k == 's2': t = hue(t, 150, 0.5, 0.8)
    t.convert('RGB').save(os.path.join(OUT, k + '_bg.jpg'), quality=86)
def fit(im, size, frames=1):
    if frames > 1: fw = im.width // frames; im = im.crop((0, 0, fw, im.height))
    bb = im.getchannel('A').getbbox(); im = im.crop(bb); s = size / max(im.size)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.NEAREST if s >= 1 else Image.LANCZOS)
    c = Image.new('RGBA', (size, size)); c.paste(im, ((size - im.width) // 2, size - im.height)); return c
SPR = { 'boss_canyon': ('s_gg_idle0', 1), 'boss_s2': ('s_scA_idle0', 1), 'boss_s2b': ('s_scB_idle0', 1), 'boss_mine': ('s_golem_walk0', 1), 'boss_spider': ('s_spd_idle', 1), 'boss_crystal': ('b4_idle', 8), 'boss_rich': ('s_looter_idle', 1),
        'foe_golem': ('s_golem_walk0', 1), 'foe_guard': ('s_guard_walk0', 1), 'foe_rk': ('s_rk_walk0', 1), 'foe_sc': ('s_sc_walk0', 1), 'foe_sh': ('s_sh_bwalk', 1) }
for k, (f, n) in SPR.items(): fit(o(f), 96, n).save(os.path.join(OUT, k + '.png'))
for f in ['i_coin', 'i_food', 'i_herb', 'i_clay', 'i_stone', 'i_pot', 'i_gem0', 'i_gem1', 'i_gem2']:
    o(f).resize((27, 27), Image.NEAREST).save(os.path.join(OUT, f + '.png'))
print('ok', len(os.listdir(OUT)))
