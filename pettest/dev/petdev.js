/*DEV*/
// 開發者介面（只在測試版）：` 鍵、F9、右上角 DEV 按鈕、網址 ?dev=1 或 #dev 打開。
'use strict';
(function (P) {
  const C = P.CFG, H = 3600e3, D = 86400e3;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // ---------- 時鐘（暫停／加速／快轉） ----------
  const CK = 'petlab_clock';
  const clk = Object.assign({ off: 0, speed: 1, paused: 0, at: Date.now(), base: Date.now() }, JSON.parse(localStorage.getItem(CK) || '{}'));
  // 目前遊戲時間 = base + (現實經過) × speed + off
  function rebase() { const t = P.now(); clk.base = t; clk.off = 0; clk.at = Date.now(); localStorage.setItem(CK, JSON.stringify(clk)) }
  if (!localStorage.getItem(CK)) { clk.base = Date.now(); clk.at = Date.now() }
  P.now = () => clk.paused ? clk.base + clk.off : clk.base + (Date.now() - clk.at) * clk.speed + clk.off;
  const devSet = {
    speed(v) { rebase(); clk.speed = v; clk.paused = 0; rebase(); P.emit('dev', `時間速度 ×${v}`) },
    pause(v) { rebase(); clk.paused = v ? 1 : 0; rebase(); P.emit('dev', v ? '時間暫停' : '時間繼續') },
    jump(ms) { const t0 = P.now(); clk.off += ms; localStorage.setItem(CK, JSON.stringify(clk)); const t1 = performance.now(); P.advance(); P.save(); P.emit('dev', `快轉 ${fmtDur(ms)}（${new Date(t0).toISOString().slice(0, 16)}Z → ${new Date(P.now()).toISOString().slice(0, 16)}Z，計算 ${(performance.now() - t1).toFixed(0)}ms）`) },
    toNext5() { const k = P.dayKey(P.now()); devSet.jump(P.dayStart(k + 1) - P.now() + 1000) },
    setTime(t) { const d = t - P.now(); if (d < 0) { clk.off += d; localStorage.setItem(CK, JSON.stringify(clk)); P.advance(); P.emit('dev', '時間往回調（照規則不會有進度）') } else devSet.jump(d) },
    real() { clk.off = 0; clk.speed = 1; clk.paused = 0; clk.base = Date.now(); clk.at = Date.now(); localStorage.setItem(CK, JSON.stringify(clk)); P.emit('dev', '時間回到現實時間') },
  };
  function fmtDur(ms) { const a = Math.abs(ms); return (ms < 0 ? '-' : '') + (a >= D ? (a / D).toFixed(1) + ' 天' : a >= H ? (a / H).toFixed(1) + ' 小時' : (a / 60e3).toFixed(0) + ' 分') }
  // ---------- 事件日誌 ----------
  const LOG = []; let logF = '';
  try { LOG.push(...JSON.parse(sessionStorage.getItem('petlab_log') || '[]')) } catch (e) { }
  P.on(e => { LOG.push({ t: e.t, real: Date.now(), type: e.type, msg: e.msg }); if (LOG.length > 3000) LOG.splice(0, LOG.length - 3000); if (e.type === 'err') { errN++; btn && (btn.textContent = 'DEV ⚠' + errN) } dirtyLog = 1 });
  let errN = 0, dirtyLog = 0;
  setInterval(() => { if (dirtyLog) { dirtyLog = 0; try { sessionStorage.setItem('petlab_log', JSON.stringify(LOG.slice(-800))) } catch (e) { } } }, 2000);
  // ---------- 外觀 ----------
  const css = document.createElement('style'); css.textContent = `
#devBtn{position:fixed;top:6px;right:6px;z-index:20;background:#ff5d8f;color:#fff;min-width:56px}
body.panelOpen #devBtn{right:calc(min(440px,100vw) + 8px)}@media (max-width:520px){body.panelOpen #devBtn{display:none}}
#devP{position:fixed;left:0;top:0;bottom:0;width:min(520px,100vw);z-index:19;background:#141018f5;border-right:3px solid #ff5d8f;color:#eee;font-size:13px;display:flex;flex-direction:column;touch-action:pan-y}
#devP .tabs{display:flex;flex-wrap:wrap;gap:3px;padding:6px;border-bottom:2px solid #333}
#devP .tabs button{min-height:36px;font-size:13px;padding:2px 8px;background:#3a3040;color:#eee}#devP .tabs button.on{background:#ff5d8f;color:#fff}
#devP .body{flex:1;overflow-y:auto;padding:8px 10px 80px}
#devP button{min-height:38px;font-size:13px;padding:2px 8px;margin:2px}
#devP input,#devP select,#devP textarea{background:#221c26;color:#fff;border:1px solid #666;font-size:13px;min-height:32px}
#devP textarea{width:100%;min-height:90px;font-family:monospace;font-size:11px}
#devP .kv{display:grid;grid-template-columns:150px 1fr;gap:3px 6px;align-items:center}
#devP .kv input[type=number]{width:110px}
#devP h4{margin:10px 0 4px;color:#ff9dbb}
#devP .log{font-family:monospace;font-size:11px;white-space:pre-wrap;line-height:1.35}
#devP .log .err{color:#ff6b6b}#devP .log .roll,#devP .log .preg{color:#9cf}#devP .log .birth{color:#ffd54a}#devP .log .dev{color:#f9c}
#devP .mono{font-family:monospace;font-size:12px;white-space:pre-wrap}
@media (max-width:600px){#devP{width:100vw}}`;
  document.head.appendChild(css);
  let btn, box, tab = '時間', petSel = null;
  function mount() {
    btn = document.createElement('button'); btn.id = 'devBtn'; btn.textContent = 'DEV'; btn.onclick = () => toggle(); document.body.appendChild(btn);
    box = document.createElement('div'); box.id = 'devP'; box.className = 'hide'; document.body.appendChild(box);
    box.addEventListener('click', onClick); box.addEventListener('change', onChange);
    addEventListener('keydown', e => { if (e.code === 'Backquote' || e.code === 'F9') { e.preventDefault(); toggle() } });
    if (/[?&]dev=1/.test(location.search) || location.hash === '#dev') toggle(true);
    setInterval(() => { if (!box.classList.contains('hide') && LIVE[tab]) draw() }, 500);
  }
  function toggle(v) { const show = v != null ? v : box.classList.contains('hide'); box.classList.toggle('hide', !show); if (show) draw(); P.emit('dev', show ? '打開開發者介面' : '關閉開發者介面') }
  const LIVE = { 時間: 1, 機率: 0, 事件日誌: 1, 壓力: 1, 檢視: 1, 資源: 1 };
  const TABS = ['時間', 'P3', '遺傳', '資源', '寵物', '生成', '機率', '設定值', '上限冷卻', '存檔', '事件日誌', '壓力', '檢視'];
  function draw() {
    const sc = box.querySelector('.body') ? box.querySelector('.body').scrollTop : 0;
    const focus = document.activeElement && box.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (focus && LIVE[tab]) return;     // 正在打字時不要重畫
    box.innerHTML = `<div class="tabs">${TABS.map(t => `<button data-d="tab" data-v="${t}" class="${t === tab ? 'on' : ''}">${t}</button>`).join('')}<button data-d="close" class="bad">✕</button></div><div class="body">${VIEW[tab]()}</div>`;
    box.querySelector('.body').scrollTop = sc;
  }
  const num = (id, v, step) => `<input type="number" data-f="${id}" value="${v}" step="${step || 'any'}">`;
  const b = (act, label, v, cls) => `<button data-d="${act}" ${v != null ? `data-v="${esc(v)}"` : ''} class="${cls || ''}">${label}</button>`;
  const fmt = t => P.ui.fmtTime(t);
  const VIEW = {

    P3() {
      const S = P.S, fin = k => S[k] && S[k].until ? `（施工中，${fmt(S[k].until)}）` : S[k] === 1 ? '✔' : '';
      return `<h4>擴建</h4>${b('p3annex', '二館 立刻蓋好 ' + fin('annex'))}${b('p3farm', '農場 立刻蓋好 ' + fin('farm'))}${b('p3build', '施工中的馬上完工')}${b('p3fac', '農場設施全部蓋好')}${b('p3fill', '住民補滿')}
      <h4>明信片</h4><div class="mono">路上 ${S.mail.q.length} 封｜信箱 ${P.mailCount()} 疊｜橘寵保底 ${S.relPity.orange || 0}/${C.relOrangePity}</div>${b('p3mail', '路上的信現在全部寄到')}${b('p3mail12', '寄 12 封假明信片（測每天 10 張上限）')}
      <h4>材料</h4>${b('p3mats', '每種材料 +5（月光露、彩虹月光露、羽毛、露水、果實、星砂、勳果）')}
      <h4>集訓／探險</h4>${b('p3back', '集訓、探險 馬上回來')}${b('p3fat', '疲勞全部清空')}
      <h4>大會</h4>${b('p3cupv', '目前選的寵物 參加村莊小賽')}${b('p3rank', '目前選的寵物 升一級（銅→銀→金）')}${b('p3cupreset', '清掉「這一屆已經參加過」')}
      <h4>存檔</h4>${b('p3mig', 'P2c 存檔搬家測試（產生一份舊存檔→讀進來）')}`;
    },
    遺傳() {
      const S = P.S, p = cur(); const G2 = C.gen;
      return `<h4>遺傳學（數字在 P.CFG.gen）</h4><div class="mono">隱藏保底（玩家看不到）：全收容所 ${(S.mp || {}).all || 0}/${P.pityTh ? P.pityTh('all') : '?'}｜種族 ${Object.entries((S.mp || {}).sp || {}).map(([k, v]) => `${(P.SP[k] || {}).name || k} ${v}/${P.pityTh('sp', k)}`).join('、') || '—'}｜同一對 ${Object.entries((S.mp || {}).pair || {}).map(([k, v]) => `${k} ${v}/${P.pityTh('pair', k)}`).join('、') || '—'}｜突變 ${G2.mut}%｜混血 ${Object.keys(S.hybSeen || {}).length}/${Object.keys(P.HYB).length} 種｜手札 ${S.book.length}/${P.bookCap()}</div>
      <div class="mono">選的寵物：${p ? `${P.label(p)}｜毛色基因 ${p.coat.map(i => P.COAT[i]).join('/')}｜體型值 ${p.size}${p.sizeTag ? ' ' + p.sizeTag : ''}｜傳承 +${p.line}｜血緣 ${p.coi}｜遺傳值 ${JSON.stringify(p.ib)}｜熟練 ${JSON.stringify(p.mst)}｜潛藏 ${p.hid.join(',')}` : '（到「寵物」分頁選一隻）'}</div>
      ${b('gmut', '選的寵物 強制突變（隨機）')}${['coat', 'size', 'tal', 'sub', 'skill'].map(k => b('gmutk', '突變：' + k, k)).join('')}
      <h4>混血</h4>${Object.keys(P.HYB).map(k => b('ghyb', '生 ' + P.SP[k].name + ' 寶寶', k)).join('')}${b('ghybpair', '生成一對 狼＋獵犬（♡5）放進小屋 1')}${b('grecipe', '生成 星夜狼 的四祖配方一家（爸媽＝月牙犬＋霜尾狐）')}
      <h4>育兒籃</h4>${b('gmoon', '小屋 1 的育兒籃：放月光露（一定突變）')}${b('gmst', '選的寵物 技能熟練 +50')}${b('gask', 'P4 小屋 1：爸媽開口想出門（強制）')}${['bless', 'will', 'mark', 'memento', 'seed'].map(k => b('ggift', '直接答應＋臨別禮：' + P.FAREWELL[k].name, k)).join('')}${b('gpity', 'P4 小屋 1 這一對：保底填到 80%（看西施提示）')}${b('gproof', 'P4 傳說之證 +3')}${b('gatav', 'P4 選的寵物：隔代覺醒（強制）')}
      <h4>家譜</h4>${b('gtree', '看選的寵物的家譜')}${b('gfam3', '生成 3 代家族（選的寵物當曾孫）')}`;
    },
    時間() {
      const S = P.S, k = P.dayKey(P.now()), nx = P.dayStart(k + 1);
      return `<h4>遊戲時間（台北）</h4><div class="mono">現在：${fmt(P.now())}　第 ${k} 天
下一次 05:00 結算：${fmt(nx)}（還有 ${fmtDur(nx - P.now())}）
速度：${clk.paused ? '暫停' : '×' + clk.speed}　偏移：${fmtDur(P.now() - Date.now())}</div>
<div>${b('pause', clk.paused ? '▶ 繼續' : '⏸ 暫停', clk.paused ? 0 : 1)}${[1, 10, 60, 600, 3600].map(v => b('speed', '×' + v, v, clk.speed === v && !clk.paused ? 'ok' : '')).join('')}</div>
<div>${b('jump', '+10 分', 600e3)}${b('jump', '+1 小時', H)}${b('jump', '+6 小時', 6 * H)}${b('jump', '+12 小時', 12 * H)}${b('jump', '+1 天', D)}${b('jump', '+3 天', 3 * D)}${b('jump', '+7 天', 7 * D)}${b('next5', '跳到下一個 05:00', null, 'ok')}</div>
<div>自訂：<input type="datetime-local" data-f="settime" step="60"> ${b('settime', '設定')}　${b('jump', '-1 小時（測往回調）', -H, 'bad')}${b('real', '回現實時間', null, 'alt')}</div>
<h4>需求條預覽（全部寵物）</h4><div class="mono">${P.all().slice(0, 30).map(p => `${P.label(p).padEnd(6, '　')} 飽${p.need.f.toFixed(0)} 心${p.need.m.toFixed(0)} 淨${p.need.c.toFixed(0)} 好感${p.aff}${p.walk ? ' 散步中→' + fmt(p.walk.until) : ''}`).join('\n') || '（還沒有寵物）'}</div>`;
    },
    資源() {
      const S = P.S, f = [['gold', '金幣'], ['bread', '剩食麵包'], ['snackMat', '零食材料'], ['disk', '技能磁片'], ['shards', '刻印碎片'], ['collar', '金色項圈'], ['rep', '名聲']];
      return `<h4>資源</h4><div class="kv">${f.map(([k, n]) => `<span>${n}</span><span>${num('S.' + k, S[k], 1)}</span>`).join('')}
<span>幸福信 藍/紫/粉</span><span>${num('S.letters.b', S.letters.b, 1)}${num('S.letters.p', S.letters.p, 1)}${num('S.letters.k', S.letters.k, 1)}</span>
<span>星光／黃昏碎片</span><span>${num('S.frag.star', S.frag.star, 1)}${num('S.frag.dusk', S.frag.dusk, 1)}</span>
<span>連續照顧天數</span><span>${num('S.luck.streak', S.luck.streak, 1)}</span>
<span>已解鎖收容所</span><span>${num('S.unlock', S.unlock, 1)}</span>
<span>主遊戲最高通關難度</span><span><select data-f="S.diff">${C.DIFF.map((d, i) => `<option value="${i}" ${i === (S.diff || 0) ? 'selected' : ''}>${d.n}</option>`).join('')}</select></span>
<span>幸運石</span><span>${num('S.stone', S.stone || 0, 1)}</span></div>
<h4>便便（${P.poopN()}/${C.poopCap}）</h4><div>${b('poop5', '+5 坨', 5)}${b('poop5', '+10 坨', 10)}${b('poop5', '堆到 20 坨', 20)}${b('poopclr', '全部清掉（不給掉落）', null, 'bad')}${b('poopsim', '模擬：每天掃 20 坨 × 2000 天')}</div><div class="mono">${simTxt}</div><div class="muted">掃出的裝備：${S.gear.length} 件</div>
<div>${b('maxres', '全部補滿')}${b('zerores', '全部歸零', null, 'bad')}${b('replv', '名聲 Lv+1')}</div><div class="muted">名聲 Lv${P.repLv()}（${S.rep}）</div>`;
    },
    寵物() {
      const all = P.all(); if (!petSel || !P.byId(petSel)) petSel = all[0] && all[0].id;
      const p = P.byId(petSel);
      let h = `<h4>選一隻</h4><select data-f="petSel">${all.map(x => `<option value="${x.id}" ${x.id === petSel ? 'selected' : ''}>#${x.id} ${esc(P.label(x))} ${P.TIER_NAME[x.tier]}${x.star === 2 ? ' ✦' : x.star === 1 ? ' ·星痕' : ''}</option>`).join('')}</select>`;
      if (!p) return h + '<p>還沒有寵物。去「生成」加幾隻。</p>';
      const sel = (f, opts, v) => `<select data-f="${f}">${opts.map((o, i) => `<option value="${i}" ${i === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
      h += `<div class="kv">
<span>名字</span><input data-f="p.name" value="${esc(p.name || '')}">
<span>物種</span><select data-f="p.sp">${P.SPECIES.map(s => `<option value="${s.id}" ${s.id === p.sp ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
<span>位階</span>${sel('p.tier', P.TIER_NAME, p.tier)}
<span>寶寶</span>${sel('p.baby', ['否（成年）', '是'], p.baby ? 1 : 0)}
<span>性格</span>${sel('p.pers', P.PERS, p.pers)}
<span>資質</span>${sel('p.q', P.QUAL, p.q || 0)}
<span>星痕</span>${sel('p.star', ['0（沒有）', '1（帶星痕）', '2（星彩）'], p.star || 0)}
<span>代數</span>${num('p.g', p.g || 0, 1)}
<span>傳家技</span>${num('p.heir', p.heir || 0, 1)}
<span>好感（♡${P.heart(p.aff)}）</span><span>${num('p.aff', p.aff, 1)} ${[0, 100, 250, 450, 700, 1000].map(v => b('paff', v, v)).join('')}</span>
<span>等級／經驗</span><span>${num('p.lv', p.lv, 1)}${num('p.xp', p.xp || 0, 1)}</span>
<span>出戰場數</span>${num('p.battles', p.battles || 0, 1)}
<span>飽足／心情／乾淨</span><span>${num('p.need.f', p.need.f.toFixed(0), 1)}${num('p.need.m', p.need.m.toFixed(0), 1)}${num('p.need.c', p.need.c.toFixed(0), 1)}</span>
<span>年紀（天）</span>${num('p.age', P.ageDays(p) === 99 ? '' : P.ageDays(p), 1)}
<span>洗技能保底</span>${num('p.pity', p.pity || 0, 1)}
</div>
<div>${b('pfull', '需求全滿')}${b('plow', '需求降到 30')}${b('pequip', '設為出戰')}${b('pdel', '刪掉這隻', null, 'bad')}</div>
<h4>技能（${p.sk.length}/${C.slots[p.tier]} 格）</h4>${p.sk.map((n, i) => `<div>#${n} ${P.SK[n].name}（${P.CAT_NAME[P.SK[n].cat]}）${P.arenaApi.implemented(n) ? '' : ' <span class="muted">測試場還沒做效果</span>'} ${b('skdel', '移除', i, 'bad')}${b('skroll', '重擲', i)}</div>`).join('')}
<div><select data-f="skAdd">${P.SKILLS.map(s => `<option value="${s.n}">#${s.n} ${s.name}（${P.TIER_NAME[s.tier]}+／${P.CAT_NAME[s.cat]}）</option>`).join('')}</select>${b('skadd', '加入（不檢查限制）')}${b('skfill', '依規則補滿')}</div>
<h4>副屬性</h4><textarea data-f="p.sub">${esc(JSON.stringify(p.sub || []))}</textarea>
<div class="muted">格式：[["atk",2.5],["crit",1.2]]。代號：${P.SUBS.map(s => s.k + '=' + s.name).join('、')}</div>
<h4>原始資料</h4><textarea data-f="p.raw" style="min-height:140px">${esc(JSON.stringify(p))}</textarea>`;
      return h;
    },
    生成() {
      return `<h4>指定生成</h4><div class="kv">
<span>物種</span><select data-f="g.sp">${P.SPECIES.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
<span>位階</span><select data-f="g.tier">${P.TIER_NAME.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select>
<span>星痕</span><select data-f="g.star"><option value="0">0</option><option value="1">1（帶星痕）</option><option value="2">2（星彩）</option></select>
<span>寶寶</span><select data-f="g.baby"><option value="0">成年</option><option value="1">寶寶（已滿 3 天）</option><option value="2">剛出生寶寶</option></select>
<span>好感</span>${num('g.aff', G.aff, 1)}</div>
<div>${b('gen', '生成到收容所', null, 'ok')}${b('genpair', '生成一對（同物種、♡3、滿 3 天）')}</div>
<h4>快速</h4><div>${b('fill', '收容所補到滿（隨機）')}${b('wander', '馬上來一隻投靠（照機率擲位階）')}${b('wanderroll', '跑一次投靠判定')}${b('rescueall', '直接完成委託 r1（不用打）')}${b('questall', '委託全部解鎖（名聲 Lv7）')}${b('questdone', '把能接的委託直接完成')}${b('questreset', '委託全部重置', null, 'bad')}</div>
<h4>P5.1 倉庫／建造</h4><div>${b('p51ware', '倉庫直接蓋好（朝左，免費）', null, 'ok')}${b('p51wareup', '倉庫擴建一級（免費）')}${b('p51items', '每樣家具送 2 件進倉庫', null, 'ok')}${b('p51res', '資源補滿（金幣 1000 萬、麵包、刻印、名聲 Lv7）')}${b('p51adult', '選一隻大朋友帶出戰')}</div>
<h4>配對</h4><div>${b('cotpair', '把這一對放進小屋 1（沒有就蓋）')}${b('forcepreg', '小屋 1 馬上放育兒籃')}${b('pregroll', '小屋 1 擲一次育兒籃')}${b('forcebirth', '有育兒籃的全部馬上生')}${b('stone1', '幸運石 +1')}${b('dayroll', '馬上跑一次 05:00 結算')}</div>
<div class="muted">G 設定會記住：${esc(JSON.stringify(G))}</div>`;
    },
    機率() {
      const L = P.luck(true), o = P.tierOdds(), lv = P.repLv(); const wc = C.wanderOverride >= 0 ? C.wanderOverride : C.wanderChance[lv - 1];
      let h = `<h4>幸運點 ${L.sum}</h4><div class="mono">${Object.entries(L.d).map(([k, v]) => k + '：' + v).join('\n')}${C.luckOverride >= 0 ? '\n（被 luckOverride 蓋過）' : ''}</div>
<div class="kv"><span>強制幸運點（-1=照算）</span>${num('C.luckOverride', C.luckOverride, 1)}<span>關卡進度點</span>${num('C.progressPts', C.progressPts, 1)}<span>強制投靠機率（-1=照名聲）</span>${num('C.wanderOverride', C.wanderOverride, 1)}</div>
<h4>位階機率</h4><div class="mono">${P.TIER_NAME.slice(0, 4).map((n, i) => n + '：' + o[i].toFixed(2) + '%').join('\n')}\n投靠機率：${wc}%（名聲 Lv${lv}）</div>
<div>${b('simspawn', '模擬 10000 次位階')}</div><div class="mono">${simTxt}</div>
<h4>育兒籃機率</h4><div class="mono">${P.S.cots.map((c, i) => { const r = P.cotCheck(c); const ch = P.pregChance(c); const A = P.byId(c.a), B = P.byId(c.b); const so = A && B ? P.starOdds(A, B, c.stone || (c.basket && c.basket.stone)) : null; return `小屋 ${i + 1}：${r || ch.p.toFixed(1) + '%　' + Object.entries(ch.d).map(([k, v]) => k + v).join(' ') + ' ×' + ch.mul}${so ? `\n　寶寶星彩 ${(so.shiny * 100).toFixed(2)}%／帶星痕 ${(so.carrier * 100).toFixed(1)}%${c.stone ? '（有幸運石）' : ''}` : ''}` }).join('\n') || '還沒有小屋'}</div>
<h4>星彩／星痕</h4><div class="mono">野生星彩 1/${Math.round(1 / P.shinyRate())}（名聲 Lv${lv}）　野生帶星痕 1/${C.carrierOdds}　幸運石突變 ×${C.stoneMul}</div>
<h4>便便</h4><div class="mono">現在 ${P.poopN()}/${C.poopCap}（散落 ${P.S.poop.length}、堆肥坑 ${P.S.heap}）　速度 ${P.poopPerH().toFixed(2)} 坨/小時（堆滿約 ${(C.poopCap / Math.max(0.01, P.poopPerH())).toFixed(1)} 小時）
主遊戲難度 ${C.DIFF[P.S.diff || 0].n}：小兵裝備 ${P.mobGearPct(P.S.diff || 0).toFixed(2)}%/隻；便便每坨 ${P.TIER_NAME.map((n, t) => n + ' ' + P.poopGearPct(t).toFixed(3) + '%').join('　')}
稀有度權重：${P.rarW(P.S.diff || 0).map(([r, w]) => C.GEAR_RAR[r] + ' ' + w.toFixed(2)).join('　')}
今天已掃出：麵包 ${(P.S.sweep && P.S.sweep.bread) || 0}/${C.poopBreadDay}　裝備 ${(P.S.sweep && P.S.sweep.gear) || 0}/${C.poopGearDay}</div>`;
      const p = P.byId(petSel); if (p && p.baby) { const ws = P.skillWeights(p, -1), t = ws.reduce((a, x) => a + x.w, 0); h += `<h4>技能機率（${esc(P.label(p))}，重擲新的一格）</h4><div class="mono">${ws.sort((a, b) => b.w - a.w).map(x => `#${x.s.n} ${x.s.name} ${(x.w / t * 100).toFixed(2)}% ${x.why}`).join('\n')}</div>` }
      return h;
    },
    設定值() {
      let h = `<h4>全部設定值（P.CFG）</h4><div class="muted">數字直接改；陣列和物件用 JSON。改了馬上生效並記住（存在 petlab_cfg）。</div><div class="kv">`;
      for (const k of Object.keys(C)) { if (k === 'saveKey') continue; const v = C[k]; h += `<span title="${k}">${k}</span>` + (typeof v === 'number' ? num('C.' + k, v) : `<input data-f="Cj.${k}" value="${esc(JSON.stringify(v))}">`) }
      return h + `</div><div>${b('cfgreset', '設定值全部還原', null, 'bad')}${b('cfgexport', '匯出設定值')}</div><textarea data-f="cfgio" placeholder="匯出的設定值在這裡；貼上後按「匯入設定值」">${esc(cfgTxt)}</textarea>${b('cfgimport', '匯入設定值')}`;
    },
    上限冷卻() {
      return `<h4>每日上限</h4><div>${b('capoff', C.capOff ? '每日上限：關掉中（點一下打開）' : '每日上限：開著（點一下關掉）', null, C.capOff ? 'bad' : 'ok')}${b('resetday', '重置今天的次數（全部寵物）')}</div>
<div class="kv">${Object.keys(C.daily).map(k => `<span>${k} 每天</span>${num('Cd.' + k, C.daily[k], 1)}`).join('')}</div>
<h4>冷卻</h4><div class="kv"><span>寵物技能冷卻倍率</span>${num('C.skillCdMul', C.skillCdMul, 0.05)}<span>寵物普攻間隔（秒）</span>${num('C.petAtkInterval', C.petAtkInterval, 0.1)}<span>王控制共用冷卻</span>${num('C.bossCtrlShare', C.bossCtrlShare, 1)}</div>
<div>${b('cdreset', '測試場：技能冷卻全部清掉')}${b('sentclear', '清掉「叫回來」紀錄')}${b('coolclear', '清掉小屋休息')}</div>`;
    },
    存檔() {
      const snaps = [1, 2, 3].map(i => { const s = localStorage.getItem('petlab_snap_' + i); return `<div>快照 ${i}：${s ? (s.length / 1024).toFixed(1) + ' KB' : '空'} ${b('snapsave', '存', i)}${s ? b('snapload', '讀', i, 'alt') : ''}</div>` }).join('');
      return `<h4>存檔（${C.saveKey}，${(JSON.stringify(P.S).length / 1024).toFixed(1)} KB）</h4>
<div>${b('reset', resetArm ? '真的要重置？再按一次' : '一鍵重置（要按兩次）', null, 'bad')}${b('export', '匯出（下載 JSON）')}${b('exporttxt', '匯出到下面')}</div>
<textarea data-f="saveio" placeholder="貼上存檔 JSON 後按匯入">${esc(saveTxt)}</textarea><div>${b('import', '匯入下面的 JSON', null, 'ok')} <input type="file" data-f="savefile" accept=".json,application/json"></div>
<h4>快照</h4>${snaps}`;
    },
    事件日誌() {
      const types = [...new Set(LOG.map(l => l.type))];
      const ls = LOG.filter(l => !logF || l.type === logF).slice(-400).reverse();
      return `<div><select data-f="logF"><option value="">全部（${LOG.length}）</option>${types.map(t => `<option ${t === logF ? 'selected' : ''}>${t}</option>`).join('')}</select>${b('logexp', '匯出')}${b('logclr', '清空', null, 'bad')}</div>
<div class="log">${ls.map(l => `<div class="${l.type}">[${fmt(l.t)}] ${l.type}｜${esc(l.msg)}</div>`).join('')}</div>`;
    },
    壓力() {
      return `<h4>效能</h4><div class="mono">FPS：${P.fps.toFixed(0)}
寵物數：${P.S.pets.length} 成年＋${P.S.babies.length} 寶寶
存檔大小：${(JSON.stringify(P.S).length / 1024).toFixed(1)} KB
日誌筆數：${LOG.length}
${stressTxt}</div>
<div>${b('stress200', '加 200 隻（暫時放寬上限）')}${b('stress365', '快轉 365 天（計時）')}${b('stressclr', '刪掉壓力測試的寵物', null, 'bad')}</div>`;
    },
    檢視() {
      const A = P.arena;
      let h = `<h4>測試場</h4><div>${b('view', P.devView ? '碰撞框／AI 狀態：開' : '碰撞框／AI 狀態：關', null, P.devView ? 'ok' : '')}${b('god', P.arenaGod ? '主角無敵：開' : '主角無敵：關', null, P.arenaGod ? 'ok' : '')}</div>`;
      if (!A) return h + '<p class="muted">進測試場（出戰）後這裡可以生怪、放技能。</p>';
      const tot = Object.values(A.dmg).reduce((a, b) => a + b, 0) || 1;
      h += `<div>${['minion', 'axe', 'archer'].map(k => b('spawn', '生 ' + k, k)).join('')}${b('spawn', '生菁英斧兵', 'axe!')}${b('spawn', '生王', 'boss')}${b('heal', '主角補滿')}${b('cdreset', '冷卻清掉')}</div>
<div><select data-f="castN">${P.SKILLS.map(s => `<option value="${s.n}">#${s.n} ${s.name}${P.arenaApi.implemented(s.n) ? '' : '（未做）'}</option>`).join('')}</select>${b('cast', '馬上放這招', null, 'ok')}</div>
<div class="mono">傷害佔比：${Object.entries(A.dmg).map(([k, v]) => `${k} ${(v / tot * 100).toFixed(1)}%`).join('　')}
寵物額外糧食：${A.extra}/${A.extraCap}　今日寵物糧食：${P.S.extra.bread}
食物槽：${A.food}/${C.foodSlot}　這場剩食麵包：${A.bread}
${A.en.filter(e => !e.dead).map(e => `${e.kind}#${e.id}${e.elite ? '★' : ''} HP ${Math.round(e.hp)} ${e.act}${e.poly ? ' 變身:' + e.poly.skin : ''} ${Object.keys(e.st).filter(k => { const v = e.st[k]; return v && (typeof v === 'number' ? v > A.t : v.u > A.t) }).join(',')}`).join('\n')}</div>`;
      return h;
    },
  };
  const G = { sp: 'shihtzu', tier: 2, star: 0, baby: 1, aff: 300 }; let simTxt = '', cfgTxt = '', saveTxt = '', stressTxt = '', resetArm = 0;
  function saveCfg() { const d = {}; for (const k in C) if (JSON.stringify(C[k]) !== JSON.stringify(P.CFG_DEFAULT[k])) d[k] = C[k]; localStorage.setItem('petlab_cfg', JSON.stringify(d)) }
  function cur() { return P.byId(petSel) }
  function genPet(o) {
    const k = P.dayKey(P.now()); const baby = +o.baby;
    const p = P.makeAnimal({ sp: o.sp, tier: +o.tier, look: Math.min(3, +o.tier), star: +o.star || 0, aff: +o.aff, baby: baby ? 1 : 0, bornDay: baby === 1 ? k - 3 : baby === 2 ? k : undefined });
    if (!baby && +o.tier > 0) { p.baby = 1; p.bornDay = k - 3; P.fillSkills(p); P.fillSubs(p) }   // 有位階的一定是寶寶
    if (baby) P.S.babies.push(p); else P.addResident(p, '（開發者生成）');
    if (baby) P.emit('dev', `生成 ${P.label(p)} ${P.TIER_NAME[p.tier]}`);
    return p;
  }
  function onClick(e) {
    const t = e.target.closest('[data-d]'); if (!t) return; const a = t.dataset.d, v = t.dataset.v; const S = P.S;
    const run = {
      tab: () => { tab = v }, close: () => toggle(false),

      p51ware: () => { P.p51Fix(S); if (!S.ware.built) { S.ware.built = 1; S.ware.lv = 0; S.ware.face = 'L' } P.save() },
      p51wareup: () => { P.p51Fix(S); if (!S.ware.built) S.ware.built = 1; S.ware.lv = Math.min(P.CFG.ware.slots.length - 1, S.ware.lv + 1) },
      p51items: () => { P.p51Fix(S); if (!S.ware.built) S.ware.built = 1; S.ware.lv = Math.max(S.ware.lv, P.CFG.ware.slots.length - 1); for (const k of Object.keys(P.YITEM)) S.ware.items[k] = (S.ware.items[k] || 0) + 2 },
      p51res: () => { S.gold = Math.max(S.gold, 1e7); S.bread = Math.max(S.bread, 2000); S.shards = Math.max(S.shards, 999); S.rep = Math.max(S.rep, P.CFG.repLv[6] || 99999) },
      p51adult: () => { const p = S.pets.find(q => !q.away); if (p) { S.eq = p.id; P.ui.toast(P.label(p) + ' 會跟你出戰（大朋友）') } },
      p3annex: () => { S.annex = 1; P.justBuilt = 'annex' }, p3farm: () => { S.annex = 1; S.farm = 1; S.fac.grass = 1; P.justBuilt = 'farm' },
      p3build: () => { for (const k of ['annex', 'farm']) if (S[k] && S[k].until) S[k].until = P.now() - 1; P.advance() },
      p3fac: () => { S.annex = 1; S.farm = 1; for (const f of P.FAC) if (f.real) S.fac[f.k] = 1 },
      p3fill: () => { let g = 0; while (S.pets.length < P.houseCap() && g++ < 40) P.addResident(P.makeAnimal({ tier: 0 }), '（開發者補滿）') },
      p3mail: () => { for (const m of S.mail.q) m.at = Math.min(m.at, P.now() - 1); P.advance() },
      p3mail12: () => { for (let i = 0; i < 12; i++) S.mail.q.push({ mid: 'dev' + i, n: 1, at: P.now() - 1, pet: { sp: 'cat', tier: 1, look: 1, name: '測試' + (i + 1) }, g: 0, rw: { gold: 100 }, last: true, end: '在海邊住下了', place: '海邊的小鎮' }); P.advance() },
      p3mats: () => { for (const k of ['pollen', 'rainbow', 'feather', 'dew', 'fruit', 'wish', 'crown']) S.mat[k] = (S.mat[k] || 0) + 5 },
      p3back: () => { for (const p of P.all()) if (p.away) p.away.until = P.now() - 1; for (const t of S.exp.teams) t.until = P.now() - 1; P.advance() },
      p3fat: () => { for (const p of P.all()) { p.fat = 0; p.restU = 0 } },
      p3cupv: () => { const p = cur(); if (!p) return P.ui.toast('先選寵物'); const r = P.cupRun(p, 'v'); P.ui.toast(r.ok ? `名次 ${r.place}` : r.msg) },
      p3rank: () => { const p = cur(); if (!p) return; P.abInit(p); p.rank = Math.min(3, (p.rank || 0) + 1) },
      p3cupreset: () => { for (const p of P.all()) p.cupDone = {}; S.cup.n = 0 },
      p3mig: () => { const old = { v: 1, unlock: 1, gold: 1000, bread: 10, snackMat: 0, disk: 0, shards: 0, collar: 0, rep: 100, pets: [{ id: 900, sp: 'cat', tier: 0, aff: 200, pers: 1, q: 1, need: { f: 80, m: 80, c: 80 }, fav: { hero: 0, spot: '頭' } }], babies: [{ id: 901, sp: 'fox', tier: 2, baby: 1, lv: 5, q: 2, sk: [1], sub: [['atk', 1.2]], aff: 120, pers: 0, need: { f: 80, m: 80, c: 80 }, fav: { hero: 0, spot: '頭' }, bornDay: 1 }], cots: [], wander: [], wait: [], codex: {}, codexS: {}, letters: { b: 1, p: 0, k: 0 }, nid: 1000 }; localStorage.setItem('petlab_snap_p2c', JSON.stringify(old)); try { P.importJSON(JSON.stringify(old)); P.go('shelter'); P.ui.toast('P2c 存檔搬家成功：' + P.all().length + ' 隻、能力 ' + Math.round(P.abil(P.all()[0]).total)) } catch (x) { P.ui.toast('搬家失敗：' + x.message) } },
      gmut: () => { const p = cur(); if (p) P.applyMut(p) }, gmutk: () => { const p = cur(); if (p) P.applyMut(p, v) },
      ghyb: () => { const k = P.dayKey(P.now()); const p = P.makeAnimal({ sp: v, tier: 2, look: 2, baby: 1, bornDay: k - 3, aff: 300 }); S.babies.push(p); S.hybSeen[v] = (S.hybSeen[v] || 0) + 1; P.codexSee(v, 2, 0); P.famRec(p); petSel = p.id; P.emit('dev', '生成混血 ' + P.label(p)) },
      ghybpair: () => { const a = P.makeAnimal({ sp: 'wolf', tier: 0, aff: 900 }), c = P.makeAnimal({ sp: 'retriever', tier: 0, aff: 900 }); S.pets.push(a, c); P.famRec(a); P.famRec(c); if (!S.cots.length) S.cots.push({ a: 0, b: 0, since: P.now() }); P.setCot(S.cots[0], a.id, c.id); S.cots[0].cool = 0 },
      grecipe: () => { const mk = (sp, par) => { const p = P.makeAnimal({ sp, tier: 0, aff: 900, par }); S.pets.push(p); P.famRec(p); return p }; const [a, c, d, e] = ['wolf', 'retriever', 'fox', 'wolf'].map(sp => mk(sp)); const f = mk('moonhound', [a.id, c.id]), m = mk('frostfox', [d.id, e.id]); if (!S.cots.length) S.cots.push({ a: 0, b: 0, since: P.now() }); P.setCot(S.cots[0], f.id, m.id); S.cots[0].cool = 0; S.cots[0].basket = { since: P.now() - 12 * H, a: f.id, b: m.id, sync: 2, forceSp: 'starwolf' }; P.ui.toast('小屋 1：月牙犬＋霜尾狐，育兒籃已放好（按「強制出生」）') },
      gask: () => { const c = S.cots[0]; if (!c || !c.basket) return P.ui.toast('小屋 1 沒有育兒籃'); c.basket.askR = 0; c.basket.ask = null; P.askRoll(c, 1); P.ui.close(); P.ui3.askScreen(c) },
      ggift: () => { const c = S.cots[0]; if (!c || !c.basket) return P.ui.toast('小屋 1 沒有育兒籃'); c.basket.askR = 0; c.basket.ask = null; P.askRoll(c, 1); P.askAnswer(c, true, v); P.ui.toast('臨別禮：' + P.FAREWELL[v].name) },
      gpity: () => { const c = S.cots[0]; if (!c || !c.basket) return P.ui.toast('小屋 1 沒有育兒籃'); const k = [c.a, c.b].sort((x, y) => x - y).join('-'); S.mp.pair[k] = Math.ceil(P.pityTh('pair', k) * 0.8) },
      gproof: () => { S.mat.proof = (S.mat.proof || 0) + 3; P.seen('proof') },
      gatav: () => { const p = cur(); if (!p) return; const id = p.sk && p.sk[0] != null && p.sk[0] < 100 ? p.sk[0] : 1; const n = P.ATAV[id]; (p.hid = p.hid || []).push(n); p.atav = n; P.ui.toast('潛藏了 ' + P.SK[n].name) },
      gmoon: () => { const c = S.cots[0]; if (!c || !c.basket) return P.ui.toast('小屋 1 沒有育兒籃'); c.basket.pollen = 1 },
      gmst: () => { const p = cur(); if (p) for (const n of p.sk) p.mst[n] = Math.min(100, (p.mst[n] || 0) + 50) },
      gtree: () => { const p = cur(); if (!p) return P.ui.toast('先選寵物'); toggle(false); P.ui3.tree(p.id) },
      gfam3: () => { const p = cur(); if (!p) return; const mk = (par, champ) => { const q = P.makeAnimal({ sp: p.sp, tier: 1, baby: 1, bornDay: 1, par }); q.medals = champ ? [{ c: 'v', ed: 1, pl: 1, name: '第 1 屆村莊小賽 冠軍' }, { c: 'v', ed: 2, pl: 1, name: '第 2 屆村莊小賽 冠軍' }] : []; P.famRec(q); S.fam[q.id].baby = 1; return q }; const g3 = [0, 1, 2, 3, 4, 5, 6, 7].map(i => mk(null, i < 3)); const g2 = [0, 1, 2, 3].map(i => mk([g3[i * 2].id, g3[i * 2 + 1].id])); const g1 = [0, 1].map(i => mk([g2[i * 2].id, g2[i * 2 + 1].id])); p.par = [g1[0].id, g1[1].id]; P.famRec(p); P.ui.toast('家族建好了（祖先冠軍 6 次 → 名門）') },
      pause: () => devSet.pause(+v), speed: () => devSet.speed(+v), jump: () => devSet.jump(+v), next5: () => devSet.toNext5(), real: () => devSet.real(),
      settime: () => { const i = box.querySelector('[data-f=settime]').value; if (!i) return; const [d, tm] = i.split('T'); const [y, mo, da] = d.split('-').map(Number); const [hh, mi] = tm.split(':').map(Number); devSet.setTime(Date.UTC(y, mo - 1, da, hh - C.tz, mi)) },
      maxres: () => { Object.assign(S, { gold: 9999999, bread: 999, snackMat: 999, disk: 999, shards: 999, collar: 99 }); S.letters = { b: 99, p: 99, k: 99 } },
      zerores: () => { Object.assign(S, { gold: 0, bread: 0, snackMat: 0, disk: 0, shards: 0, collar: 0 }); S.letters = { b: 0, p: 0, k: 0 } },
      replv: () => { const l = P.repLv(); if (C.repLv[l] != null) S.rep = C.repLv[l] },
      paff: () => { cur().aff = +v }, pfull: () => { cur().need = { f: 100, m: 100, c: 100 } }, plow: () => { cur().need = { f: 30, m: 30, c: 30 } },
      pequip: () => { const p = cur(); if (!p.baby) return P.ui.toast('只有寶寶能出戰'); S.eq = p.id }, pdel: () => { const p = cur(); S.pets = S.pets.filter(x => x !== p); S.babies = S.babies.filter(x => x !== p); petSel = null },
      skdel: () => { cur().sk.splice(+v, 1) }, skroll: () => { const p = cur(); const n = P.rollSkill(p, +v); if (n) p.sk[+v] = n },
      skadd: () => { const n = +box.querySelector('[data-f=skAdd]').value; const p = cur(); if (!p.sk.includes(n)) p.sk.push(n); P.emit('dev', `${P.label(p)} 加技能 #${n}`) }, skfill: () => P.fillSkills(cur()),
      gen: () => { const p = genPet(G); petSel = p.id },
      genpair: () => { const a = genPet(Object.assign({}, G, { aff: Math.max(250, G.aff) })), c = genPet(Object.assign({}, G, { aff: Math.max(250, G.aff) })); pair = [a.id, c.id]; P.ui.toast('生成一對：' + P.label(a) + ' ＋ ' + P.label(c)) },
      fill: () => { let g = 0; while (S.pets.length < P.houseCap() && g++ < 40) { const p = P.makeAnimal({ tier: 0 }); P.addResident(p, '（開發者補滿）') } },
      wander: () => { const p = P.spawnAnimal('開發者'); if (p) { S.wander.push(p); P.emit('wander', `${P.label(p)}（${P.TIER_NAME[p.tier]}）在門口`) } },
      wanderroll: () => { const o = C.wanderOverride; C.wanderOverride = 100; try { const s = P.S.wander.length; P.advance(); /* 單擲 */ const pr = P.tierOdds(); P.emit('dev', '投靠判定：用 next5 才會走正式流程；這裡直接生') } finally { C.wanderOverride = o } run.wander() },
      rescueall: () => { if (S.unlock) return P.ui.toast('已經救過了'); P.questCages(P.QU.r1).forEach(c => P.rescue(c.sp, { tier: c.tier, star: c.star, quest: 'r1' })); P.questDone('r1'); P.go('shelter') },
      questall: () => { if (S.rep < C.repLv[6]) S.rep = C.repLv[6]; P.QUESTS.forEach(q => { if (q.req.done && !(S.quests[q.req.done] || {}).done) { S.quests[q.req.done] = Object.assign(S.quests[q.req.done] || {}, { done: 1 }) } }); P.emit('dev', '委託全部解鎖') },
      questdone: () => { for (const q of P.QUESTS) if (P.questInfo(q).state === 'open') { P.questCages(q).forEach(c => P.rescue(c.sp, { tier: c.tier, star: c.star, quest: q.id })); P.questDone(q.id) } },
      questreset: () => { S.quests = S.unlock ? { r1: { done: 1 } } : {}; P.emit('dev', '委託重置') },
      stone1: () => { S.stone = (S.stone || 0) + 1 },
      poop5: () => { for (let i = 0; i < +v; i++) { if (P.poopN() >= C.poopCap) break; const Y = P.POOP_YARD, all = P.all(), w = all[Math.floor(Math.random() * all.length)]; S.poop.push({ x: P.ri(Y.x0, Y.x1), y: P.ri(Y.y0, Y.y1), big: w && w.sp === 'bear' && Math.random() < .3 && P.poopN() + 2 <= C.poopCap ? 1 : 0, by: w ? w.id : 0, tier: w ? w.tier : 0, t: 0 }) } },
      poopclr: () => { S.poop = []; S.heap = 0; S.heapBig = 0; S.heapG = [] },
      poopsim: () => { const keep = JSON.stringify({ sweep: S.sweep, bread: S.bread, gear: S.gear.length, frag: S.frag.star, stone: S.stone }); const N = 2000; let g = 0, rs = [0, 0, 0, 0, 0, 0, 0]; const s0 = Object.assign({}, S.sweep); const cap = C.poopGearDay; C.poopGearDay = 1e9; for (let d = 0; d < N; d++) { S.sweep = { day: -9, bread: 0, star: 0 }; const all = P.all(); S.poop = []; for (let i = 0; i < 20; i++) { const w = all[i % Math.max(1, all.length)]; S.poop.push({ x: 0, y: 0, tier: w ? w.tier : 0 }) } const r = P.sweepPoop('all'); g += r.gear.length; r.gear.forEach(x => rs[x.r]++) } C.poopGearDay = cap; S.gear.splice(S.gear.length - g, g); const k = JSON.parse(keep); S.sweep = k.sweep; S.bread = k.bread; S.frag.star = k.frag; S.stone = k.stone; simTxt = `模擬 ${N} 天、每天掃 20 坨（${C.DIFF[S.diff || 0].n}，不算每日上限）：每天平均 ${(g / N).toFixed(3)} 件裝備｜` + rs.map((x, i) => x ? C.GEAR_RAR[i] + ' ' + x : '').filter(Boolean).join('　') },
      cotpair: () => { if (!S.cots.length) S.cots.push({ a: 0, b: 0, since: P.now() }); let [a, c] = pair || []; if (!P.byId(a) || !P.byId(c)) { const all = P.all(); outer: for (const x of all) for (const y of all) if (x !== y && x.sp === y.sp) { a = x.id; c = y.id; break outer } } if (!a) return P.ui.toast('找不到同物種的兩隻'); P.setCot(S.cots[0], a, c) },
      forcepreg: () => { const c = S.cots[0]; if (!c) return P.ui.toast('沒有小屋'); if (!P.byId(c.a) || !P.byId(c.b)) return P.ui.toast('小屋 1 要住兩隻'); c.basket = { since: P.now() - 12 * H, a: c.a, b: c.b, sync: P.cotSync(c), stone: c.stone ? 1 : 0 }; c.stone = 0; P.emit('preg', '（開發者）小屋 1 門口放了育兒籃') },
      pregroll: () => { const c = S.cots[0]; if (c) P.pregRoll(c, P.dayKey(P.now())) },
      forcebirth: () => { for (const c of S.cots) if (c.basket) P.birth(c, P.dayKey(P.now())) },
      dayroll: () => devSet.toNext5(),
      simspawn: () => { const o = P.tierOdds(), c = [0, 0, 0, 0]; for (let i = 0; i < 10000; i++) { const r = Math.random() * 100; let acc = 0; for (let j = 0; j < 4; j++) { acc += o[j]; if (r < acc) { c[j]++; break } } } simTxt = '模擬 10000 次：' + c.map((x, i) => P.TIER_NAME[i] + ' ' + (x / 100).toFixed(2) + '%').join('　') },
      cfgreset: () => { for (const k in P.CFG_DEFAULT) if (k !== 'saveKey' && k !== 'houseCap') C[k] = JSON.parse(JSON.stringify(P.CFG_DEFAULT[k])); localStorage.removeItem('petlab_cfg'); P.emit('dev', '設定值還原') },
      cfgexport: () => { cfgTxt = JSON.stringify(C, null, 1) }, cfgimport: () => { try { const o = JSON.parse(box.querySelector('[data-f=cfgio]').value); delete o.saveKey; Object.assign(C, o); saveCfg(); P.emit('dev', '匯入設定值') } catch (x) { P.ui.toast('格式不對：' + x.message) } },
      capoff: () => { C.capOff = C.capOff ? 0 : 1; saveCfg(); P.emit('dev', '每日上限 ' + (C.capOff ? '關掉' : '打開')) },
      resetday: () => { for (const p of P.all()) p.day = null; for (const c of S.cots) c.play = null; S.births = { day: -1, n: 0 }; S.giftDay = { day: -1, n: 0 }; S.extra = { day: -1, bread: 0, shard: 0 }; P.emit('dev', '今天的次數全部重置') },
      cdreset: () => P.arenaApi.resetCd(), sentclear: () => { S.sent = null }, coolclear: () => { for (const c of S.cots) c.cool = 0 },
      reset: () => { if (!resetArm) { resetArm = 1; setTimeout(() => { resetArm = 0; if (tab === '存檔') draw() }, 4000); return } resetArm = 0; localStorage.removeItem(C.saveKey); P.S = P.newState(); P.save(); P.emit('dev', '一鍵重置存檔'); P.go('shelter') },
      export: () => { const bl = new Blob([P.exportJSON()], { type: 'application/json' }); const u = URL.createObjectURL(bl); const aa = document.createElement('a'); aa.href = u; aa.download = 'petlab_save_' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '') + '.json'; aa.click(); setTimeout(() => URL.revokeObjectURL(u), 1000) },
      exporttxt: () => { saveTxt = P.exportJSON() },
      import: () => { try { P.importJSON(box.querySelector('[data-f=saveio]').value); P.go('shelter'); P.ui.toast('匯入成功') } catch (x) { P.ui.toast('匯入失敗：' + x.message) } },
      snapsave: () => { localStorage.setItem('petlab_snap_' + v, P.exportJSON()); P.emit('dev', '存快照 ' + v) }, snapload: () => { P.importJSON(localStorage.getItem('petlab_snap_' + v)); P.go('shelter'); P.emit('dev', '讀快照 ' + v) },
      logexp: () => { const bl = new Blob([LOG.map(l => `${new Date(l.t).toISOString()}\t${l.type}\t${l.msg}`).join('\n')], { type: 'text/plain' }); const aa = document.createElement('a'); aa.href = URL.createObjectURL(bl); aa.download = 'petlab_log.txt'; aa.click() },
      logclr: () => { LOG.length = 0; errN = 0; btn.textContent = 'DEV' },
      stress200: () => { const t = performance.now(), cap = C.houseCap; C.houseCap = 99999; for (let i = 0; i < 200; i++) { const p = P.makeAnimal({ tier: 0, stress: 1 }); S.pets.push(p) } C.houseCap = cap; stressTxt = `加 200 隻花 ${(performance.now() - t).toFixed(0)}ms` },
      stress365: () => { const t = performance.now(); devSet.jump(365 * D); stressTxt = `快轉 365 天花 ${(performance.now() - t).toFixed(0)}ms` },
      stressclr: () => { S.pets = S.pets.filter(p => !p.stress); stressTxt = '已刪掉' },
      view: () => { P.devView = !P.devView }, god: () => { P.arenaGod = !P.arenaGod },
      spawn: () => P.arenaApi.spawn(v.replace('!', ''), v.endsWith('!')), heal: () => P.arenaApi.heal(),
      cast: () => { const n = +box.querySelector('[data-f=castN]').value; const r = P.arenaApi.skill(n); P.ui.toast(r || '放出 #' + n) },
    };
    if (run[a]) { try { run[a]() } catch (x) { console.error(x); P.emit('err', '開發者介面錯誤：' + x.message) } P.save(); P.ui.hud(); P.ui.refreshPanel(); draw() }
  }
  let pair = null;
  function onChange(e) {
    const f = e.target.dataset.f; if (!f) return; const val = e.target.value, S = P.S, p = cur();
    try {
      if (f === 'petSel') petSel = +val;
      else if (f === 'logF') logF = val;
      else if (f.startsWith('g.')) G[f.slice(2)] = val;
      else if (f.startsWith('S.')) { const ks = f.slice(2).split('.'); let o = S; while (ks.length > 1) o = o[ks.shift()]; o[ks[0]] = +val }
      else if (f.startsWith('Cd.')) { C.daily[f.slice(3)] = +val; saveCfg() }
      else if (f.startsWith('Cj.')) { C[f.slice(3)] = JSON.parse(val); saveCfg(); P.emit('dev', `設定 ${f.slice(3)} = ${val}`) }
      else if (f.startsWith('C.')) { C[f.slice(2)] = +val; saveCfg(); P.emit('dev', `設定 ${f.slice(2)} = ${val}`) }
      else if (f === 'p.raw') { const o = JSON.parse(val); Object.keys(p).forEach(k => delete p[k]); Object.assign(p, o) }
      else if (f === 'p.sub') p.sub = JSON.parse(val);
      else if (f === 'p.age') { p.baby = 1; p.bornDay = P.dayKey(P.now()) - +val }
      else if (f === 'savefile') { const fl = e.target.files[0]; if (fl) fl.text().then(t => { P.importJSON(t); P.go('shelter'); P.ui.toast('匯入成功') }).catch(x => P.ui.toast('匯入失敗：' + x.message)); return }
      else if (f.startsWith('p.need.')) p.need[f.slice(7)] = +val;
      else if (f.startsWith('p.')) {
        const k = f.slice(2); const strK = ['name', 'sp'];
        const nv = strK.includes(k) ? val : +val;
        if (k === 'baby') { p.baby = nv; const S2 = P.S; S2.pets = S2.pets.filter(x => x !== p); S2.babies = S2.babies.filter(x => x !== p); (nv ? S2.babies : S2.pets).push(p); if (nv) { if (p.bornDay == null) p.bornDay = P.dayKey(P.now()) - 3; if (!p.tier) p.tier = 1; P.fillSkills(p); P.fillSubs(p) } else { p.tier = 0; p.sk = []; p.sub = [] } }
        else p[k] = nv;
        if (k === 'tier') { p.look = Math.min(3, nv); if (p.baby) { P.fillSkills(p); P.fillSubs(p) } }
        P.emit('dev', `${P.label(p)} ${k} = ${val}`);
      } else return;
    } catch (x) { P.ui.toast('沒改成：' + x.message); return }
    P.save(); P.ui.hud(); P.ui.refreshPanel(); if (!/^(C\.|Cj\.|Cd\.|S\.|g\.)/.test(f) || f.startsWith('g.')) draw();
  }
  // 測試場檢視：碰撞框、AI 狀態
  P.arenaView = (ctx, A) => {
    if (!P.devView) return; ctx.save(); ctx.lineWidth = 2; ctx.font = '11px monospace';
    const h = A.hero; ctx.strokeStyle = '#0f0'; ctx.strokeRect(h.x - A.cam - 30, h.y - 140, 60, 140); ctx.strokeStyle = '#ff0'; ctx.strokeRect(h.x - A.cam + (h.face > 0 ? -20 : -150), h.y - 45, 170, 90);
    for (const e of A.en) { if (e.dead) continue; const x = e.x - A.cam; ctx.strokeStyle = '#f44'; ctx.strokeRect(x - 30, e.y - 100 * e.K.sc, 60, 100 * e.K.sc); ctx.strokeStyle = 'rgba(255,80,80,.4)'; ctx.strokeRect(x - e.K.rng, e.y - 30, e.K.rng * 2, 60); ctx.fillStyle = '#fff'; ctx.fillText(`${e.act}${e.wind > 0 ? ' 前搖' + e.wind.toFixed(1) : ''}`, x - 30, e.y + 16) }
    ctx.strokeStyle = '#0ff'; ctx.beginPath(); ctx.arc(A.pet.x - A.cam, A.pet.y, 650, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.restore();
  };
  window.PETDEV = { clock: clk, set: devSet, log: LOG, open: () => toggle(true), close: () => toggle(false), tab: t => { tab = t; draw() }, click: (a, v) => onClick({ target: { closest: () => ({ dataset: { d: a, v } }) } }) };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mount); else mount();
})(window.PET);
/*/DEV*/
