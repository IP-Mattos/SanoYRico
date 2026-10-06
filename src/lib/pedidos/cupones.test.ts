import { describe, expect, it } from 'vitest'
import { leerPromoMonto, normalizarCodigoCupon, usosTrasConsumir, usosTrasLiberar } from './cupones'

describe('normalizarCodigoCupon', () => {
  it('pasa a mayúsculas y recorta', () => {
    expect(normalizarCodigoCupon('  hola-10 ')).toBe('HOLA-10')
  })
  it.each([undefined, null, 5, '', '   ', 'con espacio', 'ñandú', 'x'.repeat(41), "a'b"])('rechaza %s', (v) => {
    expect(normalizarCodigoCupon(v)).toBeNull()
  })
})

describe('usos del cupón', () => {
  it('consume mientras queden usos', () => {
    expect(usosTrasConsumir(0, 1)).toBe(1)
    expect(usosTrasConsumir(2, 3)).toBe(3)
    expect(usosTrasConsumir(7, null)).toBe(8)
  })
  it('no consume si se alcanzó usos_max', () => {
    expect(usosTrasConsumir(1, 1)).toBeNull()
    expect(usosTrasConsumir(5, 3)).toBeNull()
  })
  it('liberar nunca baja de 0', () => {
    expect(usosTrasLiberar(2)).toBe(1)
    expect(usosTrasLiberar(0)).toBe(0)
  })
})

describe('leerPromoMonto', () => {
  it('devuelve la promo inactiva por defecto', () => {
    expect(leerPromoMonto(null).activo).toBe(false)
    expect(leerPromoMonto('x').activo).toBe(false)
  })
  it('lee los campos y completa los faltantes', () => {
    expect(leerPromoMonto({ activo: true, minimo: '4000', pct: 12 })).toMatchObject({
      activo: true,
      minimo: 4000,
      pct: 12,
      desde: '',
      hasta: ''
    })
  })
})
