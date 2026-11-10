// P4 規則測試：node pettest/tools/unit_p4.mjs
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url)), root = path.join(dir, '..');
const store = {}; const ctx = { console, Math, Date, JSON, setTimeout, clearTimeout, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k] } };
ctx.window = ctx; ctx.PET = {}; vm.createContext(ctx);
for (const f of ['pet/pet_data.js', 'pet/pet_core.js', 'pet/pet_p3.js', 'pet/pet_gen.js', 'pet/pet_p4.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const P = ctx.PET, G = P.CFG.gen; let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log('✓', m) } else { fail++; console.log('✗', m) } };
const fresh = () => { P.S = P.newState(); P.migrate(P.S); P.S.unlock = 1; return P.S };
const mk = (sp, o) => { const p = P.makeAnimal(Object.assign({ sp, tier: 1, baby: 0, aff: 9999, q: 1 }, o || {})); P.S.pets.push(p); P.famRec(p); return p };
const born = (f, m, extra) => { P.S.babies = []; P.S.births = { day: -1, n: 0 }; const c = { a: f.id, b: m.id, basket: Object.assign({ a: f.id, b: m.id, sync: 1 }, extra || {}) }; P.S.cots = [c]; return P.birth(c, 1) };
const H = 3600e3;
// ---- 1 探險：小寶寶不能去、成年全力、出戰中不能去、隊伍人數 ----
{ fresh(); const a = mk('wolf'), kid = mk('wolf', { baby: 1 }); P.S.pets = P.S.pets.filter(p => p !== kid); P.S.babies.push(kid); kid.bornDay = P.dayKey(P.now()); P.S.fac.board = 1;
  ok(P.isKid(kid) && !P.expFree(kid) && /小寶寶/.test(P.expWhyNot(kid)), '未滿 3 天的寶寶不能去探險');
  kid.bornDay = P.dayKey(P.now()) - 3; const grown = !P.isKid(kid); ok(grown, '滿 3 天的寶寶可以去：' + P.expWhyNot(kid));
  const r1 = v => Math.round(v * 10) / 10; ok(P.expPow(a) === r1(([0.6, 1, 2, 3, 4][a.tier] + P.abil(a).total / 150) * P.QUAL_MUL[a.q]), '成年戰力沒有 ×0.8');
  P.S.eq = a.id; ok(!P.expFree(a) && /出戰/.test(P.expWhyNot(a)), '跟主人出戰中的不能去'); const r = P.expSend('canyon', [a.id]); ok(!r.ok, '出戰中送出被擋');
  P.S.eq = 0;
  const ps = k => P.partySize(P.ST[k]).join('-'); ok(ps('canyon') === '1-3' && ps('s2') === '1-3' && ps('mine') === '2-4' && ps('spider') === '3-5' && ps('crystal') === '5-5' && ps('rich') === '5-5', '隊伍人數 ' + P.STAGES.map(s => s.k + ':' + ps(s.k)).join(' '));
  ok(P.STAGES.length === 6 && P.STAGES.every(s => s.name && s.boss && s.foes.length && s.items.length && s.ev.length >= 3), '6 個真關卡都有名字、王、小怪、戰利品、事件');
  const babyT = mk('wolf', { baby: 1 }); babyT.bornDay = P.dayKey(P.now()) - 2; const r2 = P.expSend('canyon', [babyT.id]); ok(!r2.ok, '小寶寶送出被擋');
  // 出發→回來：事件文字跟關卡相符
  const s = P.ST.canyon; const r3 = P.expSend('canyon', [a.id]); ok(r3.ok, '正常出發'); const t = P.S.exp.teams[0]; t.until = P.now() - 1; P.S.v3 = P.S.v3 || 1; P.expTickAt = 1; (P.tickP3)(P.now()); const lg = P.S.exp.log[0]; ok(lg && lg.k === 'canyon' && (s.ev.includes(lg.ev) || lg.ev === s.fail || /泥魔像|峽谷/.test(lg.ev)), '回來的事件屬於赤岩峽谷：' + (lg && lg.ev)); }
// ---- 2 彩虹月光露：傳說冠軍 3%、3 張傳說之證換 1 ----
{ fresh(); P.CFG.legendRep = 0; const p = mk('wolf', { tier: 4 }); p.rank = 3; P.abInit(p); for (const A of P.ABIL) p.perm[A.k] = 9999; p.tr = {}; for (const A of P.ABIL) p.tr[A.k] = 5000; let rb = 0, pr = 0, wins = 0; const N = 6000;
  for (let i = 0; i < N; i++) { p.cupDone = {}; P.S.mat.rainbow = 0; P.S.mat.proof = 0; const r = P.cupRun(p, 'l'); if (r.ok && r.place === 1) { wins++; rb += P.S.mat.rainbow; pr += P.S.mat.proof } }
  ok(wins > N * 0.9, '傳說大會測試狗有贏 ' + wins); const rate = rb / wins * 100; ok(rate > 1.8 && rate < 4.4, `彩虹 ≈ 3%（實測 ${rate.toFixed(2)}%）`); ok(pr === wins, '每次冠軍都有傳說之證');
  P.S.mat.proof = 2; P.S.mat.rainbow = 0; ok(!P.tradeRainbow().ok, '2 張不能換'); P.S.mat.proof = 3; ok(P.tradeRainbow().ok && P.S.mat.rainbow === 1 && P.S.mat.proof === 0, '3 張換 1 瓶');
  const src = ['pet_p3.js', 'pet_gen.js', 'pet_core.js', 'pet_arena.js', 'pet_farm.js', 'pet_shelter.js', 'pet_town.js'].map(f => fs.readFileSync(path.join(root, 'pet', f), 'utf8')).join('\n');
  ok(!/rainbow\s*:\s*[1-9]|rw\.rainbow\s*=\s*1(?![^;]*rainbowLegend)/.test(src.replace(/if \(R\(\) \* 100 < C\.gen\.rainbowLegend\) rw\.rainbow = 1/, '')), '其他地方都不會掉彩虹月光露');
  // 一般月光露：王國冠軍 20%、★3 以上探險會掉
  ok(/rw\.pollen = 1/.test(src) && P.STAGES.filter(s => s.pollen).every(s => s.star >= 3), '一般月光露仍然相對常見（王國盃 20%＋★3 以上探險）'); }
// ---- 3 爸媽開口與臨別禮 ----
{ fresh(); let asks = 0; const N = 4000; for (let i = 0; i < N; i++) { const f = mk('cat'), m = mk('cat'); f.aff = m.aff = 0; const c = { a: f.id, b: m.id, basket: { a: f.id, b: m.id } }; if (P.askRoll(c)) asks++; P.S.pets = [] }
  const rr = asks / N * 100; ok(rr > 13 && rr < 20.5, `低好感時開口率約 15～18%（${rr.toFixed(1)}%）`);
  const f = mk('cat'), m = mk('cat'); const c = { a: f.id, b: m.id, basket: { a: f.id, b: m.id } }; P.askRoll(c); ok(!P.askRoll(c), '一籃只擲一次'); P.askRoll(c, 1);
  const c2 = { a: f.id, b: m.id, basket: { a: f.id, b: m.id } }; P.askRoll(c2, 1); const asker = c2.basket.ask.id; P.askAnswer(c2, false); ok(c2.basket.ask.st === 'no' && P.goOf(c2.basket, asker) === 'stay', '不答應：留下來');
  const cnt = {}; for (let i = 0; i < 3000; i++) { const c3 = { basket: { a: f.id, b: m.id, ask: { id: f.id, st: 0 } } }; const r = P.askAnswer(c3, true); cnt[r.gift] = (cnt[r.gift] || 0) + 1 } ok(Object.keys(P.FAREWELL).every(k => cnt[k] > 100), '五種臨別禮都會出現 ' + JSON.stringify(cnt));
  // 每種臨別禮的效果
  const g = k => { fresh(); const f = mk('fox', { tier: 2 }), m = mk('fox', { tier: 2 }); f.sk = [1]; m.sk = [2]; f.heir = 1; m.heir = 2; const c = { a: f.id, b: m.id, basket: { a: f.id, b: m.id, sync: 1, ask: { id: f.id, st: 0 } } }; P.S.cots = [c]; P.askAnswer(c, true, k); P.S.babies = []; P.S.births = { day: -1, n: 0 }; const out = P.birth(c, 1); return { out, f, m } };
  { const { out, f, m } = g('bless'); const b = out[0]; ok(b.gift === 'bless' && b.blessI != null, '臨別祝福有套上'); ok(!P.S.pets.includes(f) && P.S.pets.includes(m), '答應的那位出門了，另一位留在家');
    let up = 0, n = 200; for (let i = 0; i < n; i++) { const { out } = g('bless'); const b = out[0], s = b.sub[b.blessI]; const d = P.SUBS.find(x => x.k === s[0]).r[Math.max(1, b.tier) - 1]; if (s[1] >= (d[0] + d[1]) / 2 - 0.05) up++ } ok(up === n, '臨別祝福的那條一定在上半'); }
  { let all = 1; for (let i = 0; i < 100; i++) { const { out } = g('will'); if (!out.every(b => (b.sk || []).concat(b.hid || []).some(n => n === 1 || (P.SK[n] && (P.SK[n].evo === 1 || P.SK[n].atav === 1))))) all = 0 } ok(all, '遺志：第一志願 100% 學會'); }
  { fresh(); let kept = 1; for (let i = 0; i < 60; i++) { const t = mk('fox', { tier: 2, baby: 1 }); t.sk = [1]; t.hid = []; t.mut = []; P.applyMut(t, 'skill'); if (!(t.sk.includes(1) || t.hid.includes(1)) || !t.sk.some(n => P.MUTSK.includes(n))) kept = 0 } ok(kept, '突變技能不會把原本的技能弄丟（被擠掉的改成潛藏）'); }
  { const { out } = g('mark'); ok(out.every(b => b.lineX === 1) && P.bloodCap(out[0]) >= 0, '血統印記：lineX'); }
  { const { out } = g('memento'); ok(out.every(b => (b.looksOwn || []).includes('journey')) && P.LOOKS.journey, '旅途紀念：專屬外觀'); }
  { const { out } = g('seed'); ok(out.every(b => b.seed === 1), '隔代種子：寶寶帶種子');
    // 帶種子的寶寶生孩子，突變率 ×2
    fresh(); const s = mk('cat', { seed: 1 }), m2 = mk('cat'), a2 = mk('cat'), b2 = mk('cat'); G.pityPair = G.pitySp = G.pityAll = [1e9, 1e9]; let x = 0, y = 0; const N = 3000;
    for (let i = 0; i < N; i++) { if (born(s, m2)[0].mut.length) x++; if (born(a2, b2)[0].mut.length) y++ } ok(x / y > 1.5 && x / y < 2.8, `種子 ×2（${x} vs ${y}）`); G.pityPair = [10, 14]; G.pitySp = [24, 32]; G.pityAll = [44, 56]; }
  // 玩家自己選「出門闖蕩」（跟一般放生一樣：會進 wander、寄明信片）
  { fresh(); const f = mk('cat'), m = mk('cat'); const c = { a: f.id, b: m.id, basket: { a: f.id, b: m.id, sync: 1 } }; P.S.cots = [c]; const q0 = P.S.mail.q.length, rep0 = P.S.rep || 0; born(f, m, { go: { [m.id]: 'wander' } }); ok(!P.S.pets.includes(m) && P.S.pets.includes(f) && P.S.mail.q.length > q0, '選出門闖蕩＝一般放生（離開、排明信片）'); } }
// ---- 4 訓練能力遺傳 30%（仍受血統上限） ----
{ fresh(); const f = mk('wolf', { tier: 2 }), m = mk('wolf', { tier: 2 }); const n = 400; const avg = () => { let s = 0; for (let i = 0; i < n; i++) s += P.inherit(f, m, { sync: 1, g0: 0, k: 1, litter: 'x' }).baby.ib.str; return s / n };
  const base = avg(); f.tr.str = 60; m.tr.str = 60; const tr = avg(); const want = G.trInherit * 60; ok(Math.abs((tr - base) - want) < want * 0.35 + 1, `訓練 60 點 → 寶寶血統多約 ${want.toFixed(1)}（實測 ${(tr - base).toFixed(1)}）`);
  const TC = P.CFG.ablTrainCap; for (const A of P.ABIL) { f.tr[A.k] = TC; m.tr[A.k] = TC } let over = 0, maxTot = 0; for (let i = 0; i < 300; i++) { const b = P.inherit(f, m, { sync: 1, g0: 0, k: 1, litter: 'x' }).baby; P.abInit(b); P.genInit(b); const bl = P.blood(b), cap = P.bloodCap(b); for (const A of P.ABIL) if (bl[A.k] > cap + 1e-9) over++; b.tr = {}; for (const A of P.ABIL) b.tr[A.k] = TC; const ab = P.abil(b); maxTot = Math.max(maxTot, ab.total); if (ab.total > P.ABIL.length * (cap + TC + G.ablCupMax)) over++ } ok(over === 0, `訓練練滿也不會超過血統上限（主人練滿後總和最高 ${Math.round(maxTot)}）`); }
// ---- 5 三層隱藏保底 ----
{ fresh(); G.mut = 0; const f = mk('cat'), m = mk('cat');
  const thP = P.pityTh('pair', [f.id, m.id].sort((a, b) => a - b).join('-')); ok(thP >= G.pityPair[0] && thP <= G.pityPair[1], '同一對門檻在範圍內 ' + thP);
  let first = 0, eg = 0; for (let i = 1; i <= 20 && !first; i++) for (const b of born(f, m)) { eg++; if (b.mut.length) { first = eg; ok(b.mutBy === 'pair', '同一對保底觸發 ' + b.mutBy); break } } ok(first === thP, `同一對在第 ${thP} 隻觸發（${first}）`);
  // 種族保底：每次換不同爸媽，只有同種族在累積
  fresh(); G.mut = 0; G.pityPair = [1e9, 1e9]; const th = P.pityTh('sp', 'cat'); let sp = 0, eg2 = 0; for (let i = 1; i <= 40 && !sp; i++) { const a = mk('cat'), b = mk('cat'); for (const x of born(a, b)) { eg2++; if (x.mut.length) { sp = eg2; ok(x.mutBy === 'sp', '種族保底觸發 ' + x.mutBy); break } } } ok(sp === th, `種族在第 ${th} 隻觸發（${sp}）`);
  // 全收容所保底
  fresh(); G.mut = 0; G.pitySp = [1e9, 1e9]; const tha = P.pityTh('all'); let al = 0, eg3 = 0; const sps = ['cat', 'wolf', 'fox', 'retriever']; for (let i = 1; i <= 70 && !al; i++) { const s = sps[i % 4], a = mk(s), b = mk(s); for (const x of born(a, b)) { eg3++; if (x.mut.length) { al = eg3; ok(x.mutBy === 'all', '全收容所保底觸發 ' + x.mutBy); break } } } ok(al === tha, `全收容所在第 ${tha} 隻觸發（${al}）`);
  ok(P.pityTh('all') > 0 && P.S.mp.all <= 3, '觸發後歸零重擲（' + P.S.mp.all + '）'); G.pityPair = [10, 14]; G.pitySp = [24, 32];
  // 3% 基本率不變
  const src = fs.readFileSync(path.join(root, 'pet/pet_data.js'), 'utf8'); ok(/mut: 3,/.test(src), '基本突變率仍是 3%');
  // 提示：遠的時候不說（除了偶爾的假提示），接近時才說，而且沒有數字
  fresh(); const a = mk('cat'), b = mk('cat'); G.pityHintFake = 0; ok(P.pityHint(a, b, null) === null, '還遠的時候不提示'); const pk = [a.id, b.id].sort((x, y) => x - y).join('-'); P.S.mp.pair[pk] = Math.ceil(P.pityTh('pair', pk) * 0.8); const h = P.pityHint(a, b, null); ok(h && h[0] === '西施' && !/\d/.test(h[1].replace(/\d+號/g, '')), '接近時西施含糊提示：' + (h && h[1]));
  G.pityHintFake = 8; let fk = 0; const c = mk('cat'), d = mk('cat'); for (let i = 0; i < 3000; i++) if (P.pityHint(c, d, null)) fk++; ok(fk > 150 && fk < 340, '偶爾假提示約 8%：' + fk);
  G.mut = 3; }
// ---- 6 技能位階與洗技能規則 ----
{ fresh(); const tierOf = n => P.skTier(n);
  ok(tierOf(1) === 'normal' && P.MUTSK.every(n => tierOf(n) === 'rare') && Object.values(P.EVO).every(n => tierOf(n) === 'blood') && P.MIX.every(x => tierOf(x.n) === 'fusion') && Object.values(P.ATAV).every(n => tierOf(n) === 'atav'), '五種位階對應正確');
  ok([301, 302, 303, 304].every(n => P.MUTSK.includes(n) && P.SK[n].impl), '4 招突變技（301～304）都做好了');
  const p = mk('fox', { tier: 4, baby: 1 }); p.bornDay = P.dayKey(P.now()) - 9; p.sk = [1, 2, 3, 4]; let bad = 0; for (let i = 0; i < 300; i++) for (const w of P.skillWeights(p, 0)) if (['evo', 'mix', 'mut', 'atav'].includes(w.s.gen)) bad++; ok(bad === 0, '一般洗技能池子沒有稀有／血脈／融合／隔代');
  const ev = Object.values(P.EVO)[0], mx = P.MIX[0].n, at = Object.values(P.ATAV)[0]; for (const n of [ev, mx, at]) { p.sk = [n, 2, 3, 4]; P.S.gold = 1e9; P.S.bread = 1e9; P.S.disk = 1e9; const r = P.reroll(p, 0, 'bread'); ok(!r.ok && p.sk[0] === n, `${P.SKT[tierOf(n)].name} 洗不掉`) }
  let rare = 0; const N = 20000; p.sk = [1, 2, 3, 4]; P.S.gold = 1e12; P.S.bread = 1e12; P.S.disk = 1e9; for (let i = 0; i < N; i++) { p.sk = [1, 2, 3, 4]; p.pity = 0; const r = P.reroll(p, 0, 'bread'); if (r && r.ok && P.MUTSK.includes(p.sk[0])) rare++ } const rp = rare / N * 100; ok(rp > 0.3 && rp < 0.75, `稀有技約 0.5%（${rp.toFixed(2)}%）`);
  // 隔代覺醒：爸媽沒有、祖父母有
  fresh(); const g1 = mk('fox'), g2 = mk('fox'), g3 = mk('fox'), g4 = mk('fox'); g1.sk = [7]; P.famRec(g1); const f = mk('fox', { par: [g1.id, g2.id] }), m = mk('fox', { par: [g3.id, g4.id] }); f.sk = [1]; m.sk = [2]; f.hid = []; m.hid = [];
  ok(P.atavCand(f, m).includes(7), '祖父母的技能是隔代候選'); let atv = 0; for (let i = 0; i < 2000; i++) { const b = { sk: [], hid: [], tier: 1, id: 0, sp: 'fox', baby: 1 }; if (P.atavRoll(b, f, m)) atv++ } ok(atv > 140 && atv < 270, '隔代覺醒約 10%：' + atv); const b = { sk: [], hid: [], tier: 1, sp: 'fox', baby: 1 }; P.atavRoll(b, f, m, 1); ok(P.skTier(b.atav) === 'atav' && P.SK[b.atav].name.includes('祖靈'), '隔代覺醒技名稱：' + P.SK[b.atav].name);
  ok(/class="skt/.test(P.skTag(1)) && /一般技/.test(P.skTag(1)) && /稀有技/.test(P.skTag(P.MUTSK[0])), 'UI 標籤'); }
// ---- 7 舊存檔搬家（P3 假關卡 → 真關卡） ----
{ const S = fresh(); S.exp.teams = [{ sk: 's3', ids: [], until: 0 }]; S.exp.log = [{ k: 's1' }]; P.migrate(S); ok(S.exp.teams[0].sk === 'mine' && S.exp.log[0].k === 'canyon', '舊關卡代號搬家'); }
// ---- 8 大頭照：每個小圖示都用 UI.av（大頭照），沒有直接畫全身 icon 的地方 ----
{ const src = ['pet_shelter.js', 'pet_town.js', 'pet_farm.js', 'pet_p4ui.js', 'pet_main.js'].map(f => fs.readFileSync(path.join(root, 'pet', f), 'utf8')).join('\n'); ok(/A\.portraitCv|art\.icon\(/.test(src) && !/A\.drawIcon|iconFull/.test(src), '小圖示全部是大頭照'); const art = fs.readFileSync(path.join(root, 'pet/pet_art.js'), 'utf8'); ok(/A\.portraitCv\s*=/.test(art) && !/A\.HEADMARK\s*=/.test(art), '混血大頭照不再畫頭上記號'); }
console.log(`unit_p4: ${pass} 通過、${fail} 失敗`); process.exitCode = fail ? 1 : 0;
