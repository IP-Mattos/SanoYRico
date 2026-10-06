// src/lib/pedidos/descuentos.ts
// Reglas puras de descuentos (sin I/O): promo de producto, cupón y promo por monto.
// Las usan tanto el servidor (autoridad) como la tienda (solo para mostrar el precio tachado).
import type { Cupon } from '@/lib/types'
import type { PromoMontoConfig } from '@/lib/site-config'
import { normalizarTelefono } from './seguimiento'

export interface PromoProducto {
  precio: number
  descuento_pct?: number | null
  descuento_desde?: string | null
  descuento_hasta?: string | null
}

/** Mensaje genérico: no distingue cupón inexistente de uno atado a otro teléfono. */
export const MSG_CUPON_INVALIDO = 'Cupón no válido para este pedido'

/** Redondeo monetario único: 2 decimales, mitad hacia arriba. */
export function redondear(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Ventana de vigencia. Vacío/null = sin límite; una fecha ilegible deja la promo inactiva. */
export function dentroDeVentana(desde: string | null | undefined, hasta: string | null | undefined, ahora: Date): boolean {
  const t = ahora.getTime()
  if (desde) {
    const d = Date.parse(desde)
    if (Number.isNaN(d) || t < d) return false
  }
  if (hasta) {
    const h = Date.parse(hasta)
    if (Number.isNaN(h) || t > h) return false
  }
  return true
}

const pctValido = (pct: unknown): pct is number => typeof pct === 'number' && pct > 0 && pct <= 100

export function promoProductoActiva(p: PromoProducto, ahora: Date): boolean {
  return pctValido(p.descuento_pct) && dentroDeVentana(p.descuento_desde, p.descuento_hasta, ahora)
}

/** Precio de lista, precio a cobrar y % de la promo (null si no hay promo activa). */
export function precioConPromo(p: PromoProducto, ahora: Date): { lista: number; precio: number; pct: number | null } {
  const lista = Number(p.precio)
  if (!promoProductoActiva(p, ahora)) return { lista, precio: lista, pct: null }
  const pct = p.descuento_pct as number
  return { lista, precio: redondear(lista - (lista * pct) / 100), pct }
}

export type EvaluacionCupon = { ok: true } | { ok: false; error: string }

/** Valida el cupón. El teléfono se chequea primero para no revelar cupones personales ajenos. */
export function evaluarCupon(cupon: Cupon | null | undefined, telefono: string | null | undefined, ahora: Date): EvaluacionCupon {
  const invalido = { ok: false as const, error: MSG_CUPON_INVALIDO }
  if (!cupon) return invalido
  if (cupon.telefono) {
    const esperado = normalizarTelefono(cupon.telefono)
    const dado = normalizarTelefono(telefono ?? '')
    if (!esperado || !dado || esperado !== dado) return invalido
  }
  if (!cupon.activo) return { ok: false, error: 'Este cupón ya no está disponible' }
  if (cupon.vence_at) {
    const v = Date.parse(cupon.vence_at)
    if (Number.isNaN(v) || ahora.getTime() > v) return { ok: false, error: 'Este cupón venció' }
  }
  if (cupon.usos_max != null && cupon.usos >= cupon.usos_max) {
    return { ok: false, error: 'Este cupón ya alcanzó su límite de usos' }
  }
  return { ok: true }
}

/** Descuento del cupón sobre el subtotal elegible (nunca lo supera). */
export function descuentoCupon(cupon: Cupon, elegible: number): number {
  const bruto = cupon.tipo === 'porcentaje' ? (elegible * Number(cupon.valor)) / 100 : Number(cupon.valor)
  return redondear(Math.min(Math.max(bruto, 0), elegible))
}

export function promoMontoVigente(promo: PromoMontoConfig | null | undefined, ahora: Date): promo is PromoMontoConfig {
  return (
    !!promo &&
    promo.activo === true &&
    pctValido(promo.pct) &&
    Number(promo.minimo) >= 0 &&
    dentroDeVentana(promo.desde, promo.hasta, ahora)
  )
}

/**
 * Descuento de la promo por monto: el umbral se mide sobre TODO el carrito (`subtotal`),
 * pero el porcentaje solo aplica a los ítems sin promo (`elegible`).
 */
export function descuentoPromoMonto(promo: PromoMontoConfig | null | undefined, subtotal: number, elegible: number, ahora: Date): number {
  if (!promoMontoVigente(promo, ahora) || subtotal < Number(promo.minimo)) return 0
  return redondear(Math.min((elegible * promo.pct) / 100, elegible))
}
