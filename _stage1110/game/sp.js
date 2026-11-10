// ================= 第四關：巴里2礦區 2層1區（蜘蛛影片轉化，暫定數值） =================
// 3 個怪物區域（大地魔像碎片・坑道蠍・乙太薩滿）→「將移動至下一區域。」→ 巢穴：大地結晶變異蜘蛛（從天花板降下，無無敵階段）
// 技能名稱與順序照影片：黏液噴吐 → 女王的爪牙 → 毒爪踩踏 → 女王的爪牙 → 咆哮 → 猛毒襲擊（＋黑蜘蛛）
const SPB={hp:1400000,seq:['spit','claw','stomp','claw','roar','venom'],nm:{spit:'黏液噴吐',claw:'女王的爪牙',stomp:'毒爪踩踏',roar:'咆哮',venom:'猛毒襲擊'}};
const SPST=['sp1','sp2','sp3','spb'];const isSP=()=>!!(S0&&SPST.includes(S0.stage));
const SPN=['rk_walk0','rk_walk1','rk_attack','rk_hit','rk_down','sc_walk0','sc_walk1','sc_attack','sc_hit','sc_down','sh_bwalk','sh_bwalk1','sh_bdraw','sh_bhit','sh_down','spd_idle','spd_rear','spd_slam','spd_spit','spd_roar','spd_dead'];
const BSM={walk0:'spd_idle',walk1:'spd_idle',attack:'spd_rear',hit:'spd_slam',down:'spd_dead'};
{const W0={};for(const k of ['m2Assets','anchor','spr','spawnMob','m2Say','m2HUD','m2OnStage','card','sub','drawTele'])W0[k]=window[k];
window.m2Assets=()=>[...W0.m2Assets(),'sp_tunnel','sp_nest',...SPN.flatMap(n=>['s_'+n,'f_'+n,'g_'+n])];
window.anchor=n=>n.startsWith('rk_')||n.startsWith('sh_')?[140,120,70,110]:n.startsWith('sc_')?[160,90,80,80]:n.startsWith('spd_')?[360,230,180,216]:W0.anchor(n);
window.spr=(n,sx,sy,o={})=>{if(n.startsWith('bs_')){const k=n.slice(3);return W0.spr(BSM[k]||'spd_idle',sx,sy,Object.assign({},o,{sc:0.3,dy:(o.dy||0)/0.3+(k==='walk1'?-3:0),filter:'brightness(0.42) saturate(0.25)',glow:null}))}
  if(n==='sh_bwalk'&&S0&&Math.floor(S0.t/0.22)%2)n='sh_bwalk1';return W0.spr(n,sx,sy,o)};
window.spawnMob=(k,side)=>{const m=W0.spawnMob(k,side);if(isSP())m.skin=k==='bow'?'sh':CH(['rk','rk','sc']);return m};
window.m2Say=(m,p)=>isSP()?undefined:W0.m2Say(m,p);
window.card=(txt,sb,dur)=>{if(isSP()&&txt==='勝利'&&!(S0.boss&&S0.boss.sp&&S0.boss.m.dying))return;return W0.card(txt,sb,dur)};
window.sub=(who,line,dur)=>{if(isSP()&&(line==='坑道深處透出微光……往右走 →'||line==='增援出現了！'))return;return W0.sub(who,line,dur)};
window.m2OnStage=n=>{W0.m2OnStage(n);if(SPST.includes(n))spOnStage(n)};
window.m2HUD=(cx0,shy)=>{W0.m2HUD(cx0,shy);if(isSP())spHUD()};
window.drawTele=(cx0,shy)=>{if(isSP())spGround(cx0,shy);W0.drawTele(cx0,shy);if(isSP())spAir(cx0,shy)};}
function spOnStage(n){const s=S0;s.pud=[];s.chest=null;
  if(n==='sp1')setTimeout0(2.3,()=>sub('','寒風縈繞的古老礦山。深不見底的黑暗之下，究竟沉睡著什麼呢？',4.4));
  if(n==='spb'){s.npc=null;setupSP()}}
// 區域出口：「將移動至下一區域。」（影片原文）
function spHUD(){const s=S0,t=s.t,P=s.P,b=s.boss;
  if(s.stage!=='spb'&&s.mineDone&&P.x>WW-320&&!s.trans){rrect(470,250,810,312,10,'rgba(12,8,10,0.85)',rgb(GOLDC),2);T('將移動至下一區域。',640,272,FS(20),[255,244,214],2,[0,0,0],'mm');T('往右 →',640,298,FN(14),[200,190,170],2,[0,0,0],'mm')}
  if(b&&b.sp&&b.sk&&t-b.sk[1]<1.8){const a=Math.min(1,(1.8-(t-b.sk[1]))/0.3),pop=1+Math.max(0,0.12-(t-b.sk[1])*0.6);X.save();X.globalAlpha=a;X.translate(640,262);X.scale(pop,pop);
    X.fillStyle='rgba(8,8,10,0.92)';X.fillRect(-92,-20,184,40);X.strokeStyle='rgba(235,235,240,0.95)';X.lineWidth=2;X.strokeRect(-88,-16,176,32);T(b.sk[0],0,1,FN(18),[240,240,245],0,[0,0,0],'mm');X.restore()}}
// ---------- 大地結晶變異蜘蛛 ----------
function setupSP(){const s=S0,t=s.t,D=DIF();
  s.boss={sp:true,name:'大地結晶變異蜘蛛',m:null,nextAtk:t+3.4,atk:null,enterT:t,hitT:-9,seq:0,sk:null};
  const m=mob('boss',860,clamp(575,YMIN+10,YMAX-10));m.hp=m.hpmax=Math.round(SPB.hp*D.hp);m.face=-1;m.enter=false;s.mobs.push(m);s.boss.m=m;
  s.P.hp=HPMAX;s.P.rh=0;s.bossT0=t;s.lock=[0,0];s.st={dmg:0,maxHit:0,hits:0,crits:0,zj:0,t0:t};s.maxComboB=0;
  setTimeout0(2.0,()=>card('大地結晶變異蜘蛛','BOSS',2.4))}
function spSkill(k){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P,f=m.face;b.sk=[SPB.nm[k],t];
  if(k==='spit'){b.atk={k,t0:t,end:t+2.1};b.cone={x:m.x+f*70,y:m.y,f,len:560,t0:t,t1:t+0.95,hit:false}}
  if(k==='claw'){b.atk={k,t0:t,end:t+2.9};for(let i=0;i<3;i++)setTimeout0(i*0.85,()=>{if(!s.boss||s.boss.m.dying)return;s.tele.push({x:clamp(P.x,60,WW-60),y:clamp(P.y,YMIN,YMAX),r:92,t0:s.t,t1:s.t+0.72,dmg:850,big:true,claw:1})})}
  if(k==='stomp'){b.atk={k,t0:t,end:t+1.9};s.tele.push({x:m.x,y:m.y,r:270,t0:t,t1:t+1.15,dmg:1200,big:true})}
  if(k==='roar'){b.atk={k,t0:t,end:t+1.7};b.wave={t0:t+0.4,hit:false}}
  if(k==='venom'){b.atk={k,t0:t,end:t+2.2};for(let i=0;i<5;i++){const tx=clamp(P.x+(i?U(-260,260):0),60,WW-60),ty=clamp(P.y+(i?U(-50,50):0),YMIN,YMAX);
      s.tele.push({x:tx,y:ty,r:76,t0:t+0.2+i*0.12,t1:t+1.15+i*0.12,dmg:420,poison:true,pud:1,from:[m.x+f*40,m.y-120]})}
    const alive=s.mobs.filter(o=>!o.gone&&!o.dying&&o.kind==='sword').length;
    if(alive<3)for(let i=0;i<2;i++)setTimeout0(1.4+i*0.3,()=>{if(!s.boss||s.boss.m.dying)return;const mm=mob('sword',clamp(m.x+U(-320,320),80,WW-80),U(YMIN+8,YMAX-8));mm.skin='bs';mm.hp=mm.hpmax=Math.round(mm.hpmax*0.45);mm.enter=false;mm.summon=1;mm.face=P.x>mm.x?1:-1;s.mobs.push(mm);puff(mm.x,mm.y-20,12,[60,50,60],40,0.5,3)})}}
function stepSP(dt){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P;
  for(const c of s.tele)if(c.done&&c.pud&&!c.pd){c.pd=1;s.pud.push({x:c.x,y:c.y,r:c.r*1.05,t0:t,t1:t+7,c:'g',dmg:160,nt:t})}
  for(const p of s.pud)if(t<p.t1&&t>=p.nt&&!P.dead&&P.h<40&&Math.hypot(P.x-p.x,(P.y-p.y)*2.2)<p.r){p.nt=t+0.5;hurtP(p.dmg,P.x,P.y-50);proc(p.c==='g'?'中毒':'黏液',p.c==='g'?[120,220,90]:[230,210,80],'毒')}
  s.pud=s.pud.filter(p=>t<p.t1);
  if(m.dying)return;
  if(t-b.enterT<1.8){m.moving=false;return}
  if(!b.landed){b.landed=true;shake(16,0.6);sfx('crit',0.5);puff(m.x,m.y,26,[120,110,120],90,0.7,3)}
  if(t<m.frz)return;
  const cn=b.cone;if(cn&&!cn.hit&&t>=cn.t1){cn.hit=true;shake(6,0.3);
    for(let i=0;i<3;i++)s.pud.push({x:clamp(cn.x+cn.f*(170+i*150),60,WW-60),y:cn.y+U(-14,14),r:72+i*10,t0:t,t1:t+6,c:'y',dmg:110,nt:t});
    const dx=(P.x-cn.x)*cn.f;if(!P.dead&&P.h<80&&dx>0&&dx<cn.len&&Math.abs(P.y-cn.y)<26+dx*0.11)hurtP(800,P.x,P.y-70)}
  const wv=b.wave;if(wv&&!wv.hit&&t>=wv.t0+0.15){wv.hit=true;shake(10,0.6);if(!P.dead&&Math.hypot(P.x-m.x,(P.y-m.y)*1.8)<340)hurtP(500,P.x,P.y-70)}
  if(b.atk){m.moving=false;if(t>=b.atk.end){b.atk=null;b.cone=null;b.nextAtk=t+U(1.5,2.4)*DIF().cd}return}
  const want=P.x>=m.x?1:-1;if(t-(m.turnT||0)>0.4){if(m.face!==want)m.turnT=t;m.face=want}
  const gx=P.x-want*200,ddx=gx-m.x,ddy=P.y-m.y,d=Math.hypot(ddx,ddy*1.6);m.moving=d>16;if(m.moving){m.x+=ddx/d*90*dt;m.y+=ddy/d*50*dt}
  m.x=clamp(m.x,150,WW-150);m.y=clamp(m.y,YMIN+6,YMAX-6);
  if(t>=b.nextAtk&&!P.dead&&!s.trans){spSkill(SPB.seq[b.seq%SPB.seq.length]);b.seq++}}
function spFrame(){const s=S0,b=s.boss,m=b.m,t=s.t;if(m.dying)return t-m.dieT0<0.35?'spd_roar':'spd_dead';if(t-b.enterT<1.8)return 'spd_idle';const a=b.atk;
  if(a){const g=t-a.t0;if(a.k==='spit')return g<0.95?'spd_idle':g<1.6?'spd_spit':'spd_idle';if(a.k==='stomp')return g<1.15?'spd_rear':g<1.6?'spd_slam':'spd_idle';
    if(a.k==='roar')return g<1.4?'spd_roar':'spd_idle';if(a.k==='venom')return g<1.0?'spd_spit':'spd_idle';if(a.k==='claw')return (g%0.85)<0.6?'spd_rear':'spd_slam'}
  return t-b.hitT<0.2?'spd_slam':'spd_idle'}
function drawSP(m,sx,sy){const s=S0,t=s.t,b=s.boss,ea=t-b.enterT;let dy=0;
  if(ea<1.8){const u=clamp(ea/1.5,0,1);dy=-(1-u)*(1-u)*640;X.fillStyle='rgba(225,225,235,0.75)';X.fillRect(Math.round(sx)-1,0,2,Math.max(0,sy+dy-230))}
  let a=1;if(m.dying){const age=t-m.dieT0;a=age<2.4?1:Math.max(0,1-(age-2.4)/0.6)}
  const bob=!b.atk&&!m.dying&&m.moving?Math.floor(t/0.16)%2:0;spr(spFrame(),sx,sy+dy,{flip:m.face<0,flash:t<m.flash,alpha:a,dy:-bob})}
function spDie(m){const s=S0,t=s.t,b=s.boss;m.dieT0=t;m.dieT=t+3.0;s.winT=t+1.2;b.atk=null;b.cone=null;b.wave=null;s.tele=[];s.hitstop=0.9;shake(18,1.0);sfx('crit',0.7);
  for(const o of s.mobs)if(o!==m&&!o.gone){o.dying=true;o.state='down';o.dieT=t+0.4}
  card('勝利','VICTORY',3.0);
  setTimeout0(1.6,()=>{s.chest={x:m.x,y:m.y,t0:s.t};shake(8,0.3);sfx('ready',0.5);m2BossLoot(s.chest)})}
// ground decals: 黏液（黃）、猛毒（綠）、黃金寶箱
function spGround(cx0,shy){const s=S0,t=s.t;
  for(const p of s.pud||[]){const x=p.x-cx0,y=p.y+shy,u=clamp((t-p.t0)/0.25,0,1),fa=clamp((p.t1-t)/0.8,0,1),g=p.c==='g';
    nat(Math.round(p.r*2/S)+2,Math.round(p.r/1.1/S)+2,c=>{const w=Math.round(p.r*2/S),h=Math.round(p.r/1.1/S);ell(c,1+w*(1-u)/2,1+h*(1-u)/2,1+w-w*(1-u)/2,1+h-h*(1-u)/2);c.fillStyle=g?'rgba(70,170,40,0.62)':'rgba(220,190,40,0.62)';c.fill();
      ell(c,1+w*0.2,1+h*0.2,1+w*0.8,1+h*0.7);c.fillStyle=g?'rgba(120,230,70,0.55)':'rgba(255,236,110,0.5)';c.fill();
      c.fillStyle=g?'rgb(200,255,160)':'rgb(255,250,200)';for(let i=0;i<4;i++){const ph=(t*1.3+i*0.37+p.x*0.01)%1;c.fillRect(Math.floor(2+((i*37+p.x)%Math.max(1,w-3))),Math.floor(1+h*0.3+((i*13)%Math.max(1,h*0.5))),1,1)}},x,y,false);X.globalAlpha=1;
    if(fa<1){}}
  const b=s.boss;if(b&&b.sp&&b.cone&&!b.cone.hit&&t>=b.cone.t0){const c=b.cone,u=clamp((t-c.t0)/(c.t1-c.t0),0,1),x=c.x-cx0,y=c.y+shy;X.save();X.beginPath();X.moveTo(x,y);X.lineTo(x+c.f*c.len,y-26-c.len*0.11);X.lineTo(x+c.f*c.len,y+26+c.len*0.11);X.closePath();
    X.fillStyle=`rgba(255,40,30,${0.12+0.16*u})`;X.fill();X.lineWidth=3;X.strokeStyle=`rgba(255,${Math.floor(60+120*(Math.floor(t*10)%2))},60,0.9)`;X.stroke();X.restore()}
  if(s.chest){const c=s.chest,x=Math.round(c.x-cx0),y=Math.round(c.y+shy),age=t-c.t0,gl=0.6+0.4*Math.sin(t*5);
    X.save();X.globalAlpha=0.5*gl;const gr=X.createRadialGradient(x,y-30,6,x,y-30,140);gr.addColorStop(0,'rgba(255,230,120,0.9)');gr.addColorStop(1,'rgba(255,200,80,0)');X.fillStyle=gr;X.fillRect(x-150,y-180,300,220);X.restore();
    nat(34,24,c2=>{c2.fillStyle='rgb(120,70,20)';c2.fillRect(1,9,32,14);c2.fillStyle='rgb(230,170,50)';c2.fillRect(2,10,30,12);c2.fillStyle='rgb(255,226,120)';c2.fillRect(2,10,30,2);c2.fillRect(15,10,4,12);
      const op=Math.min(1,age/0.4);c2.fillStyle='rgb(120,70,20)';c2.fillRect(1,Math.round(1+4*(1-op)),32,9);c2.fillStyle='rgb(245,190,60)';c2.fillRect(2,Math.round(2+4*(1-op)),30,7);c2.fillStyle='rgb(255,240,170)';c2.fillRect(2,Math.round(2+4*(1-op)),30,1);c2.fillStyle='rgb(90,50,10)';c2.fillRect(16,Math.round(6+4*(1-op)),2,3)},x,y-24,false)}}
function spAir(cx0,shy){const s=S0,t=s.t,b=s.boss;
  for(const c of s.tele){if(!c.pud||c.done||t<c.t0)continue;const u=clamp((t-c.t0)/(c.t1-c.t0),0,1),fx=c.from[0]+(c.x-c.from[0])*u,fy=c.from[1]+(c.y-c.from[1])*u-Math.sin(Math.PI*u)*180;
    X.fillStyle='rgb(60,150,40)';X.fillRect(Math.round(fx-cx0)-7,Math.round(fy+shy)-7,14,14);X.fillStyle='rgb(150,240,90)';X.fillRect(Math.round(fx-cx0)-5,Math.round(fy+shy)-5,8,8)}
  if(b&&b.sp&&b.atk&&b.atk.k==='spit'){const g=t-b.atk.t0;if(g>0.95&&g<1.6){const m=b.m,f=m.face;for(let i=0;i<14;i++){const k=((g-0.95)*2.4+i/14)%1,x=m.x+f*(70+k*520)-cx0,y=m.y-40+shy+(1-k)*-40+Math.sin(i*2.1)*k*40;X.fillStyle=i%2?'rgb(250,226,90)':'rgb(200,170,40)';X.fillRect(Math.round(x)-5,Math.round(y)-4,10,8)}}}
  if(b&&b.sp&&b.wave){const age=t-b.wave.t0;if(age>0&&age<1.0){const m=b.m,r=60+age*420,x=m.x-cx0,y=m.y+shy-30;X.save();X.globalAlpha=(1-age)*0.7;X.beginPath();X.ellipse(x,y,r,r/2.4,0,0,Math.PI*2);X.lineWidth=18;X.strokeStyle='rgba(190,190,200,0.6)';X.stroke();X.lineWidth=4;X.strokeStyle='rgba(235,235,240,0.8)';X.stroke();X.restore()}}}
// 乙太薩滿的攻擊：青色水晶彈（取代箭矢外觀）
function spBolt(ar,x,y){if(!isSP())return false;X.fillStyle='rgb(30,90,160)';X.fillRect(Math.round(x)-8,Math.round(y)-4,16,8);X.fillStyle='rgb(120,220,255)';X.fillRect(Math.round(x)-6,Math.round(y)-2,12,4);X.fillStyle='rgb(230,250,255)';X.fillRect(Math.round(x)+(ar.dir>0?2:-6),Math.round(y)-1,4,2);return true}
window.__sp={boss:()=>{if(!S0)return;startTrans('spb')}};
