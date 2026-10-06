// src/app/api/pedidos/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { notificarAdminNuevoPedido, notificarClienteRecibo } from '@/lib/email'
import { cotizarPedido, type ProductoDB } from '@/lib/pedidos/cotizar'
import { DEFAULT_CONFIG } from '@/lib/site-config'

// ── Tipos ────────────────────────────────────────────────────────────────────
// Del cliente solo se aceptan producto_id y cantidad por ítem; precios y nombres salen de la DB.
interface PedidoInput {
  nombre: string
  telefono: string
  email?: string
  localidad: string
  calle: string
  notas?: string
  metodo_pago?: string
  total?: number
  items: { producto_id: string; cantidad: number }[]
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
  const email = clean(body.email ?? '', 200)
  const localidad = clean(body.localidad, 100)
  const calle = clean(body.calle, 200)
  const notas = clean(body.notas ?? '', 500) || null
  const metodo_pago = ['transferencia', 'deposito', 'mercadopago'].includes(body.metodo_pago ?? '')
    ? body.metodo_pago
    : null

  if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 422 })
  if (!telefono) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 422 })
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 422 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 422 })
  }
  if (!localidad) return NextResponse.json({ error: 'Localidad requerida' }, { status: 422 })
  if (!calle) return NextResponse.json({ error: 'Calle requerida' }, { status: 422 })
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'El pedido no tiene ítems' }, { status: 422 })
  }
  if (body.items.length > 50) {
    return NextResponse.json({ error: 'Demasiados ítems' }, { status: 422 })
  }

  // ── Supabase con service role (bypass RLS para escritura pública) ──────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Cotización server-side: precios, stock y mínimo salen de la DB ─────────
  const ids = [
    ...new Set(
      body.items
        .map((it) => (it as { producto_id?: unknown })?.producto_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 40)
    )
  ]
  const [{ data: productos, error: errProductos }, { data: cfg }] = await Promise.all([
    supabase.from('productos').select('id, nombre, emoji, precio, stock, activo').in('id', ids),
    supabase.from('configuracion').select('valor').eq('clave', 'general').maybeSingle()
  ])
  if (errProductos) {
    console.error('Error leyendo productos:', errProductos)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }

  const minimoCfg = Number((cfg?.valor as { minimoPedido?: unknown } | null)?.minimoPedido)
  const minimoPedido = Number.isFinite(minimoCfg) && minimoCfg >= 0 ? minimoCfg : DEFAULT_CONFIG.general.minimoPedido

  const cotizacion = cotizarPedido(body.items, (productos ?? []) as ProductoDB[], { minimoPedido })
  if (!cotizacion.ok) {
    return NextResponse.json({ error: cotizacion.error }, { status: cotizacion.status })
  }
  const { items, total } = cotizacion

  const direccion = `${calle}, ${localidad}`

  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .insert({ nombre, telefono, email, direccion, notas, metodo_pago, total })
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

  const emailItems = items.map((i) => ({
    emoji: i.producto_emoji,
    nombre: i.producto_nombre,
    cantidad: i.cantidad,
    subtotal: i.subtotal
  }))

  // Recibo inmediato al cliente (fire-and-forget)
  notificarClienteRecibo({ email, numero: pedido.numero, nombre, total, items: emailItems }).catch((e) =>
    console.error('Email recibo error:', e)
  )

  // Notificar al admin por email (fire-and-forget)
  notificarAdminNuevoPedido({
    numero: pedido.numero,
    nombre,
    telefono,
    direccion,
    notas,
    metodo_pago,
    total,
    items: emailItems
  }).catch((e) => console.error('Email admin error:', e))

  return NextResponse.json({ id: pedido.id, numero: pedido.numero }, { status: 201 })
}
