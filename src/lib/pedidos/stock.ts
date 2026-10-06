// src/lib/pedidos/stock.ts
// Movimientos de stock de un pedido (solo servidor, cliente service-role).
// Update optimista (.eq('stock', leido)) con reintentos, y un movimiento en movimientos_stock por ítem.
// Best-effort: devuelve los producto_id que no se pudieron ajustar; el llamador decide qué hacer.
import type { SupabaseClient } from '@supabase/supabase-js'

const INTENTOS = 3

async function moverStock(
  supabase: SupabaseClient,
  pedidoId: string,
  sentido: 'salida' | 'entrada',
  motivo: string
): Promise<string[]> {
  const { data: items } = await supabase
    .from('pedido_items')
    .select('producto_id, cantidad')
    .eq('pedido_id', pedidoId)

  const fallidos: string[] = []
  for (const it of items ?? []) {
    if (!it.producto_id) continue
    let aplicado = false
    for (let intento = 0; intento < INTENTOS && !aplicado; intento++) {
      const { data: prod } = await supabase.from('productos').select('stock').eq('id', it.producto_id).maybeSingle()
      if (!prod) break
      const nuevo = sentido === 'salida' ? Math.max(0, prod.stock - it.cantidad) : prod.stock + it.cantidad
      const { data: ok } = await supabase
        .from('productos')
        .update({ stock: nuevo })
        .eq('id', it.producto_id)
        .eq('stock', prod.stock)
        .select('id')
      if (ok && ok.length > 0) {
        await supabase
          .from('movimientos_stock')
          .insert({ producto_id: it.producto_id, tipo: sentido, cantidad: it.cantidad, motivo })
        aplicado = true
      }
    }
    if (!aplicado) {
      console.error('Stock: no se pudo ajustar', { pedido: pedidoId, producto: it.producto_id, sentido })
      fallidos.push(it.producto_id)
    }
  }
  return fallidos
}

export function descontarStockPedido(supabase: SupabaseClient, pedidoId: string, motivo?: string) {
  return moverStock(supabase, pedidoId, 'salida', motivo ?? `pedido ${pedidoId}`)
}

export function reponerStockPedido(supabase: SupabaseClient, pedidoId: string, motivo?: string) {
  return moverStock(supabase, pedidoId, 'entrada', motivo ?? `cancelación pedido ${pedidoId}`)
}
