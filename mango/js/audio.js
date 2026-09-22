/* 탐정 망고 · 소리 엔진
   외부 음원 파일 없이 WebAudio로 전부 합성한다.
   - 말소리(blip): 인물마다 음높이·음색이 달라 「누가 말하는지」가 귀로 구분된다
   - BGM: D단조 82BPM, 화면 분위기(mood)에 따라 진행과 악기가 바뀐다
   게임 상태에 의존하지 않는다. 켜짐/꺼짐은 A.sfx / A.music 두 플래그로만 판단하고,
   바뀔 때마다 A.onChange() 를 불러 저장은 게임 쪽에 맡긴다. */
export var A={sfx:true, music:true, gain:null, onChange:null};

/* ================= 소리 엔진 (합성, 외부 파일 없음) ================= */
var ac=null,sfxG=null,musG=null,voxG=null,noiseBuf=null;
function initAC(){
  if(ac)return true;
  try{ac=new (window.AudioContext||window.webkitAudioContext)();
    sfxG=ac.createGain();sfxG.gain.value=1;sfxG.connect(ac.destination);
    voxG=ac.createGain();voxG.gain.value=1;voxG.connect(ac.destination);
    musG=ac.createGain();musG.gain.value=A.music?1:0;A.gain=musG;
    var comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;musG.connect(comp);comp.connect(ac.destination);
    var n=ac.createBuffer(1,ac.sampleRate*.25,ac.sampleRate),d=n.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;noiseBuf=n;
    return true}catch(e){ac=null;return false}
}
function wake(){if(!initAC())return false;if(ac.state==='suspended')ac.resume();return true}
function beep(fs,dur,type,vol){if(!A.sfx||!wake())return;try{
  fs.forEach(function(f,i){var o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+i*dur*.62;o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.12,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(sfxG);o.start(t);o.stop(t+dur+.02)});}catch(e){}}
var sTap=function(){beep([620],.07,'sine',.07)},sFind=function(){beep([740,988],.13,'triangle',.11);buzz(12)},sGood=function(){beep([659,880],.16,'triangle',.12);buzz(18)},
    sBad=function(){beep([300,220],.16,'sine',.1)},sFan=function(){beep([523,659,784,1047],.2,'triangle',.12);buzz([20,40,20])},sNo=function(){beep([440],.09,'sine',.06)},
    sHot=function(){beep([1180],.045,'sine',.028)},sPage=function(){if(!A.sfx||!wake())return;noise(.06,1800,.05)},sStamp=function(){beep([180],.09,'square',.06);noise(.04,900,.06)};
function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}}
function noise(dur,hz,vol,dest){try{var s=ac.createBufferSource();s.buffer=noiseBuf;var f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=hz;f.Q.value=.8;
  var g=ac.createGain(),t=ac.currentTime;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest||sfxG);s.start(t);s.stop(t+dur+.02)}catch(e){}}

/* ---- 말소리(인물별 목소리 톤) ---- */
var VOICE={
  mango:{f:300,type:'triangle',w:.07,v:.05},   // 차분한 중음
  sheep:{f:230,type:'sine',w:.09,v:.06},       // 아주머니, 낮고 둥글게
  kongi:{f:430,type:'square',w:.05,v:.028},    // 콩이, 높고 재빠르게
  kongsun:{f:500,type:'square',w:.05,v:.026},  // 콩순이, 더 높게
  doto:{f:640,type:'triangle',w:.04,v:.05},    // 다람쥐, 아주 높고 짧게
  mori:{f:190,type:'sine',w:.1,v:.06},         // 두더지, 낮고 느리게
  narr:{f:260,type:'triangle',w:.06,v:.03}     // 해설
};
function blip(vc,ch){
  if(!A.sfx||!wake())return;
  try{var v=VOICE[vc]||VOICE.narr,code=ch.charCodeAt(0),k=(code%7)/7; // 글자마다 음높이 살짝 다르게
    var f=v.f*(0.92+k*.2),o=ac.createOscillator(),g=ac.createGain(),lp=ac.createBiquadFilter(),t=ac.currentTime;
    o.type=v.type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.08,t+v.w*.6);
    lp.type='lowpass';lp.frequency.value=v.type==='square'?1600:3000;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v.v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+v.w);
    o.connect(lp);lp.connect(g);g.connect(voxG);o.start(t);o.stop(t+v.w+.02)}catch(e){}
}

/* ---- BGM: 미스터리풍, 화면 분위기별로 변주 ---- */
/* ================= BGM — 탐정 재즈 =================
   전에는 D단조 3화음을 정박으로 찍어서, 분위기는 차분했지만 「탐정」이 아니라 동요에 가까웠다.
   탐정물 느낌은 네 가지에서 온다. (1) 스윙 — 뒷박을 늦춘다. (2) 7·9화음 — 3화음은 너무 착하다.
   (3) 걸어 다니는 베이스 — 특히 4박의 반음 접근음. (4) 되풀이되는 주제 선율 — 아무 음이나
   흩뿌리면 귀가 기억할 것이 없다. 조사 중에는 선율을 비우고 분위기만 남긴다(여백도 연출이다). */
var BPM=92, SW=.12;          // SW: 뒷박(8분의 뒤)을 박의 몇 만큼 늦출지. 0이면 정박
var M={timer:null,next:0,step:0,mood:'calm',lastMel:null};
function mtof(m){return 440*Math.pow(2,(m-69)/12)}

var CH={
  Dm9  :[62,65,69,72,76], Gm7 :[67,70,74,77],  Gm6:[67,70,74,76],
  A7   :[69,73,76,79],    A7b9:[69,73,76,79,82],
  Bb7  :[70,74,77,80],    BbM7:[70,74,77,81],  Em7b5:[64,67,70,74],
  D69  :[62,66,69,71],    G6  :[67,71,74,76],  DM7:[62,66,69,73]
};
/* D 도리안에 b5(Ab)를 섞은 음계. 이 한 음이 「수사물」 색을 낸다 */
var SCALE_MIN=[62,64,65,67,68,69,70,72,74,76,77,79,80,81];
var SCALE_MAJ=[62,64,66,67,69,71,73,74,76,78,79,81,83];

/* 주제 선율 — 두 마디. D–F–Ab–A 로 반음씩 기어 올라가는 고전적인 수사물 동기다.
   p: 마디 안 16분 위치, n: 음, d: 박 길이 */
var THEME=[
  [{p:0,n:74,d:.5},{p:2,n:77,d:.5},{p:4,n:80,d:1},{p:8,n:81,d:1.8}],
  [{p:0,n:79,d:.6},{p:4,n:77,d:.6},{p:8,n:74,d:2}]
];
var THEME_MAJ=[
  [{p:0,n:74,d:.5},{p:2,n:78,d:.5},{p:4,n:81,d:1},{p:8,n:83,d:1.8}],
  [{p:0,n:81,d:.6},{p:4,n:78,d:.6},{p:8,n:74,d:2}]
];

var MOODS={
  /* 표지·인트로·브리핑 — 주제 선율이 나오는 자리. 베이스는 두 박에 하나만 */
  calm:   {prog:['Dm9','BbM7','Em7b5','A7b9'], ride:0, stab:[6,14],    walk:'half', theme:'min', mel:0,   lead:'trumpet'},
  /* 현장·수첩 — 선율 없이 걸어 다니는 베이스와 브러시만. 생각할 자리를 비워 둔다 */
  invest: {prog:['Dm9','Dm9','Gm7','A7'],      ride:1, stab:[6],       walk:'full', theme:0,     mel:.10, lead:'clar'},
  /* 심문 — 화음이 조여든다(Em7b5→A7b9). 컴핑이 잦아지고 선율이 들썩인다 */
  tense:  {prog:['Em7b5','A7b9','Dm9','Bb7'],  ride:1, stab:[4,10,14], walk:'full', theme:0,     mel:.20, lead:'trumpet'},
  /* 추리 — 같은 도형이 돌아가는 오스티나토. 머릿속이 돌아가는 소리 */
  build:  {prog:['Dm9','Gm7','BbM7','A7'],     ride:0, stab:[],        walk:'full', theme:0,     mel:0,   ost:true},
  /* 해결 — 같은 주제를 장조로. 되풀이된 동기가 여기서 풀린다 */
  resolve:{prog:['D69','G6','A7','DM7'],       ride:1, stab:[6,14],    walk:'full', theme:'maj', mel:.12, lead:'trumpet', major:true},
  off:null
};

/* 콘트라베이스 — 손가락으로 뜯은 소리. 밝은 데서 시작해 금방 어두워진다 */
function bassPluck(midi,t,vol){
  var o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
  o.type='triangle';o.frequency.value=mtof(midi);
  f.type='lowpass';f.Q.value=.7;
  f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(150,t+.5);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);
  g.gain.exponentialRampToValueAtTime(.0001,t+.62);
  o.connect(f);f.connect(g);g.connect(musG);o.start(t);o.stop(t+.7);
}
/* 4박의 접근음이 재즈처럼 들리게 하는 핵심이다 — 다음 화음의 으뜸음을 반음 옆에서 찝는다 */
function bassNote(mo,bar,beat){
  var ch=CH[mo.prog[bar]],root=ch[0]-24,next=CH[mo.prog[(bar+1)%4]][0]-24;
  if(beat===0)return root;
  if(beat===1)return root+7;
  if(beat===2)return root+(ch[1]-ch[0]);
  return next+(next>=root?-1:1);
}
/* 피아노 컴핑 — 으뜸음은 베이스에 맡기고 위쪽만 짧게 던진다 */
function stab(chord,t,vol){
  chord.forEach(function(m,i){
    var o=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o.frequency.value=mtof(m);
    var v=vol*(i?.72:1);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);
    g.gain.exponentialRampToValueAtTime(.0001,t+.85);
    o.connect(g);g.connect(musG);o.start(t);o.stop(t+.9);
    var o2=ac.createOscillator(),g2=ac.createGain();       // 쇠붙이 배음 한 겹
    o2.type='sine';o2.frequency.value=mtof(m)*4;
    g2.gain.setValueAtTime(0,t);g2.gain.linearRampToValueAtTime(v*.08,t+.006);
    g2.gain.exponentialRampToValueAtTime(.0001,t+.26);
    o2.connect(g2);g2.connect(musG);o2.start(t);o2.stop(t+.28);
  });
}
/* 약음기 낀 트럼펫 / 클라리넷. 비브라토를 걸어 「부는 사람」이 있는 것처럼 */
function lead(midi,t,dur,vol,kind){
  var o=ac.createOscillator(),g=ac.createGain(),bp=ac.createBiquadFilter(),lp=ac.createBiquadFilter();
  o.type=kind==='clar'?'square':'sawtooth';o.frequency.value=mtof(midi);
  bp.type='bandpass';bp.frequency.value=kind==='clar'?900:1500;bp.Q.value=kind==='clar'?1.1:2.2;
  lp.type='lowpass';lp.frequency.value=3200;
  var lfo=ac.createOscillator(),la=ac.createGain();
  lfo.frequency.value=5.2;la.gain.value=14;
  lfo.connect(la);la.connect(o.detune);lfo.start(t);lfo.stop(t+dur+.25);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.06);
  g.gain.setValueAtTime(vol,t+Math.max(.09,dur-.12));
  g.gain.exponentialRampToValueAtTime(.0001,t+dur+.14);
  o.connect(bp);bp.connect(lp);lp.connect(g);g.connect(musG);o.start(t);o.stop(t+dur+.25);
}
/* 브러시로 쓸어 주는 심벌. 2·4박만 조금 세게 — 이것이 스윙을 걷게 한다 */
function brush(t,vol,accent){
  var s=ac.createBufferSource();s.buffer=noiseBuf;
  var f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=accent?5200:6800;f.Q.value=.9;
  var g=ac.createGain();
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);
  g.gain.exponentialRampToValueAtTime(.0001,t+(accent?.17:.09));
  s.connect(f);f.connect(g);g.connect(musG);s.start(t);s.stop(t+.22);
}
function swingOf(pos){return (pos%4===2)?SW*(60/BPM):0}

function playStep(step,t0){
  var mo=MOODS[M.mood];if(!mo)return;
  var bar=Math.floor(step/16),pos=step%16,t=t0+swingOf(pos);
  var ch=CH[mo.prog[bar]],beat=pos/4;

  if(pos%4===0&&(mo.walk==='full'||pos===0||pos===8))bassPluck(bassNote(mo,bar,beat),t,.115);
  if(mo.ride&&pos%2===0){var ac2=(pos===4||pos===12);brush(t,ac2?.021:.012,ac2)}
  if(mo.stab.indexOf(pos)>=0)stab(ch.slice(1),t,.03);

  if(mo.theme&&bar<2){
    var ph=(mo.theme==='maj'?THEME_MAJ:THEME)[bar];
    ph.forEach(function(nt){if(nt.p===pos)lead(nt.n,t,nt.d*(60/BPM),.05,mo.lead)});
  }
  if(mo.ost&&pos%2===0){
    var seq=[ch[0]+12,ch[2],ch[1]+12,ch[2]];
    bassPluck(seq[(pos/2)%4],t,.05);
  }
  /* 즉흥 한 음. 앞 음에서 멀리 뛰지 않게 골라야 「선」으로 들린다 */
  if(mo.mel&&pos%2===0&&Math.random()<mo.mel){
    var scale=mo.major?SCALE_MAJ:SCALE_MIN;
    var pool=scale.filter(function(m){return m>=(mo.major?69:69)&&m<=83});
    if(M.lastMel){var near=pool.filter(function(m){return Math.abs(m-M.lastMel)<=4&&m!==M.lastMel});if(near.length)pool=near}
    var tone=pool.filter(function(m){return ch.some(function(c){return (m-c)%12===0})});
    if(tone.length&&Math.random()<.55)pool=tone;
    var n=pool[Math.floor(Math.random()*pool.length)];
    M.lastMel=n;lead(n,t,.3,.036,mo.lead);
  }
}
function schedule(){if(!ac)return;while(M.next<ac.currentTime+.3){playStep(M.step,M.next);M.next+=60/BPM/4;M.step=(M.step+1)%64}}
function synthOn(){if(M.timer)return;M.next=ac.currentTime+.08;M.step=0;M.timer=setInterval(schedule,70)}
function synthOff(){if(M.timer){clearInterval(M.timer);M.timer=null}}

/* ================= 녹음된 음원 (있으면 이걸 쓴다) =================
   합성 음악은 어떤 기기에서도 나오고 파일도 필요 없지만, 사람이 연주한 질감은 못 낸다.
   audio/ 에 파일이 있으면 그것을 틀고, 없으면 위의 합성으로 돌아간다(책 상담원과 같은 방식).
   파일을 지워도 게임은 그대로 돌아간다 — 어느 쪽도 없으면 조용할 뿐이다. */
var FILES={title:'audio/bgm-title.mp3', case:'audio/bgm-case.mp3', solve:'audio/bgm-solve.mp3'};
var MOODFILE={calm:'title',resolve:'solve',invest:'case',tense:'case',build:'case'};
/* 그 분위기의 파일이 아직 없으면 이 파일로 대신한다. 해결 화면 전용 곡을 넣기 전에도
   지금처럼 주제곡이 울리고, 파일을 넣는 순간 조용히 갈아탄다. */
var TRKFALL={solve:'title'};
var TRK={},trkKey=null,trkNode=null,trkGain=null,trkTried=false;
var TRKVOL=.6;
/* mp3 는 인코딩할 때 앞뒤에 20~50ms 짜리 빈 구간이 붙는다. 브라우저가 그걸 떼 주기도 하고
   안 떼 주기도 하는데, 안 떼면 한 바퀴마다 그만큼 박자가 밀려 「덜컥」 소리가 난다.
   그래서 파일을 믿지 않고 소리가 실제로 시작·끝나는 자리를 직접 찾아 그 사이만 돈다. */
function edgeTrim(buf){
  var ch=buf.getChannelData(0),sr=buf.sampleRate,n=ch.length;
  var lim=Math.min(n,Math.floor(sr*.15)),th=.0025,a=0,b=0,i,k;
  for(i=0;i<lim;i++){if(Math.abs(ch[i])>th){a=i;break}}
  for(i=0;i<lim;i++){k=n-1-i;if(Math.abs(ch[k])>th){b=i;break}}
  return {s:a/sr,e:(n-b)/sr};
}
function loadTracks(){
  if(trkTried||!ac)return;trkTried=true;
  Object.keys(FILES).forEach(function(k){
    fetch(FILES[k],{cache:'force-cache'}).then(function(r){
      if(!r.ok)throw 0;return r.arrayBuffer();
    }).then(function(ab){
      return new Promise(function(res,rej){ac.decodeAudioData(ab,res,rej)});
    }).then(function(buf){
      buf._cut=edgeTrim(buf);
      TRK[k]=buf;
      /* 지금 이 분위기에 해당하는 파일이 뒤늦게 도착했으면 합성에서 조용히 갈아탄다 */
      if((MOODFILE[M.mood]===k||TRKFALL[MOODFILE[M.mood]]===k)&&A.music)applyMood();
    }).catch(function(){/* 파일이 없는 건 흔한 일이다 — 조용히 넘어간다 */});
  });
}
function trkStop(fade){
  if(!trkNode)return;
  var n=trkNode,g=trkGain,t=ac.currentTime;
  g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);
  g.gain.linearRampToValueAtTime(0,t+(fade||.5));
  try{n.stop(t+(fade||.5)+.05)}catch(e){}
  trkNode=null;trkGain=null;trkKey=null;
}
function trkPlay(k){
  var buf=TRK[k];if(!buf)return false;
  if(trkKey===k&&trkNode)return true;
  trkStop(.5);
  var s=ac.createBufferSource(),g=ac.createGain(),cut=buf._cut||{s:0,e:buf.duration};
  s.buffer=buf;s.loop=true;s.loopStart=cut.s;s.loopEnd=cut.e;
  var t=ac.currentTime;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(TRKVOL,t+.6);
  s.connect(g);g.connect(musG);s.start(t,cut.s);
  trkNode=s;trkGain=g;trkKey=k;return true;
}
/* 지금 분위기에 맞는 음원이 있으면 음원을, 없으면 합성을 울린다 */
function applyMood(){
  if(!ac||!A.music)return;
  var k=MOODFILE[M.mood];
  if(k&&!TRK[k]&&TRKFALL[k])k=TRKFALL[k];
  if(k&&TRK[k]){synthOff();trkPlay(k)}
  else{trkStop(.4);synthOn()}
}
function startMusic(){if(!A.music||!wake())return;loadTracks();applyMood()}
function stopMusic(){synthOff();trkStop(.3)}
/* 분위기가 바뀌면 갈아탄다. 합성일 때는 마디를 잇고, 음원일 때는 0.5초 겹쳐 넘긴다 */
function setMood(m){
  if(M.mood===m)return;M.mood=m;M.lastMel=null;
  if(m==='resolve'&&M.timer)M.step=0;
  if(ac&&A.music&&(M.timer||trkNode))applyMood();
}
function setMusic(on){A.music=on;if(A.gain)A.gain.setTargetAtTime(on?1:0,ac.currentTime,.15);if(on)startMusic();else stopMusic();if(A.onChange)A.onChange()}
function setSfx(on){A.sfx=on;if(A.onChange)A.onChange()}
document.addEventListener('visibilitychange',function(){if(!ac)return;if(document.hidden){ac.suspend()}else if(A.music||A.sfx){ac.resume()}});
var sSting=function(){beep([392,523,659],.12,'triangle',.11);setTimeout(function(){beep([880],.28,'triangle',.1)},200);buzz([15,30,25])};

export {beep, noise, blip, buzz, wake, initAC,
        sTap, sFind, sGood, sBad, sFan, sNo, sHot, sPage, sStamp, sSting,
        startMusic, stopMusic, setMood, setMusic, setSfx};
