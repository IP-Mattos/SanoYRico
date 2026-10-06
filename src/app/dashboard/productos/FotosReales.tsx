// src/app/dashboard/productos/FotosReales.tsx
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { AlertCircle, Camera, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { MAX_FOTOS } from '@/lib/productos/fotos'

interface Props {
  productoId: string
  fotos: string[]
  onChange: (fotos: string[]) => void
}

const LADO_MAX = 1600

// Achica en el navegador antes de subir: las fotos de celular suelen pasar el límite de body del hosting.
// Si el navegador no puede decodificarla (p. ej. HEIC en escritorio), se sube el original y el servidor decide.
async function reducirFoto(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * escala)
    canvas.height = Math.round(bmp.height * escala)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], 'foto.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export default function FotosReales({ productoId, fotos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ocupado, setOcupado] = useState<null | 'subiendo' | 'guardando'>(null)
  const [error, setError] = useState('')
  const [quitarFondo, setQuitarFondo] = useState(true)
  // Foto cuyo fondo no se pudo quitar: se ofrece subirla igual, sin tocar el fondo
  const [fallida, setFallida] = useState<File | null>(null)
  const url = `/api/productos/${productoId}/fotos`
  const lleno = fotos.length >= MAX_FOTOS

  const llamar = async (init: RequestInit): Promise<string[] | null | 'fondo_fallido'> => {
    try {
      const res = await fetch(url, init)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (json.code === 'fondo_fallido') return 'fondo_fallido'
        setError(json.error ?? (res.status === 413 ? 'La imagen es demasiado pesada' : 'No pudimos completar la acción'))
        return null
      }
      return json.fotos as string[]
    } catch {
      setError('Sin conexión. Probá de nuevo.')
      return null
    }
  }

  const subir = async (original: File, conFondo: boolean) => {
    setError('')
    setFallida(null)
    setOcupado('subiendo')
    const file = await reducirFoto(original)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('quitarFondo', conFondo ? '1' : '0')
    const res = await llamar({ method: 'POST', body: fd })
    if (res === 'fondo_fallido') {
      setError('No pudimos quitar el fondo de la foto (puede haber tardado demasiado).')
      setFallida(original)
    } else if (res) {
      onChange(res)
    }
    setOcupado(null)
  }

  const mover = async (i: number, delta: -1 | 1) => {
    const j = i + delta
    if (j < 0 || j >= fotos.length) return
    const orden = [...fotos]
    ;[orden[i], orden[j]] = [orden[j], orden[i]]
    setError('')
    setOcupado('guardando')
    const nuevas = await llamar({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fotos: orden })
    })
    if (Array.isArray(nuevas)) onChange(nuevas)
    setOcupado(null)
  }

  const borrar = async (foto: string) => {
    if (!confirm('¿Eliminar esta foto?')) return
    setError('')
    setOcupado('guardando')
    const nuevas = await llamar({
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: foto })
    })
    if (Array.isArray(nuevas)) onChange(nuevas)
    setOcupado(null)
  }

  const btn =
    'h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/90 text-[#3d2b1f] shadow-sm hover:bg-white disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b]'

  return (
    <div className='rounded-xl border border-[#f0e6d3] bg-[#faf6ef] p-3 space-y-3'>
      <div>
        <p className='text-xs font-medium text-[#3d2b1f]'>Fotos reales (hasta {MAX_FOTOS})</p>
        <p className='text-[11px] text-[#8a7060] mt-0.5'>
          Se ven en la tienda con el botón &ldquo;Ver fotos reales&rdquo;. La primera es la portada.
        </p>
      </div>

      {fotos.length > 0 && (
        <ul className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
          {fotos.map((f, i) => (
            <li key={f} className='relative aspect-square rounded-xl overflow-hidden bg-white border border-[#f0e6d3]'>
              <Image src={f} alt={`Foto ${i + 1}`} fill sizes='120px' className='object-cover' />
              {i === 0 && (
                <span className='absolute top-1.5 left-1.5 bg-[#4a6741] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full'>
                  Portada
                </span>
              )}
              <div className='absolute bottom-1.5 inset-x-1.5 flex items-center justify-between'>
                <div className='flex gap-1'>
                  <button type='button' onClick={() => mover(i, -1)} disabled={i === 0 || !!ocupado} aria-label={`Mover foto ${i + 1} a la izquierda`} className={btn}>
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <button type='button' onClick={() => mover(i, 1)} disabled={i === fotos.length - 1 || !!ocupado} aria-label={`Mover foto ${i + 1} a la derecha`} className={btn}>
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
                <button type='button' onClick={() => borrar(f)} disabled={!!ocupado} aria-label={`Eliminar foto ${i + 1}`} className={`${btn} hover:text-red-500`}>
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          disabled={lleno || !!ocupado}
          className='inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#dccbb0] bg-white text-sm font-medium text-[#3d2b1f] hover:border-[#c47c2b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b]'
        >
          {ocupado === 'subiendo' ? <Loader2 className='h-4 w-4 animate-spin' /> : <Camera className='h-4 w-4' />}
          {ocupado === 'subiendo' ? (quitarFondo ? 'Quitando fondo…' : 'Subiendo…') : lleno ? 'Máximo alcanzado' : 'Agregar foto'}
        </button>
        <span className='text-xs text-[#8a7060] tabular-nums'>{fotos.length} / {MAX_FOTOS}</span>
      </div>

      <label className='flex items-center gap-2 text-xs text-[#3d2b1f] cursor-pointer w-fit'>
        <input
          type='checkbox'
          checked={quitarFondo}
          onChange={(e) => setQuitarFondo(e.target.checked)}
          disabled={!!ocupado}
          className='h-4 w-4 accent-[#c47c2b]'
        />
        Quitar fondo (recomendado)
      </label>
      {ocupado === 'subiendo' && quitarFondo && (
        <p className='text-[11px] text-[#8a7060]'>Puede tardar hasta un minuto y medio.</p>
      )}

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void subir(file, quitarFondo)
          e.target.value = ''
        }}
      />

      {error && (
        <p role='alert' className='text-xs text-red-500 flex items-center gap-1'>
          <AlertCircle className='h-3 w-3 shrink-0' /> {error}
        </p>
      )}
      {fallida && !ocupado && (
        <button
          type='button'
          onClick={() => void subir(fallida, false)}
          className='text-xs font-medium text-[#8a5a1a] underline underline-offset-4 hover:text-[#3d2b1f]'
        >
          Subir esta foto sin quitar el fondo
        </button>
      )}
    </div>
  )
}
