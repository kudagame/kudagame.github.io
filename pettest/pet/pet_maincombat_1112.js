// 2026-11-12 救援關改用「主遊戲戰鬥模組」：英雄就是主遊戲裡的那個角色（同一份存檔、同一套招式／傷害／受傷／倒地／閃避／手機按鍵）。
// 做法：同網域 iframe（vendor/main/host.html）裡跑主遊戲 W3.3 原檔（逐位元組複製），寵物頁只負責關卡（籠子、籠兵、格魯姆、寵物、掉落）。
// iframe 是獨立的 window → 主遊戲的全域 P／S0／IMG 與寵物頁的 PET 不會互相蓋掉。
// 主遊戲存檔只讀不寫：iframe 內的 localStorage 是記憶體複本（mc_pre.js），伺服器存檔端點也在 iframe 內攔下。
'use strict';
(function (P) {
  const MC = P.MC = { ready: false, failed: null, on: false, H: null, W: null, fr: null };
  const QS = new URLSearchParams(location.search);
  // jsdom 單元測試、file://、?mc=0 → 不載入（救援關退回寵物頁原本的簡易英雄）
  MC.usable = () => !MC.failed && !/jsdom/i.test(navigator.userAgent) && /^https?:$/.test(location.protocol) && QS.get('mc') !== '0' && !P.noMC;
  let bootP = null;
  MC.boot = function () {
    if (bootP) return bootP;
    bootP = new Promise((res, rej) => {
      const fr = document.createElement('iframe'); MC.fr = fr; fr.id = 'mcFrame'; fr.title = '主遊戲戰鬥';
      const mob = QS.get('mob'); fr.src = 'vendor/main/host.html' + (mob != null ? '?mob=' + encodeURIComponent(mob) : '');
      fr.setAttribute('allow', 'autoplay; fullscreen'); fr.className = 'mcHide'; document.body.appendChild(fr);
      const to = setTimeout(() => rej(new Error('主遊戲戰鬥模組載入逾時')), 45000);
      fr.addEventListener('load', async () => {
        try { const W = fr.contentWindow; if (!W.MCH) throw new Error('host 沒有 MCH'); await W.MCH.boot(); MC.W = W; MC.H = W.MCH; MC.ready = true; clearTimeout(to); res(true) }
        catch (e) { clearTimeout(to); rej(e) }
      }, { once: true });
    }).catch(e => { MC.failed = String(e && e.message || e); console.warn('[MC]', MC.failed); throw e });
    return bootP;
  };
  // 開打：顯示 iframe（蓋住寵物頁畫布＝主遊戲畫面）、選角、開關卡格
  MC.start = function (o) {
    const H = MC.H; const st = H.begin(o); MC.on = true;
    document.body.classList.add('mcOn'); MC.fr.classList.remove('mcHide');
    try { MC.fr.focus(); MC.W.focus() } catch (e) { }
    return st;
  };
  MC.stop = function () {
    if (!MC.on) return; MC.on = false; try { MC.H.end() } catch (e) { }
    document.body.classList.remove('mcOn'); if (MC.fr) MC.fr.classList.add('mcHide');
    try { window.focus() } catch (e) { }
  };
  // 焦點在寵物頁（例如點了上方按鈕）時，鍵盤照樣轉給主遊戲
  const fwd = e => {
    if (!MC.on || !MC.H) return; if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    MC.H.key(e.type, e.code, e.key); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  };
  addEventListener('keydown', fwd); addEventListener('keyup', fwd);
  addEventListener('blur', () => { if (MC.on && MC.H && document.activeElement !== MC.fr) MC.H.releaseAll() });
  // 提早在背景載入（不擋寵物頁開機）：素材約 17MB，第一次進救援才不會等
  MC.preload = () => { if (MC.usable() && !bootP) MC.boot().catch(() => { }) };
  addEventListener('load', () => setTimeout(MC.preload, 1500));
})(window.PET);
