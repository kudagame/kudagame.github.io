// 僅公開版載入；完整開發包不載入，既有存檔不刪改。
'use strict';
(function(P){
 const R=P.RELEASE=Object.freeze({version:'pet-v1-20261111',rescue:Object.freeze(['r1']),expeditions:Object.freeze(['canyon']),redeye:false,decorP0:false});
 const coming='蜜糖媽媽：「山路那頭還有籠隊的蹤跡。先讓救回來的孩子安頓好，等斥候帶回消息，我再託你走下一程。」';
 const allowed=q=>R.rescue.includes(typeof q==='string'?q:q&&q.id);
 const qi=P.questInfo;P.questInfo=q=>allowed(q)?qi(q):{state:'locked',why:coming};
 const sq=P.startQuest;P.startQuest=id=>allowed(id)?sq(id):P.ui.toast(coming);
 const su=P.stageUnlocked;P.stageUnlocked=sk=>R.expeditions.includes(sk)&&su(sk);
 const go=P.go;P.go=(name,arg)=>{if(name==='arena'&&arg&&arg.mode==='rescue'&&!allowed(arg.quest||'r1'))return P.ui.toast(coming);return go(name,arg)};
 P.redeyeCleared=()=>false;
 const zi=P.zombieInfo;P.zombieInfo=()=>P.S.zombieBond?zi():{state:'locked',why:coming};
 // 委託內部閉包同樣會經過 panel，櫃檯與委託皆給 NPC 劇情提醒，不畫未開放灰卡。
 const panel=P.ui.panel;P.ui.panel=(html,click)=>{
  if(P.S.quests.r1&&P.S.quests.r1.done&&(/救援委託|蜜糖媽媽的櫃檯/.test(html)))
   html+='<div class="card release-story">'+P.ui.npc('蜜糖媽媽')+' '+coming+'</div>';
  html=html.replace(/assets\/[^\s\"'()<>]+\.(?:png|webp|ogg)(?![?])/g,url=>url+'?v=pv1-dfcf0683b273');
  return panel(html,click);
 };
 document.title='蜜糖之家｜寵物初版';
})(window.PET);
