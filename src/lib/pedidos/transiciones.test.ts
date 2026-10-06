import { describe, expect, it } from 'vitest'
import { decidirCambioEstado, esEstadoPedido } from './transiciones'

describe('decidirCambioEstado', () => {
  it.each([
    ['pendiente', 'confirmado', 'descontar'],
    ['pendiente', 'cancelado', 'ninguno'],
    ['confirmado', 'entregado', 'ninguno'],
    ['confirmado', 'cancelado', 'reponer'],
    ['entregado', 'cancelado', 'reponer']
  ])('%s -> %s permitido con efecto %s', (a, b, efecto) => {
    expect(decidirCambioEstado(a, b)).toEqual({ ok: true, efectoStock: efecto })
  })

  it.each([
    ['pendiente', 'entregado'],
    ['confirmado', 'pendiente'],
    ['entregado', 'confirmado'],
    ['entregado', 'pendiente'],
    ['cancelado', 'pendiente'],
    ['cancelado', 'confirmado'],
    ['cancelado', 'cancelado'],
    ['pendiente', 'pendiente'],
    ['pendiente', 'inventado']
  ])('%s -> %s rechazado', (a, b) => {
    expect(decidirCambioEstado(a, b)).toMatchObject({ ok: false })
  })
})

describe('esEstadoPedido', () => {
  it('acepta solo estados conocidos', () => {
    expect(esEstadoPedido('confirmado')).toBe(true)
    expect(esEstadoPedido('x')).toBe(false)
    expect(esEstadoPedido(undefined)).toBe(false)
  })
})
