// 중계 장치와 이어 주는 작은 도우미 (큰 화면·휴대폰 함께 씀)
// 끊기면 알아서 다시 이어요.
//
// 두 가지 길이 있어요 (큰 화면·조종기 코드는 어느 길이든 똑같이 써요)
// 1) 달빛 오락실(game.edoori.co.kr): 다른 행사 게임과 함께 쓰는 축제 서버(/ws)에 「kart/rooms/방번호」 칸을 만들어 주고받아요
// 2) 집·학교 컴퓨터에서 relay.py를 켰을 때(localhost, 사설 주소): relay.py(/kart-ws)와 바로 주고받아요
// 주소 끝에 ?relay=주소 를 붙이면 2), ?db=주소 를 붙이면 1)로 정할 수 있어요

const Q = new URLSearchParams(location.search);

export function relayURL() {
  const q = Q.get('relay');
  if (q) return q;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/kart-ws`;
}

// 축제 서버 주소 (relay.py로 시험할 때는 null)
export function dbURL() {
  if (Q.get('relay')) return null;
  if (Q.get('db')) return Q.get('db');
  if (location.protocol === 'file:' || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname)) return null;
  return (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws';
}

// 쓰는 쪽에서는 언제나 new Relay(...) 하나만 써요
export class Relay {
  constructor(onOpen, onMsg, onState) {
    const db = dbURL();
    return db ? new DbRelay(db, onOpen, onMsg, onState) : new PlainRelay(onOpen, onMsg, onState);
  }
}

class Conn {
  constructor(url, onOpen, onMsg, onState) {
    this.url = url;
    this.onOpen = onOpen;      // 이어질 때마다 불림 (처음 인사를 여기서 보냄)
    this.onMsg = onMsg;
    this.onState = onState || (() => {});
    this.ws = null;
    this.wait = 500;
    this.connect();
  }
  connect() {
    this.onState('connecting');
    let ws;
    try { ws = new WebSocket(this.url); } catch (e) { this.retry(); return; }
    this.ws = ws;
    ws.onopen = () => { this.wait = 500; this.opened(); this.onState('open'); this.onOpen(); };
    ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch (_) { return; } this.recv(m); };
    ws.onclose = () => { if (this.ws === ws) { this.ws = null; this.onState('closed'); this.retry(); } };
    ws.onerror = () => {};
  }
  opened() {}
  retry() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.connect(), this.wait);
    this.wait = Math.min(this.wait * 1.6, 5000);
  }
  get ready() { return this.ws && this.ws.readyState === 1; }
  raw(obj) { if (this.ready) this.ws.send(JSON.stringify(obj)); }
}

// ── relay.py와 바로 ──
class PlainRelay extends Conn {
  constructor(onOpen, onMsg, onState) {
    super(relayURL(), onOpen, onMsg, onState);
    setInterval(() => this.send({ t: 'p' }), 20000);   // 조용할 때 끊기지 않게
  }
  recv(m) { this.onMsg(m); }
  send(obj) { this.raw(obj); }
}

// ── 축제 서버 (값을 쓰면 그 칸을 지켜보는 쪽에 알려 주는 방식) ──
// kart/rooms/방번호/host   큰 화면 열쇠          /hon/연결번호  큰 화면이 연결돼 있으면 1 (그 연결이 끊기면 서버가 지움.
//                                                 연결마다 칸이 달라서, 옛 연결이 늦게 정리돼도 새 표시는 남아요)
//                  /p/선수번호/info  참가 정보    /p/선수번호/m  선수 → 큰 화면 쪽지 (선수가 끊기면 서버가 지움)
//                  /to/선수번호      큰 화면 → 그 선수 쪽지        /all  큰 화면 → 모두
const ROOT = 'kart/rooms/';
const rnd = (n) => Array.from({ length: n }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.random() * 32 | 0]).join('');

class DbRelay extends Conn {
  constructor(url, onOpen, onMsg, onState) {
    super(url, onOpen, onMsg, onState);
    setInterval(() => this.raw({ t: 'time' }), 20000);   // 조용할 때 끊기지 않게
  }
  opened() { this.role = null; this.code = null; this.pid = null; this.n = 0; this.rid = 0; this.reqs = new Map(); this.hon = new Set(); }
  req(obj) {
    return new Promise((res) => {
      const id = ++this.rid; this.reqs.set(id, res);
      this.raw(Object.assign({ id }, obj));
      setTimeout(() => { if (this.reqs.delete(id)) res(null); }, 5000);
    });
  }
  put(path, val) { this.raw({ t: 'set', path: ROOT + this.code + path, val }); }
  send(obj) {
    if (obj.t === 'host') this.host(obj.code, obj.key);
    else if (obj.t === 'join') this.join(String(obj.code || ''), obj.info);
    else if (this.role === 'host' && obj.t === 'to') this.put('/to/' + obj.pid, { d: obj.d, n: ++this.n });
    else if (this.role === 'host' && obj.t === 'all') this.put('/all', { d: obj.d, n: ++this.n });
    else if (this.role === 'host' && obj.t === 'kick') { this.put('/to/' + obj.pid, { kick: 1, n: ++this.n }); this.put('/p/' + obj.pid, null); }
    else if (this.role === 'player' && obj.t === 'm') this.put('/p/' + this.pid + '/m', { d: obj.d, n: ++this.n });
  }
  async host(code, key) {
    const ws = this.ws;
    if (!/^\d{4}$/.test(code || '') || !key) code = null;
    if (code) {   // 다시 이어졌을 때: 내 방이면 같은 번호를 그대로 써요
      const h = await this.req({ t: 'get', path: ROOT + code + '/host' });
      if (!h || (h.val != null && h.val !== key)) code = null;
    }
    if (!code) key = rnd(12);
    for (let i = 0; !code && i < 20 && ws === this.ws; i++) {
      const c = String(1000 + Math.floor(Math.random() * 9000));
      const h = await this.req({ t: 'get', path: ROOT + c + '/host' });
      if (h && h.val == null) code = c;
    }
    if (!code || ws !== this.ws) return;
    this.role = 'host'; this.code = code;
    this.put('/host', key);
    const cid = rnd(8);
    this.put('/hon/' + cid, 1);
    this.raw({ t: 'ondc', path: ROOT + code + '/hon/' + cid });
    this.onMsg({ t: 'room', code, key });
    const s = await this.req({ t: 'sub', path: ROOT + code + '/p' });   // 이미 들어와 있는 선수
    if (s && s.val && ws === this.ws) for (const [pid, p] of Object.entries(s.val)) if (p && p.info) this.onMsg({ t: 'join', pid, info: p.info });
  }
  async join(code, info) {
    const ws = this.ws;
    if (!/^\d{4}$/.test(code)) { this.onMsg({ t: 'noroom' }); return; }
    const R = ROOT + code;
    const h = await this.req({ t: 'get', path: R + '/host' });
    if (ws !== this.ws) return;
    if (!h) { if (this.ws) this.ws.close(); return; }   // 대답이 없으면 다시 이어서 해 봐요
    if (h.val == null) { this.onMsg({ t: 'noroom' }); return; }
    const pid = rnd(8);
    this.role = 'player'; this.code = code; this.pid = pid;
    this.raw({ t: 'ondc', path: R + '/p/' + pid });
    this.raw({ t: 'ondc', path: R + '/to/' + pid });
    this.raw({ t: 'sub', path: R + '/to/' + pid });
    this.raw({ t: 'sub', path: R + '/all' });
    const hon = await this.req({ t: 'sub', path: R + '/hon' });
    if (ws !== this.ws) return;
    this.hon = new Set(hon && hon.val && typeof hon.val === 'object' ? Object.keys(hon.val) : []);
    this.put('/p/' + pid + '/info', info);
    this.onMsg({ t: 'joined', pid, host: this.hon.size > 0 });
  }
  recv(m) {
    if (m.t === 'res' || m.t === 'snap') { const f = this.reqs.get(m.id); if (f) { this.reqs.delete(m.id); f(m); } return; }
    if (m.t !== 'w' || m.self || !this.code || typeof m.path !== 'string') return;
    const R = ROOT + this.code + '/';
    if (!m.path.startsWith(R)) return;
    const k = m.path.slice(R.length).split('/'), v = m.val;
    if (this.role === 'host') {
      if (k[0] !== 'p' || !k[1]) return;
      const pid = k[1];
      if (k.length === 2) { if (v == null) this.onMsg({ t: 'leave', pid }); else if (v.info) this.onMsg({ t: 'join', pid, info: v.info }); }
      else if (k[2] === 'info' && v) this.onMsg({ t: 'join', pid, info: v });
      else if (k[2] === 'm' && v) this.onMsg({ t: 'm', pid, d: v.d });
    } else if (this.role === 'player') {
      if (k[0] === 'to' && k[1] === this.pid && v) {
        if (v.kick) { this.role = null; this.onMsg({ t: 'kicked' }); if (this.ws) this.ws.close(); return; }
        this.onMsg({ t: 'd', d: v.d });
      } else if (k[0] === 'all' && v) this.onMsg({ t: 'd', d: v.d });
      else if (k[0] === 'hon') {   // 큰 화면 연결 표시가 하나라도 남아 있으면 연결된 거예요
        const had = this.hon.size > 0;
        if (k[1]) { if (v) this.hon.add(k[1]); else this.hon.delete(k[1]); }
        else this.hon = new Set(v && typeof v === 'object' ? Object.keys(v) : []);
        if (had !== this.hon.size > 0) this.onMsg({ t: this.hon.size ? 'hostback' : 'hostgone' });
      }
    }
  }
}

export function store(key, val) {
  try {
    if (val === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, val);
  } catch (_) { return null; }
}
