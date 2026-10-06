import { type FaqsConfig, DEFAULT_CONFIG } from '@/lib/site-config'

export function Faqs({ config = DEFAULT_CONFIG.faqs }: { config?: FaqsConfig }) {
  const items = config.items ?? []

  return (
    <section className='section-y'>
      <div className='container-x max-w-4xl!'>
        <div className='reveal'>
          <p className='eyebrow'>Preguntas frecuentes</p>
          <h2 className='section-title mb-10!'>
            {config.titulo}
            {config.tituloDestacado && (
              <>
                <br />
                <span className='text-[#c47c2b] italic pr-1'>{config.tituloDestacado}</span>
              </>
            )}
          </h2>
        </div>

        <div className='space-y-3'>
          {items.map((f, i) => (
            <details
              key={i}
              className='group card overflow-hidden open:border-[#c47c2b]/45 transition-[border-color,box-shadow] [&_summary::-webkit-details-marker]:hidden'
            >
              <summary className='flex items-center justify-between gap-4 px-5 min-h-16 py-4 cursor-pointer list-none hover:bg-[#faf6ef] focus-visible:bg-[#faf6ef] transition-colors'>
                <span className='text-[15px] sm:text-base font-semibold text-[#3d2b1f] leading-snug'>{f.pregunta}</span>
                <span
                  className='shrink-0 w-8 h-8 rounded-full bg-[#f0e6d3] text-[#8a5a1a] text-lg leading-none flex items-center justify-center font-bold transition-transform duration-300 group-open:rotate-45 group-open:bg-[#3d2b1f] group-open:text-white'
                  aria-hidden='true'
                >
                  +
                </span>
              </summary>
              <div className='px-5 pb-5 pt-0 text-[15px] text-[#5c4033] leading-relaxed whitespace-pre-line max-w-[62ch]'>
                {f.respuesta}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
