// P4 介面：探險隊（魔物獵人物語 2 風格的派遣畫面）、育兒籃「爸媽之後」與爸媽開口想出門、彩虹月光露兌換、西施的含糊提示
'use strict';
(function (P) {
  const C = P.CFG, G = C.gen, UI = P.ui, U = P.ui3, esc = s => UI.esc(String(s == null ? '' : s)), fmt = n => Math.round(n).toLocaleString();
  const say = (who, t) => `<div class="card row2">${UI.npc(who)}<div class="grow"><b>${who}</b>：「${t}」</div></div>`;
  const ST_IMG = k => `assets/stages/${k}.png`, BG = s => `assets/stages/${s.k}_bg.jpg`;
  P.CAT_NAME.mut = P.CAT_NAME.mut || '突變'; P.CAT_NAME.mix = P.CAT_NAME.mix || '混合';
  // 寬面板：html 裡有 data-wide 就把右側面板拉寬
  const panel0 = UI.panel; UI.panel = (html, cb) => { const r = panel0(html, cb); const el = document.querySelector('#panel'); if (el) el.classList.toggle('wide', /data-wide/.test(html)); return r };
  const close0 = UI.close; UI.close = () => { const el = document.querySelector('#panel'); if (el) el.classList.remove('wide'); return close0() };

  // ---------- 探險隊 ----------
  const left = t => { const ms = Math.max(0, t - P.now()), h = Math.floor(ms / 3600000), m = Math.ceil(ms % 3600000 / 60000); return h ? `${h} 小時 ${m} 分` : `${m} 分` };
  const gaugeCol = r => r >= 80 ? '#5fd35f' : r >= 55 ? '#f3d27a' : '#ff6b6b';
  function expScreen() {
    const stagesOf = () => P.visibleStages ? P.visibleStages() : P.STAGES;
    let sk = (P.S.exp.lastSk && stagesOf().some(s => s.k === P.S.exp.lastSk)) ? P.S.exp.lastSk : (stagesOf()[0] && stagesOf()[0].k) || 'canyon', sel = [];
    const draw = () => {
      const S = P.S, stages = stagesOf();
      if (!stages.some(s => s.k === sk)) sk = (stages[0] && stages[0].k) || 'canyon';
      const st = P.ST[sk], [a, b] = P.partySize(st), pets = sel.map(P.byId).filter(Boolean), r = pets.length ? P.expRate(st, pets) : null;
      const all = S.pets.concat(S.babies);
      const list = stages.map(s => `<div class="xd ${s.k === sk ? 'on' : ''}" data-a="s" data-v="${s.k}"><div class="xth" style="background-image:url(${BG(s)})"><img class="xbo" src="${ST_IMG(s.boss[0])}" alt=""><span class="xno">${s.no}</span></div><div class="xin"><b>${esc(s.name)}</b><div class="xst">${'★'.repeat(s.star)}<span class="muted">${'★'.repeat(5 - s.star)}</span></div><div class="muted">建議戰力 ${s.req}｜⏱ ${s.h} 小時｜${(() => { const [x, y] = P.partySize(s); return x === y ? x + ' 隻' : x + '～' + y + ' 隻' })()}</div></div></div>`).join('');
      const slots = []; for (let i = 0; i < b; i++) { const p = pets[i]; slots.push(p ? `<div class="xs" data-a="p" data-v="${p.id}">${UI.av(p, 58)}<div class="xsp">${P.expPow(p)}</div></div>` : `<div class="xs empty ${i < a ? 'need' : ''}">${i < a ? '必要' : '可選'}</div>`) }
      const rate = r ? r.rate : 0;
      const loot = st.items.map(([ic, nm, k]) => `<span class="xl" title="${nm}"><img src="${ST_IMG(ic)}" alt="">${nm}</span>`).join('') + (st.disk ? `<span class="xl">💿 技能磁片 ${st.disk}%</span>` : '') + (st.chest ? `<span class="xl">🎁 王寶箱 ${st.chest}%</span>` : '') + (st.starF ? `<span class="xl">⭐ 星光碎片 ${st.starF}%</span>` : '') + (st.pollen && P.seen('pollen') ? `<span class="xl">🌕 月光露（偶爾）</span>` : st.pollen ? `<span class="xl">❔ 稀有的東西（偶爾）</span>` : '');
      const foes = st.foes.map(([ic, nm]) => `<span class="xf"><img src="${ST_IMG(ic)}" alt="">${esc(nm)}</span>`).join('');
      const pool = all.map(p => { const why = P.expWhyNot(p), on = sel.includes(p.id); return `<div class="xp ${on ? 'on' : ''} ${why ? 'no' : ''}" data-a="p" data-v="${p.id}" ${why ? 'data-why="' + esc(why) + '"' : ''}>${UI.av(p, 48)}<div class="xpn">${esc(P.label(p))}</div><div class="muted">${why || '戰力 ' + P.expPow(p)}</div></div>` }).join('');
      const teams = S.exp.teams.map(t => { const s = P.ST[t.sk], tot = t.until - t.start, pc = Math.max(0, Math.min(100, (P.now() - t.start) / tot * 100)); return `<div class="xt"><div class="xtt" style="background-image:url(${BG(s)})"></div><div class="grow"><b>🚶 ${esc(s.name)}</b><div class="row">${t.ids.map(i => P.byId(i) ? UI.av(P.byId(i), 34) : '').join('')}</div><div class="xbar"><i style="width:${pc}%"></i></div><div class="muted">還要 ${left(t.until)}（${UI.fmtTime(t.until)} 回來）</div></div></div>` }).join('');
      const back = (S.exp.log || []).slice(0, 3).map(l => { const s = P.ST[l.k] || P.STAGES.find(x => x.name === l.st) || P.STAGES[0]; return `<div class="xt back"><div class="xtt" style="background-image:url(${BG(s)})"></div><div class="grow"><b>${l.win ? '🎉' : '💦'} ${esc(l.st)}</b>${l.rare ? ' <span class="tag" style="background:#c9a0ff">稀有王</span>' : ''}<div class="row">${(l.ids || []).map(i => P.byId(i) ? UI.av(P.byId(i), 28) : (P.S.fam[i] ? UI.av(P.S.fam[i], 28) : '')).join('')}</div><div class="muted">${esc(l.ev || '')}</div><div class="muted">${(l.got || []).join('、') || '—'}</div></div></div>` }).join('');
      UI.panel(`<h2 data-wide>🗺️ 探險隊派遣板</h2>${say('獵犬', `汪！今天要去哪一關？同時最多 ${C.expTeams} 隊；成年的孩子都會全力出擊，小寶寶（出生未滿 3 天）跟正在陪主人出戰的不能去。沒成功也會帶安慰獎回來。`)}
        <div class="xw"><div class="xlist">${list}</div>
        <div class="xdet"><div class="xban" style="background-image:url(${BG(st)});${st.filter ? 'filter:' + st.filter : ''}"></div><div class="xbanin"><img class="xboss" src="${ST_IMG(st.boss[0])}" alt=""><div><div class="xno2">${st.no}・${st.en}</div><div class="xname">${esc(st.name)}</div><div class="xst">${'★'.repeat(st.star)}</div></div></div>
          <div class="xrow"><div class="xk">👑 王</div><div>${esc(st.boss[1])}${st.rareBoss ? `<span class="muted">（偶爾會遇到稀有的${st.rareBoss[1]}，戰利品約 2 倍）</span>` : ''}</div></div>
          <div class="xrow"><div class="xk">👾 小怪</div><div class="row">${foes}</div></div>
          <div class="xrow"><div class="xk">🎒 戰利品</div><div class="row">${loot}</div></div>
          <div class="xrow"><div class="xk">📋 條件</div><div>建議戰力 <b>${st.req}</b>｜⏱ <b>${st.h}</b> 小時｜隊伍 <b>${a === b ? a : a + '～' + b}</b> 隻</div></div>
          <h3>🐾 隊伍</h3><div class="xslots">${slots.join('')}</div>
          <div class="xg"><div class="xgl">成功率</div><div class="xgb"><i style="width:${rate}%;background:${gaugeCol(rate)}"></i><span>${r ? rate + '%' : '—'}</span></div></div>
          <div class="muted">${r ? `隊伍戰力 ${r.pow}／建議 ${st.req}${r.bonus ? `（連敗加成 +${r.bonus}%）` : ''}` : '從下面點寵物組隊'}</div>
          <div class="row"><button class="ok big" data-a="go" ${pets.length >= a && pets.length <= b && S.exp.teams.length < C.expTeams ? '' : 'disabled'}>🚩 出發（${pets.length}/${a === b ? a : a + '～' + b}）</button></div>
          <h3>可以出發的夥伴</h3><div class="xpool">${pool || '<span class="muted">還沒有夥伴</span>'}</div>
        </div></div>
        ${teams ? `<h3>⏳ 出發中</h3><div class="xts">${teams}</div>` : ''}${back ? `<h3>📮 最近回來的</h3><div class="xts">${back}</div>` : ''}`, (x, v, el) => {
        if (x === 's') { sk = v; sel = []; S.exp.lastSk = v }
        if (x === 'p') { const id = +v, p = P.byId(id); if (sel.includes(id)) sel = sel.filter(i => i !== id); else if (p && P.expWhyNot(p)) { UI.toast(`${P.label(p)}：${P.expWhyNot(p)}`); return } else if (sel.length < b) sel.push(id); else UI.toast(`這裡最多 ${b} 隻`) }
        if (x === 'go') { const r2 = P.expSend(sk, sel); UI.toast(r2.ok ? `出發了！成功率 ${r2.team.rate}%` : r2.msg); if (r2.ok) sel = [] }
        draw();
      });
    };
    UI.nav(draw);
  }
  U.exp = expScreen;

  // ---------- 育兒籃（取代 P3 版：託付 → 「爸媽之後」） ----------
  const GO = { stay: ['🏠 留在家', '跟寶寶一起住在收容所'], wander: ['🎒 出門闖蕩', '寶寶出生那天出門，跟一般放出去闖闖一樣寄明信片回來'], entrust: ['🤝 託付', '把本事全部教給寶寶（成功率 +' + G.teach.entrust + '%，熟練不打折），然後出門闖蕩'] };
  U.basket = i => {
    const S = P.S, c = S.cots[i]; if (!c || !c.basket) return;
    let hint = null, hintDone = 0;
    const draw = () => {
      const bk = c.basket; if (!bk) return UI.close();
      const f = P.byId(bk.a), m = P.byId(bk.b); if (!f || !m) return UI.panel(`<h2>育兒籃</h2>${say('蜜糖媽媽', '寶寶明天早上 5 點會出生。')}`, () => { });
      if (!hintDone) { hintDone = 1; hint = P.pityHint(f, m, null) }
      const opts = P.teachOptions(f, m), T = G.teach, want = bk.teach || [f.heir, m.heir];
      const chance = (w, slot) => { const o = opts.find(x => (x.book != null ? 'b' + x.book : x.n) === w); if (!o) return 0; let ch = (o.book != null ? T.book : o.both ? T.both : T.one)[slot]; if (o.n === f.heir || o.n === m.heir) ch += T.heir; if (bk.entrust) ch += T.entrust; if (P.SK[o.n] && P.SK[o.n].gen === 'mut') ch *= T.mutHalf; if (bk.will && slot === 0) ch = 100; return Math.min(100, ch) };
      const optBtns = slot => opts.map(o => { const key = o.book != null ? 'b' + o.book : o.n; const sel = want[slot] === key; return `<button class="${sel ? 'ok' : 'alt'}" data-a="t${slot}" data-v="${key}">${P.SK[o.n] ? P.SK[o.n].name : '?'} ${P.skTag(o.n)}${sel ? ` ${chance(key, slot)}%` : ''}</button>` }).join('') || '<span class="muted">爸媽還沒有可以教的技能</span>';
      const mk = P.mateKind(f, m), coi = P.coi(f, m);
      const evo = want.filter(w => typeof w === 'number' && P.EVO[w] && (f.sk || []).includes(w) && (m.sk || []).includes(w) && ((f.mst || {})[w] || 0) + ((m.mst || {})[w] || 0) >= G.evolveSum);
      const mix = P.MIX.find(x => want.length === 2 && [x.a, x.b].sort().join() === want.slice().sort().join());
      const atav = P.atavCand(f, m);
      const ask = bk.ask, asker = ask && P.byId(ask.id);
      const goRow = p => { const g = P.goOf(bk, p.id), lockYes = ask && ask.st === 'yes' && ask.id === p.id; return `<div class="card row2">${UI.av(p, 44)}<div class="grow"><b>${esc(P.label(p))}</b><div class="muted">${lockYes ? `答應讓牠出門了，留下臨別禮「${P.FAREWELL[bk.gift].name}」` : GO[g][1]}</div>${lockYes ? '' : `<div class="row">${Object.keys(GO).map(k => `<button class="${g === k ? 'ok' : 'alt'}" data-a="go" data-v="${p.id}:${k}">${GO[k][0]}</button>`).join('')}</div>`}</div></div>` };
      UI.panel(`<h2>🧺 育兒籃（小屋 ${i + 1}）</h2>
        ${say('蜜糖媽媽', `寶寶明天早上 5 點會自己出生，住進育兒室。在那之前，可以決定爸媽要「教」寶寶哪一招，還有寶寶出生以後，爸媽要留在家還是出門闖蕩。`)}
        <div class="row2">${UI.av(f, 44)} ＋ ${UI.av(m, 44)} <div class="grow">${esc(P.label(f))} ＆ ${esc(P.label(m))}<div class="muted">血緣：${P.coiText(coi)}${mk && mk !== 'same' ? '｜不同物種：會生出什麼呢？' : ''}${bk.pollen ? '｜🌕 月光露：這一籃一定有寶寶突變' : ''}</div></div></div>
        ${hint ? say(hint[0], hint[1]) : ''}
        ${ask && !ask.st && asker ? `<div class="card ask row2">${UI.av(asker, 54)}<div class="grow"><b>${esc(P.label(asker))}</b> 好像有話想說……<div class="row"><button class="ok" data-a="askopen">聽牠說</button></div></div></div>` : ''}
        ${bk.gift ? `<div class="card gift">🎁 臨別禮「<b>${P.FAREWELL[bk.gift].name}</b>」：${P.FAREWELL[bk.gift].txt}</div>` : ''}
        <h3>📚 第一志願（教成功率）</h3><div class="row">${optBtns(0)}</div>
        <h3>📚 第二志願</h3><div class="row">${optBtns(1)}</div>
        <div class="muted">兩位爸媽都會的 ${T.both[0]}%／${T.both[1]}%，只有一位會的 ${T.one[0]}%／${T.one[1]}%，傳家技再 +${T.heir}%。寶寶靈性還淺、還用不上的技能，會先「潛藏」起來，靈性提升時再覺醒。訓練練出來的能力，也會有一部分（${Math.round(G.trInherit * 100)}%）變成寶寶的血統。${evo.length ? `<br>✨ ${evo.map(n => P.SK[n].name).join('、')}：爸媽都很熟練，教成功會變成血脈技「${evo.map(n => P.SK[P.EVO[n]].name).join('、')}」！` : ''}${mix && Math.max((f.mst || {})[mix.a] || 0, (m.mst || {})[mix.a] || 0) >= G.mixMin && Math.max((f.mst || {})[mix.b] || 0, (m.mst || {})[mix.b] || 0) >= G.mixMin ? `<br>✨ 這兩招有機會融合成一招新的本事（融合技）……` : ''}${atav.length ? `<br>🌙 小貓頭鷹：「咕……這一家的祖先，好像藏著爸媽沒學到的本事。」` : ''}</div>
        <h3>🚪 寶寶出生以後，爸媽要……</h3>${goRow(f)}${goRow(m)}
        <div class="muted">出門闖蕩跟一般「放出去闖闖」一樣：會寄明信片和禮物回來、加名聲，但不會再回來了。託付只能選一位。</div>`, (a, v) => {
        if (a === 't0' || a === 't1') { const slot = +a[1], w = /^b/.test(v) ? v : +v; const t = (bk.teach || [f.heir, m.heir]).slice(); t[slot] = w; if (t[0] === t[1]) t[1 - slot] = null; bk.teach = t }
        if (a === 'go') { const [id, g] = v.split(':'); P.setGo(c, +id, g) }
        if (a === 'askopen') return askScreen(c);
        draw();
      });
    };
    UI.nav(draw);
  };
  // ---------- 爸媽開口：想出門闖闖 ----------
  const ASK_LINES = { 0: '主人～等孩子出生以後，我想出去外面跑跑看！可以嗎？', 1: '主人……孩子出生以後，我想去外面的世界走走。我會好好的，可以嗎？', 2: '主人，我聽說外面有好多好吃的……等孩子生下來，我可以出門找找看嗎？', 3: '呼啊……我夢到很遠很遠的地方。等孩子出生，我想去那裡看看。', 4: '主人！外面一定有好多沒看過的東西！孩子出生以後，讓我去探險好不好？' };
  const GIFT_LINES = { bless: '我把我的祝福留給孩子。牠一定會有一身好本事的。', will: '我最拿手的那一招，一定要讓孩子學會。這是我的心願。', mark: '孩子身上會留著我們家的印記，一代一代傳下去。', memento: '這個小包袱給孩子。看到它，就會想起我喔。', seed: '我在孩子心裡種了一顆小種子……等牠將來有了孩子，會發芽的。' };
  function askScreen(c) {
    const bk = c.basket; if (!bk || !bk.ask) return; const p = P.byId(bk.ask.id); if (!p) return; bk.ask.shown = 1;
    UI.nav(() => UI.panel(`<h2>💬 ${esc(P.label(p))} 有話想說</h2>
      <div class="askbig">${UI.av(p, 112)}<div class="bubble">「${ASK_LINES[p.pers] || ASK_LINES[1]}」</div></div>
      ${say('西施', '牠說的時候尾巴一直搖……如果答應牠，牠好像會留下什麼給孩子。不答應也沒關係，牠會乖乖留下來的。')}
      <div class="row"><button class="ok big" data-a="yes">🎒 答應牠</button><button class="alt big" data-a="no">🏠 留下來陪我</button></div>`, (a) => {
      if (a === 'yes') { const r = P.askAnswer(c, true); P.save(); return giftScreen(c, p, r.gift) }
      if (a === 'no') { P.askAnswer(c, false); P.save(); UI.toast(`${P.label(p)}：「嗯！那我就留下來陪大家！」`, 4000); UI.back() }
    }));
  }
  function giftScreen(c, p, g) {
    const F = P.FAREWELL[g];
    UI.nav(() => UI.panel(`<h2>🎁 臨別禮</h2><div class="askbig">${UI.av(p, 112)}<div class="bubble">「謝謝主人。${GIFT_LINES[g]}」</div></div>
      <div class="card gift big"><div class="giftn">「${F.name}」</div><div>${F.txt}</div></div>
      ${say('蜜糖媽媽', `寶寶明天早上出生以後，${P.label(p)} 就會背著小包袱出門。之後也會寄明信片回來喔。`)}
      <div class="row"><button class="ok" data-a="ok">知道了</button></div>`, a => { if (a === 'ok') { const i = P.S.cots.indexOf(c); UI.close(); if (i >= 0) U.basket(i) } }));
  }
  U.askScreen = askScreen;
  // 收容所每秒：育兒籃出現就擲一次「爸媽開口」；有人開口而且畫面空著，就跳出來
  const tick0 = U.shelterTick;
  U.shelterTick = dt => {
    tick0(dt); const S = P.S; if (!S.unlock) return;
    for (const c of S.cots) { if (!c.basket) continue; P.askRoll(c); const k = c.basket.ask; if (k && !k.st && !k.shown && !UI.isOpen() && P.sceneName === 'shelter') { askScreen(c); break } }
  };

  // ---------- 彩虹月光露（只有拿到才看得到）＋傳說之證兌換 ----------
  U.rainbow = c => {
    const S = P.S;
    UI.nav(() => UI.panel(`<h2>🌕 月光露</h2>${say('小貓頭鷹', '咕。月光露放進小屋，下一個育兒籃一定會有寶寶突變，種類隨機。' + (S.mat.rainbow ? '彩虹月光露可以自己選種類……那可是很難得的東西喔。' : ''))}
      <div class="row">${S.mat.pollen ? `<button data-a="n">🌕 月光露（隨機，有 ${S.mat.pollen}）</button>` : ''}${S.mat.rainbow ? [['coat', '毛色花紋'], ['size', '體型（迷你／巨大）'], ['tal', '能力天賦'], ['sub', '天性魔法異彩'], ['skill', '突變技能']].map(([k, n]) => `<button class="ok" data-a="r" data-v="${k}">🌈 ${n}（有 ${S.mat.rainbow}）</button>`).join('') : ''}</div>`, (a, v) => {
      if (a === 'n' && S.mat.pollen) { S.mat.pollen--; c.pollen = 1; c.mutKind = null } if (a === 'r' && S.mat.rainbow) { S.mat.rainbow--; c.pollen = 1; c.mutKind = v }
      if (a === 'n' || a === 'r') { UI.toast('月光露放好了：下一個育兒籃一定有寶寶突變'); UI.back() }
    }));
  };
  U.proofScreen = () => {
    const draw = () => { const S = P.S; UI.panel(`<h2>📜 傳說之證</h2>${say('小貓頭鷹', `咕咕。每拿一次傳說大會冠軍，就有一張傳說之證。集滿 ${G.rainbowTrade} 張，我就用珍藏的彩虹月光露跟你換。`)}
      <div class="card">📜 傳說之證 ${S.mat.proof || 0}／${G.rainbowTrade}${P.seen('rainbow') ? `　🌈 彩虹月光露 ${S.mat.rainbow}` : ''}</div>
      <div class="row"><button class="ok" data-a="t" ${(S.mat.proof || 0) >= G.rainbowTrade ? '' : 'disabled'}>換 1 瓶彩虹月光露</button></div>`, a => { if (a === 't') { const r = P.tradeRainbow(); UI.toast(r.ok ? '換到了 🌈 彩虹月光露！' : r.msg) } draw() }) };
    UI.nav(draw);
  };

  // ---------- 西施的含糊提示：櫃檯閒聊偶爾換成保底的「感覺」 ----------
  const nl0 = P.npcLine; P.npcLine = sit => { if ((sit === 'hint' || sit === 'reroll') && P.S && P.rand() < 0.5) { const h = P.pityHintAny(); if (h) return h } return nl0(sit) };
  const b0 = P.birth; P.birth = (c, k) => { const out = b0(c, k); if (out && out.length && P.rand() < 0.5) { const h = P.pityHintAny(); if (h) P._pityToast = h } return out };
  const tick1 = U.shelterTick; U.shelterTick = dt => { tick1(dt); if (P._pityToast && !UI.isOpen()) { const h = P._pityToast; P._pityToast = null; UI.toast(`${h[0]}：「${h[1]}」`, 5000) } };
})(window.PET);
