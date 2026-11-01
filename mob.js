// ===== 手機版：觸控操作＋Android 平台橋接（只在 APK、觸控裝置或 ?mob=1 時啟用） =====
(()=>{
const QM=new URLSearchParams(location.search);const BR=window.AndroidBridge||null;
// 觸控裝置（含 iPad、觸控筆電）都載入；鍵盤＋滑鼠時隱藏觸控按鍵，碰螢幕再出現
const COARSE=matchMedia('(pointer:coarse)').matches;
const ON=QM.get('mob')!=='0'&&(!!BR||QM.get('mob')==='1'||navigator.maxTouchPoints>0||COARSE);
if(!ON)return;
let IM=(BR||QM.get('mob')==='1'||COARSE)?'touch':'kb';// touch：觸控按鍵；kb：鍵盤滑鼠
window.__mob={on:true,android:!!BR,get im(){return IM}};
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const CANREC=!!BR||!!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream);
// ---------- Android 平台橋接：存檔、錄影、離開 ----------
if(BR){const of=window.fetch.bind(window);
  const R=(st,body,ct)=>new Response(st===204?null:body,{status:st,headers:ct?{'Content-Type':ct}:{}});
  const b64=async blob=>{const u=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
  window.fetch=async(u,o={})=>{const url=typeof u==='string'?u:(u&&u.url)||'';const a=new URL(url,location.href);const p=a.pathname.replace(/^\//,''),q=a.searchParams,m=(o.method||'GET').toUpperCase();
    try{
      if(p==='save'&&m==='POST'){const b=typeof o.body==='string'?o.body:await new Response(o.body).text();return R(BR.save(b)?204:500)}
      if(p==='load'){const s=BR.load();return s?R(200,s,'application/json'):R(404,'')}
      if(p==='ping')return R(204);
      if(p==='quit'){setTimeout(()=>BR.quit(),300);return R(204)}
      if(p==='savepath')return R(200,BR.savePath(),'text/plain; charset=utf-8');
      if(p==='rec'&&m==='POST'){const nm=q.get('name')||'rec',ext=q.get('ext')||'webm';
        if(q.get('end')==='1')return R(200,BR.recEnd(nm,ext),'application/json');
        BR.recChunk(nm,+(q.get('seq')||0),ext,await b64(o.body));return R(204)}
      if(p==='recstat')return R(200,BR.recStat(q.get('name')||''),'application/json');
    }catch(e){return R(500,String(e))}
    return of(u,o)};
  const sb=navigator.sendBeacon&&navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon=(u,d)=>{try{if(String(u).replace(/^.*\//,'')==='save'){if(typeof d==='string')BR.save(d);else if(d&&d.text)d.text().then(t=>BR.save(t));return true}}catch(e){}return sb?sb(u,d):false};
}

// ---------- Android：存檔匯出／匯入改用系統的「儲存／開啟檔案」 ----------
if(BR){const nm=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `存檔備份_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.json`};
  window.m21Export=()=>{try{G('m2Save')();BR.exportSave(JSON.stringify(G('SAVE'),null,1),nm())}catch(e){G('m21Toast')('匯出失敗：'+e)}};
  window.m21Import=()=>{try{BR.importSave()}catch(e){G('m21Toast')('匯入失敗：'+e)}};
  window.__sioCb=(kind,ok,data)=>{const toast=G('m21Toast');
    if(kind==='export'){toast(ok?('已匯出存檔：'+data):('沒有匯出'+(data?'（'+data+'）':'')),7000);return}
    if(kind!=='import')return;if(!ok){if(data)toast('沒有匯入（'+data+'）',5000);return}
    try{const o=JSON.parse(String(data).replace(/^\uFEFF/,''));if(!G('m21Valid')(o)){toast('這不是有效的存檔檔案');return}
      if(!confirm('要用匯入的存檔取代目前進度嗎？（目前進度會先自動備份成 .bak）'))return;
      G('migrate')(o);G('m21Migrate')(o);o.ts=Date.now();SAVE=o;G('m2Save')();G('calcGS')();G('buildTints')();G('m21AudioApply')();
      try{G('m22ApplyHero')();G('calcGS')()}catch(e){}toast('匯入完成')}catch(e){toast('匯入失敗：'+e)}}}
// ---------- 鍵盤模擬（多個來源可以同時按住同一個鍵） ----------
const HOLD={};// code -> Set(src)
const KEYN={Space:' ',Enter:'Enter',Escape:'Escape',Tab:'Tab',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ShiftLeft:'Shift',Semicolon:';',Quote:"'",BracketLeft:'[',BracketRight:']',Backspace:'Backspace',F9:'F9'};
const kev=(t,code)=>{const key=KEYN[code]||(code.startsWith('Key')?code.slice(3).toLowerCase():code);window.dispatchEvent(new KeyboardEvent(t,{code,key,bubbles:true,cancelable:true}))};
function kDown(src,code){const s=HOLD[code]||(HOLD[code]=new Set());const was=s.size>0;s.add(src);if(!was)kev('keydown',code)}
function kUp(src,code){const s=HOLD[code];if(!s||!s.has(src))return;s.delete(src);if(!s.size)kev('keyup',code)}
function kForceUp(code){if(HOLD[code]&&HOLD[code].size)kev('keyup',code)}
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
function tapKey(code){kDown('tap',code);setTimeout(()=>kUp('tap',code),90)}
window.__mobKey=tapKey;
// 連按兩下（肩撞／踱地／滑行／跪彈）：按→放→按，第二下按住直到手指放開
const stepWait=()=>new Promise(r=>{const n0=window.__fn||0;let k=0;const f=()=>{if((window.__fn||0)!==n0||++k>10)r();else requestAnimationFrame(f)};requestAnimationFrame(f)});
async function dbl(code,src){kev('keyup',code);kev('keydown',code);await stepWait();kev('keyup',code);kev('keydown',code);(HOLD[code]||(HOLD[code]=new Set())).add(src)}
// ---------- 狀態 ----------
const G=n=>{try{return eval(n)}catch(e){return undefined}};
function ctx(){const md=G('mode'),ui=G('UI'),pa=G('paused'),pw=G('pauseWhy');if(md===undefined||!G('SAVE'))return 'load';
  if(md==='play'&&!pa&&!(ui&&ui.kind))return 'play';
  if(md==='play'&&pa&&pw==='esc')return 'pause';
  if(ui&&ui.kind==='bag')return 'bag';if(ui&&ui.kind==='char')return 'char';if(ui&&/^(rr|inh|up)$/.test(ui.kind))return 'smith';if(ui&&ui.kind)return 'ui';
  if(md==='map')return 'map';return 'menu'}
const hero=()=>{const S=G('SAVE');return S&&(S.hero==='bard'||S.hero==='archer')?S.hero:'kudas'};
const face=()=>{const s=G('S0');return s&&s.P&&s.P.face<0?'ArrowLeft':'ArrowRight'};
// ---------- 樣式 ----------
const css=`
html,body{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
html.mobt #wrap{display:block!important}html.mobt #m21rec,html.mobt #m21toast{pointer-events:none}html.mobt #m21rec{left:50%!important;top:48px!important;transform:translateX(-50%)}html.mobt #c{position:absolute}
html:not(.mobt) #mob{display:none!important}
#mobrot{position:fixed;inset:0;z-index:50;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#0d0906;color:#f3dfb0;font:bold 22px NSans,sans-serif;text-align:center}
#mobrot .ph{width:70px;height:120px;border:4px solid #d6ac54;border-radius:12px;animation:mrot 2.2s ease-in-out infinite}
@keyframes mrot{0%,25%{transform:rotate(0)}55%,100%{transform:rotate(-90deg)}}
html.mobt.rot #mobrot{display:flex}
#sa{position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
#mob{position:fixed;inset:0;pointer-events:none;z-index:20;font-family:NSans,sans-serif;font-weight:bold}
#mob .b{position:absolute;pointer-events:auto;box-sizing:border-box;border-radius:7px;color:#fff4d6;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;
  background:rgba(40,26,14,.78);border:2px solid #d6ac54;box-shadow:inset 0 0 0 2px rgba(92,62,28,.9),inset 0 0 0 4px rgba(60,40,18,.7),inset 0 -6px 0 3px rgba(0,0,0,.25),0 2px 0 rgba(0,0,0,.5);text-shadow:0 1px 0 #000,1px 0 0 #000,-1px 0 0 #000,0 -1px 0 #000}
#mob .b small{font-size:.62em;color:#e8d2a0;opacity:.9;margin-top:1px}
#mob .b.dn{background:rgba(150,104,40,.92);border-color:#ffe08a;transform:translateY(1px);box-shadow:inset 0 0 0 2px rgba(255,220,140,.6),inset 0 0 0 5px rgba(120,82,36,.8),0 0 10px rgba(255,210,120,.6)}
#mob .b.big{border-radius:50%;border-width:3px;background:rgba(120,30,20,.8);border-color:#ffcf6a}
#mob .b.big.dn{background:rgba(200,70,40,.95)}
#mob .b.sys{background:rgba(20,14,10,.72);border-color:#9c7a3c}
#mob .b.hot{border-color:#ff6a5a;color:#ffd0c8}
#mob .b.on{border-color:#8fe08f}
#mob .b .cd{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);border-radius:0 0 5px 5px;pointer-events:none}
#mob.side .b{background:rgba(40,26,14,.5)}#mob.side .b.big{background:rgba(120,30,20,.55)}#mob.side .b.sys{background:rgba(20,14,10,.6)}
#mob .pad{position:absolute;pointer-events:auto;border-radius:50%;background:radial-gradient(circle,rgba(60,40,20,.55) 0 30%,rgba(30,20,10,.45) 31% 62%,rgba(20,14,8,.35) 63%);border:2px solid rgba(214,172,84,.8);box-shadow:inset 0 0 0 3px rgba(92,62,28,.6),inset 0 0 0 7px rgba(40,26,14,.4)}
#mob .pad i{position:absolute;width:0;height:0;border:solid transparent;opacity:.75}
#mob .pad .nub{position:absolute;border-radius:50%;background:rgba(214,172,84,.55);border:2px solid #ffe08a;pointer-events:none;box-shadow:inset 0 0 0 3px rgba(120,82,36,.6)}
#mob .panel{position:absolute;pointer-events:none;background:linear-gradient(#1a120b,#0d0906);border-top:2px solid #6b5026;box-shadow:inset 0 3px 0 #2c1f12,inset 0 6px 0 #1f160d}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
let vm=document.querySelector('meta[name=viewport]');if(!vm){vm=document.createElement('meta');vm.name='viewport';document.head.appendChild(vm)}
vm.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
const root=document.createElement('div');root.id='mob';document.body.appendChild(root);
const rot=document.createElement('div');rot.id='mobrot';rot.innerHTML='<div class="ph"></div><div>請把手機轉成橫向</div><div style="font-size:15px;opacity:.7">艾爾琳之旅用橫向畫面遊玩</div>';document.body.appendChild(rot);
const saP=document.createElement('div');saP.id='sa';document.body.appendChild(saP);
// 安全區（iPhone 瀏海、Home 條）。測試可用 ?sa=上,右,下,左
let SA={t:0,r:0,b:0,l:0};
function readSA(){const q=QM.get('sa');if(q){const v=q.split(',').map(Number);SA={t:v[0]||0,r:v[1]||0,b:v[2]||0,l:v[3]||0};return}
  const c=getComputedStyle(saP);SA={t:parseFloat(c.paddingTop)||0,r:parseFloat(c.paddingRight)||0,b:parseFloat(c.paddingBottom)||0,l:parseFloat(c.paddingLeft)||0}}
document.documentElement.classList.toggle('mobt',IM==='touch');
const panel=document.createElement('div');panel.className='panel';root.appendChild(panel);
const cv=document.getElementById('c');
// ---------- 按鈕定義 ----------
// k：按住的鍵（可以多個），dbl：連按兩下的方向（'face' 或鍵名），fn：自訂
const BT={
 atkK:{t:'連斬',s:'J',k:['KeyJ'],big:1},atkB:{t:'連擊',s:'J',k:['KeyJ'],big:1},
 jump:{t:'跳躍',s:'Space',k:['Space']},
 stabK:{t:'刺擊',s:'K',k:['KeyK']},swordK:{t:'大劍',s:'L',k:['KeyL']},
 triB:{t:'三連音',s:'K',k:['KeyK']},melB:{t:'旋律',s:'L',k:['KeyL']},
 dodgeB:{t:'後跳',s:'Shift',k:['ShiftLeft']},ultB:{t:'大招',s:'K+L',k:['KeyK','KeyL']},emoteB:{t:'演奏',s:'H',k:['KeyH']},
 chgK:{t:'肩撞',s:'→→',dbl:'face',cd:'chg'},stpK:{t:'踱地',s:'↓↓',dbl:'ArrowDown',cd:'stp'},
 slideB:{t:'滑行',s:'→→',dbl:'face'},kneelB:{t:'跪彈',s:'↓↓',dbl:'ArrowDown'},
 sumK:{t:'召喚',s:'V',k:['KeyV']},sumB:{t:'召喚',s:'V',k:['KeyV']},
 atkA:{t:'射擊',s:'J',k:['KeyJ'],big:1},wingA:{t:'翼矛',s:'K',k:['KeyK']},fireA:{t:'烈焰箭',s:'L',k:['KeyL']},rainA:{t:'箭雨',s:'↓K',k:['ArrowDown','KeyK']},flipA:{t:'扇射',s:'↓L',k:['ArrowDown','KeyL']},
 rollA:{t:'翻滾',s:'Shift',k:['ShiftLeft']},snipeA:{t:'狙擊',s:'K+L',k:['KeyK','KeyL']},ultA:{t:'絕招',s:'J+K',k:['KeyJ','KeyK']},sumA:{t:'援助',s:'V',k:['KeyV']},
 use:{t:'互動',s:'E',k:['KeyE'],sys:1},pause:{t:'暫停',s:'Esc',k:['Escape'],sys:1},bagO:{t:'背包',s:'I',k:['KeyI'],sys:1},
 charO:{t:'角色',s:'C',k:['KeyC'],sys:1},untf:{t:'解變身',s:'T',k:['KeyT'],sys:1,hot:1},
 rec:{t:'錄影',s:'F9',k:['F9'],sys:1},mute:{t:'靜音',s:'M',k:['KeyM'],sys:1},
 ok:{t:'確定',s:'Enter',k:['Enter'],big:1},j:{t:'J',s:'選擇',k:['KeyJ']},back:{t:'返回',s:'Esc',k:['Escape']},tab:{t:'切換',s:'Tab',k:['Tab']},
 toMap:{t:'回地圖',s:'Q',k:['KeyQ'],hot:1},musD:{t:'音樂－',s:'[',k:['BracketLeft']},musU:{t:'音樂＋',s:']',k:['BracketRight']},sfxD:{t:'音效－',s:';',k:['Semicolon']},sfxU:{t:'音效＋',s:"'",k:['Quote']},
 sell:{t:'賣掉',s:'X',k:['KeyX']},dis:{t:'分解',s:'C',k:['KeyC']},sellG:{t:'賣綠色',s:'G',k:['KeyG']},tfU:{t:'搗蛋鬼',s:'U',k:['KeyU']},tfY:{t:'惡魔貓',s:'Y',k:['KeyY']},bagC:{t:'關閉',s:'I',k:['KeyI']},
 clr:{t:'清除',s:'X',k:['KeyX']},uiSz:{t:'按鍵大小',s:'中',fn:()=>uiSet('sz')},uiOp:{t:'按鍵濃淡',s:'中',fn:()=>uiSet('op')},juke:{t:'換曲',s:'B',k:['KeyB']},mapBag:{t:'背包',s:'I',k:['KeyI']},mapChar:{t:'角色',s:'C',k:['KeyC']},
};
const EL={};
function mkBtn(id){const d=BT[id];const e=document.createElement('div');e.className='b'+(d.big?' big':'')+(d.sys?' sys':'')+(d.hot?' hot':'');e.dataset.id=id;
  e.innerHTML=`<span>${d.t}</span><small>${d.s}</small>`+(d.cd?'<div class="cd"></div>':'');root.appendChild(e);
  const ptrs=new Set();const src='b:'+id;
  const down=ev=>{ev.preventDefault();ev.stopPropagation();try{e.setPointerCapture(ev.pointerId)}catch(_){}if(ptrs.has(ev.pointerId))return;ptrs.add(ev.pointerId);if(ptrs.size>1)return;e.classList.add('dn');buzz();if(d.fn){d.fn();return}
    if(d.dbl)dbl(d.dbl==='face'?(PAD.dir.h||face()):d.dbl,src);else for(const k of d.k)kDown(src,k)};
  const up=ev=>{if(!ptrs.delete(ev.pointerId)||ptrs.size)return;e.classList.remove('dn');if(d.fn)return;const rel=()=>{if(d.dbl){const c=d.dbl==='face'?null:d.dbl;for(const k of c?[c]:['ArrowLeft','ArrowRight'])kUp(src,k)}else for(const k of d.k)kUp(src,k)};setTimeout(rel,d.dbl?140:40)};
  e.addEventListener('pointerdown',down);e.addEventListener('pointerup',up);e.addEventListener('pointercancel',up);e.addEventListener('lostpointercapture',up);
  EL[id]=e;return e}
for(const id in BT)mkBtn(id);
// ---------- 方向盤（8 方向，放開再按＝連按） ----------
const PAD={el:document.createElement('div'),nub:document.createElement('div'),id:null,cx:0,cy:0,r:60,dir:{h:null,v:null}};
PAD.el.className='pad';PAD.nub.className='nub';PAD.el.appendChild(PAD.nub);root.appendChild(PAD.el);
for(const a of ['u','d','l','r']){const i=document.createElement('i');i.dataset.a=a;PAD.el.appendChild(i)}
function padSet(h,v){const D=PAD.dir;if(D.h!==h){if(D.h)kUp('pad',D.h);if(h)kDown('pad',h);D.h=h}if(D.v!==v){if(D.v)kUp('pad',D.v);if(v)kDown('pad',v);D.v=v}}
function padMove(x,y){const dx=x-PAD.cx,dy=y-PAD.cy,r=PAD.r,d=Math.hypot(dx,dy);let h=null,v=null;
  if(d>r*0.28){const a=Math.atan2(dy,dx);const s=Math.PI/8;// 8 等分
    if(Math.abs(a)<3*s)h='ArrowRight';else if(Math.abs(a)>5*s)h='ArrowLeft';if(a>s&&a<7*s)v='ArrowDown';else if(a<-s&&a>-7*s)v='ArrowUp'}
  padSet(h,v);const k=Math.min(1,d/r)*r*0.55;const nb=PAD.nub,ns=PAD.ns;nb.style.left=(PAD.lx+(d?dx/d*k:0)-ns/2)+'px';nb.style.top=(PAD.ly+(d?dy/d*k:0)-ns/2)+'px'}
function padCenter(){const nb=PAD.nub,ns=PAD.ns;nb.style.left=(PAD.lx-ns/2)+'px';nb.style.top=(PAD.ly-ns/2)+'px'}
PAD.el.addEventListener('pointerdown',e=>{e.preventDefault();if(PAD.id!==null)return;PAD.id=e.pointerId;try{PAD.el.setPointerCapture(e.pointerId)}catch(_){}padMove(e.clientX,e.clientY)});
PAD.el.addEventListener('pointermove',e=>{if(e.pointerId===PAD.id)padMove(e.clientX,e.clientY)});
const padEnd=e=>{if(e.pointerId!==PAD.id)return;PAD.id=null;padSet(null,null);padCenter()};
PAD.el.addEventListener('pointerup',padEnd);PAD.el.addEventListener('pointercancel',padEnd);PAD.el.addEventListener('lostpointercapture',padEnd);
let vib=true;function buzz(){if(!vib)return;try{if(BR&&BR.vibrate)BR.vibrate(12);else if(navigator.vibrate)navigator.vibrate(12)}catch(e){}}
// ---------- M2.5e 戰鬥操作層：左半邊浮動搖桿＋右下扇形技能 ----------
// 整層是一張預先畫好的畫布，只在按下／放開、冷卻或能量變化時重畫；搖桿只用 transform 移動，不觸發版面重排
const UIO=(()=>{let o={};try{o=JSON.parse(localStorage.getItem('erinn_mobui')||'{}')}catch(e){}return {sz:[0,1,2].includes(o.sz)?o.sz:1,op:[0,1,2].includes(o.op)?o.op:1}})();
const SZK=[0.86,1,1.14],OPK=[0.5,0.74,0.94];
function uiSet(k){UIO[k]=(UIO[k]+1)%3;try{localStorage.setItem('erinn_mobui',JSON.stringify(UIO))}catch(e){}G('m21Toast')((k==='sz'?'按鍵大小：':'按鍵濃淡：')+(k==='sz'?['小','中','大']:['淡','中','濃'])[UIO[k]]);PL=null}
const hc=document.createElement('canvas');hc.id='mobc';root.appendChild(hc);const hx=hc.getContext('2d');
const JB=document.createElement('canvas'),JK=document.createElement('canvas');JB.className=JK.className='mj';root.appendChild(JB);root.appendChild(JK);
st.textContent+=`#mobc{position:absolute;left:0;top:0;pointer-events:none;display:none}#mob .mj{position:absolute;left:0;top:0;pointer-events:none;display:none;will-change:transform}
#mob.play #mobc,#mob.play .mj{display:block}`;
// 每個英雄的配置：大攻擊鍵＋內圈 4 顆（180°→264°，左→上）＋外圈（角度、種類）＋小按鈕
const PDEF={
 kudas:{atk:'atkK',r1:['jump','stabK','swordK'],r2:[['chgK',178],['stpK',204],['sumK',236,'sum']],small:['use','untf']},
 bard:{atk:'atkB',r1:['dodgeB','triB','melB'],r2:[['jump',175],['slideB',199],['kneelB',223],['ultB',249,'ult'],['sumB',277,'sum']],small:['emoteB','use','untf']},
 archer:{atk:'atkA',r1:['rollA','wingA','fireA'],r2:[['rainA',176],['flipA',200],['snipeA',226,'ult'],['ultA',254,'ult'],['sumA',280,'sum']],small:['jump','use']}};
const TOPI=['pause','bagO','charO','rec','mute'];
const LBL={atkK:'連斬',atkB:'連擊',jump:'跳躍',stabK:'刺擊',swordK:'大劍',chgK:'肩撞',stpK:'踱地',sumK:'召喚',triB:'三連音',melB:'旋律',dodgeB:'後跳',ultB:'大招',slideB:'滑行',kneelB:'跪彈',sumB:'召喚',emoteB:'演奏',atkA:'射擊',wingA:'翼矛',fireA:'烈焰',rainA:'箭雨',flipA:'扇射',rollA:'翻滾',snipeA:'狙擊',ultA:'絕招',sumA:'援助',use:'互動',untf:'解變身'};
const SUBL={chgK:'→→',stpK:'↓↓',slideB:'→→',kneelB:'↓↓',sumK:'詩人',sumB:'苦達',rainA:'↓K',flipA:'↓L',snipeA:'K+L',ultA:'J+K'};
const BUFOK={jump:1,stabK:1,swordK:1,triB:1,melB:1,dodgeB:1,ultB:1,sumK:1,sumB:1,wingA:1,fireA:1,rainA:1,flipA:1,rollA:1,snipeA:1,ultA:1,sumA:1};
let PL=null,hudSig='',hudDirty=true,hudRaf=0;const PRESS=new Map();// id -> 指頭數
function playLayout(){const vw=L.vw,vh=L.vh,hr=hero(),D=PDEF[hr],S=G('SAVE');
  const base=L.uFix?L.uFix:L.mode==='panel'?Math.min((vh-L.gh)*0.2,vw*0.075,vh*0.13):Math.min(vh*0.125,vw*0.07);
  const u=Math.min(62,Math.max(34,base))*SZK[UIO.sz],m=Math.max(8,u*0.16),gap=u*0.16;
  const Ra=u*0.98,Rs=u*0.56,Ox=vw-SA.r-m-Ra,Oy=vh-SA.b-m-Ra,B=[];
  const add=(id,x,y,r,kind)=>B.push({id,x,y,r,w:2*r,h:2*r,kind,vis:true});
  add(D.atk,Ox,Oy,Ra,'atk');const R1=Ra+gap+Rs;
  D.r1.forEach((id,i)=>{const a=(180+i*45)*Math.PI/180;add(id,Ox+R1*Math.cos(a),Oy+R1*Math.sin(a),Rs,'sk')});
  for(const [id,deg,kind] of D.r2){const r=kind==='ult'?u*0.68:kind==='sum'?u*0.6:Rs,R2=R1+Rs+gap+r,a=deg*Math.PI/180;add(id,Ox+R2*Math.cos(a),Oy+R2*Math.sin(a),r,kind||'sk')}
  // 上方小圖示（暫停、背包、角色、錄影、靜音）：右上角一排
  // 摺疊（左右有黑邊）放左側黑邊頂端；展開（下方控制區）放控制區頂端中央；都不行才放右上角，不蓋住遊戲畫面
  const is=Math.max(30,u*0.6),ig=Math.max(6,gap);let iBot;const icon=(id,x,y)=>B.push({id,x,y,r:is/2,w:is,h:is,kind:'icon',vis:true});
  const TI=TOPI.filter(id=>id!=='rec'||CANREC);
  // 左黑邊（扣掉瀏海）放得下就放左邊；放不下改右黑邊；再不行放上方黑邊或右上角
  const side=L.mode==='side',gutL=side?(L.gx||0)-SA.l:0,gutR=side?vw-(L.gx||0)-L.gw-SA.r:0,colsL=Math.floor((gutL-ig)/(is+ig)),colsR=Math.floor((gutR-ig)/(is+ig));
  let cols=0,iconsR=false;const ty=Math.max(SA.t,L.top0||0)+ig;
  const grid=(x0g,gut,c)=>{const x0=x0g+(gut-(c*is+(c-1)*ig))/2+is/2;TI.forEach((id,k)=>icon(id,x0+(k%c)*(is+ig),ty+is/2+Math.floor(k/c)*(is+ig)));return ty+Math.ceil(TI.length/c)*(is+ig)};
  if(colsL>=1&&(colsL>=2||TI.length*(is+ig)<vh*0.5)){cols=Math.min(colsL,3);iBot=grid(SA.l,gutL,cols)}
  else if(colsR>=2){cols=Math.min(colsR,3);iconsR=true;iBot=grid(L.gx+L.gw,gutR,cols)}
  else if(L.mode==='panel'&&vh-L.gh-L.top0>is*3){const y=L.top0+L.gh+m+is/2,w=TI.length*is+(TI.length-1)*ig;let x=(vw-w)/2+is/2;for(const id of TI){icon(id,x,y);x+=is+ig}iBot=0}
  else if(L.mode==='side'&&vh-SA.b-(L.gy+L.gh)>is*1.3){const y=(L.gy+L.gh+vh-SA.b)/2,w=TI.length*is+(TI.length-1)*ig;let x=(vw-w)/2+is/2;for(const id of TI){icon(id,x,y);x+=is+ig}iBot=0}
  else{let ix=vw-SA.r-m-is/2;for(const id of TI){icon(id,ix,ty+is/2);ix-=is+ig}iBot=ty+is+ig;iconsR=true}
  const iy=0;
  // 小按鈕（演奏、互動、解變身）：扇形上方靠右
  const top=Math.min(...B.filter(b=>b.kind!=='icon').map(b=>b.y-b.r)),rs=u*0.42;const sm=D.small.filter(id=>id!=='untf'||(S&&S.tf));
  if(L.mode==='panel'){const lx=Math.min(...B.filter(b=>b.kind!=='icon').map(b=>b.x-b.r));sm.forEach((id,k)=>add(id,lx-gap*2-rs-k*(2*rs+gap),vh-SA.b-m-rs,rs,'small'))}
  else sm.forEach((id,k)=>{let x=vw-SA.r-m-rs-Math.floor(k/2)*(2*rs+gap),y=top-gap-rs-(k%2)*(2*rs+gap);if(y-rs<(iconsR?iBot:0)){y=top-gap-rs;x=vw-SA.r-m-rs-k*(2*rs+gap)}add(id,x,y,rs,'small')});
  const Rj=u*1.18,jx=SA.l+m+Rj+u*0.3,jy=vh-SA.b-m-Rj-u*0.15;
  PL={u,B,Rj,jx,jy,rx:jx,ry:jy,zx:vw*0.5,zy:iconsR?0:iBot,hr,tf:!!(S&&S.tf),key:vw+'x'+vh+'|'+hr+'|'+(S&&S.tf?1:0)+'|'+UIO.sz};
  const d=Math.min(devicePixelRatio||1,2);hc.width=Math.round(vw*d);hc.height=Math.round(vh*d);hc.style.width=vw+'px';hc.style.height=vh+'px';PL.d=d;
  // 搖桿底座與握把：先畫好兩張小圖，之後只移動
  const bw=Math.ceil(Rj*2+8);JB.width=JB.height=Math.round(bw*d);JB.style.width=JB.style.height=bw+'px';const bx=JB.getContext('2d');bx.setTransform(d,0,0,d,0,0);
  const c=bw/2;let g=bx.createRadialGradient(c,c,Rj*0.2,c,c,Rj);g.addColorStop(0,'rgba(60,40,20,.35)');g.addColorStop(1,'rgba(20,14,8,.55)');bx.fillStyle=g;bx.beginPath();bx.arc(c,c,Rj,0,7);bx.fill();
  ring(bx,c,c,Rj-1,2.5,'rgba(214,172,84,.9)');ring(bx,c,c,Rj-5,1.5,'rgba(92,62,28,.9)');ring(bx,c,c,Rj*0.62,1,'rgba(214,172,84,.35)');
  for(let i=0;i<4;i++){const a=i*Math.PI/2;bx.save();bx.translate(c+Math.cos(a)*Rj*0.8,c+Math.sin(a)*Rj*0.8);bx.rotate(a);bx.fillStyle='rgba(255,224,138,.85)';bx.beginPath();bx.moveTo(Rj*0.1,0);bx.lineTo(-Rj*0.06,-Rj*0.09);bx.lineTo(-Rj*0.06,Rj*0.09);bx.fill();bx.restore()}
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;knot(bx,c+Math.cos(a)*(Rj-1),c+Math.sin(a)*(Rj-1),3.5)}
  const kr=Rj*0.42,kw=Math.ceil(kr*2+6);JK.width=JK.height=Math.round(kw*d);JK.style.width=JK.style.height=kw+'px';const kx=JK.getContext('2d');kx.setTransform(d,0,0,d,0,0);const k2=kw/2;
  g=kx.createRadialGradient(k2-kr*0.3,k2-kr*0.3,kr*0.1,k2,k2,kr);g.addColorStop(0,'rgba(255,230,160,.95)');g.addColorStop(1,'rgba(170,120,50,.9)');kx.fillStyle=g;kx.beginPath();kx.arc(k2,k2,kr,0,7);kx.fill();
  ring(kx,k2,k2,kr-1,2,'#ffe08a');ring(kx,k2,k2,kr*0.6,1.5,'rgba(110,70,30,.7)');PL.bw=bw;PL.kw=kw;joyPaint();hudDirty=true}
function ring(c,x,y,r,w,col){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke()}
function knot(c,x,y,s){c.fillStyle='#ffe08a';c.beginPath();c.moveTo(x,y-s);c.lineTo(x+s,y);c.lineTo(x,y+s);c.lineTo(x-s,y);c.closePath();c.fill();c.fillStyle='#5c3e1c';c.fillRect(x-s*0.3,y-s*0.3,s*0.6,s*0.6)}
// ---------- 各按鈕狀態：冷卻（灰色扇形）、能量環（金色）、能不能用 ----------
function bState(id){const s=G('S0'),P=s&&s.P;const o={cd:0,ring:-1,ok:true,ready:false};if(!P)return o;const t=s.t,GSx=G('GS')||{},mv=1-(GSx.mvcd||0);
  const RH=G('RHMAX')||5,FM=G('FOOD_MAX')||3;
  try{if(id==='chgK')o.cd=Math.min(1,Math.max(0,(P.chgCD||0)/(G('CHG').cd*mv)));
    else if(id==='stpK')o.cd=Math.min(1,Math.max(0,(P.stpCD||0)/(G('STP').cd*mv)));
    else if(id==='stabK'){const c=G('STAB_COST')||2;o.ring=Math.min(1,P.rh/c);o.ok=P.rh>=c}
    else if(id==='triB'){o.ring=Math.min(1,P.rh/2);o.ok=P.rh>=2}
    else if(id==='swordK'||id==='melB'){o.ring=Math.min(1,P.rh/3);if(id==='swordK'&&P.rh<3)o.cd=Math.max(0,P.slamCD||0)/2.2}
    else if(id==='ultB'){const UM=(G('UE')||{max:100}).max,UC=(G('BD')||{ult:8}).ult;o.ring=Math.min(1,(P.ue||0)/UM);o.cd=Math.max(0,Math.min(1,(P.ultCD||0)/UC));o.ok=(P.ue||0)>=UM&&!(P.ultCD>0);o.ready=o.ok}   // W2：樂章量表
    else if(id==='wingA'||id==='fireA'||id==='rainA'||id==='flipA'||id==='rollA'){const A=G('__ar').AR,M={wingA:['wgCD',A.wing.cd*mv],fireA:['fiCD',A.fire.cd*mv],rainA:['rnCD',A.rain.cd*mv],flipA:['flCD',A.flip.cd*mv],rollA:['rlCD',A.roll.cd]}[id];o.cd=Math.min(1,Math.max(0,(P[M[0]]||0)/M[1]));o.ok=o.cd<=0}
    else if(id==='snipeA'){const A=G('__ar').AR;o.ring=Math.min(1,P.rh/A.snipe.cost);o.cd=Math.min(1,Math.max(0,(P.snCD||0)/(A.snipe.cd*mv)));o.ok=P.rh>=A.snipe.cost&&o.cd<=0;o.ready=o.ok}
    else if(id==='ultA'){const D=G('__ar').DRG;o.ring=Math.min(1,(P.dragon||0)/D.max);o.ok=o.ring>=1;o.ready=o.ok}
    else if(id==='sumA'){o.ring=Math.min(1,s.food/FM);const busy=!!(s.bard||s.ally||s.arA)||t<=(s.allyCD||0);o.ok=s.food>=FM&&!busy;o.ready=o.ok}
    else if(id==='sumK'||id==='sumB'){o.ring=Math.min(1,s.food/FM);const busy=id==='sumK'?!!(s.bard||s.arA):(!!(s.ally||s.arA)||t<=(s.allyCD||0));o.ok=s.food>=FM&&!busy;o.ready=o.ok}}catch(e){}
  return o}
const q=v=>Math.round(v*24);
function hudRefresh(force){const S=G('SAVE');const key=L.vw+'x'+L.vh+'|'+hero()+'|'+(S&&S.tf?1:0)+'|'+UIO.sz;if(!PL||PL.key!==key||force){hudReleaseAll();playLayout()}
  const R=G('REC');let sig=(R&&R.on?1:0)+'|'+(S&&S.opt&&(S.opt.mus||S.opt.sfx)?1:0)+'|'+UIO.op;for(const b of PL.B)if(b.kind!=='icon'){const o=bState(b.id);sig+='|'+q(o.cd)+','+q(Math.max(0,o.ring))+','+(o.ok?1:0)}
  if(sig!==hudSig){hudSig=sig;hudDirty=true}if(hudDirty)hudPaint()}
function hudPaintSoon(){hudDirty=true;if(!hudRaf)hudRaf=requestAnimationFrame(()=>{hudRaf=0;if(hudDirty&&PL)hudPaint()})}
function hudPaint(){hudDirty=false;const c=hx,d=PL.d,A=OPK[UIO.op];c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,L.vw,L.vh);
  const R=G('REC'),S=G('SAVE');
  for(const b of PL.B){if(!b.vis)continue;const dn=PRESS.has(b.id);c.save();c.translate(b.x,b.y);if(dn)c.scale(0.92,0.92);
    if(b.kind==='icon'){drawIcon(c,b,dn,A,R,S);c.restore();continue}
    const o=bState(b.id),r=b.r;c.globalAlpha=dn?1:A;
    const col={atk:['#8c2416','#3c0c06'],ult:['#5a2a8c','#1e0c34'],sum:['#1f6a5c','#082420'],sk:['#6a4520','#24160a'],small:['#3c2c1c','#140e08']}[b.kind];
    const g=c.createRadialGradient(-r*0.3,-r*0.35,r*0.1,0,0,r);g.addColorStop(0,dn?'#ffd27a':col[0]);g.addColorStop(1,col[1]);c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,7);c.fill();
    if(o.cd>0){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.moveTo(0,0);c.arc(0,0,r,-Math.PI/2,-Math.PI/2+o.cd*Math.PI*2);c.closePath();c.fill()}
    if(!o.ok){c.fillStyle='rgba(0,0,0,.42)';c.beginPath();c.arc(0,0,r,0,7);c.fill()}
    // 雙層金邊＋凱爾特結飾
    ring(c,0,0,r-1,b.kind==='atk'?3:2,dn?'#fff2c0':(o.ready?'#ffe9a0':'#d6ac54'));ring(c,0,0,r-(b.kind==='atk'?5:4),1.5,'rgba(60,40,18,.9)');
    if(b.kind==='atk'||b.kind==='ult'||b.kind==='sum')for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;knot(c,Math.cos(a)*(r-1),Math.sin(a)*(r-1),Math.max(2.5,r*0.08))}
    if(o.ring>=0){c.lineWidth=Math.max(2.5,r*0.09);c.strokeStyle='rgba(0,0,0,.55)';c.beginPath();c.arc(0,0,r+c.lineWidth*0.6,0,7);c.stroke();
      c.strokeStyle=o.ring>=1?(b.kind==='ult'?'#e9a0ff':b.kind==='sum'?'#8fffd0':'#ffd76a'):'#c9963c';c.beginPath();c.arc(0,0,r+c.lineWidth*0.6,-Math.PI/2,-Math.PI/2+o.ring*Math.PI*2);c.stroke()}
    if(o.ready){c.globalAlpha=0.35*(dn?1:A);ring(c,0,0,r+Math.max(5,r*0.18),3,b.kind==='ult'?'#e9a0ff':'#8fffd0');c.globalAlpha=dn?1:A}
    const lb=LBL[b.id]||b.id,fs=b.kind==='atk'?r*0.5:b.kind==='small'?r*0.52:Math.min(r*0.58,r*1.5/Math.max(2,lb.length));
    c.font=`bold ${Math.round(fs)}px NSans,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=3;c.strokeStyle='#000';
    const sub=SUBL[b.id],ty=sub?-fs*0.25:0;c.strokeText(lb,0,ty);c.fillStyle=o.ok?'#fff4d6':'#b8a888';c.fillText(lb,0,ty);
    if(sub){c.font=`bold ${Math.round(fs*0.62)}px NSans,sans-serif`;c.lineWidth=2.5;c.strokeText(sub,0,fs*0.62);c.fillStyle='#e8d2a0';c.fillText(sub,0,fs*0.62)}
    c.restore()}}
function drawIcon(c,b,dn,A,R,S){const s=b.w/2;c.globalAlpha=dn?1:Math.min(1,A+0.08);c.fillStyle=dn?'rgba(150,104,40,.95)':'rgba(24,16,10,.78)';
  c.beginPath();c.moveTo(-s+5,-s);c.lineTo(s-5,-s);c.lineTo(s,-s+5);c.lineTo(s,s-5);c.lineTo(s-5,s);c.lineTo(-s+5,s);c.lineTo(-s,s-5);c.lineTo(-s,-s+5);c.closePath();c.fill();
  c.strokeStyle=dn?'#fff2c0':'#d6ac54';c.lineWidth=2;c.stroke();c.strokeStyle='rgba(92,62,28,.9)';c.lineWidth=1;c.strokeRect(-s+4,-s+4,2*s-8,2*s-8);
  const k=s*0.5,gold='#ffe08a';c.fillStyle=gold;c.strokeStyle=gold;c.lineWidth=Math.max(2,s*0.16);c.lineCap='round';
  if(b.id==='pause'){c.fillRect(-k*0.6,-k*0.75,k*0.42,k*1.5);c.fillRect(k*0.18,-k*0.75,k*0.42,k*1.5)}
  else if(b.id==='bagO'){c.beginPath();c.arc(0,k*0.25,k*0.72,0,7);c.fill();c.fillRect(-k*0.35,-k*0.85,k*0.7,k*0.5);c.fillStyle='#5c3e1c';c.fillRect(-k*0.45,-k*0.22,k*0.9,k*0.18)}
  else if(b.id==='charO'){c.beginPath();c.arc(0,-k*0.38,k*0.42,0,7);c.fill();c.beginPath();c.arc(0,k*0.95,k*0.85,Math.PI,0);c.fill()}
  else if(b.id==='rec'){const on=R&&R.on;c.fillStyle=on?'#ff5040':'#e04030';if(on)c.fillRect(-k*0.5,-k*0.5,k,k);else{c.beginPath();c.arc(0,0,k*0.6,0,7);c.fill()}}
  else if(b.id==='mute'){const off=S&&S.opt&&!S.opt.mus&&!S.opt.sfx;c.beginPath();c.moveTo(-k*0.8,-k*0.3);c.lineTo(-k*0.35,-k*0.3);c.lineTo(k*0.15,-k*0.8);c.lineTo(k*0.15,k*0.8);c.lineTo(-k*0.35,k*0.3);c.lineTo(-k*0.8,k*0.3);c.closePath();c.fill();
    c.beginPath();if(off){c.moveTo(k*0.4,-k*0.35);c.lineTo(k*0.9,k*0.35);c.moveTo(k*0.9,-k*0.35);c.lineTo(k*0.4,k*0.35)}else c.arc(k*0.2,0,k*0.55,-0.8,0.8);c.stroke()}}
// ---------- 觸控：視窗層攔截（不經過遊戲畫布，避免誤點到畫面上的背包熱區） ----------
const PT=new Map();const JOY={id:null,bx:0,by:0,h:null,v:null};let audioOK=false;
function hit(x,y){let best=null,bd=9;for(const b of PL.B){if(!b.vis)continue;let dd;if(b.kind==='icon'){if(Math.abs(x-b.x)>b.w*0.6||Math.abs(y-b.y)>b.h*0.6)continue;dd=0.5}else{dd=Math.hypot(x-b.x,y-b.y)/b.r;if(dd>(b.kind==='atk'?1.18:1.12))continue}if(dd<bd){bd=dd;best=b}}return best}
function hudOn(){return IM==='touch'&&root.classList.contains('play')&&PL}
function bDown(b,pid){const n=(PRESS.get(b.id)||0)+1;PRESS.set(b.id,n);if(n>1)return;buzz();hudPaintSoon();const d=BT[b.id],src='h:'+b.id;
  if(d.dbl){dbl(d.dbl==='face'?(JOY.h||PAD.dir.h||face()):d.dbl,src);return}
  const s=G('S0'),busy=s&&s.P&&s.P.act;for(const k of d.k)kDown(src,k);if(BUFOK[b.id]&&busy)bufArm(b)}
function bUp(b){const n=(PRESS.get(b.id)||1)-1;if(n>0){PRESS.set(b.id,n);return}PRESS.delete(b.id);hudPaintSoon();const d=BT[b.id],src='h:'+b.id;
  setTimeout(()=>{if(d.dbl){const c=d.dbl==='face'?null:d.dbl;for(const k of c?[c]:['ArrowLeft','ArrowRight'])kUp(src,k)}else for(const k of d.k)kUp(src,k)},d.dbl?140:40)}
// 輸入緩衝：出招中按的技能，若這一招結束時還沒接上，就在 0.35 秒內自動補按一次
let BUF=null;
function bufArm(b){const s=G('S0');BUF={b,t:performance.now(),act:s.P.act};requestAnimationFrame(bufTick)}
function bufTick(){if(!BUF)return;const s=G('S0'),P=s&&s.P;if(!P||performance.now()-BUF.t>350||ctx()!=='play'){BUF=null;return}
  if(P.act&&P.act!==BUF.act){BUF=null;return}
  if(!P.act){const d=BT[BUF.b.id];BUF=null;for(const k of d.k){if(HOLD[k]&&HOLD[k].size){kev('keyup',k);kev('keydown',k)}else{kDown('buf',k);setTimeout(()=>kUp('buf',k),60)}}window.__mobBuf=(window.__mobBuf||0)+1;return}
  requestAnimationFrame(bufTick)}
function joyPaint(){const a=OPK[UIO.op],on=JOY.id!==null;JB.style.opacity=on?Math.min(1,a+0.15):a*0.55;JK.style.opacity=on?1:a*0.7;
  JB.style.transform=`translate3d(${PL.jx-PL.bw/2}px,${PL.jy-PL.bw/2}px,0)`;const kx=on?JOY.kx:PL.jx,ky=on?JOY.ky:PL.jy;JK.style.transform=`translate3d(${kx-PL.kw/2}px,${ky-PL.kw/2}px,0)`}
function joySet(h,v){if(JOY.h!==h){if(JOY.h)kUp('joy',JOY.h);if(h)kDown('joy',h);JOY.h=h}if(JOY.v!==v){if(JOY.v)kUp('joy',JOY.v);if(v)kDown('joy',v);JOY.v=v}}
function joyMove(x,y){const R=PL.Rj;let dx=x-PL.jx,dy=y-PL.jy,dd=Math.hypot(dx,dy);
  if(dd>R*1.15){const k=(dd-R*1.15)/dd;PL.jx+=dx*k;PL.jy+=dy*k;dx=x-PL.jx;dy=y-PL.jy;dd=Math.hypot(dx,dy)}// 手指拉太遠時底座跟著走
  const kd=Math.min(dd,R*0.78);JOY.kx=PL.jx+(dd?dx/dd*kd:0);JOY.ky=PL.jy+(dd?dy/dd*kd:0);
  let h=null,v=null;if(dd>R*0.22){const a=Math.atan2(dy,dx),s=Math.PI/8,hy=JOY.h||JOY.v?0.09:0;// 8 方向，邊界加一點遲滯免得抖
    if(Math.abs(a)<3*s+hy*(JOY.h==='ArrowRight'?1:-1))h='ArrowRight';else if(Math.abs(a)>5*s-hy*(JOY.h==='ArrowLeft'?1:-1))h='ArrowLeft';
    if(a>s-hy*(JOY.v==='ArrowDown'?1:-1)&&a<7*s+hy*(JOY.v==='ArrowDown'?1:-1))v='ArrowDown';else if(a<-s+hy*(JOY.v==='ArrowUp'?1:-1)&&a>-7*s-hy*(JOY.v==='ArrowUp'?1:-1))v='ArrowUp'}
  joySet(h,v);joyPaint()}
function joyStart(id,x,y){JOY.id=id;const R=PL.Rj,m=8;PL.jx=Math.max(SA.l+R+m,Math.min(L.vw*0.5,x));PL.jy=Math.max(PL.zy+R,Math.min(L.vh-SA.b-R-m,y));JOY.kx=PL.jx;JOY.ky=PL.jy;joyMove(x,y)}
function joyEnd(){JOY.id=null;joySet(null,null);if(PL){PL.jx=PL.rx;PL.jy=PL.ry;joyPaint()}}
function hudReleaseAll(){for(const [id,p] of PT){if(p.b)bUp(p.b)}PT.clear();PRESS.clear();if(JOY.id!==null)joyEnd();BUF=null}
function hudOff(){hudReleaseAll()}
const opt={capture:true,passive:false};
addEventListener('pointerdown',ev=>{if(IM!=='touch'||!hudOn())return;ev.preventDefault();ev.stopImmediatePropagation();
  if(!audioOK){audioOK=true;try{const f=G('unlockAudio');if(f)f()}catch(e){}}
  const x=ev.clientX,y=ev.clientY,b=hit(x,y);
  if(b){PT.set(ev.pointerId,{b});bDown(b);return}
  if(x<PL.zx&&y>PL.zy&&JOY.id===null){PT.set(ev.pointerId,{joy:1});joyStart(ev.pointerId,x,y);return}
  PT.set(ev.pointerId,{})},opt);
addEventListener('pointermove',ev=>{if(!PT.has(ev.pointerId))return;ev.preventDefault();ev.stopImmediatePropagation();if(ev.pointerId===JOY.id){const es=ev.getCoalescedEvents?ev.getCoalescedEvents():[];const e2=es.length?es[es.length-1]:ev;joyMove(e2.clientX,e2.clientY)}},opt);
const pEnd=ev=>{const p=PT.get(ev.pointerId);if(!p)return;ev.preventDefault();ev.stopImmediatePropagation();PT.delete(ev.pointerId);if(p.b)bUp(p.b);if(p.joy&&JOY.id===ev.pointerId)joyEnd()};
addEventListener('pointerup',pEnd,opt);addEventListener('pointercancel',pEnd,opt);
for(const t of ['touchstart','touchmove','touchend'])addEventListener(t,ev=>{if(IM==='touch'&&hudOn()&&ev.cancelable)ev.preventDefault()},opt);
// iOS：聲音要在觸控「放開」時才解鎖；靜音鍵開著也照樣出聲（audioSession）
let auOK=false;const auUnlock=()=>{try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  try{const AC=G('AC');if(!AC)return;if(AC.state!=='running')AC.resume().catch(()=>{});const b=AC.createBuffer(1,1,22050),sN=AC.createBufferSource();sN.buffer=b;sN.connect(AC.destination);sN.start(0);
    if(AC.state==='running'&&!auOK){auOK=true}}catch(e){}};
for(const t of ['touchend','pointerup','click','keydown'])addEventListener(t,auUnlock,{capture:true,passive:true});
// 防止 iOS 兩指縮放、連點放大、整頁回彈
addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});addEventListener('gesturechange',e=>e.preventDefault(),{passive:false});
addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
// 鍵盤／觸控自動切換（iPad 接鍵盤、觸控筆電）
function setIM(m){if(m===IM)return;IM=m;document.documentElement.classList.toggle('mobt',m==='touch');
  if(m==='kb'){hudReleaseAll();for(const k in HOLD){if(HOLD[k].size){HOLD[k].clear();kev('keyup',k)}}}
  curKey='';layout()}
addEventListener('keydown',e=>{if(e.isTrusted&&IM==='touch'&&!BR&&!/^(AudioVolume|Unidentified)/.test(e.key||''))setIM('kb')},true);
addEventListener('pointerdown',e=>{if(e.isTrusted&&(e.pointerType==='touch'||e.pointerType==='pen')&&IM!=='touch')setIM('touch')},true);
addEventListener('contextmenu',ev=>ev.preventDefault(),opt);
// 觸控版提示列：不顯示鍵盤按鍵
{const KH='方向鍵/WASD 移動　J 攻擊　K 心臟刺擊　L 大劍術　Space 跳躍　V 召喚詩人　E 互動　I 背包（暫停）　Esc 暫停';
 const TK='左半邊拖曳移動　連斬　刺擊／大劍　連點兩下方向＝肩撞／踱地　召喚詩人（食物 3/3）　上方暫停鈕',TB='左半邊拖曳移動　連擊　三連音／旋律　後跳　大招（樂章滿）　滑行／跪彈　召喚苦達　演奏',TA='左半邊拖曳移動　射擊（按住蓄力）　翼矛／烈焰箭　箭雨／扇射　翻滾　狙擊（集中 5）　絕招（龍矢滿）　援助';
 const oT=window.T;window.T=function(s,...r){if(s===KH&&IM==='touch')s=hero()==='bard'?TB:hero()==='archer'?TA:TK;return oT.call(this,s,...r)}}

// ---------- 版面 ----------
const SETS={
 play:{kudas:['atkK','jump','stabK','swordK','chgK','stpK','sumK'],bard:['atkB','jump','triB','melB','dodgeB','ultB','slideB','kneelB','sumB','emoteB'],archer:['atkA','jump','wingA','fireA','rainA','flipA','rollA','snipeA','ultA','sumA'],sys:['pause','bagO','charO','use','untf','rec','mute']},
 pause:{a:['ok','back','j','tab'],x:['toMap','musD','musU','sfxD','sfxU','mute','uiSz','uiOp'],sys:['rec']},
 bag:{a:['ok','bagC','j','tab'],x:['sell','dis','sellG','tfU','tfY'],sys:['rec','mute']},
 char:{a:['ok','back','j','tab'],x:[],sys:['rec','mute']},
 smith:{a:['ok','back','j','tab'],x:['clr'],sys:['rec','mute']},
 ui:{a:['ok','back','j','tab'],x:[],sys:['rec','mute']},
 map:{a:['ok','back','j','tab'],x:['mapBag','mapChar','juke'],sys:['rec','mute']},
 menu:{a:['ok','back','j','tab'],x:[],sys:['rec','mute']},
 load:{a:[],x:[],sys:[]}};
// 動作鍵：以右下角為原點的格子（c 從右數、r 從下數）；大按鈕佔 2×2
const GRID={atkK:[0,0,2],jump:[2,0],stabK:[2,1],swordK:[3,0],chgK:[3,1],stpK:[1,2],sumK:[2,2],
  atkB:[0,0,2],triB:[2,1],melB:[3,1],dodgeB:[3,0],ultB:[3,2],slideB:[0,2],kneelB:[1,2],sumB:[2,2],emoteB:[0,3],atkA:[0,0,2],wingA:[2,1],fireA:[3,1],rollA:[3,0],rainA:[0,2],flipA:[1,2],snipeA:[3,2],ultA:[1,3],sumA:[2,2],/* M2.6 預留：詩人表演動作鈕 */
  ok:[0,0,2],back:[2,0],bagC:[2,0],j:[2,1],tab:[3,1]};
let L={},curKey='';
function layout(){const vw=innerWidth,vh0=innerHeight;if(!vw||!vh0)return;readSA();
  const portraitPhone=vh0>vw&&Math.min(vw,vh0)<600;document.documentElement.classList.toggle('rot',IM==='touch'&&portraitPhone);
  if(IM!=='touch'){Object.assign(cv.style,{left:'',top:''});try{G('fit')()}catch(e){}L={vw,vh:vh0,mode:'kb'};return}
  const top0=SA.t,vh=vh0-top0;
  let gw=vw,gh=vw*9/16,mode2;const need=Math.max(150,Math.min(260,vh*0.3));
  if(vh-gh>=need*0.85){mode2='panel';if(vh-gh<need){gh=vh-need;gw=gh*16/9}}else{mode2='side';gh=vh;gw=vh*16/9;if(gw>vw){gw=vw;gh=vw*9/16}}
  // 手機橫向：左右黑邊太窄放不下小圖示時，把畫面縮一點（最多 7.5%）讓出左黑邊一欄，小圖示不再蓋住右上角的經驗值／撿到物品文字
  if(mode2==='side'){const uE=Math.min(62,Math.max(34,Math.min(vh0*0.125,vw*0.07)))*SZK[UIO.sz],isE=Math.max(30,uE*0.6),igE=Math.max(6,uE*0.16),needG=SA.l+isE+2*igE+1;
    if((vw-gw)/2<needG&&vw-2*needG>=gw*0.925){gw=vw-2*needG;gh=gw*9/16}}
  // 橫向平板：改成下方控制區，畫面縮小到技能扇形只會壓到遊戲最下面的按鍵提示列（約 9%），不蓋住遊戲角落
  let uFix=0;if(vw>vh0&&Math.min(vw,vh0)>=600){const uT=Math.min(54,vh*0.065),H=4.9*uT,gT=(vh-H)/0.91;if(gT<vw*9/16){mode2='panel';gh=gT;gw=gh*16/9;uFix=uT}}
  const gx=Math.round((vw-gw)/2),gy=top0;// 橫向平板：畫面靠上，下方空白放搖桿與按鍵
  Object.assign(cv.style,{width:Math.round(gw)+'px',height:Math.round(gh)+'px',left:gx+'px',top:gy+'px'});
  root.className=mode2;L={vw,vh:vh0,gw,gh,gx,gy,mode:mode2,top0,uFix};
  if(mode2==='panel'){const py=Math.round(gh)+top0,ph=vh0-py;Object.assign(panel.style,{display:'block',left:'0px',top:py+'px',width:vw+'px',height:ph+'px'});
    const u=Math.max(44,Math.min(74,ph/3.35,vw/12));L.u=u;L.pad=Math.min(ph*0.92,u*3.4,vw*0.3);L.ax=vw-10;L.ay=vh-8;L.px=10+L.pad/2;L.py=py+ph/2+2;L.sysY=py+8;L.sysX0=L.px+L.pad/2+12;L.sysX1=vw-4*u-24}
  else{panel.style.display='none';const gut=gx;const u=Math.max(42,Math.min(58,vh/8));L.u=u;L.pad=Math.min(vh*0.44,190);L.px=Math.max(L.pad/2+8,gut*0.5);L.py=vh-L.pad/2-10;L.ax=vw-6;L.ay=vh-6;L.gut=gut}
  curKey='';refresh(true)}
function place(e,x,y,w,h,fs){Object.assign(e.style,{display:'flex',left:Math.round(x)+'px',top:Math.round(y)+'px',width:Math.round(w)+'px',height:Math.round(h)+'px',fontSize:Math.round(fs)+'px'})}
function refresh(force){if(IM!=='touch')return;const c=ctx(),hr=hero(),S=G('SAVE'),R=G('REC');let set=SETS[c]||SETS.menu;
  if(c==='play'&&L.vw){if(!root.classList.contains('play')||force){root.classList.add('play');for(const id in EL)EL[id].style.display='none';PAD.el.style.display='none';curKey='HUD'}
    hudRefresh(force);return}
  if(root.classList.contains('play')){root.classList.remove('play');hudOff();curKey=''}
  EL.uiSz.lastChild.textContent=['小','中','大'][UIO.sz];EL.uiOp.lastChild.textContent=['淡','中','濃'][UIO.op];
  let act=c==='play'?set[hr]:set.a,extra=c==='play'?[]:set.x,sys=set.sys.filter(id=>id!=='untf'||(S&&S.tf));
  const key=c+'|'+hr+'|'+sys.join(',')+'|'+L.vw+'x'+L.vh;
  EL.rec.classList.toggle('hot',!!(R&&R.on));EL.rec.firstChild.textContent=R&&R.on?'停止錄影':'錄影';
  EL.mute.classList.toggle('on',!!(S&&S.opt&&(S.opt.mus||S.opt.sfx)));EL.mute.firstChild.textContent=S&&S.opt&&!S.opt.mus&&!S.opt.sfx?'取消靜音':'靜音';
  cdUpdate();if(key===curKey&&!force)return;curKey=key;
  for(const id in EL)EL[id].style.display='none';
  const u=L.u,show=c!=='load';PAD.el.style.display=show?'block':'none';
  // 方向盤
  const P=L.pad;Object.assign(PAD.el.style,{left:(L.px-P/2)+'px',top:(L.py-P/2)+'px',width:P+'px',height:P+'px'});PAD.r=P/2;PAD.cx=L.px;PAD.cy=L.py;PAD.lx=P/2;PAD.ly=P/2;PAD.ns=P*0.36;
  Object.assign(PAD.nub.style,{width:PAD.ns+'px',height:PAD.ns+'px'});padCenter();
  for(const i of PAD.el.querySelectorAll('i')){const a=i.dataset.a,s=P*0.07,m=P*0.08;i.style.borderWidth=s+'px';const col='rgba(255,224,138,.85)';
    if(a==='u'){i.style.left=(P/2-s)+'px';i.style.top=m+'px';i.style.borderBottomColor=col;i.style.borderTopWidth='0'}
    if(a==='d'){i.style.left=(P/2-s)+'px';i.style.top=(P-m-s)+'px';i.style.borderTopColor=col;i.style.borderBottomWidth='0'}
    if(a==='l'){i.style.top=(P/2-s)+'px';i.style.left=m+'px';i.style.borderRightColor=col;i.style.borderLeftWidth='0'}
    if(a==='r'){i.style.top=(P/2-s)+'px';i.style.left=(P-m-s)+'px';i.style.borderLeftColor=col;i.style.borderRightWidth='0'}}
  // 動作鍵格子
  const gap=6,cell=u+gap;for(const id of act){const g=GRID[id];if(!g)continue;const n=g[2]||1;const w=n*u+(n-1)*gap;
    place(EL[id],L.ax-(g[0]+n)*cell+gap,L.ay-(g[1]+n)*cell+gap,w,w,n>1?u*0.36:u*0.27)}
  // 選單額外鍵 & 系統鍵
  const sw=u*1.18,sh=u*0.72;
  if(L.mode==='panel'){let x=L.sysX0,y=L.sysY;const x1=L.ax-4*cell-6;const per=Math.max(1,Math.floor((x1-x+gap)/(sw+gap)));
    const all=[...sys,...extra];all.forEach((id,i)=>{const r=Math.floor(i/per),q=i%per;place(EL[id],x+q*(sw+gap),y+r*(sh+gap),sw,sh,u*0.25)})}
  else{const gut=Math.max(L.gut,sw+12);const colW=Math.min(sw,gut-12);// 左邊縫：系統鍵；右邊縫：選單額外鍵
    const padTop=L.py-L.pad/2-4;const nL=Math.max(1,Math.floor((padTop-6+gap)/(sh+gap)));const left=sys.slice(0,nL),right=[...sys.slice(nL),...extra];
    let y=6;left.forEach(id=>{place(EL[id],6,y,colW,sh,u*0.24);y+=sh+gap});
    const maxY=L.ay-3*cell-4;let y2=6,x2=L.vw-colW-6;right.forEach(id=>{if(y2+sh>maxY){y2=6;x2-=colW+gap}place(EL[id],x2,y2,colW,sh,u*0.24);y2+=sh+gap})}
  if(!show)for(const id in EL)EL[id].style.display='none'}
function cdUpdate(){const s=G('S0');if(!s||!s.P)return;const P=s.P,GSx=G('GS')||{};const m=1-(GSx.mvcd||0);
  const f=(cur,max)=>max>0&&cur>0?Math.min(1,cur/max):0;let a=0,b=0;try{a=f(P.chgCD||0,G('CHG').cd*m);b=f(P.stpCD||0,G('STP').cd*m)}catch(e){}
  const q=EL.chgK.querySelector('.cd'),r=EL.stpK.querySelector('.cd');if(q)q.style.height=(a*100)+'%';if(r)r.style.height=(b*100)+'%'}
addEventListener('resize',()=>{layout();setTimeout(layout,250)});
if(window.visualViewport)visualViewport.addEventListener('resize',layout);
setInterval(()=>refresh(false),100);layout();setTimeout(layout,600);
// 切到背景：遊戲中自動暫停並存檔
document.addEventListener('visibilitychange',()=>{if(document.hidden){hudReleaseAll();for(const c in HOLD){if(HOLD[c].size){HOLD[c].clear();kev('keyup',c)}}PAD.id=null;PAD.dir={h:null,v:null};
  try{if(ctx()==='play'){paused=true;pauseWhy='esc'}const m=G('m2Save');if(m)m()}catch(e){}}});
// Android 返回鍵＝Esc
window.__mobBack=()=>{tapKey('Escape');return true};
window.__mobLayout=()=>root.classList.contains('play')&&PL?({...L,ctx:ctx(),hud:1,u:PL.u,btn:PL.B.filter(b=>b.vis).map(b=>[b.id,Math.round(b.x-b.w/2),Math.round(b.y-b.h/2),Math.round(b.w),Math.round(b.h)]),pad:[Math.round(PL.rx-PL.Rj),Math.round(PL.ry-PL.Rj),Math.round(PL.Rj*2)],padC:[PL.rx,PL.ry]}):({...L,ctx:ctx(),btn:Object.keys(EL).filter(k=>EL[k].style.display!=='none').map(k=>{const r=EL[k].getBoundingClientRect();return [k,Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}),pad:(()=>{const r=PAD.el.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width)]})()});
window.__mobHold=()=>Object.keys(HOLD).filter(k=>HOLD[k].size);
})();
