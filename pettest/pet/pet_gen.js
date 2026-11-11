// 遺傳學（design/pet_genetics_zh.md v1）：血統值、傳承 +N、近親、混血、四祖配方、毛色、突變、傳授／熟練／進化／混合、家傳手札、託付
// 數字全部在 pet_data.js 的 P.CFG.gen；這個檔只放規則。
'use strict';
(function (P) {
  const C = P.CFG, G = C.gen, R = () => P.rand(), ri = P.ri, pick = P.pick;
  const r1 = v => Math.round(v * 10) / 10;
  const AK = () => P.ABIL.map(a => a.k);

  Object.assign(P.CAT_NAME, { mix: '混合技能', mut: '突變技能' });
  // ---------- 存檔 ----------
  const mig0 = P.migrate;
  P.migrate = S => { mig0(S); S.book = S.book || []; if (S.mutPity == null) S.mutPity = 0; S.hybSeen = S.hybSeen || {}; S.recipe = S.recipe || {}; S.mutSeen = S.mutSeen || {}; S.gv = 1; [].concat(S.pets, S.babies, S.wander, S.wait).forEach(p => p && P.genInit(p)) };
  const ns0 = P.newState; P.newState = () => Object.assign(ns0(), { book: [], mutPity: 0, hybSeen: {}, recipe: {}, mutSeen: {}, gv: 1 });
  const wildCoat = () => { const w = G.coatWild, t = w.reduce((a, b) => a + b, 0); let r = R() * t; for (let i = 0; i < w.length; i++) { if ((r -= w[i]) < 0) return i } return 0 };
  P.genInit = p => {
    if (!p) return p;
    if (!p.coat) p.coat = [wildCoat(), wildCoat()];
    if (p.size == null) p.size = ri(35, 65);
    if (!p.ib) p.ib = {}; if (p.line == null) p.line = 0; if (!p.mst) p.mst = {}; if (!p.hid) p.hid = []; if (p.subX == null) p.subX = -1; if (!p.mut) p.mut = [];
    if (p.peak == null) p.peak = p.lv || 1; if (p.coi == null) p.coi = 0;
    return p;
  };
  const mk0 = P.makeAnimal; P.makeAnimal = o => P.genInit(mk0(o));

  // ---------- 寵物能力：血統值（遺傳的部分）＋訓練＋大會 ----------
  P.bloodCap = p => G.ablBloodCap[p.tier] * (1 + G.lineStep * Math.min(G.lineMax + (p.lineX ? 1 : 0), p.line || 0));   // P4 血統印記：這隻的傳承上限 +1
  P.blood = p => {
    P.abInit(p); P.genInit(p); const g = P.abGrow(p), fav = P.ABIL_SP[p.sp] || [], o = {}, cap = P.bloodCap(p);
    for (const k of AK()) o[k] = Math.min(cap, C.ablBase[p.tier] + (fav.includes(k) ? C.ablSpBonus : 0) + (p.ib[k] || 0) + g * P.abW(p, k) * (p.tal === k ? G.ablTal : 1));
    return o;
  };
  P.abil = p => { const b = P.blood(p), o = {}; let tot = 0; for (const k of AK()) { o[k] = b[k] + (p.tr[k] || 0) + Math.min(G.ablCupMax, p.perm[k] || 0); tot += o[k] } o.total = tot; return o };
  P.done = p => !!p.baby && (p.peak || p.lv || 1) >= C.lvCap[p.tier];   // 練成
  // 大會永久能力：每項最多 +30
  P.useFruit = (p, k) => { const S = P.S; if (!S.mat.fruit) return { ok: 0, msg: '沒有成長果實' }; if ((p.perm[k] || 0) >= G.ablCupMax) return { ok: 0, msg: `這一項已經吃到上限（+${G.ablCupMax}）` }; S.mat.fruit--; p.perm[k] = Math.min(G.ablCupMax, (p.perm[k] || 0) + 2); P.emit('abil', `${P.label(p)} 吃了成長果實：${P.abName(k)} +2`); return { ok: 1 } };
  P.useCrown = p => { const S = P.S; if (!S.mat.crown) return { ok: 0, msg: '沒有王國勳果' }; S.mat.crown--; for (const k of AK()) p.perm[k] = Math.min(G.ablCupMax, (p.perm[k] || 0) + 3); P.emit('abil', `${P.label(p)} 吃了王國勳果：5 項能力都 +3`); return { ok: 1 } };

  // ---------- 體型：分類跟物種；突變「迷你／巨大」移一格 ----------
  const ORD = ['s', 'm', 'l'];
  P.sizeClass = p => { const c = P.SIZE[p.sp] || 'm'; if (!p.sizeTag) return c; const i = ORD.indexOf(c) + (p.sizeTag === 'giant' ? 1 : -1); return ORD[Math.max(0, Math.min(2, i))] };
  P.size = p => P.SIZE_INFO[P.sizeClass(p)];
  P.drawScale = p => 0.9 + (p.size == null ? 50 : p.size) / 500;

  // ---------- 毛色 ----------
  P.coatShow = p => Math.min(...(p.coat || [0, 0]));
  P.coatHidden = p => { const c = p.coat || [0, 0]; return Math.max(...c) !== Math.min(...c) ? Math.max(...c) : -1 };
  P.coatName = p => P.COAT[P.coatShow(p)];

  // ---------- 血緣係數（往上 4 代） ----------
  const parOf = id => { const p = P.byId(id); if (p && p.par) return p.par; const f = P.S.fam[id]; return f && f.par };
  function paths(id, d, out, depth) { out.push([id, d]); if (d >= depth) return; const pr = parOf(id); if (pr) for (const x of pr) if (x) paths(x, d + 1, out, depth) }
  P.coi = (a, b) => {   // 兩隻配對 → 寶寶的血緣係數
    if (!a || !b) return 0; const A = [], B = []; paths(a.id, 0, A, G.coiDepth); paths(b.id, 0, B, G.coiDepth);
    let f = 0; for (const [x, n1] of A) for (const [y, n2] of B) if (x === y) f += Math.pow(0.5, n1 + n2 + 1);
    return Math.round(f * 10000) / 10000;
  };
  P.coiText = v => v >= G.coiBan ? '一家人（不能配）' : v >= G.coiNear ? '親戚（遺傳少一點、突變多一點）' : v > 0 ? '遠房親戚（沒有影響）' : '沒有血緣';

  // ---------- 混血：哪些組合能生 ----------
  const pairKey = (x, y) => [x, y].sort().join('+');
  const PAIRS = {}; for (const id in P.HYB) { const h = P.HYB[id]; if (h.hyb) PAIRS[pairKey(h.hyb[0], h.hyb[1])] = id }
  P.hybPairOf = (x, y) => PAIRS[pairKey(x, y)] || null;
  // 回傳：'' 同物種；'pure'（指定兩物種）；'same'（同一種混血）；'back'（混血×原物種）；'cross'（混血×混血）；null＝不會有育兒籃
  P.mateKind = (a, b) => {
    if (a.sp === b.sp) return P.HYB[a.sp] ? 'same' : '';
    if (P.hybPairOf(a.sp, b.sp)) return 'pure';
    const ha = P.HYB[a.sp], hb = P.HYB[b.sp];
    if (ha && ha.hyb && ha.hyb.includes(b.sp)) return 'back'; if (hb && hb.hyb && hb.hyb.includes(a.sp)) return 'back';
    if (ha && hb) return 'cross';
    return null;
  };
  const cc0 = P.cotCheck;
  P.cotCheck = c => {
    const a = P.byId(c.a), b = P.byId(c.b); if (!a || !b) return '小屋還沒住滿 2 隻';
    if (a.wq || b.wq) return '等待入住的孩子還不能當爸媽';   // P4.4
    const mk = P.mateKind(a, b);
    if (mk === null) return '牠們處得很好，不過好像不會有寶寶耶';
    if (mk && mk !== 'same' && (P.heart(a.aff) < G.hybHeart || P.heart(b.aff) < G.hybHeart)) return `不同物種要兩隻都 ♡${G.hybHeart} 以上`;
    if (P.coi(a, b) >= G.coiBan) return '牠們是一家人啦';
    if (a.sp !== b.sp) { const sp0 = b.sp; b.sp = a.sp; const r = cc0(c); b.sp = sp0; return r }
    return cc0(c);
  };
  const pc0 = P.pregChance;
  P.pregChance = c => { const r = pc0(c), a = P.byId(c.a), b = P.byId(c.b); if (a && b && a.sp !== b.sp) { r.p *= G.hybCot; r.mul = (r.mul || 1) * G.hybCot; r.d.混血 = '×' + G.hybCot } return r };

  // 寶寶是什麼物種
  const gpSp = (f, m) => { const out = []; for (const p of [f, m]) { const pr = p.par; if (!pr) return null; for (const id of pr) { const x = P.byId(id) || P.S.fam[id]; if (!x) return null; out.push(x.sp) } } return out };
  P.recipeOf = (f, m) => { const g = gpSp(f, m); if (!g || g.length !== 4) return null; const key = g.slice().sort().join(); for (const id in P.HYB) { const h = P.HYB[id]; if (h.recipe && h.recipe.slice().sort().join() === key) return id } return null };
  P.babySp = (f, m, ctx) => {
    const rc = P.recipeOf(f, m); if (rc && (R() * 100 < G.recipe || (ctx && ctx.recipeForce))) return rc;
    const mk = P.mateKind(f, m), r = R() * 100;
    if (mk === '') return f.sp;
    if (mk === 'pure') { const h = P.hybPairOf(f.sp, m.sp); return r < G.hybPure ? h : r < G.hybPure + (100 - G.hybPure) / 2 ? f.sp : m.sp }
    if (mk === 'same') { const h = P.HYB[f.sp]; if (!h.hyb) return f.sp; return r < G.hybSame ? f.sp : r < G.hybSame + (100 - G.hybSame) / 2 ? h.hyb[0] : h.hyb[1] }
    if (mk === 'back') { const hy = P.HYB[f.sp] ? f : m, pu = hy === f ? m : f; return r < G.hybBack ? hy.sp : pu.sp }
    if (mk === 'cross') { if (r < G.hybCross) return f.sp; if (r < G.hybCross * 2) return m.sp; return pick([].concat(P.HYB[f.sp].hyb || [P.baseSp(f.sp)], P.HYB[m.sp].hyb || [P.baseSp(m.sp)])) }
    return f.sp;
  };

  // ---------- 突變 ----------
  P.mutKinds = () => Object.keys(G.mutW);
  P.applyMut = (b, kind) => {
    const S = P.S; kind = kind || (() => { const t = Object.values(G.mutW).reduce((a, x) => a + x, 0); let r = R() * t; for (const k in G.mutW) { if ((r -= G.mutW[k]) < 0) return k } return 'coat' })();
    let txt = '';
    if (kind === 'coat') { const pat = ri(4, 7); b.coat = [pat, pat]; txt = '毛色花紋「' + P.COAT[pat] + '」' }   // 突變一出現就看得到（兩個都是）
    if (kind === 'size') { const c = P.SIZE[b.sp] || 'm'; b.sizeTag = c === 'l' ? 'mini' : c === 's' ? 'giant' : pick(['mini', 'giant']); b.size = b.sizeTag === 'giant' ? 95 : 5; txt = b.sizeTag === 'giant' ? '巨大（體型大一格）' : '迷你（體型小一格）' }
    if (kind === 'tal') { b.tal = pick(AK()); txt = '能力天賦：' + P.abName(b.tal) + ' 長得比較快' }
    if (kind === 'sub') { if (!(b.sub || []).length) P.fillSubs(b); if ((b.sub || []).length) { const i = ri(0, b.sub.length - 1), d = P.SUBS.find(x => x.k === b.sub[i][0]), hi = d.r[Math.max(1, b.tier) - 1][1]; b.sub[i] = [b.sub[i][0], r1(hi * G.subXMul)]; b.subX = i; txt = '天性魔法異彩：' + P.subText(...b.sub[i]) } else return P.applyMut(b, 'coat') }
    if (kind === 'skill') { const n = pick(P.MUTSK); b.sk = b.sk || []; if (b.sk.length && !b.sk.includes(n)) { const old = b.sk[0]; b.sk[0] = n; b.hid = b.hid || []; if (old != null && !b.hid.includes(old)) b.hid.push(old) /* P4：被突變擠掉的技能改成潛藏，不會消失 */ } else if (!b.sk.includes(n)) b.hid.push(n); txt = '突變技能「' + P.SK[n].name + '」' }
    b.mut.push({ k: kind, t: P.now() }); S.mutSeen[kind] = 1; S.mutPity = 0;
    P.emit('mut', `✧ 突變！${P.label(b)}：${txt}`, { id: b.id });
    return txt;
  };

  // ---------- 傳授（教寶寶本事） ----------
  // basket.teach = [第一志願, 第二志願]；值是技能編號，或 'b<頁>'（家傳手札）
  P.teachOptions = (f, m) => {
    const out = [], add = (n, from) => { if (!P.SK[n]) return; const o = out.find(x => x.n === n); if (o) { o.both = 1; o.from += '、' + from } else out.push({ n, from, both: 0 }) };
    for (const p of [f, m]) if (p) { for (const n of p.sk || []) add(n, P.label(p)); for (const n of p.hid || []) add(n, P.label(p) + '（潛藏）') }
    P.S.book.forEach((pg, i) => out.push({ n: pg.n, from: '家傳手札：' + pg.from, book: i }));
    return out;
  };
  const evoOf = (n, f, m) => { const e = P.EVO[n]; if (!e) return n; const hasB = p => (p.sk || []).includes(n); if (!hasB(f) || !hasB(m)) return n; return ((f.mst || {})[n] || 0) + ((m.mst || {})[n] || 0) >= G.evolveSum ? e : n };
  function teachRoll(b, f, m, bk) {
    const T = G.teach, want = (bk.teach && bk.teach.length ? bk.teach : [f.heir, m.heir]).slice(0, 2), got = [], ent = bk.entrust ? T.entrust : 0, log = [];
    // 混合技能：兩個志願剛好是一組、熟練都 ≥60
    const mst = (n) => Math.max((f.mst || {})[n] || 0, (m.mst || {})[n] || 0);
    const mx = P.MIX.find(x => want.length === 2 && ((x.a === want[0] && x.b === want[1]) || (x.a === want[1] && x.b === want[0])));
    if (mx && mst(mx.a) >= G.mixMin && mst(mx.b) >= G.mixMin && R() * 100 < G.mixChance) { got.push([mx.n, 0]); log.push('混合技能 ' + P.SK[mx.n].name); return { got, log } }
    want.forEach((w, slot) => {
      if (w == null) return; let n = w, src = 'one';
      if (typeof w === 'string' && w[0] === 'b') { const pg = P.S.book[+w.slice(1)]; if (!pg) return; n = pg.n; src = 'book' }
      else { const fa = (f.sk || []).concat(f.hid || []).includes(n), ma = (m.sk || []).concat(m.hid || []).includes(n); if (!fa && !ma) return; src = fa && ma ? 'both' : 'one' }
      let ch = T[src][slot]; if (n === f.heir || n === m.heir) ch += T.heir; ch += ent; if (P.SK[n] && P.SK[n].gen === 'mut') ch *= T.mutHalf;
      if (bk.will && slot === 0) ch = 100;   // P4 臨別禮「遺志」：第一志願一定傳到
      ch = Math.min(100, ch);
      const ok = R() * 100 < ch; log.push(`${slot + 1}：${P.SK[n] ? P.SK[n].name : n} ${ch}% → ${ok ? '成功' : '沒傳到'}`);
      if (ok) { if (src !== 'book') n = evoOf(n, f, m); got.push([n, src === 'book' ? (P.S.book[+w.slice(1)] || {}).mst || 0 : (((f.mst || {})[w] || 0) + ((m.mst || {})[w] || 0)) / 2]) }
    });
    return { got, log };
  }

  // ---------- 遺傳：唯一入口（取代 P2 版） ----------
  const inh0 = P.inherit;
  P.inherit = (f, m, ctx) => {
    const I = inh0(f, m, ctx), b = I.baby, S = P.S; ctx = ctx || {};
    // 物種
    b.sp = P.babySp(f, m, ctx);
    if (P.HYB[b.sp] && P.HYB[b.sp].recipe && b.tier < G.recipeMinTier) { b.tier = G.recipeMinTier; b.look = b.tier; I.info.tier = b.tier }
    // 資質：父母都 S → 擲 3 次
    if (f.q === 3 && m.q === 3) { const qb = C.qualBase; const roll = () => { let r = R() * 100; for (let j = 0; j < 4; j++) { if (r < qb[j]) return j; r -= qb[j] } return 3 }; for (let i = 0; i < G.qualSS - 1; i++) b.q = Math.max(b.q, roll()) }
    // 血緣
    const coi = P.coi(f, m); b.coi = coi;
    // 能力：血統值的 70%
    const bf = P.blood(f), bm = P.blood(m); b.ib = {};
    for (const k of AK()) { const base = C.ablBase[b.tier] + ((P.ABIL_SP[b.sp] || []).includes(k) ? C.ablSpBonus : 0); b.ib[k] = r1((G.ablInherit * (bf[k] + bm[k]) / 2 + (G.trInherit || 0) * (((f.tr || {})[k] || 0) + ((m.tr || {})[k] || 0)) / 2) * (G.ablInheritRnd[0] + R() * (G.ablInheritRnd[1] - G.ablInheritRnd[0])) * (coi >= G.coiNear ? G.coiNearMul : 1)); void base }   // P4：訓練練出來的 30% 也會傳（血統值上限不變）
    // 傳承 +N
    b.line = Math.min(G.lineMax, Math.floor(((f.line || 0) + (m.line || 0)) / 2) + (P.done(f) && P.done(m) ? 1 : 0));
    // 方向：50% 父母、30% 個性、20% 隨機
    const dirPick = (i) => { const r = R() * 100; if (r < G.dirParent) { const d = pick([f, m]).dir; if (d) return d[i] } if (r < G.dirParent + G.dirPers) return G.persAbil[b.pers]; return pick(AK()) };
    let d0 = dirPick(0), d1 = dirPick(1); if (d1 === d0) d1 = AK().find(k => k !== d0); b.dir = [d0, d1];
    // 體型值、體型標籤、能力天賦
    b.size = Math.max(0, Math.min(100, Math.round(((f.size ?? 50) + (m.size ?? 50)) / 2 + (R() + R() + R() - 1.5) * G.sizeSd * 2)));
    const tagP = [f, m].filter(p => p.sizeTag && p.sp === b.sp); if (tagP.length && R() * 100 < G.mutInherit) b.sizeTag = pick(tagP).sizeTag;
    const talP = [f, m].filter(p => p.tal); if (talP.length && R() * 100 < G.mutInherit) b.tal = pick(talP).tal;
    // 毛色：父母各給 1 個
    b.coat = [pick(f.coat || [0, 0]), pick(m.coat || [0, 0])];
    // 天性魔法種類遺傳（數值照寶寶位階重擲）
    const pk = [].concat((f.sub || []).map(x => x[0]), (m.sub || []).map(x => x[0])), both = (f.sub || []).map(x => x[0]).filter(k => (m.sub || []).some(y => y[0] === k));
    b.sub = []; const want = b.tier === 3 ? 2 : C.subCount[b.tier];
    for (let i = 0; i < want; i++) { const have = b.sub.map(x => x[0]); const sh = both.filter(k => !have.includes(k)), any = pk.filter(k => !have.includes(k)); let k = null; if (sh.length && R() * 100 < G.subKindBoth) k = pick(sh); else if (any.length && R() * 100 < G.subKind) k = pick(any); if (k) { const s = P.SUBS.find(x => x.k === k), [lo, hi] = s.r[Math.max(1, b.tier) - 1]; b.sub.push([k, r1(lo + R() * (hi - lo))]) } }
    // 技能：傳授（取代 P2 的家傳技直接繼承）
    b.sk = []; b.hid = []; b.mst = {};
    const bk = ctx.bk || {}; const T = teachRoll(b, f, m, bk); I.info.teach = T.log;
    T.got.forEach(([n, ms], slot) => { const s = P.SK[n]; if (!s || b.sk.includes(n) || b.hid.includes(n)) return; const pass = bk.entrust ? 1 : G.mstPass; b.mst[n] = Math.round(ms * pass); if (s.tier <= b.tier && b.sk.length < C.slots[b.tier]) b.sk.push(n); else b.hid.push(n) });
    b.par = [f.id, m.id]; b.gp = [].concat(f.par || [0, 0], m.par || [0, 0]).slice(0, 4);
    I.info.coi = coi; I.info.sp = b.sp;
    return I;
  };

  // 出生：照常，再加突變、混血紀錄、月光露、配方保底、家傳手札用掉
  const birth0 = P.birth;
  P.birth = (c, k) => {
    const S = P.S, bk = c.basket || {}, f = P.byId(bk.a), m = P.byId(bk.b);
    const rc = f && m ? P.recipeOf(f, m) : null; if (rc) { const r = S.recipe[rc] = S.recipe[rc] || { tries: 0, done: 0 }; r.tries++; if (!r.done && r.tries >= G.recipeGuarantee) bk.recipeForce = 1 }
    const pre = new Set(S.babies.map(b => b.id));
    P._bk = bk; const out = birth0(c, k); P._bk = null;
    let anyMut = 0;
    out.forEach((b, i) => {
      P.genInit(b);
      if (P.HYB[b.sp]) { const first = !S.hybSeen[b.sp]; S.hybSeen[b.sp] = (S.hybSeen[b.sp] || 0) + 1; P.codexSee(b.sp, b.look, b.star); P.emit('hyb', `${first ? '🎉 第一次！' : ''}生出了${P.SP[b.sp].name}（${P.HYB[b.sp].recipe ? '四祖配方' : '混血'}）`, { id: b.id }); if (P.HYB[b.sp].recipe && S.recipe[b.sp]) S.recipe[b.sp].done = 1 }
      // 突變：3%；近親 ×1.5；月光露 ×4 且至少 1 隻；50 隻保底
      // P4：隔代種子（爸媽任一位帶著）→ ×2；保底改成三層隱藏計數（同一對父母／同種族蛋數／全收容所）
      let ch = G.mut * (b.coi >= G.coiNear ? G.mutCoi : 1) * (bk.pollen ? G.moonMul : 1) * ((f && f.seed) || (m && m.seed) ? G.seedMul : 1);
      const layer = P.pityStep ? P.pityStep(f, m, b) : null;
      const nat = R() * 100 < ch; let hit = nat || !!layer;
      if (!nat && layer) b.mutBy = layer;   // 只記在寶寶身上（只有測試面板看得到，遊戲畫面不顯示）
      if (!hit && bk.pollen && !anyMut && i === out.length - 1) hit = true;
      if (hit) { anyMut = 1; P.applyMut(b, bk.mutKind || null); if (P.pityReset) P.pityReset(f, m, b) }
      if (P.birthP4) P.birthP4(b, f, m, bk);
      P.famRec(b);
    });
    // 用掉的手札頁
    if (bk.teach) { const pages = bk.teach.filter(w => typeof w === 'string' && w[0] === 'b').map(w => +w.slice(1)).sort((a, b) => b - a); for (const i of pages) S.book.splice(i, 1) }
    // 託付：那位父母出門闖闖
    if (bk.entrust) { const p = P.byId(bk.entrust); if (p) { P.sendOff(p); S.sent = null; P.emit('send', `${P.label(p)} 把本事託付給孩子，自己出門闖闖了`) } }
    if (P.departP4) P.departP4(bk);   // P4：爸媽出門闖蕩（玩家選的、或爸媽自己開口問的）
    return out;
  };
  // 讓 P2 的 birth 呼叫 inherit 時帶到育兒籃（傳授、託付）
  const inh1 = P.inherit; P.inherit = (f, m, ctx) => inh1(f, m, Object.assign({}, ctx, { bk: P._bk || (ctx && ctx.bk) || {}, recipeForce: P._bk ? P._bk.recipeForce : ctx && ctx.recipeForce, forceSp: P._bk ? P._bk.forceSp : ctx && ctx.forceSp }));

  // ---------- 潛藏技能：有格子就先補 ----------
  P.fillSkills = p => { p.sk = p.sk || []; P.genInit(p); while (p.sk.length < C.slots[p.tier]) { const i = p.hid.findIndex(n => P.SK[n] && P.SK[n].tier <= p.tier && !p.sk.includes(n)); if (i >= 0) { const n = p.hid.splice(i, 1)[0]; p.sk.push(n); P.emit('skill', `${P.label(p)} 覺醒了潛藏的本事：${P.SK[n].name}`); continue } const n = P.rollSkill(p, -1); if (!n) break; p.sk.push(n) } };
  // 洗掉異彩那條 → 異彩沒了
  const rs0 = P.rerollSub; P.rerollSub = (p, i, pay) => { const r = rs0(p, i, pay); if (r && r.ok && p.subX === i) { p.subX = -1; P.emit('mut', `${P.label(p)} 的天性魔法異彩被洗掉了`) } return r };

  // ---------- 熟練：出戰用到 +3 ----------
  const fe0 = P.fightEnd;
  P.fightEnd = r => {
    fe0(r); const S = P.S, p = P.byId(S.eq); if (!p) return; P.genInit(p); p.peak = Math.max(p.peak || 1, p.lv || 1);
    const used = (P.arena && P.arena.used) || r.used || {};
    for (const n of p.sk || []) { const s = P.SK[n]; const act = used[n] || ['func', 'pick', 'mix'].includes(s.cat) && !s.cd; if (act) p.mst[n] = Math.min(100, (p.mst[n] || 0) + G.mstFight) }
  };
  const up0 = P.upgrade; P.upgrade = p => { const r = up0(p); p.peak = Math.max(p.peak || 1, p.lv || 1); return r };

  // ---------- 家傳手札（放出去闖闖前抄 1 個技能） ----------
  P.bookCap = () => P.S.fac && P.S.fac.shop ? G.bookPagesShop : G.bookPages;
  P.copyToBook = (p, n) => {
    const S = P.S; if (!(p.sk || []).includes(n)) return { ok: 0, msg: '牠沒有這個技能' };
    if (S.book.length >= P.bookCap()) return { ok: 0, msg: `手札寫滿了（${P.bookCap()} 頁）` };
    if (S.disk < G.bookCost) return { ok: 0, msg: `要技能磁片 ${G.bookCost}` };
    S.disk -= G.bookCost; S.book.push({ n, mst: (p.mst || {})[n] || 0, from: P.label(p), t: P.now() }); P.emit('book', `把 ${P.label(p)} 的「${P.SK[n].name}」抄進家傳手札`); return { ok: 1 };
  };

  // ---------- 家譜（往上 3 代） ----------
  const fr0 = P.famRec;
  P.famRec = p => { fr0(p); if (!p) return; const r = P.S.fam[p.id]; P.genInit(p); Object.assign(r, { sk: [].concat(p.sk || [], p.hid || []).filter(n => n < 100), coat: p.coat, line: p.line || 0, hyb: P.HYB[p.sp] ? 1 : 0, mutN: (p.mut || []).length, sizeTag: p.sizeTag || '', med: (p.medals || []).length, best: ((p.medals || []).slice().sort((a, b) => a.pl - b.pl)[0] || {}).name || '', champ: (p.medals || []).filter(x => x.pl === 1).length }) };
  P.where = id => { const S = P.S; if (S.pets.some(p => p.id === id) || S.babies.some(p => p.id === id)) { const p = P.byId(id); return p.away ? '出門（集訓／探險）' : p.wq ? '在收容所（等待入住）' : '在收容所' } if ((S.stay || []).some(p => p.id === id)) return '寄放在蜜糖媽媽那裡'; return S.fam[id] ? '出門闖闖了' : '不知道' };
  P.tree = id => {   // 14 格：父母 2、祖父母 4、曾祖父母 8
    const lv = [[id]]; for (let g = 0; g < 3; g++) { const nx = []; for (const x of lv[g]) { const pr = x ? parOf(x) : null; nx.push(pr ? pr[0] : 0, pr ? pr[1] : 0) } lv.push(nx) }
    return lv.map(row => row.map(x => x ? P.famOf(x) : null));
  };
  P.noble = id => { const t = P.tree(id); let n = 0; for (let g = 1; g < 4; g++) for (const r of t[g]) if (r) n += r.champ || 0; return n >= 5 };

  // ---------- 畫圖：混血用原物種骨架＋換色＋疊層、毛色、體型值 ----------
  P.genArt = () => {
    const A = P.art; if (!A || A._gen) return; A._gen = 1;
    const sf0 = A.setFor; A.setFor = sp => { const h = P.HYB[sp]; if (A.sets[sp]) return sf0(sp); if (h && A.sets[h.base]) return { sp: h.base, set: A.sets[h.base], tint: true }; return sf0(sp) };
    for (const fn of ['meta', 'fps', 'headTop']) { const o = A[fn]; if (o) A[fn] = (sp, ...r) => o(P.HYB[sp] && !A.sets[sp] ? P.HYB[sp].base : sp, ...r) }
    const dr0 = A.draw;
    const FILT = ['', 'brightness(0.72) saturate(1.15)', 'brightness(1.18) saturate(0.7)', 'grayscale(0.9) brightness(1.5)'];
    A.draw = (ctx, p, x, y, o) => {
      o = Object.assign({}, o || {}); if (p.size != null) o.scale = (o.scale || 2) * P.drawScale(p);
      const cs = p.coat ? P.coatShow(p) : 0, shiny = p.star === 2;
      if (cs && cs <= 3 && !shiny) { ctx.save(); ctx.filter = FILT[cs]; dr0(ctx, p, x, y, o); ctx.restore() } else dr0(ctx, p, x, y, o);
      const sc = o.scale || 2, top = y - 40 * sc / 2 - 20;
      // P5.2：混種頭上記號已拿掉（專屬外觀下一步再做）
      // 突變花紋（暫用）：身上的小點
      if (cs >= 4) { ctx.save(); ctx.globalAlpha = 0.85; const col = { 4: '#ffe36b', 5: '#ffffff', 6: '#1A1016', 7: '#7a4a22', 8: '#9fe8ff' }[cs]; ctx.fillStyle = col; for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x - 14 * sc / 2 + i * 8 * sc / 2), Math.round(y - 22 * sc / 2 - (i % 2) * 6), 3 * sc / 2, 3 * sc / 2); ctx.restore() }
    };
  };
  P.genArt();
})(window.PET);
// 被抓起來又放下時的泡泡（照性格）
(function (P) {
  if (!P.LINES) return;
  P.LINES.drag = {
    活潑: ['哇哈哈！再一次！再一次！', '飛起來了！我是鳥！', '放我下來我自己跑啦～', '咻——好好玩！'],
    溫和: ['嗯……輕一點喔。', '好，我在這裡等就好。', '被抱起來，有一點點不好意思。', '謝謝你帶我過來。'],
    貪吃: ['是要帶我去吃東西嗎？', '這裡有點心嗎？沒有？', '抱我的手……聞起來有麵包味。', '下次放我在飯碗旁邊嘛。'],
    愛睡: ['呼……剛剛在作夢……', '放我在軟軟的地方就好……', '晃得好想睡……', '嗯……到了嗎……'],
    好奇: ['從上面看，院子好大！', '咦？這邊有什麼新東西？', '剛剛那個角度看得到屋頂耶！', '再高一點，我想看看外面！'],
  };
})(window.PET);
