// 測試場：主角＋同行寵物＋幾隻小怪（救援關／一般／王戰）。寵物不會受傷、不會倒下。
'use strict';
(function (P) {
  const UI = P.ui || (P.ui = {}), C = P.CFG, SC = P.scenes = P.scenes || {};
  const IMG = {}; const li = s => { const i = P.art.lazyImage(s); return i };
  ['idle', 'run0', 'run1', 'run2', 'run3', 'swing', 'windup'].forEach(f => IMG['h_' + f] = li(`assets/hero/s_kudas_${f}.png`));
  const MON = window.PET_MON || {}; for (const k in MON) IMG['m_' + k] = li(`assets/mon/${k}_sheet.png`);
  const KIND = {
    minion: { sheet: 'spider_minion', hp: 20000, atk: 350, spd: 70, rng: 100, sc: 1, atkA: 'attack', gold: 67, xp: 1 },
    axe: { sheet: 'ether_axe', hp: 35000, atk: 600, spd: 55, rng: 110, sc: 1.25, atkA: 'chop', gold: 67, xp: 1 },
    archer: { sheet: 'ether_archer', hp: 18000, atk: 300, spd: 50, rng: 520, sc: 1.25, atkA: 'shoot', gold: 67, xp: 1, ranged: 1 },
    boss: { sheet: 'gem_looter', hp: 900000, atk: 1800, spd: 45, rng: 170, sc: 1.15, atkA: 'cleave', gold: 3000, xp: 20, boss: 1 },
  };
  let A = null;  // 這一場的狀態
  const now = () => A.t;
  const rnd = Math.random, ri = P.ri;
  const W = 2600, GY0 = 430, GY1 = 680;
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
    { const ow = pi.ow || {}; s.spd += (ow.spd || 0) / 100; s.dr += ow.dr || 0; s.exp += ow.exp || 0; s.gold += ow.gold || 0 }   // 主人分到的寵物能力（不加傷害）
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
    const K = KIND[kind]; const e = { id: ++A.nid, kind, K, x, y: y || ri(GY0, GY1), hp: K.hp * (elite ? 3 : 1), max: K.hp * (elite ? 3 : 1), elite: !!elite, face: -1, st: {}, t: rnd() * 2, act: 'walk', at: 0, wind: 0, polyN: 0, dots: [] };
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
    txt(e.x + ri(-20, 20), e.y - 100 * e.K.sc, (crit ? '暴擊 ' : '') + d.toLocaleString(), crit ? '#ffd54a' : (col || '#fff'), crit);
    if (src !== 'link' && e.st.bound && e.st.bound.u > now() && !e.st.bound.o.dead) hit(e.st.bound.o, d * 0.3, 'link', '', '#f99');
    if (e.poly && !isBoss(e) && (e.poly.perm || e.elite)) e.hp = 0;   // 變成老鼠／小豬：打 1 下就倒（菁英照血量，這裡也一下）
    if (!disabled(e) && e.act !== 'atk') { e.act = 'hit'; e.actU = now() + 0.25 }
    if (e.hp <= 0) kill(e, src, crit);
    return d;
  }
  function drop(kind, x, y, n) { A.drops.push({ kind, x: x + ri(-30, 30), y: y + ri(-10, 10), n, z: 0, vz: 220, t: 0 }) }
  function petFood(n) { if (A.extra >= A.extraCap) return 0; n = Math.min(n, A.extraCap - A.extra); n = P.extraFoodOk(n); A.extra += n; return n }
  function kill(e, src, crit) {
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
    49: { trig: () => nearest(A.pet.x, A.pet.y, null, 500), run: (n, e) => { pdmg(e, 1.2, '平底鍋'); if (!isBoss(e)) e.st.stun = now() + (e.elite ? .8 : 2); A.fx.push({ k: 'pan', x: e.x, y: e.y - 130 * e.K.sc, t: 0, life: .6 }); txt(e.x, e.y - 150, '噹！', '#fff', 1) } },
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
      const hpMax = Math.round(C.heroHp * (1 + ((A.pi.ow || {}).hp || 0) / 100)); A.hero = { x: 200, y: 560, hp: hpMax, max: hpMax, face: 1, atk: 0, swing: 0, inv: 0, buf: {}, hidden: 0 };
      A.pet = { x: 140, y: 580, t: 0, face: 1, atkT: 2, cast: 0, hurt: 0, giantU: 0 };
      A.quest = mode === 'rescue' ? P.QU[(o && o.quest) || 'r1'] : null;
      if (A.quest) P.questCages(A.quest).forEach((c, i) => A.cages.push({ x: 520 + i * 200, y: 470 + (i % 3) * 70, hp: 3, sp: c.sp, tier: c.tier, star: c.star }));
      A.waves = A.quest ? A.quest.waves.map(w => w.slice()) : mode === 'boss' ? [['minion', 'minion', 'archer', 'axe'], ['boss', 'minion', 'minion']] : [['minion', 'minion', 'minion', 'archer'], ['axe', 'minion', 'archer', 'minion', 'minion'], ['axe', 'axe!', 'archer', 'minion', 'minion', 'minion']];
      nextWave();
      UI.bar([['🏳️ 回收容所', () => end(false), 'bad'], ['🤖 自動戰鬥', () => { A.auto ^= 1; UI.toast(A.auto ? '自動戰鬥：開' : '自動戰鬥：關') }], [P.aidLabel ? P.aidLabel(0, C.foodSlot) : '🍞 叫援助', () => { if (A.food >= C.foodSlot) { A.food = 0; A.hero.hp = Math.min(A.hero.max, A.hero.hp + A.hero.max * .3); txt(A.hero.x, A.hero.y - 170, '援助角色來了！', '#ffd', 1) } else UI.toast('食物槽還沒滿') }]]);
      document.querySelector('#pad').classList.toggle('hide', !matchMedia('(pointer:coarse)').matches);
      log(`進入測試場（${mode}），同行：${A.pi.name}（${P.TIER_NAME[A.pi.tier]}），技能：${A.pi.sk.map(n => P.SK[n].name).join('、') || '無'}`);
      P.arena = A;
    },
    leave() { document.querySelector('#pad').classList.add('hide'); P.arena = null },
    update(dt) { if (!A) return; if (A.over) { A.overT -= dt; if (A.overT <= 0 && !A.left) { A.left = 1; P.go('shelter') } return } A.t += dt; step(dt) },
    draw(ctx) { if (A) render(ctx) },
    tap(x, y) { },
    key(c) { if (c === 'KeyJ' || c === 'Space' || c === 'KeyZ') attack() },
    hud() { if (!A) return ''; const h = A.hero; { const bt = [...document.querySelectorAll('#bar button')].find(x => /叫援助/.test(x.textContent)); if (bt && P.aidLabel) { const t = P.aidLabel(A.food, C.foodSlot); if (bt.textContent !== t) bt.textContent = t; bt.style.opacity = A.food >= C.foodSlot ? 1 : .5; bt.classList.toggle('ready', A.food >= C.foodSlot) } } return `<span>❤️ ${Math.max(0, Math.round(h.hp))}/${h.max}</span><span>🍽️ 食物槽 ${A.food}/${C.foodSlot}</span><span>🍞 這場 +${A.bread}（寵物額外 ${A.extra}/${A.extraCap}）</span><span>⚔️ 第 ${A.wave}/${A.waves.length} 波｜擊倒 ${A.kills}</span><span>🐾 ${UI.esc(A.pi.name)}</span>` },
  };
  function nextWave() {
    const w = A.waves[A.wave]; if (!w) return false; A.wave++;
    const bx = A.mode === 'rescue' ? 500 + A.wave * 600 : A.hero.x + 500;
    w.forEach((k, i) => { const el = k.endsWith('!'); spawn(el ? k.slice(0, -1) : k, Math.min(W - 80, bx + i * 70 + ri(0, 60)), null, el) });
    txt(A.hero.x, A.hero.y - 200, `第 ${A.wave} 波`, '#fff', 1); return true;
  }
  function attack() { const h = A.hero; if (h.swing > 0 || h.down) return; h.swing = .38; h.hitDone = 0 }
  function stickVec() { return P.stick || { x: 0, y: 0 } }
  function step(dt) {
    const h = A.hero, pet = A.pet, hs = heroStat(), K = P.keys;
    // 主角移動
    let mx = (K.ArrowRight || K.KeyD ? 1 : 0) - (K.ArrowLeft || K.KeyA ? 1 : 0), my = (K.ArrowDown || K.KeyS ? 1 : 0) - (K.ArrowUp || K.KeyW ? 1 : 0);
    const sv = stickVec(); if (sv.x || sv.y) { mx = sv.x; my = sv.y }
    if (P.stickAtk) attack();
    if (A.auto && !mx && !my) {
      const tgt = A.cages.find(c => c.hp > 0 && Math.abs(c.x - h.x) < 900 && !A.en.some(e => !e.dead && Math.abs(e.x - h.x) < 500)) || nearest(h.x, h.y, e => !(e.poly && isBoss(e)) || 1, 2000);
      if (tgt) { const dx = tgt.x - h.x - (tgt.hp != null && tgt.K ? 0 : 0), dy = tgt.y - h.y; if (Math.abs(dx) > 90 || Math.abs(dy) > 25) { mx = Math.sign(dx) * (Math.abs(dx) > 90 ? 1 : 0); my = Math.sign(dy) * (Math.abs(dy) > 25 ? 1 : 0) } else { h.face = Math.sign(dx) || h.face; attack() } }
      else if (A.mode === 'rescue' && A.cages.some(c => c.hp > 0)) mx = 1;
    }
    if (h.swing <= 0 && !h.down) { const sp = 260 * hs.spd; h.x += mx * sp * dt; h.y += my * sp * .6 * dt; if (mx) h.face = Math.sign(mx) }
    h.x = Math.max(40, Math.min(W - 40, h.x)); h.y = Math.max(GY0, Math.min(GY1, h.y)); h.moving = !!(mx || my);
    if (h.swing > 0) { h.swing -= dt; if (h.swing < .22 && !h.hitDone) { h.hitDone = 1; heroHit(hs) } }
    if (h.regen && h.regen.u > now()) h.hp = Math.min(h.max, h.hp + h.regen.v * dt);
    if (h.shield && h.shield.u < now()) h.shield = null;
    A.cam += ((h.x - 640) - A.cam) * Math.min(1, dt * 5); A.cam = Math.max(0, Math.min(W - 1280, A.cam));
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
      if (e.poly && e.poly.u < now()) { e.poly = null; poof(e.x, e.y - 40); if (e.chick) continue }
      if (e.pendPoly && e.act !== 'atk') { e.poly = { skin: e.pendPoly.skin, u: now() + e.pendPoly.sec }; poof(e.x, e.y - 60); e.pendPoly = null }
      for (const d of e.dots) if (d.u > now()) { d.acc = (d.acc || 0) + d.dps * dt; if (d.acc > 300) { const v = d.acc; d.acc = 0; hit(e, v, 'pet', '', d.c) } } e.dots = e.dots.filter(d => d.u > now()); if (e.dead) continue;
      let spd = e.K.spd * (e.st.slow && e.st.slow.u > now() ? 1 - e.st.slow.v : 1);
      if (e.poly) { e.wx = e.wx || e.x; if (!e.ptgt || rnd() < dt * .8) e.ptgt = { x: e.x + ri(-200, 200), y: ri(GY0, GY1) }; mv(e, e.ptgt.x, e.ptgt.y, 140 * dt); continue }
      if (disabled(e)) { e.act = 'idle'; if (e.wind) e.wind = 0; continue }
      if (e.act === 'hit' && e.actU > now()) continue;
      for (const z of A.zones) if (z.k === 'star' && z.u > now() && Math.hypot(z.x - e.x, (z.y - e.y) * 2) < z.r) { if (!(e.st.slow && e.st.slow.u > now() && e.st.slow.v > (isBoss(e) ? .05 : .15))) e.st.slow = { u: now() + 2, v: isBoss(e) ? .05 : .15 }; if (!z.hit) { z.hit = 1; A.starHits = (A.starHits || 0) + 1 } }
      for (const z of A.zones) if (z.k === 'banana' && z.u > now() && Math.hypot(z.x - e.x, z.y - e.y) < 40 && !z.used) { z.used = 1; if (isBoss(e)) txt(e.x, e.y - 220, '差點滑倒', '#ffd'); else { e.st.slip = now() + (e.elite ? .6 : 1.2); txt(e.x, e.y - 100, '滑倒！', '#ffd') } }
      if (e.st.fear > now()) { mv(e, e.x + Math.sign(e.x - h.x || 1) * 100, e.y, spd * 1.5 * dt); continue }
      if (e.st.lure && e.st.lure.u > now()) { mv(e, e.st.lure.x + ri(-30, 30), e.st.lure.y, spd * 1.4 * dt); e.act = 'walk'; continue }
      const tgt = e.st.taunt > now() ? pet : h;
      if (h.hidden > now() && tgt === h) { e.act = 'idle'; if (rnd() < dt) e.face *= -1; continue }
      if (e.act === 'atk') { e.wind -= dt; if (e.wind <= 0) { e.act = 'walk'; e.at = now() + (isBoss(e) ? 2.2 : 1.6); enemyStrike(e, tgt) } continue }
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
      else if (p.arrow) { p.x += p.vx * dt; const t = p.tgt; if (Math.abs(t.x - p.x) < 30 && Math.abs(t.y - 50 - p.y) < 50) { p.life = 0; if (t === h) heroHurt(p.dmg, p.src); else petHurt() } }
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
    if (!alive) { if (!nextWave()) { if (A.mode !== 'rescue' || A.cages.every(c => c.hp <= 0)) end(true) } }
    if (alive && A.mode === 'rescue' && A.wave < A.waves.length && A.cages.filter(c => c.hp <= 0).length >= Math.ceil(A.cages.length * A.wave / A.waves.length)) nextWave();
  }
  function mv(e, x, y, v) { const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy); if (d < 2) return; e.x += dx / d * Math.min(v, d); e.y += dy / d * Math.min(v, d) * .7; e.y = Math.max(GY0, Math.min(GY1, e.y)); e.x = Math.max(20, Math.min(W - 20, e.x)) }
  function heroHit(hs) {
    const h = A.hero; let any = 0;
    for (const e of A.en) { if (e.dead) continue; const dx = (e.x - h.x) * h.face; if (dx > -20 && dx < 150 * (isBoss(e) ? 1.3 : 1) && Math.abs(e.y - h.y) < 45) { const crit = rnd() * 100 < hs.crit; let d = C.heroAtk * hs.atk * (crit ? 1 + hs.cdmg / 100 : 1) * (.9 + rnd() * .2); hit(e, d, 'hero', '', '#fff', crit); any = 1; A.ult = Math.min(100, A.ult + 1) } }
    for (const c of A.cages) { if (c.hp <= 0) continue; const dx = (c.x - h.x) * h.face; if (dx > -20 && dx < 150 && Math.abs(c.y - h.y) < 50) { c.hp--; txt(c.x, c.y - 120, c.hp > 0 ? '喀！' : '打開了！', '#fff', 1); if (c.hp <= 0) { const p = P.rescue(c.sp, { tier: c.tier, star: c.star, quest: A.quest && A.quest.id }); c.freed = { p, t: 0 }; poof(c.x, c.y - 40) } } }
  }
  function enemyStrike(e, tgt) {
    let dmg = e.K.atk * (e.elite ? 1.5 : 1) * (e.atkName === 'slam' ? 1.9 : 1);
    if (e.st.atkDown && e.st.atkDown.u > now()) dmg *= 1 - e.st.atkDown.v;
    if (e.K.ranged) { A.pr.push({ x: e.x, y: e.y - 60, vx: Math.sign(tgt.x - e.x) * 520, arrow: 1, tgt, dmg, src: e, life: 2 }); return }
    const reach = e.K.rng * 1.2; const h = A.hero, pet = A.pet;
    if (Math.abs(pet.x - e.x) < reach && Math.abs(pet.y - e.y) < 50) petHurt();
    if (tgt === h && Math.abs(h.x - e.x) < reach && Math.abs(h.y - e.y) < 50) heroHurt(dmg, e);
  }
  function petHurt() { A.pet.hurt = now() + .45 }   // 寵物被打到：只閉眼，不扣血、不倒下
  function heroHurt(dmg, e) {
    const h = A.hero; if (h.down || P.arenaGod) { if (P.arenaGod) txt(h.x, h.y - 150, '無敵', '#aaa'); return }
    const hs = heroStat(); if (rnd() * 100 < hs.dodge) { txt(h.x, h.y - 150, '閃避', '#9cf'); return }
    dmg *= 1 - hs.dr / 100; dmg = Math.min(dmg, h.max * .65);   // 單一傷害最多 65%
    if (h.shield) { const a = Math.min(h.shield.v, dmg); h.shield.v -= a; dmg -= a; if (h.shield.v <= 0) h.shield = null; txt(h.x, h.y - 180, '泡泡吸收 ' + Math.round(a), '#bdf') }
    dmg = Math.round(dmg); h.hp -= dmg; txt(h.x, h.y - 150, '-' + dmg, '#ff6b6b');
    if (dmg >= h.max * .2) heavy();
    if (h.hp <= 0) {
      if (has(31) && !A.used31) { A.used31 = 1; h.hp = h.max * .25; h.inv = now() + .6; txt(h.x, h.y - 190, '起來呀！', '#ffd', 1); log('#31 起來呀！'); return }
      h.hp = 0; h.down = 1; heavy(); txt(h.x, h.y - 190, '倒下了…', '#f66', 1); log('主角倒下'); setTimeout(() => A && end(false), 1500);
    }
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
  // ---------- 畫面 ----------
  function sheetDraw(ctx, e, anim, t, sc) {
    const m = MON[e.K.sheet], img = IMG['m_' + e.K.sheet]; if (!m || !P.art.imageOK(img)) return;
    const a = m.anims[anim] || m.anims.idle; const f = a.frames[Math.floor(t * (a.fps || 8)) % a.frames.length];
    const faceL = (m.face || 'L') === 'L'; const flip = faceL ? e.face > 0 : e.face < 0;
    const [ax, ay] = m.anchor || [m.frame_w / 2, m.frame_h];
    ctx.save(); ctx.translate(e.x - A.cam, e.y); if (flip) ctx.scale(-1, 1); ctx.scale(sc, sc);
    ctx.drawImage(img, f.x, f.y, f.w, f.h, -ax, -ay, f.w, f.h); ctx.restore();
  }
  function render(ctx) {
    const cam = A.cam;
    ctx.fillStyle = '#3d2f45'; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#5a4466'; for (let i = 0; i < 12; i++) { const x = ((i * 260 - cam * .4) % 3120 + 3120) % 3120 - 200; ctx.fillRect(x, 200, 120, 200) }
    ctx.fillStyle = '#6b8f4e'; ctx.fillRect(0, 400, 1280, 320); ctx.fillStyle = '#5c7d42'; for (let x = -((cam) % 80); x < 1280; x += 80) ctx.fillRect(x, 400, 40, 320);
    ctx.fillStyle = '#1A1016'; ctx.fillRect(0, 398, 1280, 4);
    for (const z of A.zones) { const x = z.x - cam; if (z.k === 'star') { const a = Math.max(0, (z.u - now()) / 2.5); ctx.fillStyle = `rgba(255,236,140,${(.25 + .5 * a).toFixed(2)})`; for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x - 18 + i * 11), Math.round(z.y - 4 - (i % 2) * 7), 4, 4) } if (z.k === 'glue') { ctx.fillStyle = 'rgba(255,140,190,.55)'; ctx.beginPath(); ctx.ellipse(x, z.y, z.r, z.r * .35, 0, 0, 7); ctx.fill() } if (z.k === 'banana' && !z.used) P.art.px(ctx, P.art.BANANA, x - 8, z.y - 12, 2); if (z.k === 'bone') P.art.px(ctx, P.art.BONE, x - 8, z.y - 10, 3) }
    const objs = [];
    A.cages.forEach(c => objs.push({ y: c.y, f: () => drawCage(ctx, c) }));
    A.en.forEach(e => { if (!e.dead) objs.push({ y: e.y, f: () => drawEnemy(ctx, e) }) });
    objs.push({ y: A.hero.y, f: () => drawHero(ctx) }); objs.push({ y: A.pet.y, f: () => drawPet(ctx) });
    A.drops.forEach(d => objs.push({ y: d.y, f: () => P.art.px(ctx, d.kind === 'gold' ? P.art.COIN : P.art.BREAD, d.x - cam - 8, d.y - 14 - d.z, 3) }));
    objs.sort((a, b) => a.y - b.y).forEach(o => o.f());
    for (const p of A.pr) { const x = p.x - cam; if (p.snow) { ctx.fillStyle = '#eef6ff'; ctx.strokeStyle = '#1A1016'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, p.y - p.r / 2, p.r, 0, 7); ctx.fill(); ctx.stroke() } else if (p.arrow) { ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 14, p.y - 2, 28, 4) } else { ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 7, p.y - 7, 14, 14); ctx.fillStyle = p.c; ctx.fillRect(x - 5, p.y - 5, 10, 10) } }
    for (const f of A.fx) {
      const x = f.x - cam, k = f.t / f.life;
      if (f.k === 'txt') { ctx.globalAlpha = 1 - k * k; ctx.font = `bold ${f.big ? 24 : 17}px sans-serif`; ctx.lineWidth = 4; ctx.strokeStyle = '#1A1016'; ctx.strokeText(f.s, x - ctx.measureText(f.s).width / 2, f.y - k * 40); ctx.fillStyle = f.col; ctx.fillText(f.s, x - ctx.measureText(f.s).width / 2, f.y - k * 40); ctx.globalAlpha = 1 }
      if (f.k === 'poof') { ctx.fillStyle = '#eee'; ctx.globalAlpha = 1 - k; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const r = 10 + k * 40; ctx.fillRect(x + Math.cos(a) * r - 6, f.y + Math.sin(a) * r * .6 - 6, 12, 12) } ctx.globalAlpha = 1 }
      if (f.k === 'pan') P.art.px(ctx, P.art.PAN, x - 15, f.y - (1 - k) * 60, 3);
    }
    // 血條、食物槽、寵物技能冷卻
    const h = A.hero; ctx.fillStyle = '#1A1016'; ctx.fillRect(16, 56, 304, 22); ctx.fillStyle = '#e04848'; ctx.fillRect(18, 58, 300 * Math.max(0, h.hp) / h.max, 18); if (h.shield) { ctx.fillStyle = '#bde'; ctx.fillRect(18, 58, 300 * h.shield.v / h.max, 6) }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(`苦達斯 ${Math.round(Math.max(0, h.hp))}`, 24, 73);
    for (let i = 0; i < C.foodSlot; i++) { ctx.globalAlpha = i < A.food ? 1 : .3; P.art.px(ctx, P.art.BREAD, 330 + i * 30, 58, 3); ctx.globalAlpha = 1 }
    const boss = A.en.find(e => isBoss(e) && !e.dead); if (boss) { ctx.fillStyle = '#1A1016'; ctx.fillRect(390, 90, 504, 20); ctx.fillStyle = '#c050ff'; ctx.fillRect(392, 92, 500 * boss.hp / boss.max, 16); ctx.fillStyle = '#fff'; ctx.fillText('王：寶石劫掠者（測試用）', 400, 106) }
    let y = 100; ctx.font = '13px sans-serif';
    for (const n of A.pi.sk) { const s = P.SK[n], r = Math.max(0, (A.cd[n] || 0) - now()); ctx.fillStyle = 'rgba(26,16,22,.7)'; ctx.fillRect(16, y - 14, 230, 19); ctx.fillStyle = r > 0 ? '#aaa' : '#a8e6a1'; ctx.fillText(`#${n} ${s.name} ${(SKILL[n] || n <= 7 || (s.use && s.use.some(u => u[0] <= 7 || SKILL[u[0]]))) ? (r > 0 ? r.toFixed(0) + 's' : '就緒') : '（還沒做）'}`, 20, y); y += 21 }
    for (const k in h.buf) { const b = h.buf[k]; if (b.u > now()) { ctx.fillStyle = '#ffe6a0'; ctx.fillText(`▲ ${b.name}`, 20, y); y += 18 } }
    if (A.over) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 300, 1280, 100); ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(A.mode === 'rescue' && A.cages.every(c => c.hp <= 0) ? (A.quest && A.quest.id === 'r1' ? '救援成功！大家搬去總匯總部' : '委託完成！救出來的孩子在候補名冊') : '回收容所…', 420, 362) }
    if (P.arenaView) P.arenaView(ctx, A);
  }
  function drawHero(ctx) {
    const h = A.hero; let f = 'idle'; if (h.swing > .22) f = 'windup'; else if (h.swing > 0) f = 'swing'; else if (h.moving) f = 'run' + (Math.floor(A.t * 10) % 4);
    const img = IMG['h_' + f]; ctx.save(); ctx.translate(h.x - A.cam, h.y); if (h.face < 0) ctx.scale(-1, 1); if (h.down) { ctx.rotate(1.4) }
    if (P.art.imageOK(img)) ctx.drawImage(img, -200, -284); ctx.restore();
    if (h.hidden > now()) P.art.px(ctx, P.art.BOX, h.x - A.cam - 36, h.y - 100, 6);
  }
  function drawPet(ctx) {
    const pet = A.pet, pi = A.pi; let act = pet.hurt > now() ? 'hurt' : pet.cast > now() ? 'cast' : pet.moving || 'idle';
    const sc = 1.6 * (pet.giantU > now() ? 2 : 1);
    P.art.draw(ctx, { sp: pi.sp, tier: pi.tier, star: pi.star }, pet.x - A.cam, pet.y, { act, t: pet.t, flip: pet.face < 0, scale: sc, appear: A.t });
  }
  function drawCage(ctx, c) {
    const x = c.x - A.cam;
    if (c.hp > 0) { P.art.draw(ctx, { sp: c.sp, tier: c.tier || 0 }, x, c.y, { act: 'sleep', t: A.t, scale: 1.4 }); ctx.fillStyle = '#1A1016'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 50 + i * 20, c.y - 90, 4, 92); ctx.fillRect(x - 54, c.y - 94, 108, 6); ctx.fillRect(x - 54, c.y, 108, 6); ctx.fillStyle = '#ffd54a'; ctx.fillRect(x - 8, c.y - 50, 16, 14) }
    else if (c.freed) { c.freed.t += 1 / 60; const fx = x - c.freed.t * 60; if (c.freed.t < 4) P.art.draw(ctx, { sp: c.sp, tier: c.tier || 0, star: c.star }, fx, c.y, { act: 'happy', t: A.t, scale: 1.4, flip: true, appear: c.freed.t }) }
    ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#fff'; if (c.hp > 0) ctx.fillText(P.SP[c.sp].name, x - 20, c.y + 24);
  }
  function drawEnemy(ctx, e) {
    const x = e.x - A.cam;
    if (e.poly) { const rows = e.poly.skin === 'pig' ? P.art.PIG : e.poly.skin === 'chick' ? P.art.CHICK : P.art.MOUSE; const s = isBoss(e) ? 8 : 4; ctx.save(); ctx.translate(x, e.y); if (e.ptgt && e.ptgt.x < e.x) ctx.scale(-1, 1); P.art.px(ctx, rows, -rows[0].length * s / 2, -rows.length * s, s); ctx.restore(); if (isBoss(e)) { ctx.fillStyle = '#ffd54a'; ctx.fillRect(x - 20, e.y - rows.length * s - 16, 40, 10) } return }
    let anim = e.act === 'atk' ? (MON[e.K.sheet].anims[e.atkName] ? e.atkName : e.K.atkA) : e.act === 'hit' ? 'hit' : e.act === 'walk' ? 'walk' : 'idle';
    let sc = e.K.sc * (e.st.shrink && e.st.shrink.u > now() ? e.st.shrink.s : 1) * (e.elite ? 1.15 : 1);
    const t = e.act === 'atk' ? (1 - e.wind / (isBoss(e) ? 1 : .7)) * 1.2 : e.t;
    ctx.save(); if (e.st.dance > now()) { ctx.translate(x, e.y); ctx.rotate(Math.sin(A.t * 12) * .15); ctx.translate(-x, -e.y) }
    if (e.st.float > now()) ctx.translate(0, -40);
    sheetDraw(ctx, e, anim, t, sc); ctx.restore();
    if (e.st.float > now()) { ctx.strokeStyle = '#bdf'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, e.y - 90, 70, 0, 7); ctx.stroke() }
    const tag = [e.st.sleep > now() && 'Zzz', e.st.dance > now() && '♪', e.st.glue > now() && '黏住', e.st.stun > now() && '暈', e.st.slip > now() && '滑倒', e.st.spin > now() && '轉圈', e.st.taunt > now() && '追寵物', e.st.lure && e.st.lure.u > now() && '♥骨頭', e.st.bound && e.st.bound.u > now() && '毛線'].filter(Boolean).join(' ');
    const bw = isBoss(e) ? 0 : 70; if (bw) { ctx.fillStyle = '#1A1016'; ctx.fillRect(x - 36, e.y - 128 * e.K.sc, 72, 8); ctx.fillStyle = e.elite ? '#ffb030' : '#e04848'; ctx.fillRect(x - 35, e.y - 127 * e.K.sc, 70 * e.hp / e.max, 6) }
    if (tag) { ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#ffe'; ctx.fillText(tag, x - 20, e.y - 135 * e.K.sc) }
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
