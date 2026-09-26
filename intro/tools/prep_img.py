from PIL import Image, ImageFilter
import os
S='shots'; O='out/intro'; R='classroom-games'
plan={
 'mango':['mango-0.png','mango-1.png',R+'/mango/img/scene-02-board.webp'],
 'mitgeurim':['mitgeurim-0.png','mitgeurim-1.png'],
 'myungyun':['myungyun-0.png','myungyun-1.png'],
 'sky1945':['sky1945-0.png','sky1945-1.png'],
 'puzzle25':['puzzle25-0.png','puzzle25-1.png','puzzle25-2.png'],
 'hangul':['hangul-1.png','hangul-2.png'],
 'lumenfall':['lumenfall-0.png','lumenfall-1.png','lumenfall-2.png'],
 'lanternfall':['lanternfall-0.png','lanternfall-2.png','lanternfall-3.png','lanternfall-1.png'],
 'foglamp':['foglamp-0.png','foglamp-2.png','foglamp/img/s-06-bar-front.webp'],
}
for slug,fs in plan.items():
  d=f'{O}/{slug}'; os.makedirs(d,exist_ok=True)
  for i,f in enumerate(fs):
    p=(f if f.startswith(R) else f) if '/' in f else f'{S}/{f}'
    im=Image.open(p).convert('RGB')
    maxw=1400 if im.width>im.height else 640
    if im.width>maxw: im=im.resize((maxw,round(im.height*maxw/im.width)),Image.LANCZOS)
    im.save(f'{d}/shot{i}.webp','WEBP',quality=80)
    print(slug,i,im.size,os.path.getsize(f'{d}/shot{i}.webp')//1024,'KB')
  # og 1200x630
  im=Image.open(fs[0] if '/' in fs[0] else f'{S}/{fs[0]}').convert('RGB')
  bg=im.resize((1200,round(im.height*1200/im.width))).crop((0,0,1200,630)) if im.width>im.height else im.resize((1200,round(im.height*1200/im.width)))
  bg=bg.crop((0,max(0,(bg.height-630)//2),1200,max(0,(bg.height-630)//2)+630)).filter(ImageFilter.GaussianBlur(28 if im.width<im.height else 0))
  if im.width<im.height:
    dark=Image.new('RGB',(1200,630),'#17153a'); bg=Image.blend(bg,dark,.45)
    fg=im.resize((round(im.width*590/im.height),590),Image.LANCZOS); bg.paste(fg,((1200-fg.width)//2,20))
  else:
    r=im.resize((1200,round(im.height*1200/im.width)),Image.LANCZOS); t=(r.height-630)//2; bg=r.crop((0,t,1200,t+630))
  bg.save(f'{d}/og.jpg','JPEG',quality=85)
