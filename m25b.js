// ===== M2.5c：吟遊詩人表演動作「搖頭晃腦狂野演奏」v2（H 鍵／手機「演奏」；純表演，不是攻擊，不造成傷害或擊退） =====
// 依使用者參考影片 0:24–0:28：一拍兩下的迴圈（下拍：踏步深蹲、身體下沉、頭甩向一側；上拍：拖腳微起、頭甩向另一側），
// 弓背 C 字縮在琴上、琴壓低在大腿、左臂撐住琴頸，右手瘋狂十六分刷弦（金色月牙軌跡），一邊往後滑步；腳下紫紅魔法陣、金色光帶繞身、綠黃藍音符冒出。
// 起手一拍拉琴入戲 → 8 拍越甩越兇 → 收尾重刷＋仰頭高舉（安可！）。節奏 144 BPM。
const EMO={bpm:156};EMO.q=60/EMO.bpm;EMO.s16=EMO.q/4;EMO.intro=EMO.q;EMO.beats=8;EMO.loopEnd=EMO.intro+EMO.beats*EMO.q;EMO.dur=EMO.loopEnd+0.95;
// v3：甩頭一拍來回兩次（頭 5 個角度補間），頭髮／頭套慢 0.04 秒跟上並甩過頭（3 種落後量）
const EMO_H=[-16,-8,0,8,16],EMO_L=[-12,0,12];
function emoNear(a,v){let b=0;for(let i=1;i<a.length;i++)if(Math.abs(a[i]-v)<Math.abs(a[b]-v))b=i;return b}
function emoHead(v,n){const amp=n<2?9:17,w=Math.PI*2/(EMO.q/2);const th=amp*Math.cos(w*v),hr=amp*1.3*Math.cos(w*(v-0.04));
  const hi=emoNear(EMO_H,th),li=emoNear(EMO_L,hr-EMO_H[hi]);return [hi,li]}
function emoPhase(u){// 回傳 [姿勢, 拍內位置 p(0~1), 第幾拍, 區段, 第幾個十六分]
  if(u<EMO.intro)return [u<0.22?'emo_draw':'emo_u0',u/EMO.intro,-1,'intro',Math.floor(u/EMO.s16)];
  if(u>=EMO.loopEnd){const k=u-EMO.loopEnd;return [k<0.1?'emo_strum':(k<0.22?'emo_dL2':'emo_fin'),k/(EMO.dur-EMO.loopEnd),EMO.beats,'fin',0]}
  const v=u-EMO.intro,n=Math.floor(v/EMO.q),p=(v-n*EMO.q)/EMO.q,j=Math.floor(p*4);const [hi,li]=emoHead(v,n);
  return ['emo'+(p<0.5?'D':'U')+hi+li,p,n,'loop',j]}
function emoAmp(n){return n<2?2:(n<6?3:4)}
function emoBob(u){// 身體上下（像素×SS）：下拍沉到底、上拍拖腳回升，平滑餘弦
  const [,p,n,seg]=emoPhase(u);if(seg==='intro')return Math.round(2*Math.sin(p*Math.PI));
  if(seg==='fin'){const k=u-EMO.loopEnd;return k<0.22?4:Math.round(4*Math.max(0,1-(k-0.22)/0.12))}
  return Math.round(emoAmp(n)*(0.5+0.5*Math.cos(p*Math.PI*2)))}
// 變身時借用的姿勢（同 M2.4 原則）
for(const b of 'DU')for(let i=0;i<5;i++)for(let j=0;j<3;j++)TFB_MAP['emo'+b+i+j]=b==='D'?'slam':'windup2';
Object.assign(TFB_MAP,{emo_draw:'charge',emo_d0:'stomp0',emo_u0:'stomp1',emo_dL:'slam',emo_uR:'windup2',emo_dL2:'slam',emo_uR2:'upswing',emo_strum:'skill0',emo_fin:'skill1'});
// ---------- 原創配樂（程式合成）：搖滾味的凱爾特 8-bit 小曲，E 多利安音階自編，144 BPM ----------
const EMOF=n=>440*Math.pow(2,(n-69)/12);
const EMOA={ctx:null,dst:null};// 離線算預覽音檔時換掉
function emoC(){return [EMOA.ctx||AC,EMOA.dst||AB.fx]}
function emoPluck(t,midi,vol=0.08,len=0.32,bright=3200){try{const [C,D]=emoC();
  const o=C.createOscillator(),o2=C.createOscillator(),lp=C.createBiquadFilter(),g=C.createGain();o.type='sawtooth';o2.type='triangle';
  const f=EMOF(midi);o.frequency.value=f;o2.frequency.value=f*2;o2.detune.value=6;lp.type='lowpass';lp.Q.value=4;
  lp.frequency.setValueAtTime(bright,t);lp.frequency.exponentialRampToValueAtTime(Math.max(300,f*1.5),t+len*0.6);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol*1.6,t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+len);
  const g2=C.createGain();g2.gain.value=0.25;o.connect(lp);o2.connect(g2);g2.connect(lp);lp.connect(g);g.connect(D);o.start(t);o2.start(t);o.stop(t+len+0.02);o2.stop(t+len+0.02)}catch(e){}}
function emoStrum(t,notes,vol=0.06,len=0.5,dn=1){const ns=dn?notes:notes.slice().reverse();ns.forEach((m,i)=>emoPluck(t+i*0.009,m,vol,len,4200))}
function emoSq(t,midi,vol=0.05,len=0.1,duty=0.25){try{const [C,D]=emoC();// 8-bit 方波主旋律（帶一點顫音）
  const o=C.createOscillator(),g=C.createGain(),lp=C.createBiquadFilter();o.type='square';o.frequency.setValueAtTime(EMOF(midi),t);
  const lf=C.createOscillator(),lg=C.createGain();lf.frequency.value=6;lg.gain.value=EMOF(midi)*0.008;lf.connect(lg);lg.connect(o.frequency);
  lp.type='lowpass';lp.frequency.value=3600;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.006);g.gain.setValueAtTime(vol,t+len*0.6);g.gain.exponentialRampToValueAtTime(0.0001,t+len);
  o.connect(lp);lp.connect(g);g.connect(D);o.start(t);lf.start(t);o.stop(t+len+0.02);lf.stop(t+len+0.02)}catch(e){}}
const EMON=new WeakMap();function emoNoiseBuf(C){let b=EMON.get(C);if(!b){b=C.createBuffer(1,Math.floor(C.sampleRate*1.5),C.sampleRate);const d=b.getChannelData(0);let x=12345;for(let i=0;i<d.length;i++){x=(x*1103515245+12345)&0x7fffffff;d[i]=x/0x3fffffff-1}EMON.set(C,b)}return b}
function emoNoise(t,vol,len,hp=4000){try{const [C,D]=emoC();const s=C.createBufferSource();s.buffer=emoNoiseBuf(C);const f=C.createBiquadFilter(),g=C.createGain();f.type='highpass';f.frequency.value=hp;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+len);s.connect(f);f.connect(g);g.connect(D);s.start(t);s.stop(t+len+0.02)}catch(e){}}
function emoKick(t,vol=0.2,f0=140,len=0.18){try{const [C,D]=emoC();const o=C.createOscillator(),g=C.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(42,t+len*0.8);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+len);o.connect(g);g.connect(D);o.start(t);o.stop(t+len+0.02)}catch(e){}}
// 8 拍 × 4 個十六分：主旋律（E 多利安，自編的 reel 風跑句）、每拍根音（Em Em D D C D Em Em 強力和弦）
const LEAD=[64,59,64,66, 67,66,64,62, 59,62,64,66, 67,69,71,69, 71,76,74,71, 69,71,67,64, 62,64,66,69, 71,74,76,79];
const ROOT=[40,40,38,38,36,38,40,40];
function emoEvents(){const ev=[],Q=EMO.q,S=EMO.s16;
  ev.push([0,t=>{emoStrum(t,[64,59,55,52,47,40],0.05,0.8);emoNoise(t,0.03,0.5,6000)}]);ev.push([Q*0.5,t=>emoStrum(t,[40,47,52,55],0.05,0.3)]);ev.push([Q*0.75,t=>emoStrum(t,[52,47,40],0.05,0.2,0)]);
  for(let n=0;n<EMO.beats;n++)for(let j=0;j<4;j++){const tt=EMO.intro+n*Q+j*S,r=ROOT[n],acc=j===0?1:(j===2?0.8:0.55),grow=0.75+0.25*Math.min(1,n/5);
    ev.push([tt,t=>{emoStrum(t,[r,r+7,r+12],0.045*acc*grow,j===0?0.22:0.12,j%2===0);
      emoSq(t,LEAD[n*4+j],(n<2?0.028:0.04)*(j===0?1.15:1),S*0.95);
      if(j===0){emoKick(t,n%2?0.12:0.2);if(n%2)emoNoise(t,0.09,0.13,1800)}
      if(j===2&&n>=2)emoKick(t,0.1);
      if(j%2===0)emoNoise(t,0.025,0.04,7000)}])}
  const tf=EMO.loopEnd;// 收尾：重刷＋爆擊＋凱爾特顫音裝飾＋長和弦
  ev.push([tf,t=>{emoStrum(t,[40,47,52,55,59,64],0.085,0.9);emoKick(t,0.26,160,0.4);emoNoise(t,0.08,0.9,3000);emoSq(t,76,0.05,0.14)}]);
  [79,78,79,83].forEach((m,i)=>ev.push([tf+0.16+i*0.06,t=>emoSq(t,m,0.045,0.07)]));
  ev.push([tf+0.42,t=>{emoStrum(t,[40,47,52,59,64,71],0.075,1.3);emoSq(t,88,0.04,0.6);emoNoise(t,0.05,0.8,5000)}]);return ev}
const EMOEV=emoEvents();
function emoSound(A,u0,u1){if(!SAVE||!SAVE.opt||!SAVE.opt.sfx||typeof AC==='undefined'||AC.state!=='running')return;const now=AC.currentTime;
  for(const [tt,f] of EMOEV)if(tt>=u0&&tt<u1)f(now)}
window.__emoRender=async()=>{const C=new OfflineAudioContext(2,Math.ceil(44100*(EMO.dur+1.6)),44100);EMOA.ctx=C;EMOA.dst=C.destination;try{for(const [tt,f] of EMOEV)f(tt+0.05)}finally{EMOA.ctx=null;EMOA.dst=null}
  const b=await C.startRendering();const L=b.getChannelData(0),n=L.length,buf=new DataView(new ArrayBuffer(44+n*2));const ws=(o,s)=>{for(let i=0;i<s.length;i++)buf.setUint8(o+i,s.charCodeAt(i))};
  ws(0,'RIFF');buf.setUint32(4,36+n*2,true);ws(8,'WAVEfmt ');buf.setUint32(16,16,true);buf.setUint16(20,1,true);buf.setUint16(22,1,true);buf.setUint32(24,44100,true);buf.setUint32(28,88200,true);buf.setUint16(32,2,true);buf.setUint16(34,16,true);ws(36,'data');buf.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)buf.setInt16(44+i*2,Math.max(-1,Math.min(1,L[i]*1.2))*32767,true);const u=new Uint8Array(buf.buffer);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
// ---------- 狀態 ----------
function emoCanStart(){const s=S0,P=s&&s.P;return isBard()&&P&&!P.dead&&!m2Down()&&!s.ritual&&!s.trans&&P.h<=0&&!P.act}
function emoStart(){const P=S0.P;bAct('bemo',EMO.dur,{show:1});proc('搖頭晃腦狂野演奏',[255,170,220],'♪')}
window.stepPlayer=(o=>dt=>{const s=S0,P=s&&s.P;if(!P||!isBard())return o(dt);
  let A=P.act;
  if(A&&A.type==='bemo'){// 任何操作都會中斷表演（表演中不鎖操作）
    const mv=IN.l()||IN.r()||IN.u()||IN.d();
    if(mv||IN.atk()||IN.jump()||IN.stab()||IN.skill()||IN.sum()||press(['ShiftLeft','ShiftRight','KeyH'])||GPP.dodge||P.dead||m2Down()||P.hurtT>A.t0w){P.act=null;A=null;KP.KeyH=0}}
  else if(press(['KeyH'])&&emoCanStart()){emoStart();A=P.act;A.t0w=s.t;KP.KeyH=0}
  const u0=A&&A.type==='bemo'?A.t:0;
  if(A&&A.type==='bemo'){const [,p,n,seg]=emoPhase(u0);if(seg==='loop'&&n>=2&&p>=0.5)P.x-=P.face*28*dt}// 上拍拖腳往後滑（面向不變）
  o(dt);
  const B=P.act;if(B&&B.type==='bemo'){const u1=B.t;emoSound(B,u0===0?-1:u0,u1);emoFxStep(B,u0,u1);if(B.t>=B.dur){P.act=null;proc('安可！',[255,220,120],'♪')}}})(window.stepPlayer);
const EMO_NC=[PAL.gold,PAL.blue,YG];
function emoFxStep(A,u0,u1){const s=S0,P=s.P,t=s.t,S=EMO.s16;
  const i0=Math.floor((u0-EMO.intro)/(S/2)),i1=Math.floor((u1-EMO.intro)/(S/2));
  if(u1>=EMO.intro&&u1<EMO.loopEnd&&i1!==i0){// 每個十六分：一道刷弦月牙；常常冒音符
    s.fx.push({k:'b_emoS',t0:t,up:i1%2,jt:U(-0.15,0.15)});
    if(i1%2===0&&Math.random()<(i1<16?0.35:0.6))s.fx.push({k:'b_emoN',x:P.x+P.face*U(-30,40),y:P.y,h:U(70,130),vx:P.face*U(-80,80)+U(-30,30),t0:t,c:CH(EMO_NC),sw:U(0,6.28)})}
  if(u0<EMO.loopEnd&&u1>=EMO.loopEnd){s.fx.push({k:'b_emoR',x:P.x,y:P.y,t0:t,big:1});shake(2,0.15);for(let i=0;i<6;i++)s.fx.push({k:'b_emoN',x:P.x+U(-40,40),y:P.y,h:U(80,140),vx:U(-140,140),t0:t,c:CH(EMO_NC),sw:U(0,6.28)})}
  const [p]=emoPhase(u1);if(/^emo[DU][04]/.test(p)&&Math.floor(u1/0.035)!==Math.floor(u0/0.035)){P.ghost=P.ghost||[];P.ghost.push({nm:'bh_'+p,x:P.x,y:P.y,f:P.face,t})}}
// 姿勢
const _bPose=bPose;bPose=function(P,t){const a=P.act;if(a&&a.type==='bemo'&&!P.dead&&!m2Down())return emoPhase(a.t)[0];return _bPose(P,t)};
// 身體上下晃
window.spr=(o=>(n,sx,sy,op={})=>{const s=S0,P=s&&s.P;if(P&&P.act&&P.act.type==='bemo'&&n.startsWith('kudas_')&&!op.__g&&!op.__ally&&isBard())sy+=emoBob(P.act.t)*SS;return o(n,sx,sy,op)})(window.spr);
// ---------- 特效（多層色階、少線條） ----------
function emoLv(u){const [,p,n,seg]=emoPhase(u);if(seg==='intro')return Math.min(1,u/EMO.intro)*0.6;if(seg==='fin'){const k=(u-EMO.loopEnd)/(EMO.dur-EMO.loopEnd);return 1-Math.max(0,(k-0.6)/0.4)}return {p,n}}
function emoBeat(u){const [,p,n,seg]=emoPhase(u);return seg==='loop'?Math.max(0,1-(p%0.5)/0.25):(seg==='fin'&&u-EMO.loopEnd<0.3?1-(u-EMO.loopEnd)/0.3:0)}
function emoFade(u){if(u<EMO.intro)return u/EMO.intro;const k=u-EMO.loopEnd;return k<0?1:Math.max(0,1-Math.max(0,k-0.6)/0.35)}
const EMO_CIR=[[60,16,70],[140,40,150],[220,90,210],[255,190,245]];
function emoCircle(sx,sy,u,t){const a=emoFade(u);if(a<=0)return;const b=emoBeat(u);const [c,x]=pxc(76,28);// 腳下紫紅魔法陣
  bdisc(x,38,14,24+2*b,[[70,20,80],[110,30,120]],0.34,0.35*a);
  bring(x,38,14,26+2*b,3,EMO_CIR,0.34,a);bring(x,38,14,17+b,2,[[140,40,150],[255,160,235]],0.34,0.85*a);
  for(let i=0;i<10;i++){const an=i/10*Math.PI*2+t*1.8;pdot(x,38+Math.cos(an)*21.5-1,14+Math.sin(an)*21.5*0.34-1,i%2?[255,220,250]:[220,120,230],2)}
  pxOut(c,sx,sy-2,1);if(b>0.2)bloom(sx,sy-6,80,[230,110,230],0.18*b*a,0.35)}
function emoRibbon(sx,sy,u,t,front){const a=emoFade(u);if(a<=0||u<0.2)return;const [c,x]=pxc(64,40);// 金色光帶繞身（後半在角色後、前半在前）
  const th=t*7.5,rx=24,ry=7,tilt=0.32;let any=0;
  for(let i=0;i<16;i++){const an=th-i*0.16,sn=Math.sin(an);if((sn>0)!==front)continue;any=1;const px=32+Math.cos(an)*rx,py=20+sn*ry+Math.cos(an)*rx*tilt;
    const g=GOLD5,k=i/16,sz=k<0.3?3:(k<0.7?2:1);pdot(x,px-1,py-1,g[k<0.2?4:(k<0.45?3:(k<0.75?2:1))],sz);if(k<0.3)pdot(x,px-1,py+1,g[2],sz)}
  if(any)pxOut(c,sx,sy-64,a*(front?1:0.8))}
// 角色身後：魔法陣＋光帶後半
window.m2Ents=(o=>(ents,SX,shy)=>{o(ents,SX,shy);const s=S0,P=s&&s.P;if(!P||!P.act||P.act.type!=='bemo'||!isBard())return;
  ents.push([P.y-0.01,()=>{const u=P.act&&P.act.type==='bemo'?P.act.t:null;if(u==null)return;const sx=SX(P.x),sy=P.y+shy;emoCircle(sx,sy,u,s.t);emoRibbon(sx,sy,u,s.t,false)}])})(window.m2Ents);
if(typeof m2Ents==='function'&&window.m2Ents!==m2Ents)m2Ents=window.m2Ents;
window.drawM2Fx=(o=>(SX,shy)=>{o(SX,shy);const s=S0;if(!s||!s.fx)return;const t=s.t,P=s.P;
  if(P&&P.act&&P.act.type==='bemo'&&isBard())emoRibbon(SX(P.x),P.y+shy,P.act.t,t,true);
  for(const e of s.fx){if(e.k!=='b_emoR'&&e.k!=='b_emoN'&&e.k!=='b_emoS')continue;const age=t-e.t0;
    if(e.k==='b_emoS'){if(!P||age>0.09)continue;const k=age/0.09,sx=SX(P.x)+P.face*14,sy=P.y+shy-40+(P.act&&P.act.type==='bemo'?emoBob(P.act.t)*SS:0);// 刷弦月牙
      const [c,x]=pxc(24,24);const a0=(e.up?-0.3:0.3)+(e.jt||0),sw=2.1*Math.min(1,k*3);const cols=[PAL.gold[1],PAL.gold[2],PAL.gold[3],PAL.gold[4]];
      cols.forEach((cl,i)=>{x.strokeStyle=rgb(cl);x.lineWidth=4-i;x.beginPath();const r=9-i*0.5;if(e.up)x.arc(12,12,r,Math.PI*0.5+a0,Math.PI*0.5+a0+sw);else x.arc(12,12,r,-Math.PI*0.5+a0,-Math.PI*0.5+a0+sw);x.stroke()});
      pxOut(c,sx,sy,1-k*0.7,'lighter');continue}
    const sx=SX(e.x);
    if(e.k==='b_emoR'){const L=e.big?0.7:0.45;if(age>L)continue;const k=age/L;const [c,x]=pxc(90,40);
      bring(x,45,22,6+(e.big?36:28)*k,6*(1-k)+1.5,e.big?GOLD5:PINK,0.38,1-k);bring(x,45,22,3+(e.big?24:18)*k,3*(1-k)+1,EMO_CIR,0.38,0.8*(1-k));pxOut(c,sx,e.y+shy-4);
      bloom(sx,e.y+shy-70,e.big?130:80,[255,210,120],0.3*(1-k));continue}
    const L=1.1;if(age>L)continue;const k=age/L;const [c,x]=pxc(20,22);pNote(x,8,15,e.c,1.15);
    pxOut(c,sx+e.vx*age+Math.sin(e.sw+age*7)*10,e.y-e.h-age*110+shy,k<0.7?1:1-(k-0.7)/0.3);}
  s.fx=s.fx.filter(e=>!((e.k==='b_emoR'&&t-e.t0>0.8)||(e.k==='b_emoN'&&t-e.t0>1.2)||(e.k==='b_emoS'&&t-e.t0>0.12)))})(window.drawM2Fx);
// 操作說明：詩人那一行加上 H
for(const k in TMAP){if(/^J 連擊/.test(TMAP[k])&&!/H 狂野/.test(TMAP[k]))TMAP[k]=TMAP[k].replace('　Esc 暫停','　H 狂野演奏　Esc 暫停')}
// ---------- 按鍵邊緣修正：一個畫面跑多個 step 時，同一次按鍵只算一次；120Hz 螢幕沒跑 step 的畫面不吃掉按鍵 ----------
(()=>{let stepped=0;const KEEP_OUT={Escape:1,KeyP:1,KeyI:1,Enter:1,NumpadEnter:1,Tab:1};
  const _step=step;step=function(dt){if(stepped){for(const k in KP)delete KP[k];GPP={}}_step(dt);stepped++};
  let carried={};const _frame=frame;frame=function(now){const live=mode==='play'&&!paused;const sv=live?Object.assign({},KP):null;stepped=0;_frame(now);const nc={};
    if(sv&&!stepped&&mode==='play'&&!paused)for(const k in sv)if(!KEEP_OUT[k]&&!carried[k]){KP[k]=sv[k];nc[k]=1}carried=nc}})();
