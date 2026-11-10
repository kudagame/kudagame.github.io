// P4 無頭瀏覽器測試：node pettest/tools/e2e_p4.mjs [port] [outdir]（Chrome 設定檔只用 /tmp/cdp_p4_e2e_*）
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const port = +(process.argv[2] || 18923), out = process.argv[3] || '/tmp/pet_e2e';
fs.mkdirSync(out, { recursive: true });
const dport = 9400 + Math.floor(Math.random() * 400), prof = '/tmp/cdp_p4_e2e_' + dport;
const ch = spawn('/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${dport}`, '--window-size=1280,720', '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
process.on('exit', () => { try { ch.kill('SIGKILL') } catch (e) { } Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 800); try { fs.rmSync(prof, { recursive: true, force: true }) } catch (e) { } });
for (const evn of ['unhandledRejection', 'uncaughtException']) process.on(evn, e => { console.log('FAIL 例外', String(e && e.message || e).slice(0, 600)); console.log('JS errors:', errs.slice(0, 5).join(' | ')); process.exit(1) });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${dport}/json`)).json(); const pg = l.find(x => x.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break } } catch (e) { } await sleep(200) }
await new Promise(r => ws.onopen = r); let id = 0; const pend = {}; const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 500)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('console.error ' + m.params.args.map(a => a.value || a.description).join(' ').slice(0, 900)); if (m.method === 'Network.loadingFailed' && !m.params.canceled) errs.push('NETFAIL ' + m.params.errorText) };
const call = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) });
const ev = async ex => { const r = await call('Runtime.evaluate', { expression: ex, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error('eval: ' + (r.result.exceptionDetails.exception?.description || JSON.stringify(r.result.exceptionDetails)).slice(0, 400) + ' ← ' + ex.slice(0, 160)); return r.result?.result?.value };
const shot = async n => { const r = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${n}.png`, Buffer.from(r.result.data, 'base64')) };
const key = async (code, key) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', code, key }); await call('Input.dispatchKeyEvent', { type: 'keyUp', code, key }) };
const waitFor = async (ex, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(ex)) return true; await sleep(300) } return false };
const R = []; const ok = (name, cond, info) => { R.push([cond ? 'PASS' : 'FAIL', name, info || '']); console.log(cond ? 'PASS' : 'FAIL', name, info || '') };
await call('Runtime.enable'); await call('Page.enable'); await call('Network.enable');
await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
const shot0 = shot; const shotC = async n => { await ev('document.querySelector("#toast").innerHTML=""'); await sleep(100); await shot0(n) };
const J = async ex => JSON.parse(await ev(`JSON.stringify(${ex})`));
const click = async sel => ev(`(()=>{const b=document.querySelector(${JSON.stringify(sel)}); if(!b) return false; b.click(); return true})()`);
const toastTxt = () => ev('(document.querySelector("#toast")||{}).innerText||""');
await call('Page.navigate', { url: `http://127.0.0.1:${port}/pettest/` });
ok('開機', await waitFor('window.PET && PET.booted', 15000));
await ev('localStorage.clear(); location.reload()'); await sleep(500);
ok('重新開機（乾淨存檔）', await waitFor('window.PET && PET.booted', 15000));
ok('P4 模組有載入', await ev('!!(PET.pityStep && PET.askRoll && PET.skTag && PET.ui3.askScreen && PET.STAGES.length===6)'));
await ev('PETDEV.click("rescueall")'); await sleep(800); await ev('PET.ui.close(); PET.S.wait.slice(0,6).forEach(p=>PET.takeIn(p,"wait")); PET.go("shelter")'); await sleep(1000);
await ev('PETDEV.click("p3annex"); PETDEV.click("p3farm"); PETDEV.click("p3build"); PETDEV.click("p3fac"); PET.ui.close()'); await sleep(400);
// ===== 1 大頭照 =====
const ptOk = await ev('(()=>{const c=PET.art.portraitCv(PET.S.pets[0].sp,1,false,96); return !!c && c.width===96})()');
ok('大頭照產生（96px）', ptOk);
const hybPt = await ev('(()=>{const c=PET.art.portraitCv("moonhound",2,false,96); return !!c})()'); ok('混血大頭照', hybPt);
// ===== 2 探險：小寶寶不能去、出戰中不能去、成年全力 =====
await ev(`(()=>{const S=PET.S; const a=S.pets[0]; const kid=PET.makeAnimal({sp:a.sp,tier:1,baby:1,aff:9999,q:1}); kid.bornDay=PET.dayKey(PET.now()); kid.name='小不點'; S.babies.push(kid); PET.famRec(kid); window.__kid=kid.id;
  const big=PET.makeAnimal({sp:'wolf',tier:2,baby:1,aff:9999,q:2}); big.bornDay=PET.dayKey(PET.now())-5; big.name='大個子'; S.babies.push(big); PET.famRec(big); window.__big=big.id; S.eq=S.pets[1].id; window.__eq=S.pets[1].id })()`);
await ev('PET.ui3.exp()'); await sleep(500);
ok('探險：6 個真關卡卡片（有縮圖）', await ev('document.querySelectorAll("#panel .xd .xth").length===6'));
ok('探險：關卡名是正式版的名字', await ev('["赤岩峽谷","灰色荒野","理查宅邸"].every(n=>document.querySelector("#panel .xlist").innerText.includes(n))'));
await click('#panel .xd[data-v=mine]'); await sleep(300);
ok('探險：王與小怪圖示載入', await ev('(()=>{const b=document.querySelector("#panel .xboss"); return b && b.complete && b.naturalWidth>0 && document.querySelectorAll("#panel .xf img").length>0})()'));
ok('探險：戰利品圖示', await ev('[...document.querySelectorAll("#panel .xl img")].some(i=>i.naturalWidth>0)'));
ok('探險：隊伍格（2～4 隻 → 4 格，2 格必要）', await ev('document.querySelectorAll("#panel .xs").length===4 && document.querySelectorAll("#panel .xs.need").length===2'));
await click(`#panel .xp[data-v="${await ev('__kid')}"]`); await sleep(200);
ok('小寶寶點了不能選', await ev('!document.querySelector("#panel .xp[data-v=\'"+__kid+"\']").classList.contains("on") && /小寶寶/.test(document.querySelector("#toast")?.innerText||"")'), await toastTxt());
await click(`#panel .xp[data-v="${await ev('__eq')}"]`); await sleep(200);
ok('出戰中的不能選', await ev('!document.querySelector("#panel .xp[data-v=\'"+__eq+"\']").classList.contains("on")'), await toastTxt());
await click(`#panel .xp[data-v="${await ev('__big')}"]`); await sleep(150); await click(`#panel .xp[data-v="${await ev('PET.S.pets[2].id')}"]`); await sleep(300);
ok('隊伍格出現大頭照', await ev('document.querySelectorAll("#panel .xs .av.pt").length===2'));
ok('成功率量表', await ev('(()=>{const i=document.querySelector("#panel .xgb i"); return i && parseFloat(i.style.width)>0})()'), await ev('document.querySelector("#panel .xgb").innerText'));
ok('成年寶寶全力（戰力＝公式，無 ×0.8）', await ev('(()=>{const p=PET.byId(__big); const r1=v=>Math.round(v*10)/10; return PET.expPow(p)===r1(([0.6,1,2,3,4][p.tier]+PET.abil(p).total/150)*PET.QUAL_MUL[p.q])})()'));
await ev('document.querySelector("#panel").scrollTop=0'); await sleep(200); await shotC('p4_01_expedition');
await click('#panel [data-a=go]'); await sleep(400);
ok('派出後出現計時卡', await ev('document.querySelectorAll("#panel .xt .xbar").length===1'));
await ev('PET.S.exp.teams[0].start=PET.now()-2*3600e3; PET.S.exp.teams[0].until=PET.now()+3600e3; PET.ui3.exp()'); await sleep(200); await ev('PET.ui.back()'); await sleep(300);
await ev('document.querySelector("#panel").scrollTop=99999'); await sleep(200); await shotC('p4_02_expedition_timer');
await ev('PET.S.exp.teams[0].until=PET.now()-1; PET.tickP3(PET.now())'); await sleep(300);
ok('回來：事件是赤岩礦坑的', await ev('(()=>{const l=PET.S.exp.log[0]; const s=PET.ST.mine; return l && l.k==="mine" && (s.ev.some(e=>l.ev.startsWith(e))||l.ev===s.fail)})()'), await ev('PET.S.exp.log[0] && PET.S.exp.log[0].ev'));
await ev('PET.ui.close(); PET.ui3.exp()'); await sleep(300); ok('回來卡片顯示事件', await ev('document.querySelectorAll("#panel .xt.back").length>=1'));
await ev('document.querySelector("#panel").scrollTop=99999'); await sleep(200); await shotC('p4_03_expedition_back');
// 理查宅邸一定 5 隻
await click('#panel .xd[data-v=rich]'); await sleep(200); ok('理查宅邸 5 格全必要', await ev('document.querySelectorAll("#panel .xs.need").length===5'));
await ev('PET.ui.close()');
// ===== 3 爸媽開口、臨別禮 =====
await ev('PETDEV.click("ghybpair"); PET.S.cots[0].basket={since:PET.now()-12*3600e3,a:PET.S.cots[0].a,b:PET.S.cots[0].b,sync:2}; PET.ui.close()'); await sleep(300);
await ev('PETDEV.click("gask")'); await sleep(500);
ok('爸媽開口畫面', await ev('!!document.querySelector("#panel .askbig .bubble") && /(出門|出去|去)/.test(document.querySelector("#panel .bubble").innerText)'));
ok('開口畫面有大頭照', await ev('!!document.querySelector("#panel .askbig .av.pt")'));
await shotC('p4_04_parent_asks');
await ev('PET.rand=()=>0.1'); await click('#panel [data-a=yes]'); await sleep(400); await ev('delete PET.rand; PET.rand=Math.random');
const gift = await ev('PET.S.cots[0].basket.gift'); ok('答應後拿到臨別禮', !!gift, gift);
await shotC('p4_05_farewell_gift');
await click('#panel [data-a=ok]'); await sleep(400);
ok('育兒籃顯示爸媽之後（大頭照＋三個選項）', await ev('document.querySelectorAll("#panel [data-a=go]").length>=3 && /出門闖蕩/.test(document.querySelector("#panel").innerText)'));
ok('育兒籃顯示臨別禮', await ev('!!document.querySelector("#panel .card.gift")'));
await shotC('p4_06_basket');
// 另一位：玩家選「留在家」；出生
const askId = await ev('PET.S.cots[0].basket.ask.id'), other = await ev('[PET.S.cots[0].a,PET.S.cots[0].b].find(i=>i!==PET.S.cots[0].basket.ask.id)');
await ev('window.__pre=new Set(PET.S.babies.map(b=>b.id)); PET.ui.close(); PETDEV.click("forcebirth")'); await sleep(500);
const nb = await J('PET.S.babies.filter(b=>!__pre.has(b.id)).map(b=>({id:b.id,gift:b.gift,looks:b.looksOwn,seed:b.seed,lineX:b.lineX,blessI:b.blessI}))');
ok('寶寶出生並帶著臨別禮', nb.length > 0 && nb.every(b => b.gift === gift), JSON.stringify(nb));
ok('答應的那位出門了、另一位留在家', await ev(`!PET.S.pets.some(p=>p.id===${askId}) && PET.S.pets.some(p=>p.id===${other})`));
// ===== 4 家譜（大頭照，含混血） =====
await ev(`(()=>{const S=PET.S, mk=(sp,o)=>{const p=PET.makeAnimal(Object.assign({sp,tier:2,baby:0,aff:9999,q:1},o||{})); S.pets.push(p); PET.famRec(p); return p};
  const g=[mk('wolf'),mk('retriever'),mk('fox'),mk('cat')]; const f=mk('moonhound',{par:[g[0].id,g[1].id],name:'月月'}), m=mk('frostfox',{par:[g[2].id,g[3].id],name:'霜霜',tier:3});
  const k=PET.makeAnimal({sp:'moonhound',tier:1,baby:1,aff:9999,q:2,par:[f.id,m.id]}); k.name='小星'; k.bornDay=PET.dayKey(PET.now())-4; S.babies.push(k); PET.famRec(k); window.__tk=k.id })()`);
await ev('PET.ui3.tree(__tk)'); await sleep(500);
ok('家譜每格都是大頭照', await ev('document.querySelectorAll("#panel .tc .av.pt").length>=7'), await ev('document.querySelectorAll("#panel .tc .av.pt").length'));
await shotC('p4_07_family_tree'); await ev('PET.ui.close()');
// ===== 5 技能位階 =====
await ev(`(()=>{const k=PET.byId(__tk); k.tier=4; k.sk=[1, PET.MUTSK[1], Object.values(PET.EVO)[0], PET.MIX[0].n, PET.ATAV[5]]; k.hid=[]; })()`);
await ev('PET.ui.pet ? PET.ui.pet(PET.byId(__tk)) : PET.openPet(PET.byId(__tk))').catch(() => { });
await sleep(400);
let tiers = await ev('[...document.querySelectorAll("#panel .skt")].map(e=>e.innerText).join(",")');
if (!/血脈技/.test(tiers)) { await ev('PET.ui3.reroll ? PET.ui3.reroll(PET.byId(__tk)) : 0').catch(() => { }); await sleep(300); tiers = await ev('[...document.querySelectorAll("#panel .skt")].map(e=>e.innerText).join(",")') }
await ev('(()=>{const e=document.querySelector("#panel .skt"); if(e) e.scrollIntoView({block:"center"})})()'); await sleep(200);
ok('技能都有位階標籤（一般／稀有／血脈／融合／隔代）', ['一般技', '稀有技', '血脈技', '融合技', '隔代覺醒'].every(t => tiers.includes(t)), tiers);
await shotC('p4_08_skill_tiers');
ok('洗技能：鎖住的技能不能洗', await ev('(()=>{const k=PET.byId(__tk); PET.S.bread=1e9; PET.S.disk=99; const r=PET.reroll(k,2,"bread"); return !r.ok && k.sk[2]===Object.values(PET.EVO)[0]})()'));
await ev('PET.ui.close()');
// ===== 6 彩虹月光露：沒拿到就看不到 =====
await ev('PET.S.mat.pollen=1; PET.S.mat.rainbow=0; PET.ui3.rainbow(PET.S.cots[0])'); await sleep(300);
ok('沒有彩虹月光露時不顯示彩虹選項', await ev('!/彩虹/.test(document.querySelector("#panel").innerText)'));
await ev('PET.ui.close(); PET.S.mat.rainbow=1; PET.ui3.rainbow(PET.S.cots[0])'); await sleep(300); ok('有了才顯示', await ev('document.querySelectorAll("#panel [data-a=r]").length===5'));
await ev('PET.ui.close(); PET.S.mat.proof=3; PET.ui3.proofScreen()'); await sleep(300); await click('#panel [data-a=t]'); await sleep(200);
ok('3 張傳說之證換彩虹', await ev('PET.S.mat.rainbow===2 && PET.S.mat.proof===0')); await ev('PET.ui.close()');
// ===== 7 保底提示（只有含糊台詞、不顯示數字） =====
await ev('PETDEV.click("ghybpair"); PET.S.cots[0].basket={since:PET.now()-12*3600e3,a:PET.S.cots[0].a,b:PET.S.cots[0].b,sync:2,askR:1}; PETDEV.click("gpity"); PET.ui.close(); PET.ui3.basket(0)'); await sleep(400);
const ptxt = await ev('document.querySelector("#panel").innerText');
ok('接近保底：西施含糊提示', /西施/.test(ptxt) && /(感覺|好像|驚喜|特別|醞釀|說不準|想太多)/.test(ptxt), ptxt.slice(0, 200));
ok('畫面上沒有保底數字', !/保底/.test(ptxt)); await shotC('p4_09_pity_hint'); await ev('PET.ui.close()');
// ===== 8 突變技能在測試場 =====
await ev(`(()=>{const S=PET.S, p=PET.byId(__big); p.sk=[301,8,302,303,304]; p.tier=4; S.eq=p.id; PET.arenaGod=true })()`);
await ev('PET.go("arena",{mode:"normal"}); PET.arena.auto=1'); await sleep(2500);
await ev('PET.arenaApi.resetCd(); PET.arenaApi.spawn("axe"); PET.arenaApi.use()'); await sleep(200);
const e301 = await ev('!!(PET.arena.used||{})[301]'); await ev('PET.arenaApi.resetCd(); PET.arenaApi.heavy()');
const e304 = await ev('PET.arena.pet.scaleU>0'); await sleep(1500); await ev('PET.arenaApi.resetCd(); PET.arenaApi.use(); PET.arenaApi.resetCd(); PET.arenaApi.use()'); await sleep(300);
await ev('PET.arena.hero.x+=320'); await sleep(600); const zn = await ev('(PET.arena.zones||[]).filter(z=>z.k==="star").length'); await shot('p4_10_arena_mut'); await sleep(3000);
const st = await J('({echo:PET.arena.echoN||0, star:PET.arena.starHits||0, zones:(PET.arena.zones||[]).filter(z=>z.k==="star").length, used:PET.arena.used})');
ok('#301 迴聲吠 會用', e301, JSON.stringify(st)); ok('#304 逆鱗 重擊觸發', e304); ok('#303 星屑尾巴 跑動時留下星屑', zn > 0, 'zones ' + zn); ok('#301 迴聲：下一招再放一次', st.echo > 0, JSON.stringify(st));
await ev('PET.go("shelter")'); await sleep(500);
ok('沒有 JS 錯誤', errs.length === 0, errs.slice(0, 3).join(' | '));
fs.writeFileSync(`${out}/e2e_p4_result.txt`, R.map(r => r.join('\t')).join('\n'));
console.log(`e2e_p4: ${R.filter(r => r[0] === 'PASS').length} 通過、${R.filter(r => r[0] === 'FAIL').length} 失敗`);
ws.close(); ch.kill('SIGKILL'); await sleep(500); fs.rmSync(prof, { recursive: true, force: true });
process.exit(R.some(r => r[0] === 'FAIL') ? 1 : 0);
