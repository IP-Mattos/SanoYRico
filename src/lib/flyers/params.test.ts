import { describe, expect, it } from 'vitest'
import { ordenarPorIds, parsearParamsFlyer } from './params'
import { calcularGeometria, filasDeGrilla, formatearPrecio, hostnameDe } from './layout'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const sp = (q: string) => new URLSearchParams(q)

describe('parsearParamsFlyer', () => {
  it('acepta un caso mínimo y aplica defaults', () => {
    const r = parsearParamsFlyer(sp(`ids=${A}`))
    expect(r).toEqual({ ok: true, params: { ids: [A], formato: 'cuadrado', titulo: 'Nuestros favoritos', cupon: null } })
  })
  it('rechaza sin ids, con más de 6 o con uuid inválido', () => {
    expect(parsearParamsFlyer(sp('')).ok).toBe(false)
    const siete = Array.from({ length: 7 }, (_, i) => `00000000-0000-4000-8000-00000000000${i}`).join(',')
    expect(parsearParamsFlyer(sp(`ids=${siete}`)).ok).toBe(false)
    expect(parsearParamsFlyer(sp(`ids=${A},nope`)).ok).toBe(false)
  })
  it('deduplica ids conservando el orden', () => {
    const r = parsearParamsFlyer(sp(`ids=${B},${A},${B}`))
    expect(r.ok && r.params.ids).toEqual([B, A])
  })
  it('valida formato, título y cupón', () => {
    expect(parsearParamsFlyer(sp(`ids=${A}&formato=historia`)).ok).toBe(true)
    expect(parsearParamsFlyer(sp(`ids=${A}&formato=banner`)).ok).toBe(false)
    expect(parsearParamsFlyer(sp(`ids=${A}&titulo=${'x'.repeat(61)}`)).ok).toBe(false)
    expect(parsearParamsFlyer(sp(`ids=${A}&titulo=${'x'.repeat(60)}`)).ok).toBe(true)
    const c = parsearParamsFlyer(sp(`ids=${A}&cupon=hola-10`))
    expect(c.ok && c.params.cupon).toBe('HOLA-10')
    expect(parsearParamsFlyer(sp(`ids=${A}&cupon=a_b`)).ok).toBe(false)
    expect(parsearParamsFlyer(sp(`ids=${A}&cupon=${'A'.repeat(21)}`)).ok).toBe(false)
  })
})

describe('ordenarPorIds', () => {
  it('respeta el orden pedido y omite faltantes', () => {
    expect(ordenarPorIds([B, A, 'x'], [{ id: A }, { id: B }])).toEqual([{ id: B }, { id: A }])
  })
})

describe('layout', () => {
  it('las filas suman la cantidad de productos', () => {
    for (const f of ['cuadrado', 'historia'] as const) {
      for (let n = 1; n <= 6; n++) expect(filasDeGrilla(f, n).reduce((a, b) => a + b, 0)).toBe(n)
    }
  })
  it('los tiles caben en la grilla', () => {
    for (const f of ['cuadrado', 'historia'] as const) {
      for (let n = 1; n <= 6; n++) {
        const g = calcularGeometria(f, n, true)
        expect(g.tileH).toBeGreaterThan(150)
        expect(g.tileH * g.filas.length + 24 * (g.filas.length - 1)).toBeLessThanOrEqual(g.gridH)
      }
    }
  })
  it('formatea precios y hostname', () => {
    expect(formatearPrecio(45)).toBe('$45')
    expect(formatearPrecio(1080)).toBe('$1.080')
    expect(formatearPrecio(12.5)).toBe('$12,50')
    expect(hostnameDe('https://www.sano-y-rico.vercel.app/x')).toBe('sano-y-rico.vercel.app')
  })
})
