// ================= W3 新封面：「總匯英雄傳」（web/w3cover.js，載在 m28.js 之後） =================
// 拿掉舊標語「跟著苦達斯…」、加副標「總匯英雄傳」、所有可玩角色排成行軍隊伍（苦達斯帶頭往右前進）。
// 新增角色＝在 COVER_CAST 加一筆（圖檔名、大小、位置），見 shots_w3/cover/README.md。
// 舊 drawTitle 的選單、版本號、登入人數照舊畫；舊的標題字、圖騰、標語、角色在這裡攔掉，改畫新的。
(function(){
// ---- 角色清單（由左到右）。frames：web/a/ 底下的圖（不含 .png），fps：換格速度；sc：大小（HD 主角一律 1＝原尺寸，粗線才不會變細或糊掉）
// dx/dy：在自動排好的位置上再微調（像素）；x：直接指定中心點（不用自動排）；pet:true＝寵物，主角超過 5 位時自動拿掉
// W3：行軍隊形——苦達斯打頭陣往右前進，大家跟在後面（全部面向右、步伐錯開、腳下揚塵）
const COVER_CAST=window.COVER_CAST||[
  {id:'xishi', name:'西施',     frames:['s_pet_run0','s_pet_run1'],           fps:7,  sc:1, x:300, dy:10, pet:true, ph:0.5},
  {id:'heal',  name:'夾夾',     frames:['s_hl_walk0','s_hl_walk1','s_hl_walk2','s_hl_walk3','s_hl_walk4','s_hl_walk5','s_hl_walk6','s_hl_walk7'],fps:9,sc:1,x:450,dy:-14,ph:0.3},
  {id:'archer',name:'三杯兔子', frames:['s_ar_walk0','s_ar_walk1','s_ar_walk2','s_ar_walk3','s_ar_walk4','s_ar_walk5','s_ar_walk6','s_ar_walk7'],fps:9,sc:1,x:590,dy:8,ph:0.6},
  {id:'bard',  name:'尋歡作樂', frames:['s_bh_play0','s_bh_play1'],fps:4,sc:1,x:730,dy:-10,ph:0.2,step:3,bob:5,notes:true},   // 邊走邊彈奏（奏樂格＋跟隊伍同步的步伐起伏＋音符）
  {id:'kudas', name:'苦達斯',   frames:['s_kudas_run0','s_kudas_run1','s_kudas_run2','s_kudas_run3'],fps:6,sc:1,x:890,dy:6,lead:true,ph:0},
];
window.COVER_CAST=COVER_CAST;
const COVER={
  baseY:414,          // 腳底線（站在背景的小路上，路面約 y=330～420）
  gapHero:150,        // 主角之間的中心距離
  gapPet:128,         // 寵物跟旁邊主角的距離
  maxHeroesWithPet:6, // 角色（含西施）超過 6 位就拿掉西施
};
window.COVER_CFG=COVER;
// ---- 圖片：遊戲已載入的直接用，沒有的自己載
const CI={},BB={};
function img(n){let im=(typeof IMG!=='undefined'&&IMG[n]&&IMG[n].naturalWidth)?IMG[n]:CI[n];
  if(!im){im=CI[n]=new Image();im.src='a/'+n+'.png'}return im.complete&&im.naturalWidth?im:null}
// 每張圖的實際外框（腳底中心當錨點），算一次就記住
function bbox(n,im){if(BB[n])return BB[n];const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.drawImage(im,0,0);
  const d=x.getImageData(0,0,c.width,c.height).data;let x0=c.width,x1=-1,y0=c.height,y1=-1;
  for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++)if(d[(y*c.width+xx)*4+3]>8){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(y<y0)y0=y;if(y>y1)y1=y}
  return BB[n]=x1<0?[0,0,c.width,c.height]:[x0,y0,x1+1,y1+1]}
// ---- 排位：主角平均排開置中；寵物貼在最左邊主角的外側
function layout(){let cast=COVER_CAST.slice();if(cast.length>COVER.maxHeroesWithPet)cast=cast.filter(c=>!c.pet);
  const heroes=cast.filter(c=>!c.pet),n=heroes.length,pets=cast.filter(c=>c.pet);
  const g=n>1?Math.min(COVER.gapHero,(1040-pets.length*COVER.gapPet)/(n-1)):0;   // 人多時自動縮小間距，整排不超過 1040px
  const w=(n-1)*g+pets.length*COVER.gapPet,x0=640-w/2+pets.length*COVER.gapPet;
  const pos=new Map();heroes.forEach((c,i)=>pos.set(c,x0+i*g));pets.forEach((c,i)=>pos.set(c,x0-(i+1)*COVER.gapPet));
  return cast.map(c=>({c,x:(c.x!=null?c.x:pos.get(c))+(c.dx||0),y:COVER.baseY+(c.dy||0)}))}
window.coverLayout=layout;
function drawFig(f,t,i){const c=f.c,fr=c.frames,k=c.fps?Math.floor(t*c.fps)%fr.length:0;const n=fr[k],im=img(n)||img(fr[0]);if(!im)return;
  const b=bbox(fr[0],img(fr[0])||im),sc=c.sc||1,bob=c.bob?-Math.round(Math.abs(Math.sin((t*c.step+(c.ph||0))*Math.PI))*c.bob):c.fps?0:((Math.floor(t/0.4)+i)%2)*2;
  const w=im.naturalWidth*sc,h=im.naturalHeight*sc,fx=(b[0]+b[2])/2*sc,fy=b[3]*sc;
  // 影子：每個角色同一種（同一個光源，正上方偏左）
  X.save();X.fillStyle='rgba(22,10,4,0.42)';X.beginPath();X.ellipse(Math.round(f.x+4),Math.round(f.y-2),Math.round((b[2]-b[0])*sc*0.42),Math.round(9*sc),0,0,Math.PI*2);X.fill();X.restore();
  X.save();X.imageSmoothingEnabled=false;
  if(c.flip){X.translate(Math.round(f.x),0);X.scale(-1,1);X.drawImage(im,Math.round(-fx),Math.round(f.y-fy+bob),Math.round(w),Math.round(h))}
  else X.drawImage(im,Math.round(f.x-fx),Math.round(f.y-fy+bob),Math.round(w),Math.round(h));
  X.restore();
  if(c.notes)notes(f,t,b,sc,c.ph||0);
  // 腳下揚塵：往後飄（左），每個角色錯開
  if(c.fps){const hw=(b[2]-b[0])*sc;for(let j=0;j<4;j++){const q=((t*1.6+j/4+(c.ph||0))%1),px=f.x-hw*0.35-q*70,py=f.y-4-q*16,r=Math.round(2+q*5);
    X.save();X.globalAlpha=0.45*(1-q);X.fillStyle='rgb(222,176,120)';X.fillRect(Math.round(px-r),Math.round(py-r),r*2,r*2);X.restore()}}}
// 奏樂音符：從琴身往後上方飄（像素風、無文字）
function notes(f,t,b,sc,ph){const top=f.y-(b[3]-b[1])*sc;for(let j=0;j<3;j++){const q=((t*0.55+j/3+ph)%1),x=Math.round(f.x-34-q*90),y=Math.round(top+108-q*84+Math.sin((q*3+j)*Math.PI)*6);
  X.save();X.globalAlpha=q<0.15?q/0.15:1-Math.max(0,(q-0.6)/0.4);const col=j%2?'rgb(255,226,120)':'rgb(255,190,210)';
  X.fillStyle='rgb(40,16,8)';X.fillRect(x-1,y-1,10,8);X.fillRect(x+6,y-17,5,18);if(j===1)X.fillRect(x+6,y-19,12,7);
  X.fillStyle=col;X.fillRect(x,y,8,6);X.fillRect(x+7,y-16,3,17);if(j===1)X.fillRect(x+7,y-18,10,4);X.restore()}}
// 地面往後流動的小石子／草（營造前進感）
function ground(t){X.save();for(let i=0;i<26;i++){const sp=150+((i*37)%5)*30,x=((i*197-t*sp)%1400+1400)%1400-60,y=COVER.baseY-18+((i*53)%46);
  X.globalAlpha=0.35;X.fillStyle=i%3?'rgb(120,62,30)':'rgb(238,190,120)';X.fillRect(Math.round(x),y,i%3?3:5,2)}X.restore()}
// 隊長旗：苦達斯頭上前方一面小三角旗（像素風、無文字）
function flag(f,t){const x=Math.round(f.x+52),y=Math.round(f.y-196);X.save();X.fillStyle='rgb(60,30,12)';X.fillRect(x,y,4,60);
  const w=Math.sin(t*6);X.beginPath();X.moveTo(x+4,y);X.lineTo(x+46,y+10+w*3);X.lineTo(x+4,y+22);X.closePath();X.fillStyle='rgb(176,36,36)';X.fill();X.lineWidth=3;X.strokeStyle='rgb(40,12,8)';X.stroke();
  X.fillStyle='rgb(240,200,110)';X.fillRect(x+12,y+8,8,6);X.restore()}
// ---- 標題 LOGO：兩行大字＋紅色緞帶副標（手機橫向約 0.54 倍、直向約 0.3 倍時仍看得清楚）
function band(x0,x1,y){if(typeof celticBand==='function')celticBand(x0,x1,y,14,'rgb(232,192,92)','rgb(52,26,10)')}
function knot(x,y){if(typeof triquetra==='function'){triquetra(x,y,24,'rgb(52,26,10)',9);triquetra(x,y,24,'rgb(242,204,104)',4)}}
function ribbon(cx,cy,w,h){const x0=cx-w/2,x1=cx+w/2,y0=cy-h/2,y1=cy+h/2,tl=26,nt=12;
  const tail=(s)=>{const xa=s<0?x0+8:x1-8,xb=xa+s*tl*1.6;X.beginPath();X.moveTo(xa,y0+8);X.lineTo(xb,y0+8);X.lineTo(xb+(-s)*nt,(y0+y1)/2+4);X.lineTo(xb,y1+8);X.lineTo(xa,y1+8);X.closePath();
    X.fillStyle='rgb(104,18,22)';X.fill();X.lineJoin='round';X.lineWidth=6;X.strokeStyle='rgb(40,12,8)';X.stroke()};
  tail(-1);tail(1);
  X.save();X.beginPath();X.roundRect(x0,y0,w,h,6);X.fillStyle='rgb(162,34,36)';X.fill();
  X.clip();X.fillStyle='rgb(196,56,52)';X.fillRect(x0,y0,w,Math.round(h*0.34));X.fillStyle='rgb(122,22,26)';X.fillRect(x0,y1-Math.round(h*0.22),w,h);X.restore();
  X.beginPath();X.roundRect(x0,y0,w,h,6);X.lineWidth=8;X.strokeStyle='rgb(40,12,8)';X.stroke();X.lineWidth=4;X.strokeStyle='rgb(240,200,110)';X.stroke()}
function drawLogo(t){
  X.save();X.globalAlpha=0.6;X.fillStyle='rgb(18,9,4)';X.beginPath();X.roundRect(286,12,708,172,14);X.fill();X.restore();
  band(300,980,18);band(300,980,178);knot(266,98);knot(1014,98);
  T('夜路走多總匯三明治',640,58,FS(48),[255,232,170],6,[44,20,8],'mm');
  T('艾爾琳之旅',640,126,FS(84),[255,250,240],8,[44,20,8],'mm');
  ribbon(640,206,300,54);
  T('總匯英雄傳',640,208,FS(38),[255,240,196],5,[60,10,10],'mm');
  rrect(1040,192,1120,222,6,'rgb(150,30,30)','rgb(255,220,140)',4);T('試玩版',1080,208,FN(17),[255,255,255],3,[60,10,10],'mm')}
window.drawCoverW3={logo:drawLogo,fig:drawFig,layout};
// ---- 攔掉舊封面的標題字、圖騰、標語、角色、遮色條；選單／提示／版本／人數照舊
const DROP_T=new Set(['夜路走多總匯三明治　艾爾琳之旅','跟著苦達斯，穿過赤岩峽谷，挑戰礦坑深處的女神試煉','試玩版','即將登場','？']);
window.drawTitle=(o=>function(){const sv={T:window.T,spr:window.spr,circ:window.circ,tri:window.triquetra,band:window.celticBand,rr:window.rrect},fr=X.fillRect;
  window.T=function(s){if(DROP_T.has(s))return;return sv.T.apply(this,arguments)};
  window.spr=function(){};window.circ=function(){};window.triquetra=function(){};window.celticBand=function(){};window.rrect=function(){};
  X.fillRect=function(x,y,w,h){if((x===180&&y===118&&w===920)||(x===300&&y===444&&w===680))return;return fr.apply(this,arguments)};
  let r;try{r=o.apply(this,arguments)}finally{window.T=sv.T;window.spr=sv.spr;window.circ=sv.circ;window.triquetra=sv.tri;window.celticBand=sv.band;window.rrect=sv.rr;X.fillRect=fr}
  try{const t=typeof titleT!=='undefined'?titleT:0;drawLogo(t);ground(t);const L=layout().sort((a,b)=>a.y-b.y);L.forEach((f,i)=>drawFig(f,t,i))}catch(e){(window.__err||[]).push('w3cover '+e.message)}
  return r})(window.drawTitle);
})();
