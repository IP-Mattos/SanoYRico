'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { CreditCard, MapPin, Truck } from 'lucide-react'

export type TrustKind = 'envio' | 'pago' | 'origen'

const ICONS = { envio: Truck, pago: CreditCard, origen: MapPin } as const

// Fila de confianza. Sin JS (o con reduced-motion) los íconos se ven completos y quietos;
// con JS se marcan "ready" antes del primer paint y "in" cuando la fila entra en pantalla,
// que dispara el dibujado de los íconos (ver globals.css).
export function TrustRow({ items }: { items: { kind: TrustKind; texto: string }[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.setAttribute('data-ready', '')
    return () => el.removeAttribute('data-ready')
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute('data-in', '')
          io.disconnect()
        }
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className='trust-row border-y border-[#eadfce] bg-white/60'>
      {/* Flex centrado con divisores: queda parejo con 2 o 3 ítems (Mercado Pago es opcional) */}
      <ul className='container-x relative z-10 flex flex-row flex-wrap justify-center items-center gap-x-5 gap-y-2.5 sm:gap-0 py-4 list-none'>
        {items.map(({ kind, texto }, i) => {
          const Icon = ICONS[kind]
          return (
            <li
              key={kind}
              data-kind={kind}
              style={{ ['--i' as string]: i }}
              className='trust-item flex items-center gap-2.5 text-[13px] sm:text-sm font-medium text-[#5c4033] sm:px-10 sm:not-first:border-l sm:border-[#eadfce]'
            >
              <Icon className='trust-icon h-[18px] w-[18px] text-[#8a5a1a]' strokeWidth={1.75} aria-hidden='true' />
              {texto}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
