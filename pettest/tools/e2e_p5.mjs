// P5 無頭瀏覽器測試（大會正式版＋小屋／獎牌室＋音效）：node pettest/tools/e2e_p5.mjs [port] [outdir]（Chrome 設定檔只用 /tmp/cdp_p5_e2e_*）
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const port = +(process.argv[2] || 18923), out = process.argv[3] || '/tmp/pet_e2e';
fs.mkdirSync(out, { recursive: true });
const dport = 9400 + Math.floor(Math.random() * 400), prof = '/tmp/cdp_p5_e2e_' + dport;
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
await ev('PETDEV.click("rescueall")'); await sleep(800); await ev('PET.ui.close(); PET.S.wait.slice(0,4).forEach(p=>PET.takeIn(p,"wait")); PET.go("shelter")'); await sleep(1000);
ok('大會開關打開', await ev('PET.FEAT.cup===1'));
// 選一隻成年的當選手，名字固定，好看截圖
await ev(`(()=>{const p=PET.S.pets.find(q=>!q.baby)||PET.S.pets[0]; p.name='小栗'; p.aff=2000; p.rank=0; p.wins={}; p.medals=[]; PET.S.rep=99999; window.__cp=p.id; window.__sc=PET.cupScore})()`);
const win = 'PET.cupScore=()=>999', lose = 'PET.cupScore=()=>0.1', norm = 'PET.cupScore=window.__sc';
// ===== 1 新手的報名面板：只看到村莊小賽 =====
await ev(`${norm}; PET.ui3.cup()`); await sleep(500);
const t1 = await ev('document.querySelector("#panel").innerText');
ok('新手只看得到「村莊小賽」分頁，季節盃以後的藏起來', (await ev('[...document.querySelectorAll("#panel [data-a=c]")].map(b=>b.innerText).join()')) === '村莊小賽' && !/王國名盃|傳說大會/.test(t1), t1.slice(0, 120));
ok('只預告下一個（季節盃）怎麼拿到', /下一個：季節盃/.test(t1));
ok('不寫「分數約」，改寫奪冠機會＋升級進度', !/分數約/.test(t1) && /這一屆：/.test(t1) && /村莊小賽冠軍 0\/3/.test(t1));
ok('司儀小貓頭鷹出來說明', /小貓頭鷹/.test(t1));
await shotC('p5_01_panel_newbie');
// ===== 2 村莊小賽：用面板報名（必勝），截開場、比賽中、結果、頒獎 =====
await ev(win); await ev('document.querySelector(`#panel [data-a=go][data-v="${window.__cp}"]`).click()'); await sleep(300);
ok('報名後進入會場（村祭）', await ev('PET.sceneName') === 'contest');
await sleep(900); await shotC('p5_02_village_intro');
await sleep(2000); await shotC('p5_03_village_round1');
await sleep(2400); await shotC('p5_04_village_round1_result');
await ev('[...document.querySelectorAll("#bar button")].find(b=>/看結果/.test(b.innerText)).click()'); await sleep(1800); await shotC('p5_05_village_award');
ok('村莊冠軍：獎牌 1 面', await ev('PET.byId(window.__cp).medals.length===1'));
// 再拿兩次冠軍 → 銅級（第 3 次在會場看升級台詞）
await ev(`(()=>{const p=PET.byId(window.__cp); p.cupDone={}; PET.S.cup.n=0; PET.cupRun(p,'v'); p.cupDone={}; PET.S.cup.n=0})()`);
await ev(`PET.go('contest',{id:window.__cp, r:PET.cupRun(PET.byId(window.__cp),'v')})`); await sleep(200);
await ev('[...document.querySelectorAll("#bar button")].find(b=>/看結果/.test(b.innerText)).click()'); await sleep(4500); await shotC('p5_06_village_rankup');
ok('三次村莊冠軍 → 銅級', await ev('PET.byId(window.__cp).rank===1'));
const cv = await ev('(()=>{const c=document.querySelector("canvas"); return c.width})()'); ok('會場畫面有畫出來', cv >= 1280);
// ===== 3 銅級：面板多了季節盃 =====
await ev(`${norm}; PET.ui3.cup()`); await sleep(400);
ok('銅級：多看得到季節盃，王國名盃還藏著', (await ev('[...document.querySelectorAll("#panel [data-a=c]")].map(b=>b.innerText).join()')) === '村莊小賽,季節盃' && /下一個：王國名盃/.test(await ev('document.querySelector("#panel").innerText')));
await ev('[...document.querySelectorAll("#panel [data-a=c]")].find(b=>b.innerText==="季節盃").click()'); await sleep(300); await shotC('p5_07_panel_season');
await ev(win); await ev('document.querySelector(`#panel [data-a=go][data-v="${window.__cp}"]`).click()'); await sleep(1200); await shotC('p5_08_town_intro');
await sleep(4200); await shotC('p5_09_town_round1');
await ev('[...document.querySelectorAll("#bar button")].find(b=>/看結果/.test(b.innerText)).click()'); await sleep(1800); await shotC('p5_10_town_award');
await ev(`(()=>{const p=PET.byId(window.__cp); p.cupDone={}; PET.cupRun(p,'s')})()`);
ok('季節盃 2 冠 → 銀級', await ev('PET.byId(window.__cp).rank===2'));
// ===== 4 王國名盃 =====
await ev(`PET.go('contest',{id:window.__cp, r:PET.cupRun(PET.byId(window.__cp),'k')})`); await sleep(1200); await shotC('p5_11_royal_intro');
await sleep(4000); await shotC('p5_12_royal_round1');
await ev('[...document.querySelectorAll("#bar button")].find(b=>/看結果/.test(b.innerText)).click()'); await sleep(4500); await shotC('p5_13_royal_award_gold');
ok('王國名盃冠軍 → 金級', await ev('PET.byId(window.__cp).rank===3'));
// ===== 5 傳說大會（王都夜場） =====
await ev(`${norm}; PET.ui3.cup()`); await sleep(300);
ok('金級：四個大會都看得到，沒有「下一個」', (await ev('[...document.querySelectorAll("#panel [data-a=c]")].length')) === 4 && !/下一個：/.test(await ev('document.querySelector("#panel").innerText')));
await ev('[...document.querySelectorAll("#panel [data-a=c]")].find(b=>b.innerText==="傳說大會").click()'); await sleep(300); await shotC('p5_14_panel_legend');
await ev(win); await ev(`PET.go('contest',{id:window.__cp, r:PET.cupRun(PET.byId(window.__cp),'l')})`); await sleep(1200); await shotC('p5_15_legend_intro');
await sleep(4000); await shotC('p5_16_legend_round1');
await ev('[...document.querySelectorAll("#bar button")].find(b=>/看結果/.test(b.innerText)).click()'); await sleep(1800); await shotC('p5_17_legend_award');
// ===== 6 第一輪落敗 =====
await ev(`(()=>{const p=PET.byId(window.__cp); p.cupDone={}; PET.S.cup.n=0})()`); await ev(lose);
await ev(`PET.go('contest',{id:window.__cp, r:PET.cupRun(PET.byId(window.__cp),'v')})`); await sleep(200);
await ev('[...document.querySelectorAll("#bar button")].find(b=>/看結果/.test(b.innerText)).click()');
const outOk = await waitFor('/回收容所/.test(document.querySelector("#bar").innerText) && /獎牌室/.test(document.querySelector("#bar").innerText)', 15000); await sleep(800); await shotC('p5_18_village_out');
ok('落敗畫面：有回收容所／再報名／獎牌室', outOk);
await ev(norm);
// ===== 7 獎牌室 =====
await ev('PET.go("room","medals")'); await sleep(1500); await shotC('p5_19_medal_room');
ok('獎牌室：這隻有 7 面獎牌（落敗不算）', await ev('PET.byId(window.__cp).medals.length===7'));
if (fs.existsSync('/workspace/game/pettest/pet/pet_room.js')) {
  ok('獎牌室：牆上掛的數量＝這隻的獎牌（最多 21）', await ev('(()=>{const p=PET.medalRows()[0]; return !!p && PET.medalWall(p.medals).length===Math.min(21,p.medals.filter(m=>m.pl<=3).length)})()'));
  const cot = await ev('(()=>{const S=PET.S; if(!S.cots.length){S.gold=1e7;S.bread=999;S.mat&&(S.mat.shard=999);PET.buildCot&&PET.buildCot()} const c=S.cots[0]; if(!c) return 0; const [a,b]=PET.S.pets; if(a&&b) PET.setCot(c,a.id,b.id); PET.go("room",0); return 1})()');
  await sleep(1500); await shotC('p5_20_cot_inside');
  ok('小屋裡面：打得開、下面有「小屋面板」', !!cot && await ev('PET.sceneName==="room" && /小屋面板/.test(document.body.innerText)'));
  ok('小屋裡面：背景曲是小屋的燈籠', await ev('!PET.bgm || PET.bgm.now()==="m_pet_cot" || PET.bgm.now()===""'));
  ok('音效模組在、六個音效都有名字', await ev('!!PET.sfx && PET.sfx.names.length===6'));
}
ok('JS 錯誤 0 個', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = R.filter(r => r[0] === 'FAIL').length; console.log(`e2e_p5: ${R.length - fails} pass, ${fails} fail`); process.exit(fails ? 1 : 0);
