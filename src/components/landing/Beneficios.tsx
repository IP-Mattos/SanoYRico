import { type BeneficioItem, DEFAULT_CONFIG } from '@/lib/site-config'
import { iconFor } from './icons'

export function Beneficios({ items = DEFAULT_CONFIG.beneficios }: { items?: BeneficioItem[] }) {
  return (
    <section id='beneficios' className='bg-[#3d2b1f] section-y scroll-mt-16'>
      <div className='container-x'>
        <div className='reveal'>
          <p className='eyebrow eyebrow-light'>Por qué elegirnos</p>
          <h2 className='section-title text-white!'>
            Todo lo bueno,{' '}
            <br className='hidden sm:block' />
            nada de lo malo
          </h2>
          <p className='section-lead mb-14 text-white/75!'>
            Fabricamos cada producto con un único compromiso: que sea genuinamente bueno para vos.
          </p>
        </div>

        {/* Grilla editorial sin cajas: ícono + título + texto separados por una línea superior */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10'>
          {items.map((item, i) => {
            const Icon = iconFor(`${item.titulo} ${item.descripcion}`, i)
            return (
              <div key={i} className='reveal border-t border-white/15 pt-6'>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8a832]/15 text-[#e8a832] mb-4'>
                  <Icon className='h-5 w-5' strokeWidth={1.75} aria-hidden='true' />
                </span>
                <h3 className='text-white text-lg font-bold mb-2 leading-snug' style={{ fontFamily: 'var(--display)' }}>
                  {item.titulo}
                </h3>
                <p className='text-white/75 text-sm leading-relaxed'>{item.descripcion}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
