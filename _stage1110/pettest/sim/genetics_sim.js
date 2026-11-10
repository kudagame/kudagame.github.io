// 寵物遺傳模擬（企劃驗證用，不進正式版）：node genetics_sim.js [次數]
// 寵物能力照測試版 P3 的數字（pet_data.js：ABIL、ablBase、ablLv、ablTier、ablDirW、ablQual、ablOwnerShare、ablTrainCap）
// 新增的遺傳規則見 design/pet_genetics_zh.md 第 3 節。
'use strict';
const RUNS = +process.argv[2] || 2000, GENS = 10;
let seed = 20261103; const R = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
// ---- P3 現有數字 ----
const K = ['力氣', '腳程', '韌性', '靈巧', '福氣'];
const ABL_BASE = [8, 10, 12, 14, 16];        // 成年/藍/紫/粉/橘 出生每項基本值
const SP_BONUS = 4;                          // 物種擅長 2 項各 +4（小狼：力氣、腳程）
const SP = [0, 1];
const LV_PTS = 4, TIER_PTS = [0, 0, 12, 18, 25], DIR_W = [0.4, 0.25], QUAL = [0.9, 1, 1.1, 1.2];
const LV_CAP = [10, 10, 15, 20, 20];         // 成年當藍
const OWNER_SHARE = 0.10, TRAIN_CAP = 60;
const OWNER = [{ per: 0.1, cap: 3, t: '主人最大生命' }, { per: 0.05, cap: 2, t: '主人移動速度' }, { per: 0.05, cap: 2, t: '主人受到傷害 −' }, { per: 0.1, cap: 3, t: '主人經驗' }, { per: 0.1, cap: 3, t: '主人金幣' }];
// ---- 本企劃新增 ----
const INH = 0.7;                              // 遺傳率：寶寶出生多拿「父母血統值平均」的 70%
const BLOOD_CAP = [100, 100, 160, 220, 280];  // 血統值（出生＋成長，不含訓練）每項上限，照目前位階
const LINE_STEP = 0.04, LINE_MAX = 5;         // 傳承 +N：上限每級 +4%，最多 +5（+20%）
const QUAL_W = [40, 35, 20, 5];
const TR_INH = process.env.TR == null ? 0.3 : +process.env.TR;   // P4：訓練練出來的能力，寶寶多拿「父母訓練平均」的 30%（仍受血統上限）
const cap = (tier, N) => BLOOD_CAP[tier] * (1 + LINE_STEP * Math.min(LINE_MAX, N));
const POT_MAX = N => cap(4, N);               // 潛力最多到「橘的上限」
const w = (k, d) => k === d[0] ? DIR_W[0] : k === d[1] ? DIR_W[1] : (1 - DIR_W[0] - DIR_W[1]) / 3;

function qroll(a, b) { const n = a && b && a.q === 3 && b.q === 3 ? 3 : a && b && a.q >= 2 && b.q >= 2 ? 2 : 1; let best = 0; for (let i = 0; i < n; i++) { let r = R() * 100, q = 0; while (r >= QUAL_W[q]) { r -= QUAL_W[q]; q++ } best = Math.max(best, q) } return best }
function base(tier) { return K.map((_, k) => ABL_BASE[tier] + (SP.includes(k) ? SP_BONUS : 0)) }
function wild() { const p = { tier: 0, q: qroll(), N: 0, d: [0, 1], done: 0, lv: 1, t: [0, 0, 0, 0, 0] }; p.s = base(0).map(v => v + ri(0, 6)); return p }
function birth(a, b, coi, opt) {
  const N = Math.min(LINE_MAX, Math.floor((a.N + b.N) / 2) + (a.done && b.done ? 1 : 0));
  const near = coi >= 0.125 ? 0.9 : 1;
  const d = opt ? a.d.slice() : (R() < 0.5 ? (R() < 0.5 ? a.d : b.d).slice() : [ri(0, 4), ri(0, 4)]);
  const s = base(1).map((v, k) => Math.min(POT_MAX(N), v + (INH * (a.s[k] + b.s[k]) / 2 + TR_INH * ((a.t || [])[k] || 0) / 2 + TR_INH * ((b.t || [])[k] || 0) / 2) * near * (0.9 + R() * 0.2)));
  return { tier: 1, q: qroll(a, b), N, d, s, done: 0, lv: 1, t: [0, 0, 0, 0, 0] };
}
function levels(p, n) { for (let i = 0; i < n; i++) { p.lv++; p.s = p.s.map((v, k) => Math.min(POT_MAX(p.N), v + LV_PTS * QUAL[p.q] * w(k, p.d))) } }
function tierUp(p) { p.tier++; p.s = p.s.map((v, k) => Math.min(POT_MAX(p.N), v + TIER_PTS[p.tier] * QUAL[p.q] * w(k, p.d))) }
// 把一隻養到某個位階並練成（假設升階條件都達成）
function raise(p, toTier) { levels(p, LV_CAP[p.tier] - p.lv); while (p.tier < toTier) { tierUp(p); levels(p, LV_CAP[p.tier] - p.lv) } p.done = 1; return p }
const eff = p => p.s.map(v => Math.min(v, cap(p.tier, p.N)));
const score = p => p.s[p.d[0]] * 3 + p.s[p.d[1]] * 2 + p.s.reduce((a, v) => a + v, 0);
function ownerOf(stats, train) { return stats.map((v, k) => Math.min(OWNER[k].cap, (v + train[k]) * OWNER_SHARE * OWNER[k].per)) }

// 策略：opt=1 認真（種畜練到紫 Lv15 練成、方向一致、挑最好）；opt=0 隨便（隨便留、一半沒練成、種畜留藍）
function run(opt) {
  let pair = [[wild(), wild()], [wild(), wild()]];
  pair.forEach(pp => pp.forEach(p => { p.q = Math.max(p.q, opt ? 1 : 0); raise(p, 0) }));
  const rows = [];
  for (let g = 1; g <= GENS; g++) {
    const kids = [[], []];
    pair.forEach((pp, i) => {
      const coi = g >= 3 ? 0.0625 : 0;
      for (let b = 0; b < 2; b++) { const r = R() * 100, n = r < 40 ? 1 : r < 80 ? 2 : 3; for (let j = 0; j < n; j++) kids[i].push(birth(pp[0], pp[1], coi, opt)) }
    });
    kids.forEach(ks => ks.sort((x, y) => opt ? score(y) - score(x) : R() - 0.5));
    const keep = kids.map(ks => ks.slice(0, 2).map(p => { const full = K.map((_, k) => k === p.d[0] ? TRAIN_CAP : k === p.d[1] ? 40 : 20); if (opt) { p.t = full; return raise(p, 2) } p.t = R() < 0.5 ? full.map(v => v / 2) : [0, 0, 0, 0, 0]; if (R() < 0.5) raise(p, 1); else levels(p, ri(1, 8)); return p }));
    const released = kids.reduce((a, ks) => a + Math.max(0, ks.length - 2), 0);
    pair = [[keep[0][0], keep[1][0]], [keep[0][1] || keep[0][0], keep[1][1] || keep[1][0]]];
    // 這一代最好的那隻，假設把牠養到橘 Lv20、訓練練滿（主項 60、副項 40、其他 20）
    const best = keep.flat().map(p => ({ ...p, s: p.s.slice(), d: p.d.slice() })).sort((x, y) => score(y) - score(x))[0];
    const born = best.s.slice();
    best.tier = best.tier; raise(best, 4);
    const train = K.map((_, k) => k === best.d[0] ? TRAIN_CAP : k === best.d[1] ? 40 : 20);
    const e = eff(best);
    rows.push({ g, born, N: best.N, e, total: e.map((v, k) => v + train[k]), own: ownerOf(e, train), released });
  }
  return rows;
}
// 對照：沒有遺傳（每隻都從野生起點）、養到橘、訓練練滿
function noGen() { const p = { tier: 1, q: 3, N: 0, d: [0, 1], s: base(1), lv: 1 }; raise(p, 4); const train = K.map((_, k) => k === 0 ? 60 : k === 1 ? 40 : 20); return { e: eff(p), total: p.s.map((v, k) => Math.min(v, cap(4, 0)) + train[k]), own: ownerOf(eff(p), train) } }
const f0 = v => v.toFixed(0), f2 = v => v.toFixed(2) + '%';
const capOwn = OWNER.map(o => o.cap);
console.log(`遺傳模擬：${RUNS} 次 × ${GENS} 代（小狼，主項力氣、次項腳程）｜訓練遺傳 ${TR_INH * 100}%（TR=0 可以關掉對照）`);
console.log(`血統值上限：藍 ${BLOOD_CAP[1]}／紫 ${BLOOD_CAP[2]}／粉 ${BLOOD_CAP[3]}／橘 ${BLOOD_CAP[4]}，傳承 +5 再 ×1.2 → 橘 ${cap(4, 5)}；加訓練 60 → 每項最多 ${cap(4, 5) + TRAIN_CAP}`);
console.log(`主人那邊的上限（P3 程式）：${OWNER.map(o => o.t + ' ' + o.cap + '%').join('、')}（全部不加傷害）`);
const ng = noGen();
console.log(`\n對照（沒有遺傳、S 資質、養到橘、訓練練滿）：能力 ${ng.total.map(f0).join('/')}；主人 ${ng.own.map(f2).join('/')}\n`);
let worst = 0;
for (const opt of [1, 0]) {
  const acc = [];
  for (let r = 0; r < RUNS; r++) run(opt).forEach((row, i) => {
    const a = acc[i] = acc[i] || { born: [0, 0, 0, 0, 0], e: [0, 0, 0, 0, 0], total: [0, 0, 0, 0, 0], own: [0, 0, 0, 0, 0], N: 0, rel: 0, max: 0 };
    for (const k of ['born', 'e', 'total', 'own']) row[k].forEach((v, j) => a[k][j] += v / RUNS);
    a.N += row.N / RUNS; a.rel += row.released / RUNS; a.max = Math.max(a.max, ...row.e); worst = Math.max(worst, ...row.e);
    row.own.forEach((v, j) => { if (v > capOwn[j] + 1e-9) throw new Error('主人加成超過上限') });
  });
  console.log(opt ? '【認真養】每代挑最好的、方向一致、種畜練到紫 Lv15' : '【隨便養】隨便留、方向亂、種畜一半沒練成');
  console.log('代 | 出生 力/腳/韌/巧/福 | 傳承 | 養到橘後血統值 | ＋訓練後 | 主人：生命/移速/減傷/經驗/金幣 | 每代放生 | 單項最高');
  acc.forEach((a, i) => console.log(`${String(i + 1).padStart(2)} | ${a.born.map(f0).join('/')} | +${a.N.toFixed(1)} | ${a.e.map(f0).join('/')} | ${a.total.map(f0).join('/')} | ${a.own.map(f2).join('/')} | ${a.rel.toFixed(1)} | ${a.max.toFixed(0)}`));
  console.log('');
}
console.log(`所有模擬裡，血統值單項最高 ${worst.toFixed(1)}（上限 ${cap(4, 5)}）→ ${worst <= cap(4, 5) + 1e-9 ? '沒有超過 ✔' : '超過 ✘'}；主人加成全部在 P3 上限內 ✔`);
