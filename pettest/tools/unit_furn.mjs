// P5 農場家具規則測試：node pettest/tools/unit_furn.mjs
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url)), root = path.join(dir, '..');
const store = {}; const ctx = { console, Math, Date, JSON, setTimeout, clearTimeout, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = String(v), removeItem: k => delete store[k] } };
ctx.window = ctx; ctx.PET = {}; vm.createContext(ctx);
for (const f of ['pet/pet_data.js', 'pet/pet_core.js', 'pet/pet_p3.js', 'pet/pet_gen.js', 'pet/pet_p4.js', 'pet/pet_furn.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const P = ctx.PET, C = P.CFG, FC = C.furn, H = 3600e3; let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log('✓', m) } else { fail++; console.log('✗', m) } };
let NOW = 0; P.now = () => NOW;
const fresh = () => { P.S = P.newState(); P.migrate(P.S); P.S.unlock = 1; P.S.farm = 1; P.S.gold = 8.7e6; return P.S };
const mk = (sp, o) => { const p = P.makeAnimal(Object.assign({ sp, tier: 1, baby: 0, aff: 0, q: 1 }, o || {})); P.S.pets.push(p); P.famRec(p); return p };
const day0 = P.dayStart(P.dayKey(Date.UTC(2026, 10, 3, 0)) );   // 某天 05:00
const at = h => day0 + (h - 5) * H;
// ---- 1 商店：先後順序、常客門檻、隱藏 ----
{ fresh(); const st = k => P.furnState(P.FURN_K[k]);
  ok(st('bowl') === 'buy' && st('chime') === 'buy' && st('feeder') === 'lock' && st('toybox') === 'lock' && st('bed') === 'lock' && st('feeder2') === 'lock', '一開始只有飯碗、風鈴能買');
  ok(!P.furnBuy('bed').ok, '小床（常客）一開始買不了');
  ok(P.furnBuy('bowl').ok && st('feeder') === 'buy', '有飯碗才能升級自動餵食器');
  ok(P.furnBuy('feeder').ok && P.S.furn.feed === 2 && st('bowl') === 'own' && st('toybox') === 'buy', '自動餵食器換掉飯碗、玩具箱解鎖');
  ok(P.furnTier() === 0 && P.S.furn.spent === 65000, '花 65,000 還是新客人');
  ok(P.furnBuy('chime').ok && P.furnTier() === 1 && st('bed') === 'buy', '累積 155,000 → 常客、小床露出來');
  ok(P.furnBuy('bed').ok && P.furnBuy('toybox').ok && P.furnTier() === 2 && st('feeder2') === 'buy', '累積 320,000 → 熟客、大肚子餵食器');
  ok(P.S.gold === 8.7e6 - 320000, '金幣扣對'); }
// ---- 2 飯碗：07:00／17:00 放飯，吃完要倒滿；空了就沒得吃 ----
{ fresh(); NOW = at(6); for (let i = 0; i < 20; i++) mk('wolf'); P.furnBuy('bowl'); P.furnTick(NOW);
  ok(P.S.furn.bowl === 20 && P.S.pets.every(p => !P.counts(p).kibble), '06:00 還沒放飯，飯碗滿的');
  NOW = at(7.1); P.furnTick(NOW); const a0 = P.S.pets[0].aff;
  ok(P.S.pets.every(p => P.counts(p).kibble === 1) && P.S.furn.bowl === 0, '07:00 二十隻各吃 1 份，飯碗空了');
  ok(a0 >= C.affGain.kibble, '吃飯碗也加乾飼料的好感（' + a0 + '）');
  NOW = at(17.1); P.furnTick(NOW); ok(P.S.pets.every(p => P.counts(p).kibble === 1), '17:00 飯碗空的 → 沒得吃');
  P.S.furn.bowl = 20; P.S.furn.meal = 1; P.furnTick(NOW); ok(P.S.pets.every(p => P.counts(p).kibble === 2) && P.S.furn.bowl === 0, '倒滿以後 17:00 那餐補吃');
  P.S.furn.bowl = 20; NOW = at(18); ok(!P.furnWants(P.S.pets[0], 'feed') && !P.furnUse(P.S.pets[0], 'feed').ok && P.S.furn.bowl === 20, '吃滿 2 份的不會再吃（好飽）'); }
// ---- 3 自動餵食器：不用倒、手餵過的不重複 ----
{ fresh(); NOW = at(6); for (let i = 0; i < 20; i++) mk('cat'); P.S.furn = null; P.furnBuy('bowl'); P.furnBuy('feeder'); P.interact(P.S.pets[0], 'kibble'); P.interact(P.S.pets[0], 'kibble');
  NOW = at(7.5); P.furnTick(NOW); NOW = at(17.5); P.furnTick(NOW);
  ok(P.S.pets.every(p => P.counts(p).kibble === 2), '自動餵食器兩餐都餵到 20 隻'); ok(P.S.furn.bowl === 20, '自動的沒有庫存在扣');
  NOW = at(29.5); P.furnTick(NOW); ok(P.S.pets.every(p => !P.counts(p).kibble), '隔天 05:00 重新算'); NOW = at(31.2); P.furnTick(NOW); ok(P.S.pets.every(p => P.counts(p).kibble === 1), '隔天 07:00 又放飯');
  // 大肚子
  P.S.furn.spent = 300000; ok(P.furnBuy('feeder2').ok, '熟客買大肚子'); P.S.bread = 6; NOW = at(36.1); P.furnTick(NOW); ok(P.S.pets.filter(p => P.counts(p).bread === 1).length === Math.floor(6 / C.breadPerFeed), `12:00 用收容所積下來的剩食麵包餵（${Math.floor(6 / C.breadPerFeed)} 隻，麵包用完就停）`); }
// ---- 4 風鈴：全農場每 30 分 +1，每天最多 12，離線照算 ----
{ fresh(); NOW = at(8); for (let i = 0; i < 20; i++) mk('fox', { aff: 0 }); P.furnBuy('chime'); P.furnTick(NOW);
  NOW += 29 * 60e3; P.furnTick(NOW); ok(P.S.pets.every(p => !P.counts(p).chime), '29 分鐘還沒響');
  NOW += 1 * 60e3; P.furnTick(NOW); ok(P.S.pets.every(p => P.counts(p).chime === 1 && p.aff >= 1), '30 分鐘：二十隻都 +1');
  NOW += 10 * H; P.furnTick(NOW); ok(P.S.pets.every(p => P.counts(p).chime === FC.chimeCap), '離開 10 小時：補算到每天上限 12');
  const tot = P.S.pets.reduce((a, p) => a + p.aff, 0) / 20; ok(tot >= 12 && tot <= 20, `每隻一天約 +${tot.toFixed(1)} 好感（基本 12 × 位階倍率）`);
  const out = mk('fox'); out.away = { until: NOW + H }; NOW += 2 * H; P.furnTick(NOW); ok(!P.counts(out).chime, '出門的（探險、集訓、散步）不算'); }
// ---- 5 玩具箱、小床、睡得好 ----
{ fresh(); NOW = at(9); const p = mk('wolf'); P.S.furn = { feed: 2, chime: 0, toy: 1, bed: 1, spent: 0, bowl: 0, fd: -1, meal: 0, ch: 0, seen: {} };
  let n = 0; while (P.furnUse(p, 'toy').ok) n++; ok(n === FC.toyN, '玩具箱每天 3 次');
  const pw = P.expPow(p); ok(P.furnUse(p, 'bed').ok && !P.furnUse(p, 'bed').ok, '小床每天 1 次'); ok(P.goodSleep(p) && Math.abs(P.expPow(p) - Math.round(pw * 1.05 * 10) / 10) < 1e-9, `睡得好：探險戰力 ${pw} → ${P.expPow(p)}`);
  NOW += 2.01 * H; ok(!P.goodSleep(p) && P.expPow(p) === pw, '2 小時後睡得好結束');
  const kid = mk('wolf', { baby: 1 }); kid.bornDay = P.dayKey(NOW); ok(!P.furnWants(kid, 'toy') && !P.furnUse(kid, 'bed').ok, '剛出生的寶寶不能用'); }
// ---- 6 沒有新的消耗數值 ----
{ const src = fs.readFileSync(path.join(root, 'pet/pet_furn.js'), 'utf8'); ok(!/need\.[fmc]\s*[-+]?=|fat\s*[-+]?=|P\.rest\(/.test(src), '家具沒有直接動需求條、疲勞'); }
// ---- 7 連續照顧：自動放飯不算，玩家自己餵／拖過去才算 ----
{ fresh(); NOW = at(6.5); for (let i = 0; i < 3; i++) mk('wolf'); P.furnBuy('bowl'); P.furnBuy('feeder'); P.S.luck = { streak: 0, lastCare: -1 };
  NOW = at(7.1); P.furnTick(NOW); ok(P.S.pets.every(p => P.counts(p).kibble === 1) && P.S.luck.streak === 0 && P.S.luck.lastCare === -1, '自動餵食器放飯：吃到了，但連續照顧天數不動');
  P.S.bread = 50; P.S.furn.feed = 3; NOW = at(12.1); P.furnTick(NOW); ok(P.S.pets.every(p => P.counts(p).bread === 1) && P.S.luck.streak === 0, '大肚子餵食器的麵包餐也不算');
  P.furnUse(P.S.pets[0], 'feed'); ok(P.S.luck.streak === 0, '寵物自己走去吃（沒有 hand）不算');
  P.furnUse(P.S.pets[1], 'feed', { hand: 1 }); ok(P.S.luck.streak === 1 && P.S.luck.lastCare === P.dayKey(NOW), '玩家把寵物拖到餵食器上＝玩家照顧，算 1 天');
  fresh(); NOW = at(9); const q = mk('cat'); P.S.luck = { streak: 0, lastCare: -1 }; P.interact(q, 'kibble'); ok(P.S.luck.streak === 1, '手餵照舊算連續照顧'); }
// ---- 8 每天最多出生：沒有農場 6、有農場 3 ----
{ fresh(); P.S.farm = 0; ok(P.birthCap() === 6, '還沒有農場：每天最多出生 6 隻'); P.S.farm = 1; ok(P.birthCap() === 3, '有農場：全部小屋合計每天最多 3 隻');
  NOW = at(6); const a = mk('wolf', { aff: 600 }), b = mk('wolf', { aff: 600 }); const c = { a: a.id, b: b.id, since: NOW - 5 * 864e5 }; P.S.cots.push(c);
  const k = P.dayKey(NOW); P.S.births = { day: k, n: 3 }; let tries = 0; for (; tries < 40 && !c.basket; tries++) P.pregRoll(c, k); ok(!c.basket, '今天已經出生 3 隻 → 不擲育兒籃');
  P.S.births = { day: k, n: 2 }; for (tries = 0; tries < 200 && !c.basket; tries++) P.pregRoll(c, k); ok(!!c.basket, '還沒到 3 隻 → 照常擲（' + tries + ' 次內出現）');
  c.basket = null; P.S.farm = 0; P.S.births = { day: k, n: 5 }; for (tries = 0; tries < 200 && !c.basket; tries++) P.pregRoll(c, k); ok(!!c.basket, '沒有農場時 5 隻也還能擲（上限 6）'); }
// ---- 9 農場住滿 20 隻：育兒籃不擲 ----
{ fresh(); NOW = at(6); const a = mk('fox', { aff: 600 }), b = mk('fox', { aff: 600 }); const c = { a: a.id, b: b.id, since: NOW - 5 * 864e5 }; P.S.cots.push(c);
  ok(P.cotCheck(c) === '', '19 隻以下可以擲（' + P.S.pets.length + ' 隻）');
  while (P.S.pets.length < P.houseCap()) mk('rabbit'); ok(P.S.pets.length === 20 && /住滿 20 隻/.test(P.cotCheck(c)), '住滿 20 隻 → ' + P.cotCheck(c));
  const k = P.dayKey(NOW); for (let i = 0; i < 100; i++) P.pregRoll(c, k); ok(!c.basket, '住滿時擲 100 次都不會出現育兒籃');
  P.S.pets.pop(); ok(P.cotCheck(c) === '', '空出 1 個位子又可以了'); }
// ---- 10 農場小屋：第 0／7／21／42／70 天各開 1 個位子 ----
{ fresh(); P.S.farm = 1; P.S.bread = 9999; P.S.shards = 9999; NOW = at(10); P.S.farmAt = 0; P.tickP3(NOW); ok(P.S.farmAt === NOW, '第一次看到農場就記開張時間');
  const open = d => { NOW = P.S.farmAt + d * 864e5 + 60e3; return P.farmHutOpen() };
  ok([0, 6, 7, 20, 21, 41, 42, 69, 70, 400].map(open).join() === '1,1,2,2,3,3,4,4,5,5', '開放位子：' + [0, 6, 7, 20, 21, 41, 42, 69, 70, 400].map(open).join());
  open(0); ok(P.buildFarmHut().ok && !P.buildFarmHut().ok, '第 0 天只能蓋 1 間');
  open(7); const g0 = P.S.gold; ok(P.buildFarmHut().ok && P.S.gold === g0 - C.farmHut.cost[1][0], '第 7 天蓋第 2 間（扣 ' + C.farmHut.cost[1][0] + '）');
  open(70); let n = 0; while (P.buildFarmHut().ok) n++; ok(P.farmHuts().length === 5 && n === 3 && /蓋滿 5 間/.test(P.buildFarmHut().msg), '第 70 天蓋滿 5 間，第 6 間不行');
  ok(P.S.cots.every(c => c.farm) && P.farmHuts().length === 5, '農場小屋都有 farm 標記');
  P.S.annex = 1; ok(P.buildCot().ok && !P.S.cots[0].farm && P.S.cots.slice(1).every(c => c.farm), '收容所小屋排在農場小屋前面（院子畫面照序號畫）');
  ok(P.S.cots.filter(c => !c.farm).length === 1, '收容所小屋數量只算自己的'); }
console.log(`unit_furn: ${pass} 通過、${fail} 失敗`); process.exitCode = fail ? 1 : 0;
