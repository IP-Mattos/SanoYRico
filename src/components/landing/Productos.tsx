'use client'

import { useState } from 'react'

type Tab = 'barritas' | 'mixes' | 'alfajor'

type Product = {
  emoji: string
  nombre: string
  desc: string
  badge: string | null
  kcal: number
  prot: number
  fibra?: number
  precio: number
  bg: string
}

const barritas = [
  {
    emoji: '🍯',
    nombre: 'Miel & Avena',
    desc: 'Avena tostada, miel pura y semillas de chía.',
    badge: 'Más vendida',
    kcal: 180,
    prot: 6,
    fibra: 4,
    precio: 85,
    bg: 'from-amber-50 to-amber-100'
  },
  {
    emoji: '🍫',
    nombre: 'Cacao & Maní',
    desc: 'Cacao puro, manteca de maní y chips de chocolate 70%.',
    badge: 'Vegano',
    kcal: 225,
    prot: 9,
    fibra: 3,
    precio: 95,
    bg: 'from-amber-100 to-orange-100'
  },
  {
    emoji: '🫐',
    nombre: 'Frutos Rojos',
    desc: 'Arándanos, frambuesas y pasas con quinoa inflada.',
    badge: null,
    kcal: 165,
    prot: 5,
    fibra: 6,
    precio: 90,
    bg: 'from-pink-50 to-rose-100'
  },
  {
    emoji: '🌿',
    nombre: 'Menta & Espirulina',
    desc: 'Espirulina, menta natural y semillas de cáñamo.',
    badge: 'Nuevo',
    kcal: 145,
    prot: 7,
    fibra: 7,
    precio: 100,
    bg: 'from-teal-50 to-emerald-100'
  }
]

const mixes = [
  {
    emoji: '🥜',
    nombre: 'Mix Frutos Secos',
    desc: 'Almendras, nueces, castañas y maní.',
    badge: null,
    kcal: 200,
    prot: 8,
    precio: 110,
    bg: 'from-green-50 to-green-100'
  },
  {
    emoji: '🍓',
    nombre: 'Mix Tropical',
    desc: 'Mango, piña, coco y arándanos deshidratados.',
    badge: 'Popular',
    kcal: 175,
    prot: 3,
    precio: 115,
    bg: 'from-pink-50 to-rose-100'
  },
  {
    emoji: '🌻',
    nombre: 'Mix Semillas',
    desc: 'Girasol, zapallo, sésamo y lino.',
    badge: null,
    kcal: 160,
    prot: 6,
    precio: 100,
    bg: 'from-amber-50 to-yellow-100'
  },
  {
    emoji: '🍫',
    nombre: 'Mix Choco & Nuts',
    desc: 'Chips de cacao, avellanas y pasas.',
    badge: null,
    kcal: 220,
    prot: 7,
    precio: 120,
    bg: 'from-orange-50 to-amber-100'
  },
  {
    emoji: '🌿',
    nombre: 'Mix Verde Detox',
    desc: 'Pistachos, pepitas y semillas de cáñamo.',
    badge: 'Sin gluten',
    kcal: 185,
    prot: 6,
    precio: 125,
    bg: 'from-teal-50 to-green-100'
  },
  {
    emoji: '🍋',
    nombre: 'Mix Cítrico',
    desc: 'Naranja, limón deshidratados y jengibre.',
    badge: null,
    kcal: 155,
    prot: 3,
    precio: 110,
    bg: 'from-yellow-50 to-lime-100'
  },
  {
    emoji: '🫘',
    nombre: 'Mix Proteico',
    desc: 'Edamame, garbanzos tostados y maní.',
    badge: 'Nuevo',
    kcal: 190,
    prot: 12,
    precio: 130,
    bg: 'from-green-50 to-emerald-100'
  }
]

function ProductCard({ p, cols }: { p: Product; cols?: boolean }) {
  return (
    <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300'>
      <div className={`h-40 bg-gradient-to-br ${p.bg} flex items-center justify-center relative text-6xl`}>
        {p.emoji}
        {p.badge && (
          <span className='absolute top-3 right-3 bg-[#4a6741] text-white text-xs font-medium px-2.5 py-1 rounded-full'>
            {p.badge}
          </span>
        )}
      </div>
      <div className='p-4'>
        <h3 className='font-bold text-[#3d2b1f] mb-1' style={{ fontFamily: 'Georgia, serif' }}>
          {p.nombre}
        </h3>
        <p className='text-xs text-[#8a7060] leading-relaxed mb-3'>{p.desc}</p>
        <div className='flex flex-wrap gap-1.5 mb-3'>
          <span className='text-xs bg-[#f0e6d3] text-[#3d2b1f] px-2 py-0.5 rounded-full'>🔥 {p.kcal} kcal</span>
          <span className='text-xs bg-[#f0e6d3] text-[#3d2b1f] px-2 py-0.5 rounded-full'>💪 {p.prot}g prot.</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-lg font-bold text-[#c47c2b]' style={{ fontFamily: 'Georgia, serif' }}>
            ${p.precio} <span className='text-xs text-[#8a7060] font-normal'>/unidad</span>
          </span>
          <button className='w-8 h-8 bg-[#3d2b1f] text-white rounded-full text-lg hover:bg-[#c47c2b] transition-colors flex items-center justify-center'>
            +
          </button>
        </div>
      </div>
    </div>
  )
}

export function Productos() {
  const [tab, setTab] = useState<Tab>('barritas')

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: 'barritas', label: '🍫 Barritas', count: 4 },
    { value: 'mixes', label: '🥜 Mixes', count: 7 },
    { value: 'alfajor', label: '🍪 Alfajor', count: 1 }
  ]

  return (
    <section id='productos' className='py-24 px-6 lg:px-16 max-w-7xl mx-auto'>
      <p className='text-xs font-medium tracking-widest uppercase text-[#c47c2b] mb-3'>Nuestros productos</p>
      <h2 className='text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-3' style={{ fontFamily: 'Georgia, serif' }}>
        Snacks que te
        <br />
        hacen bien de verdad
      </h2>
      <p className='text-[#8a7060] text-lg font-light mb-10 max-w-lg'>
        Barras, mixes y nuestro especial alfajor. Todo rico, todo sano.
      </p>

      {/* Tabs */}
      <div className='flex gap-2 flex-wrap mb-8'>
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.value
                ? 'bg-[#3d2b1f] text-white'
                : 'bg-white text-[#8a7060] border border-[#f0e6d3] hover:border-[#c47c2b]'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.value ? 'bg-white/20' : 'bg-[#f0e6d3]'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Barritas */}
      {tab === 'barritas' && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {barritas.map((p) => (
            <ProductCard key={p.nombre} p={p} />
          ))}
        </div>
      )}

      {/* Mixes */}
      {tab === 'mixes' && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {mixes.map((p) => (
            <ProductCard key={p.nombre} p={p} />
          ))}
        </div>
      )}

      {/* Alfajor */}
      {tab === 'alfajor' && (
        <div className='flex justify-center'>
          <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden w-full max-w-sm hover:shadow-lg transition-all'>
            <div className='h-56 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-9xl relative'>
              🍪
              <span className='absolute top-3 right-3 bg-[#c47c2b] text-white text-xs font-medium px-2.5 py-1 rounded-full'>
                ⭐ Especial
              </span>
            </div>
            <div className='p-6'>
              <h3 className='text-2xl font-bold text-[#3d2b1f] mb-2' style={{ fontFamily: 'Georgia, serif' }}>
                Alfajor Sano y Rico
              </h3>
              <p className='text-sm text-[#8a7060] leading-relaxed mb-4'>
                Tapas de avena y coco, relleno de dulce de leche sin azúcar refinada, cubierto con chocolate 70% cacao.
                El alfajor que siempre quisiste, sin culpa.
              </p>
              <div className='flex flex-wrap gap-2 mb-4'>
                <span className='text-xs bg-[#f0e6d3] text-[#3d2b1f] px-2.5 py-1 rounded-full'>🔥 195 kcal</span>
                <span className='text-xs bg-[#f0e6d3] text-[#3d2b1f] px-2.5 py-1 rounded-full'>💪 7g proteína</span>
                <span className='text-xs bg-[#f0e6d3] text-[#3d2b1f] px-2.5 py-1 rounded-full'>
                  🍫 Sin azúcar refinada
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-2xl font-bold text-[#c47c2b]' style={{ fontFamily: 'Georgia, serif' }}>
                  $120 <span className='text-sm text-[#8a7060] font-normal'>/unidad</span>
                </span>
                <button className='bg-[#3d2b1f] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#c47c2b] transition-colors'>
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
