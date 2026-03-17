import Link from 'next/link'
import { type FooterConfig, DEFAULT_CONFIG } from '@/lib/site-config'

export function Footer({ config = DEFAULT_CONFIG.footer }: { config?: FooterConfig }) {
  return (
    <>
      {/* CTA */}
      <section className='py-16 sm:py-24 px-6 sm:px-10 text-center'>
        <div className='max-w-2xl mx-auto'>
          <p className='text-xs font-medium tracking-widest uppercase text-[#c47c2b] mb-3'>Empezá hoy</p>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-4' style={{ fontFamily: 'Georgia, serif' }}>
            {config.ctaTitulo}
          </h2>
          <p className='text-[#8a7060] text-base sm:text-lg font-light mb-8'>{config.ctaSubtexto}</p>
          <a
            href='#productos'
            className='inline-block bg-[#3d2b1f] text-[#faf6ef] px-8 py-4 rounded-full text-sm font-medium hover:bg-[#c47c2b] transition-colors'
          >
            {config.ctaBoton}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-[#3d2b1f] px-6 sm:px-10 lg:px-16 py-8'>
        <div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='text-white text-xl font-bold' style={{ fontFamily: 'Georgia, serif' }}>
            Sano y <span className='text-[#c47c2b] italic'>Rico</span>
          </div>
          <span className='text-white/40 text-sm text-center'>{config.copyright}</span>
          <div className='flex items-center gap-4 sm:gap-6'>
            <span className='text-white/40 text-sm'>{config.email}</span>
            <Link href='/dashboard' className='text-white/20 text-xs hover:text-white/60 transition-colors'>
              Panel admin
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
