import { type BeneficioItem, DEFAULT_CONFIG } from '@/lib/site-config'

export function Beneficios({ items = DEFAULT_CONFIG.beneficios }: { items?: BeneficioItem[] }) {
  return (
    <section id='beneficios' className='bg-[#3d2b1f] py-20 sm:py-28 px-6 sm:px-10 lg:px-16 scroll-mt-16'>
      <div className='max-w-7xl mx-auto'>
        <div className='reveal'>
          <p className='eyebrow eyebrow-light'>Por qué elegirnos</p>
          <h2 className='section-title text-white!'>
            Todo lo bueno,{' '}
            <br className='hidden sm:block' />
            nada de lo malo
          </h2>
          <p className='section-lead mb-12 text-white/75!'>
            Fabricamos cada producto con un único compromiso: que sea genuinamente bueno para vos.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4'>
          {items.map((item, i) => (
            <div
              key={i}
              className='reveal bg-white/[0.04] border border-white/10 rounded-2xl p-5 sm:p-6 hover:bg-white/[0.07] hover:border-[#e8a832]/50 transition-colors'
            >
              <div className='min-w-14 h-14 w-fit px-3 rounded-2xl bg-[#faf6ef]/10 flex items-center justify-center text-3xl mb-5'>
                {item.icono}
              </div>
              <h3 className='text-white text-lg font-bold mb-2 leading-snug' style={{ fontFamily: 'var(--display)' }}>
                {item.titulo}
              </h3>
              <p className='text-white/75 text-sm leading-relaxed'>{item.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
