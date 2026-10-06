// src/lib/pedidos/cupones.ts
// Cupones en el servidor (cliente service-role): lectura por código, consumo y liberación.
// El consumo usa update optimista (.eq('usos', leido)) con reintentos, igual que el stock.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Cupon } from '@/lib/types'
import { DEFAULT_CONFIG, type PromoMontoConfig } from '@/lib/site-config'

const INTENTOS = 3

export const COLUMNAS_PRODUCTO_COTIZACION =
  'id, nombre, emoji, precio, stock, activo, descuento_pct, descuento_desde, descuento_hasta'

const COLUMNAS_CUPON = 'id, codigo, tipo, valor, vence_at, usos_max, usos, telefono, activo'

/** Código normalizado (mayúsculas, sin espacios) o null si viene vacío / con formato imposible. */
export function normalizarCodigoCupon(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const codigo = raw.trim().toUpperCase()
  if (!codigo || codigo.length > 40 || !/^[A-Z0-9_-]+$/.test(codigo)) return null
  return codigo
}

/** Usos después de consumir, o null si el cupón ya no tiene usos disponibles. */
export function usosTrasConsumir(usos: number, usosMax: number | null): number | null {
  if (usosMax != null && usos >= usosMax) return null
  return usos + 1
}

/** Usos después de liberar (nunca baja de 0). */
export function usosTrasLiberar(usos: number): number {
  return Math.max(0, usos - 1)
}

/** Config de la promo por monto desde la fila `configuracion.promoMonto` (con defaults seguros). */
export function leerPromoMonto(valor: unknown): PromoMontoConfig {
  const d = DEFAULT_CONFIG.promoMonto
  if (!valor || typeof valor !== 'object') return d
  const v = valor as Partial<PromoMontoConfig>
  return {
    activo: v.activo === true,
    minimo: Number.isFinite(Number(v.minimo)) ? Number(v.minimo) : d.minimo,
    pct: Number.isFinite(Number(v.pct)) ? Number(v.pct) : d.pct,
    desde: typeof v.desde === 'string' ? v.desde : '',
    hasta: typeof v.hasta === 'string' ? v.hasta : ''
  }
}

export async function leerCupon(
  supabase: SupabaseClient,
  codigo: string
): Promise<{ cupon: Cupon | null; error: boolean }> {
  const { data, error } = await supabase.from('cupones').select(COLUMNAS_CUPON).eq('codigo', codigo).maybeSingle()
  if (error) {
    console.error('Cupón: error leyendo', error)
    return { cupon: null, error: true }
  }
  return { cupon: (data as Cupon | null) ?? null, error: false }
}

export type ResultadoConsumo = 'ok' | 'agotado' | 'error'

/** Consume un uso del cupón. 'agotado' si ya no quedan usos / está inactivo; 'error' si falla o hay contención. */
export async function consumirCupon(supabase: SupabaseClient, codigo: string): Promise<ResultadoConsumo> {
  for (let intento = 0; intento < INTENTOS; intento++) {
    const { data: fila, error } = await supabase
      .from('cupones')
      .select('usos, usos_max, activo')
      .eq('codigo', codigo)
      .maybeSingle()
    if (error) {
      console.error('Cupón: error leyendo para consumir', error)
      return 'error'
    }
    if (!fila || !fila.activo) return 'agotado'
    const nuevo = usosTrasConsumir(fila.usos, fila.usos_max)
    if (nuevo === null) return 'agotado'
    const { data: ok, error: errUpdate } = await supabase
      .from('cupones')
      .update({ usos: nuevo })
      .eq('codigo', codigo)
      .eq('usos', fila.usos)
      .select('codigo')
    if (errUpdate) {
      console.error('Cupón: error consumiendo', errUpdate)
      return 'error'
    }
    if (ok && ok.length > 0) return 'ok'
  }
  return 'error'
}

/** Devuelve un uso al cupón (cancelación o pedido que no se pudo crear). Best-effort: true si se aplicó. */
export async function liberarCupon(supabase: SupabaseClient, codigo: string): Promise<boolean> {
  for (let intento = 0; intento < INTENTOS; intento++) {
    const { data: fila, error } = await supabase.from('cupones').select('usos').eq('codigo', codigo).maybeSingle()
    if (error || !fila) {
      if (error) console.error('Cupón: error leyendo para liberar', error)
      return false
    }
    if (fila.usos <= 0) return true
    const { data: ok } = await supabase
      .from('cupones')
      .update({ usos: usosTrasLiberar(fila.usos) })
      .eq('codigo', codigo)
      .eq('usos', fila.usos)
      .select('codigo')
    if (ok && ok.length > 0) return true
  }
  console.error(`Cupón ${codigo}: no se pudo liberar el uso tras ${INTENTOS} intentos`)
  return false
}
