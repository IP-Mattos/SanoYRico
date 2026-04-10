import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className='flex items-center justify-center h-64'>
      <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
    </div>
  )
}
