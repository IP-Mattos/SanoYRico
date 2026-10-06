// src/app/api/pedidos/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { notificarAdminNuevoPedido, notificarClienteRecibo } from '@/lib/email'
import { cotizarPedido, type ProductoDB } from '@/lib/pedidos/cotizar'
import { DEFAULT_CONFIG } from '@/lib/site-config'
import { MSG_CUPON_INVALIDO } from '@/lib/pedidos/descuentos'
import {
  COLUMNAS_PRODUCTO_COTIZACION,
  consumirCupon,
  leerCupon,
  leerPromoMonto,
  liberarCupon,
  normalizarCodigoCupon
} from '@/lib/pedidos/cupones'

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
  cupon?: string
  total?: number // ignorado: el total se recalcula siempre en el servidor
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
  const [{ data: productos, error: errProductos }, { data: cfg }, { data: cfgPromo }] = await Promise.all([
    supabase.from('productos').select(COLUMNAS_PRODUCTO_COTIZACION).in('id', ids),
    supabase.from('configuracion').select('valor').eq('clave', 'general').maybeSingle(),
    supabase.from('configuracion').select('valor').eq('clave', 'promoMonto').maybeSingle()
  ])
  if (errProductos) {
    console.error('Error leyendo productos:', errProductos)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }

  const minimoCfg = Number((cfg?.valor as { minimoPedido?: unknown } | null)?.minimoPedido)
  const minimoPedido = Number.isFinite(minimoCfg) && minimoCfg >= 0 ? minimoCfg : DEFAULT_CONFIG.general.minimoPedido

  // Cupón opcional: si el cliente manda uno, tiene que ser válido (no se descarta en silencio).
  // Cualquier descuento que mande el cliente se ignora: todo se recalcula acá.
  const codigoCrudo = typeof body.cupon === 'string' ? body.cupon.trim() : ''
  let cupon: Awaited<ReturnType<typeof leerCupon>>['cupon'] | undefined
  if (codigoCrudo) {
    const codigo = normalizarCodigoCupon(codigoCrudo)
    if (!codigo) return NextResponse.json({ error: MSG_CUPON_INVALIDO }, { status: 422 })
    const lectura = await leerCupon(supabase, codigo)
    if (lectura.error) return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
    cupon = lectura.cupon
  }

  const cotizacion = cotizarPedido(body.items, (productos ?? []) as ProductoDB[], {
    minimoPedido,
    promoMonto: leerPromoMonto(cfgPromo?.valor),
    telefono,
    ...(codigoCrudo ? { cupon: cupon ?? null, codigoCupon: codigoCrudo } : {})
  })
  if (!cotizacion.ok) {
    return NextResponse.json({ error: cotizacion.error }, { status: cotizacion.status })
  }
  const { items, subtotal, descuento, descuento_tipo, cupon_codigo, total } = cotizacion

  // Consumir el cupón ANTES de crear el pedido (update optimista); se libera si el pedido falla.
  if (cupon_codigo) {
    const consumo = await consumirCupon(supabase, cupon_codigo)
    if (consumo === 'agotado') {
      return NextResponse.json({ error: 'Este cupón ya alcanzó su límite de usos' }, { status: 422 })
    }
    if (consumo === 'error') {
      return NextResponse.json({ error: 'No pudimos aplicar el cupón. Intentá de nuevo en unos segundos.' }, { status: 409 })
    }
  }

  const direccion = `${calle}, ${localidad}`

  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .insert({ nombre, telefono, email, direccion, notas, metodo_pago, total, subtotal, descuento, descuento_tipo, cupon_codigo })
    .select('id, numero')
    .single()

  if (errPedido || !pedido) {
    console.error('Error creando pedido:', errPedido)
    if (cupon_codigo) await liberarCupon(supabase, cupon_codigo)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }

  const { error: errItems } = await supabase
    .from('pedido_items')
    .insert(items.map((i) => ({ ...i, pedido_id: pedido.id })))

  if (errItems) {
    console.error('Error insertando items:', errItems)
    // Eliminar el pedido huérfano
    await supabase.from('pedidos').delete().eq('id', pedido.id)
    if (cupon_codigo) await liberarCupon(supabase, cupon_codigo)
    return NextResponse.json({ error: 'Error al guardar los productos' }, { status: 500 })
  }

  const emailItems = items.map((i) => ({
    emoji: i.producto_emoji,
    nombre: i.producto_nombre,
    cantidad: i.cantidad,
    subtotal: i.subtotal
  }))

  // Recibo inmediato al cliente (fire-and-forget)
  const descuentoEmail = descuento > 0 ? { subtotal, monto: descuento, cupon: cupon_codigo } : null
  notificarClienteRecibo({ email, numero: pedido.numero, nombre, total, descuento: descuentoEmail, items: emailItems }).catch((e) =>
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
    descuento: descuentoEmail,
    items: emailItems
  }).catch((e) => console.error('Email admin error:', e))

  return NextResponse.json({ id: pedido.id, numero: pedido.numero }, { status: 201 })
}
