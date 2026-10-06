import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { type HeroConfig, type PagosConfig, DEFAULT_CONFIG } from '@/lib/site-config'
import { iconFor } from './icons'
import { CountUp } from './CountUp'
import { ReadMore } from './ReadMore'
import { TrustRow, type TrustKind } from './TrustRow'

export function Hero({
  config = DEFAULT_CONFIG.hero,
  pagos = DEFAULT_CONFIG.pagos
}: {
  config?: HeroConfig
  pagos?: PagosConfig
}) {
  // Hechos ya presentes en el copy del sitio; Mercado Pago solo si está activo en la configuración
  const CONFIANZA: { kind: TrustKind; texto: string }[] = [
    { kind: 'envio', texto: 'Envíos a todo Uruguay' },
    ...(pagos.mercadopago?.activo ? [{ kind: 'pago' as const, texto: 'Pagá con Mercado Pago' }] : []),
    { kind: 'origen', texto: 'Hecho en Uruguay' }
  ]
  return (
    <section className='pt-16'>
      <div className='container-x grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 items-center pt-6 pb-8 sm:py-10 lg:py-8'>
        {/* Texto */}
        <div className='flex flex-col max-w-2xl mx-auto lg:mx-0 w-full'>
          {/* Logo visible solo en mobile/tablet (desktop lo muestra la columna derecha) */}
          {/* El logo es la cara de la marca: protagonista también en mobile */}
          {/* Mismo marco que el panel de desktop: fondo cálido, borde suave y anillos concéntricos */}
          <div className='lg:hidden flex flex-col overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_50%_35%,#fbefd6_0%,#f0e6d3_60%,#e8d6b8_100%)] border border-[#c47c2b]/20 shadow-(--shadow-card) mb-6 sm:mb-8'>
            <div className='relative flex justify-center items-center pt-8 pb-6 sm:pt-10'>
              <div className='absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-[#c47c2b]/25 animate-breathe' aria-hidden='true' />
              <div className='absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-[#c47c2b]/12 animate-breathe [animation-delay:-3.5s]' aria-hidden='true' />
              <div className='relative animate-float-soft'>
                <Image
                  src='/logo-sano-y-rico-v2.png'
                  alt='Sano y Rico'
                  width={1157}
                  height={1157}
                  priority
                  className='w-48 sm:w-60 h-auto filter-[drop-shadow(0_18px_24px_rgba(61,43,31,0.30))_drop-shadow(0_6px_8px_rgba(61,43,31,0.16))]'
                />
              </div>
            </div>
            {/* Mismos tags que el panel de desktop, para que el logo no quede solo */}
            <ul className='relative grid grid-cols-2 gap-2 px-3 pb-3 list-none'>
              {config.tags.slice(0, 4).map((t, i) => {
                const Icon = iconFor(t.texto, i)
                return (
                  <li
                    key={i}
                    className='flex items-center gap-2 bg-white/90 rounded-full pl-3 pr-3 min-h-10 text-[12.5px] font-semibold text-[#3d2b1f] shadow-[0_1px_2px_rgba(61,43,31,0.06)]'
                  >
                    <Icon className='h-4 w-4 shrink-0 text-[#8a5a1a]' strokeWidth={1.75} aria-hidden='true' />
                    <span className='leading-tight'>{t.texto}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className='flex items-center justify-center text-center gap-2 bg-[#f0e6d3] border border-[#c47c2b]/30 text-[#7a4e14] text-[10.5px] sm:text-xs font-semibold tracking-[0.05em] sm:tracking-[0.14em] uppercase px-3.5 sm:px-4 py-2 rounded-full w-fit max-w-full mx-auto lg:mx-0 mb-5 sm:mb-6 animate-fadeup' style={{ '--i': 0 } as React.CSSProperties}>
            {config.badge}
          </div>

          <h1
            className='text-[2.75rem] min-[400px]:text-5xl sm:text-7xl xl:text-[5rem] font-extrabold text-[#3d2b1f] leading-[1] sm:leading-[0.98] tracking-[-0.03em] mb-4 sm:mb-6 text-center lg:text-left animate-fadeup'
            style={{ fontFamily: 'var(--display)', '--i': 1 } as React.CSSProperties}
          >
            {config.titulo} <em className='accent-word text-[#c47c2b] pr-1'>{config.tituloDestacado}</em>{' '}
            <br />
            {config.tituloCierre}
          </h1>

          <ReadMore className='text-[15px] sm:text-lg text-[#5c4033] leading-[1.6] sm:leading-relaxed max-w-xl mb-5 sm:mb-7 text-pretty text-center lg:text-left animate-fadeup'>
            {config.subtitulo}
          </ReadMore>

          <div className='grid grid-cols-2 sm:flex sm:justify-center lg:justify-start gap-3 mb-8 animate-fadeup' style={{ '--i': 3 } as React.CSSProperties}>
            <Link
              href='#productos'
              className='group inline-flex items-center justify-center gap-2 min-h-12 bg-[#3d2b1f] text-[#faf6ef] px-4 sm:px-8 rounded-full text-[15px] font-semibold shadow-[0_12px_24px_-12px_rgba(61,43,31,0.7)] hover:bg-[#c47c2b] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all'
            >
              Ver productos
              <ArrowRight className='h-4 w-4 transition-transform duration-300 group-hover:translate-x-1' strokeWidth={2} aria-hidden='true' />
            </Link>
            <Link
              href='#beneficios'
              className='inline-flex items-center justify-center min-h-12 border-2 border-[#3d2b1f] text-[#3d2b1f] px-4 sm:px-8 rounded-full text-[15px] font-semibold hover:bg-[#f0e6d3] active:scale-[0.98] transition-all'
            >
              Conocer más
            </Link>
          </div>

          {/* Stats */}
          <dl className='grid grid-cols-3 w-full max-w-lg mx-auto lg:mx-0 border-t border-[#3d2b1f]/15 pt-6 divide-x divide-[#3d2b1f]/10 animate-fadeup' style={{ '--i': 4 } as React.CSSProperties}>
            {config.stats.map((s, i) => (
              <div key={s.label} className={`flex flex-col ${i === 0 ? 'pr-2 sm:pr-6' : 'px-2 sm:px-6'}`}>
                <dd
                  className='text-[1.75rem] sm:text-4xl font-extrabold text-[#3d2b1f] leading-none order-first'
                  style={{ fontFamily: 'var(--display)' }}
                >
                  <CountUp valor={s.valor} />
                </dd>
                <dt className='text-[10.5px] sm:text-[11px] text-[#6e5746] uppercase tracking-wider mt-2 leading-snug'>{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual — solo desktop. Logo centrado y tags alineados en una grilla debajo (sin superposiciones) */}
        <div className='hidden lg:flex flex-col rounded-3xl bg-[radial-gradient(ellipse_at_50%_40%,#fbefd6_0%,#f0e6d3_60%,#e8d6b8_100%)] border border-[#c47c2b]/15 shadow-[var(--shadow-card)] overflow-hidden self-stretch max-h-[36rem]'>
          <div className='relative flex-1 flex items-center justify-center py-10'>
            <div className='absolute w-[24rem] h-[24rem] rounded-full border border-[#c47c2b]/20 animate-breathe' />
            <div className='absolute w-[32rem] h-[32rem] rounded-full border border-[#c47c2b]/10 animate-breathe [animation-delay:-3.5s]' />
            <Image
              src='/logo-sano-y-rico-v2.png'
              alt='Sano y Rico'
              width={1157}
              height={1157}
              priority
              className='relative w-72 xl:w-80 h-auto animate-float-soft filter-[drop-shadow(0_25px_35px_rgba(61,43,31,0.35))_drop-shadow(0_10px_15px_rgba(61,43,31,0.2))]'
            />
          </div>
          <ul className='grid grid-cols-2 gap-2 p-4 list-none'>
            {config.tags.slice(0, 4).map((t, i) => {
              const Icon = iconFor(t.texto, i)
              return (
                <li
                  key={i}
                  className='flex items-center gap-2.5 bg-white/90 rounded-full pl-3 pr-4 min-h-11 text-[13px] font-semibold text-[#3d2b1f] shadow-[0_1px_2px_rgba(61,43,31,0.06)]'
                >
                  <Icon className='h-4 w-4 shrink-0 text-[#8a5a1a]' strokeWidth={1.75} aria-hidden='true' />
                  <span className='leading-tight'>{t.texto}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Fila de confianza */}
      <TrustRow items={CONFIANZA} />
    </section>
  )
}
