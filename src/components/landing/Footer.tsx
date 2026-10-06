import Image from 'next/image'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { type FooterConfig, type PagosConfig, DEFAULT_CONFIG } from '@/lib/site-config'

const NAV = [
  { href: '/#productos', label: 'Productos' },
  { href: '/#beneficios', label: 'Beneficios' },
  { href: '/#opiniones', label: 'Opiniones' },
  { href: '/pedido', label: 'Mi pedido' }
]
export function Footer({
  config = DEFAULT_CONFIG.footer,
  pagos = DEFAULT_CONFIG.pagos
}: {
  config?: FooterConfig
  pagos?: PagosConfig
}) {
  // Solo los métodos activos en la configuración, igual que el checkout (Cart.tsx)
  const PAGOS = [
    pagos.mercadopago?.activo && 'Mercado Pago',
    pagos.transferencia?.activo && 'Transferencia',
    pagos.deposito?.activo && 'Depósito'
  ].filter((p): p is string => Boolean(p))
  return (
    <>
      {/* CTA */}
      <section className='section-y pb-0!'>
        <div className='container-x'>
          <div className='reveal relative overflow-hidden rounded-3xl bg-[#3d2b1f] px-6 sm:px-12 py-14 sm:py-20 text-center shadow-[var(--shadow-lift)]'>
            <div
              className='absolute -top-24 left-1/2 -translate-x-1/2 w-md h-112 rounded-full bg-[#c47c2b]/25 blur-3xl pointer-events-none'
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
        </div>
      </section>

      {/* Footer */}
      <footer className='mt-16 sm:mt-24 bg-[#2a1f18] text-white'>
        <div className='container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]'>
          <div>
            <div className='text-2xl font-extrabold tracking-tight mb-3' style={{ fontFamily: 'var(--display)' }}>
              Sano y <span className='text-[#e8a832] italic'>Rico</span>
            </div>
            <p className='text-sm text-white/70 leading-relaxed max-w-xs'>Snacks naturales hechos en Uruguay.</p>
          </div>

          <nav aria-label='Navegación del sitio'>
            <h3 className='text-xs font-semibold uppercase tracking-[0.16em] text-[#e8a832] mb-4'>Explorar</h3>
            <ul className='space-y-1 list-none'>
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className='inline-flex items-center min-h-9 text-sm text-white/75 hover:text-white transition-colors'
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className='text-xs font-semibold uppercase tracking-[0.16em] text-[#e8a832] mb-4'>Contacto</h3>
            <a
              href={`mailto:${config.email}`}
              className='inline-flex items-center gap-2 min-h-9 text-sm text-white/75 hover:text-white transition-colors break-all'
            >
              <Mail className='h-4 w-4 shrink-0' strokeWidth={1.75} aria-hidden='true' />
              {config.email}
            </a>
          </div>

          {PAGOS.length > 0 && (
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-[0.16em] text-[#e8a832] mb-4'>Medios de pago</h3>
            <ul className='flex flex-wrap gap-2 list-none'>
              {PAGOS.map((p) => (
                <li
                  key={p}
                  className='rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80'
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
          )}
        </div>

        <div className='border-t border-white/10'>
          <div className='container-x flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-24 sm:pb-6 text-sm text-white/70'>
            <span className='text-center sm:text-left'>{config.copyright}</span>
            <div className='flex items-center gap-[7px] text-[.8rem]'>
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
          </div>
        </div>
      </footer>
    </>
  )
}
