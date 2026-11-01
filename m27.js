// M2.7（自動產生，請改 src27/）
// ---- src27/a_archer.js
// ===== M2.7 第 3 位可操作角色：三杯兔子（長弓兵）=====
// 規格：design/archer_final_zh.md（動作、數值、平衡理由、參考來源）。流程範本：design/character_creation_path_zh.md 第 8 節
// 分派：src22/d_bard.js 的 stepPlayer／m2Hurt 看到 HEROK==='archer' 就交給這裡（不經過苦達斯的 b_moves、詩人的 bStep）
// 資源：集中（沿用 P.rh 0–5，HUD 改名）＋龍矢量表 P.dragon（0–100，只存在關卡中，不進存檔；不碰詩人的 P.ue）
const isArcher=()=>HEROK==='archer';
const AR={sp:330,spy:165,air:320,jv:1200,
  shot:{dur:0.30,hit:0.06,v:1500,rng:760,mul:0.75,mvk:0.6},
  chg:{st:0.5,mul:[1.4,2.0,2.6],mvk:0.4},
  wing:{cd:8,dist:260,rx:150,ry:62,delay:0.35,mul:1.0,brk:5},
  rain:{cd:12,dist:300,w:150,ry:70,n:8,dur:2.0,mul:0.5,mist:4,mistN:4,mistMul:0.25,slow:0.6},
  fire:{cd:10,v:1300,rng:700,r:130,mul:0.55,chain:2,chMul:0.45,chR:300},
  flip:{cd:7,dist:220,n:3,n2:5,cost:2,mul:0.6,iF:0.3},
  roll:{cd:1.0,dur:0.36,dist:300},
  snipe:{cd:18,dur:8,cost:5,n:3,dm:1.2,rm:1.2,drMul:1.2,drV:2300,drRng:1400,shotGap:0.22,drGap:0.45},
  ult:{dur:2.4,ticks:6,tickMul:0.6,finMul:1.0,len:1400,dy:92,brk:8,iF:2.05},
  airMax:2};   // 空中射擊次數上限（不能叫 air：會蓋掉上面的空中移動速度 air:320，跳起來 P.x 變 NaN、人物消失）
// 龍矢量表：打中 +0.5（間隔 0.1 秒）、技能 +4、集中轉換 +3、挨打 +3（間隔 0.4 秒）、狙擊龍矢命中 +2 → 用 test/sim_ar.js＋t_ar_sim.mjs 量測，調到和詩人樂章差不多的等待時間
const DRG={max:100,hit:0.5,hitGap:0.1,skill:4,rh:3,hurt:3,hurtGap:0.4,dr:2};
const BAL27={wm:0.72,hurt:1.10};   // 全域倍率：依 test/sim24.js 對打模擬結果調整（design/archer_final_zh.md 平衡表）
const A27={dr:0,crit:0};
function arDrg(n,gap,key){const s=S0,P=s.P,t=s.t;if(!n||!P||P.dead||(P.act&&P.act.type==='au'))return;if(gap){if(t-(P[key]||-9)<gap)return;P[key]=t}
  const u0=P.dragon||0;P.dragon=Math.min(DRG.max,u0+n);if(u0<DRG.max&&P.dragon>=DRG.max){P.drgFullT=t;proc('龍矢滿・J+K 絕招',[200,150,255],'龍');sfx('ready',0.4)}}
function arRh(n){const P=S0.P;const r0=P.rh;P.rh=Math.min(RHMAX,P.rh+n);if(GS.rhy&&P.rh>r0&&P.rh<RHMAX&&rnd()<GS.rhy){P.rh++;proc('集中加成',[120,220,150],'集')}if(P.rh>r0)arDrg((P.rh-r0)*DRG.rh)}
// 打擊：和詩人的 bHit 一樣換 POOL，但不加詩人的樂章（P.ue）
function aHit(m,mv,pool,mul,multi,dr){const K=POOLKEY[mv]||POOLKEY.n,sv=[POOL[K[0]],POOL[K[1]]];if(pool){POOL[K[0]]=POOL[pool];POOL[K[1]]=POOL[pool+'c']||POOL[pool]}B22.mul=mul||1;A27.dr=dr?1:0;let v=0;
  try{v=hitMob(m,mv,{multi:!!multi})}finally{POOL[K[0]]=sv[0];POOL[K[1]]=sv[1];B22.mul=1;A27.dr=0}if(isArcher())arDrg(DRG.hit,DRG.hitGap,'drgHitT');return v}
const arBig=m=>m.kind==='boss'?60:m.kind==='pillar'?20:0;
const arMvcd=()=>1-(GS.mvcd||0);
const arSpd=()=>(1+GS.aspd+(S0.P.aftrU>S0.t?GS.aftr||0:0))*(buffed()?BUFF_SPD:1);
const arLive=m=>!m.gone&&!m.dying;
// 傷害：職業倍率、龍矢／絕招（覺醒「龍矢威力」、里程碑、SP17）；破防 +10%、破殼標記 +12%、霧氣（SP15）+8%＝對所有角色都有效
window.m2Dmg=(o=>function(v,m,mv,crit){let r=o.apply(this,arguments);if(typeof r!=='number'||mv==='pet')return r;const s=S0,t=s.t;let k=1;
  if(isArcher()){k*=BAL27.wm;if(A27.dr){k*=1+((GS.g25&&GS.g25.dragon)||0);if(GS.sp==='SP17')k*=1.15}}
  if(m&&m.brkU>t)k*=1.10;if(m&&m.mkU>t)k*=1.12;if(m&&m.mistU>t&&m.mistSP)k*=1.08;
  return k===1?r:Math.round(r*k)})(window.m2Dmg);
// ---------- 箭 ----------
function arShoot(o){const s=S0;(s.arw=s.arw||[]).push(Object.assign({t0:s.t,hit:{},h:92,vh:0,vy:0,pierce:0,mul:1,pool:'n',mv:'n'},o));sfx('swing',o.k==='dr'?0.5:0.22)}
window.m2Crit=(o=>m=>A27.crit?9:o(m))(window.m2Crit);
function arArrowHit(b,m){const s=S0,t=s.t;b.hit[m.id]=1;A27.crit=b.crit?1:0;let v;try{v=aHit(m,b.mv,b.pool,b.mul,false,b.dr)}finally{A27.crit=0}
  if(b.src==='p'&&v&&(b.k==='n'||b.k==='sn'||b.k==='fa')&&t-(s.P.rhT||-9)>0.7){s.P.rhT=t;arRh(1)}
  if(b.k==='c3'&&v){arRh(1)}
  if(b.k==='dr'){s.fx.push({k:'ar_pop',x:m.x,y:m.y,h:b.h,t0:t,c:[150,220,255],big:1});if(s.P&&isArcher())arDrg(DRG.dr);shake(4,0.12)}
  else if(b.k==='as'){s.fx.push({k:'ar_pop',x:m.x,y:m.y,h:b.h,t0:t,c:[200,170,255],big:1});if(!m.dying&&m.kind!=='pillar'){m.mkU=t+8;proc('破殼標記',[170,120,230],'標')}}
  else s.fx.push({k:'ar_pop',x:m.x,y:m.y,h:b.h,t0:t,c:b.k==='c3'||b.k==='c2'||b.k==='c1'?[255,230,120]:b.k==='fa'?[255,170,230]:[255,255,255],big:b.k==='c3'?1:0});
  if(b.knock&&!m.dying&&m.kind!=='boss'&&m.kind!=='pillar'){m.vx=Math.sign(b.vx||1)*420}
  if(b.brk&&!m.dying)m.brkU=Math.max(m.brkU||0,t+b.brk)}
function arFireBoom(x,y,mul,n,hitIds){const s=S0,t=s.t,F=AR.fire;s.fx.push({k:'ar_boom',x,y,t0:t,r:F.r});shake(7,0.2);s.hitstop=Math.max(s.hitstop,0.04);sfx('crit',0.4);
  puff(x,y-20,8,[60,50,50],60,0.7,4);for(let j=0;j<14;j++){const a=U(0,Math.PI*2),v=U(150,420);s.parts.push({x,y:y-40,vx:Math.cos(a)*v,vy:Math.sin(a)*v*0.6-120,g:700,life:0.5,t0:t,c:CH([[255,220,90],[255,150,40],[230,70,30]]),sz:CH([2,3]),drag:2})}
  const tg=s.mobs.filter(m=>arLive(m)&&Math.hypot((m.x-x)/(F.r+arBig(m)),(m.y-y)/(F.r*0.55+arBig(m)*0.4))<=1&&m.h<160);for(const m of tg){hitIds[m.id]=1;aHit(m,'slam','slam',mul,tg.length>=2)}
  if(n>0){const nx=s.mobs.filter(m=>arLive(m)&&m.kind!=='pillar'&&!hitIds[m.id]&&Math.hypot(m.x-x,m.y-y)<F.chR).sort((p,q)=>Math.hypot(p.x-x,p.y-y)-Math.hypot(q.x-x,q.y-y))[0];
    const tx=nx?nx.x:x+U(-160,160),ty=nx?nx.y:clamp(y+U(-40,40),YMIN,YMAX);setTimeout0(0.16,()=>arFireBoom(tx,ty,F.chMul,n-1,hitIds))}}
function arArrowsStep(dt){const s=S0,t=s.t;if(!s.arw)return;
  for(const b of s.arw){const age=t-b.t0;if(age>b.life){b.dead=1;if(b.k==='fi')arFireBoom(b.x,b.y,AR.fire.mul*(b.mk||1),AR.fire.chain,{});continue}
    b.x+=b.vx*dt;b.y+=(b.vy||0)*dt;b.h+=(b.vh||0)*dt;if(b.vy)b.y=clamp(b.y,YMIN-40,YMAX+40);
    if(b.h<=4&&b.vh<0){b.dead=1;s.fx.push({k:'ar_pop',x:b.x,y:b.y,h:4,t0:t,c:[230,220,200]});continue}
    for(const m of s.mobs){if(!arLive(m)||b.hit[m.id])continue;const big=arBig(m);const w=b.k==='dr'||b.k==='as'?60:b.k==='c3'?44:34;
      if(Math.abs(m.x-b.x)>w+big||Math.abs(m.y-b.y)>(b.k==='dr'||b.k==='as'?52:30)+big*0.4||b.h>m.h+190+big*2||b.h<m.h-30)continue;
      if(b.k==='fi'){b.dead=1;arFireBoom(m.x,m.y,AR.fire.mul*(b.mk||1),AR.fire.chain,{});break}
      arArrowHit(b,m);if(!b.pierce){b.dead=1;break}}
    if(!b.dead&&(b.k==='dr'||b.k==='as')&&Math.floor(age/0.03)!==Math.floor((age-dt)/0.03))s.parts.push({x:b.x-b.vx*0.02,y:b.y,vx:0,vy:-U(10,40),g:0,life:0.35,t0:t,c:CH([[150,220,255],[230,250,255],[120,170,255]]),sz:2,faint:true,hh:b.h})}
  s.arw=s.arw.filter(b=>!b.dead)}
// ---------- 地面區域：翼矛符文、箭雨、霧氣 ----------
function arZone(o){const s=S0;(s.arz=s.arz||[]).push(Object.assign({t0:s.t,n:0,hit:{}},o))}
function arInEll(m,x,y,rx,ry){const big=arBig(m);const dx=(m.x-x)/(rx+big),dy=(m.y-y)/(ry+big*0.4);return dx*dx+dy*dy<=1}
function arZonesStep(dt){const s=S0,t=s.t;if(!s.arz)return;const P=s.P;
  for(const z of s.arz){const age=t-z.t0;
    if(z.k==='rune'){const W=AR.wing;if(age>=W.delay&&!z.done){z.done=1;const tg=s.mobs.filter(m=>arLive(m)&&arInEll(m,z.x,z.y,W.rx,W.ry)&&m.h<200);
        for(const m of tg){aHit(m,'up','stomp',W.mul,tg.length>=2);if(!m.dying){m.brkU=Math.max(m.brkU||0,t+W.brk)}}
        if(tg.length){s.dmg.push({t,x:z.x,y:z.y-230,v:0,label:'破防',zero:true,lc:[255,90,120]});arRh(1)}
        shake(10,0.3);s.hitstop=Math.max(s.hitstop,0.06);sfx('clank',0.45);sfx('hit',0.45);
        for(let j=0;j<16;j++)s.parts.push({x:z.x+U(-W.rx,W.rx)*0.8,y:z.y-4,vx:U(-120,120),vy:-U(260,560),g:1500,life:0.7,t0:t,c:CH([[120,80,50],[170,120,70],[200,160,255]]),sz:CH([2,3]),floor:z.y+6})}
      if(age>1.1)z.dead=1;continue}
    if(z.k==='rain'){const R=AR.rain,w=R.w*(z.wk||1);const n=Math.min(R.n,Math.floor((age-0.3)/(R.dur/R.n))+1);
      while(age>=0.3&&z.n<n){z.n++;const tg=s.mobs.filter(m=>arLive(m)&&arInEll(m,z.x,z.y,w,R.ry)&&m.h<200);for(const m of tg)aHit(m,'n','stomp',R.mul,tg.length>=2);if(tg.length&&z.n%3===1)sfx('hit',0.25)}
      if(Math.floor(age/0.04)!==Math.floor((age-dt)/0.04)&&age<0.3+R.dur)(z.drops=z.drops||[]).push({x:z.x+U(-w,w),y:z.y+U(-R.ry,R.ry)*0.8,t0:t});
      if(age>=0.3+R.dur&&!z.mist){z.mist=1;arZone({k:'mist',x:z.x,y:z.y,wk:z.wk,dur:R.mist+(z.sp15?1:0),sp15:z.sp15})}
      if(age>0.3+R.dur+0.4)z.dead=1;continue}
    if(z.k==='mist'){const R=AR.rain,w=R.w*(z.wk||1);for(const m of s.mobs){if(!arLive(m)||!arInEll(m,z.x,z.y,w,R.ry))continue;if(m.kind!=='pillar'){m.slowU=Math.max(m.slowU||0,t+0.3);m.slowK=R.slow}m.mistU=t+0.3;m.mistSP=!!z.sp15}
      const n=Math.min(R.mistN,Math.floor(age/(z.dur/R.mistN)));while(z.n<n){z.n++;const tg=s.mobs.filter(m=>arLive(m)&&arInEll(m,z.x,z.y,w,R.ry)&&m.h<200);for(const m of tg)aHit(m,'n','stomp',R.mistMul,false)}
      if(age>z.dur)z.dead=1;continue}
    if(age>2)z.dead=1}
  s.arz=s.arz.filter(z=>!z.dead)}
// ---------- 動作 ----------
function aAct(type,dur,o){const P=S0.P;P.act=Object.assign({type,t:0,dur,hitAt:99,done:false,hitIds:{}},o||{});return P.act}
function arStartShot(stage){const s=S0,P=s.P,t=s.t,f=P.face,S=AR.shot;const sn=P.act&&P.act.type==='as';
  if(stage>=1){const k='c'+stage,mul=AR.chg.mul[stage-1];arShoot({k,x:P.x+60*f,y:P.y,vx:(1700+150*stage)*f,life:(S.rng+80*stage)/(1700+150*stage),pool:'chg',mv:stage===3?'slam':'n',mul:mul*0.5,pierce:stage===3?1:0,knock:stage===3?1:0,src:'p'});
    s.fx.push({k:'ar_muz',x:P.x+64*f,y:P.y,h:92,t0:t,f,c:[255,230,120],big:stage});if(stage===3){shake(5,0.15);s.callout={t0:t,txt:'尋心箭'};arDrg(DRG.skill)}return}
  const crit16=GS.sp==='SP16'&&P.sp16U>t;if(crit16){P.sp16U=0;P.sp16CD=t+4}
  const sp14=GS.sp==='SP14'&&(P.sp14n||0)>=20;if(sp14)P.sp14n=0;
  arShoot({k:sp14?'c2':'n',x:P.x+60*f,y:P.y,vx:S.v*f,life:S.rng/S.v,pool:'n',mv:'n',mul:S.mul*(sp14?2:1),knock:sp14?1:0,src:'p',crit:crit16});
  s.fx.push({k:'ar_muz',x:P.x+60*f,y:P.y,h:92,t0:t,f,c:[255,255,255]});if(GS.sp==='SP14')P.sp14n=(P.sp14n||0)+1}
function arStartWing(){const s=S0,P=s.P,t=s.t,W=AR.wing;P.wgCD=W.cd*arMvcd();const A=aAct('aw',0.5,{});let x=P.x+W.dist*P.face;const lo=s.lock?s.cam+40:30,hi=s.lock?s.cam+W_()-40:WW-30;x=clamp(x,lo,hi);
  arZone({k:'rune',x,y:P.y,f:P.face});A.zone=s.arz[s.arz.length-1];s.callout={t0:t,txt:'翼矛'};sfx('summon',0.3);arDrg(DRG.skill)}
const W_=()=>W;
function arStartRain(){const s=S0,P=s.P,t=s.t,R=AR.rain;P.rnCD=R.cd*arMvcd();aAct('ar',0.55,{});const sp15=GS.sp==='SP15';
  arZone({k:'rain',x:clamp(P.x+R.dist*P.face,30,WW-30),y:P.y,wk:sp15?1.3:1,sp15});s.callout={t0:t,txt:'箭雨'};
  arShoot({k:'sky',x:P.x+30*P.face,y:P.y,h:120,vx:120*P.face,vh:1800,life:0.3,src:'v',pierce:1,mul:0});arDrg(DRG.skill)}
function arStartFire(){const s=S0,P=s.P,t=s.t,F=AR.fire;P.fiCD=F.cd*arMvcd();aAct('afi',0.36,{hitAt:0.13});s.callout={t0:t,txt:'烈焰箭'};arDrg(DRG.skill)}
function arStartFlip(){const s=S0,P=s.P,t=s.t,F=AR.flip;P.flCD=F.cd*arMvcd();let n=F.n;if(P.rh>=F.cost){P.rh-=F.cost;n=F.n2}if(GS.sp==='SP16')n++;
  aAct('af',0.6,{n});P.flIF=t+F.iF;s.callout={t0:t,txt:n>=5?'後翻扇射 ×'+n:'後翻扇射'};sfx('jump',0.3);P.ghost=[];arDrg(DRG.skill)}
function arStartRoll(dir){const s=S0,P=s.P,t=s.t,R=AR.roll;P.rlCD=R.cd;aAct('aro',R.dur,{dir});P.rlI0=t+0.03;P.rlIF=t+0.28;P.ghost=[];sfx('jump',0.22);puff(P.x-20*dir,P.y-3,5,[214,170,128],22,0.35,2);
  if(GS.sp==='SP16'&&!(P.sp16CD>t))P.sp16U=t+2}
function arStartSnipe(){const s=S0,P=s.P,t=s.t,S=AR.snipe;P.rh-=S.cost;P.snCD=S.cd*arMvcd();aAct('as',S.dur+0.7,{ph:'in',pt:0,T:0,dn:0,nmax:S.n+(GS.sp==='SP17'?1:0),lastJ:-9,lastD:-9});
  s.callout={t0:t,txt:'狙擊模式'};sub('三杯兔子','……鎖定。',1.2);sfx('ready',0.4);s.fx.push({k:'ring',x:P.x,y:P.y,t0:t,col:[150,220,255],big:true})}
function arStartUlt(){const s=S0,P=s.P,t=s.t;P.dragon=0;aAct('au',AR.ult.dur,{ticks:0});P.ultIF=t+AR.ult.iF;s.callout={t0:t,txt:'穿天龍矢'};sub('三杯兔子','看招──！',1.4);sfx('summon',0.5);
  s.fx.push({k:'ar_pillar',x:P.x,y:P.y,t0:t})}
// 每 frame
function aStep(dt){const s=S0,P=s.P,t=s.t;if(P.wgCD==null){P.wgCD=0;P.rnCD=0;P.fiCD=0;P.flCD=0;P.rlCD=0;P.snCD=0;P.dragon=P.dragon||0}
  for(const k of ['wgCD','rnCD','fiCD','flCD','rlCD','snCD'])P[k]-=dt;
  const wantJump=IN.jump()||(AUTO&&AI.jump);
  if(P.dead||s.ritual||s.trans)return;
  if(m2Down()){if(!P.tech&&wantJump&&t-P.downT0<=0.25){P.tech=1;P.downU=t+0.35;P.invU=P.downU+0.5;P.techT=t;proc('受身',[150,200,255],'受');sfx('jump',0.3)}
    if(P.tech){const k=(t-P.techT)/0.35;P.x=clamp(P.x-P.face*340*(1-k)*dt,30,WW-30)}return}
  P.tech=0;
  let mx=(IN.r()?1:0)-(IN.l()?1:0),my=(IN.d()?1:0)-(IN.u()?1:0);if(AUTO){mx=AI.mx;my=AI.my}
  const jP=IN.atk()||(AUTO&&AI.atk),kP=IN.stab()||(AUTO&&AI.stab),lP=IN.skill()||(AUTO&&AI.skill),sumP=IN.sum()||(AUTO&&AI.sum);
  if(AUTO&&AI.atk)P.aiHoldU=t+(AI.hold||0.04);
  const jH=held(['KeyJ','KeyZ'])||!!GP.atk||(AUTO&&P.aiHoldU>t);
  const down=IN.d()||(AUTO&&AI.down);
  const dodgeP=press(['ShiftLeft','ShiftRight'])||GPP.dodge||(AUTO&&AI.dodge);
  if(jP)P.jT=t;if(kP)P.kT=t;if(lP)P.lT=t;
  const ultC=(AUTO&&AI.ult)||(kP&&t-(P.jT||-9)<0.12)||(jP&&t-(P.kT||-9)<0.12)||(kP&&jH&&t-(P.jT||-9)<0.25);
  const snC=(AUTO&&AI.snipe)||(kP&&t-(P.lT||-9)<0.12)||(lP&&t-(P.kT||-9)<0.12)||((kP||lP)&&held(['KeyK'])&&held(['KeyL']));
  if(sumP&&!s.ally&&!s.bard&&!s.arA){if(s.food>=FOOD_MAX&&t>(s.allyCD||0))m27Assist('archer');else if(t-s.hungryT>0.4){s.hungryT=t;sfx('clank',0.2)}}
  const a=P.act;const SN=a&&a.type==='as';
  const fresh=a&&a.t<0.12&&['ash','ach','aw','afi'].includes(a.type);
  const cancelOK=!a||(a.type==='ash'&&a.t>a.hitAt+0.08)||(a.type==='aa'&&a.done)||(a.type==='afi'&&a.done&&a.t>0.22)||(a.type==='aw'&&a.t>0.3)||(a.type==='ar'&&a.t>0.35);
  const ground=P.h<=0;
  if(SN){arSnipeIn(a,dt,jP,kP||lP,mx)}
  else if(ultC&&(P.dragon||0)>=DRG.max&&ground&&(!a||cancelOK||fresh||a.type==='ach')){if(fresh)arRefund(a);P.act=null;arStartUlt()}
  else if(ultC&&(kP||jP)&&(P.dragon||0)<DRG.max&&!AUTO&&kP&&t-(P.jT||-9)<0.12)s.denyU=t;
  else if(snC&&P.rh>=AR.snipe.cost&&P.snCD<=0&&ground&&(!a||cancelOK||fresh||a.type==='ach')){if(fresh)arRefund(a);P.act=null;arStartSnipe()}
  else if(snC&&!fresh&&(P.rh<AR.snipe.cost||P.snCD>0))s.denySn=t;
  else if(dodgeP&&ground&&P.rlCD<=0&&(!a||cancelOK||['ash','ach','aw','afi','ar'].includes(a.type))){arStartRoll(mx||P.face);if(mx)P.face=mx}
  else if(kP&&ground&&(!a||cancelOK||a.type==='ach')){if(down){if(P.rnCD<=0)arStartRain();else s.denyRn=t}else{if(P.wgCD<=0)arStartWing();else s.denyK=t}}
  else if(lP&&ground&&(!a||cancelOK||a.type==='ach')){if(down){if(P.flCD<=0)arStartFlip();else s.denyFl=t}else{if(P.fiCD<=0)arStartFire();else s.denyL=t}}
  else if(jP&&(!P.act||cancelOK)){if(P.h>20){if((P.airN||0)<AR.airMax){P.airN=(P.airN||0)+1;aAct('aa',0.2,{hitAt:0.05})}}else if(ground)aAct('ach',9,{})}
  else if(wantJump&&ground&&!P.act){P.vh=AR.jv;P.h=0.01;P.airN=0;sfx('jump',0.3)}
  const A=P.act;if(A&&A.type!=='as'){const u=['au','aro','af'].includes(A.type)?1:arSpd();A.t+=dt*(A.type==='ach'?1:u);arActStep(A,dt,mx,my,jH)}
  // 移動
  const B=P.act;const ox=P.x,oy=P.y;let mvk=0;
  if(!B)mvk=1;else if(B.type==='ash')mvk=AR.shot.mvk;else if(B.type==='ach')mvk=B.t<0.5?AR.shot.mvk:AR.chg.mvk;else if(B.type==='aa')mvk=1;
  if(mvk>0){const sp=(P.h>0?AR.air:AR.sp)*mvk*(1+(B?0:GS.ms||0));let vx=mx*sp,vy=my*AR.spy*mvk;if(mx&&my){vx*=0.85;vy*=0.85}if(Number.isFinite(vx))P.x+=vx*dt;if(Number.isFinite(vy))P.y+=vy*dt;
    if(mx&&(!B||B.type==='aa'||(B.type==='ash'&&B.t>B.hitAt)))P.face=mx>0?1:-1;else if(mx&&B&&B.type==='ach'&&B.t<0.1)P.face=mx>0?1:-1}
  const lo=s.lock?s.cam+40:30,hi=s.lock?s.cam+W-40:WW-30;P.x=clamp(P.x,lo,hi);P.y=clamp(P.y,YMIN,YMAX);
  P.kspd=Math.abs(P.x-ox)/dt;P.mspd=Math.hypot(P.x-ox,P.y-oy)/dt;
  const hover=B&&(B.type==='aa'||B.type==='af');
  if(!hover&&(P.h>0||P.vh>0)){P.h+=P.vh*dt;P.vh-=5104*dt;if(P.h<=0){P.h=0;P.vh=0;P.airN=0;P.landT=t;puff(P.x,P.y-3,4,[214,170,128],20,0.35,2)}}
  if(P.kspd>120&&P.h===0&&t-(P.lastdust||0)>0.1){P.lastdust=t;puff(P.x-25*P.face,P.y-3,3,[214,170,128],10,0.33,2)}
  if(P.act&&P.act.type==='ach'&&P.act.t>=0.5&&Math.floor(t/0.05)!==Math.floor((t-dt)/0.05)){const st=P.act.t>=1.5?3:P.act.t>=1.0?2:1;const an=U(0,Math.PI*2),r=U(60,100);
    s.parts.push({x:P.x+Math.cos(an)*r,y:P.y-80+Math.sin(an)*r*0.7,vx:-Math.cos(an)*r/0.25,vy:-Math.sin(an)*r*0.7/0.25,g:0,life:0.25,t0:t,c:st===3?[255,250,200]:[255,220,110],sz:st===3?2:1})}}
function arRefund(a){const s=S0,P=s.P;if(a.type==='aw'){P.wgCD=0;if(a.zone)a.zone.dead=1}if(a.type==='afi')P.fiCD=0;if(a.type!=='ach')P.dragon=Math.max(0,(P.dragon||0)-DRG.skill)}
function arActStep(A,dt,mx,my,jH){const s=S0,P=s.P,t=s.t,f=P.face;
  switch(A.type){
  case 'ach':{if(!jH||A.t>=6){const st=A.t>=1.5?3:A.t>=1.0?2:A.t>=0.5?1:0;arStartShot(st);if(st===3)s.hitstop=Math.max(s.hitstop,0.05);
      P.act=null;const B=aAct('ash',AR.shot.dur,{hitAt:AR.shot.hit,done:true,st});B.t=AR.shot.hit;}
    else{const st=A.t>=1.5?3:A.t>=1.0?2:A.t>=0.5?1:0;if(st>(A.st||0)){A.st=st;sfx('ready',0.18+0.06*st);if(st===3)proc('蓄力完成',[255,220,90],'蓄')}}break}
  case 'ash':if(A.t>=A.dur)P.act=null;break;
  case 'aa':P.vh=0;if(!A.done&&A.t>=A.hitAt){A.done=true;const an=30*Math.PI/180;arShoot({k:'n',x:P.x+40*f,y:P.y,h:P.h+80,vx:1300*Math.cos(an)*f,vh:-1300*Math.sin(an),life:0.6,pool:'air',mv:'n',mul:0.55,src:'p'});s.fx.push({k:'ar_muz',x:P.x+46*f,y:P.y,h:P.h+80,t0:t,f,c:[255,255,255]})}
    if(A.t>=A.dur){P.act=null;P.vh=-200}break;
  case 'aw':if(A.t>=A.dur)P.act=null;break;
  case 'ar':if(A.t>=A.dur)P.act=null;break;
  case 'afi':if(!A.done&&A.t>=A.hitAt){A.done=true;arShoot({k:'fi',x:P.x+60*f,y:P.y,vx:AR.fire.v*f,life:AR.fire.rng/AR.fire.v,src:'p'});s.fx.push({k:'ar_muz',x:P.x+60*f,y:P.y,h:92,t0:t,f,c:[255,150,60],big:2});sfx('wind',0.35)}
    if(A.t>=A.dur)P.act=null;break;
  case 'aro':{const u=A.t,d=A.dir,k=Math.min(1,u/AR.roll.dur);P.x+=d*AR.roll.dist/AR.roll.dur*1.6*Math.max(0,1-k)*dt*1.25;
    if(t-(P.lastG||0)>0.035){P.lastG=t;(P.ghost=P.ghost||[]).push({x:P.x,y:P.y,h:0,t,nm:'ar_'+arPose(P,t),f:P.face});if(P.ghost.length>6)P.ghost.shift()}
    if(u>=A.dur)P.act=null;break}
  case 'af':{const u=A.t,F=AR.flip,k=Math.min(1,u/0.45);if(u<0.45){P.x-=f*F.dist/0.45*1.5*(1-k)*dt*1.33;P.h=Math.sin(Math.PI*k)*120}else P.h=0;
    if(t-(P.lastG||0)>0.035&&u<0.45){P.lastG=t;(P.ghost=P.ghost||[]).push({x:P.x,y:P.y,h:P.h,t,nm:'ar_'+arPose(P,t),f:P.face});if(P.ghost.length>6)P.ghost.shift()}
    if(!A.done&&u>=0.24){A.done=true;const n=A.n;for(let i=0;i<n;i++){const sp=(i-(n-1)/2)/((n-1)/2||1);arShoot({k:'fa',x:P.x+40*f,y:P.y,h:P.h+70,vx:1400*f*Math.cos(sp*0.5),vy:520*sp,vh:-260,life:0.5,pool:'chg',mv:'n',mul:F.mul,src:'p'})}
      s.fx.push({k:'ar_muz',x:P.x+46*f,y:P.y,h:P.h+70,t0:t,f,c:[255,170,230],big:1})}
    if(u>=A.dur){P.act=null;P.h=0}break}
  case 'au':arUltStep(A,dt);break}}
// 狙擊模式：生根 8 秒、霸體；J＝強化普攻（+20% 傷害、+20% 射程）；K／L＝貫穿龍矢（第 3 發後退出）；時間到沒射完的龍矢作廢
function arSnipeIn(A,dt,jP,dP,mx){const s=S0,P=s.P,t=s.t,S=AR.snipe;A.t+=dt;
  if(mx&&A.ph!=='out')P.face=mx>0?1:-1;
  if(A.ph==='in'){A.pt+=dt;if(A.pt>=0.4){A.ph='hold';A.pt=0}return}
  if(A.ph==='out'){A.pt+=dt;if(A.pt>=0.3){P.act=null}return}
  A.T+=dt;A.pt+=dt;const f=P.face;
  if(A.ph==='shot'&&A.pt>=0.3){A.ph='hold';A.pt=0}
  if(A.T>=S.dur||(A.dn>=A.nmax&&A.ph==='hold')){if(A.T>=S.dur&&A.dn<A.nmax)proc('龍矢作廢 ×'+(A.nmax-A.dn),[150,150,170],'廢');A.ph='out';A.pt=0;return}
  const spd=arSpd();
  if(dP&&A.dn<A.nmax&&t-A.lastD>=S.drGap){A.lastD=t;A.dn++;A.ph='shot';A.pt=0;arShoot({k:'dr',x:P.x+70*f,y:P.y,h:78,vx:S.drV*f,life:S.drRng/S.drV,pool:'slam',mv:'n',mul:S.drMul,pierce:1,dr:1,src:'p'});
    s.fx.push({k:'ar_muz',x:P.x+70*f,y:P.y,h:78,t0:t,f,c:[150,220,255],big:3});shake(6,0.18);s.hitstop=Math.max(s.hitstop,0.04);sfx('crit',0.4);s.callout={t0:t,txt:'龍矢 '+A.dn+'/'+A.nmax}}
  else if(jP&&t-A.lastJ>=S.shotGap/spd){A.lastJ=t;if(A.ph!=='shot'){A.ph='shot';A.pt=0.12}arShoot({k:'sn',x:P.x+66*f,y:P.y,h:78,vx:AR.shot.v*1.2*f,life:AR.shot.rng*S.rm/(AR.shot.v*1.2),pool:'n',mv:'n',mul:AR.shot.mul*S.dm,src:'p'});
    s.fx.push({k:'ar_muz',x:P.x+66*f,y:P.y,h:78,t0:t,f,c:[200,240,255]})}}
// 絕招・穿天龍矢：紫光柱蓄力 0.5 → 巨大光束（6 段、破防）→ 最後一擊擊退 → 後座滑行 → 比 YA
function arUltStep(A,dt){const s=S0,P=s.P,t=s.t,f=P.face,U_=AR.ult,u=A.t;const wide=GS.sp==='SP17'?1.3:1;
  const lane=m=>arLive(m)&&(m.x-P.x)*f>-30&&(m.x-P.x)*f<U_.len+arBig(m)&&Math.abs(m.y-P.y)<U_.dy*wide+arBig(m)*0.6;
  if(u>=0.5&&!A.fired){A.fired=1;A.bx=P.x;A.by=P.y;A.bf=f;shake(12,0.5);s.hitstop=Math.max(s.hitstop,0.06);sfx('wind',0.55);sfx('crit',0.5)}
  if(A.fired){const n=Math.min(U_.ticks,Math.floor((u-0.5)/0.09)+1);while(A.ticks<n){A.ticks++;const tg=s.mobs.filter(lane);for(const m of tg){aHit(m,'n','slam',U_.tickMul,tg.length>=2,1);if(!m.dying)m.brkU=Math.max(m.brkU||0,t+U_.brk)}if(A.ticks===1&&tg.length)s.dmg.push({t,x:P.x+200*f,y:P.y-240,v:0,label:'破防',zero:true,lc:[255,90,120]})}
    if(u>=1.1&&!A.fin){A.fin=1;const tg=s.mobs.filter(lane);for(const m of tg)aHit(m,'wind','wind',U_.finMul,tg.length>=2,1);shake(14,0.4);s.hitstop=Math.max(s.hitstop,0.08);sfx('crit',0.55);sfx('clank',0.4)}}
  if(u>=1.1&&u<1.5){P.x=clamp(P.x-f*260*dt,30,WW-30);if(t-(P.lastG||0)>0.04){P.lastG=t;(P.ghost=P.ghost||[]).push({x:P.x,y:P.y,h:0,t,nm:'ar_ult2',f})}}
  if(u>=A.dur){P.act=null}}
// ---------- 受傷：×1.10、3 下倒地（戰意 4 下）、翻滾／後翻無敵、狙擊和絕招霸體 ----------
function aHurt(o,v,x){const s=S0,P=s.P,t=s.t;if(t<(P.invU||0))return 0;
  if(P.rlIF>t&&t>=(P.rlI0||0)){proc('翻滾閃避',[150,230,190],'閃');return 0}if(P.flIF>t)return 0;if(P.ultIF>t)return 0;
  const a=P.act;P.act=a||{type:'_'};let r;try{r=o(v,x)}finally{P.act=a}if(!r)return r;r=Math.round(r*BAL27.hurt);arDrg(DRG.hurt,DRG.hurtGap,'drgHurtT');
  const armor=a&&(a.type==='as'||a.type==='au');P.flashT=t+0.08;
  if(a&&a.type==='ach'){P.act=null}
  if(!armor){const d=(x!=null&&x>P.x)?-1:1;P.x=clamp(P.x+18*d,30,WW-30);P.hurtT=t;
    if(t-(P.lastHurt2||-9)>2.0)P.hc=0;P.hc=(P.hc||0)+1;P.lastHurt2=t;
    if(P.hc>=(P.zyU>t?4:3)){P.hc=0;if(GS.kdr&&rnd()<GS.kdr)proc('抗倒地',[200,160,90],'穩');
      else{P.downU=t+0.7;P.downT0=t;P.invU=P.downU+0.8;P.h=0;P.vh=0;P.act=null;proc('倒地',[110,110,130],'倒');if(GS.grit){const h=Math.round(HPMAX*GS.grit);P.hp=Math.min(HPMAX,P.hp+h);proc('根性 +'+h,[255,140,80],'根')}}}}
  if(P.ctrU>t&&P.hp>0){let n=0;for(const m of s.mobs){if(m.gone||m.dying||m.kind==='pillar'||m.kind==='boss')continue;if(Math.abs(m.x-P.x)<170&&Math.abs(m.y-P.y)<70){m.state='stun';m.stun=t+0.8;m.dizzy=t+0.8;m.vx=Math.sign(m.x-P.x||1)*420;n++}}
    if(n){s.fx.push({k:'ctr',x:P.x,y:P.y,t0:t});proc('反擊序曲',[255,120,60],'反');P.ctrU=0}}
  return r}
// ---------- 姿勢（84 張 ar_ 圖） ----------
function arPose(P,t){const s=S0,a=P.act;
  if(P.dead){const u=t-(P.deadT||t);return u<0.3?'ko0':u<0.6?'ko1':(Math.floor((u-0.6)/0.5)%2?'ko3':'ko2')}
  if(m2Down()){if(P.tech){const k=(t-P.techT)/0.35;return 'roll'+Math.min(5,1+Math.floor(k*5))}const u=t-(P.downT0||t),left=P.downU-t;if(u<0.12)return 'hurt1';if(left<0.3)return 'getup'+Math.min(2,Math.floor((0.3-left)/0.1));return 'ko1'}
  if(a){const u=a.t;switch(a.type){
    case 'ach':return u<0.5?'ch'+Math.min(2,Math.floor(u/0.17)):u<1.5?'ch'+(3+Math.floor(t/0.07)%4):'ch'+(7+Math.floor(t/0.05)%4);
    case 'ash':{const k=u/a.dur;return k<0.2?'shot1':k<0.45?'shot2':'shot3'}
    case 'aa':return u<a.hitAt?'flip2':'flip3';
    case 'aw':return u<0.18?'shot0':u<0.3?'up0':'up1';
    case 'ar':return u<0.14?'shot0':u<0.3?'up0':'up1';
    case 'afi':return u<a.hitAt?'shot1':u<0.2?'shot2':'shot3';
    case 'aro':{const k=u/a.dur;return 'roll'+Math.min(5,Math.floor(k*6))}
    case 'af':{const k=u/0.6;return u<0.06?'flip0':u<0.18?'flip1':u<0.24?'flip2':u<0.36?'flip3':u<0.45?'flip4':'roll5'}
    case 'as':{const A=a;if(A.ph==='in')return 'sn_in'+Math.min(4,Math.floor(A.pt/0.08));if(A.ph==='out')return 'sn_out'+Math.min(2,Math.floor(A.pt/0.1));
      if(A.ph==='shot')return 'sn_shot'+Math.min(4,Math.floor(A.pt/0.06));return 'sn_hold'+Math.floor(t/0.2)%4}
    case 'au':return u<0.5?'ult0':u<1.1?'ult1':u<1.6?'ult2':'ult3'}}
  if(P.hurtT&&t-P.hurtT<0.22)return t-P.hurtT<0.1?'hurt0':'hurt1';
  if(P.h>0)return P.vh>0?'jump1':'jump2';if(P.landT&&t-P.landT<0.08)return 'jump3';
  if(P.kspd>200)return 'run'+Math.floor(t/0.075)%8;if(P.kspd>20||P.mspd>40)return 'walk'+Math.floor(t/0.1)%8;return 'idle'+Math.floor(t/0.16)%6}
window.__ar={AR,DRG,BAL27,arPose,aHit};

// ---- src27/b_assist.js
// ===== M2.7 援助系統（3 人互相援助）＋三杯兔子的特效繪製、主角圖替換、AUTO =====
// SAVE.ast={kudas:'bard'|'archer', bard:'kudas'|'archer', archer:'kudas'|'bard'}；舊存檔沒有 → 用預設（等於舊版行為）
const AST_DEF={kudas:'bard',bard:'kudas',archer:'kudas'};
const AST_N={kudas:'苦達斯',bard:'尋歡作樂',archer:'三杯兔子'};
const AST_FX={kudas:'從天而降、臉著地噴出兩道特大斬風（左右各一）＋「戰意」：6 秒內被打 4 下才倒地',
  bard:'彈奏勇猛讚歌 12 秒：暴擊率大幅提升、攻擊速度 ×1.25',
  archer:'跪地連射 3 支貫穿龍矢（正前方一直線）＋「破殼標記」：8 秒內受到傷害 +12%'};
function astOf(h){h=h||HEROK;const a=SAVE&&SAVE.ast&&SAVE.ast[h];return a&&a!==h&&HERO[a]?a:AST_DEF[h]}
function astSet(h,a){if(!SAVE)return;SAVE.ast=Object.assign({},AST_DEF,SAVE.ast||{});if(a!==h&&HERO[a])SAVE.ast[h]=a}
// 召喚分流：原本的 V（苦達斯→詩人）、詩人的 V（→苦達斯）照舊，選了別人就換人
window.summonBard=(o=>function(){if(HEROK==='kudas'&&astOf('kudas')==='archer')return m27SummonArcher();return o.apply(this,arguments)})(window.summonBard);
window.m22SummonKudas=(o=>function(){if(HEROK==='bard'&&astOf('bard')==='archer')return m27SummonArcher();return o.apply(this,arguments)})(window.m22SummonKudas);
function m27Assist(h){const a=astOf(h);if(a==='bard')summonBard();else if(a==='kudas')m22SummonKudas();else m27SummonArcher()}
function m27SummonArcher(){const s=S0,P=s.P,t=s.t;let x=P.x-70*P.face;const lo=s.lock?s.cam+60:40,hi=s.lock?s.cam+W-60:WW-40;if(x<lo||x>hi)x=P.x;
  s.arA={x,y:P.y+4,t0:t,face:P.face,ev:{},n:0};s.food=0;sfx('summon',0.5);sub('三杯兔子','跟上囉～',1.0);s.fx.push({k:'ring',x,y:P.y,t0:t,col:[150,255,170],big:true})}
const ARA={drop:0.28,shots:[0.5,0.78,1.06],mul:0.4,out:1.35,end:1.7};
function arAssistStep(dt){const s=S0,t=s.t,A=s.arA;if(!A)return;const u=t-A.t0;
  if(u>=ARA.drop&&!A.ev.land){A.ev.land=1;puff(A.x,A.y-4,10,[200,240,190],60,0.5,3);shake(4,0.15);sfx('jump',0.3)}
  // 跟著主角的方向（只在開始射之前）
  if(u<ARA.shots[0]-0.05&&s.P)A.face=s.P.face;
  while(A.n<ARA.shots.length&&u>=ARA.shots[A.n]){A.n++;const f=A.face;arShoot({k:'as',x:A.x+70*f,y:A.y,h:78,vx:2300*f,life:1400/2300,pool:'kwind',mv:'n',mul:ARA.mul,pierce:1,src:'a'});
    s.fx.push({k:'ar_muz',x:A.x+70*f,y:A.y,h:78,t0:t,f,c:[200,170,255],big:3});shake(5,0.15);sfx('crit',0.35);if(A.n===1)s.callout={t0:t,txt:'援護龍矢 ×3'};A.shotT=t}
  if(u>=ARA.end){puff(A.x,A.y-120,10,[236,250,230],40,0.5,3);s.arA=null;s.allyCD=t+1}}
function arAssistDraw(SX,shy){const s=S0,t=s.t,A=s.arA;if(!A)return;const u=t-A.t0,sx=SX(A.x),sy=A.y+shy,f=A.face,fl=f<0;
  if(u<ARA.drop){const k=u/ARA.drop,h=420*(1-k*k);X.save();X.globalCompositeOperation='lighter';for(const [w,c,a] of [[40,[70,170,90],0.25],[22,[140,240,150],0.35],[8,[235,255,235],0.6]]){X.globalAlpha=a*(1-k*0.5);X.fillStyle=rgb(c);X.fillRect(Math.round(sx-w/2),0,w,Math.round(sy-h))}X.restore();
    shadowE(sx,sy,20+30*k,0);spr('ar_jump2',sx,sy-h,{flip:fl,__ally:1});return}
  shadowE(sx,sy,46,0);const gl=[150,255,170,Math.floor(60+30*Math.sin(t*10))];
  if(u<ARA.shots[0]-0.12){spr('ar_sn_in'+Math.min(4,Math.floor((u-ARA.drop)/0.05)),sx,sy,{flip:fl,__ally:1,glow:gl});return}
  if(u<ARA.out){const ps=t-(A.shotT||-9);spr(ps<0.24?'ar_sn_shot'+Math.min(4,Math.floor(ps/0.05)):'ar_sn_hold'+Math.floor(t/0.2)%4,sx,sy,{flip:fl,__ally:1,glow:gl});return}
  if(u<ARA.out+0.15){spr('ar_sn_out'+Math.min(2,Math.floor((u-ARA.out)/0.05)),sx,sy,{flip:fl,__ally:1});return}
  const k=(u-ARA.out-0.15)/(ARA.end-ARA.out-0.15);spr('ar_jump1',sx-f*k*200,sy-Math.sin(k*Math.PI*0.5)*380,{flip:fl,alpha:1-k*0.8,__ally:1})}
// ---------- 每 frame：箭、區域、援助 ----------
window.m2Step=(o=>dt=>{o(dt);const s=S0;if(!s)return;arArrowsStep(dt);arZonesStep(dt);arAssistStep(dt);
  if(isArcher()&&s.P){const P=s.P;if(P.food0!=null&&s.food>P.food0&&GS.sp==='SP14'){const h=Math.round(HPMAX*0.03);P.hp=Math.min(HPMAX,P.hp+h);s.heals.push({t:s.t,v:h})}P.food0=s.food}})(window.m2Step);
// ---------- 繪製 ----------
function arPx(sx,sy,ang,L,col,th,head,fl){X.save();X.translate(Math.round(sx),Math.round(sy));X.rotate(ang);const p=3;X.fillStyle='#1A1016';
  X.fillRect(-L-p,-th/2-p,L+p,th+2*p);X.fillRect(0,-p*3,p*3,p*6);X.fillStyle=rgb(col);X.fillRect(-L,-th/2,L,th);
  X.fillStyle=rgb(head||[230,230,240]);X.fillRect(0,-p*2,p,p*4);X.fillRect(p,-p,p,p*2);X.fillRect(p*2,-p/2,p,p);
  if(fl){X.fillStyle=rgb(fl);X.fillRect(-L,-p*2,p*3,p);X.fillRect(-L,p,p*3,p)}X.restore()}
function arDrawArrow(b,SX,shy){const s=S0,t=s.t,age=t-b.t0,sx=SX(b.x),sy=b.y-b.h+shy;const dx=b.vx,dy=(b.vy||0)-(b.vh||0),ang=Math.atan2(dy,dx),dir=Math.sign(b.vx||1);
  if(!isFinite(sx)||!isFinite(sy)||!isFinite(ang))return; // W2：位置算不出來（NaN）時不畫，避免 createLinearGradient 丟例外
  const tail=(len,col,a,w)=>{X.save();X.globalCompositeOperation='lighter';const g=X.createLinearGradient(sx,sy,sx-Math.cos(ang)*len,sy-Math.sin(ang)*len);g.addColorStop(0,rgb(col,a));g.addColorStop(1,rgb(col,0));X.strokeStyle=g;X.lineWidth=w;X.beginPath();X.moveTo(sx,sy);X.lineTo(sx-Math.cos(ang)*len,sy-Math.sin(ang)*len);X.stroke();X.restore()};
  switch(b.k){
  case 'n':case 'sn':tail(b.k==='sn'?200:130,b.k==='sn'?[170,230,255]:[255,255,255],0.7,4);arPx(sx,sy,ang,36,[240,240,250],3,null,[200,60,60]);break;
  case 'c1':case 'c2':case 'c3':{const st=+b.k[1];tail(160+60*st,[255,220,90],0.85,6+4*st);bloom(sx,sy,30+14*st,[255,230,120],0.45,0.6);
    for(let i=0;i<st+1;i++){const ph=t*30+i*2.1,yy=Math.sin(ph)*(8+3*st);X.fillStyle=rgb([255,250,200],0.8);X.fillRect(Math.round(sx-dir*(20+i*24)),Math.round(sy+yy),6,6)}
    arPx(sx,sy,ang,40+6*st,[255,240,170],3+st,[255,255,230],[255,200,80]);break}
  case 'dr':case 'as':{const C=b.k==='dr'?[[150,220,255],[230,250,255],[90,150,255]]:[[200,170,255],[245,235,255],[150,110,240]];
    bloom(sx-dir*60,sy,150,C[0],0.5,0.45);tail(420,C[0],0.9,26);tail(300,C[1],0.9,10);
    for(let i=0;i<26;i++){const q=i*18,ph=age*36-i*0.5;for(const sg of [1,-1]){const yy=Math.sin(ph)*24*sg,zz=Math.cos(ph)*sg;X.fillStyle=rgb(zz>0?C[1]:C[2],0.85*(1-i/26));X.fillRect(Math.round(sx-dir*q-3),Math.round(sy+yy-3),zz>0?7:5,zz>0?7:5)}}
    arPx(sx,sy,ang,70,C[1],9,[255,255,255],C[0]);break}
  case 'fi':bloom(sx,sy,60,[255,140,40],0.6,0.6);tail(220,[255,150,50],0.9,12);for(let i=0;i<5;i++){X.fillStyle=rgb(CH([[255,220,90],[255,120,30],[200,50,20]]),0.8);X.fillRect(Math.round(sx-dir*U(10,120)),Math.round(sy+U(-10,10)),6,6)}
    arPx(sx,sy,ang,44,[255,190,90],5,[255,240,200],[230,70,30]);break;
  case 'fa':tail(160,b.vy>0?[150,210,255]:[255,170,230],0.85,6);arPx(sx,sy,ang,36,[250,230,250],3,null,[255,140,200]);break;
  case 'sky':tail(220,[140,255,150],0.9,8);arPx(sx,sy,ang,40,[180,255,180],4,[240,255,240],[80,200,90]);break}}
function arDrawZone(z,SX,shy,ground){const s=S0,t=s.t,age=t-z.t0,sx=SX(z.x),sy=z.y+shy;
  if(z.k==='rune'){const W=AR.wing;if(ground){const k=Math.min(1,age/W.delay),a=age<0.8?1:Math.max(0,(1.1-age)/0.3);X.save();X.globalCompositeOperation='lighter';X.globalAlpha=a;
      for(const [r,c,w] of [[1,[170,90,255],5],[0.72,[220,170,255],3],[0.45,[150,70,230],3]]){X.strokeStyle=rgb(c);X.lineWidth=w;X.beginPath();X.ellipse(sx,sy,W.rx*r*k,W.ry*r*k,0,0,Math.PI*2);X.stroke()}
      for(let i=0;i<8;i++){const an=i*Math.PI/4+t*1.5;X.fillStyle=rgb([230,200,255]);X.fillRect(Math.round(sx+Math.cos(an)*W.rx*0.86*k-3),Math.round(sy+Math.sin(an)*W.ry*0.86*k-3),6,6)}X.restore();return}
    if(age<W.delay)return;const u=age-W.delay,g=Math.min(1,u/0.08),a=u<0.4?1:Math.max(0,1-(u-0.4)/0.3);if(a<=0)return;X.save();X.globalAlpha=a;
    for(let i=0;i<7;i++){const ox=(i-3)*W.rx/3.5,an=(i%2?1:-1)*(0.25+0.08*(i%3)),hh=(160+90*((i*37)%3))*g;X.save();X.translate(Math.round(sx+ox),Math.round(sy-(i%2)*10));X.rotate(an);
      X.fillStyle='#1A1016';X.fillRect(-12,-hh-6,24,hh+6);X.fillStyle=rgb([150,100,60]);X.fillRect(-9,-hh,18,hh);X.fillStyle=rgb([190,140,90]);X.fillRect(-9,-hh,6,hh);
      X.fillStyle=rgb([200,30,40]);X.fillRect(-6,-hh-3,12,20);X.fillStyle=rgb([255,90,90]);X.fillRect(-3,-hh-3,6,9);X.restore()}
    X.restore();if(u<0.15)bloom(sx,sy-80,160,[200,120,255],0.5*(1-u/0.15),0.7);return}
  if(z.k==='rain'){const R=AR.rain,w=R.w*(z.wk||1);if(ground){const a=age<0.3?age/0.3:1;X.save();X.globalCompositeOperation='lighter';X.globalAlpha=a*0.85;X.strokeStyle=rgb([120,255,140]);X.lineWidth=4;X.beginPath();X.ellipse(sx,sy,w,R.ry,0,0,Math.PI*2);X.stroke();
      X.globalAlpha=a*0.18;X.fillStyle=rgb([90,220,110]);X.beginPath();X.ellipse(sx,sy,w,R.ry,0,0,Math.PI*2);X.fill();X.restore();return}
    for(const d of z.drops||[]){const u=(t-d.t0)/0.25;if(u<0||u>1.3)continue;const dsx=SX(d.x),dsy=d.y+shy;if(u<1){const h=420*(1-u);X.save();X.globalCompositeOperation='lighter';X.strokeStyle=rgb([150,255,160],0.6);X.lineWidth=4;X.beginPath();X.moveTo(dsx,dsy-h-60);X.lineTo(dsx,dsy-h);X.stroke();X.restore();
        X.fillStyle='#1A1016';X.fillRect(Math.round(dsx-3),Math.round(dsy-h-6),6,15);X.fillStyle=rgb([200,255,200]);X.fillRect(Math.round(dsx-1.5),Math.round(dsy-h-4),3,12)}else{X.fillStyle=rgb([180,255,180],1-(u-1)/0.3);X.fillRect(Math.round(dsx-6),Math.round(dsy-3),12,3)}}
    z.drops=(z.drops||[]).filter(d=>t-d.t0<0.33);return}
  if(z.k==='mist'){if(!ground)return;const R=AR.rain,w=R.w*(z.wk||1),a=Math.min(1,age/0.3)*Math.min(1,(z.dur-age)/0.6);X.save();X.globalCompositeOperation='lighter';
    for(let i=0;i<9;i++){const ph=i*0.7+t*0.8,px=sx+Math.cos(ph*1.3+i)*w*0.7,py=sy+Math.sin(ph+i*2)*R.ry*0.6-10;bloom(px,py,46+10*Math.sin(t*2+i),[80,220,100],0.16*a,0.55)}
    for(let i=0;i<6;i++){const k=((t*0.9+i/6)%1);X.fillStyle=rgb([150,255,150],a*(1-k)*0.8);X.fillRect(Math.round(sx+Math.sin(i*2.3)*w*0.7),Math.round(sy-k*90),4,4)}X.restore()}}
function arDrawFx(SX,shy){const s=S0,t=s.t,P=s.P;
  for(const e of s.fx){const age=t-e.t0;if(age<0)continue;const sx=SX(e.x),sy=e.y-(e.h||0)+shy;
    if(e.k==='ar_pop'&&age<0.22){const k=age/0.22,r=(e.big?34:18)*(0.4+k);X.save();X.globalCompositeOperation='lighter';X.globalAlpha=1-k;X.fillStyle=rgb(e.c);
      for(let i=0;i<8;i++){const an=i*Math.PI/4;X.fillRect(Math.round(sx+Math.cos(an)*r-3),Math.round(sy+Math.sin(an)*r*0.8-3),i%2?4:7,i%2?4:7)}X.restore();if(e.big)bloom(sx,sy,60,e.c,0.5*(1-k),1)}
    else if(e.k==='ar_muz'&&age<0.12){const k=age/0.12;bloom(sx,sy,24+10*(e.big||0),e.c,0.7*(1-k),0.7);X.fillStyle=rgb([255,255,255],1-k);X.fillRect(Math.round(sx-4),Math.round(sy-4),8,8)}
    else if(e.k==='ar_boom'&&age<0.6){const k=age/0.6,r=e.r*(0.35+0.9*Math.sqrt(k));X.save();X.globalAlpha=Math.max(0,0.75*(1-k));X.fillStyle='rgb(40,30,30)';
      for(let i=0;i<7;i++){const an=i*0.9;X.beginPath();X.arc(sx+Math.cos(an)*r*0.5,sy-40-Math.sin(an)*r*0.3-k*40,r*0.42,0,Math.PI*2);X.fill()}X.restore();
      bloom(sx,sy-40,r*1.1,[255,150,40],0.9*(1-k),0.8);bloom(sx,sy-40,r*0.55,[255,240,160],1.0*(1-k),0.8)}
    else if(e.k==='ar_pillar'&&age<0.6){const k=age/0.6,a=age<0.45?1:(0.6-age)/0.15;X.save();X.globalCompositeOperation='lighter';
      for(const [w,c,al] of [[120,[150,80,230],0.35],[70,[210,160,255],0.5],[26,[255,245,255],0.85]]){X.globalAlpha=al*a;X.fillStyle=rgb(c);X.fillRect(Math.round(sx-w/2*(0.6+0.4*Math.sin(t*40))),0,Math.round(w*(0.6+0.4*Math.sin(t*40))),Math.round(sy))}X.restore()}}
  // 絕招光束
  if(P&&P.act&&P.act.type==='au'){const A=P.act,u=A.t;if(u<1.3){X.save();X.fillStyle=rgb([12,0,24],0.32*Math.min(1,u/0.2)*Math.min(1,(1.3-u)/0.2));X.fillRect(0,0,W,H);X.restore()}
    if(A.fired&&u<1.45){const k=(u-0.5)/0.95,f=A.bf,bx=SX(A.bx)+f*60,by=A.by-80+shy,L=AR.ult.len,wide=GS.sp==='SP17'?1.3:1,hh=(u<0.62?(u-0.5)/0.12:u>1.2?(1.45-u)/0.25:1)*130*wide*(1+0.06*Math.sin(t*60));
      X.save();X.globalCompositeOperation='lighter';const x0=f>0?bx:bx-L;
      for(const [m,c,al] of [[1,[140,60,230],0.45],[0.72,[170,140,255],0.6],[0.42,[230,210,255],0.8],[0.18,[255,255,255],1]]){X.globalAlpha=al;X.fillStyle=rgb(c);X.fillRect(Math.round(x0),Math.round(by-hh*m/2),L,Math.round(hh*m))}
      for(let i=0;i<24;i++){const q=((t*3+i/24)%1)*L,yy=Math.sin(i*7.1)*hh*0.45;X.globalAlpha=0.9;X.fillStyle=rgb(i%2?[255,255,255]:[200,170,255]);X.fillRect(Math.round(bx+f*q),Math.round(by+yy),12,4)}
      X.restore();bloom(bx,by,140*wide,[220,190,255],0.8*Math.max(0,1-k),0.9)}}
  // 狙擊瞄準線、蓄力量表
  if(P&&isArcher()&&inPlay()){const a=P.act;if(a&&a.type==='as'&&a.ph!=='out'){const f=P.face,x0=SX(P.x)+f*70,y0=P.y-78+shy,L=AR.snipe.drRng;X.save();X.globalCompositeOperation='lighter';X.globalAlpha=0.35+0.2*Math.sin(t*12);X.fillStyle=rgb([150,220,255]);X.fillRect(Math.round(f>0?x0:x0-L),Math.round(y0-1),L,3);X.restore()}
    if(a&&a.type==='ach'&&a.t>0.15){const k=Math.min(1,a.t/1.5),st=a.t>=1.5?3:a.t>=1.0?2:a.t>=0.5?1:0,x=SX(P.x),y=P.y-232+shy;arc(x,y,22,200,340,'rgba(40,30,20,0.8)',7);
      arc(x,y,22,200,200+140*k,st===3?(Math.floor(t*12)%2?'rgb(255,255,220)':'rgb(255,230,120)'):'rgb(255,210,80)',5);for(let i=1;i<=3;i++)circ(x-24+i*12,y+10,4,i<=st?'rgb(255,230,120)':'rgba(40,30,20,0.8)','rgb(26,16,22)',1)}}}
function arDrawGround(SX,shy){const s=S0;for(const z of s.arz||[])arDrawZone(z,SX,shy,true)}
window.m2Ents=(o=>(ents,SX,shy)=>{o(ents,SX,shy);const s=S0;if(s.arA)ents.push([s.arA.y,()=>arAssistDraw(SX,shy)]);if(s.arz&&s.arz.length)ents.push([YMIN-199,()=>arDrawGround(SX,shy)])})(window.m2Ents);
window.drawM2Fx=(o=>(SX,shy)=>{o(SX,shy);const s=S0;for(const z of s.arz||[])arDrawZone(z,SX,shy,false);for(const b of s.arw||[])arDrawArrow(b,SX,shy);arDrawFx(SX,shy)})(window.drawM2Fx);
// ---------- 主角圖：kudas_* → ar_*（440×300 HD，翻滾／後翻殘影） ----------
window.spr=(o=>(n,sx,sy,op={})=>{const s=S0;if(op.__ally||op.__g||!(isArcher()&&s&&s.P&&inPlay()&&typeof n==='string'&&n.startsWith('kudas_')))return o(n,sx,sy,op);
  const P=s.P,t=s.t;if(P.ghost&&P.ghost.length){for(const g of P.ghost){const k=1-(t-g.t)/0.24;if(k<=0)continue;o(g.nm,sx+(g.x-P.x),sy+(g.y-P.y)-((g.h||0)-P.h),{flip:g.f<0,alpha:0.34*k,filter:'brightness(1.5) saturate(0.6) hue-rotate(60deg)',__g:1})}P.ghost=P.ghost.filter(g=>t-g.t<0.24)}
  let nm='ar_'+arPose(P,t);if(!m21Has(nm))nm='ar_idle0';let gl=null;const a=P.act;
  if(a&&a.type==='ach'&&a.t>=0.5){const st=a.t>=1.5?3:a.t>=1.0?2:1;gl=st===3?[255,250,210,Math.floor(t*20)%2?230:170]:[255,220,110,Math.floor(90+40*st+30*Math.sin(t*10))]}
  else if(a&&a.type==='as')gl=[140,255,160,Math.floor(70+40*Math.sin(t*6))];else if(a&&a.type==='au')gl=[220,150,255,Math.floor(t*20)%2?220:140];
  else if(P.zyU>t)gl=[90,220,200,Math.floor(40+20*Math.sin(t*8))];else if(P.sp16U>t)gl=[255,240,150,Math.floor(50+30*Math.sin(t*10))];
  return o(nm,sx,sy,Object.assign({},op,{rot:0,dy:0,glow:gl}))})(window.spr);
// ---------- AUTO（測試、錄影用） ----------
window.aiThink=(o=>()=>{o();if(!isArcher())return;const s=S0,P=s.P,t=s.t;Object.assign(AI,{dodge:0,ult:0,snipe:0,down:0,hold:0.04});
  AI.sum=s.food>=FOOD_MAX&&!s.ally&&!s.bard&&!s.arA&&t>(s.allyCD||0)?1:0;
  const ms=s.mobs.filter(m=>!m.dying&&!m.gone&&m.kind!=='pillar'&&Math.abs(m.x-s.cam-640)<640);if(!ms.length||P.dead)return;
  const tg=ms.slice().sort((a,b)=>Math.abs(a.x-P.x)+2*Math.abs(a.y-P.y)-Math.abs(b.x-P.x)-2*Math.abs(b.y-P.y))[0];const dx=tg.x-P.x,dy=tg.y-P.y,adx=Math.abs(dx),sg=Math.sign(dx)||1,big=tg.kind==='boss'?120:0;
  const a=P.act;AI.jump=0;AI.atk=0;AI.stab=0;AI.skill=0;AI.my=Math.abs(dy)>18?Math.sign(dy):0;
  if(a&&a.type==='as'){AI.mx=P.face!==sg?sg:0;const inl=ms.filter(m=>Math.abs(m.y-P.y)<60+arBig(m)*0.4&&(m.x-P.x)*P.face>0).length;if(inl&&rnd()<0.5)AI.atk=1;if(inl>=1&&rnd()<0.06)AI.stab=1;return}
  if(a&&a.type==='ach'){AI.mx=0;AI.atk=0;AI.hold=P.aiHoldU>t?P.aiHoldU-t:0;return}
  const near=ms.filter(m=>Math.abs(m.x-P.x)<360&&Math.abs(m.y-P.y)<90).length;
  if((P.dragon||0)>=DRG.max&&near>=1&&Math.abs(dy)<60&&P.face===sg){AI.ult=1;return}
  if(P.rh>=AR.snipe.cost&&P.snCD<=0&&near>=2&&P.face===sg){AI.snipe=1;return}
  if(adx<150+big&&Math.abs(dy)<70){if(P.face===sg&&P.flCD<=0){AI.skill=1;AI.down=1;AI.mx=0;return}if(P.rlCD<=0){AI.dodge=1;AI.mx=-sg;return}}
  if(adx<240+big){AI.mx=-sg;if(P.x<s.cam+120||P.x>s.cam+W-120||P.x<80||P.x>WW-80)AI.mx=0;if(AI.mx)return}
  else if(adx>560+big)AI.mx=sg;else AI.mx=0;
  if(P.face!==sg){AI.mx=sg;return}
  if(Math.abs(dy)<40){const clus=ms.filter(m=>Math.abs(m.x-(P.x+300*P.face))<170&&Math.abs(m.y-P.y)<80).length;
    if(clus>=3&&P.rnCD<=0){AI.stab=1;AI.down=1;return}if(clus>=1&&P.wgCD<=0&&adx>200&&adx<380){AI.stab=1;return}if(P.fiCD<=0&&adx<650){AI.skill=1;return}
    if(!a&&rnd()<0.08){AI.atk=1;AI.hold=1.6;return}if(rnd()<0.6)AI.atk=1}})(window.aiThink);

// ---- src27/c_ui.js
// ===== M2.7 介面：3 人選角＋援助角色選擇、三杯兔子 HUD、說明頁、倒下文字；舊版相容存檔 =====
// ---------- 存檔相容：舊版 APK／PC 版（還不認識三杯兔子）讀到新存檔也不會壞 ----------
// 寫出去的存檔＝「停車」版：最上層永遠是苦達斯或詩人；三杯兔子的個人資料放 archerX，長弓 wc:'k'+wcX:'a'（舊版會當成大劍不會亂轉），
// 新版讀檔時（m21Migrate）再還原。只在寫出時轉換，遊戲中的 SAVE 不動。
function m27Park(S){if(!S||typeof S!=='object')return S;const o=JSON.parse(JSON.stringify(S));
  const pk=L=>{for(const it of L||[])if(it&&it.t==='w'&&it.wc==='a'){it.wc='k';it.wcX='a'}};
  if(o.hero==='archer'){const me={};for(const f of PERK)me[f]=o[f];const back=o.chars&&(o.chars.kudas?'kudas':o.chars.bard?'bard':null);
    if(back){const b=o.chars[back];for(const f of PERK)o[f]=b[f];delete o.chars[back];o.hero=back;o.heroX='archer';o.archerX=me}}
  else if(o.chars&&o.chars.archer){o.archerX=o.chars.archer;delete o.chars.archer;delete o.heroX}
  pk(o.inv);pk(o.wh);if(o.chars)for(const k in o.chars)pk(o.chars[k]&&o.chars[k].inv);pk(o.archerX&&o.archerX.inv);return o}
function m27Unpark(S){if(!S||typeof S!=='object')return S;
  const un=(L,keep)=>{for(const it of L||[])if(it&&it.wcX==='a'){if(keep)it.wc='a';delete it.wcX}};
  if(S.archerX&&typeof S.archerX==='object'){S.chars=S.chars||{};un(S.archerX.inv,true);S.chars.archer=S.archerX;m22FixChar(S,S.chars.archer,'archer')}delete S.archerX;
  un(S.wh,true);un(S.inv,false);if(S.chars)for(const k in S.chars)if(k!=='archer')un(S.chars[k]&&S.chars[k].inv,false);
  if(S.heroX==='archer'&&S.chars&&S.chars.archer&&S.hero!=='archer'){const cur={};for(const f of PERK)cur[f]=S[f];S.chars[S.hero]=cur;const nx=S.chars.archer;for(const f of PERK)S[f]=nx[f];delete S.chars.archer;S.hero='archer'}
  delete S.heroX;if(!S.ast||typeof S.ast!=='object')S.ast=Object.assign({},AST_DEF);for(const k in AST_DEF)if(!HERO[S.ast[k]]||S.ast[k]===k)S.ast[k]=AST_DEF[k];
  if(S===SAVE||!SAVE){HEROK=S.hero;m22ApplyHero()}else{HEROK=S.hero;m22ApplyHero()}return S}
window.m21Migrate=(o=>S=>{o(S);try{m27Unpark(S)}catch(e){console.warn('m27Unpark',e)}return S})(window.m21Migrate);
window.m2Save=(o=>function(){if(!SAVE)return o.apply(this,arguments);const real=SAVE;let P_;try{P_=m27Park(real)}catch(e){return o.apply(this,arguments)}SAVE=P_;try{return o.apply(this,arguments)}finally{const ts=SAVE.ts;SAVE=real;if(ts)real.ts=ts}})(window.m2Save);
// ---------- 選角：3 張卡＋每張卡下面選援助角色 ----------
CHS.ks.push('archer');
CHINFO.archer={col:[90,170,90],tag:['邊走邊射、拉開距離的長弓兵','比較脆：被打 3 下就倒地；翻滾、後翻有無敵','J 射擊（按住蓄力 3 段）・K 翼矛・L 烈焰箭','↓K 箭雨・↓L 後翻扇射・K+L 狙擊・J+K 絕招'],
  poses:['ar_idle0','ar_idle2','ar_shot1','ar_shot3','ar_ch3','ar_ch8','ar_sn_hold0','ar_ult1','ar_ult3']};
const CHS3={t0:0};
const porImg=k=>k==='kudas'?IMG.por:k==='bard'?IMG.bardpor:IMG.archerpor;
function drawPor(k,x,y,z,on,dim){const im=porImg(k);X.save();X.imageSmoothingEnabled=false;if(dim)X.globalAlpha=0.45;rrect(x-2,y-2,x+z+2,y+z+2,6,on?'rgba(60,40,20,0.95)':'rgba(16,12,10,0.9)',on?'rgb(255,226,140)':'rgba(150,120,70,0.7)',on?3:1);
  if(im&&im.width)X.drawImage(im,x,y,z,z);X.restore()}
function drawChsel3(){const t=performance.now()/1000,age=(performance.now()-CHS.t0)/1000;X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.5;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
  X.fillStyle='rgba(10,6,4,0.5)';X.fillRect(0,0,W,H);
  T('選擇角色',640,48,FS(40),[255,236,200],4,[60,20,10],'mm');T('裝備、背包、強化、關卡進度、等級各自獨立；金幣與旅店倉庫共用',640,88,FN(15),[230,214,180],2,[0,0,0],'mm');
  const n=CHS.ks.length;CHS.ks.forEach((k,i)=>{const cx=230+i*410,x0=cx-195,x1=cx+195,y0=112,y1=620,sel=CHS.sel===i,I=CHINFO[k],H_=HERO[k];const hov=MOUSE&&inBox(MOUSE,[x0,y0,x1,y1]);
    rrect(x0,y0,x1,y1,16,sel?'rgba(40,24,16,0.95)':'rgba(20,14,12,0.86)',sel?'rgb(255,226,140)':hov?'rgb(214,172,84)':'rgba(150,120,70,0.7)',sel?4:2);
    if(sel){X.save();X.globalAlpha=0.18+0.08*Math.sin(t*4);X.fillStyle=rgb(I.col);X.fillRect(x0+8,y0+8,x1-x0-16,232);X.restore()}
    X.save();X.fillStyle='rgba(0,0,0,0.35)';X.beginPath();X.ellipse(cx,y0+222,90,13,0,0,Math.PI*2);X.fill();X.restore();
    const ph=sel?I.poses[Math.floor(t/0.32)%I.poses.length]:I.poses[Math.floor(t/0.4)%2];const nm=(ph.startsWith('kudas')||m21Has(ph))?ph:I.poses[0];
    spr(nm,cx-10,y0+226,{sc:k==='archer'?1.0:1.05,glow:sel?[255,236,160,Math.floor(150+80*Math.sin(t*6))]:null,alpha:sel?1:0.75});
    if(k==='archer'&&!SAVE.seenAr){rrect(x1-74,y0+10,x1-12,y0+36,8,'rgb(220,60,60)','rgb(255,230,200)',2);T('NEW',x1-43,y0+23,FN(14),[255,255,255],2,[60,0,0],'mm')}
    T(H_.n,cx,y0+256,FS(30),sel?[255,244,214]:[210,200,190],3,[0,0,0],'mm');T(H_.job+`　HP ${H_.hp.toLocaleString('en-US')}`,cx,y0+288,FN(16),[255,214,140],2,[0,0,0],'mm');
    I.tag.forEach((l,j)=>T(l,cx,y0+316+j*21,FN(13),j?[220,212,200]:[255,236,190],2,[0,0,0],'mm'));
    const p=m22Prog(k);const wn=p.w?itName(p.w)+(p.c.slot&&p.c.slot.e?' +'+p.c.slot.e:''):'（沒有武器）';
    rrect(x0+14,y0+398,x1-14,y0+426,8,'rgba(0,0,0,0.45)','rgba(214,172,84,0.5)',1);T(`Lv.${p.c.lv||1}　通關 ${p.n}/${NST}　${wn}`,cx,y0+412,FN(13),[255,255,255],2,[0,0,0],'mm');
    // 援助角色（V 召喚）
    const a=astOf(k),opts=CHS.ks.filter(q=>q!==k);T('援助（V）',x0+18,y0+452,FS(15),[170,240,150],2,[0,0,0],'lm');
    opts.forEach((q,j)=>{const px=x0+118+j*130,py=y0+436,on=a===q;drawPor(q,px,py,32,on,!on);T(AST_N[q],px+40,py+16,FN(13),on?[255,244,214]:[160,150,140],2,[0,0,0],'lm');
      if(CLICK&&inBox(CLICK,[px-4,py-4,px+122,py+36])){astSet(k,q);CLICK=null;sfx('coin',0.3);m2Save()}});
    for(const [j,l] of wrapT(AST_FX[a],FN(12),356).slice(0,2).entries())T(l,cx,y0+484+j*16,FN(12),[200,230,190],2,[0,0,0],'mm');
    if(CLICK&&inBox(CLICK,[x0,y0,x1,y1])){if(CHS.sel===i)m22Pick(k);else{CHS.sel=i;sfx('coin',0.3)}}});
  T(`金幣（共用）${SAVE.gold.toLocaleString('en-US')}　倉庫 ${SAVE.wh.length}/${WH_MAX}`,640,648,FN(17),[255,226,120],2,[0,0,0],'mm');
  T('←→ 選角色　↑↓ 換援助角色　Enter 進入任務旅店　Esc 回封面',640,688,FN(16),[200,190,170],2,[0,0,0],'mm');
  if(mode!=='chsel')return;
  if(AUTO&&!window.__autoStop){if(age>0.8){const q=Q.get('hero');const k=q&&HERO[q]?q:(window.__autoHero||'kudas');if(Q.get('ast'))astSet(k,Q.get('ast'));m22Pick(k)}return}
  if(press(['ArrowLeft','KeyA'])||GPP.l){CHS.sel=(CHS.sel+n-1)%n;sfx('coin',0.25)}if(press(['ArrowRight','KeyD'])||GPP.r){CHS.sel=(CHS.sel+1)%n;sfx('coin',0.25)}
  if(press(['ArrowUp','KeyW','ArrowDown','KeyS'])||GPP.u||GPP.d){const k=CHS.ks[CHS.sel],o=CHS.ks.filter(q=>q!==k);astSet(k,o[(o.indexOf(astOf(k))+1)%o.length]);sfx('coin',0.3);m2Save()}
  if(IN.start()||press(['KeyJ','Space'])||GPP.jump)m22Pick(CHS.ks[CHS.sel]);
  else if(IN.esc()){mode='title';titleT=0;titleMus=false;window.__holdTitle=true}}
window.m2Frame=(o=>el=>{if(mode==='chsel'){drawChsel3();return true}return o(el)})(window.m2Frame);
window.m22Pick=(o=>k=>{if(k==='archer'&&SAVE&&!SAVE.seenAr)SAVE.seenAr=1;return o(k)})(window.m22Pick);
// ---------- HUD ----------
const ARMAP={'苦達斯':'三杯兔子','苦達斯倒下了……':'三杯兔子倒下了……','節奏':'集中',
  '方向鍵/WASD 移動　J 攻擊　K 心臟刺擊　L 大劍術　Space 跳躍　V 召喚詩人　E 互動　I 背包（暫停）　Esc 暫停':'J 射擊（按住蓄力）　K 翼矛　L 烈焰箭　↓K 箭雨　↓L 後翻扇射　Shift 翻滾　K+L 狙擊　J+K 絕招　V 援助'};
let AR_TXT=false;
window.T=(o=>function(s,...r){if(AR_TXT&&typeof s==='string'&&ARMAP[s])s=ARMAP[s];return o(s,...r)})(window.T);
const cdF=(cd,mx)=>Math.max(0,Math.min(1,cd/(mx*arMvcd())));
window.skillTile=(o=>(cx,cy,R,g,col,key,cost,dim,deny,cdFrac,name)=>{if(AR_TXT){const P=S0.P;
    if(g==='攻'){g='射';col=[70,150,80];cost=''}
    else if(g==='刺'){g='翼';col=[140,70,200];cost='';dim=P.wgCD>0;deny=S0.denyK||-9;cdFrac=cdF(P.wgCD,AR.wing.cd)}
    else if(g==='風'||g==='掃'){g='焰';col=[210,90,30];cost='';dim=P.fiCD>0;deny=S0.denyL||-9;cdFrac=cdF(P.fiCD,AR.fire.cd)}}
  return o(cx,cy,R,g,col,key,cost,dim,deny,cdFrac,name)})(window.skillTile);
function fakeBadge(s,src){if(src)s.bard={t0:src.t0,out:src.t0+1.7,buffT:1e9,in:1e9,x:-9999,y:0}}
window.drawHUD=(o=>(cx0,shy)=>{const s=S0,P=s&&s.P;if(!P)return o(cx0,shy);const t=s.t;
  if(HEROK==='kudas'){if(astOf('kudas')!=='archer')return o(cx0,shy);const sv=[IMG.bardh,IMG.bardg,s.bard];IMG.bardh=IMG.archerh;IMG.bardg=IMG.archerg;fakeBadge(s,s.arA);try{return o(cx0,shy)}finally{IMG.bardh=sv[0];IMG.bardg=sv[1];s.bard=sv[2]}}
  if(HEROK==='bard'){if(astOf('bard')!=='archer')return o(cx0,shy);const sv=[IMG.kudash,IMG.kudasg,s.ally];IMG.kudash=IMG.archerh;IMG.kudasg=IMG.archerg;if(s.arA)s.ally={t0:s.arA.t0};try{return o(cx0,shy)}finally{IMG.kudash=sv[0];IMG.kudasg=sv[1];s.ally=sv[2]}}
  if(!isArcher())return o(cx0,shy);const a=astOf('archer');
  const sv=[IMG.por,IMG.bardh,IMG.bardg,s.bard];IMG.por=IMG.archerpor;if(a==='kudas'){IMG.bardh=IMG.kudash;IMG.bardg=IMG.kudasg;fakeBadge(s,s.ally)}AR_TXT=true;
  try{o(cx0,shy)}finally{IMG.por=sv[0];IMG.bardh=sv[1];IMG.bardg=sv[2];s.bard=sv[3];AR_TXT=false}
  const tile=(x,y,r,l,k,cd,mx,col,deny)=>{const rdy=cd<=0;circ(x,y,r,rdy?rgb(col.map(v=>v*0.45|0),0.92):'rgba(30,24,20,0.85)',rdy?rgb(col.map(v=>Math.min(255,v+90))):'rgb(120,100,80)',3);
    if(!rdy){X.save();X.beginPath();X.moveTo(x,y);X.arc(x,y,r-3,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,cd/mx));X.closePath();X.fillStyle='rgba(0,0,0,0.55)';X.fill();X.restore()}
    const dn=t-(deny||-9)<0.35;T(l,x+(dn?Math.round(4*Math.sin(t*70)):0),y-1,FS(15),rdy?[255,244,214]:[170,160,150],2,[0,0,0],'mm');T(k,x,y+r+6,FN(11),[220,210,190],2,[0,0,0],'mm')};
  tile(810,604,24,'翻滾','Shift',P.rlCD||0,AR.roll.cd,[80,160,200]);tile(748,604,24,'扇射','↓L',P.flCD||0,AR.flip.cd*arMvcd(),[220,120,190],s.denyFl);tile(686,604,24,'箭雨','↓K',P.rnCD||0,AR.rain.cd*arMvcd(),[80,200,90],s.denyRn);
  {const sn=P.act&&P.act.type==='as',cd=Math.max(0,P.snCD||0),mx=AR.snipe.cd*arMvcd();skillTile(1070,524,22,'狙',[60,140,200],'K+L',sn?'狙擊中':'集中5',!sn&&(P.rh<AR.snipe.cost||cd>0),s.denySn||-9,cd>0?cd/mx:0,null);
   if(!sn&&cd<=0&&P.rh>=AR.snipe.cost)arc(1070,524,25,-90,270,Math.floor(t*6)%2?'rgb(170,230,255)':'rgb(110,190,240)',3)}
  {const u=Math.min(1,(P.dragon||0)/DRG.max);skillTile(994,524,22,'龍',[140,70,210],'J+K',u>=1?'龍矢滿':'龍矢'+Math.floor(u*100)+'%',u<1,s.denyU||-9,1-u,null);
   if(u>=1)arc(994,524,25,-90,270,Math.floor(t*6)%2?'rgb(233,160,255)':'rgb(190,110,240)',3);else if(u>0)arc(994,524,25,-90,-90+360*u,'rgb(170,100,230)',3)}
  // 狙擊模式：剩餘時間＋龍矢
  {const A=P.act;if(A&&A.type==='as'){const left=Math.max(0,AR.snipe.dur-A.T),x=640,y=150;rrect(x-150,y-22,x+150,y+26,10,'rgba(10,20,30,0.82)','rgb(150,220,255)',2);
    T('狙擊模式',x-136,y-6,FS(16),[200,240,255],2,[0,0,0],'lm');X.fillStyle='rgba(60,80,100,0.9)';X.fillRect(x-136,y+8,200,8);X.fillStyle='rgb(150,220,255)';X.fillRect(x-136,y+8,Math.round(200*left/AR.snipe.dur),8);
    T(left.toFixed(1)+'s',x+4,y-6,FN(13),[255,255,255],2,[0,0,0],'lm');for(let i=0;i<A.nmax;i++){const on=i>=A.dn;circ(x+86+i*20,y+2,7,on?'rgb(150,220,255)':'rgba(40,50,60,0.9)','rgb(20,30,40)',2)}}}
  let bx=124;const bf=[];if(P.zyU>t)bf.push(['戰',[40,150,140],P.zyU]);if(P.ctrU>t)bf.push(['反',[200,90,40],P.ctrU]);if(P.sp16U>t)bf.push(['風',[200,170,40],P.sp16U]);
  for(const [g,col,u] of bf){rrect(bx,160,bx+24,184,5,rgb(col),'rgb(255,240,220)',2);T(g,bx+12,172,FS(15),[255,255,255],2,[10,20,50],'mm');T(Math.ceil(u-t)+'',bx+23,186,FN(10),[255,255,255],2,[0,0,0],'rb');bx+=30}})(window.drawHUD);
window.drawDead=(o=>(...a)=>{AR_TXT=isArcher();try{return o(...a)}finally{AR_TXT=false}})(window.drawDead);
// ---------- 說明頁：Tab／←→ 在 3 個角色之間切換 ----------
MAN.q=0;
window.drawManual=(o=>()=>{const ks=['Tab','ArrowRight','ArrowLeft'],hit=ks.filter(k=>KP[k]);if(hit.length){MAN.q=(MAN.q+(KP.ArrowLeft&&!KP.Tab&&!KP.ArrowRight?2:1))%3}
  const sv={};for(const k of ks){sv[k]=KP[k];KP[k]=false}MAN.p=MAN.q===1?1:0;
  try{if(MAN.q<2){o();rrect(380,650,900,686,8,'rgba(16,10,8,0.95)');T(`（${MAN.q+1}/3）Tab／←→：換角色　　Esc / Enter 回標題`,640,668,FS(17),[255,255,255],3,[0,0,0],'mm');if(MAN.q===0){X.fillStyle='rgba(16,10,8,1)';X.fillRect(900,48,272,32);T('Tab／←→：換角色（1/3）',1160,64,FN(14),[255,210,140],2,[0,0,0],'rm')}return}
    X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.35;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
    rrect(100,26,1180,700,14,'rgba(16,10,8,0.92)',rgb(GOLDC),3);T('操作說明・三杯兔子（長弓兵）',640,64,FS(30),[255,236,200],4,[60,20,10],'mm');
    const rows=[['射擊','J：邊走邊射（移動中也能射）；空中 J＝往斜下射（最多 2 發）；打中累積「集中」'],['蓄力射擊','按住 J：0.5／1.0／1.5 秒三段（白→金光），放開射出；第 3 段「尋心箭」貫穿＋擊退、集中 +1'],
      ['翼矛','K：前方地面紫色符文，0.35 秒後木樁爆出：擊飛＋「破防」（5 秒內受到傷害 +10%）。冷卻 8 秒'],['箭雨','↓+K：前方綠色區域落箭 2 秒（8 段），之後留下綠霧 4 秒：緩速＋持續傷害。冷卻 12 秒'],
      ['烈焰箭','L：橘色火箭，打中爆炸，再往附近敵人連鎖爆炸 2 次。冷卻 10 秒'],['後翻扇射','↓+L：往後翻（無敵），在空中射出 3 支扇形箭；集中 ≥2 時消耗 2 → 5 支。冷卻 7 秒'],
      ['翻滾','Shift：往移動方向翻滾，有無敵時間，可接任何攻擊。冷卻 1 秒'],['狙擊模式','K+L：集中 5 全部用掉，跪地 8 秒（不能移動、不會被打斷、←→ 轉向）。J＝普攻傷害、射程 +20%；K 或 L＝貫穿龍矢，射完 3 發結束；時間到沒射的龍矢作廢。冷卻 18 秒'],
      ['穿天龍矢','J+K：龍矢量表滿（打中、用技能、挨打都會累積），紫白光柱＋巨大光束：6 段＋最後一擊擊退、破防 8 秒，放招中無敵'],
      ['援助（V）','食物 3/3：選角畫面設定的援助角色（苦達斯：兩道特大斬風＋戰意／尋歡作樂：勇猛讚歌 12 秒）'],['比較脆','HP 3,000、被打 3 下就倒地；倒地瞬間按 Space＝受身翻起。E 互動　I 背包　Esc 暫停']];
    rows.forEach(([a,b],i)=>{const y=114+i*48;T(a,150,y,FS(17),[255,244,214],2,[0,0,0],'lm');for(const [j,l] of wrapT(b,FN(15),820).entries())T(l,310,y+j*18,FN(15),[235,230,220],2,[0,0,0],'lm')});
    T('（3/3）Tab／←→：換角色　　Esc / Enter 回標題',640,676,FS(18),[255,255,255],3,[0,0,0],'mm')}
  finally{for(const k of ks)KP[k]=sv[k]}})(window.drawManual);
window.__m27={park:m27Park,unpark:m27Unpark,astOf,astSet};

// ---- src27/d_ko.js
// ---------- W2 力竭（KO）動畫 ----------
// 苦達斯 48 格、詩人 46 格（chars/ko/，20 fps）：前段（受擊→倒下）播一次，尾段循環（倒地喘氣）。
// 三杯兔子：ar_ko0–3 ＋程式畫的搞笑特效（屁股著地揚塵 → 天上掉紅蘿蔔「咚！」→ 頭上繞星星 → 兔子靈魂飄出去又被拉回來）。
// 時間用「真實時間」：死亡畫面（mode='dead'）遊戲時間會停，動畫照樣要動。變身中照舊用變身的倒地圖。
const KO_DEF={kudas:{pre:'kudas_ko',n:48,intro:32},bard:{pre:'bh_ko',n:46,intro:30}};
const KO_FPS=20;
const koNow=()=>{const F=window.__fx;return (F&&F.on?F.ts:performance.now())/1000};
const koTf=()=>{try{return !!(SAVE&&SAVE.tf)}catch(e){return false}};
function koU(P){if(P.koRT==null)P.koRT=koNow();return Math.max(0,koNow()-P.koRT)}
function koIdx(P){const D=KO_DEF[HEROK];if(!D)return -1;let i=Math.floor(koU(P)*KO_FPS);if(i>=D.n)i=D.intro+((i-D.intro)%(D.n-D.intro));return i}
function koReady(){const D=KO_DEF[HEROK];return !!D&&m21Has(D.pre+'00')&&m21Has(D.pre+String(D.n-1).padStart(2,'0'))}
// 主角姿勢：苦達斯（game.js poseOf）、詩人（bPose）、弓兵（arPose）
window.poseOf=(o=>P=>{if(!P||!P.dead){if(P)P.koRT=null;return o(P)}if(koTf())return o(P);
  if(HEROK==='archer')return 'ko_ar';const i=koIdx(P);return i>=0&&koReady()?'ko'+String(i).padStart(2,'0'):o(P)})(window.poseOf);
window.bPose=(o=>(P,t)=>{if(P&&P.dead&&!koTf()&&koReady()){const i=koIdx(P);if(i>=0)return 'ko'+String(i).padStart(2,'0')}return o(P,t)})(window.bPose);
window.arPose=(o=>(P,t)=>{if(!P||!P.dead)return o(P,t);const u=koU(P);return u<0.25?'ko0':u<0.55?'ko1':(Math.floor((u-0.55)/0.4)%2?'ko3':'ko2')})(window.arPose);
// 死亡畫面晚一點出來：讓倒下的前段播完（原本 1.2 秒）
window.koHold=()=>{if(koTf())return 1.2;if(HEROK==='archer')return 1.7;const D=KO_DEF[HEROK];return D&&koReady()?D.intro/KO_FPS+0.3:1.2};
// 最外層：KO 圖不要閃爍、不要轉 90 度；弓兵另外畫搞笑特效
window.spr=(o=>(n,sx,sy,op={})=>{if(typeof n!=='string'||!/^kudas_ko/.test(n)||op.__g||op.__ally)return o(n,sx,sy,op);
  const r=o(n,sx,sy,Object.assign({},op,{rot:0,alpha:1}));try{if(HEROK==='archer'&&S0&&S0.P&&S0.P.dead)koArFx(S0.P,sx,sy,op.flip?-1:1)}catch(e){}return r})(window.spr);
// ---------- 弓兵搞笑特效（畫面座標；HD 圖 1:1，腳底 sy，坐姿頭頂約 sy-108） ----------
function koPx(x,y,w,h,c,a){X.globalAlpha=a==null?1:a;X.fillStyle=c;X.fillRect(Math.round(x),Math.round(y),w,h)}
const KO_OL='rgb(26,16,22)';   // W2：力竭小道具也有 2px 深色外框（跟角色線條一樣粗）
function koRects(L,a){X.globalAlpha=a==null?X.globalAlpha:a;X.fillStyle=KO_OL;for(const r of L)X.fillRect(Math.round(r[0])-2,Math.round(r[1])-2,r[2]+4,r[3]+4);for(const r of L){X.fillStyle=r[4];X.fillRect(Math.round(r[0]),Math.round(r[1]),r[2],r[3])}}
function koStar(x,y,s,c){koRects([[x-s,y-1,s*2+1,3,c],[x-1,y-s,3,s*2+1,c],[x-s+2,y-s+2,2,2,c],[x+s-3,y-s+2,2,2,c],[x-s+2,y+s-3,2,2,c],[x+s-3,y+s-3,2,2,c]])}
function koCarrot(x,y,ang,sc=1){X.save();X.translate(Math.round(x),Math.round(y));X.rotate(ang);X.scale(sc,sc);
  X.fillStyle=KO_OL;X.fillRect(-6,-17,6,11);X.fillRect(-1,-18,7,12);   // 葉子外框
  X.beginPath();X.moveTo(-5,-8);X.lineTo(5,-8);X.lineTo(0,12);X.closePath();X.lineWidth=4/sc;X.lineJoin='round';X.strokeStyle=KO_OL;X.stroke();
  X.fillStyle='rgb(255,140,40)';X.fill();
  X.fillStyle='rgb(210,96,20)';X.fillRect(-3,-3,4,2);X.fillRect(0,3,3,2);
  X.fillStyle='rgb(90,200,80)';X.fillRect(-4,-14,3,6);X.fillRect(1,-15,3,7);X.fillRect(-1,-12,2,4);X.restore()}
function koBunny(x,y,a,f){X.save();X.globalAlpha=a;X.translate(Math.round(x),Math.round(y));const c='rgba(240,248,255,1)',e='rgba(120,150,220,1)',O='rgb(60,80,140)';
  const B=[[-9,-6,18,14],[-7,-9,14,3],[-6,8,12,4],[-3,12,6,4],[-7,-21,4,13],[3,-21,4,13]];
  X.fillStyle=O;for(const r of B)X.fillRect(r[0]-2,r[1]-2,r[2]+4,r[3]+4);X.fillStyle=c;for(const r of B)X.fillRect(r[0],r[1],r[2],r[3]);
  X.fillStyle='rgb(255,190,205)';X.fillRect(-6,-19,2,9);X.fillRect(4,-19,2,9);
  X.fillStyle=e;X.fillRect(-5,-2,2,2);X.fillRect(3,-2,2,2);X.fillRect(-1,2,2,1);X.restore()}
function koArFx(P,sx,sy,f){const u=koU(P);X.save();X.imageSmoothingEnabled=false;const hx=sx+6*f,hy=sy-104;
  // 1) 屁股著地揚塵
  if(u>0.45&&u<1.0){const k=(u-0.45)/0.55;for(let i=0;i<7;i++){const ang=Math.PI*(i/6),r=10+40*k;circ(sx+Math.cos(ang)*r*(i%2?1:-1)*1.2,sy-4-Math.sin(ang)*r*0.25,7+7*k,`rgba(230,220,200,${0.6*(1-k)})`,`rgba(120,90,60,${0.6*(1-k)})`,2)}}
  // 2) 紅蘿蔔從天而降 → 咚！ → 彈到腳邊
  const T1=0.95,T2=1.25;
  if(u>=T1&&u<T2){const k=(u-T1)/(T2-T1);koCarrot(hx,hy-170+170*k*k-8,Math.PI,1.3)}
  else if(u>=T2){const k=Math.min(1,(u-T2)/0.5),bx=hx+f*60*k,by=hy-8+(sy-6-(hy-8))*k-60*Math.sin(Math.PI*k);koCarrot(bx,by,Math.PI+k*Math.PI*2.5*f,1.3);
    if(u<T2+0.55){const a=1-(u-T2)/0.55;X.globalAlpha=a;T('咚！',hx-f*34,hy-30-(u-T2)*40,FS(28),[255,240,120],5,[26,16,22],'mm');for(let i=0;i<6;i++){const g=i*Math.PI/3+u*3;koStar(hx+Math.cos(g)*(14+40*(u-T2)),hy-6+Math.sin(g)*(10+24*(u-T2)),3,'rgb(255,236,120)')}X.globalAlpha=1}
    if(u>T2+0.25){const by2=hy-14-Math.max(0,12-(u-T2-0.25)*30);koRects([[hx-5,by2,10,6,'rgb(255,170,180)'],[hx-3,by2-2,6,2,'rgb(255,200,205)']],1)}}   // 腫包
  // 3) 頭上繞星星＋小紅蘿蔔
  if(u>1.45){const a=Math.min(1,(u-1.45)/0.3);for(let i=0;i<5;i++){const g=u*3.2+i*Math.PI*2/5,x=hx+Math.cos(g)*30,y=hy-4+Math.sin(g)*8;if(Math.sin(g)<-0.2&&i%2)continue;X.globalAlpha=a;
      if(i===2)koCarrot(x,y,g,0.6);else koStar(x,y,i%2?3:4,i%2?'rgb(255,250,200)':'rgb(255,214,90)')}X.globalAlpha=1}
  // 4) 兔子靈魂：慢慢飄出去，飄到頂又「咻」地被拉回身體（每 2.8 秒一次）
  if(u>2.0){const c=((u-2.0)%2.8)/2.8;let up,a;if(c<0.72){up=c/0.72;a=0.25+0.55*Math.min(1,c*6)}else{const k=(c-0.72)/0.28;up=1-k*k;a=0.8*(1-k*0.6)}
    const yy=hy-18-up*70,xx=hx+Math.sin(u*4)*6*up;koBunny(xx,yy,a,f);X.globalAlpha=a*0.5;for(let i=1;i<5;i++)koPx(hx+Math.sin(u*4-i*0.5)*6*up*(1-i/5)-2,hy-18-up*70*(1-i/5)+10,5,6,'rgb(220,236,255)');X.globalAlpha=1;
    if(c>0.72&&c<0.82){X.globalAlpha=1-(c-0.72)/0.1;T('咻～',xx+f*28,yy-8,FS(20),[200,230,255],4,[26,16,22],'mm');X.globalAlpha=1}}
  X.restore()}
// 倒下畫面：暗幕 0.6 秒淡入，主角周圍留一圈較亮的光（讓力竭動畫在倒下畫面中仍看得到）
if(typeof drawDead==='function'){const oDD=drawDead;let dRT=null;
  drawDead=function(){const P=S0&&S0.P;if(dRT==null||!P||!P.dead)dRT=koNow();const a=0.55*Math.min(1,(koNow()-dRT)/0.6);
    const f=X.fillRect;let first=true;
    X.fillRect=function(...q){if(!first)return f.apply(this,q);first=false;
      const hx=P?P.x-S0.cam:640,hy=P?P.y-70:400;let g;try{g=X.createRadialGradient(hx,hy,60,hx,hy,250)}catch(e){g=null}
      if(g){g.addColorStop(0,`rgba(0,0,0,${(a*0.2).toFixed(3)})`);g.addColorStop(1,`rgba(0,0,0,${a.toFixed(3)})`);X.fillStyle=g}else X.fillStyle=`rgba(0,0,0,${a.toFixed(3)})`;
      return f.apply(this,q)};
    try{oDD()}finally{X.fillRect=f}}}

// ---- src27/e_enh.js
// ---------- W2 全身強化：衣服／褲子／鞋子／戒指／項鍊也能強化 ----------
// 跟武器一樣「強化屬於裝備欄」：換裝也保留。成本、成功率、保底（刻印能量）、失敗不降級＝完全沿用武器的 ENH 表與兩位 NPC。
// W2.2 強化平衡（design/w3_enhance_balance_zh.md 定案 L 版）：每一級改成「平加」，不再看裝備主屬性大小；+5／+10／+15 有里程碑
//   武器：攻擊 每級 +4%（+1～5）／+5%（+6～10）／+6%（+11～15）＝ +15 共 +75%；+5 暴擊率 +2%、+10 對首領傷害 +6%（+11 起暴傷、+13～15 賦魔照舊）
//   衣服／褲子：受到傷害 每級 −0.5／−0.7／−0.8%（+15 再 −1%，每件最多 −11%）；+5 最大 HP +1.5%、+10 再 +2.5%（每件）；褲子 +10 抗倒地 +10%
//   鞋子：閃避 每級 +0.3／0.4／0.5%（+15 共 +6%），+10 移動速度 +3%
//   戒指：暴擊率 每級 +0.3／0.4／0.5%（+15 共 +6%），+15 暴擊傷害 +10%
//   項鍊：技能傷害 每級 +0.6／0.8／1.0%（+15 共 +12%），+15 再 +3%
//   上限照舊：受到傷害最多 −60%、閃避最多 25%、抗倒地最多 80%。只有「有穿裝備」的欄位才有效果。
// 存檔：放在每個角色自己的 slot 物件裡（SAVE.slot.a = {b:{e,pity},…}），強化等級沿用，舊存檔不用轉換（只是效果套新公式）。
const ENH2={wpn:[0.04,0.05,0.06],arm:[0.5,0.7,0.8],arm15:1.0,hp:[0.015,0.025],dodge:[0.3,0.4,0.5],crit:[0.3,0.4,0.5],skd:[0.6,0.8,1.0]};
const enhStep=(n,st)=>st[n<=5?0:n<=10?1:2];
const enhSum=(e,st)=>{let f=0;for(let i=1;i<=Math.min(15,e|0);i++)f+=enhStep(i,st);return Math.round(f*1000)/1000};
window.enhAtk=e=>enhSum(e,ENH2.wpn);   // 取代 m2.js 的舊曲線（+15 +50% → +75%）
// 某一欄在強化 +e 時的全部效果（小數：0.06 = 6%）
function enhFx(sl,e){const o={atk:0,def:0,hp:0,kdr:0,dodge:0,ms:0,crit:0,cdmg:0,skd:0,boss:0};e=clamp(e|0,0,15);
  if(sl==='w'){o.atk=enhSum(e,ENH2.wpn);if(e>=5)o.crit+=0.02;if(e>=10)o.boss+=0.06}
  else if(sl==='b'||sl==='p'){o.def=(enhSum(e,ENH2.arm)+(e>=15?ENH2.arm15:0))/100;if(e>=5)o.hp+=ENH2.hp[0];if(e>=10)o.hp+=ENH2.hp[1];if(sl==='p'&&e>=10)o.kdr+=0.10}
  else if(sl==='s'){o.dodge=enhSum(e,ENH2.dodge)/100;if(e>=10)o.ms+=0.03}
  else if(sl==='r'){o.crit=enhSum(e,ENH2.crit)/100;if(e>=15)o.cdmg+=0.10}
  else if(sl==='n'){o.skd=enhSum(e,ENH2.skd)/100+(e>=15?0.03:0)}
  return o}
// 里程碑（說明文字）
const ENH_MS={w:[[5,'暴擊率 +2%'],[10,'對首領傷害 +6%']],b:[[5,'最大 HP +1.5%'],[10,'最大 HP 再 +2.5%'],[15,'受到傷害再 −1%']],
  p:[[5,'最大 HP +1.5%'],[10,'最大 HP 再 +2.5%、抗倒地 +10%'],[15,'受到傷害再 −1%']],s:[[10,'移動速度 +3%']],r:[[15,'暴擊傷害 +10%']],n:[[15,'技能傷害再 +3%']]};
// 主要強化屬性：[名稱, GS 欄位, 符號]
const ENH_K={b:['受到傷害','def','−'],p:['受到傷害','def','−'],s:['閃避','dodge','+'],r:['暴擊率','crit','+'],n:['技能傷害','skd','+']};
const enhFm=v=>{const x=Math.round(Math.abs(v)*1000)/10;return (Number.isInteger(x)?x:x.toFixed(1))+'%'};
// 里程碑效果的文字（給物品說明用），沒有就回傳空字串
function enhMsTx(sl,e){const f=enhFx(sl,e),L=[];if(sl==='w'){if(f.crit)L.push('暴擊率 +'+enhFm(f.crit));if(f.boss)L.push('對首領 +'+enhFm(f.boss))}
  if(f.hp)L.push('最大 HP +'+enhFm(f.hp));if(f.kdr)L.push('抗倒地 +'+enhFm(f.kdr));if(f.ms)L.push('移速 +'+enhFm(f.ms));if(f.cdmg)L.push('暴擊傷害 +'+enhFm(f.cdmg));
  if(sl==='n'&&e>=15)L.push('技能傷害再 +3%');if((sl==='b'||sl==='p')&&e>=15)L.push('受到傷害再 −1%');return L.join('、')}
function aSlot(sl){if(!SAVE)return {e:0,pity:{}};const S=SAVE.slot||(SAVE.slot={e:0,pity:{}});if(!S.a||typeof S.a!=='object')S.a={};
  let o=S.a[sl];if(!o||typeof o!=='object')o=S.a[sl]={e:0,pity:{}};if(typeof o.pity!=='object'||!o.pity)o.pity={};o.e=clamp(o.e|0,0,15);return o}
const aE=sl=>{try{return SAVE&&SAVE.slot&&SAVE.slot.a&&SAVE.slot.a[sl]?clamp(SAVE.slot.a[sl].e|0,0,15):0}catch(e){return 0}};
window.slotE=sl=>sl==='w'?(SAVE&&SAVE.slot?SAVE.slot.e|0:0):aE(sl);
// 裝備中的防具/飾品：圖示角落顯示 +N
window.effE=(o=>it=>{if(it&&it.t!=='w'&&ARMS.includes(it.t)&&SAVE&&SAVE.eq&&SAVE.eq[it.t]===it.id)return aE(it.t);return o(it)})(window.effE);
// 衣服／褲子的 HP 里程碑：放大最大 HP（等級、覺醒都算完之後）
let ENH_HP0=0,ENH_HK=null;
const enhHpF=()=>{try{if(!SAVE||SAVE.hero!==HEROK)return 0;let h=0;for(const sl of ['b','p'])if(eqItem(sl))h+=enhFx(sl,slotE(sl)).hp;return h}catch(e){return 0}};
window.m22ApplyHero=(o=>function(){const r=o.apply(this,arguments);try{ENH_HP0=HPMAX;ENH_HK=HEROK;HPMAX=Math.round(ENH_HP0*(1+enhHpF()));HEAL_CAP=Math.round(HPMAX*0.08)}catch(e){}return r})(window.m22ApplyHero);
// 換裝／強化之後同步最大 HP（只會把目前 HP 壓到上限，不會因為穿上裝備就補血）
function enhHpSync(){if(!ENH_HP0||ENH_HK!==HEROK||!SAVE||SAVE.hero!==HEROK)return;const m=Math.round(ENH_HP0*(1+enhHpF()));if(m===HPMAX||!(m>0))return;
  HPMAX=m;HEAL_CAP=Math.round(HPMAX*0.08);if(S0&&S0.P&&S0.P.hp>HPMAX)S0.P.hp=HPMAX}
window.calcGS=(o=>function(){const r=o.apply(this,arguments);try{if(!SAVE)return r;const A={def:0,dodge:0,crit:0,cdmg:0,skd:0,boss:0,ms:0,kdr:0,hp:0};
    for(const [sl] of SLOTS){if(!eqItem(sl))continue;const f=enhFx(sl,slotE(sl));for(const k in A)A[k]+=f[k]}
    const d0=GS.def,o0=GS.dodge,k0=GS.kdr||0;GS.def=Math.min(0.6,GS.def+A.def);GS.dodge=Math.min(0.25,GS.dodge+A.dodge);GS.crit+=A.crit;GS.cdmg=(GS.cdmg||0)+A.cdmg;
    GS.skd=(GS.skd||0)+A.skd;GS.boss=(GS.boss||0)+A.boss;GS.ms=(GS.ms||0)+A.ms;GS.kdr=Math.min(0.8,k0+A.kdr);
    GS.aenh={def:GS.def-d0,dodge:GS.dodge-o0,crit:A.crit,cdmg:A.cdmg,skd:A.skd,boss:A.boss,ms:A.ms,kdr:GS.kdr-k0,hp:A.hp};enhHpSync()}catch(e){}return r})(window.calcGS);
// 物品說明：主屬性就是裝備本身的數值；強化效果另外列一行，里程碑再一行
window.itemLines=(o=>it=>{const out=o(it);try{if(it&&ARMS.includes(it.t)){const e=effE(it);if(e){const K=ENH_K[it.t],f=enhFx(it.t,e);
      out.push(['強化',`+${e}（${K[0]} ${K[2]}${enhFm(f[K[1]])}）`,[255,236,120]])}}
    if(it&&(it.t==='w'||ARMS.includes(it.t))){const e=effE(it);const tx=e?enhMsTx(it.t,e):'';if(tx){const i=out.findIndex(l=>l[0]==='強化');out.splice(i>=0?i+1:out.length,0,['強化里程碑',tx,[255,210,120]])}}}catch(e){}return out})(window.itemLines);
// 角色面板：「強化」欄列出全身強化的加成
if(typeof m25Rows==='function')window.m25Rows=(o=>()=>{const R=o();try{const A=GS.aenh;if(A){for(const row of R){const c=row[2];
    if(row[0]==='體力 HP'&&A.hp)c[3]=pct(A.hp);
    if(row[0]==='暴擊率'&&A.crit)c[3]=pct(A.crit);
    if(row[0]==='暴擊傷害'&&A.cdmg){const ec=enhCdmg(SAVE.slot&&SAVE.slot.e|0);c[3]=pct(ec+A.cdmg)}
    if(row[0]==='受到傷害'&&A.def)c[3]=pct(-A.def);
    if(row[0]==='閃避'&&A.dodge){c[2]=pct(GS.dodge-A.dodge);c[3]=pct(A.dodge)}
    if(row[0]==='抗倒地'&&A.kdr)c[3]=pct(A.kdr,0);
    if(row[0]==='移動速度'&&A.ms)c[3]=pct(A.ms)}}}catch(e){}return R})(window.m25Rows);
// ---------- 強化 UI：左下角選部位（滑鼠／觸控點選，或 ↑↓） ----------
function aForgeTry(sl,npc){const it=eqItem(sl);if(!it)return;const SL=aSlot(sl);const n=SL.e+1;if(n>15)return;const c=enhCost(n,npc);
  if(SAVE.gold<c.gold){UI.msg=['金幣不夠',performance.now()];return}if(SAVE.shards<c.sh){UI.msg=['刻印碎片不夠（分解裝備可以得到）',performance.now()];return}
  SAVE.gold-=c.gold;SAVE.shards-=c.sh;if(S0)S0.gold=SAVE.gold;const p=SL.pity[n]||0;const sure=c.pity>0&&p>=c.pity;const ok=sure||Math.random()*100<c.rate;
  if(ok){SL.e=n;delete SL.pity[n];sfx('crit',0.5)}else{SL.pity[n]=p+1;sfx('clank',0.5)}
  UI.res={ok,lv:n,t0:performance.now(),sure,it};calcGS();m2Save()}
function aForgeSel(inp){const fs=UI.fsl||'w';T('強化部位',252,494,FS(18),[255,236,200],2,[0,0,0],'mm');
  SLOTS.forEach(([sl,nm],i)=>{const x=140+(i%2)*114,y=508+Math.floor(i/2)*42,on=fs===sl,e=slotE(sl),has=!!eqItem(sl);
    rrect(x,y,x+106,y+36,7,on?'rgb(150,90,30)':'rgb(60,40,24)',on?'rgb(255,236,150)':'rgb(150,120,70)',2);
    T(nm,x+10,y+18,FS(16),on?[255,244,214]:has?[214,200,170]:[130,120,110],2,[0,0,0],'lm');if(e)T('+'+e,x+98,y+18,FN(14),[255,220,120],2,[0,0,0],'rm');
    if(inp&&CLICK&&inBox(CLICK,[x,y,x+106,y+36])&&!(UI.res&&performance.now()-UI.res.t0<1100)){UI.fsl=sl;UI.msg=null}});
  if(inp&&!(UI.res&&performance.now()-UI.res.t0<1100)){const k=SLOTS.findIndex(x=>x[0]===fs);if(press(['ArrowDown','KeyS']))UI.fsl=SLOTS[(k+1)%6][0];else if(press(['ArrowUp','KeyW']))UI.fsl=SLOTS[(k+5)%6][0]}}
// 強化畫面：列出這一欄的里程碑（已達成＝金色✔、這次強化就會達成＝藍色）
function enhMsRows(sl,SE,x,y,al){(ENH_MS[sl]||[]).forEach(([lv,tx],i)=>{const got=SE>=lv,nx=!got&&lv===SE+1;
  T(`${got?'✔':nx?'▶':'・'} +${lv} 里程碑：${tx}`,x,y+i*21,FN(14),got?[255,210,120]:nx?[150,220,255]:[160,150,140],2,[0,0,0],al)})}
function aForgeBody(inp,npc){const sl=UI.fsl,N=NPCS[npc],it=eqItem(sl),SL=aSlot(sl),SE=SL.e,M=GMAIN[sl]||['數值','+'];
  T(`${SLOTN[sl]}欄強化`,400,150,FS(26),[255,236,200],3,[0,0,0],'lm');T('強化等級屬於裝備欄：換裝也保留',1140,150,FN(15),[220,210,190],2,[0,0,0],'rm');
  if(!it){T(`${SLOTN[sl]}欄沒有裝備`,770,330,FS(28),[220,210,190],3,[0,0,0],'mm');T('先到背包（I）穿上裝備再來強化',770,374,FN(17),[200,190,170],2,[0,0,0],'mm');return}
  gearCard(it,400,176,84,false);T(RAR[it.r].st+itName(it),500,204,FS(24),RAR[it.r].col,2,[0,0,0],'lm');T(`${SLOTN[sl]}欄 +${SE}（目前裝備）`,500,236,FN(15),[255,170,120],2,[0,0,0],'lm');
  const n=SE+1,K=ENH_K[sl],F0=enhFx(sl,SE),F1=enhFx(sl,Math.min(15,n)),ST={b:ENH2.arm,p:ENH2.arm,s:ENH2.dodge,r:ENH2.crit,n:ENH2.skd}[sl];
  if(n>15){T('已達最高強化 +15',640,380,FS(30),[255,200,90],3,[0,0,0],'mm');const B0=sl==='n'?enhSum(15,ENH2.skd)/100:(sl==='b'||sl==='p')?enhSum(15,ENH2.arm)/100:F0[K[1]];T(`強化效果：${K[0]} ${K[2]}${enhFm(F0[K[1]])}${F0[K[1]]>B0+1e-9?'（含里程碑）':''}`,640,422,FN(17),[255,255,255],2,[0,0,0],'mm');enhMsRows(sl,SE,640,458,'mm');return}
  const c=enhCost(n,npc),p=SL.pity[n]||0;
  rrect(400,284,760,560,10,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);
  T(`+${SE}`,470,320,FS(30),[255,255,255],3,[0,0,0],'mm');T('▶',560,320,FS(26),[255,200,90],2,[0,0,0],'mm');T(`+${n}`,650,320,FS(30),n>=10?[255,170,60]:[120,200,255],3,[0,0,0],'mm');
  T(`強化${K[0]}`,420,372,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${K[2]}${enhFm(F0[K[1]])}  ▶  ${K[2]}${enhFm(F1[K[1]])}`,740,372,FN(17),[255,255,255],2,[0,0,0],'rm');
  T('裝備本身',420,404,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${M[0]} ${M[1]}${it.v}%（不變）`,740,404,FN(15),[220,210,190],2,[0,0,0],'rm');
  T(`這一級 ${K[2]}${ST[n<=5?0:n<=10?1:2]}%`+(sl==='b'||sl==='p'?'・受到傷害上限 −60%':sl==='s'?'・閃避上限 25%':''),420,436,FN(14),[190,180,160],2,[0,0,0],'lm');
  enhMsRows(sl,SE,420,464,'lm');
  T('失敗不會降級・強化等級與保底都存在裝備欄',420,536,FN(13),[190,180,160],2,[0,0,0],'lm');
  rrect(780,170,1140,560,10,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);T('刻印強化',960,200,FS(24),[255,236,200],3,[0,0,0],'mm');
  T(`強化至+${n} 將消耗裝備刻印。`,960,236,FN(15),[220,210,190],2,[0,0,0],'mm');
  T('成功機率',800,284,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.rate}%`+(N.rate&&ENH[n][0]<100?`（${ENH[n][0]}% +${N.rate}）`:''),1120,284,FN(20),c.rate>=50?[150,255,150]:[255,200,120],2,[0,0,0],'rm');
  T('刻印能量',800,326,FN(17),[214,172,84],2,[0,0,0],'lm');const f=c.pity?clamp(p/c.pity,0,1):0;rrect(900,316,1120,338,6,'rgba(0,0,0,0.6)','rgb(120,100,70)',1);if(f>0)rrect(902,318,902+216*f,336,5,f>=1?'rgb(255,190,60)':'rgb(110,180,255)');
  T(c.pity?`${p}/${c.pity}`:'—',1010,327,FN(13),[255,255,255],2,[0,0,0],'mm');if(c.pity&&p>=c.pity)T('能量已滿：下次必定成功！',960,360,FN(15),[255,210,90],2,[0,0,0],'mm');
  T('刻印碎片',800,396,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.sh}（持有 ${SAVE.shards}）`,1120,396,FN(17),SAVE.shards>=c.sh?[255,255,255]:[255,120,110],2,[0,0,0],'rm');
  T('金幣',800,430,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.gold.toLocaleString('en-US')}（持有 ${SAVE.gold.toLocaleString('en-US')}）`,1120,430,FN(17),SAVE.gold>=c.gold?[255,226,120]:[255,120,110],2,[0,0,0],'rm');
  if(npc==='cat')T('貓商人：金幣 7 折、成功率 +2%',960,462,FN(14),[255,170,60],2,[0,0,0],'mm');
  const busy=UI.res&&performance.now()-UI.res.t0<1100;const can=!busy&&SAVE.gold>=c.gold&&SAVE.shards>=c.sh;
  if(btn(840,492,1080,540,`強化（${c.gold.toLocaleString('en-US')} 金幣）`,can,[255,200,90])&&inp)aForgeTry(sl,npc);
  if(inp&&!busy&&press(['KeyJ','Enter','Space']))aForgeTry(sl,npc)}
window.forgeUI=(o=>function(inp){const npc=UI.npc||'prank';if(!SLOTS.some(x=>x[0]===UI.fsl))UI.fsl='w';
  if(UI.kind==='draw'||UI.kind==='rr'||UI.kind==='inh'||UI.kind==='up')return o.apply(this,arguments);
  if(UI.fsl==='w'){const r=o.apply(this,arguments);if(UI.kind!=='draw'&&UI.kind!=='rr'&&UI.kind!=='inh'&&UI.kind!=='up'){aForgeSel(inp);if(eqItem('w'))enhMsRows('w',slotE('w'),420,494,'lm')}return r}
  // 防具：借原本的畫面畫外框／NPC／分頁（暫時把武器欄清空，原本的函式就會在分頁後停下）
  const w0=SAVE.eq.w;let r;SAVE.eq.w=-1;try{r=o.apply(this,arguments)}finally{SAVE.eq.w=w0}
  if(UI.kind==='draw'||UI.kind==='rr'||UI.kind==='inh'||UI.kind==='up')return r;   // 剛點了別的分頁
  aForgeBody(inp,npc);aForgeSel(inp);
  if(UI.msg&&performance.now()-UI.msg[1]<1600)T(UI.msg[0],960,586,FS(18),[255,160,120],2,[0,0,0],'mm');
  T('J/Enter 強化　↑↓ 換部位　Tab 切換分頁　Esc 離開',640,636,FN(14),[200,190,170],2,[0,0,0],'mm');
  if(UI.res)forgeBurst(UI.res);return r})(window.forgeUI);
// 武器頁的底部說明也提一下 ↑↓
window.T=(o=>function(s,...r){if(s==='J/Enter 強化　Tab 切換分頁　Esc 離開')s='J/Enter 強化　↑↓ 換部位　Tab 切換分頁　Esc 離開';
  else if(typeof s==='string'&&s.indexOf('節奏加成')>=0&&typeof isArcher==='function'&&isArcher())s=s.replace(/節奏加成/g,'集中');   // 弓兵：項鍊副屬性叫「集中」
  return o(s,...r)})(window.T);

// ---- src27/f_count.js
// ---------- W2 封面左上角：今日登錄人數／累計登錄人數（只有網頁版） ----------
// 每台裝置每天（台北時間）只算 1 次，訪客也算。用 Firestore REST（不用登入、不載入 SDK）：
//   stats/d20261101 {n}＝當天人數；stats/total {n}＝每天人數加總（累計登錄人次）。
// 寫入：一台裝置一天 1 次 commit（2 個 increment）；讀取：當天已算過的裝置開封面時 1 次 batchGet，10 分鐘內不重讀。
// APK／PC 版／本機測試（沒有 firebase-config.js 或不是 github.io）＝完全不連線、不畫；失敗也不跳錯誤，只是不顯示。
(()=>{
const Q=new URLSearchParams(location.search),LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname),EMU=LOCAL&&Q.get('emu')==='1';
const C={day:null,n:null,tot:null,busy:false,at:0};window.__cnt=C;
let cfg,ON,PROJ,BASE,KEY,DOCP;
function setup(){cfg=window.ERINN_FIREBASE;ON=!!cfg&&!/^PASTE/.test(cfg.apiKey||'')&&(EMU||/\.github\.io$/.test(location.hostname))&&typeof fetch==='function';
if(!ON)return false;
PROJ=EMU?(Q.get('proj')||'demo-erinn'):cfg.projectId;
BASE=EMU?`http://127.0.0.1:${+(Q.get('fport')||8080)}/v1/projects/${PROJ}/databases/(default)/documents`:`https://firestore.googleapis.com/v1/projects/${PROJ}/databases/(default)/documents`;
KEY=EMU?'':'?key='+encodeURIComponent(cfg.apiKey);
DOCP=`projects/${PROJ}/databases/(default)/documents/stats/`;return true}
const tpeDay=()=>new Date(Date.now()+8*3600e3).toISOString().slice(0,10).replace(/-/g,'');
const lsG=k=>{try{return localStorage.getItem(k)}catch(e){return null}},lsS=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const ssG=k=>{try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch(e){return null}},ssS=(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const num=f=>f&&f.n?+(f.n.integerValue!=null?f.n.integerValue:f.n.doubleValue||0):0;
const tmo=(p,ms)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),ms))]);
async function bump(day){const w=id=>({transform:{document:DOCP+id,fieldTransforms:[{fieldPath:'n',increment:{integerValue:'1'}}]}});
  const r=await tmo(fetch(BASE+':commit'+KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({writes:[w('d'+day),w('total')]})}),8000);
  if(!r.ok)throw new Error('commit '+r.status);const j=await r.json();const tr=(j.writeResults||[]).map(x=>x.transformResults&&x.transformResults[0]);
  const v=x=>x?+(x.integerValue!=null?x.integerValue:x.doubleValue||0):null;return [v(tr[0]),v(tr[1])]}
async function read(day){const r=await tmo(fetch(BASE+':batchGet'+KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({documents:[DOCP+'d'+day,DOCP+'total']})}),8000);
  if(!r.ok)throw new Error('get '+r.status);const j=await r.json();let n=0,t=0;for(const x of j){if(x.found){if(/\/total$/.test(x.found.name))t=num(x.found.fields);else n=num(x.found.fields)}}return [n,t]}
async function refresh(){if(C.busy||(navigator.onLine===false))return;const day=tpeDay();
  const c=ssG('erinn_cnt');if(c&&c.day===day&&lsG('erinn_cnt_day')===day&&Date.now()-c.at<600e3){Object.assign(C,c);return}
  C.busy=true;try{let n,t;if(lsG('erinn_cnt_day')!==day){[n,t]=await bump(day);lsS('erinn_cnt_day',day)}else [n,t]=await read(day);
    if(n!=null&&t!=null){Object.assign(C,{day,n,tot:t,at:Date.now()});ssS('erinn_cnt',{day,n,tot:t,at:C.at})}}
  catch(e){C.at=Date.now()}finally{C.busy=false}}
// firebase-config.js 在 m27.js 後面才載入 → 等一下再決定要不要連線
// W2：設定檔可能晚到（網路慢）→ 每 1.5 秒重試，最多 40 次
let tries=0;const boot=()=>{if(!setup()){if(++tries<40)setTimeout(boot,1500);return}refresh();setInterval(()=>{try{if(typeof mode!=='undefined'&&mode==='title'&&Date.now()-C.at>600e3)refresh()}catch(e){}},30e3);window.addEventListener('online',()=>setTimeout(refresh,1000))};setTimeout(boot,1500);
// 畫在封面左上角（小字、半透明底）
window.drawTitle=(o=>function(){const r=o.apply(this,arguments);try{if(C.n!=null&&C.tot!=null&&C.day===tpeDay()){const f=FN(15),a=`今日登錄 ${C.n.toLocaleString('en-US')} 人`,b=`累計登錄 ${C.tot.toLocaleString('en-US')} 人`;
    const w=Math.max(tw(a,f),tw(b,f))+28;rrect(12,12,12+w,68,8,'rgba(0,0,0,0.45)','rgba(214,172,84,0.55)',1);
    T(a,26,30,f,[255,236,190],2,[0,0,0],'lm');T(b,26,52,f,[220,210,190],2,[0,0,0],'lm')}}catch(e){}return r})(window.drawTitle);
})();

// ---- src27/g_bal.js
// ===== W2 技能實用度調整（design/w2_skill_audit_zh.md）=====
// 原則：「所有技能都要派得上用場」。只補被同角色其他招完全壓過的招，強招不砍；詩人大招維持 W2 量表（不在這裡調）
// 詩人：三連音／跪地彈奏 → 改在 src22/d_bard.js 的 BAL_W2
// 弓兵：蓄力 2 段原本每秒傷害比 1 段還低（純過渡）、翼矛單發只有烈焰箭的 1/4、後翻扇射傷害比一支 1 段蓄力還低
AR.chg.mul[1]=2.4;   // 2.0 → 2.4：放在 2 段＝每秒傷害跟 1 段一樣，但一發更痛（打斷、補刀用）
AR.wing.mul=1.6;     // 1.0 → 1.6：破防＋挑空的控場招，也要有傷害
AR.flip.mul=0.9;     // 0.6 → 0.9：脫離招（無敵＋後退）順便有傷害，才不會被翻滾（冷卻 1 秒）完全取代
// 苦達斯：踱地（冷卻 6 秒）傷害只有大劍（冷卻 2.2 秒）的 1/3 → ×1.6，定位＝被包圍時 360° 緩速
const STP_W2=1.6;
window.m21StompImpact=(o=>function(){const sv=B22.mul;B22.mul=STP_W2;try{return o.apply(this,arguments)}finally{B22.mul=sv}})(window.m21StompImpact);

// ---- src27/h_safe.js
// ===== 熱修：卡死安全網（三位角色都套用，包在 stepPlayer 最外層）=====
// 起因：三杯兔子 AR 物件有兩個 air（空中速度 320 被空中射擊上限 {max:2} 蓋掉），跳起來時 P.x 變 NaN → 人物畫不出來、鏡頭也壞掉
// 安全網（正常遊玩不會觸發；觸發時記在 window.__err，'safe:' 開頭）：
//  (1) 主角位置／高度／速度出現 NaN、Infinity → 還原上一格的值（沒有就放回畫面中間的地面）；鏡頭 NaN → 重新對準主角
//  (2) 主角跑出關卡範圍（x 超出 0–WW、y 超出 YMIN–YMAX 20px 以上）→ 拉回範圍內
//  (3) 不在特殊動作中卻離地超過 3 秒、或高度超過 500（正常跳最高約 165）→ 強制落地
//  (4) 同一個動作超過 12 秒還沒結束（最長的狙擊模式 8.7 秒）→ 結束動作；倒地時間超過 3 秒 → 縮成 1 秒
//  (5) 怪物位置 NaN／跑出關卡、血量 NaN → 拉回畫面／血量改 1（不然波次永遠清不掉、鏡頭鎖住）
const SAFE_AIR=3.0,SAFE_ACT=['au','bu','stomp'];
const safeLog=m=>{const e=(window.__err=window.__err||[]);if(e.length<200)e.push('safe: '+m)};
window.stepPlayer=(o=>function(dt){const s=S0,P=s&&s.P;const p0=P?{x:P.x,y:P.y,h:P.h,vh:P.vh}:null;const r=o.apply(this,arguments);
  try{if(!P||!p0)return r;const fin=Number.isFinite,t=s.t;
    if(!fin(P.x)){P.x=fin(p0.x)?p0.x:clamp(fin(s.cam)?s.cam+640:200,30,WW-30);safeLog('bad x '+HEROK)}
    if(!fin(P.y)){P.y=fin(p0.y)?p0.y:clamp(552,YMIN,YMAX);safeLog('bad y '+HEROK)}
    if(!fin(P.h)||!fin(P.vh)){P.h=0;P.vh=0;safeLog('bad h '+HEROK)}
    if(P.x<0||P.x>WW){P.x=clamp(P.x,30,WW-30);safeLog('x out '+HEROK)}
    if(P.y<YMIN-20||P.y>YMAX+20){P.y=clamp(P.y,YMIN,YMAX);safeLog('y out '+HEROK)}
    if(!fin(s.cam))s.cam=clamp(P.x-640,0,CAMMAX);
    const sp=P.act&&SAFE_ACT.includes(P.act.type);
    if(P.h>500||(P.h>0&&!sp&&(P.airT=(P.airT||0)+dt)>SAFE_AIR)){P.h=0;P.vh=0;P.airN=0;P.airT=0;if(P.act&&['aa','ba','air'].includes(P.act.type))P.act=null;safeLog('force land '+HEROK)}
    else if(P.h<=0)P.airT=0;
    if(P.act){if(P.act!==P.safeA){P.safeA=P.act;P.safeT0=t}else if(t-P.safeT0>12){safeLog('act timeout '+P.act.type);P.act=null;P.safeA=null;if(P.h>0){P.h=0;P.vh=0}}}else P.safeA=null;
    if(P.downU>t+3)P.downU=t+1;
    for(const m of s.mobs||[]){if(m.gone)continue;
      if(!fin(m.x)||m.x<-300||m.x>WW+300){m.x=clamp(fin(P.x)?P.x+(m.x<P.x?-500:500):640,60,WW-60);safeLog('mob x '+m.kind)}
      if(!fin(m.y)){m.y=clamp(552,YMIN,YMAX);safeLog('mob y '+m.kind)}
      if(m.h!=null&&!fin(m.h)){m.h=0;m.vh=0}
      if(m.hp!=null&&!fin(m.hp)&&!m.dying){m.hp=1;safeLog('mob hp '+m.kind)}}}catch(e){}
  return r})(window.stepPlayer);

// ---- src27/i_hurt.js
// ===== W2.2「不會一招死」（design/w3_enhance_balance_zh.md 2.4，三位英雄、所有難度都適用）=====
//  (1) 單招上限：任何一下最多扣最大 HP 的 65%；0.3 秒內一起打到的多段（毒圈重疊、多把劍同時砍）合併計算，加起來也最多 65%
//  (2) 轉圜無敵：只有「被上限擋下來」的那一下才給 0.6 秒無敵（角色閃爍），冷卻 6 秒
//  (3) 破綻：被首領大招（基礎傷害 ≥750）打中後 10 秒內，下一次大招傷害 +50%，最多疊 3 層；10 秒沒再被大招打到就清空
//      破綻加的傷害一樣受 65% 上限限制 → 滿血一定活得下來，但連吃第二下（還沒補血）就會倒，所以還是要閃
// 復仇回血、詩人大招集氣、技能數值都沒動。
const HCAP={cap:0.65,win:0.3,ifr:0.6,ifrCD:6,exP:0.5,exN:3,exT:10,exMin:750};
window.m2Hurt=(o=>(v,x)=>{let r=o(v,x);if(!(r>0))return r;try{const s=S0,P=s.P,t=s.t,cap=Math.max(1,Math.round(HPMAX*HCAP.cap));
    if(!(t<=(P.capWT||0))){P.capWD=0;P.capWT=t+HCAP.win}
    const room=Math.max(1,cap-(P.capWD||0));let capped=false;if(r>room){r=room;capped=true;s.capN=(s.capN||0)+1}P.capWD=(P.capWD||0)+r;
    if(capped&&t>=(P.capIfT||0)){P.invU=Math.max(P.invU||0,t+HCAP.ifr);P.capIfT=t+HCAP.ifrCD;s.capIf=(s.capIf||0)+1;proc('轉圜',[150,220,255],'閃')}}catch(e){}
  return r})(window.m2Hurt);
window.hurtP=(o=>function(v,x,y){const s=S0,P=s&&s.P;if(!P||P.dead||!s.boss||!(v>=HCAP.exMin))return o.apply(this,arguments);
  const t=s.t;if(t>(P.exT||0))P.exN=0;const n=P.exN||0,hp0=P.hp;const r=o.call(this,Math.round(v*(1+HCAP.exP*n)),x,y);
  if(P.hp<hp0){P.exN=Math.min(HCAP.exN,n+1);P.exT=t+HCAP.exT;if(n>0)s.exHit=(s.exHit||0)+1;if(P.exN>n)proc(`破綻 ×${P.exN}`,[255,140,90],'綻')}return r})(window.hurtP);

