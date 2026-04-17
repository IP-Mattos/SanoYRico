import { type FaqsConfig, DEFAULT_CONFIG } from '@/lib/site-config'

export function Faqs({ config = DEFAULT_CONFIG.faqs }: { config?: FaqsConfig }) {
  const items = config.items ?? []

  return (
    <section className='py-16 sm:py-24 px-6 sm:px-10 lg:px-16'>
      <div className='max-w-3xl mx-auto'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#8a5a1a] mb-3'>Preguntas frecuentes</p>
        <h2 className='text-3xl sm:text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-10' style={{ fontFamily: 'Georgia, serif' }}>
          {config.titulo}
          {config.tituloDestacado && (
            <>
              <br />
              <span className='text-[#c47c2b] italic'>{config.tituloDestacado}</span>
            </>
          )}
        </h2>

        <div className='space-y-3'>
          {items.map((f, i) => (
            <details
              key={i}
              className='group bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden [&_summary::-webkit-details-marker]:hidden'
            >
              <summary className='flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none hover:bg-[#faf6ef] transition-colors'>
                <span className='text-sm sm:text-base font-semibold text-[#3d2b1f]'>{f.pregunta}</span>
                <span
                  className='shrink-0 w-7 h-7 rounded-full bg-[#f0e6d3] text-[#c47c2b] flex items-center justify-center font-bold transition-transform duration-300 group-open:rotate-45'
                  aria-hidden='true'
                >
                  +
                </span>
              </summary>
              <div className='px-5 pb-5 pt-0 text-sm text-[#5c4033] leading-relaxed whitespace-pre-line'>{f.respuesta}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
