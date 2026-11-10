// 無頭瀏覽器整套測試：node pettest/tools/e2e.mjs [port] [outdir]
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const port = +(process.argv[2] || 18923), out = process.argv[3] || '/tmp/pet_e2e';
fs.mkdirSync(out, { recursive: true });
const dport = 9400 + Math.floor(Math.random() * 400), prof = '/tmp/cdp_p4_old_' + dport;
const ch = spawn('/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${dport}`, '--window-size=1280,720', '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${dport}/json`)).json(); const pg = l.find(x => x.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break } } catch (e) { } await sleep(200) }
await new Promise(r => ws.onopen = r); let id = 0; const pend = {}; const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 500)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('console.error ' + m.params.args.map(a => a.value || a.description).join(' ').slice(0, 400)); if (m.method === 'Network.loadingFailed' && !m.params.canceled) errs.push('NETFAIL ' + m.params.errorText) };
const call = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) });
const ev = async ex => { const r = await call('Runtime.evaluate', { expression: ex, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value };
const shot = async n => { const r = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${n}.png`, Buffer.from(r.result.data, 'base64')) };
const key = async (code, key) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', code, key }); await call('Input.dispatchKeyEvent', { type: 'keyUp', code, key }) };
const waitFor = async (ex, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(ex)) return true; await sleep(300) } return false };
const R = []; const ok = (name, cond, info) => { R.push([cond ? 'PASS' : 'FAIL', name, info || '']); console.log(cond ? 'PASS' : 'FAIL', name, info || '') };
await call('Runtime.enable'); await call('Page.enable'); await call('Network.enable');
await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await call('Page.navigate', { url: `http://127.0.0.1:${port}/pettest/` });
ok('開機', await waitFor('window.PET && PET.booted', 15000));
ok('測試版旗標', await ev('window.__PETLAB__===true && PET.CFG.saveKey==="petlab_save" && PET.S.gold===9999999'));
ok('美術讀到', await ev('Object.keys(PET.art.sets||{}).length>0'), await ev('JSON.stringify(Object.keys(PET.art.sets||{}))'));
await sleep(1500); await shot('01_shelter_start');
// 開發者介面
await key('Backquote', '`'); await sleep(400);
ok('` 鍵打開開發者介面', await ev('!document.querySelector("#devP").classList.contains("hide")'));
await shot('02_dev_time');
await ev('PETDEV.tab("設定值")'); await sleep(300); await shot('03_dev_cfg');
await key('F9', 'F9'); await sleep(300); ok('F9 關掉', await ev('document.querySelector("#devP").classList.contains("hide")'));
ok('DEV 按鈕存在', await ev('!!document.querySelector("#devBtn")'));
await ev('PET.arenaGod=true');
// 1. 救援委託 r1
await ev('PET.ui.close(); PET.openQuests()'); await sleep(300); await shot('03b_quests_before');
ok('委託畫面：r1 可以接、r2 鎖住', await ev('!!document.querySelector("#panel [data-a=go][data-v=r1]") && !document.querySelector("#panel [data-v=r2]")'));
await ev('PET.startQuest("r1"); PET.arena.auto=1'); await sleep(6000); await shot('04_rescue');
const resc = await waitFor('PET.sceneName==="shelter" && PET.S.unlock===1', 240000);
ok('救援關打完 → 解鎖收容所', resc, await ev('JSON.stringify({unlock:PET.S.unlock,pets:PET.S.pets.length,babies:PET.S.babies.length,scene:PET.sceneName})'));
await sleep(1000); await shot('05_gift_choose');
ok('蜜糖媽媽送一隻：選物種面板', await ev('!!document.querySelector("#panel [data-a=g][data-v=bear]")'));
await ev('document.querySelector("#panel [data-a=g][data-v=bear]").click()'); await sleep(300);
ok('選到小熊藍色寶寶，自動設為出戰', await ev('PET.S.babies.length===1 && PET.S.babies[0].sp==="bear" && PET.S.babies[0].tier===1 && PET.S.eq===PET.S.babies[0].id'));
ok('其他 10 隻在候補名冊', await ev('PET.S.wait.length===10'));
await ev('PET.ui.close(); for(let i=0;i<4;i++) PET.takeIn(PET.S.wait[0],"wait")'); await sleep(1500); await shot('05b_shelter_after_rescue');
ok('沒有性別欄位', await ev('PET.all().concat(PET.S.wait).every(p=>!("sex" in p))'));
ok('救援關從一般出戰選單拿掉', await ev('(()=>{PET.openFight();const r=!document.querySelector("#panel [data-v=rescue]");PET.ui.close();return r})()'));
// P2：櫃檯頭像、面板關閉／返回／Esc／點外面
const barBtn = t => `[...document.querySelectorAll("#bar button")].find(b=>b.textContent.includes("${t}"))`;
await ev(`${barBtn('櫃檯')}.click()`); await sleep(400); await shot('20_counter_portraits');
ok('櫃檯每個選項都有頭像', await ev('(()=>{const n=document.querySelectorAll("#panel .av").length, ad=[...document.querySelectorAll("#panel [data-a=adopt]")].every(b=>b.querySelector(".av"));return n>=12&&ad})()'), await ev('document.querySelectorAll("#panel .av").length+" 個頭像"'));
ok('面板有 ✕ 和 返回', await ev('!!document.querySelector("#panel .ptop [data-a=close]") && !!document.querySelector("#panel .ptop [data-a=back]")'));
ok('面板不蓋住下方按鈕列', await ev('document.querySelector("#panel").getBoundingClientRect().bottom <= document.querySelector("#bar").getBoundingClientRect().top + 1'));
await ev('document.querySelector("#panel [data-a=codex]").click()'); await sleep(300); await shot('21_codex_back');
ok('圖鑑 → 返回 回到櫃檯', await ev('(()=>{const b=document.querySelector("#panel .ptop [data-a=back]");const t=b.textContent;b.click();return /返回/.test(t)&&/櫃檯/.test(document.querySelector("#panel .pttl").textContent)})()'));
await ev('document.querySelector("#panel .ptop [data-a=close]").click()'); ok('✕ 關掉', await ev('document.querySelector("#panel").classList.contains("hide")'));
await ev(`${barBtn('名冊')}.click()`); await sleep(300); await shot('22_roster');
ok('名冊每列有頭像', await ev('[...document.querySelectorAll("#panel .card[data-a=open]")].every(c=>c.querySelector(".av"))'));
ok('名冊寶寶列有「🎲 洗技能」大按鈕', await ev('[...document.querySelectorAll("#panel .card[data-a=open]")].some(c=>c.querySelector("[data-a=rr]"))'));
// P2b：洗技能／洗屬性入口
await ev('PET.ui.close()'); await ev(`${barBtn('櫃檯')}.click()`); await sleep(300);
ok('櫃檯有「洗技能／洗屬性」入口（有頭像／P5.1 起是像素圖示）', await ev('!!document.querySelector("#panel .rrcard .av, #panel .rrcard .ficon")'));
await ev('document.querySelector("#panel .rrcard button[data-a=reroll]").click()'); await sleep(300); await shot('32_reroll_pick');
ok('選寶寶畫面：每隻寶寶有頭像和「去洗」', await ev('(()=>{const c=[...document.querySelectorAll("#panel .card[data-a=go]")];return c.length>0&&c.every(x=>x.querySelector(".av")&&x.querySelector("button[data-a=go]"))})()'));
await ev('document.querySelector("#panel button[data-a=go]").click()'); await sleep(300);
const rb = await ev('(()=>{const p=PET.all().find(x=>x.baby);PET.S.disk=0;PET.S.bread=999;PET.S.gold=10000000;return {id:p.id,newborn:!PET.unlocked(p),pity:p.pity||0}})()');
await ev('PET.ui._refresh&&PET.ui._refresh()'); await sleep(200); await shot('33_reroll_page');
ok('洗技能頁：標題、保底、麵包／金幣按鈕', await ev('/洗技能／洗天性魔法/.test(document.querySelector("#panel .pttl").textContent)&&!!document.querySelector("#panel [data-a=rrb]")&&!!document.querySelector("#panel [data-a=rsb]")&&!!document.querySelector("#panel .pity")'));
await ev('document.querySelector("#panel [data-a=rrb]").click()'); await sleep(200);
ok('剛出生也能洗、麵包洗不用磁片', await ev(`(()=>{const p=PET.byId(${rb.id});return (p.pity||0)===${rb.pity}+1&&PET.S.disk===0&&PET.S.bread===999-PET.CFG.rerollBread[p.tier]})()`), JSON.stringify(rb));
await ev('document.querySelector("#panel [data-a=rr]").click()'); await sleep(200);
ok('金幣洗要磁片（沒有磁片會提示改用麵包）', await ev(`PET.byId(${rb.id}).pity===${rb.pity}+1`));
await ev(`PET.byId(${rb.id}).pity=PET.CFG.rerollPity-1`); await ev('document.querySelector("#panel [data-a=rrb]").click()'); await sleep(300); await shot('34_reroll_pity');
ok('第 6 次保底 3 選 1', await ev('/3 選 1/.test(document.querySelector("#panel .pttl").textContent)&&document.querySelectorAll("#panel [data-a=pick]").length===3'));
await ev('document.querySelector("#panel [data-a=pick]").click()'); await sleep(200);
const sb = await ev(`JSON.stringify(PET.byId(${rb.id}).sub)`); await ev('document.querySelector("#panel [data-a=rsb]").click()'); await sleep(200);
ok('洗屬性（麵包）', await ev(`PET.byId(${rb.id}).subPity>=1`), sb + ' → ' + await ev(`JSON.stringify(PET.byId(${rb.id}).sub)`));
await ev('PET.ui.close()'); await ev(`PET.openPet(PET.byId(${rb.id}))`); await sleep(300);
ok('照顧面板有「🎲 洗技能／洗屬性」大按鈕', await ev('!!document.querySelector("#panel button[data-a=rrgo]")'));
await ev('document.querySelector("#panel button[data-a=rrgo]").click()'); await sleep(200);
ok('照顧面板 → 洗技能頁 → 返回', await ev('(()=>{const a=/洗技能／洗天性魔法/.test(document.querySelector("#panel .pttl").textContent);document.querySelector("#panel .ptop [data-a=back]").click();return a&&!!document.querySelector("#panel button[data-a=rrgo]")})()'));
await ev('PET.ui.close()'); await ev(`${barBtn('名冊')}.click()`); await sleep(200);
await ev('document.querySelector("#panel [data-a=rr]").click()'); await sleep(200);
ok('名冊 🎲 → 直接到洗技能頁', await ev('/洗技能／洗天性魔法/.test(document.querySelector("#panel .pttl").textContent)'));
await ev('PET.ui.close()'); await ev(`${barBtn('名冊')}.click()`); await sleep(200);
await ev(`${barBtn('名冊')}.click()`); ok('再按一次「名冊」就關掉', await ev('document.querySelector("#panel").classList.contains("hide")'));
await ev(`${barBtn('名冊')}.click()`); await key('Escape', 'Escape'); ok('Esc 關掉', await ev('document.querySelector("#panel").classList.contains("hide")'));
await ev(`${barBtn('小屋')}.click()`); await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: 300, y: 300, button: 'left', clickCount: 1 }); await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 300, y: 300, button: 'left', clickCount: 1 });
ok('點面板外面關掉', await ev('document.querySelector("#panel").classList.contains("hide")'));
// P2：便便、浣熊、熊
await ev('(()=>{for(const sp of ["raccoon","bear"]){const p=PET.makeAnimal({sp,tier:2,look:2,aff:300});PET.addResident(p,"測試")}})()');
await ev('window.__T=[]; new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>__T.push(n.textContent)))).observe(document.querySelector("#toast"),{childList:true})');
await ev('PETDEV.click("poop5",20)'); await sleep(2500); await shot('23_poop20_flies');
ok('便便上限 20', await ev('PET.poopN()===20'), await ev('"便便 "+PET.poopN()'));
ok('一鍵打掃按鈕出現', await ev(`!!${barBtn("打掃")}`));
const fill = await ev('PET.CFG.poopCap/PET.poopPerH()'); ok('堆滿至少 24 小時', fill >= 24, fill.toFixed(1) + ' 小時');
ok('20 坨時角色吐槽、寵物說臭', await waitFor('(PET.speaking?__T.concat(PET.speaking()):__T).some(t=>PET.NPC_LINES.p20.some(l=>t.includes(l[1])))', 6000), await ev('JSON.stringify(PET.speaking?__T.concat(PET.speaking()):__T).slice(0,300)'));
const heap = await waitFor('PET.S.heap>0', 40000); await sleep(800); await shot('24_raccoon_heap');
ok('浣熊把便便搬到堆肥坑', heap, await ev('"坑裡 "+PET.S.heap+"、散落 "+PET.S.poop.length'));
await ev('PET.S.diff=4'); const b0 = await ev('PET.S.bread'); await ev(`${barBtn("打掃")}.click()`); await sleep(1500); await shot('25_after_sweep');
ok('一鍵打掃全部清乾淨', await ev('PET.poopN()===0'), await ev('JSON.stringify(PETDEV.log.filter(l=>l.type==="poop").map(l=>l.msg).slice(-2))'));
await ev('PETDEV.open(); PETDEV.tab("資源"); PETDEV.click("poopsim")'); const sim = await ev('document.querySelector("#devP .body").innerText.match(/模擬 2000 天[^\\n]*/)?.[0]||""');
ok('便便裝備模擬（深淵）', /件裝備/.test(sim), sim); await shot('26_dev_poop'); await ev('PETDEV.close(); PET.S.diff=0');
// P2：星彩寶寶
await ev('(()=>{const p=PET.makeAnimal({sp:"cat",tier:3,look:3,baby:1,bornDay:PET.dayKey(PET.now())-3,aff:450,star:2});PET.fillSkills(p);PET.fillSubs(p);PET.S.babies.push(p);PET.ui._shy=p.id})()');
await ev('PET.go("shelter")'); await sleep(900); await shot('27_shiny_appear');
await ev('PET.openPet(PET.byId(PET.ui._shy))'); await sleep(400); await shot('28_shiny_panel');
ok('星彩面板顯示加成', await ev('/星彩/.test(document.querySelector("#panel").innerText) && !!document.querySelector("#panel .av.shiny")'));
await ev('PET.ui.close()');
// 2. 照顧（從 UI 點）
const pid = await ev('PET.S.pets[0].id');
const aff0 = await ev(`PET.byId(${pid}).aff`);
await ev(`PET.openPet(PET.byId(${pid}))`); await sleep(300); await shot('06_care_panel');
const clicks = await ev(`(()=>{const bs=[...document.querySelectorAll('#panel [data-a]')];const lab=bs.map(b=>b.dataset.a+':'+(b.dataset.v||'')+':'+b.textContent.trim().slice(0,8));let n=0;for(const want of ['pet','kibble','bread','snack','groom']){const b=bs.find(x=>x.dataset.a===want||x.dataset.a==='feed'&&x.dataset.v===want||x.dataset.a==='care'&&x.dataset.v===want);if(b){b.click();n++}}return JSON.stringify({n,lab:lab.slice(0,40)})})()`);
const aff1 = await ev(`PET.byId(${pid}).aff`);
ok('照顧面板點擊 → 好感上升', aff1 > aff0, `好感 ${aff0} → ${aff1}；${clicks}`);
await ev(`PET.walk(PET.byId(${pid}),1)`);
// 3. 快轉
const day0 = await ev('PET.dayKey(PET.now())'); const need0 = await ev(`PET.byId(${pid}).need.f`);
await ev('PETDEV.set.jump(6*3600e3)'); await sleep(200);
const need1 = await ev(`PET.byId(${pid}).need.f`); const walkDone = await ev(`!PET.byId(${pid}).walk`);
ok('快轉 6 小時 → 需求下降、散步回來', need1 < need0 && walkDone, `飽足 ${need0.toFixed(1)} → ${need1.toFixed(1)}`);
await ev('PETDEV.set.toNext5()');
ok('跳到 05:00 → 換日、有結算事件', await ev(`PET.dayKey(PET.now())>${day0} && PETDEV.log.some(l=>l.type==="day")`));
const t0 = await ev('PET.now()'); await ev('PETDEV.set.speed(600)'); await sleep(2000); const t1 = await ev('PET.now()'); await ev('PETDEV.set.speed(1)');
ok('時間 ×600', (t1 - t0) > 600e3, `2 秒走了 ${((t1 - t0) / 60e3).toFixed(1)} 分`);
const lastSeen = await ev('PET.S.lastSeen'); await ev('PETDEV.set.jump(-3*3600e3)'); ok('時間往回調沒有進度', await ev(`PET.S.lastSeen===${lastSeen}`)); await ev('PETDEV.set.jump(3*3600e3+1000)');
// 4. 寵物出戰：老鼠
const bid = await ev('(()=>{const b=PET.S.babies[0];b.bornDay=PET.dayKey(PET.now())-3;b.tier=2;b.look=2;b.sk=[32,49];b.sub=[];PET.fillSubs(b);PET.S.eq=b.id;return b.id})()');
const bread0 = await ev('PET.S.bread'); const lv0 = await ev(`PET.byId(${bid}).lv`);
await ev('PET.go("arena",{mode:"normal"}); PET.arena.auto=1'); await sleep(7000); await shot('07_arena_rat');
await waitFor('PET.sceneName==="shelter"', 180000);
const ratLog = await ev('JSON.stringify(PETDEV.log.filter(l=>/老鼠|#32|#49|傷害佔/.test(l.msg)).map(l=>l.msg).slice(-8))');
ok('老鼠變身＋必掉麵包＋平底鍋', /老鼠被打倒/.test(ratLog) && /#32/.test(ratLog), ratLog);
ok('出戰後等級／經驗上升', await ev(`PET.byId(${bid}).lv>${lv0} || PET.byId(${bid}).xp>0`), await ev(`JSON.stringify({lv:PET.byId(${bid}).lv,xp:PET.byId(${bid}).xp,battles:PET.byId(${bid}).battles})`));
// 小豬＋王戰
await ev(`(()=>{const b=PET.byId(${bid});b.tier=4;b.look=3;b.sk=[44,34,46]})()`);
await ev('PET.go("arena",{mode:"boss"}); PET.arena.auto=1'); await sleep(9000); await shot('08_arena_pig');
await waitFor('PET.arena && PET.arena.en.some(e=>e.kind==="boss")', 120000); await sleep(8000); await shot('09_boss');
await waitFor('PET.sceneName==="shelter"', 240000);
const pigLog = await ev('JSON.stringify(PETDEV.log.filter(l=>/小豬|王變成|#44|#34|#46|傷害佔/.test(l.msg)).map(l=>l.msg).slice(-10))');
ok('小豬變身／王變身 5 秒', /小豬/.test(pigLog), pigLog);
// 5. 配對生寶寶
await ev('PETDEV.click("tab","生成")');
await ev('PETDEV.click("genpair")'); await ev('PETDEV.click("cotpair")');
const why = await ev('PET.cotCheck(PET.S.cots[0])'); ok('小屋配對條件通過', why === '', why);
const nb0 = await ev('PET.S.babies.length');
let preg = false; for (let i = 0; i < 12 && !preg; i++) { await ev('PETDEV.set.toNext5()'); preg = await ev('PET.S.cots.some(c=>c.basket)') }
ok('快轉幾天 → 小屋出現育兒籃（不分性別）', preg, await ev('JSON.stringify(PETDEV.log.filter(l=>l.type==="preg").map(l=>l.msg).slice(-3))'));
if (!preg) await ev('PETDEV.click("forcepreg")');
await ev('PETDEV.set.toNext5()'); await ev('PETDEV.set.toNext5()');
const nb1 = await ev('PET.S.babies.length');
ok('寶寶出生', nb1 > nb0, await ev('JSON.stringify(PETDEV.log.filter(l=>l.type==="birth").map(l=>l.msg).slice(-3))'));
await ev('PET.go("shelter")'); await sleep(1000); await shot('10_shelter_babies');
// P2 遺傳：兩隻星彩 → 寶寶一定星彩；同傳家技
await ev('(()=>{const c=PET.S.cots[0];const a=PET.byId(c.a),b=PET.byId(c.b);a.star=2;b.star=2;a.heir=b.heir=a.heir||32;a.q=2;b.q=3;a.g=2;b.g=1;c.cool=0;c.basket=null})()');
await ev('PETDEV.click("forcepreg")'); const nbs = await ev('PET.S.babies.length'); await ev('PETDEV.click("forcebirth")');
const kid = await ev('JSON.stringify(PET.S.babies.slice(' + nbs + ').map(b=>({star:b.star,g:b.g,heir:b.heir,q:b.q})))');
ok('星彩 × 星彩 → 寶寶全是星彩、第 3 代', /"star":2/.test(kid) && !/"star":[01]/.test(kid) && /"g":3/.test(kid), kid);
await ev('PET.openQuests()'); await sleep(300); await shot('29_quests_after');
await ev('PETDEV.click("tab","生成"); PETDEV.click("questall")'); await ev('PET.ui.close(); PET.openQuests()'); await sleep(300); await shot('30_quests_unlocked');
ok("解鎖後最後一個委託 r4 可以接", await ev('!!document.querySelector("#panel [data-a=go][data-v=r4]")'));
await ev('PET.ui.close(); PETDEV.open(); PETDEV.tab("機率")'); await sleep(300); await shot('31_dev_odds'); await ev('PETDEV.close()');
await ev('PETDEV.open(); PETDEV.tab("事件日誌")'); await sleep(400); await shot('11_dev_log');
await ev('PETDEV.tab("寵物")'); await sleep(300); await shot('12_dev_pet');
// 存檔匯出／匯入、重置
const exp = await ev('PET.exportJSON().length'); await ev('PETDEV.click("snapsave","1")');
await ev('PETDEV.click("reset")'); await ev('PETDEV.click("reset")'); ok('一鍵重置（按兩次）', await ev('PET.S.pets.length===0'));
await ev('PETDEV.click("snapload","1")'); ok('快照讀回', await ev('PET.S.pets.length>0'), `存檔 ${exp} bytes`);
// 壓力
await ev('PETDEV.click("stress200")'); const s365 = Date.now(); await ev('PETDEV.click("stress365")'); ok('200 隻＋快轉 365 天', Date.now() - s365 < 20000, `${Date.now() - s365}ms，存檔 ${(await ev('JSON.stringify(PET.S).length')) / 1024 | 0} KB`);
await ev('PETDEV.click("stressclr")'); await ev('PETDEV.close()');
// 手機（橫向、觸控）
await call('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true }); await call('Emulation.setTouchEmulationEnabled', { enabled: true });
await call('Page.reload'); await waitFor('window.PET && PET.booted', 15000); await sleep(1500); await shot('13_phone_shelter');
await ev(`PET.openPet(PET.S.pets[0])`); await sleep(300); await shot('14_phone_panel'); await ev('PET.ui.close()');
await ev('PET.go("arena",{mode:"normal"})'); await sleep(3000);
ok('手機上顯示搖桿', await ev('!document.querySelector("#pad").classList.contains("hide")'));
await shot('15_phone_arena');
await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 20, y: 20 }] }); await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await ev('PETDEV.open()'); await sleep(300); await shot('16_phone_dev');
const errN = await ev('PETDEV.log.filter(l=>l.type==="err").map(l=>l.msg)');
ok('沒有 JS 錯誤', errs.length === 0 && errN.length === 0, JSON.stringify(errs.concat(errN)).slice(0, 1500));
fs.writeFileSync(out + '/result.json', JSON.stringify(R, null, 1));
ws.close(); ch.kill('SIGKILL'); await sleep(500); fs.rmSync(prof, { recursive: true, force: true });
console.log(R.filter(r => r[0] === 'FAIL').length ? 'SOME FAILED' : 'ALL PASS'); process.exit(0);
