// 背景音樂：每個地方有自己的曲子，換場景時 0.8 秒交叉淡入淡出（像美少女夢工場 2 那樣，走到哪裡就換哪首）
// 曲子全部原創（music/pet_music.py），響度統一 -19 LUFS；預設音量再壓低到 0.35。
// 還沒做好的曲子先用 fallback，做好後只要把檔案放進 assets/music/ 並在 READY 加上名字。
'use strict';
(function (P) {
  const DIR = 'assets/music/', FADE = 0.8, KEY = 'pet_bgm_vol';
  const READY = new Set(['m_pet_shelter', 'm_pet_shelter_night', 'm_pet_annex', 'm_pet_farm', 'm_pet_train', 'm_pet_expedition', 'm_pet_trail', 'm_pet_spring', 'm_pet_contest_village', 'm_pet_contest_town', 'm_pet_contest_royal', 'm_pet_cot']);
  // 地方 → 曲名（曲目表見 design/pet_asset_list_zh.md 第 4 節）
  const MAP = {
    shelter: () => P.isNight() ? 'm_pet_shelter_night' : 'm_pet_shelter',
    annex: () => P.isNight() ? 'm_pet_shelter_night' : 'm_pet_annex',
    room: 'm_pet_cot', farm: 'm_pet_farm', barn: 'm_pet_farm', train: () => P.isNight() ? 'm_pet_spring' : 'm_pet_train', expedition: 'm_pet_expedition', trail: 'm_pet_trail', spring: 'm_pet_spring',   // 訓練營晚上大家在休息屋睡 → 溫泉的白霧
    contest: () => 'm_pet_contest_' + (P.cupVenue ? P.cupVenue().music : 'village'), arena: null,   // 大會：村祭／城鎮／王都三個版本（傳說大會＝王都）          // null＝不換曲，沿用上一首
  };
  const FALLBACK = 'm_pet_shelter';
  P.isNight = () => { const h = new Date(P.now() + P.CFG.tz * 3600e3).getUTCHours(); return h >= 18 || h < 6 };
  let vol = +(localStorage.getItem(KEY) ?? 0.35), cur = null, curName = '', want = '', unlocked = false;
  const fades = new Set();
  function ramp(a, to, sec, done) {
    const from = a.volume, t0 = performance.now(), job = { a };
    for (const f of fades) if (f.a === a) fades.delete(f);
    fades.add(job);
    const step = () => {
      if (!fades.has(job)) return;
      const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(step); else { fades.delete(job); done && done() }
    };
    step();
  }
  function resolve(place) {
    let n = MAP[place]; if (typeof n === 'function') n = n(); if (n === null) return null;
    return READY.has(n) ? n : FALLBACK;
  }
  function play(name) {
    if (!name || name === curName) return; want = name; if (!unlocked) return;
    const old = cur, a = new Audio(DIR + name + '.ogg'); a.loop = true; a.volume = 0;
    a.play().catch(() => { });
    cur = a; curName = name; ramp(a, vol, FADE);
    if (old) ramp(old, 0, FADE, () => { old.pause(); old.src = '' });
  }
  P.bgm = {
    place(p) { const n = resolve(p); if (n) play(n); },     // 進入某個地方（面板也可以叫，例如探險隊、大會）
    leavePanel() { P.bgm.place(P.sceneName) },               // 關掉探險隊／大會面板，回到原本場景的曲子
    vol(v) { if (v == null) return vol; vol = Math.max(0, Math.min(1, v)); localStorage.setItem(KEY, vol); if (cur) ramp(cur, vol, 0.2) },
    now: () => curName,
    // 短曲（頒獎號角）：播一次，背景曲先壓到 1/4，播完再慢慢回來
    sting(name, sec = 4.6) { P.bgm.lastSting = name; if (!unlocked || !vol) return; const a = new Audio(DIR + name + '.ogg'); a.volume = vol; a.play().catch(() => { }); const c = cur; if (c) { ramp(c, vol * 0.25, 0.2); setTimeout(() => { if (cur === c) ramp(c, vol, 0.8) }, sec * 1000) } },
  };
  // 瀏覽器要求使用者先點一下才能出聲
  const unlock = () => { if (unlocked) return; unlocked = true; const w = want; want = ''; curName = ''; if (w) play(w) };
  addEventListener('pointerdown', unlock, { once: true }); addEventListener('keydown', unlock, { once: true });
  // 換場景就換曲：包住 P.go
  const wrap = () => { const go = P.go; if (!go || go._bgm) return; P.go = (name, arg) => { go(name, arg); P.bgm.place(name === 'shelter' ? yardPlace() : name) }; P.go._bgm = 1 };
  addEventListener('load', () => setTimeout(() => { wrap(); P.bgm.place(P.sceneName) }, 0));
  // 收容所：鏡頭移到二館就換二館的曲子；待著跨過 18:00／06:00 時晝夜曲子自動交換（每秒看一次，曲名一樣就不動）
  const yardPlace = () => P.S && P.S.annex === 1 && P.shelterView && P.shelterView() >= 640 ? 'annex' : 'shelter';
  setInterval(() => { if (P.sceneName === 'shelter') P.bgm.place(yardPlace()); else if (P.sceneName === 'train') P.bgm.place('train') }, 1000);
})(window.PET);
