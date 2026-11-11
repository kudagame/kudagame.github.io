// r1 蜜糖之家保衛戰：1280 寬試裝背景＋分層鐵籠。尚未接上 3200 長卷，鏡頭在 r1 鎖在 0。
// 鐵籠一律用使用者原圖 128×128 四態（後片→寵物→前欄），r1–r4 錯落擺放，不另改尺寸。
'use strict';
(function (P) {
  const SRC = {
    upper: 'assets/stages/rescue/r1/upper.png',
    ground: 'assets/stages/rescue/r1/ground.png',
    fg: 'assets/stages/rescue/r1/foreground.png',
    back: 'assets/stages/rescue/cage/back.png',
    fronts: [
      'assets/stages/rescue/cage/front_closed.png',
      'assets/stages/rescue/cage/front_loose.png',
      'assets/stages/rescue/cage/front_half.png',
      'assets/stages/rescue/cage/front_open.png',
    ],
  };
  const IMG = { fronts: [] };
  if (P.art && P.art.lazyImage) {
    IMG.upper = P.art.lazyImage(SRC.upper);
    IMG.ground = P.art.lazyImage(SRC.ground);
    IMG.fg = P.art.lazyImage(SRC.fg);
    IMG.back = P.art.lazyImage(SRC.back);
    SRC.fronts.forEach((s, i) => { IMG.fronts[i] = P.art.lazyImage(s) });
  }
  const ok = im => P.art && P.art.imageOK(im);
  const isR1 = A => !!(A && A.quest && A.quest.id === 'r1');
  const CAGE = 128, FLOOR_Y = 110, PET_SC = 1.4;
  // 錯落腳點（行走帶 y430–680）。r1 收在 1280 試裝畫面內，避開前景角落柵欄；不排成整齊兩排。
  const SLOTS = {
    r1: [
      [348, 588], [455, 518], [518, 655], [612, 548], [698, 628],
      [778, 512], [848, 658], [918, 555], [1010, 638], [1088, 525],
    ],
    // r2 山谷舊路（預設世界寬 2600）：三籠沿路錯開深淺
    r2: [
      [680, 548], [1420, 636], [2180, 512],
    ],
    // r3 礦坑口：兩籠一前一後，不並排
    r3: [
      [1080, 524], [2020, 642],
    ],
    // r4 最後的籠車：三籠錯落，仍用 128×128 鐵籠（不用 220×160 尖刺籠車套在每個小籠上）
    r4: [
      [1260, 632], [1880, 518], [2360, 598],
    ],
  };

  function cageState(c) {
    if (c.hp > 0) return (c.hp / (c.maxHp || 3) <= 0.5) ? 1 : 0; // 鎖鬆：已損超過約一半
    const t = c.freed ? c.freed.t : 1;
    return t < 0.4 ? 2 : 3; // 剛打開：門半開，之後全開
  }

  P.rescueStagePrepare = function (A) {
    if (!(A && A.quest)) return;
    const id = A.quest.id;
    if (isR1(A)) A.stageW = 1280; // 試裝只有 1280 寬，鏡頭鎖在原點，不左右捲、也不拼貼
    const slots = SLOTS[id];
    if (!slots) return;
    A.cages.forEach((c, i) => {
      const s = slots[i] || slots[slots.length - 1] || [400 + (i % 4) * 160, 500 + Math.floor(i / 4) * 75];
      c.x = s[0]; c.y = s[1];
      if (!c.maxHp) c.maxHp = c.hp || 3;
    });
  };

  P.drawRescueStageBg = function (ctx, A) {
    if (!isR1(A)) return false;
    if (!ok(IMG.upper) || !ok(IMG.ground)) return false;
    const x = Math.round(-A.cam);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(IMG.upper, x, 0);
    ctx.drawImage(IMG.ground, x, 400);
    return true;
  };

  P.drawRescueStageFg = function (ctx, A) {
    if (!isR1(A) || !ok(IMG.fg)) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(IMG.fg, Math.round(-A.cam), 0);
  };

  function drawLayeredCage(ctx, c, A) {
    if (!ok(IMG.back)) return false;
    const st = cageState(c), front = IMG.fronts[st];
    const x = c.x - A.cam;
    const dx = Math.round(x - CAGE / 2), dy = Math.round(c.y - FLOOR_Y);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(IMG.back, dx, dy);
    if (c.hp > 0) {
      P.art.draw(ctx, { sp: c.sp, tier: c.tier || 0 }, x, c.y, { act: 'sleep', t: A.t, scale: PET_SC });
    } else if (c.freed) {
      c.freed.t += 1 / 60;
      // 籠門朝右開，孩子往右跑出來
      const fx = x + c.freed.t * 60;
      if (c.freed.t < 4) P.art.draw(ctx, { sp: c.sp, tier: c.tier || 0, star: c.star }, fx, c.y, { act: 'happy', t: A.t, scale: PET_SC, appear: c.freed.t });
    }
    if (ok(front)) ctx.drawImage(front, dx, dy);
    ctx.restore();
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#fff';
    if (c.hp > 0 && P.SP[c.sp]) ctx.fillText(P.SP[c.sp].name, x - 20, c.y + 24);
    return true;
  }

  P.drawR1RescueCage = function (ctx, c, A) {
    if (!isR1(A)) return false;
    return drawLayeredCage(ctx, c, A);
  };

  // r2–r4（以及 r1 的後援路徑）共用同一套 128×128 四態鐵籠
  P.drawRescueCage = function (ctx, c, A) {
    if (!(A && A.quest)) return false;
    return drawLayeredCage(ctx, c, A);
  };
})(window.PET);
