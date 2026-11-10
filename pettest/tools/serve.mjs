// 本機測試伺服器：node pettest/tools/serve.mjs [port]
// 以遊戲專案根目錄為根，所以 pettest 可以直接讀到 ../chars/pets 的最新美術。
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const port = +(process.argv[2] || process.env.PORT || 18923);
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p === '/') { r.writeHead(302, { Location: '/pettest/' }); return r.end() }
  let f = path.join(root, p); if (!f.startsWith(root)) { r.writeHead(403); return r.end() }
  fs.stat(f, (e, s) => {
    if (!e && s.isDirectory()) f = path.join(f, 'index.html');
    fs.readFile(f, (e2, d) => { if (e2) { r.writeHead(404); return r.end('not found') } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d) });
  });
}).listen(port, process.env.HOST || '127.0.0.1', () => console.log(`寵物測試版：http://${process.env.HOST || '127.0.0.1'}:${port}/pettest/`));
