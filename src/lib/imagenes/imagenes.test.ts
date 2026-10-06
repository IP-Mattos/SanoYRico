import { describe, expect, it } from 'vitest'
import { formatearMonto, fechaCompleta, fechaCorta } from './formato'
import { condicionesCupon, descuentoCupon, lineaFechasPromo, subtituloPromo, titularCupon } from './condiciones'
import { parsearParamsCupon, parsearParamsPromo } from './params'

const sp = (o: Record<string, string>) => new URLSearchParams(o)
const ID = '123e4567-e89b-12d3-a456-426614174000'

describe('formato', () => {
  it('monto es-UY', () => {
    expect(formatearMonto(5000)).toBe('$5.000')
    expect(formatearMonto(200)).toBe('$200')
    expect(formatearMonto(1250.5)).toBe('$1.250,50')
  })
  it('fechas en hora de Montevideo', () => {
    expect(fechaCompleta('2026-12-31T12:00:00Z')).toBe('31/12/2026')
    expect(fechaCorta('2026-12-31T12:00:00Z')).toBe('31/12')
    // 01:00 UTC del 1/1 sigue siendo 31/12 en Montevideo (UTC-3)
    expect(fechaCorta('2027-01-01T01:00:00Z')).toBe('31/12')
    expect(fechaCorta('basura')).toBeNull()
  })
})

describe('condiciones', () => {
  it('descuento', () => {
    expect(descuentoCupon('porcentaje', 10)).toBe('10% OFF')
    expect(descuentoCupon('monto', 200)).toBe('$200 OFF')
  })
  it('titular con y sin saludo', () => {
    expect(titularCupon('María')).toBe('Un regalo para vos, María')
    expect(titularCupon('  ')).toBe('Un regalo para vos')
  })
  it('cupón ilimitado, sin teléfono ni vencimiento: solo la nota de promo', () => {
    const l = condicionesCupon({ tipo: 'monto', valor: 1, vence_at: null, usos_max: null, telefono: null })
    expect(l).toEqual(['No aplica a productos en promo'])
  })
  it('cupón personal: 1 uso, teléfono (sin número) y vencimiento', () => {
    const l = condicionesCupon({ tipo: 'porcentaje', valor: 10, vence_at: '2026-12-31T12:00:00Z', usos_max: 1, telefono: '099123456' })
    expect(l).toEqual(['Válido por 1 uso', 'Válido solo con tu teléfono', 'Vence el 31/12/2026', 'No aplica a productos en promo'])
    expect(l.join(' ')).not.toContain('099')
  })
  it('hasta N usos', () => {
    expect(condicionesCupon({ tipo: 'monto', valor: 1, vence_at: null, usos_max: 5, telefono: null })[0]).toBe('Hasta 5 usos')
  })
  it('líneas de fechas de la promo', () => {
    expect(lineaFechasPromo('2026-10-01T12:00:00Z', '2026-10-31T12:00:00Z')).toBe('Del 01/10 al 31/10')
    expect(lineaFechasPromo(null, '2026-10-31T12:00:00Z')).toBe('Hasta el 31/10')
    expect(lineaFechasPromo('2026-10-01T12:00:00Z', null)).toBe('Desde el 01/10')
    expect(lineaFechasPromo(null, null)).toBeNull()
  })
  it('subtítulo de promo', () => {
    expect(subtituloPromo(5000)).toBe('en compras desde $5.000')
    expect(subtituloPromo(0)).toBe('en toda tu compra')
  })
})

describe('params', () => {
  it('cupón válido y defaults', () => {
    expect(parsearParamsCupon(sp({ id: ID }))).toEqual({ ok: true, params: { id: ID, formato: 'cuadrado', saludo: '' } })
  })
  it('cupón rechaza id, formato y saludo largo', () => {
    expect(parsearParamsCupon(sp({ id: 'x' })).ok).toBe(false)
    expect(parsearParamsCupon(sp({ id: ID, formato: 'raro' })).ok).toBe(false)
    expect(parsearParamsCupon(sp({ id: ID, saludo: 'a'.repeat(31) })).ok).toBe(false)
  })
  it('promo válida', () => {
    const r = parsearParamsPromo(sp({ pct: '10', minimo: '5000', formato: 'historia', hasta: '2026-10-31T12:00:00Z' }))
    expect(r).toEqual({ ok: true, params: { pct: 10, minimo: 5000, desde: null, hasta: '2026-10-31T12:00:00Z', formato: 'historia' } })
  })
  it('promo valida rangos', () => {
    expect(parsearParamsPromo(sp({ pct: '0' })).ok).toBe(false)
    expect(parsearParamsPromo(sp({ pct: '101' })).ok).toBe(false)
    expect(parsearParamsPromo(sp({})).ok).toBe(false)
    expect(parsearParamsPromo(sp({ pct: '10', minimo: '-1' })).ok).toBe(false)
    expect(parsearParamsPromo(sp({ pct: '10', desde: 'nope' })).ok).toBe(false)
    expect(parsearParamsPromo(sp({ pct: '10', desde: '2026-10-31T12:00:00Z', hasta: '2026-10-01T12:00:00Z' })).ok).toBe(false)
  })
})
