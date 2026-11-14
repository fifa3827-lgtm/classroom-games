// 화면 맞춤: 맵을 빈 띠 없이 꽉 채우되(cover), 안전 구역(길·빈자리·성문)은 HUD를 피해 늘 보이게
export class View {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.W = 1; this.H = 1; this.dpr = 1; this.s = 1; this.ox = 0; this.oy = 0;
    this.inset = { t: 0, b: 0, l: 0, r: 0 };
  }
  resize() {
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    return this.W < this.H ? 'v' : 'h';
  }
  fit(MW, MH, safe, inset) {
    this.MW = MW; this.MH = MH; this.inset = inset;
    const { W, H } = this;
    const sc = Math.max(W / MW, H / MH);
    const sw = (safe[2] - safe[0]) * MW, sh = (safe[3] - safe[1]) * MH;
    const aw = W - inset.l - inset.r, ah = H - inset.t - inset.b;
    const sf = Math.min(aw / sw, ah / sh);
    const s = Math.min(sc, sf);
    const cx = (safe[0] + safe[2]) / 2 * MW, cy = (safe[1] + safe[3]) / 2 * MH;
    let ox = inset.l + aw / 2 - cx * s, oy = inset.t + ah / 2 - cy * s;
    // 맵이 화면보다 크면 빈 곳이 안 생기게, 작으면(흐린 바탕이 보임) 안전 구역이 정보 띠를 피하는 자리를 지킨다
    const clamp = (v, a, b) => Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b));
    ox = clamp(ox, 0, W - MW * s);
    oy = clamp(oy, 0, H - MH * s);
    this.s = s; this.ox = ox; this.oy = oy;
    this.banded = MW * s < W - 0.5 || MH * s < H - 0.5;
  }
  w2s(x, y) { return [this.ox + x * this.s, this.oy + y * this.s]; }
  s2w(x, y) { return [(x - this.ox) / this.s, (y - this.oy) / this.s]; }
}
