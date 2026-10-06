import { describe, expect, it } from 'vitest'
import { cotizarPedido, type ProductoDB } from './cotizar'

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
      total: 2000,
      items: [
        { producto_id: 'a', producto_nombre: 'Barra A', producto_emoji: '🌾', cantidad: 2, precio_unitario: 1000, subtotal: 2000 }
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
