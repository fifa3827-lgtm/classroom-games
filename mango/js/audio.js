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
var BPM=82,M={timer:null,next:0,step:0,mood:'calm',lastMel:null,padUntil:0};
function mtof(m){return 440*Math.pow(2,(m-69)/12)}
var CH={Dm:[62,65,69],Gm:[67,70,74],A:[69,73,76],Bb:[70,74,77],D:[62,66,69],G:[67,71,74],Em:[64,67,71]};
var SCALE_MIN=[62,64,65,67,69,70,72,74,76,77,79],SCALE_MAJ=[62,64,66,67,69,71,73,74,76,78,81];
var MOODS={
  calm:  {prog:['Dm','Gm','A','Dm'],bass:[0,8],bassPat:['r','r'],tick:[4,12],mel:.16,melLo:66,melHi:79,hat:false,pad:true,arp:false},
  invest:{prog:['Dm','Dm','Bb','A'],bass:[0,6,8,14],bassPat:['r','5','r','5'],tick:[4,12],mel:.11,melLo:69,melHi:81,hat:false,pad:true,arp:false},
  tense: {prog:['Dm','Bb','A','A'],bass:[0,4,8,12],bassPat:['r','5','b6','5'],tick:[4,12],mel:.22,melLo:74,melHi:86,hat:true,pad:true,arp:false},
  build: {prog:['Dm','Gm','Bb','A'],bass:[0,8],bassPat:['r','r'],tick:[4,12],mel:0,melLo:0,melHi:0,hat:false,pad:true,arp:true},
  resolve:{prog:['D','G','A','D'],bass:[0,8],bassPat:['r','5'],tick:[],mel:.2,melLo:69,melHi:83,hat:false,pad:true,arp:false,major:true},
  off:null
};
function pluck(midi,t,vol,dur){var o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();o.type='triangle';o.frequency.value=mtof(midi);f.type='lowpass';f.frequency.setValueAtTime(1400,t);f.frequency.exponentialRampToValueAtTime(300,t+(dur||.5));
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+(dur||.5));o.connect(f);f.connect(g);g.connect(musG);o.start(t);o.stop(t+(dur||.5)+.05)}
function vibe(midi,t,vol){var f=mtof(midi);[1,4].forEach(function(h,i){var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f*h;var v=vol*(i?.12:1);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+1.4);o.connect(g);g.connect(musG);o.start(t);o.stop(t+1.5)});
  // 살짝 떨림
}
function pad(chord,t,dur,major){chord.forEach(function(m,i){[-5,5].forEach(function(det){var o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=mtof(m-12);o.detune.value=det;
  f.type='lowpass';f.frequency.value=major?720:520;f.Q.value=.6;var v=.016;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.7);g.gain.setValueAtTime(v,t+dur-.6);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(f);f.connect(g);g.connect(musG);o.start(t);o.stop(t+dur+.05)})})}
function tick(t,vol){var s=ac.createBufferSource();s.buffer=noiseBuf;var f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=3200;var g=ac.createGain();
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.035);s.connect(f);f.connect(g);g.connect(musG);s.start(t);s.stop(t+.06);
  var o=ac.createOscillator(),g2=ac.createGain();o.type='square';o.frequency.value=2100;g2.gain.setValueAtTime(vol*.5,t);g2.gain.exponentialRampToValueAtTime(.0001,t+.02);o.connect(g2);g2.connect(musG);o.start(t);o.stop(t+.03)}
function hat(t){var s=ac.createBufferSource();s.buffer=noiseBuf;var f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=7500;var g=ac.createGain();
  g.gain.setValueAtTime(.014,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);s.connect(f);f.connect(g);g.connect(musG);s.start(t);s.stop(t+.05)}
function playStep(step,t){
  var mo=MOODS[M.mood];if(!mo)return;
  var bar=Math.floor(step/16),pos=step%16,chord=CH[mo.prog[bar]],scale=mo.major?SCALE_MAJ:SCALE_MIN,root=chord[0];
  if(pos===0&&mo.pad)pad(chord,t,60/BPM*4+.3,mo.major);
  var bi=mo.bass.indexOf(pos);
  if(bi>=0){var p=mo.bassPat[bi],n=root-24;if(p==='5')n=root-24+7;if(p==='b6')n=root-24+8;pluck(n,t,.11,.55)}
  if(mo.tick.indexOf(pos)>=0)tick(t,.05);
  if(mo.hat&&pos%2===0)hat(t);
  if(mo.arp&&pos%2===0){var seq=[chord[0],chord[1],chord[2],chord[1]+12,chord[0]+12,chord[2],chord[1],chord[0]];pluck(seq[(pos/2)%8],t,.06,.4)}
  if(mo.mel&&pos%2===0&&Math.random()<mo.mel){
    var cands=scale.filter(function(m){return m>=mo.melLo&&m<=mo.melHi});
    var ct=cands.filter(function(m){return chord.some(function(c){return (m-c)%12===0})});
    var pool=Math.random()<.6?ct:cands,n2=pool[Math.floor(Math.random()*pool.length)];
    if(n2===M.lastMel)n2=pool[Math.floor(Math.random()*pool.length)];
    M.lastMel=n2;vibe(n2,t,.045);
  }
}
function schedule(){if(!ac)return;while(M.next<ac.currentTime+.3){playStep(M.step,M.next);M.next+=60/BPM/4;M.step=(M.step+1)%64}}
function startMusic(){if(!A.music||!wake())return;if(M.timer)return;M.next=ac.currentTime+.08;M.step=0;M.timer=setInterval(schedule,70)}
function stopMusic(){if(M.timer){clearInterval(M.timer);M.timer=null}}
function setMood(m){if(M.mood===m)return;M.mood=m;if(m==='resolve'&&M.timer){M.step=0}}
function setMusic(on){A.music=on;if(A.gain)A.gain.setTargetAtTime(on?1:0,ac.currentTime,.15);if(on)startMusic();else stopMusic();if(A.onChange)A.onChange()}
function setSfx(on){A.sfx=on;if(A.onChange)A.onChange()}
document.addEventListener('visibilitychange',function(){if(!ac)return;if(document.hidden){ac.suspend()}else if(A.music||A.sfx){ac.resume()}});
var sSting=function(){beep([392,523,659],.12,'triangle',.11);setTimeout(function(){beep([880],.28,'triangle',.1)},200);buzz([15,30,25])};

export {beep, noise, blip, buzz, wake, initAC,
        sTap, sFind, sGood, sBad, sFan, sNo, sHot, sPage, sStamp, sSting,
        startMusic, stopMusic, setMood, setMusic, setSfx};
