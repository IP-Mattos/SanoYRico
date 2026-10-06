// src/app/dashboard/descuentos/CuponImagenModal.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Cupon } from '@/lib/types'
import type { FormatoFlyer } from '@/lib/flyers/params'
import { MAX_SALUDO } from '@/lib/imagenes/params'
import ImagenPreview, { FormatoToggle } from './ImagenPreview'
import { X } from 'lucide-react'

const inp = 'w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
const lbl = 'block text-xs font-medium text-[#3d2b1f] mb-1.5'

export default function CuponImagenModal({ cupon, onClose }: { cupon: Cupon; onClose: () => void }) {
  const [saludo, setSaludo] = useState('')
  const [formato, setFormato] = useState<FormatoFlyer>('cuadrado')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const url = useMemo(() => {
    if (!cupon.id) return null
    const q = new URLSearchParams({ id: cupon.id, formato })
    if (saludo.trim()) q.set('saludo', saludo.trim())
    return `/api/imagenes/cupon?${q.toString()}`
  }, [cupon.id, formato, saludo])

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={onClose}>
      <div
        role='dialog'
        aria-modal='true'
        aria-label={`Imagen del cupón ${cupon.codigo}`}
        className='bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 space-y-4'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-start justify-between gap-3'>
          <div>
            <h3 className='font-bold text-[#3d2b1f]'>Imagen del cupón</h3>
            <p className='text-xs text-[#8a7060] font-mono mt-0.5'>{cupon.codigo}</p>
          </div>
          <button type='button' onClick={onClose} aria-label='Cerrar' className='text-[#8a7060] hover:text-[#3d2b1f]'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div>
          <label htmlFor='cupon-saludo' className={lbl}>Saludo / nombre (opcional)</label>
          <input
            id='cupon-saludo'
            className={inp}
            value={saludo}
            onChange={(e) => setSaludo(e.target.value)}
            maxLength={MAX_SALUDO}
            placeholder='Ej: María'
          />
        </div>
        <FormatoToggle formato={formato} onChange={setFormato} />
        <ImagenPreview
          url={url}
          formato={formato}
          nombreArchivo={`cupon-${cupon.codigo.toLowerCase()}-${formato}.png`}
          vacio='Este cupón no tiene identificador; recargá la página.'
        />
      </div>
    </div>
  )
}
