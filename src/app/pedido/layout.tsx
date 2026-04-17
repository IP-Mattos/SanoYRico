import type { Metadata } from 'next'
import { CartProvider } from '@/context/CartContext'
import { Navbar } from '@/components/landing/Navbar'
import { Cart } from '@/components/landing/Cart'
import { CartToast, StickyMobileCart } from '@/components/landing/CartToast'
import { getSiteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Seguimiento de pedido'
}

export const revalidate = 60

// El layout del /pedido ahora es server component: fetchea config para
// que el Navbar y Cart compartidos funcionen (carrito con contador, toast,
// sticky mobile, etc.) y el cliente pueda reordenar sin salirse de acá.
export default async function PedidoLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig()

  return (
    <CartProvider>
      <Navbar />
      <Cart
        pagos={config.pagos}
        telefono={config.general.telefono}
        minimoPedido={config.general.minimoPedido}
      />
      <CartToast />
      <StickyMobileCart />
      {children}
    </CartProvider>
  )
}
