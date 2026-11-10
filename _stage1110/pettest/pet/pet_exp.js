// 探險隊的兩個畫面（背景 chars/pets/scenes/build_exp.py）：
//  出發口 expedition：獵犬在地圖桌（點地圖桌／派遣板＝派遣面板）、可以出發的夥伴在空地待命、休息中的在板凳上睡、剛回來的在大門口開心；按出發會看到隊伍走出大門。
//  路上 trail：一條橫向長路，每一隊照「已經走了多久」從左往右走，右邊是目的地的關卡圖。
// 規則都在 pet_p3.js（P.expSend／expTick），這裡只有畫面。
'use strict';
(function (P) {
  const H = 3600e3;
  P.EXP_SPOT = { bench: { x: 110, y: 455 }, table: { x: 375, y: 420 }, board: { x: 660, y: 345 }, gate: { x: 960, y: 400 }, road_out: { x: 1110, y: 300 } };
  P.EXP_LANES = [495, 560]; P.EXP_ROAD = [90, 1150]; P.EXP_BACK_H = 1; P.EXP_READY_MAX = 6;
  // 出發口有誰：[{ p, kind: 'back'｜'rest'｜'ready' }]
  P.expDepartCrew = () => {
    const S = P.S, t = P.now(), out = [], seen = new Set(), N = !!(P.isNight && P.isNight());
    for (const l of (S.exp && S.exp.log) || []) { if (!l.win || !(t - l.at < P.EXP_BACK_H * H)) continue; for (const id of l.ids || []) { const p = P.byId(id); if (p && !P.out(p) && !seen.has(id)) { seen.add(id); out.push({ p, kind: 'back' }) } } }
    for (const p of P.all()) if (!seen.has(p.id) && !P.out(p) && p.restU > t) { seen.add(p.id); out.push({ p, kind: 'rest' }) }
    let n = 0; for (const p of P.all()) { if (n >= P.EXP_READY_MAX) break; if (!seen.has(p.id) && P.expFree(p)) { seen.add(p.id); out.push({ p, kind: 'ready' }); n++ } }
    if (N) for (const c of out) if (c.kind !== 'back') c.kind = 'rest';   // 晚上：大家在板凳那邊睡
    const r = out.filter(c => c.kind === 'rest'); if (r.length > 10) for (const c of r.slice(10)) out.splice(out.indexOf(c), 1);   // 板凳區最多畫 10 隻，不擠成一團
    return out;
  };
  // 路上的隊伍：[{ team, st, pets, pc 0～1, left ms }]
  P.expTrail = () => { const S = P.S, t = P.now(); return ((S.exp && S.exp.teams) || []).map(team => ({ team, st: P.ST[team.sk], pets: team.ids.map(P.byId).filter(Boolean), pc: Math.max(0, Math.min(1, (t - team.start) / Math.max(1, team.until - team.start))), left: Math.max(0, team.until - t) })) };
  P.scenes = P.scenes || {};
  if (!P.ui || typeof Image === 'undefined') return;   // 以下是畫面（node 測試只載上面的規則）
  const UI = P.ui, IMG = {}; for (const k of ['depart_day_bg', 'depart_night_bg', 'trail_day_bg', 'trail_night_bg']) { const im = new Image(); im.src = `assets/scenes/expedition/${k}.jpg`; IMG[k] = im }
  const STI = {}; const stImg = k => STI[k] || (STI[k] = Object.assign(new Image(), { src: `assets/stages/${k}_bg.jpg` }));
  const ok = im => im && im.complete && im.naturalWidth > 0, night = () => !!(P.isNight && P.isNight());
  const left = ms => { const h = Math.floor(ms / H), m = Math.ceil(ms % H / 60000); return h ? `${h} 小時 ${m} 分` : `${m} 分` };
  function tag(ctx, t, x, y, col) { if (P.art && P.art.tagBox) { P.art.tagBox(ctx, t, x, y, { size: 15, pad: 6, h: 22, col: col || '#fff', s: 2, st: [2, 1] }); return } ctx.font = 'bold 15px sans-serif'; const w = ctx.measureText(t).width + 12; ctx.fillStyle = 'rgba(26,16,22,.78)'; ctx.fillRect(x - w / 2, y - 17, w, 22); ctx.fillStyle = col || '#fff'; ctx.fillText(t, x - w / 2 + 6, y) }
  const NF = () => night() && 'filter' in CanvasRenderingContext2D.prototype ? 'brightness(.72) saturate(.8)' : '';
  function pet(ctx, p, x, y, act, t, flip) { const A = P.art; if (!(A && A.ready)) return; const f = NF(); if (f) ctx.filter = f; A.draw(ctx, p, x, y, { act, t, flip, scale: p.baby ? 1.6 : 2 }); if (p.id && p.wear && P.ui3 && P.ui3.drawWear) P.ui3.drawWear(ctx, p.wear, x, y - (p.baby ? 58 : 84), 2); if (f) ctx.filter = 'none' }
  // 出發時走出大門：包住 P.expSend，記下這一隊（只給畫面用，不存檔）
  let going = null; const send0 = P.expSend; P.expSend = (sk, ids) => { const r = send0(sk, ids); if (r.ok) going = { ids: r.team.ids.slice(), t0: performance.now(), from: {} }; return r };
  // ---------- 出發口 ----------
  let E = null; const pos = {};
  const pOf = (p, kind, i) => { let s = pos[p.id]; if (!s || s.kind !== kind) {
      const at = kind === 'back' ? { x: 880 + (i % 4) * 60, y: 470 + (i % 2) * 30 } : kind === 'rest' ? { x: 60 + (i % 5) * 96, y: 530 + Math.floor(i / 5) * 78 } : { x: 220 + Math.random() * 640, y: 490 + Math.random() * 150 };
      s = pos[p.id] = { kind, x: at.x, y: at.y, t: Math.random() * 9, tx: null, until: 0, flip: false } } return s };
  function dbar() { const b = [['⬅ 回農場', () => P.go('farm')], ['🗺️ 派遣板', () => P.ui3.exp()]]; if (P.S.exp.teams.length) b.push([`🚶 路上的隊伍（${P.S.exp.teams.length}）`, () => P.go('trail')]); UI.bar(b) }
  P.scenes.expedition = {
    enter() {
      if (!P.S.fac || !P.S.fac.board) { UI.toast('要先在農場蓋探險隊派遣板'); return P.go('farm') }
      E = { t: 0, nt: P.S.exp.teams.length }; dbar(); const S = P.S; S.hint3 = S.hint3 || {};
      if (!S.hint3.expGate) { S.hint3.expGate = 1; setTimeout(() => UI.toast('獵犬：「汪！點地圖桌挑地方、組隊伍。出發以後，走大門那條路就能看到牠們在路上。」', 5000), 400) }
    },
    leave() { E = null },
    update(dt) {
      if (!E) return; E.t += dt; if (P.S.exp.teams.length !== E.nt) { E.nt = P.S.exp.teams.length; dbar() }
      const crew = P.expDepartCrew(); const cnt = {};
      for (const c of crew) { const i = cnt[c.kind] = (cnt[c.kind] || 0) + 1; const s = pOf(c.p, c.kind, i - 1); s.t += dt;
        if (c.kind === 'ready') { if (!s.tx || s.until < E.t) { s.tx = { x: Math.max(200, Math.min(880, s.x + (Math.random() - 0.5) * 300)), y: 490 + Math.random() * 150 }; s.until = E.t + 3 + Math.random() * 5 }
          const dx = s.tx.x - s.x, dy = s.tx.y - s.y, d = Math.hypot(dx, dy); if (d > 6) { s.x += dx / d * 45 * dt; s.y += dy / d * 45 * dt; s.flip = dx < 0; s.mv = 1 } else s.mv = 0 } }
      if (going) { const k = (performance.now() - going.t0) / 1000; for (const id of going.ids) { const s = pos[id]; if (s && !going.from[id]) going.from[id] = { x: s.x, y: s.y } } if (k > 5) { going = null; dbar() } }
    },
    draw(ctx) {
      if (!E) return; const N = night(), bg = IMG[N ? 'depart_night_bg' : 'depart_day_bg']; if (ok(bg)) ctx.drawImage(bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#8cc46a'; ctx.fillRect(0, 0, 1280, 720) }
      tag(ctx, '🗺️ 地圖桌', P.EXP_SPOT.table.x, 300, '#ffe36b');
      const HD = { sp: 'retriever', tier: P.TIERS.indexOf('blue'), star: 0 };   // 黑色獵犬（偵探大衣）：守在地圖桌旁，派遣交給牠
      const items = [{ y: 445, f: () => pet(ctx, HD, 300, 440, N ? 'sleep' : 'idle', E.t, false), lab: () => tag(ctx, '獵犬（派遣）', 300, 466, '#ffe36b') }]; tag(ctx, '🚩 大門（往路上）', 1060, 250, '#ffe36b');
      for (const c of P.expDepartCrew()) { const s = pos[c.p.id]; if (!s) continue; const act = c.kind === 'back' ? 'happy' : c.kind === 'rest' ? 'sleep' : s.mv ? 'walk' : 'idle';
        items.push({ y: s.y, f: () => pet(ctx, c.p, s.x, s.y, act, s.t, s.flip), lab: () => tag(ctx, c.kind === 'back' ? `🎉 ${P.label(c.p)}` : c.kind === 'rest' ? `💤 ${P.label(c.p)}` : P.label(c.p), s.x, s.y + 26, c.kind === 'back' ? '#ffe36b' : c.kind === 'rest' ? '#cfe3ff' : '#fff') }) }
      if (going) { const k = (performance.now() - going.t0) / 1000, G = P.EXP_SPOT.gate, O = P.EXP_SPOT.road_out;
        going.ids.forEach((id, i) => { const p = P.byId(id), f = going.from[id] || { x: 500 + i * 40, y: 560 }; if (!p) return; const kk = Math.max(0, k - i * 0.35);   // 一隻接一隻
          let x, y; if (kk < 2.5) { const u = kk / 2.5; x = f.x + (G.x - f.x) * u; y = f.y + (G.y - f.y) * u } else { const u = Math.min(1, (kk - 2.5) / 2); x = G.x + (O.x - G.x) * u; y = G.y + (O.y - G.y) * u }
          if (kk < 4.5) items.push({ y, f: () => { ctx.globalAlpha = kk > 3.8 ? Math.max(0, (4.5 - kk) / 0.7) : 1; pet(ctx, p, x, y, 'walk', k, false); ctx.globalAlpha = 1 } }) });
        tag(ctx, '🚩 出發囉！', P.EXP_SPOT.gate.x, 330, '#ffe36b') }
      items.sort((a, b) => a.y - b.y).forEach(i => i.f()); items.forEach(i => i.lab && i.lab());
    },
    tap(x, y) {
      if (!E) return; let best = null, bd = 60; for (const c of P.expDepartCrew()) { const s = pos[c.p.id]; if (!s) continue; const d = Math.hypot(s.x - x, (s.y - 30) - y); if (d < bd) { bd = d; best = c } }
      if (best) { const p = best.p; if (best.kind === 'rest' && p.restU > P.now()) return UI.toast(`${P.label(p)} 在休息，${UI.fmtTime(p.restU)} 就可以再出發`, 3000); return P.openPet(p) }
      const T = P.EXP_SPOT.table, B = P.EXP_SPOT.board; if ((Math.abs(x - T.x) < 140 && y > 280 && y < 460) || (Math.abs(x - B.x) < 90 && y > 220 && y < 380)) return P.ui3.exp();
      if (x > 860 && y < 470) return P.S.exp.teams.length ? P.go('trail') : UI.toast('現在沒有隊伍在路上。點地圖桌派一隊出去吧！', 3000);
    },
    hud() { const S = P.S; return `<span>🗺️ 探險隊出發口</span><span>🚶 出發中 ${S.exp.teams.length}/${P.CFG.expTeams} 隊</span>` },
  };
  // ---------- 路上 ----------
  let R = null;
  P.scenes.trail = {
    enter() { if (!P.S.fac || !P.S.fac.board) return P.go('farm'); R = { t: 0 }; UI.bar([['⬅ 回出發口', () => P.go('expedition')], ['🗺️ 派遣板', () => P.ui3.exp()]]) },
    leave() { R = null },
    update(dt) { if (R) R.t += dt },
    draw(ctx) {
      if (!R) return; const N = night(), bg = IMG[N ? 'trail_night_bg' : 'trail_day_bg']; if (ok(bg)) ctx.drawImage(bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#8cc46a'; ctx.fillRect(0, 0, 1280, 720) }
      const L = P.expTrail(), [x0, x1] = P.EXP_ROAD; R.hit = [];
      L.forEach((v, li) => { const y = P.EXP_LANES[li % 2], im = stImg(v.st.k);   // 目的地：關卡圖小卡
        const cx = 1150, cy = li ? 372 : 228; ctx.fillStyle = '#3a2418'; ctx.fillRect(cx - 66, cy - 40, 132, 80); if (ok(im)) { if (v.st.filter && 'filter' in ctx) ctx.filter = v.st.filter; ctx.drawImage(im, cx - 60, cy - 34, 120, 68); ctx.filter = 'none' } tag(ctx, `終點：${v.st.name}`, cx, cy + 62, '#ffe36b') });
      const items = [];
      L.forEach((v, li) => { const y = P.EXP_LANES[li % 2], lx = x0 + (x1 - x0 - 120) * v.pc + 120;
        v.pets.forEach((p, i) => { const x = lx - i * 70, yy = y + (i % 2) * 8; items.push({ y: yy, f: () => pet(ctx, p, x, yy, 'walk', R.t + i * 0.3, false) }); R.hit.push({ x, y: yy, v }) });
        items.push({ y: 1e9, f: () => tag(ctx, `🚶 ${v.st.name}｜還要 ${left(v.left)}`, lx - (v.pets.length - 1) * 35, y - 110, '#ffe36b') }) });
      items.sort((a, b) => a.y - b.y).forEach(i => i.f());
      if (!L.length) tag(ctx, '獵犬：「現在沒有隊伍在路上。回出發口派一隊吧！」', 640, 500, '#ffe36b');
    },
    tap(x, y) { if (!R || !R.hit) return; const h = R.hit.find(h => Math.hypot(h.x - x, (h.y - 30) - y) < 60); if (h) UI.toast(`${h.v.st.name}：${h.v.pets.map(P.label).join('、')}｜${UI.fmtTime(h.v.team.until)} 回來`, 3500) },
    hud() { return `<span>🚶 探險路上</span><span>${P.S.exp.teams.length} 隊在路上</span>` },
  };
})(window.PET);
