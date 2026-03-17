// src/components/landing/Productos.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { type Producto } from '@/lib/types'
import { useCart } from '@/context/CartContext'
import { Loader2 } from 'lucide-react'

type Tab = 'barrita' | 'mix' | 'alfajor'

const BG: Record<string, string> = {
  '🍯': 'from-amber-50 to-amber-100',
  '🍫': 'from-orange-50 to-amber-100',
  '🫐': 'from-pink-50 to-rose-100',
  '🌿': 'from-teal-50 to-emerald-100',
  '🥜': 'from-green-50 to-green-100',
  '🍓': 'from-pink-50 to-rose-100',
  '🌻': 'from-amber-50 to-yellow-100',
  '🍋': 'from-yellow-50 to-lime-100',
  '🫘': 'from-green-50 to-emerald-100',
  '🍪': 'from-amber-100 to-orange-100'
}

const DEFAULT_BG = 'from-[#f0e6d3] to-[#fef3d0]'

function ProductCard({ p }: { p: Producto }) {
  const { agregar } = useCart()
  const bg = BG[p.emoji ?? ''] ?? DEFAULT_BG

  return (
    <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300'>
      <div className={`h-40 bg-gradient-to-br ${bg} flex items-center justify-center relative`}>
        {p.imagen_url
          ? <Image src={p.imagen_url} alt={p.nombre} width={128} height={128} className='object-contain drop-shadow-md' />
          : <span className='text-6xl'>{p.emoji}</span>
        }
        {p.badge && (
          <span className='absolute top-3 right-3 bg-[#4a6741] text-white text-xs font-medium px-2.5 py-1 rounded-full'>
            {p.badge}
          </span>
        )}
        {p.stock === 0 && (
          <div className='absolute inset-0 bg-white/60 flex items-center justify-center'>
            <span className='text-xs font-semibold text-[#8a7060] bg-white px-3 py-1 rounded-full border border-[#f0e6d3]'>
              Sin stock
            </span>
          </div>
        )}
      </div>
      <div className='p-4'>
        <h3 className='font-bold text-[#3d2b1f] mb-1' style={{ fontFamily: 'Georgia, serif' }}>
          {p.nombre}
        </h3>
        <p className='text-xs text-[#8a7060] leading-relaxed mb-3'>{p.descripcion}</p>
        <div className='flex items-center justify-between'>
          <span className='text-lg font-bold text-[#c47c2b]' style={{ fontFamily: 'Georgia, serif' }}>
            ${p.precio} <span className='text-xs text-[#8a7060] font-normal'>/unidad</span>
          </span>
          <button
            onClick={() => agregar({ producto_id: p.id, nombre: p.nombre, emoji: p.emoji ?? '', precio: p.precio })}
            disabled={p.stock === 0}
            className='w-8 h-8 bg-[#3d2b1f] text-white rounded-full text-lg hover:bg-[#c47c2b] transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed'
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

function AlfajorCard({ p }: { p: Producto }) {
  const { agregar } = useCart()

  return (
    <div className='flex justify-center'>
      <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden w-full max-w-xs hover:shadow-lg transition-all'>
        <div className='h-56 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative'>
          {p.imagen_url
            ? <Image src={p.imagen_url} alt={p.nombre} width={180} height={180} className='object-contain drop-shadow-md' />
            : <span className='text-9xl'>{p.emoji}</span>
          }
          {p.badge && (
            <span className='absolute top-3 right-3 bg-[#c47c2b] text-white text-xs font-medium px-2.5 py-1 rounded-full'>
              {p.badge}
            </span>
          )}
          {p.stock === 0 && (
            <div className='absolute inset-0 bg-white/60 flex items-center justify-center'>
              <span className='text-xs font-semibold text-[#8a7060] bg-white px-3 py-1 rounded-full border border-[#f0e6d3]'>
                Sin stock
              </span>
            </div>
          )}
        </div>
        <div className='p-6'>
          <h3 className='text-2xl font-bold text-[#3d2b1f] mb-2' style={{ fontFamily: 'Georgia, serif' }}>
            {p.nombre}
          </h3>
          <p className='text-sm text-[#8a7060] leading-relaxed mb-4'>{p.descripcion}</p>
          <div className='flex items-center justify-between'>
            <span className='text-2xl font-bold text-[#c47c2b]' style={{ fontFamily: 'Georgia, serif' }}>
              ${p.precio} <span className='text-sm text-[#8a7060] font-normal'>/unidad</span>
            </span>
            <button
              onClick={() => agregar({ producto_id: p.id, nombre: p.nombre, emoji: p.emoji ?? '', precio: p.precio })}
              disabled={p.stock === 0}
              className='bg-[#3d2b1f] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Productos() {
  const [tab, setTab] = useState<Tab>('barrita')
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from('productos').select('*').eq('activo', true).order('nombre')
      setProductos(data ?? [])
      setLoading(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs: { value: Tab; label: string }[] = [
    { value: 'barrita', label: '🍫 Barritas' },
    { value: 'mix', label: '🥜 Mixes' },
    { value: 'alfajor', label: '🍪 Alfajor' }
  ]

  const filtrados = productos.filter((p) => p.categoria === tab)

  return (
    <section id='productos' className='py-16 sm:py-24 px-6 sm:px-10 lg:px-16'>
      <div className='max-w-7xl mx-auto'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#c47c2b] mb-3'>Nuestros productos</p>
        <h2 className='text-3xl sm:text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-3' style={{ fontFamily: 'Georgia, serif' }}>
          Snacks que te
          <br />
          hacen bien de verdad
        </h2>
        <p className='text-[#8a7060] text-base sm:text-lg font-light mb-10 max-w-lg'>
          Barras, mixes y nuestro especial alfajor. Todo rico, todo sano.
        </p>

        {/* Tabs */}
        <div className='flex gap-2 flex-wrap mb-8'>
          {tabs.map((t) => {
            const count = productos.filter((p) => p.categoria === t.value).length
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  tab === t.value
                    ? 'bg-[#3d2b1f] text-white'
                    : 'bg-white text-[#8a7060] border border-[#f0e6d3] hover:border-[#c47c2b]'
                }`}
              >
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.value ? 'bg-white/20' : 'bg-[#f0e6d3]'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
          </div>
        ) : filtrados.length === 0 ? (
          <div className='text-center py-20 text-[#8a7060] text-sm'>
            No hay productos disponibles en esta categoría
          </div>
        ) : tab === 'alfajor' ? (
          <AlfajorCard p={filtrados[0]} />
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
            {filtrados.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
