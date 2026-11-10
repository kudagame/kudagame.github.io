// P3 介面：寵物能力／家譜／遺傳、育兒籃、放生確認、櫃檯（擴建、信箱、大會、獎牌室）、材料、外觀、小屋內部與獎牌室場景
'use strict';
(function (P) {
  const C = P.CFG, G = C.gen, UI = P.ui, esc = s => UI.esc(String(s == null ? '' : s));
  const say = (who, t) => `<div class="card row2">${UI.npc(who)}<div class="grow"><b>${who}</b>：「${t}」</div></div>`;
  const fmt = n => Math.round(n).toLocaleString();
  const r1 = v => Math.round(v * 10) / 10;
  const U = P.ui3 = {};
  const npcOnce = (k, key) => { const S = P.S; S.hint3 = S.hint3 || {}; if (S.hint3[k]) return ''; S.hint3[k] = 1; const l = (P.NPC_LINES[key || k] || [])[0]; return l ? say(l[0], l[1]) : '' };

  // ---------- 寵物面板：體型＋毛色 ----------
  U.sizeLine = p => {
    P.genInit(p); const z = P.size(p), cl = P.sizeClass(p), h = P.heart(p.aff), hyb = P.HYB[p.sp];
    const hid = P.coatHidden(p), tag = p.sizeTag ? (p.sizeTag === 'giant' ? '（巨大）' : '（迷你）') : '';
    let s = `<div class="muted">📏 體型：${z.name}${tag}——${z.txt}｜🎨 毛色：${P.coatName(p)}${hid >= 0 && h >= G.coatHint ? '｜耳朵後面有一小撮淡淡的毛' : ''}${p.subX >= 0 ? '｜✦ 天性魔法異彩' : ''}${(p.mut || []).length ? '｜🧬 突變 ' + p.mut.length : ''}</div>`;
    if (hyb) s += `<div class="card">🌟 <b>${hyb.name}</b>：${hyb.recipe ? '四種祖父母血統合在一起才會出現的特別孩子。' : `${P.SP[hyb.hyb[0]].name}和${P.SP[hyb.hyb[1]].name}的孩子（混血）。固有技能是兩邊各 60% 的效果。`}</div>`;
    return s;
  };
  // ---------- 寵物面板：能力、成長方向、血統、熟練、獎牌、家譜、外觀 ----------
  // P4.4：每項能力白話（獵犬、蜜糖媽媽說明用）
  const ABX = { str: '力氣：寵物打得更痛，主人的生命也多一點', agi: '腳程：寵物跑得更快，主人走路也快一點', vit: P.FEAT.cup ? '韌性：比賽、探險更耐打，主人受的傷少一點' : '韌性：探險更耐打，主人受的傷少一點', wit: '靈巧：寵物的技能更快能再用，主人的經驗多一點', luk: P.FEAT.cup ? '福氣：探險、比賽運氣更好，主人撿的金幣多一點' : '福氣：探險運氣更好，主人撿的金幣多一點' };
  U.ABX = ABX;
  // P4.4：剛換方向／吃果實後，寵物面板那幾項亮起來，寵物在院子裡開心一下
  const flash = (p, d) => { U._flash = { id: p.id, d, until: Date.now() + 8000 } };
  const react = (p, line) => { if (P.shelterAct && !P.out(p)) { P.shelterAct(p, 'happy', 2.4); if (P.shelterSay) P.shelterSay(p, line, 3) } };
  const diffOf = (a0, a1) => { const d = {}; for (const A of P.ABIL) { const x = Math.round(a1[A.k]) - Math.round(a0[A.k]); if (x) d[A.k] = x } return d };
  const sgn = x => (x > 0 ? '+' : '') + x;
  U.petExtra = p => {
    const S = P.S; P.abInit(p); P.genInit(p);
    const a = P.abil(p), b = P.blood(p), ow = P.abOwner(p), pe = P.abPet(p);
    const fl = U._flash && U._flash.id === p.id && U._flash.until > Date.now() ? U._flash.d : {};
    let h = `<h3>💪 寵物能力（合計 ${Math.round(a.total)}）<button class="alt" data-a="abhelp">這是什麼？</button></h3>`;
    h += '<table class="ab"><tr><th>能力</th><th>點數</th><th>寵物自己</th><th>主人分到 ' + C.ablOwnerShare + '%</th></tr>';
    for (const A of P.ABIL) {
      const k = A.k, d = A.pet.per ? pe[A.pet.k] : null, o = ow[A.owner.k];
      const parts = `血統 ${r1(b[k])}${p.tr[k] ? `＋訓練 ${r1(p.tr[k])}` : ''}${p.perm[k] ? `＋${P.FEAT.cup ? '果實與大會' : '果實'} ${r1(p.perm[k])}` : ''}`;
      h += `<tr${k in fl ? ` style="background:${fl[k] > 0 ? '#3f5a34' : fl[k] < 0 ? '#5a3434' : '#34485a'}"` : ''}><td><b>${A.name}</b>${p.dir[0] === k ? ' ⬆主' : p.dir[1] === k ? ' ↗次' : ''}${p.tal === k ? ' 🧬' : ''}</td><td>${Math.round(a[k])}${fl[k] ? ` <b style="color:${fl[k] > 0 ? '#9f9' : '#f99'}">${fl[k] > 0 ? '▲' : '▼'}${sgn(fl[k])}</b>` : k in fl ? ' <b style="color:#9cf">🧭新方向</b>' : ''}<div class="muted">${parts}</div></td><td>${d ? `${A.pet.txt} +${d.v}%（最多 ${d.cap}%）` : '—'}</td><td>${A.owner.txt} +${o.v}%（最多 ${o.cap}%）</td></tr>`;
    }
    h += '</table>';
    { const per = C.ablLv * C.ablQual[p.q == null ? 1 : p.q] * (p.star === 2 ? C.shinyMul : 1), canLv = p.baby && (p.lv || 1) < C.lvCap[p.tier];
      h += `<div class="muted">🧭 成長方向：<b>主項 ${P.abName(p.dir[0])}</b>、次項 ${P.abName(p.dir[1])}。${canLv ? `每升 1 級：${P.abName(p.dir[0])} 約 +${r1(per * C.ablDirW[0])}、${P.abName(p.dir[1])} 約 +${r1(per * C.ablDirW[1])}，其他各 +${r1(per * (1 - C.ablDirW[0] - C.ablDirW[1]) / 3)}。` : ''}「主人分到」那一欄不加攻擊，只加生命、速度、少受傷、經驗、金幣。</div>`; }
    const btn = [];
    if (P.seen('feather')) btn.push(`<button class="alt" data-a="dirgo">🪶 換成長方向（羽毛 ${S.mat.feather}）</button>`);
    if (P.seen('fruit')) btn.push(`<button class="alt" data-a="fruitgo">🍎 成長果實（${S.mat.fruit}）</button>`);
    if (P.seen('crown')) btn.push(`<button class="alt" data-a="crown">🏵️ 王國勳果（${S.mat.crown}）</button>`);
    if (btn.length) h += `<div class="row">${btn.join('')}</div>`;
    // 血統與家族
    const cap = P.bloodCap(p), done = P.done(p);
    const lmax = G.lineMax + (p.lineX ? 1 : 0), ln = Math.min(lmax, p.line || 0), stp = Math.round(G.lineStep * 100);
    const owl = `「傳承」是這一家一代一代認真養大的紀錄，現在是 <b>${ln} 級</b>（最高 ${lmax} 級）。每 1 級，能力上限多 ${stp}%${ln ? `，所以牠每一項能力最多可以長到 <b>${Math.round(cap)}</b>` : `；牠現在每一項能力最多長到 <b>${Math.round(cap)}</b>`}。`
      + (p.baby ? (done ? `牠已經「練成」（練到 Lv${C.lvCap[p.tier]} 滿級）了！只要另一半也練成，生下的寶寶傳承會比爸媽多 1 級。` : `把牠練到 Lv${C.lvCap[p.tier]} 滿級就算「練成」。爸媽兩隻都練成，生下的寶寶傳承會多 1 級，能力上限就更高。`) : '大朋友也可以出戰練級（經驗跟寶寶一樣快，而且比寶寶壯），但「練成」只算寶寶時期：牠的孩子傳承會跟爸媽差不多，不會多 1 級。')
      + `寶寶出生時，會拿到爸媽能力的大約 ${Math.round(G.ablInherit * 100)}%。`;
    h += `<h3>🌳 血統</h3>${say('小貓頭鷹', '咕。' + owl)}${p.coi >= G.coiNear || P.noble(p.id) ? `<div class="muted">${p.coi >= G.coiNear ? '⚠ 爸媽是親戚：能力遺傳少一點，比較容易突變' : ''}${p.coi >= G.coiNear && P.noble(p.id) ? '｜' : ''}${P.noble(p.id) ? '👑 名門：祖先裡出了好多冠軍' : ''}</div>` : ''}`;
    h += `<div class="row"><button class="alt" data-a="tree">🌳 看家譜</button></div>`;
    // 熟練
    if (p.baby && p.sk.length) h += `<div class="muted">技能熟練（出戰用到 +${G.mstFight}，最多 100；教給孩子時會帶一半過去）：${p.sk.map(n => `${P.SK[n].name} ${p.mst[n] || 0}`).join('、')}</div>`;
    if ((p.hid || []).length) h += `<div class="muted">🔒 潛藏的本事（升階有空格就會先覺醒）：${p.hid.map(n => P.SK[n] ? P.SK[n].name : n).join('、')}</div>`;
    if ((p.mut || []).length) h += `<div class="muted">🧬 突變：${p.mut.map(m => ({ coat: '毛色花紋', size: '體型', tal: '能力天賦', sub: '天性魔法異彩', skill: '突變技能' }[m.k])).join('、')}</div>`;
    // 獎牌
    if ((p.medals || []).length) h += `<h3>🏅 獎牌（${p.medals.length}）｜${P.RANK[p.rank || 0]}</h3><div class="muted">${p.medals.slice(-6).reverse().map(m => esc(m.name)).join('<br>')}</div>`;
    // 外觀
    if (S.looks.length || (p.looksOwn || []).length) h += `<h3>👒 外觀</h3><div class="row"><button class="alt" data-a="wear" data-v="">不戴</button>${S.looks.concat(p.looksOwn || []).map(k => `<button class="alt" data-a="wear" data-v="${k}">${p.wear === k ? '✔ ' : ''}${P.LOOKS[k]}${(p.looksOwn || []).includes(k) ? '（專屬）' : ''}</button>`).join('')}</div>`;
    // 家傳手札
    if (p.baby && p.sk.length && (S.book.length || P.seen('disk'))) h += `<div class="row"><button class="alt" data-a="bookgo">📖 抄進家傳手札（${S.book.length}/${P.bookCap()} 頁）</button></div>`;
    return h;
  };
  U.petAct = (p, a, v) => {
    const S = P.S; let r;
    if (a === 'abhelp') { UI.toast('獵犬：「' + P.NPC_LINES.abil[0][1] + '」', 5000); return true }
    if (a === 'dirgo') { dirScreen(p); return true }
    if (a === 'fruitgo') { fruitScreen(p); return true }
    if (a === 'crown') { const a0 = P.abil(p); r = P.useCrown(p); if (r.ok) { flash(p, diffOf(a0, P.abil(p))); react(p, '哇，全身都暖暖的！') } UI.toast(r.ok ? '蜜糖媽媽：「王國勳果！5 項能力都永久 +3 了。」' : r.msg, 3000); return true }
    if (a === 'tree') { treeScreen(p.id); return true }
    if (a === 'wear') { p.wear = v || ''; UI.toast(v ? '戴上了 ' + P.LOOKS[v] : '拿下來了'); return true }
    if (a === 'bookgo') { bookScreen(p); return true }
    return false;
  };
  function dirScreen(p) {   // P4.4：白話說明＋換了以後的預覽；確定後寵物面板那幾項亮起來
    let m = p.dir[0], s = p.dir[1];
    const w = [C.ablDirW[0], C.ablDirW[1], (1 - C.ablDirW[0] - C.ablDirW[1]) / 3], pc = x => Math.round(x * 100);
    const draw = () => {
      const a0 = P.abil(p), d0 = p.dir; p.dir = [m, s]; const a1 = P.abil(p); p.dir = d0;
      const per = C.ablLv * C.ablQual[p.q == null ? 1 : p.q] * (p.star === 2 ? C.shinyMul : 1), canLv = p.baby && (p.lv || 1) < C.lvCap[p.tier];
      const same = m === p.dir[0] && s === p.dir[1], fe = P.S.mat.feather || 0, cost = C.featherCost;
      const rows = P.ABIL.map(A => { const k = A.k, x0 = Math.round(a0[k]), x1 = Math.round(a1[k]), d = x1 - x0, ww = k === m ? w[0] : k === s ? w[1] : w[2];
        return `<tr${d ? ` style="background:${d > 0 ? '#3f5a34' : '#5a3434'}"` : ''}><td><b>${A.name}</b>${k === m ? ' ⬆主' : k === s ? ' ↗次' : ''}</td><td>${x0}</td><td><b>${x1}</b>${d ? ` <b style="color:${d > 0 ? '#9f9' : '#f99'}">${sgn(d)}</b>` : ''}</td>${canLv ? `<td>+${r1(per * ww)}</td>` : ''}</tr>` }).join('');
      UI.panel(`<h2>🪶 換成長方向</h2>${say('獵犬', `汪！成長方向就是「牠升級長出來的成長點，要多放在哪一項」。<b>主項</b>分到最多（${pc(w[0])}%），<b>次項</b>第二多（${pc(w[1])}%），其他 3 項各分 ${pc(w[2])}%。換了以後，牠到現在長出來的成長點也會照新方向重新分，所以數字馬上就會變（已經到上限的那一項，多的長不上去）。`)}
        <div class="card"><b>主項（最想讓牠變強的）</b><div class="row">${P.ABIL.map(A => `<button class="${A.k === m ? 'ok' : 'alt'}" data-a="m" data-v="${A.k}">${A.k === m ? '✔ ' : ''}${A.name}</button>`).join('')}</div><div class="muted">${ABX[m]}</div></div>
        <div class="card"><b>次項（第二想變強的）</b><div class="row">${P.ABIL.map(A => `<button class="${A.k === s ? 'ok' : 'alt'}" data-a="s" data-v="${A.k}">${A.k === s ? '✔ ' : ''}${A.name}</button>`).join('')}</div><div class="muted">${ABX[s]}</div></div>
        <h3>${same ? '現在的方向' : '換了以後會變成這樣'}</h3><table class="ab"><tr><th>能力</th><th>現在</th><th>換了以後</th>${canLv ? '<th>以後每升 1 級</th>' : ''}</tr>${rows}</table>
        ${canLv ? '' : '<div class="muted">牠已經不能再升級了，換方向只會把已經長出來的成長點重新分。</div>'}
        <div class="row"><button class="ok big" data-a="go" ${same || fe < cost ? 'disabled' : ''}>${same ? '先選一個不一樣的方向' : fe < cost ? `沒有風向羽毛（要 ${cost} 根）` : `確定換（用掉風向羽毛 ${cost} 根，有 ${fe}）`}</button></div>`, (a, v) => {
        if (a === 'm') { if (v === s) s = m; m = v }
        if (a === 's') { if (v === m) m = s; s = v }
        if (a === 'go') { const r = P.changeDir(p, [m, s]); if (!r.ok) UI.toast(r.msg); else { const d = diffOf(a0, P.abil(p)); for (const k of [m, s]) if (!(k in d)) d[k] = 0; flash(p, d); react(p, `我要多練${P.abName(m)}！`); UI.toast(`獵犬：「汪！方向換好了：主項 ${P.abName(m)}、次項 ${P.abName(s)}。」`, 3200); return UI.back() } }
        draw();
      });
    };
    UI.nav(draw);
  }
  function fruitScreen(p) {   // P4.4：看得到每一項現在多少、吃了會變多少；吃完原地更新、寵物開心一下
    let last = null;
    const draw = () => {
      const S = P.S, a = P.abil(p), n = S.mat.fruit || 0, cap = G.ablCupMax;
      UI.panel(`<h2>🍎 成長果實（有 ${n} 顆）</h2>${say('蜜糖媽媽', `成長果實吃一顆，選的那一項馬上<b>永久 +2</b>，換成長方向也不會變。每一項最多吃到 +${cap}（大會的獎勵也算在裡面）。這是牠自己的，不會傳給孩子喔。`)}
        ${last ? `<div class="card">😋 ${esc(P.label(p))} 吃了果實：<b>${P.abName(last.k)} ${last.a} → ${last.b}</b>（+2）</div>` : ''}
        ${P.ABIL.map(A => { const k = A.k, v = Math.round(a[k]), pm = p.perm[k] || 0, full = pm >= cap, on = last && last.k === k;
          return `<div class="sk row2"${on ? ' style="background:#3f5a34"' : ''}><div class="grow"><b>${A.icon || ''} ${A.name}</b> ${v}${full ? '' : ` → <b style="color:#9f9">${v + Math.min(2, cap - pm)}</b>`}<div class="muted">${ABX[k]}｜已經吃了 +${pm}/${cap}</div></div><button data-a="f" data-v="${k}" ${!n || full ? 'disabled' : ''}>${full ? '吃滿了' : '吃一顆'}</button></div>` }).join('')}
        ${n ? '' : `<div class="muted">果實吃完了。${P.FEAT.cup ? '大會、' : ''}探險有機會再拿到。</div>`}`, (x, k) => {
        if (x !== 'f') return; const b0 = Math.round(P.abil(p)[k]), r = P.useFruit(p, k);
        if (!r.ok) return UI.toast(r.msg);
        const b1 = Math.round(P.abil(p)[k]); last = { k, a: b0, b: b1 }; flash(p, { [k]: b1 - b0 }); react(p, `好吃！${P.abName(k)}變強了！`); draw();
      });
    };
    UI.nav(draw);
  }
  function bookScreen(p) {
    const S = P.S;
    UI.nav(() => UI.panel(`<h2>📖 家傳手札</h2>${say('小貓頭鷹', `咕。把技能寫進手札，以後別的孩子也能從育兒籃學。一頁花技能磁片 ${G.bookCost}。用掉那一頁就沒了。`)}
      <div class="muted">手札 ${S.book.length}/${P.bookCap()} 頁｜技能磁片 ${S.disk}</div>
      ${S.book.map(pg => `<div class="sk">📄 ${P.SK[pg.n] ? P.SK[pg.n].name : pg.n} <span class="muted">（${esc(pg.from)}，熟練 ${pg.mst}）</span></div>`).join('')}
      <h3>從 ${esc(P.label(p))} 抄：</h3><div class="row">${p.sk.map(n => `<button data-a="c" data-v="${n}">${P.SK[n].name}</button>`).join('')}</div>`, (a, v) => { if (a === 'c') { const r = P.copyToBook(p, +v); UI.toast(r.ok ? '抄好了' : r.msg); if (r.ok) UI.back() } }));
  }
  // ---------- 家譜（3 代 14 格） ----------
  function cell(r, big, gen1) {
    if (!r) return `<div class="tc none">？<div class="muted">沒有紀錄</div></div>`;
    const sp = P.SP[r.sp] || P.SP.shihtzu;
    return `<div class="tc${big ? ' me' : ''}">${UI.av({ sp: r.sp, tier: r.tier, star: r.star }, big ? 52 : 38)}<div><b>${esc(r.name || sp.name)}</b>${r.baby ? '寶寶' : ''}</div>${gen1 ? '<div><span class="tag" style="background:#7fd07f">🌱 第一代</span></div>' : ''}<div class="muted">${P.TIER_NAME[r.tier]}${r.line ? '｜傳承 ' + r.line + ' 級' : ''}${r.champ ? '｜🏆' + r.champ : r.md ? '｜🏅' + r.md : ''}${r.hyb ? '｜混血' : ''}</div><div class="muted">${P.where(r.id)}</div></div>`;
  }
  function kidsOf(id) {   // 牠的孩子（還在的＋出門的）
    const S = P.S, ids = new Set();
    for (const p of P.all()) if (p.par && p.par.includes(id)) ids.add(p.id);
    for (const k in S.fam) { const f = S.fam[k]; if (f && f.par && f.par.includes(id)) ids.add(f.id || +k) }
    return [...ids].map(x => P.famOf(x)).filter(Boolean);
  }
  function treeScreen(id) {
    const t = P.tree(id), noble = P.noble(id), first = !t[1][0] && !t[1][1], kids = kidsOf(id);
    const kidRow = kids.length ? `<h3>👶 牠的孩子（${kids.length}）</h3><div class="tree"><div class="trow">${kids.slice(0, 8).map(r => cell(r)).join('')}</div></div>` : '';
    UI.nav(() => UI.panel(`<h2>🌳 家譜</h2>${first
      ? say('小貓頭鷹', `咕。牠是這一家的<b>第一代</b>，往上還沒有家人的紀錄。從牠開始，以後生下的孩子、孫子，都會一格一格記在這張家譜上。${kids.length ? '' : '等牠住進小屋、有了育兒籃，就會有第二代囉。'}`)
      : say('小貓頭鷹', '咕。往上看三代：爸媽、祖父母、曾祖父母。「？」是沒有留下紀錄的家人。祖先裡冠軍加起來 5 次以上，就叫「名門」。獎牌本身不會遺傳喔。')}
      ${noble ? '<div class="card">👑 <b>名門</b>：祖先裡出了好多冠軍！</div>' : ''}
      ${first ? `<div class="tree"><div class="trow">${cell(t[0][0], 1, 1)}</div></div>` : `<div class="tree"><div class="trow">${cell(t[0][0], 1)}</div><div class="trow">${t[1].map(r => cell(r)).join('')}</div><div class="trow">${t[2].map(r => cell(r)).join('')}</div><div class="trow small">${t[3].map(r => cell(r)).join('')}</div></div>`}
      ${kidRow}`, () => { }));
  }
  U.tree = treeScreen;

  // ---------- 育兒籃 ----------
  U.basket = i => {
    const S = P.S, c = S.cots[i]; if (!c || !c.basket) return;
    const draw = () => {
      const bk = c.basket; if (!bk) return UI.close();
      const f = P.byId(bk.a), m = P.byId(bk.b); if (!f || !m) return UI.panel(`<h2>育兒籃</h2>${say('蜜糖媽媽', '寶寶明天早上 5 點會出生。')}`, () => { });
      const opts = P.teachOptions(f, m), T = G.teach, want = bk.teach || [f.heir, m.heir];
      const chance = (w, slot) => { const o = opts.find(x => (x.book != null ? 'b' + x.book : x.n) === w); if (!o) return 0; let ch = (o.book != null ? T.book : o.both ? T.both : T.one)[slot]; if (o.n === f.heir || o.n === m.heir) ch += T.heir; if (bk.entrust) ch += T.entrust; if (P.SK[o.n] && P.SK[o.n].gen === 'mut') ch *= T.mutHalf; return ch };
      const optBtns = slot => opts.map(o => { const key = o.book != null ? 'b' + o.book : o.n; const sel = want[slot] === key; return `<button class="${sel ? 'ok' : 'alt'}" data-a="t${slot}" data-v="${key}">${P.SK[o.n] ? P.SK[o.n].name : '?'}${sel ? ` ${chance(key, slot)}%` : ''}</button>` }).join('') || '<span class="muted">爸媽還沒有可以教的技能</span>';
      const mk = P.mateKind(f, m), coi = P.coi(f, m);
      const evo = want.filter(w => typeof w === 'number' && P.EVO[w] && (f.sk || []).includes(w) && (m.sk || []).includes(w) && ((f.mst || {})[w] || 0) + ((m.mst || {})[w] || 0) >= G.evolveSum);
      const mix = P.MIX.find(x => want.length === 2 && [x.a, x.b].sort().join() === want.slice().sort().join());
      UI.panel(`<h2>🧺 育兒籃（小屋 ${i + 1}）</h2>
        ${say('蜜糖媽媽', `寶寶明天早上 5 點會自己出生，住進育兒室。在那之前，可以決定爸媽要「教」寶寶哪一招。`)}
        <div class="row2">${UI.av(f, 44)} ＋ ${UI.av(m, 44)} <div class="grow">${esc(P.label(f))} ＆ ${esc(P.label(m))}<div class="muted">血緣：${P.coiText(coi)}${mk && mk !== 'same' ? '｜不同物種：會生出什麼呢？' : ''}${bk.pollen ? '｜🌕 月光露：這一籃一定有寶寶突變' : ''}</div></div></div>
        <h3>📚 第一志願（教成功率）</h3><div class="row">${optBtns(0)}</div>
        <h3>📚 第二志願</h3><div class="row">${optBtns(1)}</div>
        <div class="muted">兩位爸媽都會的 ${T.both[0]}%／${T.both[1]}%，只有一位會的 ${T.one[0]}%／${T.one[1]}%，傳家技再 +${T.heir}%。寶寶位階還不夠用的技能，會先「潛藏」起來，升階時再覺醒。${evo.length ? `<br>✨ ${evo.map(n => P.SK[n].name).join('、')}：爸媽都很熟練，教成功會變成進化版「${evo.map(n => P.SK[P.EVO[n]].name).join('、')}」！` : ''}${mix && Math.max((f.mst || {})[mix.a] || 0, (m.mst || {})[mix.a] || 0) >= G.mixMin && Math.max((f.mst || {})[mix.b] || 0, (m.mst || {})[mix.b] || 0) >= G.mixMin ? `<br>✨ 這兩招有機會（${G.mixChance}%）合成一招新的本事……` : ''}</div>
        <h3>🤝 託付（可以不選）</h3><div class="muted">託付的那一位會把本事全部教給寶寶（成功率 +${T.entrust}%，熟練不打折），寶寶出生那天牠就會出門闖闖，不會回來。</div>
        <div class="row"><button class="${!bk.entrust ? 'ok' : 'alt'}" data-a="en" data-v="0">不託付</button><button class="${bk.entrust === f.id ? 'ok' : 'alt'}" data-a="en" data-v="${f.id}">託付 ${esc(P.label(f))}</button><button class="${bk.entrust === m.id ? 'ok' : 'alt'}" data-a="en" data-v="${m.id}">託付 ${esc(P.label(m))}</button></div>`, (a, v) => {
        if (a === 't0' || a === 't1') { const slot = +a[1], w = /^b/.test(v) ? v : +v; const t = (bk.teach || [f.heir, m.heir]).slice(); t[slot] = w; if (t[0] === t[1]) t[1 - slot] = null; bk.teach = t }
        if (a === 'en') bk.entrust = +v || 0;
        draw();
      });
    };
    UI.nav(draw); UI._refresh = null;
  };
  U.rainbow = c => {
    const S = P.S;
    UI.nav(() => UI.panel(`<h2>🌈 月光露</h2>${say('小貓頭鷹', '咕。彩虹月光露可以自己選突變的種類；普通的月光露就隨機。這一籃一定會有寶寶突變。')}
      <div class="row">${S.mat.pollen ? `<button data-a="n">🌕 月光露（隨機，有 ${S.mat.pollen}）</button>` : ''}${[['coat', '毛色花紋'], ['size', '體型（迷你／巨大）'], ['tal', '能力天賦'], ['sub', '天性魔法異彩'], ['skill', '突變技能']].map(([k, n]) => `<button class="ok" data-a="r" data-v="${k}">🌈 ${n}</button>`).join('')}</div>`, (a, v) => {
      if (a === 'n') { S.mat.pollen--; c.pollen = 1; c.mutKind = null } if (a === 'r') { S.mat.rainbow--; c.pollen = 1; c.mutKind = v }
      if (a === 'n' || a === 'r') { UI.toast('月光露放好了：下一個育兒籃一定有寶寶突變'); UI.back() }
    }));
  };

  // ---------- 放他出去闖闖（確認） ----------
  U.sendAsk = (p, cb) => {
    const S = P.S, sc = P.relScore(p), od = P.relOdds(sc.s);
    const oranges = p.tier >= 4 ? `<div class="muted">橘色寵物保底：已經連續 ${S.relPity.orange || 0} 隻沒拿到傳說寶物；第 ${C.relOrangePity} 隻一定是。</div>` : '';
    const book = p.baby && p.sk.length && S.book.length < P.bookCap() ? `<div class="muted">📖 想留下牠的技能？先按「抄進家傳手札」（技能磁片 ${G.bookCost}）。</div>` : '';
    UI.nav(() => UI.panel(`<h2>放 ${esc(P.label(p))} 出去闖闖？</h2>
      ${say('西施', `牠會背著小包袱出門，${p.baby ? '一路上遇到好人家，' : ''}之後寄明信片回來，裡面有禮物。出門以後就不會回來了喔。`)}
      <div class="card">強度 <b>${sc.s}</b>／100（${Object.entries(sc.d).filter(x => x[1]).map(([k, v]) => `${k} ${Math.round(v)}`).join('、')}）<br>
      禮物機率：${C.relGrade.map((g, i) => `${g} ${od[i].toFixed(1)}%`).join('｜')}</div>${oranges}${book}
      <div class="muted">明信片：第 1 封 ${C.postDay[0]}～${C.postDay[1]} 天後寄到${p.baby ? '（寶寶的幸福信大約 12 秒後就跟著寄來）' : ''}；${C.post2Chance}% 會有第 2 封。</div>
      <div class="row"><button class="bad big" data-a="go">好，讓牠出發</button><button data-a="back">再想想</button></div>`, a => { if (a === 'go') { UI.close(); cb() } }));
  };

  // ---------- 櫃檯卡片 ----------
  const xpCard = kind => {
    if (P.reqCard) return P.reqCard(kind);   // P5.1 #11：入口不消失，不夠的時候灰掉、寫清楚缺什麼
    const I = P.expandInfo(kind), nm = kind === 'annex' ? '二館' : '農場', c = C[kind];
    if (I.state === 'done') return '';
    if (I.state === 'building') return `<div class="card">🏗️ ${nm}施工中，${UI.fmtTime(I.until)} 完工</div>`;
    if (I.state === 'locked') return kind === 'farm' && P.S.annex !== 1 ? '' : `<div class="card">🔒 ${nm}：${I.why}</div>`;
    return `<div class="card">🏗️ <b>蓋${nm}</b>：${kind === 'annex' ? `住民上限 ${C.houseStep[0]} → ${C.houseStep[1]}，小屋多 ${c.cots} 間` : `住民上限 ${C.houseStep[1]} → ${C.houseStep[2]}，開放農場地圖`}<div class="muted">金幣 ${fmt(c.gold)}、剩食麵包 ${c.bread}、刻印碎片 ${c.shard}；${c.hours} 小時蓋好</div><div class="row"><button class="ok" data-a="xp" data-v="${kind}">開始蓋</button></div></div>`;
  };
  U.counterCards = () => {
    const S = P.S; let h = xpCard('annex') + xpCard('farm');
    const n = P.mailCount(); const IC = k => P.ficon ? P.ficon(k) : '';   // P5.1 #15：每個功能自己的像素小圖示
    h += `<div class="card row2">${IC('mail')}<div class="grow"><b>信箱</b>：${n ? `有 ${n} 疊明信片` : '現在沒有信'}${S.mail.q.length ? `｜路上還有 ${S.mail.q.length} 封` : ''}</div><button data-a="mail" ${n ? '' : 'disabled'}>打開信箱</button></div>`;
    if (P.FEAT.cup) h += `<div class="card row2">${IC('cup')}<div class="grow"><b>大會</b>：帶寶寶去比賽，拿獎牌和永久能力。<div class="row"><button class="ok" data-a="cup">去報名</button><button class="alt" data-a="medals">獎牌室</button></div></div></div>`;
    if (S.farm === 1) h += `<div class="card row2">${IC('farm')}<div class="grow"><b>農場</b></div><button data-a="farm">去農場</button></div>`;
    return h;
  };
  U.counterAct = (a, v) => {
    if (a === 'xp') { const r = P.buildExpand(v); UI.toast(r.ok ? '開工了！' : r.msg); if (r.ok) P.shelterBar(); UI._refresh && UI._refresh(); return true }
    if (a === 'mail') { mailScreen(); return true }
    if ((a === 'cup' || a === 'medals') && !P.FEAT.cup) return true;   // 大會下一版才開
    if (a === 'cup') { cupScreen(); return true }
    if (a === 'medals') { UI.close(); P.go('room', 'medals'); return true }
    if (a === 'farm') { UI.close(); P.go('farm'); return true }
    return false;
  };
  U.matCard = () => {
    const S = P.S, ks = Object.keys(P.MATS).filter(k => P.seen(k)); if (!ks.length) return '';
    return `<div class="card"><b>材料</b>${ks.map(k => `<div class="sk">${P.MATS[k].icon} ${P.MATS[k].name} ×${P.amount(k)} <span class="muted">${P.MATS[k].txt}</span></div>`).join('')}</div>`;
  };
  // ---------- 圖鑑：混血、闖闖的故事 ----------
  U.tales = () => {
    const S = P.S, seen = Object.keys(P.HYB).filter(k => S.hybSeen[k]), left = Object.keys(P.HYB).length - seen.length;
    let h = `<h3>🌟 特別的孩子</h3><div class="codex">${seen.map(k => `<div>${UI.av({ sp: k, tier: 2 }, 48)}<br><b>${P.SP[k].name}</b><br><span class="muted">${P.HYB[k].recipe ? '四祖配方' : '混血'}｜${S.hybSeen[k]} 隻</span></div>`).join('')}${left ? `<div><span class="av" style="width:48px;height:48px;filter:brightness(0)">？</span><br><b>還有什麼在等你…</b><br><span class="muted">${left} 種</span></div>` : ''}</div>`;
    if (left) { const hints = Object.keys(P.HYB).filter(k => !S.hybSeen[k]).map(k => P.HYB[k].hint).filter(Boolean); const pickH = hints[(P.dayKey(P.now()) || 0) % hints.length]; if (pickH && P.repLv() >= 3) h += say(pickH[0], pickH[1]) }
    if (S.tales.length) h += `<h3>📖 闖闖的故事</h3>` + S.tales.slice(-8).reverse().map(t => `<div class="sk">${UI.av(t.pet, 32)} ${esc(t.pet.name || P.SP[t.pet.sp].name)}${t.end || '寄了信回來'}</div>`).join('');
    return h;
  };
  // ---------- 下面那排按鈕 ----------
  U.bar = bar => {
    const S = P.S, n = P.mailCount();
    if (n) bar.push([`📮 信箱（${n}）`, () => mailScreen()]);
    if (S.farm === 1) bar.push(['🌾 農場', () => P.go('farm')]);
    if (S.annex === 1 || (S.annex && S.annex.until)) bar.push([P._camR ? '⬅ 回一館' : S.annex === 1 ? '➡ 二館' : '➡ 二館工地', () => { P._camR = !P._camR; P.shelterCam(P._camR ? 9999 : 0); P.shelterBar() }]);
  };
  // ---------- 每一格：提示 ----------
  let tk = 0;
  U.shelterTick = dt => {
    tk += dt; if (tk < 1) return; tk = 0; const S = P.S; if (!S.unlock) return;
    if (P.justBuilt) { const k = P.justBuilt; P.justBuilt = null; P.shelterBar(); UI.toast(k === 'annex' ? '西施：「二館蓋好了！往右邊走就到了，小屋也能再蓋 2 間！」' : '西施：「農場成立了！按下面的「🌾 農場」就能過去。」', 5000) }
    for (const c of (P.camps || []).splice(0)) { const p = P.byId(c.id); if (p) UI.toast(`獵犬：「汪！${P.label(p)} 集訓回來了：${P.abName(c.a.main)} +${c.gm}、${P.abName(c.a.sub)} +${c.gs}${c.magic ? '，' + c.magic : ''}」`, 5000) }
    for (const r of (P.expBack || []).splice(0)) UI.toast(`獵犬：「汪！探險隊從${r.st}回來了，${r.win ? '成功！' : '這次沒成功，帶回安慰獎。'}」`, 5000);
    if (P.mailCount() !== U._mc) { const was = U._mc; U._mc = P.mailCount(); P.shelterBar(); if (was != null && U._mc > was) UI.toast('蜜糖媽媽：「郵差送明信片來了！」', 3500) }
    if (!UI.isOpen()) { const k = P.askExpand(); if (k) { S.askAt = P.now(); const l = P.NPC_LINES[k === 'annex' ? 'askAnnex' : 'askFarm'][0]; UI.nav(() => UI.panel(`<h2>${k === 'annex' ? '要蓋二館嗎？' : '要成立農場嗎？'}</h2>${say(l[0], l[1])}${xpCard(k)}<div class="row"><button data-a="close">再想想</button></div>`, (a, v) => { if (a === 'bq' && P.reqAct) return P.reqAct(v, () => UI.close()); if (a === 'xp') { const r = P.buildExpand(v); UI.toast(r.ok ? '開工了！' : r.msg); if (r.ok) UI.close() } })) } }
  };
  // ---------- 外觀（像素小帽子） ----------
  const WEAR = { flower: ['.P.Y.P.', 'PYPYPYP'], melon: ['..GG..', '.GRRG.', 'GRRRRG'], wheat: ['Y.Y.Y.Y', 'yyyyyyy'], snow: ['.S.S.S.', 'SsSsSsS'], cape: ['RRRRRRR', '.RRRRR.', '..RRR..'], journey: ['..oo...', '.oyyo..', 'oyYYyo.', 'oyyyyoY'] };
  P.art.PAL.G = P.art.PAL.G || '#8a8590';
  U.drawWear = (ctx, k, x, y, sc) => { const rows = WEAR[k]; if (!rows) return; const s = Math.max(2, Math.round((sc || 2) * 1.5)); P.art.px(ctx, rows.map(r => r.replace(/G/g, '#3fae4f')), x - rows[0].length * s / 2, y - rows.length * s, s) };

  // ---------- 信箱 ----------
  function mailScreen() {
    const draw = () => {
      const st = P.mailStacks();
      UI.panel(`<h2>📮 信箱</h2>${npcOnce('mail')}${st.length ? st.map(s => `<div class="card">📦 <b>${s.cards.length} 張明信片</b>${s.over ? `（另外 ${s.over} 張超過每天 ${C.postCap} 張，變成材料一起放進來）` : ''}<div class="muted">${s.cards.map(m => esc(m.pet.name || P.SP[m.pet.sp].name)).join('、')}</div><div class="row"><button class="ok" data-a="o" data-v="${s.k}">一次打開</button></div></div>`).join('') : say('蜜糖媽媽', '現在沒有信喔。放出去闖闖的孩子，過幾天就會寄明信片回來。')}`, (a, v) => {
        if (a === 'o') { const r = P.openStack(+v); if (!r) return; P.shelterBar(); UI.nav(() => UI.panel(`<h2>💌 打開明信片</h2>${r.cards.map(m => `<div class="card row2">${UI.av(m.pet, 44)}<div class="grow">${esc(P.cardText(m)).replace(/\n/g, '<br>')}<div class="muted">${m.n === 1 ? C.relGrade[m.g] + (m.forced ? '（橘色保底）' : '') : '第 2 封'}</div></div></div>`).join('')}<div class="card"><b>收到：</b>${r.got.join('、') || '—'}</div>`, () => { })) }
      });
    };
    UI.nav(draw);
  }
  U.mail = mailScreen;

  // ---------- 大會 ----------
  function cupScreen() {
    let cup = 'v';
    const NEXT = { s: '季節盃', k: '王國名盃', l: '傳說大會' }, HOWTO = { s: '有寶貝升上「銅級」（村莊小賽拿 3 次冠軍）就會收到邀請。', k: '有寶貝升上「銀級」（季節盃拿 2 次冠軍）就會收到邀請。', l: '有寶貝升上「金級」（王國名盃拿冠軍）就會收到邀請。' };
    const draw = () => {
      const S = P.S, cs = ['v', 's', 'k', 'l'].filter(P.cupSeen); if (!cs.includes(cup)) cup = 'v';
      const I = P.cupNow(cup), ev = P.cupEvent(I), cu = P.CUPS[cup], nx = P.cupNextSeen();
      const pets = S.babies.concat(S.pets).filter(p => !P.out(p));
      const intro = cs.length === 1 ? '咕。村莊小賽每天都有，誰都可以報名。拿 3 次冠軍就升「銅級」，會有更大的盃賽來邀請喔。' : cup === 'l' ? '咕……傳說大會，一季只有一屆。能站上去的，都是傳說裡的名字。' : '咕咕！拿到的獎牌會一直掛在獎牌室，不會不見。';
      UI.panel(`<h2>🏆 大會</h2>${say('小貓頭鷹', intro)}
        <div class="row">${cs.map(c => `<button class="${c === cup ? 'ok' : 'alt'}" data-a="c" data-v="${c}">${P.CUPS[c].name}</button>`).join('')}</div>
        ${nx ? `<div class="muted">🔒 下一個：${NEXT[nx]}——${HOWTO[nx]}</div>` : ''}
        <div class="card"><b>第 ${I.ed} 屆${I.name}</b>｜今天的項目：<b>${ev.name}</b>（看 ${P.abName(ev.a)} 60%＋${P.abName(ev.b)} 40%${ev.sz ? `；${P.SIZE_INFO[ev.sz].name}的 +5%` : ''}）<div class="muted">${cu.txt}</div><div class="muted">獎品：冠軍 ${cu.prize[0]}｜亞軍 ${cu.prize[1]}｜季軍 ${cu.prize[2]}｜其他 ${cu.prize[3]}</div>${cup === 'v' ? `<div class="muted">今天比了 ${S.cup.day === P.dayKey(P.now()) ? S.cup.n : 0}/${C.cupDaily} 場</div>` : ''}<div class="muted">每一輪都有一點運氣：狀況好的時候會超常發揮，對手也一樣。</div></div>
        ${pets.map(p => { const why = P.cupCan(p, cup), pg = P.cupProg(p), od = why ? null : P.cupOdds(p, cup, ev); return `<div class="sk row2">${UI.av(p, 36)}<div class="grow">${esc(P.label(p))}　${P.RANK[p.rank || 0]}｜${pg.txt}${pg.next ? `（→ ${pg.next}）` : ''}${od ? `<div>這一屆：<b>${od.word}</b></div>` : ''}${why ? `<div class="muted">${why}</div>` : ''}</div><button data-a="go" data-v="${p.id}" ${why ? 'disabled' : ''}>報名</button></div>` }).join('')}`, (a, v) => {
        if (a === 'c') { cup = v; draw() }
        if (a === 'go') { const p = P.byId(+v), r = P.cupRun(p, cup); if (!r.ok) return UI.toast(r.msg); if (P.FEAT.cup && P.scenes.contest) { UI.close(); P.go('contest', { id: p.id, r }) } else runScreen(p, r) }
      });
    };
    UI.nav(draw);
  }
  function runScreen(p, r) {
    let shown = 0; const PL = ['', '🥇 冠軍', '🥈 亞軍', '🥉 季軍', '', '第一輪落敗'];
    const draw = () => UI.panel(`<h2>${r.I.name}｜${r.ev.name}</h2><div class="row2">${UI.av(p, 52)}<div class="grow"><b>${esc(P.label(p))}</b> 分數 ${r.me}</div></div>
      ${r.rounds.slice(0, shown).map(x => `<div class="card">${x.name}：對上 ${esc(x.f.n)}（${P.SP[x.f.sp].name}）<br>${x.me} vs ${x.op} → <b>${x.win ? '贏了！' : '輸了'}</b></div>`).join('')}
      ${shown < r.rounds.length ? '<div class="muted">比賽中……</div>' : `<div class="card"><b>${PL[r.place]}</b>${r.medal ? `｜🏅 ${esc(r.medal.name)}` : ''}${r.rankUp ? `｜🎉 升到 ${P.RANK[r.rankUp]}！` : ''}<br>收到：${r.got.join('、') || '—'}</div>`}`, () => { });
    UI.nav(draw); UI._refresh = null;
    const step = () => { if (!UI.isOpen()) return; shown++; draw(); if (shown < r.rounds.length) setTimeout(step, 900) };
    setTimeout(step, 700);
  }
  U.cup = cupScreen;

  // 場景：小屋裡面／獎牌室 → P5 搬到 pet/pet_room.js（正式背景＋獎牌小圖）
})(window.PET);
