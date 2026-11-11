// 收容所（總匯總部後院 蜜糖之家）
'use strict';
(function (P) {
  const UI = P.ui || (P.ui = {}), C = P.CFG;
  const SH = P.scenes = P.scenes || {};
  const st = {}; let T = 0, sel = null;
  // 院子可以走的範圍（避開後牆、櫃檯、小屋、堆肥箱；數字照 chars/pets/scenes/yard_layout.json）
  const YARD = { x0: 270, x1: 1060, y0: 420, y1: 650 };
  // P3：二館蓋好以後，院子往右延伸一個畫面（世界寬 2560），用「➡ 二館」或拖曳草地左右看；施工中也能看工地
  let camX = 0, camTo = 0, held = null;
  const ANX = () => P.S.annex === 1, BLD = () => !!(P.S.annex && P.S.annex.until), WIDE = () => ANX() || BLD(), WW = () => WIDE() ? 2560 : 1280;
  // 背景圖（AI 底稿＋程式修整，見 chars/pets/scenes/build_yard.py）；讀不到就退回原本的程式畫法
  const IMG = {}; for (const k of ['yard_day_bg', 'yard_night_bg', 'annex_day_bg', 'annex_night_bg', 'annex_build_day_bg', 'annex_build_night_bg']) { const im = P.art.lazyImage(`assets/scenes/shelter/${k}${/^annex/.test(k) ? '_s' : ''}.jpg`); IMG[k] = im }   // P5.1 #7：二館背景用接縫修過的版本（tools/build_p51_art.py）
  for (const k of ['hut', 'hut_night', 'basket_empty', 'basket_empty_night', 'basket_egg', 'basket_egg_night', 'basket_egg_c1', 'basket_egg_c1_night', 'basket_egg_c2', 'basket_egg_c2_night', 'basket_egg_c3', 'basket_egg_c3_night', 'poop', 'poop_night', 'poop_big', 'poop_big_night']) { const im = P.art.lazyImage(`assets/scenes/shelter/${k}.png`); IMG[k] = im }
  const ok = im => P.art.imageOK(im);
  const night = () => { if (P.isNight) return P.isNight(); const h = new Date(P.now() + (C.tz || 8) * 3600e3).getUTCHours(); return h >= 18 || h < 6 };
  // 小屋：底邊中心（前面那間 y 大一點，畫的時候照 y 排序）；小屋 148px 寬
  const COT = [[952, 382], [1076, 404], [1200, 382], [1495, 416], [2016, 398]], HUT_W = 148, HUT_H = 147;
  const cotPos = i => { const c = COT[Math.min(i, COT.length - 1)]; return { cx: c[0], by: c[1], x: c[0] - 40, y: c[1] - 70 } };
  const WANDER = [[1030, 500], [1060, 580], [1030, 660]], WANDER_A = [[2470, 352], [2515, 380], [2440, 408]];
  const wPos = i => { const w = (ANX() ? WANDER_A : WANDER)[i % 3]; return { x: w[0], y: w[1] } };
  function syncYard() { YARD.x1 = ANX() ? 2380 : 1060; P.POOP_YARD.x1 = ANX() ? 2350 : 1050 }
  P.shelterView = () => camX; P.cotXY = i => cotPos(i); P.shelterPan = x => { camTo = camX = Math.max(0, Math.min(WW() - 1280, x)) };
  P.shelterCam = v => { camTo = Math.max(0, Math.min(WW() - 1280, v)) };
  function sOf(p) {
    let s = st[p.id]; if (!s) { s = st[p.id] = { x: P.ri(YARD.x0, YARD.x1), y: P.ri(YARD.y0, YARD.y1), act: 'idle', until: 0, t: Math.random() * 3, flip: Math.random() < 0.5, born: T } }
    return s;
  }
  P.shelterAct = (p, act, sec) => { const s = sOf(p); s.act = act; s.until = T + sec; s.tx = null };
  function think(p, s) {
    if (s.job) return;
    if (T < s.until) return;
    const sleepy = p.pers === 3, r = Math.random();
    if (r < (sleepy ? 0.25 : 0.1)) { s.act = 'sleep'; s.until = T + 4 + Math.random() * 6; s.tx = null }
    else if (r < 0.55) { s.act = 'walk'; s.tx = P.ri(YARD.x0, YARD.x1); s.ty = P.ri(YARD.y0, YARD.y1); s.until = T + 8 }
    else { s.act = 'idle'; s.until = T + 2 + Math.random() * 3; s.tx = null }
  }
  function bg(ctx) {
    const nt = night(), y = IMG[nt ? 'yard_night_bg' : 'yard_day_bg'];
    if (!ok(y)) return bgOld(ctx);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(y, 0, 0, 1280, 720);
    const a = ANX() ? IMG[nt ? 'annex_night_bg' : 'annex_day_bg'] : BLD() ? IMG[nt ? 'annex_build_night_bg' : 'annex_build_day_bg'] : null;
    if (a && ok(a)) ctx.drawImage(a, 1280, 0, 1280, 720);
    // 看得懂的木牌字（玩家一眼就知道哪裡可以點）
    plate(ctx, '蜜糖媽媽櫃檯', 206, 118);
    if (ANX()) plate(ctx, '蜜糖之家 二館', 1280 + 432, 82);
    if (BLD()) { const left = Math.max(0, P.S.annex.until - P.now()), h = Math.ceil(left / 3600000); plate(ctx, `二館 施工中（還要 ${h} 小時）`, 1280 + 600, 330) }
  }
  function plate(ctx, txt, x, y) { ctx.font = 'bold 18px sans-serif'; const w = ctx.measureText(txt).width + 24; P.art.pxBox(ctx, x - w / 2, y - 22, w, 32, { s: 2, st: [3, 1], edge: '#1A1016', fill: '#f3d27a', hi: '#fff0b8', lo: '#c99a45' }); ctx.fillStyle = '#1A1016'; ctx.fillText(txt, x - w / 2 + 12, y) }   // P5.1 #6：圓角、階梯邊
  let basketTags = [];
  function drawHuts(ctx) {   // 小屋貼圖＋育兒籃（照 y 由後往前）
    const nt = night(), im = IMG[nt ? 'hut_night' : 'hut'];
    const idx = P.S.cots.map((c, i) => i).filter(i => !P.S.cots[i].farm).sort((a, b) => cotPos(a).by - cotPos(b).by);
    basketTags = [];   // 籃子的字等寵物畫完才畫（draw 裡），不會被隔壁籃子或走過去的寵物蓋住
    for (const i of idx) {
      const c = P.S.cots[i], { cx, by } = cotPos(i);
      if (ok(im) && P.drawHutFaced) P.drawHutFaced(ctx, im, c.face || 'L', cx, by); else if (ok(im)) ctx.drawImage(im, cx - im.width / 2, by - im.height + 8); else { ctx.fillStyle = '#e8b878'; ctx.fillRect(cx - 60, by - 90, 120, 90) }
      label(ctx, '小屋' + (i + 1), cx, by - HUT_H + 4, '#ffd');
      // 育兒籃（pet_egg.js）：蛋 →（最後 3 成時間）裂痕 1→2→3 階段、越來越常搖；點蛋＝輕輕敲；生完那天小屋休息，放空籃子
      const stg = c.basket ? (P.eggStage ? P.eggStage(c) : 0) : -1, bst = c.basket ? (stg ? 'egg_c' + stg : 'egg') : (c.cool && c.cool > P.now() ? 'empty' : null);
      if (bst) { const bi = IMG['basket_' + bst + (nt ? '_night' : '')], bob = Math.round(Math.sin(T * 4) * 3), bby = by + 14, fx = eggFx[i];
        // 搖晃：裂痕越多搖越頻繁；剛敲完大力搖 0.5 秒
        const per = [0, 3.2, 2.2, 1.3][Math.max(0, stg)], ph = per ? (T + i * 0.7) % per : 9, hit = fx && T - fx.t < 0.5 ? 1 - (T - fx.t) / 0.5 : 0;
        const ang = (ph < 0.45 ? Math.sin(ph * 42) * 0.07 * (1 - ph / 0.45) : 0) + Math.sin((T - (fx ? fx.t : 0)) * 50) * 0.12 * hit;
        ctx.save(); ctx.translate(cx, bby + 62); ctx.rotate(ang);
        if (ok(bi)) ctx.drawImage(bi, -bi.width / 2, -62); else { ctx.fillStyle = '#d9a35b'; ctx.fillRect(-24, -40, 48, 26) }
        ctx.restore();
        if (fx && T - fx.t < 0.9) eggBurst(ctx, cx, bby + 22, T - fx.t, fx.cap);
        if (c.basket) { P.art.px(ctx, P.art.HEART, cx - 7, bby - 18 + bob, 2); basketTags.push([stg ? '快孵了！' : '育兒籃', cx, bby + 84]) } }
    }
  }
  // 敲蛋的回饋：碎蛋殼往外彈＋金色小星星；敲到上限只冒一個小汗滴，不噴碎片
  const eggFx = {};
  function eggBurst(ctx, x, y, t, cap) {
    if (cap) { ctx.fillStyle = '#9fd8ff'; ctx.fillRect(Math.round(x + 22), Math.round(y - 14 - t * 20), 4, 6); return }
    for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.45, v = 70 + (k % 3) * 18, px = x + Math.cos(a) * v * t, py = y + Math.sin(a) * v * t + 160 * t * t;
      ctx.fillStyle = '#1A1016'; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 6, 5); ctx.fillStyle = k % 2 ? '#fff3dc' : '#f0d8b0'; ctx.fillRect(Math.round(px), Math.round(py), 4, 3) }
    const sz = Math.round(6 * (1 - t)); if (sz > 0) for (const [dx, dy] of [[-20, -16], [20, -22], [0, -30]]) { ctx.fillStyle = '#ffe36b'; ctx.fillRect(x + dx - sz, y + dy - 1, sz * 2, 3); ctx.fillRect(x + dx - 1, y + dy - sz, 3, sz * 2) }
    ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = `rgba(255,236,140,${1 - t})`; ctx.fillText('叩叩！', x - 22, y - 38 - t * 24);
  }
  function knock(i) {
    const c = P.S.cots[i], r = P.knockEgg ? P.knockEgg(c) : { ok: 0 }; if (r.quiet) return;
    eggFx[i] = { t: T, cap: !r.ok };
    if (r.cap) return UI.toast(`蜜糖媽媽：「${r.line}」`, 3200);
    if (!r.ok) return;
    if (r.hatched) { UI.toast(`蛋殼啪地裂開——寶寶提早出生了！${r.n ? `（${r.n} 隻，快去育兒室看看）` : ''}`, 4200); return P.shelterBar() }
    UI.toast(`蜜糖媽媽：「${r.line}」　（早 ${r.min} 分鐘出生，這顆蛋還能敲 ${r.left} 下）`, 2600);
  }
  function bgOld(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, '#f2a96b'); g.addColorStop(1, '#f7d79a'); ctx.fillStyle = g; ctx.fillRect(0, 0, WW(), 260);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(0, 150, WW(), 140); // 總匯總部後牆
    ctx.fillStyle = '#6e4630'; for (let x = 0; x < WW(); x += 64) ctx.fillRect(x, 150, 6, 140);
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(520, 175, 240, 70); ctx.fillStyle = '#1A1016'; ctx.fillRect(516, 171, 248, 4); ctx.fillRect(516, 245, 248, 4); ctx.fillRect(516, 171, 4, 78); ctx.fillRect(760, 171, 4, 78); ctx.fillRect(638, 171, 4, 78);
    ctx.fillStyle = '#1A1016'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('育兒室', 612, 166);
    ctx.fillStyle = '#7fb069'; ctx.fillRect(0, 290, WW(), 430);
    ctx.fillStyle = '#6a9a58'; for (let i = 0; i < (ANX() ? 180 : 90); i++) { const x = (i * 157) % WW(), y = 300 + (i * 89) % 410; ctx.fillRect(x, y, 6, 3) }
    // 圍欄
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(0, 300, WW(), 10); for (let x = 8; x < WW(); x += 40) { ctx.fillRect(x, 280, 10, 40) }
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(ANX() ? 2430 : 1150, 290, 12, 430); // 右邊圍欄
    if (ANX()) { // 二館的門牌與窗戶
      ctx.fillStyle = '#1A1016'; ctx.fillRect(1436, 166, 208, 50); ctx.fillStyle = '#f3d27a'; ctx.fillRect(1440, 170, 200, 42); ctx.fillStyle = '#1A1016'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('蜜糖之家 二館', 1474, 198);
      ctx.fillStyle = '#ffe9a8'; for (const wx of [1320, 1720]) { ctx.fillRect(wx, 180, 90, 60); ctx.fillStyle = '#1A1016'; ctx.fillRect(wx + 43, 180, 4, 60); ctx.fillStyle = '#ffe9a8' }
    }
    // 櫃檯
    ctx.fillStyle = '#1A1016'; ctx.fillRect(36, 336, 208, 120); ctx.fillStyle = '#d99a5b'; ctx.fillRect(40, 340, 200, 112); ctx.fillStyle = '#b5793a'; ctx.fillRect(40, 400, 200, 52);
    ctx.fillStyle = '#1A1016'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('蜜糖媽媽櫃檯', 66, 380);
    // 小屋（舊畫法，只在讀不到圖時用）
    P.S.cots.forEach((c, i) => { if (c.farm) return; const { x, y } = { x: 880 + i * 92, y: 310 }; ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 4, y - 4, 88, 74); ctx.fillStyle = '#e8b878'; ctx.fillRect(x, y + 20, 80, 46); ctx.fillStyle = '#c2564a'; ctx.beginPath(); ctx.moveTo(x - 6, y + 22); ctx.lineTo(x + 40, y - 14); ctx.lineTo(x + 86, y + 22); ctx.fill(); ctx.fillStyle = '#1A1016'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('小屋' + (i + 1), x + 16, y + 48); if (c.basket) { const bx = x + 22, by = y + 72, bob = Math.round(Math.sin(T * 4) * 3); ctx.fillStyle = '#1A1016'; ctx.fillRect(bx - 3, by - 3, 42, 26); ctx.fillStyle = '#d9a35b'; ctx.fillRect(bx, by, 36, 20); ctx.fillStyle = '#b5793a'; for (let k = 0; k < 4; k++) ctx.fillRect(bx + 3 + k * 9, by + 3, 4, 14); ctx.fillStyle = '#fff3d6'; ctx.fillRect(bx + 4, by - 6, 28, 8); P.art.px(ctx, P.art.HEART, bx + 11, by - 26 + bob, 2); label(ctx, '育兒籃 點我', bx + 18, by + 42, '#ffd') } });
  }
  // ---------- 便便、浣熊、泡泡 ----------
  const bub = {};   // id → {txt, until}
  function say(p, txt, sec) { if (!txt) return; if (P.speak) return P.speak(p, txt, sec || 3); bub[p.id] = { txt, until: T + (sec || 3) } }   // P5.1 #3：全部改成頭上的像素泡泡
  // ---------- P4.4 小屋「一起玩」：兩隻在院子裡跑到一起，追著繞圈、面對面蹦跳、冒愛心 ----------
  const plays = [], fx = [];
  const PLAY_L = { 0: ['來追我呀！', '抓到你了！換你當鬼！'], 1: ['慢慢玩，好開心。', '跟你在一起，好安心。'], 2: ['玩完要一起吃點心喔！', '追到你，點心分我一半！'], 3: ['玩一下下……再睡覺……', '呼……好好玩……'], 4: ['你的尾巴怎麼會動？', '我們來比誰跳得高！'] };
  const playLine = (p, i) => (PLAY_L[p.pers] || PLAY_L[0])[i];
  P.shelterPlay = (a, b) => {
    if (!a || !b || a === b || P.out(a) || P.out(b)) return false;
    for (let i = plays.length - 1; i >= 0; i--) if ([plays[i].a, plays[i].b].some(x => x === a || x === b)) plays.splice(i, 1);
    const sa = sOf(a), sb = sOf(b);
    const mx = Math.max(YARD.x0 + 70, Math.min(YARD.x1 - 70, (sa.x + sb.x) / 2)), my = Math.max(YARD.y0 + 12, Math.min(YARD.y1 - 12, (sa.y + sb.y) / 2));
    plays.push({ a, b, mx, my, t: 0, ph: 'go', ht: 0, hop: 0 });
    [[sa, -40], [sb, 40]].forEach(([s, d]) => { s.job = { play: 1 }; s.tx = mx + d; s.ty = my; s.act = 'walk'; s.until = T + 99 });
    if (WIDE()) P.shelterCam(mx - 640);
    return true;
  };
  P.shelterPlaying = () => plays.length;
  const heartAt = (x, y, big) => fx.push({ x: x + (Math.random() - 0.5) * (big ? 70 : 40), y, vx: (Math.random() - 0.5) * 20, vy: -(40 + Math.random() * 30), life: big ? 1.8 : 1.4, t: 0, s: big ? 5 : 4 });
  function playTick(dt) {
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.t > f.life) fx.splice(i, 1) }
    for (let i = plays.length - 1; i >= 0; i--) {
      const q = plays[i], sa = sOf(q.a), sb = sOf(q.b); q.t += dt;
      if (P.out(q.a) || P.out(q.b) || !P.byId(q.a.id) || !P.byId(q.b.id) || (held && (held.p === q.a || held.p === q.b))) { plays.splice(i, 1); sa.until = sb.until = 0; continue }
      for (const s of [sa, sb]) { s.tidyT = 0; s.job = q.ph === 'go' && s.tx != null ? { play: 1 } : null; s.until = T + 99 }   // 跑過去（比平常走路快）
      if (q.ph === 'go') {
        for (const s of [sa, sb]) if (s.tx == null) s.act = 'idle';
        if ((sa.tx == null && sb.tx == null) || q.t > 6) { q.ph = 'play'; q.t0 = q.t; sa.tx = sb.tx = null; say(q.a, playLine(q.a, 0), 2.4) }
        continue;
      }
      const pt = q.t - q.t0;
      const ease = (s, x, y) => { const dx = x - s.x; s.x += dx * Math.min(1, dt * 10); s.y += (y - s.y) * Math.min(1, dt * 10); return dx };
      if (pt < 2.8) {   // 追著繞圈：往哪邊跑就面向哪邊
        const g = pt * 2.6, cx = Math.cos(g) * 46, cy = Math.sin(g) * 16;
        for (const [s, k] of [[sa, 1], [sb, -1]]) { const dx = ease(s, q.mx + cx * k, q.my + cy * k); if (Math.abs(dx) > 0.4) s.flip = dx < 0; s.act = 'walk' }
      } else {   // 面對面蹦蹦跳、碰碰鼻子
        const n = Math.sin((pt - 2.8) * 7) * 6;
        ease(sa, q.mx - 30 + n, q.my); ease(sb, q.mx + 30 - n, q.my); sa.flip = false; sb.flip = true; sa.act = sb.act = 'happy';
        q.hop -= dt; if (q.hop <= 0) { q.hop = 0.45; const s = (q.k = !q.k) ? sa : sb; s.drop = T }
        if (!q.said) { q.said = 1; say(q.b, playLine(q.b, 0), 2.4) }
      }
      q.ht -= dt; if (q.ht <= 0) { q.ht = pt < 2.8 ? 0.35 : 0.2; heartAt(q.mx, q.my - 70) }
      if (pt > 5.4) {   // 玩完：大愛心＋各說一句
        plays.splice(i, 1); for (let k = 0; k < 6; k++) heartAt(q.mx, q.my - 80, 1);
        sa.act = sb.act = 'happy'; sa.until = sb.until = T + 1.6; say(q.a, playLine(q.a, 1), 3); say(q.b, playLine(q.b, 1), 3);
      }
    }
  }
  function playFx(ctx) { const A = P.art; if (!A || !A.HEART) return; for (const f of fx) { ctx.globalAlpha = Math.max(0, 1 - f.t / f.life); A.px(ctx, A.HEART, f.x - 3.5 * f.s, f.y - 3.5 * f.s, f.s) } ctx.globalAlpha = 1 }
  let bubR = [];
  function bubble(ctx, txt, x, y) {   // P4.4：字多就換行（字的大小不變），泡泡跟著變高
    ctx.font = 'bold 14px sans-serif'; const MW = 252, LH = 18, lines = []; let cur = '';
    for (const ch of String(txt)) { if (cur && ctx.measureText(cur + ch).width > MW) { lines.push(cur); cur = ch === ' ' ? '' : ch } else cur += ch }
    if (cur) lines.push(cur);
    for (let i = 1; i < lines.length; i++) { const m = lines[i].match(/^[，。！？、…」』）～：；,.!?]+/); if (m) { lines[i - 1] += m[0]; lines[i] = lines[i].slice(m[0].length) } }   // 標點不放在行首
    const ls = lines.filter(l => l), w = Math.max(...ls.map(l => ctx.measureText(l).width)) + 14, h = ls.length * LH + 6, bx = Math.max(4, Math.min(1276 - w, x - w / 2)); let by = y - h;
    for (let k = 0; k < 6; k++) { const r = bubR.find(r => bx < r.x + r.w + 4 && bx + w + 4 > r.x && by < r.y + r.h + 10 && by + h + 10 > r.y); if (!r) break; by = r.y - h - 12 }   // 兩個泡泡疊到就往上排開
    bubR.push({ x: bx, y: by, w, h });
    ctx.fillStyle = '#1A1016'; ctx.fillRect(bx - 2, by - 2, w + 4, h + 4); ctx.fillStyle = '#fffaf0'; ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 4, by + h + 2, 8, 4); ctx.fillRect(x - 2, by + h + 6, 4, 3); ctx.fillStyle = '#fffaf0'; ctx.fillRect(x - 2, by + h, 4, 4);
    ctx.fillStyle = '#1A1016'; ls.forEach((l, i) => ctx.fillText(l, bx + 7, by + 17 + i * LH));
  }
  function drawPoop(ctx, x, y, sc) { // 像素便便（chars/pets/scenes/build_props.py；原生 16×14，底邊中心對準 x,y+3sc）
    const im = IMG[(sc > 2.5 ? 'poop_big' : 'poop') + (night() ? '_night' : '')]; if (!ok(im)) return drawPoopOld(ctx, x, y, sc);
    const w = Math.round(16 * sc), h = Math.round(14 * sc); ctx.imageSmoothingEnabled = false; ctx.drawImage(im, Math.round(x - w / 2), Math.round(y + 3 * sc - h), w, h);
  }
  function drawPoopOld(ctx, x, y, sc) { // 像素便便（讀不到圖時用）
    const q = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a * sc), Math.round(y + b * sc), Math.ceil(w * sc), Math.ceil(h * sc)) };
    q(-7, -1, 14, 4, '#1A1016'); q(-6, -5, 12, 4, '#1A1016'); q(-4, -8, 8, 3, '#1A1016'); q(-2, -10, 4, 2, '#1A1016');
    q(-6, -1, 12, 3, '#7a4a26'); q(-5, -4, 10, 3, '#8f5a2e'); q(-3, -7, 6, 3, '#a26a38'); q(-1, -9, 2, 2, '#a26a38'); q(-3, -6, 2, 1, '#c98d55'); q(-4, -3, 2, 1, '#c98d55');
  }
  function drawHeap(ctx, n) { // 堆肥坑：數量越多越大
    const H0 = P.HEAP_AT; if (!ok(IMG[night() ? 'yard_night_bg' : 'yard_day_bg'])) { ctx.fillStyle = '#5b3d22'; ctx.fillRect(H0.x - 40, H0.y - 6, 80, 12) } label(ctx, '堆肥箱', H0.x, H0.y + 52, '#ffd');
    if (!n) return; const sc = 1.6 + Math.min(20, n) * 0.18;
    for (let i = 0; i < Math.min(n, 6); i++) drawPoop(ctx, H0.x + (i % 3 - 1) * 9 * sc * 0.6, H0.y - Math.floor(i / 3) * 6 * sc, sc * (i < 3 ? 1 : 0.8));
    label(ctx, `${n} 坨`, H0.x, H0.y - 14 * sc - 6, '#ffd');
  }
  function flies(ctx, x, y, k) { ctx.fillStyle = '#1A1016'; for (let i = 0; i < k; i++) { const a = T * (3 + i) + i * 2.1; ctx.fillRect(Math.round(x + Math.cos(a) * (12 + i * 4)), Math.round(y - 22 + Math.sin(a * 1.3) * 8), 3, 2) } }
  function stinkLines(ctx, x, y) { ctx.strokeStyle = 'rgba(120,170,60,.85)'; ctx.lineWidth = 2; for (let j = -1; j <= 1; j++) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const yy = y - 14 - i * 5, xx = x + j * 8 + Math.sin(T * 4 + i + j) * 3; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy) } ctx.stroke() } }
  let stinkT = 0, chatT = 6, npcLv = 0, lastN = -1, npcT = 0;
  function npcSay(sit) { const l = P.npcLine(sit); if (l) { if (P.speak) P.speak(l[0], l[1], 4.2); else UI.toast(`${l[0]}：「${l[1]}」`, 4200) } }
  function poopUpdate(dt) {
    const S = P.S, n = P.poopN(), pets = P.all().filter(p => !P.out(p));
    // 浣熊搬便便
    for (const p of pets) {
      if (p.sp !== 'raccoon') continue; const s = sOf(p);
      if (!s.job) { s.tidyT = (s.tidyT || 0) + dt; if (s.tidyT > C.raccoonTidy && S.poop.length) { s.tidyT = Math.random() * 3; let bi = 0, bd = 1e9; S.poop.forEach((q, i) => { const d = Math.hypot(q.x - s.x, q.y - s.y); if (d < bd) { bd = d; bi = i } }); s.job = { q: S.poop[bi], ph: 'go' }; s.act = 'walk'; s.tx = s.job.q.x; s.ty = s.job.q.y; s.until = T + 30 } continue }
      if (s.tx == null) {
        if (s.job.ph === 'go') { if (!S.poop.includes(s.job.q)) { s.job = null; continue } s.job.ph = 'carry'; s.act = 'walk'; s.tx = P.HEAP_AT.x - 30; s.ty = P.HEAP_AT.y - 8; say(p, P.petLine('tidy', p), 3) }
        else { const i = S.poop.indexOf(s.job.q); if (i >= 0) { S.poop.splice(i, 1); S.heap += s.job.q.big ? 2 : 1; if (s.job.q.big) S.heapBig = (S.heapBig || 0) + 2; (S.heapG = S.heapG || []).push(...Array(s.job.q.big ? 2 : 1).fill(s.job.q.tier || 0)); P.emit('poop', `${P.label(p)} 把一坨便便搬到堆肥坑（坑裡 ${S.heap}）`); if (Math.random() < 0.12 && T > npcT) { npcT = T + 40; npcSay('raccoon') } } s.job = null; s.act = 'idle'; s.until = T + 1.5 }
      } else if (s.job.ph === 'carry' && S.poop.includes(s.job.q)) { s.job.q.x = s.x + (s.flip ? -22 : 22); s.job.q.y = s.y + 2 }
      else if (s.job.ph === 'go' && !S.poop.includes(s.job.q)) { s.job = null; s.tx = null }
    }
    // 剛拉的便便：放到那隻寵物腳邊；熊拉大坨會講話
    for (const q of S.poop) { if (q.seen) continue; q.seen = 1; const who = P.byId(q.by); if (who && !P.out(who) && P.now() - (q.t || 0) < 5000) { const s = sOf(who); q.x = Math.max(P.POOP_YARD.x0, Math.min(P.POOP_YARD.x1, s.x + (s.flip ? 26 : -26))); q.y = Math.max(P.POOP_YARD.y0, Math.min(P.POOP_YARD.y1, s.y + 4)); if (q.big) say(who, P.pickLine('bear', P.LINES.bear), 3.2) } }
    // 平常偶爾閒聊
    if (n < 10 && pets.length) { chatT -= dt; if (chatT <= 0) { chatT = 14 + Math.random() * 10; const p = pets[Math.floor(Math.random() * pets.length)]; if (!bub[p.id] || bub[p.id].until < T) say(p, P.petLine('chat', p), 4) } }
    // 很臭的時候，寵物冒泡泡
    if (n >= 10 && pets.length) { stinkT -= dt; if (stinkT <= 0) { stinkT = n >= 15 ? 2.2 : 3.6; const c = pets.filter(p => !bub[p.id] || bub[p.id].until < T); if (c.length) { const p = c[Math.floor(Math.random() * c.length)]; say(p, P.petLine('stink', p), 2.8) } } }
    // 角色吐槽：跨過 10／15／20 各一次；滿 20 坨每 90 秒再講一次
    const lv = n >= 20 ? 3 : n >= 15 ? 2 : n >= 10 ? 1 : 0;
    if (lv > npcLv || (lv === 3 && T > npcT)) { npcSay(['', 'p10', 'p15', 'p20'][lv]); npcT = T + 90 } npcLv = lv;
    if (n !== lastN) { lastN = n; if (P.sceneName === 'shelter') makeBar() }
    // P3：第一次看到便便，蜜糖媽媽教怎麼掃
    if (S.unlock && !(S.hint3 || {}).egg && S.cots.some(c => c.basket)) { (S.hint3 = S.hint3 || {}).egg = 1; setTimeout(() => UI.toast('蜜糖媽媽：「育兒籃裡有蛋了！點蛋輕輕敲一下，寶寶會早點出來喔。」', 5000), 900) }
    if (n && S.unlock && !(S.hint3 || {}).poop) { (S.hint3 = S.hint3 || {}).poop = 1; setTimeout(() => npcSay('poopHint'), 600) }
  }
  function doSweep(what) {
    const S = P.S, pets = P.all().filter(p => !P.out(p)), r = P.sweepPoop(what); if (!r.n) return UI.toast('院子很乾淨，沒有東西好掃');
    UI.toast(`🧹 掃掉 ${r.n} 坨${r.bread ? `，掃出剩食麵包 ×${r.bread}` : ''}${r.star ? '，還有 1 個星光碎片！' : ''}${r.stone ? '，咦？一顆亮晶晶的幸運石！' : ''}`, 3200);
    (r.gear || []).forEach((g, i) => setTimeout(() => UI.toast(`🗡️ 便便裡面竟然有裝備：${g.name}（${C.DIFF[g.d].n}）！`, 3600), 400 + i * 600));
    const sit = what === 'all' || r.n >= 3 ? 'sweep' : 'clean';
    pets.slice().sort(() => Math.random() - 0.5).slice(0, sit === 'sweep' ? 3 : 1).forEach((p, i) => setTimeout(() => say(p, P.petLine(sit, p), 3), i * 500));
    if (sit === 'sweep' && r.n >= 10) setTimeout(() => npcSay('sweep'), 900);
    npcLv = 0; lastN = -1;
  }
  P.shelterSweep = doSweep; P.shelterSay = say; P.shelterBar = () => { if (P.sceneName === 'shelter') makeBar() }; P.shelterSt = sOf; P.npcSay = npcSay;
  P.shelterHeld = () => held;
  function label(ctx, txt, x, y, col) { if (P.art.tagBox) { P.art.tagBox(ctx, txt, x, y, { size: 15, pad: 6, h: 22, col: col || '#fff', s: 2, st: [2, 1] }); return } ctx.font = 'bold 15px sans-serif'; const w = ctx.measureText(txt).width + 10; ctx.fillStyle = 'rgba(26,16,22,.8)'; ctx.fillRect(x - w / 2, y - 16, w, 20); ctx.fillStyle = col || '#fff'; ctx.fillText(txt, x - w / 2 + 5, y) }
  function openGift() {
    if (P.S.gift0) return;
    const gs = P.giftSpecies ? P.giftSpecies() : P.SPECIES;
    UI.nav(() => UI.panel(`<h2>${UI.npc('蜜糖媽媽')} 蜜糖媽媽：「謝謝你救了孩子們」</h2><p>「這孩子就拜託你了。」選 1 種已救過的小動物（藍色寶寶、♡3，可以馬上一起出戰）。其他救下的孩子先住馬廄，在「櫃檯 → 候補名冊」可以收留到後院。</p>
      <div class="row">${gs.map(s => `<button class="pbtn" data-a="g" data-v="${s.id}">${UI.av({ sp: s.id, tier: 1 }, 40)}${s.name}</button>`).join('') || '<div class="muted">先從剛剛救下的孩子裡，挑一隻交給你。</div>'}</div>`, (a, v) => { if (a !== 'g') return; const g = P.giveGift(v); UI.close(); if (g) { UI.toast(`${P.SP[v].name}寶寶來到蜜糖之家了！`, 3000); P.shelterAct(g, 'happy', 3) } }));
  }
  P.openGift = openGift;
  // P4.4：住民滿了的時候，蜜糖媽媽說明什麼算住民、怎麼空出位置
  const roomTip = () => { const k=P.nextHousing && P.nextHousing(); return k ? `到建造擴建${P.HOUSING[k].name}（${P.expansionEffect(k)}），` : '' };
  P.fullText = () => { const S = P.S; return `住民是成年的大朋友，現在 ${S.pets.length}/${P.houseCap()}，滿了。院子裡腳邊有「🍼 寶寶」的是育兒室的孩子（${P.nurseryUsed()}/${P.nurseryCap()}），不佔住民的位子，長大了也一直住育兒室、不會搬進住民房；散步、出門的大朋友還是算住民喔。想再收留，可以${roomTip()}、把一隻大朋友免費寄放在我這裡（隨時可以接回來），或讓一隻大朋友「放他出去闖闖」空出位子。` };
  // P4.4：育兒室滿了才出生的孩子「等待入住」；蜜糖媽媽的寄放處（免費、隨時接回）
  const nurseryTip = () => (P.S.fac && P.S.fac.nursery ? '' : '在農場蓋托兒所（育兒室 +' + C.nurseryFarm + '），');
  P.waitText = () => { const S = P.S, w = P.waitingKids(); return `育兒室住滿了（${P.nurseryUsed()}/${P.nurseryCap()}），${w.map(p => UI.esc(P.label(p))).join('、')} 先在門口「等待入住」。孩子不會不見，照樣可以陪牠玩、餵牠、帶牠出門；只是還不能當爸媽。想讓牠住進去，可以${nurseryTip()}把一隻寶寶免費寄放在我這裡（隨時接回來，不用錢），或讓一隻寶寶「放他出去闖闖」。一有空位，牠就會自己搬進去。` };
  P.on(e => { if (e.type === 'wq' && P.ui && P.ui.toast) P.ui.toast(e.msg, 9000) });
  function stayScreen() {
    const draw = () => {
      const S = P.S, here = S.babies.concat(S.pets);
      const row = (p, btn) => `<div class="card row2">${UI.av(p, 44)}<div class="grow">${UI.esc(P.label(p))}${p.baby ? (p.wq ? ' <span class="tag" style="background:#ffe0a0">⏳ 等待入住</span>' : ' <span class="tag" style="background:#ffd0e0">🍼 寶寶</span>') : ' <span class="tag" style="background:#cfe8ff">大朋友</span>'} ${tierTag(p.tier)}<div class="muted">${btn.why || (p.stayAt ? '寄放中' : '')}</div></div>${btn.html}</div>`;
      UI.panel(`<h2>${UI.npc('蜜糖媽媽')} 蜜糖媽媽的寄放處</h2>
        <div class="card row2">${UI.npc('蜜糖媽媽')}<div class="grow"><b>蜜糖媽媽</b>：「家裡住不下的時候，可以把孩子先寄放在我這裡。<b>不用錢，隨時都能接回來</b>，我會好好照顧牠。寄放的孩子不佔住民和育兒室的位子，可是也不會出戰、不會當爸媽。要接回來的時候，家裡要有空位喔。」</div></div>
        <div class="muted">住民（大朋友）${S.pets.length}/${P.houseCap()}｜育兒室（寶寶）${P.nurseryUsed()}/${P.nurseryCap()}${P.waitingKids().length ? `｜⏳ 等待入住 ${P.waitingKids().length}` : ''}</div>
        <h3>寄放在這裡的孩子（${S.stay.length}）</h3>${S.stay.map(p => { const full = p.baby ? P.nurseryUsed() + P.waitingKids().length >= P.nurseryCap() : S.pets.length >= P.houseCap(); return row(p, { why: full ? (p.baby ? '育兒室沒有空位，先空出位子才能接回來' : '住民滿了，先空出位子才能接回來') : '', html: `<button class="ok" data-a="take" data-v="${p.id}" ${full ? 'disabled' : ''}>接回來</button>` }) }).join('') || '<div class="muted">現在沒有</div>'}
        <h3>家裡的孩子</h3>${here.map(p => { const why = P.canStay(p); return row(p, { why, html: `<button class="alt" data-a="put" data-v="${p.id}" ${why ? 'disabled' : ''}>寄放</button>` }) }).join('') || '<div class="muted">沒有</div>'}`, (a, v) => {
        if (a === 'put') { const p = P.byId(+v), r = P.deposit(p); if (r.ok) { UI.toast(`蜜糖媽媽：「${UI.esc(P.label(p))} 交給我吧，想牠的時候隨時來接。」`, 3500); P.save() } else UI.toast(r.msg) }
        if (a === 'take') { const r = P.retrieve(+v); if (r.ok) { UI.toast(`${UI.esc(P.label(r.p))} 回家了！`, 2500); P.save(); if (P.shelterAct) P.shelterAct(r.p, 'happy', 3) } else fullToast(r) }
        draw();
      });
    };
    draw();
  }
  P.openStay = () => UI.nav(stayScreen);
  const fullToast = r => UI.toast(/^住民滿了/.test(r.msg) ? `蜜糖媽媽：「${P.fullText()}」` : r.msg, /^住民滿了/.test(r.msg) ? 7000 : 2200);
  SH.shelter = {
    enter() {
      const S = P.S;
      makeBar();
      document.querySelector('#pad').classList.add('hide');
      const g = P.collectGifts(); g.slice(0, 3).forEach(m => UI.toast('🎁 ' + m, 3500));
      if (!S.unlock) UI.toast('蜜糖之家的小動物被城堡的軍隊抓走了！接下救援任務「蜜糖之家保衛戰」', 4000);
      if (S.unlock && !S.gift0) setTimeout(openGift, 300);
      npcLv = 0; lastN = -1; syncYard(); camX = camTo = Math.min(camX, WW() - 1280); held = null;
    },
    update(dt) {
      T += dt; syncYard(); poopUpdate(dt);
      camX += (camTo - camX) * Math.min(1, dt * 8); if (Math.abs(camTo - camX) < 1) camX = camTo;
      for (const p of P.all()) {
        if (P.out(p)) continue; const s = sOf(p); s.t += dt; if (held && held.p === p) continue; think(p, s);
        if (s.tx != null) { const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy); if (d < 4) { s.tx = null; if (!s.job) { s.act = 'idle'; s.until = T + 2 } } else { const v = (s.job ? 90 : 60) * P.size(p).spd * dt; s.x += dx / d * v; s.y += dy / d * v; s.flip = dx < 0 } }
      }
      playTick(dt);
      P.ui3 && P.ui3.shelterTick && P.ui3.shelterTick(dt);
    },
    // P3：拖曳寵物（滑鼠或手指）。按住寵物＝抓起來；沒抓到寵物、二館蓋好時＝左右拖畫面
    down(x, y) {
      const wx = x + camX; let best = null, bd = 1e9;
      if (P._place && P._place()) { held = { place: 1 }; P.placeMove(wx, y - 40); return true }
      for (const p of P.all()) { if (P.out(p)) continue; const s = sOf(p); const d = Math.hypot(wx - s.x, (y - (s.y - 40)) * 1.2); if (d < 70 && d < bd) { bd = d; best = p } }
      held = best ? { p: best, sx: x, sy: y } : { pan: 1, sx: x, cam0: camX };
      return true;
    },
    move(x, y, moved) {
      if (!held || !moved) return;
      if (held.place) { P.placeMove(x + camX, y - 40); return }
      if (held.pan) { if (WIDE()) { camTo = camX = Math.max(0, Math.min(WW() - 1280, held.cam0 - (x - held.sx))) } return }
      const s = sOf(held.p); held.on = 1; s.tx = null; s.job = null; s.x = Math.max(YARD.x0 - 60, Math.min(YARD.x1 + 40, x + camX)); if (held.lx == null) held.lx = s.x; if (Math.abs(s.x - held.lx) > 6) { s.flip = s.x < held.lx; held.lx = s.x }   /* P4.4：往左拖就面向左 */ s.gy = Math.max(YARD.y0, Math.min(YARD.y1, y + 70)); s.y = s.gy; s.act = 'walk';
    },
    up(x, y, moved) {
      const h = held; held = null; if (!h) return;
      if (h.place) return;
      if (!moved) return SH.shelter.tap(x, y);
      if (h.p && h.on) { const p = h.p, s = sOf(p); s.act = 'happy'; s.until = T + 1.6; s.drop = T; say(p, P.petLine('drag', p), 2.6) }
    },
    draw(ctx) {
      ctx.clearRect(0, 0, 1280, 720); ctx.save(); ctx.translate(-Math.round(camX), 0); bg(ctx);
      const S = P.S, n = P.poopN();
      drawHeap(ctx, S.heap); if (ok(IMG[night() ? 'yard_night_bg' : 'yard_day_bg'])) drawHuts(ctx);
      S.poop.forEach(q => { drawPoop(ctx, q.x, q.y, q.big ? 3.2 : 2); if (n >= 15) { flies(ctx, q.x, q.y, 2); if (Math.floor(T * 0.7 + q.x) % 3 === 0) stinkLines(ctx, q.x, q.y) } });
      if (n >= 15 && S.heap) { flies(ctx, P.HEAP_AT.x, P.HEAP_AT.y - 20, 5); stinkLines(ctx, P.HEAP_AT.x, P.HEAP_AT.y - 30) }
      const NF = night() && 'filter' in ctx ? 'brightness(.72) saturate(.8)' : '';   // 晚上寵物跟著背景變暗
      const list = P.all().filter(p => !P.out(p)).map(p => [p, sOf(p)]).sort((a, b) => a[1].y - b[1].y);
      const props = P.p51Props ? P.p51Props(ctx, T) : []; let pi_ = 0;   // P5.1：雜物倉、院子家具、西施媽媽，跟寵物一起照 y 排前後
      for (const [p, s] of list) {
        while (pi_ < props.length && props[pi_].y <= s.y) props[pi_++].draw();
        const sc = p.baby ? 1.4 : 2, up = held && held.p === p && held.on;
        if (up) { // 抓起來：地上有影子，身體晃來晃去
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 4, 26, 8, 0, 0, 7); ctx.fill();
          ctx.save(); ctx.translate(s.x, s.y - 110); ctx.rotate(Math.sin(T * 7) * 0.18); P.art.draw(ctx, p, 0, 70, { act: 'walk', t: s.t * 2, flip: s.flip, scale: sc, appear: 9 }); ctx.restore();
          if (P.speak) P.speak(p, '哇！', 0.4); else bubble(ctx, '哇！', s.x, s.y - 150); continue;
        }
        const hop = s.drop && T - s.drop < 0.35 ? -Math.sin((T - s.drop) / 0.35 * Math.PI) * 18 : 0;
        if (NF) ctx.filter = NF; P.art.draw(ctx, p, s.x, s.y + hop, { act: s.act, t: s.t, flip: s.flip, scale: sc, appear: T - s.born }); if (NF) ctx.filter = 'none';
        if (p.wear && P.ui3) P.ui3.drawWear(ctx, p.wear, s.x, s.y + hop - (p.baby ? 58 : 84), sc);
        if (P.art.setFor(p.sp).tint || p === sel) label(ctx, `${p.star === 2 ? '✦' : ''}${p.name || P.SP[p.sp].name}${p.baby ? '寶寶' : ''} ${P.TIER_NAME[p.tier]}`, s.x, s.y + 18, P.TIER_COLOR[p.tier]);
        if (p.baby && !P.unlocked(p)) label(ctx, '🧺 剛出生', s.x, s.y - 70);
        if (p.baby) label(ctx, p.wq ? '⏳ 等待入住' : '🍼 寶寶', s.x, s.y + ((P.art.setFor(p.sp).tint || p === sel) ? 40 : 18), '#ffd0e0');   // P4.4：寶寶算育兒室、不算住民，一眼分得出來
      }
      while (pi_ < props.length) props[pi_++].draw();
      if (P.placeDraw) P.placeDraw(ctx);
      playFx(ctx);
      for (const [t_, x_, y_] of basketTags) label(ctx, t_, x_, y_, '#ffd');
      bubR = []; for (const [p, s] of list) { const b = bub[p.id]; if (b && b.until > T) bubble(ctx, b.txt, s.x, s.y - (p.baby ? 80 : 110)) }
      // 圍欄外徘徊
      P.S.wander.forEach((a, i) => { const { x, y } = wPos(i); P.art.draw(ctx, a, x, y, { act: 'idle', t: T + i, flip: true, scale: 1.4, appear: T - (sOf(a).born) }); label(ctx, '徘徊中', x, y + 16, '#ffd') });
      ctx.restore();
      if (n) label(ctx, `💩 便便 ${n}/${C.poopCap}`, 1180, 64);
      const out = P.all().filter(p => p.walk).length, away = P.all().filter(p => p.away).length; if (out) label(ctx, `🚶 散步中 ${out} 隻`, 1180, 92); if (away) label(ctx, `🎒 出門（集訓／探險）${away} 隻`, 1140, 120);
      if (WIDE()) label(ctx, camX < 640 ? (ANX() ? '➡ 往右是二館' : '➡ 往右是二館工地') : '⬅ 往左是一館', camX < 640 ? 1190 : 90, 690, '#ffd');
      if (!P.art.ready) label(ctx, '讀取圖片中…', 640, 360);
    },
    tap(x, y) {
      const S = P.S; const sx = x; x += camX;
      if (P._place && P._place()) { P.placeMove(x, y - 40); return }
      if (P.p51Tap && P.p51Tap(x, y)) return;
      if (S.heap && Math.hypot(x - P.HEAP_AT.x, y - (P.HEAP_AT.y - 14)) < 50) return doSweep('heap');
      let best = null, bd = 1e9;
      for (const p of P.all()) { if (P.out(p)) continue; const s = sOf(p); const d = Math.hypot(x - s.x, (y - (s.y - 40)) * 1.2); if (d < 70 && d < bd) { bd = d; best = p } }
      P.S.wander.forEach((a, i) => { const w = wPos(i); if (Math.hypot(x - w.x, y - w.y + 30) < 60) best = a });
      if (!best) { const i = S.poop.findIndex(q => Math.hypot(x - q.x, y - (q.y - 8)) < 26); if (i >= 0) return doSweep(i) }
      if (best) { if (P.S.wander.includes(best)) openWander(best); else openPet(best) }
      else if (P.yardTap && P.yardTap(x, y)) { }
      else if (x > 40 && x < 370 && y > 50 && y < 360) UI.nav(counterScreen);
      else { const ei = S.cots.findIndex((c, i) => !c.farm && c.basket && Math.abs(x - cotPos(i).cx) < 42 && y > cotPos(i).by + 10 && y < cotPos(i).by + 80); if (ei >= 0) return knock(ei);   // 點蛋＝輕輕敲
        const bi = S.cots.findIndex((c, i) => !c.farm && c.basket && Math.abs(x - cotPos(i).cx) < 60 && y >= cotPos(i).by + 80 && y < cotPos(i).by + 108); if (bi >= 0) return P.ui3.basket(bi);   // 點下面的「育兒籃」牌子＝打開育兒籃
        const ci = S.cots.findIndex((c, i) => !c.farm && Math.abs(x - cotPos(i).cx) < HUT_W / 2 && y > cotPos(i).by - HUT_H + 10 && y < cotPos(i).by + 10); if (ci >= 0) UI.nav(cotScreen) }
    },
    hud() { const S = P.S; if (!S.unlock) return ''; const hc = P.houseCap(), nc = P.nurseryCap(); return `<span style="border-color:${S.pets.length >= hc ? '#ff6b6b' : '#1A1016'}">🏠 住民 ${S.pets.length}/${hc}（大朋友${S.pets.length >= hc ? '，滿了' : ''}）</span><span style="border-color:${P.waitingKids().length ? '#ffb347' : '#1A1016'}">🍼 育兒室 ${P.nurseryUsed()}/${nc}${P.waitingKids().length ? `（⏳ 等待入住 ${P.waitingKids().length}）` : ''}</span>` + (P.mailCount() ? `<span style="border-color:#ffd36b">📮 明信片 ${P.mailCount()}</span>` : '') },
  };
  const tg = f => () => { if (UI.isOpen() && UI._cur && UI._cur.root === f) UI.close(); else { UI.close(); UI.nav(f) } };   // 再按一次同一顆＝關掉
  function makeBar() {
      const S = P.S;
      const bar = [['🏠 櫃檯', tg(counterScreen)], ['📜 委託', tg(questScreen)], ['🍖 全部餵食', () => { const n = P.feedAll(); UI.toast(`餵了 ${n} 隻乾乾`); P.all().forEach(p => P.shelterAct(p, 'eat', 2)) }], ['🛖 小屋', tg(cotScreen)], ['🏗️ 建造', () => P.openBuild && P.openBuild()], ['📋 名冊', tg(listScreen)], ['⚔️ 出戰', tg(fightScreen), 'ok']];
      if (!S.unlock) bar.unshift(['🔓 救援任務：蜜糖之家保衛戰', () => P.startQuest('r1'), 'bad']);
      // P3：只要有便便就有打掃按鈕
      const n = P.poopN(); if (S.unlock && n >= 1) bar.splice(3, 0, [`🧹 打掃（${n} 坨）`, () => doSweep('all'), 'alt']);
      if (S.unlock && P.ui3) P.ui3.bar(bar);
      UI.bar(bar);
  }

  // ---------- 照顧面板 ----------
  const bar = (v, col) => `<div class="barv"><i style="width:${v}%;background:${col}"></i></div>`;
  const tierTag = t => `<span class="tag" style="background:${P.TIER_COLOR[t]}">${P.TIER_NAME[t]}</span>`;
  const inhLv = p => ['', '未覺醒', '覺醒', 'S', 'SS'][p.tier] || (p.baby ? '' : '（綠色還沒覺醒）');   // P5.1 #10b：大朋友也出戰，固有技能照位階算
  function skillLine(n, i, p) { const s = P.SK[n]; if (!s) return ''; return `<div class="sk">#${s.n} <b>${P.skLink ? P.skLink('sk', n, p, s.name) : s.name}</b> ${P.skTag ? P.skTag(n) : ''} <span class="muted">${P.CAT_NAME[s.cat] || ''}｜冷卻 ${s.cd || '—'}｜${P.skillDesc(s, p)}${s.impl ? '' : '（測試場還沒做效果）'}</span>${p && i != null && !(P.skLocked && P.skLocked(n)) ? ` <button data-a="rr" data-v="${i}" class="alt">洗（金幣）</button> <button data-a="rrb" data-v="${i}" class="alt">洗（麵包）</button>` : ''}</div>` }
  P.skillLine = skillLine;
  function openPet(p) { UI.nav(() => openPetRaw(p)) }
  function openPetRaw(p) {
    sel = p;
    const draw = () => {
      if (!P.byId(p.id)) { UI.close(); return }
      const h = P.heart(p.aff), c = P.counts(p), D = C.daily, sp = P.SP[p.sp];
      const left = k => C.capOff ? '∞' : Math.max(0, D[k] - (c[k] || 0));
      const lock = !P.unlocked(p);
      const shy = p.star === 2, hint = !shy && p.star === 1 && h >= C.starShowHeart;
      let html = `<h2>${UI.av(p, 44)} ${UI.esc(p.name || sp.name)}${p.baby ? '寶寶' : ''} ${tierTag(p.tier)}${shy ? ' <span class="tag" style="background:#ffe36b">✦星彩</span>' : ''}</h2>
      ${shy ? `<div class="card">✦ <b>${P.shinyName(p)}</b>：很少見的毛色。${p.baby ? `出戰時普攻與技能威力 +${Math.round((C.shinyMul - 1) * 100)}%、天性魔法 +${Math.round((C.shinyMul - 1) * 100)}%、寵物能力成長 +${Math.round((C.shinyMul - 1) * 100)}%。` : '大朋友出戰時普攻與傳家技威力也 +' + Math.round((C.shinyMul - 1) * 100) + '%，還會把星痕傳給孩子。'}</div>` : ''}
      ${hint ? '<div class="card">西施：「汪……（牠的毛尖，有時候會閃一下耶。）」</div>' : ''}
      <div class="muted">${sp.name}｜${sp.looks[Math.min(3, p.look)]}｜第 ${(p.g || 0) + 1} 代｜性格 ${P.PERS[p.pers]}｜最愛英雄 ${p.fav.hero === P.S.hero || p.knownHero ? P.HEROES[p.fav.hero] : '？'}｜最愛部位 ${p.knownSpot ? p.fav.spot : '？'}</div>
      <div>好感 ${'♥'.repeat(h)}${'♡'.repeat(5 - h)} ${P.HEART_NAME[h - 1]}（${p.aff}）</div>${bar(Math.min(100, (p.aff - P.HEART[h - 1]) / ((P.HEART[h] || 1000) - P.HEART[h - 1]) * 100), '#ff7fa0')}
      <div>飽足 ${p.need.f.toFixed(0)}</div>${bar(p.need.f, '#f3b44a')}<div>心情 ${p.need.m.toFixed(0)}</div>${bar(p.need.m, '#7fd0ff')}<div>乾淨 ${p.need.c.toFixed(0)}</div>${bar(p.need.c, '#a8e6a1')}
      <div class="muted">一起出戰 ${p.battles || 0} 場｜Lv${p.lv || 1}/${P.lvCapOf ? P.lvCapOf(p) : C.lvCap[p.tier]}${p.baby ? `｜資質 ${P.QUAL[p.q]}｜出生第 ${P.ageDays(p)} 天` : ''}${p.walk ? '｜🚶 散步中，' + UI.fmtTime(p.walk.until) + ' 回來' : ''}${p.away ? `｜🎒 ${p.away.kind === 'camp' ? '集訓中' : '探險中'}，${UI.fmtTime(p.away.until)} 回來` : ''}</div>
      ${P.ui3 ? P.ui3.sizeLine(p) : ''}
      ${p.wq ? `<div class="card row2">${UI.npc('蜜糖媽媽')}<div class="grow"><b>⏳ 等待入住</b>　蜜糖媽媽：「${P.waitText()}」</div></div>` : ''}
      ${lock ? '<div class="card">🧺 剛出生：今天可以看、摸、取名、洗技能／洗天性魔法。明天 05:00 解鎖培養、出戰。</div>' : ''}
      ${p.baby ? `<div class="row"><button class="ok big" data-a="rrgo">🎲 洗技能／洗天性魔法</button></div>` : ''}
      <h3>摸摸（剩 ${left('pet')} 次全額）</h3><div class="row">${P.SPOTS.map(s => `<button data-a="pet" data-v="${s}">${s}</button>`).join('')}</div>
      <h3>餵食與照顧</h3><div class="row">
        <button data-a="kibble" ${lock ? 'disabled' : ''}>乾乾（${left('kibble')}）</button>
        <button data-a="bread" ${lock ? 'disabled' : ''}>剩食麵包×${C.breadPerFeed}（${left('bread')}）</button>
        <button data-a="snack" ${lock ? 'disabled' : ''}>特製零食（${left('snack')}）</button>
        <button data-a="groom" ${lock ? 'disabled' : ''}>梳毛洗澡（${left('groom')}）</button>
        <button data-a="game" ${lock ? 'disabled' : ''}>小遊戲（${left('game')}）</button></div>
      <div class="row"><button class="alt" data-a="walk" data-v="0.5" ${lock || p.walk ? 'disabled' : ''}>散步 30 分</button><button class="alt" data-a="walk" data-v="2" ${lock || p.walk ? 'disabled' : ''}>2 小時</button><button class="alt" data-a="walk" data-v="6" ${lock || p.walk ? 'disabled' : ''}>6 小時</button><button class="alt" data-a="name">取名</button></div>`;
      const L_ = (k, r, t) => P.skLink ? P.skLink(k, r, p, t) : t;   // P5.1 #14：技能名字都可以點
      html += `<h3>固有技能</h3><div class="sk"><b>${L_('inh', p.sp, sp.inh[0])}</b> ${inhLv(p)} <span class="muted">${P.inhDesc(sp.inh[1], p)}</span></div>`;
      html += P.SP[p.sp].breedable === false ? `<div class="sk muted">戰技：${P.SK[p.heir] ? L_('heir',p.heir,P.SK[p.heir].name) : '—'}（這一招會陪牠繼續守著家門）</div>` : `<div class="sk muted">傳家技：${P.SK[p.heir] ? L_('heir', p.heir, P.SK[p.heir].name) : '—'}（育兒籃沒有另外選的時候，就教這一招；教傳家技成功率多 ${P.CFG.gen ? P.CFG.gen.teach.heir : 10}%${p.baby ? '' : (p.tier >= 1 ? '｜大朋友出戰就用這一招' : '｜升到藍色，出戰就會用這一招')}）</div>`;
      if (p.baby) {
        html += `<h3>技能（${p.sk.length}/${C.slots[p.tier]} 格；金幣 ${C.rerollGold[p.tier].toLocaleString()}＋磁片 ${C.rerollDiskGold}，或麵包 ${C.rerollBread[p.tier]}（不用磁片）；保底 ${p.pity || 0}/${C.rerollPity}）</h3>` + p.sk.map((n, i) => skillLine(n, i, p)).join('');
        html += `<h3>✨ 天性魔法（出戰時幫主人變強）</h3>` + (p.sub || []).map((s, i) => `<div class="sk">${P.skLink ? P.skLink('sub', s[0], p, P.subText(s[0], s[1])) : P.subText(s[0], s[1])}${shy ? ` <span style="color:#ffe36b">→ ${Math.round(s[1] * C.shinyMul * 10) / 10}%（星彩）</span>` : ''} <button class="alt" data-a="rrgo">去洗</button></div>`).join('');
      }
      if (P.SP[p.sp].breedable === false) html += `<div class="card"><b>蜜糖媽媽輕聲說</b>：「${P.ZOMBIE_STORY.detail}」</div>`;
      if (!p.baby) html += `<h3>⚔️ 出戰（大朋友）</h3><div class="muted">比同位階寶寶更壯：普攻與招數 ${Math.round(C.adult.atkMul * 100)}%${p.tier ? '' : '（綠色素體也用這個倍率）'}｜${P.fightSk(p).length ? `會用：${P.fightSk(p).map(n => L_('sk', n, P.SK[n].name)).join('、')}` : '只會普攻（升到藍色就會用傳家技）'}｜經驗跟寶寶一樣快｜沒有技能格和天性魔法</div>`;
      { const u = P.upInfo(p);
        if (u) html += `<h3>升階 → ${P.TIER_NAME[p.tier + 1]}${u.adult ? '（大朋友：外觀不變）' : ''}</h3><div class="muted">Lv${u.lv}、♡${u.heart}${u.letter ? `、${P.TIER_NAME[p.tier]}幸福信 ×${u.letter}（有 ${P.S.letters[['', 'b', 'p', 'k'][p.tier]]}）` : ''}、金幣 ${u.gold.toLocaleString()}、麵包 ${u.bread}${u.shard ? '、刻印碎片 ' + u.shard : ''}${u.collar ? '、金色項圈 1' : ''}｜成功率 ${u.rate}%</div><div class="row"><button data-a="up" ${lock ? 'disabled' : ''}>升階</button></div>`;
        html += `<div class="row"><button class="ok" data-a="eq" ${lock || p.away ? 'disabled' : ''}>${P.S.eq === p.id ? '✔ 出戰中' : '帶牠出戰'}</button></div>`; }
      if (P.ui3) html += P.ui3.petExtra(p);
      html += `<h3>其他</h3><div class="row"><button class="bad" data-a="send" ${p.away || p.sp === 'zombiedog' ? 'disabled' : ''}>${p.sp === 'zombiedog' ? '特殊夥伴請到櫃檯寄放' : '放他出去闖闖'}</button>${P.S.sent && P.now() - P.S.sent.t < 10e3 ? '<button data-a="back">叫牠回來</button>' : ''}</div>`;
      UI.panel(html, act);
    };
    const act = (a, v) => {
      let r; const k0 = UI._cur && UI._cur.k;   // P4.4：按鈕打開別的畫面時，不要再重畫寵物面板蓋掉它
      if (['pet', 'kibble', 'bread', 'snack', 'groom', 'game'].includes(a)) { r = P.interact(p, a, v); if (r.ok) P.shelterAct(p, a === 'kibble' || a === 'bread' || a === 'snack' ? 'eat' : 'happy', 2.2); UI.toast(r.ok ? `${r.msg}${r.g ? `　好感 +${r.g}` : ''}` : r.msg) }
      else if (a === 'walk') { r = P.walk(p, +v); if (!r.ok) UI.toast(r.msg) }
      else if (a === 'name') { const n = prompt('幫牠取名字', p.name || ''); if (n != null) p.name = n.slice(0, 10) }
      else if (a === 'rr' || a === 'rrb') { r = P.reroll(p, +v, a === 'rrb' ? 'bread' : 'gold'); if (!r.ok) UI.toast(r.msg); else if (r.choose) chooseSkill(p, r); else UI.toast('洗到：' + P.SK[r.n].name) }
      else if (a === 'rrgo') return rerollOf(p);
      else if (a === 'up') { r = P.upgrade(p); UI.toast(r.ok ? (r.up ? '升階成功！' : '升階失敗…') : r.msg); if (r.up) P.shelterAct(p, 'happy', 3) }
      else if (a === 'eq') { P.S.eq = p.id; UI.toast(P.label(p) + ' 會跟你出戰') }
      else if (a === 'send') return P.ui3.sendAsk(p, () => { const r=P.sendOff(p); if(!r.ok){UI.toast(r.msg);return} UI.toast('牠背著小包袱出門了', 3000); setTimeout(() => { if (P.S.sent && P.byId(p.id) == null) openSent() }, 50) });
      else if (P.ui3 && P.ui3.petAct(p, a, v)) { }
      else if (a === 'back') { r = P.callBack(); UI.toast(r.ok ? '牠跑回來了' : r.msg) }
      if (UI.isOpen() && P.byId(p.id) && UI._cur && UI._cur.k === k0) draw();
    };
    UI._refresh = draw; draw();
  }
  P.openPet = openPet;
  function openSent() { UI.close(); UI.nav(() => UI.panel(`<h2>出門闖闖了</h2><div class="card row2">${UI.npc('西施')}<div class="grow">西施：「牠回頭揮了揮手……之後會寄明信片回來喔。」</div></div><p>10 秒內可以反悔。</p><div class="row"><button data-a="back">叫牠回來</button></div>`, a => { if (a === 'back') { const r = P.callBack(); UI.toast(r.ok ? '牠跑回來了' : r.msg); UI.close() } })); UI._refresh = null }
  function chooseSkill(p, r) {
    UI.nav(() => UI.panel(`<h2>洗技能保底：3 選 1</h2>` + r.choose.map(n => `<div class="card">${skillLine(n)}<button class="ok" data-a="pick" data-v="${n}">選這個</button></div>`).join(''), (a, v) => { if (a === 'pick') { P.chooseSkill(p, r.slot, +v); UI.back() } }));
    UI._refresh = null;
  }
  // ---------- 洗技能／洗屬性（P2b：櫃檯入口、名冊與照顧面板都有大按鈕） ----------
  function rerollOf(p) { UI.nav(() => rerollRaw(p)) }
  P.openReroll = p => p ? rerollOf(p) : UI.nav(rerollPick);
  function rerollRaw(p) {
    const hl = P.npcLine('reroll');
    const draw = () => {
      if (!P.byId(p.id)) { UI.close(); return }
      const S = P.S, shy = p.star === 2, t = p.tier;
      const pity = (n, m) => `<span class="pity">${'●'.repeat(Math.min(n, m))}${'○'.repeat(Math.max(0, m - n))}</span>`;
      let html = `<h2>${UI.av(p, 44)} 🎲 洗技能／洗天性魔法：${UI.esc(P.label(p))} ${tierTag(t)}${shy ? ' ✦星彩' : ''}</h2>
      ${hl ? `<div class="card row2">${UI.npc(hl[0])}<div class="grow"><b>${hl[0]}</b>：「${hl[1]}」</div></div>` : ''}
      <div class="card">💰 金幣 ${S.gold.toLocaleString()}　🍞 剩食麵包 ${S.bread}${P.seen('disk') ? `　💿 技能磁片 ${S.disk}` : ''}${P.seen('dew') ? `　💧 洗練露水 ${S.mat.dew}` : ''}${P.seen('wish') ? `　🌠 心願星砂 ${S.mat.wish}` : ''}</div>
      <h3>技能（${p.sk.length}/${C.slots[t]} 格）</h3>
      <div class="muted">每洗一次：金幣 ${C.rerollGold[t].toLocaleString()}＋磁片 ${C.rerollDiskGold}，或剩食麵包 ${C.rerollBread[t]}（不用磁片）。保底 ${pity(p.pity || 0, C.rerollPity)}：第 ${C.rerollPity} 次自己 3 選 1。</div>` +
        (p.sk.map((n, i) => { const s2 = P.SK[n]; const lk = P.skLocked && P.skLocked(n); return `<div class="card rr"><div class="grow">第 ${i + 1} 格：#${s2.n} <b>${s2.name}</b> ${P.skTag ? P.skTag(n) : ''}<div class="muted">${P.CAT_NAME[s2.cat] || ''}｜冷卻 ${s2.cd || '—'}｜${P.skillDesc(s2, p)}</div></div><div class="row">${lk ? `<span class="muted">🔒 ${P.SKT[P.skTier(n)].name}洗不掉</span>` : `<button class="ok" data-a="rrb" data-v="${i}">🍞 洗（麵包 ${C.rerollBread[t]}）</button><button class="alt" data-a="rr" data-v="${i}">💰 洗（金幣 ${C.rerollGold[t].toLocaleString()}＋💿1）</button>`}</div></div>` }).join('') || '<div class="muted">這個位階還沒有技能格</div>') +
        `<h3>✨ 天性魔法（出戰時幫主人變強）</h3><div class="muted">每洗一次：金幣 ${C.subGold[t].toLocaleString()} 或剩食麵包 ${C.subBread[t]}${P.seen('dew') ? ' 或 💧洗練露水 1' : ''}。保底 ${pity(p.subPity || 0, C.subPity)}：第 ${C.subPity} 次自己挑——3 個選 1 個，每個都在比較好的那一半。</div>
        <div class="muted">${P.TIER_NAME[Math.max(1, t)]}色的範圍：${(p.sub || []).map(s2 => { const d = P.SUBS.find(x => x.k === s2[0]); const [lo, hi] = d.r[Math.max(1, t) - 1]; return `${d.name} ${lo}～${hi}%` }).join('、')}</div>` +
        ((p.sub || []).map((s2, i) => `<div class="card rr"><div class="grow"><b>${P.subText(s2[0], s2[1])}</b>${shy ? `（星彩 → ${Math.round(s2[1] * C.shinyMul * 10) / 10}%）` : ''}</div><div class="row"><button class="ok" data-a="rsb" data-v="${i}">🍞 洗（麵包 ${C.subBread[t]}）</button><button class="alt" data-a="rs" data-v="${i}">💰 洗（金幣 ${C.subGold[t].toLocaleString()}）</button>${S.mat.dew ? `<button class="alt" data-a="rsd" data-v="${i}">💧 洗（露水）</button>` : ''}</div></div>`).join('') || '<div class="muted">這個位階還沒有天性魔法</div>') +
        (S.mat.wish && (p.sub || []).length ? `<div class="row"><button class="alt" data-a="wish">🌠 用心願星砂：保底 +3（有 ${S.mat.wish}）</button></div>` : '') +
        `<div class="row"><button class="alt" data-a="pet">看牠的照顧面板</button></div>`;
      UI.panel(html, (a, v) => {
        let r;
        if (a === 'rr' || a === 'rrb') { r = P.reroll(p, +v, a === 'rrb' ? 'bread' : 'gold'); if (!r.ok) UI.toast(r.msg); else if (r.choose) return chooseSkill(p, r); else { UI.toast('洗到：' + P.SK[r.n].name); P.shelterAct(p, 'happy', 1.5) } }
        if (a === 'rs' || a === 'rsb' || a === 'rsd') { r = P.rerollSub(p, +v, a === 'rsb' ? 'bread' : a === 'rsd' ? 'dew' : 'gold'); if (!r.ok) UI.toast(r.msg); else if (r.choose) return chooseSub(p, r); else UI.toast('洗到：' + P.subText(p.sub[+v][0], p.sub[+v][1])) }
        if (a === 'wish') { r = P.useWish(p); UI.toast(r.ok ? `保底進度 ${p.subPity}/${C.subPity}` : r.msg) }
        if (a === 'pet') return openPet(p);
        P.save(); draw();
      });
    };
    UI._refresh = draw; draw();
  }
  function chooseSub(p, r) {
    UI.nav(() => UI.panel(`<h2>✨ 天性魔法保底：自己挑 1 個</h2><div class="card row2">${UI.npc('西施')}<div class="grow">西施：「洗了 ${C.subPity} 次，這次讓你自己挑！3 個都是比較好的數字喔。」</div></div>` + r.choose.map((c, j) => { const d = P.SUBS.find(x => x.k === c[0]), [lo, hi] = d.r[Math.max(1, p.tier) - 1]; return `<div class="card rr"><div class="grow"><b>${P.subText(c[0], c[1])}</b><div class="muted">${P.TIER_NAME[Math.max(1, p.tier)]}色範圍 ${lo}～${hi}%｜${d.who === 'pet' ? '給寵物自己' : '給主人'}</div></div><button class="ok" data-a="pick" data-v="${j}">選這個</button></div>` }).join(''), (a, v) => { if (a === 'pick') { P.chooseSub(p, r.i, r.choose[+v]); UI.toast('選好了：' + P.subText(...r.choose[+v])); UI.back() } }));
    UI._refresh = null;
  }
  P.chooseSubUI = chooseSub;
  function rerollPick() {
    const S = P.S, babies = P.all().filter(p => p.baby);
    UI.panel(`<h2>${UI.npc('西施')} 🎲 洗技能／洗天性魔法</h2><div class="muted">選一隻寶寶，直接到牠的洗技能、洗天性魔法。剛出生的寶寶也可以洗。用麵包洗不用磁片。</div>` +
      (babies.map(p => `<div class="card row2" data-a="go" data-v="${p.id}">${UI.av(p, 44)}<div class="grow">${UI.esc(P.label(p))} ${tierTag(p.tier)}${p.star === 2 ? ' ✦星彩' : ''}<div class="muted">技能 ${p.sk.map(n => P.SK[n].name).join('、') || '—'}｜保底 ${p.pity || 0}/${C.rerollPity}</div></div><button class="ok" data-a="go" data-v="${p.id}">🎲 去洗</button></div>`).join('') || '<div class="card">還沒有寶寶。寶寶從蜜糖媽媽、育兒籃來；成年動物沒有技能格。</div>'),
      (a, v) => { if (a === 'go') rerollOf(P.byId(+v)) });
  }
  rerollPick.root = rerollPick;

  function openWander(a) {
    UI.nav(() => UI.panel(`<h2>${UI.av(a, 44)} 圍欄外的 ${P.SP[a.sp].name} ${tierTag(a.tier)}</h2><div class="muted">${P.SP[a.sp].looks[a.look]}｜性格 ${P.PERS[a.pers]}｜傳家技 ${P.SK[a.heir].name}${a.star === 2 ? '｜✦星彩' : ''}</div>
      <div class="row"><button class="ok" data-a="in">收留</button><button data-a="wait">先住候補名冊</button><button class="bad" data-a="go">放他出去闖闖</button></div>`, x => {
      const S = P.S;
      if (x === 'in') { const r = P.takeIn(a, 'wander'); if (r.ok) { UI.toast('收留了！'); UI.close() } else fullToast(r) }
      if (x === 'wait') { if (S.wait.length >= 10) return UI.toast('候補名冊滿了'); S.wander = S.wander.filter(q => q !== a); S.wait.push(a); UI.close() }
      if (x === 'go') { P.releaseWander(a); UI.toast('牠往遠方走去了，之後會寄明信片回來', 3000); UI.close() }
    }));
  }
  const animalCard = (a, act, i, btn) => `<div class="card row2">${UI.av(a, 44)}<div class="grow"><b>${P.SP[a.sp].name}</b> ${tierTag(a.tier)}${a.star === 2 ? ' ✦星彩' : ''}<div class="muted">${P.SP[a.sp].looks[Math.min(3, a.look)]}｜${P.PERS[a.pers]}</div></div><button data-a="${act}" data-v="${i}" class="ok">${btn}</button></div>`;
  // ---------- 櫃檯 ----------
  function counterScreen() {
    const hl = P.npcLine('hint');
    const draw = () => {
      const S = P.S, n = Math.min(3, S.adopted || 0); P.settleWait();
      const qOpen = P.QUESTS.filter(q => P.questInfo(q).state === 'open');
      UI.panel(`<h2>${UI.npc('蜜糖媽媽')} 蜜糖媽媽的櫃檯</h2>
      <div class="muted">住民（大朋友）${S.pets.length}/${P.houseCap()}｜育兒室（寶寶）${P.nurseryUsed()}/${P.nurseryCap()}${P.waitingKids().length ? `｜⏳ 等待入住 ${P.waitingKids().length}` : ''}｜名聲 ${S.rep}（Lv${P.repLv()}）</div>
      ${P.houseFull() ? `<div class="card row2">${UI.npc('蜜糖媽媽')}<div class="grow"><b>蜜糖媽媽</b>：「${P.fullText()}」</div></div>` : ''}
      ${P.waitingKids().length ? `<div class="card row2">${UI.npc('蜜糖媽媽')}<div class="grow"><b>蜜糖媽媽</b>：「${P.waitText()}」</div></div>` : ''}
      ${hl ? `<div class="card row2">${UI.npc(hl[0])}<div class="grow"><b>${hl[0]}</b>：「${hl[1]}」</div></div>` : ''}
      ${P.zombieCard ? P.zombieCard() : ''}${P.crystalCard ? P.crystalCard() : ''}${P.farmHutHintCard ? P.farmHutHintCard() : ''}<h3>選單</h3>
      <div class="card row2" data-a="quests">${P.ficon ? P.ficon('rescue') : UI.npc('蜜糖媽媽')}<div class="grow"><b>救援委託</b><div class="muted">${qOpen.length ? `有 ${qOpen.length} 件委託等你` : '現在沒有新的委託'}</div></div><button class="alt" data-a="quests">打開</button></div>
      <div class="card row2" data-a="stay">${P.ficon ? P.ficon('stay') : UI.npc('蜜糖媽媽')}<div class="grow"><b>寄放處</b><div class="muted">家裡住不下時，免費寄放、隨時接回｜現在寄放 ${S.stay.length} 隻</div></div><button class="alt" data-a="stay">打開</button></div>
      <div class="card row2 rrcard" data-a="reroll">${P.ficon ? P.ficon('reroll') : UI.npc('西施')}<div class="grow"><b>洗技能／洗天性魔法</b><div class="muted">選一隻寶寶，直接去洗｜麵包洗不用磁片</div></div><button class="ok" data-a="reroll">打開</button></div>
      <div class="card row2" data-a="codex">${P.ficon ? P.ficon('codex') : UI.av({ sp: 'owl', tier: 0 }, 44)}<div class="grow"><b>圖鑑</b><div class="muted">已遇見 ${P.knownCodexCount ? P.knownCodexCount() : Object.keys(S.codex).length} 個體｜星彩 ${Object.keys(S.codexS).length} 種</div></div><button class="alt" data-a="codex">打開</button></div>
      <div class="card row2" data-a="qa">${UI.npc('西施媽媽')}<div class="grow"><b>問西施媽媽</b><div class="muted">住民滿了、怎麼加蓋、出戰、育兒籃……不懂就問</div></div><button class="alt" data-a="qa">問問看</button></div>
      <div class="card row2" data-a="bmenu">${P.ficon ? P.ficon('expand') : ''}<div class="grow"><b>建造</b><div class="muted">小屋、二館、農場、雜物倉：能蓋的、還差什麼都在這裡</div></div><button class="alt" data-a="bmenu">打開</button></div>
      <div class="card row2" data-a="ware">${P.ficon ? P.ficon('ware') : ''}<div class="grow"><b>雜物倉</b><div class="muted">${P.S.ware && P.S.ware.built ? `收著 ${P.wareUsed()}/${P.wareSlots()} 件家具` : '還沒蓋：先蓋雜物倉才能收家具'}</div></div><button class="alt" data-a="ware">打開</button></div>
      ${P.ui3 ? P.ui3.counterCards() : ''}
      <h3>指定認養（金幣 ${C.adoptGold[n].toLocaleString()}＋麵包 ${C.adoptBread[n]}）</h3><div class="row">${(P.adoptSpecies ? P.adoptSpecies() : P.SPECIES).map(s => `<button class="pbtn" data-a="adopt" data-v="${s.id}">${UI.av({ sp: s.id, tier: 0 }, 36)}${s.name}</button>`).join('') || '<div class="muted">還沒救過的孩子，暫時不能指定認養。</div>'}</div>
      <h3>圍欄外徘徊（${S.wander.length}/3）</h3>${S.wander.map((a, i) => animalCard(a, 'win', i, '收留')).join('') || '<div class="muted">現在沒有</div>'}
      <h3>候補名冊（${S.wait.length}/10）</h3>${S.wait.map((a, i) => animalCard(a, 'tin', i, '收留')).join('') || '<div class="muted">沒有</div>'}
      ${P.ui3 ? P.ui3.matCard() : ''}`, (a, v) => {
        let r;
        if (a === 'zombie') { const r = P.claimZombie(); UI.toast(r.msg); draw(); return }
        if (a === 'crystal') { const r = P.claimCrystal(); UI.toast(r.msg); draw(); return }
        if (a === 'quests') return UI.nav(questScreen);
        if (a === 'codex') return UI.nav(codexScreen);
        if (a === 'stay') return UI.nav(stayScreen);
        if (a === 'reroll') return UI.nav(rerollPick);
        if (a === 'qa') return P.openQA(); if (a === 'bmenu') return P.openBuild(); if (a === 'ware') return P.openWare();
        if (a === 'bq') return P.reqAct(v, draw);
        if (P.ui3 && P.ui3.counterAct(a, v)) return;
        if (a === 'adopt') { r = P.adopt(v); if (r.ok) UI.toast(`認養了 ${P.SP[v].name}${r.p.star === 2 ? '（✦星彩！）' : ''}`); else fullToast(r) }
        if (a === 'win') { r = P.takeIn(P.S.wander[+v], 'wander'); if (!r.ok) fullToast(r) }
        if (a === 'tin') { r = P.takeIn(P.S.wait[+v], 'wait'); if (!r.ok) fullToast(r) }
        draw();
      });
    };
    UI._refresh = null; draw();
  }
  counterScreen.root = counterScreen; P.openCounter = () => UI.nav(counterScreen);
  // ---------- 救援委託（救援只在任務裡發生） ----------
  function questScreen() {
    const S = P.S;
    UI.panel(`<h2>${UI.npc('蜜糖媽媽')} 救援委託</h2><div class="muted">救援是一次性的任務，不是每天的玩法。新委託會隨劇情和名聲出現；平常的新夥伴來自投靠、認養和育兒籃。</div>` +
      (P.visibleQuests ? P.visibleQuests() : P.QUESTS.filter(q => P.questInfo(q).state !== 'locked')).map(q => { const I = P.questInfo(q), st = S.quests[q.id] || {}; const cg = st.cages || null;
        return `<div class="card quest ${I.state}">${UI.npc(q.giver)}<div class="grow"><b>${q.main ? '【主線】' : ''}${q.name}</b> <span class="tag" style="background:${I.state === 'open' ? '#a8e6a1' : I.state === 'done' ? '#ccc' : '#f5a3a3'}">${I.state === 'open' ? '可以接' : '完成'}</span>
        <div class="muted">委託人：${q.giver}｜${q.desc}</div><div class="muted">獎勵：${q.stone && P.stoneIcon ? P.stoneIcon(22) + ' ' : ''}${q.reward}</div>
        ${cg ? `<div class="row">${cg.map(c => UI.av(c.star === 2 && !st.done ? { sp: c.sp, tier: c.tier } : c, 32)).join('')}</div>` : ''}
        ${I.state === 'open' ? `<div class="row"><button class="bad" data-a="go" data-v="${q.id}">出發救援</button></div>` : ''}</div></div>` }).join(''),
      (a, v) => { if (a === 'go') P.startQuest(v) });
  }
  questScreen.root = questScreen;
  P.startQuest = id => { const q = P.QU[id]; if (!q || P.questInfo(q).state !== 'open') return UI.toast('這個委託現在不能接'); P.questCages(q); P.save(); P.go('arena', { mode: 'rescue', quest: id }) };
  P.openQuests = () => UI.nav(questScreen);
  // ---------- 圖鑑 ----------
  function codexScreen() {
    const S = P.S;
    UI.panel(`<h2>${UI.av({ sp: 'owl', tier: 0 }, 40)} 圖鑑</h2><div class="muted">已遇見 ${P.knownCodexCount ? P.knownCodexCount() : Object.keys(S.codex).length} 個體｜星彩 ${Object.keys(S.codexS).length} 種</div>
      <div class="codex">${P.SPECIES.filter(s => !P.knownSpecies || P.knownSpecies(s.id)).map(s => `<div>${UI.av({ sp: s.id, tier: P.firstKnownLook ? P.firstKnownLook(s.id) : 0 }, 48)}${S.codexS[s.id] ? UI.av({ sp: s.id, tier: 0, star: 2 }, 48) : ''}<br><b>${s.name}</b><br>已遇見 ${[0,1,2,3].filter(l=>S.codex[P.indId(s.id,l)]).length} 種毛色${S.codexS[s.id] ? '<br>✦' + s.shiny.nm : ''}</div>`).join('')}</div>${P.specialCodex ? P.specialCodex() : ''}${P.ui3 ? P.ui3.tales() : ''}`, () => { });
  }
  function petOpt(sel, j, other) { const busy = new Set(); P.S.cots.forEach((c, k) => { if (k !== j) { if (c.a) busy.add(c.a); if (c.b) busy.add(c.b) } }); if (other) busy.add(other);   // P5.1 #8：住在別間小屋（或同一間另一格）的不列出來；自己這格現在的住戶一定留著
    return '<option value="0">（空）</option>' + P.all().filter(p => (!P.canBreed || P.canBreed(p)) && P.canBreedAge(p) && !p.wq && (p.id === sel || !busy.has(p.id))).map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${p.star === 2 ? '✦' : ''}${UI.esc(P.label(p))} ${P.TIER_NAME[p.tier]} ♡${P.heart(p.aff)}</option>`).join('') + (P.ZOMBIE_STORY ? P.all().filter(p => P.SP[p.sp].breedable === false).map(p => `<option disabled value="soul-${p.id}">${UI.esc(P.label(p))}｜${P.ZOMBIE_STORY.menu}</option>`).join('') : '') }
  // ---------- 小屋 ----------
  // P4.4：生寶寶前先留好育兒室的位子
  function cotRoomCard() {
    const S = P.S, fr = P.nurseryFree(), nb = P.basketsOut(); if (!S.cots.some(c => c.a && c.b) && !nb) return '';
    const ways = `${nurseryTip()}把孩子免費寄放在我這裡，或讓一隻寶寶「放他出去闖闖」`;
    if (fr < 1) return `<div class="card row2" style="border-color:#ff6b6b">${UI.npc('蜜糖媽媽')}<div class="grow"><b>蜜糖媽媽</b>：「育兒室沒有空位留給新寶寶了（${P.nurseryUsed()}/${P.nurseryCap()}${nb ? `，還有 ${nb} 個育兒籃等著出生` : ''}${P.waitingKids().length ? `，${P.waitingKids().length} 隻在等待入住` : ''}）。要先留好寶寶的床，育兒籃才會出現喔。可以${ways}。」</div></div>`;
    if (S.farm === 1 && S.pets.length >= P.houseCap()) return `<div class="card row2" style="border-color:#ff6b6b">${UI.npc('蜜糖媽媽')}<div class="grow"><b>蜜糖媽媽</b>：「農場已經住滿 ${P.houseCap()} 隻大朋友了，這陣子育兒籃先不會出現。想再生寶寶，可以把一隻大朋友免費寄放在我這裡（隨時接回來），或讓牠「放他出去闖闖」，空出 1 個位子。」</div></div>`;
    if (fr < 3) return `<div class="card row2">${UI.npc('蜜糖媽媽')}<div class="grow"><b>蜜糖媽媽</b>：「育兒室還能留 ${fr} 個寶寶的位子。一個育兒籃最多會生 3 隻；如果一次生太多，多出來的孩子會先在門口『等待入住』，不會不見，只是暫時不能當爸媽。」</div></div>`;
    return '';
  }
  function cotScreen() {
    const draw = () => {
      const S = P.S, i = S.cots.filter(c => !c.farm).length, cost = i < P.cotMax() ? C.cotCost[i] : null;
      UI.panel(`<h2>🛖 小屋（${i}/${P.cotMax()}）</h2><div class="card row2">${UI.npc('西施')}<div class="grow">西施：「小屋是讓<b>兩個好朋友一起住</b>、等育兒籃的地方，<b>不是多出來的房間</b>喔！住在小屋裡的大朋友也算在『住民 ${S.pets.length}/${P.houseCap()}』裡面。想多住幾隻，到建造依序擴建側廂、側院、二館、舊驛站穀倉。」</div></div>${cotRoomCard()}<div class="muted">${P.ZOMBIE_STORY && P.knownSpecies('zombiedog') ? '西施：「'+P.ZOMBIE_STORY.hut+'」<br>' : ''}同物種的兩隻、都 ♡3 以上住在一起，每天 05:00 有機會在門口出現育兒籃（符合生育條件者不限性別）。${S.annex !== 1 && i >= C.cotMax ? '一館最多 3 間；蓋好二館可以再蓋 2 間。' : ''}</div>` +
        S.cots.map((c, j) => { const w = P.cotCheck(c); const sy = P.cotSync(c); const A = P.byId(c.a), B = P.byId(c.b); const so = A && B && A.sp === B.sp ? P.starOdds(A, B) : null;
          return `<div class="card"><b>${c.farm ? "🌾 農場" : ""}小屋 ${j + 1}</b> 默契 ${'♥'.repeat(sy)}${'♡'.repeat(3 - sy)}${c.basket ? ' 🧺 育兒籃（明天 05:00 出生）' + (c.basket.stone ? (P.stoneIcon ? P.stoneIcon(22) : '🍀') : '') : ''}${c.stone ? ' ' + (P.stoneIcon ? P.stoneIcon(22) : '🍀') : ''}
        <div class="row">${A ? UI.av(A, 40) : '<span class="av" style="width:40px;height:40px">？</span>'}<select data-c="${j}" data-k="a">${petOpt(c.a, j, c.b)}</select></div>
        <div class="row">${B ? UI.av(B, 40) : '<span class="av" style="width:40px;height:40px">？</span>'}<select data-c="${j}" data-k="b">${petOpt(c.b, j, c.a)}</select></div>
        <div class="row faces">朝向：${[['L', '⬅ 左'], ['F', '⬆ 正面'], ['R', '右 ➡']].map(([f, t]) => `<button data-a="face" data-v="${j}:${f}" class="${(c.face || 'L') === f ? 'ok' : 'alt'}">${t}</button>`).join('')}</div>
        <div class="muted">${w ? '⚠ ' + w : '✔ 符合條件，等 05:00'}｜今天一起玩 ${c.play && c.play.k === P.dayKey(P.now()) ? c.play.n : 0}/3${A && B && A.heir === B.heir ? '｜同一門家傳技' : ''}</div><div class="row"><button data-a="play" data-v="${j}">一起玩</button>${c.stone || P.seen('stone') ? `<button data-a="stone" data-v="${j}" class="alt">${P.stoneIcon ? P.stoneIcon(22) : '🍀'} ${c.stone ? '收回幸運石' : `放幸運石（有 ${S.stone || 0}）`}</button>` : ''}${c.pollen || P.seen('pollen') || P.seen('rainbow') ? `<button data-a="pollen" data-v="${j}" class="alt">${c.pollen ? '🌕 月光露放好了' : `🌕 放月光露（有 ${S.mat.pollen + (S.mat.rainbow || 0)}）`}</button>` : ''}<button data-a="room" data-v="${j}" class="ok">🚪 進去看看</button></div></div>` }).join('') +
        (P.reqCard ? P.reqCard('cot') : cost ? `<div class="row"><button class="ok" data-a="build">蓋小屋 ${i + 1}（金幣 ${cost[0].toLocaleString()}、麵包 ${cost[1]}、刻印 ${cost[2]}）</button></div>` : ''), (a, v) => {
          let r;
          if (a === 'bq') return P.reqAct(v, draw);
          if (a === 'face') { const [j, f] = v.split(':'); P.cotFace(+j, f) }
          if (a === 'build') { r = P.buildCot(); if (!r.ok) UI.toast(r.msg) }
          if (a === 'play') { const c = S.cots[+v], A = P.byId(c.a), B = P.byId(c.b); if (!A || !B) UI.toast('小屋裡要住兩隻，才能一起玩喔'); else { r = P.cotPlay(c); if (!r.ok) UI.toast(r.msg); else if (P.sceneName === 'shelter' && P.shelterPlay(A, B)) { UI.close(); UI.toast(`${P.label(A)} 和 ${P.label(B)} 跑到一起玩了！好感各 +3`, 3000); return } else UI.toast(`${P.label(A)} 和 ${P.label(B)} 玩得很開心！好感各 +3`) } }   /* P4.4：真的在院子裡玩給你看 */
          if (a === 'room') return P.go('room', +v);
          if (a === 'pollen') { const c = S.cots[+v]; if (c.pollen) UI.toast('月光露已經放在小屋裡了'); else if (!S.mat.pollen && !S.mat.rainbow) UI.toast('沒有月光露'); else if (S.mat.rainbow && P.ui3 && P.ui3.rainbow) return P.ui3.rainbow(c); else { S.mat.pollen--; c.pollen = 1; UI.toast('月光露放好了：下一個育兒籃一定有寶寶突變') } }
          if (a === 'stone') { r = P.placeStone(S.cots[+v]); UI.toast(r.ok ? (S.cots[+v].stone ? '小貓頭鷹：「咕。石頭擺好了，就看籃子裡的運氣囉。」' : r.msg) : r.msg) }
          draw();
        });
      document.querySelectorAll('#panel select[data-c]').forEach(s => s.onchange = () => { const c = S.cots[+s.dataset.c]; P.setCot(c, s.dataset.k === 'a' ? +s.value : c.a, s.dataset.k === 'b' ? +s.value : c.b); P.save(); draw() });
    };
    draw();
  }
  cotScreen.root = cotScreen; P.cotScreen = () => UI.nav(cotScreen);   // 農場的小屋也用同一個面板
  // ---------- 名冊 ----------
  function listScreen() {
    const S = P.S; const row = p => `<div class="card row2" data-a="open" data-v="${p.id}">${UI.av(p, 44)}<div class="grow">${UI.esc(P.label(p))} ${tierTag(p.tier)} ♡${P.heart(p.aff)}（${p.aff}）${p.baby ? ` Lv${p.lv}` : ''}${p.walk ? ' 🚶' : ''}${p.away ? ' 🎒' : ''}${S.eq === p.id ? ' ⚔️' : ''}${p.wq ? ' ⏳等待入住' : ''}${(p.medals || []).length ? ' 🏅' + p.medals.length : ''}<div class="muted">${P.PERS[p.pers]}｜第 ${(p.g || 0) + 1} 代</div></div><div class="row">${p.baby ? `<button class="ok" data-a="rr" data-v="${p.id}">🎲 洗技能</button>` : ''}<button class="alt" data-a="open" data-v="${p.id}">查看</button></div></div>`;
    UI.panel(`<h2>📋 名冊</h2><h3>住民（${S.pets.length}/${P.houseCap()}）</h3>${S.pets.map(row).join('') || '<div class="muted">還沒有</div>'}<h3>育兒室（${P.nurseryUsed()}/${P.nurseryCap()}${P.waitingKids().length ? `，⏳ 等待入住 ${P.waitingKids().length}` : ''}）</h3>${S.babies.map(row).join('') || '<div class="muted">還沒有寶寶</div>'}`, (a, v) => { if (a === 'open') openPet(P.byId(+v)); if (a === 'rr') rerollOf(P.byId(+v)) });
  }
  listScreen.root = listScreen;
  // ---------- 出戰 ----------
  function fightScreen() {
    const S = P.S; const ok = S.babies.filter(p => P.unlocked(p) && !p.away), okA = S.pets.filter(p => !p.away && !p.walk);
    UI.panel(`<h2>⚔️ 出戰（測試場）</h2><div class="muted">一次帶 1 隻：西施、1 隻寶寶，或 1 隻大朋友。大朋友更壯（普攻與招數是同位階寶寶的 ${Math.round(C.adult.atkMul * 100)}%），藍色以上會用傳家技；寶寶有較多技能格和天性魔法。救援在「📜 委託」裡。</div>
      <h3>同行寵物</h3><div class="row"><button data-a="eq" data-v="xishi" class="pbtn ${S.eq === 'xishi' ? 'ok' : ''}">${UI.npc('西施')}西施</button>${ok.map(p => `<button data-a="eq" data-v="${p.id}" class="pbtn ${S.eq === p.id ? 'ok' : ''}">${UI.av(p, 40)}${UI.esc(P.label(p))} ${P.TIER_NAME[p.tier]}</button>`).join('')}</div><h3>大朋友</h3><div class="row">${okA.map(p => `<button data-a="eq" data-v="${p.id}" class="pbtn ${S.eq === p.id ? 'ok' : ''}">${UI.av(p, 40)}${UI.esc(P.label(p))} ${P.TIER_NAME[p.tier]} Lv${p.lv || 1}</button>`).join('') || '<span class="muted">沒有</span>'}</div>
      <h3>關卡</h3><div class="row"><button class="ok" data-a="go" data-v="normal">小怪 3 波</button><button class="bad" data-a="go" data-v="boss">小怪＋王</button></div>`, (a, v) => {
        if (a === 'eq') { S.eq = v === 'xishi' ? 'xishi' : +v; fightScreen() }
        if (a === 'go') P.go('arena', { mode: v });
      });
  }
  fightScreen.root = fightScreen;
  P.openFight = () => UI.nav(fightScreen);
})(window.PET);
