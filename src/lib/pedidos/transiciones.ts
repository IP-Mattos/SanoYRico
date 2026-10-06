// src/lib/pedidos/transiciones.ts
// Tabla pura de transiciones de estado de un pedido y su efecto sobre el stock.

export type EstadoPedidoDB = 'pendiente' | 'confirmado' | 'entregado' | 'cancelado'
export type EfectoStock = 'descontar' | 'reponer' | 'ninguno'

export const ESTADOS_VALIDOS: readonly EstadoPedidoDB[] = ['pendiente', 'confirmado', 'entregado', 'cancelado']

const TABLA: Record<string, EfectoStock> = {
  'pendiente->confirmado': 'descontar',
  'pendiente->cancelado': 'ninguno',
  'confirmado->entregado': 'ninguno',
  'confirmado->cancelado': 'reponer',
  'entregado->cancelado': 'reponer'
}

export type DecisionEstado = { ok: true; efectoStock: EfectoStock } | { ok: false; motivo: string }

export function esEstadoPedido(valor: unknown): valor is EstadoPedidoDB {
  return typeof valor === 'string' && (ESTADOS_VALIDOS as readonly string[]).includes(valor)
}

export function decidirCambioEstado(actual: string, nuevo: string): DecisionEstado {
  const efectoStock = TABLA[`${actual}->${nuevo}`]
  if (!efectoStock) return { ok: false, motivo: `Transición no permitida: ${actual} -> ${nuevo}` }
  return { ok: true, efectoStock }
}
