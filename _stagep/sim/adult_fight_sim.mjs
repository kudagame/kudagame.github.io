// P5.1 #10b 大朋友出戰平衡（數字面）：node pettest/sim/adult_fight_sim.mjs [每格樣本數]
// 同物種、同資質、同大小、同能力，比較「寶寶」跟「大朋友」：普攻威力、出戰會用的招數、天性魔法、升階花費、練滿要打幾隻。
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = {}; const ctx = { console, Math, Date, JSON, setTimeout, clearTimeout, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k] } };
ctx.window = ctx; ctx.PET = {}; vm.createContext(ctx);
for (const f of ['pet/pet_data.js', 'pet/pet_core.js', 'pet/pet_lines.js', 'pet/pet_p3.js', 'pet/pet_gen.js', 'pet/pet_p4.js', 'pet/pet_p51.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const P = ctx.PET, C = P.CFG, N = +process.argv[2] || 400; P.S = P.newState(); P.migrate(P.S); P.S.unlock = 1;
const SPS = Object.keys(P.SP).filter(k => !P.HYB || !P.HYB[k]);
const T = P.TIER_NAME, fmt = n => Math.round(n).toLocaleString();
const rows = [];
for (let t = 0; t <= 4; t++) {
  let ab = 0, aa = 0, skb = 0, ska = 0, subb = 0, n = 0;
  for (let i = 0; i < N; i++) {
    const sp = SPS[i % SPS.length];
    const b = P.makeAnimal({ sp, tier: Math.max(1, t), baby: 1, aff: 900, q: 1 }), a = P.makeAnimal({ sp, tier: t, baby: 0, aff: 900, q: 1 });
    for (const x of [a, b]) { x.q = 1; x.star = 0; x.size = 1; } a.abl = b.abl; a.coat = b.coat;
    P.S.pets.push(a, b);
    if (t >= 1) { ab += P.petAtkOf(b); skb += P.fightSk(b).length; subb += (b.sub || []).length }
    aa += P.petAtkOf(a); ska += P.fightSk(a).length; n++;
    P.S.pets.length = 0;
  }
  // 升階花費（從綠／藍開始一路升上來，金幣＋麵包）
  const costTo = (adult) => { let g = 0, br = 0; if (adult) { g += C.adult.up0.gold; br += C.adult.up0.bread } for (let k = 1; k < t; k++) { const u = C.up[k]; g += u.gold * (adult ? C.adult.upMul : 1); br += u.bread * (adult ? C.adult.upMul : 1) } return [g, br] };
  const cap = t ? C.lvCap[t] : C.adult.greenCap; let need = 0; for (let l = 1; l < cap; l++) need += C.xpNeed * l;
  const killsB = Math.ceil(need / C.xpPerKill), killsA = Math.ceil(need / (C.xpPerKill * C.adult.xpMul));
  rows.push({ tier: t ? T[t] : '綠（素體）', babyAtk: t ? ab / n : null, adultAtk: aa / n, ratio: t ? aa / ab : null, babySk: t ? skb / n : null, adultSk: ska / n, babySub: t ? subb / n : null, costB: t ? costTo(false) : null, costA: costTo(true), cap, killsB: t ? killsB : null, killsA });
}
console.log('位階 | 寶寶普攻 | 大朋友普攻 | 大/寶 | 寶寶招數 | 大朋友招數 | 寶寶天性魔法 | 升到這階 寶寶 金/麵包 | 大朋友 金/麵包 | 等級上限 | 練滿要打 寶寶/大朋友');
for (const r of rows) console.log([r.tier, r.babyAtk ? fmt(r.babyAtk) : '—', fmt(r.adultAtk), r.ratio ? Math.round(r.ratio * 100) + '%' : '—', r.babySk == null ? '—' : r.babySk.toFixed(1), r.adultSk.toFixed(1), r.babySub == null ? '—' : r.babySub.toFixed(1), r.costB ? fmt(r.costB[0]) + '/' + fmt(r.costB[1]) : '—', fmt(r.costA[0]) + '/' + fmt(r.costA[1]), r.cap, (r.killsB ?? '—') + '/' + r.killsA].join(' | '));
console.log(`參數：C.adult = ${JSON.stringify(C.adult)}`);
