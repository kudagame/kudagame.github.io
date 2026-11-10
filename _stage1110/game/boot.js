// 艾爾琳之旅 網頁版（PWA）啟動器：註冊 service worker、下載資源包（顯示進度）、再依序載入遊戲程式
(async()=>{const $=id=>document.getElementById(id);const msg=t=>{$('bootmsg').textContent=t};const bar=f=>{$('bootbar').style.width=Math.round(f*100)+'%'};
  const fail=t=>{msg(t);$('boot').classList.add('err')};
  try{
    if(!('serviceWorker' in navigator)){fail('這個瀏覽器不支援離線網頁程式（Service Worker）。請用 Safari 或 Chrome 開啟，並關閉「私密瀏覽」。');return}
    let reg=await navigator.serviceWorker.register('sw.js');
    if(!navigator.serviceWorker.controller){msg('第一次開啟：準備離線資料…');
      // 安裝失敗（例如網站剛更新、檔案還沒同步完）時 service worker 會變成 redundant：重試最多 3 次，不要卡在這個畫面
      for(let k=0;!navigator.serviceWorker.controller;k++){
        const res=await new Promise(r=>{const iv=setInterval(()=>{if(navigator.serviceWorker.controller){clearInterval(iv);r('ok')}
            const w=reg.installing||reg.waiting||reg.active;if(!w||w.state==='redundant'){clearInterval(iv);r('fail')}},250);
          navigator.serviceWorker.addEventListener('controllerchange',()=>{clearInterval(iv);r('ok')},{once:true})});
        if(res==='ok')break;if(k>=3)throw new Error('離線資料準備失敗');
        msg('第一次開啟：準備離線資料…（重試 '+(k+1)+'）');await new Promise(r=>setTimeout(r,1500*(k+1)));
        try{await reg.unregister()}catch(e){}reg=await navigator.serviceWorker.register('sw.js?retry='+Date.now())}}
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
