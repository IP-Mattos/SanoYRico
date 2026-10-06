import { type ComoFuncionaConfig, DEFAULT_CONFIG } from '@/lib/site-config'

export function ComoFunciona({ config = DEFAULT_CONFIG.comoFunciona }: { config?: ComoFuncionaConfig }) {
  const pasos = config.pasos ?? []

  return (
    <section className='py-20 sm:py-28 px-6 sm:px-10 lg:px-16 bg-white border-y border-[#efe3d0]'>
      <div className='max-w-7xl mx-auto'>
        <div className='reveal'>
          <p className='eyebrow'>Cómo funciona</p>
          <h2 className='section-title'>{config.titulo}</h2>
          <p className='section-lead mb-12 sm:mb-14'>{config.subtitulo}</p>
        </div>

        <ol className='relative grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 list-none'>
          {/* línea que une los pasos en desktop */}
          <div
            className='hidden md:block absolute top-[3.1rem] left-[8%] right-[8%] border-t-2 border-dashed border-[#c47c2b]/35'
            aria-hidden='true'
          />
          {pasos.map((p, i) => (
            <li
              key={i}
              className='reveal relative bg-[#faf6ef] rounded-2xl p-6 sm:p-7 border border-[#efe3d0] hover:border-[#c47c2b]/50 hover:shadow-[0_18px_36px_-22px_rgba(61,43,31,0.35)] transition-all duration-300'
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='relative w-14 h-14 rounded-2xl bg-linear-to-br from-[#fef3d0] to-[#f0e6d3] ring-4 ring-[#faf6ef] flex items-center justify-center text-3xl'>
                  {p.emoji}
                </div>
                <span
                  className='text-5xl font-extrabold text-[#c47c2b]/35 leading-none select-none'
                  style={{ fontFamily: 'var(--display)' }}
                  aria-hidden='true'
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className='text-xl font-bold text-[#3d2b1f] mb-2 leading-snug' style={{ fontFamily: 'var(--display)' }}>
                {p.titulo}
              </h3>
              <p className='text-[15px] text-[#5c4033] leading-relaxed'>{p.descripcion}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
