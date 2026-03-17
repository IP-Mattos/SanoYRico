// src/app/mp/failure/page.tsx
import Link from 'next/link'

export default async function MpFailurePage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido } = await searchParams

  return (
    <div className='min-h-screen bg-[#faf6ef] flex items-center justify-center px-4'>
      <div className='w-full max-w-md text-center'>
        <div className='w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6'>
          <span className='text-4xl'>❌</span>
        </div>
        <h1 className='text-2xl font-bold text-[#3d2b1f] mb-2' style={{ fontFamily: 'Georgia, serif' }}>
          Pago rechazado
        </h1>
        <p className='text-[#8a7060] mb-2'>
          No pudimos procesar tu pago. Por favor intentá de nuevo o elegí otro método.
        </p>
        {pedido && (
          <p className='text-[#8a7060] mb-8'>
            Pedido <span className='font-bold text-[#c47c2b]'>#{pedido}</span>
          </p>
        )}
        <div className='space-y-3'>
          <Link href='/'
            className='block w-full bg-[#3d2b1f] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors'>
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  )
}
