// P4：探險隊（真關卡）規則、爸媽出門與臨別禮、突變三層隱藏保底、技能位階（含隔代覺醒）
// 純規則（不碰畫面），unit.mjs 也會載入；數字都在 pet_data.js 的 P.CFG.gen（P4 區）
'use strict';
(function (P) {
  const C = P.CFG, G = C.gen, R = () => P.rand(), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = a => a[Math.floor(R() * a.length)];
  const wpick = o => { const t = Object.values(o).reduce((a, x) => a + x, 0); let r = R() * t; for (const k in o) { if ((r -= o[k]) < 0) return k } return Object.keys(o)[0] };

  // ---------- 存檔 ----------
  const mig0 = P.migrate;
  P.migrate = S => {
    mig0(S); S.mat.proof = S.mat.proof || 0;
    S.mp = S.mp || { pair: {}, sp: {}, all: 0, th: { pair: {}, sp: {}, all: 0 } };
    // P3 的假關卡 → 真關卡
    const MAP = { s1: 'canyon', s3: 'mine', s4: 'spider', s5: 'crystal' };
    if (S.exp) { for (const t of S.exp.teams || []) if (MAP[t.sk]) t.sk = MAP[t.sk]; for (const l of S.exp.log || []) if (MAP[l.k]) l.k = MAP[l.k] }
    return S;
  };
  const ns0 = P.newState; P.newState = () => Object.assign(ns0(), { mp: { pair: {}, sp: {}, all: 0, th: { pair: {}, sp: {}, all: 0 } } });

  // ---------- 突變：三層隱藏保底 ----------
  // 門檻在第一次用到時從範圍裡擲一次、存起來（玩家看不到，每次觸發後重擲）
  const pairKey = (f, m) => [f ? f.id : 0, m ? m.id : 0].sort((a, b) => a - b).join('-');
  const thRoll = k => { const r = { pair: G.pityPair, sp: G.pitySp, all: G.pityAll }[k]; return ri(r[0], r[1]) };
  const mp = () => { const S = P.S; if (!S.mp) S.mp = { pair: {}, sp: {}, all: 0, th: { pair: {}, sp: {}, all: 0 } }; return S.mp };
  P.pityTh = (layer, key) => { const M = mp(); if (layer === 'all') return M.th.all || (M.th.all = thRoll('all')); const t = M.th[layer]; return t[key] || (t[key] = thRoll(layer)) };
  // 每生一隻蛋：三個計數各 +1；回傳哪一層到了（同時到就算最小的那層）
  P.pityStep = (f, m, b) => {
    const M = mp(), pk = pairKey(f, m), sk = P.baseSp ? b.sp : b.sp;
    M.pair[pk] = (M.pair[pk] || 0) + 1; M.sp[sk] = (M.sp[sk] || 0) + 1; M.all = (M.all || 0) + 1;
    if (M.pair[pk] >= P.pityTh('pair', pk)) return 'pair';
    if (M.sp[sk] >= P.pityTh('sp', sk)) return 'sp';
    if (M.all >= P.pityTh('all')) return 'all';
    return null;
  };
  // 突變出現：這一對、這個種族、全收容所的計數歸零，門檻重擲
  P.pityReset = (f, m, b) => { const M = mp(), pk = pairKey(f, m); M.pair[pk] = 0; delete M.th.pair[pk]; M.sp[b.sp] = 0; delete M.th.sp[b.sp]; M.all = 0; M.th.all = 0 };
  // 西施的「感覺」：只回傳台詞，不給數字；接近門檻（75%）才說，偶爾也會亂猜
  const HINT = {
    pair: n => [`這對小倆口……感覺快有什麼不一樣的事了？`, `${n}這一對最近的寶寶，眼神有點特別呢……是我想太多嗎？`, `每次看${n}的育兒籃，總覺得下一籃會有驚喜……說不準啦。`],
    sp: n => [`最近的${n}寶寶……好像有哪裡在悄悄變化，說不上來。`, `${n}的毛色最近是不是在醞釀什麼？也可能只是光線啦。`],
    all: () => [`收容所最近的空氣怪怪的，好像有什麼要發生……也可能是我想太多。`, `小貓頭鷹說今晚的月亮特別亮。會不會有什麼不一樣的寶寶要來呀？`],
  };
  P.pityNear = (f, m, sp) => {
    const M = mp(), out = [];
    if (f && m) { const pk = pairKey(f, m); if ((M.pair[pk] || 0) >= P.pityTh('pair', pk) * G.pityHint) out.push('pair') }
    if (sp && (M.sp[sp] || 0) >= P.pityTh('sp', sp) * G.pityHint) out.push('sp');
    if ((M.all || 0) >= P.pityTh('all') * G.pityHint) out.push('all');
    return out;
  };
  // 給一句西施的話（或 null）。force＝測試用
  P.pityHint = (f, m, sp, force) => {
    const near = P.pityNear(f, m, sp); let k = near[0];
    if (!k && (force || R() * 100 < G.pityHintFake)) k = f && m ? 'pair' : sp ? 'sp' : 'all';   // 還很遠也偶爾這樣說，讓玩家拿不準
    if (!k) return null;
    const nm = k === 'pair' ? `${P.label(f)}和${P.label(m)}` : k === 'sp' ? (P.SP[sp] || {}).name || '' : '';
    return ['西施', pick(HINT[k](nm))];
  };
  // 收容所裡哪一對／哪個種族最接近（給櫃檯、出生後的閒聊用）
  P.pityHintAny = () => {
    const S = P.S; for (const c of S.cots) { const f = P.byId(c.a), m = P.byId(c.b); if (f && m && P.pityNear(f, m, null).includes('pair')) return P.pityHint(f, m, null) }
    const M = mp(); for (const sp in M.sp) if (P.pityNear(null, null, sp).includes('sp')) return P.pityHint(null, null, sp);
    if (P.pityNear(null, null, null).includes('all')) return P.pityHint(null, null, null);
    return null;
  };

  // ---------- 爸媽出門：玩家選，或爸媽自己開口 ----------
  P.FAREWELL = {
    bless: { name: '臨別祝福', txt: '每隻寶寶都有 1 條天性魔法，一定落在比較好的那一半' },
    will: { name: '遺志', txt: '第一志願的技能一定教得會（100%）' },
    mark: { name: '血統印記', txt: `寶寶的傳承多 1 級（能力上限再高 ${Math.round(P.CFG.gen.lineStep * 100)}%），最高可以到 ${P.CFG.gen.lineMax + 1} 級（平常是 ${P.CFG.gen.lineMax} 級）` },
    memento: { name: '旅途紀念', txt: '寶寶得到專屬外觀「旅途紀念・小包袱」（只有牠能戴）' },
    seed: { name: '隔代種子', txt: '寶寶將來生的孩子，突變機率 ×2' },
  };
  P.LOOKS.journey = '旅途紀念・小包袱';
  // 育兒籃出現後擲一次：其中一位爸媽想出門闖闖
  P.askRoll = (c, force) => {
    const bk = c && c.basket; if (!bk || bk.askR) return null; bk.askR = 1;
    const f = P.byId(bk.a), m = P.byId(bk.b); if (!f || !m) return null;
    const h = (P.heart(f.aff || 0) + P.heart(m.aff || 0)) / 2, ch = Math.min(G.askMax, G.askBase + G.askPerHeart * h);
    if (!force && !(R() * 100 < ch)) return null;
    const who = pick([f, m].filter(p => p.id !== bk.entrust)) || f;
    bk.ask = { id: who.id, st: 0 }; P.emit('ask', `${P.label(who)} 想在孩子出生後出門闖闖（等主人回答）`); return bk.ask;
  };
  P.askAnswer = (c, yes, giftForce) => {
    const bk = c && c.basket; if (!bk || !bk.ask || bk.ask.st) return null; const p = P.byId(bk.ask.id);
    if (!yes) { bk.ask.st = 'no'; P.emit('ask', `${p ? P.label(p) : '牠'} 留下來了`); return { st: 'no' } }
    const g = giftForce || wpick(G.farewellW); bk.ask.st = 'yes'; bk.gift = g; bk.giftFrom = bk.ask.id; bk.go = bk.go || {}; bk.go[bk.ask.id] = 'wander';
    if (g === 'will') bk.will = 1;
    P.emit('ask', `${p ? P.label(p) : '牠'} 留下了臨別禮「${P.FAREWELL[g].name}」，孩子出生那天就出門`); return { st: 'yes', gift: g };
  };
  P.setGo = (c, id, v) => { const bk = c && c.basket; if (!bk) return; bk.go = bk.go || {}; if (bk.ask && bk.ask.st === 'yes' && bk.ask.id === id) return; bk.go[id] = v; if (v !== 'entrust' && bk.entrust === id) bk.entrust = 0; if (v === 'entrust') { const o = bk.entrust; bk.entrust = id; if (o && o !== id) bk.go[o] = 'stay' } };
  P.goOf = (bk, id) => bk.entrust === id ? 'entrust' : (bk.go || {})[id] || 'stay';
  // 出生時：每隻寶寶套上臨別禮
  P.birthP4 = (b, f, m, bk) => {
    const g = bk.gift; b.gift = g || null;
    if (g === 'bless' && (b.sub || []).length) { const i = ri(0, b.sub.length - 1); b.sub[i] = P.rollSubUpper(b, b.sub[i][0]); b.blessI = i }
    if (g === 'mark') { b.lineX = 1; b.line = Math.min(G.lineMax + 1, (b.line || 0) + 1) }
    if (g === 'memento') b.looksOwn = ['journey'];
    if (g === 'seed') b.seed = 1;
    if (f && m) P.atavRoll(b, f, m);
  };
  // 寶寶出生後：選了「闖蕩」或答應了的爸媽出門（跟一般放出去闖闖一樣：明信片、幸福信、名聲）
  P.departP4 = bk => {
    const S = P.S; for (const id of [bk.a, bk.b]) { if (id === bk.entrust) continue; if ((bk.go || {})[id] !== 'wander') continue; const p = P.byId(id); if (!p) continue;
      P.sendOff(p); S.sent = null; P.emit('send', bk.giftFrom === id ? `${P.label(p)} 留下臨別禮「${P.FAREWELL[bk.gift].name}」，出門闖蕩了` : `${P.label(p)} 看著孩子出生，放心地出門闖蕩了`) }
  };

  // ---------- 技能位階 ----------
  P.SKT = { normal: { name: '一般技', col: '#8a8590', txt: '可以洗出來，也可以洗掉' }, rare: { name: '稀有技', col: '#2f8fd8', txt: '洗技能時極低機率（0.5%）出現；突變也會帶來' }, blood: { name: '血脈技', col: '#c0392b', txt: '只能靠遺傳（爸媽都很熟練才會進化）' }, fusion: { name: '融合技', col: '#8e44ad', txt: '只能把爸媽練熟的兩招融合出來' }, atav: { name: '隔代覺醒', col: '#d4a017', txt: '魔力隔代：祖父母會、爸媽不會的本事，偶爾在孫輩身上醒過來' } };
  P.skTier = n => { const s = P.SK[n]; if (!s) return 'normal'; return { mut: 'rare', evo: 'blood', mix: 'fusion', atav: 'atav' }[s.gen] || 'normal' };
  P.skLocked = n => ['blood', 'fusion', 'atav'].includes(P.skTier(n));
  P.skTag = n => { const t = P.SKT[P.skTier(n)]; return `<span class="skt skt-${P.skTier(n)}" style="background:${t.col}" title="${t.txt}">${t.name}</span>` };
  // 隔代覺醒版本：1～71 的一般技都有「X・祖靈」（威力 ×1.15，只能靠隔代覺醒得到）
  P.ATAV = {};
  for (const s of P.SKILLS.slice()) { if (s.n >= 100 || s.gen) continue; const n = 500 + s.n; P.SKILLS.push(P.SK[n] = Object.assign({}, s, { n, name: s.name + '・祖靈', w: 0, desc: s.desc + `｜隔代覺醒：威力 ×${G.atavMul}`, atav: s.n, use: [[s.n, G.atavMul]], gen: 'atav' })); P.ATAV[s.n] = n }
  // 爸媽都沒有、祖父母有的一般技 → 10% 在寶寶身上覺醒（最多 1 招）
  P.atavCand = (f, m) => {
    const S = P.S, par = new Set([].concat(f.sk || [], f.hid || [], m.sk || [], m.hid || []).map(n => P.SK[n] && P.SK[n].atav || P.SK[n] && P.SK[n].evo || n));
    const gp = [].concat(f.par || [], m.par || []).filter(Boolean), out = [];
    for (const id of gp) { const r = S.fam[id] || {}, live = P.byId(id); const sk = live ? [].concat(live.sk || [], live.hid || []) : r.sk || []; for (const n of sk) if (n < 100 && P.ATAV[n] && !par.has(n) && !out.includes(n)) out.push(n) }
    return out;
  };
  P.atavRoll = (b, f, m, force) => {
    const c = P.atavCand(f, m); if (!c.length) return null;
    if (!force && !(R() * 100 < G.atav)) return null;
    const n = P.ATAV[pick(c)]; b.sk = b.sk || []; b.hid = b.hid || []; if (b.sk.includes(n) || b.hid.includes(n)) return null;
    if (P.SK[n].tier <= b.tier && b.sk.length < C.slots[b.tier]) b.sk.push(n); else b.hid.push(n);
    b.atav = n; P.emit('mut', `✦ 隔代覺醒！${P.label(b)} 身上醒來了祖父母的本事「${P.SK[n].name}」`, { id: b.id }); return n;
  };
  // 洗技能：血脈／融合／隔代那一格不能洗；一般洗的時候 0.5% 洗出稀有技
  const rr0 = P.reroll;
  P.reroll = (p, slot, payWith) => {
    const cur = (p.sk || [])[slot]; if (cur != null && P.skLocked(cur)) return { ok: 0, msg: `「${P.SK[cur].name}」是${P.SKT[P.skTier(cur)].name}，洗不掉，也洗不出來` };
    const r = rr0(p, slot, payWith); if (!r || !r.ok || r.choose) return r;
    if (R() * 100 < G.rareRoll) { const pool = P.MUTSK.filter(n => !p.sk.includes(n) && !(p.hid || []).includes(n)); if (pool.length) { const n = pick(pool); p.sk[slot] = n; r.n = n; r.rare = 1; P.emit('skill', `✧ ${P.label(p)} 洗出了稀有技「${P.SK[n].name}」！`) } }
    return r;
  };
  // 一般洗技能的池子不含「只能遺傳／突變／隔代」的技能（權重 0 的）
  const sw0 = P.skillWeights; P.skillWeights = (p, slot) => sw0(p, slot).filter(x => x.w > 0 && !['evo', 'mix', 'mut', 'atav'].includes(x.s.gen));
  // 突變技能：P4 四招都做好了
  for (const n of P.MUTSK) P.SK[n].impl = true;

  // ---------- 彩虹月光露：傳說之證換 ----------
  P.tradeRainbow = () => { const S = P.S; if ((S.mat.proof || 0) < G.rainbowTrade) return { ok: 0, msg: `傳說之證要 ${G.rainbowTrade} 張` }; S.mat.proof -= G.rainbowTrade; S.mat.rainbow++; P.seen('rainbow'); P.emit('mat', `用 ${G.rainbowTrade} 張傳說之證換了 1 瓶彩虹月光露`); return { ok: 1 } };
})(window.PET);
