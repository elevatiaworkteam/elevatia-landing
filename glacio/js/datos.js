// =====================================================================
//  DATOS DE LA TIENDA — todo lo editable está en este archivo.
//  OJO: precios, descuentos, reseñas, teléfono y dirección son DE
//  REFERENCIA (proyecto universitario). Cámbialos aquí antes de entregar.
// =====================================================================

export const TIENDA = {
  nombre: 'GLACIO',
  lema: 'Frío que dura. Colores que no existían.',
  moneda: 'RD$',
  direccion: 'Av. Winston Churchill, Piantini, Santo Domingo, D. N.', // de referencia
  telefono: '(809) 555-0100', // de referencia
  correo: 'hola@glacio.do', // de referencia
  horario: 'Lunes a sábado, 9:00 a. m. – 7:00 p. m.',
  mapa: 'https://www.google.com/maps?q=Piantini,+Santo+Domingo&output=embed',
  redes: [
    { nombre: 'Instagram', url: '#', icono: 'ig' },
    { nombre: 'TikTok', url: '#', icono: 'tt' },
    { nombre: 'Facebook', url: '#', icono: 'fb' },
    { nombre: 'WhatsApp', url: '#', icono: 'wa' },
  ],
  envioGratisDesde: 3500, // de referencia
  costoEnvio: 250, // de referencia
};

// Los 6 colores nuevos — colección Caribe
export const COLORES = [
  { id: 'bahia', nombre: 'Bahía', hex: '#12b5ad', frase: 'El turquesa del agua a las diez de la mañana.' },
  { id: 'coral', nombre: 'Coral', hex: '#ff6652', frase: 'Arrecife vivo, encendido y cálido.' },
  { id: 'mango', nombre: 'Mango', hex: '#ffb11f', frase: 'Amarillo maduro, de temporada todo el año.' },
  { id: 'palma', nombre: 'Palma', hex: '#1c8a59', frase: 'Verde profundo, sombra de cocotero.' },
  { id: 'atardecer', nombre: 'Atardecer', hex: '#a182f5', frase: 'El lila de las seis y media en el Malecón.' },
  { id: 'arena', nombre: 'Arena', hex: '#e2cfb0', frase: 'Neutro suave, playa tranquila.' },
];
export const colorPorId = id => COLORES.find(c => c.id === id) || COLORES[0];

export const CATEGORIAS = ['Vasos', 'Termos', 'Tazas', 'Porta latas'];
export const LINEAS = ['GLACIO Caribe', 'GLACIO Pro', 'GLACIO Esencial']; // filtro de "marca"

const SPEC_BASE = [
  ['Material', 'Acero inoxidable 18/8 de grado alimenticio'],
  ['Aislamiento', 'Doble pared sellada al vacío'],
  ['Exterior', 'Pintura en polvo antideslizante, no suda'],
  ['Cuidado', 'Apto para lavavajillas'],
  ['Libre de', 'BPA'],
];

export const PRODUCTOS = [
  {
    id: 'vaso-brisa-30', nombre: 'Vaso Brisa 30 oz', forma: 'vaso30', categoria: 'Vasos', linea: 'GLACIO Caribe',
    precio: 2450, oferta: 15, color: 'bahia', destacado: true, nuevo: true,
    corto: 'El vaso grande de todos los días, con tapa deslizante.',
    descripcion: 'El Brisa 30 oz mantiene tu bebida fría con hielo durante la jornada completa y caliente durante la mañana entera. Base cónica que entra en el portavasos del carro, tapa deslizante magnética y acabado en polvo que no resbala ni suda.',
    specs: [['Capacidad', '30 oz (887 ml)'], ['Tapa', 'Deslizante magnética, transparente'], ...SPEC_BASE],
    tamanos: ['20 oz', '30 oz'],
  },
  {
    id: 'vaso-brisa-20', nombre: 'Vaso Brisa 20 oz', forma: 'vaso20', categoria: 'Vasos', linea: 'GLACIO Caribe',
    precio: 1950, oferta: 0, color: 'coral', destacado: true, nuevo: true,
    corto: 'Compacto, para el café o el jugo de la mañana.',
    descripcion: 'La versión compacta del Brisa. Cabe en cualquier portavasos y en la mano. Ideal para café, jugos y batidos; conserva la temperatura sin que el exterior se caliente ni gotee.',
    specs: [['Capacidad', '20 oz (591 ml)'], ['Tapa', 'Deslizante magnética, transparente'], ...SPEC_BASE],
    tamanos: ['20 oz', '30 oz'],
  },
  {
    id: 'vaso-oleaje-40', nombre: 'Vaso Oleaje 40 oz con asa', forma: 'vaso40', categoria: 'Vasos', linea: 'GLACIO Pro',
    precio: 2950, oferta: 10, color: 'atardecer', destacado: true, nuevo: true,
    corto: 'Gran capacidad, asa cómoda y sorbete incluido.',
    descripcion: 'El Oleaje es el vaso para hidratarte el día entero: 40 oz, asa ergonómica, sorbete reutilizable y base estrecha para el portavasos. La tapa gira para beber con sorbete, directo o cerrar por completo.',
    specs: [['Capacidad', '40 oz (1.18 L)'], ['Tapa', 'Giratoria de 3 posiciones con sorbete'], ['Asa', 'Integrada, mismo color del cuerpo'], ...SPEC_BASE],
    tamanos: ['40 oz'],
  },
  {
    id: 'termo-marea-36', nombre: 'Termo Marea 36 oz', forma: 'termo36', categoria: 'Termos', linea: 'GLACIO Caribe',
    precio: 3250, oferta: 0, color: 'mango', destacado: true, nuevo: true,
    corto: 'Botella de boca ancha con tapa de asa, a prueba de derrames.',
    descripcion: 'El Marea es la botella que aguanta playa, gimnasio y carretera. Boca ancha para hielo entero, tapa de rosca con asa de tres dedos y cierre hermético: va acostada en la mochila sin botar una gota.',
    specs: [['Capacidad', '36 oz (1.06 L)'], ['Tapa', 'Rosca hermética con asa'], ['Boca', 'Ancha, admite hielo entero'], ...SPEC_BASE],
    tamanos: ['18 oz', '36 oz', '64 oz'],
  },
  {
    id: 'termo-marea-18', nombre: 'Termo Marea 18 oz', forma: 'termo18', categoria: 'Termos', linea: 'GLACIO Esencial',
    precio: 2150, oferta: 20, color: 'palma', destacado: false, nuevo: false,
    corto: 'La botella ligera que cabe en la cartera.',
    descripcion: 'Toda la resistencia del Marea en formato de bolsillo. Perfecta para la universidad o la oficina: liviana, hermética y fácil de rellenar.',
    specs: [['Capacidad', '18 oz (532 ml)'], ['Tapa', 'Rosca hermética con asa'], ...SPEC_BASE],
    tamanos: ['18 oz', '36 oz', '64 oz'],
  },
  {
    id: 'termo-marea-64', nombre: 'Termo Marea 64 oz', forma: 'termo64', categoria: 'Termos', linea: 'GLACIO Pro',
    precio: 4450, oferta: 0, color: 'arena', destacado: false, nuevo: false,
    corto: 'Medio galón para compartir en la playa o el play.',
    descripcion: 'El hermano mayor de la familia Marea. Medio galón de agua helada para el equipo completo, con el mismo cierre hermético y asa reforzada.',
    specs: [['Capacidad', '64 oz (1.89 L)'], ['Tapa', 'Rosca hermética con asa reforzada'], ...SPEC_BASE],
    tamanos: ['18 oz', '36 oz', '64 oz'],
  },
  {
    id: 'taza-alba-14', nombre: 'Taza Alba 14 oz', forma: 'taza14', categoria: 'Tazas', linea: 'GLACIO Esencial',
    precio: 1750, oferta: 0, color: 'arena', destacado: true, nuevo: false,
    corto: 'Tu café caliente hasta el último sorbo.',
    descripcion: 'La Alba es la taza de escritorio y de campamento: asa amplia, base ancha que no se vuelca y tapa deslizante para que el café llegue caliente al final de la reunión.',
    specs: [['Capacidad', '14 oz (414 ml)'], ['Tapa', 'Deslizante magnética, transparente'], ['Asa', 'Amplia, para cuatro dedos'], ...SPEC_BASE],
    tamanos: ['14 oz'],
  },
  {
    id: 'porta-latas-cayo', nombre: 'Porta latas Cayo 12 oz', forma: 'lata12', categoria: 'Porta latas', linea: 'GLACIO Caribe',
    precio: 1450, oferta: 25, color: 'coral', destacado: false, nuevo: true,
    corto: 'La fría se queda fría, y tu mano seca.',
    descripcion: 'El Cayo abraza latas y botellas de 12 oz con un aro de rosca que las deja fijas. Adiós a la servilleta alrededor de la cerveza.',
    specs: [['Compatibilidad', 'Latas y botellas de 12 oz'], ['Cierre', 'Aro de rosca con junta'], ...SPEC_BASE],
    tamanos: ['12 oz'],
  },
];

export const productoPorId = id => PRODUCTOS.find(p => p.id === id);
export const precioFinal = p => Math.round(p.precio * (1 - (p.oferta || 0) / 100));

// Reseñas de muestra (contenido de ejemplo para el proyecto)
export const RESENAS = {
  'vaso-brisa-30': [
    { nombre: 'Carolina M.', estrellas: 5, texto: 'Lo llené de hielo en la mañana y en la tarde todavía sonaba. El color Bahía es más lindo en persona.' },
    { nombre: 'José Luis R.', estrellas: 5, texto: 'Entra perfecto en el portavasos del carro. La tapa no bota.' },
    { nombre: 'Yaritza P.', estrellas: 4, texto: 'Muy bueno. Me gustaría que trajera sorbete, pero el vaso es excelente.' },
  ],
  'vaso-brisa-20': [
    { nombre: 'Miguel A.', estrellas: 5, texto: 'Mi café llega caliente a la oficina. Tamaño ideal.' },
    { nombre: 'Laura G.', estrellas: 4, texto: 'El Coral es precioso. Liviano y no suda.' },
  ],
  'vaso-oleaje-40': [
    { nombre: 'Estefany D.', estrellas: 5, texto: 'Con este por fin me tomo el agua del día. El asa es comodísima.' },
    { nombre: 'Rafael T.', estrellas: 5, texto: 'Grande pero cabe en el portavasos. El lila está brutal.' },
    { nombre: 'Ana C.', estrellas: 5, texto: 'Lo compré para el gimnasio y ahora va conmigo a todas partes.' },
  ],
  'termo-marea-36': [
    { nombre: 'Pedro S.', estrellas: 5, texto: 'Lo dejé en el carro al sol y el agua seguía helada.' },
    { nombre: 'Massiel B.', estrellas: 4, texto: 'Hermético de verdad, va acostado en la mochila sin problema.' },
  ],
  'termo-marea-18': [
    { nombre: 'Daniela V.', estrellas: 4, texto: 'Cabe en mi cartera. Buen precio con la oferta.' },
    { nombre: 'Luis E.', estrellas: 4, texto: 'Cumple. Para la universidad es perfecto.' },
  ],
  'termo-marea-64': [
    { nombre: 'Franklin J.', estrellas: 5, texto: 'Lo llevamos al play los domingos, alcanza para todos.' },
  ],
  'taza-alba-14': [
    { nombre: 'Rosa H.', estrellas: 5, texto: 'La uso en el escritorio todos los días. No se vuelca.' },
    { nombre: 'Julio N.', estrellas: 4, texto: 'El café dura caliente toda la reunión.' },
  ],
  'porta-latas-cayo': [
    { nombre: 'Kelvin O.', estrellas: 5, texto: 'La fría, fría hasta el final. El mejor regalo que he dado.' },
    { nombre: 'Patricia L.', estrellas: 4, texto: 'Sirve también con botellitas. Muy práctico.' },
  ],
};
export function valoracion(id) {
  const r = RESENAS[id] || [];
  if (!r.length) return { media: 0, total: 0 };
  return { media: r.reduce((s, x) => s + x.estrellas, 0) / r.length, total: r.length };
}

// Ofertas y promociones (de referencia)
export const PROMOS = [
  { codigo: 'CARIBE10', titulo: 'Lanzamiento Caribe', texto: '10% adicional en toda la colección de colores nuevos con el código', tipo: 'porcentaje', valor: 10, color: 'bahia' },
  { codigo: 'DUO', titulo: 'Dúo GLACIO', texto: 'Lleva dos vasos Brisa y el envío va por la casa con el código', tipo: 'envio', valor: 0, color: 'coral' },
  { codigo: 'UNICARIBE', titulo: 'Descuento estudiantil', texto: '15% para estudiantes con el código', tipo: 'porcentaje', valor: 15, color: 'atardecer' },
];

export const FAQ = [
  {
    categoria: 'Producto',
    items: [
      ['¿De qué están hechos los termos GLACIO?', 'De acero inoxidable 18/8 de grado alimenticio, con doble pared sellada al vacío. No transfieren sabor ni olor, y no contienen BPA.'],
      ['¿Sirven para bebidas calientes y frías?', 'Sí. El vacío entre las dos paredes aísla en ambos sentidos: mantiene el hielo y también el café caliente.'],
      ['¿Se pueden meter al lavavajillas?', 'Sí, cuerpo y tapa. La pintura en polvo está horneada y no se pela con el lavado.'],
      ['¿El exterior suda o se calienta?', 'No. La pared exterior queda a temperatura ambiente, así que no moja la mesa ni quema la mano.'],
    ],
  },
  {
    categoria: 'Pedidos y envíos',
    items: [
      ['¿A dónde envían?', 'A todo el territorio de República Dominicana mediante mensajería.'],
      ['¿Cuánto cuesta el envío?', 'El costo se calcula en el carrito. Los pedidos que superan el monto mínimo indicado allí tienen envío gratis.'],
      ['¿Puedo recoger en tienda?', 'Sí. Elige "Retiro en tienda" al finalizar tu compra y te avisamos cuando esté listo.'],
    ],
  },
  {
    categoria: 'Pagos',
    items: [
      ['¿Qué métodos de pago aceptan?', 'Transferencia bancaria, pago contra entrega y tarjeta al recibir.'],
      ['¿Cómo uso un código de descuento?', 'Escríbelo en el campo "Código promocional" del carrito y presiona Aplicar.'],
    ],
  },
  {
    categoria: 'Cambios y garantía',
    items: [
      ['¿Tienen garantía?', 'Sí. Cubrimos defectos de fabricación, incluida la pérdida de vacío. Escríbenos desde la página de Contacto con tu número de pedido.'],
      ['¿Puedo cambiar el color?', 'Sí, mientras el producto esté sin uso y en su empaque original. Coordina el cambio desde Contacto.'],
    ],
  },
];

export const LEGALES = {
  'sobre-nosotros': {
    titulo: 'Sobre nosotros',
    cuerpo: [
      'GLACIO nace en Santo Domingo con una idea simple: si vives en el Caribe, tu bebida tiene que sobrevivir al Caribe.',
      'Diseñamos vasos, termos y tazas de acero inoxidable con doble pared al vacío, y los pintamos con los colores que vemos todos los días: el turquesa de la bahía, el coral del arrecife, el amarillo del mango maduro.',
      'Esta tienda es un proyecto académico de comercio electrónico desarrollado para la Universidad del Caribe (UNICARIBE).',
    ],
  },
  privacidad: {
    titulo: 'Políticas de privacidad',
    cuerpo: [
      'Solo solicitamos los datos necesarios para procesar tu pedido y contactarte: nombre, correo, teléfono y dirección de entrega.',
      'No vendemos ni compartimos tu información con terceros, salvo con la empresa de mensajería que entrega tu pedido.',
      'Puedes solicitar la actualización o eliminación de tus datos en cualquier momento desde tu perfil o escribiéndonos por la página de Contacto.',
      'Este sitio es una demostración académica: la información que escribas se guarda únicamente en tu propio navegador.',
    ],
  },
  terminos: {
    titulo: 'Términos y condiciones',
    cuerpo: [
      'Los precios están expresados en pesos dominicanos (RD$) e incluyen impuestos. Las ofertas aplican mientras estén publicadas en el sitio.',
      'Los colores pueden variar ligeramente según la pantalla de tu dispositivo.',
      'Los cambios se aceptan con el producto sin uso y en su empaque original.',
      'Este sitio es una demostración académica: no se procesan pagos ni se despachan pedidos reales.',
    ],
  },
};
