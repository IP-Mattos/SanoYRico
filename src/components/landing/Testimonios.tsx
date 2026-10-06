import { type TestimonioItem, DEFAULT_CONFIG } from '@/lib/site-config'
import { iniciales } from './icons'

function Estrellas({ cantidad = 5 }: { cantidad?: number }) {
  const n = Math.min(5, Math.max(0, Math.round(cantidad)))
  return (
    <div className='flex gap-0.5 mb-3' aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-lg leading-none ${i < n ? 'text-[#c47c2b]' : 'text-[#e5d5b9]'}`} aria-hidden='true'>
          ★
        </span>
      ))}
    </div>
  )
}

// Tarjeta de ancho y alto fijos; el texto se recorta y se completa al pasar el mouse / enfocar (y en title).
function Tarjeta({ t, dup = false, center = false }: { t: TestimonioItem; dup?: boolean; center?: boolean }) {
  return (
    <li
      className={`t-card card bg-[#faf6ef]! p-6 ${dup ? 't-dup' : ''} ${center ? 't-static' : ''}`}
      aria-hidden={dup ? true : undefined}
      tabIndex={dup ? undefined : 0}
      inert={dup}
    >
      <Estrellas cantidad={t.estrellas} />
      <blockquote
        className='t-quote flex-1 min-h-0 text-[#3d2b1f] leading-relaxed text-[15px]'
        style={{ fontFamily: 'var(--display)' }}
        title={t.texto}
      >
        &ldquo;{t.texto}&rdquo;
      </blockquote>
      <div className='flex items-center gap-3 pt-4 mt-3 border-t border-[#3d2b1f]/10'>
        <div
          className='w-10 h-10 rounded-full bg-[#3d2b1f] text-[#faf6ef] flex items-center justify-center text-sm font-semibold tracking-wide shrink-0'
          aria-hidden='true'
        >
          {iniciales(t.nombre)}
        </div>
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-[#3d2b1f] truncate'>{t.nombre}</div>
          <div className='text-xs text-[#6e5746] truncate'>{t.lugar}</div>
        </div>
      </div>
    </li>
  )
}

// Fila de marquee: el conjunto se repite hasta cubrir el ancho y se duplica (aria-hidden) para el loop sin saltos.
function Fila({ items, dir, label }: { items: TestimonioItem[]; dir: 'l' | 'r'; label: string }) {
  const copias = Math.max(1, Math.ceil(6 / items.length))
  const base = Array.from({ length: copias }).flatMap(() => items)
  const dur = `${base.length * 7}s`
  return (
    <div className='t-row hidden md:block' role='region' aria-label={label}>
      <ul className={`t-track t-track-${dir} list-none`} style={{ animationDuration: dur }}>
        {base.map((t, i) => (
          <Tarjeta key={`a${i}`} t={t} dup={i >= items.length} />
        ))}
        {base.map((t, i) => (
          <Tarjeta key={`b${i}`} t={t} dup />
        ))}
      </ul>
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

  const estatico = visibles.length < 4
  const dosFilas = visibles.length >= 8
  const filaA = dosFilas ? visibles.filter((_, i) => i % 2 === 0) : visibles
  const filaB = dosFilas ? visibles.filter((_, i) => i % 2 === 1) : []

  return (
    <section id='opiniones' className='section-y bg-[#f0e6d3] scroll-mt-16 overflow-hidden'>
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
      </div>

      {estatico ? (
        <ul className='container-x flex flex-wrap justify-center gap-4 list-none'>
          {visibles.map((t, i) => (
            <Tarjeta key={i} t={t} center />
          ))}
        </ul>
      ) : (
        <div className='t-fade space-y-4'>
          {/* Mobile: una fila con scroll horizontal nativo y snap */}
          <div className='t-row md:hidden' role='region' aria-label='Opiniones de clientes'>
            <ul className='t-track list-none px-6'>
              {visibles.map((t, i) => (
                <Tarjeta key={i} t={t} />
              ))}
            </ul>
          </div>
          {/* Desktop: marquee de una o dos filas en sentidos opuestos */}
          <Fila items={filaA} dir='l' label='Opiniones de clientes' />
          {filaB.length > 0 && <Fila items={filaB} dir='r' label='Más opiniones de clientes' />}
        </div>
      )}
    </section>
  )
}
