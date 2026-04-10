// src/app/dashboard/categorias/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { type CategoriaDB } from '@/lib/types'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
  AlertCircle,
  Package,
  Wheat,
  Cookie,
  Apple,
  Cherry,
  Banana,
  Cake,
  Beef,
  Egg,
  Fish,
  Salad,
  Sandwich,
  Pizza,
  Coffee,
  Milk,
  IceCreamCone,
  Croissant,
  Popcorn,
  Carrot,
  Leaf,
  Candy,
  Grape,
  CupSoda,
  Nut
} from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  wheat: Wheat,
  cookie: Cookie,
  candy: Candy,
  nut: Nut,
  apple: Apple,
  cherry: Cherry,
  banana: Banana,
  grapes: Grape,
  'cake-slice': Cake,
  beef: Beef,
  egg: Egg,
  fish: Fish,
  salad: Salad,
  sandwich: Sandwich,
  pizza: Pizza,
  'cup-soda': CupSoda,
  coffee: Coffee,
  milk: Milk,
  'ice-cream-cone': IceCreamCone,
  croissant: Croissant,
  popcorn: Popcorn,
  carrot: Carrot,
  leaf: Leaf,
}

const ICON_OPTIONS = Object.keys(ICON_MAP)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const EMPTY_FORM = {
  nombre: '',
  slug: '',
  icono: 'wheat',
  orden: 0,
  activo: true,
}

type FormState = typeof EMPTY_FORM

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaDB[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<CategoriaDB | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [slugManual, setSlugManual] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .order('orden')
      .order('nombre')
    setCategorias(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    ;(async () => { await cargar() })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm(EMPTY_FORM)
    setSlugManual(false)
    setError('')
    setModalOpen(true)
  }

  const abrirEditar = (cat: CategoriaDB) => {
    setEditando(cat)
    setForm({
      nombre: cat.nombre,
      slug: cat.slug,
      icono: cat.icono,
      orden: cat.orden,
      activo: cat.activo,
    })
    setSlugManual(true)
    setError('')
    setModalOpen(true)
  }

  const handleNombreChange = (nombre: string) => {
    setForm((f) => ({
      ...f,
      nombre,
      slug: slugManual ? f.slug : slugify(nombre),
    }))
  }

  const handleSlugChange = (slug: string) => {
    setSlugManual(true)
    setForm((f) => ({ ...f, slug }))
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.slug.trim()) { setError('El slug es obligatorio'); return }
    setGuardando(true)
    setError('')

    const payload = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim(),
      icono: form.icono,
      orden: form.orden,
      activo: form.activo,
    }

    if (editando) {
      const { error: err } = await supabase
        .from('categorias')
        .update(payload)
        .eq('id', editando.id)
      if (err) { setError(err.message); setGuardando(false); return }
    } else {
      const { error: err } = await supabase.from('categorias').insert(payload)
      if (err) { setError(err.message); setGuardando(false); return }
    }

    await cargar()
    setGuardando(false)
    setModalOpen(false)
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    await supabase.from('categorias').delete().eq('id', id)
    await cargar()
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-[#3d2b1f]'>Categorías</h2>
          <p className='text-[#8a7060] text-sm mt-1'>{categorias.length} categorías en total</p>
        </div>
        <button
          onClick={abrirCrear}
          className='flex items-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors'
        >
          <Plus className='h-4 w-4' />
          Nueva categoría
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className='flex justify-center py-20'>
          <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
        </div>
      ) : (
        <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-[#f0e6d3] bg-[#faf6ef]'>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>Categoría</th>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden sm:table-cell'>Slug</th>
                <th className='text-center px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden md:table-cell'>Orden</th>
                <th className='text-center px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden md:table-cell'>Estado</th>
                <th className='px-5 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => {
                const Icon = ICON_MAP[cat.icono] ?? Package
                return (
                  <tr key={cat.id} className='border-b border-[#f0e6d3] last:border-0 hover:bg-[#faf6ef] transition-colors'>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-xl bg-[#fef3d0] flex items-center justify-center shrink-0'>
                          <Icon className='h-5 w-5 text-[#c47c2b]' />
                        </div>
                        <span className='text-sm font-medium text-[#3d2b1f]'>{cat.nombre}</span>
                      </div>
                    </td>
                    <td className='px-5 py-3 hidden sm:table-cell'>
                      <code className='text-xs text-[#8a7060] bg-[#faf6ef] px-2 py-1 rounded-lg'>{cat.slug}</code>
                    </td>
                    <td className='px-5 py-3 text-center hidden md:table-cell'>
                      <span className='text-sm text-[#8a7060]'>{cat.orden}</span>
                    </td>
                    <td className='px-5 py-3 text-center hidden md:table-cell'>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cat.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {cat.activo ? <Check className='h-3 w-3' /> : <X className='h-3 w-3' />}
                        {cat.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-2 justify-end'>
                        <button
                          onClick={() => abrirEditar(cat)}
                          className='p-1.5 text-[#8a7060] hover:text-[#c47c2b] hover:bg-[#fef3d0] rounded-lg transition-colors'
                        >
                          <Pencil className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => eliminar(cat.id)}
                          className='p-1.5 text-[#8a7060] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={5} className='px-5 py-12 text-center text-[#8a7060] text-sm'>
                    No hay categorías creadas todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-6 border-b border-[#f0e6d3]'>
              <h3 className='text-lg font-bold text-[#3d2b1f]'>
                {editando ? 'Editar categoría' : 'Nueva categoría'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className='text-[#8a7060] hover:text-[#3d2b1f] transition-colors'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='p-6 space-y-5'>

              {/* Nombre */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  placeholder='Ej: Barritas energéticas'
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
              </div>

              {/* Slug */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>
                  Slug *
                  <span className='ml-1 font-normal text-[#8a7060]'>(se genera automáticamente)</span>
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder='ej: barritas-energeticas'
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
              </div>

              {/* Orden */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Orden</label>
                <input
                  type='number'
                  value={form.orden}
                  onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                />
              </div>

              {/* Selector de icono */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-2'>Ícono</label>
                <div className='border border-[#f0e6d3] rounded-xl p-3 max-h-52 overflow-y-auto'>
                  <div className='grid grid-cols-6 gap-2'>
                    {ICON_OPTIONS.map((key) => {
                      const Icon = ICON_MAP[key]
                      const selected = form.icono === key
                      return (
                        <button
                          key={key}
                          type='button'
                          onClick={() => setForm((f) => ({ ...f, icono: key }))}
                          title={key}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                            selected
                              ? 'bg-[#3d2b1f] text-white'
                              : 'hover:bg-[#fef3d0] text-[#8a7060] hover:text-[#c47c2b]'
                          }`}
                        >
                          <Icon className='h-5 w-5' />
                          <span className='text-[9px] leading-tight text-center truncate w-full'>{key}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Preview del icono seleccionado */}
                <div className='mt-2 flex items-center gap-2 text-xs text-[#8a7060]'>
                  {(() => {
                    const SelectedIcon = ICON_MAP[form.icono] ?? Package
                    return (
                      <>
                        <div className='w-7 h-7 rounded-lg bg-[#fef3d0] flex items-center justify-center'>
                          <SelectedIcon className='h-4 w-4 text-[#c47c2b]' />
                        </div>
                        <span>Seleccionado: <strong className='text-[#3d2b1f]'>{form.icono}</strong></span>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Activo */}
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  id='activo-cat'
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                  className='w-4 h-4 accent-[#c47c2b]'
                />
                <label htmlFor='activo-cat' className='text-sm text-[#3d2b1f]'>
                  Categoría activa (visible en la tienda)
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className='flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl'>
                  <AlertCircle className='h-4 w-4 shrink-0' />
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className='flex gap-3 pt-1'>
                <button
                  onClick={() => setModalOpen(false)}
                  className='flex-1 px-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#8a7060] hover:bg-[#faf6ef] transition-colors'
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className='flex-1 flex items-center justify-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60'
                >
                  {guardando && <Loader2 className='h-4 w-4 animate-spin' />}
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear categoría'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
