// src/lib/pedidos/cotizar.ts
// Cotización server-side: el cliente solo aporta {producto_id, cantidad} (y un código de cupón).
// Precios, promos y descuentos salen siempre de la DB / configuración.
import type { Cupon, DescuentoTipo } from '@/lib/types'
import type { PromoMontoConfig } from '@/lib/site-config'
import {
  MSG_CUPON_INVALIDO,
  descuentoCupon,
  descuentoPromoMonto,
  evaluarCupon,
  precioConPromo,
  redondear,
  type PromoProducto
} from './descuentos'

export interface ProductoDB extends PromoProducto {
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
  /** Precio de lista (sin promo de producto). */
  precio_lista: number
  /** Precio efectivamente cobrado por unidad (con promo de producto si estaba activa). */
  precio_unitario: number
  subtotal: number
}

export type Cotizacion =
  | {
      ok: true
      items: ItemCotizado[]
      /** Suma de los ítems (ya con promos de producto), antes de cupón / promo por monto. */
      subtotal: number
      descuento: number
      descuento_tipo: DescuentoTipo | null
      cupon_codigo: string | null
      total: number
      /** Aviso informativo (p. ej. el cupón no se usó porque la promo por monto era mayor). */
      aviso?: string
    }
  | { ok: false; status: number; error: string }

export interface OpcionesCotizacion {
  /** Se compara contra el total FINAL (ya descontado). */
  minimoPedido: number
  /** Fila del cupón; `null` = el código no existe. Ausente = sin cupón. */
  cupon?: Cupon | null
  /** Código tipeado por el cliente (si viene y no hay `cupon`, se rechaza como inexistente). */
  codigoCupon?: string
  promoMonto?: PromoMontoConfig | null
  /** Teléfono del pedido, para cupones personales. */
  telefono?: string
  /** Reloj inyectable para tests. */
  ahora?: Date
}

const MAX_CANTIDAD = 999
const MAX_ITEMS = 50

const falla = (status: number, error: string): Cotizacion => ({ ok: false, status, error })

export function cotizarPedido(itemsInput: unknown, productos: ProductoDB[], opciones: OpcionesCotizacion): Cotizacion {
  const { minimoPedido, promoMonto, telefono } = opciones
  const ahora = opciones.ahora ?? new Date()

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
  let elegible = 0 // subtotal de ítems SIN promo de producto activa (único que admite cupón / promo por monto)
  for (const [id, cantidad] of cantidades) {
    const p = porId.get(id)
    if (!p || !p.activo) return falla(422, 'Producto no disponible')
    if (cantidad > MAX_CANTIDAD) return falla(422, 'Cantidad inválida')
    if (cantidad > p.stock) return falla(409, p.stock > 0
          ? `No hay stock suficiente de ${p.nombre}: quedan ${p.stock} unidad${p.stock === 1 ? '' : 'es'}. Ajustá la cantidad en tu carrito.`
          : `${p.nombre} está agotado. Quitalo de tu carrito para continuar.`)
    const { lista, precio, pct } = precioConPromo(p, ahora)
    const subtotal = redondear(precio * cantidad)
    if (pct === null) elegible += subtotal
    items.push({
      producto_id: p.id,
      producto_nombre: p.nombre,
      producto_emoji: p.emoji ?? '',
      cantidad,
      precio_lista: lista,
      precio_unitario: precio,
      subtotal
    })
  }

  const subtotal = redondear(items.reduce((s, i) => s + i.subtotal, 0))
  elegible = redondear(elegible)

  // ── Cupón (si el cliente mandó uno, debe ser válido: no se descarta en silencio) ──
  const pidioCupon = opciones.cupon !== undefined || !!opciones.codigoCupon
  let cuponDescuento = 0
  if (pidioCupon) {
    const ev = evaluarCupon(opciones.cupon, telefono, ahora)
    if (!ev.ok) return falla(422, ev.error)
    if (elegible <= 0) return falla(422, 'Este cupón no aplica a productos en promoción')
    cuponDescuento = descuentoCupon(opciones.cupon as Cupon, elegible)
  }

  const montoDescuento = descuentoPromoMonto(promoMonto, subtotal, elegible, ahora)

  // Nunca se acumulan: gana el mayor. En empate gana la promo por monto (no gasta el cupón).
  let descuento = 0
  let descuento_tipo: DescuentoTipo | null = null
  let cupon_codigo: string | null = null
  let aviso: string | undefined
  if (pidioCupon && cuponDescuento > montoDescuento) {
    descuento = cuponDescuento
    descuento_tipo = 'cupon'
    cupon_codigo = (opciones.cupon as Cupon).codigo
  } else if (montoDescuento > 0) {
    descuento = montoDescuento
    descuento_tipo = 'monto'
    if (pidioCupon) aviso = 'Se aplicó la promo por monto de tu pedido porque es mejor que el cupón. El cupón no se consumió.'
  } else if (pidioCupon) {
    return falla(422, MSG_CUPON_INVALIDO)
  }

  descuento = Math.min(descuento, subtotal)
  const total = redondear(Math.max(0, subtotal - descuento))
  if (total < minimoPedido) {
    return falla(422, `El pedido mínimo es de $${minimoPedido}. Sumá más productos para continuar.`)
  }

  return { ok: true, items, subtotal, descuento, descuento_tipo, cupon_codigo, total, ...(aviso ? { aviso } : {}) }
}
