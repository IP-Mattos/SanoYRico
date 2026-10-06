import { describe, expect, it } from 'vitest'
import { cotizarPedido, type ProductoDB } from './cotizar'
import type { Cupon } from '@/lib/types'
import type { PromoMontoConfig } from '@/lib/site-config'

const A: ProductoDB = { id: 'a', nombre: 'Barra A', emoji: '🌾', precio: 1000, stock: 10, activo: true }
const B: ProductoDB = { id: 'b', nombre: 'Barra B', emoji: null, precio: 500, stock: 5, activo: true }
const INACTIVO: ProductoDB = { id: 'c', nombre: 'Vieja', emoji: '🍯', precio: 100, stock: 9, activo: false }
const productos = [A, B, INACTIVO]
const opts = { minimoPedido: 1000 }

describe('cotizarPedido', () => {
  it('calcula el total con precios de la DB e ignora precio/nombre del cliente', () => {
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 2, precio: 0.01, nombre: 'hack', emoji: 'x' }], productos, opts)
    expect(r).toEqual({
      ok: true,
      subtotal: 2000,
      descuento: 0,
      descuento_tipo: null,
      cupon_codigo: null,
      total: 2000,
      items: [
        {
          producto_id: 'a',
          producto_nombre: 'Barra A',
          producto_emoji: '🌾',
          cantidad: 2,
          precio_lista: 1000,
          precio_unitario: 1000,
          subtotal: 2000
        }
      ]
    })
  })

  it('rechaza producto desconocido', () => {
    const r = cotizarPedido([{ producto_id: 'zzz', cantidad: 1 }], productos, opts)
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('rechaza producto inactivo', () => {
    const r = cotizarPedido([{ producto_id: 'c', cantidad: 1 }], productos, opts)
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it.each([0, -1, 1.5, '2', NaN, null, 1000])('rechaza cantidad inválida %s', (cantidad) => {
    const r = cotizarPedido([{ producto_id: 'a', cantidad }], productos, { minimoPedido: 0 })
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('rechaza stock insuficiente', () => {
    const r = cotizarPedido([{ producto_id: 'b', cantidad: 6 }], productos, opts)
    expect(r).toMatchObject({ ok: false, status: 409 })
  })

  it('suma líneas duplicadas antes de validar stock', () => {
    const ok = cotizarPedido(
      [{ producto_id: 'b', cantidad: 2 }, { producto_id: 'b', cantidad: 3 }],
      productos,
      opts
    )
    expect(ok).toMatchObject({ ok: true, total: 2500 })
    if (ok.ok) expect(ok.items).toHaveLength(1)
    const mal = cotizarPedido([{ producto_id: 'b', cantidad: 3 }, { producto_id: 'b', cantidad: 3 }], productos, opts)
    expect(mal).toMatchObject({ ok: false, status: 409 })
  })

  it('exige el mínimo de pedido', () => {
    const r = cotizarPedido([{ producto_id: 'b', cantidad: 1 }], productos, opts)
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('rechaza ítems vacíos o con forma inválida', () => {
    expect(cotizarPedido([], productos, opts)).toMatchObject({ ok: false })
    expect(cotizarPedido([null, 5], productos, opts)).toMatchObject({ ok: false })
    expect(cotizarPedido('x', productos, opts)).toMatchObject({ ok: false })
  })
})

// ── Descuentos ───────────────────────────────────────────────────────────────
const AHORA = new Date('2026-10-10T12:00:00Z')
const AYER = '2026-10-09T12:00:00Z'
const MANANA = '2026-10-11T12:00:00Z'
const conPromo = (p: ProductoDB, pct: number, desde: string | null = null, hasta: string | null = null): ProductoDB => ({
  ...p,
  descuento_pct: pct,
  descuento_desde: desde,
  descuento_hasta: hasta
})
const cupon = (o: Partial<Cupon> = {}): Cupon => ({
  codigo: 'HOLA10',
  tipo: 'porcentaje',
  valor: 10,
  vence_at: null,
  usos_max: null,
  usos: 0,
  telefono: null,
  activo: true,
  ...o
})
const promoMonto = (o: Partial<PromoMontoConfig> = {}): PromoMontoConfig => ({
  activo: true,
  minimo: 2500,
  pct: 10,
  desde: '',
  hasta: '',
  ...o
})
const base = { minimoPedido: 0, ahora: AHORA }

describe('promo de producto', () => {
  it('aplica el precio promocional cuando está activa', () => {
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 2 }], [conPromo(A, 20, AYER, MANANA)], base)
    expect(r).toMatchObject({ ok: true, subtotal: 1600, descuento: 0, total: 1600, descuento_tipo: null })
    if (r.ok) expect(r.items[0]).toMatchObject({ precio_lista: 1000, precio_unitario: 800, subtotal: 1600 })
  })

  it('aplica sin fechas (siempre activa)', () => {
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 1 }], [conPromo(A, 50)], base)
    expect(r).toMatchObject({ ok: true, total: 500 })
  })

  it('no aplica si venció', () => {
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 1 }], [conPromo(A, 20, null, AYER)], base)
    expect(r).toMatchObject({ ok: true, total: 1000 })
  })

  it('no aplica si todavía no empezó', () => {
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 1 }], [conPromo(A, 20, MANANA, null)], base)
    expect(r).toMatchObject({ ok: true, total: 1000 })
  })

  it('ignora porcentajes inválidos', () => {
    for (const pct of [0, -5, 101, NaN]) {
      const r = cotizarPedido([{ producto_id: 'a', cantidad: 1 }], [conPromo(A, pct)], base)
      expect(r).toMatchObject({ ok: true, total: 1000 })
    }
  })

  it('redondea a 2 decimales el precio y el subtotal', () => {
    const P: ProductoDB = { ...A, precio: 33.33, descuento_pct: 15 }
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 3 }], [P], base)
    if (!r.ok) throw new Error('debería cotizar')
    expect(r.items[0].precio_unitario).toBe(28.33)
    expect(r.items[0].subtotal).toBe(84.99)
    expect(r.total).toBe(84.99)
  })
})

describe('cupón', () => {
  const items = [{ producto_id: 'a', cantidad: 1 }, { producto_id: 'b', cantidad: 4 }] // 1000 + 2000

  it('aplica porcentaje sobre ítems sin promo', () => {
    const r = cotizarPedido(items, productos, { ...base, cupon: cupon() })
    expect(r).toMatchObject({ ok: true, subtotal: 3000, descuento: 300, descuento_tipo: 'cupon', cupon_codigo: 'HOLA10', total: 2700 })
  })

  it('excluye ítems con promo activa', () => {
    const r = cotizarPedido(items, [conPromo(A, 20), B], { ...base, cupon: cupon() })
    // A: 800 (promo, excluido) + B: 2000 → 10% de 2000
    expect(r).toMatchObject({ ok: true, subtotal: 2800, descuento: 200, total: 2600, descuento_tipo: 'cupon' })
  })

  it('rechaza el cupón si todo el carrito tiene promo', () => {
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 1 }], [conPromo(A, 20)], { ...base, cupon: cupon() })
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('monto fijo nunca supera el subtotal elegible', () => {
    const r = cotizarPedido(items, [conPromo(A, 20), B], { ...base, cupon: cupon({ tipo: 'monto', valor: 5000 }) })
    expect(r).toMatchObject({ ok: true, subtotal: 2800, descuento: 2000, total: 800 })
  })

  it('el total nunca es negativo', () => {
    const r = cotizarPedido(items, productos, { ...base, cupon: cupon({ tipo: 'monto', valor: 999999 }) })
    expect(r).toMatchObject({ ok: true, descuento: 3000, total: 0 })
  })

  it('porcentaje redondea a 2 decimales', () => {
    const P: ProductoDB = { ...A, precio: 33.33 }
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 1 }], [P], { ...base, cupon: cupon({ valor: 15 }) })
    expect(r).toMatchObject({ ok: true, descuento: 5, total: 28.33 })
  })

  it.each([
    ['inactivo', { activo: false }],
    ['vencido', { vence_at: AYER }],
    ['agotado', { usos_max: 3, usos: 3 }],
    ['de otro teléfono', { telefono: '099111222' }]
  ])('rechaza cupón %s con 422', (_n, o) => {
    const r = cotizarPedido(items, productos, { ...base, cupon: cupon(o as Partial<Cupon>), telefono: '099333444' })
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('un cupón inexistente (null con código) se rechaza', () => {
    const r = cotizarPedido(items, productos, { ...base, cupon: null, codigoCupon: 'NOEXISTE' })
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('el mensaje por teléfono ajeno no distingue de un cupón inexistente', () => {
    const ajeno = cotizarPedido(items, productos, { ...base, cupon: cupon({ telefono: '099111222' }), telefono: '099333444' })
    const noExiste = cotizarPedido(items, productos, { ...base, cupon: null, codigoCupon: 'X' })
    if (ajeno.ok || noExiste.ok) throw new Error('deberían fallar')
    expect(ajeno.error).toBe(noExiste.error)
  })

  it('cupón con teléfono: coincide aunque cambie el formato', () => {
    const c = cupon({ telefono: '099 123 456' })
    for (const tel of ['+598 99 123 456', '099123456', '598-99-123-456']) {
      const r = cotizarPedido(items, productos, { ...base, cupon: c, telefono: tel })
      expect(r).toMatchObject({ ok: true, descuento_tipo: 'cupon' })
    }
  })

  it('cupón con teléfono exige teléfono en el pedido', () => {
    const r = cotizarPedido(items, productos, { ...base, cupon: cupon({ telefono: '099123456' }) })
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('respeta usos_max mientras queden usos', () => {
    const r = cotizarPedido(items, productos, { ...base, cupon: cupon({ usos_max: 3, usos: 2 }) })
    expect(r).toMatchObject({ ok: true, descuento_tipo: 'cupon' })
  })
})

describe('promo por monto total', () => {
  const items = [{ producto_id: 'a', cantidad: 1 }, { producto_id: 'b', cantidad: 4 }] // 1000 + 2000 = 3000

  it('aplica el porcentaje cuando se alcanza el mínimo', () => {
    const r = cotizarPedido(items, productos, { ...base, promoMonto: promoMonto({ minimo: 3000 }) })
    expect(r).toMatchObject({ ok: true, descuento: 300, descuento_tipo: 'monto', cupon_codigo: null, total: 2700 })
  })

  it('no aplica por debajo del mínimo', () => {
    const r = cotizarPedido(items, productos, { ...base, promoMonto: promoMonto({ minimo: 3001 }) })
    expect(r).toMatchObject({ ok: true, descuento: 0, descuento_tipo: null, total: 3000 })
  })

  it('no aplica si está inactiva o fuera de fecha', () => {
    for (const p of [promoMonto({ activo: false }), promoMonto({ hasta: AYER }), promoMonto({ desde: MANANA })]) {
      const r = cotizarPedido(items, productos, { ...base, promoMonto: p })
      expect(r).toMatchObject({ ok: true, descuento: 0, total: 3000 })
    }
  })

  it('el umbral cuenta todo el carrito pero el % solo los ítems sin promo', () => {
    // A con promo: 800; B: 2000 → carrito 2800
    const prods = [conPromo(A, 20), B]
    const aplica = cotizarPedido(items, prods, { ...base, promoMonto: promoMonto({ minimo: 2800 }) })
    expect(aplica).toMatchObject({ ok: true, subtotal: 2800, descuento: 200, total: 2600, descuento_tipo: 'monto' })
    const noAplica = cotizarPedido(items, prods, { ...base, promoMonto: promoMonto({ minimo: 2801 }) })
    expect(noAplica).toMatchObject({ ok: true, descuento: 0, total: 2800 })
  })

  it('no suma descuento sobre ítems que ya tienen promo', () => {
    const r = cotizarPedido([{ producto_id: 'a', cantidad: 4 }], [conPromo(A, 20)], {
      ...base,
      promoMonto: promoMonto({ minimo: 100 })
    })
    expect(r).toMatchObject({ ok: true, descuento: 0, total: 3200, descuento_tipo: null })
  })
})

describe('cupón vs promo por monto', () => {
  const items = [{ producto_id: 'a', cantidad: 1 }, { producto_id: 'b', cantidad: 4 }] // 3000

  it('gana la promo por monto si es mayor y el cupón no se consume', () => {
    const r = cotizarPedido(items, productos, {
      ...base,
      cupon: cupon({ valor: 10 }),
      promoMonto: promoMonto({ minimo: 1000, pct: 15 })
    })
    expect(r).toMatchObject({ ok: true, descuento: 450, descuento_tipo: 'monto', cupon_codigo: null, total: 2550 })
    if (r.ok) expect(r.aviso).toBeTruthy()
  })

  it('gana el cupón si es mayor', () => {
    const r = cotizarPedido(items, productos, {
      ...base,
      cupon: cupon({ valor: 20 }),
      promoMonto: promoMonto({ minimo: 1000, pct: 15 })
    })
    expect(r).toMatchObject({ ok: true, descuento: 600, descuento_tipo: 'cupon', cupon_codigo: 'HOLA10', total: 2400 })
  })

  it('en empate gana la promo por monto (no gasta el cupón)', () => {
    const r = cotizarPedido(items, productos, {
      ...base,
      cupon: cupon({ valor: 10 }),
      promoMonto: promoMonto({ minimo: 1000, pct: 10 })
    })
    expect(r).toMatchObject({ ok: true, descuento_tipo: 'monto', cupon_codigo: null })
  })
})

describe('pedido mínimo con descuentos', () => {
  const items = [{ producto_id: 'a', cantidad: 2 }] // 2000

  it('se evalúa contra el total final (ya descontado)', () => {
    const r = cotizarPedido(items, productos, { minimoPedido: 2000, ahora: AHORA, cupon: cupon() })
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('pasa si el total final alcanza el mínimo', () => {
    const r = cotizarPedido(items, productos, { minimoPedido: 1800, ahora: AHORA, cupon: cupon() })
    expect(r).toMatchObject({ ok: true, total: 1800 })
  })
})
