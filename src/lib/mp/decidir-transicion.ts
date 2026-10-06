// src/lib/mp/decidir-transicion.ts
// Guard puro: decide si un pago de MP debe confirmar el pedido.

export interface PedidoParaPago {
  id: string
  estado: string
  total: number
  mp_payment_id: string | null
}

export interface PagoMP {
  id: number | string
  status: string
  external_reference?: string | null
  currency_id?: string
  transaction_amount?: number
}

export type DecisionPago = { accion: 'confirmar' } | { accion: 'ignorar'; motivo: string }

const ignorar = (motivo: string): DecisionPago => ({ accion: 'ignorar', motivo })

export function decidirTransicionPago(pedido: PedidoParaPago, pago: PagoMP): DecisionPago {
  if (pago.external_reference !== pedido.id) return ignorar('external_reference no coincide')
  if (pago.currency_id !== 'UYU') return ignorar('currency mismatch')
  if (
    typeof pago.transaction_amount !== 'number' ||
    !(Math.abs(pago.transaction_amount - Number(pedido.total)) < 0.01)
  ) {
    return ignorar('amount mismatch')
  }
  if (pedido.mp_payment_id && pedido.mp_payment_id === String(pago.id)) return ignorar('pago duplicado')
  if (pedido.estado !== 'pendiente') return ignorar(`pedido en estado ${pedido.estado}`)
  if (pago.status !== 'approved') return ignorar(`pago ${pago.status}`)
  return { accion: 'confirmar' }
}
