import Image from 'next/image'
import Link from 'next/link'
import { type HeroConfig, DEFAULT_CONFIG } from '@/lib/site-config'

const TAG_POSITIONS = [
  'top-[20%] left-[5%]',
  'top-[15%] right-[8%]',
  'bottom-[25%] left-[8%]',
  'bottom-[20%] right-[5%]'
]
const TAG_DELAYS = ['0s', '0.5s', '1s', '0.3s']

export function Hero({ config = DEFAULT_CONFIG.hero }: { config?: HeroConfig }) {
  return (
    <section className='min-h-screen grid lg:grid-cols-2 pt-16'>
      {/* Izquierda */}
      <div className='flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-16 max-w-2xl mx-auto w-full lg:max-w-none lg:mx-0'>
        {/* Logo visible solo en mobile/tablet (desktop lo muestra la columna derecha) */}
        <div className='lg:hidden flex justify-center mb-8 animate-fadeup'>
          <Image
            src='/logo-sano-y-rico.png'
            alt='Sano y Rico'
            width={1157}
            height={1157}
            priority
            className='w-40 sm:w-48 h-auto animate-float filter-[drop-shadow(0_18px_25px_rgba(61,43,31,0.3))_drop-shadow(0_8px_12px_rgba(61,43,31,0.18))]'
          />
        </div>

        <div className='inline-flex items-center gap-2 bg-[#f0e6d3] border border-[#c47c2b]/30 text-[#8a5a1a] text-xs font-medium tracking-widest uppercase px-4 py-2 rounded-full w-fit mb-6 animate-fadeup'>
          {config.badge}
        </div>

        <h1
          className='text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-[#3d2b1f] leading-tight mb-5'
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {config.titulo} <em className='text-[#c47c2b]'>{config.tituloDestacado}</em>{' '}
          <br />
          {config.tituloCierre}
        </h1>

        <p className='text-base sm:text-lg text-[#5c4033] leading-relaxed max-w-md mb-8 font-light'>
          {config.subtitulo}
        </p>

        <div className='flex gap-3 flex-wrap mb-10'>
          <Link
            href='#productos'
            className='bg-[#3d2b1f] text-[#faf6ef] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#c47c2b] transition-colors'
          >
            Ver productos
          </Link>
          <Link
            href='#beneficios'
            className='border-2 border-[#3d2b1f] text-[#3d2b1f] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#f0e6d3] transition-colors'
          >
            Conocer más
          </Link>
        </div>

        {/* Stats */}
        <div className='flex flex-wrap gap-6 sm:gap-8 pt-6 border-t border-[#3d2b1f]/10'>
          {config.stats.map((s) => (
            <div key={s.label}>
              <div className='text-xl sm:text-2xl font-bold text-[#3d2b1f]' style={{ fontFamily: 'Georgia, serif' }}>
                {s.valor}
              </div>
              <div className='text-xs text-[#5c4033] uppercase tracking-wider mt-0.5'>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Derecha — solo desktop */}
      <div className='hidden lg:flex relative bg-[#f0e6d3] items-center justify-center overflow-hidden'>
        <div className='absolute w-96 h-96 rounded-full bg-[#c47c2b]/10 blur-3xl' />

        {config.tags.slice(0, 4).map((t, i) => (
          <div
            key={i}
            className={`absolute ${TAG_POSITIONS[i]} bg-white rounded-full px-4 py-2 text-sm font-medium text-[#3d2b1f] shadow-md animate-float`}
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
    </section>
  )
}
