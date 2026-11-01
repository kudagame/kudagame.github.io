// 艾爾琳之旅 網頁版 service worker：殼層預先快取；資源包（pk/*.bin）第一次下載後快取；a/ 底下的檔案從資源包切出來
const VER='e0949e3d06',SHELL='erinn-shell-'+VER,PACKS='erinn-packs',CFG='erinn-cfg';
const SHELL_FILES=["./", "index.html", "boot.js", "fb.js", "manifest.webmanifest", "pk/idx.json", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "game.js", "m2.js", "ms.js", "sp.js", "mon.js", "m21.js", "m22.js", "m23.js", "m24.js", "m25.js", "m25b.js", "w1.js", "m27.js", "mob.js", "firebase-config.js", "cloud.js"];
const CT={png:'image/png',json:'application/json',otf:'font/otf',ogg:'audio/ogg',m4a:'audio/mp4',js:'text/javascript'};
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(SHELL_FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('erinn-shell-')&&k!==SHELL)await caches.delete(k);
  try{const idx=await getIdx();const keep=new Set(idx.packs.map(p=>p.file));const c=await caches.open(PACKS);for(const r of await c.keys()){const n=new URL(r.url).pathname.split('/').pop();if(!keep.has(n))await c.delete(r)}}catch(_){}
  await self.clients.claim()})())});
let IDX=null,AUD=null;const BLOB=new Map(),INF=new Map();
async function getIdx(){if(IDX)return IDX;const c=await caches.open(SHELL);let r=await c.match('pk/idx.json');if(!r)r=await fetch('pk/idx.json');IDX=await r.json();return IDX}
async function getAud(){if(AUD)return AUD;const c=await caches.open(CFG);const r=await c.match('aud');AUD=r?await r.text():'ogg';return AUD}
async function packBlob(file){if(BLOB.has(file))return BLOB.get(file);if(INF.has(file))await INF.get(file);
  const c=await caches.open(PACKS);let r=await c.match('pk/'+file);
  if(!r){const p=(async()=>{const n=await fetch('pk/'+file);if(!n.ok)throw new Error('pack '+n.status);await c.put('pk/'+file,n.clone());return n})();INF.set(file,p);try{r=await p}finally{INF.delete(file)}}
  const b=await r.blob();BLOB.set(file,b);return b}
async function asset(req,path){const idx=await getIdx();let key=path;const aud=await getAud();
  if(aud==='m4a'&&key.endsWith('.ogg'))key=key.slice(0,-4)+'.m4a';
  const e=idx.files[key];if(!e)return new Response('not found',{status:404});
  let pb=null;for(let t=0;t<4&&!pb;t++){try{pb=await packBlob(e[0])}catch(_){BLOB.delete(e[0]);await new Promise(r=>setTimeout(r,400*(t+1)))}}
  if(!pb)return new Response('pack unavailable',{status:503});const b=pb.slice(e[1],e[1]+e[2]);const ext=key.split('.').pop(),ct=CT[ext]||'application/octet-stream';
  const rg=req.headers.get('range');
  if(rg){const m=/bytes=(\d*)-(\d*)/.exec(rg);let s=m&&m[1]?+m[1]:0,en=m&&m[2]?+m[2]:b.size-1;if(en>=b.size)en=b.size-1;
    return new Response(b.slice(s,en+1),{status:206,headers:{'Content-Type':ct,'Content-Range':`bytes ${s}-${en}/${b.size}`,'Content-Length':String(en-s+1),'Accept-Ranges':'bytes'}})}
  return new Response(b,{headers:{'Content-Type':ct,'Content-Length':String(b.size),'Accept-Ranges':'bytes'}})}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return;
  const base=new URL('./',self.registration.scope).pathname;let p=u.pathname.startsWith(base)?u.pathname.slice(base.length):u.pathname.replace(/^\//,'');
  if(p.startsWith('__/'))return;// Firebase 登入輔助頁（自架在同網域）一律走網路，不能被快取或換成遊戲首頁
  // exe 版才有的伺服器功能：網頁版存檔只用 localStorage，錄影直接下載
  if(p==='__cfg'){e.respondWith((async()=>{AUD=u.searchParams.get('aud')||'ogg';const c=await caches.open(CFG);await c.put('aud',new Response(AUD));return new Response('ok')})());return}
  if(p==='save'||p==='ping'){e.respondWith(new Response(null,{status:204}));return}
  if(['load','rec','recstat','quit','savepath'].includes(p)){e.respondWith(new Response('',{status:404}));return}
  if(p.startsWith('a/')){e.respondWith(asset(e.request,p));return}
  if(p.startsWith('pk/')&&p.endsWith('.bin')){const file=p.slice(3);e.respondWith((async()=>{const c=await caches.open(PACKS);const r=await c.match('pk/'+file);if(r)return r;
      const n=await fetch(e.request);if(n.ok){const pp=c.put('pk/'+file,n.clone()).catch(()=>{});INF.set(file,pp);pp.then(()=>INF.delete(file));e.waitUntil(pp)}return n})());return}
  e.respondWith((async()=>{const c=await caches.open(SHELL);const key=e.request.mode==='navigate'||p===''?'index.html':p;
    const r=await c.match(key,{ignoreSearch:true});if(r)return r;try{return await fetch(e.request)}catch(_){return (await c.match('index.html'))||new Response('offline',{status:503})}})())});
