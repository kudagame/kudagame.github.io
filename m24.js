// M2.4（自動產生，請改 src24/）
// ---- src24/a_rar.js
// ---------- M2.4 稀有度：精良 ★2（青）、夢幻 ★5（粉）、傳說 ★6（橙） ----------
// 規格：design/weapons_rarity.md 第 3 階段（方案 A）
const M24={force:null,v:'M2.4'};
Object.assign(RAR[2],{n:'精良',col:[110,230,220],fr:[40,180,170],bg:[16,62,64]});
Object.assign(RAR[3],{col:[120,170,255],fr:[60,120,255],bg:[22,40,110]});
RAR[5]={n:'夢幻',st:'★5',sc:1.26,ln:4,el:0.15,col:[255,150,210],fr:[240,90,170],bg:[70,18,52],w:0,sell:3200,sh:16};
RAR[6]={n:'傳說',st:'★6',sc:1.33,ln:4,el:0.18,col:[255,184,70],fr:[255,140,20],bg:[76,36,6],w:0,sell:7000,sh:30};
// 詞條倍率：自然掉落 夢幻 ×1.1、傳說 ×1.25；品階提升把倍率記在 it.lm（重洗用 it.lm，所以加成不會被洗掉，★1～★4 也一樣）
const LMN=[1,1,1,1,1,1.1,1.25];
const lmOf=it=>Math.max(it&&it.lm||1,LMN[it?it.r:0]||1);
// 掉落權重：菁英／地獄／深淵
// W1：夢幻、傳說權重 ×1.2（原 0.7/0.05、1.5/0.2、2.6/0.5），保底 40/120 → 35/100
Object.assign(DIFFS[2],{pk:0.84,og:0.06});Object.assign(DIFFS[3],{pk:1.8,og:0.24});Object.assign(DIFFS[4],{pk:3.12,og:0.6});
const PITY={pk:35,og:100};
function rarWeights(D,minR){const p=D.pur,wb=D.wb||[60,28],up=D.sh?1+D.sh*0.5:1;return [[0,wb[0]],[1,wb[1]],[2,7*up],[3,3*up],[4,p],[5,D.pk||0],[6,D.og||0]].filter(x=>x[0]>=minR&&x[1]>0)}
window.rollRar=(minR=0)=>{if(M24.force!=null){const f=M24.force;M24.force=null;return f}const ws=rarWeights(DIF(),minR);let tot=ws.reduce((a,b)=>a+b[1],0),r=Math.random()*tot;for(const [k,w] of ws){if((r-=w)<0)return k}return minR};
function rarPct(D,r,minR=0){const ws=rarWeights(D,minR),tot=ws.reduce((a,b)=>a+b[1],0),x=ws.find(w=>w[0]===r);return x?x[1]/tot*100:0}
window.purPct=D=>{const a=rarPct(D,4).toFixed(1);if(!D.pk)return a;return `${a}%　夢幻 ${rarPct(D,5).toFixed(2)}%　傳說 ${rarPct(D,6).toFixed(2)}`};
// mkItem：r≥5 的下限 ×1.1、詞條倍率、符文分級
window.mkItem=(o=>(t,k,r,sv)=>{const it=o(t,k,r,sv);if(r>=5){const [n,lo,hi]=baseOf(it);const R=RAR[r];
    if(t==='w'){it.lo=Math.round(lo*R.sc*1.1);it.hi=Math.round(hi*R.sc)}
    it.lines=it.lines.map(([id,v])=>[id,Math.max(0.1,Math.round(v*LMN[r]*10)/10)]);
    const g=r===6?0:(Math.random()<0.6?0:1);it.rune={n:rollRune(t),g}}
  it.lm=LMN[r]||1;return it})(window.mkItem);
// 保底（存檔 SAVE.pity，跨關卡）
function m24Pity(){if(!SAVE.pity||typeof SAVE.pity!=='object')SAVE.pity={pk:0,og:0};return SAVE.pity}
window.rollDrop=(o=>minR=>{const it=o(minR);if(it&&it.r>=5){const p=m24Pity();if(it.r===5)p.pk=0;else p.og=0}return it})(window.rollDrop);
window.m2BossLoot=(o=>function(m){if(!isMSsafe()&&RUN.d>=2){const p=m24Pity();p.pk++;if(RUN.d>=3)p.og++;
    if(RUN.d>=3&&p.og>=PITY.og)M24.force=6;else if(p.pk>=PITY.pk)M24.force=5}
  try{return o.apply(this,arguments)}finally{M24.force=null}})(window.m2BossLoot);
function isMSsafe(){try{return typeof isMS==='function'&&isMS()}catch(e){return false}}
// 地上掉落：傳說有專屬音效
window.lootPush=(o=>(k,m,extra)=>{const r=o(k,m,extra);if(k==='gear'&&extra&&extra.it&&extra.it.r>=6){sfx('summon',0.5);setTimeout(()=>sfx('crit',0.5),120)}return r})(window.lootPush);
window.m2GotGear=(o=>it=>{o(it);if(it&&it.r>=5){const s=S0;if(s)s.dmg.push({t:s.t,x:s.P.x,y:s.P.y-260,v:0,label:RAR[it.r].n+'！',zero:true})}})(window.m2GotGear);
// 賣掉／分解確認：依稀有度顯示
window.m21Bag=function(inp){const c=UI.conf;const modal=c&&!c[2];bagUI(inp&&!modal);if(!modal)return;const it=invItem(c[0]);if(!it){UI.conf=null;return}
  X.save();X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(0,0,W,H);X.restore();panelBG(380,230,900,470);const sell=c[1]==='sell';const R=RAR[it.r];
  T(`確定要${sell?'賣掉':'分解'}這件${R.n}${it.sp?'特殊武器':'裝'}？`,640,270,FS(24),[255,236,200],3,[0,0,0],'mm');gearCard(it,410,300,72,false);T(R.st+itName(it),500,320,FS(20),R.col,2,[0,0,0],'lm');
  T(sell?`得到 ${sellPrice(it).toLocaleString('en-US')} 金幣`:`得到 刻印碎片 ×${R.sh}`,500,354,FN(16),[255,226,120],2,[0,0,0],'lm');T('這個動作無法復原',500,382,FN(14),[255,160,140],2,[0,0,0],'lm');
  const ok=btn(460,410,620,452,sell?'賣掉（J）':'分解（J）',true,[255,120,90]),no=btn(660,410,820,452,'取消（Esc）',true);
  if(!inp)return;if(ok||press(['KeyJ','Enter'])){c[2]=true;bagSell(it,c[1]);UI.conf=null}else if(no||press(['Escape','KeyI'])){UI.conf=null}};
// ---------- 品階提升：英雄→夢幻（6%、保底 14）；夢幻→傳說不開放；特殊武器不能提升、不能當祭品 ----------
UPG[4]={to:5,sh:120,g:300000,rate:6,pity:14};
const colOf2=r=>r===1?'g':r===2||r===3?'b':r===4?'p':r===5?'k':r===6?'o':'w';
const FAMN={g:'高級（綠）',b:'精良／稀有（青・藍）',p:'英雄（紫）',k:'夢幻（粉）'};
window.m21Cands=function(){const k=UI.kind,A=UI.A&&invItem(UI.A);const all=SAVE.inv;
  if(UI.foc!=='B'||!A){if(k==='up')return all.filter(i=>UPG[i.r]&&!i.sp);return all}
  if(k==='inh')return all.filter(i=>i.t===A.t&&i.id!==A.id&&i.rune&&!isEq(i));
  if(k==='up'){if(!UPG[A.r]||A.sp)return [];const to=UPG[A.r].to;return all.filter(i=>i.t===A.t&&i.id!==A.id&&!isEq(i)&&!i.sp&&colOf2(i.r)===colOf2(to))}return []};
window.m21UpPreview=function(A){const U=UPG[A.r];if(!U||A.sp)return null;const P=m21Clone(A);const k=RAR[U.to].sc/RAR[A.r].sc;P.r=U.to;
  // 下限 ×1.1 只在第一次進到 ★4 以上時乘（英雄→夢幻不重乘）
  const lb=U.to>=4&&A.r<4?1.1:1;
  if(P.t==='w'){P.lo=Math.round(A.lo*k*lb);P.hi=Math.round(A.hi*k)}else{P.v=Math.round(A.v*k*10)/10;if(A.v2!=null)P.v2=Math.round(A.v2*k*10)/10}
  const lk=U.to===5?1.1:1.25;P.lines=A.lines.map(([id,v])=>[id,Math.round(v*lk*10)/10]);P.lm=Math.round((A.lm||1)*lk*1e4)/1e4;
  if(P.rune&&RUNES[P.rune.n]&&RUNES[P.rune.n][3]!=='j')P.rune.g=Math.max(0,P.rune.g-1);return P};
window.m21Up=function(inp,A,B){m21Sum(A,400,318,230,'A 目前');m21Sum(B,610,318,230,'B 祭品（會消耗）');const P=A&&m21UpPreview(A);const NPH=P?Math.max(0,RAR[P.r].ln-P.lines.length):0;if(P){P.__ph=NPH;if(P.t==='w'&&!P.el)P.__phel=1;if(A.rune&&P.rune&&P.rune.g!==A.rune.g)P.__ru=[A.rune.g,P.rune.g]}m21Sum(P,880,318,260,'成功後的 A');T('→',860,420,FS(28),[255,236,150],3,[0,0,0],'mm');
  if(!A)return;if(A.sp){T('特殊武器不能提升品階（能力固定，避免手滑餵掉）',640,560,FN(14),[255,190,140],2,[0,0,0],'lm');return}
  const U=UPG[A.r];if(!U){T(A.r>=5?'夢幻 → 傳說 不開放：傳說只能打出來':'只有 綠／青／藍／紫 色裝備可以提升',640,560,FN(14),[255,190,140],2,[0,0,0],'lm');return}
  const p=(A.upP||0);const sure=p>=U.pity;T(`成功率 ${U.rate}%　保底 ${p}/${U.pity}${sure?'（下次必成功）':''}　失敗：A 不會壞、祭品消耗、保底 +1`,640,556,FN(14),sure?[255,210,90]:[255,190,140],2,[0,0,0],'lm');
  T(`祭品：同部位的${FAMN[colOf2(U.to)]}裝備（特殊武器不行）`,640,576,FN(12),[220,210,190],2,[0,0,0],'lm');
  if(NPH>0)T(`成功時另外抽 ${NPH} 條隨機詞條`,1140,302,FN(13),[150,230,255],2,[0,0,0],'rm');
  const ok=A&&B&&B.t===A.t&&!B.sp&&colOf2(B.r)===colOf2(U.to);if((btn(640,592,1140,636,`提升（碎片 ${U.sh}＋${U.g.toLocaleString('en-US')} 金幣）`,!!ok,[255,170,60])&&inp)||(ok&&inp&&press(['Space']))){if(isEq(B)){UI.msg=['裝備中的不能當祭品',performance.now()];return}if(!m21Pay(U.sh,U.g))return;
    SAVE.inv=SAVE.inv.filter(i=>i!==B);UI.B=null;const win=sure||Math.random()*100<U.rate;
    if(win){const Pv=m21UpPreview(A);Object.assign(A,Pv);A.upP=0;while(RAR[A.r].ln>A.lines.length){const pool=LINES.filter(l=>!(A.t==='r'&&l[0]==='crit')&&!A.lines.some(x=>x[0]===l[0]));if(!pool.length)break;const L=RCH(pool);A.lines.push([L[0],Math.max(0.1,Math.round(RR(L[2],L[3])*(A.t==='w'?1:LSC)*lmOf(A)*10)/10)])}
      if(A.t==='w'&&!A.el)A.el=RCH(Object.keys(ELS));UI.msg=[`品階提升成功！${RAR[A.r].n} ${RAR[A.r].st}`,performance.now(),[255,220,120]];sfx('crit',0.6)}
    else{A.upP=p+1;UI.msg=[`提升失敗（保底 ${A.upP}/${U.pity}）`,performance.now(),[255,160,140]];sfx('clank',0.5)}
    UI.res2={ok:win,t0:performance.now(),it:A,gold:true,txt:win?'品階提升成功':'品階提升失敗'};calcGS();m2Save()}};
// ---------- 重洗刻印：價格依稀有度、套用 it 的詞條倍率；傳說符文固定紫 ----------
const RRP={5:[{sh:5,g:5000},{sh:10,g:12000}],6:[{sh:8,g:9000},{sh:15,g:20000}]};
const rrCost=(A,line)=>RRP[A.r]?RRP[A.r][line?0:1]:(line?RR_LINE:RR_RUNE);
window.m21RR=function(inp,A){m21Sum(A,400,318,330,'目前');if(!A){T('先從上面選一件裝備（點兩下或 Enter）',900,420,FN(15),[220,210,190],2,[0,0,0],'mm');return}
  const rows=A.lines.map((l,i)=>['line',i]);if(A.rune||A.r>=1)rows.push(['rune']);if(!rows.length){T('這件白裝沒有詞條或符文可以重洗',950,420,FN(15),[220,210,190],2,[0,0,0],'mm');return}UI.rsel=clamp(UI.rsel||0,0,rows.length-1);
  T('選擇要重洗的項目：',760,314,FN(14),[214,172,84],2,[0,0,0],'lm');
  rows.forEach((r,i)=>{const y=330+i*40;const on=i===UI.rsel;let txt;if(r[0]==='line'){const [id,v]=A.lines[r[1]];const L=LINES.find(l=>l[0]===id);txt=`詞條：${L[1]} +${v}%`}else txt=A.rune?`符文：${A.rune.n}`:'符文：（無）→ 加一顆';
    if(btn(760,y,1140,y+34,(on?'▶ ':'')+txt,true,on?[255,236,150]:null)&&inp)UI.rsel=i});
  const r=rows[UI.rsel];const cost=rrCost(A,r[0]==='line');const lm=lmOf(A);const pool=r[0]==='line'?LINES.filter(l=>!((A.t==='r')&&l[0]==='crit')&&!A.lines.some((x,j)=>x[0]===l[0]&&j!==r[1])).map(l=>l[1]):Object.keys(RUNES).filter(n=>RUNES[n][0].includes(A.t)&&RUNES[n][3]!=='j'&&!(RUNES[n][4]&&RUNES[n][4].bard&&heroCls()!=='b'));
  const y2=330+rows.length*40+6;T(`之後：從這些隨機抽一個（數值也隨機${r[0]==='line'&&lm>1?`，套用倍率 ×${lm.toFixed(2)}`:''}${r[0]==='rune'&&A.r===6?'，傳說固定紫符文':''}）`,760,y2,FN(13),[200,190,170],2,[0,0,0],'lm');
  wrapT(pool.join('、')+(r[0]==='rune'?'（另有 6% 是搞笑符文）':''),FN(13),380).slice(0,4).forEach((l,i)=>T(l,760,y2+20+i*18,FN(13),[150,230,255],2,[0,0,0],'lm'));
  if(A.sp)T('※ 特殊能力不在重洗清單裡，不會被洗掉',760,y2+96,FN(12),[255,190,140],2,[0,0,0],'lm');
  if((btn(760,596,1140,636,`重洗（碎片 ${cost.sh}＋${cost.g.toLocaleString('en-US')} 金幣）`,true,[255,200,90])&&inp)||(inp&&press(['Space']))){if(!m21Pay(cost.sh,cost.g))return;
    if(r[0]==='line'){const pk=RCH(pool),L=LINES.find(l=>l[1]===pk);const ls=A.t==='w'?1:LSC;A.lines[r[1]]=[L[0],Math.max(0.1,Math.round(RR(L[2],L[3])*ls*lm*10)/10)];UI.msg=[`新詞條：${L[1]} +${A.lines[r[1]][1]}%`,performance.now()]}
    else{const g=A.r===6?0:A.rune?A.rune.g:(Math.random()<0.15?0:Math.random()<0.41?1:2);A.rune={n:rollRune(A.t),g};UI.msg=[`新符文：${A.rune.n}`,performance.now(),RUNES[A.rune.n][3]==='j'?[255,150,200]:null]}
    sfx('crit',0.4);calcGS();m2Save()}};
// ---------- 賦魔繼承：A 或 B 是 ★5 以上 → 碎片 12＋20,000 ----------
window.m21Inh=(o=>(inp,A,B)=>{const hi=(A&&A.r>=5)||(B&&B.r>=5);const sv=[INH.sh,INH.g];if(hi){INH.sh=12;INH.g=20000}try{return o(inp,A,B)}finally{INH.sh=sv[0];INH.g=sv[1]}})(window.m21Inh);

// ---- src24/b_icons.js
// ---------- M2.4 圖示修正：樂器 9 階都不一樣、魯特琴／曼陀林分得出來、大劍 第 1／第 4 階換色 ----------
// 大劍 第 4 階「灰岩重劍」：改成暖色花崗岩（原本跟第 1 階的鋼色太像）
BLADE[3]=[[62,46,38],[106,84,66],[150,124,98],[192,166,134],[230,212,182]];
// 樂器：外型 k%4（魯特琴／豎琴／曼陀林／七弦琴），材質依階級：旅人（1～4）＝原木＋黃銅、精製（5～8）＝深色拋光木＋銀＋各自的鑲嵌色、名匠（9）＝黑檀＋金＋寶石
const IWD=[[[70,38,22],[124,72,38],[176,112,58],[222,164,96]],[[64,40,24],[112,70,40],[160,108,62],[206,156,100]],[[80,30,26],[134,58,44],[184,94,64],[226,146,104]],[[60,56,64],[104,98,110],[150,144,156],[204,198,210]],
  [[40,18,14],[86,36,26],[132,62,40],[178,98,66]],[[30,30,46],[60,58,86],[96,92,130],[150,146,186]],[[26,40,24],[52,78,46],[86,120,70],[138,170,110]],[[46,24,48],[86,46,92],[128,76,132],[178,124,180]],[[14,12,16],[34,30,38],[60,54,66],[96,88,104]]];
const IMT={brass:[[120,80,20],[200,150,40],[250,210,90],[255,245,190]],silver:[[70,76,90],[130,140,160],[190,200,215],[245,250,255]],gold:[[140,70,10],[230,150,30],[255,215,80],[255,250,200]]};
const IAC=[null,null,null,null,[90,220,210],[150,200,255],[255,120,120],[255,200,90],[255,80,170]];
const SPRUCE=[[150,110,60],[200,160,96],[232,200,140],[250,232,190]];
function m24Instr(px,k){const shp=k%4,tierG=k>=8?2:k>=4?1:0,WD=IWD[k],G=tierG===2?IMT.gold:tierG===1?IMT.silver:IMT.brass,AC=IAC[k],OL=[24,14,14];
  const ell=(cx,cy,rx,ry,fn)=>{for(let yy=0;yy<20;yy++)for(let xx=0;xx<20;xx++){const u=(xx+0.5-cx)/rx,v=(yy+0.5-cy)/ry,d=u*u+v*v;if(d<=1)fn(xx,yy,u,v,d)}};
  const shade=(P,u,v,d)=>d>0.66?P[0]:(u+v)<-0.55?P[3]:(u+v)<0.15?P[2]:P[1];
  if(shp===0){// 魯特琴：大圓肚、琴頸往右上、弦栓箱往後折成「ㄱ」、雕花響孔（一圈亮點）
    for(let i=0;i<7;i++){const nx=11+i,ny=8-i;px(nx,ny,WD[1]);px(nx,ny+1,WD[0]);px(nx-1,ny,WD[2])}
    px(17,1,WD[2]);px(18,2,WD[1]);px(18,3,WD[0]);px(19,3,OL);px(17,2,G[2]);px(18,1,G[1]);px(19,2,G[2]);// 往後折的弦栓箱
    ell(8,12.5,5.8,5.4,(x,y,u,v,d)=>px(x,y,shade(WD,u,v,d)));
    for(const [x,y] of [[7,11],[8,11],[9,12],[9,13],[8,14],[7,14],[6,13],[6,12]])px(x,y,AC||WD[3]);px(7,12,OL);px(8,12,OL);px(7,13,OL);px(8,13,[60,30,20]);
    for(let i=0;i<5;i++)px(4+i,17-i,G[3]);px(4,17,G[1]);px(5,17,G[1]);
    if(tierG)for(const [x,y] of [[3,9],[13,15]])px(x,y,G[3]);if(tierG===2){px(8,17,[255,90,170]);px(9,17,[255,200,230])}}
  else if(shp===2){// 曼陀林：小的水滴形琴身（往琴頸變尖）、淺色雲杉面板、深色護板、平的琴頭兩排弦鈕、金屬尾片
    for(let i=0;i<6;i++){const nx=10+i,ny=9-i;px(nx,ny,WD[1]);px(nx,ny+1,WD[0])}
    for(let y=0;y<4;y++)for(let x=0;x<3;x++)px(15+x,1+y-x+1,x===0?WD[2]:WD[1]);// 平琴頭
    for(const [x,y] of [[14,1],[15,0],[16,0],[18,3],[19,2],[18,4]])px(x,y,G[2]);px(17,0,G[1]);px(19,3,G[1]);
    for(let yy=0;yy<20;yy++)for(let xx=0;xx<20;xx++){const a=(xx+0.5-8)*0.707-(yy+0.5-13)*0.707,b=(xx+0.5-8)*0.707+(yy+0.5-13)*0.707;// a 沿琴頸方向
      const rr=a>0?4.6*(1-a/7.2):4.6,rb=Math.sqrt(Math.max(0,1-(a<0?(a/4.6)**2:0)));if(a<-4.6||a>6.2)continue;const w=a>0?rr:4.6*rb;if(Math.abs(b)>w)continue;
      const edge=Math.abs(b)>w-1.1||a<-3.7||a>5.3;px(xx,yy,edge?WD[0]:(b<-1.2?SPRUCE[3]:b<1?SPRUCE[2]:SPRUCE[1]))}
    px(9,12,OL);px(10,11,OL);px(9,11,[60,30,20]);px(10,12,[60,30,20]);// 橢圓響孔
    px(6,13,WD[0]);px(6,14,WD[0]);px(7,14,WD[1]);// 護板
    px(5,16,G[2]);px(4,16,G[1]);px(5,17,G[1]);for(let i=0;i<4;i++)px(6+i,15-i,G[3]);
    if(AC){px(11,13,AC);px(12,12,AC)}if(tierG===2){px(7,10,[255,90,170]);px(7,9,[255,200,230])}}
  else if(shp===1){// 豎琴
    for(let y=3;y<=17;y++){px(3,y,WD[0]);px(4,y,y<8?WD[3]:WD[2])}px(3,18,G[1]);px(4,18,G[2]);
    for(let i=0;i<=12;i++){const xx=4+i,yy=Math.round(3+Math.sin(i/12*Math.PI)*-1.6+i*0.25);px(xx,yy,WD[3]);px(xx,yy+1,WD[1])}
    for(let i=0;i<=11;i++){const xx=5+i,yy=Math.round(17-i*0.95);px(xx,yy,WD[2]);px(xx,yy+1,WD[0])}
    for(let xs=6;xs<=14;xs+=2){const top=Math.round(3+Math.sin((xs-4)/12*Math.PI)*-1.6+(xs-4)*0.25)+2,bot=Math.round(17-(xs-5)*0.95)-1;for(let y=top;y<=bot;y++)px(xs,y,G[3])}
    if(tierG){px(4,2,G[3]);px(3,2,G[2]);px(16,5,G[3])}if(AC){px(4,10,AC);px(4,13,AC)}if(tierG===2){px(4,11,[255,90,170])}}
  else{// 七弦琴
    for(let y=2;y<=14;y++){const u=(y-2)/12,o2=Math.round(Math.sin(u*Math.PI)*2.6);px(5-o2,y,WD[3]);px(6-o2,y,WD[1]);px(14+o2,y,WD[2]);px(15+o2,y,WD[0])}
    px(5,1,G[2]);px(15,1,G[2]);for(let xx=5;xx<=15;xx++){px(xx,4,tierG?G[2]:WD[3]);px(xx,5,WD[0])}ell(10,15.2,6.2,3.2,(x,y,u,v,d)=>px(x,y,shade(WD,u,v,d)));
    for(let xs=8;xs<=12;xs+=2)for(let y=6;y<14;y++)px(xs,y,G[3]);if(AC){px(10,15,AC);px(9,15,AC)}if(tierG===2){px(10,15,[255,90,170]);px(11,15,[255,200,230])}}}
function m24IconBase(x,R){x.fillStyle=rgb(R.bg);x.fillRect(1,1,18,18);for(let i=0;i<18;i++){x.fillStyle=rgb(R.bg.map(v=>Math.min(255,v+Math.round(i*1.6))));x.fillRect(1,1+i,18,1)}
  x.fillStyle=rgb(R.fr);x.fillRect(1,0,18,1);x.fillRect(1,19,18,1);x.fillRect(0,1,1,18);x.fillRect(19,1,1,18);x.fillStyle=rgb(R.fr.map(v=>Math.min(255,v+70)));x.fillRect(2,1,16,1)}
window.gearIconC=(o=>it=>{if(!(it&&it.t==='w'&&wcOf(it)==='b'&&!it.sp))return o(it);const key='wb4_'+it.k+'_'+it.r;if(GIC[key])return GIC[key];
  const [c,x]=mk(20,20);m24IconBase(x,RAR[it.r]);m24Instr((xx,yy,col)=>{if(xx<0||yy<0||xx>19||yy>19)return;x.fillStyle=rgb(col);x.fillRect(xx,yy,1,1)},it.k);GIC[key]=c;return c})(window.gearIconC);
// 大劍圖示：第 1 階（鋼）加藍色反光、第 4 階（灰岩）加石紋斑點，讓兩階一眼分得出來
window.gearIconC=(o=>it=>{if(!(it&&it.t==='w'&&wcOf(it)!=='b'&&!it.sp&&(it.k===0||it.k===3)))return o(it);const key='wk4_'+it.k+'_'+it.r;if(GIC[key])return GIC[key];
  const src=o(it);const [c,x]=mk(20,20);x.drawImage(src,0,0);
  if(it.k===0){x.fillStyle=rgb([190,225,255]);for(let i=0;i<5;i++)x.fillRect(8+i,11-i,1,1)}
  else{const sp=[[8,11],[10,9],[12,8],[14,6],[11,10]];for(const [a,b] of sp){x.fillStyle=rgb([60,44,34]);x.fillRect(a,b,1,1)}x.fillStyle=rgb([236,220,190]);x.fillRect(9,10,1,1);x.fillRect(13,7,1,1)}
  GIC[key]=c;return c})(window.gearIconC);

// ---- src24/c2_tfbard.js
// ---------- M2.4 詩人也能變身（搗蛋鬼／惡魔貓） ----------
// 原則：不畫新圖。詩人每個動作「借用」一張現有的變身姿勢，位置、移動路線、判定、時間、數值全部照詩人原本的招式；被動效果與叫聲保留。
// 對照表（左＝詩人的姿勢名，右＝借用的變身姿勢；想換哪一組只要改這裡）
const TFB_MAP={
  play0:'idle',play1:'idle1',jump:'jump',hurt:'hit',fakehit:'hit',tech_roll:'getup',
  triplet_cast:'windup',thrust:'swing',             // b1 第 1 下
  overhead:'lowwind',sweep:'follow',                 // b2 第 2 下（惡魔貓：claw）
  melody_crouch:'charge',triplet_swing:'upswing',    // b3 第 3 下／旋律衝擊前段
  tune_bonk0:'windup2',tune_bonk1:'slam',            // b4 調音敲擊
  air_shot:'airdive',cast:'charge',                  // 空中音符／遠程
  melody_spin:'bash',                                // 旋律衝擊
  kneel_jump:'charge',knee_slide:'bash',kneel_play:'stomp1',  // 跪地滑行／跪地彈奏
  backstep0:'charge',backstep1:'jump',               // 後跳閃避
  ult_kick:'stomp0',ult_headback:'windup2',ult_hairwhip:'upswing',ult_headbang:'slam',ult_play0:'skill0',ult_play1:'skill1',ult_leap:'jump',ult_layback:'airdive',ult_land:'stomp1'};
M24.tfb=TFB_MAP;
function m24TfBardName(P,t){const F=m21TfF();if(!F||!F.ready)return null;const pre=F.pre+'_',H=F.names;const a=P.act;
  if(P.dead||m2Down()){if(m2Down()&&P.tech)return pre+'getup';const left=(P.downU||0)-t;return pre+((!P.dead&&left<0.3)?'getup':'down')}
  let b=bPose(P,t),p;
  if(/^run\d/.test(b))p=b;
  else if(a&&a.type==='bk')p=Math.floor(a.t/0.15)%2?'skill1':'skill0';     // 三連音：手勢 0／1 交替
  else if(a&&a.type==='bp'&&a.t<0.12)p='stomp0';
  else if(b==='sweep'&&H.has(pre+'claw'))p='claw';
  else p=TFB_MAP[b]||'idle';
  return H.has(pre+p)?pre+p:pre+'idle'}
// 詩人畫面：變身時換成借用的姿勢；夥伴（V 召喚的苦達）維持原樣
window.spr=(o=>(n,sx,sy,op={})=>{const s=S0;if(!(isBard()&&SAVE&&SAVE.tf&&s&&s.P&&(mode==='play'||mode==='dead')&&n.startsWith('kudas_')&&!op.__g&&!op.__ally))return o(n,sx,sy,op);
  const P=s.P,t=s.t;const pn=m24TfBardName(P,t);if(!pn)return o(n,sx,sy,op);
  if(P.ghost&&P.ghost.length)P.ghost=P.ghost.filter(g=>t-g.t<0.22);
  let gl=null;const a=P.act;if(P.redU>t)gl=[255,110,90,Math.floor(46+16*Math.sin(t*6))];else if(P.blueU>t)gl=[110,160,255,Math.floor(46+16*Math.sin(t*6))];else if(P.grnU>t||P.regU>t)gl=[120,230,110,Math.floor(46+16*Math.sin(t*6))];
  if(a&&a.type==='bu')gl=[220,150,255,Math.floor(t*20)%2?220:140];if(a&&a.type==='bl'&&a.t<0.15)gl=[255,210,130,Math.floor(t*20)%2?230:150];if(P.zyU>t&&!gl)gl=[90,220,200,Math.floor(40+20*Math.sin(t*8))];if(P.dgIF>t)gl=[170,220,255,200];
  const dn=/_(down|getup)$/.test(pn),f=op.flip?-1:1;return o(pn,sx+(dn?16*SS*f:0),sy,Object.assign({},op,{rot:0,dy:0,glow:gl}))})(window.spr);
// 苦達變身時不要把夥伴（詩人召喚的苦達）一起變身
window.m21Spr=(o=>(oo,n,sx,sy,op)=>op&&op.__ally?oo(n,sx,sy,op):o(oo,n,sx,sy,op))(window.m21Spr);
// 拿掉 M2.2 的「藥水只給苦達斯／詩人不能變身」：誰撿到就是誰的
window.m21Pot=function(kind){const k=kind==='tfpot2'||kind===2?2:1;const key=k===2?'pots2':'pots';SAVE[key]=(SAVE[key]||0)+1;const s=S0;
  if(s){s.log.push([s.t,'tfpot'+(k===2?'2':''),`獲得 ${TFS[k].pot}！（背包使用）`]);proc('稀有掉落',k===2?[170,40,60]:[150,70,200],'變');sfx('crit',0.4)}m2Save()};
window.m21Transform=function(k,quiet){const s=S0;if(k===true)k=1;if(k===false)k=0;
  if(k){if(SAVE.tf===k)return;const key=k===2?'pots2':'pots';if((SAVE[key]||0)<1){m21Toast('沒有'+TFS[k].pot);return}SAVE[key]--;SAVE.tf=k}else{if(!SAVE.tf)return;SAVE.tf=0}
  m2Save();sfx('summon',0.45);if(s&&s.P&&(mode==='play'||mode==='dead')){s.fx.push({k:'poof',x:s.P.x,y:s.P.y,t0:s.t,on:!!k,tk:k});puff(s.P.x,s.P.y-60,14,k===2?[250,200,200]:[236,226,250],60,0.6,4)}
  if(!quiet)m21Toast(k?`變身成${TFS[k].nm}！（${TFS[k].bonus}；T 或背包「解除變身」可變回）`:'解除變身',2400)};
// 叫聲：詩人的招式也會叫（大招式叫比較大聲）
const CHIRP_B={b4:1,bk:1,bl:1,bs:1,bp:1,bu:1};
window.stepPlayer=(o=>dt=>{o(dt);try{const s=S0,P=s&&s.P;if(!P||!isBard()||!SAVE.tf||mode!=='play')return;const A=P.act;
  if(A&&A!==CHIRP.act){const big=!!CHIRP_B[A.type],now=performance.now(),gap=SAVE.tf===2?(big?300:520):(big?160:330);if(now-CHIRP.last>gap){CHIRP.last=now;CHIRP.n=(CHIRP.n||0)+1;(SAVE.tf===2?m21Meow:m21Chirp)(big)}}
  CHIRP.act=A||null;if(P.dead&&SAVE.tf)m21Transform(0,true)}catch(e){}})(window.stepPlayer);

// ---- src24/c_glow.js
// ---------- M2.4 稀有度外觀：背包光暈（動畫疊在快取圖上）、地上光柱、手上光暈 ----------
// 全部用一階一階的色帶（每層一個顏色、一個透明度），不用模糊、不用單線
const lit=(c,k)=>c.map(v=>Math.min(255,Math.round(v+(255-v)*k)));
function m24Band(x,y,z,i,th,col,a){X.fillStyle=rgb(col,a);const o=(i+1)*th;X.fillRect(x-o,y-o,z+2*o,th);X.fillRect(x-o,y+z+o-th,z+2*o,th);X.fillRect(x-o,y-o+th,th,z+2*o-2*th);X.fillRect(x+z+o-th,y-o+th,th,z+2*o-2*th)}
function m24Star(cx,cy,s,cols,a){cx=Math.round(cx);cy=Math.round(cy);cols.forEach((c,i)=>{const k=s-i*Math.max(1,Math.round(s/3));if(k<=0)return;X.fillStyle=rgb(c,a);const w=Math.max(1,Math.round(k/3));X.fillRect(cx-k,cy-Math.floor(w/2),2*k+1,w);X.fillRect(cx-Math.floor(w/2),cy-k,w,2*k+1)})}
function m24CardFx(it,x,y,z){if(!it||it.r<4)return;const R=RAR[it.r],t=performance.now()/1000,p=Math.max(1,Math.round(z/20));X.save();
  if(it.r===4){m24Band(x,y,z,0,p,R.fr,0.45);m24Star(x+2*p,y+2*p,p*2,[lit(R.col,0.6),[255,255,255]],0.85);m24Star(x+z-2*p,y+z-2*p,p*2,[lit(R.col,0.6),[255,255,255]],0.85)}
  else if(it.r===5){const br=0.7+0.3*Math.sin(t*Math.PI*2/1.6);[0.62,0.36,0.16].forEach((a,i)=>m24Band(x,y,z,i,p,i?R.fr:R.col,a*br));
    const ph=Math.floor(t/0.4)%2;const tw=Math.sin((t%0.4)/0.4*Math.PI);m24Star(ph?x+z-3*p:x+3*p,ph?y+z-3*p:y+3*p,Math.round(p*2.5*tw)+p,[R.col,lit(R.col,0.7),[255,255,255]],0.9)}
  else{[0.75,0.45,0.2].forEach((a,i)=>m24Band(x,y,z,i,p,[lit(R.col,0.5),R.col,R.fr][i],a));
    const u=(t%2.4)/2.4;if(u<0.4){const k=u/0.4;X.beginPath();X.rect(x,y,z,z);X.clip();const c0=x-z+k*3*z;[[R.fr,7],[lit(R.col,0.4),4.5],[[255,255,255],2]].forEach(([c,w])=>{X.fillStyle=rgb(c,0.55);X.beginPath();X.moveTo(c0-w*p,y+z);X.lineTo(c0+w*p,y+z);X.lineTo(c0+z+w*p,y);X.lineTo(c0+z-w*p,y);X.closePath();X.fill()});X.restore();X.save()}
    for(let i=0;i<4;i++){const ph=(t*0.7+i*0.27)%1,ex=x+z*(0.15+0.7*((i*0.37+Math.floor(t*0.7+i*0.27)*0.61)%1)),ey=y-3*p-ph*z*0.55;const a=1-ph;X.fillStyle=rgb([255,120,20],0.7*a);X.fillRect(Math.round(ex)-p,Math.round(ey)-p,2*p,2*p);X.fillStyle=rgb([255,230,140],a);X.fillRect(Math.round(ex)-Math.floor(p/2),Math.round(ey)-Math.floor(p/2),p,p)}}
  X.restore()}
window.gearCard=(o=>(it,x,y,z,sel)=>{o(it,x,y,z,sel);m24CardFx(it,x,y,z)})(window.gearCard);
// 提示框：傳說用橙色外框
window.itemDetail=(o=>(it,x0,y0,x1)=>{const r=o(it,x0,y0,x1);if(it&&it.r>=5){const R=RAR[it.r];X.save();for(const [w,c,a] of [[6,R.fr,0.35],[3,R.col,0.7],[1,[255,250,230],0.9]]){X.strokeStyle=rgb(c,a);X.lineWidth=w;X.strokeRect(x0-14,y0-12,x1-x0+28,r-y0+24)}X.restore()}return r})(window.itemDetail);
// 地上掉落：英雄 矮光柱、夢幻 中光柱、傳說 最高光柱＋底部放射光芒
function m24Pillar(it,cx,by){const R=RAR[it.r],t=performance.now()/1000,H=[0,0,0,0,64,110,170][it.r];const fl=0.85+0.15*Math.sin(t*7+it.id);X.save();
  if(it.r===6){for(let i=0;i<8;i++){const an=t*0.6+i*Math.PI/4,L=26+6*Math.sin(t*3+i);[[R.fr,5,0.35],[R.col,3,0.55],[[255,250,220],1.4,0.8]].forEach(([c,w,a])=>{X.fillStyle=rgb(c,a*fl);X.beginPath();X.moveTo(cx+Math.cos(an+Math.PI/2)*w,by+Math.sin(an+Math.PI/2)*w*0.35);X.lineTo(cx+Math.cos(an)*L,by+Math.sin(an)*L*0.35);X.lineTo(cx-Math.cos(an+Math.PI/2)*w,by-Math.sin(an+Math.PI/2)*w*0.35);X.closePath();X.fill()})}}
  for(const [w,c,a] of [[20,R.fr,0.22],[12,R.col,0.32],[6,lit(R.col,0.6),0.5],[2,[255,255,255],0.75]]){const h=H*(w<6?0.92:1);X.fillStyle=rgb(c,a*fl);X.fillRect(Math.round(cx-w/2),Math.round(by-h),w,Math.round(h));X.fillStyle=rgb(c,a*fl*0.5);X.fillRect(Math.round(cx-w/2+2),Math.round(by-h-6),Math.max(1,w-4),6)}
  for(const [rx,c,a] of [[24,R.fr,0.25],[16,R.col,0.35],[8,[255,255,240],0.5]]){X.fillStyle=rgb(c,a*fl);X.beginPath();X.ellipse(cx,by,rx,rx*0.3,0,0,Math.PI*2);X.fill()}
  for(let i=0;i<3;i++){const u=((t*0.8+i/3+it.id*0.13)%1);X.fillStyle=rgb(lit(R.col,0.5),1-u);X.fillRect(Math.round(cx-6+12*((i*0.41+it.id*0.07)%1)),Math.round(by-u*H),2,2)}X.restore()}
window.itemDraw=(o=>(k,x,y,z,alpha=1)=>{if(typeof k==='object'&&k&&k.r>=4&&z===27&&alpha===1)m24Pillar(k,x+z/2,y+z+4);return o(k,x,y,z,alpha)})(window.itemDraw);
// 手上光暈：從武器遮罩（m_ 或紙娃娃的武器層）往外擴 1 px 一層
const GLC={};
function m24GlowCv(key,src,r,body){const K=key+'|'+r;if(GLC[K]!==undefined)return GLC[K];const w=src.width,h=src.height;const [c0,x0]=mk(w,h);x0.drawImage(src,0,0);const d=x0.getImageData(0,0,w,h).data;
  const on=new Uint8Array(w*h);for(let i=0;i<w*h;i++)on[i]=(src.__mask?d[i*4]>=128:d[i*4+3]>40)?1:0;
  let bd=null;if(body&&body.width===w){const [c1,x1]=mk(w,h);x1.drawImage(body,0,0);bd=x1.getImageData(0,0,w,h).data}
  // 身體上只能蓋「暗的外框」像素，不會蓋到手臂、衣服
  const ok=(i,bi)=>!bd||bd[i*4+3]<=40||(bi===0&&(bd[i*4]*0.3+bd[i*4+1]*0.59+bd[i*4+2]*0.11)<45&&(bd[(i-1)*4+3]<=40||bd[(i+1)*4+3]<=40||bd[(i-w)*4+3]<=40||bd[(i+w)*4+3]<=40));
  const R=RAR[r],bands=r===4?[[lit(R.col,0.3),0.7],[R.fr,0.35]]:r===5?[[lit(R.col,0.55),0.9],[R.col,0.6],[R.fr,0.3]]:[[[255,246,200],0.95],[R.col,0.75],[R.fr,0.45],[R.fr,0.2]];
  const [c,x]=mk(w,h);const id=x.createImageData(w,h),o=id.data;let cur=on,tip=null;
  for(let i=0;i<w*h&&!tip;i++)if(on[i])tip=[i%w,Math.floor(i/w)];
  bands.forEach(([col,a],bi)=>{const nx=new Uint8Array(w*h);for(let y=1;y<h-1;y++)for(let xx=1;xx<w-1;xx++){const i=y*w+xx;if(cur[i]){nx[i]=1;continue}if((cur[i-1]||cur[i+1]||cur[i-w]||cur[i+w])&&ok(i,bi)){nx[i]=1;if(!on[i]&&!o[i*4+3]){o[i*4]=col[0];o[i*4+1]=col[1];o[i*4+2]=col[2];o[i*4+3]=Math.round(a*255)}}}cur=nx});
  // 刃上流光：沿著刃的亮點（另一張圖，畫在最上層）
  const sh=[];for(let i=0;i<w*h;i++)if(on[i])sh.push(i);c.__sh=sh;c.__w=w;
  x.putImageData(id,0,0);c.__tip=tip;return GLC[K]=c}
function m24HeldR(){const it=eqItem('w');return it?it.r:0}
function m24SprXf(sx,sy,op,cx,cy,fn){X.save();X.globalAlpha=op.alpha==null?1:op.alpha;X.translate(Math.round(sx),Math.round(sy));if(op.sc)X.scale(op.sc,op.sc);if(op.flip)X.scale(-1,1);
  if(op.rot){X.translate(0,-30*SS);X.rotate(-op.rot*Math.PI/180);X.translate(0,30*SS)}fn(-cx*SS,-cy*SS+(op.dy||0)*SS);X.restore()}
function m24Embers(dx,dy,tip,t){if(!tip)return;for(let i=0;i<5;i++){const u=(t*0.9+i*0.2)%1,ex=tip[0]+Math.sin(i*2.3+t*2)*4,ey=tip[1]-u*26;const a=1-u;X.fillStyle=rgb([255,110,20],0.75*a);X.fillRect(dx+Math.round(ex)*SS-SS,dy+Math.round(ey)*SS-SS,2*SS,2*SS);X.fillStyle=rgb([255,236,150],a);X.fillRect(dx+Math.round(ex)*SS-Math.floor(SS/2),dy+Math.round(ey)*SS-Math.floor(SS/2),SS,SS)}}
function m24HandGlow(n,sx,sy,op,src,key,body){const r=m24HeldR();if(r<4||!src||!src.width)return;const g=m24GlowCv(key,src,r,body);const [cw,chh,cx,cy]=anchor(n);const t=performance.now()/1000;
  const br=r===4?1:0.72+0.28*Math.sin(t*Math.PI*2/1.6);m24SprXf(sx,sy,op,cx,cy,(dx,dy)=>{X.globalAlpha*=br;X.drawImage(g,dx,dy,cw*SS,chh*SS);if(r>=5&&g.__sh.length){const L=g.__sh,ph=(t*(r===6?0.9:0.6))%1.6;if(ph<1){X.globalAlpha=(op.alpha==null?1:op.alpha)*0.8;const wv=g.__w;let mn=1e9,mx=-1e9;for(const i of L){const v=(i%wv)-Math.floor(i/wv);if(v<mn)mn=v;if(v>mx)mx=v}const c0=mn+(mx-mn)*ph;for(const i of L){const xx=i%wv,yy=Math.floor(i/wv),v=xx-yy,dd=Math.abs(v-c0);if(dd<3){X.fillStyle=rgb(dd<1?[255,255,255]:lit(RAR[r].col,0.6),dd<1?0.85:0.5);X.fillRect(dx+xx*SS,dy+yy*SS,SS,SS)}}}}if(r===6){X.globalAlpha=op.alpha==null?1:op.alpha;m24Embers(dx,dy,g.__tip,t)}})}
window.spr=(o=>(n,sx,sy,op={})=>{const r=o(n,sx,sy,op);try{const s=S0;if(n.startsWith('kudas_')&&!op.flash&&!op.__g&&!op.__ally&&!op.__nog&&s&&s.P&&!SAVE.tf&&!isBard()&&mode==='play'){const mk_=IMG['m_'+n];if(mk_&&mk_.width){mk_.__mask=1;m24HandGlow(n,sx,sy,op,mk_,'m_'+n,IMG['s_'+n])}}}catch(e){}return r})(window.spr);

// ---- src24/d_special.js
// ---------- M2.4 特殊武器 13 把＋「濕透」狀態 ----------
// 攻擊力照關卡階級；特殊能力佔 1 條詞條欄位；能力不可重洗、不可繼承；不能升級、不能當升級素材
const SPW={
 SP01:{n:'黃鰭鮪魚大劍',c:'k',r:5,st:['mine'],src:'mob',d:2,a:'現撈直送',tx:'三段斬第 3 下 25% 甩出海水：範圍敵人濕透 3 秒（移速 −30%、受閃電傷害 +25%）。惡魔貓時攻速 +10%'},
 SP02:{n:'三日法棍',c:'k',r:4,st:['money'],src:'any',d:0,tf:1,a:'越放越硬',tx:'關卡中每 15 秒傷害 +2%（最多 +20%）。撿到食物時啃一口回復 4% HP，硬度歸零'},
 SP03:{n:'大掃除巨帚',c:'k',r:5,st:['canyon'],src:'boss',d:2,a:'大掃除',tx:'斬風改成掃地旋風（傷害 90%）：吸來掉落物，把小怪往前掃 60px 聚成一團'},
 SP04:{n:'「慢」字路標',c:'k',r:5,st:['s2'],src:'any',d:2,a:'請減速慢行',tx:'命中 15% 插「慢」字牌 2 秒：移速、攻速 −40%。首領改成下一招前搖 +0.3 秒（冷卻 8 秒）'},
 SP05:{n:'巨人湯匙',c:'k',r:4,st:['mine'],src:'any',d:0,a:'舀一匙',tx:'踱地時舀起前方 1 隻小怪甩出去，落地造成 50% 範圍傷害並倒地（首領不會被舀起）'},
 SP06:{n:'午後雷陣雨傘',c:'k',r:5,st:['crystal'],src:'boss',d:2,a:'午後雷陣雨',tx:'空中按住跳躍＝撐傘緩降（落速 −60%）。空中攻擊落地時下小雨：範圍濕透 2 秒，10% 劈下小閃電'},
 SP07:{n:'全熟大雞腿',c:'k',r:5,st:['crystal'],src:'any',d:2,a:'吃飽才有力',tx:'擊倒小怪 6% 掉小雞腿（算 1 份食物，吃到回 5% HP）。食物 3/3 時攻擊 +10%'},
 SP08:{n:'搖滾電吉他斧',c:'k',r:6,st:['crystal'],src:'boss',d:3,a:'搖滾斬風',tx:'斬風命中後閃電跳到附近 2 隻（各 50%）。心臟刺擊命中首領：3 秒暴擊 +15%（冷卻 15 秒）。和詩人同場：戰意多 2 秒'},
 SP09:{n:'平底鍋魯特琴',c:'b',r:5,st:['mine'],src:'any',d:2,a:'鏗！',tx:'調音敲擊第 4 下暈眩 0.8 秒（首領 0.2 秒，冷卻 6 秒）。背後被打 20% 被鍋子擋下。跪地彈奏回 3% HP（每 5 秒一次）'},
 SP10:{n:'尖叫雞',c:'b',r:4,st:['canyon'],src:'any',d:0,tf:1,a:'咕咕咕──',tx:'三連音第 3 圈換成雞叫：15% 讓敵人嚇破膽 1 秒（有嚇破膽符文再 +5%）'},
 SP11:{n:'廣場大聲公',c:'b',r:5,st:['spider'],src:'any',d:2,a:'大聲公廣播',tx:'三連音、旋律衝擊範圍 +30%，第 3 圈擊退小怪。樂想效果持續時間 +25%'},
 SP12:{n:'吹笛人的魔笛',c:'b',r:5,st:['crystal'],src:'any',d:3,a:'跟我走',tx:'跪地彈奏後 3 秒內每秒 12% 把一隻小怪變老鼠 3 秒（首領免疫）。老鼠跟著你走，受到傷害 +30%'},
 SP13:{n:'流浪者吉他盒',c:'b',r:6,st:null,src:'boss',d:4,a:'其實是吉他盒',tx:'旋律衝擊結束時扇形噴出 6 發音符彈（各 30%）。後跳無敵時間 +0.15 秒'},
 // M2.7 三杯兔子（長弓）專屬：效果實作在 src27/a_archer.js（搜尋 SP14～SP17）
 SP14:{n:'胡蘿蔔長弓',c:'a',r:4,st:['money'],src:'any',d:0,tf:1,a:'兔子的點心',tx:'每射 20 發普攻，下一發變成胡蘿蔔箭（傷害 ×2、擊退）。撿到食物時啃一口回復 3% HP'},
 SP15:{n:'晒衣竿長弓',c:'a',r:5,st:['canyon'],src:'any',d:2,a:'順便晒衣服',tx:'箭雨範圍 +30%，綠霧多留 1 秒；霧裡的敵人受到傷害 +8%'},
 SP16:{n:'風向雞弓',c:'a',r:5,st:['crystal'],src:'boss',d:2,a:'看風向',tx:'翻滾後 2 秒內下一發普攻必定暴擊（冷卻 4 秒）。後翻扇射多 1 支箭'},
 SP17:{n:'龍骨狙擊長弓',c:'a',r:6,st:null,src:'boss',d:4,a:'龍之吐息',tx:'狙擊模式龍矢 3 發 → 4 發，龍矢與絕招傷害 +15%，絕招光束寬度 +30%'}};
const SPSUB=0.20;
M24.sp=SPW;
window.m2Assets=(o=>()=>o().concat(Object.keys(SPW).map(k=>'i_'+k.toLowerCase())))(window.m2Assets);
function m24MakeSp(it,id){const D=SPW[id];it.sp=id;it.wc=D.c;it.r=D.r;const R=RAR[D.r];while(it.lines.length>R.ln-1)it.lines.pop();return it}
function m24SpPool(r){const st=STGD().id,d=RUN.d,c=heroCls();return Object.keys(SPW).filter(k=>{const D=SPW[k];if(D.c!==c||D.r!==r||d<D.d)return false;
  if(D.src==='boss'&&!M24.boss)return false;const stOK=!D.st||D.st.includes(st)||(D.tf&&SAVE.tf);return stOK})}
window.rollDrop=(o=>minR=>{const it=o(minR);if(it&&it.t==='w'&&it.r>=4&&!it.sp&&!M24.noSp&&Math.random()<SPSUB){const P=m24SpPool(it.r);if(P.length)m24MakeSp(it,RCH(P))}return it})(window.rollDrop);
window.m2BossLoot=(o=>function(){M24.boss=1;try{return o.apply(this,arguments)}finally{M24.boss=0}})(window.m2BossLoot);
// 轉蛋：紫色武器 20% 換成紫色特殊武器（苦達＝三日法棍、詩人＝尖叫雞、三杯兔子＝胡蘿蔔長弓）
if(typeof drawOne==='function')window.drawOne=(o=>function(){const n0=UI.drawn?UI.drawn.length:0;const r=o.apply(this,arguments);try{const L=UI.drawn||[];for(let i=n0;i<L.length;i++){const it=L[i];if(it&&it.t==='w'&&it.r===4&&!it.sp&&Math.random()<SPSUB)m24MakeSp(it,heroCls()==='b'?'SP10':heroCls()==='a'?'SP14':'SP02')}}catch(e){}return r})(window.drawOne);
window.itName=(o=>it=>it&&it.sp&&SPW[it.sp]?SPW[it.sp].n:o(it))(window.itName);
window.itemLines=(o=>it=>{const out=o(it);if(it&&it.sp&&SPW[it.sp]){const D=SPW[it.sp],R=RAR[D.r];out.splice(1,0,['特殊能力',`【${D.a}】${D.tx}`,lit(R.col,0.3)]);out.push(['限制','能力不能重洗、不能繼承；不能升級、不能當升級素材',[200,190,180]])}return out})(window.itemLines);
window.gearIconC=(o=>it=>{if(!(it&&it.sp))return o(it);const key='sp_'+it.sp;if(GIC[key])return GIC[key];const im=IMG['i_'+it.sp.toLowerCase()];if(!im||!im.complete||!im.naturalWidth)return o(Object.assign({},it,{sp:null}));
  const [c,x]=mk(20,20);x.drawImage(im,0,0,20,20);GIC[key]=c;return c})(window.gearIconC);
window.calcGS=(o=>function(){const r=o.apply(this,arguments);const w=eqItem('w');GS.sp=w&&w.sp&&SPW[w.sp]&&SPW[w.sp].c===heroCls()?w.sp:null;if(GS.sp==='SP01'&&SAVE.tf===2)GS.aspd+=0.1;return r})(window.calcGS);
if(typeof m21Transform==='function')window.m21Transform=(o=>function(){const r=o.apply(this,arguments);try{calcGS()}catch(e){}return r})(window.m21Transform);
const SPQ=k=>GS.sp===k;
// 濕透：移速 −30%（沿用 slowU／slowK）＋受閃電傷害 +25%
function m24Wet(m,dur){const t=S0.t;if(m.gone||m.dying||m.kind==='pillar')return;m.wetU=Math.max(m.wetU||0,t+dur);if(m.kind!=='boss'){m.slowU=Math.max(m.slowU||0,t+dur);m.slowK=Math.min(m.slowK||1,0.7)}}
const WATER=[[30,70,160],[60,130,220],[140,200,250],[230,250,255]];
function m24Bolt(m,v){const s=S0,t=s.t;const d=Math.max(1,Math.round(v*(m.wetU>t?1.25:1)));applyDmg(m,d);dmgNum(m,d,'雷擊',30);s.fx.push({k:'bolt',x:m.x,y:m.y,t0:t,top:m.kind==='boss'?m.y-320:m.y-(m.h||0)-170})}
window.m2Dmg=(o=>(v,m,mv,crit)=>{let r=o(v,m,mv,crit);if(mv==='pet'||!m)return r;const s=S0,t=s.t;let k=1;
  if(m.wetU>t&&(GS.el==='閃電'||M24.thun))k*=1.25;
  if(SPQ('SP02')&&s.sp02t0!=null)k*=1+0.02*Math.min(10,Math.floor((t-s.sp02t0)/15));
  if(SPQ('SP03')&&mv==='wind')k*=0.9;
  if(SPQ('SP07')&&s.food>=FOOD_MAX)k*=1.1;
  if(m.fol&&m.polyU>t)k*=1.3;
  return k===1?r:Math.round(r*k)})(window.m2Dmg);
window.m2Crit=(o=>m=>o(m)+(S0&&S0.soloU>S0.t?0.15:0))(window.m2Crit);
window.m2OnHit=(o=>(m,mv,v,crit,hy)=>{o(m,mv,v,crit,hy);if(mv==='pet'||!GS.sp)return;const s=S0,t=s.t,P=s.P,boss=m.kind==='boss';
  if(SPQ('SP01')&&mv==='up'&&P.act&&!P.act.sp01){P.act.sp01=1;if(rnd()<0.25){for(const o2 of s.mobs)if(!o2.gone&&!o2.dying&&Math.abs(o2.x-m.x)<180&&Math.abs(o2.y-m.y)<80)m24Wet(o2,3);s.fx.push({k:'m24splash',x:m.x,y:m.y,t0:t});proc('現撈直送',WATER[2],'水');sfx('jump',0.3)}}
  if(SPQ('SP03')&&mv==='wind'&&!boss&&!m.dying){m.x=clamp(m.x+Math.sign(m.x-P.x||P.face)*60,50,WW-50)}
  if(SPQ('SP04')&&rnd()<0.15){if(boss){if(t>(s.sp04cd||0)&&s.boss&&s.boss.nextAtk!=null&&!s.boss.atk){s.boss.nextAtk+=0.3;s.sp04cd=t+8;m.signU=t+2;proc('請減速慢行',[255,90,80],'慢')}}else if(!m.dying&&m.kind!=='pillar'){m.signU=t+2;m.slowU=Math.max(m.slowU||0,t+2);m.slowK=Math.min(m.slowK||1,0.6);proc('請減速慢行',[255,90,80],'慢')}}
  if(SPQ('SP08')&&mv==='wind'&&!M24.thun){const L=s.mobs.filter(o2=>o2!==m&&!o2.gone&&!o2.dying&&o2.kind!=='pillar'&&Math.abs(o2.x-m.x)<320&&Math.abs(o2.y-m.y)<120).sort((a,b)=>Math.abs(a.x-m.x)-Math.abs(b.x-m.x)).slice(0,2);for(const o2 of L)m24Bolt(o2,v*0.5);if(L.length){proc('搖滾斬風',[255,240,140],'電');sfx('crit',0.25)}}
  if(SPQ('SP08')&&mv==='stab'&&boss&&t>(s.sp08cd||0)){s.sp08cd=t+15;s.soloU=t+3;proc('吉他 solo',[255,150,220],'♪');s.fx.push({k:'m24solo',x:P.x,y:P.y,t0:t})}
  if(SPQ('SP09')&&P.act&&P.act.type==='b4'&&!m.dying){if(boss){if(t>(s.sp09cd||0)){s.sp09cd=t+6;m.dizzy=t+0.2;if(s.boss&&s.boss.nextAtk!=null&&!s.boss.atk)s.boss.nextAtk+=0.2;s.fx.push({k:'m24clang',x:m.x,y:m.y-(m.h||0)-200,t0:t});sfx('crit',0.3)}}
    else if(m.kind!=='pillar'){m.state='stun';m.stun=Math.max(m.stun||0,t+0.8);m.vx=0;m.dizzy=t+0.8;s.fx.push({k:'m24clang',x:m.x,y:m.y-(m.h||0)-150,t0:t});sfx('crit',0.25)}}
})(window.m2OnHit);
// 法棍＋雞腿：撿食物
window.stepLoot=(o=>dt=>{const s=S0;const F=s.loot.filter(L=>L.k==='food'&&L.state!=='got');o(dt);if(!GS.sp)return;const t=s.t,P=s.P;
  for(const L of F)if(L.state==='got'){let h=0;if(SPQ('SP02')){h=0.04;s.sp02t0=t;proc('啃一口',[230,170,90],'麵')}if(SPQ('SP07')&&L.leg)h=Math.max(h,0.05);
    if(h){const v=Math.round(HPMAX*h);P.hp=Math.min(HPMAX,P.hp+v);s.heals.push({t,x:P.x,y:P.y-200,v})}}})(window.stepLoot);
window.mobDie=(o=>m=>{const was=m.dying;o(m);if(!was&&SPQ('SP07')&&m.kind!=='boss'&&m.kind!=='pillar'&&rnd()<0.06)lootPush('food',m,{leg:1,vx:U(-120,120)})})(window.mobDie);
// 湯匙：踱地舀起
if(typeof m21StartStomp==='function')window.m21StartStomp=(o=>function(){const r=o.apply(this,arguments);try{if(SPQ('SP05')){const s=S0,P=s.P;const m=s.mobs.filter(m=>!m.gone&&!m.dying&&m.kind!=='boss'&&m.kind!=='pillar'&&(m.x-P.x)*P.face>-20&&(m.x-P.x)*P.face<200&&Math.abs(m.y-P.y)<60).sort((a,b)=>Math.abs(a.x-P.x)-Math.abs(b.x-P.x))[0];
  if(m){m.scoop={t0:s.t,f:P.face};m.state='air';m.vh=820;m.h=Math.max(m.h||0,1);m.vx=360*P.face;s.fx.push({k:'m24soup',x:m.x,y:m.y,t0:s.t});proc('舀一匙',[255,180,60],'匙')}}}catch(e){}return r})(window.m21StartStomp);
// 魯特琴：背後格擋
window.m2Hurt=(o=>(v,x)=>{const s=S0,P=s&&s.P;if(P&&SPQ('SP09')&&x!=null&&Math.sign(x-P.x)===-P.face&&rnd()<0.2){s.fx.push({k:'m24clang',x:P.x-P.face*30,y:P.y-160,t0:s.t});sfx('crit',0.3);proc('鍋子擋下',[255,220,90],'鏗');return 0}return o(v,x)})(window.m2Hurt);
if(typeof bKneelImpact==='function')window.bKneelImpact=(o=>function(A){const r=o.apply(this,arguments);const s=S0,P=s.P,t=s.t;
  if(SPQ('SP09')&&t>(s.sp09e||0)){s.sp09e=t+5;const v=Math.round(HPMAX*0.03);P.hp=Math.min(HPMAX,P.hp+v);s.heals.push({t,x:P.x,y:P.y-200,v});s.fx.push({k:'m24egg',x:P.x,y:P.y,t0:t})}
  if(SPQ('SP12')){s.sp12={until:t+3,next:t+1};s.fx.push({k:'m24flute',x:P.x,y:P.y,t0:t})}return r})(window.bKneelImpact);
// 雞叫／大聲公：音圈命中時觸發（用 Proxy 記下這一圈打到誰）
function m24RingHit(b,id){const s=S0,t=s.t,m=s.mobs.find(o=>String(o.id)===String(id));if(!m||m.dying||m.gone)return;
  if(b.chick&&m.kind!=='boss'&&m.kind!=='pillar'&&!m.polyU&&rnd()<0.15+(GS.fear?0.05:0)){m.fearU=t+1;m.state='stun';m.stun=t+1;m.fdir=Math.sign(m.x-s.P.x)||1;proc('咕咕咕──',[255,240,150],'雞')}
  if(b.push&&m.kind!=='boss'&&m.kind!=='pillar'){m.state='stun';m.stun=Math.max(m.stun||0,t+0.3);m.vx=b.dir*520}}
window.bNote=(o=>n=>{if(n&&n.k==='ring'&&GS.sp){if(SPQ('SP11')){n.sc*=1.3;if(n.i===2)n.push=1}if(SPQ('SP10')&&n.i===2)n.chick=1;
  if(n.push||n.chick){const b=n;n.hit=new Proxy({},{set(O,k,v){O[k]=v;try{m24RingHit(b,k)}catch(e){}return true}});S0.fx.push({k:n.chick?'m24feather':'m24mega',x:n.x,y:n.y,t0:S0.t,dir:n.dir})}}return o(n)})(window.bNote);
window.bTargets=(o=>(r0,r1,dy,hmax)=>{const P=S0.P;if(SPQ('SP11')&&P.act&&P.act.type==='bl'){r0*=1.3;r1*=1.3}return o(r0,r1,dy,hmax)})(window.bTargets);
window.bIdeaUse=(o=>()=>{const s=S0,P=s.P,t=s.t;const c=o();if(c&&SPQ('SP11')){for(const k of ['redU','blueU','grnU'])if(P[k]>t&&P[k]-t>BD.buff*0.9)P[k]+=(P[k]-t)*0.25;proc('大聲公廣播',[120,230,210],'廣')}return c})(window.bIdeaUse);
window.bStartDodge=(o=>()=>{o();if(SPQ('SP13'))S0.P.dgIF+=0.15})(window.bStartDodge);
// 每格：法棍計時、湯匙落地、傘、雨、吹笛、吉他盒、合奏
window.stepPlayer=(o=>dt=>{const s=S0,P=s.P;const a0=P&&P.act,ty0=a0&&a0.type,h0=P?P.h:0,vh0=P?P.vh:0;o(dt);if(!P||!GS.sp)return;const t=s.t;
  if(s.sp02t0==null)s.sp02t0=t;
  if(SPQ('SP06')&&!isBard()&&h0>0&&P.h>0&&P.vh<0&&held(['Space'])){P.vh=vh0+(P.vh-vh0)*0.4;P.umb=t+0.1}
  if(SPQ('SP06')&&!isBard()&&h0>0&&P.h<=0&&(ty0==='air'||P.airHit)){const L=s.mobs.filter(m=>!m.gone&&!m.dying&&m.kind!=='pillar'&&Math.abs(m.x-P.x)<210&&Math.abs(m.y-P.y)<90);for(const m of L)m24Wet(m,2);
    s.fx.push({k:'m24rain',x:P.x,y:P.y,t0:t});if(L.length&&rnd()<0.10){const m=RCH(L);m24Bolt(m,Math.round(U(GS.lo,GS.hi)*1.2))}}
  if(SPQ('SP12')&&s.sp12&&t<s.sp12.until&&t>=s.sp12.next){s.sp12.next+=1;if(rnd()<0.12){const m=s.mobs.filter(m=>!m.gone&&!m.dying&&m.kind!=='boss'&&m.kind!=='pillar'&&!m.polyU&&Math.abs(m.x-P.x)<420&&Math.abs(m.y-P.y)<120)[0];
    if(m){m.skin0=m.skin||null;m.skin='mouse';m.polyU=t+3;m.state='stun';m.stun=m.polyU;m.vx=0;m.fol=1;s.fx.push({k:'poof',x:m.x,y:m.y,t0:t});proc('跟我走',[255,170,210],'鼠')}}}
  if(SPQ('SP13')&&ty0==='bl'&&(!P.act||P.act!==a0)){const f=P.face;for(let i=0;i<6;i++){const an=(-40+i*16)*Math.PI/180;bNote({k:'bshot',x:P.x+50*f,y:P.y,h:80,vx:1000*Math.cos(an)*f,vh:0,vy:420*Math.sin(an),life:0.45,pool:'slam',mul:0.3,bounce:0})}
    s.fx.push({k:'m24case',x:P.x+40*f,y:P.y,t0:t,f});sfx('wind',0.35);proc('其實是吉他盒',[255,170,90],'盒')}
  let qi=0;for(const m of s.mobs){if(m.scoop){if(t-m.scoop.t0>2)m.scoop=null;else if(t-m.scoop.t0>0.15&&m.state!=='air'){const sc=m.scoop;m.scoop=null;s.fx.push({k:'m24soup',x:m.x,y:m.y,t0:t});shake(6,0.2);
        for(const o2 of s.mobs)if(o2!==m&&!o2.gone&&!o2.dying&&o2.kind!=='pillar'&&Math.abs(o2.x-m.x)<150&&Math.abs(o2.y-m.y)<70){bHit(o2,'stomp',null,0.5,false);bTrip(o2,1)}
        bHit(m,'stomp',null,0.5,false);bTrip(m,1)}}
    if(m.fol){if(!(m.polyU>t)||m.dying){m.fol=0}else{const tx=P.x-P.face*(80+50*qi++);m.x+=clamp(tx-m.x,-220*dt,220*dt);m.y+=clamp(P.y-m.y,-120*dt,120*dt);m.face=Math.sign(P.x-m.x)||m.face}}}
  if(SPQ('SP08')&&s.bard&&!s.bard.__sp08){s.bard.__sp08=1;s.bard.out+=2;proc('合奏',[255,150,220],'♪')}})(window.stepPlayer);
// 特效：一律分層色帶
function m24DrawSp(SX,shy){const s=S0,t=s.t;
  for(const m of s.mobs){if(m.gone)continue;const hy=(m.kind==='boss'?m.y-330:m.y-(m.h||0)-140)+shy,sx=SX(m.x);
    if(m.wetU>t){const [c,x]=pxc(16,14);for(let i=0;i<3;i++){const u=((t*1.3+i/3+m.id*0.17)%1);const dx=3+i*5,dy=Math.round(u*10);x.fillStyle=rgb(WATER[1]);x.fillRect(dx,dy+1,3,3);x.fillStyle=rgb(WATER[2]);x.fillRect(dx,dy,2,2);x.fillStyle=rgb(WATER[3]);x.fillRect(dx,dy,1,1)}pxOut(c,sx,hy+30,0.95)}
    if(m.signU>t){const sw=Math.sin(t*9+m.id)*0.25;X.save();X.translate(sx+34,hy);X.rotate(sw);const [c,x]=pxc(15,18);x.fillStyle=rgb([90,60,40]);x.fillRect(7,10,2,8);
      for(let r=0;r<10;r++){const w=14-r*1.4;x.fillStyle=rgb(r<2?[150,20,20]:[220,40,40]);x.fillRect(Math.round(7.5-w/2),r,Math.max(1,Math.round(w)),1)}for(let r=2;r<7;r++){const w=8-(r-2)*1.6;x.fillStyle=rgb([255,250,240]);x.fillRect(Math.round(7.5-w/2),r,Math.max(1,Math.round(w)),1)}
      pxOut(c,0,0,1);T('慢',0,-30,FN(11),[200,20,20],0,[0,0,0],'mm');X.restore()}}
  if(s.P&&s.P.umb>t&&!isBard()){const P=s.P,sx=SX(P.x+P.face*6),sy=P.y-P.h+shy-250;const [c,x]=pxc(30,16);for(let r=0;r<7;r++){const w=28-(6-r)*3.2;for(let i=0;i<w;i++){const xx=Math.round(15-w/2+i);x.fillStyle=rgb(Math.floor((xx)/5)%2?[240,240,240]:[220,40,40]);x.fillRect(xx,r,1,1)}}x.fillStyle=rgb([150,20,20]);x.fillRect(1,7,28,1);x.fillStyle=rgb([90,60,40]);x.fillRect(15,7,1,9);pxOut(c,sx,sy+48,1)}
  for(const e of s.fx){if(!e.k||e.k.slice(0,3)!=='m24')continue;const age=t-e.t0,sx=SX(e.x);
    if(e.k==='m24splash'&&age<0.6){const k=age/0.6;const [c,x]=pxc(90,36);bring(x,45,24,8+34*k,5*(1-k)+2,WATER,0.4,1-k);for(let i=0;i<10;i++){const an=i/10*Math.PI,r=10+30*k;const dx=45+Math.cos(an)*r,dy=24-Math.sin(an)*r*0.9+k*k*20;x.fillStyle=rgb(WATER[1]);x.fillRect(Math.round(dx)-1,Math.round(dy)-1,3,3);x.fillStyle=rgb(WATER[3]);x.fillRect(Math.round(dx),Math.round(dy)-1,1,1)}pxOut(c,sx,e.y+shy,1-k*0.6)}
    if(e.k==='m24rain'&&age<0.8){const k=age/0.8;const [c,x]=pxc(80,70);bdisc(x,40,8,16,[[90,100,120],[140,150,170],[200,206,220]],0.4,1-k);for(let i=0;i<14;i++){const u=(k*2+i*0.13)%1;const dx=10+i*4.3,dy=12+u*54;x.fillStyle=rgb(WATER[1]);x.fillRect(Math.round(dx),Math.round(dy),1,4);x.fillStyle=rgb(WATER[3]);x.fillRect(Math.round(dx),Math.round(dy),1,1)}pxOut(c,sx,e.y+shy,1-k)}
    if(e.k==='m24soup'&&age<0.5){const k=age/0.5;const [c,x]=pxc(70,30);for(let i=0;i<9;i++){const an=Math.PI*(0.1+0.8*i/8),r=6+26*k;const dx=35+Math.cos(an)*r,dy=26-Math.sin(an)*r+k*k*16;bdisc(x,dx,dy,3-k*1.5,[[200,110,20],[255,180,60],[255,230,150]],1,1-k)}pxOut(c,sx,e.y+shy,1)}
    if(e.k==='m24clang'&&age<0.6){const k=age/0.6;for(let i=0;i<4;i++){const an=t*6+i*Math.PI/2;m24Star(sx+Math.cos(an)*30,e.y+shy+Math.sin(an)*10-k*10,6,[[200,140,10],[255,220,60],[255,255,220]],1-k)}T('鏗',sx,e.y+shy-30-k*20,FN(20),[255,230,90],3,[80,40,0],'mm',1-k)}
    if(e.k==='m24egg'&&age<1.0){const k=age/1.0;const [c,x]=pxc(16,10);bdisc(x,8,5,6,[[220,220,210],[245,245,240],[255,255,255]],0.6,1);bdisc(x,8,5,2.5,[[220,140,20],[255,200,40],[255,240,150]],1,1);pxOut(c,SX(e.x),e.y+shy-200-k*30,1-k)}
    if(e.k==='m24feather'&&age<0.7){const k=age/0.7;for(let i=0;i<8;i++){const dx=sx+e.dir*(40+k*200)+Math.sin(i*1.7)*40,dy=e.y+shy-60-Math.cos(i*2.3)*40+k*30;X.fillStyle=rgb([255,220,90],1-k);X.fillRect(Math.round(dx)-3,Math.round(dy)-1,7,3);X.fillStyle=rgb([255,255,240],1-k);X.fillRect(Math.round(dx)-2,Math.round(dy)-1,4,1)}}
    if(e.k==='m24mega'&&age<0.5){const k=age/0.5;const [c,x]=pxc(70,40);for(let i=0;i<2;i++)bring(x,10,20,6+40*k-i*8,3,[[30,140,120],[90,220,190],[200,255,240]],0.8,1-k);pxOut(c,sx+e.dir*40,e.y+shy-30,1)}
    if(e.k==='m24flute'&&age<3){const k=age/3;for(let i=0;i<3;i++){const u=(age*0.8+i/3)%1;T('♪',sx+(i-1)*40+Math.sin(age*3+i)*10,e.y+shy-220-u*60,FN(16),[255,170,210],2,[90,30,60],'mm',(1-u)*(1-k*0.5))}}
    if(e.k==='m24solo'&&age<3){for(let i=0;i<2;i++){const u=(age*1.2+i/2)%1;T('♪',SX(s.P.x)+(i?30:-30),s.P.y+shy-250-u*50,FN(18),[255,150,220],2,[90,30,60],'mm',1-u)}}
    if(e.k==='m24case'&&age<0.4){const k=age/0.4;const [c,x]=pxc(24,16);x.fillStyle=rgb([60,34,18]);x.fillRect(2,8,20,7);x.fillStyle=rgb([110,64,34]);x.fillRect(3,9,18,5);X.save();pxOut(c,sx,e.y+shy-30,1-k);X.restore()}}}
// 舊雷擊特效：怪物沒有 h 時 top 會是 NaN → 畫布高度 0 報錯；先修正
window.drawM2Fx=(o=>(SX,shy)=>{const s=S0;if(s&&s.fx)for(const e of s.fx)if(e.k==='bolt'){if(!isFinite(e.y))e.y=552;if(!isFinite(e.top)||e.y-e.top<40)e.top=e.y-170}o(SX,shy);try{m24DrawSp(SX,shy)}catch(e){}})(window.drawM2Fx);
// 規則：特殊武器不能升級、不能當升級素材（已在 a_rar 的 m21Cands／m21Up 擋掉）；繼承：特殊能力不繼承（只轉移強化）
window.m21Inh=(o=>function(){return o.apply(this,arguments)})(window.m21Inh);

// ---- src24/e_audio.js
// ---------- M2.4 新配樂（tools/music24.py 程式作曲）＋音樂／音效音量＋旅店點唱機 ----------
const NEWMUS=['m_inn','m_select','m_spider','m_crystal','m_boss','m_cozy'];
M2MUS.push(...NEWMUS);
Object.assign(MUSIC,{sp1:'m_spider',sp2:'m_spider',sp3:'m_spider',sp:'m_spider',b4mine:'m_crystal',boss:'m_boss',spb:'m_boss'});
const JUKE=[['m_inn','爐火旁的小酒館'],['m_cozy','暖爐邊的豎琴'],['m_select','旅人集合'],['m_crystal','水晶迴廊'],['m_spider','蛛網礦道'],['m_boss','風笛戰歌'],
  ['title','標題'],['bgm','赤岩峽谷'],['m_s2','灰色荒野'],['m_mine','赤岩礦坑'],['m_shrine','女神神殿'],['m_b4','水晶監視者'],['m_shop','貓商人'],['m_money','理查宅邸']];
function m24Opt(){const o=SAVE.opt||(SAVE.opt={mus:1,sfx:1});if(o.musV==null)o.musV=100;if(o.sfxV==null)o.sfxV=100;return o}
// 音量曲線：平方（50% 聽起來約一半大聲）
window.m21AudioApply=function(){if(!SAVE)return;const o=m24Opt();const g=v=>Math.pow(Math.max(0,Math.min(100,v))/100,2);
  AB.mus.gain.setTargetAtTime(o.mus?g(o.musV):0,AC.currentTime,0.05);AB.fx.gain.setTargetAtTime(o.sfx?g(o.sfxV):0,AC.currentTime,0.05)};
function m24Vol(which,d){const o=m24Opt();const k=which==='mus'?'musV':'sfxV';o[k]=Math.max(0,Math.min(100,o[k]+d));if(o[k]>0)o[which==='mus'?'mus':'sfx']=1;m21AudioApply();m2Save();if(which==='sfx')sfx('coin',0.4)}
// 設定列：音樂、音效各一列「－　音樂 80%（點一下＝開／關）　＋」
window.m21OptRows=function(x0,y0,inp){const o=m24Opt();let hit=false;
  const vrow=(y,lab,w)=>{const on=o[w],v=o[w+'V'];const c=on?[150,255,150]:[255,150,140];
    if(btn(x0,y,x0+54,y+42,'－',true)&&inp){m24Vol(w,-10);hit=true}
    if(btn(x0+60,y,x0+240,y+42,`${lab}：${on?v+'%':'關'}`,true,c)&&inp){m21Mute(w);hit=true}
    if(btn(x0+246,y,x0+300,y+42,'＋',true)&&inp){m24Vol(w,10);hit=true}
    // 音量條（三層色帶）
    const bw=168,bx=x0+66,by=y+35;X.fillStyle='rgba(0,0,0,0.5)';X.fillRect(bx,by,bw,4);const f=on?v/100:0;X.fillStyle=rgb(on?[70,150,70]:[120,70,60]);X.fillRect(bx,by,Math.round(bw*f),4);X.fillStyle=rgb(on?[150,240,150]:[200,120,110]);X.fillRect(bx,by,Math.round(bw*f),2)};
  vrow(y0,'音樂','mus');vrow(y0+50,'音效','sfx');
  const rows=[[REC.on?'停止錄影（F9）':'開始錄影（F9）',()=>REC.on?m21RecStop():m21RecStart(),REC.on?[255,120,110]:[255,236,200]],['匯出存檔',()=>m21Export(),null],['匯入存檔',()=>m21Import(),null]];
  rows.forEach(([l,f,c],j)=>{const i=j+2,y=y0+i*50;if(btn(x0,y,x0+300,y+42,l,true,c)&&inp){f();hit=true}if(i===2)m21CamIcon(x0+30,y+21,REC.on)});
  // 鍵盤：[ ] 調音樂、; ' 調音效
  if(inp){if(press(['BracketLeft']))m24Vol('mus',-10);if(press(['BracketRight']))m24Vol('mus',10);if(press(['Semicolon']))m24Vol('sfx',-10);if(press(['Quote']))m24Vol('sfx',10)}
  return hit};
// 角色選擇：新曲「旅人集合」
window.m22OpenSel=(o=>function(){const r=o.apply(this,arguments);if(CURM!=='m_select'){musStop(CURM,0.6);musStop('title',0.6);musStop('m_shop',0.4);CURM='m_select';musPlay('m_select',BGMV,1.0,true)}return r})(window.m22OpenSel);
// 旅店：預設「爐火旁的小酒館」，點唱機選過的歌會記住
function m24InnTrack(){const j=m24Opt().juke;return JUKE.some(x=>x[0]===j)&&MUS[j]?j:'m_inn'}
window.m2OpenMap=(o=>(...a)=>{const r=o(...a);if(mode==='map'){musStop('m_shop',0.4);musStop('title',0.4);m2Music(m24InnTrack())}return r})(window.m2OpenMap);
function m24Juke(d){const o=m24Opt();const cur=JUKE.findIndex(x=>x[0]===m24InnTrack());let i=cur;for(let k=0;k<JUKE.length;k++){i=(i+d+JUKE.length)%JUKE.length;if(MUS[JUKE[i][0]])break}
  o.juke=JUKE[i][0];m2Music(o.juke);m2Save()}
window.drawMap=(o=>function(){o.apply(this,arguments);if(mode!=='map')return;const t=performance.now()/1000;const cur=JUKE.find(x=>x[0]===m24InnTrack())||JUKE[0];
  rrect(560,20,960,86,10,'rgba(16,10,8,0.82)',rgb(GOLDC),2);T('點唱機（B 換曲）',760,36,FN(13),[214,172,84],2,[0,0,0],'mm');
  for(let i=0;i<3;i++){const u=(t*0.7+i/3)%1;T('♪',602+i*10,70-u*26,FN(15),[255,210,140],2,[60,30,10],'mm',1-u)}
  T(cur[1]+(NEWMUS.includes(cur[0])?'（新）':''),760,62,FS(19),[255,244,214],2,[0,0,0],'mm');
  const l=btn(882,40,916,78,'〈',true),r=btn(920,40,954,78,'〉',true);if(!UI.kind&&CLICK){if(l)m24Juke(-1);else if(r)m24Juke(1)}
  if(!UI.kind&&press(['KeyB']))m24Juke(1)})(window.drawMap);

// ---- src24/f_mig.js
// ---------- M2.4 存檔升級（M2.3 → M2.4，不會刪任何東西） ----------
// 新欄位：SAVE.pity（保底計數）、opt.musV／sfxV（音量）、每件裝備的 it.lm（詞條倍率：從現有詞條反推升階加成，之後重洗不會洗掉）
function m24LmGuess(it){if(!it||!Array.isArray(it.lines)||!it.lines.length)return 1;const ls=it.t==='w'?1:LSC;let mx=0;
  for(const [id,v] of it.lines){const L=LINES.find(l=>l[0]===id);if(!L)continue;mx=Math.max(mx,v/(L[3]*ls))}
  return mx>1.4?1.5625:mx>1.12?1.25:1}
function m24Mig(S){let n=0;const fix=L=>{for(const it of L||[]){if(!it||typeof it!=='object')continue;if(it.lm==null){const g=Math.max(m24LmGuess(it),LMN[it.r]||1);if(g>1){it.lm=g;n++}}
    if(it.sp&&!SPW[it.sp])delete it.sp}};
  fix(S.inv);if(S.chars)for(const k in S.chars)if(S.chars[k])fix(S.chars[k].inv);fix(S.wh);
  if(!S.pity||typeof S.pity!=='object')S.pity={pk:0,og:0};S.pity.pk=Math.max(0,S.pity.pk|0);S.pity.og=Math.max(0,S.pity.og|0);
  S.opt=S.opt&&typeof S.opt==='object'?S.opt:{mus:1,sfx:1};if(S.opt.musV==null)S.opt.musV=100;if(S.opt.sfxV==null)S.opt.sfxV=100;
  if(!S.m24mig&&S.ts)S.m24mig={t:Date.now(),lm:n};return S}
window.m21Migrate=(o=>S=>{o(S);m24Mig(S);return S})(window.m21Migrate);

// ---- src24/g_bal.js
// ---------- M2.4 平衡調整（依 test/sim24.js 自動對打模擬的結果；改動全部列在 design/balance_m24.md） ----------
const BAL24={kudasWm:1.10,d3:{drop:0.85},d4:{dmg:3.9,drop:1.30}};
Object.assign(DIFFS[3],BAL24.d3);Object.assign(DIFFS[4],BAL24.d4);
// 苦達斯：同裝備下清關比詩人慢 15–25%、深淵死亡次數約 2 倍 → 傷害倍率 ×1.10
window.calcGS=(o=>function(){const r=o.apply(this,arguments);try{if(HEROK==='kudas'&&GS&&GS.wm)GS.wm*=BAL24.kudasWm}catch(e){}return r})(window.calcGS);
window.m2Dmg=(o=>function(v,m,mv,crit){const r=o.apply(this,arguments);return (mv!=='pet'&&HEROK==='kudas'&&typeof r==='number')?Math.round(r*BAL24.kudasWm):r})(window.m2Dmg);

