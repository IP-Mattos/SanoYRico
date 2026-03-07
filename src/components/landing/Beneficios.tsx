const items = [
  {
    icon: '🌾',
    title: 'Ingredientes reales',
    desc: 'Solo usamos ingredientes que reconocés. Sin números raros, sin E-something.'
  },
  {
    icon: '🔬',
    title: 'Formulados por nutricionistas',
    desc: 'Cada barra fue desarrollada con profesionales para garantizar el balance correcto.'
  },
  { icon: '🌍', title: 'Producción local', desc: 'Fabricados en Uruguay con ingredientes de productores locales.' },
  {
    icon: '♻️',
    title: 'Packaging sustentable',
    desc: 'Envases biodegradables. Porque cuidar el cuerpo y el planeta van de la mano.'
  }
]

export function Beneficios() {
  return (
    <section id='beneficios' className='bg-[#3d2b1f] py-24 px-6 lg:px-16'>
      <div className='max-w-7xl mx-auto'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#c47c2b] mb-3'>Por qué elegirnos</p>
        <h2 className='text-4xl lg:text-5xl font-black text-white mb-3' style={{ fontFamily: 'Georgia, serif' }}>
          Todo lo bueno,
          <br />
          nada de lo malo
        </h2>
        <p className='text-white/60 text-lg font-light mb-12 max-w-lg'>
          Fabricamos cada producto con un único compromiso: que sea genuinamente bueno para vos.
        </p>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {items.map((item) => (
            <div
              key={item.title}
              className='border border-white/10 rounded-2xl p-6 hover:border-[#c47c2b]/50 hover:bg-[#c47c2b]/05 transition-colors'
            >
              <div className='text-3xl mb-4'>{item.icon}</div>
              <h3 className='text-white font-bold mb-2' style={{ fontFamily: 'Georgia, serif' }}>
                {item.title}
              </h3>
              <p className='text-white/50 text-sm leading-relaxed font-light'>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
