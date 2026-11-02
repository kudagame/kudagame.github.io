// M2.1（v0.6）— 由 src21/*.js 合併
// ==== a_core.js
// ===== M2.1 (v0.6) =====  load after mon.js
// ---------- tunables ----------
const TFP_MOB=0.0036,TFP_BOSS=0.024;         // 多比的變身藥水 掉落率（W1：+20%）
const CHG={cd:3.5,dur:0.56,v:1600,stun:1.2,bstun:0.45,bdelay:0.5};  // 肩撞
const STP={cd:6,dur:0.62,rx:240,ry:70,slow:3,k:0.6};                // 踱地
const DTAP=0.28;                                                    // 連按判定（秒）
const RR_LINE={sh:3,g:2500},RR_RUNE={sh:6,g:6000};                  // 重洗刻印 價格
function purPct(D){const wb=D.wb||[60,28],up=D.sh?1+D.sh*0.5:1;const tot=wb[0]+wb[1]+7*up+3*up+D.pur;return (D.pur/tot*100).toFixed(1)}
const m21H=(i,s=0)=>{let x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)};
// ---------- DOM overlay (REC / toast) — 不畫在 canvas 上，所以不會被錄進影片 ----------
const m21D=(()=>{const st=document.createElement('style');st.textContent=`#m21rec{position:fixed;left:12px;top:10px;z-index:99;font:bold 16px sans-serif;color:#fff;background:rgba(160,0,0,.82);padding:4px 10px;border-radius:6px;display:none}
#m21toast{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99;font:bold 16px sans-serif;color:#fff;background:rgba(20,14,10,.88);border:1px solid #d6ac54;padding:6px 14px;border-radius:8px;display:none;max-width:80vw;text-align:center}`;
  document.head.appendChild(st);const r=document.createElement('div');r.id='m21rec';const t=document.createElement('div');t.id='m21toast';document.body.append(r,t);return {r,t,tt:0}})();
function m21Toast(s,ms=2600){m21D.t.textContent=s;m21D.t.style.display='block';clearTimeout(m21D.tt);m21D.tt=setTimeout(()=>m21D.t.style.display='none',ms)}
// ---------- save: forward-compatible ----------
function m21Valid(o){return o&&typeof o==='object'&&(o.v|0)>=2&&Array.isArray(o.inv)}
function m21Prog(o){let p=0;const c=o.clear||{};for(const k in c)p+=(+c[k]||0)*1e9;return p+(o.gold||0)+(o.inv?o.inv.length*1000:0)}
function m21Pick(a,b){const A=m21Valid(a)?a:null,B=m21Valid(b)?b:null;if(!A||!B)return A||B;
  if((A.ts||0)!==(B.ts||0))return (A.ts||0)>(B.ts||0)?A:B;return m21Prog(A)>=m21Prog(B)?A:B}
function m21Migrate(S){const D=newSave();
  for(const k in D)if(S[k]===undefined||S[k]===null)S[k]=JSON.parse(JSON.stringify(D[k]));   // 缺的欄位補預設，不認得的欄位原樣保留
  if(typeof S.opt!=='object')S.opt={mus:1,sfx:1};if(S.opt.mus==null)S.opt.mus=1;if(S.opt.sfx==null)S.opt.sfx=1;
  if(!S.eq||typeof S.eq!=='object')S.eq={w:0,a:0,c:0};
  S.inv=S.inv.filter(i=>i&&typeof i==='object');for(const it of S.inv){if(!it.pity||typeof it.pity!=='object')it.pity={};if(it.e==null)it.e=0;if(!it.lines)it.lines=[]}
  if(S.gearMig!==1){ // 舊「防具 a / 飾品 c」→ 衣服 / 戒指；主屬性與詞條照新預算縮放（拆分，不是加總）
    for(const it of S.inv){if(it.t==='a'){it.t='b';it.v=Math.round(it.v*SC.b*10)/10}else if(it.t==='c'){it.t='r';it.v=Math.round(it.v*SC.r*10)/10}else continue;
      it.lines=it.lines.map(([id,v])=>[id,Math.max(0.1,Math.round(v*LSC*10)/10)])}
    if(S.eq.a!=null){S.eq.b=S.eq.a;delete S.eq.a}if(S.eq.c!=null){S.eq.r=S.eq.c;delete S.eq.c}S.gearMig=1}
  for(const [sl] of SLOTS)if(S.eq[sl]==null)S.eq[sl]=0;
  if(!S.slot||typeof S.slot!=='object'||S.slotMig!==1){ // 強化屬於武器欄：取「裝備中武器」或背包裡 +N 最高的那把
    const ws=S.inv.filter(i=>i.t==='w');let src=ws.find(i=>i.id===S.eq.w)||null;for(const w of ws)if(!src||(w.e||0)>(src.e||0))src=w;
    const old=S.slot&&S.slot.e||0;S.slot={e:Math.max(old,src?src.e||0:0),pity:src&&(src.e||0)>=old?Object.assign({},src.pity||{}):(S.slot&&S.slot.pity)||{}};
    for(const it of S.inv){it.e=0;it.pity={}}S.slotMig=1}
  if(typeof S.slot.pity!=='object')S.slot.pity={};S.slot.e=clamp(S.slot.e|0,0,15);
  S.pots=Math.max(0,S.pots|0);S.pots2=Math.max(0,S.pots2|0);S.tf=0;if(S.v<4)S.v=4;return S}
function m21Export(){try{const j=JSON.stringify(typeof m27Park==='function'?m27Park(SAVE):SAVE,null,1);const a=document.createElement('a');const d=new Date();const p=n=>String(n).padStart(2,'0');
  a.download=`存檔備份_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.json`;a.href=URL.createObjectURL(new Blob([j],{type:'application/json'}));document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);m21Toast('已匯出存檔（存到瀏覽器的「下載」資料夾）')}catch(e){m21Toast('匯出失敗：'+e)}}
function m21Import(){const f=document.createElement('input');f.type='file';f.accept='.json,application/json';f.onchange=async()=>{try{const o=JSON.parse(await f.files[0].text());if(!m21Valid(o)){m21Toast('這不是有效的存檔檔案');return}
    if(!confirm('要用匯入的存檔取代目前進度嗎？（目前進度會先自動備份成 .bak）'))return;migrate(o);m21Migrate(o);o.ts=Date.now();SAVE=o;m2Save();calcGS();buildTints();m21AudioApply();m21Toast('匯入完成')}catch(e){m21Toast('匯入失敗：'+e)}};f.click()}
window.m2Assets=(o=>()=>[...o(),'i_tfpot','i_tfpot_big','i_tfpot2','i_tfpot2_big'])(window.m2Assets);
ITEMN.tfpot='多比的變身藥水';ITEMN.tfpot2='惡魔貓變身藥水';
// ---------- audio buses (music / sfx → master → speakers + recorder) ----------
const AB=(()=>{const master=AC.createGain(),mus=AC.createGain(),fx=AC.createGain();mus.connect(master);fx.connect(master);master.connect(AC.destination);
  let rec=null;try{rec=AC.createMediaStreamDestination();master.connect(rec)}catch(e){}return {master,mus,fx,rec,buf:{}}})();
window.__mb=AB.mus;
function m21AudioApply(){if(!SAVE)return;const o=SAVE.opt||{};AB.mus.gain.setTargetAtTime(o.mus?1:0,AC.currentTime,0.05);AB.fx.gain.setTargetAtTime(o.sfx?1:0,AC.currentTime,0.05)}
(async()=>{for(const n of ['hit','crit','clank','coin','swing','wind','ready','summon','fire','jump','hurt','statue','start']){try{const r=await fetch('a/'+n+'.ogg');AB.buf[n]=await AC.decodeAudioData(await r.arrayBuffer())}catch(e){}}})();
window.sfx=(o=>(n,v=0.6)=>{if(SAVE&&SAVE.opt&&!SAVE.opt.sfx)return;const b=AB.buf[n];if(!b)return o(n,v);const now=performance.now();if(lastS[n]&&now-lastS[n]<40)return;lastS[n]=now;
  try{const g=AC.createGain();g.gain.value=v;g.connect(AB.fx);const s=AC.createBufferSource();s.buffer=b;s.connect(g);s.start()}catch(e){}})(window.sfx);
function m21Mute(which){const o=SAVE.opt;if(which==='mus')o.mus=o.mus?0:1;else if(which==='sfx')o.sfx=o.sfx?0:1;else{const on=o.mus||o.sfx;o.mus=o.sfx=on?0:1}
  m21AudioApply();m2Save();m21Toast(`音樂 ${o.mus?'開':'關'}　音效 ${o.sfx?'開':'關'}（M 鍵切換）`,1600)}
// ---------- recording (F9) ----------
const REC={on:false};
function m21RecName(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `艾爾琳之旅_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`}
function m21RecStart(){if(REC.on)return;const cv=document.querySelector('canvas');if(!cv||!cv.captureStream||!window.MediaRecorder){m21Toast('這個瀏覽器不支援內建錄影，請改用 Win+Alt+R');return}
  const st=cv.captureStream(60);if(AB.rec)for(const tr of AB.rec.stream.getAudioTracks())st.addTrack(tr);
  const mt=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
  let mr;try{mr=new MediaRecorder(st,{mimeType:mt,videoBitsPerSecond:8e6})}catch(e){m21Toast('無法開始錄影：'+e);return}
  Object.assign(REC,{on:true,mr,name:m21RecName(),seq:0,q:Promise.resolve(),srv:true,chunks:[],t0:performance.now()});
  mr.ondataavailable=e=>{if(!e.data||!e.data.size)return;const blob=e.data,seq=REC.seq++,name=REC.name;REC.chunks.push(blob);
    REC.q=REC.q.then(async()=>{if(!REC.srv)return;try{const r=await fetch(`rec?name=${encodeURIComponent(name)}&seq=${seq}`,{method:'POST',body:blob});if(!r.ok)throw 0}catch(_){REC.srv=false}})};
  mr.onstop=()=>{REC.q=REC.q.then(async()=>{let path=null;if(REC.srv){try{const r=await fetch(`rec?name=${encodeURIComponent(REC.name)}&end=1`,{method:'POST'});if(r.ok)path=(await r.json()).path}catch(_){}}
      if(path){m21Toast('錄影已存到：'+path,6000)}else{const a=document.createElement('a');a.download=REC.name+'.webm';a.href=URL.createObjectURL(new Blob(REC.chunks,{type:'video/webm'}));document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),3000);m21Toast('錄影已下載（瀏覽器「下載」資料夾）',6000)}
      REC.chunks=[]})};
  mr.start(2000);sfx('ready',0.4);m21D.r.style.display='block';m21Toast('開始錄影（再按 F9 停止）',1600)}
function m21RecStop(){if(!REC.on)return;REC.on=false;try{REC.mr.stop()}catch(e){}m21D.r.style.display='none'}
setInterval(()=>{if(REC.on){const s=Math.floor((performance.now()-REC.t0)/1000);m21D.r.textContent=`● REC ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}},250);
window.__rec=()=>({on:REC.on,seq:REC.seq||0,srv:REC.srv});
// ---------- hotkeys ----------
addEventListener('keydown',e=>{const k=e.code;if(e.repeat)return;
  if(k==='F9'){e.preventDefault();REC.on?m21RecStop():m21RecStart()}
  else if(k==='KeyM'&&SAVE)m21Mute()},true);
// ==== b_moves.js
// ---------- 肩撞 / 踱地 ----------
const TAP={dir:null,t:-9};
function m21Taps(){const s=S0,t=s.t;const ev=[];
  if(press(['ArrowLeft','KeyA'])||GPP.l)ev.push('l');if(press(['ArrowRight','KeyD'])||GPP.r)ev.push('r');if(press(['ArrowDown','KeyS'])||GPP.d)ev.push('d');
  let fire=null;for(const d of ev){if(TAP.dir===d&&t-TAP.t<=DTAP){fire=d;TAP.dir=null;TAP.t=-9}else{TAP.dir=d;TAP.t=t}}return fire}
function m21CanMove(P){const a=P.act;if(P.dead||P.h>0)return false;if(!a)return true;return ['sw','sw2','up'].includes(a.type)&&a.done&&a.t>a.hitAt+0.06}
function m21StartChg(dir){const s=S0,P=s.P,t=s.t;P.face=dir;P.chainBuf=0;P.act={type:'chg',t:0,dur:CHG.dur,hitAt:99,done:true,hitIds:{},dir};P.chgCD=CHG.cd*(1-(GS.mvcd||0));P.chgIF=t+0.36;
  s.callout={t0:t,txt:'肩撞'};sfx('swing',0.45);s.fx.push({k:'chg0',x:P.x,y:P.y,t0:t,dir});P.ghost=[];puff(P.x-20*dir,P.y-3,6,[214,170,128],24,0.4,3)}
function m21StartStomp(){const s=S0,P=s.P,t=s.t;P.chainBuf=0;P.act={type:'stomp',t:0,dur:STP.dur,hitAt:99,done:true,hitIds:{}};P.stpCD=STP.cd*(1-(GS.mvcd||0));s.callout={t0:t,txt:'踱地'};sfx('jump',0.35)}
function m21Boss(m){const s=S0;return m.kind==='boss'}
function m21BossInv(){const s=S0;return bossShielded()||b4Prot()||(s.boss&&s.boss.b4&&s.boss.phase==='steles')}
function m21ChgStep(dt){const s=S0,P=s.P,t=s.t,a=P.act;const u=a.t,d=a.dir;
  if(u<0.08)P.x-=d*60*dt;else if(u<0.40){const k=(u-0.08)/0.32;P.x+=d*CHG.v*(1-k)*dt;
    if(t-(P.lastG||0)>0.03){P.lastG=t;(P.ghost=P.ghost||[]).push({x:P.x,y:P.y,t,nm:'kudas_'+(poseOf(P)||'sh1'),f:d});if(P.ghost.length>6)P.ghost.shift()}
    if(t-(P.lastdust||0)>0.05){P.lastdust=t;puff(P.x-30*d,P.y-3,3,[214,170,128],14,0.4,3)}
    let n=0;for(const m of s.mobs){if(m.gone||a.hitIds[m.id]||m.dying)continue;const big=m.kind==='boss'?60:m.kind==='pillar'?20:0;const dx=(m.x-P.x)*d;
      if(dx<-20||dx>90+big||Math.abs(m.y-P.y)>34+big*0.6||m.h>130)continue;a.hitIds[m.id]=1;
      const inv=m21Boss(m)&&m21BossInv();const v=hitMob(m,'chg',{multi:false});n++;
      if(m.kind==='pillar'||m.dying)continue;
      if(m21Boss(m)){if(!inv&&v>0){m.dizzy=t+CHG.bstun;const b=s.boss;if(b&&!b.atk&&b.nextAtk!=null)b.nextAtk=Math.max(b.nextAtk,t)+CHG.bdelay}}
      else{m.state='stun';m.stun=t+CHG.stun;m.vx=520*d;m.dizzy=t+CHG.stun;m.wind=0;m.cd=Math.max(m.cd||0,0.6)}
      s.fx.push({k:'chghit',x:m.x-30*d,y:m.y-(m21Boss(m)?190:m.h+70),t0:t,dir:d})}
    if(n){shake(6,0.16);s.hitstop=Math.max(s.hitstop,0.06);if(!a.gotRh){a.gotRh=1;P.rh=Math.min(RHMAX,P.rh+1)}}}
  else P.x+=d*40*(1-(u-0.4)/0.16)*dt}
function m21StompImpact(){const s=S0,P=s.P,t=s.t,a=P.act;a.imp=t;let n=0;const tg=[];
  for(const m of s.mobs){if(m.gone||m.dying)continue;const big=m.kind==='boss'?80:0;const dx=(m.x-P.x)/(STP.rx+big),dy=(m.y-P.y)/(STP.ry+big*0.4);if(dx*dx+dy*dy>1||m.h>130)continue;tg.push(m)}
  for(const m of tg){const inv=m21Boss(m)&&m21BossInv();hitMob(m,'stomp',{multi:tg.length>=2});n++;if(m.dying||m.kind==='pillar')continue;
    if(!inv){m.slowU=t+STP.slow;m.slowK=STP.k;if(m21Boss(m)&&s.boss)s.boss.slowU=t+STP.slow}}
  s.fx.push({k:'stomp',x:P.x+18*P.face,y:P.y,t0:t});shake(11,0.3);s.hitstop=Math.max(s.hitstop,0.05);sfx('clank',0.5);sfx('hit',0.4);
  puff(P.x,P.y-2,16,[214,170,128],180,0.7,4);for(let j=0;j<12;j++)s.parts.push({x:P.x+U(-90,90),y:P.y-4,vx:U(-260,260),vy:-U(220,480),g:1500,life:0.7,t0:t,c:CH([[150,120,95],[190,150,110],[110,88,70]]),sz:CH([2,3]),floor:P.y+8});
  if(n)P.rh=Math.min(RHMAX,P.rh+1)}
function m21StompStep(dt){const s=S0,P=s.P,a=P.act;if(!a.hop&&a.t>=0.12){a.hop=1;P.vh=720;P.h=0.01}
  if(a.hop&&!a.imp&&((P.h<=0&&a.t>0.16)||a.t>=a.dur-0.03)){P.h=0;P.vh=0;m21StompImpact()}}
window.stepPlayer=(o=>dt=>{const s=S0,P=s.P,t=s.t;if(P.chgCD==null){P.chgCD=0;P.stpCD=0}
  if(!(P.dead||s.ritual||s.trans||m2Down())){P.chgCD-=dt;P.stpCD-=dt;
    let fire=m21Taps();if(AUTO){fire=AI.chg?(AI.chg>0?'r':'l'):AI.stomp?'d':null}
    if(fire&&m21CanMove(P)){if(fire==='d'){if(P.stpCD<=0)m21StartStomp();else s.denyStp=t}else{if(P.chgCD<=0)m21StartChg(fire==='r'?1:-1);else s.denyChg=t}}
    const a=P.act;if(a&&a.type==='chg')m21ChgStep(dt);else if(a&&a.type==='stomp')m21StompStep(dt)}
  o(dt)})(window.stepPlayer);
window.poseOf=(o=>P=>{const a=P.act;if(a&&a.type==='chg'){const u=a.t;return u<0.08?'sh0':u<0.22?'sh1':u<0.40?'sh2':'sh3'}
  if(a&&a.type==='stomp'){if(!a.hop)return 'st0';if(!a.imp)return P.vh>0?'jump':'airdive';const k=S0.t-a.imp;return k<0.12?'st2':'slam'}return o(P)})(window.poseOf);
window.m2Hurt=(o=>(v,x)=>{const s=S0,P=s.P;if(P.chgIF>s.t)return 0;return o(v,x)})(window.m2Hurt);
// AUTO 也會用
window.aiThink=(o=>()=>{o();const s=S0,P=s.P;AI.chg=0;AI.stomp=0;if(!AUTO)return;
  const ms=s.mobs.filter(m=>!m.dying&&!m.gone&&m.kind!=='pillar'&&Math.abs(m.x-s.cam-640)<640);
  const near=ms.filter(m=>Math.abs(m.x-P.x)<200&&Math.abs(m.y-P.y)<60).length;
  if(near>=2&&P.stpCD<=0&&Math.random()<0.05)AI.stomp=1;
  else{const m=ms.find(m=>Math.abs(m.y-P.y)<18&&Math.abs(m.x-P.x)>120&&Math.abs(m.x-P.x)<300);if(m&&P.chgCD<=0&&Math.random()<0.04)AI.chg=Math.sign(m.x-P.x)}})(window.aiThink);
// 緩速：Boss 出手時間也被拖慢；石碑階段等無敵時不受影響
function m21StepFx(dt){const s=S0,t=s.t,b=s.boss;if(b&&b.slowU>t&&!b.atk&&b.nextAtk!=null)b.nextAtk+=dt*(1-STP.k)}
// ==== c_fx.js
// ---------- layered pixel FX helpers（低解析度畫布 ×3 放大：有層次的色階，不用單線條） ----------
const PXS=3;const PXB={};
function pxc(w,h){const k=w+'x'+h;let e=PXB[k];if(!e)e=PXB[k]=mk(w,h);const x=e[1];x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.clearRect(0,0,w,h);return e}
function pxOut(c,cx,cy,alpha=1,comp){X.save();X.imageSmoothingEnabled=false;X.globalAlpha=alpha;if(comp)X.globalCompositeOperation=comp;X.drawImage(c,Math.round(cx-c.width*PXS/2),Math.round(cy-c.height*PXS/2),c.width*PXS,c.height*PXS);X.restore()}
function bdisc(x,cx,cy,r,cols,ry=1,a=1){x.globalAlpha=a;cols.forEach((c,i)=>{const rr=r*(1-i/cols.length);if(rr<0.5)return;x.fillStyle=rgb(c);x.beginPath();x.ellipse(cx,cy,rr,rr*ry,0,0,Math.PI*2);x.fill()});x.globalAlpha=1}
function bring(x,cx,cy,r,w,cols,ry=1,a=1){x.globalAlpha=a;const n=cols.length;cols.forEach((c,i)=>{const r0=r+w/2-(i*w/n)/2,r1=r-w/2+(i*w/n)/2;if(r0<=r1)return;x.fillStyle=rgb(c);x.beginPath();x.ellipse(cx,cy,r0,r0*ry,0,0,Math.PI*2);x.ellipse(cx,cy,Math.max(0,r1),Math.max(0,r1)*ry,0,0,Math.PI*2,true);x.fill('evenodd')});x.globalAlpha=1}
function bloom(cx,cy,r,col,a,ry=1){X.save();X.globalCompositeOperation='lighter';X.globalAlpha=a;X.translate(cx,cy);X.scale(1,ry);const g=X.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,rgb(col,0.9));g.addColorStop(0.35,rgb(col,0.45));g.addColorStop(1,rgb(col,0));X.fillStyle=g;X.fillRect(-r,-r,2*r,2*r);X.restore()}
function pdot(x,px,py,c,sz=1){x.fillStyle=rgb(c);x.fillRect(Math.round(px),Math.round(py),sz,sz)}
function pspark(x,px,py,c1,c2,big){px=Math.round(px);py=Math.round(py);x.fillStyle=rgb(c2);x.fillRect(px-1,py,3,1);x.fillRect(px,py-1,1,3);if(big){x.fillRect(px-2,py,5,1);x.fillRect(px,py-2,1,5)}x.fillStyle=rgb(c1);x.fillRect(px,py,1,1)}
function pdiam(x,px,py,s,cols){px=Math.round(px);py=Math.round(py);cols.forEach((c,i)=>{const k=s-i;if(k<0)return;x.fillStyle=rgb(c);for(let d=-k;d<=k;d++){const w=k-Math.abs(d);x.fillRect(px-w,py+d,2*w+1,1)}})}
function pwedge(x,cx,cy,an,len,wd,col,a){x.globalAlpha=a;x.fillStyle=rgb(col);x.beginPath();x.moveTo(cx+Math.cos(an+Math.PI/2)*1.5,cy+Math.sin(an+Math.PI/2)*1.5);x.lineTo(cx+Math.cos(an-wd)*len,cy+Math.sin(an-wd)*len);x.lineTo(cx+Math.cos(an+wd)*len,cy+Math.sin(an+wd)*len);x.closePath();x.fill();x.globalAlpha=1}
const PAL={blue:[[24,40,110],[50,96,200],[110,170,255],[200,232,255],[255,255,255]],gold:[[120,46,8],[220,120,24],[255,190,70],[255,238,170],[255,255,240]],
  dust:[[110,84,62],[156,122,90],[198,162,120],[232,206,166]],frost:[[30,70,140],[70,140,220],[150,210,255],[225,245,255]],smoke:[[46,42,48],[78,72,80],[112,106,112],[150,144,150]],
  dark:[[22,16,22],[48,38,46],[80,66,74]],ember:[[120,40,20],[200,90,30],[255,170,70]]};
// ---------- 星星（暈眩） ----------
function m21Star(x,px,py,s){pdiam(x,px,py,s+1,[[150,80,10],[255,190,40],[255,240,150]]);x.fillStyle='rgb(255,255,255)';x.fillRect(Math.round(px)-1,Math.round(py)-1,1,1)}
function m21DrawStatus(SX,shy){const s=S0,t=s.t;
  for(const m of s.mobs){if(m.gone||m.dying)continue;const sx=SX(m.x);if(sx<-100||sx>W+100)continue;const B=m.kind==='boss';
    if(m.dizzy>t){const hy=(B?m.y-300:m.y-m.h-150)+shy;const [c,x]=pxc(40,16);for(let i=0;i<3;i++){const an=t*5+i*2.094;m21Star(x,20+Math.cos(an)*12,8+Math.sin(an)*3.5,Math.sin(an)>0?2:1)}pxOut(c,sx,hy)}
    if(m.slowU>t&&m.slowK){const k=Math.min(1,(m.slowU-t)/0.5);const [c,x]=pxc(44,14);bring(x,22,7,15,5,PAL.frost,0.32,0.55*k);pxOut(c,sx,m.y+shy,1);
      const by=(B?m.y-260:m.y-m.h-118)+shy;rrect(sx+22,by-11,sx+46,by+11,6,'rgba(40,110,200,0.92)','rgb(200,235,255)',2);T('緩',sx+34,by+1,FN(13),[255,255,255],2,[10,30,70],'mm',k);
      if(Math.floor(t*12+m.id)%5===0)s.parts.push({x:m.x+U(-24,24),y:m.y-U(10,60),vx:0,vy:-U(20,50),g:0,life:0.5,t0:t,c:CH([[170,220,255],[110,180,255],[230,250,255]]),sz:CH([1,2])})}}}
// ---------- 肩撞 / 踱地 / 千把劍 ----------
function m21DrawMoveFx(SX,shy){const s=S0,t=s.t;
  for(const e of s.fx){const age=t-e.t0;
    if(e.k==='chg0'&&age<0.42){const [c,x]=pxc(90,40);const k=age/0.42,d=e.dir;// 起步氣爆：層次風壓團
      for(let i=0;i<5;i++){const u=i/4,rx=10+u*22*k+6,px=45-d*(8+u*26*(0.4+k)),py=26-u*6;bdisc(x,px,py,rx*(1-k*0.4),PAL.dust,0.42,(1-k)*(1-u*0.5))}
      bdisc(x,45+d*6,22,9*(1-k)+2,[[180,200,230],[225,238,255],[255,255,255]],0.8,0.8*(1-k));pxOut(c,SX(e.x),e.y-40+shy)}
    if(e.k==='chghit'&&age<0.3){const [c,x]=pxc(48,48);const k=age/0.3;bdisc(x,24,24,6+14*k,PAL.gold,1,1-k);bring(x,24,24,6+18*k,4*(1-k)+1,[[255,170,60],[255,240,190]],1,1-k);
      for(let i=0;i<7;i++){const an=i*0.9+e.dir,r=6+20*k;pspark(x,24+Math.cos(an)*r,24+Math.sin(an)*r,[255,255,255],[255,200,90],i%2)}pxOut(c,SX(e.x),e.y+shy);bloom(SX(e.x),e.y+shy,60,[255,200,120],0.5*(1-k))}
    if(e.k==='stomp'&&age<0.9){const k=Math.min(1,age/0.55),f=age<0.55?1:1-(age-0.55)/0.35;const [c,x]=pxc(180,60);
      bring(x,90,34,10+80*k,10*(1-k)+3,PAL.dust,0.36,f);bring(x,90,34,6+62*k,6*(1-k)+2,[[180,140,100],[236,214,176],[255,248,226]],0.36,f*0.9);
      bdisc(x,90,34,30*(1-k)+4,[[120,90,64],[200,160,110],[250,236,200]],0.4,f);
      for(let i=0;i<14;i++){const an=m21H(i,3)*Math.PI-Math.PI,r=8+70*k*(0.6+0.5*m21H(i,5)),hy=Math.sin(Math.min(1,age/0.5)*Math.PI)*(10+14*m21H(i,7));
        pdiam(x,90+Math.cos(an)*r,34+Math.sin(an)*r*0.3-hy,1,[[98,74,54],[170,134,96]])}
      for(let i=0;i<8;i++){const ox=(m21H(i,9)-0.5)*140*k,oy=-age*30-6*m21H(i,4);bdisc(x,90+ox,26+oy,5+8*k,PAL.dust,0.7,0.55*f)}
      pxOut(c,SX(e.x),e.y-6+shy);if(age<0.2)bloom(SX(e.x),e.y+shy,170,[255,220,160],0.35*(1-age/0.2),0.35)}
    if(e.k==='rain2'&&age<1.0)m21Rain(e,age,SX,shy)}}
// 劍：刀身三色（亮緣/中/暗緣）、護手、握柄、柄頭
const SWD=(()=>{const [c,x]=mk(9,34);const P=(cl,x0,y0,w,h)=>{x.fillStyle=rgb(cl);x.fillRect(x0,y0,w,h)};
  P([120,80,20],3,0,3,3);P([255,214,100],4,0,1,2);P([92,56,30],3,3,3,6);P([150,96,52],4,3,1,6);P([140,92,20],0,9,9,2);P([255,210,90],0,9,9,1);P([255,246,190],1,9,2,1);
  P([96,108,150],2,11,5,19);P([178,194,226],3,11,3,19);P([236,246,255],3,11,1,19);P([140,156,198],4,12,1,17);
  for(let i=0;i<4;i++){P([96,108,150],2+Math.ceil(i/2),30+i,5-2*Math.ceil(i/2),1);if(5-2*Math.ceil(i/2)>2)P([210,226,250],3+Math.ceil(i/2),30+i,1,1)}
  const [g,gx]=mk(9,34);gx.drawImage(c,0,0);gx.globalCompositeOperation='source-atop';gx.fillStyle='rgb(150,210,255)';gx.fillRect(0,0,9,34);return {c,g}})();
function m21Rain(e,age,SX,shy){const n=e.big?7:5,sp=e.big?26:20;const gy=e.y+shy;const s=S0;e.land=e.land||[];
  for(let i=0;i<n;i++){const ox=(i-(n-1)/2)*sp+(m21H(i,e.t0)-0.5)*8,oy=(m21H(i+3,e.t0)-0.5)*14;const t0=0.03*i*(i%2?1:0.6),fall=0.2,u=(age-t0)/fall;if(u<0)continue;
    const sx=SX(e.x+ox),ty=gy+oy;const land=u>=1;const yy=land?ty:ty-(1-u*u)*460;const fade=land?Math.max(0,1-(age-t0-fall-0.32)/0.22):1;if(fade<=0)continue;
    X.save();X.imageSmoothingEnabled=false;
    if(!land){for(let j=3;j>=1;j--){X.globalAlpha=0.16*(4-j)/3;X.drawImage(SWD.g,Math.round(sx-13),Math.round(yy-102-j*34),27,102)}bloom(sx,yy-60,46,[150,200,255],0.4,1.8)}
    X.globalAlpha=fade;X.drawImage(SWD.c,Math.round(sx-13),Math.round(yy-102+(land?10:0)),27,102);X.restore();
    if(land){if(!e.land[i]){e.land[i]=1;for(let j=0;j<5;j++)s.parts.push({x:e.x+ox+U(-6,6),y:e.y+oy-4,vx:U(-180,180),vy:-U(160,380),g:1400,life:0.45,t0:s.t,c:CH([[220,236,255],[150,190,240],[255,255,255]]),sz:CH([1,2]),floor:e.y+oy+6});puff(e.x+ox,e.y+oy-2,3,[214,170,128],10,0.35,2)}
      const la=age-t0-fall;if(la<0.25){const [c,x]=pxc(40,20);const k=la/0.25;bdisc(x,20,12,4+12*k,PAL.blue.slice(1),0.42,1-k);for(let j=0;j<4;j++){const an=-Math.PI*(0.15+0.7*m21H(j,i+e.t0)),r=3+14*k;pdiam(x,20+Math.cos(an)*r,12+Math.sin(an)*r,1,[[110,150,220],[230,244,255]])}pxOut(c,sx,ty,1);bloom(sx,ty-10,50,[180,220,255],0.45*(1-k),0.6)}
      else bloom(sx,ty-40,26,[150,200,255],0.25*fade,2)}}}
// 殘影（肩撞衝刺）
window.spr=(o=>(n,sx,sy,op={})=>{const s=S0;if(s&&n.startsWith('kudas_')&&s.P&&s.P.ghost&&s.P.ghost.length&&!op.__g){const P=s.P,t=s.t;
    for(const g of P.ghost){const k=1-(t-g.t)/0.22;if(k<=0)continue;const dxw=g.x-P.x;o(m21TfOn()?m21PkName(g.nm):g.nm,sx+dxw,sy+(g.y-P.y),{flip:g.f<0,alpha:0.32*k,filter:'brightness(1.7) saturate(0.4) sepia(0.3) hue-rotate(170deg)',__g:1})}
    P.ghost=P.ghost.filter(g=>t-g.t<0.22)}
  return m21Spr(o,n,sx,sy,op)})(window.spr);
window.drawM2Fx=(o=>(SX,shy)=>{o(SX,shy);m21DrawMoveFx(SX,shy);m21DrawStatus(SX,shy);m21DrawPoof(SX,shy)})(window.drawM2Fx);
// ==== d_tf.js
// ---------- 變身藥水：苦達 → 搗蛋鬼（1）／惡魔貓（2） ----------
// 所有招式 1:1 對應苦達的招式，判定/時間/節奏/冷卻/狀態完全相同；只換圖、特效外觀與叫聲。
// 數值差異只有「變身被動」：惡魔貓 金幣 +20%；搗蛋鬼（多比的變身藥水）有色裝備掉落率 +3%（加算，不含白裝）＋所有攻擊力 +5%（W1，見 src26/w1.js）。
// 變身只存在這次遊戲：跨關卡保留；死亡或手動解除就變回苦達；關掉遊戲就結束（不寫進存檔）。
// 動畫表：web/a/pk/、web/a/dc/（tools/pk_sync.py 從 monsters/playable/* 只讀複製），與苦達同格式 220x150、腳底 (100,140)
const TFS={1:{pre:'prank',dir:'a/pk/',nm:'搗蛋鬼',pot:'多比的變身藥水',ic:'i_tfpot',bonus:'有色裝備掉落率 +3%、所有攻擊力 +5%',col:[200,150,255],ready:false},
  2:{pre:'dcat',dir:'a/dc/',nm:'惡魔貓',pot:'惡魔貓變身藥水',ic:'i_tfpot2',bonus:'獲得金幣 +20%',col:[255,130,120],ready:false}};
const PK=TFS[1];
for(const k of [1,2]){const F=TFS[k];(async()=>{try{const r=await fetch(F.dir+'meta_'+F.pre+'.json',{cache:'no-store'});if(!r.ok)return;const j=await r.json();
  const L=[];for(const n of j.names)for(const p of ['s_','f_','g_']){const im=new Image();IMG[p+n]=im;L.push(new Promise(z=>{im.onload=z;im.onerror=z;im.src=F.dir+p+n+'.png'}))}
  await Promise.all(L);const wait=()=>{if(!META){setTimeout(wait,100);return}Object.assign(META.can,j.can);F.names=new Set(j.names.filter(n=>IMG['s_'+n].width));F.ready=F.names.size>0};wait()}catch(e){}})()}
const m21TfF=()=>SAVE&&SAVE.tf?TFS[SAVE.tf]||null:null;
const m21TfOn=()=>{const F=m21TfF();return !!(F&&F.ready)};
const TFC={};
function m21TfImg(n){if(TFC[n])return TFC[n];const s=IMG['s_'+n],m=IMG['m_'+n];if(!s||!s.width)return null;const [c,x]=mk(s.width,s.height);x.drawImage(s,0,0);
  const d=x.getImageData(0,0,c.width,c.height);let md=null;if(m&&m.width===s.width){const [c2,x2]=mk(m.width,m.height);x2.drawImage(m,0,0);md=x2.getImageData(0,0,m.width,m.height).data}
  const p=d.data;for(let i=0;i<p.length;i+=4){if(p[i+3]<10)continue;const L=(p[i]*0.3+p[i+1]*0.59+p[i+2]*0.11)/255;
    if(md&&md[i]>128){const W3=[[70,40,22],[118,74,40],[164,112,64],[200,150,96]];const c3=W3[Math.min(3,Math.floor(L*4))];p[i]=c3[0];p[i+1]=c3[1];p[i+2]=c3[2]}
    else{const G=[[52,70,62],[96,124,104],[150,176,140],[210,226,196],[240,246,232]];const g=G[Math.min(4,Math.floor(L*5))];p[i]=(p[i]*0.35+g[0]*0.65)|0;p[i+1]=(p[i+1]*0.35+g[1]*0.65)|0;p[i+2]=(p[i+2]*0.35+g[2]*0.65)|0}}
  x.putImageData(d,0,0);return TFC[n]=c}
// 苦達 pose → 變身 pose（時間全部由苦達的招式資料決定，這裡只挑「看起來對應」的圖）
function m21PkName(n){const s=S0,P=s.P,t=s.t,a=P.act;const F=m21TfF()||PK,pre=F.pre+'_',H=F.names||new Set();let p=n.slice(6);
  if(P.dead||m2Down()){const left=(P.downU||0)-t;return pre+((!P.dead&&left<0.3)?'getup':'down')}
  if(a&&a.type==='chg')p=a.t<0.08?'charge':'bash';else if(a&&a.type==='stomp')p=!a.imp?'stomp0':'stomp1';
  else if(a&&a.type==='wind')p=a.t<0.44?(Math.floor(a.t/0.095)%2?'skill1':'skill0'):a.t<0.62?'slam':'follow';
  else if(a&&a.type==='stab'&&H.has(pre+'claw')&&a.t>=0.19&&a.t<0.36)p='claw';
  else if(!a&&t-(P.lastHurt||-9)<0.22&&P.h<=0)p='hit';
  return H.has(pre+p)?pre+p:H.has(pre+n.slice(6))?pre+n.slice(6):pre+'idle'}
function m21Spr(o,n,sx,sy,op){const s=S0;if(!(SAVE&&SAVE.tf&&s&&s.P&&n.startsWith('kudas_')&&mode==='play'&&!op.__g))return o(n,sx,sy,op);
  if(m21TfOn()){const pn=m21PkName(n);const dn=/_(down|getup)$/.test(pn);const f=op.flip?-1:1;
    return o(pn,sx+(dn?16*SS*f:0),sy,Object.assign({},op,{rot:dn?0:op.rot}))}
  // 後備：動畫表讀不到時才用（苦達染色＋樹枝）
  const c=m21TfImg(n);if(!c)return o(n,sx,sy,op);const [cw,chh,cx,cy]=anchor(n);X.save();X.globalAlpha=op.alpha==null?1:op.alpha;X.translate(Math.round(sx),Math.round(sy));X.imageSmoothingEnabled=false;
  if(op.flip)X.scale(-1,1);if(op.rot){X.translate(0,-30*SS);X.rotate(-op.rot*Math.PI/180);X.translate(0,30*SS)}const dx=-cx*SS,dy=-cy*SS+(op.dy||0)*SS;
  X.drawImage(op.flash?IMG['f_'+n]:c,dx,dy,cw*SS,chh*SS);X.restore()}
function m21Pot(kind){const k=kind==='tfpot2'||kind===2?2:1;const key=k===2?'pots2':'pots';SAVE[key]=(SAVE[key]||0)+1;const s=S0;
  if(s){s.log.push([s.t,'tfpot'+(k===2?'2':''),`獲得 ${TFS[k].pot}！（背包使用）`]);proc('稀有掉落',k===2?[170,40,60]:[150,70,200],'變');sfx('crit',0.4)}m2Save()}
// k: 1 搗蛋鬼 / 2 惡魔貓 / 0 解除。一次只會有一種變身；換另一種會先解除。quiet：死亡時不跳提示
function m21Transform(k,quiet){const s=S0;if(k===true)k=1;if(k===false)k=0;
  if(k){if(SAVE.tf===k)return;const key=k===2?'pots2':'pots';if((SAVE[key]||0)<1){m21Toast('沒有'+TFS[k].pot);return}SAVE[key]--;SAVE.tf=k}else{if(!SAVE.tf)return;SAVE.tf=0}
  m2Save();sfx('summon',0.45);if(s&&s.P&&(mode==='play'||mode==='dead')){s.fx.push({k:'poof',x:s.P.x,y:s.P.y,t0:s.t,on:!!k,tk:k});puff(s.P.x,s.P.y-60,14,k===2?[250,200,200]:[236,226,250],60,0.6,4)}
  if(!quiet)m21Toast(k?`變身成${TFS[k].nm}！（${TFS[k].bonus}；T 或背包「解除變身」可變回）`:'解除變身',2400)}
// 存檔不記錄變身：寫檔時暫時拿掉，讀檔時一律是苦達
window.m2Save=(o=>function(){const k=SAVE&&SAVE.tf;if(SAVE)delete SAVE.tf;try{return o.apply(this,arguments)}finally{if(SAVE&&k)SAVE.tf=k}})(window.m2Save);
function m21DrawPoof(SX,shy){const s=S0,t=s.t;for(const e of s.fx){if(e.k!=='poof')continue;const age=t-e.t0;if(age>0.7)continue;const k=age/0.7;const [c,x]=pxc(90,90);
  for(let i=0;i<9;i++){const an=i/9*Math.PI*2+m21H(i,e.t0),r=6+30*Math.sqrt(k);bdisc(x,45+Math.cos(an)*r,50+Math.sin(an)*r*0.7-k*10,(9+6*m21H(i,2))*(1-k*0.5),e.on&&e.tk===2?[[130,40,52],[210,110,110],[255,214,200]]:e.on?[[150,110,180],[210,190,236],[245,240,255]]:[[120,120,130],[196,196,206],[245,245,250]],1,1-k)}
  bdisc(x,45,48,16*(1-k),[[255,230,150],[255,255,230]],1,1-k);for(let i=0;i<8;i++){const an=i*0.785+k,r=10+34*k;m21Star(x,45+Math.cos(an)*r,48+Math.sin(an)*r,1)}
  pxOut(c,SX(e.x),e.y-70+shy,1);bloom(SX(e.x),e.y-70+shy,120,[230,210,255],0.4*(1-k))}}
// ==== e_ui.js
// ---------- 背包：賣掉 / 分解 / 全部賣掉綠色 / 變身藥水 ----------
function m21BagBtns(it,inp){let act=null;const e=it&&isEq(it);
  if(it){if(btn(935,560,1025,602,e?'已裝備':'裝備',!e))act='eq';if(btn(1031,560,1109,602,'賣掉',!e,[255,200,90]))act='sell';if(btn(1115,560,1192,602,'分解',!e,[120,190,255]))act='dis';
    if(e)T('裝備中的不能賣／分解',1063,612,FN(12),[200,170,150],2,[0,0,0],'mm')}
  const gn=SAVE.inv.filter(i=>i.r===1&&!isEq(i));if(btn(430,532,622,574,`全部賣掉綠色（${gn.length}）`,gn.length>0,[130,235,110])&&inp)act='bulk';
  for(const k of [1,2]){const F=TFS[k],x0=k===1?632:770,key=k===2?'pots2':'pots',n=SAVE[key]||0,on=SAVE.tf===k;
    rrect(x0,530,x0+134,576,8,k===2?'rgba(60,18,26,0.88)':'rgba(40,24,56,0.85)',on?'rgb(255,236,160)':rgb(F.col),2);X.save();X.imageSmoothingEnabled=false;X.drawImage(IMG[F.ic+'_big'],x0+4,535,36,36);X.restore();
    T('×'+n,x0+42,553,FN(14),[240,220,255],2,[0,0,0],'lm');
    if(on){if(btn(x0+70,536,x0+130,570,'解除',true,[255,150,200])&&inp)act='untf'}else if(btn(x0+70,536,x0+130,570,'使用',n>0,F.col)&&inp)act='tf'+k;
    if(MOUSE&&MOUSE[0]>=x0&&MOUSE[0]<=x0+134&&MOUSE[1]>=530&&MOUSE[1]<=576)m21PotTip(k,x0)}
  return act==='bulk'?(m21BulkSell(),null):act==='tf1'?(m21Transform(1),null):act==='tf2'?(m21Transform(2),null):act==='untf'?(m21Transform(false),null):act}
function m21BulkSell(){const L=SAVE.inv.filter(i=>i.r===1&&!isEq(i));if(!L.length)return;let g=0;for(const it of L)g+=sellPrice(it);SAVE.inv=SAVE.inv.filter(i=>!L.includes(i));SAVE.gold+=g;if(S0)S0.gold=SAVE.gold;
  UI.msg=[`賣掉 ${L.length} 件綠色裝備　+${g.toLocaleString('en-US')} 金幣`,performance.now()];sfx('coin',0.5);m2Save()}
function m21BagKeys(inp){if(!inp)return;if(press(['KeyG']))m21BulkSell();if(press(['KeyU']))m21Transform(SAVE.tf===1?0:1);if(press(['KeyY']))m21Transform(SAVE.tf===2?0:2)}
function m21PotTip(k,x0){const F=TFS[k],x=Math.min(x0,1280-372),y=420;rrect(x,y,x+362,y+104,8,'rgba(16,10,14,0.95)',rgb(F.col),2);
  T(F.pot+(k===2?'（極稀有）':''),x+12,y+18,FS(17),F.col,2,[0,0,0],'lm');T('變身被動：'+F.bonus,x+12,y+44,FN(14),[255,226,120],2,[0,0,0],'lm');
  T('外觀變成'+F.nm+(k===1?'，招式跟苦達一樣（攻擊力另 +5%）':'，戰鬥數值、招式完全跟苦達一樣'),x+12,y+66,FN(12),[220,210,200],2,[0,0,0],'lm');T('死亡、手動解除或關掉遊戲就變回苦達　'+(k===2?'Y':'U')+' 使用',x+12,y+86,FN(12),[200,190,180],2,[0,0,0],'lm')}
function m21Bag(inp){const c=UI.conf;const modal=c&&!c[2];bagUI(inp&&!modal);if(!modal)return;const it=invItem(c[0]);if(!it){UI.conf=null;return}
  X.save();X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(0,0,W,H);X.restore();panelBG(380,230,900,470);const sell=c[1]==='sell';
  T(sell?'確定要賣掉這件英雄裝？':'確定要分解這件英雄裝？',640,270,FS(24),[255,236,200],3,[0,0,0],'mm');gearCard(it,410,300,72,false);T(RAR[it.r].st+itName(it),500,320,FS(20),RAR[it.r].col,2,[0,0,0],'lm');
  T(sell?`得到 ${sellPrice(it).toLocaleString('en-US')} 金幣`:`得到 刻印碎片 ×${RAR[it.r].sh}`,500,354,FN(16),[255,226,120],2,[0,0,0],'lm');T('這個動作無法復原',500,382,FN(14),[255,160,140],2,[0,0,0],'lm');
  const ok=btn(460,410,620,452,sell?'賣掉（J）':'分解（J）',true,[255,120,90]),no=btn(660,410,820,452,'取消（Esc）',true);
  if(!inp)return;if(ok||press(['KeyJ','Enter'])){c[2]=true;bagSell(it,c[1]);UI.conf=null}else if(no||press(['Escape','KeyI'])){UI.conf=null}}
// ---------- 鐵匠／NPC 分頁 ----------
function m21Tabs(npc){if(!npc)return [['設定','set']];const T0=[['強化','forge']];if(npc==='cat')T0.push(['抽裝備','draw']);T0.push(['重洗刻印','rr'],['賦魔繼承','inh'],['品階提升','up']);return T0}
// 數字（Page 有寫）
const INH={sh:8,g:12000,rate:70};
const UPG={1:{to:2,sh:25,g:40000,rate:25,pity:4},2:{to:4,sh:70,g:150000,rate:10,pity:8},3:{to:4,sh:60,g:120000,rate:12,pity:7}};
const colOf=r=>r===1?'g':r===2||r===3?'b':r===4?'p':'w';
function m21Clone(it){return JSON.parse(JSON.stringify(it))}
function m21Sum(it,x,y,w,title){if(title)T(title,x,y-16,FN(14),[214,172,84],2,[0,0,0],'lm');rrect(x-6,y-4,x+w,y+214,8,'rgba(20,14,10,0.6)','rgba(150,120,70,0.7)',1);
  if(!it){T('（點下面的裝備選擇）',x+w/2-3,y+100,FN(14),[150,145,140],2,[0,0,0],'mm');return}
  gearCard(it,x,y+2,48,false);const nm=wrapT(RAR[it.r].st+itName(it),FS(16),w-64);nm.slice(0,2).forEach((l,i)=>T(l,x+56,y+14+i*20,FS(16),RAR[it.r].col,2,[0,0,0],'lm'));
  T(`${RAR[it.r].n}・${SLOTN[it.t]}`,x+56,y+56,FN(12),[200,190,170],2,[0,0,0],'lm');let yy=y+80;
  for(const [a,b,c] of itemLines(it)){if(a==='強化'||a==='賦魔')continue;const ls=wrapT(a+'　'+b,FN(13),w-6);for(const l of ls.slice(0,2)){if(yy>y+206)break;T(l,x,yy,FN(13),c,2,[0,0,0],'lm');yy+=18}}}
function m21Cands(){const k=UI.kind,A=UI.A&&invItem(UI.A);const all=SAVE.inv;
  if(UI.foc!=='B'||!A){if(k==='inh')return all;if(k==='up')return all.filter(i=>UPG[i.r]);return all}
  if(k==='inh')return all.filter(i=>i.t===A.t&&i.id!==A.id&&i.rune&&!isEq(i));
  if(k==='up'){const to=UPG[A.r].to;return all.filter(i=>i.t===A.t&&i.id!==A.id&&!isEq(i)&&colOf(i.r)===colOf(to))}return []}
function m21Grid(inp,L){const x0=400,y0=168,z=44,cols=16,rows=2;UI.gs=clamp(UI.gs||0,0,Math.max(0,L.length-1));const pg=Math.floor(UI.gs/(cols*rows))*cols*rows;
  for(let i=0;i<cols*rows;i++){const it=L[pg+i];const x=x0+(i%cols)*46,y=y0+Math.floor(i/cols)*46;rrect(x,y,x+z,y+z,5,'rgba(40,30,24,0.85)','rgba(150,120,70,0.6)',1);
    if(it){gearCard(it,x+1,y+1,z-2,pg+i===UI.gs);if(it.id===UI.A||it.id===UI.B)T(it.id===UI.A?'A':'B',x+4,y+z-8,FN(12),[255,255,120],2,[0,0,0],'lm')}
    if(inp&&CLICK&&it&&inBox(CLICK,[x,y,x+z,y+z])){if(UI.gs===pg+i)m21Pick1(it);UI.gs=pg+i}}
  if(!L.length)T(UI.foc==='B'?'沒有符合條件的材料裝備':'背包是空的',640,214,FN(15),[200,180,160],2,[0,0,0],'mm');
  if(L.length>cols*rows)T(`第 ${pg/(cols*rows)+1}/${Math.ceil(L.length/(cols*rows))} 頁（↑↓ 換頁）`,1140,262,FN(12),[200,190,170],2,[0,0,0],'rm');
  if(!inp)return;if(press(['ArrowLeft','KeyA']))UI.gs=Math.max(0,UI.gs-1);if(press(['ArrowRight','KeyD']))UI.gs=Math.min(L.length-1,UI.gs+1);
  if(press(['ArrowUp','KeyW']))UI.gs=Math.max(0,UI.gs-cols);if(press(['ArrowDown','KeyS']))UI.gs=Math.min(L.length-1,UI.gs+cols);
  if(press(['Enter','KeyJ'])&&L[UI.gs])m21Pick1(L[UI.gs])}
function m21Pick1(it){const k=UI.kind;if(UI.foc==='B'&&UI.A){UI.B=it.id}else{UI.A=it.id;UI.B=null;UI.rsel=0;if(k!=='rr')UI.foc='B'}UI.gs=0;sfx('coin',0.25)}
function m21Pay(sh,g){if(SAVE.gold<g){UI.msg=['金幣不夠',performance.now()];return false}if(SAVE.shards<sh){UI.msg=['刻印碎片不夠（分解裝備可以得到）',performance.now()];return false}SAVE.gold-=g;SAVE.shards-=sh;if(S0)S0.gold=SAVE.gold;return true}
function m21SmithUI(inp){const k=UI.kind;const A=UI.A&&invItem(UI.A),B=UI.B&&invItem(UI.B);if(!A)UI.foc='A';
  const ttl={rr:'重洗刻印',inh:'賦魔繼承',up:'品階提升'}[k];T(ttl,400,148,FS(24),[255,236,200],3,[0,0,0],'lm');
  T(`刻印碎片 ${SAVE.shards}　金幣 ${SAVE.gold.toLocaleString('en-US')}`,1140,148,FN(15),[255,226,120],2,[0,0,0],'rm');
  m21Grid(inp,m21Cands());
  if(k!=='rr'){const fx=[[400,'A 目標'],[560,'B 材料']];fx.forEach(([x,l],i)=>{const on=(UI.foc||'A')===(i?'B':'A');if(btn(x,268,x+150,296,(on?'▶ ':'')+l,true,on?[255,236,150]:null)&&inp){UI.foc=i?'B':'A';UI.gs=0}});
    T(k==='inh'?'A＝要拿到符文的新裝備；B＝同部位、要被拆掉符文的舊裝備（會消耗）':'A＝要升級的裝備；B＝同部位、目標顏色的祭品（會消耗）',720,282,FN(13),[220,210,190],2,[0,0,0],'lm')}
  if(k==='rr')m21RR(inp,A);else if(k==='inh')m21Inh(inp,A,B);else m21Up(inp,A,B);
  if(UI.msg&&performance.now()-UI.msg[1]<2200)T(UI.msg[0],770,648,FS(17),UI.msg[2]||[150,255,150],2,[0,0,0],'mm');
  if(UI.res2){const age=(performance.now()-UI.res2.t0)/1000;if(age<1.6)m21Burst(UI.res2,age);else UI.res2=null}
  if(inp&&press(['Backspace','KeyX'])){UI.A=UI.B=null;UI.foc='A'}}
// 重洗刻印：一條詞條 or 符文（依部位抽）
function m21RR(inp,A){m21Sum(A,400,318,330,'目前');if(!A){T('先從上面選一件裝備（點兩下或 Enter）',900,420,FN(15),[220,210,190],2,[0,0,0],'mm');return}
  const rows=A.lines.map((l,i)=>['line',i]);if(A.rune||A.r>=1)rows.push(['rune']);if(!rows.length){T('這件白裝沒有詞條或符文可以重洗',950,420,FN(15),[220,210,190],2,[0,0,0],'mm');return}UI.rsel=clamp(UI.rsel||0,0,rows.length-1);
  T('選擇要重洗的項目：',760,314,FN(14),[214,172,84],2,[0,0,0],'lm');
  rows.forEach((r,i)=>{const y=330+i*40;const on=i===UI.rsel;let txt;if(r[0]==='line'){const [id,v]=A.lines[r[1]];const L=LINES.find(l=>l[0]===id);txt=`詞條：${L[1]} +${v}%`}else txt=A.rune?`符文：${A.rune.n}`:'符文：（無）→ 加一顆';
    if(btn(760,y,1140,y+34,(on?'▶ ':'')+txt,true,on?[255,236,150]:null)&&inp)UI.rsel=i});
  const r=rows[UI.rsel];const cost=r[0]==='line'?RR_LINE:RR_RUNE;const pool=r[0]==='line'?LINES.filter(l=>!((A.t==='r')&&l[0]==='crit')&&!A.lines.some((x,j)=>x[0]===l[0]&&j!==r[1])).map(l=>l[1]):Object.keys(RUNES).filter(n=>RUNES[n][0].includes(A.t)&&RUNES[n][3]!=='j');
  const y2=330+rows.length*40+6;T('之後：從這些隨機抽一個（數值也隨機）',760,y2,FN(13),[200,190,170],2,[0,0,0],'lm');wrapT(pool.join('、')+(r[0]==='rune'?'（另有 6% 是搞笑符文）':''),FN(13),380).slice(0,4).forEach((l,i)=>T(l,760,y2+20+i*18,FN(13),[150,230,255],2,[0,0,0],'lm'));
  if((btn(760,596,1140,636,`重洗（碎片 ${cost.sh}＋${cost.g.toLocaleString('en-US')} 金幣）`,true,[255,200,90])&&inp)||(inp&&press(['Space']))){if(!m21Pay(cost.sh,cost.g))return;
    if(r[0]==='line'){const pk=RCH(pool),L=LINES.find(l=>l[1]===pk);const ls=A.t==='w'?1:LSC;A.lines[r[1]]=[L[0],Math.max(0.1,Math.round(RR(L[2],L[3])*ls*10)/10)];UI.msg=[`新詞條：${L[1]} +${A.lines[r[1]][1]}%`,performance.now()]}
    else{const g=A.rune?A.rune.g:(Math.random()<0.15?0:Math.random()<0.41?1:2);A.rune={n:rollRune(A.t),g};UI.msg=[`新符文：${A.rune.n}`,performance.now(),RUNES[A.rune.n][3]==='j'?[255,150,200]:null]}
    sfx('crit',0.4);calcGS();m2Save()}}
// 賦魔繼承：B 的符文 → A（同部位）。B 一定消耗；成功率 70%
function m21Inh(inp,A,B){m21Sum(A,400,318,230,'A 目前');m21Sum(B,610,318,230,'B 材料（會消耗）');let P=null;if(A&&B&&B.rune){P=m21Clone(A);P.rune=m21Clone(B.rune)}m21Sum(P,880,318,260,'成功後的 A');
  T('→',860,420,FS(28),[255,236,150],3,[0,0,0],'mm');T(`成功率 ${INH.rate}%　失敗：B 一樣會消耗、A 不變`,640,552,FN(14),[255,190,140],2,[0,0,0],'lm');
  if(A&&A.rune)T('※ A 原本的符文會被取代',640,575,FN(13),[255,160,140],2,[0,0,0],'lm');
  const ok=A&&B&&B.rune&&A.t===B.t;if((btn(640,592,1140,636,`繼承（碎片 ${INH.sh}＋${INH.g.toLocaleString('en-US')} 金幣）`,!!ok,[200,150,255])&&inp)||(ok&&inp&&press(['Space']))){if(isEq(B)){UI.msg=['裝備中的不能當材料',performance.now()];return}if(!m21Pay(INH.sh,INH.g))return;
    const win=Math.random()*100<INH.rate;SAVE.inv=SAVE.inv.filter(i=>i!==B);UI.B=null;if(win){A.rune=m21Clone(B.rune);UI.msg=[`繼承成功！${A.rune.n} 移到 ${itName(A)}`,performance.now()];sfx('crit',0.5)}else{UI.msg=['繼承失敗……材料消失了',performance.now(),[255,160,140]];sfx('clank',0.5)}
    UI.res2={ok:win,t0:performance.now(),it:A,txt:win?'繼承成功':'繼承失敗'};calcGS();m2Save()}}
// 品階提升：綠→藍(★2)、藍→紫；祭品＝同部位、目標顏色；失敗不毀裝（祭品消耗）、保底
function m21UpPreview(A){const U=UPG[A.r];if(!U)return null;const P=m21Clone(A);const k=RAR[U.to].sc/RAR[A.r].sc;P.r=U.to;
  if(P.t==='w'){P.lo=Math.round(A.lo*k*(U.to===4?1.1:1));P.hi=Math.round(A.hi*k)}else{P.v=Math.round(A.v*k*10)/10;if(A.v2!=null)P.v2=Math.round(A.v2*k*10)/10}
  P.lines=A.lines.map(([id,v])=>[id,Math.round(v*1.25*10)/10]);if(P.rune&&RUNES[P.rune.n]&&RUNES[P.rune.n][3]!=='j')P.rune.g=Math.max(0,P.rune.g-1);return P}
function m21Up(inp,A,B){m21Sum(A,400,318,230,'A 目前');m21Sum(B,610,318,230,'B 祭品（會消耗）');const P=A&&m21UpPreview(A);m21Sum(P,880,318,260,'成功後的 A');T('→',860,420,FS(28),[255,236,150],3,[0,0,0],'mm');
  if(!A){return}const U=UPG[A.r];if(!U){T('只有 綠／藍 色裝備可以提升',640,560,FN(14),[255,190,140],2,[0,0,0],'lm');return}
  const p=(A.upP||0);const sure=p>=U.pity;T(`成功率 ${U.rate}%　保底 ${p}/${U.pity}${sure?'（下次必成功）':''}　失敗：A 不會壞、祭品消耗、保底 +1`,640,556,FN(14),sure?[255,210,90]:[255,190,140],2,[0,0,0],'lm');
  if(P&&RAR[U.to].ln>A.lines.length)T('成功時另外加 1 條隨機詞條',400,556,FN(13),[150,230,255],2,[0,0,0],'lm');
  const ok=A&&B&&B.t===A.t&&colOf(B.r)===colOf(U.to);if((btn(640,592,1140,636,`提升（碎片 ${U.sh}＋${U.g.toLocaleString('en-US')} 金幣）`,!!ok,[255,170,60])&&inp)||(ok&&inp&&press(['Space']))){if(isEq(B)){UI.msg=['裝備中的不能當祭品',performance.now()];return}if(!m21Pay(U.sh,U.g))return;
    SAVE.inv=SAVE.inv.filter(i=>i!==B);UI.B=null;const win=sure||Math.random()*100<U.rate;
    if(win){const Pv=m21UpPreview(A);Object.assign(A,Pv);A.upP=0;if(RAR[A.r].ln>A.lines.length){const pool=LINES.filter(l=>!(A.t==='r'&&l[0]==='crit')&&!A.lines.some(x=>x[0]===l[0]));if(pool.length){const L=RCH(pool);A.lines.push([L[0],Math.max(0.1,Math.round(RR(L[2],L[3])*(A.t==='w'?1:LSC)*10)/10)])}}
      if(A.t==='w'&&!A.el)A.el=RCH(Object.keys(ELS));UI.msg=[`品階提升成功！${RAR[A.r].n} ${RAR[A.r].st}`,performance.now(),[255,220,120]];sfx('crit',0.6)}
    else{A.upP=p+1;UI.msg=[`提升失敗（保底 ${A.upP}/${U.pity}）`,performance.now(),[255,160,140]];sfx('clank',0.5)}
    UI.res2={ok:win,t0:performance.now(),it:A,gold:true,txt:win?'品階提升成功':'品階提升失敗'};calcGS();m2Save()}}
window.m2UI=(o=>(k,n)=>{o(k,n);UI.A=UI.B=null;UI.foc='A';UI.gs=0;UI.res2=null})(window.m2UI);
// ==== f_fx2.js
// ---------- 強化成功／失敗（參考 stage2_ref：中央武器、光束楔形、泛光、火花；失敗＝暗環、裂紋、煙） ----------
function m21Burst(r,age){const cx=640,cy=330;const a=age<1.2?1:(1.6-age)/0.4;const gold=(r.lv||0)>=10||r.gold;const P0=gold?PAL.gold:PAL.blue;
  X.save();X.globalAlpha=a*0.6;X.fillStyle='#000';X.fillRect(110,70,1060,590);X.restore();
  const wp=r.it||eqItem('w');
  if(r.ok){const k=Math.min(1,age/0.35);bloom(cx,cy,300*k+60,P0[2],0.55*a);
    const [c,x]=pxc(320,280);// 光束：三層色階楔形
    for(let i=0;i<12;i++){const an=i/12*Math.PI*2+age*0.5+(i%2)*0.12,len=(28+50*k)*(i%3?1:1.3);pwedge(x,160,140,an,len,0.16,P0[1],0.55*a);pwedge(x,160,140,an,len*0.82,0.09,P0[2],0.7*a);pwedge(x,160,140,an,len*0.6,0.04,P0[3],0.85*a)}
    bring(x,160,140,10+50*k,8*(1-k)+2,[P0[1],P0[2],P0[3],P0[4]],0.62,a*(1-k*0.6));bdisc(x,160,140,16*(1-k*0.5)+4,[P0[2],P0[3],P0[4]],0.62,a);
    for(let i=0;i<22;i++){const an=m21H(i,2)*Math.PI*2,rr=12+80*k*(0.4+0.7*m21H(i,4)),fl=Math.floor(age*14+i)%3;if(fl===0)continue;pspark(x,160+Math.cos(an)*rr,140+Math.sin(an)*rr*0.7-age*12,[255,255,255],P0[3],i%4===0)}
    pxOut(c,cx,cy,1,'lighter');
    if(wp){X.save();X.globalAlpha=a;X.translate(cx,cy);X.imageSmoothingEnabled=false;X.drawImage(gearIconC(wp),-48,-48,96,96);X.restore()}
    if(age<0.15)bloom(cx,cy,180,[255,255,255],0.8*(1-age/0.15));
    T(r.txt||(`+${r.lv} 強化成功`+(r.sure?'（保底）':'')),cx,cy+130,FS(38),gold?[255,210,90]:[160,215,255],4,[0,0,0],'mm',a)}
  else{const k=Math.min(1,age/0.5);const sh=age<0.3?Math.round(Math.sin(age*80)*5):0;
    if(wp){X.save();X.globalAlpha=a;X.translate(cx+sh,cy);X.imageSmoothingEnabled=false;X.filter='brightness(0.55) saturate(0.4)';X.drawImage(gearIconC(wp),-48,-48,96,96);X.restore()}
    const [c,x]=pxc(200,140);
    bring(x,100,70,22+26*k,14*(1-k*0.5)+4,[PAL.dark[0],PAL.dark[1],PAL.dark[2],[110,70,60]],0.8,a*0.9);// 暗色甜甜圈
    for(let j=0;j<5;j++){let px=100,py=70;const an0=j/5*Math.PI*2+0.4;for(let i=0;i<Math.floor(4+10*k);i++){const an=an0+(m21H(i,j)-0.5)*0.9;px+=Math.cos(an)*2;py+=Math.sin(an)*2;
      x.fillStyle=rgb([20,14,18]);x.fillRect(Math.round(px),Math.round(py),2,2);x.fillStyle=rgb([150,120,110]);x.fillRect(Math.round(px)+1,Math.round(py)-1,1,1)}}// 裂紋：兩色階梯像素
    for(let i=0;i<9;i++){const u=(age*0.9+m21H(i,6))%1;const ox=(m21H(i,8)-0.5)*70,oy=-u*50;bdisc(x,100+ox+Math.sin(u*6+i)*4,70+oy,4+9*u,PAL.smoke,0.8,a*0.7*(1-u))}// 煙
    for(let i=0;i<5;i++){const u=age*1.4+m21H(i,1);if(u>1)continue;pdiam(x,100+(m21H(i,3)-0.5)*40,70+u*30,1,[[90,40,20],[200,90,30]])}// 落下餘燼
    pxOut(c,cx+sh,cy);
    T(r.txt||`+${r.lv} 強化失敗`,cx,cy+130,FS(38),[200,200,210],4,[0,0,0],'mm',a);if(!r.txt)T('刻印能量 +1',cx,cy+170,FN(18),[110,180,255],2,[0,0,0],'mm',a)}}
window.forgeBurst=r=>{const age=(performance.now()-r.t0)/1000;if(age>1.6)return;m21Burst(r,age)};
// ==== g_misc.js
// ---------- 暫停選單／設定 ----------
function m21CamIcon(x,y,on){const [c,g]=pxc(16,12);g.fillStyle=rgb([40,40,48]);g.fillRect(1,3,11,8);g.fillStyle=rgb([90,92,104]);g.fillRect(2,4,9,6);g.fillStyle=rgb([150,154,168]);g.fillRect(2,4,9,1);
  g.fillStyle=rgb([40,40,48]);g.fillRect(12,4,3,6);g.fillStyle=rgb([90,92,104]);g.fillRect(13,5,2,4);g.fillStyle=rgb([20,20,26]);g.fillRect(4,5,5,4);g.fillStyle=rgb([110,170,230]);g.fillRect(5,6,3,2);g.fillStyle=rgb([230,245,255]);g.fillRect(5,6,1,1);
  g.fillStyle=rgb(on?[255,60,50]:[120,30,30]);g.fillRect(2,1,3,2);if(on){g.fillStyle=rgb([255,180,170]);g.fillRect(2,1,1,1)}pxOut(c,x,y)}
function m21OptRows(x0,y0,inp){const o=SAVE.opt;let hit=false;const rows=[[`音樂：${o.mus?'開':'關'}`,()=>m21Mute('mus'),o.mus?[150,255,150]:[255,150,140]],[`音效：${o.sfx?'開':'關'}`,()=>m21Mute('sfx'),o.sfx?[150,255,150]:[255,150,140]],
    [REC.on?'停止錄影（F9）':'開始錄影（F9）',()=>REC.on?m21RecStop():m21RecStart(),REC.on?[255,120,110]:[255,236,200]],['匯出存檔',()=>m21Export(),null],['匯入存檔',()=>m21Import(),null]];
  rows.forEach(([l,f,c],i)=>{const y=y0+i*50;if(btn(x0,y,x0+300,y+42,l,true,c)&&inp){f();hit=true}if(i===2)m21CamIcon(x0+30,y+21,REC.on)});return hit}
function m21Pause(){rrect(440,120,840,640,12,'rgba(16,10,8,0.94)',rgb(GOLDC),3);T('暫停',640,166,FS(44),[255,255,255],4,[0,0,0],'mm');
  if(btn(490,200,790,242,'繼續（Esc）',true)&&CLICK)paused=false;m21OptRows(490,252,true);
  if(btn(490,512,790,554,'放棄並回到地圖（Q）',true,[255,160,140])&&CLICK){m2ToMap();return}
  T('M 靜音　F9 錄影　影片存到遊戲資料夾的「錄影」（MP4）',640,590,FN(14),[220,210,190],2,[0,0,0],'mm');if(REC.srv===false)T('（瀏覽器模式：錄完會用下載的方式存）',640,612,FN(12),[200,190,170],2,[0,0,0],'mm')}
function m21SetUI(inp){woodPanel(340,110,940,640);T('設定',640,160,FS(36),[255,236,200],3,[0,0,0],'mm');m21OptRows(490,200,inp);T('Esc 關閉',640,600,FN(15),[220,210,190],2,[0,0,0],'mm')}
// ---------- 說明頁（新版，含新動作） ----------
window.drawManual=()=>{X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.35;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
  rrect(100,26,1180,700,14,'rgba(16,10,8,0.92)',rgb(GOLDC),3);T('設定・操作說明',640,64,FS(32),[255,236,200],4,[60,20,10],'mm');
  const rows=[['移動','方向鍵 / WASD（上下＝縱深）','左搖桿'],['攻擊','J（或 Z）連按＝三段連擊；第三段上挑累積節奏','X'],['跳躍','Space；空中按 J＝下劈','A'],
    ['肩撞','同一個方向連按兩下（← ← 或 → →）：衝撞＋暈眩 1.2 秒（冷卻 3.5 秒）','—'],['踱地','↓ 連按兩下：震地＋範圍緩速 40%（3 秒，冷卻 6 秒）','—'],
    ['心臟刺擊','K：節奏 2，突刺單體並造成出血','B'],['大劍術','L（或 X）：節奏 ≥3＝斬風；不足＝大地橫掃','Y'],['召喚詩人','V：食物 3/3 時召喚','LB'],
    ['互動','E（或 F）：礦坑入口、女神像、搗蛋鬼／貓商人','RB'],['背包','I：裝備／賣掉 X／分解 C／全部賣掉綠色 G／藥水 U 搗蛋鬼・Y 惡魔貓','—'],
    ['變身','背包用藥水（搗蛋鬼／惡魔貓，純外觀＋小被動）；T 解除，死亡也會變回','—'],['靜音','M：全部靜音（暫停選單可分開關音樂／音效）','—'],['錄影','F9 或右上相機按鈕：開始／停止錄影','—'],['暫停','Esc（或 P）　全螢幕 F11','Back']];
  T('動作',150,96,FN(15),[255,210,140],2,[0,0,0],'lm');T('鍵盤',300,96,FN(15),[255,210,140],2,[0,0,0],'lm');T('手把',1080,96,FN(15),[255,210,140],2,[0,0,0],'lm');
  rows.forEach(([a,b,c],i)=>{const y=124+i*29;T(a,150,y,FS(17),[255,244,214],2,[0,0,0],'lm');T(b,300,y,FN(15),[235,230,220],2,[0,0,0],'lm');T(c,1080,y,FN(15),[200,230,255],2,[0,0,0],'lm')});
  const o=SAVE&&SAVE.opt||{mus:1,sfx:1};const B=[[150,`音樂：${o.mus?'開':'關'}`],[330,`音效：${o.sfx?'開':'關'}`],[510,'匯出存檔'],[690,'匯入存檔']];
  B.forEach(([x,l])=>btn(x,560,x+170,600,l,true));T('刻印碎片：分解裝備得到，用在 強化、重洗刻印、賦魔繼承、品階提升',150,624,FN(14),[220,214,200],2,[0,0,0],'lm');
  T('Esc / Enter 回標題',640,668,FS(18),[255,255,255],3,[0,0,0],'mm')};
function m21Manual(){if(!CLICK||!SAVE)return false;const A=[[150,()=>m21Mute('mus')],[330,()=>m21Mute('sfx')],[510,()=>m21Export()],[690,()=>m21Import()]];
  for(const [x,f] of A)if(inBox(CLICK,[x,560,x+170,600])){f();CLICK=null;return true}return false}
// ---------- HUD：肩撞／踱地 冷卻、相機按鈕、變身標記 ----------
window.drawHUD=(o=>(cx0,shy)=>{o(cx0,shy);const s=S0,P=s.P,t=s.t;if(!P)return;
  const B=[[872,'肩撞','→→',P.chgCD||0,CHG.cd*(1-(GS.mvcd||0)),s.denyChg],[934,'踱地','↓↓',P.stpCD||0,STP.cd*(1-(GS.mvcd||0)),s.denyStp]];
  for(const [x,l,k,cd,mx,deny] of (HEROK==='archer'?[]:B)){const y=604,r=24,rdy=cd<=0;circ(x,y,r,rdy?'rgba(70,46,26,0.92)':'rgba(30,24,20,0.85)',rdy?'rgb(255,214,140)':'rgb(120,100,80)',3);
    if(!rdy){X.save();X.beginPath();X.moveTo(x,y);X.arc(x,y,r-3,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,cd/mx));X.closePath();X.fillStyle='rgba(0,0,0,0.55)';X.fill();X.restore()}
    T(l,x,y-2,FS(15),rdy?[255,244,214]:[170,160,150],2,[0,0,0],'mm');T(k,x,y+r+6,FN(11),[220,210,190],2,[0,0,0],'mm');if(deny&&t-deny<0.3)circ(x,y,r+3,null,'rgb(255,90,70)',2)}
  const cx=1248,cy=64;circ(cx,cy,17,REC.on?'rgba(120,20,20,0.9)':'rgba(30,24,20,0.85)',REC.on?'rgb(255,120,110)':'rgb(200,170,120)',2);m21CamIcon(cx,cy,REC.on&&Math.floor(t*2)%2===0);
  if(MOUSE&&Math.hypot(MOUSE[0]-cx,MOUSE[1]-cy)<18)T(REC.on?'停止錄影 F9':'錄影 F9',cx-24,cy,FN(13),[255,255,255],2,[0,0,0],'rm');
  if(!paused&&CLICK&&Math.hypot(CLICK[0]-cx,CLICK[1]-cy)<18){REC.on?m21RecStop():m21RecStart();CLICK=null}
  if(SAVE.tf&&TFS[SAVE.tf])m21TfBuff(1248,92);
  if(!SAVE.opt.mus||!SAVE.opt.sfx)T(!SAVE.opt.mus&&!SAVE.opt.sfx?'靜音':!SAVE.opt.mus?'音樂關':'音效關',1222,64,FN(12),[255,190,170],2,[0,0,0],'rm')})(window.drawHUD);
// ---------- NPC 位置：空地中段、在道具／女神像前面 ----------
function m21NpcSpot(n){const s=S0,P=s.P;const y=Math.round((YMIN+YMAX)/2)+6;if(n==='shrine')return [P.x<640?1010:270,y];let x=clamp(P.x+300,200,WW-200);if(n==='canyon'&&x>CAVE.x0-120&&x<CAVE.x1+120)x=CAVE.x0-160;return [x,y]}
function m21NpcKey(n){const s=S0;return s.stage==='shrine'?Math.max(n.y,STATUE.y+1):n.y}
// ---------- 每幀 ----------
window.m2Step=(o=>dt=>{o(dt);m21Step(dt)})(window.m2Step);
function m21Step(dt){const s=S0,t=s.t,P=s.P;m21StepFx(dt);const D=DIF();
  if(D.tele&&D.tele<1)for(const c of s.tele){if(c.__tc)continue;c.__tc=1;if(c.t1>t)c.t1=c.t0+(c.t1-c.t0)*D.tele}
  if(press(['KeyT'])&&mode==='play'&&!paused){if(SAVE.tf)m21Transform(0);else m21Toast('在背包（I）使用變身藥水：U 搗蛋鬼／Y 惡魔貓')}
  if(SAVE.tf&&S0.P&&S0.P.dead)m21Transform(0,true);
  for(const m of s.mobs){if(m.gone)continue;
    if(m.polyU){if(t<m.polyU&&!m.dying){if(m.state==='walk'){m.state='stun';m.stun=m.polyU;m.vx=0}m.wind=0}else{m.skin=m.skin0;m.skin0=null;m.polyU=0;puff(m.x,m.y-40,8,[240,240,240],40,0.4,3)}}
    if(m.fearU){if(t<m.fearU&&!m.dying&&m.state==='stun'){if(t>(m.fearN||0)){m.fearN=t+0.35;m.fdir=-(m.fdir||1)}m.vx=m.fdir*150;m.y=clamp(m.y+Math.sin(t*9+m.id)*40*dt,YMIN,YMAX)}else if(t>=m.fearU)m.fearU=0}}
  for(const b of s.bans||[]){if(b.used)continue;for(const m of s.mobs){if(m.gone||m.dying||m.kind==='boss'||m.kind==='pillar')continue;if(Math.abs(m.x-b.x)<26&&Math.abs(m.y-b.y)<16&&m.state==='walk'){b.used=t;m.state='stun';m.stun=t+0.8;m.vx=m.face*-200;m.dizzy=t+0.8;proc('滑倒',[255,220,60],'蕉');sfx('jump',0.3);break}}}
  s.bans=(s.bans||[]).filter(b=>!b.used||t-b.used<0.4);if(s.bans.length>6)s.bans.shift();
  if(P&&!P.dead){
    if(GS.regen&&t>(P.rgT||0)){P.rgT=t+10;if(P.hp<HPMAX&&P.hp>0){const v=Math.round(HPMAX*GS.regen);P.hp=Math.min(HPMAX,P.hp+v);proc('活力 +'+v,[90,200,90],'活')}}
    const moving=held(['ArrowLeft','KeyA','ArrowRight','KeyD','ArrowUp','KeyW','ArrowDown','KeyS'])&&!P.act&&P.h<=0;
    if(moving&&GS.jk){if(GS.jk['噗噗褲']&&t>(P.fartT||0)){P.fartT=t+U(0.7,1.3);s.fx.push({k:'fart',x:P.x-30*P.face,y:P.y-30,t0:t,f:P.face});if(Math.random()<0.3)sfx('jump',0.15)}
      if(GS.jk['吱吱鞋']&&t>(P.sqT||0)){P.sqT=t+0.42;s.fx.push({k:'squeak',x:P.x+U(-10,10),y:P.y-6,t0:t})}}
    if(GS.jk&&GS.jk['噴嚏']&&t>(P.snzT||(P.snzT=t+U(20,40)))){P.snzT=t+U(25,50);s.fx.push({k:'sneeze',x:P.x+40*P.face,y:P.y-120,t0:t,f:P.face});s.callout={t0:t,txt:'哈啾！'}}
    if(GS.talk&&t>(P.talkT||(P.talkT=t+12))){P.talkT=t+28;s.talkB=1;sub('苦達斯',CH(['為什麼石頭人不會游泳？因為他太「石」在了。','礦坑裡的蝙蝠都很「洞」事。','我的劍很重，可是我的笑話更冷。','搗蛋鬼說敲樹就能強化……我信了。','你知道哥布林最怕什麼嗎？加班。']),2.6)}
    const air=P.h>0&&P.vh>0;if(air&&!P.wasAir&&GS.jgold&&!(P.act&&P.act.type==='stomp')&&t>(P.jgT||0)){P.jgT=t+0.5;m2Gold(Math.round(GS.jgold));s.fx.push({k:'jgold',x:P.x,y:P.y-150,t0:t})}P.wasAir=air}}
// 跑速（移動速度）：在 stepPlayer 外面放大自由移動的位移
window.stepPlayer=(o=>dt=>{const s=S0,P=s.P,t=s.t;const x0=P.x,y0=P.y,a0=P.act;const af=P.aftrU>t;if(af)GS.aspd+=GS.aftr;const rh0=P.rh;
  try{o(dt)}finally{if(af)GS.aspd-=GS.aftr}
  if(GS.ms&&!a0&&!P.act&&!P.dead&&!m2Down()){const lo=s.lock?s.cam+40:30,hi=s.lock?s.cam+W-40:WW-30;P.x=clamp(x0+(P.x-x0)*(1+GS.ms),lo,hi);P.y=clamp(y0+(P.y-y0)*(1+GS.ms),YMIN,YMAX)}
  if(GS.rhy&&P.rh>rh0&&P.rh<RHMAX&&rnd()<GS.rhy){P.rh++;proc('節奏加成',[230,80,60],'節')}})(window.stepPlayer);
// 受傷：閃避／殘像／抗倒地／根性／反擊／香蕉皮
window.m2Hurt=(o=>(v,x)=>{const s=S0,P=s.P,t=s.t;if(t<(P.invU||0)||P.chgIF>t)return o(v,x);
  if(GS.dodge&&rnd()<GS.dodge){P.invU=t+0.25;proc('閃避',[120,200,255],'閃');if(GS.aftr)P.aftrU=t+2;return 0}
  const d0=P.downU||0;const r=o(v,x);if(!r)return r;
  if((P.downU||0)>d0&&P.downU>t){if(GS.kdr&&rnd()<GS.kdr){P.downU=0;P.hc=0;proc('抗倒地',[200,160,90],'穩')}else if(GS.grit){const h=Math.round(HPMAX*GS.grit);P.hp=Math.min(HPMAX,P.hp+h);proc('根性 +'+h,[255,140,80],'根')}}
  if(GS.ctr&&rnd()<GS.ctr&&P.hp>0){let n=0;for(const m of s.mobs){if(m.gone||m.dying||m.kind==='pillar'||m.kind==='boss')continue;if(Math.abs(m.x-P.x)<170&&Math.abs(m.y-P.y)<70){m.state='stun';m.stun=t+0.8;m.dizzy=t+0.8;m.vx=Math.sign(m.x-P.x||1)*420;n++}}
    if(n){s.fx.push({k:'ctr',x:P.x,y:P.y,t0:t});proc('反擊',[255,120,60],'反');shake(5,0.15)}}
  if(GS.ban&&rnd()<GS.ban)(s.bans=s.bans||[]).push({x:P.x-20*P.face,y:P.y+4,t0:t});
  return r})(window.m2Hurt);
// 傷害：詠唱／技能傷害、話癆
window.m2Dmg=(o=>(v,m,mv,crit)=>{let r=o(v,m,mv,crit);if(mv==='pet')return r;const s=S0;
  if(GS.skd&&['wind','slam','stab','chg','stomp'].includes(mv))r=Math.round(r*(1+GS.skd));
  if(s.talkB&&GS.talk){s.talkB=0;r=Math.round(r*(1+GS.talk));proc('冷笑話加成',[255,150,200],'話')}return r})(window.m2Dmg);
// 命中：雷擊、嚇破膽、變羊、變鼠
window.m2OnHit=(o=>(m,mv,v,crit,hy)=>{o(m,mv,v,crit,hy);if(mv==='pet'||mv==='thun')return;const s=S0,t=s.t;if(m.gone||m.dying||m.kind==='pillar')return;
  if(GS.thun&&rnd()<GS.thun){const d=Math.max(1,Math.round(v*0.5));applyDmg(m,d);dmgNum(m,d,'雷擊',30);s.fx.push({k:'bolt',x:m.x,y:m.y,t0:t,top:m.kind==='boss'?m.y-320:m.y-m.h-170});sfx('crit',0.25)}
  if(m.kind==='boss'||m.dying)return;
  if(GS.fear&&rnd()<GS.fear&&!m.polyU){m.fearU=t+1;m.state='stun';m.stun=t+1;m.fdir=Math.sign(m.x-s.P.x)||1;proc('嚇破膽',[200,160,255],'嚇')}
  const pk=GS.sheep&&rnd()<GS.sheep?['sheep',2]:GS.mouse&&rnd()<GS.mouse?['mouse',1.5]:null;
  if(pk&&!m.polyU){m.skin0=m.skin||null;m.skin=pk[0];m.polyU=t+pk[1];m.state='stun';m.stun=m.polyU;m.vx=0;s.fx.push({k:'poof',x:m.x,y:m.y,t0:t});proc(pk[0]==='sheep'?'變羊術':'變鼠術',[255,200,230],pk[0]==='sheep'?'羊':'鼠')}})(window.m2OnHit);
// 律動：放技能後機率返還 1 節奏
window.m2Act=(o=>type=>{o(type);if(['wind','slam','stab'].includes(type)&&GS.rhret&&rnd()<GS.rhret)setTimeout0(0.35,()=>{const P=S0.P;if(P.rh<RHMAX){P.rh++;proc('律動',[230,80,60],'律')}})})(window.m2Act);
// 臭襪子
window.mobDie=(o=>m=>{const was=m.dying;o(m);if(!was&&GS.sock&&m.kind!=='boss'&&m.kind!=='pillar'&&rnd()<GS.sock)lootPush('sock',m)})(window.mobDie);
ITEMN.sock='臭襪子';
function m21Sock(){m2Gold(30);const s=S0;if(s)s.log.push([s.t,'sock','撿到 臭襪子（+30 金幣）'])}
window.m2Assets=(o=>()=>[...o(),'i_sock'])(window.m2Assets);
// 大影子
window.shadowE=(o=>(sx,sy,w,h)=>{if(w===40&&GS.jk&&GS.jk['大影子'])w=60;return o(sx,sy,w,h)})(window.shadowE);
// ==== h_fx3.js
// ---------- 搞笑符文／新符文的像素特效（分層色階、不用單線） ----------
const SHEEPPX=(()=>{const P={o:[40,34,40],w:[246,244,236],W:[214,210,200],s:[170,164,156],f:[60,50,56],F:[110,96,100],p:[240,170,180],'.':null};
  const S=["....wWw.....","..wwWWWw.oo.",".wwwwWWWwoFo","wwwwwwWWWfpf","wwwwwwWWWWff","WwwwwWWWWs..",".WWWWWsss...","..f.f..f.f..","..F.F..F.F.."];return S})();
const MOUSEPX=(()=>["..........oo","...oooo..oPPo",".oGGGGGo.oGo.","oGgggggGGGGoo","oGggggggGGGeo","oGGgggggGGGGo",".oGGGGGGGGoo.","rr.o.o..o.o..","r............"])();
const PIXC={};
function m21PixSpr(key,S,P){if(PIXC[key])return PIXC[key];const w=Math.max(...S.map(r=>r.length)),h=S.length;const [c,x]=mk(w,h);S.forEach((r,y)=>{for(let i=0;i<r.length;i++){const col=P[r[i]];if(col){x.fillStyle=rgb(col);x.fillRect(i,y,1,1)}}});return PIXC[key]=c}
window.spr=(o=>(n,sx,sy,op={})=>{if(n.startsWith('sheep_')||n.startsWith('mouse_')){const sh=n[0]==='s';
    const c=sh?m21PixSpr('sheep',SHEEPPX,{o:[40,34,40],w:[246,244,236],W:[214,210,200],s:[170,164,156],f:[60,50,56],F:[110,96,100],p:[240,170,180]})
      :m21PixSpr('mouse',MOUSEPX,{o:[36,30,34],G:[120,116,124],g:[170,166,172],P:[240,160,170],e:[20,16,20],r:[230,150,160]});
    const z=sh?5:4,t=S0.t,hop=Math.floor(t/0.18)%2;X.save();X.imageSmoothingEnabled=false;X.translate(Math.round(sx),Math.round(sy+(op.dy||0)*SS));if(op.flip)X.scale(-1,1);
    X.drawImage(c,-c.width*z/2,-c.height*z-hop*3,c.width*z,c.height*z);if(op.flash){X.globalCompositeOperation='lighter';X.globalAlpha=0.5;X.drawImage(c,-c.width*z/2,-c.height*z-hop*3,c.width*z,c.height*z)}X.restore();return}
  return o(n,sx,sy,op)})(window.spr);
// 怪物身上的 m.h 是空中高度；在 drawWorld 傳進來的 sy=m.y-m.h+shy（腳底），所以上面直接畫在腳底上方
function m21DrawJoke(SX,shy){const s=S0,t=s.t;
  for(const b of s.bans||[]){const sx=SX(b.x),sy=b.y+shy;const [c,x]=pxc(16,8);const Y=[[120,90,20],[230,190,40],[255,236,120]];x.fillStyle=rgb(Y[0]);x.fillRect(2,4,12,3);x.fillStyle=rgb(Y[1]);x.fillRect(3,3,10,3);x.fillStyle=rgb(Y[2]);x.fillRect(5,3,5,1);
    x.fillStyle=rgb(Y[1]);x.fillRect(1,5,2,2);x.fillRect(13,5,2,2);x.fillStyle=rgb([90,60,20]);x.fillRect(7,2,2,1);pxOut(c,sx,sy,b.used?1-(t-b.used)/0.4:1)}
  for(const m of s.mobs){if(m.gone||m.dying)continue;if(m.fearU>t){const sx=SX(m.x),sy=m.y-m.h-150+shy;const [c,x]=pxc(20,14);// 驚嚇：汗滴＋「!?」
      bdisc(x,4,8,3,[[60,110,200],[120,180,255],[220,240,255]],1.3,1);x.fillStyle=rgb([255,236,120]);x.fillRect(10,2,2,6);x.fillRect(10,10,2,2);x.fillStyle=rgb([200,120,30]);x.fillRect(12,2,1,6);
      x.fillStyle=rgb([255,236,120]);x.fillRect(14,2,4,2);x.fillRect(16,4,2,2);x.fillRect(15,6,2,2);x.fillRect(15,10,2,2);pxOut(c,sx+(Math.floor(t*10)%2?2:-2),sy)}}
  for(const e of s.fx){const age=t-e.t0;
    if(e.k==='fart'&&age<0.9){const k=age/0.9;const [c,x]=pxc(40,30);for(let i=0;i<4;i++){const u=Math.min(1,k*1.3+i*0.08);bdisc(x,14-e.f*i*4+i*2,18-i*3-k*6,4+6*u-i,[[90,120,40],[140,170,70],[190,210,120],[225,235,170]],0.8,(1-k)*0.85)}
      if(age<0.15)for(let i=0;i<3;i++)pdot(x,10+i*5,24,[110,140,50],2);pxOut(c,SX(e.x),e.y+shy)}
    if(e.k==='squeak'&&age<0.5){const k=age/0.5;rrect(SX(e.x)-16,e.y+shy-40-k*18,SX(e.x)+16,e.y+shy-18-k*18,6,`rgba(255,250,235,${1-k})`,`rgba(90,60,40,${1-k})`,2);T('吱',SX(e.x),e.y+shy-29-k*18,FN(13),[200,60,90],0,[0,0,0],'mm',1-k)}
    if(e.k==='sneeze'&&age<0.8){const k=age/0.8;const [c,x]=pxc(60,30);for(let i=0;i<7;i++){const u=k*(0.5+0.6*m21H(i,2));bdisc(x,6+e.f*0+u*48*(e.f>0?1:1),15+(m21H(i,5)-0.5)*14*u,3+4*u,[[170,200,210],[210,230,236],[245,250,252]],0.9,1-k)}pxOut(c,SX(e.x)+(e.f>0?60:-60),e.y+shy,1)}
    if(e.k==='jgold'&&age<0.7){const k=age/0.7;const [c,x]=pxc(14,14);bdisc(x,7,7,5,[[150,90,10],[230,170,40],[255,220,90],[255,250,200]],1,1);x.fillStyle=rgb([150,90,10]);x.fillRect(6,4,2,6);pxOut(c,SX(e.x),e.y+shy-k*40,1-k*k)}
    if(e.k==='bolt'&&age<0.32){const k=age/0.32;const sx=SX(e.x),y0=e.top+shy,y1=e.y+shy;const [c,x]=pxc(24,Math.ceil((y1-y0)/PXS)+4);const h=c.height;let px=12;
      for(let y=0;y<h-2;y+=3){const nx=12+Math.round((m21H(y,Math.floor(age*30))-0.5)*10);const a=Math.min(px,nx),b=Math.max(px,nx);x.fillStyle=rgb([90,80,220]);x.fillRect(a-2,y,b-a+5,4);x.fillStyle=rgb([170,190,255]);x.fillRect(a-1,y,b-a+3,3);x.fillStyle=rgb([255,255,255]);x.fillRect(a,y+1,b-a+1,1);px=nx}
      bdisc(x,12,h-3,6,[[90,80,220],[170,190,255],[255,255,255]],0.5,1);X.save();X.imageSmoothingEnabled=false;X.globalAlpha=1-k;X.drawImage(c,sx-c.width*PXS/2,y0,c.width*PXS,h*PXS);X.restore();bloom(sx,y1,80,[160,170,255],0.5*(1-k),0.5)}
    if(e.k==='ctr'&&age<0.45){const k=age/0.45;const [c,x]=pxc(130,50);bring(x,65,30,10+50*k,8*(1-k)+2,PAL.ember.concat([[255,236,190]]),0.4,1-k);for(let i=0;i<10;i++){const an=i/10*Math.PI*2;pspark(x,65+Math.cos(an)*(14+50*k),30+Math.sin(an)*(5+20*k),[255,255,255],[255,170,70],i%3===0)}pxOut(c,SX(e.x),e.y+shy-10)}}}
window.drawM2Fx=(o=>(SX,shy)=>{o(SX,shy);m21DrawJoke(SX,shy)})(window.drawM2Fx);
// ---------- 新部位圖示（褲子／鞋子／項鍊），衣服沿用舊盔甲、戒指沿用舊飾品 ----------
window.gearIconC=(o=>it=>{if(it.t==='b')return o(Object.assign({},it,{t:'a',id:'b'}));if(it.t==='r')return o(Object.assign({},it,{t:'c'}));if(it.t==='w'||it.t==='a'||it.t==='c')return o(it);
  const key=it.t+it.k+'_'+it.r;if(GIC[key])return GIC[key];const [c,x]=mk(20,20);const R=RAR[it.r];const px=(xx,yy,col)=>{x.fillStyle=rgb(col);x.fillRect(xx,yy,1,1)};
  x.fillStyle=rgb(R.bg);x.fillRect(1,1,18,18);for(let i=0;i<18;i++){x.fillStyle=rgb(R.bg.map(v=>Math.min(255,v+Math.round(i*1.6))));x.fillRect(1,1+i,18,1)}
  x.fillStyle=rgb(R.fr);x.fillRect(1,0,18,1);x.fillRect(1,19,18,1);x.fillRect(0,1,1,18);x.fillRect(19,1,1,18);x.fillStyle=rgb(R.fr.map(v=>Math.min(255,v+70)));x.fillRect(2,1,16,1);
  const TONES=[[[50,56,80],[80,92,130],[120,136,180],[170,186,220]],[[70,46,30],[120,80,48],[170,120,74],[214,170,120]],[[40,70,50],[70,112,80],[110,160,116],[170,210,160]],[[80,40,40],[130,64,60],[180,100,90],[226,160,140]],[[60,50,80],[100,84,130],[150,130,186],[200,186,230]]];
  const P=TONES[it.k%TONES.length];
  if(it.t==='p'){for(let y=4;y<17;y++){const g=y<7?0:1;for(let xx=5;xx<15;xx++){if(g&&xx>=9&&xx<=10)continue;const ed=xx===5||xx===14||(g&&(xx===8||xx===11));px(xx,y,ed?P[0]:xx<7?P[3]:xx>12?P[1]:P[2])}}for(let xx=5;xx<15;xx++)px(xx,4,[200,170,90]);px(9,5,[90,70,30]);px(10,5,[90,70,30])}
  else if(it.t==='s'){const sh=[[5,6,10],[6,6,10],[7,6,10],[8,6,10],[9,6,11],[10,5,13],[11,5,15],[12,4,16],[13,4,16],[14,4,16]];for(const [y,a,b] of sh)for(let xx=a;xx<b;xx++)px(xx,y,xx===a||xx===b-1||y===14?P[0]:xx<a+2?P[3]:y>12?P[1]:P[2]);
    for(let xx=4;xx<16;xx++)px(xx,15,[40,30,26]);px(7,5,P[3]);px(8,5,P[3]);px(11,10,[230,220,200]);px(12,11,[230,220,200])}
  else{const G=[[120,80,20],[200,150,40],[250,210,90],[255,245,190]];for(let i=0;i<=10;i++){const an=Math.PI*(0.08+0.84*i/10);px(Math.round(10-Math.cos(an)*6),Math.round(3+Math.sin(an)*7),i<5?G[2]:G[1])}
    const gem=[[200,40,60],[120,200,255],[255,90,90],[150,230,255],[220,120,255]][it.k%5];px(9,11,G[0]);px(10,11,G[0]);for(const [a,b,c2] of [[8,12,gem],[9,12,gem.map(v=>Math.min(255,v+60))],[10,12,gem],[11,12,gem.map(v=>v*0.7|0)],[8,13,gem.map(v=>v*0.7|0)],[9,13,gem],[10,13,gem],[11,13,gem.map(v=>v*0.6|0)],[9,14,gem.map(v=>v*0.6|0)],[10,14,gem.map(v=>v*0.5|0)]])px(a,b,c2)}
  GIC[key]=c;return c})(window.gearIconC);
// ==== i_chirp.js
// ---------- 變身搗蛋鬼：攻擊時的「嘰嘰」叫聲（純音效，不影響任何數值；打擊音照舊） ----------
const CHIRP={last:0,act:null};
function m21Chirp(big){if(!SAVE||!SAVE.opt||!SAVE.opt.sfx||!AC||AC.state!=='running')return;
  try{const t0=AC.currentTime+0.005,n=big?3+(Math.random()*2|0):1+(Math.random()<0.45?1:0);let t=t0;
    for(let i=0;i<n;i++){const d=big?(i===n-1?0.2:0.075):0.055+Math.random()*0.03;const f0=(big?1500:1250)*(0.85+Math.random()*0.35)*(1+i*0.12);
      const o=AC.createOscillator(),v=AC.createOscillator(),vg=AC.createGain(),g=AC.createGain();o.type='square';v.type='sine';v.frequency.value=big?34:26+Math.random()*12;vg.gain.value=f0*0.07;
      v.connect(vg);vg.connect(o.frequency);o.frequency.setValueAtTime(f0*0.8,t);o.frequency.exponentialRampToValueAtTime(f0*(big&&i===n-1?1.7:1.3),t+d*0.45);o.frequency.exponentialRampToValueAtTime(f0*(big&&i===n-1?1.15:0.95),t+d);
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(big?0.09:0.07,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
      const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;o.connect(lp);lp.connect(g);g.connect(AB.fx);o.start(t);v.start(t);o.stop(t+d+0.02);v.stop(t+d+0.02);t+=d+(big?0.02:0.025)}
  }catch(e){}}
// 惡魔貓：可愛的「喵」——三角波＋共振，音高先升後降，大招是拉長的「喵～嗚」
function m21Meow(big){if(!SAVE||!SAVE.opt||!SAVE.opt.sfx||!AC||AC.state!=='running')return;
  try{const t=AC.currentTime+0.005,d=big?0.42:0.2+Math.random()*0.06,f0=(big?760:900)*(0.9+Math.random()*0.25);
    const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),bp=AC.createBiquadFilter(),bp2=AC.createBiquadFilter(),m=AC.createGain();
    o.type='sawtooth';o2.type='triangle';o2.detune.value=8;
    for(const q of [o,o2]){q.frequency.setValueAtTime(f0*0.75,t);q.frequency.exponentialRampToValueAtTime(f0*1.25,t+d*0.3);q.frequency.exponentialRampToValueAtTime(f0*(big?0.7:0.85),t+d)}
    bp.type='bandpass';bp.Q.value=5;bp.frequency.setValueAtTime(900,t);bp.frequency.linearRampToValueAtTime(2200,t+d*0.3);bp.frequency.linearRampToValueAtTime(1100,t+d);// 「咪→啊→嗚」的口形
    bp2.type='bandpass';bp2.Q.value=3;bp2.frequency.value=3200;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(big?0.12:0.1,t+0.03);g.gain.setValueAtTime(big?0.1:0.08,t+d*0.6);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(bp);o2.connect(bp);o2.connect(bp2);m.gain.value=0.35;bp2.connect(m);bp.connect(g);m.connect(g);g.connect(AB.fx);o.start(t);o2.start(t);o.stop(t+d+0.02);o2.stop(t+d+0.02)}catch(e){}}
const CHIRP_BIG={up:1,stab:1,slam:1,wind:1,chg:1,stomp:1};
window.stepPlayer=(o=>function(...a){const r=o.apply(this,a);try{const s=S0,P=s&&s.P;const A=P&&P.act;
  if(A&&A!==CHIRP.act&&SAVE.tf&&mode==='play'){const big=!!CHIRP_BIG[A.type],now=performance.now(),gap=SAVE.tf===2?(big?300:520):(big?160:330);if(now-CHIRP.last>gap){CHIRP.last=now;CHIRP.n=(CHIRP.n||0)+1;(SAVE.tf===2?m21Meow:m21Chirp)(big)}}
  CHIRP.act=A||null}catch(e){}return r})(window.stepPlayer);
window.__chirp=m21Chirp;window.__meow=m21Meow;window.__chirpN=()=>CHIRP.n||0;
// ==== j_tfbonus.js
// ---------- 變身被動（唯一的數值差異）＋惡魔貓藥水掉落 ----------
const TFP2_MOB=0.0012,TFP2_BOSS=0.0096; // 惡魔貓變身藥水（極稀有；W1：+20%）
const TFB={gold:0.20,drop:0.03};          // 惡魔貓 金幣 +20%；搗蛋鬼 有色裝備（綠/藍/紫…，不含白）掉落率 +3%（加算）
window.m2Gold=(o=>function(a){if(SAVE&&SAVE.tf===2&&a>0)a=Math.round(a*(1+TFB.gold));return o(a)})(window.m2Gold);
window.m2Drop=(o=>function(m){const r=o.apply(this,arguments);
  if(SAVE&&SAVE.tf===1&&Math.random()<TFB.drop)lootPush('gear',m,{it:rollDrop(1)});   // rollDrop(1)：最低高級（綠），不會是白裝
  if(Math.random()<TFP2_MOB)lootPush('tfpot2',m);return r})(window.m2Drop);
window.m2BossLoot=(o=>function(m){const r=o.apply(this,arguments);
  if(SAVE&&SAVE.tf===1&&Math.random()<TFB.drop)lootPush('gear',m,{it:rollDrop(1),vx:U(-200,200)});
  if(Math.random()<TFP2_BOSS)lootPush('tfpot2',m,{vx:U(-200,200)});return r})(window.m2BossLoot);
// HUD 小 buff 圖示（右上，攝影機按鈕下方）
function m21TfBuff(x,y){const F=TFS[SAVE.tf];const w=30,x0=x-w;rrect(x0,y-14,x,y+16,6,'rgba(20,12,16,0.85)',rgb(F.col),2);
  X.save();X.imageSmoothingEnabled=false;X.drawImage(IMG[F.ic+'_big'],x0+2,y-12,26,26);X.restore();
  T(`${F.nm}　${F.bonus}`,x0-6,y-3,FN(13),F.col,2,[0,0,0],'rm');T('T 解除變身',x0-6,y+12,FN(11),[220,210,200],2,[0,0,0],'rm')}
// ==== k_title.js
// 標題畫面：預告角色（搗蛋鬼、惡魔貓在苦達兩側後方；詩人剪影＋「即將登場」）
function m21Has(n){const im=IMG['s_'+n];return !!(im&&im.width)}
function m21TitleBack(S,ly,t){const bob=Math.floor(t/0.4)%2,b2=Math.floor(t/0.4+0.5)%2;
  if(m21Has('prank_idle'))S('prank_idle',404,ly-16,{dy:b2,sc:0.9,filter:'brightness(0.82) saturate(0.9)'});
  if(m21Has('dcat_idle'))S('dcat_idle',884,ly-16,{dy:bob,sc:0.9,flip:true,filter:'brightness(0.82) saturate(0.9)'});}
function m21TitleBard(S,ly,t){const n='bard_play'+(Math.floor(t/0.22)%2),x=1046,y=ly-26;
  S(n,x,y,{flip:true,sc:0.92,glow:[255,206,120,200+Math.round(55*Math.sin(t*2.4))]});
  S(n,x,y,{flip:true,sc:0.92,filter:'brightness(0.06) sepia(1) saturate(2)',alpha:0.96});
  const tx=x,ty=ly+10;rrect(tx-52,ty-14,tx+52,ty+14,6,'rgb(150,30,30)','rgb(255,220,140)',2);T('即將登場',tx,ty,FN(15),[255,255,255],0,[0,0,0],'mm');
  T('？',tx+2,y-52,FS(30),[255,226,160],3,[40,20,10],'mm')}
window.drawTitle=(o=>function(){const S=window.spr,t=titleT||0;
  window.spr=function(n,x,y,op){if(n==='pet_idle')m21TitleBack(S,y-12,t);if(/^bard_play/.test(n)){m21TitleBard(S,y+6,t);return}return S(n,x,y,op)};
  try{return o.apply(this,arguments)}finally{window.spr=S}})(window.drawTitle);
