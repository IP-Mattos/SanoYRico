// src/app/dashboard/stock/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { type Producto } from '@/lib/types'
import {
  Plus,
  Minus,
  Loader2,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  History
} from 'lucide-react'

interface Movimiento {
  id: string
  producto_nombre: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  motivo: string | null
  fecha: string
}

interface MovimientoResponse {
  id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  motivo: string | null
  fecha: string
  productos: {
    nombre: string
  } | null
}

export default function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'bajo'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [productoSel, setProductoSel] = useState<Producto | null>(null)
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'ajuste'>('entrada')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [tab, setTab] = useState<'stock' | 'historial'>('stock')
  const supabase = createClient()

  const cargar = async () => {
    const [prodRes, movRes] = await Promise.all([
      supabase.from('productos').select('*').eq('activo', true).order('nombre'),
      supabase.from('movimientos_stock').select('*, productos(nombre)').order('fecha', { ascending: false }).limit(50)
    ])
    setProductos(prodRes.data ?? [])

    // Aplanar el join
    const movs = (movRes.data ?? []).map((m: MovimientoResponse) => ({
      id: m.id,
      producto_nombre: m.productos?.nombre ?? '—',
      tipo: m.tipo,
      cantidad: m.cantidad,
      motivo: m.motivo,
      fecha: m.fecha
    }))
    setMovimientos(movs)
    setLoading(false)
  }

  useEffect(() => {
    ;(async () => {
      await cargar()
    })()
  }, [])

  const abrirModal = (p: Producto) => {
    setProductoSel(p)
    setTipo('entrada')
    setCantidad(1)
    setMotivo('')
    setModalOpen(true)
  }

  const registrarMovimiento = async () => {
    if (!productoSel) return
    if (cantidad <= 0) return
    setGuardando(true)

    // Calcular nuevo stock
    let nuevoStock = productoSel.stock
    if (tipo === 'entrada') nuevoStock += cantidad
    if (tipo === 'salida') nuevoStock = Math.max(0, nuevoStock - cantidad)
    if (tipo === 'ajuste') nuevoStock = cantidad

    // Actualizar stock
    await supabase.from('productos').update({ stock: nuevoStock }).eq('id', productoSel.id)

    // Registrar movimiento manualmente (el trigger solo aplica a ventas)
    await supabase.from('movimientos_stock').insert({
      producto_id: productoSel.id,
      tipo,
      cantidad: tipo === 'ajuste' ? nuevoStock - productoSel.stock : cantidad,
      motivo: motivo || null
    })

    await cargar()
    setGuardando(false)
    setModalOpen(false)
  }

  const filtrados = filtro === 'bajo' ? productos.filter((p) => p.stock <= p.stock_minimo) : productos

  const porcentajeStock = (p: Producto) => {
    const max = Math.max(p.stock_minimo * 4, p.stock)
    return Math.min(100, (p.stock / max) * 100)
  }

  if (loading)
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
      </div>
    )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-[#3d2b1f]'>Stock</h2>
        <p className='text-[#8a7060] text-sm mt-1'>
          {productos.filter((p) => p.stock <= p.stock_minimo).length} productos con stock bajo
        </p>
      </div>

      {/* Tabs */}
      <div className='flex gap-2'>
        <button
          onClick={() => setTab('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'stock'
              ? 'bg-[#3d2b1f] text-white'
              : 'bg-white text-[#8a7060] border border-[#f0e6d3] hover:border-[#c47c2b]'
          }`}
        >
          <SlidersHorizontal className='h-4 w-4' />
          Stock actual
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'historial'
              ? 'bg-[#3d2b1f] text-white'
              : 'bg-white text-[#8a7060] border border-[#f0e6d3] hover:border-[#c47c2b]'
          }`}
        >
          <History className='h-4 w-4' />
          Historial
        </button>
      </div>

      {tab === 'stock' && (
        <>
          {/* Filtro */}
          <div className='flex gap-2'>
            {[
              { value: 'todos', label: 'Todos' },
              { value: 'bajo', label: '⚠️ Stock bajo' }
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value as 'todos' | 'bajo')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filtro === f.value
                    ? 'bg-[#3d2b1f] text-white'
                    : 'bg-white text-[#8a7060] border border-[#f0e6d3] hover:border-[#c47c2b]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de productos */}
          <div className='grid gap-3'>
            {filtrados.map((p) => {
              const bajo = p.stock <= p.stock_minimo
              const pct = porcentajeStock(p)
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${
                    bajo ? 'border-red-200' : 'border-[#f0e6d3]'
                  }`}
                >
                  {/* Emoji */}
                  <div className='text-2xl w-10 text-center flex-shrink-0'>{p.emoji}</div>

                  {/* Info */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='text-sm font-medium text-[#3d2b1f]'>{p.nombre}</span>
                      {bajo && (
                        <span className='flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full'>
                          <AlertTriangle className='h-3 w-3' />
                          Stock bajo
                        </span>
                      )}
                    </div>
                    {/* Barra de stock */}
                    <div className='h-1.5 bg-[#f0e6d3] rounded-full overflow-hidden'>
                      <div
                        className={`h-full rounded-full transition-all ${bajo ? 'bg-red-400' : 'bg-[#4a6741]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className='flex justify-between mt-1'>
                      <span className='text-xs text-[#8a7060]'>mín: {p.stock_minimo}</span>
                      <span className={`text-xs font-medium ${bajo ? 'text-red-500' : 'text-[#4a6741]'}`}>
                        {p.stock} unidades
                      </span>
                    </div>
                  </div>

                  {/* Botones rápidos */}
                  <div className='flex items-center gap-1 flex-shrink-0'>
                    <button
                      onClick={async () => {
                        await supabase
                          .from('productos')
                          .update({ stock: Math.max(0, p.stock - 1) })
                          .eq('id', p.id)
                        await supabase
                          .from('movimientos_stock')
                          .insert({ producto_id: p.id, tipo: 'salida', cantidad: 1, motivo: 'ajuste rápido' })
                        await cargar()
                      }}
                      className='p-2 text-[#8a7060] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors'
                    >
                      <Minus className='h-4 w-4' />
                    </button>
                    <span className='w-10 text-center text-sm font-bold text-[#3d2b1f]'>{p.stock}</span>
                    <button
                      onClick={async () => {
                        await supabase
                          .from('productos')
                          .update({ stock: p.stock + 1 })
                          .eq('id', p.id)
                        await supabase
                          .from('movimientos_stock')
                          .insert({ producto_id: p.id, tipo: 'entrada', cantidad: 1, motivo: 'ajuste rápido' })
                        await cargar()
                      }}
                      className='p-2 text-[#8a7060] hover:text-[#4a6741] hover:bg-green-50 rounded-xl transition-colors'
                    >
                      <Plus className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => abrirModal(p)}
                      className='ml-1 px-3 py-2 text-xs font-medium text-[#3d2b1f] bg-[#f0e6d3] hover:bg-[#c47c2b] hover:text-white rounded-xl transition-colors'
                    >
                      Ajustar
                    </button>
                  </div>
                </div>
              )
            })}

            {filtrados.length === 0 && (
              <div className='text-center py-12 text-[#8a7060] text-sm'>No hay productos con stock bajo 🎉</div>
            )}
          </div>
        </>
      )}

      {tab === 'historial' && (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-[#f0e6d3] bg-[#faf6ef]'>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  Producto
                </th>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  Tipo
                </th>
                <th className='text-right px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  Cantidad
                </th>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden md:table-cell'>
                  Motivo
                </th>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden sm:table-cell'>
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className='border-b border-[#f0e6d3] last:border-0 hover:bg-[#faf6ef]'>
                  <td className='px-5 py-3 text-sm text-[#3d2b1f] font-medium'>{m.producto_nombre}</td>
                  <td className='px-5 py-3'>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                        m.tipo === 'entrada'
                          ? 'bg-green-50 text-green-600'
                          : m.tipo === 'salida'
                            ? 'bg-red-50 text-red-500'
                            : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {m.tipo === 'entrada' && <ArrowUpCircle className='h-3 w-3' />}
                      {m.tipo === 'salida' && <ArrowDownCircle className='h-3 w-3' />}
                      {m.tipo === 'ajuste' && <SlidersHorizontal className='h-3 w-3' />}
                      {m.tipo}
                    </span>
                  </td>
                  <td className='px-5 py-3 text-right text-sm font-semibold text-[#3d2b1f]'>{m.cantidad}</td>
                  <td className='px-5 py-3 text-sm text-[#8a7060] hidden md:table-cell'>{m.motivo ?? '—'}</td>
                  <td className='px-5 py-3 text-sm text-[#8a7060] hidden sm:table-cell'>
                    {new Date(m.fecha).toLocaleDateString('es-UY', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr>
                  <td colSpan={5} className='px-5 py-12 text-center text-[#8a7060] text-sm'>
                    No hay movimientos registrados todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ajuste */}
      {modalOpen && productoSel && (
        <div className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl w-full max-w-md shadow-xl'>
            <div className='flex items-center justify-between p-6 border-b border-[#f0e6d3]'>
              <div>
                <h3 className='text-lg font-bold text-[#3d2b1f]'>Ajustar stock</h3>
                <p className='text-sm text-[#8a7060] mt-0.5'>
                  {productoSel.emoji} {productoSel.nombre}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className='text-[#8a7060] hover:text-[#3d2b1f]'>
                ✕
              </button>
            </div>

            <div className='p-6 space-y-4'>
              {/* Stock actual */}
              <div className='bg-[#faf6ef] rounded-xl px-4 py-3 text-center'>
                <div className='text-xs text-[#8a7060] mb-1'>Stock actual</div>
                <div className='text-3xl font-bold text-[#3d2b1f]'>{productoSel.stock}</div>
              </div>

              {/* Tipo */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-2'>Tipo de movimiento</label>
                <div className='grid grid-cols-3 gap-2'>
                  {(['entrada', 'salida', 'ajuste'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                        tipo === t ? 'bg-[#3d2b1f] text-white' : 'bg-[#faf6ef] text-[#8a7060] hover:bg-[#f0e6d3]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>
                  {tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
                </label>
                <input
                  type='number'
                  min={0}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
                {tipo !== 'ajuste' && (
                  <p className='text-xs text-[#8a7060] mt-1'>
                    Resultado:{' '}
                    {tipo === 'entrada' ? productoSel.stock + cantidad : Math.max(0, productoSel.stock - cantidad)}{' '}
                    unidades
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Motivo (opcional)</label>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder='Ej: compra, pérdida, devolución...'
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
              </div>

              {/* Botones */}
              <div className='flex gap-3 pt-2'>
                <button
                  onClick={() => setModalOpen(false)}
                  className='flex-1 px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#8a7060] hover:bg-[#faf6ef] transition-colors'
                >
                  Cancelar
                </button>
                <button
                  onClick={registrarMovimiento}
                  disabled={guardando}
                  className='flex-1 flex items-center justify-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60'
                >
                  {guardando && <Loader2 className='h-4 w-4 animate-spin' />}
                  {guardando ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
