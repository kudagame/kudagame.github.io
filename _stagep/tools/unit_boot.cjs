// Node + jsdom only: mocked canvas/Image; not a browser-render or layout test.
// NODE_PATH=/tmp/petfix1110-node/node_modules node tools/unit_boot.cjs [root] [mode] [viewport]
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=process.argv[2]||path.resolve(__dirname,'..'),mode=process.argv[3]||'pending',viewport=(process.argv[4]||'390x844').split('x').map(Number);
const html=fs.readFileSync(root+'/index.html','utf8');
for(const m of html.matchAll(/(?:src|href)="([^"]+)/g)){const u=new URL(m[1],'https://kudagame.github.io/pettest/');assert.ok(u.pathname.startsWith('/pettest/'),'HTML URL escapes pettest');assert.ok(fs.existsSync(path.join(root,u.pathname.slice('/pettest/'.length))),'missing HTML resource '+m[1])}
const dom=new JSDOM(html,{url:'https://kudagame.github.io/pettest/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;
w.matchMedia=q=>({matches:q.includes("coarse"),media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
Object.defineProperty(w,'innerWidth',{value:viewport[0]});Object.defineProperty(w,'innerHeight',{value:viewport[1]});
const rect={left:0,top:100,width:viewport[0],height:viewport[0]*720/1280};
w.document.querySelector('#cv').getBoundingClientRect=()=>rect;
const realTimeout=w.setTimeout.bind(w);w.setTimeout=(f,ms,...a)=>realTimeout(f,ms===15000?20:ms,...a);
const errors=[],missing=[],fetches=[],raf=[];let draws=0;const requested=[];
w.console.error=(...x)=>{errors.push(x.map(String).join(' '));console.error(...x)};
w.addEventListener('error',e=>errors.push(e.message));
const noop=()=>{};w.Path2D=class{moveTo(){}lineTo(){}closePath(){}rect(){}arcTo(){}roundRect(){}addPath(){}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({canvas:this,measureText:t=>({width:String(t).length*10}),getImageData:()=>({data:new Uint8ClampedArray(this.width*this.height*4)}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),drawImage:()=>draws++},{get:(o,k)=>k in o?o[k]:noop})};
w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,';
w.HTMLMediaElement.prototype.play=function(){if(this.src){const u=new URL(this.src);assert.ok(u.pathname.startsWith('/pettest/'),'audio escapes pettest: '+u);assert.ok(fs.existsSync(path.join(root,decodeURI(u.pathname.slice('/pettest/'.length)))),'missing audio: '+u)}return Promise.resolve()};w.HTMLMediaElement.prototype.pause=noop;w.HTMLMediaElement.prototype.load=noop;
w.Image=class{set src(s){requested.push(s);this._src=s;let file=path.resolve(root,s.split('?')[0]);assert.ok(file.startsWith(path.resolve(root)+path.sep),'asset escapes pettest: '+s);if(mode==='image-timeout'&&s.startsWith('assets/pets/cat_v3/body_')&&s.includes('_idle'))return;const late=mode==='late-image'&&s.includes('assets/pets/shihtzu_v3/body_')&&s.includes('_idle');this.complete=true;if(fs.existsSync(file)){const b=fs.readFileSync(file);this.width=this.naturalWidth=s.includes('.png')?b.readUInt32BE(16):1280;this.height=this.naturalHeight=s.includes('.png')?b.readUInt32BE(20):720;late?(this.complete=false,setTimeout(()=>{this.complete=true;this.onload?.()},60)):queueMicrotask(()=>this.onload?.())}else{missing.push(s);this.naturalWidth=0;queueMicrotask(()=>this.onerror?.())}}get src(){return this._src}};
w.fetch=async(s)=>{fetches.push(s);if(mode==='pending')return new Promise(()=>{});if(mode==='throw')throw Error('offline');return {ok:false,status:Number(mode),json:async()=>{throw Error('should not parse !ok')}}};
w.requestAnimationFrame=f=>{raf.push(f);return raf.length};
for(const f of [...html.matchAll(/<script src="([^"]+)/g)].map(m=>m[1]))try{w.eval(fs.readFileSync(path.join(root,f),'utf8')+'\n//# sourceURL='+f)}catch(e){errors.push(f+': '+e.stack)}
if(mode==='bad-manifest') delete w.PET_ART_MANIFEST.shihtzu_v3;
if(mode==='saved-hybrids'){
 const P=w.PET,S=P.newState();P.S=S;P.migrate(S);S.unlock=1;S.gift0=1;S.quests.r1={done:1};
 for(const sp of Object.keys(P.HYB))S.pets.push(P.makeAnimal({sp,tier:1,look:0,baby:0}));
 w.localStorage.setItem(P.CFG.saveKey,JSON.stringify(S));
}
const start=Date.now();
if(mode==='image-timeout')setTimeout(()=>w.PET.art.ensurePet('cat',0,'idle'),30);
if(mode==='late-image')setTimeout(()=>assert.equal(w.PET.art.frame('shihtzu',0,'idle',0,false),null,'must not cache blank pending body'),30);
setTimeout(async()=>{
try{for(let i=0;i<8;i++){const f=raf.shift();if(f)f(w.performance.now()+16*i);await new Promise(r=>setTimeout(r,1))}}catch(e){errors.push(e.stack)}
try {
 const P=w.PET;
 if(mode==='asset-audit'){
  const groups={boot:[...new Set(requested)]};
  // Every species, all adult/baby looks, all actions including battle/skill sheets.
  for(const sp of [...P.SPECIES.map(s=>s.id),...Object.keys(P.HYB)]){
   const start=requested.length;
   const p=P.makeAnimal({sp,tier:2,look:2,baby:1,bornDay:P.dayKey(P.now())-3});P.S.babies.push(p);
   for(let tier=0;tier<5;tier++)for(const act of Object.keys(P.art.meta(sp).anchors))P.art.ensurePet(sp,tier,act);
   for(let tier=0;tier<5;tier++)P.art.photoInfo(sp,tier);
   await new Promise(r=>setTimeout(r,5));
   const requestsForSpecies=requested.slice(start);
   // Draw/read back the actual source selection, not just filenames from the directory.
   for(let tier=0;tier<5;tier++)for(const act of Object.keys(P.art.meta(sp).anchors))assert.ok(P.art.frame(sp,tier,act,0,false),'frame '+sp+act);
   assert.ok(P.art.icon(sp,2,false,64),'portrait '+sp);
   P.S.eq=p.id;P.go('arena',{mode:'boss'});for(let n=0;n<3;n++){P.scene.update(0.016);P.scene.draw(P.ctx);await new Promise(r=>setTimeout(r,1))}P.go('shelter');
   groups[sp]=[...new Set(groups.boot.concat(requested.filter(s=>/^assets\/(hero|mon)\//.test(s)),Object.entries(P.art.imgs).filter(([k])=>k.startsWith(sp+'|')).map(([,im])=>im.src),Object.entries(P.art.PHOTO).filter(([k])=>k.startsWith(sp+'|')).map(([,im])=>im.src)))];
  }
  await P.art.preloadAll();
  if(process.env.URL_LIST)fs.writeFileSync(process.env.URL_LIST,JSON.stringify({base:'https://kudagame.github.io/_stagep/',note:'boot is exact fresh default; species groups include boot plus all 5 tiers/looks and all actions, a superset of one spawned pet',groups,all:[...new Set(requested)]},null,2));
  assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);assert.equal(fetches.length,0);
  console.log(`asset-audit: ${groups.boot.length} boot requests, ${new Set(requested).size} full URLs, 18 species, no missing/escaped files`);dom.window.close();return;
 }
 if(mode==='dev-hybrids'){
  w.document.querySelector('#devBtn').click();w.document.querySelector('#devP [data-d="tab"][data-v="遺傳"]').click();
  for(const sp of ['moonhound','puffdog']){const before=P.all().length;w.document.querySelector('#devP [data-d="ghyb"][data-v="'+sp+'"]').click();assert.equal(P.all().length,before+1);assert.equal(P.S.babies.at(-1).sp,sp)}
  await new Promise(r=>setTimeout(r,10));for(const p of P.S.babies){assert.ok(P.art.frame(p.sp,P.artTier(p),'idle',0,false),'DEV spawned sprite ready');assert.match(P.ui.av(p,44),/<img/,'DEV portrait is not emoji placeholder')}assert.match(w.document.querySelector('#toast').textContent,/已生成/);assert.deepEqual(errors,[]);
  console.log('DEV moonhound/puffdog actual button clicks: PASS');dom.window.close();return;
 }
 assert.equal(fetches.length,0,'no dev fetches at any HTTP status');
 if(mode==='bad-manifest'){
  assert.ok(!P.booted);assert.match(w.document.querySelector('#bootStatus').textContent,/無法啟動/);
  assert.ok(w.document.querySelector('#bootStatus button'),'touch retry button');
 }else{
  assert.equal(P.booted,1);assert.equal(P.sceneName,'shelter');assert.equal(P.art.ready,true);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.ok(draws>0,'scene draws');
  assert.ok(w.document.querySelector('#bootStatus').classList.contains('hide'));
  assert.equal(P.art.missing.length>0,mode==='image-timeout','bounded image timeout/late recovery');
  if(mode==='late-image'){assert.ok(P.art.frame('shihtzu',0,'idle',0,false),'late body recovers after timeout');assert.equal(P.art.missing.length,0)}
  for(const sp of Object.keys(P.HYB))assert.equal(P.art.setFor(sp).sp,sp);
  if(mode==='saved-hybrids')assert.equal(P.all().length,8);
  else{
   assert.equal(P.all().length,0);assert.equal(P.S.unlock,0);assert.ok(!P.S.quests.r1?.done);
   assert.match(w.document.querySelector('#bar').textContent,/救援任務/);
   // Actual pointer event handlers, translated from phone screen to world coords.
   const pos={clientX:rect.left+206/1280*rect.width,clientY:rect.top+200/720*rect.height};
   const world=P.toWorld(pos);assert.ok(Math.abs(world.x-206)<1e-8&&Math.abs(world.y-200)<1e-8);
   for(const name of ['pointerdown','pointerup']){
    const e=new w.MouseEvent(name,{...pos,bubbles:true});Object.defineProperty(e,'pointerId',{value:1});Object.defineProperty(e,'pointerType',{value:'touch'});P.cv.dispatchEvent(e);
   }
   assert.ok(P.ui.isOpen(),'phone touch opens counter');P.ui.close();
   w.document.querySelector('#bar button').click();assert.equal(P.sceneName,'arena','r1 button starts rescue');
   assert.ok(!P.S.quests.r1?.done,'starting is not completing/rewarding');assert.equal(P.all().length,0);
   P.scene.update(0.016);P.scene.draw(P.ctx);
  }
  assert.deepEqual(errors,[],'no errors after pointer/button actions');
 }
 console.log(`boot ${mode} ${viewport.join('x')}: PASS; ${draws} scene draws; 0 outside fetches; 0 missing files`);
}catch(e){console.error(e);process.exitCode=1}
dom.window.close();
},200);
