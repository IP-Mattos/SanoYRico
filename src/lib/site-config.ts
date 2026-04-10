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
}

export interface PagoMetodo {
  activo: boolean
  banco?: string
  cbu?: string
  alias?: string
  titular?: string
  link?: string
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
  beneficios: BeneficioItem[]
  testimonios: TestimonioItem[]
  footer: FooterConfig
  pagos: PagosConfig
}

export const DEFAULT_CONFIG: SiteConfig = {
  general: {
    sitioNombre: 'Sano y Rico',
    telefono: '59893644132'
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
  beneficios: [
    { icono: '🌾', titulo: 'Ingredientes reales', descripcion: 'Solo usamos ingredientes que reconocés. Sin números raros, sin E-something.' },
    { icono: '🔬', titulo: 'Formulados por nutricionistas', descripcion: 'Cada barra fue desarrollada con profesionales para garantizar el balance correcto.' },
    { icono: '🌍', titulo: 'Producción local', descripcion: 'Fabricados en Uruguay con ingredientes de productores locales.' },
    { icono: '♻️', titulo: 'Packaging sustentable', descripcion: 'Envases biodegradables. Porque cuidar el cuerpo y el planeta van de la mano.' }
  ],
  testimonios: [
    { nombre: 'Valentina M.', lugar: 'Montevideo', avatar: '👩', texto: 'Las llevo al trabajo todos los días. Me ayudan a no caer en la máquina expendedora de la oficina.' },
    { nombre: 'Rodrigo P.', lugar: 'Salto', avatar: '🧑', texto: 'La de Cacao & Maní es una locura. No puedo creer que algo tan rico sea sano. Mi favorita absoluta.' },
    { nombre: 'Lucía F.', lugar: 'Canelones', avatar: '👩‍👧', texto: 'Las compro en pack para toda la semana. Mis hijos también las comen y eso ya dice todo.' }
  ],
  footer: {
    ctaTitulo: 'Tu snack sano te está esperando',
    ctaSubtexto: 'Pedido mínimo: 6 unidades. Envío gratis a partir de $600 en todo Uruguay.',
    ctaBoton: 'Ver todos los productos →',
    copyright: '© 2025 Sano y Rico. Hecho con 💚 en Uruguay.',
    email: 'contacto@sanoyrico.uy'
  },
  pagos: {
    transferencia: { activo: false, banco: '', cbu: '', alias: '', titular: '' },
    deposito: { activo: false, banco: '', cbu: '', titular: '' },
    mercadopago: { activo: false, link: '' }
  }
}

/** Fetch config from Supabase (server-side, revalidated by page-level ISR). */
export async function getSiteConfig(): Promise<SiteConfig> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/configuracion?select=clave,valor`
  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      },
      next: { tags: ['site-config'] }
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
