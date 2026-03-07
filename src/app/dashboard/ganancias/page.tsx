// src/app/dashboard/ganancias/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { type Venta } from '@/lib/types'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { TrendingUp, DollarSign, ShoppingBag, Package, Loader2, Plus, X, AlertCircle } from 'lucide-react'

type Periodo = '7d' | '30d' | '90d'

interface DatoGrafico {
  dia: string
  ingresos: number
  ganancias: number
  ventas: number
}

interface ProductoVendido {
  nombre: string
  unidades: number
  ingresos: number
  ganancia: number
}

interface Producto {
  id: string
  nombre: string
  precio: number
  costo: number
  emoji: string
  activo?: boolean
}

const EMPTY_VENTA = {
  producto_id: '',
  cantidad: 1,
  precio_unitario: 0,
  costo_unitario: 0
}

export default function GananciasPage() {
  const [periodo, setPeriodo] = useState<Periodo>('7d')
  const [datos, setDatos] = useState<DatoGrafico[]>([])
  const [ranking, setRanking] = useState<ProductoVendido[]>([])
  const [totales, setTotales] = useState({ ingresos: 0, ganancias: 0, ventas: 0, margen: 0 })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [form, setForm] = useState(EMPTY_VENTA)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const cargar = async () => {
    setLoading(true)
    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)

    const [ventasRes, prodRes] = await Promise.all([
      supabase.from('ventas').select('*').gte('fecha', desde.toISOString()).order('fecha'),
      supabase.from('productos').select('id, nombre, precio, costo, emoji').eq('activo', true).order('nombre')
    ])

    const ventas: Venta[] = ventasRes.data ?? []
    setProductos(prodRes.data ?? [])

    // Agrupar por día
    const porDia: Record<string, DatoGrafico> = {}
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      porDia[key] = {
        dia: d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' }),
        ingresos: 0,
        ganancias: 0,
        ventas: 0
      }
    }
    ventas.forEach((v) => {
      const key = v.fecha.split('T')[0]
      if (porDia[key]) {
        porDia[key].ingresos += v.total
        porDia[key].ganancias += v.ganancia
        porDia[key].ventas += 1
      }
    })
    setDatos(Object.values(porDia))

    // Totales
    const ingresos = ventas.reduce((a, v) => a + v.total, 0)
    const ganancias = ventas.reduce((a, v) => a + v.ganancia, 0)
    setTotales({
      ingresos,
      ganancias,
      ventas: ventas.length,
      margen: ingresos > 0 ? Math.round((ganancias / ingresos) * 100) : 0
    })

    // Ranking productos
    const agrupado: Record<string, ProductoVendido> = {}
    ventas.forEach((v) => {
      if (!agrupado[v.producto_nombre]) {
        agrupado[v.producto_nombre] = { nombre: v.producto_nombre, unidades: 0, ingresos: 0, ganancia: 0 }
      }
      agrupado[v.producto_nombre].unidades += v.cantidad
      agrupado[v.producto_nombre].ingresos += v.total
      agrupado[v.producto_nombre].ganancia += v.ganancia
    })
    setRanking(Object.values(agrupado).sort((a, b) => b.ingresos - a.ingresos))

    setLoading(false)
  }

  useEffect(() => {
    const loadData = async () => {
      await cargar()
    }
    loadData()
  }, [periodo])

  const seleccionarProducto = (id: string) => {
    const p = productos.find((p) => p.id === id)
    if (p) setForm((f) => ({ ...f, producto_id: id, precio_unitario: p.precio, costo_unitario: p.costo }))
    else setForm((f) => ({ ...f, producto_id: id }))
  }

  const registrarVenta = async () => {
    if (!form.producto_id) {
      setError('Seleccioná un producto')
      return
    }
    if (form.cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0')
      return
    }
    setGuardando(true)
    setError('')

    const p = productos.find((p) => p.id === form.producto_id)
    const total = form.precio_unitario * form.cantidad
    const ganancia = (form.precio_unitario - form.costo_unitario) * form.cantidad

    const { error } = await supabase.from('ventas').insert({
      producto_id: form.producto_id,
      producto_nombre: p?.nombre ?? '',
      cantidad: form.cantidad,
      precio_unitario: form.precio_unitario,
      costo_unitario: form.costo_unitario,
      total,
      ganancia
    })

    if (error) {
      setError(error.message)
      setGuardando(false)
      return
    }

    await cargar()
    setGuardando(false)
    setModalOpen(false)
    setForm(EMPTY_VENTA)
  }

  const cards = [
    {
      label: 'Ingresos',
      value: `$${totales.ingresos.toFixed(0)}`,
      icon: DollarSign,
      color: 'bg-green-50 text-green-600'
    },
    {
      label: 'Ganancias',
      value: `$${totales.ganancias.toFixed(0)}`,
      icon: TrendingUp,
      color: 'bg-[#fef3d0] text-[#c47c2b]'
    },
    { label: 'Ventas', value: totales.ventas, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Margen', value: `${totales.margen}%`, icon: Package, color: 'bg-purple-50 text-purple-600' }
  ]

  if (loading)
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
      </div>
    )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h2 className='text-2xl font-bold text-[#3d2b1f]'>Ganancias</h2>
          <p className='text-[#8a7060] text-sm mt-1'>Resumen financiero del período</p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY_VENTA)
            setError('')
            setModalOpen(true)
          }}
          className='flex items-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors'
        >
          <Plus className='h-4 w-4' />
          Registrar venta
        </button>
      </div>

      {/* Período */}
      <div className='flex gap-2'>
        {(
          [
            { value: '7d', label: 'Últimos 7 días' },
            { value: '30d', label: 'Últimos 30 días' },
            { value: '90d', label: 'Últimos 90 días' }
          ] as const
        ).map((p) => (
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
        {cards.map((c) => {
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

      {/* Gráfico ingresos vs ganancias */}
      <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
        <h3 className='font-semibold text-[#3d2b1f] mb-5'>Ingresos vs Ganancias</h3>
        <ResponsiveContainer width='100%' height={260}>
          <LineChart data={datos} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f0e6d3' />
            <XAxis dataKey='dia' tick={{ fontSize: 11, fill: '#8a7060' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8a7060' }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #f0e6d3', fontSize: '12px' }}
              formatter={(v) => (typeof v === 'number' ? `$${v.toFixed(0)}` : v)}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type='monotone' dataKey='ingresos' name='Ingresos' stroke='#4a6741' strokeWidth={2} dot={false} />
            <Line type='monotone' dataKey='ganancias' name='Ganancias' stroke='#c47c2b' strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico ventas por día */}
      <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
        <h3 className='font-semibold text-[#3d2b1f] mb-5'>Ventas por día</h3>
        <ResponsiveContainer width='100%' height={200}>
          <BarChart data={datos} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f0e6d3' />
            <XAxis dataKey='dia' tick={{ fontSize: 11, fill: '#8a7060' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8a7060' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f0e6d3', fontSize: '12px' }} />
            <Bar dataKey='ventas' name='Ventas' fill='#3d2b1f' radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranking productos */}
      {ranking.length > 0 && (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
          <h3 className='font-semibold text-[#3d2b1f] mb-4'>Productos más vendidos</h3>
          <div className='space-y-3'>
            {ranking.map((p, i) => (
              <div key={p.nombre} className='flex items-center gap-4'>
                <span className='w-6 text-sm font-bold text-[#8a7060]'>#{i + 1}</span>
                <div className='flex-1 min-w-0'>
                  <div className='flex justify-between mb-1'>
                    <span className='text-sm font-medium text-[#3d2b1f] truncate'>{p.nombre}</span>
                    <span className='text-sm font-bold text-[#3d2b1f] ml-2'>${p.ingresos.toFixed(0)}</span>
                  </div>
                  <div className='h-1.5 bg-[#f0e6d3] rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-[#c47c2b] rounded-full'
                      style={{ width: `${(p.ingresos / ranking[0].ingresos) * 100}%` }}
                    />
                  </div>
                  <div className='flex justify-between mt-1'>
                    <span className='text-xs text-[#8a7060]'>{p.unidades} unidades</span>
                    <span className='text-xs text-[#4a6741]'>ganancia: ${p.ganancia.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ranking.length === 0 && (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] p-12 text-center text-[#8a7060] text-sm'>
          No hay ventas registradas en este período. Registrá tu primera venta con el botón de arriba.
        </div>
      )}

      {/* Modal registrar venta */}
      {modalOpen && (
        <div className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl w-full max-w-md shadow-xl'>
            <div className='flex items-center justify-between p-6 border-b border-[#f0e6d3]'>
              <h3 className='text-lg font-bold text-[#3d2b1f]'>Registrar venta</h3>
              <button onClick={() => setModalOpen(false)} className='text-[#8a7060] hover:text-[#3d2b1f]'>
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='p-6 space-y-4'>
              {/* Producto */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Producto *</label>
                <select
                  value={form.producto_id}
                  onChange={(e) => seleccionarProducto(e.target.value)}
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] bg-white'
                >
                  <option value=''>Seleccioná un producto</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Cantidad *</label>
                <input
                  type='number'
                  min={1}
                  value={form.cantidad}
                  onChange={(e) => setForm((f) => ({ ...f, cantidad: Number(e.target.value) }))}
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
              </div>

              {/* Precio y costo */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Precio unitario</label>
                  <input
                    type='number'
                    value={form.precio_unitario}
                    onChange={(e) => setForm((f) => ({ ...f, precio_unitario: Number(e.target.value) }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Costo unitario</label>
                  <input
                    type='number'
                    value={form.costo_unitario}
                    onChange={(e) => setForm((f) => ({ ...f, costo_unitario: Number(e.target.value) }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
              </div>

              {/* Preview total */}
              {form.producto_id && form.cantidad > 0 && (
                <div className='bg-[#faf6ef] rounded-xl p-4 grid grid-cols-2 gap-3 text-center'>
                  <div>
                    <div className='text-xs text-[#8a7060]'>Total venta</div>
                    <div className='text-xl font-bold text-[#3d2b1f]'>
                      ${(form.precio_unitario * form.cantidad).toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-[#8a7060]'>Ganancia</div>
                    <div className='text-xl font-bold text-[#4a6741]'>
                      ${((form.precio_unitario - form.costo_unitario) * form.cantidad).toFixed(0)}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className='flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl'>
                  <AlertCircle className='h-4 w-4 flex-shrink-0' />
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className='flex gap-3 pt-2'>
                <button
                  onClick={() => setModalOpen(false)}
                  className='flex-1 px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#8a7060] hover:bg-[#faf6ef] transition-colors'
                >
                  Cancelar
                </button>
                <button
                  onClick={registrarVenta}
                  disabled={guardando}
                  className='flex-1 flex items-center justify-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60'
                >
                  {guardando && <Loader2 className='h-4 w-4 animate-spin' />}
                  {guardando ? 'Guardando...' : 'Registrar venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
