'use strict';
// ===== M2：關卡地圖・難度・存檔・裝備・背包・強化（搗蛋鬼／貓商人）・抽裝備・第四關水晶監視者 =====
// 所有數字都是「暫定」（企劃書 v0.5）
// ---------- difficulty / stages ----------
// M2.1：菁英以上大幅加難（spd 敵人移動/出手速度、xm 每波多幾隻、tele 預警圈時間、wb 一般/優良權重）＋獎勵提高
const DIFFS=[{n:'普通',hp:1,dmg:1,cd:1,drop:0,pur:2,gold:1},{n:'困難',hp:1.6,dmg:1.3,cd:0.92,drop:0.10,pur:3,gold:1.2},{n:'菁英',hp:4.2,dmg:2.3,cd:0.76,drop:0.45,pur:7,gold:2.2,spd:1.12,xm:1,tele:1,wb:[44,32],sh:1},
  {n:'地獄',hp:7.5,dmg:3.2,cd:0.66,drop:0.75,pur:11,gold:3.2,spd:1.22,xm:2,tele:0.86,wb:[30,34],sh:2},{n:'深淵',hp:12.5,dmg:4.3,cd:0.56,drop:1.10,pur:16,gold:4.6,spd:1.32,xm:3,tele:0.74,wb:[18,34],sh:3}];
const RUN={st:1,d:0};const DIF=()=>DIFFS[RUN.d]||DIFFS[0];
// 關卡清單（資料驅動：插入、換順序只改這裡；存檔用 id 記，不用位置）
const STG=[null,
  {id:'canyon',t:'赤岩峽谷',start:'canyon',x:430,en:'RED ROCK CANYON',tier:[0,1],endOn:'mine',bg:'world',col:'rgb(150,80,40)'},
  {id:'s2',t:'灰色荒野（暫定）',start:'s2',x:430,en:'PLACEHOLDER',tier:[1,2],bg:'world',col:'rgb(70,70,64)'},
  {id:'mine',t:'赤岩礦坑・女神的試煉',start:'mine',x:200,en:'RED ROCK MINE',tier:[2,4],bg:'bossroom',col:'rgb(110,40,36)'},
  {id:'spider',t:'巴里2礦區・2層1區',start:'sp1',x:200,en:'BARRI MINE 2',tier:[3,4],bg:'sp_nest',col:'rgb(60,80,50)'},
  {id:'crystal',t:'巴里地下城・水晶監視者',start:'b4mine',x:200,en:'BARRI DUNGEON',tier:[4,5],hiBoost:true,bg:'b4room',col:'rgb(40,60,110)'}];
const NST=STG.length-1,CNUM='一二三四五六七八九十';STG.forEach((g,i)=>{if(g)g.n='第'+CNUM[i-1]+'關'});
// 隱藏的賺錢關卡：通關後 30% 出現（不在地圖上）
const BONUS={id:'money',n:'隱藏關卡',t:'萊比地下城・理查宅邸 III',start:'ms1',x:160,en:'RICHARD MANSION III',tier:[1,3],bg:'ms_glass',chance:0.30};
const STGD=()=>RUN.bonus?BONUS:(STG[RUN.st]||STG[1]);
const CL=i=>(SAVE.clear[STG[i]?STG[i].id:i]||0),setCL=(i,v)=>{SAVE.clear[STG[i].id]=v};
const DS=i=>(SAVE.dsel[STG[i].id]||0),setDS=(i,v)=>{SAVE.dsel[STG[i].id]=v};
const stIdx=id=>Math.max(1,STG.findIndex(g=>g&&g.id===id));
const YBAND={canyon:[440,612],s2:[440,612],ms1:[476,640],ms2:[486,648],sp1:[500,640],sp2:[500,640],sp3:[500,640],spb:[488,650]};
const MUSIC={canyon:'bgm',s2:'m_s2',mine:'m_mine',shrine:'m_shrine',boss:'m_mine',sp:'m_mine',b4mine:'m_b4',b4boss:'m_b4',ms1:'m_money',ms2:'m_money',sp1:'m_mine',sp2:'m_mine',sp3:'m_mine',spb:'m_b4'};
const M2MUS=['m_s2','m_mine','m_shrine','m_b4','m_shop','m_money'];
function m2Music(n){if(!n||n===CURM&&MG[n])return;musStop(CURM,0.8);CURM=n;musPlay(n,BGMV,0.8,true)}
// ---------- gear tables ----------
const WPN=[['雙手巨劍',26,34],['巨刃',34,43],['雙手剩刀',43,53],['灰岩重劍',53,65],['雙手巨劍S',65,77],['巨刃S',77,92],['雙手剩刀S',92,107],['灰岩重劍S',107,126],['雙手巨劍SS',126,145]];
const ARM=[['旅人皮甲',2,3],['礦工護甲',3,5],['赤岩鎖甲',5,7],['水晶板甲',7,9],['監視者重甲',9,12]]; // 受到傷害 -%
const ACC=[['銅戒指',1,2],['銀耳環',2,3],['赤晶項鍊',3,4],['水晶護符',4,5],['監視者之眼',5,7]];   // 暴擊率 +%（舊表，只給存檔轉換用）
// M2.1：六個裝備欄。舊「防具＋飾品」的總預算拆給 5 欄（不是加上去）：防禦系 0.50+0.25+0.20=0.95×舊防具、攻擊系 0.65 暴擊＋0.5 技能傷害×舊飾品
const SLOTS=[['w','武器'],['b','衣服'],['p','褲子'],['s','鞋子'],['r','戒指'],['n','項鍊']];const SLOTN=Object.fromEntries(SLOTS);const ARMS=['b','p','s','r','n'];
const SC={b:0.5,p:0.25,s:0.2,r:0.65,n:0.5};const LSC=0.4;   // 主屬性 = 舊表 × SC；副詞條 = 武器詞條 × 0.4
const GNM={b:['旅人布衣','礦工皮衣','赤岩鎖衣','水晶胸甲','監視者重鎧'],p:['旅人長褲','礦工護腿','赤岩鎖褲','水晶腿甲','監視者腿鎧'],s:['旅人短靴','礦工釘靴','赤岩戰靴','水晶輕靴','監視者疾靴'],
  r:['銅戒指','銀戒指','赤晶戒指','水晶戒指','監視者之戒'],n:['皮繩墜飾','銀項鍊','赤晶項鍊','水晶護符','監視者之眼']};
const GEAR={};for(const t of ARMS){const base=(t==='r'||t==='n')?ACC:ARM;GEAR[t]=GNM[t].map((n,k)=>[n,Math.round(base[k][1]*SC[t]*10)/10,Math.round(base[k][2]*SC[t]*10)/10])}
const GSUB={p:['抗倒地',[[8,12],[10,15],[12,18],[15,22],[18,26]]],s:['移動速度',[[2,3],[3,4],[4,5],[5,6],[6,8]]],n:['節奏加成',[[3,5],[4,6],[5,8],[6,10],[8,12]]]};
const GMAIN={b:['受到傷害','-'],p:['受到傷害','-'],s:['閃避','+'],r:['暴擊率','+'],n:['技能傷害','+']};
const runeCls=t=>t==='w'?'w':(t==='b'||t==='p')?'a':(t==='r'||t==='n')?'c':(Math.random()<0.5?'a':'c');
const RAR=[{n:'一般',st:'',sc:1,ln:0,el:0,col:[236,236,236],fr:[130,130,130],bg:[60,60,66],w:60,sell:60,sh:1},
  {n:'高級',st:'★',sc:1.05,ln:1,el:0.05,col:[130,235,110],fr:[70,190,60],bg:[24,70,30],w:28,sell:160,sh:2},
  {n:'稀有',st:'★2',sc:1.10,ln:1,el:0.07,col:[120,190,255],fr:[50,120,235],bg:[20,44,96],w:7,sell:400,sh:4},
  {n:'稀有',st:'★3',sc:1.15,ln:2,el:0.09,col:[120,190,255],fr:[60,140,255],bg:[22,50,110],w:3,sell:700,sh:4},
  {n:'英雄',st:'★4',sc:1.20,ln:3,el:0.12,col:[210,140,255],fr:[150,80,235],bg:[56,24,96],w:2,sell:1500,sh:8}];
const LINES=[['crit','暴擊率',2,5],['cdmg','暴擊傷害',5,15],['zj','追擊機率',2,5],['boss','對首領傷害',3,8],['aspd','攻擊速度',3,6]];
const ELS={'火焰':[255,130,60],'冰霜':[140,215,255],'閃電':[255,236,90],'神聖':[255,246,200]};
const ELDESC={'火焰':'命中灼傷 3 秒','冰霜':'緩速 30%（2 秒）','閃電':'追加 50% 雷擊跳到附近 1 隻','神聖':'對柱子、石碑傷害 +30%'};
// 符文（刻印）: [可出現的欄位, 說明, 數值(紫/藍/綠), 'j'=搞笑符文]。w武器 b衣服 p褲子 s鞋子 r戒指 n項鍊
const RUNES={
  '千把劍':['w',v=>`命中 ${v}% 落下劍雨`,[7,5,3]],'旋轉':['wn',v=>`J 普攻 ${v}% 多砍一下（也累積節奏）`,[20,15,10]],
  '破甲':['w',v=>`對首領傷害 +${v}%`,[8,6,4]],'雷擊':['w',v=>`命中 ${v}% 追加落雷（50% 傷害）`,[6,4,2.5]],
  '疾風':['s',v=>`移動速度 +${v}%`,[6,4,2.5]],'幻影':['s',v=>`閃避 +${v}%`,[3,2,1.2]],'殘像':['s',v=>`閃避成功後 2 秒攻擊速度 +${v}%`,[15,10,6]],'輕快步伐':['sn',v=>`肩撞（→→）和踱地（↓↓）冷卻 −${v}%`,[15,10,6]],
  '絢爛':['r',v=>`暴擊 +${v[0]}%、暴擊傷害 +${v[1]}%`,[[7,21],[5,15],[3,9]]],'火炬':['r',v=>`打灼傷中的敵人暴擊 +${v}%`,[7,5,3]],'銳眼':['r',v=>`暴擊率 +${v}%`,[3,2,1.2]],'致命':['r',v=>`追擊機率 +${v}%`,[5,3.5,2]],
  '彈力':['n',v=>`大地橫掃命中 ${v}% 多 +1 節奏`,[20,15,10]],'魔力激流':['n',v=>`放技能後攻擊 +${v}%，最多 4 層（5 秒）`,[2.5,1.8,1]],'律動':['n',v=>`放技能後 ${v}% 返還 1 節奏`,[25,18,10]],'詠唱':['n',v=>`技能傷害 +${v}%`,[6,4,2.5]],
  '乾涸之地':['b',v=>`HP < 50% 傷害 +${v[0]}%、追擊 +${v[1]}%`,[[6,4],[4.5,3],[2.5,2]]],'堅韌':['bp',v=>`受到傷害 -${v}%`,[3,2,1.2]],'反擊':['b',v=>`被打時 ${v}% 震開身邊敵人並暈眩 0.8 秒`,[12,8,5]],'活力':['bp',v=>`每 10 秒回復 ${v}% HP`,[1.5,1,0.6]],
  '磐石':['p',v=>`抗倒地 +${v}%`,[15,10,6]],'根性':['p',v=>`被打倒時立刻回復 ${v}% HP`,[8,5,3]],
  // 搞笑符文（約 6% 的符文是這些）：好笑、有一點點用、不會破壞平衡
  '嚇破膽':['wn',v=>`命中 ${v}% 讓敵人嚇到亂跑 1 秒（不會出手）`,[4,3,2],'j'],'變羊術':['wr',v=>`命中 ${v}% 把敵人變成羊 2 秒（不能攻擊、照常受傷；首領免疫）`,[2,1.5,1],'j'],
  '變鼠術':['rn',v=>`命中 ${v}% 把敵人變成老鼠 1.5 秒（首領免疫）`,[2.5,2,1.5],'j'],'噗噗褲':['ps',v=>`走路會放屁，移動速度 +${v}%`,[3,2,1],'j'],
  '吱吱鞋':['s',v=>`走路吱吱叫，閃避 +${v}%`,[1,0.7,0.4],'j'],'臭襪子':['sp',v=>`敵人倒下 ${v}% 掉一隻臭襪子（撿起來 +30 金幣）`,[4,3,2],'j'],
  '跳跳金':['sn',v=>`每次跳躍 +${v} 金幣`,[3,2,1],'j'],'話癆':['nb',v=>`苦達斯偶爾講冷笑話，講完下一擊 +${v}%`,[30,20,10],'j'],
  '香蕉皮':['bp',v=>`被打時 ${v}% 在腳下丟香蕉皮，踩到的敵人滑倒`,[15,10,6],'j'],'噴嚏':['bn',v=>`偶爾打個噴嚏（沒有任何用處）`,[0,0,0],'j'],'大影子':['bps',v=>`影子變大一點（沒有任何用處）`,[0,0,0],'j']};
const JOKE_P=0.06;
function rollRune(t){const j=Math.random()<JOKE_P;const names=Object.keys(RUNES).filter(n=>RUNES[n][0].includes(t)&&(RUNES[n][3]==='j')===j);return RCH(names.length?names:Object.keys(RUNES).filter(n=>RUNES[n][0].includes(t)))}
const RUNEC=[[200,130,255],[120,190,255],[130,235,110]],RUNEG=['紫','藍','綠'];
// enhancement: [rate%, pity, gold, shards]
const ENH=[null,[100,0,1000,0],[100,0,1000,0],[100,0,1000,0],[100,0,1000,0],[100,0,1000,0],[100,0,1000,0],[80,2,2000,1],[40,4,3000,1],[20,7,4500,1],[10,12,6000,1],
  [5,18,8000,2],[3,25,10000,2],[3,25,13000,2],[3,25,16000,3],[1,40,20000,3]];
const NPCS={prank:{name:'搗蛋鬼',gold:1,rate:0,line:[['只要用力敲打樹木就行咧！超簡單強化咧！你要幫忙咧？',null]],img:'npc_prank',big:'npc_prank_big'},
  cat:{name:'貓商人',gold:0.7,rate:2,line:[['要用',null],['金幣',[255,160,40]],['強化喵？我是奶油桂花手喵。',null]],img:'npc_cat',big:'npc_cat'}};
const NPC_P={prank:0.15,cat:0.05};
const DRAW_COST=3000,DRAW_MAX=5,DRAW_ODDS=[[1,70],[2,18],[3,8],[4,4]];
// ---------- save ----------
let SAVE=null;
function newSave(){const s={v:4,gold:0,shards:0,inv:[],eq:{w:0,b:0,p:0,s:0,r:0,n:0},clear:{},uid:1,dsel:{},sel:'canyon',gems:0,slot:{e:0,pity:{}},opt:{mus:1,sfx:1},pots:0,pots2:0,tf:0,npcSeen:0};
  const w=mkItem('w',0,0,s);w.v=30;s.inv.push(w);s.eq.w=w.id;return s}
function m2Save(){if(!SAVE)return;SAVE.ts=Date.now();const j=JSON.stringify(SAVE);try{localStorage.setItem('m2save',j)}catch(e){}
  try{fetch('save',{method:'POST',body:j,cache:'no-store'}).catch(()=>{})}catch(e){}}
// v2（陣列、4 關）→ v3（用關卡 id）。舊第四關＝水晶監視者，新第四關（蜘蛛）沒打過也能直接選第五關
function migrate(S){if(S.v===2){const c=S.clear||[],d=S.dsel||[];const ids=[null,'canyon','s2','mine','crystal'];S.clear={};S.dsel={};
    for(let i=1;i<=4;i++){if(c[i])S.clear[ids[i]]=c[i];if(d[i])S.dsel[ids[i]]=d[i]}S.sel=ids[S.sel]||'canyon';S.v=3}
  if(!S.clear||Array.isArray(S.clear))S.clear={};if(!S.dsel||Array.isArray(S.dsel))S.dsel={};if(typeof S.sel!=='string')S.sel='canyon';S.gems=S.gems||0}
async function m2Load(){let a=null,b=null;try{const r=await fetch('load',{cache:'no-store'});if(r.ok)a=await r.json()}catch(e){}
  try{const j=localStorage.getItem('m2save');if(j)b=JSON.parse(j)}catch(e){}
  if(Q.get('fresh')==='1'){a=b=null}
  SAVE=m21Pick(a,b)||newSave();migrate(SAVE);m21Migrate(SAVE);
  m2Save();if(Q.get('rich')==='1'){SAVE.gold=Math.max(SAVE.gold,250000);SAVE.shards=Math.max(SAVE.shards,60);SAVE.clear={canyon:3,s2:3,mine:3,spider:3,crystal:1}}
  calcGS();buildTints()}
addEventListener('pagehide',()=>{if(!SAVE)return;try{const j=JSON.stringify(typeof m27Park==='function'?m27Park(SAVE):SAVE);localStorage.setItem('m2save',j);navigator.sendBeacon&&navigator.sendBeacon('save',new Blob([j],{type:'application/json'}))}catch(e){}});
function m2Assets(){return ['b4mine','b4room','b4_stone','b4_stele','npc_prank','npc_prank_big','npc_cat',...Object.keys(B4A).map(k=>'b4_'+k),...META.names.filter(n=>n.startsWith('kudas')).map(n=>'m_'+n)]}
// ---------- items ----------
const RR=(a,b)=>a+(b-a)*Math.random(),RRI=(a,b)=>Math.floor(RR(a,b+1)),RCH=a=>a[Math.floor(Math.random()*a.length)];
function baseOf(it){return it.t==='w'?WPN[it.k]:GEAR[it.t]?GEAR[it.t][it.k]:it.t==='a'?ARM[it.k]:ACC[it.k]}
function itName(it){return baseOf(it)[0]}
function mkItem(t,k,r,sv){sv=sv||SAVE;const it={id:sv.uid++,t,k,r,e:0,pity:{},lines:[],el:null,rune:null};const [n,lo,hi]=baseOf(it);const R=RAR[r];
  if(t==='w'){const a=lo*R.sc*(r===4?1.1:1),b=hi*R.sc;it.lo=Math.round(a);it.hi=Math.round(b);it.v=0}
  else{it.v=Math.round(RR(lo,hi)*R.sc*10)/10;if(GSUB[t]){const [a2,b2]=GSUB[t][1][k];it.v2=Math.round(RR(a2,b2)*R.sc*10)/10}}
  const pool=LINES.filter(l=>!((t==='c'||t==='r')&&l[0]==='crit'));const ls=t==='w'?1:LSC;for(let i=0;i<R.ln&&pool.length;i++){const j=Math.floor(Math.random()*pool.length);const [id,nm,a,b]=pool.splice(j,1)[0];it.lines.push([id,Math.max(0.1,Math.round(RR(a,b)*ls*10)/10)])}
  if(r>=1&&t==='w')it.el=RCH(Object.keys(ELS));
  // runes ride on the gear: 綠 30% 綠符文、藍 60% 藍以下、紫 必帶（紫 40%、藍 60%）
  const wq=t==='w'?1:0.6;let g=-1;if(r===1&&Math.random()<0.3*wq)g=2;else if((r===2||r===3)&&Math.random()<0.6*wq)g=Math.random()<0.5?1:2;else if(r===4&&Math.random()<(t==='w'?1:0.7))g=Math.random()<0.4?0:1;
  if(g>=0)it.rune={n:rollRune(t),g}
  return it}
function effE(it){return it&&it.t==='w'&&SAVE&&SAVE.slot&&SAVE.eq.w===it.id?SAVE.slot.e:0}
function wRange(it,e){const p=enhAtk(e!=null?e:effE(it));return [Math.round(it.lo*(1+p)),Math.round(it.hi*(1+p))]}
function enhAtk(e){return 0.03*e+(e>10?0.01*(e-10):0)}
function enhCdmg(e){return e>10?0.02*(e-10):0}
function enchOf(e){return e>=15?[5,40]:e>=14?[4,35]:e>=13?[3,30]:null}
function rollRar(minR=0){const p=DIF().pur,wb=DIF().wb||[60,28],up=DIF().sh?1+DIF().sh*0.5:1;const ws=[[0,wb[0]],[1,wb[1]],[2,7*up],[3,3*up],[4,p]].filter(x=>x[0]>=minR);let tot=ws.reduce((a,b)=>a+b[1],0),r=Math.random()*tot;for(const [k,w] of ws){if((r-=w)<0)return k}return 0}
function rollDrop(minR=0){const st=STGD();let [lo,hi]=st.tier;if(st.hiBoost)hi=Math.min(8,hi+RUN.d);else if(RUN.d>=2)hi=Math.min(8,hi+1);
  const t=Math.random()<0.6?'w':RCH(ARMS);let k=RRI(lo,hi);if(t!=='w')k=Math.min(4,Math.floor(k*4/8+0.5));return mkItem(t,k,rollRar(minR))}
function invItem(id){return SAVE.inv.find(i=>i.id===id)||null}
const eqItem=sl=>invItem(SAVE.eq[sl]);
function isEq(it){return SAVE.eq[it.t]===it.id}
function sellPrice(it){return Math.round(RAR[it.r].sell*(1+it.k*0.35)*(it.t==='w'?1:0.75)/10)*10}
// ---------- derived stats ----------
let GS={wm:1,lo:26,hi:34,crit:0,cdmg:0,zj:0,boss:0,aspd:0,def:0,dodge:0,ms:0,kdr:0,skd:0,rhy:0,spin:0,bounce:0,rain:0,flow:0,dry:[0,0],torch:0,el:null,elp:0,ench:null,wk:0};
function calcGS(){const g={wm:1,lo:26,hi:34,crit:0,cdmg:0,zj:0,boss:0,aspd:0,def:0,dodge:0,ms:0,kdr:0,skd:0,rhy:0,spin:0,bounce:0,rain:0,flow:0,dry:[0,0],torch:0,el:null,elp:0,ench:null,wk:0};
  const RA=runeActive();for(const [sl] of SLOTS){const it=eqItem(sl);if(!it)continue;
    for(const [id,v] of it.lines)g[id]+=v/100;
    if(sl==='w'){[g.lo,g.hi]=wRange(it);g.cdmg+=enhCdmg(SAVE.slot.e);g.ench=enchOf(SAVE.slot.e);g.wk=it.k;if(it.el){g.el=it.el;g.elp=RAR[it.r].el}}
    if(sl==='b'||sl==='p')g.def+=it.v/100;if(sl==='s')g.dodge+=it.v/100;if(sl==='r')g.crit+=it.v/100;if(sl==='n')g.skd+=it.v/100;
    if(sl==='p')g.kdr+=(it.v2||0)/100;if(sl==='s')g.ms+=(it.v2||0)/100;if(sl==='n')g.rhy+=(it.v2||0)/100;
    if(it.rune&&RUNES[it.rune.n]){const R=RUNES[it.rune.n],v=R[2][it.rune.g];const n=it.rune.n;
      if(n==='千把劍')g.rain+=v/100;if(n==='旋轉')g.spin+=v/100;if(n==='彈力')g.bounce+=v/100;if(n==='絢爛'){g.crit+=v[0]/100;g.cdmg+=v[1]/100}
      if(n==='魔力激流')g.flow+=v/100;if(n==='乾涸之地'){g.dry[0]+=v[0]/100;g.dry[1]+=v[1]/100}if(n==='火炬')g.torch+=v/100;
      const add={'破甲':'boss','雷擊':'thun','疾風':'ms','幻影':'dodge','殘像':'aftr','輕快步伐':'mvcd','銳眼':'crit','致命':'zj','律動':'rhret','詠唱':'skd','堅韌':'def','反擊':'ctr','活力':'regen','磐石':'kdr','根性':'grit',
        '嚇破膽':'fear','變羊術':'sheep','變鼠術':'mouse','噗噗褲':'ms','吱吱鞋':'dodge','臭襪子':'sock','跳跳金':'jgold','話癆':'talk','香蕉皮':'ban'}[n];
      if(add)g[add]=(g[add]||0)+(n==='跳跳金'?v:v/100);if(R[3]==='j')(g.jk=g.jk||{})[n]=1}}
  g.wm=0.6+0.4*((g.lo+g.hi)/2)/30;g.def=Math.min(0.6,g.def);g.dodge=Math.min(0.25,g.dodge);g.kdr=Math.min(0.8,g.kdr);g.mvcd=Math.min(0.5,g.mvcd||0);GS=g}
// 符文：武器符文照算；其他欄位「防具類(a)」「飾品類(c)」各只取最好的一顆、同名不疊加（＝舊版 1 防具 + 1 飾品 的上限）
function runeActive(){const on=new Set();for(const [t] of SLOTS){const it=eqItem(t);if(it&&it.rune)on.add(it.id)}return on}
// ---------- combat hooks ----------
function m2Crit(m){return GS.crit+(m.burnU>S0.t?GS.torch:0)}
function m2Zj(){return GS.zj+(S0.P.hp<HPMAX/2?GS.dry[1]:0)}
function m2Dmg(v,m,mv,crit){if(mv==='pet')return v;const s=S0,t=s.t;const atk=U(GS.lo,GS.hi);let k=0.6+0.4*atk/30;
  if(s.flow&&t<s.flow.until)k*=1+GS.flow*s.flow.n;if(crit)k*=1+GS.cdmg;if(m.kind==='boss')k*=1+GS.boss;if(s.P.hp<HPMAX/2)k*=1+GS.dry[0];
  if(m.kind==='pillar'&&GS.el==='神聖')k*=1.3;
  if(GS.ench&&t>=(s.enchCD||0)&&rnd()<GS.ench[0]/100){s.enchCD=t+10;k*=1+GS.ench[1]/100;proc('賦魔',[230,120,40],'魔')}
  return Math.round(v*k)}
function m2Act(type){const s=S0;if(['wind','slam','stab'].includes(type)&&GS.flow>0){const n=s.flow&&s.t<s.flow.until?Math.min(4,s.flow.n+1):1;s.flow={n,until:s.t+5}}}
function dmgNum(m,v,label,dy,col){const s=S0;s.dmg.push({t:s.t,x:m.x+U(-10,10),y:(m.kind==='boss'?m.y-m.h-330:m.kind==='pillar'?m.y-250:m.y-m.h-150)-dy,v,crit:!!label,label,zj:false,pet:false})}
function applyDmg(m,v){if(m.gone||m.dying)return;m.hp-=v;statHit(v,false,false);if(m.hp<=0&&!m.dying)mobDie(m)}
function m2OnHit(m,mv,v,crit,hy){const s=S0,t=s.t;if(mv==='pet')return;
  if((m.kind==='sword'||m.kind==='bow')&&m.hp<m.hpmax*0.3&&!m.lowSaid){m.lowSaid=1;m2Say(m,0.25)}
  if(m.kind==='boss'&&s.boss&&s.boss.b4&&!s.boss.atk&&['slam','wind','stab','air'].includes(mv))s.boss.hitT=t;
  if(GS.el&&rnd()<GS.elp){const e=GS.el;
    if(e==='火焰'){m.burnU=t+3;m.burnN=t+0.5;m.burnV=Math.max(1,Math.round(v*0.06));proc('灼傷',ELS[e],'火')}
    else if(e==='冰霜'){m.slowU=t+2;proc('冰霜',ELS[e],'冰')}
    else if(e==='閃電'){const o=s.mobs.filter(o=>o!==m&&!o.gone&&!o.dying&&o.kind!=='boss'&&Math.abs(o.x-m.x)<360&&Math.abs(o.y-m.y)<120).sort((a,b)=>Math.abs(a.x-m.x)-Math.abs(b.x-m.x))[0];
      if(o){const v2=Math.round(v*0.5);s.fx.push({k:'bolt',x0:m.x,y0:m.y-80,x1:o.x,y1:o.y-80,t0:t});setTimeout0(0.08,()=>{dmgNum(o,v2,'雷擊',30);applyDmg(o,v2)});proc('閃電',ELS[e],'雷')}}}
  if(GS.rain>0&&rnd()<GS.rain){const v2=Math.round(v*0.6);s.fx.push({k:'rain2',x:m.x,y:m.y,t0:t,big:m.kind==='boss'});proc('千把劍',[200,210,255],'劍');
    setTimeout0(0.28,()=>{if(m.kind==='boss'&&bossShielded())return;const vv=m.kind==='boss'&&b4Prot()?Math.round(v2*0.2):v2;dmgNum(m,vv,'劍雨',40);applyDmg(m,vv);registerHit(vv)})}}
function m2Spin(tg){const s=S0;proc('旋轉',[255,190,90],'旋');setTimeout0(0.1,()=>{let n=0;for(const m of tg){if(m.gone||m.dying)continue;hitMob(m,'sw',{multi:false});n++}if(n)s.P.rh=Math.min(RHMAX,s.P.rh+1)})}
// knockdown: 非攻擊中被打 5 下倒地 1 秒 + 起身無敵 1 秒；自己出招或 2.5 秒沒被打歸零
function m2Hurt(v,x){const s=S0,P=s.P,t=s.t;if(t<(P.invU||0))return 0;v=Math.round(v*DIF().dmg*(1-GS.def));
  if(!P.act){P.flashT=t+0.08;const d=(x!=null&&x>P.x)?-1:1;P.x=clamp(P.x+12*d,30,WW-30);
    if(t-(P.lastHurt||-9)>2.5)P.hc=0;P.hc=(P.hc||0)+1;
    if(P.hc>=5){P.hc=0;P.downU=t+1.0;P.invU=t+2.0;P.h=0;P.vh=0;proc('倒地',[110,110,130],'倒')}}
  P.lastHurt=t;return v}
const m2Down=()=>S0&&S0.t<(S0.P.downU||0);
function m2Blink(){const s=S0,P=s.P;return s.t<(P.invU||0)&&!m2Down()?(Math.floor(s.t*14)%2?0.35:1):1}
// ---------- mutterings ----------
const MUT=['咕……嚕……','入侵者……排除……','別過來！'];
function m2Say(m,p){const s=S0,t=s.t;if(m.kind!=='sword'&&m.kind!=='bow')return;if(t<(m.sayCD||0)||rnd()>=p)return;if(s.mobs.filter(o=>o.sayU>t&&!o.gone).length>=2)return;m.say=CH(MUT);m.sayU=t+2;m.sayCD=t+6}
function m2MobSay(cx0,shy){const s=S0,t=s.t;for(const m of s.mobs){if(!(m.sayU>t)||m.gone||m.dying)continue;const x=Math.round(m.x-cx0),y=Math.round(m.y-m.h+shy-178);const f=FS(16),w=tw(m.say,f)+24;
  const a=Math.min(1,(m.sayU-t)/0.25);X.save();X.globalAlpha=a;rrect(x-w/2,y-16,x+w/2,y+16,10,'rgba(255,253,245,0.96)','rgb(70,50,40)',2);quad([[x-8,y+15],[x+4,y+15],[x-6,y+27]],'rgba(255,253,245,0.96)');T(m.say,x,y+1,f,[60,40,30],0,[0,0,0],'mm');X.restore()}}
// ---------- drops / gold ----------
function lootPush(k,m,extra){const s=S0;s.loot.push(Object.assign({k,x:m.x+U(-10,10),y:m.y-40,gy:clamp(m.y+U(-14,14),YMIN,YMAX),vx:U(-170,170),vy:-U(380,560),t0:s.t,state:'pop',amt:0},extra||{}))}
function m2Drop(m){const D=DIF();const n=RI(1,3);for(let i=0;i<n;i++)lootPush('coin',m,{amt:Math.round(RI(38,96)*D.gold)});
  if(rnd()<0.45)lootPush(CH(['clay','stone','herb','clay','pot']),m);
  if(rnd()<(m.summon?0.75:0.5))lootPush('food',m);
  if(Math.random()<(m.str?0.05:0.03)*(1+D.drop))lootPush('gear',m,{it:rollDrop()});if(Math.random()<TFP_MOB)lootPush('tfpot',m)}
function m2BossLoot(m){const D=DIF();for(let i=0;i<6;i++)lootPush('coin',m,{amt:Math.round(500*D.gold),vx:U(-300,300)});lootPush('gear',m,{it:rollDrop(1),vx:U(-200,200)});if(Math.random()<0.5+D.drop)lootPush('gear',m,{it:rollDrop(),vx:U(-200,200)});if(Math.random()<TFP_BOSS)lootPush('tfpot',m,{vx:U(-200,200)})}
function m2Gold(a){const s=S0;s.gold+=a;SAVE.gold+=a;s.runGold+=a;s.goldPop=[s.t,a];s.log.push([s.t,'coin','獲得 金幣 x'+a])}
function m2GotGear(it){const s=S0;if(SAVE.inv.length>=80){const p=sellPrice(it);SAVE.gold+=p;s.gold+=p;s.log.push([s.t,it,'背包滿了：自動賣出 +'+p]);return}
  SAVE.inv.push(it);s.runItems.push(it);s.log.push([s.t,it,'獲得 '+RAR[it.r].st+itName(it)]);if(it.r>=3)proc(RAR[it.r].n+'裝備！',RAR[it.r].fr,'寶')}
function m2GoldHUD(x,y){const s=S0;T('（本次 +'+(s.runGold||0).toLocaleString('en-US')+'）',x,y,FN(12),[255,190,90],2,[0,0,0],'lm');
  if(s.goldPop){const age=s.t-s.goldPop[0];if(age<0.9)T('+'+s.goldPop[1],x+4,y-14-Math.round(18*Math.min(1,age/0.4)),FN(15),[255,226,120],2,[60,30,0],'lm',age<0.6?1:(0.9-age)/0.3)}}
// ---------- stage flow ----------
function m2Begin(st,d,bonus){RUN.st=st;RUN.d=d;RUN.bonus=!!bonus;const G=bonus?BONUS:STG[st];seed=+(Q.get('seed')||Math.floor(Math.random()*1e5));S0=newSim();timers.length=0;S0.gold=SAVE.gold;calcGS();
  mode='play';paused=false;musStop('title',0.8);setStage(G.start,{x:G.x});if(!bonus)setTimeout0(0.2,()=>card(G.n+'　'+G.t,DIF().n+'難度',2.0))}
function m2Goto(to){const s=S0;if(to==='clear'||STGD().endOn===to){m2Clear();return}setStage(to)}
function m2OnStage(n){const s=S0,P=s.P;const b=YBAND[n]||[508,604];YMIN=b[0];YMAX=b[1];P.y=clamp(P.y,YMIN,YMAX);s.pet.y=Math.min(P.y+24,616);
  m2Music(MUSIC[n]);s.npc=null;
  if(n==='s2'){setTimeout0(2.4,()=>sub('','（第二關是暫代關卡：等你錄好新關卡影片再換）打倒敵人後往右走 →',3.6))}
  if(n==='sp'){setTimeout0(2.4,()=>sub('','（第四關蜘蛛巢穴是暫代關卡：等蜘蛛影片轉化完再換）打倒敵人後往右走 →',3.6))}
  if(n==='ms1'||n==='ms2')msOnStage(n);
  if(n==='b4mine'){card(STAGES.b4mine.name,'BARRI DUNGEON B2',1.8);setTimeout0(1.0,()=>sub('','地下城的空氣在震動……深處有東西醒過來了。',2.8))}
  if(n==='b4boss')setupB4();
  if(n!=='boss'&&n!=='b4boss'&&n!=='spb'&&!n.startsWith('ms')){const f=Q.get('npc');let k=null;const r=Math.random();if(f==='prank'||f==='cat')k=f;else if(r<NPC_P.cat)k='cat';else if(r<NPC_P.cat+NPC_P.prank)k='prank';
    if(!k&&!SAVE.npcSeen&&RUN.st>=3&&!RUN.bonus)k=Math.random()<0.3?'cat':'prank';if(k){SAVE.npcSeen=1;const sp=m21NpcSpot(n);s.npc={k,x:sp[0],y:sp[1],t0:s.t,draws:0,said:false};setTimeout0(0.9,()=>{if(s.npc)s.npc.bub=s.t})}}}
function m2Clear(){if(mode!=='play')return;if(RUN.bonus)return msClear();const s=S0;mode='result';paused=false;
  for(const L of s.loot){if(L.k==='coin')m2Gold(L.amt);else if(L.k==='gear')m2GotGear(L.it);else if(L.k==='tfpot'||L.k==='tfpot2')m21Pot(L.k);else if(L.k==='sock')m21Sock()}for(const f of s.fly){if(f.done)continue;if(f.k==='coin')m2Gold(f.amt);else if(f.k==='gear')m2GotGear(f.it);else if(f.k==='tfpot')m21Pot();else if(f.k==='sock')m21Sock()}s.loot=[];s.fly=[];
  const prevC=CL(RUN.st);setCL(RUN.st,Math.max(prevC,RUN.d+1));SAVE.sel=STG[Math.min(NST,RUN.st+1)].id;m2Save();
  RES={def:STG[RUN.st],offer:Q.get('money')==='1'||(Q.get('money')!=='0'&&Math.random()<BONUS.chance),st:RUN.st,d:RUN.d,t:s.t,kills:s.kills,maxCombo:s.maxCombo,gold:s.runGold,hold:SAVE.gold,items:s.runItems.slice(),t0:performance.now(),unlock:RUN.d+1<=4&&prevC<RUN.d+1?DIFFS[RUN.d+1].n:null,unlockSt:prevC===0&&RUN.st<NST};
  musStop(CURM,0.6);musStop('lute',0.3);musPlay('m_shop',0.4,0.8,true);CURM='m_shop'}
let RES=null;
function m2ToMap(){m2Save();paused=false;musStop(CURM,0.5);musStop('lute',0.3);m2OpenMap()}
function m2Retry(){const s=S0;const keep={gold:s.gold,kills:s.kills,exp:s.exp,lv:s.lv,maxCombo:s.maxCombo,food:s.food,runGold:s.runGold,runItems:s.runItems};const stg=s.stage,wv=s.wave;
  const n=newSim();Object.assign(n,keep);S0=n;timers.length=0;n.hintUntil=0;mode='play';calcGS();
  if(stg==='boss'){setStage('shrine',{x:520});n.food=keep.food;sub('','從女神像重新挑戰：按 E 祈禱。',3.0)}
  else if(stg==='b4boss'){setStage('b4boss',{x:220});n.food=keep.food}
  else{setStage(stg,{x:430});if(stg!=='shrine'){n.wave=wv;const w=WAVES[wv];const px=w?Math.max(300,w.trig-300):WW-500;n.P.x=px;n.cam=clamp(px-470,0,CAMMAX);n.pet.x=px-118;if(!w){if(stg==='canyon')n.caveOn=true;else n.mineDone=true}}}
  musPlay(CURM,BGMV,0.5)}
// ---------- per-step ----------
function m2Step(dt){const s=S0,t=s.t,P=s.P;
  for(const m of s.mobs){if(m.burnU>t&&t>=m.burnN&&!m.gone&&!m.dying){m.burnN+=0.5;if(m.kind==='boss'&&bossShielded())continue;const v=m.kind==='boss'&&b4Prot()?Math.round(m.burnV*0.2):m.burnV;
      s.dmg.push({t,x:m.x+U(-12,12),y:(m.kind==='boss'?m.y-250:m.y-m.h-96),v,bleed:true});for(let i=0;i<3;i++)s.parts.push({x:m.x+U(-14,14),y:m.y-m.h-U(40,90),vx:U(-30,30),vy:-U(60,140),g:-100,life:0.4,t0:t,c:CH([[255,140,40],[255,200,80],[255,90,30]]),sz:1});applyDmg(m,v)}}
  const n=s.npc;if(n&&!P.dead&&!s.trans&&!s.ritual){const near=Math.abs(P.x-n.x)<130&&Math.abs(P.y-n.y)<90;n.near=near;
    if(near&&!n.said){n.said=true;n.bub=t}
    if(near&&IN.use()&&!AUTO){paused=true;pauseWhy='npc';m2UI(n.k==='cat'?'catmenu':'forge',n.k)}}}
function npcBubble(n,x,y){const segs=NPCS[n.k].line;const f=FS(17);let w=0;for(const [tx] of segs)w+=tw(tx,f);const bw=Math.min(560,w+30);
  rrect(x-bw/2,y-20,x+bw/2,y+20,12,'rgba(255,253,245,0.97)','rgb(70,50,40)',2);quad([[x-8,y+19],[x+6,y+19],[x-4,y+33]],'rgba(255,253,245,0.97)');
  let cx=x-w/2;for(const [tx,c] of segs){T(tx,cx,y+1,f,c||[60,40,30],c?2:0,[90,40,0],'lm');cx+=tw(tx,f)}}
function m2Ents(ents,SX,shy){const s=S0,t=s.t,n=s.npc;
  if(n){ents.push([m21NpcKey(n),()=>{const sx=SX(n.x),sy=n.y+shy;if(sx<-200||sx>W+200)return;const im=IMG[NPCS[n.k].img];const sc=n.k==='cat'?1.7:2;const bob=Math.floor(t/0.5)%2;
      shadowE(sx,sy,n.k==='cat'?46:36);X.save();X.imageSmoothingEnabled=false;const w=im.width*sc,h=im.height*sc;X.drawImage(im,Math.round(sx-w/2),Math.round(sy-h+4+bob*2),w,h);X.restore();
      const ny=Math.round(sy-h-14);const nm=NPCS[n.k].name;rrect(sx-tw(nm,FN(14))/2-10,ny-12,sx+tw(nm,FN(14))/2+10,ny+12,8,n.k==='cat'?'rgba(120,40,140,0.9)':'rgba(40,90,60,0.9)','rgb(255,236,190)',1);T(nm,sx,ny+1,FN(14),[255,250,230],2,[0,0,0],'mm');
      if(n.bub!=null&&t-n.bub<5)npcBubble(n,sx,ny-40)}])}
  ents.push([99999,()=>drawM2Fx(SX,shy)])}
function drawM2Fx(SX,shy){const s=S0,t=s.t;const b=s.boss;if(b&&b.b4&&b.atk&&b.atk.k==='breath'&&!b.m.dying){const age=t-b.atk.t0;if(age>0.45&&age<1.05){const m=b.m,f=m.face,u=clamp((age-0.45)/0.15,0,1),fade=age>0.9?(1.05-age)/0.15:1;
    const x0=SX(m.x+f*120),y0=m.y-96+shy,len=760*u,x1=x0+f*len,y1=m.y-24+shy;X.save();X.globalAlpha=0.75*fade;const g=X.createLinearGradient(x0,0,x1,0);g.addColorStop(0,'rgba(220,250,255,0.95)');g.addColorStop(0.5,'rgba(110,200,255,0.7)');g.addColorStop(1,'rgba(60,120,255,0)');
    X.fillStyle=g;X.beginPath();X.moveTo(x0,y0-12);X.lineTo(x1,y1-40);X.lineTo(x1,y1+30);X.lineTo(x0,y0+12);X.closePath();X.fill();X.restore();
    if(Math.floor(t*60)%2)s.parts.push({x:m.x+f*(120+U(0,len)),y:m.y-U(20,90),vx:f*U(60,200),vy:-U(10,80),g:0,life:0.35,t0:t,c:CH([[200,240,255],[120,200,255],[255,255,255]]),sz:CH([1,2])})}}
for(const e of s.fx){const age=t-e.t0;
  if(e.k==='bolt'&&age<0.18){X.save();X.strokeStyle=Math.floor(t*40)%2?'rgb(255,250,180)':'rgb(255,220,60)';X.lineWidth=4;X.beginPath();let x=SX(e.x0),y=e.y0+shy;X.moveTo(x,y);
    for(let i=1;i<=6;i++){const u=i/6;X.lineTo(SX(e.x0+(e.x1-e.x0)*u)+(i<6?U(-14,14):0),e.y0+(e.y1-e.y0)*u+shy+(i<6?U(-18,18):0))}X.stroke();X.restore()}
  if(e.k==='rain'&&age<0.5){for(let i=0;i<5;i++){const fx=SX(e.x)+(i-2)*22,fy=e.y+shy-80-Math.max(0,(0.28-age+i*0.02))*900;if(age>0.28+i*0.02+0.15)continue;
      X.fillStyle='rgb(220,230,255)';X.fillRect(Math.round(fx)-2,Math.round(fy)-60,5,60);X.fillStyle='rgb(140,150,190)';X.fillRect(Math.round(fx)-6,Math.round(fy)-64,13,4);X.fillStyle='rgba(255,255,255,0.4)';X.fillRect(Math.round(fx)-1,Math.round(fy)-160,2,100)}}}}
let protMsg=null;
function m2Prot(){const s=S0,t=s.t;if(protMsg&&t-protMsg.t<3.5&&protMsg.s===s)return;const b=s.boss;protMsg={t,s,txt:b&&b.b4?'憤怒的水晶監視者被大地守護石神秘的力量保護了':'峽谷看守者被赤色晶柱神秘的力量保護了'}}
function m2HUD(cx0,shy){const s=S0,t=s.t;
  // stage tag
  {const tag=STGD().n+'・'+DIF().n;T(tag,1266,662,FN(15),[255,236,190],2,[0,0,0],'rm')}
  if(protMsg&&protMsg.s===s&&t-protMsg.t<2.4){const age=t-protMsg.t,a=age<2.0?1:(2.4-age)/0.4;X.save();X.globalAlpha=a*0.6;X.fillStyle='#000';X.fillRect(0,214,W,40);X.restore();T(protMsg.txt,640,234,FS(22),[200,225,255],3,[10,20,60],'mm',a)}
  const n=s.npc;if(n&&n.near&&!s.trans){const px=Math.round(n.x-cx0),py=Math.round(n.y+shy+36);const lab=n.k==='cat'?'E　貓商人：金幣強化／抽裝備':'E　搗蛋鬼：武器強化';rrect(px-150,py-18,px+150,py+18,8,'rgba(12,10,16,0.85)',rgb(GOLDC),2);T(lab,px,py,FS(17),[255,244,214],2,[0,0,0],'mm')}
  const P=s.P;if(m2Down()){T('倒地！',Math.round(P.x-cx0),Math.round(P.y+shy-120),FS(22),[255,200,190],3,[60,0,0],'mm')}}
function m2State(){const s=S0;return{run:RUN.st,d:RUN.d,mode,gold:SAVE&&SAVE.gold,inv:SAVE&&SAVE.inv.length,clear:SAVE&&STG.slice(1).map((g,i)=>CL(i+1)).join(''),bonus:!!RUN.bonus,gems:S0&&S0.gems||0,ui:UI.kind,npc:s&&s.npc?s.npc.k:null,boss4:s&&s.boss&&s.boss.b4?{hp:s.boss.m.hp,ph:s.boss.phase,atk:s.boss.atk&&s.boss.atk.k}:null,Y:[YMIN,YMAX],down:!!(s&&m2Down())}}
// ---------- weapon look: palette swap of the kudas blade pixels per weapon type (shape unchanged) ----------
const BLADE=[null,[[60,52,40],[110,96,70],[170,150,110],[215,200,160],[245,238,215]],[[40,22,26],[84,42,46],[134,72,74],[190,124,118],[236,194,184]],[[44,42,40],[78,74,70],[112,106,98],[150,142,130],[190,182,170]],
  [[50,60,90],[90,110,150],[140,165,205],[190,210,240],[245,250,255]],[[70,46,14],[130,90,30],[200,150,50],[240,200,90],[255,240,170]],[[60,10,20],[120,20,36],[180,40,50],[230,90,90],[255,180,170]],
  [[30,22,40],[60,44,80],[96,72,124],[140,112,170],[200,180,230]],[[20,50,70],[30,100,130],[60,170,200],[140,225,240],[230,255,255]]];
const STEEL=[[50,55,66],[100,109,136],[135,141,164],[167,161,167],[212,198,190]];
const TINT={};
function buildTints(){for(const n of META.names){if(!n.startsWith('kudas'))continue;const src=IMG['s_'+n],mk_=IMG['m_'+n];if(!src||!mk_||!src.width||!mk_.width)continue;
  const [c0,x0]=mk(src.width,src.height);x0.drawImage(mk_,0,0);const md=x0.getImageData(0,0,src.width,src.height).data;
  for(let k=1;k<9;k++){const [c,x]=mk(src.width,src.height);x.drawImage(src,0,0);const id=x.getImageData(0,0,c.width,c.height),d=id.data;const R=BLADE[k];
    for(let i=0;i<d.length;i+=4){if(md[i]<128||d[i+3]===0)continue;const l=(d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11);const j=clamp(Math.round((l-45)/(205-45)*4),0,4);d[i]=R[j][0];d[i+1]=R[j][1];d[i+2]=R[j][2]}
    x.putImageData(id,0,0);TINT[n+'|'+k]=c}}}
// W2.8：濾鏡圖快取：同一張圖＋同一組濾鏡只算一次（殘影每 frame 套 CSS 濾鏡很貴：1 張約 5 ms）。濾鏡只改顏色、不改形狀，先套好再縮放貼上，畫面一樣
const FLTC=new Map();
function fltImg(im,f){if(!im||!im.width)return null;let m=FLTC.get(im);if(!m){if(FLTC.size>=48)FLTC.delete(FLTC.keys().next().value);m=new Map();FLTC.set(im,m)}let c=m.get(f);if(c)return c;
  const [cc,x]=mk(im.width,im.height);x.filter=f;x.drawImage(im,0,0);m.set(f,cc);return cc}
function spr(n,sx,sy,o={}){
  const [cw,chh,cx,cy]=anchor(n);let im=IMG[(o.flash?'f_':'s_')+n];if(!o.flash&&GS.wk&&n.startsWith('kudas')&&TINT[n+'|'+GS.wk])im=TINT[n+'|'+GS.wk];
  if(!im||!im.width)return;
  if(o.filter&&!o.glow){const c=fltImg(im,o.filter);if(c){im=c;o=Object.assign({},o,{filter:null})}}
  X.save();try{X.globalAlpha=o.alpha==null?1:o.alpha;X.translate(Math.round(sx),Math.round(sy));
  if(o.sc)X.scale(o.sc,o.sc);if(o.filter)X.filter=o.filter;
  if(o.flip)X.scale(-1,1);
  if(o.rot){X.translate(0,-30*SS);X.rotate(-o.rot*Math.PI/180);X.translate(0,30*SS)}
  const dx=-cx*SS,dy=-cy*SS+(o.dy||0)*SS;
  if(o.glow){X.globalAlpha*=o.glow[3]/255;X.drawImage(ringImg(n,o.glow),dx,dy,cw*SS,chh*SS);X.globalAlpha=o.alpha==null?1:o.alpha}
  X.drawImage(im,dx,dy,cw*SS,chh*SS)}finally{X.restore()}}
// ---------- gear icons (pixel, 20×20 native) ----------
const GIC={};
function gearIconC(it){const key=it.t+it.k+'_'+it.r;if(GIC[key])return GIC[key];const [c,x]=mk(20,20);const R=RAR[it.r];
  const px=(xx,yy,col)=>{x.fillStyle=rgb(col);x.fillRect(xx,yy,1,1)};
  x.fillStyle=rgb(R.bg);x.fillRect(1,1,18,18);for(let i=0;i<18;i++){x.fillStyle=rgb(R.bg.map(v=>Math.min(255,v+Math.round(i*1.6))),1);x.fillRect(1,1+i,18,1)}
  x.fillStyle=rgb(R.fr);x.fillRect(1,0,18,1);x.fillRect(1,19,18,1);x.fillRect(0,1,1,18);x.fillRect(19,1,1,18);x.fillStyle=rgb(R.fr.map(v=>Math.min(255,v+70)));x.fillRect(2,1,16,1);
  if(it.t==='w'){const P=it.k?BLADE[it.k]:STEEL;const wide=[2,3,2,3,2,3,2,3,3][it.k];const curve=it.k===2||it.k===6;
    for(let i=0;i<12;i++){const bx=5+i,by=14-i-(curve&&i>3&&i<10?1:0);for(let w=0;w<wide;w++)px(bx,by+w,w===0?P[4]:w===wide-1?P[1]:P[3]);px(bx,by-1,[20,16,22])}
    px(16,2,P[4]);px(17,1,P[3]);
    // guard + grip
    for(let i=-2;i<=2;i++)px(5+i,14+i,[200,170,90]);px(4,16,[110,70,40]);px(3,17,[110,70,40]);px(2,18,[220,190,110])}
  else if(it.t==='a'){const P=[[60,50,46],[110,96,84],[160,140,120],[210,196,170]];const sh=[[4,3,8],[4,12,17],[5,3,17],[6,3,17],[7,4,16],[8,5,15],[9,6,14],[10,6,14],[11,6,14],[12,6,14],[13,6,14],[14,7,13],[15,7,13]];
    for(const [y,a,b] of sh)for(let xx=a;xx<b;xx++)px(xx,y,xx===a||xx===b-1?P[0]:xx<a+3?P[3]:P[2]);for(let y=5;y<15;y++)px(10,y,P[1]);px(8,4,[30,24,24]);px(9,5,[30,24,24]);px(11,5,[30,24,24]);px(12,4,[30,24,24])}
  else{const G=[[120,80,20],[200,150,40],[250,210,90],[255,245,190]];const gem=[[200,40,60],[120,200,255],[255,90,90],[150,230,255],[220,120,255]][it.k];
    for(let a=0;a<24;a++){const an=a/24*Math.PI*2;px(Math.round(10+Math.cos(an)*5),Math.round(11+Math.sin(an)*4),a<12?G[2]:G[1])}
    px(9,5,gem);px(10,5,gem);px(9,6,gem);px(10,6,gem.map(v=>Math.min(255,v+60)));px(8,6,G[0]);px(11,6,G[0]);px(9,4,G[3]);px(10,4,G[3])}
  GIC[key]=c;return c}
function gearIcon(it,x,y,z,alpha=1){X.save();X.globalAlpha=alpha;X.imageSmoothingEnabled=false;X.drawImage(gearIconC(it),Math.round(x),Math.round(y),z,z);X.restore()}
function gearCard(it,x,y,z,sel){gearIcon(it,x,y,z);const ee=effE(it);if(ee)T('+'+ee,x+z-3,y+z-4,FN(Math.max(11,Math.round(z/4.2))),[255,236,120],2,[0,0,0],'rb');
  if(RAR[it.r].st)T(RAR[it.r].st,x+4,y+4+Math.round(z/9),FN(Math.max(10,Math.round(z/5.5))),RAR[it.r].col,2,[0,0,0],'lm');
  if(isEq(it)){rrect(x+z-20,y+2,x+z-2,y+18,4,'rgba(200,60,40,0.95)');T('E',x+z-11,y+10,FN(11),[255,255,255],0,[0,0,0],'mm')}
  if(sel){X.save();X.strokeStyle=Math.floor(performance.now()/180)%2?'rgb(255,236,150)':'rgb(255,255,255)';X.lineWidth=3;X.strokeRect(x-3,y-3,z+6,z+6);X.restore()}}
function itemLines(it){const out=[];const R=RAR[it.r];
  if(it.t==='w'){const [a,b]=wRange(it);out.push(['攻擊力',`${a}~${b}`,[255,255,255]]);out.push(['傷害倍率','×'+(0.6+0.4*((a+b)/2)/30).toFixed(2),[255,236,190]])}
  else{const M=GMAIN[it.t]||['數值','+'];out.push([M[0],`${M[1]}${it.v}%`,[255,255,255]]);if(GSUB[it.t])out.push([GSUB[it.t][0],`+${it.v2||0}%`,[255,255,255]])}
  for(const [id,v] of it.lines){const L=LINES.find(l=>l[0]===id);out.push([L[1],`+${v}%`,[150,230,255]])}
  if(it.el)out.push(['魔法屬性',`${it.el}（${ELDESC[it.el]}，${Math.round(R.el*100)}%）`,ELS[it.el]]);
  if(it.rune&&RUNES[it.rune.n]){const Rn=RUNES[it.rune.n];const J=Rn[3]==='j';out.push([J?'搞笑符文':`${RUNEG[it.rune.g]}色符文`,`${it.rune.n}：${Rn[1](Rn[2][it.rune.g])}`,J?[255,150,200]:RUNEC[it.rune.g]])}
  if(it.t==='w'&&effE(it)){out.push(['強化',`+${effE(it)}（攻擊 +${Math.round(enhAtk(effE(it))*100)}%${enhCdmg(effE(it))?'、暴擊傷害 +'+Math.round(enhCdmg(effE(it))*100)+'%':''}）`,[255,236,120]]);const en=enchOf(effE(it));if(en)out.push(['賦魔',`${en[0]}% 機率 +${en[1]}% 傷害（冷卻 10 秒）`,[255,170,90]])}
  return out}
// ---------- 第四關：憤怒的水晶監視者 ----------
const B4A={idle:[8,0.12],walk:[8,0.1],slash:[14,0.07],pounce:[14,0.07],breath:[14,0.08],roar:[12,0.08],hit:[6,0.05],death:[12,0.167]};
const B4W=280,B4H=210,B4AX=162,B4AY=196;
const STONE_POS=[[260,540],[1020,540]],STELE_POS=[[400,520],[640,600],[880,520]];
function setupB4(){const s=S0,t=s.t;const D=DIF();
  s.boss={b4:true,name:'憤怒的水晶監視者',m:null,phase:'stones',kneelUntil:-9,nextAtk:t+4.5,summonT:t+10,atk:null,stelT:t+3,hitT:-9,regrown:true};
  const m=mob('boss',900,560);m.hp=m.hpmax=Math.round(2000000*D.hp);m.face=-1;m.enter=false;s.mobs.push(m);s.boss.m=m;
  for(const [x,y] of STONE_POS){const pl=mob('pillar',x,y);pl.sub='stone';pl.hp=pl.hpmax=Math.round(80000*D.hp);pl.face=1;pl.rise=t;s.mobs.push(pl)}
  s.P.hp=HPMAX;s.P.rh=0;s.bossT0=t;s.lock=[0,0];s.st={dmg:0,maxHit:0,hits:0,crits:0,zj:0,t0:t};s.maxComboB=0;
  setTimeout0(0.3,()=>card('甦醒的徵兆','憤怒的水晶監視者',2.2));
  setTimeout0(2.0,()=>sub('水晶監視者','……追蹤……！破壞……！！',2.6));
  setTimeout0(4.8,()=>sub('','大地守護石還在時，監視者只會受到 20% 傷害。先打碎守護石！',3.4))}
const b4Prot=()=>{const s=S0;return !!(s&&s.boss&&s.boss.b4&&s.mobs.some(m=>m.kind==='pillar'&&m.sub==='stone'&&!m.gone&&!m.dying))};
function b4Status(){const s=S0,b=s.boss;const ns=s.mobs.filter(o=>o.kind==='pillar'&&o.sub==='stone'&&!o.gone&&!o.dying).length,nt=s.mobs.filter(o=>o.kind==='pillar'&&o.sub==='stele'&&!o.gone&&!o.dying).length;
  return ns?`大地守護石 ×${ns}　減傷 80%`:nt?`腐蝕石碑 ×${nt}　毒霧中`:'可以造成傷害！'}
function b4Break(m){const s=S0,t=s.t,b=s.boss;m.dieT=t+0.45;shake(10,0.35);sfx('crit',0.6);const st=m.sub==='stone';
  for(let i=0;i<26;i++)s.parts.push({x:m.x+U(-20,20),y:m.y-U(40,200),vx:U(-320,320),vy:-U(150,520),g:1500,life:0.8,t0:t,c:st?CH([[120,200,255],[60,120,220],[200,240,255],[40,70,140]]):CH([[120,200,90],[60,120,60],[200,240,170]]),sz:CH([1,2]),floor:m.y+6});
  const left=s.mobs.filter(o=>o.kind==='pillar'&&o.sub===m.sub&&!o.gone&&!o.dying).length;proc(st?'守護石破壞':'石碑破壞',st?[90,160,255]:[110,200,90],'石');
  if(left>0||b.m.dying)return;b.atk=null;
  if(st){b.phase='steles';b.kneelUntil=t+5;card('大地守護石破壞','監視者跪地 5 秒！腐蝕石碑出現了',1.8);sub('水晶監視者','……嘎……！！',1.2);
    for(const [x,y] of STELE_POS){const pl=mob('pillar',x,y);pl.sub='stele';pl.hp=pl.hpmax=Math.round(40000*DIF().hp);pl.face=1;pl.rise=t+0.5;s.mobs.push(pl)}b.stelT=t+3}
  else{b.phase='free';b.kneelUntil=t+8;card('監視者跪地','8 秒內全部算無防備暴擊！',1.6);sub('水晶監視者','……停……止……',1.4)}}
function b4Die(m){const s=S0,t=s.t;m2BossLoot(m);m.dieT=t+2.0;s.winT=t;s.boss.atk=null;s.tele=[];shake(18,1.0);sfx('crit',0.7);
  for(const o of s.mobs)if(o!==m&&!o.gone){o.dying=true;if(o.kind!=='pillar'){o.state='down';o.dieT=t+0.4}else o.dieT=t+0.4}
  for(let i=0;i<50;i++)s.parts.push({x:m.x+U(-120,120),y:m.y-U(40,300),vx:U(-320,320),vy:-U(100,520),g:1200,life:1.2,t0:t,c:CH([[120,200,255],[200,240,255],[90,90,110],[160,150,170]]),sz:CH([2,3]),floor:m.y+8});
  card('勝利','VICTORY',3.0);setTimeout0(0.8,()=>sub('水晶監視者','……核……心……停……止……',2.8))}
function b4Attack(k){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P;const f=m.face;const [nf,fd]=B4A[k];const dur=nf*fd;b.atk={k,t0:t,end:t+dur+0.25};
  if(k==='slash'){s.tele.push({x:clamp(m.x+f*150,80,WW-80),y:m.y,r:150,t0:t,t1:t+0.62,dmg:950,big:true});sub('水晶監視者','——！',0.8)}
  if(k==='pounce'){const tx=clamp(P.x,150,WW-150),ty=clamp(P.y,YMIN+6,YMAX-6);b.atk.from=[m.x,m.y];b.atk.to=[tx-f*40,ty];s.tele.push({x:tx,y:ty,r:120,t0:t,t1:t+0.70,dmg:1100,big:true})}
  if(k==='breath'){const g='b'+s.uid++;for(let i=0;i<7;i++){const x=m.x+f*(140+i*105);if(x<40||x>WW-40)break;s.tele.push({x,y:m.y+U(-6,6),r:72,t0:t+0.15,t1:t+0.72+i*0.05,dmg:700,g})}sub('水晶監視者','（深沉的大地吐息）',1.0)}
  if(k==='roar'){s.tele.push({x:m.x,y:m.y,r:160,t0:t,t1:t+0.55,dmg:500,big:true});shake(8,0.6);
    const alive=s.mobs.filter(o=>!o.gone&&!o.dying&&(o.kind==='sword'||o.kind==='bow')).length;
    if(alive<3)for(let i=0;i<2;i++)setTimeout0(0.6+i*0.25,()=>{if(b.m.dying)return;const mm=mob(CH(['sword','sword','bow']),clamp(m.x+U(-300,300),80,WW-80),U(YMIN+8,YMAX-8));mm.enter=false;mm.summon=1;mm.face=P.x>mm.x?1:-1;s.mobs.push(mm);puff(mm.x,mm.y-40,14,[120,190,255],40,0.5,3)})}}
function stepB4(dt){const s=S0,b=s.boss,m=b.m,t=s.t,P=s.P;
  if(b.phase==='steles'&&t>=b.stelT){b.stelT=t+3.2;const sts=s.mobs.filter(o=>o.sub==='stele'&&!o.gone&&!o.dying);
    for(const st of sts)s.tele.push({x:clamp(P.x+U(-150,150),60,WW-60),y:clamp(P.y+U(-30,30),YMIN,YMAX),r:84,t0:t,t1:t+1.1,dmg:380,poison:true});if(sts.length)proc('毒霧',[120,200,90],'毒')}
  if(t<m.frz)return;
  if(t<b.kneelUntil){m.moving=false;b.atk=null;return}
  if(b.atk){m.moving=false;const a=b.atk;if(a.k==='pounce'){const u=clamp((t-a.t0-0.35)/0.38,0,1);const e=u*u*(3-2*u);m.x=a.from[0]+(a.to[0]-a.from[0])*e;m.y=a.from[1]+(a.to[1]-a.from[1])*e;m.x=clamp(m.x,140,WW-140)}
    if(t>=a.end){b.atk=null;b.nextAtk=t+U(1.8,3.0)*DIF().cd}return}
  const want=P.x>=m.x?1:-1;if(t-(m.turnT||0)>0.35){if(m.face!==want)m.turnT=t;m.face=want}
  if(b.summonT<=t){b.summonT=t+14;const alive=s.mobs.filter(o=>!o.gone&&!o.dying&&(o.kind==='sword'||o.kind==='bow')).length;
    if(alive<2){const mm=mob(CH(['sword','bow']),clamp(P.x+CH([-1,1])*420,80,WW-80),U(YMIN+8,YMAX-8));mm.enter=false;mm.summon=1;mm.face=P.x>mm.x?1:-1;s.mobs.push(mm);puff(mm.x,mm.y-40,14,[120,190,255],40,0.5,3)}}
  const gx=P.x-want*200,ddx=gx-m.x,ddy=P.y-m.y,d=Math.hypot(ddx,ddy*1.6);m.moving=d>16;
  if(m.moving){m.x+=ddx/d*92*dt;m.y+=ddy/d*50*dt}m.x=clamp(m.x,140,WW-140);m.y=clamp(m.y,YMIN+6,YMAX-6);
  if(t>=b.nextAtk&&!P.dead&&!s.trans){const near=Math.abs(P.x-m.x)<330&&Math.abs(P.y-m.y)<70;const low=m.hp<m.hpmax*0.6;
    b4Attack(near?CH(['slash','slash','pounce',low?'roar':'slash']):CH(['pounce','breath','breath',low?'roar':'pounce']))}}
function b4Frame(){const s=S0,b=s.boss,m=b.m,t=s.t;
  if(m.dying){return['death',Math.min(11,Math.floor((t-(m.dieT-2.0))/B4A.death[1]))]}
  if(t<b.kneelUntil){return['hit',5]}
  if(b.atk){const [n,fd]=B4A[b.atk.k];return[b.atk.k,Math.min(n-1,Math.floor((t-b.atk.t0)/fd))]}
  if(t-b.hitT<0.3)return['hit',Math.min(5,Math.floor((t-b.hitT)/0.05))];
  if(m.moving)return['walk',Math.floor(t/B4A.walk[1])%8];return['idle',Math.floor(t/B4A.idle[1])%8]}
function drawB4(m,sx,sy){const s=S0,t=s.t,b=s.boss;const [k,fi]=b4Frame();const im=IMG['b4_'+k];if(!im||!im.width)return;
  const kneel=t<b.kneelUntil;let a=1;if(m.dying){const age=t-(m.dieT-2.0);a=age<1.6?1:Math.max(0,1-(age-1.6)/0.4)}
  if(b4Prot()&&!m.dying){const g=0.22+0.1*Math.sin(t*4);X.save();X.globalAlpha=g;circ(sx,sy-170,170,'rgba(90,160,255,0.35)',null);X.restore()}
  X.save();X.globalAlpha=a;X.imageSmoothingEnabled=false;X.translate(Math.round(sx),Math.round(sy+(kneel?8:0)));if(m.face>0)X.scale(-1,1);
  if(t<m.flash)X.filter='brightness(2.4) saturate(0.3)';else if(kneel)X.filter='drop-shadow(0 0 6px rgb(200,140,255))';
  X.drawImage(im,fi*B4W,0,B4W,B4H,-B4AX*SS,-B4AY*SS,B4W*SS,B4H*SS);X.restore()}
function drawStone(m,sx,sy){const t=S0.t;const rise=clamp((t-(m.rise||-9))/0.7,0,1);if(rise<=0)return;let a=1;if(m.dying){const k=(t-(m.dieT-0.45))/0.45;a=Math.max(0,1-k);if(Math.floor(t*20)%2)a*=0.5}
  const st=m.sub==='stone',im=IMG[st?'b4_stone':'b4_stele'];if(!im||!im.width)return;const w=im.width*SS,h=im.height*SS*rise;
  X.save();X.globalAlpha=a*(0.3+0.15*Math.sin(t*5+m.id));const gr=X.createRadialGradient(sx,sy-h/2,8,sx,sy-h/2,120);gr.addColorStop(0,st?'rgba(90,170,255,0.8)':'rgba(120,220,90,0.7)');gr.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=gr;X.fillRect(sx-120,sy-h-60,240,h+80);X.restore();
  shadowE(sx,sy,44);X.save();X.globalAlpha=a;X.imageSmoothingEnabled=false;if(t<m.flash)X.filter='brightness(2.2)';X.drawImage(im,0,im.height*(1-rise),im.width,im.height*rise,Math.round(sx-w/2),Math.round(sy-h+6),w,h);X.restore();
}
// ================= UI =================
const UI={kind:null,npc:null,sel:0,fresh:false,conf:null,res:null,msg:null,wsel:0,drawn:[],rev:null,tab:0};
const MAPT={t0:0,sel:1};
function stUnlocked(st){return st===1||CL(st-1)>0||CL(st)>0}
function dUnlocked(st,d){return d<=Math.min(4,CL(st))}
function m2OpenMap(){mode='map';paused=false;UI.kind=null;MAPT.t0=performance.now();{const i=stIdx(SAVE.sel);MAPT.sel=stUnlocked(i)?i:1}titleMus=true;
  if(CURM!=='title'){musStop(CURM,0.6);musStop('m_shop',0.6);CURM='title';musPlay('title',0.5,1.0,true)}else musPlay('title',0.5,1.0)}
function m2UI(kind,npc){UI.kind=kind==='catmenu'?'forge':kind;UI.npc=npc||null;UI.sel=0;UI.fresh=true;UI.conf=null;UI.res=null;UI.msg=null;UI.rev=null;
  if(UI.kind==='forge'){const ws=SAVE.inv.filter(i=>i.t==='w');const e=eqItem('w');UI.wsel=Math.max(0,ws.indexOf(e))}
  if(npc){musVol(CURM,0.08,0.4);musPlay('m_shop',0.4,0.6,true)}}
function m2CloseUI(){if(UI.npc){musStop('m_shop',0.5);musVol(CURM,BGMV,0.6)}UI.kind=null;UI.npc=null;if(mode==='play')paused=false;m2Save()}
const NODES=STG.slice(1).map((g,i)=>[Math.round(150+i*(980/Math.max(1,NST-1))),i%2?320:440]);
function panelBG(x0,y0,x1,y1){rrect(x0,y0,x1,y1,14,'rgba(18,12,10,0.94)',rgb(GOLDC),3);rrect(x0+6,y0+6,x1-6,y1-6,10,null,'rgba(214,172,84,0.35)',1)}
function btn(x0,y0,x1,y1,txt,on,col){const hov=MOUSE&&inBox(MOUSE,[x0,y0,x1,y1]);rrect(x0,y0,x1,y1,8,on?(hov?'rgb(120,82,36)':'rgb(92,62,28)'):'rgb(50,46,44)',on?rgb(col||GOLDC):'rgb(90,86,80)',2);
  T(txt,(x0+x1)/2,(y0+y1)/2+1,FS(18),on?[255,244,214]:[150,145,140],2,[0,0,0],'mm');return on&&CLICK&&inBox(CLICK,[x0,y0,x1,y1])}
function drawMap(){const t=performance.now()/1000;X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.55;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
  X.fillStyle='rgba(10,6,4,0.45)';X.fillRect(0,0,W,H);
  T('冒險地圖',640,58,FS(40),[255,236,200],4,[60,20,10],'mm');
  T(`金幣 ${SAVE.gold.toLocaleString('en-US')}`,40,40,FN(20),[255,226,120],2,[0,0,0],'lm');T(`刻印碎片 ${SAVE.shards}`,40,70,FN(18),[170,210,255],2,[0,0,0],'lm');
  X.save();X.strokeStyle='rgba(255,220,150,0.5)';X.lineWidth=6;X.setLineDash([14,12]);X.beginPath();X.moveTo(...NODES[0]);for(const p of NODES.slice(1))X.lineTo(...p);X.stroke();X.restore();
  for(let i=1;i<=NST;i++){const [x,y]=NODES[i-1],st=STG[i],un=stUnlocked(i),sel=MAPT.sel===i,cl=CL(i);
    if(sel){X.save();X.globalAlpha=0.35+0.2*Math.sin(t*4);circ(x,y,70,'rgb(255,220,120)',null);X.restore()}
    circ(x,y,52,un?st.col:'rgb(40,38,38)',sel?'rgb(255,236,150)':'rgb(214,172,84)',4);
    T(un?String(i):'鎖',x,y+2,FS(un?44:26),un?[255,250,230]:[140,135,130],3,[0,0,0],'mm');
    T(st.n,x,y+76,FS(22),un?[255,244,214]:[150,145,140],3,[0,0,0],'mm');T(st.t,x,y+104,FN(15),un?[230,220,200]:[130,125,120],2,[0,0,0],'mm');
    for(let d=0;d<5;d++)T('★',x-40+d*20,y-70,FN(16),d<cl?[255,210,80]:[80,76,70],2,[0,0,0],'mm');
    if(CLICK&&Math.hypot(CLICK[0]-x,CLICK[1]-y)<56&&un){if(MAPT.sel===i)m2StartSel();else MAPT.sel=i}}
  const st=MAPT.sel,ds=DS(st);T('難度',212,605,FS(20),[255,236,200],2,[0,0,0],'mm');
  for(let d=0;d<5;d++){const x=320+d*160,un=dUnlocked(st,d),on=d===ds;rrect(x-66,584,x+66,624,10,on?'rgb(150,90,30)':un?'rgb(70,50,30)':'rgb(40,38,38)',on?'rgb(255,236,150)':'rgb(150,120,70)',on?3:1);
    T(un?DIFFS[d].n:'未解鎖',x,605,FS(19),un?[255,244,214]:[130,125,120],2,[0,0,0],'mm');if(CLICK&&inBox(CLICK,[x-66,584,x+66,624])&&un)setDS(st,d)}
  const D=DIFFS[ds];T(`敵人 HP ×${D.hp}　傷害 ×${D.dmg}　掉寶 +${Math.round(D.drop*100)}%　金幣 ×${D.gold}　英雄裝 ${purPct(D)}%`,640,646,FN(15),[230,220,200],2,[0,0,0],'mm');
  T('←→ 選關卡　↑↓ 選難度　Enter 出發　I 背包　Esc 回標題　（通關後解鎖下一難度與下一關）',640,690,FN(15),[200,190,170],2,[0,0,0],'mm')}
function m2StartSel(){const st=MAPT.sel;if(!stUnlocked(st))return;const d=DS(st);if(!dUnlocked(st,d))return;SAVE.sel=STG[st].id;m2Save();sfx('start',0.4);m2Begin(st,d)}
function mapInput(){const st=MAPT.sel;
  if(press(['ArrowLeft','KeyA'])||GPP.l){for(let i=st-1;i>=1;i--)if(stUnlocked(i)){MAPT.sel=i;break}}
  if(press(['ArrowRight','KeyD'])||GPP.r){if(st<NST&&stUnlocked(st+1))MAPT.sel=st+1}
  if(press(['ArrowUp','KeyW'])||GPP.u){const d=DS(st);if(d<4&&dUnlocked(st,d+1))setDS(st,d+1)}
  if(press(['ArrowDown','KeyS'])||GPP.d){const d=DS(st);if(d>0)setDS(st,d-1)}
  if(IN.start()||press(['KeyJ','Space'])||GPP.jump)m2StartSel();
  else if(IN.bag())m2UI('bag');else if(IN.esc()){m2Save();mode='title';titleT=0;titleMus=false;window.__holdTitle=true}}
function drawResult(){const r=RES,age=(performance.now()-r.t0)/1000;X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.5;X.drawImage(IMG[r.def.bg],0,0,W,H);X.restore();
  panelBG(240,90,1040,640);T(`${r.def.n}　通過！`,640,150,FS(46),[255,236,160],4,[80,30,0],'mm');T(`${r.def.t}・${DIFFS[r.d].n}`,640,198,FS(22),[230,220,200],2,[0,0,0],'mm');
  const mm=Math.floor(r.t/60),ss=Math.floor(r.t%60);const rows=[['時間',`${mm}:${String(ss).padStart(2,'0')}`],['擊倒',String(r.kills)],['最大連擊',String(r.maxCombo)],['本次獲得金幣',`+${r.gold.toLocaleString('en-US')}（持有 ${r.hold.toLocaleString('en-US')}）`]];
  rows.forEach(([a,b],i)=>{T(a,420,252+i*40,FS(20),[214,172,84],2,[0,0,0],'lm');T(b,860,252+i*40,FN(20),[255,255,255],2,[0,0,0],'rm')});
  T(`獲得裝備 ${r.items.length} 件`,640,430,FS(20),[255,236,200],2,[0,0,0],'mm');
  r.items.slice(0,10).forEach((it,i)=>{const x=640-Math.min(10,r.items.length)*33+i*66;gearCard(it,x,452,56,false)});
  if(r.unlock||r.unlockSt)T((r.unlock?'':'')+(r.unlock?`解鎖難度：${r.unlock}`:'')+(r.unlockSt?`　・　解鎖 ${STG[r.st+1].n}`:''),640,550,FS(20),[150,255,150],2,[0,0,0],'mm');
  if(r.offer){const p=0.6+0.4*Math.sin(age*4);rrect(330,572,950,630,10,'rgba(60,30,90,0.85)','rgb(200,150,255)',2);T('傳聞中的廢棄宅邸出現了！　Enter 進入隱藏關卡　Esc 回到地圖',640,601,FS(19),[240,220,255],2,[0,0,0],'mm',p)}
  else T('Enter 回到地圖',640,604,FS(20),[230,230,230],2,[0,0,0],'mm',0.6+0.4*Math.sin(age*4));
  if(r.offer&&age>0.6&&(IN.esc()||press(['Escape']))){musStop('m_shop',0.4);CURM='m_shop';m2OpenMap();return}
  if(age>0.6&&(IN.start()||press(['KeyJ','Space'])||CLICK)||(AUTO&&age>2)){musStop('m_shop',0.4);CURM='m_shop';if(r.offer){m2Begin(RUN.st,RUN.d,true)}else m2OpenMap()}}
function m2Frame(el){
  if(mode==='play'&&paused&&pauseWhy==='esc'&&press(['KeyQ'])){m2ToMap();return true}
  if(mode!=='map'&&mode!=='result')return false;
  if(mode==='map'){drawMap();if(UI.kind){X.fillStyle='rgba(0,0,0,0.5)';X.fillRect(0,0,W,H);m2Overlay()}else if(AUTO&&!window.__autoStop&&performance.now()-MAPT.t0>1000){let st=1;for(let i=1;i<=NST;i++){if(stUnlocked(i)){st=i;if(!CL(i))break}}
      if(window.__autoAll===undefined||CL(st)===0||window.__autoAll){MAPT.sel=st;setDS(st,0);m2StartSel()}}else mapInput()}
  else drawResult();
  return true}
// ---------- bag ----------
const GX=430,GY=150,GC=60,GCOLS=8,GROWS=6;
function bagList(){return SAVE.inv}
function statRows(){const g=GS;return[['攻擊力',`${g.lo}~${g.hi}`],['傷害倍率','×'+g.wm.toFixed(2)],['暴擊率',`+${(g.crit*100).toFixed(1)}%`],['暴擊傷害',`+${(g.cdmg*100).toFixed(1)}%`],['追擊機率',`+${(g.zj*100).toFixed(1)}%`],
  ['受到傷害',`-${(g.def*100).toFixed(1)}%`],['閃避',`+${(g.dodge*100).toFixed(1)}%`],['抗倒地',`+${(g.kdr*100).toFixed(0)}%`],['移動速度',`+${(g.ms*100).toFixed(1)}%`],['技能傷害',`+${(g.skd*100).toFixed(1)}%`],['節奏加成',`+${(g.rhy*100).toFixed(1)}%`],['攻擊速度',`+${(g.aspd*100).toFixed(1)}%`],['對首領傷害',`+${(g.boss*100).toFixed(1)}%`],['魔法屬性',g.el?`${g.el} ${Math.round(g.elp*100)}%`:'—']]}
function itemDetail(it,x0,y0,x1){if(!it){T('（空）',(x0+x1)/2,y0+60,FN(16),[150,145,140],2,[0,0,0],'mm');return y0}const R=RAR[it.r];
  gearCard(it,x0,y0,64,false);T(itName(it),x0+76,y0+18,FS(21),R.col,2,[0,0,0],'lm');T(`${R.n}${R.st?' '+R.st:''}　${SLOTN[it.t]||'裝備'}　${it.t==='w'?'Lv'+(it.k+1):'Lv'+(it.k*2+1)}`,x0+76,y0+46,FN(14),[220,210,190],2,[0,0,0],'lm');
  let y=y0+88;for(const [a,b,c] of itemLines(it)){T(a,x0,y,FN(14),[214,172,84],2,[0,0,0],'lm');const lines=wrapT(b,FN(14),x1-x0-96);for(const l of lines){T(l,x0+92,y,FN(14),c,2,[0,0,0],'lm');y+=22}}
  T(`賣出 ${sellPrice(it)} 金幣　分解 刻印碎片 ×${RAR[it.r].sh}`,x0,y+6,FN(13),[190,180,160],2,[0,0,0],'lm');return y+20}
function wrapT(s,f,w){const out=[];let cur='';for(const ch of s){if(tw(cur+ch,f)>w&&cur){out.push(cur);cur=ch}else cur+=ch}if(cur)out.push(cur);return out}
function bagUI(inp){const L=bagList();UI.sel=clamp(UI.sel,0,Math.max(0,L.length-1));panelBG(70,50,1210,670);
  T('背包・裝備',640,84,FS(30),[255,236,200],3,[60,20,10],'mm');T(`金幣 ${SAVE.gold.toLocaleString('en-US')}　刻印碎片 ${SAVE.shards}　${L.length}/80`,1190,84,FN(16),[255,226,120],2,[0,0,0],'rm');
  // equip slots
  SLOTS.forEach(([sl,nm],i)=>{const x=96+(i%2)*154,y=116+Math.floor(i/2)*74;rrect(x,y,x+60,y+60,8,'rgba(40,30,24,0.9)','rgb(150,120,70)',2);const it=eqItem(sl);if(it)gearCard(it,x+2,y+2,56,false);else T(nm,x+30,y+30,FN(13),[150,140,120],0,[0,0,0],'mm');
    {const se=window.slotE?slotE(sl):(sl==='w'?SAVE.slot.e:0);T(nm+(se?'  +'+se:''),x+66,y+12,FN(13),se?[255,220,120]:[214,172,84],2,[0,0,0],'lm')}
    if(it){const nmx=RAR[it.r].st+itName(it);wrapT(nmx,FN(12),84).slice(0,2).forEach((l,k)=>T(l,x+66,y+32+k*16,FN(12),RAR[it.r].col,2,[0,0,0],'lm'))}else T('—',x+66,y+34,FN(12),[150,145,140],2,[0,0,0],'lm')});
  statRows().forEach(([a,b],i)=>{T(a,100,348+i*19,FN(13),[214,172,84],2,[0,0,0],'lm');T(b,400,348+i*19,FN(13),[255,255,255],2,[0,0,0],'rm')});
  const RA=runeActive();const rn=SLOTS.map(x=>eqItem(x[0])).filter(i=>i&&i.rune&&RA.has(i.id));T('符文：'+(rn.length?rn.map(i=>i.rune.n).join('、'):'—'),100,348+statRows().length*19+4,FN(13),[200,170,255],2,[0,0,0],'lm');
  // grid
  for(let i=0;i<GCOLS*GROWS;i++){const cx=GX+(i%GCOLS)*GC,cy=GY+Math.floor(i/GCOLS)*GC;rrect(cx,cy,cx+GC-6,cy+GC-6,6,'rgba(40,30,24,0.85)','rgba(150,120,70,0.6)',1);
    const it=L[i];if(it)gearCard(it,cx+1,cy+1,GC-8,i===UI.sel);else if(i===UI.sel){X.save();X.strokeStyle='rgb(255,236,150)';X.lineWidth=2;X.strokeRect(cx-2,cy-2,GC-2,GC-2);X.restore()}
    if(inp&&CLICK&&inBox(CLICK,[cx,cy,cx+GC-6,cy+GC-6])){if(UI.sel===i&&it)bagEquip(it);UI.sel=i;UI.conf=null}}
  if(L.length>GCOLS*GROWS)T(`（還有 ${L.length-GCOLS*GROWS} 件：先賣掉或分解）`,GX,GY+GROWS*GC+6,FN(13),[200,190,170],2,[0,0,0],'lm');
  const it=L[UI.sel];itemDetail(it,935,130,1190);
  let act=m21BagBtns(it,inp);
  if(UI.msg&&performance.now()-UI.msg[1]<1600)T(UI.msg[0],640,628,FS(18),[150,255,150],2,[0,0,0],'mm');
  T('方向鍵 選擇　J/Enter 裝備　X 賣掉　C 分解　G 全部賣掉綠色　U 搗蛋鬼・Y 惡魔貓藥水　I/Esc 關閉',640,652,FN(14),[200,190,170],2,[0,0,0],'mm');
  if(!inp)return;
  if(press(['ArrowLeft','KeyA']))UI.sel=Math.max(0,UI.sel-1);if(press(['ArrowRight','KeyD']))UI.sel=Math.min(L.length-1,UI.sel+1);
  if(press(['ArrowUp','KeyW']))UI.sel=Math.max(0,UI.sel-GCOLS);if(press(['ArrowDown','KeyS']))UI.sel=Math.min(L.length-1,UI.sel+GCOLS);
  m21BagKeys(inp);if(!it){if(press(['KeyI','Escape']))m2CloseUI();return}
  if(press(['KeyJ','Enter','Space'])||act==='eq')bagEquip(it);
  if(press(['KeyX'])||act==='sell')bagSell(it,'sell');if(press(['KeyC'])||act==='dis')bagSell(it,'dis');
  if(press(['KeyI','Escape']))m2CloseUI()}
function bagEquip(it){if(isEq(it))return;SAVE.eq[it.t]=it.id;calcGS();sfx('ready',0.4);UI.msg=['已裝備 '+itName(it),performance.now()];m2Save()}
function bagSell(it,how){if(isEq(it))return;if(it.r>=4&&!(UI.conf&&UI.conf[0]===it.id&&UI.conf[1]===how&&UI.conf[2])){UI.conf=[it.id,how,false];return}UI.conf=null;
  SAVE.inv=SAVE.inv.filter(i=>i!==it);if(how==='sell'){const p=sellPrice(it);SAVE.gold+=p;if(S0)S0.gold=SAVE.gold;UI.msg=[`賣出 ${itName(it)}　+${p} 金幣`,performance.now()];sfx('coin',0.4)}
  else{SAVE.shards+=RAR[it.r].sh;UI.msg=[`分解 ${itName(it)}　刻印碎片 +${RAR[it.r].sh}`,performance.now()];sfx('clank',0.4)}m2Save()}
// ---------- forge (搗蛋鬼 / 貓商人) ----------
function enhCost(n,npc){const E=ENH[n],N=NPCS[npc];return{gold:Math.round(E[2]*N.gold),sh:E[3],rate:Math.min(100,E[0]+N.rate),pity:E[1]}}
function forgeTry(it,npc){const SL=SAVE.slot;const n=SL.e+1;if(n>15)return;const c=enhCost(n,npc);if(SAVE.gold<c.gold){UI.msg=['金幣不夠',performance.now()];return}if(SAVE.shards<c.sh){UI.msg=['刻印碎片不夠（分解裝備可以得到）',performance.now()];return}
  SAVE.gold-=c.gold;SAVE.shards-=c.sh;if(S0)S0.gold=SAVE.gold;const p=SL.pity[n]||0;const sure=c.pity>0&&p>=c.pity;const ok=sure||Math.random()*100<c.rate;
  if(ok){SL.e=n;delete SL.pity[n];sfx('crit',0.5)}else{SL.pity[n]=p+1;sfx('clank',0.5)}
  UI.res={ok,lv:n,t0:performance.now(),sure};calcGS();m2Save()}
function npcPortrait(npc,x,y){const im=IMG[NPCS[npc].big];if(!im||!im.width)return;const sc=npc==='cat'?2.4:1.6;X.save();X.imageSmoothingEnabled=false;X.drawImage(im,Math.round(x-im.width*sc/2),Math.round(y-im.height*sc),im.width*sc,im.height*sc);X.restore()}
function woodPanel(x0,y0,x1,y1){rrect(x0,y0,x1,y1,12,'rgb(96,62,34)','rgb(48,28,14)',4);for(let y=y0+8;y<y1-6;y+=18){X.fillStyle=(y/18)%2?'rgba(70,44,22,0.5)':'rgba(120,80,44,0.35)';X.fillRect(x0+6,y,x1-x0-12,9)}rrect(x0+14,y0+14,x1-14,y1-14,8,'rgba(30,20,14,0.78)','rgb(170,120,60)',2)}
function forgeUI(inp){const npc=UI.npc||'prank',N=NPCS[npc];woodPanel(110,70,1170,660);
  npcPortrait(npc,250,420);rrect(140,436,360,470,8,'rgba(0,0,0,0.6)',rgb(GOLDC),1);T(N.name,250,454,FS(20),[255,236,200],2,[0,0,0],'mm');
  // bubble
  {const segs=N.line;const f=FS(17);const lines=[];let cur=[],w=0;for(const [tx,c] of segs)for(const ch of tx){const cw=tw(ch,f);if(w+cw>196){lines.push(cur);cur=[];w=0}cur.push([ch,c]);w+=cw}lines.push(cur);
    rrect(140,96,364,108+lines.length*26+8,10,'rgba(255,253,245,0.97)','rgb(70,50,40)',2);lines.forEach((ln,i)=>{let x=154;for(const [ch,c] of ln){T(ch,x,120+i*26,f,c||[60,40,30],c?2:0,[90,40,0],'lm');x+=tw(ch,f)}})}
  {const TB=m21Tabs(npc);const tabs=TB.map(x=>x[0]);tabs.forEach((tb,i)=>{const on=UI.kind===TB[i][1];const TW=tabs.length>3?128:150;const x=400+i*TW;rrect(x,86,x+TW-8,120,8,on?'rgb(150,90,30)':'rgb(60,40,24)',on?'rgb(255,236,150)':'rgb(150,120,70)',2);T(tb,x+(TW-8)/2,104,FS(tabs.length>3?17:19),on?[255,244,214]:[190,170,140],2,[0,0,0],'mm');
    if(inp&&CLICK&&inBox(CLICK,[x,86,x+TW-8,120])){UI.kind=TB[i][1];UI.msg=null;UI.A=UI.B=null}});T('Tab',400+tabs.length*(tabs.length>3?128:150)+4,104,FN(14),[200,190,170],2,[0,0,0],'lm')}
  if(UI.kind==='draw')return drawUI(inp);if(UI.kind==='rr'||UI.kind==='inh'||UI.kind==='up')return m21SmithUI(inp);
  const it=eqItem('w');if(!it)return;const SE=SAVE.slot.e;
  T('武器欄強化',400,150,FS(26),[255,236,200],3,[0,0,0],'lm');T('強化等級屬於武器欄：換武器也保留',1140,150,FN(15),[220,210,190],2,[0,0,0],'rm');
  gearCard(it,400,176,84,false);T(RAR[it.r].st+itName(it),500,204,FS(24),RAR[it.r].col,2,[0,0,0],'lm');T(`武器欄 +${SE}（目前裝備）`,500,236,FN(15),[255,170,120],2,[0,0,0],'lm');
  const n=SE+1;const [a0,a1]=wRange(it);
  if(n>15){T('已達最高強化 +15',640,380,FS(30),[255,200,90],3,[0,0,0],'mm')}
  else{const [b0,b1]=wRange(it,n);const c=enhCost(n,npc);const p=SAVE.slot.pity[n]||0;
    // left rows
    rrect(400,284,760,560,10,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);
    T(`+${SE}`,470,320,FS(30),[255,255,255],3,[0,0,0],'mm');T('▶',560,320,FS(26),[255,200,90],2,[0,0,0],'mm');T(`+${n}`,650,320,FS(30),n>=10?[255,170,60]:[120,200,255],3,[0,0,0],'mm');
    T('攻擊力',420,372,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${a0}~${a1}  ▶  ${b0}~${b1}`,740,372,FN(17),[255,255,255],2,[0,0,0],'rm');
    T('攻擊加成',420,404,FN(17),[214,172,84],2,[0,0,0],'lm');T(`+${Math.round(enhAtk(SE)*100)}%  ▶  +${Math.round(enhAtk(n)*100)}%`,740,404,FN(17),[255,255,255],2,[0,0,0],'rm');
    if(n>10){T('暴擊傷害',420,436,FN(17),[214,172,84],2,[0,0,0],'lm');T(`+${Math.round(enhCdmg(SE)*100)}%  ▶  +${Math.round(enhCdmg(n)*100)}%`,740,436,FN(17),[255,255,255],2,[0,0,0],'rm')}
    const en=enchOf(n);if(en){T('賦魔',420,468,FN(17),[255,170,90],2,[0,0,0],'lm');T(`${en[0]}% 機率 +${en[1]}%`,740,468,FN(17),[255,200,140],2,[0,0,0],'rm')}
    T('失敗不會降級・強化等級與保底都存在武器欄',420,536,FN(13),[190,180,160],2,[0,0,0],'lm');
    // right
    rrect(780,170,1140,560,10,'rgba(0,0,0,0.35)','rgba(214,172,84,0.5)',1);T('刻印強化',960,200,FS(24),[255,236,200],3,[0,0,0],'mm');
    T(`強化至 +${n}：成功或失敗都會扣下面的${c.sh?'碎片和':''}金幣`,960,236,FN(15),[220,210,190],2,[0,0,0],'mm');
    T('成功機率',800,284,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.rate}%`+(N.rate&&ENH[n][0]<100?`（${ENH[n][0]}% +${N.rate}）`:''),1120,284,FN(20),c.rate>=50?[150,255,150]:[255,200,120],2,[0,0,0],'rm');
    T('刻印能量',800,326,FN(17),[214,172,84],2,[0,0,0],'lm');const f=c.pity?clamp(p/c.pity,0,1):0;rrect(900,316,1120,338,6,'rgba(0,0,0,0.6)','rgb(120,100,70)',1);if(f>0)rrect(902,318,902+216*f,336,5,f>=1?'rgb(255,190,60)':'rgb(110,180,255)');
    T(c.pity?`${p}/${c.pity}`:'—',1010,327,FN(13),[255,255,255],2,[0,0,0],'mm');if(c.pity&&p>=c.pity)T('能量已滿：下次必定成功！',960,360,FN(15),[255,210,90],2,[0,0,0],'mm');
    T('刻印碎片',800,396,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.sh}（持有 ${SAVE.shards}）`,1120,396,FN(17),SAVE.shards>=c.sh?[255,255,255]:[255,120,110],2,[0,0,0],'rm');
    T('金幣',800,430,FN(17),[214,172,84],2,[0,0,0],'lm');T(`${c.gold.toLocaleString('en-US')}（持有 ${SAVE.gold.toLocaleString('en-US')}）`,1120,430,FN(17),SAVE.gold>=c.gold?[255,226,120]:[255,120,110],2,[0,0,0],'rm');
    if(npc==='cat')T('貓商人：金幣 7 折、成功率 +2%',960,462,FN(14),[255,170,60],2,[0,0,0],'mm');
    const busy=UI.res&&performance.now()-UI.res.t0<1100;const can=!busy&&SAVE.gold>=c.gold&&SAVE.shards>=c.sh;
    if(btn(840,492,1080,540,c.sh?`強化（碎片 ${c.sh}＋金幣）`:`強化（${c.gold.toLocaleString('en-US')} 金幣）`,can,[255,200,90])&&inp)forgeTry(it,npc);
    if(inp&&!busy&&press(['KeyJ','Enter','Space']))forgeTry(it,npc)}
  if(UI.msg&&performance.now()-UI.msg[1]<1600)T(UI.msg[0],960,586,FS(18),[255,160,120],2,[0,0,0],'mm');
  T('J/Enter 強化　Tab 切換分頁　Esc 離開',640,636,FN(14),[200,190,170],2,[0,0,0],'mm');
  if(UI.res)forgeBurst(UI.res);
}
function forgeBurst(r){const age=(performance.now()-r.t0)/1000;if(age>1.6)return;const a=age<1.2?1:(1.6-age)/0.4;const cx=640,cy=360;const gold=r.lv>=10;
  X.save();X.globalAlpha=a*0.55;X.fillStyle='#000';X.fillRect(110,70,1060,590);X.restore();
  if(r.ok){const col=gold?[255,170,50]:[90,170,255];for(let i=0;i<16;i++){const an=i/16*Math.PI*2+age*0.8,len=80+Math.min(1,age/0.3)*170;X.save();X.globalAlpha=a*0.7;X.strokeStyle=rgb(col);X.lineWidth=6;X.beginPath();X.moveTo(cx+Math.cos(an)*40,cy+Math.sin(an)*40);X.lineTo(cx+Math.cos(an)*len,cy+Math.sin(an)*len);X.stroke();X.restore()}
    X.save();X.globalAlpha=a;circ(cx,cy,60+20*Math.sin(age*10),rgb(col,0.5),rgb([255,255,255]),3);X.restore();
    // trophy
    X.save();X.globalAlpha=a;X.fillStyle='rgb(255,210,80)';X.fillRect(cx-22,cy-30,44,34);X.fillRect(cx-8,cy+4,16,14);X.fillRect(cx-20,cy+18,40,8);X.fillStyle='rgb(255,240,170)';X.fillRect(cx-16,cy-26,8,24);X.restore();
    T(`+${r.lv} 強化成功`+(r.sure?'（保底）':''),cx,cy+110,FS(38),gold?[255,200,80]:[150,210,255],4,[0,0,0],'mm',a)}
  else{X.save();X.globalAlpha=a;const sh=age<0.3?Math.round(Math.sin(age*80)*6):0;X.fillStyle='rgb(90,90,100)';X.fillRect(cx-50+sh,cy-10,100,22);X.fillRect(cx-20+sh,cy+12,40,20);X.fillRect(cx-40+sh,cy+32,80,12);X.fillStyle='rgb(140,140,150)';X.fillRect(cx-50+sh,cy-10,100,5);X.restore();
    T(`+${r.lv} 強化失敗`,cx,cy+110,FS(38),[200,200,210],4,[0,0,0],'mm',a);T('刻印能量 +1',cx,cy+150,FN(18),[110,180,255],2,[0,0,0],'mm',a)}}
// ---------- cat draw ----------
function drawRoll(){let r=Math.random()*100;for(const [k,w] of DRAW_ODDS){if((r-=w)<0)return k}return 1}
function drawOne(){const n=S0&&S0.npc;const used=n?n.draws:UI.drawsAlt||0;if(used>=DRAW_MAX){UI.msg=['這次相遇的抽獎次數用完了喵',performance.now()];return}if(SAVE.gold<DRAW_COST){UI.msg=['金幣不夠喵',performance.now()];return}
  if(SAVE.inv.length>=80){UI.msg=['背包滿了喵',performance.now()];return}
  SAVE.gold-=DRAW_COST;if(S0)S0.gold=SAVE.gold;if(n)n.draws++;else UI.drawsAlt=used+1;const r=drawRoll();const pool=[...WPN.map((_,k)=>['w',k]),...ARMS.flatMap(t=>GEAR[t].map((_,k)=>[t,k]))];const [t,k]=pool[Math.floor(Math.random()*pool.length)];
  const it=mkItem(t,k,r);SAVE.inv.push(it);UI.drawn.push(it);UI.rev={it,t0:performance.now()};sfx(r>=3?'crit':'coin',0.5);m2Save()}
function drawUI(inp){const n=S0&&S0.npc;const used=n?n.draws:UI.drawsAlt||0;
  T('金幣抽裝備',400,150,FS(26),[255,236,200],3,[0,0,0],'lm');T(`每次 ${DRAW_COST.toLocaleString('en-US')} 金幣・每次相遇最多 ${DRAW_MAX} 抽（剩 ${DRAW_MAX-used}）`,1140,150,FN(15),[255,170,60],2,[0,0,0],'rm');
  T('獎池：武器 9 種＋衣服/褲子/鞋子/戒指/項鍊 各 5 種（共 34 種，平均抽中）',400,186,FN(15),[220,210,190],2,[0,0,0],'lm');
  DRAW_ODDS.forEach(([k,w],i)=>{const x=400+i*185;rrect(x,206,x+175,240,8,rgb(RAR[k].bg),rgb(RAR[k].fr),2);T(`${RAR[k].n} ${RAR[k].st}　${w}%`,x+88,224,FS(17),RAR[k].col,2,[0,0,0],'mm')});
  // reveal
  const rv=UI.rev;if(rv){const age=(performance.now()-rv.t0)/1000;const u=clamp(age/0.5,0,1);const w=Math.max(4,Math.round(160*Math.abs(Math.cos(Math.PI*(1-u)/2))));const cx=560,cy=380;
    if(u<1){rrect(cx-w/2,cy-110,cx+w/2,cy+110,10,'rgb(60,40,24)','rgb(214,172,84)',3)}else{const R=RAR[rv.it.r];X.save();X.globalAlpha=0.4+0.2*Math.sin(age*6);circ(cx,cy,130,rgb(R.fr,0.5),null);X.restore();rrect(cx-80,cy-110,cx+80,cy+110,10,rgb(R.bg),rgb(R.fr),4);gearCard(rv.it,cx-48,cy-90,96,false);
      T(R.st+itName(rv.it),cx,cy+40,FS(19),R.col,2,[0,0,0],'mm');T(R.n,cx,cy+70,FN(15),R.col,2,[0,0,0],'mm')}
    if(u>=1)itemDetail(rv.it,700,270,1140)}
  else T('按 J 抽一次',640,390,FS(28),[255,236,200],3,[0,0,0],'mm');
  T('這次抽到：',400,540,FN(15),[214,172,84],2,[0,0,0],'lm');UI.drawn.slice(-5).forEach((it,i)=>gearCard(it,490+i*64,520,52,false));
  const can=used<DRAW_MAX&&SAVE.gold>=DRAW_COST;const busy=rv&&performance.now()-rv.t0<500;
  if(btn(860,520,1140,568,`抽一次（${DRAW_COST.toLocaleString('en-US')} 金幣）`,can&&!busy,[255,170,60])&&inp)drawOne();
  if(UI.msg&&performance.now()-UI.msg[1]<1600)T(UI.msg[0],1000,594,FS(18),[255,160,120],2,[0,0,0],'mm');
  T(`持有金幣 ${SAVE.gold.toLocaleString('en-US')}　J 抽一次　Tab 強化　Esc 離開`,640,636,FN(14),[200,190,170],2,[0,0,0],'mm');
  if(inp&&!busy&&press(['KeyJ','Enter','Space']))drawOne()}
// ---------- overlay dispatcher ----------
function m2Overlay(){const inp=!UI.fresh;UI.fresh=false;if(!UI.kind)return;
  if(UI.kind==='bag')m21Bag(inp);else if(UI.kind==='set')m21SetUI(inp);else forgeUI(inp);
  if(inp&&UI.kind&&UI.kind!=='bag'){if(press(['Tab'])){const TB=m21Tabs(UI.npc).map(x=>x[1]);UI.kind=TB[(TB.indexOf(UI.kind)+1)%TB.length];UI.msg=null;UI.conf=null}if(press(['Escape']))m2CloseUI()}
  if(!UI.kind&&mode==='play')paused=false}
// ---------- dev / test hooks ----------
window.__m2={ui:(k,n)=>{if(mode==='play'){paused=true;pauseWhy=k==='bag'?'bag':'npc'}m2UI(k,n)},close:()=>m2CloseUI(),give:(g,sh)=>{SAVE.gold+=g||0;SAVE.shards+=sh||0;if(S0)S0.gold=SAVE.gold},
  item:(t,k,r,e)=>{const it=mkItem(t,k,r);it.e=0;if(t==='w'&&e)SAVE.slot.e=e;SAVE.inv.push(it);return it.id},equip:id=>{const it=invItem(id);if(it){SAVE.eq[it.t]=it.id;calcGS()}},begin:(st,d)=>m2Begin(st,d||0),
  go:n=>setStage(n,{x:n==='b4boss'?260:300}),draw:()=>drawOne(),forge:()=>{const it=eqItem('w');forgeTry(it,UI.npc||'prank')},sel:i=>{UI.sel=i},save:()=>SAVE,
  b4:k=>{const b=S0.boss;if(b&&b.b4){b.atk=null;b.kneelUntil=-9;b4Attack(k)}},map:()=>m2OpenMap(),clear:a=>{SAVE.clear=a;m2Save()},bonus:(st,d)=>m2Begin(st||1,d||0,true)};
