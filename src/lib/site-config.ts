// src/lib/site-config.ts
// Tipos y valores por defecto para el contenido editable de la landing page.

export interface HeroConfig {
  badge: string
  titulo: string
  tituloDestacado: string
  tituloCierre: string
  subtitulo: string
  stats: { valor: string; label: string }[]
  tags: { emoji: string; texto: string }[]
}

export interface MarqueeConfig {
  items: string[]
}

export interface BeneficioItem {
  icono: string
  titulo: string
  descripcion: string
}

export interface TestimonioItem {
  nombre: string
  lugar: string
  avatar: string
  texto: string
  estrellas?: number
}

export interface FooterConfig {
  ctaTitulo: string
  ctaSubtexto: string
  ctaBoton: string
  copyright: string
  email: string
}

export interface GeneralConfig {
  sitioNombre: string
  telefono: string
  minimoPedido: number
}

export interface PasoItem {
  emoji: string
  titulo: string
  descripcion: string
}

export interface ComoFuncionaConfig {
  titulo: string
  subtitulo: string
  pasos: PasoItem[]
}

export interface FaqItem {
  pregunta: string
  respuesta: string
}

export interface FaqsConfig {
  titulo: string
  tituloDestacado: string
  items: FaqItem[]
}

// Datos bancarios adaptados a Uruguay.
// Los viejos `cbu` y `alias` (nomenclatura argentina) quedan para retrocompatibilidad
// con filas guardadas antes del cambio — se auto-migran a `numeroCuenta` al cargar.
export interface PagoMetodo {
  activo: boolean
  // Datos de la cuenta
  banco?: string
  tipoCuenta?: string // "Caja de Ahorros en Pesos", "Cuenta Corriente en Dólares", etc.
  sucursal?: string   // BROU y otros suelen pedir sucursal separada
  numeroCuenta?: string
  titular?: string
  documento?: string  // C.I. del titular (opcional, ayuda al cliente a cotejar)
  // Mercado Pago
  link?: string
  // Deprecated — se mantienen solo para no perder datos cargados antes del rework UY.
  /** @deprecated campo argentino, usar `numeroCuenta` */
  cbu?: string
  /** @deprecated campo argentino, no aplica a Uruguay */
  alias?: string
}

export interface PagosConfig {
  transferencia: PagoMetodo
  deposito: PagoMetodo
  mercadopago: PagoMetodo
}

export interface SiteConfig {
  general: GeneralConfig
  hero: HeroConfig
  marquee: MarqueeConfig
  comoFunciona: ComoFuncionaConfig
  beneficios: BeneficioItem[]
  testimonios: TestimonioItem[]
  faqs: FaqsConfig
  footer: FooterConfig
  pagos: PagosConfig
}

export const DEFAULT_CONFIG: SiteConfig = {
  general: {
    sitioNombre: 'Sano y Rico',
    telefono: '59893644132',
    minimoPedido: 2000
  },
  hero: {
    badge: '✦ 100% Natural · Sin conservantes',
    titulo: 'Energía',
    tituloDestacado: 'real',
    tituloCierre: 'para tu día',
    subtitulo:
      'Barras de cereal y snacks saludables hechos con ingredientes naturales. Sin azúcar refinada, sin rellenos artificiales.',
    stats: [
      { valor: '18+', label: 'Variedades' },
      { valor: '2.4k', label: 'Clientes felices' },
      { valor: '0g', label: 'Azúcar refinada' }
    ],
    tags: [
      { emoji: '🌾', texto: 'Avena integral' },
      { emoji: '🍯', texto: 'Miel pura' },
      { emoji: '💚', texto: 'Sin gluten' },
      { emoji: '⚡', texto: 'Alto en proteína' }
    ]
  },
  marquee: {
    items: ['Sin conservantes', 'Avena integral', 'Alto en fibra', 'Proteína natural', 'Sin gluten', 'Vegano', 'Hecho en Uruguay']
  },
  comoFunciona: {
    titulo: 'Tres pasos y a disfrutar',
    subtitulo: 'Sin vueltas ni formularios eternos. Pedís, pagás, recibís.',
    pasos: [
      { emoji: '🛒', titulo: 'Elegís tus favoritos', descripcion: 'Recorré el catálogo, sumá lo que quieras al carrito. Pedido mínimo $2000.' },
      { emoji: '💳', titulo: 'Pagás como te quede cómodo', descripcion: 'Transferencia, depósito o Mercado Pago. Recibís un recibo por email al instante.' },
      { emoji: '📦', titulo: 'Te llega a tu casa', descripcion: 'Envío incluido en todo Uruguay. Te avisamos por WhatsApp cuando sale.' }
    ]
  },
  beneficios: [
    { icono: '🌾', titulo: 'Ingredientes reales', descripcion: 'Solo usamos ingredientes que reconocés. Sin números raros, sin E-something.' },
    { icono: '🔬', titulo: 'Formulados por nutricionistas', descripcion: 'Cada barra fue desarrollada con profesionales para garantizar el balance correcto.' },
    { icono: '🌍', titulo: 'Producción local', descripcion: 'Fabricados en Uruguay con ingredientes de productores locales.' },
    { icono: '♻️', titulo: 'Packaging sustentable', descripcion: 'Envases biodegradables. Porque cuidar el cuerpo y el planeta van de la mano.' }
  ],
  testimonios: [
    { nombre: 'Valentina M.', lugar: 'Montevideo', avatar: '👩', texto: 'Las llevo al trabajo todos los días. Me ayudan a no caer en la máquina expendedora de la oficina.', estrellas: 5 },
    { nombre: 'Rodrigo P.', lugar: 'Salto', avatar: '🧑', texto: 'La de Cacao & Maní es una locura. No puedo creer que algo tan rico sea sano. Mi favorita absoluta.', estrellas: 5 },
    { nombre: 'Lucía F.', lugar: 'Canelones', avatar: '👩‍👧', texto: 'Las compro en pack para toda la semana. Mis hijos también las comen y eso ya dice todo.', estrellas: 5 }
  ],
  faqs: {
    titulo: 'Todo lo que querés saber,',
    tituloDestacado: 'sin letra chica',
    items: [
      { pregunta: '¿Cuánto demora el envío?', respuesta: 'Entre 24 y 72 horas hábiles en Montevideo y área metropolitana. Para el interior del país, entre 2 y 5 días hábiles. Te avisamos por WhatsApp cuando el pedido sale.' },
      { pregunta: '¿Cómo sé si mi pedido se confirmó?', respuesta: 'Recibís un email apenas lo hacés con el número de pedido y el detalle. Si elegiste transferencia o depósito, te contactamos para coordinar el pago. Con Mercado Pago se confirma automáticamente.' },
      { pregunta: '¿Cuál es el pedido mínimo?', respuesta: '$2000. Es el mínimo para que el envío nos quede viable — una vez alcanzado, el envío va incluido en el precio.' },
      { pregunta: '¿Qué métodos de pago aceptan?', respuesta: 'Transferencia bancaria, depósito y Mercado Pago (tarjeta de crédito, débito o saldo). Elegís en el checkout y te mostramos los datos que necesites.' },
      { pregunta: '¿Los productos tienen gluten o azúcar agregada?', respuesta: 'Ninguno tiene azúcar refinada. Varios son sin gluten (está indicado en cada producto). Si tenés alguna intolerancia específica, preguntanos antes y te asesoramos.' },
      { pregunta: '¿Puedo cambiar o cancelar un pedido?', respuesta: 'Sí, mientras esté en estado "pendiente". Escribinos por WhatsApp al número que figura en el footer lo antes posible y lo resolvemos.' }
    ]
  },
  footer: {
    ctaTitulo: 'Tu snack sano te está esperando',
    ctaSubtexto: 'Pedido mínimo: 6 unidades. Envío gratis a partir de $600 en todo Uruguay.',
    ctaBoton: 'Ver todos los productos →',
    copyright: '© 2025 Sano y Rico. Hecho con 💚 en Uruguay.',
    email: 'contacto@sanoyrico.uy'
  },
  pagos: {
    transferencia: { activo: false, banco: '', tipoCuenta: '', sucursal: '', numeroCuenta: '', titular: '', documento: '' },
    deposito: { activo: false, banco: '', tipoCuenta: '', sucursal: '', numeroCuenta: '', titular: '', documento: '' },
    mercadopago: { activo: false, link: '' }
  }
}

// Opciones comunes para los selects del admin (exportadas para reutilizar en UI)
export const BANCOS_UY = ['BROU', 'BBVA', 'Itaú', 'Santander', 'HSBC']
export const TIPOS_CUENTA_UY = [
  'Caja de Ahorros en Pesos',
  'Caja de Ahorros en Dólares',
  'Cuenta Corriente en Pesos',
  'Cuenta Corriente en Dólares'
]

/** Fetch config from Supabase (server-side, revalidated by page-level ISR). */
export async function getSiteConfig(): Promise<SiteConfig> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/configuracion?select=clave,valor`
  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      },
      cache: 'no-store'
    })
    if (!res.ok) return DEFAULT_CONFIG
    const rows: { clave: string; valor: unknown }[] = await res.json()
    const merged: SiteConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    rows.forEach(({ clave, valor }) => {
      if (clave in merged) {
        ;(merged as unknown as Record<string, unknown>)[clave] = valor
      }
    })
    return merged
  } catch {
    return DEFAULT_CONFIG
  }
}
