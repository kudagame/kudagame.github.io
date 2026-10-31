// M2.3 — 由 src23/*.js 合併（職業武器、像素 NPC、封面、MP4 錄影）
// ==== a_wpn.js
// ---------- M2.3 職業武器：苦達斯＝大劍、尋歡作樂＝樂器 ----------
// 數值表共用 WPN（同一階同攻擊力），只有名字、圖示、可裝備的人不同。it.wc：'k' 大劍、'b' 樂器
// 名字修正：舊「雙手剩刀」是錯字（改成 斬馬大刀）；「S／SS」英文字尾改成中文階級「精鍛／名匠」
const WPN_K=['雙手巨劍','巨刃','斬馬大刀','灰岩重劍','精鍛雙手巨劍','精鍛巨刃','精鍛斬馬大刀','精鍛灰岩重劍','名匠雙手巨劍'];
const WPN_B=['旅人魯特琴','楓木豎琴','曼陀林','灰岩七弦琴','精製魯特琴','精製豎琴','精製曼陀林','精製七弦琴','名匠魯特琴'];
WPN_K.forEach((n,k)=>{if(WPN[k])WPN[k][0]=n});
const WCLS={k:{n:'大劍',who:'苦達斯',hero:'kudas',col:[255,190,140]},b:{n:'樂器',who:'尋歡作樂',hero:'bard',col:[150,220,255]}};
const M23={to:null};
const heroCls=h=>(h||HEROK)==='bard'?'b':'k';
const wcOf=it=>it&&it.t==='w'?(it.wc==='b'?'b':'k'):null;
window.mkItem=(o=>(t,k,r,sv)=>{const it=o(t,k,r,sv);if(t==='w')it.wc=M23.to||heroCls();return it})(window.mkItem);
window.m22Blank=(o=>(S,k)=>{const p=M23.to;M23.to=heroCls(k);try{return o(S,k)}finally{M23.to=p}})(window.m22Blank);
window.itName=(o=>it=>it&&it.t==='w'?((wcOf(it)==='b'?WPN_B:WPN_K)[it.k]||o(it)):o(it))(window.itName);
// 舊存檔：沒有 wc 的武器跟著持有人（詩人身上的大劍＝轉成同階樂器，稀有度、數值、強化、詞條、符文、屬性全部不動）；倉庫裡的舊武器算苦達斯的
function m23Mig(S){let n=0,nb=0;const fix=(L,c)=>{for(const it of L||[]){if(it&&it.rune&&it.rune.n==='火炬+')it.rune.n='火炬';if(it&&it.t==='w'&&it.wc!=='k'&&it.wc!=='b'){it.wc=c;n++;if(c==='b')nb++}}};
  fix(S.inv,heroCls(S.hero));if(S.chars)for(const k in S.chars)if(S.chars[k])fix(S.chars[k].inv,heroCls(k));fix(S.wh,'k');
  if(n&&!S.m23mig)S.m23mig={t:Date.now(),weapons:n,toInstrument:nb};return S}
window.m21Migrate=(o=>S=>{o(S);m23Mig(S);return S})(window.m21Migrate);
window.bagEquip=(o=>it=>{if(it&&it.t==='w'&&wcOf(it)!==heroCls()){const C=WCLS[wcOf(it)];UI.msg=[`這是${C.who}專用的${C.n}，${HERO[HEROK].n}不能裝備`,performance.now()];sfx('clank',0.3);return}return o(it)})(window.bagEquip);
window.itemLines=(o=>it=>{const out=o(it);if(it&&it.t==='w'){const C=WCLS[wcOf(it)];out.unshift(['類別',`${C.n}（${C.who}專用）`,C.col])}return out})(window.itemLines);
// 圖示：樂器四種外型（魯特琴／豎琴／曼陀林／七弦琴），層次色帶
window.gearIconC=(o=>it=>{if(!(it&&it.t==='w'&&wcOf(it)==='b'))return o(it);const key='wb'+it.k+'_'+it.r;if(GIC[key])return GIC[key];
  const [c,x]=mk(20,20);const R=RAR[it.r];const px=(xx,yy,col)=>{x.fillStyle=rgb(col);x.fillRect(xx,yy,1,1)};
  x.fillStyle=rgb(R.bg);x.fillRect(1,1,18,18);for(let i=0;i<18;i++){x.fillStyle=rgb(R.bg.map(v=>Math.min(255,v+Math.round(i*1.6))));x.fillRect(1,1+i,18,1)}
  x.fillStyle=rgb(R.fr);x.fillRect(1,0,18,1);x.fillRect(1,19,18,1);x.fillRect(0,1,1,18);x.fillRect(19,1,1,18);x.fillStyle=rgb(R.fr.map(v=>Math.min(255,v+70)));x.fillRect(2,1,16,1);
  const WD=[[[70,38,22],[124,72,38],[176,112,58],[222,164,96]],[[64,40,24],[112,70,40],[160,108,62],[206,156,100]],[[80,30,26],[134,58,44],[184,94,64],[226,146,104]],[[60,56,64],[104,98,110],[150,144,156],[204,198,210]]][it.k%4];
  const G=[[120,80,20],[200,150,40],[250,210,90],[255,245,190]],OL=[24,14,14],shp=it.k%4;
  const body=(cx,cy,rx,ry)=>{for(let yy=0;yy<20;yy++)for(let xx=0;xx<20;xx++){const u=(xx+0.5-cx)/rx,v=(yy+0.5-cy)/ry,d=u*u+v*v;if(d>1.0)continue;
      const e=d>0.62,l=u+v;px(xx,yy,e?WD[0]:l<-0.55?WD[3]:l<0.15?WD[2]:WD[1])}};
  if(shp===0||shp===2){// 琴身＋響孔＋琴頸＋弦栓
    const [cx,cy,rx,ry]=shp===0?[8,12.5,5.6,5.2]:[8.2,12.6,4.8,4.6];
    for(let i=0;i<8;i++){const nx=10+i,ny=9-i;px(nx,ny,WD[1]);px(nx,ny+1,WD[0]);px(nx-1,ny,WD[2])}px(17,1,OL);px(18,2,G[2]);px(16,1,G[2]);px(18,1,G[1]);
    body(cx,cy,rx,ry);px(Math.round(cx),Math.round(cy)-1,OL);px(Math.round(cx)-1,Math.round(cy)-1,OL);px(Math.round(cx),Math.round(cy),OL);px(Math.round(cx)-1,Math.round(cy),[60,30,20]);
    for(let i=0;i<5;i++){px(5+i,16-i,G[3])}px(5,16,G[1]);px(6,16,G[1])}
  else if(shp===1){// 豎琴：左邊直柱、上面彎頸、斜的共鳴板，弦長短成三角形
    for(let y=3;y<=17;y++){px(3,y,WD[0]);px(4,y,y<8?WD[3]:WD[2])}px(3,18,G[1]);px(4,18,G[2]);
    for(let i=0;i<=12;i++){const xx=4+i,yy=Math.round(3+Math.sin(i/12*Math.PI)*-1.6+i*0.25);px(xx,yy,WD[3]);px(xx,yy+1,WD[1])}
    for(let i=0;i<=11;i++){const xx=5+i,yy=Math.round(17-i*0.95);px(xx,yy,WD[2]);px(xx,yy+1,WD[0])}
    for(let xs=6;xs<=14;xs+=2){const top=Math.round(3+Math.sin((xs-4)/12*Math.PI)*-1.6+(xs-4)*0.25)+2,bot=Math.round(17-(xs-5)*0.95)-1;for(let y=top;y<=bot;y++)px(xs,y,G[3])}}
  else{// 七弦琴：兩支往外彎的角、上橫樑、下面小共鳴箱
    for(let y=2;y<=14;y++){const u=(y-2)/12,o2=Math.round(Math.sin(u*Math.PI)*2.6);px(5-o2,y,WD[3]);px(6-o2,y,WD[1]);px(14+o2,y,WD[2]);px(15+o2,y,WD[0])}
    px(5,1,G[2]);px(15,1,G[2]);for(let xx=5;xx<=15;xx++){px(xx,4,WD[3]);px(xx,5,WD[0])}body(10,15.2,6.2,3.2);
    for(let xs=8;xs<=12;xs+=2)for(let y=6;y<14;y++)px(xs,y,G[3])}
  GIC[key]=c;return c})(window.gearIconC);
// 卡片角落標「劍」「琴」，倉庫裡一眼看得出是誰的
window.gearCard=(o=>(it,x,y,z,sel)=>{o(it,x,y,z,sel);if(it&&it.t==='w'&&z>=40){const b=wcOf(it)==='b';rrect(x+2,y+z-17,x+18,y+z-2,4,b?'rgba(40,110,170,0.95)':'rgba(150,70,40,0.95)');T(b?'琴':'劍',x+10,y+z-9,FN(11),[255,255,255],0,[0,0,0],'mm')}})(window.gearCard);
window.__m23={wcOf,heroCls,names:()=>({k:WPN_K,b:WPN_B})};
// ==== b_npc.js
// ---------- M2.3 NPC：貓商人＝像素惡魔貓、搗蛋鬼＝像素搗蛋鬼（idle／walk 動畫、無底框、會在附近閒晃） ----------
const NPCSP={cat:{pre:'dcat',idle:1.4,col:'rgba(120,40,140,0.9)'},prank:{pre:'prank',idle:1.2,col:'rgba(40,90,60,0.9)'}};
function npcFrame(k,mode,t){const N=NPCSP[k],p=N.pre+'_';
  if(mode==='walk'){const L=[0,1,2,3].map(i=>p+'walk'+i).filter(m21Has);if(L.length)return L[Math.floor(t/0.14)%L.length]}
  const L=[p+'idle',p+'idle1',p+'idle2',p+'idle3'].filter(m21Has);return L.length?L[Math.floor(t/(N.idle/L.length))%L.length]:null}
// 閒晃：玩家不在旁邊時，在出生點左右 ±110 走走停停；玩家靠近就停下來面向玩家
function npcWander(n,t,P){if(n.hx==null){n.hx=n.x;n.lt=t;n.st='idle';n.st0=t;n.dur=1.5+Math.random()*1.5;n.face=P&&P.x<n.x?-1:1}
  const dt=Math.min(0.05,Math.max(0,t-n.lt));n.lt=t;
  if(n.near||(P&&Math.abs(P.x-n.x)<180&&Math.abs(P.y-n.y)<110)){n.st='idle';n.st0=t;n.dur=1;if(P)n.face=P.x<n.x?-1:1;return}
  if(t-n.st0>n.dur){if(n.st==='idle'){let tx=n.hx+(Math.random()*2-1)*110;tx=clamp(tx,120,WW-120);if(Math.abs(tx-n.x)<30)tx=n.x+(tx<n.x?-40:40);n.tx=tx;n.st='walk';n.face=tx<n.x?-1:1;n.dur=6}else{n.st='idle';n.dur=1.6+Math.random()*2.2}n.st0=t}
  if(n.st==='walk'){const v=58*dt,d=n.tx-n.x;if(Math.abs(d)<=v){n.x=n.tx;n.st='idle';n.st0=t;n.dur=1.6+Math.random()*2.2}else n.x+=Math.sign(d)*v}}
window.m2Ents=(o=>(ents,SX,shy)=>{const s=S0,n=s&&s.npc;if(!n||!NPCSP[n.k]||!npcFrame(n.k,'idle',0))return o(ents,SX,shy);
  const k=n.k;s.npc=null;try{o(ents,SX,shy)}finally{s.npc=n}
  const t=s.t;npcWander(n,t,s.P);
  ents.push([m21NpcKey(n),()=>{const sx=SX(n.x),sy=n.y+shy;if(sx<-200||sx>W+200)return;const fr=npcFrame(k,n.st==='walk'?'walk':'idle',t);
    shadowE(sx,sy,k==='cat'?40:34);spr(fr,sx,sy,{flip:n.face<0});
    const ny=Math.round(sy-150);const nm=NPCS[k].name;rrect(sx-tw(nm,FN(14))/2-10,ny-12,sx+tw(nm,FN(14))/2+10,ny+12,8,NPCSP[k].col,'rgb(255,236,190)',1);T(nm,sx,ny+1,FN(14),[255,250,230],2,[0,0,0],'mm');
    if(n.bub!=null&&t-n.bub<5)npcBubble(n,sx,ny-40)}])})(window.m2Ents);
window.npcPortrait=(o=>(npc,x,y)=>{const fr=NPCSP[npc]&&npcFrame(npc,'idle',performance.now()/1000);if(!fr)return o(npc,x,y);
  X.save();X.imageSmoothingEnabled=false;spr(fr,x+8,y+16,{sc:1.45});X.restore()})(window.npcPortrait);
// ==== c_title.js
// ---------- M2.3 封面：尋歡作樂正式登場（拿掉剪影／即將登場／？），搗蛋鬼、惡魔貓不上封面 ----------
window.m21TitleBack=function(){};
window.m21TitleBard=function(S,ly,t){S('bard_play'+(Math.floor(t/0.22)%2),786,ly-6,{flip:true})};
// ==== d_rec.js
// ---------- M2.3 錄影：最後一律存成 .mp4（H.264＋AAC、yuv420p、faststart），LINE 手機／電腦拖進去就能播 ----------
// exe 裡：MediaRecorder 能錄 mp4/avc1 就錄 mp4，不能就錄 webm；停止後交給 exe 內建的 ffmpeg 轉成標準 mp4，轉好刪掉暫存檔
const M23REC={mp4:['video/mp4;codecs=avc1.640028,mp4a.40.2','video/mp4;codecs=avc1,opus','video/mp4;codecs=avc1.42E01F,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/mp4'],webm:['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']};
window.m21RecStart=function(){if(REC.on)return;const cv=document.querySelector('canvas');if(!cv||!cv.captureStream||!window.MediaRecorder){m21Toast('這個瀏覽器不支援內建錄影，請改用 Win+Alt+R');return}
  const st=cv.captureStream(60);if(AB.rec)for(const tr of AB.rec.stream.getAudioTracks())st.addTrack(tr);
  const ok=m=>{try{return MediaRecorder.isTypeSupported(m)}catch(e){return false}};
  let mt=M23REC.mp4.find(ok),ext='mp4';if(!mt||window.__m23forceWebm){mt=M23REC.webm.find(ok)||'';ext='webm'}
  let mr;try{mr=new MediaRecorder(st,{mimeType:mt,videoBitsPerSecond:8e6,audioBitsPerSecond:160000})}catch(e){m21Toast('無法開始錄影：'+e);return}
  Object.assign(REC,{on:true,mr,mt,ext,name:m21RecName(),seq:0,q:Promise.resolve(),srv:true,chunks:[],t0:performance.now(),res:null});
  mr.ondataavailable=e=>{if(!e.data||!e.data.size)return;const blob=e.data,seq=REC.seq++,name=REC.name;REC.chunks.push(blob);
    REC.q=REC.q.then(async()=>{if(!REC.srv)return;try{const r=await fetch(`rec?name=${encodeURIComponent(name)}&seq=${seq}&ext=${ext}`,{method:'POST',body:blob});if(!r.ok)throw 0}catch(_){REC.srv=false}})};
  mr.onstop=()=>{const name=REC.name,chunks=REC.chunks;REC.q=REC.q.then(async()=>{let job=null;
      if(REC.srv){try{const r=await fetch(`rec?name=${encodeURIComponent(name)}&end=1&ext=${ext}`,{method:'POST'});if(r.ok)job=await r.json()}catch(_){}}
      if(job&&job.job){m21Toast('錄影轉成 MP4 中…（可以繼續玩）',60000);const t0=performance.now();let j=null;
        while(performance.now()-t0<15*60e3){await new Promise(z=>setTimeout(z,700));try{const r=await fetch(`recstat?name=${encodeURIComponent(name)}`,{cache:'no-store'});if(r.ok){j=await r.json();if(j.done)break}}catch(_){}}
        REC.res=j;if(j&&j.ok)m21Toast('錄影已存到：'+j.path,7000);else m21Toast('MP4 轉檔失敗，原始檔留在：'+(j&&j.path||'錄影資料夾'),8000)}
      else{const a=document.createElement('a');a.download=name+'.'+ext;a.href=URL.createObjectURL(new Blob(chunks,{type:ext==='mp4'?'video/mp4':'video/webm'}));document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),3000);
        REC.res={ok:true,dl:a.download};m21Toast(ext==='mp4'?'錄影已下載 MP4（瀏覽器「下載」資料夾）':'錄影已下載（這個瀏覽器只能錄 webm；用 exe 版會自動轉成 MP4）',6000)}
      REC.chunks=[]})};
  mr.start(2000);sfx('ready',0.4);m21D.r.style.display='block';m21Toast('開始錄影（再按 F9 停止）',1600)};
window.__rec=()=>({on:REC.on,seq:REC.seq||0,srv:REC.srv,mt:REC.mt,ext:REC.ext,res:REC.res});
// ==== e_slide.js
// ---------- M2.3 詩人跪地滑行：距離與段數跟著武器強化成長，和詩人專用符文「長滑步」疊加 ----------
// 強化 +e：距離 +8% × floor(e/3)（+15 時 +40%）；段數 1 + floor(e/5)（+5 兩段、+10 三段、+15 四段）
// 符文「長滑步」（只出現在樂器上）：距離 +30%／+20%／+12%（紫／藍／綠）。兩者相加，總距離上限 ×1.70
const SLIDE={per3:0.08,per5hit:1,maxHits:4,cap:1.70};
RUNES['長滑步']=['w',v=>`跪地滑行距離 +${v}%（詩人專用）`,[30,20,12],'',{bard:1}];
function slideFor(e,rv){const ed=SLIDE.per3*Math.floor(e/3),m=Math.min(SLIDE.cap,1+ed+(rv||0)/100);return{m,h:Math.min(SLIDE.maxHits,1+Math.floor(e/5)),ed,rv:rv||0}}
function slideRuneV(it){return it&&it.rune&&it.rune.n==='長滑步'?RUNES['長滑步'][2][it.rune.g]:0}
window.bSlideStat=function(){const it=eqItem('w');return slideFor(SAVE.slot?SAVE.slot.e||0:0,slideRuneV(it))};
// 「長滑步」只給詩人：苦達斯抽到就重抽
window.rollRune=(o=>t=>{let n=o(t);for(let i=0;i<12&&RUNES[n]&&RUNES[n][4]&&RUNES[n][4].bard&&heroCls()!=='b';i++)n=o(t);return n})(window.rollRune);
// 說明欄：樂器顯示目前的滑行成長
window.itemLines=(o=>it=>{const out=o(it);if(it&&it.t==='w'&&wcOf(it)==='b'){const e=effE(it),S=slideFor(e,slideRuneV(it));
  out.push(['跪地滑行',`距離 ×${S.m.toFixed(2)}（強化 +${Math.round(S.ed*100)}%${S.rv?`、長滑步 +${S.rv}%`:''}）、每個敵人 ${S.h} 段${e<15?`（下一階 +${Math.min(Math.ceil((e+1)/3)*3,Math.ceil((e+1)/5)*5)}）`:''}`,[180,230,255]])}return out})(window.itemLines);
window.__slide={slideFor,SLIDE,table:()=>Array.from({length:16},(_,e)=>[e,slideFor(e,0).m,slideFor(e,0).h])};
// 滑行當下的提示字：有成長時顯示倍率與段數
window.bStartSlide=(o=>dir=>{o(dir);const S=bSlideStat();if(S0&&S0.callout&&(S.m>1||S.h>1))S0.callout.txt=`跪地滑行 ×${S.m.toFixed(2)}・${S.h} 段`})(window.bStartSlide);
// 追加段數：滑行打中後，每 0.06 秒再打 1 段（0.45 倍、不再重複絆倒）
window.bStep=(o=>dt=>{o(dt);const s=S0;if(!s||!s.slq||!s.slq.length)return;const t=s.t;
  s.slq=s.slq.filter(q=>{const m=s.mobs.find(x=>x.id===q.id);if(!m||m.gone||m.dying)return false;
    while(q.n>0&&t>=q.next){bHit(m,'n','chg',0.45,false);s.fx.push({k:'b_trip',x:m.x,y:m.y,t0:t});s.hitstop=Math.max(s.hitstop,0.02);sfx('hit',0.2);q.n--;q.next+=0.06}return q.n>0})})(window.bStep);
