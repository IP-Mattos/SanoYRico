// src/app/dashboard/pedidos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { type Pedido, type EstadoPedido } from '@/lib/types'
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ShoppingCart,
  X,
  Send,
  CreditCard,
  Download,
  Search,
  MessageCircle,
  type LucideIcon
} from 'lucide-react'

interface PedidoItem {
  emoji: string
  nombre: string
  cantidad: number
  subtotal: string | number
}

const ESTADOS: { value: EstadoPedido; label: string; color: string; icon: LucideIcon }[] = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: CheckCircle },
  { value: 'entregado', label: 'Entregado', color: 'bg-green-50 text-green-600 border-green-200', icon: Truck },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-50 text-red-500 border-red-200', icon: XCircle }
]

const PER_PAGE = 15

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<EstadoPedido | 'todos'>('todos')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  // Modal confirmación
  const [modalConfirmar, setModalConfirmar] = useState<{ pedido: Pedido } | null>(null)
  const [nroRastreo, setNroRastreo] = useState('')
  const [enviando, setEnviando] = useState(false)

  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase.from('pedidos_detalle').select('*')
    setPedidos(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    ;(async () => {
      await cargar()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pedir permiso de notificaciones al montar
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('pedidos_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          cargar()
          if (
            payload.eventType === 'INSERT' &&
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted'
          ) {
            new Notification('🛒 Nuevo pedido recibido', {
              body: `${payload.new.nombre ?? 'Cliente'} — $${payload.new.total ?? ''}`,
              icon: '/favicon.ico'
            })
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cambiarEstado = async (id: string, estado: EstadoPedido, pedido?: Pedido) => {
    // Si es confirmado, abrir modal primero
    if (estado === 'confirmado' && pedido) {
      setNroRastreo('')
      setModalConfirmar({ pedido })
      return
    }

    setActualizando(id)
    await supabase.from('pedidos').update({ estado }).eq('id', id)
    await cargar()
    setActualizando(null)

    // Email al cliente para entregado/cancelado
    if (estado === 'entregado' || estado === 'cancelado') {
      fetch(`/api/pedidos/${id}/notificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      }).catch(() => {})
    }
  }

  const confirmarYNotificar = async () => {
    if (!modalConfirmar) return
    const { pedido } = modalConfirmar
    setEnviando(true)

    // Cambiar estado en DB
    await supabase.from('pedidos').update({ estado: 'confirmado' }).eq('id', pedido.id)
    await cargar()

    // Email de confirmación al cliente (si dejó email)
    fetch(`/api/pedidos/${pedido.id}/confirmar-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nroRastreo: nroRastreo.trim() || undefined })
    }).catch(() => {})

    setEnviando(false)
    setModalConfirmar(null)
    setNroRastreo('')
  }

  const exportarCSV = () => {
    const headers = ['#', 'Nombre', 'Teléfono', 'Email', 'Dirección', 'Pago', 'Estado', 'Total', 'Fecha']
    const rows = pedidos.map(p => [
      p.numero,
      p.nombre,
      p.telefono,
      p.email ?? '',
      p.direccion,
      p.metodo_pago ?? '',
      p.estado,
      p.total,
      new Date(p.created_at).toLocaleDateString('es-UY')
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Apply estado filter
  const porEstado = filtro === 'todos' ? pedidos : pedidos.filter((p) => p.estado === filtro)

  // Apply search filter
  const busquedaTrim = busqueda.trim()
  const filtrados = busquedaTrim === ''
    ? porEstado
    : porEstado.filter((p) => {
        const query = busquedaTrim.toLowerCase()
        if (p.nombre.toLowerCase().includes(query)) return true
        if (/^\d+$/.test(busquedaTrim) && String(p.numero) === busquedaTrim) return true
        return false
      })

  // Pagination
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PER_PAGE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const paginados = filtrados.slice((paginaActual - 1) * PER_PAGE, paginaActual * PER_PAGE)

  // Reset to page 1 when filter or search changes
  const handleFiltro = (value: EstadoPedido | 'todos') => {
    setFiltro(value)
    setPagina(1)
  }

  const handleBusqueda = (value: string) => {
    setBusqueda(value)
    setPagina(1)
  }

  const contadores = ESTADOS.reduce(
    (acc, e) => {
      acc[e.value] = pedidos.filter((p) => p.estado === e.value).length
      return acc
    },
    {} as Record<string, number>
  )

  const getEstado = (value: string) => ESTADOS.find((e) => e.value === value) ?? ESTADOS[0]

  if (loading)
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
      </div>
    )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-[#3d2b1f]'>Pedidos</h2>
          <p className='text-[#8a7060] text-sm mt-1'>{pedidos.length} pedidos en total</p>
        </div>
        <button
          onClick={exportarCSV}
          className='flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#f0e6d3] text-sm text-[#8a7060] hover:border-[#c47c2b] hover:text-[#3d2b1f] transition-all shrink-0'
        >
          <Download className='h-4 w-4' />
          Exportar CSV
        </button>
      </div>

      {/* Cards por estado */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        {ESTADOS.map((e) => {
          const Icon = e.icon
          return (
            <button
              key={e.value}
              onClick={() => handleFiltro(filtro === e.value ? 'todos' : e.value)}
              className={`bg-white rounded-2xl p-4 border text-left transition-all ${
                filtro === e.value ? 'border-[#c47c2b] shadow-md' : 'border-[#f0e6d3] hover:border-[#c47c2b]/50'
              }`}
            >
              <div
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium mb-2 ${e.color}`}
              >
                <Icon className='h-3 w-3' />
                {e.label}
              </div>
              <div className='text-2xl font-bold text-[#3d2b1f]'>{contadores[e.value] ?? 0}</div>
            </button>
          )
        })}
      </div>

      {filtro !== 'todos' && (
        <button
          onClick={() => handleFiltro('todos')}
          className='text-sm text-[#8a7060] hover:text-[#3d2b1f] transition-colors'
        >
          ← Ver todos los pedidos
        </button>
      )}

      {/* Search bar */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060] pointer-events-none' />
        <input
          type='text'
          value={busqueda}
          onChange={(e) => handleBusqueda(e.target.value)}
          placeholder='Buscar por nombre o número de pedido…'
          className='w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] placeholder:text-[#8a7060] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] bg-white transition-all'
        />
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] p-12 text-center'>
          <ShoppingCart className='h-10 w-10 text-[#f0e6d3] mx-auto mb-3' />
          <p className='text-[#8a7060] text-sm'>No hay pedidos en este estado</p>
        </div>
      ) : (
        <>
          <div className='space-y-3'>
            {paginados.map((pedido) => {
              const esMpPendiente = pedido.estado === 'pendiente' && pedido.metodo_pago === 'mercadopago'
              const estado = esMpPendiente
                ? { ...getEstado('pendiente'), label: 'En pago', color: 'bg-blue-50 text-blue-600 border-blue-200' }
                : getEstado(pedido.estado)
              const Icon = estado.icon
              const abierto = expandido === pedido.id
              const items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items ?? [])

              return (
                <div key={pedido.id} className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
                  {/* Cabecera */}
                  <div
                    className='flex items-center gap-4 p-4 cursor-pointer hover:bg-[#faf6ef] transition-colors'
                    onClick={() => setExpandido(abierto ? null : pedido.id)}
                  >
                    <div className='w-10 h-10 bg-[#f0e6d3] rounded-xl flex items-center justify-center shrink-0'>
                      <span className='text-sm font-bold text-[#3d2b1f]'>#{pedido.numero}</span>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-sm font-semibold text-[#3d2b1f]'>{pedido.nombre}</span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-medium ${estado.color}`}
                        >
                          <Icon className='h-3 w-3' />
                          {estado.label}
                        </span>
                      </div>
                      <div className='flex items-center gap-3 mt-0.5 flex-wrap'>
                        <span className='text-xs text-[#8a7060]'>
                          {new Date(pedido.created_at).toLocaleDateString('es-UY', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className='text-xs text-[#8a7060]'>
                          {items.length} producto{items.length !== 1 ? 's' : ''}
                        </span>
                        <span className='text-sm font-bold text-[#c47c2b]'>${pedido.total}</span>
                      </div>
                    </div>
                    <div className='text-[#8a7060] shrink-0'>
                      {abierto ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {abierto && (
                    <div className='border-t border-[#f0e6d3] p-4 space-y-4'>
                      {/* Info cliente */}
                      <div className='grid sm:grid-cols-3 gap-3'>
                        <div className='flex items-start gap-2'>
                          <Phone className='h-4 w-4 text-[#8a7060] mt-0.5 shrink-0' />
                          <div>
                            <p className='text-xs text-[#8a7060]'>Teléfono</p>
                            <p className='text-sm font-medium text-[#3d2b1f]'>{pedido.telefono}</p>
                          </div>
                        </div>
                        <div className='flex items-start gap-2'>
                          <MapPin className='h-4 w-4 text-[#8a7060] mt-0.5 shrink-0' />
                          <div>
                            <p className='text-xs text-[#8a7060]'>Dirección</p>
                            <p className='text-sm font-medium text-[#3d2b1f]'>{pedido.direccion}</p>
                          </div>
                        </div>
                        {pedido.metodo_pago && (
                          <div className='flex items-start gap-2'>
                            <CreditCard className='h-4 w-4 text-[#8a7060] mt-0.5 shrink-0' />
                            <div>
                              <p className='text-xs text-[#8a7060]'>Método de pago</p>
                              <p className='text-sm font-medium text-[#3d2b1f] capitalize'>
                                {{ transferencia: '🏦 Transferencia', deposito: '🏧 Depósito', mercadopago: '💳 Mercado Pago' }[pedido.metodo_pago] ?? pedido.metodo_pago}
                              </p>
                            </div>
                          </div>
                        )}
                        {pedido.notas && (
                          <div className='flex items-start gap-2'>
                            <FileText className='h-4 w-4 text-[#8a7060] mt-0.5 shrink-0' />
                            <div>
                              <p className='text-xs text-[#8a7060]'>Notas</p>
                              <p className='text-sm text-[#3d2b1f]'>{pedido.notas}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className='bg-[#faf6ef] rounded-xl p-3 space-y-2'>
                        {items.map((item: PedidoItem, i: number) => (
                          <div key={i} className='flex items-center justify-between text-sm'>
                            <span className='text-[#3d2b1f]'>
                              {item.emoji} {item.nombre}
                              <span className='text-[#8a7060] ml-1'>x{item.cantidad}</span>
                            </span>
                            <span className='font-medium text-[#3d2b1f]'>${item.subtotal}</span>
                          </div>
                        ))}
                        <div className='flex justify-between text-sm font-bold pt-2 border-t border-[#f0e6d3]'>
                          <span className='text-[#3d2b1f]'>Total</span>
                          <span className='text-[#c47c2b]'>${pedido.total}</span>
                        </div>
                      </div>

                      {/* Cambiar estado */}
                      <div>
                        <p className='text-xs text-[#8a7060] mb-2 font-medium uppercase tracking-wider'>Cambiar estado</p>
                        <div className='flex flex-wrap gap-2'>
                          {ESTADOS.map((e) => {
                            const EIcon = e.icon
                            const esActual = pedido.estado === e.value
                            return (
                              <button
                                key={e.value}
                                onClick={() => cambiarEstado(pedido.id, e.value, pedido)}
                                disabled={esActual || actualizando === pedido.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                  esActual
                                    ? `${e.color} cursor-default`
                                    : 'bg-white border-[#f0e6d3] text-[#8a7060] hover:border-[#c47c2b] hover:text-[#3d2b1f]'
                                } disabled:opacity-60`}
                              >
                                {actualizando === pedido.id && esActual ? (
                                  <Loader2 className='h-3 w-3 animate-spin' />
                                ) : (
                                  <EIcon className='h-3 w-3' />
                                )}
                                {e.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPaginas > 1 && (
            <div className='flex items-center justify-between pt-2'>
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className='px-4 py-2 rounded-xl border border-[#f0e6d3] text-sm text-[#8a7060] hover:border-[#c47c2b] hover:text-[#3d2b1f] transition-all disabled:opacity-40 disabled:cursor-not-allowed'
              >
                ← Anterior
              </button>
              <span className='text-sm text-[#8a7060]'>
                Página <span className='font-semibold text-[#3d2b1f]'>{paginaActual}</span> de{' '}
                <span className='font-semibold text-[#3d2b1f]'>{totalPaginas}</span>
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className='px-4 py-2 rounded-xl border border-[#f0e6d3] text-sm text-[#8a7060] hover:border-[#c47c2b] hover:text-[#3d2b1f] transition-all disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── MODAL CONFIRMAR ── */}
      {modalConfirmar && (
        <div className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl w-full max-w-md shadow-xl'>
            <div className='flex items-center justify-between p-5 border-b border-[#f0e6d3]'>
              <h3 className='text-base font-bold text-[#3d2b1f]'>Confirmar pedido #{modalConfirmar.pedido.numero}</h3>
              <button onClick={() => setModalConfirmar(null)} className='text-[#8a7060] hover:text-[#3d2b1f]'>
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='p-5 space-y-4'>
              {/* Info cliente */}
              <div className='bg-[#faf6ef] rounded-xl p-3 text-sm text-[#3d2b1f]'>
                <p>
                  <span className='text-[#8a7060]'>Cliente:</span> {modalConfirmar.pedido.nombre}
                </p>
                <p>
                  <span className='text-[#8a7060]'>Teléfono:</span> {modalConfirmar.pedido.telefono}
                </p>
                <p>
                  <span className='text-[#8a7060]'>Total:</span>{' '}
                  <span className='font-bold text-[#c47c2b]'>${modalConfirmar.pedido.total}</span>
                </p>
              </div>

              {/* Número de rastreo */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>
                  Número de rastreo <span className='text-[#8a7060] font-normal'>(opcional)</span>
                </label>
                <input
                  value={nroRastreo}
                  onChange={(e) => setNroRastreo(e.target.value)}
                  placeholder='Ej: UY123456789'
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
                <p className='text-xs text-[#8a7060] mt-1'>
                  Si lo completás, se incluye en el email al cliente.
                </p>
              </div>

              <div className='flex gap-3 pt-1'>
                <button
                  onClick={() => setModalConfirmar(null)}
                  className='flex-1 px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#8a7060] hover:bg-[#faf6ef] transition-colors'
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarYNotificar}
                  disabled={enviando}
                  className='flex-1 flex items-center justify-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60'
                >
                  {enviando ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                  Confirmar y enviar email
                </button>
              </div>

              {/* WhatsApp opcional */}
              <button
                onClick={() => {
                  const p = modalConfirmar.pedido
                  const tel = p.telefono.replace(/\D/g, '').replace(/^0/, '').replace(/^598/, '')
                  const rastreo = nroRastreo.trim()
                  const texto = encodeURIComponent(
                    `Hola ${p.nombre}! Tu pedido #${p.numero} de Sano y Rico fue confirmado.` +
                    (rastreo ? ` Número de rastreo: ${rastreo}.` : '') +
                    ` Total: $${p.total}. ¡Gracias por elegirnos! 🌿`
                  )
                  window.open(`https://wa.me/598${tel}?text=${texto}`, '_blank')
                }}
                className='w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-green-200 text-sm text-green-700 hover:bg-green-50 transition-colors'
              >
                <MessageCircle className='h-4 w-4' />
                Avisar por WhatsApp (opcional)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
