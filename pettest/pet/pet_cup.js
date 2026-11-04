// 大會會場（背景 chars/pets/scenes/build_contest.py）：村祭＝村莊小賽、城鎮大會＝季節盃、王都大會＝王國名盃、王都夜場＝傳說大會。
// 在櫃檯「🏆 大會」報名 → 結果照舊由 P.cupRun 算好（獎品已經發了），這裡只把它演出來：開場 → 每一輪比賽 → 頒獎台（前三名）或第一輪落敗。
'use strict';
(function (P) {
  P.CUP_VENUE = { v: { k: 'village', music: 'village', name: '村祭' }, s: { k: 'town', music: 'town', name: '城鎮大會' }, k: { k: 'royal', music: 'royal', name: '王都大會' }, l: { k: 'royal_night', music: 'royal', name: '王都夜場' } };
  P.CUP_LAY = {   // 跟 contest_layout.json 一致：兩條跑道 y（自己／對手）、起點終點 x、頒獎台三階（冠軍、亞軍、季軍）腳下的位置
    village: { lanes: [520, 600], x: [140, 900], pod: [[1131, 344], [1086, 376], [1214, 414]] },
    town: { lanes: [540, 620], x: [120, 860], pod: [[1090, 418], [1006, 446], [1178, 462]] },
    royal: { lanes: [560, 630], x: [120, 900], pod: [[1106, 468], [1038, 496], [1196, 514]] },
  };
  P.CUP_T = { intro: 2.2, round: 4.2, award: 6 };
  P.CUP_ACT = { run: 'race', hurdle: 'race', long: 'race', tug: 'tug', hunt: 'hunt', show: 'show' };
  let K = null;
  P.cupVenue = c => P.CUP_VENUE[c || (K && K.r.I.c) || 'v'] || P.CUP_VENUE.v;
  // 時間表：[{ k: 'intro'｜'round'｜'award'｜'out', i, t0, t1 }]
  P.cupPlan = r => { const T = P.CUP_T, ph = [{ k: 'intro', t0: 0, t1: T.intro }]; let t = T.intro;
    r.rounds.forEach((x, i) => { ph.push({ k: 'round', i, t0: t, t1: t + T.round }); t += T.round });
    ph.push({ k: r.place <= 3 ? 'award' : 'out', t0: t, t1: t + T.award }); return ph };
  // 頒獎台：[冠軍, 亞軍, 季軍]，每個 { me } 或 { f: { n, sp } }
  const OTHER = [{ n: '石橋邊的阿石', sp: 'fox' }, { n: '老街的團子', sp: 'rabbit' }, { n: '果園的蘋果', sp: 'cat' }];
  P.cupPodium = r => { const R = r.rounds, used = new Set(R.map(x => x.f.n)), other = OTHER.find(o => !used.has(o.n)) || OTHER[0];
    if (r.place === 1) return [{ me: 1 }, { f: R[2].f }, { f: R[1].f }];
    if (r.place === 2) return [{ f: R[2].f }, { me: 1 }, { f: R[1].f }];
    if (r.place === 3) return [{ f: R[1].f }, { f: other }, { me: 1 }];
    return [] };
  // 比賽中兩隻的位置（0～1）：贏的那隻 u=1 時到終點，輸的照分數比例落後
  P.cupRace = (x, u) => { const w = x.win, a = Math.max(0.01, w ? x.op : x.me), b = Math.max(0.01, w ? x.me : x.op), lose = Math.min(0.94, a / b);
    const e = u < 0 ? 0 : u > 1 ? 1 : u; return w ? { me: e, op: e * lose } : { me: e * lose, op: e } };
  // P5：司儀台詞（報名當下一次挑好，畫面只照著念；結果還是 cupRun 決定的）
  P.cupScript = (r, name) => { const say = P.cupSay || (() => ''), v = { pet: name, ev: r.ev.name, cup: r.I.name, ed: r.I.ed };
    return { intro: say('intro_' + r.I.c, v), rounds: r.rounds.map((x, i) => ({ start: say('r' + i, Object.assign({ foe: x.f.n }, v)), end: say(x.win ? 'win' : 'lose', Object.assign({ foe: x.f.n }, v)) })),
      fin: r.place <= 3 ? say('pl' + r.place, v) : say('out', v), rank: r.rankUp ? say('rank', Object.assign({ rank: P.RANK[r.rankUp] }, v)) : '' } };
  P.scenes = P.scenes || {};
  if (!P.ui || typeof Image === 'undefined') return;   // 以下是畫面
  const UI = P.ui, IMG = {}; for (const k of ['village', 'town', 'royal', 'royal_night']) { const im = new Image(); im.src = `assets/scenes/contest/${k}_bg.jpg`; IMG[k] = im }
  const ok = im => im && im.complete && im.naturalWidth > 0, PL = ['', '🥇 冠軍', '🥈 亞軍', '🥉 季軍', '', '第一輪落敗'];
  function tag(ctx, t, x, y, col, big) { if (P.art && P.art.tagBox) { P.art.tagBox(ctx, t, x, y, { size: big ? 22 : 15, pad: 7, h: big ? 30 : 22, col: col || '#fff', s: 2, st: [2, 1] }); return } ctx.font = `bold ${big ? 22 : 15}px sans-serif`; const w = ctx.measureText(t).width + 14, h = big ? 30 : 22; ctx.fillStyle = 'rgba(26,16,22,.8)'; ctx.fillRect(x - w / 2, y - h + 5, w, h); ctx.fillStyle = col || '#fff'; ctx.fillText(t, x - w / 2 + 7, y) }
  function medal(ctx, x, y, col) { ctx.fillStyle = '#c82832'; ctx.fillRect(x - 9, y - 26, 7, 18); ctx.fillStyle = '#2850c8'; ctx.fillRect(x + 2, y - 26, 7, 18); ctx.fillStyle = '#28180f'; ctx.fillRect(x - 12, y - 10, 24, 24); ctx.fillStyle = col; ctx.fillRect(x - 9, y - 7, 18, 18); ctx.fillStyle = '#fffbe6'; ctx.fillRect(x - 6, y - 4, 4, 4) }
  function wrap(ctx, t, w) { const out = []; let cur = ''; for (const ch of t) { if (ctx.measureText(cur + ch).width > w && cur) { out.push(cur); cur = ch } else cur += ch } if (cur) out.push(cur); return out }
  const OWL = { sp: 'owl', tier: 1, star: 0 };
  function mc(ctx, t, lt) {   // 司儀小貓頭鷹（左上的小台子）＋對話框
    if (!t) return; const A = P.art, x = 96, y = 238;
    ctx.fillStyle = '#6b4224'; ctx.fillRect(x - 34, y - 6, 68, 14); ctx.fillStyle = '#4a2c16'; ctx.fillRect(x - 26, y + 8, 52, 40);
    if (A && A.ready) A.draw(ctx, OWL, x, y - 4, { act: 'idle', t: lt, scale: 1.4 });
    ctx.font = '20px sans-serif'; const L = wrap(ctx, t, 700), h = 34 + L.length * 26, bx = 160, by = 150;
    ctx.fillStyle = 'rgba(255,250,236,.94)'; ctx.fillRect(bx, by, 740, h); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(bx, by, 740, 3); ctx.fillRect(bx, by + h - 3, 740, 3);
    ctx.beginPath(); ctx.moveTo(bx, by + 30); ctx.lineTo(bx - 18, by + 44); ctx.lineTo(bx, by + 46); ctx.fillStyle = 'rgba(255,250,236,.94)'; ctx.fill();
    ctx.fillStyle = '#8a5a2a'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('🦉 司儀 小貓頭鷹', bx + 12, by + 20);
    ctx.fillStyle = '#3a2414'; ctx.font = '20px sans-serif'; L.forEach((l, i) => ctx.fillText(l, bx + 12, by + 46 + i * 26)) }
  function board(ctx, r, upto, lt) {   // 右上小計分板：三輪的結果（還沒比的是灰的）
    const x = 1060, y = 96, NM = ['第一輪', '準決賽', '決賽']; ctx.fillStyle = 'rgba(26,16,22,.9)'; ctx.fillRect(x, y, 200, 108);
    ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#ffe36b'; ctx.fillText('🏁 對戰表', x + 10, y + 22);
    NM.forEach((n, i) => { const rd = r.rounds[i], done = rd && (i < upto || (i === upto && lt >= 3.2)); ctx.font = '15px sans-serif';
      ctx.fillStyle = !rd ? '#a89ca2' : done ? (rd.win ? '#9fe08a' : '#ff9a9a') : i === upto ? '#fff' : '#b8aeb2';
      ctx.fillText(`${n}　${!rd ? '沒比到' : done ? (rd.win ? '○ 贏' : '× 輸') : i === upto ? '比賽中…' : '等待'}`, x + 14, y + 48 + i * 22) }) }
  const NF = () => '';   // 夜場有火把照著，寵物不壓暗（canvas filter 在慢的機器上很吃效能）
  function pet(ctx, p, x, y, act, t, flip, sc) { const A = P.art; if (!(A && A.ready)) return; const f = NF(); if (f) ctx.filter = f; A.draw(ctx, p, x, y, { act, t, flip, scale: sc || (p.baby ? 1.6 : 2) }); if (f) ctx.filter = 'none'; if (p.id && p.wear && P.ui3 && P.ui3.drawWear) P.ui3.drawWear(ctx, p.wear, x, y - (p.baby ? 58 : 84) * (sc || 2) / 2, sc || 2) }
  const FT = { v: 0, s: 1, k: 2, l: 3 }, foe = f => ({ sp: f.sp, tier: FT[K.r.I.c] || 0, star: 0 });
  function bar() { const b = []; if (!K.done) b.push(['⏩ 看結果', () => { K.t = Math.max(K.t, K.plan[K.plan.length - 1].t0) }]);
    else b.push(['⬅ 回收容所', () => P.go('shelter')], ['🏆 再報名', () => P.ui3.cup()], ['🏅 獎牌室', () => P.go('room', 'medals')]); UI.bar(b) }
  P.scenes.contest = {
    enter(arg) { const p = arg && P.byId(arg.id); if (!p || !arg.r || !arg.r.ok) return P.go('shelter'); const v = P.cupVenue(arg.r.I.c);
      K = { p, r: arg.r, v, lay: P.CUP_LAY[v.k.replace('_night', '')], t: 0, plan: P.cupPlan(arg.r), done: false, stung: false, conf: null, say: P.cupScript(arg.r, P.label(p)) }; bar() },
    leave() { K = null },
    update(dt) { if (!K) return; K.t += dt; const last = K.plan[K.plan.length - 1];
      if (!K.stung && K.t >= last.t0) { K.stung = true; if (last.k === 'award' && P.bgm && P.bgm.sting) P.bgm.sting('j_pet_award') }
      if (!K.done && K.t >= last.t0 + 1.5) { K.done = true; bar() } },
    draw(ctx) {
      if (!K) return; const bg = IMG[K.v.k]; if (ok(bg)) ctx.drawImage(bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#c9a46a'; ctx.fillRect(0, 0, 1280, 720) }
      const r = K.r, ph = K.plan.find(x => K.t < x.t1) || K.plan[K.plan.length - 1], L = K.lay, [x0, x1] = L.x, [ly0, ly1] = L.lanes, me = K.p, lt = K.t - ph.t0;
      tag(ctx, `第 ${r.I.ed} 屆${r.I.name}｜${r.ev.name}`, 640, 70, '#ffe36b', true);
      if (ph.k === 'intro') { pet(ctx, me, x0, ly0, 'idle', K.t, false); tag(ctx, P.label(me), x0, ly0 + 28); mc(ctx, K.say.intro, K.t); return }
      if (ph.k === 'round') { const x = r.rounds[ph.i], o = foe(x.f), u = Math.min(1, lt / 3.2), kind = P.CUP_ACT[r.ev.k] || 'race', fin = lt >= 3.2;
        tag(ctx, `${x.name}：對上 ${x.f.n}（${P.SP[x.f.sp] ? P.SP[x.f.sp].name : ''}）`, 640, 112, '#fff');
        mc(ctx, fin ? K.say.rounds[ph.i].end : K.say.rounds[ph.i].start, K.t); board(ctx, r, ph.i, lt);
        if (kind === 'race') { const q = P.cupRace(x, u), hop = r.ev.k === 'hurdle' ? k => -Math.abs(Math.sin(k * Math.PI * 4)) * 34 : () => 0;
          if (r.ev.k === 'hurdle') { ctx.fillStyle = '#6b4224'; for (let j = 1; j <= 4; j++) { const hx = x0 + (x1 - x0) * (j - 0.5) / 4; for (const ly of [ly0, ly1]) { ctx.fillRect(hx - 3, ly - 30, 6, 30); ctx.fillRect(hx - 18, ly - 32, 36, 8) } } }
          ctx.fillStyle = '#fff'; ctx.fillRect(x1 + 40, ly0 - 60, 6, ly1 - ly0 + 70);
          const mx = x0 + (x1 - x0) * q.me, ox = x0 + (x1 - x0) * q.op, act = fin ? null : r.ev.k === 'long' ? 'walk' : 'run';
          pet(ctx, me, mx, ly0 + hop(q.me), act || (x.win ? 'happy' : 'idle'), K.t, false); pet(ctx, o, ox, ly1 + hop(q.op), act || (x.win ? 'idle' : 'happy'), K.t + 0.4, false);
          tag(ctx, P.label(me), mx, ly0 + 28); tag(ctx, x.f.n, ox, ly1 + 28, '#cfe3ff') }
        else if (kind === 'tug') { const c = 560 + (fin ? (x.win ? -60 : 60) : Math.sin(lt * 5) * 12 + (x.win ? -1 : 1) * u * 40), y = (ly0 + ly1) / 2;
          ctx.fillStyle = '#8a5a2a'; ctx.fillRect(c - 140, y - 46, 280, 7); ctx.fillStyle = '#c82832'; ctx.fillRect(c - 4, y - 52, 8, 18); ctx.fillStyle = '#fff'; ctx.fillRect(556, y - 70, 8, 70);
          pet(ctx, me, c - 150, y, fin ? (x.win ? 'happy' : 'hurt') : 'attack', K.t, false); pet(ctx, o, c + 150, y, fin ? (x.win ? 'hurt' : 'happy') : 'attack', K.t + 0.3, true);
          tag(ctx, P.label(me), c - 150, y + 28); tag(ctx, x.f.n, c + 150, y + 28, '#cfe3ff') }
        else if (kind === 'hunt') { const mx = 360 + Math.sin(lt * 1.3) * 140, ox = 720 + Math.cos(lt * 1.1) * 140;
          pet(ctx, me, mx, ly0, fin ? (x.win ? 'happy' : 'idle') : 'walk', K.t, Math.cos(lt * 1.3) < 0); pet(ctx, o, ox, ly1, fin ? (x.win ? 'idle' : 'happy') : 'walk', K.t, Math.sin(lt * 1.1) > 0);
          if (fin) { const wx = x.win ? mx : ox, wy = (x.win ? ly0 : ly1) - 110; ctx.fillStyle = '#6b4224'; ctx.fillRect(wx - 16, wy, 32, 22); ctx.fillStyle = '#ffd54a'; ctx.fillRect(wx - 16, wy - 6, 32, 8); ctx.fillRect(wx - 3, wy + 4, 6, 6) }
          tag(ctx, P.label(me), mx, ly0 + 28); tag(ctx, x.f.n, ox, ly1 + 28, '#cfe3ff') }
        else { const y = (ly0 + ly1) / 2, turn = Math.floor(lt / 0.8) % 2;   // 才藝表演：輪流上場
          pet(ctx, me, 500, y, fin ? (x.win ? 'happy' : 'idle') : turn ? 'idle' : 'cast', K.t, false); pet(ctx, o, 780, y, fin ? (x.win ? 'idle' : 'happy') : turn ? 'cast' : 'idle', K.t, true);
          if (fin) { ctx.font = '28px sans-serif'; const hx = x.win ? 500 : 780; for (let j = 0; j < 3; j++) ctx.fillText('❤', hx - 40 + j * 30, y - 130 - Math.sin(K.t * 4 + j) * 6) }
          tag(ctx, P.label(me), 500, y + 28); tag(ctx, x.f.n, 780, y + 28, '#cfe3ff') }
        if (fin) tag(ctx, `${x.win ? '贏了！' : '輸了'}　${x.me} ： ${x.op}`, 640, 300, x.win ? '#ffe36b' : '#cfe3ff', true);
        return }
      if (ph.k === 'out') { pet(ctx, me, 640, ly0 + 20, 'idle', K.t, false); tag(ctx, P.label(me), 640, ly0 + 48);
        tag(ctx, `第一輪落敗　下次再加油！`, 640, 300, '#cfe3ff', true); mc(ctx, K.say.fin, K.t); board(ctx, r, 9, 9); if (r.got.length) tag(ctx, `收到：${r.got.join('、')}`, 640, 340); return }
      // 頒獎台
      const pod = P.cupPodium(r), cols = ['#ffc828', '#d2d6e0', '#cd7d3c'];
      pod.forEach((w, i) => { const [x, y] = L.pod[i], p = w.me ? me : foe(w.f); pet(ctx, p, x, y, i === 0 ? 'happy' : 'idle', K.t + i, i === 2, 1.5); if (lt > 0.6) medal(ctx, x + 14, y - 34, cols[i]);
        tag(ctx, w.me ? P.label(me) : w.f.n, x, y + 24 + (i === 1 ? -14 : 0), w.me ? '#ffe36b' : '#fff') });
      if (!K.conf) { let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280; K.conf = Array.from({ length: K.r.I.c === 'v' ? 30 : 70 }, () => ({ x: 900 + rnd() * 380, y: -rnd() * 300, v: 60 + rnd() * 80, c: ['#ffd54a', '#e8506a', '#5aa0ff', '#7ad06a', '#fff'][Math.floor(rnd() * 5)] })) }
      for (const c of K.conf) { const y = (c.y + lt * c.v) % 720; ctx.fillStyle = c.c; ctx.fillRect(c.x + Math.sin(lt * 3 + c.v) * 10, y, 6, 6) }
      tag(ctx, `${r.medal ? `🏅 ${r.medal.name}` : PL[r.place]}${r.rankUp ? `｜🎉 升到 ${P.RANK[r.rankUp]}！` : ''}`, 520, 300, '#ffe36b', true);
      if (r.got.length) tag(ctx, `收到：${r.got.join('、')}`, 520, 340);
      mc(ctx, K.say.rank && lt > 2.6 ? K.say.rank : K.say.fin, K.t);
    },
    tap() { if (K && !K.done) { const n = K.plan.find(x => K.t < x.t1); if (n && n.k === 'round' && K.t - n.t0 < 3.2) K.t = n.t0 + 3.2 } },   // 點一下＝這一輪直接看結果
    hud() { return K ? `<span>🏆 ${K.v.name}</span><span>${K.r.I.name}｜${K.r.ev.name}</span>` : '' },
  };
})(window.PET);
