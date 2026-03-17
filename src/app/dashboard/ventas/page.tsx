// src/app/dashboard/ventas/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Plus,
  X,
  Globe,
  PenLine
} from 'lucide-react'

type Periodo = 'hoy' | '7d' | '30d' | 'todo'
type TabType = 'pagina' | 'manual'

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

interface VentaManual {
  id: string
  nombre: string
  telefono: string | null
  descripcion: string | null
  total: number
  fecha: string
  created_at: string
}

interface FormManual {
  nombre: string
  telefono: string
  descripcion: string
  total: string
  fecha: string
}

export default function VentasPage() {
  const [tab, setTab] = useState<TabType>('pagina')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [ventasManuales, setVentasManuales] = useState<VentaManual[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [totales, setTotales] = useState({ ingresos: 0, pedidos: 0, clientes: 0, promedio: 0 })
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<FormManual>({
    nombre: '',
    telefono: '',
    descripcion: '',
    total: '',
    fecha: ''
  })

  useEffect(() => {
    setForm((f) => ({ ...f, fecha: new Date().toISOString().split('T')[0] }))
  }, [])
  const [errorForm, setErrorForm] = useState('')
  const supabase = createClient()

  const cargarPedidos = async () => {
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

  const cargarManuales = async () => {
    setLoading(true)
    let query = supabase
      .from('ventas_manuales')
      .select('*')
      .order('fecha', { ascending: false })

    if (periodo !== 'todo') {
      const desde = new Date()
      if (periodo === 'hoy') desde.setHours(0, 0, 0, 0)
      if (periodo === '7d') desde.setDate(desde.getDate() - 7)
      if (periodo === '30d') desde.setDate(desde.getDate() - 30)
      query = query.gte('fecha', desde.toISOString().split('T')[0])
    }

    const { data } = await query
    const resultado = data ?? []
    setVentasManuales(resultado)

    const ingresos = resultado.reduce((a: number, v: VentaManual) => a + v.total, 0)
    const clientes = new Set(resultado.map((v: VentaManual) => v.nombre.toLowerCase())).size
    setTotales({
      ingresos,
      pedidos: resultado.length,
      clientes,
      promedio: resultado.length > 0 ? ingresos / resultado.length : 0
    })
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'pagina') cargarPedidos()
    else cargarManuales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, tab])

  const guardarManual = async () => {
    if (!form.nombre.trim()) return setErrorForm('El nombre es obligatorio')
    const total = parseFloat(form.total)
    if (!form.total || isNaN(total) || total <= 0) return setErrorForm('Ingresá un total válido')
    setErrorForm('')
    setGuardando(true)

    const { error } = await supabase.from('ventas_manuales').insert({
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      descripcion: form.descripcion.trim() || null,
      total,
      fecha: form.fecha
    })

    setGuardando(false)
    if (error) {
      setErrorForm('Error al guardar. Verificá que la tabla ventas_manuales existe.')
      return
    }

    setModalAbierto(false)
    setForm({ nombre: '', telefono: '', descripcion: '', total: '', fecha: new Date().toISOString().split('T')[0] })
    // new Date() aquí está bien — corre sólo en el cliente como respuesta a un evento
    cargarManuales()
  }

  const eliminarManual = async (id: string) => {
    await supabase.from('ventas_manuales').delete().eq('id', id)
    setVentasManuales((prev) => prev.filter((v) => v.id !== id))
  }

  const filtradosPedidos = pedidos.filter(
    (p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.telefono.includes(busqueda)
  )

  const filtradosManuales = ventasManuales.filter(
    (v) =>
      v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.telefono ?? '').includes(busqueda) ||
      (v.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase())
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
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-[#3d2b1f]'>Ventas</h2>
          <p className='text-[#8a7060] text-sm mt-1'>Registro de todas tus ventas</p>
        </div>
        {tab === 'manual' && (
          <button
            onClick={() => setModalAbierto(true)}
            className='flex items-center gap-2 px-4 py-2 bg-[#3d2b1f] text-white rounded-xl text-sm font-medium hover:bg-[#5a3e2b] transition-colors'
          >
            <Plus className='h-4 w-4' />
            Nueva venta
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className='flex gap-2 p-1 bg-[#f0e6d3] rounded-xl w-fit'>
        <button
          onClick={() => { setTab('pagina'); setBusqueda('') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pagina' ? 'bg-white text-[#3d2b1f] shadow-sm' : 'text-[#8a7060] hover:text-[#3d2b1f]'
          }`}
        >
          <Globe className='h-4 w-4' />
          Generadas por la página
        </button>
        <button
          onClick={() => { setTab('manual'); setBusqueda('') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'manual' ? 'bg-white text-[#3d2b1f] shadow-sm' : 'text-[#8a7060] hover:text-[#3d2b1f]'
          }`}
        >
          <PenLine className='h-4 w-4' />
          Ingresadas manualmente
        </button>
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
          { label: 'Ingresos', value: `$${totales.ingresos.toFixed(0)}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: tab === 'pagina' ? 'Pedidos' : 'Ventas', value: totales.pedidos, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
          { label: 'Clientes únicos', value: totales.clientes, icon: Users, color: 'bg-purple-50 text-purple-600' },
          { label: 'Ticket promedio', value: `$${totales.promedio.toFixed(0)}`, icon: TrendingUp, color: 'bg-[#fef3d0] text-[#c47c2b]' }
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
          placeholder={tab === 'pagina' ? 'Buscar por nombre o teléfono...' : 'Buscar por nombre, teléfono o descripción...'}
          className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] bg-white'
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className='flex justify-center py-20'>
          <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
        </div>
      ) : tab === 'pagina' ? (
        filtradosPedidos.length === 0 ? (
          <div className='bg-white rounded-2xl border border-[#f0e6d3] p-12 text-center text-[#8a7060] text-sm'>
            {busqueda ? 'No hay ventas que coincidan con la búsqueda' : 'No hay ventas entregadas en este período'}
          </div>
        ) : (
          <div className='space-y-3'>
            {filtradosPedidos.map((pedido) => {
              const items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items ?? [])
              const abierto = expandido === pedido.id
              return (
                <div key={pedido.id} className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
                  <div
                    className='flex items-center gap-4 p-4 cursor-pointer hover:bg-[#faf6ef] transition-colors'
                    onClick={() => setExpandido(abierto ? null : pedido.id)}
                  >
                    <div className='w-10 h-10 bg-[#f0e6d3] rounded-xl flex items-center justify-center flex-shrink-0 text-lg'>
                      👤
                    </div>
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
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        <span className='text-xs text-[#8a7060]'>
                          {items.length} producto{items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 flex-shrink-0'>
                      <span className='text-lg font-bold text-[#c47c2b]' style={{ fontFamily: 'Georgia, serif' }}>
                        ${pedido.total}
                      </span>
                      {abierto ? <ChevronUp className='h-4 w-4 text-[#8a7060]' /> : <ChevronDown className='h-4 w-4 text-[#8a7060]' />}
                    </div>
                  </div>
                  {abierto && (
                    <div className='border-t border-[#f0e6d3] p-4 space-y-3'>
                      <div className='text-xs text-[#8a7060]'>
                        📍 {pedido.direccion}
                        {pedido.notas && <span className='ml-3'>📝 {pedido.notas}</span>}
                      </div>
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
        )
      ) : (
        /* Tab manual */
        filtradosManuales.length === 0 ? (
          <div className='bg-white rounded-2xl border border-[#f0e6d3] p-12 text-center space-y-3'>
            <p className='text-[#8a7060] text-sm'>
              {busqueda ? 'No hay ventas que coincidan con la búsqueda' : 'No hay ventas manuales en este período'}
            </p>
            {!busqueda && (
              <button
                onClick={() => setModalAbierto(true)}
                className='inline-flex items-center gap-2 px-4 py-2 bg-[#3d2b1f] text-white rounded-xl text-sm font-medium hover:bg-[#5a3e2b] transition-colors'
              >
                <Plus className='h-4 w-4' />
                Registrar primera venta
              </button>
            )}
          </div>
        ) : (
          <div className='space-y-3'>
            {filtradosManuales.map((venta) => (
              <div key={venta.id} className='bg-white rounded-2xl border border-[#f0e6d3] p-4'>
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 bg-[#f0e6d3] rounded-xl flex items-center justify-center flex-shrink-0 text-lg'>
                    🛒
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-[#3d2b1f]'>{venta.nombre}</span>
                      <span className='text-xs text-[#8a7060] bg-[#fef3d0] px-2 py-0.5 rounded-full border border-[#f0e6d3]'>
                        Manual
                      </span>
                    </div>
                    <div className='flex items-center gap-3 mt-0.5 flex-wrap'>
                      {venta.telefono && <span className='text-xs text-[#8a7060]'>{venta.telefono}</span>}
                      <span className='text-xs text-[#8a7060]'>
                        {new Date(venta.fecha + 'T00:00:00').toLocaleDateString('es-UY', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </span>
                      {venta.descripcion && (
                        <span className='text-xs text-[#8a7060] truncate max-w-xs'>📝 {venta.descripcion}</span>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-3 flex-shrink-0'>
                    <span className='text-lg font-bold text-[#c47c2b]' style={{ fontFamily: 'Georgia, serif' }}>
                      ${venta.total}
                    </span>
                    <button
                      onClick={() => eliminarManual(venta.id)}
                      className='p-1.5 rounded-lg text-[#8a7060] hover:bg-red-50 hover:text-red-500 transition-colors'
                      title='Eliminar'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal nueva venta manual */}
      {modalAbierto && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl w-full max-w-md shadow-xl'>
            {/* Header modal */}
            <div className='flex items-center justify-between p-5 border-b border-[#f0e6d3]'>
              <h3 className='text-lg font-bold text-[#3d2b1f]'>Nueva venta manual</h3>
              <button
                onClick={() => { setModalAbierto(false); setErrorForm('') }}
                className='p-1.5 rounded-lg text-[#8a7060] hover:bg-[#f0e6d3] transition-colors'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Body modal */}
            <div className='p-5 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-[#3d2b1f] mb-1'>
                  Nombre del cliente <span className='text-red-400'>*</span>
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder='Ej: María García'
                  className='w-full px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-[#3d2b1f] mb-1'>Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder='Ej: 099123456'
                  className='w-full px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-[#3d2b1f] mb-1'>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder='Ej: 2x Ensalada caesar, 1x Jugo naranja'
                  rows={2}
                  className='w-full px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] resize-none'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-[#3d2b1f] mb-1'>
                    Total ($) <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={form.total}
                    onChange={(e) => setForm({ ...form, total: e.target.value })}
                    placeholder='0'
                    className='w-full px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-[#3d2b1f] mb-1'>Fecha</label>
                  <input
                    type='date'
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className='w-full px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
              </div>

              {errorForm && (
                <p className='text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl'>{errorForm}</p>
              )}
            </div>

            {/* Footer modal */}
            <div className='flex gap-3 p-5 border-t border-[#f0e6d3]'>
              <button
                onClick={() => { setModalAbierto(false); setErrorForm('') }}
                className='flex-1 px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm font-medium text-[#8a7060] hover:bg-[#faf6ef] transition-colors'
              >
                Cancelar
              </button>
              <button
                onClick={guardarManual}
                disabled={guardando}
                className='flex-1 px-4 py-2.5 rounded-xl bg-[#3d2b1f] text-white text-sm font-medium hover:bg-[#5a3e2b] transition-colors disabled:opacity-60 flex items-center justify-center gap-2'
              >
                {guardando ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
                {guardando ? 'Guardando...' : 'Guardar venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
