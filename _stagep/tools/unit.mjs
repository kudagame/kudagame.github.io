// 不開瀏覽器的規則測試：node pettest/tools/unit.mjs
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url)), root = path.join(dir, '..');
const store = {}; const ctx = { console, Math, Date, JSON, setTimeout, clearTimeout, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k] } };
ctx.window = ctx; ctx.PET = {}; vm.createContext(ctx);
for (const f of ['pet/pet_data.js', 'pet/pet_core.js', 'pet/pet_p3.js', 'pet/pet_gen.js', 'pet/pet_p4.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const P = ctx.PET; let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗', m) } };
export { P, ok };
const fresh = () => { P.S = P.newState(); P.migrate(P.S); P.S.unlock = 1; return P.S };
const mk = (sp, o) => { const p = P.makeAnimal(Object.assign({ sp, tier: 1, baby: 0, aff: 9999, q: 1 }, o || {})); P.S.pets.push(p); P.famRec(p); return p };
fresh();
// 1 血統值 70%
{ const f = mk('wolf', { tier: 2 }), m = mk('wolf', { tier: 2 }); let s = 0, n = 300; const bf = P.blood(f), bm = P.blood(m); for (let i = 0; i < n; i++) s += P.inherit(f, m, { sync: 1, g0: 0, k: 1, litter: 'x' }).baby.ib.str; const exp = 0.7 * (bf.str + bm.str) / 2; ok(Math.abs(s / n - exp) < exp * 0.03, `ib 平均 ${s / n} ≈ ${exp}`);
  f.tr.str = 50; f.perm.str = 30; const b2 = P.blood(f); ok(b2.str === bf.str, '訓練／大會不算血統'); ok(P.abil(f).str === bf.str + 80, '總能力含訓練+大會'); }
// 2 血緣：兄妹禁止、表親 12.5%
{ fresh(); const a = mk('cat'), b = mk('cat'); const k1 = mk('cat', { par: [a.id, b.id] }), k2 = mk('cat', { par: [a.id, b.id] }); ok(P.coi(k1, k2) === 0.25, 'sibling coi .25 got ' + P.coi(k1, k2)); ok(P.coi(a, k1) === 0.25, 'parent coi'); 
  const c = mk('cat'), d = mk('cat'); const h1 = mk('cat', { par: [k1.id, c.id] }), h2 = mk('cat', { par: [k2.id, d.id] }); ok(P.coi(h1, h2) === 0.0625, 'cousin coi 1/16 got ' + P.coi(h1, h2));
  const g1 = mk('cat', { par: [k1.id, c.id] }); ok(P.coi(g1, k2) === 0.125, 'aunt coi .125 got ' + P.coi(g1, k2));
  P.S.cots = [{ a: k1.id, b: k2.id }]; ok(P.cotCheck(P.S.cots[0]) === '牠們是一家人啦', 'ban msg: ' + P.cotCheck(P.S.cots[0])); }
// 3 混血
{ fresh(); const w = mk('wolf'), r = mk('retriever'); ok(P.mateKind(w, r) === 'pure', 'pure pair'); const cnt = {}; for (let i = 0; i < 2000; i++) { const s = P.babySp(w, r); cnt[s] = (cnt[s] || 0) + 1 } ok(Math.abs(cnt.moonhound / 2000 - 0.4) < 0.04, 'hyb 40% ' + JSON.stringify(cnt));
  const c = mk('cat'); ok(P.mateKind(w, c) === null, 'no pair'); P.S.cots = [{ a: w.id, b: c.id }]; ok(/不會有寶寶/.test(P.cotCheck(P.S.cots[0])), 'non-pair msg');
  const hb = mk('moonhound'); ok(P.mateKind(hb, w) === 'back', 'back'); ok(P.SPECIES.every(s => !P.HYB[s.id]), '混血不在野生清單'); }
// 4 四祖配方
{ fresh(); const [a, b, c, d] = ['wolf', 'retriever', 'fox', 'wolf'].map(s => mk(s)); const f = mk('moonhound', { par: [a.id, b.id] }), m = mk('frostfox', { par: [c.id, d.id] }); ok(P.recipeOf(f, m) === 'starwolf', 'recipe ' + P.recipeOf(f, m)); }
// 5 突變保底 & 月光露
{ fresh(); P.CFG.gen.mut = 0; const f = mk('cat'), m = mk('cat'); let got = 0;
  for (let i = 0; i < 60; i++) { P.S.babies = []; P.S.births = { day: -1, n: 0 }; P.S.cots = [{ a: f.id, b: m.id, basket: { a: f.id, b: m.id, sync: 1 } }]; const out = P.birth(P.S.cots[0], 1); for (const b of out) if (b.mut.length) got = got || P.S.fam ? (got || i + 1) : 0; }
  ok(got > 0, '50 隻保底有觸發 at ' + got);
  P.S.babies = []; P.S.births = { day: -1, n: 0 }; P.S.mutPity = 0; P.S.cots = [{ a: f.id, b: m.id, basket: { a: f.id, b: m.id, sync: 1, pollen: 1, mutKind: 'size' } }]; const out = P.birth(P.S.cots[0], 2); ok(out.some(b => b.mut.some(x => x.k === 'size')), '月光露 至少 1 隻（自選 size）'); P.CFG.gen.mut = 3; }
// 6 傳授 + 託付
{ fresh(); const f = mk('fox', { tier: 2 }), m = mk('fox', { tier: 2 }); f.sk = [1]; m.sk = [1]; f.heir = m.heir = 50; f.mst = { 1: 90 }; m.mst = { 1: 80 }; let evo = 0, n = 400; for (let i = 0; i < n; i++) { const b = P.inherit(f, m, { sync: 1, g0: 0, k: 1, litter: 'x', bk: { teach: [1] } }).baby; if (b.sk.includes(101) || b.hid.includes(101)) evo++ } ok(Math.abs(evo / n - 0.7) < 0.07, '兩邊都有 70% 並進化 ' + evo / n); }
// 7 P2c 存檔搬家
{ const old = { v: 1, unlock: 1, gold: 5, pets: [{ id: 1, sp: 'cat', tier: 1, lv: 3, aff: 100, q: 1, sk: [], sub: [] }], babies: [], cots: [], wander: [], wait: [], codex: {}, codexS: {}, fam: undefined }; const S = Object.assign(P.newState(), old); delete S.book; delete S.mutPity; P.migrate(S); P.S = S; ok(Array.isArray(S.book) && S.mutPity === 0 && S.pets[0].coat && S.pets[0].ib, 'P2c 搬家'); ok(P.abil(S.pets[0]).total > 0, '舊寵物有能力'); }
console.log(`unit: ${pass} 通過、${fail} 失敗`); process.exitCode = fail ? 1 : 0;
