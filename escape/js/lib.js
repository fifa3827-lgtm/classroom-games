// 재질·모양 도구 상자. 그림 파일 없이 코드로 질감을 그린다.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------- 난수와 노이즈 ----------
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 1 | s), s = (s + Math.imul(s ^ (s >>> 7), 61 | s)) ^ s, ((s ^ (s >>> 14)) >>> 0) / 4294967296));
}
function makeNoise(seed) {
  const r = rng(seed), p = new Float32Array(256 * 256);
  for (let i = 0; i < p.length; i++) p[i] = r();
  const at = (x, y) => p[((y & 255) << 8) | (x & 255)];
  const sm = t => t * t * (3 - 2 * t);
  const n = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  return (x, y, oct = 4) => { let v = 0, amp = .5, f = 1; for (let i = 0; i < oct; i++) { v += n(x * f, y * f) * amp; f *= 2; amp *= .5; } return v / (1 - Math.pow(.5, oct)); };
}
const NOISE = makeNoise(7);

const hex = c => new THREE.Color(c);
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// 픽셀 단위로 그리는 질감: fn(x,y) => [r,g,b] (0~1)  + 높이(0~1)
function pixelTex(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const b = document.createElement('canvas'); b.width = b.height = size;
  const g = c.getContext('2d'), gb = b.getContext('2d');
  const id = g.createImageData(size, size), ib = gb.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const [r, gg, bb, h] = fn(x / size, y / size);
    const i = (y * size + x) * 4;
    id.data[i] = clamp(r) * 255; id.data[i + 1] = clamp(gg) * 255; id.data[i + 2] = clamp(bb) * 255; id.data[i + 3] = 255;
    const hv = clamp(h ?? (r + gg + bb) / 3) * 255;
    ib.data[i] = ib.data[i + 1] = ib.data[i + 2] = hv; ib.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0); gb.putImageData(ib, 0, 0);
  return { color: c, bump: b };
}
function toTex(canvas, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- 질감 그리기 ----------
const texCache = new Map();
function cached(key, make) { if (!texCache.has(key)) texCache.set(key, make()); return texCache.get(key); }

export const TEX = {
  wood(color = '#6b4423', { planks = 0, seed = 3, size = 512 } = {}) {
    return cached('wood' + color + planks + seed, () => {
      const c = hex(color), nz = makeNoise(seed);
      return pixelTex(size, (u, v) => {
        let pv = v, plank = 0;
        if (planks) { plank = Math.floor(u * planks); pv = v + plank * 0.37; }
        // 결은 세로(v) 방향으로 길게: 가로로는 촘촘, 세로로는 느리게 변한다
        const warp = nz(u * 4 + plank * 5, pv * 1.5, 3);
        const ring = Math.sin((u * (planks ? 90 : 40) + warp * 14 + plank * 3)) * .5 + .5;
        const fine = nz(u * 160, pv * 4, 2);
        let k = mix(.78, 1.08, ring * .55 + fine * .45) * (.92 + nz(u * 2, pv * 2, 2) * .16);
        if (planks) {
          const e = (u * planks) % 1; if (e < .012 || e > .988) k *= .35;
          const off = (pv * 1.3 + plank * .53) % 1; if (off < .006) k *= .45;
          k *= .9 + (Math.sin(plank * 12.9) * .5 + .5) * .2;
        }
        return [c.r * k, c.g * k, c.b * k, ring * .6 + .2];
      });
    });
  },
  plaster(color = '#c9bba0', seed = 5) {
    return cached('pl' + color + seed, () => {
      const c = hex(color), nz = makeNoise(seed);
      return pixelTex(512, (u, v) => {
        const n = nz(u * 6, v * 6, 5), stain = nz(u * 1.5 + 9, v * 1.5, 3);
        const k = .86 + n * .2 - Math.max(0, stain - .6) * .5 - Math.max(0, v - .85) * .25;
        return [c.r * k, c.g * k, c.b * k, n];
      });
    });
  },
  brick(color = '#8a3d26', mortar = '#b8ab95', seed = 9) {
    return cached('br' + color + mortar, () => {
      const c = hex(color), m = hex(mortar), nz = makeNoise(seed), r = rng(seed);
      const tint = Array.from({ length: 200 }, () => .75 + r() * .4);
      return pixelTex(512, (u, v) => {
        const rows = 8, row = Math.floor(v * rows), bu = u * 4 + (row % 2) * .5, col = Math.floor(bu);
        const fu = bu % 1, fv = (v * rows) % 1;
        const edge = Math.min(fu, 1 - fu) * 2.2, edgeV = Math.min(fv, 1 - fv);
        if (edge < .06 || edgeV < .07) { const k = .8 + nz(u * 40, v * 40) * .3; return [m.r * k, m.g * k, m.b * k, .1]; }
        const k = tint[(row * 7 + col * 3) % 200] * (.85 + nz(u * 30, v * 30, 3) * .3);
        return [c.r * k, c.g * k, c.b * k, .6 + nz(u * 50, v * 50) * .4];
      });
    });
  },
  stone(color = '#7d776c', seed = 11) {
    return cached('st' + color, () => {
      const c = hex(color), nz = makeNoise(seed), r = rng(seed);
      const tint = Array.from({ length: 64 }, () => .8 + r() * .35);
      return pixelTex(512, (u, v) => {
        const rows = 4, row = Math.floor(v * rows), bu = u * 3 + (row % 2) * .5 + nz(u, v * 4) * .08, col = Math.floor(bu);
        const fu = bu % 1, fv = (v * rows) % 1, e = Math.min(fu, 1 - fu, Math.min(fv, 1 - fv) * .8);
        const n = nz(u * 14, v * 14, 5);
        if (e < .025) return [c.r * .35, c.g * .35, c.b * .35, 0];
        const k = tint[(row * 5 + col) & 63] * (.7 + n * .5);
        return [c.r * k, c.g * k, c.b * k, .4 + n * .6 * Math.min(1, e * 12)];
      });
    });
  },
  tiles(a = '#e8e2d4', b = '#2a2a2a', n = 8, seed = 4) {
    return cached('ti' + a + b + n, () => {
      const A = hex(a), B = hex(b), nz = makeNoise(seed);
      return pixelTex(512, (u, v) => {
        const x = Math.floor(u * n), y = Math.floor(v * n), c = (x + y) % 2 ? A : B;
        const fu = (u * n) % 1, fv = (v * n) % 1, e = Math.min(fu, 1 - fu, fv, 1 - fv);
        const k = (e < .025 ? .55 : 1) * (.92 + nz(u * 20, v * 20) * .12);
        return [c.r * k, c.g * k, c.b * k, e < .025 ? 0 : .8];
      });
    });
  },
  metal(color = '#8a8f96', seed = 2) {
    return cached('me' + color, () => {
      const c = hex(color), nz = makeNoise(seed);
      return pixelTex(256, (u, v) => {
        const k = .85 + nz(u * 2, v * 120, 2) * .15 + nz(u * 8, v * 8) * .08;
        return [c.r * k, c.g * k, c.b * k, nz(u * 3, v * 3)];
      });
    });
  },
  rust(color = '#6b5a4a', seed = 6) {
    return cached('ru' + color, () => {
      const c = hex(color), nz = makeNoise(seed), rc = hex('#7a3f1c');
      return pixelTex(512, (u, v) => {
        const r = clamp((nz(u * 5, v * 5, 5) - .5) * 3 + .3), k = .8 + nz(u * 30, v * 30) * .3;
        return [mix(c.r, rc.r, r) * k, mix(c.g, rc.g, r) * k, mix(c.b, rc.b, r) * k, r];
      });
    });
  },
  concrete(color = '#8d8b86', seed = 8) {
    return cached('co' + color, () => {
      const c = hex(color), nz = makeNoise(seed);
      return pixelTex(512, (u, v) => {
        const n = nz(u * 10, v * 10, 5), k = .8 + n * .3 - (nz(u * 80, v * 80, 1) > .85 ? .25 : 0);
        return [c.r * k, c.g * k, c.b * k, n];
      });
    });
  },
  fabric(color = '#6a1e22', pattern = 0, seed = 12) {
    return cached('fa' + color + pattern, () => {
      const c = hex(color), nz = makeNoise(seed);
      return pixelTex(512, (u, v) => {
        const weave = (Math.sin(u * 512 * 1.6) * Math.sin(v * 512 * 1.6)) * .05;
        let k = .85 + weave + nz(u * 10, v * 10) * .15;
        if (pattern) {
          const px = (u * 6) % 1 - .5, py = (v * 6) % 1 - .5, d = Math.abs(px) + Math.abs(py);
          if (Math.abs(d - .32) < .04 || d < .08) k *= 1.45;
          if (u % .5 < .02 || v % .5 < .02) k *= .6;
        }
        return [c.r * k, c.g * k, c.b * k, .5 + weave * 4];
      });
    });
  },
  wallpaper(color = '#2f4a3a', line = '#c9a96a', seed = 13) {
    return cached('wp' + color + line, () => {
      const c = hex(color), l = hex(line), nz = makeNoise(seed);
      return pixelTex(512, (u, v) => {
        const x = (u * 4) % 1 - .5, y = (v * 3) % 1 - .5;
        const d = Math.sqrt(x * x * 1.6 + y * y), lea = Math.abs(Math.sin(Math.atan2(y, x) * 4)) * .12;
        const motif = Math.abs(d - .25 - lea) < .02 || Math.abs(u * 8 % 1 - .5) < .012;
        const age = .85 + nz(u * 3, v * 3, 4) * .2;
        const t = motif ? .28 : 0; // 무늬는 은은하게
        return [mix(c.r, l.r, t) * age, mix(c.g, l.g, t) * age, mix(c.b, l.b, t) * age, motif ? .7 : .3];
      });
    });
  },
  sand(color = '#c8a970', seed = 14) {
    return cached('sa' + color, () => {
      const c = hex(color), nz = makeNoise(seed);
      return pixelTex(512, (u, v) => { const n = nz(u * 30, v * 30, 4), k = .82 + n * .3; return [c.r * k, c.g * k, c.b * k, n]; });
    });
  },
  noise(seed = 1) { return cached('nz' + seed, () => { const nz = makeNoise(seed); return pixelTex(256, (u, v) => { const n = nz(u * 8, v * 8, 5); return [n, n, n, n]; }); }); },
};

// ---------- 재질 ----------
function texMat(t, rep = [1, 1], o = {}) {
  const map = toTex(t.color), bump = toTex(t.bump, false);
  map.repeat.set(...rep); bump.repeat.set(...rep);
  return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: o.bump ?? 1.5, roughness: o.rough ?? .8, metalness: o.metal ?? 0, color: o.tint ?? 0xffffff });
}
export const MAT = {
  wood: (c = '#6b4423', rep = [1, 1], o = {}) => texMat(TEX.wood(c, o), rep, { rough: .62, bump: .8, ...o }),
  floor: (c = '#5a3a20', rep = [2, 2], o = {}) => texMat(TEX.wood(c, { planks: 6 }), rep, { rough: .55, bump: 1.2, ...o }),
  plaster: (c, rep = [2, 2], o = {}) => texMat(TEX.plaster(c), rep, { rough: .92, bump: 1, ...o }),
  brick: (c, m, rep = [2, 2], o = {}) => texMat(TEX.brick(c, m), rep, { rough: .9, bump: 3, ...o }),
  stone: (c, rep = [2, 2], o = {}) => texMat(TEX.stone(c), rep, { rough: .88, bump: 3, ...o }),
  tiles: (a, b, n, rep = [2, 2], o = {}) => texMat(TEX.tiles(a, b, n), rep, { rough: .35, bump: 1, ...o }),
  concrete: (c, rep = [2, 2], o = {}) => texMat(TEX.concrete(c), rep, { rough: .85, bump: 1.5, ...o }),
  fabric: (c, pattern = 0, rep = [2, 2], o = {}) => texMat(TEX.fabric(c, pattern), rep, { rough: .95, bump: .6, ...o }),
  wallpaper: (c, l, rep = [3, 2], o = {}) => texMat(TEX.wallpaper(c, l), rep, { rough: .85, bump: .5, ...o }),
  sand: (c, rep = [2, 2], o = {}) => texMat(TEX.sand(c), rep, { rough: .95, bump: 1.2, ...o }),
  rust: (c, rep = [1, 1], o = {}) => texMat(TEX.rust(c), rep, { rough: .7, metal: .6, bump: 1.5, ...o }),
  metal: (c = '#9aa0a6', o = {}) => texMat(TEX.metal(c), [1, 1], { rough: .35, metal: 1, bump: .3, ...o }),
  brass: (o = {}) => new THREE.MeshStandardMaterial({ color: 0xc89b4a, metalness: 1, roughness: .28, ...o }),
  gold: (o = {}) => new THREE.MeshStandardMaterial({ color: 0xffc35a, metalness: 1, roughness: .18, ...o }),
  silver: (o = {}) => new THREE.MeshStandardMaterial({ color: 0xd8dde3, metalness: 1, roughness: .2, ...o }),
  iron: (o = {}) => new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: .9, roughness: .5, ...o }),
  plain: (c, rough = .6, metal = 0, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal, ...o }),
  glow: (c, intensity = 2, o = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: intensity, roughness: .5, ...o }),
  glass: (c = 0xbfd8e8, opacity = .22, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .04, metalness: 0, transparent: true, opacity, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide, ...o }),
  paper: (o = {}) => texMat(TEX.plaster('#e9dcbc', 21), [1, 1], { rough: .95, bump: .3, ...o }),
  leather: (c = '#5a2a1a', o = {}) => texMat(TEX.concrete(c, 30), [1, 1], { rough: .6, bump: .6, ...o }),
};

// ---------- 글씨가 들어간 캔버스 ----------
export function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = toTex(c, srgb); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// 쪽지·간판 등에 쓰는 글씨 판. lines: 문자열 또는 배열.
export function textTexture(lines, o = {}) {
  const W = o.w ?? 512, H = o.h ?? 512;
  return canvasTexture(W, H, (g) => {
    if (o.bg !== null) { g.fillStyle = o.bg ?? '#e9dcbc'; g.fillRect(0, 0, W, H); }
    if (o.paper !== false && o.bg === undefined) {
      const gr = g.createRadialGradient(W / 2, H / 2, W * .2, W / 2, H / 2, W * .75);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(110,75,30,.35)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    const arr = Array.isArray(lines) ? lines : String(lines).split('\n');
    let size = o.size ?? 44;
    const setFont = () => g.font = `${o.weight ?? 700} ${size}px ${o.font ?? "'Noto Serif KR', serif"}`;
    setFont();
    // 가장 긴 줄이 판 밖으로 나가지 않게 글자를 줄인다
    const room = W - (o.align === 'left' ? 2 * (o.pad ?? 30) : W * .08);
    const widest = Math.max(...(Array.isArray(lines) ? lines : String(lines).split('\n')).map(t => g.measureText(t).width));
    if (widest > room) { size *= room / widest; setFont(); }
    const lh = size * (o.lh ?? 1.35);
    g.fillStyle = o.color ?? '#2b2116';
    g.textAlign = o.align ?? 'center'; g.textBaseline = 'middle';
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * .5; }
    const x = o.align === 'left' ? (o.pad ?? 30) : W / 2;
    const y0 = H / 2 - (arr.length - 1) * lh / 2 + (o.dy ?? 0);
    arr.forEach((s, i) => g.fillText(s, x, y0 + i * lh));
  });
}

// ---------- 장면을 쌓는 도구 ----------
export function makeKit(root, onUpdate) {
  const place = (m, o = {}) => {
    if (o.at) m.position.set(...o.at);
    if (o.rot) m.rotation.set(...o.rot);
    if (o.scale) typeof o.scale === 'number' ? m.scale.setScalar(o.scale) : m.scale.set(...o.scale);
    if (o.name) m.name = o.name;
    m.traverse(c => { if (c.isMesh) { c.castShadow = o.shadow ?? true; c.receiveShadow = true; } });
    if (o.parent !== false) (o.parent ?? root).add(m);
    return m;
  };
  const K = {
    THREE, MAT, TEX, place, textTexture, canvasTexture, rng,
    group(o = {}) { return place(new THREE.Group(), o); },
    box(w, h, d, mat, o = {}) { return place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), o); },
    rbox(w, h, d, r, mat, o = {}) { return place(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat), o); },
    cyl(rt, rb, h, mat, o = {}) { return place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 32, 1, o.open ?? false), mat), o); },
    sphere(r, mat, o = {}) { return place(new THREE.Mesh(new THREE.SphereGeometry(r, o.seg ?? 32, (o.seg ?? 32) / 2), mat), o); },
    torus(r, t, mat, o = {}) { return place(new THREE.Mesh(new THREE.TorusGeometry(r, t, 16, o.seg ?? 48, o.arc ?? Math.PI * 2), mat), o); },
    cone(r, h, mat, o = {}) { return place(new THREE.Mesh(new THREE.ConeGeometry(r, h, o.seg ?? 32), mat), o); },
    plane(w, h, mat, o = {}) { return place(new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat), { shadow: false, ...o }); },
    // 바깥선 점 [[반지름, 높이], ...]으로 돌려 만든 모양 (병, 꽃병, 촛대)
    lathe(pts, mat, o = {}) { return place(new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), o.seg ?? 40), mat), o); },
    // 글씨 판: 쪽지, 표지판, 칠판 글씨 등. o.size = 판 높이에 대한 글자 크기 비율(기본 .18)
    text(lines, w, h, o = {}) {
      const W = o.res ?? 1024, H = Math.round(W * h / w);
      const t = textTexture(lines, { ...o, w: W, h: H, size: (o.size ?? .18) * H });
      const mat = new THREE.MeshStandardMaterial({ map: t, roughness: .9, transparent: o.bg === null, emissive: o.emissive ? 0xffffff : 0x000000, emissiveMap: o.emissive ? t : null, emissiveIntensity: o.emissive ?? 0 });
      return place(new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat), { shadow: false, ...o });
    },
    // 그림판: draw(g, W, H)로 직접 그림
    picture(w, h, draw, o = {}) {
      const W = o.res ?? 512, H = Math.round(W * h / w);
      const t = canvasTexture(W, H, draw);
      const mat = new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? .8, transparent: !!o.transparent, emissive: o.emissive ? 0xffffff : 0, emissiveMap: o.emissive ? t : null, emissiveIntensity: o.emissive ?? 0 });
      return place(new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat), { shadow: false, ...o });
    },
    // 액자: 테두리 + 그림
    frame(w, h, draw, o = {}) {
      const g = place(new THREE.Group(), o), fm = o.frameMat ?? MAT.gold({ roughness: .4 }), t = o.border ?? .06;
      K.box(w + t * 2, t, .05, fm, { at: [0, h / 2 + t / 2, 0], parent: g });
      K.box(w + t * 2, t, .05, fm, { at: [0, -h / 2 - t / 2, 0], parent: g });
      K.box(t, h, .05, fm, { at: [-w / 2 - t / 2, 0, 0], parent: g });
      K.box(t, h, .05, fm, { at: [w / 2 + t / 2, 0, 0], parent: g });
      K.box(w, h, .02, MAT.plain(0x222222), { at: [0, 0, -.015], parent: g });
      g.userData.canvas = K.picture(w, h, draw, { at: [0, 0, .001], parent: g, res: o.res });
      return g;
    },
    // 빈 방: 바닥·벽·천장. 안쪽을 보는 상자. walls 기본 재질 하나 또는 {n,s,e,w}
    room({ w = 6, d = 6, h = 3, floor, wall, ceil, walls = {}, trim } = {}) {
      const g = place(new THREE.Group(), { name: 'room' });
      const rep = (m, a, b) => { m = m.clone(); for (const k of ['map', 'bumpMap']) if (m[k]) { m[k] = m[k].clone(); m[k].repeat.set(a, b); m[k].needsUpdate = true; } return m; };
      const fl = K.plane(w, d, rep(floor, w / 2, d / 2), { rot: [-Math.PI / 2, 0, 0], parent: g }); fl.receiveShadow = true; fl.name = 'floor';
      K.plane(w, d, rep(ceil ?? wall, w / 2, d / 2), { rot: [Math.PI / 2, 0, 0], at: [0, h, 0], parent: g });
      const W = (k, len, at, ry) => { const m = K.plane(len, h, rep(walls[k] ?? wall, len / 2, h / 2), { at, rot: [0, ry, 0], parent: g }); m.receiveShadow = true; m.name = 'wall_' + k; };
      W('n', w, [0, h / 2, -d / 2], 0); W('s', w, [0, h / 2, d / 2], Math.PI);
      W('w', d, [-w / 2, h / 2, 0], Math.PI / 2); W('e', d, [w / 2, h / 2, 0], -Math.PI / 2);
      if (trim) { // 걸레받이와 몰딩
        for (const [len, at, ry] of [[w, [0, 0, -d / 2], 0], [w, [0, 0, d / 2], Math.PI], [d, [-w / 2, 0, 0], Math.PI / 2], [d, [w / 2, 0, 0], -Math.PI / 2]]) {
          const b = K.box(len, .14, .03, trim, { at: [at[0], .07, at[2]], rot: [0, ry, 0], parent: g });
          b.translateZ(.015);
          const c = K.box(len, .1, .06, trim, { at: [at[0], h - .05, at[2]], rot: [0, ry, 0], parent: g });
          c.translateZ(.03);
        }
      }
      return g;
    },
    // 경첩으로 도는 문. 반환된 g.pivot을 돌리면 열린다.
    door({ w = 1, h = 2.1, t = .06, mat, frameMat, at = [0, 0, 0], rot = [0, 0, 0], hinge = 'left', knob = true, parent } = {}) {
      const g = place(new THREE.Group(), { at, rot, parent });
      const fm = frameMat ?? mat;
      K.box(.1, h + .1, .14, fm, { at: [-w / 2 - .05, h / 2 + .05 - .05, 0], parent: g });
      K.box(.1, h + .1, .14, fm, { at: [w / 2 + .05, h / 2, 0], parent: g });
      K.box(w + .2, .1, .14, fm, { at: [0, h + .05, 0], parent: g });
      const s = hinge === 'left' ? -1 : 1, pivot = new THREE.Group(); pivot.position.set(s * w / 2, 0, 0); g.add(pivot);
      const leaf = K.box(w, h, t, mat, { at: [-s * w / 2, h / 2, 0], parent: pivot });
      // 문 판넬 장식
      for (const y of [h * .28, h * .7]) K.box(w * .7, h * .3, t + .02, mat, { at: [-s * w / 2, y, 0], parent: pivot, scale: [1, 1, 1] }).scale.set(1, 1, 1);
      if (knob) for (const z of [t / 2 + .04, -t / 2 - .04]) K.sphere(.035, MAT.brass(), { at: [-s * (w - .1), h * .48, z], parent: pivot });
      g.pivot = pivot; g.leaf = leaf; g.openSign = s;
      return g;
    },
    // 책: 등에 색 띠
    book(w, h, d, color, o = {}) {
      const c = new THREE.Color(color);
      const spine = canvasTexture(64, 256, (g, W, H) => {
        g.fillStyle = '#' + c.getHexString(); g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,215,140,.8)'; g.fillRect(0, 22, W, 6); g.fillRect(0, H - 28, W, 6);
        if (o.label) { g.save(); g.translate(W / 2, H / 2); g.rotate(Math.PI / 2); g.fillStyle = '#f2dca6'; g.font = "700 30px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.label, 0, 0); g.restore(); }
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, 6, H); g.fillRect(W - 6, 0, 6, H);
      });
      const side = MAT.plain(color, .7), pages = MAT.plain(0xe8dcc0, .95);
      const spineMat = new THREE.MeshStandardMaterial({ map: spine, roughness: .6 });
      // 상자 면 순서: +x, -x, +y, -y, +z(앞=책등), -z
      return place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, pages, pages, spineMat, pages]), o);
    },
    table(w, d, h, mat, o = {}) {
      const g = place(new THREE.Group(), o);
      K.rbox(w, .06, d, .015, mat, { at: [0, h - .03, 0], parent: g });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box(.06, h - .06, .06, mat, { at: [sx * (w / 2 - .06), (h - .06) / 2, sz * (d / 2 - .06)], parent: g });
      K.box(w - .12, .1, .03, mat, { at: [0, h - .11, d / 2 - .06], parent: g });
      return g;
    },
    shelf(w, h, d, mat, rows = 4, o = {}) {
      const g = place(new THREE.Group(), o), t = .03;
      K.box(t, h, d, mat, { at: [-w / 2 + t / 2, h / 2, 0], parent: g });
      K.box(t, h, d, mat, { at: [w / 2 - t / 2, h / 2, 0], parent: g });
      K.box(w, h, .01, mat, { at: [0, h / 2, -d / 2 + .005], parent: g });
      for (let i = 0; i <= rows; i++) K.box(w, t, d, mat, { at: [0, i === rows ? h - t / 2 : .08 + i * (h - .08) / rows, 0], parent: g });
      g.rowY = i => .08 + t / 2 + i * (h - .08) / rows;
      return g;
    },
    chair(mat, o = {}) {
      const g = place(new THREE.Group(), o);
      K.rbox(.45, .05, .45, .01, mat, { at: [0, .46, 0], parent: g });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box(.04, .46, .04, mat, { at: [sx * .19, .23, sz * .19], parent: g });
      for (const sx of [-1, 1]) K.box(.04, .5, .04, mat, { at: [sx * .19, .73, -.2], parent: g });
      K.box(.42, .12, .03, mat, { at: [0, .88, -.2], parent: g });
      return g;
    },
    // 빛
    point(color, intensity, dist, o = {}) {
      const l = new THREE.PointLight(color, intensity, dist, 2);
      if (o.shadow) { l.castShadow = true; l.shadow.mapSize.set(o.res ?? 1024, o.res ?? 1024); l.shadow.bias = -0.002; l.shadow.radius = 4; l.shadow.camera.near = .05; }
      return place(l, { ...o, shadow: undefined });
    },
    spot(color, intensity, dist, target, o = {}) {
      const l = new THREE.SpotLight(color, intensity, dist, o.angle ?? .6, o.penumbra ?? .5, 2);
      if (o.shadow) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.0015; l.shadow.radius = 4; }
      place(l, { ...o, shadow: undefined });
      l.target.position.set(...target); (o.parent ?? root).add(l.target);
      return l;
    },
    // 촛불: 불꽃 + 흔들리는 빛
    candle(o = {}) {
      const g = place(new THREE.Group(), o), hgt = o.h ?? .16;
      K.cyl(.025, .028, hgt, MAT.plain(0xf1e6cc, .6, 0, { emissive: 0x332211, emissiveIntensity: .3 }), { at: [0, hgt / 2, 0], parent: g });
      const flame = K.sphere(.014, MAT.glow(0xffb347, 6), { at: [0, hgt + .025, 0], scale: [1, 2.2, 1], parent: g, shadow: false });
      flame.castShadow = false; flame.userData.noRay = true;
      let light = null;
      if (o.light !== false) light = K.point(0xff9a40, o.intensity ?? 1.2, o.dist ?? 4, { at: [0, hgt + .1, 0], parent: g, shadow: o.shadow });
      const ph = Math.random() * 10;
      onUpdate((dt, t) => {
        const f = .85 + Math.sin(t * 9 + ph) * .06 + Math.sin(t * 23 + ph) * .05 + Math.random() * .04;
        flame.scale.set(1, 2.2 * f, 1); if (light) light.intensity = (o.intensity ?? 1.2) * f;
      });
      g.flame = flame; g.light = light;
      return g;
    },
    // 떠다니는 먼지
    dust(count = 300, size = [6, 3, 6], o = {}) {
      const geo = new THREE.BufferGeometry(), p = new Float32Array(count * 3), r = rng(o.seed ?? 5);
      for (let i = 0; i < count; i++) { p[i * 3] = (r() - .5) * size[0]; p[i * 3 + 1] = r() * size[1]; p[i * 3 + 2] = (r() - .5) * size[2]; }
      geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const dot = canvasTexture(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
      const m = new THREE.PointsMaterial({ size: o.px ?? .02, map: dot, color: o.color ?? 0xffe2b0, transparent: true, opacity: o.opacity ?? .5, depthWrite: false, blending: THREE.AdditiveBlending });
      const pts = new THREE.Points(geo, m); pts.userData.noRay = true; root.add(pts);
      onUpdate((dt) => {
        const a = geo.attributes.position.array;
        for (let i = 0; i < count; i++) { a[i * 3 + 1] += dt * (o.speed ?? .03) * (.5 + (i % 7) / 7); a[i * 3] += Math.sin(a[i * 3 + 1] * 3 + i) * dt * .01; if (a[i * 3 + 1] > size[1]) a[i * 3 + 1] = 0; }
        geo.attributes.position.needsUpdate = true;
      });
      return pts;
    },
  };
  return K;
}
