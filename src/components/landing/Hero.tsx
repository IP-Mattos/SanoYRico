import Link from 'next/link'

export function Hero() {
  return (
    <section className='min-h-screen grid lg:grid-cols-2 pt-16'>
      {/* Izquierda */}
      <div className='flex flex-col justify-center px-6 lg:px-16 py-16'>
        <div className='inline-flex items-center gap-2 bg-[#f0e6d3] border border-[#c47c2b]/30 text-[#c47c2b] text-xs font-medium tracking-widest uppercase px-4 py-2 rounded-full w-fit mb-8 animate-fadeup'>
          ✦ 100% Natural · Sin conservantes
        </div>

        <h1
          className='text-5xl lg:text-7xl font-black text-[#3d2b1f] leading-tight mb-6'
          style={{ fontFamily: 'Georgia, serif', animationDelay: '0.1s' }}
        >
          Energía <em className='text-[#c47c2b]'>real</em>
          <br />
          para tu día
        </h1>

        <p className='text-lg text-[#8a7060] leading-relaxed max-w-md mb-8 font-light'>
          Barras de cereal y snacks saludables hechos con ingredientes naturales. Sin azúcar refinada, sin rellenos
          artificiales.
        </p>

        <div className='flex gap-3 flex-wrap mb-12'>
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
        <div className='flex gap-8 pt-6 border-t border-[#3d2b1f]/10'>
          {[
            { num: '18+', label: 'Variedades' },
            { num: '2.4k', label: 'Clientes felices' },
            { num: '0g', label: 'Azúcar refinada' }
          ].map((s) => (
            <div key={s.label}>
              <div className='text-2xl font-bold text-[#3d2b1f]' style={{ fontFamily: 'Georgia, serif' }}>
                {s.num}
              </div>
              <div className='text-xs text-[#8a7060] uppercase tracking-wider mt-0.5'>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Derecha */}
      <div className='hidden lg:flex relative bg-[#f0e6d3] items-center justify-center overflow-hidden'>
        <div className='absolute w-96 h-96 rounded-full bg-[#c47c2b]/10 blur-3xl' />

        {/* Tags flotantes */}
        {[
          { text: '🌾 Avena integral', pos: 'top-[20%] left-[5%]', delay: '0s' },
          { text: '🍯 Miel pura', pos: 'top-[15%] right-[8%]', delay: '0.5s' },
          { text: '💚 Sin gluten', pos: 'bottom-[25%] left-[8%]', delay: '1s' },
          { text: '⚡ Alto en proteína', pos: 'bottom-[20%] right-[5%]', delay: '0.3s' }
        ].map((t) => (
          <div
            key={t.text}
            className={`absolute ${t.pos} bg-white rounded-full px-4 py-2 text-sm font-medium text-[#3d2b1f] shadow-md animate-float`}
            style={{ animationDelay: t.delay }}
          >
            {t.text}
          </div>
        ))}

        <div className='text-[11rem] animate-float z-10 filter drop-shadow-xl'>🌾</div>
      </div>
    </section>
  )
}
