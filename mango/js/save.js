/* 탐정 망고 · 저장
   교실 공용 기기를 쓰는 아이가 탭을 닫아도 하던 자리로 돌아올 수 있어야 한다.
   - 모든 상태 변화는 500ms 디바운스로 localStorage에 자동 저장
   - 소리 설정은 진행과 따로 보관한다(새로 시작해도 유지)
   - 백업 코드: 저장 내용을 문자열로 뽑아 다른 기기에 옮긴다 */

var PREF='mango.pref.v1', VER=2;
/* 저장 칸은 사건별로 나눈다.
   v2 — 추리 선택지의 순서를 바꿨다. 옛 저장은 「몇 번째를 골랐다」를 숫자로 들고 있어서
   그대로 이어하면 엉뚱한 결론이 골라진 채로 돌아온다. 그래서 칸 이름을 새로 판다. */
function KEY(){var c=(typeof window!=='undefined'&&window.MANGO_CASE)||'01';return 'mango.save.v2'+(c==='01'?'':'.c'+c)}

/* 저장할 것만 추린다. 화면에 잠깐 쓰는 값(lens 위치, 열어 둔 단계 따위)은 뺀다. */
function pack(S){
  return {v:VER, t:Date.now(), screen:S.screen, mode:S.mode, easy:S.easy,
    lamps:S.lamps, found:S.found, flags:S.flags, tab:S.tab,
    steps:S.steps, elim:S.elim, proofs:S.proofs, phase:S.phase,
    tries:S.tries, elimTries:S.elimTries, accErr:S.accErr, rebutErr:S.rebutErr,
    eyes:S._eyes||{}};   /* 인물별 표정 — 예전엔 콩이·콩순이만 박혀 있었다 */
}

var timer=null;
function save(S){
  if(!S||S.screen==='s-title')return;          // 표지에서는 저장하지 않는다
  clearTimeout(timer);
  timer=setTimeout(function(){
    try{localStorage.setItem(KEY(),JSON.stringify(pack(S)))}catch(e){}
  },500);
}
function saveNow(S){
  clearTimeout(timer);
  try{localStorage.setItem(KEY(),JSON.stringify(pack(S)))}catch(e){}
}
function load(){
  try{
    var raw=localStorage.getItem(KEY()); if(!raw)return null;
    var d=JSON.parse(raw);
    if(!d||d.v!==VER)return null;              // 판이 다르면 버린다(마이그레이션 자리)
    return d;
  }catch(e){return null}
}
function clear(){clearTimeout(timer);try{localStorage.removeItem(KEY())}catch(e){}}
function has(){return !!load()}

/* 소리 설정은 진행과 별개 */
function loadPrefs(){
  try{var p=JSON.parse(localStorage.getItem(PREF)||'null');return p||null}catch(e){return null}
}
function savePrefs(p){try{localStorage.setItem(PREF,JSON.stringify(p))}catch(e){}}

/* ---- 백업 코드 ----
   저장 JSON → UTF-8 → base64. 사람이 옮겨 적기보다 복사/붙여넣기를 전제로 한다. */
function makeCode(){
  var d=load(); if(!d)return null;
  try{
    var bytes=new TextEncoder().encode(JSON.stringify(d));
    var bin=''; for(var i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);
    return 'MANGO1-'+btoa(bin).replace(/=+$/,'');
  }catch(e){return null}
}
function applyCode(code){
  try{
    var s=String(code||'').trim();
    if(s.indexOf('MANGO1-')!==0)return {ok:false,why:'코드가 「MANGO1-」로 시작하지 않아요.'};
    var b64=s.slice(7); while(b64.length%4)b64+='=';
    var bin=atob(b64), bytes=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    var d=JSON.parse(new TextDecoder().decode(bytes));
    if(!d||d.v!==VER)return {ok:false,why:'이 코드는 다른 판에서 만든 것이에요.'};
    localStorage.setItem(KEY(),JSON.stringify(d));
    return {ok:true};
  }catch(e){return {ok:false,why:'코드를 읽을 수 없어요. 빠진 글자가 없는지 확인해 주세요.'}}
}

/* 마지막으로 논 때를 사람 말로 */
function agoText(t){
  if(!t)return '';
  var m=Math.floor((Date.now()-t)/60000);
  if(m<1)return '조금 전';
  if(m<60)return m+'분 전';
  var h=Math.floor(m/60); if(h<24)return h+'시간 전';
  return Math.floor(h/24)+'일 전';
}

export {save, saveNow, load, clear, has, loadPrefs, savePrefs, makeCode, applyCode, agoText};
