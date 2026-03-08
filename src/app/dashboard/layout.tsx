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
  ShoppingCart
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/productos', label: 'Productos', icon: Package },
  { href: '/dashboard/stock', label: 'Stock', icon: Warehouse },
  { href: '/dashboard/ganancias', label: 'Ganancias', icon: TrendingUp },
  { href: '/dashboard/ventas', label: 'Ventas', icon: ClipboardList },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [email, setEmail] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email ?? '')
    })
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
                {item.label}
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
        <header className='lg:hidden bg-white border-b border-[#f0e6d3] px-4 py-3 flex items-center gap-3 flex-shrink-0'>
          <button onClick={() => setSidebarOpen(true)} className='text-[#3d2b1f]'>
            <Menu className='h-5 w-5' />
          </button>
          <h1 className='text-[#3d2b1f] font-bold'>
            Sano y <span className='text-[#c47c2b] italic'>Rico</span>
          </h1>
        </header>

        {/* Página */}
        <main className='flex-1 p-6 overflow-y-auto'>{children}</main>
      </div>
    </div>
  )
}
