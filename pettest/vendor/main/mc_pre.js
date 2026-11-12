// 2026-11-12 救援關主遊戲戰鬥模組 — 宿主前置（主遊戲腳本載入前執行）。不是主遊戲原檔。
// 目的：讓逐位元組未修改的主遊戲程式在 iframe 裡跑，但「絕對不寫」玩家真正的主遊戲存檔、不連網存檔、不自己開主迴圈。
'use strict';
(function () {
  const W = window;
  // 1) localStorage → 記憶體版本。只在這裡「讀一次」真正的 m2save（唯讀複本）；之後主遊戲程式的所有寫入都只寫進記憶體，關頁即消失。
  let real = null; try { real = W.localStorage } catch (e) { }
  const mem = new Map();
  const readReal = k => { try { return real ? real.getItem(k) : null } catch (e) { return null } };
  for (const k of ['m2save', 'erinn_mobui']) { const v = readReal(k); if (v != null) mem.set(k, String(v)) }
  const store = {
    getItem: k => (mem.has(String(k)) ? mem.get(String(k)) : null),
    setItem: (k, v) => { mem.set(String(k), String(v)); W.__mcWrites = (W.__mcWrites || 0) + 1 },
    removeItem: k => { mem.delete(String(k)) }, clear: () => mem.clear(), key: i => [...mem.keys()][i] ?? null,
    get length() { return mem.size }
  };
  Object.defineProperty(W, 'localStorage', { value: store, configurable: true, enumerable: true, writable: false });
  W.__mcStore = store; W.__mcSeedM2 = mem.get('m2save') || null;
  // 2) 主遊戲 exe 用的本機伺服器端點（save／load／ping／rec…）一律在這裡回 404（與主遊戲網頁版在 GitHub Pages 上一樣＝「沒有本機伺服器」：錄影改成下載、不寫伺服器存檔），不送出網路請求；.ogg 在不支援的瀏覽器改用 .m4a（主遊戲 SW 的同一規則）。
  const OGG = (() => { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '' } catch (e) { return false } })();
  W.__mcOgg = OGG;
  const fix = u => (!OGG && /\.ogg(\?|$)/.test(u)) ? u.replace(/\.ogg(\?|$)/, '.m4a$1') : u;
  const of = W.fetch.bind(W);
  const LOCAL = /^(save|load|ping|rec|recstat|quit|savepath|__cfg)$/;
  W.fetch = (u, o) => {
    const url = typeof u === 'string' ? u : (u && u.url) || '';
    let p = ''; try { p = new URL(url, location.href).pathname.split('/').pop() } catch (e) { }
    if (LOCAL.test(p)) return Promise.resolve(new Response(null, { status: 404 }));
    return of(typeof u === 'string' ? fix(u) : u, o);
  };
  if (navigator.sendBeacon) { const sb = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = (u, d) => /(^|\/)save$/.test(String(u)) ? false : sb(u, d) }
  const A0 = W.Audio; W.Audio = function (src) { const a = src === undefined ? new A0() : new A0(fix(String(src))); return a }; W.Audio.prototype = A0.prototype;
  // 3) 主遊戲自己的 load → loadAll()+requestAnimationFrame(frame) 不執行（由 mc_post.js 依寵物頁的節拍逐格呼叫 step／drawWorld）
  W.__mcLoadFns = [];
  const ael = W.addEventListener.bind(W);
  W.addEventListener = function (t, f, o) { if (t === 'load') { W.__mcLoadFns.push(f); return } return ael(t, f, o) };
})();
