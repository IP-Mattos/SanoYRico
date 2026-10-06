'use client'

import { useEffect, useRef } from 'react'

// Cuenta desde 0 hasta el número del valor ("13", "1,1K", "0g") cuando entra en pantalla.
// El HTML del servidor ya trae el valor final (sin JS o con reduced-motion no cambia nada).
export function CountUp({ valor, delay = 600 }: { valor: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const m = valor.match(/^(\d+(?:[.,]\d+)?)(.*)$/)
    if (!m) return
    const sep = m[1].includes(',') ? ',' : '.'
    const dec = m[1].split(/[.,]/)[1]?.length ?? 0
    const objetivo = parseFloat(m[1].replace(',', '.'))
    const sufijo = m[2]
    if (!(objetivo > 0)) return

    const fmt = (n: number) => n.toFixed(dec).replace('.', sep) + sufijo
    el.textContent = fmt(0)

    let raf = 0
    let timer = 0
    const correr = () => {
      const t0 = performance.now()
      const dur = 1300
      const paso = (now: number) => {
        const k = Math.min(1, (now - t0) / dur)
        const eased = 1 - Math.pow(1 - k, 3)
        el.textContent = fmt(objetivo * eased)
        if (k < 1) raf = requestAnimationFrame(paso)
        else el.textContent = valor
      }
      raf = requestAnimationFrame(paso)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          timer = window.setTimeout(correr, delay)
        }
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      el.textContent = valor
    }
  }, [valor, delay])

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
      {valor}
    </span>
  )
}
