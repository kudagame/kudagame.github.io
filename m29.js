// W3 夾夾（治癒師）— 由 tools/m29cat.sh 產生，請改 src29/
window.HLX={
"sh_form": {
"n": 12,
"w": 220,
"h": 264,
"cols": 9,
"pad": 1,
"ox": -97,
"oy": -246,
"fps": 30,
"loop": false
},
"sh_loop": {
"n": 24,
"w": 126,
"h": 191,
"cols": 16,
"pad": 1,
"ox": -50,
"oy": -173,
"fps": 30,
"loop": true
},
"sh_hit": {
"n": 16,
"w": 189,
"h": 190,
"cols": 10,
"pad": 1,
"ox": -50,
"oy": -172,
"fps": 30,
"loop": false
},
"sh_break": {
"n": 24,
"w": 191,
"h": 206,
"cols": 10,
"pad": 1,
"ox": -80,
"oy": -188,
"fps": 30,
"loop": false
},
"t_heal": {
"n": 36,
"w": 59,
"h": 91,
"cols": 34,
"pad": 1,
"ox": -28,
"oy": -26,
"fps": 30,
"loop": true
},
"t_atk": {
"n": 36,
"w": 59,
"h": 91,
"cols": 34,
"pad": 1,
"ox": -28,
"oy": -26,
"fps": 30,
"loop": true
},
"bf_s": {
"n": 7,
"w": 17,
"h": 17,
"cols": 7,
"pad": 1,
"ox": -8,
"oy": -8,
"fps": 30,
"loop": true
},
"bf_l": {
"n": 7,
"w": 29,
"h": 27,
"cols": 7,
"pad": 1,
"ox": -14,
"oy": -13,
"fps": 30,
"loop": true
},
"bf_g": {
"n": 7,
"w": 39,
"h": 31,
"cols": 7,
"pad": 1,
"ox": -19,
"oy": -16,
"fps": 30,
"loop": true
},
"ult_in": {
"n": 39,
"w": 249,
"h": 264,
"cols": 8,
"pad": 1,
"ox": -119,
"oy": -251,
"fps": 15,
"loop": false
},
"ult_air": {
"n": 30,
"w": 185,
"h": 225,
"cols": 11,
"pad": 1,
"ox": -95,
"oy": -212,
"fps": 15,
"loop": true
},
"ult_out": {
"n": 25,
"w": 249,
"h": 242,
"cols": 8,
"pad": 1,
"ox": -121,
"oy": -229,
"fps": 15,
"loop": false
},
"ult_meta": {
"CAST": 78,
"AIRLEN": 300,
"END": 378,
"TOTAL": 428,
"LIFT": 24,
"CX": 205,
"GY": 282,
"SPD": 0.78
},
"pillar": {
"n": 10,
"w": 76,
"h": 608,
"cols": 10,
"pad": 1,
"ox": -37,
"oy": -600,
"fps": 30,
"loop": false
},
"burst": {
"n": 9,
"w": 688,
"h": 548,
"cols": 5,
"pad": 1,
"ox": -344,
"oy": -274,
"fps": 15,
"loop": false
},
"ph_orb": {
"n": 1,
"w": 19,
"h": 19,
"cols": 1,
"pad": 1,
"ox": -9,
"oy": -9,
"fps": 30,
"loop": false
},
"ph_trail": {
"n": 4,
"w": 9,
"h": 9,
"cols": 4,
"pad": 1,
"ox": -4,
"oy": -4,
"fps": 30,
"loop": false
},
"ph_boom": {
"n": 10,
"w": 113,
"h": 113,
"cols": 10,
"pad": 1,
"ox": -56,
"oy": -112,
"fps": 30,
"loop": false
},
"ph_boom2": {
"n": 10,
"w": 156,
"h": 141,
"cols": 10,
"pad": 1,
"ox": -79,
"oy": -126,
"fps": 30,
"loop": false
},
"ph_back": {
"n": 9,
"w": 37,
"h": 37,
"cols": 9,
"pad": 1,
"ox": -18,
"oy": -18,
"fps": 30,
"loop": false
},
"ph_aim": {
"n": 20,
"w": 73,
"h": 21,
"cols": 20,
"pad": 1,
"ox": -36,
"oy": -11,
"fps": 30,
"loop": false
},
"ko_fall": {
"n": 27,
"w": 200,
"h": 133,
"cols": 10,
"pad": 1,
"ox": -108,
"oy": -131,
"fps": 30,
"loop": false
},
"ko_lie": {
"n": 16,
"w": 199,
"h": 92,
"cols": 10,
"pad": 1,
"ox": -112,
"oy": -90,
"fps": 30,
"loop": true
},
"ko_meta": {
"soul_dx": -36,
"soul_y0": 30,
"soulN": 40,
"cx0": 210
}
};
// ---- src29/0_lifelink.js
// 生命連結 光之鍊子 — 像素程序繪製（JS 版，演算法與 lifelink.py 逐行相同）
// 用法：
//   const LL = LifeLink;                      // 或 import
//   const put = LL.ctxPut(ctx);               // 以 1×1 fillRect 畫整數像素（平塗、不反鋸齒）
//   LL.collar(put, nx, ny, t, 1, 'back', 11, 4);   // 先畫頸圈後半（在敵人之前）
//   ...畫敵人、畫角色...
//   const [ax, ay] = LL.neckPoint(x0, y0, nx, ny, 11, 4);
//   LL.drawLifeLink(put, x0, y0, ax, ay, t, state, p, nx, ny);   // state: 'travel'|'latch'|'tether'|'break'
//   LL.collar(put, nx, ny, t, 1, 'front', 11, 4);  // 頸圈前半
//   LL.mark(put, ex, ey-58, t); LL.groundRing(put, ex, ey+1, t);
// 也提供 drawLifeLinkCtx(ctx, x0,y0,x1,y1,t,state,p) 一次畫完（含頸圈前半與標記）。
(function (root) {
'use strict';
const EDGE=[112,20,38], RED=[204,42,46], ORNG=[240,104,48], GOLD=[255,200,76], GOLD2=[255,236,150], WHITE=[255,252,232];
const GDK=[150,78,28], GMID=[232,146,40];
const PUR=[[58,24,92],[118,58,178],[176,128,238],[236,226,255]];
const RING=[[128,22,40],[214,56,56]];
const FL=[[120,160,44],[190,226,84],[238,250,160],[255,255,226]];
const PI=Math.PI, floor=Math.floor, sin=Math.sin, cos=Math.cos;
const mod=(a,b)=>{const r=a%b; return r<0?r+b:r;};          // Python 的 % （結果非負）
const trunc=Math.trunc;
function hsh(a,b){
  let h=(Math.imul(a,374761393)+Math.imul(b,668265263))>>>0;
  h=Math.imul((h^(h>>>13))>>>0,1274126177)>>>0;
  return (h^(h>>>16))>>>0;
}
function disc(put,x,y,r,c){
  const x0=floor(x-r), x1=floor(x+r), y0=floor(y-r), y1=floor(y+r), rr=r*r;
  for(let py=y0;py<=y1;py++) for(let px=x0;px<=x1;px++){
    const dx=px+0.5-x, dy=py+0.5-y; if(dx*dx+dy*dy<=rr) put(px,py,c);
  }
}
function path(x0,y0,x1,y1,t,state,p){
  const dx=x1-x0, dy=y1-y0; let d=Math.hypot(dx,dy)||1.0;
  const ux=dx/d, uy=dy/d, nx=-uy, ny=ux;
  let sag=Math.max(0.0,Math.min(16.0,(300.0-d)*0.07,d*0.12));
  const amp=0.6+sag*0.28;
  let head=1.0, lift=0.0;
  if(state==='travel'){ head=1.0-(1.0-p)*(1.0-p); lift=(1.0-head)*Math.min(8.0,d*0.06); sag=sag*head; }
  if(state==='break') sag=sag+p*22.0;
  const n=Math.max(8,trunc(d*head));
  const pts=[]; let s=0.0, px=null, py=null;
  for(let i=0;i<=n;i++){
    const u=head*i/n, b=sin(PI*u);
    let x=x0+dx*u, y=y0+dy*u;
    y+=sag*4.0*u*(1.0-u);
    let w=amp*b*sin(t*2.6)+0.8*b*sin(u*d/9.0-t*10.0);
    if(state==='tether' && d>250) w=w*0.5+0.6*b*sin(t*31.0);
    x+=nx*w; y+=ny*w;
    if(lift) y-=lift*sin(PI*u/head);
    if(px!==null) s+=Math.hypot(x-px,y-py);
    pts.push([x,y,u,s]); px=x; py=y;
  }
  return pts;
}
function band(put,pts,t,fade,keep){
  fade=fade||0;
  const sel=pts.filter(q=>!keep||keep(q[2])); if(!sel.length) return;
  const k=fade;
  const outer=[EDGE,EDGE,EDGE,EDGE][k], mid=[RED,RED,EDGE,EDGE][k], inn=[ORNG,RED,RED,EDGE][k];
  for(const [x,y,u] of sel) disc(put,x,y,2.3+0.5*(1-u),outer);
  for(const [x,y,u] of sel) disc(put,x,y,1.6+0.5*(1-u),u>0.22?mid:inn);
  if(k<3) for(const [x,y,u] of sel) disc(put,x,y,1.25+0.4*(1-u),u>0.22?inn:GOLD);
  if(k<2) for(const [x,y,u,s] of sel){
    const ph=mod(s-t*24.0,6.0);
    let c=ph<3.4?(u<0.3?GOLD2:GOLD):GMID;
    if(k===1) c=ph<3.4?GMID:ORNG;
    put(floor(x),floor(y),c);
    if(ph<1.0 && k===0) put(floor(x+0.5),floor(y+0.5),u<0.5?WHITE:GOLD2);
  }
}
const GL=[GMID,GOLD,GOLD2,WHITE], RL=[RED,ORNG,GOLD,GOLD2], DL=[EDGE,RED,ORNG,GOLD];
const ha=(c,a)=>[c[0],c[1],c[2],a];
function dots(put,pts,t,fade,keep,SP,V){
  fade=fade||0; SP=SP===undefined?5.0:SP; V=V===undefined?26.0:V;
  const L=pts[pts.length-1][3]; if(L<=0) return;
  const off=mod(t*V,SP), base=floor(t*V/SP), n=trunc(L/SP)+1;
  for(let k=0;k<=n;k++){
    const s=k*SP+off; if(s>L) break;
    const q=at(pts,s), u=q[2];
    if(keep && !keep(u)) continue;
    const idn=(k-base)&0xffff, h=hsh(idn,77);
    const ph=(h%628)/100.0, sp=7+(h>>>8)%6;
    const b=0.5+0.5*sin(t*sp+ph)-fade*0.22;
    if((h>>>16)%5===0 && mod(floor(t*6+(h>>>20)%6),4)===0) continue;
    if(b<0.12) continue;
    const lad=fade>=2?DL:(u<0.35?GL:RL);
    const x=q[0], y=q[1]+(((h>>>12)%3)-1)*0.6;
    if(b>0.65){ disc(put,x,y,2.7,ha(lad[0],0.45)); disc(put,x,y,1.8,lad[1]); disc(put,x,y,1.05,lad[2]); put(floor(x),floor(y),lad[3]); }
    else if(b>0.3){ disc(put,x,y,1.9,ha(lad[0],0.45)); disc(put,x,y,1.1,lad[1]); put(floor(x),floor(y),lad[2]); }
    else { disc(put,x,y,1.2,ha(lad[0],0.55)); put(floor(x),floor(y),lad[1]); }
  }
}
function at(pts,s){ for(const q of pts) if(q[3]>=s) return q; return pts[pts.length-1]; }
function sparkle(put,x,y,c1,c2,big){
  put(x,y,c1);
  if(big) for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]]) put(x+ox,y+oy,c2);
}
function extras(put,pts,t){
  const L=pts[pts.length-1][3];
  const f=mod(t/0.5,1.0), q=at(pts,f*L);
  disc(put,q[0],q[1],3.2,ha(GOLD,0.45)); disc(put,q[0],q[1],2.0,GOLD2); disc(put,q[0],q[1],1.0,WHITE);
  const K=Math.max(2,trunc(L/26)), fr=floor(t*8);
  for(let i=0;i<K;i++){
    const h=hsh(i*7+1,floor(fr/3));
    const u=(h%1000)/1000.0, age=((fr%3)+(h>>>10)%3)/5.0;
    const qq=at(pts,u*L), x=floor(qq[0]+((h>>>14)%7)-3), y=floor(qq[1]-3-age*7);
    sparkle(put,x,y,age<0.4?WHITE:GOLD2,age<0.4?GOLD:GMID,(h>>>20)%3===0&&age<0.6);
  }
}
function collar(put,x,y,t,p,layer,rx,ry,fade){
  rx=rx===undefined?11:rx; ry=ry===undefined?3:ry; fade=fade||0;
  const sweep=2*PI*Math.min(1.0,p), n=trunc(2*PI*rx)+8;
  const cols=[[EDGE,GOLD,WHITE],[EDGE,GMID,GOLD],[EDGE,RED,RED],[EDGE,EDGE,EDGE]][fade];
  const passes=[[1.5,cols[0]],[0.9,cols[1]],[0.5,cols[2]]];
  for(let pas=0;pas<3;pas++){ const [r,c]=passes[pas];
    for(let i=0;i<=n;i++){
      const a=-PI/2+sweep*i/n, front=sin(a)>-0.05;
      if((layer==='front')!==front) continue;
      const cx=x+cos(a)*rx, cy=y+sin(a)*ry+(front?0:-1);
      if(pas<2) disc(put,cx,cy,r,c);
      else { const ph=mod(a*rx-t*20,6.0); if(ph<3.0&&fade<2) put(floor(cx),floor(cy),ph<1.5?cols[2]:GOLD2); }
    }
  }
}
function latchFlash(put,x,y,p){
  const r=2+p*13, c=p<0.3?WHITE:(p<0.6?GOLD:GMID), n=trunc(2*PI*r)+6;
  for(let i=0;i<n;i++){ const a=2*PI*i/n; disc(put,x+cos(a)*r,y+sin(a)*r*0.8,p<0.6?1.2:0.7,c); }
  if(p<0.7){
    disc(put,x,y,4.5*(1-p),GOLD2); disc(put,x,y,2.5*(1-p),WHITE);
    for(let k=0;k<4;k++){ const a=PI/4+k*PI/2, L=4+10*p;
      for(let j=0;j<trunc(L);j++) put(floor(x+cos(a)*(r*0.6+j)),floor(y+sin(a)*(r*0.6+j)*0.8),j<L*0.5?WHITE:GOLD); }
  }
}
function mark(put,x,y,t,alpha){
  alpha=alpha===undefined?1.0:alpha; const rot=t*6.0;
  const col=q=>{ let c=q<0.25?PUR[3]:(q<0.6?PUR[2]:PUR[1]); if(alpha<0.6) c=q<0.6?PUR[1]:PUR[0]; return c; };
  for(let arm=0;arm<2;arm++) for(let i=0;i<60;i++){
    const q=i/59.0, a=rot+arm*PI+q*3.4*PI*0.75, r=1.2+q*8.0;
    disc(put,x+cos(a)*r,y+sin(a)*r*0.85,1.1,PUR[0]);
  }
  for(let arm=0;arm<2;arm++) for(let i=0;i<60;i++){
    const q=i/59.0, a=rot+arm*PI+q*3.4*PI*0.75, r=1.2+q*8.0;
    put(floor(x+cos(a)*r),floor(y+sin(a)*r*0.85),col(q));
  }
  put(floor(x),floor(y),PUR[3]);
}
function groundRing(put,x,y,t,rx,ry){
  rx=rx===undefined?18:rx; ry=ry===undefined?4:ry;
  const pul=0.5+0.5*sin(t*6.0), n=trunc(2*PI*rx)+8;
  for(let pas=0;pas<2;pas++){ const c=RING[pas];
    for(let i=0;i<n;i++){ const a=2*PI*i/n;
      if(pas===1 && ((i+trunc(t*20))%10)>=(pul>0.5?6:4)) continue;
      put(floor(x+cos(a)*rx),floor(y+sin(a)*ry),c); } }
}
function breakFx(put,pts,t,p){
  const k=Math.min(3,trunc(p*4));
  dots(put,pts,t,k,u=>u<0.5*(1-p)||u>1-0.5*(1-p));
  const m=pts[floor(pts.length/2)];
  for(let i=0;i<8;i++){
    const h=hsh(i+31,5), a=(h%628)/100.0, v=6+(h>>>12)%10;
    const x=m[0]+cos(a)*v*p, y=m[1]+sin(a)*v*p+p*p*14;
    if(p<0.85) put(floor(x),floor(y),p<0.4?GOLD2:(p<0.7?GMID:RED));
  }
}
function drawLifeLink(put,x0,y0,x1,y1,t,state,p,fx,fy){
  p=p===undefined?1.0:p;
  const pts=path(x0,y0,x1,y1,t,state,p);
  if(state==='travel'){ dots(put,pts,t); const [hx,hy]=pts[pts.length-1];
    disc(put,hx,hy,3.4,GMID); disc(put,hx,hy,2.4,GOLD2); disc(put,hx,hy,1.2,WHITE); }
  else if(state==='latch'){ dots(put,pts,t); latchFlash(put,fx==null?x1:fx,fy==null?y1:fy,p); }
  else if(state==='tether'){ dots(put,pts,t); extras(put,pts,t); }
  else if(state==='break'){ breakFx(put,pts,t,p); }
  disc(put,x0,y0,2.2,GOLD2); put(floor(x0),floor(y0),WHITE);
}
function selfLink(put,cx,cy,t,layer,rx,ry,x0,y0){
  rx=rx===undefined?22:rx; ry=ry===undefined?6:ry;
  collar(put,cx,cy,t,1.0,layer,rx,ry);
  if(layer==='front'){
    const a=t*3.0, bx=cx+cos(a)*rx, by=cy+sin(a)*ry;
    if(sin(a)>0){ disc(put,bx,by,2.0,GOLD2); disc(put,bx,by,1.0,WHITE); }
    if(x0!=null){ const pts=path(x0,y0,cx+rx*0.92,cy+ry*0.4,t,'tether',1.0); dots(put,pts,t,0,null,5.0); }
    const fr=floor(t*8);
    for(let i=0;i<3;i++){ const h=hsh(i*13+3,floor(fr/3)), aa=(h%628)/100.0, age=((fr%3)+(h>>>10)%3)/5.0;
      sparkle(put,floor(cx+cos(aa)*rx),floor(cy+sin(aa)*ry-3-age*8),GOLD2,GOLD,age<0.4); }
  }
}
function whipArc(put,cx,cy,r,ah,tail,fade){
  fade=fade||0; const n=Math.max(6,trunc(Math.abs(tail)*r*PI/180));
  const passes=[[2.4,GMID],[1.6,GOLD],[0.8,GOLD2]];
  for(let pas=0;pas<3;pas++){ if(fade && pas>=3-fade) break; const [rad,c]=passes[pas];
    for(let i=0;i<=n;i++){ const q=i/n, a=(ah-tail*q)*(PI/180), w=rad*(1.0-0.75*q);
      if(w<0.45) continue; disc(put,cx+cos(a)*r,cy+sin(a)*r*0.9,w,c); } }
  if(!fade){ const a=ah*(PI/180); disc(put,cx+cos(a)*r,cy+sin(a)*r*0.9,2.0,WHITE); }
}
function footFlame(put,x,y,t,p,layer){
  const hgt=1.0-Math.abs(p*2-1)**2;
  for(let i=0;i<9;i++){
    const a=PI*(i/8.0), fx=x+cos(a)*24, fy=y+sin(a)*3, front=(i%2===1);
    if((layer==='front')!==front) continue;
    const h=hsh(i+5,floor(t*12)), H=(6+(h%9))*hgt*(front?0.6:1.0);
    for(let k=0;k<trunc(H);k++){ const q=k/Math.max(1,H), w=2.2*(1-q)+0.5;
      const c=q>0.75?FL[0]:(q>0.4?FL[1]:FL[2]); disc(put,fx+sin(k*0.7+i)*0.8,fy-k,w,c); }
    if(H>2) put(floor(fx),floor(fy),FL[3]);
  }
}
function whipLash(put,tx,ty,L,ah,bend,fade){
  fade=fade||0; const n=Math.max(8,trunc(L*1.5)); const passes=[[2.2,GMID],[1.4,GOLD],[0.7,GOLD2]];
  for(let pas=0;pas<3;pas++){ if(fade && pas>=3-fade) break; const [rad,c]=passes[pas];
    for(let i=0;i<=n;i++){ const q=i/n, a=(ah-bend*q*q)*(PI/180), r=L*q, w=rad*(1.0-0.55*q);
      if(w<0.45) continue; disc(put,tx+cos(a)*r,ty+sin(a)*r,w,c); } }
  if(!fade){ const a=(ah-bend)*(PI/180); disc(put,tx+cos(a)*L,ty+sin(a)*L,1.8,WHITE); }
}
function neckPoint(x0,y0,nx,ny,rx,ry){ rx=rx===undefined?11:rx; ry=ry===undefined?4:ry; const sgn=x0<nx?-1.0:1.0; return [nx+sgn*rx*0.85, ny+ry*0.5]; }
// canvas 2D：每個像素一個 1×1 fillRect；同色連續呼叫只換一次 fillStyle。畫面若有縮放，請先 ctx.imageSmoothingEnabled=false 並在 1× 座標系呼叫。
function ctxPut(ctx){ let last=null; return (x,y,c)=>{ if(c!==last){ ctx.fillStyle=c.length>3?`rgba(${c[0]},${c[1]},${c[2]},${c[3]})`:`rgb(${c[0]},${c[1]},${c[2]})`; last=c; } ctx.fillRect(x,y,1,1); }; }
// 便利版：已連結狀態一次畫完前景（頸圈前半＋鍊子＋標記）。頸圈後半請在畫敵人前呼叫 collar(...,'back')。
function drawLifeLinkCtx(ctx,x0,y0,nx,ny,t,state,p,opt){
  opt=opt||{}; const rx=opt.rx||11, ry=opt.ry||4, put=ctxPut(ctx);
  const [ax,ay]=neckPoint(x0,y0,nx,ny,rx,ry);
  if(opt.chest) mark(put,opt.chest[0],opt.chest[1],t,state==='break'?0.5:1.0);
  drawLifeLink(put,x0,y0,ax,ay,t,state,p,nx,ny);
  if(state==='latch') collar(put,nx,ny,t,(p-0.2)/0.6,'front',rx,ry);
  else if(state==='tether') collar(put,nx,ny,t,1.0,'front',rx,ry);
  else if(state==='break' && p<0.5) collar(put,nx,ny,t,1.0,'front',rx,ry,Math.min(3,trunc(p*4)+1));
}

// ===== v4：多色階點陣光點（不是實體鍊子）=====
let LW=[255,252,232], LP=[255,244,180], LG=[255,214,90], LA=[232,146,40], LAD=[180,96,30];
let PK=[[232,70,160],[255,150,210],[255,236,246]];
const BOOST=1.2;   // W3：lifelink.py 09:04 使用者「所有光鏈存在感 +20%」逐行移植
const PAL0={LW,LP,LG,LA,LAD,PK};
function withPal(pal,fn){if(!pal)return fn();const o={LW,LP,LG,LA,LAD,PK};({LW=LW,LP=LP,LG=LG,LA=LA,LAD=LAD,PK=PK}=pal);try{return fn()}finally{({LW,LP,LG,LA,LAD,PK}=o)}}
function _grain(put,halo,core){
  for(const [px,py,I] of halo){for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]]) put(px+ox,py+oy,ha(LA,0.4+(BOOST-1)*0.5));
    if(BOOST>1&&I>0.85) for(const [ox,oy] of [[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[-2,0]]) put(px+ox,py+oy,ha(LA,0.3));}
  for(const [px,py,c] of core) put(px,py,c);
  if(BOOST>1){for(const [px,py,c] of core) if(c===LW||c===LP){put(px+1,py,c===LW?LP:LG);put(px,py+1,LG)}
    for(const [px,py,c] of core) if(c===LW) put(px,py,LW);}
}
const _lv=I=>I>0.95?LW:(I>0.7?LP:(I>0.45?LG:(I>0.2?LA:null)));
function sparkPath(put,pts,t,fade,keep,pulse){
  fade=fade||0; pulse=pulse===undefined?true:pulse;
  const L=pts[pts.length-1][3]; if(L<2) return;
  const seed=floor(t*10), tw=floor(t*15), nseg=Math.max(1,trunc(L/10.0)+1);
  const V=[];
  for(let j=0;j<=nseg;j++){
    const s=Math.min(L,j*L/nseg), q=at(pts,s), q2=at(pts,Math.min(L,s+2.0));
    const dx=q2[0]-q[0], dy=q2[1]-q[1], dl=Math.hypot(dx,dy)||1.0, h=hsh(j+1,seed);
    const off=(0<j&&j<nseg)?((h%9)-4)*0.75:0.0;
    V.push([q[0]-dy/dl*off,q[1]+dx/dl*off,q[2],s]);
  }
  const ps=pulse?mod(t/0.5,1.0)*L:-99.0;
  const halo=[], core=[];
  for(let j=0;j<nseg;j++){
    const hs=hsh(j+101,seed);
    if((hs%10)>=(7-fade*2)+((BOOST>1&&!fade)?1:0)) continue;
    const br=((hs>>>8)%4)/3.0, a0=((hs>>>12)%3)*0.12, a1=1.0-((hs>>>14)%3)*0.12;
    const [x0,y0,u0,s0]=V[j], [x1,y1,u1,s1]=V[j+1];
    const n=Math.max(1,trunc(Math.hypot(x1-x0,y1-y0)));
    for(let k=0;k<=n;k++){
      const f=k/n; if(f<a0||f>a1) continue;
      const u=u0+(u1-u0)*f, s=s0+(s1-s0)*f;
      if(keep && !keep(u)) continue;
      if(hsh(j*64+k,tw)%7===0) continue;
      const wave=0.5+0.5*sin(s*0.18-t*14.0);
      let I=0.15+br*0.45+wave*0.5-fade*0.25+(BOOST-1)*0.5;
      if(Math.abs(s-ps)<6.0) I+=0.6;
      const c=_lv(I); if(c===null) continue;
      const px=floor(x0+(x1-x0)*f), py=floor(y0+(y1-y0)*f);
      core.push([px,py,c]); if(I>0.7-(BOOST-1)*0.5) halo.push([px,py,I]);
    }
  }
  _grain(put,halo,core);
  const sg=floor(t*4);
  for(let i=0;i<Math.max(1,trunc(L/70*BOOST));i++){
    const h=hsh(i+211,sg), q=at(pts,((h%1000)/1000.0)*L);
    if(keep && !keep(q[2])) continue;
    const b=0.5+0.5*sin(t*9.0+(h>>>10)%7);
    if(b<0.35||fade>=2) continue;
    const x=floor(q[0]+((h>>>14)%13)-6), y=floor(q[1]-4-((h>>>18)%7));
    put(x,y,PK[2]); const arm=b>0.7?2:1;
    for(let d=1;d<=arm;d++){ const c=d===1?PK[1]:PK[0]; put(x+d,y,c); put(x-d,y,c); put(x,y+d,c); put(x,y-d,c); }
  }
  const gs=floor(t*8);
  for(let i=0;i<trunc(L/12*BOOST);i++){
    const h=hsh(i+401,gs), q=at(pts,((h%1000)/1000.0)*L);
    if(keep && !keep(q[2])) continue;
    put(floor(q[0]+((h>>>10)%13)-6),floor(q[1]+((h>>>14)%11)-5),ha((h>>>20)%3?LG:LP,0.6));
  }
}
function sparkRing(put,x,y,t,p,layer,rx,ry,fade){
  rx=rx===undefined?11:rx; ry=ry===undefined?4:ry; fade=fade||0;
  const sweep=2*PI*Math.min(1.0,Math.max(0.0,p)), n=trunc(2*PI*rx)+8, seed=floor(t*10), tw=floor(t*15);
  const halo=[], core=[];
  for(let i=0;i<=n;i++){
    const a=-PI/2+sweep*i/n, front=sin(a)>-0.05;
    if((layer==='front')!==front) continue;
    if(hsh(floor(i/3)+7,seed)%4===0) continue;
    if(hsh(i+900,tw)%6===0) continue;
    const wave=0.5+0.5*sin(a*3.0-t*12.0);
    const I=0.35+wave*0.6-fade*0.3-(front?0.0:0.25);
    const c=_lv(I); if(c===null) continue;
    const px=floor(x+cos(a)*rx), py=floor(y+sin(a)*ry+(front?0:-1));
    core.push([px,py,c]); if(I>0.7-(BOOST-1)*0.5) halo.push([px,py,I]);
  }
  _grain(put,halo,core);
}
function drawLifeLink2(put,x0,y0,x1,y1,t,state,p,fx,fy){
  p=p===undefined?1.0:p;
  const pts=path(x0,y0,x1,y1,t,state,p);
  if(state==='travel'){ sparkPath(put,pts,t,0,null,false); const [hx,hy]=pts[pts.length-1];
    disc(put,hx,hy,2.6,ha(LA,0.45)); disc(put,hx,hy,1.6,LP); put(floor(hx),floor(hy),LW); }
  else if(state==='latch'){ sparkPath(put,pts,t,0,null,false); latchFlash(put,fx==null?x1:fx,fy==null?y1:fy,p); }
  else if(state==='tether'){ sparkPath(put,pts,t); }
  else if(state==='break'){
    const k=Math.min(3,trunc(p*4));
    sparkPath(put,pts,t,k,u=>u<0.5*(1-p)||u>1-0.5*(1-p),false);
    const m=pts[floor(pts.length/2)];
    for(let i=0;i<8;i++){ const h=hsh(i+31,5), a=(h%628)/100.0, v=6+(h>>>12)%10;
      if(p<0.85) put(floor(m[0]+cos(a)*v*p),floor(m[1]+sin(a)*v*p+p*p*14),p<0.4?LP:(p<0.7?LG:LA)); }
  }
  disc(put,x0,y0,2.0,ha(LG,0.5)); put(floor(x0),floor(y0),LW);
}
function selfLink2(put,cx,cy,t,layer,rx,ry,x0,y0){
  rx=rx===undefined?22:rx; ry=ry===undefined?5:ry;
  sparkRing(put,cx,cy,t,1.0,layer,rx,ry);
  if(layer==='front' && x0!=null){ const pts=path(x0,y0,cx+rx*0.92,cy+ry*0.4,t,'tether',1.0); sparkPath(put,pts,t,0,null,false); }
}
// v4 便利版：一次畫完前景（光路＋頸部光環前半＋標記）。光環後半請在畫敵人前呼叫 sparkRing(...,'back')。
function drawLifeLinkCtx2(ctx,x0,y0,nx,ny,t,state,p,opt){
  opt=opt||{}; const rx=opt.rx||11, ry=opt.ry||4, put=ctxPut(ctx);
  const [ax,ay]=neckPoint(x0,y0,nx,ny,rx,ry);
  if(opt.chest) mark(put,opt.chest[0],opt.chest[1],t,state==='break'?0.5:1.0);
  drawLifeLink2(put,x0,y0,ax,ay,t,state,p,nx,ny);
  if(state==='latch') sparkRing(put,nx,ny,t,(p-0.2)/0.6,'front',rx,ry);
  else if(state==='tether') sparkRing(put,nx,ny,t,1.0,'front',rx,ry);
  else if(state==='break' && p<0.5) sparkRing(put,nx,ny,t,1.0,'front',rx,ry,Math.min(3,trunc(p*4)+1));
}
const API={withPal,BOOST,at,ha,sparkPath,sparkRing,drawLifeLink2,selfLink2,drawLifeLinkCtx2,hsh,disc,path,band,dots,extras,collar,latchFlash,mark,groundRing,breakFx,drawLifeLink,selfLink,whipArc,whipLash,footFlame,neckPoint,ctxPut,drawLifeLinkCtx,
  BREAK_DIST:320, COLORS:{EDGE,RED,ORNG,GOLD,GOLD2,WHITE,GDK,GMID,PUR,RING,FL}};
if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.LifeLink=API;
})(typeof window!=='undefined'?window:globalThis);

// ---- src29/a_heal.js
// ===== W3：治癒師「老鼠國王 夾夾」核心（輸入、動作、傷害、治療、受傷、AI）=====
// 數值依 design §10/§11/§13 定稿；所有特效畫法在 b_fx.js，介面在 c_ui.js
// W3.2 平衡（2026-11-06）：光柱 DoT 不再疊 wm/罪印/祝福；慈悲 9%/48%；wm 1.12；絕招填充 28s；回流 0.5%/8%；脈動 5600 — 靠補血磨贏、不可秒殺同關其他英雄
const HL={sp:300,spy:150,jv:1250,dash:{cd:0.9,dur:0.22,dist:150,inv:0.2},
  atk:[{v:1700,dur:0.33,hit:0.13,rng:150,f:'atk1_'},{v:1600,dur:0.32,hit:0.12,f:'atk2_',bolt:1},{v:1950,dur:0.40,hit:0.16,rng:140,kb:20,f:'atk3_'},{v:1150,dur:0.47,hit:0.14,n:3,f:'atk2_',bolt:1}],
  link:{v:3200,cd:5,dot:780,tick:0.5,dur:8,max:3,slow:0.7,mark:0.08,spl:0.6,splR:90,splN:3,heal:0.0015,brk:320,rng:340,dur0:0.66,fly:0.27,lat:0.42},
  spirit:{every:3,max:3,n:12,v:520,gap:0.5,heal:0.002,bless:0.22,blessT:9},
  ph:{v:3000,n:6,r:56,v6:7000,r6:70,stun:0.8,heal:0.012,heal6:0.04,cd:9,spd:950,rng:520,cast:0.24,out:0.12},
  pu:{v:5600,n:6,nF:8,len:260,slow:0.75,slowT:3,pain:600,painT:4,painN:2,heal:0.01,healMax:0.06,cd:9,root:0.83,fire:0.3},
  pr:{cast:0.5,abs:0.255,reg:0.04,ctr:1560,ctrCD:0.5,dur:15,cd:15,weak:0.9},
  gl:{dur:15,every:1.5,v:2000,n:3,rng:400,fear:260,fearT:3,heal:0.012,cd:25,cast:0.4,H:[-56,124],A:[78,124],lerp:0.09},
  ult:{cast:2.6,air:10,out:1.67,burst:8800,pil:9000,pilR:400,heal:0.08,cap:0.16,sanR:380,sanAtk:0.75,sanSpd:0.3,dr:0.4,ms:0.65,cry:{n:3,v:2000,heal:0.012},boom:4200,boomHeal:0.015,fill:28,airGap:0.32},
  mercy:{p:0.06,cap:0.32,low:1.5,lowP:0.4,hurtT:1.2,hurtK:0.4,dodge:0.10,dodgeCD:1,woundT:4,woundK:0.15},
  // W3.1 自我續航：生命回流（連結每跳把光點拉回自己）＋慈光庇護（重傷時金色光點圈，短暫不受傷＋分段回血）
  sus:{share:0.06,tick:0.005,low:1.6,lowP:0.4,cap:0.08,gr:{p:0.4,big:0.3,cd:10,inv:0.9,n:4,v:0.03,gap:0.3,kb:170}},hm:1,cap:0.06,heavy:{p:0.15,t:2.5},faith:{max:6,icd:1,decay:5,per:0.04},wm:2.7,dotK:2.6,crit:1.87,res:0.06,resMax:0.30};
window.HL=HL;
// 杖頭水晶位置（腳下為原點，由 tools/heal_export 匯出的 s_hl_* 量出）
const HL_TIP={"atk1_0":[52,-58],"atk1_1":[63,-87],"atk1_2":[63,-102],"atk1_3":[62,-102],"atk1_4":[62,-98],"atk1_5":[62,-76],"atk2_0":[63,-98],"atk2_1":[51,-111],"atk2_2":[33,-115],"atk2_3":[63,-100],"atk2_4":[65,-96],"atk2_5":[64,-90],"atk3_0":[50,-38],"atk3_1":[49,-42],"atk3_2":[50,-44],"atk3_3":[48,-42],"atk3_4":[49,-40],"atk3_5":[49,-37],"depart0":[51,-111],"depart1":[33,-115],"idle0":[42,-31],"idle1":[42,-31],"idle10":[42,-31],"idle11":[42,-31],"idle2":[42,-31],"idle3":[42,-31],"idle4":[42,-31],"idle5":[42,-31],"idle6":[42,-31],"idle7":[42,-31],"idle8":[42,-31],"idle9":[42,-31],"link0":[52,-58],"link1":[63,-98],"link2":[51,-111],"link3":[33,-115],"link4":[63,-100],"link5":[63,-102],"link6":[62,-98],"link7":[62,-76],"link8":[52,-58],"run0":[39,-31],"run1":[40,-31],"run2":[42,-31],"run3":[44,-31],"run4":[45,-31],"run5":[44,-31],"run6":[42,-31],"run7":[40,-31],"walk0":[40,-31],"walk1":[41,-31],"walk2":[42,-31],"walk3":[43,-31],"walk4":[44,-31],"walk5":[43,-31],"walk6":[42,-31],"walk7":[41,-31]};
Object.assign(HL_TIP,{"dash0":[40,-31],"dash1":[43,-31],"dash2":[46,-30],"dash3":[47,-30],"dash4":[45,-31],"dash5":[42,-31]},{hurt0:[49,-43],hurt1:[49,-43]});
const HL_ULT_HAND=[[56,-101],[56,-100],[56,-100],[56,-99],[56,-99],[56,-98],[56,-98],[56,-98],[56,-99],[56,-99],[56,-99],[56,-100],[56,-99],[56,-100],[56,-100],[56,-101],[56,-102],[56,-102],[56,-103],[56,-103],[56,-104],[56,-104],[56,-104],[56,-104],[56,-103],[56,-103],[56,-102],[56,-102],[56,-102],[56,-102]];
const HL_ULT_IN_HAND=[[51,-111],[51,-111],[51,-111],[51,-111],[51,-111],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31],[38,-60],[38,-60],[38,-60],[40,-60],[43,-62],[45,-64],[47,-68],[50,-72],[51,-75],[53,-79],[54,-83],[55,-87],[56,-90],[56,-95],[56,-97],[56,-98],[56,-100],[56,-101],[56,-101],[56,-101],[56,-101],[56,-101],[56,-101],[56,-101]];
const HL_ULT_OUT_HAND=[[56,-101],[56,-101],[56,-101],[56,-101],[56,-101],[56,-100],[55,-95],[54,-89],[52,-84],[50,-78],[48,-73],[45,-67],[42,-62],[52,-58],[52,-58],[52,-58],[52,-58],[52,-58],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31],[42,-31]];
const hlOn=()=>HEROK==='heal';
const hlLive=m=>m&&!m.gone&&!m.dying;
const hlFoe=m=>hlLive(m)&&m.kind!=='pillar';
const hlBig=m=>m.kind==='boss'?60:m.kind==='pillar'?20:0;
const hlNeck=m=>m.kind==='boss'?190:m.kind==='pillar'?120:80;
const hlChest=m=>m.kind==='boss'?150:m.kind==='pillar'?110:58;
const hlD=(m,x,y)=>Math.hypot(m.x-x,(m.y-y)*2);
function hlS(){const P=S0.P;if(!P.hl||P.hl.s!==S0){P.hl={s:S0,cmb:0,cmbT:-9,links:[],cry:0,cryT:0,faith:0,fG:-9,fT:-9,fD:0,ug:0,lkCD:0,phCD:0,puCD:0,prCD:0,glCD:0,dCD:0,sh:null,blessU:0,blessNext:0,heavyU:0,
  win:{t0:-9,sk:0,m:0},mn:[],spirit:null,airJ:0,airK:0,stored:0,hc:0,lastH:-9};P.rh=0}return P.hl}
window.hlS=hlS;
const hlFmax=()=>HL.faith.max+((GS.g25&&GS.g25.hfaith)|0);
const hlBrk=()=>HL.link.brk+((GS.g25&&GS.g25.hbrk)||0);
const hlMvcd=()=>1-(GS.mvcd||0);
const hlSpd=()=>(1+(GS.aspd||0)+(S0.P.aftrU>S0.t?GS.aftr||0:0))*(buffed()?BUFF_SPD:1);
function hlTip(nm){const P=S0.P,o=HL_TIP[nm]||HL_TIP.idle0;return {x:P.x+o[0]*P.face,y:P.y,h:(P.h||0)-o[1]}}
// ---------- 傷害 ----------
const HLF={in:0,dot:0};
function hlFx(o){const s=S0;(s.hlfx=s.hlfx||[]).push(o)}
function hlMercy(){const P=S0.P,M=HL.mercy;hlHeal(M.p*(P.hp<HPMAX*M.lowP?M.low:1),'m')}
function hlHit(m,v,o){o=o||{};const s=S0;if(!hlLive(m))return 0;const sv=[POOL.n,POOL.c],st=[m.state,m.stun,m.vx,m.vh,s.hitstop];
  POOL.n=[v];POOL.c=[Math.round(v*HL.crit)];let r=0;HLF.in=1;try{r=hitMob(m,'n',{multi:!!o.multi})}finally{POOL.n=sv[0];POOL.c=sv[1];HLF.in=0}
  if(o.soft&&!m.dying){m.state=st[0];m.stun=st[1];m.vx=st[2];m.vh=st[3];s.hitstop=Math.max(st[4],Math.min(s.hitstop,0.02))}
  if(o.kb&&!m.dying&&m.kind!=='boss'&&m.kind!=='pillar')m.x=clamp(m.x+o.kb*(Math.sign(m.x-s.P.x)||s.P.face),30,WW-30);
  if(r>0&&!o.noMercy)hlMercy();if(r>0)hlUg(0);return r}
function hlDot(m,base,lab){const s=S0,t=s.t;if(!hlLive(m))return 0;if(m.kind==='boss'&&bossShielded())return 0;
  const crit=rnd()<(buffed()?0.55:0.32)+m2Crit(m);HLF.dot=1;let v;try{v=m2Dmg(base*(crit?HL.crit:1),m,'dot',crit)}finally{HLF.dot=0}
  if(m.kind==='boss'&&b4Prot())v*=0.2;v=Math.round(v);m.hp-=v;statHit(v,crit,false);m.flash=t+0.04;
  s.dmg.push({t,x:m.x+U(-16,16),y:(m.kind==='boss'?m.y-m.h-330:m.kind==='pillar'?m.y-250:m.y-m.h-150)+U(-6,14),v,crit,label:lab||'',zj:false,pet:false,hlD:1});
  if(m.hp<=0&&!m.dying)mobDie(m);return v}
window.hlHit=hlHit;window.hlDot=hlDot;
// 治療：技能 6%/秒（絕招中 20%/秒）、慈悲 40%/秒（分開算），重創中技能治療減半，信仰每層 +4%
function hlHeal(p,kind){const s=S0,P=s.P,t=s.t,H=hlS();if(P.dead||P.hp<=0)return 0;const w=H.win;if(t-w.t0>=1){w.t0=t;w.sk=0;w.m=0;w.v=0}
  let a=HPMAX*p;if((kind==='m'||kind==='v')&&t-(H.hurtT||-9)<HL.mercy.hurtT)a*=HL.mercy.hurtK;if(H.woundU>t&&kind!=='g'&&kind!=='u')a*=HL.mercy.woundK;if(kind!=='m'){a*=(1+HL.faith.per*H.faith)*(HL.hm||1);if(H.heavyU>t&&kind!=='g')a*=0.5}if(w.v==null)w.v=0;
  const ult=P.act&&P.act.type==='hu';const cap=kind==='g'?1e12:HPMAX*(kind==='m'?HL.mercy.cap:kind==='v'?HL.sus.cap*(HL.hm||1):(ult?HL.ult.cap:HL.cap)*(HL.hm||1)),used=kind==='m'?w.m:kind==='v'?w.v:kind==='g'?0:w.sk;a=Math.max(0,Math.min(a,cap-used));
  const a0=a;a=Math.min(a,HPMAX-P.hp);if(window.hlOver&&a0>a)hlOver(a0-a);a=Math.round(a);if(a<=0)return 0;P.hp+=a;if(window.__hlHK)__hlHK[kind]=(__hlHK[kind]||0)+a;if(kind==='m')w.m+=a;else if(kind==='v')w.v+=a;else if(kind!=='g')w.sk+=a;
  if(kind==='m'){H.mn.push({t,v:a});if(H.mn.length>6)H.mn.shift()}else s.heals.push({t,v:a});return a}
window.hlHeal=hlHeal;
function hlUg(v){}
// 罪印共鳴：身上有夾夾減益的敵人數
function hlDebuffed(m,t){return m.hlLinkU>t||m.hlPainU>t||m.hlFearU>t||m.hlSlowU>t}
window.m2Dmg=(o=>function(v,m,mv,crit){let r=o.apply(this,arguments);if(!hlOn()||typeof r!=='number'||mv==='pet'||!m)return r;const s=S0,t=s.t,H=hlS();
  // DoT（光柱／光縛／痛楚／恐懼）走「近絕對值」：保留 m2Dmg 裝備攻擊，但不疊 wm／罪印／祝福，避免中後期光柱破十萬
  let k;if(mv==='dot'){k=HL.dotK;if(m.hlLinkU>t)k*=1+HL.link.mark*0.5;k*=1+((GS.g25&&GS.g25.hdot)||0)}
  else{k=HL.wm;let n=0;for(const q of s.mobs)if(hlFoe(q)&&hlDebuffed(q,t))n++;k*=1+Math.min(HL.resMax,HL.res*n);
    if(m.hlLinkU>t)k*=1+HL.link.mark;if(H.blessU>t)k*=1+HL.spirit.bless}
  return Math.round(r*k)})(window.m2Dmg);
// ---------- 信仰 ----------
function hlFaith(n){const s=S0,t=s.t,H=hlS();const f0=H.faith;H.faith=Math.min(hlFmax(),H.faith+n);H.fG=t;H.fD=0;if(H.faith>f0&&H.faith===hlFmax())proc('信仰滿',[255,220,120],'信')}
// ---------- 動作 ----------
function hAct(type,dur,o){const P=S0.P;P.act=Object.assign({type,t:0,dur,done:false},o||{});return P.act}
function hlNearest(x,y,r,f,excl){let b=null,bd=1e9;for(const m of S0.mobs){if(!hlFoe(m)||(excl&&excl(m)))continue;const dx=m.x-x;if(f&&dx*f<-20)continue;const d=hlD(m,x,y)-hlBig(m);if(d<r&&d<bd){bd=d;b=m}}return b}
function hlOnScreen(m){const s=S0;return Math.abs(m.x-s.cam-640)<680}
// 普攻：刺擊→光彈→光掌→扇形光彈
function hlStartAtk(){const s=S0,P=s.P,t=s.t,H=hlS();const k=(t-H.cmbT<0.55)?(H.cmb+1)%4:0;H.cmb=k;const D=HL.atk[k];hAct('hj',D.dur,{k,hitAt:D.hit,fired:0});H.cmbT=t+D.dur;sfx('swing',0.22)}
function hlBolt(x,y,h,tg,v,o){const s=S0;(s.hlb=s.hlb||[]).push(Object.assign({x,y,h,tg,v,t0:s.t,vx:1100*S0.P.face,life:0.6,tr:[]},o||{}))}
function hlAtkHit(A){const s=S0,P=s.P,t=s.t,f=P.face,D=HL.atk[A.k];
  if(D.bolt){const tp=hlTip(D.f+'3');const tg=[];for(const m of s.mobs){if(!hlLive(m))continue;const dx=(m.x-P.x)*f;if(dx>-10&&dx<620+hlBig(m)&&Math.abs(m.y-P.y)<70+hlBig(m)*0.4)tg.push(m)}
    tg.sort((a,b)=>Math.abs(a.x-P.x)-Math.abs(b.x-P.x));
    if(!D.n){hlBolt(tp.x,tp.y,tp.h,tg[0]||null,D.v,{k:0});return}
    const n=tg.length;for(let i=0;i<3;i++){let m=null;if(n===1)m=i<2?tg[0]:null;else if(n>=2)m=tg[i%n];setTimeout0(i*0.05,()=>{const q=hlTip('atk2_3');hlBolt(q.x,q.y,q.h,m&&hlLive(m)?m:null,D.v,{k:1,ang:(i-1)*0.25,multi:n>=2})})}return}
  let hit=0;const tg=s.mobs.filter(m=>hlLive(m)&&(m.x-P.x)*f>-20&&(m.x-P.x)*f<D.rng+hlBig(m)&&Math.abs(m.y-P.y)<40+hlBig(m)*0.4);
  for(const m of tg){if(hlHit(m,D.v,{multi:tg.length>=2,kb:D.kb}))hit++;if(m.hlLinkU>t)hlNormFaith()}
  if(hit){const tp=hlTip(D.f+'3');hlFx({k:'hl_spark',x:tp.x+20*f,y:P.y,h:tp.h,t0:t,c:A.k===2?'gold':'mint'})}}
function hlNormFaith(){const s=S0,t=s.t,H=hlS();if(t-H.fT>=HL.faith.icd){H.fT=t;hlFaith(1)}}
function hlBoltsStep(dt){const s=S0,t=s.t;if(!s.hlb)return;for(const b of s.hlb){const age=t-b.t0;b.tr.push([b.x,b.h]);if(b.tr.length>5)b.tr.shift();
    if(b.tg&&hlLive(b.tg)){const m=b.tg,ty=hlChest(m),dx=m.x-b.x,dh=ty-b.h,dy=m.y-b.y,d=Math.hypot(dx,dh);const sp=1100*dt;
      if(d<sp+12){b.dead=1;if(hlHit(m,b.v,{multi:b.multi})&&m.hlLinkU>t)hlNormFaith();hlFx({k:'hl_spark',x:m.x,y:m.y,h:ty,t0:t,c:'mint'});continue}
      b.x+=dx/d*sp;b.h+=dh/d*sp;b.y+=dy*Math.min(1,dt*10)}
    else{b.x+=(b.vx||1100)*dt*Math.cos(b.ang||0);b.h+=-Math.sin(b.ang||0)*1100*dt*0.3;
      for(const m of s.mobs){if(!hlLive(m))continue;if(Math.abs(m.x-b.x)<26+hlBig(m)&&Math.abs(m.y-b.y)<34+hlBig(m)*0.4){b.dead=1;if(hlHit(m,b.v,{})&&m.hlLinkU>t)hlNormFaith();hlFx({k:'hl_spark',x:m.x,y:m.y,h:hlChest(m),t0:t,c:'mint'});break}}}
    if(age>b.life)b.dead=1}
  s.hlb=s.hlb.filter(b=>!b.dead)}
// 生命連結
function hlStartLink(){const s=S0,P=s.P,t=s.t,H=hlS();H.lkCD=HL.link.cd*hlMvcd();hAct('hk',HL.link.dur0,{});s.callout={t0:t,txt:'生命連結'};sfx('summon',0.25)}
function hlLinkTo(m,air){const s=S0,P=s.P,t=s.t,H=hlS(),L=HL.link;if(!hlFoe(m))return null;
  let l=H.links.find(q=>q.m===m&&q.st!=='break');
  if(l){l.until=t+L.dur;l.lt=t;l.st='latch'}else{
    const act=H.links.filter(q=>q.st!=='break');if(act.length>=L.max){act.sort((a,b)=>a.until-b.until);hlBreak(act[0],1)}
    l={m,t0:t,lt:t,until:t+L.dur,next:t+L.tick,st:'latch',air:!!air};H.links.push(l)}
  m.hlLinkU=l.until;hlHit(m,L.v,{});hlFx({k:'hl_latch',m,t0:t});return l}
function hlSus(m){const s=S0,P=s.P,t=s.t,U=HL.sus;const lo=P.hp<HPMAX*U.lowP?U.low:1;const v=hlHeal(U.tick*lo,'v');
  if(v>0)hlFx({k:'hl_mote',x:m.x,y:m.y,h:hlChest(m),t0:t,lo:lo>1})}
// 慈光庇護：這一下會讓 HP 掉到 40% 以下（或單下 ≥30%、或致命）→ 金色光點圈 0.6 秒不受傷、1.2 秒內分 4 段回 12%（冷卻 12 秒）；致命的那一下留 1 HP
function hlGrace(r){const s=S0,P=s.P,t=s.t,H=hlS(),G=HL.sus.gr;if(t<(H.grCD||0)||P.dead)return r;const post=P.hp-r;
  if(!(post<HPMAX*G.p||r>=HPMAX*G.big))return r;H.grCD=t+G.cd;if(window.__hlHK)__hlHK.grN=(__hlHK.grN||0)+1;if(post<1)r=Math.max(0,P.hp-1);
  P.invU=Math.max(P.invU||0,t+G.inv);H.hc=0;// 光圈把貼身的小怪推開、打斷出手
  for(const m of s.mobs){if(m.gone||m.dying||m.kind==='boss'||m.kind==='pillar'||m.state==='down'||Math.abs(m.x-P.x)>G.kb||Math.abs(m.y-P.y)>60)continue;const d=m.x>=P.x?1:-1;m.wind=0;if(m.state!=='air'){m.state='stun';m.stun=t+0.5;m.vx=320*d}m.cd=Math.max(m.cd||0,1.2)}
  H.gr={t0:t,n:0,next:t+0.12};hlFx({k:'hl_grace',t0:t});sfx('ready',0.35);return r}
function hlGraceStep(){const s=S0,t=s.t,H=hlS(),g=H.gr,G=HL.sus.gr;if(!g)return;while(g&&t>=g.next&&g.n<G.n){g.n++;g.next+=G.gap;hlHeal(G.v,'g');hlFx({k:'hl_gpulse',t0:t})}if(g.n>=G.n)H.gr=null}
window.hlSus=hlSus;
function hlBreak(l,quiet){const t=S0.t;if(l.st==='break')return;l.st='break';l.tb=t;if(l.m)l.m.hlLinkU=0}
function hlLinksStep(dt){const s=S0,P=s.P,t=s.t,H=hlS(),L=HL.link;const tip=hlAttachment(P,t);
  for(const l of H.links){if(l.st==='break'){if(t-l.tb>0.35)l.dead=1;continue}const m=l.m;
    if(!hlLive(m)){// 殉痛爆裂：剩餘 DOT 的 50% 炸給附近 3 隻、連結跳到最近的敵人
      const left=Math.max(0,Math.floor((l.until-t)/L.tick));const v=Math.round(left*L.dot*0.5/3);
      const nb=s.mobs.filter(q=>hlFoe(q)&&q!==m&&hlD(q,m.x,m.y)<200).sort((a,b)=>hlD(a,m.x,m.y)-hlD(b,m.x,m.y)).slice(0,3);
      if(v>0&&nb.length){hlFx({k:'hl_mburst',x:m.x,y:m.y,h:hlChest(m),t0:t});for(const q of nb)hlDot(q,v/((buffed()?1:1)),'')}
      const nx=nb.find(q=>!(q.hlLinkU>t));l.dead=1;if(nx&&left>2){const n2=hlLinkTo(nx);if(n2){n2.until=Math.min(n2.until,t+left*L.tick)}}continue}
    if(Math.abs(m.x-P.x)>hlBrk()+hlBig(m)||Math.abs(m.y-P.y)>hlBrk()*0.5){hlBreak(l);continue}
    if(t>=l.until){hlBreak(l);continue}
    if(l.st==='latch'&&t-l.lt>0.25)l.st='tether';
    m.hlLinkU=l.until;if(m.kind!=='pillar'&&m.kind!=='boss'){const on=m.slowU>t&&m.slowK;m.slowU=Math.max(m.slowU||0,t+0.15);m.slowK=Math.min(on?m.slowK:1,L.slow)}
    if(m.kind==='boss'&&s.boss&&!s.boss.atk&&s.boss.nextAtk!=null)s.boss.nextAtk+=dt*0.08;
    if(H.sh)m.hlWeakU=t+0.2;
    while(t>=l.next&&l.next<=l.until){l.next+=L.tick;hlDot(m,L.dot);hlHeal(L.heal,'s');hlSus(m);
      const sp=s.mobs.filter(q=>hlFoe(q)&&q!==m&&hlD(q,m.x,m.y)<L.splR+hlBig(q)).slice(0,L.splN);for(const q of sp){hlDot(q,L.dot*L.spl);q.hlSlowU=t+0.6}}}
  H.links=H.links.filter(l=>!l.dead);
  // 光靈：連結中每 3 秒 1 顆光之結晶，3 顆 → 光靈
  const act=H.links.filter(l=>l.st!=='break');
  if(act.length){H.cryT+=dt;if(H.cryT>=HL.spirit.every){H.cryT-=HL.spirit.every;if(H.cry<HL.spirit.max){H.cry++;sfx('ready',0.15)}}}else H.cryT=0;
  const ult=P.act&&P.act.type==='hu';
  if(!ult&&H.cry>=HL.spirit.max&&!H.spirit){H.cry=0;H.spirit={t0:t,n:0,next:t+0.35,x:P.x,y:P.y,h:120,tg:act[0].m};s.callout={t0:t,txt:'光靈'};sfx('summon',0.3);
    if(H.blessNext){H.blessNext=0;H.blessU=t+HL.spirit.blessT;proc('光之祝福',[255,220,120],'祝')}}
  const sp=H.spirit;if(sp){let tg=sp.tg;if(!hlLive(tg)){const a2=H.links.find(l=>l.st!=='break'&&hlLive(l.m));tg=sp.tg=a2?a2.m:hlNearest(P.x,P.y,500)}
    const tx=tg?tg.x+Math.cos(t*5)*50:P.x-40*P.face,ty=tg?tg.y:P.y,th=tg?hlChest(tg)+30+Math.sin(t*7)*24:150;sp.x+=(tx-sp.x)*Math.min(1,dt*6);sp.y+=(ty-sp.y)*Math.min(1,dt*6);sp.h+=(th-sp.h)*Math.min(1,dt*6);
    while(t>=sp.next&&sp.n<HL.spirit.n){sp.n++;sp.next+=HL.spirit.gap;if(tg){hlHit(tg,HL.spirit.v,{soft:1});hlFx({k:'hl_spark',x:tg.x,y:tg.y,h:hlChest(tg),t0:t,c:'gold'})}hlHeal(HL.spirit.heal,'s')}
    if(sp.n>=HL.spirit.n&&t>sp.next){hlFx({k:'hl_puff',x:sp.x,y:sp.y,h:sp.h,t0:t});H.spirit=null}}}
// 幻痛
function hlStartPh(){const s=S0,P=s.P,t=s.t,H=hlS();H.phCD=HL.ph.cd*hlMvcd();hAct('hp',HL.ph.cast,{});s.callout={t0:t,txt:'幻痛'};sfx('wind',0.3)}
function hlPhLaunch(){const s=S0,P=s.P,t=s.t;const tg=hlNearest(P.x,P.y,HL.ph.rng,P.face)||hlNearest(P.x,P.y,HL.ph.rng);const tp=hlTip('atk2_3');
  s.hlph={x:tp.x,y:P.y,h:tp.h,tg,n:0,st:tg?'out':'fizz',t0:t,tr:[]}}
function hlPhStep(dt){const s=S0,P=s.P,t=s.t,o=s.hlph;if(!o)return;const D=HL.ph;o.tr.push([o.x,o.y,o.h]);if(o.tr.length>6)o.tr.shift();
  const go=(x,y,h)=>{const dx=x-o.x,dh=h-o.h,dy=y-o.y,d=Math.hypot(dx,dh,dy*0.5)||1,st=D.spd*dt;if(d<=st+8){o.x=x;o.y=y;o.h=h;return true}o.x+=dx/d*st;o.h+=dh/d*st;o.y+=dy/d*st;return false};
  if(o.st==='fizz'){if(t-o.t0>0.3)s.hlph=null;return}
  if(o.st==='out'){if(!hlLive(o.tg)){o.tg=hlNearest(o.x,o.y,D.rng);if(!o.tg){o.st='back';return}}const m=o.tg;
    if(go(m.x,m.y,hlChest(m))){o.n++;const big=o.n>=D.n,R=big?D.r6:D.r,v=big?D.v6:D.v;
      const tg=s.mobs.filter(q=>hlLive(q)&&Math.abs(q.x-m.x)<R+hlBig(q)&&Math.abs(q.y-m.y)<R*0.6+hlBig(q)*0.4);
      for(const q of tg){hlHit(q,v,{soft:!big,multi:tg.length>=2});if(big&&q.kind!=='pillar'&&hlLive(q)){if(q.kind==='boss'){if(!(q.hlStunCD>t)&&s.boss&&s.boss.nextAtk!=null){s.boss.nextAtk+=0.2;q.hlStunCD=t+4}}
        else if(!(q.hlStunCD>t)){q.state='stun';q.stun=t+D.stun;q.dizzy=t+D.stun;q.hlStunCD=t+4}}}
      hlFaith(1);s.fx.push({k:big?'hl_boom2':'hl_boom',x:m.x,y:m.y,t0:t});shake(big?6:2,0.12);sfx(big?'crit':'hit',big?0.5:0.3);o.st='back'}}
  else if(o.st==='back'){if(go(P.x,P.y,90)){const big=o.n>=D.n;hlHeal(big?D.heal6:D.heal,'s');hlFx({k:'hl_back',x:P.x,y:P.y,h:90,t0:t});
      if(big||!o.n){s.hlph=null;return}const nx=hlNearest(P.x,P.y,D.rng);if(!nx){s.hlph=null;return}o.tg=nx;o.st='out'}}}
// 生命脈動
function hlStartPu(){const s=S0,P=s.P,t=s.t,H=hlS();H.puCD=HL.pu.cd*hlMvcd();hAct('hpu',HL.pu.root,{});s.callout={t0:t,txt:'生命脈動'};sfx('ready',0.3)}
function hlPuFire(){const s=S0,P=s.P,t=s.t,H=hlS(),D=HL.pu;const src=(H.links.find(l=>l.st!=='break'&&hlLive(l.m))||{}).m;const ox=src?src.x:P.x,oy=src?src.y:P.y,oh=src?hlChest(src):90;
  const n=H.faith>=hlFmax()?D.nF:D.n;const tg=s.mobs.filter(m=>hlLive(m)&&hlD(m,ox,oy)<D.len+hlBig(m)).sort((a,b)=>hlD(a,ox,oy)-hlD(b,ox,oy)).slice(0,n);
  let healed=0;const lines=[];
  for(const m of tg){lines.push(m);hlHit(m,D.v,{soft:1,multi:tg.length>=2});if(!hlLive(m)||m.kind==='pillar')continue;
    if(m.kind!=='boss'){const on=m.slowU>t&&m.slowK;m.slowU=Math.max(m.slowU||0,t+D.slowT);m.slowK=Math.min(on?m.slowK:1,D.slow)}m.hlSlowU=t+D.slowT;
    const pn=(m.hlPain=(m.hlPain||[]).filter(p=>p.until>t));if(pn.length>=D.painN){pn.sort((a,b)=>a.until-b.until);pn.shift()}pn.push({until:t+D.painT,next:t+0.5});m.hlPainU=t+D.painT;
    if(healed<D.healMax-1e-9){hlHeal(D.heal,'s');healed+=D.heal}}
  hlFx({k:'hl_pulse',x:ox,y:oy,h:oh,t0:t,tg:lines.map(m=>({m,x:m.x,y:m.y,h:hlChest(m)}))});shake(4,0.15)}
function hlPainStep(){const s=S0,t=s.t;for(const m of s.mobs){if(!m.hlPain||!m.hlPain.length)continue;if(!hlLive(m)){m.hlPain=null;continue}
    for(const p of m.hlPain){while(t>=p.next&&p.next<=p.until){p.next+=0.5;hlDot(m,HL.pu.pain)}}m.hlPain=m.hlPain.filter(p=>p.until>t)}
  for(const m of s.mobs){if(m.hlFear&&hlLive(m)){const f=m.hlFear;while(t>=f.next&&f.next<=f.until){f.next+=0.5;hlDot(m,HL.gl.fear)}if(t>f.until)m.hlFear=null}}}
// 防護
function hlStartPr(){const s=S0,P=s.P,t=s.t,H=hlS();H.prCD=HL.pr.cd*hlMvcd();hAct('hpr',HL.pr.cast,{});s.callout={t0:t,txt:'防護'};sfx('ready',0.3)}
function hlShieldUp(){const s=S0,P=s.P,t=s.t,H=hlS();const a=Math.round(HPMAX*HL.pr.abs*(1+HL.faith.per*H.faith));H.sh={hp:a,max:a,t0:t,until:t+HL.pr.dur,reg:t+1,ctr:0};hlFx({k:'hl_shf',t0:t})}
function hlShieldStep(){const s=S0,t=s.t,H=hlS(),sh=H.sh;if(!sh)return;if(t>=sh.until){H.sh=null;hlFx({k:'hl_shb',t0:t,x:s.P.x,y:s.P.y,f:s.P.face});return}
  while(t>=sh.reg){sh.reg+=1;hlHeal(HL.pr.reg,'s')}}
// 召喚輝光
function hlStartGl(){const s=S0,P=s.P,t=s.t,H=hlS();H.glCD=HL.gl.cd*hlMvcd();hAct('hgl',HL.gl.cast,{});s.callout={t0:t,txt:'召喚輝光'};sfx('summon',0.4);
  const G=HL.gl;s.hlgl={t0:t,until:t+G.dur,next:t+0.5,n:0,H:{x:P.x+G.H[0]*P.face,y:P.y,h:G.H[1]},A:{x:P.x+G.A[0]*P.face,y:P.y,h:G.A[1]},beams:[]};H.blessNext=1}
function hlGlStep(dt){const s=S0,P=s.P,t=s.t,g=s.hlgl;if(!g)return;const G=HL.gl;const k=1-Math.pow(1-G.lerp,dt*60);
  for(const [o,off,ph] of [[g.H,G.H,0],[g.A,G.A,1.7]]){const tx=P.x+off[0]*P.face,th=(P.h||0)+off[1]+Math.sin(t*2.2+ph)*4;o.x+=(tx-o.x)*k;o.y+=(P.y-o.y)*k;o.h+=(th-o.h)*k}
  while(t>=g.next&&g.n<Math.ceil(G.dur/G.every)&&t<g.until+0.01){g.n++;g.next+=G.every;
    const tg=s.mobs.filter(m=>hlLive(m)&&hlD(m,g.A.x,g.A.y)<G.rng+hlBig(m)).sort((a,b)=>hlD(a,g.A.x,g.A.y)-hlD(b,g.A.x,g.A.y)).slice(0,G.n);
    for(const m of tg){hlHit(m,G.v,{soft:1});if(hlLive(m)&&m.kind!=='pillar'){m.hlFear={until:t+G.fearT,next:t+0.5};m.hlFearU=t+G.fearT}g.beams.push({k:'atk',m,t0:t})}
    hlHeal(G.heal,'s');g.beams.push({k:'heal',t0:t})}
  g.beams=g.beams.filter(b=>t-b.t0<0.5);if(t>=g.until){hlFx({k:'hl_puff',x:g.A.x,y:g.A.y,h:g.A.h,t0:t});hlFx({k:'hl_puff',x:g.H.x,y:g.H.y,h:g.H.h,t0:t});s.hlgl=null}}
// 天使之翼
const hlUltAir=()=>HL.ult.air+((GS.g25&&GS.g25.hult)||0);
function hlStartUlt(){const s=S0,P=s.P,t=s.t,H=hlS();H.ug=0;hAct('hu',HL.ult.cast+hlUltAir()+HL.ult.out,{ph:'in',pil:0,airK:-9,airJ:-9});H.stored=Math.min(3,H.stored);s.callout={t0:t,txt:'天使之翼'};sfx('summon',0.5);P.ghost=[]}
function hlUltStep(A,dt,jP,kP){const s=S0,P=s.P,t=s.t,H=hlS(),U2=HL.ult,u=A.t,air=hlUltAir();
  if(A.ph==='in'){P.invU=Math.max(P.invU||0,t+0.05);if(u>=U2.cast){A.ph='air';A.pil=0;A.pt=t;
      hlFx({k:'hl_burst',x:P.x,y:P.y,t0:t,f:P.face});hlFx({k:'hl_flash',t0:t});shake(12,0.4);sfx('crit',0.6);s.hitstop=Math.max(s.hitstop,0.08);
      for(const m of s.mobs)if(hlLive(m)&&hlOnScreen(m))hlHit(m,U2.burst,{multi:true})}}
  else if(A.ph==='air'){
    while(t>=A.pt+A.pil*1&&A.pil<air){A.pil++;let n=0;for(const m of s.mobs){if(!hlLive(m)||hlD(m,P.x,P.y)>U2.pilR+hlBig(m))continue;n++;hlDot(m,U2.pil*0.92/HL.dotK);hlFx({k:'hl_pillar',m,x:m.x,y:m.y,t0:t})}hlHeal(U2.heal,'u');if(n)shake(3,0.1)}
    for(const m of s.mobs){if(hlFoe(m)&&Math.abs(m.x-P.x)<U2.sanR+hlBig(m)&&Math.abs(m.y-P.y)<120+hlBig(m)*0.4)m.hlSanU=t+0.2}
    if(jP&&t-A.airJ>=U2.airGap){A.airJ=t;const tg=hlNearest(P.x,P.y,620);hlBolt(P.x+5*P.face,P.y,P.h+120,tg,HL.atk[1].v,{k:0})}
    if(kP&&H.lkCD<=0){H.lkCD=HL.link.cd*hlMvcd();const tg=hlNearest(P.x,P.y,HL.link.rng+80);if(tg){hlLinkTo(tg,1);s.callout={t0:t,txt:'生命連結'}}
      const cs=s.mobs.filter(m=>hlLive(m)&&hlOnScreen(m)).sort((a,b)=>hlD(a,P.x,P.y)-hlD(b,P.x,P.y)).slice(0,U2.cry.n);
      for(const m of cs){hlHit(m,U2.cry.v,{soft:1});hlFx({k:'hl_cryhit',x:m.x,y:m.y,h:hlChest(m),t0:t,sx:P.x,sh:P.h+120,sy:P.y})}hlHeal(U2.cry.heal,'u');if(H.stored<3)H.stored++;sfx('ready',0.25)}
    if(u>=U2.cast+air){A.ph='out';A.ot=t;// 結晶各自爆炸
      const n=H.stored+H.cry;H.stored=0;H.cry=0;const ms=s.mobs.filter(m=>hlLive(m)&&hlOnScreen(m));
      for(let i=0;i<n;i++){const m=ms.length?ms[i%ms.length]:null;hlFx({k:'hl_cryfly',i,n,x0:P.x,y0:P.y,m,t0:t});
        setTimeout0(8/30,()=>{if(m&&hlLive(m))hlHit(m,U2.boom,{soft:1});hlHeal(U2.boomHeal,'u');if(m)hlFx({k:'hl_cryboom',x:m.x,y:m.y,h:hlChest(m),t0:S0.t})})}}}
  else if(A.ph==='out'){if(u>=A.dur){P.act=null;P.invU=Math.max(P.invU||0,t+0.3)}}}
// 衝刺
function hlStartDash(dir){const s=S0,P=s.P,t=s.t,H=hlS();H.dCD=HL.dash.cd;hAct('hd',HL.dash.dur,{dir});P.face=dir;P.hlIF=t+HL.dash.inv;P.ghost=[];sfx('jump',0.2);puff(P.x-20*dir,P.y-3,5,[214,170,128],22,0.35,2)}
// ---------- 每 frame ----------
function hStep(dt){const s=S0,P=s.P,t=s.t,H=hlS();
  for(const k of ['lkCD','phCD','puCD','prCD','glCD','dCD'])H[k]-=dt;
  // 信仰衰退、絕招量表
  if(H.faith>0&&t-H.fG>HL.faith.decay){H.fD+=dt;while(H.fD>=1&&H.faith>0){H.fD-=1;H.faith--}}
  const inUlt=P.act&&P.act.type==='hu';
  if(!inUlt&&!P.dead&&s.mobs.some(m=>hlFoe(m)&&hlOnScreen(m)))H.ug=Math.min(100,H.ug+dt*100/HL.ult.fill);
  P.rh=0;
  hlLinksStep(dt);hlGraceStep();hlBoltsStep(dt);hlPhStep(dt);hlPainStep();hlShieldStep();hlGlStep(dt);
  const wantJump=IN.jump()||(AUTO&&AI.jump);
  if(P.dead||s.ritual||s.trans)return;
  if(m2Down()){P.act=null;return}
  let mx=(IN.r()?1:0)-(IN.l()?1:0),my=(IN.d()?1:0)-(IN.u()?1:0);if(AUTO){mx=AI.mx||0;my=AI.my||0}
  const jP=IN.atk()||(AUTO&&AI.atk),kP=IN.stab()||(AUTO&&AI.stab),lP=IN.skill()||(AUTO&&AI.skill),sumP=IN.sum()||(AUTO&&AI.sum);
  const jH=held(['KeyJ','KeyZ'])||!!GP.atk;const down=IN.d()||(AUTO&&AI.down);
  const dodgeP=press(['ShiftLeft','ShiftRight'])||GPP.dodge||(AUTO&&AI.dodge);
  if(jP)P.jT=t;if(kP)P.kT=t;if(lP)P.lT=t;
  const ultC=(AUTO&&AI.ult)||(kP&&t-(P.jT||-9)<0.12)||(jP&&t-(P.kT||-9)<0.12)||(kP&&jH&&t-(P.jT||-9)<0.25);
  const glC=(AUTO&&AI.snipe)||(kP&&t-(P.lT||-9)<0.12)||(lP&&t-(P.kT||-9)<0.12)||((kP||lP)&&held(['KeyK'])&&held(['KeyL']));
  if(sumP&&!s.ally&&!s.bard&&!s.arA){if(s.food>=FOOD_MAX&&t>(s.allyCD||0))m27Assist('heal');else if(t-s.hungryT>0.4){s.hungryT=t;sfx('clank',0.2)}}
  const a=P.act,ground=P.h<=0;
  const fresh=a&&a.t<0.12&&a.type==='hk';
  const cancelOK=!a||(a.type==='hj'&&a.t>a.hitAt+0.06)||(a.type==='hk'&&a.t>HL.link.lat+0.05)||(a.type==='hp'&&a.t>HL.ph.out+0.04)||(a.type==='hgl'&&a.t>0.3);
  if(a&&a.type==='hu'){a.t+=dt;hlUltStep(a,dt,jP||(AUTO&&AI.atk),kP);hlMove(dt,mx,my,a.ph==='air'?HL.ult.ms:0);return}
  if(ultC&&H.ug>=100&&ground&&(!a||cancelOK||fresh)){if(fresh){H.lkCD=0}P.act=null;hlStartUlt()}
  else if(ultC&&kP&&H.ug<100&&!AUTO&&t-(P.jT||-9)<0.12)s.denyU=t;
  else if(glC&&H.glCD<=0&&ground&&(!a||cancelOK||fresh)){if(fresh)H.lkCD=0;P.act=null;hlStartGl()}
  else if(glC&&!fresh&&H.glCD>0&&(kP&&lP||held(['KeyK'])&&held(['KeyL'])))s.denyGl=t;
  else if(dodgeP&&ground&&H.dCD<=0&&(!a||cancelOK||['hj','hk','hp'].includes(a.type))){hlStartDash(mx||P.face)}
  else if(kP&&ground&&(!a||cancelOK)){if(down){if(H.puCD<=0)hlStartPu();else s.denyPu=t}else{if(H.lkCD<=0)hlStartLink();else s.denyK=t}}
  else if(lP&&ground&&(!a||cancelOK)){if(down){if(H.prCD<=0)hlStartPr();else s.denyPr=t}else{if(H.phCD<=0)hlStartPh();else s.denyL=t}}
  else if(jP&&(!P.act||cancelOK))hlStartAtk();
  else if(wantJump&&ground&&!P.act){P.vh=HL.jv;P.h=0.01;sfx('jump',0.3)}
  const A=P.act;if(A){const sp=['hj'].includes(A.type)?hlSpd():1;A.t+=dt*sp;hlActStep(A,dt)}
  const B=P.act;let mvk=0;if(!B)mvk=1;else if(B.type==='hp'&&B.t>HL.ph.out)mvk=1;else if(B.type==='hj')mvk=0.25;
  hlMove(dt,mx,my,mvk)}
function hlMove(dt,mx,my,mvk){const s=S0,P=s.P,t=s.t;const ox=P.x,oy=P.y,B=P.act;
  if(mvk>0){const sp=HL.sp*mvk*(1+(B?0:GS.ms||0));let vx=mx*sp,vy=my*HL.spy*mvk;if(mx&&my){vx*=0.85;vy*=0.85}if(Number.isFinite(vx))P.x+=vx*dt;if(Number.isFinite(vy))P.y+=vy*dt;
    if(mx&&(!B||B.type==='hu'||(B.type==='hp'&&B.t>HL.ph.out)))P.face=mx>0?1:-1}
  const lo=s.lock?s.cam+40:30,hi=s.lock?s.cam+W-40:WW-30;P.x=clamp(P.x,lo,hi);P.y=clamp(P.y,YMIN,YMAX);
  P.kspd=Math.abs(P.x-ox)/dt;P.mspd=Math.hypot(P.x-ox,P.y-oy)/dt;
  // Visual phase follows distance, including isometric vertical travel; never changes movement.
  const ds=Math.hypot(P.x-ox,(P.y-oy)*2);P.hlLoc=(P.hlLoc||0)+ds/24;
  if(!(B&&B.type==='hu')&&(P.h>0||P.vh>0)){P.h+=P.vh*dt;P.vh-=5104*dt;if(P.h<=0){P.h=0;P.vh=0;P.landT=t;puff(P.x,P.y-3,4,[214,170,128],20,0.35,2)}}
  if(B&&B.type==='hu'&&P.h>0){P.h=0;P.vh=0}
  if(P.kspd>120&&P.h===0&&!(B&&B.type==='hu')&&t-(P.lastdust||0)>0.1){P.lastdust=t;puff(P.x-25*P.face,P.y-3,3,[214,170,128],10,0.33,2)}
  if(!Number.isFinite(P.x))P.x=clamp(s.cam+640,30,WW-30);if(!Number.isFinite(P.y))P.y=clamp(552,YMIN,YMAX)}
function hlActStep(A,dt){const s=S0,P=s.P,t=s.t,H=hlS();
  switch(A.type){
  case 'hj':{const D=HL.atk[A.k];if(!A.done&&A.t>=A.hitAt){A.done=true;hlAtkHit(A)}if(A.t>=A.dur)P.act=null;break}
  case 'hk':{const L=HL.link;if(!A.tg&&A.t>=0.2){A.tg=hlNearest(P.x,P.y,L.rng,P.face,m=>m.hlLinkU>t)||hlNearest(P.x,P.y,L.rng,P.face)||hlNearest(P.x,P.y,L.rng)||-1;if(A.tg!==-1&&A.tg.x!==P.x)P.face=Math.sign(A.tg.x-P.x)||P.face}
    if(!A.done&&A.t>=L.lat){A.done=true;if(A.tg&&A.tg!==-1&&hlLive(A.tg))hlLinkTo(A.tg);else{H.lkCD=Math.min(H.lkCD,1.5)}}
    if(A.t>=A.dur)P.act=null;break}
  case 'hp':if(!A.done&&A.t>=HL.ph.out){A.done=true;hlPhLaunch()}if(A.t>=A.dur)P.act=null;break;
  case 'hpu':if(!A.done&&A.t>=HL.pu.fire){A.done=true;hlPuFire()}if(A.t>=A.dur)P.act=null;break;
  case 'hpr':if(A.t>=A.dur){P.act=null;hlShieldUp()}break;
  case 'hgl':if(A.t>=A.dur)P.act=null;break;
  case 'hd':{const k=Math.min(1,A.t/A.dur);P.x+=A.dir*HL.dash.dist/A.dur*1.6*Math.max(0,1-k)*dt*1.25;
    if(t-(P.lastG||0)>0.035){P.lastG=t;(P.ghost=P.ghost||[]).push({x:P.x,y:P.y,h:0,t,nm:'hl_dash'+Math.min(5,Math.floor(A.t/A.dur*6)),f:P.face});if(P.ghost.length>6)P.ghost.shift()}
    if(A.t>=A.dur)P.act=null;break}
  default:if(A.t>=(A.dur||0))P.act=null}}
// ---------- 受傷 ----------
function hlAttacker(x){const s=S0;let b=null,bd=1e9;if(x==null)return null;for(const m of s.mobs){if(!hlFoe(m))continue;const d=Math.abs(m.x-x);if(d<bd){bd=d;b=m}}return bd<260?b:null}
function hHurt(o,v,x){const s=S0,P=s.P,t=s.t,H=hlS();if(t<(P.invU||0))return 0;if(P.hlIF>t){proc('閃避',[150,230,190],'閃');if(t>=(H.dgHT||0)){H.dgHT=t+HL.mercy.dodgeCD;H.woundU=0;hlHeal(HL.mercy.dodge,'s')}return 0}
  const a=P.act;if(a&&a.type==='hu'&&a.ph==='in')return 0;
  const am=hlAttacker(x);if(am){if(am.hlSanU>t)v*=HL.ult.sanAtk;if(am.hlWeakU>t)v*=HL.pr.weak}
  P.act=a||{type:'_'};let r;try{r=o(v,x)}finally{P.act=a}if(!r)return r;
  if(a&&a.type==='hu')r=Math.round(r*(1-HL.ult.dr));
  // W3.1 痛苦分擔：每條生命連結替她承擔 8%（最多 4 條），光點從她身上沿著線流向被連結的敵人（不轉成傷害）
  {const L=H.links.filter(l=>l.st!=='break'&&hlLive(l.m));if(L.length){const r0=r;r=Math.round(r*(1-HL.sus.share*Math.min(4,L.length)));if(window.__hlHK)__hlHK.share=(__hlHK.share||0)+r0-r;for(const l of L)hlFx({k:'hl_mote',x:l.m.x,y:l.m.y,h:hlChest(l.m),t0:t,rv:1})}}
  if(r>=HPMAX*HL.heavy.p)H.heavyU=t+HL.heavy.t;
  const sh=H.sh;if(sh&&r>0){const ab=Math.min(sh.hp,r);if(window.__hlHK)__hlHK.shield=(__hlHK.shield||0)+ab;sh.hp-=ab;r-=ab;hlFx({k:'hl_shh',t0:t});
    if(am&&t>=sh.ctr){sh.ctr=t+HL.pr.ctrCD;hlHit(am,HL.pr.ctr,{soft:1});if(hlLive(am)){if(am.kind!=='boss'&&am.kind!=='pillar'){am.x=clamp(am.x+Math.sign(am.x-P.x||1)*40,30,WW-30);am.cd=(am.cd||0)+0.6}else if(s.boss&&s.boss.nextAtk!=null)s.boss.nextAtk+=0.6}}
    if(sh.hp<=0){H.sh=null;hlFx({k:'hl_shb',t0:t,x:P.x,y:P.y,f:P.face});sfx('clank',0.4)}
    if(r<=0){P.flashT=t+0.05;return 0}}
  if(window.hlCandy)r=hlCandy(r);r=hlGrace(r);if(r<=0){P.flashT=t+0.05;return 0}
  H.hurtT=t;if(HLF.tele){H.woundU=t+HL.mercy.woundT;proc('重創',[200,60,60],'創')}const armor=a&&(a.type==='hu'||a.type==='hpu');P.flashT=t+0.08;
  if(!armor){const d=(x!=null&&x>P.x)?-1:1;P.x=clamp(P.x+14*d,30,WW-30);P.hurtT=t;if(a&&a.type!=='hd')P.act=null;
    if(t-(H.lastH||-9)>2.0)H.hc=0;H.hc++;H.lastH=t;
    if(H.hc>=4){H.hc=0;if(GS.kdr&&rnd()<GS.kdr)proc('抗倒地',[200,160,90],'穩');else{P.downU=t+0.7;P.downT0=t;P.invU=P.downU+0.8;P.h=0;P.vh=0;P.act=null;proc('倒地',[110,110,130],'倒')}}}
  return r}
window.m2Hurt=(o=>function(v,x){if(hlOn())return hHurt(o,v,x);return o.apply(this,arguments)})(window.m2Hurt);
// W3.2 紅圈（預警大招）打中：4 秒「重創」— 慈悲／回流／技能治療只剩 15%，不閃就補不回來
if(typeof teleHurtP==='function')window.teleHurtP=(o=>function(){if(!hlOn())return o.apply(this,arguments);HLF.tele=1;try{return o.apply(this,arguments)}finally{HLF.tele=0}})(teleHurtP);
// 聖域／連結：敵人攻擊變慢
window.m2Step=(o=>dt=>{o(dt);const s=S0;if(!s||!hlOn())return;const t=s.t;
  for(const m of s.mobs){if(!hlFoe(m))continue;if(m.hlSanU>t){if(m.kind!=='boss'&&m.cd!=null)m.cd+=dt*HL.ult.sanSpd}}
  const b=s.boss;if(b&&!b.atk&&b.nextAtk!=null){const bm=s.mobs.find(m=>m.kind==='boss'&&hlFoe(m));if(bm&&bm.hlSanU>t)b.nextAtk+=dt*HL.ult.sanSpd}})(window.m2Step);
// 主角每 frame：夾夾整套接管
window.stepPlayer=(o=>function(dt){if(!hlOn())return o.apply(this,arguments);const s=S0,P=s&&s.P;if(!P)return;try{hStep(dt)}catch(e){(window.__err=window.__err||[]).push('hStep '+e.message);P.act=null}
  if(P.act&&P.act.type!=='hu'){if(P.act!==P.safeA){P.safeA=P.act;P.safeT0=s.t}else if(s.t-P.safeT0>12){P.act=null}}
  if(P.downU>s.t+3)P.downU=s.t+1})(window.stepPlayer);
// ---------- 姿勢 ----------
function hlPoseName(P,t){const s=S0,a=P.act;
  if(m2Down()){return 'hurt1'}
  // Short visual reaction only: action/input continues; dodge and transformation always win.
  if(t-(P.hurtT??-9)<0.18&&(!a||!['hd','hu'].includes(a.type)))return t-(P.hurtT??-9)<0.08?'hurt0':'hurt1';
  if(a){const u=a.t;switch(a.type){
    case 'hj':{const D=HL.atk[a.k];const k=Math.min(5,Math.floor(u/a.dur*6));return D.f+k}
    case 'hk':{const L=[[0.05,0],[0.1,1],[0.15,2],[0.2,3],[0.27,4],[0.5,5],[0.56,6],[0.62,7],[9,8]];for(const [e,f] of L)if(u<e)return 'link'+f;return 'link8'}
    case 'hp':{const k=Math.min(5,Math.floor(u/a.dur*6));return 'atk2_'+k}
    case 'hpu':return hlCastPose(u,a.dur||HL.pu.root,HL.pu.fire);
    case 'hpr':return hlCastPose(u,a.dur||HL.pr.cast,0.28);
    case 'hgl':return hlCastPose(u,a.dur||HL.gl.cast,0.22);
    case 'hd':return 'dash'+Math.min(5,Math.floor(u/a.dur*6));}}
  if(P.h>0)return 'run3';
  const sp=P.mspd||0,phase=Math.floor(P.hlLoc||0)%8;if(sp>200)return 'run'+phase;if(sp>20)return 'walk'+phase;
  return 'idle'+(Math.floor(t/0.12)%12)}
window.hlPoseName=hlPoseName;
// One visual body/attachment descriptor, shared by sprite and link renderer.
// Only frame selection changes: cast locks and all combat/fire times are untouched.
function hlCastPose(u,dur,release){
  const q=u/dur;
  if(q<0.09)return 'link0';if(q<0.19)return 'link1';
  if(q<0.31)return 'link2';if(u<release)return 'link3';
  if(q<0.72)return 'link4';if(q<0.84)return 'link6';if(q<0.94)return 'link7';return 'link8';
}
function hlVisual(P,t){const A=P.act;
  if(A&&A.type==='hu'){
    const sheet=A.ph==='in'?'ult_in':A.ph==='air'?'ult_air':'ult_out';
    const age=A.ph==='in'?A.t:A.ph==='air'?t-A.pt:t-A.ot;
    const D=HLX[sheet],raw=Math.max(0,Math.floor(age*15));
    const frame=D.loop?raw%D.n:Math.min(D.n-1,raw);
    // Air fist follows the same 15fps atlas frame (lift/bob included in the measurement).
    const anchors=A.ph==='air'?HL_ULT_HAND:A.ph==='in'?HL_ULT_IN_HAND:HL_ULT_OUT_HAND;
    const tip=anchors[frame%anchors.length];
    return {sheet,frame,tip};
  }
  const name=hlPoseName(P,t);return {name,tip:HL_TIP[name]||HL_TIP.idle0};
}
function hlAttachment(P,t){const V=hlVisual(P,t),o=V.tip;return {x:P.x+o[0]*P.face,y:P.y,h:(P.h||0)-o[1]}}
window.hlVisual=hlVisual;window.hlAttachment=hlAttachment;

// ---------- AUTO ----------
window.aiThink=(o=>()=>{o();if(!hlOn())return;const s=S0,P=s.P,t=s.t,H=hlS();Object.assign(AI,{dodge:0,ult:0,snipe:0,down:0,hold:0.04,jump:0,atk:0,stab:0,skill:0});
  AI.sum=s.food>=FOOD_MAX&&!s.ally&&!s.bard&&!s.arA&&t>(s.allyCD||0)?1:0;
  const shd=typeof bossShielded==='function'&&bossShielded();
  const onS=m=>hlLive(m)&&Math.abs(m.x-s.cam-640)<640;let ms=s.mobs.filter(m=>onS(m)&&(m.kind!=='pillar'||shd||(typeof b4Prot==='function'&&b4Prot())));if(!ms.length)ms=s.mobs.filter(onS);if(P.dead)return;
  // W3.1 閃紅圈：站在快爆的紅圈裡 → 往圈外走（圈心附近可衝刺穿出去）
  const A0=P.act;const tl=(s.tele||[]).find(c=>!c.done&&t>=c.t0-0.1&&t<c.t1+0.05&&Math.hypot(P.x-c.x,(P.y-c.y)*2.2)<c.r+30);
  // 測試用：window.__hlNoDodge＝站樁不閃（只有模擬會設，正式遊戲沒有入口）
  const ND=AUTO&&window.__hlNoDodge;
  if(tl&&!ND&&!(A0&&A0.type==='hu')){let ex=P.x>=tl.x?1:-1;if((ex>0&&P.x>Math.min(WW,s.cam+W)-70)||(ex<0&&P.x<Math.max(0,s.cam)+70))ex=-ex;AI.mx=ex;AI.my=P.y>tl.y?1:-1;if(P.y<=YMIN+2)AI.my=1;if(P.y>=YMAX-2)AI.my=-1;
    if(H.dCD<=0&&Math.abs(P.x-tl.x)<tl.r+10)AI.dodge=1;return}
  if(!ms.length)return;
  // W3.1 看刀光閃：劍兵舉刀（0.6 秒前搖）快砍下來時，有六成機會衝刺躲開
  const sw=ms.find(m=>m.kind==='sword'&&m.wind>0&&m.wind<0.38&&Math.abs(m.x-P.x)<120&&Math.abs(m.y-P.y)<30&&(P.x-m.x)*m.face>0);
  if(sw&&!ND&&H.dCD<=0&&!(P.act&&P.act.type==='hu')&&t>(H.aiSw||0)){H.aiSw=t+0.7;if(rnd()<0.6){let d=P.x>=sw.x?1:-1;if((d>0&&P.x>s.cam+W-170)||(d<0&&P.x<s.cam+170))d=-d;AI.mx=d;AI.my=0;AI.dodge=1;return}}
  const pr=m=>(m.kind==='pillar'?-300:0);
  const tg=ms.slice().sort((a,b)=>Math.abs(a.x-P.x)+2*Math.abs(a.y-P.y)+pr(a)-Math.abs(b.x-P.x)-2*Math.abs(b.y-P.y)-pr(b))[0];
  const dx=tg.x-P.x,dy=tg.y-P.y,adx=Math.abs(dx),sg=Math.sign(dx)||1,big=hlBig(tg);AI.my=Math.abs(dy)>18?Math.sign(dy):0;const a=P.act;
  if(a&&a.type==='hu'){AI.mx=adx>200?sg:0;AI.atk=rnd()<0.7?1:0;if(H.lkCD<=0)AI.stab=1;return}
  const near=ms.filter(m=>m.kind!=='pillar'&&Math.abs(m.x-P.x)<400&&Math.abs(m.y-P.y)<120).length;
  // W3.1 拉開距離：貼身 2 隻以上 → 防護好了先開，否則衝刺／走出包圍（血量健康時照打）
  const pk=ms.filter(m=>m.kind!=='pillar'&&m.kind!=='boss'&&Math.abs(m.x-P.x)<125&&Math.abs(m.y-P.y)<50);
  if(pk.length>=2&&!(a&&(a.type==='hpu'||a.type==='hpr'))&&!H.sh&&H.prCD<=0){if(!a){AI.skill=1;AI.down=1}AI.mx=0;return}
  if(pk.length>=3&&!ND&&P.hp<HPMAX*0.6&&H.dCD<=0&&t>(H.aiEsc||0)){H.aiEsc=t+3;const cx=pk.reduce((q,m)=>q+m.x,0)/pk.length;let d=P.x>=cx?1:-1;if((d>0&&P.x>s.cam+W-170)||(d<0&&P.x<s.cam+170))d=-d;AI.mx=d;AI.my=0;AI.dodge=1;return}
  if(H.ug>=100&&near>=1){if(!a)AI.ult=1;AI.mx=0;return}
  if(!H.sh&&H.prCD<=0&&(P.hp<HPMAX*0.7||near>=3)){if(!a){AI.skill=1;AI.down=1}AI.mx=0;return}
  const nl=H.links.filter(l=>l.st!=='break').length;
  if(H.glCD<=0&&near>=1){if(!a)AI.snipe=1;return}
  if(nl<3&&H.lkCD<=0&&tg.kind!=='pillar'&&adx<HL.link.rng+260+big&&(adx>=HL.link.rng-40+big||Math.abs(dy)>=90)){AI.mx=adx>=HL.link.rng-40+big?sg:0;return}
  if(nl<3&&H.lkCD<=0&&adx<HL.link.rng-20+big&&Math.abs(dy)<100&&tg.kind!=='pillar'){if(P.face!==sg){AI.mx=sg;return}if(!a)AI.stab=1;AI.mx=0;return}
  if(H.puCD<=0&&nl>0&&near>=2){if(!a){AI.stab=1;AI.down=1}AI.mx=0;return}
  if(H.phCD<=0&&adx<HL.ph.rng){if(P.face!==sg){AI.mx=sg;return}if(!a)AI.skill=1;AI.mx=0;return}
  if(!ND&&adx<90+big&&Math.abs(dy)<60&&H.dCD<=0&&rnd()<0.15){AI.dodge=1;AI.mx=-sg;return}
  if(adx>420+big)AI.mx=sg;else if(adx<85+big&&!ND){AI.mx=-sg;if(P.x<s.cam+120||P.x>s.cam+W-120)AI.mx=0}else AI.mx=0;
  if(P.face!==sg&&!AI.mx){AI.mx=sg;return}
  if(Math.abs(dy)<50&&adx<600+big&&rnd()<0.75)AI.atk=1})(window.aiThink);

// ---- src29/b_fx.js
// ===== W3：夾夾特效繪製（核可素材 hlx_* 序列圖＋生命連結點陣光鏈 BOOST 1.2）=====
const HLXI={};
function hlxImg(n){let im=HLXI[n];if(!im){im=HLXI[n]=new Image();im.src='a/hlx_'+n+'.png'}return im}
function hlxPreload(){for(const k in HLX){if(HLX[k].n)hlxImg(k)}for(let i=0;i<3;i++){const im=new Image();im.src='a/s_hl_soul'+i+'.png';IMG['hl_soul'+i]=im}}
try{hlxPreload()}catch(e){}
// 畫序列圖第 i 格：錨點（腳下／中心）在畫面 (sx,sy)
function hlxDraw(n,i,sx,sy,flip,alpha){const D=HLX[n],im=hlxImg(n);if(!D||!im.complete||!im.naturalWidth)return;i=D.loop?((i%D.n)+D.n)%D.n:Math.max(0,Math.min(D.n-1,i));
  const C=D.cols||D.n,pd=D.pad||0,c=i%C,r=Math.floor(i/C),x=c*(D.w+pd),y=r*(D.h+pd);X.save();X.imageSmoothingEnabled=false;if(alpha!=null)X.globalAlpha=alpha;
  X.translate(Math.round(sx),Math.round(sy));if(flip)X.scale(-1,1);X.drawImage(im,x,y,D.w,D.h,D.ox,D.oy,D.w,D.h);X.restore()}
window.hlxDraw=hlxDraw;
const HLC={GOLD:[[150,96,20],[220,160,40],[255,214,90],[255,246,190]],MINT:[[40,140,130],[90,210,190],[170,250,230],[240,255,250]],PALE:[255,236,170],WHITE:[255,252,232]};
const HLPAL={heal:{LW:[248,255,234],LP:[196,248,150],LG:[100,220,110],LA:[214,170,70],LAD:[40,120,60],PK:[[60,170,80],[170,250,150],[235,255,215]]},
  atk:{LW:[255,246,250],LP:[255,186,222],LG:[240,140,195],LA:[214,160,70],LAD:[170,70,120],PK:[[225,110,170],[255,205,230],[255,246,250]]},
  crim:{LW:[255,236,244],LP:[255,150,192],LG:[228,66,112],LA:[162,26,58],LAD:[112,16,40],PK:[[200,40,90],[255,130,180],[255,230,240]]}};
const LLk=()=>window.LifeLink;
function hlPut(){return LLk().ctxPut(X)}
function hlPx(x,y,c,a){X.globalAlpha=a==null?1:Math.max(0,Math.min(1,a));X.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;X.fillRect(Math.round(x),Math.round(y),2,2);X.globalAlpha=1}
// 光點光束（圖騰用；生命連結光鏈換色）
function hlBeam(pal,x0,y0,x1,y1,t,a){const L=LLk();L.withPal(HLPAL[pal],()=>{const pts=L.path(x0,y0,x1,y1,t,'tether',1);L.sparkPath(hlPut(),pts,t,a>=0.99?0:Math.min(3,Math.floor((1-a)*4)),null,false)})}
// 荊棘線（深紅玫瑰粉）
function hlThorn(x0,y0,x1,y1,Lmax,t,seed,fade){const L=LLk();const D=Math.hypot(x1-x0,y1-y0),bend=[-14,10,-6,16,-10,6][seed%6];const mx=(x0+x1)/2,my=(y0+y1)/2+bend;
  const N=Math.max(4,Math.floor(D*1.15)),pts=[];let s=0,px=null,py=null;
  for(let i=0;i<=N;i++){const q=i/N,x=(1-q)*(1-q)*x0+2*(1-q)*q*mx+q*q*x1,y=(1-q)*(1-q)*y0+2*(1-q)*q*my+q*q*y1;if(px!=null)s+=Math.hypot(x-px,y-py);if(s>Lmax)break;pts.push([x,y,q,s]);px=x;py=y}
  if(pts.length<3)return;const keep=fade<=0?null:(u=>((L.hsh(seed*131+Math.floor(u*40),7)%1000)/1000)>fade);
  L.withPal(HLPAL.crim,()=>{L.sparkPath(hlPut(),pts,t+seed*0.37,Math.min(3,Math.floor(fade*2*3)),keep,fade<=0)})}
// ---------- 地面層 ----------
function hlGround(SX,shy){const s=S0,P=s.P,t=s.t,H=P&&P.hl;if(!H)return;const L=LLk();
  // 聖域
  const A=P.act;if(A&&A.type==='hu'&&A.ph!=='in'){const age=A.ph==='air'?t-A.pt:9,end=A.ph==='out'?t-A.ot:0;const a=A.ph==='air'?Math.min(1,age/0.66):Math.max(0,1-end/0.66);
    if(a>0){const r=380*a,ry=r*0.05,cx=SX(P.x),cy=P.y+shy-2;X.save();X.globalAlpha=0.10;X.fillStyle=`rgb(${HLC.PALE})`;X.beginPath();X.ellipse(cx,cy,r,Math.max(1,ry),0,0,Math.PI*2);X.fill();X.restore();
      const f=Math.floor(t*30),n=Math.floor(2*Math.PI*r/5);for(let i=0;i<n;i++){const an=i/n*2*Math.PI+f*0.004;if(L.hsh(i,Math.floor(f/3))%4===0)continue;const tw=0.45+0.55*Math.sin(f*0.3+i*1.7);if(tw<0.2)continue;
        hlPx(cx+Math.cos(an)*r,cy+Math.sin(an)*ry,tw>0.85?HLC.WHITE:tw>0.5?HLC.GOLD[3]:HLC.GOLD[2],0.85*tw)}}}
  // 連結中的敵人：腳下地環
  for(const l of H.links){if(!l.m||l.st==='break')continue;L.groundRing(hlPut(),Math.round(SX(l.m.x)),Math.round(l.m.y+shy+1),t,18+hlBig(l.m)*0.5,4)}
  // 幻痛瞄準圓盤
  const o=s.hlph;if(o&&o.st==='out'&&o.tg&&hlLive(o.tg))hlxDraw('ph_aim',Math.floor((t-(o.aimT0==null?(o.aimT0=t):o.aimT0))*30),SX(o.tg.x),o.tg.y+shy,false);else if(o)o.aimT0=null}
// ---------- 角色身邊的實體（依深度排序）：圖騰、光靈 ----------
function hlEnts(ents,SX,shy){const s=S0,P=s.P;if(!P||!P.hl)return;const t=s.t,g=s.hlgl;
  if(g){const k=Math.min(1,(t-g.t0)/0.3),out=Math.max(0,Math.min(1,(g.until-t)/0.3));const f=Math.floor(t*30);
    for(const [o,n] of [[g.H,'t_heal'],[g.A,'t_atk']])ents.push([o.y+1,()=>{hlxDraw(n,f,SX(o.x),o.y-o.h+shy,false,k*out)}])}
  const sp=P.hl.spirit;if(sp)ents.push([sp.y+2,()=>hlxDraw('bf_g',Math.floor(t*30/2),SX(sp.x),sp.y-sp.h+shy,sp.x>P.x)])}
// ---------- 最上層 ----------
function hlTop(SX,shy){const s=S0,P=s.P;if(!P||!P.hl)return;const t=s.t,H=P.hl,L=LLk(),f=P.face;const put=hlPut();
  const tip=hlAttachment(P,t);const tx=Math.round(SX(tip.x)),ty=Math.round(tip.y-tip.h+shy);
  const A=P.act;
  // 甩鞭＋飛出中的鍊子
  if(A&&A.type==='hk'){const u=A.t;if(u>=0.12&&u<0.27){const q=(u-0.12)/0.15,e=q*q*(3-2*q);const p2=f<0?((x,y,c)=>put(2*tx-x,y,c)):put;L.whipLash(p2,tx,ty,30+16*e,-150+150*e,55*(1-e)+8)}
    const m=A.tg;if(m&&m!==-1&&hlLive(m)&&u>=0.27&&u<HL.link.lat){const nx=SX(m.x),ny=m.y-m.h-hlNeck(m)+shy;L.drawLifeLink2(put,tx,ty,nx,ny,t,'travel',(u-0.27)/(HL.link.lat-0.27))}}
  // 生命連結光鏈
  for(const l of H.links){const m=l.m;if(!m)continue;const nx=SX(m.x),ny=Math.round(m.y-(m.h||0)-hlNeck(m)+shy),cy=Math.round(m.y-(m.h||0)-hlChest(m)+shy);const [ax,ay]=L.neckPoint(tx,ty,nx,ny,11,4);
    if(l.st==='break'){const p=Math.min(1,(t-l.tb)/0.35);L.drawLifeLink2(put,tx,ty,ax,ay,t,'break',p);if(p<0.5)L.sparkRing(put,nx,ny,t,1,'front',11,4,Math.min(3,Math.floor(p*4)+1));continue}
    L.mark(put,nx,cy,t,1);
    if(l.st==='latch'){const p=Math.min(1,(t-l.lt)/0.25);L.drawLifeLink2(put,tx,ty,ax,ay,t,'latch',p,nx,ny);L.sparkRing(put,nx,ny,t,(p-0.2)/0.6,'front',11,4)}
    else{L.drawLifeLink2(put,tx,ty,ax,ay,t,'tether',1);L.sparkRing(put,nx,ny,t,1,'front',11,4)}}
  // 光之結晶（環繞）
  const ult=A&&A.type==='hu';const nc=H.cry+(ult?H.stored:0);
  if(nc>0){const cx=SX(P.x),cy=P.y-(P.h||0)-(ult&&A.ph!=='in'?120+24:100)+shy,fr=t*30;for(let i=0;i<nc;i++){const an=fr*0.07+i*2*Math.PI/nc;const x=cx+Math.cos(an)*58,y=cy+Math.sin(an)*58*0.35-10*Math.sin(an*0.5+i);hlxDraw(i<H.cry?'bf_s':'bf_l',Math.floor(fr/2)+i*3,x,y,false)}}
  // 防護罩
  {const sh=H.sh,sx=SX(P.x),sy=P.y-(P.h||0)+shy,fl=f<0;if(sh){const age=t-sh.t0;const hit=(H.shHitT!=null&&t-H.shHitT<16/30)?Math.floor((t-H.shHitT)*30):-1;
      if(age<12/30)hlxDraw('sh_form',Math.floor(age*30),sx,sy,fl);else if(hit>=0)hlxDraw('sh_hit',hit,sx,sy,fl);else hlxDraw('sh_loop',Math.floor(t*30),sx,sy,fl,Math.min(1,0.5+0.5*sh.hp/sh.max))}}
  // 圖騰光束
  const g=s.hlgl;if(g)for(const b of g.beams){const age=t-b.t0,a=Math.max(0,1-age/0.5);if(b.k==='heal'){hlBeam('heal',SX(g.H.x),g.H.y-g.H.h+shy,SX(P.x),P.y-(P.h||0)-96+shy,t+0.3,a)}
      else if(b.m){const m=b.m;hlBeam('atk',SX(g.A.x),g.A.y-g.A.h+shy,SX(m.x),m.y-(m.h||0)-hlChest(m)+shy,t,a)}}
  // 光彈
  for(const b of s.hlb||[]){for(let i=0;i<b.tr.length;i++){const q=b.tr[i];const r=1+i*0.6;X.globalAlpha=0.25+0.12*i;X.fillStyle=`rgb(${HLC.MINT[2]})`;X.fillRect(Math.round(SX(q[0])-r),Math.round(b.y-q[1]+shy-r),Math.ceil(r*2),Math.ceil(r*2))}X.globalAlpha=1;
    const x=SX(b.x),y=b.y-b.h+shy;L.disc(put,x,y,6,HLC.MINT[1]);L.disc(put,x,y,4,HLC.MINT[2]);L.disc(put,x,y,2,HLC.MINT[3])}
  // 幻痛光球
  const o=s.hlph;if(o&&o.st!=='fizz'){o.tr.forEach((q,i)=>hlxDraw('ph_trail',Math.min(3,i),SX(q[0]),q[1]-q[2]+shy,false,0.4+0.1*i));hlxDraw('ph_orb',0,SX(o.x),o.y-o.h+shy,false)}
  // 一次性特效
  const fx=s.hlfx||[];for(const e of fx){const age=t-e.t0,fr=Math.floor(age*30);
    switch(e.k){
    case 'hl_spark':{if(fr>6){e.dead=1;break}const x=SX(e.x),y=e.y-e.h+shy,C=e.c==='gold'?HLC.GOLD:HLC.MINT;for(let i=0;i<8;i++){const an=i*Math.PI/4+e.t0,r=4+fr*3;hlPx(x+Math.cos(an)*r,y+Math.sin(an)*r*0.8,C[3-Math.min(2,fr>>1)],1-fr/7)}L.disc(put,x,y,Math.max(0,5-fr),C[3]);break}
    case 'hl_latch':{if(age>0.3||!e.m){e.dead=1;break}L.latchFlash(put,SX(e.m.x),Math.round(e.m.y-(e.m.h||0)-hlNeck(e.m)+shy),age/0.3);break}
    case 'hl_boom':case 'hl_boom2':{if(fr>=10){e.dead=1;break}hlxDraw(e.k==='hl_boom'?'ph_boom':'ph_boom2',fr,SX(e.x),e.y+shy,false);break}
    case 'hl_back':{if(fr>=9){e.dead=1;break}hlxDraw('ph_back',fr,SX(P.x),P.y-(P.h||0)-e.h+shy,false);break}
    case 'hl_pulse':{if(age>0.6){e.dead=1;break}const x0=SX(e.x),y0=e.y-e.h+shy,grow=Math.min(1,age/0.15),fade=age<0.35?0:(age-0.35)/0.25;
      for(let i=0;i<14;i++){const an=i/14*Math.PI*2,r=14+age*120;hlPx(x0+Math.cos(an)*r,y0+Math.sin(an)*r*0.5,HLPAL.crim.LP,1-age/0.6)}
      e.tg.forEach((q,i)=>{const m=q.m,x1=SX(m&&hlLive(m)?m.x:q.x),y1=(m&&hlLive(m)?m.y-(m.h||0):q.y)-q.h+shy;hlThorn(x0,y0,x1,y1,Math.hypot(x1-x0,y1-y0)*grow,t,i+1,fade)});break}
    case 'hl_shf':break;
    case 'hl_shh':{H.shHitT=e.t0;e.dead=1;break}
    case 'hl_shb':{if(fr>=24){e.dead=1;break}hlxDraw('sh_break',fr,SX(e.x),e.y+shy,e.f<0);break}
    case 'hl_puff':{if(fr>=12){e.dead=1;break}const x=SX(e.x),y=e.y-e.h+shy;for(let i=0;i<10;i++){const an=i*0.63+e.t0,r=4+fr*2.5;hlPx(x+Math.cos(an)*r,y+Math.sin(an)*r-fr,HLC.GOLD[3-(i%2)],1-fr/12)}break}
    case 'hl_mburst':{if(fr>=12){e.dead=1;break}const x=SX(e.x),y=e.y-e.h+shy;for(let i=0;i<12;i++){const an=i/12*Math.PI*2,r=6+fr*5;hlPx(x+Math.cos(an)*r,y+Math.sin(an)*r*0.7,i%2?[255,150,192]:HLC.GOLD[2],1-fr/12)}break}
    case 'hl_burst':{if(fr>=18){e.dead=1;break}hlxDraw('burst',Math.floor(age*15),SX(e.x)+5*(e.f||1),e.y+shy-120,e.f<0);break}
    // W3.1 生命回流：連結目標身上拉出一串金綠光點，沿弧線飛回夾夾胸口，落點閃 4 顆小點
    case 'hl_mote':{if(age>0.55){e.dead=1;break}const k0=Math.min(1,age/0.36);let tx=SX(P.x),ty=P.y-(P.h||0)-92+shy,sx=SX(e.x),sy=e.y-e.h+shy;if(e.rv){[tx,sx]=[sx,tx];[ty,sy]=[sy,ty]}
      for(let i=0;i<6;i++){const k=k0-i*0.07;if(k<0||k>=1)continue;const ar=Math.sin(k*Math.PI)*36;const x=sx+(tx-sx)*k,y=sy+(ty-sy)*k-ar;hlPx(x,y,(e.lo?HLC.MINT:HLC.GOLD)[3-Math.min(2,i>>1)],1-i/7);if(i===0)hlPx(x+2,y,HLC.WHITE,0.8)}
      if(k0>=1){const u=(age-0.36)/0.19;for(let i=0;i<4;i++){const an=i*Math.PI/2+e.t0*3,r=3+u*9;hlPx(tx+Math.cos(an)*r,ty+Math.sin(an)*r*0.8,HLC.MINT[3-(i%2)],1-u)}}break}
    // W3.1 慈光庇護：腳下一圈金色光點往上升、往內收，0.6 秒內身上罩淡金點陣
    case 'hl_grace':{if(age>1.2){e.dead=1;break}const x=SX(P.x),y0=P.y+shy,u=age/1.2;
      for(let j=0;j<2;j++){const r=(46-u*18)*(j?0.7:1),yy=y0-(P.h||0)-u*110-j*28;for(let i=0;i<18;i++){const an=i/18*Math.PI*2+age*(j?-3:3);hlPx(x+Math.cos(an)*r,yy+Math.sin(an)*r*0.32,i%3?HLC.GOLD[2+(i&1)]:HLC.MINT[3],(1-u)*(j?0.8:1))}}
      if(age<0.6)for(let i=0;i<14;i++){const an=i*2.39996+age*2,rr=10+((i*37)%34),hh=20+((i*53)%120);hlPx(x+Math.cos(an)*rr,y0-(P.h||0)-hh,HLC.PALE,0.55*(1-age/0.6))}break}
    case 'hl_gpulse':{if(age>0.4){e.dead=1;break}const x=SX(P.x),y=P.y-(P.h||0)-90+shy,u=age/0.4;for(let i=0;i<12;i++){const an=i/12*Math.PI*2,r=8+u*26;hlPx(x+Math.cos(an)*r,y+Math.sin(an)*r*0.7,HLC.MINT[i%2?2:3],1-u)}break}
    case 'hl_candy':{if(age>0.5){e.dead=1;break}const x=SX(P.x),y=P.y-(P.h||0)-110+shy,u=age/0.5;for(let i=0;i<3;i++){const an=-Math.PI/2+(i-1)*0.9,r=6+u*30;hlPx(x+Math.cos(an)*r,y+Math.sin(an)*r,i===1?HLC.WHITE:[255,150,192],1-u);hlPx(x+Math.cos(an)*r+2,y+Math.sin(an)*r,[255,190,220],1-u)}break}
    case 'hl_flash':break;
    case 'hl_pillar':{if(fr>=10){e.dead=1;break}const m=e.m;hlxDraw('pillar',fr,SX(m&&!m.gone?m.x:e.x),(m&&!m.gone?m.y:e.y)+shy,false);break}
    case 'hl_cryhit':{if(fr>=22){e.dead=1;break}const m=e;if(fr<8){const k=fr/8,x=SX(e.sx+(e.x-e.sx)*k),y=(e.sy+(e.y-e.sy)*k)-(e.sh+(e.h-e.sh)*k)+shy;hlxDraw('bf_l',fr,x,y,false)}else hlRing(SX(e.x),e.y-e.h+shy,(fr-8)/14);break}
    case 'hl_cryfly':{if(fr>=8){e.dead=1;break}const m=e.m;if(!m){e.dead=1;break}const an=e.t0*2.1+e.i*2*Math.PI/Math.max(1,e.n);const x0=e.x0+Math.cos(an)*58,y0=e.y0,h0=144,k=fr/8;
      hlxDraw('bf_l',fr,SX(x0+(m.x-x0)*k),(y0+(m.y-y0)*k)-(h0+(hlChest(m)-h0)*k)+shy,false);break}
    case 'hl_cryboom':{if(fr>=14){e.dead=1;break}hlRing(SX(e.x),e.y-e.h+shy,fr/14);break}
    default:if(age>3)e.dead=1}}
  s.hlfx=fx.filter(e=>!e.dead);
  // 聖域裡的敵人：減速圖示＋「減速」
  if(ult)for(const m of s.mobs){if(!hlFoe(m)||!(m.hlSanU>t))continue;const x=SX(m.x),y=m.y-(m.h||0)+shy-(m.kind==='boss'?300:126);const fr=t*30,al=0.65+0.35*Math.sin(fr*0.25);
    for(const oy of [0,5])for(let i=-3;i<=3;i++){const xx=x-40+i*2,yy=y+oy+(3-Math.abs(i))*2;hlPx(xx,yy,HLC.PALE,al)}
    T('減速',x+6,y+6,FN(13),HLC.PALE,2,[40,26,8],'mm')}
  // 慈悲之觸：頭左上方淡紫「✚ N」
  for(const n of H.mn){const age=t-n.t;if(age>0.9)continue;const x=SX(P.x)-46*f-26,y=P.y-(P.h||0)-172+shy-age*36;X.globalAlpha=Math.min(1,(0.9-age)/0.3);T('✚ '+n.v,x,y,FN(14),[214,190,255],3,[48,24,70],'mm');X.globalAlpha=1}
  H.mn=H.mn.filter(n=>t-n.t<=0.9);
  // 全畫面閃光
  for(const e of fx)if(e.k==='hl_flash'){const fr=(t-e.t0)*30;if(fr<10){const u=fr/10;X.save();X.globalAlpha=120/255*Math.pow(1-u,1.5);X.fillStyle='rgb(255,252,232)';X.fillRect(0,0,W,H_());X.restore()}}}
const H_=()=>720;
function hlRing(x,y,k){const r=8+k*30;for(let i=0;i<20;i++){const an=i/20*Math.PI*2;hlPx(x+Math.cos(an)*r,y+Math.sin(an)*r*0.6,HLC.MINT[i%2?2:3],1-k)}}
window.m2Ents=(o=>(ents,SX,shy)=>{o(ents,SX,shy);if(!hlOn())return;const s=S0;ents.push([YMIN-198,()=>hlGround(SX,shy)]);hlEnts(ents,SX,shy)})(window.m2Ents);
window.drawM2Fx=(o=>(SX,shy)=>{o(SX,shy);if(!hlOn())return;try{hlTop(SX,shy)}catch(e){(window.__err=window.__err||[]).push('hlTop '+e.message)}})(window.drawM2Fx);

// ---- src29/c_ui.js
// ===== W3：夾夾介面（主角圖替換、HUD、4 人選角、說明頁、存檔相容、旅店、倒下）=====
// ---------- 主角圖：spr('kudas_*') → 夾夾 hl_*／絕招序列圖／KO ----------
window.spr=(o=>(n,sx,sy,op={})=>{if(!hlOn()||typeof n!=='string'||!n.startsWith('kudas_')||op.__g||op.__ally||!inPlay()||!S0||!S0.P)return o(n,sx,sy,op);
  const s=S0,P=s.P,t=s.t,fl=P.face<0;
  if(P.dead){const u=koU(P),fr=Math.floor(u*30);if(fr<27)hlxDraw('ko_fall',fr,sx,sy,fl);else hlxDraw('ko_lie',fr-27,sx,sy,fl);
    const K=HLX.ko_meta,sf=fr-36;if(sf>=0){const im=IMG['hl_soul'+(Math.floor(sf/4)%3)];const y=K.soul_y0-(2*sf+0.15*sf*sf);
      if(im&&y>-sy-320){X.save();X.imageSmoothingEnabled=false;X.globalAlpha=Math.max(0.2,1-sf/70);X.translate(Math.round(sx),Math.round(sy));if(fl)X.scale(-1,1);X.drawImage(im,-200+K.soul_dx,-282+y);X.restore();
        for(let i=0;i<3;i++){const q=(sf+i*5)%14;X.globalAlpha=0.7*(1-q/14);X.fillStyle=i%2?'rgb(255,214,90)':'rgb(255,246,190)';X.fillRect(Math.round(sx+(fl?36:-36)*0+(i-1)*14+Math.sin(sf*0.3+i)*6),Math.round(sy-282+y+150+q*4),2,2)}X.globalAlpha=1}}
    return}
  const A=P.act,V=hlVisual(P,t);if(V.sheet){hlxDraw(V.sheet,V.frame,sx,sy+(A.ph==='air'?(P.h||0):0),fl);return}
  for(const g of P.ghost||[]){const a=0.42*(1-(t-g.t)/0.25);if(a<=0)continue;o(g.nm,SX_(g.x),g.y-g.h+(sy-(P.y-(P.h||0))),{flip:g.f<0,alpha:a,filter:'brightness(1.6) sepia(1) hue-rotate(10deg)',__g:1})}
  const nm='hl_'+V.name;const gl=(P.act&&['hpr','hgl','hpu'].includes(P.act.type))?[255,236,160,Math.floor(90+60*Math.sin(t*20))]:op.glow;
  return o(nm,sx,sy,Object.assign({},op,{rot:0,dy:0,glow:gl}))})(window.spr);
const SX_=x=>x-(S0?S0.cam:0);
window.koHold=(o=>()=>hlOn()?2.6:o())(window.koHold);
// 對白：夾夾沒有對白（苦達斯的台詞也不出現）
window.sub=(o=>function(who,line,dur){if(hlOn()&&(who==='苦達斯'||who==='夾夾'))return;return o.apply(this,arguments)})(window.sub);
// ---------- 里程碑、援助 ----------
MS25.heal=[[5,{ttl:'見習祈禱者'},'稱號「見習祈禱者」'],[10,{hfaith:1},'信仰上限 +1'],[15,{crit:0.01},'暴擊率 +1%'],[20,{hdot:0.05},'持續傷害 +5%'],
  [25,{ttl:'巡迴醫者',gold:0.03},'稱號「巡迴醫者」＋金幣 +3%'],[30,{hult:1},'天使之翼浮空 +1 秒'],[35,{cdmg:0.05},'暴擊傷害 +5%'],[40,{hbrk:60},'生命連結斷線距離 320 → 380'],
  [45,{drop:0.03},'裝備掉落率 +3%'],[50,{ttl:'鼠王的祭司',ms:0.03},'稱號「鼠王的祭司」＋移動速度 +3%'],[55,{crit:0.01},'暴擊率 +1%（累計 +2%）'],[60,{def:0.02},'受到傷害 −2%'],
  [65,{ttl:'傳說的治癒師',awk:1},'稱號「傳說的治癒師」＋開啟覺醒']];
window.calcGS=(o=>function(){const r=o.apply(this,arguments);try{if(hlOn()&&GS.g25&&SAVE){const g=grow25(),m=g.ms;GS.g25.hfaith=m.hfaith||0;GS.g25.hult=m.hult||0;GS.g25.hbrk=m.hbrk||0;GS.g25.hdot=(m.hdot||0)+g.awk.cls}}catch(e){}return r})(window.calcGS);
AST_DEF.heal='kudas';AST_N.heal='夾夾';AST_FX.heal='（夾夾不當援助角色）';
// ---------- 存檔相容：舊版不認識夾夾 → 寫出時停車成苦達斯／詩人（healX），短杖 wc:'k'+wcX:'h' ----------
function m29Park(o){if(!o||typeof o!=='object')return o;const pk=L=>{for(const it of L||[])if(it&&it.t==='w'&&it.wc==='h'){it.wc='k';it.wcX='h'}};
  if(o.hero==='heal'){const me={};for(const f of PERK)me[f]=o[f];const back=o.chars&&(o.chars.kudas?'kudas':o.chars.bard?'bard':null);
    if(back){const b=o.chars[back];for(const f of PERK)o[f]=b[f];delete o.chars[back];o.hero=back;o.heroH='heal';o.healX=me}}
  else if(o.chars&&o.chars.heal){o.healX=o.chars.heal;delete o.chars.heal}
  pk(o.inv);pk(o.wh);if(o.chars)for(const k in o.chars)pk(o.chars[k]&&o.chars[k].inv);pk(o.healX&&o.healX.inv);if(o.archerX)pk(o.archerX.inv);return o}
function m29Unpark(S){if(!S||typeof S!=='object')return S;const un=(L,keep)=>{for(const it of L||[])if(it&&it.wcX==='h'){if(keep)it.wc='h';delete it.wcX}};
  if(S.healX&&typeof S.healX==='object'){S.chars=S.chars||{};un(S.healX.inv,true);S.chars.heal=S.healX;try{m22FixChar(S,S.chars.heal,'heal')}catch(e){}}delete S.healX;
  un(S.wh,true);un(S.inv,S.hero==='heal');if(S.chars)for(const k in S.chars)un(S.chars[k]&&S.chars[k].inv,k==='heal');
  if(S.heroH==='heal'&&S.chars&&S.chars.heal&&S.hero!=='heal'){const cur={};for(const f of PERK)cur[f]=S[f];S.chars[S.hero]=cur;const nx=S.chars.heal;for(const f of PERK)S[f]=nx[f];delete S.chars.heal;S.hero='heal';HEROK='heal';m22ApplyHero()}
  delete S.heroH;if(S.ast&&(!HERO[S.ast.heal]||S.ast.heal==='heal'))S.ast.heal='kudas';
  for(const k in S.ast||{})if(k!=='heal'&&S.ast[k]==='heal')S.ast[k]=AST_DEF[k];return S}
window.m21Migrate=(o=>S=>{const hx=S&&S.healX,hh=S&&S.heroH;o(S);try{if(hx&&!S.healX)S.healX=hx;if(hh)S.heroH=hh;m29Unpark(S)}catch(e){console.warn('m29Unpark',e)}return S})(window.m21Migrate);
window.m27Park=(o=>S=>{let P_=S;try{P_=m29Park(JSON.parse(JSON.stringify(S)))}catch(e){}return o(P_)})(window.m27Park);
window.__m29={park:m29Park,unpark:m29Unpark};
// ---------- 旅店 ----------
window.innHero=(o=>t=>{if(!hlOn())return o(t);const mv=Math.abs(INN.tx-INN.x)>3;return mv?'hl_run'+Math.floor(t/0.08)%8:'hl_idle'+Math.floor(t/0.12)%12})(window.innHero);
// ---------- 選角：4 張卡 ----------
CHS.ks.push('heal');
CHINFO.heal={col:[230,190,90],tag:['治癒師：用生命連結纏住敵人，持續傷害＋回血','打中就回血（慈悲之觸）；信仰越高治療越強','J 普攻 4 段・K 生命連結・L 幻痛・↓K 生命脈動','↓L 防護・K+L 召喚輝光・J+K 天使之翼'],
  poses:['hl_idle0','hl_idle4','hl_atk1_1','hl_atk1_3','hl_atk2_2','hl_atk2_4','hl_atk3_3','hl_link2','hl_link4','hl_link5','hl_link7','hl_idle8']};
window.drawPor=(o=>(k,x,y,z,on,dim)=>{if(k!=='heal')return o(k,x,y,z,on,dim);const im=IMG.healpor;X.save();X.imageSmoothingEnabled=false;if(dim)X.globalAlpha=0.45;
  rrect(x-2,y-2,x+z+2,y+z+2,6,on?'rgba(60,40,20,0.95)':'rgba(16,12,10,0.9)',on?'rgb(255,226,140)':'rgba(150,120,70,0.7)',on?3:1);if(im&&im.width)X.drawImage(im,x,y,z,z);X.restore()})(window.drawPor);
const m29AstOpts=k=>CHS.ks.filter(q=>q!==k&&q!=='heal');
window.drawChsel3=function(){const t=performance.now()/1000,age=(performance.now()-CHS.t0)/1000;X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.5;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
  X.fillStyle='rgba(10,6,4,0.5)';X.fillRect(0,0,W,H);
  T('選擇角色',640,44,FS(40),[255,236,200],4,[60,20,10],'mm');T('裝備、背包、強化、關卡進度、等級各自獨立；金幣與旅店倉庫共用',640,84,FN(15),[230,214,180],2,[0,0,0],'mm');
  const n=CHS.ks.length;if(CHS.sel>=n)CHS.sel=0;CHS.ks.forEach((k,i)=>{const cx=160+i*320,x0=cx-150,x1=cx+150,y0=108,y1=624,sel=CHS.sel===i,I=CHINFO[k],H_=HERO[k];const hov=MOUSE&&inBox(MOUSE,[x0,y0,x1,y1]);
    rrect(x0,y0,x1,y1,16,sel?'rgba(40,24,16,0.95)':'rgba(20,14,12,0.86)',sel?'rgb(255,226,140)':hov?'rgb(214,172,84)':'rgba(150,120,70,0.7)',sel?4:2);
    if(sel){X.save();X.globalAlpha=0.18+0.08*Math.sin(t*4);X.fillStyle=rgb(I.col);X.fillRect(x0+8,y0+8,x1-x0-16,232);X.restore()}
    X.save();X.fillStyle='rgba(0,0,0,0.35)';X.beginPath();X.ellipse(cx,y0+222,84,12,0,0,Math.PI*2);X.fill();X.restore();
    const ph=sel?I.poses[Math.floor(t/0.32)%I.poses.length]:I.poses[Math.floor(t/0.4)%2];const nm=(ph.startsWith('kudas')||m21Has(ph))?ph:I.poses[0];
    X.save();X.beginPath();X.rect(x0+4,y0+4,x1-x0-8,236);X.clip();spr(nm,cx-10,y0+226,{sc:k==='archer'||k==='heal'?1.0:1.05,glow:sel?[255,236,160,Math.floor(150+80*Math.sin(t*6))]:null,alpha:sel?1:0.75});X.restore();
    if((k==='archer'&&!SAVE.seenAr)||(k==='heal'&&!SAVE.seenHl)){rrect(x1-70,y0+10,x1-12,y0+36,8,'rgb(220,60,60)','rgb(255,230,200)',2);T('NEW',x1-41,y0+23,FN(14),[255,255,255],2,[60,0,0],'mm')}
    T(H_.n,cx,y0+256,FS(28),sel?[255,244,214]:[210,200,190],3,[0,0,0],'mm');T(H_.job+`　HP ${H_.hp.toLocaleString('en-US')}`,cx,y0+286,FN(15),[255,214,140],2,[0,0,0],'mm');
    let yy=y0+312;I.tag.forEach((l,j)=>{for(const w of wrapT(l,FN(12),278)){T(w,cx,yy,FN(12),j?[220,212,200]:[255,236,190],2,[0,0,0],'mm');yy+=17}});
    const p=m22Prog(k);const wn=p.w?itName(p.w)+(p.c.slot&&p.c.slot.e?' +'+p.c.slot.e:''):'（沒有武器）';
    rrect(x0+10,y0+404,x1-10,y0+430,8,'rgba(0,0,0,0.45)','rgba(214,172,84,0.5)',1);T(`Lv.${p.c.lv||1}　通關 ${p.n}/${NST}　${wn}`,cx,y0+417,FN(12),[255,255,255],2,[0,0,0],'mm');
    const a=astOf(k),opts=m29AstOpts(k);T('援助（V）',x0+14,y0+452,FS(14),[170,240,150],2,[0,0,0],'lm');
    const gap=opts.length>=3?88:120;opts.forEach((q,j)=>{const px=x0+14+j*gap,py=y0+466,on=a===q;drawPor(q,px,py,28,on,!on);T(AST_N[q],px+34,py+14,FN(12),on?[255,244,214]:[160,150,140],2,[0,0,0],'lm');
      if(CLICK&&inBox(CLICK,[px-4,py-4,px+gap-6,py+32])){astSet(k,q);CLICK=null;sfx('coin',0.3);m2Save()}});
    for(const [j,l] of wrapT(AST_FX[a]||'',FN(11),276).slice(0,2).entries())T(l,cx,y0+514+j*15,FN(11),[200,230,190],2,[0,0,0],'mm');
    if(CLICK&&inBox(CLICK,[x0,y0,x1,y1])){if(CHS.sel===i)m22Pick(k);else{CHS.sel=i;sfx('coin',0.3)}}});
  T(`金幣（共用）${SAVE.gold.toLocaleString('en-US')}　倉庫 ${SAVE.wh.length}/${WH_MAX}`,640,650,FN(17),[255,226,120],2,[0,0,0],'mm');
  T('←→ 選角色　↑↓ 換援助角色　Enter 進入任務旅店　Esc 回封面',640,688,FN(16),[200,190,170],2,[0,0,0],'mm');
  if(mode!=='chsel')return;
  if(AUTO&&!window.__autoStop){if(age>0.8){const q=Q.get('hero');const k=q&&HERO[q]?q:(window.__autoHero||'kudas');if(Q.get('ast'))astSet(k,Q.get('ast'));m22Pick(k)}return}
  if(press(['ArrowLeft','KeyA'])||GPP.l){CHS.sel=(CHS.sel+n-1)%n;sfx('coin',0.25)}if(press(['ArrowRight','KeyD'])||GPP.r){CHS.sel=(CHS.sel+1)%n;sfx('coin',0.25)}
  if(press(['ArrowUp','KeyW','ArrowDown','KeyS'])||GPP.u||GPP.d){const k=CHS.ks[CHS.sel],o=m29AstOpts(k);astSet(k,o[(o.indexOf(astOf(k))+1)%o.length]);sfx('coin',0.3);m2Save()}
  if(IN.start()||press(['KeyJ','Space'])||GPP.jump)m22Pick(CHS.ks[CHS.sel]);
  else if(IN.esc()){mode='title';titleT=0;titleMus=false;window.__holdTitle=true}};
window.m22Pick=(o=>k=>{if(k==='heal'&&SAVE&&!SAVE.seenHl)SAVE.seenHl=1;return o(k)})(window.m22Pick);
// ---------- HUD ----------
const HLMAP={'苦達斯':'夾夾','苦達斯倒下了……':'夾夾倒下了……','節奏':'信仰',
  '方向鍵/WASD 移動　J 攻擊　K 心臟刺擊　L 大劍術　Space 跳躍　V 召喚詩人　E 互動　I 背包（暫停）　Esc 暫停':'J 普攻　K 生命連結　L 幻痛　↓K 生命脈動　↓L 防護　K+L 召喚輝光　J+K 天使之翼　Shift 衝刺　V 援助'};
let HL_TXT=false,HL_RH=null;
let HL_MAN=false;
window.T=(o=>function(s,...r){if(HL_MAN&&typeof s==='string'&&s.includes('/3）'))s=s.replace('/3）','/4）');if(HL_TXT&&typeof s==='string'){if(HLMAP[s])s=HLMAP[s];else if(HL_RH&&s===HL_RH[0])s=HL_RH[1]}return o(s,...r)})(window.T);
const hlCdF=(cd,mx)=>Math.max(0,Math.min(1,cd/(mx*hlMvcd())));
window.skillTile=(o=>(cx,cy,R,g,col,key,cost,dim,deny,cdFrac,name)=>{if(HL_TXT){const H=S0.P.hl||{};
    if(g==='攻'){g='杖';col=[200,160,60];cost=''}
    else if(g==='刺'){g='鍊';col=[220,150,40];cost='';dim=H.lkCD>0;deny=S0.denyK||-9;cdFrac=hlCdF(H.lkCD,HL.link.cd)}
    else if(g==='風'||g==='掃'){g='幻';col=[90,190,80];cost='';dim=H.phCD>0;deny=S0.denyL||-9;cdFrac=hlCdF(H.phCD,HL.ph.cd)}
    else if(g==='跳'){g='跳'}}
  return o(cx,cy,R,g,col,key,cost,dim,deny,cdFrac,name)})(window.skillTile);
window.drawHUD=(o=>(cx0,shy)=>{const s=S0,P=s&&s.P;if(!P||!hlOn())return o(cx0,shy);const t=s.t,H=hlS(),a=astOf('heal');
  const sv=[IMG.por,IMG.bardh,IMG.bardg,s.bard,P.rh];if(IMG.healpor&&IMG.healpor.naturalWidth)IMG.por=IMG.healpor;
  const okI=n=>IMG[n]&&IMG[n].naturalWidth;if(a==='kudas'&&okI('kudash')&&okI('kudasg')){IMG.bardh=IMG.kudash;IMG.bardg=IMG.kudasg;fakeBadge(s,s.ally)}else if(a==='archer'&&okI('archerh')&&okI('archerg')){IMG.bardh=IMG.archerh;IMG.bardg=IMG.archerg;fakeBadge(s,s.arA)}
  const fm=hlFmax();P.rh=Math.round(H.faith/fm*RHMAX*100)/100;HL_RH=[`${P.rh} / ${RHMAX}`,`${H.faith} / ${fm}`];HL_TXT=true;
  try{o(cx0,shy)}finally{IMG.por=sv[0];IMG.bardh=sv[1];IMG.bardg=sv[2];s.bard=sv[3];P.rh=sv[4];HL_TXT=false;HL_RH=null}
  // 防護罩：HP 條上淡藍色
  if(H.sh){const k=Math.max(0,H.sh.hp/HPMAX);X.fillStyle='rgba(170,230,255,0.85)';X.fillRect(127,39,Math.round(272*Math.min(1,k))+1,5)}
  const tile=(x,y,r,l,k,cd,mx,col,deny)=>{const rdy=cd<=0;circ(x,y,r,rdy?rgb(col.map(v=>v*0.45|0),0.92):'rgba(30,24,20,0.85)',rdy?rgb(col.map(v=>Math.min(255,v+90))):'rgb(120,100,80)',3);
    if(!rdy){X.save();X.beginPath();X.moveTo(x,y);X.arc(x,y,r-3,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,cd/mx));X.closePath();X.fillStyle='rgba(0,0,0,0.55)';X.fill();X.restore()}
    const dn=t-(deny||-9)<0.35;T(l,x+(dn?Math.round(4*Math.sin(t*70)):0),y-1,FS(15),rdy?[255,244,214]:[170,160,150],2,[0,0,0],'mm');T(k,x,y+r+6,FN(11),[220,210,190],2,[0,0,0],'mm')};
  tile(810,604,24,'衝刺','Shift',H.dCD||0,HL.dash.cd,[80,160,200]);tile(748,604,24,'防護','↓L',H.prCD||0,HL.pr.cd*hlMvcd(),[120,190,240],s.denyPr);tile(686,604,24,'脈動','↓K',H.puCD||0,HL.pu.cd*hlMvcd(),[220,70,110],s.denyPu);
  {const cd=Math.max(0,H.glCD||0),mx=HL.gl.cd*hlMvcd();skillTile(1070,524,22,'輝',[90,180,120],'K+L',s.hlgl?'輝光中':'',cd>0,s.denyGl||-9,cd>0?cd/mx:0,null)}
  {const u=Math.min(1,(H.ug||0)/100),ult=P.act&&P.act.type==='hu';skillTile(994,524,22,'翼',[230,180,60],'J+K',ult?'天使之翼':u>=1?'天使之翼滿':'天使之翼'+Math.floor(u*100)+'%',u<1&&!ult,s.denyU||-9,ult?0:1-u,null);
   if(u>=1)arc(994,524,25,-90,270,Math.floor(t*6)%2?'rgb(255,236,150)':'rgb(230,180,60)',3);else if(u>0)arc(994,524,25,-90,-90+360*u,'rgb(230,180,60)',3)}
  // 結晶數
  {const n=H.cry||0;for(let i=0;i<3;i++)circ(140+i*18,128,6,i<n?'rgb(170,250,230)':'rgba(30,40,40,0.8)','rgb(20,40,40)',2)}
  let bx=200;const bf=[];if(H.blessU>t)bf.push(['祝',[200,160,40],H.blessU]);if(H.sh)bf.push(['盾',[90,160,220],H.sh.until]);if(H.heavyU>t)bf.push(['創',[150,40,60],H.heavyU]);
  for(const [g,col,u] of bf){rrect(bx,116,bx+24,140,5,rgb(col),'rgb(255,240,220)',2);T(g,bx+12,128,FS(15),[255,255,255],2,[10,20,50],'mm');T(Math.ceil(u-t)+'',bx+23,142,FN(10),[255,255,255],2,[0,0,0],'rb');bx+=30}})(window.drawHUD);
window.drawDead=(o=>(...a)=>{HL_TXT=hlOn();try{return o(...a)}finally{HL_TXT=false}})(window.drawDead);
// ---------- 說明頁：4 個角色 ----------
window.drawManual=(o=>()=>{const ks=['Tab','ArrowRight','ArrowLeft'];if(MAN.q==null)MAN.q=0;
  const go=KP.Tab||KP.ArrowRight,back=KP.ArrowLeft&&!go;
  if(MAN.q===3){if(go||back){MAN.q=go?0:2;for(const k of ks)KP[k]=false}else{drawHlManual();return}}
  if(MAN.q===2&&go){MAN.q=3;for(const k of ks)KP[k]=false;drawHlManual();return}
  if(MAN.q===0&&back){MAN.q=3;for(const k of ks)KP[k]=false;drawHlManual();return}
  HL_MAN=true;try{return o()}finally{HL_MAN=false}})(window.drawManual);
function drawHlManual(){X.fillStyle='#000';X.fillRect(0,0,W,H);X.save();X.globalAlpha=0.35;X.drawImage(IMG.titlebg,0,0,W,H);X.restore();
  rrect(100,26,1180,700,14,'rgba(16,10,8,0.92)',rgb(GOLDC),3);T('操作說明・夾夾（治癒師）',640,64,FS(30),[255,236,200],4,[60,20,10],'mm');
  const rows=[['普攻','J：刺擊→光彈→光掌（擊退）→扇形光彈 3 發；打中連結中的敵人 +1 信仰'],['生命連結','K：甩出光鏈纏住敵人（最多 3 條）：每 0.5 秒持續傷害、波及旁邊 3 隻、緩速 30%、受到傷害 +8%；連結中每 3 秒 1 顆結晶，3 顆 → 光靈追打 6 秒。冷卻 5 秒'],
    ['幻痛','L：光球在敵人之間彈 6 次（最後一下大爆炸＋暈眩），每次回到身上回血；施放後可以自由移動。冷卻 9 秒'],['生命脈動','↓+K：從連結目標放出荊棘線打 6 隻（信仰滿 8 隻）：緩速＋痛楚。冷卻 9 秒'],
    ['防護','↓+L：點陣護盾吸收 25.5% 最大 HP、每秒回血、被打會反擊；連結中的敵人攻擊 −10%。持續／冷卻 15 秒'],['召喚輝光','K+L：兩根結晶 15 秒：攻擊結晶打 3 隻＋恐懼，治療結晶回血；之後第一隻光靈傷害 +22%。冷卻 25 秒'],
    ['天使之翼','J+K：量表滿（約 22 秒）。祈禱時無敵 → 胸口光爆＋光柱打 400px 內所有敵人、每秒回血；聖域裡敵人攻擊 −25%、出手變慢。浮空中受到傷害 −40%，只能普攻和生命連結（附帶光之結晶）；結束時結晶全部引爆'],
    ['被動','慈悲之觸：直接打中就回血（淡紫 ✚）。罪印共鳴：身上有減益的敵人越多傷害越高。信仰：每層治療 +4%，5 秒沒增加就慢慢掉'],
    ['衝刺','Shift：短距離衝刺，有無敵時間。冷卻 0.9 秒'],['援助（V）','食物 3/3：選角畫面設定的援助角色'],['其他','HP 3,450、被打 4 下倒地；單次受到 15% 以上傷害＝重創：2.5 秒內技能治療減半。E 互動　I 背包　Esc 暫停']];
  rows.forEach(([a,b],i)=>{const y=110+i*50;T(a,150,y,FS(17),[255,244,214],2,[0,0,0],'lm');for(const [j,l] of wrapT(b,FN(15),820).entries())T(l,310,y+j*18,FN(15),[235,230,220],2,[0,0,0],'lm')});
  T('（4/4）Tab／←→：換角色　　Esc / Enter 回標題',640,680,FS(18),[255,255,255],3,[0,0,0],'mm')}

// ---- src29/d_gear.js
// ===== W3.1：夾夾專屬裝備 — 特殊短杖 SP18–SP22、專屬符文 6 種、朝聖者套裝（4 件）=====
// 規則沿用其他英雄：特殊武器佔 1 條詞條、能力不能重洗／繼承、不能升級／當素材（m24.js）；符文格式 ['部位',說明,[紫,藍,綠],'',{heal:1}]
// 套裝件：一般防具少 1 條隨機詞條，換成看得到的玩法效果；效果只給夾夾。數值都直接改 HL（每次 calcGS 先還原再套）
const HLB=JSON.parse(JSON.stringify(HL));
Object.assign(SPW,{
 SP18:{n:'預言者的彎匙',c:'h',r:4,st:['money'],src:'any',d:0,tf:1,a:'意念折彎',tx:'幻痛的光球多彈 2 次（6 → 8 次，最後一爆在第 8 次）。生命連結的鞭擊射程 340 → 440px、斷線距離 +100px'},
 SP19:{n:'蜜環祝禱糖',c:'h',r:5,st:['s2'],src:'any',d:2,a:'舔一口',tx:'滿血時溢出的治療存成「糖層」（每 6% 一層，最多 3 層）；被打時吃掉 1 層，這一下傷害 −35%。防護吸收量 +30%'},
 SP20:{n:'聖歌傳聲晶石',c:'h',r:5,st:['crystal'],src:'any',d:2,a:'佈道廣播',tx:'生命脈動的線 +2 條（信仰滿 10 條）、線長 +25%，每次脈動的治療上限 6% → 10%'},
 SP21:{n:'晨禱小手鈴',c:'h',r:4,st:['canyon'],src:'any',d:0,a:'叫醒罪人',tx:'生命連結同時最多 3 → 4 條；連結拉回自己的光點（生命回流）多 60%'},
 SP22:{n:'停滯的朝聖懷錶',c:'h',r:6,st:null,src:'boss',d:3,a:'時之贖罪',tx:'召喚輝光的兩根圖騰 15 → 21 秒；光縛 8 → 10 秒、痛楚 4 → 5 秒'}});
// 圖示沿用一般短杖（不另外載圖）
window.m2Assets=(o=>()=>o().filter(n=>!/^i_sp(18|19|20|21|22)$/.test(n)))(window.m2Assets);
// 轉蛋紫色特殊武器：夾夾＝預言者的彎匙（原本會掉到苦達斯的三日法棍）
window.m24MakeSp=(o=>function(it,id){if(id==='SP02'&&heroCls()==='h')id='SP18';return o(it,id)})(window.m24MakeSp);
// ---------- 專屬符文 ----------
Object.assign(RUNES,{
 '慈光':['n',v=>`夾夾自身治療 +${v}%（每秒上限一起提高）`,[25,18,10],'',{heal:1}],
 '纏縛':['s',v=>`生命連結斷線距離 +${v}px`,[100,70,40],'',{heal:1}],
 '守誓':['bp',v=>`防護吸收量 +${v}%`,[35,25,15],'',{heal:1}],
 '輝映':['r',v=>`召喚輝光的圖騰多留 ${v} 秒`,[5,3,2],'',{heal:1}],
 '蔓延':['w',v=>`光縛濺射多 ${v} 隻`,[2,1,1],'',{heal:1}],
 '波浪的刻印':['n',v=>`信仰上限 +${v}`,[2,1,1],'',{heal:1}]});
window.rollRune=(o=>t=>{let n=o(t);for(let i=0;i<12&&RUNES[n]&&RUNES[n][4]&&RUNES[n][4].heal&&heroCls()!=='h';i++)n=o(t);return n})(window.rollRune);
// ---------- 套裝 ----------
const GSET={pil:{n:'朝聖者套裝',hero:'heal',parts:{b:'朝聖者的粗麻斗篷',p:'朝聖者的補丁長褲',s:'磨破的朝聖草鞋',n:'乳酪念珠'},
  bon:[[2,'苦行','夾夾自身治療 +20%、痛楚 +1 秒'],[3,'告解','生命連結 +1 條、光縛減速 30% → 40%、斷線距離 +60px'],[4,'朝聖之路','帶夾夾負面狀態的敵人倒下：信仰 +2、光點飛回回復 3% HP']]}};
window.GSET=GSET;
function gsetN(k){let n=0;for(const [sl] of SLOTS){const it=eqItem(sl);if(it&&it.set===k)n++}return n}
window.itName=(o=>it=>it&&it.set&&GSET[it.set]&&GSET[it.set].parts[it.t]?GSET[it.set].parts[it.t]:o(it))(window.itName);
window.itemLines=(o=>it=>{const out=o(it);if(it&&it.set&&GSET[it.set]){const S=GSET[it.set],n=gsetN(it.set),mine=HEROK===S.hero;
  out.splice(1,0,['套裝',`${S.n}（${n}／4）${mine?'':'（夾夾專屬套裝效果）'}`,[120,230,140]]);
  S.bon.forEach(([k,nm,tx],i)=>out.splice(2+i,0,[`${k} 件`,`${nm}：${tx}`,mine&&n>=k?[140,255,160]:[150,150,150]]))}return out})(window.itemLines);
const GSIC=new WeakMap();
window.gearIconC=(o=>it=>{const c=o(it);if(!(it&&it.set)||!c)return c;let d=GSIC.get(c);if(d)return d;const [c2,x]=mk(20,20);x.drawImage(c,0,0);x.fillStyle='rgb(30,16,22)';x.fillRect(15,1,4,4);x.fillStyle='rgb(110,240,130)';x.fillRect(16,2,2,2);GSIC.set(c,c2);return c2})(window.gearIconC);
const GSET_CH=[0,0,0.08,0.12,0.16];
window.rollDrop=(o=>minR=>{const it=o(minR);try{if(it&&GSET.pil.parts[it.t]&&it.r>=3&&!it.set&&typeof RUN!=='undefined'&&RUN&&RUN.d>=2){
  const ch=GSET_CH[Math.min(4,RUN.d)]*(heroCls()==='h'?0.75:0.25);if(Math.random()<ch){it.set='pil';if(it.lines.length)it.lines.pop()}}}catch(e){}return it})(window.rollDrop);
// ---------- 套到 HL ----------
function hlGearApply(){const B=HLB;for(const k of ['link','ph','pu','pr','gl','faith','sus'])Object.assign(HL[k],JSON.parse(JSON.stringify(B[k])));HL.hm=1;HL.gset=0;HL.wsp=null;
  if(HEROK!=='heal')return;const sp=GS.sp,hr={};const RA=runeActive();
  for(const [sl] of SLOTS){const it=eqItem(sl);if(it&&it.rune&&RUNES[it.rune.n]&&RUNES[it.rune.n][4]&&RUNES[it.rune.n][4].heal&&RA.has(it.id)){const v=RUNES[it.rune.n][2][it.rune.g];hr[it.rune.n]=Math.max(hr[it.rune.n]||0,v)}}
  const n=gsetN('pil');HL.gset=n;HL.wsp=sp;GS.hr=hr;GS.hset=n;
  if(sp==='SP18'){HL.ph.n=8;HL.link.rng+=100;HL.link.brk+=100}
  if(sp==='SP19')HL.pr.abs*=1.3;
  if(sp==='SP20'){HL.pu.n+=2;HL.pu.nF+=2;HL.pu.len*=1.25;HL.pu.healMax=0.10}
  if(sp==='SP21'){HL.link.max=4;HL.sus.tick*=1.6}
  if(sp==='SP22'){HL.gl.dur+=6;HL.link.dur+=2;HL.pu.painT+=1}
  if(hr['慈光'])HL.hm+=hr['慈光']/100;if(hr['纏縛'])HL.link.brk+=hr['纏縛'];if(hr['守誓'])HL.pr.abs*=1+hr['守誓']/100;
  if(hr['輝映'])HL.gl.dur+=hr['輝映'];if(hr['蔓延'])HL.link.splN+=hr['蔓延'];if(hr['波浪的刻印'])HL.faith.max+=hr['波浪的刻印'];
  if(n>=2){HL.hm+=0.2;HL.pu.painT+=1}if(n>=3){HL.link.max+=1;HL.link.slow=0.6;HL.link.brk+=60}}
window.hlGearApply=hlGearApply;
let GSET_LAST=-1;
window.calcGS=(o=>function(){const r=o.apply(this,arguments);try{hlGearApply();const n=HL.gset||0;
  if(GSET_LAST>=0&&n>GSET_LAST&&HEROK==='heal'&&typeof mode!=='undefined'&&mode==='play'){const b=GSET.pil.bon.filter(x=>x[0]<=n).pop();if(b)proc(`套裝 ${b[0]} 件・${b[1]}`,[140,255,160],'套')}GSET_LAST=n}catch(e){}return r})(window.calcGS);
// 蜜環祝禱糖：溢出治療 → 糖層；被打吃 1 層 −35%
window.hlOver=function(v){if(HL.wsp!=='SP19')return;const H=hlS();H.cE=(H.cE||0)+v;while(H.cE>=HPMAX*0.06&&(H.candy||0)<3){H.cE-=HPMAX*0.06;H.candy=(H.candy||0)+1}if((H.candy||0)>=3)H.cE=0};
window.hlCandy=function(r){if(HL.wsp!=='SP19'||r<=0)return r;const H=hlS();if(!(H.candy>0))return r;H.candy--;hlFx({k:'hl_candy',t0:S0.t});return Math.round(r*0.65)};
// 朝聖之路（4 件）：帶負面狀態的敵人倒下 → 信仰 +2、光點飛回 3%
window.m2Step=(o=>dt=>{o(dt);const s=S0;if(!s||HEROK!=='heal'||(HL.gset||0)<4)return;const t=s.t;
  for(const m of s.mobs){if(m.kind==='pillar'||m.hlPil4)continue;if((m.dying||m.gone)&&hlDebuffed(m,t-0.6)){m.hlPil4=1;hlFaith(2);const v=hlHeal(0.03,'g');hlFx({k:'hl_mote',x:m.x,y:m.y,h:hlChest(m),t0:t,lo:1});if(v>0)hlFx({k:'hl_gpulse',t0:t})}}})(window.m2Step);

// ---- src29/e_bal.js
// ===== W3.2 全角色平衡：苦達斯「不屈」=====
// 5深淵 苦達斯 死亡集中在水晶監護者的紅圈＋近身（大劍要貼身打，紅圈難完全躲）。
// 站樁硬打的大劍士：紅圈（預警大招）打到他只吃 70%；HP 低於 40% 時所有傷害再 ×0.65（咬牙撐住，給復仇回血時間）。
const W32={kudasTele:0.7,kudasLow:0.4,kudasLowK:0.65,kudasRev:0.12};
if(typeof teleHurtP==='function')window.teleHurtP=(o=>function(){if(HEROK!=='kudas')return o.apply(this,arguments);W32.tele=1;try{return o.apply(this,arguments)}finally{W32.tele=0}})(teleHurtP);
window.m2Hurt=(o=>function(v,x){if(HEROK==='kudas'){if(W32.tele)v*=W32.kudasTele;const P=S0&&S0.P;if(P&&P.hp<HPMAX*W32.kudasLow)v*=W32.kudasLowK}return o.call(this,v,x)})(window.m2Hurt);
// 復仇回血（被打後 3.2 秒內打中敵人回血）每下上限 8% → 12%：被群毆時靠揮劍把血搶回來
window.m2Step=(o=>dt=>{o(dt);if(HEROK==='kudas'){const c=Math.round(HPMAX*W32.kudasRev);if(HEAL_CAP!==c)HEAL_CAP=c}})(window.m2Step);

