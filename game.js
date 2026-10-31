'use strict';
// 夜路走多總匯三明治 艾爾琳之旅 試玩版 — M0/M1 playable
// Port of the v6.1 offline renderer (scene6.py / hud6.py / spr6.py / font5.py) to a realtime canvas game.
const W=1280,H=720,S=3,SS=2,TITLE='夜路走多總匯三明治 艾爾琳之旅 試玩版';
const cv=document.getElementById('c'),X=cv.getContext('2d');X.imageSmoothingEnabled=false;
const Q=new URLSearchParams(location.search);const AUTO=Q.get('auto')==='1';
window.__err=[];window.addEventListener('error',e=>{window.__err.push(String(e.message)+' @'+e.lineno)});
function fit(){const k=Math.min(innerWidth/W,innerHeight/H);const kk=k>=1?Math.floor(k*100)/100:k;cv.style.width=(W*kk)+'px';cv.style.height=(H*kk)+'px'}
addEventListener('resize',fit);fit();
// ---------- rng ----------
let seed=+(Q.get('seed')||Date.now()%100000);function rnd(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff}
const U=(a,b)=>a+(b-a)*rnd(),RI=(a,b)=>Math.floor(U(a,b+1)),CH=a=>a[Math.floor(rnd()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- assets ----------
const IMG={};let META=null;const SND={};
function li(n){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>{if(!i.__rt){i.__rt=1;setTimeout(()=>{i.src='a/'+n+'.png?r=1'},300);return}window.__err.push('img '+n);r(i)};i.src='a/'+n+'.png';IMG[n]=i})}
async function loadAll(){
  META=await (await fetch('a/meta.json')).json();
  const L=['world','mine','shrine','bossroom','titlebg','panel','por','peth','bardh','bardg','bag','expimg','statue','statue_glow','statue_flame'];
  for(const k of ['coin','clay','stone','pot','herb','food','exp'])L.push('i_'+k);
  for(const n of META.names){L.push('s_'+n,'f_'+n,'g_'+n)}
  L.push(...m2Assets());await Promise.all(L.map(li));await m2Load();
  for(const n of ['title','lute','bgm',...M2MUS])await loadMus(n);
  for(const n of ['hit','crit','clank','coin','swing','wind','ready','summon','fire','jump','hurt','statue','start','bgm']){const a=new Audio('a/'+n+'.ogg');a.preload='auto';SND[n]=a}
  SND.bgm.loop=true;SND.bgm.volume=0.45;
  try{await Promise.all([document.fonts.load('bold 20px NSerif'),document.fonts.load('bold 20px NSans')])}catch(e){}
}
let lastS={};
// ---------- music (WebAudio, gapless loops; title BGM / battle BGM / bard lute) ----------
const AC=new (window.AudioContext||window.webkitAudioContext)();const MUS={},MG={};
async function loadMus(n,k=0){try{const r=await fetch('a/'+n+'.ogg',{cache:'no-store'});const b=await r.arrayBuffer();MUS[n]=await AC.decodeAudioData(b)}catch(e){if(k<4){await new Promise(r=>setTimeout(r,400*(k+1)));return loadMus(n,k+1)}window.__err.push('mus '+n+' '+e)}}
function musVol(n,v,f=0.5){const m=MG[n];if(!m)return;const t=AC.currentTime;m.g.gain.cancelScheduledValues(t);m.g.gain.setValueAtTime(m.g.gain.value,t);m.g.gain.linearRampToValueAtTime(v,t+f);m.v=v}
function musPlay(n,v,f=0.6,restart=false){if(!MUS[n])return;if(MG[n]&&!restart){musVol(n,v,f);return}if(MG[n])musStop(n,0.05);
  const g=AC.createGain();g.gain.value=0;g.connect(window.__mb||AC.destination);const src=AC.createBufferSource();src.buffer=MUS[n];src.loop=true;src.connect(g);src.start();MG[n]={s:src,g,v:0};musVol(n,v,f)}
function musStop(n,f=0.6){const m=MG[n];if(!m)return;musVol(n,0,f);try{m.s.stop(AC.currentTime+f+0.05)}catch(e){}delete MG[n]}
const BGMV=0.42,DUCKV=0.12;let CURM='bgm';
function unlockAudio(){if(AC.state!=='running')AC.resume().catch(()=>{})}
addEventListener('keydown',unlockAudio);addEventListener('pointerdown',unlockAudio);
function sfx(n,v=0.6){const a=SND[n];if(!a)return;const now=performance.now();if(lastS[n]&&now-lastS[n]<40)return;lastS[n]=now;try{const b=a.cloneNode();b.volume=v;b.play().catch(()=>{})}catch(e){}}
// ---------- offscreen helpers ----------
function mk(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));const x=c.getContext('2d');x.imageSmoothingEnabled=false;return [c,x]}
const RC=(r,g,b,a=1)=>`rgba(${r},${g},${b},${a})`;const rgb=(c,a=1)=>RC(c[0],c[1],c[2],a);
// paste a native (unscaled) layer at S=3, centred (paste_native)
const NATP={};function natc(w,h){w=Math.max(1,Math.ceil(w));h=Math.max(1,Math.ceil(h));const k=w+'x'+h;let e=NATP[k];if(!e)e=NATP[k]=mk(w,h);e[1].setTransform(1,0,0,1,0,0);e[1].globalCompositeOperation='source-over';e[1].globalAlpha=1;e[1].clearRect(0,0,w,h);return e}
function nat(w,h,fn,cx,cy,flip=false){const [c,x]=natc(w,h);fn(x);const bw=c.width*S,bh=c.height*S;
  X.save();X.imageSmoothingEnabled=false;
  if(flip){X.translate(Math.round(cx),0);X.scale(-1,1);X.drawImage(c,Math.round(-bw/2),Math.round(cy-bh/2),bw,bh)}
  else X.drawImage(c,Math.round(cx-bw/2),Math.round(cy-bh/2),bw,bh);X.restore()}
function ell(x,x0,y0,x1,y1){x.beginPath();x.ellipse((x0+x1)/2,(y0+y1)/2,Math.abs(x1-x0)/2,Math.abs(y1-y0)/2,0,0,Math.PI*2)}
function poly(x,pts){x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))x.lineTo(p[0],p[1]);x.closePath()}
// ---------- sprites (spr6.get) ----------
const tintC={};
function ringImg(n,col){const k=n+col.join(',');if(tintC[k])return tintC[k];const g=IMG['g_'+n];const [c,x]=mk(g.width,g.height);x.drawImage(g,0,0);x.globalCompositeOperation='source-in';x.fillStyle=rgb(col);x.fillRect(0,0,c.width,c.height);tintC[k]=c;return c}
function anchor(n){const ch=n.split('_')[0];const [cw,chh,cx,cy]=META.can[ch];return [cw,chh,cx,cy]}
function spr(n,sx,sy,o={}){ // o: flip, rot, flash, glow:[r,g,b,a], dy, alpha, sc, filter
  const [cw,chh,cx,cy]=anchor(n);const im=IMG[(o.flash?'f_':'s_')+n];
  X.save();X.globalAlpha=o.alpha==null?1:o.alpha;X.translate(Math.round(sx),Math.round(sy));
  if(o.sc)X.scale(o.sc,o.sc);if(o.filter)X.filter=o.filter;
  if(o.flip)X.scale(-1,1);
  if(o.rot){X.translate(0,-30*SS);X.rotate(-o.rot*Math.PI/180);X.translate(0,30*SS)}
  const dx=-cx*SS,dy=-cy*SS+(o.dy||0)*SS;
  if(o.glow){X.globalAlpha*=o.glow[3]/255;X.drawImage(ringImg(n,o.glow),dx,dy,cw*SS,chh*SS);X.globalAlpha=o.alpha==null?1:o.alpha}
  X.drawImage(im,dx,dy,cw*SS,chh*SS);X.restore()}
// ---------- pixel font (font5.render) ----------
const G={'0':["01110","10001","10011","10101","11001","10001","01110"],'1':["00100","01100","00100","00100","00100","00100","01110"],'2':["01110","10001","00001","00110","01000","10000","11111"],'3':["11110","00001","00001","01110","00001","00001","11110"],'4':["00010","00110","01010","10010","11111","00010","00010"],'5':["11111","10000","11110","00001","00001","10001","01110"],'6':["00110","01000","10000","11110","10001","10001","01110"],'7':["11111","00001","00010","00100","01000","01000","01000"],'8':["01110","10001","10001","01110","10001","10001","01110"],'9':["01110","10001","10001","01111","00001","00010","01100"],',':["00000","00000","00000","00000","00000","01100","00100"],'E':["11111","10000","10000","11110","10000","10000","11111"],'X':["10001","10001","01010","00100","01010","10001","10001"],'P':["11110","10001","10001","11110","10000","10000","10000"],'+':["00000","00100","00100","11111","00100","00100","00000"],'!':["00100","00100","00100","00100","00100","00000","00100"],'♪':["00110","00101","00100","00100","01100","11100","01000"]};
function prender(s,scale,top,bot,outline=[30,12,8]){s=[...String(s)].filter(c=>G[c]).join("")||"0";bot=bot||top;const ws=[...s].map(c=>c===','?3:5);const w=ws.reduce((a,b)=>a+b,0)+s.length-1+2,h=9;
  const a=new Uint8ClampedArray(w*h*4);const m=new Uint8Array(w*h);let x=1;
  [...s].forEach((c,i)=>{const g=G[c],cw=ws[i];for(let r=0;r<7;r++){const col=[0,1,2].map(j=>Math.floor(top[j]+(bot[j]-top[j])*r/6));for(let k=0;k<cw;k++){const gx=c!==','?k:k+1;if(g[r][gx]==='1'){const p=((r+1)*w+x+k);m[p]=1;a.set([...col,255],p*4)}}}x+=cw+1});
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const p=yy*w+xx;if(m[p])continue;let d=0;
    const t=(X2,Y2)=>X2>=0&&Y2>=0&&X2<w&&Y2<h&&m[Y2*w+X2];
    if(t(xx,yy-1)||t(xx,yy+1)||t(xx-1,yy)||t(xx+1,yy)||t(xx-1,yy-1)||t(xx+1,yy-1))d=1;
    if(d)a.set([...outline,255],p*4)}
  const [c0,x0]=mk(w,h);x0.putImageData(new ImageData(a,w,h),0,0);const [c,xx]=mk(w*scale,h*scale);xx.drawImage(c0,0,0,w*scale,h*scale);return c}
const NUMC={};
function numImg(v,kind){v=Math.round(v);const k=v+kind;if(NUMC[k])return NUMC[k];const s=v.toLocaleString('en-US');let im;
  if(kind==='big')im=prender(s,5,[255,255,190],[255,110,20],[60,0,0]);else if(kind==='crit')im=prender(s,4,[255,250,150],[255,150,30],[70,10,0]);
  else if(kind==='pet')im=prender(s,3,[255,210,150],[255,120,60],[60,10,10]);else if(kind==='heal')im=prender('+'+s,3,[170,255,150],[60,210,80],[10,50,20]);
  else if(kind==='hurt')im=prender(s,3,[255,120,120],[220,30,30],[40,0,0]);else if(kind==='bleed')im=prender(s,2,[255,150,170],[200,30,60],[40,0,10]);else if(kind==='zero')im=prender('0',3,[200,200,210],[140,140,160],[30,30,40]);else im=prender(s,3,[255,255,255],[205,215,235],[30,20,30]);NUMC[k]=im;return im}
const NOTEC={};function noteImg(c){const k=c.join();return NOTEC[k]||(NOTEC[k]=prender('♪',S,c,null,[40,20,40]))}
// ---------- text (hud6.T) ----------
const FS=s=>`bold ${s}px NSerif`,FN=s=>`bold ${s}px NSans`;
function T(s,x,y,font,fill,sw=2,sc=[0,0,0],anchor='la',a=1){X.save();X.font=font;
  X.textAlign=anchor[0]==='l'?'left':anchor[0]==='r'?'right':'center';
  X.textBaseline=anchor[1]==='a'?'top':anchor[1]==='m'?'middle':anchor[1]==='b'?'bottom':'alphabetic';
  if(sw>0){X.lineJoin='round';X.lineWidth=sw*2;X.strokeStyle=rgb(sc,a);X.strokeText(s,x,y)}
  X.fillStyle=rgb(fill,a);X.fillText(s,x,y);X.restore()}
function tw(s,font){X.save();X.font=font;const w=X.measureText(s).width;X.restore();return w}
// ---------- tunables (暫定) ----------
let HPMAX=4125;const GOLDC=[214,172,84];let YMIN=508,YMAX=604;let WW=2752,CAMMAX=WW-W;
const STAGES={canyon:{img:'world',ww:2752,name:'赤岩峽谷'},mine:{img:'mine',ww:2560,name:'赤岩礦坑・坑道'},shrine:{img:'shrine',ww:1280,name:'礦坑深處・女神祭壇'},boss:{img:'bossroom',ww:1280,name:'女神的試煉・看守者之間'},s2:{img:'world',ww:2752,name:'第二關（暫定）・灰色荒野',filter:'hue-rotate(150deg) saturate(0.5) brightness(0.8)'},b4mine:{img:'b4mine',ww:2560,name:'巴里地下城・2層'},b4boss:{img:'b4room',ww:1280,name:'2層3區・水晶監視者之間'},sp:{img:'mine',ww:2560,name:'第四關（暫定）・蜘蛛巢穴',filter:'hue-rotate(70deg) saturate(0.55) brightness(0.7)'},ms1:{img:'ms_hall',ww:1280,name:'理查宅邸 III・寶物大廳'},ms2:{img:'ms_glass',ww:1280,name:'理查宅邸 III・彩繪玻璃大廳'},sp1:{img:'sp_tunnel',ww:2560,name:'巴里2礦區・2層1區'},sp2:{img:'sp_tunnel',ww:2560,name:'巴里2礦區・2層1區'},sp3:{img:'sp_tunnel',ww:1280,name:'巴里2礦區・2層1區'},spb:{img:'sp_nest',ww:1280,name:'巴里2礦區・2層1區'}};
// 區域盡頭往右走會去哪（資料驅動；'clear'＝通關結算）
const ENDT={mine:'shrine',s2:'clear',b4mine:'b4boss',sp:'clear',sp1:'sp2',sp2:'sp3',sp3:'spb'};
const RHMAX=5,WIND_COST=3,REV_WIN=3.2,COMBO_GAP=5.0,MULTI_BONUS=0.05,BEHIND_MUL=1.3,TURN_DELAY=0.45;
let HEAL_CAP=Math.round(HPMAX*0.08);const BARD_STAY=12,BUFF_SPD=1.25,PET_RATE=0.25,FOOD_MAX=3;
const POOL={n:[1266,1317,3564,4091],c:[3484,3676,3778,3944,4230,5823,6132,7283],zj:[3570,2079,4156],
  slam:[16578,28120],chg:[9840,12460],chgc:[24610,29870],stomp:[6230,8410],stompc:[15820,19470],slamc:[59242,62605],air:[3570,4156,4091],airc:[7283,84109],wind:[75084,112583],windc:[131176,169922,174503],pet:[1266,1317]};
// M1.1 心臟刺擊 + 出血 DOT (暫定)
const STAB_COST=2,BLEED_DUR=5.0,BLEED_TICK=0.5,BLEED_POOL=[612,655,688,731,804],BLEED_WIND2=0.5; // 斬風打出血目標：第二段 1/2 傷害 (暫定)
// 西施犬守護泡泡 (暫定)
const PET_EN_MAX=3,SHIELD_COST=2,SHIELD_DUR=10,SHIELD_CD=30,SHIELD_TICK=0.5;
// 礦坑強化怪 / 看守者 (暫定)
const STR_HP=1.6,STR_DMG=1.4,STR_CD=0.75,STR_SPD=1.12,BOSS_HP=1500000,PILLAR_HP=60000;
const MOBHP={sword:26000,bow:18000,boss:BOSS_HP,pillar:PILLAR_HP};
POOL.stab=[8820,9460,10230];POOL.stabc=[19870,22410];
// 連擊傷害加成 (暫定 — 從舞者實測影片模糊畫面估讀：~40連≈+50%、~55連≈+80%、~115連≈+100%)
const COMBO_TIERS=[[10,10],[20,20],[30,35],[40,50],[50,65],[60,80],[90,90],[110,100]];
function comboBonus(c){let b=0;for(const [n,v] of COMBO_TIERS)if(c>=n)b=v;return b}
const HPLOSS_SHOW=1;
// ---------- game state ----------
let S0=null; // sim
function newSim(){return{t:0,mobs:[],parts:[],fx:[],dmg:[],loot:[],fly:[],log:[[-3,'coin','獲得 金幣 x152'],[-2.2,'clay','獲得 泥塊'],[-1.4,'exp','經驗值 +1,343']],arrows:[],fire:[],blades:[],heals:[],procs:[],subs:[],
  P:{x:430,y:552,h:0,vh:0,face:1,act:null,chainBuf:0,combo:0,hp:HPMAX,rh:1,kspd:0,lastdust:0,slamCD:0,dead:false},
  pet:{x:300,y:576,v:0,g:0.82,spit:-9,face:1,en:1,shCD:0},bard:null,food:0,food_full:-99,foodpulse:-9,bagpulse:-9,gold:0,kills:0,exp:41.0,lv:65,
  rev_until:-1,cam:0,lock:null,wave:0,waveState:'pre',respawnT:9,hitstop:0,shakes:[],combo:0,lastHit:-99,maxCombo:0,cards:[],statueOn:false,ritual:null,uid:1,
  hpd:{disp:1,trail:1},procLast:{},hintUntil:14,mobAtkTok:0,hungryT:-9,denyK:-9,denyL:-9,comboTier:0,tierT:-9,
  stage:'canyon',caveOn:false,trans:null,boss:null,tele:[],st:{dmg:0,maxHit:0,hits:0,crits:0,zj:0,t0:0},bossT0:0,winT:null,shield:null,tg:{},runGold:0,runItems:[],npc:null}}
const WAVESET={canyon:[{trig:0,lock:[0,0],spawn:[['sword',1],['sword',1],['bow',1]],extra:0},
  {trig:1150,lock:[740,740],spawn:[['sword',1],['sword',-1],['bow',1],['sword',1],['bow',-1]],extra:1},
  {trig:1900,lock:[-1,-1],spawn:[['sword',1],['sword',1],['bow',1],['sword',-1],['sword',1],['bow',1]],extra:2}],
  mine:[{trig:0,lock:[0,0],spawn:[['sword',1],['sword',1],['bow',1],['sword',-1]],extra:1},
  {trig:1000,lock:[-1,-1],spawn:[['sword',1],['sword',-1],['bow',1],['sword',1],['bow',-1],['sword',1]],extra:2}],shrine:[],boss:[],
  s2:[{trig:0,lock:[0,0],spawn:[['sword',1],['sword',1],['bow',1],['sword',-1]],extra:1},{trig:1150,lock:[740,740],spawn:[['sword',1],['bow',-1],['sword',1],['bow',1],['sword',-1]],extra:1},{trig:1900,lock:[-1,-1],spawn:[['sword',1],['sword',1],['bow',1],['sword',-1],['bow',-1],['sword',1]],extra:2}],
  b4mine:[{trig:0,lock:[0,0],spawn:[['sword',1],['sword',1],['bow',1],['sword',-1]],extra:1},{trig:1000,lock:[-1,-1],spawn:[['sword',1],['sword',-1],['bow',1],['sword',1],['bow',-1],['sword',1]],extra:2}],b4boss:[]};
WAVESET.sp=WAVESET.mine.map(w=>Object.assign({},w,{spawn:w.spawn.slice()}));WAVESET.ms1=[];
// 第四關：3 個怪物區域（大地魔像碎片／坑道蠍＝sword，乙太薩滿＝bow），最後是巢穴 BOSS
WAVESET.sp1=[{trig:0,lock:[0,0],spawn:[['sword',1],['sword',1],['bow',1],['sword',-1]],extra:1},{trig:1100,lock:[-1,-1],spawn:[['sword',1],['bow',-1],['sword',1],['sword',-1],['bow',1]],extra:1}];
WAVESET.sp2=[{trig:0,lock:[0,0],spawn:[['sword',1],['bow',1],['sword',-1],['sword',1]],extra:1},{trig:1100,lock:[-1,-1],spawn:[['sword',1],['sword',-1],['bow',1],['sword',1],['bow',-1],['sword',1]],extra:2}];
WAVESET.sp3=[{trig:0,lock:[0,0],spawn:[['sword',1],['sword',-1],['bow',1],['sword',1],['bow',-1],['sword',-1]],extra:2}];WAVESET.spb=[];
WAVESET.ms2=[{trig:0,lock:[0,0],spawn:[['sword',1],['sword',1],['sword',-1],['sword',1],['sword',-1]],extra:1},{trig:0,lock:[0,0],spawn:[['sword',1],['sword',-1],['sword',1],['sword',-1],['sword',1],['sword',1]],extra:1}];
let WAVES=WAVESET.canyon;
const STATUE={x:640,y:528};const CAVE={x0:2330,x1:2520};
const PILLAR_POS=[[170,526],[1110,526],[330,598],[860,598]];
function mob(kind,x,y){const str=S0&&['mine','boss','s2','b4mine','b4boss','sp','sp1','sp2','sp3','spb'].includes(S0.stage)&&(kind==='sword'||kind==='bow');const hp=Math.round(MOBHP[kind]*(str?STR_HP:1)*DIF().hp);
  return{id:S0.uid++,kind,x,y,h:0,vh:0,vx:0,rot:0,state:'walk',face:-1,want:-1,turnT:0,stun:0,flash:0,frz:0,hp,hpmax:hp,str,
  bounced:false,getup:0,cd:U(1.2,2.4)*(str?STR_CD:1),wind:0,moving:false,dying:false,dieT:0,recoil:-9,strafe:U(-1,1),hitIds:{}}}
function spawnMob(kind,side){const s=S0,cam=s.cam;const x=side>0?cam+W+60+U(0,120):cam-60-U(0,120);const y=U(YMIN+8,YMAX-8);
  const m=mob(kind,clamp(x,-100,WW+100),y);m.face=side>0?-1:1;m.want=m.face;m.enter=true;s.mobs.push(m);m2Say(m,0.2);return m}
// ---------- events ----------
function card(txt,sub,dur=1.6){S0.cards.push({t0:S0.t,txt,sub,dur})}
function proc(name,col,g){const s=S0;if(s.procLast[name]&&s.t-s.procLast[name]<1.6)return;s.procLast[name]=s.t;s.procs.push([s.t,name,col,g])}
function sub(who,line,dur){S0.subs=[[S0.t,S0.t+dur,who,line]]}
function shake(amp,dur){S0.shakes.push([S0.t,amp,dur])}
function spark(x,y,crit,big,flame){const s=S0;s.fx.push({k:'star',x,y,t0:s.t,crit,big,flame});
  for(let i=0;i<(crit?12:7);i++){const a=U(0,Math.PI*2),v=U(220,460)*(big?1.3:1);
    const col=CH((crit||flame)?[[255,250,200],[255,220,80],[255,170,40]]:[[255,255,255],[255,240,190]]);
    s.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:900,life:0.22,t0:s.t,c:col,sz:1,drag:4})}}
function puff(x,y,n=10,col=[232,226,214],spread=40,life=0.5,sz=3){const s=S0;for(let i=0;i<n;i++){const a=U(0,Math.PI*2),v=U(40,150);
  s.parts.push({x:x+U(-spread,spread)*0.4,y:y+U(-8,8),vx:Math.cos(a)*v,vy:Math.sin(a)*v*0.5-40,g:-60,life:life*U(0.7,1.2),t0:s.t,c:col,sz,grow:true,drag:3})}}
const buffed=()=>S0.bard&&S0.t>=S0.bard.buffT&&S0.t<S0.bard.out;
// ---------- damage ----------
function hitMob(m,mv,ctx){const s=S0,P=s.P,t=s.t;
  const isB=m.kind==='boss',isPil=m.kind==='pillar';
  const kneel=isB&&s.boss&&t<s.boss.kneelUntil;
  const behind=((P.x-m.x)*m.face<0 && Math.abs(P.x-m.x)>8 && mv!=='pet' && !isPil)||(kneel&&mv!=='pet');
  let crit=rnd()<(buffed()?0.55:0.32)+m2Crit(m)||behind;if(mv==='pet')crit=false;
  let pool=mv==='chg'?(crit?POOL.chgc:POOL.chg):mv==='stomp'?(crit?POOL.stompc:POOL.stomp):mv==='stab'?(crit?POOL.stabc:POOL.stab):mv==='slam'?(crit?POOL.slamc:POOL.slam):mv==='air'?(crit?POOL.airc:POOL.air):mv==='wind'?(crit?POOL.windc:POOL.wind):mv==='pet'?POOL.pet:(crit?POOL.c:POOL.n);
  let v=m2Dmg(CH(pool),m,mv,crit);if(behind)v=Math.round(v*BEHIND_MUL);if(ctx.multi)v=Math.round(v*(1+MULTI_BONUS));
  const bleeding=m.bleed&&t<m.bleed.until&&!isPil;
  if(mv!=='pet'){const cb=comboBonus(s.combo);if(cb)v=Math.round(v*(1+cb/100))}
  let label=behind?'無防備暴擊':crit?'暴擊':ctx.multi?'多重打擊':'';if(mv==='pet')label='';
  m.flash=t+0.07;m.frz=t+(['slam','wind','air','stab'].includes(mv)?0.09:0.06);if(isB||isPil)m.frz=t+0.05;
  const dir=Math.sign(m.x-P.x)||P.face;
  // 看守者：赤晶柱還在就無效
  if(isB&&bossShielded()){m2Prot();m.frz=t;s.dmg.push({t,x:m.x,y:m.y-m.h-300,v:0,crit:false,label:'無效',zj:false,pet:mv==='pet',zero:true});s.fx.push({k:'clank',x:m.x-40*dir,y:m.y-180,t0:t});sfx('clank',0.45);
    if(mv!=='pet')s.hitstop=Math.max(s.hitstop,0.03);return 0}
  if(isB&&b4Prot()){v=Math.round(v*0.2);m2Prot();if(!label)label='減傷'}
  if(mv==='stab'&&!isPil){m.bleed={until:t+BLEED_DUR,next:t+BLEED_TICK,t0:t};s.fx.push({k:'bleedpop',m,t0:t})}
  if(m.state!=='down'&&!isB&&!isPil){
    if(mv==='up'){m.state='air';m.vh=640;m.vx=55*dir;m.bounced=false}
    else if(mv==='air'){m.state='air';m.vh=-120;m.vx=230*dir;m.bounced=false}
    else if(mv==='slam'){m.state='air';m.vh=520;m.vx=170*dir;m.bounced=false}
    else if(mv==='wind'){m.state='air';m.vh=470;m.vx=330*dir;m.bounced=false}
    else if(mv==='stab'){if(m.state==='air'){m.vh=Math.max(m.vh,200);m.vx=120*dir}else{m.state='stun';m.stun=t+0.45;m.vx=360*dir}}
    else if(mv==='pet'){if(m.state!=='air'){m.state='stun';m.stun=t+0.35;m.vx=260*dir}}
    else{if(m.state==='air'){m.vh=Math.max(m.vh,260);m.vx=60*dir}else{m.state='stun';m.stun=t+0.3;m.vx=280*dir}}
    m.wind=0}
  m.hp-=v;statHit(v,crit,false);
  const hy=isB?m.y-m.h-330:isPil?m.y-250:m.y-m.h-150;
  s.dmg.push({t,x:m.x,y:hy,v,crit,label,zj:false,pet:mv==='pet'});
  spark(m.x-26*dir,isB?m.y-200:isPil?m.y-130:m.y-m.h-60,crit,['slam','wind','air','stab'].includes(mv),buffed()||mv==='pet');
  if(isPil)sfx('clank',0.3);
  if(mv!=='pet'){sfx(crit?'crit':'hit',crit?0.55:0.45);registerHit(v);s.hitstop=Math.max(s.hitstop,['slam','wind','air','stab'].includes(mv)?0.07:0.045);if(crit)shake(4,0.12)}
  m2OnHit(m,mv,v,crit,hy);
  if(behind)proc('無防備',[150,60,190],'破');
  if(mv==='slam'&&crit)proc('強擊',[190,40,40],'強');
  // 斬風 × 出血：第二段 1/2 傷害（取代 M1.1 前的 +30%）
  if(mv==='wind'&&bleeding){const v2=Math.round(v*BLEED_WIND2);proc('出血追加',[170,30,40],'血');
    setTimeout0(0.12,()=>{if(m.gone)return;if(m.kind==='boss'&&bossShielded())return;m.hp-=v2;statHit(v2,crit,false);m.flash=s.t+0.06;
      s.dmg.push({t:s.t,x:m.x+18,y:hy-44,v:v2,crit:true,label:'出血追加',zj:false,pet:false});spark(m.x-20*dir,isB?m.y-170:m.y-m.h-80,true,true,false);sfx('crit',0.45);registerHit(v2);
      if(m.hp<=0&&!m.dying)mobDie(m)})}
  // 追擊 follow-up
  if(mv!=='pet'&&crit&&rnd()<0.22+m2Zj()){const zv=Math.round(CH(POOL.zj)*GS.wm*(isB&&b4Prot()?0.2:1));setTimeout0(0.06,()=>{if(m.gone)return;if(m.kind==='boss'&&bossShielded())return;m.hp-=zv;statHit(zv,true,true);s.dmg.push({t:s.t,x:m.x+14,y:hy-42,v:zv,crit:true,label:behind?'無防備暴擊':'暴擊',zj:true,pet:false});registerHit(zv);if(m.hp<=0&&!m.dying)mobDie(m)})}
  if(m.hp<=0&&!m.dying)mobDie(m);
  return v}
function mobDie(m){const t=S0.t;m.dying=true;if(m.kind==='pillar'){pillarBreak(m);return}if(m.kind==='boss'){bossDie(m);return}if(m.state!=='air'){m.state='down';m.dieT=t+0.35}}
function statHit(v,crit,zj){const st=S0.st;st.dmg+=v;st.maxHit=Math.max(st.maxHit,v);st.hits++;if(crit)st.crits++;if(zj)st.zj++}
const timers=[];function setTimeout0(d,f){timers.push([S0.t+d,f])}
function registerHit(v){const s=S0,t=s.t;s.combo=(t-s.lastHit<=COMBO_GAP)?s.combo+1:1;s.lastHit=t;s.maxCombo=Math.max(s.maxCombo,s.combo);
  if(s.combo>0&&s.combo%20===0)proc('連擊',[40,150,200],'連');
  {const cb=comboBonus(s.combo);if(cb!==s.comboTier){if(cb>s.comboTier)s.tierT=t;s.comboTier=cb}}
  if(s.combo===1)s.comboTier=0;
  if(t<=s.rev_until&&s.P.hp<HPMAX&&!s.P.dead){const hv=Math.min(HEAL_CAP,Math.floor(v/2));s.P.hp=Math.min(HPMAX,s.P.hp+hv);s.heals.push({t,v:hv})}}
function hurtP(v,x,y){const s=S0,P=s.P;if(P.dead)return;v=m2Hurt(v,x);if(v<=0)return;P.hp-=v;s.rev_until=s.t+REV_WIN;
  s.dmg.push({t:s.t,x:P.x-20,y:P.y-170,v,crit:false,label:'',zj:false,pet:false,hurt:true});s.fx.push({k:'clank',x,y,t0:s.t});sfx('clank',0.5);
  for(let i=0;i<9;i++){const a=U(-Math.PI*0.9,-Math.PI*0.1),v2=U(260,520);s.parts.push({x,y,vx:Math.cos(a)*v2*(i%2?1:-1),vy:Math.sin(a)*v2,g:1300,life:0.2,t0:s.t,c:CH([[255,255,255],[220,225,235],[170,175,190]]),sz:1,drag:3})}
  if(P.hp<=0){P.hp=0;P.dead=true;P.deadT=s.t;sfx('hurt',0.7)}}
function drop(m){if(window.m2Drop)return m2Drop(m);const s=S0;const kinds=[];const n=RI(1,3);for(let i=0;i<n;i++)kinds.push('coin');
  if(rnd()<0.45)kinds.push(CH(['clay','stone','herb','clay','pot']));if(rnd()<0.38)kinds.push('food');
  for(const k of kinds)s.loot.push({k,x:m.x+U(-10,10),y:m.y-40,gy:clamp(m.y+U(-14,14),YMIN,YMAX),vx:U(-170,170),vy:-U(380,560),t0:s.t,state:'pop',amt:RI(38,96)})}
const ITEMN={food:'烤麵包',coin:'金幣',clay:'泥塊',stone:'粗糙的石頭',pot:'生命藥水 (10)',herb:'基本草藥'};
// ---------- input ----------
const K={},KP={};
addEventListener('keydown',e=>{const k=e.code;if(!K[k])KP[k]=1;K[k]=1;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(k))e.preventDefault();if(k==='F11'){}});
addEventListener('keyup',e=>{K[e.code]=0});
window.__key=(code,down)=>{if(down){if(!K[code])KP[code]=1;K[code]=1}else K[code]=0};
let GP={},GPP={};
function pollPad(){const pads=navigator.getGamepads?navigator.getGamepads():[];const p=pads&&[...pads].find(x=>x);const n={};
  if(p){const ax=p.axes||[],b=i=>p.buttons[i]&&p.buttons[i].pressed;n.l=(ax[0]<-0.4)||b(14);n.r=(ax[0]>0.4)||b(15);n.u=(ax[1]<-0.4)||b(12);n.d=(ax[1]>0.4)||b(13);
    n.jump=b(0);n.atk=b(2);n.skill=b(3);n.stab=b(1);n.sum=b(4);n.use=b(5);n.start=b(9);n.esc=b(8)}
  GPP={};for(const k in n)if(n[k]&&!GP[k])GPP[k]=1;GP=n}
const held=a=>a.some(k=>K[k]),press=a=>a.some(k=>KP[k]);
const IN={l:()=>held(['ArrowLeft','KeyA'])||GP.l,r:()=>held(['ArrowRight','KeyD'])||GP.r,u:()=>held(['ArrowUp','KeyW'])||GP.u,d:()=>held(['ArrowDown','KeyS'])||GP.d,
  atk:()=>press(['KeyJ','KeyZ'])||GPP.atk,jump:()=>press(['Space'])||GPP.jump,stab:()=>press(['KeyK'])||GPP.stab,skill:()=>press(['KeyL','KeyX'])||GPP.skill,sum:()=>press(['KeyV'])||GPP.sum,bag:()=>press(['KeyI']),
  use:()=>press(['KeyE','KeyF'])||GPP.use,start:()=>press(['Enter','NumpadEnter'])||GPP.start,esc:()=>press(['Escape','KeyP'])||GPP.esc};
// ---------- player moves ----------
// act: {type,t,dur,hitAt,done,targets}
const MOVES={sw:{dur:0.28,hitAt:0.10,reach:[0,118],dy:30},sw2:{dur:0.28,hitAt:0.10,reach:[0,118],dy:30},up:{dur:0.38,hitAt:0.10,reach:[0,112],dy:30},
  slam:{dur:0.62,hitAt:0.30,reach:[-30,170],dy:40},wind:{dur:1.0,hitAt:0.46,reach:[0,0],dy:0},air:{dur:0.5,hitAt:0.0,reach:[-10,110],dy:34},stab:{dur:0.5,hitAt:0.22,reach:[0,150],dy:30}};
function startAct(type){const P=S0.P;P.hc=0;m2Act(type);P.act={type,t:0,dur:MOVES[type].dur,hitAt:MOVES[type].hitAt,done:false,hitIds:{}};
  if(type==='wind'){sub('苦達斯','斬風——！',1.1);S0.callout={t0:S0.t,txt:'斬風'};sfx('wind',0.5)}
  else if(type==='slam'){S0.callout={t0:S0.t,txt:'大地橫掃'}}
  else if(type==='stab'){S0.callout={t0:S0.t,txt:'心臟刺擊'}}
  if(type!=='wind')setTimeout0(Math.max(0,MOVES[type].hitAt-0.05),()=>sfx('swing',0.35))}
function poseOf(P){const a=P.act;if(!a)return null;const t=a.t;
  switch(a.type){case 'sw':return t<a.hitAt-0.03?'windup':t<a.hitAt+0.13?'swing':'follow';
  case 'sw2':return t<a.hitAt-0.03?'lowwind':'follow';
  case 'up':return t<a.hitAt-0.02?'lowwind':'upswing';
  case 'slam':return t<a.hitAt-0.02?'windup2':'slam';
  case 'wind':return t<0.44?'charge':t<0.54?'swing':'follow';
  case 'stab':return t<0.19?'charge':t<0.36?'swing':'follow';
  case 'air':return 'airdive'}return null}
function downAhead(){const s=S0,P=s.P;return s.mobs.some(m=>!m.gone&&!m.dying&&m.state==='down'&&m.kind!=='boss'&&m.kind!=='pillar'&&(m.x-P.x)*P.face>0&&(m.x-P.x)*P.face<900&&Math.abs(m.y-P.y)<60)}
function meleeHits(type){const s=S0,P=s.P,mv=MOVES[type];const tg=[];
  for(const m of s.mobs){if(m.gone||m.dying&&(m.kind==='pillar'||m.kind==='boss'))continue;const big=m.kind==='boss'?60:m.kind==='pillar'?20:0;const dx=(m.x-P.x)*P.face;if(dx<mv.reach[0]||dx>mv.reach[1]+big)continue;if(Math.abs(m.y-P.y)>mv.dy+big*0.6)continue;if(m.h>130)continue;tg.push(m)}
  if(type==='stab'&&tg.length>1){tg.sort((a,b)=>Math.abs(a.x-P.x)-Math.abs(b.x-P.x));tg.length=1}
  const multi=tg.length>=2&&type!=='stab';for(const m of tg)hitMob(m,type,{multi});if(tg.length&&['sw','sw2','up'].includes(type)&&rnd()<GS.spin)m2Spin(tg);return tg.length}
function stepPlayer(dt){const s=S0,P=s.P,t=s.t;if(P.dead||s.ritual||s.trans||m2Down())return;
  const spdMul=(buffed()?BUFF_SPD:1)*(1+GS.aspd);
  let mx=(IN.r()?1:0)-(IN.l()?1:0),my=(IN.d()?1:0)-(IN.u()?1:0);if(AUTO){mx=AI.mx;my=AI.my}
  const wantAtk=IN.atk()||(AUTO&&AI.atk),wantJump=IN.jump()||(AUTO&&AI.jump),wantSkill=IN.skill()||(AUTO&&AI.skill),wantSum=IN.sum()||(AUTO&&AI.sum),wantStab=IN.stab()||(AUTO&&AI.stab);
  if(wantSum&&!s.bard){if(s.food>=FOOD_MAX)summonBard();else if(t-s.hungryT>0.4){s.hungryT=t;sfx('clank',0.2)}}
  P.slamCD-=dt;const a=P.act;
  if(a){a.t+=dt*spdMul;
    if(wantAtk&&['sw','sw2'].includes(a.type))P.chainBuf=1;
    if(!a.done&&a.t>=a.hitAt&&a.type!=='air'){a.done=true;
      if(a.type==='wind'){s.blades.push({x:P.x+70*P.face,y:P.y,t0:t,dir:P.face,hit:{}});shake(8,0.25);s.hitstop=0.05;
        if(a.dbl){const x0=P.x,y0=P.y,f=P.face;setTimeout0(0.24,()=>{s.blades.push({x:x0+70*f,y:y0,t0:s.t,dir:f,hit:{},second:true});sfx('wind',0.45);shake(6,0.2)})}}
      else{const n=meleeHits(a.type);if(a.type==='up'&&n)P.rh=Math.min(RHMAX,P.rh+1);
        if(a.type==='slam'){s.fx.push({k:'ring',x:P.x+70*P.face,y:P.y,t0:t,col:[255,230,170],big:true});puff(P.x+80*P.face,P.y,18,[214,170,128],150,0.6,4);shake(11,0.3);
          for(let j=0;j<10;j++)s.parts.push({x:P.x+80*P.face+U(-60,60),y:P.y-4,vx:U(-220,220),vy:-U(250,520),g:1500,life:0.75,t0:t,c:CH([[150,120,95],[190,150,110],[110,88,70]]),sz:CH([2,3]),floor:P.y+8});
          s.fx.push({k:'crack',x:P.x+75*P.face,y:P.y,t0:t});if(n){P.rh=Math.min(RHMAX,P.rh+1);if(rnd()<GS.bounce){P.rh=Math.min(RHMAX,P.rh+1);proc('彈力',[60,140,200],'彈')}}}}}
    if(a.type==='air'){ // dive: hits on contact while falling
      for(const m of s.mobs){if(m.gone||a.hitIds[m.id]||m.dying&&(m.kind==='pillar'||m.kind==='boss'))continue;const dx=(m.x-P.x)*P.face;if(dx>-10&&dx<(m.kind==='boss'?170:110)&&Math.abs(m.y-P.y)<34&&m.h<130){a.hitIds[m.id]=1;const multi=false;hitMob(m,'air',{multi});P.rh=Math.min(RHMAX,P.rh+1)}}}
    if(a.t>=a.dur||(a.type==='air'&&P.h<=0&&a.t>0.05)){const nxt=P.chainBuf&&a.type==='sw'?'sw2':P.chainBuf&&a.type==='sw2'?'up':null;P.act=null;P.chainBuf=0;if(nxt)startAct(nxt)}
  }
  if(!P.act||P.act.type==='air'){
    if(wantAtk){if(P.h>20&&!P.act){startAct('air');P.vh=-700}else if(P.h<=0&&!P.act)startAct('sw')}
    else if(wantSkill&&P.h<=0&&!P.act){if(P.rh>=WIND_COST){const dbl=downAhead();if(!dbl)P.rh-=WIND_COST;startAct('wind');P.act.dbl=dbl;if(dbl){proc('免費・雙重斬風',[40,160,140],'風');S0.callout={t0:t,txt:'斬風 ×2'}}}else if(P.slamCD<=0){P.slamCD=2.2;startAct('slam')}else s.denyL=t}
    else if(wantStab&&P.h<=0&&!P.act){if(P.rh>=STAB_COST){P.rh-=STAB_COST;startAct('stab')}else s.denyK=t}
    else if(wantJump&&P.h<=0&&!P.act){P.vh=1174;P.h=0.01;sfx('jump',0.3)}
  }
  // movement (no move during ground attacks except tiny drift)
  const free=!P.act||P.act.type==='air';
  const ox=P.x,oy=P.y;
  if(free){const sp=P.h>0?280:300;let vx=mx*sp,vy=my*150;if(mx&&my){vx*=0.85;vy*=0.85}P.x+=vx*dt;if(P.h<=0||true)P.y+=vy*dt;if(mx)P.face=mx>0?1:-1}
  else if(P.act&&['sw','sw2','up'].includes(P.act.type)&&P.act.t<0.12)P.x+=P.face*40*dt;
  else if(P.act&&P.act.type==='stab'&&P.act.t>0.15&&P.act.t<0.27)P.x+=P.face*260*dt;
  const lo=s.lock?s.cam+40:30,hi=s.lock?s.cam+W-40:WW-30;P.x=clamp(P.x,lo,hi);P.y=clamp(P.y,YMIN,YMAX);
  P.kspd=Math.abs(P.x-ox)/dt;P.mspd=Math.hypot(P.x-ox,P.y-oy)/dt;
  if(P.h>0||P.vh>0){P.h+=P.vh*dt;P.vh-=5104*dt;if(P.h<=0){P.h=0;P.vh=0;puff(P.x,P.y-3,4,[214,170,128],20,0.35,2)}}
  if(P.kspd>120&&P.h===0&&t-P.lastdust>0.1){P.lastdust=t;puff(P.x-25*P.face,P.y-3,3,[214,170,128],10,0.33,2)}
}
// ---------- bard ----------
function summonBard(){const s=S0,P=s.P,t=s.t;s.bard={x:P.x-150*P.face,y:P.y-18,t0:t,in:t+0.12,buffT:t+0.55,out:t+BARD_STAY,face:P.face,buffDone:false,gone:false};
  s.fx.push({k:'circle',x:s.bard.x,y:s.bard.y,t0:t});sfx('summon',0.5);musPlay('lute',0.75,0.25,true);musVol(CURM,DUCKV,0.4);sub('尋歡作樂','♪ 來，給你加點勁兒！',1.9)}
function stepBard(dt){const s=S0,b=s.bard,t=s.t;if(!b)return;
  if(!b.inDone&&t>=b.in){b.inDone=1;puff(b.x,b.y-70,14,[255,245,210],40,0.45,3)}
  if(!b.buffDone&&t>=b.buffT){b.buffDone=1;s.fx.push({k:'ring',x:s.P.x,y:s.P.y,t0:t,col:[255,170,60]});
    for(let i=0;i<24;i++)s.parts.push({x:s.P.x,y:s.P.y-70,vx:U(-260,260),vy:-U(100,380),g:600,life:0.5,t0:t,c:CH([[255,220,90],[255,140,40],[255,90,30]]),sz:2,drag:2});
    s.procs.push([t+0.13,'勇猛讚歌',[214,160,40],'♪'],[t+0.41,'攻擊力提升',[200,60,40],'攻'],[t+0.69,'暴擊傷害提升',[230,120,30],'暴'])}
  if(t>b.in+0.3&&t<b.out&&Math.floor(t/0.2)!==Math.floor((t-dt)/0.2))s.parts.push({x:b.x+30*b.face,y:b.y-115,vx:U(20,60)*b.face,vy:-80,g:0,life:1.0,t0:t,c:CH([[255,220,90],[140,220,255],[255,150,200],[170,255,150]]),note:true,sway:U(0,6)});
  if(t>=b.out){s.food=0;puff(b.x,b.y-70,18,[250,240,200],40,0.5,3);for(let i=0;i<10;i++)s.parts.push({x:b.x,y:b.y-80,vx:U(-140,140),vy:-U(100,280),g:200,life:0.55,t0:t,c:[255,230,120],sz:2,drag:2});s.bard=null;musStop('lute',0.8);musVol(CURM,BGMV,1.2)}}
// ---------- pet (auto) ----------
function stepPet(dt){const s=S0,p=s.pet,P=s.P,t=s.t;
  p.g=Math.min(1,p.g+PET_RATE*dt);
  const spit=t-p.spit<0.3&&t-p.spit>-0.1;
  const tx=P.x-118*P.face,ty=P.y+24;
  if(!spit){const nx=p.x+(tx-p.x)*Math.min(1,dt*4);p.v=(nx-p.x)/dt;p.x=nx;p.y+=(ty-p.y)*Math.min(1,dt*3);if(Math.abs(p.v)>30)p.face=p.v>0?1:-1;else p.face=P.face}else p.v=0;
  if(p.g>=1&&!P.dead&&!s.trans){let best=null,bd=1e9;for(const m of s.mobs){if(m.gone||m.dying)continue;if(m.kind==='boss'&&bossShielded())continue;const d=Math.abs(m.x-p.x)+Math.abs(m.y-p.y)*2;if(d<bd&&Math.abs(m.x-s.cam-640)<600){bd=d;best=m}}
    if(best&&bd<760){p.g=0;p.spit=t;p.face=best.x>p.x?1:-1;s.fire.push({t0:t,t1:t+0.35,x0:p.x+40*p.face,y0:p.y-44,m:best});sfx('fire',0.35)}}
  for(const f of s.fire){if(!f.done&&t>=f.t1){f.done=1;const m=f.m;if(!m.gone){hitMob(m,'pet',{});if(p.en<PET_EN_MAX){p.en++;p.enPulse=t}puff(m.x-6,m.y-70,10,[255,150,50],24,0.3,2);s.fx.push({k:'boom',x:m.x-6,y:m.y-70,t0:t})}}}
  s.fire=s.fire.filter(f=>!f.done);
  // 守護泡泡：HP ≤ 1/2 時自動消耗 2 格能量，10 秒內回復 1/2 HP
  if(!s.shield&&!P.dead&&P.hp<=HPMAX/2&&p.en>=SHIELD_COST&&t>=p.shCD&&!s.ritual){p.en-=SHIELD_COST;p.shCD=t+SHIELD_CD;p.spit=t;
    s.shield={t0:t,until:t+SHIELD_DUR,next:t+SHIELD_TICK,per:Math.round(HPMAX/2/(SHIELD_DUR/SHIELD_TICK))};proc('守護泡泡',[60,170,120],'護');sfx('summon',0.35);
    for(let i=0;i<16;i++)s.parts.push({x:p.x,y:p.y-40,vx:(P.x-p.x)*U(1.5,2.5),vy:-U(120,300),g:400,life:0.45,t0:t,c:CH([[170,255,200],[120,230,255],[255,255,255]]),sz:1,drag:1})}
  if(s.shield){const sh=s.shield;while(t>=sh.next&&sh.next<=sh.until+1e-6){sh.next+=SHIELD_TICK;if(!P.dead&&P.hp<HPMAX){const hv=Math.min(sh.per,HPMAX-P.hp);P.hp+=hv;s.heals.push({t,v:hv,tick:true})}}
    if(t>=sh.until||P.dead)s.shield=null}}
// ---------- mobs ----------
function stepMobs(dt){const s=S0,P=s.P,t=s.t;let tokS=s.mobs.some(m=>m.wind>0&&m.kind==='sword'),tokB=s.mobs.some(m=>m.wind>0&&m.kind==='bow');
  stepBoss(dt);stepBleed(dt);
  for(const m of s.mobs){if(m.gone||m.kind==='boss'||m.kind==='pillar')continue;
    if(m.dying&&m.state==='down'&&t>=m.dieT){kill(m);continue}
    if(t<m.frz)continue;
    // facing with reaction delay (enables 無防備 from behind)
    const want=P.x>=m.x?1:-1;
    if(m.state==='walk'&&m.wind<=0){if(want!==m.face){if(m.turnT<=0)m.turnT=TURN_DELAY;m.turnT-=dt;if(m.turnT<=0){m.face=want;m.turnT=0}}else m.turnT=0}
    if(m.state==='air'){m.x+=m.vx*dt;m.vh-=1900*dt;m.h+=m.vh*dt;m.rot=(Math.floor((t-m.flash)/0.06)*90)%360;
      if(m.h<=0){m.h=0;puff(m.x,m.y-3,5,[214,170,128],40,0.4,3);if(!m.bounced){m.bounced=true;m.vh=200;m.vx*=0.4}else{m.state='down';m.rot=0;m.getup=t+U(0.8,1.2);if(m.dying)m.dieT=t+0.35}}}
    else if(m.state==='down'){if(!m.dying&&t>=m.getup){m.state='walk';m.cd=Math.max(m.cd,0.8);puff(m.x,m.y-4,4,[214,170,128],40,0.3,2)}}
    else if(m.state==='stun'){m.x+=m.vx*dt;m.vx*=Math.exp(-9*dt);if(t>=m.stun)m.state='walk'}
    if(m.state==='walk'){m.cd-=dt*(m.slowU>t&&m.slowK?0.6:1)*(DIF().spd||1);const dx=P.x-m.x,dy=P.y-m.y;
      if(m.wind>0){m.wind-=dt;m.moving=false;if(m.wind<=0){ // strike
          if(m.kind==='sword'){if(Math.abs(P.x-m.x)<105&&Math.abs(dy)<26&&(P.x-m.x)*m.face>0&&P.h<70){m.recoil=t;hurtP(Math.round(CH([514,441,486,472])*(m.str?STR_DMG:1)),P.x-30*m.face,P.y-78)}m.cd=U(2.6,4.2)*(m.str?STR_CD:1)*DIF().cd}
          else{s.arrows.push({x:m.x+50*m.face,y:m.y,h:68,dir:m.face,hit:false,str:m.str});m.cd=U(3.0,4.8)*(m.str?STR_CD:1)*DIF().cd}}}
      else{let gx,gy,spd=(m.kind==='sword'?150:120)*(m.str?STR_SPD:1);if(m.slowU>t)spd*=(m.slowK||0.7);spd*=(DIF().spd||1);
        if(m.kind==='sword'){const side=m.x<P.x?-1:1;const rank=s.mobs.filter(o=>!o.gone&&o.kind==='sword'&&(o.x<P.x?-1:1)===side&&o.id<m.id).length;gx=P.x+side*(86+rank*70);gy=P.y+(rank%2?1:-1)*(rank?18:0)+m.strafe*6}
        else{const side=m.x<P.x?-1:1;gx=P.x+side*380;gy=P.y}
        if(s.lock){const lo=s.lock[0]+70,hi=s.lock[1]+W-70;if(gx>hi)gx=m.kind==='sword'?P.x-86:Math.max(lo,P.x-380);if(gx<lo)gx=m.kind==='sword'?P.x+86:Math.min(hi,P.x+380);gx=clamp(gx,lo,hi)}
        if(m.enter&&Math.abs(m.x-s.cam-640)<580)m.enter=false;if(m.enter)spd=220;
        const ddx=gx-m.x,ddy=gy-m.y,d=Math.hypot(ddx,ddy*1.6);m.moving=d>6;
        if(d>6){m.x+=ddx/d*spd*dt;m.y+=ddy/d*spd*0.6*dt}
        m.y=clamp(m.y,YMIN,YMAX);
        const inR=m.kind==='sword'?(Math.abs(dx)<100&&Math.abs(dy)<20):(Math.abs(dy)<16&&Math.abs(dx)<620&&Math.abs(dx)>140);
        if(inR&&m.cd<=0&&m.face===want&&!P.dead&&!s.ritual&&!s.trans){if(m.kind==='sword'&&!tokS){m.wind=0.6;tokS=true}else if(m.kind==='bow'&&!tokB){m.wind=0.65;tokB=true}}}}
    if(s.lock&&!m.enter)m.x=clamp(m.x,s.cam+24,s.cam+W-24);
    // separate overlapping mobs
    for(const o of s.mobs){if(o===m||o.gone||o.kind==='pillar')continue;const ex=m.x-o.x,ey=(m.y-o.y)*2;if(Math.abs(ex)<56&&Math.abs(ey)<34){m.x+=(ex>=0?1:-1)*90*dt;m.y+=(m.y>=o.y?1:-1)*30*dt}}
  }
  for(const a of s.arrows){a.x+=820*dt*a.dir;if(!a.hit&&Math.abs(a.x-P.x)<30&&Math.abs(a.y-P.y)<22&&P.h<60){a.hit=true;hurtP(Math.round(CH([386,397,362])*(a.str?STR_DMG:1)),P.x+14*-a.dir,P.y-a.h);
      for(let j=0;j<2;j++)s.parts.push({x:P.x,y:P.y-a.h,vx:U(80,200)*a.dir,vy:-U(150,300),g:1400,life:0.5,t0:t,c:[200,190,170],sz:1,floor:P.y})}}
  s.arrows=s.arrows.filter(a=>!a.hit&&a.x>s.cam-200&&a.x<s.cam+W+200)}
function kill(m){const s=S0;m.gone=true;puff(m.x,m.y-30,16,[200,176,140],60,0.55,4);s.fx.push({k:'exp',x:m.x,y:m.y-120,t0:s.t});drop(m);s.kills++;
  s.exp+=3.5;if(s.exp>=100){s.exp-=100;s.lv++;card('LEVEL UP','Lv.'+s.lv,1.2)}
  s.log.push([s.t,'exp','經驗值 +'+(1250+s.kills*47).toLocaleString('en-US')])}
// ---------- blades (斬風) ----------
function stepBlades(dt){const s=S0,t=s.t;for(const b of s.blades){const age=t-b.t0;if(age<0.62)b.x+=1150*dt*b.dir;
  if(age<0.62){const hits=s.mobs.filter(m=>!m.gone&&!b.hit[m.id]&&Math.abs(m.x-b.x)<(m.kind==='boss'?110:60)&&Math.abs(m.y-b.y)<(m.kind==='boss'?70:46)&&m.h<160);
    for(const m of hits){b.hit[m.id]=1;hitMob(m,'wind',{multi:Object.keys(b.hit).length>=2})}}}
  s.blades=s.blades.filter(b=>t-b.t0<0.7)}
// ---------- loot ----------
function stepLoot(dt){const s=S0,P=s.P,t=s.t;
  for(const L of s.loot){const age=t-L.t0;
    if(L.state==='pop'){L.x=clamp(L.x+L.vx*dt,50,WW-50);L.vx*=Math.exp(-2*dt);L.vy+=1700*dt;L.y+=L.vy*dt;if(L.y>=L.gy&&L.vy>0){L.y=L.gy;if(Math.abs(L.vy)>200)L.vy*=-0.35;else{L.state='rest';L.vy=0;L.vx=0}}}
    else if(L.state==='rest'){if(age>0.6&&Math.abs(L.x-P.x)<62&&Math.abs(L.gy-P.y)<44&&P.h===0&&!P.dead){L.state='got';
      const toBard=L.k==='food'&&s.food<FOOD_MAX&&!s.bard&&!s.fly.some(f=>f.dst==='bard'&&!f.done&&s.food+1>=FOOD_MAX);
      s.fly.push({k:L.k,amt:L.amt,it:L.it,t0:t,sx:L.x-s.cam,sy:L.y,dst:toBard?'bard':'bag'});sfx('coin',0.25)}}}
  for(const f of s.fly){if(!f.done&&t-f.t0>=0.5){f.done=true;
    if(f.dst==='bag')s.bagpulse=t;else{s.foodpulse=t;s.food=Math.min(FOOD_MAX,s.food+1);if(s.food>=FOOD_MAX){s.food_full=t;sfx('ready',0.45)}}
    if(f.k==='coin'){m2Gold(f.amt)}else if(f.k.startsWith('gem'))m2Gem(f);else if(f.k==='gear')m2GotGear(f.it);else if(f.k==='tfpot'||f.k==='tfpot2')m21Pot(f.k);else if(f.k==='sock')m21Sock();else s.log.push([t,f.k,'獲得 '+ITEMN[f.k]])}}
  s.loot=s.loot.filter(L=>L.state!=='got');s.fly=s.fly.filter(f=>t-f.t0<0.6)}
// ---------- waves / respawn / stages ----------
function stepWaves(dt){const s=S0,P=s.P,t=s.t;const alive=s.mobs.filter(m=>!m.gone&&m.kind!=='boss'&&m.kind!=='pillar').length;
  if(s.wave<WAVES.length){const w=WAVES[s.wave];
    if(s.waveState==='pre'&&P.x>=w.trig&&!s.trans){s.waveState='fight';s.lock=w.lock.map(v=>v<0?CAMMAX:v);s.toSpawn=w.spawn.slice();s.spawnT=t+0.6;s.extra=w.extra+(DIF().xm||0);s.extraT=t+U(6,10);card('戰鬥開始','BATTLE START',1.4);sfx('start',0.4)}
    if(s.waveState==='fight'){
      if(s.toSpawn.length&&t>=s.spawnT&&alive<4+(DIF().xm||0)){const [k,side]=s.toSpawn.shift();spawnMob(k,side);s.spawnT=t+U(0.6,1.4)}
      if(s.extra>0&&t>=s.extraT&&alive<4+(DIF().xm||0)){s.extra--;spawnMob(CH(['sword','sword','bow']),CH([1,-1]));s.extraT=t+U(6,11);sub('','增援出現了！',1.2)}
      if(!s.toSpawn.length&&s.extra<=0&&alive===0){s.wave++;s.waveState='pre';s.lock=null;s.respawnT=t+U(8,14);
        if(s.wave>=WAVES.length){card('勝利','VICTORY',2.0);sfx('ready',0.5);s.goT=t;
          if(s.stage==='canyon'){s.caveOn=true;setTimeout0(2.2,()=>sub('','峽谷盡頭的礦坑入口……走到坑口按 E（或 ↑）進入。',3.8))}
          else if(ENDT[s.stage]){s.mineDone=true;setTimeout0(2.2,()=>sub('','坑道深處透出微光……往右走 →',3.0))}}
        else{s.goT=t;sub('','往右前進 →',1.6)}}}}
  // random stragglers between waves (不定時重生)
  if(!s.lock&&!s.ritual&&!s.trans&&t>=s.respawnT){if(alive<2&&s.wave<WAVES.length)spawnMob(CH(['sword','bow','sword']),1);s.respawnT=t+U(8,15)}
  // cave mouth (canyon right end) -> mine
  if(s.stage==='canyon'&&s.caveOn&&!s.trans&&nearCave()&&(IN.use()||(P.y<=YMIN+1&&IN.u())||(AUTO&&AI.use)))startTrans('mine');
  // mine far end -> shrine
  if(ENDT[s.stage]&&s.mineDone&&!s.trans&&P.x>=WW-70)startTrans(ENDT[s.stage]);
  // statue interact (shrine)
  if(s.stage==='shrine'&&s.statueOn&&!s.ritual&&!s.trans&&nearStatue()&&(IN.use()||(AUTO&&AI.use)))startRitual()}
const nearCave=()=>{const P=S0.P;return P.x>=CAVE.x0&&P.x<=CAVE.x1&&P.y<YMIN+40};
const nearStatue=()=>{const P=S0.P;return Math.abs(P.x-STATUE.x)<140&&Math.abs(P.y-STATUE.y-20)<70};
function startTrans(to){const s=S0;s.trans={t0:s.t,to,done:false};if(to==='mine')sfx('start',0.3)}
function stepTrans(){const s=S0,tr=s.trans;if(!tr)return;const age=s.t-tr.t0;if(age>=0.55&&!tr.done){tr.done=true;m2Goto(tr.to)}if(age>=1.15)s.trans=null}
function setStage(n,opt={}){const s=S0;s.stage=n;WW=STAGES[n].ww;CAMMAX=WW-W;WAVES=WAVESET[n];s.wave=0;s.waveState='pre';s.lock=null;
  s.mobs=[];s.loot=[];s.arrows=[];s.fire=[];s.blades=[];s.tele=[];s.boss=null;s.cam=0;s.goT=null;s.respawnT=s.t+U(8,14);s.mineDone=false;
  const P=s.P;P.x=opt.x||200;P.y=552;P.face=1;P.act=null;P.h=0;P.vh=0;s.pet.x=P.x-118;s.pet.y=576;if(s.bard){s.bard.x=P.x-150;s.bard.y=P.y-18}
  s.statueOn=(n==='shrine');s.caveOn=false;
  if(n==='mine'){card(STAGES.mine.name,'RED ROCK MINE',1.8);setTimeout0(1.0,()=>sub('','坑道裡的魔像比外面更兇猛……小心！',2.6))}
  if(n==='shrine'){setTimeout0(0.6,()=>sub('','礦坑深處的祭壇，女神像靜靜守著。走近按 E 祈禱。',3.4))}
  if(n==='boss')setupBoss();m2OnStage(n)}
function setupBoss(){const s=S0,t=s.t;s.boss={m:null,kneelUntil:-9,regrown:false,nextAtk:t+4,summonT:t+9,atk:null};
  const m=mob('boss',960,560);m.face=-1;m.enter=false;s.mobs.push(m);s.boss.m=m;
  for(const [x,y] of PILLAR_POS){const pl=mob('pillar',x,y);pl.face=1;pl.rise=t;s.mobs.push(pl)}
  s.P.hp=HPMAX;s.P.rh=0;s.bossT0=t;s.lock=[0,0];s.st={dmg:0,maxHit:0,hits:0,crits:0,zj:0,t0:t};s.maxComboB=0;
  setTimeout0(0.5,()=>sub('看守者','……又一個想通過試煉的人。赤晶柱在，你就傷不了我。',3.4));
  setTimeout0(4.1,()=>sub('','先打碎 4 根赤晶柱，看守者才會受傷！',3.0))}
const bossShielded=()=>{const s=S0;return !!s.boss&&!s.boss.b4&&s.mobs.some(m=>m.kind==='pillar'&&!m.gone&&!m.dying)};
function stepBoss(dt){const s=S0,b=s.boss,t=s.t,P=s.P;if(!b)return;const m=b.m;
  for(const pl of s.mobs)if(pl.kind==='pillar'&&pl.dying&&t>=pl.dieT)pl.gone=true;
  for(const c of s.tele){if(!c.done&&t>=c.t1){c.done=true;shake(c.big?12:6,0.3);puff(c.x,c.y,c.big?22:9,[150,110,90],c.r,0.6,3);s.fx.push({k:'ring',x:c.x,y:c.y,t0:t,col:[255,120,80],big:true});
      if(c.big)s.fx.push({k:'crack',x:c.x,y:c.y,t0:t});
      if(!P.dead&&Math.hypot(P.x-c.x,(P.y-c.y)*2.2)<c.r&&P.h<80&&!(c.g&&s.tg[c.g])){if(c.g)s.tg[c.g]=1;hurtP(c.dmg,P.x,P.y-70)}}}
  s.tele=s.tele.filter(c=>t<c.t1+0.5);
  if(m.gone||m.dying)return;
  if(b.b4){stepB4(dt);return}if(b.sp){stepSP(dt);return}if(b.ms){stepMS(dt);return}
  if(!b.regrown&&m.hp<=m.hpmax*0.5){b.regrown=true;regrowPillars()}
  if(bossShielded()&&t>=b.summonT){b.summonT=t+12;const alive=s.mobs.filter(o=>!o.gone&&(o.kind==='sword'||o.kind==='bow')).length;
    if(alive<3){const pls=s.mobs.filter(o=>o.kind==='pillar'&&!o.gone&&!o.dying);const pl=CH(pls);const mm=mob(CH(['sword','sword','bow']),clamp(pl.x+(pl.x<640?60:-60),60,WW-60),clamp(pl.y+U(-10,10),YMIN,YMAX));
      mm.enter=false;mm.summon=1;mm.face=P.x>mm.x?1:-1;s.mobs.push(mm);puff(mm.x,mm.y-40,14,[255,90,70],40,0.5,3);sub('','赤晶柱叫出了魔像！',1.4)}}
  if(t<m.frz)return;
  if(t<b.kneelUntil){m.moving=false;b.atk=null;return}
  const want=P.x>=m.x?1:-1;
  if(b.atk){m.moving=false;if(t>=b.atk.end){b.atk=null;b.nextAtk=t+U(2.4,3.6)}return}
  m.face=want;
  const gx=P.x-want*190,ddx=gx-m.x,ddy=P.y-m.y,d=Math.hypot(ddx,ddy*1.6);m.moving=d>14;
  if(m.moving){m.x+=ddx/d*80*dt;m.y+=ddy/d*46*dt}m.x=clamp(m.x,140,WW-140);m.y=clamp(m.y,YMIN+6,YMAX-6);
  if(t>=b.nextAtk&&!P.dead&&!s.trans)bossAttack(Math.abs(P.x-m.x)<300?CH(['slam','slam','rocks']):CH(['slam','rocks','rocks']))}
function bossAttack(kind){const s=S0,b=s.boss,t=s.t,P=s.P;if(!b||b.m.dying)return;
  if(kind==='slam'){s.tele.push({x:clamp(P.x,80,WW-80),y:P.y,r:125,t0:t,t1:t+1.0,dmg:900,big:true});b.atk={k:'slam',t0:t,end:t+1.4};sub('看守者','——砸碎你！',1.0)}
  else{for(let i=0;i<3;i++){const k=i?1:0.15;s.tele.push({x:clamp(P.x+U(-170,170)*k,60,WW-60),y:clamp(P.y+U(-40,40)*k,YMIN,YMAX),r:64,t0:t+i*0.25,t1:t+0.95+i*0.25,dmg:300,rock:true})}b.atk={k:'rocks',t0:t,end:t+1.7}}}
function pillarBreak(m){if(S0.boss&&S0.boss.b4)return b4Break(m);const s=S0,t=s.t;m.dieT=t+0.45;shake(10,0.35);sfx('crit',0.6);
  for(let i=0;i<26;i++)s.parts.push({x:m.x+U(-20,20),y:m.y-U(40,170),vx:U(-320,320),vy:-U(150,520),g:1500,life:0.8,t0:t,c:CH([[255,80,70],[200,30,40],[255,170,150],[120,20,30]]),sz:CH([1,2]),floor:m.y+6});
  const left=s.mobs.filter(o=>o.kind==='pillar'&&!o.gone&&!o.dying).length;proc('赤晶柱破壞',[200,40,50],'柱');
  if(left===0){const b=s.boss;b.kneelUntil=t+8;b.atk=null;card('看守者跪地','8 秒內全部算無防備暴擊！',1.6);sub('看守者','唔……柱子……！',1.6)}
  else{const b=s.boss;if(b&&!b.m.dying&&t>=b.kneelUntil){b.atk=null;sub('看守者','竟敢……！',1.0);setTimeout0(0.3,()=>bossAttack('slam'))}}}
function regrowPillars(){const s=S0,t=s.t;for(const [x,y] of PILLAR_POS.slice(0,2)){const pl=mob('pillar',x,y);pl.face=1;pl.rise=t;s.mobs.push(pl);puff(x,y-20,18,[255,90,80],40,0.6,3)}
  s.boss.kneelUntil=t;card('赤晶柱重生','峽谷看守者被赤色晶柱神秘的力量保護了',1.8);sub('看守者','試煉……還沒結束。',1.8);shake(8,0.4)}
function bossDie(m){if(S0.boss.b4)return b4Die(m);if(S0.boss.sp)return spDie(m);if(S0.boss.ms)return msDie(m);m2BossLoot(m);const s=S0,t=s.t;m.dieT=t+1.2;s.winT=t;s.boss.atk=null;s.tele=[];shake(16,0.8);sfx('crit',0.7);
  for(const o of s.mobs)if(o!==m&&!o.gone){o.dying=true;if(o.kind!=='pillar'){o.state='down';o.dieT=t+0.4}else o.dieT=t+0.4}
  for(let i=0;i<40;i++)s.parts.push({x:m.x+U(-80,80),y:m.y-U(40,260),vx:U(-300,300),vy:-U(100,500),g:1200,life:1.0,t0:t,c:CH([[150,130,120],[110,95,90],[200,180,160]]),sz:CH([2,3]),floor:m.y+8});
  card('勝利','VICTORY',3.0);setTimeout0(0.6,()=>sub('看守者','……你……通過了……女神的試煉……',2.8))}
function startRitual(){const s=S0;s.ritual={t0:s.t};s.P.act=null;sfx('statue',0.6);sub('苦達斯','……女神啊，請讓我通過試煉。',1.6)}
function stepRitual(dt){const s=S0,r=s.ritual;if(!r)return;const age=s.t-r.t0;
  if(age<1.6&&Math.floor(s.t/0.03)!==Math.floor((s.t-dt)/0.03)){const a=U(0,Math.PI*2),rr=U(90,150);s.parts.push({x:s.P.x+Math.cos(a)*rr,y:s.P.y-60+Math.sin(a)*rr*0.7,vx:-Math.cos(a)*rr/0.25,vy:-Math.sin(a)*rr*0.7/0.25,g:0,life:0.25,t0:s.t,c:[255,236,160],sz:1})}
  if(age>=5.2&&!r.end){r.end=1;s.ritual=null;setStage('boss',{x:220});s.fadeIn=s.t}}
function stepBleed(dt){const s=S0,t=s.t;for(const m of s.mobs){const b=m.bleed;if(!b||m.gone)continue;if(t>b.until+0.01){m.bleed=null;continue}
  if(t>=b.next){b.next+=BLEED_TICK;if(m.dying||(m.kind==='boss'&&bossShielded()))continue;const v=Math.round(CH(BLEED_POOL)*GS.wm*(m.kind==='boss'&&b4Prot()?0.2:1));m.hp-=v;statHit(v,false,false);
    s.dmg.push({t,x:m.x+U(-12,12),y:(m.kind==='boss'?m.y-250:m.y-m.h-96),v,bleed:true});
    for(let i=0;i<3;i++)s.parts.push({x:m.x+U(-14,14),y:m.y-m.h-U(50,90),vx:U(-40,40),vy:-U(40,120),g:900,life:0.4,t0:t,c:CH([[200,20,40],[150,10,30],[230,60,70]]),sz:1});
    if(m.hp<=0&&!m.dying)mobDie(m)}}}
// ---------- particles ----------
function stepParts(dt){const s=S0;for(const p of s.parts){const dr=p.drag||0;p.vx*=Math.exp(-dr*dt);p.vy*=Math.exp(-dr*dt);p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.floor!=null&&p.y>p.floor){p.y=p.floor;p.vy*=-0.35;p.vx*=0.6}}
  s.parts=s.parts.filter(p=>s.t-p.t0<p.life);if(s.parts.length>900)s.parts.splice(0,s.parts.length-900)}
function step(dt){const s=S0;
  if(s.hitstop>0){s.hitstop-=dt;s.t+=dt*0.15;stepParts(dt*0.15);return}
  s.t+=dt;const t=s.t;
  for(let i=timers.length-1;i>=0;i--)if(t>=timers[i][0]){const f=timers[i][1];timers.splice(i,1);f()}
  if(AUTO&&!window.__frozenAI)aiThink();else if(AUTO)Object.assign(AI,{mx:0,my:0,atk:0,jump:0,skill:0,sum:0,use:0,stab:0});
  stepPlayer(dt);stepBard(dt);stepPet(dt);stepMobs(dt);stepBlades(dt);stepLoot(dt);stepWaves(dt);stepRitual(dt);stepTrans();m2Step(dt);
  if(s.winT!=null&&t>=s.winT+4.2&&mode==='play'){m2Clear()}
  if(s.boss&&s.boss.m.dying&&t>=s.boss.m.dieT)s.boss.m.gone=true;
  const P=s.P;
  if(buffed()&&Math.floor(t/0.16)!==Math.floor((t-dt)/0.16))s.parts.push({x:P.x+U(-30,30),y:P.y-P.h-U(0,120),vx:0,vy:-U(50,90),g:0,life:0.35,t0:t,c:CH([[255,226,150],[255,196,110]]),sz:1,faint:true});
  if(P.act&&P.act.type==='wind'&&P.act.t<0.44&&Math.floor(t/0.03)!==Math.floor((t-dt)/0.03)){const a=U(0,Math.PI*2),r=U(90,140);s.parts.push({x:P.x+Math.cos(a)*r,y:P.y-60+Math.sin(a)*r*0.7,vx:-Math.cos(a)*r/0.22,vy:-Math.sin(a)*r*0.7/0.22,g:0,life:0.22,t0:t,c:[170,255,220],sz:1})}
  if(P.act&&P.act.type==='slam'&&P.act.t<P.act.hitAt&&Math.floor(t/0.03)!==Math.floor((t-dt)/0.03)){const a=U(0,Math.PI*2),r=U(90,140);s.parts.push({x:P.x+Math.cos(a)*r,y:P.y-60+Math.sin(a)*r*0.7,vx:-Math.cos(a)*r/0.22,vy:-Math.sin(a)*r*0.7/0.22,g:0,life:0.22,t0:t,c:[255,220,140],sz:1})}
  stepParts(dt);
  // camera
  const psx=P.x-s.cam;let tgt=psx<380?P.x-380:psx>900?P.x-900:s.cam;tgt=clamp(tgt,0,CAMMAX);
  if(s.lock)tgt=clamp(tgt,s.lock[0],s.lock[1]);if(s.ritual)tgt=clamp(STATUE.x-900,0,CAMMAX);
  s.cam+=(tgt-s.cam)*Math.min(1,dt*4);
  s.mobs=s.mobs.filter(m=>!m.gone);s.dmg=s.dmg.filter(e=>t-e.t<1.1);s.fx=s.fx.filter(e=>t-e.t0<2.5);s.heals=s.heals.filter(e=>t-e.t<1.2);s.procs=s.procs.filter(p=>t-p[0]<1.2);if(s.log.length>12)s.log.splice(0,s.log.length-12);
  s.shakes=s.shakes.filter(e=>t<e[0]+e[2]);
  if(P.dead&&t-P.deadT>1.2&&mode==='play'){mode='dead'}
}
// ================= drawing (scene6.draw_frame) =================
function shadowE(sx,sy,w,h=0){const k=Math.max(0.4,1-h/260),ww=Math.floor(w*k);X.fillStyle='rgba(60,24,10,0.372)';X.beginPath();X.ellipse(sx,sy,ww,ww*0.25,0,0,Math.PI*2);X.fill()}
function smear(sx,sy,typ,prog,flame,big,wind,flip){const R=big?40:30,sz=2*R+14,c=R+7;let a0,a1;
  if(['sw','air','wind'].includes(typ)){a0=-85;a1=65}else if(typ==='sw2'){a0=70;a1=-60}else if(typ==='up'){a0=80;a1=-95}else{a0=-100;a1=100}
  const p=Math.min(1,prog*1.8),head=a0+(a1-a0)*p;const tail=prog<0.55?a0+(a1-a0)*Math.max(0,p-0.75):a0+(a1-a0)*Math.min(1,(prog-0.55)/0.45+0.25);
  const fade=prog<0.6?1:Math.max(0,1-(prog-0.6)/0.4);let cols=[[255,255,255],[190,225,255],[120,170,230]];if(flame)cols=[[255,250,200],[255,190,60],[240,80,20]];if(wind)cols=[[255,255,255],[190,255,230],[90,210,190]];
  const thick=big?13:9;nat(sz,sz,x=>{const cr=cols.slice().reverse(),tk=[thick,thick*0.65,thick*0.3];for(let j=0;j<3;j++){const out=[],inn=[];
    for(let i=0;i<25;i++){const u=i/24,ang=(tail+(head-tail)*u)*Math.PI/180,w=tk[j]*Math.pow(Math.sin(Math.PI*u),0.7)*(0.3+0.7*u);out.push([c+Math.cos(ang)*R,c+Math.sin(ang)*R]);inn.push([c+Math.cos(ang)*(R-w),c+Math.sin(ang)*(R-w)])}
    poly(x,out.concat(inn.reverse()));x.fillStyle=rgb(cr[j],fade);x.fill()}},sx,sy,flip)}
function star(sx,sy,age,crit,big,flame){if(age>0.2)return;const k=Math.floor(age/0.033),R=[7,11,9,6,3,2][Math.min(k,5)]*(big?1.5:crit?1.2:1);const sz=Math.floor(R*2+8),c=R+4;
  nat(sz,sz,x=>{const pts=[];for(let i=0;i<16;i++){const a=Math.PI*2*i/16+0.2,r=i%2===0?R:R*0.45;pts.push([c+Math.cos(a)*r,c+Math.sin(a)*r])}
    poly(x,pts);x.fillStyle=rgb((crit||flame)?[255,200,40]:[255,235,120]);x.fill();poly(x,pts.map(([a,b])=>[c+(a-c)*0.55,c+(b-c)*0.55]));x.fillStyle='rgb(255,255,240)';x.fill();
    if(k<2&&crit){ell(x,c-R*1.1,c-R*1.1,c+R*1.1,c+R*1.1);x.strokeStyle='rgba(255,255,255,0.78)';x.lineWidth=1;x.stroke()}},sx,sy)}
function crescent(sx,sy,age,flip){if(age>0.62)return;const a=age<0.45?1:1-(age-0.45)/0.17,grow=Math.min(1,age/0.06),Hn=Math.floor(60*grow)+8,Wn=54,cy=(Hn+4)/2;
  nat(Wn,Hn+4,x=>{for(const [col,off,th] of [[[40,150,140],0,12],[[90,215,190],2,9],[[180,255,230],4,6],[[255,255,255],5,3]]){
      x.globalCompositeOperation='source-over';ell(x,Wn-34-off,cy-Hn/2,Wn-2-off+4,cy+Hn/2);x.fillStyle=rgb(col,235*a/255);x.fill();
      x.globalCompositeOperation='destination-out';ell(x,Wn-34-off-th,cy-Hn/2+2,Wn-2-off+4-th,cy+Hn/2-2);x.fillStyle='#000';x.fill()}
    x.globalCompositeOperation='source-over';let sd=Math.floor(age*30)*9301+49297;const r=()=>{sd=(sd*9301+49297)%233280;return sd/233280};
    for(let i=0;i<10;i++){const y=cy-Hn/2+6+r()*(Hn-12),x0=r()*16,l=8+r()*14;x.fillStyle=rgb([200,255,235],200*a/255);x.fillRect(Math.floor(x0),Math.floor(y),Math.floor(l),1)}},sx,sy,flip)}
function itemDraw(k,x,y,z,alpha=1){if(typeof k==='object'){gearIcon(k,x,y,z,alpha);return}X.save();X.globalAlpha=alpha;X.drawImage(IMG['i_'+k],Math.round(x),Math.round(y),z,z);X.restore()}
function shakeOff(t){let shx=0,shy=0;for(const [t0,amp,dur] of S0.shakes){if(t0<=t&&t<t0+dur){const k=amp*(1-(t-t0)/dur);shx+=Math.round(U(-k,k));shy+=Math.round(U(-k,k)*0.6)}}return [shx,shy]}
function drawWorld(){const s=S0,t=s.t,P=s.P;const [shx,shy]=shakeOff(t);const cx0=clamp(Math.round(s.cam)+shx,0,CAMMAX);
  X.fillStyle='#000';X.fillRect(0,0,W,H);{const bf=STAGES[s.stage].filter;if(bf){X.save();X.filter=bf}X.drawImage(IMG[STAGES[s.stage].img],cx0,0,W,H,0,shy,W,H);if(bf)X.restore()}
  if(s.stage==='canyon'&&s.caveOn){const g=0.35+0.25*Math.sin(t*3);X.save();X.globalCompositeOperation='lighter';const gr=X.createRadialGradient(2425-cx0,270+shy,10,2425-cx0,270+shy,150);gr.addColorStop(0,`rgba(255,190,110,${g})`);gr.addColorStop(1,'rgba(255,160,80,0)');X.fillStyle=gr;X.fillRect(2275-cx0,120+shy,300,300);X.restore()}
  drawTele(cx0,shy);
  const SX=x=>x-cx0;const ents=[];
  // kudas
  const kh=P.h;let pose=poseOf(P);if(pose===null)pose=P.h>0?'jump':((P.mspd||0)>40?'run':'idle');
  let nm,dy=0;if(pose==='run')nm='kudas_run'+(Math.floor(t/0.08)%4);else if(pose==='idle'){nm='kudas_idle';dy=Math.floor(t/0.4)%2}else nm='kudas_'+pose;
  let gl=null;if(buffed())gl=[255,190,90,Math.floor(46+16*Math.sin(t*6))];
  if(P.act&&P.act.type==='wind'&&P.act.t<0.44)gl=[150,255,220,Math.floor(t*20)%2?230:150];if(P.act&&P.act.type==='slam'&&P.act.t<P.act.hitAt)gl=[255,230,140,Math.floor(t*20)%2?230:150];
  if(s.ritual)gl=[255,240,170,Math.floor(120+100*Math.sin(t*10))];
  const kAlpha=P.dead?(Math.floor(t*12)%2?0.4:1):m2Blink();
  ents.push([P.y,()=>spr(nm,SX(P.x),P.y-kh+shy,{dy,glow:gl,flip:P.face<0,alpha:kAlpha,flash:t<(P.flashT||0),rot:(P.dead&&t-P.deadT>0.25)||m2Down()?90*P.face:0})]);shadowE(SX(P.x),P.y+shy,40,kh);
  // pet
  const p=s.pet;const spit=t-p.spit>-0.08&&t-p.spit<0.22;const pn=spit?'pet_spit':Math.abs(p.v)>30?'pet_run'+(Math.floor(t/0.11)%2):'pet_idle';
  ents.push([p.y,()=>spr(pn,SX(p.x),p.y+shy,{dy:pn==='pet_idle'?Math.floor(t/0.4)%2:0,flip:p.face<0})]);shadowE(SX(p.x),p.y+shy,26);
  // bard
  const b=s.bard;if(b&&t>=b.in){const a=Math.min(1,(t-b.in)/0.08);const bn=t<b.in+0.42?'bard_cast':t>b.out-0.4?'bard_wave':'bard_play'+(Math.floor(t/0.22)%2);
    ents.push([b.y,()=>spr(bn,SX(b.x),b.y+shy,{alpha:a,flip:b.face<0})]);shadowE(SX(b.x),b.y+shy,34)}
  // statue
  if(s.stage==='shrine')ents.push([STATUE.y,()=>{const sx=SX(STATUE.x),sy=STATUE.y+shy;if(sx<-300||sx>W+300)return;
    const iw=IMG.statue.width*SS,ih=IMG.statue.height*SS,x0=Math.round(sx-iw/2),y0=Math.round(sy+14-ih);
    X.fillStyle='rgba(60,24,10,0.30)';X.beginPath();X.ellipse(sx,sy+12,iw*0.46,14,0,0,Math.PI*2);X.fill();
    if(s.statueOn){const g=0.55+0.25*Math.sin(t*3);X.save();X.globalAlpha=g;const gr=X.createRadialGradient(sx,sy-230,10,sx,sy-230,270);gr.addColorStop(0,'rgba(255,240,170,0.85)');gr.addColorStop(0.5,'rgba(255,220,130,0.30)');gr.addColorStop(1,'rgba(255,210,120,0)');X.fillStyle=gr;X.fillRect(sx-280,sy-500,560,540);X.restore()}
    X.drawImage(IMG.statue,x0,y0,iw,ih);
    {const fl=0.75+0.25*Math.sin(t*13)*Math.sin(t*7.3);X.save();X.globalAlpha=fl;X.drawImage(IMG.statue_flame,x0,y0,iw,ih);X.globalCompositeOperation='lighter';const fx=x0+(IMG.statue_flame.fx||0);X.restore()}
    if(s.statueOn){X.save();X.globalAlpha=0.55+0.45*Math.sin(t*4);X.drawImage(IMG.statue_glow,x0,y0,iw,ih);X.restore()}}]);
  m2Ents(ents,SX,shy);
  // mobs
  for(const m of s.mobs){if(m.kind==='pillar'){ents.push([m.y,()=>drawPillar(m,SX(m.x),m.y+shy)]);continue}
    if(m.kind==='boss'){ents.push([m.y,()=>drawBoss(m,SX(m.x),m.y+shy)]);shadowE(SX(m.x),m.y+shy,84);continue}
    let a=1,rot=0,bob=0;const sw=m.kind==='sword';let mn;
    if(m.state==='walk'){mn=sw?'golem_walk'+(m.moving?Math.floor(t/0.14)%2:0):'golem_bwalk';if(m.moving&&!sw)bob=Math.floor(t/0.14)%2;if(m.wind>0)mn=sw?'golem_attack':'golem_bdraw'}
    else if(m.state==='down')mn='golem_down';else{mn=sw?'golem_hit':'golem_bhit';if(m.state==='air'&&m.h>30)rot=-(m.rot%360)}
    if(m.skin)mn=m.skin+mn.slice(5);
    if(m.dying&&m.state==='down'&&Math.floor(t*20)%2)a=0.3;
    const rx=(t-m.recoil>=0&&t-m.recoil<0.16)?Math.round(10*Math.sin(Math.PI*Math.min(1,(t-m.recoil)/0.16)))*m.face:0;
    const mg=m.str?[255,60,40,Math.floor(110+50*Math.sin(t*5+m.id))]:null;
    ents.push([m.y,()=>spr(mn,SX(m.x)+rx,m.y-m.h+shy,{flip:m.face<0,rot,flash:t<m.flash,dy:bob,alpha:a,glow:mg})]);shadowE(SX(m.x),m.y+shy,36,m.h)}
  for(const L of s.loot)if(L.state!=='got'){X.fillStyle='rgba(60,24,10,0.31)';X.beginPath();X.ellipse(SX(L.x),L.gy+shy,8,3,0,0,Math.PI*2);X.fill()}
  // ground fx
  for(const e of s.fx){const age=t-e.t0;
    if(e.k==='circle'&&age<2.3){const r=Math.min(1,age/0.2),a=age<1.9?1:(2.3-age)/0.4;nat(56,20,x=>{x.lineWidth=1;ell(x,28-26*r,10-7*r,28+26*r,10+7*r);x.strokeStyle=rgb([255,220,90],a);x.stroke();ell(x,28-20*r,10-5*r,28+20*r,10+5*r);x.strokeStyle=rgb([255,240,160],a);x.stroke();
      for(let i=0;i<6;i++){const ang=age*2+i*Math.PI/3;x.fillStyle=rgb([255,255,220],a);x.fillRect(Math.floor(28+Math.cos(ang)*23*r),Math.floor(10+Math.sin(ang)*6*r),1,1)}},SX(e.x),e.y+shy)}
    if(e.k==='ring'&&age<0.4){const Wd=e.big?150:90,r=age/0.4,col=e.col||[250,230,200];nat(Wd,34,x=>{ell(x,Wd/2-(Wd/2-3)*r,17-14*r,Wd/2+(Wd/2-3)*r,17+14*r);x.strokeStyle=rgb(col,1-r);x.lineWidth=2;x.stroke()},SX(e.x),e.y+shy)}
    if(e.k==='crack'&&age<1.2){const a=0.86*Math.min(1,(1.2-age)/0.4);nat(70,16,x=>{let sd=3;const r=()=>{sd=(sd*9301+49297)%233280;return sd/233280};x.strokeStyle=rgb([70,40,25],a);x.lineWidth=1;
      for(let j=0;j<6;j++){let px=35,py=8;for(let k=0;k<4;k++){const nx=px+(r()<0.5?-1:1)*(3+r()*5),ny=py+(r()*4-2);x.beginPath();x.moveTo(px,py);x.lineTo(nx,ny);x.stroke();px=nx;py=ny}}},SX(e.x),e.y+shy)}}
  if(b&&t>=b.t0&&t<b.t0+0.32){const a=1-(t-b.t0)/0.32;X.fillStyle=rgb([255,236,150],140*a/255);X.fillRect(Math.round(SX(b.x)-33),Math.round(b.y-330+shy),66,330)}
  if(s.ritual&&s.stage==='shrine'){const age=t-s.ritual.t0;const a=Math.min(1,age/0.3)*(age<1.6?1:Math.max(0,1-(age-1.6)/0.3));X.fillStyle=rgb([255,236,150],0.5*a);X.fillRect(Math.round(SX(STATUE.x)-60),Math.round(STATUE.y-520+shy),120,520);X.fillRect(Math.round(SX(P.x)-30),Math.round(P.y-330+shy),60,330)}
  for(const L of s.loot){const bobb=L.state==='rest'?Math.round(Math.sin((t-L.t0)*6)*2):0;ents.push([L.gy,()=>itemDraw(L.k==='gear'?L.it:L.k,SX(L.x)-13,L.y+shy-bobb-26,27)])}
  ents.sort((a,b)=>a[0]-b[0]);for(const e of ents)e[1]();
  drawLinks(cx0,shy);drawRocks(cx0,shy);
  if(s.shield)drawBubble(SX(P.x),P.y-kh+shy);
  for(const L of s.loot)if(L.state==='rest'&&Math.floor((t-L.t0)*5)%3===0){const x=Math.floor((SX(L.x)+8)/3)*3,y=Math.floor((L.y+shy-26)/3)*3;X.fillStyle='rgb(255,255,220)';X.fillRect(x,y,3,3)}
  for(const ar of s.arrows){if(window.spBolt&&spBolt(ar,SX(ar.x),ar.y-ar.h+shy))continue;nat(18,3,x=>{x.fillStyle='rgb(230,220,200)';x.fillRect(3,1,15,1);poly(x,[[0,1],[3,0],[3,2]]);x.fillStyle='rgb(120,120,130)';x.fill();x.fillStyle='rgb(220,60,60)';x.fillRect(15,0,3,1);x.fillRect(15,2,3,1)},SX(ar.x),ar.y-ar.h+shy,ar.dir>0)}
  for(const fb of s.fire){const m=fb.m;const u=Math.min(1,(t-fb.t0)/(fb.t1-fb.t0));for(let k=0;k<4;k++){const uu=Math.max(0,u-k*0.06),xx=fb.x0+(m.x-6-fb.x0)*uu,yy=fb.y0+(m.y-70-fb.y0)*uu-30*Math.sin(Math.PI*uu);const r=5-k;
      nat(12,12,x=>{ell(x,6-r,6-r,6+r,6+r);x.fillStyle=rgb([[255,120,30],[255,170,50],[255,200,80],[255,230,140]][k],(255-k*50)/255);x.fill();if(k===0){ell(x,4,4,7,7);x.fillStyle='rgb(255,250,210)';x.fill()}},SX(xx),yy+shy)}}
  // smears
  if(P.act){const a=P.act,st=a.hitAt-0.05,en=a.hitAt+0.13;
    if(['sw','sw2','up'].includes(a.type)&&a.t>=st&&a.t<en)smear(SX(P.x)+18*P.face,P.y-kh-62+shy,a.type,(a.t-st)/(en-st),buffed(),false,false,P.face<0);
    if(a.type==='air'&&a.t<0.25)smear(SX(P.x)+18*P.face,P.y-kh-62+shy,'air',a.t/0.25,buffed(),true,false,P.face<0);
    if(a.type==='wind'&&a.t>=0.42&&a.t<0.62)smear(SX(P.x)+22*P.face,P.y-60+shy,'wind',(a.t-0.42)/0.2,false,true,true,P.face<0)}
  for(const bl of s.blades)crescent(SX(bl.x),bl.y-62+shy,t-bl.t0,bl.dir<0);
  for(const e of s.fx){const age=t-e.t0;
    if(e.k==='star')star(SX(e.x),e.y+shy,age,e.crit,e.big,e.flame);
    if(e.k==='clank'&&age<0.14){const k=age/0.14,r=3+k*8,a=1-k;nat(24,24,x=>{x.strokeStyle=rgb([255,255,255],a);x.lineWidth=1;for(let i=0;i<8;i++){const ang=i*Math.PI/4+0.4,rr=i%2===0?r:r*0.55;x.beginPath();x.moveTo(12,12);x.lineTo(12+Math.cos(ang)*rr,12+Math.sin(ang)*rr);x.stroke()}ell(x,10,10,14,14);x.fillStyle=rgb([255,255,255],a);x.fill()},SX(e.x),e.y+shy)}
    if(e.k==='boom'&&age<0.3){const r=3+age*50,a=1-age/0.3;nat(34,34,x=>{ell(x,17-r,17-r,17+r,17+r);x.fillStyle=rgb([255,140,40],a);x.fill();ell(x,17-r*0.6,17-r*0.6,17+r*0.6,17+r*0.6);x.fillStyle=rgb([255,230,140],a);x.fill()},SX(e.x),e.y+shy)}}
  for(const q of s.parts){const age=t-q.t0,u=age/q.life;let x=SX(q.x),y=q.y+shy;
    if(q.note){X.save();X.globalAlpha=u<0.7?1:(1-u)/0.3;X.drawImage(noteImg(q.c),Math.round(x+Math.sin(age*5+q.sway)*10),Math.round(y));X.restore();continue}
    let sz=q.sz||2;if(q.grow)sz=sz*(1+u*1.5);const qq=S*Math.max(1,Math.floor(sz));x=Math.floor(x/S)*S;y=Math.floor(y/S)*S;
    if(q.grow)X.fillStyle=rgb(q.c,200*(1-u)/255);else if(q.faint)X.fillStyle=rgb(q.c,120*(1-u)/255);else X.fillStyle=rgb(q.c);X.fillRect(x,y,qq,qq)}
  return [cx0,shy]}
// ---- mine / boss drawing helpers ----
function drawTele(cx0,shy){const s=S0,t=s.t;for(const c of s.tele){if(t<c.t0||c.done)continue;const u=clamp((t-c.t0)/(c.t1-c.t0),0,1),x=c.x-cx0,y=c.y+shy;
  X.save();X.beginPath();X.ellipse(x,y,c.r,c.r/2.2,0,0,Math.PI*2);X.fillStyle=c.poison?`rgba(90,200,60,${0.14+0.18*u})`:`rgba(255,40,30,${0.12+0.16*u})`;X.fill();X.lineWidth=3;X.strokeStyle=c.poison?'rgba(170,255,120,0.9)':`rgba(255,${Math.floor(60+120*(Math.floor(t*10)%2))},60,0.9)`;X.stroke();
  X.beginPath();X.ellipse(x,y,c.r*u,c.r*u/2.2,0,0,Math.PI*2);X.fillStyle='rgba(255,70,40,0.28)';X.fill();X.restore()}}
function drawRocks(cx0,shy){const s=S0,t=s.t;for(const c of s.tele){if(!c.rock||c.done)continue;const f=(t-(c.t1-0.4))/0.4;if(f<0||f>1)continue;const x=c.x-cx0,y=c.y+shy-640*(1-f)-30;
  nat(14,12,q=>{poly(q,[[2,4],[5,1],[10,1],[13,5],[12,10],[6,11],[1,9]]);q.fillStyle='rgb(120,82,64)';q.fill();poly(q,[[4,3],[9,2],[11,5],[6,6]]);q.fillStyle='rgb(170,122,92)';q.fill();q.fillStyle='rgb(60,38,30)';q.fillRect(6,9,5,1)},x,y)}}
const BOSSF='grayscale(0.55) sepia(0.3) hue-rotate(-20deg) saturate(1.3) brightness(0.8) contrast(1.15)';
function drawBoss(m,sx,sy){const s=S0,t=s.t,b=s.boss;if(b&&b.b4)return drawB4(m,sx,sy);if(b&&b.sp)return drawSP(m,sx,sy);if(b&&b.ms)return drawMS(m,sx,sy);const kneel=b&&t<b.kneelUntil;let mn='golem_walk'+(m.moving?Math.floor(t/0.2)%2:0),dy=0,gl=null;
  if(b&&b.atk&&b.atk.k==='slam'&&t<b.atk.t0+1.0){mn='golem_attack';gl=[255,60,40,Math.floor(t*14)%2?220:120]}
  else if(b&&b.atk&&b.atk.k==='rocks'&&t<b.atk.t0+0.5){mn='golem_attack';dy=-4}
  if(kneel){mn='golem_hit';dy=14;gl=[200,140,255,Math.floor(90+60*Math.sin(t*8))]}
  if(m.dying){mn='golem_down'}
  if(bossShielded()&&!m.dying){const g=0.25+0.12*Math.sin(t*4);X.save();X.globalAlpha=g;circ(sx,sy-150,150,'rgba(255,60,60,0.35)',null);X.restore()}
  const a=m.dying?Math.max(0,1-(t-(m.dieT-1.2))/1.2):1;
  spr(mn,sx,sy,{sc:2,flip:m.face<0,flash:t<m.flash,dy,glow:gl,filter:BOSSF,alpha:a});
  // red eye
  if(!m.dying){X.fillStyle=Math.floor(t*6)%2?'rgb(255,60,40)':'rgb(255,140,90)';X.fillRect(Math.round(sx+(m.face>0?26:-34)),Math.round(sy-236+dy*4),8,6)}}
function drawPillar(m,sx,sy){if(m.sub)return drawStone(m,sx,sy);const t=S0.t;const rise=clamp((t-(m.rise||-9))/0.7,0,1);if(rise<=0)return;let a=1;if(m.dying){const k=(t-(m.dieT-0.45))/0.45;a=Math.max(0,1-k);if(Math.floor(t*20)%2)a*=0.5}
  const hn=Math.round(64*rise),fl=t<m.flash;
  X.save();X.globalAlpha=a*(0.3+0.15*Math.sin(t*5+m.id));const gr=X.createRadialGradient(sx,sy-100,8,sx,sy-100,110);gr.addColorStop(0,'rgba(255,70,60,0.8)');gr.addColorStop(1,'rgba(255,40,40,0)');X.fillStyle=gr;X.fillRect(sx-110,sy-220,220,220);X.restore();
  shadowE(sx,sy,40);X.save();X.globalAlpha=a;
  nat(34,80,q=>{const b=80;poly(q,[[3,b-1],[6,b-9],[28,b-9],[31,b-1]]);q.fillStyle='rgb(70,58,64)';q.fill();q.fillStyle='rgb(110,96,104)';q.fillRect(7,b-9,20,2);
    const top=b-9-hn;poly(q,[[9,b-9],[8,top+16],[17,top],[26,top+16],[25,b-9]]);q.fillStyle=fl?'rgb(255,230,230)':'rgb(120,18,32)';q.fill();
    poly(q,[[12,b-9],[11,top+16],[17,top+3],[21,top+16],[20,b-9]]);q.fillStyle=fl?'rgb(255,255,255)':'rgb(200,40,52)';q.fill();
    poly(q,[[14,b-12],[13,top+16],[17,top+6],[18,top+16],[17,b-12]]);q.fillStyle=fl?'#fff':'rgb(255,120,110)';q.fill();
    q.fillStyle='rgb(255,220,210)';q.fillRect(15,top+8,1,Math.max(1,hn-30));q.fillRect(16,top+5,1,2);
    // side shards
    poly(q,[[8,b-9],[3,b-26],[9,b-20]]);q.fillStyle='rgb(170,30,44)';q.fill();poly(q,[[25,b-9],[31,b-30],[26,b-18]]);q.fillStyle='rgb(150,24,38)';q.fill();
    q.fillStyle='rgb(40,8,14)';for(let y=top+16;y<b-9;y+=1){q.fillRect(8+(y>top+16?0:0),y,1,1);q.fillRect(25,y,1,1)}},sx,sy-120+3);
  X.restore()}
function drawLinks(cx0,shy){const s=S0,t=s.t,b=s.boss;if(!b||b.m.dying)return;const m=b.m;const bx=m.x-cx0,by=m.y+shy-170;
  for(const pl of s.mobs){if(pl.kind!=='pillar'||pl.gone||pl.dying||pl.sub==='stele')continue;if(t-(pl.rise||-9)<0.7)continue;const px=pl.x-cx0,py=pl.y+shy-180;
    X.save();X.setLineDash([12,8]);X.lineDashOffset=-t*60;X.lineWidth=5;X.strokeStyle=(pl.sub?'rgba(90,170,255,':'rgba(255,40,40,')+(0.35+0.2*Math.sin(t*7+pl.id))+')';X.beginPath();X.moveTo(px,py);X.lineTo(bx,by);X.stroke();
    X.lineWidth=2;X.strokeStyle='rgba(255,200,190,0.55)';X.stroke();X.restore()}}
function drawBubble(sx,sy){const s=S0,t=s.t,sh=s.shield;const age=t-sh.t0,rem=sh.until-t;const pop=Math.max(0.2,Math.min(1,age/0.2));let a=rem<1.5?(Math.floor(t*8)%2?0.5:1):1;
  X.save();X.globalAlpha=a;const cy=sy-80,rx=70*pop,ry=104*pop;const gr=X.createRadialGradient(sx-20,cy-30,10,sx,cy,ry);gr.addColorStop(0,'rgba(220,255,240,0.10)');gr.addColorStop(0.75,'rgba(120,240,200,0.14)');gr.addColorStop(1,'rgba(150,255,220,0.38)');
  X.beginPath();X.ellipse(sx,cy,rx,ry,0,0,Math.PI*2);X.fillStyle=gr;X.fill();X.lineWidth=3;X.strokeStyle='rgba(170,255,225,0.75)';X.stroke();
  X.beginPath();X.ellipse(sx,cy,Math.max(1,rx-8),Math.max(1,ry-8),0,Math.PI*1.1+t*0.6,Math.PI*1.45+t*0.6);X.lineWidth=4;X.strokeStyle='rgba(255,255,255,0.7)';X.stroke();
  for(let i=0;i<3;i++){const ang=t*1.6+i*2.1;X.fillStyle='rgba(220,255,240,0.85)';X.fillRect(Math.round((sx+Math.cos(ang)*(rx-4))/3)*3,Math.round((cy+Math.sin(ang)*(ry-4))/3)*3,3,3)}X.restore()}
function keyBadge(x,y,k,w){w=w||Math.max(20,tw(k,FN(12))+10);rrect(x-w/2,y-10,x+w/2,y+10,5,'rgba(38,36,44,0.96)','rgb(210,210,215)',1);T(k,x,y+1,FN(12),[255,255,255],0,[0,0,0],'mm')}
function skillTile(cx,cy,R,glyph,col,key,cost,dim,deny,cdFrac,name){const t=S0.t;const dn=t-deny<0.35;const ox=dn?Math.round(5*Math.sin(t*70)):0;cx+=ox;
  circ(cx,cy,R+5,'rgba(12,10,16,0.86)',rgb(GOLDC),2);
  X.save();if(dim)X.globalAlpha=0.42;const gr=X.createRadialGradient(cx-R*0.3,cy-R*0.4,2,cx,cy,R);gr.addColorStop(0,rgb(col.map(v=>Math.min(255,v+90))));gr.addColorStop(1,rgb(col));circ(cx,cy,R,gr,'rgba(255,255,255,0.35)',2);
  T(glyph,cx,cy+1,FS(Math.round(R*0.95)),[255,255,255],3,[30,15,10],'mm');X.restore();
  if(dim){circ(cx,cy,R,'rgba(20,20,28,0.35)')}
  if(cdFrac>0){X.save();X.beginPath();X.moveTo(cx,cy);X.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*cdFrac);X.closePath();X.fillStyle='rgba(0,0,0,0.55)';X.fill();X.restore()}
  if(dn)circ(cx,cy,R+3,null,'rgb(255,70,60)',3);
  if(cost)T(cost,cx,cy-R-9,FN(11),dim?[255,140,120]:[255,236,170],2,[0,0,0],'mm');
  if(name)T(name,cx,cy+R+8,FN(10),[230,225,210],2,[0,0,0],'mm');
  keyBadge(cx+R*0.72,cy+R*0.68,key)}
function bleedIcon(x,y,rem){const t=S0.t;circ(x,y,9,'rgba(20,6,10,0.9)','rgb(230,90,100)',1);X.save();X.beginPath();X.moveTo(x,y-6);X.quadraticCurveTo(x+6,y+1,x,y+5);X.quadraticCurveTo(x-6,y+1,x,y-6);X.fillStyle=Math.floor(t*4)%2?'rgb(220,30,50)':'rgb(250,70,80)';X.fill();X.restore();
  X.beginPath();X.arc(x,y,10.5,-Math.PI/2,-Math.PI/2+Math.PI*2*rem);X.strokeStyle='rgb(255,200,200)';X.lineWidth=2;X.stroke()}
function drawBossBar(b){const s=S0,t=s.t,m=b.m;const x0=360,x1=920,y=170;const f=clamp(m.hp/m.hpmax,0,1);const sh=bossShielded(),kneel=t<b.kneelUntil;
  rrect(x0-8,y-30,x1+8,y+22,6,'rgba(12,8,10,0.82)',rgb(GOLDC),2);T(b.name||'峽谷看守者・巨石魔像',x0,y-16,FS(17),[255,226,200],2,[0,0,0],'lm');
  const np=s.mobs.filter(o=>o.kind==='pillar'&&!o.gone&&!o.dying).length;T(b.b4&&!kneel?b4Status():sh?`赤晶柱 ×${np}　無敵`:kneel?`跪地・無防備 ${Math.ceil(b.kneelUntil-t)}s`:'可以造成傷害！',x1,y-16,FN(14),sh?[255,120,110]:kneel?[220,180,255]:[170,255,170],2,[0,0,0],'rm');
  X.fillStyle='rgba(0,0,0,0.9)';X.fillRect(x0,y-3,x1-x0,16);X.fillStyle=sh?'rgb(120,110,130)':'rgb(200,40,40)';X.fillRect(x0+2,y-1,Math.round((x1-x0-4)*f),12);X.fillStyle=sh?'rgb(170,160,180)':'rgb(255,120,100)';X.fillRect(x0+2,y-1,Math.round((x1-x0-4)*f),3);
  X.fillStyle='rgba(255,255,255,0.5)';X.fillRect(x0+Math.round((x1-x0)/2),y-3,2,16);
  T(`${Math.max(0,m.hp).toLocaleString('en-US')} / ${m.hpmax.toLocaleString('en-US')}`,(x0+x1)/2,y+5,FN(11),[255,255,255],2,[0,0,0],'mm')}
// ================= HUD (hud6.draw_hud) =================
function arc(cx,cy,R,a0,a1,col,w){X.beginPath();X.arc(cx,cy,R-w/2,a0*Math.PI/180,a1*Math.PI/180);X.strokeStyle=col;X.lineWidth=w;X.stroke()}
function circ(cx,cy,R,fill,stroke,w){X.beginPath();X.arc(cx,cy,R,0,Math.PI*2);if(fill){X.fillStyle=fill;X.fill()}if(stroke){X.strokeStyle=stroke;X.lineWidth=w;X.stroke()}}
function rrect(x0,y0,x1,y1,r,fill,stroke,w){X.beginPath();X.roundRect(x0,y0,x1-x0,y1-y0,r);if(fill){X.fillStyle=fill;X.fill()}if(stroke){X.strokeStyle=stroke;X.lineWidth=w;X.stroke()}}
function quad(pts,fill){X.beginPath();X.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))X.lineTo(p[0],p[1]);X.closePath();X.fillStyle=fill;X.fill()}
function drawHUD(cx0,shy){const s=S0,t=s.t,P=s.P;
  // enemy hp bars
  for(const m of s.mobs){if(m.kind==='boss'||m.gone)continue;const pil=m.kind==='pillar';if(pil&&(m.dying||t-(m.rise||-9)<0.7))continue;const sx=Math.round(m.x-cx0),sy=Math.round(pil?m.y+shy-232:m.y-m.h+shy-(m.state!=='down'?140:75));const f=clamp(m.hp/m.hpmax,0,1);
    X.fillStyle='rgba(10,10,20,0.86)';X.fillRect(sx-27,sy-1,55,8);X.fillStyle=pil?'rgb(230,60,60)':m.str?'rgb(255,120,60)':'rgb(70,160,255)';X.fillRect(sx-26,sy,Math.round(52*f)+1,6);X.fillStyle=pil?'rgb(255,170,160)':m.str?'rgb(255,200,150)':'rgb(160,215,255)';X.fillRect(sx-26,sy,Math.round(52*f)+1,2);
    if(m.bleed&&t<m.bleed.until)bleedIcon(sx-40,sy+3,(m.bleed.until-t)/BLEED_DUR)}
  m2MobSay(cx0,shy);
  if(s.boss&&s.boss.m)drawBossBar(s.boss);
  // player panel
  X.drawImage(IMG.panel,0,0);X.drawImage(IMG.por,14,12);
  T('Lv.'+s.lv,124,10,FN(15),[255,230,160],2);T('苦達斯',178,7,FS(20),[255,255,255],2);
  const hp=Math.max(0,P.hp)/HPMAX,st=s.hpd;if(hp<st.disp)st.disp=hp;else st.disp+=(hp-st.disp)*0.35;st.trail=st.trail>st.disp?Math.max(st.disp,st.trail-0.012):st.disp;
  quad([[124,36],[408,36],[402,54],[124,54]],'rgba(0,0,0,0.9)');
  if(st.trail>st.disp){X.fillStyle='rgb(255,236,220)';X.fillRect(127,39,Math.round(272*st.trail)+1,13)}
  if(hp>st.disp+0.002){X.fillStyle='rgb(80,230,110)';X.fillRect(127,39,Math.round(272*hp)+1,13)}
  const w=Math.round(272*st.disp);X.fillStyle='rgb(40,110,235)';X.fillRect(127,39,w+1,13);X.fillStyle='rgb(120,180,255)';X.fillRect(127,39,w+1,4);
  T('HP',132,45,FN(11),[255,255,255],2,[0,0,0],'lm');T(`${Math.max(0,Math.round(P.hp)).toLocaleString('en-US')} / ${HPMAX.toLocaleString('en-US')}`,396,45,FN(12),[255,255,255],2,[0,0,0],'rm');
  // 戰鬥節奏 bar (replaces MP; same art)
  const y=60,rf=P.rh/RHMAX;quad([[124,y],[408,y],[402,y+18],[124,y+18]],'rgba(0,0,0,0.9)');
  const rw=Math.round(272*rf);const full=P.rh>=WIND_COST;X.fillStyle=full&&Math.floor(t*6)%2?'rgb(255,110,70)':'rgb(225,70,40)';X.fillRect(127,y+3,rw+(rw?1:0),13);X.fillStyle='rgb(255,150,110)';X.fillRect(127,y+3,rw+(rw?1:0),4);
  for(let i=1;i<RHMAX;i++){X.fillStyle='rgba(0,0,0,0.55)';X.fillRect(127+Math.round(272*i/RHMAX),y+3,2,13)}
  T('節奏',132,y+9,FN(11),[255,255,255],2,[0,0,0],'lm');T(`${P.rh} / ${RHMAX}`,396,y+9,FN(12),[255,255,255],2,[0,0,0],'rm');
  const exp=s.exp/100;X.fillStyle='rgba(0,0,0,0.9)';X.fillRect(124,86,279,7);X.fillStyle='rgb(250,200,60)';X.fillRect(126,87,Math.round(274*exp)+1,5);
  circ(134,105,7,'rgb(250,200,40)','rgb(120,80,0)',2);T(s.gold.toLocaleString('en-US'),150,105,FN(15),[255,255,255],2,[0,0,0],'lm');m2GoldHUD(150+tw(s.gold.toLocaleString('en-US'),FN(15))+10,105);T(`EXP ${s.exp.toFixed(1)}%`,400,105,FN(12),[255,225,140],2,[0,0,0],'rm');
  // buffs
  const bufs=[];if(buffed()){const bt=s.bard.buffT;[['♪',''],['攻','3'],['暴','2']].forEach(([g,n],i)=>{if(t>=bt+i*0.12)bufs.push([g,n,bt+i*0.12,[44,104,196]])})}
  if(t<=s.rev_until)bufs.push(['仇','',s.rev_until-REV_WIN,[150,36,40]]);
  let bx=124;for(const [g,n,t0,col] of bufs){const pop=Math.max(0,1-(t-t0)/0.15),sz=24+Math.floor(8*pop),x0=bx+12-Math.floor(sz/2),y0=124+12-Math.floor(sz/2);
    rrect(x0,y0,x0+sz,y0+sz,5,rgb(col),col[2]>150?'rgb(200,225,255)':'rgb(255,200,190)',2);T(g,bx+12,136,FS(15),[255,255,255],2,[10,20,50],'mm');if(n)T(n,bx+23,148,FN(11),[255,255,255],2,[0,0,0],'rb');bx+=30}
  // support badge (尋歡作樂)
  {const hg=t-s.hungryT;const bx_=538+(hg>=0&&hg<0.5?Math.round(6*Math.sin(hg*60)*(1-hg/0.5)):0),by_=58,R=44;circ(bx_,by_,R+6,'rgba(12,10,16,0.84)',rgb(GOLDC),2);arc(bx_,by_,R,0,360,'rgb(60,40,30)',8);let pips=s.food,lab;const b=s.bard;
    const ih=IMG.bardh,ig=IMG.bardg;
    if(!b&&s.food>=FOOD_MAX){arc(bx_,by_,R,0,360,Math.floor(t*6)%2?'rgb(120,220,255)':'rgb(180,240,255)',8);X.drawImage(ih,bx_-Math.floor(ih.width/2),by_-Math.floor(ih.height/2)+4);lab=['READY',[200,240,255]];
      const rp=t-s.food_full;if(rp>=0&&rp<0.45){const k=1-rp/0.45;circ(bx_,by_,R+6+14*(1-k),null,rgb([200,245,255],k),3)}}
    else if(b){const rem=Math.max(0,1-(t-b.t0)/(b.out-b.t0));circ(bx_,by_,R+10,null,rgb([255,230,140],(150+80*Math.sin(t*12))/255),3);arc(bx_,by_,R,-90,-90+360*rem,Math.floor(t*8)%2?'rgb(255,236,140)':'rgb(255,210,90)',8);
      X.drawImage(ih,bx_-Math.floor(ih.width/2),by_-Math.floor(ih.height/2)+4);lab=['支援中',[255,236,160]];pips=0}
    else{X.drawImage(ig,bx_-Math.floor(ig.width/2),by_-Math.floor(ig.height/2)+4);const fill=s.food/FOOD_MAX;if(fill>0)arc(bx_,by_,R,-90,-90+360*fill,'rgb(150,230,110)',8);lab=[`${s.food}/${FOOD_MAX}`,[220,220,220]]}
    for(let i=0;i<FOOD_MAX;i++){const px=bx_-R-20,py=by_-R+10+i*16,on=i<pips;circ(px+6,py+6,6,on?'rgb(150,230,110)':'rgba(40,36,34,0.9)',on?'rgb(20,40,10)':'rgb(130,120,110)',2)}
    const fp=t-s.foodpulse;if(fp>=0&&fp<0.3){const k=1-fp/0.3;circ(bx_,by_,R+6+8*k,null,rgb([170,255,150],k),3);T('♥',bx_+R-2,by_-R+6,FS(18),[255,120,140],2,[0,0,0],'mm',k)}
    T(lab[0],bx_,by_+R+16,FN(13),lab[1],2,[0,0,0],'mm');keyBadge(bx_+R-2,by_+R-8,'V');
    if(hg>=0&&hg<1.8){const a=hg<1.5?1:(1.8-hg)/0.3;X.save();X.globalAlpha=a;const bx2=bx_+10,by2=by_+R+44;rrect(bx2-92,by2-17,bx2+92,by2+17,10,'rgb(255,252,240)','rgb(60,40,30)',2);quad([[bx2-14,by2-17],[bx2-2,by2-17],[bx2-10,by2-30]],'rgb(255,252,240)');T('肚子好餓…動不了',bx2,by2+1,FS(17),[70,40,30],0,[0,0,0],'mm');T(`（食物 ${s.food}/${FOOD_MAX}）`,bx2,by2+30,FN(12),[255,230,190],2,[0,0,0],'mm');X.restore()}}
  // pet fireball gauge
  {const g=s.pet.g,cx=640,cy=58,R=44;circ(cx,cy,R+6,'rgba(12,10,16,0.84)',rgb(GOLDC),2);arc(cx,cy,R,0,360,'rgb(60,40,30)',8);const full=g>=1;
    const col=!full?'rgb(255,170,40)':(Math.floor(t*8)%2?'rgb(255,240,120)':'rgb(255,190,60)');if(g>0)arc(cx,cy,R,-90,-90+360*g,col,8);
    const ip=IMG.peth;X.drawImage(ip,cx-Math.floor(ip.width/2),cy-Math.floor(ip.height/2)+2);T(full?'READY':`${Math.floor(g*100)}%`,cx,cy+R+16,FN(13),full?[255,235,170]:[230,230,230],2,[0,0,0],'mm');
    circ(cx+R+3,cy+R-13,9,'rgb(255,130,30)','rgb(90,20,0)',2);circ(cx+R+2,cy+R-14,3,'rgb(255,240,180)');
    const ep=s.pet.enPulse!=null?t-s.pet.enPulse:9;for(let i=0;i<PET_EN_MAX;i++){const px=cx+R+14,py=cy-R+10+i*16,on=i<s.pet.en;circ(px,py+6,6,on?'rgb(120,230,255)':'rgba(40,36,34,0.9)',on?'rgb(10,40,60)':'rgb(130,120,110)',2);if(on&&i===s.pet.en-1&&ep<0.3)circ(px,py+6,6+8*(1-ep/0.3),null,rgb([170,240,255],1-ep/0.3),2)}
    if(s.shield){const rem=Math.max(0,(s.shield.until-t)/SHIELD_DUR);arc(cx,cy,R+12,-90,-90+360*rem,'rgb(150,255,210)',4);T('守護中',cx,cy+R+32,FN(12),[170,255,220],2,[0,0,0],'mm')}
    else if(t<s.pet.shCD){T(`守護 CD ${Math.ceil(s.pet.shCD-t)}s`,cx,cy+R+32,FN(11),[200,200,200],2,[0,0,0],'mm')}}
  // combo (gap ≤ 5 s keeps it alive)
  {const c=s.combo,age=t-s.lastHit;if(c>=2&&age<=COMBO_GAP){const sc=1+0.35*Math.max(0,1-age/0.1),a=age<COMBO_GAP-0.6?1:Math.max(0,(COMBO_GAP-age)/0.6);
    T(''+c,92,206,FS(Math.floor(52*sc)),[255,110,20],4,[255,255,255],'rm',a);T('擊',98,208,FS(Math.floor(46*sc)),[20,10,10],4,[255,255,255],'lm',a);
    X.fillStyle=rgb([255,140,30],a);X.fillRect(24,240,Math.floor(130*Math.max(0,1-age/COMBO_GAP)),5);
    if(s.comboTier>0){T(`傷害 +${s.comboTier}%`,24,262,FS(18),[255,226,120],3,[60,20,0],'lm',a);const tp=t-s.tierT;if(tp>=0&&tp<0.9){const k=tp<0.12?1.6-tp/0.12*0.6:1,aa=tp<0.6?1:(0.9-tp)/0.3;T(`+${s.comboTier}%`,170,212-Math.round(18*Math.min(1,tp/0.4)),FS(Math.round(40*k)),[255,250,150],4,[200,60,0],'lm',aa)}}}}
  // loot log
  {const logs=s.log.filter(e=>t-e[0]<4.5).slice(-5);let yy=18;for(const [t0,ic,str] of logs){const age=t-t0,a=age<3.7?1:Math.max(0,1-(age-3.7)/0.8);if(a<=0)continue;
    const f=FN(15),x1=1266,x0=Math.floor(x1-tw(str,f)-44),sl=Math.floor(30*Math.max(0,1-age/0.12));rrect(x0+sl,yy,x1+sl,yy+26,6,rgb([12,10,16],190*a/255));
    itemDraw(ic,x0+8+sl,yy+4,18,a);T(str,x0+32+sl,yy+13,f,age>0.6?[255,255,255]:[255,236,150],2,[0,0,0],'lm',a);yy+=30}}
  // damage numbers
  const hus=s.dmg.filter(e=>e.hurt&&t-e.t>=0&&t-e.t<=0.85).sort((a,b)=>a.t-b.t);
  hus.forEach((e,hi)=>{const age=t-e.t,im=numImg(e.v,'hurt'),sc=1+0.5*Math.max(0,1-age/0.08),a=age<0.65?1:Math.max(0,1-(age-0.65)/0.2);const iw=Math.round(im.width*sc),ih=Math.round(im.height*sc);
    const hx=Math.round(P.x-cx0-48-iw),hy=Math.round(P.y+shy-92-30*Math.min(1,age/0.5)-(hus.length-1-hi)*26);X.save();X.globalAlpha=a;X.drawImage(im,hx,hy,iw,ih);X.restore()});
  for(const e of s.dmg){if(!e.bleed)continue;const age=t-e.t;if(age<0||age>0.8)continue;const im=numImg(e.v,'bleed'),a=age<0.55?1:(0.8-age)/0.25;X.save();X.globalAlpha=a;X.drawImage(im,Math.round(e.x-cx0+30),Math.round(e.y+shy-24*Math.min(1,age/0.5)));X.restore()}
  const act=s.dmg.filter(e=>!e.hurt&&!e.bleed&&t-e.t>=0&&t-e.t<=0.85).sort((a,b)=>b.t-a.t).slice(0,5);const placed=[];
  for(const e of act){const age=t-e.t,kind=e.zero?'zero':e.v>=50000?'big':e.pet?'pet':e.crit?'crit':'n';const im=numImg(e.v,kind),sc=1+0.6*Math.max(0,1-age/0.08);const iw=Math.round(im.width*sc),ih=Math.round(im.height*sc);
    const rise=Math.floor(36*Math.min(1,age/0.5)),a=age<0.65?1:1-(age-0.65)/0.2;if(a<=0)continue;let x=clamp(Math.round(e.x-cx0-iw/2),8,W-iw-8),y=Math.round(e.y+shy-rise-ih/2);
    let moved=true,guard=0;while(moved&&guard++<20){moved=false;for(const [px,py,pw,ph] of placed){if(x<px+pw+10&&x+iw+10>px&&y<py+ph+16&&y+ih>py-16){y=py-ih-20;moved=true}}}
    placed.push([x,y,iw,ih]);X.save();X.globalAlpha=a;X.drawImage(im,x,y,iw,ih);X.restore();
    if(e.zj)T('追擊',x-5,y+ih/2,FS(15),[240,235,210],3,[0,0,0],'rm',a);
    if(e.label&&(kind!=='pet'||e.zero)){const LC={'暴擊':[255,80,40],'無防備暴擊':[255,60,140],'多重打擊':[190,110,255],'無效':[200,200,220],'出血追加':[255,70,90],'減傷':[150,200,255],'雷擊':[255,240,90],'劍雨':[220,230,255],'旋轉':[255,220,150]};T(e.label+(e.label.includes('暴')?'!':''),x+iw/2,y-1,FS(15),LC[e.label]||e.lc||[255,236,190],3,[0,0,0],'mb',a)}}
  for(const e of s.fx)if(e.k==='exp'){const age=t-e.t0;if(age>=0&&age<0.8){const im=IMG.expimg;X.drawImage(im,Math.round(e.x-cx0-im.width/2),Math.round(e.y+shy-40*age))}}
  // skill callout
  if(s.callout){const age=t-s.callout.t0;const dur=1.07;if(age<dur){const a=Math.min(1,age/0.06)*(age<0.82?1:(dur-age)/0.25),sc=Math.max(1,1.5-age/0.08*0.5);
    T(s.callout.txt,Math.round(P.x-cx0-30*P.face),Math.round(P.y-200+shy),FS(Math.floor(44*sc)),[235,255,245],5,[20,70,60],'mm',a)}}
  // heals
  const kx=P.x-cx0,ky=P.y+shy-P.h;const grp=[];for(const e of s.heals.slice().sort((a,b)=>a.t-b.t)){if(grp.length&&e.t-grp[grp.length-1].t<0.3)grp[grp.length-1].v+=e.v;else grp.push({t:e.t,v:e.v})}
  const hl=grp.filter(e=>t-e.t>=0&&t-e.t<0.9);hl.forEach((e,i)=>{const age=t-e.t,a=age<0.65?1:Math.max(0,1-(age-0.65)/0.25),im=numImg(e.v,'heal');X.save();X.globalAlpha=a;X.drawImage(im,Math.round(kx-40-im.width),Math.round(ky-150-30*Math.min(1,age/0.5)-(hl.length-1-i)*28));X.restore()});
  // proc popups
  const pa=s.procs.filter(p=>t-p[0]>=0&&t-p[0]<1.1);pa.forEach(([t0,name,col,g],j)=>{const age=t-t0,a=Math.min(1,age/0.08)*(age<0.85?1:Math.max(0,(1.1-age)/0.25));
    const y=Math.round(ky-176-16*Math.min(1,age/0.4)-(pa.length-1-j)*36),x=Math.round(kx-30),r=15+Math.floor(5*Math.max(0,1-age/0.1));
    circ(x,y,r,rgb(col,a),rgb([30,20,20],a),2);X.beginPath();X.arc(x,y,r+3-1.5,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,age/0.35));X.strokeStyle=rgb([255,220,60],a);X.lineWidth=3;X.stroke();
    T(g,x,y,FS(16),[255,255,255],2,[30,10,10],'mm',a);T(name,x+r+8,y,FS(16),[255,244,214],3,[40,20,10],'lm',a)});
  // bag
  {const bgx=1218,bgy=574,BR=34,bp=t-s.bagpulse,k=bp>=0?Math.max(0,1-bp/0.25):0,rr=BR+Math.floor(5*k);circ(bgx,bgy,rr+5,'rgba(20,16,14,0.78)');
    X.beginPath();X.arc(bgx,bgy,rr+3-2,-Math.PI/2,-Math.PI/2+300*Math.PI/180);X.strokeStyle='rgb(255,236,190)';X.lineWidth=4;X.stroke();circ(bgx,bgy,rr,k<0.5?'rgb(240,186,70)':'rgb(255,226,130)');
    X.drawImage(IMG.bag,bgx-24,bgy-24+1);
    // flying loot
    for(const f of s.fly){const u=(t-f.t0)/0.5;if(u<0||u>=1)continue;const [tx,ty]=f.dst==='bag'?[bgx,bgy]:[538,58];const sx=f.sx,uu=u*u*(3-2*u);const x=sx+(tx-sx)*uu,y=f.sy+(ty-f.sy)*uu-180*Math.sin(Math.PI*u);
      const cz=f.k==='coin',Z=cz?36:27;if(cz){circ(x,y,14,rgb([255,236,120],Math.floor(150*(1-0.4*u))/3/255));for(let q=0;q<3;q++){const uq=Math.max(0,u-0.07*(q+1)),e2=uq*uq*(3-2*uq);circ(sx+(tx-sx)*e2,f.sy+(ty-f.sy)*e2-180*Math.sin(Math.PI*uq),4-q,rgb([255,240,150],(110-30*q)/255))}}
      X.save();if(cz)X.filter='brightness(1.18)';itemDraw(f.k==='gear'?f.it:f.k,Math.round(x)-Z/2,Math.round(y)-Z/2,Z,cz?0.8:0.6);X.restore()}}
  // skill buttons (瑪奇M 風格：圓形、右下鍵位、消耗、節奏不足變暗)
  {const wind=P.rh>=WIND_COST,cd=Math.max(0,P.slamCD)/2.2;
    skillTile(1128,586,30,'攻',[200,90,40],'J','',false,-9,0,null);
    skillTile(1052,596,24,'刺',[170,30,50],'K','節奏2',P.rh<STAB_COST,s.denyK,0,null);
    skillTile(990,596,24,wind?'風':'掃',wind?[30,150,130]:[150,100,50],'L',wind?'節奏3':'',!wind&&cd>0,s.denyL,wind?0:cd,null);
    skillTile(1146,520,20,'跳',[50,100,190],'Space','',false,-9,0,null)}
  // bottom bar + subtitles
  X.fillStyle='#000';X.fillRect(0,622,W,H-622);X.fillStyle=rgb(GOLDC,180/255);X.fillRect(0,621,W,2);
  for(const [t0,t1,who,line] of s.subs){if(t0<=t&&t<t1){const n=Math.min(line.length,Math.floor((t-t0)/0.045)+1);
    if(who){rrect(40,646,40+18+who.length*22,676,6,'rgb(60,46,30)');T(who,49,661,FS(19),[255,235,180],0,[0,0,0],'lm')}T(line.slice(0,n),640,662,FS(24),[255,255,255],0,[0,0,0],'mm')}}
  if(t<s.hintUntil&&!s.subs.some(q=>q[0]<=t&&t<q[1]))T('方向鍵/WASD 移動　J 攻擊　K 心臟刺擊　L 大劍術　Space 跳躍　V 召喚詩人　E 互動　I 背包（暫停）　Esc 暫停',640,662,FN(17),[200,190,170],0,[0,0,0],'mm',Math.min(1,(s.hintUntil-t)/1))
  // centre cards (BATTLE START / VICTORY)
  for(const c of s.cards){const age=t-c.t0;if(age<0||age>c.dur)continue;const a=Math.min(1,age/0.12)*Math.min(1,(c.dur-age)/0.3),sc=Math.max(1,1.6-age/0.12*0.6);
    X.save();X.globalAlpha=a*0.55;X.fillStyle='#000';X.fillRect(0,250,W,120);X.restore();T(c.txt,640,300,FS(Math.floor(72*sc)),[255,240,200],5,[60,20,10],'mm',a);T(c.sub,640,350,FS(26),[255,210,120],3,[40,10,0],'mm',a)}
  s.cards=s.cards.filter(c=>t-c.t0<c.dur);
  // GO arrow
  if(!s.lock&&s.goT!=null&&(s.wave<WAVES.length||s.mineDone)&&Math.floor(t*3)%2){T('GO →',1180,330,FS(40),[255,236,150],4,[60,20,10],'mm')}
  m2HUD(cx0,shy);
  if(s.stage==='canyon'&&s.caveOn&&!s.trans){if(nearCave()){const px=Math.round(P.x-cx0),py=Math.round(P.y-200+shy);rrect(px-160,py-20,px+160,py+20,8,'rgba(12,10,16,0.85)',rgb(GOLDC),2);T('E　進入「赤岩礦坑」',px,py,FS(18),[255,244,214],2,[0,0,0],'mm')}
    else if(Math.floor(t*2.5)%2){const ax=Math.round(2425-cx0),ay=200;T('▼ 礦坑入口',ax,ay,FS(22),[255,236,150],3,[60,20,10],'mm')}}
  if(s.stage==='shrine'&&s.statueOn&&!s.ritual&&nearStatue()){const px=Math.round(P.x-cx0),py=Math.round(P.y-200+shy);rrect(px-170,py-20,px+170,py+20,8,'rgba(12,10,16,0.85)',rgb(GOLDC),2);T('E　向女神像祈禱：女神的試煉（困難）',px,py,FS(18),[255,244,214],2,[0,0,0],'mm')}
}
// ================= ritual overlay =================
function drawRitual(){const s=S0;if(!s.ritual)return;const age=s.t-s.ritual.t0;
  if(age>=1.4&&age<2.1){X.fillStyle=rgb([255,250,235],Math.min(1,(age-1.4)/0.5));X.fillRect(0,0,W,H)}
  if(age>=2.1){const a=age<2.4?1:1;X.fillStyle='#000';X.fillRect(0,0,W,H);if(age<2.4){X.fillStyle=rgb([255,250,235],1-(age-2.1)/0.3);X.fillRect(0,0,W,H)}
    const k=Math.min(1,Math.max(0,(age-2.3)/0.4))*(age<4.8?1:Math.max(0,(5.2-age)/0.4));
    X.save();X.globalAlpha=k;X.fillStyle=rgb(GOLDC);X.fillRect(390,300,500,2);X.fillRect(390,420,500,2);X.restore();
    T('赤岩礦坑・女神的試煉（困難）',640,350,FS(56),[255,236,200],5,[70,20,10],'mm',k);T('— HARD DUNGEON —',640,400,FS(22),[255,200,120],3,[30,10,0],'mm',k);
    T('第一章　看守者之柱',640,460,FN(18),[200,190,170],2,[0,0,0],'mm',k)}}
// ================= modes =================
let mode='title',paused=false,titleT=0,endInfo=null;
function startGame(){if(window.m2OpenMap)return m2OpenMap();seed=+(Q.get('seed')||Math.floor(Math.random()*1e5));S0=newSim();timers.length=0;setStage('canyon',{x:430});mode='play';musStop('title',0.8);musPlay('bgm',BGMV,0.8,true)}
function retry(){if(window.m2Retry)return m2Retry();const s=S0;const keep={gold:s.gold,kills:s.kills,exp:s.exp,lv:s.lv,maxCombo:s.maxCombo,food:s.food};const stg=s.stage,wv=s.wave;
  const n=newSim();Object.assign(n,keep);S0=n;timers.length=0;n.hintUntil=0;mode='play';
  if(stg==='boss'){setStage('shrine',{x:520});n.food=keep.food;sub('','從女神像重新挑戰：按 E 祈禱。',3.0)}
  else{setStage(stg,{x:430});if(stg!=='shrine'){n.wave=wv;const w=WAVES[wv];const px=w?Math.max(300,w.trig-300):WW-500;n.P.x=px;n.cam=clamp(px-470,0,CAMMAX);n.pet.x=px-118;if(!w){if(stg==='canyon')n.caveOn=true;else n.mineDone=true}}}
  musPlay(CURM,BGMV,0.5)}
// ================= title (瑪奇M 試玩標題風格) =================
const MENU=['開始冒險','設定','退出遊戲'];let menuSel=0,menuBoxes=[];
const HAND=["..........##......","........##..#.....","........#...#.....","........#...######",".....####.......#.","...##...........#.","..#.........#####.","..#............#..","..#.........####..","...#...........#..","....###########...",];
function drawHand(x,y){const k=3;for(let r=0;r<HAND.length;r++){const row=HAND[r];const a=row.indexOf('#'),b=row.lastIndexOf('#');
    for(let c=0;c<row.length;c++){if(row[c]==='#'){X.fillStyle='rgb(40,24,16)';X.fillRect(x+c*k,y+r*k,k,k)}else if(c>a&&c<b&&!(r<4&&c<8)){X.fillStyle='rgb(255,250,240)';X.fillRect(x+c*k,y+r*k,k,k)}}}}
function triquetra(cx,cy,r,col,w){X.save();X.strokeStyle=col;X.lineWidth=w;for(let i=0;i<3;i++){const a=-Math.PI/2+i*Math.PI*2/3;const ox=cx+Math.cos(a)*r*0.5,oy=cy+Math.sin(a)*r*0.5;X.beginPath();X.arc(ox,oy,r*0.62,a+Math.PI-1.05,a+Math.PI+1.05);X.stroke()}
  X.beginPath();X.arc(cx,cy,r*0.55,0,Math.PI*2);X.stroke();X.restore()}
function celticBand(x0,x1,y,h,col,dark){const n=Math.max(2,Math.round((x1-x0)/(h*1.6)));const step=(x1-x0)/n;X.save();X.lineCap='butt';
  const strand=(sg,a,b)=>{X.beginPath();for(let k=0;k<=a.length;k++){}};
  for(const pass of [0,1])for(const sg of [1,-1]){X.beginPath();for(let k=0;k<=60*n;k++){const u=k/(60*n),x=x0+(x1-x0)*u,yy=y+sg*Math.sin(u*n*Math.PI)*h/2;k?X.lineTo(x,yy):X.moveTo(x,yy)}
    X.strokeStyle=pass?col:dark;X.lineWidth=pass?3:7;X.stroke()}
  for(let i=0;i<n-1;i++){const sg=i%2?1:-1;X.beginPath();for(let k=-8;k<=8;k++){const u=(step*(i+1)+k*2)/(x1-x0);const x=x0+(x1-x0)*u,yy=y+sg*Math.sin(u*n*Math.PI)*h/2;k>-8?X.lineTo(x,yy):X.moveTo(x,yy)}X.strokeStyle=dark;X.lineWidth=7;X.stroke();X.strokeStyle=col;X.lineWidth=3;X.stroke()}
  X.restore()}
function drawTitle(){titleT+=1/60;const t=titleT;X.fillStyle='#000';X.fillRect(0,0,W,H);X.drawImage(IMG.titlebg,0,0,W,H);
  const vg=X.createRadialGradient(640,360,260,640,360,800);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(10,4,0,0.55)');X.fillStyle=vg;X.fillRect(0,0,W,H);
  circ(640,64,40,'rgba(250,244,230,0.95)','rgb(150,30,30)',4);circ(640,64,33,null,'rgb(150,30,30)',2);triquetra(640,66,24,'rgb(160,32,32)',4);
  X.save();X.globalAlpha=0.55;X.fillStyle='rgb(20,10,4)';X.fillRect(180,118,920,74);X.restore();
  T('夜路走多總匯三明治　艾爾琳之旅',640,155,FS(52),[255,250,240],6,[40,20,10],'mm');
  celticBand(190,1090,122,14,'rgb(230,190,90)','rgb(60,30,10)');celticBand(190,1090,190,14,'rgb(230,190,90)','rgb(60,30,10)');
  for(const x of [150,1130]){triquetra(x,156,26,'rgb(60,30,10)',8);triquetra(x,156,26,'rgb(240,200,100)',3)}
  rrect(1020,198,1098,224,6,'rgb(150,30,30)','rgb(255,220,140)',2);T('試玩版',1059,211,FN(15),[255,255,255],0,[0,0,0],'mm');
  const ly=392,bob=Math.floor(t/0.4)%2;spr('pet_idle',528,ly+12,{dy:bob});spr('kudas_idle',648,ly,{dy:bob});spr('bard_play'+(Math.floor(t/0.22)%2),786,ly-6,{flip:true});
  X.save();X.globalAlpha=0.55;X.fillStyle='rgb(20,10,4)';X.fillRect(300,444,680,38);X.restore();
  T('跟著苦達斯，穿過赤岩峽谷，挑戰礦坑深處的女神試煉',640,463,FS(22),[255,250,235],3,[30,15,5],'mm');
  menuBoxes=[];MENU.forEach((m,i)=>{const y=530+i*44,sel=i===menuSel;menuBoxes.push([560,y-20,720,y+20,i]);
    T(m,640,y,FS(sel?28:25),sel?[255,240,170]:[255,255,255],4,[30,15,5],'mm');
    if(sel)drawHand(500-Math.round(4*Math.sin(t*6)),y-16)});
  T('↑↓ 選擇　Enter / J 確定　（滑鼠也可以點）',640,672,FN(14),[240,230,210],2,[0,0,0],'mm');
  T('私人非商業同人試作',1270,708,FN(12),[230,220,200],2,[0,0,0],'rb')}
function menuGo(i){if(i===0){sfx('start',0.4);startGame()}else if(i===1){mode='manual';sfx('coin',0.3)}else{mode='quit';musStop('title',0.4);fetch('quit',{cache:'no-store'}).catch(()=>{});setTimeout(()=>{try{window.close()}catch(e){}},400)}}
function drawManual(){X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.35;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
  rrect(140,40,1140,680,14,'rgba(16,10,8,0.92)',rgb(GOLDC),3);celticBand(180,1100,64,12,'rgb(230,190,90)','rgb(60,30,10)');
  T('設定・操作說明',640,104,FS(36),[255,236,200],4,[60,20,10],'mm');
  const rows=[['移動','方向鍵 / WASD（上下＝縱深）','左搖桿 / 十字鍵'],['攻擊','J（或 Z）連按＝三段連擊；第三段上挑累積節奏','X'],['跳躍','Space；空中按 J＝下劈','A'],
    ['心臟刺擊','K：節奏 2，突刺單體並造成出血（5 秒持續傷害）','B'],['大劍術','L（或 X）：節奏 ≥3＝斬風；不足＝大地橫掃（冷卻 2.2 秒）','Y'],
    ['召喚詩人','V：食物 3/3 時召喚尋歡作樂（彈魯特琴加攻擊）','LB'],['互動','E（或 F）：礦坑入口、女神像、搗蛋鬼／貓商人','RB'],['背包','I 或點右下背包：暫停並打開背包（裝備／出售／分解）','—'],['暫停','Esc（或 P）','Back'],['全螢幕','F11','—']];
  T('動作',200,150,FN(16),[255,210,140],2,[0,0,0],'lm');T('鍵盤',350,150,FN(16),[255,210,140],2,[0,0,0],'lm');T('手把',1000,150,FN(16),[255,210,140],2,[0,0,0],'lm');
  rows.forEach(([a,b,c],i)=>{const y=186+i*34;T(a,200,y,FS(19),[255,244,214],2,[0,0,0],'lm');T(b,350,y,FN(17),[235,230,220],2,[0,0,0],'lm');T(c,1000,y,FN(17),[200,230,255],2,[0,0,0],'lm')});
  const tips=['斬風打到「出血」中的敵人：再追加一段 1/2 傷害。前方有倒地敵人時施放：免費、連發兩道。','西施犬：火球命中累積能量；HP ≤ 1/2 時自動花 2 格能量撐起守護泡泡（10 秒回復 1/2 HP）。','連擊越高傷害越高（+% 數值暫定）。被打後 3.2 秒內「復仇」：打中敵人回血。'];
  tips.forEach((q,i)=>T('・'+q,180,546+i*30,FN(15),[220,214,200],2,[0,0,0],'lm'));
  T('Esc / Enter / 點一下 回標題',640,650,FS(20),[255,255,255],3,[0,0,0],'mm')}
function drawQuit(){X.fillStyle='#000';X.fillRect(0,0,W,H);T('感謝遊玩！',640,320,FS(48),[255,236,200],4,[60,20,10],'mm');T('遊戲已結束，可以關閉這個視窗了。',640,390,FN(20),[220,220,220],2,[0,0,0],'mm')}
function drawEnd(){X.fillStyle='#000';X.fillRect(0,0,W,H);const s=S0,st=s.st;X.save();X.globalAlpha=0.3;X.drawImage(IMG.bossroom,0,0,W,H);X.restore();
  T('女神的試煉　通過！',640,150,FS(56),[255,236,200],5,[70,20,10],'mm');T('試玩版到此結束（之後：盾兵、精英、Boss 前對話）',640,214,FS(20),[255,210,140],3,[0,0,0],'mm');
  const tm=endInfo?endInfo.t:0;const rows=[['總傷害',st.dmg.toLocaleString('en-US')],['最高一擊',st.maxHit.toLocaleString('en-US')],['暴擊率',st.hits?Math.round(st.crits/st.hits*100)+'%':'—'],['追擊次數',''+st.zj],['最大連擊',''+s.maxCombo],['用時',`${Math.floor(tm/60)}:${String(Math.floor(tm%60)).padStart(2,'0')}`],['擊倒',''+s.kills]];
  rrect(380,250,900,250+rows.length*40+20,10,'rgba(16,10,8,0.85)',rgb(GOLDC),2);
  rows.forEach(([a,b],i)=>{T(a,420,280+i*40,FS(22),[255,226,190],2,[0,0,0],'lm');T(b,860,280+i*40,FN(22),[255,255,255],2,[0,0,0],'rm')});
  T('按 Enter 回標題',640,640,FS(26),[255,255,255],3,[0,0,0],'mm')}
function drawDead(){X.save();X.fillStyle='rgba(0,0,0,0.55)';X.fillRect(0,0,W,622);X.restore();T('苦達斯倒下了……',640,280,FS(56),[255,200,190],5,[60,0,0],'mm');T(S0.stage==='boss'?'按 Enter 回女神像重新挑戰':'按 Enter 從本區重來',640,350,FS(26),[255,255,255],3,[0,0,0],'mm');T('Esc 放棄並回到地圖（撿到的金幣與裝備會保留）',640,398,FN(18),[230,220,210],2,[0,0,0],'mm')}
function drawFades(){const s=S0;if(s.trans){const age=s.t-s.trans.t0;const a=age<0.55?age/0.55:Math.max(0,1-(age-0.55)/0.6);X.fillStyle=`rgba(0,0,0,${clamp(a,0,1)})`;X.fillRect(0,0,W,H)}
  if(s.fadeIn!=null){const age=s.t-s.fadeIn;if(age<1.0){X.fillStyle=`rgba(0,0,0,${1-age})`;X.fillRect(0,0,W,H)}}}
// ================= autoplayer (for headless tests) =================
const AI={mx:0,my:0,atk:0,jump:0,skill:0,sum:0,use:0,stab:0,cd:0,j:0};
function aiThink(){const s=S0,P=s.P;Object.assign(AI,{mx:0,my:0,atk:0,jump:0,skill:0,sum:0,use:0,stab:0});AI.cd-=1/60;
  if(s.food>=FOOD_MAX&&!s.bard)AI.sum=1;
  const go=(gx,gy,tol=10)=>{const dx=gx-P.x,dy=gy-P.y;if(Math.abs(dx)>tol)AI.mx=Math.sign(dx);if(Math.abs(dy)>8)AI.my=Math.sign(dy);return Math.abs(dx)<=tol*3&&Math.abs(dy)<=20};
  const tl=s.tele.find(c=>!c.done&&s.t>=c.t0&&Math.hypot(P.x-c.x,(P.y-c.y)*2.2)<c.r+20);
  if(tl){AI.my=P.y>tl.y?1:-1;if(P.y<=YMIN+2)AI.my=1;if(P.y>=YMAX-2)AI.my=-1;AI.mx=P.x>tl.x?1:-1;return}
  const loot=s.loot.filter(L=>L.state==='rest'&&s.t-L.t0>0.6).sort((a,b)=>Math.abs(a.x-P.x)-Math.abs(b.x-P.x))[0];
  const sh=bossShielded();
  let m=s.mobs.filter(m=>!m.dying&&!m.gone&&Math.abs(m.x-s.cam-640)<660&&!(m.kind==='boss'&&(sh||b4Prot()||(s.boss&&s.boss.b4&&s.boss.phase==='steles')))&&!(m.kind==='pillar'&&s.t-(m.rise||-9)<0.7)).sort((a,b)=>Math.abs(a.x-P.x)+Math.abs(a.y-P.y)*2-(Math.abs(b.x-P.x)+Math.abs(b.y-P.y)*2))[0];
  if(m){const side=m.x>P.x?1:-1;const reach=m.kind==='boss'?120:m.kind==='pillar'?80:70;const gx=m.x-side*reach,gy=m.y;const dx=gx-P.x,dy=gy-P.y;
    if(Math.abs(dy)>10)AI.my=Math.sign(dy);if(Math.abs(dx)>24)AI.mx=Math.sign(dx);else if(P.face!==side)AI.mx=side;
    if(P.rh>=WIND_COST&&AI.cd<=0&&Math.abs(m.y-P.y)<20&&Math.abs(m.x-P.x)<400&&P.face===side){AI.skill=1;AI.cd=2}
    else if(P.rh===STAB_COST&&AI.cd<=0&&Math.abs(dx)<40&&Math.abs(dy)<20&&P.face===side&&Math.random()<0.03){AI.stab=1;AI.cd=1.5}
    if(Math.abs(dx)<40&&Math.abs(dy)<20&&P.face===side){if(Math.random()<0.5)AI.atk=1;if(Math.random()<0.01)AI.jump=1}
    if(P.h>60&&Math.random()<0.3)AI.atk=1}
  else if(loot&&Math.abs(loot.x-P.x)<900){go(loot.x,loot.gy)}
  else if(s.stage==='canyon'&&s.caveOn){if(go((CAVE.x0+CAVE.x1)/2,YMIN))AI.use=1}
  else if(s.stage==='shrine'){if(go(STATUE.x-80,STATUE.y+20))AI.use=1}
  else{AI.mx=1;if(Math.abs(P.y-552)>8)AI.my=Math.sign(552-P.y)}}
// ================= main loop =================
let last=0,acc=0;const DT=1/60;window.__state=()=>{const s=S0;return s?{mode,t:s.t,hp:s.P.hp,x:s.P.x,y:s.P.y,wave:s.wave,ws:s.waveState,mobs:s.mobs.length,kills:s.kills,food:s.food,bard:!!s.bard,rh:s.P.rh,gold:s.gold,combo:s.combo,maxCombo:s.maxCombo,statue:s.statueOn,ritual:!!s.ritual,cam:s.cam,stage:s.stage,cave:s.caveOn,mineDone:!!s.mineDone,trans:!!s.trans,boss:s.boss?{hp:s.boss.m.hp,sh:bossShielded(),regrown:s.boss.regrown}:null,petEn:s.pet.en,shield:!!s.shield,win:s.winT!=null,errs:window.__err,m2:m2State()}:{mode,errs:window.__err,m2:m2State()}};
window.__inv=()=>{S0.godmode=true};
// dev staging for the v6.1 side-by-side comparison (real engine, staged positions)
window.__stage=()=>{const s=S0;s.waveState='fight';s.lock=[0,0];s.toSpawn=[];s.extra=0;s.cam=0;s.mobs=[];s.P.x=470;s.P.y=552;s.P.face=1;s.pet.x=350;s.pet.y=576;s.hintUntil=0;
  for(const [k,x,y] of [['bow',575,556],['sword',700,528],['sword',775,588],['bow',935,540]]){const m=mob(k,x,y);m.enter=false;m.cd=9;m.frz=s.t+99;s.mobs.push(m)}
  s.food=3;s.combo=23;s.lastHit=s.t;s.P.rh=2;summonBard();s.loot.push({k:'coin',x:725,y:400,gy:400,vx:0,vy:0,t0:s.t-1,state:'rest',amt:50},{k:'coin',x:1040,y:410,gy:410,vx:0,vy:0,t0:s.t-1,state:'rest',amt:50});
  s.log.push([s.t,'food','獲得 烤麵包'],[s.t,'coin','獲得 金幣 x67'],[s.t,'exp','經驗值 +1,344'],[s.t,'coin','獲得 金幣 x88'],[s.t,'coin','獲得 金幣 x40']);window.__frozenAI=true};
let CLICK=null,MOUSE=null,pauseWhy='';
function cvPos(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]}
cv.addEventListener('pointerdown',e=>{CLICK=cvPos(e)});cv.addEventListener('pointermove',e=>{MOUSE=cvPos(e)});
const inBox=(p,b)=>p&&p[0]>=b[0]&&p[0]<=b[2]&&p[1]>=b[1]&&p[1]<=b[3];
let titleMus=false;
function frame(now){requestAnimationFrame(frame);if(!last)last=now;let el=Math.min(0.1,(now-last)/1000);last=now;
  // M2.5e：高更新率螢幕（120/144Hz）上，沒有跑到邏輯格的那一格不畫也不清按鍵，免得按鍵被吃掉、也省一半繪圖
  if(mode==='play'&&!paused&&acc+el<DT){acc+=el;return}
  pollPad();
  if(m2Frame(el)){for(const k in KP)delete KP[k];CLICK=null;return}
  if(mode==='title'){if(!titleMus){titleMus=true;musStop(CURM,0.5);musPlay('title',0.5,1.2,true)}
    if(MOUSE)for(const b of menuBoxes)if(inBox(MOUSE,b))menuSel=b[4];
    if(press(['ArrowUp','KeyW'])||GPP.u)menuSel=(menuSel+MENU.length-1)%MENU.length;if(press(['ArrowDown','KeyS'])||GPP.d)menuSel=(menuSel+1)%MENU.length;
    drawTitle();let go=-1;if(IN.start()||press(['KeyJ','Space','KeyZ'])||GPP.jump)go=menuSel;if(CLICK)for(const b of menuBoxes)if(inBox(CLICK,b))go=b[4];
    if(AUTO&&!window.__holdTitle)go=0;if(go>=0){if(go===0)titleMus=false;menuGo(go)}}
  else if(mode==='manual'){drawManual();if(m21Manual()){}else if(IN.start()||IN.esc()||CLICK||GPP.jump){mode='title'}}
  else if(mode==='quit'){drawQuit()}
  else if(mode==='play'||mode==='dead'){
    if(mode==='play'&&IN.esc()&&(!paused||pauseWhy==='esc')){paused=!paused;pauseWhy='esc'}
    if(mode==='play'&&!paused&&(IN.bag()||(CLICK&&Math.hypot(CLICK[0]-1218,CLICK[1]-574)<40))){paused=true;pauseWhy='bag';S0.bagpulse=S0.t;m2UI('bag');CLICK=null}
    if(!paused&&mode==='play'){acc+=el;let n=0;while(acc>=DT&&n<6){step(DT);if(S0.godmode)S0.P.hp=Math.max(S0.P.hp,HPMAX*0.5),S0.P.dead=false;acc-=DT;n++}if(n>=6)acc=0;if(n)window.__fn=(window.__fn||0)+1}
    else if(mode==='dead'){acc=0;if(IN.esc()&&!AUTO)m2ToMap();else if(IN.start()||AUTO)retry()}
    const [cx0,shy]=drawWorld();drawHUD(cx0,shy);drawRitual();drawFades();if(mode==='dead')drawDead();
    if(paused){X.save();X.fillStyle='rgba(0,0,0,0.5)';X.fillRect(0,0,W,H);X.restore();
      if(pauseWhy!=='esc'){m2Overlay()}
      else if(false){rrect(390,200,890,470,12,'rgba(16,10,8,0.94)',rgb(GOLDC),3);X.drawImage(IMG.bag,616,222);T('背包',640,300,FS(40),[255,236,200],4,[60,20,10],'mm');T(`金幣 ${S0.gold.toLocaleString('en-US')}　食物 ${S0.food}/${FOOD_MAX}`,640,350,FN(20),[255,255,255],2,[0,0,0],'mm');T('（試玩版：背包內容尚未開放）　遊戲暫停中',640,392,FN(16),[220,210,190],2,[0,0,0],'mm');T('I / 點背包 繼續',640,436,FS(22),[255,255,255],3,[0,0,0],'mm')}
      else m21Pause()}}
  else if(mode==='end'){drawEnd();if(IN.start()||CLICK){mode='title';titleT=0;titleMus=false;musStop('lute',0.3)}}
  for(const k in KP)delete KP[k];CLICK=null}
addEventListener('load',()=>{loadAll().then(()=>{document.title=TITLE;requestAnimationFrame(frame)}).catch(e=>window.__err.push('load '+e))});
// heartbeat for the Windows launcher (exits the local server when the window closes)
setInterval(()=>{fetch('ping',{cache:'no-store'}).catch(()=>{})},3000);fetch('ping').catch(()=>{});
addEventListener('contextmenu',e=>e.preventDefault());
