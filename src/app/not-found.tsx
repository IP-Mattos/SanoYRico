import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='min-h-screen bg-[#faf6ef] flex items-center justify-center px-4'>
      <div className='text-center max-w-md'>
        <div className='text-7xl mb-4'>🥜</div>
        <h1 className='text-4xl font-black text-[#3d2b1f] mb-2' style={{ fontFamily: 'Georgia, serif' }}>
          Página no encontrada
        </h1>
        <p className='text-[#8a7060] mb-6'>
          Esta página no existe o fue movida. Pero nuestros snacks sí están.
        </p>
        <Link
          href='/'
          className='inline-flex items-center gap-2 bg-[#3d2b1f] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#c47c2b] transition-colors'
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
