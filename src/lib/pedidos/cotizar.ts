// src/lib/pedidos/cotizar.ts
// Cotización server-side: el cliente solo aporta {producto_id, cantidad}.

export interface ProductoDB {
  id: string
  nombre: string
  emoji: string | null
  precio: number
  stock: number
  activo: boolean
}

export interface ItemCotizado {
  producto_id: string
  producto_nombre: string
  producto_emoji: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type Cotizacion =
  | { ok: true; items: ItemCotizado[]; total: number }
  | { ok: false; status: number; error: string }

const MAX_CANTIDAD = 999
const MAX_ITEMS = 50

const falla = (status: number, error: string): Cotizacion => ({ ok: false, status, error })

export function cotizarPedido(
  itemsInput: unknown,
  productos: ProductoDB[],
  { minimoPedido }: { minimoPedido: number }
): Cotizacion {
  if (!Array.isArray(itemsInput) || itemsInput.length === 0) return falla(422, 'El pedido no tiene ítems')
  if (itemsInput.length > MAX_ITEMS) return falla(422, 'Demasiados ítems')

  // Unir líneas duplicadas del mismo producto
  const cantidades = new Map<string, number>()
  for (const raw of itemsInput) {
    if (!raw || typeof raw !== 'object') return falla(422, 'Ítem inválido')
    const { producto_id, cantidad } = raw as { producto_id?: unknown; cantidad?: unknown }
    if (typeof producto_id !== 'string' || !producto_id) return falla(422, 'Producto inválido')
    if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD) {
      return falla(422, 'Cantidad inválida')
    }
    cantidades.set(producto_id, (cantidades.get(producto_id) ?? 0) + cantidad)
  }

  const porId = new Map(productos.map((p) => [p.id, p]))
  const items: ItemCotizado[] = []
  for (const [id, cantidad] of cantidades) {
    const p = porId.get(id)
    if (!p || !p.activo) return falla(422, 'Producto no disponible')
    if (cantidad > MAX_CANTIDAD) return falla(422, 'Cantidad inválida')
    if (cantidad > p.stock) return falla(409, `Stock insuficiente para ${p.nombre}`)
    const precio = Number(p.precio)
    items.push({
      producto_id: p.id,
      producto_nombre: p.nombre,
      producto_emoji: p.emoji ?? '',
      cantidad,
      precio_unitario: precio,
      subtotal: precio * cantidad
    })
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0)
  if (total < minimoPedido) return falla(422, `El pedido mínimo es $${minimoPedido}`)

  return { ok: true, items, total }
}
