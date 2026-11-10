// 獎牌室／小屋裡面規則測試：node pettest/tools/unit_room.mjs
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url)), root = path.join(dir, '..');
const store = {}; const ctx = { console, Math, Date, JSON, setTimeout, clearTimeout, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k] } };
ctx.window = ctx; ctx.PET = {}; vm.createContext(ctx);
for (const f of ['pet/pet_data.js', 'pet/pet_core.js', 'pet/pet_lines.js', 'pet/pet_p3.js', 'pet/pet_gen.js', 'pet/pet_p4.js', 'pet/pet_cup.js', 'pet/pet_room.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const P = ctx.PET; let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log('✓', m) } else { fail++; console.log('✗', m) } };
P.S = P.newState(); P.migrate(P.S); P.S.unlock = 1; P.CFG.capOff = 1; P.repLv = () => 9;
const J = JSON.parse(fs.readFileSync(path.join(root, 'assets/scenes/room/room_slots.json'), 'utf8'));
ok(JSON.stringify(J.slots) === JSON.stringify(P.ROOM.slots) && J.scale === P.ROOM.scale, '獎牌掛勾座標跟背景 json 一致');
ok(P.ROOM.slots.length === 21, '牆上 21 格');
ok(fs.existsSync(path.join(root, 'assets/scenes/room/room_bg.jpg')), '小屋背景在');
const all = []; for (const c of ['v', 's', 'k', 'l']) for (const pl of [1, 2, 3]) { const k = P.medalImg({ c, pl }); all.push(k); ok(fs.existsSync(path.join(root, `assets/scenes/room/medals/medal_${k}.png`)), `獎牌圖 ${k} 在`) }
ok(new Set(all).size === 12, '四種大會×金銀銅，12 種圖都不一樣');
ok(P.medalImg({ c: 'l', pl: 1 }) === 'legend_gold' && P.medalImg({ c: 'v', pl: 3 }) === 'village_bronze', '傳說金＝翡翠、村莊銅');
const ms = Array.from({ length: 30 }, (_, i) => ({ c: 'v', pl: 1 + (i % 3), name: 'm' + i }));
const w = P.medalWall(ms); ok(w.length === 21 && w[0].name === 'm9' && w[20].name === 'm29', '超過 21 面只掛最新的 21 面');
ok(P.medalWall([{ c: 'v', pl: 5 }, null, { c: 'v', pl: 1 }]).length === 1, '沒得名（第 5 名）不掛牌');
ok(P.medalWall(undefined).length === 0, '沒有獎牌＝空牆');
const n = P.medalCount([{ pl: 1 }, { pl: 1 }, { pl: 2 }, { pl: 3 }]); ok(n[1] === 2 && n[2] === 1 && n[3] === 1, '金銀銅數量對');
const a = P.makeAnimal({ sp: 'cat', tier: 1, baby: 0, aff: 900, q: 1 }), b = P.makeAnimal({ sp: 'dog', tier: 1, baby: 0, aff: 900, q: 1 }), c = P.makeAnimal({ sp: 'wolf', tier: 1, baby: 0, aff: 900, q: 1 });
P.S.pets.push(a, b, c); a.medals = [{ c: 'v', pl: 1 }]; b.medals = [{ c: 'v', pl: 1 }, { c: 's', pl: 2 }];
const rows = P.medalRows(); ok(rows.length === 2 && rows[0] === b && rows[1] === a, '獎牌室只列有獎牌的寶寶，多的排前面');
// 大會真的跑完，獎牌圖對得上
const sc = P.cupScore; P.cupScore = () => 999; const r = P.cupRun(c, 'v'); P.cupScore = sc;
ok(r.ok && c.medals.length === 1 && P.medalImg(c.medals[0]) === 'village_gold', '村莊小賽冠軍 → 掛村莊金牌');
const src = fs.readFileSync(path.join(root, 'pet/pet_room.js'), 'utf8');
ok(!/\.gold\s*[-+]?=[^=]|medals\.push|\.aff\s*[-+]?=[^=]|\.hunger\s*[-+]?=[^=]|\.rank\s*=[^=]/.test(src), '獎牌室／小屋畫面只讀，不改數值');
ok(fs.readFileSync(path.join(root, 'index.html'), 'utf8').indexOf('pet_room.js') > fs.readFileSync(path.join(root, 'index.html'), 'utf8').indexOf('pet_cup.js'), 'index.html 有載 pet_room.js');
const sfx = fs.readFileSync(path.join(root, 'pet/pet_sfx.js'), 'utf8');
for (const n of ['s_pet_tap', 's_ui_click', 's_pet_feed', 's_pet_knock', 's_pet_hatch', 's_pet_sweep']) ok(sfx.includes(`'${n}'`) && fs.existsSync(path.join(root, `assets/sfx/${n}.ogg`)), `音效 ${n} 有檔案、有接上`);
for (const n of ['m_pet_cot', 'j_pet_birth', 'j_pet_tierup']) ok(fs.existsSync(path.join(root, `assets/music/${n}.ogg`)), `曲子 ${n} 在`);
ok(/READY[^;]*'m_pet_cot'/.test(fs.readFileSync(path.join(root, 'pet/pet_bgm.js'), 'utf8')), '小屋曲加進 READY（不再用替代曲）');
ok(!/\.(gold|aff|hunger|tired)\s*[-+]?=[^=]/.test(sfx), '音效只出聲，不改數值');
console.log(`unit_room: ${pass} 過, ${fail} 失敗`); process.exit(fail ? 1 : 0);
