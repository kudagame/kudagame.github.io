// 開發用：開頁面、跑一段 JS、截圖。node pettest/tools/peek.mjs port outdir name "js" [waitms]
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const [port, out, name, js, wait] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const dport = 9800 + Math.floor(Math.random() * 150), prof = '/tmp/cdp_p4_peek_' + dport;
const ch = spawn('/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${dport}`, '--window-size=1280,720', '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${dport}/json`)).json(); const pg = l.find(x => x.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break } } catch (e) { } await sleep(200) }
await new Promise(r => ws.onopen = r); let id = 0; const pend = {}; const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 400)); if (m.method === 'Runtime.consoleAPICalled' && ['error', 'log'].includes(m.params.type)) errs.push(m.params.type + ' ' + m.params.args.map(a => a.value || a.description).join(' ').slice(0, 400)) };
const call = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) });
await call('Runtime.enable'); await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await call('Page.navigate', { url: `http://127.0.0.1:${port}/pettest/` });
for (let i = 0; i < 50; i++) { const r = await call('Runtime.evaluate', { expression: 'window.PET&&PET.booted', returnByValue: true }); if (r.result?.result?.value) break; await sleep(300) }
const r = await call('Runtime.evaluate', { expression: js, returnByValue: true, awaitPromise: true }); console.log('result:', String(JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description)).slice(0, 3000));
await sleep(+wait || 800);
const s = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.result.data, 'base64'));
console.log(errs.join('\n')); ch.kill(); await sleep(300); fs.rmSync(prof, { recursive: true, force: true }); process.exit(0);
