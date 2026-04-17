// Helpers para generar JSON-LD (Schema.org) para SEO.
// Se inyectan en la landing como <script type="application/ld+json"> server-side
// así Google lee el pricing/stock directo del HTML inicial.

import { type Producto } from '@/lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sano-y-rico.vercel.app'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sano y Rico',
    url: BASE_URL,
    logo: `${BASE_URL}/logo-sano-y-rico.png`,
    description: 'Barras de cereal, mixes y alfajores artesanales hechos en Uruguay. Sin azúcar refinada, sin conservantes.',
    address: { '@type': 'PostalAddress', addressCountry: 'UY' },
    sameAs: []
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sano y Rico',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }
}

export function productsItemListSchema(productos: Producto[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo Sano y Rico',
    itemListElement: productos.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        '@id': `${BASE_URL}/#producto-${p.id}`,
        name: p.nombre,
        description: p.descripcion ?? undefined,
        image: p.imagen_url ?? undefined,
        category: p.categoria,
        offers: {
          '@type': 'Offer',
          price: p.precio,
          priceCurrency: 'UYU',
          availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `${BASE_URL}/#producto-${p.id}`
        }
      }
    }))
  }
}
