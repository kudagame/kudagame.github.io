#!/usr/bin/env python3
"""P5.3: derive hybrid pixels from existing parents; no AI art / no floating badges.
All portraits are exact nearest-neighbour crops of the corresponding idle sprite.
Body marks are clipped to fur; inherited feather/tail/ruff patches are original pixels.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, shutil, datetime, colorsys
import numpy as np
ROOT=Path(__file__).resolve().parents[1]; AS=ROOT/'assets'; OUT=Path('/workspace/out/pet_P53')
BACK=Path('/workspace/backups_1110')/('hybrid_P53_'+datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
OUT.mkdir(parents=True,exist_ok=True)
SPECS=[
 ('moonhound','月牙犬','hound_v3','小狼 × 獵犬','銀肩月牙斑'),
 ('lanterncat','燈尾貓','cat_v3','貓 × 小狐狸','狐形燈尾'),
 ('honeybear','蜜熊','bear_v3','小熊 × 浣熊','浣熊眼罩與環尾'),
 ('featherbun','羽耳兔','rabbit_v3','兔子 × 小貓頭鷹','耳側羽簇'),
 ('puffdog','蓬蓬犬','pomeranian_v3','博美犬 × 西施犬','西施垂耳與蓬鬆頰毛'),
 ('frostfox','霜尾狐','fox_v3','小狐狸 × 小狼','狼灰毛與霜白尾'),
 ('starwolf','星夜狼','wolf_v3','四祖：小狼・獵犬・小狐狸・小狼','夜藍毛與背星斑'),
 ('liondog','蜜糖獅子犬','shihtzu_v3','四祖：博美犬・西施犬・小熊・浣熊','蜜金獅鬃')]
def backup(p):
 if p.exists():
  q=BACK/p.relative_to(ROOT);q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
def save(im,p):
 backup(p);p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
def parent(sp,act,i=0):
 j=json.loads((AS/'pets'/sp/'anchors.json').read_text()); act=act if act in j['anchors'] else 'idle'; i%=len(j['anchors'][act]);w,h=j['canvas'];fur=j['tiers']['adult']['fur'];im=Image.open(AS/'pets'/sp/f'body_{fur}_{act}.png').convert('RGBA').crop((i*w,0,(i+1)*w,h));return im,j['anchors'][act][i]
def paste_patch(im,src,box,dest,size=None):
 patch=src.crop(box)
 if size:patch=patch.resize(size,Image.Resampling.NEAREST)
 im.alpha_composite(patch,tuple(map(int,dest)))
def derive(sp,im,an,act,fi):
 a=np.array(im);rgb=a[:,:,:3].astype(float);h,w=a.shape[:2]; yy,xx=np.mgrid[:h,:w]
 hx,hy=an['head_top'];nx,ny=an['neck'];bx,by=an['back'];tx,ty=an['tail']
 lum=rgb@np.array([.3,.59,.11]);opaque=a[:,:,3]>40
 # Keep outline, eyes, white highlights intact; texture is inherited, not redrawn.
 fur=opaque&(lum>49)
 def paint(mask,color,mix=1):
  nonlocal a
  mask=mask&fur; shade=np.clip(lum/175,.62,1.15)
  for k,c in enumerate(color):a[:,:,k]=np.where(mask,np.clip(a[:,:,k]*(1-mix)+c*shade*mix,0,255),a[:,:,k])
 if sp=='moonhound':
  shoulder=((xx-(nx-4))/10)**2+((yy-(ny+5))/13)**2<1
  paint(shoulder,(139,148,158),.8)
  cres=((xx-(nx-5))**2+(yy-(ny+3))**2<36)&((xx-(nx-2))**2+(yy-(ny+1))**2>27)
  paint(cres,(250,240,201))
 elif sp=='honeybear':
  eyes=an.get('eyes',[[hx+2,hy+12]])
  for ex,ey in eyes:paint(((xx-ex)/7)**2+((yy-ey)/4)**2<1,(69,51,38),.85)
  paint((yy>by+5)&(yy<by+10)&(xx<bx+12)&(xx>bx-9),(205,147,66),.65)
 elif sp=='frostfox':
  paint((rgb.max(2)-rgb.min(2)>12)&(xx>tx+5),(130,157,178),.85)
  paint((xx<tx+7)&(yy<ty+6),(222,243,249),.97)
 elif sp=='starwolf':
  paint(lum<210,(65,83,125),.78)
  # A fur-shaped star ON the shoulder, not a mark floating above the animal.
  sx,sy=bx+1,by+4
  mark=((abs(xx-sx)+abs(yy-sy)<5)&((abs(xx-sx)<2)|(abs(yy-sy)<2)))
  paint(mark,(243,226,171))
 elif sp=='liondog':
  # Grow the mane from the original neck-fur pixels. Palette is sampled from golden hound.
  paint((((xx-(nx+1))/14)**2+((yy-(ny-7))/15)**2<1)&(xx<hx+3),(191,118,44),.85)
 elif sp=='lanterncat':
  paint((xx<tx+4)&(yy<ty+6),(255,211,111),.9)
 im=Image.fromarray(a)
 # Faithful parent patches follow the relevant moving anchor in every action frame.
 if sp in ('lanterncat','honeybear'):
  src,sa=parent('fox_v3' if sp=='lanterncat' else 'raccoon_v3',act,fi)
  sx,sy=sa['tail'];patch=src.crop((max(0,sx-8),max(0,sy-10),sx+5,sy+7))
  if sp=='lanterncat':
   patch=patch.resize((18,23),Image.Resampling.NEAREST)
   ar=np.array(patch);m=(ar[:,:,3]>0)&(ar[:,:,:3].mean(2)>70); ar[m,:3]=np.minimum(255,ar[m,:3]*np.array([1.4,1.2,.72])).astype('uint8');patch=Image.fromarray(ar)
  if sp=='honeybear':patch=patch.resize((19,25),Image.Resampling.NEAREST)
  im.alpha_composite(patch,(max(0,tx-patch.width//2),max(0,ty-patch.height//2)))
 elif sp=='featherbun':
  src,sa=parent('owl_v3','idle',0)
  # Wingtip cut from original owl (no beak/feet); two attached feather clusters.
  feather=src.crop((6,8,19,24)).resize((7,10),Image.Resampling.NEAREST)
  im.alpha_composite(feather,(max(0,hx-7),max(0,hy+5)))
  im.alpha_composite(feather.transpose(Image.Transpose.FLIP_LEFT_RIGHT),(min(w-7,hx+3),max(0,hy+7)))
 elif sp=='puffdog':
  src,sa=parent('shihtzu_v3','idle',0)
  # Existing drooping ear fringe, kept below the eyes and rooted in the cheeks.
  fringe=src.crop((24,22,32,36)).resize((8,14),Image.Resampling.NEAREST)
  mask=Image.new('L',fringe.size);ImageDraw.Draw(mask).polygon([(3,0),(7,1),(7,12),(5,13),(2,11),(0,7),(0,3)],fill=255);fringe.putalpha(Image.fromarray(np.minimum(np.array(fringe.getchannel('A')),np.array(mask))))
  im.alpha_composite(fringe,(max(0,hx-10),max(0,hy+5)))
 elif sp=='liondog':
  src,sa=parent('pomeranian_v3','idle',0)
  ruff=src.crop((22,30,30,43));ar=np.array(ruff);m=(ar[:,:,3]>0)&(ar[:,:,:3].mean(2)>60);ar[m,:3]=np.clip(ar[m,:3]*np.array([1.1,.75,.4]),0,255).astype('uint8');ruff=Image.fromarray(ar)
  mask=Image.new('L',ruff.size);ImageDraw.Draw(mask).polygon([(3,0),(7,0),(7,10),(5,12),(3,11),(0,6),(0,3)],fill=255);ruff.putalpha(Image.fromarray(np.minimum(np.array(ruff.getchannel('A')),np.array(mask))))
  im.alpha_composite(ruff,(max(0,nx-12),max(0,ny-13)))
 return im
manifest={}; portraits={};records=[]
for sp,name,base,mix,trait in SPECS:
 p=AS/'pets'/base;j=json.loads((p/'anchors.json').read_text());w,h=j['canvas'];new=json.loads(json.dumps(j));new['noAccessories']=True;new['source_parent']=base;new['hybrid_trait']=trait
 # Look indices follow P5.2's corrected named coat ordering, NOT combat rank.
 order=['adult','blue','purple','pink']
 if base in ('hound_v3','bear_v3'):order=['adult','pink','purple','blue'] if base=='hound_v3' else ['adult','blue','purple','pink']
 new['tiers']={k:{'fur':'look'+str(min(i,3))} for i,k in enumerate(['adult','blue','purple','pink','orange'])}
 idle={}
 for look,key in enumerate(order):
  fur=j['tiers'][key]['fur']
  for act,ans in j['anchors'].items():
   sheet=Image.open(p/f'body_{fur}_{act}.png').convert('RGBA');dest=Image.new('RGBA',(w*len(ans),h))
   for f,an in enumerate(ans):
    frame=derive(sp,sheet.crop((f*w,0,(f+1)*w,h)),an,act,f);dest.alpha_composite(frame,(f*w,0))
    if act=='idle' and f==0:idle[look]=frame
   save(dest,AS/'pets'/('hybrid_'+sp)/f'body_look{look}_{act}.png')
  # Portrait: exact full silhouette crop includes inherited tail/ear/shoulder trait.
  frame=idle[look];bb=frame.getbbox();crop=frame.crop(bb);scale=min(84/crop.width,82/crop.height);crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.NEAREST)
  por=Image.new('RGBA',(96,96));d=ImageDraw.Draw(por);d.rounded_rectangle((0,0,95,95),radius=12,fill='#1a1016');d.rounded_rectangle((3,3,92,92),radius=10,fill='#55463c');por.alpha_composite(crop,((96-crop.width)//2,89-crop.height));save(por,AS/'portraits'/f'{sp}_{look}.png')
  portraits.setdefault(sp,{})[str(look)]={'f':f'{sp}_{look}.png','name':name}
 q=AS/'pets'/('hybrid_'+sp)/'anchors.json';backup(q);q.write_text(json.dumps(new,ensure_ascii=False,indent=1));manifest['hybrid_'+sp]=new
 records.append({'id':sp,'name':name,'parents':mix,'base':base,'trait':trait,'portrait':f'assets/portraits/{sp}_0.png','sprites':f'assets/pets/hybrid_{sp}/body_look0_*.png'})
p=AS/'pets'/'hybrids_p53.js';backup(p);p.write_text('// P5.3 derived hybrid sets and exact-match portrait crops\nObject.assign(window.PET_ART_MANIFEST,'+json.dumps(manifest,ensure_ascii=False)+');\nObject.assign(window.PET_PORTRAITS,'+json.dumps(portraits,ensure_ascii=False)+');\n')
(OUT/'hybrid_assets.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
# Preview sheet: all eight exact portraits and world idle sprites.
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';F=ImageFont.truetype(fontpath,24);small=ImageFont.truetype(fontpath,18)
board=Image.new('RGB',(1200,1160),'#302830');d=ImageDraw.Draw(board);d.text((25,14),'蜜糖之家 P5.3｜混種頭像 × 場上小人（預設毛色）',font=F,fill='#ffe1a3')
for i,r in enumerate(records):
 x=20+(i%2)*600;y=70+(i//2)*270;d.rounded_rectangle((x,y,x+575,y+250),12,fill='#44383c');d.text((x+15,y+10),r['name']+' · '+r['trait'],font=F,fill='#ffe1a3');d.text((x+15,y+45),r['parents'],font=small,fill='#dfcdb6')
 por=Image.open(ROOT/r['portrait']).resize((168,168),Image.Resampling.NEAREST);board.paste(por,(x+18,y+76),por)
 j=manifest['hybrid_'+r['id']];w,h=j['canvas'];fr=Image.open(AS/'pets'/('hybrid_'+r['id'])/'body_look0_idle.png').crop((0,0,w,h));k=min(2.6,170/h);fr=fr.resize((round(w*k),round(h*k)),Image.Resampling.NEAREST);board.paste(fr,(x+250,y+245-fr.height),fr)
 d.text((x+438,y+128),'頭像與小人\n同源像素\n身體特徵\n沒有頭頂符號',font=small,fill='#dfcdb6',spacing=6)
board.save(OUT/'hybrid_portrait_vs_sprite.png');print('Generated eight hybrids, four looks, nine actions. Backup:',BACK)
