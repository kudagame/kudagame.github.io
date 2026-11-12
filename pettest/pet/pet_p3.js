// P3：寵物能力、體型、天性魔法顯示、放他出去闖闖＋明信片、擴建（二館／農場）、農場設施、訓練營、探險隊、大會、獎章、家譜（正式版也會用）
'use strict';
(function (P) {
  const C = P.CFG, H = 3600e3, D = 86400e3;
  const R = () => P.rand(), ri = P.ri, pick = P.pick;
  const r1 = v => Math.round(v * 10) / 10;

  // ---------- 存檔轉換（P2c → P3） ----------
  const mig0 = P.migrate;
  P.migrate = S => {
    mig0(S);
    if (S.annex == null) S.annex = 0; if (S.farm == null) S.farm = 0;
    S.fac = S.fac || {}; S.mat = Object.assign({ feather: 0, dew: 0, fruit: 0, wish: 0, pollen: 0, rainbow: 0, crown: 0, proof: 0 }, S.mat || {});
    S.seen = S.seen || {}; S.mail = S.mail || { q: [], st: {} }; S.mail.q = S.mail.q || []; S.mail.st = S.mail.st || {};
    S.relPity = S.relPity || { orange: 0 }; S.tales = S.tales || []; S.fam = S.fam || {};
    S.exp = S.exp || { teams: [], streak: 0, chest: { day: -1, n: 0 }, log: [], nid: 1 };
    S.cup = S.cup || { day: -1, n: 0, log: [] }; S.looks = S.looks || []; S.follow = S.follow || [];
    S.garden = S.garden || [null, null, null]; S.daily3 = S.daily3 || {};
    S.v3 = 1;
    [].concat(S.pets, S.babies, S.wander, S.wait).forEach(p => p && P.abInit(p));
  };
  const ns0 = P.newState;
  P.newState = () => Object.assign(ns0(), { annex: 0, farm: 0, fac: {}, mat: { feather: 0, dew: 0, fruit: 0, wish: 0, pollen: 0, rainbow: 0, crown: 0, proof: 0 }, seen: {}, mail: { q: [], st: {} }, relPity: { orange: 0 }, tales: [], fam: {}, exp: { teams: [], streak: 0, chest: { day: -1, n: 0 }, log: [], nid: 1 }, cup: { day: -1, n: 0, log: [] }, looks: [], follow: [], garden: [null, null, null], daily3: {}, v3: 1 });

  // ---------- 只顯示「拿到過」的東西 ----------
  // key：gold bread snackMat disk shards collar stone letterB letterP letterK star dusk feather dew fruit wish pollen crown
  P.amount = k => { const S = P.S; return { letterB: S.letters.b, letterP: S.letters.p, letterK: S.letters.k, star: S.frag.star, dusk: S.frag.dusk }[k] ?? (S.mat && k in S.mat ? S.mat[k] : S[k]) ?? 0 };
  P.seen = k => { const S = P.S; if (!S.seen) S.seen = {}; if (!S.seen[k] && P.amount(k) > 0) S.seen[k] = 1; return !!S.seen[k] };
  P.MATS = {
    feather: { name: '風向羽毛', icon: '🪶', txt: '換寵物能力的成長方向' },
    dew: { name: '洗練露水', icon: '💧', txt: '免費洗 1 次天性魔法（也算保底次數）' },
    fruit: { name: '成長果實', icon: '🍑', txt: '寵物能力挑 1 項永久 +2' },
    wish: { name: '心願星砂', icon: '🌠', txt: '天性魔法保底進度 +3' },
    pollen: { name: '月光露', icon: '🌕', txt: '放進小屋：下一個育兒籃突變機率 ×4，而且至少 1 隻會突變' },
    rainbow: { name: '彩虹月光露', icon: '🌈', txt: '跟月光露一樣，而且可以自己選要哪一種突變（非常稀有）' },
    proof: { name: '傳說之證', icon: '📜', txt: '傳說大會冠軍的證明；集滿 3 張可以跟小貓頭鷹換 1 瓶彩虹月光露' },
    crown: { name: '王國勳果', icon: '🏵️', txt: '寵物能力 5 項都永久 +3' },
  };

  // ---------- 寵物能力 ----------
  const AK = P.ABIL.map(a => a.k);
  P.abInit = p => {
    if (!p.dir) { const fav = P.ABIL_SP[p.sp] || ['str', 'agi']; const m = R() < 0.6 ? fav[0] : pick(AK); let s2 = R() < 0.5 ? fav[1] : pick(AK); if (s2 === m) s2 = AK.find(k => k !== m); p.dir = [m, s2] }
    p.tr = p.tr || {}; p.perm = p.perm || {}; p.medals = p.medals || []; if (p.rank == null) p.rank = 0; p.wins = p.wins || { v: 0, s: 0, k: 0, l: 0 };
    if (p.fat == null) { p.fat = 0; p.fatT = P.now() }
    return p;
  };
  P.abGrow = p => { let g = (Math.max(1, p.lv || 1) - 1) * C.ablLv; for (let t = 1; t <= p.tier; t++) g += C.ablTier[t]; return g * C.ablQual[p.q == null ? 1 : p.q] * (p.star === 2 ? C.shinyMul : 1) };
  P.abW = (p, k) => { P.abInit(p); const [m, s] = p.dir; return k === m ? C.ablDirW[0] : k === s ? C.ablDirW[1] : (1 - C.ablDirW[0] - C.ablDirW[1]) / 3 };
  P.abil = p => {
    P.abInit(p); const g = P.abGrow(p), fav = P.ABIL_SP[p.sp] || [], o = {}; let tot = 0;
    for (const k of AK) { const v = C.ablBase[p.tier] + (fav.includes(k) ? C.ablSpBonus : 0) + g * P.abW(p, k) + (p.tr[k] || 0) + (p.perm[k] || 0); o[k] = v; tot += v }
    o.total = tot; return o;
  };
  P.abShow = v => Math.floor(v);
  // 主人分到的：寵物能力 × 10% → 每點的效果（有上限）
  P.abOwner = p => { const a = P.abil(p), o = {}; for (const A of P.ABIL) { const pts = a[A.k] * C.ablOwnerShare / 100; o[A.owner.k] = { pts, v: Math.min(A.owner.cap, r1(pts * A.owner.per)), cap: A.owner.cap, txt: A.owner.txt } } return o };
  P.abPet = p => { const a = P.abil(p), o = {}; for (const A of P.ABIL) if (A.pet.per) o[A.pet.k] = { v: Math.min(A.pet.cap, r1(a[A.k] * A.pet.per)), cap: A.pet.cap, txt: A.pet.txt }; return o };
  P.size = p => P.SIZE_INFO[P.SIZE[p.sp] || 'm'];
  P.changeDir = (p, dir) => {
    const S = P.S; if ((S.mat.feather || 0) < C.featherCost) return { ok: 0, msg: '沒有風向羽毛' };
    if (!dir || dir[0] === dir[1] || !AK.includes(dir[0]) || !AK.includes(dir[1])) return { ok: 0, msg: '主項和次項要不一樣' };
    S.mat.feather -= C.featherCost; p.dir = dir.slice(); P.emit('abil', `${P.label(p)} 換了成長方向：主 ${P.abName(dir[0])}、次 ${P.abName(dir[1])}`); return { ok: 1 };
  };
  P.abName = k => (P.ABIL.find(a => a.k === k) || {}).name || k;
  P.useFruit = (p, k) => { const S = P.S; if (!S.mat.fruit) return { ok: 0, msg: '沒有成長果實' }; if ((p.perm[k] || 0) >= 30) return { ok: 0, msg: '這一項的果實已經吃到上限（+30）' }; S.mat.fruit--; p.perm[k] = (p.perm[k] || 0) + 2; P.emit('abil', `${P.label(p)} 吃了成長果實：${P.abName(k)} +2`); return { ok: 1 } };
  P.useCrown = p => { const S = P.S; if (!S.mat.crown) return { ok: 0, msg: '沒有王國勳果' }; S.mat.crown--; for (const k of AK) p.perm[k] = (p.perm[k] || 0) + 3; P.emit('abil', `${P.label(p)} 吃了王國勳果：5 項能力都 +3`); return { ok: 1 } };
  P.useWish = p => { const S = P.S; if (!S.mat.wish) return { ok: 0, msg: '沒有心願星砂' }; if (!p.baby || !(p.sub || []).length) return { ok: 0, msg: '只有寶寶有天性魔法' }; S.mat.wish--; p.subPity = Math.min(C.subPity - 1, (p.subPity || 0) + 3); P.emit('abil', `${P.label(p)} 天性魔法保底 → ${p.subPity}/${C.subPity}`); return { ok: 1 } };
  // 洗天性魔法：露水付款
  const rs0 = P.rerollSub;
  P.rerollSub = (p, i, payWith) => {
    if (payWith !== 'dew') return rs0(p, i, payWith);
    const S = P.S; if (!S.mat.dew) return { ok: 0, msg: '沒有洗練露水' };
    S.mat.dew--; const g0 = S.gold; S.gold += C.subGold[p.tier]; const r = rs0(p, i, 'gold'); if (!r.ok) { S.mat.dew++; S.gold = g0 } return r;
  };

  // ---------- 家譜 ----------
  P.famRec = p => { const S = P.S; if (!p) return; S.fam[p.id] = { id: p.id, sp: p.sp, tier: p.tier, look: p.look, star: p.star, name: p.name || '', baby: p.baby ? 1 : 0, par: p.par || null, gp: p.gp || null, md: (p.medals || []).length, top: (p.medals || []).filter(m => m.pl === 1).slice(-3).map(m => m.name) } };
  P.famOf = id => { const p = P.byId(id); if (p) { P.famRec(p); return P.S.fam[id] } return P.S.fam[id] || null };

  // ---------- 放他出去闖闖：強度、獎勵、明信片 ----------
  P.relScore = p => {
    const d = {};
    d.靈性 = [0, 8, 20, 32, 45][p.tier] || 0;
    d.資質 = [0, 3, 6, 10][p.q == null ? 1 : p.q];
    d.星彩 = p.star === 2 ? 10 : p.star === 1 ? 2 : 0;
    d.技能 = Math.min(9, (p.sk || []).length * 3);
    d.天性魔法 = Math.min(15, (p.sub || []).reduce((a, [k, v]) => { const s = P.SUBS.find(x => x.k === k); if (!s) return a; const [lo, hi] = s.r[Math.max(1, p.tier) - 1]; return a + 2 + 3 * (hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 1) }, 0));
    d.能力 = Math.min(15, Math.floor(P.abil(p).total / 20));
    let s = 0; for (const k in d) s += d[k]; return { s: Math.min(100, Math.round(s)), d };
  };
  P.relOdds = s => C.relBase.map((b, i) => b + (C.relMax[i] - b) * Math.min(100, s) / 100);
  const RW = [
    () => ({ gold: ri(2000, 5000), bread: ri(3, 6), snackMat: ri(1, 2) }),
    () => Object.assign({ gold: ri(6000, 12000), bread: ri(8, 15) }, pick([{ dew: 1 }, { feather: 1 }, { fruit: 1 }, { disk: 1 }])),
    () => { const o = { gold: ri(20000, 40000), shards: ri(5, 10) }; const ex = [{ dew: 2 }, { feather: 1 }, { fruit: 2 }, { wish: 1 }].sort(() => R() - 0.5).slice(0, 2); ex.forEach(e => Object.assign(o, e)); return o },
    () => ({ gold: ri(60000, 100000), shards: ri(15, 25), wish: 2, fruit: 3, star: 5, gear: R() < 0.5 ? 4 : 0 }),
  ];
  P.relRoll = p => {
    const S = P.S, sc = P.relScore(p).s, od = P.relOdds(sc); let g = 0, r = R() * 100, a = 0; for (let i = 0; i < 4; i++) { a += od[i]; if (r < a) { g = i; break } }
    let forced = 0;
    if (p.tier >= 4) { if (g === 3) S.relPity.orange = 0; else { S.relPity.orange = (S.relPity.orange || 0) + 1; if (S.relPity.orange >= C.relOrangePity) { g = 3; forced = 1; S.relPity.orange = 0 } } }
    return { g, forced, sc, rw: RW[g]() };
  };
  const ENDINGS = ['在海邊小鎮住下了，每天看船回港', '找到伴了，兩個一起在山腳下蓋了小窩', '跟著商隊去更遠的地方了', '被麵包店的老奶奶收留，天天在門口曬太陽', '在山上的牧場當起看門的小幫手', '跟著旅行劇團四處表演，聽說很受歡迎', '在燈塔陪守塔人看星星', '在花田旁邊的小村子當起大家的開心果'];
  const PLACES = ['海邊的小鎮', '開滿花的山坡', '熱鬧的市集', '下雪的山谷', '有風車的村子', '大河邊的渡口', '森林裡的小木屋', '古老的石橋'];
  const snap = p => ({ id: p.id, sp: p.sp, tier: p.tier, look: p.look, star: p.star, name: p.name || '', baby: p.baby ? 1 : 0 });
  function queueMail(p, baby) {
    const S = P.S, t = P.now(), roll = P.relRoll(p), mid = 'm' + (S.mail.nid = (S.mail.nid || 0) + 1);
    const two = R() * 100 < C.post2Chance, end = pick(ENDINGS);
    const at1 = baby ? t + 12e3 : t + ri(C.postDay[0] * 24, C.postDay[1] * 24) * H;
    const rw1 = Object.assign({}, roll.rw); if (baby) { const L = ['', 'b', 'p', 'k', 'k'][p.tier]; if (L) rw1['letter' + L.toUpperCase()] = 1 }
    S.mail.q.push({ mid, n: 1, at: at1, pet: snap(p), g: roll.g, forced: roll.forced, rw: rw1, last: !two, end: two ? null : end, place: pick(PLACES), baby: baby ? 1 : 0 });
    if (two) { const r2 = RW[0](); for (const k in r2) r2[k] = Math.max(1, Math.floor(r2[k] / 2)); S.mail.q.push({ mid, n: 2, at: at1 + ri(C.post2Day[0] * 24, C.post2Day[1] * 24) * H, pet: snap(p), g: 0, rw: r2, last: true, end, place: pick(PLACES) }) }
    P.emit('send', `${P.label(p)} 的闖闖獎勵：${C.relGrade[roll.g]}${roll.forced ? '（橘寵保底）' : ''}（強度 ${roll.sc}；機率 ${P.relOdds(roll.sc).map(x => x.toFixed(1)).join('/')}）；明信片 ${two ? 2 : 1} 封`);
    return mid;
  }
  const so0 = P.sendOff, cb0 = P.callBack;
  P.sendOff = p => {
    const S = P.S, baby = !!p.baby, pity0 = S.relPity.orange;
    P.famRec(p);
    // 寶寶的幸福信改成跟明信片一起寄來
    const L = ['', 'b', 'p', 'k', 'k'][p.tier];
    const r = so0(p); if (baby && L) S.letters[L]--;
    const mid = queueMail(p, baby); S.sent.mid = mid; S.sent.pity0 = pity0;
    return r;
  };
  P.callBack = () => {
    const S = P.S, s = S.sent; if (!s || P.now() - s.t > 10e3) return { ok: 0, msg: '已經走遠了' };
    const L = s.baby ? ['', 'b', 'p', 'k', 'k'][s.p.tier] : ''; if (L) S.letters[L]++;   // P2 的 callBack 會扣回幸福信；P3 幸福信還沒寄到，先補回來
    S.mail.q = S.mail.q.filter(m => m.mid !== s.mid); for (const k in S.mail.st) S.mail.st[k].cards = S.mail.st[k].cards.filter(m => m.mid !== s.mid);
    if (s.pity0 != null) S.relPity.orange = s.pity0;
    return cb0();
  };
  P.releaseWander = a => { const S = P.S; S.wander = S.wander.filter(q => q !== a); S.wait = S.wait.filter(q => q !== a); S.roster[P.indId(a.sp, a.look)] = { out: 1, back: P.now() + 3 * D }; P.abInit(a); queueMail(a, 0); P.addRep(5, '放他出去闖闖') };
  // 郵差：到時間的明信片放進「當天那一疊」，一天最多 10 張；多的變成材料放進同一疊
  function mailTick(t) {
    const S = P.S; if (!S.mail) return; const due = S.mail.q.filter(m => m.at <= t); if (!due.length) return;
    S.mail.q = S.mail.q.filter(m => m.at > t);
    for (const m of due.sort((a, b) => a.at - b.at)) {
      const k = P.dayKey(m.at); const st = S.mail.st[k] = S.mail.st[k] || { cards: [], extra: {}, over: 0 };
      if (st.cards.length < C.postCap) st.cards.push(m);
      else { for (const x in m.rw) st.extra[x] = (st.extra[x] || 0) + m.rw[x]; st.over++; if (m.last) S.tales.push({ pet: m.pet, end: m.end, at: m.at }) }
    }
  }
  P.mailStacks = () => Object.keys(P.S.mail.st).map(Number).sort((a, b) => a - b).map(k => ({ k, ...P.S.mail.st[k] }));
  P.mailCount = () => P.mailStacks().reduce((a, s) => a + s.cards.length + (s.over ? 1 : 0), 0);
  const addRw = (o, rw) => { for (const k in rw) o[k] = (o[k] || 0) + rw[k] };
  P.applyRw = rw => {
    const S = P.S, got = [];
    for (const k in rw) { const v = rw[k]; if (!v) continue;
      if (k === 'gear') { for (let i = 0; i < 1; i++) { const it = { r: v, name: C.GEAR_RAR[v], d: S.diff || 0, at: P.now(), from: '明信片' }; S.gear.push(it) } got.push('🗡️ 主人用的裝備 ' + C.GEAR_RAR[v]); continue }
      if (k in S.mat) S.mat[k] += v; else if (k === 'letterB') S.letters.b += v; else if (k === 'letterP') S.letters.p += v; else if (k === 'letterK') S.letters.k += v; else if (k === 'star') S.frag.star += v; else if (k === 'dusk') S.frag.dusk += v; else S[k] = (S[k] || 0) + v;
      got.push(P.rwName(k, v)); P.seen(k);
    }
    return got;
  };
  P.rwName = (k, v) => { const N = { gold: '💰 金幣', bread: '🍞 剩食麵包', snackMat: '🍪 零食材料', disk: '💿 技能磁片', shards: '🔷 刻印碎片（主人裝備用）', letterB: '💌 藍幸福信', letterP: '💌 紫幸福信', letterK: '💌 粉幸福信', star: '⭐ 星光碎片', dusk: '🌙 暮光碎片', collar: '🏅 金色項圈' }; if (P.MATS[k]) return `${P.MATS[k].icon} ${P.MATS[k].name} ×${v}`; if (k === 'gear') return '🗡️ 裝備 ' + C.GEAR_RAR[v]; return `${N[k] || k} ${k === 'gold' ? v.toLocaleString() : '×' + v}` };
  P.openStack = k => {
    const S = P.S, st = S.mail.st[k]; if (!st) return null; const tot = {};
    st.cards.forEach(m => { addRw(tot, m.rw); if (m.last) S.tales.push({ pet: m.pet, end: m.end, at: m.at }) }); addRw(tot, st.extra);
    const got = P.applyRw(tot); delete S.mail.st[k];
    P.emit('mail', `打開明信片 ×${st.cards.length}${st.over ? `（另外 ${st.over} 張變成材料）` : ''}：${got.join('、')}`);
    return { cards: st.cards, over: st.over, got, tot };
  };
  P.cardText = m => {
    const nm = m.pet.name || P.SP[m.pet.sp].name;
    if (m.baby) return `「我在路上遇到一戶好人家，他們說會好好照顧我。這封幸福信請你收下！」——${nm}`;
    if (m.n === 1) return `「我現在在${m.place}。這裡的人都好親切！我撿到一些好東西，寄給你。」——${nm}`;
    return `「好久不見！我在${m.place}過得很好喔。」——${nm}${m.end ? `\n（後來，${nm}${m.end}。）` : ''}`;
  };

  // ---------- 擴建：二館、農場（2.10） ----------
  P.expandInfo = kind => {
    const S = P.S, c = C[kind], st = S[kind];
    if (st === 1) return { state: 'done' };
    if (st && st.until) return { state: 'building', until: st.until };
    if (kind === 'farm' && S.annex !== 1) return { state: 'locked', why: '先蓋好二館' };
    if (P.repLv() < c.rep) return { state: 'locked', why: `名聲 Lv${c.rep} 才能蓋（現在 Lv${P.repLv()}）`, c };
    return { state: 'can', c };
  };
  P.buildExpand = kind => {
    const S = P.S, I = P.expandInfo(kind), c = C[kind]; if (I.state !== 'can') return { ok: 0, msg: I.why || '現在不能蓋' };
    if (S.gold < c.gold || S.bread < c.bread || S.shards < c.shard) return { ok: 0, msg: `需要金幣 ${c.gold.toLocaleString()}、剩食麵包 ${c.bread}、刻印碎片 ${c.shard}` };
    S.gold -= c.gold; S.bread -= c.bread; S.shards -= c.shard; S[kind] = { until: P.now() + c.hours * H };
    P.emit('build', `開始蓋${kind === 'annex' ? '二館' : '農場'}（${c.hours} 小時後完工）`); return { ok: 1 };
  };
  function buildTick(t) { const S = P.S; for (const k of ['annex', 'farm']) if (S[k] && S[k].until && t >= S[k].until) { S[k] = 1; if (k === 'farm') S.fac.grass = 1; P.emit('build', k === 'annex' ? '二館蓋好了！住民上限 10、小屋可以再蓋 2 間' : '農場蓋好了！住民上限 20；農場地圖開放'); P.justBuilt = k } }
  // 西施來問要不要擴建：住滿了＋外面有動物在徘徊；按「再想想」最多每 3 天問一次
  P.askExpand = () => {
    const S = P.S; if (!S.unlock || !P.houseFull() || !S.wander.length) return null;
    const kind = S.annex !== 1 ? 'annex' : S.farm !== 1 ? 'farm' : null; if (!kind) return null;
    if (S[kind] && S[kind].until) return null;
    if (S.askAt && P.now() - S.askAt < C.askEvery * D) return null;
    return kind;
  };

  // ---------- 農場設施（第 9 節） ----------
  P.FAC = [
    { k: 'grass', name: '牧場草地', cost: 0, x: 420, real: 1, npc: '西施', say: '這片草地是大家的運動場！在農場的時候，大家的心情會掉得比較慢。', eff: '心情下降速度 −30%' },
    { k: 'pond', name: '池塘', cost: 80000, x: 2960, real: 1, npc: '蜜糖媽媽', say: '池塘可以釣魚喔。拋竿以後，浮標一沉下去就趕快拉！每天可以釣 5 次。', eff: '釣魚：零食材料、剩食麵包，偶爾釣到金魚' },
    { k: 'garden', name: '菜園', cost: 120000, x: 1350, real: 1, npc: '蜜糖媽媽', say: '菜園有 3 塊田。種下去等幾個小時就能收成，不會枯掉，放心。', eff: '種紅蘿蔔／南瓜／莓果，收成零食材料' },
    { k: 'bath', name: '溫泉澡堂', cost: 180000, x: 1800, real: 1, npc: '西施', say: '泡湯囉！一次把大家洗得乾乾淨淨，每天 1 次。', eff: '每天 1 次：全部乾淨補滿、好感 +3' },
    { k: 'fire', name: '篝火廣場', cost: 100000, x: 2250, real: 1, npc: '西施', say: '晚上 7 點到 11 點會點火。大家圍著坐，心情都會變好！每天 1 次。', eff: '19:00～23:00（台北）每天 1 次：全部心情 +20' },
    { k: 'nursery', name: '托兒所', cost: 120000, x: 2650, real: 1, npc: '蜜糖媽媽', say: '托兒所蓋好以後，育兒室可以多住 10 隻寶寶。', eff: '育兒室上限 +10' },
    { k: 'board', name: '探險隊派遣板', cost: 250000, x: 3200, real: 1, npc: '獵犬', say: '汪！（把隊伍派出去，就會帶東西回來。不會受傷，放心。）', eff: '開放寵物探險隊' },
    { k: 'camp', name: '訓練營', cost: 160000, x: 3450, real: 1, npc: '獵犬', say: '汪汪！（每天練一練，能力就會變強。累了就去休息區。）', eff: '日常訓練、集訓、休息區' },
    { k: 'flower', name: '花園', cost: 60000, x: 640, npc: '蜜糖媽媽', say: '花園還在整地，等花苗送來再請你幫忙。' },
    { k: 'play', name: '遊樂場', cost: 150000, x: 1580, npc: '西施', say: '遊樂場的木頭還在曬，過一陣子就能蓋了！' },
    { k: 'shop', name: '工作坊', cost: 200000, x: 2030, npc: '蜜糖媽媽', say: '工作坊的師傅還在路上，下次再來看看。' },
    { k: 'photo', name: '拍照點', cost: 50000, x: 900, npc: '西施', say: '拍照點要等畫師來畫背景，再等等喔。' },
    { k: 'tower', name: '瞭望台', cost: 80000, x: 3700, npc: '小貓頭鷹', say: '咕咕。（木梯子還沒做好，之後再上來看風景。）' },
  ];
  P.FA = {}; P.FAC.forEach(f => P.FA[f.k] = f);
  P.buildFac = k => {
    const S = P.S, f = P.FA[k]; if (!f) return { ok: 0, msg: '沒有這個設施' }; if (S.farm !== 1) return { ok: 0, msg: '要先成立農場' };
    if (!f.real) return { ok: 0, msg: f.say }; if (S.fac[k]) return { ok: 0, msg: '已經蓋好了' };
    if (S.gold < f.cost) return { ok: 0, msg: `需要金幣 ${f.cost.toLocaleString()}` };
    S.gold -= f.cost; S.fac[k] = 1; P.emit('build', `農場蓋好了：${f.name}`); if (P.settleWait) P.settleWait(); return { ok: 1 };
  };
  const dk = () => P.dayKey(P.now());
  const once = (k) => { const S = P.S; if (S.daily3[k] === dk()) return false; S.daily3[k] = dk(); return true };
  P.bath = () => { const S = P.S; if (!S.fac.bath) return { ok: 0, msg: '還沒蓋溫泉澡堂' }; if (S.daily3.bath === dk() && !C.capOff) return { ok: 0, msg: '今天已經泡過了，明天 05:00 再來' }; S.daily3.bath = dk(); for (const p of P.all()) if (!P.out(p)) { p.need.c = 100; P.gainAff(p, 3, '泡溫泉') } P.emit('care', '大家一起泡溫泉：全部乾淨補滿'); return { ok: 1 } };
  P.fireOpen = () => { const h = new Date(P.now() + C.tz * H).getUTCHours(); return h >= 19 && h < 23 };
  P.fire = () => { const S = P.S; if (!S.fac.fire) return { ok: 0, msg: '還沒蓋篝火廣場' }; if (!P.fireOpen() && !C.capOff) return { ok: 0, msg: '篝火晚上 7 點到 11 點才會點起來' }; if (S.daily3.fire === dk() && !C.capOff) return { ok: 0, msg: '今天已經圍過篝火了' }; S.daily3.fire = dk(); for (const p of P.all()) if (!P.out(p)) p.need.m = Math.min(100, p.need.m + 20); P.emit('care', '大家圍著篝火唱「豐收之歌」：全部心情 +20'); return { ok: 1 } };
  P.fishLeft = () => { const S = P.S; if (!S.fish || S.fish.day !== dk()) S.fish = { day: dk(), n: 0 }; return C.capOff ? 99 : 5 - S.fish.n };
  P.fish = hit => { const S = P.S; if (!S.fac.pond) return { ok: 0, msg: '還沒蓋池塘' }; if (P.fishLeft() <= 0) return { ok: 0, msg: '今天釣 5 次了，魚兒要休息' }; S.fish.n++; if (!hit) return { ok: 1, got: null, msg: '魚跑掉了……' }; const r = R(); const rw = r < 0.05 ? { goldfish: 1 } : r < 0.30 ? { bread: 2 } : { snackMat: 1 }; if (rw.goldfish) { S.goldfish = (S.goldfish || 0) + 1; P.seen('goldfish'); return { ok: 1, got: '🐟 金魚紀念品！（收藏品）' } } return { ok: 1, got: P.applyRw(rw).join('、') } };
  P.CROPS = { carrot: { name: '紅蘿蔔', h: 2, mat: 2 }, pumpkin: { name: '南瓜', h: 5, mat: 4 }, berry: { name: '莓果', h: 8, mat: 6 } };
  P.plant = (i, c) => { const S = P.S; if (!S.fac.garden) return { ok: 0, msg: '還沒蓋菜園' }; if (S.garden[i]) return { ok: 0, msg: '這塊田已經種了' }; S.garden[i] = { c, at: P.now() + P.CROPS[c].h * H }; return { ok: 1 } };
  P.harvest = i => { const S = P.S, g = S.garden[i]; if (!g) return { ok: 0, msg: '還沒種' }; if (P.now() < g.at) return { ok: 0, msg: '還沒長好' }; S.garden[i] = null; const got = P.applyRw({ snackMat: P.CROPS[g.c].mat }); return { ok: 1, got: got.join('') } };

  // ---------- 訓練營 ----------
  P.DRILL = [
    { k: 'log', name: '搬木頭', main: 'str', sub: 'vit' },
    { k: 'butterfly', name: '追蝴蝶', main: 'agi', sub: 'luk' },
    { k: 'hill', name: '爬山路', main: 'vit', sub: 'str' },
    { k: 'knot', name: '解繩結', main: 'wit', sub: 'agi' },
    { k: 'dig', name: '挖寶藏', main: 'luk', sub: 'wit' },
  ];
  P.fatigue = p => { P.abInit(p); const v = Math.max(0, p.fat - (P.now() - (p.fatT || P.now())) / H * C.fatigueRecH); return v };
  const fatMul = f => Math.max(0.2, 1 - f / 100 * 0.8);
  P.trainPreview = (p, dk2) => { const d = P.DRILL.find(x => x.k === dk2), f = P.fatigue(p), m = fatMul(f) * C.ablQual[p.q == null ? 1 : p.q]; const cap = k => Math.max(0, C.ablTrainCap - (p.tr[k] || 0)); return { d, main: r1(Math.min(cap(d.main), C.trainMain * m)), sub: r1(Math.min(cap(d.sub), C.trainSub * m)), fat: f, mul: m } };
  P.train = (p, dk2) => {
    const S = P.S; if (!S.fac.camp) return { ok: 0, msg: '還沒蓋訓練營' }; if (P.out(p)) return { ok: 0, msg: '牠現在不在農場' }; if (!P.unlocked(p)) return { ok: 0, msg: '剛出生的寶寶明天才能訓練' };
    if (S.gold < C.trainCost) return { ok: 0, msg: `需要金幣 ${C.trainCost.toLocaleString()}` };
    const v = P.trainPreview(p, dk2); if (!v.main && !v.sub) return { ok: 0, msg: '這兩項已經練到上限了' };
    S.gold -= C.trainCost; p.tr[v.d.main] = r1((p.tr[v.d.main] || 0) + v.main); p.tr[v.d.sub] = r1((p.tr[v.d.sub] || 0) + v.sub);
    p.fat = Math.min(100, v.fat + C.trainFatigue); p.fatT = P.now();
    P.emit('train', `${P.label(p)} ${v.d.name}：${P.abName(v.d.main)} +${v.main}、${P.abName(v.d.sub)} +${v.sub}（疲勞 ${Math.round(p.fat)}）`); return { ok: 1, v };
  };
  P.rest = p => { p.fat = 0; p.fatT = P.now(); P.emit('train', `${P.label(p)} 在休息區睡了一覺，疲勞清空`); return { ok: 1 } };
  P.camp = (p, days, dk2) => {
    const S = P.S, c = C.campDays[days], d = P.DRILL.find(x => x.k === dk2); if (!S.fac.camp) return { ok: 0, msg: '還沒蓋訓練營' }; if (!c || !d) return { ok: 0, msg: '選天數和項目' };
    if (P.out(p)) return { ok: 0, msg: '牠現在不在農場' }; if (!P.unlocked(p)) return { ok: 0, msg: '剛出生的寶寶明天才能去' }; if (S.gold < c.gold) return { ok: 0, msg: `需要金幣 ${c.gold.toLocaleString()}` };
    P.abInit(p); S.gold -= c.gold; p.away = { kind: 'camp', until: P.now() + days * D, days, main: d.main, sub: d.sub, name: d.name };
    if (S.eq === p.id) S.eq = 'xishi'; S.follow = S.follow.filter(i => i !== p.id); for (const ct of S.cots) { if (ct.a === p.id) ct.a = 0; if (ct.b === p.id) ct.b = 0 }
    P.emit('train', `${P.label(p)} 去集訓 ${days} 天（${d.name}）`); return { ok: 1 };
  };
  function campTick(t) {
    for (const p of P.all()) { const a = p.away; if (!a || a.kind !== 'camp' || t < a.until) continue;
      const c = C.campDays[a.days], q = C.ablQual[p.q == null ? 1 : p.q]; const cap = k => Math.max(0, C.ablTrainCap - (p.tr[k] || 0));
      const gm = r1(Math.min(cap(a.main), c.main * q)), gs = r1(Math.min(cap(a.sub), c.sub * q)); p.tr[a.main] = r1((p.tr[a.main] || 0) + gm); p.tr[a.sub] = r1((p.tr[a.sub] || 0) + gs);
      let magic = '';
      if (p.baby && R() * 100 < c.magic) { if ((p.sub || []).length < 3) { p.sub.push(P.rollSub(p, p.sub.map(x => x[0]))); magic = '學會一條新的天性魔法：' + P.subText(...p.sub[p.sub.length - 1]) } else { let lo = 0; p.sub.forEach((x, i) => { if (x[1] < p.sub[lo][1]) lo = i }); p.sub[lo] = P.rollSubUpper(p, p.sub[lo][0]); magic = '天性魔法變強了：' + P.subText(...p.sub[lo]) } }
      p.away = null; p.fat = 0; p.fatT = t; P.camps = (P.camps || []).concat([{ id: p.id, gm, gs, a, magic }]);
      P.emit('train', `${P.label(p)} 集訓回來：${P.abName(a.main)} +${gm}、${P.abName(a.sub)} +${gs}${magic ? '；' + magic : ''}`);
    }
  }

  // ---------- 探險隊（第 10 節） ----------
  // P4：探險隊的目的地＝正式版真的關卡（名字、小怪、王、場景、掉落都照正式版；只讀正式版資料）
  // loot 換算成收容所用得到的東西：金幣→金幣、烤麵包→剩食麵包、基本草藥→零食材料、粗糙的石頭→刻印碎片、寶石→金幣
  P.STAGES = [
    { k: 'canyon', no: '第一關', name: '赤岩峽谷', en: 'RED ROCK CANYON', star: 1, req: 1.5, h: 1, loot: { gold: 1500, bread: 3, snackMat: 1 },
      foes: [['foe_golem', '泥魔像（劍）'], ['foe_golem', '泥魔像（弓）']], boss: ['boss_canyon', '泥魔像隊長'], items: [['i_coin', '金幣', 'gold'], ['i_food', '烤麵包', 'bread'], ['i_herb', '基本草藥', 'snackMat']],
      ev: ['泥魔像隊長喊來一群小兵，大家躲在紅色岩石後面等牠們走掉', '撿到泥魔像掉下來的泥塊，捏一捏丟著玩', '峽谷的風好大，耳朵一直被吹翻過去', '在營火旁邊撿到一塊烤麵包，分著吃掉一半'], fail: '被泥魔像的弓箭追著跑，只好先撤退' },
    { k: 's2', no: '第二關', name: '灰色荒野', en: 'GREY WASTELAND', star: 2, req: 3, h: 2, loot: { gold: 3000, bread: 5, snackMat: 2 }, disk: 10, rareBoss: [20, '暮色刺蠍', 'boss_s2b'],
      foes: [['foe_golem', '泥魔像']], boss: ['boss_s2', '灰燼刺蠍'], items: [['i_coin', '金幣', 'gold'], ['i_food', '烤麵包', 'bread'], ['i_herb', '基本草藥', 'snackMat']], filter: 'hue-rotate(150deg) saturate(0.5) brightness(0.8)',
      ev: ['遠遠聽到灰野的風聲，還有刺蠍尾巴敲地的聲音', '灰燼刺蠍鑽進沙裡了！大家一起圍著那個洞汪汪叫', '在枯樹底下找到一片舊舊的技能磁片'], fail: '灰燼刺蠍的尾巴太可怕了，大家抱成一團退回來' },
    { k: 'mine', no: '第三關', name: '赤岩礦坑・女神的試煉', en: 'RED ROCK MINE', star: 3, req: 5, h: 3, loot: { gold: 4500, bread: 6, snackMat: 2 }, disk: 15, shards: [2, 4], pollen: 3,
      foes: [['foe_golem', '坑道裡的魔像'], ['i_stone', '赤晶柱']], boss: ['boss_mine', '峽谷看守者・巨石魔像'], items: [['i_coin', '金幣', 'gold'], ['i_stone', '粗糙的石頭', 'shards'], ['i_pot', '生命藥水', 'bread']],
      ev: ['赤晶柱一直叫魔像出來，大家輪流去咬柱子，終於敲碎了', '在礦坑深處的女神祭壇前面，大家安靜地坐了一下', '峽谷看守者被赤色晶柱的力量保護著……先繞路走'], fail: '赤晶柱沒敲完，峽谷看守者打不動，只好先回家' },
    { k: 'spider', no: '第四關', name: '巴里2礦區・2層1區', en: 'BARRI MINE B2', star: 4, req: 8, h: 4, loot: { gold: 6000, bread: 8 }, shards: [3, 6], chest: 10, pollen: 4,
      foes: [['foe_rk', '大地魔像碎片'], ['foe_sc', '坑道蠍'], ['foe_sh', '乙太薩滿']], boss: ['boss_spider', '大地結晶變異蜘蛛'], items: [['i_coin', '金幣', 'gold'], ['i_stone', '粗糙的石頭', 'shards'], ['i_food', '烤麵包', 'bread']],
      ev: ['乙太薩滿丟出青色的水晶彈，大家閃得好快', '女王的爪牙從天花板爬下來，嚇得尾巴都豎起來了', '躲過了蜘蛛的猛毒襲擊，還順便撿到一顆亮亮的石頭'], fail: '黑蜘蛛太多了，大家沿著礦車軌道跑回來' },
    { k: 'crystal', no: '第五關', name: '巴里地下城・水晶監視者', en: 'BARRI DUNGEON', star: 5, req: 12, h: 6, loot: { gold: 9000, bread: 10 }, shards: [5, 8], chest: 15, pollen: 6,
      foes: [['i_stone', '大地守護石'], ['i_stone', '腐蝕石碑']], boss: ['boss_crystal', '憤怒的水晶監視者'], items: [['i_coin', '金幣', 'gold'], ['i_stone', '粗糙的石頭', 'shards'], ['i_pot', '生命藥水', 'bread']],
      ev: ['大地守護石把監視者包得緊緊的（傷害少 80%），先把守護石推倒', '腐蝕石碑冒出毒霧，大家用尾巴把霧搧開', '在監視者的房間撿到一小片會發光的碎晶'], fail: '腐蝕石碑的毒霧太濃了，先退出地下城' },
    { k: 'rich', no: '隱藏關卡', name: '萊比地下城・理查宅邸 III', en: 'RICHARD MANSION', star: 5, req: 15, h: 8, loot: { gold: 12000, bread: 12 }, shards: [6, 10], chest: 15, starF: 20, pollen: 8, must5: 1, gems: 1,
      foes: [['foe_guard', '墮落的守護警衛兵']], boss: ['boss_rich', '寶石掠奪者「被貪婪蒙蔽的警衛隊長」'], items: [['i_coin', '金幣', 'gold'], ['i_gem0', '藍寶石', 'gold'], ['i_gem1', '綠寶石', 'gold'], ['i_gem2', '紅寶石', 'gold']],
      ev: ['寶物大廳的金幣堆得像小山，大家在上面打滾', '彩繪玻璃大廳好漂亮，可是墮落的守護警衛兵一直巡邏', '被貪婪蒙蔽的警衛隊長抱著寶石不放，大家一起把牠的帽子叼走了'], fail: '墮落的守護警衛兵太多了，大家從後門溜出來' },
  ];
  P.GEMS = [['i_gem0', '藍寶石', 3000], ['i_gem1', '綠寶石', 5000], ['i_gem2', '紅寶石', 8000]];
  P.ST = {}; P.STAGES.forEach(s => P.ST[s.k] = s);
  P.partySize = st => st.must5 || st.star >= 5 ? [5, 5] : st.star === 4 ? [3, 5] : st.star === 3 ? [2, 4] : [1, 3];
  P.expPow = p => r1(([0.6, 1, 2, 3, 4][p.tier] + P.abil(p).total / 150) * P.QUAL_MUL[p.q == null ? 1 : p.q]);   // P4：成年也全力（拿掉 ×0.8）
  P.expRate = (st, pets) => { const pow = pets.reduce((a, p) => a + P.expPow(p), 0); const bonus = (P.S.exp.streak || 0) >= 2 ? C.expStreak : 0; return { pow: r1(pow), rate: Math.round(Math.max(C.expMin, Math.min(C.expMax, C.expBase + C.expPer * (pow - st.req) + bonus))), bonus } };
  P.isKid = p => !!p.baby && !P.canBreedAge(p);   // P4：出生未滿 3 天的小寶寶不能去探險
  P.expWhyNot = p => P.isKid(p) ? '還是小寶寶（滿 3 天才可以）' : !P.unlocked(p) ? '還不能出門' : P.S.eq === p.id ? '正在跟主人出戰' : P.out(p) ? '出門中' : p.restU > P.now() ? '休息中' : '';
  P.expFree = p => !P.out(p) && P.unlocked(p) && !(p.restU > P.now()) && !P.isKid(p) && P.S.eq !== p.id;
  P.expSend = (sk, ids) => {
    const S = P.S, st = P.ST[sk]; if (!S.fac.board) return { ok: 0, msg: '要先在農場蓋探險隊派遣板' }; if (!st) return { ok: 0, msg: '沒有這個地方' };
    if (S.exp.teams.length >= C.expTeams) return { ok: 0, msg: `同時最多 ${C.expTeams} 隊` };
    const pets = ids.map(i => P.byId(i)).filter(Boolean); const [a, b] = P.partySize(st);
    if (pets.length < a || pets.length > b) return { ok: 0, msg: a === b ? `這裡一定要派 ${a} 隻` : `這裡要派 ${a}～${b} 隻` };
    const bad = pets.find(p => !P.expFree(p)); if (bad) return { ok: 0, msg: `${P.label(bad)} 現在不能出發` };
    const r = P.expRate(st, pets), win = R() * 100 < r.rate, t = P.now();
    const team = { id: S.exp.nid++, sk, ids: pets.map(p => p.id), start: t, until: t + st.h * H * (win ? 1 : 0.5), rate: r.rate, win, rare: st.rareBoss && R() * 100 < st.rareBoss[0] ? 1 : 0 };
    S.exp.teams.push(team); for (const p of pets) { p.away = { kind: 'exp', until: team.until, team: team.id }; if (S.eq === p.id) S.eq = 'xishi'; S.follow = S.follow.filter(i => i !== p.id) }
    P.emit('exp', `探險隊出發：${st.name}（${pets.map(P.label).join('、')}；戰力 ${r.pow}／需要 ${st.req}；成功率 ${r.rate}%）`); return { ok: 1, team };
  };
  function expTick(t) {
    const S = P.S; if (!S.exp) return;
    for (const tm of S.exp.teams.slice()) { if (t < tm.until) continue;
      const st = P.ST[tm.sk], pets = tm.ids.map(i => P.byId(i)).filter(Boolean), rw = {}; const luk = pets.reduce((a, p) => a + P.abil(p).luk, 0), lm = 1 + luk / 1000;
      for (const k in st.loot) rw[k] = Math.round(st.loot[k] * (k === 'gold' ? lm : 1));
      if (st.disk && R() * 100 < st.disk * lm) rw.disk = 1; if (st.shards) rw.shards = ri(st.shards[0], st.shards[1]);
      if (st.starF && R() * 100 < st.starF * lm) rw.star = ri(1, 2);
      if (tm.rare) for (const k in rw) rw[k] *= 2;   // 暮色刺蠍：戰利品約 2 倍
      if (st.pollen && R() * 100 < st.pollen * lm) rw.pollen = 1;   // 隨機的月光露（相對常見）
      let gem = null; if (st.gems) { gem = P.GEMS[R() < 0.6 ? 0 : R() < 0.75 ? 1 : 2]; rw.gold += gem[2] }
      const evTxt = tm.win ? st.ev[ri(0, st.ev.length - 1)] + (tm.rare ? `（遇到稀有的${st.rareBoss[1]}，戰利品變兩倍！）` : '') + (gem ? `（撿到${gem[1]}）` : '') : st.fail;
      if (st.chest && R() * 100 < st.chest * lm) { const k = P.dayKey(t); if (S.exp.chest.day !== k) S.exp.chest = { day: k, n: 0 }; if (S.exp.chest.n < C.expChestDay) { S.exp.chest.n++; rw.gold += 20000; rw.gear = Math.min(6, P.rollRar(S.diff || 0)); rw.chest = 1 } }
      if (!tm.win) { for (const k in rw) rw[k] = k === 'gear' || k === 'chest' ? 0 : Math.floor(rw[k] * C.expConsole / 100); S.exp.streak = (S.exp.streak || 0) + 1 } else S.exp.streak = 0;
      delete rw.chest; const got = P.applyRw(rw);
      for (const p of pets) { p.away = null; if (tm.win) { P.gainAff(p, 10, '探險成功'); if (p.baby) { p.xp = (p.xp || 0) + 10 * st.star; const cap = C.lvCap[p.tier]; while (p.xp >= C.xpNeed * p.lv && p.lv < cap) { p.xp -= C.xpNeed * p.lv; p.lv++ } if (p.lv >= cap) p.xp = 0 } } else p.restU = t + C.expRestH * H }
      S.exp.teams = S.exp.teams.filter(x => x !== tm);
      const rec = { st: st.name, k: st.k, win: tm.win, got, ids: tm.ids, names: pets.map(P.label), at: t, ev: evTxt, rare: tm.rare };
      S.exp.log.unshift(rec); S.exp.log = S.exp.log.slice(0, 8); P.expBack = (P.expBack || []).concat([rec]);
      P.emit('exp', `探險隊回來了（${st.name}）：${tm.win ? '成功' : '沒成功（提早回來，帶回安慰獎；休息 2 小時）'}；${got.join('、') || '—'}`);
    }
  }

  // ---------- 大會 ----------
  const E0 = P.dayKey(Date.UTC(2026, 0, 1, 0));   // 第 1 屆的起算日（2026/1/1）
  const SEASON = [['冬', '初雪盃'], ['冬', '初雪盃'], ['春', '春之花冠盃'], ['春', '春之花冠盃'], ['春', '春之花冠盃'], ['夏', '仲夏西瓜盃'], ['夏', '仲夏西瓜盃'], ['夏', '仲夏西瓜盃'], ['秋', '秋收盃'], ['秋', '秋收盃'], ['秋', '秋收盃'], ['冬', '初雪盃']];
  const LOOK = { 春之花冠盃: { k: 'flower', name: '春之花冠' }, 仲夏西瓜盃: { k: 'melon', name: '西瓜小帽' }, 秋收盃: { k: 'wheat', name: '麥穗圍巾' }, 初雪盃: { k: 'snow', name: '雪花披肩' }, 傳說大會: { k: 'cape', name: '傳說披風' } };
  P.LOOKS = { flower: '春之花冠', melon: '西瓜小帽', wheat: '麥穗圍巾', snow: '雪花披肩', cape: '傳說披風' };
  const tpe = () => new Date(P.now() + C.tz * H);
  P.cupNow = c => {
    const d = tpe(), k = P.dayKey(P.now()), mo = d.getUTCMonth(), y = d.getUTCFullYear();
    if (c === 'v') return { c, name: '村莊小賽', ed: k - E0 + 1 };
    if (c === 's') { const nm = SEASON[mo][1]; const sStart = [11, 0, 1].includes(mo) ? (mo === 11 ? Date.UTC(y, 11, 1) : Date.UTC(y - 1, 11, 1)) : Date.UTC(y, mo - (mo - 2) % 3, 1); const wk = Math.floor((P.now() + C.tz * H - sStart) / (7 * D)) + 1; return { c, name: nm, ed: wk, season: SEASON[mo][0] } }
    if (c === 'k') return { c, name: '王國名盃', ed: (y - 2026) * 12 + mo + 1 };
    if (c === 'l') return { c, name: '傳說大會', ed: (y - 2026) * 4 + Math.floor(mo / 3) + 1 };
  };
  P.CUPS = {
    v: { name: '村莊小賽', base: 18, txt: '每天都有。誰都可以報名。', prize: ['💰 3,000＋🍪×2＋🍞×5', '💰 1,500＋🍪×1', '💰 800', '🍞×1'] },
    s: { name: '季節盃', base: 32, txt: '每季的盃賽，每週一屆。要「銅級」（村莊小賽拿過 3 次冠軍）。', prize: ['季節限定外觀＋💧洗練露水×2＋🪶風向羽毛×1＋💰 10,000', '💧×1＋💰 6,000', '💰 3,000＋🍪×2', '🍞×2'] },
    k: { name: '王國名盃', base: 55, txt: '每個月一屆。要「銀級」（季節盃 2 次冠軍），而且寶寶 Lv10 以上（成年動物要 ♡5）。', prize: ['30% 🏵️王國勳果（永久能力）；不然 💧×3＋🌠×1；再加 💰 30,000；20% 🌕月光露', '💧×2＋💰 15,000（10% 🏵️）', '💧×1＋💰 8,000', '💰 2,000'] },
    l: { name: '傳說大會', base: 85, txt: '每季一屆，只有受邀才能參加：要「金級」（王國名盃冠軍）、收容所名聲 Lv8。', prize: ['📜傳說之證＋傳說披風（外觀）＋💰 80,000；極低機率（3%）🌈彩虹月光露', '50% 傳說披風＋💧×3', '🌠心願星砂×1', '💰 5,000'] },
  };
  P.RANK = ['新手', '銅級', '銀級', '金級'];
  P.EVENTS = [{ k: 'run', name: '賽跑', a: 'agi', b: 'vit', sz: 's' }, { k: 'tug', name: '拔河', a: 'str', b: 'vit', sz: 'l' }, { k: 'hurdle', name: '障礙賽', a: 'agi', b: 'wit', sz: 's' }, { k: 'hunt', name: '尋寶', a: 'luk', b: 'wit' }, { k: 'long', name: '耐力長跑', a: 'vit', b: 'agi' }, { k: 'show', name: '才藝表演', a: 'wit', b: 'luk' }];
  P.cupEvent = I => P.EVENTS[(I.ed * 7 + I.c.charCodeAt(0)) % P.EVENTS.length];
  P.cupScore = (p, ev) => { const a = P.abil(p); let s = a[ev.a] * 0.6 + a[ev.b] * 0.4; if (ev.sz && (P.SIZE[p.sp] || 'm') === ev.sz) s *= 1.05; return r1(s) };
  P.cupCan = (p, c) => {
    const S = P.S, I = P.cupNow(c); P.abInit(p);
    if (P.out(p)) return '牠現在不在家'; if (!P.unlocked(p)) return '剛出生，明天才能比賽';
    if ((p.cupDone || {})[c] === I.ed) return '這一屆已經參加過了';
    if (c === 'v') { if (S.cup.day === dk() && S.cup.n >= C.cupDaily && !C.capOff) return `村莊小賽今天已經比 ${C.cupDaily} 場了`; return '' }
    if (c === 's') return p.rank >= 1 ? '' : '要銅級（村莊小賽 3 次冠軍）';
    if (c === 'k') { if (p.rank < 2) return '要銀級（季節盃 2 次冠軍）'; if (p.baby ? p.lv < C.kingdomLv : P.heart(p.aff) < 5) return p.baby ? `寶寶要 Lv${C.kingdomLv}` : '成年動物要 ♡5'; return '' }
    if (c === 'l') { if (p.rank < 3) return '要金級（王國名盃冠軍）'; if (P.repLv() < C.legendRep) return `收容所名聲要 Lv${C.legendRep}`; return '' }
  };
  // P5：報名面板用——看得到哪些大會、升級進度、奪冠機會（用跟 cupRun 同一套公式模擬，不顯示假的精確分數）
  P.cupSeen = c => { if (c === 'v') return true; const need = { s: 1, k: 2, l: 3 }[c], all = P.all ? P.all() : P.S.babies.concat(P.S.pets);
    return all.some(p => (p.rank || 0) >= need || (p.medals || []).some(m => m.c === c)) };
  P.cupNextSeen = () => ['s', 'k', 'l'].find(c => !P.cupSeen(c)) || null;
  P.cupProg = p => { const w = p.wins || {}, n = C.rankNeed, r = p.rank || 0;
    if (r === 0) return { txt: `村莊小賽冠軍 ${Math.min(w.v || 0, n[1])}/${n[1]}`, next: '銅級' };
    if (r === 1) return { txt: `季節盃冠軍 ${Math.min(w.s || 0, n[2])}/${n[2]}`, next: '銀級' };
    if (r === 2) return { txt: `王國名盃冠軍 ${Math.min(w.k || 0, n[3])}/${n[3]}`, next: '金級' };
    return { txt: '已經是最高的金級', next: '' } };
  P.cupOdds = (p, c, ev) => {
    const cup = P.CUPS[c], me = P.cupScore(p, ev || P.cupEvent(P.cupNow(c))); let s = ((p.id || 1) * 7919 + c.charCodeAt(0) * 131) % 233280 || 1;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280, N = 600; let champ = 0, fin = 0;
    for (let n = 0; n < N; n++) { const opp = []; for (let i = 0; i < 7; i++) opp.push(cup.base * (0.75 + rnd() * 0.5)); opp.sort((a, b) => a - b);
      const foes = [opp[Math.floor(rnd() * 3)], opp[3 + Math.floor(rnd() * 3)], opp[6]]; let i = 0;
      for (; i < 3; i++) if (me * (0.85 + rnd() * 0.3) < foes[i] * (0.85 + rnd() * 0.3)) break;
      if (i >= 2) fin++; if (i === 3) champ++ }
    const w = champ / N, f = fin / N;
    const word = w >= 0.75 ? '很有希望奪冠' : w >= 0.5 ? '有機會奪冠' : w >= 0.25 ? '拼一拼也許能奪冠' : f >= 0.35 ? '奪冠有點難，進決賽有機會' : w >= 0.03 || f >= 0.1 ? '有點吃力' : '先練練再來';
    return { win: w, fin: f, word } };
  const NPCN = ['隔壁村的阿福', '磨坊的小麥', '鐵匠家的黑炭', '花店的小鈴', '牧場的大白', '漁村的浪花', '修道院的豆豆', '酒館的小酒窩', '驛站的飛毛腿', '果園的蘋果', '石橋邊的阿石', '老街的團子'];
  P.cupRun = (p, c) => {
    const S = P.S, why = P.cupCan(p, c); if (why) return { ok: 0, msg: why };
    const I = P.cupNow(c), ev = P.cupEvent(I), cup = P.CUPS[c], me = P.cupScore(p, ev);
    const names = NPCN.slice().sort(() => R() - 0.5).slice(0, 7);
    const opp = names.map(n => ({ n, s: r1(cup.base * (0.75 + R() * 0.5)), sp: pick(P.SPECIES).id }));
    opp.sort((a, b) => a.s - b.s);   // 先碰到比較弱的
    const rounds = []; let alive = true, place = 1;
    const foes = [opp[ri(0, 2)], opp[ri(3, 5)], opp[6]];
    for (let i = 0; i < 3 && alive; i++) {
      const f = foes[i], m1 = me * (0.85 + R() * 0.3), m2 = f.s * (0.85 + R() * 0.3), win = m1 >= m2;
      rounds.push({ f, me: r1(m1), op: r1(m2), win, name: ['第一輪', '準決賽', '決賽'][i] }); if (!win) { alive = false; place = [5, 3, 2][i] }
    }
    if (c === 'v') { if (S.cup.day !== dk()) S.cup = Object.assign(S.cup, { day: dk(), n: 0 }); S.cup.n++ }
    (p.cupDone = p.cupDone || {})[c] = I.ed;
    // 獎品
    const rw = {}, extra = [];
    const pl = place === 1 ? 0 : place === 2 ? 1 : place === 3 ? 2 : 3;
    if (c === 'v') Object.assign(rw, [{ gold: 3000, snackMat: 2, bread: 5 }, { gold: 1500, snackMat: 1 }, { gold: 800 }, { bread: 1 }][pl]);
    if (c === 's') { Object.assign(rw, [{ dew: 2, feather: 1, gold: 10000 }, { dew: 1, gold: 6000 }, { gold: 3000, snackMat: 2 }, { bread: 2 }][pl]); if (pl === 0) extra.push(LOOK[I.name]) }
    if (c === 'k') { if (pl === 0) { if (R() < 0.3) rw.crown = 1; else { rw.dew = 3; rw.wish = 1 } rw.gold = 30000; if (R() < 0.2) rw.pollen = 1 } else if (pl === 1) { rw.dew = 2; rw.gold = 15000; if (R() < 0.1) rw.crown = 1 } else if (pl === 2) { rw.dew = 1; rw.gold = 8000 } else rw.gold = 2000 }
    if (c === 'l') { if (pl === 0) { if (R() * 100 < C.gen.rainbowLegend) rw.rainbow = 1; rw.proof = 1; rw.gold = 80000; extra.push(LOOK['傳說大會']) } else if (pl === 1) { rw.dew = 3; if (R() < 0.5) extra.push(LOOK['傳說大會']) } else if (pl === 2) rw.wish = 1; else rw.gold = 5000 }
    const got = P.applyRw(rw);
    for (const l of extra) { if (!S.looks.includes(l.k)) S.looks.push(l.k); got.push('👒 外觀：' + l.name) }
    let medal = null;
    if (place <= 3) { medal = { c, ed: I.ed, pl: place, name: `第 ${I.ed} 屆${I.name} ${['', '冠軍', '亞軍', '季軍'][place]}`, at: P.now(), ev: ev.name }; p.medals.push(medal) }
    let rankUp = 0;
    if (place === 1) { p.wins[c] = (p.wins[c] || 0) + 1; const need = C.rankNeed; const nr = c === 'v' && p.rank === 0 && p.wins.v >= need[1] ? 1 : c === 's' && p.rank === 1 && p.wins.s >= need[2] ? 2 : c === 'k' && p.rank === 2 && p.wins.k >= need[3] ? 3 : 0; if (nr) { p.rank = nr; rankUp = nr } }
    P.famRec(p);
    const res = { ok: 1, I, ev, me, rounds, place, got, medal, rankUp };
    S.cup.log.unshift({ id: p.id, name: P.label(p), cup: I.name, ed: I.ed, place, at: P.now() }); S.cup.log = S.cup.log.slice(0, 10);
    P.emit('cup', `${P.label(p)} 參加 第 ${I.ed} 屆${I.name}（${ev.name}，分數 ${me}）→ ${['', '冠軍', '亞軍', '季軍', '', '第一輪落敗'][place]}${rankUp ? `；升到 ${P.RANK[rankUp]}` : ''}`);
    return res;
  };

  // ---------- 每秒：郵差、施工、集訓、探險、疲勞 ----------
  P.tickP3 = t => { if (!P.S.v3) return; mailTick(t); buildTick(t); campTick(t); expTick(t) };

  // ---------- 叫援助文字 ----------
  P.aidLabel = (food, cap) => food >= cap ? `🍞 叫援助角色來幫忙（食物 ${food}/${cap}，可以叫了！）` : `🍞 叫援助角色（集滿食物 ${food}/${cap}）`;

  // ---------- 技能說明：把 %P 這類簡寫換成看得懂的話 ----------
  P.petAtkOf = p => !p || !p.baby ? 0 : C.petAtk[p.tier] * P.QUAL_MUL[p.q == null ? 1 : p.q] * (p.star === 2 ? C.shinyMul : 1) * (1 + (P.abPet(p).patk || { v: 0 }).v / 100) * P.size(p).dmg;
  P.skillDesc = (s, p) => {
    let d = s.desc; const atk = P.petAtkOf(p);
    d = d.replace(/(\d+(?:\.\d+)?)%P/g, (m, n) => `寵物攻擊力的 ${n}%${atk ? `（約 ${Math.round(atk * n / 100).toLocaleString()}）` : ''}`);
    d = d.replace(/HP/g, '生命');
    d = d.replace(/(\+?)(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)(%|px)?/g, (m, pl, a, b, c2, e, u) => { u = u || ''; const v = [a, b, c2, e]; const cur = p && p.tier ? `（現在 ${pl}${v[p.tier - 1]}${u}）` : ''; return `${pl}${a}${u}（藍）／${b}${u}（紫）／${c2}${u}（粉）／${e}${u}（橘）${cur}` });
    return d;
  };
  P.inhDesc = (txt, p) => txt.replace(/(\+?)(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)(%|px)?/g, (m, pl, a, b, c2, u) => { u = u || ''; return `紫 ${pl}${a}${u}／粉 ${pl}${b}${u}／橘 ${pl}${c2}${u}` }).replace(/HP/g, '生命');

  // ---------- NPC 台詞（P3） ----------
  Object.assign(P.NPC_LINES = P.NPC_LINES || {}, {
    poopHint: [['蜜糖媽媽', '院子裡有便便了。點一下便便就能撿起來，或是按下面的「🧹 打掃」一次掃乾淨。掃的時候偶爾會掃出好東西喔！']],
    basket: [['蜜糖媽媽', '這是「育兒籃」。不用把它抱走喔——寶寶會在明天早上 5 點自己出生，住進育兒室。']],
    cap: [['西施', '院子上面寫的「住民」是住在這裡的大朋友，滿了就收不下新的了。小屋是讓兩個好朋友一起住、等育兒籃的地方，不是多出來的房間喔！']],
    askAnnex: [['西施', '外面又有小傢伙在徘徊了……要不要再蓋一間？蓋好二館，就能多住 5 個大朋友，還能多蓋 2 間小屋喔！']],
    askFarm: [['西施', '二館也住滿了……要不要乾脆成立一座農場？大家可以在大草地上跑，還能多住 10 個！']],
    magic: [['西施', '「天性魔法」是寶寶天生帶著的小魔法，出戰的時候會幫主人變強。洗 6 次一定能自己挑：3 個選 1 個，而且都是比較好的數字！']],
    abil: [['獵犬', '汪！（「寵物能力」是我們自己的本事。升級、靈性提升都會長；主人也能分到一點點。）']],
    mail: [['蜜糖媽媽', '郵差把今天的明信片綁成一疊送來了。一次打開就好，裡面的禮物都會收進來。']],
    farmHi: [['西施', '歡迎來到農場！用方向鍵或點地面走路，走到大家旁邊點一下就能摸摸牠們。']],
  });
})(window.PET);
