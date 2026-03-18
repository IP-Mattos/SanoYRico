import { type BeneficioItem, DEFAULT_CONFIG } from '@/lib/site-config'

export function Beneficios({ items = DEFAULT_CONFIG.beneficios }: { items?: BeneficioItem[] }) {
  return (
    <section id='beneficios' className='bg-[#3d2b1f] py-16 sm:py-24 px-6 sm:px-10 lg:px-16'>
      <div className='max-w-7xl mx-auto'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#e8a832] mb-3'>Por qué elegirnos</p>
        <h2 className='text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3' style={{ fontFamily: 'Georgia, serif' }}>
          Todo lo bueno,
          <br />
          nada de lo malo
        </h2>
        <p className='text-white/60 text-base sm:text-lg font-light mb-10 max-w-lg'>
          Fabricamos cada producto con un único compromiso: que sea genuinamente bueno para vos.
        </p>

        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4'>
          {items.map((item, i) => (
            <div
              key={i}
              className='border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-[#c47c2b]/50 transition-colors'
            >
              <div className='text-3xl mb-4'>{item.icono}</div>
              <h3 className='text-white font-bold mb-2' style={{ fontFamily: 'Georgia, serif' }}>
                {item.titulo}
              </h3>
              <p className='text-white/50 text-sm leading-relaxed font-light'>{item.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
