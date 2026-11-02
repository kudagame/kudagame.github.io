// ===== W1（網頁版第 1 次更新）=====  載入順序：m25b.js 之後（index.html），網頁版由 tools/build_web.py 一起打包
// 1) 版本標示（封面右下角）2) 搗蛋鬼（多比的變身藥水）攻擊力 +5%  3) 變身殘影：搗蛋鬼 紫→青、惡魔貓 金色＋金幣
(()=>{
// ---------- 版本：只改這裡 ----------
// web：網頁版更新序號；native：手機 APK／電腦版的版本（約每 5 次網頁版更新才重出，並寫上它已包含到哪一版網頁更新）
// 網頁版版號：大改版 W2、W3…；只修 bug 的維護版 W2.1、W2.2、W2.3…（從上線版另開熱修樹建置，不含開發中的 W3 內容）
const GAME_VER={web:'W2.6',native:'M2.5e',nativeHas:''};
const isWebBuild=()=>!!window.__cloud||!!window.ERINN_FIREBASE;   // cloud.js 只在網頁版載入
const gameVerLabel=window.gameVerLabel=function(){return isWebBuild()?'網頁版 '+GAME_VER.web:GAME_VER.native+(GAME_VER.nativeHas?'（含 '+GAME_VER.nativeHas+'）':'')}
// 位置：右下角「私人非商業同人試作」正上方。觸控版的按鈕（返回／確定…）蓋到右下角時，兩行一起移到按鈕上方；字級依畫面縮放，手機上也看得清楚
const VL={t:-1e9,y:708,fs:14};
function verPos(){const now=performance.now();if(now-VL.t<500)return VL;VL.t=now;let y=708,fs=14;
  try{const cv=document.getElementById('c'),r=cv&&cv.getBoundingClientRect();if(r&&r.width>0){const k=1280/r.width;fs=Math.max(14,Math.min(22,Math.round(11*k)));
    if(typeof window.__mobLayout==='function'){const L=window.__mobLayout();let top=720;
      for(const b of (L&&L.btn)||[]){const x0=(b[1]-r.left)*k,y0=(b[2]-r.top)*k,x1=x0+b[3]*k,y1=y0+b[4]*k;if(x1>1040&&x0<1280&&y1>700-fs*2&&y0<720)top=Math.min(top,y0)}
      if(top<720)y=Math.max(320,Math.floor(top-6))}}}catch(e){}
  VL.y=y;VL.fs=fs;return VL}
window.drawTitle=(o=>function(){const T0=window.T;let hid=false;window.T=function(s){if(s==='私人非商業同人試作'){hid=true;return}return T0.apply(this,arguments)};
  let r;try{r=o.apply(this,arguments)}finally{window.T=T0}
  try{const p=verPos(),sm=Math.max(12,Math.round(p.fs*0.86));T('私人非商業同人試作',1270,p.y,FN(sm),[230,220,200],2,[0,0,0],'rb');T(gameVerLabel(),1270,p.y-sm-4,FN(p.fs),[255,226,150],2,[0,0,0],'rb')}catch(e){}
  return r})(window.drawTitle);
// ---------- 搗蛋鬼變身：所有攻擊力 +5% ----------
const TF1_ATK=1.05;
const w1TfAtk=()=>{try{return typeof SAVE!=='undefined'&&SAVE&&SAVE.tf===1&&!(typeof isBard==='function'&&isBard())&&(typeof HEROK==='undefined'||HEROK==='kudas')}catch(e){return false}};
window.calcGS=(o=>function(){const r=o.apply(this,arguments);try{if(GS&&GS.wm&&w1TfAtk())GS.wm*=TF1_ATK}catch(e){}return r})(window.calcGS);
window.m2Dmg=(o=>function(v,m,mv,crit){const r=o.apply(this,arguments);return (mv!=='pet'&&typeof r==='number'&&w1TfAtk())?Math.round(r*TF1_ATK):r})(window.m2Dmg);
// 變身／解除都重算（m24 已包一層，這裡再保險一次；calcGS 是純計算，重算兩次結果一樣）
window.m21Transform=(o=>function(){const r=o.apply(this,arguments);try{calcGS()}catch(e){}return r})(window.m21Transform);
// ---------- 變身殘影（預覽 preview_m26/afterimage.js 的 dense 設定，使用者核可） ----------
// 只在變身（動畫表已載入）＋移動中（走/跑/肩撞/跳）；倒地／起身不留；停下 0.25 秒淡出；純畫面，不碰數值。
// 每格殘影保留原圖明暗（亮度量化 4 階 → 主題色 4 階色帶），先做好染色快取（不用 ctx.filter，手機也便宜）。
const AIC={n:12,every:3,a0:0.55,a1:0.10,sc1:0.90,fade:0.25};
const AIPAL={
  1:{bands:[[200,140,255],[160,120,255],[120,150,255],[80,210,255]],dark:[0.38,0.30,0.55]},     // 搗蛋鬼：紫 → 青
  2:{bands:[[255,220,90],[245,196,74],[232,168,56],[220,140,40]],dark:[0.46,0.32,0.18]}};       // 惡魔貓：亮金 → 深琥珀
const AI=window.__AI={on:true,G:[],C:[],lastCapF:-99,f:0,lastT:-1,drawT:-1,stopT:-1,px:null,py:0,ph:0,s:null,tf:0,stats:{draws:0,cache:0,coins:0},
  set(m){this.on=m!=='off';this.G.length=0;this.C.length=0}};
const AITC={};
function aiTint(nm,tf,b){const k=nm+'|'+tf+'|'+b;if(AITC[k])return AITC[k];const s=IMG['s_'+nm];if(!s||!s.width)return null;
  const c=document.createElement('canvas');c.width=s.width;c.height=s.height;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(s,0,0);
  const P=AIPAL[tf],[r,g,bb]=P.bands[b],D=P.dark,R=[[r*D[0],g*D[1],bb*D[2]],[r*0.72,g*0.66,bb*0.86],[r,g,bb],[r+(255-r)*0.65,g+(255-g)*0.65,bb+(255-bb)*0.65]];
  const d=x.getImageData(0,0,c.width,c.height),p=d.data;for(let i=0;i<p.length;i+=4){if(p[i+3]<10){p[i+3]=0;continue}
    const L=(p[i]*0.3+p[i+1]*0.59+p[i+2]*0.11)/255,q=R[Math.min(3,Math.floor(L*4.4))];p[i]=q[0];p[i+1]=q[1];p[i+2]=q[2]}
  x.putImageData(d,0,0);AI.stats.cache++;return AITC[k]=c}
function aiGhost(g,sx,sy,P,alpha,sc,tf,b){const nm=g.nm,[cw,chh,cx,cy]=anchor(nm);const im=aiTint(nm,tf,b);if(!im)return;
  X.save();X.globalAlpha=alpha;X.imageSmoothingEnabled=false;X.translate(Math.round(sx+(g.x-P.x)),Math.round(sy+((g.y-g.h)-(P.y-(P.h||0)))));
  if(sc!==1)X.scale(sc,sc);if(g.flip)X.scale(-1,1);X.drawImage(im,-cx*SS,-cy*SS+(g.dy||0)*SS,cw*SS,chh*SS);X.restore();AI.stats.draws++}
// 惡魔貓的金幣：像素小金幣（4 格翻轉，4 階色：外框／暗金／金／亮點），從殘影掉下、落地彈一下後淡出
const COINF=(()=>{const O=[110,62,14],D=[196,128,30],M=[244,190,56],L=[255,236,140],H=[255,252,220];
  const F=[["..OOO..",".OMMMO.","OMLHMDO","OMLMMDO","OMMMMDO",".ODDDO.","..OOO.."],
           ["..OO.",".OMLO","OMLMD","OMMMD","OMMDO",".ODDO","..OO."],
           [".O.","OLO","OMO","OMO","OMO","ODO",".O."],
           [".OO..","OLMO.","DMMLO","DMMMO","ODMMO","ODDO.",".OO.."]];
  const CM={O,D,M,L,H};return F.map(rows=>{const w=rows[0].length,h=rows.length,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
    rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(CM[ch]){x.fillStyle=`rgb(${CM[ch].join(',')})`;x.fillRect(i,j,1,1)}}));return c})})();
const COIN={chance:0.45,max:14,life:0.9,g:900};
function aiCoinSpawn(P,t){if(AI.C.length>=COIN.max||Math.random()>COIN.chance)return;
  AI.C.push({x:P.x+(Math.random()*36-18)-(P.face||1)*10,y:P.y+(Math.random()*8-4),z:(P.h||0)+40+Math.random()*60,vz:60+Math.random()*80,vx:(Math.random()*60-30)-(P.face||1)*30,t0:t,ph:Math.random()*4,bn:0});AI.stats.coins++}
function aiCoinStep(dt){for(const c of AI.C){c.vz-=COIN.g*dt;c.z+=c.vz*dt;c.x+=c.vx*dt;if(c.z<=0){c.z=0;if(!c.bn&&c.vz<-80){c.vz=-c.vz*0.35;c.bn=1}else{c.vz=0;c.vx*=0.8}}}}
function aiCoinDraw(sx,sy,P,t){const k0=AI.stopT<0?1:Math.max(0,1-(t-AI.stopT)/0.6);
  AI.C=AI.C.filter(c=>t-c.t0<COIN.life);X.save();X.imageSmoothingEnabled=false;
  for(const c of AI.C){const age=(t-c.t0)/COIN.life,a=(age<0.65?1:1-(age-0.65)/0.35)*k0;if(a<=0)continue;const im=COINF[Math.floor(c.ph+age*14)%4];
    X.globalAlpha=a;X.drawImage(im,Math.round(sx+(c.x-P.x)-im.width*SS/2),Math.round(sy+((c.y-c.z)-(P.y-(P.h||0)))-im.height*SS),im.width*SS,im.height*SS)}
  X.restore()}
window.spr=(o=>(n,sx,sy,op={})=>{const s=typeof S0!=='undefined'?S0:null;
  if(!AI.on||!s||!s.P||!n.startsWith('kudas_')||op.__g||op.__ally||!SAVE||(SAVE.tf!==1&&SAVE.tf!==2)||mode!=='play'||typeof m21TfOn!=='function'||!m21TfOn()){if(AI.G.length&&(!SAVE||!SAVE.tf))AI.set('on');return o(n,sx,sy,op)}
  const P=s.P,t=s.t,h=P.h||0,tf=SAVE.tf;
  if(AI.s!==s||AI.tf!==tf){AI.s=s;AI.tf=tf;AI.G.length=0;AI.C.length=0;AI.px=null;AI.lastT=-1}
  if(t!==AI.lastT){const dt=AI.lastT<0?0:Math.min(0.05,Math.max(0,t-AI.lastT));AI.lastT=t;AI.f++;
    const d=AI.px===null?0:Math.abs(P.x-AI.px)+Math.abs(P.y-AI.py)+Math.abs(h-AI.ph);
    if(d>300){AI.G.length=0;AI.C.length=0}   // 換場景／傳送：不畫一條橫越畫面的殘影
    const mv=AI.px!==null&&d>0.6&&d<=300;AI.px=P.x;AI.py=P.y;AI.ph=h;
    if(mv&&!P.dead){AI.stopT=-1;if(AI.f-AI.lastCapF>=AIC.every){AI.lastCapF=AI.f;const pn=m21PkName(n);
        if(!/_(down|getup)$/.test(pn)){AI.G.push({x:P.x,y:P.y,h,nm:pn,flip:!!op.flip,dy:op.dy||0,t});if(AI.G.length>AIC.n)AI.G.shift();if(tf===2)aiCoinSpawn(P,t)}}}
    else if(AI.stopT<0)AI.stopT=t;
    if(AI.C.length)aiCoinStep(dt)}
  // 舊的肩撞白色殘影（6 張、0.22 秒）在新殘影啟用時不畫，避免兩套殘影疊在一起
  if(P.ghost&&P.ghost.length)P.ghost.length=0;
  if(AI.drawT!==t){AI.drawT=t;   // 同一格只畫一次（同一格可能多次呼叫苦達的 spr，例如發光外框）
    const G=AI.G;if(G.length){const k=AI.stopT<0?1:1-(t-AI.stopT)/AIC.fade;const NB=AIPAL[tf].bands.length;
      if(k<=0)G.length=0;else for(let i=0;i<G.length;i++){const u=G.length===1?1:i/(G.length-1);// 0=最舊 1=最新
        const a=(AIC.a1+(AIC.a0-AIC.a1)*u)*k,sc=AIC.sc1+(1-AIC.sc1)*u,b=Math.min(NB-1,Math.floor((1-u)*NB));aiGhost(G[i],sx,sy,P,a,sc,tf,b)}}
    if(AI.C.length)aiCoinDraw(sx,sy,P,t)}
  return o(n,sx,sy,op)})(window.spr);
window.GAME_VER=GAME_VER;
})();
