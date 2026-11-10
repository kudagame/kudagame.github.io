// 艾爾琳之旅 網頁版：Google 登入＋雲端存檔（Firebase Auth + Firestore，一個帳號一份文件 users/{uid}）
// 沒登入＝訪客，照舊只存這台裝置；登入後：存檔點自動同步（延遲合併），離線時排隊、連線後補傳；兩邊都有不同進度時一定讓玩家自己選
(()=>{
const Q=new URLSearchParams(location.search),LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname),EMU=LOCAL&&Q.get('emu')==='1';
const HN={kudas:'苦達斯',bard:'尋歡作樂'},DEBOUNCE=+(Q.get('cdeb')||4000);
const st={cfg:null,fb:null,auth:null,db:null,user:null,ready:false,busy:false,status:'',timer:0,retry:0,modal:null,err:''};
window.__cloud=st;
// ---------- 小工具 ----------
const $e=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function hashStr(s){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0')}
const body=o=>{const c=Object.assign({},o);delete c.ts;return JSON.stringify(c)};
const hashSave=o=>hashStr(body(o));
const curSave=()=>{try{return typeof SAVE!=='undefined'?(SAVE&&typeof m27Park==='function'?m27Park(SAVE):SAVE):null}catch(e){return null}};  // M2.7：雲端也存「停車」版（舊版讀得懂）
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const syncRec=uid=>{const r=lsGet('m2cloud_sync')||{};return r[uid]||null};
const setSyncRec=(uid,h)=>{const r=lsGet('m2cloud_sync')||{};r[uid]={h,at:Date.now()};lsSet('m2cloud_sync',r)};
function summary(o){const lv=o.lv|0||1,ch=[[o.hero||'kudas',lv]];for(const k in (o.chars||{}))ch.push([k,(o.chars[k]&&o.chars[k].lv)|0||1]);
  let clr=0;for(const k in (o.clear||{}))if(+o.clear[k]>0)clr++;return {hero:o.hero||'kudas',lv,maxLv:Math.max(...ch.map(c=>c[1])),ch,gold:o.gold|0,clr,inv:(o.inv||[]).length,ts:o.ts||0}}
// 這台還沒玩過（新存檔只有一把初始武器）：可以直接換成雲端進度，不用問
const pristine=o=>{if(!o)return true;const s=summary(o);if(s.maxLv>1||s.clr||s.gold||o.shards|0||o.gems|0||o.exp|0||o.xp|0||s.inv>1)return false;
  for(const k in (o.chars||{})){const c=o.chars[k]||{};if(c.exp|0||c.xp|0||(c.inv||[]).length>1||Object.keys(c.clear||{}).length)return false}return true};
async function enc(o){const j=JSON.stringify(o);if(j.length<300000||typeof CompressionStream==='undefined')return {enc:'json',data:j};
  const bs=new Blob([j]).stream().pipeThrough(new CompressionStream('gzip'));const u=new Uint8Array(await new Response(bs).arrayBuffer());let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return {enc:'gz64',data:btoa(s)}}
async function dec(d){if(d.enc==='gz64'){const b=Uint8Array.from(atob(d.data),c=>c.charCodeAt(0));const t=await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();return JSON.parse(t)}return JSON.parse(d.data)}
const fmt=ts=>ts?new Date(ts).toLocaleString('zh-TW',{hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'（不明）';
// ---------- 畫面：右上角帳號鈕 ----------
const css=`#cloudChip{position:fixed;z-index:40;display:none;align-items:center;gap:8px;font:bold 14px NSans,sans-serif;color:#f3dfb0;background:rgba(20,13,7,.86);border:2px solid #d6ac54;border-radius:22px;padding:4px 6px 4px 6px;box-shadow:0 2px 8px rgba(0,0,0,.5);user-select:none;-webkit-user-select:none;touch-action:manipulation}
#cloudChip button{font:inherit;color:#2a1a08;background:linear-gradient(#ffe7a6,#d6ac54);border:0;border-radius:16px;padding:6px 12px;cursor:pointer}
#cloudChip .g{display:inline-flex;align-items:center;gap:6px}#cloudChip .g i{width:18px;height:18px;border-radius:50%;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23EA4335' d='M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z'/%3E%3Cpath fill='%234285F4' d='M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z'/%3E%3Cpath fill='%23FBBC05' d='M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z'/%3E%3Cpath fill='%2334A853' d='M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-10l-7.8 6C6.6 42.6 14.6 48 24 48z'/%3E%3C/svg%3E") center/14px no-repeat}
#cloudChip img,#cloudChip .av{width:28px;height:28px;border-radius:50%;object-fit:cover;background:#7a5626;display:inline-flex;align-items:center;justify-content:center;color:#fff}
#cloudChip .nm{max-width:9em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.15}#cloudChip .nm small{display:block;font-size:11px;opacity:.8;font-weight:normal}
#cloudChip .out{background:rgba(255,255,255,.12);color:#f3dfb0;border:1px solid #8c6a33}
#cloudModal{position:fixed;inset:0;z-index:60;background:rgba(5,3,1,.78);display:flex;align-items:center;justify-content:center;font:bold 15px NSans,sans-serif;color:#f3dfb0;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
#cloudModal .box{background:#1e140b;border:3px solid #d6ac54;border-radius:16px;padding:16px 18px;max-width:min(760px,94vw);max-height:92vh;overflow:auto;box-sizing:border-box}
#cloudModal h2{margin:0 0 6px;font-size:20px;color:#ffe9b8}#cloudModal p{margin:4px 0 10px;font-weight:normal;font-size:13px;opacity:.9}
#cloudModal .cards{display:flex;gap:12px;flex-wrap:wrap}#cloudModal .card{flex:1 1 240px;background:#2b1d10;border:2px solid #6b4f26;border-radius:12px;padding:10px 12px}
#cloudModal .card h3{margin:0 0 6px;font-size:16px}#cloudModal .card .tag{display:inline-block;font-size:11px;background:#3d6b2a;color:#eaffd8;border-radius:8px;padding:1px 7px;margin-left:6px}
#cloudModal .card .tag.lv{background:#6b3d8a}#cloudModal table{width:100%;font-size:13px;font-weight:normal;border-collapse:collapse}#cloudModal td{padding:2px 0}#cloudModal td:first-child{opacity:.75;width:6.5em}
#cloudModal button{margin-top:8px;width:100%;font:bold 16px NSans,sans-serif;color:#2a1a08;background:linear-gradient(#ffe7a6,#d6ac54);border:0;border-radius:10px;padding:9px;cursor:pointer}
#cloudModal .later{background:rgba(255,255,255,.1);color:#f3dfb0;border:1px solid #8c6a33;font-size:14px}`;
const stl=$e('style');stl.textContent=css;document.head.appendChild(stl);
const chip=$e('div');chip.id='cloudChip';document.body.appendChild(chip);
const stop=e=>{e.stopPropagation()};for(const t of ['pointerdown','mousedown','touchstart','click','mouseup'])chip.addEventListener(t,stop);
const tap=(el,fn)=>{let armed=false;el.addEventListener('pointerdown',e=>{e.stopPropagation();armed=true});el.addEventListener('pointerup',e=>{e.stopPropagation();if(armed){armed=false;fn()}});el.addEventListener('click',e=>e.stopPropagation())};
let chipKey='';
function drawChip(){const u=st.user;const k=(u?u.uid+'|'+st.status:'out|'+st.signing+st.err);if(k===chipKey)return;chipKey=k;chip.innerHTML='';
  if(!u){const b=$e('button','g','<i></i>'+(st.signing?'登入中…':'用 Google 登入'));b.title=st.err||'登入後存檔會存到你的 Google 帳號，換裝置也能接著玩';tap(b,signIn);chip.appendChild(b);
    if(st.err){const s=$e('span','nm','<small>'+esc(st.err)+'</small>');chip.appendChild(s)}return}
  const nm=u.displayName||u.email||'玩家';chip.appendChild(u.photoURL?Object.assign($e('img'),{src:u.photoURL,alt:'',referrerPolicy:'no-referrer'}):$e('span','av',esc(nm.slice(0,1))));
  chip.appendChild($e('span','nm',esc(nm)+'<small>'+esc(st.status||'')+'</small>'));const o=$e('button','out','登出');tap(o,doSignOut);chip.appendChild(o)}
function showChip(){let m='',pa=false,pw='';try{m=mode;pa=paused;pw=pauseWhy}catch(e){}
  const on=!!st.fb&&!st.modal&&!!curSave()&&(m==='title'||m==='chsel'||(m==='play'&&pa&&pw==='esc'))&&!document.documentElement.classList.contains('rot');
  if(!on){chip.style.display='none';return}drawChip();const cv=document.getElementById('c'),r=cv.getBoundingClientRect();chip.style.display='flex';
  const w=chip.offsetWidth;chip.style.left=Math.max(4,Math.round(r.right-w-8))+'px';chip.style.top=Math.round(r.top+8)+'px'}
setInterval(showChip,250);
// ---------- 選擇存檔視窗 ----------
let pausedByUs=false;
addEventListener('keydown',e=>{if(st.modal){e.stopImmediatePropagation();e.preventDefault()}},true);
function chooser(local,cloud,why){return new Promise(res=>{
  try{if(mode==='play'&&!paused){paused=true;pauseWhy='cloud';pausedByUs=true}}catch(e){}
  const a=summary(local),b=summary(cloud);const m=$e('div');m.id='cloudModal';st.modal=m;
  const card=(t,s,other,key)=>{const tags=(s.ts>other.ts?'<span class="tag">較新</span>':'')+(s.maxLv>other.maxLv?'<span class="tag lv">等級較高</span>':'');
    return `<div class="card"><h3>${t}${tags}</h3><table><tr><td>最後儲存</td><td>${fmt(s.ts)}</td></tr>
     <tr><td>角色等級</td><td>${s.ch.map(c=>esc(HN[c[0]]||c[0])+' Lv.'+c[1]).join('、')}</td></tr><tr><td>金幣</td><td>${s.gold.toLocaleString()}</td></tr>
     <tr><td>通過關卡</td><td>${s.clr} 關</td></tr><tr><td>背包</td><td>${s.inv} 件</td></tr></table><button data-k="${key}">用這份存檔</button></div>`};
  m.innerHTML=`<div class="box"><h2>要用哪一份存檔？</h2><p>${why}<br>沒選的那份不會刪掉：會另外備份在這台裝置（之後可以用「匯出存檔」取回）。</p>
   <div class="cards">${card('這台裝置的存檔',a,b,'local')}${card('Google 帳號的雲端存檔',b,a,'cloud')}</div><button class="later" data-k="later">先不要，登出（繼續用這台裝置的存檔）</button></div>`;
  for(const t of ['pointerdown','mousedown','touchstart','click','mouseup','pointerup'])m.addEventListener(t,stop);
  for(const bt of m.querySelectorAll('button'))tap(bt,()=>{m.remove();st.modal=null;try{if(pausedByUs&&pauseWhy==='cloud'){paused=false;pauseWhy=''}}catch(e){}pausedByUs=false;res(bt.dataset.k)});
  document.body.appendChild(m);showChip()})}
// ---------- 同步 ----------
const ref=()=>st.fb.doc(st.db,'users',st.user.uid);
const tmo=(p,ms,w)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('timeout '+w)),ms))]);// 網路卡住時不要一直等
async function readCloud(){const s=await tmo(st.fb.getDoc(ref()),15000,'read');if(!s.exists())return null;const d=s.data();return {h:d.h,ts:d.ts,save:await dec(d)}}
function applyCloud(save,h,uid){// 把雲端存檔放進這台裝置後重新載入（舊的本機存檔另存備份）
  const old=curSave();if(old)lsSet('m2save_bak_local',old);setSyncRec(uid,h);try{localStorage.setItem('m2save',JSON.stringify(save))}catch(e){}
  try{SAVE=save}catch(e){}st.status='載入雲端存檔…';chipKey='';setTimeout(()=>location.reload(),150)}
async function writeCloud(save,expectH){// 用交易寫入：雲端若在別台裝置被改過（跟上次同步的不一樣）就不覆蓋，改問玩家
  const h=hashSave(save),e=await enc(save),s=summary(save);
  const r=await tmo(st.fb.runTransaction(st.db,async tx=>{const cur=await tx.get(ref());const ch=cur.exists()?cur.data().h:null;
    if(expectH!==undefined&&ch!==null&&ch!==expectH&&ch!==h)return {conflict:true};
    tx.set(ref(),{v:1,h,ts:save.ts||Date.now(),enc:e.enc,data:e.data,sum:{hero:s.hero,lv:s.lv,maxLv:s.maxLv,gold:s.gold,clr:s.clr},dev:(navigator.userAgent||'').slice(0,120),at:st.fb.serverTimestamp()});return {ok:true}}),20000,'write');
  if(r.conflict)return false;setSyncRec(st.user.uid,h);return true}
async function reconcile(){const u=st.user;if(!u||st.busy)return;st.busy=true;st.status='檢查雲端存檔…';chipKey='';
  try{const local=curSave();const cloud=await readCloud();if(st.user!==u)return;const lh=local?hashSave(local):null,rec=syncRec(u.uid);
    if(!cloud){if(local)await writeCloud(local,undefined);ok('已建立雲端存檔')}
    else if(cloud.h===lh){setSyncRec(u.uid,lh);ok('已同步')}
    else if(rec&&rec.h===cloud.h){await writeCloud(local,cloud.h);ok('已同步')}// 只有這台改過
    else if((rec&&rec.h===lh)||pristine(local)){applyCloud(cloud.save,cloud.h,u.uid);return}// 只有雲端改過，或這台還沒有進度
    else{const k=await chooser(local,cloud.save,'這台裝置和你的 Google 帳號各有一份不同的進度。');
      if(k==='local'){lsSet('m2save_bak_cloud',cloud.save);await writeCloud(local,cloud.h);ok('已同步（用這台的存檔）')}
      else if(k==='cloud'){applyCloud(cloud.save,cloud.h,u.uid);return}else{await doSignOut();return}}
    st.ready=true;if(lsGet('m2cloud_dirty')===u.uid)schedule(10)}
  catch(e){st.ready=false;st.status=navigator.onLine?'雲端暫時連不上，稍後重試':'離線：連線後同步';chipKey='';console.warn('cloud reconcile',e);later(reconcile)}
  finally{st.busy=false}}
function ok(t){st.status=t+' '+new Date().toLocaleTimeString('zh-TW',{hour12:false,hour:'2-digit',minute:'2-digit'});chipKey='';st.retry=0}
function later(fn){clearTimeout(st.rt);const d=Math.min(60000,5000*Math.pow(2,st.retry++));st.rt=setTimeout(()=>{if(navigator.onLine)fn()},d)}
function schedule(ms){if(!st.user)return;lsSet('m2cloud_dirty',st.user.uid);clearTimeout(st.timer);st.timer=setTimeout(flush,ms==null?DEBOUNCE:ms);if(st.ready&&!/待同步/.test(st.status)){st.status='有新進度，待同步';chipKey=''}}
async function flush(){const u=st.user;if(!u||lsGet('m2cloud_dirty')!==u.uid)return;if(!st.ready){return reconcile()}
  if(!navigator.onLine){st.status='離線：已排隊，連線後同步';chipKey='';return}
  if(st.busy){clearTimeout(st.timer);st.timer=setTimeout(flush,1500);return}st.busy=true;
  try{const local=curSave();const rec=syncRec(u.uid);const okW=await writeCloud(local,rec?rec.h:undefined);
    if(okW){ok('已同步');if(hashSave(curSave())===syncRec(u.uid).h)localStorage.removeItem('m2cloud_dirty');else{st.busy=false;schedule()}}
    else{st.busy=false;st.ready=false;const cloud=await readCloud();const k=await chooser(curSave(),cloud.save,'雲端存檔在別台裝置更新過，和這台的進度不同。');
      if(k==='local'){lsSet('m2save_bak_cloud',cloud.save);await writeCloud(curSave(),cloud.h);localStorage.removeItem('m2cloud_dirty');ok('已同步（用這台的存檔）');st.ready=true}
      else if(k==='cloud'){localStorage.removeItem('m2cloud_dirty');applyCloud(cloud.save,cloud.h,u.uid)}else{await doSignOut()}}}
  catch(e){st.status=navigator.onLine?'同步失敗，稍後重試':'離線：已排隊，連線後同步';chipKey='';console.warn('cloud flush',e);later(flush)}
  finally{st.busy=false}}
addEventListener('online',()=>{st.retry=0;if(!st.user)return;if(!st.ready)reconcile();else flush()});
addEventListener('offline',()=>{if(st.user){st.status='離線：進度先存在這台，連線後同步';chipKey=''}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&st.user&&st.ready&&lsGet('m2cloud_dirty')===st.user.uid){clearTimeout(st.timer);flush()}});
// 存檔點：包住原本的 m2Save（本機 localStorage 照舊，另外排一次雲端同步）
function hook(){if(typeof m2Save!=='function'||m2Save.__cloud)return false;const o=m2Save;const w=function(){const r=o.apply(this,arguments);try{if(st.user){const s=curSave(),rec=syncRec(st.user.uid);if(s&&(!rec||rec.h!==hashSave(s)))schedule()}}catch(e){}return r};w.__cloud=1;m2Save=w;return true}
// ---------- 登入／登出 ----------
const standaloneIOS=()=>{const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return ios&&(navigator.standalone===true||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches)};
async function signIn(){if(!st.auth||st.signing)return;st.err='';st.signing=true;chipKey='';const F=st.fb,p=new F.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
  try{if(EMU&&window.__cloudTestUser){const t=window.__cloudTestUser;await F.signInWithCredential(st.auth,F.GoogleAuthProvider.credential(JSON.stringify({sub:t.sub,email:t.email,email_verified:true,name:t.name})))}
    else if(standaloneIOS()){sessionStorage.setItem('erinn_redirect','1');await F.signInWithRedirect(st.auth,p);return}// 主畫面版：彈出視窗拿不回結果，改用轉址
    else{try{await F.signInWithPopup(st.auth,p)}catch(e){if(/popup-blocked|operation-not-supported|web-storage-unsupported/.test(e.code||'')){await F.signInWithRedirect(st.auth,p);return}throw e}}}
  catch(e){if(!/popup-closed-by-user|cancelled-popup-request/.test(e.code||''))st.err='登入失敗：'+(e.code||e.message||e).toString().replace('auth/','');console.warn('signIn',e)}
  finally{st.signing=false;chipKey=''}}
async function doSignOut(){try{if(st.user&&st.ready&&lsGet('m2cloud_dirty')===st.user.uid&&navigator.onLine)await flush()}catch(e){}
  st.ready=false;clearTimeout(st.timer);try{await st.fb.signOut(st.auth)}catch(e){}st.status='';chipKey=''}
st.signIn=signIn;st.signOut=doSignOut;st.flush=flush;st.hash=hashSave;st.syncRec=syncRec;
// ---------- 啟動：讀設定、延後載入 Firebase（檔案已離線快取；沒網路也不影響遊戲） ----------
function loadScript(src){return new Promise((r,j)=>{const s=document.createElement('script');s.src=src;s.onload=r;s.onerror=()=>j(new Error(src));document.head.appendChild(s)})}
async function init(){let cfg=window.ERINN_FIREBASE;
  if(EMU)cfg={apiKey:'demo-key',authDomain:'localhost',projectId:Q.get('proj')||'demo-erinn',appId:'demo'};
  if(!cfg||/^PASTE/.test(cfg.apiKey||'')){console.info('雲端存檔尚未設定（web/firebase-config.js）');return}
  if(!window.__FB)await loadScript('fb.js');const F=window.__FB;st.cfg=cfg;
  const app=F.initializeApp(cfg);st.auth=F.initializeAuth(app,{persistence:[F.indexedDBLocalPersistence,F.browserLocalPersistence],popupRedirectResolver:F.browserPopupRedirectResolver});
  st.db=F.getFirestore(app);
  if(EMU){F.connectAuthEmulator(st.auth,'http://127.0.0.1:'+(Q.get('aport')||9099),{disableWarnings:true});F.connectFirestoreEmulator(st.db,'127.0.0.1',+(Q.get('fport')||8080))}
  st.fb=F;
  F.onAuthStateChanged(st.auth,u=>{const prev=st.user;st.user=u;st.ready=false;chipKey='';if(u&&(!prev||prev.uid!==u.uid))waitSave().then(()=>setTimeout(reconcile,300));if(!u)st.status=''});
  if(sessionStorage.getItem('erinn_redirect')){sessionStorage.removeItem('erinn_redirect');
    F.getRedirectResult(st.auth).catch(e=>{st.err='登入沒有完成：'+(e.code||e.message||'').replace('auth/','')+(standaloneIOS()?'（可改用 Safari 開啟網址登入）':'');chipKey='';console.warn('redirect',e)})}}
function waitSave(){return new Promise(r=>{const t=()=>{if(curSave()&&hook()!==null&&typeof m2Save==='function'&&m2Save.__cloud)r();else setTimeout(t,200)};t()})}
const hk=setInterval(()=>{if(hook()||(typeof m2Save==='function'&&m2Save.__cloud))clearInterval(hk)},200);
init().catch(e=>console.warn('cloud init',e));
})();
