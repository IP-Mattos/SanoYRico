// src/app/dashboard/productos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { type Producto, type Categoria } from '@/lib/types'
import { Plus, Pencil, Trash2, Loader2, X, Check, AlertCircle } from 'lucide-react'

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'barrita', label: '🍫 Barrita' },
  { value: 'mix', label: '🥜 Mix' },
  { value: 'alfajor', label: '🍪 Alfajor' }
]

const EMPTY: Omit<Producto, 'id' | 'created_at' | 'updated_at'> = {
  nombre: '',
  descripcion: '',
  categoria: 'barrita',
  precio: 0,
  costo: 0,
  stock: 0,
  stock_minimo: 5,
  emoji: '🌾',
  badge: '',
  activo: true
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Categoria | 'todos'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase.from('productos').select('*').order('categoria').order('nombre')
    setProductos(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    ;(async () => {
      await cargar()
    })()
  }, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  const abrirEditar = (p: Producto) => {
    setEditando(p)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      categoria: p.categoria,
      precio: p.precio,
      costo: p.costo,
      stock: p.stock,
      stock_minimo: p.stock_minimo,
      emoji: p.emoji ?? '',
      badge: p.badge ?? '',
      activo: p.activo
    })
    setError('')
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (form.precio <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }

    setGuardando(true)
    setError('')

    if (editando) {
      const { error } = await supabase
        .from('productos')
        .update({ ...form })
        .eq('id', editando.id)
      if (error) {
        setError(error.message)
        setGuardando(false)
        return
      }
    } else {
      const { error } = await supabase.from('productos').insert({ ...form })
      if (error) {
        setError(error.message)
        setGuardando(false)
        return
      }
    }

    await cargar()
    setGuardando(false)
    setModalOpen(false)
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminár este producto?')) return
    await supabase.from('productos').delete().eq('id', id)
    await cargar()
  }

  const filtrados = filtro === 'todos' ? productos : productos.filter((p) => p.categoria === filtro)

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-[#3d2b1f]'>Productos</h2>
          <p className='text-[#8a7060] text-sm mt-1'>{productos.length} productos en total</p>
        </div>
        <button
          onClick={abrirCrear}
          className='flex items-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors'
        >
          <Plus className='h-4 w-4' />
          Nuevo producto
        </button>
      </div>

      {/* Filtros */}
      <div className='flex gap-2 flex-wrap'>
        {[{ value: 'todos', label: 'Todos' }, ...CATEGORIAS.map((c) => ({ value: c.value, label: c.label }))].map(
          (f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value as 'todos' | Categoria)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filtro === f.value
                  ? 'bg-[#3d2b1f] text-white'
                  : 'bg-white text-[#8a7060] border border-[#f0e6d3] hover:border-[#c47c2b]'
              }`}
            >
              {f.label}
            </button>
          )
        )}
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
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  Producto
                </th>
                <th className='text-left px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden md:table-cell'>
                  Categoría
                </th>
                <th className='text-right px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  Precio
                </th>
                <th className='text-right px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden sm:table-cell'>
                  Costo
                </th>
                <th className='text-right px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden sm:table-cell'>
                  Stock
                </th>
                <th className='text-center px-5 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wider hidden md:table-cell'>
                  Estado
                </th>
                <th className='px-5 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className='border-b border-[#f0e6d3] last:border-0 hover:bg-[#faf6ef] transition-colors'>
                  <td className='px-5 py-3'>
                    <div className='flex items-center gap-3'>
                      <span className='text-xl'>{p.emoji}</span>
                      <div>
                        <div className='text-sm font-medium text-[#3d2b1f]'>{p.nombre}</div>
                        {p.badge && (
                          <span className='text-xs bg-[#fef3d0] text-[#c47c2b] px-2 py-0.5 rounded-full'>
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className='px-5 py-3 hidden md:table-cell'>
                    <span className='text-sm text-[#8a7060] capitalize'>{p.categoria}</span>
                  </td>
                  <td className='px-5 py-3 text-right text-sm font-semibold text-[#3d2b1f]'>${p.precio}</td>
                  <td className='px-5 py-3 text-right text-sm text-[#8a7060] hidden sm:table-cell'>${p.costo}</td>
                  <td className='px-5 py-3 text-right hidden sm:table-cell'>
                    <span
                      className={`text-sm font-medium ${p.stock <= p.stock_minimo ? 'text-red-500' : 'text-[#3d2b1f]'}`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className='px-5 py-3 text-center hidden md:table-cell'>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                        p.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {p.activo ? <Check className='h-3 w-3' /> : <X className='h-3 w-3' />}
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className='px-5 py-3'>
                    <div className='flex items-center gap-2 justify-end'>
                      <button
                        onClick={() => abrirEditar(p)}
                        className='p-1.5 text-[#8a7060] hover:text-[#c47c2b] hover:bg-[#fef3d0] rounded-lg transition-colors'
                      >
                        <Pencil className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => eliminar(p.id)}
                        className='p-1.5 text-[#8a7060] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className='px-5 py-12 text-center text-[#8a7060] text-sm'>
                    No hay productos en esta categoría
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
              <h3 className='text-lg font-bold text-[#3d2b1f]'>{editando ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={() => setModalOpen(false)} className='text-[#8a7060] hover:text-[#3d2b1f]'>
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='p-6 space-y-4'>
              {/* Nombre y emoji */}
              <div className='flex gap-3'>
                <div className='w-20'>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Emoji</label>
                  <input
                    value={form.emoji ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
                <div className='flex-1'>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Nombre *</label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder='Ej: Miel & Avena'
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Descripción</label>
                <textarea
                  value={form.descripcion ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] resize-none'
                />
              </div>

              {/* Categoría y badge */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Categoría *</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as Categoria }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] bg-white'
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Badge</label>
                  <input
                    value={form.badge ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                    placeholder='Ej: Nuevo, Popular'
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
              </div>

              {/* Precio y costo */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Precio de venta *</label>
                  <input
                    type='number'
                    value={form.precio}
                    onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Costo</label>
                  <input
                    type='number'
                    value={form.costo}
                    onChange={(e) => setForm((f) => ({ ...f, costo: Number(e.target.value) }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
              </div>

              {/* Stock */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Stock actual</label>
                  <input
                    type='number'
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Stock mínimo</label>
                  <input
                    type='number'
                    value={form.stock_minimo}
                    onChange={(e) => setForm((f) => ({ ...f, stock_minimo: Number(e.target.value) }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
                  />
                </div>
              </div>

              {/* Activo */}
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  id='activo'
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                  className='w-4 h-4 accent-[#c47c2b]'
                />
                <label htmlFor='activo' className='text-sm text-[#3d2b1f]'>
                  Producto activo (visible en la tienda)
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className='flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl'>
                  <AlertCircle className='h-4 w-4 flex-shrink-0' />
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className='flex gap-3 pt-2'>
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
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
