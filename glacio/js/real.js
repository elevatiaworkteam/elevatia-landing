// Producto real: fotos y secuencias de estudio (sin fondo) que se recolorean en vivo.
// Las tomas originales son color Bahía; un sombreador cambia solo la pintura al color elegido
// y deja intactos el acero, la tapa, el hielo y las sombras.
// Las animaciones son cuadros sueltos ya cargados en memoria: responden al instante, sin congelarse.

const BASES = { vaso20: ['vaso', 0.88], vaso30: ['vaso', 1], vaso40: ['asa', 1], termo18: ['termo', 0.84], termo36: ['termo', 0.93], termo64: ['termo', 1], taza14: ['taza', 0.86], lata12: ['lata', 0.86] };
const FOTOS = ['vaso-4k', 'vaso-2k', 'vaso', 'asa', 'termo', 'taza', 'lata', 'vaso-corte', 'asa-corte', 'termo-corte', 'taza-corte', 'lata-corte'];
// qué parte del alto ocupa la tapa (zona donde se hace clic) y dónde va el punto de ayuda
const TAPA = { vaso: [0.2, 0.5], asa: [0.3, 0.38], termo: [0.25, 0.5], taza: [0.3, 0.4], lata: [0.34, 0.5] };
export const base = forma => (BASES[forma] || BASES.vaso30)[0];
export const tiene = (forma, tipo) => FOTOS.includes(`${base(forma)}-${tipo}`);

const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
// En celulares y tabletas se usa una versión liviana de las secuencias (540×720, mitad de cuadros).
export const MOVIL = window.matchMedia('(max-width: 860px), (pointer: coarse)').matches;
// Modo simple: imágenes normales en vez de ImageBitmap. Se usa en celular y en Safari,
// donde las opciones de ImageBitmap no se comportan igual que en Chrome.
const SAFARI = /^((?!chrome|chromium|android|edg).)*safari/i.test(navigator.userAgent);
const SIMPLE = MOVIL || SAFARI || !window.createImageBitmap;
const RAIZ = MOVIL ? 'real/m/' : 'real/';
const FINO = MOVIL ? 'vaso-2k' : 'vaso-4k'; // foto para los acercamientos
const W = MOVIL ? 540 : 1080, H = MOVIL ? 720 : 1440;
// Avisa cuando un elemento entra o sale de la pantalla (para pausar lo que no se ve).
function alVer(el, cb, margen = '0px') {
  if (!('IntersectionObserver' in window)) { cb(true); return { disconnect() {} }; }
  const o = new IntersectionObserver(es => cb(es[es.length - 1].isIntersecting), { rootMargin: margen });
  o.observe(el); return o;
}

// ---------- Pintor WebGL compartido ----------
const lienzoGL = document.createElement('canvas');
const gl = lienzoGL.getContext('webgl', { premultipliedAlpha: true, antialias: false });
let uObj, uMezcla;
if (gl) {
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `precision mediump float;
    varying vec2 uv; uniform sampler2D t; uniform vec3 obj; uniform float mezcla;
    float tono(vec3 c){ float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), d = mx - mn; if (d < 1e-4) return 0.;
      float h = mx == c.r ? mod((c.g - c.b) / d, 6.) : (mx == c.g ? (c.b - c.r) / d + 2. : (c.r - c.g) / d + 4.); return h / 6.; }
    void main(){
      vec4 q = texture2D(t, uv); vec3 c = q.rgb; float a = q.a;
      float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
      float sat = mx > 0. ? (mx - mn) / mx : 0.;
      float dh = abs(tono(c) - .483); dh = min(dh, 1. - dh);
      float m = (1. - smoothstep(.07, .14, dh)) * smoothstep(.1, .28, sat) * mezcla;
      vec3 rec = obj * (mx / .70);
      rec = mix(rec, vec3(mx), clamp(1. - sat / .82, 0., 1.) * .75);
      c = mix(c, min(rec, 1.), m);
      gl_FragColor = vec4(c * a, a);
    }`));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  uObj = gl.getUniformLocation(prog, 'obj'); uMezcla = gl.getUniformLocation(prog, 'mezcla');
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.disable(gl.BLEND);
}
// Recolorea la imagen y devuelve un lienzo listo para dibujar (o la imagen misma si no hay WebGL).
function recolorear(im, color) {
  const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
  if (!gl || !w) return im;
  if (lienzoGL.width !== w || lienzoGL.height !== h) { lienzoGL.width = w; lienzoGL.height = h; }
  gl.viewport(0, 0, w, h);
  const esBitmap = typeof ImageBitmap !== 'undefined' && im instanceof ImageBitmap;
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !esBitmap); // los ImageBitmap ya se crearon volteados
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); } catch { return im; }
  gl.uniform3fv(uObj, color);
  gl.uniform1f(uMezcla, Math.abs(color[0] - 0.07) + Math.abs(color[1] - 0.71) + Math.abs(color[2] - 0.68) < 0.02 ? 0 : 1);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return lienzoGL;
}
// Dibuja la imagen recoloreada en el lienzo 2D. `e` es la escala del producto dentro del cuadro.
function pintar(ctx, im, color, e = 1, w = ctx.canvas.width, h = ctx.canvas.height) {
  ctx.drawImage(recolorear(im, color), w * (1 - e) / 2, h * (1 - e) * 0.9, w * e, h * e);
}
// Dibuja el cuadro `a` fundido con `b` (f = 0…1): entre dos cuadros reales el movimiento se ve continuo.
function pintarMezcla(ctx, a, b, f, color, e = 1) {
  pintar(ctx, a, color, e);
  if (b && b !== a && f > 0.03) { ctx.globalAlpha = f; pintar(ctx, b, color, e); ctx.globalAlpha = 1; }
}
function acercarColor(color, meta) {
  let cambia = false;
  for (let i = 0; i < 3; i++) { const d = meta[i] - color[i]; if (Math.abs(d) > 0.002) { color[i] += d * 0.12; cambia = true; } }
  return cambia;
}

// ---------- Fotos y secuencias ----------
const imgs = {};
let indice = {}, _listo;
export function listo() {
  _listo ||= Promise.all([
    fetch(RAIZ + 'cuadros.json', { cache: 'no-store' }).then(r => r.json()).then(j => { indice = j; }).catch(() => {}),
    ...FOTOS.filter(n => !n.startsWith('vaso-') || !/-[24]k$/.test(n) || n === FINO).map(n => new Promise(res => { const im = new Image(); im.onload = () => { imgs[n] = im; res(); }; im.onerror = res; im.src = `real/${n}.webp`; })),
  ]);
  return _listo;
}
const _sec = new Map();
// Carga (una sola vez) todos los cuadros de una secuencia. Devuelve { n, imgs, cargados }.
// Primero baja 1 de cada 8, luego 1 de cada 4, de cada 2 y el resto: la animación sirve desde el primer segundo.
function secuencia(nombre) {
  if (_sec.has(nombre)) return _sec.get(nombre);
  const n = indice[nombre] || 0;
  const s = { nombre, n, imgs: new Array(n), cargados: 0, bm: new Map(), pend: new Set() };
  const orden = [], visto = new Set();
  for (const paso of [8, 4, 2, 1]) for (let i = 0; i < n; i += paso) if (!visto.has(i)) { visto.add(i); orden.push(i); }
  let k = 0;
  const siguiente = () => {
    if (k >= orden.length) return;
    const i = orden[k++], url = `${RAIZ}${nombre}/${String(i).padStart(3, '0')}.webp`;
    if (SIMPLE) {
      const im = new Image();
      im.onload = () => { (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => { s.imgs[i] = im; s.cargados++; siguiente(); }); };
      im.onerror = siguiente;
      im.src = url;
    } else {
      fetch(url).then(r => (r.ok ? r.blob() : null))
        .then(bl => { if (bl) { s.imgs[i] = bl; s.cargados++; } })
        .catch(() => {}).finally(siguiente);
    }
  };
  for (let c = 0; c < (MOVIL ? 5 : 8); c++) siguiente();
  _sec.set(nombre, s);
  return s;
}
// Cuadros ya decodificados (ImageBitmap): se decodifican fuera del hilo principal y dibujarlos no cuesta nada.
// Solo se guardan los usados más recientemente (entre todas las secuencias) para no llenar la memoria.
const BM_W = MOVIL ? 630 : 900, BM_H = MOVIL ? 840 : 1200, MAX_BM = MOVIL ? 60 : 84;
// en computadora se usa el cuadro completo (1080×1440); en celular se reduce para cuidar la memoria
const OPC_BM = MOVIL ? { premultiplyAlpha: 'none', imageOrientation: 'flipY', resizeWidth: BM_W, resizeHeight: BM_H, resizeQuality: 'low' } : { premultiplyAlpha: 'none', imageOrientation: 'flipY' };
let reloj = 0, totalBM = 0, pendientes = 0;
function descartar() {
  let sv = null, kv = null, tv = Infinity;
  for (const q of _sec.values()) for (const [k, v] of q.bm) if (v.t < tv) { tv = v.t; kv = k; sv = q; }
  if (sv) { sv.bm.get(kv).bm.close(); sv.bm.delete(kv); totalBM--; }
}
const listoCuadro = (s, i) => (SIMPLE ? !!s.imgs[i] : s.bm.has(i));
function pedir(s, i) {
  if (SIMPLE) return s.imgs[i] || null;
  const e = s.bm.get(i);
  if (e) { e.t = ++reloj; return e.bm; }
  const bl = s.imgs[i];
  if (bl && !s.pend.has(i) && pendientes < 10 && window.createImageBitmap) {
    s.pend.add(i); pendientes++;
    createImageBitmap(bl, OPC_BM).then(bm => {
      s.bm.set(i, { bm, t: ++reloj }); totalBM++;
      while (totalBM > MAX_BM) descartar();
    }).catch(() => {}).finally(() => { s.pend.delete(i); pendientes--; });
  }
  return null;
}
// Devuelve el cuadro i listo para dibujar y va preparando los que siguen en la dirección del movimiento.
// Si aún no está listo, devuelve el vecino ya decodificado más cercano: nunca se detiene a esperar.
const ADELANTE = [1, 2, 3, 4, 5, 6, 8, 10, 13, 16];
function tomar(s, i, dir = 1, ciclo = false) {
  const n = s.n, idx = k => (ciclo ? ((k % n) + n) % n : Math.max(0, Math.min(n - 1, k)));
  i = idx(Math.round(i));
  const b = pedir(s, i);
  for (const d of ADELANTE) pedir(s, idx(i + d * dir));
  pedir(s, idx(i - dir));
  if (b) return b;
  for (let d = 1; d <= (SIMPLE ? n : 20); d++) {
    const x = pedir(s, idx(i - d * dir)) || pedir(s, idx(i + d * dir));
    if (x) return x;
  }
  return null;
}
const _cajas = {};
function caja(b) { // rectángulo que ocupa el producto dentro de la foto (0–1)
  if (_cajas[b]) return _cajas[b];
  const im = imgs[b]; if (!im) return { x: 0.2, y: 0.05, w: 0.6, h: 0.9 };
  const c = document.createElement('canvas'); c.width = 90; c.height = 120;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, 90, 120);
  const d = x.getImageData(0, 0, 90, 120).data;
  let x0 = 90, x1 = 0, y0 = 120, y1 = 0;
  for (let j = 0; j < 120; j++) for (let i = 0; i < 90; i++) if (d[(j * 90 + i) * 4 + 3] > 200) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
  return (_cajas[b] = { x: x0 / 90, y: y0 / 120, w: (x1 - x0 + 1) / 90, h: (y1 - y0 + 1) / 120 });
}

const _cache = new Map();
const _tmp = document.createElement('canvas');
// Foto recoloreada como URL de imagen. tipo: 'base' | 'corte'
export function foto(forma, hex, tipo = 'base', px = 560) {
  const [b, esc] = BASES[forma] || BASES.vaso30;
  const nombre = tipo === 'base' ? b : `${b}-${tipo}`;
  const k = `${nombre}|${esc}|${hex}|${px}`;
  if (_cache.has(k)) return _cache.get(k);
  const im = imgs[nombre] || imgs[b];
  if (!im) return '';
  _tmp.width = px; _tmp.height = Math.round(px * im.height / im.width);
  const ctx = _tmp.getContext('2d');
  ctx.clearRect(0, 0, _tmp.width, _tmp.height);
  pintar(ctx, im, rgb(hex), tipo === 'base' ? esc : Math.min(1, esc + 0.06));
  const url = _tmp.toDataURL('image/webp', 0.9);
  _cache.set(k, url);
  return url;
}

// ---------- Termo interactivo ----------
// Arrastrar = girarlo 360°. Clic en la tapa = se abre y la cámara sube para verlo por dentro.
// Abierto: arrastrar arriba/abajo cambia el ángulo; otro clic lo cierra.
export function crearJuguete(cont, forma, hex, { activo = true, auto = true } = {}) {
  const [b, esc] = BASES[forma] || BASES.vaso30;
  cont.classList.add('juguete');
  cont.innerHTML = '<canvas></canvas><button class="toque" type="button" aria-label="Abrir la tapa" hidden><i></i></button>';
  const canvas = cont.firstElementChild, punto = cont.lastElementChild, ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  let color = rgb(hex), meta = rgb(hex), vivo = true, raf = 0, sucio = true, girando = auto;
  let G = null, A = null, B = null;      // secuencias: giro, abrir tapa, subir cámara
  let g = 0, pos = 0, fase = 'cerrado';  // g: cuadro del giro · pos: avance de abrir+subir
  let arrastre = null, ultimo = null, antes = performance.now(), pintado = 0;
  const [zona, puntoX] = TAPA[b];

  function cargar() {
    if (G) return;
    G = secuencia(`giro-${b}`);
    const resto = () => { if (vivo) { A = secuencia(`abrir-${b}`); B = secuencia(`subir-${b}`); } };
    if (MOVIL) setTimeout(resto, 2200); else resto(); // en celular primero baja el giro
  }
  let enPantalla = true;
  const ojo = alVer(cont, v => { enPantalla = v; if (v) { antes = performance.now(); sucio = true; } });
  const total = () => (A ? A.n : 0) + (B ? B.n : 0);
  const sePuedeAbrir = () => A && A.n > 0;
  if (activo) cargar();

  function ubicarPunto() {
    const c = caja(b);
    punto.style.left = `${((1 - esc) / 2 + (c.x + c.w * puntoX) * esc) * 100}%`;
    punto.style.top = `${((1 - esc) * 0.9 + (c.y + c.h * zona * 0.45) * esc) * 100}%`;
  }
  function alternar() {
    if (!sePuedeAbrir()) return;
    if (fase === 'cerrado' || fase === 'cerrando') { fase = 'abriendo'; cont.classList.add('abierto'); }
    else { fase = 'cerrando'; cont.classList.remove('abierto'); }
  }
  function enTapa(e) {
    const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, c = caja(b);
    const cx = (1 - esc) / 2 + c.x * esc, cy = (1 - esc) * 0.9 + c.y * esc;
    return x > cx - 0.03 && x < cx + c.w * esc + 0.03 && y > cy - 0.05 && y < cy + c.h * esc * zona;
  }
  const onDown = e => {
    if (!activo) return;
    arrastre = { x: e.clientX, y: e.clientY, g, pos, t: performance.now(), movido: 0 };
    canvas.setPointerCapture?.(e.pointerId); canvas.classList.add('agarrando');
  };
  const onMove = e => {
    if (!arrastre) return;
    const r = canvas.getBoundingClientRect(), dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
    arrastre.movido = Math.max(arrastre.movido, Math.abs(dx), Math.abs(dy));
    if (fase === 'cerrado' && G && G.n) { const ng = ((arrastre.g - dx / (r.width * 1.15) * G.n) % G.n + G.n) % G.n; arrastre.dir = dx < (arrastre.dx || 0) ? 1 : -1; arrastre.dx = dx; g = ng; }
    else if (fase === 'abierto' && B && B.n) { // abierto: arrastrar en cualquier dirección cambia el ángulo
      const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      pos = Math.max(A.n - 1, Math.min(total() - 1, arrastre.pos + d / r.height * B.n * 1.6));
    }
  };
  const onUp = e => {
    if (!arrastre) return;
    const clic = arrastre.movido < 7 && performance.now() - arrastre.t < 500;
    arrastre = null; canvas.classList.remove('agarrando');
    if (!clic) return;
    if (fase === 'abierto' || fase === 'abriendo') alternar(); else if (enTapa(e)) alternar();
  };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', () => { arrastre = null; canvas.classList.remove('agarrando'); });
  punto.addEventListener('click', e => { e.stopPropagation(); if (activo) alternar(); });

  function frame(ahora) {
    if (!vivo) return;
    raf = requestAnimationFrame(frame);
    if (!enPantalla) return; // fuera de pantalla no gasta nada
    const dt = Math.min(0.05, (ahora - antes) / 1000 || 0); antes = ahora;
    let cambia = acercarColor(color, meta);
    if (G && G.n) {
      if (fase === 'cerrado' && !arrastre && girando && activo) g = (g + dt * G.n / 9) % G.n; // una vuelta cada 9 s
      if (fase === 'abriendo') {
        if (g > 0.5 && g < G.n - 0.5) { g += (g > G.n / 2 ? 1 : -1) * dt * G.n * 1.8; if (g >= G.n || g <= 0) g = 0; } // vuelve al frente
        else { g = 0; pos = Math.min(total() - 1, pos + dt * 46); if (pos >= total() - 1) fase = 'abierto'; }
      }
      if (fase === 'cerrando') { pos = Math.max(0, pos - dt * 60); if (pos <= 0) { fase = 'cerrado'; g = 0; } }
    }
    punto.hidden = !(activo && fase === 'cerrado' && sePuedeAbrir());
    let S = null, i = 0, dir = 1, ciclo = false;
    if (pos > 0 && A && A.n) { S = pos < A.n ? A : B; i = Math.round(pos < A.n ? pos : pos - A.n); dir = fase === 'cerrando' ? -1 : 1; }
    else if (G && G.n) { S = G; i = Math.round(g) % G.n; ciclo = true; dir = arrastre && arrastre.dir ? arrastre.dir : 1; }
    const im = (S && tomar(S, i, dir, ciclo)) || (!pintado && imgs[b]) || null;
    if (im && im !== ultimo) { ultimo = im; cambia = true; }
    if ((!cambia && !sucio) || !im) return;
    sucio = false; pintado = ahora;
    ctx.clearRect(0, 0, W, H);
    pintar(ctx, im, color, esc);
  }
  ubicarPunto();
  raf = requestAnimationFrame(frame);
  return {
    color(h) { meta = rgb(h); },
    girar(v) { girando = v; },
    alternar,
    activar(v) {
      activo = v;
      if (v) { cargar(); ubicarPunto(); } else { fase = 'cerrado'; pos = 0; g = 0; cont.classList.remove('abierto'); sucio = true; }
    },
    get abierto() { return fase === 'abierto' || fase === 'abriendo'; },
    get estado() { return { fase, pos, g, a: A && A.n, b: B && B.n, ca: A && A.cargados, cb: B && B.cargados }; },
    destruir() { vivo = false; cancelAnimationFrame(raf); ojo.disconnect(); },
  };
}

// ---------- Capa por capa, guiado por el scroll ----------
export function crearCapas(canvas, hex) {
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  let S = { n: 0 }, enPantalla = false; // las imágenes se piden al acercarse a la sección
  let color = rgb(hex), meta = rgb(hex), vivo = true, raf = 0, objetivo = 0, actual = 0, ultimo = '', ultimoA = null, pintado = 0;
  const ojo = alVer(canvas, v => { enPantalla = v; if (v && !S.n) S = secuencia('capas'); }, '120% 0px');
  function frame() {
    if (!vivo) return;
    raf = requestAnimationFrame(frame);
    if (!enPantalla) return;
    let cambia = acercarColor(color, meta);
    const fin = (S.n - 1) * objetivo;
    actual += (fin - actual) * 0.16;
    if (Math.abs(fin - actual) < 0.01) actual = fin;
    const i = Math.floor(actual), f = actual - i, dir = fin >= actual ? 1 : -1;
    const a = (S.n && tomar(S, i, dir)) || (!pintado && imgs.vaso) || null;
    // en celular no se funden cuadros vecinos: una sola pasada por cuadro mantiene el scroll fluido
    const b = !MOVIL && S.n && f > 0.03 && i + 1 < S.n && listoCuadro(S, i) ? pedir(S, i + 1) : null;
    const clave = `${b ? f.toFixed(2) : 0}`;
    if (a && (a !== ultimoA || clave !== ultimo)) { ultimoA = a; ultimo = clave; cambia = true; }
    if (!cambia || !a) return;
    pintado = performance.now();
    ctx.clearRect(0, 0, W, H);
    pintarMezcla(ctx, a, b, f, color); // funde cuadros vecinos: movimiento continuo
  }
  frame();
  return {
    progreso(p) { objetivo = Math.max(0, Math.min(1, p)); },
    color(h) { meta = rgb(h); },
    destruir() { vivo = false; cancelAnimationFrame(raf); ojo.disconnect(); },
  };
}

// ---------- Vitrina: un solo vaso que actúa cada característica ----------
// escenas: 'giro' (da vueltas), 'frente' (quieto de frente), 'tapa' (se abre), 'corte' (se ve la doble pared).
// El acercamiento se hace dentro del lienzo, a la resolución real de la pantalla, y de frente usa la foto 4K.
export function crearVitrina(canvas, hex) {
  const ctx = canvas.getContext('2d');
  let G = { n: 0 }, C = { n: 0 }, enPantalla = false; // las imágenes se piden al acercarse a la sección
  const fino = document.createElement('canvas'); let finoClave = ''; // foto 4K ya recoloreada
  let color = rgb(hex), meta = rgb(hex), vivo = true, raf = 0, escena = 'giro', g = 0, c = 0, ultimo = '', antes = performance.now();
  let periodo = 9, zoom = 1, zoomMeta = 1, foco = 0.5, focoMeta = 0.5, pintado = 0, ultimoA = null;
  function medir() {
    const r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; ultimo = ''; }
  }
  const ro = new ResizeObserver(medir); ro.observe(canvas); medir();
  const ojo = alVer(canvas, v => { enPantalla = v; if (v) { antes = performance.now(); if (!G.n) { G = secuencia('giro-vaso'); C = secuencia('capas'); } } }, '80% 0px');
  function frame(ahora) {
    if (!vivo) return;
    raf = requestAnimationFrame(frame);
    if (!enPantalla) return;
    const dt = Math.min(0.05, (ahora - antes) / 1000 || 0); antes = ahora;
    let cambia = acercarColor(color, meta);
    const mitad = Math.floor(C.n / 2);
    const metaC = escena === 'tapa' ? mitad - 1 : escena === 'corte' ? C.n - 1 : 0;
    if (c !== metaC) { const paso = dt * 80; c = Math.abs(metaC - c) <= paso ? metaC : c + Math.sign(metaC - c) * paso; }
    if (G.n) {
      if (escena === 'giro' && c === 0) g = (g + dt * G.n / periodo) % G.n;
      else if (g > 0.5 && g < G.n - 0.5) { g += (g > G.n / 2 ? 1 : -1) * dt * G.n * 1.6; if (g >= G.n || g <= 0) g = 0; } else g = 0;
    }
    zoom += (zoomMeta - zoom) * Math.min(1, dt * 3.2); foco += (focoMeta - foco) * Math.min(1, dt * 3.2);
    if (Math.abs(zoomMeta - zoom) < 0.002) zoom = zoomMeta;
    // fuente: foto 4K cuando está quieto de frente; si no, el cuadro de la secuencia (fundido con el siguiente)
    let a = null, b = null, f = 0, usaFino = false, id = '';
    if (c > 0 && C.n) { const i = Math.floor(c); a = tomar(C, i, metaC >= c ? 1 : -1); f = c - i; b = !MOVIL && f > 0.03 && i + 1 < C.n && listoCuadro(C, i) ? pedir(C, i + 1) : null; id = `c|${b ? f.toFixed(2) : 0}`; }
    else if (escena !== 'giro' && g === 0 && imgs[FINO] && !cambia) { usaFino = true; id = 'fino'; }
    else if (G.n) { const i = Math.round(g) % G.n; a = tomar(G, i, 1, true); id = 'g'; }
    if (!a && !usaFino && !pintado) a = imgs.vaso;
    const clave = `${id}|${zoom.toFixed(3)}|${foco.toFixed(3)}|${canvas.width}`;
    if ((a || usaFino) && (clave !== ultimo || a !== ultimoA)) { ultimo = clave; ultimoA = a; cambia = true; }
    if (!cambia || (!a && !usaFino)) return;
    pintado = ahora;
    const cw = canvas.width, ch = canvas.height;
    // rectángulo base: la imagen 3:4 contenida con margen; el zoom crece alrededor del punto de foco
    const h0 = ch * 0.9, w0 = h0 * 0.75, w = w0 * zoom, h = h0 * zoom;
    const x = cw / 2 - w / 2, y = ch / 2 - h * (0.5 + (foco - 0.5) * Math.min(1, (zoom - 1) / 0.5));
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingQuality = 'high';
    if (usaFino) {
      const k = meta.map(v => v.toFixed(3)).join();
      if (k !== finoClave) { const im = imgs[FINO]; fino.width = im.naturalWidth; fino.height = im.naturalHeight; fino.getContext('2d').drawImage(recolorear(im, meta), 0, 0); finoClave = k; }
      ctx.drawImage(fino, x, y, w, h);
    } else {
      ctx.drawImage(recolorear(a, color), x, y, w, h);
      if (b && b !== a && f > 0.03) { ctx.globalAlpha = f; ctx.drawImage(recolorear(b, color), x, y, w, h); ctx.globalAlpha = 1; }
    }
  }
  raf = requestAnimationFrame(frame);
  return {
    // periodo: segundos por vuelta · zoom: acercamiento · foco: punto vertical de la imagen (0 arriba, 1 abajo)
    escena(e, { periodo: p = 9, zoom: z = 1, foco: fo = 0.5 } = {}) { escena = e; periodo = p; zoomMeta = z; focoMeta = fo; },
    color(h) { meta = rgb(h); },
    destruir() { vivo = false; cancelAnimationFrame(raf); ro.disconnect(); ojo.disconnect(); },
  };
}

// ---------- Rueda del inicio ----------
// Los termos van montados en una rueda gigante cuyo centro queda debajo de la pantalla:
// al girarla, cada uno entra columpiándose por la curva. El del centro es interactivo.
export function crearRueda(cont, items, onChange) {
  const n = items.length;
  cont.innerHTML = `<div class="rueda-eje">${items.map(() => '<div class="brazo"><div class="pieza"></div></div>').join('')}</div>`;
  const eje = cont.firstElementChild, brazos = [...eje.children];
  const juguetes = items.map((it, i) => crearJuguete(brazos[i].firstElementChild, it.forma, it.hex, { activo: i === 0 }));
  let activo = 0, objetivo = 0, actual = 0, raf = 0, vivo = true, R = 1000, paso = 0.5, arrastre = null;
  const mouse = { x: 0, y: 0 }, suave = { x: 0, y: 0 };

  function medir() {
    const w = cont.clientWidth, h = cont.clientHeight;
    if (!w || !h) return;
    R = Math.max(h * 1.7, w * 0.9);
    paso = Math.asin(Math.min(0.92, (w * (w < 700 ? 0.86 : 0.6)) / R));
    eje.style.top = `${h * (w < 700 ? 0.37 : 0.47) + R}px`;
  }
  medir();
  const ro = new ResizeObserver(medir); ro.observe(cont);

  function ir(i) {
    const sig = ((i % n) + n) % n;
    let d = sig - activo; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
    if (!d) return;
    juguetes[activo].activar(false);
    objetivo += d; activo = sig;
    juguetes[activo].activar(true);
    onChange && onChange(activo);
  }
  const onMove = e => {
    const r = cont.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2; mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  // sobre el termo del centro se arrastra para girarlo; fuera de él, deslizar cambia de termo
  const onDown = e => { if (brazos[activo].contains(e.target)) return; arrastre = { x: e.clientX }; };
  const onUp = e => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x; arrastre = null;
    if (Math.abs(dx) > 60) ir(activo + (dx < 0 ? 1 : -1));
  };
  window.addEventListener('pointermove', onMove);
  cont.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  // clic en un termo lateral lo trae al centro
  brazos.forEach((b, i) => b.addEventListener('click', () => { if (i !== activo) ir(i); }));

  let ruedaVisible = true;
  const ojoR = alVer(cont, v => { ruedaVisible = v; });
  function frame() {
    if (!vivo) return;
    raf = requestAnimationFrame(frame);
    if (!ruedaVisible) return;
    actual += (objetivo - actual) * 0.07;
    suave.x += (mouse.x - suave.x) * 0.05; suave.y += (mouse.y - suave.y) * 0.05;
    eje.style.transform = `rotate(${-actual * paso}rad)`;
    brazos.forEach((b, i) => {
      const k = i + Math.round((actual - i) / n) * n, lejos = Math.abs(k - actual);
      b.style.transform = `rotate(${k * paso}rad) translateY(${-R}px)`;
      b.style.visibility = lejos > 1.6 ? 'hidden' : 'visible';
      const cerca = Math.max(0, 1 - lejos);
      b.firstElementChild.style.transform = `translate(-50%, -50%) translate(${suave.x * 12 * cerca}px, ${suave.y * 7 * cerca}px) scale(${0.9 + 0.1 * cerca})`;
    });
  }
  frame();
  return {
    ir, siguiente: () => ir(activo + 1), anterior: () => ir(activo - 1),
    get activo() { return activo; },
    get abierto() { return juguetes[activo].abierto; },
    get estado() { return juguetes[activo].estado; },
    destruir() {
      vivo = false; cancelAnimationFrame(raf); ro.disconnect(); ojoR.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      cont.removeEventListener('pointerdown', onDown);
      juguetes.forEach(j => j.destruir());
    },
  };
}
