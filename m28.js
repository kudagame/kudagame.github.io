// ================= W3：第一關 泥魔像隊長、第二關 灰燼刺蠍／暮色刺蠍（src28/boss_w3.js → web/m28.js） =================
// 打完最後一波 → 不出「勝利」，改成王登場（名牌＋王血條）；王倒下才出勝利、開礦坑口（第一關）或出口（第二關）。
// 刺蠍有兩款隨機：灰燼款 80%、暮色款 20%（稀有，掉寶約 2 倍）。測試：?w3sc=A|B 或 window.__w3sc='B' 可指定。
// 數值（普通難度、未乘難度倍率）：玩家 4125 血；單招最高 1300 ＝ 31.5%（W2.2 65% 上限照樣生效）。
const W3ANC={sc:{"idle0":[261,198,130,196],"idle1":[259,194,130,192],"walk0":[260,197,130,195],"walk1":[262,198,130,196],"pinc0":[273,203,135,201],"pinc1":[265,200,144,190],"chg0":[273,208,129,202],"chg1":[304,198,157,190],"rest":[269,209,124,199],"sw0":[278,212,134,208],"sw1":[167,203,82,200],"sw2":[266,203,136,200],"spk0":[269,213,131,210],"spk1":[252,176,132,166],"hurt":[266,191,126,184],"brk":[248,162,123,152],"dead":[246,141,121,131]},gg:{"idle0":[84,124,38,122],"idle1":[84,125,38,121],"walk0":[80,122,37,120],"walk1":[84,124,38,124],"chop0":[82,145,35,143],"chop1":[115,115,72,113],"chg0":[86,120,45,120],"chg1":[93,120,66,115],"shout":[79,138,33,136],"hurt":[88,124,29,118],"fall":[104,108,9,100],"dead":[111,64,55,62]}};
const W3B={
  gg:{name:'泥魔像隊長',hp:820000,chop:800,chg:600,shoutAt:[0.5,0.25],xp:0.6},
  sc:{nA:'灰燼刺蠍',nB:'暮色刺蠍',hp:800000,pinc:600,chg:1000,sweep:1300,spk:600,rare:0.2,brkK:0.18,stag:3.0,brkUp:1.25,brkMax:0.30,xp:1}};
const W3F={sc:Object.keys(W3ANC.sc),gg:Object.keys(W3ANC.gg)};
const w3St=()=>S0&&(S0.stage==='canyon'||S0.stage==='s2');
const w3Pend=()=>{const s=S0;return !!(s&&w3St()&&s.wave>=WAVES.length&&!(s.w3b&&s.w3b.done))};
function w3Load(pre,names){for(const k of names)for(const p of ['s_','f_']){const n=p+pre+'_'+k;if(!IMG[n]||IMG[n].__w3e)li(n)}}
function w3Roll(){const q=(typeof Q!=='undefined'&&Q.get)?Q.get('w3sc'):null;const f=window.__w3sc||q;if(f==='A'||f==='B')return f;return Math.random()<W3B.sc.rare?'B':'A'}
{const W0={};for(const k of ['anchor','spr','m2OnStage','m2HUD','card','sub','drawTele','stepWaves','stepBoss','drawBoss','bossDie','drawBossBar'])W0[k]=window[k];
window.anchor=n=>{const i=n.indexOf('_'),p=n.slice(0,i);if(p==='scA'||p==='scB')return W3ANC.sc[n.slice(i+1)]||W3ANC.sc.idle0;if(p==='gg')return W3ANC.gg[n.slice(i+1)]||W3ANC.gg.idle0;return W0.anchor(n)};
window.spr=(n,sx,sy,o={})=>{if(/^(scA|scB|gg)_/.test(n)){const im=IMG[(o.flash?'f_':'s_')+n];if(!im||!im.complete||!im.naturalWidth)return}return W0.spr(n,sx,sy,o)};
window.m2OnStage=n=>{W0.m2OnStage(n);const s=S0;s.w3b=null;s.w3sp=[];
  if(n==='s2'){s.w3var=w3Roll();w3Load('sc'+s.w3var,W3F.sc)}else if(n==='canyon')w3Load('gg',W3F.gg)};
// 最後一波打完：先不出勝利／坑口提示
window.card=(txt,sb,dur)=>{if(txt==='勝利'&&w3Pend())return;return W0.card(txt,sb,dur)};
window.sub=(who,line,dur)=>{if(w3Pend()&&(line==='峽谷盡頭的礦坑入口……走到坑口按 E（或 ↑）進入。'||line==='坑道深處透出微光……往右走 →'))return;return W0.sub(who,line,dur)};
window.stepWaves=function(dt){const s=S0,w0=s.wave;const r=W0.stepWaves.apply(this,arguments);
  if(w3St()&&WAVES.length&&w0<WAVES.length&&s.wave>=WAVES.length&&!s.w3b){s.w3b={st:s.stage,t:s.t};s.goT=null;s.lock=[CAMMAX,CAMMAX];setTimeout0(1.4,()=>w3Spawn())}
  if(s.w3b&&!s.w3b.done){s.caveOn=false;s.mineDone=false;if(s.boss&&s.boss.w3)s.lock=[CAMMAX,CAMMAX]}
  if(s.boss&&s.boss.w3&&s.boss.m.gone&&t3gone(s))s.boss=null;return r};
window.stepBoss=function(dt){const b=S0.boss;if(b&&b.w3)return w3Step(dt);return W0.stepBoss.apply(this,arguments)};
window.drawBoss=function(m,sx,sy){const b=S0.boss;if(b&&b.w3)return w3Draw(m,sx,sy);return W0.drawBoss.apply(this,arguments)};
window.bossDie=function(m){const b=S0.boss;if(b&&b.w3)return w3Die(m);return W0.bossDie.apply(this,arguments)};
window.drawBossBar=function(b){if(b&&b.w3)return w3Bar(b);return W0.drawBossBar.apply(this,arguments)};
window.drawTele=(cx0,shy)=>{w3Ground(cx0,shy);W0.drawTele(cx0,shy);w3Air(cx0,shy)};}
function t3gone(s){return s.t>=(s.boss.m.dieT||0)+0.2}
// ---------- 出場 ----------
function w3Spawn(){const s=S0,t=s.t,D=DIF();if(!w3St()||s.boss||!s.w3b||s.w3b.done)return;const lx=CAMMAX,P=s.P;
  const sc=s.stage==='s2',v=s.w3var||(s.w3var=w3Roll());if(sc)w3Load('sc'+v,W3F.sc);else w3Load('gg',W3F.gg);
  const rare=sc&&v==='B',name=sc?(rare?W3B.sc.nB:W3B.sc.nA):W3B.gg.name;
  const m=mob('boss',sc?lx+900:lx+W+140,clamp(P.y,YMIN+30,YMAX-10));m.hp=m.hpmax=Math.round((sc?W3B.sc.hp:W3B.gg.hp)*D.hp);m.face=-1;m.enter=false;m.h=0;s.mobs.push(m);
  s.boss={w3:sc?'sc':'gg',rare,pre:sc?'sc'+v:'gg',name,m,nextAtk:t+2.6,atk:null,enterT:t,lastHp:m.hp,brk:1,stagU:-9,hurtT:-9,shout:0,lastK:null,swT:-99};
  s.lock=[CAMMAX,CAMMAX];s.bossT0=t;s.st={dmg:0,maxHit:0,hits:0,crits:0,zj:0,t0:t};s.maxComboB=0;
  if(sc){shake(14,1.2);sfx('crit',0.45);for(let i=0;i<3;i++)setTimeout0(i*0.35,()=>puff(m.x+U(-160,160),m.y,18,[120,110,104],120,0.8,3))}
  else{sfx('start',0.4)}
  setTimeout0(sc?1.4:1.0,()=>card(name,rare?'稀有 BOSS':'BOSS',2.4));
  setTimeout0(sc?3.6:3.0,()=>sub(name,sc?(rare?'（暮色的甲殼泛著鐵青的光……這隻很少見！）':'（焦黑的甲殼縫裡，餘燼一明一滅……）'):'哼……小的們都倒了？那就由我來！',2.6))}
// ---------- 每格 ----------
function w3Tele(dt){const s=S0,t=s.t,P=s.P;
  for(const c of s.tele){if(!c.done&&t>=c.t1){c.done=true;shake(c.big?12:6,0.3);puff(c.x,c.y,c.big?22:9,[150,110,90],c.r,0.6,3);s.fx.push({k:'ring',x:c.x,y:c.y,t0:t,col:[255,120,80],big:true});
      if(c.big)s.fx.push({k:'crack',x:c.x,y:c.y,t0:t});if(c.spk)s.w3sp.push({x:c.x,y:c.y,t0:t});
      if(!P.dead&&Math.hypot(P.x-c.x,(P.y-c.y)*2.2)<c.r&&P.h<80)hurtP(c.dmg,P.x,P.y-70)}}
  s.tele=s.tele.filter(c=>t<c.t1+0.5);s.w3sp=(s.w3sp||[]).filter(p=>t-p.t0<1.4)}
function w3Bounds(){const lx=S0.lock?S0.lock[0]:CAMMAX,sc=S0.boss&&S0.boss.w3==='sc';return sc?[lx+300,lx+W-320]:[lx+200,lx+W-200]}
function w3Step(dt){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P;w3Tele(dt);if(m.gone||m.dying)return;const sc=b.w3==='sc',D=DIF();
  // 破防條：照扣血量；衝刺後停頓、旋掃後收招 2 倍
  const dh=Math.max(0,b.lastHp-m.hp);b.lastHp=m.hp;
  if(dh>0&&!b.atk&&t-b.hurtT>1.1&&t>=b.stagU&&t-b.enterT>2){b.hurtT=t}
  if(sc&&b.stagU>0&&t>=b.stagU&&b.brk<=0){b.brk=1;b.nextAtk=t+0.8}   // W3：先補滿破防條再扣（原本順序會在暈完的同一格又破防＝連續暈）
  if(sc&&t>=b.stagU){const pun=b.atk&&b.atk.pun&&t>=b.atk.pun;b.brk-=dh/(m.hpmax*(b.brkK||W3B.sc.brkK))*(pun?2:1);
    if(b.brk<=0){b.brk=0;b.brkK=Math.min(W3B.sc.brkMax,(b.brkK||W3B.sc.brkK)*W3B.sc.brkUp);b.stagU=t+W3B.sc.stag;b.atk=null;b.lane=null;b.dash=null;s.tele=s.tele.filter(c=>!c.w3);card('破防！','BREAK　'+W3B.sc.stag+' 秒',1.4);proc('破防',[255,210,90],'破');shake(12,0.5);sfx('crit',0.6);puff(m.x,m.y-80,24,[255,170,80],120,0.7,3)}}
  if(sc&&t<b.stagU){m.moving=false;return}
  // 出場
  const ea=t-b.enterT;if(ea<(sc?1.8:1.6)){if(!sc){const lx=CAMMAX;m.x=lx+W+140-(400*Math.min(1,ea/1.5));m.moving=true;m.face=-1}else m.moving=false;return}
  if(t<(m.frz||0))return;
  // 叫小弟（泥魔像隊長，血 50%／25% 各一次）
  if(!sc&&!b.atk&&b.shout<W3B.gg.shoutAt.length&&m.hp<=m.hpmax*W3B.gg.shoutAt[b.shout]){b.shout++;w3Skill('shout');return}
  if(b.atk){m.moving=false;w3Atk(dt);if(b.atk&&t>=b.atk.end){b.atk=null;b.lane=null;b.dash=null;b.nextAtk=t+(sc?U(1.3,2.1):U(1.3,2.0))*D.cd}return}
  if(t<(m.dizzy||0)){m.moving=false;return}
  const want=P.x>=m.x?1:-1;if(t-(m.turnT||0)>0.5){if(m.face!==want)m.turnT=t;m.face=want}
  const keep=sc?280:170,gx=P.x-want*keep,ddx=gx-m.x,ddy=P.y-m.y,d=Math.hypot(ddx,ddy*1.6);m.moving=d>18;
  const sp=sc?120:85;if(m.moving){m.x+=ddx/d*sp*dt;m.y+=ddy/d*(sc?55:46)*dt}
  const [x0,x1]=w3Bounds();m.x=clamp(m.x,x0,x1);m.y=clamp(m.y,YMIN+6,YMAX-6);
  if(t>=b.nextAtk&&!P.dead&&!s.trans&&!window.__w3hold){const dist=Math.abs(P.x-m.x),row=Math.abs(P.y-m.y)<40;let k;
    if(sc){const near=dist<360;const pool=near?['pinc','pinc','pinc','sweep','spk','chg']:['chg','chg','spk','spk','sweep'];k=CH(pool);
      if(k==='sweep'&&t-b.swT<9)k=near?'pinc':'spk';if(k===b.lastK&&k!=='pinc')k=near?'pinc':'chg';if(k==='pinc'&&!near)k='chg'}
    else{k=dist<260&&row?CH(['chop','chop','chg']):CH(['chg','chg','walk'])}
    if(k==='walk'){b.nextAtk=t+0.8;return}
    w3Skill(k)}}
function w3Skill(k){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P,f=m.face,sc=b.w3==='sc';b.lastK=k;const [x0,x1]=w3Bounds();
  if(sc){
    if(k==='pinc'){b.atk={k,t0:t,hit:t+0.5,end:t+1.35};b.lane={x:m.x+f*60,y:m.y,f,len:300,t0:t,t1:t+0.5,w:34}}
    if(k==='chg'){const tx=f>0?x1:x0,len=Math.max(260,Math.abs(tx-m.x));b.atk={k,t0:t,go:t+1.5,end:t+1.5+len/1100+2.0,len,pun:t+1.5+len/1100,from:m.x,f};b.lane={x:m.x,y:m.y,f,len:len+240,t0:t,t1:t+1.5,w:44};sub('','地上亮起紅線——換一排！',1.2)}
    if(k==='sweep'){b.swT=t;b.atk={k,t0:t,spin:t+3.0,end:t+4.4,pun:t+3.6};s.tele.push({x:m.x,y:m.y,r:300,t0:t,t1:t+3.0,dmg:W3B.sc.sweep,big:true,w3:1});sub('','紅圈裡兩邊都會被掃到——跑出圈外！',1.6)}
    if(k==='spk'){b.atk={k,t0:t,end:t+4.9,stabs:[]};for(let i=0;i<4;i++){const at=0.5+i*0.9;b.atk.stabs.push(t+at+0.75);setTimeout0(at,()=>{const bb=S0.boss;if(!bb||bb!==b||!bb.atk||bb.atk.k!=='spk'||bb.m.dying)return;const Q2=S0.P;
        S0.tele.push({x:clamp(Q2.x,60,WW-60),y:clamp(Q2.y,YMIN,YMAX),r:80,t0:S0.t,t1:S0.t+0.75,dmg:W3B.sc.spk,big:false,spk:1,w3:1})})}}}
  else{
    if(k==='chop'){b.atk={k,t0:t,hit:t+0.9,end:t+0.9+1.2};s.tele.push({x:clamp(m.x+f*150,60,WW-60),y:m.y,r:125,t0:t,t1:t+0.9,dmg:W3B.gg.chop,big:true,w3:1});sub(b.name,'吃我一刀——！',0.9)}
    if(k==='chg'){const tx=f>0?x1:x0,len=Math.min(440,Math.max(200,Math.abs(tx-m.x)));b.atk={k,t0:t,go:t+0.8,end:t+0.8+len/880+1.0,len,from:m.x,f,pun:t+0.8+len/880};b.lane={x:m.x,y:m.y,f,len:len+150,t0:t,t1:t+0.8,w:40}}
    if(k==='shout'){b.atk={k,t0:t,end:t+1.6};b.ring=t+0.25;s.tele=s.tele.filter(c=>!c.w3);sub(b.name,'小的們——給我上！',1.4);shake(8,0.6);sfx('summon',0.5);
      for(let i=0;i<2;i++)setTimeout0(0.5+i*0.25,()=>{if(!S0.boss||S0.boss.m.dying)return;const side=i?1:-1;const mm=mob('sword',clamp(m.x+side*U(220,320),CAMMAX+80,CAMMAX+W-80),U(YMIN+10,YMAX-10));mm.enter=false;mm.summon=1;mm.face=P.x>mm.x?1:-1;s.mobs.push(mm);puff(mm.x,mm.y-30,14,[200,120,80],40,0.5,3)})}}}
function w3Atk(dt){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P,a=b.atk,sc=b.w3==='sc';
  if(a.k==='pinc'&&!a.done&&t>=a.hit){a.done=1;b.lane=null;shake(6,0.25);sfx('swing',0.5);const dx=(P.x-m.x)*m.face;if(!P.dead&&P.h<80&&dx>-40&&dx<300&&Math.abs(P.y-m.y)<42)hurtP(W3B.sc.pinc,P.x,P.y-70)}
  if(a.k==='chg'&&t>=a.go){if(!a.dashing){a.dashing=1;b.lane=null;sfx('wind',0.5);shake(sc?8:5,0.3)}
    const sp=sc?1100:880,want=a.from+a.f*a.len,dx=want-m.x;if(Math.abs(dx)>2){m.x+=Math.sign(dx)*Math.min(Math.abs(dx),sp*dt);if(Math.floor(t/0.05)!==Math.floor((t-dt)/0.05))puff(m.x-a.f*120,m.y,3,[150,120,100],30,0.4,3)}
    else if(!a.stop){a.stop=1;shake(sc?10:6,0.3);puff(m.x+a.f*80,m.y,16,[150,120,100],60,0.6,3)}
    if(!a.hitP&&!P.dead&&P.h<80&&Math.abs(P.x-m.x)<(sc?170:90)&&Math.abs(P.y-m.y)<40&&!a.stop){a.hitP=1;hurtP(sc?W3B.sc.chg:W3B.gg.chg,P.x,P.y-70)}}
  if(a.k==='chop'&&!a.done&&t>=a.hit){a.done=1;sfx('crit',0.4)}
  if(a.k==='spk'){for(const st of a.stabs)if(t>=st&&t-dt<st){sfx('crit',0.3)}}}
// ---------- 畫 ----------
function w3Frame(){const s=S0,b=s.boss,m=b.m,t=s.t,a=b.atk,sc=b.w3==='sc';
  if(m.dying){const g=t-m.dieT0;return sc?(g<0.6?'brk':'dead'):(g<0.45?'fall':'dead')}
  if(sc&&t<b.stagU)return 'brk';
  if(t-b.enterT<1.8&&sc)return 'idle0';
  if(a){const g=t-a.t0;
    if(sc){if(a.k==='pinc')return g<0.5?'pinc0':g<0.95?'pinc1':'idle0';
      if(a.k==='chg')return t<a.go?'chg0':!a.stop?'chg1':'rest';
      if(a.k==='sweep'){if(t<a.spin)return 'sw0';const k=Math.floor((t-a.spin)/0.09);return t<a.spin+0.72?['sw1','sw2','sw1','idle0'][k%4]:'idle1'}
      if(a.k==='spk'){for(const st of a.stabs)if(t>=st-0.12&&t<st+0.18)return 'spk1';return g<4.4?'spk0':'idle0'}}
    else{if(a.k==='chop')return t<a.hit?'chop0':'chop1';if(a.k==='chg')return t<a.go?'chg0':!a.stop?'chg1':'idle1';if(a.k==='shout')return g<1.3?'shout':'idle0'}}
  if(t-b.hurtT<0.16)return 'hurt';
  if(m.moving)return sc?['walk0','idle0','walk1','idle1'][Math.floor(t/0.13)%4]:['walk0','idle0','walk1','idle0'][Math.floor(t/0.2)%4];
  return Math.floor(t/0.5)%2?'idle1':'idle0'}
function w3Draw(m,sx,sy){const s=S0,t=s.t,b=s.boss,sc=b.w3==='sc';const fr=w3Frame();let dy=0,a=1,gl=null;
  if(m.dying){const age=t-m.dieT0;a=age<1.9?1:Math.max(0,1-(age-1.9)/0.6)}
  if(sc&&t-b.enterT<1.8){const u=clamp((t-b.enterT)/1.4,0,1);dy=(1-u)*(1-u)*170;a=Math.min(1,0.2+u)}
  const at=b.atk;let fl=t<m.flash;
  if(at&&!m.dying){const g=t-at.t0;if((at.k==='chop'&&t<at.hit)||(at.k==='chg'&&t<at.go)||(at.k==='pinc'&&t<at.hit))fl=fl||(g>0.15&&Math.floor(t*12)%3===0)}
  X.save();if(dy>0){X.beginPath();X.rect(sx-600,0,1200,sy+6);X.clip()}
  spr(b.pre+'_'+fr,sx,sy+dy,{flip:m.face>0,alpha:a});if(fl)spr(b.pre+'_'+fr,sx,sy+dy,{flip:m.face>0,flash:true,alpha:a*(t<m.flash?0.3:0.5)});X.restore();
  // 暮色款：身上飄青色微光；灰燼款：餘燼
  if(sc&&!m.dying&&Math.floor(t/0.12)!==Math.floor((t-1/60)/0.12)){const c=b.rare?CH([[120,170,255],[170,210,255],[90,120,220]]):CH([[255,140,60],[255,200,90],[230,80,40]]);s.parts.push({x:m.x+U(-200,200),y:m.y-U(60,300),vx:U(-20,20),vy:-U(30,70),g:0,life:0.7,t0:t,c,sz:CH([1,2]),faint:true})}
  if(sc&&t<b.stagU&&!m.dying){for(let i=0;i<3;i++){const ang=t*4+i*2.1;X.fillStyle=i%2?'rgb(255,230,120)':'rgb(255,170,70)';X.fillRect(Math.round(sx+Math.cos(ang)*70)-4,Math.round(sy-300+Math.sin(ang)*16)-4,8,8)}}}
// 地上的預警：紅色直線（衝刺／鉗擊）
function w3Ground(cx0,shy){const s=S0,t=s.t,b=s.boss;if(!b||!b.w3||!b.lane)return;const L=b.lane;if(t<L.t0)return;const u=clamp((t-L.t0)/(L.t1-L.t0),0,1),x=L.x-cx0,y=L.y+shy,x2=x+L.f*L.len,w=L.w;
  X.save();X.fillStyle=`rgba(255,40,30,${0.14+0.2*u})`;X.fillRect(Math.min(x,x2),y-w/2,Math.abs(x2-x),w);
  X.fillStyle='rgba(255,70,40,0.32)';const xf=x+L.f*L.len*u;X.fillRect(Math.min(x,xf),y-w/2,Math.abs(xf-x),w);
  X.lineWidth=4;X.strokeStyle=`rgba(255,${Math.floor(60+120*(Math.floor(t*10)%2))},60,0.95)`;X.strokeRect(Math.min(x,x2),y-w/2,Math.abs(x2-x),w);
  // 箭頭
  X.fillStyle='rgba(255,220,200,0.85)';for(let i=1;i<4;i++){const ax=x+L.f*L.len*(i/4),k=L.f;X.beginPath();X.moveTo(ax+k*14,y);X.lineTo(ax-k*6,y-10);X.lineTo(ax-k*6,y+10);X.closePath();X.fill()}X.restore()}
// 尾刺地刺（粗輪廓＋3 階色塊）、旋掃殘影、吆喝聲波
function w3Air(cx0,shy){const s=S0,t=s.t,b=s.boss;
  for(const p of s.w3sp||[]){const age=t-p.t0,x=Math.round(p.x-cx0),y=Math.round(p.y+shy),up=Math.min(1,age/0.08),dn=age>1.0?Math.max(0,1-(age-1.0)/0.4):1,h=Math.round(150*up*dn);if(h<=2)continue;
    const rare=b&&b.rare;const C=rare?['#1A1016','#2C3550','#4A5A84','#8EA6D8']:['#1A1016','#3A2A26','#6A4A3C','#B07A52'];
    const sp=[[-34,0.62],[0,1],[30,0.7]];for(const [ox,k] of sp){const hh=Math.round(h*k),bw=Math.round(26*k)+8;
      const pts=[[x+ox-bw,y+4],[x+ox-Math.round(bw*0.25),y-hh],[x+ox+Math.round(bw*0.3),y-hh+10],[x+ox+bw,y+4]];
      X.beginPath();X.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))X.lineTo(q[0],q[1]);X.closePath();X.fillStyle=C[2];X.fill();X.lineWidth=4;X.strokeStyle=C[0];X.stroke();
      X.beginPath();X.moveTo(x+ox-Math.round(bw*0.25),y-hh+4);X.lineTo(x+ox+Math.round(bw*0.3),y-hh+12);X.lineTo(x+ox+Math.round(bw*0.5),y);X.lineTo(x+ox,y);X.closePath();X.fillStyle=C[1];X.fill();
      X.beginPath();X.moveTo(x+ox-Math.round(bw*0.25),y-hh+6);X.lineTo(x+ox-Math.round(bw*0.55),y-Math.round(hh*0.35));X.lineTo(x+ox-Math.round(bw*0.2),y-Math.round(hh*0.4));X.closePath();X.fillStyle=C[3];X.fill();
      X.fillStyle=rare?'rgb(120,170,255)':'rgb(255,120,50)';X.fillRect(x+ox-3,y-Math.round(hh*0.6),6,Math.round(hh*0.3))}}
  if(!b||!b.w3||b.m.dying)return;const m=b.m,a=b.atk;
  if(a&&a.k==='sweep'&&t>=a.spin&&t<a.spin+0.75){const g=(t-a.spin)/0.75,x=m.x-cx0,y=m.y+shy-60;X.save();for(let i=0;i<3;i++){const st=g*Math.PI*4-i*0.5;X.globalAlpha=(1-g)*(0.8-i*0.22);X.beginPath();X.ellipse(x,y,300,120,0,st,st+1.6);X.lineWidth=22-i*6;X.strokeStyle=b.rare?'rgb(120,160,255)':'rgb(255,130,60)';X.stroke();X.lineWidth=6;X.strokeStyle='rgb(26,16,22)';X.stroke()}X.restore()}
  if(a&&a.k==='shout'&&b.ring){const age=t-b.ring;if(age>0&&age<1.0){const x=m.x-cx0,y=m.y+shy-150;X.save();for(let i=0;i<2;i++){const r=40+(age+i*0.25)*260;X.globalAlpha=Math.max(0,1-age-i*0.25)*0.8;X.beginPath();X.ellipse(x,y,r,r*0.55,0,0,Math.PI*2);X.lineWidth=10;X.strokeStyle='rgb(255,190,110)';X.stroke();X.lineWidth=4;X.strokeStyle='rgb(26,16,22)';X.stroke()}X.restore()}}}
// ---------- 王血條（稀有標籤＋破防條） ----------
function w3Bar(b){const s=S0,t=s.t,m=b.m,sc=b.w3==='sc';const x0=360,x1=920,y=170,f=clamp(m.hp/m.hpmax,0,1);const stag=t<b.stagU;
  rrect(x0-8,y-30,x1+8,y+(sc?36:22),6,'rgba(12,8,10,0.82)',b.rare?'rgb(150,180,255)':rgb(GOLDC),2);
  T(b.name,x0,y-16,FS(17),b.rare?[200,220,255]:[255,226,200],2,[0,0,0],'lm');
  if(b.rare){const tx=x0+tw(b.name,FS(17))+12;rrect(tx,y-27,tx+46,y-5,5,'rgb(70,90,170)','rgb(200,220,255)',2);T('稀有',tx+23,y-16,FN(13),[255,255,255],2,[0,0,0],'mm')}
  T(stag?`破防！ ${Math.ceil(b.stagU-t)}s`:(b.atk&&b.atk.pun&&t>=b.atk.pun)?'破綻時機！':'',x1,y-16,FN(14),stag?[255,220,120]:[170,255,170],2,[0,0,0],'rm');
  X.fillStyle='rgba(0,0,0,0.9)';X.fillRect(x0,y-3,x1-x0,16);X.fillStyle=b.rare?'rgb(80,90,200)':'rgb(200,40,40)';X.fillRect(x0+2,y-1,Math.round((x1-x0-4)*f),12);X.fillStyle=b.rare?'rgb(160,180,255)':'rgb(255,120,100)';X.fillRect(x0+2,y-1,Math.round((x1-x0-4)*f),3);
  T(`${Math.max(0,m.hp).toLocaleString('en-US')} / ${m.hpmax.toLocaleString('en-US')}`,(x0+x1)/2,y+5,FN(11),[255,255,255],2,[0,0,0],'mm');
  if(sc){const bf=stag?clamp(1-(b.stagU-t)/W3B.sc.stag,0,1):clamp(b.brk,0,1);T('破防',x0,y+24,FN(12),[255,220,140],2,[0,0,0],'lm');X.fillStyle='rgba(0,0,0,0.9)';X.fillRect(x0+40,y+18,x1-x0-40,10);
    X.fillStyle=stag?(Math.floor(t*6)%2?'rgb(255,240,160)':'rgb(255,190,80)'):'rgb(240,180,60)';X.fillRect(x0+42,y+20,Math.round((x1-x0-44)*bf),6);X.fillStyle='rgba(255,250,220,0.8)';X.fillRect(x0+42,y+20,Math.round((x1-x0-44)*bf),2)}}
// ---------- 倒下＋掉寶 ----------
function w3Loot(m){const s=S0,b=s.boss,D=DIF();
  if(b.w3==='gg'){for(let i=0;i<4;i++)lootPush('coin',m,{amt:Math.round(300*D.gold),vx:U(-300,300)});lootPush('gear',m,{it:rollDrop(0),vx:U(-200,200)});
    if(Math.random()<0.35+D.drop)lootPush('gear',m,{it:rollDrop(1),vx:U(-200,200)});if(typeof TFP_BOSS!=='undefined'&&Math.random()<TFP_BOSS)lootPush('tfpot',m,{vx:U(-200,200)});return}
  m2BossLoot(m);
  if(b.rare){for(let i=0;i<6;i++)lootPush('coin',m,{amt:Math.round(500*D.gold),vx:U(-320,320)});lootPush('gear',m,{it:rollDrop(2),vx:U(-220,220)});
    if(Math.random()<0.5+D.drop)lootPush('gear',m,{it:rollDrop(),vx:U(-220,220)});if(typeof TFP_BOSS!=='undefined'&&Math.random()<TFP_BOSS)lootPush('tfpot',m,{vx:U(-200,200)})}}
function w3Die(m){const s=S0,t=s.t,b=s.boss,sc=b.w3==='sc';m.dieT0=t;m.dieT=t+2.6;b.atk=null;b.lane=null;s.tele=[];s.hitstop=0.7;shake(16,0.9);sfx('crit',0.7);
  for(const o of s.mobs)if(o!==m&&!o.gone){o.dying=true;o.state='down';o.dieT=t+0.4}
  try{if(typeof m25Gain==='function'&&!m.__xp25){m.__xp25=1;const g=m25Gain(LV25.mob.boss*lvStF(RUN.st)*(LV25.dx[RUN.d]||1)*(sc?W3B.sc.xp:W3B.gg.xp),'boss');s.log.push([t,'exp','首領經驗 +'+g.toLocaleString('en-US')])}}catch(e){}
  setTimeout0(1.0,()=>w3Loot(m));
  s.w3b.done=true;s.w3b.kill=t;
  setTimeout0(1.2,()=>{card('勝利','VICTORY',3.0);sfx('ready',0.5);S0.lock=null;
    if(S0.stage==='canyon'){S0.caveOn=true;setTimeout0(2.2,()=>sub('','峽谷盡頭的礦坑入口……走到坑口按 E（或 ↑）進入。',3.8))}
    else{S0.mineDone=true;setTimeout0(2.2,()=>sub('','坑道深處透出微光……往右走 →',3.0))}});
  setTimeout0(0.5,()=>sub(b.name,sc?'嘶……嘶嘶……':'怎麼可能……輸給……',2.2))}
window.__w3={boss:()=>{const s=S0;if(!s||!w3St())return false;s.mobs.forEach(m=>{if(m.kind!=='boss'){m.gone=true}});s.wave=WAVES.length;s.toSpawn=[];s.extra=0;s.waveState='pre';s.w3b={st:s.stage,t:s.t};s.lock=[CAMMAX,CAMMAX];s.cam=CAMMAX;s.P.x=CAMMAX+360;w3Spawn();return true},skill:k=>w3Skill(k),cfg:W3B};

// W2.3→W3：C 平衡（刺蠍 破防 brkK 0.08→0.18、破防 4.5→3.0 秒、每次破防後門檻 ×1.25（最多 0.30）；泥魔像 出招間隔 2.0–3.0→1.3–2.0 秒）
// B：武器 +15 → 破防中對首領傷害 +30%
const W3BRK15=0.30;
window.m2Dmg=(o=>function(v,m,mv,crit){let r=o.apply(this,arguments);try{const s=S0,b=s&&s.boss;if(mv!=='pet'&&m&&m.kind==='boss'&&b&&b.w3==='sc'&&s.t<b.stagU&&slotE('w')>=15)r=Math.round(r*(1+W3BRK15))}catch(e){}return r})(window.m2Dmg);
try{if(typeof ENH_MS!=='undefined'&&ENH_MS.w[2])ENH_MS.w[2][1]='對首領傷害再 +10%、破防中傷害 +30%'}catch(e){}
// ================= W3 配樂：新戰鬥進行曲接線＋點唱機曲名（src28/music_w3.js → web/m28.js，接在 boss_w3.js 後面） =================
// 曲目與放置見 design/music_catalog_zh.md；產生器 music/w3_marches.py、music/w3_redrock_full.py。
// 王戰曲：泥魔像隊長→泥盔隊長進行曲、灰燼刺蠍→焦土刺尾急行曲、暮色刺蠍（稀有）／寶石掠奪者（隱藏關）→暮色秘寶追擊戰、
//         大地結晶變異蜘蛛（第四關王）→總匯英雄進行曲。王倒下約 1.5 秒後淡回這一關的道中曲。
// 不改其他檔：只用輪詢看 S0.boss，切換時呼叫既有的 m2Music。新曲在開機後背景載入，不拖慢開機。
const W3MUS={gg:'w3_mudcap',scA:'w3_ashsting',scB:'w3_duskhunt',sp:'w3_heroes',ms:'w3_duskhunt'};
const W3MUS_ALL=['w3_mudcap','w3_ashsting','w3_duskhunt','w3_heroes'];
// 第四關王房：進場先放蛛網礦道，蜘蛛落下（王出現）才切王戰曲（原本 spb 共用風笛戰歌）
MUSIC.spb='m_spider';
function w3BossKey(b){if(!b)return null;if(b.w3==='gg')return 'gg';if(b.w3==='sc')return b.rare?'scB':'scA';if(b.sp)return 'sp';if(b.ms)return 'ms';return null}
function w3StageTrack(){const s=S0;if(!s)return null;return MUSIC[s.stage]||null}
const W3M={on:null,ret:null,boss:null};window.__w3mus=W3M;
function w3MusLoad(n){if(MUS[n])return Promise.resolve(true);if(!W3M.ld)W3M.ld={};if(!W3M.ld[n])W3M.ld[n]=loadMus(n).then(()=>!!MUS[n]);return W3M.ld[n]}
function w3MusGo(n){if(!n)return;w3MusLoad(n).then(ok=>{if(ok&&W3M.want===n&&mode==='play')m2Music(n)})}
function w3MusTick(){try{
  if(typeof mode==='undefined'||mode!=='play'||!S0){if(mode!=='play'){W3M.on=null;W3M.boss=null;W3M.ret=null}return}
  const s=S0,b=s.boss,k=w3BossKey(b);
  if(k&&b.m&&!b.m.dying&&!b.m.gone){
    if(W3M.boss!==b){W3M.boss=b;W3M.on=W3MUS[k];W3M.ret=null;W3M.want=W3M.on;w3MusGo(W3M.on)}
    else if(CURM!==W3M.on&&!MG[W3M.on]&&MUS[W3M.on]&&!(s.npc))m2Music(W3M.on);  // 被別的場景切走（例如重生）就切回來
    return}
  if(W3M.on){  // 王倒下（或王被清掉）→ 等勝利字卡出來再淡回道中曲
    if(W3M.ret==null)W3M.ret=s.t+1.5;
    if(s.t>=W3M.ret){const n=w3StageTrack();W3M.on=null;W3M.boss=null;W3M.ret=null;W3M.want=n;if(n&&CURM!==n)m2Music(n)}}
}catch(e){(window.__err||[]).push('w3mus '+e)}}
setInterval(w3MusTick,120);
// 開機後背景載入 4 首新曲（不放進 M2MUS，以免拖慢開機）
// 等開機的圖片和音樂都載完（document.title 換成遊戲名稱）再過 2 秒，一首一首載，不跟開機搶頻寬
setTimeout(function pre(){if(typeof TITLE==='undefined'||document.title!==TITLE){setTimeout(pre,500);return}let i=0;const next=()=>{if(i<W3MUS_ALL.length)w3MusLoad(W3MUS_ALL[i++]).then(next)};setTimeout(next,2000)},1000);
// 點唱機：新曲加進去（標「新」），舊曲顯示正式曲名（design/music_catalog_zh.md）
{const NM={title:'總匯英雄傳・序曲',bgm:'赤岩進行曲',m_s2:'灰野的風聲',m_mine:'赤晶礦脈',m_shrine:'女神像的祈禱',m_b4:'水晶監視者甦醒',m_shop:'奶油桂花喵的小攤',m_money:'理查宅邸的金幣雨'};
  for(const j of JUKE)if(NM[j[0]])j[1]=NM[j[0]];
  JUKE.splice(0,0,['w3_heroes','總匯英雄進行曲'],['w3_mudcap','泥盔隊長進行曲'],['w3_ashsting','焦土刺尾急行曲'],['w3_duskhunt','暮色秘寶追擊戰']);
  NEWMUS.length=0;NEWMUS.push(...W3MUS_ALL,'bgm');}
