// 連續照顧：當天在收容所／小屋／農場／穀倉做任何動作就算一天；家具自動餵不算。node pettest/tools/unit_care.mjs
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url)), root = path.join(dir, '..');
const store = {}; const ctx = { console, Math, Date, JSON, setTimeout, clearTimeout, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k] } };
ctx.window = ctx; ctx.PET = {}; vm.createContext(ctx);
for (const f of ['pet/pet_data.js', 'pet/pet_core.js', 'pet/pet_p3.js', 'pet/pet_gen.js', 'pet/pet_p4.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const P = ctx.PET; let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗', m) } };
const D = 864e5; let T = Date.UTC(2026, 10, 3, 4, 0); P.now = () => T;   // 台北 12:00
P.S = P.newState(); P.migrate(P.S); P.S.unlock = 1; const L = () => P.S.luck;
const p = P.makeAnimal({ sp: 'cat', tier: 1, baby: 0, aff: 100, q: 1 }); P.S.pets.push(p); P.famRec(p);
ok(L().streak === 0, '一開始 0 天');
P.sceneName = 'shelter'; P.careVisit(); ok(L().streak === 1, '收容所點一下＝第 1 天 got ' + L().streak);
P.careVisit(); P.careVisit(); ok(L().streak === 1, '同一天點很多下還是 1 天');
T += D; P.sceneName = 'room'; P.careVisit(); ok(L().streak === 2, '隔天打開小屋＝第 2 天');
T += D; P.sceneName = 'barn'; P.careVisit(); ok(L().streak === 3, '隔天在穀倉買家具＝第 3 天');
T += D; P.sceneName = 'farm'; P.careVisit(); ok(L().streak === 4, '隔天在農場移動寵物＝第 4 天');
T += D; P.sceneName = 'arena'; P.careVisit(); P.sceneName = 'trail'; P.careVisit(); ok(L().streak === 4 && L().lastCare === P.dayKey(T) - 1, '只去競技場／探險路上不算');
P.interact(p, 'kibble', undefined, { auto: 1 }); ok(L().lastCare === P.dayKey(T) - 1, '家具自動餵（沒進來）不算');
P.sceneName = 'shelter'; P.careVisit(); ok(L().streak === 5, '同一天再進收容所就接上＝第 5 天');
T += 2 * D; P.interact(p, 'kibble', undefined, { auto: 1 }); T += D; P.interact(p, 'pet', '頭'); ok(L().streak === 1, '中間有一天只有自動餵＝斷掉，重新從 1 天算 got ' + L().streak);
T += D; P.sceneName = null; P.interact(p, 'pet', '頭'); ok(L().streak === 2, '摸摸、餵食本來就算');
// 介面有接上（畫面點擊、面板按鈕、下方按鈕）
const M = fs.readFileSync(path.join(root, 'pet/pet_main.js'), 'utf8');
ok((M.match(/P\.careVisit\(\)/g) || []).length >= 3, '畫布、面板、下方按鈕都會呼叫 careVisit');
const F = fs.readFileSync(path.join(root, 'pet/pet_furn.js'), 'utf8'); ok(/auto: !\(o && o\.hand\)/.test(F), '自動餵還是帶 auto');
console.log(`unit_care: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
