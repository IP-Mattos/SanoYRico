import { type ComoFuncionaConfig, DEFAULT_CONFIG } from '@/lib/site-config'

export function ComoFunciona({ config = DEFAULT_CONFIG.comoFunciona }: { config?: ComoFuncionaConfig }) {
  const pasos = config.pasos ?? []

  return (
    <section className='py-16 sm:py-24 px-6 sm:px-10 lg:px-16 bg-[#faf6ef]'>
      <div className='max-w-7xl mx-auto'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#8a5a1a] mb-3'>Cómo funciona</p>
        <h2 className='text-3xl sm:text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-3' style={{ fontFamily: 'Georgia, serif' }}>
          {config.titulo}
        </h2>
        <p className='text-[#5c4033] text-base sm:text-lg font-light mb-12 max-w-lg'>
          {config.subtitulo}
        </p>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6'>
          {pasos.map((p, i) => (
            <div
              key={i}
              className='relative bg-white rounded-2xl p-6 sm:p-7 border border-[#f0e6d3] hover:border-[#c47c2b]/40 hover:-translate-y-1 transition-all duration-300'
            >
              {/* Número grande de fondo (se calcula a partir del índice) */}
              <span
                className='absolute top-4 right-5 text-6xl font-black text-[#f0e6d3] leading-none select-none pointer-events-none'
                style={{ fontFamily: 'Georgia, serif' }}
                aria-hidden='true'
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className='relative'>
                <div className='w-14 h-14 rounded-2xl bg-linear-to-br from-[#fef3d0] to-[#f0e6d3] flex items-center justify-center text-3xl mb-5'>
                  {p.emoji}
                </div>
                <h3 className='text-xl font-bold text-[#3d2b1f] mb-2' style={{ fontFamily: 'Georgia, serif' }}>
                  {p.titulo}
                </h3>
                <p className='text-sm text-[#5c4033] leading-relaxed'>{p.descripcion}</p>
              </div>

              {i < pasos.length - 1 && (
                <span
                  className='hidden md:block absolute top-1/2 -right-4 lg:-right-5 -translate-y-1/2 text-[#c47c2b]/40 text-2xl z-10'
                  aria-hidden='true'
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
