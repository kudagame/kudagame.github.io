// 2026-11-12 救援關出戰角色＝玩家自己選用的主遊戲角色；強度（HP／攻擊）照主遊戲同一套公式。
// 只「讀」主遊戲存檔 localStorage.m2save（同網域時才讀得到），絕不寫入 m2save；寵物自己的選擇存在 pet_save 的 S.rescueHero。
// 公式來源（W3.3 dist_web，只讀、未改）：
//   HP：m22ApplyHero → m25 grow25（等級／覺醒；m27 vet23 老手加成）→ m27 enhHpCalc（衣褲位階 HP、衣褲強化 HP）。
//   攻擊：game.js hitMob 一般攻擊 POOL.n → m2Dmg 武器係數 0.6+0.4×攻擊/30（武器強化 enhAtk）→ m25 (1+等級攻擊+覺醒攻擊)
//         → 職業倍率（苦達斯 m24 BAL24.kudasWm 1.10；詩人 b1 第一段 0.8；三杯兔子 AR.shot.mul 0.75 × BAL27.wm 0.72；
//           夾夾 HL.atk[0].v 1700 × HL.wm 2.7）→ w1 變身 TF1_ATK 1.05（只有苦達斯、變身中）。取一般攻擊期望值（不含暴擊、背擊、連段等臨場加成）。
'use strict';
(function (P) {
  const IDS = ['kudas', 'bard', 'archer', 'heal'];
  // 與主遊戲 const HERO 完全相同（m22.js）；i＝寵物「最愛英雄」索引 P.HEROES[i]
  const HERO = { kudas: { n: '苦達斯', job: '大劍士', hp: 4125, i: 0 }, bard: { n: '尋歡作樂', job: '吟遊詩人', hp: 3300, i: 1 }, archer: { n: '三杯兔子', job: '長弓兵', hp: 3000, i: 2 }, heal: { n: '夾夾', job: '治癒師', hp: 3450, i: 3 } };
  const POOL_N = [1266, 1317, 3564, 4091];                       // game.js POOL.n（一般攻擊）
  const POOL_N_AVG = POOL_N.reduce((a, b) => a + b, 0) / POOL_N.length; // 2559.5
  // 一般攻擊：v＝基礎值、cls＝職業倍率（見檔頭）
  const BASIC = { kudas: { v: POOL_N_AVG, cls: 1.10 }, bard: { v: POOL_N_AVG, cls: 0.8 }, archer: { v: POOL_N_AVG, cls: 0.75 * 0.72 }, heal: { v: 1700, cls: 2.7 } };
  const LV_MAX = 65, GROW = { hp: 0.15, atk: 0.15 }, AWK_PER = { atk: 0.01, hp: 0.015 };
  const ENH2 = { wpn: [0.04, 0.05, 0.06], hp: [0.015, 0.025], hp15: 0.03, hpLv: [0.35, 0.55, 0.8], Q: [1, 1.08, 1.16, 1.24, 1.34, 1.46, 1.6], gh: [0.5, 1, 1.5, 2, 3] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const enhStep = (n, st) => st[n <= 5 ? 0 : n <= 10 ? 1 : 2];
  const enhSum = (e, st) => { let f = 0; for (let i = 1; i <= Math.min(15, e | 0); i++) f += enhStep(i, st); return Math.round(f * 1000) / 1000 };
  const enhAtk = e => enhSum(e, ENH2.wpn);
  const enhQ = it => it && it.r != null ? (ENH2.Q[clamp(it.r | 0, 0, ENH2.Q.length - 1)] || 1) : 1;
  const gearHp = it => it && (it.t === 'b' || it.t === 'p') ? Math.round(ENH2.gh[clamp(it.k | 0, 0, 4)] * (it.t === 'p' ? 0.5 : 1) * enhQ(it) * 1000) / 100000 : 0;
  function enhHp(e, it) {
    e = clamp(e | 0, 0, 15); const q = enhQ(it); let ms = 0;
    if (e >= 5) ms += ENH2.hp[0]; if (e >= 10) ms += ENH2.hp[1]; if (e >= 15) ms += ENH2.hp15;
    ms = Math.round(ms * 10000) / 10000; const lv = Math.round(enhSum(e, ENH2.hpLv) * q * 1000) / 100000;
    return Math.round((ms + lv) * 100000) / 100000;
  }
  const lvGrowK = L => Math.max(0, Math.min(LV_MAX, L) - 1) / (LV_MAX - 1);
  // m27 老手加成 vet23：Lv55 以上 攻擊 +10%／HP +6% 按等級比例（等級上限 65 → Lv65 拿滿），加進 grow25 的 lvAtk／lvHp
  const VET = { ref: 55, full: 75, atk: 0.10, hp: 0.06 };
  function vet23(L) { L = L | 0; const mx = Math.max(VET.ref + 1, Math.min(VET.full, LV_MAX)), n = clamp(L - VET.ref, 0, mx - VET.ref), k = n / (mx - VET.ref); return { atk: Math.round(VET.atk * k * 10000) / 10000, hp: Math.round(VET.hp * k * 10000) / 10000 } }
  // 新角色（m22Blank 經 m25 覆寫後 lv=1、覺醒清空；W3.3 實測新存檔苦達斯也是 Lv1、HPMAX 4125）：一般武器 26~34、強化 0、沒有衣褲。
  const blank = k => ({ inv: [{ id: 1, t: 'w', k: 0, r: 0, lo: 26, hi: 34, e: 0 }], eq: { w: 1, b: 0, p: 0, s: 0, r: 0, n: 0 }, slot: { e: 0 }, lv: 1, blank: 1 });
  // 主遊戲存檔目前角色：寫出時是「停車」版（m27Park／m29Park）：最上層一定是苦達斯或詩人，三杯兔子 heroX/archerX、夾夾 heroH/healX。
  function activeOf(S) {
    if (!S || typeof S !== 'object') return null;
    if (S.heroH === 'heal') return 'heal'; if (S.heroX === 'archer') return 'archer';
    return HERO[S.hero] ? S.hero : 'kudas';
  }
  // 某角色自己的資料（m22Char 同義；另外處理停車欄位）
  function charOf(S, k) {
    if (!S || typeof S !== 'object') return null;
    const top = HERO[S.hero] ? S.hero : 'kudas';
    if (k === top) return S;
    if (k === 'heal' && S.healX && typeof S.healX === 'object') return S.healX;
    if (k === 'archer' && S.archerX && typeof S.archerX === 'object') return S.archerX;
    const c = S.chars && S.chars[k]; return c && typeof c === 'object' ? c : null;
  }
  // 唯讀：讀主遊戲存檔（同網域 localStorage.m2save）。讀不到／格式錯 → null。
  function readMain() { try { const j = (typeof localStorage !== 'undefined') && localStorage.getItem('m2save'); if (!j) return null; const o = JSON.parse(j); return o && typeof o === 'object' ? o : null } catch (e) { return null } }
  // 主遊戲同款計算。S＝m2save 物件（或 null＝沒有主遊戲存檔）。回傳 {id,name,job,hp,atk,lv,src,detail}
  function stats(k, S) {
    if (!HERO[k]) k = 'kudas';
    let c = S ? charOf(S, k) : null; const fromSave = !!c; if (!c) c = blank(k);
    const inv = Array.isArray(c.inv) ? c.inv : [], eq = c.eq && typeof c.eq === 'object' ? c.eq : {};
    const item = sl => { const id = eq[sl]; if (!id) return null; return inv.find(i => i && i.id === id) || null };
    const L = Math.max(1, c.lv | 0) || 1, gk = lvGrowK(L), vet = vet23(L), lvHp = GROW.hp * gk + vet.hp, lvAtk = GROW.atk * gk + vet.atk;   // m22FixChar：lv=max(1,lv|0)；缺 lv 時 m22Blank（m25 版）＝1
    const awk = c.awk && c.awk.a ? c.awk.a : {}, awkHp = (awk.hp | 0) * AWK_PER.hp, awkAtk = (awk.atk | 0) * AWK_PER.atk;
    const base = HERO[k].hp, hp0 = Math.round(base * (1 + lvHp + awkHp));
    const slot = c.slot && typeof c.slot === 'object' ? c.slot : {}, aE = sl => slot.a && slot.a[sl] ? clamp(slot.a[sl].e | 0, 0, 15) : 0;
    let gh = 0, eh = 0; for (const sl of ['b', 'p']) { const it = item(sl); gh += gearHp(it); if (it) eh += enhHp(aE(sl), it) }
    const hp = Math.round((hp0 + Math.round(base * gh)) * (1 + eh));
    const w = item('w'); let lo = 26, hi = 34, we = 0;
    if (w && w.lo != null && w.hi != null) { we = slot.e | 0; const p = enhAtk(we); lo = Math.round(w.lo * (1 + p)); hi = Math.round(w.hi * (1 + p)) }
    const wk = 0.6 + 0.4 * ((lo + hi) / 2) / 30, B = BASIC[k];
    const tf = k === 'kudas' && S && activeOf(S) === 'kudas' && S.tf === 1 ? 1.05 : 1;
    const atk = Math.round(B.v * wk * (1 + lvAtk + awkAtk) * B.cls * tf);
    return { id: k, name: HERO[k].n, job: HERO[k].job, hp, atk, lv: L, src: fromSave ? 'm2save' : 'fresh',
      detail: { baseHp: base, lvHp, vetHp: vet.hp, awkHp, gearHp: gh, enhHp: eh, weapon: [lo, hi], weaponEnh: we, wk, lvAtk, vetAtk: vet.atk, awkAtk, basicV: B.v, cls: B.cls, tf } };
  }
  // 寵物這邊選的出戰角色：S.rescueHero（有選過）→ 主遊戲目前角色 → 苦達斯
  function pickId(petS, mainS) {
    const s = petS || P.S || {}; if (HERO[s.rescueHero]) return s.rescueHero;
    const m = mainS === undefined ? readMain() : mainS; const a = activeOf(m); return a && HERO[a] ? a : 'kudas';
  }
  function setPick(id) { if (!P.S) return; P.S.rescueHero = HERO[id] ? id : null; if (P.save) P.save() }   // null＝跟隨主遊戲目前角色
  function current() { const m = readMain(); const id = pickId(P.S, m); return Object.assign(stats(id, m), { followMain: !(P.S && HERO[P.S.rescueHero]), mainActive: activeOf(m), hasMain: !!m }) }
  P.RHERO = { IDS, HERO, BASIC, POOL_N, stats, pickId, setPick, current, readMain, activeOf, charOf, enhAtk, gearHp, enhHp };

  // ---------- 出戰角色選擇（院子：委託畫面、第一次救援前） ----------
  const POR = id => `assets/hero/por_${id}.png`;
  P.rescueHeroRow = () => {
    const m = readMain(), cur = pickId(P.S, m), follow = !(P.S && HERO[P.S.rescueHero]), act = activeOf(m);
    const cards = IDS.map(id => { const s = stats(id, m), on = id === cur;
      return `<button class="${on ? 'ok' : 'alt'}" data-a="rhero" data-v="${id}" style="display:inline-flex;align-items:center;gap:6px;margin:3px;padding:4px 8px;${on ? 'outline:3px solid #ffd36b' : ''}"><img src="${POR(id)}" alt="" width="40" height="40" style="image-rendering:pixelated;border:2px solid #1A1016;border-radius:6px"><span style="text-align:left;line-height:1.25"><b>${s.name}</b>${on ? ' ✔' : ''}<br><small>${s.job}｜Lv${s.lv}｜❤️ ${s.hp}｜⚔️ ${s.atk}</small></span></button>` }).join('');
    const note = m ? (follow ? `跟隨主遊戲目前角色（${HERO[act] ? HERO[act].n : '苦達斯'}）` : `已自己選擇；<button class="alt" data-a="rhero" data-v="main" style="padding:1px 8px">改回跟隨主遊戲（${HERO[act] ? HERO[act].n : '苦達斯'}）</button>`)
      : '這個網址讀不到主遊戲存檔，數值是新角色的起始值。';
    return `<div class="card" data-rhero="1"><div class="grow"><b>⚔️ 出戰角色</b> <span class="muted">（救援關由這位主角出戰，血量和攻擊跟主遊戲一樣）</span><div class="row" style="flex-wrap:wrap">${cards}</div><div class="muted">${note}</div></div></div>`;
  };
  P.rescueHeroAct = (a, v) => { if (a !== 'rhero') return false; setPick(v === 'main' ? null : v); return true };
  // 出發前確認（第一次救援的院子按鈕用）
  function pickScreen(qid) {
    const UI = P.ui; const cur = current();
    UI.panel(`<h2>⚔️ 出戰角色</h2><div class="muted">選一位主角去救援。只會記在寵物存檔，不會改到主遊戲。</div>${P.rescueHeroRow()}<div class="row"><button class="bad" data-a="rgo" data-v="${qid}">以 ${cur.name} 出發救援</button></div>`,
      (a, v) => { if (P.rescueHeroAct(a, v)) return pickScreen(qid); if (a === 'rgo') { P.ui.close(); P.startQuest(v) } });
  }
  P.openRescueHeroPick = qid => { const UI = P.ui; const f = () => pickScreen(qid || 'r1'); f.root = f; UI.close(); UI.nav(f) };
})(window.PET = window.PET || {});
