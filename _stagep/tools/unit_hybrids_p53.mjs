// Asset routing regression test; mock canvas records sources (not a browser-render test).
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const missing=[];
class Img{set src(s){this._src=s;const f=path.join(root,s.split('?')[0]);this.complete=true;if(fs.existsSync(f)){const b=fs.readFileSync(f);this.naturalWidth=b.readUInt32BE(16);this.naturalHeight=b.readUInt32BE(20);queueMicrotask(()=>this.onload?.())}else{missing.push(s);this.naturalWidth=0;queueMicrotask(()=>this.onerror?.())}}get src(){return this._src}}
function cv(){const c={width:0,height:0,draws:[]};c.getContext=()=>({drawImage:(im,...r)=>c.draws.push({src:im.src,r}),getImageData:()=>({data:new Uint8ClampedArray(c.width*c.height*4)}),putImageData(){}});return c}
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,Image:Img,location:{protocol:'file:'},document:{createElement:cv},localStorage:{getItem(){return null},setItem(){},removeItem(){}}};ctx.window=ctx;ctx.PET={};vm.createContext(ctx);
for(const f of ['assets/pets/manifest.js','assets/portraits/manifest.js','assets/pets/hybrids_p53.js','pet/pet_data.js','pet/pet_core.js','pet/pet_art.js','pet/pet_lines.js','pet/pet_p3.js','pet/pet_gen.js','pet/pet_p4.js','pet/pet_p51.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const P=ctx.PET,A=P.art;P.S=P.newState();P.migrate(P.S);await A.load();await new Promise(r=>setTimeout(r,1));let checks=0,frames=0;
function ok(c,m){checks++;if(!c)throw Error(m)}
for(const sp of Object.keys(P.HYB)){
 ok(A.setFor(sp).sp===sp,'fallback '+sp);ok(!A.setFor(sp).tint,'double tint '+sp);
 for(let look=0;look<4;look++){
 const ph=A.photoInfo(sp,look);ok(ph.base===sp&&!ph.hyb&&ph.img.naturalWidth===96,'portrait '+sp+look);
 for(const [act,ans] of Object.entries(A.meta(sp).anchors))for(let f=0;f<ans.length;f++){
 const frame=A.frame(sp,look,act,f,false);ok(frame.draws.length===1,'wrong layers '+sp+act);ok(frame.draws[0].src.includes(`hybrid_${sp}/body_look${look}_${act}.png`),'wrong source '+sp+look+act);frames++;
 }
 const p=P.makeAnimal({sp,tier:0,look,baby:0,coat:[0,0]});for(let t=0;t<5;t++){p.tier=t;ok(P.artTier(p)===look,'rank changes adult appearance '+sp)}
 }
}
ok(!missing.some(s=>s.includes('hybrid_')),'missing hybrid images');console.log(`hybrid asset routing: ${checks} PASS, ${frames} frame draws, 32 portraits, 160 adult rank/coat checks; no missing hybrid images`);
