// 2026-11-11：使用者原畫殭屍狗、非生殖夥伴、住宅方案 C。無新製美術。
'use strict';
(function(P) {
  const C=P.CFG, H=3600e3;
  // 同一組故事文案共用於初遇、寵物頁、小屋與所有阻擋入口。
  P.ZOMBIE_STORY={
    intro:'那一夜，牠為了護住還在哭的孩子，把延續血脈的那一部分，留在了黑暗裡。返魂的火雖把牠帶了回來，身子卻再也不是從前的模樣了。牠也許不能再與別的孩子結成伴侶、迎來自己的小寶寶……可牠仍會靠過來，把剩下的暖意分給你。我們給牠一張床，好不好？',
    detail:'牠曾把延續血脈的那一部分，留在黑暗裡，換回守護大家的力量。返魂的火改變了牠的身子，牠已無法與伴侶迎來小寶寶……但牠仍懂得依偎，也仍願意把力量分給與牠同行的人。',
    hut:'牠回來以後，身子就不一樣了，也許沒辦法再像別的孩子那樣相親相愛，等自己的小寶寶。別替牠安排伴侶啦……牠還是很喜歡大家，也會一直守著你。',
    short:'返魂的火改變了牠的身子，牠已無法與伴侶迎來小寶寶。讓牠安心住在我們身邊吧。',
    menu:'讓牠在家中安睡',
    join:'牠把頭靠在你掌心，幽綠的眼裡，第一次映出了家門的燈火。',
    advance:'那條找回舊日力量的路，還藏在遠方的夜色裡。'
  };
  // 殭：經返魂之術而留存的軀體；犬：守在家門的夥伴。不是巫毒犬舊稿。
  const z={id:'zombiedog',name:'殭屍狗',emo:'🐕',dirs:['zombiedog_v1'],hue:0,sat:1,
    looks:['暮紫殭屍狗','灰紫殭屍狗','幽紫殭屍狗','苔紫殭屍狗'],
    shiny:{h:0,s:1,gh:120,gs:.2,l:0,nm:'幽火星彩'},
    inh:['返魂之軀',P.ZOMBIE_STORY.detail+'｜自身普攻與招式 +25%；額外力量按通常的10%分給主人：主人攻擊 +2.5%（上限2.5%）。'],
    breedable:false,attackMul:1.25,ownerAttackCap:2.5,secret:1,
    advancement:{id:'returning_soul',method:'ritual',breeding:false,enabled:false,version:1}};
  P.SPECIAL={zombiedog:z}; P.SP.zombiedog=z; P.SIZE.zombiedog='m'; P.ABIL_SP.zombiedog=['str','vit'];
  // 魔晶獵犬：W4 劇情夥伴（舊稱結晶獵犬）。不進十種池／認養／贈禮。七屬性是結晶色，不是一般四毛色。
  P.CRYSTAL_STORY={
    intro:'紅眼礦道裡，工房已經搬空，地上只剩打開的空項圈。角落裡縮著一隻被硬改上結晶的小狼狗。那不是圖鑑裡的普通模樣，是這回從礦道裡帶回來的緣。結晶還亮著，可牠已經肯把額頭靠過來了——我們就在這兒迎接牠回家吧。',
    detail:'被強行改上魔晶的小狼狗。背上的結晶會隨屬性換色，毛色與項圈仍是牠自己的。牠是從紅眼礦道裡救回的特殊夥伴，不算在四十個體內。',
    join:'牠把額頭輕輕抵在你手心。礦道裡的燈火還像映在結晶上，可那雙眼睛已經不再是別人的武器。',
    short:'這是從紅眼礦道裡救回的特殊夥伴，請用櫃檯免費寄放，別讓牠走丟。'
  };
  const ch={id:'crystalhound',name:'魔晶獵犬',emo:'🐺',dirs:['crystalhound_v1'],hue:0,sat:1,
    looks:['赤焰','蒼冰','紫雷','緋血','翠毒','幽影','聖輝'],
    shiny:{h:280,s:1.1,gh:290,gs:.25,l:0.02,nm:'晶輝星彩'},
    inh:['魔晶之脈',P.CRYSTAL_STORY.detail],
    breedable:false,secret:1,defaultLook:2};
  P.SPECIAL.crystalhound=ch; P.SP.crystalhound=ch; P.SIZE.crystalhound='m'; P.ABIL_SP.crystalhound=['str','agi'];
  // 不放進 SPECIES：不會隨機投靠、指定認養、r1 all 籠池、初始贈禮中混入。
  // 尚未發生的故事與尚未見過的收藏不預告。建造灰卡、已承繼的潛藏技能與升階目標依使用者決定保留顯示。
  P.knownSpecies=sp=>Object.keys(P.S.codex||{}).some(k=>k.startsWith(sp+':'))||P.all().concat(P.S.stay||[],P.S.wait||[],P.S.wander||[]).some(p=>p.sp===sp);
  P.firstKnownLook=sp=>{const n=(P.SP[sp]&&P.SP[sp].looks&&P.SP[sp].looks.length)||4;return[...Array(n).keys()].find(i=>P.S.codex[P.indId(sp,i)])??0};
  P.knownCodexCount=()=>Object.keys(P.S.codex||{}).filter(k=>P.SPECIES.some(s=>k.startsWith(s.id+':'))).length;
  P.cupStoryVisible=c=>c==='v'||P.all().some(p=>(p.medals||[]).some(m=>m.c===c)||((p.rank||0)>={s:1,k:2,l:3}[c]&&(c!=='k'||(p.baby?p.lv>=C.kingdomLv:P.heart(p.aff)>=5))&&(c!=='l'||P.repLv()>=C.legendRep)));
  P.visibleQuests=()=>P.QUESTS.filter(q=>P.questInfo(q).state!=='locked');
  // 認養／贈禮「已救過」：籠子救援紀錄、已完成委託的籠名單、現住／候補／寄放／徘徊／出門闖蕩名冊、圖鑑與名冊。
  // 開張或 r1 完成但沒留下籠名單的舊存檔，視為當時已救下 r1 的十種。
  P.rescuedPlaces=()=>P.all().concat(P.S.stay||[],P.S.wait||[],P.S.wander||[],Object.values(P.S.fam||{}));
  P.rescuedSpecies=sp=>{
    if(!P.SPECIES.some(s=>s.id===sp))return false;
    const S=P.S;
    if(P.rescuedPlaces().some(p=>p&&p.sp===sp))return true;
    if(Object.keys(S.codex||{}).some(k=>k.startsWith(sp+':')))return true;
    if(Object.keys(S.roster||{}).some(k=>k.startsWith(sp+':')))return true;
    for(const q of P.QUESTS){
      const st=S.quests[q.id];if(!st||!st.done)continue;
      if(st.cages&&st.cages.length){if(st.cages.some(c=>c.sp===sp))return true}
      else if(q.cages==='all')return true;
    }
    if((S.unlock||S.quests.r1&&S.quests.r1.done)&&!(S.quests.r1&&S.quests.r1.cages&&S.quests.r1.cages.length)&&P.QU.r1&&P.QU.r1.cages==='all')return true;
    return false;
  };
  P.adoptSpecies=()=>P.SPECIES.filter(s=>P.rescuedSpecies(s.id));
  P.giftSpecies=()=>{const list=P.adoptSpecies();return list.length?list:P.SPECIES.slice()};
  const adopt0=P.adopt;P.adopt=sp=>{
    if(!P.rescuedSpecies(sp))return {ok:0,msg:'還沒救過這種孩子，不能指定認養'};
    return adopt0(sp);
  };
  const gift0=P.giveGift;P.giveGift=sp=>{
    if(P.S.gift0)return null;
    const pool=P.giftSpecies();
    if(sp&&!pool.some(s=>s.id===sp))return null;
    if(!sp)sp=P.pick(pool).id;
    return gift0(sp);
  };
  // 探險地點依戰力／星級對應章節：第一關永遠可見；其後依 r2／r3／r4 與名聲；舊存檔去過的地方不收回。
  P.STAGE_UNLOCK={canyon:{quest:null,rep:0},s2:{quest:'r2',rep:0},mine:{quest:'r3',rep:0},spider:{quest:'r4',rep:0},crystal:{quest:'r4',rep:7},rich:{quest:'r4',rep:8}};
  P.stageVisited=sk=>{
    const st=P.ST[sk],exp=P.S.exp||{};
    const hit=rec=>rec&&(rec.k===sk||rec.sk===sk||(st&&rec.st===st.name));
    return (exp.teams||[]).some(hit)||(exp.log||[]).some(hit);
  };
  P.stageUnlocked=sk=>{
    if(!P.ST[sk])return false;
    if(P.stageVisited(sk))return true;
    const u=P.STAGE_UNLOCK[sk]||{quest:null,rep:0};
    if(u.quest&&!(P.S.quests[u.quest]||{}).done)return false;
    if(u.rep&&P.repLv()<u.rep)return false;
    return true;
  };
  P.visibleStages=()=>P.STAGES.filter(s=>P.stageUnlocked(s.k));
  const send0=P.expSend;P.expSend=(sk,ids)=>{
    if(!P.stageUnlocked(sk))return {ok:0,msg:'這個地方現在還不能去'};
    return send0(sk,ids);
  };
  P.qaVisible=q=>{
    const S=P.S;if(['basket'].includes(q.k))return S.cots.length>0;
    if(['up','skill','fight','send'].includes(q.k))return S.unlock&&P.all().length>0;
    return true;
  };
  const npc=P.npcLine;P.npcLine=sit=>{
    if(sit!=='hint')return npc(sit);
    const S=P.S,ls=(P.NPC_LINES.hint||[]).filter(([,t])=>{
      if(t.includes('熊那孩子')&&!P.knownSpecies('bear'))return false;
      if(/浣熊/.test(t)&&!P.knownSpecies('raccoon'))return false;
      if(/小石頭|幸運石/.test(t)&&!P.seen('stone'))return false;
      if(/毛色特別|毛會發亮|毛尖偶爾|星彩/.test(t)&&!Object.keys(S.codexS||{}).length)return false;
      if(/生下|爸爸媽媽|血脈|家譜|籃子|兩個.*住|育兒/.test(t)&&!S.cots.length)return false;
      return true;
    });return ls.length?P.pickLine('npc|hint|known',ls):null;
  };
  P.canBreed=p=>!!p && !!P.SP[p.sp] && P.SP[p.sp].breedable!==false;
  const age=P.canBreedAge;P.canBreedAge=p=>P.canBreed(p)&&age(p);
  const mk=P.mateKind;P.mateKind=(a,b)=>!P.canBreed(a)||!P.canBreed(b)?null:mk(a,b);
  const cc=P.cotCheck;P.cotCheck=c=>[P.byId(c.a),P.byId(c.b)].some(p=>p&&!P.canBreed(p))?P.ZOMBIE_STORY.short:cc(c);
  const pc=P.pregChance;P.pregChance=c=>[P.byId(c.a),P.byId(c.b)].some(p=>p&&!P.canBreed(p))?{p:0,d:{返魂之軀:P.ZOMBIE_STORY.short},mul:0}:pc(c);
  const sc=P.setCot;P.setCot=(c,a,b)=>{
    if([P.byId(a),P.byId(b)].some(p=>p&&!P.canBreed(p)))return {ok:0,msg:P.ZOMBIE_STORY.short};
    sc(c,a,b);return {ok:1};
  };
  // 防匯入舊籃與直接出生入口；不能用月光露、幸運石、強制配方繞過。
  const birth=P.birth;P.birth=(c,k)=>{
    const bk=c.basket||{};
    if([bk.a,bk.b,c.a,c.b].some(id=>{const p=P.byId(id)||P.S.fam[id];return p&&!P.canBreed(p)})){c.basket=null;P.emit('preg',P.ZOMBIE_STORY.short+'蜜糖媽媽接過空籃，輕輕收在櫃旁。');return []}
    return birth(c,k);
  };
  const ih=P.inherit;P.inherit=(f,m,c)=>{if(!P.canBreed(f)||!P.canBreed(m))throw Error(P.ZOMBIE_STORY.short);return ih(f,m,c)};
  const send=P.sendOff;P.sendOff=p=>p&&(p.sp==='zombiedog'||p.sp==='crystalhound')?{ok:0,msg:p.sp==='crystalhound'?P.CRYSTAL_STORY.short:'牠是僅此一次的結緣夥伴，請使用櫃檯免費寄放，避免再也見不到牠'}:send(p);
  // 失敗重接任務不能再領同一籠：每委託的物種唯一，並立即存檔。
  const rescue=P.rescue;P.rescue=(sp,o)=>{
    const q=o&&o.quest;if(!q)return rescue(sp,o);
    const st=P.S.quests[q]=P.S.quests[q]||{};st.claimed=st.claimed||{};
    const residents=P.all().concat(P.S.wait,P.S.wander,P.S.stay,P.S.sent?[P.S.sent.p]:[]);
    const prior=residents.find(p=>p.sp===sp&&p.rescued===q);
    if(st.claimed[sp])return residents.find(p=>p.id===st.claimed[sp].id)||st.claimed[sp].pet;
    const p=prior||rescue(sp,o);st.claimed[sp]={id:p.id,pet:JSON.parse(JSON.stringify(p))};P.save();return p;
  };
  const atk=P.petAtkOf;P.petAtkOf=p=>atk(p)*(p&&P.SP[p.sp].attackMul||1);
  // 分享「多出的25%」的十分之一，不是給主人25%，也不放大其他五項分享。
  // 走正常 P.abOwner → petInfo.ow → heroStat；保留其他物種原值與原上限。
  const owner=P.abOwner;
  P.abOwner=p=>{
    const o=owner(p),sp=p&&P.SP[p.sp];
    if(sp&&sp.ownerAttackCap){
      const extra=Math.max(0,(sp.attackMul||1)-1)*100;
      const pts=extra*C.ablOwnerShare/100;
      o.atk={pts,v:Math.min(sp.ownerAttackCap,Math.round(pts*10)/10),cap:sp.ownerAttackCap,txt:'主人攻擊力',source:'返魂之軀'};
    }
    return o;
  };
  P.specialAdvanceInfo=p=>p&&P.SP[p.sp].advancement?Object.assign({},P.SP[p.sp].advancement):null;
  P.specialAdvance=p=>({ok:0,msg:P.ZOMBIE_STORY.advance});

  P.HOUSING_KEYS=['sidewing','sideyard','annex','oldbarn','farm'];
  P.HOUSING={sidewing:{name:'一館側廂',cap:12},sideyard:{name:'側院',cap:18},annex:{name:'二館',cap:24},oldbarn:{name:'舊驛站穀倉',cap:32},farm:{name:'農場',cap:32}};
  Object.assign(C,{sidewing:{gold:80000,bread:50,shard:12,rep:2,hours:4},sideyard:{gold:150000,bread:100,shard:20,rep:3,hours:8},oldbarn:{gold:500000,bread:250,shard:50,rep:6,hours:12}});
  Object.assign(C.annex,{gold:220000,bread:140,shard:28,rep:4,hours:8});
  // 農場費用沿用既有地圖/設施費；不得拿「提早住房」偷開 Lv7 地圖。
  C.houseStep=[5,24,32];
  P.expandPrior=k=>P.HOUSING_KEYS[P.HOUSING_KEYS.indexOf(k)-1]||null;
  P.nextHousing=()=>P.HOUSING_KEYS.filter(k=>k!=='farm').find(k=>P.S[k]!==1)||null;
  P.houseCap=()=>C.houseOverride||P.HOUSING_KEYS.reduce((n,k)=>P.S[k]===1?Math.max(n,P.HOUSING[k].cap):n,5);
  P.expansionEffect=k=>P.HOUSING[k]?(k==='farm'?'開放農場地圖與設施，不增加床位':`住民上限提升至 ${P.HOUSING[k].cap}`+(k==='annex'?'，小屋多 2 間':'')):null;
  const ns=P.newState;P.newState=()=>Object.assign(ns(),{sidewing:0,sideyard:0,oldbarn:0,housingV:0});
  const mig=P.migrate;P.migrate=S=>{
    mig(S);
    // 舊二館/農場存檔送足前置工程，不撤銷既有進度、不重扣材料。
    if(!S.housingV){if(S.annex||S.farm){S.sidewing=1;S.sideyard=1}if(S.farm)S.oldbarn=1;S.housingV=1}
    for(const k of P.HOUSING_KEYS)if(S[k]==null)S[k]=0;
  };
  P.expandInfo=k=>{
    const c=C[k],st=P.S[k];if(!P.HOUSING[k]||!c)return {state:'locked',why:'沒有這項工程'};
    if(st===1)return {state:'done'};if(st&&st.until)return {state:'building',until:st.until};
    const prior=P.expandPrior(k);if(prior&&P.S[prior]!==1)return {state:'locked',why:'先蓋好'+P.HOUSING[prior].name};
    if(!P.S.unlock)return {state:'locked',why:'先開張蜜糖之家'};
    if(P.repLv()<c.rep)return {state:'locked',why:`名聲 Lv${c.rep} 才能蓋`,c};return {state:'can',c};
  };
  P.buildExpand=k=>{
    const I=P.expandInfo(k),c=C[k],S=P.S;if(I.state!=='can')return {ok:0,msg:I.why||'現在不能蓋'};
    if(S.gold<c.gold||S.bread<c.bread||S.shards<c.shard)return {ok:0,msg:`需要金幣 ${c.gold}、麵包 ${c.bread}、刻印 ${c.shard}`};
    S.gold-=c.gold;S.bread-=c.bread;S.shards-=c.shard;S[k]={until:P.now()+c.hours*H};P.emit('build',`開始蓋${P.HOUSING[k].name}（${c.hours} 小時）`);P.save();return {ok:1};
  };
  const tick=P.tickP3;P.tickP3=t=>{
    // 先完成五項工程，原 tick 不再印舊的 10／20 床位資訊。
    for(const k of P.HOUSING_KEYS){const st=P.S[k];if(st&&st.until&&t>=st.until){P.S[k]=1;if(k==='farm')P.S.fac.grass=1;P.justBuilt=k;P.emit('build',`${P.HOUSING[k].name}完工！住民上限 ${P.houseCap()}${k==='farm'?'，農場地圖開放':''}`)}}
    tick(t);
  };
  P.askExpand=()=>{const k=P.nextHousing(),S=P.S;if(!S.unlock||!k||S.pets.length<P.houseCap()-1||P.expandInfo(k).state!=='can')return null;if(S.askAt&&P.now()-S.askAt<C.askEvery*86400e3)return null;return k};
  const qd=P.questDone;
  const materials={r1:[40000,50,12],r2:[100000,80,20],r3:[120000,120,28],r4:[80000,80,20]};
  P.questDone=id=>{const done=!!P.S.quests[id]?.done;qd(id);if(!done&&P.S.quests[id]?.done){if(materials[id]){const [g,b,s]=materials[id];P.S.gold+=g;P.S.bread+=b;P.S.shards+=s;P.emit('story',`一次性蓋房材料：金幣 ${g}、麵包 ${b}、刻印 ${s}`);}P.save()}};
  // 紅眼礦道尚未在 pettest 實裝。魔晶獵犬的取得條件只看存檔旗標 S.redeyeClear。
  // 關卡落地時，首次通關請設 P.S.redeyeClear=1 並存檔；本測試版遊戲流程不會寫入此旗標。
  P.redeyeCleared=()=>!!(P.S&&P.S.redeyeClear);
  // 特殊結緣，不是第5個救援：r1-r4 保留 20 隻一次性寵物總預算。
  P.zombieInfo=()=>{
    const S=P.S;if(S.zombieBond)return {state:'done',why:'已結緣（每份存檔僅一次）'};
    if(!S.quests.r4?.done)return {state:'locked',why:'先完成「黑羽毛與最後的籠車」'};
    if(P.repLv()<7)return {state:'locked',why:'名聲 Lv7 才能安定返魂之火'};
    if(S.oldbarn!==1)return {state:'locked',why:'先蓋好舊驛站穀倉，給牠安穩的床'};
    if(P.houseFull())return {state:'locked',why:'先留 1 個住民空位；不會強塞候補或寄放處'};
    return {state:'open',why:'在穀倉門前迎接牠（一次性特殊結緣）'};
  };
  P.claimZombie=()=>{
    const I=P.zombieInfo();if(I.state!=='open')return {ok:0,msg:I.why};
    const p=P.makeAnimal({sp:'zombiedog',tier:2,look:0,q:1,aff:250,heir:8,dir:['str','vit'],lv:1,baby:0,star:0});
    P.S.zombieBond={at:P.now(),id:p.id};P.addResident(p,'在舊驛站穀倉門前與你結緣');P.save();return {ok:1,p,msg:P.ZOMBIE_STORY.join};
  };
  P.zombieCard=()=>{const I=P.zombieInfo();if(I.state==='locked')return '';return `<div class="card"><b>舊驛站的返魂犬</b><div>蜜糖媽媽：「${P.ZOMBIE_STORY.intro}」</div><div class="muted">${I.why}｜紫色靈性中型犬，自身普攻與招式 +25%；額外力量按通常10%分享，主人攻擊 +${Math.min(z.ownerAttackCap,Math.round((z.attackMul-1)*100*C.ablOwnerShare)/100)}%（最多2.5%）。</div>${I.state==='open'?'<button class="ok" data-a="zombie">迎接殭屍狗</button>':''}</div>`};
  P.crystalInfo=()=>{
    const S=P.S;if(S.crystalBond)return {state:'done',why:'已迎接（每份存檔僅一次）'};
    if(!P.redeyeCleared())return {state:'locked',why:'先走通紅眼礦道'};
    if(P.houseFull())return {state:'need',why:'先留 1 個住民空位；不會強塞候補或寄放處'};
    return {state:'open',why:'迎接從紅眼礦道帶回來的魔晶獵犬（一次性）'};
  };
  P.claimCrystal=()=>{
    const I=P.crystalInfo();if(I.state!=='open')return {ok:0,msg:I.why};
    const p=P.makeAnimal({sp:'crystalhound',tier:2,look:2,q:1,aff:200,heir:8,dir:['str','agi'],lv:1,baby:0,star:0});
    P.S.crystalBond={at:P.now(),id:p.id,look:2};P.addResident(p,'從紅眼礦道把魔晶獵犬接回家');P.save();return {ok:1,p,msg:P.CRYSTAL_STORY.join};
  };
  P.crystalCard=()=>{const I=P.crystalInfo();if(I.state==='locked')return '';return `<div class="card"><div class="row2"><img src="assets/scenes/w4/collar_icon_32.png" width="32" height="32" alt="打開的空項圈" style="image-rendering:pixelated"><b>紅眼礦道裡救回的孩子</b></div><div>蜜糖媽媽：「${P.CRYSTAL_STORY.intro}」</div><div class="row2"><img src="assets/scenes/w4/collar_ground_48.png" width="96" height="64" alt="礦道地上留下的空項圈" style="image-rendering:pixelated"><span class="muted">礦道裡留下的空項圈。它只是這段相遇的證物，不是提升靈性用的金色項圈。</span></div><div class="muted">${I.why}</div>${I.state==='open'?'<button class="ok" data-a="crystal">迎接魔晶獵犬</button>':''}</div>`};
  // 天數解鎖必須先由 NPC 口頭提醒，不可默默出現。農場小屋第 2～5 間依開張後第 7／21／42／70 天開地，櫃檯常駐這句。
  P.farmHutHintLine=()=>{
    const n=P.farmHutNext&&P.farmHutNext();if(!n)return '';
    return n.inDays<=1?'農場那邊還有一塊空地，再過一天就能整好。到時候你再來看，我們再蓋一間小屋。':`農場那邊還有空地，我正在慢慢整。再過 ${n.inDays} 天就能再蓋一間小屋了，到時候我再喊你。`;
  };
  P.farmHutHintCard=()=>{const t=P.farmHutHintLine();return t?`<div class="card"><b>蜜糖媽媽</b>：「${t}」</div>`:''};
  P.specialCodex=()=>{
    const av=(p,n)=>(P.ui&&P.ui.av)?P.ui.av(p,n):'';const rows=[];
    if(Object.keys(P.S.codex||{}).some(k=>k.startsWith('zombiedog:')))rows.push(`<div class="card">${av({sp:'zombiedog',tier:0},48)}殭屍狗｜${P.ZOMBIE_STORY.detail}<div class="muted">已與你結緣，住在這盞燈火旁。</div></div>`);
    if(Object.keys(P.S.codex||{}).some(k=>k.startsWith('crystalhound:'))){const look=P.firstKnownLook('crystalhound');rows.push(`<div class="card">${av({sp:'crystalhound',tier:look,look},48)}魔晶獵犬｜${P.CRYSTAL_STORY.detail}<div class="muted">特殊外型（${(P.SP.crystalhound.looks[look]||'紫雷')}），不算在四十個體內。</div></div>`);}
    return rows.length?`<h3>特殊夥伴</h3>${rows.join('')}`:'';
  };


  // ---------- 11/11 設施原畫接入（只組裝已處理圖，不重畫） ----------
  const IM={};const ld=(k,src)=>{IM[k]=P.art.lazyImage(src)};
  ld('garden','assets/scenes/farm/fac_garden_empty.png');
  for(const c of['carrot','pumpkin','berry'])for(const st of['grow','ripe'])ld('crop_'+c+'_'+st,'assets/scenes/farm/crops/'+c+'_'+st+'.png');
  ld('bath','assets/scenes/farm/fac_bath.png');
  ld('fire','assets/scenes/farm/fac_fire.png');
  for(let i=1;i<=4;i++)ld('flame'+i,'assets/scenes/farm/fac_fire_flame_'+i+'.png');
  ld('nursery','assets/scenes/farm/fac_nursery.png');
  ld('board','assets/scenes/farm/fac_dispatch.png');
  ld('board_partial','assets/scenes/farm/fac_dispatch_partial.png');
  ld('board_empty','assets/scenes/farm/fac_dispatch_empty.png');
  ld('camp','assets/scenes/farm/fac_camp.png');
  ld('sidewing','assets/scenes/shelter/fac_sidewing.png');
  ld('sideyard','assets/scenes/shelter/fac_sideyard.png');
  ld('oldbarn','assets/scenes/shelter/fac_oldbarn.png');
  ld('entr_signpost','assets/scenes/shelter/entr_signpost.png');
  ld('entr_oldbarn','assets/scenes/shelter/entr_oldbarn.png');
  ld('scaffold','assets/scenes/shelter/fac_scaffold.png');
  ld('sideyard_scene','assets/scenes/shelter/sideyard_scene.jpg');
  ld('wagon','assets/scenes/w4/spike_wagon.png');
  ld('training','assets/scenes/farm/fac_training.png');
  ld('slab','assets/scenes/farm/plot_slab.png');
  ld('luckstone','assets/scenes/p51/icons/icon_luckstone.png');
  ld('wagon_closed','assets/scenes/w4/wagon_closed.png');
  ld('wagon_empty','assets/scenes/w4/wagon_empty.png');
  ld('wagon_wheel0','assets/scenes/w4/wagon_wheel_0.png');
  ld('wagon_wheel1','assets/scenes/w4/wagon_wheel_1.png');
  // 工房三件先收在 w4，紅眼礦道工房場景尚未實裝，不擅自擺放。
  ld('workbench','assets/scenes/w4/workbench_empty.png');
  ld('toolbox','assets/scenes/w4/crystal_toolbox.png');
  ld('collar_apparatus','assets/scenes/w4/collar_apparatus.png');
  const ok=im=>P.art.imageOK(im);
  const nightOn=()=>P.isNight?P.isNight():false;
  const withNight=(ctx,fn)=>{const use=nightOn()&&'filter'in ctx;if(use)ctx.filter='brightness(.72) saturate(.8)';fn();if(use)ctx.filter='none'};
  const blit=(ctx,im,cx,by,sc)=>{if(!ok(im))return false;sc=sc||1;const w=im.naturalWidth*sc,h=im.naturalHeight*sc;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,Math.round(cx-w/2),Math.round(by-h),w,h);ctx.restore();return true};
  const plate=(ctx,txt,cx,by)=>{if(P.art.tagBox&&typeof Path2D==='function')P.art.tagBox(ctx,txt,cx,by+22,{size:14,pad:6,h:21,s:2,st:[2,1]});else{ctx.font='bold 14px sans-serif';const w=ctx.measureText(txt).width+12;ctx.fillStyle='rgba(26,16,22,.8)';ctx.fillRect(cx-w/2,by+8,w,20);ctx.fillStyle='#fff';ctx.fillText(txt,cx-w/2+6,by+23)}};
  P.FAC_ART=IM;
  // 訓練營門樓 x=3450、寬 206，左緣 3347、右緣 3553。派遣板右緣 3270。
  // 200×170 木欄／稻草人放在門樓右側空草地，間隔 20px，中心 3673。不當作點擊熱區。
  P.TRAIN_YARD_AT={cx:3673,by:400};
  P.STONE_ICON='assets/scenes/p51/icons/icon_luckstone.png';
  P.stoneIcon=(n)=>{n=n||32;return `<img class="mat" src="${P.STONE_ICON}" width="${n}" height="${n}" alt="幸運石" style="image-rendering:pixelated;vertical-align:middle">`};
  if(P.MATS&&!P.MATS.stone)P.MATS.stone={name:'幸運石',icon:P.stoneIcon(32),txt:'放進小屋，下一個育兒籃突變成星彩的機率 ×3'};
  // 三處入口共用路牌（同尺寸）。側廂／側院用去穀倉圖的空白木牌，穀倉保留原畫。
  // 立在院子開闊草地、靠畫面／小路邊緣，不壓櫃檯、玩具草堆、堆肥箱、踏石或建築。
  P.HOUSING_AT={
    sidewing:{cx:360,by:630,w:79,h:94,img:'entr_signpost',name:'一館側廂'},
    sideyard:{cx:920,by:630,w:79,h:94,img:'entr_signpost',name:'側院'},
    oldbarn:{cx:2160,by:630,w:79,h:94,img:'entr_oldbarn',name:'舊驛站穀倉'}
  };
  // 使用者交付的建築外觀保留在建造工程圖；院子只立共用路牌，不塞縮小地點。
  P.housingArtPreview=k=>{
    const dims={sidewing:[240,180],sideyard:[240,140],oldbarn:[280,200]},d=dims[k];
    if(!d||!P.HOUSING[k])return '';
    const building=!!(P.S[k]&&P.S[k].until),h=Math.max(d[1],building?180:0);
    return `<details class="card"><summary>查看${P.HOUSING[k].name}工程圖</summary><div style="position:relative;width:${d[0]}px;height:${h}px;max-width:100%;overflow:auto"><img src="assets/scenes/shelter/fac_${k}.png" width="${d[0]}" height="${d[1]}" alt="${P.HOUSING[k].name}外觀原畫" style="position:absolute;left:0;bottom:0;image-rendering:pixelated">${building?`<img src="assets/scenes/shelter/fac_scaffold.png" width="200" height="180" alt="施工中的鷹架" style="position:absolute;left:${Math.round((d[0]-200)/2)}px;bottom:0;image-rendering:pixelated">`:''}</div></details>`;
  };
  const reqCardArt0=P.reqCard;
  if(reqCardArt0)P.reqCard=(k,o)=>{const card=reqCardArt0(k,o);return card?card+P.housingArtPreview(k):card};
  P.CROP_BED={carrot:78,pumpkin:120,berry:162,foot:108};
  P.houseVis=k=>{const st=P.S[k];if(st===1)return 'done';if(st&&st.until)return 'building';return '';};
  P.drawScaffold=(ctx,cx,by,bw,bh)=>{
    const im=IM.scaffold;if(!ok(im)||!bw)return;
    const ratio=1.15,tw=bw*ratio,sc=tw/im.naturalWidth,th=im.naturalHeight*sc;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,Math.round(cx-tw/2),Math.round(by-th),tw,th);ctx.restore();
  };
  // 探險隊派遣板：140×170 原圖、腳底錨點 (70,166)。三態由原圖程式去掉羊皮紙還原木紋。
  // empty＝沒有路上的隊伍、也沒有可派出的夥伴；partial＝還有空位或仍可出發（兩張紙）；full＝隊伍已達同時上限（三張紙）。
  P.BOARD_ANCHOR={ax:70,ay:166};
  P.dispatchBoardState=()=>{
    const S=P.S||{}, teams=(S.exp&&S.exp.teams)||[];
    const max=(P.CFG&&P.CFG.expTeams)||2;
    if(teams.length>=max)return 'full';
    const stages=(P.visibleStages&&P.visibleStages())||P.STAGES||[];
    const canSend=stages.length>0&&((P.all&&P.all())||[]).some(p=>P.expFree&&P.expFree(p));
    if(teams.length===0&&!canSend)return 'empty';
    return 'partial';
  };
  P.drawFacArt=(ctx,f,built,t)=>{
    if(!f||!f.real)return false;
    const x=f.x,y=400,foot=y;
    if(!built)return false; // 未建成仍走原本空地木牌
    const nightDraw=fn=>withNight(ctx,fn);
    if(f.k==='garden'&&ok(IM.garden)){
      nightDraw(()=>{
        blit(ctx,IM.garden,x,foot);
        const beds=P.S.garden||[];
        const left=x-IM.garden.naturalWidth/2,top=foot-IM.garden.naturalHeight;
        beds.forEach((g,i)=>{
          if(!g||!P.CROPS[g.c])return;
          const need=(P.CROPS[g.c].h||1)*3600e3,leftMs=g.at-P.now(),prog=1-leftMs/need;
          let stage=null,sc=1;
          if(prog>=1)stage='ripe';
          else if(prog>=0.3)stage='grow';
          else if(prog>=0){stage='grow';sc=0.55}
          if(!stage)return;
          const im=IM['crop_'+g.c+'_'+stage];if(!ok(im))return;
          const cx=left+P.CROP_BED[g.c],by=top+P.CROP_BED.foot;
          const w=im.naturalWidth*sc,h=im.naturalHeight*sc;
          ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,Math.round(cx-w/2),Math.round(by-h),w,h);ctx.restore();
        });
      });
      plate(ctx,f.name,x,foot-IM.garden.naturalHeight);return true;
    }
    if(f.k==='fire'&&ok(IM.fire)){
      nightDraw(()=>{
        blit(ctx,IM.fire,x,foot);
        if(P.fireOpen&&P.fireOpen()){
          const i=1+Math.floor(((t||0)*6)%4);
          blit(ctx,IM['flame'+i],x,foot);
        }
      });
      plate(ctx,f.name,x,foot-IM.fire.naturalHeight);return true;
    }
    if(f.k==='bath'&&ok(IM.bath)){nightDraw(()=>blit(ctx,IM.bath,x,foot));plate(ctx,f.name,x,foot-IM.bath.naturalHeight);return true}
    if(f.k==='nursery'&&ok(IM.nursery)){nightDraw(()=>blit(ctx,IM.nursery,x,foot));plate(ctx,f.name,x,foot-IM.nursery.naturalHeight);return true}
    if(f.k==='camp'&&ok(IM.camp)){
      nightDraw(()=>{
        blit(ctx,IM.camp,x,foot);
        // 門樓右側空草地的訓練裝飾（木欄／稻草人／短旗），不取代 fac_camp。
        if(ok(IM.training)&&P.TRAIN_YARD_AT)blit(ctx,IM.training,P.TRAIN_YARD_AT.cx,P.TRAIN_YARD_AT.by);
      });
      plate(ctx,f.name,x,foot-IM.camp.naturalHeight);return true}
    if(f.k==='board'&&ok(IM.board)){
      const st=P.dispatchBoardState?P.dispatchBoardState():'full';
      const im=st==='empty'&&ok(IM.board_empty)?IM.board_empty:st==='partial'&&ok(IM.board_partial)?IM.board_partial:IM.board;
      const ay=(P.BOARD_ANCHOR&&P.BOARD_ANCHOR.ay)||im.naturalHeight, ax=(P.BOARD_ANCHOR&&P.BOARD_ANCHOR.ax)||(im.naturalWidth/2);
      nightDraw(()=>{ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,Math.round(x-ax),Math.round(foot-ay),im.naturalWidth,im.naturalHeight);ctx.restore()});
      plate(ctx,f.name,x,foot-ay);return true
    }
    return false;
  };
  P.facHit=(f,wx,y)=>{
    if(!f||!f.real)return false;
    const built=!!(P.S.fac&&P.S.fac[f.k]);
    const im=built&&IM[f.k==='fire'?'fire':f.k];
    const hw=im&&ok(im)?im.naturalWidth/2:110;
    const hh=im&&ok(im)?((f.k==='board'&&P.BOARD_ANCHOR)?P.BOARD_ANCHOR.ay:im.naturalHeight):200,foot=400;
    return Math.abs(wx-f.x)<hw+8&&y<foot+10&&y>foot-hh;
  };
  // 院子改立使用者繪製的入口標誌（entr_*），不再縮放建築外觀圖。圖未到時回退程式畫的素木牌。地名以遊戲木牌字體標在圖下方。
  P.drawSignpostFallback=(ctx,cx,by)=>{
    const w=48,h=64,x=Math.round(cx-w/2),y=Math.round(by-h);
    if(!ctx||typeof ctx.fillRect!=='function')return;
    const fill=(c,xx,yy,ww,hh)=>{ctx.fillStyle=c;ctx.fillRect(xx,yy,ww,hh)};
    fill('#1A1016',cx-4,y+30,9,h-30);
    fill('#8a5a32',cx-3,y+31,7,h-32);
    fill('#5a3820',cx-3,y+31,7,2);
    fill('#1A1016',x,y+2,36,30);
    fill('#c9a06a',x+2,y+4,32,26);
    fill('#e8c07a',x+2,y+4,32,3);
    fill('#a67c45',x+2,y+27,32,3);
    // 向右箭頭（路牌約定）
    fill('#1A1016',x+34,y+10,8,14);
    fill('#1A1016',x+40,y+7,4,20);
    fill('#1A1016',x+44,y+11,3,12);
    fill('#1A1016',x+47,y+14,3,6);
    fill('#d4b06a',x+34,y+12,7,10);
    fill('#d4b06a',x+40,y+10,3,14);
    fill('#d4b06a',x+43,y+13,3,8);
  };
  P.drawSignpost=(ctx,at,label)=>{
    const cx=at.cx,by=at.by,im=at.img&&IM[at.img],use=ok(im);
    withNight(ctx,()=>{
      if(use)blit(ctx,im,cx,by);
      else P.drawSignpostFallback(ctx,cx,by);
    });
    plate(ctx,label,cx,by+2);
  };
  P.housingProps=ctx=>{
    const out=[];
    for(const [k,at]of Object.entries(P.HOUSING_AT)){
      const vis=P.houseVis(k);if(!vis)continue;
      out.push({y:at.by,draw:()=>{
        const label=vis==='building'?(at.name+' 施工中'):at.name;
        P.drawSignpost(ctx,at,label);
      }});
    }
    return out;
  };
  P.housingHit=(wx,y)=>{
    for(const [k,at]of Object.entries(P.HOUSING_AT)){
      if(!P.houseVis(k))continue;
      // 熱區跟入口圖＋下方地名木牌走，仍讓出櫃檯木牌與櫃檯本身
      if(k==='sidewing'&&wx>40&&wx<370&&y>50&&y<360)continue;
      const hw=(at.w||48)/2+10,top=at.by-(at.h||64)-8;
      if(Math.abs(wx-at.cx)<hw&&y>top&&y<at.by+36)return k;
    }
    return null;
  };
  P.housingTap=k=>{
    const vis=P.houseVis(k),at=P.HOUSING_AT[k];if(!vis||!at)return;
    if(vis==='building'){const left=Math.max(0,(P.S[k].until||0)-P.now()),h=Math.ceil(left/3600000);return P.ui&&P.ui.toast(`${at.name}施工中（還要 ${h} 小時）`)}
    if(k==='sideyard'&&P.go)return P.go('sideyard');
    if(P.ui&&P.ui.toast)P.ui.toast(at.name+'：'+((P.expansionEffect&&P.expansionEffect(k))||''));
  };
  const props0=P.p51Props;if(props0)P.p51Props=(ctx,T)=>{const a=props0(ctx,T)||[],b=P.housingProps(ctx)||[];return a.concat(b).sort((x,y)=>x.y-y.y)};
  const tap0=P.p51Tap;P.p51Tap=(wx,y)=>{const k=P.housingHit(wx,y);if(k){P.housingTap(k);return true}return !!(tap0&&tap0(wx,y))};
  const yb0=P.yardBlocks;if(yb0)P.yardBlocks=ignore=>{
    const out=yb0(ignore)||[];
    for(const [k,at]of Object.entries(P.HOUSING_AT)){
      if(!P.houseVis(k))continue;
      out.push([at.cx-(at.w||48)/2-2,at.by-(at.h||64),at.cx+(at.w||48)/2+2,at.by+8]);
    }
    return out;
  };
  P.scenes=P.scenes||{};
  P.scenes.sideyard={
    enter(){if(P.S.sideyard!==1){P.ui&&P.ui.toast('側院還沒蓋好');return P.go('shelter')}P.ui&&P.ui.bar([['⬅ 回收容所',()=>P.go('shelter')]])},
    leave(){},
    update(){},
    draw(ctx){const im=IM.sideyard_scene;if(ok(im)){ctx.imageSmoothingEnabled=false;withNight(ctx,()=>ctx.drawImage(im,0,0,1280,720))}else{ctx.fillStyle='#7fb069';ctx.fillRect(0,0,1280,720)}},
    tap(){},
    hud(){return '<span>🌿 側院</span>'}
  };
  // 空地石板：取代未建成設施與農場小屋空地的木牌／色塊佔位。160×48，1 倍、腳底中央對齊地面。
  P.drawPlotSlab=(ctx,cx,by)=>{
    const im=IM.slab;if(!ok(im)||!ctx)return false;
    withNight(ctx,()=>blit(ctx,im,cx,by));
    return true;
  };

  // 城堡記號馬車：車身 320×224，輪子 48×48 中心 (24,24)。
  // 車身不透明底邊約 y=180（右側車轅略至 180）；畫布下方留空給輪子。
  // 兩隻可見輪軸取自底框內側：後輪 (80,180)、前輪近車轅 (236,180)。先畫輪再畫車身。
  // 輪底 y=204 當腳點。移動時兩格輪交換，停妥用第 0 格。
  P.WAGON_AXLES=[[80,180],[236,180]];
  P.WAGON_FOOT=204;
  P.WAGON_AT={r4:{cx:1600,by:460}};
  P.castleWagonState=A=>{
    if(!(A&&A.cages&&A.cages.length))return 'closed';
    // In the full r4 build, leave the curtain closed through Grum's exit animation.
    const grum = A.en && A.en.find(e=>e.K && e.K.grum);
    const bossGone = !grum || (grum.dead && A.t >= grum.exitUntil);
    return A.cages.every(c=>c.hp<=0) && bossGone ? 'empty' : 'closed';
  };
  P.drawCastleWagon=(ctx,cx,by,opt)=>{
    opt=opt||{};
    const body=opt.empty?IM.wagon_empty:IM.wagon_closed;
    if(!ok(body)||!ctx)return false;
    const ax=body.naturalWidth/2, ay=P.WAGON_FOOT||204;
    const ox=Math.round(cx-ax), oy=Math.round(by-ay);
    const moving=!!opt.moving, t=opt.t||0;
    const wh=moving?(Math.floor(t*8)%2):0;
    const wheel=IM[wh?'wagon_wheel1':'wagon_wheel0'];
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(ok(wheel)){
      for(const [wx,wy] of (P.WAGON_AXLES||[])){
        ctx.drawImage(wheel,ox+wx-24,oy+wy-24);
      }
    }
    ctx.drawImage(body,ox,oy);
    ctx.restore();
    return true;
  };
  P.rescueStageProps=(ctx,A)=>{
    if(!(A&&A.quest&&A.quest.id==='r4'))return [];
    const at=(P.WAGON_AT&&P.WAGON_AT.r4)||{cx:1600,by:460};
    const empty=P.castleWagonState(A)==='empty';
    return [{y:at.by,draw:()=>P.drawCastleWagon(ctx,at.cx-A.cam,at.by,{empty,moving:false,t:A.t})}];
  };

  // 救援鐵籠改由 pet_rescue_stage.js 以 128×128 四態原圖繪製（不再把 220×160 尖刺籠車套在每個小籠上）。
  // unit_update_1111 不載入 pet_rescue_stage.js，仍需保留這個掛勾存在。
  if (typeof P.drawRescueCage !== 'function') P.drawRescueCage = function () { return false; };
})(window.PET);

