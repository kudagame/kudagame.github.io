// M2.2 — 由 src22/*.js 合併（角色選擇、任務旅店、共用倉庫、可操作吟遊詩人）
// ==== a_save.js
// ---------- M2.2 角色分開存檔 ----------
// 存檔最上層＝「目前角色」的資料（原本的程式碼完全不用改）；另一個角色收在 SAVE.chars[角色]。
// 共用：金幣、刻印碎片、寶石、設定、倉庫 SAVE.wh、物品編號 uid。各自獨立：背包、裝備、強化、關卡進度、難度、等級、變身藥水。
const HERO={kudas:{n:'苦達斯',job:'大劍士',hp:4125},bard:{n:'尋歡作樂',job:'吟遊詩人',hp:3300},archer:{n:'三杯兔子',job:'長弓兵',hp:3000}};
const PERK=['inv','eq','clear','dsel','sel','slot','pots','pots2','lv','exp'];
const WH_MAX=96,BAG_MAX=80;
let HEROK='kudas';
const isBard=()=>HEROK==='bard';
function m22Blank(S,k){const d={inv:[],eq:{w:0,b:0,p:0,s:0,r:0,n:0},clear:{},dsel:{},sel:'canyon',slot:{e:0,pity:{}},pots:0,pots2:0,lv:k==='kudas'?65:1,exp:k==='kudas'?41:0};
  const w=mkItem('w',0,0,S);w.v=30;d.inv.push(w);d.eq.w=w.id;return d}
function m22FixChar(S,c,k){const D=m22Blank({uid:0},k);for(const f of PERK)if(c[f]===undefined||c[f]===null)c[f]=JSON.parse(JSON.stringify(D[f]));
  if(!Array.isArray(c.inv))c.inv=[];c.inv=c.inv.filter(i=>i&&typeof i==='object');for(const it of c.inv){if(!it.pity||typeof it.pity!=='object')it.pity={};if(it.e==null)it.e=0;if(!it.lines)it.lines=[]}
  if(typeof c.eq!=='object')c.eq={w:0,b:0,p:0,s:0,r:0,n:0};if(Array.isArray(c.clear)||typeof c.clear!=='object')c.clear={};if(Array.isArray(c.dsel)||typeof c.dsel!=='object')c.dsel={};
  c.pots=Math.max(0,c.pots|0);c.pots2=Math.max(0,c.pots2|0);c.lv=Math.max(1,c.lv|0);c.exp=+c.exp||0}
function m22Mig(S){const old=!S.chars||typeof S.chars!=='object';
  if(old){S.chars={};if(S.ts)S.m22mig={t:Date.now(),from:S.v,inv:(S.inv||[]).length,gold:S.gold|0}} // 舊 M2.1 存檔：全部原封不動留在最上層＝苦達斯
  if(!S.hero||!HERO[S.hero])S.hero='kudas';
  if(S.lv==null){S.lv=S.hero==='kudas'?65:1;S.exp=S.hero==='kudas'?41:0}
  m22FixChar(S,S,S.hero);delete S.chars[S.hero];
  if(!Array.isArray(S.wh))S.wh=[];S.wh=S.wh.filter(i=>i&&typeof i==='object');for(const it of S.wh){if(!it.pity)it.pity={};if(it.e==null)it.e=0;if(!it.lines)it.lines=[]}
  let mx=0;const scan=L=>{for(const i of L)mx=Math.max(mx,i.id|0)};scan(S.inv);scan(S.wh);for(const k in S.chars)if(S.chars[k]&&S.chars[k].inv)scan(S.chars[k].inv);S.uid=Math.max(S.uid|0,mx+1);
  for(const k of Object.keys(HERO)){if(k===S.hero)continue;if(!S.chars[k]||typeof S.chars[k]!=='object')S.chars[k]=m22Blank(S,k);m22FixChar(S,S.chars[k],k)}
  HEROK=S.hero;m22ApplyHero();return S}
function m22ApplyHero(){HPMAX=HERO[HEROK].hp;HEAL_CAP=Math.round(HPMAX*0.08)}
window.m21Migrate=(o=>S=>{o(S);m22Mig(S);return S})(window.m21Migrate);
function m22Char(k){return k===SAVE.hero?SAVE:SAVE.chars[k]}
function m22Switch(k){if(!HERO[k]||!SAVE)return;if(k!==SAVE.hero){if(SAVE.tf)SAVE.tf=0;const cur={};for(const f of PERK)cur[f]=SAVE[f];SAVE.chars[SAVE.hero]=cur;
    const nx=SAVE.chars[k]||m22Blank(SAVE,k);for(const f of PERK)SAVE[f]=nx[f];delete SAVE.chars[k];SAVE.hero=k}
  HEROK=k;m22ApplyHero();calcGS();m2Save()}
// 等級／經驗：每個角色自己的
window.m2Begin=(o=>(...a)=>{m22ApplyHero();const r=o(...a);if(S0){S0.lv=SAVE.lv|0||1;S0.exp=+SAVE.exp||0;S0.P.hp=HPMAX}return r})(window.m2Begin);
window.m2Step=(o=>dt=>{o(dt);const s=S0;if(s&&SAVE){SAVE.lv=s.lv;SAVE.exp=s.exp}})(window.m2Step);
// 變身藥水只給苦達斯：詩人撿到的直接送進苦達斯的背包
window.m21Pot=(o=>kind=>{if(HEROK==='kudas')return o(kind);const k=kind==='tfpot2'||kind===2?2:1,key=k===2?'pots2':'pots',c=SAVE.chars.kudas;if(c)c[key]=(c[key]||0)+1;const s=S0;
  if(s){s.log.push([s.t,'tfpot'+(k===2?'2':''),`獲得 ${TFS[k].pot}（已送到苦達斯的背包）`]);proc('稀有掉落',k===2?[170,40,60]:[150,70,200],'變');sfx('crit',0.4)}m2Save()})(window.m21Pot);
window.m21Transform=(o=>(k,q)=>{if(HEROK!=='kudas'&&k){m21Toast('變身藥水只有苦達斯能用');return}return o(k,q)})(window.m21Transform);
window.m2Assets=(o=>()=>[...o(),'inn','bardpor','kudash','kudasg','archerpor','archerh','archerg'])(window.m2Assets);
window.__m22={save:()=>SAVE,sw:k=>m22Switch(k),hero:()=>HEROK,char:k=>m22Char(k)};
// ==== b_sel.js
// ---------- 角色選擇（封面 → 選角 → 任務旅店） ----------
const CHS={ok:false,sel:0,t0:0,ks:['kudas','bard']};
const CHINFO={kudas:{col:[70,110,200],tag:['站樁硬打的大劍士','出招中被打不會累積倒地','J 連斬・K 心臟刺擊・L 斬風／大地橫掃','V 召喚吟遊詩人支援'],
    poses:['kudas_idle','kudas_idle','kudas_windup','kudas_swing','kudas_follow','kudas_idle','kudas_charge','kudas_swing','kudas_idle']},
  bard:{col:[200,60,70],tag:['靠走位、閃避、取消打節奏的吟遊詩人','比較脆：被打 3 下就倒地（受身可以翻起）','樂想 紅／藍／綠・K 三連音・L 旋律衝擊','Shift 後跳閃避・K+L 戰鬥交響曲・V 召喚苦達'],
    poses:['bh_play0','bh_play1','bh_thrust','bh_overhead','bh_sweep','bh_play0','bh_tune_bonk0','bh_tune_bonk1','bh_play1']}};
function m22OpenSel(){mode='chsel';paused=false;UI.kind=null;CHS.t0=performance.now();CHS.sel=Math.max(0,CHS.ks.indexOf(SAVE&&SAVE.hero||'kudas'));
  if(CURM!=='title'){musStop(CURM,0.6);musStop('m_shop',0.6);CURM='title';musPlay('title',0.5,1.0,true)}}
window.m2OpenMap=(o=>(...a)=>{if(!CHS.ok){m22OpenSel();return}const r=o(...a);m2Music('m_shop');return r})(window.m2OpenMap);
window.menuGo=(o=>i=>{if(i===0)CHS.ok=false;return o(i)})(window.menuGo);
function m22Pick(k){m22Switch(k);CHS.ok=true;sfx('start',0.4);m2OpenMap()}
function m22Prog(k){const c=m22Char(k)||{};let n=0;for(let i=1;i<=NST;i++)if((c.clear||{})[STG[i].id])n++;const w=(c.inv||[]).find(i=>i.id===(c.eq||{}).w);return{c,n,w}}
function drawChsel(){const t=performance.now()/1000,age=(performance.now()-CHS.t0)/1000;X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.5;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
  X.fillStyle='rgba(10,6,4,0.5)';X.fillRect(0,0,W,H);
  T('選擇角色',640,60,FS(42),[255,236,200],4,[60,20,10],'mm');T('裝備、背包、強化、關卡進度、等級各自獨立；金幣與旅店倉庫共用',640,104,FN(16),[230,214,180],2,[0,0,0],'mm');
  CHS.ks.forEach((k,i)=>{const cx=i?900:380,x0=cx-250,x1=cx+250,y0=134,y1=620,sel=CHS.sel===i,I=CHINFO[k],H_=HERO[k];const hov=MOUSE&&inBox(MOUSE,[x0,y0,x1,y1]);
    const pop=sel?1:0;rrect(x0,y0,x1,y1,16,sel?'rgba(40,24,16,0.95)':'rgba(20,14,12,0.86)',sel?'rgb(255,226,140)':hov?'rgb(214,172,84)':'rgba(150,120,70,0.7)',sel?4:2);
    if(sel){X.save();X.globalAlpha=0.18+0.08*Math.sin(t*4);X.fillStyle=rgb(I.col);X.fillRect(x0+8,y0+8,x1-x0-16,262);X.restore()}
    // 舞台小光圈
    X.save();X.fillStyle='rgba(0,0,0,0.35)';X.beginPath();X.ellipse(cx,y0+252,96,14,0,0,Math.PI*2);X.fill();X.restore();
    const ph=sel?I.poses[Math.floor(t/0.32)%I.poses.length]:I.poses[Math.floor(t/0.4)%2];const nm=(ph.startsWith('kudas')||m21Has(ph))?ph:I.poses[0];
    spr(nm,cx-10,y0+256,{sc:1.15,glow:sel?[255,236,160,Math.floor(150+80*Math.sin(t*6))]:null,alpha:sel?1:0.75});
    T(H_.n,cx,y0+290,FS(32),sel?[255,244,214]:[210,200,190],3,[0,0,0],'mm');T(H_.job+`　HP ${H_.hp.toLocaleString('en-US')}`,cx,y0+324,FN(17),[255,214,140],2,[0,0,0],'mm');
    I.tag.forEach((l,j)=>T(l,cx,y0+356+j*23,FN(15),j?[220,212,200]:[255,236,190],2,[0,0,0],'mm'));
    const p=m22Prog(k);const wn=p.w?itName(p.w)+(p.c.slot&&p.c.slot.e?' +'+p.c.slot.e:''):'（沒有武器）';
    rrect(x0+20,y1-58,x1-20,y1-16,8,'rgba(0,0,0,0.45)','rgba(214,172,84,0.5)',1);
    T(`Lv.${p.c.lv||1}　通關 ${p.n}/${NST}　背包 ${(p.c.inv||[]).length}　武器 ${wn}`,cx,y1-37,FN(15),[255,255,255],2,[0,0,0],'mm');
    if(CLICK&&inBox(CLICK,[x0,y0,x1,y1])){if(CHS.sel===i)m22Pick(k);else{CHS.sel=i;sfx('coin',0.3)}}});
  T(`金幣（共用）${SAVE.gold.toLocaleString('en-US')}　倉庫 ${SAVE.wh.length}/${WH_MAX}`,640,648,FN(17),[255,226,120],2,[0,0,0],'mm');
  T('←→ 選角色　Enter 進入任務旅店　Esc 回封面',640,690,FN(16),[200,190,170],2,[0,0,0],'mm');
  if(mode!=='chsel')return;
  if(AUTO&&!window.__autoStop){if(age>0.8){const k=Q.get('hero')==='bard'?'bard':(window.__autoHero||'kudas');m22Pick(k)}return}
  if(press(['ArrowLeft','KeyA'])||GPP.l){CHS.sel=0;sfx('coin',0.25)}if(press(['ArrowRight','KeyD'])||GPP.r){CHS.sel=1;sfx('coin',0.25)}
  if(IN.start()||press(['KeyJ','Space'])||GPP.jump)m22Pick(CHS.ks[CHS.sel]);
  else if(IN.esc()){mode='title';titleT=0;titleMus=false;window.__holdTitle=true}}
window.m2Frame=(o=>el=>{if(mode==='chsel'){drawChsel();return true}return o(el)})(window.m2Frame);
// ==== c_inn.js
// ---------- 任務旅店（取代冒險地圖）：任務板選關、共用倉庫、換角色 ----------
const INN={spot:0,x:640,tx:640,face:1,t0:0,walk:0,toast:null};
const SPOTS=[{n:'任務板',d:'選關卡・難度',x:250,ax:152,ay:112,box:[37,125,267,375]},{n:'換角色',d:'回到角色選擇',x:560,ax:590,ay:150,box:[470,170,710,330]},
  {n:'共用倉庫',d:'三個角色共用的箱子',x:960,ax:1040,ay:232,box:[955,250,1120,385]}];
window.m2OpenMap=(o=>(...a)=>{const r=o(...a);if(mode==='map'){INN.t0=performance.now();INN.spot=0;INN.x=INN.tx=SPOTS[0].x+90}return r})(window.m2OpenMap);
function innHero(t){const mv=Math.abs(INN.tx-INN.x)>3;const k=isBard();if(HEROK==='archer')return mv?'ar_run'+Math.floor(t/0.075)%8:'ar_idle'+Math.floor(t/0.16)%6;if(mv)return(k?'bh_run':'kudas_run')+Math.floor(t/0.1)%4;return k?'bh_play'+Math.floor(t/0.36)%2:'kudas_idle'}
window.drawMap=function(){const t=performance.now()/1000,dt=1/60;X.fillStyle='#000';X.fillRect(0,0,W,H);if(IMG.inn&&IMG.inn.width)X.drawImage(IMG.inn,0,0,W,H);
  // 壁爐火光（多層暖色）
  {const f=0.5+0.5*Math.sin(t*7.1)*Math.sin(t*3.3);X.save();X.globalCompositeOperation='lighter';for(const [r,a] of [[150,0.05],[96,0.07],[52,0.09]]){X.globalAlpha=a*(0.7+0.3*f);X.fillStyle='rgb(255,150,60)';X.beginPath();X.ellipse(626,242,r*1.25,r*0.85,0,0,Math.PI*2);X.fill()}X.restore()}
  X.fillStyle='rgba(10,6,4,0.18)';X.fillRect(0,0,W,H);
  rrect(20,14,520,92,10,'rgba(16,10,8,0.82)',rgb(GOLDC),2);T('任務旅店・夜路亭',40,38,FS(26),[255,236,200],3,[60,20,10],'lm');
  T(`${HERO[HEROK].n}（${HERO[HEROK].job}） Lv.${SAVE.lv|0}`,40,70,FN(17),[255,244,214],2,[0,0,0],'lm');
  rrect(1000,14,1260,92,10,'rgba(16,10,8,0.82)',rgb(GOLDC),2);T(`金幣 ${SAVE.gold.toLocaleString('en-US')}`,1020,38,FN(19),[255,226,120],2,[0,0,0],'lm');T(`刻印碎片 ${SAVE.shards}　倉庫 ${SAVE.wh.length}/${WH_MAX}`,1020,68,FN(15),[170,210,255],2,[0,0,0],'lm');
  SPOTS.forEach((p,i)=>{const sel=INN.spot===i&&!UI.kind,hov=MOUSE&&inBox(MOUSE,p.box);if(sel||hov){X.save();X.globalAlpha=(sel?0.22:0.12)+0.08*Math.sin(t*5);X.fillStyle='rgb(255,226,140)';const b0=p.box;X.fillRect(b0[0],b0[1],b0[2]-b0[0],b0[3]-b0[1]);X.restore();
      const b=p.box;for(const [w,c] of [[6,'rgba(120,70,20,0.8)'],[3,'rgb(255,210,110)'],[1,'rgb(255,250,220)']]){X.strokeStyle=c;X.lineWidth=w;X.strokeRect(b[0],b[1],b[2]-b[0],b[3]-b[1])}}
    const by=p.ay-(sel?6+4*Math.sin(t*6):0);rrect(p.ax-70,by-20,p.ax+70,by+18,8,sel?'rgba(90,50,20,0.95)':'rgba(20,14,10,0.8)',sel?'rgb(255,236,150)':'rgba(214,172,84,0.7)',2);T(p.n,p.ax,by,FS(19),[255,244,214],2,[0,0,0],'mm');
    if(sel){X.fillStyle='rgb(255,226,120)';X.beginPath();X.moveTo(p.ax-9,by+22);X.lineTo(p.ax+9,by+22);X.lineTo(p.ax,by+32);X.fill()}
    if(CLICK&&inBox(CLICK,p.box)&&!UI.kind){if(INN.spot===i)innGo(i);else INN.spot=i}});
  // 角色在旅店地板上走動
  INN.tx=SPOTS[INN.spot].x+(INN.spot===2?-60:90);const d=INN.tx-INN.x;if(Math.abs(d)>3){INN.face=Math.sign(d);INN.x+=Math.sign(d)*Math.min(Math.abs(d),330*dt)}else INN.face=INN.spot===2?1:INN.spot===0?-1:INN.face;
  X.save();X.fillStyle='rgba(30,14,6,0.35)';X.beginPath();X.ellipse(INN.x,630,52,10,0,0,Math.PI*2);X.fill();X.restore();
  spr(innHero(t),INN.x,628,{flip:INN.face<0});
  rrect(20,660,1260,708,10,'rgba(16,10,8,0.82)','rgba(214,172,84,0.6)',1);
  T(`${SPOTS[INN.spot].n}：${SPOTS[INN.spot].d}　　←→ 移動　Enter 使用　I 背包　Esc 換角色`,640,684,FN(16),[230,220,200],2,[0,0,0],'mm')};
function innGo(i){sfx('coin',0.35);if(i===0)m2UI('quest');else if(i===1){CHS.ok=false;m2Save();m22OpenSel()}else{m2UI('wh');UI.side=0;UI.ws=0;UI.bs=0}}
window.mapInput=function(){if(press(['ArrowLeft','KeyA'])||GPP.l)INN.spot=Math.max(0,INN.spot-1);if(press(['ArrowRight','KeyD'])||GPP.r)INN.spot=Math.min(2,INN.spot+1);
  if(IN.start()||press(['KeyJ','Space'])||GPP.jump)innGo(INN.spot);else if(IN.bag())m2UI('bag');else if(IN.esc()){m2Save();CHS.ok=false;m22OpenSel()}};
// --- 任務板 ---
function questUI(inp){const t=performance.now()/1000;woodPanel(60,40,1220,680);T('任務板',640,82,FS(34),[255,236,200],3,[60,20,10],'mm');
  // 軟木板底
  rrect(90,110,1190,560,8,'rgb(150,104,58)','rgb(70,44,22)',3);for(let i=0;i<60;i++){const x=100+m21H(i,1)*1080,y=120+m21H(i,2)*430;X.fillStyle=i%2?'rgba(110,72,36,0.6)':'rgba(186,140,84,0.5)';X.fillRect(Math.round(x),Math.round(y),3,3)}
  for(let i=1;i<=NST;i++){const st=STG[i],un=stUnlocked(i),sel=MAPT.sel===i,cl=CL(i);const cx=170+(i-1)*235,cy=330+((i%2)?-12:14),rot=(m21H(i,7)-0.5)*0.08;
    X.save();X.translate(cx,cy);X.rotate(rot);const w=200,h=sel?316:300;X.fillStyle='rgba(40,20,8,0.4)';X.fillRect(-w/2+6,-h/2+8,w,h);
    X.fillStyle=un?(sel?'rgb(250,236,196)':'rgb(232,214,170)'):'rgb(150,140,120)';X.fillRect(-w/2,-h/2,w,h);X.fillStyle='rgba(180,150,100,0.35)';X.fillRect(-w/2,h/2-12,w,12);X.fillRect(-w/2,-h/2,6,h);
    if(IMG[st.bg]&&IMG[st.bg].width){X.save();X.globalAlpha=un?1:0.35;X.drawImage(IMG[st.bg],-w/2+14,-h/2+44,w-28,96);X.restore();X.strokeStyle='rgb(90,60,30)';X.lineWidth=2;X.strokeRect(-w/2+14,-h/2+44,w-28,96)}
    T(st.n,0,-h/2+24,FS(22),un?[90,40,20]:[90,80,70],0,[0,0,0],'mm');
    const ln=wrapT(st.t,FS(17),w-24);ln.forEach((l,j)=>T(l,0,-h/2+164+j*22,FS(17),un?[60,30,14]:[90,80,70],0,[0,0,0],'mm'));
    for(let d=0;d<5;d++)T('★',-40+d*20,h/2-62,FN(17),d<cl?[220,150,20]:[150,130,100],0,[0,0,0],'mm');
    T(un?(cl?`已通過 ${cl} 種難度`:'未完成'):'未解鎖',0,h/2-34,FN(14),un?[110,60,30]:[90,80,70],0,[0,0,0],'mm');
    // 圖釘
    for(const [r,c] of [[8,'rgb(120,20,20)'],[6,'rgb(200,50,40)'],[2,'rgb(255,180,160)']]){X.fillStyle=c;X.beginPath();X.arc(r===2?-2:0,-h/2+4-(r===2?2:0),r,0,Math.PI*2);X.fill()}
    if(!un){X.fillStyle='rgba(60,50,40,0.6)';X.fillRect(-w/2,-h/2,w,h);T('鎖',0,-h/2+92,FS(40),[220,210,190],3,[0,0,0],'mm')}
    if(sel){for(const [lw,c] of [[7,'rgba(255,190,80,0.45)'],[3,'rgb(255,220,120)']]){X.strokeStyle=c;X.lineWidth=lw;X.strokeRect(-w/2-4,-h/2-4,w+8,h+8)}}
    X.restore();if(CLICK&&inp&&inBox(CLICK,[cx-100,cy-150,cx+100,cy+150])&&un){if(MAPT.sel===i){m2CloseUI();m2StartSel();return}MAPT.sel=i}}
  const st=MAPT.sel,ds=DS(st);T('難度',150,598,FS(20),[255,236,200],2,[0,0,0],'mm');
  for(let d=0;d<5;d++){const x=290+d*170,un=dUnlocked(st,d),on=d===ds;rrect(x-70,578,x+70,618,10,on?'rgb(150,90,30)':un?'rgb(70,50,30)':'rgb(40,38,38)',on?'rgb(255,236,150)':'rgb(150,120,70)',on?3:1);
    T(un?DIFFS[d].n:'未解鎖',x,599,FS(19),un?[255,244,214]:[130,125,120],2,[0,0,0],'mm');if(CLICK&&inp&&inBox(CLICK,[x-70,578,x+70,618])&&un)setDS(st,d)}
  const D=DIFFS[ds];T(`敵人 HP ×${D.hp}　傷害 ×${D.dmg}　掉寶 +${Math.round(D.drop*100)}%　金幣 ×${D.gold}　英雄裝 ${purPct(D)}%`,640,638,FN(15),[230,220,200],2,[0,0,0],'mm');
  T(`←→ 選任務　↑↓ 選難度　Enter 出發　Esc 離開任務板　（${HERO[HEROK].n}的進度）`,640,662,FN(14),[200,190,170],2,[0,0,0],'mm');
  if(!inp)return;const S=MAPT.sel;
  if(press(['ArrowLeft','KeyA'])||GPP.l){for(let i=S-1;i>=1;i--)if(stUnlocked(i)){MAPT.sel=i;break}}
  if(press(['ArrowRight','KeyD'])||GPP.r){if(S<NST&&stUnlocked(S+1))MAPT.sel=S+1}
  if(press(['ArrowUp','KeyW'])||GPP.u){const d=DS(S);if(d<4&&dUnlocked(S,d+1))setDS(S,d+1)}
  if(press(['ArrowDown','KeyS'])||GPP.d){const d=DS(S);if(d>0)setDS(S,d-1)}
  if(IN.start()||press(['KeyJ','Space'])||GPP.jump){UI.kind=null;m2StartSel()}else if(IN.esc()){m2CloseUI()}}
// --- 共用倉庫：左邊目前角色背包，右邊倉庫 ---
function whMove(side,idx){if(side===0){const L=SAVE.inv,it=L[idx];if(!it)return;if(isEq(it)){UI.msg=['裝備中的不能放進倉庫',[255,160,140]];sfx('clank',0.3);return}
    if(SAVE.wh.length>=WH_MAX){UI.msg=['倉庫滿了',[255,160,140]];return}L.splice(idx,1);SAVE.wh.push(it);UI.msg=[`${itName(it)} 放進倉庫`,[150,255,150]]}
  else{const it=SAVE.wh[idx];if(!it)return;if(SAVE.inv.length>=BAG_MAX){UI.msg=['背包滿了',[255,160,140]];return}SAVE.wh.splice(idx,1);SAVE.inv.push(it);UI.msg=[`${itName(it)} 拿到${HERO[HEROK].n}的背包`,[150,255,150]]}
  sfx('coin',0.35);m2Save()}
function whGrid(L,x0,y0,cols,rows,cur,on,inp,side){const z=46,pg=Math.floor(cur/(cols*rows))*cols*rows;
  for(let i=0;i<cols*rows;i++){const it=L[pg+i],x=x0+(i%cols)*50,y=y0+Math.floor(i/cols)*50,sel=on&&pg+i===cur;rrect(x,y,x+z,y+z,5,'rgba(40,30,24,0.85)',sel?'rgb(255,236,150)':'rgba(150,120,70,0.6)',sel?3:1);
    if(it)gearCard(it,x+1,y+1,z-2,sel);if(inp&&CLICK&&inBox(CLICK,[x,y,x+z,y+z])&&it){if(UI.side===side&&cur===pg+i)whMove(side,pg+i);else{UI.side=side;if(side)UI.ws=pg+i;else UI.bs=pg+i}}}
  const np=Math.max(1,Math.ceil(L.length/(cols*rows)));T(`第 ${Math.floor(pg/(cols*rows))+1}/${np} 頁`,x0+cols*25,y0+rows*50+14,FN(13),[200,190,170],2,[0,0,0],'mm')}
function whUI(inp){woodPanel(40,40,1240,680);T('共用倉庫',640,80,FS(32),[255,236,200],3,[60,20,10],'mm');
  T(`${HERO[HEROK].n}的背包 ${SAVE.inv.length}/${BAG_MAX}`,250,124,FS(19),UI.side===0?[255,236,150]:[210,200,190],2,[0,0,0],'mm');T(`倉庫（三人共用） ${SAVE.wh.length}/${WH_MAX}`,1030,124,FS(19),UI.side===1?[255,236,150]:[210,200,190],2,[0,0,0],'mm');
  UI.bs=clamp(UI.bs||0,0,Math.max(0,SAVE.inv.length-1));UI.ws=clamp(UI.ws||0,0,Math.max(0,SAVE.wh.length-1));
  whGrid(SAVE.inv,80,150,8,8,UI.bs,UI.side===0,inp,0);whGrid(SAVE.wh,822,150,8,8,UI.ws,UI.side===1,inp,1);
  const it=UI.side?SAVE.wh[UI.ws]:SAVE.inv[UI.bs];rrect(486,150,794,560,10,'rgba(0,0,0,0.4)','rgba(214,172,84,0.5)',1);itemDetail(it||null,500,166,784);
  const can=it&&!(UI.side===0&&isEq(it));if(btn(500,572,780,614,UI.side?'← 拿到背包':'放進倉庫 →',!!can)&&inp)whMove(UI.side,UI.side?UI.ws:UI.bs);
  if(UI.msg)T(UI.msg[0],640,632,FN(15),UI.msg[1],2,[0,0,0],'mm');
  T('方向鍵 選格子　Tab 切換背包／倉庫　Enter 或 J 搬移　Esc 離開　（裝備中的不能放；金幣也是共用的）',640,660,FN(14),[200,190,170],2,[0,0,0],'mm');
  if(!inp)return;const L=UI.side?SAVE.wh:SAVE.inv,k=UI.side?'ws':'bs';
  if(press(['Tab'])){UI.side^=1;UI.msg=null}
  if(press(['ArrowLeft','KeyA'])||GPP.l){if(UI[k]%8===0&&UI.side===1){UI.side=0}else UI[k]=Math.max(0,UI[k]-1)}
  if(press(['ArrowRight','KeyD'])||GPP.r){if((UI[k]%8===7||UI[k]>=L.length-1)&&UI.side===0){UI.side=1}else UI[k]=Math.min(Math.max(0,L.length-1),UI[k]+1)}
  if(press(['ArrowUp','KeyW'])||GPP.u)UI[k]=Math.max(0,UI[k]-8);if(press(['ArrowDown','KeyS'])||GPP.d)UI[k]=Math.min(Math.max(0,L.length-1),UI[k]+8);
  if(IN.start()||press(['KeyJ'])||GPP.jump)whMove(UI.side,UI[k]);else if(IN.esc())m2CloseUI()}
window.m2Overlay=(o=>()=>{if(UI.kind==='quest'||UI.kind==='wh'){const inp=!UI.fresh;UI.fresh=false;(UI.kind==='quest'?questUI:whUI)(inp);return}return o()})(window.m2Overlay);
window.__wh={move:whMove};
// ==== d_bard.js
// ---------- 可操作的吟遊詩人「尋歡作樂」 ----------
// 依 design/bard_research.md：樂想 紅/藍/綠、J×4（第 4 下調音敲擊）、空中 J 音符射擊、K 三連音、L 旋律衝擊（節奏≥3）／旋音射擊、
// 方向連按＝跪地滑行（絆倒）、↓連按＝跪地彈奏（彩色樂曲）、K+L＝戰鬥交響曲、Shift＝後跳閃避（完美閃避獎勵）、倒地受身、V＝召喚苦達
const BD={postIF:0.5,sp:345,spy:170,air:330,jv:1250,dg:1.2,sl:3.5,kn:6,ult:20,lcd:2.2,ideaHold:7,buff:6};   // W2.3：大招改回舊版（節奏 5＋冷卻 20 秒），樂章量表停用
// （W2.3 已停用，bUE 不再累積；大招改回節奏 5）W2：大招改用獨立的「樂章」量表（0–100），不再吃節奏 5 → K／L 花節奏不會再擋到大招。量表只存在關卡中（P.ue），不進存檔、不會衰減
const UE={max:100,rh:4,spend:2,hit:0.4,hitGap:0.1,idea:4,song:4,hurt:3,hurtGap:0.4,pf:5};
function bUE(n,gap,key){return;const s=S0,P=s.P,t=s.t;if(!isBard())return;if(!n||P.dead||(P.act&&P.act.type==='bu'))return;if(gap){if(t-(P[key]||-9)<gap)return;P[key]=t}
  const u0=P.ue||0;P.ue=Math.min(UE.max,u0+n);if(u0<UE.max&&P.ue>=UE.max){P.ueFullT=t;proc('樂章滿・K+L 大招',[200,120,255],'交');sfx('ready',0.4)}}
const B22={mul:1};
// W2 技能實用度調整（design/w2_skill_audit_zh.md）：三連音每圈 0.55→0.85、跪地彈奏 ×1.5（原本被 L 旋律衝擊／旋音射擊完全壓過）
const BAL_W2={bk:0.85,bp:1.5};
const IDEA={r:{n:'紅色樂想',d:'攻速、移速 +25%',c:[[150,30,40],[230,70,70],[255,170,150]]},b:{n:'藍色樂想',d:'傷害 +10%・範圍變大',c:[[30,50,140],[70,120,235],[170,215,255]]},
  g:{n:'綠色樂想',d:'回復 HP（滿血時移速 +20%）',c:[[30,100,40],[90,200,90],[190,255,170]]}};
const POOLKEY={n:['n','c'],wind:['wind','windc'],stomp:['stomp','stompc'],chg:['chg','chgc'],slam:['slam','slamc'],air:['air','airc']};
POOL.kwind=[45050,67550];POOL.kwindc=POOL.windc.map(v=>Math.round(v*0.6));
function bHit(m,mv,pool,mul,multi){const K=POOLKEY[mv]||POOLKEY.n,sv=[POOL[K[0]],POOL[K[1]]];if(pool){POOL[K[0]]=POOL[pool];POOL[K[1]]=POOL[pool+'c']||POOL[pool]}B22.mul=mul||1;let v=0;
  try{v=hitMob(m,mv,{multi:!!multi})}finally{POOL[K[0]]=sv[0];POOL[K[1]]=sv[1];B22.mul=1}bUE(UE.hit,UE.hitGap,'ueHitT');return v}
window.m2Dmg=(o=>(v,m,mv,c)=>{let r=o(v,m,mv,c);if(mv==='pet')return r;const s=S0;if(B22.mul!==1)r=Math.round(r*B22.mul);if(isBard()&&s.P.blueU>s.t)r=Math.round(r*1.1);return r})(window.m2Dmg);
function bBig(m){return m.kind==='boss'?60:m.kind==='pillar'?20:0}
function bTargets(r0,r1,dy,hmax){const s=S0,P=s.P,L=[];for(const m of s.mobs){if(m.gone||m.dying&&(m.kind==='pillar'||m.kind==='boss'))continue;const big=bBig(m),dx=(m.x-P.x)*P.face;
    if(dx<r0||dx>r1+big||Math.abs(m.y-P.y)>dy+big*0.6||m.h>(hmax||130))continue;L.push(m)}return L}
function bRh(n){const P=S0.P;const r0=P.rh;P.rh=Math.min(RHMAX,P.rh+n);if(GS.rhy&&P.rh>r0&&P.rh<RHMAX&&rnd()<GS.rhy){P.rh++;proc('節奏加成',[230,80,60],'節')}
}
function bTrip(m,dur){const s=S0,t=s.t;if(m.dying||m.kind==='pillar')return;if(m.kind==='boss'){if(!m21BossInv()){m.dizzy=t+0.45;const b=s.boss;if(b&&!b.atk&&b.nextAtk!=null)b.nextAtk=Math.max(b.nextAtk,t)+0.5}return}
  m.state='down';m.getup=t+(dur||1.2);m.h=0;m.vh=0;m.rot=0;m.wind=0;m.vx=0;m.dizzy=t+(dur||1.2)}
// --- 樂想 ---
function bIdeaGain(c){const s=S0,P=s.P,t=s.t;if(P.idea&&P.idea.until>t)return;c=c||CH(['r','g','b']);P.idea={c,until:t+BD.ideaHold,t0:t};
  s.fx.push({k:'b_idea',x:P.x,y:P.y,t0:t,c});sfx('ready',0.25)}
function bIdeaUse(){const s=S0,P=s.P,t=s.t,I=P.idea;if(!I||I.until<=t)return null;P.idea=null;const d=BD.buff*(I.x2||1);
  if(I.c==='r')P.redU=t+d;else if(I.c==='b')P.blueU=t+d;else{if(P.hp>=HPMAX)P.grnU=t+d;else{const h=Math.round(HPMAX*0.06);P.hp=Math.min(HPMAX,P.hp+h);s.heals.push({t,x:P.x,y:P.y-200,v:h});P.regU=t+3*(I.x2||1);P.regN=t+0.5}}
  s.fx.push({k:'b_iflash',x:P.x,y:P.y,t0:t,c:I.c});proc(IDEA[I.c].n,IDEA[I.c].c[1],'樂');sfx('summon',0.3);bUE(UE.idea);return I.c}
const bRed=()=>S0.P.redU>S0.t,bBlue=()=>S0.P.blueU>S0.t;
// --- 動作 ---
function bAct(type,dur,o){const P=S0.P;P.act=Object.assign({type,t:0,dur,hitAt:99,done:false,hitIds:{}},o||{});P.chainBuf=0;return P.act}
const BCH={b1:{dur:0.24,hit:0.08,pool:'n',mul:0.8,r:[0,120],dy:32,nx:'b2'},b2:{dur:0.26,hit:0.10,pool:'n',mul:0.9,r:[0,130],dy:34,nx:'b3'},
  b3:{dur:0.30,hit:0.12,pool:'n',mul:1.0,r:[-20,140],dy:36,nx:'b4',rh:1},b4:{dur:0.42,hit:0.14,pool:'n',mul:1.5,r:[0,120],dy:32,nx:null}};
function bNote(o){(S0.notes=S0.notes||[]).push(Object.assign({t0:S0.t,hit:{},life:0.5},o))}
function bStartK(){const s=S0,P=s.P,t=s.t;const r0=P.rh;P.rh-=2;bUE(2*UE.spend);const c=bIdeaUse();bAct('bk',0.9,{rh0:r0,ideaC:c});s.callout={t0:t,txt:'三連音'};sfx('swing',0.35)}
function bStartL(){const s=S0,P=s.P,t=s.t;if(P.rh>=3){const r0=P.rh;P.rh-=3;bUE(3*UE.spend);const c=bIdeaUse();bAct('bl',0.8,{rh0:r0,ideaC:c});s.callout={t0:t,txt:'旋律衝擊'};sfx('wind',0.4);return}
  if(P.slamCD<=0){P.slamCD=BD.lcd;bAct('bls',0.36,{hitAt:0.12});return}s.denyL=t}
function bStartSlide(dir){const s=S0,P=s.P,t=s.t;P.face=dir;bIdeaUse();bAct('bs',0.56,{dir});P.chgCD=BD.sl*(1-(GS.mvcd||0));P.chgIF=t+0.36;s.callout={t0:t,txt:'跪地滑行'};sfx('swing',0.4);P.ghost=[];puff(P.x-20*dir,P.y-3,6,[214,170,128],24,0.4,3)}
function bStartKneel(){const s=S0,P=s.P,t=s.t;const c=bIdeaUse();bAct('bp',0.62,{song:c||'n'});P.stpCD=BD.kn*(1-(GS.mvcd||0));s.callout={t0:t,txt:'跪地彈奏'};sfx('jump',0.3)}
function bStartDodge(){const s=S0,P=s.P,t=s.t;bAct('bd',0.30);P.dgCD=BD.dg;P.dgI0=t+0.04;P.dgIF=t+0.22;P.vh=520;P.h=Math.max(P.h,0.01);sfx('jump',0.25)}
function bStartUlt(){const s=S0,P=s.P,t=s.t;P.rh=0;P.ultCD=BD.ult;const I=P.idea&&P.idea.until>t?P.idea:null;if(I){I.x2=2}
  bAct('bu',3.2,{ticks:0,keep:I?I.c:null});P.ultIF=t+3.25;s.callout={t0:t,txt:'戰鬥交響曲'};sub('尋歡作樂','♪ 來，給你加點勁兒！',1.9);musPlay('lute',0.75,0.25,true);musVol(CURM,DUCKV,0.4);sfx('summon',0.5);
  s.fx.push({k:'b_ultc',x:P.x,y:P.y,t0:t})}
function bPerfect(){const s=S0,P=s.P,t=s.t;P.dgIF=0;P.invU=t+0.35;P.dgCD=0;P.pfU=t+0.4;bRh(1);bUE(UE.pf);P.idea=null;bIdeaGain();
  s.dmg.push({t,x:P.x,y:P.y-210,v:0,crit:false,label:'哎唷～',zj:false,pet:false,zero:true});proc('完美閃避',[120,200,255],'閃');s.fx.push({k:'b_pf',x:P.x,y:P.y,t0:t});if(GS.aftr)P.aftrU=t+2}
// 每 frame
function bStep(dt){const s=S0,P=s.P,t=s.t;if(P.chgCD==null){P.chgCD=0;P.stpCD=0}P.dgCD=(P.dgCD||0)-dt;P.ultCD=(P.ultCD||0)-dt;P.slamCD-=dt;P.chgCD-=dt;P.stpCD-=dt;
  if(P.regU>t&&t>=P.regN){P.regN+=0.5;const h=Math.round(HPMAX*0.01);P.hp=Math.min(HPMAX,P.hp+h)}
  if(P.idea&&P.idea.until<=t)P.idea=null;
  bNotesStep(dt);
  const wantJump=IN.jump()||(AUTO&&AI.jump);
  if(P.dead||s.ritual||s.trans)return;
  // 倒地／受身
  if(m2Down()){if(!P.tech&&wantJump&&t-P.downT0<=0.25){P.tech=1;P.downU=t+0.35;P.invU=P.downU+0.5;P.techT=t;proc('受身',[150,200,255],'受');sfx('jump',0.3)}
    if(P.tech){const k=(t-P.techT)/0.35;P.x=clamp(P.x-P.face*340*(1-k)*dt,30,WW-30)}return}
  P.tech=0;
  let mx=(IN.r()?1:0)-(IN.l()?1:0),my=(IN.d()?1:0)-(IN.u()?1:0);if(AUTO){mx=AI.mx;my=AI.my}
  const wantAtk=IN.atk()||(AUTO&&AI.atk),wantSkill=IN.skill()||(AUTO&&AI.skill),wantSum=IN.sum()||(AUTO&&AI.sum),wantStab=IN.stab()||(AUTO&&AI.stab);
  const wantDodge=press(['ShiftLeft','ShiftRight'])||GPP.dodge||(AUTO&&AI.dodge),wantUlt=(AUTO&&AI.ult)||(held(['KeyK'])&&held(['KeyL'])&&(wantSkill||wantStab));
  if(wantSum&&!s.ally){if(s.food>=FOOD_MAX&&t>(s.allyCD||0)){bIdeaUse();m22SummonKudas()}else if(t-s.hungryT>0.4){s.hungryT=t;sfx('clank',0.2)}}
  let fire=m21Taps();if(AUTO)fire=AI.chg?(AI.chg>0?'r':'l'):AI.stomp?'d':null;
  const spd=(1+GS.aspd+(P.aftrU>t?GS.aftr:0))*(bRed()?1.25:1);
  const a=P.act;const cancelOK=!a||(BCH[a.type]&&a.done&&a.t>a.hitAt+0.05)||a.type==='ba'||(a.type==='bls'&&a.done);
  // K+L 大招（K、L 任一個按下時另一個也按著，或 0.12 秒內先後按）
  if(wantStab)P.kT=t;if(wantSkill)P.lT=t;const kl=(wantStab&&t-(P.lT||-9)<0.12)||(wantSkill&&t-(P.kT||-9)<0.12)||wantUlt;
  const fresh=a&&(a.type==='bk'||a.type==='bl')&&a.t<0.14&&a.rh0>=RHMAX;const rhOK=P.rh>=RHMAX||fresh;   // W2.3：改回舊版（看節奏 5）
  if(kl&&rhOK&&P.ultCD<=0&&(!a||cancelOK||fresh)&&P.h<=0){const ic=fresh&&a.ideaC;P.act=null;bStartUlt();if(ic){const k={r:'redU',b:'blueU',g:'grnU'}[ic];if(P[k]>t)P[k]+=BD.buff}}
  else if(kl&&rhOK&&P.ultCD>0)s.denyU=t;
  else if(wantDodge&&P.h<=0&&P.dgCD<=0&&(!a||cancelOK||['b1','b2','b3','b4','bls'].includes(a.type))){bStartDodge()}
  else if(fire&&P.h<=0&&(!a||cancelOK)){if(fire==='d'){if(P.stpCD<=0)bStartKneel();else s.denyStp=t}else{if(P.chgCD<=0)bStartSlide(fire==='r'?1:-1);else s.denyChg=t}}
  else if(!P.act||cancelOK&&(wantStab||wantSkill)&&P.h<=0){
    if(wantStab&&P.h<=0&&!(P.act&&!cancelOK)){if(P.rh>=2)bStartK();else s.denyK=t}
    else if(wantSkill&&P.h<=0){bStartL()}
    else if(wantAtk&&!P.act){if(P.h>20){if((P.airN||0)<(bRed()?2:1)){P.airN=(P.airN||0)+1;bAct('ba',0.14,{hitAt:0.03})}}else if(P.h<=0)bAct('b1',BCH.b1.dur,{hitAt:BCH.b1.hit})}
    else if(wantJump&&P.h<=0&&!P.act){P.vh=BD.jv;P.h=0.01;P.airN=0;sfx('jump',0.3)}}
  const A=P.act;
  if(A){const u=['bu','bd','bs','bp'].includes(A.type)?1:spd;A.t+=dt*u;const C=BCH[A.type];
    if(C){if(wantAtk&&A.t>A.hitAt-0.04&&C.nx)P.chainBuf=1;
      if(!A.done&&A.t>=A.hitAt){A.done=true;const tg=bTargets(C.r[0],C.r[1]+(bBlue()?20:0),C.dy);for(const m of tg)bHit(m,'n',C.pool,C.mul,tg.length>=2);
        if(A.type==='b4'){s.fx.push({k:'b_bonk',x:P.x+70*P.face,y:P.y,t0:t});if(tg.length){s.dmg.push({t,x:P.x+80*P.face,y:P.y-170,v:0,label:'鏗！',zero:true});sfx('clank',0.45)}P.vh=360;P.h=0.01}
        if(tg.length&&C.rh)bRh(1);if(tg.length&&A.type==='b4')bRh(1);sfx('swing',0.3)}
      if(A.t>=A.dur){const nx=P.chainBuf?C.nx:null;P.act=null;P.chainBuf=0;if(nx)bAct(nx,BCH[nx].dur,{hitAt:BCH[nx].hit})}}
    else bActStep(A,dt,mx,my)}
  // 移動
  const B=P.act,free=!B||B.type==='ba'||(BCH[B.type]&&B.done&&B.t>B.hitAt+0.08);const ox=P.x,oy=P.y;
  const msk=(1+GS.ms)*(bRed()?1.25:1)*(P.grnU>t?1.2:1);
  if(free&&!(B&&B.type==='ba')){const sp=(P.h>0?BD.air:BD.sp)*msk;let vx=mx*sp,vy=my*BD.spy*msk;if(mx&&my){vx*=0.85;vy*=0.85}P.x+=vx*dt;P.y+=vy*dt;if(mx)P.face=mx>0?1:-1}
  else if(B&&BCH[B.type]&&B.t<0.1)P.x+=P.face*50*dt;
  const lo=s.lock?s.cam+40:30,hi=s.lock?s.cam+W-40:WW-30;P.x=clamp(P.x,lo,hi);P.y=clamp(P.y,YMIN,YMAX);
  P.kspd=Math.abs(P.x-ox)/dt;P.mspd=Math.hypot(P.x-ox,P.y-oy)/dt;
  const hover=B&&B.type==='ba'||B&&B.type==='bu'&&B.air;
  if(!hover&&(P.h>0||P.vh>0)){P.h+=P.vh*dt;P.vh-=5104*dt;if(P.h<=0){P.h=0;P.vh=0;P.airN=0;puff(P.x,P.y-3,4,[214,170,128],20,0.35,2)}}
  if(P.kspd>120&&P.h===0&&t-(P.lastdust||0)>0.1){P.lastdust=t;puff(P.x-25*P.face,P.y-3,3,[214,170,128],10,0.33,2)}
  // 樂想 buff 中：腳邊淡淡的彩色音符
  for(const [k,c] of [['redU','r'],['blueU','b'],['grnU','g'],['regU','g']])if(P[k]>t&&Math.floor(t/0.22)!==Math.floor((t-dt)/0.22))s.parts.push({x:P.x+U(-26,26),y:P.y-U(4,30),vx:U(-10,10),vy:-U(40,70),g:0,life:0.6,t0:t,c:IDEA[c].c[2],sz:2,faint:true})}
function bActStep(A,dt,mx,my){const s=S0,P=s.P,t=s.t,f=P.face;
  switch(A.type){
  case 'ba':P.vh=0;if(!A.done&&A.t>=A.hitAt){A.done=true;const an=35*Math.PI/180;bNote({k:'shot',x:P.x+40*f,y:P.y,h:P.h+60,vx:900*Math.cos(an)*f,vh:-900*Math.sin(an),life:0.4,pool:'air',mul:0.7});sfx('swing',0.3);s.fx.push({k:'b_muz',x:P.x+50*f,y:P.y,h:P.h+60,t0:t,f})}
    if(A.t>=A.dur){P.act=null;P.vh=-200}break;
  case 'bk':{const T3=[0.12,0.42,0.62];for(let i=0;i<3;i++)if(A.t>=T3[i]&&!(A['r'+i])){A['r'+i]=1;bNote({k:'ring',x:P.x+50*f,y:P.y,dir:f,i,sc:(1+0.15*i)*(bBlue()?1.15:1),life:0.55,pool:'chg',mul:BAL_W2.bk,slow:i===2});sfx('swing',0.3+0.05*i)}
    if(A.t>=A.dur)P.act=null;break}
  case 'bl':{const u=A.t;if(u>0.15&&u<0.62){const k=(u-0.15)/0.47;P.x+=f*520*(1-k*0.7)*dt}
    if(!A.done&&u>=0.3){A.done=true;const tg=bTargets(-60,190+(bBlue()?30:0),44);for(const m of tg)bHit(m,'wind',null,0.8,tg.length>=2);if(tg.length){bIdeaGain();shake(8,0.25);s.hitstop=0.05}s.fx.push({k:'b_swirl',x:P.x+60*f,y:P.y,t0:t,f})}
    if(u>0.15&&u<0.6&&Math.floor(t/0.03)!==Math.floor((t-dt)/0.03))s.parts.push({x:P.x+U(-60,60),y:P.y-U(10,120),vx:U(-60,60),vy:-U(30,90),g:0,life:0.35,t0:t,c:CH([[255,220,120],[255,150,200],[150,200,255]]),sz:2});
    if(u>=A.dur)P.act=null;break}
  case 'bls':if(!A.done&&A.t>=A.hitAt){A.done=true;bNote({k:'bshot',x:P.x+60*f,y:P.y,h:80,vx:1100*f,vh:0,life:0.6,pool:'slam',mul:0.6,bounce:2});sfx('wind',0.3);s.fx.push({k:'b_muz',x:P.x+60*f,y:P.y,h:80,t0:t,f})}
    if(A.t>=A.dur)P.act=null;break;
  case 'bs':{const u=A.t,d=A.dir,SL=A.sl||(A.sl=window.bSlideStat?bSlideStat():{m:1,h:1});if(u>=0.1&&u<0.5){const k=(u-0.1)/0.4;P.x+=d*1300*SL.m*Math.pow(1-k,1.6)*dt;
      if(t-(P.lastG||0)>0.03){P.lastG=t;(P.ghost=P.ghost||[]).push({x:P.x,y:P.y,t,nm:'bh_knee_slide',f:d});if(P.ghost.length>6)P.ghost.shift()}
      if(t-(P.lastdust||0)>0.04){P.lastdust=t;puff(P.x-20*d,P.y-3,3,[214,170,128],18,0.4,3)}
      let n=0;for(const m of s.mobs){if(m.gone||A.hitIds[m.id]||m.dying)continue;const big=bBig(m),dx=(m.x-P.x)*d;if(dx<-30||dx>80+big||Math.abs(m.y-P.y)>34+big*0.6||m.h>60)continue;A.hitIds[m.id]=1;
        bHit(m,'n','chg',0.8,false);n++;bTrip(m,1.2);s.fx.push({k:'b_trip',x:m.x,y:m.y,t0:t});
        // M2.3：強化越高，同一個敵人多被打幾段（之後每 0.06 秒 1 段、每段 0.45 倍，由 e_slide.js 的 bStep 處理）
        if(SL.h>1)(s.slq=s.slq||[]).push({id:m.id,n:SL.h-1,next:t+0.06})}
      if(n){shake(5,0.14);s.hitstop=Math.max(s.hitstop,0.05);if(!A.gotRh){A.gotRh=1;bRh(1);bIdeaGain()}}}
    if(u>=A.dur)P.act=null;break}
  case 'bp':{if(!A.imp&&A.t>=0.35){A.imp=1;bKneelImpact(A)}if(A.t>=A.dur)P.act=null;break}
  case 'bd':{const u=A.t,k=Math.min(1,u/0.3);P.x-=P.face*1000*(1-k)*dt;if(A.t>=A.dur){P.act=null}break}
  case 'bu':bUltStep(A,dt);break}}
function bKneelImpact(A){const s=S0,P=s.P,t=s.t;const rx=bBlue()||A.song==='b'?300:240,ry=70;const tg=[];
  for(const m of s.mobs){if(m.gone||m.dying)continue;const big=m.kind==='boss'?80:0;const dx=(m.x-P.x)/(rx+big),dy=(m.y-P.y)/(ry+big*0.4);if(dx*dx+dy*dy>1||m.h>130)continue;tg.push(m)}
  const mul=(A.song==='r'?1.3:1)*BAL_W2.bp;for(const m of tg){const inv=m21Boss(m)&&m21BossInv();bHit(m,'stomp',null,mul,tg.length>=2);if(m.dying||m.kind==='pillar'||inv)continue;m.slowU=t+3;m.slowK=0.6;if(m21Boss(m)&&s.boss)s.boss.slowU=t+3}
  const SONG={r:['勇猛讚歌',1.3],g:['希望之歌',1],b:['反擊序曲',1]};if(A.song==='g'||A.song==='b'){}
  if(A.song==='g'){const h=Math.round(HPMAX*0.06*1.5);P.hp=Math.min(HPMAX,P.hp+h);s.heals.push({t,x:P.x,y:P.y-200,v:h})}
  if(A.song==='b'){P.ctrU=t+4}
  if(SONG[A.song])bUE(UE.song);   // W2：唱出讚歌／希望之歌／反擊序曲＝多累積樂章
  if(SONG[A.song])s.callout={t0:t,txt:SONG[A.song][0]};
  s.fx.push({k:'b_kneel',x:P.x,y:P.y,t0:t,rx,song:A.song});shake(8,0.25);s.hitstop=Math.max(s.hitstop,0.04);sfx('hit',0.4);if(tg.length){bRh(1);bIdeaGain()}}
// 戰鬥交響曲：起手 .15 → 甩頭連段 .45（斬擊）→ 音圈爆開 .1 → 彈奏 1.4（7 拍）→ 躍起 .6（全體倒地爆炸）→ 落地 .5
const ULT=[['cast',0.15],['bang',0.45],['ring',0.1],['play',1.4],['leap',0.6],['land',0.5]];
function bUltPh(u){let a=0;for(const [k,d] of ULT){if(u<a+d)return[k,(u-a)/d];a+=d}return['land',1]}
function bUltStep(A,dt){const s=S0,P=s.P,t=s.t,f=P.face,[ph,k]=bUltPh(A.t);
  const all=(mul,mv,pool,rx,fn)=>{const tg=s.mobs.filter(m=>!m.gone&&!m.dying&&Math.abs(m.x-P.x)<rx+bBig(m)&&Math.abs(m.y-P.y)<120+bBig(m));for(const m of tg){bHit(m,mv,pool,mul,tg.length>=2);if(fn)fn(m)}return tg.length};
  if(ph==='bang'&&k>=0.6&&!A.s1){A.s1=1;all(1.0,'n','slam',220);s.fx.push({k:'b_uslash',x:P.x+60*f,y:P.y,t0:t,f});shake(6,0.2);sfx('swing',0.5)}
  if(ph==='ring'&&!A.s2){A.s2=1;all(0.5,'n','chg',300,m=>{if(m.kind!=='boss'&&m.kind!=='pillar'&&!m.dying){m.state='stun';m.stun=t+0.8;m.vx=Math.sign(m.x-P.x||1)*420}});s.fx.push({k:'ring',x:P.x,y:P.y,t0:t,col:[255,150,220],big:true});shake(6,0.2)}
  if(ph==='play'){const n=Math.min(7,Math.floor(k*7.0001)+1);while(A.ticks<n){A.ticks++;all(0.45,'n','chg',360);s.fx.push({k:'b_utick',x:P.x,y:P.y,t0:t,i:A.ticks});sfx('hit',0.25)}}
  if(ph==='leap'){A.air=1;P.h=Math.sin(Math.PI*Math.min(1,k))*150;if(k>=0.85&&!A.s3){A.s3=1;all(1.0,'wind',null,520,m=>bTrip(m,1.6));s.fx.push({k:'b_uboom',x:P.x,y:P.y,t0:t});shake(14,0.4);s.hitstop=0.08;sfx('crit',0.55);sfx('clank',0.4)}}
  if(ph==='land'){A.air=0;P.h=0;P.vh=0;if(!A.s4){A.s4=1;puff(P.x,P.y-3,10,[200,150,255],60,0.5,3)}}
  if(A.t>=A.dur){P.act=null;P.h=0;P.invU=Math.max(P.invU||0,t+BD.postIF);P.postIFU=t+BD.postIF;if(!A.keep)bIdeaGain();musStop('lute',0.8);musVol(CURM,BGMV,0.8)}}   // W2.3：放完大招 0.5 秒無敵
// --- 飛行物：音符子彈、三連音音圈 ---
function bNotesStep(dt){const s=S0,t=s.t;if(!s.notes)return;
  for(const b of s.notes){const age=t-b.t0;if(age>b.life){b.dead=1;continue}
    if(b.k==='ring'){b.x+=b.dir*520*dt;const R=48*b.sc;for(const m of s.mobs){if(m.gone||m.dying||b.hit[m.id])continue;const big=bBig(m);if(Math.abs(m.x-b.x)>R+big||Math.abs(m.y-b.y)>34*b.sc+big*0.6||m.h>140)continue;b.hit[m.id]=1;
        bHit(m,'n',b.pool,b.mul,false);if(b.slow&&!m.dying){m.slowU=t+2;m.slowK=0.5;if(m21Boss(m)&&s.boss)s.boss.slowU=t+2}if(!s.P.act||!s.P.act.gotI){bIdeaGain();if(s.P.act)s.P.act.gotI=1}}continue}
    b.x+=b.vx*dt;b.h+=b.vh*dt;if(b.h<=4&&b.k==='shot'){b.dead=1;s.fx.push({k:'b_pop',x:b.x,y:b.y,h:4,t0:t});continue}
    for(const m of s.mobs){if(m.gone||m.dying||b.hit[m.id])continue;const big=bBig(m);if(Math.abs(m.x-b.x)>40+big||Math.abs(m.y-b.y)>30+big*0.4||b.h>m.h+170+big*2)continue;
      b.hit[m.id]=1;bHit(m,'n',b.pool,b.mul,false);s.fx.push({k:'b_pop',x:b.x,y:b.y,h:b.h,t0:t});
      if(b.bounce>0){b.bounce--;const nx=s.mobs.filter(o=>!o.gone&&!o.dying&&!b.hit[o.id]&&Math.hypot(o.x-b.x,o.y-b.y)<420).sort((p,q)=>Math.hypot(p.x-b.x,p.y-b.y)-Math.hypot(q.x-b.x,q.y-b.y))[0];
        if(nx){const d=Math.hypot(nx.x-b.x,nx.y-b.y)||1;b.vx=(nx.x-b.x)/d*1100;b.vy=(nx.y-b.y)/d*1100;b.t0=t;b.life=0.5;continue}}if(b.pool==='air'){b.dead=1;continue}b.dead=1;break}   // W2.7：空中攻擊打到的那一格，判定範圍內的敵人都算（每隻一次），之後消失
    if(b.vy)b.y+=b.vy*dt}
  s.notes=s.notes.filter(b=>!b.dead)}
// 反擊序曲：受傷時反擊
// --- 受傷：比較脆（×1.10、3 下倒地／戰意 4 下）、後跳閃避的無敵、完美閃避 ---
window.m2Hurt=(o=>(v,x)=>{if(HEROK==='archer'&&window.aHurt)return aHurt(o,v,x);if(!isBard())return o(v,x);const s=S0,P=s.P,t=s.t;if(t<(P.invU||0))return 0;
  if(P.dgIF>t&&t>=(P.dgI0||0)){bPerfect();return 0}if(P.ultIF>t)return 0;
  const a=P.act;P.act=a||{type:'_'};let r;try{r=o(v,x)}finally{P.act=a}if(!r)return r;r=Math.round(r*1.10);bUE(UE.hurt,UE.hurtGap,'ueHurtT');
  const armor=a&&['bk','bl','bu'].includes(a.type);P.flashT=t+0.08;
  if(!armor){const d=(x!=null&&x>P.x)?-1:1;P.x=clamp(P.x+18*d,30,WW-30);P.hurtT=t;
    if(t-(P.lastHurt2||-9)>2.0)P.hc=0;P.hc=(P.hc||0)+1;P.lastHurt2=t;
    if(P.hc>=(P.zyU>t?4:3)){P.hc=0;if(GS.kdr&&rnd()<GS.kdr)proc('抗倒地',[200,160,90],'穩');
      else{P.downU=t+0.7;P.downT0=t;P.invU=P.downU+0.8;P.h=0;P.vh=0;P.act=null;proc('倒地',[110,110,130],'倒');if(GS.grit){const h=Math.round(HPMAX*GS.grit);P.hp=Math.min(HPMAX,P.hp+h);proc('根性 +'+h,[255,140,80],'根')}}}}
  if(P.ctrU>t&&P.hp>0){let n=0;for(const m of s.mobs){if(m.gone||m.dying||m.kind==='pillar'||m.kind==='boss')continue;if(Math.abs(m.x-P.x)<170&&Math.abs(m.y-P.y)<70){m.state='stun';m.stun=t+0.8;m.dizzy=t+0.8;m.vx=Math.sign(m.x-P.x||1)*420;n++}}
    if(n){s.fx.push({k:'ctr',x:P.x,y:P.y,t0:t});proc('反擊序曲',[255,120,60],'反');P.ctrU=0}}
  return r})(window.m2Hurt);
window.stepPlayer=(o=>dt=>{if(HEROK==='archer'&&window.aStep)return aStep(dt);if(!isBard())return o(dt);bStep(dt)})(window.stepPlayer);
// 姿勢
function bPose(P,t){const s=S0,a=P.act;if(P.dead)return 'down';if(m2Down())return P.tech?'tech_roll':'down';
  if(P.pfU>t)return 'fakehit';
  if(a){const u=a.t;switch(a.type){
    case 'b1':return u<a.hitAt?'triplet_cast':'thrust';case 'b2':return u<a.hitAt?'overhead':'sweep';case 'b3':return u<a.hitAt?'melody_crouch':'triplet_swing';
    case 'b4':return u<a.hitAt?'tune_bonk0':'tune_bonk1';case 'ba':return 'air_shot';
    case 'bk':return Math.floor(u/0.15)%2?'triplet_swing':'triplet_cast';case 'bls':return u<a.hitAt?'cast':'air_shot';
    case 'bl':return u<0.15?'melody_crouch':'melody_spin';
    case 'bs':return u<0.1?'kneel_jump':'knee_slide';case 'bp':return u<0.12?'kneel_jump':'kneel_play';case 'bd':return u<0.15?'backstep0':'backstep1';
    case 'bu':{const [ph,k]=bUltPh(u);if(ph==='cast')return 'cast';if(ph==='bang')return ['ult_kick','ult_headback','ult_hairwhip','ult_headbang'][Math.min(3,Math.floor(k*4))];
      if(ph==='ring')return 'ult_headbang';if(ph==='play')return 'ult_play'+Math.floor(u/0.1)%2;if(ph==='leap')return k<0.5?'ult_leap':'ult_layback';return 'ult_land'}}}
  if(P.hurtT&&t-P.hurtT<0.22)return 'hurt';
  if(P.h>0)return 'jump';if(P.kspd>40||P.mspd>40)return 'run'+Math.floor(t/0.09)%4;return 'play'+Math.floor(t/0.36)%2}
// ==== e_fx.js
// ---------- 詩人特效（低解析度 ×3、多層色階） ----------
const PINK=[[120,30,80],[220,80,150],[255,160,210],[255,230,245]],GOLD5=PAL.gold,BLUE5=PAL.blue,PURP=[[50,20,80],[110,50,170],[180,120,240],[235,210,255]],YG=[[60,90,10],[140,190,30],[210,240,80],[250,255,200]];
function pNote(x,cx,cy,cols,s=1){// 音符：符頭（三色）＋符桿（雙色粗帶）＋符尾
  cx=Math.round(cx);cy=Math.round(cy);bdisc(x,cx,cy,3*s,[cols[0],cols[1],cols[2]],0.75);x.fillStyle=rgb(cols[0]);x.fillRect(cx+Math.round(2*s)-1,cy-Math.round(9*s),2,Math.round(9*s));x.fillStyle=rgb(cols[2]);x.fillRect(cx+Math.round(2*s)-1,cy-Math.round(9*s),1,Math.round(8*s));
  x.fillStyle=rgb(cols[1]);x.fillRect(cx+Math.round(2*s),cy-Math.round(9*s),Math.round(3*s),2);x.fillRect(cx+Math.round(3*s),cy-Math.round(8*s),Math.round(2*s),2);pdot(x,cx-1,cy-1,cols[3]||[255,255,255])}
function bDrawNotes(SX,shy){const s=S0,t=s.t;if(!s.notes)return;
  for(const b of s.notes){const age=t-b.t0,sx=SX(b.x);
    if(b.k==='ring'){const k=age/b.life,f=k<0.7?1:1-(k-0.7)/0.3;const [c,x]=pxc(40,56);const r=(8+10*Math.min(1,age/0.12))*b.sc;
      bring(x,20,28,r,7*b.sc,PINK,1.5,f);bring(x,20,28,r*0.62,4*b.sc,[[160,60,120],[255,190,230]],1.5,f*0.7);for(let i=0;i<3;i++)pNote(x,20+Math.cos(t*6+i*2.1)*r*0.9,28+Math.sin(t*6+i*2.1)*r*1.2,PINK,0.8);
      pxOut(c,sx,b.y-60+shy,1);bloom(sx,b.y-60+shy,60*b.sc,[255,150,210],0.35*f);continue}
    const [c,x]=pxc(24,24);const cols=b.k==='bshot'?BLUE5:[[150,60,20],[255,170,60],[255,230,150],[255,255,240]];pNote(x,10,16,cols,1.3);
    for(let i=1;i<4;i++)pdot(x,12-Math.sign(b.vx||1)*i*3,15+i%2,cols[Math.min(3,i)],1);pxOut(c,sx,b.y-b.h+shy);bloom(sx,b.y-b.h+shy,34,cols[2],0.5);
    if(Math.floor(t/0.03)%2===0)s.parts.push({x:b.x,y:b.y-b.h,vx:U(-30,30),vy:-U(10,40),g:0,life:0.25,t0:t,c:cols[2],sz:2})}}
function bDrawFx(SX,shy){const s=S0,t=s.t,P=s.P;
  for(const e of s.fx){const age=t-e.t0;if(!e.k.startsWith('b_'))continue;const sx=SX(e.x),sy=e.y+shy;
    switch(e.k){
    case 'b_idea':if(age<0.5){const k=age/0.5;const [c,x]=pxc(40,40);bring(x,20,20,4+14*k,5*(1-k)+1,IDEA[e.c].c,1,1-k);pxOut(c,sx,sy-200);}break;
    case 'b_iflash':if(age<0.45){const k=age/0.45;const [c,x]=pxc(70,40);bring(x,35,22,8+26*k,8*(1-k)+2,IDEA[e.c].c,0.45,1-k);bdisc(x,35,22,14*(1-k),IDEA[e.c].c,0.45,1-k);pxOut(c,sx,sy-10);
      for(let i=0;i<3;i++){const [c2,x2]=pxc(16,16);pNote(x2,7,12,IDEA[e.c].c,1);pxOut(c2,sx-50+i*50,sy-120-k*80-i*10,1-k)}bloom(sx,sy-80,110,IDEA[e.c].c[2],0.45*(1-k))}break;
    case 'b_pf':if(age<0.5){const k=age/0.5;const [c,x]=pxc(60,60);bring(x,30,30,6+20*k,6*(1-k)+1,PAL.frost,1,1-k);for(let i=0;i<8;i++){const an=i*0.785+k,r=8+22*k;pspark(x,30+Math.cos(an)*r,30+Math.sin(an)*r,[255,255,255],[150,210,255],i%2)}pxOut(c,sx,sy-90)}break;
    case 'b_bonk':if(age<0.32){const k=age/0.32;const [c,x]=pxc(44,44);bdisc(x,22,22,4+10*k,GOLD5,1,1-k);for(let i=0;i<6;i++){const an=i*1.047,r=6+16*k;m21Star(x,22+Math.cos(an)*r,22+Math.sin(an)*r,1)}pxOut(c,sx,sy-90);bloom(sx,sy-90,50,[255,220,120],0.5*(1-k))}break;
    case 'b_trip':if(age<0.4){const k=age/0.4;const [c,x]=pxc(50,24);for(let i=0;i<5;i++)bdisc(x,25+(i-2)*8*k*1.4,16-3*k,3+5*k,PAL.dust,0.6,(1-k)*0.8);pxOut(c,sx,sy-10)}break;
    case 'b_muz':if(age<0.18){const k=age/0.18;const [c,x]=pxc(30,30);bdisc(x,15,15,3+8*k,GOLD5,1,1-k);bring(x,15,15,4+10*k,3,[[255,180,220],[255,255,255]],1,1-k);pxOut(c,sx,e.y-e.h+shy)}break;
    case 'b_pop':if(age<0.3){const k=age/0.3;const [c,x]=pxc(36,36);bring(x,18,18,3+12*k,4*(1-k)+1,PINK,1,1-k);for(let i=0;i<5;i++){const an=i*1.257,r=4+12*k;pspark(x,18+Math.cos(an)*r,18+Math.sin(an)*r,[255,255,255],[255,170,220],0)}pxOut(c,sx,e.y-e.h+shy)}break;
    case 'b_uslash':if(age<0.35){const k=age/0.35;const [c,x]=pxc(90,70);for(let j=0;j<4;j++){const cols=[PINK[0],PINK[1],PINK[2],PINK[3]][j];x.globalAlpha=1-k;x.fillStyle=rgb(cols);x.beginPath();x.ellipse(45,35,40-j*3,30-j*2,0,-1.9+k,0.6+k);x.ellipse(45,40,34-j*3,22-j*2,0,0.6+k,-1.9+k,true);x.fill()}x.globalAlpha=1;
      X.save();if(e.f<0){X.translate(sx,0);X.scale(-1,1);X.translate(-sx,0)}pxOut(c,sx,sy-90);X.restore();bloom(sx,sy-90,110,[255,150,210],0.5*(1-k))}break;
    case 'b_utick':if(age<0.3){const k=age/0.3,cols=e.i<=3?BLUE5:PINK;const [c,x]=pxc(120,50);bring(x,60,30,10+48*k,6*(1-k)+2,cols,0.42,1-k);pxOut(c,sx,sy-10)}break;
    case 'b_uboom':if(age<0.8){const k=Math.min(1,age/0.45),f=age<0.45?1:1-(age-0.45)/0.35;const [c,x]=pxc(200,90);
      bdisc(x,100,60,20+60*k,YG,0.55,f);bring(x,100,60,30+70*k,10*(1-k)+3,[[180,220,40],[240,255,140],[255,255,255]],0.55,f);
      for(let i=0;i<16;i++){const an=m21H(i,11)*Math.PI*2,r=(20+80*k)*(0.6+0.4*m21H(i,12));pdiam(x,100+Math.cos(an)*r,50+Math.sin(an)*r*0.5,1+(i%2),YG.slice(1))}
      pxOut(c,sx,sy-60);bloom(sx,sy-60,300,[220,255,120],0.5*f,0.6)}break;
    case 'b_ultc':if(age<0.5){const k=age/0.5;const [c,x]=pxc(90,40);bring(x,45,24,10+30*k,6*(1-k)+2,PURP,0.4,1-k);pxOut(c,sx,sy-8)}break}}
  // 大招：彈奏中的粉色翅膀＋五線譜帶
  const A=P&&P.act;if(isBard()&&A&&A.type==='bu'){const [ph,k]=bUltPh(A.t);const sx=SX(P.x),sy=P.y-P.h+shy;
    if(ph==='play'){const [c,x]=pxc(110,70),fl=Math.sin(t*10)*3;for(let side=-1;side<=1;side+=2)for(let j=0;j<4;j++){for(let f=0;f<4;f++){const an=(side<0?Math.PI:0)+side*(-0.5-f*0.32)+side*fl*0.02;pwedge(x,55,40,an,(36-f*4)-j*5,0.13,PINK[j],0.85)}}
      pxOut(c,sx,sy-110,0.85);
      const [c2,x2]=pxc(160,30);for(let l=0;l<5;l++){const yy=6+l*4;for(let px=0;px<160;px+=2){const w=Math.sin(px*0.08+t*6+l)*2;x2.fillStyle=rgb([[60,40,120],[120,100,220],[200,190,255]][l%3],0.75);x2.fillRect(px,Math.round(yy+w),2,2)}}
      for(let i=0;i<4;i++)pNote(x2,(t*60+i*40)%160,16+Math.sin(t*4+i)*6,i%2?PINK:BLUE5,1);pxOut(c2,sx,sy-190,0.8)}
    if(ph==='land'||ph==='leap'&&k>0.8){const [c,x]=pxc(80,30);for(let i=0;i<6;i++)bdisc(x,40-P.face*i*6,20,6-i*0.7,PURP,0.5,0.6-i*0.08);pxOut(c,sx,P.y+shy-10)}}
  // 樂想：頭上的彩色光球（剩 1.5 秒閃爍）
  if(isBard()&&P&&P.idea&&P.idea.until>t&&!P.dead){const I=P.idea,left=I.until-t;if(left>1.5||Math.floor(t*10)%2){const [c,x]=pxc(20,20),b=Math.sin(t*5)*1.5;bdisc(x,10,10+b,6,IDEA[I.c].c,1);pdot(x,8,8+b,[255,255,255],2);pxOut(c,SX(P.x),P.y-P.h-210+shy);bloom(SX(P.x),P.y-P.h-210+shy,40,IDEA[I.c].c[2],0.55)}}}
function bDrawGround(SX,shy){const s=S0,t=s.t;
  for(const e of s.fx){const age=t-e.t0;const sx=SX(e.x),sy=e.y+shy;
    if(e.k==='b_kneel'&&age<1.0){const k=Math.min(1,age/0.45),f=age<0.5?1:1-(age-0.5)/0.5;const W2=Math.round(e.rx*2/3)+20;const [c,x]=pxc(W2,60);const cols=e.song==='r'?IDEA.r.c:e.song==='g'?IDEA.g.c:e.song==='b'?IDEA.b.c:[GOLD5[1],GOLD5[2],GOLD5[3]];
      bring(x,W2/2,30,8+(W2/2-12)*k,10*(1-k)+3,cols,0.3,f);bring(x,W2/2,30,6+(W2/2-24)*k,5*(1-k)+2,PINK.slice(1),0.3,f*0.7);pxOut(c,sx,sy);
      // 彩色光柱（三層）
      for(let i=0;i<5;i++){const px=sx+(i-2)*e.rx*0.38,h=(180+60*m21H(i,21))*Math.sin(Math.min(1,age/0.3)*Math.PI*0.5)*f;X.save();X.globalCompositeOperation='lighter';
        for(const [w,j,a] of [[42,0,0.18],[24,1,0.3],[9,2,0.55]]){X.globalAlpha=a*f;X.fillStyle=rgb(cols[j]);X.fillRect(Math.round(px-w/2),Math.round(sy-h),w,Math.round(h))}X.restore()}}
    if(e.k==='b_swirl'&&age<0.7){const k=age/0.7;const [c,x]=pxc(120,44);for(let j=0;j<3;j++){bring(x,60,24,14+30*k+j*8,4,j%2?PINK.slice(1):GOLD5.slice(1,4),0.32,1-k)}
      for(let i=0;i<5;i++){const an=t*8+i*1.26,r=20+26*k;const px=60+Math.cos(an)*r,py=20+Math.sin(an)*r*0.32;x.fillStyle=rgb(BLUE5[2],1-k);x.fillRect(Math.round(px)-2,Math.round(py)-2,2,2);x.fillRect(Math.round(px)+1,Math.round(py)+1,2,2);x.fillRect(Math.round(px)+1,Math.round(py)-2,2,2);x.fillRect(Math.round(px)-2,Math.round(py)+1,2,2);pdot(x,px,py,[255,255,255])}
      pxOut(c,sx,sy-4)}}}
// ==== f_ally.js
// ---------- 詩人召喚苦達斯：從天而降、臉著地、撞擊瞬間噴出兩道特大斬風、給「戰意」 ----------
function m22SummonKudas(){const s=S0,P=s.P,t=s.t;let x=P.x+60*P.face;const lo=s.lock?s.cam+60:40,hi=s.lock?s.cam+W-60:WW-40;if(x<lo||x>hi)x=P.x;
  s.ally={x,y:P.y+2,t0:t,face:P.face,ev:{}};s.food=0;sfx('summon',0.5);sub('苦達斯 ','……哇啊啊！',1.0)}
function bigSlash(x,y,dir){S0.kbl=S0.kbl||[];S0.kbl.push({x:x+40*dir,y,dir,t0:S0.t,hit:{}})}
function allyStep(dt){const s=S0,t=s.t,A=s.ally;
  if(s.kbl){for(const b of s.kbl){const age=t-b.t0;if(age>0.62){b.dead=1;continue}b.x+=b.dir*1150*dt;
      for(const m of s.mobs){if(m.gone||m.dying||b.hit[m.id])continue;const B=m.kind==='boss';if(Math.abs(m.x-b.x)>(B?220:120)||Math.abs(m.y-b.y)>(B?140:92)||m.h>320)continue;b.hit[m.id]=1;bHit(m,'wind','kwind',1,false)}}
    s.kbl=s.kbl.filter(b=>!b.dead)}
  if(!A)return;const u=t-A.t0,P=s.P;
  if(u>=0.30&&!A.ev.imp){A.ev.imp=1;bigSlash(A.x,A.y,1);bigSlash(A.x,A.y,-1);s.fx.push({k:'crack',x:A.x,y:A.y,t0:t},{k:'ring',x:A.x,y:A.y,t0:t,col:[150,255,230],big:true});
    puff(A.x,A.y-4,20,[214,170,128],180,0.7,4);for(let j=0;j<12;j++)s.parts.push({x:A.x+U(-60,60),y:A.y-4,vx:U(-260,260),vy:-U(250,520),g:1500,life:0.75,t0:t,c:CH([[150,120,95],[190,150,110],[110,88,70]]),sz:CH([2,3]),floor:A.y+8});
    shake(9,0.3);s.hitstop=Math.max(s.hitstop,0.05);sfx('wind',0.55);sfx('clank',0.45);P.zyU=t+6;proc('戰意',[60,170,160],'戰');s.callout={t0:t,txt:'斬風 ×2'};
    s.dmg.push({t,x:A.x,y:A.y-160,v:0,label:'噗！',zero:true})}
  if(u>=0.70&&!A.ev.up){A.ev.up=1;sub('苦達斯 ','……剛剛什麼都沒發生。',1.4)}
  if(u>=1.10&&!A.ev.jp){A.ev.jp=1;sfx('jump',0.3);A.gh=[]}
  if(u>=1.10&&u<1.5&&t-(A.lg||0)>0.04){A.lg=t;const k=(u-1.1)/0.4;(A.gh=A.gh||[]).push({x:A.x-A.face*k*260,h:Math.sin(k*Math.PI*0.5)*420,t})}
  if(u>=1.5){puff(A.x-A.face*260,A.y-200,10,[236,230,250],40,0.5,3);s.ally=null;s.allyCD=t+1}}
function allyDraw(SX,shy){const s=S0,t=s.t,A=s.ally;if(!A)return;const u=t-A.t0,sx=SX(A.x),sy=A.y+shy;
  if(u<0.30){const k=u/0.30,h=480*(1-k*k);// 天上的光柱（三層青色）＋越來越大的影子
    X.save();X.globalCompositeOperation='lighter';for(const [w,c,a] of [[42,[60,170,160],0.25],[24,[120,230,210],0.35],[9,[230,255,250],0.6]]){X.globalAlpha=a*(1-k*0.5);X.fillStyle=rgb(c);X.fillRect(Math.round(sx-w/2),0,w,Math.round(sy-h))}X.restore();
    shadowE(sx,sy,20+30*k,0);spr('kudas_airdive',sx,sy-h,{flip:A.face<0,rot:-Math.round(k*4)*15*A.face,__ally:1});return}
  shadowE(sx,sy,46,0);
  if(u<0.70){spr('kudas_faceplant',sx,sy,{flip:A.face<0,__ally:1});const [c,x]=pxc(40,16);for(let i=0;i<3;i++){const an=t*5+i*2.094;m21Star(x,20+Math.cos(an)*12,8+Math.sin(an)*3.5,Math.sin(an)>0?2:1)}pxOut(c,sx-40*A.face,sy-70);return}
  if(u<1.10){spr('kudas_scramble'+(Math.floor((u-0.7)/0.1)%2),sx,sy,{flip:A.face<0,__ally:1});return}
  const k=(u-1.1)/0.4;for(const g of A.gh||[]){const a=0.3*(1-(t-g.t)/0.2);if(a>0)spr('kudas_jump',SX(g.x),sy-g.h,{flip:A.face>0,alpha:a,__ally:1,filter:'brightness(1.5) saturate(0.5)'})}
  spr('kudas_jump',SX(A.x-A.face*k*260),sy-Math.sin(k*Math.PI*0.5)*420,{flip:A.face>0,alpha:1-k*0.8,__ally:1})}
function bigcrescent(sx,sy,age,flip){if(age>0.62)return;X.save();X.translate(sx,sy);X.scale(1.9,1.9);X.translate(-sx,-sy);crescent(sx,sy,age,flip);X.restore();
  bloom(sx+(flip?-30:30),sy,170,[120,240,210],0.35*(1-age/0.62),1.4)}
window.m2Step=(o=>dt=>{o(dt);if(S0)allyStep(dt)})(window.m2Step);
window.m2Ents=(o=>(ents,SX,shy)=>{o(ents,SX,shy);const s=S0;if(s.ally)ents.push([s.ally.y,()=>allyDraw(SX,shy)]);ents.push([YMIN-200,()=>bDrawGround(SX,shy)])})(window.m2Ents);
window.drawM2Fx=(o=>(SX,shy)=>{o(SX,shy);const s=S0;if(s.kbl)for(const b of s.kbl)bigcrescent(SX(b.x),b.y-90+shy,s.t-b.t0,b.dir<0);bDrawNotes(SX,shy);bDrawFx(SX,shy)})(window.drawM2Fx);
// ==== g_hud.js
// ---------- 畫面：主角換成詩人、HUD、說明 ----------
const inPlay=()=>mode==='play'||mode==='dead';
window.spr=(o=>(n,sx,sy,op={})=>{const s=S0;
  if(op.__ally){const P=s&&s.P,g=P&&P.ghost,wk=GS.wk;if(P)P.ghost=null;GS.wk=null;try{return o(n,sx,sy,op)}finally{if(P)P.ghost=g;GS.wk=wk}}
  if(!(isBard()&&s&&s.P&&inPlay()&&n.startsWith('kudas_')&&!op.__g))return o(n,sx,sy,op);
  const P=s.P,t=s.t;if(P.ghost&&P.ghost.length){for(const g of P.ghost){const k=1-(t-g.t)/0.22;if(k<=0)continue;o(g.nm,sx+(g.x-P.x),sy+(g.y-P.y),{flip:g.f<0,alpha:0.32*k,filter:'brightness(1.6) saturate(0.6) hue-rotate(250deg)',__g:1})}P.ghost=P.ghost.filter(g=>t-g.t<0.22)}
  let nm='bh_'+bPose(P,t);if(!m21Has(nm))nm='bh_play0';let gl=null;const a=P.act;
  if(P.redU>t)gl=[255,110,90,Math.floor(46+16*Math.sin(t*6))];else if(P.blueU>t)gl=[110,160,255,Math.floor(46+16*Math.sin(t*6))];else if(P.grnU>t||P.regU>t)gl=[120,230,110,Math.floor(46+16*Math.sin(t*6))];
  if(a&&a.type==='bu')gl=[220,150,255,Math.floor(t*20)%2?220:140];if(a&&a.type==='bl'&&a.t<0.15)gl=[255,210,130,Math.floor(t*20)%2?230:150];if(P.zyU>t&&!gl)gl=[90,220,200,Math.floor(40+20*Math.sin(t*8))];
  if(P.dgIF>t)gl=[170,220,255,200];
  return o(nm,sx,sy,Object.assign({},op,{rot:0,dy:0,glow:gl}))})(window.spr);
const TMAP={'苦達斯':'尋歡作樂','苦達斯倒下了……':'尋歡作樂倒下了……','肩撞':'滑行','踱地':'跪彈',
  '方向鍵/WASD 移動　J 攻擊　K 心臟刺擊　L 大劍術　Space 跳躍　V 召喚詩人　E 互動　I 背包（暫停）　Esc 暫停':'J 連擊　K 三連音　L 旋律衝擊／旋音射擊　Shift 後跳　K+L 大招　→→ 滑行　↓↓ 跪彈　V 召喚苦達　Esc 暫停'};
let TREMAP=false;
window.T=(o=>function(s,...r){if(TREMAP&&typeof s==='string'&&TMAP[s])s=TMAP[s];return o(s,...r)})(window.T);
window.skillTile=(o=>(cx,cy,R,g,col,key,cost,...r)=>{if(TREMAP){if(g==='刺'){g='連';col=[200,70,140]}else if(g==='風'){g='衝';col=[200,150,40];cost='節奏3'}else if(g==='掃'){g='射';col=[60,110,200]}else if(g==='攻')g='擊'}return o(cx,cy,R,g,col,key,cost,...r)})(window.skillTile);
window.drawHUD=(o=>(cx0,shy)=>{const s=S0,P=s&&s.P;if(!isBard()||!P)return o(cx0,shy);const t=s.t;
  const sv=[IMG.por,IMG.bardh,IMG.bardg,s.bard];if(IMG.bardpor)IMG.por=IMG.bardpor;if(IMG.kudash)IMG.bardh=IMG.kudash;if(IMG.kudasg)IMG.bardg=IMG.kudasg;
  if(s.ally)s.bard={t0:s.ally.t0,out:s.ally.t0+1.5,buffT:1e9,in:1e9,x:-9999,y:0};TREMAP=true;
  try{o(cx0,shy)}finally{IMG.por=sv[0];IMG.bardh=sv[1];IMG.bardg=sv[2];s.bard=sv[3];TREMAP=false}
  // 額外：Shift 後跳、K+L 大招、樂想
  const B=[[810,'後跳','Shift',P.dgCD||0,BD.dg,null]];for(const [x,l,k,cd,mx] of B){const y=604,r=24,rdy=cd<=0;circ(x,y,r,rdy?'rgba(40,60,90,0.92)':'rgba(30,24,20,0.85)',rdy?'rgb(170,220,255)':'rgb(120,100,80)',3);
    if(!rdy){X.save();X.beginPath();X.moveTo(x,y);X.arc(x,y,r-3,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,cd/mx));X.closePath();X.fillStyle='rgba(0,0,0,0.55)';X.fill();X.restore()}
    T(l,x,y-2,FS(15),rdy?[255,244,214]:[170,160,150],2,[0,0,0],'mm');T(k,x,y+r+6,FN(11),[220,210,190],2,[0,0,0],'mm')}
  skillTile(1070,524,22,'交',[150,60,200],'K+L','節奏5',P.rh<RHMAX||(P.ultCD||0)>0,s.denyU||-9,Math.max(0,(P.ultCD||0)/BD.ult),null);   // W2.3：改回舊版
  {const x=748,y=604,I=P.idea&&P.idea.until>t?P.idea:null;circ(x,y,24,'rgba(20,14,20,0.9)',I?rgb(IDEA[I.c].c[2]):'rgb(120,100,80)',3);
    if(I){const [c,xx]=pxc(16,16);bdisc(xx,8,8,6,IDEA[I.c].c,1);pdot(xx,6,6,[255,255,255],2);pxOut(c,x,y);arc(x,y,21,-90,-90+360*(I.until-t)/BD.ideaHold,rgb(IDEA[I.c].c[1]),3)}else T('♪',x,y,FS(18),[150,140,130],2,[0,0,0],'mm');
    T('樂想',x,y+30,FN(11),[220,210,190],2,[0,0,0],'mm')}
  // buff 圖示
  let bx=124;const bf=[];if(P.redU>t)bf.push(['紅',[190,50,50],P.redU]);if(P.blueU>t)bf.push(['藍',[50,90,200],P.blueU]);if(P.grnU>t||P.regU>t)bf.push(['綠',[50,150,60],Math.max(P.grnU||0,P.regU||0)]);if(P.zyU>t)bf.push(['戰',[40,150,140],P.zyU]);if(P.ctrU>t)bf.push(['反',[200,90,40],P.ctrU]);
  for(const [g,col,u] of bf){rrect(bx,160,bx+24,184,5,rgb(col),'rgb(255,240,220)',2);T(g,bx+12,172,FS(15),[255,255,255],2,[10,20,50],'mm');T(Math.ceil(u-t)+'',bx+23,186,FN(10),[255,255,255],2,[0,0,0],'rb');bx+=30}})(window.drawHUD);
window.drawDead=(o=>(...a)=>{TREMAP=isBard();try{return o(...a)}finally{TREMAP=false}})(window.drawDead);
// 說明頁：Tab 切換角色
const MAN={p:0};
window.drawManual=(o=>()=>{if(press(['Tab'])||press(['ArrowRight'])||press(['ArrowLeft']))MAN.p^=1;if(!MAN.p){o();T('Tab／←→：看尋歡作樂的操作',1160,64,FN(14),[255,210,140],2,[0,0,0],'rm');return}
  X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.35;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
  rrect(100,26,1180,700,14,'rgba(16,10,8,0.92)',rgb(GOLDC),3);T('操作說明・尋歡作樂（吟遊詩人）',640,64,FS(30),[255,236,200],4,[60,20,10],'mm');
  const rows=[['攻擊','J 連按＝4 段，第 4 下「調音敲擊」（鏗！）；空中 J＝音符射擊（紅色樂想時 2 發）'],['三連音','K：節奏 2，連發三個音圈（越來越大），第 3 個緩速 50%'],
    ['旋律衝擊','L：節奏 ≥3，衝刺旋轉＋把敵人打飛；不足＝旋音射擊（會彈到 2 個敵人，冷卻 2.2 秒）'],['跪地滑行','同方向連按兩下：滑過去絆倒敵人 1.2 秒（冷卻 3.5 秒）；強化每 +3 遠 8%、每 +5 多 1 段'],
    ['跪地彈奏','↓ 連按兩下：震地緩速；帶著樂想會變成彩色樂曲（紅 勇猛讚歌／藍 反擊序曲／綠 希望之歌）'],['後跳閃避','Shift：往後跳，有無敵時間；剛好躲過攻擊＝完美閃避（哎唷～）：節奏 +1、送一個樂想、冷卻重置'],
    ['戰鬥交響曲','K+L 一起按：節奏 5，3.2 秒無敵大招，最後全場倒地；放完再無敵 0.5 秒'],['樂想','K／L／滑行／跪彈打中時得到（紅 攻速移速、藍 傷害範圍、綠 回血），下一招自動用掉'],
    ['召喚苦達','V：食物 3/3 時苦達從天而降、臉著地噴出兩道特大斬風，給你「戰意」（6 秒內被打 4 下才倒地）'],['比較脆','HP 3,300、被打 3 下就倒地；倒地瞬間按 Space＝受身翻起'],['其他','E 互動　I 背包　Esc 暫停　M 靜音　F9 錄影（變身藥水只有苦達斯能用）']];
  rows.forEach(([a,b],i)=>{const y=124+i*38;T(a,150,y,FS(17),[255,244,214],2,[0,0,0],'lm');for(const [j,l] of wrapT(b,FN(15),820).entries())T(l,310,y+j*18,FN(15),[235,230,220],2,[0,0,0],'lm')});
  T('Tab／←→：看苦達斯的操作　　Esc / Enter 回標題',640,668,FS(18),[255,255,255],3,[0,0,0],'mm')})(window.drawManual);
// AUTO（測試用）
window.aiThink=(o=>()=>{o();if(!isBard())return;const s=S0,P=s.P,t=s.t;AI.dodge=0;AI.ult=0;AI.sum=s.food>=FOOD_MAX&&!s.ally&&t>(s.allyCD||0)?1:0;
  const ms=s.mobs.filter(m=>!m.dying&&!m.gone&&m.kind!=='pillar'&&Math.abs(m.x-s.cam-640)<640);
  if(ms.some(m=>m.wind>0&&Math.abs(m.x-P.x)<150&&Math.abs(m.y-P.y)<34)&&(P.dgCD||0)<=0&&Math.random()<0.4){AI.dodge=1;AI.atk=0}
  if(P.rh>=RHMAX&&(P.ultCD||0)<=0&&ms.filter(m=>Math.abs(m.x-P.x)<360).length>=1){AI.ult=1;AI.skill=0;AI.stab=0}
  else if(P.rh>=2&&P.rh<3&&ms.some(m=>Math.abs(m.y-P.y)<24&&(m.x-P.x)*P.face>0&&(m.x-P.x)*P.face<300)&&Math.random()<0.05)AI.stab=1})(window.aiThink);
