import { type ComoFuncionaConfig, DEFAULT_CONFIG } from '@/lib/site-config'
import { iconFor } from './icons'

export function ComoFunciona({ config = DEFAULT_CONFIG.comoFunciona }: { config?: ComoFuncionaConfig }) {
  const pasos = config.pasos ?? []

  return (
    <section className='section-y bg-white border-y border-[#eadfce]'>
      <div className='container-x'>
        <div className='reveal'>
          <p className='eyebrow'>Cómo funciona</p>
          <h2 className='section-title'>{config.titulo}</h2>
          <p className='section-lead mb-12 sm:mb-14'>{config.subtitulo}</p>
        </div>

        <ol className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 list-none'>
          {pasos.map((p, i) => {
            const Icon = iconFor(`${p.titulo} ${p.descripcion}`, i)
            return (
              <li key={i} className='reveal card card-hover p-6 sm:p-8 bg-[#faf6ef]!'>
                <div className='flex items-center justify-between mb-6'>
                  <span className='icon-chip bg-white!'>
                    <Icon className='h-5 w-5' strokeWidth={1.75} aria-hidden='true' />
                  </span>
                  <span
                    className='text-5xl font-extrabold text-[#c47c2b]/30 leading-none select-none'
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
            )
          })}
        </ol>
      </div>
    </section>
  )
}
