// 育兒籃的蛋（11/03）：孵化進度、快孵化時的裂痕（3 階段）、點蛋「輕輕敲」讓寶寶早一點出來。
// 原本規則不變：籃子送來後，下一次 05:00 結算（滿 12 小時）出生。敲蛋把孵化時間往前移，移到現在就當場孵化。
// 數字：每敲一下提早 15 分鐘；每顆蛋最多 8 下（最多提早 2 小時，約全程的 8%）；兩下之間至少隔 1.5 秒（防連點）。
'use strict';
(function (P) {
  const C = P.CFG, H = 3600e3, M = 60e3;
  const E = C.egg = Object.assign({ tapMin: 15, tapMax: 8, gapSec: 1.5, crack: [0.7, 0.8, 0.9] }, C.egg || {});
  const natDue = bk => { const k = P.dayKey(bk.since); let d = P.dayStart(k + 1); if (d - bk.since < C.pregMinHours * H) d = P.dayStart(k + 2); return d };
  P.eggDue = c => c.basket ? natDue(c.basket) - (c.basket.tap || 0) * E.tapMin * M : null;
  P.eggProg = c => { const bk = c.basket; if (!bk) return 0; const due = P.eggDue(c); return Math.max(0, Math.min(1, (P.now() - bk.since) / Math.max(1, due - bk.since))) };
  P.eggStage = c => { const p = P.eggProg(c); return p >= E.crack[2] ? 3 : p >= E.crack[1] ? 2 : p >= E.crack[0] ? 1 : 0 };   // 0＝完整的蛋
  P.eggTapsLeft = c => c.basket ? Math.max(0, E.tapMax - (c.basket.tap || 0)) : 0;
  // 台詞：蜜糖媽媽講。同一池子輪流，不會連續兩次一樣
  const TAP = ['輕輕敲一下，寶寶會早點出來喔', '叩叩～寶寶聽到你在等他了。', '蛋殼暖暖的，裡面的小傢伙在動呢！', '再輕一點點……對，就是這樣。', '你一敲，寶寶就在裡面踢了一下，好有精神！', '寶寶在說：快好了、快好了！'];
  const CAP = ['不要揠苗助長喔。', '留一些給孩子自己努力吧～', '好啦好啦，剩下的讓寶寶自己來。', '再敲下去，寶寶要害羞躲起來囉。', '慢慢來比較快，我們一起等他就好。', '蛋殼也要休息一下，寶寶自己會出來的。', '心急吃不了熱麵包，再等等他吧～'];
  const last = {};
  const pick = (k, arr) => { let i; do { i = Math.floor(Math.random() * arr.length) } while (arr.length > 1 && i === last[k]); last[k] = i; return arr[i] };
  P.EGG_LINES = { TAP, CAP };
  // 敲蛋：回傳 {ok, line, min, left, hatched}
  P.knockEgg = c => {
    const bk = c && c.basket; if (!bk) return { ok: 0 };
    const t = P.now(); if (bk.tapT && t - bk.tapT < E.gapSec * 1000) return { ok: 0, quiet: 1 };
    if ((bk.tap || 0) >= E.tapMax) { bk.tapT = t; return { ok: 0, cap: 1, line: pick('cap', CAP) } }
    bk.tap = (bk.tap || 0) + 1; bk.tapT = t;
    const r = { ok: 1, line: pick('tap', TAP), min: E.tapMin, left: E.tapMax - bk.tap };
    if (t >= P.eggDue(c)) { const out = P.birth(c, P.dayKey(t)); r.hatched = 1; r.n = (out || []).length; P.emit('birth', `敲了敲，蛋殼裂開了——寶寶提早出生！`) }
    P.save && P.save(); return r;
  };
  // 敲過的蛋，時間到了就當場孵化（沒敲過的照原本 05:00 結算）
  P.eggTick = () => { const S = P.S; if (!S || !S.cots) return; for (const c of S.cots) if (c.basket && c.basket.tap && P.now() >= P.eggDue(c)) { P.birth(c, P.dayKey(P.now())); P.emit('birth', '敲過的蛋孵出來了！'); P.save && P.save() } };
  setInterval(() => { try { P.eggTick() } catch (e) { } }, 5000);
})(window.PET);
