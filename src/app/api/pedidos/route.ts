// src/app/api/pedidos/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface ItemInput {
  producto_id: number
  nombre: string
  emoji: string
  cantidad: number
  precio: number
}

interface PedidoInput {
  nombre: string
  telefono: string
  localidad: string
  calle: string
  notas?: string
  metodo_pago?: string
  total: number
  items: ItemInput[]
}

// ── Sanitización básica ───────────────────────────────────────────────────────
function clean(s: unknown, max = 200): string {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, max).replace(/[<>]/g, '')
}

// ── POST /api/pedidos ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Validar Content-Type
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type inválido' }, { status: 400 })
  }

  let body: PedidoInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // ── Validación de campos ──────────────────────────────────────────────────
  const nombre = clean(body.nombre, 100)
  const telefono = clean(body.telefono, 30)
  const localidad = clean(body.localidad, 100)
  const calle = clean(body.calle, 200)
  const notas = clean(body.notas ?? '', 500) || null
  const metodo_pago = ['transferencia', 'deposito', 'mercadopago'].includes(body.metodo_pago ?? '')
    ? body.metodo_pago
    : null
  const total = Number(body.total)

  if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 422 })
  if (!telefono) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 422 })
  if (!localidad) return NextResponse.json({ error: 'Localidad requerida' }, { status: 422 })
  if (!calle) return NextResponse.json({ error: 'Calle requerida' }, { status: 422 })
  if (!Number.isFinite(total) || total <= 0) return NextResponse.json({ error: 'Total inválido' }, { status: 422 })
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'El pedido no tiene ítems' }, { status: 422 })
  }
  if (body.items.length > 50) {
    return NextResponse.json({ error: 'Demasiados ítems' }, { status: 422 })
  }

  // Validar y sanitizar cada ítem
  const items = body.items.map((it) => {
    const cantidad = Math.floor(Number(it.cantidad))
    const precio = Number(it.precio)
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 999) throw new Error('Cantidad inválida')
    if (!Number.isFinite(precio) || precio < 0) throw new Error('Precio inválido')
    return {
      producto_id: Number(it.producto_id),
      producto_nombre: clean(it.nombre, 100),
      producto_emoji: clean(it.emoji, 10),
      cantidad,
      precio_unitario: precio,
      subtotal: precio * cantidad
    }
  })

  // Verificar que el total declarado coincide con los ítems (tolerancia de $1 por redondeos)
  const totalCalculado = items.reduce((s, i) => s + i.subtotal, 0)
  if (Math.abs(totalCalculado - total) > 1) {
    return NextResponse.json({ error: 'Total no coincide con los ítems' }, { status: 422 })
  }

  // ── Supabase con service role (bypass RLS para escritura pública) ──────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const direccion = `${calle}, ${localidad}`

  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .insert({ nombre, telefono, direccion, notas, metodo_pago, total })
    .select('id, numero')
    .single()

  if (errPedido || !pedido) {
    console.error('Error creando pedido:', errPedido)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }

  const { error: errItems } = await supabase
    .from('pedido_items')
    .insert(items.map((i) => ({ ...i, pedido_id: pedido.id })))

  if (errItems) {
    console.error('Error insertando items:', errItems)
    // Eliminar el pedido huérfano
    await supabase.from('pedidos').delete().eq('id', pedido.id)
    return NextResponse.json({ error: 'Error al guardar los productos' }, { status: 500 })
  }

  return NextResponse.json({ id: pedido.id, numero: pedido.numero }, { status: 201 })
}
