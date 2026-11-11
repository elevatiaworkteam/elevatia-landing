import {
  TIENDA, COLORES, colorPorId, CATEGORIAS, LINEAS, PRODUCTOS, productoPorId, precioFinal,
  RESENAS, PROMOS, FAQ, LEGALES,
} from './datos.js?v=1794431229';
import { crearRueda, crearJuguete, crearCapas, crearVitrina, foto, tiene, listo } from './real.js?v=1794431229';

// ---------- Utilidades ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dinero = n => `${TIENDA.moneda}${Math.round(n).toLocaleString('en-US')}`;
const mem = {
  leer(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};

const estado = {
  carrito: mem.leer('glacio_carrito', []),
  usuario: mem.leer('glacio_usuario', null),
  pedidos: mem.leer('glacio_pedidos', []),
  resenas: mem.leer('glacio_resenas', {}),
  promo: mem.leer('glacio_promo', null),
};
const vista = $('#vista');
let limpiar = []; // funciones a ejecutar al salir de una vista

const AMBIENTE = { Vasos: 'img/ambiente-vaso.jpg', Termos: 'img/ambiente-termo.jpg', Tazas: 'img/ambiente-taza.jpg', 'Porta latas': 'img/ambiente-lata.jpg' };
const HERO = [['bahia', 'vaso-brisa-30'], ['coral', 'vaso-brisa-20'], ['mango', 'termo-marea-36'], ['palma', 'termo-marea-18'], ['atardecer', 'vaso-oleaje-40'], ['arena', 'taza-alba-14']];

const CARS = [
  { titulo: 'Seis colores del Caribe', texto: 'Pintura en polvo horneada: mate, de textura fina, que no resbala ni se pela.', palabra: 'color', escena: 'giro', periodo: 8, colores: true },
  { titulo: 'Acero 18/8 hasta el borde', texto: 'Grado alimenticio. No guarda sabores ni olores de la bebida anterior.', palabra: '18/8', escena: 'frente', zoom: 2.2, foco: 0.14 },
  { titulo: 'Tapa a presión', texto: 'Transparente, con cierre deslizante y junta que sella. Ves el hielo sin destapar.', palabra: 'clic', escena: 'tapa' },
  { titulo: 'Doble pared al vacío', texto: 'Dos paredes de acero y nada en el medio: el calor no tiene por dónde pasar.', palabra: 'vacío', escena: 'corte' },
  { titulo: 'No suda, no quema', texto: 'El exterior queda a temperatura ambiente: ni charcos en la mesa ni manos calientes.', palabra: 'seco', escena: 'frente', zoom: 1.7, foco: 0.42 },
  { titulo: 'Directo al lavavajillas', texto: 'Cuerpo y tapa. Sale listo para mañana.', palabra: 'limpio', escena: 'giro', periodo: 2.6 },
];

function acento(hex) { document.documentElement.style.setProperty('--acento', hex); }

function aviso(texto, enlace) {
  const el = document.createElement('div');
  el.className = 'aviso';
  el.innerHTML = `<span>${esc(texto)}</span>${enlace ? `<a href="${enlace[1]}">${esc(enlace[0])}</a>` : ''}`;
  $('#avisos').append(el);
  setTimeout(() => { el.classList.add('sale'); setTimeout(() => el.remove(), 400); }, 3400);
}

// ---------- Reseñas ----------
const resenasDe = id => [...(estado.resenas[id] || []), ...(RESENAS[id] || [])];
function val(id) {
  const r = resenasDe(id);
  return { media: r.length ? r.reduce((s, x) => s + x.estrellas, 0) / r.length : 0, total: r.length };
}
function estrellas(media, total) {
  return `<span class="estrellas" aria-label="${media.toFixed(1)} de 5 estrellas"><span class="e">★★★★★<b style="width:${(media / 5) * 100}%">★★★★★</b></span>${total === undefined ? '' : `${media.toFixed(1)} (${total})`}</span>`;
}

// ---------- Carrito ----------
function guardarCarrito() {
  mem.guardar('glacio_carrito', estado.carrito);
  const n = estado.carrito.reduce((s, i) => s + i.cant, 0);
  const b = $('#cuenta-carrito');
  b.textContent = n; b.hidden = !n;
  b.classList.remove('salto'); void b.offsetWidth; b.classList.add('salto');
}
function agregar(id, color, cant = 1) {
  const p = productoPorId(id); if (!p) return;
  const it = estado.carrito.find(i => i.id === id && i.color === color);
  if (it) it.cant = Math.min(20, it.cant + cant); else estado.carrito.push({ id, color, cant });
  guardarCarrito();
  aviso(`${p.nombre} · ${colorPorId(color).nombre} añadido al carrito`, ['Ver carrito', '#/carrito']);
}
function totales() {
  const subtotal = estado.carrito.reduce((s, i) => s + precioFinal(productoPorId(i.id)) * i.cant, 0);
  const promo = PROMOS.find(p => p.codigo === estado.promo);
  let descuento = 0, envioGratis = false, nota = '';
  if (promo) {
    if (promo.tipo === 'porcentaje') descuento = Math.round(subtotal * promo.valor / 100);
    if (promo.tipo === 'envio') {
      const brisas = estado.carrito.filter(i => i.id.startsWith('vaso-brisa')).reduce((s, i) => s + i.cant, 0);
      if (brisas >= 2) envioGratis = true; else nota = 'El código DUO aplica al llevar dos vasos Brisa.';
    }
  }
  const base = subtotal - descuento;
  const envio = !estado.carrito.length || envioGratis || base >= TIENDA.envioGratisDesde ? 0 : TIENDA.costoEnvio;
  return { subtotal, descuento, envio, total: base + envio, promo, nota };
}

// ---------- Piezas de interfaz ----------
function precioHTML(p) {
  return p.oferta
    ? `<span class="precio">${dinero(precioFinal(p))} <s>${dinero(p.precio)}</s></span>`
    : `<span class="precio">${dinero(p.precio)}</span>`;
}
function tarjeta(p, i = 0) {
  const c = colorPorId(p.color), v = val(p.id);
  return `<article class="tarjeta rev" style="--acento:${c.hex};--d:${(i % 4) * 0.07}s" data-prod="${p.id}" data-color="${c.id}">
    <a class="tarjeta-img" href="#/producto/${p.id}?color=${c.id}" aria-label="Ver ${esc(p.nombre)}">
      <span class="etiquetas">${p.nuevo ? '<span class="etq">Nuevo</span>' : ''}${p.oferta ? `<span class="etq oferta">−${p.oferta}%</span>` : ''}</span>
      <img src="${foto(p.forma, c.hex)}" alt="${esc(p.nombre)} en color ${c.nombre}" loading="lazy">
    </a>
    <div class="tarjeta-info">
      <div class="muestras" role="group" aria-label="Colores">${COLORES.map(k => `<button class="muestra${k.id === c.id ? ' activo' : ''}" style="--c:${k.hex}" data-muestra="${k.id}" title="${k.nombre}" aria-label="Color ${k.nombre}"></button>`).join('')}</div>
      <h3><a href="#/producto/${p.id}?color=${c.id}">${esc(p.nombre)}</a></h3>
      <p class="corto">${esc(p.corto)}</p>
      ${estrellas(v.media, v.total)}
      ${precioHTML(p)}
      <div class="tarjeta-pie">
        <button class="btn oscuro chico" data-agregar>Añadir al carrito</button>
        <a class="btn chico" href="#/producto/${p.id}?color=${c.id}" data-detalle>Ver detalles</a>
      </div>
    </div>
  </article>`;
}
const flechaSVG = d => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;

// Eventos delegados de las tarjetas
vista.addEventListener('click', e => {
  const t = e.target.closest('.tarjeta'); if (!t) return;
  const m = e.target.closest('[data-muestra]');
  if (m) {
    const p = productoPorId(t.dataset.prod), c = colorPorId(m.dataset.muestra);
    t.dataset.color = c.id; t.style.setProperty('--acento', c.hex);
    $('.tarjeta-img img', t).src = foto(p.forma, c.hex);
    $$('.muestra', t).forEach(x => x.classList.toggle('activo', x === m));
    $$('a[href^="#/producto/"]', t).forEach(a => { a.href = `#/producto/${p.id}?color=${c.id}`; });
    return;
  }
  if (e.target.closest('[data-agregar]')) agregar(t.dataset.prod, t.dataset.color);
});

// ---------- Vistas ----------
function vInicio() {
  const destacados = PRODUCTOS.filter(p => p.destacado);
  vista.innerHTML = `
  <section class="hero" id="hero">
    <div class="hero-palabra" id="hero-palabra" aria-hidden="true"></div>
    <div class="rueda-real" id="rueda" aria-label="Termos GLACIO. Arrastra el termo para girarlo 360 grados."></div>
    <span class="hero-pista">Arrastra el termo para girarlo · toca la tapa para abrirlo</span>
    <div class="hero-izq">
      <span class="eyebrow">Nueva colección Caribe · ${COLORES.length} colores</span>
      <h1>${esc(TIENDA.lema)}</h1>
      <p>Vasos, termos y tazas de acero inoxidable con doble pared al vacío, pintados con los colores de la isla.</p>
      <div class="hero-cta">
        <a class="btn oscuro" href="#/productos">Comprar ahora</a>
        <a class="btn" href="#coleccion" data-ancla>Ver más</a>
      </div>
    </div>
    <div class="hero-der"><div class="hero-ficha" id="hero-ficha"></div></div>
    <div class="hero-ctrl">
      <button class="flecha" id="h-ant" aria-label="Color anterior">${flechaSVG('M15 5l-7 7 7 7')}</button>
      <div class="puntos">${HERO.map(([c], i) => `<button class="pt" style="--c:${colorPorId(c).hex}" data-i="${i}" aria-label="${colorPorId(c).nombre}"></button>`).join('')}</div>
      <button class="flecha" id="h-sig" aria-label="Color siguiente">${flechaSVG('M9 5l7 7-7 7')}</button>
    </div>
  </section>

  <div class="cinta" aria-hidden="true"><div class="cinta-pista">${Array(2).fill(['Doble pared al vacío', 'Acero inoxidable 18/8', 'No suda', 'Apto lavavajillas', 'Libre de BPA', 'Hecho para el Caribe'].map(t => `<span>${t}</span><i>✦</i>`).join('')).join('')}</div></div>

  <section class="anatomia" id="anatomia" aria-label="Cómo está hecho un termo GLACIO">
    <div class="anat-fijo">
      <canvas id="lienzo-anat" aria-hidden="true"></canvas>
      <div class="anat-textos">
        <div class="anat-paso activo" data-p="0"><span class="eyebrow">01 · Por fuera</span><h2>Pintura en polvo,<br>horneada.</h2><p>Un acabado mate con textura fina que no resbala con la mano mojada, no suda y no se pela en el lavavajillas.</p></div>
        <div class="anat-paso" data-p="1"><span class="eyebrow">02 · La tapa</span><h2>Se abre con<br>un dedo.</h2><p>Tapa transparente con cierre deslizante y junta que sella a presión. Mira el hielo sin destapar.</p></div>
        <div class="anat-paso" data-p="2"><span class="eyebrow">03 · Por dentro</span><h2>Dos paredes.<br>Nada en el medio.</h2><p>Entre el acero de afuera y el de adentro hay vacío: sin aire no hay por dónde pase el calor. Por eso el hielo se queda.</p></div>
      </div>
      <div class="anat-barra" aria-hidden="true"><i id="anat-avance"></i></div>
    </div>
  </section>

  <section class="seccion">
    <div class="cab-seccion">
      <div><span class="eyebrow rev">Productos destacados</span><h2 class="titulo-l rev" style="--d:.08s">Los más<br>pedidos</h2></div>
      <a class="btn rev" href="#/productos">Ver todo el catálogo →</a>
    </div>
    <div class="rejilla">${destacados.map(tarjeta).join('')}</div>
  </section>

  <section class="vitrina" id="vitrina" aria-label="Por qué GLACIO">
    <div class="vit-caja">
      <div class="vit-lista">
        <span class="eyebrow">Por qué GLACIO</span>
        ${CARS.map((c, i) => `<button class="vit-item" data-i="${i}"><span class="vit-n">0${i + 1}</span><span class="vit-t"><b>${c.titulo}</b><span>${c.texto}</span><i class="vit-barra"></i></span></button>`).join('')}
      </div>
      <div class="vit-escena" id="vit-escena"><span class="vit-palabra" id="vit-palabra" aria-hidden="true"></span><canvas id="lienzo-vit" aria-hidden="true"></canvas></div>
    </div>
  </section>

  <section class="seccion" id="coleccion" style="padding-top:0">
    <div class="cab-seccion">
      <div><span class="eyebrow rev">Colección Caribe</span><h2 class="titulo-xl rev" style="--d:.08s">Seis colores<br>de la isla</h2></div>
      <p class="sub rev">Pasa por cada franja para conocer el color. Todos están disponibles en cada vaso, termo y taza.</p>
    </div>
    <div class="franjas rev">${COLORES.map((c, i) => {
      const p = productoPorId(HERO.find(h => h[0] === c.id)?.[1]) || PRODUCTOS[i];
      return `<a class="franja" style="--c:${c.hex}" href="#/producto/${p.id}?color=${c.id}">
        <h3>${c.nombre}</h3>
        <img src="${foto(p.forma, c.hex)}" alt="" loading="lazy">
        <div class="det"><b>${c.nombre}</b><span>${esc(c.frase)}</span><span class="enlace">Ver en ${esc(p.nombre)}</span></div>
      </a>`;
    }).join('')}</div>
  </section>

  <section class="seccion" style="padding-top:0">
    <div class="cab-seccion">
      <div><span class="eyebrow rev">Ofertas y promociones</span><h2 class="titulo-l rev" style="--d:.08s">Frío a<br>mejor precio</h2></div>
      <a class="btn rev" href="#/ofertas">Ver todas las ofertas →</a>
    </div>
    <div class="promos">${PROMOS.map(promoHTML).join('')}</div>
  </section>`;

  // Rueda 3D
  const palabra = $('#hero-palabra'), ficha = $('#hero-ficha'), puntos = $$('.pt');
  function pintarHero(i) {
    const [cid, pid] = HERO[i], c = colorPorId(cid), p = productoPorId(pid);
    acento(c.hex); anat.color(c.hex);
    palabra.innerHTML = [...c.nombre].map((l, k) => `<span style="--i:${k}">${l}</span>`).join('');
    puntos.forEach((b, k) => b.classList.toggle('activo', k === i));
    ficha.innerHTML = `<small>Color ${c.nombre}</small><h3>${esc(p.nombre)}</h3><p>${esc(p.corto)}</p>
      <div class="fila">${precioHTML(p)}<a class="btn oscuro chico" href="#/producto/${p.id}?color=${c.id}">Ver producto</a></div>`;
  }
  // Anatomía: el scroll abre la tapa y corta el vaso
  const anat = crearCapas($('#lienzo-anat'), COLORES[0].hex);
  const secAnat = $('#anatomia'), pasos = $$('.anat-paso'), suave01 = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const alScroll = () => {
    const r = secAnat.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / Math.max(r.height - innerHeight, 1)));
    anat.progreso(0.5 * suave01((p - 0.2) / 0.3) + 0.5 * suave01((p - 0.58) / 0.32));
    const paso = p < 0.3 ? 0 : p < 0.64 ? 1 : 2;
    pasos.forEach((el, i) => el.classList.toggle('activo', i === paso));
    $('#anat-avance').style.transform = `scaleY(${p})`;
  };
  window.addEventListener('scroll', alScroll, { passive: true }); alScroll();
  limpiar.push(() => { window.removeEventListener('scroll', alScroll); anat.destruir(); });

  // Vitrina: un solo vaso que actúa cada característica
  const vit = crearVitrina($('#lienzo-vit'), COLORES[0].hex);
  const secVit = $('#vitrina'), vitItems = $$('.vit-item'), vitEsc = $('#vit-escena');
  let vi = -1, vT = 0, vColor = 0, vVisible = false, vCambio = 0;
  const vitColor = k => { vColor = k % COLORES.length; vit.color(COLORES[vColor].hex); secVit.style.setProperty('--acento', COLORES[vColor].hex); };
  function verCar(i) {
    vi = (i + CARS.length) % CARS.length; vT = performance.now(); vCambio = vT;
    const c = CARS[vi];
    vit.escena(c.escena, { periodo: c.periodo, zoom: c.zoom, foco: c.foco });
    vitItems.forEach((el, k) => { el.classList.remove('activo'); if (k === vi) { void el.offsetWidth; el.classList.add('activo'); } });
    const pal = $('#vit-palabra'); pal.textContent = c.palabra; pal.classList.remove('entra'); void pal.offsetWidth; pal.classList.add('entra');
  }
  vitItems.forEach(el => { el.onclick = () => verCar(+el.dataset.i); });
  const vitObs = new IntersectionObserver(es => { vVisible = es[0].isIntersecting; if (vVisible && vi < 0) verCar(0); if (vVisible) vT = performance.now(); secVit.classList.toggle('pausa', !vVisible); }, { threshold: 0.35 });
  vitObs.observe(secVit);
  const vitReloj = setInterval(() => {
    if (!vVisible || vi < 0 || document.hidden) return;
    const t = performance.now();
    if (CARS[vi].colores && t - vCambio > 850) { vCambio = t; vitColor(vColor + 1); }
    if (t - vT > 5600) verCar(vi + 1);
  }, 120);
  vitColor(0);
  limpiar.push(() => { clearInterval(vitReloj); vitObs.disconnect(); vit.destruir(); });

  const rueda = crearRueda($('#rueda'), HERO.map(([c, pid]) => ({ forma: productoPorId(pid).forma, hex: colorPorId(c).hex })), pintarHero);
  pintarHero(0); window.__rueda = rueda;
  let pausa = 0;
  const tocar = () => { pausa = Date.now() + 9000; };
  const jugar = () => { pausa = Infinity; }; // en cuanto tocan el termo, deja de cambiar solo
  $('#h-sig').onclick = () => { tocar(); rueda.siguiente(); };
  $('#h-ant').onclick = () => { tocar(); rueda.anterior(); };
  puntos.forEach(b => { b.onclick = () => { tocar(); rueda.ir(+b.dataset.i); }; });
  $('#rueda').addEventListener('pointerdown', jugar);
  $('#rueda').addEventListener('pointermove', e => { if (e.target.closest('.brazo') && pausa !== Infinity) tocar(); }); // con el cursor sobre el termo no cambia solo
  const auto = setInterval(() => { if (Date.now() > pausa && !document.hidden && !rueda.abierto) rueda.siguiente(); }, 6500);
  const tecla = e => { if (e.key === 'ArrowRight') { tocar(); rueda.siguiente(); } if (e.key === 'ArrowLeft') { tocar(); rueda.anterior(); } };
  window.addEventListener('keydown', tecla);
  $('[data-ancla]').onclick = e => { e.preventDefault(); $('#coleccion').scrollIntoView({ behavior: 'smooth' }); };
  limpiar.push(() => { clearInterval(auto); window.removeEventListener('keydown', tecla); rueda.destruir(); });
}

function promoHTML(p) {
  return `<div class="promo rev" style="--acento:${colorPorId(p.color).hex}">
    <span class="eyebrow">Promoción</span><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p>
    <button class="codigo" data-codigo="${p.codigo}" title="Copiar código">${p.codigo} <small>copiar</small></button>
  </div>`;
}
vista.addEventListener('click', e => {
  const c = e.target.closest('[data-codigo]'); if (!c) return;
  navigator.clipboard?.writeText(c.dataset.codigo).catch(() => {});
  estado.promo = c.dataset.codigo; mem.guardar('glacio_promo', estado.promo);
  aviso(`Código ${c.dataset.codigo} copiado y aplicado a tu carrito`, ['Ver carrito', '#/carrito']);
});

// ----- Productos -----
const filtros = { cat: new Set(), linea: new Set(), max: 0, min: 0, valor: 0, oferta: false, orden: 'destacados' };
function vProductos(q) {
  const tope = Math.max(...PRODUCTOS.map(precioFinal));
  filtros.cat = new Set(q.get('cat') ? [q.get('cat')] : []);
  filtros.linea = new Set(); filtros.max = tope; filtros.valor = 0; filtros.oferta = q.get('oferta') === '1'; filtros.orden = 'destacados';
  const cuenta = (k, v) => PRODUCTOS.filter(p => p[k] === v).length;
  vista.innerHTML = `<div class="pagina">
    <div class="cab-seccion"><div><span class="eyebrow">Catálogo</span><h1 class="titulo-xl">Productos</h1></div>
      <p class="sub">Elige la forma, después el color. Cada producto viene en los ${COLORES.length} tonos de la colección Caribe.</p></div>
    <div class="catalogo">
      <aside class="filtros" id="filtros" aria-label="Filtros">
        <div><h4>Categoría</h4>${CATEGORIAS.map(c => `<label><input type="checkbox" data-f="cat" value="${c}" ${filtros.cat.has(c) ? 'checked' : ''}>${c}<small>${cuenta('categoria', c)}</small></label>`).join('')}</div>
        <div><h4>Línea</h4>${LINEAS.map(c => `<label><input type="checkbox" data-f="linea" value="${c}">${c}<small>${cuenta('linea', c)}</small></label>`).join('')}</div>
        <div><h4>Precio máximo</h4><input type="range" id="f-precio" min="${Math.min(...PRODUCTOS.map(precioFinal))}" max="${tope}" step="50" value="${tope}"><label style="justify-content:space-between"><span>Hasta</span><b id="f-precio-v">${dinero(tope)}</b></label></div>
        <div><h4>Valoración</h4>${[[0, 'Todas'], [4, '4 estrellas o más'], [4.5, '4.5 estrellas o más']].map(([v, t]) => `<label><input type="radio" name="f-val" value="${v}" ${v === 0 ? 'checked' : ''}>${t}</label>`).join('')}</div>
        <div><h4>Promociones</h4><label><input type="checkbox" id="f-oferta" ${filtros.oferta ? 'checked' : ''}>Solo en oferta</label></div>
        <button class="btn chico" id="f-limpiar">Limpiar filtros</button>
      </aside>
      <div>
        <div class="barra-lista">
          <b id="conteo"></b>
          <div style="display:flex;gap:10px;align-items:center">
            <button class="btn chico btn-filtros" id="ver-filtros">Filtros</button>
            <select id="orden" aria-label="Ordenar por">
              <option value="destacados">Destacados</option><option value="menor">Precio: menor a mayor</option>
              <option value="mayor">Precio: mayor a menor</option><option value="valor">Mejor valorados</option>
            </select>
          </div>
        </div>
        <div class="rejilla" id="lista"></div>
      </div>
    </div></div>`;
  const pintar = () => {
    let l = PRODUCTOS.filter(p =>
      (!filtros.cat.size || filtros.cat.has(p.categoria)) && (!filtros.linea.size || filtros.linea.has(p.linea)) &&
      precioFinal(p) <= filtros.max && val(p.id).media >= filtros.valor && (!filtros.oferta || p.oferta > 0));
    const ord = { menor: (a, b) => precioFinal(a) - precioFinal(b), mayor: (a, b) => precioFinal(b) - precioFinal(a), valor: (a, b) => val(b.id).media - val(a.id).media, destacados: (a, b) => (b.destacado - a.destacado) || (b.nuevo - a.nuevo) };
    l = l.sort(ord[filtros.orden]);
    $('#conteo').textContent = `${l.length} ${l.length === 1 ? 'producto' : 'productos'}`;
    $('#lista').innerHTML = l.length ? l.map(tarjeta).join('') : `<div class="vacio" style="grid-column:1/-1"><h3>Nada por aquí</h3><p class="sub" style="margin:0 auto">Ningún producto coincide con esos filtros. Prueba a quitar alguno.</p></div>`;
    observar();
  };
  $('#filtros').addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.f) { t.checked ? filtros[t.dataset.f].add(t.value) : filtros[t.dataset.f].delete(t.value); }
    if (t.id === 'f-precio') { filtros.max = +t.value; $('#f-precio-v').textContent = dinero(filtros.max); }
    if (t.name === 'f-val') filtros.valor = +t.value;
    if (t.id === 'f-oferta') filtros.oferta = t.checked;
    pintar();
  });
  $('#orden').onchange = e => { filtros.orden = e.target.value; pintar(); };
  $('#f-limpiar').onclick = () => { if (location.hash === '#/productos') render(); else location.hash = '#/productos'; };
  $('#ver-filtros').onclick = () => $('#filtros').classList.toggle('abierto');
  pintar();
}

// ----- Detalle -----
const familia = p => PRODUCTOS.filter(q => q.nombre.split(' ').slice(0, 2).join(' ') === p.nombre.split(' ').slice(0, 2).join(' '));
const onzas = p => (p.nombre.match(/\d+ oz/) || [''])[0];
function vProducto(id, q) {
  const p = productoPorId(id);
  if (!p) return vNoExiste();
  let color = colorPorId(q.get('color') || p.color), cant = 1;
  const fam = familia(p), ambiente = AMBIENTE[p.categoria];
  vista.innerHTML = `<div class="pagina">
    <nav class="migas" aria-label="Ruta"><a href="#/">Inicio</a>/<a href="#/productos">Productos</a>/<a href="#/productos?cat=${encodeURIComponent(p.categoria)}">${p.categoria}</a>/<span>${esc(p.nombre)}</span></nav>
    <div class="detalle">
      <div class="galeria">
        <div class="escenario">
          <span class="gigante" aria-hidden="true">${onzas(p).replace(' oz', '')}</span>
          <div id="visor" class="real" aria-label="${esc(p.nombre)}. Arrastra para girarlo; toca la tapa para abrirlo."></div>
          <img class="foto" id="foto" alt="${esc(p.nombre)} en uso">
          <span class="pista" id="pista">Arrastra para girarlo · toca la tapa para abrirlo</span>
          <div class="ctrl-lado" id="ctrl-lado">
            <button data-k="mas" title="Acercar" aria-label="Acercar">+</button>
            <button data-k="menos" title="Alejar" aria-label="Alejar">−</button>
            <button data-k="girar" class="on" title="Giro automático" aria-label="Giro automático" aria-pressed="true">↻</button>
            <button data-k="full" title="Pantalla completa" aria-label="Pantalla completa">⛶</button>
          </div>
        </div>
        <div class="minis" id="minis" role="group" aria-label="Galería de imágenes"></div>
      </div>
      <div class="ficha">
        <span class="eyebrow">${p.linea}${p.nuevo ? ' · Nuevo' : ''}</span>
        <h1>${esc(p.nombre)}</h1>
        <a href="#resenas" id="ir-resenas">${estrellas(val(p.id).media, val(p.id).total)}</a>
        <div class="precio">${dinero(precioFinal(p))}${p.oferta ? ` <s>${dinero(p.precio)}</s> <span class="ahorro">Ahorras ${p.oferta}%</span>` : ''}</div>
        <p class="sub">${esc(p.descripcion)}</p>
        <div class="grupo"><b>Color: <span id="nombre-color"></span></b>
          <div class="muestras grande" id="colores">${COLORES.map(k => `<button class="muestra" style="--c:${k.hex}" data-c="${k.id}" title="${k.nombre}" aria-label="Color ${k.nombre}"></button>`).join('')}</div></div>
        <div class="grupo"><b>Tamaño</b><div class="chips">${fam.map(f => `<a class="chip${f.id === p.id ? ' activo' : ''}" data-tam href="#/producto/${f.id}">${onzas(f)}</a>`).join('')}</div></div>
        <div class="compra">
          <div class="cant" aria-label="Cantidad"><button id="menos" aria-label="Menos">−</button><output id="cant">1</output><button id="mas" aria-label="Más">+</button></div>
          <button class="btn oscuro" id="anadir">Añadir al carrito</button>
          <button class="btn" id="comprar">Comprar ahora</button>
        </div>
        <div class="ventajas"><div>Envío a todo el país</div><div>Garantía contra pérdida de vacío</div><div>Cambio de color sin costo</div></div>
      </div>
    </div>
    <div class="bloques">
      <section><h2>Especificaciones técnicas</h2>
        <table class="specs"><tbody>${p.specs.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</tbody></table></section>
      <section id="resenas"><h2>Reseñas y valoraciones</h2><div id="caja-resenas"></div></section>
    </div>
    <section style="margin-top:clamp(50px,7vw,100px)"><div class="cab-seccion"><h2 class="titulo-l">También te<br>puede gustar</h2></div>
      <div class="rejilla">${PRODUCTOS.filter(x => x.id !== p.id).sort((a, b) => (b.categoria === p.categoria) - (a.categoria === p.categoria)).slice(0, 4).map(tarjeta).join('')}</div></section>
  </div>`;

  const visor = crearJuguete($('#visor'), p.forma, color.hex);
  limpiar.push(() => visor.destruir());
  const minis = $('#minis'), fotoEl = $('#foto'), escenario = $('.escenario'), lienzo = $('#visor');
  let panel = 'giro', zoom = 1; // 'giro' | 'corte' | 'foto'
  function pintarMinis() {
    minis.innerHTML = `<button class="mini${panel === 'giro' ? ' activo' : ''}" data-v="giro" aria-label="Vista interactiva 360"><b class="mini-360">360°</b><img src="${foto(p.forma, color.hex, 'base', 220)}" alt=""></button>` +
      (tiene(p.forma, 'corte') ? `<button class="mini${panel === 'corte' ? ' activo' : ''}" data-v="corte" aria-label="Corte: por dentro"><img src="${foto(p.forma, color.hex, 'corte', 220)}" alt=""></button>` : '') +
      (ambiente ? `<button class="mini${panel === 'foto' ? ' activo' : ''}" data-v="foto" aria-label="Foto de ambiente"><img class="cubre" src="${ambiente}" alt="" onerror="this.closest('.mini').remove()"></button>` : '');
  }
  function ponerVista(v) {
    panel = v;
    if (v === 'foto') { fotoEl.src = ambiente; fotoEl.classList.remove('contiene'); }
    if (v === 'corte') { fotoEl.src = foto(p.forma, color.hex, 'corte', 900); fotoEl.classList.add('contiene'); }
    fotoEl.classList.toggle('visible', v !== 'giro');
    escenario.classList.toggle('con-foto', v === 'foto'); escenario.classList.toggle('con-corte', v === 'corte');
    pintarMinis();
  }
  function ponerColor(c) {
    color = c; acento(c.hex); visor.color(c.hex);
    $('#nombre-color').textContent = `${c.nombre} — ${c.frase}`;
    $$('#colores .muestra').forEach(b => b.classList.toggle('activo', b.dataset.c === c.id));
    $$('[data-tam]').forEach(a => { a.href = `${a.href.split('?')[0]}?color=${c.id}`; });
    history.replaceState(null, '', `#/producto/${p.id}?color=${c.id}`);
    ponerVista(panel);
  }
  const ponerZoom = z => { zoom = Math.max(1, Math.min(2.4, z)); lienzo.style.setProperty('--zoom', zoom); };
  $('#ctrl-lado').onclick = e => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    const k = b.dataset.k;
    if (k === 'mas') ponerZoom(zoom + 0.35);
    if (k === 'menos') ponerZoom(zoom - 0.35);
    if (k === 'girar') { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); visor.girar(on); }
    if (k === 'full') { document.fullscreenElement ? document.exitFullscreen() : escenario.requestFullscreen?.(); }
  };
  lienzo.addEventListener('wheel', e => { if (!e.ctrlKey && !document.fullscreenElement) return; e.preventDefault(); ponerZoom(zoom - e.deltaY * 0.01); }, { passive: false });
  lienzo.addEventListener('pointerdown', () => { $('#pista').classList.add('oculta'); }, { once: true });
  ponerColor(color);
  $('#colores').onclick = e => { const b = e.target.closest('[data-c]'); if (b) ponerColor(colorPorId(b.dataset.c)); };
  minis.onclick = e => { const b = e.target.closest('.mini'); if (b) ponerVista(b.dataset.v); };
  const pc = () => { $('#cant').textContent = cant; };
  $('#menos').onclick = () => { cant = Math.max(1, cant - 1); pc(); };
  $('#mas').onclick = () => { cant = Math.min(20, cant + 1); pc(); };
  $('#anadir').onclick = () => agregar(p.id, color.id, cant);
  $('#comprar').onclick = () => { agregar(p.id, color.id, cant); location.hash = '#/carrito'; };
  $('#ir-resenas').onclick = e => { e.preventDefault(); $('#resenas').scrollIntoView({ behavior: 'smooth' }); };

  function pintarResenas() {
    const r = resenasDe(p.id), v = val(p.id);
    let puntaje = 5;
    $('#caja-resenas').innerHTML = `
      <div class="resumen-res"><span class="n">${v.media.toFixed(1)}</span><div>${estrellas(v.media)}<p class="sub">${v.total} ${v.total === 1 ? 'reseña' : 'reseñas'} de clientes</p></div></div>
      ${r.map(x => `<article class="resena"><header><b>${esc(x.nombre)}</b>${estrellas(x.estrellas)}</header><p>${esc(x.texto)}</p></article>`).join('')}
      <form class="form-resena panel" id="form-resena"><b>Deja tu reseña</b>
        <div class="pick-estrellas" role="group" aria-label="Tu valoración">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="on" data-n="${n}" aria-label="${n} estrellas">★</button>`).join('')}</div>
        <label class="campo"><span>Nombre</span><input name="nombre" required maxlength="40" value="${esc(estado.usuario?.nombre || '')}"></label>
        <label class="campo"><span>Tu opinión</span><textarea name="texto" rows="3" required maxlength="400"></textarea></label>
        <button class="btn oscuro" type="submit">Publicar reseña</button></form>`;
    const pick = $$('.pick-estrellas button');
    pick.forEach(b => { b.onclick = () => { puntaje = +b.dataset.n; pick.forEach(x => x.classList.toggle('on', +x.dataset.n <= puntaje)); }; });
    $('#form-resena').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      (estado.resenas[p.id] ||= []).unshift({ nombre: f.get('nombre').trim(), estrellas: puntaje, texto: f.get('texto').trim() });
      mem.guardar('glacio_resenas', estado.resenas);
      pintarResenas(); aviso('¡Gracias! Tu reseña fue publicada.');
    };
  }
  pintarResenas();
}

// ----- Ofertas -----
function vOfertas() {
  const l = PRODUCTOS.filter(p => p.oferta > 0).sort((a, b) => b.oferta - a.oferta);
  vista.innerHTML = `<div class="pagina">
    <div class="banner-oferta rev">
      <img src="img/ambiente-ofertas.jpg" alt="" onerror="this.remove()">
      <span class="eyebrow">Ofertas y promociones</span>
      <h1 class="titulo-xl">Hasta −${Math.max(...l.map(p => p.oferta))}%</h1>
      <p>Descuentos de lanzamiento de la colección Caribe y códigos que puedes usar hoy mismo en tu carrito.</p>
      <div><a class="btn claro" href="#/productos?oferta=1">Comprar ofertas</a></div>
    </div>
    <div class="promos" style="margin-bottom:clamp(50px,7vw,90px)">${PROMOS.map(promoHTML).join('')}</div>
    <div class="cab-seccion"><h2 class="titulo-l">Productos<br>en descuento</h2></div>
    <div class="rejilla">${l.map(tarjeta).join('')}</div></div>`;
}

// ----- Carrito y compra -----
function vCarrito() {
  if (!estado.carrito.length) {
    vista.innerHTML = `<div class="pagina"><div class="vacio"><h3>Tu carrito está vacío</h3><p class="sub" style="margin:0 auto 22px">Todavía no has añadido ningún termo. La colección Caribe te espera.</p><a class="btn oscuro" href="#/productos">Ver productos</a></div></div>`;
    return;
  }
  const u = estado.usuario || {};
  vista.innerHTML = `<div class="pagina">
    <div class="cab-seccion"><div><span class="eyebrow">Tu compra</span><h1 class="titulo-xl">Carrito</h1></div></div>
    <div class="carro">
      <div>
        <div id="lineas"></div>
        <form class="panel" id="form-compra" style="margin-top:22px">
          <h2>Datos de entrega</h2>
          <div class="form-grid">
            <label class="campo"><span>Nombre completo</span><input name="nombre" required autocomplete="name" value="${esc(u.nombre || '')}"></label>
            <label class="campo"><span>Correo electrónico</span><input name="correo" type="email" required autocomplete="email" value="${esc(u.correo || '')}"></label>
            <label class="campo"><span>Teléfono</span><input name="telefono" type="tel" required autocomplete="tel" value="${esc(u.telefono || '')}"></label>
            <label class="campo"><span>Ciudad</span><input name="ciudad" required value="${esc(u.ciudad || '')}"></label>
            <label class="campo todo"><span>Dirección</span><input name="direccion" required autocomplete="street-address" value="${esc(u.direccion || '')}"></label>
            <div class="todo"><span style="font-size:13.5px;font-weight:700;display:block;margin-bottom:8px">Método de pago</span>
              <div class="opciones">
                <label class="opcion"><input type="radio" name="pago" value="Pago contra entrega" checked>Pago contra entrega</label>
                <label class="opcion"><input type="radio" name="pago" value="Transferencia bancaria">Transferencia bancaria</label>
                <label class="opcion"><input type="radio" name="pago" value="Tarjeta al recibir">Tarjeta al recibir</label>
              </div></div>
          </div>
        </form>
      </div>
      <aside class="caja" id="caja"></aside>
    </div></div>`;
  function pintar() {
    if (!estado.carrito.length) return vCarrito();
    $('#lineas').innerHTML = estado.carrito.map((it, i) => {
      const p = productoPorId(it.id), c = colorPorId(it.color);
      return `<div class="linea-carro">
        <a class="img" style="--acento:${c.hex}" href="#/producto/${p.id}?color=${c.id}"><img src="${foto(p.forma, c.hex, 'base', 220)}" alt="${esc(p.nombre)}"></a>
        <div><h3>${esc(p.nombre)}</h3><small>Color ${c.nombre} · ${dinero(precioFinal(p))} c/u</small>
          <div class="cant chica"><button data-q="-1" data-i="${i}" aria-label="Menos">−</button><output>${it.cant}</output><button data-q="1" data-i="${i}" aria-label="Más">+</button></div></div>
        <div class="der"><b>${dinero(precioFinal(p) * it.cant)}</b><button class="quitar" data-x="${i}">Quitar</button></div></div>`;
    }).join('');
    const t = totales();
    $('#caja').innerHTML = `<h3>Resumen</h3>
      <div class="fila"><span>Subtotal</span><b>${dinero(t.subtotal)}</b></div>
      ${t.descuento ? `<div class="fila"><span>Código ${t.promo.codigo}</span><b>−${dinero(t.descuento)}</b></div>` : ''}
      <div class="fila"><span>Envío</span><b>${t.envio ? dinero(t.envio) : 'Gratis'}</b></div>
      <div class="promo-campo"><input id="in-promo" placeholder="Código promocional" value="${esc(estado.promo || '')}" aria-label="Código promocional"><button class="btn chico" id="ap-promo">Aplicar</button></div>
      ${t.nota ? `<p class="sub" style="font-size:13.5px">${t.nota}</p>` : ''}
      ${t.envio ? `<p class="sub" style="font-size:13.5px">Te faltan ${dinero(TIENDA.envioGratisDesde - (t.subtotal - t.descuento))} para envío gratis.</p>` : ''}
      <div class="fila total"><span>Total</span><span>${dinero(t.total)}</span></div>
      <button class="btn oscuro ancho" form="form-compra" type="submit" style="margin-top:18px">Finalizar compra</button>
      <p class="sub" style="font-size:12.5px;margin-top:12px;text-align:center">Compra de demostración: no se realiza ningún cobro.</p>`;
    $('#ap-promo').onclick = () => {
      const cod = $('#in-promo').value.trim().toUpperCase();
      if (cod && !PROMOS.some(p => p.codigo === cod)) return aviso('Ese código no es válido.');
      estado.promo = cod || null; mem.guardar('glacio_promo', estado.promo);
      pintar(); if (cod) aviso(`Código ${cod} aplicado.`);
    };
  }
  $('#lineas').onclick = e => {
    const q = e.target.closest('[data-q]'), x = e.target.closest('[data-x]');
    if (q) { const it = estado.carrito[+q.dataset.i]; it.cant = Math.max(1, Math.min(20, it.cant + +q.dataset.q)); }
    if (x) estado.carrito.splice(+x.dataset.x, 1);
    if (q || x) { guardarCarrito(); pintar(); }
  };
  $('#form-compra').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), t = totales();
    const pedido = {
      num: `GL-${String(Date.now()).slice(-6)}`, fecha: new Date().toISOString(), estado: 'En preparación',
      items: estado.carrito.map(i => ({ ...i, nombre: productoPorId(i.id).nombre, precio: precioFinal(productoPorId(i.id)) })),
      total: t.total, pago: f.pago, entrega: `${f.direccion}, ${f.ciudad}`, cliente: f.nombre,
    };
    estado.pedidos.unshift(pedido); mem.guardar('glacio_pedidos', estado.pedidos);
    estado.carrito = []; guardarCarrito();
    estado.promo = null; mem.guardar('glacio_promo', null);
    location.hash = `#/gracias/${pedido.num}`;
  };
  pintar();
}
function vGracias(num) {
  const p = estado.pedidos.find(x => x.num === num);
  if (!p) return vNoExiste();
  vista.innerHTML = `<div class="pagina"><div class="exito panel">
    <div class="check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.500"/></svg></div>
    <span class="eyebrow">Pedido ${p.num}</span>
    <h1 class="titulo-l" style="margin:12px 0 16px">¡Gracias, ${esc(p.cliente.split(' ')[0])}!</h1>
    <p class="sub" style="margin:0 auto 8px">Recibimos tu pedido por <b>${dinero(p.total)}</b> (${esc(p.pago)}). Lo enviaremos a ${esc(p.entrega)}.</p>
    <p class="sub" style="margin:0 auto 26px;font-size:14px">Esta es una compra de demostración: no se realizó ningún cobro.</p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn oscuro" href="#/cuenta?t=pedidos">Ver mis pedidos</a><a class="btn" href="#/productos">Seguir comprando</a></div>
  </div></div>`;
}

// ----- Cuenta -----
function vCuenta(q) {
  if (!estado.usuario) {
    vista.innerHTML = `<div class="pagina"><div class="acceso">
      <span class="eyebrow">Mi cuenta</span><h1 class="titulo-l" style="margin:10px 0 24px">Entra a<br>GLACIO</h1>
      <form class="panel" id="form-acceso" style="display:grid;gap:14px">
        <div class="chips" id="modo"><button type="button" class="chip activo" data-m="crear">Crear cuenta</button><button type="button" class="chip" data-m="entrar">Ya tengo cuenta</button></div>
        <label class="campo" id="c-nombre"><span>Nombre completo</span><input name="nombre" autocomplete="name" required></label>
        <label class="campo"><span>Correo electrónico</span><input name="correo" type="email" autocomplete="email" required></label>
        <label class="campo"><span>Contraseña</span><input name="clave" type="password" minlength="6" autocomplete="off" required></label>
        <button class="btn oscuro" type="submit" id="b-acceso">Crear cuenta</button>
        <p class="sub" style="font-size:13px">Sitio de demostración: tu perfil se guarda solo en este navegador y la contraseña no se almacena.</p>
      </form></div></div>`;
    let modo = 'crear';
    $('#modo').onclick = e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      modo = b.dataset.m; $$('#modo .chip').forEach(x => x.classList.toggle('activo', x === b));
      $('#c-nombre').hidden = modo === 'entrar'; $('#c-nombre input').required = modo === 'crear';
      $('#b-acceso').textContent = modo === 'crear' ? 'Crear cuenta' : 'Iniciar sesión';
    };
    $('#form-acceso').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target), correo = f.get('correo').trim();
      estado.usuario = { nombre: (f.get('nombre') || '').trim() || correo.split('@')[0], correo, telefono: '', direccion: '', ciudad: '' };
      mem.guardar('glacio_usuario', estado.usuario); marcarCuenta();
      aviso(`Hola, ${estado.usuario.nombre.split(' ')[0]}. Tu cuenta está lista.`); render();
    };
    return;
  }
  const u = estado.usuario;
  let tab = q.get('t') || 'datos';
  vista.innerHTML = `<div class="pagina">
    <div class="cab-seccion"><div><span class="eyebrow">Mi cuenta</span><h1 class="titulo-l">Hola, ${esc(u.nombre.split(' ')[0])}</h1></div></div>
    <div class="cuenta">
      <div class="pestanas" id="pestanas" role="tablist">
        <button data-t="datos">Datos personales</button><button data-t="pedidos">Historial de pedidos</button>
        <button data-t="clave">Cambiar contraseña</button><button data-t="salir">Cerrar sesión</button></div>
      <div class="panel" id="panel"></div>
    </div></div>`;
  const paneles = {
    datos: () => `<h2>Datos personales</h2><form id="f-datos" class="form-grid">
        <label class="campo"><span>Nombre completo</span><input name="nombre" required value="${esc(u.nombre)}"></label>
        <label class="campo"><span>Correo electrónico</span><input name="correo" type="email" required value="${esc(u.correo)}"></label>
        <label class="campo"><span>Teléfono</span><input name="telefono" type="tel" value="${esc(u.telefono)}"></label>
        <label class="campo"><span>Ciudad</span><input name="ciudad" value="${esc(u.ciudad)}"></label>
        <label class="campo todo"><span>Dirección de entrega</span><input name="direccion" value="${esc(u.direccion)}"></label>
        <div class="todo"><button class="btn oscuro" type="submit">Guardar cambios</button></div></form>`,
    pedidos: () => `<h2>Historial de pedidos</h2>${estado.pedidos.length ? estado.pedidos.map(p => `<article class="pedido">
        <header><div><b>Pedido ${p.num}</b><br><small style="color:var(--gris)">${new Date(p.fecha).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })} · ${esc(p.pago)}</small></div>
        <div style="text-align:right"><span class="estado">${p.estado}</span><br><b>${dinero(p.total)}</b></div></header>
        ${p.items.map(i => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:14.5px;padding:3px 0"><span>${i.cant} × ${esc(i.nombre)} — ${colorPorId(i.color).nombre}</span><span>${dinero(i.precio * i.cant)}</span></div>`).join('')}
      </article>`).join('') : `<p class="sub" style="margin-bottom:18px">Aún no has hecho ningún pedido.</p><a class="btn oscuro" href="#/productos">Ir a la tienda</a>`}`,
    clave: () => `<h2>Cambiar contraseña</h2><form id="f-clave" style="display:grid;gap:14px;max-width:420px">
        <label class="campo"><span>Contraseña actual</span><input name="a" type="password" required autocomplete="off"></label>
        <label class="campo"><span>Nueva contraseña</span><input name="b" type="password" minlength="6" required autocomplete="off"></label>
        <label class="campo"><span>Repite la nueva contraseña</span><input name="c" type="password" minlength="6" required autocomplete="off"></label>
        <button class="btn oscuro" type="submit">Actualizar contraseña</button></form>`,
  };
  function abrir(t) {
    if (t === 'salir') { estado.usuario = null; mem.guardar('glacio_usuario', null); marcarCuenta(); aviso('Sesión cerrada.'); return render(); }
    tab = paneles[t] ? t : 'datos';
    $$('#pestanas button').forEach(b => b.classList.toggle('activo', b.dataset.t === tab));
    $('#panel').innerHTML = paneles[tab]();
    const fd = $('#f-datos'), fc = $('#f-clave');
    if (fd) fd.onsubmit = e => { e.preventDefault(); Object.assign(u, Object.fromEntries(new FormData(fd))); mem.guardar('glacio_usuario', u); aviso('Datos actualizados.'); };
    if (fc) fc.onsubmit = e => {
      e.preventDefault(); const f = new FormData(fc);
      if (f.get('b') !== f.get('c')) return aviso('Las contraseñas nuevas no coinciden.');
      fc.reset(); aviso('Contraseña actualizada.');
    };
  }
  $('#pestanas').onclick = e => { const b = e.target.closest('[data-t]'); if (b) abrir(b.dataset.t); };
  abrir(tab);
}
function marcarCuenta() { $('#punto-cuenta').hidden = !estado.usuario; }

// ----- Contacto -----
function vContacto() {
  const ic = { dir: 'M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21zM12 12a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z', tel: 'M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z', cor: 'M3 6h18v12H3zM3 7l9 6.500L21 7', hor: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.500 2' };
  const dato = (k, t, v) => `<div class="dato"><svg viewBox="0 0 24 24"><path d="${ic[k]}"/></svg><div><b>${t}</b>${esc(v)}</div></div>`;
  vista.innerHTML = `<div class="pagina">
    <div class="cab-seccion"><div><span class="eyebrow">Contacto</span><h1 class="titulo-xl">Hablemos</h1></div>
      <p class="sub">¿Dudas sobre un pedido, un color o una compra al por mayor? Escríbenos y te respondemos pronto.</p></div>
    <div class="contacto">
      <form class="panel" id="form-contacto"><h2>Formulario de contacto</h2>
        <div class="form-grid">
          <label class="campo"><span>Nombre</span><input name="nombre" required autocomplete="name" value="${esc(estado.usuario?.nombre || '')}"></label>
          <label class="campo"><span>Correo electrónico</span><input name="correo" type="email" required autocomplete="email" value="${esc(estado.usuario?.correo || '')}"></label>
          <label class="campo todo"><span>Asunto</span><input name="asunto" required></label>
          <label class="campo todo"><span>Mensaje</span><textarea name="mensaje" rows="6" required></textarea></label>
          <div class="todo"><button class="btn oscuro" type="submit">Enviar mensaje</button></div>
        </div></form>
      <div class="datos-contacto">
        ${dato('dir', 'Dirección de la tienda', TIENDA.direccion)}${dato('tel', 'Teléfono', TIENDA.telefono)}${dato('cor', 'Correo electrónico', TIENDA.correo)}${dato('hor', 'Horario', TIENDA.horario)}
        <iframe class="mapa" src="${TIENDA.mapa}" title="Mapa de ubicación de la tienda" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div></div>`;
  $('#form-contacto').onsubmit = e => { e.preventDefault(); e.target.reset(); aviso('Mensaje enviado. Te responderemos por correo.'); };
}

// ----- FAQ e información -----
function vFaq() {
  vista.innerHTML = `<div class="pagina">
    <div class="cab-seccion"><div><span class="eyebrow">Ayuda</span><h1 class="titulo-xl">Preguntas<br>frecuentes</h1></div></div>
    <div class="faq">
      <div class="pestanas">${FAQ.map((g, i) => `<button data-g="${i}">${g.categoria}</button>`).join('')}</div>
      <div>${FAQ.map((g, i) => `<h2 id="faq-${i}">${g.categoria}</h2>${g.items.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join('')}`).join('')}
        <div class="panel" style="margin-top:26px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><b>¿No encontraste tu respuesta?</b><a class="btn oscuro" href="#/contacto">Contáctanos</a></div></div>
    </div></div>`;
  $('.faq .pestanas').onclick = e => { const b = e.target.closest('[data-g]'); if (b) { const h = $(`#faq-${b.dataset.g}`); window.scrollTo({ top: h.getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); } };
}
function vInfo(slug) {
  const d = LEGALES[slug]; if (!d) return vNoExiste();
  vista.innerHTML = `<div class="pagina"><div class="legal"><span class="eyebrow">Información</span><h1 class="titulo-l" style="margin:10px 0 30px">${d.titulo}</h1>${d.cuerpo.map(p => `<p>${esc(p)}</p>`).join('')}</div></div>`;
}
function vNoExiste() {
  vista.innerHTML = `<div class="pagina"><div class="vacio"><h3>Esta página no existe</h3><p class="sub" style="margin:0 auto 22px">Puede que el enlace esté roto o el producto ya no esté disponible.</p><a class="btn oscuro" href="#/">Volver al inicio</a></div></div>`;
}

// ---------- Rutas ----------
let obs;
function observar() {
  obs ||= new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); obs.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.rev:not(.visto)').forEach(el => obs.observe(el));
}
function render() {
  limpiar.forEach(f => f()); limpiar = [];
  const [ruta, consulta = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [a = '', b] = ruta.split('/'), q = new URLSearchParams(consulta);
  acento(COLORES[0].hex);
  ({
    '': vInicio, productos: () => vProductos(q), producto: () => vProducto(b, q), ofertas: vOfertas, carrito: vCarrito,
    gracias: () => vGracias(b), cuenta: () => vCuenta(q), contacto: vContacto, faq: vFaq, info: () => vInfo(b),
  }[a] || vNoExiste)();
  const nav = { '': 'inicio', producto: 'productos' }[a] ?? a;
  $$('#menu a').forEach(x => x.classList.toggle('activo', x.dataset.ruta === nav));
  $('#menu').classList.remove('abierto'); $('#hamb').setAttribute('aria-expanded', 'false');
  document.body.dataset.ruta = a || 'inicio';
  window.scrollTo(0, 0);
  cabecera(); observar();
}
function cabecera() { $('#cab').classList.toggle('solida', scrollY > 30 || document.body.dataset.ruta !== 'inicio'); }

// ---------- Arranque ----------
$('#hamb').onclick = () => { const ab = $('#menu').classList.toggle('abierto'); $('#hamb').setAttribute('aria-expanded', ab); };
$('#redes').innerHTML = TIENDA.redes.map(r => `<a href="${r.url}" aria-label="${r.nombre}" title="${r.nombre}"><b style="font-size:12px">${r.icono.toUpperCase()}</b></a>`).join('');
$('#pie-contacto').innerHTML = `${esc(TIENDA.direccion)}<br>${esc(TIENDA.telefono)}<br>${esc(TIENDA.correo)}`;
$('#boletin').onsubmit = e => { e.preventDefault(); e.target.reset(); aviso('¡Listo! Te suscribiste al boletín de GLACIO.'); };
window.addEventListener('scroll', cabecera, { passive: true });
window.addEventListener('hashchange', render);

(async () => {
  try { await Promise.race([listo(), new Promise(r => setTimeout(r, 6000))]); } catch { /* sigue sin las fotos */ }
  guardarCarrito(); $('#cuenta-carrito').classList.remove('salto'); marcarCuenta();
  render();
})();
