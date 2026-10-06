// src/app/api/mp/create-preference/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type inválido' }, { status: 400 })
  }

  let body: { pedido_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const pedidoId = body?.pedido_id
  if (typeof pedidoId !== 'string' || !UUID_RE.test(pedidoId)) {
    return NextResponse.json({ error: 'pedido_id inválido' }, { status: 422 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ error: 'Mercado Pago no configurado' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Todo el contenido de la preferencia sale de la DB, nunca del cliente
  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .select('id, numero, nombre, telefono, estado, metodo_pago, mp_preference_id, total, descuento')
    .eq('id', pedidoId)
    .maybeSingle()

  if (errPedido) {
    console.error('MP preference: error leyendo pedido', errPedido)
    return NextResponse.json({ error: 'Error leyendo el pedido' }, { status: 500 })
  }
  if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (pedido.estado !== 'pendiente' || pedido.metodo_pago !== 'mercadopago' || pedido.mp_preference_id) {
    return NextResponse.json({ error: 'El pedido no admite pago' }, { status: 409 })
  }

  const { data: items, error: errItems } = await supabase
    .from('pedido_items')
    .select('producto_nombre, producto_emoji, cantidad, precio_unitario')
    .eq('pedido_id', pedido.id)

  if (errItems || !items || items.length === 0) {
    console.error('MP preference: error leyendo items', errItems)
    return NextResponse.json({ error: 'Error leyendo el pedido' }, { status: 500 })
  }

  // Con descuento, un único ítem por el total guardado: MP no admite descuentos negativos y así
  // el monto cobrado coincide siempre con pedidos.total (que el webhook verifica).
  const conDescuento = Number(pedido.descuento) > 0
  const preference = {
    external_reference: pedido.id,
    items: conDescuento
      ? [
          {
            title: `Pedido Sano y Rico #${pedido.numero}`,
            quantity: 1,
            unit_price: Number(pedido.total),
            currency_id: 'UYU'
          }
        ]
      : items.map((i) => ({
          title: `${i.producto_emoji ?? ''} ${i.producto_nombre}`.trim(),
          quantity: i.cantidad,
          unit_price: Number(i.precio_unitario),
          currency_id: 'UYU'
        })),
    payer: {
      name: pedido.nombre,
      phone: { area_code: '', number: pedido.telefono }
    },
    back_urls: {
      success: `${appUrl}/mp/success?pedido=${pedido.numero}`,
      failure: `${appUrl}/mp/failure?pedido=${pedido.numero}`,
      pending: `${appUrl}/mp/pending?pedido=${pedido.numero}`
    },
    auto_return: 'approved',
    notification_url: `${appUrl}/api/mp/webhook`,
    statement_descriptor: 'Sano y Rico'
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preference)
  })

  if (!mpRes.ok) {
    const err = await mpRes.text()
    console.error('MP error:', err)
    return NextResponse.json({ error: 'Error creando preferencia de pago' }, { status: 502 })
  }

  const data = await mpRes.json()

  // Guardar preference_id solo si nadie lo guardó antes (evita pisarla en requests concurrentes)
  const { data: guardado, error: errGuardar } = await supabase
    .from('pedidos')
    .update({ mp_preference_id: data.id })
    .eq('id', pedido.id)
    .is('mp_preference_id', null)
    .select('id')

  if (errGuardar || !guardado || guardado.length === 0) {
    console.error('MP preference: no se pudo guardar mp_preference_id', errGuardar)
    return NextResponse.json({ error: 'El pedido no admite pago' }, { status: 409 })
  }

  // En producción usar init_point, en sandbox usar sandbox_init_point
  const isProd = !accessToken.startsWith('TEST-')
  const initPoint = isProd ? data.init_point : data.sandbox_init_point

  return NextResponse.json({ init_point: initPoint }, { status: 200 })
}
