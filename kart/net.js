// 중계 장치와 이어 주는 작은 도우미 (큰 화면·휴대폰 함께 씀)
// 끊기면 알아서 다시 이어요.

export function relayURL() {
  const q = new URLSearchParams(location.search).get('relay');
  if (q) return q;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/kart-ws`;
}

export class Relay {
  constructor(onOpen, onMsg, onState) {
    this.onOpen = onOpen;      // 이어질 때마다 불림 (처음 인사를 여기서 보냄)
    this.onMsg = onMsg;
    this.onState = onState || (() => {});
    this.ws = null;
    this.wait = 500;
    this.connect();
    setInterval(() => this.send({ t: 'p' }), 20000);   // 조용할 때 끊기지 않게
  }
  connect() {
    this.onState('connecting');
    let ws;
    try { ws = new WebSocket(relayURL()); } catch (e) { this.retry(); return; }
    this.ws = ws;
    ws.onopen = () => { this.wait = 500; this.onState('open'); this.onOpen(); };
    ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch (_) { return; } this.onMsg(m); };
    ws.onclose = () => { if (this.ws === ws) { this.ws = null; this.onState('closed'); this.retry(); } };
    ws.onerror = () => {};
  }
  retry() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.connect(), this.wait);
    this.wait = Math.min(this.wait * 1.6, 5000);
  }
  get ready() { return this.ws && this.ws.readyState === 1; }
  send(obj) { if (this.ready) this.ws.send(JSON.stringify(obj)); }
}

export function store(key, val) {
  try {
    if (val === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, val);
  } catch (_) { return null; }
}
