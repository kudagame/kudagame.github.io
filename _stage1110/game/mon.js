'use strict';
// ===== 可替換的怪物圖：另一邊轉好的像素圖（/workspace/game/monsters/<id>_px.png）經你確認後，
// tools/mon_sync.py 會複製到 a/mon/ 並寫 a/mon/mon.json；沒有確認的就用暫代圖 =====
// mon.json: {"<prefix>":{"file":"<id>.png","h":畫面高度(px, 原尺寸),"face":"R"|"L"}}  或 {"img:b4_stele":{"file":"..."}}
const MON={ov:{},ready:false};
// 第五關的小怪跟別關不同：先用泥魔像染藍暫代（s5m 近戰 / s5a 遠程）
const MON_PH={s5m:['golem','hue-rotate(170deg) saturate(0.6) brightness(0.9)'],s5a:['golem','hue-rotate(200deg) saturate(0.6) brightness(0.85)']};
const isS5=()=>!!(S0&&(S0.stage==='b4mine'||S0.stage==='b4boss'));
fetch('a/mon/mon.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(j=>{for(const k in j){const e=j[k],im=new Image();
  im.onload=()=>{if(k.startsWith('img:')){IMG[k.slice(4)]=im;return}
    const [c,x]=mk(im.width,im.height);x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,im.width,im.height);
    MON.ov[k]={im,fl:c,h:e.h||im.height,face:e.face||'R'}};
  im.onerror=()=>window.__err.push('mon '+k);im.src='a/mon/'+e.file}}).catch(()=>{});
{const W0={};for(const k of ['anchor','spr','mob'])W0[k]=window[k];
const pre=n=>n.slice(0,n.indexOf('_'));
window.anchor=n=>{const p=pre(n);return MON_PH[p]?W0.anchor(MON_PH[p][0]+n.slice(p.length)):W0.anchor(n)};
window.spr=(n,sx,sy,o={})=>{const p=pre(n),ov=MON.ov[p];
  if(ov){const k=ov.h/ov.im.height*SS*(o.sc||1);X.save();X.globalAlpha=o.alpha==null?1:o.alpha;X.translate(Math.round(sx),Math.round(sy+(o.dy||0)*SS));
    if(o.filter)X.filter=o.filter;if(!!o.flip!==(ov.face==='L'))X.scale(-1,1);
    if(/_down|_dead/.test(n)){X.rotate(-Math.PI/2);X.translate(ov.im.width*k*0.5,-ov.im.height*k*0.15)}
    else if(o.rot){X.rotate(-o.rot*Math.PI/180)}
    if(/_attack|_slam|_spit|_bdraw/.test(n))X.rotate(0.08);
    X.drawImage(o.flash?ov.fl:ov.im,-ov.im.width*k/2,-ov.im.height*k,ov.im.width*k,ov.im.height*k);X.restore();return}
  if(MON_PH[p]){const [b,f]=MON_PH[p];return W0.spr(b+n.slice(p.length),sx,sy,{...o,filter:o.filter||f})}
  return W0.spr(n,sx,sy,o)};
window.mob=(k,x,y)=>{const m=W0.mob(k,x,y);if(m&&isS5()&&!m.skin&&(m.kind==='sword'||m.kind==='bow'))m.skin=m.kind==='bow'?'s5a':'s5m';return m};
window.__mon=MON}
