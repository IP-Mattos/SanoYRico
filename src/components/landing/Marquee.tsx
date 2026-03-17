import { DEFAULT_CONFIG } from '@/lib/site-config'

export function Marquee({ items = DEFAULT_CONFIG.marquee.items }: { items?: string[] }) {
  const all = [...items, ...items]
  return (
    <div className='bg-[#3d2b1f] py-3.5 overflow-hidden'>
      <div className='flex animate-marquee whitespace-nowrap'>
        {all.map((item, i) => (
          <span key={i} className='flex items-center'>
            <span className='text-[#faf6ef]/80 text-xs font-medium tracking-widest uppercase px-8'>{item}</span>
            <span className='text-[#c47c2b] text-xs'>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
