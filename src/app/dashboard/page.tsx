// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  ShoppingBag,
  Loader2,
  Clock,
  ArrowRight,
  Flame,
  Minus
} from 'lucide-react'

interface Resumen {
  ingresos_hoy: number
  ingresos_ayer: number
  ganancia_hoy: number
  ganancia_ayer: number
  ventas_hoy: number
  ventas_ayer: number
  productos_activos: number
  productos_stock_bajo: number
  pedidos_pendientes: number
  pedidos_viejos: number
}

interface StockBajo {
  id: string
  emoji: string
  nombre: string
  stock_minimo: number
  stock: number
}

interface PedidoPendiente {
  id: string
  numero: number
  nombre: string
  total: number
  created_at: string
}

interface TopProducto {
  nombre: string
  emoji: string | null
  cantidad: number
  ingresos: number
}

function hace(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'recién'
  if (diffMin < 60) return `hace ${diffMin} min`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

function delta(hoy: number, ayer: number): { pct: number | null; dir: 'up' | 'down' | 'same' } {
  if (ayer === 0 && hoy === 0) return { pct: null, dir: 'same' }
  if (ayer === 0) return { pct: null, dir: 'up' }
  const diff = ((hoy - ayer) / ayer) * 100
  const pct = Math.round(Math.abs(diff))
  return { pct, dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same' }
}

function Delta({ d }: { d: ReturnType<typeof delta> }) {
  if (d.pct === null) {
    return <span className='text-[10px] text-[#8a7060] font-medium uppercase tracking-wider'>vs ayer —</span>
  }
  const color = d.dir === 'up' ? 'text-green-600' : d.dir === 'down' ? 'text-red-500' : 'text-[#8a7060]'
  const Icon = d.dir === 'up' ? TrendingUp : d.dir === 'down' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${color}`}>
      <Icon className='h-3 w-3' />
      {d.pct}% <span className='text-[#8a7060] font-normal'>vs ayer</span>
    </span>
  )
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([])
  const [pedidos, setPedidos] = useState<PedidoPendiente[]>([])
  const [topProductos, setTopProductos] = useState<TopProducto[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const cargarDatos = useCallback(async () => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)
    const haceSieteDias = new Date(hoy)
    haceSieteDias.setDate(haceSieteDias.getDate() - 7)
    const hace2h = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const [ventasHoy, ventasAyer, productos, stockBajoRes, pedidosPend, pedidosViejos, ventasSemana] = await Promise.all([
      supabase.from('ventas').select('total, ganancia').gte('fecha', hoy.toISOString()),
      supabase
        .from('ventas')
        .select('total, ganancia')
        .gte('fecha', ayer.toISOString())
        .lt('fecha', hoy.toISOString()),
      supabase.from('productos').select('id', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('stock_bajo').select('*').limit(5),
      supabase
        .from('pedidos')
        .select('id, numero, nombre, total, created_at')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
        .neq('metodo_pago', 'mercadopago')
        .lt('created_at', hace2h.toISOString()),
      supabase
        .from('ventas')
        .select('producto_nombre, cantidad, total, productos(emoji)')
        .gte('fecha', haceSieteDias.toISOString())
    ])

    const ingresosHoy = ventasHoy.data?.reduce((a, v) => a + v.total, 0) ?? 0
    const gananciaHoy = ventasHoy.data?.reduce((a, v) => a + v.ganancia, 0) ?? 0
    const ingresosAyer = ventasAyer.data?.reduce((a, v) => a + v.total, 0) ?? 0
    const gananciaAyer = ventasAyer.data?.reduce((a, v) => a + v.ganancia, 0) ?? 0

    // Top productos últimos 7 días (agrupando por nombre).
    // Nota: Supabase infiere el join `productos(emoji)` como array — aunque la FK
    // es 1:1, PostgREST lo devuelve así por compatibilidad con relaciones 1:N.
    type VentaSemana = {
      producto_nombre: string
      cantidad: number
      total: number
      productos: { emoji: string | null }[] | { emoji: string | null } | null
    }
    const rowsSemana = (ventasSemana.data ?? []) as unknown as VentaSemana[]
    const agrupado = new Map<string, TopProducto>()
    rowsSemana.forEach((v) => {
      const existente = agrupado.get(v.producto_nombre)
      const emoji = Array.isArray(v.productos)
        ? v.productos[0]?.emoji ?? null
        : v.productos?.emoji ?? null
      if (existente) {
        existente.cantidad += v.cantidad
        existente.ingresos += v.total
      } else {
        agrupado.set(v.producto_nombre, {
          nombre: v.producto_nombre,
          emoji,
          cantidad: v.cantidad,
          ingresos: v.total
        })
      }
    })
    const top3 = [...agrupado.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 3)

    setResumen({
      ingresos_hoy: ingresosHoy,
      ingresos_ayer: ingresosAyer,
      ganancia_hoy: gananciaHoy,
      ganancia_ayer: gananciaAyer,
      ventas_hoy: ventasHoy.data?.length ?? 0,
      ventas_ayer: ventasAyer.data?.length ?? 0,
      productos_activos: productos.count ?? 0,
      productos_stock_bajo: stockBajoRes.data?.length ?? 0,
      pedidos_pendientes: pedidosPend.data?.length ?? 0,
      pedidos_viejos: pedidosViejos.count ?? 0
    })
    setStockBajo(stockBajoRes.data ?? [])
    setPedidos(pedidosPend.data ?? [])
    setTopProductos(top3)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    cargarDatos()

    // Realtime: refrescar cuando cambia pedidos o ventas
    const channel = supabase
      .channel('dashboard-resumen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, cargarDatos)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading || !resumen) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
      </div>
    )
  }

  const ticketPromedio = resumen.ventas_hoy > 0 ? Math.round(resumen.ingresos_hoy / resumen.ventas_hoy) : 0
  const margen = resumen.ingresos_hoy > 0 ? Math.round((resumen.ganancia_hoy / resumen.ingresos_hoy) * 100) : 0

  const fechaLarga = new Date().toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-[#3d2b1f]'>Resumen</h2>
        <p className='text-[#8a7060] text-sm mt-1 capitalize'>{fechaLarga}</p>
      </div>

      {/* ── BLOQUE DE ATENCIÓN ── Lo más urgente primero */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        {/* Pedidos pendientes */}
        <Link
          href='/dashboard/pedidos'
          className={`group relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 ${
            resumen.pedidos_pendientes > 0
              ? 'bg-[#3d2b1f] border-[#3d2b1f] text-white hover:shadow-lg'
              : 'bg-white border-[#f0e6d3] text-[#3d2b1f] hover:border-[#c47c2b]'
          }`}
        >
          <div className='flex items-start justify-between mb-4'>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                resumen.pedidos_pendientes > 0 ? 'bg-[#c47c2b]' : 'bg-[#fef3d0]'
              }`}
            >
              <ShoppingBag className={`h-5 w-5 ${resumen.pedidos_pendientes > 0 ? 'text-white' : 'text-[#c47c2b]'}`} />
            </div>
            <ArrowRight className='h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform' />
          </div>
          <div className='text-3xl font-bold mb-0.5' style={{ fontFamily: 'Georgia, serif' }}>
            {resumen.pedidos_pendientes}
          </div>
          <div className={`text-xs ${resumen.pedidos_pendientes > 0 ? 'text-white/70' : 'text-[#8a7060]'}`}>
            Pedidos pendientes
          </div>
          {resumen.pedidos_viejos > 0 && (
            <div className='mt-3 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-amber-300 font-medium'>
              <Clock className='h-3.5 w-3.5' />
              {resumen.pedidos_viejos} {resumen.pedidos_viejos === 1 ? 'lleva' : 'llevan'} más de 2h
            </div>
          )}
        </Link>

        {/* Stock crítico */}
        <Link
          href='/dashboard/stock'
          className={`group relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 ${
            resumen.productos_stock_bajo > 0
              ? 'bg-red-50 border-red-200 hover:shadow-lg'
              : 'bg-white border-[#f0e6d3] hover:border-[#c47c2b]'
          }`}
        >
          <div className='flex items-start justify-between mb-4'>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                resumen.productos_stock_bajo > 0 ? 'bg-red-500' : 'bg-green-50'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${resumen.productos_stock_bajo > 0 ? 'text-white' : 'text-green-600'}`}
              />
            </div>
            <ArrowRight className='h-4 w-4 text-[#8a7060] group-hover:translate-x-1 transition-transform' />
          </div>
          <div className='text-3xl font-bold text-[#3d2b1f]' style={{ fontFamily: 'Georgia, serif' }}>
            {resumen.productos_stock_bajo}
          </div>
          <div className='text-xs text-[#8a7060]'>
            {resumen.productos_stock_bajo > 0 ? 'Productos a reponer' : 'Stock al día'}
          </div>
        </Link>

        {/* Ingresos hoy */}
        <Link
          href='/dashboard/ventas'
          className='group relative overflow-hidden rounded-2xl p-5 border border-[#f0e6d3] bg-white hover:border-[#c47c2b] hover:-translate-y-0.5 hover:shadow-lg transition-all'
        >
          <div className='flex items-start justify-between mb-4'>
            <div className='w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center'>
              <TrendingUp className='h-5 w-5 text-green-600' />
            </div>
            <ArrowRight className='h-4 w-4 text-[#8a7060] group-hover:translate-x-1 transition-transform' />
          </div>
          <div className='text-3xl font-bold text-[#3d2b1f]' style={{ fontFamily: 'Georgia, serif' }}>
            ${resumen.ingresos_hoy.toLocaleString('es-UY')}
          </div>
          <div className='flex items-center gap-2 mt-1'>
            <span className='text-xs text-[#8a7060]'>Ingresos hoy</span>
            <Delta d={delta(resumen.ingresos_hoy, resumen.ingresos_ayer)} />
          </div>
        </Link>
      </div>

      {/* ── KPIs SECUNDARIOS ── con contexto */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        <KpiCard
          label='Ventas hoy'
          value={resumen.ventas_hoy}
          delta={delta(resumen.ventas_hoy, resumen.ventas_ayer)}
          icon={ShoppingBag}
        />
        <KpiCard
          label='Ganancia hoy'
          value={`$${resumen.ganancia_hoy.toLocaleString('es-UY')}`}
          delta={delta(resumen.ganancia_hoy, resumen.ganancia_ayer)}
          icon={TrendingUp}
        />
        <KpiCard
          label='Ticket promedio'
          value={ticketPromedio > 0 ? `$${ticketPromedio.toLocaleString('es-UY')}` : '—'}
          hint='ingresos / ventas'
          icon={Package}
        />
        <KpiCard
          label='Margen'
          value={resumen.ventas_hoy > 0 ? `${margen}%` : '—'}
          hint='ganancia / ingresos'
          icon={Flame}
        />
      </div>

      {/* ── LISTADOS ACCIONABLES ── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Pedidos pendientes — preview clickeable */}
        {pedidos.length > 0 && (
          <Panel title='Últimos pedidos pendientes' href='/dashboard/pedidos' icon={ShoppingBag}>
            <div className='space-y-1'>
              {pedidos.map((p) => (
                <Link
                  key={p.id}
                  href='/dashboard/pedidos'
                  className='flex items-center justify-between gap-3 py-2.5 px-3 -mx-3 rounded-xl hover:bg-[#faf6ef] transition-colors'
                >
                  <div className='flex items-center gap-3 min-w-0 flex-1'>
                    <span className='text-xs font-mono text-[#c47c2b] font-bold shrink-0'>#{p.numero}</span>
                    <div className='min-w-0'>
                      <div className='text-sm font-medium text-[#3d2b1f] truncate'>{p.nombre}</div>
                      <div className='text-[11px] text-[#8a7060] flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        {hace(p.created_at)}
                      </div>
                    </div>
                  </div>
                  <span
                    className='text-sm font-bold text-[#3d2b1f] shrink-0'
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    ${p.total.toLocaleString('es-UY')}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        )}

        {/* Top productos últimos 7 días */}
        {topProductos.length > 0 && (
          <Panel title='Más vendidos · últimos 7 días' icon={Flame}>
            <div className='space-y-3'>
              {topProductos.map((p, i) => {
                const max = topProductos[0].cantidad
                const pct = Math.round((p.cantidad / max) * 100)
                return (
                  <div key={p.nombre} className='space-y-1.5'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <span
                          className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            i === 0 ? 'bg-[#c47c2b] text-white' : 'bg-[#f0e6d3] text-[#8a5a1a]'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className='text-lg shrink-0'>{p.emoji ?? '📦'}</span>
                        <span className='text-sm font-medium text-[#3d2b1f] truncate'>{p.nombre}</span>
                      </div>
                      <span className='text-xs text-[#8a7060] font-semibold shrink-0'>
                        {p.cantidad} vend.
                      </span>
                    </div>
                    <div className='h-1.5 bg-[#f0e6d3] rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-linear-to-r from-[#c47c2b] to-[#8a5a1a] rounded-full transition-[width] duration-500'
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        )}
      </div>

      {/* ── STOCK BAJO ── con link directo */}
      {stockBajo.length > 0 && (
        <Panel title='Productos con stock bajo' href='/dashboard/stock' icon={AlertTriangle} tone='alert'>
          <div className='space-y-1'>
            {stockBajo.map((p) => (
              <Link
                key={p.id}
                href='/dashboard/stock'
                className='flex items-center justify-between gap-3 py-2.5 px-3 -mx-3 rounded-xl hover:bg-red-50 transition-colors'
              >
                <div className='flex items-center gap-2 min-w-0'>
                  <span className='text-lg shrink-0'>{p.emoji}</span>
                  <span className='text-sm text-[#3d2b1f] font-medium truncate'>{p.nombre}</span>
                </div>
                <div className='flex items-center gap-4 shrink-0'>
                  <span className='text-xs text-[#8a7060]'>mín: {p.stock_minimo}</span>
                  <span className='text-sm font-bold text-red-500 tabular-nums'>{p.stock} unid.</span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {/* Estado cuando todo ok */}
      {resumen.pedidos_pendientes === 0 && resumen.productos_stock_bajo === 0 && resumen.ventas_hoy === 0 && (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] p-8 text-center'>
          <div className='text-4xl mb-3'>🌿</div>
          <h3 className='text-lg font-bold text-[#3d2b1f] mb-1' style={{ fontFamily: 'Georgia, serif' }}>
            Todo tranquilo por ahora
          </h3>
          <p className='text-sm text-[#8a7060]'>Cuando entren pedidos o ventas, los vas a ver acá.</p>
        </div>
      )}
    </div>
  )
}

// ── SUBCOMPONENTES ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  delta: d,
  hint,
  icon: Icon
}: {
  label: string
  value: string | number
  delta?: ReturnType<typeof delta>
  hint?: string
  icon: React.ElementType
}) {
  return (
    <div className='bg-white rounded-2xl p-4 border border-[#f0e6d3]'>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-[10px] font-semibold text-[#8a7060] uppercase tracking-wider'>{label}</span>
        <Icon className='h-3.5 w-3.5 text-[#c47c2b]' />
      </div>
      <div className='text-xl font-bold text-[#3d2b1f] leading-none mb-2' style={{ fontFamily: 'Georgia, serif' }}>
        {value}
      </div>
      {d && <Delta d={d} />}
      {hint && !d && <span className='text-[10px] text-[#8a7060]'>{hint}</span>}
    </div>
  )
}

function Panel({
  title,
  href,
  icon: Icon,
  tone,
  children
}: {
  title: string
  href?: string
  icon: React.ElementType
  tone?: 'alert'
  children: React.ReactNode
}) {
  const alertTone = tone === 'alert'
  return (
    <div
      className={`bg-white rounded-2xl p-5 border ${alertTone ? 'border-red-200' : 'border-[#f0e6d3]'}`}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <Icon className={`h-4 w-4 ${alertTone ? 'text-red-500' : 'text-[#c47c2b]'}`} />
          <h3 className='font-semibold text-[#3d2b1f] text-sm'>{title}</h3>
        </div>
        {href && (
          <Link
            href={href}
            className='text-xs text-[#c47c2b] hover:text-[#3d2b1f] font-semibold flex items-center gap-1'
          >
            Ver todos
            <ArrowRight className='h-3 w-3' />
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}
