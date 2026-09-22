/* 탐정 망고 · 게임 엔진
   사건 내용은 이 파일에 없다. data/case-NN.json 을 읽어 그대로 해석한다.
   사건을 추가할 때 이 파일을 건드리지 않는 것이 목표다. */
import {A, wake, setMood, setMusic, setSfx, startMusic, beep,
        blip, buzz, sTap, sFind, sGood, sBad, sFan, sNo, sHot, sPage, sStamp, sSting} from './audio.js?v=2609221554';
import * as Save from './save.js?v=2609221554';

var C=null;   // 현재 사건 데이터
var BIGPREF=false;   // 「크게 보기」를 지난번에 켜 두었는지

/* ================= 그림 자산 ================= */
/* data/case-NN.json 이 img 이름을 적으면 img/ 에서 찾아 쓰고,
   파일이 없으면 지금 쓰는 SVG 그림으로 그대로 돌아간다. 그림을 나중에 넣어도 코드는 그대로. */
var ART={};                                   // 경로 -> true(있음) / false(없음)
/* 그림 주소에도 판 번호를 붙인다. 예전에는 ?v=1 로 고정이라, 그림을 고쳐 올려도
   한 번이라도 본 기기는 옛 그림을 영영 들고 있었다(탑 2층의 제미나이 별이 그랬다).
   stamp.py 가 올리기 직전에 이 줄을 갱신한다. */
var ARTV='2609221554';
function artURL(f){return 'img/'+f+'?v='+ARTV}
function artOK(f){return !!(f&&ART[f])}
function probe(f){return new Promise(function(done){
  if(!f||f in ART)return done();
  var im=new Image();
  im.onload=function(){ART[f]=true;done()};
  im.onerror=function(){ART[f]=false;done()};
  im.src=artURL(f);
})}
/* 사건 파일이 선언한 그림을 한 번에 확인한다. 없는 건 조용히 넘어간다. */
function probeCaseArt(){
  var list=['mango-full.png','cork.png'];
  MANGO.forEach(function(e){list.push('mango-'+e+'.png');list.push('mango-face-'+e+'.png')});
  if(C.coverImg)list.push(C.coverImg);
  if(C.sceneImg)list.push(C.sceneImg);
  /* 현장이 여럿인 사건은 현장마다 배경이 다르다. 여기에 안 넣었더니
     사건 3의 탑 2층이 빈 화면으로 떴다 — 그림이 없는 줄 알고 넘어간 것이다. */
  (C.scenes||[]).forEach(function(sc){if(sc.img)list.push(sc.img)});
  if(C.solve&&C.solve.bg)list.push(C.solve.bg);
  /* 인트로는 사건마다 다른 그림을 쓸 수 있다 — 사건 파일이 부르는 배경도 미리 확인한다 */
  if(C.introBg)list.push(C.introBg);
  ((C.board&&C.board.pins)||[]).forEach(function(p){if(p.img)list.push(p.img)});
  (C.intro||[]).forEach(function(pg){if(pg.bg)list.push(pg.bg)});
  C.suspectOrder.forEach(function(id){
    var s=C.suspects[id];if(!s.img)return;
    /* 시트에서 분노 칸을 뺐다. 'ang' 을 남기면 없는 파일을 인물마다 두드린다. */ ['def','fl','sp'].forEach(function(e){list.push(s.img+'-'+e+'.png')});
  });
  /* 의뢰인은 용의자 목록에 없어서 위 반복문이 지나친다. 따로 넣어야 그림이 뜬다. */
  if(C.brief&&C.brief.sym)list.push(C.brief.sym+'-def.png');
  Object.keys(C.clues).forEach(function(k){
    if(C.clues[k].iconImg)list.push(C.clues[k].iconImg);
    if(C.clues[k].photo)list.push(C.clues[k].photo);
  });
  /* 재현 장면의 인물·배경도 미리 확인한다. 그림이 아직 없는 사건(사건 4를 만드는 동안)에서
     깨진 그림 아이콘이 뜨지 않게 — 없는 건 그냥 안 그린다. */
  (((C.replay||{}).cuts)||[]).forEach(function(cut){
    if(cut.bg)list.push(cut.bg);
    (cut.figs||[]).forEach(function(f){if(f.img)list.push(f.img)});
  });
  if(C.replay&&C.replay.bg)list.push(C.replay.bg);
  return Promise.all(list.map(probe));
}
/* 표정 파일이 없으면 기본 표정으로, 그것도 없으면 SVG 로 */
function faceFile(s,ex){
  if(!s.img)return null;
  var f=s.img+'-'+(ex||'def')+'.png';
  if(artOK(f))return f;
  f=s.img+'-def.png';
  return artOK(f)?f:null;
}
/* 망고는 사건 데이터가 아니라 게임의 주인공이라, 파일명을 고정으로 둔다. */
var MANGO=['def','sp','fl','joy'];
function mangoFile(ex,kind){
  var p=(kind==='face')?'mango-face-':'mango-';
  var f=p+(ex||'def')+'.png';
  if(artOK(f))return f;
  f=p+'def.png';
  return artOK(f)?f:null;
}
/* 작은 망고 얼굴(머리만 잘라 둔 그림) — 없으면 아무것도 넣지 않는다. */
function mface(ex){
  var f=mangoFile(ex,'face');
  return f?'<img class="mface" src="'+artURL(f)+'" alt="망고">':'';
}
function clueIcon(c,got){
  if(got&&artOK(c.iconImg))return '<img class="cicon" src="'+artURL(c.iconImg)+'" alt="">';
  return '<svg viewBox="0 0 28 28"><use href="'+(got?c.icon:'#i-lock')+'"></use></svg>';
}
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};

/* ---- 타자기 연출: 글자가 한 자씩 나타나며 말소리 ---- */
var typers=[];
function typeHTML(el,html,voice,done,speed){
  if(!el)return;cancelTyper(el);
  var i=0,out='',n=0,live=true,t={el:el};
  // 글자가 늘어나도 아래 버튼이 밀리지 않도록 최종 높이를 미리 잡아 둔다
  try{el.style.minHeight='';el.innerHTML=html;var _h=el.offsetHeight;if(_h)el.style.minHeight=_h+'px';el.innerHTML=''}catch(e){}
  var talker=voice&&voice!=='narr'?el.closest('.right, .full')&&document.querySelector('.portrait'):null;
  if(talker&&S.mode==='talk')talker.classList.add('talking');
  function finish(instant){if(!live)return;live=false;clearTimeout(t.timer);el.innerHTML=html;typers=typers.filter(function(x){return x!==t});
    if(talker)talker.classList.remove('talking');if(done)done(instant)}
  t.finish=finish;typers.push(t);
  var ms=speed||(voice?26:12);
  function step(){
    if(!live)return;
    var budget=1;
    while(budget>0&&i<html.length){
      var ch=html[i];
      if(ch==='<'){var j=html.indexOf('>',i);out+=html.slice(i,j+1);i=j+1;continue}
      if(ch==='&'){var k=html.indexOf(';',i);out+=html.slice(i,k+1);i=k+1;budget--;continue}
      out+=ch;i++;budget--;n++;
      if(voice&&/[가-힣a-zA-Z0-9]/.test(ch)&&n%2===0)blip(voice,ch);
    }
    el.innerHTML=out+(i<html.length?'<span class="cursor"></span>':'');
    if(voice&&S.mode!=='logic'){var sc=el.closest('#rscroll,.txt');if(sc)sc.scrollTop=sc.scrollHeight}
    var pause=/[.!?…,」"]/.test(html[i-1])?ms*6:ms;
    if(i<html.length)t.timer=setTimeout(step,pause);else finish(false);
  }
  step();return t;
}
function cancelTyper(el){typers.slice().forEach(function(t){if(!el||t.el===el)t.finish(true)})}
function skipTypers(){if(typers.length){typers.slice().forEach(function(t){t.finish(true)});return true}return false}
document.addEventListener('pointerdown',function(e){ // 아무 곳이나 누르면 대사가 바로 끝까지 나옴
  /* 인트로는 스스로 처리한다 — 여기서 먼저 끝내 버리면 한 번 눌러 글도 끝나고 장도 넘어간다 */
  if(typers.length&&!e.target.closest('.tab,.act,.snd,#t-sound,#t-music,#t-home,#t-full,#s-intro,#mini'))skipTypers();
},true);


/* ================= 상태 =================
   사건 데이터(C)는 고정, S 는 한 판의 진행 상황이다. S 만 저장한다. */
var S;
function fresh(){
  S={screen:'title',mode:'scene',easy:null,lamps:3,found:{},flags:{},tab:C.suspectOrder[0],sel:null,
  lens:{x:360,y:180},hot:null,active:null,tsel:null,rebutErr:0,newNotes:0,idle:null,
  phase:'chain',open:null,tries:0,elimTries:0,wrongSet:null,lastWrong:null,accErr:0,rep:[],repTries:0,
  steps:C.steps.map(function(){return {clues:[],opt:null}}),elim:{},_eyes:{},
  scene:sceneList()[0].id,big:BIGPREF,slot:null};
  resetFaces();
}

/* ================= 현장이 여럿일 때 =================
   사건 파일이 C.scenes 를 선언하면 현장이 여러 곳이 된다(사건 3의 광장 → 탑 2층).
   선언하지 않은 사건은 예전처럼 현장 하나로 돈다 — 사건 1·2는 손대지 않아도 그대로다.
   scene.need 에 적힌 단서를 다 얻어야 그 현장이 열린다. */
function sceneList(){
  if(C.scenes&&C.scenes.length)return C.scenes;
  return [{id:'_one',label:'현장',img:C.sceneImg,svg:C.sceneSvg,overlay:C.sceneOverlay,memo:C.memo,spots:C.spots||[]}];
}
function curScene(){
  var L=sceneList(),f=L[0];
  L.forEach(function(s){if(s.id===S.scene)f=s});
  if(!sceneOpen(f))f=L[0];
  return f;
}
function sceneOpen(sc){return (sc.need||[]).every(function(id){return S.found[id]})}
function spots(){return curScene().spots||[]}
/* 현장이 새로 열렸는지 본다 — 열렸으면 그 현장 id 를 돌려준다(알려 주기 위해) */
function newlyOpen(before){
  var got=null;
  sceneList().forEach(function(sc){
    if(sc.need&&sc.need.length&&!before[sc.id]&&sceneOpen(sc))got=sc;
  });
  return got;
}
function openMap(){var m={};sceneList().forEach(function(sc){m[sc.id]=sceneOpen(sc)});return m}
function resetFaces(){C.suspectOrder.forEach(function(id){var x=C.suspects[id];if(x.sym==='rc')x.eyes='def'})}

/* 설정은 한 칸에 모여 있다. 통째로 덮어쓰면 소리 설정이 날아가므로 항상 합쳐서 저장한다. */
function putPref(patch){try{var p=Save.loadPrefs()||{};Object.keys(patch).forEach(function(k){p[k]=patch[k]});Save.savePrefs(p)}catch(e){}}

var toastT;function toast(m){var el=$('#toast');el.textContent=m;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2000)}

/* ================= 화면 전환 ================= */
function show(id){
  ['s-title','s-cases','s-intro','s-brief','s-solve','s-board'].forEach(function(s){$('#'+s).hidden=(s!==id)});
  var inv=(id==='invest');
  $('#bar').hidden=!inv;$('#bodyx').hidden=!inv;$('#foot').hidden=!inv;
  S.screen=id;
  cancelTyper();
  if(id==='s-title'||id==='s-cases'||id==='s-intro'||id==='s-brief')setMood('calm');
  else if(id==='s-solve'||id==='s-board')setMood('resolve');
  if(id==='s-solve'||id==='s-board')Save.clear();     // 사건을 끝냈으면 이어하기는 지운다
  else touch();
}
/* 전체 화면은 자동으로 켜지 않는다.
   크롬이 「전체 화면을 종료하려면…」 안내를 띄우는데, 게임 중에 뜨면 하단 버튼을 가린다.
   그래서 표지의 버튼으로만 켠다 — 안내가 표지 위에 떠서 아무것도 막지 않는다. */
function fullOn(){
  try{var el=document.documentElement;
    var p=(el.requestFullscreen||el.webkitRequestFullscreen);
    if(!p)return false;
    var r=p.call(el);
    if(r&&r.then)r.then(function(){try{screen.orientation.lock('landscape').catch(function(){})}catch(e){}}).catch(function(){});
    return true;
  }catch(e){return false}
}
function fullOff(){
  try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}
}
function isFull(){return !!(document.fullscreenElement||document.webkitFullscreenElement)}
/* 홈 화면에 추가해서 연 상태인가 (아이폰은 navigator.standalone) */
/* 「홈 화면에 추가」 안내는 폰에서만 뜻이 있다. PC 에 할 말이 아니다. */
function androidish(){try{return /Android/i.test(navigator.userAgent||'')}catch(e){return false}}
var TIP_IOS='아이폰은 <b>공유 → 홈 화면에 추가</b>로 열면 주소창 없이 꽉 차요';
var TIP_AND='<b>홈 화면에 추가</b>해 두면(⋮ 메뉴) 다음부터 이 단추를 누르지 않아도 꽉 찬 화면으로 열려요';
function standalone(){
  try{return window.navigator.standalone===true||window.matchMedia('(display-mode: standalone)').matches
        ||window.matchMedia('(display-mode: fullscreen)').matches}catch(e){return false}
}
function syncFullUI(){
  var can=!!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
  var icon=isFull()?'#i-collapse':'#i-expand';
  var b=$('#tg-full'),t=$('#full-tip');
  if(b){
    b.hidden=!can;
    /* 전체 화면은 켜고 끄는 상태가 아니라 동작이다. aria-pressed 를 주면
       .snd 규칙이 「눌리지 않음」으로 보고 흐리게+취소선을 그어, 못 쓰는 버튼처럼 보인다. */
    b.innerHTML='<svg class="bi" viewBox="0 0 28 28"><use href="'+icon+'"></use></svg> '+(isFull()?'전체 화면 끄기':'전체 화면');
  }
  if(t)t.hidden=!can||isFull();
  /* 아이폰 사파리에는 전체 화면 기능 자체가 없다(아이패드엔 있다). 단추만 숨기면
     아무 안내도 없이 사라지므로, 대신 「홈 화면에 추가」를 알려 준다.
     이미 홈 화면에서 연 상태면 주소창이 없으니 안내하지 않는다. */
  var hm=$('#home-tip');
  if(hm){
    /* 아이폰: 전체 화면 기능이 없으니 대신 설치를 알려 준다.
       안드로이드: 단추가 있으니 평소엔 조용히 있다가, 전체 화면을 켜서 위 안내가
       비워진 자리에만 「매번 안 눌러도 된다」를 알려 준다 — 줄이 늘지 않는다.
       이미 홈 화면에서 연 상태면 둘 다 필요 없다. */
    var txt=null;
    if(standalone())txt=null;
    else if(!can)txt=TIP_IOS;
    else if(isFull()&&androidish())txt=TIP_AND;
    hm.hidden=!txt;
    if(txt&&hm.innerHTML!==txt)hm.innerHTML=txt;
  }
  /* 위쪽 띠의 것 — 표지를 지나 들어온 뒤에도 언제든 켜고 끌 수 있어야 한다. */
  var c=$('#t-full');
  if(c){
    c.hidden=!can;
    c.title=isFull()?'전체 화면 끄기':'전체 화면';
    c.innerHTML='<svg class="bi" viewBox="0 0 28 28"><use href="'+icon+'"></use></svg>';
  }
}
/* 표지로 되돌아가기. show() 는 S.screen 을 먼저 바꾸므로 그 전에 저장해야
   「이어서 하기」에 지금까지 한 것이 남는다. */
function toTitle(){touch();show('s-title');refreshTitle()}

/* ================= 분석 미니게임 (CASE-4) =================
   시간제한도 실패도 없다. 걸린 시간과 시도 횟수는 별점에만 반영한다(결정 4).
   사건 파일이 현장 지점에 mini:"jigsaw" 를 선언하면 「조사하기」가 이 오버레이를 연다.
   맞추면 그 지점의 단서를 얻는다 — 퍼즐이 곧 단서다. */
var MINI={on:false,give:null,t0:0,moves:0,done:0,total:0,kind:null};

function openMini(sp){
  var c=C.clues[sp.id];
  MINI={on:true,give:sp.id,t0:Date.now(),moves:0,done:0,total:0,kind:sp.mini};
  $('#mini-title').textContent=(sp.miniTitle||c.n);
  $('#mini-tip').innerHTML=sp.miniTip||'조각을 끌어다 자리에 맞추세요. 가까이 가면 저절로 붙어요.';
  $('#mini-hint').textContent={lock:'힌트 보기',shadow:'힌트 보기'}[sp.mini]||'한 조각 놓아 주기';
  var mb=document.querySelector('#mini .mg-box');
  if(mb)mb.classList.toggle('tall',sp.mini==='lock'||sp.mini==='shadow');
  $('#mini').hidden=false;
  if(sp.mini==='jigsaw')jigsaw(sp);
  else if(sp.mini==='lock')lockPad(sp);
  else if(sp.mini==='shadow')shadowDial(sp);
  updateAct();
}
function closeMini(){
  MINI.on=false;$('#mini').hidden=true;$('#mini-stage').innerHTML='';
  cancelAnimationFrame(MINI.raf);updateAct();
}
function miniWin(){
  var sec=Math.round((Date.now()-MINI.t0)/1000);
  S.mini=S.mini||{};S.mini[MINI.give]={sec:sec,moves:MINI.moves};
  sFan();
  var id=MINI.give;
  setTimeout(function(){
    closeMini();
    var sp=null;spots().forEach(function(x){if(x.id===id)sp=x});
    finishInspect(sp,addClue(id));
    toast('다 맞췄어요 · '+sec+'초');
  },900);
}

/* ---- 번호 자물쇠 ----
   sp.code = "1897"(탑이 세워진 해). 틀려도 벌점이 없다 — 찍어서 맞히는 게임이 아니라
   단서를 읽었는지 확인하는 자리다. 그래서 「몇 자리가 맞았다」는 알려 주지 않는다.
   자리마다 ▲▼ 로 숫자를 돌린다(손가락으로 되는 크기). */
function lockPad(sp){
  var code=String(sp.code||'0000'),n=code.length;
  MINI.total=n;MINI.dig=[];for(var i=0;i<n;i++)MINI.dig.push(0);
  var h='<div class="lockbox"><div class="lockrow" id="lockrow">';
  for(var k=0;k<n;k++)
    h+='<div class="dig"><button class="dbtn" data-d="'+k+'" data-v="1" aria-label="올리기">▲</button>'+
       '<div class="dnum" id="dn-'+k+'">0</div>'+
       '<button class="dbtn" data-d="'+k+'" data-v="-1" aria-label="내리기">▼</button></div>';
  h+='</div><button class="btn warm" id="lock-try">돌려 보기</button>'+
     '<p class="lockmsg" id="lock-msg">자물쇠는 차갑고 단단해요.</p></div>';
  $('#mini-stage').innerHTML=h;
  $('#mini-stage').querySelectorAll('[data-d]').forEach(function(b){
    b.addEventListener('click',function(){
      var d=+b.dataset.d;MINI.dig[d]=(MINI.dig[d]+ +b.dataset.v+10)%10;MINI.moves++;
      document.getElementById('dn-'+d).textContent=MINI.dig[d];sTap();
    });
  });
  $('#lock-try').addEventListener('click',function(){
    var got=MINI.dig.join('');MINI.moves++;
    var msg=document.getElementById('lock-msg');
    if(got===code){msg.textContent='철컥. 고리가 벗겨졌어요!';sFan();miniWin()}
    else{sBad();msg.textContent='꿈쩍도 하지 않아요. 번호를 정한 방법을 다시 떠올려 볼까요?'}
  });
}
function lockHint(){
  var msg=document.getElementById('lock-msg');if(!msg)return;
  MINI.hinted=(MINI.hinted||0)+1;MINI.moves+=3;
  msg.innerHTML='문자판에서 <b>떨어진 숫자</b>가 몇이었는지, 그리고 일지에 적힌 <b>떨어진 날짜 순서</b>를 보세요.';
}

/* ---- 그림자 도구 ----
   바늘(시각)을 돌리면 빛과 그림자가 움직인다. 두 가지 무대를 데이터로 받는다.
     mode "wall"   : 창으로 든 빛이 벽을 지나간다. 정답 시각에 긁힌 글자가 읽힌다.
     mode "square" : 광장 모형에서 느티나무 그림자 끝이 움직인다. 정답 시각에 우물에 닿는다.
   다이얼이 일출 뒤부터 시작하는 것 자체가 「해 뜨기 전엔 그림자가 없다」를 손으로 가르친다. */
function mins(t){var a=String(t).split(':');return (+a[0])*60+(+a[1])}
function hhmm(m){var h=Math.floor(m/60),x=m%60;return h+'시 '+(x<10?'0':'')+x+'분'}
function shadowDial(sp){
  var S0=sp.shadow||{},f=mins(S0.from||'6:00'),t=mins(S0.to||'8:00'),st=S0.step||5;
  MINI.sh=S0;MINI.f=f;MINI.t=t;MINI.st=st;MINI.ans=mins(S0.answer);
  MINI.now=f;MINI.total=1;
  var h='<div class="shbox"><div class="shstage" id="shstage"></div>'+
    '<div class="shctl"><button class="dbtn" id="sh-b">◀</button>'+
    '<input type="range" id="sh-r" min="'+f+'" max="'+t+'" step="'+st+'" value="'+f+'" aria-label="시각">'+
    '<button class="dbtn" id="sh-f">▶</button>'+
    '<div class="shtime" id="sh-t"></div></div>'+
    '<p class="lockmsg" id="sh-msg">'+(S0.pre||'')+'</p></div>';
  $('#mini-stage').innerHTML=h;
  var r=$('#sh-r');
  function set(v){
    v=Math.max(f,Math.min(t,Math.round(v/st)*st));
    if(v!==MINI.now)MINI.moves++;
    MINI.now=v;r.value=v;shadowDraw();
  }
  r.addEventListener('input',function(){set(+r.value)});
  $('#sh-b').addEventListener('click',function(){sTap();set(MINI.now-st)});
  $('#sh-f').addEventListener('click',function(){sTap();set(MINI.now+st)});
  shadowDraw();
}
/* 시각 → 0(가장 이름) ~ 1(가장 늦음) */
function shPos(){return (MINI.now-MINI.f)/Math.max(1,(MINI.t-MINI.f))}
function shadowDraw(){
  var S0=MINI.sh,p=shPos(),hit=(MINI.now===MINI.ans);
  var el=document.getElementById('shstage');if(!el)return;
  el.innerHTML=(S0.mode==='square')?shSquare(p,hit,S0):shWall(p,hit,S0);
  var tl=document.getElementById('sh-t');
  if(tl)tl.innerHTML='<b>'+hhmm(MINI.now)+'</b>';
  var msg=document.getElementById('sh-msg');
  if(msg){
    if(hit&&S0.mode==='wall')msg.innerHTML='글자가 <b>읽혀요</b> — 「'+esc(S0.reveal||'')+'」';
    else if(hit)msg.innerHTML='그림자 끝이 <b>우물</b>에 닿았어요. 콩순이 그림과 똑같아요.';
    else{
      var m=null;(S0.marks||[]).forEach(function(k){if(mins(k.at)===MINI.now)m=k});
      msg.innerHTML=m?('그림자 끝이 <b>'+esc(m.t)+'</b>에 있어요.'):(S0.mode==='wall'?'빛은 벽을 천천히 지나가요.':'그림자 끝을 잘 보세요.');
    }
  }
  if(hit&&!MINI.won){MINI.won=true;sFan();setTimeout(miniWin,700)}
}
/* 벽 무대 — 창으로 든 빛덩이가 해가 오를수록 벽 위에서 아래로 내려온다 */
function shWall(p,hit,S0){
  /* 정답 시각에 빛덩이 한가운데가 글자 줄에 오도록 맞춰 둔다 */
  var pa=(MINI.ans-MINI.f)/Math.max(1,(MINI.t-MINI.f));
  var y=92+(p-pa)*180, letters=S0.reveal||'';
  var g='<svg viewBox="0 0 520 260" class="shsvg">';
  g+='<rect width="520" height="260" fill="#39322b"/>';
  for(var r=0;r<5;r++)for(var c=0;c<6;c++)
    g+='<rect x="'+(8+c*86)+'" y="'+(8+r*50)+'" width="80" height="44" rx="3" fill="#4a4139" stroke="#2e2822" stroke-width="2"/>';
  /* 긁어 둔 글자 자리 */
  g+='<text x="260" y="128" text-anchor="middle" font-size="22" font-family="Gaegu" fill="'+(hit?'#ffe9a8':'#4e463d')+'" opacity="'+(hit?1:.5)+'">'+esc(letters)+'</text>';
  /* 빛덩이 */
  g+='<g opacity="'+(hit?.95:.7)+'"><polygon points="120,'+y+' 400,'+(y-18)+' 400,'+(y+52)+' 120,'+(y+66)+'" fill="#ffd98a" opacity="'+(hit?.5:.35)+'"/></g>';
  if(hit)g+='<rect x="100" y="96" width="320" height="52" rx="8" fill="none" stroke="#ffd98a" stroke-width="3"/>';
  g+='</svg>';return g;
}
/* 광장 모형 — **위에서 내려다본 평면도**로 그린다.
   회화 배경을 깔면 그림 안에 이미 해가 그려 준 그림자가 박혀 있어 앞뒤가 안 맞는다.
   평면도에는 빛이 없으니 그림자를 얹어도 모순이 없고, 길이를 재기에도 평면도가 맞다.
   그림자 끝의 자리는 **데이터의 marks 를 그대로 따라간다** — 「7시 10분에 우물」이라고
   써 놓고 그림에서는 딴 데를 가리키면 안 되니까, 시각→자리를 marks 로 보간한다. */
var SQ_STATION=[126,286,446,606];   /* 탑 · 벤치 · 우물 · 느티나무 (평면도 기준) */
var SQ_LABEL=['시계탑','벤치','우물','느티나무'];
var SQ_Y=176;
function sqTip(S0){
  var mk=(S0.marks||[]).map(function(m,i){return {t:mins(m.at),x:SQ_STATION[i]!=null?SQ_STATION[i]:446}});
  if(!mk.length)return 446;
  if(MINI.now<=mk[0].t)return Math.max(58,mk[0].x-(mk[0].t-MINI.now)*2.2);
  for(var i=0;i<mk.length-1;i++){
    if(MINI.now<=mk[i+1].t){
      var f=(MINI.now-mk[i].t)/(mk[i+1].t-mk[i].t);
      return mk[i].x+(mk[i+1].x-mk[i].x)*f;
    }
  }
  var L=mk[mk.length-1];return Math.min(578,L.x+(MINI.now-L.t)*1.4);
}
function shSquare(p,hit,S0){
  var TREE=SQ_STATION[3], tip=sqTip(S0), y=SQ_Y;
  var g='<svg viewBox="0 0 720 300" class="shsvg">';
  g+='<rect width="720" height="300" fill="#efe6d3"/>';
  /* 자갈 바닥 결 — 평면도라는 느낌만 주는 옅은 격자 */
  g+='<g stroke="#ded1b6" stroke-width="1.5">';
  for(var x=20;x<720;x+=34)g+='<line x1="'+x+'" y1="96" x2="'+x+'" y2="252"/>';
  for(var yy=96;yy<=252;yy+=26)g+='<line x1="20" y1="'+yy+'" x2="700" y2="'+yy+'"/>';
  g+='</g>';
  g+='<text x="28" y="40" font-family="Gaegu" font-size="19" fill="#5b5040">광장 평면도 — 위에서 본 모습</text>';
  /* 해와 빛의 방향 */
  g+='<g><circle cx="676" cy="42" r="15" fill="#f0c35a" stroke="#4a3428" stroke-width="2"/>'+
     '<text x="676" y="76" font-family="Gaegu" font-size="14" text-anchor="middle" fill="#5b5040">해</text>'+
     '<path d="M648 42 h-64" stroke="#c9924a" stroke-width="3" stroke-dasharray="7 5"/>'+
     '<path d="M584 42 l10 -6 v12 z" fill="#c9924a"/>'+
     '<text x="560" y="36" font-family="Gaegu" font-size="14" text-anchor="end" fill="#a4813f">그림자는 이쪽으로</text></g>';
  /* 그림자 — 나무에서 왼쪽으로 */
  g+='<polygon points="'+TREE+','+(y+34)+' '+TREE+','+(y-34)+' '+tip+','+(y-15)+' '+tip+','+(y+15)+'" '+
     'fill="#8e836c" opacity="'+(hit?.85:.6)+'"/>';
  /* 표시물 (위에서 본 모습) */
  g+='<g stroke="#4a3428" stroke-width="2.5">';
  g+='<rect x="'+(SQ_STATION[0]-30)+'" y="'+(y-30)+'" width="60" height="60" rx="4" fill="#cfc7b4"/>'+
     '<circle cx="'+SQ_STATION[0]+'" cy="'+y+'" r="15" fill="#a99e88"/>';
  g+='<rect x="'+(SQ_STATION[1]-34)+'" y="'+(y-10)+'" width="68" height="20" rx="6" fill="#c98a3c"/>';
  g+='<circle cx="'+SQ_STATION[2]+'" cy="'+y+'" r="26" fill="#cfc7b4"/>'+
     '<circle cx="'+SQ_STATION[2]+'" cy="'+y+'" r="15" fill="#6d7f88"/>';
  g+='<circle cx="'+TREE+'" cy="'+y+'" r="40" fill="#c98a3c"/>'+
     '<circle cx="'+TREE+'" cy="'+y+'" r="11" fill="#6f4d36"/>';
  g+='</g>';
  /* 그림자 끝 표시 */
  g+='<circle cx="'+tip+'" cy="'+y+'" r="'+(hit?13:9)+'" fill="'+(hit?'#b34a3a':'#6b6152')+'"'+
     (hit?' stroke="#fbf7ee" stroke-width="3"':'')+'/>';
  /* 이름표 */
  g+='<g font-size="16" font-family="Gaegu" text-anchor="middle">';
  SQ_STATION.forEach(function(x,i){
    var on=hit&&i===2;
    g+='<rect x="'+(x-40)+'" y="258" width="80" height="26" rx="13" fill="'+(on?'#b34a3a':'#ffffff')+'" stroke="#4a3428" stroke-width="2"/>'+
       '<text x="'+x+'" y="276" fill="'+(on?'#fff8ea':'#3b2a1a')+'">'+SQ_LABEL[i]+'</text>';
  });
  g+='</g></svg>';return g;
}
function shadowHint(){
  var msg=document.getElementById('sh-msg');if(!msg)return;
  MINI.hinted=(MINI.hinted||0)+1;MINI.moves+=3;
  var S0=MINI.sh;
  msg.innerHTML=(S0.mode==='wall')
    ? '빛이 벽 <b>한가운데</b>를 지날 때를 찾아보세요.'
    : '해가 오를수록 그림자는 <b>짧아져요.</b> 우물은 벤치보다 나무에 <b>가깝죠.</b>';
}

/* ---- 찢어진 조각 맞추기 ----
   조각은 사건 파일이 준다: sp.pieces = [{d:"패스", x:놓을자리x, y:놓을자리y}]
   없으면 그림을 격자로 잘라 만든다(포스터 그림이 없을 때의 대비). */
function jigsaw(sp){
  var W=780,H=340, snap=36;               /* 손가락으로 맞추는 거리 — 넉넉하게 */
  /* 판은 왼쪽, 조각 놓을 자리는 오른쪽. 조각이 판 위에 겹쳐 있으면 집기 어렵다. */
  var pieces=sp.pieces||autoPieces(sp);
  MINI.total=pieces.length;MINI.targets=pieces;
  /* 조각 안에 인쇄면(sp.art)을 제 위치로 잘라 넣는다. 맞추면 그림이 이어진다. */
  var svg='<svg viewBox="0 0 '+W+' '+H+'" id="jig"><defs>';
  if(sp.art)svg+='<g id="jig-art">'+sp.art+'</g>';
  pieces.forEach(function(p,i){svg+='<clipPath id="jc'+i+'"><path d="'+p.d+'"/></clipPath>'});
  svg+='</defs>';
  svg+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#efe6d3"/>';
  svg+='<g id="jig-slots">';
  pieces.forEach(function(p){svg+='<path class="jig-slot" d="'+p.d+'" transform="translate('+p.x+','+p.y+')"/>'});
  svg+='</g><g id="jig-pieces"></g>';
  svg+='<text id="jig-msg" class="jig-done" x="'+(W/2)+'" y="'+(H-12)+'" text-anchor="middle"></text></svg>';
  $('#mini-stage').innerHTML=svg;

  var g=document.getElementById('jig-pieces');
  var NS='http://www.w3.org/2000/svg';
  pieces.forEach(function(p,i){
    var grp=document.createElementNS(NS,'g');
    grp.setAttribute('class','jig-piece');
    grp.setAttribute('transform','translate(0,0)');
    grp.dataset.i=i;grp.dataset.x=0;grp.dataset.y=0;
    var body=document.createElementNS(NS,'path');
    body.setAttribute('d',p.d);body.setAttribute('fill',p.fill||'#fffaf0');
    grp.appendChild(body);
    if(sp.art){                                   /* 인쇄면 — 이 조각이 덮는 부분만 */
      var u=document.createElementNS(NS,'use');
      u.setAttribute('href','#jig-art');
      u.setAttribute('transform','translate('+(-(p.ox||0))+','+(-(p.oy||0))+')');
      var clip=document.createElementNS(NS,'g');
      clip.setAttribute('clip-path','url(#jc'+i+')');
      clip.appendChild(u);grp.appendChild(clip);
    }
    var edge=document.createElementNS(NS,'path');  /* 테두리는 인쇄면 위에 */
    edge.setAttribute('d',p.d);edge.setAttribute('fill','none');
    edge.setAttribute('stroke','#4a3428');edge.setAttribute('stroke-width','2');
    grp.appendChild(edge);
    g.appendChild(grp);
  });
  scatter(g,pieces,W,H);
  countMini();

  var stage=document.getElementById('jig'),drag=null;
  function pt(e){var r=stage.getBoundingClientRect();
    return {x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H}}
  stage.addEventListener('pointerdown',function(e){
    var el=e.target.closest('.jig-piece');if(!el||el.classList.contains('snapped'))return;
    var p=pt(e);drag={el:el,dx:p.x-(+el.dataset.x),dy:p.y-(+el.dataset.y)};
    el.parentNode.appendChild(el);                     // 잡은 조각을 맨 위로
    stage.setPointerCapture(e.pointerId);sTap();
  });
  stage.addEventListener('pointermove',function(e){
    if(!drag)return;var p=pt(e);
    var nx=p.x-drag.dx, ny=p.y-drag.dy;
    drag.el.dataset.x=nx;drag.el.dataset.y=ny;
    drag.el.setAttribute('transform','translate('+nx+','+ny+')');
  });
  stage.addEventListener('pointerup',function(e){
    if(!drag)return;var el=drag.el;drag=null;MINI.moves++;
    var i=+el.dataset.i,tgt=pieces[i];
    var dx=(+el.dataset.x)-tgt.x, dy=(+el.dataset.y)-tgt.y;
    if(Math.hypot(dx,dy)<snap){
      el.dataset.x=tgt.x;el.dataset.y=tgt.y;
      el.setAttribute('transform','translate('+tgt.x+','+tgt.y+')');
      el.classList.add('snapped');sStamp();MINI.done++;countMini();
      if(MINI.done>=MINI.total){document.getElementById('jig-msg').textContent='맞췄어요!';miniWin()}
    }
  });
}
/* 조각을 오른쪽에 겹치지 않게 늘어놓는다.
   겹쳐 놓으면 아이가 원하는 조각을 집지 못한다 — 실제로 그렇게 나왔다. */
function scatter(g,pieces,W,H){
  var X0=300, X1=W-16, Y0=16, gap=12;
  /* 조각 모양만 잰다. 묶음(g)을 재면 잘라 낸 인쇄면까지 들어가 모두 포스터 전체 크기로 잡힌다. */
  var boxes=[].slice.call(g.children).map(function(el){var b=el.firstChild.getBBox();
    return {el:el,w:b.width,h:b.height,ox:b.x,oy:b.y}});
  var order=boxes.slice().sort(function(a,b){return b.h-a.h});
  var cx=X0, cy=Y0, rowH=0;
  order.forEach(function(b){
    if(cx+b.w>X1&&cx>X0){cx=X0;cy+=rowH+gap;rowH=0}
    var nx=cx-b.ox, ny=cy-b.oy;
    b.el.dataset.x=nx;b.el.dataset.y=ny;
    b.el.setAttribute('transform','translate('+nx+','+ny+')');
    cx+=b.w+gap; rowH=Math.max(rowH,b.h);
  });
  /* 아래로 넘쳤으면 조금씩 위로 당겨 화면 안에 넣는다 */
  var over=cy+rowH-(H-16);
  if(over>0)boxes.forEach(function(b){var ny=(+b.el.dataset.y)-over;b.el.dataset.y=ny;
    b.el.setAttribute('transform','translate('+b.el.dataset.x+','+ny+')')});
}
function countMini(){$('#mini-count').textContent=MINI.done+' / '+MINI.total+' 조각';}
/* 막혔을 때 — 조각 하나를 대신 놓아 준다. 실패는 없고 별점에만 남는다(결정 4). */
function miniHint(){
  if(MINI.kind==='lock'){lockHint();return}
  if(MINI.kind==='shadow'){shadowHint();return}
  var left=[].slice.call(document.querySelectorAll('.jig-piece:not(.snapped)'));
  if(!left.length)return;
  var el=left[0], i=+el.dataset.i;
  MINI.hinted=(MINI.hinted||0)+1;MINI.moves+=3;
  var t=MINI.targets&&MINI.targets[i];if(!t)return;
  el.dataset.x=t.x;el.dataset.y=t.y;
  el.setAttribute('transform','translate('+t.x+','+t.y+')');
  el.classList.add('snapped');sStamp();MINI.done++;countMini();
  if(MINI.done>=MINI.total){var m=document.getElementById('jig-msg');if(m)m.textContent='맞췄어요!';miniWin()}
}
/* 조각을 사건 파일이 안 줬을 때 — 네모를 격자로 잘라 임시 조각을 만든다 */
function autoPieces(sp){
  var out=[],cols=3,rows=2,w=76,h=60,ox=40,oy=70;
  for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)
    out.push({d:'M0 0 h'+w+' v'+h+' h-'+w+'z', x:ox+c*w, y:oy+r*h});
  return out;
}

/* ================= 수첩 ================= */
function addClue(id,quiet){
  if(S.found[id])return false;
  var was=openMap();
  S.found[id]=true;S.newNotes++;updateDot();
  if(!quiet)sFind();
  /* follow 로 딸려 나오는 단서는 **어디서 얻었든** 따라와야 한다.
     현장에서 조사할 때만 따라오게 두었더니, 심문의 「일지 보여 달라 하기」로 얻은
     일지의 일출표가 영영 수첩에 안 들어왔다(사건 3에서 잡았다). */
  var f=C.clues[id]&&C.clues[id].follow;
  S._justFollow=null;
  if(f&&f.give&&!S.found[f.give]){addClue(f.give,true);S._justFollow=f.give}
  /* 이 단서로 새 현장이 열렸다면 바로 알려 준다 — 열린 줄 모르고 헤매지 않게 */
  var sc=newlyOpen(was);
  if(sc){setTimeout(function(){toast('🔓 「'+sc.label+'」에 갈 수 있어요');refreshSceneBar()},1200)}
  return true;
}
function updateDot(){var d=$('#notes-dot');d.hidden=S.newNotes===0;d.textContent=S.newNotes;var c=$('#t-clue');if(c)c.textContent='🗒 '+count()}
/* 「잠김」은 **아직 얻지 못했다**는 뜻이다. 얻고 나면 잠김이 아니다.
   이걸 구별하지 않아서, 심문에서 얻은 「콩이 주머니의 압정」(locked 로 선언된 단서)이
   수첩에도 단서 고르기 창에도 끝내 나타나지 않았다 — 얻었는데 쓸 수 없는 카드였다. */
function isLocked(id){var c=C.clues[id];return !!(c&&c.locked&&!S.found[id])}
/* 지점의 need 가 다 채워졌는가 — 「무엇을 찾아야 하는지 알고 올라가야 한다」 */
function spotReady(sp){return (sp.need||[]).every(function(id){return S.found[id]})}
function count(){return C.order.filter(function(id){return S.found[id]&&!isLocked(id)}).length}
function lamps(){$('#t-lamp').textContent='💡 '+S.lamps}
function burn(){S.lamps=Math.max(0,S.lamps-1);lamps()}

/* ================= 모드 ================= */
function setMode(m){
  S.mode=m;S.hot=null;S.sel=null;S.active=null;
  document.querySelectorAll('.tab').forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.mode===m))});
  $('#t-left').textContent='사건 '+(C.no||1)+' · '+{scene:'현장',talk:'심문',notes:'수첩',logic:'추리'}[m];
  if(m==='notes'){S.newNotes=0;updateDot()}
  closeSheet();cancelTyper();
  setMood({scene:'invest',talk:'tense',notes:'invest',logic:'build'}[m]);
  applyBig();
  ({scene:renderScene,talk:renderTalk,notes:renderNotes,logic:renderLogic})[m]();
  updateAct();idleReset();
}
/* 쉬움 모드: 60초 동안 진전이 없으면 힌트 제안 */
function idleReset(){clearTimeout(S.idle);if(!S.easy||S.screen!=='invest')return;S.idle=setTimeout(idleHint,60000)}
function idleHint(){
  if(S.screen!=='invest')return;var m='';
  if(S.mode==='scene'){var left=spots().filter(function(sp){return !sp.decoy&&!S.found[sp.id]&&!isLocked(sp.id)}).length;m=left?'아직 조사하지 않은 곳이 '+left+'곳 있어요. 확대경을 천천히 끌어 보세요':'현장은 다 봤어요. 심문 탭으로 가 보세요'}
  else if(S.mode==='talk')m=S.sel?'수첩의 증언 카드도 들이댈 수 있어요':'용의자의 말 중 수첩의 증언과 어긋나는 말을 찾아보세요';
  else if(S.mode==='logic'){
    if(S.phase==='chain'){var i=-1;C.steps.forEach(function(c,k){if(i<0&&!stepDone(k))i=k});
      m=i>=0?(i+1)+'단계가 비었어요. '+C.steps[i].whyClue.replace(/<[^>]+>/g,''):'다 채웠으면 「이대로 추리한다」를 누르세요'}
    else if(S.phase==='elim')m='「본인이 그렇게 말했으니까」는 지울 이유가 못 돼요';
    else m='사슬이 가리키는 답을 고르세요'}
  else m='물증은 흰 카드, 증언은 이중선 카드예요';
  if(m)toast('💡 '+m);idleReset();
}
document.addEventListener('pointerdown',function(){if(S.screen==='invest'&&!MINI.on)idleReset()});

function updateAct(){
  touch();
  var a=$('#act');a.className='act';a.disabled=true;
  if(MINI.on){a.textContent='분석하는 중…';return}
  if(S.mode==='scene'){a.textContent='조사하기';a.disabled=!S.hot}
  else if(S.mode==='talk'){
    var s=C.suspects[S.tab];
    var ex=extraAction(s);
    if(ex){a.textContent=ex.label;a.className='act warm';a.disabled=false}
    else{a.textContent='단서 들이대기';a.disabled=!S.sel}
  }
  else if(S.mode==='notes'){a.textContent='수첩 '+count()+'장';a.disabled=true}
  else if(S.mode==='logic'){
    if(S.phase==='chain'){var d=chainReady(),mz=missingSteps();
      a.textContent=d?'이대로 추리한다':(mz.length?'단서를 더 모아야 해요':'추론을 채우세요');
      a.className=d?'act warm':'act';a.disabled=!d}
    else if(S.phase==='elim'){var d2=elimReady();a.textContent=d2?'이대로 지운다':'지울 이유를 고르세요';a.className=d2?'act warm':'act';a.disabled=!d2}
    else if(S.playing){a.textContent='재현하는 중…';a.className='act';a.disabled=true}
    else{var rr=replayReady();a.textContent=rr?'이대로 재현한다':'네 장면을 순서대로 눌러요';a.className=rr?'act warm':'act';a.disabled=!rr}
  }
}
function onAct(){
  if(S.mode==='scene')inspect();
  else if(S.mode==='talk'){var s=C.suspects[S.tab],ex=extraAction(s);if(ex)doExtra(ex);else openTray('present')}
  else if(S.mode==='logic'){if(S.phase==='chain')judgeChain();else if(S.phase==='elim')judgeElim();else judgeReplay()}
}

/* ================= 현장 ================= */
var LENS_R=40;
/* 확대경이 <use href="#art"> 로 확대하므로, 그림을 써도 id는 art 그대로 유지한다. */
function artLayer(){
  var sc=curScene();
  /* overlay: 배경 그림 **위에** 얹는 SVG 조각(사건 4의 말뚝·밧줄·석회). #art 안에 넣어야
     확대경이 같이 확대한다. 배경 그림이 없을 때도 얹는다 — 그림 없이 완주 시험을 돌리기 위해. */
  var ov=sc.overlay||'';
  if(artOK(sc.img))
    return '<g id="art"><image href="'+artURL(sc.img)+'" x="0" y="0" width="720" height="360" preserveAspectRatio="xMidYMid slice"/>'+ov+'</g>';
  if(sc.svg||C.sceneSvg)return sc.svg||C.sceneSvg;
  return '<g id="art"><rect width="720" height="360" fill="#e9eadf"/>'+ov+'</g>';
}
/* 현장이 둘 이상일 때만 현장 단추 줄을 둔다. 잠긴 현장은 이름 대신 자물쇠를 보여 주고,
   눌러 보면 무엇이 있어야 열리는지 말해 준다 — 막힌 곳에서 헤매지 않게. */
/* 단추 줄만 갈아 끼운다 — 현장 전체를 다시 그리면 오른쪽에 막 띄운 단서 카드가 날아간다 */
function refreshSceneBar(){
  var old=$('#scenebar');if(!old||S.mode!=='scene')return;
  var box=document.createElement('div');box.innerHTML=sceneBar();
  var neu=box.firstChild;if(!neu)return;
  old.parentNode.replaceChild(neu,old);
  bindSceneBar();
}
function bindSceneBar(){
  var bar=$('#scenebar');if(!bar)return;
  var gb=$('#scene-big');
  if(gb)gb.addEventListener('click',function(){sTap();setBig(!S.big);renderScene()});
  bar.querySelectorAll('[data-sc]').forEach(function(b){
    b.addEventListener('click',function(){
      var sc=null;sceneList().forEach(function(x){if(x.id===b.dataset.sc)sc=x});
      if(!sc)return;
      if(!sceneOpen(sc)){sBad();toast(String(sc.needSay||'아직 갈 수 없어요').replace(/<[^>]+>/g,''));return}
      if(sc.id===S.scene)return;
      sTap();sPage();S.scene=sc.id;S.hot=null;S.lens={x:360,y:180};renderScene();updateAct();
    });
  });
}
function sceneBar(){
  var L=sceneList();
  var h='<div class="scenebar" id="scenebar">';
  if(L.length>1)L.forEach(function(sc){
    var open=sceneOpen(sc),on=(sc.id===curScene().id);
    h+='<button class="sctab'+(on?' on':'')+(open?'':' shut')+'" data-sc="'+sc.id+'">'+
       (open?'':'🔒 ')+esc(sc.label)+'</button>';
  });
  /* 현장을 크게 보기 — 휴대폰에서 그림이 너무 작다는 말이 많았다.
     켜면 오른쪽 글 칸을 접고 위아래 띠도 얇아져서 그림이 훨씬 커진다. */
  h+='<button class="sctab grow'+(S.big?' on':'')+'" id="scene-big">'+(S.big?'⤡ 작게':'⤢ 크게 보기')+'</button>';
  return h+'</div>';
}
function setBig(v){S.big=!!v;putPref({big:S.big});applyBig()}
/* 크게 보기는 **현장에서만** 쓴다. 심문·수첩·추리는 오른쪽 칸이 곧 내용이라 접으면 안 된다. */
function applyBig(){
  var on=!!(S.big&&S.mode==='scene');
  var b=document.querySelector('.body'),a=document.querySelector('.app');
  if(b)b.classList.toggle('big',on);
  if(a)a.classList.toggle('bigapp',on);
}
function sceneSVG(){return ''+
'<svg id="scene" viewBox="0 0 720 360"><defs><clipPath id="lc"><circle id="lcc" cx="360" cy="180" r="'+LENS_R+'"/></clipPath></defs>'+
artLayer()+
'<g clip-path="url(#lc)"><g id="mag"><use href="#art"/></g></g>'+
'<g id="lens"><circle id="lr1" cx="360" cy="180" r="'+LENS_R+'" fill="none" stroke="#5b5a63" stroke-width="6"/><circle id="lr2" cx="360" cy="180" r="'+LENS_R+'" fill="none" stroke="#e8f4f8" stroke-width="1.8"/><path id="lh" d="M388 208 l26 26" stroke="#7a5233" stroke-width="11" stroke-linecap="round"/></g>'+
'<g id="found"></g></svg><div class="lenslabel" id="lenslabel"></div>';}
function renderScene(){
  var bar=sceneBar();
  $('#left').innerHTML='<div class="scenecol'+(bar?' hasbar':'')+'">'+bar+
    '<div class="scenewrap" id="scenewrap">'+sceneSVG()+
    '<div class="bigcard" id="bigcard" hidden></div></div></div>';
  bindSceneBar();
  drawFound();setLens(S.lens.x,S.lens.y);
  var w=$('#scenewrap'),drag=false;
  w.addEventListener('pointerdown',function(e){
    /* 확대경을 다시 잡으면 아래 띠는 비켜 준다 — 가려진 자리를 조사할 수 있게 */
    var bc=$('#bigcard');
    if(bc&&!bc.hidden&&!(e.target.closest&&e.target.closest('.bigcard'))){S._cardOff=true;bc.hidden=true;return}
    drag=true;w.setPointerCapture(e.pointerId);var p=pt(e);setLens(p.x,p.y)});
  w.addEventListener('pointermove',function(e){if(drag){var p=pt(e);setLens(p.x,p.y)}});
  w.addEventListener('pointerup',function(){drag=false});
  rightScene(null);
}
function pt(e){var s=$('#scene'),r=s.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*720,y:(e.clientY-r.top)/r.height*360}}
function setLens(x,y){
  x=Math.max(LENS_R*.6,Math.min(720-LENS_R*.6,x));y=Math.max(LENS_R*.6,Math.min(360-LENS_R*.6,y));
  S.lens={x:x,y:y};
  ['#lcc','#lr1','#lr2'].forEach(function(s){var e=$(s);e.setAttribute('cx',x);e.setAttribute('cy',y)});
  $('#lh').setAttribute('d','M'+(x+28)+' '+(y+28)+' l26 26');
  $('#mag').setAttribute('transform','translate('+x+','+y+') scale(1.8) translate('+(-x)+','+(-y)+')');
  var best=null,bd=1e9;
  spots().forEach(function(sp){var d=Math.hypot(sp.x-x,sp.y-y);if(d<Math.max(sp.r,26)&&d<bd){bd=d;best=sp}});
  var changed=(best&&best!==S.hot);S.hot=best;
  var lab=$('#lenslabel');
  /* 확대경 이름표는 **그림에 보이는 것**의 이름이다.
     사건 3의 참새 둥지는 그림에 없다 — 보이는 건 사다리고, 올라가야 둥지가 나온다.
     그래서 지점이 스스로 이름표를 대면 단서 이름보다 그것을 쓴다. */
  if(best){var nm=best.decoy?best.label:(best.label||C.clues[best.id].n);
    var mk=S.found[best.id]?'✓ ':((!best.decoy&&!spotReady(best))?'🔒 ':'');
    lab.textContent=mk+nm;lab.classList.add('on');
    if(changed){sHot();lab.classList.remove('new-hot');void lab.offsetWidth;lab.classList.add('new-hot')}}
  else lab.classList.remove('on');
  updateAct();
}
function drawFound(){
  var g=$('#found');if(!g)return;var h='';
  spots().forEach(function(sp){if(!sp.decoy&&S.found[sp.id])h+='<circle cx="'+sp.x+'" cy="'+sp.y+'" r="7" fill="#7d8f5c" stroke="#4a3428" stroke-width="1.6"/><path d="M'+(sp.x-3)+' '+sp.y+' l2 2 l4 -5" stroke="#fff" stroke-width="1.8" fill="none"/>'});
  g.innerHTML=h;
}
function inspect(){
  var sp=S.hot;if(!sp)return;sTap();
  if(sp.decoy){sNo();rightScene('<div class="card"><div class="who">'+esc(sp.label)+'</div><p style="margin:0">'+esc(sp.decoy)+'</p></div>');return}
  var c=C.clues[sp.id];
  if(isLocked(sp.id)){sBad();rightScene('<div class="card"><div class="who">🔒 '+esc(c.n)+'</div><p style="margin:0">'+c.t+'</p></div>');return}
  /* 지점별 조건 — 먼저 알아야 할 것이 있는 자리는 그것부터 알려 준다(사건 3의 사다리·모형) */
  if(!spotReady(sp)&&!S.found[sp.id]){
    sBad();
    rightScene('<div class="card"><div class="who">'+mface('def')+'아직은</div><p style="margin:0">'+
      (sp.needSay||'여기는 아직 살펴볼 수 없어요.')+'</p></div>');
    return;
  }
  /* 분석 미니게임이 걸린 지점은 퍼즐을 풀어야 단서를 얻는다 */
  if(sp.mini&&!S.found[sp.id]){openMini(sp);return}
  finishInspect(sp,addClue(sp.id));
}
function finishInspect(sp,isNew){
  if(!sp)return;
  var c=C.clues[sp.id];
  drawFound();setLens(S.lens.x,S.lens.y);
  /* 조사하면 딸려 나오는 것들 — 사건 파일이 단서에 선언한다(예전엔 c_print·c_tub 이 코드에 박혀 있었다)
       follow: {give, who, voice, say}  → 조사 순간 다른 카드(증언)가 추가되고 그 사람이 한 줄 말한다
       note: html                       → 설명 아래 덧붙이는 글 */
  var extra='',after=null;
  var f=c.follow;
  /* 딸려 나온 카드는 addClue 안에서 이미 수첩에 들어갔다. 여기서는 그 장면만 보여 준다. */
  if(f&&f.give&&isNew&&S._justFollow===f.give){
    extra+='<div class="say" id="sc-follow"><b>'+esc(f.who||'')+'</b> <span></span><br><span class="muted">→ 증언 카드가 수첩에 추가됐어요.</span></div>';
    after=function(){var el=document.querySelector('#sc-follow span');if(el)typeHTML(el,f.say||'',f.voice||'narr')};
  }
  if(c.note)extra+=c.note;
  /* photo: 그 단서의 「진짜 사진」. 128px 아이콘만으로는 무엇을 봤는지 안 보이는 단서가 있다
     (사건 3의 망치 집 참새 둥지 — 그림은 있는데 화면 어디에도 안 나왔다).
     카드 **안**, 설명 앞에 넣어야 글이 사진 옆으로 흐른다. */
  var photo=(c.photo&&artOK(c.photo))
    ? '<div class="cluephoto"><img src="'+artURL(c.photo)+'" alt="'+esc(c.n)+'"></div>' : '';
  rightScene('<div class="card"><div class="who">'+(isNew?mface('sp'):mface('def'))+esc(c.n)+(isNew?' <small style="color:var(--olive)">수첩에 기록</small>':' <small>이미 기록됨</small>')+'</div>'+photo+'<p style="margin:0" id="sc-desc"></p></div>'+extra);
  typeHTML($('#sc-desc'),c.t,isNew?'mango':null,function(){if(after)after();mirrorBig()});
  mirrorBig();
  if(count()>=8&&!S.flags.hint8){S.flags.hint8=true;toast('단서가 많이 모였어요. 심문과 추리 탭도 써 보세요')}
}
/* 크게 보기에서는 오른쪽 칸이 접히므로, 같은 내용을 그림 아래 띠에 겹쳐 보여 준다.
   내용을 두 벌로 만들지 않고 오른쪽 칸에 그린 것을 그대로 옮긴다. */
function mirrorBig(){
  var box=$('#bigcard');if(!box)return;
  if(!S.big||!S._hasCard||S._cardOff){box.hidden=true;return}
  var src=$('#rscroll');if(!src)return;
  var card=src.querySelector('.card');
  if(!card){box.hidden=true;return}
  box.innerHTML='<button class="bigx" id="bigx" aria-label="닫기">✕</button><div class="bigin"></div>';
  var inn=box.querySelector('.bigin');
  var n=card;while(n){inn.appendChild(n.cloneNode(true));n=n.nextElementSibling}
  box.hidden=false;
  var x=$('#bigx');if(x)x.addEventListener('click',function(){sTap();S._cardOff=true;box.hidden=true});
  /* 글자가 한 자씩 찍히는 중이면 따라 그린다 — 안 그러면 띠에 반쪽 글이 멈춰 있다 */
  clearTimeout(MIRT);
  if(typers.length)MIRT=setTimeout(mirrorBig,120);
}
var MIRT=null;
function rightScene(html){
  /* 기본 「망고의 메모」는 띠로 띄우지 않는다 — 확대경 길을 막는다.
     다만 그 현장에 **처음 들어왔을 때 한 번은** 띄운다. 크게 보기에서는 오른쪽 칸이
     접혀 있어서, 안 띄우면 무엇을 하라는 안내를 아예 못 보게 된다. */
  S._hasCard=!!html||!S.flags['memoSaid_'+curScene().id];
  if(html)S._cardOff=false;   /* 새 단서가 오면 접어 둔 띠를 다시 연다 */
  var base='<p class="muted" style="margin:0 0 8px">확대경을 끌어 살펴보고, 이름표가 뜨면 <b>조사하기</b>를 누르세요. 조사한 곳은 ✓로 표시돼요.</p>';
  $('#rscroll').innerHTML=base+(html||'<div class="card" style="background:#fff8e7"><div class="who">망고의 메모</div><p style="margin:0;font-size:13px" id="sc-memo"></p></div>');
  /* 현장 첫 화면의 망고 메모 — 사건 파일의 memo (없으면 일반 문장) */
  if(!html){var sc=curScene(),mk='memoSaid_'+sc.id;
    typeHTML($('#sc-memo'),sc.memo||C.memo||'하나씩 확인하자. 단서가 말해 주는 것만 믿는다.',S.flags[mk]?null:'mango');
    S.flags[mk]=true;}
  var mm=$('#rscroll').querySelector('.card .who');
  if(mm&&/망고의 메모/.test(mm.textContent))mm.insertAdjacentHTML('afterbegin',mface('def'));
  setTimeout(mirrorBig,30);
}

/* ================= 심문 ================= */
function portraitHTML(id){
  var s=C.suspects[id],h='';
  var f=faceFile(s,s.eyes);
  if(f)return '<div class="portrait"><img class="pim" src="'+artURL(f)+'" alt=""></div>';
  if(s.sym==='rc'){h='<use href="#rc-head"></use><use href="#rc-eye-'+(s.eyes||'def')+'"></use>';if(s.ribbon)h+='<use href="#rc-ribbon"></use>';if(s.apron)h+='<use href="#rc-apron"></use>'}
  else h='<use href="#'+s.sym+'"></use>';
  return '<div class="portrait"><svg viewBox="0 0 150 '+(s.apron?180:130)+'">'+h+'</svg></div>';
}
function renderTalk(){
  cancelTyper();
  $('#left').innerHTML=portraitHTML(S.tab);
  var s=C.suspects[S.tab],h='<div class="tabs">';
  C.suspectOrder.forEach(function(id){h+='<button data-s="'+id+'" aria-selected="'+(id===S.tab)+'"'+(C.suspects[id].witness?' class="witness"':'')+'>'+esc(C.suspects[id].name)+(C.suspects[id].witness?'·증인':'')+'</button>'});
  h+='</div><div class="card"><div class="who">'+esc(s.name)+' <small>'+esc(s.role)+'</small></div>';
  var n=0,intro=!S.flags['intro_'+S.tab],seq=[];
  s.lines.forEach(function(L){
    if(L.hidden&&!S.flags[L.id])return;n++;
    var active=L.sus&&(!L.needs||S.flags[L.needs]);
    /* 한 번 반박에 성공한 말은 다시 할 필요가 없다. 표시를 달아 두고 말은 그대로 남긴다 —
       지워 버리면 무엇을 밝혀냈는지 되짚을 수 없고, 그냥 두면 같은 일을 또 하게 된다. */
    var ok=!!S.flags['ok_'+L.id], end=!ok&&!!S.flags['end_'+L.id];
    var cls='tap'+(active&&S.easy&&!ok&&!end?' sus-on':'')+(S.sel===L.id?' picked':'')+(ok?' ok':'')+(end?' checked':'');
    var isNew=L.hidden&&!S.flags['seen_'+L.id];if(isNew)S.flags['seen_'+L.id]=true;
    var mk=ok?'<span class="mk ok">✓ 밝혀냄</span>':(end?'<span class="mk">확인함</span>':'');
    var txt=mk+'"'+esc(L.t)+'"'+(isNew?'<span class="new">새로운 말</span>':'');
    if(intro||isNew){seq.push({id:L.id,html:txt});txt=''}
    h+='<div class="stmt"><span class="n">'+n+'</span><button class="'+cls+(txt?'':' typing')+'" data-l="'+L.id+'" id="ln-'+L.id+'">'+txt+'</button></div>';
  });
  h+='</div><div id="talk-say">'+(S.flags['say_'+S.tab]||'')+'</div>';
  h+='<p class="muted" style="margin-top:8px">'+(s.witness?'증인의 말이에요. 중요한 말은 수첩에 기록돼요.':(S.sel?'아래 <b>단서 들이대기</b>로 반박하세요.':'거짓말 같은 말을 눌러 고르세요.'))+'</p>';
  $('#rscroll').innerHTML=h;
  document.querySelectorAll('[data-s]').forEach(function(b){b.addEventListener('click',function(){sTap();sPage();S.tab=b.dataset.s;S.sel=null;renderTalk();updateAct()})});
  document.querySelectorAll('[data-l]').forEach(function(b){b.addEventListener('click',function(){pickLine(b.dataset.l)})});
  // 처음 만나는 인물은 말을 한 줄씩 꺼낸다 (인물별 목소리)
  if(seq.length){S.flags['intro_'+S.tab]=true;var k=0;
    (function next(){if(k>=seq.length)return;var it=seq[k++],el=$('#ln-'+it.id);if(!el)return;
      typeHTML(el,it.html,S.tab,function(){el.classList.remove('typing');setTimeout(next,120)})})();}
  updateAct();
}
function speakerOf(html){var m=/^<b>([^<]+)<\/b>/.exec(html);if(!m)return 'narr';var nm=m[1];
  if(nm.indexOf('망고')>=0)return 'mango';
  /* 사건 파일의 인물 이름으로 목소리를 찾는다(예전엔 사건 1 인물만 박혀 있었다) */
  var hit=null;(C.suspectOrder||[]).forEach(function(id){if(!hit&&nm.indexOf(C.suspects[id].name)>=0)hit=id});
  if(hit)return hit;
  if(C.brief&&C.brief.who&&nm.indexOf(C.brief.who)>=0)return C.brief.sym||'narr';
  if(nm.indexOf('양')>=0)return 'sheep';return 'narr'}
function say(html,silent){S.flags['say_'+S.tab]='<div class="say">'+html+'</div>';var el=$('#talk-say');if(!el)return;
  if(silent){el.innerHTML=S.flags['say_'+S.tab];return}
  el.innerHTML='<div class="say" id="say-live"></div>';typeHTML($('#say-live'),html,speakerOf(html))}
function pickLine(id){
  var s=C.suspects[S.tab],L=null;s.lines.forEach(function(x){if(x.id===id)L=x});if(!L)return;
  if(typers.length)return; // 말하는 중엔 잠시 기다리기 (화면을 누르면 바로 끝남)
  sTap();
  /* 이미 끝낸 말 — 다시 반박시키지 않고, 그때 오간 이야기를 그대로 다시 보여 준다 */
  var keep=S.flags['ok_'+id]?S.flags['okSay_'+id]:(S.flags['end_'+id]?S.flags['endSay_'+id]:null);
  if(keep){S.sel=null;renderTalk();say(keep+'<br><span class="muted">'+(S.flags['ok_'+id]?'이미 반박에 성공한 말이에요. 다시 하지 않아도 돼요.':'이 말은 더 볼 게 없어요.')+'</span>',true);updateAct();return}
  if(L.gives){var got=addClue(L.gives);S.sel=null;renderTalk();say((got?'<b>수첩에 기록</b> — ':'')+C.clues[L.gives].t,true);if(got)toast('증언 카드가 수첩에 추가됐어요');return}
  if(L.flag&&!L.sus){S.flags[L.flag]=true;S.sel=null;renderTalk();say(L.say||'<b>망고</b> "…그래, 한번 보자."');updateAct();return}
  var active=L.sus&&(!L.needs||S.flags[L.needs]);
  if(!active){sNo();S.sel=null;renderTalk();say('<b>망고</b> "…그 말은 이상한 점이 없어 보이는데."');return}
  S.sel=id;renderTalk();say('<b>수상한 말을 골랐어요.</b> 아래 「단서 들이대기」에서 반박할 단서를 고르세요.',true);
}
function present(clueId){
  closeSheet();
  var s=C.suspects[S.tab],L=null;s.lines.forEach(function(x){if(x.id===S.sel)L=x});if(!L)return;
  var hit=L.hit&&L.hit[clueId];
  if(hit&&!hit.partial){
    sSting();if(hit.eyes)s.eyes=hit.eyes;if(hit.flag)S.flags[hit.flag]=true;if(hit.unlock)S.flags[hit.unlock]=true;
    /* 반박에 성공해야 나오는 단서는 hit.give 로 준다 — 사건 파일이 정한다 */
    var gave=hit.give&&addClue(hit.give);
    var html='<b>망고</b> "잠깐. 「'+C.clues[clueId].n.replace(/^[^:]+: /,'')+'」 — 이건 어떻게 설명하죠?"<br>'+hit.say+
        (gave?'<br><span class="muted">→ 새 카드가 수첩에 들어갔어요.</span>':'');
    S.flags['ok_'+L.id]=1;S.flags['okSay_'+L.id]=html;   // 다음부터는 표시만 보고 넘어간다
    S.sel=null;renderTalk();
    say(html);
    if(hit.toast)setTimeout(function(){toast(hit.toast)},1800);
  }else if(hit&&hit.partial){
    var ph=hit.say+'<br><span class="muted">'+(hit.hint||'가까워요. 조금 더 직접 이어지는 단서가 필요해요.')+'</span>';
    /* 성공할 수 있는 단서가 아예 없는 말이라면 여기가 끝이다. 계속 두드리게 두지 않는다. */
    var solvable=Object.keys(L.hit||{}).some(function(k){return !L.hit[k].partial});
    if(!solvable){S.flags['end_'+L.id]=1;S.flags['endSay_'+L.id]=ph;S.sel=null}
    sNo();renderTalk();say(ph);
  }else{
    sBad();burn();S.rebutErr++;renderTalk();
    say('<b>'+esc(s.name)+'</b> "그건 저랑 상관없는데요?"'+(S.lamps?'':' <span class="muted">(등불을 다 썼어요)</span>'));
  }
}
/* 인물의 extra: {label, needFlag, give, say} — 반박에 성공해 needFlag 가 서면
   행동 단추가 뜨고, 누르면 give 단서를 준다. 사건 1의 「앞치마 살펴보기」가 이 형태다. */
function extraAction(s){
  var e=s&&s.extra;if(!e)return null;
  if(e.needFlag&&!S.flags[e.needFlag])return null;
  if(e.give&&S.found[e.give])return null;
  return e;
}
function doExtra(e){
  sTap();
  if(!addClue(e.give)){updateAct();return}
  S.flags[e.give+'_found']=true;
  cancelTyper();
  if(e.art)$('#left').innerHTML=e.art;
  say('<b>망고</b> '+(e.say||'살펴본다…')+' '+C.clues[e.give].t+
      '<br><span class="muted">수첩에 기록됐어요.</span>');
  if(e.back)setTimeout(function(){if(S.mode==='talk'){renderTalk()}},3200);
  updateAct();
}

/* ================= 수첩 ================= */
function cardHTML(id,pressed,clickable){
  var c=C.clues[id],got=!!S.found[id];
  var cls='clue'+(c.testi?' testi':'')+(c.locked&&!got?' locked':'');
  /* 잠긴 카드에 무엇이라 적을지는 사건 파일이 정한다(예전엔 「지문」이 박혀 있었다) */
  var inner=clueIcon(c,got)+(got?esc(c.n):(c.locked?'🔒 '+esc(c.lockName||c.n||'???'):'???'));
  if(clickable)return '<button class="'+cls+'" data-c="'+id+'" aria-pressed="'+(!!pressed)+'"'+(got?'':' disabled')+'>'+inner+'</button>';
  return '<div class="'+cls+'">'+inner+'</div>';
}
function renderNotes(){
  $('#left').innerHTML='<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:8px;padding:6px">'+
    '<div class="card"><div class="who">수첩 <small>'+count()+'장</small></div><div class="clues" id="note-grid"></div></div></div>';
  var g=$('#note-grid'),h='';
  C.order.forEach(function(id){if(S.found[id]||isLocked(id))h+=cardHTML(id,false,true)});
  g.innerHTML=h||'<p class="muted">아직 기록이 없어요. 현장을 조사해 보세요.</p>';
  $('#rscroll').innerHTML='<div class="card" style="background:#fff8e7"><div class="who">카드를 누르면 내용을 다시 볼 수 있어요</div><p class="muted" style="margin:0">물증은 흰 카드, 증언은 이중선 카드예요. 둘 다 추리의 근거로 쓸 수 있어요.</p></div>';
  g.querySelectorAll('[data-c]').forEach(function(b){b.addEventListener('click',function(){sTap();var c=C.clues[b.dataset.c];
    $('#rscroll').innerHTML='<div class="card"><div class="who">'+esc(c.n)+'</div><p style="margin:0">'+c.t+'</p></div>'+(c.odd?'<div class="note"><b>이 단서는 어디에 들어갈까?</b>사건과 이어지는 곳이 없다면… 그게 바로 이상한 점이에요.</div>':'')})});
}

/* ================= 추리 (단서 + 결론을 둘 다 고른다) ================= */
/* ---- 손으로 푸는 판 — 종류마다 「다 놓았는가 / 맞았는가 / 왜 틀렸는가」 셋만 대면 된다.
       새 판을 만들려면 여기에 한 줄 더 넣고 그리는 함수를 하나 쓰면 된다.
       timeline: 시간 띠 위에 카드 놓기(사건 3) · plan: 평면도 자리에 카드 맞추기(사건 1)
       wind: 화살표를 돌려 방향 맞추기(사건 2) */
var BOARDS={
  timeline:{
    filled:function(b,st){st.tl=st.tl||{};return b.events.every(function(e){return e.fix||st.tl[e.id]!=null})},
    ok:function(b,st){st.tl=st.tl||{};return b.events.every(function(e){
      if(e.fix)return true;var t=st.tl[e.id];if(t==null)return false;
      if(e.after&&t<mins(e.after))return false;
      if(e.before&&t>mins(e.before))return false;return true})},
    why:function(b,st){
      var bad=b.events.filter(function(e){if(e.fix)return false;var t=st.tl&&st.tl[e.id];
        if(t==null)return true;
        if(e.after&&t<mins(e.after))return true;
        if(e.before&&t>mins(e.before))return true;return false});
      return bad.length?('「'+esc(bad[0].t)+'」 카드 — '+(bad[0].why||'놓은 자리가 맞지 않아요.')):''}
  },
  plan:{
    filled:function(b,st){st.pl=st.pl||{};return b.slots.every(function(sl){return st.pl[sl.id]})},
    ok:function(b,st){st.pl=st.pl||{};return b.slots.every(function(sl){return st.pl[sl.id]===sl.ok})},
    why:function(b,st){
      st.pl=st.pl||{};
      for(var k=0;k<b.slots.length;k++){
        var sl=b.slots[k],put=st.pl[sl.id];
        if(!put)return '「'+esc(sl.t)+'」에 아직 아무것도 안 놓았어요.';
        if(put!==sl.ok){
          var card=b.cards.filter(function(x){return x.id===put})[0]||{};
          return '「'+esc(sl.t)+'」에 놓은 '+(card.t?'「'+esc(card.t)+'」':'것')+' — '+(card.why||sl.why||'여기를 막는 건 이게 아니에요.');
        }
      }
      return ''}
  },
  wind:{
    filled:function(b,st){return st.wd!=null},
    ok:function(b,st){return st.wd===b.answer},
    why:function(b,st){
      if(st.wd==null)return '화살표를 돌려 바람이 불어온 쪽을 정해 보세요.';
      var d=b.dirs.filter(function(x){return x.id===st.wd})[0]||{};
      return d.why||'그 방향이면 두 가지가 같은 쪽으로 쏠리지 않아요.'}
  },
  /* 자국 따라가기(사건 5) — 바닥의 젖은 자국을 **큰 것부터** 차례로 눌러 길을 잇는다.
     물 자국은 걸을수록 작아진다. 그래서 순서는 크기가 말해 주고, 이어진 길이 답이다. */
  trail:{
    filled:function(b,st){st.tr=st.tr||[];return st.tr.length===b.order.length},
    ok:function(b,st){st.tr=st.tr||[];return st.tr.length===b.order.length&&st.tr.every(function(id,k){return id===b.order[k]})},
    why:function(b,st){
      st.tr=st.tr||[];
      if(st.tr.length<b.order.length)return '아직 안 이은 자국이 있어요. 큰 것부터 차례로 다 이어 보세요.';
      for(var k=0;k<b.order.length;k++)if(st.tr[k]!==b.order[k])
        return (k+1)+'번째부터 어긋나요 — '+(b.why||'물 자국은 걸을수록 작아져요. 큰 것 다음엔 그다음으로 큰 것이에요.');
      return ''}
  }
};
function boardK(c){return BOARDS[(c.board&&c.board.kind)||'timeline']||BOARDS.timeline}
function stepDone(i){
  var c=C.steps[i],st=S.steps[i];
  if(c.board)return boardK(c).filled(c.board,st);
  if(c.fill){                              /* 빈칸 문장 — 근거를 다 꽂고 빈칸을 다 채웠는가 */
    st.fill=st.fill||[];
    return st.clues.length===c.slots&&c.fill.blanks.every(function(b,k){return !!st.fill[k]});
  }
  return st.clues.length===c.slots&&st.opt!=null;
}
/* 빈칸 하나가 맞는가 — 낱말이 같으면 맞다(붙여 쓰기·띄어쓰기 차이는 눈감아 준다) */
function blankOK(c,k,w){
  if(!w)return false;
  var n=function(x){return String(x).replace(/\s+/g,'')};
  var b=c.fill.blanks[k];
  /* grp 가 같은 빈칸끼리는 **순서가 바뀌어도 맞다** — 「콩이와 콩순이」,「낙엽도 조각도」처럼
     문장에서 자리를 서로 바꿔도 뜻이 같은 자리들. 낱말 칩은 한 번 쓰면 사라지므로 겹칠 수 없다. */
  if(b.grp)return c.fill.blanks.some(function(x){return x.grp===b.grp&&n(x.ok)===n(w)});
  return n(b.ok)===n(w);
}
function fillOK(i){var c=C.steps[i],st=S.steps[i];st.fill=st.fill||[];return c.fill.blanks.every(function(b,k){return blankOK(c,k,st.fill[k])})}
function boardOK(i){var c=C.steps[i];return boardK(c).ok(c.board,S.steps[i])}
function clueOK(i){
  var c=C.steps[i],st=S.steps[i];
  if(c.board)return true;                  /* 판 단계는 근거 카드를 따로 꽂지 않는다 */
  return (c.slots===1)?(c.need.indexOf(st.clues[0])>=0):(c.need.every(function(n){return st.clues.indexOf(n)>=0}));
}
/* 이 단계의 근거 중 아직 수첩에 없는 것. 「틀렸다」와 「아직 못 찾았다」는 다른 말이고,
   둘을 구별해 주지 않으면 이용자는 맞는 답을 고르고도 어디가 잘못인지 모른 채 헤맨다. */
function needMissing(i){
  var c=C.steps[i],need=c.need||[];
  if(c.slots===1)return need.some(function(id){return S.found[id]})?[]:need.slice();
  return need.filter(function(id){return !S.found[id]});
}
function missingSteps(){var out=[];C.steps.forEach(function(c,i){if(needMissing(i).length)out.push(i)});return out}
function stepNos(a){return a.map(function(i){return '<b>'+(i+1)+'번</b>'}).join(' · ')}
function chainReady(){return C.steps.every(function(c,i){return stepDone(i)})}
function elimReady(){return C.elim.every(function(e){return S.elim[e.id]!=null})}

function renderLogic(){
  cancelTyper();
  if(S.phase==='chain')return renderChain();
  if(S.phase==='elim')return renderElim();
  return renderReplay();
}

/* ---------- 1단계: 추론 사슬 ----------
   추리는 **고르는 것이 아니라 만드는 것**이어야 한다(2026-09-21 결정).
   왼쪽: 코르크판. 단서 카드가 핀으로 꽂혀 있고, 카드를 누르면 빨간 실이 당겨져 「그래서?」에 모인다.
   오른쪽: 물음과 **빈칸 문장**. 카드에서 나온 낱말을 빈칸에 꽂아 결론을 직접 쓴다.
   사건 파일이 board 를 주면(사건 3의 시간표) 왼쪽이 그 판으로 바뀐다 — 손으로 푸는 추리 한 판. */
function curStep(){
  if(S.open==null||!C.steps[S.open]){
    var f=-1;C.steps.forEach(function(c,k){if(f<0&&!stepDone(k))f=k});
    S.open=(f<0?0:f);
  }
  return S.open;
}
function renderChain(){
  var i=curStep(),c=C.steps[i];
  if(c.board)renderBoardStep(i);else renderCork();
  renderStepPanel();
  updateAct();
}
/* 카드 자리 — 격자에 살짝 비뚤게. 같은 카드는 늘 같은 자리(흔들리면 손이 헷갈린다) */
function seedRand(n){var x=Math.sin(n*9301+49297)*233280;return x-Math.floor(x)}
function corkLayout(ids){
  /* 칸 수는 실제 판 너비로 정한다 — 카드 한 장에 최소 92px, 안 그러면 작은 화면에서 서로 겹친다 */
  var pane=($('#left')||{}).clientWidth||720;
  var cols=Math.max(3,Math.min(5,Math.floor((pane-16)/94)));
  var rows=Math.ceil(ids.length/cols);
  var W=720,cw=W/cols,ch=104;
  var out=ids.map(function(id,k){
    var r=Math.floor(k/cols),c=k%cols,j=seedRand(k+1),j2=seedRand(k+11);
    return {id:id,x:cw*c+cw/2+(j-.5)*10,y:26+ch*r+ch/2+(j2-.5)*8,rot:(j-.5)*6};
  });
  out.cols=cols;out.rows=rows;out.H=26+ch*rows+34;
  return out;
}
function renderCork(){
  var i=curStep(),st=S.steps[i],c=C.steps[i];
  var ids=C.order.filter(function(id){return S.found[id]});
  var L=corkLayout(ids),H=Math.max(300,L.H),cardW=(100/L.cols)-2.2;
  var used={};S.steps.forEach(function(x,k){if(k!==i)x.clues.forEach(function(id){used[id]=(used[id]||[]).concat(k+1)})});
  var h='<div class="corkwrap" id="corkwrap"><div class="cork" id="cork" style="height:'+H+'px">';
  h+='<svg class="strings" viewBox="0 0 720 '+H+'" preserveAspectRatio="none" id="strings"></svg>';
  L.forEach(function(p){
    var cl=C.clues[p.id],on=st.clues.indexOf(p.id)>=0;
    h+='<button class="pcard'+(cl.testi?' testi':'')+(on?' on':'')+'" data-pick="'+p.id+'" '+
       'style="left:'+(p.x/720*100)+'%;top:'+p.y+'px;width:'+cardW.toFixed(1)+'%;transform:translate(-50%,-50%) rotate('+p.rot.toFixed(1)+'deg)">'+
       '<span class="pin"></span>'+clueIcon(cl,true)+'<span class="pn">'+esc(cl.n)+'</span>'+
       (used[p.id]?'<span class="usedno">'+used[p.id].join('·')+'번</span>':'')+'</button>';
  });
  h+='</div>';
  /* 실이 모이는 자리 — 「그래서?」. 판이 길어 스크롤돼도 늘 보이게 바닥에 붙여 둔다. */
  var full=st.clues.length>=c.slots;
  h+='<div class="knot'+(full?' full':'')+'" id="knot"><b>'+(full?'그래서?':'근거 '+st.clues.length+'/'+c.slots)+'</b>'+
     '<small>'+(full?'오른쪽 빈칸을 채워 봐':'카드를 눌러 실을 이어')+'</small></div>';
  h+='</div>';
  if(!ids.length)h='<div class="logicwrap"><p class="muted">아직 모은 단서가 없어요. 현장과 심문을 먼저 살펴보세요.</p></div>';
  $('#left').innerHTML=h;
  $('#left').querySelectorAll('[data-pick]').forEach(function(b){b.addEventListener('click',function(){pickShelf(b.dataset.pick)})});
  var cw=$('#corkwrap');if(cw)cw.addEventListener('scroll',drawStrings,{passive:true});
  drawStrings();
}
/* 실 — 꽂은 카드에서 매듭까지. 화면 크기가 바뀌어도 다시 그린다. */
function drawStrings(){
  var svg=$('#strings'),cork=$('#cork'),knot=$('#knot');if(!svg||!cork||!knot)return;
  var i=curStep(),st=S.steps[i];
  var R=cork.getBoundingClientRect(),K=knot.getBoundingClientRect();
  var sx=720/R.width,sy=+svg.getAttribute('viewBox').split(' ')[3]/R.height;
  var kx=(K.left+K.width/2-R.left)*sx,ky=(K.top+K.height/2-R.top)*sy;
  var d='';
  st.clues.forEach(function(id){
    var el=cork.querySelector('[data-pick="'+id+'"]');if(!el)return;
    var B=el.getBoundingClientRect();
    var x=(B.left+B.width/2-R.left)*sx,y=(B.top+6-R.top)*sy;      /* 핀에서 출발 */
    var mx=(x+kx)/2,my=(y+ky)/2+22;                                /* 살짝 처진 실 */
    d+='<path d="M'+x+' '+y+' Q'+mx+' '+my+' '+kx+' '+ky+'" class="thread-sh"/>'+
       '<path d="M'+x+' '+y+' Q'+mx+' '+my+' '+kx+' '+ky+'" class="thread"/>';
  });
  svg.innerHTML=d;
}
window.addEventListener('resize',function(){if(S&&S.mode==='logic'&&S.phase==='chain')drawStrings()});
function pickShelf(id){
  var i=curStep(),c=C.steps[i],st=S.steps[i];
  if(st.clues.indexOf(id)>=0){          /* 다시 누르면 뺀다 */
    sNo();st.clues=st.clues.filter(function(x){return x!==id});S.wrongSet=null;
    S.flags.pickSay='';renderChain();return;
  }
  if(st.clues.length>=c.slots)st.clues.shift();   /* 꽉 찼으면 가장 먼저 넣은 걸 밀어낸다 */
  st.clues.push(id);S.wrongSet=null;sStamp();
  S.flags.pickSay='';
  if(S.easy&&(c.need||[]).indexOf(id)<0)
    S.flags.pickSay='<div class="say">'+mface('def')+'<b>망고</b> "음… 「'+esc(C.clues[id].n)+'」'+
      josa(C.clues[id].n,'은','는')+' <b>이 물음</b>과는 이어지지 않는 것 같아. 다시 눌러서 빼도 돼."</div>';
  renderChain();
}

/* ---- 오른쪽: 물음 + 빈칸 문장 ---- */
function wordBank(c,i){
  /* 낱말 순서는 단계마다 고정 — 매번 섞이면 손이 헷갈린다 */
  var ws=c.fill.blanks.map(function(b){return b.ok}).concat((c.fill.extra||[]).map(function(x){return x.w}));
  return ws.map(function(w,k){return {w:w,r:seedRand(k*7+i*13+3)}}).sort(function(a,b){return a.r-b.r}).map(function(x){return x.w});
}
function fillHTML(c,st){
  var parts=c.fill.t.split(/(\[\d+\])/);
  var h='<div class="fillbox">';
  parts.forEach(function(p){
    var m=/^\[(\d+)\]$/.exec(p);
    if(!m){h+=esc(p);return}
    var k=+m[1],w=st.fill[k],sel=(S.slot===k);
    h+='<button class="blank'+(w?' has':' empty')+(sel?' sel':'')+'" data-bk="'+k+'">'+(w?esc(w):'&nbsp;')+'</button>';
  });
  return h+'</div>';
}
function renderStepPanel(){
  var i=curStep(),c=C.steps[i],st=S.steps[i];
  st.fill=st.fill||[];
  var h='<div class="stepchips" id="stepchips">';
  C.steps.forEach(function(x,k){
    var done=stepDone(k),wrong=S.wrongSet&&S.wrongSet.indexOf(k)>=0;
    h+='<button class="schip'+(k===i?' on':'')+(done?' done':'')+(wrong?' bad':'')+'" data-s="'+k+'" aria-label="'+(k+1)+'단계 '+esc(x.t)+'">'+(done?'✓':(k+1))+'</button>';
  });
  h+='</div>';
  h+='<div class="card"><div class="who">'+(i+1)+'. '+esc(c.t)+'</div><p style="margin:0;font-size:13px" id="q-live"></p></div>';
  if(c.board){
    h+='<div class="note" style="margin-top:8px">'+(c.board.ask||'')+'</div>';
    if(stepDone(i)&&boardOK(i)&&c.board.done)h+='<div class="say">'+mface('joy')+'<b>망고</b> '+c.board.done+'</div>';
    h+=(S.flags.pickSay||'');
  }else if(c.fill){
    var full=st.clues.length>=c.slots;
    h+='<div class="pick"><div class="pl">근거 <small>'+st.clues.length+' / '+c.slots+' · 왼쪽 판에서 카드를 눌러 실을 이으세요</small></div>';
    h+='<div class="clues slots">';
    st.clues.forEach(function(id){h+='<button class="clue picked-c" data-rm="'+id+'">'+clueIcon(C.clues[id],true)+esc(C.clues[id].n)+'<span class="x">빼기</span></button>'});
    for(var k=st.clues.length;k<c.slots;k++)h+='<div class="clue slot">비어 있음</div>';
    h+='</div></div>';
    h+=(S.flags.pickSay||'');
    h+='<div class="pick"><div class="pl">그래서 — 빈칸을 채워 결론을 써 봐</div>'+fillHTML(c,st);
    h+='<div class="bank" id="bank">';
    var usedW={};st.fill.forEach(function(w){if(w)usedW[w]=1});
    wordBank(c,i).forEach(function(w){h+='<button class="word'+(usedW[w]?' gone':'')+'" data-w="'+esc(w)+'"'+(usedW[w]?' disabled':'')+'>'+esc(w)+'</button>'});
    h+='</div></div>';
    h+=(S.flags.wordSay||'');
  }else{
    h+='<div class="pick"><div class="pl">근거가 되는 단서 <small>'+st.clues.length+' / '+c.slots+'</small></div><div class="clues slots">';
    st.clues.forEach(function(id){h+='<button class="clue picked-c" data-rm="'+id+'">'+clueIcon(C.clues[id],true)+esc(C.clues[id].n)+'<span class="x">빼기</span></button>'});
    for(var k2=st.clues.length;k2<c.slots;k2++)h+='<div class="clue slot">비어 있음</div>';
    h+='</div></div>'+(S.flags.pickSay||'');
    h+='<div class="pick"><div class="pl">그래서 무엇이 증명되나요?</div>';
    c.opts.forEach(function(o,k){h+='<button class="opt'+(st.opt===k?' on':'')+'" data-o="'+k+'"><span class="dot"></span><span>'+o.t+'</span></button>'});
    h+='</div>';
  }
  var n=C.steps.filter(function(x,k){return stepDone(k)}).length,miss=missingSteps();
  h+='<p class="muted" style="margin-top:8px">'+n+' / '+C.steps.length+' 단계 채움'+(S.tries?' · 추리 제출 '+S.tries+'회':'')+'</p>';
  if(miss.length)h+='<div class="note"><b>아직 찾지 못한 단서가 있어요.</b>'+stepNos(miss)+' 단계는 지금 수첩에 있는 것만으로는 채울 수 없어요. <b>현장</b>과 <b>심문</b>을 더 살펴보고 오세요.</div>';
  h+=(S.flags.judgeSay||'');
  $('#rscroll').innerHTML=h;$('#rscroll').scrollTop=0;
  typeHTML($('#q-live'),c.q,'mango');
  $('#stepchips').querySelectorAll('[data-s]').forEach(function(b){
    b.addEventListener('click',function(){sTap();sPage();S.open=+b.dataset.s;S.slot=null;S.flags.pickSay='';S.flags.wordSay='';renderChain()})});
  $('#rscroll').querySelectorAll('[data-rm]').forEach(function(b){b.addEventListener('click',function(){
    sNo();var id=b.dataset.rm;st.clues=st.clues.filter(function(x){return x!==id});S.wrongSet=null;S.flags.pickSay='';renderChain()})});
  $('#rscroll').querySelectorAll('[data-o]').forEach(function(b){b.addEventListener('click',function(){
    var was=stepDone(i);sStamp();st.opt=+b.dataset.o;S.wrongSet=null;renderChain();autoNext(i,was)})});
  /* 빈칸 — 누르면 그 칸을 고른다. 낱말이 들어 있으면 빼서 돌려 놓는다. */
  $('#rscroll').querySelectorAll('[data-bk]').forEach(function(b){b.addEventListener('click',function(){
    var k=+b.dataset.bk;
    if(st.fill[k]){sNo();st.fill[k]=null;S.slot=k;S.wrongSet=null;S.flags.wordSay='';renderStepPanel();return}
    sTap();S.slot=k;renderStepPanel();
  })});
  /* 낱말 — 고른 칸(없으면 첫 빈칸)에 꽂는다 */
  $('#rscroll').querySelectorAll('[data-w]').forEach(function(b){b.addEventListener('click',function(){
    var w=b.dataset.w,k=S.slot;
    if(k==null||st.fill[k]){k=-1;c.fill.blanks.forEach(function(x,j){if(k<0&&!st.fill[j])k=j})}
    if(k<0){sNo();toast('빈칸이 다 찼어요. 빈칸을 눌러 비운 뒤 넣으세요');return}
    var was=stepDone(i);
    st.fill[k]=w;S.wrongSet=null;sStamp();
    S.flags.wordSay='';
    if(S.easy&&!blankOK(c,k,w))
      S.flags.wordSay='<div class="say">'+mface('def')+'<b>망고</b> "'+whyWord(c,k,w)+'"</div>';
    /* 다음 빈칸으로 손을 옮겨 둔다 */
    S.slot=-1;c.fill.blanks.forEach(function(x,j){if(S.slot<0&&!st.fill[j])S.slot=j});if(S.slot<0)S.slot=null;
    renderStepPanel();autoNext(i,was);
  })});
  updateAct();   /* 빈칸만 바뀌어도 제출 단추가 살아나야 한다 */
}
/* 방금 다 채운 단계라면 다음 빈 단계로 저절로 — 칩을 누르러 갈 일이 없다 */
function autoNext(i,was){
  if(was||!stepDone(i))return;
  var nx=-1;C.steps.forEach(function(x,k){if(nx<0&&k!==i&&!stepDone(k))nx=k});
  if(nx<0)return;
  setTimeout(function(){
    if(S.screen==='invest'&&S.mode==='logic'&&S.phase==='chain'&&S.open===i){
      sPage();S.open=nx;S.slot=null;S.flags.pickSay='';S.flags.wordSay='';renderChain();
    }},900);
}
function addStepClue(id){closeSheet();pickShelf(id)}

/* ---- 왼쪽: 시간표 판 (사건 파일의 board.kind === "timeline") ----
   시간 띠 위에 카드를 놓는다. 해 뜨기 전은 어둡게 칠해 두어 「그림자가 없다」를 눈으로 보여 준다.
   고정 카드(fix)는 처음부터 놓여 있고, 나머지는 아래 쟁반에서 끌어(또는 눌러) 놓는다. */
var TLD={drag:null};
function renderBoardStep(i){
  var k=(C.steps[i].board||{}).kind||'timeline';
  if(k==='plan')return renderPlanStep(i);
  if(k==='wind')return renderWindStep(i);
  if(k==='trail')return renderTrailStep(i);
  return renderTimelineStep(i);
}
function renderTimelineStep(i){
  var c=C.steps[i],b=c.board,st=S.steps[i];st.tl=st.tl||{};
  var f=mins(b.from),t=mins(b.to),span=t-f,sun=b.sunrise?mins(b.sunrise):null;
  var pct=function(m){return (m-f)/span*100};
  var pctC=function(m){return Math.max(7,Math.min(93,pct(m)))};   /* 카드가 가장자리에서 잘리지 않게 */
  var h='<div class="tlwrap" id="tlwrap"><div class="tlhd"><b>그날 아침 시간표</b><span class="muted">카드를 시간 위에 놓아 보세요</span></div>';
  h+='<div class="rail" id="rail">';
  if(sun!=null)h+='<div class="night" style="width:'+pct(sun)+'%"></div><div class="sunmark" style="left:'+pct(sun)+'%"><i></i><span>일출 '+esc(b.sunrise)+'</span></div>';
  for(var m=Math.ceil(f/60)*60;m<=t;m+=60)h+='<div class="tick" style="left:'+pct(m)+'%"><span>'+(m/60)+'시</span></div>';
  var lane=0;
  b.events.forEach(function(e){
    var tm=e.fix?mins(e.fix):st.tl[e.id];
    if(tm==null)return;
    var bad=!e.fix&&((e.after&&tm<mins(e.after))||(e.before&&tm>mins(e.before)));
    h+='<div class="ev'+(e.fix?' fix':' mov')+(bad&&(S.easy||S.wrongSet)?' bad':'')+'" data-ev="'+e.id+'" style="left:'+pctC(tm)+'%;top:calc(var(--lanetop) + '+(lane%5)+' * var(--laneh))">'+
       '<span class="who w-'+(e.who||'x')+'"></span>'+esc(e.t)+(e.fix?'':'<small>'+hhmm(tm)+'</small>')+'</div>';
    lane++;
  });
  h+='</div>';
  h+='<div class="tray" id="tray">';
  b.events.forEach(function(e){
    if(e.fix||st.tl[e.id]!=null)return;
    h+='<button class="ev mov tray-ev" data-ev="'+e.id+'"><span class="who w-'+(e.who||'x')+'"></span>'+esc(e.t)+'</button>';
  });
  h+='</div>';
  h+='<p class="muted" id="tl-tip">'+(TLD.pick?'이제 <b>시간 띠</b>를 눌러 놓을 자리를 고르세요':'카드를 누른 뒤 시간 띠를 누르거나, 카드를 끌어다 놓으세요')+'</p>';
  h+='</div>';
  $('#left').innerHTML=h;
  bindTimeline(i);
}
/* ---- 평면도 판 (board.kind === "plan") — 사건 1의 밀실 ----
   위에서 본 방. 드나들 수 있는 자리마다 「무엇이 막고 있나」를 맞춰 넣는다.
   셋을 다 막으면 「밖에서 들어온 사람은 없다」가 손으로 완성된다.
   그림을 새로 그리지 않는다 — 방과 자리는 SVG 로 그린다(평면도는 선 몇 개면 된다). */
var PLD={pick:null};
function renderPlanStep(i){
  var c=C.steps[i],b=c.board,st=S.steps[i];st.pl=st.pl||{};
  var h='<div class="tlwrap planwrap" id="tlwrap"><div class="tlhd"><b>'+esc(b.title||'평면도')+'</b>'+
        '<span class="muted">'+esc(b.hint||'카드를 자리에 맞춰 놓으세요')+'</span></div>';
  /* 판의 바탕은 두 가지다 — 방(room)이면 네모, 줄(line)이면 바닥선.
     현장 그림과 모양이 어긋나면 안 된다(사건 4는 말뚝이 한 줄로 서 있다). */
  var shape=b.shape||'room';
  h+='<div class="plan" id="plan"><svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet">';
  if(shape==='line'){
    h+='<line class="pl-ground" x1="18" y1="126" x2="282" y2="126"/>';
    if(b.note)h+='<text class="pl-note" x="150" y="150" text-anchor="middle">'+esc(b.note)+'</text>';
  }else{
    h+='<rect class="pl-room" x="26" y="20" width="248" height="140" rx="6"/>';
    if(b.note)h+='<text class="pl-note" x="150" y="98" text-anchor="middle">'+esc(b.note)+'</text>';
  }
  (b.marks||[]).forEach(function(m){
    /* 말뚝 그림은 바닥선(y=126) 위에 선다 — 글자는 선 아래에 따로 놓는다 */
    if(m.pin)h+='<g class="pl-pin"><ellipse cx="'+m.x+'" cy="126" rx="7" ry="2.6"/>'+
      '<rect x="'+(m.x-3)+'" y="102" width="6" height="24" rx="2"/></g>';
    h+='<text class="pl-mark" x="'+m.x+'" y="'+m.y+'" text-anchor="middle">'+esc(m.t)+'</text>';
  });
  h+='</svg>';
  b.slots.forEach(function(sl){
    var put=st.pl[sl.id],card=put?(b.cards.filter(function(x){return x.id===put})[0]||{}):null;
    var bad=put&&put!==sl.ok&&(S.easy||S.wrongSet);
    h+='<div class="pslot'+(put?' on':'')+(bad?' bad':'')+'" data-slot="'+sl.id+'" '+
       'style="left:'+sl.x+'%;top:'+sl.y+'%">'+
       '<b>'+esc(sl.t)+'</b>'+
       '<span class="pput">'+(card?esc(card.t):esc(b.slotAsk||'여기를 막는 건?'))+'</span></div>';
  });
  h+='</div>';
  h+='<div class="tray" id="tray">';
  b.cards.forEach(function(x){
    var used=b.slots.some(function(sl){return st.pl[sl.id]===x.id});
    if(used)return;
    h+='<button class="ev mov tray-ev'+(PLD.pick===x.id?' sel':'')+'" data-card="'+x.id+'">'+esc(x.t)+'</button>';
  });
  h+='</div>';
  h+='<p class="muted" id="tl-tip">'+(PLD.pick?'이제 <b>막을 자리</b>를 누르세요':'카드를 누른 뒤 자리를 누르세요. 놓은 카드를 누르면 도로 빠집니다')+'</p>';
  h+='</div>';
  $('#left').innerHTML=h;
  bindPlan(i);
}
function bindPlan(i){
  var c=C.steps[i],b=c.board,st=S.steps[i];
  $('#left').querySelectorAll('[data-card]').forEach(function(el){
    el.addEventListener('click',function(){sTap();
      PLD.pick=(PLD.pick===el.dataset.card)?null:el.dataset.card;
      renderChain();});
  });
  $('#left').querySelectorAll('[data-slot]').forEach(function(el){
    el.addEventListener('click',function(){
      var id=el.dataset.slot,sl=b.slots.filter(function(x){return x.id===id})[0];
      if(st.pl[id]&&!PLD.pick){                     /* 놓은 것을 도로 뺀다 */
        sTap();delete st.pl[id];S.wrongSet=null;S.flags.judgeSay='';
        renderChain();return;
      }
      if(!PLD.pick){sNo();return toast('먼저 아래에서 카드를 고르세요')}
      var put=PLD.pick;PLD.pick=null;
      var was=stepDone(i);
      st.pl[id]=put;S.wrongSet=null;sStamp();
      /* 쉬움: 틀린 카드는 도로 튕겨 나오며 망고가 이유를 말한다 — 손으로 「안 된다」를 느끼게 */
      if(put!==sl.ok&&S.easy){
        S.flags.judgeSay='<div class="say">'+mface('def')+'<b>망고</b> '+
          (b.cards.filter(function(x){return x.id===put})[0]||{}).why||sl.why||'여기를 막는 건 그게 아니야.';
        S.flags.judgeSay+='</div>';
        renderChain();
        setTimeout(function(){delete st.pl[id];sNo();renderChain()},900);
        return;
      }
      S.flags.judgeSay='';
      renderChain();autoNext(i,was);
    });
  });
}

/* ---- 자국 판 (board.kind === "trail") — 사건 5의 도서관 바닥 ----
   위에서 본 방에 젖은 자국이 흩어져 있다. 자국은 걸을수록 작아지므로 **큰 것부터**
   차례로 누르면 걸어간 길이 실처럼 이어진다. 그림 파일은 안 쓴다 — 방·자리·자국 전부 SVG. */
function renderTrailStep(i){
  var c=C.steps[i],b=c.board,st=S.steps[i];st.tr=st.tr||[];
  var h='<div class="tlwrap planwrap trailwrap" id="tlwrap"><div class="tlhd"><b>'+esc(b.title||'바닥의 자국')+'</b>'+
        '<span class="muted">'+esc(b.hint||'큰 자국부터 차례로 누르세요')+'</span></div>';
  h+='<div class="plan trail" id="plan"><svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet">';
  h+='<rect class="pl-room" x="14" y="14" width="272" height="152" rx="6"/>';
  h+=(b.walls||'');                                   /* 문·탁자·서가 같은 붙박이(SVG 조각) */
  (b.places||[]).forEach(function(m){
    h+='<text class="pl-mark" x="'+m.x+'" y="'+m.y+'" text-anchor="middle">'+esc(m.t)+'</text>';
  });
  /* 이은 길 — 누른 순서대로 실을 긋는다 */
  var pts=st.tr.map(function(id){var m=b.marks.filter(function(x){return x.id===id})[0];return m?m.x+','+m.y:null}).filter(Boolean);
  if(pts.length>1)h+='<polyline class="tr-path" points="'+pts.join(' ')+'"/>';
  b.marks.forEach(function(m){
    var at=st.tr.indexOf(m.id);
    var wrong=at>=0&&b.order[at]!==m.id&&(S.easy||S.wrongSet);
    var r=m.r||6;
    h+='<g class="tr-mark'+(at>=0?' on':'')+(wrong?' bad':'')+'" data-mark="'+m.id+'" transform="translate('+m.x+' '+m.y+')">'+
       '<ellipse class="tr-hit" rx="'+(r+9)+'" ry="'+(r+7)+'"/>'+
       (m.kind==='boot'
         /* 장화 자국(미끼) — 네모난 굽. 물갈퀴와 한눈에 갈린다 */
         ?'<rect class="tr-wet tr-boot" x="'+(-r*0.55).toFixed(1)+'" y="'+(-r*0.8).toFixed(1)+'" width="'+(r*1.1).toFixed(1)+'" height="'+(r*1.6).toFixed(1)+'" rx="3"/>'+
          '<path class="tr-toe" d="M'+(-r*0.4).toFixed(1)+' '+(r*0.3).toFixed(1)+' h'+(r*0.8).toFixed(1)+'"/>'
         :'<ellipse class="tr-wet" rx="'+r+'" ry="'+(r*0.72).toFixed(1)+'"/>'+
          /* 물갈퀴 발 — 자국 안의 작은 세 갈래 */
          '<path class="tr-toe" d="M'+(-r*0.45).toFixed(1)+' 1 L0 '+(-r*0.5).toFixed(1)+' L'+(r*0.45).toFixed(1)+' 1 M0 '+(-r*0.5).toFixed(1)+' L0 '+(r*0.35).toFixed(1)+'"/>')+
       (at>=0?'<circle class="tr-no" r="7" cx="'+(r*0.8+4).toFixed(1)+'" cy="'+(-r*0.8-2).toFixed(1)+'"/><text class="tr-not" x="'+(r*0.8+4).toFixed(1)+'" y="'+(-r*0.8+1.5).toFixed(1)+'" text-anchor="middle">'+(at+1)+'</text>':'')+
       '</g>';
  });
  h+='</svg></div>';
  h+='<p class="muted" id="tl-tip">'+(st.tr.length?('이은 자국 <b>'+st.tr.length+' / '+b.order.length+'</b> · 마지막 것을 다시 누르면 도로 풀려요'):'제일 <b>큰</b> 자국부터 누르세요. 물 자국은 걸을수록 작아져요')+'</p>';
  h+='</div>';
  $('#left').innerHTML=h;
  bindTrail(i);
}
function bindTrail(i){
  var c=C.steps[i],b=c.board,st=S.steps[i];
  $('#left').querySelectorAll('[data-mark]').forEach(function(el){
    el.addEventListener('click',function(){
      var id=el.dataset.mark,at=st.tr.indexOf(id);
      if(at>=0){
        if(at===st.tr.length-1){sTap();st.tr.pop();S.wrongSet=null;S.flags.judgeSay='';renderChain()}
        else{sNo();toast('마지막에 이은 자국부터 풀 수 있어요')}
        return;
      }
      if(st.tr.length>=b.order.length){sNo();return toast('자국은 다 이었어요. 틀린 게 있으면 마지막 것부터 풀어요')}
      var was=stepDone(i),k=st.tr.length;
      st.tr.push(id);S.wrongSet=null;sStamp();
      /* 쉬움: 순서가 틀리면 실이 도로 풀리며 망고가 이유를 말한다 */
      if(b.order[k]!==id&&S.easy){
        var m=b.marks.filter(function(x){return x.id===id})[0]||{},want=b.marks.filter(function(x){return x.id===b.order[k]})[0]||{};
        var msg=b.order.indexOf(id)<0?'그건 이 발자국이 아니야 — 모양을 봐.':
                (m.r||0)>(want.r||0)?'그건 벌써 지난 자국이야 — 더 작은 게 다음이지.':'더 <b>큰</b> 자국이 아직 남아 있어. 물 자국은 걸을수록 작아지니까.';
        S.flags.judgeSay='<div class="say">'+mface('def')+'<b>망고</b> '+(m.why||msg)+'</div>';
        renderChain();
        setTimeout(function(){st.tr.pop();sNo();renderChain()},1100);
        return;
      }
      S.flags.judgeSay='';
      renderChain();autoNext(i,was);
    });
  });
}

/* ---- 바람 판 (board.kind === "wind") — 사건 2 ----
   위에서 본 게시판 둘레. 낙엽 더미와 흩어진 조각이 어느 쪽에 쌓였는지 그려 두고,
   화살표를 돌려 바람이 불어온 쪽을 정한다. 한쪽만 설명하는 방향은 틀린다. */
function renderWindStep(i){
  var c=C.steps[i],b=c.board,st=S.steps[i];
  var cur=b.dirs.filter(function(d){return d.id===st.wd})[0]||null;
  var h='<div class="tlwrap windwrap" id="tlwrap"><div class="tlhd"><b>'+esc(b.title||'간밤의 바람')+'</b>'+
        '<span class="muted">'+esc(b.hint||'화살표를 돌려 보세요')+'</span></div>';
  h+='<div class="wind" id="wind"><svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet">'+
     '<rect class="pl-room" x="20" y="16" width="260" height="148" rx="6"/>'+
     '<rect class="wd-board" x="118" y="30" width="64" height="16" rx="3"/>'+
     '<text class="pl-mark" x="150" y="26" text-anchor="middle">게시판</text>';
  (b.piles||[]).forEach(function(pl){
    h+='<g class="wd-pile"><circle cx="'+pl.x+'" cy="'+pl.y+'" r="'+(pl.r||16)+'"/>'+
       '<text class="pl-mark" x="'+pl.x+'" y="'+(pl.y+(pl.r||16)+11)+'" text-anchor="middle">'+esc(pl.t)+'</text></g>';
  });
  if(cur)h+='<g class="wd-arrow" transform="translate(150,104) rotate('+cur.deg+')">'+
     '<line x1="0" y1="-52" x2="0" y2="40"/>'+
     '<path d="M-9 30 L0 46 L9 30 Z"/></g>';
  h+='</svg></div>';
  h+='<div class="tray wdtray" id="tray">';
  b.dirs.forEach(function(d){
    h+='<button class="ev mov tray-ev wdbtn'+(st.wd===d.id?' sel':'')+'" data-dir="'+d.id+'">'+
       '<span class="wdi" style="transform:rotate('+d.deg+'deg)">↓</span>'+esc(d.t)+'</button>';
  });
  h+='</div>';
  h+='<p class="muted" id="tl-tip">'+(b.tip||'바람이 불어온 쪽을 고르세요. 낙엽과 조각이 <b>둘 다</b> 설명돼야 해요')+'</p>';
  h+='</div>';
  $('#left').innerHTML=h;
  $('#left').querySelectorAll('[data-dir]').forEach(function(el){
    el.addEventListener('click',function(){
      sTap();
      st.wd=el.dataset.dir;S.wrongSet=null;sStamp();
      if(st.wd!==b.answer&&S.easy){
        /* 쉬움: 틀린 방향은 화살표를 보여 준 뒤 도로 풀린다 — 왜 아닌지 눈으로 보고 다시 고른다 */
        var d=b.dirs.filter(function(x){return x.id===st.wd})[0]||{};
        S.flags.judgeSay='<div class="say">'+mface('def')+'<b>망고</b> '+(d.why||'그 방향은 둘 중 하나밖에 설명 못 해.')+'</div>';
        renderChain();
        setTimeout(function(){st.wd=null;sNo();renderChain()},1400);
        return;
      }
      S.flags.judgeSay='';
      /* 한 번 누르면 끝나는 판은 **저절로 넘어가지 않는다.** 고른 순간 화면이 튀면
         화살표가 그려진 것을 볼 틈도, 마음을 바꿀 틈도 없다. 단계 칩으로 직접 넘어간다. */
      renderChain();
    });
  });
}
function bindTimeline(i){
  var c=C.steps[i],b=c.board,st=S.steps[i],rail=$('#rail');if(!rail)return;
  var f=mins(b.from),t=mins(b.to),stp=b.step||5;
  function place(id,clientX){
    var R=rail.getBoundingClientRect();
    var m=f+(clientX-R.left)/R.width*(t-f);m=Math.round(m/stp)*stp;m=Math.max(f,Math.min(t,m));
    var e=b.events.filter(function(x){return x.id===id})[0];if(!e||e.fix)return;
    var was=stepDone(i);
    st.tl[id]=m;S.wrongSet=null;sStamp();TLD.pick=null;
    S.flags.pickSay='';
    var bad=(e.after&&m<mins(e.after))||(e.before&&m>mins(e.before));
    if(bad&&S.easy){
      /* 쉬움: 카드가 미끄러져 돌아온다 — 손으로 「안 된다」를 느끼게 */
      S.flags.pickSay='<div class="say">'+mface('def')+'<b>망고</b> "'+(e.why||'거기는 아니야.')+'"</div>';
      renderChain();
      var el=$('#rail [data-ev="'+id+'"]');if(el){el.classList.add('slide');setTimeout(function(){delete st.tl[id];renderChain()},900)}
      return;
    }
    renderChain();autoNext(i,was);
  }
  /* 누르기 방식 */
  $('#left').querySelectorAll('.tray-ev').forEach(function(el){
    el.addEventListener('click',function(){sTap();TLD.pick=el.dataset.ev;renderBoardStep(i);
      $('#left').querySelectorAll('.tray-ev').forEach(function(x){x.classList.toggle('sel',x.dataset.ev===TLD.pick)})});
  });
  rail.addEventListener('click',function(e){
    if(TLD.drag)return;
    var ev=e.target.closest('[data-ev]');
    if(ev&&ev.classList.contains('mov')){TLD.pick=ev.dataset.ev;$('#tl-tip').innerHTML='이제 <b>시간 띠</b>를 눌러 옮길 자리를 고르세요';return}
    if(TLD.pick)place(TLD.pick,e.clientX);
  });
  /* 끌기 방식 */
  $('#left').querySelectorAll('.ev.mov').forEach(function(el){
    el.addEventListener('pointerdown',function(e){
      TLD.drag={id:el.dataset.ev,x0:e.clientX,y0:e.clientY,moved:false};el.setPointerCapture(e.pointerId);
      el.classList.add('lift');
    });
    el.addEventListener('pointermove',function(e){
      var d=TLD.drag;if(!d||d.id!==el.dataset.ev)return;
      if(Math.hypot(e.clientX-d.x0,e.clientY-d.y0)>6)d.moved=true;
      if(d.moved)el.style.transform='translate('+(e.clientX-d.x0)+'px,'+(e.clientY-d.y0)+'px)';
    });
    el.addEventListener('pointerup',function(e){
      var d=TLD.drag;if(!d||d.id!==el.dataset.ev)return;
      el.classList.remove('lift');el.style.transform='';
      var R=rail.getBoundingClientRect(),inRail=e.clientY>=R.top-20&&e.clientY<=R.bottom+20&&e.clientX>=R.left&&e.clientX<=R.right;
      var moved=d.moved;TLD.drag=null;
      if(moved&&inRail){place(el.dataset.ev,e.clientX);}
      else if(moved){/* 띠 밖에 놓으면 쟁반으로 돌아간다 */ if(st.tl[el.dataset.ev]!=null){delete st.tl[el.dataset.ev];S.wrongSet=null;renderChain()} }
    });
  });
}
/* 제출 — 여기서만 채점한다 */
function judgeChain(){
  var wrong=[];
  C.steps.forEach(function(c,i){
    var st=S.steps[i],ok;
    if(c.board)ok=boardOK(i);
    else if(c.fill)ok=clueOK(i)&&fillOK(i);
    else ok=clueOK(i)&&c.opts[st.opt].ok;
    if(!ok)wrong.push(i);
  });
  /* 어긋난 까닭이 「아직 못 찾은 단서」라면 그건 추리를 틀린 게 아니다.
     제출 횟수도 등불도 쓰지 않고, 무엇을 하러 가야 하는지만 알려 준다. */
  var lack=wrong.filter(function(w){return needMissing(w).length});
  if(lack.length){
    sNo();S.lastWrong=null;S.wrongSet=lack;
    S.flags.judgeSay='<div class="say">'+mface('def')+'<b>망고</b> "잠깐 — 아직 <b>찾지 못한 단서</b>가 있어."<br>'+
      stepNos(lack)+' 단계는 지금 수첩에 있는 것만으로는 채울 수 없어. <b>현장</b>을 더 살펴보고 오자. '+
      '<span class="muted">제출 횟수에는 넣지 않을게.</span></div>';
    S.open=lack[0];renderChain();return;
  }
  S.tries++;
  if(!wrong.length){
    sFan();S.wrongSet=null;S.lastWrong=null;S.phase='elim';S.open=null;
    S.flags.judgeSay='';
    renderLogic();
    say2(mface('joy')+'<b>망고</b> "좋아. 여기까지는 <b>빈틈이 없어.</b><br>이제 남은 일은 — 이 조건에 맞지 않는 사람을 하나씩 지우는 거야."');
    return;
  }
  sBad();if(S.tries>1)burn();          // 첫 실패는 등불을 쓰지 않는다
  S.lastWrong=wrong;
  var lv=helpLv(S.tries);
  S.wrongSet=(lv>=1)?wrong:null;
  var head=mface('fl')+'<b>망고</b> "'+(wrong.length===1?'한 군데':wrong.length+'군데')+'가 어긋나."';
  if(lv>=2){
    var body='';
    wrong.forEach(function(w){body+='<br><b>'+(w+1)+'번</b> — '+whyWrongStep(w)});
    S.flags.judgeSay='<div class="say">'+head+body+'</div>';
  }else if(lv>=1){
    S.flags.judgeSay='<div class="say">'+head+' <span class="muted">빨간 단계를 다시 봐.</span><br><span class="muted">한 번 더 어긋나면 이유까지 알려 줄게.</span></div>';
  }else{
    S.flags.judgeSay='<div class="say">'+head+'<br><span class="muted">막히면 위쪽 💡 등불을 눌러 물어봐도 돼요. 다시 제출해도 잃는 건 없어요.</span></div>';
  }
  S.open=wrong[0];renderChain();     /* 어긋난 첫 단계로 바로 데려간다 */
}
/* 도움 수위: 쉬움은 항상 최대, 보통도 두 번 틀리면 위치, 세 번이면 이유까지 */
function helpLv(nFail){if(S.easy)return 2;if(nFail>=3)return 2;if(nFail>=2)return 1;return 0}
function whyWrongStep(w){
  var c=C.steps[w],st=S.steps[w];
  if(c.board)return boardK(c).why(c.board,st);
  if(!clueOK(w))return c.whyClue;
  if(c.fill){
    for(var k=0;k<c.fill.blanks.length;k++){
      var w2=(st.fill||[])[k];
      if(!blankOK(c,k,w2))return whyWord(c,k,w2);
    }
    return '';
  }
  return c.opts[st.opt].why||'그 결론은 이 단서만으로는 나오지 않아요.';
}
/* 빈칸에 넣은 낱말이 왜 아닌가 — 딴 데 들어갈 말이면 자리 이야기, 아예 아닌 말이면 데이터의 why */
function whyWord(c,k,w){
  if(!w)return '빈칸이 비어 있어요.';
  var ex=(c.fill.extra||[]).filter(function(x){return x.w===w})[0];
  if(ex)return ex.why;
  var other=c.fill.blanks.some(function(b,j){return j!==k&&blankOK(c,j,w)});
  if(other)return '「'+esc(w)+'」'+josa(w,'은','는')+' 이 문장에 들어가는 말이지만 <b>자리</b>가 달라요.';
  return '「'+esc(w)+'」는 이 물음과 이어지지 않아요.';
}
function say2(html){
  var el=$('#rscroll');if(!el)return;
  var d=document.createElement('div');d.className='say';el.insertBefore(d,el.firstChild);
  typeHTML(d,html,'mango');
}

/* ---------- 2단계: 소거 ---------- */
function renderElim(){
  var h='<div class="chain" id="chain">';
  /* 추리를 통과한 뒤 소거 화면 머리에 붙는 요약 — 사건 파일의 elimIntro */
  if(C.elimIntro)h+='<div class="concl small">지금까지: '+C.elimIntro+'</div>';
  C.elim.forEach(function(e,i){
    var v=S.elim[e.id],wrong=S.wrongSet&&S.wrongSet.indexOf(i)>=0;
    h+='<button class="link step'+(v!=null?' done':'')+(wrong?' bad':'')+(S.open===i?' open':'')+'" data-s="'+i+'">'+
      '<span class="no">'+(v!=null?'✕':'?')+'</span><b>'+esc(e.name)+'</b>'+
      '<div class="mini">'+(v!=null?'<span class="tag opt">'+e.opts[v].t.replace(/<[^>]+>/g,'')+'</span>':'<span class="tag empty">지울 이유 —</span>')+'</div></button>';
  });
  h+='</div>';
  $('#left').innerHTML='<div class="logicwrap">'+h+'</div>';
  $('#chain').querySelectorAll('[data-s]').forEach(function(b){b.addEventListener('click',function(){sTap();S.open=+b.dataset.s;renderElim()})});
  if(S.open==null){
    var n=C.elim.filter(function(e){return S.elim[e.id]!=null}).length;
    $('#rscroll').innerHTML='<div class="card" style="background:#fff8e7"><div class="who">소거 — 지울 이유를 고르세요</div>'+
      '<p style="margin:0;font-size:13px">'+(C.elimSay||'「그럴 사람이 아니다」는 이유가 될 수 없어요. <b>물건이나 몸으로 증명되는</b> 이유만 사람을 지울 수 있습니다.')+'</p></div>'+
      '<p class="muted" style="margin-top:8px">'+n+' / '+C.elim.length+' '+(C.elimUnit||'명')+' 지움'+(S.elimTries?' · 제출 '+S.elimTries+'회':'')+'</p>'+(S.flags.judgeSay||'');
  }else{
    var e=C.elim[S.open],h2='<div class="card"><div class="who">'+esc(e.name)+'</div><p style="margin:0;font-size:13px" id="q-live"></p></div><div class="pick">';
    e.opts.forEach(function(o,k){h2+='<button class="opt'+(S.elim[e.id]===k?' on':'')+'" data-o="'+k+'"><span class="dot"></span><span>'+o.t+'</span></button>'});
    h2+='</div><button class="btn ghost" id="step-close" style="margin-top:8px">목록으로</button>';
    $('#rscroll').innerHTML=h2;$('#rscroll').scrollTop=0;
    typeHTML($('#q-live'),e.q,'mango');
    $('#rscroll').querySelectorAll('[data-o]').forEach(function(b){b.addEventListener('click',function(){sStamp();S.elim[e.id]=+b.dataset.o;S.wrongSet=null;renderElim()})});
    $('#step-close').addEventListener('click',function(){sTap();S.open=null;renderElim()});
  }
  updateAct();
}
function judgeElim(){
  S.elimTries++;
  var wrong=[];
  C.elim.forEach(function(e,i){if(!e.opts[S.elim[e.id]].ok)wrong.push(i)});
  if(!wrong.length){
    sFan();S.wrongSet=null;S.lastWrong=null;S.phase='replay';S.open=null;S.flags.judgeSay='';S.rep=[];renderLogic();
    say2('<b>망고</b> "남은 건 하나뿐이야. …말해 봐."');
    return;
  }
  sBad();if(S.elimTries>1)burn();
  S.lastWrong=wrong;
  var lv2=helpLv(S.elimTries);
  S.wrongSet=(lv2>=1)?wrong:null;
  var h2='<b>망고</b> "<b>'+wrong.length+'명</b>은 그 이유로 지울 수 없어."';
  if(lv2>=2){var body2='';wrong.forEach(function(w){body2+='<br><b>'+esc(C.elim[w].name)+'</b> — '+C.elim[w].opts[S.elim[C.elim[w].id]].why});
    S.flags.judgeSay='<div class="say">'+h2+body2+'</div>'}
  else if(lv2>=1){S.flags.judgeSay='<div class="say">'+h2+' <span class="muted">빨간 쪽을 다시 봐.</span></div>'}
  else{S.flags.judgeSay='<div class="say">'+h2+' 「본인이 그렇게 말했으니까」는 이유가 못 돼.<br><span class="muted">다시 골라도 잃는 건 없어요.</span></div>'}
  S.open=null;renderElim();
}

/* ---------- 3단계: 지목 ---------- */
/* ---------- 3단계: 재현 ----------
   예전에는 「범인은 누구입니까?」 목록에서 이름을 골랐다. 추리 마지막 단계에서 이미 답이 나오므로
   같은 답을 한 번 더 고르는 셈이었다 — 지루하고, 배우는 것도 없었다(2026-09-21 사용자 지적).
   이제는 **그날 있었던 일을 네 장면으로 늘어놓는다.** 순서가 곧 답이고, 맞히면 장면이 이어져 재생된다. */
function replayCuts(){return (C.replay&&C.replay.cuts)||[]}
function replayReady(){return S.rep.length===replayCuts().length}
/* 섞는 순서는 사건마다 고정 — 다시 들어와도 같아야 손이 헷갈리지 않는다 */
function replayOrder(){
  var n=replayCuts().length,a=[];for(var i=0;i<n;i++)a.push(i);
  return a.map(function(i){return {i:i,r:seedRand(i*13+(C.no||1)*29+5)}})
          .sort(function(x,y){return x.r-y.r}).map(function(x){return x.i});
}
function cutArt(cut,small){
  var bg=cut.bg||(C.replay&&C.replay.bg)||C.sceneImg;
  var h='<div class="cutart'+(small?' sm':'')+'">';
  if(artOK(bg))h+='<div class="cutbg" style="background-image:url(\''+artURL(bg)+'\');background-position:'+(cut.bgPos||'50% 50%')+';background-size:'+(cut.zoom||140)+'% auto"></div>';
  else h+='<div class="cutbg plain"></div>';
  var fx=' '+(cut.fx||'')+' ';
  if(fx.indexOf(' night ')>=0)h+='<div class="cutfx night"></div>';
  if(fx.indexOf(' dawn ')>=0)h+='<div class="cutfx dawn"></div>';
  (cut.figs||[]).forEach(function(f){
    if(!artOK(f.img))return;
    if(!artOK(f.img))return;            /* 아직 없는 그림은 건너뛴다 — 깨진 아이콘보다 빈 자리가 낫다 */
    h+='<img class="cutfig" src="'+artURL(f.img)+'" alt="" style="left:'+f.x+'%;top:'+f.y+'%;height:'+f.s+'%'+(f.flip?';transform:translate(-50%,-50%) scaleX(-1)':'')+'">';
  });
  return h+'</div>';
}
function renderReplay(){
  var cuts=replayCuts(),ord=replayOrder();
  var h='<div class="replaywrap"><div class="rphd"><b>사건 재현</b><span class="muted">일어난 순서대로 누르세요</span>'+
        (S.rep.length?'<button class="mini" id="rp-clear">다시</button>':'')+'</div>';
  h+='<div class="cuts">';
  ord.forEach(function(i){
    var pos=S.rep.indexOf(i);
    h+='<button class="cutcard'+(pos>=0?' on':'')+(S.flags.repBad&&S.flags.repBad.indexOf(i)>=0?' bad':'')+'" data-cut="'+i+'">'+
       cutArt(cuts[i],true)+
       '<span class="cutno">'+(pos>=0?(pos+1):'')+'</span>'+
       '<span class="cutt">'+cuts[i].t+'</span></button>';
  });
  h+='</div></div>';
  $('#left').innerHTML=h;
  $('#left').querySelectorAll('[data-cut]').forEach(function(b){
    b.addEventListener('click',function(){
      var i=+b.dataset.cut,at=S.rep.indexOf(i);
      if(at>=0){sNo();S.rep.splice(at,1)}else{sStamp();S.rep.push(i)}
      S.flags.repBad=null;renderReplay();
    });
  });
  var cl=$('#rp-clear');if(cl)cl.addEventListener('click',function(){sTap();S.rep=[];S.flags.repBad=null;renderReplay()});
  var h2='<div class="card" style="background:#fff8e7"><div class="who">'+mface('def')+'마지막이야</div>'+
    '<p style="margin:0;font-size:13px">'+((C.replay&&C.replay.ask)||'무슨 일이 있었는지 순서대로 늘어놓아 봐.')+'</p></div>';
  if(C.concl)h2+='<div class="concl small" style="margin-top:8px">'+C.concl+'</div>';
  h2+='<p class="muted" style="margin-top:8px">'+S.rep.length+' / '+cuts.length+' 장면'+(S.repTries?' · 재현 '+S.repTries+'회':'')+'</p>';
  h2+=(S.flags.judgeSay||'');
  $('#rscroll').innerHTML=h2;
  updateAct();
}
function judgeReplay(){
  var cuts=replayCuts();
  S.repTries++;
  var bad=[];S.rep.forEach(function(v,k){if(v!==k)bad.push(v)});
  if(!bad.length){
    sFan();S.flags.judgeSay='';S.flags.repBad=null;playReplay();return;
  }
  sBad();if(S.repTries>1)burn();
  S.flags.repBad=bad;
  /* 어디가 어긋났는지 — 첫 번째로 자리가 틀린 장면만 짚어 준다. 전부 알려 주면 풀 게 없다. */
  var first=-1;S.rep.forEach(function(v,k){if(first<0&&v!==k)first=k});
  var lv=helpLv(S.repTries);
  var head=mface('fl')+'<b>망고</b> "순서가 조금 어긋났어."';
  if(lv>=2)S.flags.judgeSay='<div class="say">'+head+'<br><b>'+(first+1)+'번째</b>에 놓은 「'+esc(cuts[S.rep[first]].t.replace(/<[^>]+>/g,'').slice(0,18))+'…」 — 이게 정말 그때 일어난 일일까?</div>';
  else if(lv>=1)S.flags.judgeSay='<div class="say">'+head+' <span class="muted">빨간 장면을 다시 봐. 한 번 더 어긋나면 어디인지 짚어 줄게.</span></div>';
  else S.flags.judgeSay='<div class="say">'+head+'<br><span class="muted">시각과 원인을 생각해 봐. 다시 놓아도 잃는 건 없어.</span></div>';
  S.rep=[];renderReplay();
}
/* 맞혔다 — 네 장면을 차례로 크게 보여 준 뒤 해결 화면으로 */
function playReplay(){
  var cuts=replayCuts(),i=0;
  S.playing=true;setMood('resolve');
  function frame(){
    if(i>=cuts.length){S.playing=false;setTimeout(accuse,500);return}
    var c=cuts[i];
    $('#left').innerHTML='<div class="replaywrap playing"><div class="bigcut">'+cutArt(c)+
      '<div class="cutcap"><span class="n">'+(i+1)+'</span>'+c.t+'</div></div></div>';
    $('#rscroll').innerHTML='<div class="card" style="background:#fff8e7"><div class="who">'+mface('joy')+'그날 아침은 이랬다</div>'+
      '<p style="margin:0;font-size:13px">'+(i+1)+' / '+cuts.length+'</p></div>';
    sPage();beep([392+i*98],.16,'triangle',.09);
    i++;setTimeout(frame,1900);
  }
  frame();
  updateAct();
}
/* ================= 트레이 ================= */
function openTray(kind){
  var r=$('#right');var old=$('#sheet');if(old)old.remove();
  var d=document.createElement('div');d.className='sheet';d.id='sheet';
  var title={present:'어떤 단서를 들이댈까요?',step:'근거가 될 단서 고르기'}[kind];
  var ctx='';
  if(kind==='step'&&S.open!=null){var c=C.steps[S.open];ctx='<div class="ctx">'+(S.open+1)+'. '+esc(c.t)+' — <b>'+c.q.replace(/<[^>]+>/g,'')+'</b></div>';
    if(needMissing(S.open).length)ctx+='<div class="ctx bad"><b>이 단계에 필요한 단서가 아직 수첩에 없어요.</b> 현장을 더 조사하고 오세요 — 여기 있는 것만으로는 채워지지 않아요.</div>'}
  if(kind==='present'){var L=null;C.suspects[S.tab].lines.forEach(function(x){if(x.id===S.sel)L=x});
    if(L)ctx='<div class="ctx"><span class="lead"><b>'+esc(C.suspects[S.tab].name)+'</b>의 말<br></span>'+
      '<span class="quo">"'+esc(L.t)+'"</span>'+
      '<span class="lead"><br>이 말과 <b>어긋나는</b> 단서를 고르세요.</span></div>'}
  var h='<div class="hd"><span>'+title+'</span><button id="sheet-x">닫기</button></div>'+ctx+
        '<div class="list"><div class="clues">';
  var any=false;
  C.order.forEach(function(id){if(S.found[id]){any=true;h+=cardHTML(id,false,true)}});
  h+='</div>'+(any?'':'<p class="muted">아직 단서가 없어요. 현장을 먼저 조사하세요.</p>')+
     '<div id="traydet" class="traydet"><p class="muted taway">카드를 누르면 <b>무슨 내용이었는지</b> 보여 줘요. 읽어 보고 맞다 싶으면 그때 들이대세요.</p></div>'+
     '</div><div class="trayfoot" id="trayfoot" hidden></div>';
  d.innerHTML=h;r.appendChild(d);
  $('#sheet-x').addEventListener('click',function(){sTap();S.active=null;S.tsel=null;closeSheet();if(S.mode==='logic')renderLogic()});

  /* 예전에는 카드를 누르는 순간 곧바로 들이댔다. 무슨 단서였는지 다시 볼 길이 없어서
     이름만 보고 찍게 되고, 잘못 누르면 그대로 한 번을 날렸다.
     이제 한 번 눌러 **내용을 읽고**, 아래 단추로 확정한다. 수첩과 같은 모양으로 보여 준다. */
  function showDet(id){
    S.tsel=id;
    var c=C.clues[id],box=$('#traydet');
    var pic=(c.photo&&artOK(c.photo))?'<img class="cluephoto" src="'+artURL(c.photo)+'" alt="">':'';
    /* 제목 줄에 아이콘을 넣으면 크게 들어가 글자를 밀어낸다 — 수첩과 같이 이름만 쓴다 */
    box.innerHTML='<div class="card detcard'+(c.testi?' testi':'')+'">'+
      '<div class="who">'+esc(c.n)+'<small class="kind">'+(c.testi?'증언':'물증')+'</small></div>'+pic+
      '<p class="dett">'+c.t+'</p></div>';
    /* 고르는 화면과 읽는 화면을 나눈다. 둘을 한 화면에 쌓으면 작은 화면에서 글이 단추에 가린다.
       단추는 **스크롤 영역 밖**에 둔다 — 안에 두면 짧은 화면에서 글 위에 겹친다. */
    var ft=$('#trayfoot');
    ft.hidden=false;
    ft.innerHTML='<button class="act ghost" id="tray-back">← 다른 단서</button>'+
      '<button class="act warm" id="tray-ok">'+(kind==='present'?'이 단서를 들이댄다':'근거로 넣는다')+'</button>';
    d.classList.add('reading');
    $('#tray-ok').addEventListener('click',function(){
      sTap();var pick=S.tsel;S.tsel=null;
      if(kind==='present')present(pick);else if(kind==='step')addStepClue(pick);
    });
    $('#tray-back').addEventListener('click',function(){
      sTap();S.tsel=null;d.classList.remove('reading');
      $('#trayfoot').hidden=true;$('#trayfoot').innerHTML='';
      d.querySelectorAll('[data-c]').forEach(function(x){x.setAttribute('aria-pressed','false')});
      box.innerHTML='<p class="muted taway">카드를 누르면 <b>무슨 내용이었는지</b> 보여 줘요.</p>';
      var LL=document.querySelector('.sheet .list');if(LL)LL.scrollTop=0;
    });
    var L=document.querySelector('.sheet .list');if(L)L.scrollTop=0;
  }
  d.querySelectorAll('[data-c]').forEach(function(b){b.addEventListener('click',function(){
    sTap();
    d.querySelectorAll('[data-c]').forEach(function(x){x.setAttribute('aria-pressed','false')});
    b.setAttribute('aria-pressed','true');
    showDet(b.dataset.c);
  })});
  if(kind==='step'){var ex=document.createElement('p');ex.className='muted taway';ex.innerHTML='필요 없는 단서를 넣으면 제출할 때 어긋납니다.';$('#traydet').appendChild(ex)}
}
function closeSheet(){var s=$('#sheet');if(s)s.remove()}

/* ================= 지목 → 해결 ================= */
/* ================= 연결판 추론 이벤트 =================
   한 막(다섯 편)이 끝나면 꽂힌 단서 다섯 장으로 물음 하나에 답한다. 사건 5의 물음은
   「이 흙은 어디 흙인가?」 — 마을 지도에서 자리를 짚는다. 틀려도 벌칙은 없고, 관련 카드가
   반짝이며 망고가 왜 아닌지 말해 준다. 맞히면 도구를 얻고 진도에 남는다(시즌 것).
   지도는 데이터(places)로 그리므로 사건 10의 마지막 추론도 같은 화면을 쓴다. */
var INF={open:false,pick:null,wrong:{}};
function inferData(){return C.board&&C.board.infer}
function inferDone(){var inf=inferData();if(!inf)return null;var p=Save.loadProg();return (p.infer||{})[inf.id]||null}
function renderInferButton(){
  var box=$('#board-infer'),inf=inferData();if(!box)return;
  var pins=(C.board&&C.board.pins)||[],total=(C.board&&C.board.total)||5;
  if(!inf||pins.length<total){box.innerHTML='';return}
  var done=inferDone();
  if(done){
    var pl=(inf.map.places||[]).filter(function(x){return x.id===done})[0]||{};
    box.innerHTML='<div class="infdone"><b>'+esc(inf.title||'추론')+' 완료</b> — '+(inf.q||'')+' → <b>'+esc(pl.t||done)+'</b>'+
      (inf.reward?'<span class="tool">🔍 '+esc(inf.reward.t)+'</span>':'')+
      '<button class="mini" id="inf-again">다시 보기</button></div>';
    $('#inf-again').onclick=function(){sTap();openInfer(true)};
  }else{
    box.innerHTML='<button class="btn infbtn" id="inf-go">🧵 '+esc(inf.title||'추론')+' — '+(inf.q||'')+'</button>';
    $('#inf-go').onclick=function(){sTap();openInfer(false)};
  }
}
function villageMap(inf,solved){
  /* 마을 지도 — 강은 아래, 광장은 가운데. 자리는 데이터의 x·y(%) 로 찍는다. */
  var h='<svg class="vmap" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet">'+
    '<rect x="0" y="0" width="400" height="240" fill="#e9e4cf"/>'+
    '<path d="M0 205 C60 190 120 222 190 210 S330 196 400 214 L400 240 L0 240 Z" fill="#a9c6d3"/>'+      /* 강 */
    '<path d="M0 205 C60 190 120 222 190 210 S330 196 400 214" fill="none" stroke="#7fa3b3" stroke-width="2"/>'+
    '<path d="M40 60 L120 60 L120 110 L40 110 Z" fill="#d8cfb4" stroke="#b9a883" stroke-width="1.2"/>'+    /* 학교 터 */
    '<ellipse cx="205" cy="128" rx="78" ry="46" fill="#d5cdb2" stroke="#b9a883" stroke-width="1.2"/>'+       /* 광장 돌바닥 */
    '<path d="M120 85 L205 128 M205 128 L300 120 M205 128 L205 200 M205 128 L150 128" fill="none" stroke="#c9bd9e" stroke-width="5" stroke-linecap="round"/>'+ /* 길 */
    '<circle cx="262" cy="104" r="17" fill="#8fa66a"/><circle cx="262" cy="104" r="6" fill="#b8865a"/>'+     /* 느티나무 */
    '<rect x="150" y="98" width="12" height="30" fill="#cbb48c" stroke="#8a6a44" stroke-width="1.2"/>'+     /* 시계탑 */
    '<rect x="300" y="98" width="46" height="30" rx="2" fill="#e3d2a6" stroke="#8a6a44" stroke-width="1.2"/>'+ /* 도서관 */
    '<rect x="52" y="70" width="60" height="30" rx="2" fill="#e8d9bf" stroke="#8a6a44" stroke-width="1.2"/>';  /* 급식실 */
  (inf.map.places||[]).forEach(function(pl){
    var x=pl.x*4,y=pl.y*2.4,on=INF.pick===pl.id,bad=INF.wrong[pl.id],ok=solved&&pl.id===inf.answer;
    h+='<g class="vm-pl'+(on?' on':'')+(bad?' bad':'')+(ok?' ok':'')+'" data-place="'+pl.id+'" transform="translate('+x+' '+y+')">'+
       '<circle class="vm-hit" r="22"/><circle class="vm-dot" r="8"/>'+
       (ok?'<text class="vm-chk" y="4" text-anchor="middle">✓</text>':'')+
       '<text class="vm-t" y="22" text-anchor="middle">'+esc(pl.t)+'</text></g>';
  });
  return h+'</svg>';
}
function openInfer(review){
  var inf=inferData();if(!inf)return;
  INF.open=true;INF.pick=null;INF.wrong={};
  var done=inferDone();
  var old=$('#infer');if(old)old.remove();
  var d=document.createElement('div');d.id='infer';d.className='inferwrap';
  var pins=(C.board&&C.board.pins)||[];
  var h='<div class="infcard"><div class="infhd"><b>'+esc(inf.title||'추론')+'</b><button class="mini" id="inf-x">닫기</button></div>'+
    '<p class="infq">'+inf.q+'</p>'+
    '<div class="infpins">'+pins.map(function(p,k){
      var art=artOK(p.img)?'<img src="'+artURL(p.img)+'" alt="">':'<svg viewBox="0 0 28 28"><use href="#'+(p.sym||'i-print')+'"></use></svg>';
      return '<div class="ipin" data-pin="'+(k+1)+'">'+art+'<span>'+esc(p.t)+'</span></div>'}).join('')+'</div>'+
    '<div class="infmap" id="infmap">'+villageMap(inf,!!done)+'</div>'+
    '<div class="say infsay" id="infsay">'+mface('def')+'<b>망고</b> '+(done?inf.say:(inf.hint||'지도에서 자리를 골라 봐.'))+'</div>'+
    (done&&inf.reward?'<div class="infreward">🔍 <b>'+esc(inf.reward.t)+'</b> — '+esc(inf.reward.desc||'')+'</div>':'')+
    '</div>';
  d.innerHTML=h;
  $('#s-board').appendChild(d);
  $('#inf-x').onclick=function(){sTap();closeInfer()};
  if(!done)bindInferMap();
}
function closeInfer(){INF.open=false;var d=$('#infer');if(d)d.remove();renderInferButton()}
function bindInferMap(){
  var inf=inferData();
  $('#infmap').querySelectorAll('[data-place]').forEach(function(el){
    el.addEventListener('click',function(){
      var id=el.dataset.place;
      if(id===inf.answer){
        sGood();
        Save.markInfer(inf.id,id,inf.reward&&inf.reward.id);
        INF.pick=id;
        $('#infmap').innerHTML=villageMap(inf,true);
        $('#infsay').innerHTML=mface('joy')+'<b>망고</b> '+inf.say;
        if(inf.reward){var r=document.createElement('div');r.className='infreward';
          r.innerHTML='🔍 <b>'+esc(inf.reward.t)+'</b> — '+esc(inf.reward.desc||'');$('#infsay').after(r)}
        renderInferButton();
        return;
      }
      /* 틀림 — 벌칙 없음. 왜 아닌지 말하고, 관련 카드를 반짝인다 */
      sNo();INF.wrong[id]=1;INF.pick=id;
      var w=(inf.wrong||{})[id]||{};
      $('#infmap').innerHTML=villageMap(inf,false);bindInferMap();
      $('#infsay').innerHTML=mface('fl')+'<b>망고</b> '+(w.why||'거기는 아니야.');
      document.querySelectorAll('#infer .ipin').forEach(function(p){p.classList.remove('blink')});
      (w.blink||[]).forEach(function(n){var p=document.querySelector('#infer .ipin[data-pin="'+n+'"]');if(p)p.classList.add('blink')});
    });
  });
}

/* 해결 화면 끝의 「설명이 안 되는 것」과 연결판. 사건마다 다른 실마리가 남는다 —
   여기가 사건 1 것으로 고정돼 있으면 두 번째 사건도 같은 발자국 이야기로 끝난다. */
/* 해결 화면의 인물 그림. 사건 1의 콩순이가 박혀 있어 사건 2에서도 콩순이가 나왔다. */
function applySolveArt(){
  var box=document.querySelector('#s-solve .art'),sym=C.solve&&C.solve.art;
  if(!box||!sym)return;
  var f=artOK(sym+'-sp.png')?sym+'-sp.png':(artOK(sym+'-def.png')?sym+'-def.png':null);
  if(f)box.innerHTML='<img class="pim" src="'+artURL(f)+'" alt="">';
}
function applyEpilogue(){
  var e=C.epilogue,n=$('#solve-odd');
  if(n){
    if(e&&e.t){n.hidden=false;n.innerHTML='<b>'+(e.head||'…그런데, 설명이 안 되는 게 하나 있어요.')+'</b>'+e.t}
    else n.hidden=true;
  }
  var b=C.board||{},row=$('#board-row');
  if(row){
    var pins=b.pins||[],total=b.total||5,h='';
    pins.forEach(function(p){
      var art=artOK(p.img)?'<img src="'+artURL(p.img)+'" alt="">':'<svg viewBox="0 0 28 28"><use href="#'+(p.sym||'i-print')+'"></use></svg>';
      /* 제목과 사건 번호를 각각 감싼다 — 카드 높이를 못 박고 두 줄까지만 보이게 하려면
         스타일이 잡을 자리가 있어야 한다(전에는 <br> 하나뿐이라 높이가 제각각이었다). */
      h+='<div class="pinned">'+art+'<span class="pn">'+p.t+'</span><small>사건 '+(p.no||'?')+'</small></div>';
    });
    for(var k=pins.length;k<total;k++)h+='<div class="slot"></div>';
    row.innerHTML=h;
    var c=$('#board-count');
    if(c)c.innerHTML=pins.length+' / '+total+' · '+total+'장이 모이면 <b>추론</b>할 수 있어요';
    var say=$('#board-say');
    if(say){if(b.mango){say.hidden=false;say.innerHTML='<b>망고</b> '+b.mango}else say.hidden=true}
    renderInferButton();
    var nt=$('#board-next-t'),nw=$('#board-next-w');
    if(nt)nt.textContent='다음 사건 「'+((C.next&&C.next.title)||'?')+'」';
    if(nw)nw.innerHTML=b.when||'곧 열려요.';
    /* 사건을 풀고 나면 길이 끊기면 안 된다 — 다음 사건으로 바로 갈 수 있게 한다 */
    var nb=$('#btn-next-case'),nc=null,lst=seasonCases();
    lst.forEach(function(x){if(x.no===(C.no||1)+1)nc=x});
    if(nb){
      if(nc&&!nc.soon){nb.hidden=false;
        nb.innerHTML='사건 '+nc.no+' 「'+esc(nc.title)+'」 시작하기 ▸';
        nb.onclick=function(){sTap();sFan();Save.markOpen(nc.id);gotoCase(nc.id)};
      }else{nb.hidden=false;nb.className='btn ghost';
        nb.innerHTML=nc?('사건 '+nc.no+'은 준비 중이에요 · 📁 사건 목록 보기'):'📁 사건 목록 보기';
        nb.onclick=function(){sTap();renderCases();closeKeyBox();show('s-cases')};
      }
    }
    /* 이 사건의 기록 — 별점은 진도에 남아 사건 목록에서도 보인다 */
    var rec=$('#board-rec');
    if(rec){
      var st=S.star||caseStar();
      rec.innerHTML='<span class="recstar">'+starStr(st)+'</span>'+
        '<span class="chip">추리 제출 '+Math.max(1,S.tries)+'회</span>'+
        '<span class="chip">소거 제출 '+Math.max(1,S.elimTries)+'회</span>'+
        '<span class="chip">등불 '+S.lamps+'/3</span>'+
        '<span class="chip">재현 '+Math.max(1,S.repTries)+'회</span>';
    }
    /* 다음 사건의 열쇠말 — 기기 저장이 날아가도 이 말만 있으면 어디서든 다시 연다 */
    var nx=null,list=seasonCases();
    list.forEach(function(c){if(c.no===(C.no||1)+1)nx=c});
    if(nt&&nx&&nx.key){
      nw.innerHTML=(b.when||'곧 열려요.')+
        '<br><span style="display:inline-block;margin-top:6px">사건 파일 <b>열쇠말</b> — '+
        '<b style="font-size:16px;letter-spacing:.06em;color:var(--brick)">'+esc(nx.key)+'</b></span>'+
        '<br><span class="muted" style="font-size:11px">다른 기기에서 열 때 <b>사건 목록</b>에 이 말을 넣으면 돼요. 적어 두세요.</span>';
    }
  }
}
function caseStar(){
  var miss=(S.tries-1)+(S.elimTries-1)+Math.max(0,S.repTries-1);   // 제출 실패 횟수
  var star=3;if(miss>=1||S.rebutErr>0||S.lamps<3)star=2;if(miss>=3||S.rebutErr>=2||S.lamps<=0)star=1;
  if(S.repTries===1&&star<3)star++;          // 재현을 한 번에 맞히면 한 칸 올려 준다
  return Math.max(1,Math.min(3,star));
}
function starStr(n){var h='';for(var i=0;i<3;i++)h+=(i<n?'★':'☆');return h}
function accuse(){
  var star=caseStar();
  sFan();Save.markDone(CASE,star);S.star=star;applySolveArt();applyEpilogue();
  var coin=star===3?120:(star===2?100:80);
  $('#reward').innerHTML='<span class="chip">🪙 +'+coin+'</span><span class="chip">⭐ 명성 +3</span><span class="chip">📖 도감 +3</span>';
  show('s-solve');
  var sp=document.querySelectorAll('#stars span');sp.forEach(function(e,i){e.className='';e.textContent=i<star?'★':'☆';e.style.opacity=i<star?'':'.35'});
  $('#solve-t').innerHTML='';$('#solve-sheep').innerHTML='';
  var i=0;(function pop(){if(i<star){sp[i].classList.add('on');beep([523+i*130],.14,'triangle',.1);i++;setTimeout(pop,260)}
    else{for(var k=star;k<3;k++)sp[k].classList.add('on');
      setTimeout(function(){typeHTML($('#solve-t'),C.solve.text,'narr',function(){typeHTML($('#solve-sheep'),C.solve.sheep,C.solve.voice||'sheep')},14)},200)}})();
}

/* ================= 버튼 ================= */
function lampHint(){
  if(S.screen!=='invest')return;
  if(S.lamps<=0){sNo();return toast('등불을 다 썼어요')}
  if(S.mode!=='logic'){sNo();return toast('등불은 추리 탭에서 쓸 수 있어요')}
  if(S.phase==='replay')return toast('재현은 틀릴 때마다 힌트가 늘어나요');
  var list=S.phase==='chain'?C.steps:C.elim;
  if(S.lastWrong&&S.lastWrong.length){
    burn();sFind();S.wrongSet=S.lastWrong.slice();
    var w=S.wrongSet[0];
    S.flags.judgeSay='<div class="say"><b>망고</b> "'+(S.phase==='chain'?(w+1)+'번':esc(C.elim[w].name))+' 쪽을 다시 봐." <span class="muted">(등불 하나 사용)</span></div>';
    S.open=null;renderLogic();return;
  }
  var i=-1;
  if(S.phase==='chain'){C.steps.forEach(function(c,k){if(i<0&&!stepDone(k))i=k});
    if(i<0)return toast('다 채웠어요. 제출해 보세요');
    burn();sFind();S.flags.judgeSay='<div class="say"><b>망고</b> "'+(i+1)+'번 — '+C.steps[i].whyClue+'" <span class="muted">(등불 하나 사용)</span></div>'}
  else{C.elim.forEach(function(e,k){if(i<0&&S.elim[e.id]==null)i=k});
    if(i<0)return toast('다 골랐어요. 제출해 보세요');
    burn();sFind();S.flags.judgeSay='<div class="say"><b>망고</b> "'+esc(C.elim[i].name)+' — 「본인이 그렇게 말했으니까」는 이유가 못 돼. <b>물건이나 몸</b>으로 증명되는 걸 찾아." <span class="muted">(등불 하나 사용)</span></div>'}
  S.open=null;renderLogic();
}


/* ================= 저장 ================= */
function touch(){if(S&&S.screen==='invest'){snapFaces();Save.save(S)}}
function snapFaces(){S._eyes={};C.suspectOrder.forEach(function(id){if(C.suspects[id].eyes)S._eyes[id]=C.suspects[id].eyes})}

function restore(d){
  fresh();
  S.screen='invest';S.mode=d.mode||'scene';S.easy=d.easy;S.lamps=(d.lamps==null?3:d.lamps);
  S.found=d.found||{};S.flags=d.flags||{};S.tab=d.tab||C.suspectOrder[0];
  S.steps=d.steps||S.steps;S.elim=d.elim||{};S.rep=d.rep||[];S.repTries=d.repTries||0;
  S.phase=d.phase||'chain';S.tries=d.tries||0;S.elimTries=d.elimTries||0;
  S.accErr=d.accErr||0;S.rebutErr=d.rebutErr||0;
  if(d.eyes)C.suspectOrder.forEach(function(id){if(d.eyes[id])C.suspects[id].eyes=d.eyes[id]});
  show('invest');lamps();updateDot();setMode(S.mode);
  toast('하던 자리에서 이어서 해요');
}

/* ================= 소리 설정 ================= */
function syncSoundUI(){
  var a=$('#t-sound'),b=$('#t-music');if(a)a.textContent=A.sfx?'🔔':'🔕';if(b)b.textContent=A.music?'🎵':'🔇';
  var c=$('#tg-sfx'),d=$('#tg-bgm');
  if(c)c.setAttribute('aria-pressed',String(A.sfx));
  if(d)d.setAttribute('aria-pressed',String(A.music));
}
A.onChange=function(){putPref({s:A.sfx,m:A.music});syncSoundUI()};

/* ================= 시작 ================= */
function start(easy){
  S.easy=easy;wake();sTap();startMusic();
  (C.startClues||[]).forEach(function(id){addClue(id,true)});
  /* 표지에서 곧장 「탐정님!」으로 들어가면 누가 누군지도 모른 채 시작한다.
     사건 파일이 intro 를 선언하면 자막 몇 장을 먼저 보여 주고 브리핑으로 간다. */
  if(C.intro&&C.intro.length)runIntro(brief);else brief();
}
function brief(){
  show('s-brief');
  applyBriefArt();
  var b=C.brief||{};
  if($('#brief-who'))$('#brief-who').textContent=b.who||'';
  if($('#brief-role'))$('#brief-role').textContent=b.role||'';
  if($('#brief-note')&&b.note)$('#brief-note').innerHTML=b.note;
  $('#brief-mango').style.visibility='hidden';$('#brief-mango-t').innerHTML='';
  typeHTML($('#brief-say'),b.text,b.sym||'sheep',function(){
    $('#brief-mango').style.visibility='visible';
    typeHTML($('#brief-mango-t'),b.mango,'mango');
  },22);
}
/* 인트로 자막. 한 장씩 타자기로 나오고, 화면을 누르면 다음 장. 건너뛰기 가능. */
var INTRO={i:0,done:null};
function introArt(who){
  var box=$('#intro-art');if(!box)return;
  var f=null;
  if(who==='mango'||who==='narr')f=artOK('mango-full.png')?'mango-full.png':mangoFile('def');
  else if(who)f=artOK(who+'-def.png')?who+'-def.png':null;
  if(f)box.innerHTML='<img class="pim" src="'+artURL(f)+'" alt="">';
  else box.innerHTML='<svg viewBox="0 0 150 130"><use href="#'+(who==='narr'?'mango':(who||'mango'))+'"></use></svg>';
}
/* 인트로 화면의 「무대」. 사건마다, 장면마다 배경과 분위기를 갈아 끼운다.
   사건 1은 표지 그림 위 인물 소개, 사건 2는 밤의 게시판 → 아침 — 같은 화면이 되지 않게. */
function introFX(pg){
  return (' '+(pg.fx||'')+' ');
}
function introSkin(pg){
  var el=$('#s-intro');if(!el)return false;
  var f=pg.bg||C.introBg||C.coverImg;
  if(artOK(f)){el.classList.add('has-cover');el.style.backgroundImage='url("'+artURL(f)+'")'}
  else{el.classList.remove('has-cover');el.style.backgroundImage=''}
  /* 같은 그림이라도 어디를 얼마나 크게 보여 주느냐로 다른 장면이 된다 */
  el.style.backgroundPosition=pg.bgPos||'';
  el.style.backgroundSize=pg.bgSize||'';
  var cine=(pg.style||C.introStyle||'')==='cine';
  el.classList.toggle('cine',cine);
  var fx=introFX(pg);
  ['night','dawn','wind'].forEach(function(k){el.classList.toggle('fx-'+k,fx.indexOf(' '+k+' ')>=0)});
  windLayer(fx.indexOf(' wind ')>=0);
  /* 장면이 바뀌면 짧게 어둠에서 올라온다 — 배경 그림은 겹쳐 녹일 수 없으니 컷으로 넘긴다 */
  el.classList.remove('pgin');void el.offsetWidth;el.classList.add('pgin');
  return cine;
}
/* 바람에 날리는 잎. 사건 2의 밤 장면에서만 켠다 — 「바람」을 말하지 않고 보여 주려고. */
function windLayer(on){
  var el=$('#intro-wind');if(!el)return;
  el.hidden=!on;
  if(!on||el.childElementCount)return;
  var h='';
  for(var i=0;i<9;i++){
    var top=(4+i*11)%88, dur=(4.4+(i%4)*1.5).toFixed(1), del=(-i*1.4).toFixed(1),
        sc=(.55+(i%3)*.3).toFixed(2), tone=['#b9762f','#8d5a2b','#c69a3d'][i%3];
    h+='<i style="top:'+top+'%;background:'+tone+';--sc:'+sc+';animation-duration:'+dur+'s;animation-delay:'+del+'s"></i>';
  }
  el.innerHTML=h;
}
function introPage(){
  var pg=C.intro[INTRO.i],last=INTRO.i===C.intro.length-1;
  var who=pg.who||'narr';
  var cine=introSkin(pg);
  if(!cine)introArt(who);
  $('#intro-day').textContent=pg.day||C.intro[0].day||'';
  var nm={mango:'망고',narr:''}[who];
  if(nm===undefined)nm=(C.suspects&&C.suspects[who]&&C.suspects[who].name)||who;
  $('#intro-who').textContent=nm;$('#intro-who').hidden=!nm;
  $('#intro-page').textContent=(INTRO.i+1)+' / '+C.intro.length;
  $('#intro-next').textContent=last?'시작 ▸':'다음 ▸';
  $('#intro-say').innerHTML='';
  typeHTML($('#intro-say'),pg.t,who==='narr'?'narr':who,null,20);
}
function introNext(){
  sTap();
  if(typers.length){skipTypers();return}      // 글이 나오는 중이면 먼저 다 보여 준다
  if(INTRO.i>=C.intro.length-1){var d=INTRO.done;INTRO.done=null;if(d)d();return}
  INTRO.i++;introPage();
}
function runIntro(done){
  INTRO.i=0;INTRO.done=done;
  show('s-intro');introPage();
}
/* 의뢰인 그림이 있으면 SVG 대신 쓴다. 없으면 HTML 에 있는 SVG 를 그대로 둔다. */
function applyBriefArt(){
  var box=$('#brief-art'),sym=C.brief&&C.brief.sym;if(!box||!sym)return;
  var f=sym+'-def.png';
  if(artOK(f))box.innerHTML='<img class="pim" src="'+artURL(f)+'" alt="">';
}
/* ================= 사건 목록 =================
   사건을 다 보여 주되 순서대로 풀기를 권한다. **막지는 않는다** —
   기기 저장은 언제든 날아갈 수 있고(공용 태블릿, 아이폰 7일 규칙), 그때 아이가
   게임을 못 하게 되면 안 된다. 잃는 것은 체크 표시뿐이어야 한다.
   진짜 진도는 사건마다 주는 열쇠말이 들고 있다 — 그건 기기가 아니라 아이에게 붙는다. */
var KEYWAIT=null;
function seasonCases(){
  if(SEASON&&SEASON.cases)return SEASON.cases;
  return [{no:C.no||1,id:CASE,title:C.title||'',sub:''}];   // 시즌 표가 없으면 지금 사건만
}
function caseState(c,prog,list){
  if(prog.done[c.id])return 'done';
  if(c.no===1||prog.open[c.id])return 'open';
  var prev=null;list.forEach(function(x){if(x.no===c.no-1)prev=x});
  if(prev&&prog.done[prev.id])return 'open';
  return 'lock';
}
function renderCases(){
  var box=$('#case-list');if(!box)return;
  var list=seasonCases(),prog=Save.loadProg(),h='',doneN=0;
  list.forEach(function(c){
    var st=caseState(c,prog,list),cur=(c.id===CASE);
    if(st==='done')doneN++;
    var stars=(st==='done'&&prog.done[c.id]>1)?starStr(prog.done[c.id]):(st==='done'?'✓':'');
    var badge=c.soon?'<span class="cs soon">준비 중</span>'
      :(st==='done'?'<span class="cs done">'+(prog.done[c.id]>1?'<span class="cstar">'+starStr(prog.done[c.id])+'</span>':'✓ 해결')+'</span>'
      :(st==='lock'?'<span class="cs lock">🔒 잠김</span>':'<span class="cs open">열림</span>'));
    h+='<button class="casecard'+(cur?' cur':'')+(st==='lock'||c.soon?' dim':'')+'" data-case="'+c.id+'">'+
       '<span class="cno">사건 '+c.no+'</span>'+badge+
       '<b>'+esc(c.title)+'</b><span class="csub">'+esc(c.sub||'')+(cur?' · 지금 열려 있는 사건':'')+'</span></button>';
  });
  box.innerHTML=h;
  var note=$('#case-note');
  if(note)note.textContent=doneN+' / '+(SEASON&&SEASON.total||list.length)+' 해결 · 기기를 바꿔도 열쇠말로 열 수 있어요';
  box.querySelectorAll('[data-case]').forEach(function(b){
    b.addEventListener('click',function(){pickCase(b.dataset.case)});
  });
}
function pickCase(id){
  sTap();
  var list=seasonCases(),prog=Save.loadProg(),c=null;
  list.forEach(function(x){if(x.id===id)c=x});if(!c)return;
  if(c.soon){toast('아직 준비 중인 사건이에요');return}
  var st=caseState(c,prog,list);
  if(st==='lock'){openKeyBox(c);return}
  gotoCase(id);
}
function gotoCase(id){
  if(id===CASE){show('s-title');refreshTitle();return}   // 지금 사건이면 화면만 돌아간다
  location.search='?case='+id;                            // 다른 사건은 새로 연다(깨끗한 상태로)
}
/* 자판이 올라오면 보이는 영역이 줄어든다. 창을 그 영역 위쪽에 붙여 둔다. */
function keyFollow(){
  var b=$('#key-box');if(!b||b.hidden)return;
  try{var vv=window.visualViewport;if(vv)b.style.top=(vv.offsetTop+10)+'px'}catch(e){}
}
function closeKeyBox(){
  var b=$('#key-box'),k=$('#key-back');
  if(b){b.hidden=true;b.style.top=''}
  if(k)k.hidden=true;
  KEYWAIT=null;
  try{if(window.visualViewport)window.visualViewport.removeEventListener('resize',keyFollow)}catch(e){}
}
function openKeyBox(c){
  KEYWAIT=c;
  var b=$('#key-box');if(!b)return;
  var k=$('#key-back');if(k)k.hidden=false;
  b.hidden=false;b.style.top='';
  try{if(window.visualViewport){window.visualViewport.addEventListener('resize',keyFollow);
    window.visualViewport.addEventListener('scroll',keyFollow)}}catch(e){}
  $('#key-title').textContent='사건 '+c.no+' 「'+c.title+'」';
  $('#key-msg').textContent='';
  var i=$('#key-in');if(i){i.value='';setTimeout(function(){try{i.focus()}catch(e){}},50)}
}
function normKey(t){return String(t||'').replace(/\s+/g,'').toLowerCase()}
function tryKey(){
  var c=KEYWAIT;if(!c)return;
  var v=normKey($('#key-in')&&$('#key-in').value);
  if(!v){$('#key-msg').textContent='열쇠말을 넣어 주세요.';return}
  if(c.key&&normKey(c.key)===v){
    sFan();Save.markOpen(c.id);
    $('#key-msg').innerHTML='<b>열렸어요.</b> 사건 파일을 엽니다…';
    setTimeout(function(){gotoCase(c.id)},700);
  }else{sNo();$('#key-msg').textContent='그 말이 아니에요. 앞 사건을 풀면 망고가 알려 줘요.'}
}
function bindCases(){
  var b=$('#btn-cases');
  if(b)b.addEventListener('click',function(){sTap();sPage();renderCases();closeKeyBox();show('s-cases')});
  var bk=$('#cases-back');
  if(bk)bk.addEventListener('click',function(){sTap();closeKeyBox();show('s-title');refreshTitle()});
  var g=$('#key-go');if(g)g.addEventListener('click',function(){sTap();tryKey()});
  var i=$('#key-in');if(i)i.addEventListener('keydown',function(e){if(e.key==='Enter')tryKey()});
  var x=$('#key-x');if(x)x.addEventListener('click',function(){sTap();closeKeyBox()});
  var kb=$('#key-back');if(kb)kb.addEventListener('click',function(){closeKeyBox()});
  /* 열쇠말을 모르는 아이를 막아 세우지 않는다 — 권유였지 문이 아니다 */
  var any=$('#key-any');
  if(any)any.addEventListener('click',function(){sTap();if(KEYWAIT)gotoCase(KEYWAIT.id)});
}
/* 표지가 지금 **어느 사건을 열었는지** 먼저 말해 준다.
   예전에는 「다음에 열린 사건」을 찾아 알렸는데, 사건 2를 연 화면에서 아직 안 푼
   사건 1을 가리켜 「사건 1이 열려 있어요」라고 떠 버렸다 — 뒤로 가라는 말처럼 읽힌다. */
/* 조사 고르기 — 「도토리묵를」처럼 어색하게 나오면 아이들이 먼저 알아본다.
   마지막 한글 글자에 받침이 있으면 앞엣것(을/이/은), 없으면 뒤엣것(를/가/는). */
function josa(word,withB,noB){
  var m=String(word||'').match(/[가-힣](?=[^가-힣]*$)/);
  if(!m)return noB;
  return ((m[0].charCodeAt(0)-0xAC00)%28)?withB:noB;
}
function titleOpenLine(){
  var el=$('#title-open');if(!el)return;
  var list=seasonCases(),prog=Save.loadProg(),cur=null,next=null;
  list.forEach(function(c){if(c.id===CASE)cur=c});
  /* 지금 사건을 이미 풀었다면, 그때만 「다음」을 권한다 */
  if(cur&&prog.done[cur.id]){
    list.forEach(function(c){
      if(c.soon||c.id===CASE||prog.done[c.id]||next)return;
      if(c.no>(cur.no||0)&&caseState(c,prog,list)!=='lock')next=c;
    });
  }
  var h='';
  if(cur)h='📂 <b>사건 '+cur.no+' 「'+esc(cur.title)+'」</b>'+josa(cur.title,'을','를')+' 불러왔어요'+
    (prog.done[cur.id]?' · <b>해결한 사건</b>':'');
  if(next)h+='<br>✓ 다음 <b>사건 '+next.no+' 「'+esc(next.title)+'」</b>'+josa(next.title,'이','가')+' 열렸어요 — <b>사건 목록</b>에서 고르세요';
  if(h){el.hidden=false;el.innerHTML=h}else el.hidden=true;
}
function newGame(){fresh();Save.clear();updateDot();show('s-title');refreshTitle()}

function refreshTitle(){
  var d=Save.load(), box=$('#resume');
  var eb=$('#title-eyebrow');if(eb)eb.textContent='사건 '+(C.no||1)+(C.title?' 「'+C.title+'」':'');
  applyCover();applyArt();syncFullUI();titleOpenLine();
  if(!box)return;
  if(d){box.hidden=false;$('#resume-when').textContent=Save.agoText(d.t)}
  else box.hidden=true;
}

function bindTitle(){
  $('#intro-next').addEventListener('click',introNext);
  $('#intro-skip').addEventListener('click',function(){sTap();cancelTyper();var d=INTRO.done;INTRO.done=null;if(d)d()});
  /* 글 위 아무 데나 눌러도 넘어간다 — 단추까지 손을 옮기지 않아도 되게 */
  $('#s-intro .txt').addEventListener('click',function(e){if(!e.target.closest('button'))introNext()});
  bindCases();
  $('#m-easy').addEventListener('click',function(){start(true)});
  $('#m-hard').addEventListener('click',function(){start(false)});
  var bf=$('#tg-full');
  if(bf)bf.addEventListener('click',function(){wake();sTap();if(isFull())fullOff();else fullOn();setTimeout(syncFullUI,300)});
  ['fullscreenchange','webkitfullscreenchange'].forEach(function(ev){document.addEventListener(ev,syncFullUI)});
  $('#btn-resume').addEventListener('click',function(){var d=Save.load();if(d){wake();sTap();startMusic();restore(d)}});
  $('#btn-fresh').addEventListener('click',function(){
    sTap();
    if(!$('#btn-fresh').dataset.sure){$('#btn-fresh').dataset.sure='1';$('#btn-fresh').textContent='정말 지울까요? 한 번 더';
      setTimeout(function(){var b=$('#btn-fresh');if(b){delete b.dataset.sure;b.textContent='처음부터 새로'}},4000);return}
    newGame();
  });
  $('#tg-sfx').addEventListener('click',function(){setSfx(!A.sfx);if(A.sfx)sTap()});
  $('#tg-bgm').addEventListener('click',function(){wake();setMusic(!A.music)});
  $('#btn-code').addEventListener('click',function(){
    sTap();var c=Save.makeCode();
    if(!c)return toast('아직 저장된 진행이 없어요');
    var t=$('#code-box');t.hidden=false;t.querySelector('textarea').value=c;t.querySelector('textarea').select();
  });
  $('#btn-code-use').addEventListener('click',function(){
    sTap();var v=$('#code-box textarea').value;
    var r=Save.applyCode(v);
    if(!r.ok)return toast(r.why);
    toast('불러왔어요');refreshTitle();
  });
}

/* ================= 화면 버튼 ================= */
function bindGame(){
  $('#btn-accept').addEventListener('click',function(){sTap();sPage();show('invest');lamps();updateDot();setMode('scene');var n=(C.startClues||[]).length;if(n)toast((C.brief&&C.brief.who?C.brief.who+'의 ':'')+'증언 '+n+'장이 수첩에 들어갔어요')});
  $('#btn-pin').addEventListener('click',function(){sFan();buzz([20,30,20,30,60]);show('s-board')});
  $('#btn-reset').addEventListener('click',function(){sTap();newGame()});
  $('#t-sound').addEventListener('click',function(){setSfx(!A.sfx);if(A.sfx)sTap()});
  $('#t-music').addEventListener('click',function(){wake();setMusic(!A.music)});
  $('#t-lamp').addEventListener('click',lampHint);
  $('#mini-close').addEventListener('click',function(){sTap();closeMini();toast('언제든 다시 조사할 수 있어요')});
  $('#mini-hint').addEventListener('click',function(){sTap();miniHint()});
  $('#t-home').addEventListener('click',function(){sTap();toTitle()});
  $('#t-full').addEventListener('click',function(){wake();sTap();if(isFull())fullOff();else fullOn();setTimeout(syncFullUI,300)});
  document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){sTap();setMode(b.dataset.mode)})});
  $('#act').addEventListener('click',onAct);
}

/* ================= 부팅 ================= */
function boot(){
  /* 시험용 창구 — 주소에 ?dbg=1 을 붙였을 때만 열린다. 평소 놀이에는 없다. */
  if(/[?&]dbg=1/.test(location.search))
    window.MANGO_DBG={get S(){return S},get C(){return C},
      get found(){return Object.keys(S.found)},get scene(){return S.scene}};
  var p=Save.loadPrefs();
  /* 저장된 설정에 소리 칸이 **없으면 켜 둔 것으로 본다.**
     예전에 「크게 보기」가 설정을 통째로 덮어써서 소리 칸이 지워진 적이 있는데,
     그때 !!undefined 를 false 로 읽는 바람에 그 기기는 영영 조용해졌다.
     없는 것은 「끔」이 아니라 「아직 고른 적 없음」이다. */
  if(p){
    if(typeof p.s==='boolean')A.sfx=p.s;
    if(typeof p.m==='boolean')A.music=p.m;
  }
  /* 크게 보기 기본값 — 휴대폰·태블릿처럼 화면이 작으면 켜고, 넓은 데스크톱은 그대로 둔다.
     한 번이라도 사용자가 단추를 누르면 그 선택이 저장되어 이 판단보다 우선한다. */
  BIGPREF=(p&&typeof p.big==='boolean') ? p.big
        : (window.innerHeight<520||window.innerWidth<900);
  Save.askPersist();
  syncSoundUI();
  fresh();
  bindTitle();bindGame();
  refreshTitle();
  show('s-title');
}

/* 어느 사건을 열지: 주소 뒤에 ?case=02 를 붙이면 그 사건이 열린다.
   아무것도 없으면 사건 1. 저장은 사건별로 나눈다(Save 가 CASE 를 본다). */
var CASE=(location.search.match(/[?&]case=([0-9]{1,2})/)||[])[1];
CASE=CASE?('0'+CASE).slice(-2):'01';
window.MANGO_CASE=CASE;
var SEASON=null;
fetch('data/season.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null})
  .then(function(j){SEASON=j}).catch(function(){});
fetch('data/case-'+CASE+'.json',{cache:'no-cache'})
  .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
  .then(function(j){C=j;document.title='탐정 망고 · '+(j.title||'첫 사건');
      return probeCaseArt().then(boot,boot)})
  .catch(function(e){
    document.body.innerHTML='<div style="padding:24px;font-family:system-ui;line-height:1.7">'+
      '<h2>사건 파일을 못 읽었어요</h2><p>data/case-'+CASE+'.json 을 불러오지 못했습니다. '+
      '인터넷 주소(https://…)로 열어야 동작해요. 파일을 컴퓨터에 내려받아 직접 열면 브라우저가 막습니다.</p>'+
      '<p style="color:#888">'+esc(e.message)+'</p></div>';
  });

/* 화면 큰 그림 자리(.art)를 그림으로 바꾼다. 파일이 없으면 지금 SVG 그대로. */
function setArt(sel,file,alt){
  var box=document.querySelector(sel+' .art');
  if(!box||!artOK(file))return;
  box.classList.add('img');
  box.innerHTML='<img src="'+artURL(file)+'" alt="'+(alt||'')+'">';
}
function applyArt(){
  /* 표지의 망고 — 밝은 셀 화풍(mango-joy)을 먼저 쓴다. 회화풍 전신(mango-full)은 어둡고 결이 달라 뒤로 밀었다. */
  setArt('#s-title',artOK('mango-joy.png')?'mango-joy.png':'mango-full.png','탐정 망고');
  var j=mangoFile('joy','bust');
  if(j&&!document.querySelector('#s-solve .mjoy')){
    var st=$('#stars');
    if(st)st.insertAdjacentHTML('beforebegin','<img class="mjoy" src="'+artURL(j)+'" alt="망고">');
  }
}

/* 표지 그림이 있으면 첫 화면 배경으로 깔고, 없으면 지금 색 배경 그대로 */
function applyCover(){
  var t=$('#s-title');if(!t)return;
  /* CSS 변수에 상대 경로를 넣으면 스타일시트(css/) 기준으로 풀려 img 를 못 찾는다.
     인라인 style 로 직접 넣으면 문서 기준으로 풀린다. */
  /* 인트로도 같은 그림 위에서 진행한다 — 표지 → 자막 → 브리핑이 한 장면처럼 이어지게 */
  var i=$('#s-intro');
  var ib=(C&&(C.introBg||C.coverImg));
  if(artOK(C&&C.coverImg)){t.classList.add('has-cover');t.style.backgroundImage='url("'+artURL(C.coverImg)+'")'}
  else{t.classList.remove('has-cover');t.style.backgroundImage=''}
  if(i){
    if(artOK(ib)){i.classList.add('has-cover');i.style.backgroundImage='url("'+artURL(ib)+'")'}
    else{i.classList.remove('has-cover');i.style.backgroundImage=''}
  }
}
