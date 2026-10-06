// src/lib/imagenes/condiciones.ts
// Textos de las imágenes de cupón y promo, derivados de los datos (sin I/O).
import type { CuponTipo } from '@/lib/types'
import { fechaCompleta, fechaCorta, formatearMonto } from './formato'

export const NO_APLICA_PROMO = 'No aplica a productos en promo'

export interface DatosCuponImagen {
  tipo: CuponTipo
  valor: number
  vence_at: string | null
  usos_max: number | null
  telefono: string | null
}

const redondear = (n: number) => Math.round(n * 100) / 100

/** "10% OFF" o "$200 OFF". */
export function descuentoCupon(tipo: CuponTipo, valor: number): string {
  return tipo === 'porcentaje' ? `${redondear(valor)}% OFF` : `${formatearMonto(valor)} OFF`
}

export function titularCupon(saludo: string): string {
  const s = saludo.trim()
  return s ? `Un regalo para vos, ${s}` : 'Un regalo para vos'
}

/** Condiciones chicas del cupón. Nunca incluye el número de teléfono. */
export function condicionesCupon(c: DatosCuponImagen): string[] {
  const l: string[] = []
  if (c.usos_max === 1) l.push('Válido por 1 uso')
  else if (c.usos_max !== null && c.usos_max > 1) l.push(`Hasta ${c.usos_max} usos`)
  if (c.telefono) l.push('Válido solo con tu teléfono')
  if (c.vence_at) {
    const f = fechaCompleta(c.vence_at)
    if (f) l.push(`Vence el ${f}`)
  }
  l.push(NO_APLICA_PROMO)
  return l
}

/** "Del dd/mm al dd/mm", "Desde el dd/mm", "Hasta el dd/mm" o null si no hay fechas. */
export function lineaFechasPromo(desde: string | null, hasta: string | null): string | null {
  const d = desde ? fechaCorta(desde) : null
  const h = hasta ? fechaCorta(hasta) : null
  if (d && h) return `Del ${d} al ${h}`
  if (h) return `Hasta el ${h}`
  if (d) return `Desde el ${d}`
  return null
}

export function titularPromo(pct: number): string {
  return `${redondear(pct)}% OFF`
}

export function subtituloPromo(minimo: number): string {
  return minimo > 0 ? `en compras desde ${formatearMonto(minimo)}` : 'en toda tu compra'
}
