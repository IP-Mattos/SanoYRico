// src/app/page.tsx
export const revalidate = 60

import { createClient } from '@supabase/supabase-js'
import { CartProvider } from '@/context/CartContext'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Marquee } from '@/components/landing/Marquee'
import { Productos } from '@/components/landing/Productos'
import { ComoFunciona } from '@/components/landing/ComoFunciona'
import { Beneficios } from '@/components/landing/Beneficios'
import { Testimonios } from '@/components/landing/Testimonios'
import { Faqs } from '@/components/landing/Faqs'
import { Footer } from '@/components/landing/Footer'
import { Cart } from '@/components/landing/Cart'
import { CartToast, StickyMobileCart } from '@/components/landing/CartToast'
import { getSiteConfig } from '@/lib/site-config'
import { organizationSchema, productsItemListSchema, websiteSchema } from '@/lib/jsonld'
import { type Producto } from '@/lib/types'

async function getProductosForSeo(): Promise<Producto[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.from('productos').select('*').eq('activo', true).order('nombre')
    return data ?? []
  } catch {
    return []
  }
}

export default async function Home() {
  const [config, productos] = await Promise.all([getSiteConfig(), getProductosForSeo()])

  const schemas = [
    organizationSchema(),
    websiteSchema(),
    ...(productos.length > 0 ? [productsItemListSchema(productos)] : [])
  ]

  return (
    <CartProvider>
      {/* JSON-LD server-side para SEO: Google lee pricing/stock del HTML inicial */}
      {schemas.map((s, i) => (
        <script
          key={i}
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <main>
        <Navbar />
        <Cart
          pagos={config.pagos}
          telefono={config.general.telefono}
          minimoPedido={config.general.minimoPedido}
        />
        <CartToast />
        <StickyMobileCart />
        <Hero config={config.hero} />
        <Marquee items={config.marquee.items} />
        <Productos />
        <ComoFunciona config={config.comoFunciona} />
        <Beneficios items={config.beneficios} />
        <Testimonios
          items={config.testimonios}
          clientesFelices={
            config.hero.stats.find((s) => s.label.toLowerCase().includes('cliente'))?.valor
          }
        />
        <Faqs config={config.faqs} />
        <Footer config={config.footer} />
      </main>
    </CartProvider>
  )
}
