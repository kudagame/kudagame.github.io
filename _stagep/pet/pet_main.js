// 啟動、主迴圈、共用介面
'use strict';
(function (P) {
  const UI = P.ui = P.ui || {};
  const $ = s => document.querySelector(s);
  UI.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  UI.toast = (m, ms) => { const d = document.createElement('div'); d.textContent = m; $('#toast').appendChild(d); setTimeout(() => d.remove(), ms || 2200); while ($('#toast').children.length > 4) $('#toast').firstChild.remove() };
  // 面板：上方固定一條「返回／標題／✕」；Esc、點面板外面都會關；面板不蓋住下方按鈕列
  // 換頁用 UI.nav(畫面函式)，返回會回到上一個畫面
  UI._stack = []; UI._cur = null;
  UI._kn = 0; UI.nav = fn => { fn.k = fn.k || ++UI._kn; if (UI._cur && UI.isOpen()) { UI._cur._top = $('#panel').scrollTop; UI._stack.push(UI._cur) } UI._refresh = null; UI._cur = fn; fn() };
  UI.back = () => { const fn = UI._stack.pop(); if (fn) { UI._refresh = null; UI._cur = fn; fn(); if (fn._top) { const t = fn._top, el = $('#panel'); el.scrollTop = t; requestAnimationFrame(() => { if (UI._cur === fn) el.scrollTop = t }) } } else UI.close() };   // P4.4：回到剛剛捲到的位置
  UI.panel = (html, onclick) => {
    const p = $('#panel'), keep = UI.isOpen() && p.dataset.k === String(UI._cur && UI._cur.k), top = p.scrollTop;
    p.innerHTML = `<div class="ptop"><button class="alt" data-a="back">${UI._stack.length ? '◀ 返回' : '◀ 關閉'}</button><span class="pttl"></span><button class="close bad" data-a="close" aria-label="關閉">✕</button></div>` + html;
    const h2 = p.querySelector('h2'); if (h2) { p.querySelector('.pttl').innerHTML = h2.innerHTML; h2.remove() }
    p.classList.remove('hide'); document.body.classList.add('panelOpen'); UI._pc = onclick; p.dataset.k = String(UI._cur && UI._cur.k); p.scrollTop = keep ? top : 0;
  };
  UI.refreshPanel = () => { if (UI._refresh && !$('#panel').classList.contains('hide')) UI._refresh() };
  UI.close = () => { $('#panel').classList.add('hide'); document.body.classList.remove('panelOpen'); UI._refresh = null; UI._stack = []; UI._cur = null };
  addEventListener('keydown', e => { if (e.key === 'Escape' && UI.isOpen()) { e.preventDefault(); UI.close() } });
  // 頭像：o＝寵物或 {sp, tier, star}；size＝像素
  UI.av = (o, size, extra) => {
    size = size || 40; const sh = o.star === 2 || o.shiny, cs = o.coat ? Math.min(...o.coat) : 0, src = P.art && P.art.icon(o.sp, P.artTier ? (o.id ? P.artTier(o) : o.tier || 0) : o.tier || 0, sh, 96, { coat: cs });   // P5.1 #16：跟小人同一套位階／毛色
    return `<span class="av pt${sh ? ' shiny' : ''}" style="width:${size}px;height:${size}px">${src ? `<img src="${src}" alt="">` : `<i style="font-size:${size * 0.6}px">${(P.SP[o.sp] || {}).emo || '🐾'}</i>`}${sh ? '<b>✦</b>' : ''}${extra || ''}</span>`;
  };
  UI.mat = (k, size) => { const s = P.art && P.art.matIcon(k, size || 22); return s ? `<img class="mat" src="${s}" alt="">` : '' };
  UI.npc = name => { const m = { 蜜糖媽媽: { sp: 'shihtzu', tier: 0 }, 西施: { sp: 'shihtzu', tier: 2 }, 獵犬: { sp: 'retriever', tier: 0 }, 小貓頭鷹: { sp: 'owl', tier: 0 } }[name] || { sp: 'shihtzu', tier: 0 }; return UI.av(m, 44) };
  UI.isOpen = () => !$('#panel').classList.contains('hide');
  $('#panel').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; if (P.careVisit) P.careVisit(); if (b.dataset.a === 'close') return UI.close(); if (b.dataset.a === 'back') return UI.back(); if (UI._pc) UI._pc(b.dataset.a, b.dataset.v, b); P.save(); UI.hud() });
  UI.bar = (btns) => { const b = $('#bar'); b.innerHTML = ''; for (const [t, f, cls] of btns) { const e = document.createElement('button'); e.textContent = t; if (cls) e.className = cls; e.onclick = () => { if (P.careVisit) P.careVisit(); f(); P.save(); UI.hud() }; b.appendChild(e) } };
  UI.fmtTime = t => { const d = new Date(t + P.CFG.tz * 3600e3); const z = n => String(n).padStart(2, '0'); return `${d.getUTCMonth() + 1}/${z(d.getUTCDate())} ${z(d.getUTCHours())}:${z(d.getUTCMinutes())}` };
  UI.hud = () => {
    const S = P.S; if (!S) return;
    const sc = P.scene && P.scene.hud ? P.scene.hud() : '';
    // P3：還沒拿到過的東西不顯示
    const sh = (k, t) => P.seen(k) ? `<span>${t}</span>` : '';
    $('#hud').innerHTML = (P.scene && P.scene.hudOnly) ? `<span>🕐 ${UI.fmtTime(P.now())}</span>` + sc : `<span>🕐 ${UI.fmtTime(P.now())}（台北）</span>${sh('gold', `💰 ${S.gold.toLocaleString()}`)}${sh('bread', `🍞 剩食麵包 ${S.bread}`)}${sh('snackMat', `🍪 零食材料 ${S.snackMat}`)}${sh('disk', `💿 技能磁片 ${S.disk}`)}${sh('shards', `🔷 刻印碎片 ${S.shards}`)}${S.rep ? `<span>⭐ 名聲 ${S.rep}（Lv${P.repLv()}）</span>` : ''}` + sc;
  };
  // 畫布座標
  const cv = $('#cv'), ctx = cv.getContext('2d'); P.cv = cv; P.ctx = ctx;
  P.toWorld = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 1280, y: (e.clientY - r.top) / r.height * 720 } };
  // P3：按下去先問場景要不要「抓起來拖」（寵物）；沒抓到才當成點一下
  let drag = null;
  cv.addEventListener('pointerdown', e => {
    if (P.careVisit) P.careVisit();   // 在收容所／小屋做任何動作都算當天有照顧
    if (UI.isOpen() && P.sceneName !== 'arena') { UI.close(); return }
    const w = P.toWorld(e);
    if (P.scene && P.scene.down && P.scene.down(w.x, w.y, e)) { drag = { id: e.pointerId, x: w.x, y: w.y, moved: 0 }; try { cv.setPointerCapture(e.pointerId) } catch (x) { } return }
    if (P.scene && P.scene.tap) P.scene.tap(w.x, w.y, e);
  });
  cv.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const w = P.toWorld(e); if (Math.hypot(w.x - drag.x, w.y - drag.y) > 10) drag.moved = 1; if (P.scene && P.scene.move) P.scene.move(w.x, w.y, drag.moved) });
  const up = e => { if (!drag || drag.id !== e.pointerId) return; const w = P.toWorld(e), d = drag; drag = null; if (P.scene && P.scene.up) P.scene.up(w.x, w.y, d.moved) };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  P.keys = {};
  addEventListener('keydown', e => { P.keys[e.code] = 1; if (P.scene && P.scene.key) P.scene.key(e.code, 1) });
  addEventListener('keyup', e => { P.keys[e.code] = 0 });
  P.go = (name, arg) => { if (P.scene && P.scene.leave) P.scene.leave(); P.scene = P.scenes[name]; P.sceneName = name; UI.close(); P.scene.enter(arg); UI.hud() };
  P.scenes = P.scenes || {};
  P.paused = 0;
  let last = performance.now(), acc = 0, hudT = 0;
  P.fps = 60;
  function loop(t) {
    let dt = Math.min(0.05, (t - last) / 1000); last = t; P.fps = P.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
    try {
      if (P.scene) { P.scene.update(dt); P.scene.draw(ctx); if (P.overlay) P.overlay(ctx, dt) }   // P5.1：說話泡泡畫在最上層
      acc += dt; if (acc > 1) { acc = 0; P.advance(); P.save() }
      hudT += dt; if (hudT > 0.5) { hudT = 0; UI.hud(); UI.refreshPanel() }
    } catch (e) { console.error(e); P.emit('err', 'JS 錯誤：' + e.message) }
    requestAnimationFrame(loop);
  }
  window.addEventListener('error', e => P.emit('err', 'JS 錯誤：' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  P.boot = async () => {
    const status = $('#bootStatus');
    if (status) { status.classList.remove('hide'); status.textContent = '蜜糖之家準備中…' }
    try {
      P.load(); P.open();
      await P.art.load();
      P.go('shelter');   // 新存檔也顯示院子及一次性 r1 救援入口，不先送寵物。
      last = performance.now();
      requestAnimationFrame(loop);
      P.booted = 1;
      if (status) status.classList.add('hide');
      if (P.art.missing.length) UI.toast('部分寵物圖載入失敗，請稍後重新整理。', 5000);
    } catch (e) {
      console.error(e); P.emit('err', '啟動失敗：' + e.message);
      if (status) {
        status.textContent = '蜜糖之家無法啟動：' + e.message + ' ';
        const retry = document.createElement('button'); retry.textContent = '重新整理';
        retry.onclick = () => location.reload(); status.appendChild(retry);
      }
      return false;
    }
    return true;
  };
  window.addEventListener('load', () => P.boot());
})(window.PET);
