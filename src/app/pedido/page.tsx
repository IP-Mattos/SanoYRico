// src/app/pedido/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Loader2,
  Search,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronLeft,
  Phone,
  MapPin,
  Hash
} from 'lucide-react'
import Link from 'next/link'

interface PedidoItem {
  emoji: string
  nombre: string
  cantidad: number
  precio: number
  subtotal: number
}

interface Pedido {
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
    desc: 'Estamos esperando la confirmación del pago. Una vez acreditado, tu pedido quedará confirmado automáticamente.',
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

export default function SeguimientoPage() {
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [error, setError] = useState('')
  const [intentos, setIntentos] = useState(0)
  const supabase = createClient()

  // Realtime: actualizar estado cuando cambia en DB
  useEffect(() => {
    if (!pedido) return
    const channel = supabase
      .channel(`pedido-${pedido.numero}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `numero=eq.${pedido.numero}` },
        (payload) => {
          setPedido((prev) => prev ? { ...prev, estado: payload.new.estado } : prev)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [pedido?.numero])

  const buscar = async () => {
    const q = busqueda.trim()
    if (!q) return

    setLoading(true)
    setError('')
    setPedido(null)

    const esNumero = /^\d{1,6}$/.test(q)
    let query = supabase.from('pedidos_detalle').select('*')

    if (esNumero) {
      query = query.eq('numero', parseInt(q))
    } else {
      const tel = q.replace(/\D/g, '').replace(/^0/, '').replace(/^598/, '')
      query = query.ilike('telefono', `%${tel}%`)
    }

    const { data } = await query.order('created_at', { ascending: false }).limit(1).single()

    if (!data) {
      setIntentos((prev) => prev + 1)
      setError(
        intentos >= 1
          ? 'Seguimos sin encontrar tu pedido. Probá con tu número de teléfono en lugar del número de pedido, o viceversa.'
          : 'No encontramos ningún pedido con ese dato.'
      )
    } else {
      const { data: extra } = await supabase
        .from('pedidos')
        .select('metodo_pago')
        .eq('id', data.id)
        .single()
      setPedido({ ...data, metodo_pago: extra?.metodo_pago ?? null })
    }

    setLoading(false)
  }

  const estadoKey = pedido?.estado === 'pendiente' && pedido?.metodo_pago === 'mercadopago' ? 'en_pago' : pedido?.estado
  const estado = estadoKey ? ESTADOS[estadoKey as keyof typeof ESTADOS] : null
  const pasoIdx = PASOS.findIndex((p) => p.key === pedido?.estado)
  const cancelado = pedido?.estado === 'cancelado'
  const items = pedido ? (typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items ?? [])) : []

  return (
    <div className='min-h-screen bg-[#faf6ef]'>
      {/* Navbar mínimo */}
      <div className='bg-white border-b border-[#f0e6d3] px-6 py-4 flex items-center justify-between'>
        <Link href='/' className='text-[#3d2b1f] text-xl font-bold' style={{ fontFamily: 'Georgia, serif' }}>
          Sano y <span className='text-[#c47c2b] italic'>Rico</span>
        </Link>
        <Link
          href='/'
          className='flex items-center gap-1 text-sm text-[#8a7060] hover:text-[#3d2b1f] transition-colors'
        >
          <ChevronLeft className='h-4 w-4' />
          Volver
        </Link>
      </div>

      <div className='max-w-lg mx-auto px-4 py-10'>
        {/* Hero */}
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-[#f0e6d3] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl'>
            📦
          </div>
          <h1 className='text-2xl font-black text-[#3d2b1f] mb-2' style={{ fontFamily: 'Georgia, serif' }}>
            ¿Cómo va tu pedido?
          </h1>
          <p className='text-[#8a7060] text-sm'>
            Ingresá el <strong>número de pedido</strong> que te enviamos
            <br />o tu <strong>número de teléfono</strong>
          </p>
        </div>

        {/* Buscador */}
        <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5 mb-6 shadow-sm'>
          {/* Opciones de búsqueda */}
          <div className='grid grid-cols-2 gap-2 mb-4'>
            <div className='flex items-center gap-2 bg-[#faf6ef] rounded-xl px-3 py-2'>
              <Hash className='h-4 w-4 text-[#c47c2b] shrink-0' />
              <div>
                <p className='text-xs font-medium text-[#3d2b1f]'>Nro. de pedido</p>
                <p className='text-xs text-[#8a7060]'>Ej: 42</p>
              </div>
            </div>
            <div className='flex items-center gap-2 bg-[#faf6ef] rounded-xl px-3 py-2'>
              <Phone className='h-4 w-4 text-[#c47c2b] shrink-0' />
              <div>
                <p className='text-xs font-medium text-[#3d2b1f]'>Tu teléfono</p>
                <p className='text-xs text-[#8a7060]'>Ej: 091 199 299</p>
              </div>
            </div>
          </div>

          <div className='flex gap-2'>
            <input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder='Número de pedido o teléfono...'
              className='flex-1 px-4 py-3 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] placeholder:text-[#c4b0a0]'
              autoFocus
            />
            <button
              onClick={buscar}
              disabled={loading || !busqueda.trim()}
              className='flex items-center gap-2 bg-[#3d2b1f] text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-50'
            >
              {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className='mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3'>
              <p className='text-sm text-red-600'>{error}</p>
              {intentos >= 1 && (
                <p className='text-xs text-red-500 mt-1'>Si el problema persiste, escribinos por WhatsApp.</p>
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
                  {/* Línea de fondo */}
                  <div className='absolute top-4 left-4 right-4 h-0.5 bg-[#f0e6d3] z-0' />
                  {/* Línea de progreso */}
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
                  <span className='text-sm font-bold text-[#3d2b1f]'>Total pagado</span>
                  <span className='text-lg font-black text-[#c47c2b]' style={{ fontFamily: 'Georgia, serif' }}>
                    ${pedido.total}
                  </span>
                </div>
              </div>
            </div>

            {/* Entrega */}
            <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
              <p className='text-xs font-semibold text-[#8a7060] uppercase tracking-wider mb-3'>Dónde lo entregamos</p>
              <div className='flex items-start gap-3'>
                <div className='w-8 h-8 bg-[#fef3d0] rounded-xl flex items-center justify-center shrink-0'>
                  <MapPin className='h-4 w-4 text-[#c47c2b]' />
                </div>
                <div>
                  <p className='text-sm font-medium text-[#3d2b1f]'>{pedido.nombre}</p>
                  <p className='text-sm text-[#8a7060]'>{pedido.direccion}</p>
                  {pedido.notas && <p className='text-xs text-[#8a7060] mt-1 italic'>{`"${pedido.notas}"`}</p>}
                  <p className='text-xs text-[#c4b0a0] mt-2'>
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

            {/* Buscar otro */}
            <button
              onClick={() => {
                setPedido(null)
                setBusqueda('')
                setError('')
              }}
              className='w-full py-3 text-sm text-[#8a7060] hover:text-[#3d2b1f] transition-colors'
            >
              Buscar otro pedido
            </button>
          </div>
        )}

        {/* Empty state */}
        {!pedido && !error && !loading && (
          <div className='text-center py-8 text-[#c4b0a0]'>
            <Package className='h-10 w-10 mx-auto mb-2 opacity-40' />
            <p className='text-sm'>Tu pedido aparecerá acá</p>
          </div>
        )}
      </div>
    </div>
  )
}
