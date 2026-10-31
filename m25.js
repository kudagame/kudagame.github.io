// M2.5（自動產生，請改 src25/）
// ---- src25/a_lv.js
// ==== M2.5 a_lv.js：等級 1–65、經驗曲線、覺醒進度
const LV25={max:65,A:8.5,P:1.85,B:50,awkNeed:18000,awkShard:3,awkGold:1500,
  dx:[1,1.6,2.6,4.2,6.5],          // 難度經驗倍率（普通→深淵）
  mob:{n:10,str:22,sum:4,boss:150,clear:40}};
const lvNeed=L=>L>=LV25.max?LV25.awkNeed:Math.round(LV25.A*Math.pow(L,LV25.P)+LV25.B);
const lvStF=st=>1+0.3*((st|0)-1);
function lvTotal(L){let s=0;for(let i=1;i<L;i++)s+=lvNeed(i);return s}
function awkBlank(){return{xp:0,pts:0,fills:0,a:{atk:0,hp:0,crit:0,ms:0,drop:0,cls:0}}}
function m25Fix(c){if(!c)return;c.lv=Math.max(1,Math.min(LV25.max,c.lv|0||1));c.xp=Math.max(0,+c.xp||0);
  if(!c.awk||typeof c.awk!=='object')c.awk=awkBlank();const b=awkBlank();for(const k in b)if(k!=='a'&&!(+c.awk[k]>=0))c.awk[k]=0;
  if(!c.awk.a||typeof c.awk.a!=='object')c.awk.a=b.a;for(const k in b.a)c.awk.a[k]=Math.max(0,Math.min(AWK[k]?AWK[k].cap:0,c.awk.a[k]|0));
  c.exp=c.lv>=LV25.max?100*c.awk.xp/LV25.awkNeed:100*c.xp/lvNeed(c.lv)}
// 讓 HUD 的 EXP% 跟著真實經驗值
function m25SyncS(){if(!SAVE)return;m25Fix(SAVE);if(S0){S0.lv=SAVE.lv;S0.exp=SAVE.exp}}
const M25Q=[];   // 升級卡片佇列
function m25Gain(x,why){if(!SAVE||!(x>0))return 0;x=Math.round(x);const s=S0;if(s)s.runXp=(s.runXp||0)+x;
  if(SAVE.lv<LV25.max){SAVE.xp=(+SAVE.xp||0)+x;
    while(SAVE.lv<LV25.max&&SAVE.xp>=lvNeed(SAVE.lv)){SAVE.xp-=lvNeed(SAVE.lv);SAVE.lv++;m25LevelUp(SAVE.lv)}
    if(SAVE.lv>=LV25.max&&SAVE.xp>0){const r=SAVE.xp;SAVE.xp=0;SAVE.awk.xp+=r}}
  else SAVE.awk.xp+=x;
  if(SAVE.lv>=LV25.max)while(SAVE.awk.xp>=LV25.awkNeed){SAVE.awk.xp-=LV25.awkNeed;m25AwkFill()}
  m25SyncS();return x}
function m25LevelUp(L){const old=HPMAX;m22ApplyHero();calcGS();if(S0&&S0.P&&!S0.P.dead)S0.P.hp=Math.min(HPMAX,S0.P.hp+Math.max(0,HPMAX-old));
  const ms=msAt(L),now=performance.now(),c=M25Q[M25Q.length-1];
  if(c&&c.k==='lv'&&(M25Q.length>1||now-c.t0<1200)){c.L=L;if(ms)c.ms.push(ms);c.next=msNext(L);if(M25Q.length===1)c.t0=Math.max(c.t0,now-600)}
  else M25Q.push({k:'lv',L0:L,L,t0:now,ms:ms?[ms]:[],next:msNext(L)});try{sfx('ready',0.5)}catch(e){}
  if(S0&&S0.log)S0.log.push([S0.t,'exp',`升到 Lv.${L}！`+(ms?'　里程碑：'+ms.tx:'')])}
function m25AwkFill(){const A=SAVE.awk;A.pts++;A.fills++;SAVE.shards=(SAVE.shards|0)+LV25.awkShard;SAVE.gold+=LV25.awkGold;if(S0)S0.gold=SAVE.gold;
  {const now=performance.now(),c=M25Q[M25Q.length-1];if(c&&c.k==='awk'&&(M25Q.length>1||now-c.t0<1200))c.n++;else M25Q.push({k:'awk',t0:now,n:1})}try{sfx('ready',0.5)}catch(e){}
  if(S0&&S0.log)S0.log.push([S0.t,'exp',`覺醒 +1 點（刻印碎片 +${LV25.awkShard}、金幣 +${LV25.awkGold}）`])}
// 每隻怪的經驗：種類 × 難度 × 關卡
function mobXp(m){const M=LV25.mob;const b=m.summon?M.sum:m.str?M.str:M.n;return b*lvStF(RUN.st)*(LV25.dx[RUN.d]||1)}
window.kill=(o=>function(m){const s=S0;const e0=s.exp,l0=s.lv;s.exp=0;const r=o.apply(this,arguments);s.exp=e0;s.lv=l0;s.cards=s.cards.filter(c=>c.txt!=='LEVEL UP');
  const g=m25Gain(mobXp(m),'mob');for(let i=s.log.length-1;i>=0&&i>=s.log.length-4;i--){const L=s.log[i];if(L[1]==='exp'&&String(L[2]).startsWith('經驗值')){L[2]='經驗值 +'+g.toLocaleString('en-US');break}}return r})(window.kill);
window.bossDie=(o=>function(m){const r=o.apply(this,arguments);if(m&&!m.__xp25){m.__xp25=1;const g=m25Gain(LV25.mob.boss*lvStF(RUN.st)*(LV25.dx[RUN.d]||1),'boss');if(S0)S0.log.push([S0.t,'exp','首領經驗 +'+g.toLocaleString('en-US')])}return r})(window.bossDie);
window.m2Clear=(o=>function(){const ok=mode==='play'&&!RUN.bonus&&S0;let first=false,b=0;if(ok){first=CL(RUN.st)<RUN.d+1;b=LV25.mob.clear*lvStF(RUN.st)*(LV25.dx[RUN.d]||1)*(first?2:1)}
  const r=o.apply(this,arguments);if(ok&&RES){const g=m25Gain(b,'clear');RES.xpClear=g;RES.xpFirst=first;RES.xpRun=S0.runXp||0;RES.lv=SAVE.lv}return r})(window.m2Clear);
window.m2Begin=(o=>function(){const r=o.apply(this,arguments);if(S0){S0.runXp=0;m25SyncS()}return r})(window.m2Begin);

// ---- src25/b_grow.js
// ==== M2.5 b_grow.js：等級成長、5 級里程碑、覺醒屬性、套用到 GS／HPMAX／傷害
const GROW25={hp:0.15,atk:0.15};   // Lv65 時合計 +15%（Lv1 = 0）
const lvGrowK=L=>Math.max(0,Math.min(LV25.max,L)-1)/(LV25.max-1);
// 里程碑：每 5 級；f=效果（加算）；ttl=稱號
const MS25={
  kudas:[[5,{ttl:'峽谷新人'},'稱號「峽谷新人」'],[10,{mvcd:0.03},'肩撞／踱地冷卻 −3%'],[15,{crit:0.01},'暴擊率 +1%'],[20,{wind:0.05},'斬風傷害 +5%'],
    [25,{ttl:'礦坑常客',gold:0.03},'稱號「礦坑常客」＋金幣 +3%'],[30,{mvcd:0.03},'肩撞／踱地冷卻 −3%（累計 −6%）'],[35,{cdmg:0.05},'暴擊傷害 +5%'],[40,{wind:0.05},'斬風傷害 +5%（累計 +10%）'],
    [45,{drop:0.03},'裝備掉落率 +3%'],[50,{ttl:'大劍老手',ms:0.03},'稱號「大劍老手」＋移動速度 +3%'],[55,{crit:0.01},'暴擊率 +1%（累計 +2%）'],[60,{kdr:0.05},'抗倒地 +5%'],
    [65,{ttl:'傳說的大劍士',awk:1},'稱號「傳說的大劍士」＋開啟覺醒']],
  bard:[[5,{ttl:'街頭藝人'},'稱號「街頭藝人」'],[10,{mvcd:0.03},'滑行／跪奏冷卻 −3%'],[15,{idea:0.10},'樂想增益持續 +10%'],[20,{def:0.02},'受到傷害 −2%'],
    [25,{ttl:'酒館歌手',gold:0.03},'稱號「酒館歌手」＋金幣 +3%'],[30,{mvcd:0.03},'滑行／跪奏冷卻 −3%（累計 −6%）'],[35,{skd:0.03},'技能傷害 +3%'],[40,{idea:0.10},'樂想增益持續 +10%（累計 +20%）'],
    [45,{drop:0.03},'裝備掉落率 +3%'],[50,{ttl:'旅行詩人',ms:0.03},'稱號「旅行詩人」＋移動速度 +3%'],[55,{crit:0.01},'暴擊率 +1%'],[60,{def:0.02},'受到傷害 −2%（累計 −4%）'],
    [65,{ttl:'傳說的吟遊詩人',awk:1},'稱號「傳說的吟遊詩人」＋開啟覺醒']]};
const msList=(k)=>MS25[k||HEROK]||MS25.kudas;
const msAt=L=>{const m=msList().find(x=>x[0]===L);return m?{L:m[0],f:m[1],tx:m[2]}:null};
const msNext=L=>{const m=msList().find(x=>x[0]>L);return m?{L:m[0],f:m[1],tx:m[2]}:null};
function msSum(L,k){const o={};for(const [l,f] of msList(k))if(l<=L)for(const n in f)if(n!=='ttl')o[n]=(o[n]||0)+f[n];return o}
function msTitle(L,k){let t='';for(const [l,f] of msList(k))if(l<=L&&f.ttl)t=f.ttl;return t}
// 覺醒屬性：每點效果、上限
const AWK={atk:{n:'攻擊',per:0.01,cap:10,u:'%'},hp:{n:'體力',per:0.015,cap:10,u:'%'},crit:{n:'暴擊率',per:0.005,cap:10,u:'%'},
  ms:{n:'移動速度',per:0.01,cap:6,u:'%'},drop:{n:'掉寶率',per:0.02,cap:10,u:'%'},cls:{n:'職業',per:0.03,cap:10,u:'%'}};
const AWK_ORDER=['atk','hp','crit','ms','drop','cls'];
const awkClsName=()=>isBard()?'樂想持續':'斬風威力';
const awkPer=k=>k==='cls'&&isBard()?0.05:AWK[k].per;
function awkV(k){const A=SAVE&&SAVE.awk;return A&&A.a?(A.a[k]|0)*awkPer(k):0}
const awkSpent=()=>{const A=SAVE&&SAVE.awk;let n=0;if(A&&A.a)for(const k in A.a)n+=A.a[k]|0;return n};
const awkFree=()=>Math.max(0,((SAVE&&SAVE.awk&&SAVE.awk.pts)|0)-awkSpent());
const awkRespecCost=()=>20000+3000*awkSpent();
// 目前角色的所有成長加成（面板也用這份）
function grow25(){const L=(SAVE&&SAVE.lv)|0||1,k=lvGrowK(L),m=msSum(L);
  return{L,lvHp:GROW25.hp*k,lvAtk:GROW25.atk*k,ms:m,awk:{atk:awkV('atk'),hp:awkV('hp'),crit:awkV('crit'),ms:awkV('ms'),drop:awkV('drop'),cls:awkV('cls')}}}
const BD0={buff:BD.buff};
window.m22ApplyHero=(o=>function(){const r=o.apply(this,arguments);try{if(typeof SAVE!=='undefined'&&SAVE&&SAVE.hero===HEROK){const g=grow25();HPMAX=Math.round(HERO[HEROK].hp*(1+g.lvHp+g.awk.hp));HEAL_CAP=Math.round(HPMAX*0.08)}}catch(e){}return r})(window.m22ApplyHero);
window.calcGS=(o=>function(){const r=o.apply(this,arguments);try{if(SAVE){const g=grow25(),m=g.ms;
  GS.g0={crit:GS.crit,cdmg:GS.cdmg,def:GS.def,dodge:GS.dodge,kdr:GS.kdr,ms:GS.ms,mvcd:GS.mvcd||0,skd:GS.skd};
  GS.crit+=(m.crit||0)+g.awk.crit;GS.cdmg+=m.cdmg||0;GS.skd+=m.skd||0;GS.ms+=(m.ms||0)+g.awk.ms;
  GS.def=Math.min(0.6,GS.def+(m.def||0));GS.kdr=Math.min(0.8,GS.kdr+(m.kdr||0));GS.mvcd=Math.min(0.5,(GS.mvcd||0)+(m.mvcd||0));
  GS.g25={atk:g.lvAtk+g.awk.atk,wind:(m.wind||0)+(isBard()?0:g.awk.cls),idea:(m.idea||0)+(isBard()?g.awk.cls:0),drop:(m.drop||0)+g.awk.drop,gold:m.gold||0};
  BD.buff=BD0.buff*(1+GS.g25.idea)}}catch(e){}return r})(window.calcGS);
window.m2Dmg=(o=>function(v,m,mv,crit){const r=o.apply(this,arguments);if(mv==='pet'||typeof r!=='number'||!GS.g25)return r;
  return Math.round(r*(1+GS.g25.atk)*(mv==='wind'?1+GS.g25.wind:1))})(window.m2Dmg);
window.m2Gold=(o=>function(a){if(a>0&&GS.g25&&GS.g25.gold)a=Math.round(a*(1+GS.g25.gold));return o(a)})(window.m2Gold);
window.m2Drop=(o=>function(m){const r=o.apply(this,arguments);const b=GS.g25&&GS.g25.drop;if(b&&Math.random()<(m.str?0.05:0.03)*(1+DIF().drop)*b)lootPush('gear',m,{it:rollDrop()});return r})(window.m2Drop);
window.m2BossLoot=(o=>function(m){const r=o.apply(this,arguments);const b=GS.g25&&GS.g25.drop;if(b&&Math.random()<(0.5+DIF().drop)*b)lootPush('gear',m,{it:rollDrop(),vx:U(-200,200)});return r})(window.m2BossLoot);
// 建議等級（只是提示，不鎖難度）
const REC25=[[1,1,1,1,1],[1,13,21,32,47],[3,13,22,32,47],[6,15,24,35,47],[8,17,26,37,48],[11,20,30,42,49]];

// ---- src25/c_ui.js
// ==== M2.5 c_ui.js：角色面板（C 鍵／旅店）、升級卡片、HUD 覺醒條、結算經驗
const pct=(v,d=1)=>(v>=0?'+':'−')+Math.abs(v*100).toFixed(d)+'%';
const fmt=n=>Math.round(n).toLocaleString('en-US');
function m25Open(){if(UI.kind)return;if(mode==='play'){if(paused)return;paused=true;pauseWhy='char'}m2UI('char');UI.tab=0;UI.as=0;UI.conf=null;sfx('ready',0.3)}
// 面板用的分項
function m25Rows(){const g=grow25(),G=GS,g0=G.g0||G,m=g.ms,bard=isBard(),hp0=HERO[HEROK].hp,w=eqItem('w');
  const wr=w?wRange(w,0):[26,34],we=w?wRange(w):[26,34],enh=w?enhAtk(effE(w)):0,cls=bard?1:BAL24.kudasWm,tf=SAVE.tf|0,tfA=!bard&&tf===1?1.05:1,atkM=(1+G.g25.atk)*cls*tfA;
  const R=[];
  R.push(['體力 HP',fmt(HPMAX),[fmt(hp0),pct(g.lvHp),'—','—',pct(g.awk.hp),'—']]);
  R.push(['攻擊力',`${Math.round(we[0]*atkM)}~${Math.round(we[1]*atkM)}`,[w?`武器 ${wr[0]}~${wr[1]}`:'26~34',pct(g.lvAtk),w?itName(w).slice(0,6):'—',enh?pct(enh):'—',pct(g.awk.atk),bard?'—':'職業 ×'+cls.toFixed(2)+(tfA>1?'　搗蛋鬼 +5%':'')]]);
  R.push(['暴擊率',(32+G.crit*100).toFixed(1)+'%',['32%',m.crit?pct(m.crit):'—',pct(g0.crit),'—',pct(g.awk.crit),'詩人增益時 55%']]);
  const ec=enhCdmg(SAVE.slot&&SAVE.slot.e|0);R.push(['暴擊傷害',pct(G.cdmg),['—',m.cdmg?pct(m.cdmg):'—',pct(g0.cdmg-ec),ec?pct(ec):'—','—','—']]);
  R.push(['受到傷害',pct(-G.def),['—',m.def?pct(-m.def):'—',pct(-g0.def),'—','—','上限 −60%']]);
  R.push(['閃避',pct(G.dodge),['—','—',pct(G.dodge),'—','—','上限 25%']]);
  R.push(['抗倒地',pct(G.kdr,0),['—',m.kdr?pct(m.kdr,0):'—',pct(g0.kdr,0),'—','—','—']]);
  R.push(['移動速度',pct(G.ms),['—',m.ms?pct(m.ms):'—',pct(g0.ms),'—',pct(g.awk.ms),'—']]);
  R.push(['技能冷卻',pct(-(G.mvcd||0)),['—',m.mvcd?pct(-m.mvcd):'—',pct(-(g0.mvcd||0)),'—','—','上限 −50%']]);
  R.push(['掉寶率',pct(G.g25.drop+(tf===1?0.03:0)),['—',m.drop?pct(m.drop):'—','—','—',pct(g.awk.drop),tf===1?'搗蛋鬼 +3%':'—']]);
  R.push(['金幣加成',pct(G.g25.gold+(tf===2?0.2:0)),['—',m.gold?pct(m.gold):'—','—','—','—',tf===2?'惡魔貓 +20%':'—']]);
  if(bard)R.push(['樂想增益',(BD.buff).toFixed(1)+'秒',['6.0秒',m.idea?pct(m.idea,0):'—','—','—',pct(g.awk.cls,0),'—']]);
  else R.push(['斬風威力',pct(G.g25.wind,0),['—',m.wind?pct(m.wind,0):'—','—','—',pct(g.awk.cls,0),'—']]);
  R.push(['特殊能力',G.sp&&SPW[G.sp]?SPW[G.sp].a:'—',['—','—',G.sp&&SPW[G.sp]?SPW[G.sp].n:'—','—','—',tf?(['','搗蛋鬼','惡魔貓'][tf]||'變身中'):'—']]);
  return R}
function m25Bar(x0,y0,w,h,f,c1,c2){rrect(x0,y0,x0+w,y0+h,4,'rgba(0,0,0,0.85)','rgba(214,172,84,0.7)',1);const fw=Math.round((w-4)*Math.max(0,Math.min(1,f)));
  if(fw>0){X.fillStyle=c1;X.fillRect(x0+2,y0+2,fw,h-4);X.fillStyle=c2;X.fillRect(x0+2,y0+2,fw,Math.max(2,Math.round((h-4)/3)));X.fillStyle='rgba(0,0,0,0.25)';X.fillRect(x0+2,y0+h-4,fw,2)}}
function charUI(inp){const t=performance.now()/1000,L=SAVE.lv|0,mx=L>=LV25.max,H=HERO[HEROK];woodPanel(40,24,1240,700);
  T(`${H.n}（${H.job}）`,80,62,FS(30),[255,236,200],3,[60,20,10],'lm');const ttl=msTitle(L);if(ttl)T(`〈${ttl}〉`,80+tw(`${H.n}（${H.job}）`,FS(30))+12,64,FS(20),[255,210,120],2,[0,0,0],'lm');
  const tabs=['屬性','里程碑','覺醒'];tabs.forEach((n,i)=>{const x=860+i*120;if(btn(x,40,x+110,82,n+(i===2&&awkFree()?' ●':''),true,UI.tab===i?[255,236,150]:[150,120,70])&&inp){UI.tab=i;UI.conf=null}});
  // 等級＋經驗
  rrect(70,96,1210,150,8,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);T(`Lv.${L}`,90,123,FN(28),[255,230,160],3,[0,0,0],'lm');
  if(!mx){const need=lvNeed(L);m25Bar(200,110,760,26,SAVE.xp/need,'rgb(230,180,50)','rgb(255,230,130)');T(`EXP ${fmt(SAVE.xp)} / ${fmt(need)}（${(100*SAVE.xp/need).toFixed(1)}%）`,580,123,FN(15),[255,255,255],2,[0,0,0],'mm');
    const nx=msNext(L);T(nx?`下一個里程碑 Lv.${nx.L}`:'',1190,113,FN(14),[214,172,84],2,[0,0,0],'rm');if(nx)T(nx.tx.length>16?nx.tx.slice(0,16)+'…':nx.tx,1190,135,FN(14),[230,220,200],2,[0,0,0],'rm')}
  else{const A=SAVE.awk;m25Bar(200,110,760,26,A.xp/LV25.awkNeed,'rgb(150,80,230)','rgb(210,170,255)');T(`覺醒進度 ${fmt(A.xp)} / ${fmt(LV25.awkNeed)}（${(100*A.xp/LV25.awkNeed).toFixed(1)}%）`,580,123,FN(15),[255,255,255],2,[0,0,0],'mm');
    T(`滿級！覺醒點 ${awkFree()} 可分配`,1190,113,FN(15),[220,190,255],2,[0,0,0],'rm');T(`已覺醒 ${A.fills} 次`,1190,135,FN(14),[230,220,200],2,[0,0,0],'rm')}
  if(UI.tab===0)m25TabStats(inp);else if(UI.tab===1)m25TabMs(inp);else m25TabAwk(inp);
  T('C／Esc 關閉　Tab 切換分頁'+(UI.tab===2?'　↑↓ 選屬性　J 加點':''),640,680,FN(14),[200,190,170],2,[0,0,0],'mm');
  if(!inp)return;if(press(['Tab'])){UI.tab=(UI.tab+1)%3;UI.conf=null}else if(press(['Escape','KeyC'])){m2CloseUI();return}}
function m25TabStats(inp){const R=m25Rows(),cols=['基礎','等級/里程碑','裝備','強化','覺醒','其他'],cx=[580,684,800,900,990,1110];
  // 裝備
  rrect(70,164,300,660,8,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);T('裝備中',185,186,FS(19),[255,236,200],2,[0,0,0],'mm');
  SLOTS.forEach(([sl,n],i)=>{const y=204+i*74,it=eqItem(sl);rrect(84,y,148,y+64,6,'rgba(40,30,24,0.85)','rgba(150,120,70,0.6)',1);if(it)gearCard(it,86,y+2,60,false);
    T(n,160,y+16,FN(13),[214,172,84],2,[0,0,0],'lm');if(it){const nm=itName(it);T(nm.length>8?nm.slice(0,8)+'…':nm,160,y+38,FN(14),RAR[it.r].col,2,[0,0,0],'lm')}else T('（空）',160,y+38,FN(14),[150,145,140],2,[0,0,0],'lm')});
  // 屬性表
  rrect(312,164,1210,660,8,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);T('最終屬性',330,186,FS(18),[255,236,200],2,[0,0,0],'lm');
  cols.forEach((c,i)=>T(c,cx[i],186,FN(13),[214,172,84],2,[0,0,0],'mm'));
  R.forEach(([n,v,src],i)=>{const y=214+i*33;if(i%2===0){X.fillStyle='rgba(255,236,200,0.05)';X.fillRect(318,y-15,886,31)}
    T(n,330,y,FS(16),[255,244,214],2,[0,0,0],'lm');T(v,520,y,FN(16),[255,236,150],2,[0,0,0],'rm');
    src.forEach((s,j)=>T(s,cx[j],y,FN(13),s==='—'?[120,110,100]:[230,220,200],2,[0,0,0],'mm'))})}
function m25TabMs(inp){const L=SAVE.lv|0,list=msList(),nx=msNext(L);rrect(70,164,1210,660,8,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);
  T('每 5 級的里程碑（各角色不同）',90,186,FS(18),[255,236,200],2,[0,0,0],'lm');T(`每級：HP、攻擊各 +${(GROW25.hp*100/(LV25.max-1)).toFixed(2)}%（Lv65 合計 +15%）`,1190,186,FN(14),[214,172,84],2,[0,0,0],'rm');
  list.forEach(([l,f,tx],i)=>{const c=i%2,r=Math.floor(i/2),x=90+c*560,y=230+r*55,got=l<=L,isN=nx&&nx.L===l;
    rrect(x,y-20,x+540,y+28,8,got?'rgba(80,60,20,0.65)':isN?'rgba(60,40,90,0.6)':'rgba(30,24,20,0.6)',got?'rgb(255,210,110)':isN?'rgb(200,160,255)':'rgba(150,120,70,0.5)',isN?2:1);
    T(`Lv.${l}`,x+14,y+4,FN(18),got?[255,230,160]:[170,160,150],2,[0,0,0],'lm');T(tx,x+90,y+4,FN(15),got?[255,244,214]:isN?[230,215,255]:[180,170,160],2,[0,0,0],'lm');
    T(got?'✔ 已獲得':isN?`還差 ${l-L} 級`:'',x+528,y+4,FN(13),got?[150,255,150]:[220,190,255],2,[0,0,0],'rm')});
  T('建議等級（只是參考，不會鎖難度）：',90,606,FN(14),[214,172,84],2,[0,0,0],'lm');
  T(DIFFS.map((d,i)=>`${d.n} Lv.${REC25[Math.max(1,Math.min(5,RUN.st||1))][i]}+`).join('　'),90,632,FN(14),[230,220,200],2,[0,0,0],'lm');
  T(`（以「${STG[Math.max(1,Math.min(5,RUN.st||1))].n}」為例）`,1190,632,FN(13),[170,160,150],2,[0,0,0],'rm')}
function m25TabAwk(inp){const L=SAVE.lv|0,A=SAVE.awk;rrect(70,164,1210,660,8,'rgba(0,0,0,0.35)','rgba(150,110,220,0.7)',1);
  T('覺醒（滿級後，經驗條每滿一次 +1 點）',90,186,FS(18),[230,215,255],2,[0,0,0],'lm');T(`可用 ${awkFree()} 點　已用 ${awkSpent()} 點`,1190,186,FN(16),[220,190,255],2,[0,0,0],'rm');
  if(L<LV25.max){T(`Lv.${LV25.max} 開啟（目前 Lv.${L}，還差 ${LV25.max-L} 級）`,640,230,FS(20),[200,190,220],2,[0,0,0],'mm')}
  UI.as=clamp(UI.as|0,0,AWK_ORDER.length-1);
  AWK_ORDER.forEach((k,i)=>{const D=AWK[k],y=262+i*54,sel=UI.as===i,v=A.a[k]|0,per=awkPer(k),nm=k==='cls'?awkClsName():D.n;
    rrect(90,y-22,1190,y+24,8,sel?'rgba(70,40,110,0.75)':'rgba(30,22,40,0.6)',sel?'rgb(220,190,255)':'rgba(150,110,220,0.5)',sel?2:1);
    T(nm,110,y+1,FS(18),[255,244,214],2,[0,0,0],'lm');T(`每點 +${(per*100).toFixed(1)}%`,260,y+1,FN(14),[200,190,220],2,[0,0,0],'lm');
    for(let j=0;j<D.cap;j++){const x=390+j*44;rrect(x,y-10,x+36,y+12,3,j<v?'rgb(160,100,240)':'rgba(0,0,0,0.6)',j<v?'rgb(230,210,255)':'rgba(150,110,220,0.5)',1);if(j<v){X.fillStyle='rgb(210,180,255)';X.fillRect(x+3,y-7,30,4)}}
    T(`${v}/${D.cap}　${pct(v*per)}`,1080,y+1,FN(15),[230,215,255],2,[0,0,0],'mm');
    const can=L>=LV25.max&&awkFree()>0&&v<D.cap;if(btn(1130,y-16,1180,y+18,'+',can,[200,160,255])&&inp){UI.as=i;m25AwkAdd(k)}
    if(inp&&CLICK&&inBox(CLICK,[90,y-22,1120,y+24]))UI.as=i});
  const cost=awkRespecCost(),spent=awkSpent(),c2=UI.conf==='respec';
  if(btn(90,594,470,640,c2?`再按一次確認（${fmt(cost)} 金幣）`:`重新分配（${fmt(cost)} 金幣）`,spent>0&&SAVE.gold>=cost,[255,170,60])&&inp){if(c2)m25Respec();else UI.conf='respec'}
  T(`持有金幣 ${fmt(SAVE.gold)}　每次覺醒另得 刻印碎片 +${LV25.awkShard}、金幣 +${fmt(LV25.awkGold)}`,500,617,FN(14),[200,190,170],2,[0,0,0],'lm');
  if(UI.msg)T(UI.msg[0],1190,617,FN(14),[255,200,150],2,[0,0,0],'rm');
  if(!inp)return;if(press(['ArrowUp','KeyW'])||GPP.u)UI.as=Math.max(0,UI.as-1);if(press(['ArrowDown','KeyS'])||GPP.d)UI.as=Math.min(AWK_ORDER.length-1,UI.as+1);
  if(press(['KeyJ','Enter','Space']))m25AwkAdd(AWK_ORDER[UI.as])}
function m25AwkAdd(k){const A=SAVE.awk;if((SAVE.lv|0)<LV25.max||awkFree()<=0||(A.a[k]|0)>=AWK[k].cap){UI.msg=['沒有可用的覺醒點或已達上限'];return}
  A.a[k]=(A.a[k]|0)+1;UI.msg=null;const old=HPMAX;m22ApplyHero();calcGS();if(S0&&S0.P)S0.P.hp=Math.min(HPMAX,S0.P.hp+Math.max(0,HPMAX-old));sfx('ready',0.4);m2Save()}
function m25Respec(){const c=awkRespecCost();if(SAVE.gold<c)return;SAVE.gold-=c;if(S0)S0.gold=SAVE.gold;for(const k in SAVE.awk.a)SAVE.awk.a[k]=0;UI.conf=null;m22ApplyHero();calcGS();if(S0&&S0.P)S0.P.hp=Math.min(S0.P.hp,HPMAX);UI.msg=['已重置，點數全部退回'];sfx('coin',0.4);m2Save()}
window.m2Overlay=(o=>function(){if(UI.kind==='char'){const inp=!UI.fresh;UI.fresh=false;charUI(inp);if(!UI.kind&&mode==='play')paused=false;return}return o.apply(this,arguments)})(window.m2Overlay);
// C 鍵：遊戲中／旅店
window.frame=(o=>function(now){try{if(KP['KeyC']&&!UI.kind&&!window.__holdC&&((mode==='play'&&!paused)||mode==='map')){m25Open();delete KP['KeyC']}}catch(e){}
  o.apply(this,arguments);try{m25DrawCards()}catch(e){(window.__err=window.__err||[]).push('m25card '+e)}})(window.frame);
// 旅店第 4 個點：角色面板（右邊的木桶旁）
SPOTS.push({n:'角色面板',d:'等級・屬性・覺醒',x:1110,ax:1200,ay:232,box:[1135,262,1275,390]});
window.innGo=(o=>function(i){if(i===3){sfx('coin',0.35);m2UI('char');UI.tab=0;UI.as=0;return}return o.apply(this,arguments)})(window.innGo);
window.mapInput=(o=>function(){if(press(['ArrowRight','KeyD'])||GPP.r){if(INN.spot===2){INN.spot=3;return}}if(INN.spot===3){if(press(['ArrowLeft','KeyA'])||GPP.l){INN.spot=2;return}
    if(IN.start()||press(['KeyJ','Space'])||GPP.jump){innGo(3);return}}return o.apply(this,arguments)})(window.mapInput);
window.drawMap=(o=>function(){const r=o.apply(this,arguments);try{
  const ttl=msTitle(SAVE.lv|0),s0=`${HERO[HEROK].n}（${HERO[HEROK].job}） Lv.${SAVE.lv|0}`;if(ttl)T(`〈${ttl}〉`,40+tw(s0,FN(17))+8,70,FN(15),[255,210,120],2,[0,0,0],'lm');
  rrect(20,660,1260,708,10,'rgb(22,14,10)','rgba(214,172,84,0.6)',1);
  T(`${SPOTS[INN.spot].n}：${SPOTS[INN.spot].d}　　←→ 移動　Enter 使用　I 背包　C 角色　Esc 換角色`,640,684,FN(16),[230,220,200],2,[0,0,0],'mm');
  if(awkFree()&&!UI.kind){const p=SPOTS[3],b=0.5+0.5*Math.sin(performance.now()/180);X.fillStyle=`rgba(200,150,255,${0.5+0.5*b})`;X.beginPath();X.arc(p.ax+64,p.ay-18,6,0,Math.PI*2);X.fill()}}catch(e){}return r})(window.drawMap);

// ---- src25/d_card.js
// ==== M2.5 d_card.js：升級／覺醒卡片（多層色帶）、HUD 覺醒條、結算經驗
function m25DrawCards(){if(!M25Q.length)return;const now=performance.now();while(M25Q.length&&now-M25Q[0].t0>3400)M25Q.shift();const c=M25Q[0];if(!c)return;
  const age=(now-c.t0)/1000,ain=Math.min(1,age/0.25),aout=Math.min(1,(3.4-age)/0.4),a=Math.max(0,Math.min(ain,aout));const y0=Math.round(150-30*(1-ain));
  const awk=c.k==='awk',x0=440,x1=840,nm=awk?0:Math.min(3,c.ms.length),y1=y0+(awk?96:128+24*nm+(c.ms.length>3?20:0));X.save();X.globalAlpha=a;
  // 外光：三層色帶
  const glow=awk?[[14,'rgba(120,60,200,0.18)'],[8,'rgba(170,110,255,0.28)'],[3,'rgba(230,210,255,0.55)']]:[[14,'rgba(200,120,20,0.18)'],[8,'rgba(255,190,60,0.28)'],[3,'rgba(255,240,170,0.6)']];
  for(const [g,col] of glow){X.fillStyle=col;X.fillRect(x0-g,y0-g,x1-x0+2*g,y1-y0+2*g)}
  rrect(x0,y0,x1,y1,10,awk?'rgb(36,20,56)':'rgb(44,26,12)',awk?'rgb(220,190,255)':'rgb(255,214,110)',3);
  X.fillStyle=awk?'rgba(160,110,240,0.35)':'rgba(255,200,90,0.3)';X.fillRect(x0+6,y0+6,x1-x0-12,6);X.fillStyle=awk?'rgba(90,50,150,0.35)':'rgba(140,80,20,0.35)';X.fillRect(x0+6,y0+12,x1-x0-12,4);
  const sh=age<0.6?1+0.25*Math.sin(age*Math.PI/0.6):1;
  if(awk){T('覺醒！',640,y0+34,FS(Math.round(30*sh)),[240,225,255],3,[60,20,90],'mm');T(`覺醒點 +${c.n}（可用 ${awkFree()}）　刻印碎片 +${LV25.awkShard*c.n}　金幣 +${fmt(LV25.awkGold*c.n)}`,640,y0+70,FN(15),[230,215,255],2,[0,0,0],'mm')}
  else{const nL=c.L-c.L0+1;T(nL>1?`LEVEL UP!  Lv.${c.L0-1} → ${c.L}`:`LEVEL UP!  Lv.${c.L}`,640,y0+32,FS(Math.round(28*sh)),[255,236,160],3,[80,30,0],'mm');const per=(GROW25.hp*100/(LV25.max-1)).toFixed(2);
    const pp=(GROW25.hp*100*nL/(LV25.max-1)).toFixed(2);T(`HP +${pp}%　攻擊 +${pp}%　（HP 上限 ${fmt(HPMAX)}）`,640,y0+64,FN(15),[255,244,214],2,[0,0,0],'mm');let y=y0+92;
    for(const m of c.ms.slice(-3)){T(`★ Lv.${m.L} 里程碑：${m.tx}`,640,y,FN(15),[150,255,150],2,[0,0,0],'mm');y+=24}if(c.ms.length>3){T(`（還有 ${c.ms.length-3} 個里程碑，按 C 看全部）`,640,y-4,FN(13),[200,230,200],2,[0,0,0],'mm');y+=20}
    T(c.next?`下一個里程碑 Lv.${c.next.L}：${c.next.tx}`:'已達最高等級：之後的經驗會累積成「覺醒」',640,y,FN(13),[214,172,84],2,[0,0,0],'mm')}
  X.restore()}
// HUD：滿級時經驗條改為紫色覺醒條
window.drawHUD=(o=>function(cx0,shy){const r=o.apply(this,arguments);try{const s=S0;if(SAVE&&(SAVE.lv|0)>=LV25.max){const f=SAVE.awk.xp/LV25.awkNeed;
  X.fillStyle='rgba(0,0,0,0.9)';X.fillRect(124,86,279,7);X.fillStyle='rgb(150,80,230)';X.fillRect(126,87,Math.round(274*f)+1,5);X.fillStyle='rgb(210,170,255)';X.fillRect(126,87,Math.round(274*f)+1,2);
  X.fillStyle='rgba(0,0,0,0.75)';X.fillRect(300,97,108,17);T(`覺醒 ${(100*f).toFixed(1)}%`,400,105,FN(12),[220,190,255],2,[0,0,0],'rm')}}catch(e){}return r})(window.drawHUD);
window.drawResult=(o=>function(){const r=RES;const out=o.apply(this,arguments);try{if(mode==='result'&&r&&!r.ms&&r.xpRun!=null)
  T(`經驗 +${fmt(r.xpRun)}（通關獎勵 +${fmt(r.xpClear)}${r.xpFirst?'，首次通關 ×2':''}）　目前 Lv.${r.lv}`,640,226,FN(16),[255,226,120],2,[0,0,0],'mm')}catch(e){}return out})(window.drawResult);

// ---- src25/e_mig.js
// ==== M2.5 e_mig.js：存檔遷移（只重置等級，其餘全部保留）
PERK.push('xp','awk');
window.m22Blank=(o=>function(S,k){const d=o.apply(this,arguments);d.lv=1;d.exp=0;d.xp=0;d.awk=awkBlank();return d})(window.m22Blank);
function m25Mig(S){if(!S)return S;if(!S.m25mig){const old={[S.hero]:{lv:S.lv,exp:S.exp}};for(const k in S.chars||{})if(S.chars[k])old[k]={lv:S.chars[k].lv,exp:S.chars[k].exp};
    const reset=c=>{c.lv=1;c.exp=0;c.xp=0;c.awk=awkBlank()};reset(S);for(const k in S.chars||{})if(S.chars[k])reset(S.chars[k]);S.m25mig={t:Date.now(),old}}
  m25Fix(S);for(const k in S.chars||{})if(S.chars[k])m25Fix(S.chars[k]);return S}
window.m21Migrate=(o=>function(S){const r=o.apply(this,arguments);try{m25Mig(r||S);if(typeof SAVE!=='undefined'&&SAVE===(r||S)){m22ApplyHero();calcGS()}}catch(e){(window.__err=window.__err||[]).push('m25mig '+e)}return r})(window.m21Migrate);

// ---- src25/f_bal.js
// ==== M2.5 f_bal.js：等級成長的補償。照「正常進度到達該難度時的等級」（Lv21／32／47 左右 ≈ +5%／+8%／+11%）
// 把菁英以上的怪物 HP／傷害調高一點，讓 3★ 以上維持 M2.4 的難度；普通／困難不變，Lv1 開局跟 M2.4 一樣。
const BAL25={2:{hp:4.4,dmg:2.4},3:{hp:8.0,dmg:3.4},4:{hp:13.6,dmg:4.25}};
for(const d in BAL25)Object.assign(DIFFS[d],BAL25[d]);

