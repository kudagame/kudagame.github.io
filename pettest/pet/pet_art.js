// 寵物圖：紙娃娃（body_<fur>_<動作> ＋ acc_<位階>_<動作>）；沒有自己圖的物種先用西施犬換色當暫用圖
'use strict';
(function (P) {
  const A = P.art = { sets: {}, cache: {}, imgs: {}, ready: false, src: {} };
  // P5.3 boot2: only request visible assets; never probe the development tree.
  A.missing = []; const images = new Map(), queue = []; let active = 0;
  const changed = () => { A.cache = {}; A.ptCache = {}; A.iconCache = {}; if (P.ui && P.ui.refreshPanel) P.ui.refreshPanel() };
  function pump() {
    while (active < 6 && queue.length) {
      const im = queue.shift(); active++; im._petAttempts = (im._petAttempts || 0) + 1; const resolve = im._petResolve; let released = false;
      const release = () => { if (released) return; released = true; active--; pump() };
      const failed = () => { if (!A.missing.includes(im._petSrc)) A.missing.push(im._petSrc); resolve(false); release() };
      // A timeout releases the queue, but DOES NOT remove onload: slow images may recover.
      const timer = setTimeout(failed, 15000);
      im.onload = () => { clearTimeout(timer); A.missing = A.missing.filter(s => s !== im._petSrc); im._petErrorAt = 0; resolve(true); release(); changed() };
      im.onerror = () => { clearTimeout(timer); im._petErrorAt = Date.now(); failed(); changed() };
      im.src = im._petSrc + (im._petAttempts > 1 ? '?retry=' + im._petAttempts : ''); // stable URL: reuse the HTTP cache on repeat visits
    }
  }
  A.lazyImage = src => {
    if (!images.has(src)) { const im = new Image(); im._petSrc = src; images.set(src, im) }
    return images.get(src);
  };
  A.startImage = im => {
    if (im && im._petErrorAt && Date.now() - im._petErrorAt > 1500 && im._petAttempts < 3) { im._petReady = null; im._petErrorAt = 0 }
    if (im && im._petSrc && !im._petReady) {
      im._petReady = new Promise(r => { im._petResolve = r }); queue.push(im); pump();
    }
    return im;
  };
  A.imageOK = im => { A.startImage(im); return !!(im && im.complete && im.naturalWidth > 0) };
  function tryPacked(dir) { const m = window.PET_ART_MANIFEST || {}; return m[dir] ? { j: m[dir], base: `assets/pets/${dir}/`, live: 0 } : null }
  A.load = async () => {
    A.missing = [];
    for (const s of P.SPECIES.concat(Object.keys(P.HYB || {}).map(id => ({id})))) {
      const dirs = P.HYB && P.HYB[s.id] ? ['hybrid_' + s.id] : P.SP[s.id].dirs;
      for (const d of dirs) { const set = tryPacked(d); if (set) { A.sets[s.id] = set; A.src[s.id] = '打包 ' + set.base; break } }
    }
    if (!A.sets.shihtzu) throw new Error('缺少西施犬打包清單，請重新整理或重新建置素材');
    A.ready = true;
    A.ensurePet('shihtzu', 0, 'idle'); // visible NPC only; no network waits in boot
  };
  A.ensurePet = (sp, tier, act) => {
    const fs = A.setFor(sp); if (!fs.set) return [];
    const {j, base} = fs.set; if (!j.anchors[act]) act = 'idle';
    const tn = P.TIERS[tier], ti = j.tiers[tn] || j.tiers.adult;
    const parts = [['body_' + ti.fur + '_' + act, 'body_' + ti.fur + '_' + act]];
    if ((ti.body || []).includes(act)) parts.push(['tbody_' + tn + '_' + act, 'body_tier_' + tn + '_' + act]);
    if (tn !== 'adult' && !j.noAccessories) parts.push(['acc_' + tn + '_' + act, 'acc_' + tn + '_' + act]);
    return parts.map(([key,file]) => { const im = A.imgs[fs.sp + '|' + key] = A.lazyImage(base + file + '.png'); A.startImage(im); return im._petReady });
  };
  // Explicit QA/export hook, never called from boot. Tests can verify the full asset set.
  A.preloadAll = async () => {
    const jobs = [];
    for (const sp of Object.keys(A.sets)) for (let tier = 0; tier < P.TIERS.length; tier++)
      for (const act of Object.keys(A.sets[sp].j.anchors)) jobs.push(...A.ensurePet(sp, tier, act));
    for (const sp of Object.keys(window.PET_PORTRAITS || {})) for (let t = 0; t < 5; t++) { const ph = A.photoInfo(sp,t); if (ph && ph.img) jobs.push(ph.img._petReady) }
    await Promise.all(jobs);
  };
  A.setFor = sp => A.sets[sp] ? { sp, set: A.sets[sp], tint: false } : { sp: 'shihtzu', set: A.sets.shihtzu, tint: sp !== 'shihtzu' };
  A.nFrames = (sp, act) => { const s = A.setFor(sp).set; return s && s.j.anchors[act] ? s.j.anchors[act].length : 1 };
  A.fps = (sp, act) => { const s = A.setFor(sp).set; return (s && s.j.fps && s.j.fps[act]) || 8 };
  // 位階頭頂（含帽子／頭盔）：anchors.json tiers[t].head_top[動作][格]，沒有就退回物種頭頂 → 愛心、閃光不會蓋到帽子
  A.headTop = (sp, tier, act, f) => { const s = A.setFor(sp).set, tn = P.TIERS[tier], h = s && s.j.tiers && s.j.tiers[tn] && s.j.tiers[tn].head_top && s.j.tiers[tn].head_top[act]; return h ? h[f % h.length] : A.anchor(sp, act, f).head_top };
  A.anchor = (sp, act, f) => { const s = A.setFor(sp).set; const a = s && s.j.anchors[act]; return a ? a[f % a.length] : { head_top: [36, 14], mouth: [41, 30] } };
  A.meta = sp => { const s = A.setFor(sp).set; return s ? s.j : { canvas: [64, 56], ground_y: 50 } };
  // 換色：只動有彩度的像素（外框、白色不動），讓暫用圖看得出是不同物種
  function tint(cv, sp) {
    const s = P.SP[sp]; const x = cv.getContext('2d'); let d;
    try { d = x.getImageData(0, 0, cv.width, cv.height) } catch (e) { return }   // file:// 開時不能讀像素，就只加名牌
    const a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (!a[i + 3]) continue; let r = a[i] / 255, g = a[i + 1] / 255, b = a[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, sa = 0;
      if (mx !== mn) { const dd = mx - mn; sa = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6 }
      if (sa < 0.12 || l < 0.15) continue;
      h = (h + s.hue / 360 + 1) % 1; sa = Math.min(1, sa * s.sat);
      const q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa, p = 2 * l - q;
      const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p };
      a[i] = f(h + 1 / 3) * 255; a[i + 1] = f(h) * 255; a[i + 2] = f(h - 1 / 3) * 255;
    }
    x.putImageData(d, 0, 0);
  }
  // 星彩（色違）換色：有顏色的毛轉色相，白／灰毛染上淡淡的星彩色；外框不動
  function shinyTint(cv, sp) {
    const sh = P.SP[sp].shiny; const x = cv.getContext('2d'); let d;
    try { d = x.getImageData(0, 0, cv.width, cv.height) } catch (e) { return }
    const a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (!a[i + 3]) continue; let r = a[i] / 255, g = a[i + 1] / 255, b = a[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let l = (mx + mn) / 2, h = 0, sa = 0;
      if (l < 0.15) continue;
      if (mx !== mn) { const dd = mx - mn; sa = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6 }
      if (sa < 0.12) { h = sh.gh / 360; sa = sh.gs * (l > 0.9 ? 0.6 : 1) } else { h = (h + sh.h / 360 + 1) % 1; sa = Math.min(1, sa * sh.s) }
      l = Math.max(0.16, Math.min(0.97, l + (sh.l || 0)));
      const q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa, p = 2 * l - q;
      const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p };
      a[i] = f(h + 1 / 3) * 255; a[i + 1] = f(h) * 255; a[i + 2] = f(h - 1 / 3) * 255;
    }
    x.putImageData(d, 0, 0);
  }
  // 取得一格合成好的圖（快取）
  A.frame = (sp, tier, act, f, rare) => {
    const fs = A.setFor(sp); if (!fs.set) return null;
    A.ensurePet(sp, tier, act);
    const j = fs.set.j; if (!j.anchors[act]) act = 'idle';
    const n = j.anchors[act].length; f = ((f % n) + n) % n;
    const tn = P.TIERS[tier], key = `${sp}|${tn}|${act}|${f}|${rare ? 1 : 0}`;
    if (A.cache[key]) return A.cache[key];
    const [W, Hh] = j.canvas, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const x = cv.getContext('2d');
    const fur = (j.tiers[tn] || j.tiers.adult).fur;
    const body = A.imgs[`${fs.sp}|tbody_${tn}_${act}`] || A.imgs[`${fs.sp}|body_${fur}_${act}`], acc = A.imgs[`${fs.sp}|acc_${tn}_${act}`];
    const okIm = im => im && (!('complete' in im) || (im.complete && im.naturalWidth > 0));   // P4.1：還在載／載壞的圖不畫（避免 drawImage broken state）
    if (!okIm(body)) return null; // do not cache a permanently blank frame while queued/failed
    if (okIm(body)) x.drawImage(body, f * W, 0, W, Hh, 0, 0, W, Hh);
    if (fs.tint) tint(cv, sp);
    if (rare) shinyTint(cv, sp);
    if (okIm(acc)) x.drawImage(acc, f * W, 0, W, Hh, 0, 0, W, Hh);
    if ((body && !okIm(body)) || (acc && !okIm(acc))) return cv;   // 圖還沒好：這次先畫能畫的，不存快取
    return A.cache[key] = cv;
  };
  // 畫寵物：x,y＝腳底；動作 happy＝待機＋愛心、hurt＝閉眼（不會倒下）
  A.draw = (ctx, p, x, y, o) => {
    o = o || {}; const sc = o.scale || 2, act = o.act || 'idle', t = o.t || 0;
    const fps = A.fps(p.sp, act), f = Math.floor(t * fps);
    const shiny = p.star === 2 || p.shiny, at = P.artTier ? P.artTier(p) : p.tier; const cv = A.frame(p.sp, at, act, f, shiny); if (!cv) return;
    const m = A.meta(p.sp), W = cv.width * sc, Hh = cv.height * sc, gy = m.ground_y * sc;
    // P4.2 會飛的物種（貓頭鷹）：anchors.hover 列的動作圖已離地，地面線畫一個像素影子
    const hv = m.hover; if (hv && (hv.acts || []).includes(act) && !o.noShadow) { const sw = (hv.shadow && hv.shadow.w || 18) * sc / 2, sh = (hv.shadow && hv.shadow.h || 4) * sc / 2, pp = Math.max(1, sc); ctx.save(); ctx.globalAlpha = ((hv.shadow && hv.shadow.alpha) || 110) / 255; ctx.fillStyle = '#1a1016'; for (let yy = -sh; yy < sh; yy += pp) { const k = Math.sqrt(Math.max(0, 1 - ((yy + pp / 2) / sh) ** 2)), hw = Math.round(sw * k / pp) * pp; ctx.fillRect(Math.round(x) - hw, Math.round(y) + yy, hw * 2, pp) } ctx.restore() }
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(y));
    if (o.flip) ctx.scale(-1, 1);
    ctx.drawImage(cv, -W / 2, -gy, W, Hh); ctx.restore();
    if (act === 'happy' || o.hearts) A.hearts(ctx, x, y - (gy - A.headTop(p.sp, at, act, f)[1] * sc), t);
    // 星彩：每 4 秒閃一下；剛出現（o.appear 0→1.2 秒）放一圈星光
    if (shiny) { const ht = y - (gy - A.headTop(p.sp, at, act, f)[1] * sc); const ph = t % 4; if (ph < 0.9) A.sparkle(ctx, x + 14 * sc / 2, ht + 6, ph / 0.9, sc / 2); if (o.appear != null && o.appear < 1.4) A.burst(ctx, x, y - Hh / 3, o.appear / 1.4, sc) }
  };
  const STAR4 = ['...o...', '...Y...', '..oYo..', 'oYYWYYo', '..oYo..', '...Y...', '...o...'];
  A.sparkle = (ctx, x, y, k, s) => { const pts = [[0, 0, 1], [-18, 14, 0.7], [16, 22, 0.8]]; for (const [dx, dy, z] of pts) { const a = Math.sin(Math.min(1, k * 1.2 - (1 - z) * 0.3) * Math.PI); if (a <= 0) continue; ctx.globalAlpha = a; A.px(ctx, STAR4, x + dx * s - 7, y + dy * s - 7, Math.max(1, Math.round(2 * z))); ctx.globalAlpha = 1 } };
  A.burst = (ctx, x, y, k, s) => { ctx.globalAlpha = 1 - k; for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2, r = 20 + k * 70 * s / 2; A.px(ctx, STAR4, x + Math.cos(an) * r - 7, y + Math.sin(an) * r * 0.7 - 7, 2) } ctx.globalAlpha = 1 };
  // P4 大頭照：只裁「頭」（用 anchors 的 head_top／neck／mouth 定位），放大成像素頭像，再加稀有度底框（參考瑪奇 M 頭像版型，圖是我們自己的像素）
  A.iconCache = {}; A.ptCache = {};
  // P5.2：混種頭頂／頭像記號已拿掉（不再用 A.HEADMARK）
  A.headBox = (sp, tier) => {
    const cv = A.frame(sp, tier || 0, 'idle', 0, false); if (!cv) return null;
    const an = A.anchor(sp, 'idle', 0), ht = A.headTop(sp, tier || 0, 'idle', 0) || an.head_top, nk = an.neck || [ht[0], ht[1] + 16], mo = an.mouth || [ht[0] + 6, ht[1] + 12];
    const hh = Math.max(8, nk[1] - ht[1]), face = (A.meta(sp).face || 'R') === 'L' ? -1 : 1;
    const fx = face > 0 ? Math.max(mo[0], ht[0]) + hh * 0.28 : Math.min(mo[0], ht[0]) - hh * 0.28, bx = face > 0 ? Math.min(ht[0], nk[0]) - hh * 0.62 : Math.max(ht[0], nk[0]) + hh * 0.62;
    let x0 = Math.min(fx, bx), x1 = Math.max(fx, bx); const y0 = ht[1] - 3, y1 = nk[1] + hh * 0.22;
    // 錨點不準的圖（例如西施）：照實際像素找頭的左右邊（頭頂到脖子之間、離頭頂太遠的不算）
    try { const W = cv.width, d = cv.getContext('2d').getImageData(0, 0, W, cv.height).data, op = (x, y) => x >= 0 && x < W && d[(y * W + x) * 4 + 3] > 40; let a = W, b = -1;
      for (let y = Math.max(0, ht[1]); y < Math.min(cv.height, ht[1] + hh * 0.72); y++) { let c = -1; for (let dx = 0; dx <= 3 && c < 0; dx++) { if (op(ht[0] + dx, y)) c = ht[0] + dx; else if (op(ht[0] - dx, y)) c = ht[0] - dx } if (c < 0) continue; let l = c, r = c; while (op(l - 1, y)) l--; while (op(r + 1, y)) r++; a = Math.min(a, l); b = Math.max(b, r) }
      if (b - a > hh * 0.5) { x0 = a - 1; x1 = b + 2 } } catch (e) { }
    const side = Math.max(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + side * 0.04;
    return { cv, x: cx - side / 2, y: cy - side / 2, s: side };
  };
  // P4v2 大頭照：使用者全寵物影片裁出來的頭像（assets/portraits，tools/sync_portraits.py 產生）
  // 成年(素體)=綠、藍、紫、粉各一張，名字對得上 40 隻名冊；橘用粉的圖＋橘框光暈；混血暫時用 base 物種的圖換色（P5.2 先把頭上記號拿掉，專屬頭像下一步再做）；缺圖才退回像素頭
  // P5.3：混種專屬圖亦由同一 idle 小人裁出，尾／耳／背斑完整入鏡。
  // P5.2：大頭照改從場上小人的頭裁出來，同一 look 的頭像跟小人同色、同樣子；不再用 PT_REMAP 換檔／改名
  const PM = window.PET_PORTRAITS || {}; A.PHOTO = {}; A.photoMissing = [];
  A.photoInfo = (sp, tier) => { const h = P.HYB && P.HYB[sp], own = !!PM[sp], base = own ? sp : h ? h.base : sp, g = Math.min(3, Math.max(0, tier || 0)), m = PM[base] && PM[base][g]; if (!m) return null; const o = (tier || 0) >= 4 && m.o; return { base, g, hyb: own ? null : h || null, src: 'assets/portraits/' + (o || m.f), name: m.name, img: portrait(base, o ? 4 : g, o || m.f), orange: !!o, remap: null } };
  // 毛色基因（深／淺／雪）：小人、大頭照、像素頭都用同一組濾鏡
  A.COAT_FILT = ['', 'brightness(0.72) saturate(1.15)', 'brightness(1.18) saturate(0.7)', 'grayscale(0.9) brightness(1.5)'];
  A.COAT_DOT = { 4: '#ffe36b', 5: '#ffffff', 6: '#1A1016', 7: '#7a4a22', 8: '#9fe8ff' };
  // 美術用的位階：寶寶照位階（橘＝粉的身體＋橘配件）；大朋友照「長相」look（P5.1 大朋友升階不換毛色、不換衣服）
  P.artTier = p => !p ? 0 : p.baby ? (p.tier || 0) : (p.look != null ? Math.min(3, p.look) : (p.tier || 0));
  const portrait = (sp, g, file) => {
    const key = sp + '|' + g;
    if (!A.PHOTO[key]) A.PHOTO[key] = A.lazyImage('assets/portraits/' + file);
    return A.startImage(A.PHOTO[key]);
  };
  const loaded = im => im && im.complete && im.naturalWidth > 0;
  A.photoCv = (sp, tier, shiny, size, o) => {
    const ph = A.photoInfo(sp, tier); if (!ph || !loaded(ph.img)) return null;
    o = o || {}; const key = `ph|${sp}|${tier}|${shiny ? 1 : 0}|${size}|${o.coat || 0}`; if (A.ptCache[key]) return A.ptCache[key];
    const out = document.createElement('canvas'); out.width = out.height = size; const c = out.getContext('2d'); c.imageSmoothingEnabled = false;   // P4.1 像素大頭照：最近鄰，不糊
    const r = Math.round(size * 0.2), rr = (x, y, w, h, rad) => { c.beginPath(); c.moveTo(x + rad, y); c.arcTo(x + w, y, x + w, y + h, rad); c.arcTo(x + w, y + h, x, y + h, rad); c.arcTo(x, y + h, x, y, rad); c.arcTo(x, y, x + w, y, rad); c.closePath() };
    // P5.1 #16：混血換色、星彩換色改用跟小人「同一個」像素換色函式（以前大頭照用 CSS 色相，星彩大頭照根本沒換色）
    const f = []; if (ph.remap && ph.remap !== 'none') f.push(ph.remap); if (o.coat && o.coat <= 3 && !shiny) f.push(A.COAT_FILT[o.coat]);
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = size; const tc = tmp.getContext('2d'); tc.imageSmoothingEnabled = false; if (f.length) tc.filter = f.join(' '); tc.drawImage(ph.img, 0, 0, size, size); tc.filter = 'none';
    if (ph.hyb) { tint(tmp, sp); f.push('hyb') } if (shiny) { shinyTint(tmp, sp); f.push('shiny') }
    c.save(); rr(0, 0, size, size, r); c.clip(); c.drawImage(tmp, 0, 0); c.restore();
    // 原圖的框是綠／藍／紫／粉；換色、毛色、橘階的時候框也會跑掉 → 重畫一圈位階色的框
    const reframe = f.length || ph.remap || ((tier || 0) >= 4 && !ph.orange), bw = Math.max(2, Math.round(size * 0.07));
    if (reframe) { const col = P.TIER_COLOR[Math.min(4, tier || 0)]; c.save(); if ((tier || 0) >= 4) { c.shadowColor = '#ffb347'; c.shadowBlur = size * 0.12 } rr(bw / 2 + 0.5, bw / 2 + 0.5, size - bw - 1, size - bw - 1, r - 1); c.lineWidth = bw; c.strokeStyle = col; c.stroke(); c.restore();
      if ((tier || 0) >= 4) { const g = c.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.72); g.addColorStop(0, 'rgba(255,140,20,0)'); g.addColorStop(1, 'rgba(255,170,60,.35)'); c.save(); rr(0, 0, size, size, r); c.clip(); c.fillStyle = g; c.fillRect(0, 0, size, size); c.restore() } }
    if (o.coat >= 4 && A.COAT_DOT[o.coat]) { const ps = Math.max(2, Math.round(size / 20)); c.save(); c.globalAlpha = 0.85; c.fillStyle = A.COAT_DOT[o.coat]; for (let i = 0; i < 4; i++) c.fillRect(Math.round(size * 0.22 + i * size * 0.15), Math.round(size * 0.8 - (i % 2) * ps * 2), ps, ps); c.restore() }   // P5.1 #16：突變花紋小點，小人身上有、大頭照也要有
    return A.ptCache[key] = out;
  };
  A.portraitCv = (sp, tier, shiny, size, o) => { const p = A.photoCv(sp, tier || 0, shiny, size || 64, o); return p || A.pixelCv(sp, tier, shiny, size, o, !A.photoInfo(sp, tier || 0)) };
  A.pixelCv = (sp, tier, shiny, size, o, cache) => {
    o = o || {}; size = size || 64; const key = `${sp}|${tier}|${shiny ? 1 : 0}|${size}|${o.coat || 0}`; if (A.ptCache[key]) return A.ptCache[key];
    const hb = A.headBox(sp, tier); if (!hb) return null;
    const cvs = shiny ? A.frame(sp, tier || 0, 'idle', 0, true) : hb.cv;
    const out = document.createElement('canvas'); out.width = out.height = size; const c = out.getContext('2d'); c.imageSmoothingEnabled = false;
    const col = P.TIER_COLOR[tier || 0], r = Math.round(size * 0.16), bw = Math.max(2, Math.round(size / 22));
    const rr = (x, y, w, h, rad) => { c.beginPath(); c.moveTo(x + rad, y); c.arcTo(x + w, y, x + w, y + h, rad); c.arcTo(x + w, y + h, x, y + h, rad); c.arcTo(x, y + h, x, y, rad); c.arcTo(x, y, x + w, y, rad); c.closePath() };
    // 底：稀有度色的光暈
    rr(0, 0, size, size, r); c.fillStyle = '#1A1016'; c.fill();
    rr(bw, bw, size - bw * 2, size - bw * 2, r - 2); const g = c.createRadialGradient(size / 2, size * 0.42, size * 0.05, size / 2, size / 2, size * 0.7); g.addColorStop(0, shiny ? '#fff6c8' : '#ffffff'); g.addColorStop(0.45, shiny ? '#ffe07a' : col); g.addColorStop(1, '#2a1c26'); c.fillStyle = g; c.fill();
    c.save(); rr(bw, bw, size - bw * 2, size - bw * 2, r - 2); c.clip();
    if (tier >= 3) { c.globalAlpha = 0.5; c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.fillRect(Math.round(size / 2 + Math.cos(a) * size * 0.36), Math.round(size * 0.45 + Math.sin(a) * size * 0.34), Math.max(1, size / 32), Math.max(1, size / 32)) } c.globalAlpha = 1 }
    const pad = size * 0.06, k = (size - pad * 2) / hb.s;
    if (o.coat && o.coat <= 3 && !shiny) c.filter = A.COAT_FILT[o.coat];
    c.drawImage(cvs, hb.x, hb.y, hb.s, hb.s, pad, pad + size * 0.04, hb.s * k, hb.s * k); c.filter = 'none';
    c.restore();
    rr(bw / 2, bw / 2, size - bw, size - bw, r); c.lineWidth = bw; c.strokeStyle = shiny ? '#ffe36b' : col; c.stroke();
    rr(bw * 1.5, bw * 1.5, size - bw * 3, size - bw * 3, r - 2); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.55)'; c.stroke();
    if (cache) A.ptCache[key] = out; return out;   // 有大頭照但還沒載好：先用像素頭，不存快取
  };
  A.icon = (sp, tier, shiny, size, o) => {
    size = size || 64; const coat = (o && o.coat) || 0, key = `${sp}|${tier}|${shiny ? 1 : 0}|${size}|${coat}`; if (key in A.iconCache) return A.iconCache[key];
    const ph = A.photoInfo(sp, tier || 0);
    // 一般情況（不用換色、不是橘階）直接用圖檔網址：http 和 file:// 都能顯示，不必 toDataURL
    if (ph && !ph.hyb && !ph.remap && !shiny && !(coat >= 4) && ((tier || 0) < 4 || ph.orange) && !(coat && coat <= 3)) return A.iconCache[key] = ph.src;   // P5.1 #16：要換色的（星彩／毛色／對調過的）一律畫出來
    const cv = ph ? A.photoCv(sp, tier || 0, shiny, size, o) : A.pixelCv(sp, tier || 0, shiny, size, o, 1);
    if (!cv) return ph.src;   // 圖還在載：先給原圖，載好後會清快取重畫
    try { return A.iconCache[key] = cv.toDataURL() } catch (e) { return A.iconCache[key] = ph ? ph.src : null }   // file:// 開時畫布不能轉圖：退回原圖
  };
  // 材料小圖示（像素）
  const ICONS = { letterB: ['oooooooo', 'osSSSSso', 'oSsSSsSo', 'oSSssSSo', 'oSSSSSSo', 'oooooooo'], star: ['...oo...', '..oYYo..', 'ooYYYYoo', 'oYYWYYYo', '.oYYYYo.', '.oYooYo.', '.oo..oo.'], dusk: ['...oo...', '..oKKo..', 'ooKKKKoo', 'oKKWKKKo', '.oKKKKo.', '.oKooKo.', '.oo..oo.'], collar: ['.oooooo.', 'oYyyyyYo', 'oy....yo', 'oy....yo', 'oYyYYyYo', '.ooYYoo.', '...oo...'], gold: ['.ooo.', 'oYYYo', 'oYyYo', 'oYYYo', '.ooo.'] };
  A.matIcon = (k, size) => { const key = 'mat|' + k + '|' + (size || 24); if (A.iconCache[key]) return A.iconCache[key]; const rows = ICONS[k] || A[k.toUpperCase()]; if (!rows) return ''; const s = Math.floor((size || 24) / Math.max(rows.length, rows[0].length)); const o = document.createElement('canvas'); o.width = o.height = size || 24; A.px(o.getContext('2d'), rows, ((size || 24) - rows[0].length * s) / 2, ((size || 24) - rows.length * s) / 2, s); return A.iconCache[key] = o.toDataURL() };
  A.hearts = (ctx, x, y, t) => {
    for (let i = 0; i < 3; i++) { const ph = (t * 0.9 + i / 3) % 1; const hx = x + Math.sin((t + i) * 3) * 10 + (i - 1) * 14, hy = y - 6 - ph * 40; ctx.globalAlpha = 1 - ph; A.px(ctx, HEART, hx - 7, hy - 6, 2); ctx.globalAlpha = 1 }
  };
  const HEART = ['.oo.oo.', 'oRRoRRo', 'oRWRRRo', 'oRRRRRo', '.oRRRo.', '..oRo..', '...o...'];
  A.PAL = { o: '#1A1016', R: '#ff5a7a', W: '#ffd0dc', G: '#8a8590', g: '#b8b3bd', P: '#ff9fb4', e: '#1A1016', r: '#e08a9a', p: '#ffb3c6', K: '#e67fa0', w: '#fff', Y: '#ffd54a', y: '#d9a520', B: '#b5793a', b: '#7a4a22', S: '#eef6ff', s: '#a9c8e8', C: '#ffe9a8', c: '#ff8c2a', N: '#5a5a66', n: '#9a9aa8' };
  A.px = (ctx, rows, x, y, s) => { for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) { const ch = rows[r][c]; if (ch === '.') continue; ctx.fillStyle = A.PAL[ch] || ch; ctx.fillRect(Math.round(x + c * s), Math.round(y + r * s), s, s) } };
  A.HEART = HEART;

  // P5.1：圓角像素框（第 6 項）——角落一階一階收進去，外框深色、上緣亮一階、下緣暗一階，不再是硬梆梆的直角方塊
  A.pxPath = (x, y, w, h, s, st) => { const n = st.length, q = new Path2D(), P2 = []; x = Math.round(x); y = Math.round(y); const R = x + Math.round(w), B = y + Math.round(h);
    for (let i = 0; i < n; i++) P2.push([R - st[i] * s, y + i * s], [R - st[i] * s, y + (i + 1) * s]); P2.push([R, y + n * s], [R, B - n * s]);
    for (let i = n - 1; i >= 0; i--) P2.push([R - st[i] * s, B - (i + 1) * s], [R - st[i] * s, B - i * s]);
    for (let i = 0; i < n; i++) P2.push([x + st[i] * s, B - i * s], [x + st[i] * s, B - (i + 1) * s]); P2.push([x, B - n * s], [x, y + n * s]);
    for (let i = n - 1; i >= 0; i--) P2.push([x + st[i] * s, y + (i + 1) * s], [x + st[i] * s, y + i * s]);
    P2.forEach((p, i) => i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1])); q.closePath(); return q };
  A.pxBox = (ctx, x, y, w, h, o) => {
    o = o || {}; const s = o.s || 2, st = o.st || [3, 1], edge = o.edge || '#1A1016', fill = o.fill || 'rgba(26,16,22,.82)';
    ctx.save(); const out = A.pxPath(x, y, w, h, s, st), inn = A.pxPath(x + s, y + s, w - 2 * s, h - 2 * s, s, st.map(v => Math.max(0, v - 1)).filter((v, i, a) => v > 0 || i === 0));
    const ring = new Path2D(); ring.addPath(out); ring.addPath(inn); ctx.fillStyle = edge; ctx.fill(ring, 'evenodd');
    ctx.fillStyle = fill; ctx.fill(inn);
    ctx.save(); ctx.clip(inn); ctx.fillStyle = o.hi || 'rgba(255,255,255,.22)'; ctx.fillRect(x, y + s, w, s); ctx.fillStyle = o.lo || 'rgba(0,0,0,.22)'; ctx.fillRect(x, y + h - 2 * s - (o.loH || 0), w, s + (o.loH || 0)); ctx.restore();
    ctx.restore();
  };
  // 共用字牌：置中、圓角像素框（各場景的 tag／label／plate 都改叫這個）
  A.tagBox = (ctx, t, x, y, o) => { o = o || {}; const fs = o.size || 15; ctx.font = `bold ${fs}px sans-serif`; const pad = o.pad || 8, w = ctx.measureText(t).width + pad * 2, h = o.h || fs + 9, top = y - h + Math.round(fs * 0.3) + 2;
    A.pxBox(ctx, x - w / 2, top, w, h, o); ctx.fillStyle = o.col || '#fff'; ctx.fillText(t, x - w / 2 + pad, y); return { x: x - w / 2, y: top, w, h } };
  // 遊戲裡現成的老鼠圖（web/m21.js MOUSEPX），小豬是新畫的 PIGPX，小雞簡化版
  A.MOUSE = ["..........oo", "...oooo..oPPo", ".oGGGGGo.oGo.", "oGgggggGGGGoo", "oGggggggGGGeo", "oGGgggggGGGGo", ".oGGGGGGGGoo.", "rr.o.o..o.o..", "r............"];
  A.PIG = ["...........oo.", "..ooooooo.oKo.", ".oppppppppopo..", "opppppppppppoo.", "Kppppppppppeppo", "oppppppppppKKKo", ".oppppppppKoKo.", "..oppppppppoo..", "...oo.o..oo.o..", "...oo.o..oo.o.."];
  A.CHICK = ["...oo...", "..oYYo..", ".oYYeYo.", ".oYYYYcc", "oYYYYYo.", "oYyYYYo.", ".oYYYo..", "..o.o..."];
  A.BREAD = ["..oooo..", ".oCCCCo.", "oCBCCBCo", "oBBBBBBo", "obbbbbbo", ".oooooo."];
  A.COIN = [".ooo.", "oYYYo", "oYyYo", "oYYYo", ".ooo."];
  A.BANANA = ["......oo", ".....oYo", "oo..oYYo", "oYooYYo.", ".oYYYo..", "..ooo..."];
  A.PAN = ["..oooo....", ".oNNNNo...", "oNnnnNNooo", "oNnnnNNNNo", ".oNNNNoooo", "..oooo...."];
  A.BONE = ["oo....oo", "oCo..oCo", ".oCCCCo.", "oCo..oCo", "oo....oo"];
  A.BOX = ["oooooooooooo", "oBBBBBBBBBBo", "oBoBBBBBBoBo", "oBBBBBBBBBBo", "obbbbbbbbbbo", "oBBBBBBBBBBo", "oBBBBBBBBBBo", "oooooooooooo"];
})(window.PET);
