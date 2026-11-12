// 2026-11-12 使用者核可的 v2 道具與紅眼礦道分層（只接本機 pettest）。
// 圖檔一律原樣複製自 out/art_v2_1112/final/，程式不改像素、只做整數座標最近鄰繪製。
// 座標全是世界座標；腳點＝圖內底中錨點（見 ART_TODO 21–31 與新五件）。行走帶 y430–680。
// 不新增救援籠、不改關卡解鎖、不改籠子／角色／寵物圖。
'use strict';
(function (P) {
  const R = 'assets/stages/rescue/', E = 'assets/stages/redeye/';
  const SRC = {
    fence: R + 'r1/r1_broken_fence.png',        // 128×96  腳(64,90)
    bowl: R + 'r1/r1_overturned_bowl.png',      // 32×24   腳(16,22)
    order: R + 'r1/r1_purchase_order.png',      // 32×32   腳(16,30)
    track: R + 'r2/r2_wheeltrack.png',          // 256×64  左上；左右可接；只有雙輪痕，路面不隨條
    cloth: R + 'r2/r2_torn_cloth.png',          // 32×32   腳(16,30) 暗赭紅：獵犬叼回的線索
    rag: R + 'r2/old_linen_rag.png',            // 32×32   腳(16,30) 灰褐舊麻布：路邊雜物，和線索碎布分開
    trunk: R + 'r2/fallen_trunk.png',           // 192×96  腳(96,90) 只放後緣
    frame: R + 'r2/drag_frame.png',             // 128×128 不含輪、不含籠；車轅在左
    wheel0: R + 'r2/drag_frame_wheel_0.png',    // 32×32   軸心(16,16)
    wheel1: R + 'r2/drag_frame_wheel_1.png',    // 32×32   第0格轉30°
    rail: R + 'r3/r3_rail.png',                 // 256×48  左上；左右可接
    feather: R + 'r4/r4_black_feather.png',     // 32×32   腳(16,30)
    re_sky: E + 'redeye_sky.png',               // 1280×720 RGB 左右無縫
    re_hills: E + 'redeye_hills.png',           // 1280×720 透明 左右無縫
    re_bld: E + 'redeye_buildings.png',         // 2560×720 世界(0,0)，y406 以下全透明
    re_ground: E + 'redeye_ground.png',         // 2560×320 不透明，世界(0,400)
  };
  const IM = {};
  for (const k in SRC) IM[k] = P.art && P.art.lazyImage ? P.art.lazyImage(SRC[k]) : null;
  const ok = im => !!(im && P.art && P.art.imageOK(im));
  P.STAGE_ART_1112 = { SRC, IM };

  // 小道具：[圖鍵, 腳點x, 腳點y, 圖內錨點x, 圖內錨點y]，均錯落、不排成整齊一列，不擋籠子正面。
  const PROPS = {
    r1: [
      ['fence', 236, 458, 64, 90],   // 左後緣破柵：院子被闖過的一角，在英雄出生點(200,560)後方，不堵十籠
      ['order', 286, 652, 16, 30],   // 收購訂單掉在英雄出生點右前方，開場就看得到
      ['bowl', 1182, 604, 16, 22],   // 倒碗在右側空地，口朝右，離最右籠(1088,525)一段距離
    ],
    r2: [
      ['cloth', 590, 476, 16, 30],   // 線索碎布：第一籠(680,548)左後方草邊（設計稿「叼出碎布求救的孩子」）
      ['rag', 1298, 462, 16, 30],    // 舊麻布：路後緣，第二籠前一段
      ['rag', 1986, 664, 16, 30],    // 舊麻布：拖籠架前方路緣，前後錯開
      ['trunk', 2440, 446, 96, 90],  // 倒木轉彎：只占後緣；第三籠(2180,512)右後方
    ],
    r3: [],
    r4: [
      ['feather', 820, 466, 16, 30], // 黑羽毛：路邊後緣，在城堡馬車(1600,460)之前先看見
    ],
  };
  // 拖籠架（空架、無籠）：r2 第三籠旁停放。腳點＝裝輪後的輪底。
  // 架上輪軸 (34,104)、(94,104)；輪圖軸心 (16,16) → 輪圖左上 (18,88)、(78,88)；裝輪後底 y118 → 腳點 (64,118)。
  P.DRAG_FRAME_AXLES = [[34, 104], [94, 104]];
  P.DRAG_FRAME_FOOT = [64, 118];
  P.DRAG_FRAME_AT = { r2: { x: 1936, y: 470, moving: false } };
  // 地面貼條：每關一條、從世界 x0 起左右拼接到世界寬；y 為左上角世界座標。
  const STRIPS = {
    r2: { k: 'track', y: 520 },  // ART_TODO 21：建議 y520
    r3: { k: 'rail', y: 566 },   // ART_TODO 22：建議 y566
  };
  P.STAGE_PROPS_1112 = PROPS; P.STAGE_STRIPS_1112 = STRIPS;

  const qid = A => (A && A.quest && A.quest.id) || '';

  // 拖籠架合成：先畫架，再把兩輪疊在軸點上（輪轂蓋住架上的軸座）。
  // moving 時兩格輪每 1/8 秒交替；停放時固定第 0 格。
  P.drawDragFrame = function (ctx, fx, fy, opt) {
    opt = opt || {};
    if (!ctx || !ok(IM.frame)) return false;
    const ox = Math.round(fx - P.DRAG_FRAME_FOOT[0]), oy = Math.round(fy - P.DRAG_FRAME_FOOT[1]);
    const wf = opt.moving ? (Math.floor((opt.t || 0) * 8) % 2) : 0;
    const wheel = wf ? IM.wheel1 : IM.wheel0;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(IM.frame, ox, oy);
    if (ok(wheel)) for (const [ax, ay] of P.DRAG_FRAME_AXLES) ctx.drawImage(wheel, ox + ax - 16, oy + ay - 16);
    ctx.restore();
    return true;
  };

  function drawStrip(ctx, im, y, cam, worldW) {
    const w = im.naturalWidth || im.width; if (!w) return;
    const x0 = Math.max(0, Math.floor(cam / w) * w), x1 = Math.min(worldW, cam + 1280);
    for (let x = x0; x < x1; x += w) ctx.drawImage(im, Math.round(x - cam), y);
  }

  // 地面貼條（在背景之後、人物排序之前畫，永遠在腳下）
  P.drawRescueStageDecals = function (ctx, A) {
    const s = STRIPS[qid(A)]; if (!s || !ok(IM[s.k])) return false;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    drawStrip(ctx, IM[s.k], s.y, A.cam || 0, A.stageW || 2600);
    ctx.restore();
    return true;
  };

  // 疊加在 pet_update_1111 的 r4 馬車之上：保留原本道具，再加這批小道具（依腳點 y 參與前後排序）。
  const prevProps = P.rescueStageProps;
  P.rescueStageProps = function (ctx, A) {
    const out = prevProps ? prevProps(ctx, A) : [];
    const id = qid(A);
    for (const [k, x, y, ax, ay] of (PROPS[id] || [])) {
      out.push({ y, k, x, draw: () => { if (!ok(IM[k])) return; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(IM[k], Math.round(x - ax - (A.cam || 0)), Math.round(y - ay)); ctx.restore() } });
    }
    const df = P.DRAG_FRAME_AT[id];
    if (df) out.push({ y: df.y, k: 'drag_frame', x: df.x, draw: () => P.drawDragFrame(ctx, df.x - (A.cam || 0), df.y, { moving: df.moving, t: A.t || 0 }) });
    return out;
  };

  // 紅眼礦道分層（W4）。pettest 目前沒有紅眼礦道關卡，也不開放；這裡只提供繪製函式，
  // 等關卡落地時由該關呼叫。視差：深坑底色 0.15、遠洞 0.35（兩張 1280 左右無縫重複），洞壁與地面 1.0。
  P.REDEYE_W = 2560;
  P.REDEYE_PARALLAX = { sky: 0.15, hills: 0.35, buildings: 1, ground: 1 };
  P.drawRedeyeBg = function (ctx, cam) {
    if (!ctx || !ok(IM.re_sky) || !ok(IM.re_bld) || !ok(IM.re_ground)) return false;
    cam = Math.max(0, Math.min(P.REDEYE_W - 1280, cam || 0));
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const loop = (im, f) => { const w = im.naturalWidth || 1280; let x = -(Math.round(cam * f) % w); for (; x < 1280; x += w) ctx.drawImage(im, x, 0) };
    loop(IM.re_sky, P.REDEYE_PARALLAX.sky);
    if (ok(IM.re_hills)) loop(IM.re_hills, P.REDEYE_PARALLAX.hills);
    ctx.drawImage(IM.re_bld, -Math.round(cam), 0);      // y406 以下全透明，不蓋地面
    ctx.drawImage(IM.re_ground, -Math.round(cam), 400); // 地面原點 (0,400)，行走帶 y430–680
    ctx.restore();
    return true;
  };
})(window.PET);
