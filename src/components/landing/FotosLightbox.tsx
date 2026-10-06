// src/components/landing/FotosLightbox.tsx
'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  titulo: string
  fotos: string[]
  inicial?: number
  onClose: () => void
}

const SWIPE_MIN = 50
const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const ctrl =
  'inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/15 text-white hover:bg-white/30 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none motion-reduce:active:scale-100'

export function FotosLightbox({ titulo, fotos, inicial = 0, onClose }: Props) {
  const [i, setI] = useState(Math.min(Math.max(inicial, 0), fotos.length - 1))
  const dialogRef = useRef<HTMLDivElement>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)
  const tituloId = useId()
  const total = fotos.length

  const ir = useCallback((delta: number) => setI((n) => (n + delta + total) % total), [total])

  // Bloquea el scroll del fondo, devuelve el foco al disparador y enfoca el botón de cerrar
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previo?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight' && total > 1) {
        e.preventDefault()
        ir(1)
      } else if (e.key === 'ArrowLeft' && total > 1) {
        e.preventDefault()
        ir(-1)
      } else if (e.key === 'Tab') {
        // Trampa de foco dentro del diálogo
        const els = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (!els || els.length === 0) return
        const primero = els[0]
        const ultimo = els[els.length - 1]
        const activo = document.activeElement
        if (e.shiftKey && (activo === primero || !dialogRef.current?.contains(activo))) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && (activo === ultimo || !dialogRef.current?.contains(activo))) {
          e.preventDefault()
          primero.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ir, onClose, total])

  return createPortal(
    <div
      className='fixed inset-0 z-100 bg-[#1d130c]/95 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6'
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={tituloId}
        className='relative w-full max-w-3xl flex flex-col gap-3'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between gap-3 text-white'>
          <div className='min-w-0'>
            <h2 id={tituloId} className='text-base sm:text-lg font-bold leading-snug truncate' style={{ fontFamily: 'var(--display)' }}>
              {titulo}
            </h2>
            <p className='text-xs text-white/80 tabular-nums' aria-live='polite'>
              {i + 1} / {total}
              <span className='sr-only'> fotos reales</span>
            </p>
          </div>
          <button ref={cerrarRef} type='button' onClick={onClose} aria-label='Cerrar fotos' className={ctrl}>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div
          className='relative w-full h-[min(68dvh,80vw)] min-h-60 rounded-2xl overflow-hidden bg-black/40 touch-pan-y select-none'
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null || total < 2) return
            const dx = e.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) >= SWIPE_MIN) ir(dx < 0 ? 1 : -1)
          }}
        >
          <Image
            key={fotos[i]}
            src={fotos[i]}
            alt={`${titulo}, foto real ${i + 1} de ${total}`}
            fill
            sizes='(min-width: 768px) 768px, 100vw'
            className='object-contain'
            priority
            draggable={false}
          />
          {total > 1 && (
            <>
              <button type='button' onClick={() => ir(-1)} aria-label='Foto anterior' className={`${ctrl} absolute left-2 top-1/2 -translate-y-1/2`}>
                <ChevronLeft className='h-5 w-5' />
              </button>
              <button type='button' onClick={() => ir(1)} aria-label='Foto siguiente' className={`${ctrl} absolute right-2 top-1/2 -translate-y-1/2`}>
                <ChevronRight className='h-5 w-5' />
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <ul className='flex justify-center gap-2' aria-label='Miniaturas'>
            {fotos.map((f, n) => (
              <li key={f}>
                <button
                  type='button'
                  onClick={() => setI(n)}
                  aria-label={`Ver foto ${n + 1}`}
                  aria-current={n === i}
                  className={`relative block w-12 h-12 rounded-lg overflow-hidden border-2 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    n === i ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={f} alt='' fill sizes='48px' className='object-cover' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  )
}
