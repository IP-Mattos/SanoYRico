'use client'

import Link from 'next/link'

export function Navbar() {
  return (
    <>
      <input type='checkbox' id='menu-toggle' className='hidden peer' />
      <nav className='fixed top-0 left-0 right-0 z-50 bg-[#faf6ef]/85 backdrop-blur-md border-b border-[#3d2b1f]/08'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16'>
          {/* Logo */}
          <div className='text-[#3d2b1f] text-2xl font-bold' style={{ fontFamily: 'Georgia, serif' }}>
            Sano y <span className='text-[#c47c2b] italic'>Rico</span>
          </div>

          {/* Links desktop */}
          <ul className='hidden lg:flex items-center gap-8 list-none'>
            {['Productos', 'Beneficios', 'Opiniones'].map((item) => (
              <li key={item}>
                <Link
                  href={`#${item.toLowerCase()}`}
                  className='text-[#8a7060] text-sm font-medium uppercase tracking-wider hover:text-[#3d2b1f] transition-colors'
                >
                  {item}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href='/dashboard'
                className='text-[#8a7060] text-sm font-medium uppercase tracking-wider hover:text-[#3d2b1f] transition-colors'
              >
                Panel
              </Link>
            </li>
            <li>
              <Link
                href='#productos'
                className='bg-[#3d2b1f] text-[#faf6ef] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#c47c2b] transition-colors'
              >
                Comprar ahora
              </Link>
            </li>
          </ul>

          {/* Hamburger */}
          <label htmlFor='menu-toggle' className='lg:hidden flex flex-col gap-1.5 cursor-pointer p-1'>
            <span className='block w-5 h-0.5 bg-[#3d2b1f] rounded transition-all' />
            <span className='block w-5 h-0.5 bg-[#3d2b1f] rounded transition-all' />
            <span className='block w-5 h-0.5 bg-[#3d2b1f] rounded transition-all' />
          </label>
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
              href={`#${item.toLowerCase()}`}
              className='py-3 text-[#3d2b1f] font-medium border-b border-[#f0e6d3]'
            >
              {item}
            </Link>
          ))}
          <Link href='/dashboard' className='py-3 text-[#8a7060] font-medium border-b border-[#f0e6d3]'>
            Panel admin
          </Link>
          <Link
            href='#productos'
            className='my-3 text-center bg-[#3d2b1f] text-white py-2.5 rounded-xl font-medium text-sm'
          >
            Comprar ahora →
          </Link>
        </div>
      </div>
    </>
  )
}
