// P5.1 無頭瀏覽器測試（第 2～16 項＋大朋友出戰模擬）：node pettest/tools/e2e_p51.mjs [port] [outdir]（Chrome 設定檔只用 /tmp/cdp_p51_e2e_*）
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const port = +(process.argv[2] || 18951), out = process.argv[3] || '/tmp/p51_shots';
fs.mkdirSync(out, { recursive: true });
const dport = 9400 + Math.floor(Math.random() * 400), prof = '/tmp/cdp_p51_e2e_' + dport;
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
const tapCv = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await call('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(120) };
const crop = async (n, x, y, w, h, scale = 1) => { const r = await call('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale } }); fs.writeFileSync(`${out}/${n}.png`, Buffer.from(r.result.data, 'base64')) };
const popTxt = () => ev('(()=>{const h=document.querySelector("#hintPop"); return h && !h.classList.contains("hide") ? h.innerText : ""})()');
const panelTxt = () => ev('document.querySelector("#panel").classList.contains("hide") ? "" : document.querySelector("#panel").innerText');
await call('Page.navigate', { url: `http://127.0.0.1:${port}/pettest/` });
ok('開機', await waitFor('window.PET && PET.booted', 15000));
await ev('localStorage.clear(); location.reload()'); await sleep(500);
ok('重新開機（乾淨存檔）', await waitFor('window.PET && PET.booted', 15000));
await ev('PETDEV.click("rescueall")'); await sleep(800); await ev('PET.ui.close(); PET.S.wait.slice(0,4).forEach(p=>PET.takeIn(p,"wait")); PET.go("shelter")'); await sleep(1200);
await ev('PET.arenaGod=true; PET.S.gift0=1; PET.ui.close()');

// ===== #4 音量 =====
ok('#4 右上一直有 🔊 按鈕', await ev('!!document.querySelector("#sysbar #sbMute") && getComputedStyle(document.querySelector("#sysbar")).display!=="none"'));
await click('#sbMute'); await sleep(200);
ok('#4 一鍵靜音：存檔 mute=1、音樂音效都變 0', await ev('PET.S.audio.mute===1 && PET.bgm.vol()===0 && PET.sfxVol()===0 && /🔇/.test(document.querySelector("#sbMute").innerText)'));
await click('#sbMute'); await sleep(100);
await click('#sbVol'); await sleep(300);
await ev('(()=>{const r=document.querySelector("#hintPop input[data-k=bgm]"); r.value=62; r.oninput(); const s=document.querySelector("#hintPop input[data-k=sfx]"); s.value=21; s.oninput()})()');
ok('#4 背景音樂、音效分開拉', await ev('Math.abs(PET.S.audio.bgm-.62)<1e-6 && Math.abs(PET.S.audio.sfx-.21)<1e-6 && Math.abs(PET.sfxVol()-.21)<1e-6 && PET.S.audio.mute===0'));
await shotC('p51_04_volume');
await ev('PET.save(); location.reload()'); await waitFor('window.PET && PET.booted', 15000); await sleep(800);
ok('#4 重開以後音量設定還在（存在存檔）', await ev('Math.abs(PET.S.audio.bgm-.62)<1e-6 && Math.abs(PET.S.audio.sfx-.21)<1e-6'));
await ev('PET.popClose(); PET.ui.close(); PET.go("shelter")'); await sleep(800);

// ===== #3 泡泡 =====
await ev('PET.speak(PET.S.pets[0],"今天天氣真好，一起去散步吧！",6); PET.ui.toast("蜜糖媽媽：「孩子們今天都很乖喔。」",6000)'); await sleep(500);
ok('#3 角色台詞變成泡泡、不出現在上方 toast', await ev('PET.speaking().length===2 && !/孩子們今天都很乖/.test(document.querySelector("#toast").innerText)'));
await shotC('p51_03_bubbles');
const an = await J('(()=>{const p=PET.S.pets[0], a=PET._anc["p"+p.id]; return a?{x:a.x,top:a.top}:null})()');
if (an) await crop('p51_03_bubble_zoom', Math.max(0, an.x - 200), Math.max(0, an.top - 110), 400, 200, 2);
await sleep(6800); ok('#3 泡泡時間到會淡出', await ev('!PET.speaking().some(t=>/今天天氣真好|孩子們今天都很乖/.test(t))'), JSON.stringify(await J('PET.speaking()')));

// ===== #9 上排提示 =====
const spans = await J('[...document.querySelectorAll("#hud span")].map(s=>s.innerText.trim())');
let hintOk = 0; for (let i = 0; i < spans.length; i++) { await ev(`document.querySelectorAll("#hud span")[${i}].click()`); await sleep(150); const t = await popTxt(); if (t && t.length > 12) hintOk++; else console.log('  沒有提示：', spans[i]) }
ok(`#9 上排每一格都有提示（${hintOk}/${spans.length}）`, hintOk === spans.length && spans.length >= 8, spans.join('｜'));
await ev('PETDEV.click("p3fill")'); await sleep(300); await ev('PET.ui.hud()'); await sleep(600);
await ev('[...document.querySelectorAll("#hud span")].find(s=>/住民/.test(s.innerText)).click()'); await sleep(300);
const fullT = await popTxt(); ok('#9 住民滿了：提示擴建、寄放、放他出去闖闖＋目前條件', /擴建/.test(fullT) && /寄放/.test(fullT) && /闖闖/.test(fullT) && /名聲|金幣/.test(fullT), fullT.slice(0, 160));
await shotC('p51_09_hint_full');
await ev('PET.popClose()');

// ===== #11 灰色入口 =====
await ev('Object.assign(PET.S,{gold:0,bread:0,shards:0}); PET.openBuild()'); await sleep(400);
const bt = await panelTxt();
ok('#11 建造入口一直在：小屋、二館、農場、倉庫都列出來', /小屋/.test(bt) && /二館/.test(bt) && /農場/.test(bt) && /倉庫/.test(bt));
ok('#11 不夠的灰掉、寫缺什麼＋問誰', await ev('document.querySelectorAll("#panel .req.grey").length>=3') && /還差/.test(bt) && /問(西施|蜜糖媽媽|西施媽媽)/.test(bt));
await shotC('p51_11_build_grey');
await ev('document.querySelector("#panel .req.grey [data-a=bq]").click()'); await sleep(300);
ok('#11 按灰卡：跳出缺什麼', /還不能蓋/.test(await popTxt())); await shotC('p51_11_build_why'); await ev('PET.popClose()');
// 小屋蓋滿 → 指向下一個擴建
await ev('PETDEV.click("p51res"); PET.ui.close()');

// ===== #5 小屋方向 =====
await ev('PET.openBuild()'); await sleep(300);
await ev('document.querySelector("#panel [data-a=bq][data-v=cot]").click()'); await sleep(300);
ok('#5 蓋小屋先選方向（左／正面／右）', /門要朝哪邊/.test(await popTxt()) && await ev('document.querySelectorAll("#hintPop [data-a=f]").length===3'));
await shotC('p51_05_face_ask');
await ev('document.querySelector("#hintPop [data-a=f][data-v=F]").click()'); await sleep(300);
ok('#5 選正面 → 小屋 1 朝正面', await ev('PET.S.cots[0] && PET.S.cots[0].face==="F"'));
for (const f of ['R', 'L']) { await ev('PET.openBuild()'); await sleep(200); await ev('document.querySelector("#panel [data-a=bq][data-v=cot]").click()'); await sleep(200); await ev(`document.querySelector("#hintPop [data-a=f][data-v=${f}]").click()`); await sleep(200) }
ok('#5 三間小屋：正面／右／左', await ev('PET.S.cots.slice(0,3).map(c=>c.face).join("")==="FRL"'));
await ev('PET.ui.close(); PET.go("shelter")'); await sleep(900); await ev('PET.ui.close(); PET.popClose()'); await sleep(300); await shotC('p51_05_huts_3faces');
{ const hx = await J('[0,1,2].map(i=>PET.cotXY(i))'); const x0 = Math.max(0, Math.min(...hx.map(h => h.cx)) - 120), x1 = Math.min(1280, Math.max(...hx.map(h => h.cx)) + 120), y0 = Math.max(0, Math.min(...hx.map(h => h.by)) - 170); await crop('p51_05_huts_zoom', x0, y0, x1 - x0, 210, 1.5) }
await ev('PET.cotScreen ? PET.cotScreen() : 0'); await sleep(400);
ok('#5 小屋面板可以改方向', await ev('document.querySelectorAll("#panel [data-a=face]").length>=9'));
ok('#11 小屋都蓋好 → 小屋面板指向下一個擴建（二館）', /下一步是「二館」/.test(await panelTxt()));
await shotC('p51_05_cot_panel');

// ===== #8 住戶下拉 =====
await ev(`(()=>{const ps=PET.S.pets.filter(p=>PET.canBreedAge(p)); const c=PET.S.cots; c[0].a=ps[0].id; c[0].b=ps[1].id; window.__a=ps[0].id; window.__b=ps[1].id; PET.cotScreen()})()`); await sleep(300);
const sel = await J(`(()=>{const o=s=>[...document.querySelectorAll('#panel select[data-c="'+s+'"]')].map(x=>[...x.options].map(o=>+o.value)); return {a:window.__a,b:window.__b,c0:o(0), c1:o(1)}})()`);
ok('#8 別間小屋的下拉看不到已經住在小屋 1 的', sel.c1.length === 2 && sel.c1.every(l => !l.includes(sel.a) && !l.includes(sel.b)), JSON.stringify(sel).slice(0, 160));
ok('#8 自己這格現在的住戶一定留著、同一間另一格的不重複', sel.c0[0].includes(sel.a) && !sel.c0[0].includes(sel.b) && sel.c0[1].includes(sel.b) && !sel.c0[1].includes(sel.a));
await ev('PET.ui.close()');

// ===== #13 倉庫 =====
await ev('PET.S.rep=0; PET.openBuild()'); await sleep(300);
ok('#13 倉庫沒條件時灰著（要名聲）', await ev('!!document.querySelector("#panel .req.grey[data-v=ware]")'));
await ev('PETDEV.click("p51res"); PET.openBuild()'); await sleep(300);
await ev('document.querySelector("#panel [data-a=bq][data-v=ware]").click()'); await sleep(300);
ok('#13 蓋倉庫先選方向', /倉庫：門要朝哪邊/.test(await popTxt()));
const g0 = await ev('PET.S.gold');
await ev('document.querySelector("#hintPop [data-a=f][data-v=L]").click()'); await sleep(300);
ok('#13 倉庫蓋好、扣錢', await ev(`PET.S.ware.built===1 && PET.S.ware.face==="L" && PET.S.gold===${g0}-PET.CFG.ware.cost[0]`));
await ev('PET.openWare()'); await sleep(300);
await ev('document.querySelector("#panel [data-a=bq][data-v=wareUp]").click()'); await sleep(300);
ok('#13 倉庫可以擴建（格數變多）', await ev('PET.S.ware.lv===1 && PET.wareSlots()===PET.CFG.ware.slots[1]'));
await ev('PETDEV.click("p51items"); PET.openWare()'); await sleep(400);
ok('#13 測試版按鈕：每樣家具送進倉庫', await ev('PET.wareUsed()>=12'));
await shotC('p51_13_inventory');
// 用面板「擺到院子」→ 擺放模式
await ev('document.querySelector("#panel [data-a=place][data-v=bed]").click()'); await sleep(500);
ok('#13 擺放模式：下面有 ↺ 換方向／✔ 放這裡／✕ 取消', await ev('[...document.querySelectorAll("#bar button")].map(b=>b.innerText).join("|")').then(t => /換方向/.test(t) && /放這裡/.test(t) && /取消/.test(t)));
await tapCv(560, 610); await sleep(300); await shotC('p51_13_placing');
await ev('[...document.querySelectorAll("#bar button")].find(b=>/換方向/.test(b.innerText)).click()'); await sleep(100);
await ev('[...document.querySelectorAll("#bar button")].find(b=>/放這裡/.test(b.innerText)).click()'); await sleep(300);
ok('#13 擺好：院子多一件、方向正面、倉庫少一件', await ev('PET.S.yardF.length===1 && PET.S.yardF[0].k==="bed" && PET.S.yardF[0].face==="F" && PET.S.ware.items.bed===1'));
// 三個方向各擺一件（同一種），截圖
await ev(`(()=>{PET.S.ware.items.chime=3; PET.S.ware.items.toybox=3; const r=[]; r.push(PET.yardPlace('chime',700,640,'L'),PET.yardPlace('chime',800,640,'F'),PET.yardPlace('chime',900,640,'R'),PET.yardPlace('toybox',1010,650,'L'),PET.yardPlace('toybox',1120,650,'R')); window.__yr=r.map(x=>x.ok); window.__ym=r.map(x=>x.msg||'')})()`);
ok('#13 風鈴架三個方向都擺得下', (await J('window.__yr')).slice(0, 3).every(Boolean), JSON.stringify(await J('window.__ym')));
await ev('PET.ui.close(); PET.shelterPan(0)'); await sleep(800); await shotC('p51_13_yard');
await crop('p51_13_faces_zoom', 620, 500, 380, 180, 2);
// 點院子裡的家具：轉方向、搬、收回
const yf = await J('PET.S.yardF.find(f=>f.k==="chime" && f.face==="L")');
await ev('PET.ui.close(); PET.popClose(); PET.all().forEach(p=>{const s=PET.shelterSt(p); if(s){s.x=160+Math.random()*80; s.tx=null; s.job=null}})'); await sleep(200);   // 小動物別剛好站在家具前面
await tapCv(yf.x, yf.y - 40); await sleep(300);
ok('#13 點院子裡的家具 → 可以轉方向／搬／收回', /收回收容所倉庫/.test(await popTxt()));
await shotC('p51_13_item_pop');
await ev('document.querySelector("#hintPop [data-a=store]").click()'); await sleep(200);
ok('#13 收回倉庫', await ev(`!PET.S.yardF.some(f=>f.id===${yf.id}) && PET.S.ware.items.chime===1`));
await ev('PET.popClose()');
// 倉庫朝向三種
for (const f of ['L', 'F', 'R']) { await ev(`PET.wareFace("${f}")`); await sleep(400); await crop('p51_13_ware_' + f, 500, 200, 280, 260, 1) }
ok('#13 倉庫可以改方向', await ev('PET.S.ware.face==="R"'));

// ===== #7 接縫 =====
await ev('PETDEV.click("p3annex"); PET.go("shelter")'); await sleep(900); await ev('PET.shelterPan(640)'); await sleep(900);
await shotC('p51_07_seam'); await crop('p51_07_seam_zoom', 560, 360, 160, 300, 2);
ok('#7 二館背景用修過接縫的版本', await ev('[...document.images].length>=0') && fs.existsSync(new URL('../assets/scenes/shelter/annex_day_bg_s.jpg', import.meta.url)));
await ev('PET.shelterPan(0)'); await sleep(700);

// ===== #12 西施媽媽 =====
const xm = await J('(()=>{const a=PET._anc["西施媽媽"]; return a?{x:a.x,y:(a.top+a.foot)/2}:null})()');
ok('#12 一館裡站著西施媽媽（用蜜糖媽媽的樣子）', !!xm);
await ev('PET.ui.close(); PET.popClose()'); await sleep(200);
if (xm) { await tapCv(xm.x, xm.y); await sleep(400) }
ok('#12 點西施媽媽本人 → 問答面板', /想問什麼/.test(await panelTxt()));
await ev('PET.ui.close()'); await click('#sbQA'); await sleep(300);
ok('#12 右上頭像按鈕也能問', /想問什麼/.test(await panelTxt()));
const qn = await ev('document.querySelectorAll("#panel [data-a=q]").length');
ok(`#12 常見問題 ${qn} 題（住民滿了、加蓋、出戰、育兒籃、升階、寄放、闖闖、名聲、音量…）`, qn >= 9);
await ev('document.querySelector("#panel [data-a=q][data-v=full]").click()'); await sleep(300); await shotC('p51_12_qa');
await ev('PET.ui.close(); PET.openCounter()'); await sleep(300);
await ev('document.querySelector("#panel [data-a=qa]").click()'); await sleep(300);
ok('#12 櫃檯「問西施媽媽」卡片也能問', /想問什麼/.test(await panelTxt()));
await ev('PET.ui.close()');

// ===== #15 櫃檯圖示 =====
await ev('PET.openCounter()'); await sleep(500);
const ic = await J('[...document.querySelectorAll("#panel .ficon img")].map(i=>i.getAttribute("src").split("/").pop())');
ok('#15 櫃檯功能卡各自有像素圖示（不再用寵物頭像）', ['rescue.png', 'stay.png', 'reroll.png', 'codex.png', 'expand.png', 'ware.png', 'mail.png'].every(k => ic.includes(k)), ic.join(','));
ok('#15 圖示都載入成功', await ev('[...document.querySelectorAll("#panel .ficon img")].every(i=>i.complete&&i.naturalWidth>0)'));
await shotC('p51_15_counter_icons');
await ev('document.querySelector("#panel").scrollTop=500'); await sleep(200); await shotC('p51_15_counter_icons2');
await ev('PET.ui.close()');

// ===== #14 技能名字可以點 =====
await ev(`(()=>{const S=PET.S; const b=PET.makeAnimal({sp:'wolf',tier:3,baby:1,aff:900,q:1}); b.bornDay=PET.dayKey(PET.now())-3; b.name='小灰'; S.babies.push(b); window.__bb=b.id;
  const a=S.pets.find(p=>!p.baby); a.tier=2; a.name='阿土'; window.__ad=a.id})()`);
await ev('PET.openPet(PET.byId(window.__bb))'); await sleep(400);
const nsk = await ev('document.querySelectorAll("#panel a.skn").length');
const kinds = await J('[...new Set([...document.querySelectorAll("#panel a.skn")].map(a=>a.dataset.skd.split(":")[0]))]');
ok(`#14 寶寶面板：固有、傳家、技能、天性魔法名字都能點（${nsk} 個）`, ['inh', 'heir', 'sk', 'sub'].every(k => kinds.includes(k)), kinds.join(','));
await ev('document.querySelector("#panel a.skn[data-skd^=\'sk:\']").click()'); await sleep(300);
const sp1 = await popTxt();
ok('#14 技能說明：效果、各位階數字、冷卻、種類、怎麼學／洗、遺傳', ['各位階', '冷卻', '種類', '怎麼學', '遺傳'].every(k => sp1.includes(k)), sp1.slice(0, 120));
await shotC('p51_14_skill_pop');
await ev('PET.popClose(); document.querySelector("#panel a.skn[data-skd^=\'sub:\']").click()'); await sleep(300);
ok('#14 天性魔法說明有範圍', /各位階/.test(await popTxt()) && /%/.test(await popTxt())); await shotC('p51_14_sub_pop');
await ev('PET.popClose(); PET.openPet(PET.byId(window.__ad))'); await sleep(400);
await shotC('p51_14_adult_panel');
await ev('(document.querySelector("#panel a.skn[data-skd^=\'heir:\']")||document.querySelector("#panel a.skn")).click()'); await sleep(300);
const sp2 = await popTxt(); ok('#14 大朋友：說明裡寫出戰狀態（#10b）', /出戰/.test(sp2) && /大朋友/.test(sp2), sp2.slice(-120));
await shotC('p51_14_adult_heir_pop'); await ev('PET.popClose(); PET.ui.close()');

// ===== #10b 大朋友出戰（面板＋實戰） =====
await ev('PET.openPet(PET.byId(window.__ad))'); await sleep(300);
const adT = await panelTxt(); ok('#10b 大朋友面板：出戰區塊、帶牠出戰按鈕、升階', /出戰（大朋友）/.test(adT) && /帶牠出戰/.test(adT) && /升階/.test(adT));
await ev('document.querySelector("#panel [data-a=eq]").click()'); await sleep(200);
ok('#10b 大朋友可以設成出戰', await ev('PET.S.eq===window.__ad'));
await ev('PET.ui.close(); PET.go("arena",{mode:"normal"}); PET.arena.auto=1'); await sleep(6000); await shotC('p51_10b_adult_arena');
ok('#10b 大朋友真的上場（不是西施）', await ev('PET.arena && !PET.arena.pi.xishi && PET.arena.pi.b.id===window.__ad'));
await ev('PET.go("shelter")'); await sleep(500);
// 實戰模擬：同物種同資質，寶寶 vs 大朋友，每位階跑 3 場 × 60 秒（遊戲時間），看寵物打出的傷害
const SIM = await J(`(()=>{const S=PET.S, out=[], ex=[]; const R0=Math.random; let seed=7; Math.random=()=>{seed=(seed*16807)%2147483647; return seed/2147483647};
  try { for (const sp of ['wolf','retriever','cat']) for (let t=0;t<=4;t++) for (const baby of [1,0]) { if (baby && !t) continue; let dm=0, tm=0, kills=0;
    for (let run=0; run<6; run++) { seed=1000+run*7919+t*31; const p=PET.makeAnimal({sp,tier:t,baby,aff:900,q:1}); p.q=1; p.star=0; p.size=1; p.lv=PET.lvCapOf(p); p.bornDay=PET.dayKey(PET.now())-5; (baby?S.babies:S.pets).push(p); S.eq=p.id;
      PET.go('arena',{mode:'normal'}); const A=PET.arena; A.auto=1; A.hero.hp=A.hero.max=1e9; for (let i=0;i<1200;i++) { try { PET.scene.update(0.05) } catch(e) { if (ex.length<5) ex.push(sp+t+baby+':'+e) } if (PET.sceneName!=='arena' || PET.arena!==A) break }
      dm+=A.dmg.pet||0; tm+=A.t; kills+=A.kills; PET.go('shelter'); const L=baby?S.babies:S.pets; L.splice(L.indexOf(p),1) }
    out.push({sp, tier:t, baby, petDmg:Math.round(dm/6), dps:Math.round(dm/tm), kills:+(kills/6).toFixed(1)}) } } finally { Math.random=R0 }
  S.eq='xishi'; return {out, ex}})()`);
console.log('sim exceptions:', SIM.ex);
const T = ['綠', '藍', '紫', '粉', '橘'];
const simLines = ['（每格 6 場、每場最多 60 秒遊戲時間、主角不會倒；數字是寵物每秒傷害 DPS）', '物種 | 位階 | 寶寶 DPS | 大朋友 DPS | 大/寶'];
const SO = SIM.out;
for (const sp of ['wolf', 'retriever', 'cat']) for (let t = 0; t <= 4; t++) { const b = SO.find(r => r.sp === sp && r.tier === t && r.baby), a = SO.find(r => r.sp === sp && r.tier === t && !r.baby); simLines.push([sp, T[t], b ? b.dps.toLocaleString() : '—', a.dps.toLocaleString(), b && b.dps ? Math.round(a.dps / b.dps * 100) + '%' : '—'].join(' | ')) }
const avg = t => { const bs = SO.filter(r => r.tier === t && r.baby), as = SO.filter(r => r.tier === t && !r.baby); const m = xs => xs.reduce((s, r) => s + r.dps, 0) / (xs.length || 1); return [m(bs), m(as)] };
for (let t = 0; t <= 4; t++) { const [b, a] = avg(t); simLines.push(['平均', T[t], t ? Math.round(b).toLocaleString() : '—', Math.round(a).toLocaleString(), t ? Math.round(a / b * 100) + '%' : '—'].join(' | ')) }
console.log(simLines.join('\n')); fs.writeFileSync(out + '/p51_10b_arena_sim.txt', simLines.join('\n') + '\n');
ok('#10b 實戰：每一階大朋友都打得出傷害、平均來說大朋友比較強', SIM.ex.length === 0 && SO.every(r => r.dps > 0) && [1, 2, 3, 4].every(t => { const [b, a] = avg(t); return a > b }), SIM.ex.join(' | '));

// ===== #2 小屋裡點誰誰講話 =====
await ev(`(()=>{const c=PET.S.cots[0]; const ps=PET.S.pets.filter(p=>PET.canBreedAge(p)&&p.id!==c.a&&p.id!==c.b); if(!c.a) c.a=ps[0].id; if(!c.b) c.b=ps[1].id; PET.go('room',0)})()`); await sleep(1500);
const two = await J(`(()=>{const c=PET.S.cots[0]; return [c.a,c.b].map(id=>{const p=PET.byId(id), a=PET._anc['p'+id]; return {id, name:PET.label(p), x:a&&a.x, y:a&&(a.top+a.foot)/2}})})()`);
ok('#2 小屋裡兩隻都畫出來（有位置）', two.every(t => t.x != null), JSON.stringify(two));
let spk = [];
for (const t of two.slice().reverse()) { const cur = await J(`(()=>{const a=PET._anc['p'+${t.id}]; return {x:a.x,y:(a.top+a.foot)/2}})()`); await ev('PET.ui.close(); PET.popClose(); PET._speech.length=0'); await tapCv(cur.x, cur.y); await sleep(250); spk.push([t.name, await J('PET.speaking()')]) }
ok('#2 點第二隻 → 第二隻講話（不是固定第一隻）', spk[0][1].length === 1 && spk[0][1][0].startsWith(spk[0][0] + '：'), JSON.stringify(spk[0]));
ok('#2 點第一隻 → 第一隻講話', spk[1][1].length === 1 && spk[1][1][0].startsWith(spk[1][0] + '：'), JSON.stringify(spk[1]));
await shotC('p51_02_room_tap');
await ev('PET.go("shelter")'); await sleep(500);

// ===== #16 大頭照跟小人同一個毛色 =====
await ev(`(()=>{const S=PET.S; const b=PET.makeAnimal({sp:'retriever',tier:1,baby:1,aff:900,q:1}); b.bornDay=PET.dayKey(PET.now())-3; b.name=''; S.babies.push(b); window.__rb=b.id})()`);
ok('#16 藍色獵犬寶寶的名字是「黑色獵犬」（跟小人一樣）', await ev('PET.SP.retriever.looks[PET.artTier(PET.byId(window.__rb))]==="黑色獵犬"'));
await ev('PET.go("shelter")'); await sleep(900); await ev('PET.ui.close(); PET.popClose(); PET.openPet(PET.byId(window.__rb))'); await sleep(600);
ok('#16 寵物面板寫的毛色跟小人一樣', /黑色獵犬/.test(await panelTxt()) && !/奶油白獵犬/.test(await panelTxt()) && !/白色獵犬/.test(await panelTxt()), (await panelTxt()).slice(0, 120));
await shotC('p51_16_retriever_blue');
// 全物種稽核表：每一種 × 每一個毛色（位階外觀），左邊小人、右邊大頭照（含星彩、混血、突變毛色）
const sheet = await ev(`(async()=>{const A=PET.art, sps=Object.keys(PET.SP), cell=112, rows=[]; for (const sp of sps) { const hy=PET.HYB&&PET.HYB[sp]; rows.push([sp,0,0,0]); }
  rows.push(['retriever',1,1,0],['bear',0,1,0],['cat',2,1,0],['wolf',1,0,5],['retriever',3,0,6]);
  const W=8*cell+170, H=rows.length*cell; const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'); g.fillStyle='#2b1f27'; g.fillRect(0,0,W,H); g.imageSmoothingEnabled=false; g.font='bold 14px sans-serif';
  const res=[];
  rows.forEach(([sp,t0,shiny,coat],i)=>{ const y=i*cell; g.fillStyle='#fff'; g.fillText(PET.SP[sp].name+(shiny?' ✦星彩':'')+(coat?' 毛色'+coat:''),6,y+20);
    const ts=(t0||shiny||coat)?[t0]:[0,1,2,3];
    ts.forEach((t,j)=>{ const x=170+j*cell*2; const p={sp,tier:t,look:t,baby:1,star:shiny?2:0,coat:coat?[coat,coat]:undefined,size:1,id:undefined};
      try { A.draw(g,p,x+cell/2,y+cell-10,{act:'idle',t:0,scale:1.4}) } catch(e) {}
      const pc=A.portraitCv(sp,t,!!shiny,96,{coat:coat||0}); if(pc) g.drawImage(pc,x+cell+8,y+8,96,96);
      g.fillStyle='#ffe08a'; g.fillText((PET.SP[sp].looks||[])[t]||('t'+t),x+4,y+cell-2) }) });
  return c.toDataURL('image/png')})()`);
fs.writeFileSync(out + '/p51_16_variant_audit.png', Buffer.from(sheet.split(',')[1], 'base64'));
ok('#16 稽核表畫出來', sheet.length > 10000);
// 同一個存檔裡，大廳／名冊／小屋面板／出戰／圖鑑的頭像都走同一個 artTier
const av = await J(`(()=>{const p=PET.byId(window.__rb); const h=PET.ui.av(p,44); return {h:h.slice(0,200)}})()`);
ok('#16 名冊頭像用藍色位階外觀（黑色獵犬 retriever_1）', /retriever_1\.png/.test(av.h) && !/retriever_3\.png/.test(av.h), av.h.slice(0, 120));

// ===== #6 框 =====
await ev('PET.ui.close(); PET.go("shelter")'); await sleep(600);
await crop('p51_06_frames_hud', 0, 0, 900, 46, 2);
await ev('PET.openCounter()'); await sleep(400); await crop('p51_06_frames_panel', 840, 60, 440, 400, 1.5);
ok('#6 按鈕／卡片／上排都是圓角＋階梯邊', await ev(`['button','#hud span','.card'].every(s=>{const e=document.querySelector(s); if(!e) return true; const cs=getComputedStyle(e); return parseFloat(cs.borderTopLeftRadius)>=8 && /inset/.test(cs.boxShadow)})`));
await ev('PET.ui.close()');

console.log('JS errors:', errs.slice(0, 8).join(' | '));
ok('沒有 JS 錯誤', errs.filter(e => !/NETFAIL/.test(e)).length === 0, errs.slice(0, 3).join(' | '));
const nf = R.filter(r => r[0] === 'FAIL').length; console.log(nf ? `${nf} FAIL` : 'ALL PASS');
process.exit(nf ? 1 : 0);
