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
    <section id='opiniones' className='py-16 sm:py-24 px-6 sm:px-10 lg:px-16 bg-[#f0e6d3]'>
      <div className='max-w-7xl mx-auto'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#8a5a1a] mb-3'>Opiniones</p>
        <h2 className='text-3xl sm:text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-3' style={{ fontFamily: 'Georgia, serif' }}>
          Los que ya las{' '}
          <br />
          probaron, nos cuentan
        </h2>
        <p className='text-[#5c4033] text-base sm:text-lg font-light mb-10'>
          {subtitulo}
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {visibles.map((t, i) => (
            <div key={i} className='bg-[#faf6ef] rounded-2xl p-5 sm:p-6 border border-[#f0e6d3]'>
              <Estrellas cantidad={t.estrellas} />
              <p className='text-[#3d2b1f] italic leading-relaxed mb-5 text-sm sm:text-base' style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{t.texto}&rdquo;
              </p>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-[#f0e6d3] flex items-center justify-center text-xl shrink-0'>
                  {t.avatar}
                </div>
                <div>
                  <div className='text-sm font-medium text-[#3d2b1f]'>{t.nombre}</div>
                  <div className='text-xs text-[#5c4033]'>{t.lugar}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
