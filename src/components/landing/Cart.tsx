// src/components/landing/Cart.tsx
'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase'
import { X, Plus, Minus, ShoppingBag, Loader2, CheckCircle } from 'lucide-react'

type Paso = 'carrito' | 'checkout' | 'confirmado'

const NUMERO_DUENO = '59893644132' // ← cambiá por el número real del dueño

export function Cart() {
  const { items, quitar, cambiarCantidad, vaciar, total, cantidad, isOpen, setIsOpen } = useCart()
  const [paso, setPaso] = useState<Paso>('carrito')
  const [guardando, setGuardando] = useState(false)
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null)
  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '', notas: '' })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const supabase = createClient()

  const validar = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Tu nombre es obligatorio'
    if (!form.telefono.trim()) e.telefono = 'Tu teléfono es obligatorio'
    if (!form.direccion.trim()) e.direccion = 'Tu dirección es obligatoria'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const confirmarPedido = async () => {
    if (!validar()) return
    setGuardando(true)

    // Crear pedido
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .insert({
        nombre: form.nombre,
        telefono: form.telefono,
        direccion: form.direccion,
        notas: form.notas || null,
        total
      })
      .select('id, numero')
      .single()

    if (error || !pedido) {
      setGuardando(false)
      return
    }

    // Crear items
    await supabase.from('pedido_items').insert(
      items.map((i) => ({
        pedido_id: pedido.id,
        producto_id: i.producto_id,
        producto_nombre: i.nombre,
        producto_emoji: i.emoji,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
        subtotal: i.precio * i.cantidad
      }))
    )

    // Notificar al dueño por WhatsApp
    const resumenItems = items
      .map((i) => `• ${i.emoji} ${i.nombre} x${i.cantidad} — $${i.precio * i.cantidad}`)
      .join('\n')

    const mensaje =
      `🛍️ *Nuevo pedido #${pedido.numero}*\n\n` +
      `👤 *Cliente:* ${form.nombre}\n` +
      `📞 *Teléfono:* ${form.telefono}\n` +
      `📍 *Dirección:* ${form.direccion}` +
      `${form.notas ? `\n📝 *Notas:* ${form.notas}` : ''}\n\n` +
      `*Productos:*\n${resumenItems}\n\n` +
      `💰 *Total: $${total}*`

    window.open(`https://wa.me/${NUMERO_DUENO}?text=${encodeURIComponent(mensaje)}`, '_blank')

    setNumeroPedido(pedido.numero)
    vaciar()
    setPaso('confirmado')
    setGuardando(false)
  }

  const cerrar = () => {
    setIsOpen(false)
    setTimeout(() => {
      setPaso('carrito')
      setForm({ nombre: '', telefono: '', direccion: '', notas: '' })
      setErrores({})
    }, 300)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className='fixed inset-0 bg-black/40 z-50' onClick={cerrar} />}

      {/* Drawer */}
      <div
        className={`
        fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl
        flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-5 border-b border-[#f0e6d3]'>
          <div className='flex items-center gap-2'>
            <ShoppingBag className='h-5 w-5 text-[#3d2b1f]' />
            <h2 className='text-lg font-bold text-[#3d2b1f]'>
              {paso === 'carrito' && `Tu carrito (${cantidad})`}
              {paso === 'checkout' && 'Datos de entrega'}
              {paso === 'confirmado' && '¡Pedido confirmado!'}
            </h2>
          </div>
          <button onClick={cerrar} className='text-[#8a7060] hover:text-[#3d2b1f]'>
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* ── PASO: CARRITO ── */}
        {paso === 'carrito' && (
          <>
            <div className='flex-1 overflow-y-auto p-5 space-y-3'>
              {items.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-48 text-[#8a7060]'>
                  <ShoppingBag className='h-12 w-12 mb-3 opacity-30' />
                  <p className='text-sm'>Tu carrito está vacío</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.producto_id} className='flex items-center gap-3 bg-[#faf6ef] rounded-2xl p-3'>
                    <span className='text-3xl'>{item.emoji}</span>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-[#3d2b1f] truncate'>{item.nombre}</p>
                      <p className='text-xs text-[#c47c2b] font-semibold'>${item.precio} c/u</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                        className='w-7 h-7 rounded-full bg-white border border-[#f0e6d3] flex items-center justify-center hover:border-[#c47c2b] transition-colors'
                      >
                        <Minus className='h-3 w-3 text-[#3d2b1f]' />
                      </button>
                      <span className='w-6 text-center text-sm font-bold text-[#3d2b1f]'>{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                        className='w-7 h-7 rounded-full bg-white border border-[#f0e6d3] flex items-center justify-center hover:border-[#c47c2b] transition-colors'
                      >
                        <Plus className='h-3 w-3 text-[#3d2b1f]' />
                      </button>
                    </div>
                    <div className='text-right min-w-[50px]'>
                      <p className='text-sm font-bold text-[#3d2b1f]'>${item.precio * item.cantidad}</p>
                      <button
                        onClick={() => quitar(item.producto_id)}
                        className='text-xs text-[#8a7060] hover:text-red-500 transition-colors'
                      >
                        quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className='p-5 border-t border-[#f0e6d3] space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-[#8a7060] text-sm'>Total</span>
                  <span className='text-2xl font-bold text-[#3d2b1f]' style={{ fontFamily: 'Georgia, serif' }}>
                    ${total}
                  </span>
                </div>
                <button
                  onClick={() => setPaso('checkout')}
                  className='w-full bg-[#3d2b1f] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors'
                >
                  Continuar con el pedido →
                </button>
                <p className='text-xs text-[#8a7060] text-center'>Envío gratis a partir de $600</p>
              </div>
            )}
          </>
        )}

        {/* ── PASO: CHECKOUT ── */}
        {paso === 'checkout' && (
          <>
            <div className='flex-1 overflow-y-auto p-5 space-y-4'>
              {/* Resumen rápido */}
              <div className='bg-[#faf6ef] rounded-2xl p-4'>
                <p className='text-xs text-[#8a7060] mb-2 font-medium uppercase tracking-wider'>Tu pedido</p>
                {items.map((i) => (
                  <div key={i.producto_id} className='flex justify-between text-sm py-1'>
                    <span className='text-[#3d2b1f]'>
                      {i.emoji} {i.nombre} x{i.cantidad}
                    </span>
                    <span className='font-medium text-[#3d2b1f]'>${i.precio * i.cantidad}</span>
                  </div>
                ))}
                <div className='flex justify-between text-sm font-bold pt-2 border-t border-[#f0e6d3] mt-2'>
                  <span className='text-[#3d2b1f]'>Total</span>
                  <span className='text-[#c47c2b]'>${total}</span>
                </div>
              </div>

              {/* Formulario */}
              {[
                { key: 'nombre', label: 'Tu nombre *', placeholder: 'Ej: María García', type: 'text' },
                { key: 'telefono', label: 'Teléfono *', placeholder: 'Ej: 099 123 456', type: 'tel' },
                {
                  key: 'direccion',
                  label: 'Dirección de entrega *',
                  placeholder: 'Calle, número, ciudad',
                  type: 'text'
                }
              ].map((f) => (
                <div key={f.key}>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] ${
                      errores[f.key] ? 'border-red-300 bg-red-50' : 'border-[#f0e6d3]'
                    }`}
                  />
                  {errores[f.key] && <p className='text-xs text-red-500 mt-1'>{errores[f.key]}</p>}
                </div>
              ))}

              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Notas (opcional)</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
                  placeholder='Instrucciones especiales, referencias...'
                  rows={2}
                  className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] resize-none'
                />
              </div>
            </div>

            <div className='p-5 border-t border-[#f0e6d3] space-y-2'>
              <button
                onClick={confirmarPedido}
                disabled={guardando}
                className='w-full flex items-center justify-center gap-2 bg-[#3d2b1f] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60'
              >
                {guardando && <Loader2 className='h-4 w-4 animate-spin' />}
                {guardando ? 'Confirmando...' : 'Confirmar pedido'}
              </button>
              <button
                onClick={() => setPaso('carrito')}
                className='w-full py-2.5 text-sm text-[#8a7060] hover:text-[#3d2b1f] transition-colors'
              >
                ← Volver al carrito
              </button>
            </div>
          </>
        )}

        {/* ── PASO: CONFIRMADO ── */}
        {paso === 'confirmado' && (
          <div className='flex-1 flex flex-col items-center justify-center p-8 text-center'>
            <div className='w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4'>
              <CheckCircle className='h-8 w-8 text-green-500' />
            </div>
            <h3 className='text-xl font-bold text-[#3d2b1f] mb-2' style={{ fontFamily: 'Georgia, serif' }}>
              ¡Pedido recibido!
            </h3>
            <p className='text-[#8a7060] text-sm mb-2'>
              Tu pedido <span className='font-bold text-[#c47c2b]'>#{numeroPedido}</span> fue confirmado.
            </p>
            <p className='text-[#8a7060] text-sm mb-6'>
              Te contactaremos al teléfono que dejaste para coordinar la entrega.
            </p>

            <a
              href={`/pedido?q=${numeroPedido}`}
              target='_blank'
              className='w-full text-center bg-[#f0e6d3] text-[#3d2b1f] px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] hover:text-white transition-colors mb-2 block'
            >
              Ver estado de mi pedido →
            </a>
            <button
              onClick={cerrar}
              className='w-full bg-[#3d2b1f] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors'
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}
