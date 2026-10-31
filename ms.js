// ================= 隱藏關卡：萊比地下城・理查宅邸 III（賺錢關卡，暫定數值） =================
// 2 個房間：寶物大廳（沒有敵人，區域效果）→ 彩繪玻璃大廳（墮落的守護警衛兵）→ 寶石掠奪者從天而降
const MS={gv:[60,90,200],hp:0.35,bossHP:150000,popG:0.3,popB:0.4,
  say:['什麼？是誰！','被發現了！','別多管閒事！','別放過他！','是入侵者嗎？','我只是照命令做事而已！'],low:['怎麼這麼強……？','被搶個精光了……','要悔改嗎……']};
Object.assign(ITEMN,{gem0:'藍寶石',gem1:'綠寶石',gem2:'紅寶石'});
const isMS=()=>!!(S0&&RUN.bonus&&(S0.stage==='ms1'||S0.stage==='ms2'));
const gemRoll=(b=0)=>{const r=Math.random();return r<0.10+b?'gem2':r<0.40+b?'gem1':'gem0'};
const GMAP={golem_walk0:'guard_walk0',golem_walk1:'guard_walk1',golem_attack:'guard_attack',golem_hit:'guard_hit',golem_down:'guard_down',golem_bwalk:'guard_walk0',golem_bdraw:'guard_attack',golem_bhit:'guard_hit'};
const MSN=['guard_walk0','guard_walk1','guard_attack','guard_hit','guard_down','looter_idle','looter_windup','looter_slash','looter_hit','looter_down'];
{const W0={};for(const k of ['m2Assets','anchor','spr','spawnMob','m2Say','m2Drop','m2OnHit','m2Dmg','m2Step','m2HUD','m2Retry','m2Begin','card','sub','drawResult'])W0[k]=window[k];
window.m2Assets=()=>[...W0.m2Assets(),'ms_hall','ms_glass','i_gem0','i_gem1','i_gem2',...MSN.flatMap(n=>['s_'+n,'f_'+n,'g_'+n])];
window.anchor=n=>n.startsWith('guard_')?[140,110,70,100]:n.startsWith('looter_')?[240,200,120,186]:W0.anchor(n);
window.spr=(n,sx,sy,o)=>W0.spr(S0&&S0.stage==='ms2'&&GMAP[n]?GMAP[n]:n,sx,sy,o);
window.spawnMob=(k,side)=>{if(!isMS())return W0.spawnMob(k,side);const m=W0.spawnMob('sword',side);m.hp=m.hpmax=Math.round(m.hpmax*MS.hp);m.guard=1;return m};
window.m2Say=(m,p)=>{if(!isMS())return W0.m2Say(m,p);const s=S0,t=s.t;if(m.kind!=='sword'||t<(m.sayCD||0)||rnd()>=p)return;if(s.mobs.filter(o=>o.sayU>t&&!o.gone).length>=2)return;
  m.say=CH(m.hp<m.hpmax*0.3?MS.low:MS.say);m.sayU=t+2;m.sayCD=t+6};
window.m2Drop=m=>{if(!isMS())return W0.m2Drop(m);const n=RI(6,10);for(let i=0;i<n;i++)lootPush(gemRoll(),m,{vx:U(-260,260)})};
window.m2OnHit=(m,mv,v,crit,hy)=>{W0.m2OnHit(m,mv,v,crit,hy);if(!isMS()||mv==='pet')return;const b=S0.boss;
  if(m.guard&&(m.pops||0)<4&&Math.random()<MS.popG){m.pops=(m.pops||0)+1;lootPush(gemRoll(),m)}
  if(m.kind==='boss'&&b&&b.ms){if(!b.atk)b.hitT=S0.t;if((b.pops||0)<45&&Math.random()<MS.popB){b.pops=(b.pops||0)+1;lootPush(gemRoll(0.05),m,{vx:U(-300,300)})}}};
// 區域效果：連擊強化III　連擊時傷害量增加 50%（影片原文）
window.m2Dmg=(v,m,mv,crit)=>{const r=W0.m2Dmg(v,m,mv,crit);return isMS()&&mv!=='pet'&&S0.combo>=2?Math.round(r*1.5):r};
window.m2Step=dt=>{W0.m2Step(dt);if(isMS())msTick(dt)};
window.m2HUD=(cx0,shy)=>{W0.m2HUD(cx0,shy);if(isMS())msHUD()};
window.m2Retry=()=>{if(RUN.bonus&&RUN.ms)RUN.ms.rev++;return W0.m2Retry()};
window.m2Begin=(st,d,bonus)=>{if(bonus)RUN.ms={time:0,downs:0,deaths:0,rev:0,gv:0,cnt:[0,0,0],bossDead:false};else RUN.ms=null;return W0.m2Begin(st,d,bonus)};
window.card=(txt,sb,dur)=>{if(isMS()&&S0.stage==='ms2'&&txt==='勝利'&&!RUN.ms.bossDead)return;return W0.card(txt,sb,dur)};
window.sub=(who,line,dur)=>{if(isMS()&&S0.stage==='ms2'&&line==='往右前進 →')return;return W0.sub(who,line,dur)};
window.drawResult=()=>RES&&RES.ms?drawMSResult():W0.drawResult();}
function m2Gem(f){const s=S0,R=RUN.ms,i=+f.k[3];const v=Math.round(MS.gv[i]*DIF().gold);if(R){R.gv+=v;R.cnt[i]++}s.gemPop=[s.t,v];s.log.push([s.t,f.k,'獲得 '+ITEMN[f.k]])}
function msOnStage(n){const s=S0;s.npc=null;
  if(n==='ms1'){s.mineDone=true;setTimeout0(0.3,()=>card('萊比地下城','理查宅邸 III',2.6));
    setTimeout0(1.4,()=>sub('','隱藏在傳聞四起的廢棄宅邸，據說裡面充滿了不為人知的秘密和寶藏。',4.0));
    setTimeout0(5.6,()=>card('區域效果：連擊強化III','玩家：連擊時傷害量增加 50%',2.8))}
  if(n==='ms2')s.msBT=null}
function msTick(dt){const s=S0,t=s.t,P=s.P,R=RUN.ms;if(!R)return;
  if(s.winT==null&&!P.dead)R.time+=dt;
  const dn=m2Down();if(dn&&!s._dn)R.downs++;s._dn=dn;if(P.dead&&!s._dd)R.deaths++;s._dd=P.dead;
  for(const L of s.loot)if(L.k.startsWith('gem')&&L.state==='rest'&&t-L.t0>0.8&&!P.dead){const dx=P.x-L.x,dy=P.y-L.gy,d=Math.hypot(dx,dy)||1,sp=Math.min(d,(420+(t-L.t0)*500)*dt);L.x+=dx/d*sp;L.gy+=dy/d*sp;L.y=L.gy;if(P.h>0&&d<40)L.t0=Math.min(L.t0,t-0.7)}
  if(s.stage==='ms1'){s.mineDone=true;s.msDoor=P.x>=WW-170;if(s.msDoor&&!s.trans&&(IN.use()||IN.u()||AUTO))startTrans('ms2')}
  if(s.stage==='ms2'&&!s.boss&&!R.bossDead&&s.wave>=WAVES.length&&!s.trans){if(s.msBT==null)s.msBT=t+1.6;else if(t>=s.msBT)setupMS()}}
function msHUD(){const s=S0,t=s.t,R=RUN.ms;const y=s.boss&&s.boss.m?206:146;
  rrect(390,y-16,890,y+16,8,'rgba(30,14,40,0.82)','rgb(200,150,255)',1);T('區域效果：連擊強化III　連擊時傷害 +50%',400,y+1,FS(14),[240,220,255],2,[0,0,0],'lm');
  if(R){const pop=s.gemPop&&t-s.gemPop[0]<0.25;for(let i=0;i<3;i++){itemDraw('gem'+i,700+i*62,y-8,16);T('×'+R.cnt[i],720+i*62,y+1,FN(13),pop?[255,255,255]:[220,235,255],2,[0,0,0],'lm')}}
  if(s.msDoor&&s.stage==='ms1'){rrect(470,250,810,312,10,'rgba(12,8,10,0.85)',rgb(GOLDC),2);T('將移動至下一區域。',640,272,FS(20),[255,244,214],2,[0,0,0],'mm');T('E / ↑',640,298,FN(14),[200,190,170],2,[0,0,0],'mm')}}
// ---------- 寶石掠奪者（被貪婪蒙蔽的警衛隊長） ----------
function setupMS(){const s=S0,t=s.t,D=DIF();s.boss={ms:true,name:'寶石掠奪者',m:null,kneelUntil:-9,nextAtk:t+2.6,atk:null,enterT:t,hitT:-9,pops:0,jh:0};
  const m=mob('boss',clamp(s.P.x+280,260,WW-200),clamp(s.P.y,YMIN+20,YMAX-20));m.hp=m.hpmax=Math.round(MS.bossHP*D.hp);m.face=-1;m.enter=false;s.mobs.push(m);s.boss.m=m;
  s.tele.push({x:m.x,y:m.y,r:120,t0:t,t1:t+0.9,dmg:600,big:true});s.lock=[0,0];s.bossT0=t;
  setTimeout0(0.2,()=>card('寶石掠奪者','被貪婪蒙蔽的警衛隊長',2.6))}
function msAttack(k){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P,f=m.face;
  if(k==='slash'){b.atk={k,t0:t,end:t+1.25};s.tele.push({x:clamp(m.x+f*120,60,WW-60),y:m.y,r:125,t0:t,t1:t+0.62,dmg:900,big:true})}
  else{const tx=clamp(P.x,120,WW-120),ty=clamp(P.y,YMIN+6,YMAX-6);b.atk={k,t0:t,end:t+1.35,from:[m.x,m.y],to:[tx-f*30,ty]};s.tele.push({x:tx,y:ty,r:110,t0:t,t1:t+0.78,dmg:1000,big:true})}}
function stepMS(dt){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P;if(m.dying)return;
  if(t-b.enterT<0.9){m.moving=false;return}
  if(!b.landed){b.landed=true;shake(14,0.5);sfx('crit',0.5);puff(m.x,m.y,24,[200,190,210],80,0.6,3)}
  if(t<m.frz)return;
  if(b.atk){m.moving=false;const a=b.atk;if(a.k==='leap'){const u=clamp((t-a.t0-0.35)/0.43,0,1),e=u*u*(3-2*u);m.x=a.from[0]+(a.to[0]-a.from[0])*e;m.y=a.from[1]+(a.to[1]-a.from[1])*e;b.jh=Math.sin(Math.PI*u)*170;m.x=clamp(m.x,120,WW-120)}
    if(t>=a.end){b.atk=null;b.jh=0;b.nextAtk=t+U(1.4,2.4)*DIF().cd}return}
  const want=P.x>=m.x?1:-1;if(t-(m.turnT||0)>0.3){if(m.face!==want)m.turnT=t;m.face=want}
  const gx=P.x-want*140,ddx=gx-m.x,ddy=P.y-m.y,d=Math.hypot(ddx,ddy*1.6);m.moving=d>16;if(m.moving){m.x+=ddx/d*110*dt;m.y+=ddy/d*60*dt}
  m.x=clamp(m.x,120,WW-120);m.y=clamp(m.y,YMIN+6,YMAX-6);
  if(t>=b.nextAtk&&!P.dead&&!s.trans){const near=Math.abs(P.x-m.x)<260&&Math.abs(P.y-m.y)<60;msAttack(near?CH(['slash','slash','leap']):CH(['leap','leap','slash']))}}
function msFrame(){const s=S0,b=s.boss,m=b.m,t=s.t;if(m.dying)return 'looter_down';if(t-b.enterT<0.9)return 'looter_windup';
  if(b.atk){const age=t-b.atk.t0,k=b.atk.k==='slash'?[0.6,0.95]:[0.75,1.1];return age<k[0]?'looter_windup':age<k[1]?'looter_slash':'looter_idle'}
  return t-b.hitT<0.25?'looter_hit':'looter_idle'}
function drawMS(m,sx,sy){const s=S0,t=s.t,b=s.boss,ea=t-b.enterT;let dy=0;if(ea<0.9){const u=clamp(ea/0.9,0,1);dy=-(1-u*u)*720}else dy=-(b.jh||0);
  let a=1;if(m.dying){const age=t-(m.dieT-2.0);a=age<1.5?1:Math.max(0,1-(age-1.5)/0.5)}
  const bob=!b.atk&&!m.dying&&m.moving?Math.floor(t/0.18)%2:0;spr(msFrame(),sx,sy+dy-bob*2,{flip:m.face<0,flash:t<m.flash,alpha:a})}
function msDie(m){const s=S0,t=s.t;RUN.ms.bossDead=true;m.dieT=t+2.0;s.winT=t+1.5;s.boss.atk=null;s.tele=[];shake(16,0.8);sfx('crit',0.7);
  for(const o of s.mobs)if(o!==m&&!o.gone){o.dying=true;o.state='down';o.dieT=t+0.4}
  card('勝利','VICTORY',2.6);lootPush('gear',m,{it:rollDrop(1),vx:U(-200,200)});
  for(let w=0;w<6;w++)setTimeout0(0.15+w*0.22,()=>{for(let i=0;i<10;i++)lootPush(gemRoll(0.1),m,{vx:U(-420,420),vy:-U(600,900)})})}
// ---------- 結算：地下城通關！ ----------
function msClear(){const s=S0,R=RUN.ms;mode='result';paused=false;
  for(const L of s.loot){if(L.k==='coin')m2Gold(L.amt);else if(L.k==='gear')m2GotGear(L.it);else if(L.k==='tfpot'||L.k==='tfpot2')m21Pot(L.k);else if(L.k==='sock')m21Sock();else if(L.k.startsWith('gem'))m2Gem(L)}
  for(const f of s.fly)if(!f.done){if(f.k==='coin')m2Gold(f.amt);else if(f.k==='gear')m2GotGear(f.it);else if(f.k==='tfpot'||f.k==='tfpot2')m21Pot(f.k);else if(f.k==='sock')m21Sock();else if(f.k.startsWith('gem'))m2Gem(f)}s.loot=[];s.fly=[];
  const T0=R.time,tb=T0<90?60:T0>=240?0:Math.round(60*(240-T0)/150);const score=Math.max(0,100+tb-10*R.downs-30*R.deaths-20*R.rev);
  const rank=score>=150?'S':score>=110?'A':'B',mul={S:1.2,A:1.0,B:0.8}[rank];const gold=Math.round(R.gv*mul);m2Gold(gold);m2Save();
  RES={ms:true,def:BONUS,d:RUN.d,t:T0,tb,score,rank,mul,R,gold,items:s.runItems.slice(),t0:performance.now(),bonus:false,extra:0};
  musStop(CURM,0.6);musStop('lute',0.3);musPlay('m_shop',0.4,0.8,true);CURM='m_shop'}
function msBonus(){const r=RES;if(r.bonus||SAVE.gold<3000)return;SAVE.gold-=3000;r.extra=Math.round(r.R.gv*0.5);SAVE.gold+=r.extra;const it=rollDrop(1);m2GotGear(it);r.items.push(it);r.bonus=true;m2Save();sfx('ready',0.5)}
function drawMSResult(){const r=RES,R=r.R,age=(performance.now()-r.t0)/1000;X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.5;X.drawImage(IMG.ms_glass,0,0,W,H);X.restore();
  panelBG(200,50,1080,690);T('地下城通關！',640,102,FS(46),[255,236,160],4,[80,30,0],'mm');T(`${BONUS.t}・${DIFFS[r.d].n}`,640,146,FS(19),[230,220,200],2,[0,0,0],'mm');
  const rc={S:[255,210,80],A:[170,220,255],B:[200,190,170]}[r.rank];T(r.rank,340,270,FS(130),rc,6,[60,20,0],'mm');T('評價',340,350,FS(18),[214,172,84],2,[0,0,0],'mm');
  const mm=Math.floor(r.t/60),ss=Math.floor(r.t%60);
  const rows=[['通關時間',`${mm}:${String(ss).padStart(2,'0')}`,`+${r.tb}`],['被擊倒次數',String(R.downs),`−${10*R.downs}`],['戰鬥不能',String(R.deaths),`−${30*R.deaths}`],['復活次數',String(R.rev),`−${20*R.rev}`]];
  rows.forEach(([a,b,c],i)=>{const y=190+i*36;T(a,470,y,FS(19),[214,172,84],2,[0,0,0],'lm');T(b,860,y,FN(19),[255,255,255],2,[0,0,0],'rm');T(c,1000,y,FN(17),[200,220,200],2,[0,0,0],'rm')});
  X.fillStyle='rgba(214,172,84,0.5)';X.fillRect(470,334,530,2);T('結算',470,356,FS(21),[255,236,200],2,[0,0,0],'lm');T(`${r.score}分`,1000,356,FS(24),[255,236,160],2,[0,0,0],'rm');
  rrect(260,390,1020,600,10,'rgba(30,20,12,0.9)','rgba(214,172,84,0.7)',2);T('獲得獎勵總和',640,414,FS(21),[255,236,200],2,[0,0,0],'mm');
  for(let i=0;i<3;i++){const x=330+i*150;itemDraw('gem'+i,x,440,30);T(`${ITEMN['gem'+i]} ×${R.cnt[i]}`,x+40,456,FN(16),[235,240,255],2,[0,0,0],'lm')}
  T(`寶石換算 ${R.gv.toLocaleString('en-US')} × 評價 ${r.mul}`,300,500,FN(17),[230,220,200],2,[0,0,0],'lm');T(`金幣 +${(r.gold+r.extra).toLocaleString('en-US')}`,990,500,FS(24),[255,226,120],2,[0,0,0],'rm');
  r.items.slice(0,8).forEach((it,i)=>gearCard(it,300+i*62,526,52,false));T(`持有 ${SAVE.gold.toLocaleString('en-US')}`,990,560,FN(15),[230,220,200],2,[0,0,0],'rm');
  const can=!r.bonus&&SAVE.gold>=3000;
  const lv=btn(300,620,620,668,'離開地下城（Enter）',true),bo=btn(660,620,980,668,r.bonus?`已領取（+${r.extra.toLocaleString('en-US')}＋裝備）`:'3,000　額外獲得獎勵（B）',can,[255,190,90]);
  if(age>0.6&&(bo||press(['KeyB'])||(AUTO&&age>1.5&&can)))msBonus();
  if(age>0.6&&(lv||IN.start()||(AUTO&&age>3))){RUN.bonus=false;RUN.ms=null;RES=null;musStop('m_shop',0.4);CURM='m_shop';m2OpenMap()}}
