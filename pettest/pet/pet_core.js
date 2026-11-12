// 寵物系統核心：存檔、真實時間、需求條、好感、技能、天性魔法（舊稱副屬性）、配對生寶寶、投靠、升階（正式版也會用）
'use strict';
(function (P) {
  const C = P.CFG, H = 3600e3, D = 86400e3;
  P.now = () => Date.now();                 // 時間來源（統一從這裡取）
  P.rand = Math.random;
  P._ls = [];
  P.on = f => P._ls.push(f);
  P.emit = (type, msg, data) => { const e = { t: P.now(), type, msg, data }; for (const f of P._ls) try { f(e) } catch (x) { console.error(x) } };
  const R = () => P.rand(), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = a => a[Math.floor(R() * a.length)];
  P.ri = ri; P.pick = pick;
  const wpick = (items, wf) => { let t = 0; const ws = items.map(i => { const w = Math.max(0, wf(i)); t += w; return w }); if (t <= 0) return null; let r = R() * t; for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r < 0) return items[i] } return items[items.length - 1] };
  P.wpick = wpick;
  P.dayKey = t => Math.floor((t + (C.tz - C.resetHour) * H) / D);
  P.dayStart = k => k * D - (C.tz - C.resetHour) * H;   // 那一天 05:00 的時間
  P.heart = a => { let h = 1; for (let i = 1; i < 5; i++) if (a >= P.HEART[i]) h = i + 1; return h };
  P.indId = (sp, look) => sp + ':' + look;

  // ---------- 存檔 ----------
  P.newState = () => ({
    v: 1, unlock: 0, gift0: 0, gold: 0, bread: 0, snackMat: 0, disk: 0, shards: 0, collar: 0,
    letters: { b: 0, p: 0, k: 0 }, frag: { star: 0, dusk: 0 }, rep: 0, nid: 1,
    pets: [], babies: [], wander: [], wait: [], stay: [], cots: [], roster: {}, codex: {}, codexS: {}, quests: {},
    poop: [], heap: 0, heapG: [], poopAcc: 0, gear: [], diff: 0, stone: 0, sweep: { day: -1, bread: 0, star: 0 }, luck: { streak: 0, lastCare: -1 }, eq: 'xishi', hero: 0, lastSeen: P.now(), day: P.dayKey(P.now()),
    births: { day: -1, n: 0 }, giftDay: { day: -1, n: 0 }, extra: { day: -1, bread: 0, shard: 0 }, upPity: { 1: 0 }, sent: null,
  });
  P.load = () => {
    let s = null; try { s = JSON.parse(localStorage.getItem(C.saveKey) || 'null') } catch (e) { }
    P.S = Object.assign(P.newState(), s || {});
    P.migrate(P.S);
    return P.S;
  };
  // P2：舊存檔轉換（拿掉性別、懷孕改成小屋育兒籃、稀有花色改成星痕）
  P.migrate = S => {
    S.codexS = S.codexS || {}; S.quests = S.quests || {}; if (!Array.isArray(S.poop)) S.poop = []; if (S.heap == null) S.heap = 0; if (!S.sweep) S.sweep = { day: -1, bread: 0, star: 0 }; if (!S.gear) S.gear = []; if (!S.heapG) S.heapG = []; if (S.diff == null) S.diff = 0; if (S.stone == null) S.stone = 0;
    if (S.unlock && !S.quests.r1) S.quests.r1 = { done: 1 };
    const fix = p => { if (!p) return; if (p.rare && p.star == null) p.star = 2; delete p.rare; delete p.sex; if (p.star == null) p.star = 0; if (p.g == null) p.g = 0; if (p.gen && !p.litter) { p.litter = p.gen; delete p.gen } if (p.preg) { const c = S.cots.find(c => c.a === p.id || c.b === p.id); if (c && !c.basket) c.basket = { since: p.preg.since, a: c.a, b: c.b, sync: p.preg.sync || 1 }; delete p.preg } delete p.cool };
    if (!Array.isArray(S.stay)) S.stay = [];   // P4.4：寄放在蜜糖媽媽那裡的孩子
    [].concat(S.pets, S.babies, S.wander, S.wait, S.stay).forEach(fix); if (S.sent) fix(S.sent.p);
  };
  P.save = () => { try { localStorage.setItem(C.saveKey, JSON.stringify(P.S)) } catch (e) { P.emit('err', '存檔失敗：' + e.message) } };
  P.exportJSON = () => JSON.stringify(P.S);
  P.importJSON = txt => { const o = JSON.parse(txt); if (!o || !Array.isArray(o.pets)) throw new Error('格式不對'); P.S = Object.assign(P.newState(), o); P.migrate(P.S); P.save(); P.emit('save', '已匯入存檔') };

  // ---------- 小工具 ----------
  P.all = () => P.S.pets.concat(P.S.babies);
  P.out = p => !!(p && (p.walk || p.away));   // 不在院子裡（散步、集訓、探險）
  P.byId = id => P.all().find(p => p.id === id);
  P.repLv = () => { let l = 1; C.repLv.forEach((v, i) => { if (P.S.rep >= v) l = i + 1 }); return l };
  P.addRep = (n, why) => { const l0 = P.repLv(); P.S.rep += n; P.emit('rep', `名聲 +${n}（${why}）→ ${P.S.rep}`); if (P.repLv() > l0) P.emit('rep', `名聲升到 Lv${P.repLv()}`) };
  P.isBaby = p => !!p.baby;
  P.ageDays = p => p.bornDay == null ? 99 : P.dayKey(P.now()) - p.bornDay;
  P.unlocked = p => !p.baby || P.ageDays(p) >= 1;   // 出生後第 1 天 05:00 解鎖
  P.canBreedAge = p => !p.baby || P.ageDays(p) >= 3;
  P.label = p => (p.name || P.SP[p.sp].name) + (p.baby ? '寶寶' : '');
  P.isShiny = p => !!p && p.star === 2;
  // 星彩（色違）機率：基本 1/256，名聲 Lv5、Lv9 各 +50%
  P.shinyRate = () => { const lv = P.repLv(); let m = 1; for (const l of C.shinyRepLv) if (lv >= l) m += 0.5; return m / C.shinyOdds };
  P.wildStar = () => { const r = R(), s = P.shinyRate(); return r < s ? 2 : r < s + 1 / C.carrierOdds ? 1 : 0 };
  P.shinyName = p => P.SP[p.sp].shiny.nm;
  P.counts = p => { const k = P.dayKey(P.now()); if (!p.day || p.day.k !== k) p.day = { k, c: {}, happy: 0 }; return p.day.c };

  // ---------- 需求條（真實時間） ----------
  function decay(p, ms) {
    if (!p.need) p.need = { f: 80, m: 80, c: 80 };
    for (const k of ['f', 'm', 'c']) {
      let rate = (100 - C.needFloor) / C.needHours[k] / H;
      if (k === 'm') { const n = P.poopN(); for (const [lim, mul] of C.poopMood) if (n >= lim) { rate *= mul; break } if (P.S.farm === 1) rate *= 0.7 }
      if (p.need[k] > C.needFloor) p.need[k] = Math.max(C.needFloor, p.need[k] - rate * ms);
    }
  }
  function markHappy(p) { const c = P.counts(p); if (p.need.m >= 70 && p.need.f >= 50) p.day.happy = 1 }

  // ---------- 便便 ----------
  // S.poop＝散在院子的 [{x,y}]；S.heap＝浣熊搬到角落堆肥坑的數量。兩個加起來最多 poopCap。
  P.POOP_YARD = { x0: 290, x1: 1050, y0: 440, y1: 630 }; P.HEAP_AT = { x: 1168, y: 600 };   // 堆肥坑＝背景右下角的木頭堆肥箱
  P.poopN = () => { const S = P.S; return (S.poop || []).reduce((a, q) => a + (q.big ? 2 : 1), 0) + (S.heap || 0) };
  P.poopW = p => p.sp === 'bear' ? C.poopBear : 1;
  P.poopPerH = () => { const w = P.all().filter(p => !P.out(p)).reduce((a, p) => a + P.poopW(p), 0); return Math.min(w / C.poopHours, C.poopCap / C.poopFillMinH) };
  function poopTick(ms) {
    const S = P.S; if (!S.unlock) return; const pets = P.all().filter(p => !P.out(p)); if (!pets.length) return;
    S.poopAcc = (S.poopAcc || 0) + ms / H * P.poopPerH();   // 熊算 2 倍；總速度有上限，堆滿至少 24 小時
    const wt = pets.reduce((a, p) => a + P.poopW(p), 0);
    while (S.poopAcc >= 1) {
      S.poopAcc -= 1; if (P.poopN() >= C.poopCap) { S.poopAcc = 0; break }
      let r = R() * wt, who = pets[0]; for (const p of pets) { r -= P.poopW(p); if (r <= 0) { who = p; break } }
      const big = who.sp === 'bear' && R() * 100 < C.poopBigPct && P.poopN() + 2 <= C.poopCap;
      const Y = P.POOP_YARD; S.poop.push({ x: ri(Y.x0, Y.x1), y: ri(Y.y0, Y.y1), big: big ? 1 : 0, by: who.id, tier: who.tier || 0, t: P.now() });
      if (big) S.poopAcc -= 1;   // 一大坨算 2 坨，也吃 2 份速度：保證堆滿至少 24 小時
      P.emit('poop', `${P.label(who)} ${big ? '拉了一大坨' : '拉了一坨'}（${P.poopN()}/${C.poopCap}）`);
    }
  }
  P.poopTick = poopTick;
  // 主遊戲小兵的裝備掉落（同一張表）
  P.mobGearPct = d => 3 * (1 + (C.DIFF[d] || C.DIFF[0]).drop);
  P.rarW = d => { const D = C.DIFF[d] || C.DIFF[0], wb = D.wb || [60, 28], up = D.sh ? 1 + D.sh * 0.5 : 1; return [[0, wb[0]], [1, wb[1]], [2, 7 * up], [3, 3 * up], [4, D.pur], [5, D.pk || 0], [6, D.og || 0]].filter(x => x[1] > 0) };
  P.rollRar = d => { const ws = P.rarW(d), tot = ws.reduce((a, x) => a + x[1], 0); let r = R() * tot; for (const [k, w] of ws) if ((r -= w) < 0) return k; return 0 };
  P.poopGearPct = tier => P.mobGearPct(P.S.diff || 0) * C.poopGearFrac * (C.poopGearTier[tier || 0] || 1);  // 每坨（%）
  // 打掃：n 坨一起算掉落（浣熊堆起來的也照算，不會少）
  P.sweepPoop = what => {
    const S = P.S, k = P.dayKey(P.now()); if (!S.sweep || S.sweep.day !== k) S.sweep = { day: k, bread: 0, star: 0 };
    // 掉落份數：一般 1 份 20%、大坨 2 份各 25%；浣熊搬進堆肥坑的照原本的份數記在 S.heapBig（大坨份數）
    let n = 0, big = 0;
    // 裝備：每一坨（大坨算 2 份）照拉的那隻的位階擲；浣熊搬進坑裡的位階記在 S.heapG，不會不見
    let tiers = [];
    const tq = q => { for (let i = 0; i < (q.big ? 2 : 1); i++) tiers.push(q.tier || 0) };
    if (what === 'all') { n = P.poopN(); big = S.poop.filter(q => q.big).length * 2 + (S.heapBig || 0); S.poop.forEach(tq); tiers = tiers.concat(S.heapG); S.poop = []; S.heap = 0; S.heapBig = 0; S.heapG = [] }
    else if (what === 'heap') { n = S.heap; big = S.heapBig || 0; tiers = S.heapG.slice(); S.heap = 0; S.heapBig = 0; S.heapG = [] }
    else if (typeof what === 'number') { const q = S.poop[what]; if (!q) return { n: 0 }; S.poop.splice(what, 1); n = q.big ? 2 : 1; big = q.big ? 2 : 0; tq(q) }
    while (tiers.length < n) tiers.push(0);
    let bread = 0, star = 0;
    for (let i = 0; i < n; i++) if (S.sweep.bread < C.poopBreadDay && Math.random() * 100 < (i < big ? C.poopBigBread : C.poopBread)) { S.sweep.bread++; bread++ }
    if (n >= C.poopStarMin && !S.sweep.star && Math.random() * 100 < C.poopStar) { S.sweep.star = 1; star = 1 }
    S.bread += bread; S.frag.star += star;
    let stone = 0; if (n >= C.stoneSweepMin && !S.sweep.stone && Math.random() * 100 < C.stoneSweep) { S.sweep.stone = 1; S.stone++; stone = 1 }
    const gear = []; S.sweep.gear = S.sweep.gear || 0;
    for (const t of tiers) { if (S.sweep.gear >= C.poopGearDay) break; if (Math.random() * 100 < P.poopGearPct(t)) { const r = P.rollRar(S.diff || 0); const it = { r, name: C.GEAR_RAR[r], d: S.diff || 0, at: P.now() }; S.gear.push(it); gear.push(it); S.sweep.gear++ } }
    if (n) P.emit('poop', `打掃了 ${n} 坨${bread ? `，掃出麵包 ${bread}` : ''}${star ? '，還有 1 個星光碎片！' : ''}${stone ? '，1 顆幸運石' : ''}${gear.length ? '，裝備：' + gear.map(g => g.name).join('、') : ''}`);
    return { n, bread, star, stone, gear };
  };

  // 時間推進：從上次看到的時間算到現在（離線也照算）
  P.advance = () => {
    const S = P.S, t = P.now(); let last = S.lastSeen || t;
    if (t < last) return;                 // 時間往回調：沒有進度，也不扣東西
    let guard = 0;
    while (P.dayKey(last) < P.dayKey(t) && guard++ < 2000) {
      const nb = P.dayStart(P.dayKey(last) + 1);
      for (const p of P.all()) { decay(p, nb - last); markHappy(p) } poopTick(nb - last);
      last = nb; S.lastSeen = nb; dayRoll(P.dayKey(nb), nb);
    }
    for (const p of P.all()) { decay(p, t - last); markHappy(p) } poopTick(t - last);
    walks(t); if (P.tickP3) P.tickP3(t);
    S.lastSeen = t; S.day = P.dayKey(t);
  };

  // 每天 05:00 結算
  function dayRoll(k, t) {
    const S = P.S;
    P.emit('day', `—— 05:00 結算（第 ${k} 天）——`);
    P.settleWait();
    // 名聲：昨天開心的每一隻 +10
    let happy = 0; for (const p of P.all()) { if (p.day && p.day.k === k - 1 && p.day.happy) happy++ }
    if (happy) P.addRep(10 * happy, `昨天開心 ${happy} 隻`);
    // 生產
    for (const c of S.cots) if (c.basket && t - c.basket.since >= C.pregMinHours * H) P.birth(c, k);
    // 懷孕判定
    for (const c of S.cots) pregRoll(c, k);
    // 投靠
    wanderRoll();
    // 每日寵物額外糧食計數歸零
    S.extra = { day: k, bread: 0, shard: 0 };
    if (P.onDayRoll) P.onDayRoll(k, t);
  }

  // ---------- 好感 ----------
  P.affBonus = (p, detail) => {
    const S = P.S, b = {};
    b.英雄等級 = Math.min(13, Math.floor(C.heroLv / 5)) / 100;
    b.出戰次數 = Math.min(25, Math.floor((p.battles || 0) / 10)) / 100;
    b.同物種 = Math.min(15, 5 * (P.all().filter(q => q !== p && q.sp === p.sp).length)) / 100;
    b.最愛英雄 = p.fav && p.fav.hero === S.hero ? 0.2 : 0;
    b.連續照顧 = Math.min(10, S.luck.streak || 0) / 100;
    b.重逢 = S.reunionDay === P.dayKey(P.now()) ? 0.1 : 0;
    let sum = 0; for (const k in b) sum += b[k];
    sum = Math.min(C.affBonusCap, sum);
    return detail ? { b, sum } : sum;
  };
  P.gainAff = (p, base, why) => {
    const mul = C.affTierMul[p.tier] * (1 + P.affBonus(p));
    const g = Math.max(1, Math.round(base * mul));
    const h0 = P.heart(p.aff); p.aff = Math.min(1000, p.aff + g);
    P.emit('aff', `${P.label(p)} 好感 +${g}（${why}；基本 ${base} × ${mul.toFixed(2)}）→ ${p.aff}`, { id: p.id, g });
    if (P.heart(p.aff) > h0) P.emit('aff', `${P.label(p)} 升到 ♡${P.heart(p.aff)} ${P.HEART_NAME[P.heart(p.aff) - 1]}！`);
    return g;
  };
  function care() { const S = P.S, k = P.dayKey(P.now()); if (S.luck.lastCare === k) return; S.luck.streak = S.luck.lastCare === k - 1 ? S.luck.streak + 1 : 1; S.luck.lastCare = k; P.emit('care', `連續照顧 ${S.luck.streak} 天`) }
  // 連續照顧：當天在收容所／小屋／農場／穀倉做任何動作（點畫面、按按鈕、開面板）就算照顧了一天；家具自動餵不算
  P.CARE_SCENES = ['shelter', 'room', 'farm', 'barn'];
  P.care = care;
  P.careVisit = () => { if (P.S && P.CARE_SCENES.includes(P.sceneName)) care() };
  // 互動：回傳 {ok, msg, g}
  P.interact = (p, kind, arg, opt) => {   // opt.auto＝家具自動餵（不算玩家照顧，不加連續照顧天數）
    const S = P.S;
    if (!P.unlocked(p) && kind !== 'pet') return { ok: 0, msg: '剛出生，明天 05:00 才能培養' };
    const c = P.counts(p), cap = C.daily[kind];
    const n = (c[kind] || 0) + 1; c[kind] = n;
    const over = !C.capOff && cap != null && n > cap;
    let base = 0, msg = '';
    const A = C.affGain;
    switch (kind) {
      case 'pet': {
        const fav = p.fav && arg === p.fav.spot, hate = p.fav && arg === p.fav.hate;
        base = fav ? A.petFav : A.pet; p.need.m = Math.min(100, p.need.m + 15);
        if (fav) { p.knownSpot = 1; msg = `摸到最愛的${arg}了！` } else if (hate) { base = Math.min(base, 1); msg = '撇頭……不喜歡被摸' + arg } else msg = '摸摸' + arg;
        if (!P.unlocked(p)) { P.emit('care', `${P.label(p)} 被摸摸（寶寶出生當天不加好感）`); return { ok: 1, msg: '寶寶好舒服的樣子', g: 0 } }
        break;
      }
      case 'kibble': base = A.kibble; p.need.f = Math.min(100, p.need.f + 30); msg = '吃乾乾'; break;
      case 'bread': if (S.bread < C.breadPerFeed) { c[kind]--; return { ok: 0, msg: '剩食麵包不夠' } } S.bread -= C.breadPerFeed; base = A.bread; p.need.f = Math.min(100, p.need.f + 40); msg = '吃剩食麵包'; break;
      case 'snack': if (S.snackMat < 1) { c[kind]--; return { ok: 0, msg: '零食材料不夠' } } S.snackMat--; base = A.snack; p.need.f = Math.min(100, p.need.f + 20); p.need.m = Math.min(100, p.need.m + 10); msg = '吃特製零食'; break;
      case 'groom': base = A.groom; p.need.c = 100; msg = '梳毛洗澡'; break;
      case 'game': { const sc = ri(A.gameMin, A.gameMax); base = sc; p.need.m = Math.min(100, p.need.m + 25); msg = `玩小遊戲（${sc} 分）`; if (!over && n <= 3) P.addRep(2, '小遊戲'); break }
      default: return { ok: 0, msg: '?' };
    }
    if (over) base = A.over;
    if (!(opt && opt.auto)) care(); markHappy(p);
    const g = P.gainAff(p, base, msg + (over ? '（今日全額次數用完）' : ''));
    return { ok: 1, msg, g, over };
  };
  P.feedAll = () => { let n = 0; for (const p of P.all()) if (P.unlocked(p)) { P.interact(p, 'kibble'); n++ } return n };

  // 散步
  P.walk = (p, hours) => {
    if (p.walk) return { ok: 0, msg: '已經在散步了' };
    if (hours >= 6 && P.heart(p.aff) < 3) return { ok: 0, msg: '6 小時散步要 ♡3' };
    p.walk = { until: P.now() + hours * H, h: hours }; P.emit('walk', `${P.label(p)} 出門散步 ${hours} 小時`); return { ok: 1 };
  };
  function walks(t) {
    for (const p of P.all()) if (p.walk && t >= p.walk.until) {
      const h = p.walk.h, S = P.S; p.walk = null;
      const g = ri(100, 300) * h, b = ri(1, 2) * Math.ceil(h / 2), m = R() < 0.6 ? 1 : 0, d = R() < 0.05 ? 1 : 0;
      S.gold += g; S.bread += b; S.snackMat += m; S.disk += d;
      P.emit('walk', `${P.label(p)} 散步回來：金幣 ${g}、剩食麵包 ${b}${m ? '、零食材料 1' : ''}${d ? '、技能磁片 1' : ''}`);
      const c = P.counts(p); c.walk = (c.walk || 0) + 1;
      P.gainAff(p, (!C.capOff && c.walk > C.daily.walk) ? C.affGain.over : C.affGain.walk, '散步回來');
    }
  }

  // ---------- 禮物（打開收容所時） ----------
  P.collectGifts = () => {
    const S = P.S, k = P.dayKey(P.now()); if (S.giftDay.day !== k) S.giftDay = { day: k, n: 0 };
    const out = [];
    for (const p of P.all()) {
      if (!P.unlocked(p) || p.giftK === k || P.out(p)) continue;
      if (p.need.f < 50 || p.need.m < 50) continue;
      const h = P.heart(p.aff); let lv = h >= 2 && S.giftDay.n < 3 ? h : 1; if (lv >= 2) S.giftDay.n++;
      const gold = [200, 3000, 3600, 9600, 13800][lv - 1], bread = lv === 1 ? ri(1, 3) : 0, disk = R() < [0.05, 0.08, 0.15, 0.25, 0.35][lv - 1] ? 1 : 0;  // P2b：磁片多一點
      S.gold += gold; S.bread += bread; S.disk += disk; p.giftK = k;
      const nm = ['小點心', '銅禮物', '銀禮物', '金禮物', '彩虹禮物'][lv - 1];
      out.push(`${P.label(p)} 送了${nm}`); P.emit('gift', `${P.label(p)} 送${nm}：金幣 ${gold}${bread ? '、麵包 ' + bread : ''}${disk ? '、技能磁片 1' : ''}`);
    }
    return out;
  };

  // ---------- 技能 ----------
  const PERS_W = { 0: s => (s.cat === 'funA' ? 1.3 : 1), 4: s => ([35, 38, 41].includes(s.n) ? 1.5 : 1), 2: s => ([37, 44, 52].includes(s.n) ? 1.5 : 1), 3: s => (s.n === 40 ? 2 : 1), 1: s => ([33, 45].includes(s.n) ? 1.5 : 1) };
  P.skillWeights = (p, exclude) => {
    const have = (p.sk || []).filter((n, i) => i !== exclude).map(n => P.SK[n]);
    const cnt = f => have.filter(f).length;
    const isFun = s => s.cat === 'funA' || s.cat === 'funB';
    const out = [];
    for (const s of P.SKILLS) {
      let w = s.w, why = '';
      if (s.tier > p.tier) continue;
      if (have.some(h => h.n === s.n)) continue;
      if (s.cat === 'spc' && !s.sp.includes(p.sp)) continue;
      if (s.n === 41) continue;                                           // 延後
      if (s.n === 53 && !have.some(h => h.cat === 'elem')) continue;
      if (s.n === 29 && p.sp === 'shihtzu') continue;
      if (s.cat === 'survive' && cnt(h => h.cat === 'survive')) continue;
      if (s.cat === 'pick' && cnt(h => h.cat === 'pick')) continue;
      if (P.TRANSFORM.includes(s.n) && cnt(h => P.TRANSFORM.includes(h.n))) continue;
      if (isFun(s)) { const f = have.filter(isFun); if (f.length >= (p.tier >= 4 ? 2 : 1)) continue; if (f.some(h => h.cat === s.cat)) continue }
      if (s.cat === 'func') { const f = have.filter(h => h.cat === 'func'); if (f.length >= (p.tier >= 4 ? 2 : 1)) continue }
      if (s.sp.includes(p.sp) && s.cat !== 'spc') { w *= 2; why += '物種×2 ' }
      const pm = PERS_W[p.pers] ? PERS_W[p.pers](s) : 1; if (pm !== 1) { w *= pm; why += `性格×${pm}` }
      w *= (C.skillW && C.skillW[s.n] != null ? C.skillW[s.n] : 1);
      out.push({ s, w, why });
    }
    return out;
  };
  P.rollSkill = (p, slot) => { const ws = P.skillWeights(p, slot); const r = wpick(ws, x => x.w); return r ? r.s.n : null };
  P.fillSkills = p => { p.sk = p.sk || []; while (p.sk.length < C.slots[p.tier]) { const n = P.rollSkill(p, -1); if (!n) break; p.sk.push(n) } };
  // P3 保底：上半段的值
  P.rollSubUpper = (p, k) => { const t = Math.max(1, p.tier) - 1, s = P.SUBS.find(x => x.k === k), [a, b] = s.r[t]; return [k, Math.round(((a + b) / 2 + R() * (b - a) / 2) * 10) / 10] };
  P.rollSub = (p, have) => {
    const t = Math.max(1, p.tier) - 1, ok = P.SUBS.filter(s => !have.includes(s.k));
    const s = wpick(ok, x => x.w); const [a, b] = s.r[t]; let v = a + R() * (b - a);
    return [s.k, Math.round(v * 10) / 10];
  };
  P.fillSubs = p => { p.sub = p.sub || []; let want = C.subCount[p.tier]; if (p.tier === 3 && p.sub.length < 3 && p.sub3 == null) p.sub3 = R() * 100 < C.pink3SubChance ? 1 : 0; if (p.tier === 3 && p.sub3) want = 3; while (p.sub.length < want) p.sub.push(P.rollSub(p, p.sub.map(x => x[0]))) };
  P.subName = k => (P.SUBS.find(s => s.k === k) || {}).name || k;
  P.subText = (k, v) => { const n = P.subName(k); return /−$/.test(n) ? `${n}${v}%` : `${n} +${v}%` };
  P.chooseSub = (p, i, c) => { p.sub[i] = c; P.emit('skill', `${P.label(p)} 選了天性魔法：${P.subText(c[0], c[1])}`) };

  // 洗技能（payWith：'gold'|'bread'）
  P.reroll = (p, slot, payWith) => {
    const S = P.S; if (!p.baby) return { ok: 0, msg: '成年動物沒有技能格' };
    // P2b：剛出生也能洗（不再等 05:00）
    const cost = payWith === 'bread' ? C.rerollBread[p.tier] : C.rerollGold[p.tier];
    const disk = payWith === 'bread' ? C.rerollDiskBread : C.rerollDiskGold;
    if (S.disk < disk) return { ok: 0, msg: '技能磁片不夠（改用麵包洗就不用磁片）' };
    if ((payWith === 'bread' ? S.bread : S.gold) < cost) return { ok: 0, msg: (payWith === 'bread' ? '剩食麵包' : '金幣') + '不夠' };
    S.disk -= disk; if (payWith === 'bread') S.bread -= cost; else S.gold -= cost;
    p.pity = (p.pity || 0) + 1; const old = p.sk[slot];
    if (p.pity >= C.rerollPity) {   // 保底：第 rerollPity 次 3 選 1
      const ws = P.skillWeights(p, slot), ch = []; const fun = ws.filter(x => x.s.cat === 'funA' || x.s.cat === 'funB');
      if (fun.length) ch.push(wpick(fun, x => x.w).s.n);
      while (ch.length < 3 && ws.length > ch.length) { const n = wpick(ws.filter(x => !ch.includes(x.s.n)), x => x.w); if (!n) break; ch.push(n.s.n) }
      p.pity = 0; P.emit('skill', `${P.label(p)} 洗技能保底：3 選 1（${ch.map(n => P.SK[n].name).join('／')}）`);
      return { ok: 1, choose: ch, slot };
    }
    const n = P.rollSkill(p, slot); p.sk[slot] = n;
    P.emit('skill', `${P.label(p)} 洗技能 第 ${slot + 1} 格：${P.SK[old] ? P.SK[old].name : '—'} → ${P.SK[n].name}（第 ${p.pity} 次）`);
    return { ok: 1, n };
  };
  P.chooseSkill = (p, slot, n) => { p.sk[slot] = n; P.emit('skill', `${P.label(p)} 選了 ${P.SK[n].name}`) };
  P.rerollSub = (p, i, payWith) => {
    const S = P.S; if (!p.baby || !p.sub || !p.sub[i]) return { ok: 0, msg: '沒有這條天性魔法' }; const cost = payWith === 'bread' ? C.subBread[p.tier] : C.subGold[p.tier];
    if ((payWith === 'bread' ? S.bread : S.gold) < cost) return { ok: 0, msg: '不夠付' };
    if (payWith === 'bread') S.bread -= cost; else S.gold -= cost;
    p.subPity = (p.subPity || 0) + 1; const old = p.sub[i];
    if (p.subPity >= C.subPity) {   // P3 保底：3 選 1，每個都在上半段
      const have = p.sub.filter((x, j) => j !== i).map(x => x[0]); let pool = P.SUBS.filter(x => !have.includes(x.k)); const ch = [];
      while (ch.length < 3 && pool.length) { const s2 = wpick(pool, x => x.w); pool = pool.filter(x => x !== s2); ch.push(P.rollSubUpper(p, s2.k)) }
      p.subPity = 0; P.emit('skill', `${P.label(p)} 天性魔法保底：3 選 1（${ch.map(c => P.subText(c[0], c[1])).join('／')}）`);
      return { ok: 1, choose: ch, i };
    }
    p.sub[i] = P.rollSub(p, p.sub.filter((x, j) => j !== i).map(x => x[0]));
    P.emit('skill', `${P.label(p)} 洗天性魔法：${P.subName(old[0])}${old[1]} → ${P.subName(p.sub[i][0])}${p.sub[i][1]}`);
    return { ok: 1 };
  };

  // ---------- 產生動物 ----------
  P.makeAnimal = (o) => {
    const S = P.S;
    const p = Object.assign({
      id: S.nid++, sp: pick(P.SPECIES).id, tier: 0, baby: 0, pers: ri(0, 4), aff: 100, q: 1, g: 0,
      need: { f: 80, m: 80, c: 80 }, fav: { spot: pick(P.SPOTS), hero: ri(0, 2) }, battles: 0, lv: 1, xp: 0, sk: [], sub: [], name: '',
    }, o || {});
    if (!p.fav.hate) { const o2 = P.SPOTS.filter(x => x !== p.fav.spot); p.fav.hate = pick(o2) }
    if (p.look == null) p.look = Math.min(3, p.tier);
    if (p.star == null) p.star = P.wildStar();
    if (p.star === 2) P.emit('shiny', `✦ 出現星彩${P.SP[p.sp].name}！（${P.shinyName(p)}）`, { id: p.id });
    if (p.heir == null) { const pool = P.SKILLS.filter(s => s.tier <= 2 && s.cat !== 'spc' && s.n !== 41); p.heir = pick(pool).n }
    if (p.baby) { P.fillSkills(p); P.fillSubs(p) }
    return p;
  };
  P.codexSee = (sp, look, star) => { const id = P.indId(sp, look); P.S.codex[id] = (P.S.codex[id] || 0) + 1; if (star === 2) P.S.codexS[sp] = (P.S.codexS[sp] || 0) + 1 };
  P.addResident = (p, why) => {
    const S = P.S;
    if (p.baby) S.babies.push(p); else S.pets.push(p);
    if (!p.baby) { P.codexSee(p.sp, p.look, p.star); S.roster[P.indId(p.sp, p.look)] = { out: 0 } } else if (p.star === 2) P.codexSee(p.sp, p.look, 2);
    P.emit('join', `${P.label(p)}（${P.TIER_NAME[p.tier]}、${P.PERS[p.pers]}${p.star === 2 ? '、✦星彩' : ''}）${why}`, { id: p.id });
    return p;
  };
  // P3：住民上限 一館 5／二館 10／農場 20；育兒室 20（托兒所 +10）
  P.houseCap = () => { const S = P.S; if (C.houseOverride) return C.houseOverride; return C.houseStep[S.farm === 1 ? 2 : S.annex === 1 ? 1 : 0] };
  P.nurseryCap = () => C.nurseryCap + (P.S.fac && P.S.fac.nursery ? C.nurseryFarm : 0);
  // P4.4：育兒室滿了才出生的寶寶「等待入住」（p.wq）：不會不見、照樣能玩能餵能出門，只是不能當爸媽；育兒室一有空位就自動住進去
  P.nurseryUsed = () => P.S.babies.filter(p => !p.wq).length;
  P.waitingKids = () => P.S.babies.filter(p => p.wq);
  P.basketsOut = skip => P.S.cots.filter(c => c !== skip && c.basket).length;   // 已經出現、還沒出生的育兒籃（每個先留 1 個位子）
  P.nurseryFree = skip => P.nurseryCap() - P.nurseryUsed() - P.waitingKids().length - P.basketsOut(skip);
  P.settleWait = () => { const S = P.S; let moved = 0; for (const p of S.babies) { if (!p.wq) continue; if (P.nurseryUsed() >= P.nurseryCap()) break; delete p.wq; moved++; P.emit('birth', `${P.label(p)} 住進育兒室了（不用再等了）`, { id: p.id }) } return moved };
  P.canStay = p => { const S = P.S; if (!p) return '找不到'; if (P.out(p)) return '牠現在出門了，回來才能寄放'; if (S.cots.some(c => c.basket && (c.basket.a === p.id || c.basket.b === p.id))) return '牠的小屋門口有育兒籃，等寶寶出生再寄放'; return '' };
  P.deposit = p => { const S = P.S, why = P.canStay(p); if (why) return { ok: 0, msg: why };
    S.pets = S.pets.filter(x => x !== p); S.babies = S.babies.filter(x => x !== p); delete p.wq; p.stayAt = P.now(); S.stay.push(p);
    for (const c of S.cots) { if (c.a === p.id) c.a = 0; if (c.b === p.id) c.b = 0 } if (S.eq === p.id) S.eq = 'xishi';
    P.emit('stay', `${P.label(p)} 寄放在蜜糖媽媽那裡了`); P.settleWait(); return { ok: 1 } };
  P.retrieve = id => { const S = P.S, p = S.stay.find(x => x.id === id); if (!p) return { ok: 0, msg: '找不到' };
    if (p.baby ? P.nurseryUsed() + P.waitingKids().length >= P.nurseryCap() : S.pets.length >= P.houseCap()) return { ok: 0, msg: p.baby ? '育兒室沒有空位' : '住民滿了' };
    S.stay = S.stay.filter(x => x !== p); delete p.stayAt; (p.baby ? S.babies : S.pets).push(p); P.emit('stay', `${P.label(p)} 從蜜糖媽媽那裡接回來了`); return { ok: 1, p } };
  P.cotMax = () => C.cotMax + (P.S.annex === 1 ? C.annex.cots : 0);   // 收容所的小屋（農場小屋另外算，見 pet_furn.js）
  P.birthCap = () => P.S.farm === 1 && C.farmHut ? C.farmHut.birthCap : C.birthsPerDay;   // 有農場以後，全部小屋合計每天最多出生 3 隻
  P.houseFull = () => P.S.pets.length >= P.houseCap();

  // ---------- 幸運點與位階機率（2.11） ----------
  P.luck = detail => {
    const S = P.S, d = {};
    const res = S.pets.concat(S.babies);
    d.平均好感 = res.length ? Math.min(16, Math.round((res.reduce((a, p) => a + P.heart(p.aff), 0) / res.length - 1) * 4)) : 0;
    d.關卡進度 = C.progressPts;
    d.名聲 = Math.min(18, (P.repLv() - 1) * 2);
    d.圖鑑 = Math.min(10, Math.floor(Object.keys(S.codex).length / 40 * 10));
    d.連續照顧 = S.luck.streak >= 14 ? 6 : S.luck.streak >= 7 ? 3 : 0;
    let sum = 0; for (const k in d) sum += d[k];
    if (C.luckOverride >= 0) sum = C.luckOverride;
    return detail ? { d, sum } : sum;
  };
  P.tierOdds = L => {
    if (L == null) L = P.luck();
    const a = Math.max(C.tierBaseMin, C.tierBase - L * C.tierK), pu = C.tierPurpleBase + L * C.tierK, pk = Math.min(C.pinkMax, L * C.pinkK);
    return [a, Math.max(0, 100 - a - pu - pk), pu, pk];
  };
  P.present = id => { const S = P.S; return S.pets.some(p => P.indId(p.sp, p.look) === id) || S.wander.some(p => P.indId(p.sp, p.look) === id) || S.wait.some(p => P.indId(p.sp, p.look) === id) || (S.stay || []).some(p => P.indId(p.sp, p.look) === id) };
  P.spawnAnimal = (why) => {
    const S = P.S, odds = P.tierOdds(); const r = R() * 100; let t = 0, acc = 0; for (let i = 0; i < 4; i++) { acc += odds[i]; if (r < acc) { t = i; break } }
    P.emit('roll', `靈性擲骰 ${r.toFixed(1)} → ${P.TIER_NAME[t]}（機率 ${odds.map(x => x.toFixed(1)).join('/')}）`);
    for (let tt = t; tt >= 0; tt--) {
      const ok = P.SPECIES.filter(s => { const id = P.indId(s.id, tt), ro = S.roster[id]; return !P.present(id) && !(ro && ro.back > P.now()) });
      if (ok.length) { const sp = pick(ok).id; return P.makeAnimal({ sp, tier: tt, look: tt, aff: 50, why }) }
    }
    const g = ri(200, 600); S.gold += g; P.emit('roll', `名冊個體都在了，改送散步紀念品（金幣 ${g}）`); return null;
  };
  function wanderRoll() {
    const S = P.S, lv = P.repLv(); const ch = C.wanderOverride >= 0 ? C.wanderOverride : C.wanderChance[lv - 1]; const r = R() * 100;
    P.emit('roll', `投靠判定：擲 ${r.toFixed(1)} ／ 機率 ${ch}%（名聲 Lv${lv}）`);
    if (r >= ch) return;
    const a = P.spawnAnimal('投靠'); if (!a) return;
    if (P.houseFull()) S.askExp = S.askExp || P.now();
    if (S.wander.length < 3) { S.wander.push(a); P.emit('join', `${P.SP[a.sp].name}（${P.TIER_NAME[a.tier]}）在圍欄外徘徊`) }
    else if (S.wait.length < 10) { S.wait.push(a); P.emit('join', `${P.SP[a.sp].name} 進了候補名冊`) }
  }
  P.wanderRoll = wanderRoll;
  P.takeIn = (a, from) => {
    const S = P.S; if (P.houseFull()) return { ok: 0, msg: `住民滿了（${S.pets.length}/${P.houseCap()}）。${P.S.annex === 1 ? (P.S.farm === 1 ? '已經是最大了' : '可以在櫃檯成立農場（+10）') : '可以在櫃檯擴建二館（+5）'}` };
    S[from] = S[from].filter(x => x !== a); P.addResident(a, '被收留了'); return { ok: 1 };
  };
  P.adopt = sp => {
    const S = P.S; const n = S.adopted || 0, i = Math.min(3, n);
    if (P.houseFull()) return { ok: 0, msg: `住民滿了（${S.pets.length}/${P.houseCap()}）` };
    if (S.gold < C.adoptGold[i] || S.bread < C.adoptBread[i]) return { ok: 0, msg: `需要金幣 ${C.adoptGold[i]}、剩食麵包 ${C.adoptBread[i]}` };
    S.gold -= C.adoptGold[i]; S.bread -= C.adoptBread[i]; S.adopted = n + 1;
    const free = [0, 1, 2, 3].filter(l => !P.present(P.indId(sp, l)));
    const look = free.length ? free[0] : 0;
    const p = P.makeAnimal({ sp, tier: look, look, aff: 100 }); P.addResident(p, `被指定認養（第 ${n + 2} 隻）`); return { ok: 1, p };
  };

  // ---------- 救援任務（P2：救援只在任務裡發生，每個任務一次；不是常態玩法） ----------
  P.questInfo = q => {
    const S = P.S, st = S.quests[q.id] || {};
    if (st.done) return { state: 'done', why: '已完成' };
    const r = q.req || {};
    if (r.done && !(S.quests[r.done] || {}).done) return { state: 'locked', why: `先完成「${P.QU[r.done].name}」` };
    if (r.rep && P.repLv() < r.rep) return { state: 'locked', why: `名聲 Lv${r.rep} 才會發生` };
    return { state: 'open', why: '' };
  };
  // 籠子內容第一次接任務時就決定好並存起來（重打不會變）
  P.questCages = q => {
    const S = P.S, st = S.quests[q.id] = S.quests[q.id] || {};
    if (st.cages) return st.cages;
    let sps;
    if (q.cages === 'all') sps = P.SPECIES.map(s => s.id);
    else { const have = new Set(P.all().concat(S.wait, S.wander).map(p => p.sp)); let pool = P.SPECIES.map(s => s.id).filter(x => !have.has(x)); if (pool.length < q.cages) pool = P.SPECIES.map(s => s.id); sps = []; while (sps.length < q.cages) { const x = pick(pool); pool = pool.filter(y => y !== x); sps.push(x) } }
    st.cages = sps.map((sp, i) => {
      let tier = q.tier; if (tier < 0) { const o = P.tierOdds(), r = R() * 100; let a = 0; tier = 0; for (let j = 0; j < 4; j++) { a += o[j]; if (r < a) { tier = j; break } } }
      if (q.purple && i === 0) tier = Math.max(2, tier);
      let star = P.wildStar(); if (q.carrier && i === 0 && star < 1) star = 1; if (q.shinyOne && i === 0 && R() < 1 / q.shinyOne) star = 2;
      return { sp, tier, star };
    });
    return st.cages;
  };
  P.rescue = (sp, o) => { o = o || {}; const p = P.makeAnimal({ sp, tier: o.tier || 0, look: o.tier || 0, star: o.star, aff: 150, rescued: o.quest || 'r1' }); P.S.wait.push(p); P.codexSee(p.sp, p.look, p.star); P.S.roster[P.indId(p.sp, p.look)] = { out: 0 }; P.emit('join', `${P.SP[sp].name}${p.star === 2 ? '（✦星彩）' : ''} 從籠子裡被救出來（先住馬廄／候補名冊）`, { id: p.id }); return p };
  P.questDone = id => { const S = P.S, st = S.quests[id] = S.quests[id] || {}; if (st.done) return; st.done = 1; st.at = P.now(); P.addRep(20, '完成救援任務'); if (P.QU[id].stone) S.stone = (S.stone || 0) + P.QU[id].stone; P.emit('story', `救援任務「${P.QU[id].name}」完成`); if (id === 'r1') P.finishRescue() };
  P.finishRescue = () => { const S = P.S; S.quests.r1 = Object.assign(S.quests.r1 || {}, { done: 1 }); if (S.unlock) return; S.unlock = 1; P.emit('story', '大家搬進總匯總部後院的蜜糖之家了！蜜糖媽媽要送你 1 隻小動物') };
  P.giveGift = sp => {
    const S = P.S; if (S.gift0) return null; S.gift0 = 1;
    sp = sp || pick(P.SPECIES).id;
    const g = P.makeAnimal({ sp, tier: 1, look: 1, aff: 250, baby: 1, bornDay: P.dayKey(P.now()) - 1, gift: 1 });
    P.addResident(g, '是蜜糖媽媽送你的（藍色寶寶，♡3）'); if (S.eq === 'xishi') S.eq = g.id; return g;
  };

  // ---------- 小屋與育兒籃（P2：寵物沒有性別；同物種兩隻住一起就有機會出現育兒籃） ----------
  P.family = (a, b) => (a.par && a.par.includes(b.id)) || (b.par && b.par.includes(a.id)) || (a.litter && a.litter === b.litter);
  P.cotSync = c => { const a = P.byId(c.a), b = P.byId(c.b); if (!a || !b) return 1; let s = 50; if (a.pers === b.pers) s += 10; const pr = [a.pers, b.pers].sort().join(); if (['0,4', '1,3', '0,2'].includes(pr)) s += 20; if (P.heart(a.aff) >= 5 && P.heart(b.aff) >= 5) s += 10; s += 5 * (c.deco || 0); return s >= 90 ? 3 : s >= 70 ? 2 : 1 };
  P.cotCheck = c => {
    const a = P.byId(c.a), b = P.byId(c.b); if (!a || !b) return '小屋還沒住滿 2 隻';
    if (a.sp !== b.sp) return '要同物種';
    if (P.heart(a.aff) < 3 || P.heart(b.aff) < 3) return '兩隻都要 ♡3 以上';
    if (!P.canBreedAge(a) || !P.canBreedAge(b)) return '寶寶要出生滿 3 天';
    if (P.family(a, b)) return '牠們是一家人啦';
    if (c.basket) return '小屋裡已經有育兒籃了'; if (c.cool && c.cool > P.now()) return '育兒籃剛送來，小屋休息一天';
    if (a.wq || b.wq) return '等待入住的孩子還不能當爸媽';
    if (!c.basket && P.nurseryFree(c) < 1) return '育兒室沒有空位留給寶寶';
    if (!c.basket && P.S.farm === 1 && P.S.pets.length >= P.houseCap()) return `農場住滿 ${P.houseCap()} 隻了，先空出 1 個位子給寶寶`;   // P4.4：先留好寶寶的位子才擲育兒籃
    return '';
  };
  P.pregChance = c => {
    const a = P.byId(c.a), b = P.byId(c.b); if (!a || !b) return { p: 0, d: {} };
    const d = {}; d.基本 = C.pregBase;
    d.好感 = Math.min(20, [a, b].reduce((s, p) => s + (P.heart(p.aff) >= 5 ? 10 : P.heart(p.aff) >= 4 ? 5 : 0), 0));
    d.同住天數 = Math.min(16, 4 * Math.max(0, P.dayKey(P.now()) - P.dayKey(c.since)));
    const sy = P.cotSync(c); d.默契 = sy === 3 ? 10 : sy === 2 ? 5 : 0;
    d.一起玩 = Math.min(15, 5 * ((c.play && c.play.k === P.dayKey(P.now()) - 1) ? c.play.n : (c.play && c.play.k === P.dayKey(P.now()) ? c.play.n : 0)));
    let s = 0; for (const k in d) s += d[k];
    const mul = C.pregTierMul[Math.max(a.tier, b.tier)];
    return { p: Math.min(C.pregCap, s * mul), d, mul };
  };
  P.cotPlay = c => { const k = P.dayKey(P.now()); if (!c.play || c.play.k !== k) c.play = { k, n: 0 }; if (c.play.n >= 3 && !C.capOff) return { ok: 0, msg: '今天已經一起玩 3 次了' }; c.play.n++; for (const id of [c.a, c.b]) { const p = P.byId(id); if (p) P.gainAff(p, 3, '在小屋一起玩') } return { ok: 1 } };
  function pregRoll(c, k) {
    const why = P.cotCheck(c); if (why) { P.emit('preg', `小屋 ${P.S.cots.indexOf(c) + 1}：不擲育兒籃（${why}）`); return }
    const S = P.S; if (S.births.day === k && S.births.n >= P.birthCap()) { P.emit('preg', `小屋 ${S.cots.indexOf(c) + 1}：今天已經出生 ${S.births.n} 隻（每天最多 ${P.birthCap()} 隻），明天再擲`); return }
    const ch = P.pregChance(c), r = R() * 100;
    P.emit('preg', `小屋 ${S.cots.indexOf(c) + 1} 育兒籃判定：擲 ${r.toFixed(1)} ／ ${ch.p.toFixed(1)}%（${Object.entries(ch.d).map(([k, v]) => k + v).join('、')}，×${ch.mul}）→ ${r < ch.p ? '出現育兒籃！' : '沒有'}`);
    if (r < ch.p) { c.basket = { since: P.dayStart(k), a: c.a, b: c.b, sync: P.cotSync(c), stone: c.stone ? 1 : 0, pollen: c.pollen ? 1 : 0, mutKind: c.mutKind || null }; c.stone = 0; c.pollen = 0; c.mutKind = null; P.emit('preg', `小屋 ${S.cots.indexOf(c) + 1} 門口出現了育兒籃！`) }
  }
  P.pregRoll = pregRoll;
  P.placeStone = c => { const S = P.S; if (c.stone) { c.stone = 0; S.stone++; return { ok: 1, msg: '把幸運石收回來了' } } if (!S.stone) return { ok: 0, msg: '沒有幸運石' }; S.stone--; c.stone = 1; return { ok: 1, msg: '幸運石放進小屋了' } };
  // 遺傳（P2）
  const giveStar = p => p.star === 2 ? 1 : p.star === 1 ? (R() < 0.5 ? 1 : 0) : 0;
  P.starOdds = (a, b, stone) => { // 企劃與測試用：寶寶是星彩的機率
    const pa = a.star === 2 ? 1 : a.star === 1 ? 0.5 : 0, pb = b.star === 2 ? 1 : b.star === 1 ? 0.5 : 0, m = P.shinyRate() * (stone ? C.stoneMul : 1);
    const both = pa * pb; return { shiny: both + (1 - both) * m, carrier: pa * (1 - pb) + pb * (1 - pa) };
  };
  // ===== 遺傳：唯一的入口（P3） =====
  // P.inherit(a, b, ctx) → { baby: 寶寶的欄位, info: 紀錄用 }
  // 遺傳學企劃（design/pet_genetics_zh.md）定案後，只要換掉這一個函式；其他地方都不用動。
  // 目前內容＝P2 規則原封不動：位階、性格、資質血統、星痕、家傳技；P3 只多記「祖父母」與能力方向。
  P.inherit = (f, m, ctx) => {
    const { sync, g0, k, litter } = ctx;
    let [bl, pu, pk] = C.birthTier[sync - 1];
    for (const p of [f, m]) { if (p.tier === 2) pu += 3; if (p.tier >= 3) { pu += 3; pk += 1 } }
    pu += C.pedigreePurple * Math.min(C.pedigreeCap, g0);
    pk += Math.min(5, P.luck() * 0.1); pk = Math.min(C.pinkMaxBirth, pk); bl = 100 - pu - pk;
    const tr = R() * 100, tier = tr < bl ? 1 : tr < bl + pu ? 2 : 3;
    const pers = R() * 100 < C.persInherit ? pick([f, m]).pers : ri(0, 4);
    const qb = C.qualBase.slice(); const h5 = [f, m].filter(p => P.heart(p.aff) >= 5).length; qb[0] -= 5 * h5; qb[2] += 5 * h5;
    const rollQ = () => { let qr = R() * 100; for (let j = 0; j < 4; j++) { if (qr < qb[j]) return j; qr -= qb[j] } return 3 };
    let q = rollQ(); const blood = (f.q || 0) >= 2 && (m.q || 0) >= 2; if (blood) q = Math.max(q, rollQ());
    const sm = ctx.stone ? C.stoneMul : 1;   // 月光露（突變）改在 pet_gen.js
    let star = giveStar(f) + giveStar(m), mut = 0; if (star < 2 && R() < P.shinyRate() * sm) { star = 2; mut = 1 }
    const sameHeir = f.heir && f.heir === m.heir;
    const heir = R() * 100 < C.heirLine ? pick([f, m]).heir : undefined;
    const gp = [].concat(f.par || [0, 0], m.par || [0, 0]).slice(0, 4);   // 祖父母：[爸爸那邊 2 位, 媽媽那邊 2 位]（寵物沒有性別，只是排列順序）
    const baby = { sp: f.sp, tier, look: tier, baby: 1, pers, q, star, heir, g: g0 + 1, aff: 0, bornDay: k, par: [f.id, m.id], gp, litter, sk: [] };
    // 能力方向：50% 沿用其中一位家長的方向（還沒有遺傳學企劃，先用這個簡單規則）
    const pd = pick([f, m]).dir; if (pd && R() < 0.5) baby.dir = pd.slice();
    if (R() * 100 < (sameHeir ? C.heirBoth : C.heirChance)) { const hs = sameHeir ? f.heir : pick([f, m]).heir; if (P.SK[hs] && P.SK[hs].tier <= tier) baby.sk = [hs] }
    return { baby, info: { tier, tr, blood, star, mut } };
  };
  function birth(c, k) {
    const S = P.S, bk = c.basket; c.basket = null; c.cool = P.dayStart(k + 1);
    const f = P.byId(bk.a) || P.byId(c.a), m = P.byId(bk.b) || P.byId(c.b) || f; if (!f) return [];
    const sync = bk.sync || 1;
    if (S.births.day !== k) S.births = { day: k, n: 0 };
    const top = Math.max(f.tier, m.tier); const L = top >= 3 ? C.litter.high : top === 2 ? C.litter.purple : C.litter.low;
    const r = R() * 100; const n = r < L[0] ? 1 : r < L[0] + L[1] ? 2 : 3;
    const litter = 'l' + S.nid; const out = [];
    const g0 = Math.max(f.g || 0, m.g || 0);
    for (let i = 0; i < n; i++) {
      const I = P.inherit(f, m, { sync, g0, stone: bk.stone, pollen: bk.pollen, k, litter });
      const { tier, tr, blood, star, mut } = I.info; const baby = I.baby;
      const b = P.makeAnimal(baby); if (P.nurseryUsed() >= P.nurseryCap()) b.wq = 1; S.babies.push(b); S.births.n++; out.push(b); if (P.famRec) { P.famRec(f); P.famRec(m); P.famRec(b) }
      if (star === 2) P.codexSee(b.sp, b.look, 2);
      P.emit('birth', `寶寶出生！${P.SP[b.sp].name}（${P.TIER_NAME[b.tier]}、資質 ${P.QUAL[b.q]}${blood ? '（血統）' : ''}、第 ${b.g + 1} 代${star === 2 ? '、✦星彩' + (mut ? '（突變）' : '') : star === 1 ? '、帶星痕' : ''}${baby.sk.length ? '、繼承家傳技 ' + P.SK[baby.sk[0]].name : ''}）靈性擲 ${tr.toFixed(1)}`, { id: b.id });
    }
    P.addRep(5 * out.length, '寶寶出生');
    const wq = out.filter(b => b.wq); if (wq.length) P.emit('wq', `蜜糖媽媽：「育兒室住滿了，${wq.map(P.label).join('、')} 先在育兒室門口『等待入住』。別擔心，孩子不會不見，照樣可以陪牠玩、餵牠、帶牠出門；只是還不能當爸媽。到櫃檯看看怎麼空出位子吧。」`, { ids: wq.map(b => b.id) });
    return out;
  }
  P.birth = birth;
  P.buildCot = () => { const S = P.S, i = S.cots.filter(c => !c.farm).length; if (i >= P.cotMax()) return { ok: 0, msg: P.S.annex === 1 ? '小屋已經蓋滿了' : '一館最多 3 間小屋；蓋好二館可以再蓋 2 間' }; const [g, b, sh] = C.cotCost[i]; if (S.gold < g || S.bread < b || S.shards < sh) return { ok: 0, msg: `需要金幣 ${g}、麵包 ${b}、刻印碎片 ${sh}` }; S.gold -= g; S.bread -= b; S.shards -= sh; S.cots.splice(i, 0, { a: 0, b: 0, since: P.now() }); P.emit('cot', `蓋好小屋 ${i + 1}`); return { ok: 1 } };
  P.setCot = (c, a, b) => { c.a = a; c.b = b; c.since = P.now(); c.play = null; P.emit('cot', `小屋 ${P.S.cots.indexOf(c) + 1} 住進：${[a, b].map(i => P.byId(i) ? P.label(P.byId(i)) : '空').join(' ＋ ')}`) };

  // ---------- 放他出去闖闖、升階 ----------
  P.sendOff = p => {
    const S = P.S; S.sent = { p: JSON.parse(JSON.stringify(p)), t: P.now(), baby: !!p.baby };
    if (p.baby) { S.babies = S.babies.filter(x => x !== p); const L = ['', 'b', 'p', 'k', 'k'][p.tier]; if (L) S.letters[L]++; P.emit('send', `${P.label(p)} 背著小包袱出門闖闖了，得到${P.TIER_NAME[p.tier]}幸福信`) }
    else { S.pets = S.pets.filter(x => x !== p); S.roster[P.indId(p.sp, p.look)] = { out: 1, back: P.now() + 3 * D }; P.emit('send', `${P.label(p)} 出門闖闖了（3 天後可能再相遇）`) }
    for (const c of S.cots) { if (c.a === p.id) c.a = 0; if (c.b === p.id) c.b = 0 }
    if (S.eq === p.id) S.eq = 'xishi';
    P.addRep(5, '放他出去闖闖'); P.settleWait(); return { ok: 1 };
  };
  P.callBack = () => {
    const S = P.S, s = S.sent; if (!s || P.now() - s.t > 10e3) return { ok: 0, msg: '已經走遠了' };
    if (s.baby) { S.babies.push(s.p); const L = ['', 'b', 'p', 'k', 'k'][s.p.tier]; if (L) S.letters[L]-- } else { S.pets.push(s.p); delete S.roster[P.indId(s.p.sp, s.p.look)] }
    S.rep -= 5; S.sent = null; P.emit('send', `${P.label(s.p)} 被叫回來了`); return { ok: 1 };
  };
  P.upInfo = p => { const u = C.up[p.tier]; if (!p.baby || !u) return null; return u };
  P.upgrade = p => {
    const S = P.S, u = P.upInfo(p); if (!u) return { ok: 0, msg: '靈性暫時無法再提升' };
    const L = ['', 'b', 'p', 'k'][p.tier];
    const lack = []; if (p.lv < u.lv) lack.push('等級 ' + u.lv); if (P.heart(p.aff) < u.heart) lack.push('♡' + u.heart);
    if (S.letters[L] < u.letter) lack.push(`${P.TIER_NAME[p.tier]}幸福信 ×${u.letter}`); if (S.gold < u.gold) lack.push('金幣'); if (S.bread < u.bread) lack.push('剩食麵包');
    if (u.shard && S.shards < u.shard) lack.push('刻印碎片 ' + u.shard); if (u.collar && S.collar < u.collar) lack.push('金色項圈');
    if (lack.length) return { ok: 0, msg: '還差：' + lack.join('、') };
    S.gold -= u.gold; S.bread -= u.bread;
    let ok = R() * 100 < u.rate, forced = 0;
    if (p.tier === 1) { S.upPity[1] = (S.upPity[1] || 0) + 1; if (S.upPity[1] >= u.pity) { ok = true; forced = 1 } }
    if (p.tier === 2 && S.frag.star >= 35) { ok = true; forced = 1 } if (p.tier === 3 && S.frag.dusk >= 60) { ok = true; forced = 1 }
    if (ok) {
      S.letters[L] -= u.letter; if (u.shard) S.shards -= u.shard; if (u.collar) S.collar -= u.collar;
      if (p.tier === 1) S.upPity[1] = 0; if (p.tier === 2 && forced) S.frag.star -= 35; if (p.tier === 3 && forced) S.frag.dusk -= 60;
      p.tier++; p.look = Math.min(3, p.tier); P.fillSkills(p); P.fillSubs(p);
      P.emit('up', `${P.label(p)} 靈性提升 → ${P.TIER_NAME[p.tier]}${forced ? '（保底）' : ''}`); return { ok: 1, up: 1 };
    }
    if (p.tier === 1) S.gold += Math.floor(u.gold / 2);
    if (p.tier === 2) { S.letters[L] -= 1; S.frag.star += 7 } if (p.tier === 3) { S.letters[L] -= 1; S.frag.dusk += 10 }
    if (p.tier === 2 && u.shard) S.shards -= u.shard; if (p.tier === 3 && u.shard) S.shards -= u.shard;
    P.emit('up', `${P.label(p)} 這次靈性沒有提升（成功率 ${u.rate}%）`); return { ok: 1, up: 0 };
  };

  // ---------- 出戰結算 ----------
  P.fightEnd = r => {
    const S = P.S; S.gold += r.gold || 0;
    for (const p of P.all()) if (P.unlocked(p)) { const c = P.counts(p); c.fight = (c.fight || 0) + 1; if (c.fight <= 10 || C.capOff) p.aff = Math.min(1000, p.aff + C.affGain.fight) }
    P.emit('fight', `出戰結束：金幣 +${r.gold || 0}、剩食麵包 +${r.bread || 0}、擊倒 ${r.kills}；全部寵物好感 +${C.affGain.fight}`);
    const p = P.byId(S.eq); if (p) {
      p.battles = (p.battles || 0) + 1; const cap = C.lvCap[p.tier];
      p.xp = (p.xp || 0) + (r.kills || 0) * C.xpPerKill;
      while (p.xp >= C.xpNeed * p.lv && p.lv < cap) { p.xp -= C.xpNeed * p.lv; p.lv++; P.emit('fight', `${P.label(p)} 升到 Lv${p.lv}`) }
      if (p.lv >= cap) p.xp = 0;
    }
  };
  // 每日寵物額外糧食（5.9.2）
  P.extraFoodOk = n => { const S = P.S, k = P.dayKey(P.now()); if (S.extra.day !== k) S.extra = { day: k, bread: 0, shard: 0 }; if (S.extra.bread >= C.petFoodDaySoft) n = R() < 0.5 ? Math.floor(n / 2) : Math.ceil(n / 2); S.extra.bread += n; return n };

  // 開收容所（重逢判定）
  P.open = () => {
    const S = P.S, gap = P.now() - (S.lastSeen || P.now());
    P.advance();
    if (gap > 20 * H && P.all().length && S.reunionDay !== P.dayKey(P.now())) { S.reunionDay = P.dayKey(P.now()); for (const p of P.all()) P.gainAff(p, C.affGain.reunion, '重逢') ; P.emit('care', `超過 ${(gap / H).toFixed(0)} 小時沒來，大家衝過來迎接！`) }
  };
})(window.PET);
