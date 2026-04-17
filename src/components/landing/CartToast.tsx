'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'

// Toast que aparece arriba-derecha cuando se agrega un item al carrito.
// Key derivada de justAdded.producto_id + cantidad fuerza re-animación en clics repetidos.
export function CartToast() {
  const { justAdded, setIsOpen } = useCart()

  if (!justAdded) return null

  return (
    <div
      role='status'
      aria-live='polite'
      key={`${justAdded.producto_id}-${Date.now()}`}
      className='fixed top-24 right-4 sm:right-6 z-[60] max-w-[calc(100vw-2rem)] sm:max-w-sm animate-toast'
    >
      <button
        onClick={() => setIsOpen(true)}
        className='group flex items-center gap-3 bg-[#3d2b1f] text-[#faf6ef] rounded-2xl shadow-[0_20px_50px_-10px_rgba(61,43,31,0.5)] pl-2 pr-4 py-2.5 w-full hover:bg-[#2a1f18] transition-colors ring-2 ring-[#c47c2b]/40'
      >
        <div className='relative shrink-0'>
          <div className='w-11 h-11 rounded-xl bg-[#faf6ef] flex items-center justify-center text-2xl'>
            {justAdded.emoji || '🛒'}
          </div>
          <span className='absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-[#3d2b1f]'>
            <CheckCircle className='h-3 w-3 text-white' strokeWidth={3} />
          </span>
        </div>
        <div className='text-left min-w-0 flex-1'>
          <p className='text-[10px] uppercase tracking-widest font-semibold text-[#c47c2b] leading-none mb-1'>
            Agregado al carrito
          </p>
          <p className='text-sm font-bold text-[#faf6ef] truncate'>{justAdded.nombre}</p>
        </div>
        <div className='shrink-0 flex items-center gap-1 text-xs font-semibold text-[#c47c2b] group-hover:translate-x-0.5 transition-transform'>
          Ver
          <span aria-hidden='true'>→</span>
        </div>
      </button>
    </div>
  )
}

// Botón flotante en mobile cuando hay items en el carrito.
// Solo aparece al scrollear (para no tapar el hero) y cuando el drawer está cerrado.
export function StickyMobileCart() {
  const { cantidad, total, setIsOpen, isOpen } = useCart()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const visible = cantidad > 0 && scrolled && !isOpen

  return (
    <button
      onClick={() => setIsOpen(true)}
      aria-label={`Ver carrito — ${cantidad} productos, total $${total}`}
      className={`lg:hidden fixed bottom-5 right-4 z-40 flex items-center gap-3 bg-[#3d2b1f] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className='relative'>
        <ShoppingBag className='h-5 w-5' />
        <span className='absolute -top-2 -right-2 w-5 h-5 bg-[#c47c2b] text-[11px] font-bold rounded-full flex items-center justify-center'>
          {cantidad}
        </span>
      </div>
      <span className='text-sm font-semibold' style={{ fontFamily: 'Georgia, serif' }}>
        ${total}
      </span>
    </button>
  )
}
