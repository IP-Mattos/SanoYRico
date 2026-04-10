// src/app/dashboard/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Cookie,
  ClipboardList,
  ShoppingCart,
  PencilRuler,
  Tags
} from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/productos', label: 'Productos', icon: Package },
  { href: '/dashboard/categorias', label: 'Categorías', icon: Tags },
  { href: '/dashboard/stock', label: 'Stock', icon: Warehouse },
  { href: '/dashboard/ganancias', label: 'Ganancias', icon: TrendingUp },
  { href: '/dashboard/ventas', label: 'Ventas', icon: ClipboardList },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/dashboard/contenido', label: 'Contenido', icon: PencilRuler }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [pedidosPendientes, setPedidosPendientes] = useState(0)
  const [pedidosViejos, setPedidosViejos] = useState(0)
  const [bannerVisto, setBannerVisto] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const cargarPendientes = async () => {
      const hace2h = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      const [{ count: total }, { count: viejos }] = await Promise.all([
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente').neq('metodo_pago', 'mercadopago').lt('created_at', hace2h)
      ])
      setPedidosPendientes(total ?? 0)
      setPedidosViejos(viejos ?? 0)
      if ((viejos ?? 0) > 0) setBannerVisto(false)
    }
    cargarPendientes()
    const channel = supabase
      .channel('layout-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, cargarPendientes)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.push('/login')
        return
      }
      setEmail(data.user.email ?? '')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className='h-screen bg-[#faf6ef] flex overflow-hidden'>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className='fixed inset-0 bg-black/30 z-20 lg:hidden' onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-screen w-64 bg-[#3d2b1f] z-30 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex lg:h-screen
      `}
      >
        {/* Logo */}
        <div className='p-6 border-b border-white/10'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-white text-xl font-bold'>
                Sano y <span className='text-[#c47c2b] italic'>Rico</span>
              </h1>
              <p className='text-white/40 text-xs mt-0.5'>Panel de administración</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className='lg:hidden text-white/60 hover:text-white'>
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className='flex-1 p-4 space-y-1'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const badge = item.href === '/dashboard/pedidos' && pedidosPendientes > 0 ? pedidosPendientes : null
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive ? 'bg-[#c47c2b] text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}
                `}
              >
                <Icon className='h-4 w-4' />
                <span className='flex-1'>{item.label}</span>
                {badge && (
                  <span className='bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center'>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Usuario */}
        <div className='p-4 border-t border-white/10'>
          <div className='flex items-center gap-3 px-4 py-2 mb-1'>
            <div className='w-8 h-8 rounded-full bg-[#c47c2b] flex items-center justify-center'>
              <Cookie className='h-4 w-4 text-white' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-white text-xs font-medium truncate'>{email}</p>
              <p className='text-white/40 text-xs'>Administrador</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className='w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors'
          >
            <LogOut className='h-4 w-4' />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className='flex-1 flex flex-col min-w-0 h-screen'>
        {/* Topbar mobile */}
        <header className='lg:hidden bg-white border-b border-[#f0e6d3] px-4 py-3 flex items-center gap-3 shrink-0'>
          <button onClick={() => setSidebarOpen(true)} className='text-[#3d2b1f]'>
            <Menu className='h-5 w-5' />
          </button>
          <h1 className='text-[#3d2b1f] font-bold'>
            Sano y <span className='text-[#c47c2b] italic'>Rico</span>
          </h1>
        </header>

        {/* Banner pedidos sin confirmar */}
        {pedidosViejos > 0 && !bannerVisto && (
          <div className='flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3 shrink-0'>
            <p className='text-sm text-amber-800 font-medium'>
              ⏰ {pedidosViejos} pedido{pedidosViejos > 1 ? 's' : ''} pendiente{pedidosViejos > 1 ? 's' : ''} hace más de 2 horas sin confirmar
            </p>
            <button
              onClick={() => setBannerVisto(true)}
              className='text-amber-600 hover:text-amber-900 text-xs shrink-0 underline'
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Página */}
        <main className='flex-1 p-4 sm:p-6 overflow-y-auto'>
          <div className='max-w-5xl mx-auto'>
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
