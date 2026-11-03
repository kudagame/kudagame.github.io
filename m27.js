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
      arArrowHit(b,m);if(!b.pierce){b.dead=1;if(b.pool==='air')continue;break}}   // W2.7：空中射擊打到的那一格，判定範圍內的敵人都算（每隻一次），之後消失
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
  const tile=(x,y,r,l,k,cd,mx,col,deny)=>{const rdy=cd<=0;const _w=hudTB(k==='Shift'?'dodge':k==='↓L'?'flip':'rain',x,y,r);circ(x,y,r,rdy?rgb(col.map(v=>v*0.45|0),0.92):'rgba(30,24,20,0.85)',rdy?rgb(col.map(v=>Math.min(255,v+90))):'rgb(120,100,80)',3);
    if(!rdy){X.save();X.beginPath();X.moveTo(x,y);X.arc(x,y,r-3,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,cd/mx));X.closePath();X.fillStyle='rgba(0,0,0,0.55)';X.fill();X.restore()}
    const dn=t-(deny||-9)<0.35;T(l,x+(dn?Math.round(4*Math.sin(t*70)):0),y-1,FS(15),rdy?[255,244,214]:[170,160,150],2,[0,0,0],'mm');T(k,x,y+r+6,FN(11),[220,210,190],2,[0,0,0],'mm');hudTE(_w)};
  tile(810,604,24,'翻滾','Shift',P.rlCD||0,AR.roll.cd,[80,160,200]);tile(748,604,24,'扇射','↓L',P.flCD||0,AR.flip.cd*arMvcd(),[220,120,190],s.denyFl);tile(686,604,24,'箭雨','↓K',P.rnCD||0,AR.rain.cd*arMvcd(),[80,200,90],s.denyRn);
  {const _w=hudTB('kl',1070,524,22);const sn=P.act&&P.act.type==='as',cd=Math.max(0,P.snCD||0),mx=AR.snipe.cd*arMvcd();skillTile(1070,524,22,'狙',[60,140,200],'K+L',sn?'狙擊中':'集中5',!sn&&(P.rh<AR.snipe.cost||cd>0),s.denySn||-9,cd>0?cd/mx:0,null);
   if(!sn&&cd<=0&&P.rh>=AR.snipe.cost)arc(1070,524,25,-90,270,Math.floor(t*6)%2?'rgb(170,230,255)':'rgb(110,190,240)',3);hudTE(_w)}
  {const _w=hudTB('jk',994,524,22);const u=Math.min(1,(P.dragon||0)/DRG.max);skillTile(994,524,22,'龍',[140,70,210],'J+K',u>=1?'龍矢滿':'龍矢'+Math.floor(u*100)+'%',u<1,s.denyU||-9,1-u,null);
   if(u>=1)arc(994,524,25,-90,270,Math.floor(t*6)%2?'rgb(233,160,255)':'rgb(190,110,240)',3);else if(u>0)arc(994,524,25,-90,-90+360*u,'rgb(170,100,230)',3);hudTE(_w)}
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
    const rows=[['射擊','J：邊走邊射（移動中也能射）；空中 J＝往斜下射（最多 2 發）；打中累積「集中」；箭頭沾藥酒，打中會回血（「藥酒 +數字」，血少時更多）'],['蓄力射擊','按住 J：0.5／1.0／1.5 秒三段（白→金光），放開射出；第 3 段「尋心箭」貫穿＋擊退、集中 +1'],
      ['翼矛','K：前方地面紫色符文，0.35 秒後木樁爆出：擊飛＋「破防」（5 秒內受到傷害 +10%）。冷卻 8 秒'],['箭雨','↓+K：先乾一杯回血，前方落箭 2 秒（8 段），留下藥酒綠霧 4 秒：緩速＋持續傷害，打中霧裡的敵人會回血。冷卻 12 秒'],
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
// W2.4：衣服／褲子 每一級都加 HP（+1～5 0.35%／+6～10 0.55%／+11～15 0.8%，每件）×位階倍率 Q；減傷每級 ×(1+(Q−1)/2)；衣服／褲子本身依等階加 HP（衣服 0.5～3%、褲子減半）×Q
//   Q：白 1.00、高級 1.08、稀有★2 1.16、★3 1.24、英雄 1.34、夢幻 1.46、傳說 1.60；+5／+10／+15 HP 里程碑照舊（舊存檔數值只會變高）
// W2.3：+15 里程碑加強（武器 對首領再 +10%；衣服／褲子 受到傷害再 −2%（原 −1%）＋最大 HP 再 +3%）；+1～10、成功率、成本不變
// W2.2 強化平衡（design/w3_enhance_balance_zh.md 定案 L 版）：每一級改成「平加」，不再看裝備主屬性大小；+5／+10／+15 有里程碑
//   武器：攻擊 每級 +4%（+1～5）／+5%（+6～10）／+6%（+11～15）＝ +15 共 +75%；+5 暴擊率 +2%、+10 對首領傷害 +6%（+11 起暴傷、+13～15 賦魔照舊）
//   衣服／褲子：受到傷害 每級 −0.5／−0.7／−0.8%（+15 再 −1%，每件最多 −11%）；+5 最大 HP +1.5%、+10 再 +2.5%（每件）；褲子 +10 抗倒地 +10%
//   鞋子：閃避 每級 +0.3／0.4／0.5%（+15 共 +6%），+10 移動速度 +3%
//   戒指：暴擊率 每級 +0.3／0.4／0.5%（+15 共 +6%），+15 暴擊傷害 +10%
//   項鍊：技能傷害 每級 +0.6／0.8／1.0%（+15 共 +12%），+15 再 +3%
//   上限照舊：受到傷害最多 −60%、閃避最多 25%、抗倒地最多 80%。只有「有穿裝備」的欄位才有效果。
// 存檔：放在每個角色自己的 slot 物件裡（SAVE.slot.a = {b:{e,pity},…}），強化等級沿用，舊存檔不用轉換（只是效果套新公式）。
const ENH2={wpn:[0.04,0.05,0.06],arm:[0.5,0.7,0.8],arm15:2.0,hp:[0.015,0.025],hp15:0.03,wboss15:0.10,dodge:[0.3,0.4,0.5],crit:[0.3,0.4,0.5],skd:[0.6,0.8,1.0],hpLv:[0.35,0.55,0.8],Q:[1,1.08,1.16,1.24,1.34,1.46,1.6],gh:[0.5,1,1.5,2,3]};
const enhQ=it=>it&&it.r!=null?(ENH2.Q[clamp(it.r|0,0,ENH2.Q.length-1)]||1):1;
// 衣服／褲子本身的 HP%（小數）：衣服 gh[等階]、褲子一半，×Q
const gearHp=it=>it&&(it.t==='b'||it.t==='p')?Math.round(ENH2.gh[clamp(it.k|0,0,4)]*(it.t==='p'?0.5:1)*enhQ(it)*1000)/100000:0;
const enhStep=(n,st)=>st[n<=5?0:n<=10?1:2];
const enhSum=(e,st)=>{let f=0;for(let i=1;i<=Math.min(15,e|0);i++)f+=enhStep(i,st);return Math.round(f*1000)/1000};
window.enhAtk=e=>enhSum(e,ENH2.wpn);   // 取代 m2.js 的舊曲線（+15 +50% → +75%）
// 某一欄在強化 +e 時的全部效果（小數：0.06 = 6%）
function enhFx(sl,e,it){const o={atk:0,def:0,hp:0,hpMs:0,hpLv:0,kdr:0,dodge:0,ms:0,crit:0,cdmg:0,skd:0,boss:0};e=clamp(e|0,0,15);const q=enhQ(it);
  if(sl==='w'){o.atk=enhSum(e,ENH2.wpn);if(e>=5)o.crit+=0.02;if(e>=10)o.boss+=0.06;if(e>=15)o.boss+=ENH2.wboss15}
  else if(sl==='b'||sl==='p'){o.def=Math.round((enhSum(e,ENH2.arm)*(1+(q-1)/2)+(e>=15?ENH2.arm15:0))*1000)/100000;if(e>=5)o.hpMs+=ENH2.hp[0];if(e>=10)o.hpMs+=ENH2.hp[1];if(e>=15)o.hpMs+=ENH2.hp15;
    o.hpMs=Math.round(o.hpMs*10000)/10000;o.hpLv=Math.round(enhSum(e,ENH2.hpLv)*q*1000)/100000;o.hp=Math.round((o.hpMs+o.hpLv)*100000)/100000;if(sl==='p'&&e>=10)o.kdr+=0.10}
  else if(sl==='s'){o.dodge=enhSum(e,ENH2.dodge)/100;if(e>=10)o.ms+=0.03}
  else if(sl==='r'){o.crit=enhSum(e,ENH2.crit)/100;if(e>=15)o.cdmg+=0.10}
  else if(sl==='n'){o.skd=enhSum(e,ENH2.skd)/100+(e>=15?0.03:0)}
  return o}
// 里程碑（說明文字）
const ENH_MS={w:[[5,'暴擊率 +2%'],[10,'對首領傷害 +6%'],[15,'對首領傷害再 +10%']],b:[[5,'最大 HP +1.5%'],[10,'最大 HP 再 +2.5%'],[15,'受到傷害再 −2%、最大 HP 再 +3%']],
  p:[[5,'最大 HP +1.5%'],[10,'最大 HP 再 +2.5%、抗倒地 +10%'],[15,'受到傷害再 −2%、最大 HP 再 +3%']],s:[[10,'移動速度 +3%']],r:[[15,'暴擊傷害 +10%']],n:[[15,'技能傷害再 +3%']]};
// 主要強化屬性：[名稱, GS 欄位, 符號]
const ENH_K={b:['受到傷害','def','−'],p:['受到傷害','def','−'],s:['閃避','dodge','+'],r:['暴擊率','crit','+'],n:['技能傷害','skd','+']};
const enhFm=v=>{const x=Math.round(Math.abs(v)*1000)/10;return (Number.isInteger(x)?x:x.toFixed(1))+'%'};
// 里程碑效果的文字（給物品說明用），沒有就回傳空字串
function enhMsTx(sl,e){const f=enhFx(sl,e),L=[];if(sl==='w'){if(f.crit)L.push('暴擊率 +'+enhFm(f.crit));if(f.boss)L.push('對首領 +'+enhFm(f.boss))}
  if(f.hpMs)L.push('最大 HP +'+enhFm(f.hpMs));if(f.kdr)L.push('抗倒地 +'+enhFm(f.kdr));if(f.ms)L.push('移速 +'+enhFm(f.ms));if(f.cdmg)L.push('暴擊傷害 +'+enhFm(f.cdmg));
  if(sl==='n'&&e>=15)L.push('技能傷害再 +3%');if((sl==='b'||sl==='p')&&e>=15)L.push('受到傷害再 −2%');return L.join('、')}
function aSlot(sl){if(!SAVE)return {e:0,pity:{}};const S=SAVE.slot||(SAVE.slot={e:0,pity:{}});if(!S.a||typeof S.a!=='object')S.a={};
  let o=S.a[sl];if(!o||typeof o!=='object')o=S.a[sl]={e:0,pity:{}};if(typeof o.pity!=='object'||!o.pity)o.pity={};o.e=clamp(o.e|0,0,15);return o}
const aE=sl=>{try{return SAVE&&SAVE.slot&&SAVE.slot.a&&SAVE.slot.a[sl]?clamp(SAVE.slot.a[sl].e|0,0,15):0}catch(e){return 0}};
window.slotE=sl=>sl==='w'?(SAVE&&SAVE.slot?SAVE.slot.e|0:0):aE(sl);
// 裝備中的防具/飾品：圖示角落顯示 +N
window.effE=(o=>it=>{if(it&&it.t!=='w'&&ARMS.includes(it.t)&&SAVE&&SAVE.eq&&SAVE.eq[it.t]===it.id)return aE(it.t);return o(it)})(window.effE);
// 衣服／褲子的 HP 里程碑：放大最大 HP（等級、覺醒都算完之後）
let ENH_HP0=0,ENH_HK=null;
const enhHpF=ov=>{try{if(!SAVE||SAVE.hero!==HEROK)return 0;let h=0;for(const sl of ['b','p']){const it=eqItem(sl);if(it)h+=enhFx(sl,ov&&ov[sl]!=null?ov[sl]:slotE(sl),it).hp}return h}catch(e){return 0}};
const gearHpF=()=>{try{if(!SAVE||SAVE.hero!==HEROK)return 0;let h=0;for(const sl of ['b','p'])h+=gearHp(eqItem(sl));return h}catch(e){return 0}};
// 最大 HP ＝（等級／覺醒算完的 HP ＋ 基礎 HP × 衣褲位階 HP）×（1 ＋ 衣褲強化 HP）；ov＝假設某欄強化等級（強化畫面預覽用）
const enhEhp=(h,d)=>Math.round(h/Math.max(0.4,1-d));
const enhHpCalc=ov=>Math.round((ENH_HP0+Math.round(HERO[HEROK].hp*gearHpF()))*(1+enhHpF(ov)));
window.m22ApplyHero=(o=>function(){const r=o.apply(this,arguments);try{ENH_HP0=HPMAX;ENH_HK=HEROK;HPMAX=enhHpCalc();HEAL_CAP=Math.round(HPMAX*0.08)}catch(e){}return r})(window.m22ApplyHero);
// 換裝／強化之後同步最大 HP（只會把目前 HP 壓到上限，不會因為穿上裝備就補血）
function enhHpSync(){if(!ENH_HP0||ENH_HK!==HEROK||!SAVE||SAVE.hero!==HEROK)return;const m=enhHpCalc();if(m===HPMAX||!(m>0))return;
  HPMAX=m;HEAL_CAP=Math.round(HPMAX*0.08);if(S0&&S0.P&&S0.P.hp>HPMAX)S0.P.hp=HPMAX}
window.calcGS=(o=>function(){const r=o.apply(this,arguments);try{if(!SAVE)return r;const A={def:0,dodge:0,crit:0,cdmg:0,skd:0,boss:0,ms:0,kdr:0,hp:0};
    for(const [sl] of SLOTS){const it=eqItem(sl);if(!it)continue;const f=enhFx(sl,slotE(sl),it);for(const k in A)A[k]+=f[k]}
    const d0=GS.def,o0=GS.dodge,k0=GS.kdr||0;GS.def=Math.min(0.6,GS.def+A.def);GS.dodge=Math.min(0.25,GS.dodge+A.dodge);GS.crit+=A.crit;GS.cdmg=(GS.cdmg||0)+A.cdmg;
    GS.skd=(GS.skd||0)+A.skd;GS.boss=(GS.boss||0)+A.boss;GS.ms=(GS.ms||0)+A.ms;GS.kdr=Math.min(0.8,k0+A.kdr);
    GS.aenh={def:GS.def-d0,dodge:GS.dodge-o0,crit:A.crit,cdmg:A.cdmg,skd:A.skd,boss:A.boss,ms:A.ms,kdr:GS.kdr-k0,hp:A.hp,gh:gearHpF()};enhHpSync();GS.aenh.ehp=Math.round(HPMAX/Math.max(0.4,1-GS.def))}catch(e){}return r})(window.calcGS);
// 物品說明：主屬性就是裝備本身的數值；強化效果另外列一行，里程碑再一行
window.itemLines=(o=>it=>{const out=o(it);try{if(it&&ARMS.includes(it.t)){const e=effE(it);const gh=gearHp(it);if(gh)out.push(['位階 HP',`最大 HP +${enhFm(gh)}（品質越好越多）`,[150,235,150]]);if(e){const K=ENH_K[it.t],f=enhFx(it.t,e,it);
      out.push(['強化',`+${e}（${K[0]} ${K[2]}${enhFm(f[K[1]])}`+(f.hp?`、最大 HP +${enhFm(f.hp)}`:'')+'）',[255,236,120]])}}
    if(it&&(it.t==='w'||ARMS.includes(it.t))){const e=effE(it);const tx=e?enhMsTx(it.t,e):'';if(tx){const i=out.findIndex(l=>l[0]==='強化');out.splice(i>=0?i+1:out.length,0,['強化里程碑',tx,[255,210,120]])}}}catch(e){}return out})(window.itemLines);
// 角色面板：「強化」欄列出全身強化的加成
if(typeof m25Rows==='function')window.m25Rows=(o=>()=>{const R=o();try{const A=GS.aenh;if(A){for(const row of R){const c=row[2];
    if(row[0]==='體力 HP'){if(A.hp)c[3]=pct(A.hp);if(A.gh)c[2]=pct(A.gh)}
    if(row[0]==='暴擊率'&&A.crit)c[3]=pct(A.crit);
    if(row[0]==='暴擊傷害'&&A.cdmg){const ec=enhCdmg(SAVE.slot&&SAVE.slot.e|0);c[3]=pct(ec+A.cdmg)}
    if(row[0]==='受到傷害'&&A.def)c[3]=pct(-A.def);
    if(row[0]==='閃避'&&A.dodge){c[2]=pct(GS.dodge-A.dodge);c[3]=pct(A.dodge)}
    if(row[0]==='抗倒地'&&A.kdr)c[3]=pct(A.kdr,0);
    if(row[0]==='移動速度'&&A.ms)c[3]=pct(A.ms)}}
  // W2.4：等效血量＝最大 HP ÷（1 − 受到傷害減免），放在「受到傷害」下一列
  const i=R.findIndex(x=>x[0]==='受到傷害');if(i>=0)R.splice(i+1,0,['等效血量',fmt(enhEhp(HPMAX,GS.def)),['—','—','—','—','—','HP÷(1−減傷)']])}catch(e){}return R})(window.m25Rows);
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
  const n=SE+1,K=ENH_K[sl],F0=enhFx(sl,SE,it),F1=enhFx(sl,Math.min(15,n),it),AR=sl==='b'||sl==='p',ST={b:ENH2.arm,p:ENH2.arm,s:ENH2.dodge,r:ENH2.crit,n:ENH2.skd}[sl];
  if(n>15){T('已達最高強化 +15',640,380,FS(30),[255,200,90],3,[0,0,0],'mm');const B0=sl==='n'?enhSum(15,ENH2.skd)/100:AR?F0.def-ENH2.arm15/100:F0[K[1]];T(`強化效果：${K[0]} ${K[2]}${enhFm(F0[K[1]])}${F0[K[1]]>B0+1e-9?'（含里程碑）':''}`,640,422,FN(17),[255,255,255],2,[0,0,0],'mm');enhMsRows(sl,SE,640,458,'mm');
    if(AR)T(`最大 HP ${fmt(HPMAX)}　等效血量 ${fmt(enhEhp(HPMAX,GS.def))}`,640,540,FN(17),[150,235,150],2,[0,0,0],'mm');return}
  const c=enhCost(n,npc),p=SL.pity[n]||0;
  rrect(400,284,760,560,10,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);
  T(`+${SE}`,470,320,FS(30),[255,255,255],3,[0,0,0],'mm');T('▶',560,320,FS(26),[255,200,90],2,[0,0,0],'mm');T(`+${n}`,650,320,FS(30),n>=10?[255,170,60]:[120,200,255],3,[0,0,0],'mm');
  T(`強化${K[0]}`,420,372,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${K[2]}${enhFm(F0[K[1]])}  ▶  ${K[2]}${enhFm(F1[K[1]])}`,740,372,FN(17),[255,255,255],2,[0,0,0],'rm');
  if(AR){// W2.4：直接看強化前後的最大 HP 與等效血量（＝最大 HP ÷（1 − 受到傷害減免））
    const h0=enhHpCalc(),h1=enhHpCalc({[sl]:n}),d1=Math.min(0.6,GS.def+F1.def-F0.def);
    T('最大 HP',420,398,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${fmt(h0)}  ▶  ${fmt(h1)}`,740,398,FN(17),[150,235,150],2,[0,0,0],'rm');
    T('等效血量',420,424,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${fmt(enhEhp(h0,GS.def))}  ▶  ${fmt(enhEhp(h1,d1))}`,740,424,FN(17),[150,235,150],2,[0,0,0],'rm');
    T(`這一級 ${K[2]}${enhFm(F1.def-F0.def-(n===15?ENH2.arm15/100:0))}・HP +${enhFm(F1.hpLv-F0.hpLv)}・受到傷害上限 −60%`,420,448,FN(13),[190,180,160],2,[0,0,0],'lm');
    enhMsRows(sl,SE,420,470,'lm')}
  else{T('裝備本身',420,404,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${M[0]} ${M[1]}${it.v}%（不變）`,740,404,FN(15),[220,210,190],2,[0,0,0],'rm');
  T(`這一級 ${K[2]}${ST[n<=5?0:n<=10?1:2]}%`+(sl==='s'?'・閃避上限 25%':''),420,436,FN(14),[190,180,160],2,[0,0,0],'lm');
  enhMsRows(sl,SE,420,464,'lm')}
  T('失敗不會降級・強化等級與保底都存在裝備欄',420,536,FN(13),[190,180,160],2,[0,0,0],'lm');
  rrect(780,170,1140,560,10,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);T('刻印強化',960,200,FS(24),[255,236,200],3,[0,0,0],'mm');
  T(`強化至 +${n}：成功或失敗都會扣下面的${c.sh?'碎片和':''}金幣`,960,236,FN(15),[220,210,190],2,[0,0,0],'mm');
  T('成功機率',800,284,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.rate}%`+(N.rate&&ENH[n][0]<100?`（${ENH[n][0]}% +${N.rate}）`:''),1120,284,FN(20),c.rate>=50?[150,255,150]:[255,200,120],2,[0,0,0],'rm');
  T('刻印能量',800,326,FN(17),[214,172,84],2,[0,0,0],'lm');const f=c.pity?clamp(p/c.pity,0,1):0;rrect(900,316,1120,338,6,'rgba(0,0,0,0.6)','rgb(120,100,70)',1);if(f>0)rrect(902,318,902+216*f,336,5,f>=1?'rgb(255,190,60)':'rgb(110,180,255)');
  T(c.pity?`${p}/${c.pity}`:'—',1010,327,FN(13),[255,255,255],2,[0,0,0],'mm');if(c.pity&&p>=c.pity)T('能量已滿：下次必定成功！',960,360,FN(15),[255,210,90],2,[0,0,0],'mm');
  T('刻印碎片',800,396,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.sh}（持有 ${SAVE.shards}）`,1120,396,FN(17),SAVE.shards>=c.sh?[255,255,255]:[255,120,110],2,[0,0,0],'rm');
  T('金幣',800,430,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.gold.toLocaleString('en-US')}（持有 ${SAVE.gold.toLocaleString('en-US')}）`,1120,430,FN(17),SAVE.gold>=c.gold?[255,226,120]:[255,120,110],2,[0,0,0],'rm');
  if(npc==='cat')T('貓商人：金幣 7 折、成功率 +2%',960,462,FN(14),[255,170,60],2,[0,0,0],'mm');
  const busy=UI.res&&performance.now()-UI.res.t0<1100;const can=!busy&&SAVE.gold>=c.gold&&SAVE.shards>=c.sh;
  if(btn(840,492,1080,540,c.sh?`強化（碎片 ${c.sh}＋金幣）`:`強化（${c.gold.toLocaleString('en-US')} 金幣）`,can,[255,200,90])&&inp)aForgeTry(sl,npc);
  if(inp&&!busy&&press(['KeyJ','Enter','Space']))aForgeTry(sl,npc)}
window.forgeUI=(o=>function(inp){const npc=UI.npc||'prank';if(!SLOTS.some(x=>x[0]===UI.fsl))UI.fsl='w';
  if(UI.kind==='draw'||UI.kind==='rr'||UI.kind==='inh'||UI.kind==='up')return o.apply(this,arguments);
  if(UI.fsl==='w'){const r=o.apply(this,arguments);if(UI.kind!=='draw'&&UI.kind!=='rr'&&UI.kind!=='inh'&&UI.kind!=='up'){aForgeSel(inp);if(eqItem('w'))enhMsRows('w',slotE('w'),420,455,'lm')}return r}
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

// ---- src27/j_w23.js
// ===== W2.3 熱修：一鍵清除白裝／援助角色 自動・手動／老手加成（Lv55 以上）／捕捉搗蛋鬼 =====
// （詩人大招改回舊版、放完大招 0.5 秒無敵 → web/m22.js；強化 +15 加成 → src27/e_enh.js）

// ---------- 1) 一鍵清除白裝：只賣 白色（r===0）、沒裝備、沒上鎖／收藏 的裝備 ----------
const W23_BTN=[430,582,622,616];
const w23Keep=it=>!it||isEq(it)||!!(it.lk||it.lock||it.locked||it.fav||it.star);
function w23WhiteList(){return ((SAVE&&SAVE.inv)||[]).filter(i=>i&&i.r===0&&!w23Keep(i))}
function w23WhiteAsk(){const L=w23WhiteList();if(!L.length){UI.msg=['沒有可以清除的白色裝備',performance.now()];sfx('clank',0.2);return}
  UI.w23c={n:L.length,g:L.reduce((a,i)=>a+sellPrice(i),0),ids:L.map(i=>i.id),sel:0}}
function w23WhiteDo(){const c=UI.w23c;UI.w23c=null;if(!c)return 0;const L=w23WhiteList().filter(i=>c.ids.includes(i.id));if(!L.length)return 0;
  let g=0;for(const it of L)g+=sellPrice(it);SAVE.inv=SAVE.inv.filter(i=>!L.includes(i));SAVE.gold+=g;if(S0)S0.gold=SAVE.gold;
  UI.msg=[`清除 ${L.length} 件白色裝備　+${g.toLocaleString('en-US')} 金幣`,performance.now()];sfx('coin',0.5);m2Save();return L.length}
window.m21BagBtns=(o=>function(it,inp){const r=o.apply(this,arguments);if(UI.w23c)return r;const n=w23WhiteList().length,b=W23_BTN;
  if(btn(b[0],b[1],b[2],b[3],`一鍵清除白裝（${n}）`,n>0,[235,235,225])&&inp){w23WhiteAsk();return null}return r})(window.m21BagBtns);
window.m21BagKeys=(o=>function(inp){if(UI.w23c)return;const r=o.apply(this,arguments);if(inp&&press(['KeyH']))w23WhiteAsk();return r})(window.m21BagKeys);
window.m21Bag=(o=>function(inp){const c=UI.w23c;if(!c)return o.apply(this,arguments);o.call(this,false);
  X.save();X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(0,0,W,H);X.restore();panelBG(400,240,880,470);
  T('一鍵清除白裝',640,278,FS(26),[255,236,200],3,[0,0,0],'mm');
  T(`要賣掉 ${c.n} 件白色（一般）裝備嗎？`,640,322,FS(20),[255,255,255],2,[0,0,0],'mm');
  T(`可以得到 ${c.g.toLocaleString('en-US')} 金幣`,640,356,FN(18),[255,226,120],2,[0,0,0],'mm');
  T('裝備中、上鎖、收藏、綠色以上都不會動',640,384,FN(14),[200,230,200],2,[0,0,0],'mm');
  const ok=btn(460,412,630,454,'賣掉（J）',true,[255,120,90]),no=btn(650,412,820,454,'取消（Esc）',true);
  if(!inp)return;if(ok||press(['KeyJ','Enter']))w23WhiteDo();else if(no||press(['Escape','KeyI','KeyH']))UI.w23c=null})(window.m21Bag);
window.m2CloseUI=(o=>function(){UI.w23c=null;UI.pkSel=0;return o.apply(this,arguments)})(window.m2CloseUI);

// ---------- 2) 援助角色：自動／手動（存在 SAVE.opt.astAuto，預設 手動） ----------
const w23AstAuto=()=>!!(SAVE&&SAVE.opt&&SAVE.opt.astAuto);
function w23AstSet(v){if(!SAVE)return;SAVE.opt=SAVE.opt||{};SAVE.opt.astAuto=!!v;m2Save();if(typeof m21Toast==='function')m21Toast(v?'援助角色：自動（食物滿、附近有敵人時自動呼叫）':'援助角色：手動（按 V 呼叫）')}
// 自動呼叫的判斷：食物滿、援助冷卻好了、場上沒有援助角色、附近有首領 或 2 隻以上敵人 或 有敵人且自己 HP 低於一半
function w23AutoWant(){if(!w23AstAuto()||mode!=='play'||paused||UI.kind)return false;const s=S0,P=s&&s.P;if(!P||P.dead||P.hp<=0||s.trans||s.ritual)return false;const t=s.t;
  if(s.food<FOOD_MAX||s.bard||s.ally||s.arA||t<=(s.allyCD||0))return false;if(s.pkd)return false;
  const ms=(s.mobs||[]).filter(m=>!m.gone&&!m.dying&&m.kind!=='pillar');
  if(ms.some(m=>m.kind==='boss'&&Math.abs(m.x-P.x)<700))return true;
  const near=ms.filter(m=>Math.abs(m.x-P.x)<450&&Math.abs(m.y-P.y)<160).length;
  return near>=2||(near>=1&&P.hp<HPMAX*0.5)}
{const o=IN.sum;IN.sum=()=>o()||w23AutoWant()}
// 戰鬥畫面：援助圖示下面的小開關（點一下切換）
const W23_CHIP=[496,128,580,150];
window.drawHUD=(o=>function(cx0,shy){const r=o.apply(this,arguments);try{if(mode==='play'&&S0&&S0.P){const a=w23AstAuto(),b=W23_CHIP;
  rrect(b[0],b[1],b[2],b[3],8,a?'rgba(30,80,40,0.9)':'rgba(30,26,24,0.85)',a?'rgb(150,255,150)':'rgba(214,172,84,0.8)',2);T(a?'援助：自動':'援助：手動',(b[0]+b[2])/2,(b[1]+b[3])/2+1,FN(12),a?[200,255,200]:[230,220,200],2,[0,0,0],'mm');
  if(CLICK&&!paused&&!UI.kind&&inBox(CLICK,b)){w23AstSet(!a);CLICK=null}}}catch(e){}return r})(window.drawHUD);
// 設定畫面：多一列「援助角色」
window.m21SetUI=(o=>function(inp){const r=o.apply(this,arguments);const a=w23AstAuto();
  if(btn(490,450,790,492,`援助角色：${a?'自動':'手動（V）'}`,true,a?[150,255,150]:[255,236,200])&&inp)w23AstSet(!a);
  T(a?'自動：食物滿、冷卻好、附近有敵人或首領時自動呼叫（V 仍可手動）':'手動：食物滿時按 V（手機按「援助」）呼叫',640,512,FN(13),[220,210,190],2,[0,0,0],'mm');return r})(window.m21SetUI);

// ---------- 3) 老手加成：Lv55 以上每級 攻擊 +0.5%／HP +0.3%（上限 +10%／+6%，Lv75 滿）；等級上限低於 75 時按比例放大，最高等級剛好拿滿 ----------
const VET23={ref:55,full:75,atk:0.10,hp:0.06};
function vet23(L){L=L|0;const mx=Math.max(VET23.ref+1,Math.min(VET23.full,LV25.max)),n=clamp(L-VET23.ref,0,mx-VET23.ref),k=n/(mx-VET23.ref);
  return{atk:Math.round(VET23.atk*k*10000)/10000,hp:Math.round(VET23.hp*k*10000)/10000,perA:VET23.atk/(mx-VET23.ref),perH:VET23.hp/(mx-VET23.ref)}}
window.grow25=(o=>function(){const g=o.apply(this,arguments);const v=vet23(g.L);g.vet=v;g.lvHp+=v.hp;g.lvAtk+=v.atk;return g})(window.grow25);
window.m25Rows=(o=>function(){const R=o.apply(this,arguments);try{const v=vet23(SAVE.lv|0);if(v.atk>0){for(const r of R){if(r[0]==='體力 HP'&&r[2])r[2][5]=(r[2][5]&&r[2][5]!=='—'?r[2][5]+'　':'')+'老手 +'+(v.hp*100).toFixed(1)+'%';
  if(r[0]==='攻擊力'&&r[2])r[2][5]=(r[2][5]&&r[2][5]!=='—'?r[2][5]+'　':'')+'老手 +'+(v.atk*100).toFixed(1)+'%'}}}catch(e){}return R})(window.m25Rows);
window.charUI=(o=>function(inp){const r=o.apply(this,arguments);try{const v=vet23(SAVE.lv|0);if(v.atk>0&&(UI.tab|0)===0)T(`老手加成 +${(v.atk*100).toFixed(0)}%`,90,146,FN(12),[255,210,140],2,[0,0,0],'lm')}catch(e){}return r})(window.charUI);

// ---------- 4) 捕捉搗蛋鬼 ----------
// SAVE.pk23={n:遇到次數, cap:0/1 關在旅店籠子, alert:0/1 逃脫提示還沒看, esc:逃脫次數, win:捕捉次數}；舊存檔沒有 → 自動補
const PK23={need:10,esc:0.05,hp:3000000,spd:150,cd:[1.7,2.5],cd2:[1.15,1.8],blink:[3.4,4.8],hammer:0.13,spark:0.17,hr:72,
  cage:{x:800,y:592},spot:{n:'搗蛋鬼籠子',d:'搗蛋鬼：武器・防具強化',x:620,ax:800,ay:378,box:[720,392,880,598]}};
function pk23(){if(!SAVE)return{n:0,cap:0,alert:0,esc:0,win:0};let o=SAVE.pk23;if(!o||typeof o!=='object')o=SAVE.pk23={};
  o.n=Math.max(0,o.n|0);o.cap=o.cap?1:0;o.alert=o.alert?1:0;o.esc=o.esc|0;o.win=o.win|0;return o}
// 籠子在旅店的互動點
function pk23Spots(){const i=SPOTS.indexOf(PK23.spot),want=pk23().cap===1;if(want&&i<0)SPOTS.push(PK23.spot);else if(!want&&i>=0){SPOTS.splice(i,1);if(INN.spot>=SPOTS.length)INN.spot=0}}
function pk23CageIdx(){return SPOTS.indexOf(PK23.spot)}
// 逃脫：每次 進入／離開 旅店 各擲一次 5%
function pk23Roll(why,r){const p=pk23();if(!p.cap)return false;r=r==null?Math.random():r;if(r>=PK23.esc)return false;
  p.cap=0;p.n=0;p.alert=1;p.esc++;p.escAt=why;m2Save();pk23Spots();return true}
window.m2OpenMap=(o=>function(){const r=o.apply(this,arguments);try{if(mode==='map'){pk23Roll('in');pk23Spots();if(pk23().alert)PK23.alertT=performance.now()}}catch(e){}return r})(window.m2OpenMap);
window.m2Begin=(o=>function(st,d,bonus){try{pk23Roll('out')}catch(e){}return o.apply(this,arguments)})(window.m2Begin);
window.innGo=(o=>function(i){const c=pk23CageIdx();if(c>=0&&i===c){sfx('coin',0.35);m2UI('forge','prank');pk24Tip();return}return o.apply(this,arguments)})(window.innGo);
// W2.4：關在籠子裡的搗蛋鬼，每次打開強化都換一句「拐彎的強化提示」（自言自語、偷講秘密、發牢騷）
const PK24TIP=['偷偷說咧……衣服褲子每敲一下，身子就硬一點點咧，只是你沒在數咧。',
  '每敲滿一隻手的指頭數，樹木就「咚！」特別響一聲，那下補的力氣特別多咧！',
  '破布衣服再怎麼敲也就那樣咧；好料子每敲一下，都比破布多長一截肉咧。',
  '好料子不只長肉，挨打也比較不痛咧。你穿橘色那件時，走路特別囂張咧。',
  '敲之前、敲之後，木板上那兩行綠字瞄一眼，扛不扛得住就曉得咧。',
  '就算敲得跟鐵桶一樣硬，大傢伙發光的大招還是會啃掉你一大半咧！該滾就滾咧！',
  '說強化沒用的，都是敲三兩下就跑來抱怨的咧！敲到樹木認得你，才看得出來咧。',
  '噓……別光顧著敲咧，你自己長大，力氣跟血也會跟著長咧。兩邊一起來才實在咧。',
  '我在籠子裡空想咧：全身敲到冒金光，水晶怪的拳頭大概只會……還是會痛咧，痛得慢一點咧。'];
let PK24LAST=-1;
function pk24Tip(){try{let k=Math.floor(Math.random()*PK24TIP.length);if(k===PK24LAST)k=(k+1)%PK24TIP.length;PK24LAST=k;UI.pkTip=k}catch(e){}}
window.forgeUI=(o=>function(){let L0=null;try{if(UI.npc==='prank'&&UI.pkTip!=null&&pk23().cap&&NPCS.prank){L0=NPCS.prank.line;NPCS.prank.line=[[PK24TIP[UI.pkTip]||PK24TIP[0],null]]}}catch(e){}
  try{return o.apply(this,arguments)}finally{if(L0)NPCS.prank.line=L0}})(window.forgeUI);
window.m2CloseUI=(o=>function(){try{if(UI)UI.pkTip=null}catch(e){}return o.apply(this,arguments)})(window.m2CloseUI);
window.mapInput=(o=>function(){const p=pk23();if(p.alert&&!UI.kind){if((performance.now()-(PK23.alertT||0))/1000>1.2&&(IN.start()||IN.esc()||press(['KeyJ','Space','Enter'])||GPP.jump)){p.alert=0;m2Save()}return}const c=pk23CageIdx();if(c>=0&&!UI.kind){
    if(INN.spot===1&&(press(['ArrowRight','KeyD'])||GPP.r)){INN.spot=c;return}
    if(INN.spot===2&&(press(['ArrowLeft','KeyA'])||GPP.l)){INN.spot=c;return}
    if(INN.spot===c){if(press(['ArrowRight','KeyD'])||GPP.r){INN.spot=2;return}if(press(['ArrowLeft','KeyA'])||GPP.l){INN.spot=1;return}
      if(IN.start()||press(['KeyJ','Space'])||GPP.jump){innGo(c);return}}}
  return o.apply(this,arguments)})(window.mapInput);
// 籠子（粗線條＋明暗色塊）
function pk23Cage(x,y,broken,t){const W0=150,H0=176,x0=x-W0/2,x1=x+W0/2,top=y-H0;X.save();X.lineJoin='round';X.lineCap='round';
  X.fillStyle='rgba(30,14,6,0.45)';X.beginPath();X.ellipse(x,y+4,W0*0.62,13,0,0,Math.PI*2);X.fill();
  // 底座：深木＋亮面
  X.fillStyle='rgb(74,44,24)';X.fillRect(x0-8,y-26,W0+16,26);X.fillStyle='rgb(112,70,38)';X.fillRect(x0-8,y-26,W0+16,9);X.fillStyle='rgb(46,26,14)';X.fillRect(x0-8,y-6,W0+16,6);
  X.strokeStyle='rgb(28,14,6)';X.lineWidth=5;X.strokeRect(x0-8,y-26,W0+16,26);
  if(!broken){const fr=typeof npcFrame==='function'&&npcFrame('prank','idle',t);if(fr)spr(fr,x,y-24,{flip:Math.floor(t/2.4)%2===1})}
  // 圓頂
  X.fillStyle='rgba(60,40,24,0.18)';X.beginPath();X.moveTo(x0,y-26);X.lineTo(x0,top+40);X.quadraticCurveTo(x,top-38,x1,top+40);X.lineTo(x1,y-26);X.closePath();X.fill();
  const bars=7;for(let i=0;i<bars;i++){const bx=x0+i*(W0/(bars-1));let by=top+40-Math.sin(Math.PI*i/(bars-1))*32;let ex=bx,ey=y-26;
    if(broken&&(i===2||i===3)){ey=y-26;by=y-26-(i===2?70:52);ex=bx+(i===2?-26:30)}
    if(broken&&(i===2||i===3)){X.strokeStyle='rgb(30,22,18)';X.lineWidth=9;X.beginPath();X.moveTo(bx,y-26);X.lineTo(ex,by);X.stroke();X.strokeStyle='rgb(120,110,104)';X.lineWidth=4;X.beginPath();X.moveTo(bx-1,y-28);X.lineTo(ex-1,by+2);X.stroke();continue}
    X.strokeStyle='rgb(30,22,18)';X.lineWidth=9;X.beginPath();X.moveTo(bx,by);X.lineTo(ex,ey);X.stroke();
    X.strokeStyle='rgb(112,100,92)';X.lineWidth=4;X.beginPath();X.moveTo(bx-1,by+2);X.lineTo(ex-1,ey-2);X.stroke();
    X.strokeStyle='rgb(176,166,150)';X.lineWidth=1.5;X.beginPath();X.moveTo(bx-2,by+6);X.lineTo(ex-2,ey-8);X.stroke()}
  // 頂環＋橫箍
  X.strokeStyle='rgb(30,22,18)';X.lineWidth=10;X.beginPath();X.moveTo(x0,top+40);X.quadraticCurveTo(x,top-38,x1,top+40);X.stroke();
  X.strokeStyle='rgb(150,120,70)';X.lineWidth=4;X.beginPath();X.moveTo(x0+2,top+38);X.quadraticCurveTo(x,top-34,x1-2,top+38);X.stroke();
  for(const yy of [top+70,y-70]){if(broken&&yy>top+70){X.strokeStyle='rgb(30,22,18)';X.lineWidth=9;X.beginPath();X.moveTo(x0,yy);X.lineTo(x0+40,yy+6);X.moveTo(x1,yy);X.lineTo(x1-50,yy-4);X.stroke();continue}
    X.strokeStyle='rgb(30,22,18)';X.lineWidth=9;X.beginPath();X.moveTo(x0,yy);X.lineTo(x1,yy);X.stroke();X.strokeStyle='rgb(150,120,70)';X.lineWidth=3;X.beginPath();X.moveTo(x0+2,yy-1);X.lineTo(x1-2,yy-1);X.stroke()}
  X.strokeStyle='rgb(30,22,18)';X.lineWidth=7;X.beginPath();X.arc(x,top-8,11,Math.PI,0);X.stroke();X.strokeStyle='rgb(176,150,90)';X.lineWidth=3;X.beginPath();X.arc(x,top-8,11,Math.PI,0);X.stroke();
  // 鎖頭
  if(!broken){X.fillStyle='rgb(200,160,60)';X.strokeStyle='rgb(40,24,8)';X.lineWidth=4;X.fillRect(x+40,y-82,22,20);X.strokeRect(x+40,y-82,22,20);X.fillStyle='rgb(255,226,130)';X.fillRect(x+43,y-79,16,5)}
  else{X.fillStyle='rgb(200,160,60)';X.strokeStyle='rgb(40,24,8)';X.lineWidth=4;X.save();X.translate(x+64,y-10);X.rotate(0.9);X.fillRect(-11,-10,22,20);X.strokeRect(-11,-10,22,20);X.restore()}
  X.restore()}
window.drawMap=(o=>function(){const r=o.apply(this,arguments);try{if(mode!=='map')return r;const p=pk23(),t=performance.now()/1000,C=PK23.cage;
  if(p.cap||p.alert){pk23Cage(C.x,C.y,!p.cap,t);
    if(Math.abs(INN.x-C.x)<130)spr(innHero(t),INN.x,628,{flip:INN.face<0});
    if(p.cap){const c=pk23CageIdx(),sel=c>=0&&INN.spot===c&&!UI.kind;if(!sel)T('搗蛋鬼（被關住了）',C.x,C.y+18,FN(13),[230,210,255],2,[0,0,0],'mm')}}
  if(p.alert&&!UI.kind){const a=(performance.now()-(PK23.alertT||0))/1000;const k=0.75+0.25*Math.sin(t*6);
    rrect(340,300,940,380,12,'rgba(70,10,14,0.92)','rgb(255,120,110)',4);T('搗蛋鬼逃脫了！',640,328,FS(32),[255,236,200],4,[60,0,0],'mm',k);
    T('籠子被撬開了……牠回到野外了。再遇到 10 次就能再挑戰捕捉（點一下或按 Enter 關閉）',640,362,FN(14),[255,220,210],2,[0,0,0],'mm');
    if(a>1.2&&CLICK){p.alert=0;m2Save();CLICK=null}}}catch(e){}return r})(window.drawMap);
// 野外：被關住時不會出現；遇到次數＋1（第一次走到牠旁邊才算）
window.m2OnStage=(o=>function(n){const r=o.apply(this,arguments);try{const s=S0;if(s&&s.npc&&s.npc.k==='prank'&&pk23().cap)s.npc=null}catch(e){}return r})(window.m2OnStage);
window.m2Step=(o=>function(dt){const r=o.apply(this,arguments);try{const s=S0,n=s&&s.npc;if(n&&n.k==='prank'&&n.near&&!n.c23&&!s.pkd){n.c23=1;const p=pk23();p.n++;m2Save()}if(s&&s.pkd)pkStep(dt)}catch(e){console.log('pk23',e)}return r})(window.m2Step);
// 遇到 10 次以上：按 E 先問要不要挑戰（每次相遇問一次）
window.m2UI=(o=>function(kind,npc){const s=S0;if(kind==='forge'&&npc==='prank'&&mode==='play'&&s&&s.npc&&s.npc.k==='prank'&&!s.npc.asked&&pk23().n>=PK23.need&&!pk23().cap){s.npc.asked=1;
    const r=o.call(this,'forge','prank');UI.kind='pkask';UI.pkSel=0;return r}return o.apply(this,arguments)})(window.m2UI);
window.forgeUI=(o=>function(inp){if(UI.kind!=='pkask')return o.apply(this,arguments);
  X.save();X.fillStyle='rgba(0,0,0,0.55)';X.fillRect(0,0,W,H);X.restore();panelBG(380,190,900,500);
  if(typeof npcPortrait==='function')npcPortrait('prank',470,330);
  T('要挑戰搗蛋鬼嗎？',680,236,FS(30),[255,236,200],3,[60,20,10],'mm');
  T(`你已經遇到牠 ${pk23().n} 次了。`,560,286,FN(16),[255,244,214],2,[0,0,0],'lm');
  T('打贏就能把牠關進旅店的籠子，',560,316,FN(16),[255,244,214],2,[0,0,0],'lm');T('之後在旅店就能直接強化。',560,342,FN(16),[255,244,214],2,[0,0,0],'lm');
  T('打輸不會失去任何東西。',560,372,FN(15),[170,255,170],2,[0,0,0],'lm');
  const sel=UI.pkSel|0;const a=btn(440,420,630,470,(sel===0?'▶ ':'')+'挑戰（J）',true,[255,140,90]),b=btn(650,420,840,470,(sel===1?'▶ ':'')+'下次再說',true,[200,220,255]);
  if(!inp)return;if(press(['ArrowLeft','KeyA']))UI.pkSel=0;if(press(['ArrowRight','KeyD']))UI.pkSel=1;press(['Tab']);
  let go=a?0:b?1:press(['KeyJ','Enter','Space'])?(UI.pkSel|0):-1;
  if(go===0){m2CloseUI();pkStart()}else if(go===1){UI.kind='forge';UI.fresh=true}})(window.forgeUI);
// ----- 決鬥：搗蛋鬼（瞬移＋丟小鎚子＋火花橫掃，全部有預警；中等難度） -----
function pkStart(){const s=S0,t=s.t,P=s.P,n=s.npc;if(!n||s.pkd)return;
  for(const m of s.mobs)if(m.kind!=='boss'&&!m.gone){m.gone=true;puff(m.x,m.y-60,8,[220,210,200],40,0.4,3)}
  const m=mob('boss',clamp(n.x,s.cam+120,s.cam+W-120),clamp(n.y,YMIN+8,YMAX-8));m.hp=m.hpmax=PK23.hp;m.face=P.x<m.x?-1:1;m.enter=false;m.pk=1;s.mobs.push(m);
  s.pkd={t0:t,npc:n,hp0:P.hp,lock:s.lock,hits:0,hitW:t,blinkT:t+U(...PK23.blink),lose:false,end:null,res:null};s.npc=null;
  s.boss={pk:true,name:'搗蛋鬼（捕捉挑戰）',m,kneelUntil:-9,nextAtk:t+1.6,atk:null,enterT:t,hitT:-9,jh:0};s.lock=[s.cam,s.cam];s.bossT0=t;
  card('捕捉挑戰','把搗蛋鬼打到投降！',2.0);sub('搗蛋鬼','嘿嘿，想抓我咧？先追得上再說咧！',2.6);sfx('start',0.4)}
function pkPos(){const s=S0;return[s.cam+90,s.cam+W-90]}
function pkTele(x,y,r,dmg,dl,o={}){const s=S0,t=s.t;s.tele.push(Object.assign({x,y,r,t0:t,t1:t+dl,dmg,pk:1},o))}
function pkHurt(frac){const P=S0.P;return Math.round(HPMAX*frac/Math.max(0.5,DIF().dmg))}
function pkAttack(k){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P,ph2=m.hp<m.hpmax*0.5;
  if(k==='blink'){const [lo,hi]=pkPos();let side=Math.random()<0.5?-1:1;let tx=P.x+side*U(220,300);if(tx<lo||tx>hi){side=-side;tx=P.x+side*U(220,300)}tx=clamp(tx,lo,hi);const ty=clamp(P.y+U(-30,30),YMIN+6,YMAX-6);
    b.atk={k,t0:t,end:t+0.62,to:[tx,ty],from:[m.x,m.y]};sfx('ready',0.25)}
  else if(k==='hammer'){const n=ph2?3:2;b.atk={k,t0:t,end:t+0.55+0.22*n+0.4,n,thrown:0}}
  else{const f=P.x>=m.x?1:-1;m.face=f;b.atk={k,t0:t,end:t+1.3,y:m.y,x0:m.x,f,fired:false}}}
function pkStep(dt){const s=S0,b=s.boss,P=s.P,t=s.t,D=s.pkd;if(!D)return;
  if(D.end!=null){if(t>=D.end)pkFinish();return}
  if(!b||!b.pk||!b.m)return;const m=b.m;
  if(D.lose||P.dead){pkLose();return}
  if(m.dying)return;
  // 預警圈結算（只算 pk 的；W2.7：圓錐判定，只有外圈跳得過）
  for(const c of s.tele){if(!c.pk||c.done||t<c.t1)continue;c.done=true;puff(c.x,c.y,10,[255,200,120],c.r,0.4,3);s.fx.push({k:'ring',x:c.x,y:c.y,t0:t,col:[255,190,90]});
    if(!P.dead&&teleIn(c,P)){teleHurtP(c,P);P.hurtT=t}}
  s.tele=s.tele.filter(c=>!c.pk||t<c.t1+0.4);
  if(t-b.enterT<0.8||t<(m.frz||0)||t<b.kneelUntil){m.moving=false;return}
  const ph2=m.hp<m.hpmax*0.5;
  if(b.atk){const a=b.atk;m.moving=false;
    if(a.k==='blink'){if(!a.done&&t-a.t0>=0.45){a.done=1;puff(m.x,m.y-60,14,[200,150,255],60,0.5,3);m.x=a.to[0];m.y=a.to[1];puff(m.x,m.y-60,14,[200,150,255],60,0.5,3);m.face=P.x>=m.x?1:-1;sfx('jump',0.4)}}
    else if(a.k==='hammer'){while(a.thrown<a.n&&t-a.t0>=0.55+a.thrown*0.22){const i=a.thrown++;const lead=i===0?0:(i===1?1:-1)*U(70,120);
        pkTele(clamp(P.x+lead,s.cam+40,s.cam+W-40),clamp(P.y+U(-20,20)*(i?1:0),YMIN,YMAX),PK23.hr,pkHurt(PK23.hammer),0.78,{ham:1,sx:m.x,sy:m.y-90});sfx('swing',0.3)}}
    else if(a.k==='spark'){if(!a.fired&&t-a.t0>=0.7){a.fired=true;a.ft=t;sfx('crit',0.35);shake(6,0.2);
        const inX=(P.x-a.x0)*a.f>-30&&(P.x-a.x0)*a.f<620;if(inX&&Math.abs(P.y-a.y)<30&&P.h<60&&!P.dead){hurtP(pkHurt(PK23.spark),P.x,P.y-70);P.hurtT=t}}}
    if(t>=a.end){b.atk=null;const cd=ph2?PK23.cd2:PK23.cd;b.nextAtk=t+U(cd[0],cd[1])}return}
  // 走位：跟玩家保持 ~230 的距離，左右飄
  const want=P.x>=m.x?1:-1;m.face=want;const gx=P.x-want*230,ddx=gx-m.x,ddy=P.y-m.y,d=Math.hypot(ddx,ddy*1.6);m.moving=d>20;
  if(m.moving){const sp=PK23.spd*(ph2?1.2:1);m.x+=ddx/d*sp*dt;m.y+=ddy/d*sp*0.5*dt}const [lo,hi]=pkPos();m.x=clamp(m.x,lo,hi);m.y=clamp(m.y,YMIN+6,YMAX-6);
  // 被連打 5 下（2 秒內）或時間到 → 瞬移
  if(t-D.hitW>2){D.hitW=t;D.hits=0}
  if((D.hits>=5||t>=D.blinkT)&&!P.dead){D.hits=0;D.blinkT=t+U(...PK23.blink)*(ph2?0.8:1);pkAttack('blink');return}
  if(t>=b.nextAtk&&!P.dead){const near=Math.abs(P.x-m.x)<300&&Math.abs(P.y-m.y)<50;pkAttack(near?CH(['spark','hammer','spark']):CH(['hammer','hammer','spark']))}}
window.m2OnHit=(o=>function(m,mv,v,crit,hy){const r=o.apply(this,arguments);try{if(m&&m.pk&&S0.pkd){S0.pkd.hits++;S0.boss.hitT=S0.t}}catch(e){}return r})(window.m2OnHit);
// 打輸：最後一下不會倒，HP 回到開打前，搗蛋鬼跑掉（次數保留，下次再問）
window.m2Hurt=(o=>function(v,x){const r=o.apply(this,arguments);try{const s=S0,P=s&&s.P,D=s&&s.pkd;if(D&&D.end==null&&r>0&&r>=P.hp){D.lose=true;return Math.max(0,P.hp-1)}}catch(e){}return r})(window.m2Hurt);
function pkEnd(win){const s=S0,t=s.t,D=s.pkd,b=s.boss;D.res=win?'win':'lose';D.end=t+(win?2.0:1.6);s.tele=s.tele.filter(c=>!c.pk);if(b)b.atk=null}
function pkLose(){const s=S0,P=s.P,D=s.pkd,m=s.boss&&s.boss.m;pkEnd(false);P.hp=Math.max(P.hp,D.hp0);P.invU=Math.max(P.invU||0,s.t+2);
  if(m){m.dying=true;m.dieT=s.t+0.6;puff(m.x,m.y-60,18,[200,150,255],70,0.6,3)}card('挑戰失敗','搗蛋鬼溜走了……下次再挑戰',2.2);sub('搗蛋鬼','嘻嘻，抓不到咧～下次再來咧！',2.4)}
window.bossDie=(o=>function(m){const s=S0;if(s&&s.boss&&s.boss.pk){if(s.pkd&&s.pkd.res)return;const p=pk23();p.cap=1;p.alert=0;p.win++;p.n=0;m2Save();pkEnd(true);m.dieT=s.t+1.6;shake(12,0.5);sfx('ready',0.6);
    card('捕捉成功！','搗蛋鬼被關進旅店的籠子了',2.6);sub('搗蛋鬼','咧咧咧！我投降咧！強化還是可以找我咧……',2.8);return}return o.apply(this,arguments)})(window.bossDie);
function pkFinish(){const s=S0,D=s.pkd;if(!D)return;const m=s.boss&&s.boss.m;if(m){m.gone=true;m.dying=true}s.boss=null;s.lock=D.lock||null;s.tele=s.tele.filter(c=>!c.pk);
  if(D.res==='lose'&&!pk23().cap){const n=D.npc;n.asked=1;n.near=false;s.npc=n}else s.npc=null;s.pkd=null;s.respawnT=s.t+U(6,10)}
window.stepWaves=(o=>function(dt){if(S0&&S0.pkd)return;return o.apply(this,arguments)})(window.stepWaves);
window.stepBoss=(o=>function(dt){const s=S0;if(s&&s.boss&&s.boss.pk)return;return o.apply(this,arguments)})(window.stepBoss);
window.drawBoss=(o=>function(m,sx,sy){const s=S0,b=s&&s.boss;if(!(b&&b.pk))return o.apply(this,arguments);const t=s.t,a=b.atk;
  let al=1;if(m.dying){al=Math.max(0,1-(t-(m.dieT-1.6))/1.6)}if(a&&a.k==='blink'&&!a.done)al*=Math.floor(t*30)%2?0.35:1;
  const fr=npcFrame('prank',m.moving?'walk':'idle',t);shadowE(sx,sy,34);if(fr)spr(fr,sx,sy,{flip:m.face<0,flash:t<m.flash||t-b.hitT<0.08,alpha:al});
  // 預警
  if(a&&a.k==='blink'&&!a.done){const tx=a.to[0]-s.cam,u=(t-a.t0)/0.45;circ(tx,a.to[1],26+20*u,null,rgb([210,160,255],0.9),4);T('★',tx,a.to[1]-60,FS(26),[230,190,255],2,[40,0,60],'mm')}
  if(a&&a.k==='hammer'&&t-a.t0<0.55)T('！',sx,sy-170,FS(34),[255,220,80],4,[80,30,0],'mm');
  if(a&&a.k==='spark'){const x0=a.x0-s.cam,x1=x0+a.f*620,yy=a.y;if(!a.fired){const u=(t-a.t0)/0.7;X.save();X.globalAlpha=0.25+0.35*u;X.fillStyle='rgb(255,150,60)';X.fillRect(Math.min(x0,x1),yy-30,620,60);X.restore();
      X.save();X.strokeStyle='rgb(255,220,120)';X.lineWidth=4;X.strokeRect(Math.min(x0,x1),yy-30,620,60);X.restore();T('！',sx,sy-170,FS(34),[255,160,60],4,[80,30,0],'mm')}
    else if(t-a.ft<0.3){const u=(t-a.ft)/0.3;for(let i=0;i<14;i++){const xx=x0+a.f*620*((i/14+u)%1);circ(xx,yy+Math.sin(i*2.1+t*30)*12,5,'rgb(255,240,160)','rgb(255,140,40)',2)}}}
  if(m.dying&&s.pkd&&s.pkd.res==='win')T('投降！',sx,sy-170,FS(28),[255,236,160],3,[60,20,0],'mm')})(window.drawBoss);
// 丟出去的小鎚子（飛行中）
window.drawTele=(o=>function(cx0,shy){const r=o.apply(this,arguments);try{const s=S0,t=s.t;for(const c of s.tele){if(!c.ham||c.done)continue;const u=clamp((t-c.t0)/(c.t1-c.t0),0,1);
  const x=c.sx+(c.x-c.sx)*u-cx0,y=c.sy+(c.y-c.sy)*u-Math.sin(Math.PI*u)*160+shy;X.save();X.translate(x,y);X.rotate(t*14);X.fillStyle='rgb(120,80,50)';X.strokeStyle='rgb(30,16,8)';X.lineWidth=3;
  X.fillRect(-3,-2,6,22);X.strokeRect(-3,-2,6,22);X.fillStyle='rgb(170,170,180)';X.fillRect(-12,-12,24,12);X.strokeRect(-12,-12,24,12);X.restore()}}catch(e){}return r})(window.drawTele);
window.__pk23={PK24TIP,pk24Tip,pk23,pk23Roll,pk23Spots,vet23,w23WhiteList,w23WhiteAsk,w23WhiteDo,w23AutoWant,w23AstSet,pkStart,PK23};

// ---- src27/k_w25.js
// W2.5：賦魔繼承（符文覆蓋／替換）畫面只顯示符文的變化：A 目前符文、B 要移過去的符文、成功後「舊 → 新」＋增減（綠升紅降）
// 其他素質預設收起（「顯示全部素質」切換）；只換掉這個畫面的卡片內容，不動繼承邏輯
{const runeOf=it=>{if(!it||!it.rune)return null;const L=itemLines(it).find(x=>/符文$/.test(x[0]));const Rn=RUNES[it.rune.n];
    return {n:it.rune.n,g:it.rune.g,lab:L?L[0]:'符文',txt:L?L[1]:it.rune.n,col:L?L[2]:[230,220,200],v:Rn&&Array.isArray(Rn[2])?Rn[2][it.rune.g]:null,j:!!(Rn&&Rn[3]==='j')}};
  const desc=r=>r.txt.indexOf('：')>=0?r.txt.slice(r.txt.indexOf('：')+1):r.txt;
  const UP=[110,235,120],DN=[255,120,110],DIM=[160,150,140];
  const block=(r,x,y,w,head,hc,maxL)=>{T(head,x,y,FN(15),hc,2,[0,0,0],'lm');y+=22;
    if(!r){T('（沒有符文）',x,y,FS(17),DIM,2,[0,0,0],'lm');return y+24}
    T(r.lab+'　'+r.n,x,y,FS(20),r.col,2,[0,0,0],'lm');y+=26;
    for(const l of wrapT(desc(r),FN(16),w-8).slice(0,maxL||3)){T(l,x,y,FN(16),[235,228,215],2,[0,0,0],'lm');y+=21}return y+4};
  const card=(it,x,y,w0,title,mode,old)=>{const w=w0,wt=mode==='C'?w0:Math.min(w0,198);if(title)T(title,x,y-16,FN(14),[214,172,84],2,[0,0,0],'lm');rrect(x-6,y-4,x+w,y+214,8,'rgba(20,14,10,0.6)','rgba(150,120,70,0.7)',1);
    if(!it){T('（點下面的裝備選擇）',x+w/2-3,y+100,FN(14),[150,145,140],2,[0,0,0],'mm');return}
    gearCard(it,x,y+2,40,false);const nm=wrapT(RAR[it.r].st+itName(it),FS(15),w-52);nm.slice(0,2).forEach((l,i)=>T(l,x+48,y+12+i*18,FS(15),RAR[it.r].col,2,[0,0,0],'lm'));
    let yy=y+62;const r=runeOf(it);
    if(mode==='A')block(r,x,yy,wt,r?'目前符文（會被取代）':'目前符文',r?DN:[214,172,84]);
    else if(mode==='B')block(r,x,yy,wt,'要移過去的符文',UP);
    else{const o=old;if(o&&r&&o.n===r.n&&o.g===r.g){block(r,x,yy,w,'符文不變',DIM);return}
      if(o){T('舊：'+o.n,x,yy,FS(15),DIM,2,[0,0,0],'lm');const tw0=tw('舊：'+o.n,FS(15));X.fillStyle='rgb(255,120,110)';X.fillRect(x,yy,Math.min(tw0,w-8),2);yy+=22}
      yy=block(r,x,yy,w,'▼ 新符文',UP,o?2:3);
      // 增減：同名符文比數值；不同符文＝失去舊效果、得到新效果
      if(o&&r&&o.n===r.n&&o.v!=null&&r.v!=null){const d=Math.round((r.v-o.v)*10)/10;T(d>=0?`▲ +${d}%`:`▼ ${d}%`,x,Math.min(yy+4,y+202),FS(20),d>=0?UP:DN,2,[0,0,0],'lm')}
      else if(o&&yy<=y+186){const L=[];for(const [s,c] of [['− '+desc(o),DN],['＋ '+desc(r),UP]])for(const l of wrapT(s,FN(13),w-8))L.push([l,c]);const lh=Math.min(17,Math.floor((y+208-yy)/Math.max(1,L.length)));L.forEach(([l,c],i)=>T(l,x,yy+i*lh,FN(13),c,2,[0,0,0],'lm'))}}};
  window.m21Inh=(o=>function(inp,A,B){if(UI.inhAll)return o.apply(this,arguments);const S=window.m21Sum;const oldR=runeOf(A);
    window.m21Sum=(it,x,y,w,title)=>card(it,x,y,w,title,title==='A 目前'?'A':title&&title.startsWith('B ')?'B':'C',oldR);
    try{return o.apply(this,arguments)}finally{window.m21Sum=S}})(window.m21Inh);
  window.m21SmithUI=(o=>function(inp){const r=o.apply(this,arguments);if(UI.kind==='inh'){const on=!!UI.inhAll;if(btn(400,540,600,570,(on?'▼ ':'▶ ')+'顯示全部素質',true,on?[255,236,150]:[200,190,170])&&inp){UI.inhAll=!on;sfx('coin',0.2)}}return r})(window.m21SmithUI);
  window.__w25={runeOf}}

// W2.5：符文「輕快步伐」（GS.mvcd，三個角色都有效）依目前角色寫出實際受影響的招式和按法；數值不變（總上限 −50%）
window.W25MV=v=>{const k=typeof HEROK!=='undefined'?HEROK:'kudas';
  if(k==='bard')return `跪地滑行（→→）和跪地彈奏（↓↓）冷卻 −${v}%`;
  if(k==='archer')return `翼矛、箭雨、烈焰箭、後翻扇射、狙擊模式 冷卻 −${v}%`;
  return `肩撞（→→）和踱地（↓↓）冷卻 −${v}%`};
if(RUNES['輕快步伐'])RUNES['輕快步伐'][1]=v=>W25MV(v);

// ---- src27/l_w26.js
// W2.6：品階提升預覽顯示「成功時會抽的詞條」；裝備摘要卡內容多時自動縮行距，不再被切掉
(function(){
  const PH=[150,230,255];
  // 預覽用：it.__ph = 成功時會新增的隨機詞條數（只掛在預覽複本上，不會存進裝備）
  window.itemLines=(o=>it=>{const out=o(it);try{const n=it&&it.__ph|0;if(n>0){
      const names=new Set((it.lines||[]).map(([id])=>{const L=LINES.find(l=>l[0]===id);return L&&L[1]}));
      let at=-1;out.forEach((r,i)=>{if(names.has(r[0])&&r[2]&&r[2][0]===PH[0])at=i});
      if(at<0){at=out.findIndex(r=>r[0]==='魔法屬性'||/符文$/.test(r[0]));if(at<0)at=out.length;else at--}
      const add=[];for(let i=0;i<n;i++)add.push(['？ 隨機詞條','（成功時抽）',[120,200,255],'ph']);out.splice(at+1,0,...add)}
      if(it&&it.__phel){let at=out.findIndex(r=>/符文$/.test(r[0]));if(at<0)at=out.length;out.splice(at,0,['？ 魔法屬性','（成功時抽）',[120,200,255],'ph'])}
      if(it&&it.__ru){const [g0,g1]=it.__ru;const i=out.findIndex(r=>r[0]===`${RUNEG[g1]}色符文`);if(i>=0)out[i]=[`符文升級 ${RUNEG[g0]}→${RUNEG[g1]}`,out[i][1],out[i][2]]}}catch(e){}return out})(window.itemLines);
  window.m21Sum=function(it,x,y,w,title){if(title)T(title,x,y-16,FN(14),[214,172,84],2,[0,0,0],'lm');rrect(x-6,y-4,x+w,y+214,8,'rgba(20,14,10,0.6)','rgba(150,120,70,0.7)',1);
    if(!it){T('（點下面的裝備選擇）',x+w/2-3,y+100,FN(14),[150,145,140],2,[0,0,0],'mm');return}
    gearCard(it,x,y+2,48,false);const nm=wrapT(RAR[it.r].st+itName(it),FS(16),w-64);nm.slice(0,2).forEach((l,i)=>T(l,x+56,y+14+i*20,FS(16),RAR[it.r].col,2,[0,0,0],'lm'));
    T(`${RAR[it.r].n}・${SLOTN[it.t]}`,x+56,y+56,FN(12),[200,190,170],2,[0,0,0],'lm');
    const ent=itemLines(it).filter(([a])=>a!=='強化'&&a!=='賦魔');
    const rows=f=>{const R=[];for(const [a,b,c,k] of ent)for(const l of wrapT(a+'　'+b,f,w-6).slice(0,2))R.push([l,c,k]);return R};
    let f=FN(13),R=rows(f),y0=y+80,lh=18;
    if(R.length>8){f=FN(12);R=rows(f);y0=y+74;lh=Math.max(12,Math.floor((y+207-y0)/Math.max(1,R.length-1)))}
    let yy=y0;for(let i=0;i<R.length;i++){const [l,c,k]=R[i];if(yy>y+207){break}
      if(k==='ph'){X.fillStyle='rgba(120,200,255,0.12)';X.fillRect(x-2,yy-lh/2+1,w-4,lh-2)}
      T(l,x,yy,f,c,2,[0,0,0],'lm');yy+=lh}}

  // ---------- 每個鐵匠分頁：「？說明」按鈕＋完整說明面板（H 開關） ----------
  const fmt=v=>v.toLocaleString('en-US');const rn=r=>RAR[r].n+(RAR[r].st?' '+RAR[r].st:'');
  // W2.7：說明改成櫃台 NPC 的口吻（搗蛋鬼句尾「咧」、貓商人句尾「喵」）；數字一律從表格讀，跟實際規則一樣
  function helpOf(kind,npc){const cat=npc==='cat',E=cat?'喵':'咧',me=cat?'本喵':'我';
    if(kind==='forge'){const rows=[];let s=1;for(let n=1;n<=15;n++){const Q=ENH[n],nx=ENH[n+1];if(n<15&&nx&&nx[0]===Q[0]&&nx[1]===Q[1])continue;rows.push(`${s===n?'+'+n:'+'+s+'～+'+n} ${Q[0]}%${Q[1]?`（保底 ${Q[1]} 次）`:''}`);s=n+1}
      return [cat?'強化：讓裝備欄變強喵':'強化：讓裝備欄變強咧',[
        ['這頁做什麼',`${cat?'喵～':'嘿嘿，'}${me}幫你把左邊選的「部位」（武器、衣服、褲子、鞋子、戒指、項鍊）強化到 +1～+15${E}！強化等級記在部位上，不是記在那件裝備上${E}：換一件新裝備，+等級照樣保留${E}。每個角色各自一份${E}。`],
        ['花費',`每按一次強化都要付金幣${E}；+7 起還要刻印碎片（分解裝備就拿得到）${E}。不管成功還是失敗都要付${E}，${cat?'本喵概不退款':'付了就不退'}${E}。`],
        ['成功率（搗蛋鬼原價）',rows.join('、')+`。`+(cat?`在本喵這裡金幣打 7 折、成功率再 +2%（畫面上顯示的就是加完的）喵。`:`隔壁貓商人那邊金幣打 7 折、成功率 +2%，在我這裡是原價咧。`)],
        ['成功',`等級 +1，效果馬上生效${E}！+5／+10／+15 還有額外的里程碑效果（列在左下）${E}。`],
        ['失敗',`錢和碎片照扣${E}，但等級不會掉、裝備也不會壞${E}，「刻印能量」+1${E}。`],
        ['保底（刻印能量）',`+7 以上每一級各有一條能量${E}。失敗累積到保底次數（能量條滿）時，下一次一定成功${E}；那一級成功後能量歸零${E}。+1～+6 本來就一定成功，所以沒有保底${E}。`]]]}
    if(kind==='draw'){const o=DRAW_ODDS.map(([k,w])=>`${rn(k)} ${w}%`).join('、');
      return ['抽裝備：花金幣隨機拿一件喵',[
        ['這頁做什麼',`喵～每抽一次 ${fmt(DRAW_COST)} 金幣，本喵就隨機給你一件裝備，直接放進背包喵。每次遇到本喵最多抽 ${DRAW_MAX} 次喵。`],
        ['會抽到什麼',`獎池有 ${WPN.length+ARMS.reduce((s,t)=>s+GEAR[t].length,0)} 種裝備，每一種機率一樣喵（武器 ${WPN.length} 種、${ARMS.map(t=>SLOTN[t]+' '+GEAR[t].length+' 種').join('、')}）；武器一定是你現在這個角色能用的種類喵。品階機率：${o}喵。抽到${rn(4)} 的武器時，有 ${Math.round(SPSUB*100)}% 會是特殊武器喵。`],
        ['注意','沒有保底喵，每一抽都是獨立的喵。背包滿了（80 件）就不能抽喵，先去賣掉或分解喵。']]]}
    if(kind==='rr'){const L=fmt(RR_LINE.g),R=fmt(RR_RUNE.g);
      return [`重洗刻印：換掉一條詞條或符文${E}`,[
        ['這頁做什麼',`${cat?'喵～':'嘿嘿，'}先在上面選一件裝備，再在右邊選要重洗的「一條詞條」或「符文」${E}。${me}只會換掉你選的那一項，其他詞條、品階、強化等級都不動${E}。`],
        ['詞條',`隨機換成右邊清單裡的一種${E}（不會跟這件其他詞條重複，有可能抽回同一種），數值也重新隨機${E}；高品階裝備的詞條倍率照樣套用${E}。`],
        ['符文',`隨機換成這個部位能用的符文，符文顏色（紫／藍／綠）維持不變${E}；有 ${Math.round(JOKE_P*100)}% 會變成搞笑符文${E}${cat?'':'，嘻嘻'}。沒有符文的裝備會加一顆（紫約 15%、藍約 35%、綠約 50%）${E}；傳說裝備固定紫色${E}。`],
        ['花費',`詞條：碎片 ${RR_LINE.sh}＋${L} 金幣；符文：碎片 ${RR_RUNE.sh}＋${R} 金幣；夢幻：詞條 碎片 ${RRP[5][0].sh}＋${fmt(RRP[5][0].g)}、符文 碎片 ${RRP[5][1].sh}＋${fmt(RRP[5][1].g)}；傳說：詞條 碎片 ${RRP[6][0].sh}＋${fmt(RRP[6][0].g)}、符文 碎片 ${RRP[6][1].sh}＋${fmt(RRP[6][1].g)}${E}。`],
        ['成功／失敗',`一定成功、沒有失敗，也沒有保底${E}：每次都是重新隨機，洗到不喜歡的結果不能復原${E}。`]]]}
    if(kind==='inh')return [`賦魔繼承：把 B 的符文搬到 A${E}`,[
        ['A 和 B',`A＝你要留下來用的裝備（拿到新符文）${E}。B＝提供符文的材料，必須跟 A 同部位、身上有符文，而且不能是穿在身上的${E}。`],
        ['成功（'+INH.rate+'%）',`A 的符文變成 B 的符文，名稱、顏色、數值完全一樣${E}；A 原本的符文就消失了${E}。A 的品階、詞條、強化等級都不變${E}。`],
        ['失敗',`A 完全不變${E}，但 B 一樣會消失${E}${cat?'':'，別怪我'}。`],
        ['花費',`碎片 ${INH.sh}＋${fmt(INH.g)} 金幣${E}；A 或 B 是夢幻以上：碎片 12＋20,000 金幣${E}。成功或失敗都扣，B 都會被用掉${E}。沒有保底${E}。`],
        ['看哪裡',`中間「成功後的 A」只顯示符文的變化${E}；想看全部數值，按左下「顯示全部素質」${E}。`]]];
    if(kind==='up'){const rows=Object.keys(UPG).map(Number).sort((a,b)=>a-b).map(r=>{const U=UPG[r];return `${rn(r)} → ${rn(U.to)}：成功率 ${U.rate}%、保底 ${U.pity} 次、碎片 ${U.sh}＋${fmt(U.g)} 金幣`});
      return [`品階提升：把 A 升一個品階${E}`,[
        ['A 和 B',`A＝要升級的裝備${E}。B＝祭品：跟 A 同部位、而且是「升級後那個顏色」的裝備（例如升到英雄就要紫色的）${E}。特殊武器不能升級也不能當祭品，穿在身上的不能當祭品${E}。`],
        ['各品階',rows.join('；')+`；夢幻 → 傳說 不開放${E}。`],
        ['成功',`主屬性照新品階放大、原本的詞條數值一起變高${E}；詞條補到新品階的條數（新加的是隨機抽的，「成功後的 A」用「？ 隨機詞條」標出來）${E}；還沒有魔法屬性的武器會抽一個${E}；符文顏色升一級（綠→藍→紫，搞笑符文不變）${E}。強化等級記在部位上，不受影響${E}。`],
        ['失敗',`A 不會壞、也不會變${E}；祭品 B 會消失${E}；這件 A 的保底 +1${E}。`],
        ['保底',`保底記在 A 這件裝備上${E}。失敗次數累積到保底次數時，下一次一定成功${E}；成功後歸零${E}。`]]]}
    return null}
  const HELPK=['forge','draw','rr','inh','up'];
  function helpPanel(H){X.save();X.fillStyle='rgba(0,0,0,0.55)';X.fillRect(0,0,W,H0());X.restore();
    rrect(392,126,1156,652,12,'rgba(22,15,9,0.97)','rgb(214,172,84)',2);T(H[0],420,156,FS(24),[255,236,200],3,[0,0,0],'lm');
    let f=FN(15),lh=21,hf=FN(15);const lay=()=>{const out=[];for(const [h,b] of H[1]){out.push([h,1]);for(const l of wrapT(b,f,700))out.push([l,0]);out.push(['',2])}return out};
    let L=lay();if(L.length*lh>440){f=FN(14);lh=19;L=lay()}if(L.length*lh>440){f=FN(13);lh=17;L=lay()}
    let y=194;for(const [l,k] of L){if(k===2){y+=Math.round(lh*0.35);continue}T(l,k?420:432,y,k?FN(15):f,k?[255,206,110]:[232,224,210],2,[0,0,0],'lm');y+=lh}
    return btn(1000,138,1140,172,'關閉（H）',true,[255,236,150])}
  const H0=()=>typeof H!=='undefined'?H:720;
  window.m2UI=(o=>function(){UI.help=false;return o.apply(this,arguments)})(window.m2UI);
  window.m2Overlay=(o=>function(){const k=UI.kind,ok=UI.npc&&HELPK.includes(k);
    if(ok&&UI.help){const H=helpOf(k,UI.npc);if(H){UI.fresh=true;const r=o.apply(this,arguments);const inp=true;
        const cl=helpPanel(H);if(cl||press(['KeyH','Escape'])){UI.help=false}CLICK=null;for(const q of ['KeyH','Escape','Tab','KeyJ','Enter','Space'])delete KP[q];return r}}
    const inp=!UI.fresh;const r=o.apply(this,arguments);
    if(ok&&UI.kind===k&&helpOf(k,UI.npc)){if((btn(1080,88,1150,118,'？說明',true,[150,230,255])&&inp)||(inp&&press(['KeyH']))){UI.help=true;CLICK=null}}
    if(ok&&UI.kind==='rr'&&k==='rr')T('選一件裝備 → 選一條詞條或符文 → 隨機換成新的（只換選的那一項，其他不動）',400,281,FN(13),[220,210,190],2,[0,0,0],'lm');
    return r})(window.m2Overlay);
  window.__w26help={helpOf};
})();

// ---- src27/m_w27.js
// ===== W2.7 =====
//  (1) 背包「裝備比較」：選到（或滑鼠指到）一件還沒穿的裝備 → 右邊並排比較「目前穿的」和「這件」，左邊角色總能力顯示「換上前 → 換上後」
//      比較是「假裝換上、算完、馬上換回來」：SAVE.eq／最大 HP／目前 HP 都會還原，不存檔、不改任何數值
//  (2) 紅圈落地保護：被紅圈在空中打到／打倒 → 落地或起身時 0.4 秒保護（在 game.js 的 teleHurtP 標記，這裡每格檢查）
window.stepPlayer=(o=>function(dt){const s=S0,P=s&&s.P,h0=P?P.h:0;const r=o.apply(this,arguments);try{if(P&&P.tlArm)teleLandStep(P,h0)}catch(e){}return r})(window.stepPlayer);
(function(){
const UPC=[110,235,120],DNC=[255,120,110],NEU=[225,215,195],GRY=[165,158,146],GOLD=[214,172,84];
const NUMRE=/^([+\-−×]?)(\d+(?:\.\d+)?)(%?)$/,RNGRE=/^(\d+)~(\d+)$/;
function pv(s){s=String(s==null?'':s).trim();let m=s.match(RNGRE);if(m)return {k:'r',a:+m[1],b:+m[2],d:0};m=s.match(NUMRE);if(m){const dp=(m[2].split('.')[1]||'').length;return {k:'n',p:m[1]==='-'?'−':m[1],v:+m[2],u:m[3],d:dp}}return null}
const fx=(v,d)=>{v=Math.abs(v);return d?v.toFixed(d):String(Math.round(v))};
// 比兩個數值：回傳 {up:true/false, tx:'▲ +3%'}；沒變回傳 null。數字越大越好（受到傷害是「減少量」，一樣越大越好）
function cmpv(a,b){if(!a&&!b)return null;const A=a||(b&&(b.k==='r'?{k:'r',a:0,b:0}:{k:'n',p:b.p,v:0,u:b.u,d:b.d})),B=b||(a.k==='r'?{k:'r',a:0,b:0}:{k:'n',p:a.p,v:0,u:a.u,d:a.d});
  if(A.k!==B.k)return null;
  if(A.k==='r'){const da=B.a-A.a,db=B.b-A.b;if(!da&&!db)return null;const sg=x=>(x<0?'−':'+')+Math.abs(x);const up=da+db>0;return {up,tx:(up?'▲ ':'▼ ')+sg(da)+'~'+sg(db)}}
  const d=Math.max(A.d,B.d),dv=+(B.v-A.v).toFixed(d);if(!dv)return null;const up=dv>0,p=A.p||B.p;
  const sg=p==='−'?(up?'−':'+'):(up?'+':'−');return {up,tx:(up?'▲ ':'▼ ')+sg+fx(dv,d)+(A.u||B.u)}}
// 角色總能力（statRows 的字串）比較：魔法屬性這種文字 → 只標「變了」
function cmpStat(a,b){if(a===b)return null;const r=cmpv(pv(a),pv(b));return r||{up:null,tx:'≠'}}
const key=l=>/符文$/.test(l)?'符文':l;
function lineMap(L){const m=new Map();for(const r of L){let k=key(r[0]);while(m.has(k))k+='#';m.set(k,r)}return m}
function snapshot(){const P=S0&&S0.P;return {had:null,HM:HPMAX,HC:HEAL_CAP,hp:P?P.hp:null}}
// 假裝換上 → 算出換上後的能力和這件的說明行 → 換回來
function simEquip(it){const sl=it.t,E=SAVE.eq,had=Object.prototype.hasOwnProperty.call(E,sl),prev=E[sl],sn=snapshot(),P=S0&&S0.P;let out=null;
  try{E[sl]=it.id;calcGS();out={rows:statRows(),hp:HPMAX,L:itemLines(it)}}
  finally{if(had)E[sl]=prev;else delete E[sl];calcGS();HPMAX=sn.HM;HEAL_CAP=sn.HC;if(P&&sn.hp!=null)P.hp=sn.hp}return out}
let CK=null,CV=null;
function buildCmp(it){if(!it||isEq(it))return null;const sl=it.t,cur=eqItem(sl);
  const k=[it.id,JSON.stringify(SAVE.eq),window.slotE?slotE(sl):0,HEROK,SAVE.inv.length,HPMAX].join('|');if(k===CK&&CV)return CV;
  let C;if(it.t==='w'&&typeof wcOf==='function'&&wcOf(it)!==heroCls()){const W=WCLS[wcOf(it)];C={it,cur,sl,blocked:`這是${W.who}專用的${W.n}，${HERO[HEROK].n}不能裝備`}}
  else{const L0=cur?itemLines(cur):[],before={rows:statRows(),hp:HPMAX},after=simEquip(it);
    const M0=lineMap(L0),M1=lineMap(after.L),keys=[...M1.keys(),...[...M0.keys()].filter(x=>!M1.has(x))];const num=[],txt=[];
    for(const kk of keys){const a=M0.get(kk),b=M1.get(kk),pa=a&&pv(a[1]),pb=b&&pv(b[1]);
      if((a?pa:true)&&(b?pb:true)&&(pa||pb)&&(!pa||!pb||pa.k===pb.k))num.push({l:kk.replace(/#+$/,''),a:a?a[1]:'—',b:b?b[1]:'—',c:(b||a)[2],d:cmpv(pa,pb)});
      else txt.push({l:kk.replace(/#+$/,''),a:a?(a[0]!==kk&&key(a[0])==='符文'?a[0]+'　'+a[1]:a[1]):null,b:b?(key(b[0])==='符文'?b[0]+'　'+b[1]:b[1]):null,c:(b||a)[2]})}
    const st=before.rows.map((r,i)=>{const b=after.rows[i]?after.rows[i][1]:r[1];return {l:r[0],a:r[1],b,d:cmpStat(r[1],b)}});
    C={it,cur,sl,num,txt,st,hp0:before.hp,hp1:after.hp,se:window.slotE?slotE(sl):0}}
  CK=k;CV=C;return C}
const nmOf=it=>(RAR[it.r].st?RAR[it.r].st+' ':'')+itName(it);
// 右邊比較面板（x0..x1, y0..yB）；字級自動縮小，保證不重疊
function layout(C,F,lh,w){const ops=[];// 每一項：[種類, 行數, 資料]
  ops.push(['th',1]);for(const r of C.num)ops.push(['num',1,r]);
  for(const r of C.txt){const same=r.a!=null&&r.a===r.b;let la,lb;if(same){la=wrapT('兩件相同：'+r.a,F,w);lb=[]}else{la=r.a==null?[]:wrapT('目前：'+r.a+(r.b==null?'（換上後就沒有了）':''),F,w);lb=r.b==null?[]:wrapT((r.a==null?'這件才有：':'這件：')+r.b,F,w)}ops.push(['txt',1+la.length+lb.length,{r,la,lb,same}])}
  const ft=[];if(C.se)ft.push(`強化 +${C.se} 記在「${SLOTN[C.sl]||'欄位'}」上：換上這件照樣是 +${C.se}`);
  if(C.hp1!==C.hp0)ft.push(`最大 HP ${C.hp0.toLocaleString('en-US')} → ${C.hp1.toLocaleString('en-US')}`);
  for(const s of ft)ops.push(['ft',wrapT(s,F,w).length,wrapT(s,F,w)]);
  return {ops,n:ops.reduce((a,o)=>a+o[1],0)+0.6*(C.txt.length?1:0)+(ft.length?0.4:0)}}
function drawCmp(C,hover,x0,y0,x1,yB){
  T(hover?'預覽：滑鼠指著的裝備（點一下選取）':'換上這件會怎樣？',x0,y0+6,FN(14),hover?[180,220,255]:[255,226,120],2,[0,0,0],'lm');
  const half=(x1-x0-8)/2;
  [[C.cur,'目前穿的',x0],[C.it,'這件',x0+half+8]].forEach(([it,lb,bx])=>{rrect(bx,y0+18,bx+half,y0+80,6,'rgba(30,22,18,0.75)',lb==='這件'?'rgba(255,226,120,0.8)':'rgba(150,120,70,0.7)',1);
    T(lb,bx+6,y0+28,FN(11),lb==='這件'?[255,226,120]:GRY,2,[0,0,0],'lm');
    if(it){gearCard(it,bx+5,y0+38,36,false);wrapT(nmOf(it),FN(11),half-50).slice(0,3).forEach((l,k)=>T(l,bx+46,y0+44+k*13,FN(11),RAR[it.r].col,2,[0,0,0],'lm'))}
    else T('目前沒有裝備',bx+half/2,y0+56,FN(12),[200,190,170],2,[0,0,0],'mm')});
  let y=y0+90;
  if(C.blocked){wrapT(C.blocked,FN(14),x1-x0).forEach(l=>{T(l,x0,y+8,FN(14),DNC,2,[0,0,0],'lm');y+=22});return}
  const W=x1-x0;const SZ=[[13,18],[12,16],[11,14],[10,12.5],[9,11]];let F,lh,Lo;
  for(const [fs,h] of SZ){F=FN(fs);lh=h;Lo=layout(C,F,lh,W-8);if(Lo.n*lh<=yB-y)break}
  const cx1=x0+Math.round(W*0.47),cx2=x0+Math.round(W*0.70);let maxL=Math.floor((yB-y)/lh);
  const row=(tx,x,col,al)=>T(tx,x,y+lh/2,F,col,2,[0,0,0],al);
  for(const [k,n,d] of Lo.ops){if(maxL<=0)break;
    if(k==='th'){row('項目',x0,GRY,'lm');row('目前',cx1,GRY,'rm');row('這件',cx2,GRY,'rm');row('變化',x1,GRY,'rm');y+=lh;maxL--}
    else if(k==='num'){const lab=wrapT(d.l,F,cx1-x0-tw('00~00',F)-8)[0];row(lab,x0,GOLD,'lm');row(d.a,cx1,[230,225,215],'rm');row(d.b,cx2,d.c||NEU,'rm');
      row(d.d?d.d.tx:'＝',x1,d.d?(d.d.up?UPC:DNC):GRY,'rm');y+=lh;maxL--}
    else if(k==='txt'){if(d===Lo.ops.find(o=>o[0]==='txt')[2]){y+=lh*0.6}row(d.r.l,x0,GOLD,'lm');y+=lh;maxL--;
      for(const l of d.la){if(maxL<=0)break;row(l,x0+8,d.same?GRY:[200,192,180],'lm');y+=lh;maxL--}
      for(const l of d.lb){if(maxL<=0)break;row(l,x0+8,d.r.c||NEU,'lm');y+=lh;maxL--}}
    else if(k==='ft'){if(d===Lo.ops.find(o=>o[0]==='ft')[2])y+=lh*0.4;for(const l of d){if(maxL<=0)break;const hp=/^最大 HP/.test(l);row(l,x0,hp?(C.hp1>C.hp0?UPC:DNC):[255,220,120],'lm');y+=lh;maxL--}}}
  C.lay={F,lh,yEnd:y,fit:Lo.n*lh<=yB-(y0+90)}}
// 背包：決定要比較哪一件（滑鼠指著的優先，其次是選中的），把右邊說明換成比較面板，左邊總能力顯示「前 → 後」
function hoverIdx(L){if(typeof MOUSE==='undefined'||!MOUSE)return -1;const mx=MOUSE.x,my=MOUSE.y;if(!(mx>=GX&&my>=GY))return -1;
  const c=Math.floor((mx-GX)/GC),r=Math.floor((my-GY)/GC);if(c<0||c>=GCOLS||r<0||r>=GROWS)return -1;if(mx-GX-c*GC>GC-6||my-GY-r*GC>GC-6)return -1;const i=r*GCOLS+c;return i<L.length?i:-1}
window.bagUI=(o=>function(inp){let C=null,hover=false;
  try{const L=bagList(),sel=L[clamp(UI.sel,0,Math.max(0,L.length-1))],hi=W27.noHover?-1:hoverIdx(L);let tgt=sel;
    if(hi>=0&&L[hi]&&L[hi]!==sel&&!isEq(L[hi])){tgt=L[hi];hover=true}
    if(tgt&&!isEq(tgt))C=buildCmp(tgt)}catch(e){C=null;(window.__err=window.__err||[]).push('w27cmp: '+e)}
  W27.cur=C;if(!C)return o.apply(this,arguments);
  const oD=window.itemDetail,oS=window.statRows;
  window.itemDetail=function(it,x0,y0,x1){if(x0===935&&y0===130)return drawCmp(C,hover,935,130,1190,552);return oD.apply(this,arguments)};
  if(C.st)window.statRows=()=>C.st.map(r=>[r.l,r.d?`${r.a} → ${r.b}`:r.a]);
  let r;try{r=o.apply(this,arguments)}finally{window.itemDetail=oD;window.statRows=oS}
  if(C.st){T(hover?'▲▼＝換上「指著的裝備」後的總能力':'▲▼＝換上選中的裝備後的總能力',96,336,FN(12),[180,220,255],2,[0,0,0],'lm');
    C.st.forEach((s,i)=>{if(s.d)T(s.d.up==null?'◆':s.d.up?'▲':'▼',88,348+i*19,FN(12),s.d.up==null?[255,226,120]:s.d.up?UPC:DNC,2,[0,0,0],'mm')})}
  return r})(window.bagUI);
const W27=window.__w27={buildCmp,simEquip,drawCmp,cmpv,pv,noHover:false,cur:null};
})();

// ---- src27/n_w28food.js
// W2.8：寵物糧食先存著（寵物系統上線前，先讓玩家累積一點，現在還沒有用途）
//  - 食物槽 3/3、或援助角色在場時撿到的烤麵包（原本只記一行字就浪費掉）→ 存成「剩食麵包」
//  - 撿到「基本草藥」→ 35% 變成 1 個「零食材料」（其餘照舊只是一行字）
//  - 存在 SAVE.pet.bread／SAVE.pet.snackMat（寵物系統之後直接讀這兩個欄位，見 design/pet_system_zh.md 附錄 B「SAVE.pet」）
//  - 先存上限：剩食麵包 300、零食材料 30（到上限就不再增加；不會把已經有的數量往下砍，寵物系統上線後可以存到 999）
//  - 舊存檔沒有 SAVE.pet：讀的時候當 0；第一次撿到才建立欄位（舊存檔內容一個字都不會變）
//  - 共用：放在存檔最上層（不在 PERK 裡），換角色不會分開算
//  - 畫面：只在背包下方加一個小計數＋一句話，不另外公告
const W28F={cap:{bread:300,snackMat:30},herbMat:0.35,
  say:'「先存著，以後會有小傢伙用得到喔。」',sayFull:'「先存這麼多就好，剩下的留給以後吧。」'};
function w28PetN(k){try{const p=SAVE&&SAVE.pet;const v=p&&typeof p==='object'?+p[k]:0;return v>0&&isFinite(v)?Math.floor(v):0}catch(e){return 0}}
// 加 n 個（不超過先存上限；已經超過上限的不動）。回傳實際加了幾個
function w28PetAdd(k,n){if(!SAVE||!(n>0))return 0;const cap=W28F.cap[k],cur=w28PetN(k);if(cur>=cap)return 0;
  if(!SAVE.pet||typeof SAVE.pet!=='object'||Array.isArray(SAVE.pet))SAVE.pet={};
  const add=Math.min(n,cap-cur);SAVE.pet[k]=cur+add;return add}
// 撿東西：飛進「背包」的烤麵包＝浪費掉的那份 → 存起來；基本草藥 → 機率變零食材料
window.stepLoot=(o=>function(dt){const s=S0;let pend=null;
  try{if(s&&s.fly&&SAVE)pend=s.fly.filter(f=>!f.done&&(f.k==='food'||f.k==='herb'))}catch(e){pend=null}
  const r=o.apply(this,arguments);
  if(pend&&pend.length)try{for(const f of pend){if(!f.done)continue;
      let txt=null;
      if(f.k==='food'&&f.dst==='bag'){txt=w28PetAdd('bread',1)?'烤麵包 → 剩食麵包 +1（存起來了）':null}
      else if(f.k==='herb'&&Math.random()<W28F.herbMat){txt=w28PetAdd('snackMat',1)?'基本草藥 → 零食材料 +1（存起來了）':null}
      if(txt){const L=s.log;for(let i=L.length-1;i>=0&&i>=L.length-8;i--){const e=L[i];if(e&&e[1]===f.k&&typeof e[2]==='string'&&e[2].startsWith('獲得 ')&&!e.w28){e[2]=txt;e.w28=1;break}}}}}
    catch(e){(window.__err=window.__err||[]).push('w28food: '+e)}
  return r})(window.stepLoot);
// 背包：中間下方一個小框（不能點，只顯示）
function w28FoodBox(){const b=w28PetN('bread'),m=w28PetN('snackMat'),full=b>=W28F.cap.bread&&m>=W28F.cap.snackMat;
  const x0=632,y0=582,x1=904,y1=624;rrect(x0,y0,x1,y1,8,'rgba(40,30,20,0.85)','rgba(214,172,84,0.55)',1);
  const ic=(n,x)=>{const im=IMG[n];if(!im)return;X.save();X.imageSmoothingEnabled=false;const sc=18/Math.max(im.width,im.height);X.drawImage(im,x,y0+4,Math.round(im.width*sc),Math.round(im.height*sc));X.restore()};
  ic('i_food',x0+8);T(`剩食麵包 ${b}`,x0+30,y0+13,FN(13),b>=W28F.cap.bread?[255,226,120]:[255,240,210],2,[0,0,0],'lm');
  ic('i_herb',x0+142);T(`零食材料 ${m}`,x0+164,y0+13,FN(13),m>=W28F.cap.snackMat?[255,226,120]:[255,240,210],2,[0,0,0],'lm');
  T(full?W28F.sayFull:W28F.say,(x0+x1)/2,y0+32,FN(12),[214,190,150],2,[0,0,0],'mm')}
window.bagUI=(o=>function(inp){const r=o.apply(this,arguments);try{if(SAVE)w28FoodBox()}catch(e){(window.__err=window.__err||[]).push('w28box: '+e)}return r})(window.bagUI);
window.__w28food={cfg:W28F,n:w28PetN,add:w28PetAdd};

// ---- src27/o_w29keys.js
// ===== W2.9：改按鍵（鍵盤）＋電腦版畫面按鍵（技能格）位置 =====
// 做法：遊戲內部一律用「原本的鍵名」（虛擬鍵）；玩家實際按的鍵先換算成虛擬鍵再交給遊戲。
// 沒改過的玩家：完全照舊（換算＝原樣）。觸控按鍵、手把、測試用的 __key 不經過換算。
const W29KS='erinn_keys',W29HS='erinn_pchud';
const W29ROWS=[
 ['往左',['ArrowLeft','KeyA']],['往右',['ArrowRight','KeyD']],['往上（縱深）',['ArrowUp','KeyW']],['往下（縱深）',['ArrowDown','KeyS']],
 ['攻擊／確定',['KeyJ','KeyZ']],['跳躍',['Space']],['@K',['KeyK']],['@L',['KeyL','KeyX']],
 ['後跳／翻滾',['ShiftLeft','ShiftRight']],['召喚／援助',['KeyV']],['互動',['KeyE','KeyF']],['背包',['KeyI']],
 ['角色',['KeyC']],['演奏／說明',['KeyH']],['解除變身',['KeyT']],['暫停',['Escape','KeyP']],
 ['回地圖（暫停中）',['KeyQ']],['靜音',['KeyM']],['錄影',['F9']],['換曲（旅店）',['KeyB']],
 ['賣綠色（背包）',['KeyG']],['搗蛋鬼藥水',['KeyU']],['惡魔貓藥水',['KeyY']],['按鍵設定',['KeyO']]];
const W29NOTE={KeyJ:'選單裡也是「確定」',KeyX:'背包裡也是「賣掉」、鍛造裡是「清除」',KeyC:'背包裡也是「分解」',KeyH:'也用來看說明、清白裝',
  KeyA:'鍛造、選單裡的左右也跟著改',KeyD:'鍛造、選單裡的左右也跟著改',KeyO:'在暫停選單、說明頁打開這個畫面',Escape:'Esc 固定不能改（另一格可以加一個鍵）'};
const W29FIX=new Set(['Escape']);
const W29LIST=new Set(W29ROWS.flatMap(r=>r[1]));
const W29OK=/^(Key[A-Z]|Digit\d|Numpad\d|Numpad(Add|Subtract|Multiply|Divide|Decimal)|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right)|Comma|Period|Slash|Minus|Equal|Backslash|IntlRo|IntlYen|Insert|Delete|Home|End|PageUp|PageDown|F9)$/;
let W29M={},W29INV={},W29CH=false;
function w29Lab(p){if(!p)return '—';if(p.startsWith('Key'))return p.slice(3);if(p.startsWith('Digit'))return p.slice(5);
  const N={Space:'Space',ShiftLeft:'Shift',ShiftRight:'右Shift',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Escape:'Esc',Comma:',',Period:'.',Slash:'/',Minus:'-',Equal:'=',Backslash:'\\',
    IntlRo:'ろ',IntlYen:'¥',Insert:'Ins',Delete:'Del',Home:'Home',End:'End',PageUp:'PgUp',PageDown:'PgDn',NumpadAdd:'數字+',NumpadSubtract:'數字-',NumpadMultiply:'數字*',NumpadDivide:'數字/',NumpadDecimal:'數字.'};
  if(N[p])return N[p];if(p.startsWith('Numpad'))return '數字'+p.slice(6);return p}
function w29Build(){W29INV={};W29CH=false;for(const v of W29LIST){const p=W29M[v]||v;W29M[v]=p;W29INV[p]=v;if(p!==v)W29CH=true}W29RWC.clear();W29RX=null}
function w29Load(){W29M={};try{const o=JSON.parse(localStorage.getItem(W29KS)||'null');if(o&&o.v===1&&o.b){const seen=new Set();let bad=false;
    for(const v of W29LIST){const p=o.b[v]||v;if(!(p===v||W29OK.test(p))||W29FIX.has(v)&&p!==v||seen.has(p))bad=true;seen.add(p);W29M[v]=p}if(bad)W29M={}}}catch(e){W29M={}}w29Build()}
function w29Save(){const b={};for(const v of W29LIST)if(W29M[v]!==v)b[v]=W29M[v];try{if(Object.keys(b).length)localStorage.setItem(W29KS,JSON.stringify({v:1,b}));else localStorage.removeItem(W29KS)}catch(e){}}
// 實體鍵 → 虛擬鍵（null＝不理會）
window.w29Key=function(e){if(!e.isTrusted)return e.code;if(W29.open||HE.open||(window.__mobEdit&&__mobEdit.on))return null;const p=e.code;if(!W29CH)return p;
  const v=W29INV[p];if(v){if(v!==p){const t=e.target;if(!(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))e.preventDefault()}return v}
  if(W29LIST.has(p))return null;return p};
// 畫面上的按鍵文字：照目前的設定換掉（只有改過才會動）
const W29TOK={J:'KeyJ',Z:'KeyZ',K:'KeyK',L:'KeyL',X:'KeyX',V:'KeyV',E:'KeyE',F:'KeyF',I:'KeyI',C:'KeyC',H:'KeyH',T:'KeyT',P:'KeyP',Q:'KeyQ',M:'KeyM',G:'KeyG',U:'KeyU',Y:'KeyY',O:'KeyO',Space:'Space',Shift:'ShiftLeft',F9:'F9'};
const W29RWC=new Map();let W29RX=null,W29NORW=0;
function w29Tok(t){if(t==='WASD')return ['KeyW','KeyA','KeyS','KeyD'].map(v=>w29Lab(W29M[v])).join('');if(t==='方向鍵')return ['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].every(v=>W29M[v]===v)?t:['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].map(v=>w29Lab(W29M[v])).join('');
  if(t==='B')return w29Lab(W29M.KeyB);return w29Lab(W29M[W29TOK[t]])}
window.w29Rw=function(s){if(!W29CH||W29NORW||typeof s!=='string'||!s)return s;if(mode==='manual'&&/^(X|A|B|Y|LB|RB|Back|左搖桿|—)$/.test(s))return s;
  const c=W29RWC.get(s);if(c!==undefined)return c;
  if(!W29RX){const tk=Object.keys(W29TOK).filter(t=>W29M[W29TOK[t]]!==W29TOK[t]);if(['KeyW','KeyA','KeyS','KeyD'].some(v=>W29M[v]!==v))tk.push('WASD');if(['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].some(v=>W29M[v]!==v))tk.push('方向鍵');
    if(W29M.KeyB!=='KeyB')tk.push('B(?= 換曲)');tk.sort((a,b)=>b.length-a.length);W29RX=tk.length?new RegExp('(^|[^A-Za-z0-9.])('+tk.join('|')+')(?![A-Za-z0-9])','g'):/$^/}
  const r=s.replace(W29RX,(m,a,t)=>a+w29Tok(t));if(W29RWC.size>3000)W29RWC.clear();W29RWC.set(s,r);return r};
window.keyBadge=(o=>function(x,y,k,w){const l=w29Rw(k);W29NORW++;try{return o.call(this,x,y,l,w)}finally{W29NORW--}})(window.keyBadge);
window.m21Toast=(o=>function(s,...r){return o.call(this,w29Rw(s),...r)})(window.m21Toast);
// ---------- 技能格位置（電腦版畫面按鍵） ----------
const W29TID={J:'atk',K:'k',L:'l',Space:'jump','K+L':'kl','J+K':'jk'};
const W29TN={atk:'攻擊',k:'技能 K',l:'技能 L',jump:'跳躍',kl:'K+L 大招',jk:'J+K 絕招',dodge:'後跳／翻滾',chg:'肩撞',stp:'踱地',idea:'樂想',flip:'扇射',rain:'箭雨'};
let W29HUD=(()=>{try{const o=JSON.parse(localStorage.getItem(W29HS)||'null');if(o&&o.v===1&&o.h&&typeof o.h==='object')return o}catch(e){}return {v:1,h:{}}})();
let W29REG={},W29DEP=0;
function w29Ov(id){const src=HE.open?HE.d:W29HUD,h=(src.h||{})[HEROK]||{};return h[id]}
window.w29Tile=function(id,x,y,r){if(W29DEP>0)return 0;W29REG[id]={x,y,r};const o=w29Ov(id);if(!o)return 0;
  const s=Math.max(0.7,Math.min(1.5,o.s||1)),nx=o.x!=null?o.x*W:x,ny=o.y!=null?o.y*H:y;if(s===1&&Math.abs(nx-x)<0.01&&Math.abs(ny-y)<0.01)return 0;
  X.save();X.translate(nx,ny);X.scale(s,s);X.translate(-x,-y);W29DEP++;return 1};
window.w29TileEnd=()=>{W29DEP=Math.max(0,W29DEP-1)};
window.skillTile=(o=>function(cx,cy,R,g,col,key,...r){const w=hudTB(W29TID[key]||String(key),cx,cy,R);try{return o.call(this,cx,cy,R,g,col,key,...r)}finally{hudTE(w)}})(window.skillTile);
function w29TilePos(id){const d=W29REG[id];if(!d)return null;const o=w29Ov(id)||{},s=Math.max(0.7,Math.min(1.5,o.s||1));return {id,x:o.x!=null?o.x*W:d.x,y:o.y!=null?o.y*H:d.y,r:d.r*s,s,d}}
function w29Clamp(id,x,y){const d=W29REG[id],o=w29Ov(id)||{},R=d.r*Math.max(0.7,Math.min(1.5,o.s||1))+4;return [Math.max(R+4,Math.min(W-R-4,x)),Math.max(R+8,Math.min(606,y))]}
// ---------- 狀態 ----------
const W29={open:false,sel:0,cap:false,msg:'',mc:null,mt:0,rst:0,from:''};
const HE={open:false,d:null,sel:null,drag:null,msg:'',ty:0};
let W29RAW={};
addEventListener('keydown',e=>{if(!e.isTrusted)return;
  if(W29.open||HE.open){const nav=/^(Arrow\w+|Space|Tab|Enter|NumpadEnter|Backspace|Escape|Minus|Equal|NumpadAdd|NumpadSubtract)$/.test(e.code);if(nav||W29.cap&&W29OK.test(e.code))e.preventDefault();
    if(W29.cap&&W29.open){e.stopPropagation();if(!e.repeat)w29Capture(e.code);return}if(!e.repeat||/^Arrow/.test(e.code))W29RAW[e.code]=1}},true);
w29Load();
// ---------- 改鍵 ----------
function w29RowName(r){const hk=typeof HEROK==='string'?HEROK:'kudas';if(r[0]==='@K')return '技能 K（'+({kudas:'心臟刺擊',bard:'三連音',archer:'翼矛'}[hk]||'技能')+'）';
  if(r[0]==='@L')return '技能 L（'+({kudas:'大劍術',bard:'旋律衝擊',archer:'烈焰箭'}[hk]||'技能')+'）';return r[0]}
function w29VName(v){const r=W29ROWS.find(r=>r[1].includes(v));return r?w29RowName(r):v}
function w29Slot(i){const r=W29ROWS[i>>1];return r?r[1][i&1]||null:null}
function w29Msg(s,c){W29.msg=s;W29.mc=c||null;W29.mt=performance.now()}
function w29Capture(p){const v=w29Slot(W29.sel);W29.cap=false;
  if(p==='Escape'){w29Msg('沒有改變');return}
  if(!v||W29FIX.has(v)){w29Msg('這一格固定不能改',[255,150,140]);return}
  if(!W29OK.test(p)){W29.cap=true;w29Msg(`「${p.replace(/^(Key|Digit)/,'')}」不能用（固定按鍵），請換一個鍵`,[255,150,140]);return}
  const old=W29M[v];if(p===old){w29Msg(`「${w29VName(v)}」維持 ${w29Lab(p)}`);return}
  const own=W29INV[p];if(own&&own!==v&&W29FIX.has(own)){w29Msg('這個鍵固定給「暫停」用，請換一個鍵',[255,150,140]);W29.cap=true;return}
  if(own&&own!==v){W29M[own]=old;w29Msg(`${w29Lab(p)} 原本是「${w29VName(own)}」，已互換：「${w29VName(own)}」改成 ${w29Lab(old)}`,[255,214,120])}
  else w29Msg(`「${w29VName(v)}」改成 ${w29Lab(p)}`,[150,255,150]);
  W29M[v]=p;w29Build();w29Save();try{sfx('coin',0.35)}catch(e){}}
function w29CanOpen(){return (mode==='play'&&paused&&pauseWhy==='esc')||mode==='manual'||(typeof UI==='object'&&UI&&UI.kind==='set')}
function w29Open(){W29.open=true;W29.cap=false;W29.rst=0;W29.from=mode;w29Msg('');window.__w29ui=1;for(const k in K)K[k]=0;W29RAW={};try{sfx('coin',0.3)}catch(e){}}
function w29Close(){W29.open=false;W29.cap=false;window.__w29ui=0;for(const k in K)K[k]=0;for(const k in KP)delete KP[k]}
window.w29OpenKeys=()=>{if(!W29.open)w29Open();return true};
const W29BX={def:[80,604,290,646],hud:[310,604,640,646],close:[1000,604,1200,646],cancel:[660,604,820,646]};
function w29SlotBox(i){const row=i>>1,c=row<12?0:1,rr=row%12,x0=c?668:78,y=112+rr*38;return [x0+(i&1?378:262),y,x0+(i&1?488:372),y+32]}
function w29InStage(){return mode==='play'&&S0&&S0.P}
function w29Touch(){return !!(window.__mob&&__mob.im==='touch')}
function w29Draw(){const t=performance.now()/1000;W29NORW++;try{
  X.fillStyle='rgba(0,0,0,0.92)';X.fillRect(0,0,W,H);woodPanel(40,14,1240,706);
  T('按鍵設定',640,46,FS(30),[255,236,200],3,[0,0,0],'mm');
  T(W29.cap?'請按新的按鍵（Esc 取消）':'點一下按鍵格，再按想要的新按鍵　　↑↓←→ 選擇　Enter 修改　Esc 關閉',640,84,FN(15),W29.cap?[255,226,120]:[230,220,200],2,[0,0,0],'mm');
  for(const c of [0,1]){const x0=c?668:78;T('動作',x0,100,FN(13),[255,210,140],2,[0,0,0],'lm');T('按鍵 1',x0+317,100,FN(13),[255,210,140],2,[0,0,0],'mm');T('按鍵 2',x0+433,100,FN(13),[255,210,140],2,[0,0,0],'mm')}
  W29ROWS.forEach((r,ri)=>{const c=ri<12?0:1,x0=c?668:78,y=112+(ri%12)*38;if((W29.sel>>1)===ri)rrect(x0-8,y-3,x0+496,y+35,6,'rgba(255,220,140,0.10)');
    T(w29RowName(r),x0,y+16,FS(16),[255,244,214],2,[0,0,0],'lm');
    for(const j of [0,1]){const i=ri*2+j,v=r[1][j],b=w29SlotBox(i),sel=W29.sel===i,hov=MOUSE&&inBox(MOUSE,b);
      if(!v){continue}
      const fix=W29FIX.has(v),chg=W29M[v]!==v,cap=sel&&W29.cap;
      rrect(b[0],b[1],b[2],b[3],6,fix?'rgb(44,40,38)':cap?(Math.floor(t*3)%2?'rgb(140,96,30)':'rgb(100,68,24)'):hov?'rgb(120,82,36)':'rgb(70,46,24)',sel?'rgb(255,226,120)':fix?'rgb(90,86,80)':chg?'rgb(150,230,150)':'rgb(170,120,60)',sel?3:2);
      T(cap?'按新鍵…':w29Lab(W29M[v]),(b[0]+b[2])/2,(b[1]+b[3])/2+1,FN(cap?14:17),fix?[150,145,140]:chg?[180,255,180]:[255,255,255],2,[0,0,0],'mm');
      if(fix)T('固定',b[2]-6,b[1]+8,FN(10),[170,160,150],0,[0,0,0],'rm')}});
  // 訊息列
  const v=w29Slot(W29.sel);let m=W29.msg,mc=W29.mc||[235,230,220];if(!m||performance.now()-W29.mt>9000){m=v?(W29NOTE[v]?`「${w29VName(v)}」：${W29NOTE[v]}`:`「${w29VName(v)}」目前是 ${w29Lab(W29M[v])}`):'';mc=[220,210,190]}
  T(m,640,580,FN(15),mc,2,[0,0,0],'mm');
  const rs=W29.rst&&performance.now()-W29.rst<4000;
  btn(...W29BX.def,rs?'再按一次確認':'恢復預設',true,rs?[255,160,140]:null);
  const st=w29InStage(),tl=w29Touch()?'調整觸控按鍵位置':'調整畫面按鍵位置';btn(...W29BX.hud,tl,st);
  if(W29.cap)btn(...W29BX.cancel,'取消',true);
  btn(...W29BX.close,'關閉（Esc）',true);
  T(st?'拖曳畫面上的技能格／觸控按鍵，換位置、調大小':'畫面按鍵位置：進入關卡後按 Esc 暫停，再從這裡調整',475,664,FN(13),[200,190,170],2,[0,0,0],'mm');
  T('Esc、Enter、Tab、音量鍵 [ ] ; \' 固定不能改　手把不受影響　設定存在這台裝置',640,690,FN(13),[200,190,170],2,[0,0,0],'mm')}finally{W29NORW--}}
function w29Input(){const R=W29RAW,G=typeof GPP==='object'?GPP:{};
  if(W29.cap){if(CLICK&&inBox(CLICK,W29BX.cancel)){W29.cap=false;w29Msg('沒有改變')}else if(KP.Escape){W29.cap=false;w29Msg('沒有改變')}return}
  if(R.Escape||KP.Escape||G.esc){w29Close();return}
  const n=W29ROWS.length*2,ok=i=>!!w29Slot(i);const mv=d=>{let i=W29.sel;for(let k=0;k<n;k++){i=(i+d+n)%n;if(ok(i))break}W29.sel=i};
  if(R.ArrowDown||G.d){let i=W29.sel+2;if(i>=n)i=W29.sel%2;W29.sel=i;if(!ok(W29.sel))W29.sel&=~1}
  if(R.ArrowUp||G.u){let i=W29.sel-2;if(i<0)i=n-2+(W29.sel%2);W29.sel=i;if(!ok(W29.sel))W29.sel&=~1}
  if(R.ArrowRight||G.r){const row=W29.sel>>1;if(W29.sel%2===0&&ok(W29.sel+1))W29.sel++;else{const nr=row<12?row+12:row-12;W29.sel=Math.min(nr,W29ROWS.length-1)*2}}
  if(R.ArrowLeft||G.l){const row=W29.sel>>1;if(W29.sel%2===1)W29.sel--;else{const nr=row<12?row+12:row-12;const r2=Math.min(nr,W29ROWS.length-1);W29.sel=r2*2+(ok(r2*2+1)?1:0)}}
  if(R.Enter||R.NumpadEnter){const v=w29Slot(W29.sel);if(v&&W29FIX.has(v))w29Msg('這一格固定不能改',[255,150,140]);else if(v){W29.cap=true;w29Msg('')}}
  if(R.Backspace)w29Reset();
  if(R.Tab)w29Layout();
  if(CLICK){for(let i=0;i<n;i++){if(!ok(i))continue;if(inBox(CLICK,w29SlotBox(i))){W29.sel=i;const v=w29Slot(i);if(W29FIX.has(v))w29Msg('這一格固定不能改',[255,150,140]);else{W29.cap=true;w29Msg('')}return}}
    if(inBox(CLICK,W29BX.def))w29Reset();else if(inBox(CLICK,W29BX.hud))w29Layout();else if(inBox(CLICK,W29BX.close))w29Close()}}
function w29Reset(){if(!(W29.rst&&performance.now()-W29.rst<4000)){W29.rst=performance.now();w29Msg('再按一次「恢復預設」就會把所有按鍵改回原本的設定',[255,214,120]);return}
  W29.rst=0;W29M={};w29Build();w29Save();w29Msg('已恢復預設按鍵',[150,255,150]);try{sfx('coin',0.35)}catch(e){}}
function w29Layout(){if(!w29InStage()){w29Msg('進入關卡後按 Esc 暫停，再從這裡調整按鍵位置',[255,214,120]);return}
  if(w29Touch()&&window.__mobEdit){W29.open=false;window.__w29ui=0;if(!__mobEdit.open(()=>{w29Open()}))w29Open();return}
  heOpen()}
// ---------- 電腦版：拖曳技能格 ----------
function heOpen(){W29.open=false;window.__w29ui=0;HE.open=true;HE.d=JSON.parse(JSON.stringify(W29HUD));HE.sel=null;HE.drag=null;HE.msg='';HE.ty=236;W29RAW={}}
function heClose(save){if(save){W29HUD=HE.d;try{localStorage.setItem(W29HS,JSON.stringify(W29HUD))}catch(e){}}HE.open=false;HE.d=null;HE.drag=null;
  try{m21Toast(save?'已儲存畫面按鍵位置':'已取消，畫面按鍵位置沒有改變')}catch(e){}w29Open();w29Msg(save?'已儲存畫面按鍵位置':'畫面按鍵位置沒有改變',save?[150,255,150]:null)}
function heSet(id,o){const h=HE.d.h||(HE.d.h={}),a=h[HEROK]||(h[HEROK]={});a[id]=Object.assign(a[id]||{},o)}
function heTiles(){return Object.keys(W29REG).map(w29TilePos).filter(Boolean)}
function heBad(){const L=heTiles(),S=new Set();const bag={id:'bag',x:1218,y:574,r:34};for(let i=0;i<L.length;i++){const a=L[i];if(Math.hypot(a.x-bag.x,a.y-bag.y)<a.r+bag.r)S.add(a.id);
    for(let j=i+1;j<L.length;j++){const b=L[j];if(Math.hypot(a.x-b.x,a.y-b.y)<(a.r+b.r)*0.92){S.add(a.id);S.add(b.id)}}}return S}
function hePanel(){return [440,HE.ty,840,HE.ty+212]}
const heInPanel=p=>p&&inBox(p,hePanel());
function heSize(id,s){const o=w29Ov(id)||{};const d=W29REG[id];if(!d)return;heSet(id,{s:Math.round(Math.max(0.7,Math.min(1.5,s))*20)/20});const P=w29TilePos(id);const [x,y]=w29Clamp(id,P.x,P.y);heSet(id,{x:x/W,y:y/H})}
let HEP=null;
cv.addEventListener('pointerdown',e=>{if(!HE.open)return;const p=cvPos(e);if(heInPanel(p))return;let best=null,bd=1e9;
  for(const t of heTiles()){const d=Math.hypot(p[0]-t.x,p[1]-t.y);if(d<t.r+8&&d<bd){bd=d;best=t}}
  if(best){HE.sel=best.id;HE.drag={pid:e.pointerId,ox:p[0]-best.x,oy:p[1]-best.y};try{cv.setPointerCapture(e.pointerId)}catch(_){}}else HE.sel=null;HEP=p});
cv.addEventListener('pointermove',e=>{if(!HE.open||!HE.drag||e.pointerId!==HE.drag.pid)return;const p=cvPos(e),D=HE.drag;const [x,y]=w29Clamp(HE.sel,p[0]-D.ox,p[1]-D.oy);heSet(HE.sel,{x:x/W,y:y/H})});
for(const t of ['pointerup','pointercancel'])cv.addEventListener(t,e=>{if(HE.drag&&e.pointerId===HE.drag.pid){HE.drag=null;try{cv.releasePointerCapture(e.pointerId)}catch(_){}}});
function heDraw(){const bad=heBad(),L=heTiles();
  for(const t of L){const sel=HE.sel===t.id;X.save();X.setLineDash(sel?[]:[5,4]);X.beginPath();X.arc(t.x,t.y,t.r+6,0,Math.PI*2);X.strokeStyle=bad.has(t.id)?'rgb(255,90,70)':sel?'rgb(127,216,255)':'rgba(255,236,190,0.75)';X.lineWidth=sel?3:2;X.stroke();X.restore()}
  // 面板：被技能格壓到就換到上面
  const hit=y=>L.some(t=>t.x+t.r>440&&t.x-t.r<840&&t.y+t.r>y&&t.y-t.r<y+212);if(!HE.drag&&hit(HE.ty)){const alt=HE.ty===236?40:236;if(!hit(alt))HE.ty=alt}
  const [x0,y0,x1,y1]=hePanel();W29NORW++;try{rrect(x0,y0,x1,y1,10,'rgba(16,10,8,0.92)',rgb(GOLDC),2);
  T('調整畫面按鍵位置',640,y0+24,FS(20),[255,236,200],3,[0,0,0],'mm');T('用滑鼠拖曳技能格，選好之後可以調大小',640,y0+50,FN(14),[230,220,200],2,[0,0,0],'mm');
  const sel=HE.sel&&W29REG[HE.sel]?HE.sel:null,s=sel?(w29Ov(sel)||{}).s||1:1;
  if(btn(x0+40,y0+66,x0+90,y0+100,'－',!!sel)&&sel){heSize(sel,s-0.1);CLICK=null}
  if(btn(x0+310,y0+66,x0+360,y0+100,'＋',!!sel)&&sel){heSize(sel,s+0.1);CLICK=null}
  rrect(x0+100,y0+70,x0+300,y0+96,6,'rgba(0,0,0,0.55)','rgb(150,110,60)',1);if(sel){X.fillStyle='rgba(214,172,84,0.6)';X.fillRect(x0+102,y0+72,Math.round(196*(s-0.7)/0.8),22)}
  T(sel?`大小 ${Math.round(s*100)}%`:'大小（先點一個技能格）',x0+200,y0+84,FN(14),sel?[255,255,255]:[170,160,150],2,[0,0,0],'mm');
  if(sel&&CLICK&&inBox(CLICK,[x0+100,y0+66,x0+300,y0+100])){heSize(sel,0.7+0.8*(CLICK[0]-x0-100)/200);CLICK=null}
  const m=HE.msg||(bad.size?'紅框的技能格疊在一起了（或壓到背包），不過還是可以儲存':sel?`已選「${W29TN[sel]||sel}」`:'點一下技能格來選擇');
  T(m,640,y0+120,FN(14),bad.size&&!HE.msg?[255,150,140]:[220,210,190],2,[0,0,0],'mm');
  if(btn(x0+16,y0+140,x0+128,y0+180,'恢復預設',true)){const h=HE.d.h||{};delete h[HEROK];HE.sel=null;HE.msg='已恢復預設（按「儲存」才會生效）';CLICK=null}
  if(btn(x0+144,y0+140,x0+256,y0+180,'取消（Esc）',true)){CLICK=null;heClose(false);return}
  if(btn(x0+272,y0+140,x0+384,y0+180,'儲存（Enter）',true,[150,255,150])){CLICK=null;heClose(true);return}
  T('Tab 換選擇　方向鍵 微調　－／＋ 大小',640,y0+198,FN(12),[190,180,160],2,[0,0,0],'mm')}finally{W29NORW--}
  const R=W29RAW;if(R.Escape){heClose(false);return}if(R.Enter||R.NumpadEnter){heClose(true);return}if(R.Backspace){const h=HE.d.h||{};delete h[HEROK];HE.sel=null;HE.msg='已恢復預設（按「儲存」才會生效）'}
  if(R.Tab&&L.length){const ids=L.map(t=>t.id);HE.sel=ids[(ids.indexOf(HE.sel)+1)%ids.length];HE.msg=''}
  if(HE.sel&&W29REG[HE.sel]){const P=w29TilePos(HE.sel);let dx=(R.ArrowRight?4:0)-(R.ArrowLeft?4:0),dy=(R.ArrowDown?4:0)-(R.ArrowUp?4:0);if(dx||dy){const [x,y]=w29Clamp(HE.sel,P.x+dx,P.y+dy);heSet(HE.sel,{x:x/W,y:y/H})}
    if(R.Equal||R.NumpadAdd)heSize(HE.sel,P.s+0.1);if(R.Minus||R.NumpadSubtract)heSize(HE.sel,P.s-0.1)}}
// 預覽：畫遊戲畫面＋HUD（不前進時間）
function w29Preview(){if(!(mode==='play'&&S0&&S0.P)){X.fillStyle='#000';X.fillRect(0,0,W,H);return}W29REG={};const [cx0,shy]=drawWorld();drawHUD(cx0,shy)}
// ---------- 接到主迴圈 ----------
(()=>{const st=document.createElement('style');st.textContent='body.w29hide #cloudChip{visibility:hidden!important}';document.head.appendChild(st)})();
let W29HID=false;
window.frame=(o=>function(now){const med=!!(window.__mobEdit&&__mobEdit.on);
  {const h=!!(W29.open||HE.open||med);if(h!==W29HID){W29HID=h;document.body.classList.toggle('w29hide',h)}}
  if(!W29.open&&!HE.open&&!med){try{if(KP.KeyO&&w29CanOpen()){delete KP.KeyO;w29Open()}}catch(e){}if(!W29.open)return o.apply(this,arguments)}
  requestAnimationFrame(frame);last=now;try{pollPad()}catch(e){}
  try{if(med)w29Preview();else if(HE.open){w29Preview();heDraw()}else{w29Draw();w29Input()}}catch(e){(window.__err=window.__err||[]).push('w29 '+e)}
  for(const k in KP)delete KP[k];CLICK=null;W29RAW={}})(window.frame);
// ---------- 入口：暫停選單／設定（匯出、匯入並排，多一列「按鍵設定」）、說明頁 ----------
window.m21OptRows=function(x0,y0,inp){const o=m24Opt();let hit=false;
  const vrow=(y,lab,w)=>{const on=o[w],v=o[w+'V'];const c=on?[150,255,150]:[255,150,140];
    if(btn(x0,y,x0+54,y+42,'－',true)&&inp){m24Vol(w,-10);hit=true}
    if(btn(x0+60,y,x0+240,y+42,`${lab}：${on?v+'%':'關'}`,true,c)&&inp){m21Mute(w);hit=true}
    if(btn(x0+246,y,x0+300,y+42,'＋',true)&&inp){m24Vol(w,10);hit=true}
    const bw=168,bx=x0+66,by=y+35;X.fillStyle='rgba(0,0,0,0.5)';X.fillRect(bx,by,bw,4);const f=on?v/100:0;X.fillStyle=rgb(on?[70,150,70]:[120,70,60]);X.fillRect(bx,by,Math.round(bw*f),4);X.fillStyle=rgb(on?[150,240,150]:[200,120,110]);X.fillRect(bx,by,Math.round(bw*f),2)};
  vrow(y0,'音樂','mus');vrow(y0+50,'音效','sfx');
  {const y=y0+100;if(btn(x0,y,x0+300,y+42,REC.on?'停止錄影（F9）':'開始錄影（F9）',true,REC.on?[255,120,110]:[255,236,200])&&inp){REC.on?m21RecStop():m21RecStart();hit=true}m21CamIcon(x0+30,y+21,REC.on)}
  {const y=y0+150;if(btn(x0,y,x0+147,y+42,'匯出存檔',true)&&inp){m21Export();hit=true}if(btn(x0+153,y,x0+300,y+42,'匯入存檔',true)&&inp){m21Import();hit=true}}
  {const y=y0+200;if(btn(x0,y,x0+300,y+42,'按鍵設定（O）',true,[160,220,255])&&inp){CLICK=null;w29Open();hit=true}}
  if(inp){if(press(['BracketLeft']))m24Vol('mus',-10);if(press(['BracketRight']))m24Vol('mus',10);if(press(['Semicolon']))m24Vol('sfx',-10);if(press(['Quote']))m24Vol('sfx',10)}
  return hit};
const W29MB=[112,34,282,78];
window.drawManual=(o=>function(){const r=o.apply(this,arguments);btn(...W29MB,'按鍵設定（O）',true,[160,220,255]);return r})(window.drawManual);
window.m21Manual=(o=>function(){if(CLICK&&inBox(CLICK,W29MB)){CLICK=null;w29Open();return true}return o.apply(this,arguments)})(window.m21Manual);
window.__w29=()=>({open:W29.open,cap:W29.cap,sel:W29.sel,msg:W29.msg,ch:W29CH,map:Object.fromEntries([...W29LIST].filter(v=>W29M[v]!==v).map(v=>[v,W29M[v]])),he:HE.open,heSel:HE.sel,tiles:heTiles().map(t=>[t.id,Math.round(t.x),Math.round(t.y),Math.round(t.r)]),saved:JSON.parse(JSON.stringify(W29HUD)),rw:s=>w29Rw(s)});

// ---- src27/p_w210heal.js
// ===== W2.10：復仇回血只屬於苦達斯 → 詩人、三杯兔子改用自己的招式回血（體驗不輸 W2.9）=====
// 詩人「希望旋律」：她自己的琴擊打中敵人就回血（每秒有上限）；綠色樂想／希望之歌期間回得更多，綠色回血本身也加強。
// 三杯兔子「藥酒箭」：箭頭沾了藥酒，自己射出的箭打中敵人就回血（每秒有上限）；箭雨出手前先乾一杯（立刻回血），之後的綠霧是藥酒霧，打中霧裡的敵人回血加倍。
// 數字：詩人「♪ +N」淡綠、兔子「藥酒 +N」黃綠，和一般回血分開顯示。
const W210={bard:{hit:0.15,cap:0.75,grn:1.25,low:1.5},archer:{hit:0.18,cap:1.00,mist:1.5,cast:0.20,low:1.5}};
function w210Heal(kind,frac,capFrac){const s=S0,P=s&&s.P,t=s&&s.t;if(!P||P.dead||P.hp<=0||P.hp>=HPMAX)return 0;
  let v=Math.round(HPMAX*frac);if(capFrac){if(!(t<(P.hkWT||-9))){P.hkWT=t+1;P.hkWD=0}v=Math.min(v,Math.round(HPMAX*capFrac)-(P.hkWD||0));if(v<=0)return 0;P.hkWD=(P.hkWD||0)+v}
  v=Math.min(v,Math.ceil(HPMAX-P.hp));P.hp=Math.min(HPMAX,P.hp+v);s.heals.push({t,v,hk:kind});return v}
// 詩人：自己的琴擊（不含苦達斯助戰的斬風 kwind）；血量低於 40% 時 ×1.5（「堅持的旋律」）
window.bHit=(o=>function(m,mv,pool,mul,multi){const hp0=m&&m.hp;const r=o.apply(this,arguments);
  try{if(isBard()&&pool!=='kwind'&&m&&m.hp<hp0){const P=S0.P,g=P.regU>S0.t||P.grnU>S0.t,lo=P.hp<HPMAX*0.4?W210.bard.low:1;w210Heal('bard',W210.bard.hit*(g?W210.bard.grn:1)*lo,W210.bard.cap*(g?W210.bard.grn:1)*lo)}}catch(e){}return r})(window.bHit);
// 三杯兔子：自己的箭打中 → 回血（綠霧裡的敵人 ×1.5；自己血量低於 40% 時再 ×1.5「醉意護身」）；箭雨出手 → 乾一杯
window.aHit=(o=>function(m){const hp0=m&&m.hp;const r=o.apply(this,arguments);
  try{if(isArcher()&&m&&m.hp<hp0){const k=(m.mistU>S0.t?W210.archer.mist:1)*(S0.P.hp<HPMAX*0.4?W210.archer.low:1);w210Heal('archer',W210.archer.hit*k,W210.archer.cap)}}catch(e){}return r})(window.aHit);
window.arZone=(o=>function(z){const r=o.apply(this,arguments);
  try{if(isArcher()&&z&&z.k==='rain'){const s=S0;if(w210Heal('archer',W210.archer.cast)){s.fx.push({k:'w210cup',t0:s.t});sfx('coin',0.22)}}}catch(e){}return r})(window.arZone);
window.drawHUD=(o=>function(cx0,shy){const r=o.apply(this,arguments);try{const s=S0,P=s&&s.P;if(!P||!s.heals)return r;const t=s.t;
  const kx=P.x-cx0,ky=P.y+shy-P.h;const g=[];
  for(const e of s.heals){if(!e.hk)continue;const L=g.length?g[g.length-1]:null;if(L&&L.k===e.hk&&e.t-L.t<0.3)L.v+=e.v;else g.push({t:e.t,v:e.v,k:e.hk})}
  const hl=g.filter(e=>t-e.t>=0&&t-e.t<0.9);
  hl.forEach((e,i)=>{const age=t-e.t,a=age<0.65?1:Math.max(0,1-(age-0.65)/0.25),txt=(e.k==='bard'?'♪ +':'藥酒 +')+e.v.toLocaleString('en-US'),col=e.k==='bard'?[140,255,170]:[200,245,110];
    T(txt,Math.round(kx-40),Math.round(ky-130-30*Math.min(1,age/0.5)-(hl.length-1-i)*28),FS(22),col,3,[10,50,20],'rm',a)});
  // 回血時角色身上的淡綠光
  const last=hl.length?hl[hl.length-1]:null;if(last&&t-last.t<0.22){const ga=1-(t-last.t)/0.22;X.save();X.globalAlpha=0.35*ga;X.fillStyle=last.k==='bard'?'rgb(120,255,160)':'rgb(190,245,100)';X.beginPath();X.ellipse(Math.round(kx),Math.round(P.y+shy),60,13,0,0,7);X.fill();X.restore()}
  for(const f of s.fx){if(f.k!=='w210cup')continue;const age=t-f.t0;if(age<0||age>0.9)continue;const a=age<0.6?1:(0.9-age)/0.3;T('乾杯！',Math.round(kx),Math.round(ky-210-20*Math.min(1,age/0.4)),FS(26),[255,235,140],4,[70,40,0],'mm',a)}
  }catch(e){}return r})(window.drawHUD);

