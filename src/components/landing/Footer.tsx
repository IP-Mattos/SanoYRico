import Image from 'next/image'
import { type FooterConfig, DEFAULT_CONFIG } from '@/lib/site-config'

export function Footer({ config = DEFAULT_CONFIG.footer }: { config?: FooterConfig }) {
  return (
    <>
      {/* CTA */}
      <section className='py-16 sm:py-24 px-6 sm:px-10 lg:px-16'>
        <div className='reveal relative max-w-5xl mx-auto overflow-hidden rounded-3xl bg-[#3d2b1f] px-6 sm:px-12 py-14 sm:py-20 text-center'>
          <div
            className='absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-[#c47c2b]/25 blur-3xl pointer-events-none'
            aria-hidden='true'
          />
          <div className='relative max-w-2xl mx-auto'>
            <p className='eyebrow eyebrow-light'>Empezá hoy</p>
            <h2 className='section-title text-white! mx-auto'>{config.ctaTitulo}</h2>
            <p className='text-white/80 text-base sm:text-lg mb-9 text-pretty'>{config.ctaSubtexto}</p>
            <a
              href='#productos'
              className='inline-flex items-center justify-center min-h-12 bg-[#faf6ef] text-[#3d2b1f] px-8 rounded-full text-[15px] font-semibold hover:bg-[#e8a832] hover:-translate-y-0.5 active:scale-[0.98] transition-all'
            >
              {config.ctaBoton}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-[#3d2b1f] px-6 sm:px-10 lg:px-16 py-10'>
        <div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='text-white text-2xl font-bold' style={{ fontFamily: 'var(--display)' }}>
            Sano y <span className='text-[#e8a832] italic'>Rico</span>
          </div>
          <span className='text-white/70 text-sm text-center'>{config.copyright}</span>
          <div className='flex items-center gap-4 sm:gap-6'>
            <span className='text-white/70 text-sm'>{config.email}</span>
          </div>
        </div>
        <div className='max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-[7px] text-[.78rem] text-white/70'>
          <Image src='/image/charruacode-mark-light.svg' alt='' width={18} height={18} unoptimized />
          <span>
            Sitio web por{' '}
            <a
              href='https://charruacode.com'
              target='_blank'
              rel='noopener'
              className='font-semibold underline underline-offset-2 hover:text-white transition-colors'
            >
              CharrúaCode
            </a>
          </span>
        </div>
      </footer>
    </>
  )
}
