import { type TestimonioItem, DEFAULT_CONFIG } from '@/lib/site-config'

function Estrellas({ cantidad = 5 }: { cantidad?: number }) {
  const n = Math.min(5, Math.max(0, Math.round(cantidad)))
  return (
    <div className='flex gap-0.5 mb-4' aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-lg ${i < n ? 'text-[#c47c2b]' : 'text-[#e5d5b9]'}`} aria-hidden='true'>
          ★
        </span>
      ))}
    </div>
  )
}

export function Testimonios({
  items = DEFAULT_CONFIG.testimonios,
  clientesFelices
}: {
  items?: TestimonioItem[]
  /** Valor del stat "Clientes felices" del hero, para sincronizar el subtítulo */
  clientesFelices?: string
}) {
  // Filtramos testimonios sin texto para no mostrar cards con comillas vacías.
  const visibles = items.filter((t) => t.texto?.trim().length > 0)
  if (visibles.length === 0) return null

  // Si vino el stat del hero, armamos el subtítulo dinámico; si no, fallback neutro.
  const subtitulo = clientesFelices
    ? `Más de ${clientesFelices} personas ya cambiaron sus snacks por algo mejor.`
    : 'Personas como vos ya cambiaron sus snacks por algo mejor.'

  return (
    <section id='opiniones' className='py-20 sm:py-28 px-6 sm:px-10 lg:px-16 bg-[#f0e6d3] scroll-mt-16'>
      <div className='max-w-7xl mx-auto'>
        <div className='reveal'>
          <p className='eyebrow'>Opiniones</p>
          <h2 className='section-title'>
            Los que ya las{' '}
            <br className='hidden sm:block' />
            probaron, nos cuentan
          </h2>
          <p className='section-lead mb-12'>{subtitulo}</p>
        </div>

        {/* Columnas tipo masonry: absorben cualquier cantidad de testimonios sin dejar huecos */}
        <div className='columns-1 md:columns-2 lg:columns-3 gap-4'>
          {visibles.map((t, i) => (
            <figure
              key={i}
              className='break-inside-avoid mb-4 bg-[#faf6ef] rounded-2xl p-5 sm:p-6 border border-[#e6d6bb] shadow-[0_14px_28px_-24px_rgba(61,43,31,0.45)]'
            >
              <Estrellas cantidad={t.estrellas} />
              <blockquote
                className='text-[#3d2b1f] leading-relaxed mb-5 text-[15px] sm:text-base'
                style={{ fontFamily: 'var(--display)' }}
              >
                &ldquo;{t.texto}&rdquo;
              </blockquote>
              <figcaption className='flex items-center gap-3 pt-4 border-t border-[#3d2b1f]/10'>
                <div className='w-10 h-10 rounded-full bg-[#f0e6d3] flex items-center justify-center text-xl shrink-0'>
                  {t.avatar}
                </div>
                <div>
                  <div className='text-sm font-semibold text-[#3d2b1f]'>{t.nombre}</div>
                  <div className='text-xs text-[#6e5746]'>{t.lugar}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
