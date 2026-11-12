// 測試場：主角＋同行寵物＋幾隻小怪（救援關／一般／王戰）。寵物不會受傷、不會倒下。
'use strict';
(function (P) {
  const UI = P.ui || (P.ui = {}), C = P.CFG, SC = P.scenes = P.scenes || {};
  const IMG = {}; const li = s => { const i = P.art.lazyImage(s); return i };
  // 2026-11-12 出戰主角＝玩家選的主遊戲角色（P.RHERO）。全部是主遊戲原始 440×300 幀（dist_web/pk 解包，未修改），腳點同苦達斯 (200,284)。
  // 一般攻擊時序取主遊戲：苦達斯維持本測試場原揮擊；詩人 b1（0.24s、0.08s 命中）、三杯兔子普通射擊（0.30s、0.06s 放箭）、夾夾 atk1（0.33s、0.13s 命中）。
  const seq = (p, n) => Array.from({ length: n }, (_, i) => p + i);
  const HART = {
    kudas: { idle: ['s_kudas_idle'], it: 1, run: seq('s_kudas_run', 4), rt: .1, atk: ['s_kudas_windup', 's_kudas_swing'], dur: .38, hitLeft: .22, reach: 150 },
    bard: { idle: seq('s_bh_play', 2), it: .36, run: seq('s_bh_run', 4), rt: .09, atk: ['s_bh_triplet_cast', 's_bh_thrust'], dur: .24, hitLeft: .16, reach: 120, hurt: 's_bh_hurt', down: 's_bh_down' },
    archer: { idle: seq('s_ar_idle', 6), it: .16, run: seq('s_ar_run', 8), rt: .075, atk: ['s_ar_shot1', 's_ar_shot2', 's_ar_shot3'], atkK: [.2, .45], dur: .30, hitLeft: .24, reach: 0, ranged: { v: 1500, rng: 760 }, hurt: 's_ar_hurt0', down: 's_ar_ko3' },
    heal: { idle: seq('s_hl_idle', 12), it: .12, run: seq('s_hl_run', 8), rt: .075, atk: seq('s_hl_atk1_', 6), dur: .33, hitLeft: .20, reach: 150, hurt: 's_hl_hurt1' },
  };
  const heroFrames = H => [...H.idle, ...H.run, ...H.atk, H.hurt, H.down].filter(Boolean);
  for (const id in HART) { for (const f of heroFrames(HART[id])) IMG['hero_' + f] = li(`assets/hero/${f}.png`); IMG['por_' + id] = li(`assets/hero/por_${id}.png`) }
  function heroAtkFrame(H, u) {
    if (H.atk.length === 2) return u < H.dur - H.hitLeft ? H.atk[0] : H.atk[1];
    if (H.atkK) { const k = u / H.dur; return k < H.atkK[0] ? H.atk[0] : k < H.atkK[1] ? H.atk[1] : H.atk[2] }
    return H.atk[Math.min(H.atk.length - 1, Math.floor(u / H.dur * H.atk.length))];
  }
  const MON = window.PET_MON || {}; for (const k in MON) IMG['m_' + k] = li(`assets/mon/${k}_sheet.png`);
  // 正式遊戲同款像素小兵（1x 原圖、畫面 2 倍最近鄰、腳底橢圓陰影）。r1 主打鐵籠三兵，並混入泥魔像。
  const PIX = {
    golem: { cw: 140, ch: 110, cx: 70, cy: 100, top: 36, face: 'R' },
    gbow: { cw: 140, ch: 110, cx: 70, cy: 100, top: 36, face: 'R', bow: 1 },
    cage: { key: 'cg_cage', cw: 104, ch: 88, cx: 52, cy: 82, top: 14, face: 'L', motion: 1 },
    net: { key: 'cg_net', cw: 136, ch: 88, cx: 72, cy: 82, top: 14, face: 'L', motion: 'net' },
    drag: { key: 'cg_drag', cw: 104, ch: 96, cx: 36, cy: 82, top: 14, face: 'L', motion: 'drag' },
  };
  // 格魯姆 HP：簡易英雄 240000（原設計）；主遊戲戰鬥模組 820000＝主遊戲 W3 頭目「泥魔像隊長」同級（主遊戲斬風單發可達 53 萬，240000 會被一招秒掉，見 out/main_combat_1112/REPORT_zh.md）
  const KIND = {
    minion: { pix: 'golem', hp: 20000, atk: 350, spd: 70, rng: 100, atkA: 'attack', gold: 67, xp: 1 },
    axe: { pix: 'golem', hp: 35000, atk: 600, spd: 55, rng: 110, atkA: 'attack', gold: 67, xp: 1 },
    archer: { pix: 'gbow', hp: 18000, atk: 300, spd: 50, rng: 520, atkA: 'bdraw', gold: 67, xp: 1, ranged: 1 },
    cage: { pix: 'cage', hp: 22000, atk: 380, spd: 65, rng: 100, atkA: 'attack', gold: 67, xp: 1 },
    net: { pix: 'net', hp: 18000, atk: 300, spd: 50, rng: 520, atkA: 'attack', gold: 67, xp: 1, ranged: 1 },
    drag: { pix: 'drag', hp: 45000, atk: 500, spd: 35, rng: 110, atkA: 'attack', gold: 67, xp: 1 },
    boss: { grum: 1, hp: 240000, mcHp: 820000, atk: 1000, spd: 45, rng: 170, atkA: 'slam', gold: 3000, xp: 20, boss: 1 },
  };
  ['walk0', 'walk1', 'attack', 'hit', 'down', 'bwalk', 'bdraw', 'bhit'].forEach(f => {
    IMG['s_golem_' + f] = li('assets/mon/golem/s_golem_' + f + '.png');
    IMG['f_golem_' + f] = li('assets/mon/golem/f_golem_' + f + '.png');
    IMG['g_golem_' + f] = li('assets/mon/golem/g_golem_' + f + '.png');
  });
  ['cage', 'net', 'drag'].forEach(k => IMG['cg_' + k] = li('assets/mon/cage/cg_' + k + '.png'));
  // 提籠兵：使用者原圖14姿勢；每張稿只取一個原生尺度，共用腳點 (52,82)。
  for (let i = 0; i < 14; i++) for (const k of ['s', 'f', 'g']) {
    const key = k + '_cage_' + String(i).padStart(2, '0'); IMG[key] = li('assets/mon/cage/' + key + '.png');
  }
  const CAGE_DEATH = 1.49; // 失衡180ms→跪220ms→爬240ms→倒地停500ms→淡出350ms
  function cagePose(e) {
    if (e.dead) {
      const t = now() - e.cageDownAt;
      return t < .18 ? 10 : t < .40 ? 11 : t < .64 ? 12 : 13;
    }
    if (e.act === 'hit') return 10;
    if (e.act === 'atk') return e.wind <= .08 ? 8 : e.wind > .38 ? 6 : 7;
    if (e.cageStrikeAt != null && now() < e.cageStrikeAt + .34) return now() < e.cageStrikeAt + .16 ? 8 : 9;
    if (e.act === 'walk') return [2, 3, 4, 5][Math.floor(e.t / .15) % 4];
    return Math.floor(e.t / .32) % 2;
  }
  function cageExiting(e) { return e.kind === 'cage' && e.dead && e.cageDownAt != null && now() < e.cageDownAt + CAGE_DEATH; }
  // 撒網兵：四格呼吸＋四格步行＋蹲身／取網／投網／伸展／收招；原十格稿保留受擊與倒地。
  for (let i = 0; i < 15; i++) for (const k of ['s', 'f', 'g']) {
    const key = k + '_net_' + String(i).padStart(2, '0'); IMG[key] = li('assets/mon/cage/' + key + '.png');
  }
  IMG.net_projectile = li('assets/mon/cage/net_projectile.png');
  function netPose(e) {
    if (e.dead) return 14;
    if (e.act === 'hit') return 13;
    if (e.act === 'atk') return e.wind > .38 ? 8 : e.wind > .08 ? 9 : 10;
    if (e.netStrikeAt != null && now() < e.netStrikeAt + .40) {
      const t = now() - e.netStrikeAt; return t < .08 ? 10 : t < .18 ? 11 : 12;
    }
    if (e.act === 'walk') return [4, 5, 6, 7][Math.floor(e.t / .16) % 4];
    return Math.floor(e.t / .26) % 4;
  }
  function netExiting(e) { return e.kind === 'net' && e.dead && e.netDownAt != null && now() < e.netDownAt + 1; }
  // 拖籠兵：全部20格沿用同一無甲暮紫泥身稿，空籠不混鐵甲版本。
  for (let i = 0; i < 20; i++) for (const k of ['s', 'f', 'g']) {
    const key = k + '_drag_' + String(i).padStart(2, '0'); IMG[key] = li('assets/mon/cage/' + key + '.png');
  }
  const DRAG_DEATH = 1.49;
  function dragPose(e) {
    if (e.dead) {
      const t = now() - e.dragDownAt;
      return t < .18 ? 16 : t < .40 ? 17 : t < .64 ? 18 : 19;
    }
    if (e.act === 'hit') return e.actU - now() > .125 ? 14 : 15;
    // 拉繩00→01→02；第03格扯籠在原0.7秒命中點前80ms進入。
    if (e.act === 'atk') return e.wind > .48 ? 8 : e.wind > .26 ? 9 : e.wind > .08 ? 10 : 11;
    if (e.dragStrikeAt != null && now() < e.dragStrikeAt + .40) {
      const t = now() - e.dragStrikeAt; return t < .08 ? 11 : t < .22 ? 12 : 13;
    }
    if (e.act === 'walk') return [4, 5, 6, 7][Math.floor(e.t / .16) % 4];
    return Math.floor(e.t / .26) % 4;
  }
  function dragExiting(e) { return e.kind === 'drag' && e.dead && e.dragDownAt != null && now() < e.dragDownAt + DRAG_DEATH; }
  // User-delivered 320px native frames, facing left, baseline boundary y300.
  // Timings mirror assets/mon/grum/manifest.json; walk is rebuilt from idle, not generated walk art.
  const GRUM = { idle: [4, .210], walk: [4, .160], lift: [3, .240], slam: [3, .180], recover: [3, .210], hurt: [2, .240], exit: [4, .290] };
  for (const a in GRUM) for (let i = 0; i < GRUM[a][0]; i++) for (const k of ['s', 'f', 'g']) {
    const key = k + '_grum_' + a + '_' + String(i).padStart(2, '0'); IMG[key] = li('assets/mon/grum/' + key + '.png');
  }
  let A = null;  // 這一場的狀態
  const now = () => A.t;
  const rnd = Math.random, ri = P.ri;
  const W = 2600, GY0 = 430, GY1 = 680;
  const worldW = () => (A && A.stageW) || W;
  const MON_SS = 2; // 與正式遊戲 spr() 相同：畫面倍率 SS=2、最近鄰、不平滑
  function monVis(e) {
    if (e.K && e.K.grum) return 1; // native 1x, never inherit SS=2 or elite scaling
    const shrink = (e.st && e.st.shrink && e.st.shrink.u > now()) ? e.st.shrink.s : 1;
    // 正式主軸小兵不因菁英放大（改用紅色光圈）；舊圖表王怪仍用 1.15
    if (e.K && e.K.pix) return MON_SS * shrink;
    return MON_SS * shrink * (e.elite ? 1.15 : 1);
  }
  function monHead(e) {
    if (e.K && e.K.grum) return 257;
    if (e.K && e.K.pix && PIX[e.K.pix]) {
      const p = PIX[e.K.pix];
      return (p.cy - (p.top || 0)) * monVis(e);
    }
    const m = MON[e.K && e.K.sheet];
    const ay = (m && m.anchor && m.anchor[1]) || 100;
    return ay * monVis(e);
  }
  function shadowE(ctx, sx, sy, w, h) {
    const k = Math.max(0.4, 1 - (h || 0) / 260), ww = Math.floor(w * k);
    ctx.fillStyle = 'rgba(60,24,10,0.372)';
    ctx.beginPath(); ctx.ellipse(sx, sy, ww, ww * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  }
  const ringC = {};
  function ringImg(img, col, key) {
    const k = key + col.join(','); if (ringC[k]) return ringC[k];
    if (!img || !P.art.imageOK(img)) return null;
    const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')'; x.fillRect(0, 0, c.width, c.height);
    ringC[k] = c; return c;
  }
  // 對齊 game.js spr()：translate 到腳點、drawImage 到 (cw*SS, ch*SS)，預設圖朝右則 face<0 時翻轉
  function pixSpr(ctx, img, sx, sy, meta, o) {
    if (!img || !P.art.imageOK(img)) return;
    const SS = MON_SS; o = o || {};
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.translate(Math.round(sx), Math.round(sy));
    if (o.filter) ctx.filter = o.filter;
    if (o.flip) ctx.scale(-1, 1);
    if (o.rot) { ctx.translate(0, -30 * SS); ctx.rotate(-o.rot * Math.PI / 180); ctx.translate(0, 30 * SS) }
    const dx = -meta.cx * SS, dy = -meta.cy * SS + (o.dy || 0) * SS, dw = meta.cw * SS, dh = meta.ch * SS;
    if (o.glow && o.ring) { ctx.globalAlpha *= o.glow[3] / 255; ctx.drawImage(o.ring, dx, dy, dw, dh); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha }
    ctx.drawImage(img, dx, dy, dw, dh); ctx.restore();
  }
  function golemPose(e) {
    const bow = !!(PIX[e.K.pix] && PIX[e.K.pix].bow);
    if (e.act === 'atk') return bow ? 'bdraw' : 'attack';
    if (e.act === 'hit') return bow ? 'bhit' : 'hit';
    if (e.act === 'walk') return bow ? 'bwalk' : ('walk' + (Math.floor(e.t / 0.14) % 2));
    return bow ? 'bwalk' : 'walk0';
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2);
  const TM = [0, 0.9, 1, 1.06, 1.12];

  function petInfo() {
    const S = P.S; const b = S.eq === 'xishi' ? null : P.byId(S.eq);
    if (!b || !P.unlocked(b)) return { xishi: 1, sp: 'shihtzu', tier: 2, sk: [], uses: [], ow: {}, ab: {}, sz: { spd: 1, range: 1, dmg: 1 }, sub: [], name: '西施', P: C.petAtk[2], look: 1, inh: 4 };
    const ow = {}, ab = {}; if (P.abOwner) { const o = P.abOwner(b); for (const k in o) ow[k] = o[k].v; const q = P.abPet(b); for (const k in q) ab[k] = q[k].v }
    const sz = P.size ? P.size(b) : { spd: 1, range: 1, dmg: 1 }, hy = P.HYB && P.HYB[b.sp], uses = [].concat(...(P.fightSk ? P.fightSk(b) : b.sk).map(n => (P.SK[n] && P.SK[n].use || []).map(u => u[0])));
    return { b, sp: b.sp, hyb: hy ? (hy.hyb || hy.recipe) : null, tier: b.tier, sk: P.fightSk ? P.fightSk(b) : b.sk.slice(), uses, ow, ab, sz, name: P.label(b), P: P.petAtkOf ? P.petAtkOf(b) : C.petAtk[b.tier] * P.QUAL_MUL[b.q || 1] * (b.star === 2 ? C.shinyMul : 1), star: b.star, inh: b.tier, sub: (b.sub || []).map(x => b.star === 2 ? [x[0], Math.round(x[1] * C.shinyMul * 10) / 10] : x) };
  }
  function heroStat() {
    const h = A.hero, pi = A.pi, s = { atk: 1, crit: 15, cdmg: 80, dr: 0, dodge: 0, spd: 1, gold: 0, food: 0, exp: 0, pick: 0 };
    for (const [k, v] of pi.sub) { if (k === 'atk') s.atk += v / 100; if (k === 'crit') s.crit += v; if (k === 'cdmg') s.cdmg += v; if (k === 'dr') s.dr += v; if (k === 'dodge') s.dodge += v; if (k === 'spd') s.spd += v / 100; if (k === 'gold') s.gold += v; if (k === 'food') s.food += v; if (k === 'exp') s.exp += v }
    const lv = pi.xishi ? 0 : [0, 0, 1, 2, 3][pi.tier]; // 固有：紫 1、粉 S 2、橘 SS 3
    if (lv) { const i = lv - 1; s.gold += [3, 4, 5][i] * spm('cat'); s.crit += [1.5, 2, 2.5][i] * spm('owl'); s.dodge += [1, 1.5, 2][i] * spm('rabbit'); if (h.hp < h.max / 2) s.dr += [3, 4, 5][i] * spm('bear') }
    { const ow = pi.ow || {}; s.atk += (ow.atk || 0) / 100; s.spd += (ow.spd || 0) / 100; s.dr += ow.dr || 0; s.exp += ow.exp || 0; s.gold += ow.gold || 0 }   // 主人分到的寵物能力；返魂額外力量按通常分享比例加攻擊（上限2.5%）
    const tierI = Math.max(1, pi.tier) - 1;
    if (has(64)) s.food += [3, 5, 7, 9][tierI]; if (has(67)) s.gold += [4, 6, 8, 10][tierI]; if (has(68)) s.spd += [2, 3, 4, 5][tierI] / 100; if (has(69)) s.exp += [3, 4, 6, 8][tierI];
    if (has(24)) s.pick = 300; if (has(71)) s.pick = Math.max(s.pick, 0) + [60, 90, 120, 150][tierI]; if (has(25)) s.food += 5.5;
    for (const k in h.buf) { const b = h.buf[k]; if (b.u < now()) { delete h.buf[k]; continue } s[b.k] += b.v }
    s.dr = Math.min(60, s.dr); s.dodge = Math.min(25, s.dodge); s.food = Math.min(12, s.food); s.gold = Math.min(25, s.gold);
    return s;
  }
  const has = n => A.pi.sk.includes(n) || (A.pi.uses || []).includes(n);
  // 混血：原物種的固有效果 60%；純種 100%
  const spm = sp => A.pi.sp === sp ? 1 : A.pi.hyb && A.pi.hyb.includes(sp) ? 0.6 : 0;
  function buff(id, k, v, sec, name) { A.hero.buf[id] = { k, v, u: now() + sec, name }; }
  function txt(x, y, s, col, big) { A.fx.push({ k: 'txt', x, y, s, col: col || '#fff', t: 0, life: 1.1, big }) }
  function poof(x, y) { A.fx.push({ k: 'poof', x, y, t: 0, life: 0.4 }) }
  function log(m) { P.emit('arena', m) }
  function spawn(kind, x, y, elite) {
    const K = KIND[kind], hp0 = (K.mcHp && mcOn()) ? K.mcHp : K.hp; const e = { id: ++A.nid, kind, K, x, y: y || ri(GY0, GY1), hp: hp0 * (elite ? 3 : 1), max: hp0 * (elite ? 3 : 1), elite: !!elite, face: -1, st: {}, t: rnd() * 2, act: 'walk', at: 0, wind: 0, polyN: 0, dots: [] };
    if (K.grum) { e.act = 'walk'; e.gt = 0; }
    if (kind === 'cage') for (const key in IMG) if (key.includes('_cage_')) P.art.startImage(IMG[key]);
    if (kind === 'net') for (const key in IMG) if (key.includes('_net_') || key === 'net_projectile') P.art.startImage(IMG[key]);
    if (kind === 'drag') for (const key in IMG) if (key.includes('_drag_')) P.art.startImage(IMG[key]);
    A.en.push(e); return e;
  }
  const disabled = e => { const s = e.st, t = now(); return e.poly || s.stun > t || s.sleep > t || s.dance > t || s.glue > t || s.float > t || s.slip > t || s.spin > t };
  const isBoss = e => e.K.boss;
  // 寵物傷害
  function pdmg(e, mul, why, col) {
    if (!e || e.dead) return 0; let d = A.pi.P * mul;
    if (has(23) && rnd() < 0.2) d *= 1.5;
    if (A.pet.rageU > now()) d *= 1 + (A.pi.tier >= 3 ? 0.2 : 0.15);
    if (A.pet.scaleU > now()) d *= 1.3;   // P4 #304 逆鱗
    return hit(e, d, 'pet', why, col || '#9fe0ff');
  }
  function hit(e, d, src, why, col, crit) {
    if (e.dead) return 0;
    if (e.st.vuln && e.st.vuln.u > now()) d *= 1 + e.st.vuln.v;
    if (src === 'hero' && e.st.mark) { d *= 1 + e.st.mark; e.st.mark = 0 }
    if (src === 'hero' && e.st.float > now()) { d *= 1.6; crit = 1; e.st.float = 0; txt(e.x, e.y - 120, '啵！', '#bdf') }
    if (e.st.sleep > now()) { d *= 1.2; e.st.sleep = 0; txt(e.x, e.y - 120, '醒了', '#ccc') }
    d = Math.round(d); e.hp -= d; A.dmg[src] = (A.dmg[src] || 0) + d;
    if (!mcOn()) txt(e.x + ri(-20, 20), e.y - monHead(e) - 8, (crit ? '暴擊 ' : '') + d.toLocaleString(), crit ? '#ffd54a' : (col || '#fff'), crit);
    else if (src !== 'hero') P.MC.H.dmgNum(e.x + ri(-14, 14), e.y - monHead(e) - 8, d, crit, true);   // 寵物傷害：主遊戲的「寵物」傷害數字樣式；英雄傷害數字由主遊戲 hitMob 自己畫
    if (src !== 'link' && e.st.bound && e.st.bound.u > now() && !e.st.bound.o.dead) hit(e.st.bound.o, d * 0.3, 'link', '', '#f99');
    if (e.poly && !isBoss(e) && (e.poly.perm || e.elite)) e.hp = 0;   // 變成老鼠／小豬：打 1 下就倒（菁英照血量，這裡也一下）
    e.flash = now() + 0.12;
    if (e.K.grum) {
      // Brief hurt pose has its own cooldown. Hits never cancel telegraph/impact/recovery.
      if (['idle', 'walk'].includes(e.act) && now() >= (e.hurtAt || 0)) { grumState(e, 'hurt'); e.hurtAt = now() + 2; }
    } else if (!disabled(e) && e.act !== 'atk') { e.act = 'hit'; e.actU = now() + 0.25 }
    if (e.hp <= 0) kill(e, src, crit);
    return d;
  }
  function drop(kind, x, y, n) { A.drops.push({ kind, x: x + ri(-30, 30), y: y + ri(-10, 10), n, z: 0, vz: 220, t: 0 }) }
  function petFood(n) { if (A.extra >= A.extraCap) return 0; n = Math.min(n, A.extraCap - A.extra); n = P.extraFoodOk(n); A.extra += n; return n }
  function kill(e, src, crit) {
    if (e.K.grum) { grumState(e, 'exit'); e.exitUntil = now() + GRUM.exit[0] * GRUM.exit[1]; }
    if (e.kind === 'cage') e.cageDownAt = now();
    if (e.kind === 'net') e.netDownAt = now();
    if (e.kind === 'drag') e.dragDownAt = now();
    e.dead = 1; A.kills++; poof(e.x, e.y - 40); const hs = heroStat();
    const gm = 1 + hs.gold / 100; let gold = e.K.gold * gm;
    if (e.poly && e.poly.skin === 'pig') gold *= 2;
    drop('gold', e.x, e.y, Math.round(gold)); if (!isBoss(e)) drop('gold', e.x, e.y, Math.round(gold));
    let bread = 0, guaranteed = 0;
    if (e.poly && e.poly.skin === 'mouse') { const t = A.poly.tier; let n = C.ratBread[t] || 0; if (n % 1) n = Math.floor(n) + (rnd() < n % 1 ? 1 : 0); guaranteed = petFood(n); if (guaranteed) log(`老鼠被打倒 → 必掉麵包 ${guaranteed}`) }
    if (e.poly && e.poly.skin === 'pig') { guaranteed = petFood(C.pigBread[A.poly.tier] || 2); if (guaranteed) log(`小豬被打倒 → 必掉麵包 ${guaranteed}（金幣 ×2）`) }
    if (guaranteed) bread = guaranteed; else if (!isBoss(e) && rnd() * 100 < C.foodDrop + hs.food) bread = 1;
    for (let i = 0; i < bread; i++) drop('bread', e.x, e.y, 1);
    if (has(54) && crit && src === 'hero' && !isBoss(e) && rnd() < 0.2) { for (let i = 0; i < 8; i++) drop('gold', e.x, e.y, Math.round(e.K.gold)); txt(e.x, e.y - 140, '招財大爆擊！', '#ffd54a', 1); log('#54 招財大爆擊：金幣雨') }
    if (has(66) && e.elite && rnd() < [0.03, 0.04, 0.05, 0.06][Math.max(1, A.pi.tier) - 1]) { P.S.shards++; txt(e.x, e.y - 150, '+1 刻印碎片', '#9cf'); log('#66 刻印感應：+1 刻印碎片') }
    if (isBoss(e)) log('王被打倒了！');
  }
  // ---------- 技能 ----------
  function nearest(x, y, f, max) { let b = null, bd = max || 1e9; for (const e of A.en) { if (e.dead || (f && !f(e))) continue; const d = Math.hypot(e.x - x, (e.y - y) * 2); if (d < bd) { bd = d; b = e } } return b }
  function inRange(x, y, r, f) { return A.en.filter(e => !e.dead && Math.hypot(e.x - x, (e.y - y) * 2) < r && (!f || f(e))) }
  function bossCtrl(e) { if (!isBoss(e)) return true; if (A.bossCtrlU > now()) { txt(e.x, e.y - 220, '（共用冷卻中，只有動畫）', '#aaa'); return false } A.bossCtrlU = now() + C.bossCtrlShare; return true }
  function polymorph(e, skin) {
    const tier = A.pi.tier;
    if (isBoss(e)) {
      const max = tier >= 4 ? 2 : 1; if (e.polyN >= max) return false; if (!bossCtrl(e)) return false;
      const sec = e.polyN === 1 ? 3 : 5; if (e.act === 'atk') { e.pendPoly = { skin, sec }; log(`王要先把這招打完才變身`); e.polyN++; return true }
      e.polyN++; e.poly = { skin, u: now() + sec }; poof(e.x, e.y - 60); log(`王變成${skin === 'pig' ? '小豬' : '老鼠'} ${sec} 秒`);
      if (!A.bossFood) { A.bossFood = 1; const n = petFood(skin === 'pig' && tier >= 4 ? 2 : 1); for (let i = 0; i < n; i++) drop('bread', e.x, e.y, 1) }
      return true;
    }
    const perm = !e.elite; e.poly = { skin, u: perm ? Infinity : now() + (skin === 'pig' ? 8 : 6), perm }; e.st = {}; poof(e.x, e.y - 40);
    A.polyList.push(e); A.polyList = A.polyList.filter(x => x.poly && !x.dead);
    while (A.polyList.length > C.transformMax) { const o = A.polyList.shift(); o.poly = null; poof(o.x, o.y - 40); txt(o.x, o.y - 100, '變回來了', '#ccc') }
    txt(e.x, e.y - 90, skin === 'pig' ? '哼哼！' : '吱！', '#ffd'); return true;
  }
  const SKF = {
    1: e => { pdmg(e, .5, '火焰'); e.dots.push({ u: now() + 5, dps: A.pi.P * .9 / 5, c: '#f84' }) },
    2: e => { pdmg(e, .5, '冰'); e.st.slow = { u: now() + 2, v: isBoss(e) ? .1 : .2 }; e.dots.push({ u: now() + 5, dps: A.pi.P * .6 / 5, c: '#8cf' }) },
    3: e => { pdmg(e, .5, '雷'); e.dots.push({ u: now() + 5, dps: A.pi.P * .6 / 5, c: '#ff6' }) },
    4: e => { pdmg(e, .5, '獠牙'); e.dots.push({ u: now() + 5, dps: A.pi.P * .9 / 5, c: '#f66' }) },
    5: e => { pdmg(e, .4, '毒'); if (e.dots.filter(d => d.c === '#9f6' && d.u > now()).length < 3) e.dots.push({ u: now() + 5, dps: A.pi.P * .4 / 5, c: '#9f6' }) },
    6: e => { pdmg(e, .5, '陰影'); if (isBoss(e)) e.st.atkDown = { u: now() + 3, v: .03 }; else e.st.fear = now() + .8 },
    7: e => { pdmg(e, .5, '光'); e.st.mark = .15; txt(e.x, e.y - 130, '審判', '#ffe') },
  };
  function shoot(e, n, fx) { A.pr.push({ x: A.pet.x, y: A.pet.y - 30, tx: e, sp: 700, from: 'pet', on: fx, c: n === 9 ? '#c9f' : '#ffb347', life: 2 }) }
  const SKILL = {
    // 元素 1～7
    elem: { trig: () => nearest(A.pet.x, A.pet.y, null, 600), run: (n, e) => shoot(e, n, e2 => SKF[n](e2)) },
    8: { trig: () => nearest(A.pet.x, A.pet.y, null, 400), run: (n, e) => { A.pet.x = e.x - 50 * Math.sign(e.x - A.pet.x || 1); A.pet.y = e.y; pdmg(e, .8, '突擊'); if (!isBoss(e)) e.x += 80 * Math.sign(e.x - A.hero.x || 1) } },
    9: { trig: () => nearest(A.pet.x, A.pet.y, null, 700), run: (n, e) => shoot(e, n, e2 => pdmg(e2, 1.3, '飛彈')) },
    10: { trig: () => nearest(A.pet.x, A.pet.y, null, 700), run: () => { inRange(A.pet.x, A.pet.y, 700).slice(0, 3).forEach(e => { for (let i = 0; i < 3; i++) setTimeout(() => A && shoot(e, 9, e2 => pdmg(e2, .3, '連結飛彈')), i * 150) }) } },
    11: { trig: fighting, run: () => buff(11, 'atk', .03, 8, '有力的應援') }, 12: { trig: fighting, run: () => buff(12, 'atk', .02, 8, '聰明的應援') },
    13: { trig: fighting, run: () => buff(13, 'crit', 3, 8, '暴擊的祝福') }, 14: { trig: fighting, run: () => buff(14, 'cdmg', 8, 8, '到位的應援') },
    15: { trig: fighting, run: () => buff(15, 'dr', 4, 8, '傷害減少的祝福') }, 16: { trig: fighting, run: () => buff(16, 'dodge', 3, 8, '要害迴避的祝福') },
    17: { trig: fighting, run: () => buff(17, 'crit', 1, 8, '追擊的祝福') }, 18: { trig: fighting, run: () => buff(18, 'atk', .02, 8, '連擊強化的祝福') },
    19: { trig: fighting, run: () => { A.ult = Math.min(100, A.ult + 4); txt(A.hero.x, A.hero.y - 170, '絕招量表 +4%', '#fc6') } },
    20: { trig: () => nearest(A.pet.x, A.pet.y, null, 500), run: (n, e) => { e.st.atkDown = { u: now() + 4, v: isBoss(e) ? .05 : .08 }; txt(e.x, e.y - 120, '攻擊↓', '#c9f') } },
    21: { trig: () => nearest(A.pet.x, A.pet.y, null, 500), run: (n, e) => { e.st.vuln = { u: now() + 4, v: isBoss(e) ? .04 : .06 }; txt(e.x, e.y - 120, '防禦↓', '#c9f') } },
    25: { trig: () => rnd() < .15, cd: 30, run: () => { drop('bread', A.pet.x, A.pet.y, 1); txt(A.pet.x, A.pet.y - 70, '挖到麵包！', '#ffd') } },
    27: { trig: () => inRange(A.pet.x, A.pet.y, 400, e => !isBoss(e)).length >= 2, run: () => { inRange(A.pet.x, A.pet.y, 400, e => !isBoss(e)).forEach(e => e.st.taunt = now() + 3); txt(A.pet.x, A.pet.y - 80, '汪汪！來追我啊', '#fff') } },
    29: { trig: () => fighting() && !A.hero.shield, run: () => { A.hero.shield = { v: A.hero.max * .25, u: now() + 6 }; txt(A.hero.x, A.hero.y - 170, '守護泡泡', '#bdf') } },
    30: { trig: () => A.hero.hp <= A.hero.max * .3 && !A.used30, cd: 0, run: () => { A.used30 = 1; A.hero.regen = { u: now() + 5, v: A.hero.max * .2 * (A.pi.sp === 'shihtzu' ? 1.25 : 1) / 5 }; txt(A.hero.x, A.hero.y - 170, '西施跑來放小泡泡！', '#ffd') } },
    32: { trig: () => nearest(A.pet.x, A.pet.y, e => !e.poly, 400), run: (n, e) => { const t = inRange(A.pet.x, A.pet.y, 400, x => !x.poly).sort((a, b) => b.hp - a.hp)[0] || e; polymorph(t, 'mouse') } },
    33: { trig: () => inRange(A.pet.x, A.pet.y, 300).length >= 2 || A.hero.hp < A.hero.max / 2 && nearest(A.pet.x, A.pet.y, null, 300), run: () => { const e = nearest(A.pet.x, A.pet.y, null, 400); if (!e) return; A.zones.push({ k: 'glue', x: e.x, y: e.y, r: 140, u: now() + 4 }); inRange(e.x, e.y, 140).forEach(x => { if (isBoss(x)) { if (bossCtrl(x)) x.st.slow = { u: now() + 1.5, v: .4 } } else if (x.elite) { x.st.glue = now() + 1.5; x.st.slow = { u: now() + 3.5, v: .3 } } else x.st.glue = now() + 3 }) } },
    34: { trig: () => front(260).length >= 2, run: () => { front(260).forEach(e => { if (isBoss(e)) { if (bossCtrl(e)) { e.st.atkDown = { u: now() + 3, v: .03 }; txt(e.x, e.y - 220, '（點頭打拍子）', '#fc9') } } else e.st.dance = now() + (e.elite ? 1.2 : 2.5) }); txt(A.pet.x, A.pet.y - 80, '♪ 一起跳舞吧 ♪', '#fc9') } },
    35: { trig: () => A.en.some(e => !e.dead && e.K.ranged), run: () => { const r = A.en.filter(e => !e.dead && e.K.ranged).sort((a, b) => Math.abs(b.x - A.hero.x) - Math.abs(a.x - A.hero.x))[0]; if (!r) return; const px = A.pet.x, py = A.pet.y; A.pet.x = r.x; A.pet.y = r.y; r.x = A.hero.x + 90 * A.hero.face; r.y = A.hero.y; r.st.stun = now() + .8; poof(px, py); poof(r.x, r.y) } },
    36: { trig: fighting, run: () => { for (let i = 0; i < 3; i++) A.zones.push({ k: 'banana', x: A.pet.x + A.hero.face * (100 + i * 70), y: A.pet.y + ri(-30, 30), r: 30, u: now() + 6 }) } },
    37: { trig: () => nearest(A.pet.x, A.pet.y, e => !e.st.shaken, 400), run: (n, e) => { if (isBoss(e)) { if ((A.boss37 || 0) >= 4) return; A.boss37 = (A.boss37 || 0) + 1; drop('gold', e.x, e.y, 150); return } e.st.shaken = 1; drop('gold', e.x, e.y, Math.round(e.K.gold * .3)); if (rnd() < .25) { const k = petFood(1); if (k) drop('bread', e.x, e.y, 1) } txt(e.x, e.y - 110, '抖抖！', '#ffd') } },
    38: { trig: () => pair200(), run: () => { const [a, b] = pair200() || []; if (!a) return; a.st.bound = { o: b, u: now() + 5 }; b.st.bound = { o: a, u: now() + 5 }; a.st.slow = b.st.slow = { u: now() + 5, v: .5 } } },
    39: { trig: () => nearest(A.pet.x, A.pet.y, null, 450), run: (n, e) => { if (isBoss(e)) { if (bossCtrl(e)) { e.st.shrink = { u: now() + 3, s: .9 }; e.st.atkDown = { u: now() + 3, v: .04 } } return } e.st.shrink = { u: now() + 6, s: e.elite ? .75 : .6 }; e.st.atkDown = { u: now() + 6, v: e.elite ? .15 : .3 } } },
    40: { trig: () => front(320).length >= 3, run: () => { front(320).forEach(e => { if (isBoss(e)) { if (bossCtrl(e)) e.st.atkDown = { u: now() + 3, v: .03 } } else e.st.sleep = now() + (e.elite ? 2 : 4) }) } },
    42: { trig: () => inRange(A.hero.x, A.hero.y, 150).length >= 3 || (inRange(A.hero.x, A.hero.y, 250).length >= 2 && rnd() < .02), run: () => { A.en.forEach(e => { if (e.dead) return; if (isBoss(e)) { txt(e.x, e.y - 220, '（毛被吹亂了）', '#ccc'); return } e.x += Math.sign(e.x - A.hero.x || 1) * (e.elite ? 100 : 220); e.st.spin = now() + 1 }); txt(A.pet.x, A.pet.y - 80, '超大聲汪！', '#fff', 1) } },
    43: { trig: () => A.hero.hp < A.hero.max * .4 && inRange(A.hero.x, A.hero.y, 300).length >= 3, run: () => { A.hero.hidden = now() + 1.5; txt(A.hero.x, A.hero.y - 170, '躲貓貓', '#fc9') } },
    44: { trig: () => nearest(A.pet.x, A.pet.y, e => !e.poly, 450), run: () => { const t = inRange(A.pet.x, A.pet.y, 450, x => !x.poly).sort((a, b) => b.hp - a.hp)[0]; if (t) polymorph(t, 'pig') } },
    45: { trig: () => nearest(A.pet.x, A.pet.y, null, 450), run: () => { const e = inRange(A.pet.x, A.pet.y, 450).sort((a, b) => b.elite - a.elite)[0]; if (!e) return; if (isBoss(e)) { e.st.mark = .15; txt(e.x, e.y - 220, '小泡泡', '#bdf'); return } e.st.float = now() + 4 } },
    46: { trig: () => A.en.filter(e => !e.dead).length >= 3, run: () => { const e = nearest(A.pet.x, A.pet.y, x => !x.elite && !isBoss(x) && !x.poly, 500); const ex = () => { const t = nearest(A.pet.x, A.pet.y, null, 600); if (!t) return; inRange(t.x, t.y, 150).forEach(x => { pdmg(x, isBoss(x) ? 1 : 2, '咕咕雞'); if (!isBoss(x)) x.st.stun = now() + .6 }); poof(t.x, t.y) }; if (!e) return ex(); e.poly = { skin: 'chick', u: now() + 2, perm: 0 }; e.chick = 1; setTimeout(() => { if (!A || e.dead) return; const g = A.en.filter(x => !x.dead && x !== e).sort((a, b) => dist(a, e) - dist(b, e))[0]; if (g) { e.x = g.x; e.y = g.y } inRange(e.x, e.y, 150).forEach(x => { if (x !== e) { pdmg(x, isBoss(x) ? 1 : 2, '咕咕雞'); if (!isBoss(x)) x.st.stun = now() + .6 } }); poof(e.x, e.y); txt(e.x, e.y - 80, '咕咕—碰！', '#fc6', 1); e.hp = 0; e.dead = 1; A.kills++ }, 2000) } },
    47: { trig: () => A.en.filter(e => !e.dead && !isBoss(e)).length >= 3, run: () => { const x = A.hero.x + A.hero.face * 220, y = A.hero.y; A.zones.push({ k: 'bone', x, y, r: 20, u: now() + 3 }); A.en.forEach(e => { if (!e.dead && !isBoss(e)) e.st.lure = { x, y, u: now() + 3 } }) } },
    48: { trig: () => nearest(A.pet.x, A.pet.y, null, 450), run: (n, e) => { if (isBoss(e)) { e.st.atkDown = { u: now() + 4, v: .04 }; buff(48, 'atk', .03, 4, '順手牽羊') } else if (e.elite) buff(48, 'atk', .05, 8, '順手牽羊'); else drop('gold', e.x, e.y, 1); txt(e.x, e.y - 120, '?', '#fff', 1) } },
    49: { trig: () => nearest(A.pet.x, A.pet.y, null, 500), run: (n, e) => { pdmg(e, 1.2, '平底鍋'); if (!isBoss(e)) e.st.stun = now() + (e.elite ? .8 : 2); A.fx.push({ k: 'pan', x: e.x, y: e.y - monHead(e), t: 0, life: .6 }); txt(e.x, e.y - monHead(e) - 20, '噹！', '#fff', 1) } },
    50: { trig: () => front(900).length >= 2, run: () => { A.pr.push({ x: A.pet.x, y: A.pet.y - 20, vx: 600 * A.hero.face, from: 'pet', snow: 1, r: 24, life: 2.2, hitIds: {} }) } },
    51: { trig: () => A.en.filter(e => !e.dead && !isBoss(e)).length >= 4, run: () => { A.pet.giantU = now() + 6; A.pet.stompT = 0 } },
    52: { trig: () => A.bento < 2, cd: 60, run: () => { if (rnd() < .4) { A.bento++; const k = petFood(1); if (k) { addFood(1, true); txt(A.hero.x, A.hero.y - 170, '加油便當！叼來麵包', '#ffd') } } } },
    53: { trig: () => nearest(A.pet.x, A.pet.y, null, 600), run: () => { const el = A.pi.sk.filter(n => n <= 7); for (let k = 0; k < 2; k++) el.forEach(n => { const e = nearest(A.pet.x, A.pet.y, null, 600); if (e) { const o = A.pi.P; A.pi.P = o * .4; SKF[n](e); A.pi.P = o } }); txt(A.pet.x, A.pet.y - 80, '狐火分身', '#fa6') } },
    55: { trig: () => A.hero.hp <= A.hero.max / 2 && !A.hero.shield, run: () => { A.hero.shield = { v: A.hero.max * (A.pi.tier >= 3 ? .15 : .1), u: now() + 8 }; txt(A.hero.x, A.hero.y - 170, '小小守護者', '#bdf') } },
    56: { trig: fighting, run: () => buff(56, 'atk', A.pi.tier >= 3 ? .08 : .06, 5, '疾風的振翅') },
    63: { trig: () => nearest(A.pet.x, A.pet.y, null, 500), run: (n, e) => { e.st.slow = { u: now() + 4, v: isBoss(e) ? .08 : (A.pi.tier >= 3 ? .2 : .15) } } },
  };
  function fighting() { return A.en.some(e => !e.dead && Math.abs(e.x - A.hero.x) < 600) }
  function front(r) { return A.en.filter(e => !e.dead && (e.x - A.pet.x) * A.hero.face > -40 && Math.abs(e.x - A.pet.x) < r && Math.abs(e.y - A.pet.y) < 120) }
  function pair200() { const l = A.en.filter(e => !e.dead && !isBoss(e) && !(e.st.bound && e.st.bound.u > now())); for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) if (dist(l[i], l[j]) < 200) return [l[i], l[j]]; return null }
  function cdOf(n) { const s = P.SK[n]; let red = (has(22) ? .15 : 0) + (A.pi.sub.find(x => x[0] === 'pcd') || [0, 0])[1] / 100 + ((A.pi.ab || {}).pcd || 0) / 100; red = Math.min(.3, red); return (SKILL[n] && SKILL[n].cd != null ? SKILL[n].cd : s.cd) * (1 - red) * C.skillCdMul }
  function useSkills() {
    for (const n of A.pi.sk) {
      const s = P.SK[n]; if ((A.cd[n] || 0) > now()) continue;
      // P4 #301 迴聲吠：打架時吠一聲，寵物下一個技能放 2 次（第 2 次 50%）
      if (n === 301) { if (!fighting() || A.echo) continue; A.echo = 1; A.cd[n] = now() + Math.max(1, cdOf(n)); A.used[n] = (A.used[n] || 0) + 1; A.pet.cast = now() + .5; txt(A.pet.x, A.pet.y - 95, s.name, '#ffe6a0'); log(`#301 迴聲吠：下一招放 2 次`); continue }
      if (n === 302 || n === 303 || n === 304) continue;   // 被動：在別的地方算
      // 進化／混合／混血專屬／突變技能：用 use 指到原本技能的效果，再乘倍率
      const parts = s.use ? s.use.filter(u => u[0] <= 7 || SKILL[u[0]]) : [[n, 1]]; if (!parts.length) continue;
      const def0 = parts[0][0] <= 7 ? SKILL.elem : SKILL[parts[0][0]]; if (!def0) continue;
      const tg = def0.trig(); if (!tg) { continue }
      const cast = m2 => { for (const [bn, mul] of parts) { const def = bn <= 7 ? SKILL.elem : SKILL[bn]; if (!def) continue; const P0 = A.pi.P, n0 = A.pr.length; A.pi.P = P0 * mul * m2; try { def.run(bn, tg && tg.hp != null ? tg : nearest(A.pet.x, A.pet.y, null, 700)) } finally { A.pi.P = P0 } for (let i = n0; i < A.pr.length; i++) A.pr[i].mul = mul * m2 } };
      cast(1); if (A.echo) { A.echo = 0; cast(0.5); A.echoN = (A.echoN || 0) + 1; txt(A.pet.x, A.pet.y - 120, '迴聲！', '#bdf'); log(`#301 迴聲：${s.name} 再放一次（50%）`) }
      A.cd[n] = now() + Math.max(1, cdOf(n));
      A.used[n] = (A.used[n] || 0) + 1; A.pet.cast = now() + .5; txt(A.pet.x, A.pet.y - 95, s.name, '#ffe6a0'); log(`#${n} ${s.name}`);
    }
  }
  function addFood(n, fromPet) {
    for (let i = 0; i < n; i++) {
      if (A.food < C.foodSlot) { A.food++; txt(A.hero.x, A.hero.y - 160, `食物槽 ${A.food}/${C.foodSlot}`, '#ffd') }
      else { P.S.bread = Math.min(999, P.S.bread + 1); A.bread++; txt(A.hero.x, A.hero.y - 160, '+1 剩食麵包（存起來了）', '#ffd') }
    }
  }
  // ---------- 場景 ----------
  SC.arena = {
    hudOnly: 1,
    enter(o) {
      const mode = (o && o.mode) || 'normal';
      A = { mode, t: 0, nid: 0, en: [], pr: [], drops: [], zones: [], fx: [], cages: [], cd: {}, used: {}, dmg: {}, kills: 0, gold: 0, bread: 0, food: 0, extra: 0, bento: 0, ult: 0, wave: 0, polyList: [], bossCtrlU: 0, auto: matchMedia('(pointer:coarse)').matches ? 1 : 0, cam: 0 };
      A.pi = petInfo(); A.poly = { tier: A.pi.tier };
      A.extraCap = C.petFoodCapFight;
      // 主角：玩家選的主遊戲角色，HP／攻擊＝主遊戲同款計算（P.RHERO）；寵物「主人分享」HP% 仍疊在上面（寵物系統效果）。
      const RH = P.RHERO ? P.RHERO.current() : { id: 'kudas', name: '苦達斯', hp: 4125, atk: 2815, src: 'fallback' }, HH = HART[RH.id] || HART.kudas;
      A.heroInfo = RH; heroFrames(HH).forEach(f => P.art.startImage(IMG['hero_' + f])); P.art.startImage(IMG['por_' + RH.id]);
      const hpMax = Math.round(RH.hp * (1 + ((A.pi.ow || {}).hp || 0) / 100)); A.hero = { id: RH.id, name: RH.name, H: HH, atkBase: RH.atk, x: 200, y: 560, hp: hpMax, max: hpMax, face: 1, atk: 0, swing: 0, inv: 0, buf: {}, hidden: 0, slowU: 0, stunU: 0, hurtT: -9 };
      A.pet = { x: 140, y: 580, t: 0, face: 1, atkT: 2, cast: 0, hurt: 0, giantU: 0 };
      A.quest = mode === 'rescue' ? P.QU[(o && o.quest) || 'r1'] : null;
      if (A.quest) P.questCages(A.quest).forEach((c, i) => A.cages.push({ x: 520 + i * 200, y: 470 + (i % 3) * 70, hp: 3, sp: c.sp, tier: c.tier, star: c.star }));
      if (P.rescueStagePrepare) P.rescueStagePrepare(A);
      mcEnter(RH);
      A.waves = A.quest ? A.quest.waves.map(w => w.slice()) : mode === 'boss' ? [['minion', 'minion', 'archer', 'axe'], ['boss', 'minion', 'minion']] : [['minion', 'minion', 'minion', 'archer'], ['axe', 'minion', 'archer', 'minion', 'minion'], ['axe', 'axe!', 'archer', 'minion', 'minion', 'minion']];
      // Warm native boss frames before combat, avoiding first-use blank poses.
      if (mode === 'boss' || (A.quest && A.quest.id === 'r4')) for (const key in IMG) if (key.includes('_grum_')) P.art.startImage(IMG[key]);
      if (o && o.startWave) A.wave = Math.max(0, Math.min(A.waves.length - 1, o.startWave | 0));   // DEV：直接從某一波開始（本機 格魯姆 測試用）
      nextWave();
      UI.bar([['🏳️ 回收容所', () => end(false), 'bad'], ['🤖 自動戰鬥', () => { A.auto ^= 1; if (!A.auto) mcAutoRelease(); UI.toast(A.auto ? '自動戰鬥：開' : '自動戰鬥：關') }], [P.aidLabel ? P.aidLabel(0, C.foodSlot) : '🍞 叫援助', () => { if (A.food >= C.foodSlot) { A.food = 0; A.hero.hp = Math.min(A.hero.max, A.hero.hp + A.hero.max * .3); txt(A.hero.x, A.hero.y - 170, '援助角色來了！', '#ffd', 1) } else UI.toast('食物槽還沒滿') }]]);
      document.querySelector('#pad').classList.toggle('hide', !matchMedia('(pointer:coarse)').matches);
      log(`進入測試場（${mode}），出戰：${A.hero.name}（HP ${A.hero.max}、攻擊 ${A.hero.atkBase}），同行：${A.pi.name}（${P.TIER_NAME[A.pi.tier]}），技能：${A.pi.sk.map(n => P.SK[n].name).join('、') || '無'}`);
      P.arena = A;
    },
    leave() { document.querySelector('#pad').classList.add('hide'); mcLeave(); P.arena = null },
    update(dt) {
      if (!A) return;
      if (A.mc && !A.mc.ready) { A.mc.wait += dt; return }   // 主遊戲戰鬥模組還在載入
      if (mcOn() && P.MC.H.paused()) return;                  // 主遊戲暫停選單開著：整場一起停
      if (A.over) { A.overT -= dt; if (A.overT <= 0 && !A.left) { A.left = 1; P.go('shelter') } return } A.t += dt; step(dt) },
    draw(ctx) { if (!A) return; if (mcOn()) mcRender(); else if (A.mc) mcLoading(ctx); else render(ctx) },
    tap(x, y) { },
    key(c) { if (A && A.mc) return; if (c === 'KeyJ' || c === 'Space' || c === 'KeyZ') attack() },
    hud() { if (!A) return ''; const h = A.hero; { const bt = [...document.querySelectorAll('#bar button')].find(x => /叫援助/.test(x.textContent)); if (bt && P.aidLabel) { const t = P.aidLabel(A.food, C.foodSlot); if (bt.textContent !== t) bt.textContent = t; bt.style.opacity = A.food >= C.foodSlot ? 1 : .5; bt.classList.toggle('ready', A.food >= C.foodSlot) } } return `<span>❤️ ${Math.max(0, Math.round(h.hp))}/${h.max}</span><span>🍽️ 食物槽 ${A.food}/${C.foodSlot}</span><span>🍞 這場 +${A.bread}（寵物額外 ${A.extra}/${A.extraCap}）</span><span>⚔️ 第 ${A.wave}/${A.waves.length} 波｜擊倒 ${A.kills}</span><span>🐾 ${UI.esc(A.pi.name)}</span>` },
  };
  function nextWave() {
    const w = A.waves[A.wave]; if (!w) return false; A.wave++;
    const world = worldW();
    const bx = A.mode === 'rescue' ? (A.stageW ? Math.min(world - 160, 820 + A.wave * 80) : 500 + A.wave * 600) : A.hero.x + 500;
    w.forEach((k, i) => { const el = k.endsWith('!'); spawn(el ? k.slice(0, -1) : k, Math.min(world - 80, bx + i * 70 + ri(0, 60)), null, el) });
    txt(A.hero.x, A.hero.y - 200, `第 ${A.wave} 波`, '#fff', 1); return true;
  }
  function attack() { const h = A.hero; if (h.swing > 0 || h.down || heroStunned(h)) return; h.swing = h.H.dur; h.hitDone = 0 }
  function stickVec() { return P.stick || { x: 0, y: 0 } }
  function step(dt) {
    const h = A.hero, pet = A.pet, hs = heroStat(), K = P.keys;
    if (mcOn()) mcHeroStep(dt, hs); else {
    // 主角移動
    let mx = (K.ArrowRight || K.KeyD ? 1 : 0) - (K.ArrowLeft || K.KeyA ? 1 : 0), my = (K.ArrowDown || K.KeyS ? 1 : 0) - (K.ArrowUp || K.KeyW ? 1 : 0);
    const sv = stickVec(); if (sv.x || sv.y) { mx = sv.x; my = sv.y }
    if (P.stickAtk) attack();
    if (A.auto && !mx && !my) {
      const tgt = A.cages.find(c => c.hp > 0 && Math.abs(c.x - h.x) < 900 && !A.en.some(e => !e.dead && Math.abs(e.x - h.x) < 500)) || nearest(h.x, h.y, e => !(e.poly && isBoss(e)) || 1, 2000);
      if (tgt) { const dx = tgt.x - h.x - (tgt.hp != null && tgt.K ? 0 : 0), dy = tgt.y - h.y, rr = h.H.ranged && tgt.K ? 520 : 90; if (Math.abs(dx) > rr || Math.abs(dy) > 25) { mx = Math.sign(dx) * (Math.abs(dx) > rr ? 1 : 0); my = Math.sign(dy) * (Math.abs(dy) > 25 ? 1 : 0) } else { h.face = Math.sign(dx) || h.face; attack() } }
      else if (A.mode === 'rescue' && A.cages.some(c => c.hp > 0)) mx = 1;
    }
    if (heroStunned(h)) { mx = 0; my = 0 }
    if (h.swing <= 0 && !h.down) { const sp = 260 * hs.spd * (heroSlowed(h) ? HERO_SLOW_MUL : 1); h.x += mx * sp * dt; h.y += my * sp * .6 * dt; if (mx) h.face = Math.sign(mx) }
    h.x = Math.max(40, Math.min(worldW() - 40, h.x)); h.y = Math.max(GY0, Math.min(GY1, h.y)); h.moving = !!(mx || my);
    if (h.swing > 0) { h.swing -= dt; if (h.swing < h.H.hitLeft && !h.hitDone) { h.hitDone = 1; heroHit(hs) } }
    if (h.regen && h.regen.u > now()) h.hp = Math.min(h.max, h.hp + h.regen.v * dt);
    if (h.shield && h.shield.u < now()) h.shield = null;
    A.cam += ((h.x - 640) - A.cam) * Math.min(1, dt * 5); A.cam = Math.max(0, Math.min(worldW() - 1280, A.cam));
    }
    // 西施／小泡泡（固有）
    const inhLv = A.pi.xishi ? 4 : spm('shihtzu') ? A.pi.tier : 0, inhM = A.pi.xishi ? 1 : spm('shihtzu');
    if (inhLv >= 2 && h.hp <= h.max / 2 && (A.inhCd || 0) < now()) { const v = A.pi.xishi ? .5 : [0, 0, .3, .4, .5][inhLv] * inhM; A.inhCd = now() + (A.pi.xishi ? 30 : [0, 0, 40, 35, 30][inhLv]); h.regen = { u: now() + 10, v: h.max * v / 10 }; txt(pet.x, pet.y - 90, '小泡泡', '#bdf', 1); log(`固有 小泡泡：10 秒回 ${v * 100}% HP`) }
    if (spm('wolf') && A.pi.tier >= 2 && (A.howl || 0) < now()) { A.howl = now() + 20; buff('howl', 'atk', [0, 0, .03, .04, .05][A.pi.tier] * spm('wolf'), 6, '狼嚎') }
    // 寵物
    pet.t += dt; const giant = pet.giantU > now();
    const fx = h.x - 90 * h.face, fy = h.y + 20; const dx = fx - pet.x, dy = fy - pet.y, dd = Math.hypot(dx, dy);
    if (has(303) && dd > 30 && (A.starT || 0) < now()) { A.starT = now() + .35; A.zones.push({ k: 'star', x: pet.x, y: pet.y, r: 46, u: now() + 2.5 }) }
    if (dd > 30) { const v = Math.min(dd * 3, 340 * (A.pi.sz ? A.pi.sz.spd : 1) * (1 + ((A.pi.ab || {}).pspd || 0) / 100)); pet.x += dx / dd * v * dt; pet.y += dy / dd * v * dt; pet.face = Math.sign(dx) || pet.face; pet.moving = v > 120 ? 'run' : 'walk' } else pet.moving = 0;
    pet.atkT -= dt;
    if (pet.atkT <= 0) { const e = nearest(pet.x, pet.y, null, 650 * (A.pi.sz ? A.pi.sz.range : 1)); if (e) { pet.atkT = C.petAtkInterval; pet.cast = now() + .4; A.pr.push({ x: pet.x, y: pet.y - 30, tx: e, sp: 600, from: 'pet', c: '#ff9a3c', life: 2, on: e2 => { pdmg(e2, 1, '普攻', '#ffcf8a'); if (spm('fox') && A.pi.tier >= 2) e2.dots.push({ u: now() + 5, dps: A.pi.P * [0, 0, .2, .25, .3][A.pi.tier] * spm('fox') / 5, c: '#f84' }) } }) } else pet.atkT = .5 }
    if (giant) { pet.stompT -= dt; if (pet.stompT <= 0) { pet.stompT = 2; inRange(pet.x, pet.y, 260).forEach(e => { pdmg(e, .6, '巨大化踩地'); if (!isBoss(e)) e.st.stun = now() + .5 }) } }
    useSkills();
    // 小怪
    for (const e of A.en) {
      if (e.dead) continue; e.t += dt;
      if (e.K.grum) { grumStep(e, dt); continue; }
      if (e.mcR) { e.act = 'hit'; continue }   // 被主遊戲招式打飛／打倒／硬直中：由主遊戲的反應物理控制位置
      if (e.poly && e.poly.u < now()) { e.poly = null; poof(e.x, e.y - 40); if (e.chick) continue }
      if (e.pendPoly && e.act !== 'atk') { e.poly = { skin: e.pendPoly.skin, u: now() + e.pendPoly.sec }; poof(e.x, e.y - 60); e.pendPoly = null }
      for (const d of e.dots) if (d.u > now()) { d.acc = (d.acc || 0) + d.dps * dt; if (d.acc > 300) { const v = d.acc; d.acc = 0; hit(e, v, 'pet', '', d.c) } } e.dots = e.dots.filter(d => d.u > now()); if (e.dead) continue;
      let spd = e.K.spd * (e.st.slow && e.st.slow.u > now() ? 1 - e.st.slow.v : 1);
      if (e.poly) { e.wx = e.wx || e.x; if (!e.ptgt || rnd() < dt * .8) e.ptgt = { x: e.x + ri(-200, 200), y: ri(GY0, GY1) }; mv(e, e.ptgt.x, e.ptgt.y, 140 * dt); continue }
      if (disabled(e)) { e.act = 'idle'; if (e.wind) e.wind = 0; continue }
      if (e.act === 'hit' && e.actU > now()) continue;
      if (e.kind === 'cage' && e.cageStrikeAt != null && now() < e.cageStrikeAt + .34) { e.act = 'idle'; continue; }
      if (e.kind === 'net' && e.netStrikeAt != null && now() < e.netStrikeAt + .40) { e.act = 'idle'; continue; }
      if (e.kind === 'drag' && e.dragStrikeAt != null && now() < e.dragStrikeAt + .40) { e.act = 'idle'; continue; }
      for (const z of A.zones) if (z.k === 'star' && z.u > now() && Math.hypot(z.x - e.x, (z.y - e.y) * 2) < z.r) { if (!(e.st.slow && e.st.slow.u > now() && e.st.slow.v > (isBoss(e) ? .05 : .15))) e.st.slow = { u: now() + 2, v: isBoss(e) ? .05 : .15 }; if (!z.hit) { z.hit = 1; A.starHits = (A.starHits || 0) + 1 } }
      for (const z of A.zones) if (z.k === 'banana' && z.u > now() && Math.hypot(z.x - e.x, z.y - e.y) < 40 && !z.used) { z.used = 1; if (isBoss(e)) txt(e.x, e.y - 220, '差點滑倒', '#ffd'); else { e.st.slip = now() + (e.elite ? .6 : 1.2); txt(e.x, e.y - 100, '滑倒！', '#ffd') } }
      if (e.st.fear > now()) { mv(e, e.x + Math.sign(e.x - h.x || 1) * 100, e.y, spd * 1.5 * dt); continue }
      if (e.st.lure && e.st.lure.u > now()) { mv(e, e.st.lure.x + ri(-30, 30), e.st.lure.y, spd * 1.4 * dt); e.act = 'walk'; continue }
      const tgt = e.st.taunt > now() ? pet : h;
      if (h.hidden > now() && tgt === h) { e.act = 'idle'; if (rnd() < dt) e.face *= -1; continue }
      if (e.act === 'atk') { e.wind -= dt; if (e.wind <= 0) { e.act = 'walk'; e.at = now() + (isBoss(e) ? 2.2 : 1.6); if (e.kind === 'cage') { e.cageStrikeAt = now(); e.act = 'idle'; } if (e.kind === 'net') { e.netStrikeAt = now(); e.act = 'idle'; } if (e.kind === 'drag') { e.dragStrikeAt = now(); e.act = 'idle'; } enemyStrike(e, tgt) } continue }
      const ddx = tgt.x - e.x, ddy = tgt.y - e.y; e.face = Math.sign(ddx) || e.face;
      const rng = e.K.rng * (e.st.shrink && e.st.shrink.u > now() ? e.st.shrink.s : 1);
      if (Math.abs(ddx) < rng && Math.abs(ddy) < (e.K.ranged ? 200 : 30)) { if (now() > e.at) { e.act = 'atk'; e.wind = isBoss(e) ? 1.0 : .7; e.atkName = isBoss(e) && rnd() < .35 ? 'slam' : e.K.atkA } else e.act = 'idle' }
      else { e.act = 'walk'; mv(e, tgt.x - Math.sign(ddx) * rng * .7, tgt.y, spd * dt) }
    }
    // 投射物
    for (const p of A.pr) {
      p.life -= dt;
      if (p.snow) { p.x += p.vx * dt; p.r = Math.min(48, p.r + 14 * dt); for (const e of A.en) if (!e.dead && !p.hitIds[e.id] && Math.abs(e.x - p.x) < p.r + 20 && Math.abs(e.y - p.y) < 50) { p.hitIds[e.id] = 1; pdmg(e, isBoss(e) ? .6 : 1.8, '雪球'); if (!isBoss(e)) e.x += Math.sign(p.vx) * 120 } continue }
      if (p.tx) { if (p.tx.dead) { p.life = 0; continue } const tx = p.tx.x, ty = p.tx.y - 40; const ddx = tx - p.x, ddy = ty - p.y, d = Math.hypot(ddx, ddy); if (d < 20) { p.life = 0; if (p.on) { const P0 = A.pi.P; if (p.mul) A.pi.P = P0 * p.mul; try { p.on(p.tx) } finally { A.pi.P = P0 } } } else { p.x += ddx / d * p.sp * dt; p.y += ddy / d * p.sp * dt } }
      else if (p.harrow) { const x0 = p.x; p.x += p.vx * dt; const lo = Math.min(x0, p.x) - 30, hi = Math.max(x0, p.x) + 30;
        const tg = A.en.filter(e => !e.dead && e.x >= lo && e.x <= hi && Math.abs(e.y - p.gy) < 45 * (isBoss(e) ? 1.3 : 1)).sort((a, b) => (a.x - b.x) * Math.sign(p.vx))[0];
        if (tg) { p.life = 0; heroDmg(tg, p.hs); continue }
        const cg = A.cages.find(c => c.hp > 0 && c.x >= lo && c.x <= hi && Math.abs(c.y - p.gy) < 50); if (cg) { p.life = 0; hitCage(cg) } }
      else if (p.arrow) { p.x += p.vx * dt; const t = p.tgt; if (Math.abs(t.x - p.x) < 30 && Math.abs(t.y - 50 - p.y) < 50) { p.life = 0; if (t === h) { if (heroHurt(p.dmg, p.src) && p.net) heroSlow(h) } else petHurt() } }
    }
    A.pr = A.pr.filter(p => p.life > 0);
    // 掉落物
    for (const d of A.drops) {
      d.t += dt; if (d.z > 0 || d.vz > 0) { d.vz -= 900 * dt; d.z = Math.max(0, d.z + d.vz * dt); if (d.z === 0) d.vz = 0 }
      const r = Math.hypot(d.x - h.x, (d.y - h.y) * 2); const pr = Math.max(60, hs.pick);
      if (d.t > .5 && r < pr) { if (r > 60) { d.x += (h.x - d.x) * dt * 6; d.y += (h.y - d.y) * dt * 6; continue } d.got = 1; const luck = has(302) && rnd() < 0.03; if (luck) { A.clover = (A.clover || 0) + 1; txt(h.x, h.y - 175, '🍀 ×2', '#7f7') } if (d.kind === 'gold') { A.gold += d.n * (luck ? 2 : 1); txt(h.x, h.y - 150, '+' + d.n * (luck ? 2 : 1), '#ffd54a') } else { addFood(1); if (luck && petFood(1)) addFood(1) } }
    }
    A.drops = A.drops.filter(d => !d.got); A.zones = A.zones.filter(z => z.u > now()); A.fx = A.fx.filter(f => (f.t += dt) < f.life);
    // 籠子
    // 波次與結束
    const alive = A.en.filter(e => !e.dead).length;
    const exiting = A.en.some(e => (e.K.grum && e.dead && now() < e.exitUntil) || cageExiting(e) || netExiting(e) || dragExiting(e));
    if (!alive && !exiting) { if (!nextWave()) { if (A.mode !== 'rescue' || A.cages.every(c => c.hp <= 0)) end(true) } }
    if (alive && A.mode === 'rescue' && A.wave < A.waves.length && A.cages.filter(c => c.hp <= 0).length >= Math.ceil(A.cages.length * A.wave / A.waves.length)) nextWave();
  }
  function grumState(e, state) { e.act = state; e.gt = 0; e.grumImpact = false; }
  function grumStep(e, dt) {
    e.gt = (e.gt || 0) + dt;
    for (const d of e.dots) if (d.u > now()) { d.acc = (d.acc || 0) + d.dps * dt; if (d.acc > 300) { const v = d.acc; d.acc = 0; hit(e, v, 'pet', '', d.c); } }
    e.dots = e.dots.filter(d => d.u > now()); if (e.dead) return;
    const target = e.st.taunt > now() ? A.pet : A.hero;
    if (e.act === 'lift') { if (e.gt >= .720) { grumState(e, 'slam'); e.atkName = 'grum_slam'; } return; }
    if (e.act === 'slam') {
      // The ground-contact drawing is frame 2 (zero-based); one hit test per swing.
      if (!e.grumImpact && e.gt >= GRUM.slam[1] * 2) {
        e.grumImpact = true; enemyStrike(e, target); A.shakeUntil = now() + .16; if (mcOn()) P.MC.H.shake(6, .16);
        A.fx.push({ k: 'poof', x: e.x + e.face * 100, y: e.y, t: 0, life: .22 });
      }
      if (e.gt >= .540) grumState(e, 'recover'); return;
    }
    if (e.act === 'recover' || e.act === 'hurt') {
      if (e.gt >= GRUM[e.act][0] * GRUM[e.act][1]) { const recovered = e.act === 'recover'; grumState(e, 'idle'); if (recovered) e.at = now() + 1.4; }
      return;
    }
    if (disabled(e) || (target === A.hero && A.hero.hidden > now())) { if (e.act !== 'idle') grumState(e, 'idle'); return; }
    const dx = target.x - e.x, dy = target.y - e.y; e.face = Math.sign(dx) || e.face;
    if (Math.abs(dx) < e.K.rng && Math.abs(dy) < 32) {
      if (now() >= e.at) grumState(e, 'lift'); else if (e.act !== 'idle') grumState(e, 'idle');
    } else {
      if (e.act !== 'walk') grumState(e, 'walk');
      const slow = e.st.slow && e.st.slow.u > now() ? 1 - e.st.slow.v : 1;
      mv(e, target.x - Math.sign(dx) * e.K.rng * .7, target.y, e.K.spd * slow * dt);
    }
  }
  function mv(e, x, y, v) { const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy); if (d < 2) return; e.x += dx / d * Math.min(v, d); e.y += dy / d * Math.min(v, d) * .7; e.y = Math.max(GY0, Math.min(GY1, e.y)); e.x = Math.max(20, Math.min(worldW() - 20, e.x)) }
  // 主角一般攻擊：傷害基準＝h.atkBase（主遊戲同款一般攻擊期望值）；暴擊／寵物加成沿用本測試場 heroStat。
  function heroDmg(e, hs) { const h = A.hero, crit = rnd() * 100 < hs.crit; const d = h.atkBase * hs.atk * (crit ? 1 + hs.cdmg / 100 : 1) * (.9 + rnd() * .2); hit(e, d, 'hero', '', '#fff', crit); A.ult = Math.min(100, A.ult + 1) }
  function hitCage(c) { c.hp--; txt(c.x, c.y - 120, c.hp > 0 ? '喀！' : '打開了！', '#fff', 1); if (c.hp <= 0) { const p = P.rescue(c.sp, { tier: c.tier, star: c.star, quest: A.quest && A.quest.id }); c.freed = { p, t: 0 }; poof(c.x, c.y - 40) } }
  function heroHit(hs) {
    const h = A.hero, H = h.H;
    if (H.ranged) { A.pr.push({ harrow: 1, x: h.x + 60 * h.face, gy: h.y, y: h.y - 92, vx: H.ranged.v * h.face, life: H.ranged.rng / H.ranged.v, hs }); return }   // 三杯兔子：普通射擊（主遊戲 AR.shot：速度 1500、射程 760）
    const R = H.reach;
    for (const e of A.en) { if (e.dead) continue; const dx = (e.x - h.x) * h.face; if (dx > -20 && dx < R * (isBoss(e) ? 1.3 : 1) && Math.abs(e.y - h.y) < 45) heroDmg(e, hs) }
    for (const c of A.cages) { if (c.hp <= 0) continue; const dx = (c.x - h.x) * h.face; if (dx > -20 && dx < R && Math.abs(c.y - h.y) < 50) hitCage(c) }
  }
  function enemyStrike(e, tgt) {
    let dmg = e.K.atk * (e.elite ? 1.5 : 1) * (e.atkName === 'slam' ? 1.9 : 1);
    if (e.st.atkDown && e.st.atkDown.u > now()) dmg *= 1 - e.st.atkDown.v;
    if (e.K.ranged) { A.pr.push({ x: e.x, y: e.y - 60, vx: Math.sign(tgt.x - e.x) * 520, arrow: 1, net: e.kind === 'net', tgt, dmg, src: e, life: 2 }); return }
    const reach = e.K.rng * 1.2; const h = A.hero, pet = A.pet;
    if (Math.abs(pet.x - e.x) < reach && Math.abs(pet.y - e.y) < 50) petHurt();
    if (tgt === h && Math.abs(h.x - e.x) < reach && Math.abs(h.y - e.y) < 50) { if (heroHurt(dmg, e) && e.kind === 'drag') heroStun(h) }
  }
  // 2026-11-12 英雄專屬負面狀態（獨立於敵人 e.st）：只在攻擊真的命中英雄時（非閃避／倒下／無敵）觸發。
  // 播網兵網射體 → 緩速 2 秒、移速 ×0.6；拖籠兵籠擊 → 暈眩 0.8 秒、不能移動／攻擊並中斷揮擊。重疊命中刷新時長。
  const HERO_SLOW_T = 2, HERO_SLOW_MUL = .6, HERO_STUN_T = .8;
  function heroSlowed(h) { return (h.slowU || 0) > now() }
  function heroStunned(h) { return (h.stunU || 0) > now() }
  function heroSlow(h) { h.slowU = Math.max(h.slowU || 0, now() + HERO_SLOW_T); txt(h.x, h.y - 210, '緩速', '#b8d4e8'); if (mcOn()) P.MC.H.slow(HERO_SLOW_T, HERO_SLOW_MUL) }
  function heroStun(h) { h.stunU = Math.max(h.stunU || 0, now() + HERO_STUN_T); h.swing = 0; h.hitDone = 1; txt(h.x, h.y - 210, '暈眩', '#ffe066'); if (mcOn()) P.MC.H.stun(HERO_STUN_T) }
  function petHurt() { A.pet.hurt = now() + .45 }   // 寵物被打到：只閉眼，不扣血、不倒下
  function heroHurt(dmg, e) {
    const h = A.hero; if (h.down || P.arenaGod) { if (P.arenaGod) txt(h.x, h.y - 150, '無敵', '#aaa'); return false }
    if (mcOn()) return mcHurt(dmg, e);
    const hs = heroStat(); if (rnd() * 100 < hs.dodge) { txt(h.x, h.y - 150, '閃避', '#9cf'); return false }
    dmg *= 1 - hs.dr / 100; dmg = Math.min(dmg, h.max * .65);   // 單一傷害最多 65%
    if (h.shield) { const a = Math.min(h.shield.v, dmg); h.shield.v -= a; dmg -= a; if (h.shield.v <= 0) h.shield = null; txt(h.x, h.y - 180, '泡泡吸收 ' + Math.round(a), '#bdf') }
    dmg = Math.round(dmg); h.hp -= dmg; h.hurtT = now(); txt(h.x, h.y - 150, '-' + dmg, '#ff6b6b');
    if (dmg >= h.max * .2) heavy();
    if (h.hp <= 0) {
      if (has(31) && !A.used31) { A.used31 = 1; h.hp = h.max * .25; h.inv = now() + .6; txt(h.x, h.y - 190, '起來呀！', '#ffd', 1); log('#31 起來呀！'); return true }
      h.hp = 0; h.down = 1; heavy(); txt(h.x, h.y - 190, '倒下了…', '#f66', 1); log('主角倒下'); setTimeout(() => A && end(false), 1500);
    }
    return !h.down;
  }
  function heavy() { const t = A.pi.tier >= 3; if (has(304) && (A.cd[304] || 0) < now()) { A.cd[304] = now() + cdOf(304); A.pet.scaleU = now() + 6; A.used[304] = (A.used[304] || 0) + 1; txt(A.pet.x, A.pet.y - 110, '逆鱗！攻擊 +30%', '#f77'); log('#304 逆鱗：寵物 6 秒攻擊 +30%') } if (has(58) && (A.cd[58] || 0) < now()) { A.cd[58] = now() + 15; buff(58, 'dr', 4, t ? 5 : 4, '不屈的韻味') } if (has(59) && (A.cd[59] || 0) < now()) { A.cd[59] = now() + 10; A.hero.hp = Math.min(A.hero.max, A.hero.hp + A.hero.max * (t ? .03 : .02)) } if (has(61) && (A.cd[61] || 0) < now()) { A.cd[61] = now() + 15; A.pet.rageU = now() + 6 } }
  function end(win) {
    if (A.over) return; A.over = 1; A.overT = 2.5;
    const tot = Object.values(A.dmg).reduce((a, b) => a + b, 0) || 1; const share = ((A.dmg.pet || 0) / tot * 100).toFixed(1);
    if (A.quest && win && A.cages.every(c => c.hp <= 0)) P.questDone(A.quest.id);
    P.fightEnd({ gold: Math.round(A.gold), bread: A.bread, kills: A.kills });
    log(`戰鬥結算：${win ? '通關' : '撤退／倒下'}；寵物傷害佔 ${share}%；技能使用 ${Object.entries(A.used).map(([n, c]) => P.SK[n].name + '×' + c).join('、') || '無'}`);
    UI.toast(`${win ? '通關！' : '回收容所'} 金幣 +${Math.round(A.gold)}｜剩食麵包 +${A.bread}｜寵物傷害 ${share}%`, 3500);
    P.save();
  }
  // ======== 2026-11-12 主遊戲戰鬥模組（P.MC，pet_maincombat_1112.js）========
  // 英雄＝主遊戲的英雄（移動、跳躍、J/K/L/V、閃避、各角色招式、傷害／暴擊、受傷／倒地／無敵、HUD、手機按鍵）；
  // 這裡把寵物頁的敵人／鐵籠交給主遊戲當「代理怪」，主遊戲算出的傷害再回到寵物頁（掉落、籠兵倒地、格魯姆連籠倒下、救出寵物）。
  const mcOn = () => !!(A && A.mc && A.mc.ready && P.MC && P.MC.on);
  const MCN = { ow: 0 };
  function mcEnter(RH) {
    A.mc = null; if (!(P.MC && P.MC.usable && P.MC.usable())) return;
    const mc = A.mc = { ready: false, wait: 0, held: {}, healAcc: 0, atkT: 0 };
    A.auto = 0;   // 主遊戲英雄預設手動（自己的角色自己打）；上方「自動」可開
    P.MC.boot().then(() => {
      if (!A || A.mc !== mc) return;
      const h = A.hero;
      const st = P.MC.start({ hero: RH.id, ww: worldW(), gy0: GY0, gy1: GY1, x: h.x, y: h.y, hpShare: ((A.pi.ow || {}).hp || 0) / 100, name: (A.quest && A.quest.name) || '救援' });
      h.max = st.max; h.hp = st.hp; mc.ready = true; mc.hero = st.hero; mcBar(true);
      for (const e of A.en) if (e.K.mcHp && !e.dead && e.hp === e.max) { e.hp = e.max = e.K.mcHp * (e.elite ? 3 : 1) }   // 模組載好之前就已經出場的頭目（例如本機直接從第 2 波開始）也換成主遊戲戰鬥用的 HP
      log(`主遊戲戰鬥模組：${h.name}（主遊戲 HPMAX ${st.max}；招式／傷害／受傷全用主遊戲原檔）`);
    }).catch(e => { if (!A || A.mc !== mc) return; A.mc = null; A.auto = matchMedia('(pointer:coarse)').matches ? 1 : 0; UI.toast('主遊戲戰鬥模組載入失敗，這場改用簡易英雄', 3500); log('主遊戲戰鬥模組失敗：' + (P.MC.failed || e)) });
  }
  function mcLeave() { mcBar(false); mcAutoRelease(); if (A && A.mc && P.MC) P.MC.stop() }
  // 寵物頁自己的兩顆鈕（主遊戲畫面上方中間、寵物格右邊）：回收容所、自動戰鬥
  function mcBar(on) {
    let b = document.getElementById('mcBar');
    if (!on) { if (b) b.remove(); return }
    if (!b) { b = document.createElement('div'); b.id = 'mcBar'; document.body.appendChild(b) }
    b.innerHTML = '<button data-k="quit">回收容所</button><button data-k="auto">自動：關</button>';
    b.onclick = ev => { const k = ev.target && ev.target.dataset && ev.target.dataset.k; if (!k || !A) return; ev.preventDefault();
      if (k === 'quit') end(false); else { A.auto ^= 1; if (!A.auto) mcAutoRelease(); ev.target.textContent = A.auto ? '自動：開' : '自動：關'; ev.target.classList.toggle('on', !!A.auto) }
      try { P.MC.fr.focus() } catch (e) { } };
    mcPlaceBar();
  }
  // 依主遊戲畫布實際位置擺（letterbox／手機 panel 模式都對得上）：畫布座標 x 718～、y 8～
  function mcPlaceBar() {
    const b = document.getElementById('mcBar'); if (!b || !P.MC || !P.MC.fr) return;
    try { const cv = P.MC.W.document.getElementById('c'), r = cv.getBoundingClientRect(), fr = P.MC.fr.getBoundingClientRect(), k = r.width / 1280;
      b.style.left = Math.round(fr.left + r.left + 718 * k) + 'px'; b.style.top = Math.round(fr.top + r.top + 10 * k) + 'px'; b.style.setProperty('--k', Math.max(0.55, k).toFixed(3)) } catch (e) { }
  }
  function mcHeroStep(dt, hs) {
    const H = P.MC.H, h = A.hero, mc = A.mc;
    H.setBonus({ atk: hs.atk, crit: (hs.crit - 15) / 100, cdmg: (hs.cdmg - 80) / 100, spd: hs.spd });
    if (A.auto && !h.down) mcAuto(); else if (Object.keys(mc.held).length || mc.jDown) mcAutoRelease();
    const st = H.state();
    h.x = st.x; h.y = st.y; h.face = st.face; h.max = st.max; h.hp = st.hp; h.moving = false;
    A.food = Math.min(C.foodSlot, st.food);   // 主遊戲「召喚／援助（V）」會吃掉食物
    if (h.regen && h.regen.u > now()) { mc.healAcc += h.regen.v * dt; if (mc.healAcc >= 1) { const v = Math.floor(mc.healAcc); mc.healAcc -= v; H.heal(v, true); h.hp = H.state().hp } }
    if (h.shield && h.shield.u < now()) h.shield = null;
    if (st.dead && !h.down) {
      if (has(31) && !A.used31) { A.used31 = 1; H.revive(.25); h.hp = H.state().hp; txt(h.x, h.y - 190, '起來呀！', '#ffd', 1); log('#31 起來呀！') }
      else { h.hp = 0; h.down = 1; heavy(); log('主角倒下'); setTimeout(() => A && end(false), 1800) }
    }
    if (H.quitReq) { H.quitReq = false; end(false) }
    while (H.notes.length) UI.toast(`救援關不開「${H.notes.shift()}」：請回主遊戲調整（救援不寫主遊戲存檔）`, 2600);
    mcPlaceBar();
  }
  function mcHurt(dmg, e) {
    const h = A.hero, hs = heroStat(), H = P.MC.H;
    if (rnd() * 100 < hs.dodge) { txt(h.x, h.y - 150, '閃避', '#9cf'); return false }   // 寵物給的閃避（寵物系統效果，疊在主遊戲之前）
    dmg *= 1 - hs.dr / 100; dmg = Math.min(dmg, h.max * .65);
    if (h.shield) { const a = Math.min(h.shield.v, dmg); h.shield.v -= a; dmg -= a; if (h.shield.v <= 0) h.shield = null; txt(h.x, h.y - 180, '泡泡吸收 ' + Math.round(a), '#bdf') }
    if (dmg < 1) return false;
    const lost = H.hurt(Math.round(dmg), e ? e.x : null), st = H.state(); h.hp = st.hp; h.hurtT = now();
    if (lost <= 0 && !st.dead) return false;   // 主遊戲的無敵時間／翻滾／後跳／格擋擋掉 → 不上緩速／暈眩
    if (lost >= h.max * .2) heavy();
    return !st.dead;
  }
  function mcHold(code, on) { const H = P.MC.H, held = A.mc.held; if (!!held[code] === !!on) return; if (on) { held[code] = 1; H.key('keydown', code) } else { delete held[code]; H.key('keyup', code) } }
  function mcAutoRelease() { if (!A || !A.mc || !P.MC || !P.MC.H) return; for (const k in A.mc.held) P.MC.H.key('keyup', k); A.mc.held = {}; if (A.mc.jDown) { A.mc.jDown = 0; P.MC.H.key('keyup', 'KeyJ') } }
  // 自動戰鬥（寵物頁原本的規則）：主遊戲沒有可開關的自動，這裡改成「幫你按方向鍵＋J」，招式本身仍是主遊戲的
  function mcAuto() {
    const h = A.hero; let mx = 0, my = 0, atk = 0;
    const tgt = A.cages.find(c => c.hp > 0 && Math.abs(c.x - h.x) < 900 && !A.en.some(e => !e.dead && Math.abs(e.x - h.x) < 500)) || nearest(h.x, h.y, e => !(e.poly && isBoss(e)) || 1, 2000);
    if (tgt) { const dx = tgt.x - h.x, dy = tgt.y - h.y, rr = A.mc.hero === 'archer' && tgt.K ? 520 : 90;
      if (Math.abs(dx) > rr || Math.abs(dy) > 22) { mx = Math.abs(dx) > rr ? Math.sign(dx) : 0; my = Math.abs(dy) > 22 ? Math.sign(dy) : 0 }
      else if ((Math.sign(dx) || h.face) !== h.face) mx = Math.sign(dx); else atk = 1 }
    else if (A.mode === 'rescue' && A.cages.some(c => c.hp > 0)) mx = 1;
    mcHold('ArrowRight', mx > 0); mcHold('ArrowLeft', mx < 0); mcHold('ArrowDown', my > 0); mcHold('ArrowUp', my < 0);
    const H = P.MC.H; if (A.mc.jDown) { A.mc.jDown = 0; H.key('keyup', 'KeyJ') }   // 放開放在下一格（不靠 setTimeout，加速模擬測試也一樣）
    if (atk && A.mc.atkT < now()) { A.mc.atkT = now() + .2; A.mc.jDown = 1; H.key('keydown', 'KeyJ') }
  }
  function mcList() {
    const L = [];
    for (const e of A.en) if (!e.dead) L.push({ id: e.id, x: e.x, y: e.y, face: e.face || -1, hp: Math.max(1, e.hp), max: e.max, kind: isBoss(e) ? 'boss' : 'mob', head: monHead(e) + 12, elite: !!e.elite, name: isBoss(e) ? (e.K.grum ? '格魯姆・背籠看守' : (e.K.name || '頭目')) : '' });
    A.cages.forEach((c, i) => { if (c.hp > 0) L.push({ id: 'c' + i, x: c.x, y: c.y, face: -1, hp: 1, max: 1, kind: 'cage' }) });
    return L;
  }
  function mcApply(list) {
    for (const r of list) {
      if (typeof r.id === 'string') { const c = A.cages[+r.id.slice(1)]; if (c && c.hp > 0 && r.d > 0 && now() >= (c.mcT || 0)) { c.mcT = now() + .22; hitCage(c) } continue }
      const e = A.en.find(x => x.id === r.id); if (!e) continue;
      if (!e.K.grum && !e.dead) { const react = r.state === 'air' || r.state === 'down' || r.state === 'stun'; e.mcR = react ? 1 : 0; e.mcS = r.state; e.mcH = r.h || 0; e.mcRot = r.rot || 0; if (react) e.x = Math.max(20, Math.min(worldW() - 20, r.x)) }
      if (r.d > 0 && !e.dead) { hit(e, r.d, 'hero', '', '#fff', false); A.ult = Math.min(100, A.ult + 1) }
      if (e.dead) e.mcR = 0;
    }
  }
  function mcRender() {
    const H = P.MC.H;
    H.setFood(A.food); H.setGold(Math.round(A.gold));
    H.sync(mcList());
    H.frame({ bg: mcBg, ents: mcEnts, after: mcAfter, hud: mcHud });
    mcApply(H.collect());
    A.cam = H.cam || 0;
  }
  function mcBg(X, cx0) {
    A.cam = cx0; const cam = cx0;
    if (!(P.drawRescueStageBg && P.drawRescueStageBg(X, A))) { X.fillStyle = '#3d2f45'; X.fillRect(0, 0, 1280, 720); X.fillStyle = '#6b8f4e'; X.fillRect(0, 400, 1280, 320); X.fillStyle = '#1A1016'; X.fillRect(0, 398, 1280, 4) }
    if (P.drawRescueStageDecals) P.drawRescueStageDecals(X, A);
    for (const z of A.zones) { const x = z.x - cam; if (z.k === 'star') { const a = Math.max(0, (z.u - now()) / 2.5); X.fillStyle = `rgba(255,236,140,${(.25 + .5 * a).toFixed(2)})`; for (let i = 0; i < 4; i++) X.fillRect(Math.round(x - 18 + i * 11), Math.round(z.y - 4 - (i % 2) * 7), 4, 4) } if (z.k === 'glue') { X.fillStyle = 'rgba(255,140,190,.55)'; X.beginPath(); X.ellipse(x, z.y, z.r, z.r * .35, 0, 0, 7); X.fill() } if (z.k === 'banana' && !z.used) P.art.px(X, P.art.BANANA, x - 8, z.y - 12, 2); if (z.k === 'bone') P.art.px(X, P.art.BONE, x - 8, z.y - 10, 3) }
  }
  // 寵物頁的場景物件插進主遊戲同一張「依腳底 y 排序」清單（主遊戲英雄也在裡面）→ 前後遮擋一致
  function mcEnts(ents, cx0, shy) {
    A.cam = cx0; const ctx = P.MC.W.document.getElementById('c').getContext('2d');
    const at = (y, f) => ents.push([y, () => { ctx.save(); if (shy) ctx.translate(0, shy); try { f() } finally { ctx.restore() } }]);
    if (P.rescueStageProps) P.rescueStageProps(ctx, A).forEach(p => at(p.y, p.draw));
    A.cages.forEach(c => at(c.y, () => drawCage(ctx, c)));
    A.en.forEach(e => { if (!e.dead || (e.K.grum && now() < e.exitUntil) || cageExiting(e) || netExiting(e) || dragExiting(e)) at(e.y, () => mcDrawEnemy(ctx, e)) });
    at(A.pet.y, () => drawPet(ctx));
    A.drops.forEach(d => at(d.y, () => P.art.px(ctx, d.kind === 'gold' ? P.art.COIN : P.art.BREAD, d.x - A.cam - 8, d.y - 14 - d.z, 3)));
    const h = A.hero; if (h.hidden > now()) at(h.y + .5, () => P.art.px(ctx, P.art.BOX, h.x - A.cam - 36, h.y - 100, 6));
  }
  // 被主遊戲打飛（air）／倒地（down）時，籠兵跟主遊戲小怪一樣離地、轉圈、躺下
  function mcDrawEnemy(ctx, e) {
    if (!e.mcR || e.dead) return drawEnemy(ctx, e);
    const x = e.x - A.cam; ctx.save();
    if (e.mcS === 'air') { ctx.translate(0, -Math.round(e.mcH)); const r = (e.mcRot || 0) * Math.PI / 180; if (r) { ctx.translate(x, e.y - 60); ctx.rotate(r * (e.face > 0 ? -1 : 1)); ctx.translate(-x, -(e.y - 60)) } }
    else if (e.mcS === 'down') { ctx.translate(x, e.y - 8); ctx.rotate((e.face > 0 ? -1 : 1) * 1.45); ctx.translate(-x, -(e.y - 8)) }
    try { drawEnemy(ctx, e) } finally { ctx.restore() }
  }
  function mcAfter(X) {
    const cam = A.cam, h = A.hero;
    for (const p of A.pr) { const x = p.x - cam; if (p.harrow) continue; if (p.snow) { X.fillStyle = '#eef6ff'; X.strokeStyle = '#1A1016'; X.lineWidth = 3; X.beginPath(); X.arc(x, p.y - p.r / 2, p.r, 0, 7); X.fill(); X.stroke() } else if (p.net) {
      if ((now() >= p.src.netStrikeAt + .18 || p.src.dead || p.src.act === 'hit') && P.art.imageOK(IMG.net_projectile)) { const im = IMG.net_projectile; X.save(); X.imageSmoothingEnabled = false; X.translate(Math.round(x), Math.round(p.y)); if (p.vx > 0) X.scale(-1, 1); X.drawImage(im, -im.width, -im.height, im.width * 2, im.height * 2); X.restore() }
    } else if (p.arrow) { X.fillStyle = '#1A1016'; X.fillRect(x - 14, p.y - 2, 28, 4) } else { X.fillStyle = '#1A1016'; X.fillRect(x - 7, p.y - 7, 14, 14); X.fillStyle = p.c; X.fillRect(x - 5, p.y - 5, 10, 10) } }
    const W2 = P.MC.H;
    for (const f of A.fx) { const x = f.x - cam, k = f.t / f.life;
      if (f.k === 'txt') { W2.T(f.s, x, f.y - k * 40, W2.FN(f.big ? 22 : 16), hexRGB(c), 3, [26, 16, 22], 'mm', 1 - k * k) }
      if (f.k === 'poof') { X.fillStyle = '#eee'; X.globalAlpha = 1 - k; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const r = 10 + k * 40; X.fillRect(x + Math.cos(a) * r - 6, f.y + Math.sin(a) * r * .6 - 6, 12, 12) } X.globalAlpha = 1 }
      if (f.k === 'pan') P.art.px(X, P.art.PAN, x - 15, f.y - (1 - k) * 60, 3) }
    if (P.drawRescueStageFg) P.drawRescueStageFg(X, A);
    const slowed = heroSlowed(h) && !h.down, stunned = heroStunned(h) && !h.down; if (slowed || stunned) drawHeroStatus(X, h, slowed, stunned);
  }
  const hexRGB = c => { c = String(c || '#fff').replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const n = parseInt(c.slice(0, 6), 16) || 0xffffff; return [n >> 16 & 255, n >> 8 & 255, n & 255] };
  // 主遊戲 HUD 上：主遊戲自己寵物量表那一格換成「同行寵物」；寵物技能冷卻、加成、波次用主遊戲字型畫在左上面板下方
  function mcHud(X) {
    const W2 = P.MC.H, T = W2.T, FN = W2.FN, FS = W2.FS, pet = A.pet, pi = A.pi, h = A.hero;
    X.save(); X.beginPath(); X.arc(640, 58, 46, 0, 7); X.fillStyle = 'rgba(16,10,8,0.88)'; X.fill(); X.lineWidth = 4; X.strokeStyle = 'rgb(214,172,84)'; X.stroke(); X.clip();
    P.art.draw(X, { sp: pi.sp, tier: pi.tier, star: pi.star }, 640, 92, { act: pet.hurt > now() ? 'hurt' : 'idle', t: pet.t, scale: 1.05, appear: 9 }); X.restore();
    T(pi.name, 640, 118, FN(14), [255, 236, 200], 2, [0, 0, 0], 'mm');
    let y = 168; const row = (s, col) => { const w = Math.min(380, W2.tw ? W2.tw(s, FN(14)) + 16 : 240); X.fillStyle = 'rgba(12,8,10,0.66)'; X.fillRect(10, y - 11, w, 21); T(s, 18, y, FN(14), col, 2, [0, 0, 0], 'lm'); y += 23 };
    for (const n of pi.sk) { const sk = P.SK[n], r = Math.max(0, (A.cd[n] || 0) - now()); const done = SKILL[n] || n <= 7 || (sk.use && sk.use.some(u => u[0] <= 7 || SKILL[u[0]])); row(`寵物技能 #${n} ${sk.name}　${done ? (r > 0 ? r.toFixed(0) + 's' : '就緒') : '（還沒做）'}`, r > 0 ? [200, 196, 190] : [168, 230, 161]) }
    for (const k in h.buf) { const b = h.buf[k]; if (b.u > now()) row(`▲ ${b.name}`, [255, 230, 160]) }
    if (heroStunned(h)) row('▼ 暈眩', [255, 224, 102]); if (heroSlowed(h)) row('▼ 緩速（移動 ×0.6）', [184, 212, 232]);
    if (h.shield) row(`泡泡護盾 ${Math.round(h.shield.v)}`, [190, 220, 255]);
    T(`${A.quest ? A.quest.name + '　' : ''}第 ${A.wave}/${A.waves.length} 波　擊倒 ${A.kills}　救出 ${A.cages.filter(c => c.hp <= 0).length}/${A.cages.length}`, 1268, 132, FN(15), [255, 244, 214], 2, [0, 0, 0], 'rm');
    if (A.over) { X.fillStyle = 'rgba(0,0,0,.55)'; X.fillRect(0, 300, 1280, 100); T(A.mode === 'rescue' && A.cages.every(c => c.hp <= 0) ? (A.quest && A.quest.id === 'r1' ? '救援成功！大家搬去總匯總部' : '委託完成！救出來的孩子在候補名冊') : '回收容所…', 640, 350, FS(34), [255, 255, 255], 4, [0, 0, 0], 'mm') }
    if (P.arenaView) P.arenaView(X, A);
  }
  function mcLoading(ctx) {
    ctx.fillStyle = '#120c10'; ctx.fillRect(0, 0, 1280, 720); ctx.fillStyle = '#f3d27a'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`載入主遊戲戰鬥… ${A.hero.name}`, 640, 350); ctx.font = '16px sans-serif'; ctx.fillStyle = '#cbb'; ctx.fillText('第一次約需數秒（主遊戲角色、招式、按鍵）', 640, 386); ctx.textAlign = 'left';
    if (A.mc.wait > 50) { A.mc = null; UI.toast('主遊戲戰鬥模組載入太久，這場改用簡易英雄', 3500) }
  }
  // ---------- 畫面 ----------
  function sheetDraw(ctx, e, anim, t, sc) {
    const m = MON[e.K.sheet], img = IMG['m_' + e.K.sheet]; if (!m || !P.art.imageOK(img)) return;
    const a = m.anims[anim] || m.anims.idle; const f = a.frames[Math.floor(t * (a.fps || 8)) % a.frames.length];
    const faceL = (m.face || 'L') === 'L'; const flip = faceL ? e.face > 0 : e.face < 0;
    const [ax, ay] = m.anchor || [m.frame_w / 2, m.frame_h];
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(e.x - A.cam, e.y); if (flip) ctx.scale(-1, 1); ctx.scale(sc, sc);
    ctx.drawImage(img, f.x, f.y, f.w, f.h, -ax, -ay, f.w, f.h); ctx.restore();
  }
  function render(ctx) {
    const cam = A.cam;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (A.shakeUntil > now()) ctx.translate(Math.round(Math.sin(A.t * 110) * 2), Math.round(Math.cos(A.t * 90) * 2));
    if (!(P.drawRescueStageBg && P.drawRescueStageBg(ctx, A))) {
      ctx.fillStyle = '#3d2f45'; ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#5a4466'; for (let i = 0; i < 12; i++) { const x = ((i * 260 - cam * .4) % 3120 + 3120) % 3120 - 200; ctx.fillRect(x, 200, 120, 200) }
      ctx.fillStyle = '#6b8f4e'; ctx.fillRect(0, 400, 1280, 320); ctx.fillStyle = '#5c7d42'; for (let x = -((cam) % 80); x < 1280; x += 80) ctx.fillRect(x, 400, 40, 320);
      ctx.fillStyle = '#1A1016'; ctx.fillRect(0, 398, 1280, 4);
    }
    if (P.drawRescueStageDecals) P.drawRescueStageDecals(ctx, A); // 地面貼條（車轍／鐵軌），永遠在腳下
    for (const z of A.zones) { const x = z.x - cam; if (z.k === 'star') { const a = Math.max(0, (z.u - now()) / 2.5); ctx.fillStyle = `rgba(255,236,140,${(.25 + .5 * a).toFixed(2)})`; for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x - 18 + i * 11), Math.round(z.y - 4 - (i % 2) * 7), 4, 4) } if (z.k === 'glue') { ctx.fillStyle = 'rgba(255,140,190,.55)'; ctx.beginPath(); ctx.ellipse(x, z.y, z.r, z.r * .35, 0, 0, 7); ctx.fill() } if (z.k === 'banana' && !z.used) P.art.px(ctx, P.art.BANANA, x - 8, z.y - 12, 2); if (z.k === 'bone') P.art.px(ctx, P.art.BONE, x - 8, z.y - 10, 3) }
    const objs = [];
    if (P.rescueStageProps) P.rescueStageProps(ctx, A).forEach(p => objs.push({ y: p.y, f: p.draw }));
    A.cages.forEach(c => objs.push({ y: c.y, f: () => drawCage(ctx, c) }));
    A.en.forEach(e => { if (!e.dead || (e.K.grum && now() < e.exitUntil) || cageExiting(e) || netExiting(e) || dragExiting(e)) objs.push({ y: e.y, f: () => drawEnemy(ctx, e) }) });
    objs.push({ y: A.hero.y, f: () => drawHero(ctx) }); objs.push({ y: A.pet.y, f: () => drawPet(ctx) });
    A.drops.forEach(d => objs.push({ y: d.y, f: () => P.art.px(ctx, d.kind === 'gold' ? P.art.COIN : P.art.BREAD, d.x - cam - 8, d.y - 14 - d.z, 3) }));
    objs.sort((a, b) => a.y - b.y).forEach(o => o.f());
    for (const p of A.pr) { const x = p.x - cam; if (p.harrow) { drawHeroArrow(ctx, x, p.y, Math.sign(p.vx) || 1); continue } if (p.snow) { ctx.fillStyle = '#eef6ff'; ctx.strokeStyle = '#1A1016'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, p.y - p.r / 2, p.r, 0, 7); ctx.fill(); ctx.stroke() } else if (p.net) {
      // 前180ms由投網格承載飛網，之後交棒給同張原稿的網；不重複畫第二張網，也不改原有命中／飛行計算。
      if ((now() >= p.src.netStrikeAt + .18 || p.src.dead || p.src.act === 'hit') && P.art.imageOK(IMG.net_projectile)) {
        const im = IMG.net_projectile; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(p.y)); if (p.vx > 0) ctx.scale(-1, 1); ctx.drawImage(im, -im.width, -im.height, im.width * 2, im.height * 2); ctx.restore();
      }
    } else if (p.arrow) { ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 14, p.y - 2, 28, 4) } else { ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 7, p.y - 7, 14, 14); ctx.fillStyle = p.c; ctx.fillRect(x - 5, p.y - 5, 10, 10) } }
    for (const f of A.fx) {
      const x = f.x - cam, k = f.t / f.life;
      if (f.k === 'txt') { ctx.globalAlpha = 1 - k * k; ctx.font = `bold ${f.big ? 24 : 17}px sans-serif`; ctx.lineWidth = 4; ctx.strokeStyle = '#1A1016'; ctx.strokeText(f.s, x - ctx.measureText(f.s).width / 2, f.y - k * 40); ctx.fillStyle = f.col; ctx.fillText(f.s, x - ctx.measureText(f.s).width / 2, f.y - k * 40); ctx.globalAlpha = 1 }
      if (f.k === 'poof') { ctx.fillStyle = '#eee'; ctx.globalAlpha = 1 - k; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const r = 10 + k * 40; ctx.fillRect(x + Math.cos(a) * r - 6, f.y + Math.sin(a) * r * .6 - 6, 12, 12) } ctx.globalAlpha = 1 }
      if (f.k === 'pan') P.art.px(ctx, P.art.PAN, x - 15, f.y - (1 - k) * 60, 3);
    }
    if (P.drawRescueStageFg) P.drawRescueStageFg(ctx, A);
    ctx.restore(); // screen shake affects the world only; HUD stays stable
    // 血條、食物槽、寵物技能冷卻
    const h = A.hero, HX = 64; ctx.fillStyle = '#1A1016'; ctx.fillRect(16, 44, 44, 44); { const pi = IMG['por_' + h.id]; if (P.art.imageOK(pi)) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(pi, 18, 46, 40, 40); ctx.restore() } }
    ctx.fillStyle = '#1A1016'; ctx.fillRect(HX, 56, 304, 22); ctx.fillStyle = '#e04848'; ctx.fillRect(HX + 2, 58, 300 * Math.max(0, h.hp) / h.max, 18); if (h.shield) { ctx.fillStyle = '#bde'; ctx.fillRect(HX + 2, 58, 300 * h.shield.v / h.max, 6) }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(`${h.name} ${Math.round(Math.max(0, h.hp))}`, HX + 8, 73);
    for (let i = 0; i < C.foodSlot; i++) { ctx.globalAlpha = i < A.food ? 1 : .3; P.art.px(ctx, P.art.BREAD, HX + 314 + i * 30, 58, 3); ctx.globalAlpha = 1 }
    const boss = A.en.find(e => isBoss(e) && !e.dead); if (boss) { ctx.fillStyle = '#1A1016'; ctx.fillRect(390, 90, 504, 20); ctx.fillStyle = '#c050ff'; ctx.fillRect(392, 92, 500 * boss.hp / boss.max, 16); ctx.fillStyle = '#fff'; ctx.fillText('格魯姆・背籠看守', 400, 106) }
    let y = 100; ctx.font = '13px sans-serif';
    for (const n of A.pi.sk) { const s = P.SK[n], r = Math.max(0, (A.cd[n] || 0) - now()); ctx.fillStyle = 'rgba(26,16,22,.7)'; ctx.fillRect(16, y - 14, 230, 19); ctx.fillStyle = r > 0 ? '#aaa' : '#a8e6a1'; ctx.fillText(`#${n} ${s.name} ${(SKILL[n] || n <= 7 || (s.use && s.use.some(u => u[0] <= 7 || SKILL[u[0]]))) ? (r > 0 ? r.toFixed(0) + 's' : '就緒') : '（還沒做）'}`, 20, y); y += 21 }
    for (const k in h.buf) { const b = h.buf[k]; if (b.u > now()) { ctx.fillStyle = '#ffe6a0'; ctx.fillText(`▲ ${b.name}`, 20, y); y += 18 } }
    if (heroStunned(h)) { ctx.fillStyle = '#ffe066'; ctx.fillText('▼ 暈眩', 20, y); y += 18 }
    if (heroSlowed(h)) { ctx.fillStyle = '#b8d4e8'; ctx.fillText('▼ 緩速', 20, y); y += 18 }
    if (A.over) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 300, 1280, 100); ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(A.mode === 'rescue' && A.cages.every(c => c.hp <= 0) ? (A.quest && A.quest.id === 'r1' ? '救援成功！大家搬去總匯總部' : '委託完成！救出來的孩子在候補名冊') : '回收容所…', 420, 362) }
    if (P.arenaView) P.arenaView(ctx, A);
  }
  function drawHero(ctx) {
    const h = A.hero, H = h.H; let f, rot = 0;
    if (h.down) { if (H.down) f = H.down; else { f = H.idle[0]; rot = 1.4 } }
    else if (h.swing > 0) f = heroAtkFrame(H, H.dur - h.swing);
    else if (H.hurt && now() - h.hurtT < .22) f = H.hurt;
    else if (h.moving) f = H.run[Math.floor(A.t / H.rt) % H.run.length];
    else f = H.idle[Math.floor(A.t / H.it) % H.idle.length];
    h.frame = f;
    const img = IMG['hero_' + f]; shadowE(ctx, h.x - A.cam, h.y, 40, 0); ctx.save(); ctx.translate(h.x - A.cam, h.y); if (h.face < 0) ctx.scale(-1, 1); if (rot) { ctx.rotate(rot) }
    // 緩速：英雄整體微蒼（降飽和＋略亮），不加光暈
    const slowed = heroSlowed(h) && !h.down, stunned = heroStunned(h) && !h.down;
    if (slowed && 'filter' in ctx) ctx.filter = 'saturate(.35) brightness(1.12)';
    if (P.art.imageOK(img)) ctx.drawImage(img, -200, -284); ctx.restore();
    if (h.hidden > now()) P.art.px(ctx, P.art.BOX, h.x - A.cam - 36, h.y - 100, 6);
    if (slowed || stunned) drawHeroStatus(ctx, h, slowed, stunned);
  }
  // 三杯兔子普通箭：照主遊戲 m27 arPx（黑框、淺色箭身 36×3、箭頭、紅色尾羽）＋白色拖尾，整數座標。
  function drawHeroArrow(ctx, sx, sy, dir) {
    const x = Math.round(sx), y = Math.round(sy), p = 3, L = 36, th = 3;
    ctx.save(); ctx.translate(x, y); if (dir < 0) ctx.scale(-1, 1);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,255,255,${(.5 * (1 - i / 6)).toFixed(2)})`; ctx.fillRect(-L - 16 - i * 16, -2, 16, 4) }
    ctx.fillStyle = '#1A1016'; ctx.fillRect(-L - p, -th / 2 - p, L + p, th + 2 * p); ctx.fillRect(0, -p * 3, p * 3, p * 6);
    ctx.fillStyle = 'rgb(240,240,250)'; ctx.fillRect(-L, -th / 2, L, th);
    ctx.fillStyle = 'rgb(230,230,240)'; ctx.fillRect(0, -p * 2, p, p * 4); ctx.fillRect(p, -p, p, p * 2); ctx.fillRect(p * 2, -p / 2, p, p);
    ctx.fillStyle = 'rgb(200,60,60)'; ctx.fillRect(-L, -p * 2, p * 3, p); ctx.fillRect(-L, p, p * 3, p);
    ctx.restore();
  }
  // 點陣狀態標示：緩速＝腳邊兩條灰藍網線＋頭上「緩」；暈眩＝頭上三顆 4px 方星繞圈＋「暈」。全部整數座標、無模糊。
  function drawHeroStatus(ctx, h, slowed, stunned) {
    const x = Math.round(h.x - A.cam), y = Math.round(h.y);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (slowed) {
      ctx.fillStyle = '#b8d4e8';
      for (let i = -3; i <= 3; i++) { ctx.fillRect(x + i * 10 - 2, y - 6, 4, 4); ctx.fillRect(x + i * 10 + 3, y - 1, 4, 4) }
    }
    if (stunned) {
      for (let i = 0; i < 3; i++) {
        const a = A.t * 6 + i * 2.094, sx = Math.round(x + Math.cos(a) * 30), sy = Math.round(y - 250 + Math.sin(a) * 8);
        ctx.fillStyle = '#1A1016'; ctx.fillRect(sx - 4, sy - 4, 8, 8); ctx.fillStyle = '#ffe066'; ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
    }
    const tag = stunned ? '暈' : '緩';
    ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 12, y - 292, 24, 22);
    ctx.fillStyle = stunned ? '#ffe066' : '#b8d4e8'; ctx.fillText(tag, x - 8, y - 275);
    ctx.restore();
  }
  function drawPet(ctx) {
    const pet = A.pet, pi = A.pi; let act = pet.hurt > now() ? 'hurt' : pet.cast > now() ? 'cast' : pet.moving || 'idle';
    const sc = 1.6 * (pet.giantU > now() ? 2 : 1);
    shadowE(ctx, pet.x - A.cam, pet.y, 26, 0);
    P.art.draw(ctx, { sp: pi.sp, tier: pi.tier, star: pi.star }, pet.x - A.cam, pet.y, { act, t: pet.t, flip: pet.face < 0, scale: sc, appear: A.t });
  }
  function drawCage(ctx, c) {
    if (A.quest && A.quest.id === 'r1' && P.drawR1RescueCage && P.drawR1RescueCage(ctx, c, A)) return;
    if (P.drawRescueCage && P.drawRescueCage(ctx, c, A)) return;
    const x = c.x - A.cam;
    if (c.hp > 0) { P.art.draw(ctx, { sp: c.sp, tier: c.tier || 0 }, x, c.y, { act: 'sleep', t: A.t, scale: 1.4 }); ctx.fillStyle = '#1A1016'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 50 + i * 20, c.y - 90, 4, 92); ctx.fillRect(x - 54, c.y - 94, 108, 6); ctx.fillRect(x - 54, c.y, 108, 6); ctx.fillStyle = '#ffd54a'; ctx.fillRect(x - 8, c.y - 50, 16, 14) }
    else if (c.freed) { c.freed.t += 1 / 60; const fx = x - c.freed.t * 60; if (c.freed.t < 4) P.art.draw(ctx, { sp: c.sp, tier: c.tier || 0, star: c.star }, fx, c.y, { act: 'happy', t: A.t, scale: 1.4, flip: true, appear: c.freed.t }) }
    ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#fff'; if (c.hp > 0) ctx.fillText(P.SP[c.sp].name, x - 20, c.y + 24);
  }
  function drawPixEnemy(ctx, e, x) {
    const meta = PIX[e.K.pix], SS = MON_SS, flash = e.flash && now() < e.flash;
    const alpha = e.dead && meta.motion === 'drag' ? Math.max(0, Math.min(1, (DRAG_DEATH - (now() - e.dragDownAt)) / .35)) : e.dead && meta.motion === 'net' ? Math.max(0, Math.min(1, (1 - (now() - e.netDownAt)) / .35)) : e.dead && meta.motion ? Math.max(0, Math.min(1, (CAGE_DEATH - (now() - e.cageDownAt)) / .35)) : 1;
    ctx.save(); ctx.globalAlpha *= alpha; shadowE(ctx, x, e.y, 36, 0); ctx.restore();
    let img, pose = '', bob = 0, rot = 0, ring = null;
    if (meta.motion === 'drag') {
      pose = String(dragPose(e)).padStart(2, '0');
      img = IMG[(flash && !e.dead ? 'f' : 's') + '_drag_' + pose];
    } else if (meta.motion === 'net') {
      pose = String(netPose(e)).padStart(2, '0');
      img = IMG[(flash && !e.dead ? 'f' : 's') + '_net_' + pose];
    } else if (meta.motion) {
      pose = String(cagePose(e)).padStart(2, '0');
      img = IMG[(flash && !e.dead ? 'f' : 's') + '_cage_' + pose];
    } else if (meta.key) {
      img = IMG[meta.key];
      if (flash) img = ringImg(img, [255, 255, 255], meta.key + '_fl') || img;
      if (e.act === 'walk') bob = Math.floor(e.t / 0.14) % 2;
      if (e.act === 'atk') rot = 4.5; // 尚無專用攻擊格，沿用 mon.js 出招時微傾
    } else {
      pose = golemPose(e);
      img = IMG[(flash ? 'f_' : 's_') + 'golem_' + pose];
      if (e.act === 'walk' && meta.bow) bob = Math.floor(e.t / 0.14) % 2;
    }
    const glow = e.elite ? [255, 60, 40, Math.floor(110 + 50 * Math.sin(A.t * 5 + e.id))] : null;
    if (glow) ring = meta.motion === 'drag' ? ringImg(IMG['g_drag_' + pose], glow, 'g_drag_' + pose) : meta.motion === 'net' ? ringImg(IMG['g_net_' + pose], glow, 'g_net_' + pose) : meta.motion ? ringImg(IMG['g_cage_' + pose], glow, 'g_cage_' + pose) : meta.key ? ringImg(IMG[meta.key], glow, meta.key + '_gl') : ringImg(IMG['g_golem_' + pose], glow, 'g_' + pose);
    const flip = meta.face === 'L' ? e.face > 0 : e.face < 0;
    pixSpr(ctx, img, x, e.y, meta, { flip, flash, dy: bob, rot, glow, ring, alpha });
  }
  function drawGrum(ctx, e, x) {
    const act = GRUM[e.act] ? e.act : 'idle', meta = GRUM[act];
    const t = e.dead ? now() - (e.exitUntil - 1.160) : (e.gt || 0);
    const loop = act === 'idle' || act === 'walk';
    const frame = loop ? Math.floor(t / meta[1]) % meta[0] : Math.min(meta[0] - 1, Math.max(0, Math.floor((t + 1e-7) / meta[1])));
    const suffix = '_grum_' + act + '_' + String(frame).padStart(2, '0');
    const image = IMG[(e.flash > now() && !e.dead ? 'f' : 's') + suffix];
    shadowE(ctx, x, e.y, 57, 0);
    if (!P.art.imageOK(image)) return;
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(e.y));
    if (e.face > 0) ctx.scale(-1, 1);
    if (e.elite) { ctx.globalAlpha = (110 + 50 * Math.sin(A.t * 5 + e.id)) / 255; const glow = IMG['g' + suffix]; if (P.art.imageOK(glow)) ctx.drawImage(glow, -160, -300); ctx.globalAlpha = 1; }
    ctx.drawImage(image, -160, -300); ctx.restore();
  }
  function drawEnemy(ctx, e) {
    const x = e.x - A.cam;
    if (e.K.grum) { drawGrum(ctx, e, x); return; }
    if (e.poly) { const rows = e.poly.skin === 'pig' ? P.art.PIG : e.poly.skin === 'chick' ? P.art.CHICK : P.art.MOUSE; const s = isBoss(e) ? 8 : 4; ctx.save(); ctx.translate(x, e.y); if (e.ptgt && e.ptgt.x < e.x) ctx.scale(-1, 1); P.art.px(ctx, rows, -rows[0].length * s / 2, -rows.length * s, s); ctx.restore(); if (isBoss(e)) { ctx.fillStyle = '#ffd54a'; ctx.fillRect(x - 20, e.y - rows.length * s - 16, 40, 10) } return }
    if (e.K.pix) {
      ctx.save(); if (e.st.dance > now()) { ctx.translate(x, e.y); ctx.rotate(Math.sin(A.t * 12) * .15); ctx.translate(-x, -e.y) }
      if (e.st.float > now()) ctx.translate(0, -40);
      drawPixEnemy(ctx, e, x); ctx.restore();
      if (e.dead) return;
    } else {
    let anim = e.act === 'atk' ? (MON[e.K.sheet].anims[e.atkName] ? e.atkName : e.K.atkA) : e.act === 'hit' ? 'hit' : e.act === 'walk' ? 'walk' : 'idle';
    let sc = monVis(e);
    const t = e.act === 'atk' ? (1 - e.wind / (isBoss(e) ? 1 : .7)) * 1.2 : e.t;
    ctx.save(); if (e.st.dance > now()) { ctx.translate(x, e.y); ctx.rotate(Math.sin(A.t * 12) * .15); ctx.translate(-x, -e.y) }
    if (e.st.float > now()) ctx.translate(0, -40);
    sheetDraw(ctx, e, anim, t, sc); ctx.restore();
    }
    if (e.st.float > now()) { ctx.strokeStyle = '#bdf'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, e.y - 90, 70, 0, 7); ctx.stroke() }
    const tag = [e.st.sleep > now() && 'Zzz', e.st.dance > now() && '♪', e.st.glue > now() && '黏住', e.st.stun > now() && '暈', e.st.slip > now() && '滑倒', e.st.spin > now() && '轉圈', e.st.taunt > now() && '追寵物', e.st.lure && e.st.lure.u > now() && '♥骨頭', e.st.bound && e.st.bound.u > now() && '毛線'].filter(Boolean).join(' ');
    const head = monHead(e), barY = e.y - head - 10;
    const bw = isBoss(e) ? 0 : 70; if (bw) { ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 36, barY, 72, 8); ctx.fillStyle = e.elite ? '#ffb030' : '#e04848'; ctx.fillRect(x - 35, barY + 1, 70 * e.hp / e.max, 6) }
    if (tag) { ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#ffe'; ctx.fillText(tag, x - 20, barY - 6) }
  }
  // 觸控搖桿
  (function () {
    const st = document.getElementById('stick'), kn = document.getElementById('knob'), ab = document.getElementById('atkBtn'); if (!st) return;
    let id = null; const set = (x, y) => { kn.style.left = 45 + x * 45 + 'px'; kn.style.top = 45 + y * 45 + 'px'; P.stick = { x: Math.abs(x) > .25 ? Math.sign(x) : 0, y: Math.abs(y) > .25 ? Math.sign(y) : 0 } };
    const mvh = e => { const r = st.getBoundingClientRect(); let x = (e.clientX - r.left - 75) / 75, y = (e.clientY - r.top - 75) / 75; const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d } set(x, y) };
    st.addEventListener('pointerdown', e => { id = e.pointerId; st.setPointerCapture(id); mvh(e) }); st.addEventListener('pointermove', e => { if (e.pointerId === id) mvh(e) });
    const up = () => { id = null; set(0, 0) }; st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    ab.addEventListener('pointerdown', e => { e.preventDefault(); P.stickAtk = 1 }); ab.addEventListener('pointerup', () => P.stickAtk = 0); ab.addEventListener('pointercancel', () => P.stickAtk = 0);
  })();
  P.arenaApi = { heavy: () => A && heavy(), use: () => A && useSkills(), pdmg: (mul) => { const e = A && nearest(A.pet.x, A.pet.y, null, 3000); return e ? pdmg(e, mul || 1, "測試") : 0 }, spawn: (k, el) => A && spawn(k, A.hero.x + 300, null, el), skill: n => { if (!A) return; const def = n <= 7 ? SKILL.elem : SKILL[n]; if (!def) return '這個技能在測試場還沒做效果'; const e = nearest(A.pet.x, A.pet.y, null, 1500); if (!A.pi.sk.includes(n)) A.pi.sk.push(n); def.run(n, e); A.cd[n] = now() + Math.max(1, cdOf(n)); return '' }, resetCd: () => { if (A) A.cd = {} }, heal: () => { if (A) { A.hero.hp = A.hero.max; A.hero.down = 0 } }, implemented: n => n <= 7 || !!SKILL[n] || [22, 23, 24, 54, 58, 59, 61, 64, 66, 67, 68, 69, 71, 31].includes(n) };
})(window.PET);
