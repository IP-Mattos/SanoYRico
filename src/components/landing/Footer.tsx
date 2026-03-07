import Link from 'next/link'

export function Footer() {
  return (
    <>
      {/* CTA */}
      <section className='py-24 px-6 text-center'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#c47c2b] mb-3'>Empezá hoy</p>
        <h2 className='text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-4' style={{ fontFamily: 'Georgia, serif' }}>
          Tu snack sano
          <br />
          te está esperando
        </h2>
        <p className='text-[#8a7060] text-lg font-light mb-8'>
          Pedido mínimo: 6 unidades. Envío gratis a partir de $600 en todo Uruguay.
        </p>

        <a
          href='#productos'
          className='inline-block bg-[#3d2b1f] text-[#faf6ef] px-8 py-4 rounded-full text-sm font-medium hover:bg-[#c47c2b] transition-colors'
        >
          Ver todos los productos →
        </a>
      </section>

      {/* Footer */}
      <footer className='bg-[#3d2b1f] px-6 lg:px-16 py-8 flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div className='text-white text-xl font-bold' style={{ fontFamily: 'Georgia, serif' }}>
          Sano y <span className='text-[#c47c2b] italic'>Rico</span>
        </div>
        <span className='text-white/40 text-sm'>© 2025 Sano y Rico. Hecho con 💚 en Uruguay.</span>
        <div className='flex items-center gap-6'>
          <span className='text-white/40 text-sm'>contacto@sanoyrico.uy</span>
          <Link href='/dashboard' className='text-white/20 text-xs hover:text-white/60 transition-colors'>
            Panel admin
          </Link>
        </div>
      </footer>
    </>
  )
}
