// 訓練營場景（1 個畫面 1280×720，背景 chars/pets/scenes/build_camp.py）
// 畫面上看得到的：去「集訓」的寶貝在自己的項目那一站練習；剛做完日常訓練的會在那一站多待一下；晚上大家去休息屋睡覺。
// 點一站＝打開那個項目的訓練面板；點寵物＝選牠訓練（集訓中的會說幾點回來）。規則都在 pet_p3.js，這裡只有畫面。
'use strict';
(function (P) {
  const H = 3600e3;
  // 站點（跟 build_camp.py SPOT 一致）＋每站的動作
  P.CAMP_SPOT = { log: { x: 150, y: 420, act: 'attack', name: '搬木頭' }, butterfly: { x: 380, y: 360, act: 'run', name: '追蝴蝶' }, hill: { x: 640, y: 335, act: 'walk', name: '爬山路' },
    knot: { x: 820, y: 390, act: 'cast', name: '解繩結' }, dig: { x: 1000, y: 420, act: 'attack', name: '挖寶藏' }, rest: { x: 1150, y: 385, act: 'sleep', name: '休息區' } };
  P.CAMP_COOL_H = 1;   // 日常訓練完，在那一站多待 1 小時（只是畫面）
  // 記住最後練的項目（只為了畫在對的那一站，不影響數值）
  const train0 = P.train; P.train = (p, dk) => { const r = train0(p, dk); if (r.ok) { p.trDr = dk; p.trAt = P.now() } return r };
  const night = () => !!(P.isNight && P.isNight());
  // 現在在訓練營裡的寵物：[{ p, spot, act, kind: 'camp'｜'cool' }]
  P.campCrew = () => {
    const out = [], t = P.now(), N = night();
    for (const p of P.all()) {
      const a = p.away;
      if (a && a.kind === 'camp' && t < a.until) { const d = P.DRILL.find(x => x.name === a.name) || P.DRILL[0]; out.push({ p, spot: N ? 'rest' : d.k, act: N ? 'sleep' : P.CAMP_SPOT[d.k].act, kind: 'camp' }); continue }
      if (!P.out(p) && p.trDr && p.trAt && t - p.trAt < P.CAMP_COOL_H * H && P.CAMP_SPOT[p.trDr]) out.push({ p, spot: N ? 'rest' : p.trDr, act: N ? 'sleep' : 'idle', kind: 'cool' });
    }
    return out;
  };
  P.scenes = P.scenes || {};
  if (!P.ui || typeof Image === 'undefined') return;   // 以下是畫面（node 測試只載上面的規則）
  const UI = P.ui, IMG = {}; for (const k of ['camp_day_bg', 'camp_night_bg']) { const im = new Image(); im.src = `assets/scenes/camp/${k}.jpg`; IMG[k] = im }
  const ok = im => im && im.complete && im.naturalWidth > 0;
  let T = null; const pos = {};
  function bar() { UI.bar([['⬅ 回農場', () => P.go('farm')], ['📋 訓練／集訓', () => P.ui3.camp()]]) }
  function tag(ctx, t, x, y, col) { if (P.art && P.art.tagBox) { P.art.tagBox(ctx, t, x, y, { size: 15, pad: 6, h: 22, col: col || '#fff', s: 2, st: [2, 1] }); return } ctx.font = 'bold 15px sans-serif'; const w = ctx.measureText(t).width + 12; ctx.fillStyle = 'rgba(26,16,22,.78)'; ctx.fillRect(x - w / 2, y - 17, w, 22); ctx.fillStyle = col || '#fff'; ctx.fillText(t, x - w / 2 + 6, y) }
  function place(c, i, n) {   // 同一站有好幾隻：左右排開；山路來回走、蝴蝶繞圈
    const S = P.CAMP_SPOT[c.spot], k = pos[c.p.id] || (pos[c.p.id] = { t: Math.random() * 9 }); const off = (i - (n - 1) / 2) * 58;
    let x = S.x + off, y = S.y + (i % 2) * 14, flip = i % 2 === 1;
    if (c.spot === 'rest') { const col = i % 4, row = Math.floor(i / 4); x = 1170 - col * 100 - row * 50; y = 395 + row * 75; flip = row % 2 === 1 }   // 休息屋前排成兩排
    if (c.act === 'walk') { const u = (Math.sin(k.t * 0.6 + i) + 1) / 2; x = S.x - 30 + off * 0.5; y = 285 + u * 70; flip = Math.cos(k.t * 0.6 + i) < 0 }
    if (c.act === 'run') { x = S.x + off + Math.cos(k.t * 1.4 + i) * 50; y = S.y + Math.sin(k.t * 1.4 + i) * 18; flip = Math.sin(k.t * 1.4 + i) > 0 }
    k.x = x; k.y = y; return { k, x, y, flip };
  }
  P.scenes.train = {
    enter() {
      if (!P.S.fac || !P.S.fac.camp) { UI.toast('還沒蓋訓練營'); return P.go('farm') }
      T = { t: 0 }; bar(); const S = P.S; S.hint3 = S.hint3 || {};
      if (!S.hint3.camp) { S.hint3.camp = 1; setTimeout(() => UI.toast('獵犬：「汪！點一站就能練那一項。去集訓的孩子會在這裡練給你看。」', 5000), 400) }
    },
    leave() { T = null },
    update(dt) { if (!T) return; T.t += dt; for (const id in pos) pos[id].t += dt },
    draw(ctx) {
      if (!T) return; const A = P.art, N = night(), bg = IMG[N ? 'camp_night_bg' : 'camp_day_bg'];
      if (ok(bg)) ctx.drawImage(bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#8cc46a'; ctx.fillRect(0, 0, 1280, 720) }
      const crew = P.campCrew(), by = {}; for (const c of crew) (by[c.spot] = by[c.spot] || []).push(c);
      for (const [k, S] of Object.entries(P.CAMP_SPOT)) { const n = (by[k] || []).length; tag(ctx, `${S.name}${n ? ' ×' + n : ''}`, S.x, k === 'hill' ? 222 : S.y - 120, n ? '#ffe36b' : '#fff') }
      const items = []; for (const [k, L] of Object.entries(by)) L.forEach((c, i) => items.push({ c, ...place(c, i, L.length) }));
      const NF = N && 'filter' in ctx ? 'brightness(.72) saturate(.8)' : '';
      items.sort((a, b) => a.y - b.y).forEach(({ c, k, x, y, flip }) => {
        const p = c.p, sc = p.baby ? 1.6 : 2; if (A && A.ready) { if (NF) ctx.filter = NF; A.draw(ctx, p, x, y, { act: c.act, t: k.t, flip, scale: sc }); if (NF) ctx.filter = 'none' }
      });
      items.forEach(({ c, x, y }) => tag(ctx, c.kind === 'camp' ? `⛺ ${P.label(c.p)}` : P.label(c.p), x, y + 26, c.kind === 'camp' ? '#cfe3ff' : '#fff'));   // 名牌最後畫，不會被後面的寵物蓋住
      if (!crew.length) tag(ctx, '獵犬：「今天還沒有人來練習。點一站試試看！」', 640, 560, '#ffe36b');
    },
    tap(x, y) {
      if (!T) return; let best = null, bd = 60; for (const id in pos) { const p = P.byId(+id); const c = p && P.campCrew().find(c => c.p === p); if (!c) continue; const k = pos[id], d = Math.hypot(k.x - x, (k.y - 30) - y); if (d < bd) { bd = d; best = c } }
      if (best) { const p = best.p; if (best.kind === 'camp') return UI.toast(`${P.label(p)} 正在集訓（${p.away.name}），${UI.fmtTime(p.away.until)} 回來`, 3500); return P.ui3.camp(p.id, p.trDr) }
      for (const [k, S] of Object.entries(P.CAMP_SPOT)) if (Math.abs(x - S.x) < 90 && Math.abs(y - (S.y - 40)) < 90) return k === 'rest' ? P.ui3.camp() : P.ui3.camp(0, k);
    },
    hud() { const n = P.campCrew().filter(c => c.kind === 'camp').length; return `<span>🏋️ 訓練營</span><span>⛺ 集訓中 ${n} 隻</span>` },
  };
})(window.PET);
