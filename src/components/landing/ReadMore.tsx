'use client'

import { useState } from 'react'

// Párrafo largo: en pantallas chicas se recorta visualmente a unas líneas con toggle;
// desde lg se muestra completo. El texto completo siempre está en el DOM.
export function ReadMore({ children, className = '', lines = 4 }: { children: string; className?: string; lines?: number }) {
  const [open, setOpen] = useState(false)
  const clamp = !open ? (lines === 3 ? 'line-clamp-3' : 'line-clamp-4') : ''
  return (
    <div className={className}>
      <p className={`${clamp} lg:line-clamp-none`}>{children}</p>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className='lg:hidden mt-1 inline-flex items-center min-h-11 text-sm font-semibold text-[#8a5a1a] underline underline-offset-4 decoration-[#c47c2b]/50'
      >
        {open ? 'Leer menos' : 'Leer más'}
      </button>
    </div>
  )
}
