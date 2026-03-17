// src/app/api/mp/create-preference/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

interface ItemInput {
  nombre: string
  emoji: string
  cantidad: number
  precio: number
}

interface PreferenceInput {
  pedido_id: string
  pedido_numero: number
  nombre: string
  telefono: string
  items: ItemInput[]
  total: number
}

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type inválido' }, { status: 400 })
  }

  let body: PreferenceInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ error: 'Mercado Pago no configurado' }, { status: 500 })
  }

  // Crear preferencia en MP
  const preference = {
    external_reference: body.pedido_id,
    items: body.items.map((i) => ({
      title: `${i.emoji} ${i.nombre}`,
      quantity: i.cantidad,
      unit_price: i.precio,
      currency_id: 'UYU'
    })),
    payer: {
      name: body.nombre,
      phone: { area_code: '', number: body.telefono }
    },
    back_urls: {
      success: `${appUrl}/mp/success?pedido=${body.pedido_numero}`,
      failure: `${appUrl}/mp/failure?pedido=${body.pedido_numero}`,
      pending: `${appUrl}/mp/pending?pedido=${body.pedido_numero}`
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

  // Guardar preference_id en el pedido
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase
    .from('pedidos')
    .update({ mp_preference_id: data.id })
    .eq('id', body.pedido_id)

  // En producción usar init_point, en sandbox usar sandbox_init_point
  const isProd = !accessToken.startsWith('TEST-')
  const initPoint = isProd ? data.init_point : data.sandbox_init_point

  return NextResponse.json({ init_point: initPoint }, { status: 200 })
}
