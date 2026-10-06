import { describe, expect, it } from 'vitest'
import { decidirTransicionPago } from './decidir-transicion'

const pedido = { id: 'p1', estado: 'pendiente', total: 2000, mp_payment_id: null as string | null }
const pago = { id: 123, status: 'approved', external_reference: 'p1', currency_id: 'UYU', transaction_amount: 2000 }

describe('decidirTransicionPago', () => {
  it('approved sobre pendiente -> confirmar', () => {
    expect(decidirTransicionPago(pedido, pago)).toMatchObject({ accion: 'confirmar' })
  })
  it('rejected -> ignorar (no cancela)', () => {
    expect(decidirTransicionPago(pedido, { ...pago, status: 'rejected' })).toMatchObject({ accion: 'ignorar' })
    expect(decidirTransicionPago(pedido, { ...pago, status: 'cancelled' })).toMatchObject({ accion: 'ignorar' })
  })
  it('pending -> ignorar', () => {
    expect(decidirTransicionPago(pedido, { ...pago, status: 'pending' })).toMatchObject({ accion: 'ignorar' })
  })
  it('mismo mp_payment_id ya procesado -> ignorar', () => {
    const r = decidirTransicionPago({ ...pedido, mp_payment_id: '123' }, pago)
    expect(r).toMatchObject({ accion: 'ignorar', motivo: 'pago duplicado' })
  })
  it.each(['confirmado', 'entregado', 'cancelado'])('estado %s -> ignorar', (estado) => {
    expect(decidirTransicionPago({ ...pedido, estado }, pago)).toMatchObject({ accion: 'ignorar' })
  })
  it('monto distinto -> ignorar', () => {
    const r = decidirTransicionPago(pedido, { ...pago, transaction_amount: 1 })
    expect(r).toMatchObject({ accion: 'ignorar', motivo: 'amount mismatch' })
  })
  it('tolera diferencias menores a un centésimo', () => {
    expect(decidirTransicionPago(pedido, { ...pago, transaction_amount: 2000.004 })).toMatchObject({
      accion: 'confirmar'
    })
  })
  it('moneda distinta -> ignorar', () => {
    expect(decidirTransicionPago(pedido, { ...pago, currency_id: 'ARS' })).toMatchObject({ accion: 'ignorar' })
  })
  it('external_reference distinta -> ignorar', () => {
    expect(decidirTransicionPago(pedido, { ...pago, external_reference: 'otro' })).toMatchObject({
      accion: 'ignorar'
    })
  })
})
