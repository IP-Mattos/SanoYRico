const testimonios = [
  {
    texto: 'Las llevo al trabajo todos los días. Me ayudan a no caer en la máquina expendedora de la oficina.',
    nombre: 'Valentina M.',
    lugar: 'Montevideo',
    avatar: '👩'
  },
  {
    texto: 'La de Cacao & Maní es una locura. No puedo creer que algo tan rico sea sano. Mi favorita absoluta.',
    nombre: 'Rodrigo P.',
    lugar: 'Salto',
    avatar: '🧑'
  },
  {
    texto: 'Las compro en pack para toda la semana. Mis hijos también las comen y eso ya dice todo.',
    nombre: 'Lucía F.',
    lugar: 'Canelones',
    avatar: '👩‍👧'
  }
]

export function Testimonios() {
  return (
    <section id='opiniones' className='py-24 px-6 lg:px-16 bg-[#f0e6d3]'>
      <div className='max-w-7xl mx-auto'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#c47c2b] mb-3'>Opiniones</p>
        <h2 className='text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-3' style={{ fontFamily: 'Georgia, serif' }}>
          Los que ya las
          <br />
          probaron, nos cuentan
        </h2>
        <p className='text-[#8a7060] text-lg font-light mb-12'>
          Más de 2.400 personas ya cambiaron sus snacks por algo mejor.
        </p>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {testimonios.map((t) => (
            <div key={t.nombre} className='bg-[#faf6ef] rounded-2xl p-6 border border-[#f0e6d3]'>
              <div className='text-[#c47c2b] text-lg mb-4'>★★★★★</div>
              <p className='text-[#3d2b1f] italic leading-relaxed mb-6' style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{t.texto}&rdquo;
              </p>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-[#f0e6d3] flex items-center justify-center text-xl'>
                  {t.avatar}
                </div>
                <div>
                  <div className='text-sm font-medium text-[#3d2b1f]'>{t.nombre}</div>
                  <div className='text-xs text-[#8a7060]'>{t.lugar}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
