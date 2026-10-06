import Image from 'next/image'
import Link from 'next/link'
import { type HeroConfig, DEFAULT_CONFIG } from '@/lib/site-config'

const TAG_POSITIONS = [
  'top-[18%] left-[6%]',
  'top-[13%] right-[7%]',
  'bottom-[24%] left-[7%]',
  'bottom-[17%] right-[6%]'
]
const TAG_DELAYS = ['0s', '0.5s', '1s', '0.3s']

export function Hero({ config = DEFAULT_CONFIG.hero }: { config?: HeroConfig }) {
  return (
    <section className='lg:min-h-[100dvh] grid lg:grid-cols-[1.05fr_0.95fr] pt-16'>
      {/* Izquierda */}
      <div className='flex flex-col justify-center px-6 sm:px-10 lg:pl-16 lg:pr-12 xl:pl-24 pt-8 pb-12 lg:py-16 max-w-2xl mx-auto w-full lg:max-w-none lg:mx-0'>
        {/* Logo visible solo en mobile/tablet (desktop lo muestra la columna derecha) */}
        <div className='lg:hidden flex justify-center mb-5 animate-fadeup'>
          <Image
            src='/logo-sano-y-rico.png'
            alt='Sano y Rico'
            width={1157}
            height={1157}
            priority
            className='w-28 sm:w-40 h-auto animate-float filter-[drop-shadow(0_14px_18px_rgba(61,43,31,0.28))_drop-shadow(0_6px_8px_rgba(61,43,31,0.16))]'
          />
        </div>

        <div className='inline-flex items-center gap-2 bg-[#f0e6d3] border border-[#c47c2b]/30 text-[#7a4e14] text-[10.5px] sm:text-xs font-semibold tracking-[0.05em] sm:tracking-[0.14em] uppercase px-3.5 sm:px-4 py-2 rounded-full w-fit mb-6 animate-fadeup'>
          {config.badge}
        </div>

        <h1
          className='text-[2.5rem] sm:text-6xl xl:text-7xl font-extrabold text-[#3d2b1f] leading-[1.02] tracking-[-0.025em] mb-6 animate-fadeup'
          style={{ fontFamily: 'var(--display)' }}
        >
          {config.titulo} <em className='text-[#c47c2b] pr-1'>{config.tituloDestacado}</em>{' '}
          <br />
          {config.tituloCierre}
        </h1>

        <p className='text-[15px] sm:text-lg text-[#5c4033] leading-relaxed max-w-xl mb-8 text-pretty animate-fadeup'>
          {config.subtitulo}
        </p>

        <div className='flex gap-3 flex-wrap mb-10 animate-fadeup'>
          <Link
            href='#productos'
            className='inline-flex items-center justify-center min-h-12 bg-[#3d2b1f] text-[#faf6ef] px-7 rounded-full text-[15px] font-semibold shadow-[0_10px_24px_-10px_rgba(61,43,31,0.6)] hover:bg-[#c47c2b] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all'
          >
            Ver productos
          </Link>
          <Link
            href='#beneficios'
            className='inline-flex items-center justify-center min-h-12 border-2 border-[#3d2b1f] text-[#3d2b1f] px-7 rounded-full text-[15px] font-semibold hover:bg-[#f0e6d3] active:scale-[0.98] transition-all'
          >
            Conocer más
          </Link>
        </div>

        {/* Stats */}
        <dl className='grid grid-cols-3 max-w-lg border-t border-[#3d2b1f]/15 pt-6 divide-x divide-[#3d2b1f]/10'>
          {config.stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col ${i === 0 ? 'pr-3 sm:pr-5' : 'px-3 sm:px-5'}`}>
              <dd
                className='text-2xl sm:text-3xl font-extrabold text-[#3d2b1f] leading-none order-first'
                style={{ fontFamily: 'var(--display)' }}
              >
                {s.valor}
              </dd>
              <dt className='text-[11px] text-[#6e5746] uppercase tracking-wider mt-2 leading-snug'>{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Derecha — solo desktop */}
      <div className='hidden lg:block p-5 pl-0'>
        <div className='relative h-full min-h-[560px] rounded-3xl bg-[#f0e6d3] bg-[radial-gradient(ellipse_at_50%_45%,#fbefd6_0%,#f0e6d3_55%,#e8d6b8_100%)] flex items-center justify-center overflow-hidden border border-[#c47c2b]/15'>
          {/* anillos concéntricos detrás del logo */}
          <div className='absolute w-[26rem] h-[26rem] rounded-full border border-[#c47c2b]/20' />
          <div className='absolute w-[34rem] h-[34rem] rounded-full border border-[#c47c2b]/10' />
          <div className='absolute w-80 h-80 rounded-full bg-[#c47c2b]/15 blur-3xl' />

          {config.tags.slice(0, 4).map((t, i) => (
            <div
              key={i}
              className={`absolute ${TAG_POSITIONS[i]} z-20 bg-white/95 rounded-full px-4 py-2 text-sm font-semibold text-[#3d2b1f] shadow-[0_10px_24px_-12px_rgba(61,43,31,0.45)] animate-float`}
              style={{ animationDelay: TAG_DELAYS[i] }}
            >
              {t.emoji} {t.texto}
            </div>
          ))}

          <Image
            src='/logo-sano-y-rico.png'
            alt='Sano y Rico'
            width={1157}
            height={1157}
            priority
            className='w-80 xl:w-96 h-auto animate-float z-10 filter-[drop-shadow(0_25px_35px_rgba(61,43,31,0.35))_drop-shadow(0_10px_15px_rgba(61,43,31,0.2))]'
          />
        </div>
      </div>
    </section>
  )
}
