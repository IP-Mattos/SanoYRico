'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center h-64 text-center'>
      <div className='w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4'>
        <AlertTriangle className='h-6 w-6 text-red-500' />
      </div>
      <h3 className='text-base font-bold text-[#3d2b1f] mb-1'>Algo salió mal</h3>
      <p className='text-sm text-[#8a7060] mb-4 max-w-xs'>
        Hubo un error cargando esta sección. Probá de nuevo.
      </p>
      <button
        onClick={reset}
        className='flex items-center gap-2 px-4 py-2 bg-[#3d2b1f] text-white rounded-xl text-sm hover:bg-[#c47c2b] transition-colors'
      >
        <RefreshCw className='h-4 w-4' />
        Reintentar
      </button>
    </div>
  )
}
