// 突變寵物企劃驗證（不進正式版）：node mutation_sim.js [玩家數]
// 對應 design/pet_mutations_zh.md（v3）。①～④＋⑤一般玩家的寵物名單。原本三部分：①一年會遇到幾次各階突變 ②體質遺傳會不會越養越多／越疊越強 ③寵物能力（聖體成長 ×1.25、零魔力分給主人 15%）會不會破上限
'use strict';
const N = +process.argv[2] || 2000;
let seed = +process.argv[3] || 20261103;   // v3：舊的亂數（乘法超過 JS 整數精度）會讓結果偏掉，改成 mulberry32
const R = () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const wpick = o => { const t = Object.values(o).reduce((a, b) => a + b, 0); let r = R() * t; for (const k in o) if ((r -= o[k]) < 0) return k; return Object.keys(o)[0] };
// ---- 現有 P4 數字 ----
const MUT = 3, COI = 1.5, MOON = 4, PITY = { pair: [10, 14], sp: [24, 32], all: [44, 56] };
// ---- 本企劃新增 ----
const TIER_W = {                       // 突變發生以後擲「哪一階」
  nat: { fan: 74, xi: 18, curse: 7, leg: 1.0 },        // 自然突變（3%）；v2：傳說 0.6 → 1.0
  pity: { fan: 84, xi: 14, curse: 1.5, leg: 0.5 }, // v3：三層保底觸發的也有一點點機會出咒印、傳說（「都要有希望」）
  dew: { fan: 57, xi: 30, curse: 10, leg: 3 },     // 月光露那一籃；v2：傳說 2 → 3
};
const XI = { crystal: 40, eye: 20, moss: 20, wind: 20 }, LEG = { saint: 50, dragon: 50 }, CURSE = { nomana: 30, rage: 25, shadow: 25, stone: 20 };
// v2：傳說的隱藏保底「天命」（第四層，算蛋數）：到門檻以後，下一次突變（不管怎麼來的）直接變成傳說。第一次門檻較短，之後變長
const LEG_PITY = { first: [220, 340], next: [900, 1100] };   // v3：第一次 200～320 → 220～340（保底也能出傳說後，往後挪回 3 個月）；之後的門檻 700～900 → 900～1100（保底、彩虹、血脈都多了一點傳說的機會）
// v3：彩虹月光露選的那個突變有 8% 「昇華」成見過的傳說；魔晶碎屑（第三～五關探險掉，每次探險 SHARD%），放進下一籃，那籃擲到稀異就一定是那色魔晶
const RAIN_UP = 8, SHARD = 10, EXPED = { casual: 3, heavy: 6 };
const ELEM = ['fire', 'ice', 'bolt', 'venom', 'shade', 'holy', 'earth'];
const INH = { xi: [12, 30], curse: [10, 25], dragon: [8, 20], saint: [6, 12], rainbowHeart: 8, ancestor: 5 };   // v3：體質要是少數 → 遺傳調低（v2 是 25/50、30/55、12/30）；聖體直接遺傳 6/12（取消聖痕）
// v3：血脈共鳴。共鳴分＝爸媽有同一系體質每位 2 分＋祖父母每位 1 分（0～8）。同體質遺傳 +1.5%/分（最多 +9%）；直接昇成該系傳說 0.5%/分（最多 3%）
const RES = { inhPer: 1.5, inhCap: 9, upPer: 0.5, upCap: 3 };

// ========== ① 一年的頻率 ==========
function year(type) {
  const P = type === 'heavy' ? { egg: 6, cots: 4, dew: 3, rain: 2 } : { egg: 3, cots: 2, dew: 1, rain: 0.3 };
  const M = { pair: {}, sp: {}, all: 0, th: { pair: {}, sp: {}, all: 0 } };
  const th = (l, k) => l === 'all' ? (M.th.all || (M.th.all = ri(...PITY.all))) : (M.th[l][k] || (M.th[l][k] = ri(...PITY[l])));
  const cots = Array.from({ length: P.cots }, (_, i) => ({ pair: 'p' + i + '_0', sp: ri(0, 9), n: 0, gen: 0 }));
  const out = { eggs: 0, mut: 0, fan: 0, xi: 0, curse: 0, leg: 0, firstLeg: -1, firstXi: -1, byPity: 0, rainbow: 0, legByPity: 0, legRain: 0, shardGot: 0, shardCrys: 0, crys: 0 };
  let shards = 0;
  let legN = 0, legTh = ri(...LEG_PITY.first), legGot = 0;
  let ci = 0;
  for (let day = 0; day < 365; day++) {
    for (let e = 0; e < EXPED[type]; e++) if (R() * 100 < SHARD * 0.5) { shards++; out.shardGot++ }   // 一半的探險去第三～五關
    if (R() < P.rain / 365) {   // 彩虹月光露：選一個見過的非傳說突變，8% 昇華
      out.rainbow++; out.mut++; if (out.leg > 0 && R() * 100 < RAIN_UP) { out.leg++; out.legRain++; legN = 0; legTh = ri(...LEG_PITY.next) } else out.fan++;
    }
    let left = P.egg;
    while (left > 0) {
      const c = cots[ci++ % cots.length]; const n = Math.min(left, (r => r < .4 ? 1 : r < .8 ? 2 : 3)(R())); left -= n;
      if (++c.n > 8) { c.n = 1; c.gen++; c.pair = c.pair.split('_')[0] + '_' + c.gen; if (R() < .3) c.sp = ri(0, 9) }   // 8 籃換一對新爸媽
      const dew = R() < P.dew / 30 / (P.egg / 1.8 / 1) * 1; const coi = R() < .2;
      let any = 0; const sh = shards > 0 ? (shards--, 1) : 0;
      for (let j = 0; j < n; j++) {
        out.eggs++; legN++; M.pair[c.pair] = (M.pair[c.pair] || 0) + 1; M.sp[c.sp] = (M.sp[c.sp] || 0) + 1; M.all++;
        const nat = R() * 100 < MUT * (coi ? COI : 1) * (dew ? MOON : 1);
        let layer = M.pair[c.pair] >= th('pair', c.pair) ? 'pair' : M.sp[c.sp] >= th('sp', c.sp) ? 'sp' : M.all >= th('all') ? 'all' : null;
        let hit = nat || layer, src = dew ? 'dew' : nat ? 'nat' : 'pity';
        if (!hit && dew && !any && j === n - 1) { hit = 1; src = 'dew' }
        if (!hit) continue;
        any = 1; out.mut++; if (src === 'pity') out.byPity++;
        let t = wpick(TIER_W[src]);
        if (t !== 'leg' && legN >= legTh) { t = 'leg'; out.legByPity++ }
        out[t]++; if (t === 'xi') { const cr = sh || R() < .4; if (cr) { out.crys++; if (sh) out.shardCrys++ } }
        if (t === 'leg') { legGot++; legN = 0; legTh = ri(...LEG_PITY.next) }
        if (t === 'leg' && out.firstLeg < 0) out.firstLeg = day; if (t === 'xi' && out.firstXi < 0) out.firstXi = day;
        M.pair[c.pair] = 0; delete M.th.pair[c.pair]; M.sp[c.sp] = 0; delete M.th.sp[c.sp]; M.all = 0; M.th.all = 0;
      }
    }
  }
  return out;
}
console.log(`=== ① 一年頻率（${N} 位玩家 × 365 天）===`);
for (const type of ['casual', 'heavy']) {
  const s = { eggs: 0, mut: 0, fan: 0, xi: 0, curse: 0, leg: 0, byPity: 0, legByPity: 0, legRain: 0, rainbow: 0, shardGot: 0, shardCrys: 0, crys: 0 }, firstLeg = [], firstXi = []; let noLeg = 0;
  for (let i = 0; i < N; i++) { const o = year(type); for (const k in s) s[k] += o[k] / N; if (o.firstLeg < 0) noLeg++; else firstLeg.push(o.firstLeg); if (o.firstXi >= 0) firstXi.push(o.firstXi) }
  const med = a => { a.sort((x, y) => x - y); return a.length ? a[a.length >> 1] : -1 };
  const pct = (a, q) => { const all = a.slice().concat(Array(noLeg).fill(9999)).sort((x, y) => x - y); const v = all[Math.floor(all.length * q)]; return v >= 9999 ? '超過一年' : '第 ' + v + ' 天' };
  console.log(`${type === 'heavy' ? '認真玩家（每天 6 顆蛋、4 間小屋、月光露每月 3 瓶）' : '一般玩家（每天 3 顆蛋、2 間小屋、月光露每月 1 瓶）'}`);
  console.log(`  一年 ${s.eggs.toFixed(0)} 顆蛋｜突變 ${s.mut.toFixed(1)} 隻（每顆 ${(s.mut / s.eggs * 100).toFixed(2)}%，其中保底觸發 ${(s.byPity / s.mut * 100).toFixed(0)}%）`);
  console.log(`  凡異 ${s.fan.toFixed(1)}｜稀異 ${s.xi.toFixed(1)}｜咒印 ${s.curse.toFixed(2)}｜傳說 ${s.leg.toFixed(2)}（每顆 ${(s.leg / s.eggs * 100).toFixed(3)}%）`);
  const rnd = s.mut - s.rainbow - s.shardCrys;
  console.log(`  出生就帶體質（稀異＋咒印＋傳說）佔全部蛋 ${((s.xi + s.curse + s.leg) / s.eggs * 100).toFixed(2)}%｜彩虹月光露 ${s.rainbow.toFixed(2)} 瓶（昇華成傳說 ${s.legRain.toFixed(3)}）`);
  console.log(`  魔晶碎屑一年 ${s.shardGot.toFixed(1)} 顆｜魔晶 ${s.crys.toFixed(1)} 隻，其中碎屑決定顏色的 ${s.shardCrys.toFixed(2)} 隻｜自己選的（彩虹＋碎屑）${(s.rainbow + s.shardCrys).toFixed(2)} 隻 vs 隨機 ${rnd.toFixed(1)} 隻（${((s.rainbow + s.shardCrys) / rnd * 100).toFixed(1)}%）`);
  console.log(`  傳說裡由「天命」保底給的 ${(s.legByPity / s.leg * 100).toFixed(0)}%｜第一隻稀異中位數：第 ${med(firstXi)} 天`);
  console.log(`  第一隻傳說（全部玩家）：25% ${pct(firstLeg, .25)}｜中位數 ${pct(firstLeg, .5)}｜75% ${pct(firstLeg, .75)}｜90% ${pct(firstLeg, .9)}｜一年都沒有 ${(noLeg / N * 100).toFixed(1)}%`);
}

// ========== ② 體質遺傳＋血脈共鳴：認真挑種 10 代 ==========
// 每代：2 間小屋各 2 籃（一胎 1～3 隻），玩家每代只留「有體質」的孩子當種畜（最極端的挑法）。每隻種畜記「牠爸媽有幾位有這個體質」，用來算孫輩的共鳴分
function line(kind, gens, res) {
  const inh = INH[kind];
  let pool = [{ age: 0, par: 0 }];
  const rows = [];
  for (let g = 1; g <= gens; g++) {
    pool.sort((x, y) => y.par - x.par || x.age - y.age);   // 玩家優先用共鳴高的
    const c = pool.length, idx = c >= 4 ? [[0, 1], [2, 3]] : c === 3 ? [[0, 1], [2, -1]] : c === 2 ? (R() < .5 ? [[0, 1], [-1, -1]] : [[0, -1], [1, -1]]) : c === 1 ? [[0, -1], [-1, -1]] : [[-1, -1], [-1, -1]];
    let kids = 0, have = 0, up = 0, rsum = 0; const born = [];
    for (const [i, j] of idx) for (let bk = 0; bk < 2; bk++) {
      const n = (r => r < .4 ? 1 : r < .8 ? 2 : 3)(R());
      const A = i >= 0 ? pool[i] : null, B = j >= 0 ? pool[j] : null, k = (A ? 1 : 0) + (B ? 1 : 0);
      const Rs = res ? Math.min(8, 2 * k + (A ? A.par : 0) + (B ? B.par : 0)) : 0;
      for (let e = 0; e < n; e++) {
        kids++; rsum += Rs;
        const p = (k === 2 ? inh[1] : k === 1 ? inh[0] : 0) + Math.min(RES.inhCap, Rs * RES.inhPer);
        if (k && R() * 100 < p) { have++; born.push({ age: 0, par: k }) }
        else if ((kind === 'xi' || kind === 'curse') && R() * 100 < Math.min(RES.upCap, Rs * RES.upPer)) up++;   // 傳說本身（古龍、聖體）共鳴只加遺傳
      }
    }
    pool = pool.concat(born).map(x => (x.age++, x)).filter(x => x.age <= 6).sort((x, y) => y.par - x.par || x.age - y.age).slice(0, 6);
    rows.push({ g, rate: have / kids, up: up / kids, r: rsum / kids, lost: pool.length ? 0 : 1 });
  }
  return rows;
}
console.log(`\n=== ② 體質遺傳＋血脈共鳴（${N} 次 × 10 代，玩家把有體質的孩子都留下來當種畜，最極端的挑法）===`);
const NAME2 = { xi: '稀異（12%／30%）', curse: '咒印（10%／25%）', dragon: '古龍之血（8%／20%）', saint: '精靈祝福聖體（6%／12%）' };
for (const kind of ['xi', 'curse', 'dragon', 'saint']) for (const res of [0, 1]) {
  const acc = Array.from({ length: 10 }, () => ({ rate: 0, up: 0, r: 0, lost: 0 }));
  for (let i = 0; i < N; i++) line(kind, 10, res).forEach((r, j) => { acc[j].rate += r.rate / N; acc[j].up += r.up / N; acc[j].r += r.r / N; acc[j].lost += r.lost / N });
  console.log(`${NAME2[kind]}${res ? '＋血脈共鳴' : '（沒有共鳴，對照）'}`);
  console.log('  代：' + acc.map((a, j) => `${j + 1}:${(a.rate * 100).toFixed(0)}%`).join(' ') + `｜第 10 代斷掉 ${(acc[9].lost * 100).toFixed(0)}%` + (res ? `｜平均共鳴分 ${acc[9].r.toFixed(1)}｜昇成該系傳說 ${(acc[9].up * 100).toFixed(2)}%/隻` : ''));
}
console.log('  每隻最多 1 種體質（稀異／傳說／咒印三選一），所以不會疊。');

// ========== ③ 寵物能力：聖體成長 ×1.25（＋凡異天賦 ×1.5）、零魔力主人分 15% ==========
const K = ['力氣', '腳程', '韌性', '靈巧', '福氣'], ABL_BASE = [8, 10, 12, 14, 16], SPB = 4, SP = [0, 1];
const LV = 4, TP = [0, 0, 12, 18, 25], DW = [0.4, 0.25], QUAL = [0.9, 1, 1.1, 1.2], CAPLV = [10, 10, 15, 20, 20];
const OWN = [{ per: .1, cap: 3 }, { per: .05, cap: 2 }, { per: .05, cap: 2 }, { per: .1, cap: 3 }, { per: .1, cap: 3 }];
const BC = [100, 100, 160, 220, 280], cap = (t, n) => BC[t] * (1 + 0.04 * Math.min(5, n)), PM = n => cap(4, n);
const w = (k, d) => k === d[0] ? DW[0] : k === d[1] ? DW[1] : 0.35 / 3;
function run3(grow, tal) {   // 跟 genetics_sim.js 認真養一樣；grow＝全部成長倍率（聖體 1.25），tal＝主項再 ×1.5（凡異天賦）
  const gm = k => grow * (tal && k === 0 ? 1.5 : 1);
  const wild = () => ({ tier: 0, q: 1, N: 0, d: [0, 1], s: K.map((_, k) => ABL_BASE[0] + (SP.includes(k) ? SPB : 0) + ri(0, 6)), lv: 1, done: 0, t: [0, 0, 0, 0, 0] });
  const lvls = (p, n) => { for (let i = 0; i < n; i++) { p.lv++; p.s = p.s.map((v, k) => Math.min(PM(p.N), v + LV * QUAL[p.q] * w(k, p.d) * gm(k))) } };
  const tup = p => { p.tier++; p.s = p.s.map((v, k) => Math.min(PM(p.N), v + TP[p.tier] * QUAL[p.q] * w(k, p.d) * gm(k))) };
  const raise = (p, to) => { lvls(p, CAPLV[p.tier] - p.lv); while (p.tier < to) { tup(p); lvls(p, CAPLV[p.tier] - p.lv) } p.done = 1; return p };
  const full = [60, 40, 20, 20, 20];
  let pr = [raise(wild(), 0), raise(wild(), 0)]; let last;
  for (let g = 1; g <= 10; g++) {
    const kids = []; for (let i = 0; i < 4; i++) { const [a, b] = pr; const Nn = Math.min(5, Math.floor((a.N + b.N) / 2) + 1);
      kids.push({ tier: 1, q: 3, N: Nn, d: [0, 1], lv: 1, done: 0, t: full.slice(), s: K.map((_, k) => Math.min(PM(Nn), ABL_BASE[1] + (SP.includes(k) ? SPB : 0) + (0.7 * (a.s[k] + b.s[k]) / 2 + 0.3 * (a.t[k] + b.t[k]) / 2) * (0.9 + R() * 0.2))) }) }
    kids.sort((x, y) => y.s[0] - x.s[0]); pr = [raise(kids[0], 2), raise(kids[1], 2)];
    const best = JSON.parse(JSON.stringify(kids[0])); raise(best, 4); last = { g, e: best.s.map(v => Math.min(v, cap(4, best.N))) };
  }
  return last;
}
console.log(`\n=== ③ 寵物能力（認真養第 10 代、養到橘、訓練練滿；${N} 次）===`);
let worst = 0;
for (const [name, grow, tal, share] of [['一般（對照）', 1, 0, .10], ['精靈祝福聖體（成長 ×1.25）', 1.25, 0, .10], ['聖體＋凡異天賦（主項再 ×1.5）', 1.25, 1, .10], ['零魔力詛咒（主人分 15%）', 1, 0, .15], ['零魔力＋凡異天賦', 1, 1, .15]]) {
  const e = [0, 0, 0, 0, 0]; for (let i = 0; i < N; i++) { const r = run3(grow, tal); r.e.forEach((v, k) => { e[k] += v / N; worst = Math.max(worst, v) }) }
  const tr = [60, 40, 20, 20, 20], own = e.map((v, k) => Math.min(OWN[k].cap, (v + tr[k]) * share * OWN[k].per)), raw = e.map((v, k) => (v + tr[k]) * share * OWN[k].per);
  console.log(`${name}：血統值 ${e.map(v => v.toFixed(0)).join('/')}｜主人 生命/移速/減傷/經驗/金幣 ${own.map(v => v.toFixed(2) + '%').join('/')}${raw.some((v, k) => v > OWN[k].cap) ? '（有幾項碰到 P3 上限，被擋住）' : ''}`);
}
console.log(`血統值單項最高 ${worst.toFixed(1)}，上限 ${cap(4, 5)} → ${worst <= cap(4, 5) + 1e-9 ? '沒有超過 ✔' : '超過 ✘'}`);

// ========== ④ 寵物打王 ≤ 主角 5%（第 6 節規則 4） ==========
const BASE = 4.4;  // 現有最強：橘 S 星彩大型、攻擊力 +10%（pet_genetics_zh.md 9.1）
const M4 = [['一般（現有最強）', 1], ['魔晶化（同元素技能 +20%，技能約佔寵物傷害 40%）', 1 + .2 * .4], ['虹晶之心（兩種元素 +15%，約佔 55%）', 1 + .15 * .55], ['古龍之血（寵物傷害 ×1.06）', 1.06], ['狂血咒印（每 30 秒狂暴 5 秒 +40%，之後 3 秒 −50%）', (5 * 1.4 + 3 * .5 + 22) / 30], ['狂血咒印 ♡5「血誓」（狂暴後不會累）', (5 * 1.4 + 25) / 30], ['零魔力・鬥士（元素技換成打擊技，打擊技 +30%，打王時打擊約佔 40%；打小怪 +50%、嘲諷、打斷不算在王戰傷害）', 1 + .30 * .40], ['無影之咒（寵物不會被打中，傷害不變）', 1], ['石心咒（守護一擊，不加傷害）', 1], ['精靈祝福聖體（庇護，不加傷害）', 1], ['祖靈返照（・祖靈技 ×1.25，約佔 10%）', 1 + .25 * .1 - .15 * .1]];
console.log('\n=== ④ 寵物打王佔主角傷害（上限 5%）===');
for (const [n, m] of M4) console.log(`${n}：${(BASE * m).toFixed(2)}% ${BASE * m <= 5 ? '✔' : '✘'}`);

// ========== ⑤ 一般玩家一年後的寵物名單：有體質的佔多少 ==========
// 每天 3 顆蛋；名單最多 30 隻。隨意玩：隨便挑爸媽、有體質的留 60%、普通的留 35%、滿了放走最舊的。收集控：優先拿有體質的配、有體質的全留、普通的留 35%、滿了放走最舊的
function roster(collector) {
  let ros = Array.from({ length: 8 }, () => ({ b: 0 })), day, born = 0, bornB = 0;
  const per = 0.021;   // ① 出生就帶體質的比例（約 2.1%）
  for (day = 0; day < 365; day++) for (let e = 0; e < 3; e++) {
    let A, B; const bs = ros.filter(x => x.b);
    if (collector && bs.length >= 2) { A = bs[ri(0, bs.length - 1)]; B = bs[ri(0, bs.length - 1)] }
    else if (collector && bs.length === 1) { A = bs[0]; B = ros[ri(0, ros.length - 1)] }
    else { A = ros[ri(0, ros.length - 1)]; B = ros[ri(0, ros.length - 1)] }
    const k = A.b + B.b, p = (k === 2 ? INH.xi[1] : k === 1 ? INH.xi[0] : 0) + (k ? Math.min(RES.inhCap, RES.inhPer * 2 * k) : 0);   // 用稀異的遺傳率（最高的那組）
    const b = (R() * 100 < p || R() < per) ? 1 : 0; born++; bornB += b;
    if (R() < (b ? (collector ? 1 : .6) : .35)) {
      ros.push({ b });
      if (ros.length > 30) ros.splice(0, 1)
    }
  }
  return { share: ros.filter(x => x.b).length / ros.length, bornShare: bornB / born };
}
console.log(`\n=== ⑤ 一年後的寵物名單（${N} 位玩家，最多 30 隻）===`);
for (const col of [0, 1]) { let a = 0, bb = 0; for (let i = 0; i < N; i++) { const r = roster(col); a += r.share / N; bb += r.bornShare / N }
  console.log(`${col ? '收集控（刻意配體質）' : '隨意玩'}：名單裡有體質的 ${(a * 100).toFixed(0)}%、普通寵物 ${(100 - a * 100).toFixed(0)}%｜一年出生的寶寶有體質 ${(bb * 100).toFixed(1)}%`) }

// ========== ⑥ v3.1：每天玩 1 小時的標準玩家，一個月拿到幾隻體質（全部來源） ==========
// 經濟照 pettest：小屋 3 間（cotMax 3）；育兒籃每天擲一次，好感、同住、默契、一起玩加起來約 55%（上限 70%）；一胎 1～3（40/40/20）；每天最多 6 隻
// 探險 2 隊、每天約 4 次（一半去第三～五關，月光露 pollen 3/4/6% → 平均約 4%、魔晶碎屑 10%）；彩虹月光露一年約 0.3 瓶（傳說大會）
// 新增「異兆」：第五層隱藏保底（只管體質），算蛋數，到門檻後下一次突變至少是稀異（不會是咒印，也不會蓋掉傳說）
const STD = { cots: 3, preg: 55, exped: 4, deep: 0.5, pollen: 4, rain: 0.3, keepB: 0.7, keepN: 0.35, cap: 30 };
const OMEN = { on: 1, th: [45, 75] };
function stdYear(omenOn, opt = {}) {
  const cfg = Object.assign({}, STD, opt);
  const M = { pair: {}, sp: {}, all: 0, th: { pair: {}, sp: {}, all: 0 } };
  const th = (l, k) => l === 'all' ? (M.th.all || (M.th.all = ri(...PITY.all))) : (M.th[l][k] || (M.th[l][k] = ri(...PITY[l])));
  let ros = Array.from({ length: 10 }, (_, i) => ({ id: i, sp: ri(0, 9), b: null, par: 0 })), nid = 10;
  const pick = () => ros[ri(0, ros.length - 1)];
  const cots = Array.from({ length: cfg.cots }, (_, i) => ({ n: 0, gen: 0, key: 'c' + i + '_0', a: pick(), b: pick() }));
  let legN = 0, legTh = ri(...LEG_PITY.first), omN = 0, omTh = ri(...OMEN.th), dew = 0, shard = 0, seenLeg = 0;
  const out = { eggs: 0, month: Array.from({ length: 12 }, () => ({ xi: 0, curse: 0, leg: 0 })), src: { nat: 0, pity: 0, dew: 0, omen: 0, legPity: 0, inh: 0, up: 0, rain: 0, shard: 0 }, firstLeg: -1, legSrc: {} };
  const famOf = { crystal: 'j', eye: 'y', moss: 's', wind: 's', saint: 's', rage: 'x', stone: 'x', dragon: 'x', nomana: 'y', shadow: 'y' };
  const tierOf = k => ({ crystal: 'xi', eye: 'xi', moss: 'xi', wind: 'xi', saint: 'leg', dragon: 'leg', nomana: 'curse', rage: 'curse', shadow: 'curse', stone: 'curse' })[k];
  const inhR = k => ({ xi: INH.xi, curse: INH.curse, leg: k === 'saint' ? INH.saint : INH.dragon })[tierOf(k)];
  const give = (day, tier, s) => { const m = Math.min(11, Math.floor(day / 30.42)); out.month[m][tier]++; out.src[s]++; if (tier === 'leg') out.legSrc[s] = (out.legSrc[s] || 0) + 1; if (tier === 'leg') { seenLeg = 1; if (out.firstLeg < 0) out.firstLeg = day; legN = 0; legTh = ri(...LEG_PITY.next) } if (tier !== 'fan') { omN = 0; omTh = ri(...OMEN.th) } };
  for (let day = 0; day < 365; day++) {
    for (let e = 0; e < STD.exped; e++) if (R() < STD.deep) { if (R() * 100 < STD.pollen) dew++; if (R() * 100 < SHARD) shard++ }
    if (R() < STD.rain / 365) { if (seenLeg && R() * 100 < RAIN_UP) give(day, 'leg', 'rain'); else { give(day, 'xi', 'rain'); ros.push({ id: nid++, sp: ri(0, 9), b: 'crystal', par: 0 }) } }
    let births = 0;
    for (const c of cots) {
      if (births >= (cfg.dayCap || 6) || R() * 100 >= (cfg.pregs ? cfg.pregs[cots.indexOf(c)] : cfg.preg)) continue;
      if (++c.n > 8) { c.n = 1; c.gen++; c.key = c.key.split('_')[0] + '_' + c.gen; c.a = pick(); c.b = pick() }
      if (!ros.includes(c.a)) c.a = pick(); if (!ros.includes(c.b)) c.b = pick();
      const n = Math.min(6 - births, (r => r < .4 ? 1 : r < .8 ? 2 : 3)(R())); births += n;
      const useDew = dew > 0 ? (dew--, 1) : 0, useSh = shard > 0 ? (shard--, 1) : 0, coi = R() < .2, sp = c.a.sp;
      let any = 0;
      for (let j = 0; j < n; j++) {
        out.eggs++; legN++; omN++; M.pair[c.key] = (M.pair[c.key] || 0) + 1; M.sp[sp] = (M.sp[sp] || 0) + 1; M.all++;
        let body = null, tier = 'fan', s = null;
        // 遺傳＋血脈共鳴
        const A = c.a, B = c.b, cand = [];
        for (const P_ of [A, B]) if (P_.b) cand.push(P_.b);
        if (cand.length && !cfg.noInh) {
          const same = cand.length === 2 && cand[0] === cand[1], k = cand[0];
          const Rs = Math.min(8, (A.b ? 2 : 0) + (B.b ? 2 : 0) + A.par + B.par);
          const p = (same ? inhR(k)[1] : inhR(k)[0]) + Math.min(RES.inhCap, Rs * RES.inhPer);
          if (R() * 100 < p) { body = k; s = 'inh' }
          else if (cand.length === 2 && !same && R() * 100 < inhR(cand[1])[0] + Math.min(RES.inhCap, Rs * RES.inhPer)) { body = cand[1]; s = 'inh' }
          else if (tierOf(k) !== 'leg' && R() * 100 < Math.min(RES.upCap, Rs * RES.upPer)) { body = { j: 'rainbowH', s: 'saint', x: 'dragon', y: 'ancestor' }[famOf[k]]; s = 'up' }
          if (body) tier = (body === 'rainbowH' || body === 'ancestor') ? 'leg' : tierOf(body);
        }
        // 突變
        const nat = R() * 100 < MUT * (coi ? COI : 1) * (useDew ? MOON : 1);
        const layer = M.pair[c.key] >= th('pair', c.key) ? 'pair' : M.sp[sp] >= th('sp', sp) ? 'sp' : M.all >= th('all') ? 'all' : null;
        let hit = nat || layer, src = useDew ? 'dew' : nat ? 'nat' : 'pity';
        if (!hit && useDew && !any && j === n - 1) { hit = 1; src = 'dew' }
        if (hit) {
          any = 1; let t = wpick(TIER_W[src]), ms = src;
          if (t !== 'leg' && legN >= legTh) { t = 'leg'; ms = 'legPity' }
          else if (omenOn && (t === 'fan' || t === 'curse') && omN >= omTh) { t = 'xi'; ms = 'omen' }
          M.pair[c.key] = 0; delete M.th.pair[c.key]; M.sp[sp] = 0; delete M.th.sp[sp]; M.all = 0; M.th.all = 0;
          const rank = { fan: 0, xi: 1, curse: 2, leg: 3 };
          if (t !== 'fan' && rank[t] > rank[tier]) { tier = t; s = (t === 'xi' && useSh) ? 'shard' : ms; body = t === 'xi' ? (useSh ? 'crystal' : wpick(XI)) : t === 'curse' ? wpick(CURSE) : wpick(LEG) }
        }
        if (tier !== 'fan') give(day, tier, s);
        const kid = { id: nid++, sp, b: tier === 'fan' ? null : (body === 'rainbowH' ? 'crystal' : body === 'ancestor' ? 'eye' : body), par: (A.b ? 1 : 0) + (B.b ? 1 : 0) };
        if (R() < (kid.b ? STD.keepB : STD.keepN)) { ros.push(kid); if (ros.length > STD.cap) ros.splice(0, 1) }
      }
    }
  }
  out.share = ros.filter(x => x.b).length / ros.length;
  return out;
}
console.log(`\n=== ⑥ 每天玩 1 小時的標準玩家（${N} 位 × 1 年；小屋 3 間、育兒籃 55%、探險每天 4 次）===`);
for (const [om, opt, label] of [[0, {}, '沒有異兆（v3 規則，只換成 1 小時的經濟）'], [1, {}, '有「異兆」（v3.1）'], [1, { noInh: 1 }, 'v3.1，但完全不拿體質寵物配對（不算遺傳）'], [1, { cots: 2, preg: 40 }, 'v3.1，新手前期（小屋 2 間、育兒籃 40%）']]) {
  const legSrc = {};
  let eggs = 0, mo = { xi: 0, curse: 0, leg: 0 }, any = 0, cnt = 0, allMonths = 0, share = 0, firstLeg = [], noLeg = 0; const src = {}; const dist = [0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const o = stdYear(om, opt); for (const k in o.legSrc) legSrc[k] = (legSrc[k] || 0) + o.legSrc[k] / N; eggs += o.eggs / N; share += o.share / N; let every = 1;
    for (const m of o.month) { const t = m.xi + m.curse + m.leg; mo.xi += m.xi / N / 12; mo.curse += m.curse / N / 12; mo.leg += m.leg / N / 12; cnt += t / N / 12; if (t >= 1) any++; else every = 0; dist[Math.min(4, t)]++ }
    allMonths += every; for (const k in o.src) src[k] = (src[k] || 0) + o.src[k] / N; if (o.firstLeg < 0) noLeg++; else firstLeg.push(o.firstLeg);
  }
  firstLeg.sort((a, b) => a - b); const q = x => { const all = firstLeg.concat(Array(noLeg).fill(9999)); const v = all[Math.floor(all.length * x)]; return v >= 9999 ? '>365' : v };
  const tot = Object.values(src).reduce((a, b) => a + b, 0), self = src.rain + src.shard;
  console.log(label);
  console.log(`  一年 ${eggs.toFixed(0)} 顆蛋（每天 ${(eggs / 365).toFixed(2)}）｜每月體質 平均 ${cnt.toFixed(2)} 隻（稀異 ${mo.xi.toFixed(2)}／咒印 ${mo.curse.toFixed(2)}／傳說 ${mo.leg.toFixed(2)}）`);
  console.log(`  每個月至少 1 隻的比例 ${(any / N / 12 * 100).toFixed(1)}%｜12 個月每個月都有的玩家 ${(allMonths / N * 100).toFixed(1)}%｜一個月 0/1/2/3/4+ 隻：${dist.map(d => (d / N / 12 * 100).toFixed(0) + '%').join('／')}`);
  console.log(`  來源（一年）：` + Object.entries(src).map(([k, v]) => `${{ nat: '自然', pity: '三層保底', dew: '月光露', omen: '異兆', legPity: '天命', inh: '遺傳', up: '共鳴昇階', rain: '彩虹', shard: '碎屑指定' }[k]} ${v.toFixed(1)}`).join('｜') + `｜自己選的佔 ${(self / tot * 100).toFixed(1)}%`);
  console.log(`  第一隻傳說：25% 第 ${q(.25)} 天｜中位數 第 ${q(.5)} 天｜75% 第 ${q(.75)} 天｜90% 第 ${q(.9)} 天｜一年後名單（30 隻）有體質 ${(share * 100).toFixed(0)}%`);
  console.log(`  傳說一年 ${Object.values(legSrc).reduce((a, b) => a + b, 0).toFixed(1)} 隻：` + Object.entries(legSrc).map(([k, v]) => `${k} ${v.toFixed(1)}`).join('｜'));
}

// ========== ⑦ 農場小屋（2026-11-03）：小屋變多，1 小時的玩家體質會不會暴增 ==========
// 收容所 3 間（標準）＋農場小屋 0～5 間。1 小時只夠在 3 間小屋「一起玩」滿 3 次，其他小屋沒有一起玩加成、好感也比較低 → 育兒籃約 35%。
// 全部小屋共用「每天最多出生」上限（收容所 6 隻；農場另外的設計值見 pet_system_zh.md 9.1）。
console.log(`\n=== ⑦ 農場小屋：每天 1 小時的標準玩家（${N} 位 × 1 年）===`);
for (const [farm, cap] of [[0, 6], [1, 6], [3, 6], [5, 6], [0, 3], [1, 3], [3, 3], [5, 3]]) {
  const pregs = Array.from({ length: 3 + farm }, (_, i) => i < 3 ? 55 : 35);
  let eggs = 0, cnt = 0;
  for (let i = 0; i < N; i++) { const o = stdYear(1, { cots: 3 + farm, pregs, dayCap: cap }); eggs += o.eggs / N; for (const m of o.month) cnt += (m.xi + m.curse + m.leg) / N / 12 }
  console.log(`  收容所 3＋農場 ${farm} 間、每天最多出生 ${cap} 隻：每天 ${(eggs / 365).toFixed(2)} 顆蛋｜每月體質 ${cnt.toFixed(2)} 隻`);
}
