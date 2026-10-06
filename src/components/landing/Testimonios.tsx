import { type TestimonioItem, DEFAULT_CONFIG } from '@/lib/site-config'
import { iniciales } from './icons'

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
    <section id='opiniones' className='section-y bg-[#f0e6d3] scroll-mt-16'>
      <div className='container-x'>
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
              className='reveal card break-inside-avoid mb-4 p-6 bg-[#faf6ef]!'
              style={{ '--i': i % 3 } as React.CSSProperties}
            >
              <Estrellas cantidad={t.estrellas} />
              <blockquote
                className='text-[#3d2b1f] leading-relaxed mb-5 text-[15px] sm:text-base'
                style={{ fontFamily: 'var(--display)' }}
              >
                &ldquo;{t.texto}&rdquo;
              </blockquote>
              <figcaption className='flex items-center gap-3 pt-4 border-t border-[#3d2b1f]/10'>
                <div
                  className='w-10 h-10 rounded-full bg-[#3d2b1f] text-[#faf6ef] flex items-center justify-center text-sm font-semibold tracking-wide shrink-0'
                  aria-hidden='true'
                >
                  {iniciales(t.nombre)}
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
