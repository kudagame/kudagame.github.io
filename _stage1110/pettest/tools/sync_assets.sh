#!/bin/bash
# 把最新的寵物美術、主角與小怪圖複製進 pettest/assets（打包前跑；本機用 serve.mjs 開時會直接讀 chars/pets 的最新匯出）
set -e; cd "$(dirname "$0")/.."; G=..
rm -rf assets/pets && mkdir -p assets/pets assets/hero assets/mon
for d in $G/chars/pets/*/out; do sp=$(basename $(dirname $d)); [ -f $d/anchors.json ] || continue; mkdir -p assets/pets/$sp; cp $d/*.png $d/anchors.json assets/pets/$sp/; done
python3 - <<'PY'
import json,os
m={}
for sp in sorted(os.listdir('assets/pets')):
    f=f'assets/pets/{sp}/anchors.json'
    if os.path.exists(f): m[sp]=json.load(open(f))
open('assets/pets/manifest.js','w').write('window.PET_ART_MANIFEST='+json.dumps(m,separators=(',',':'))+';\n')
print('pets:',list(m))
PY
for f in idle run0 run1 run2 run3 swing windup; do cp $G/web/a/s_kudas_$f.png assets/hero/; done
for m in spider_minion ether_axe ether_archer gem_looter; do cp $G/monsters/${m}_sheet.png $G/monsters/${m}_sheet.json assets/mon/; done
python3 - <<'PY'
import json
o={}
for m in ['spider_minion','ether_axe','ether_archer','gem_looter']:
    j=json.load(open(f'assets/mon/{m}_sheet.json')); o[m]={k:j.get(k) for k in ['frame_w','frame_h','anchor','face']}; o[m]['anims']={k:{'fps':v.get('fps',8),'frames':v['frames']} for k,v in j['anims'].items()}
open('assets/mon/mon.js','w').write('window.PET_MON='+json.dumps(o,separators=(',',':'))+';\n')
PY
echo "assets synced: $(du -sh assets | cut -f1)"
python3 "$(dirname "$0")/sync_stage_art.py" && echo "stage art synced"
python3 "$(dirname "$0")/sync_portraits.py"
mkdir -p assets/music && cp $G/music/pet/*.ogg assets/music/ && echo "pet music synced"
[ -f assets/scenes/shelter/yard_day_bg.jpg ] || python3 $G/chars/pets/scenes/build_yard.py && echo "shelter scenes ok"
[ -f assets/scenes/camp/camp_day_bg.jpg ] || python3 $G/chars/pets/scenes/build_camp.py && echo "camp scene ok"
[ -f assets/scenes/expedition/depart_day_bg.jpg ] || python3 $G/chars/pets/scenes/build_exp.py /workspace/p4shots/assets_samples/scenes && echo "expedition scene ok"
[ -f assets/scenes/contest/village_bg.jpg ] || python3 $G/chars/pets/scenes/build_contest.py /workspace/p4shots/assets_samples/scenes && echo "contest scene ok"
mkdir -p assets/sfx && cp $G/music/sfx/*.ogg assets/sfx/ && echo "pet sfx synced"
