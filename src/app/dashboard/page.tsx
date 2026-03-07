// src/app/page.tsx
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Marquee } from '@/components/landing/Marquee'
import { Productos } from '@/components/landing/Productos'
import { Beneficios } from '@/components/landing/Beneficios'
import { Testimonios } from '@/components/landing/Testimonios'
import { Footer } from '@/components/landing/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Marquee />
      <Productos />
      <Beneficios />
      <Testimonios />
      <Footer />
    </main>
  )
}
