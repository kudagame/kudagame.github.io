#!/usr/bin/env bash
# 做出「正式版」的寵物包：拿掉 dev/ 資料夾、<!--DEV-->…<!--/DEV--> 和 /*DEV*/…/*/DEV*/ 區塊，再跑 check_no_dev.sh。
# 用法：pettest/tools/build_release.sh [輸出資料夾]（預設 pettest_release/）
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"; GAME="$(cd "$HERE/.." && pwd)"
OUT="${1:-$GAME/pettest_release}"
rm -rf "$OUT"; mkdir -p "$OUT"
cp -r "$HERE/index.html" "$HERE/pet" "$HERE/assets" "$OUT/"
python3 - "$OUT" <<'PY'
import re, sys, pathlib
out = pathlib.Path(sys.argv[1])
for f in out.rglob('*'):
    if f.suffix not in ('.html', '.js', '.css'): continue
    s = f.read_text(encoding='utf-8'); o = s
    s = re.sub(r'<!--DEV-->.*?<!--/DEV-->\s*', '', s, flags=re.S)
    s = re.sub(r'/\*DEV\*/.*?/\*/DEV\*/\s*', '', s, flags=re.S)
    if s != o: f.write_text(s, encoding='utf-8'); print('拿掉開發者區塊：', f.relative_to(out))
PY
echo "輸出：$OUT"
"$GAME/tools/check_no_dev.sh" "$OUT"
