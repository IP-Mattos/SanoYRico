import Image from 'next/image'
import Link from 'next/link'
import { CreditCard, MapPin, Truck } from 'lucide-react'
import { type HeroConfig, type PagosConfig, DEFAULT_CONFIG } from '@/lib/site-config'
import { iconFor } from './icons'

export function Hero({
  config = DEFAULT_CONFIG.hero,
  pagos = DEFAULT_CONFIG.pagos
}: {
  config?: HeroConfig
  pagos?: PagosConfig
}) {
  // Hechos ya presentes en el copy del sitio; Mercado Pago solo si está activo en la configuración
  const CONFIANZA = [
    { icon: Truck, texto: 'Envíos a todo Uruguay' },
    ...(pagos.mercadopago?.activo ? [{ icon: CreditCard, texto: 'Pagá con Mercado Pago' }] : []),
    { icon: MapPin, texto: 'Hecho en Uruguay' }
  ]
  return (
    <section className='pt-16'>
      <div className='container-x grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 items-center py-10 lg:py-8'>
        {/* Texto */}
        <div className='flex flex-col max-w-2xl mx-auto lg:mx-0 w-full'>
          {/* Logo visible solo en mobile/tablet (desktop lo muestra la columna derecha) */}
          <div className='lg:hidden flex justify-center mb-6 animate-fadeup'>
            <Image
              src='/logo-sano-y-rico.png'
              alt='Sano y Rico'
              width={1157}
              height={1157}
              priority
              className='w-28 sm:w-36 h-auto filter-[drop-shadow(0_14px_18px_rgba(61,43,31,0.28))_drop-shadow(0_6px_8px_rgba(61,43,31,0.16))]'
            />
          </div>

          <div className='inline-flex items-center gap-2 bg-[#f0e6d3] border border-[#c47c2b]/30 text-[#7a4e14] text-[10.5px] sm:text-xs font-semibold tracking-[0.05em] sm:tracking-[0.14em] uppercase px-3.5 sm:px-4 py-2 rounded-full w-fit mb-6 animate-fadeup'>
            {config.badge}
          </div>

          <h1
            className='text-[3.25rem] sm:text-7xl xl:text-[5rem] font-extrabold text-[#3d2b1f] leading-[0.98] tracking-[-0.03em] mb-6 animate-fadeup'
            style={{ fontFamily: 'var(--display)' }}
          >
            {config.titulo} <em className='text-[#c47c2b] pr-1'>{config.tituloDestacado}</em>{' '}
            <br />
            {config.tituloCierre}
          </h1>

          <p className='text-base sm:text-lg text-[#5c4033] leading-relaxed max-w-xl mb-7 text-pretty animate-fadeup'>
            {config.subtitulo}
          </p>

          <div className='flex gap-3 flex-wrap mb-8 animate-fadeup'>
            <Link
              href='#productos'
              className='inline-flex items-center justify-center min-h-12 bg-[#3d2b1f] text-[#faf6ef] px-8 rounded-full text-[15px] font-semibold shadow-[0_12px_24px_-12px_rgba(61,43,31,0.7)] hover:bg-[#c47c2b] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all'
            >
              Ver productos
            </Link>
            <Link
              href='#beneficios'
              className='inline-flex items-center justify-center min-h-12 border-2 border-[#3d2b1f] text-[#3d2b1f] px-8 rounded-full text-[15px] font-semibold hover:bg-[#f0e6d3] active:scale-[0.98] transition-all'
            >
              Conocer más
            </Link>
          </div>

          {/* Stats */}
          <dl className='grid grid-cols-3 max-w-lg border-t border-[#3d2b1f]/15 pt-6 divide-x divide-[#3d2b1f]/10'>
            {config.stats.map((s, i) => (
              <div key={s.label} className={`flex flex-col ${i === 0 ? 'pr-3 sm:pr-6' : 'px-3 sm:px-6'}`}>
                <dd
                  className='text-3xl sm:text-4xl font-extrabold text-[#3d2b1f] leading-none order-first'
                  style={{ fontFamily: 'var(--display)' }}
                >
                  {s.valor}
                </dd>
                <dt className='text-[11px] text-[#6e5746] uppercase tracking-wider mt-2 leading-snug'>{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual — solo desktop. Logo centrado y tags alineados en una grilla debajo (sin superposiciones) */}
        <div className='hidden lg:flex flex-col rounded-3xl bg-[radial-gradient(ellipse_at_50%_40%,#fbefd6_0%,#f0e6d3_60%,#e8d6b8_100%)] border border-[#c47c2b]/15 shadow-[var(--shadow-card)] overflow-hidden self-stretch max-h-[36rem]'>
          <div className='relative flex-1 flex items-center justify-center py-10'>
            <div className='absolute w-[24rem] h-[24rem] rounded-full border border-[#c47c2b]/20' />
            <div className='absolute w-[32rem] h-[32rem] rounded-full border border-[#c47c2b]/10' />
            <Image
              src='/logo-sano-y-rico.png'
              alt='Sano y Rico'
              width={1157}
              height={1157}
              priority
              className='relative w-72 xl:w-80 h-auto filter-[drop-shadow(0_25px_35px_rgba(61,43,31,0.35))_drop-shadow(0_10px_15px_rgba(61,43,31,0.2))]'
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
      <div className='border-y border-[#eadfce] bg-white/60'>
        <ul className='container-x grid grid-cols-1 sm:grid-cols-3 gap-y-3 py-4 list-none'>
          {CONFIANZA.map(({ icon: Icon, texto }) => (
            <li key={texto} className='flex items-center sm:justify-center gap-2.5 text-sm font-medium text-[#5c4033]'>
              <Icon className='h-[18px] w-[18px] text-[#8a5a1a]' strokeWidth={1.75} aria-hidden='true' />
              {texto}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
