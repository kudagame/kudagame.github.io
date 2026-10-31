// 艾爾琳之旅 網頁版（PWA）啟動器：註冊 service worker、下載資源包（顯示進度）、再依序載入遊戲程式
(async()=>{const $=id=>document.getElementById(id);const msg=t=>{$('bootmsg').textContent=t};const bar=f=>{$('bootbar').style.width=Math.round(f*100)+'%'};
  const fail=t=>{msg(t);$('boot').classList.add('err')};
  try{
    if(!('serviceWorker' in navigator)){fail('這個瀏覽器不支援離線網頁程式（Service Worker）。請用 Safari 或 Chrome 開啟，並關閉「私密瀏覽」。');return}
    const reg=await navigator.serviceWorker.register('sw.js');
    if(!navigator.serviceWorker.controller){msg('第一次開啟：準備離線資料…');
      await new Promise(r=>{navigator.serviceWorker.addEventListener('controllerchange',r,{once:true});const iv=setInterval(()=>{if(navigator.serviceWorker.controller){clearInterval(iv);r()}},200)})}
    try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
    const ogg=(()=>{try{return new Audio().canPlayType('audio/ogg; codecs="vorbis"')!==''}catch(e){return false}})();const aud=ogg?'ogg':'m4a';
    await fetch('__cfg?aud='+aud,{cache:'no-store'});
    const idx=await (await fetch('pk/idx.json',{cache:'no-store'})).json();
    const packs=idx.packs.filter(p=>!p.aud||p.aud===aud);const total=packs.reduce((s,p)=>s+p.size,0);let done=0;
    msg('載入遊戲資料…');
    for(const p of packs){const r=await fetch('pk/'+p.file);if(!r.ok)throw new Error('下載失敗 '+p.file+' ('+r.status+')');
      const rd=r.body.getReader();let got=0;for(;;){const {done:d,value}=await rd.read();if(d)break;got+=value.length;bar((done+got)/total);
        msg('載入遊戲資料… '+((done+got)/1048576).toFixed(1)+' / '+(total/1048576).toFixed(1)+' MB')}
      done+=p.size}
    bar(1);msg('啟動中…');
    const ld=(s,t)=>new Promise((res,rej)=>{const e=document.createElement('script');e.src=s+(t?'?r='+t:'');e.onload=res;e.onerror=()=>{e.remove();t<2?setTimeout(()=>ld(s,t+1).then(res,rej),400):rej(new Error('載入 '+s+' 失敗'))};document.body.appendChild(e)});
    for(const s of idx.scripts)await ld(s,0);
    if(document.readyState==='complete')window.dispatchEvent(new Event('load'));
    const hide=()=>{if(typeof SAVE!=='undefined'&&SAVE){$('boot').remove();return}setTimeout(hide,150)};hide();
    reg.update&&setTimeout(()=>reg.update().catch(()=>{}),5000);
  }catch(e){fail('啟動失敗：'+(e&&e.message||e)+'　請重新整理再試一次。')}
})();
