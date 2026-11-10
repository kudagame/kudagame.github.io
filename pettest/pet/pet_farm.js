// P3 農場：3 個畫面寬的地圖（3840px）。主人走路、寵物跑來跑去、最多 3 隻跟著走；設施：池塘、菜園、溫泉、篝火、托兒所、探險隊派遣板、訓練營
'use strict';
(function (P) {
  const C = P.CFG, UI = P.ui, esc = s => UI.esc(String(s == null ? '' : s));
  const WW = 3840, GY0 = 430, GY1 = 680;
  const say = (who, t) => `<div class="card row2">${UI.npc(who)}<div class="grow"><b>${who}</b>：「${t}」</div></div>`;
  const fmt = n => Math.round(n).toLocaleString();
  let F = null;
  const IMG = {}; for (const k of ['farm_day_bg', 'farm_night_bg']) { const im = P.art.lazyImage(`assets/scenes/farm/${k}.jpg`); IMG[k] = im }   // P5：畫好的農場背景（chars/pets/scenes/build_farm.py）
  const bgOk = () => { const im = IMG[P.isNight && P.isNight() ? 'farm_night_bg' : 'farm_day_bg']; return P.art.imageOK(im) };
  const here = p => !P.out(p) && !(P.inBarn && P.inBarn(p));   // P5：在戶外草原（不在穀倉）
  const pos = {};   // 寵物在農場的位置
  const pOf = p => pos[p.id] || (pos[p.id] = { x: 300 + Math.random() * 3300, y: GY0 + 40 + Math.random() * 200, tx: null, t: Math.random() * 9, flip: false, until: 0 });
  function bar() {
    const S = P.S, b = [['⬅ 回收容所', () => P.go('shelter')]];
    if (S.fac.board) b.push(['🗺️ 探險隊', () => P.scenes.expedition ? P.go('expedition') : expScreen()]);
    if (S.fac.camp) b.push(['🏋️ 訓練營', () => P.scenes.train ? P.go('train') : campScreen()]);
    b.push(['🐾 跟著我', () => followScreen()]);
    if (P.scenes.barn) b.push(['🏠 進穀倉', () => P.go('barn')]);
    UI.bar(b);
  }
  P.scenes.farm = {
    enter() {
      if (P.S.farm !== 1) { UI.toast('農場還沒成立'); return P.go('shelter') }
      F = { cam: 0, hx: 300, hy: 560, tx: null, face: 1, t: 0 }; bar();
      const S = P.S; S.hint3 = S.hint3 || {}; if (!S.hint3.farm) { S.hint3.farm = 1; const l = P.NPC_LINES.farmHi[0]; setTimeout(() => UI.toast(`${l[0]}：「${l[1]}」`, 5000), 400) }
    },
    leave() { F = null },
    update(dt) {
      if (!F) return; F.t += dt; const K = P.keys, S = P.S;
      let mx = (K.ArrowRight || K.KeyD ? 1 : 0) - (K.ArrowLeft || K.KeyA ? 1 : 0), my = (K.ArrowDown || K.KeyS ? 1 : 0) - (K.ArrowUp || K.KeyW ? 1 : 0);
      if (mx || my) F.tx = null;
      if (F.tx) { const dx = F.tx.x - F.hx, dy = F.tx.y - F.hy, d = Math.hypot(dx, dy); if (d < 8) F.tx = null; else { mx = dx / d; my = dy / d } }
      F.hx = Math.max(40, Math.min(WW - 40, F.hx + mx * 300 * dt)); F.hy = Math.max(GY0, Math.min(GY1, F.hy + my * 200 * dt)); if (mx) F.face = Math.sign(mx); F.moving = !!(mx || my);
      F.cam += ((F.hx - 640) - F.cam) * Math.min(1, dt * 5); F.cam = Math.max(0, Math.min(WW - 1280, F.cam));
      const fol = (S.follow || []).slice(0, 3);
      if (P.furnWander) { P.furnWander(dt); P.furnToasts() }
      for (const p of P.all()) { if (!here(p)) continue; const s = pOf(p); s.t += dt; let tx, ty;
        const fi = fol.indexOf(p.id);
        if (fi >= 0) { tx = F.hx - F.face * (80 + fi * 60); ty = F.hy + 10 + (fi % 2) * 20 } else { if (!s.tx || s.until < F.t) { s.tx = { x: Math.max(80, Math.min(WW - 80, s.x + (Math.random() - 0.5) * 500)), y: GY0 + 40 + Math.random() * 200 }; s.until = F.t + 3 + Math.random() * 5 } tx = s.tx.x; ty = s.tx.y }
        const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy); if (d > 6) { const v = (fi >= 0 ? Math.min(d * 3, 320) : 50) * P.size(p).spd; s.x += dx / d * v * dt; s.y += dy / d * v * dt; s.flip = dx < 0; s.mv = 1 } else s.mv = 0 }
    },
    draw(ctx) {
      if (!F) return; const A = P.art, S = P.S;
      ctx.save(); ctx.translate(-Math.round(F.cam), 0);
      // 天空、山、草地（P5：有畫好的背景就用圖，3840 寬，白天／晚上）
      const bgi = IMG[P.isNight && P.isNight() ? 'farm_night_bg' : 'farm_day_bg'];
      if (P.art.imageOK(bgi)) ctx.drawImage(bgi, 0, 0, WW, 720); else {
      const g = ctx.createLinearGradient(0, 0, 0, 400); g.addColorStop(0, '#9fd8ff'); g.addColorStop(1, '#e8f7ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, WW, 420);
      ctx.fillStyle = '#9cc58a'; for (let i = 0; i < WW; i += 420) { ctx.beginPath(); ctx.moveTo(i - 60, 420); ctx.lineTo(i + 180, 230 + (i % 3) * 30); ctx.lineTo(i + 440, 420); ctx.fill() }
      ctx.fillStyle = '#7fc46a'; ctx.fillRect(0, 400, WW, 320); ctx.fillStyle = '#6fb45a'; for (let i = 0; i < WW; i += 36) ctx.fillRect(i + (i % 72 ? 8 : 0), 420 + (i * 7 % 260), 6, 4);
      ctx.fillStyle = '#d8b07a'; ctx.fillRect(0, 640, WW, 18); }
      // 設施
      for (const f of P.FAC) drawFac(ctx, f, !!S.fac[f.k]);
      // 寵物＋主人（照 y 排序）
      const list = P.all().filter(here).map(p => ({ p, s: pOf(p) })).sort((a, b) => a.s.y - b.s.y);
      let heroDone = false; const hd = {};   // hd：農場小屋已經畫過的（跟寵物一起照 y 排前後）
      for (const { p, s } of list) { if (P.farmHutDraw) P.farmHutDraw(ctx, s.y, hd); if (!heroDone && s.y > F.hy) { hero(ctx); heroDone = true } if (A && A.ready) A.draw(ctx, p, s.x, s.y, { act: s.mv ? 'walk' : 'idle', t: s.t, flip: s.flip, scale: p.baby ? 1.6 : 2 }); if (p.wear && P.ui3) P.ui3.drawWear(ctx, p.wear, s.x, s.y - (p.baby ? 58 : 84), 2); if ((S.follow || []).includes(p.id)) { ctx.fillStyle = '#ffe36b'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('🐾', s.x - 8, s.y + 18) } if (P.furnPetFx) P.furnPetFx(ctx, p, s.x, s.y) }
      if (P.farmHutDraw) P.farmHutDraw(ctx, 1e9, hd);
      if (!heroDone) hero(ctx);
      ctx.restore();
      // 小地圖
      ctx.fillStyle = 'rgba(26,16,22,.6)'; ctx.fillRect(860, 690, 400, 14); ctx.fillStyle = '#ffe36b'; ctx.fillRect(860 + F.cam / WW * 400, 690, 1280 / WW * 400, 14);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('農場（左右走就能逛完 3 個畫面）', 868, 682);
    },
    tap(x, y) {
      if (!F) return; const wx = x + F.cam, S = P.S;
      // 點寵物
      let best = null, bd = 60; for (const p of P.all()) { if (!here(p)) continue; const s = pOf(p), d = Math.hypot(s.x - wx, (s.y - 30) - y); if (d < bd) { bd = d; best = p } }
      if (best) return P.openPet(best);
      if (P.farmHutTap && P.farmHutTap(wx, y)) return;   // 點農場小屋／小屋空地
      // 點設施
      const f = P.FAC.find(f => Math.abs(wx - f.x) < 110 && y < 440 && y > 200); if (f) return facScreen(f);
      F.tx = { x: wx, y: Math.max(GY0, Math.min(GY1, y)) };
    },
    hud() { const S = P.S; return `<span>🌾 農場</span><span>🏠 住民 ${S.pets.length}/${P.houseCap()}</span><span>🐾 跟著走 ${(S.follow || []).length}/3</span>${P.furnHud ? P.furnHud() : ''}` },
  };
  function hero(ctx) { const x = F.hx, y = F.hy, b = F.moving ? Math.sin(F.t * 12) * 3 : 0; ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, y, 22, 7, 0, 0, 7); ctx.fill(); const s = 4; P.art.px(ctx, ['..bbbb..', '.bbbbbb.', '.bCCCCb.', '.CeCCeC.', '..CCCC..', '.RRRRRR.', 'RRRRRRRR', 'CRRRRRRC', '.RRRRRR.', '.bb..bb.', '.bb..bb.'], x - 16, y - 44 + b, s) }
  function drawFac(ctx, f, built) {
    const x = f.x, y = 400;
    if (!built) { ctx.fillStyle = '#c9a77a'; ctx.fillRect(x - 90, y - 10, 180, 30); ctx.fillStyle = '#8a6a44'; ctx.fillRect(x - 4, y - 90, 8, 80); ctx.fillStyle = '#f3e2c0'; ctx.fillRect(x - 70, y - 120, 140, 36); ctx.fillStyle = '#3a2418'; ctx.font = 'bold 15px sans-serif'; const t = f.real ? `空地：${f.name}` : `${f.name}（準備中）`; ctx.fillText(t, x - ctx.measureText(t).width / 2, y - 96); return }
    const col = { grass: '#5fa84a', pond: '#4aa3d8', garden: '#8a5a30', bath: '#d86a6a', fire: '#e8803a', nursery: '#f0b0c0', board: '#a07040', camp: '#7a7ad0' }[f.k] || '#aaa';
    if (f.k === 'pond' && bgOk()) { ctx.fillStyle = 'rgba(26,16,22,.8)'; ctx.font = 'bold 16px sans-serif'; const w = ctx.measureText('🎣 ' + f.name).width + 14; ctx.fillRect(x - w / 2, 282, w, 24); ctx.fillStyle = '#fff'; ctx.fillText('🎣 ' + f.name, x - w / 2 + 7, 300); return }   // 池塘就是背景畫的那一個，不再另外畫藍色橢圓
    if (f.k === 'pond') { ctx.fillStyle = '#4aa3d8'; ctx.beginPath(); ctx.ellipse(x, y + 10, 120, 34, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#bfe6ff'; ctx.fillRect(x - 40, y + 4, 30, 4) }
    else if (f.k === 'garden') { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#8a5a30'; ctx.fillRect(x - 100 + i * 70, y - 10, 60, 34); const g = P.S.garden[i]; if (g) { ctx.fillStyle = P.now() >= g.at ? '#ff8c2a' : '#3fae4f'; ctx.fillRect(x - 80 + i * 70, y - 26, 20, 16) } } }
    else if (f.k === 'fire') { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 40, y, 80, 14); if (P.fireOpen()) { ctx.fillStyle = '#ffb02a'; ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x, y - 50 - Math.sin(F.t * 9) * 6); ctx.lineTo(x + 24, y); ctx.fill() } }
    else if (f.k !== 'grass') { ctx.fillStyle = col; ctx.fillRect(x - 80, y - 110, 160, 120); ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.moveTo(x - 96, y - 110); ctx.lineTo(x, y - 170); ctx.lineTo(x + 96, y - 110); ctx.fill(); ctx.fillStyle = '#3a2418'; ctx.fillRect(x - 18, y - 46, 36, 56) }
    ctx.fillStyle = 'rgba(26,16,22,.8)'; ctx.font = 'bold 16px sans-serif'; const w = ctx.measureText(f.name).width + 14; ctx.fillRect(x - w / 2, y - 200, w, 24); ctx.fillStyle = '#fff'; ctx.fillText(f.name, x - w / 2 + 7, y - 182);
  }
  // ---------- 設施面板 ----------
  function facScreen(f) {
    const S = P.S;
    if (!S.fac[f.k]) return UI.nav(() => UI.panel(`<h2>${f.name}</h2>${say(f.npc, f.say)}${f.real ? `<div class="card">${f.eff}<div class="muted">金幣 ${fmt(f.cost)}，蓋好馬上能用</div><div class="row"><button class="ok" data-a="b">蓋${f.name}</button></div></div>` : ''}`, a => { if (a === 'b') { const r = P.buildFac(f.k); UI.toast(r.ok ? `${f.name}蓋好了！` : r.msg); if (r.ok) { bar(); UI.back() } } }));
    if (f.k === 'pond') return fishScreen();
    if (f.k === 'garden') return gardenScreen();
    if (f.k === 'board') return P.scenes.expedition ? P.go('expedition') : expScreen();
    if (f.k === 'camp') return P.scenes.train ? P.go('train') : campScreen();
    const act = { bath: () => P.bath(), fire: () => P.fire() }[f.k];
    UI.nav(() => UI.panel(`<h2>${f.name}</h2>${say(f.npc, f.say)}<div class="muted">${f.eff}</div>${act ? `<div class="row"><button class="ok" data-a="u">${f.k === 'bath' ? '♨️ 大家一起泡湯' : '🔥 圍著篝火坐'}</button></div>` : ''}`, a => { if (a === 'u') { const r = act(); UI.toast(r.ok ? (f.k === 'bath' ? '大家都洗得香香的！' : '大家心情變好了！') : r.msg) } }));
  }
  function fishScreen() {
    let st = 'idle', tm = 0, bite = 0;
    const draw = () => UI.panel(`<h2>🎣 池塘</h2>${say('蜜糖媽媽', '拋竿以後，浮標一沉下去就趕快按「拉！」。太早或太晚，魚都會跑掉。')}<div class="muted">今天還能釣 ${P.fishLeft()} 次</div>
      <div class="card" style="text-align:center;font-size:28px">${st === 'wait' ? '〰〰 🎈 〰〰' : st === 'bite' ? '〰〰 💦 〰〰<br><b>沉下去了！</b>' : '〰〰〰〰〰'}</div>
      <div class="row">${st === 'idle' ? '<button class="ok big" data-a="cast">拋竿</button>' : '<button class="bad big" data-a="pull">拉！</button>'}</div>`, a => {
      if (a === 'cast') { if (P.fishLeft() <= 0) return UI.toast('今天釣 5 次了，魚兒要休息'); st = 'wait'; bite = P.now() + 1200 + Math.random() * 2500; clearTimeout(tm); tm = setTimeout(() => { if (st !== 'wait') return; st = 'bite'; draw(); tm = setTimeout(() => { if (st === 'bite') { st = 'idle'; P.fish(false); UI.toast('魚跑掉了……'); draw() } }, 1200) }, bite - P.now()); draw() }
      if (a === 'pull') { clearTimeout(tm); const r = P.fish(st === 'bite'); st = 'idle'; UI.toast(r.ok ? (r.got ? '釣到了：' + r.got : r.msg) : r.msg, 3000); draw() }
    });
    UI.nav(draw); UI._refresh = null;
  }
  function gardenScreen() {
    const draw = () => { const S = P.S; UI.panel(`<h2>🥕 菜園</h2>${say('蜜糖媽媽', '種下去等幾個小時就能收成，不會枯掉，放心。')}${S.garden.map((g, i) => `<div class="card">田 ${i + 1}：${g ? `${P.CROPS[g.c].name}｜${P.now() >= g.at ? '✔ 可以收了' : UI.fmtTime(g.at) + ' 長好'} <button data-a="h" data-v="${i}" ${P.now() >= g.at ? '' : 'disabled'}>收成</button>` : Object.entries(P.CROPS).map(([k, c]) => `<button class="alt" data-a="p" data-v="${i}|${k}">${c.name}（${c.h} 小時，零食材料 ${c.mat}）</button>`).join('')}</div>`).join('')}`, (a, v) => { if (a === 'p') { const [i, k] = v.split('|'); const r = P.plant(+i, k); if (!r.ok) UI.toast(r.msg) } if (a === 'h') { const r = P.harvest(+v); UI.toast(r.ok ? '收成：' + r.got : r.msg) } draw() }) };
    UI.nav(draw);
  }
  function followScreen() {
    const draw = () => { const S = P.S; S.follow = S.follow || []; UI.panel(`<h2>🐾 跟著我走</h2>${say('西施', '最多 3 隻可以跟在你後面走。點一下就能換。')}${P.all().filter(p => !P.out(p)).map(p => `<button class="${S.follow.includes(p.id) ? 'ok' : 'alt'}" data-a="f" data-v="${p.id}">${UI.av(p, 28)} ${S.follow.includes(p.id) ? '✔ ' : ''}${esc(P.label(p))}</button>`).join(' ')}`, (a, v) => { if (a === 'f') { const id = +v; if (S.follow.includes(id)) S.follow = S.follow.filter(x => x !== id); else if (S.follow.length >= 3) UI.toast('最多 3 隻'); else S.follow.push(id) } draw() }) };
    UI.nav(draw);
  }
  // ---------- 探險隊 ----------
  function expScreen() {
    let sk = 's1', sel = [];
    const draw = () => {
      const S = P.S, st = P.ST[sk], [a, b] = P.partySize(st), pets = sel.map(P.byId).filter(Boolean), r = pets.length ? P.expRate(st, pets) : null;
      UI.panel(`<h2>🗺️ 探險隊派遣板</h2>${say('獵犬', `汪！（同時最多派 ${C.expTeams} 隊。不會受傷；沒成功也會帶安慰獎回來，連續失敗下次成功率 +${C.expStreak}%。）`)}
        ${S.exp.teams.map(t => `<div class="card">🚶 ${P.ST[t.sk].name}：${t.ids.map(i => P.byId(i) ? esc(P.label(P.byId(i))) : '').join('、')}｜${UI.fmtTime(t.until)} 回來</div>`).join('')}
        <div class="row">${P.STAGES.map(s => `<button class="${s.k === sk ? 'ok' : 'alt'}" data-a="s" data-v="${s.k}">${'★'.repeat(s.star)} ${s.name}</button>`).join('')}</div>
        <div class="card"><b>${st.name}</b>｜要 ${a === b ? a + ' 隻' : a + '～' + b + ' 隻'}｜需要戰力 ${st.req}｜${st.h} 小時<div class="muted">帶回：金幣 ${fmt(st.loot.gold)}、剩食麵包 ${st.loot.bread}${st.disk ? `、技能磁片（${st.disk}%）` : ''}${st.shards ? `、刻印碎片 ${st.shards[0]}～${st.shards[1]}` : ''}${st.chest ? `、寶箱（${st.chest}%，每天最多 ${C.expChestDay} 個）` : ''}</div></div>
        <div class="row">${S.babies.concat(S.pets).map(p => { const ok = P.expFree(p); return `<button class="${sel.includes(p.id) ? 'ok' : 'alt'}" data-a="p" data-v="${p.id}" ${ok ? '' : 'disabled'}>${sel.includes(p.id) ? '✔ ' : ''}${esc(P.label(p))} 戰力 ${P.expPow(p)}${ok ? '' : p.restU > P.now() ? '（休息中）' : '（不在）'}</button>` }).join('')}</div>
        <div class="muted">${r ? `隊伍戰力 ${r.pow}／需要 ${st.req} → 成功率 ${r.rate}%${r.bonus ? `（含連敗加成 +${r.bonus}%）` : ''}` : '選幾隻組隊'}</div>
        <div class="row"><button class="ok big" data-a="go" ${pets.length >= a && pets.length <= b ? '' : 'disabled'}>出發（${pets.length}/${a === b ? a : a + '～' + b}）</button></div>`, (x, v) => {
        if (x === 's') { sk = v; sel = [] }
        if (x === 'p') { const id = +v; if (sel.includes(id)) sel = sel.filter(i => i !== id); else if (sel.length < b) sel.push(id); else UI.toast(`這裡最多 ${b} 隻`) }
        if (x === 'go') { const r2 = P.expSend(sk, sel); UI.toast(r2.ok ? `出發了！成功率 ${r2.team.rate}%` : r2.msg); if (r2.ok) sel = [] }
        draw();
      });
    };
    UI.nav(draw);
  }
  // ---------- 訓練營 ----------
  function campScreen(id0, dr0) {
    let id = +id0 || 0, dr = P.DRILL.some(d => d.k === dr0) ? dr0 : 'log';   // 從訓練營場景點一站／一隻進來會先選好
    const draw = () => {
      const S = P.S, pets = S.babies.concat(S.pets).filter(p => !P.out(p) && P.unlocked(p)), p = P.byId(id) || pets[0]; if (p) id = p.id;
      const v = p ? P.trainPreview(p, dr) : null;
      UI.panel(`<h2>🏋️ 訓練營</h2>${say('獵犬', `汪汪！（日常訓練一次金幣 ${fmt(C.trainCost)}，會累；疲勞越高練得越少，每小時自己恢復 ${C.fatigueRecH}，去休息區睡一覺就清空。訓練加的點數每項最多 ${C.ablTrainCap}。）`)}
        <div class="row">${pets.map(q => `<button class="${q.id === id ? 'ok' : 'alt'}" data-a="p" data-v="${q.id}">${UI.av(q, 28)} ${esc(P.label(q))}</button>`).join('') || '<span class="muted">沒有可以訓練的</span>'}</div>
        ${p ? `<div class="muted">${esc(P.label(p))}｜疲勞 ${Math.round(P.fatigue(p))}/100｜訓練加過：${P.ABIL.map(A => `${A.name} ${p.tr[A.k] || 0}`).join('、')}</div>
        <div class="row">${P.DRILL.map(d => `<button class="${d.k === dr ? 'ok' : 'alt'}" data-a="d" data-v="${d.k}">${d.name}（${P.abName(d.main)}＋${P.abName(d.sub)}）</button>`).join('')}</div>
        <div class="card">這次會長：${P.abName(v.d.main)} +${v.main}、${P.abName(v.d.sub)} +${v.sub}</div>
        <div class="row"><button class="ok" data-a="t">練一次（${fmt(C.trainCost)}）</button><button class="alt" data-a="r">😴 去休息區</button></div>
        <h3>⛺ 集訓（出門幾天，回來一次加很多；寶寶有機會學到天性魔法）</h3><div class="row">${Object.entries(C.campDays).map(([d, c]) => `<button class="alt" data-a="c" data-v="${d}">${d} 天｜${fmt(c.gold)}｜主 +${c.main}／副 +${c.sub}｜天性魔法 ${c.magic}%</button>`).join('')}</div>` : ''}`, (a, val) => {
        if (a === 'p') id = +val; if (a === 'd') dr = val;
        if (a === 't') { const r = P.train(p, dr); UI.toast(r.ok ? `${P.abName(r.v.d.main)} +${r.v.main}、${P.abName(r.v.d.sub)} +${r.v.sub}` : r.msg) }
        if (a === 'r') { P.rest(p); UI.toast('睡飽了，疲勞清空') }
        if (a === 'c') { const r = P.camp(p, +val, dr); UI.toast(r.ok ? `${P.label(p)} 去集訓了` : r.msg) }
        draw();
      });
    };
    UI.nav(draw);
  }
  P.ui3.exp = expScreen; P.ui3.camp = campScreen; P.ui3.fac = facScreen;
})(window.PET);
