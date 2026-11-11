// P5.1（使用者 2026-11-04 BUGLOG_P5_20261104 第 2～16 項）
//  · 說話一律是頭上的像素泡泡（P.speak），不再用上方 toast
//  · 音量（🔊 一鍵靜音＋BGM／音效兩條），存在存檔裡
//  · 上方每一格資訊都可以點，跳出「這是什麼、要怎麼做」
//  · 建造入口永遠在：條件不夠就變灰、寫清楚缺什麼、問誰（P.buildReq）
//  · 小屋／雜物倉／院子設施：左／正面／右三種方向（左右＝原圖鏡像、正面＝原圖半邊鏡像，tools/build_p51_art.py）
//  · 雜物倉：先蓋、可以擴建；收著現成的家具，拿出來擺在院子裡
//  · 大朋友也能出戰（C.adult）；技能名字都可以點開看詳細（P.skillPop）
//  · 西施媽媽問答（P.QA，照資料表顯示）
'use strict';
(function (P) {
  const C = P.CFG;
  // ---------- 設定（數字都在這裡） ----------
  C.adult = {
    atkMul: 1.35,          // P5.2：大朋友普攻／技能威力＝同位階寶寶的 135%，要比寶寶壯
    greenMul: 1.0,         // 綠色（素體）大朋友：用藍階基礎 × atkMul，不再打折
    xpMul: 1.0,            // 經驗跟寶寶一樣快
    greenCap: 10,          // 綠色大朋友等級上限
    upMul: 1.0,            // 升階花費跟寶寶一樣（幸福信、碎片、成功率本來就一樣）
    up0: { lv: 5, heart: 2, letter: 0, gold: 10000, bread: 20, rate: 60 },   // 綠 → 藍（只有大朋友有這一步）
  };
  P.WARE_NAME = '雜物倉';
  C.ware = {
    rep: 2, cost: [100000, 60, 15], hours: 0,           // 蓋雜物倉：名聲 Lv2、金幣 10 萬、麵包 60、刻印 15（介於小屋 1、2 間之間）
    slots: [6, 10, 15, 21],                               // 每一級能收幾件
    up: [[200000, 120, 30, 3], [450000, 220, 70, 5], [900000, 320, 110, 7]],   // 擴建：金幣、麵包、刻印、名聲 Lv
    at: { cx: 640, by: 404 },                             // 雜物倉的位置（一館院子後排、櫃檯跟小屋中間）
    scale: 0.62,                                          // 院子裡的家具縮小成小屋的比例
  };
  C.audio0 = { bgm: 0.35, sfx: 0.35, mute: 0 };
  // ---------- 存檔 ----------
  const nsW = () => ({ built: 0, lv: 0, face: 'L', items: {} });
  const fixS = S => {
    if (!S) return S;
    if (!S.audio) { let v = C.audio0.bgm; try { const x = typeof localStorage !== 'undefined' && localStorage.getItem('pet_bgm_vol'); if (x != null && x !== false && x !== '') v = Math.max(0, Math.min(1, +x)) } catch (e) { } S.audio = { bgm: isFinite(v) ? v : C.audio0.bgm, sfx: C.audio0.sfx, mute: 0 } }
    if (!S.ware) S.ware = nsW(); if (!S.ware.items) S.ware.items = {};
    if (!S.yardF) S.yardF = []; if (!S.yfId) S.yfId = 1;
    for (const c of S.cots || []) if (!c.face) c.face = 'L';
    return S;
  };
  const ns0 = P.newState; if (ns0) P.newState = (...a) => fixS(ns0(...a));
  const mg0 = P.migrate; if (mg0) P.migrate = (S, ...a) => { const r = mg0(S, ...a); fixS(r || S); return r };
  P.p51Fix = fixS;
  const S_ = () => fixS(P.S);
  const fmt = n => Math.round(n).toLocaleString();
  // ---------- 方向 ----------
  P.FACES = [['L', '左'], ['F', '正面'], ['R', '右']];
  P.faceName = f => (P.FACES.find(x => x[0] === f) || P.FACES[0])[1];
  P.cotFace = (i, f) => { const c = P.S.cots[i]; if (!c || !'LFR'.includes(f)) return { ok: 0 }; c.face = f; return { ok: 1 } };
  // ---------- 建造條件（第 11、13 項）：缺什麼、問誰 ----------
  // 回傳 { kind, name, state: done|building|can|need|full, items:[{t, ok}], lack:[文字], cost:[金,麵包,刻印], who, until, note }
  P.buildReq = (kind) => {
    const S = S_(), rl = P.repLv(), out = { kind, items: [], lack: [], who: '西施媽媽' };
    const money = (g, b, s) => { out.cost = [g, b, s]; out.items.push({ t: `金幣 ${fmt(g)}`, ok: S.gold >= g, have: S.gold, need: g }, { t: `剩食麵包 ${b}`, ok: S.bread >= b, have: S.bread, need: b }); if (s) out.items.push({ t: `刻印碎片 ${s}`, ok: S.shards >= s, have: S.shards, need: s }) };
    const rep = n => out.items.unshift({ t: `名聲 Lv${n}`, ok: rl >= n, have: rl, need: n, rep: 1 });
    const pre = (t, ok) => out.items.unshift({ t, ok, pre: 1 });
    if (kind === 'cot') {
      const i = S.cots.filter(c => !c.farm).length; out.name = `小屋 ${i + 1}`; out.i = i;
      if (i >= P.cotMax()) { out.state = 'full'; out.name = '小屋'; out.note = S.annex === 1 ? '收容所的小屋都蓋好了' : `一館最多 ${C.cotMax} 間小屋`; out.next = P.nextHousing ? P.nextHousing() : S.annex !== 1 ? 'annex' : S.farm !== 1 ? 'farm' : null; return out }
      const [g, b, s] = C.cotCost[i]; money(g, b, s); out.who = '西施';
    } else if (kind === 'annex' || kind === 'farm' || (P.HOUSING && P.HOUSING[kind])) {
      const c = C[kind]; out.name = (P.HOUSING && P.HOUSING[kind] && P.HOUSING[kind].name) || (kind === 'annex' ? '二館' : '農場'); const I = P.expandInfo(kind);
      if (I.state === 'done') { out.state = 'done'; return out } if (I.state === 'building') { out.state = 'building'; out.until = I.until; return out }
      const prior = P.expandPrior && P.expandPrior(kind); if (prior) pre('先蓋好' + P.HOUSING[prior].name, S[prior] === 1); else if (kind === 'farm') pre('先蓋好二館', S.annex === 1); rep(c.rep); money(c.gold, c.bread, c.shard); out.hours = c.hours; out.who = '蜜糖媽媽';
    } else if (kind === 'ware') {
      out.name = P.WARE_NAME; if (S.ware.built) { out.state = 'done'; return out } rep(C.ware.rep); money(...C.ware.cost);
    } else if (kind === 'wareUp') {
      out.name = `雜物倉擴建（${S.ware.lv + 2} 級）`; if (!S.ware.built) { pre('先蓋好雜物倉', false); out.state = 'need'; out.lack = ['先蓋好雜物倉']; return out }
      const u = C.ware.up[S.ware.lv]; if (!u) { out.state = 'full'; out.note = `雜物倉已經是最大（${C.ware.slots[S.ware.lv]} 格）`; return out }
      rep(u[3]); money(u[0], u[1], u[2]); out.slots = [C.ware.slots[S.ware.lv], C.ware.slots[S.ware.lv + 1]];
    }
    out.lack = out.items.filter(x => !x.ok).map(x => x.rep ? `${x.t}（現在 Lv${x.have}）` : x.pre ? x.t : `${x.t}（還差 ${fmt(x.need - x.have)}）`);
    out.state = out.lack.length ? 'need' : 'can';
    return out;
  };
  P.repHow = '名聲：完成救援委託、育兒籃生寶寶、大會得名、明信片回信都會加。';
  // ---------- 雜物倉 ----------
  P.wareSlots = () => S_().ware.built ? C.ware.slots[S_().ware.lv] : 0;
  P.wareUsed = () => Object.values(S_().ware.items).reduce((a, b) => a + b, 0);
  const pay = c => { const S = P.S; S.gold -= c[0]; S.bread -= c[1]; S.shards -= c[2] || 0 };
  P.buildWare = (face) => { const r = P.buildReq('ware'); if (r.state !== 'can') return { ok: 0, msg: r.state === 'done' ? '雜物倉已經蓋好了' : '還差：' + r.lack.join('、') }; pay(r.cost); const W = S_().ware; W.built = 1; W.lv = 0; W.face = 'LFR'.includes(face) ? face : 'L'; P.emit && P.emit('build', '雜物倉蓋好了！'); return { ok: 1 } };
  P.wareUp = () => { const r = P.buildReq('wareUp'); if (r.state !== 'can') return { ok: 0, msg: r.note || ('還差：' + r.lack.join('、')) }; pay(r.cost); S_().ware.lv++; return { ok: 1, slots: P.wareSlots() } };
  P.wareFace = f => { if (!'LFR'.includes(f)) return { ok: 0 }; S_().ware.face = f; return { ok: 1 } };
  // 能收的東西＝現有家具（P.FURN 的名字、圖），不畫新東西
  P.YITEM = { bowl: { img: 'bowl_full', name: '飯碗' }, feeder: { img: 'feeder', name: '自動餵食器' }, feeder2: { img: 'feeder2', name: '大肚子餵食器' }, chime: { img: 'chime', name: '安心風鈴架' }, toybox: { img: 'toybox', name: '毛線球玩具箱' }, bed: { img: 'bed', name: '軟墊小床' } };
  P.yItemCost = k => { const f = P.FURN_K && P.FURN_K[k]; return f ? f.cost : 50000 };
  P.wareAdd = (k, n) => { if (!P.YITEM[k]) return { ok: 0, msg: '沒有這種東西' }; const W = S_().ware; if (!W.built) return { ok: 0, msg: '先蓋雜物倉' }; n = n || 1; if (P.wareUsed() + n > P.wareSlots()) return { ok: 0, msg: `雜物倉滿了（${P.wareUsed()}/${P.wareSlots()}），可以擴建雜物倉` }; W.items[k] = (W.items[k] || 0) + n; return { ok: 1 } };
  P.wareBuy = k => { const g = P.yItemCost(k); if (P.S.gold < g) return { ok: 0, msg: `金幣不夠（要 ${fmt(g)}）` }; const r = P.wareAdd(k, 1); if (!r.ok) return r; P.S.gold -= g; return { ok: 1 } };
  // 院子能擺的地方（一館＋二館院子）、不能擋到櫃檯、小屋、堆肥箱、雜物倉、別的設施
  P.YARD_P = { x0: 280, x1: 1050, x1a: 2360, y0: 430, y1: 660 };
  P.yItemSize = k => ({ bowl: [64, 50], feeder: [88, 110], feeder2: [88, 110], chime: [60, 120], toybox: [106, 99], bed: [144, 80] })[k] || [80, 80];
  P.yardBlocks = (ignore) => {
    const S = S_(), out = [[40, 50, 372, 360], [1120, 560, 1220, 660]];
    S.cots.forEach((c, i) => { if (c.farm || !P.cotXY) return; const p = P.cotXY(i); out.push([p.cx - 78, p.by - 150, p.cx + 78, p.by + 24]) });
    if (S.ware.built) { const a = C.ware.at; out.push([a.cx - 105, a.by - 150, a.cx + 105, a.by + 22]) }
    for (const f of S.yardF) { if (f.id === ignore) continue; const [w, h] = P.yItemSize(f.k); out.push([f.x - w / 2, f.y - h, f.x + w / 2, f.y + 6]) }
    out.push([400, 330, 490, 420]);   // 西施媽媽站的地方
    return out;
  };
  P.yardFree = (k, x, y, ignore) => {
    const Y = P.YARD_P, x1 = P.S.annex === 1 ? Y.x1a : Y.x1, [w, h] = P.yItemSize(k);
    if (x - w / 2 < Y.x0 || x + w / 2 > x1 || y < Y.y0 || y > Y.y1) return { ok: 0, why: '這裡不是院子的草地' };
    const b = P.yardBlocks(ignore).find(r => x + w / 2 > r[0] && x - w / 2 < r[2] && y + 6 > r[1] && y - h < r[3]); if (b) return { ok: 0, why: '跟別的東西疊在一起了' };
    return { ok: 1 };
  };
  P.yardPlace = (k, x, y, face) => { const S = S_(); if (!(S.ware.items[k] > 0)) return { ok: 0, msg: '雜物倉裡沒有這個' }; const v = P.yardFree(k, x, y); if (!v.ok) return { ok: 0, msg: v.why }; S.ware.items[k]--; if (!S.ware.items[k]) delete S.ware.items[k]; const f = { id: S.yfId++, k, x: Math.round(x), y: Math.round(y), face: 'LFR'.includes(face) ? face : 'L' }; S.yardF.push(f); return { ok: 1, f } };
  P.yardMove = (id, x, y) => { const f = S_().yardF.find(q => q.id === id); if (!f) return { ok: 0, msg: '找不到' }; const v = P.yardFree(f.k, x, y, id); if (!v.ok) return { ok: 0, msg: v.why }; f.x = Math.round(x); f.y = Math.round(y); return { ok: 1 } };
  P.yardFace = (id, face) => { const f = S_().yardF.find(q => q.id === id); if (!f || !'LFR'.includes(face)) return { ok: 0 }; f.face = face; return { ok: 1 } };
  P.yardStore = id => { const S = S_(), i = S.yardF.findIndex(q => q.id === id); if (i < 0) return { ok: 0, msg: '找不到' }; if (P.wareUsed() >= P.wareSlots()) return { ok: 0, msg: `雜物倉滿了（${P.wareUsed()}/${P.wareSlots()}）` }; const f = S.yardF.splice(i, 1)[0]; S.ware.items[f.k] = (S.ware.items[f.k] || 0) + 1; return { ok: 1 } };
  // ---------- 第 10b 項：大朋友也能出戰 ----------
  P.isAdult = p => !!p && !p.baby;
  P.fightSk = p => !p ? [] : p.baby ? (p.sk || []).slice() : ((p.tier || 0) >= 1 && P.SK[p.heir] ? [p.heir] : []);   // 大朋友：只有 1 招，就是傳家技（藍以上才會用）
  P.lvCapOf = p => !p ? 0 : p.baby ? C.lvCap[p.tier] : (p.tier ? C.lvCap[p.tier] : C.adult.greenCap);
  const atk0 = P.petAtkOf;
  P.petAtkOf = p => {
    if (!p) return 0; if (p.baby) return atk0 ? atk0(p) : 0;
    const A = C.adult, t = Math.max(1, Math.min(4, p.tier || 0)), base = C.petAtk[t] * A.atkMul * (p.tier ? 1 : A.greenMul);
    const ab = P.abPet ? P.abPet(p) : {}, patk = ab.patk ? ab.patk.v || 0 : 0;
    return base * (P.QUAL_MUL[p.q == null ? 1 : p.q] || 1) * (p.star === 2 ? C.shinyMul : 1) * (1 + patk / 100) * (P.size ? P.size(p).dmg : 1);
  };
  const ui0 = P.upInfo;
  P.upInfo = p => { if (!p) return null; if (p.baby) return ui0(p); const t = p.tier || 0; if (t === 0) return Object.assign({ adult: 1 }, C.adult.up0); const u = C.up[t]; if (!u) return null; return Object.assign({}, u, { adult: 1, gold: Math.round(u.gold * C.adult.upMul), bread: Math.round(u.bread * C.adult.upMul) }) };
  const up1 = P.upgrade;
  P.upgrade = p => {
    if (!p || p.baby) return up1(p);
    if (!p.lv) p.lv = 1;
    const look = p.look, sk = (p.sk || []).slice(), sub = (p.sub || []).slice();
    const r = up1(p); p.look = look; p.sk = sk; p.sub = sub;   // 大朋友升階：外觀（毛色）不變、不長技能格／天性魔法
    return r;
  };
  const fe1 = P.fightEnd;
  P.fightEnd = r => {
    const S = P.S, p = P.byId(S.eq), adult = p && !p.baby, lv = adult ? p.lv || 1 : 0, xp = adult ? p.xp || 0 : 0;
    fe1(r);
    if (adult && P.byId(p.id)) {
      p.lv = lv; p.xp = xp + Math.round((r.kills || 0) * C.xpPerKill * C.adult.xpMul); const cap = P.lvCapOf(p);
      while (p.xp >= C.xpNeed * p.lv && p.lv < cap) { p.xp -= C.xpNeed * p.lv; p.lv++; P.emit && P.emit('fight', `${P.label(p)} 升到 Lv${p.lv}`) }
      if (p.lv >= cap) p.xp = 0; p.peak = Math.max(p.peak || 1, p.lv);
    }
  };
  // ---------- 第 14 項：技能說明（資料） ----------
  P.skillInfo = (kind, ref, p) => {
    const T = P.TIER_NAME, adult = p && !p.baby, o = { kind, rows: [] };
    if (kind === 'sk' || kind === 'heir') {
      const s = P.SK[ref]; if (!s) return null; o.name = s.name; o.n = s.n; o.cat = P.CAT_NAME[s.cat] || s.cat; o.cd = s.cd;
      o.type = /遠程|飛彈|射|丟|吐/.test(s.desc) ? '遠程' : s.cat === 'hit' ? '打擊（近身）' : o.cat;
      o.desc = P.skillDesc(s, p && p.baby ? p : null);
      o.tiers = [1, 2, 3, 4].map(t => { const fp = { sp: p ? p.sp : 'shihtzu', tier: t, baby: 1, q: 1, star: 0, size: p && p.size }; let d; try { d = P.skillDesc(s, fp) } catch (e) { d = s.desc } return [T[t], d] });
      o.skt = P.skTier ? P.skTier(ref) : 'normal'; o.sktName = P.SKT ? P.SKT[o.skt].name : ''; o.sktTxt = P.SKT ? P.SKT[o.skt].txt : '';
      o.locked = P.skLocked ? P.skLocked(ref) : false; o.impl = s.impl;
      o.learn = o.locked ? `${o.sktName}：${o.sktTxt}。不能用洗技能洗掉，也洗不出來。` : `寶寶的技能格：在「🎲 洗技能」花金幣 ${C.rerollGold.slice(1).map(fmt).join('／')}（藍／紫／粉／橘）＋技能磁片 ${C.rerollDiskGold}，或剩食麵包 ${C.rerollBread.slice(1).join('／')}（不用磁片）洗一格；洗 ${C.rerollPity} 次保底可以自己挑。`;
      o.inherit = `寶寶出生時，爸媽練熟的技能有機會教給牠（一隻爸媽會：${C.gen ? C.gen.teach.one.join('％／') : '45／30'}％；兩隻都會：${C.gen ? C.gen.teach.both.join('％／') : '70／50'}％）。「傳家技」是這一家的招牌：育兒籃沒有另外選的時候就教這一招，成功率多 ${C.gen ? C.gen.teach.heir : 10}%。`;
      if (kind === 'heir') o.heirNote = adult ? `這是牠的傳家技。P5.1 起大朋友也能出戰：${(p.tier || 0) >= 1 ? '出戰時牠就用這一招（大朋友只有這 1 招，沒有技能格、沒有天性魔法）。' : '綠色大朋友只會普攻；升到藍色以後，出戰就會用這一招。'}` : '這是牠的傳家技：牠的孩子出生時，最容易學到的就是這一招。';
      else if (adult) o.heirNote = '大朋友沒有技能格；出戰只用傳家技。';
    } else if (kind === 'inh') {
      const sp = P.SP[ref]; if (!sp) return null; o.name = sp.inh[0]; o.cat = '固有技能（物種天生）'; o.type = '被動'; o.cd = '—';
      o.desc = P.inhDesc(sp.inh[1], p); o.tiers = [[T[1], '未覺醒（還沒有效果）'], [T[2], '覺醒'], [T[3], 'S'], [T[4], 'SS']];
      o.learn = '固有技能是物種天生的，不用學、也不能洗。位階越高越強：紫色覺醒、粉色 S、橘色 SS。';
      o.inherit = '跟著物種走：同一種的孩子一定會有。';
      o.heirNote = adult ? `大朋友出戰也有固有技能（照牠現在的位階：${['', '未覺醒', '覺醒', 'S', 'SS'][p.tier || 0] || '還沒覺醒'}）。` : '';
    } else if (kind === 'sub') {
      const d = P.SUBS.find(x => x.k === ref); if (!d) return null; o.name = d.name; o.cat = '天性魔法'; o.type = d.who === 'owner' ? '幫主人' : '幫寵物自己'; o.cd = '—（出戰時一直有效）';
      o.desc = `出戰時${d.who === 'owner' ? '主人' : '寵物'}得到「${P.subText(d.k, '？')}」的加成。`;
      o.tiers = d.r.map((r, i) => [T[i + 1], `${r[0]}～${r[1]}%`]);
      o.learn = `寶寶的天性魔法：在「🎲 洗技能／洗天性魔法」可以洗（數字在這個範圍裡隨機）；星彩寶寶 ×${C.shinyMul}。`;
      o.inherit = '天性魔法不會遺傳，每隻寶寶自己洗。';
      o.heirNote = adult ? '大朋友沒有天性魔法。' : '';
    }
    return o;
  };

  if (typeof document === 'undefined' || !P.ui) return;
  // ===================== 以下是畫面 =====================
  const UI = P.ui, $ = s => document.querySelector(s), esc = s => UI.esc(s);
  const A = P.art;
  // ---------- 圖 ----------
  const IMG = {}; const ld = (k, src) => { const i = P.art.lazyImage(src); IMG[k] = i };
  for (const n of ['', '_night']) {
    ld('hutF' + n, `assets/scenes/p51/hut_front${n}.png`); ld('ware' + n, `assets/scenes/p51/ware${n}.png`); ld('wareF' + n, `assets/scenes/p51/ware_front${n}.png`);
    for (const k of ['bed', 'chime', 'feeder', 'toybox', 'bowl_full']) { ld('f_' + k + n, `assets/scenes/farm/furn_${k}${n}.png`); ld('fF_' + k + n, `assets/scenes/p51/furn_${k}_front${n}.png`) }
  }
  ld('f_feeder2', 'assets/scenes/farm/furn_feeder2.png');
  const ok = im => P.art.imageOK(im);
  P.p51Img = IMG;
  const night = () => P.isNight ? P.isNight() : false;
  // 依方向畫：L＝原圖、R＝鏡像、F＝正面圖
  P.drawFaced = (ctx, imL, imF, face, cx, by, sc) => {
    const im = face === 'F' && ok(imF) ? imF : imL; if (!ok(im)) return null; sc = sc || 1; const w = im.width * sc, h = im.height * sc;
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(cx), Math.round(by)); if (face === 'R') ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore(); return { w, h };
  };
  P.yItemImg = (k, face) => { const b = P.YITEM[k].img, n = night() ? '_night' : ''; return [IMG['f_' + b + n] || IMG['f_' + b], IMG['fF_' + b + n] || IMG['fF_' + b]] };
  P.drawYItem = (ctx, f, ghost) => { const [L, F] = P.yItemImg(f.k); if (ghost) ctx.globalAlpha = 0.6; const r = P.drawFaced(ctx, L, F, f.face, f.x, f.y + 4, C.ware.scale); ctx.globalAlpha = 1; return r };
  P.drawWare = (ctx, face, cx, by, ghost) => { const n = night() ? '_night' : ''; if (ghost) ctx.globalAlpha = 0.6; P.drawFaced(ctx, IMG['ware' + n] || IMG.ware, IMG['wareF' + n] || IMG.wareF, face, cx, by + 8, 1); ctx.globalAlpha = 1 };
  P.drawHutFaced = (ctx, imL, face, cx, by) => { const n = night() ? '_night' : ''; return P.drawFaced(ctx, imL, IMG['hutF' + n] || IMG.hutF, face, cx, by + 8, 1) };

  // ---------- 第 3 項：說話泡泡 ----------
  // 角色每一格畫的時候記下頭頂、腳底的位置（螢幕座標）；泡泡畫在最上層、跟著角色走、最後淡出
  const anc = {}; let frameN = 0; P._anc = anc;
  const dr1 = A.draw;
  A.draw = (ctx, p, x, y, o) => {
    dr1(ctx, p, x, y, o);
    try {
      if (!p || ctx.canvas !== P.cv) return; o = o || {}; const m = ctx.getTransform(), sc = (o.scale || 2) * (P.drawScale && p.size != null ? P.drawScale(p) : 1), at = P.artTier ? P.artTier(p) : p.tier || 0;
      const meta = A.meta(p.sp), ht = A.headTop(p.sp, at, 'idle', 0), sx = m.a * x + m.e, fy = m.d * y + m.f, top = m.d * (y - (meta.ground_y - (ht ? ht[1] : 10)) * sc) + m.f;
      const key = p.id != null ? 'p' + p.id : (p.npc || ('s' + p.sp + (p.tier || 0)));
      anc[key] = { x: sx, top, foot: fy, w: meta.canvas[0] * sc * Math.abs(m.a) * 0.55, n: frameN, p };
    } catch (e) { }
  };
  const fresh = a => a && frameN - a.n <= 2;
  P.petAt = (x, y) => { let best = null, bd = 1e9; for (const k in anc) { const a = anc[k]; if (!fresh(a) || !a.p || a.p.npc) continue; if (Math.abs(x - a.x) < a.w && y > a.top - 10 && y < a.foot + 10) { const d = Math.abs(x - a.x) + Math.abs(y - (a.top + a.foot) / 2) * 0.5; if (d < bd) { bd = d; best = a.p } } } return best };
  const NPC = { 蜜糖媽媽: { sp: 'shihtzu', tier: 0 }, 西施: { sp: 'shihtzu', tier: 2 }, 西施媽媽: { sp: 'shihtzu', tier: 0 }, 獵犬: { sp: 'retriever', tier: 0 }, 小貓頭鷹: { sp: 'owl', tier: 0 }, 小浣熊: { sp: 'raccoon', tier: 0 }, 浣熊: { sp: 'raccoon', tier: 0 } };
  P.NPC_LOOK = NPC;
  const npcO = UI.npc; UI.npc = name => name === '西施媽媽' ? UI.av(NPC.西施媽媽, 44) : npcO(name);
  const speech = []; P._speech = speech;
  P.speak = (who, txt, sec) => {
    if (!txt) return; sec = sec || Math.min(6, 2.2 + String(txt).length * 0.09);
    const key = typeof who === 'object' ? 'p' + who.id : String(who), name = typeof who === 'object' ? P.label(who) : String(who);
    const old = speech.find(b => b.key === key); const t = performance.now() / 1000;
    if (old) { if (old.txt === txt && old.until - t > 0.3) { old.until = Math.max(old.until, t + sec); return } old.txt = txt; old.t0 = t; old.until = t + sec; old.name = name; return }
    speech.push({ key, name, txt: String(txt), t0: t, until: t + sec, who: typeof who === 'object' ? who : null });
    while (speech.length > 6) speech.shift();
  };
  P.speaking = () => speech.map(b => b.name + '：' + b.txt);
  // NPC 在場景裡的位置：場景自己給（scene.npcAt），沒有就在左下角放她的小頭像，泡泡從頭像上冒出來
  function anchorOf(b, k) {
    if (b.who) { const a = anc['p' + b.who.id]; if (fresh(a)) return a; return null }
    const a = anc[b.key]; if (fresh(a)) return a;
    const sa = P.scene && P.scene.npcAt && P.scene.npcAt(b.key); if (sa) return sa;
    return { cameo: 1, x: 70 + k * 110, top: 560, foot: 650, w: 40 };
  }
  function wrap(ctx, txt, MW) { const lines = []; let cur = ''; for (const ch of txt) { if (cur && ctx.measureText(cur + ch).width > MW) { lines.push(cur); cur = ch === ' ' ? '' : ch } else cur += ch } if (cur) lines.push(cur); for (let i = 1; i < lines.length; i++) { const m = lines[i].match(/^[，。！？、…」』）～：；,.!?]+/); if (m) { lines[i - 1] += m[0]; lines[i] = lines[i].slice(m[0].length) } } return lines.filter(Boolean) }
  P.bubbleDraw = (ctx, txt, x, yTop, alpha, rects, name) => {
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = 'bold 15px sans-serif';
    const ls = wrap(ctx, txt, 300), LH = 19, w = Math.max(name ? ctx.measureText(name).width + 10 : 0, ...ls.map(l => ctx.measureText(l).width)) + 22, h = ls.length * LH + 14 + (name ? 16 : 0);
    const bx = Math.max(6, Math.min(1274 - w, x - w / 2)); let by = yTop - h - 14;
    for (let k = 0; k < 8; k++) { const r = rects.find(r => bx < r.x + r.w + 4 && bx + w + 4 > r.x && by < r.y + r.h + 8 && by + h + 8 > r.y); if (!r) break; by = r.y - h - 10 }
    by = Math.max(4, by); rects.push({ x: bx, y: by, w, h });
    A.pxBox(ctx, bx, by, w, h, { s: 2, st: [3, 1], edge: '#3b2418', fill: '#fffaf0', hi: '#ffffff', lo: '#eadcbf' });
    // 尾巴：一階一階往下（像素階梯），指向角色
    const tx = Math.max(bx + 14, Math.min(bx + w - 14, x)), ty = by + h - 2;
    ctx.fillStyle = '#3b2418'; ctx.fillRect(tx - 7, ty, 14, 4); ctx.fillRect(tx - 5, ty + 4, 10, 4); ctx.fillRect(tx - 3, ty + 8, 6, 3);
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(tx - 5, ty - 2, 10, 4); ctx.fillStyle = '#eadcbf'; ctx.fillRect(tx - 3, ty + 2, 6, 4);
    let yy = by + 22; if (name) { ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#8a5a2a'; ctx.fillText(name, bx + 11, by + 18); yy += 16; ctx.font = 'bold 15px sans-serif' }
    ctx.fillStyle = '#2a1a12'; ls.forEach((l, i) => ctx.fillText(l, bx + 11, yy + i * LH));
    ctx.restore();
  };
  function cameo(ctx, name, x, foot, alpha) {
    const look = NPC[name] || NPC.蜜糖媽媽; ctx.save(); ctx.globalAlpha = alpha;
    A.pxBox(ctx, x - 40, foot - 84, 80, 84, { s: 2, st: [3, 1], edge: '#1A1016', fill: 'rgba(40,26,34,.88)', hi: 'rgba(255,255,255,.12)', lo: 'rgba(0,0,0,.25)' });
    const pc = A.portraitCv && A.portraitCv(look.sp, look.tier, false, 64); if (pc) { ctx.imageSmoothingEnabled = false; ctx.drawImage(pc, x - 32, foot - 78, 64, 64) }
    ctx.font = 'bold 11px sans-serif'; const tw = ctx.measureText(name).width; ctx.fillStyle = '#f3d27a'; ctx.fillText(name, x - tw / 2, foot - 4); ctx.restore();
  }
  P.overlay = (ctx) => {
    frameN++; const t = performance.now() / 1000, rects = []; let k = 0;
    for (let i = speech.length - 1; i >= 0; i--) if (speech[i].until < t) speech.splice(i, 1);
    for (const b of speech) {
      const a = anchorOf(b, k); if (!a) continue; const life = b.until - t, al = Math.min(1, (t - b.t0) / 0.18, life / 0.6);
      if (a.cameo) { cameo(ctx, b.name, a.x, a.foot, al); k++ }
      P.bubbleDraw(ctx, b.txt, a.x, a.top, Math.max(0, al), rects, b.who ? null : b.name);
    }
    if (P.p51Front) P.p51Front(ctx);
  };
  // 舊的「名字：「台詞」」toast → 有角色名字的變泡泡，其他（系統訊息）照舊
  const toast0 = UI.toast;
  UI.toast = (m, ms) => {
    const s = String(m), mm = s.match(/^([^：「」\s]{1,10})：「([\s\S]+?)」\s*([\s\S]*)$/);
    if (mm) {
      const name = mm[1], rest = mm[3]; let who = NPC[name] ? name : null;
      if (!who) { const p = P.all ? P.all().find(q => P.label(q) === name || q.name === name) : null; if (p) who = p }
      if (who) { P.speak(who, mm[2], ms ? ms / 1000 : null); if (rest && rest.trim()) toast0(rest.trim(), ms); return }
    }
    toast0(m, ms);
  };
  P.toastRaw = toast0;

  // ---------- 第 4 項：音量 ----------
  const au = () => S_().audio;
  P.audioEff = k => { const a = au(); return a.mute ? 0 : a[k] };
  if (P.bgm) { const v0 = P.bgm.vol; P.bgm.vol = v => { if (v == null) return P.audioEff('bgm'); au().bgm = Math.max(0, Math.min(1, +v)); return v0.call(P.bgm, P.audioEff('bgm')) }; P.bgm._v0 = v0 }
  P.sfxVol = () => P.audioEff('sfx');
  P.audioApply = () => { if (P.bgm && P.bgm._v0) P.bgm._v0.call(P.bgm, P.audioEff('bgm')); P.save && P.save(); sysbar() };
  P.audioMute = m => { au().mute = m == null ? (au().mute ? 0 : 1) : (m ? 1 : 0); P.audioApply(); return au().mute };
  P.audioSet = (k, v) => { au()[k] = Math.max(0, Math.min(1, +v)); if (k === 'bgm' || k === 'sfx') au().mute = 0; P.audioApply() };
  // 右上角固定一排：🔊 一鍵靜音、🎚️ 音量、西施媽媽頭像（問答）
  const sb = document.createElement('div'); sb.id = 'sysbar'; document.body.appendChild(sb);
  function sysbar() {
    if (!P.S) return; const a = au();
    sb.innerHTML = `<button id="sbMute" class="px" title="一鍵靜音">${a.mute ? '🔇' : '🔊'}</button><button id="sbVol" class="px" title="音量">🎚️</button><button id="sbQA" class="px qa" title="問西施媽媽">${UI.av(NPC.西施媽媽, 30)}</button>`;
    $('#sbMute').onclick = () => P.audioMute(); $('#sbVol').onclick = () => volPop(); $('#sbQA').onclick = () => P.openQA();
  }
  P.sysbar = sysbar;
  function volPop() {
    const a = au(); pop(`<h3>🔊 音量</h3><div class="vrow"><span>背景音樂</span><input type="range" min="0" max="100" value="${Math.round(a.bgm * 100)}" data-k="bgm"><b>${Math.round(a.bgm * 100)}</b></div><div class="vrow"><span>音效</span><input type="range" min="0" max="100" value="${Math.round(a.sfx * 100)}" data-k="sfx"><b>${Math.round(a.sfx * 100)}</b></div><div class="row"><button data-a="mute" class="${a.mute ? 'ok' : 'alt'}">${a.mute ? '🔇 靜音中（按一下打開）' : '🔇 一鍵靜音'}</button><button data-a="test" class="alt">試聽音效</button></div><div class="muted">設定存在存檔裡，下次打開還是一樣。</div>`, (k) => { if (k === 'mute') { P.audioMute(); volPop() } if (k === 'test' && P.sfx && P.sfx.play) P.sfx.play(P.sfx.names ? P.sfx.names[0] : 'pick') }, 'volPop');
    document.querySelectorAll('#hintPop input[type=range]').forEach(r => r.oninput = () => { P.audioSet(r.dataset.k, r.value / 100); r.nextElementSibling.textContent = r.value });
  }
  P.volPop = volPop;
  // ---------- 小視窗（提示／音量／技能說明共用） ----------
  const hp = document.createElement('div'); hp.id = 'hintPop'; hp.className = 'hide'; document.body.appendChild(hp);
  let popAct = null;
  function pop(html, act, cls) { hp.className = 'px ' + (cls || ''); hp.innerHTML = `<button class="x" data-a="__x">✕</button>` + html; popAct = act; }
  P.pop = pop; P.popClose = () => { hp.className = 'hide'; popAct = null };
  hp.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === '__x') return P.popClose(); const f = popAct; if (f) f(b.dataset.a, b.dataset.v); P.save && P.save(); UI.hud() });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && hp.className !== 'hide') P.popClose() });
  document.addEventListener('pointerdown', e => { if (hp.className === 'hide') return; if (e.target.closest('#hintPop') || e.target.closest('#sysbar') || e.target.closest('#hud')) return; P.popClose() }, true);

  // ---------- 第 9 項：上方資訊都可以點 ----------
  const HINT = {
    '🕐': () => ({ t: '🕐 時間（台北）', b: `遊戲照台灣時間走。每天 <b>05:00</b> 換日：每天的照顧次數重算、小屋門口出現育兒籃、剛出生的寶寶解鎖。晚上 18:00～06:00 是夜景，大家會睏。` }),
    '💰': () => ({ t: '💰 金幣', b: `現在有 ${fmt(P.S.gold)}。出戰打怪、救援委託、大會、明信片都會拿到。用在：認養、洗技能、升階、蓋小屋／二館／農場／雜物倉、訂做家具。`, a: [['fight', '⚔️ 去出戰']] }),
    '🍞': () => ({ t: '🍞 剩食麵包', b: `現在有 ${P.S.bread}。出戰時撿到的剩食麵包。可以餵寵物（每次 ${C.breadPerFeed} 個）、用麵包洗技能（不用磁片），蓋房子也要用。`, a: [['fight', '⚔️ 去出戰']] }),
    '🍪': () => ({ t: '🍪 零食材料', b: `現在有 ${P.S.snackMat}。做「特製零食」用的，好感加比較多。出戰和探險會撿到。` }),
    '💿': () => ({ t: '💿 技能磁片', b: `現在有 ${P.S.disk}。用金幣洗技能時每次要 ${C.rerollDiskGold} 片；用麵包洗就不用磁片。`, a: [['reroll', '🎲 去洗技能']] }),
    '🔷': () => ({ t: '🔷 刻印碎片', b: `現在有 ${P.S.shards}。打王、救援會掉。升紫、升粉，還有蓋小屋、二館、農場、雜物倉都要用。` }),
    '⭐': () => { const l = P.repLv(), nx = C.repLv[l]; return { t: '⭐ 名聲', b: `現在 ${P.S.rep}（Lv${l}）${nx != null ? `，再 ${nx - P.S.rep} 到 Lv${l + 1}` : '，已經最高'}。<br>${P.repHow}<br>名聲等級會打開：側廂 Lv2、側院 Lv3、穀倉 Lv6、二館 Lv${C.annex.rep}、雜物倉 Lv${C.ware.rep}、農場 Lv${C.farm.rep}。`, a: [['quests', '📜 看委託']] } },
    '🏠': () => { const S = P.S, full = P.houseFull(), nx = P.nextHousing ? P.nextHousing() : S.annex !== 1 ? 'annex' : S.farm !== 1 ? 'farm' : null, r = nx && P.buildReq(nx);
      return { t: '🏠 住民（大朋友）', b: `現在 ${S.pets.length}/${P.houseCap()}。寶寶不算在這裡，算育兒室。${full ? '<br><b>住滿了！</b>可以：<br>① 擴建' + (r ? `${r.name}（${r.state === 'can' ? '條件都夠了' : r.state === 'building' ? '施工中' : '還差：' + r.lack.join('、')}）<br><span class="needs">目前條件：${r.items.map(x => `<span class="need ${x.ok ? 'ok' : 'no'}">${x.ok ? '✔' : '✖'} ${x.t}</span>`).join(' ')}</span>` : '（都蓋好了）') + '<br>② 把一隻大朋友免費寄放在櫃檯，隨時接回<br>③ 讓一隻「放他出去闖闖」（3 天後可能再相遇）' : ''}`, a: [['build', '🏗️ 建造'], ['stay', '🧺 寄放處'], ['qa', '❓ 問西施媽媽']] } },
    '🍼': () => ({ t: '🍼 育兒室（寶寶）', b: `現在 ${P.nurseryUsed()}/${P.nurseryCap()}。育兒籃生的寶寶住這裡。${P.waitingKids().length ? `有 ${P.waitingKids().length} 隻「等待入住」：要先空出位子（寄放、放出去闖闖、或等寶寶長大）。` : ''}育兒室沒位子時，小屋門口不會出現新的育兒籃。`, a: [['stay', '🧺 寄放處'], ['qa', '❓ 問西施媽媽']] }),
    '📮': () => ({ t: '📮 明信片', b: `出去闖闖的孩子寄回來的明信片，有 ${P.mailCount()} 張。到櫃檯「信箱」打開，會有小禮物。`, a: [['counter', '🏠 去櫃檯']] }),
  };
  P.HINT = HINT;
  P.hintOf = txt => { const k = Object.keys(HINT).find(e => txt.trim().startsWith(e)); if (k) return HINT[k](); return { t: txt.trim().slice(0, 16), b: '這一格是現在這個地方的狀態。點畫面上的東西，或下方按鈕可以操作。' } };
  P.showHint = txt => { const h = P.hintOf(txt); pop(`<h3>${h.t}</h3><div>${h.b}</div>${h.a ? `<div class="row">${h.a.map(([k, n]) => `<button data-a="${k}" class="alt">${n}</button>`).join('')}</div>` : ''}`, k => { P.popClose(); goTo(k) }, 'hint') };
  function goTo(k) {
    if (P.sceneName !== 'shelter' && ['build', 'stay', 'counter', 'reroll', 'quests', 'fight'].includes(k)) P.go('shelter');
    if (k === 'build') P.openBuild(); if (k === 'stay') P.openStay && P.openStay(); if (k === 'qa') P.openQA(); if (k === 'reroll') P.openReroll && P.openReroll();
    if (k === 'quests') P.openQuests && P.openQuests(); if (k === 'fight') P.openFight && P.openFight(); if (k === 'counter') P.openCounter && P.openCounter();
  }
  P.p51Go = goTo;
  $('#hud').addEventListener('click', e => { const s = e.target.closest('span'); if (!s || !$('#hud').contains(s)) return; P.showHint(s.textContent) });

  // ---------- 第 11、13 項：建造卡（變灰＋缺什麼） ----------
  const ICON = k => `<span class="ficon"><img src="assets/scenes/p51/icons/${k}.png" alt=""></span>`;
  P.ficon = ICON;
  P.reqCard = (kind, o) => {
    o = o || {}; const r = P.buildReq(kind), ic = { cot: 'expand', annex: 'expand', farm: 'farm', ware: 'ware', wareUp: 'ware' }[kind] || 'expand';
    const eff = (P.expansionEffect && P.expansionEffect(kind)) || { cot: '讓兩個好朋友一起住、等育兒籃', annex: `住民上限 ${C.houseStep[0]} → ${C.houseStep[1]}，小屋多 ${C.annex.cots} 間`, farm: `住民上限 ${C.houseStep[1]} → ${C.houseStep[2]}，開放農場地圖`, ware: `收家具的地方：先收 ${C.ware.slots[0]} 件，拿出來擺在院子裡`, wareUp: r.slots ? `可以收 ${r.slots[0]} → ${r.slots[1]} 件` : '' }[kind];
    if (r.state === 'done') return o.showDone ? `<div class="card row2 req done">${ICON(ic)}<div class="grow"><b>${r.name}</b> ✔ 蓋好了</div></div>` : '';
    if (r.state === 'building') return `<div class="card row2 req">${ICON(ic)}<div class="grow"><b>🏗️ ${r.name}施工中</b><div class="muted">${UI.fmtTime(r.until)} 完工</div></div></div>`;
    if (r.state === 'full') { const nx = r.next ? P.reqCard(r.next, { showDone: 0 }) : ''; return `<div class="card row2 req done">${ICON(ic)}<div class="grow"><b>${r.name}</b>：${r.note}${r.next ? `<div class="muted">想再多蓋，下一步是「${P.HOUSING && P.HOUSING[r.next] ? P.HOUSING[r.next].name : r.next === 'annex' ? '二館' : '農場'}」👇</div>` : ''}</div></div>${nx}` }
    const grey = r.state !== 'can', items = r.items.map(x => `<span class="need ${x.ok ? 'ok' : 'no'}">${x.ok ? '✔' : '✖'} ${x.t}</span>`).join('');
    return `<div class="card row2 req ${grey ? 'grey' : ''}" data-a="bq" data-v="${kind}">${ICON(ic)}<div class="grow"><b>${grey ? '🔒 ' : '🏗️ '}${kind === 'wareUp' ? '' : '蓋'}${r.name}</b><div class="muted">${eff}${r.hours ? `；${r.hours} 小時蓋好` : ''}</div><div class="needs">${items}</div>${grey ? `<div class="muted">還差：${r.lack.join('、')}。不知道怎麼弄？問${r.who}。</div>` : ''}</div><button class="${grey ? 'grey' : 'ok'}" data-a="bq" data-v="${kind}">${grey ? '看缺什麼' : kind === 'wareUp' ? '擴建' : '開始蓋'}</button></div>`;
  };
  // 按建造卡：夠了就蓋（要選方向的先選方向），不夠就講清楚缺什麼、誰可以問
  P.reqAct = (kind, after) => {
    const r = P.buildReq(kind);
    if (r.state !== 'can') { const tips = r.items.filter(x => !x.ok).map(x => x.rep ? `名聲 Lv${x.need}（現在 Lv${x.have}）：${P.repHow.replace('名聲：', '')}` : x.pre ? x.t : `${x.t}：還差 ${fmt(x.need - x.have)}${/金幣|麵包/.test(x.t) ? '（出戰、委託會拿到）' : '（打王、救援會掉）'}`);
      return pop(`<h3>🔒 ${r.name}還不能蓋</h3>${r.note ? `<div>${r.note}</div>` : ''}<ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul><div class="card row2">${UI.npc(r.who)}<div class="grow"><b>${r.who}</b>：「${r.who === '西施' ? '材料湊齊了再來找我，我幫你一起蓋！' : '缺的東西慢慢湊，湊齊了這張卡片就會亮起來喔。'}」</div></div><div class="row"><button data-a="qa" class="alt">❓ 問西施媽媽</button></div>`, k => { P.popClose(); if (k === 'qa') P.openQA() }, 'hint') }
    if (kind === 'cot' || kind === 'ware') return faceAsk(kind === 'cot' ? `蓋${r.name}：門要朝哪邊？` : '蓋雜物倉：門要朝哪邊？', f => {
      let x; if (kind === 'cot') { x = P.buildCot(); if (x.ok) { const c = P.S.cots.filter(c => !c.farm).slice(-1)[0]; if (c) c.face = f } } else x = P.buildWare(f);
      P.toastRaw(x.ok ? `${r.name}蓋好了（${P.faceName(f)}）` : x.msg); P.save(); after && after() });
    let x; if (kind === 'wareUp') x = P.wareUp(); else x = P.buildExpand(kind);
    P.toastRaw(x.ok ? (kind === 'wareUp' ? `雜物倉擴建好了：可以收 ${x.slots} 件` : '開工了！') : x.msg); if (x.ok && P.shelterBar) P.shelterBar(); after && after();
  };
  function faceAsk(title, cb, cur) {
    pop(`<h3>${title}</h3><div class="faces">${P.FACES.map(([f, n]) => `<button data-a="f" data-v="${f}" class="${cur === f ? 'ok' : 'alt'}">${n}</button>`).join('')}</div><div class="muted">左、右是同一張圖鏡像；正面是從原圖做出來的正面樣子。之後在面板裡隨時可以改。</div>`, (k, v) => { if (k === 'f') { P.popClose(); cb(v) } }, 'hint');
  }
  P.faceAsk = faceAsk;
  // 🏗️ 建造：所有能蓋的東西一次列出來（入口永遠在）
  function buildScreen() {
    const S = P.S;
    UI.panel(`<h2>${ICON('expand')} 建造</h2><div class="card row2">${UI.npc('西施媽媽')}<div class="grow"><b>西施媽媽</b>：「亮著的就可以蓋；灰灰的那張，上面寫著還差什麼。」</div></div>
      ${P.reqCard('cot')}${(P.HOUSING_KEYS || ['annex','farm']).map(k => P.reqCard(k, { showDone: 1 })).join('')}${P.reqCard('ware', { showDone: 1 })}${S.ware.built ? P.reqCard('wareUp') + `<div class="row"><button data-a="ware" class="ok">📦 打開雜物倉</button></div>` : ''}`, (a, v) => { if (a === 'bq') return P.reqAct(v, () => UI._refresh && UI._refresh()); if (a === 'ware') return P.openWare() });
    UI._refresh = buildScreen;
  }
  buildScreen.root = buildScreen;
  P.openBuild = () => UI.nav(buildScreen);
  // ---------- 第 13 項：雜物倉面板 ----------
  function wareScreen() {
    const S = S_(), W = S.ware;
    if (!W.built) { UI.panel(`<h2>${ICON('ware')} 雜物倉</h2>${P.reqCard('ware')}`, (a, v) => { if (a === 'bq') P.reqAct(v, () => wareScreen()) }); return }
    const cards = Object.keys(P.YITEM).map(k => { const n = W.items[k] || 0, it = P.YITEM[k]; return `<div class="card row2 witem">${itemThumb(k)}<div class="grow"><b>${it.name}</b> ×${n}<div class="muted">訂做 ${fmt(P.yItemCost(k))} 金幣</div></div><div class="row">${n ? `<button class="ok" data-a="place" data-v="${k}">擺到院子</button>` : ''}<button class="alt" data-a="buy" data-v="${k}">訂做 1 件</button></div></div>` }).join('');
    UI.panel(`<h2>${ICON('ware')} 雜物倉（${W.lv + 1} 級）</h2><div class="muted">收著 ${P.wareUsed()}/${P.wareSlots()} 件｜雜物倉的門：${P.faceName(W.face)}｜院子裡擺了 ${S.yardF.length} 件</div>
      <div class="row">${P.FACES.map(([f, n]) => `<button data-a="wface" data-v="${f}" class="${W.face === f ? 'ok' : 'alt'}">雜物倉朝${n}</button>`).join('')}</div>
      ${P.reqCard('wareUp')}<h3>收在雜物倉裡的</h3>${cards}
      <h3>院子裡的（點院子裡的東西也可以搬／轉／收）</h3>${S.yardF.map(f => `<div class="card row2">${itemThumb(f.k)}<div class="grow"><b>${P.YITEM[f.k].name}</b> <span class="muted">朝${P.faceName(f.face)}</span></div><div class="row"><button data-a="move" data-v="${f.id}" class="alt">搬</button><button data-a="turn" data-v="${f.id}" class="alt">↺ 轉</button><button data-a="store" data-v="${f.id}" class="alt">收回雜物倉</button></div></div>`).join('') || '<div class="muted">還沒擺</div>'}
      <div class="muted">家具是現成的那幾樣（飯碗、餵食器、風鈴架、玩具箱、小床），擺在院子裡是好看用的，效果還是在農場穀倉裡算。</div>`, (a, v) => {
      let r;
      if (a === 'bq') return P.reqAct(v, () => wareScreen());
      if (a === 'wface') P.wareFace(v);
      if (a === 'buy') { r = P.wareBuy(v); P.toastRaw(r.ok ? `訂做好了：${P.YITEM[v].name}` : r.msg) }
      if (a === 'place') { UI.close(); return P.placeStart({ k: v }) }
      if (a === 'move') { const f = S.yardF.find(q => q.id === +v); UI.close(); return P.placeStart({ k: f.k, id: f.id, face: f.face }) }
      if (a === 'turn') { const f = S.yardF.find(q => q.id === +v); P.yardFace(f.id, { L: 'F', F: 'R', R: 'L' }[f.face]) }
      if (a === 'store') { r = P.yardStore(+v); if (!r.ok) P.toastRaw(r.msg) }
      wareScreen();
    });
    UI._refresh = null;
  }
  wareScreen.root = wareScreen;
  P.openWare = () => UI.nav(wareScreen);
  const thumbC = {};
  function itemThumb(k) { const b = P.YITEM[k].img; return `<span class="ficon big"><img src="assets/scenes/farm/furn_${b}.png" alt=""></span>` }
  // ---------- 擺放模式（院子） ----------
  let PL = null; P._place = () => PL;
  P.placeStart = o => {
    if (P.sceneName !== 'shelter') P.go('shelter');
    PL = { k: o.k, id: o.id || 0, face: o.face || 'L', x: o.x || 640, y: o.y || 540 };
    if (o.id) { const f = S_().yardF.find(q => q.id === o.id); if (f) { PL.x = f.x; PL.y = f.y } }
    else { for (let yy = 560; yy <= 640 && !P.yardFree(PL.k, PL.x, PL.y).ok; yy += 20) for (let xx = 560; xx < 1040; xx += 30) { if (P.yardFree(PL.k, xx, yy).ok) { PL.x = xx; PL.y = yy; break } } }
    placeBar();
  };
  function placeBar() {
    const v = P.yardFree(PL.k, PL.x, PL.y, PL.id);
    UI.bar([[`↺ 換方向（${P.faceName(PL.face)}）`, () => { PL.face = { L: 'F', F: 'R', R: 'L' }[PL.face]; placeBar() }, 'alt'], [v.ok ? '✔ 放這裡' : '✖ ' + v.why, () => {
      const r = PL.id ? P.yardMove(PL.id, PL.x, PL.y) : P.yardPlace(PL.k, PL.x, PL.y, PL.face); if (!r.ok) return P.toastRaw(r.msg);
      if (PL.id) P.yardFace(PL.id, PL.face); P.toastRaw(`${P.YITEM[PL.k].name}擺好了（朝${P.faceName(PL.face)}）`); PL = null; P.save(); P.shelterBar && P.shelterBar() }, v.ok ? 'ok' : 'grey'], ['✕ 取消', () => { PL = null; P.shelterBar && P.shelterBar() }, 'bad']]);
  }
  P.placeMove = (wx, y) => { if (!PL) return; PL.x = Math.round(wx); PL.y = Math.round(y + 40); placeBar() };
  P.placeDraw = (ctx) => { if (!PL) return; const v = P.yardFree(PL.k, PL.x, PL.y, PL.id), [w, h] = P.yItemSize(PL.k); ctx.save(); ctx.fillStyle = v.ok ? 'rgba(120,220,120,.28)' : 'rgba(240,90,90,.32)'; ctx.beginPath(); ctx.ellipse(PL.x, PL.y, w / 2 + 6, 12, 0, 0, 7); ctx.fill(); ctx.restore(); P.drawYItem(ctx, { k: PL.k, x: PL.x, y: PL.y, face: PL.face }, 1) };
  // 院子裡的東西被點：搬／轉／收
  P.yardTap = (wx, y) => {
    const S = S_(); if (PL) { P.placeMove(wx, y - 40); return true }
    const f = S.yardF.slice().reverse().find(f => { const [w, h] = P.yItemSize(f.k); return Math.abs(wx - f.x) < w / 2 && y > f.y - h && y < f.y + 10 });
    if (f) { pop(`<h3>${P.YITEM[f.k].name}</h3><div class="muted">朝${P.faceName(f.face)}</div><div class="faces">${P.FACES.map(([x, n]) => `<button data-a="face" data-v="${x}" class="${f.face === x ? 'ok' : 'alt'}">${n}</button>`).join('')}</div><div class="row"><button data-a="move" class="alt">搬到別的地方</button><button data-a="store" class="alt">收回雜物倉</button></div>`, (k, v) => { if (k === 'face') { P.yardFace(f.id, v); P.yardTap(wx, y) } if (k === 'move') { P.popClose(); P.placeStart({ k: f.k, id: f.id, face: f.face }) } if (k === 'store') { const r = P.yardStore(f.id); P.popClose(); if (!r.ok) P.toastRaw(r.msg) } }, 'hint'); return true }
    if (S.ware.built) { const a = C.ware.at; if (Math.abs(wx - a.cx) < 100 && y > a.by - 150 && y < a.by + 14) { P.openWare(); return true } }
    return false;
  };
  // 一館裡要跟寵物一起排前後的東西（雜物倉、院子家具、西施媽媽）
  P.XM_AT = { x: 420, y: 335, sc: 2 };
  P.p51Props = (ctx, T) => {
    const S = S_(), out = [];
    if (S.ware.built) { const a = C.ware.at; out.push({ y: a.by, draw: () => { P.drawWare(ctx, S.ware.face, a.cx, a.by); if (A.tagBox) A.tagBox(ctx, `雜物倉 Lv${S.ware.lv + 1}`, a.cx, a.by + 22, { size: 14, pad: 6, h: 21, s: 2, st: [2, 1] }) } }) }
    for (const f of S.yardF) out.push({ y: f.y, draw: () => P.drawYItem(ctx, f) });
    const X = P.XM_AT; out.push({ y: X.y, draw: () => { A.draw(ctx, { npc: '西施媽媽', sp: 'shihtzu', tier: 0 }, X.x, X.y, { act: 'idle', t: T, scale: X.sc, flip: true }); if (A.tagBox) A.tagBox(ctx, '西施媽媽 ❓', X.x, X.y + 22, { size: 14, pad: 6, h: 21, col: '#ffe9a8', s: 2, st: [2, 1] }) } });
    return out.sort((a, b) => a.y - b.y);
  };
  P.p51Tap = (wx, y) => { const X = P.XM_AT; if (Math.abs(wx - X.x) < 46 && y > X.y - 96 && y < X.y + 30) { P.openQA(); return true } return false };
  // ---------- 第 12 項：西施媽媽問答 ----------
  const q = (k, t, a) => ({ k, q: t, a });
  P.QA = [
    q('full', '住民滿了怎麼辦？', () => { const r = P.nextHousing && !P.nextHousing() ? {state:'done'} : P.buildReq((P.nextHousing && P.nextHousing()) || 'farm'); return `住民（大朋友）現在 ${P.S.pets.length}/${P.houseCap()}。有三個辦法：<br>① <b>擴建</b>：${r.state === 'done' ? '都蓋好了' : r.state === 'building' ? `${r.name}正在蓋` : `${r.name}${r.state === 'can' ? '條件都夠了，去「🏗️ 建造」就能蓋' : '還差 ' + r.lack.join('、')}`}。<br>② <b>寄放</b>：櫃檯的「寄放處」免費，隨時接回來。<br>③ <b>放他出去闖闖</b>：在寵物面板最下面，3 天後可能再相遇，還會寄明信片回來。` }),
    q('build', '怎麼加蓋？農場怎麼蓋？', () => `先按順序蓋<b>一館側廂（名聲 Lv2、8萬金幣、50麵包、12刻印、4小時，上限12）→側院（Lv3、15萬、100麵包、20刻印、8小時，上限18）→二館</b>（名聲 Lv${C.annex.rep}、金幣 ${fmt(C.annex.gold)}、麵包 ${C.annex.bread}、刻印 ${C.annex.shard}，${C.annex.hours} 小時），蓋好住民上限變 ${C.houseStep[1]}、小屋多 ${C.annex.cots} 間。再蓋<b>舊驛站穀倉（名聲 Lv6、50萬、250麵包、50刻印、12小時，上限32）</b>。之後的<b>農場</b>只開地圖、不加床位。農場（名聲 Lv${C.farm.rep}、金幣 ${fmt(C.farm.gold)}、麵包 ${C.farm.bread}、刻印 ${C.farm.shard}，${C.farm.hours} 小時），住民上限維持 32。下方「🏗️ 建造」可以看到每一樣還差什麼。`),
    q('ware', '雜物倉是做什麼的？', () => `雜物倉收家具（飯碗、餵食器、風鈴架、玩具箱、小床），拿出來就能擺在院子裡，可以選朝左、正面、朝右，之後也能搬、轉、收回去。先要蓋雜物倉（名聲 Lv${C.ware.rep}、金幣 ${fmt(C.ware.cost[0])}、麵包 ${C.ware.cost[1]}、刻印 ${C.ware.cost[2]}），一開始收 ${C.ware.slots[0]} 件，擴建最多 ${C.ware.slots[C.ware.slots.length - 1]} 件。`),
    q('fight', '寵物要怎麼出戰？', () => `按下方「⚔️ 出戰」挑一隻同行。<b>寶寶</b>和<b>大朋友</b>都能跟主人出戰。大朋友更壯：普攻和招數是同位階寶寶的 ${Math.round(C.adult.atkMul * 100)}%，藍色以上會用傳家技；寶寶有較多技能格和天性魔法，養成、傳承還是很值得。剛出生的寶寶要等隔天 05:00 才能出戰。`),
    q('basket', '育兒籃怎麼來的？', () => `兩隻同物種、都 ♡3 以上的大朋友住同一間小屋，每天 05:00 有機會在門口出現育兒籃，隔天孵出寶寶。小屋裡「一起玩」默契會變好。育兒室要有空位，育兒籃才會出現。`),
    q('up', '升階要什麼？', () => `寶寶：藍→紫 Lv${C.up[1].lv}、♡${C.up[1].heart}、藍色幸福信 ×${C.up[1].letter}、金幣 ${fmt(C.up[1].gold)}、麵包 ${C.up[1].bread}（成功率 ${C.up[1].rate}%，失敗 ${C.up[1].pity} 次保底）；紫→粉、粉→橘還要刻印碎片。大朋友也能升階：綠→藍 Lv${C.adult.up0.lv}、♡${C.adult.up0.heart}、金幣 ${fmt(C.adult.up0.gold)}、麵包 ${C.adult.up0.bread}；之後跟寶寶一樣的花費。大朋友升階不會換毛色。`),
    q('stay', '寄放是什麼？', () => `櫃檯的「寄放處」：家裡住不下的時候，把孩子免費寄放在蜜糖媽媽這裡，隨時可以接回來。寄放中的不算住民、也不算育兒室。`),
    q('send', '「放他出去闖闖」會怎樣？', () => `牠會背著小包袱出門，10 秒內可以反悔叫回來。之後會寄明信片回來（有小禮物），3 天後可能在路上再相遇、重新收留。`),
    q('rep', '名聲怎麼升？', () => `${P.repHow}現在 ${P.S.rep}（Lv${P.repLv()}）。名聲等級會打開二館、雜物倉、農場。`),
    q('vol', '聲音太大／想關掉？', () => `右上角 🔊 按一下就靜音，再按一下打開；🎚️ 可以分開調背景音樂和音效。設定會存在存檔裡。`),
    q('skill', '技能的說明在哪裡看？', () => `寵物面板裡，技能的名字（固有技能、傳家技、學到的技能、天性魔法）都可以點，會跳出：做什麼、每個位階的數字、冷卻、種類、怎麼學／洗、怎麼遺傳。`),
  ];
  function qaScreen(sel) {
    const visible=P.QA.filter(x=>!P.qaVisible||P.qaVisible(x)); const it = sel && visible.find(x => x.k === sel);
    UI.panel(`<h2>${UI.npc('西施媽媽')} 西施媽媽</h2><div class="card row2">${UI.npc('西施媽媽')}<div class="grow"><b>西施媽媽</b>：「${it ? it.a() : '有什麼不懂的，儘管問我。'}」</div></div><h3>想問什麼？</h3><div class="qa">${visible.map(x => `<button data-a="q" data-v="${x.k}" class="${x.k === sel ? 'ok' : 'alt'}">${x.q}</button>`).join('')}</div>`, (a, v) => { if (a === 'q') { qaScreen(v); if (P.sceneName === 'shelter') { const x = P.QA.find(y => y.k === v); if (x) P.speak('西施媽媽', x.q.replace(/？$/, '') + '？我在面板上跟你說喔。', 2.4) } } });
    UI._refresh = null;
  }
  P.openQA = k => { P.popClose(); if (UI.isOpen() && UI._cur && UI._cur.root === qaRoot) return qaScreen(k); UI.nav(qaRoot); if (k) qaScreen(k) };
  function qaRoot() { qaScreen() } qaRoot.root = qaRoot;
  // ---------- 第 14 項：技能說明小視窗 ----------
  P.skillPop = (kind, ref, p) => {
    const o = P.skillInfo(kind, ref, p); if (!o) return;
    const head = kind === 'inh' ? '固有技能' : kind === 'heir' ? '傳家技' : kind === 'sub' ? '天性魔法' : '技能';
    pop(`<h3>${head}｜${o.n ? '#' + o.n + ' ' : ''}${esc(o.name)} ${o.sktName && kind !== 'inh' ? `<span class="skt" style="background:${P.SKT[o.skt].col}">${o.sktName}</span>` : ''}</h3>
      <div class="kv"><span>種類</span><b>${o.cat}${o.type && o.type !== o.cat ? `（${o.type}）` : ''}</b><span>冷卻</span><b>${o.cd ? o.cd + (typeof o.cd === 'number' ? ' 秒' : '') : '—'}</b></div>
      <div class="sdesc">${o.desc}${o.impl === false ? '（測試場還沒做效果）' : ''}</div>
      <h4>各位階</h4><table class="tt">${o.tiers.length > 1 && o.tiers.every(r => r[1] === o.tiers[0][1]) ? `<tr><th>${o.tiers[0][0]}～${o.tiers[o.tiers.length - 1][0]}</th><td>${o.tiers[0][1]}<br><span class="muted">（這一招每個位階都一樣；位階高的寵物攻擊力比較高，普攻跟「寵物攻擊力 %」的招數才會跟著變強）</span></td></tr>` : o.tiers.map(([t, d]) => `<tr><th>${t}</th><td>${d}</td></tr>`).join('')}</table>
      <h4>怎麼學／怎麼洗</h4><div>${o.learn}</div><h4>遺傳／傳家</h4><div>${o.inherit}</div>${o.heirNote ? `<h4>出戰</h4><div>${o.heirNote}</div>` : ''}`, null, 'skill');
  };
  // 面板裡的技能名字被點（data-a="skd" data-v="種類:編號"）
  document.addEventListener('click', e => { const b = e.target.closest('[data-skd]'); if (!b) return; e.stopPropagation(); const [k, v] = b.dataset.skd.split(':'); const p = P.byId ? P.byId(+b.dataset.pid) : null; P.skillPop(k, k === 'sub' || k === 'inh' ? v : +v, p) }, true);
  P.skLink = (kind, ref, p, txt) => `<a class="skn" data-skd="${kind}:${ref}" data-pid="${p ? p.id : ''}">${txt}</a>`;

  // ---------- 啟動 ----------
  const boot0 = P.boot; if (boot0) P.boot = async (...a) => { const r = await boot0(...a); if (r === false) return false; fixS(P.S); sysbar(); P.audioApply(); return r };
  setTimeout(() => { if (P.S) { fixS(P.S); sysbar() } }, 0);
})(window.PET);
