/* 탐정 망고 · 게임 엔진
   사건 내용은 이 파일에 없다. data/case-NN.json 을 읽어 그대로 해석한다.
   사건을 추가할 때 이 파일을 건드리지 않는 것이 목표다. */
import {A, wake, setMood, setMusic, setSfx, startMusic, beep,
        blip, buzz, sTap, sFind, sGood, sBad, sFan, sNo, sHot, sPage, sStamp, sSting} from './audio.js?v=2609190044';
import * as Save from './save.js?v=2609190044';

var C=null;   // 현재 사건 데이터

/* ================= 그림 자산 ================= */
/* data/case-NN.json 이 img 이름을 적으면 img/ 에서 찾아 쓰고,
   파일이 없으면 지금 쓰는 SVG 그림으로 그대로 돌아간다. 그림을 나중에 넣어도 코드는 그대로. */
var ART={};                                   // 경로 -> true(있음) / false(없음)
function artURL(f){return 'img/'+f}
function artOK(f){return !!(f&&ART[f])}
function probe(f){return new Promise(function(done){
  if(!f||f in ART)return done();
  var im=new Image();
  im.onload=function(){ART[f]=true;done()};
  im.onerror=function(){ART[f]=false;done()};
  im.src=artURL(f)+'?v=1';
})}
/* 사건 파일이 선언한 그림을 한 번에 확인한다. 없는 건 조용히 넘어간다. */
function probeCaseArt(){
  var list=['mango-full.png'];
  MANGO.forEach(function(e){list.push('mango-'+e+'.png');list.push('mango-face-'+e+'.png')});
  if(C.coverImg)list.push(C.coverImg);
  if(C.sceneImg)list.push(C.sceneImg);
  C.suspectOrder.forEach(function(id){
    var s=C.suspects[id];if(!s.img)return;
    /* 시트에서 분노 칸을 뺐다. 'ang' 을 남기면 없는 파일을 인물마다 두드린다. */ ['def','fl','sp'].forEach(function(e){list.push(s.img+'-'+e+'.png')});
  });
  /* 의뢰인은 용의자 목록에 없어서 위 반복문이 지나친다. 따로 넣어야 그림이 뜬다. */
  if(C.brief&&C.brief.sym)list.push(C.brief.sym+'-def.png');
  Object.keys(C.clues).forEach(function(k){if(C.clues[k].iconImg)list.push(C.clues[k].iconImg)});
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
  lens:{x:360,y:180},hot:null,proofs:[],active:null,rebutErr:0,newNotes:0,idle:null,
  phase:'chain',open:null,tries:0,elimTries:0,wrongSet:null,lastWrong:null,accErr:0,
  steps:C.steps.map(function(){return {clues:[],opt:null}}),elim:{},_eyes:{}};
  resetFaces();
}
function resetFaces(){C.suspectOrder.forEach(function(id){var x=C.suspects[id];if(x.sym==='rc')x.eyes='def'})}

var toastT;function toast(m){var el=$('#toast');el.textContent=m;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2000)}

/* ================= 화면 전환 ================= */
function show(id){
  ['s-title','s-intro','s-brief','s-solve','s-board'].forEach(function(s){$('#'+s).hidden=(s!==id)});
  var inv=(id==='invest');
  $('#bar').hidden=!inv;$('#bodyx').hidden=!inv;$('#foot').hidden=!inv;
  S.screen=id;
  cancelTyper();
  if(id==='s-title'||id==='s-intro'||id==='s-brief')setMood('calm');
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
var MINI={on:false,give:null,t0:0,moves:0,done:0,total:0};

function openMini(sp){
  var c=C.clues[sp.id];
  MINI={on:true,give:sp.id,t0:Date.now(),moves:0,done:0,total:0};
  $('#mini-title').textContent=(sp.miniTitle||c.n);
  $('#mini-tip').textContent=sp.miniTip||'조각을 끌어다 자리에 맞추세요. 가까이 가면 저절로 붙어요.';
  $('#mini').hidden=false;
  if(sp.mini==='jigsaw')jigsaw(sp);
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
    var sp=null;C.spots.forEach(function(x){if(x.id===id)sp=x});
    finishInspect(sp,addClue(id));
    toast('다 맞췄어요 · '+sec+'초');
  },900);
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
  S.found[id]=true;S.newNotes++;updateDot();
  if(!quiet)sFind();
  return true;
}
function updateDot(){var d=$('#notes-dot');d.hidden=S.newNotes===0;d.textContent=S.newNotes;var c=$('#t-clue');if(c)c.textContent='🗒 '+count()}
function count(){return C.order.filter(function(id){return S.found[id]&&!C.clues[id].locked}).length}
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
  ({scene:renderScene,talk:renderTalk,notes:renderNotes,logic:renderLogic})[m]();
  updateAct();idleReset();
}
/* 쉬움 모드: 60초 동안 진전이 없으면 힌트 제안 */
function idleReset(){clearTimeout(S.idle);if(!S.easy||S.screen!=='invest')return;S.idle=setTimeout(idleHint,60000)}
function idleHint(){
  if(S.screen!=='invest')return;var m='';
  if(S.mode==='scene'){var left=C.spots.filter(function(sp){return !sp.decoy&&!S.found[sp.id]&&!C.clues[sp.id].locked}).length;m=left?'아직 조사하지 않은 곳이 '+left+'곳 있어요. 확대경을 천천히 끌어 보세요':'현장은 다 봤어요. 심문 탭으로 가 보세요'}
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
    if(S.phase==='chain'){var d=chainReady();a.textContent=d?'이대로 추리한다':'추론을 채우세요';a.className=d?'act warm':'act';a.disabled=!d}
    else if(S.phase==='elim'){var d2=elimReady();a.textContent=d2?'이대로 지운다':'지울 이유를 고르세요';a.className=d2?'act warm':'act';a.disabled=!d2}
    else{a.textContent='지목한다!';a.className='act warm';a.disabled=!S.flags.acc}
  }
}
function onAct(){
  if(S.mode==='scene')inspect();
  else if(S.mode==='talk'){var s=C.suspects[S.tab],ex=extraAction(s);if(ex)doExtra(ex);else openTray('present')}
  else if(S.mode==='logic'){if(S.phase==='chain')judgeChain();else if(S.phase==='elim')judgeElim();else doAccuse()}
}

/* ================= 현장 ================= */
var LENS_R=40;
/* 확대경이 <use href="#art"> 로 확대하므로, 그림을 써도 id는 art 그대로 유지한다. */
function artLayer(){
  if(artOK(C.sceneImg))
    return '<g id="art"><image href="'+artURL(C.sceneImg)+'" x="0" y="0" width="720" height="360" preserveAspectRatio="xMidYMid slice"/></g>';
  return C.sceneSvg;
}
function sceneSVG(){return ''+
'<svg id="scene" viewBox="0 0 720 360"><defs><clipPath id="lc"><circle id="lcc" cx="360" cy="180" r="'+LENS_R+'"/></clipPath></defs>'+
artLayer()+
'<g clip-path="url(#lc)"><g id="mag"><use href="#art"/></g></g>'+
'<g id="lens"><circle id="lr1" cx="360" cy="180" r="'+LENS_R+'" fill="none" stroke="#5b5a63" stroke-width="6"/><circle id="lr2" cx="360" cy="180" r="'+LENS_R+'" fill="none" stroke="#e8f4f8" stroke-width="1.8"/><path id="lh" d="M388 208 l26 26" stroke="#7a5233" stroke-width="11" stroke-linecap="round"/></g>'+
'<g id="found"></g></svg><div class="lenslabel" id="lenslabel"></div>';}
function renderScene(){
  $('#left').innerHTML='<div class="scenewrap" id="scenewrap">'+sceneSVG()+'</div>';
  drawFound();setLens(S.lens.x,S.lens.y);
  var w=$('#scenewrap'),drag=false;
  w.addEventListener('pointerdown',function(e){drag=true;w.setPointerCapture(e.pointerId);var p=pt(e);setLens(p.x,p.y)});
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
  C.spots.forEach(function(sp){var d=Math.hypot(sp.x-x,sp.y-y);if(d<Math.max(sp.r,26)&&d<bd){bd=d;best=sp}});
  var changed=(best&&best!==S.hot);S.hot=best;
  var lab=$('#lenslabel');
  if(best){var nm=best.decoy?best.label:C.clues[best.id].n;lab.textContent=(S.found[best.id]?'✓ ':'')+nm;lab.classList.add('on');
    if(changed){sHot();lab.classList.remove('new-hot');void lab.offsetWidth;lab.classList.add('new-hot')}}
  else lab.classList.remove('on');
  updateAct();
}
function drawFound(){
  var g=$('#found');if(!g)return;var h='';
  C.spots.forEach(function(sp){if(!sp.decoy&&S.found[sp.id])h+='<circle cx="'+sp.x+'" cy="'+sp.y+'" r="7" fill="#7d8f5c" stroke="#4a3428" stroke-width="1.6"/><path d="M'+(sp.x-3)+' '+sp.y+' l2 2 l4 -5" stroke="#fff" stroke-width="1.8" fill="none"/>'});
  g.innerHTML=h;
}
function inspect(){
  var sp=S.hot;if(!sp)return;sTap();
  if(sp.decoy){sNo();rightScene('<div class="card"><div class="who">'+esc(sp.label)+'</div><p style="margin:0">'+esc(sp.decoy)+'</p></div>');return}
  var c=C.clues[sp.id];
  if(c.locked){sBad();rightScene('<div class="card"><div class="who">🔒 '+esc(c.n)+'</div><p style="margin:0">'+c.t+'</p></div>');return}
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
  if(f&&f.give&&addClue(f.give,true)){
    extra+='<div class="say" id="sc-follow"><b>'+esc(f.who||'')+'</b> <span></span><br><span class="muted">→ 증언 카드가 수첩에 추가됐어요.</span></div>';
    after=function(){var el=document.querySelector('#sc-follow span');if(el)typeHTML(el,f.say||'',f.voice||'narr')};
  }
  if(c.note)extra+=c.note;
  rightScene('<div class="card"><div class="who">'+(isNew?mface('sp'):mface('def'))+esc(c.n)+(isNew?' <small style="color:var(--olive)">수첩에 기록</small>':' <small>이미 기록됨</small>')+'</div><p style="margin:0" id="sc-desc"></p></div>'+extra);
  typeHTML($('#sc-desc'),c.t,isNew?'mango':null,after);
  if(count()>=8&&!S.flags.hint8){S.flags.hint8=true;toast('단서가 많이 모였어요. 심문과 추리 탭도 써 보세요')}
}
function rightScene(html){
  var base='<p class="muted" style="margin:0 0 8px">확대경을 끌어 살펴보고, 이름표가 뜨면 <b>조사하기</b>를 누르세요. 조사한 곳은 ✓로 표시돼요.</p>';
  $('#rscroll').innerHTML=base+(html||'<div class="card" style="background:#fff8e7"><div class="who">망고의 메모</div><p style="margin:0;font-size:13px" id="sc-memo"></p></div>');
  /* 현장 첫 화면의 망고 메모 — 사건 파일의 memo (없으면 일반 문장) */
  if(!html)typeHTML($('#sc-memo'),C.memo||'하나씩 확인하자. 단서가 말해 주는 것만 믿는다.',S.flags.memoSaid?null:'mango'),S.flags.memoSaid=true;
  var mm=$('#rscroll').querySelector('.card .who');
  if(mm&&/망고의 메모/.test(mm.textContent))mm.insertAdjacentHTML('afterbegin',mface('def'));
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
    var cls='tap'+(active&&S.easy?' sus-on':'')+(S.sel===L.id?' picked':'');
    var isNew=L.hidden&&!S.flags['seen_'+L.id];if(isNew)S.flags['seen_'+L.id]=true;
    var txt='"'+esc(L.t)+'"'+(isNew?'<span class="new">새로운 말</span>':'');
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
    S.sel=null;renderTalk();
    say('<b>망고</b> "잠깐. 「'+C.clues[clueId].n.replace(/^[^:]+: /,'')+'」 — 이건 어떻게 설명하죠?"<br>'+hit.say+
        (gave?'<br><span class="muted">→ 새 카드가 수첩에 들어갔어요.</span>':''));
    if(hit.toast)setTimeout(function(){toast(hit.toast)},1800);
  }else if(hit&&hit.partial){
    sNo();renderTalk();say(hit.say+'<br><span class="muted">'+(hit.hint||'가까워요. 조금 더 직접 이어지는 단서가 필요해요.')+'</span>');
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
  C.order.forEach(function(id){if(S.found[id]||C.clues[id].locked)h+=cardHTML(id,false,true)});
  g.innerHTML=h||'<p class="muted">아직 기록이 없어요. 현장을 조사해 보세요.</p>';
  $('#rscroll').innerHTML='<div class="card" style="background:#fff8e7"><div class="who">카드를 누르면 내용을 다시 볼 수 있어요</div><p class="muted" style="margin:0">물증은 흰 카드, 증언은 이중선 카드예요. 둘 다 추리의 근거로 쓸 수 있어요.</p></div>';
  g.querySelectorAll('[data-c]').forEach(function(b){b.addEventListener('click',function(){sTap();var c=C.clues[b.dataset.c];
    $('#rscroll').innerHTML='<div class="card"><div class="who">'+esc(c.n)+'</div><p style="margin:0">'+c.t+'</p></div>'+(c.odd?'<div class="note"><b>이 단서는 어디에 들어갈까?</b>사건과 이어지는 곳이 없다면… 그게 바로 이상한 점이에요.</div>':'')})});
}

/* ================= 추리 (단서 + 결론을 둘 다 고른다) ================= */
function stepDone(i){var st=S.steps[i];return st.clues.length===C.steps[i].slots&&st.opt!=null}
function chainReady(){return C.steps.every(function(c,i){return stepDone(i)})}
function elimReady(){return C.elim.every(function(e){return S.elim[e.id]!=null})}

function renderLogic(){
  cancelTyper();
  if(S.phase==='chain')return renderChain();
  if(S.phase==='elim')return renderElim();
  return renderAccuse();
}

/* ---------- 1단계: 추론 사슬 ---------- */
function renderChain(){
  var h='<div class="chain" id="chain">';
  C.steps.forEach(function(c,i){
    var st=S.steps[i],done=stepDone(i),wrong=S.wrongSet&&S.wrongSet.indexOf(i)>=0;
    h+='<button class="link step'+(done?' done':'')+(wrong?' bad':'')+(S.open===i?' open':'')+'" data-s="'+i+'">'+
      '<span class="no">'+(i+1)+'</span><b>'+c.t+'</b>'+
      '<div class="mini">'+(st.clues.length?st.clues.map(function(id){return '<span class="tag">'+esc(C.clues[id].n)+'</span>'}).join(''):'<span class="tag empty">단서 —</span>')+
      (st.opt!=null?'<span class="tag opt">'+c.opts[st.opt].t.replace(/<[^>]+>/g,'')+'</span>':'<span class="tag empty">결론 —</span>')+'</div></button>';
  });
  h+='</div>';
  $('#left').innerHTML='<div class="logicwrap">'+h+'</div>';
  $('#chain').querySelectorAll('[data-s]').forEach(function(b){b.addEventListener('click',function(){sTap();S.open=+b.dataset.s;renderChain()})});
  if(S.open==null){
    var n=C.steps.filter(function(c,i){return stepDone(i)}).length;
    $('#rscroll').innerHTML='<div class="card" style="background:#fff8e7"><div class="who">추리 노트</div>'+
      '<p style="margin:0;font-size:13px">단계를 누르면 망고가 질문을 해요. 질문마다 <b>단서</b>와 <b>그 단서가 증명하는 것</b>을 함께 고르세요.</p>'+
      '<p style="margin:6px 0 0;font-size:13px"><b>규칙 하나.</b> 단서가 <b>말해 주는 것만</b> 고르세요. 그럴듯한 <b>짐작</b>은 답이 아니에요.</p></div>'+
      '<div class="note" style="margin-top:8px"><b>다 채운 뒤 한 번에 채점해요.</b>틀려도 잃는 것은 없고, 몇 번이든 다시 낼 수 있어요. 어려우면 망고가 점점 더 자세히 알려 줍니다.</div>'+
      '<p class="muted" style="margin-top:8px">'+n+' / '+C.steps.length+' 단계 채움'+(S.tries?' · 추리 제출 '+S.tries+'회':'')+'</p>'+(S.flags.judgeSay||'');
  } else renderStepPanel();
  updateAct();
}
function renderStepPanel(){
  var i=S.open,c=C.steps[i],st=S.steps[i];
  var h='<div class="card"><div class="who">'+(i+1)+'. '+esc(c.t)+'</div><p style="margin:0;font-size:13px" id="q-live"></p></div>';
  h+='<div class="pick"><div class="pl">근거가 되는 단서 <small>'+st.clues.length+'/'+c.slots+'</small></div><div class="clues">';
  st.clues.forEach(function(id){h+='<button class="clue picked-c" data-rm="'+id+'">'+clueIcon(C.clues[id],true)+esc(C.clues[id].n)+'<span class="x">빼기</span></button>'});
  if(st.clues.length<c.slots)h+='<button class="clue add" id="add-clue">＋<br>단서 고르기</button>';
  h+='</div></div>';
  h+='<div class="pick"><div class="pl">그래서 무엇이 증명되나요?</div>';
  c.opts.forEach(function(o,k){h+='<button class="opt'+(st.opt===k?' on':'')+'" data-o="'+k+'"><span class="dot"></span><span>'+o.t+'</span></button>'});
  h+='</div>';
  h+='<button class="btn ghost" id="step-close" style="margin-top:8px">단계 목록으로</button>';
  $('#rscroll').innerHTML=h;$('#rscroll').scrollTop=0;
  typeHTML($('#q-live'),c.q,'mango');
  var a=$('#add-clue');if(a)a.addEventListener('click',function(){sTap();openTray('step')});
  $('#rscroll').querySelectorAll('[data-rm]').forEach(function(b){b.addEventListener('click',function(){sNo();var id=b.dataset.rm;st.clues=st.clues.filter(function(x){return x!==id});S.wrongSet=null;renderChain()})});
  $('#rscroll').querySelectorAll('[data-o]').forEach(function(b){b.addEventListener('click',function(){sStamp();st.opt=+b.dataset.o;S.wrongSet=null;renderChain()})});
  $('#step-close').addEventListener('click',function(){sTap();S.open=null;renderChain()});
}
function addStepClue(id){
  closeSheet();var c=C.steps[S.open],st=S.steps[S.open];
  if(st.clues.indexOf(id)>=0){sNo();return renderChain()}
  if(st.clues.length>=c.slots)st.clues.pop();
  st.clues.push(id);S.wrongSet=null;sStamp();renderChain();
}
/* 제출 — 여기서만 채점한다 */
function judgeChain(){
  S.tries++;
  var wrong=[];
  C.steps.forEach(function(c,i){
    var st=S.steps[i];
    var clueOK=(c.slots===1)?(c.need.indexOf(st.clues[0])>=0)
      :(c.need.every(function(n){return st.clues.indexOf(n)>=0}));
    if(!clueOK||!c.opts[st.opt].ok)wrong.push(i);
  });
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
  S.open=null;renderChain();
}
/* 도움 수위: 쉬움은 항상 최대, 보통도 두 번 틀리면 위치, 세 번이면 이유까지 */
function helpLv(nFail){if(S.easy)return 2;if(nFail>=3)return 2;if(nFail>=2)return 1;return 0}
function whyWrongStep(w){
  var c=C.steps[w],st=S.steps[w];
  var clueOK=(c.slots===1)?(c.need.indexOf(st.clues[0])>=0):(c.need.every(function(n){return st.clues.indexOf(n)>=0}));
  if(!clueOK)return c.whyClue;
  return c.opts[st.opt].why||'그 결론은 이 단서만으로는 나오지 않아요.';
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
      '<p style="margin:0;font-size:13px">「그럴 사람이 아니다」는 이유가 될 수 없어요. <b>물건이나 몸으로 증명되는</b> 이유만 사람을 지울 수 있습니다.</p></div>'+
      '<p class="muted" style="margin-top:8px">'+n+' / '+C.elim.length+' 명 지움'+(S.elimTries?' · 제출 '+S.elimTries+'회':'')+'</p>'+(S.flags.judgeSay||'');
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
    sFan();S.wrongSet=null;S.lastWrong=null;S.phase='accuse';S.open=null;S.flags.judgeSay='';renderLogic();
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
function renderAccuse(){
  var h='<div class="chain" id="chain"><div class="concl small">밖에서 들어온 사람 없음 · 둘 이상 · 그 시각 안엔 도우미 둘 · 나머지는 전부 지워짐</div>';
  h+='<div class="link"><span class="no">★</span>결정적 증거 <small>(선택 — 별점이 올라요)</small><div class="mini">'+
    '<button class="tag slotbtn" data-p="0">'+(S.proofs[0]?esc(C.clues[S.proofs[0]].n):'＋ 증거')+'</button>'+
    '<button class="tag slotbtn" data-p="1">'+(S.proofs[1]?esc(C.clues[S.proofs[1]].n):'＋ 증거')+'</button></div></div></div>';
  $('#left').innerHTML='<div class="logicwrap">'+h+'</div>';
  $('#chain').querySelectorAll('[data-p]').forEach(function(b){b.addEventListener('click',function(){sTap();S.active='p'+b.dataset.p;openTray('proof')})});
  var h2='<div class="card" style="background:#fff8e7"><div class="who">범인은 누구입니까?</div><p style="margin:0;font-size:13px">되돌릴 수 없어요. 사슬을 한 번 더 읽어 보세요.</p></div><div class="pick">';
  C.accuse.forEach(function(a){h2+='<button class="opt acc'+(S.flags.acc===a.id?' on':'')+'" data-a="'+a.id+'"><span class="dot"></span><span>'+esc(a.t)+'</span></button>'});
  h2+='</div>'+(S.flags.judgeSay||'');
  $('#rscroll').innerHTML=h2;
  $('#rscroll').querySelectorAll('[data-a]').forEach(function(b){b.addEventListener('click',function(){sTap();S.flags.acc=b.dataset.a;renderAccuse()})});
  updateAct();
}
function fillProof(clueId){
  closeSheet();var k=+String(S.active)[1];
  if(C.proofs.indexOf(clueId)>=0&&S.proofs.indexOf(clueId)<0){sStamp();setTimeout(sGood,90);S.proofs[k]=clueId}
  else{sNo();S.flags.judgeSay='<div class="say">그건 「<b>두 사람이</b> 했다」를 몸에 남은 흔적으로 보여 주는 증거가 아니에요.</div>'}
  S.active=null;renderAccuse();
}
function doAccuse(){
  var pick=C.accuse.filter(function(a){return a.id===S.flags.acc})[0];
  if(!pick)return;
  if(!pick.ok){sBad();burn();S.accErr++;
    S.flags.judgeSay='<div class="say"><b>망고</b> "…그건 우리가 <b>지운</b> 사람이야. 사슬을 다시 읽어 보자."</div>';
    S.flags.acc=null;renderAccuse();return}
  accuse();
}

/* ================= 트레이 ================= */
function openTray(kind){
  var r=$('#right');var old=$('#sheet');if(old)old.remove();
  var d=document.createElement('div');d.className='sheet';d.id='sheet';
  var title={present:'어떤 단서를 들이댈까요?',step:'근거가 될 단서 고르기',proof:'결정적 증거'}[kind];
  var ctx='';
  if(kind==='step'&&S.open!=null){var c=C.steps[S.open];ctx='<div class="ctx">'+(S.open+1)+'. '+esc(c.t)+' — <b>'+c.q.replace(/<[^>]+>/g,'')+'</b></div>'}
  if(kind==='present'){var L=null;C.suspects[S.tab].lines.forEach(function(x){if(x.id===S.sel)L=x});if(L)ctx='<div class="ctx">'+esc(C.suspects[S.tab].name)+'의 말: <b>"'+esc(L.t)+'"</b> — 이 말과 어긋나는 단서를 고르세요.</div>'}
  if(kind==='proof')ctx='<div class="ctx">「두 사람이 했다」를 <b>몸에 남은 흔적</b>으로 직접 보여 주는 단서를 고르세요.</div>';
  var h='<div class="hd"><span>'+title+'</span><button id="sheet-x">닫기</button></div>'+ctx+'<div class="list"><div class="clues">';
  var any=false;
  C.order.forEach(function(id){if(S.found[id]&&!C.clues[id].locked){any=true;h+=cardHTML(id,false,true)}});
  h+='</div>'+(any?'':'<p class="muted">아직 단서가 없어요. 현장을 먼저 조사하세요.</p>')+'</div>';
  d.innerHTML=h;r.appendChild(d);
  $('#sheet-x').addEventListener('click',function(){sTap();S.active=null;closeSheet();if(S.mode==='logic')renderLogic()});
  if(kind==='step'||kind==='proof'){var ex=document.createElement('p');ex.className='muted';ex.style.padding='0 12px';ex.innerHTML='필요 없는 단서를 넣으면 제출할 때 어긋납니다.';d.querySelector('.list').appendChild(ex)}
  d.querySelectorAll('[data-c]').forEach(function(b){b.addEventListener('click',function(){sTap();if(kind==='present')present(b.dataset.c);else if(kind==='step')addStepClue(b.dataset.c);else fillProof(b.dataset.c)})});
}
function closeSheet(){var s=$('#sheet');if(s)s.remove()}

/* ================= 지목 → 해결 ================= */
function accuse(){
  sFan();
  var miss=(S.tries-1)+(S.elimTries-1)+S.accErr;   // 제출 실패 횟수
  var star=3;if(miss>=1||S.rebutErr>0||S.lamps<3)star=2;if(miss>=3||S.rebutErr>=2||S.lamps<=0)star=1;
  if(S.proofs.filter(Boolean).length===2&&star<3)star++;
  star=Math.max(1,Math.min(3,star));
  var coin=star===3?120:(star===2?100:80);
  $('#reward').innerHTML='<span class="chip">🪙 +'+coin+'</span><span class="chip">⭐ 명성 +3</span><span class="chip">📖 도감 +3</span>'+(S.proofs.filter(Boolean).length?'<span class="chip">결정적 증거 '+S.proofs.filter(Boolean).length+'</span>':'');
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
  if(S.phase==='accuse')return toast('이제 답을 고르기만 하면 돼요');
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
  S.steps=d.steps||S.steps;S.elim=d.elim||{};S.proofs=d.proofs||[];
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
A.onChange=function(){Save.savePrefs({s:A.sfx,m:A.music});syncSoundUI()};

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
function introPage(){
  var pg=C.intro[INTRO.i],last=INTRO.i===C.intro.length-1;
  var who=pg.who||'narr';
  introArt(who);
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
function newGame(){fresh();Save.clear();updateDot();show('s-title');refreshTitle()}

function refreshTitle(){
  var d=Save.load(), box=$('#resume');
  var eb=$('#title-eyebrow');if(eb)eb.textContent='시험판 9 · 사건 '+(C.no||1)+(C.title?' 「'+C.title+'」':'');
  applyCover();applyArt();syncFullUI();
  if(!box)return;
  if(d){box.hidden=false;$('#resume-when').textContent=Save.agoText(d.t)}
  else box.hidden=true;
}

function bindTitle(){
  $('#intro-next').addEventListener('click',introNext);
  $('#intro-skip').addEventListener('click',function(){sTap();cancelTyper();var d=INTRO.done;INTRO.done=null;if(d)d()});
  /* 글 위 아무 데나 눌러도 넘어간다 — 단추까지 손을 옮기지 않아도 되게 */
  $('#s-intro .txt').addEventListener('click',function(e){if(!e.target.closest('button'))introNext()});
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
  var p=Save.loadPrefs();
  if(p){A.sfx=!!p.s;A.music=!!p.m}
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
  setArt('#s-title','mango-full.png','탐정 망고');
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
  if(artOK(C&&C.coverImg)){var u='url("'+artURL(C.coverImg)+'")';
    t.classList.add('has-cover');t.style.backgroundImage=u;
    if(i){i.classList.add('has-cover');i.style.backgroundImage=u}}
  else{t.classList.remove('has-cover');t.style.backgroundImage='';
    if(i){i.classList.remove('has-cover');i.style.backgroundImage=''}}
}
