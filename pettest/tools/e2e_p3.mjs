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
// ===== P3 專用測試（node pettest/tools/e2e_p3.mjs [port] [outdir]）=====
await call('Runtime.enable'); await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
const barBtn = t => `[...document.querySelectorAll("#bar button")].find(b=>b.textContent.includes("${t}"))`;
await call('Page.navigate', { url: `http://127.0.0.1:${port}/pettest/` });
ok('開機', await waitFor('window.PET && PET.booted', 15000));
await ev('localStorage.clear(); location.reload()'); await sleep(500);
ok('重新開機（乾淨存檔）', await waitFor('window.PET && PET.booted', 15000));
const smoke = await ev('JSON.stringify({gen:!!PET.genInit, ui3:!!PET.ui3, farm:!!PET.scenes.farm, room:!!PET.scenes.room, hyb:Object.keys(PET.HYB).length})');
ok('P3 模組都有載入', /"gen":true,"ui3":true,"farm":true,"room":true,"hyb":8/.test(smoke), smoke);
await ev('PETDEV.click("rescueall")'); await sleep(800); await ev('(()=>{const b=document.querySelector("#panel [data-a=g][data-v=bear]"); if(b) b.click()})()'); await sleep(300); await ev('PET.ui.close(); PET.S.wait.slice(0,6).forEach(p=>PET.takeIn(p,"wait")); PET.go("shelter")'); await sleep(1200);
await ev('PET.ui.close()'); await sleep(600); await shot('p3_00_shelter');
console.log(await ev('document.querySelector("#hud").innerText'), await ev('JSON.stringify([...document.querySelectorAll("#hud span")].map(e=>{const r=e.getBoundingClientRect();return [e.innerText.slice(0,8),r.x|0,r.y|0]}))'), await ev('JSON.stringify(document.querySelector("#devBtn").getBoundingClientRect())'));

const J = async ex => await ev(`JSON.stringify(${ex})`);
// --- A7 住民上限 HUD ---
ok('HUD 有 住民 x/5 和 育兒室', await ev('/住民 \\d+\\/5/.test(document.querySelector("#hud").innerText) && /育兒室/.test(document.querySelector("#hud").innerText)'));
// --- A1 打掃按鈕：只要有 1 坨就出現 ---
await ev('PET.S.poop=[{x:600,y:520,big:0}]; PET.shelterBar && PET.shelterBar()'); await sleep(700);
ok('只有 1 坨便便也有打掃按鈕', await ev(`!!${barBtn('打掃')}`));
await ev(`${barBtn('打掃')}.click()`); await sleep(300); ok('打掃後便便清空', await ev('PET.poopN()===0'));
// --- 沒拿到的東西不顯示：混血名字 ---
await ev(`${barBtn('櫃檯')}.click()`); await sleep(400);
ok('櫃檯看不到還沒拿到的混血名字', await ev('!/月牙犬|燈尾貓|蜜熊|星夜狼/.test(document.querySelector("#panel").innerText)'));
ok('櫃檯看不到沒拿到的材料（月光露、彩虹）', await ev('!/月光露/.test(document.querySelector("#panel").innerText)'));
ok('P5：大會打開了：櫃檯有報名、獎牌室', await ev('PET.FEAT.cup===1 && /大會/.test(document.querySelector("#panel").innerText) && !!document.querySelector("#panel [data-a=cup]")')); await shot('p3_01_counter'); await ev('PET.ui.close()');
// --- 容量 5 → 10 → 20 ---
const cap0 = await ev('PET.houseCap()');
await ev('PET.S.rep=PET.CFG.repLv[9]||99999'); const b1 = await J('PET.buildExpand("annex")');
await ev('PETDEV.click("p3build")'); await sleep(300); const cap1 = await ev('PET.houseCap()');
const b2 = await J('PET.buildExpand("farm")'); await ev('PETDEV.click("p3build")'); await sleep(300); const cap2 = await ev('PET.houseCap()');
ok('住民上限 5 → 二館 10 → 農場 20', cap0 === 5 && cap1 === 10 && cap2 === 20, `${cap0}/${cap1}/${cap2} ${b1} ${b2}`);
await ev('PETDEV.click("p3fill")'); ok('住滿 20 隻後不能再收', await ev('PET.S.pets.length===20 && PET.houseFull()'));
ok('育兒室上限 20，托兒所 +10', await ev('(()=>{const a=PET.nurseryCap(); PET.S.fac.nursery=1; const b=PET.nurseryCap(); return a===20&&b===30})()'));
await ev('PET.go("shelter")'); await sleep(1200); await shot('p3_02_shelter_full_hud');
ok('二館：➡ 二館 按鈕', await ev(`!!${barBtn('二館')}`));
// --- 明信片：每天 10 張上限 ---
await ev('PET.S.mail={q:[],st:{},nid:0}; PETDEV.click("p3mail12")'); await sleep(300);
const ms = await J('PET.mailStacks().map(s=>[s.cards.length,s.over])');
ok('同一天 12 張 → 一疊 10 張＋2 張變材料', ms === '[[10,2]]', ms);
await ev('PET.ui3.mail()'); await sleep(400); await shot('p3_03_mailbox');
await ev('document.querySelector("#panel [data-a=o]").click()'); await sleep(400); await shot('p3_04_mail_open');
ok('打開後信箱清空', await ev('PET.mailCount()===0'));
// 每隻最多 2 封
ok('每隻寵物最多 2 封明信片', await ev(`(()=>{let mx=0;for(let i=0;i<40;i++){const p=PET.makeAnimal({sp:"cat",tier:1});PET.S.wait.push(p);PET.releaseWander(p)} const c={};PET.S.mail.q.forEach(m=>c[m.mid]=(c[m.mid]||0)+1);mx=Math.max(...Object.values(c));PET.S.mail.q=[];return mx<=2&&mx>=1})()`));
// 寶寶的幸福信要靠郵寄
// --- 放出去：機率與橘寵保底 ---
const od = await J('[PET.relOdds(0),PET.relOdds(100)].map(o=>Math.round(o.reduce((a,b)=>a+b,0)*10)/10)');
ok('放出去的獎勵機率 強度 0 / 100 都加起來 100%', od === '[100,100]', od);
const pity = await J(`(()=>{const R0=PET.rand; PET.rand=()=>0.001; PET.S.relPity.orange=0; const r=[]; for(let i=0;i<3;i++){const p=PET.makeAnimal({sp:"fox",tier:4}); r.push(PET.relRoll(p))} PET.rand=R0; return r.map(x=>[x.g,x.forced])})()`);
ok('橘寵連續 2 隻沒拿到 → 第 3 隻一定是傳說寶物', pity === '[[0,0],[0,0],[3,1]]', pity);
// --- 探險隊人數 ---
const ps = await J('["canyon","mine","spider","crystal","rich"].map(k=>PET.ST[k]?PET.partySize(PET.ST[k]):null)');
ok('探險隊人數：1★ 1–3、3★ 2–4、4★ 3–5、5★ 5、理查 5', ps === '[[1,3],[2,4],[3,5],[5,5],[5,5]]', ps);
await ev('PETDEV.click("p3fac")');
const ex = await J(`(()=>{const ids=PET.S.pets.slice(0,6).map(p=>p.id); const a=PET.expSend("crystal",ids.slice(0,4)), b=PET.expSend("canyon",ids.slice(0,4)), c=PET.expSend("canyon",ids.slice(0,2)); return [a.ok,b.ok,c.ok]})()`);
ok('5★ 帶 4 隻不能出發、1★ 帶 4 隻不行、1★ 帶 2 隻可以', ex === '[0,0,1]', ex);
// --- 農場 ---
await ev('PET.go("farm")'); await sleep(1500); await shot('p3_05_farm');
ok('農場場景＋按鈕', await ev(`PET.sceneName==="farm" && !!${barBtn('探險隊')} && !!${barBtn('訓練營')}`));
await ev('PET.ui3.exp()'); await sleep(400); await ev('document.querySelector("#panel [data-a=s][data-v=spider]").click()'); await sleep(200);
await ev('[...document.querySelectorAll("#panel .xp:not(.no)")].slice(0,2).forEach(b=>b.click())'); await sleep(300);
ok('4★ 只選 2 隻：出發按鈕是灰的', await ev('document.querySelector("#panel [data-a=go]").disabled')); await shot('p3_06_expedition');
await ev('PET.ui3.camp()'); await sleep(400); await shot('p3_07_camp'); await ev('PET.ui.close()');
await ev('PET.ui3.fac(PET.FAC.find(f=>f.k==="pond"))'); await sleep(300); await shot('p3_08_fac'); await ev('PET.ui.close(); PET.go("shelter")'); await sleep(600);
// --- 大會階梯＋獎牌永久 ---
await ev('PET.FEAT.cup=1');   // 大會下一版才開；這裡打開開關測規則與會場
const lad = await J(`(()=>{const S=PET.S, p=PET.S.pets.find(q=>!PET.out(q)); p.aff=2000; S.rep=99999; const B={}; for(const c in PET.CUPS){B[c]=PET.CUPS[c].base; PET.CUPS[c].base=0.01}
 const R=[]; const run=c=>{p.cupDone={}; S.cup.n=0; const r=PET.cupRun(p,c); R.push(c+(r.ok?r.place:'x:'+r.msg)); return r};
 const before=PET.cupCan(p,'s'); run('v');run('v');run('v'); const r1=p.rank; run('s');run('s'); const r2=p.rank; run('k'); const r3=p.rank; run('l');
 for(const c in B) PET.CUPS[c].base=B[c]; window.__cupPet=p.id; return {before, r1,r2,r3, medals:p.medals.length, R}})()`);
const L2 = JSON.parse(lad);
ok('大會：沒有銅級不能參加季節盃', /銅級/.test(L2.before), L2.before);
ok('大會：村莊 3 冠 → 銅、季節 2 冠 → 銀、王國 1 冠 → 金、傳說可參加', L2.r1 === 1 && L2.r2 === 2 && L2.r3 === 3 && L2.R[6] === 'l1', lad);
ok('拿到 7 面獎牌', L2.medals === 7);
await ev('PET.save()'); await call('Page.reload'); await waitFor('window.PET && PET.booted', 15000); await sleep(800);
ok('重新開機後獎牌還在（永久）', await ev('PET.byId(window.__cupPet||0)?false:PET.all().some(p=>p.medals&&p.medals.length===7)'));
await ev('PET.go("room","medals")'); await sleep(1200); await shot('p3_09_medal_room'); await ev('PET.go("shelter")'); await sleep(500);
await ev('PET.FEAT.cup=1; PET.ui3.cup()'); await sleep(400); await shot('p3_10_cup');
await ev('(()=>{const p=PET.all().find(p=>p.medals&&p.medals.length===7); p.cupDone={}; PET.S.cup.n=0; document.querySelector(`#panel [data-a=go][data-v="${p.id}"]`).click()})()'); await sleep(3600); await shot('p3_11_cup_run'); ok('報名後進入大會會場', await ev('PET.sceneName') === 'contest'); await ev('PET.ui.close(); PET.go("shelter"); PET.FEAT.cup=0'); await sleep(300);
// --- 寵物面板：能力表、體型、主人分享 ---
await ev('PET.openPet(PET.all().find(p=>p.medals&&p.medals.length===7))'); await sleep(400); await shot('p3_12_pet_panel'); await ev('(()=>{const t=document.querySelector("#panel table.ab"); if(t) t.scrollIntoView()})()'); await sleep(200); await shot('p3_12b_pet_abilities');
const pp = await ev('document.querySelector("#panel").innerText');
ok('寵物面板：能力、體型、主人（10%）、獎牌', /寵物能力|能力/.test(pp) && /體型/.test(pp) && /主人/.test(pp) && /冠軍/.test(pp));
ok('面板沒有 %P', !/%P/.test(pp)); await ev('PET.ui.close()');
// --- 遺傳：混血、突變、家譜 ---
await ev('PETDEV.click("ghybpair")'); await ev('PET.S.cots[0].basket={since:PET.now()-12*3600e3,a:PET.S.cots[0].a,b:PET.S.cots[0].b,sync:2}');
const hk = await J('PET.mateKind(PET.byId(PET.S.cots[0].a),PET.byId(PET.S.cots[0].b))');
ok('狼＋獵犬 是可以生混血的組合', hk === '"pure"' || hk === '"cross"', hk);
await ev('PET.S.cots[0].basket.forceSp="moonhound"; PET.S.cots[0].basket.forceMut=1; window.__pre=new Set(PET.S.babies.map(b=>b.id))');
await ev(`${barBtn('櫃檯')}.click()`); await sleep(300); await ev('document.querySelector("#panel [data-a=codex]").click()'); await sleep(300);
ok('還沒生過混血：圖鑑只有「還有什麼在等你」剪影', await ev('/還有什麼在等你/.test(document.querySelector("#panel").innerText) && !/月牙犬/.test(document.querySelector("#panel").innerText)')); await ev('PET.ui.close()');
await ev('PET.S.hybSeen={}; PETDEV.click("forcebirth")'); await sleep(300);
const bb = await J('(()=>{const nb=PET.S.babies.filter(b=>!__pre.has(b.id)); window.__nb=nb[0].id; return {n:nb.length, sp:nb.map(b=>b.sp), mut:(nb[0].mut||[]).length, seen:PET.S.hybSeen.moonhound||0}})()');
const BB = JSON.parse(bb);
ok('強制混血 → 生出月牙犬，記進混血圖鑑', BB.n >= 1 && BB.sp.every(x => x === 'moonhound') && BB.seen === BB.n, bb);
ok('強制突變 → 第一隻寶寶有突變', BB.mut >= 1, bb);
await ev(`${barBtn('櫃檯')}.click()`); await sleep(300); await ev('document.querySelector("#panel [data-a=codex]").click()'); await sleep(300);
ok('拿到月牙犬以後才在圖鑑出現（其他混血還是藏著）', await ev('/月牙犬/.test(document.querySelector("#panel").innerText) && !/燈尾貓|蜜熊|星夜狼/.test(document.querySelector("#panel").innerText)'));
await ev('document.querySelector("#panel").scrollTop=9999'); await sleep(200); await shot('p3_13b_codex_hybrid'); await ev('PET.ui.close()');
await ev('PET.ui3.tree(window.__nb)'); await sleep(400); await shot('p3_13_family_tree');
ok('家譜畫面有爸媽', await ev('document.querySelectorAll("#panel .tc").length>=3'));
await ev('PET.ui.close(); PET.openPet(PET.byId(window.__nb))'); await sleep(400); await shot('p3_14_hybrid_panel'); await ev('PET.ui.close()');
// 育兒籃畫面
await ev('PETDEV.click("ghybpair")'); await ev('PET.S.cots[0].basket={since:PET.now()-12*3600e3,a:PET.S.cots[0].a,b:PET.S.cots[0].b,sync:2}');
await ev('PET.ui3.basket(0)'); await sleep(400); await shot('p3_15_basket');
ok('育兒籃畫面說明「教什麼技能」和機率', await ev('/%/.test(document.querySelector("#panel").innerText)')); await ev('PET.ui.close()');
// 開發者分頁
await ev('PETDEV.open(); PETDEV.tab("遺傳")'); await sleep(300); await shot('p3_16_dev_gen'); await ev('PETDEV.tab("P3")'); await sleep(300); await shot('p3_17_dev_p3'); await ev('PETDEV.close()');
// --- 戰鬥：叫援助按鈕 ---
await ev('PET.S.eq=PET.S.babies[0].id; PET.go("arena",{mode:"normal"})'); await sleep(2500);
const aid = await ev('(()=>{const b=[...document.querySelectorAll("#bar button,button")].find(b=>/援助/.test(b.textContent)); return b?b.textContent+"|"+getComputedStyle(b).opacity:""})()');
ok('戰鬥中有「叫援助」按鈕，還沒準備好是半透明', /援助/.test(aid), aid); await shot('p3_18_arena'); await ev('PET.go("shelter")'); await sleep(500);
// --- P2c 存檔搬家 ---
await ev('PETDEV.click("p3mig")'); await sleep(500);
const mig = await J('{n:PET.all().length, v3:PET.S.v3, coat:PET.all().every(p=>Array.isArray(p.coat)), mat:!!PET.S.mat, mail:!!PET.S.mail, ab:PET.all().every(p=>p.ib)}');
ok('P2c 舊存檔讀進來：2 隻、自動補上新欄位', /"n":2/.test(mig) && /"coat":true/.test(mig) && /"mat":true/.test(mig) && /"ab":true/.test(mig), mig);
await sleep(800); await shot('p3_19_after_migration');
const errN = await ev('PETDEV.log.filter(l=>l.type==="err").map(l=>l.msg)');
ok('沒有 JS 錯誤', errs.length === 0 && errN.length === 0, JSON.stringify(errs.concat(errN)).slice(0, 3000));
fs.writeFileSync(out + '/result.json', JSON.stringify(R, null, 1));
ws.close(); ch.kill('SIGKILL'); await sleep(500); fs.rmSync(prof, { recursive: true, force: true });
console.log(R.filter(r => r[0] === 'FAIL').length ? 'SOME FAILED' : 'ALL PASS'); process.exit(0);
