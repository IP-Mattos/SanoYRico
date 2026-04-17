// src/components/landing/Productos.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Search, X, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { type Producto, type CategoriaDB } from '@/lib/types'
import { useCart } from '@/context/CartContext'

type SortKey = 'nombre' | 'precio-asc' | 'precio-desc' | 'nuevos'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'nombre', label: 'A – Z' },
  { value: 'precio-asc', label: 'Precio ↑' },
  { value: 'precio-desc', label: 'Precio ↓' },
  { value: 'nuevos', label: 'Novedades' }
]

function sortProductos(arr: Producto[], key: SortKey): Producto[] {
  const copia = [...arr]
  switch (key) {
    case 'nombre':
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    case 'precio-asc':
      return copia.sort((a, b) => a.precio - b.precio)
    case 'precio-desc':
      return copia.sort((a, b) => b.precio - a.precio)
    case 'nuevos':
      return copia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

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

function SkeletonCard() {
  return (
    <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
      <div className='h-40 bg-linear-to-br from-[#f0e6d3] to-[#fef3d0] animate-pulse' />
      <div className='p-4 space-y-3'>
        <div className='h-4 bg-[#f0e6d3] rounded animate-pulse w-3/4' />
        <div className='space-y-1.5'>
          <div className='h-2.5 bg-[#f0e6d3] rounded animate-pulse' />
          <div className='h-2.5 bg-[#f0e6d3] rounded animate-pulse w-5/6' />
        </div>
        <div className='flex items-center justify-between pt-1'>
          <div className='h-5 bg-[#f0e6d3] rounded animate-pulse w-20' />
          <div className='h-8 w-8 bg-[#f0e6d3] rounded-full animate-pulse' />
        </div>
      </div>
    </div>
  )
}

// Umbral de longitud a partir del cual mostramos el toggle "Ver más".
// 100 chars ≈ 2 líneas en el tamaño de fuente de la descripción.
const DESCRIPCION_LARGA = 100

function ProductCard({ p }: { p: Producto }) {
  const { agregar } = useCart()
  const bg = BG[p.emoji ?? ''] ?? DEFAULT_BG
  const sinStock = p.stock === 0
  const descripcion = p.descripcion ?? ''
  const esLarga = descripcion.length > DESCRIPCION_LARGA
  const [expanded, setExpanded] = useState(false)

  return (
    <div className='group flex flex-col bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(61,43,31,0.25)] hover:border-[#c47c2b]/40 transition-all duration-300'>
      {/* Imagen / emoji */}
      <div className={`relative h-44 bg-linear-to-br ${bg} flex items-center justify-center`}>
        {p.imagen_url ? (
          <Image
            src={p.imagen_url}
            alt={p.nombre}
            width={160}
            height={160}
            className='object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500'
          />
        ) : (
          <span className='text-7xl group-hover:scale-110 transition-transform duration-500'>{p.emoji}</span>
        )}

        {p.badge && (
          <span className='absolute top-3 left-3 bg-[#4a6741] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm'>
            {p.badge}
          </span>
        )}
        {sinStock && (
          <div className='absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center'>
            <span className='text-xs font-semibold text-[#3d2b1f] bg-white px-3 py-1.5 rounded-full border border-[#f0e6d3] shadow-sm'>
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Contenido: flex-col + price/CTA al bottom con mt-auto */}
      <div className='flex-1 flex flex-col p-4'>
        <h3
          className='font-bold text-[#3d2b1f] mb-1.5 line-clamp-1'
          style={{ fontFamily: 'Georgia, serif' }}
          title={p.nombre}
        >
          {p.nombre}
        </h3>
        {descripcion && (
          <div className='mb-4'>
            <p
              className={`text-xs text-[#8a7060] leading-relaxed ${!expanded && esLarga ? 'line-clamp-2' : ''}`}
            >
              {descripcion}
            </p>
            {esLarga && (
              <button
                type='button'
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className='mt-1 text-[11px] text-[#c47c2b] hover:text-[#8a5a1a] font-semibold underline decoration-dotted underline-offset-2 transition-colors'
              >
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}

        <div className='mt-auto flex items-center justify-between gap-2 pt-2'>
          <div className='flex items-baseline gap-1'>
            <span className='text-xl font-bold text-[#8a5a1a]' style={{ fontFamily: 'Georgia, serif' }}>
              ${p.precio}
            </span>
            <span className='text-[10px] text-[#8a7060] font-medium uppercase tracking-wider'>/unidad</span>
          </div>
          <button
            onClick={() => agregar({ producto_id: p.id, nombre: p.nombre, emoji: p.emoji ?? '', precio: p.precio })}
            disabled={sinStock}
            aria-label={`Agregar ${p.nombre} al carrito`}
            className='shrink-0 inline-flex items-center justify-center gap-1.5 h-10 bg-[#3d2b1f] text-white font-semibold text-sm leading-none rounded-full hover:bg-[#c47c2b] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#3d2b1f] px-4'
          >
            <Plus className='h-4 w-4 shrink-0' strokeWidth={2.75} />
            <span className='hidden sm:inline'>Agregar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function Productos() {
  const [tab, setTab] = useState<string>('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<CategoriaDB[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<SortKey>('nombre')
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const [{ data }, { data: cats }] = await Promise.all([
        supabase.from('productos').select('*').eq('activo', true).order('nombre'),
        supabase.from('categorias').select('*').eq('activo', true).order('orden')
      ])
      setProductos(data ?? [])
      setCategorias(cats ?? [])
      if (cats && cats.length > 0) setTab(cats[0].slug)
      setLoading(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Si hay búsqueda activa, se ignoran los tabs y se busca en todo el catálogo.
  const buscando = busqueda.trim().length > 0
  const filtrados = useMemo(() => {
    const base = buscando
      ? productos.filter((p) => {
          const q = normalizar(busqueda.trim())
          return normalizar(p.nombre).includes(q) || normalizar(p.descripcion ?? '').includes(q)
        })
      : productos.filter((p) => p.categoria === tab)
    return sortProductos(base, orden)
  }, [productos, tab, busqueda, orden, buscando])

  return (
    <section id='productos' className='py-16 sm:py-24 px-6 sm:px-10 lg:px-16'>
      <div className='max-w-7xl mx-auto'>
        <p className='text-xs font-medium tracking-widest uppercase text-[#8a5a1a] mb-3'>Nuestros productos</p>
        <h2 className='text-3xl sm:text-4xl lg:text-5xl font-black text-[#3d2b1f] mb-3' style={{ fontFamily: 'Georgia, serif' }}>
          Snacks que te{' '}
          <br />
          hacen bien de verdad
        </h2>
        <p className='text-[#5c4033] text-base sm:text-lg font-light mb-10 max-w-lg'>
          Barras, mixes y nuestro especial alfajor. Todo rico, todo sano.
        </p>

        {/* Buscador + orden */}
        <div className='flex flex-col sm:flex-row gap-3 mb-6'>
          <div className='relative flex-1'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060]' />
            <input
              type='search'
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder='Buscar por nombre o ingrediente…'
              className='w-full pl-11 pr-10 py-2.5 rounded-full text-sm bg-white border border-[#f0e6d3] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]/40 focus:border-[#c47c2b] transition-shadow placeholder:text-[#c4b5a8]'
              aria-label='Buscar productos'
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                aria-label='Limpiar búsqueda'
                className='absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f0e6d3] text-[#3d2b1f] flex items-center justify-center hover:bg-[#c47c2b] hover:text-white transition-colors'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <label htmlFor='sort' className='text-xs text-[#8a7060] font-medium uppercase tracking-wider whitespace-nowrap'>
              Orden
            </label>
            <select
              id='sort'
              value={orden}
              onChange={(e) => setOrden(e.target.value as SortKey)}
              className='py-2.5 pl-3 pr-8 rounded-full text-sm bg-white border border-[#f0e6d3] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]/40 focus:border-[#c47c2b] text-[#3d2b1f] font-medium'
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs (ocultos mientras hay búsqueda activa) */}
        {!buscando && (
          <div className='flex gap-2 flex-wrap mb-8'>
            {categorias.map((cat) => {
              const count = productos.filter((p) => p.categoria === cat.slug).length
              return (
                <button
                  key={cat.slug}
                  onClick={() => setTab(cat.slug)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    tab === cat.slug
                      ? 'bg-[#3d2b1f] text-white'
                      : 'bg-white text-[#8a7060] border border-[#f0e6d3] hover:border-[#c47c2b]'
                  }`}
                >
                  <span>{cat.icono}</span>
                  {cat.nombre}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === cat.slug ? 'bg-white/20' : 'bg-[#f0e6d3]'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {buscando && (
          <p className='text-sm text-[#8a7060] mb-6'>
            {filtrados.length === 0
              ? 'Sin resultados para '
              : `${filtrados.length} ${filtrados.length === 1 ? 'resultado' : 'resultados'} para `}
            <span className='font-semibold text-[#3d2b1f]'>&ldquo;{busqueda.trim()}&rdquo;</span>
          </p>
        )}

        {/* Contenido */}
        {loading ? (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className='text-center py-20 text-[#8a7060] text-sm'>
            {buscando
              ? 'Probá con otra palabra o revisá el catálogo por categorías.'
              : 'No hay productos disponibles en esta categoría.'}
          </div>
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
