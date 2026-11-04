// P5 農場家具＋穀倉（室內）：飯碗／自動餵食器、安心風鈴架、毛線球玩具箱、軟墊小床
// 規則（使用者 2026-11-03）：寵物沒有會消耗的數值；家具只用現有系統——乾飼料（C.daily.kibble、C.affGain.kibble）、好感、探險戰力。
// 核心兩件（寵物一多就照顧不完）：餵食（飯碗→自動餵食器）與風鈴（全農場慢慢自己加好感），不用一隻一隻點。
'use strict';
(function (P) {
  const C = P.CFG, H = 3600e3, MIN = 60e3;
  C.furn = {
    meals: [7, 17],              // 每天 07:00、17:00 放飯（台灣時間），每隻吃 1 份乾飼料＝跟手餵共用每天 2 次
    bowlCap: 20,                 // 飯碗一次裝 20 份＝20 隻吃一餐
    breadAt: 12, breadPer: 1,    // 大肚子餵食器：12:00 用倉庫的剩食麵包餵還沒吃過的（現有麵包規則）
    chimeMin: 30, chimeBase: 1, chimeCap: 12,   // 風鈴：每 30 分鐘全農場每隻好感基本 +1，每隻每天最多 12
    toyBase: 3, toyN: 3,         // 玩具箱：玩一次好感基本 +3，每隻每天 3 次
    bedBase: 5, sleepH: 2, sleepMul: 1.05,      // 小床：每隻每天睡 1 次，好感基本 +5，「睡得好」2 小時內下一次探險戰力 ×1.05
    tiers: [[0, '新客人'], [100000, '常客'], [300000, '熟客'], [800000, '老主顧']],
  };
  const FC = C.furn;
  // 商品（照順序：前面的買了，後面的才露出來）
  P.FURN = [
    { k: 'bowl', slot: 'feed', lv: 1, name: '飯碗', cost: 5000, eff: `一次裝 ${FC.bowlCap} 份飼料。每天 07:00、17:00 大家自己來吃（每隻 1 份＝乾飼料 1 次，好感 +${C.affGain.kibble}）。吃完要你點飯碗倒滿。`, need: () => 1, hint: '' },
    { k: 'chime', slot: 'chime', lv: 1, name: '安心風鈴架', cost: 90000, eff: `叮鈴叮鈴，聽了心情就穩。整個農場每隻每 ${FC.chimeMin} 分鐘好感 +${FC.chimeBase}，每天最多 +${FC.chimeCap}，你不在也會算。`, need: () => 1, hint: '' },
    { k: 'feeder', slot: 'feed', lv: 2, name: '自動餵食器', cost: 60000, eff: '換掉飯碗。07:00、17:00 自己放飯、自己補滿，不用再倒飼料。', need: S => S.furn.feed >= 1, hint: '先擺一個飯碗用用看，習慣了再升級成自動的。' },
    { k: 'toybox', slot: 'toy', lv: 1, name: '毛線球玩具箱', cost: 45000, eff: `擺了以後穀倉裡的孩子變得好有精神：少打盹、多跑跳。玩一次好感 +${FC.toyBase}，每隻每天 ${FC.toyN} 次。`, need: S => S.furn.feed >= 2, hint: '等你有了自動餵食器，大家吃得安穩，我再給你看會讓孩子們跑跳的東西。' },
    { k: 'bed', slot: 'bed', lv: 1, name: '軟墊小床', cost: 120000, eff: `每隻每天睡一次午覺，好感 +${FC.bedBase}，還會「睡得好」${FC.sleepH} 小時：這段時間出發的下一次探險，戰力 ×${FC.sleepMul}。`, need: S => P.furnTier() >= 1, hint: '這張是給「常客」的。' },
    { k: 'feeder2', slot: 'feed', lv: 3, name: '大肚子餵食器', cost: 180000, eff: `自動餵食器的升級版。除了兩餐，${FC.breadAt}:00 還會用倉庫的剩食麵包餵還沒吃過的（照麵包規則：每份 ${C.breadPerFeed} 個，好感 +${C.affGain.bread}）。`, need: S => S.furn.feed >= 2 && P.furnTier() >= 2, hint: '這台是給「熟客」的。' },
  ];
  P.FURN_K = {}; for (const f of P.FURN) P.FURN_K[f.k] = f;
  const st = () => { const S = P.S; if (!S.furn) S.furn = { feed: 0, chime: 0, toy: 0, bed: 0, spent: 0, bowl: 0, fd: -1, meal: 0, ch: 0, seen: {} }; return S.furn };
  P.furnSt = st;
  P.furnTier = () => { const s = st().spent; let i = 0; FC.tiers.forEach((t, j) => { if (s >= t[0]) i = j }); return i };
  P.furnOwned = f => { const F = st(); return f.slot === 'feed' ? F.feed >= f.lv : !!F[f.slot] };
  P.furnState = f => { const S = P.S, F = st(); if (P.furnOwned(f)) return 'own'; if (f.slot === 'feed' && F.feed > f.lv) return 'own'; return f.need(S) ? 'buy' : 'lock' };
  P.furnBuy = k => {
    const S = P.S, F = st(), f = P.FURN_K[k]; if (!f) return { ok: 0, msg: '?' };
    if (S.farm !== 1) return { ok: 0, msg: '農場還沒成立' };
    const s = P.furnState(f); if (s === 'own') return { ok: 0, msg: '已經有了' }; if (s === 'lock') return { ok: 0, msg: '還沒解鎖' };
    if (S.gold < f.cost) return { ok: 0, msg: '金幣不夠' };
    S.gold -= f.cost; F.spent += f.cost; const t0 = P.furnTier();
    if (f.slot === 'feed') { F.feed = f.lv; if (f.lv === 1) F.bowl = FC.bowlCap } else F[f.slot] = 1;
    if (f.slot === 'chime') F.ch = P.now();
    P.emit('furn', `買了${f.name}（${f.cost.toLocaleString()}）`); return { ok: 1, f, tierUp: t0 };
  };
  // 農場裡的寵物（全部住民，不在外面的）
  const farmPets = () => P.S.farm === 1 ? P.all().filter(p => !P.out(p) && P.unlocked(p)) : [];
  const kib = p => P.counts(p).kibble || 0;
  P.furnWants = (p, k) => {
    const c = P.counts(p);
    if (!P.unlocked(p)) return 0;
    if (k === 'feed') return kib(p) < C.daily.kibble && (st().feed >= 2 || st().bowl > 0);
    if (k === 'toy') return (c.toy || 0) < FC.toyN;
    if (k === 'bed') return !c.nap;
    return 0;
  };
  // 用一次家具（拖過去、自己走過去都走這裡）
  P.furnUse = (p, k, o) => {
    const F = st(), c = P.counts(p);
    if (!P.furnWants(p, k)) return { ok: 0 };
    if (k === 'feed') { if (F.feed === 1) F.bowl--; const r = P.interact(p, 'kibble', undefined, { auto: !(o && o.hand) }); return { ok: 1, g: r.g } }   // 玩家拖過去才算「連續照顧」
    if (k === 'toy') { c.toy = (c.toy || 0) + 1; return { ok: 1, g: P.gainAff(p, FC.toyBase, '玩毛線球') } }
    if (k === 'bed') { c.nap = 1; p.sleepU = P.now() + FC.sleepH * H; return { ok: 1, g: P.gainAff(p, FC.bedBase, '在軟墊小床睡午覺') } }
    return { ok: 0 };
  };
  // ---------- 時間推進：放飯、風鈴（離線也照算；接在 tickP3 後面） ----------
  P.furnFx = [];   // 給畫面用：{id, g, k, t}
  const fxPush = (id, g, k) => { P.furnFx.push({ id, g, k, at: P.now() }); if (P.furnFx.length > 200) P.furnFx.splice(0, 100) };
  P.furnMsg = [];
  P.furnEv = { seq: 0, ids: [] };   // 最近一次放飯：穀倉的孩子要走去吃
  const atH = (k, h) => P.dayStart(k) + (h - C.resetHour) * H;
  P.furnTick = t => {
    const S = P.S; if (!S || S.farm !== 1) return; const F = st(), k = P.dayKey(t);
    if (F.fd !== k) { F.fd = k; F.meal = 0 }
    if (F.feed) {
      FC.meals.forEach((h, i) => {
        if (F.meal & (1 << i) || t < atH(k, h)) return; F.meal |= 1 << i;
        const ids = []; let miss = 0;
        for (const p of farmPets()) { if (kib(p) >= C.daily.kibble) continue; if (F.feed === 1 && F.bowl <= 0) { miss++; continue } if (F.feed === 1) F.bowl--; const r = P.interact(p, 'kibble', undefined, { auto: 1 }); ids.push(p.id); fxPush(p.id, r.g, 'feed') }
        P.furnEv = { seq: P.furnEv.seq + 1, ids };
        P.furnMsg.push(`🍚 ${h} 點放飯：${ids.length} 隻吃了乾飼料${miss ? `，${miss} 隻沒吃到（飯碗空了，點飯碗倒滿）` : ''}`);
      });
      if (F.feed >= 3 && !(F.meal & 8) && t >= atH(k, FC.breadAt)) {
        F.meal |= 8; let n = 0; for (const p of farmPets()) { if ((P.counts(p).bread || 0) >= C.daily.bread || S.bread < C.breadPerFeed) continue; const r = P.interact(p, 'bread', undefined, { auto: 1 }); if (r.ok) { n++; fxPush(p.id, r.g, 'feed') } }
        if (n) P.furnMsg.push(`🍞 大肚子餵食器發了剩食麵包：${n} 隻`);
      }
    }
    if (F.chime) {
      const step = FC.chimeMin * MIN; if (!F.ch) F.ch = t; const n = Math.floor((t - F.ch) / step);
      if (n > 0) { F.ch += n * step; let tot = 0, who = 0;
        for (const p of farmPets()) { const c = P.counts(p), left = FC.chimeCap - (c.chime || 0), m = Math.min(n, left); if (m <= 0) continue; c.chime = (c.chime || 0) + m; const g = P.gainAff(p, FC.chimeBase * m, '聽安心風鈴'); tot += g; who++; fxPush(p.id, g, 'chime') }
        if (who) P.furnMsg.push(n > 1 ? `🎐 你不在的時候風鈴一直響：${who} 隻好感一共 +${tot}` : `🎐 風鈴響了：${who} 隻好感 +1`) }
    }
  };
  const tp3 = P.tickP3; P.tickP3 = t => { if (tp3) tp3(t); if (P.S.farm === 1 && !P.S.farmAt) P.S.farmAt = t; P.furnTick(t) };

  // ---------- 農場小屋（培養感情用；開農場後第 0／7／21／42／70 天各多 1 個位子，最多 5 間） ----------
  // 平衡（pettest/sim/mutation_sim.js 第 ⑦ 段）：有農場以後全部小屋合計每天最多出生 3 隻（P.birthCap），體質維持每月約 6 隻。
  C.farmHut = { days: [0, 7, 21, 42, 70], cost: [[150000, 100, 20], [250000, 150, 40], [400000, 200, 60], [600000, 250, 80], [800000, 300, 100]], birthCap: 3,
    x: [180, 1125, 2450, 3250, 3700], y: 600 };
  P.farmDay = () => P.S.farm === 1 && P.S.farmAt ? P.dayKey(P.now()) - P.dayKey(P.S.farmAt) : -1;
  P.farmHuts = () => P.S.cots.filter(c => c.farm);
  P.farmHutOpen = () => { const d = P.farmDay(); return d < 0 ? 0 : C.farmHut.days.filter(x => d >= x).length };   // 現在開放幾個位子
  P.farmHutNext = () => { const d = P.farmDay(), n = P.farmHutOpen(); return n >= C.farmHut.days.length || d < 0 ? null : { slot: n + 1, inDays: C.farmHut.days[n] - d } };
  P.buildFarmHut = () => {
    const S = P.S; if (S.farm !== 1) return { ok: 0, msg: '農場還沒成立' };
    const i = P.farmHuts().length; if (i >= C.farmHut.days.length) return { ok: 0, msg: '農場的小屋已經蓋滿 5 間了' };
    if (i >= P.farmHutOpen()) { const nx = P.farmHutNext(); return { ok: 0, msg: `第 ${i + 1} 個小屋位還在整地，再 ${nx ? nx.inDays : '?'} 天` } }
    const [g, b, sh] = C.farmHut.cost[i]; if (S.gold < g || S.bread < b || S.shards < sh) return { ok: 0, msg: `需要金幣 ${g.toLocaleString()}、麵包 ${b}、刻印碎片 ${sh}` };
    S.gold -= g; S.bread -= b; S.shards -= sh; S.cots.push({ a: 0, b: 0, since: P.now(), farm: 1 }); P.emit('cot', `農場蓋好小屋 ${i + 1}`); return { ok: 1, i };
  };
  // 「睡得好」：下一次探險戰力 ×1.05，出發就用掉
  P.goodSleep = p => !!(p && p.sleepU > P.now());
  const ep = P.expPow; if (ep) P.expPow = p => { const v = ep(p); return P.goodSleep(p) ? Math.round(v * FC.sleepMul * 10) / 10 : v };
  const es = P.expSend; if (es) P.expSend = (k, ids) => { const r = es(k, ids); if (r && r.ok) for (const id of ids) { const p = P.byId(id); if (p) p.sleepU = 0 } return r };
  // ---------- 室內／室外：一半住穀倉，偶爾換地方；想用家具的會自己進來 ----------
  P.inBarn = p => { const S = P.S; if (S.farm !== 1) return false; S.barnIn = S.barnIn || {}; if (S.barnIn[p.id] == null) S.barnIn[p.id] = p.id % 2; return !!S.barnIn[p.id] && !(S.follow || []).includes(p.id) };   // 跟著主人走的算在戶外
  P.furnHud = () => {
    const F = st(), b = [];
    if (F.feed === 1) b.push(`🍚 飯碗 ${F.bowl}/${FC.bowlCap}`); else if (F.feed >= 2) b.push(`🍚 自動放飯 ${FC.meals.map(h => String(h).padStart(2, '0') + ':00').join('、')}`);
    if (F.chime) { const m = Math.max(1, Math.ceil((F.ch + FC.chimeMin * MIN - P.now()) / MIN)); b.push(`🎐 風鈴 ${m} 分後 +1`) }
    if (F.toy) b.push('🧶 大家好有精神');
    return b.map(x => `<span>${x}</span>`).join('');
  };

  if (!P.ui || !P.scenes) return;   // 以下是畫面（node 測試只載上面的規則）
  // ---------- 農場小屋：畫在草原前景（y 600），跟寵物一起排前後 ----------
  const HIMG = {}; for (const k of ['hut', 'hut_night']) { const im = new Image(); im.src = `assets/scenes/shelter/${k}.png`; HIMG[k] = im }
  const HS = 1.2, hutSlots = () => { const n = P.farmHuts().length, open = P.farmHutOpen(); return C.farmHut.x.map((x, i) => ({ i, x, y: C.farmHut.y, st: i < n ? 'built' : i === n && i < open ? 'pad' : 'hide' })).filter(h => h.st !== 'hide') };   // 沒開放的位子不畫，只在空地牌子說下一個
  const htag = (ctx, t, x, y, bg, fg) => { ctx.font = 'bold 16px sans-serif'; const w = ctx.measureText(t).width + 16; ctx.fillStyle = '#1A1016'; ctx.fillRect(x - w / 2 - 2, y - 22, w + 4, 28); ctx.fillStyle = bg; ctx.fillRect(x - w / 2, y - 20, w, 24); ctx.fillStyle = fg; ctx.fillText(t, x - w / 2 + 8, y - 3) };
  P.farmHutDraw = (ctx, upto, done) => {
    const nt = P.isNight && P.isNight(), im = HIMG[nt ? 'hut_night' : 'hut'], huts = P.farmHuts();
    for (const h of hutSlots()) {
      if (done[h.i] || h.y > upto) continue; done[h.i] = 1;
      if (h.st === 'pad') { ctx.fillStyle = nt ? 'rgba(90,70,50,.75)' : 'rgba(150,116,74,.8)'; ctx.beginPath(); ctx.ellipse(h.x, h.y - 8, 92, 20, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(h.x - 4, h.y - 70, 8, 62); htag(ctx, '小屋空地（點我蓋）', h.x, h.y - 70, '#f3e2c0', '#3a2418'); continue }
      const w = im.naturalWidth * HS, hh = im.naturalHeight * HS;
      if (im.complete && im.naturalWidth) { ctx.imageSmoothingEnabled = false; ctx.drawImage(im, h.x - w / 2, h.y - hh + 6, w, hh) } else { ctx.fillStyle = '#e8b878'; ctx.fillRect(h.x - 80, h.y - 120, 160, 120) }
      const c = huts[h.i], A = P.byId(c.a), B = P.byId(c.b);
      htag(ctx, `🌾 小屋 ${h.i + 1}${c.basket ? ' 🧺' : ''}${A && B ? ' ♥' : ''}`, h.x, h.y - (hh || 120) - 2, '#ffe9a8', '#3a2418');
    }
  };
  P.farmHutTap = (wx, y) => {
    const h = hutSlots().find(h => Math.abs(wx - h.x) < 95 && y > h.y - 190 && y < h.y + 14); if (!h) return false;
    if (h.st === 'built') { if (P.cotScreen) P.cotScreen(); return true }
    const i = P.farmHuts().length, [g, b, sh] = C.farmHut.cost[i], nx = () => { const n = P.farmHutNext(); return n ? `第 ${n.slot} 個位子還要整地 ${n.inDays} 天。` : '' };
    UI.nav(() => UI.panel(`<h2>🌾 農場小屋空地 ${i + 1}</h2><div class="card row2">${UI.npc('蜜糖媽媽')}<div class="grow"><b>蜜糖媽媽</b>：「這塊地整好了！蓋一間小屋，讓兩個好朋友住在一起培養感情。住在小屋裡的也算在 20 隻裡面喔。要金幣 ${g.toLocaleString()}、剩食麵包 ${b}、刻印碎片 ${sh}。${i + 1 < C.farmHut.days.length ? '下一塊地我還在慢慢整，' + (nx() || '蓋好這間再說。') : '這是最後一塊地了。'}」</div></div><div class="muted">有農場以後，全部小屋加起來每天最多出生 ${C.farmHut.birthCap} 隻寶寶；農場住滿 ${P.houseCap()} 隻時，育兒籃會先停下來。</div><div class="row"><button class="ok" data-a="b">蓋小屋（${g.toLocaleString()}）</button></div>`, a => { if (a === 'b') { const r = P.buildFarmHut(); UI.toast(r.ok ? '蜜糖媽媽：「小屋蓋好了！點小屋就能安排誰住進去。」' : r.msg); if (r.ok) UI.close() } }));
    return true;
  };
  // =================================== 穀倉畫面 ===================================
  const UI = P.ui, esc = s => UI.esc(String(s == null ? '' : s)), fmt = n => Math.round(n).toLocaleString();
  const IMG = {}; for (const k of ['barn_day_bg', 'barn_night_bg']) { const im = new Image(); im.src = `assets/scenes/farm/${k}.jpg`; IMG[k] = im }
  for (const k of ['feeder', 'toybox', 'bed', 'chime', 'bowl_empty', 'bowl_half', 'bowl_full']) for (const n of ['', '_night']) { const im = new Image(); im.src = `assets/scenes/farm/furn_${k}${n}.png`; IMG[k + n] = im }
  P.furnImg = IMG;
  const ok = im => im && im.complete && im.naturalWidth > 0;
  const night = () => P.isNight ? P.isNight() : false;
  // 家具位置（腳底中心，1 倍畫；寵物 ×2）
  const POS = { feed: { x: 560, y: 470 }, chime: { x: 1040, y: 440 }, toy: { x: 800, y: 600 }, bed: { x: 300, y: 640 } };
  const SPOT = {
    feed: [[-100, 30, 0], [100, 30, 1], [-60, 75, 0], [60, 75, 1], [-150, 70, 0], [150, 70, 1]],
    toy: [[-130, 25, 0], [130, 25, 1], [0, 60, 0]], bed: [[0, -26, 0]], chime: [[-75, 45, 0]],
  };
  const sprite = k => { const F = st(); if (k === 'feed') return F.feed >= 2 ? 'feeder' : F.bowl <= 0 ? 'bowl_empty' : F.bowl <= FC.bowlCap / 2 ? 'bowl_half' : 'bowl_full'; return { chime: 'chime', toy: 'toybox', bed: 'bed' }[k] };
  const has = k => { const F = st(); return k === 'feed' ? F.feed >= 1 : !!F[k] };
  const rect = k => { const im = IMG[sprite(k)], w = ok(im) ? im.naturalWidth : 120, h = ok(im) ? im.naturalHeight : 120, p = POS[k]; return { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y - h, y1: p.y, w, h } };
  // 台詞（同一組不連續重複）
  const LN = {
    full: ['好飽～', '吃不下了啦', '肚子圓滾滾了', '晚點再吃', '剛剛才吃過喔'], empty: ['碗是空的耶…', '沒有飯飯了', '咦？飯碗空空的'],
    toy: ['玩夠了…', '今天玩好多了', '想歇一下'], bed: ['還不睏', '我剛睡飽喔', '眼睛還很亮呢'], busy: ['床上有人了', '等一下換我'],
    chime: ['叮鈴叮鈴，好好聽', '聽著好安心', '風鈴在唱歌'], kid: ['寶寶還太小'],
    eat: ['好吃！', '喀滋喀滋', '開動了！'], play: ['毛線球！', '抓到了！', '再一次！'], nap: ['呼…呼…', '好軟喔…'],
  };
  const lastL = {}; const pick = k => { const a = LN[k]; let l; do l = a[Math.floor(Math.random() * a.length)]; while (a.length > 1 && l === lastL[k]); lastL[k] = l; return l };
  let B = null; const pos = {};
  const sOf = p => pos[p.id] || (pos[p.id] = { x: 200 + Math.random() * 900, y: 500 + Math.random() * 180, tx: null, t: Math.random() * 9, until: 0, act: 'idle', flip: Math.random() < 0.5 });
  const inside = () => P.all().filter(p => !P.out(p) && P.inBarn(p));
  const lively = () => !!st().toy;
  function bar() { UI.bar([['⬅ 到草原', () => P.go('farm')], ['🛒 家具目錄', () => shop()]]) }
  function sayB(p, t, sec) { const s = sOf(p); s.bub = t; s.bubU = B.t + (sec || 2.2) }
  function startJob(p, k, ph, nogain) {
    const s = sOf(p), sp = SPOT[k], used = inside().filter(q => q !== p && pos[q.id] && pos[q.id].job && pos[q.id].job.k === k).map(q => pos[q.id].job.i);
    let i = 0; while (used.includes(i) && i < sp.length - 1) i++;
    if (k === 'bed' && used.length) { sayB(p, pick('busy')); return false }
    const [dx, dy, fl] = sp[i]; s.job = { k, i, ph, nogain, hand: ph === 'use', x: POS[k].x + dx, y: POS[k].y + dy, fl: !!fl }; if (ph === 'use') { s.x = s.job.x; s.y = s.job.y; beginUse(p, s) } return true;
  }
  function beginUse(p, s) {
    const j = s.job; j.ph = 'use'; s.flip = j.fl; s.tx = null;
    const d = { feed: 3, toy: 3, bed: 6, chime: 2 }[j.k]; j.end = B.t + d; s.act = { feed: 'eat', toy: 'happy', bed: 'sleep', chime: 'happy' }[j.k];
    if (j.nogain) { if (j.k === 'feed') sayB(p, pick('eat')); return }
    if (j.k === 'chime') { sayB(p, pick('chime')); return }
    const r = P.furnUse(p, j.k, { hand: j.hand }); j.g = r.ok ? r.g : 0; if (r.ok) { fxPush(p.id, r.g, j.k); sayB(p, pick({ feed: 'eat', toy: 'play', bed: 'nap' }[j.k])) } else { s.job = null; s.act = 'idle' }
  }
  function refuse(p, k) {
    const s = sOf(p); const F = st();
    const line = !P.unlocked(p) ? pick('kid') : k === 'feed' ? (F.feed === 1 && F.bowl <= 0 ? pick('empty') : pick('full')) : k === 'chime' ? pick('chime') : pick(k);
    sayB(p, line, 2.4); s.job = null; s.act = 'walk'; s.tx = { x: Math.max(100, Math.min(1150, s.x + (s.x < 640 ? 220 : -220))), y: Math.max(490, Math.min(690, s.y + 40)) }; s.until = B.t + 3;
  }
  function think(p, s) {
    const L = lively(), r = Math.random();
    if (has('bed') && P.furnWants(p, 'bed') && r < 0.05) { if (startJob(p, 'bed', 'go')) return }
    if (has('toy') && P.furnWants(p, 'toy') && r < (L ? 0.2 : 0.08)) { if (startJob(p, 'toy', 'go')) return }
    if (L && r < 0.45) { s.act = 'happy'; s.hop = 1; s.until = B.t + 1.2; return }   // 有玩具箱：原地蹦蹦跳
    if (!L && r < 0.3) { s.act = 'sleep'; s.until = B.t + 4 + Math.random() * 4; return }   // 沒玩具箱：常常打盹
    s.tx = { x: 90 + Math.random() * 1080, y: 495 + Math.random() * 195 }; s.until = B.t + (L ? 0.6 + Math.random() * 1.2 : 3 + Math.random() * 4);
  }
  // 換地方：每 40 秒左右一隻；想用家具的戶外寵物會優先進來
  let wT = 0;
  P.furnWander = dt => {
    if (P.S.farm !== 1) return; wT += dt; if (wT < 40) return; wT = 0;
    const all = P.all().filter(p => !P.out(p)); if (all.length < 2) return;
    const want = all.filter(p => !P.inBarn(p) && ((st().toy && P.furnWants(p, 'toy')) || (st().bed && P.furnWants(p, 'bed'))));
    const p = want.length && Math.random() < 0.5 ? want[Math.floor(Math.random() * want.length)] : all[Math.floor(Math.random() * all.length)];
    const go = !P.inBarn(p); P.S.barnIn[p.id] = go ? 1 : 0;
    const s = sOf(p); if (go) { s.x = 1200; s.y = 540; s.tx = { x: 900 + Math.random() * 150, y: 520 + Math.random() * 120 }; s.until = (B ? B.t : 0) + 2; s.job = null }
  };
  const fxOf = id => { const now = P.now(); for (let i = P.furnFx.length - 1; i >= 0; i--) { const f = P.furnFx[i]; if (f.id === id && now - f.at < 3500) return f } return null };
  // 寵物頭上的小愛心（農場戶外也用）
  P.furnPetFx = (ctx, p, x, y) => {
    const f = fxOf(p.id); if (!f || !P.art || !P.art.HEART) return; const k = (P.now() - f.at) / 3500, yy = y - (p.baby ? 86 : 118) - k * 26;
    ctx.globalAlpha = Math.max(0, 1 - k * k); P.art.px(ctx, P.art.HEART, x - 10, yy, 3); ctx.font = 'bold 15px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#1A1016'; ctx.strokeText(`+${f.g}`, x + 14, yy + 16); ctx.fillStyle = f.k === 'chime' ? '#ffe7a0' : '#ffd0e0'; ctx.fillText(`+${f.g}`, x + 14, yy + 16); ctx.globalAlpha = 1;
  };
  P.furnPosOf = p => sOf(p);   // 畫面位置（測試錄影用，唯讀）
  P.furnToasts = () => { while (P.furnMsg.length) UI.toast(P.furnMsg.shift(), 3600) };
  function bubble(ctx, txt, x, y) {
    ctx.font = 'bold 14px sans-serif'; const w = ctx.measureText(txt).width + 14, h = 24, bx = Math.max(4, Math.min(1276 - w, x - w / 2)), by = y - h;
    ctx.fillStyle = '#1A1016'; ctx.fillRect(bx - 2, by - 2, w + 4, h + 4); ctx.fillStyle = '#fffaf0'; ctx.fillRect(bx, by, w, h); ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 4, by + h + 2, 8, 4); ctx.fillStyle = '#fffaf0'; ctx.fillRect(x - 2, by + h, 4, 4); ctx.fillStyle = '#1A1016'; ctx.fillText(txt, bx + 7, by + 17);
  }
  function tag(ctx, t, x, y, col) { if (P.art && P.art.tagBox) { P.art.tagBox(ctx, t, x, y - 2, { size: 14, pad: 6, h: 22, col: col || '#fff', s: 2, st: [2, 1] }); return } ctx.font = 'bold 14px sans-serif'; const w = ctx.measureText(t).width + 12; ctx.fillStyle = 'rgba(26,16,22,.82)'; ctx.fillRect(x - w / 2, y - 18, w, 22); ctx.fillStyle = col || '#fff'; ctx.fillText(t, x - w / 2 + 6, y - 2) }
  let held = null, lastEv = 0;
  P.scenes.barn = {
    enter() {
      if (P.S.farm !== 1) { UI.toast('農場還沒成立'); return P.go('shelter') }
      B = { t: 0 }; bar(); lastEv = P.furnEv.seq; const F = st();
      if (!F.seen.barn) { F.seen.barn = 1; setTimeout(() => UI.toast('蜜糖媽媽：「這裡是穀倉，下雨天也能玩。缺什麼，去「家具目錄」找我。」', 5000), 400) }
    },
    leave() { B = null; held = null },
    update(dt) {
      if (!B) return; B.t += dt; P.furnWander(dt); P.furnToasts();
      if (P.furnEv.seq !== lastEv) { lastEv = P.furnEv.seq; let d = 0; for (const id of P.furnEv.ids) { const p = P.byId(id); if (p && P.inBarn(p) && !P.out(p)) { const s = sOf(p); if (!s.job) { s.delay = d; d += 0.4; startJob(p, 'feed', 'go', 1) } } } }
      const L = lively();
      for (const p of inside()) {
        const s = sOf(p); s.t += dt; if (held && held.p === p && held.on) continue;
        if (s.job) {
          const j = s.job;
          if (j.ph === 'go') { if ((s.delay || 0) > 0) { s.delay -= dt; continue } const dx = j.x - s.x, dy = j.y - s.y, d = Math.hypot(dx, dy); if (d < 6) beginUse(p, s); else { const v = (L ? 170 : 90) * P.size(p).spd; s.x += dx / d * Math.min(d, v * dt); s.y += dy / d * Math.min(d, v * dt); s.flip = dx < 0; s.act = L ? 'run' : 'walk' } }
          else if (B.t > j.end) { s.job = null; s.act = j.k === 'bed' ? 'happy' : 'idle'; s.until = B.t + 1 }
          continue;
        }
        if (s.tx) { const dx = s.tx.x - s.x, dy = s.tx.y - s.y, d = Math.hypot(dx, dy); if (d < 6) { s.tx = null; s.act = 'idle' } else { const v = (L ? 160 : 55) * P.size(p).spd; s.x += dx / d * Math.min(d, v * dt); s.y += dy / d * Math.min(d, v * dt); s.flip = dx < 0; s.act = L ? 'run' : 'walk' } }
        else if (B.t > s.until) { s.hop = 0; s.act = 'idle'; think(p, s) }
      }
    },
    draw(ctx) {
      if (!B) return; const A = P.art, N = night(), sfx = N ? '_night' : '';
      const bg = IMG['barn' + (N ? '_night' : '_day') + '_bg']; if (ok(bg)) ctx.drawImage(bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#5a3a24'; ctx.fillRect(0, 0, 1280, 720) }
      const items = []; for (const k of ['feed', 'chime', 'toy', 'bed']) if (has(k)) items.push({ y: POS[k].y - (k === 'bed' ? 30 : 0), f: () => drawFurn(ctx, k, sfx) });
      const NF = N && 'filter' in ctx ? 'brightness(.72) saturate(.8)' : '';
      for (const p of inside()) { const s = sOf(p); items.push({ y: s.y, f: () => { const hop = s.hop ? -Math.abs(Math.sin(s.t * 9)) * 14 : 0, sc = p.baby ? 1.6 : 2; if (A && A.ready) { if (NF) ctx.filter = NF; A.draw(ctx, p, s.x, s.y + hop, { act: s.act || 'idle', t: s.t, flip: s.flip, scale: sc }); if (NF) ctx.filter = 'none' } if (P.goodSleep(p)) tag(ctx, '💤睡得好', s.x, s.y + 24, '#cfe3ff') } }) }
      items.sort((a, b) => a.y - b.y).forEach(i => i.f());
      for (const p of inside()) { const s = sOf(p); P.furnPetFx(ctx, p, s.x, s.y); if (s.bub && s.bubU > B.t) bubble(ctx, s.bub, s.x, s.y - (p.baby ? 92 : 124)) }
      if (has('chime')) { const k = (B.t % 3) / 3; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffe7a0'; ctx.font = 'bold 20px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#1A1016'; ctx.strokeText('♪', POS.chime.x - 40 + k * 10, POS.chime.y - 150 - k * 40); ctx.fillText('♪', POS.chime.x - 40 + k * 10, POS.chime.y - 150 - k * 40); ctx.globalAlpha = 1 }
      if (held && held.on) { for (const k of ['feed', 'chime', 'toy', 'bed']) if (has(k)) { const r = rect(k); ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.strokeRect(r.x0 - 6, r.y0 - 6, r.w + 12, r.h + 12); ctx.setLineDash([]) } }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#1A1016'; const hn = '穀倉（室內）：把寵物拖到家具上就會去用；拖到右邊的門口＝去草原'; ctx.strokeText(hn, 290, 708); ctx.fillText(hn, 290, 708);
    },
    down(x, y) { let best = null, bd = 1e9; for (const p of inside()) { const s = sOf(p), d = Math.hypot(x - s.x, (y - (s.y - 40)) * 1.2); if (d < 70 && d < bd) { bd = d; best = p } } held = best ? { p: best } : null; return !!best },
    move(x, y, moved) { if (!held || !moved) return; const s = sOf(held.p); held.on = 1; s.job = null; s.tx = null; if (held.lx != null && Math.abs(x - held.lx) > 6) s.flip = x < held.lx; held.lx = x; s.x = Math.max(60, Math.min(1230, x)); s.y = Math.max(480, Math.min(700, y + 70)); s.act = 'walk' },
    up(x, y, moved) {
      const h = held; held = null; if (!h) return; const p = h.p, s = sOf(p);
      if (!moved || !h.on) return P.openPet(p);
      if (s.x > 1170 && s.y < 600) { P.S.barnIn[p.id] = 0; UI.toast(`${P.label(p)} 跑到草原去了`); return }
      const k = ['feed', 'toy', 'bed', 'chime'].find(k => { if (!has(k)) return 0; const r = rect(k); return s.x > r.x0 - 40 && s.x < r.x1 + 40 && s.y > r.y1 - r.h * 0.7 && s.y < r.y1 + 80 });
      if (!k) { s.act = 'happy'; s.until = B.t + 1.2; return }
      if (k !== 'chime' && P.furnWants(p, k)) startJob(p, k, 'use'); else if (k === 'chime') { startJob(p, 'chime', 'use') } else refuse(p, k);
      P.save();
    },
    tap(x, y) {
      for (const k of ['feed', 'toy', 'bed', 'chime']) { if (!has(k)) continue; const r = rect(k); if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1 + 10) return info(k) }
    },
    hud() { const S = P.S, n = inside().length; return `<span>🏠 穀倉</span><span>室內 ${n}／室外 ${P.all().filter(p => !P.out(p)).length - n}</span>${P.furnHud()}` },
  };
  function drawFurn(ctx, k, sfx) {
    const im = IMG[sprite(k) + sfx], p = POS[k]; if (!ok(im)) return; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im, Math.round(p.x - im.naturalWidth / 2), Math.round(p.y - im.naturalHeight));
    const F = st();
    if (k === 'feed' && F.feed >= 3) tag(ctx, 'Ⅱ', p.x + 52, p.y - 120, '#ffe36b');
    if (k === 'feed' && F.feed === 1 && F.bowl <= 0) tag(ctx, '空了！點我倒飼料', p.x, p.y - 86, '#ffb0a0');
  }
  const say = (who, t) => `<div class="card row2">${UI.npc(who)}<div class="grow"><b>${who}</b>：「${t}」</div></div>`;
  function info(k) {
    const F = st(), f = k === 'feed' ? P.FURN.find(f => f.slot === 'feed' && f.lv === F.feed) : P.FURN.find(f => f.slot === k);
    const pets = P.all().filter(p => !P.out(p) && P.unlocked(p)); let extra = '', btn = '';
    if (k === 'feed') { const fed = pets.filter(p => kib(p) >= C.daily.kibble).length; extra = `今天吃滿 2 份的：${fed}/${pets.length} 隻`; if (F.feed === 1) { extra = `飯碗裡還有 ${F.bowl}/${FC.bowlCap} 份｜` + extra; btn = `<div class="row"><button class="ok big" data-a="fill" ${F.bowl >= FC.bowlCap ? 'disabled' : ''}>🥣 倒滿飼料</button></div>` } }
    if (k === 'chime') { const m = Math.max(1, Math.ceil((F.ch + FC.chimeMin * MIN - P.now()) / MIN)); extra = `下一次 +${FC.chimeBase}：${m} 分鐘後｜今天聽滿 ${FC.chimeCap} 次的：${pets.filter(p => (P.counts(p).chime || 0) >= FC.chimeCap).length}/${pets.length} 隻` }
    if (k === 'toy') extra = `今天還能玩的：${pets.filter(p => P.furnWants(p, 'toy')).length}/${pets.length} 隻`;
    if (k === 'bed') extra = `今天還沒睡午覺的：${pets.filter(p => P.furnWants(p, 'bed')).length}/${pets.length} 隻｜睡得好中：${pets.filter(P.goodSleep).length} 隻`;
    UI.nav(() => UI.panel(`<h2>${f.name}</h2>${say('蜜糖媽媽', f.eff)}<div class="muted">${extra}</div>${btn}`, a => { if (a === 'fill') { F.bowl = FC.bowlCap; P.save(); UI.toast('嘩啦啦～飯碗倒滿了'); UI.back() } }));
  }
  function shop() {
    const draw = () => {
      const S = P.S, F = st(), ti = P.furnTier(), nx = FC.tiers[ti + 1];
      const rows = P.FURN.map(f => ({ f, s: P.furnState(f) }));
      const vis = rows.filter(r => r.s !== 'lock'), lock = rows.find(r => r.s === 'lock');
      let hint = '目錄上的東西你都有了，謝謝照顧！';
      if (lock) { const f = lock.f; const gate = f.k === 'bed' ? 1 : f.k === 'feeder2' ? 2 : 0; hint = gate && ti < gate ? `${f.hint}在我這裡再買 ${fmt(FC.tiers[gate][0] - F.spent)} 金幣的東西，你就是「${FC.tiers[gate][1]}」了，到時候拿出來給你看。` : f.hint }
      UI.panel(`<h2>🛒 家具目錄</h2>${say('蜜糖媽媽', `你現在是我這裡的「${FC.tiers[ti][1]}」，累積買了 ${fmt(F.spent)} 金幣。${hint}`)}
        <div class="muted">💰 ${fmt(S.gold)}｜${nx ? `離「${nx[1]}」還差 ${fmt(nx[0] - F.spent)}` : '已經是最高等的老主顧'}</div>
        ${vis.map(({ f, s }) => `<div class="card"><b>${f.name}</b>　${s === 'own' ? '✔ 已經擺好' : `金幣 ${fmt(f.cost)}`}<div class="muted">${f.eff}</div>${s === 'buy' ? `<div class="row"><button class="ok" data-a="buy" data-v="${f.k}" ${S.gold < f.cost ? 'disabled' : ''}>買下來擺進穀倉</button></div>` : ''}</div>`).join('')}`, (a, v) => {
        if (a === 'buy') { const t0 = P.furnTier(), r = P.furnBuy(v); if (!r.ok) UI.toast(r.msg); else { P.save(); UI.toast(`蜜糖媽媽：「${r.f.name}擺好囉！${r.f.eff}」`, 6000); if (P.furnTier() > t0) setTimeout(() => UI.toast(`蜜糖媽媽：「從今天起你就是「${FC.tiers[P.furnTier()][1]}」了！」`, 4500), 600) } UI.hud() }
        draw();
      });
    };
    UI.nav(draw);
  }
  P.ui3 = P.ui3 || {}; P.ui3.furnShop = shop;
})(window.PET);
