// src/app/page.tsx
export const revalidate = 60

import { CartProvider } from '@/context/CartContext'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Marquee } from '@/components/landing/Marquee'
import { Productos } from '@/components/landing/Productos'
import { Beneficios } from '@/components/landing/Beneficios'
import { Testimonios } from '@/components/landing/Testimonios'
import { Footer } from '@/components/landing/Footer'
import { Cart } from '@/components/landing/Cart'
import { getSiteConfig } from '@/lib/site-config'

export default async function Home() {
  const config = await getSiteConfig()

  return (
    <CartProvider>
      <main>
        <Navbar />
        <Cart pagos={config.pagos} telefono={config.general.telefono} />
        <Hero config={config.hero} />
        <Marquee items={config.marquee.items} />
        <Productos />
        <Beneficios items={config.beneficios} />
        <Testimonios items={config.testimonios} />
        <Footer config={config.footer} />
      </main>
    </CartProvider>
  )
}
