// 小屋裡面／獎牌室（P5）：正式背景 assets/scenes/room/room_bg.jpg（chars/pets/scenes/build_room.py），牆上獎牌架 21 格。
// 獎牌小圖：村祭紅、城鎮藍、王都紫、傳說翡翠綠 × 金銀銅（第 1／2／3 名）。只讀資料，不改任何數字。
'use strict';
(function (P) {
  const MK = { v: 'village', s: 'town', k: 'royal', l: 'legend' }, MT = { 1: 'gold', 2: 'silver', 3: 'bronze' };
  P.ROOM = {
    slots: [[460, 171], [513, 171], [565, 171], [618, 171], [670, 171], [723, 171], [776, 171], [460, 227], [513, 227], [565, 227], [618, 227], [670, 227], [723, 227], [776, 227], [460, 284], [513, 284], [565, 284], [618, 284], [670, 284], [723, 284], [776, 284]],
    scale: 3, frame: [503, 98], bed: [168, 372], bowl: [1000, 470], basket: [1080, 362], floor: [300, 940], fy: [520, 600],
  };
  P.medalImg = m => `${MK[m.c] || 'village'}_${MT[m.pl] || 'gold'}`;
  // 架子上掛哪些：最新的 21 面（舊的在左上，新的往右下排）
  P.medalWall = ms => (ms || []).filter(m => m && m.pl >= 1 && m.pl <= 3).slice(-P.ROOM.slots.length);
  P.medalRows = () => P.all().filter(p => (p.medals || []).length).sort((a, b) => b.medals.length - a.medals.length || a.id - b.id);
  P.medalCount = ms => { const n = [0, 0, 0, 0]; (ms || []).forEach(m => n[m.pl] = (n[m.pl] || 0) + 1); return n };
  P.scenes = P.scenes || {};
  if (!P.ui || typeof Image === 'undefined') return;   // 以下是畫面
  const UI = P.ui, IM = {}, img = (k, src) => { const i = new Image(); i.src = src; IM[k] = i };
  img('bg', 'assets/scenes/room/room_bg.jpg');
  for (const a of Object.values(MK)) for (const b of Object.values(MT)) img(`${a}_${b}`, `assets/scenes/room/medals/medal_${a}_${b}.png`);
  const ok = i => i && i.complete && i.naturalWidth > 0;
  function tag(ctx, t, x, y, col, size) { if (P.art && P.art.tagBox) { P.art.tagBox(ctx, t, x, y, { size: size || 16, pad: 8, h: (size || 16) + 12, col: col || '#fff', s: 2, st: [3, 1] }); return } ctx.font = `bold ${size || 16}px sans-serif`; const w = ctx.measureText(t).width + 16, h = (size || 16) + 12; ctx.fillStyle = 'rgba(26,16,22,.8)'; ctx.fillRect(x - w / 2, y - h + 6, w, h); ctx.fillStyle = col || '#fff'; ctx.fillText(t, x - w / 2 + 8, y) }
  // P5.1 #3：蜜糖媽媽說的話改成泡泡（她不在畫面上 → 左下角小頭像＋泡泡）；獎牌說明還是用框，但改成圓角階梯框
  function box(ctx, who, t) { if (who === '蜜糖媽媽' && P.speak) { if (RM && RM.said !== t) { RM.said = t; P.speak('蜜糖媽媽', t, 6) } return }
    if (P.art && P.art.pxBox) { ctx.font = '19px sans-serif'; const w = Math.min(1100, ctx.measureText(t).width + 40), x = 640 - w / 2, y = 640; P.art.pxBox(ctx, x, y, w, 58, { s: 2, st: [4, 2, 1], edge: '#5a3a1a', fill: 'rgba(255,250,236,.95)', hi: '#ffffff', lo: '#e8d6b0' }); ctx.fillStyle = '#8a5a2a'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(who, x + 14, y + 21); ctx.fillStyle = '#3a2414'; ctx.font = '19px sans-serif'; ctx.fillText(t, x + 14, y + 46); return }
    ctx.font = '19px sans-serif'; const w = Math.min(1100, ctx.measureText(t).width + 40), x = 640 - w / 2, y = 640;
    ctx.fillStyle = 'rgba(255,250,236,.93)'; ctx.fillRect(x, y, w, 56); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = '#8a5a2a'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(who, x + 14, y + 20); ctx.fillStyle = '#3a2414'; ctx.font = '19px sans-serif'; ctx.fillText(t, x + 14, y + 45) }
  function wall(ctx, ms) { const R = P.ROOM, s = R.scale; ctx.imageSmoothingEnabled = false;
    P.medalWall(ms).forEach((m, i) => { const [x, y] = R.slots[i], im = IM[P.medalImg(m)], sw = Math.sin((RM.t + i * 0.7) * 1.6) * (RM.hot === i ? 3 : 0.6);
      if (ok(im)) ctx.drawImage(im, Math.round(x - im.width * s / 2 + sw), y, im.width * s, im.height * s) }) }
  function frame(ctx, p) { const A = P.art, [x, y] = P.ROOM.frame; if (!(A && A.ready && p)) return; const pc = A.portraitCv(p.sp, P.artTier ? P.artTier(p) : p.tier || 0, p.star === 2, 44, { coat: p.coat ? Math.min(...p.coat) : 0 }); if (pc) { ctx.imageSmoothingEnabled = false; ctx.drawImage(pc, x - 22, y - 22, 44, 44) } }
  const draw1 = (ctx, p, x, y, act, flip, sc) => { const A = P.art; if (A && A.ready && p) A.draw(ctx, p, x, y, { act, t: RM.t + (p.id || 0) % 7, flip, scale: sc || 3 }) };
  let RM = null;
  const MOM = ['這面牆上的每一面，都是孩子們自己跑出來的喔。', '獎牌擦得亮亮的，客人一進門就看得到。', '輸了也沒關係，下一屆再掛一面上去就好。', '晚上燈一點，獎牌會一閃一閃的，好看極了。'];
  const COT = ['兩個好朋友住在一起，感情好就會有育兒籃。', '小屋裡暖暖的，孩子們都睡得很香。', '一起玩的次數多了，默契也會跟著變好喔。', '晚上就讓牠們好好休息吧。'];
  function bar() { const b = [['⬅ 回收容所', () => P.go('shelter')]];
    if (RM.arg === 'medals' && RM.rows.length > 1) b.unshift(['◀ 上一隻', () => { RM.i = (RM.i + RM.rows.length - 1) % RM.rows.length; RM.hot = -1 }], ['下一隻 ▶', () => { RM.i = (RM.i + 1) % RM.rows.length; RM.hot = -1 }]);
    if (RM.arg !== 'medals') b.push(['🛖 小屋面板', () => P.cotScreen && P.cotScreen()]);
    UI.bar(b) }
  P.scenes.room = {
    enter(arg) { RM = { said: null, arg, t: 0, i: 0, hot: -1, rows: arg === 'medals' ? P.medalRows() : [], say: P.pickLine('room|' + (arg === 'medals' ? 'm' : 'c'), arg === 'medals' ? MOM : COT) };
      if (arg === 'medals' && P.roomPick) { const k = RM.rows.findIndex(p => p.id === P.roomPick); if (k >= 0) RM.i = k; P.roomPick = null } bar() },
    update(dt) { if (RM) RM.t += dt },
    draw(ctx) {
      if (!RM) return; if (ok(IM.bg)) ctx.drawImage(IM.bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#5a3a2a'; ctx.fillRect(0, 0, 1280, 720) }
      const R = P.ROOM, night = P.isNight && P.isNight();
      if (night) { ctx.fillStyle = 'rgba(16,14,40,.32)'; ctx.fillRect(0, 0, 1280, 720); const g = ctx.createRadialGradient(190, 120, 10, 190, 120, 260); g.addColorStop(0, 'rgba(255,190,90,.22)'); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 520, 420) }   // 晚上：屋裡暗一點，燈籠附近暖光
      if (RM.arg === 'medals') {
        const p = RM.rows[RM.i];
        if (!p) { tag(ctx, '🏅 獎牌室', 640, 60, '#ffe36b', 22); box(ctx, '蜜糖媽媽', '獎牌架還空空的。去櫃檯的「🏆 大會」報名吧！'); return }
        frame(ctx, p); wall(ctx, p.medals);
        const n = P.medalCount(p.medals), more = p.medals.length - P.medalWall(p.medals).length;
        tag(ctx, `🏅 ${P.label(p)}　🥇${n[1]}　🥈${n[2]}　🥉${n[3]}${more > 0 ? `（牆上掛最新 ${R.slots.length} 面）` : ''}`, 640, 60, '#ffe36b', 20);
        if (RM.rows.length > 1) tag(ctx, `${RM.i + 1} / ${RM.rows.length}`, 640, 92, '#fff', 14);
        const x = 640 + Math.sin(RM.t * 0.5) * 60, mv = Math.abs(Math.cos(RM.t * 0.5)) > 0.3;
        draw1(ctx, p, x, 560, mv ? 'walk' : 'happy', Math.cos(RM.t * 0.5) < 0);
        const hm = RM.hot >= 0 && P.medalWall(p.medals)[RM.hot];
        box(ctx, hm ? '🏅 ' + hm.name : '蜜糖媽媽', hm ? `項目：${hm.ev || '—'}${hm.at ? `｜${new Date(hm.at + P.CFG.tz * 3600e3).toISOString().slice(0, 10).replace(/-/g, '/')}` : ''}` : RM.say);
        return }
      const c = P.S.cots[RM.arg], A = c && P.byId(c.a), B = c && P.byId(c.b);
      tag(ctx, `🛖 小屋 ${RM.arg + 1}`, 640, 60, '#ffe36b', 22);
      const ms = [].concat(A ? A.medals || [] : [], B ? B.medals || [] : []).sort((a, b) => (a.at || 0) - (b.at || 0)); wall(ctx, ms); frame(ctx, A || B);
      if (c && c.basket) { const [bx, by] = R.basket; tag(ctx, '🧺 育兒籃：明天 05:00 出生', bx, by - 46, '#ffe36b', 14) }
      if (A) { if (night) draw1(ctx, A, R.bed[0], R.bed[1], 'sleep', false, 2.4); else { const x = 520 + Math.sin(RM.t * 0.4) * 160; draw1(ctx, A, x, 560, Math.abs(Math.cos(RM.t * 0.4)) > 0.25 ? 'walk' : 'idle', Math.cos(RM.t * 0.4) < 0) } }
      if (B) { if (night) draw1(ctx, B, 640, 540, 'sleep', true, 2.6); else { const eat = Math.sin(RM.t * 0.23) > 0.4; draw1(ctx, B, eat ? R.bowl[0] - 60 : 820, eat ? R.bowl[1] + 30 : 590, eat ? 'eat' : 'idle', !eat) } }
      if (!A && !B) box(ctx, '蜜糖媽媽', '這間小屋還沒有人住。到「小屋面板」挑兩個好朋友住進來吧。');
      else box(ctx, '蜜糖媽媽', night ? '噓——孩子們睡著了。' : RM.say);
    },
    tap(x, y) { if (!RM) return; const R = P.ROOM, s = R.scale; let hit = -1;
      const ms = RM.arg === 'medals' ? (RM.rows[RM.i] || {}).medals : null;
      if (ms) P.medalWall(ms).forEach((m, i) => { const [mx, my] = R.slots[i]; if (Math.abs(x - mx) < 7 * s && y > my && y < my + 17 * s) hit = i });
      RM.hot = hit === RM.hot ? -1 : hit;
      if (hit < 0 && RM.arg !== 'medals') {   // P5.1 #2：以前固定拿第一隻（小狼）講話；現在點到誰就是誰
        const c = P.S.cots[RM.arg], two = c ? [P.byId(c.a), P.byId(c.b)].filter(Boolean) : [];
        let p = P.petAt ? P.petAt(x, y) : null; if (p && !two.includes(p)) p = null;
        if (!p && P._anc) { let bd = 1e9; for (const q of two) { const a = P._anc['p' + q.id]; if (!a) continue; const d = Math.hypot(x - a.x, y - (a.top + a.foot) / 2); if (d < bd && d < 160) { bd = d; p = q } } }
        if (p && P.petLine) { const l = P.petLine('chat', p); if (l) { if (P.speak) P.speak(p, l, 2.6); else UI.toast(`${P.label(p)}：「${l}」`, 2600) } } } },
    hud() { return RM ? `<span>${RM.arg === 'medals' ? '🏅 獎牌室' : `🛖 小屋 ${RM.arg + 1}`}</span>` : '' },
    leave() { RM = null },
  };
})(window.PET);
