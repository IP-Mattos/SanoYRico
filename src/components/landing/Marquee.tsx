import { DEFAULT_CONFIG } from '@/lib/site-config'

export function Marquee({ items = DEFAULT_CONFIG.marquee.items }: { items?: string[] }) {
  const all = [...items, ...items]
  return (
    <div className='bg-[#3d2b1f] py-4 overflow-hidden border-y border-[#c47c2b]/30'>
      <div className='flex animate-marquee whitespace-nowrap w-max'>
        {all.map((item, i) => (
          <span key={i} className='flex items-center' aria-hidden={i >= items.length ? true : undefined}>
            <span className='text-[#faf6ef]/90 text-xs font-semibold tracking-[0.18em] uppercase px-8'>{item}</span>
            <span className='h-1.5 w-1.5 rounded-full bg-[#e8a832]' aria-hidden='true' />
          </span>
        ))}
      </div>
    </div>
  )
}
