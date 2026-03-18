// src/components/landing/Cart.tsx
'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { X, Plus, Minus, ShoppingBag, Loader2, CheckCircle } from 'lucide-react'
import { PAISES } from '@/lib/localidades'
import { type PagosConfig } from '@/lib/site-config'
import { type MetodoPago } from '@/lib/types'

type Paso = 'carrito' | 'checkout' | 'confirmado'

const FORM_INICIAL = {
  nombre: '',
  telefono: '',
  pais: PAISES[0].codigo,
  localidad: '',
  calle: '',
  notas: '',
  metodo_pago: '' as MetodoPago | ''
}

const ETIQUETAS: Record<MetodoPago, string> = {
  transferencia: 'Transferencia bancaria',
  deposito: 'Depósito bancario',
  mercadopago: 'Mercado Pago'
}

export function Cart({ telefono = '59893644132', pagos }: { telefono?: string; pagos?: PagosConfig }) {
  const { items, quitar, cambiarCantidad, vaciar, total, cantidad, isOpen, setIsOpen } = useCart()
  const [paso, setPaso] = useState<Paso>('carrito')
  const [guardando, setGuardando] = useState(false)
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Métodos de pago activos
  const metodosActivos = [
    pagos?.transferencia?.activo && {
      value: 'transferencia' as MetodoPago,
      label: '🏦 Transferencia',
      info: pagos.transferencia
    },
    pagos?.deposito?.activo && { value: 'deposito' as MetodoPago, label: '🏧 Depósito', info: pagos.deposito },
    pagos?.mercadopago?.activo && {
      value: 'mercadopago' as MetodoPago,
      label: '💳 Mercado Pago',
      info: pagos.mercadopago
    }
  ].filter(Boolean) as { value: MetodoPago; label: string; info: PagosConfig[keyof PagosConfig] }[]

  const hayMetodos = metodosActivos.length > 0

  const validar = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Tu nombre es obligatorio'
    if (!form.telefono.trim()) e.telefono = 'Tu teléfono es obligatorio'
    if (!form.localidad) e.localidad = 'Seleccioná tu localidad'
    if (!form.calle.trim()) e.calle = 'Tu calle y número son obligatorios'
    if (hayMetodos && !form.metodo_pago) e.metodo_pago = 'Seleccioná un método de pago'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const confirmarPedido = async () => {
    if (!validar()) return
    setGuardando(true)

    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre,
        telefono: form.telefono,
        localidad: form.localidad,
        calle: form.calle,
        notas: form.notas || undefined,
        metodo_pago: form.metodo_pago || undefined,
        total,
        items: items.map((i) => ({
          producto_id: i.producto_id,
          nombre: i.nombre,
          emoji: i.emoji,
          cantidad: i.cantidad,
          precio: i.precio
        }))
      })
    })

    if (!res.ok) {
      setGuardando(false)
      return
    }

    const pedido = await res.json()

    // ── Mercado Pago Checkout Pro ────────────────────────────────────────────
    if (form.metodo_pago === 'mercadopago') {
      const mpRes = await fetch('/api/mp/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedido.id,
          pedido_numero: pedido.numero,
          nombre: form.nombre,
          telefono: form.telefono,
          items: items.map((i) => ({
            nombre: i.nombre,
            emoji: i.emoji,
            cantidad: i.cantidad,
            precio: i.precio
          })),
          total
        })
      })

      if (mpRes.ok) {
        const { init_point } = await mpRes.json()
        vaciar()
        window.location.href = init_point
        return
      }
      // Si falla MP, continúa con el flujo normal de WhatsApp
    }

    // ── Flujo WhatsApp (transferencia / depósito / sin método) ───────────────
    const resumenItems = items
      .map((i) => `• ${i.emoji} ${i.nombre} x${i.cantidad} — $${i.precio * i.cantidad}`)
      .join('\n')

    const labelPago = form.metodo_pago ? ETIQUETAS[form.metodo_pago] : ''

    const mensaje =
      `🛍️ *Nuevo pedido #${pedido.numero}*\n\n` +
      `👤 *Cliente:* ${form.nombre}\n` +
      `📞 *Teléfono:* ${form.telefono}\n` +
      `📍 *Dirección:* ${form.calle}, ${form.localidad}` +
      `${form.notas ? `\n📝 *Notas:* ${form.notas}` : ''}` +
      `${labelPago ? `\n💳 *Pago:* ${labelPago}` : ''}\n\n` +
      `*Productos:*\n${resumenItems}\n\n` +
      `💰 *Total: $${total}*`

    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank')

    setNumeroPedido(pedido.numero)
    vaciar()
    setPaso('confirmado')
    setGuardando(false)
  }

  const cerrar = () => {
    setIsOpen(false)
    setTimeout(() => {
      setPaso('carrito')
      setForm(FORM_INICIAL)
      setErrores({})
    }, 300)
  }

  // Info del método seleccionado
  const metodoSeleccionado = metodosActivos.find((m) => m.value === form.metodo_pago)

  return (
    <>
      {isOpen && <div className='fixed inset-0 bg-black/40 z-50' onClick={cerrar} />}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
          <button onClick={cerrar} aria-label='Cerrar carrito' className='text-[#8a7060] hover:text-[#3d2b1f]'>
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* ── CARRITO ── */}
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
                      <p className='text-xs text-[#8a5a1a] font-semibold'>${item.precio} c/u</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                        aria-label={`Quitar una unidad de ${item.nombre}`}
                        className='w-7 h-7 rounded-full bg-white border border-[#f0e6d3] flex items-center justify-center hover:border-[#c47c2b] transition-colors'
                      >
                        <Minus className='h-3 w-3 text-[#3d2b1f]' />
                      </button>
                      <span className='w-6 text-center text-sm font-bold text-[#3d2b1f]'>{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                        aria-label={`Agregar una unidad de ${item.nombre}`}
                        className='w-7 h-7 rounded-full bg-white border border-[#f0e6d3] flex items-center justify-center hover:border-[#c47c2b] transition-colors'
                      >
                        <Plus className='h-3 w-3 text-[#3d2b1f]' />
                      </button>
                    </div>
                    <div className='text-right min-w-[50px]'>
                      <p className='text-sm font-bold text-[#3d2b1f]'>${item.precio * item.cantidad}</p>
                      <button
                        onClick={() => quitar(item.producto_id)}
                        aria-label={`Quitar ${item.nombre} del carrito`}
                        className='text-xs text-[#5c4033] hover:text-red-500 transition-colors'
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

        {/* ── CHECKOUT ── */}
        {paso === 'checkout' && (
          <>
            <div className='flex-1 overflow-y-auto p-5 space-y-4'>
              {/* Resumen */}
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

              {/* Nombre */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Tu nombre *</label>
                <input
                  type='text'
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder='Ej: María García'
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] ${errores.nombre ? 'border-red-300 bg-red-50' : 'border-[#f0e6d3]'}`}
                />
                {errores.nombre && <p className='text-xs text-red-500 mt-1'>{errores.nombre}</p>}
              </div>

              {/* Teléfono */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Teléfono *</label>
                <input
                  type='tel'
                  value={form.telefono}
                  onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                  placeholder='Ej: 099 123 456'
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] ${errores.telefono ? 'border-red-300 bg-red-50' : 'border-[#f0e6d3]'}`}
                />
                {errores.telefono && <p className='text-xs text-red-500 mt-1'>{errores.telefono}</p>}
              </div>

              {/* País */}
              {PAISES.length > 1 && (
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>País *</label>
                  <select
                    value={form.pais}
                    onChange={(e) => setForm((p) => ({ ...p, pais: e.target.value, localidad: '' }))}
                    className='w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] bg-white'
                  >
                    {PAISES.map((p) => (
                      <option key={p.codigo} value={p.codigo}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Localidad */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Localidad *</label>
                <select
                  value={form.localidad}
                  onChange={(e) => setForm((p) => ({ ...p, localidad: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] bg-white ${errores.localidad ? 'border-red-300 bg-red-50' : 'border-[#f0e6d3]'}`}
                >
                  <option value=''>Seleccioná tu localidad</option>
                  {(PAISES.find((p) => p.codigo === form.pais) ?? PAISES[0]).localidades.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                {errores.localidad && <p className='text-xs text-red-500 mt-1'>{errores.localidad}</p>}
              </div>

              {/* Calle */}
              <div>
                <label className='block text-xs font-medium text-[#3d2b1f] mb-1.5'>Calle y número *</label>
                <input
                  type='text'
                  value={form.calle}
                  onChange={(e) => setForm((p) => ({ ...p, calle: e.target.value }))}
                  placeholder='Ej: Av. 18 de Julio 1234'
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c47c2b] ${errores.calle ? 'border-red-300 bg-red-50' : 'border-[#f0e6d3]'}`}
                />
                {errores.calle && <p className='text-xs text-red-500 mt-1'>{errores.calle}</p>}
              </div>

              {/* Notas */}
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

              {/* Método de pago */}
              {hayMetodos && (
                <div>
                  <label className='block text-xs font-medium text-[#3d2b1f] mb-2'>Método de pago *</label>
                  <div className='grid grid-cols-3 gap-2'>
                    {metodosActivos.map((m) => (
                      <button
                        key={m.value}
                        type='button'
                        onClick={() => setForm((p) => ({ ...p, metodo_pago: m.value }))}
                        className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                          form.metodo_pago === m.value
                            ? 'border-[#c47c2b] bg-[#fef3d0] text-[#c47c2b]'
                            : 'border-[#f0e6d3] text-[#8a7060] hover:border-[#c47c2b]/50'
                        }`}
                      >
                        <span className='text-xl'>{m.label.split(' ')[0]}</span>
                        <span className='text-center leading-tight'>{m.label.split(' ').slice(1).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                  {errores.metodo_pago && <p className='text-xs text-red-500 mt-1'>{errores.metodo_pago}</p>}

                  {/* Info del método seleccionado */}
                  {metodoSeleccionado && (
                    <div className='mt-3 p-3 bg-[#faf6ef] rounded-xl border border-[#f0e6d3] text-xs text-[#3d2b1f] space-y-1'>
                      {form.metodo_pago === 'mercadopago' ? (
                        <p className='text-[#8a7060]'>
                          Al confirmar serás redirigido a Mercado Pago para completar el pago de forma segura.
                        </p>
                      ) : (
                        <>
                          {(metodoSeleccionado.info as { banco?: string }).banco && (
                            <p>
                              <span className='text-[#8a7060]'>Banco:</span>{' '}
                              {(metodoSeleccionado.info as { banco?: string }).banco}
                            </p>
                          )}
                          {(metodoSeleccionado.info as { titular?: string }).titular && (
                            <p>
                              <span className='text-[#8a7060]'>Titular:</span>{' '}
                              {(metodoSeleccionado.info as { titular?: string }).titular}
                            </p>
                          )}
                          {(metodoSeleccionado.info as { cbu?: string }).cbu && (
                            <p>
                              <span className='text-[#8a7060]'>CBU:</span>{' '}
                              <span className='font-mono'>{(metodoSeleccionado.info as { cbu?: string }).cbu}</span>
                            </p>
                          )}
                          {(metodoSeleccionado.info as { alias?: string }).alias && (
                            <p>
                              <span className='text-[#8a7060]'>Alias:</span>{' '}
                              <span className='font-mono'>{(metodoSeleccionado.info as { alias?: string }).alias}</span>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='p-5 border-t border-[#f0e6d3] space-y-2'>
              <button
                onClick={confirmarPedido}
                disabled={guardando}
                className='w-full flex items-center justify-center gap-2 bg-[#3d2b1f] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60'
              >
                {guardando && <Loader2 className='h-4 w-4 animate-spin' />}
                {guardando
                  ? form.metodo_pago === 'mercadopago'
                    ? 'Redirigiendo...'
                    : 'Confirmando...'
                  : form.metodo_pago === 'mercadopago'
                    ? '💳 Ir a pagar con Mercado Pago →'
                    : 'Confirmar pedido'}
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

        {/* ── CONFIRMADO ── */}
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
