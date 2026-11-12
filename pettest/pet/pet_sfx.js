// 音效（P5）：全部自己合成（music/pet_sfx.py），-19 LUFS 以下、很小聲；跟背景音樂共用同一個音量，音樂關掉音效也一起安靜。
// 只包住現有的動作函式來出聲，不改任何回傳值或數字。
'use strict';
(function (P) {
  const DIR = 'assets/sfx/', N = ['s_pet_tap', 's_ui_click', 's_pet_feed', 's_pet_knock', 's_pet_hatch', 's_pet_sweep'], GAP = 120;
  const FEED = new Set(['kibble', 'bread', 'snack']);
  const pool = {}, last = {}; let on = false;
  P.sfx = {
    names: N, lastPlayed: '',
    play(n, gain = 1) {
      P.sfx.lastPlayed = n; if (!on || typeof Audio === 'undefined') return;
      const v = Math.min(1, (P.sfxVol ? P.sfxVol() : P.bgm && P.bgm.vol ? P.bgm.vol() : 0.35) * 1.1 * gain); if (!v) return;
      const t = performance.now(); if (t - (last[n] || 0) < GAP) return; last[n] = t;   // 一次餵全部也只響一下
      const a = (pool[n] = pool[n] || new Audio(DIR + n + '.ogg')).cloneNode(); a.volume = v; a.play().catch(() => { });
    },
  };
  const wrap = (k, f) => { const o = P[k]; if (typeof o !== 'function' || o._sfx) return; P[k] = function (...a) { const r = o.apply(this, a); try { f(r, ...a) } catch (e) { } return r }; P[k]._sfx = 1 };
  addEventListener('load', () => setTimeout(() => {
    // 家具自動餵不響
    wrap('interact', (r, p, kind, arg, opt) => { if (r && r.ok && !(opt && opt.auto)) P.sfx.play(FEED.has(kind) ? 's_pet_feed' : 's_pet_tap') });
    wrap('sweepPoop', r => { if (r && (r.n || r.ok)) P.sfx.play('s_pet_sweep') });
    wrap('knockEgg', r => { if (!r || !r.ok) return; P.sfx.play('s_pet_knock'); if (r.hatched) setTimeout(() => P.sfx.play('s_pet_hatch'), 260) });
    // 寶寶出生、靈性提升：短曲（背景樂先壓低）。開遊戲時補算的離線出生不響。
    let lastJ = 0; const j = n => { if (!P.booted || Date.now() - lastJ < 8000 || !P.bgm || !P.bgm.sting) return; lastJ = Date.now(); P.bgm.sting(n, 3.8) };
    P.on && P.on(e => { if (e.type === 'birth' && on) j('j_pet_birth'); else if (e.type === 'up' && /靈性提升 →/.test(e.msg || '') && on) j('j_pet_tierup') });
    for (const n of N) pool[n] = new Audio(DIR + n + '.ogg');
  }, 0));
  // 按鈕：小木片聲（瀏覽器要先點一下才能出聲，第一下就順便打開）
  addEventListener('pointerdown', e => { on = true; const b = e.target && e.target.closest && e.target.closest('button,.btn,[data-a]'); if (b) P.sfx.play('s_ui_click', 0.8) }, true);
})(window.PET);
