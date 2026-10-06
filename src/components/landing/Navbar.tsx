'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export function Navbar() {
  const { cantidad, setIsOpen } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [bump, setBump] = useState(false)
  const [prevCantidad, setPrevCantidad] = useState(cantidad)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Flash el badge del carrito cuando sube la cantidad (refuerza el toast).
  if (cantidad !== prevCantidad) {
    setPrevCantidad(cantidad)
    setBump(cantidad > prevCantidad)
  }

  useEffect(() => {
    if (!bump) return
    const t = setTimeout(() => setBump(false), 500)
    return () => clearTimeout(t)
  }, [bump])

  return (
    <>
      <input type='checkbox' id='menu-toggle' className='hidden peer' />
      <nav
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-200 ${
          scrolled
            ? 'bg-[#faf6ef]/95 shadow-sm border-b border-[#3d2b1f]/10'
            : 'bg-[#faf6ef]/70 border-b border-transparent'
        }`}
      >
        <div className='container-x flex items-center justify-between h-16'>
          {/* Logo — click lleva a la home desde cualquier ruta */}
          <Link
            href='/'
            className='text-[#3d2b1f] text-2xl font-extrabold tracking-tight hover:opacity-80 transition-opacity'
            style={{ fontFamily: 'var(--display)' }}
          >
            Sano y <span className='text-[#c47c2b] italic'>Rico</span>
          </Link>

          {/* Links desktop — anchor absoluto (/#x) para que funcionen desde /pedido, /login, etc. */}
          <ul className='hidden lg:flex items-center gap-8 list-none'>
            {['Productos', 'Beneficios', 'Opiniones'].map((item) => (
              <li key={item}>
                <Link
                  href={`/#${item.toLowerCase()}`}
                  className='text-[#6e5746] text-[13px] font-semibold uppercase tracking-[0.12em] hover:text-[#3d2b1f] py-2 transition-colors'
                >
                  {item}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href='/pedido'
                className='text-[#6e5746] text-[13px] font-semibold uppercase tracking-[0.12em] hover:text-[#3d2b1f] py-2 transition-colors'
              >
                Mi pedido
              </Link>
            </li>
            <li>
              <button
                onClick={() => setIsOpen(true)}
                className='relative bg-[#3d2b1f] text-[#faf6ef] text-sm font-semibold px-5 min-h-11 rounded-full hover:bg-[#c47c2b] active:scale-[0.97] transition-all flex items-center gap-2'
              >
                <ShoppingBag className='h-4 w-4' />
                Carrito
                {cantidad > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#c47c2b] text-white text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-[#faf6ef] ${bump ? 'animate-bump' : ''}`}
                  >
                    {cantidad}
                  </span>
                )}
              </button>
            </li>
          </ul>

          {/* Mobile: carrito + hamburger */}
          <div className='flex items-center gap-3 lg:hidden'>
            <button onClick={() => setIsOpen(true)} aria-label='Ver carrito' className='relative w-11 h-11 flex items-center justify-center text-[#3d2b1f]'>
              <ShoppingBag className='h-5 w-5' />
              {cantidad > 0 && (
                <span
                  className={`absolute top-0 right-0 w-4 h-4 bg-[#c47c2b] text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-[#faf6ef] ${bump ? 'animate-bump' : ''}`}
                >
                  {cantidad}
                </span>
              )}
            </button>
            <label htmlFor='menu-toggle' className='flex flex-col justify-center gap-1.5 cursor-pointer w-11 h-11 items-center'>
              <span className='sr-only'>Abrir menú</span>
              <span className='block w-5 h-0.5 bg-[#3d2b1f] rounded transition-all' />
              <span className='block w-5 h-0.5 bg-[#3d2b1f] rounded transition-all' />
              <span className='block w-5 h-0.5 bg-[#3d2b1f] rounded transition-all' />
            </label>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className='fixed top-16 left-0 right-0 z-40 bg-white border-b border-[#f0e6d3] shadow-lg
                      max-h-0 overflow-hidden transition-all duration-300
                      peer-checked:max-h-72 lg:hidden'
      >
        <div className='flex flex-col px-6 py-2'>
          {['Productos', 'Beneficios', 'Opiniones'].map((item) => (
            <Link
              key={item}
              href={`/#${item.toLowerCase()}`}
              className='flex items-center min-h-12 text-[#3d2b1f] font-medium border-b border-[#f0e6d3]'
            >
              {item}
            </Link>
          ))}
          <Link href='/pedido' className='flex items-center min-h-12 text-[#3d2b1f] font-medium border-b border-[#f0e6d3]'>
            Mi pedido
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className='my-3 text-center bg-[#3d2b1f] text-white min-h-12 rounded-full font-semibold text-sm'
          >
            Ver carrito {cantidad > 0 && `(${cantidad})`}
          </button>
        </div>
      </div>
    </>
  )
}
