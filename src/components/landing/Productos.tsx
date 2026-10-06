// src/components/landing/Productos.tsx
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Search, X, Plus, Minus, LayoutGrid } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { type Producto, type CategoriaDB } from '@/lib/types'
import { useCart } from '@/context/CartContext'
import { precioConPromo } from '@/lib/pedidos/descuentos'
import { iconNode } from './icons'

type SortKey = 'nombre' | 'precio-asc' | 'precio-desc' | 'nuevos'

const TODOS = 'todos'

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
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const GRID = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5'
const IMG_BG = 'bg-[radial-gradient(circle_at_50%_55%,#fffaf0_0%,#f8ecd4_62%,#f1e2c4_100%)]'

function SkeletonCard() {
  return (
    <div className='card overflow-hidden'>
      <div className='aspect-square bg-linear-to-br from-[#f0e6d3] to-[#fef3d0] animate-pulse' />
      <div className='p-4 space-y-3'>
        <div className='h-4 bg-[#f0e6d3] rounded animate-pulse w-3/4' />
        <div className='h-2.5 bg-[#f0e6d3] rounded animate-pulse w-full' />
        <div className='h-7 bg-[#f0e6d3] rounded animate-pulse w-20' />
        <div className='h-11 bg-[#f0e6d3] rounded-full animate-pulse' />
      </div>
    </div>
  )
}

// Umbral de longitud a partir del cual mostramos el toggle "Ver más".
// 45 chars ≈ 1 línea en el tamaño de fuente de la descripción.
const DESCRIPCION_LARGA = 45

function ProductCard({ p, idx }: { p: Producto; idx: number }) {
  const { agregar, items, cambiarCantidad } = useCart()
  const sinStock = p.stock === 0
  const descripcion = p.descripcion ?? ''
  const esLarga = descripcion.length > DESCRIPCION_LARGA
  const [expanded, setExpanded] = useState(false)
  // Mismo helper que usa el servidor para decidir si la promo está activa
  const [ahora] = useState(() => new Date())
  const { lista, precio, pct } = precioConPromo(p, ahora)
  const enCarrito = items.find((i) => i.producto_id === p.id)?.cantidad ?? 0

  return (
    <article
      className={`reveal group card card-hover flex flex-col overflow-hidden ${sinStock ? 'opacity-90' : ''}`}
      style={{ '--i': idx % 4 } as React.CSSProperties}
    >
      {/* Imagen / emoji a sangre completa */}
      <div className={`relative aspect-square ${IMG_BG} flex items-center justify-center overflow-hidden`}>
        {p.imagen_url ? (
          <Image
            src={p.imagen_url}
            alt={p.nombre}
            fill
            sizes='(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw'
            className={`object-contain p-5 sm:p-8 drop-shadow-[0_16px_16px_rgba(61,43,31,0.22)] group-hover:scale-105 transition-transform duration-500 ${
              sinStock ? 'grayscale-[0.6] opacity-70' : ''
            }`}
          />
        ) : (
          <span className={`text-8xl group-hover:scale-105 transition-transform duration-500 ${sinStock ? 'opacity-50' : ''}`}>
            {p.emoji}
          </span>
        )}

        {p.badge && (
          <span className='absolute top-3 left-3 max-w-[62%] bg-[#4a6741] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm leading-tight'>
            {p.badge}
          </span>
        )}
        {pct !== null && (
          <span
            className='absolute top-3 right-3 bg-[#c0392b] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm'
            aria-label={`${pct}% de descuento`}
          >
            -{pct}%
          </span>
        )}
        {sinStock && (
          <span className='absolute bottom-3 left-3 text-xs font-semibold text-[#3d2b1f] bg-white px-3 py-1.5 rounded-full border border-[#eadfce] shadow-sm'>
            Agotado
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className='flex-1 flex flex-col p-4 sm:p-5'>
        <h3
          className='font-bold text-[#3d2b1f] text-base sm:text-lg leading-snug line-clamp-2'
          style={{ fontFamily: 'var(--display)' }}
          title={p.nombre}
        >
          {p.nombre}
        </h3>

        {descripcion && (
          <div className='mt-1.5'>
            <p className={`text-[13px] text-[#6e5746] leading-relaxed ${!expanded && esLarga ? 'line-clamp-1' : ''}`}>
              {descripcion}
            </p>
            {esLarga && (
              <button
                type='button'
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className='mt-0.5 inline-flex items-center min-h-8 text-xs text-[#8a5a1a] hover:text-[#3d2b1f] font-semibold underline underline-offset-4 decoration-[#c47c2b]/50 transition-colors'
              >
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}

        <div className='mt-auto pt-4'>
          <div className='flex items-baseline gap-x-2 flex-wrap mb-3'>
            <span className='text-3xl font-extrabold text-[#3d2b1f] leading-none tracking-tight' style={{ fontFamily: 'var(--display)' }}>
              ${precio}
            </span>
            {pct !== null && (
              <span className='text-sm text-[#6e5746] line-through' aria-label={`Precio anterior $${lista}`}>
                ${lista}
              </span>
            )}
            <span className='text-[11px] text-[#6e5746] font-semibold uppercase tracking-wider'>/unidad</span>
          </div>

          {enCarrito > 0 && !sinStock ? (
            <div
              className='animate-pop flex items-center justify-between h-11 rounded-full bg-[#3d2b1f] text-white px-1.5'
              role='group'
              aria-label={`Cantidad de ${p.nombre} en el carrito`}
            >
              <button
                type='button'
                onClick={() => cambiarCantidad(p.id, enCarrito - 1)}
                aria-label={`Quitar una unidad de ${p.nombre}`}
                className='w-11 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-95 transition'
              >
                <Minus className='h-4 w-4' strokeWidth={2.5} />
              </button>
              <span key={enCarrito} className='animate-bump text-sm font-bold tabular-nums' aria-live='polite'>
                {enCarrito}
              </span>
              <button
                type='button'
                onClick={() => agregar({ producto_id: p.id, nombre: p.nombre, emoji: p.emoji ?? '', precio })}
                aria-label={`Agregar otra unidad de ${p.nombre}`}
                className='w-11 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-95 transition'
              >
                <Plus className='h-4 w-4' strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => agregar({ producto_id: p.id, nombre: p.nombre, emoji: p.emoji ?? '', precio })}
              disabled={sinStock}
              aria-label={`Agregar ${p.nombre} al carrito`}
              className='w-full inline-flex items-center justify-center gap-2 h-11 bg-[#3d2b1f] text-white font-semibold text-sm leading-none rounded-full hover:bg-[#c47c2b] active:scale-[0.98] transition-all disabled:bg-[#e9dfce] disabled:text-[#6e5746] disabled:cursor-not-allowed'
            >
              <Plus className='h-4 w-4 shrink-0' strokeWidth={2.5} />
              {sinStock ? 'Agotado' : 'Agregar'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function Productos() {
  const [tab, setTab] = useState<string>(TODOS)
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<CategoriaDB[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<SortKey>('nombre')
  const supabase = createClient()
  const tabsRef = useRef<HTMLDivElement>(null)
  const indRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const cargar = async () => {
      const [{ data }, { data: cats }] = await Promise.all([
        supabase.from('productos').select('*').eq('activo', true).order('nombre'),
        supabase.from('categorias').select('*').eq('activo', true).order('orden')
      ])
      setProductos(data ?? [])
      setCategorias(cats ?? [])
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
      : tab === TODOS
        ? productos
        : productos.filter((p) => p.categoria === tab)
    return sortProductos(base, orden)
  }, [productos, tab, busqueda, orden, buscando])

  // Indicador deslizante: se posiciona sobre el tab activo midiendo el DOM (sin estado en React)
  useEffect(() => {
    const mover = () => {
      const cont = tabsRef.current
      const ind = indRef.current
      if (!cont || !ind) return
      const activo = cont.querySelector<HTMLElement>('button[aria-pressed="true"]')
      if (!activo) {
        ind.style.opacity = '0'
        return
      }
      ind.style.opacity = '1'
      ind.style.width = `${activo.offsetWidth}px`
      ind.style.transform = `translateX(${activo.offsetLeft}px)`
    }
    mover()
    window.addEventListener('resize', mover)
    return () => window.removeEventListener('resize', mover)
  }, [tab, buscando, categorias, productos.length, loading])

  const tabCls = (activo: boolean) =>
    `shrink-0 snap-start inline-flex items-center gap-2 px-4 min-h-10 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
      activo ? 'relative z-10 text-white' : 'relative z-10 text-[#5c4033] hover:bg-[#f0e6d3]'
    }`
  const countCls = (activo: boolean) =>
    `text-xs px-1.5 py-0.5 rounded-full tabular-nums ${activo ? 'bg-white/20' : 'bg-[#f0e6d3]'}`

  return (
    <section id='productos' className='section-y scroll-mt-12'>
      <div className='container-x'>
        <div className='reveal'>
          <p className='eyebrow'>Nuestros productos</p>
          <h2 className='section-title'>
            Snacks que te{' '}
            <br className='hidden sm:block' />
            hacen bien de verdad
          </h2>
          <p className='section-lead mb-10'>Barras, mixes y nuestro especial alfajor. Todo rico, todo sano.</p>
        </div>

        {/* Barra de herramientas: tabs a la izquierda, búsqueda y orden a la derecha */}
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-8'>
          <div
            ref={tabsRef}
            className='relative flex gap-1 overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-1 lg:overflow-visible snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:bg-white lg:border lg:border-[#eadfce] lg:rounded-full lg:py-1 lg:shadow-[var(--shadow-card)]'
            role='group'
            aria-label='Categorías'
          >
            <span
              ref={indRef}
              aria-hidden='true'
              className='absolute left-0 top-0 bottom-0 my-auto h-10 rounded-full bg-[#3d2b1f] shadow-sm opacity-0 transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] motion-reduce:transition-none lg:top-1 lg:bottom-1 lg:my-0'
            />
            <button
              onClick={() => setTab(TODOS)}
              aria-pressed={!buscando && tab === TODOS}
              className={tabCls(!buscando && tab === TODOS)}
            >
              <LayoutGrid className='h-4 w-4 shrink-0' strokeWidth={1.75} aria-hidden='true' />
              Todos
              <span className={countCls(!buscando && tab === TODOS)}>{productos.length}</span>
            </button>
            {categorias.map((cat) => {
              const count = productos.filter((p) => p.categoria === cat.slug).length
              const activo = !buscando && tab === cat.slug
              return (
                <button key={cat.slug} onClick={() => setTab(cat.slug)} aria-pressed={activo} className={tabCls(activo)}>
                  {iconNode(`${cat.nombre} ${cat.slug}`, 0, 'h-4 w-4 shrink-0')}
                  {cat.nombre}
                  <span className={countCls(activo)}>{count}</span>
                </button>
              )
            })}
          </div>

          <div className='flex gap-2 items-center'>
            <div className='relative flex-1 lg:flex-none lg:w-80'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e5746]' aria-hidden='true' />
              <input
                type='search'
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder='Buscar por nombre o ingrediente…'
                className='w-full h-11 pl-11 pr-10 rounded-full text-sm bg-white border border-[#dccbb0] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]/40 focus:border-[#c47c2b] transition-shadow placeholder:text-[#7d6857]'
                aria-label='Buscar productos'
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  aria-label='Limpiar búsqueda'
                  className='absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f0e6d3] text-[#3d2b1f] flex items-center justify-center hover:bg-[#c47c2b] hover:text-white transition-colors'
                >
                  <X className='h-3.5 w-3.5' />
                </button>
              )}
            </div>
            <label htmlFor='sort' className='sr-only'>
              Orden
            </label>
            <select
              id='sort'
              value={orden}
              onChange={(e) => setOrden(e.target.value as SortKey)}
              className='h-11 pl-4 pr-8 rounded-full text-sm bg-white border border-[#dccbb0] focus:outline-none focus:ring-2 focus:ring-[#c47c2b]/40 focus:border-[#c47c2b] text-[#3d2b1f] font-medium'
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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
          <div className={GRID}>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className='text-center py-20 text-[#6e5746] text-sm'>
            {buscando
              ? 'Probá con otra palabra o revisá el catálogo por categorías.'
              : 'No hay productos disponibles en esta categoría.'}
          </div>
        ) : (
          <div key={`${tab}|${orden}|${buscando}`} className={`${GRID} animate-gridin`}>
            {filtrados.map((p, idx) => (
              <ProductCard key={p.id} p={p} idx={idx} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
