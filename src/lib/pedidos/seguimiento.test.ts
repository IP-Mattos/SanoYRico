import { describe, expect, it } from 'vitest'
import {
  enmascararTelefono,
  interpretarBusqueda,
  normalizarTelefono,
  primerNombre,
  telefonoCoincide
} from './seguimiento'

describe('interpretarBusqueda', () => {
  it('hasta 6 dígitos es número de pedido', () => {
    expect(interpretarBusqueda('42')).toEqual({ tipo: 'numero', numero: 42 })
    expect(interpretarBusqueda('123456')).toEqual({ tipo: 'numero', numero: 123456 })
  })
  it('teléfono: normaliza y exige al menos 8 dígitos', () => {
    expect(interpretarBusqueda('091 199 299')).toEqual({ tipo: 'telefono', digitos: '91199299' })
    expect(interpretarBusqueda('+598 91 199 299')).toEqual({ tipo: 'telefono', digitos: '91199299' })
    expect(interpretarBusqueda('1234567')).toEqual({ tipo: 'invalida' })
    expect(interpretarBusqueda('12-345')).toMatchObject({ tipo: 'invalida' })
  })
  it('rechaza vacío, texto o demasiado largo', () => {
    expect(interpretarBusqueda('')).toEqual({ tipo: 'invalida' })
    expect(interpretarBusqueda('hola')).toEqual({ tipo: 'invalida' })
    expect(interpretarBusqueda('9'.repeat(41))).toEqual({ tipo: 'invalida' })
  })
})

describe('telefonoCoincide', () => {
  it('coincidencia exacta de dígitos, nunca por subcadena', () => {
    expect(telefonoCoincide('091 199 299', '91199299')).toBe(true)
    expect(telefonoCoincide('+598 91199299', '91199299')).toBe(true)
    expect(telefonoCoincide('091 199 2999', '91199299')).toBe(false)
    expect(telefonoCoincide('1199299', '91199299')).toBe(false)
    expect(telefonoCoincide(null, '91199299')).toBe(false)
  })
  it('normalizarTelefono quita 598 y ceros iniciales', () => {
    expect(normalizarTelefono('0 91 199 299')).toBe('91199299')
  })
})

describe('enmascarado', () => {
  it('muestra solo los últimos 3 dígitos', () => {
    expect(enmascararTelefono('091 199 299')).toBe('••••••299')
    expect(enmascararTelefono('12')).toBe('')
  })
  it('solo el primer nombre', () => {
    expect(primerNombre('  Ana María Pérez ')).toBe('Ana')
    expect(primerNombre(null)).toBe('')
  })
})
