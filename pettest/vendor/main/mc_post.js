// 2026-11-12 救援關主遊戲戰鬥模組 — 轉接層（在主遊戲全部腳本之後執行）。不是主遊戲原檔。
// 原則：主遊戲（W3.3 dist_web）的 game.js／m2*.js／w1.js／mob.js 逐位元組照抄，不改一字；
//   這裡只做「宿主」該做的事：選角、開一個寵物救援用的關卡格（petr）、把寵物頁的敵人／籠子變成主遊戲看得到的目標（代理怪），
//   逐格呼叫主遊戲自己的 step()／drawWorld()／drawHUD()，再把主遊戲算出的傷害回報給寵物頁。
//   英雄的移動、跳躍、J/K/L/V、閃避、連段、暴擊、受傷／倒地／無敵、裝備與強化，全部是主遊戲原本的程式在算。
'use strict';
(function () {
  const Wn = window;
  const MCH = Wn.MCH = { ready: false, missing: new Set(), drawnMissing: new Set(), stunU: -9, slowU: -9, slowMul: 0.6, spdMul: 1, atkMul: 1, critAdd: 0, hpShare: 0, cb: null, PX: new Map(), ver: 'mc-20261112' };
  let HAVE = null;
  // ---------- 素材：只打包戰鬥用得到的圖；其餘（主遊戲關卡大背景、主遊戲怪物、標題卡）給 1×1 透明畫布，不發網路請求 ----------
  const blank = n => { const c = document.createElement('canvas'); c.width = c.height = 1; c.__mcMissing = n; return c };
  const li0 = Wn.li;
  Wn.li = function (n) { if (HAVE && !HAVE.has('a/' + n + '.png')) { const c = blank(n); IMG[n] = c; MCH.missing.add(n); return Promise.resolve(c) } return li0(n) };
  const lm0 = Wn.loadMus;
  Wn.loadMus = function (n, k) { return HAVE && HAVE.has('a/' + n + '.ogg') ? lm0(n, k) : Promise.resolve() };   // 只載詩人支援的魯特琴（主遊戲召喚時播）；關卡 BGM 由寵物頁自己放
  const A1 = Wn.Audio; Wn.Audio = function (src) { if (src !== undefined && HAVE) { const m = /a\/([^?]+)\.(ogg|m4a)/.exec(String(src)); if (m && !HAVE.has('a/' + m[1] + '.ogg')) return new A1() } return src === undefined ? new A1() : new A1(src) }; Wn.Audio.prototype = A1.prototype;
  const MCBG = blank('mc_bg');
  // 主遊戲關卡開場字卡（關卡名／難度）在救援關不顯示
  Wn.card = (o => function () { if (isR() || MCH._begin) return; return o.apply(this, arguments) })(Wn.card);
  // ---------- 救援關卡格 petr ----------
  const isR = () => S0 && S0.stage === 'petr';
  // 關卡波次：寵物頁自己管（救援籠、三種籠兵、格魯姆），主遊戲這格不出主遊戲的怪
  Wn.stepWaves = (o => function () { if (isR()) return; return o.apply(this, arguments) })(Wn.stepWaves);
  // 主遊戲原本的跟班小龍（stepPet／守護泡泡）在救援關由「寵物頁自己的同行寵物」取代，不重複出現
  Wn.stepPet = (o => function () { if (isR()) return; return o.apply(this, arguments) })(Wn.stepPet);
  // 代理怪：AI／攻擊交給寵物頁；這裡只跑主遊戲原本的「被打反應」物理（浮空、彈地、倒地、起身、硬直），程式與 game.js stepMobs 同一段
  Wn.stepMobs = (o => function (dt) {
    if (!isR()) return o.apply(this, arguments);
    const s = S0, t = s.t; stepBoss(dt); stepBleed(dt);
    for (const m of s.mobs) {
      if (m.gone || m.kind === 'boss' || m.kind === 'pillar') continue;
      if (t < m.frz) continue;
      if (m.state === 'air') { m.x += m.vx * dt; m.vh -= 1900 * dt; m.h += m.vh * dt; m.rot = (Math.floor((t - m.flash) / 0.06) * 90) % 360;
        if (m.h <= 0) { m.h = 0; puff(m.x, m.y - 3, 5, [214, 170, 128], 40, 0.4, 3); if (!m.bounced) { m.bounced = true; m.vh = 200; m.vx *= 0.4 } else { m.state = 'down'; m.rot = 0; m.getup = t + U(0.8, 1.2); if (m.dying) m.dieT = t + 0.35 } } }
      else if (m.state === 'down') { if (!m.dying && t >= m.getup) { m.state = 'walk'; m.cd = Math.max(m.cd, 0.8); puff(m.x, m.y - 4, 4, [214, 170, 128], 40, 0.3, 2) } }
      else if (m.state === 'stun') { m.x += m.vx * dt; m.vx *= Math.exp(-9 * dt); if (t >= m.stun) m.state = 'walk' }
      m.x = clamp(m.x, 20, WW - 20);
    }
  })(Wn.stepMobs);
  // 代理怪的倒下由寵物頁決定（掉落、籠兵倒地動畫、格魯姆連籠倒下）；主遊戲這邊只標記，不走主遊戲的掉寶／經驗／看守者死亡流程
  Wn.mobDie = (o => function (m) { if (m && m.__px) { m.dying = true; if (m.kind !== 'boss' && m.kind !== 'pillar' && m.state !== 'air') { m.state = 'down'; m.dieT = S0.t + 0.35 } return } return o.apply(this, arguments) })(Wn.mobDie);
  // 代理怪不用主遊戲的泥魔像／看守者／赤晶柱圖（畫面上是寵物頁的籠兵、格魯姆、鐵籠）；主遊戲小龍也不畫
  Wn.spr = (o => function (n) { if (isR() && typeof n === 'string' && (n.startsWith('golem_') || n.startsWith('pet_'))) return; return o.apply(this, arguments) })(Wn.spr);
  Wn.drawBoss = (o => function (m) { if (m && m.__px) return; return o.apply(this, arguments) })(Wn.drawBoss);
  Wn.drawPillar = (o => function (m) { if (m && m.__px) return; return o.apply(this, arguments) })(Wn.drawPillar);
  Wn.shadowE = (o => function (sx, sy, w) {
    if (isR() && (w === 36 || w === 84 || w === 26)) { const cx0 = MCH._cx0 || 0; for (const m of S0.mobs) if (m.__px && Math.abs(m.x - cx0 - sx) < 1.5) return; if (w === 26) return }
    return o.apply(this, arguments) })(Wn.shadowE);
  // 寵物頁的場景物件（鐵籠、籠兵、格魯姆、同行寵物、掉落物、道具）插進主遊戲同一個「依腳底 y 排序」的清單 → 英雄和敵人前後遮擋正確
  Wn.m2Ents = (o => function (ents, SX, shy) { const r = o.apply(this, arguments); if (isR() && MCH.cb && MCH.cb.ents) { MCH._cx0 = -SX(0); try { MCH.cb.ents(ents, -SX(0), shy) } catch (e) { (Wn.__err = Wn.__err || []).push('mc ents ' + e.message) } } return r })(Wn.m2Ents);
  // 主人分享（寵物系統）：HP%、攻擊%、暴擊% 疊在主遊戲數值之上；主遊戲本身的公式不變
  Wn.calcGS = (o => function () { const r = o.apply(this, arguments);
    if ((isR() || MCH._applyShare) && MCH.hpShare) { let base = HPMAX; if (MCH._hpLast != null && HPMAX === MCH._hpLast) base = MCH._hpBase;   // 主遊戲沒重算時不重複疊加
      MCH._hpBase = base; HPMAX = Math.round(base * (1 + MCH.hpShare)); HEAL_CAP = Math.round(HPMAX * 0.08); MCH._hpLast = HPMAX }
    MCH._cdBase = GS.cdmg; if (isR() || MCH._applyShare) GS.cdmg = MCH._cdBase + MCH.cdmgAdd;
    return r })(Wn.calcGS);
  // 寵物加成（每格由寵物頁更新）：攻擊倍率、暴擊率 +、暴擊傷害 +、移動速度倍率
  MCH.cdmgAdd = 0;
  MCH.setBonus = function (b) { MCH.atkMul = b.atk || 1; MCH.critAdd = b.crit || 0; MCH.spdMul = b.spd || 1; const c = b.cdmg || 0; if (c !== MCH.cdmgAdd) { MCH.cdmgAdd = c; if (MCH._cdBase != null) GS.cdmg = MCH._cdBase + c } };
  Wn.m2Dmg = (o => function (v, m, mv) { const r = o.apply(this, arguments); return (isR() && mv !== 'pet' && MCH.atkMul !== 1 && typeof r === 'number') ? Math.round(r * MCH.atkMul) : r })(Wn.m2Dmg);
  Wn.m2Crit = (o => function () { const r = o.apply(this, arguments); return isR() ? r + MCH.critAdd : r })(Wn.m2Crit);
  // 撒網兵「緩速」（2 秒、移動 ×0.6）、拖籠兵「暈眩」（0.8 秒）：直接作用在主遊戲的 P（中斷 P.act＝任何招式、清掉輸入、不能移動）
  Wn.stepPlayer = (o => function (dt) {
    const s = S0, P = s && s.P; if (!P || !isR()) return o.apply(this, arguments);
    const t = s.t, stun = t < MCH.stunU; let held = null;
    if (stun) { held = Object.assign({}, K); for (const k in K) K[k] = 0; for (const k in KP) delete KP[k]; GP = {}; GPP = {}; P.act = null; P.chainBuf = 0 }
    const x0 = P.x, y0 = P.y, free = !P.act;
    const r = o.apply(this, arguments);
    if (stun) { P.act = null; P.chainBuf = 0; P.x = x0; P.y = y0; for (const k in held) if (K[k] === 0) K[k] = held[k] }
    else { const mul = (t < MCH.slowU ? MCH.slowMul : 1) * MCH.spdMul; if (mul !== 1 && free && !P.act) { P.x = clamp(x0 + (P.x - x0) * mul, 30, WW - 30); P.y = clamp(y0 + (P.y - y0) * mul, YMIN, YMAX) } }
    return r })(Wn.stepPlayer);

  // ---------- 開機 ----------
  MCH.boot = async function () {
    if (MCH.ready) return true;
    HAVE = new Set((await (await fetch('mc_files.json', { cache: 'no-cache' })).json()).files);
    await loadAll();   // 主遊戲原本的 loadAll：meta、圖、m2Load（讀記憶體裡的 m2save 複本）、字型
    IMG.mc_bg = MCBG;
    MCH.mainHero = HEROK; MCH.ready = true; return true;
  };
  MCH.heroOf = () => HEROK;
  // ---------- 開一場 ----------
  MCH.begin = function (o) {
    const ww = Math.max(1280, o.ww | 0 || 1280);
    STAGES.petr = { img: 'mc_bg', ww, name: o.name || '救援' }; WAVESET.petr = []; YBAND.petr = [o.gy0, o.gy1];
    MCH.hpShare = o.hpShare || 0; MCH._hpLast = null; MCH.cdmgAdd = 0; MCH._cdBase = null; MCH.quitReq = false; MCH.notes = []; MCH.atkMul = 1; MCH.critAdd = 0; MCH.spdMul = 1; MCH.stunU = -9; MCH.slowU = -9; MCH.PX = new Map();
    MCH._applyShare = true;
    if (o.hero && HEROK !== o.hero) m22Switch(o.hero); else { m22ApplyHero(); calcGS() }
    MCH._applyShare = false;
    // 與主遊戲「出發」同一條路：m2Begin（含 m22 等級／經驗／滿血、m25 本場經驗、m27 小丑抽選等各模組的開場設定），再換到救援關卡格
    MCH._applyShare = true; MCH._begin = true;
    try { m2Begin(1, 0, false) } finally { MCH._begin = false }
    setStage('petr', { x: o.x || 200 }); calcGS(); MCH._applyShare = false;
    const s = S0; s.npc = null; s.log = []; s.hintUntil = 0; s.lock = null; s.cards = []; s.subs = [];
    s.P.y = clamp(o.y || 560, YMIN, YMAX); s.P.hp = HPMAX; s.P.face = 1; s.pet.x = -9999; s.pet.en = 0; s.pet.g = 0;
    MCH.acc = 0; MCH.t0 = performance.now();
    return MCH.state();
  };
  MCH.state = () => { const s = S0, P = s.P, a = P.act; return { hero: HEROK, x: P.x, y: P.y, h: P.h, face: P.face, hp: P.hp, max: HPMAX, dead: !!P.dead, down: m2Down(), act: a ? a.type : null, t: s.t, food: s.food, gold: s.gold, combo: s.combo, inv: s.t < (P.invU || 0) } };
  // ---------- 代理怪同步 ----------
  // list: [{id, x, y, face, hp, max, kind:'mob'|'boss'|'cage'}]
  MCH.sync = function (list) {
    const s = S0, seen = new Set();
    for (const e of list) {
      seen.add(e.id); let m = MCH.PX.get(e.id);
      const kind = e.kind === 'boss' ? 'boss' : e.kind === 'cage' ? 'pillar' : 'sword';
      if (!m || m.gone) { m = mob(kind, e.x, e.y); m.__px = e.id; m.__k = e.kind; m.enter = false; m.state = 'walk'; m.face = e.face || -1; s.mobs.push(m); MCH.PX.set(e.id, m) }
      const react = kind === 'sword' && m.state !== 'walk';
      if (!react) { m.x = e.x; m.y = e.y; m.face = e.face || m.face }
      else m.y = e.y;
      m.__head = e.head || 0; m.__name = e.name || ''; m.str = !!e.elite;
      if (kind === 'pillar') { m.hp = m.hpmax = 60000; m.rise = -9 }
      else { m.hpmax = Math.max(1, e.max); if (!m.dying) m.hp = e.hp }
      m.__hp0 = m.hp;
    }
    for (const [id, m] of MCH.PX) if (!seen.has(id)) { m.gone = true; MCH.PX.delete(id) }
    s.mobs = s.mobs.filter(m => !m.gone);
  };
  // 這一格主遊戲打到哪些代理怪、各掉多少 HP（含所有招式、延遲命中、出血、燃燒、追擊）
  MCH.collect = function () {
    const out = [];
    for (const [id, m] of MCH.PX) { const d = Math.round((m.__hp0 || 0) - m.hp); out.push({ id, d: d > 0 ? d : 0, state: m.state, x: m.x, h: m.h, rot: m.rot || 0, flash: S0.t < m.flash }); m.__hp0 = m.hp }
    return out;
  };
  // ---------- 逐格＋畫面：直接跑主遊戲自己的 frame() ----------
  // 主遊戲的 frame()（game.js＋m25 C 鍵＋m25b 按鍵延續＋m27 按鍵設定包裝）原封不動地跑：固定 1/60 秒邏輯格、最多 6 格追趕、
  // 高更新率螢幕不吃鍵、drawWorld→drawHUD→drawRitual→drawFades 的畫圖順序，全部與主遊戲一致。
  // 只有兩件事不同：(1) requestAnimationFrame 由寵物頁的主迴圈驅動（不讓主遊戲自己另開一條迴圈）；
  // (2) 救援關不開會動到主遊戲存檔的介面：I 背包（換裝）、C 角色卡、O 按鍵設定、點右下背包——按了會跳提示「請回主遊戲調整」。
  //     Esc／P 暫停照主遊戲（繼續、音量、錄影）；暫停選單的「放棄並回到地圖（Q）」＝放棄這場救援、回收容所。
  const BLOCK = { KeyI: '背包／換裝', KeyC: '角色卡', KeyO: '按鍵設定' };
  MCH.frame = function (cb) {
    const s = S0; if (!s) return 0;
    MCH.cb = cb || {};
    for (const k in BLOCK) if (KP[k]) { delete KP[k]; MCH.note(BLOCK[k]) }
    if (CLICK && mode === 'play' && !paused && Math.hypot(CLICK[0] - 1218, CLICK[1] - 574) < 44) { CLICK = null; MCH.note('背包／換裝') }
    const fn0 = Wn.__fn || 0, raf = Wn.requestAnimationFrame; Wn.requestAnimationFrame = () => 0;
    try { Wn.frame(MCH.clock ? MCH.clock() : performance.now()) } finally { Wn.requestAnimationFrame = raf; MCH.cb = null; if (Object.prototype.hasOwnProperty.call(X, 'drawImage')) delete X.drawImage }
    return (Wn.__fn || 0) - fn0;
  };
  // 主遊戲畫地圖時：關卡大圖換成寵物頁的救援場景（r1 小屋…），其他（英雄、特效、影子、彈道、傷害數字）都是主遊戲原本畫的
  Wn.drawWorld = (o => function () {
    if (!isR()) return o.apply(this, arguments);
    const cb = MCH.cb || {};
    X.drawImage = function (img, a0, a1, a2, a3, a4, a5) {
      if (img === MCBG) { if (!MCH.debugMissing) delete X.drawImage; MCH._cx0 = a0; if (cb.bg) cb.bg(X, a0, a5); else { X.fillStyle = '#3a3530'; X.fillRect(0, 0, W, H) } return }
      if (MCH.debugMissing && img && img.__mcMissing) MCH.drawnMissing.add(img.__mcMissing);
      return CR.drawImage.apply(X, arguments) };
    let r;
    try { r = o.apply(this, arguments) } finally { if (!MCH.debugMissing && Object.prototype.hasOwnProperty.call(X, 'drawImage')) delete X.drawImage }
    MCH.cam = r ? r[0] : 0;
    if (cb.after) try { cb.after(X, r[0], r[1]) } catch (e) { (Wn.__err = Wn.__err || []).push('mc after ' + e.message) }
    return r })(Wn.drawWorld);
  // 主遊戲 HUD：頭像／名字／HP／節奏、詩人支援（食物）、連擊、傷害數字、技能鈕。
  // 遮掉三塊主遊戲大地圖專用的東西：主遊戲自己的寵物量表（救援關由寵物頁的同行寵物取代，畫在同一格）、右下背包鈕、最下方黑色字幕條（救援地面延伸到 y680）
  Wn.drawHUD = (o => function () {
    if (!isR()) return o.apply(this, arguments);
    // 敵人血條用主遊戲 drawHUD 自己畫（同色、同尺寸、出血圖示）；只把高度對到寵物頁籠兵的頭頂（主遊戲固定在腳底上方 140）
    const adj = [], pil = []; for (const m of S0.mobs) { if (m.__px && m.kind === 'sword' && m.__head) { adj.push([m, m.h]); m.h += m.__head - (m.state !== 'down' ? 140 : 75) } if (m.__px && m.kind === 'pillar') { pil.push(m); m.rise = S0.t } }   // 鐵籠的「耐久」由寵物頁畫（喀！／打開了！），不畫主遊戲赤晶柱血條
    X.save(); if (!MCH.noClip) { X.beginPath(); X.rect(0, 0, W, H); X.rect(590, 0, 122, 150); X.rect(1170, 524, 104, 100); X.rect(0, 619, W, H - 619); X.clip('evenodd') }
    // 格魯姆：主遊戲 W3 王血條（w3Bar，名牌＋金框＋數字），借 s.boss 讓 drawHUD 在原本的圖層順序畫（畫完立刻還原；救援關不跑主遊戲的王 AI）
    const bm = S0.boss ? null : S0.mobs.find(m => m.__px && m.kind === 'boss' && !m.gone && m.__name);
    if (bm) S0.boss = { m: bm, w3: 'gg', name: bm.__name, stagU: 0, rare: false, __mc: 1 };
    let r; try { r = o.apply(this, arguments) } finally { X.restore(); for (const [m, h] of adj) m.h = h; for (const m of pil) m.rise = -9; if (S0.boss && S0.boss.__mc) S0.boss = null }
    drawSubsR();
    const cb = MCH.cb || {}; if (cb.hud) try { cb.hud(X) } catch (e) { (Wn.__err = Wn.__err || []).push('mc hud ' + e.message) }
    return r })(Wn.drawHUD);
  // 倒下：主遊戲的倒地動畫照播（m27 KO），但「倒下了／重來」畫面與重來流程交給寵物頁（回收容所／#31 起來呀）
  Wn.drawDead = (o => function () { if (isR()) return; return o.apply(this, arguments) })(Wn.drawDead);
  Wn.retry = (o => function () { if (isR()) return; return o.apply(this, arguments) })(Wn.retry);
  Wn.m2ToMap = (o => function () { if (isR()) { paused = false; MCH.quitReq = true; return } return o.apply(this, arguments) })(Wn.m2ToMap);
  // 暫停選單裡的「匯入存檔」會覆寫主遊戲存檔 → 救援關不提供
  Wn.m21Import = (o => function () { if (isR()) { MCH.note('匯入存檔'); return } return o.apply(this, arguments) })(Wn.m21Import);
  MCH.notes = []; MCH.note = what => { MCH.notes.push(what) };
  MCH.paused = () => !!(S0 && paused && mode === 'play');
  MCH.revive = function (frac) { const s = S0, P = s.P; P.dead = false; P.deadT = 0; P.hp = Math.max(1, Math.round(HPMAX * (frac || 0.25))); P.act = null; P.downU = 0; P.invU = s.t + 0.6; mode = 'play' };
  MCH.hurt = function (v, fromX) { const s = S0, P = s.P; if (P.dead) return 0; const hp0 = P.hp, f = fromX != null && fromX > P.x ? 1 : -1; hurtP(Math.max(1, Math.round(v)), P.x + 30 * f, P.y - 78); return Math.max(0, hp0 - P.hp) };
  MCH.stun = function (sec) { const s = S0, P = s.P; MCH.stunU = Math.max(MCH.stunU, s.t + sec); P.act = null; P.chainBuf = 0 };
  MCH.slow = function (sec, mul) { const s = S0; MCH.slowU = Math.max(MCH.slowU, s.t + sec); MCH.slowMul = mul || 0.6 };
  MCH.stunned = () => S0 && S0.t < MCH.stunU; MCH.slowed = () => S0 && S0.t < MCH.slowU;
  MCH.heal = function (v, tick) { const s = S0, P = s.P; if (P.dead || v <= 0) return 0; const hv = Math.min(Math.round(v), HPMAX - P.hp); if (hv > 0) { P.hp += hv; s.heals.push({ t: s.t, v: hv, tick: !!tick }) } return hv };
  MCH.revive = function (frac) { const s = S0, P = s.P; P.dead = false; P.hp = Math.round(HPMAX * frac); P.invU = s.t + 0.6; P.downU = 0; mode = 'play' };
  MCH.setFood = n => { S0.food = Math.max(0, Math.min(FOOD_MAX, n | 0)) };
  MCH.setGold = n => { S0.gold = n | 0 };
  MCH.shake = (a, d) => shake(a, d);
  MCH.dmgNum = function (x, y, v, crit, pet) { S0.dmg.push({ t: S0.t, x, y, v: Math.round(v), crit: !!crit, label: '', zj: false, pet: !!pet }) };
  MCH.key = function (type, code, key) { Wn.dispatchEvent(new KeyboardEvent(type, { code, key: key || '', bubbles: true, cancelable: true })) };
  MCH.releaseAll = function () { for (const k in K) K[k] = 0; for (const k in KP) delete KP[k] };
  const CR = CanvasRenderingContext2D.prototype;
  // 字幕（主遊戲原本畫在最下方黑條）：同字型、同逐字速度，改成半透明底、畫在畫面下緣
  function drawSubsR() { const s = S0, t = s.t;
    for (const [t0, t1, who, line] of s.subs) { if (t0 <= t && t < t1) { const n = Math.min(line.length, Math.floor((t - t0) / 0.045) + 1);
      X.save(); X.fillStyle = 'rgba(0,0,0,0.55)'; X.fillRect(0, 682, W, 38); X.restore();
      if (who) { rrect(40, 686, 40 + 18 + who.length * 22, 716, 6, 'rgb(60,46,30)'); T(who, 49, 701, FS(19), [255, 235, 180], 0, [0, 0, 0], 'lm') }
      T(line.slice(0, n), 640, 702, FS(24), [255, 255, 255], 2, [0, 0, 0], 'mm') } } }
  // 測試用：每個英雄的招式狀態
  MCH.debug = () => ({ hero: HEROK, HPMAX, GS: Object.assign({}, GS), act: S0 && S0.P.act && S0.P.act.type, rh: S0 && S0.P.rh, mobs: S0 ? S0.mobs.length : 0, missing: [...MCH.missing].length, drawnMissing: [...MCH.drawnMissing], err: (Wn.__err || []).slice(-10), writes: Wn.__mcWrites || 0 });
})();
// 結束一場：放開所有按鍵、停在非 play 狀態（iframe 隱藏期間不跑）
window.MCH.end = function () { const M = window.MCH; M.releaseAll(); try { paused = false; mode = 'mcidle' } catch (e) { } M.PX = new Map(); if (S0) S0.mobs = [] };
// 主遊戲的字型／文字工具（寵物頁在主遊戲畫面上畫字時用同一套：NSerif／NSans、黑邊）
window.MCH.T = T; window.MCH.FN = FN; window.MCH.FS = FS; window.MCH.tw = tw;
