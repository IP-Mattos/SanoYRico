// src/app/dashboard/descuentos/ImagenPreview.tsx
// Vista previa con debounce + Descargar/Compartir para las imágenes de cupón y promo.
'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormatoFlyer } from '@/lib/flyers/params'
import { Download, Loader2, Share2, AlertCircle } from 'lucide-react'

const lbl = 'block text-xs font-medium text-[#3d2b1f] mb-1.5'

export function FormatoToggle({ formato, onChange }: { formato: FormatoFlyer; onChange: (f: FormatoFlyer) => void }) {
  return (
    <div>
      <span className={lbl}>Formato</span>
      <div className='grid grid-cols-2 gap-2'>
        {(
          [
            ['cuadrado', 'Cuadrado', '1080 × 1080'],
            ['historia', 'Historia', '1080 × 1920']
          ] as const
        ).map(([valor, nombre, detalle]) => (
          <button
            key={valor}
            type='button'
            onClick={() => onChange(valor)}
            aria-pressed={formato === valor}
            className={`text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
              formato === valor ? 'border-[#c47c2b] bg-[#c47c2b]/10 text-[#3d2b1f]' : 'border-[#f0e6d3] text-[#3d2b1f]/70 hover:bg-[#faf6ef]'
            }`}
          >
            <span className='block font-semibold'>{nombre}</span>
            <span className='block text-xs text-[#3d2b1f]/60'>{detalle}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface Props {
  /** URL completa de la API; null = todavía no hay datos válidos para mostrar. */
  url: string | null
  formato: FormatoFlyer
  nombreArchivo: string
  vacio?: string
}

export default function ImagenPreview({ url, formato, nombreArchivo, vacio }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')
  const [puedeCompartir, setPuedeCompartir] = useState(false)
  const [accionando, setAccionando] = useState(false)
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      const prueba = new File([new Blob(['x'])], 'x.png', { type: 'image/png' })
      setPuedeCompartir(typeof navigator.canShare === 'function' && navigator.canShare({ files: [prueba] }))
    } catch {
      setPuedeCompartir(false)
    }
  }, [])

  // Debounce: el proxy limita /api a 20 pedidos por minuto por IP
  useEffect(() => {
    if (!url) {
      setPreviewUrl(null)
      setError('')
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setGenerando(true)
      setError('')
      try {
        const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
        if (!res.ok) {
          const msg = await res.json().then((j) => j?.error as string | undefined).catch(() => undefined)
          throw new Error(msg || 'No pudimos generar la imagen')
        }
        const nueva = URL.createObjectURL(await res.blob())
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
        previewRef.current = nueva
        setPreviewUrl(nueva)
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setError((e as Error).message)
      } finally {
        if (!ctrl.signal.aborted) setGenerando(false)
      }
    }, 600)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [url])

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  const obtenerBlob = async (): Promise<Blob | null> => (previewUrl ? (await fetch(previewUrl)).blob() : null)

  const descargar = async () => {
    setAccionando(true)
    try {
      const blob = await obtenerBlob()
      if (!blob) return
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = nombreArchivo
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(href), 1000)
    } finally {
      setAccionando(false)
    }
  }

  const compartir = async () => {
    setAccionando(true)
    try {
      const blob = await obtenerBlob()
      if (!blob) return
      await navigator.share({ files: [new File([blob], nombreArchivo, { type: 'image/png' })], title: 'Sano y Rico' })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('No pudimos compartir la imagen. Probá descargarla.')
    } finally {
      setAccionando(false)
    }
  }

  const deshabilitado = !previewUrl || generando || accionando

  return (
    <div>
      <div className='flex justify-center'>
        <div
          className='relative w-full max-w-xs bg-[#faf6ef] rounded-xl overflow-hidden flex items-center justify-center'
          style={{ aspectRatio: formato === 'cuadrado' ? '1 / 1' : '9 / 16' }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt='Vista previa de la imagen' className='w-full h-full object-contain' />
          ) : (
            <p className='text-sm text-[#3d2b1f]/50 px-6 text-center'>{vacio ?? ''}</p>
          )}
          {generando && (
            <div className='absolute inset-0 bg-white/50 flex items-center justify-center'>
              <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
            </div>
          )}
        </div>
      </div>
      {error && (
        <p role='alert' className='flex items-center gap-2 text-sm text-red-600 mt-3'>
          <AlertCircle className='h-4 w-4 shrink-0' /> {error}
        </p>
      )}
      <div className='flex flex-wrap gap-2 mt-4'>
        <button
          type='button'
          onClick={descargar}
          disabled={deshabilitado}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c47c2b] text-white text-sm font-medium hover:bg-[#b06f26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          <Download className='h-4 w-4' /> Descargar PNG
        </button>
        {puedeCompartir && (
          <button
            type='button'
            onClick={compartir}
            disabled={deshabilitado}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#c47c2b] text-[#c47c2b] text-sm font-medium hover:bg-[#c47c2b]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <Share2 className='h-4 w-4' /> Compartir
          </button>
        )}
      </div>
    </div>
  )
}
