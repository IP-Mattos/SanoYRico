// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TrendingUp, Package, AlertTriangle, ShoppingBag, Loader2 } from 'lucide-react'

interface Resumen {
  ingresos_hoy: number
  ganancias_hoy: number
  ventas_hoy: number
  productos_activos: number
  productos_stock_bajo: number
}

interface StockBajo {
  id: number
  emoji: string
  nombre: string
  stock_minimo: number
  stock: number
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const cargarDatos = async () => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const [ventasHoy, productos, stockBajoRes] = await Promise.all([
        supabase.from('ventas').select('total, ganancia').gte('fecha', hoy.toISOString()),
        supabase.from('productos').select('id', { count: 'exact' }).eq('activo', true),
        supabase.from('stock_bajo').select('*').limit(5)
      ])

      const ingresos = ventasHoy.data?.reduce((a, v) => a + v.total, 0) ?? 0
      const ganancias = ventasHoy.data?.reduce((a, v) => a + v.ganancia, 0) ?? 0

      setResumen({
        ingresos_hoy: ingresos,
        ganancias_hoy: ganancias,
        ventas_hoy: ventasHoy.data?.length ?? 0,
        productos_activos: productos.count ?? 0,
        productos_stock_bajo: stockBajoRes.data?.length ?? 0
      })
      setStockBajo(stockBajoRes.data ?? [])
      setLoading(false)
    }

    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading)
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
      </div>
    )

  const cards = [
    {
      label: 'Ingresos hoy',
      value: `$${resumen?.ingresos_hoy.toFixed(0)}`,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600'
    },
    {
      label: 'Ganancia hoy',
      value: `$${resumen?.ganancias_hoy.toFixed(0)}`,
      icon: TrendingUp,
      color: 'bg-[#fef3d0] text-[#c47c2b]'
    },
    { label: 'Ventas hoy', value: resumen?.ventas_hoy, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    {
      label: 'Productos activos',
      value: resumen?.productos_activos,
      icon: Package,
      color: 'bg-purple-50 text-purple-600'
    },
    { label: 'Stock bajo', value: resumen?.productos_stock_bajo, icon: AlertTriangle, color: 'bg-red-50 text-red-500' }
  ]

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-[#3d2b1f]'>Resumen</h2>
        <p className='text-[#8a7060] text-sm mt-1'>Todo lo importante de hoy de un vistazo</p>
      </div>

      {/* Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4'>
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className='bg-white rounded-2xl p-5 border border-[#f0e6d3]'>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className='h-4 w-4' />
              </div>
              <div className='text-2xl font-bold text-[#3d2b1f]'>{card.value}</div>
              <div className='text-xs text-[#8a7060] mt-0.5'>{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Stock bajo */}
      {stockBajo.length > 0 && (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
          <div className='flex items-center gap-2 mb-4'>
            <AlertTriangle className='h-4 w-4 text-red-500' />
            <h3 className='font-semibold text-[#3d2b1f]'>Productos con stock bajo</h3>
          </div>
          <div className='space-y-2'>
            {stockBajo.map((p) => (
              <div
                key={p.id}
                className='flex items-center justify-between py-2 border-b border-[#f0e6d3] last:border-0'
              >
                <div className='flex items-center gap-2'>
                  <span>{p.emoji}</span>
                  <span className='text-sm text-[#3d2b1f] font-medium'>{p.nombre}</span>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='text-xs text-[#8a7060]'>mín: {p.stock_minimo}</span>
                  <span className='text-sm font-bold text-red-500'>{p.stock} unid.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
