// src/components/landing/Productos.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Search, X, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { type Producto, type CategoriaDB } from '@/lib/types'
import { useCart } from '@/context/CartContext'
import { precioConPromo } from '@/lib/pedidos/descuentos'

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

const CARD_BG = 'bg-[radial-gradient(ellipse_at_50%_55%,#fff6e0_0%,#f6e9cf_70%,#f0e1c3_100%)]'

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
  const sinStock = p.stock === 0
  const descripcion = p.descripcion ?? ''
  const esLarga = descripcion.length > DESCRIPCION_LARGA
  const [expanded, setExpanded] = useState(false)
  // Mismo helper que usa el servidor para decidir si la promo está activa
  const [ahora] = useState(() => new Date())
  const { lista, precio, pct } = precioConPromo(p, ahora)

  return (
    <div className='group flex flex-col bg-white rounded-2xl border border-[#eadfce] overflow-hidden shadow-[0_10px_26px_-22px_rgba(61,43,31,0.5)] hover:-translate-y-1 hover:shadow-[0_22px_40px_-18px_rgba(61,43,31,0.32)] hover:border-[#c47c2b]/50 transition-all duration-300'>
      {/* Imagen / emoji */}
      <div className={`relative h-44 sm:h-52 ${CARD_BG} flex items-center justify-center`}>
        {p.imagen_url ? (
          <Image
            src={p.imagen_url}
            alt={p.nombre}
            width={200}
            height={200}
            className='h-32 sm:h-40 w-auto object-contain drop-shadow-[0_14px_14px_rgba(61,43,31,0.25)] group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-500'
          />
        ) : (
          <span className='text-7xl group-hover:scale-110 transition-transform duration-500'>{p.emoji}</span>
        )}

        {p.badge && (
          <span className='absolute top-3 left-3 max-w-[60%] bg-[#4a6741] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm leading-tight'>
            {p.badge}
          </span>
        )}
        {pct !== null && (
          <span
            className='absolute top-3 right-3 bg-[#c0392b] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm'
            aria-label={`${pct}% de descuento`}
          >
            -{pct}%
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
      <div className='flex-1 flex flex-col p-4 sm:p-5'>
        <h3
          className='font-bold text-[#3d2b1f] text-base sm:text-lg leading-snug mb-1.5 line-clamp-2'
          style={{ fontFamily: 'var(--display)' }}
          title={p.nombre}
        >
          {p.nombre}
        </h3>
        {descripcion && (
          <div className='mb-4'>
            <p
              className={`text-[13px] text-[#6e5746] leading-relaxed ${!expanded && esLarga ? 'line-clamp-2' : ''}`}
            >
              {descripcion}
            </p>
            {esLarga && (
              <button
                type='button'
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className='mt-1 inline-flex items-center min-h-6 text-xs text-[#8a5a1a] hover:text-[#3d2b1f] font-semibold underline decoration-dotted underline-offset-2 transition-colors'
              >
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}

        <div className='mt-auto flex items-end justify-between gap-2 pt-3 border-t border-[#f0e6d3]'>
          <div className='flex items-baseline gap-x-1.5 gap-y-0 flex-wrap pt-1'>
            {pct !== null && (
              <span className='text-sm text-[#6e5746] line-through' aria-label={`Precio anterior $${lista}`}>
                ${lista}
              </span>
            )}
            <span className='text-2xl font-extrabold text-[#8a5a1a] leading-none' style={{ fontFamily: 'var(--display)' }}>
              ${precio}
            </span>
            <span className='text-[10px] text-[#6e5746] font-semibold uppercase tracking-wider'>/unidad</span>
          </div>
          <button
            onClick={() => agregar({ producto_id: p.id, nombre: p.nombre, emoji: p.emoji ?? '', precio })}
            disabled={sinStock}
            aria-label={`Agregar ${p.nombre} al carrito`}
            className='shrink-0 inline-flex items-center justify-center gap-1.5 h-11 min-w-11 bg-[#3d2b1f] text-white font-semibold text-sm leading-none rounded-full hover:bg-[#c47c2b] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#3d2b1f] px-3.5 sm:px-4'
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
    <section id='productos' className='py-20 sm:py-28 px-6 sm:px-10 lg:px-16 scroll-mt-12'>
      <div className='max-w-7xl mx-auto'>
        <div className='reveal'>
          <p className='eyebrow'>Nuestros productos</p>
          <h2 className='section-title'>
            Snacks que te{' '}
            <br className='hidden sm:block' />
            hacen bien de verdad
          </h2>
          <p className='section-lead mb-10'>Barras, mixes y nuestro especial alfajor. Todo rico, todo sano.</p>
        </div>

        {/* Buscador + orden */}
        <div className='flex flex-col sm:flex-row gap-3 mb-6'>
          <div className='relative flex-1'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e5746]' />
            <input
              type='search'
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder='Buscar por nombre o ingrediente…'
              className='w-full h-12 pl-11 pr-12 rounded-full text-[15px] bg-white border border-[#dccbb0] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]/40 focus:border-[#c47c2b] transition-shadow placeholder:text-[#7d6857]'
              aria-label='Buscar productos'
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                aria-label='Limpiar búsqueda'
                className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f0e6d3] text-[#3d2b1f] flex items-center justify-center hover:bg-[#c47c2b] hover:text-white transition-colors'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <label htmlFor='sort' className='text-xs text-[#6e5746] font-semibold uppercase tracking-wider whitespace-nowrap'>
              Orden
            </label>
            <select
              id='sort'
              value={orden}
              onChange={(e) => setOrden(e.target.value as SortKey)}
              className='h-12 pl-4 pr-8 rounded-full text-[15px] bg-white border border-[#dccbb0] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]/40 focus:border-[#c47c2b] text-[#3d2b1f] font-medium'
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
          <div className='flex gap-2 sm:flex-wrap overflow-x-auto sm:overflow-visible -mx-6 px-6 sm:mx-0 sm:px-0 pb-1 mb-8 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {categorias.map((cat) => {
              const count = productos.filter((p) => p.categoria === cat.slug).length
              return (
                <button
                  key={cat.slug}
                  onClick={() => setTab(cat.slug)}
                  className={`shrink-0 snap-start flex items-center gap-2 px-4 sm:px-5 min-h-11 rounded-full text-sm font-semibold transition-colors ${
                    tab === cat.slug
                      ? 'bg-[#3d2b1f] text-white shadow-[0_8px_18px_-10px_rgba(61,43,31,0.7)]'
                      : 'bg-white text-[#5c4033] border border-[#dccbb0] hover:border-[#c47c2b]'
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
          <p className='text-sm text-[#6e5746] mb-6'>
            {filtrados.length === 0
              ? 'Sin resultados para '
              : `${filtrados.length} ${filtrados.length === 1 ? 'resultado' : 'resultados'} para `}
            <span className='font-semibold text-[#3d2b1f]'>&ldquo;{busqueda.trim()}&rdquo;</span>
          </p>
        )}

        {/* Contenido */}
        {loading ? (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5'>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className='text-center py-20 text-[#6e5746] text-sm'>
            {buscando
              ? 'Probá con otra palabra o revisá el catálogo por categorías.'
              : 'No hay productos disponibles en esta categoría.'}
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5'>
            {filtrados.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
