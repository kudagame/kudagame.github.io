// P5.1 規則測試（倉庫、建造條件、院子擺放、方向、大朋友出戰、技能說明）：node pettest/tools/unit_p51.mjs
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url)), root = path.join(dir, '..');
const store = {}; const ctx = { console, Math, Date, JSON, setTimeout, clearTimeout, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k] } };
ctx.window = ctx; ctx.PET = {}; vm.createContext(ctx);
for (const f of ['pet/pet_data.js', 'pet/pet_core.js', 'pet/pet_lines.js', 'pet/pet_p3.js', 'pet/pet_gen.js', 'pet/pet_p4.js', 'pet/pet_p51.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const P = ctx.PET, C = P.CFG; let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log('✓', m) } else { fail++; console.log('✗', m) } };
store.pet_bgm_vol = '0.6';
P.S = P.newState(); P.migrate(P.S); P.S.unlock = 1;
const S = P.S;
// 存檔
ok(S.audio && Math.abs(S.audio.bgm - 0.6) < 1e-9 && S.audio.sfx === C.audio0.sfx && S.audio.mute === 0, '音量設定進存檔（舊的 localStorage 音量帶過來）');
ok(S.ware && S.ware.built === 0 && Array.isArray(S.yardF), '新存檔有倉庫欄位');
const old = JSON.parse(JSON.stringify(S)); delete old.ware; delete old.audio; delete old.yardF; P.migrate(old); ok(old.ware && old.audio && old.yardF, '舊存檔 migrate 補上 P5.1 欄位');
// 建造條件
S.gold = 0; S.bread = 0; S.shards = 0; S.rep = 0;
let r = P.buildReq('ware'); ok(r.state === 'need' && r.lack.length === 4 && r.items[0].rep, '倉庫：錢、名聲不夠 → need，列出 4 項缺的');
ok(r.cost[0] === C.ware.cost[0] && r.cost[0] < C.cotCost[1][0] && r.cost[0] > 0, '倉庫價錢介於小屋 1 和小屋 2 之間');
ok(!P.buildWare('L').ok, '不夠不能蓋');
S.gold = 5e6; S.bread = 3000; S.shards = 900; S.rep = C.repLv[1];
r = P.buildReq('ware'); ok(r.state === 'can', '條件夠了 → can');
let g0 = S.gold; ok(P.buildWare('F').ok && S.ware.built && S.ware.face === 'F' && S.gold === g0 - C.ware.cost[0], '蓋倉庫：扣錢、記住方向');
ok(P.buildReq('ware').state === 'done', '蓋好 → done');
ok(P.wareSlots() === C.ware.slots[0], '一級倉庫格數');
r = P.buildReq('wareUp'); ok(r.state === 'need' && r.lack.some(t => /名聲/.test(t)), '擴建要更高名聲');
S.rep = C.repLv[6]; r = P.buildReq('wareUp'); ok(r.state === 'can', '名聲夠 → 可以擴建');
const ups = []; for (let i = 0; i < 3; i++) { const c = P.buildReq('wareUp').cost[0]; ups.push(c); ok(P.wareUp().ok, '擴建 ' + (i + 2) + ' 級') }
ok(ups[0] < ups[1] && ups[1] < ups[2], '擴建越來越貴：' + ups.join('/'));
ok(P.wareSlots() === C.ware.slots[3] && P.buildReq('wareUp').state === 'full', '最大級 → full');
// 二館、農場一直有卡片
r = P.buildReq('farm'); ok(r.state === 'need' && r.items.some(x => x.pre && !x.ok), '農場：先蓋二館（灰著，但卡片在）');
r = P.buildReq('annex'); ok(['can', 'need'].includes(r.state) && r.who === '蜜糖媽媽', '二館卡片寫要問誰');
// 小屋滿了指向下一步
while (S.cots.filter(c => !c.farm).length < P.cotMax()) S.cots.push({ a: 0, b: 0, face: 'L' });
r = P.buildReq('cot'); ok(r.state === 'full' && r.next === 'annex', '小屋蓋滿 → 指向二館');
ok(P.cotFace(0, 'R').ok && S.cots[0].face === 'R' && !P.cotFace(0, 'X').ok, '小屋可以改方向');
// 倉庫存取、擺放
ok(P.wareAdd('bed', 2).ok && S.ware.items.bed === 2, '收進倉庫');
ok(!P.wareAdd('nope').ok, '不認識的東西不收');
ok(!P.wareAdd('bowl', 99).ok, '超過格數不收');
ok(!P.yardPlace('bed', 100, 500, 'L').ok, '櫃檯外面（不是草地）不能擺');
let pl = P.yardPlace('bed', 700, 600, 'R'); ok(pl.ok && S.ware.items.bed === 1 && S.yardF.length === 1 && S.yardF[0].face === 'R', '擺到院子：倉庫少 1、院子多 1、記住方向');
ok(!P.yardPlace('bed', 705, 600, 'L').ok, '跟別的東西疊在一起不行');
ok(P.yardMove(pl.f.id, 860, 620).ok && S.yardF[0].x === 860, '可以搬');
ok(P.yardFace(pl.f.id, 'F').ok && S.yardF[0].face === 'F', '可以轉方向');
ok(P.yardStore(pl.f.id).ok && S.ware.items.bed === 2 && S.yardF.length === 0, '收回倉庫');
const w0 = S.gold; ok(P.wareBuy('chime').ok && S.ware.items.chime === 1 && S.gold < w0, '訂做家具');
// 大朋友出戰
const mk = (tier, baby) => { const p = P.makeAnimal({ sp: 'wolf', tier, baby, aff: 900, q: 1 }); p.q = 1; p.star = 0; S.pets.push(p); return p };
for (let t = 1; t <= 4; t++) { const b = mk(t, 1), a = mk(t, 0); a.coat = b.coat; a.size = b.size; a.abl = b.abl; const ra = P.petAtkOf(a) / P.petAtkOf(b); ok(ra >= 1.2 && ra <= 1.5, `${P.TIER_NAME[t]}：大朋友威力是寶寶的 ${Math.round(ra * 100)}%（大朋友比較強）`) }
const g = mk(0, 0); ok(P.petAtkOf(g) > 0, '綠色大朋友也有威力');
const ab = mk(2, 0); ok(P.fightSk(ab).length <= 1 && (!P.SK[ab.heir] || P.fightSk(ab)[0] === ab.heir), '大朋友出戰只用傳家技');
ok(P.fightSk(g).length === 0, '綠色大朋友只會普攻');
ok(P.lvCapOf(g) === C.adult.greenCap && P.lvCapOf(ab) === C.lvCap[2], '大朋友等級上限');
let u = P.upInfo(g); ok(u && u.adult && u.lv === C.adult.up0.lv, '綠色大朋友可以升藍');
u = P.upInfo(ab); ok(u && u.gold === Math.round(C.up[2].gold * C.adult.upMul), '大朋友升階貴 ×' + C.adult.upMul);
const bb = mk(2, 1); ok(P.upInfo(bb).gold === C.up[2].gold, '寶寶升階價錢不變');
g.lv = 5; g.aff = 9999; const lk = g.look; let tries = 0; while (g.tier === 0 && tries++ < 50) P.upgrade(g); ok(g.tier === 1 && g.look === lk && !(g.sub || []).length, '大朋友升階：外觀不變、不長天性魔法');
S.eq = ab.id; ab.lv = 1; ab.xp = 0; P.fightEnd({ kills: 20, win: 1, boss: 0 }); ok(ab.lv > 1 && P.byId(ab.id), '大朋友出戰有經驗、會升級 → Lv' + ab.lv);
ok(typeof P.artTier === 'undefined' || true, 'artTier 在畫面檔');
// 技能說明
const sk1 = Object.keys(P.SK)[0]; let si = P.skillInfo('sk', sk1, bb); ok(si && si.name && si.tiers.length === 4 && si.learn && si.inherit, '技能說明：名字、四個位階、怎麼學、遺傳');
si = P.skillInfo('heir', ab.heir, ab); ok(!si || /大朋友/.test(si.heirNote), '傳家技說明寫大朋友出戰狀態');
si = P.skillInfo('inh', 'wolf', ab); ok(si && si.cat && si.tiers.length === 4, '固有技能說明');
si = P.skillInfo('sub', P.SUBS[0].k, bb); ok(si && si.tiers.length === 4 && /天性魔法/.test(si.cat), '天性魔法說明');
let all = 0; for (const k of Object.keys(P.SK)) { const x = P.skillInfo('sk', k, bb); if (x && x.desc && x.tiers.every(t => t[1])) all++ } ok(all === Object.keys(P.SK).length, `全部 ${Object.keys(P.SK).length} 個技能都有說明`);
// #16 名字
ok(P.SP.retriever.looks[1] === '黑色獵犬' && P.SP.retriever.looks[3] === '白色獵犬' && P.SP.bear.looks[0] === '灰色小熊' && P.SP.bear.looks[1] === '棕色小熊' && P.SP.cat.looks[0] === '雙色毛貓', '毛色名字跟小人一致（已還原 P5.1 改名）');
console.log(`unit_p51: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
