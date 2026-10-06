// src/app/dashboard/flyers/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { precioConPromo } from '@/lib/pedidos/descuentos'
import {
  MAX_CUPON_FLYER,
  MAX_PRODUCTOS_FLYER,
  MAX_TITULO_FLYER,
  TITULO_FLYER_DEFAULT,
  type FormatoFlyer
} from '@/lib/flyers/params'
import { formatearPrecio } from '@/lib/flyers/layout'
import type { Producto } from '@/lib/types'
import { Download, Loader2, Search, Share2, AlertCircle } from 'lucide-react'

type ProductoLista = Pick<
  Producto,
  'id' | 'nombre' | 'precio' | 'emoji' | 'imagen_url' | 'descuento_pct' | 'descuento_desde' | 'descuento_hasta'
>

const inp = 'w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
const lbl = 'block text-xs font-medium text-[#3d2b1f] mb-1.5'

export default function FlyersPage() {
  const supabase = createClient()
  const [productos, setProductos] = useState<ProductoLista[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [formato, setFormato] = useState<FormatoFlyer>('cuadrado')
  const [titulo, setTitulo] = useState(TITULO_FLYER_DEFAULT)
  const [cupon, setCupon] = useState('')
  const [usarFotos, setUsarFotos] = useState(false)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [errorPreview, setErrorPreview] = useState('')
  const [puedeCompartir, setPuedeCompartir] = useState(false)
  const [accionando, setAccionando] = useState(false)
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, emoji, imagen_url, descuento_pct, descuento_desde, descuento_hasta')
        .eq('activo', true)
        .order('nombre')
      if (error) setErrorCarga('No pudimos cargar los productos.')
      setProductos((data as ProductoLista[] | null) ?? [])
      setCargando(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      const prueba = new File([new Blob(['x'])], 'x.png', { type: 'image/png' })
      setPuedeCompartir(typeof navigator.canShare === 'function' && navigator.canShare({ files: [prueba] }))
    } catch {
      setPuedeCompartir(false)
    }
  }, [])

  const cuponLimpio = cupon.trim().toUpperCase()
  const cuponValido = cuponLimpio === '' || /^[A-Z0-9-]{1,20}$/.test(cuponLimpio)
  const tituloValido = titulo.trim().length <= MAX_TITULO_FLYER

  const query = useMemo(() => {
    if (seleccion.length === 0 || !cuponValido || !tituloValido) return null
    const q = new URLSearchParams({ ids: seleccion.join(','), formato, titulo: titulo.trim() || TITULO_FLYER_DEFAULT })
    if (cuponLimpio) q.set('cupon', cuponLimpio)
    if (usarFotos) q.set('fotos', '1')
    return q.toString()
  }, [seleccion, formato, titulo, cuponLimpio, cuponValido, tituloValido, usarFotos])

  // Vista previa con debounce (el proxy limita /api a 20 pedidos por minuto)
  useEffect(() => {
    if (!query) {
      setPreviewUrl(null)
      setErrorPreview('')
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setGenerando(true)
      setErrorPreview('')
      try {
        const res = await fetch(`/api/flyers?${query}`, { signal: ctrl.signal, cache: 'no-store' })
        if (!res.ok) {
          const msg = await res.json().then((j) => j?.error as string | undefined).catch(() => undefined)
          throw new Error(msg || 'No pudimos generar el flyer')
        }
        const url = URL.createObjectURL(await res.blob())
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
        previewRef.current = url
        setPreviewUrl(url)
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setErrorPreview((e as Error).message)
      } finally {
        if (!ctrl.signal.aborted) setGenerando(false)
      }
    }, 700)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return q ? productos.filter((p) => p.nombre.toLowerCase().includes(q)) : productos
  }, [productos, busqueda])

  const alternar = (id: string) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= MAX_PRODUCTOS_FLYER ? s : [...s, id]))

  const nombreArchivo = () => `flyer-sano-y-rico-${new Date().toISOString().slice(0, 10)}.png`

  const obtenerBlob = async (): Promise<Blob | null> => {
    if (!previewUrl) return null
    return (await fetch(previewUrl)).blob()
  }

  const descargar = async () => {
    setAccionando(true)
    try {
      const blob = await obtenerBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nombreArchivo()
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setAccionando(false)
    }
  }

  const compartir = async () => {
    setAccionando(true)
    try {
      const blob = await obtenerBlob()
      if (!blob) return
      const file = new File([blob], nombreArchivo(), { type: 'image/png' })
      await navigator.share({ files: [file], title: 'Sano y Rico' })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setErrorPreview('No pudimos compartir la imagen. Probá descargarla.')
    } finally {
      setAccionando(false)
    }
  }

  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-xl font-bold text-[#3d2b1f]'>Flyers</h2>
        <p className='text-sm text-[#3d2b1f]/60 mt-0.5'>Armá una imagen con tus productos para compartir por WhatsApp o Instagram.</p>
      </div>

      <div className='grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start'>
        {/* Controles */}
        <div className='space-y-5'>
          <section className='bg-white rounded-2xl border border-[#f0e6d3] p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-[#3d2b1f]'>Productos</h3>
              <span className='text-xs text-[#3d2b1f]/60'>
                {seleccion.length} de {MAX_PRODUCTOS_FLYER}
              </span>
            </div>
            <div className='relative mb-3'>
              <Search className='h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3d2b1f]/40' />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder='Buscar producto'
                aria-label='Buscar producto'
                className={`${inp} pl-9`}
              />
            </div>
            {errorCarga && (
              <p className='flex items-center gap-2 text-sm text-red-600 mb-2'>
                <AlertCircle className='h-4 w-4' /> {errorCarga}
              </p>
            )}
            {cargando ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='h-5 w-5 animate-spin text-[#c47c2b]' />
              </div>
            ) : (
              <ul className='max-h-96 overflow-y-auto divide-y divide-[#f0e6d3]'>
                {filtrados.map((p) => {
                  const marcado = seleccion.includes(p.id)
                  const lleno = !marcado && seleccion.length >= MAX_PRODUCTOS_FLYER
                  const { precio, pct } = precioConPromo(p, new Date())
                  return (
                    <li key={p.id}>
                      <label
                        className={`flex items-center gap-3 py-2 px-1 rounded-lg ${lleno ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#faf6ef]'}`}
                      >
                        <input
                          type='checkbox'
                          checked={marcado}
                          disabled={lleno}
                          onChange={() => alternar(p.id)}
                          className='h-4 w-4 accent-[#c47c2b]'
                        />
                        <span className='w-10 h-10 rounded-lg bg-[#faf6ef] flex items-center justify-center overflow-hidden shrink-0 text-xl'>
                          {p.imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imagen_url} alt='' className='w-full h-full object-contain' />
                          ) : (
                            (p.emoji ?? '🌾')
                          )}
                        </span>
                        <span className='flex-1 min-w-0 text-sm text-[#3d2b1f] truncate'>{p.nombre.trim()}</span>
                        {marcado && (
                          <span className='text-xs font-bold text-white bg-[#3d2b1f] rounded-full w-5 h-5 flex items-center justify-center'>
                            {seleccion.indexOf(p.id) + 1}
                          </span>
                        )}
                        <span className='text-sm font-semibold text-[#c47c2b] shrink-0'>
                          {formatearPrecio(precio)}
                          {pct !== null && <span className='ml-1 text-xs text-[#3d2b1f]/60'>-{Math.round(pct)}%</span>}
                        </span>
                      </label>
                    </li>
                  )
                })}
                {filtrados.length === 0 && <li className='py-6 text-center text-sm text-[#3d2b1f]/60'>Sin resultados</li>}
              </ul>
            )}
          </section>

          <section className='bg-white rounded-2xl border border-[#f0e6d3] p-4 space-y-4'>
            <div>
              <span className={lbl}>Formato</span>
              <div className='grid grid-cols-2 gap-2'>
                {(
                  [
                    ['cuadrado', 'Cuadrado', '1080 × 1080 · Feed y WhatsApp'],
                    ['historia', 'Historia', '1080 × 1920 · Stories y estados']
                  ] as const
                ).map(([valor, nombre, detalle]) => (
                  <button
                    key={valor}
                    type='button'
                    onClick={() => setFormato(valor)}
                    aria-pressed={formato === valor}
                    className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      formato === valor
                        ? 'border-[#c47c2b] bg-[#c47c2b]/10 text-[#3d2b1f]'
                        : 'border-[#f0e6d3] text-[#3d2b1f]/70 hover:bg-[#faf6ef]'
                    }`}
                  >
                    <span className='block font-semibold'>{nombre}</span>
                    <span className='block text-xs text-[#3d2b1f]/60'>{detalle}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor='flyer-titulo' className={lbl}>
                Título
              </label>
              <input
                id='flyer-titulo'
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={MAX_TITULO_FLYER}
                placeholder={TITULO_FLYER_DEFAULT}
                className={inp}
              />
            </div>
            <div>
              <label htmlFor='flyer-cupon' className={lbl}>
                Cupón (opcional)
              </label>
              <input
                id='flyer-cupon'
                value={cupon}
                onChange={(e) => setCupon(e.target.value)}
                maxLength={MAX_CUPON_FLYER}
                placeholder='Ej: HOLA10'
                className={`${inp} uppercase`}
              />
              {!cuponValido && <p className='text-xs text-red-600 mt-1'>Solo letras, números y guiones.</p>}
              <p className='text-xs text-[#3d2b1f]/50 mt-1'>Solo se muestra el texto en la imagen; el cupón se crea en Descuentos.</p>
            </div>
            <label className='flex items-start gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={usarFotos}
                onChange={(e) => setUsarFotos(e.target.checked)}
                className='h-4 w-4 mt-0.5 accent-[#c47c2b]'
              />
              <span>
                <span className='block text-sm font-medium text-[#3d2b1f]'>Usar fotos reales</span>
                <span className='block text-xs text-[#3d2b1f]/50'>Los productos con fotos muestran la primera en lugar de la ilustración.</span>
              </span>
            </label>
          </section>
        </div>

        {/* Vista previa */}
        <section className='bg-white rounded-2xl border border-[#f0e6d3] p-4 lg:sticky lg:top-0'>
          <h3 className='text-sm font-semibold text-[#3d2b1f] mb-3'>Vista previa</h3>
          <div className='flex justify-center'>
            <div
              className='relative w-full max-w-sm bg-[#faf6ef] rounded-xl overflow-hidden flex items-center justify-center'
              style={{ aspectRatio: formato === 'cuadrado' ? '1 / 1' : '9 / 16' }}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt='Vista previa del flyer' className='w-full h-full object-contain' />
              ) : (
                <p className='text-sm text-[#3d2b1f]/50 px-6 text-center'>
                  {seleccion.length === 0 ? 'Elegí al menos un producto para ver el flyer.' : ''}
                </p>
              )}
              {generando && (
                <div className='absolute inset-0 bg-white/50 flex items-center justify-center'>
                  <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
                </div>
              )}
            </div>
          </div>
          {errorPreview && (
            <p className='flex items-center gap-2 text-sm text-red-600 mt-3'>
              <AlertCircle className='h-4 w-4 shrink-0' /> {errorPreview}
            </p>
          )}
          <div className='flex flex-wrap gap-2 mt-4'>
            <button
              type='button'
              onClick={descargar}
              disabled={!previewUrl || generando || accionando}
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c47c2b] text-white text-sm font-medium hover:bg-[#b06f26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <Download className='h-4 w-4' /> Descargar PNG
            </button>
            {puedeCompartir && (
              <button
                type='button'
                onClick={compartir}
                disabled={!previewUrl || generando || accionando}
                className='flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#c47c2b] text-[#c47c2b] text-sm font-medium hover:bg-[#c47c2b]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                <Share2 className='h-4 w-4' /> Compartir
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
