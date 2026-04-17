// src/app/pedido/page.tsx
'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import {
  Loader2,
  Search,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  MessageCircle,
  RefreshCw
} from 'lucide-react'

interface PedidoItem {
  emoji: string
  nombre: string
  cantidad: number
  precio: number
  subtotal: number
}

interface Pedido {
  id?: string
  numero: number
  estado: 'pendiente' | 'confirmado' | 'entregado' | 'cancelado'
  metodo_pago?: string | null
  items: string | PedidoItem[]
  total: number
  nombre: string
  direccion: string
  notas?: string
  created_at: string
  telefono: string
}

const ESTADOS = {
  pendiente: {
    label: 'Recibido',
    emoji: '📬',
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    bar: 'bg-yellow-400',
    desc: 'Recibimos tu pedido y lo estamos revisando. En breve te confirmamos.',
    icon: Clock
  },
  en_pago: {
    label: 'Procesando pago',
    emoji: '💳',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    bar: 'bg-blue-300',
    desc: 'Estamos esperando la confirmación del pago. Una vez acreditado, tu pedido queda confirmado automáticamente.',
    icon: Clock
  },
  confirmado: {
    label: 'En preparación',
    emoji: '👩‍🍳',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    bar: 'bg-blue-400',
    desc: 'Tu pedido está confirmado y lo estamos preparando con mucho cariño.',
    icon: CheckCircle
  },
  entregado: {
    label: 'Entregado',
    emoji: '🎉',
    color: 'text-green-700 bg-green-50 border-green-200',
    bar: 'bg-green-500',
    desc: '¡Tu pedido llegó! Gracias por elegir Sano y Rico.',
    icon: Truck
  },
  cancelado: {
    label: 'Cancelado',
    emoji: '😔',
    color: 'text-red-600 bg-red-50 border-red-200',
    bar: 'bg-red-400',
    desc: 'Tu pedido fue cancelado. Escribinos por WhatsApp para más información.',
    icon: XCircle
  }
}

const PASOS = [
  { key: 'pendiente', label: 'Recibido', icon: Clock },
  { key: 'confirmado', label: 'En preparación', icon: CheckCircle },
  { key: 'entregado', label: 'Entregado', icon: Truck }
]

function SeguimientoContent() {
  const searchParams = useSearchParams()
  const [busqueda, setBusqueda] = useState(searchParams.get('q') ?? '')
  const [loading, setLoading] = useState(false)
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [error, setError] = useState('')
  const [intentos, setIntentos] = useState(0)
  const [telefonoWA, setTelefonoWA] = useState<string | null>(null)
  const [reordenando, setReordenando] = useState(false)
  const [reorderAviso, setReorderAviso] = useState<string | null>(null)
  const { agregar, cambiarCantidad, setIsOpen } = useCart()
  const supabase = createClient()

  // ── Fetch del teléfono para WhatsApp (del config) ──
  useEffect(() => {
    supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'general')
      .single()
      .then(({ data }) => {
        const t = (data?.valor as { telefono?: string } | null)?.telefono
        if (t) setTelefonoWA(t)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Búsqueda ──────────────────────────────────────────────────────────
  const buscarPor = useCallback(
    async (q: string) => {
      const v = q.trim()
      if (!v) return
      setLoading(true)
      setError('')
      setPedido(null)

      const esNumero = /^\d{1,6}$/.test(v)
      let query = supabase.from('pedidos_detalle').select('*')
      if (esNumero) {
        query = query.eq('numero', parseInt(v))
      } else {
        const tel = v.replace(/\D/g, '').replace(/^0/, '').replace(/^598/, '')
        query = query.ilike('telefono', `%${tel}%`)
      }

      const { data } = await query.order('created_at', { ascending: false }).limit(1).single()

      if (!data) {
        setIntentos((prev) => prev + 1)
        setError(
          intentos >= 1
            ? 'Seguimos sin encontrar tu pedido. Probá con tu teléfono en lugar del número, o viceversa.'
            : 'No encontramos ningún pedido con ese dato.'
        )
      } else {
        const { data: extra } = await supabase.from('pedidos').select('metodo_pago').eq('id', data.id).single()
        setPedido({ ...data, metodo_pago: extra?.metodo_pago ?? null })
      }

      setLoading(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intentos]
  )

  const buscar = () => buscarPor(busqueda)

  // ── Auto-buscar si vino ?q= del Cart (flow post-compra) ──
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) buscarPor(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Realtime: actualizar estado cuando cambia en DB ──
  useEffect(() => {
    if (!pedido) return
    const channel = supabase
      .channel(`pedido-${pedido.numero}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `numero=eq.${pedido.numero}` },
        (payload) => {
          setPedido((prev) => (prev ? { ...prev, estado: payload.new.estado } : prev))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido?.numero])

  // ── Re-order: matchear items por nombre, recargar precio/stock actual y abrir cart ──
  const pedirLoMismo = async () => {
    if (!pedido) return
    setReordenando(true)
    setReorderAviso(null)

    const items = typeof pedido.items === 'string' ? (JSON.parse(pedido.items) as PedidoItem[]) : pedido.items
    const nombres = items.map((i) => i.nombre)

    const { data: productos } = await supabase
      .from('productos')
      .select('id, nombre, emoji, precio, stock')
      .in('nombre', nombres)
      .eq('activo', true)

    const faltantes: string[] = []
    items.forEach((item) => {
      const producto = productos?.find((p) => p.nombre === item.nombre)
      if (!producto || producto.stock === 0) {
        faltantes.push(item.nombre)
        return
      }
      agregar({
        producto_id: producto.id,
        nombre: producto.nombre,
        emoji: producto.emoji ?? item.emoji,
        precio: producto.precio
      })
      if (item.cantidad > 1) cambiarCantidad(producto.id, item.cantidad)
    })

    if (faltantes.length > 0) {
      setReorderAviso(
        faltantes.length === items.length
          ? 'Ninguno de los productos de ese pedido está disponible ahora. Mirá el catálogo actualizado.'
          : `${faltantes.length === 1 ? 'Un producto no está' : `${faltantes.length} productos no están`} disponibles: ${faltantes.join(', ')}.`
      )
    } else {
      setReorderAviso('Agregamos todo a tu carrito. Revisá y confirmá.')
    }

    setReordenando(false)
    setIsOpen(true)
  }

  const estadoKey =
    pedido?.estado === 'pendiente' && pedido?.metodo_pago === 'mercadopago' ? 'en_pago' : pedido?.estado
  const estado = estadoKey ? ESTADOS[estadoKey as keyof typeof ESTADOS] : null
  const pasoIdx = PASOS.findIndex((p) => p.key === pedido?.estado)
  const cancelado = pedido?.estado === 'cancelado'
  const entregado = pedido?.estado === 'entregado'
  const items = pedido ? (typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items ?? [])) : []

  const waHref = (msg: string) =>
    telefonoWA ? `https://wa.me/${telefonoWA}?text=${encodeURIComponent(msg)}` : '#'

  return (
    <div className='min-h-screen bg-[#faf6ef] pt-16'>
      <div className='max-w-lg mx-auto px-4 py-10'>
        {/* Hero */}
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-[#f0e6d3] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl'>
            📦
          </div>
          <h1
            className='text-2xl sm:text-3xl font-black text-[#3d2b1f] mb-2'
            style={{ fontFamily: 'Georgia, serif' }}
          >
            ¿Cómo va tu pedido?
          </h1>
          <p className='text-[#8a7060] text-sm'>Ingresá el número de pedido o tu teléfono.</p>
        </div>

        {/* Buscador */}
        <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5 mb-6 shadow-sm'>
          <label htmlFor='q' className='sr-only'>
            Número de pedido o teléfono
          </label>
          <div className='flex gap-2'>
            <input
              id='q'
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder='Ej: 42  o  091 199 299'
              className='flex-1 px-4 py-3 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] focus:border-[#c47c2b] placeholder:text-[#c4b0a0]'
              autoFocus
            />
            <button
              onClick={buscar}
              disabled={loading || !busqueda.trim()}
              className='inline-flex items-center justify-center gap-1.5 bg-[#3d2b1f] text-white px-4 sm:px-5 py-3 rounded-xl text-sm font-semibold leading-none hover:bg-[#c47c2b] active:scale-95 transition-all disabled:opacity-50'
            >
              {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
              <span className='hidden sm:inline'>Buscar</span>
            </button>
          </div>
          <p className='text-xs text-[#8a7060] mt-3'>
            Podés buscar por el <strong className='text-[#3d2b1f] font-semibold'>número</strong> del pedido o por tu{' '}
            <strong className='text-[#3d2b1f] font-semibold'>teléfono</strong>.
          </p>

          {error && (
            <div className='mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3'>
              <p className='text-sm text-red-600'>{error}</p>
              {intentos >= 1 && telefonoWA && (
                <a
                  href={waHref('Hola! Estoy buscando mi pedido y no lo encuentro.')}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1.5 text-xs text-green-700 font-semibold mt-2 hover:underline'
                >
                  <MessageCircle className='h-3.5 w-3.5' />
                  Escribinos por WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── RESULTADO ── */}
        {pedido && estado && (
          <div className='space-y-4'>
            {/* Card estado */}
            <div className={`rounded-2xl border p-5 ${estado.color}`}>
              <div className='flex items-center gap-3'>
                <span className='text-4xl'>{estado.emoji}</span>
                <div>
                  <p className='text-xs font-medium opacity-70 mb-0.5'>Pedido #{pedido.numero}</p>
                  <h2 className='text-xl font-bold'>{estado.label}</h2>
                  <p className='text-sm opacity-80 mt-0.5'>{estado.desc}</p>
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            {!cancelado && (
              <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
                <div className='flex items-start justify-between relative'>
                  <div className='absolute top-4 left-4 right-4 h-0.5 bg-[#f0e6d3] z-0' />
                  <div
                    className={`absolute top-4 left-4 h-0.5 z-0 transition-all duration-500 ${estado.bar}`}
                    style={{ width: pasoIdx === 0 ? '0%' : pasoIdx === 1 ? '50%' : '100%' }}
                  />
                  {PASOS.map((paso, i) => {
                    const PIcon = paso.icon
                    const activo = i <= pasoIdx
                    return (
                      <div key={paso.key} className='flex flex-col items-center gap-2 z-10 flex-1'>
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            activo
                              ? 'bg-[#3d2b1f] border-[#3d2b1f] text-white'
                              : 'bg-white border-[#f0e6d3] text-[#c4b0a0]'
                          }`}
                        >
                          <PIcon className='h-4 w-4' />
                        </div>
                        <span
                          className={`text-xs font-medium text-center leading-tight ${
                            activo ? 'text-[#3d2b1f]' : 'text-[#c4b0a0]'
                          }`}
                        >
                          {paso.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Productos */}
            <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
              <p className='text-xs font-semibold text-[#8a7060] uppercase tracking-wider mb-3'>Lo que pediste</p>
              <div className='space-y-2.5'>
                {items.map((item: PedidoItem, i: number) => (
                  <div key={i} className='flex items-center gap-3'>
                    <span className='text-2xl'>{item.emoji}</span>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-[#3d2b1f]'>{item.nombre}</p>
                      <p className='text-xs text-[#8a7060]'>
                        {item.cantidad} unidad{item.cantidad !== 1 ? 'es' : ''} × ${item.precio}
                      </p>
                    </div>
                    <span className='text-sm font-bold text-[#3d2b1f]'>${item.subtotal}</span>
                  </div>
                ))}
                <div className='flex justify-between items-center pt-3 border-t border-[#f0e6d3] mt-1'>
                  <span className='text-sm font-bold text-[#3d2b1f]'>Total</span>
                  <span
                    className='text-lg font-black text-[#c47c2b]'
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    ${pedido.total}
                  </span>
                </div>
              </div>
            </div>

            {/* Entrega */}
            <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
              <p className='text-xs font-semibold text-[#8a7060] uppercase tracking-wider mb-3'>
                Dónde lo entregamos
              </p>
              <div className='flex items-start gap-3'>
                <div className='w-8 h-8 bg-[#fef3d0] rounded-xl flex items-center justify-center shrink-0'>
                  <MapPin className='h-4 w-4 text-[#c47c2b]' />
                </div>
                <div>
                  <p className='text-sm font-medium text-[#3d2b1f]'>{pedido.nombre}</p>
                  <p className='text-sm text-[#8a7060]'>{pedido.direccion}</p>
                  {pedido.notas && <p className='text-xs text-[#8a7060] mt-1 italic'>{`"${pedido.notas}"`}</p>}
                  <p className='text-xs text-[#c4b0a0] mt-2 capitalize'>
                    Pedido el{' '}
                    {new Date(pedido.created_at).toLocaleDateString('es-UY', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Aviso de re-order (si aplicó) */}
            {reorderAviso && (
              <div className='bg-[#fef3d0] border border-[#c47c2b]/30 rounded-2xl px-4 py-3 text-sm text-[#8a5a1a]'>
                {reorderAviso}
              </div>
            )}

            {/* Acciones post-pedido */}
            <div className='space-y-2 pt-2'>
              {(entregado || cancelado) && (
                <button
                  onClick={pedirLoMismo}
                  disabled={reordenando}
                  className='w-full inline-flex items-center justify-center gap-2 bg-[#3d2b1f] text-white py-3 rounded-xl text-sm font-semibold leading-none hover:bg-[#c47c2b] active:scale-[0.98] transition-all disabled:opacity-60'
                >
                  {reordenando ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCw className='h-4 w-4' />
                  )}
                  Pedir lo mismo otra vez
                </button>
              )}

              {telefonoWA && (
                <a
                  href={waHref(`Hola! Tengo una duda sobre el pedido #${pedido.numero}.`)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-full inline-flex items-center justify-center gap-2 bg-white border border-[#f0e6d3] text-[#3d2b1f] py-3 rounded-xl text-sm font-semibold leading-none hover:border-[#c47c2b] transition-colors'
                >
                  <MessageCircle className='h-4 w-4 text-green-600' />
                  Consultar por WhatsApp
                </a>
              )}

              <button
                onClick={() => {
                  setPedido(null)
                  setBusqueda('')
                  setError('')
                  setReorderAviso(null)
                  window.history.replaceState(null, '', '/pedido')
                }}
                className='w-full py-2.5 text-sm text-[#8a7060] hover:text-[#3d2b1f] transition-colors'
              >
                Buscar otro pedido
              </button>
            </div>
          </div>
        )}

        {/* Empty state + salida alternativa */}
        {!pedido && !loading && (
          <div className='text-center py-8 space-y-4'>
            {!error && (
              <>
                <Package className='h-10 w-10 mx-auto mb-2 text-[#c4b0a0] opacity-60' />
                <p className='text-sm text-[#8a7060]'>Tu pedido va a aparecer acá una vez que lo busques.</p>
              </>
            )}

            <div className='pt-4 border-t border-[#f0e6d3] space-y-3'>
              <p className='text-xs text-[#8a7060] uppercase tracking-widest font-semibold'>
                ¿Todavía no pediste?
              </p>
              <Link
                href='/#productos'
                className='inline-flex items-center gap-2 bg-[#3d2b1f] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#c47c2b] transition-colors'
              >
                Ver productos
              </Link>
              {telefonoWA && (
                <p className='text-xs text-[#8a7060]'>
                  O si tenés dudas,{' '}
                  <a
                    href={waHref('Hola! Tengo una consulta antes de hacer el pedido.')}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-green-700 font-semibold hover:underline inline-flex items-center gap-1'
                  >
                    <MessageCircle className='h-3 w-3' /> escribinos por WhatsApp
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SeguimientoFallback() {
  return (
    <div className='min-h-screen bg-[#faf6ef] pt-16 flex items-center justify-center'>
      <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
    </div>
  )
}

// useSearchParams requires a Suspense boundary in client components on App Router.
export default function SeguimientoPage() {
  return (
    <Suspense fallback={<SeguimientoFallback />}>
      <SeguimientoContent />
    </Suspense>
  )
}
