// src/app/dashboard/ventas/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Loader2, Search, ChevronDown, ChevronUp, TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react'

type Periodo = 'hoy' | '7d' | '30d' | 'todo'

interface Item {
  emoji: string
  nombre: string
  cantidad: number
  subtotal: number
  precio: number
}

interface Pedido {
  id: string
  nombre: string
  numero: number
  telefono: string
  created_at: string
  items: string | Item[]
  direccion: string
  notas?: string
  total: number
  estado: string
}

export default function VentasPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [totales, setTotales] = useState({
    ingresos: 0,
    pedidos: 0,
    clientes: 0,
    promedio: 0
  })
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)

      let query = supabase
        .from('pedidos_detalle')
        .select('*')
        .eq('estado', 'entregado')
        .order('created_at', { ascending: false })

      if (periodo !== 'todo') {
        const desde = new Date()
        if (periodo === 'hoy') desde.setHours(0, 0, 0, 0)
        if (periodo === '7d') desde.setDate(desde.getDate() - 7)
        if (periodo === '30d') desde.setDate(desde.getDate() - 30)
        query = query.gte('created_at', desde.toISOString())
      }

      const { data } = await query
      const resultado = data ?? []
      setPedidos(resultado)

      const ingresos = resultado.reduce((a: number, p: Pedido) => a + p.total, 0)
      const clientes = new Set(resultado.map((p: Pedido) => p.telefono)).size

      setTotales({
        ingresos,
        pedidos: resultado.length,
        clientes,
        promedio: resultado.length > 0 ? ingresos / resultado.length : 0
      })

      setLoading(false)
    }

    cargar()
  }, [periodo])

  const filtrados = pedidos.filter(
    (p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.telefono.includes(busqueda)
  )

  const periodos: { value: Periodo; label: string }[] = [
    { value: 'hoy', label: 'Hoy' },
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: 'todo', label: 'Todo' }
  ]

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-[#3d2b1f]'>Ventas</h2>
        <p className='text-[#8a7060] text-sm mt-1'>Pedidos entregados agrupados por cliente</p>
      </div>

      {/* Período */}
      <div className='flex gap-2 flex-wrap'>
        {periodos.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriodo(p.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              periodo === p.value
                ? 'bg-[#3d2b1f] text-white'
                : 'bg-white text-[#8a7060] border border-[#f0e6d3] hover:border-[#c47c2b]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          {
            label: 'Ingresos',
            value: `$${totales.ingresos.toFixed(0)}`,
            icon: DollarSign,
            color: 'bg-green-50 text-green-600'
          },
          { label: 'Pedidos', value: totales.pedidos, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
          { label: 'Clientes únicos', value: totales.clientes, icon: Users, color: 'bg-purple-50 text-purple-600' },
          {
            label: 'Ticket promedio',
            value: `$${totales.promedio.toFixed(0)}`,
            icon: TrendingUp,
            color: 'bg-[#fef3d0] text-[#c47c2b]'
          }
        ].map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className='bg-white rounded-2xl p-5 border border-[#f0e6d3]'>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                <Icon className='h-4 w-4' />
              </div>
              <div className='text-2xl font-bold text-[#3d2b1f]'>{c.value}</div>
              <div className='text-xs text-[#8a7060] mt-0.5'>{c.label}</div>
            </div>
          )
        })}
      </div>

      {/* Buscador */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060]' />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder='Buscar por nombre o teléfono...'
          className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] bg-white'
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className='flex justify-center py-20'>
          <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
        </div>
      ) : filtrados.length === 0 ? (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] p-12 text-center text-[#8a7060] text-sm'>
          {busqueda ? 'No hay ventas que coincidan con la búsqueda' : 'No hay ventas entregadas en este período'}
        </div>
      ) : (
        <div className='space-y-3'>
          {filtrados.map((pedido) => {
            const items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items ?? [])
            const abierto = expandido === pedido.id

            return (
              <div key={pedido.id} className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
                {/* Fila principal */}
                <div
                  className='flex items-center gap-4 p-4 cursor-pointer hover:bg-[#faf6ef] transition-colors'
                  onClick={() => setExpandido(abierto ? null : pedido.id)}
                >
                  {/* Avatar */}
                  <div className='w-10 h-10 bg-[#f0e6d3] rounded-xl flex items-center justify-center flex-shrink-0 text-lg'>
                    👤
                  </div>

                  {/* Info */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-[#3d2b1f]'>{pedido.nombre}</span>
                      <span className='text-xs text-[#8a7060] bg-[#f0e6d3] px-2 py-0.5 rounded-full'>
                        #{pedido.numero}
                      </span>
                    </div>
                    <div className='flex items-center gap-3 mt-0.5 flex-wrap'>
                      <span className='text-xs text-[#8a7060]'>{pedido.telefono}</span>
                      <span className='text-xs text-[#8a7060]'>
                        {new Date(pedido.created_at).toLocaleDateString('es-UY', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className='text-xs text-[#8a7060]'>
                        {items.length} producto{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Total y chevron */}
                  <div className='flex items-center gap-3 flex-shrink-0'>
                    <span className='text-lg font-bold text-[#c47c2b]' style={{ fontFamily: 'Georgia, serif' }}>
                      ${pedido.total}
                    </span>
                    {abierto ? (
                      <ChevronUp className='h-4 w-4 text-[#8a7060]' />
                    ) : (
                      <ChevronDown className='h-4 w-4 text-[#8a7060]' />
                    )}
                  </div>
                </div>

                {/* Detalle */}
                {abierto && (
                  <div className='border-t border-[#f0e6d3] p-4 space-y-3'>
                    {/* Dirección */}
                    <div className='text-xs text-[#8a7060]'>
                      📍 {pedido.direccion}
                      {pedido.notas && <span className='ml-3'>📝 {pedido.notas}</span>}
                    </div>

                    {/* Productos */}
                    <div className='bg-[#faf6ef] rounded-xl p-3 space-y-2'>
                      {items.map((item: Item, i: number) => (
                        <div key={i} className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='text-base'>{item.emoji}</span>
                            <span className='text-sm text-[#3d2b1f]'>{item.nombre}</span>
                            <span className='text-xs text-[#8a7060] bg-white px-2 py-0.5 rounded-full border border-[#f0e6d3]'>
                              x{item.cantidad}
                            </span>
                          </div>
                          <div className='text-right'>
                            <span className='text-sm font-medium text-[#3d2b1f]'>${item.subtotal}</span>
                            <span className='text-xs text-[#8a7060] ml-1'>(${item.precio} c/u)</span>
                          </div>
                        </div>
                      ))}

                      {/* Total */}
                      <div className='flex justify-between items-center pt-2 border-t border-[#f0e6d3]'>
                        <span className='text-sm font-bold text-[#3d2b1f]'>Total del pedido</span>
                        <span className='text-base font-bold text-[#c47c2b]'>${pedido.total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
