import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seguimiento de pedido',
}

export default function PedidoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
