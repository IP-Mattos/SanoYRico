// src/app/dashboard/ventas/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { type Venta } from '@/lib/types'
import { Loader2, Search, Trash2, TrendingUp, DollarSign, ShoppingBag, Filter } from 'lucide-react'

type Periodo = 'hoy' | '7d' | '30d' | 'todo'

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>('7d')
  const [busqueda, setBusqueda] = useState('')
  const [totales, setTotales] = useState({ ingresos: 0, ganancias: 0, cantidad: 0 })
  const supabase = createClient()

  const cargar = async () => {
    setLoading(true)

    let query = supabase.from('ventas').select('*').order('fecha', { ascending: false })

    // Filtro por período
    if (periodo !== 'todo') {
      const desde = new Date()
      if (periodo === 'hoy') desde.setHours(0, 0, 0, 0)
      if (periodo === '7d') desde.setDate(desde.getDate() - 7)
      if (periodo === '30d') desde.setDate(desde.getDate() - 30)
      query = query.gte('fecha', desde.toISOString())
    }

    const { data } = await query
    const resultado = data ?? []
    setVentas(resultado)

    setTotales({
      ingresos: resultado.reduce((a, v) => a + v.total, 0),
      ganancias: resultado.reduce((a, v) => a + v.ganancia, 0),
      cantidad: resultado.length
    })

    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [periodo])

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta venta? El stock no se revertirá automáticamente.')) return
    await supabase.from('ventas').delete().eq('id', id)
    await cargar()
  }

  const filtradas = ventas.filter((v) => v.producto_nombre.toLowerCase().includes(busqueda.toLowerCase()))

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
        <h2 className='text-2xl font-bold text-[#3d2b1f]'>Historial de ventas</h2>
        <p className='text-[#8a7060] text-sm mt-1'>{ventas.length} ventas en el período seleccionado</p>
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

      {/* Cards resumen */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white rounded-2xl p-5 border border-[#f0e6d3]'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-blue-50 text-blue-600'>
            <ShoppingBag className='h-4 w-4' />
          </div>
          <div className='text-2xl font-bold text-[#3d2b1f]'>{totales.cantidad}</div>
          <div className='text-xs text-[#8a7060] mt-0.5'>Ventas totales</div>
        </div>
        <div className='bg-white rounded-2xl p-5 border border-[#f0e6d3]'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-green-50 text-green-600'>
            <DollarSign className='h-4 w-4' />
          </div>
          <div className='text-2xl font-bold text-[#3d2b1f]'>${totales.ingresos.toFixed(0)}</div>
          <div className='text-xs text-[#8a7060] mt-0.5'>Ingresos totales</div>
        </div>
        <div className='bg-white rounded-2xl p-5 border border-[#f0e6d3]'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-[#fef3d0] text-[#c47c2b]'>
            <TrendingUp className='h-4 w-4' />
          </div>
          <div className='text-2xl font-bold text-[#3d2b1f]'>${totales.ganancias.toFixed(0)}</div>
          <div className='text-xs text-[#8a7060] mt-0.5'>Ganancias totales</div>
        </div>
      </div>

      {/* Buscador */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060]' />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder='Buscar por producto...'
          className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] bg-white'
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className='flex justify-center py-20'>
          <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
        </div>
      ) : (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-[#f0e6d3] bg-[#faf6ef]'>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  Producto
                </th>
                <th className='text-right px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  Cant.
                </th>
                <th className='text-right px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden sm:table-cell'>
                  Precio unit.
                </th>
                <th className='text-right px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  Total
                </th>
                <th className='text-right px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden md:table-cell'>
                  Ganancia
                </th>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden lg:table-cell'>
                  Fecha
                </th>
                <th className='px-5 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((v) => (
                <tr key={v.id} className='border-b border-[#f0e6d3] last:border-0 hover:bg-[#faf6ef] transition-colors'>
                  <td className='px-5 py-3 text-sm font-medium text-[#3d2b1f]'>{v.producto_nombre}</td>
                  <td className='px-5 py-3 text-right text-sm text-[#3d2b1f]'>{v.cantidad}</td>
                  <td className='px-5 py-3 text-right text-sm text-[#8a7060] hidden sm:table-cell'>
                    ${v.precio_unitario}
                  </td>
                  <td className='px-5 py-3 text-right text-sm font-semibold text-[#3d2b1f]'>${v.total.toFixed(0)}</td>
                  <td className='px-5 py-3 text-right hidden md:table-cell'>
                    <span className='text-sm font-medium text-[#4a6741]'>${v.ganancia.toFixed(0)}</span>
                  </td>
                  <td className='px-5 py-3 text-sm text-[#8a7060] hidden lg:table-cell'>
                    {new Date(v.fecha).toLocaleDateString('es-UY', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className='px-5 py-3'>
                    <button
                      onClick={() => eliminar(v.id)}
                      className='p-1.5 text-[#8a7060] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className='px-5 py-12 text-center text-[#8a7060] text-sm'>
                    {busqueda ? 'No hay ventas que coincidan con la búsqueda' : 'No hay ventas en este período'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
