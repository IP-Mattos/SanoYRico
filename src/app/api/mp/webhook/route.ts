// src/app/api/mp/webhook/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  let body: { type?: string; data?: { id?: string } }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Solo nos interesan los eventos de pago
  if (body.type !== 'payment' || !body.data?.id) {
    return NextResponse.json({ ok: true })
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) return NextResponse.json({ ok: false }, { status: 500 })

  // Consultar el pago a MP para obtener status y external_reference
  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${body.data.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!paymentRes.ok) {
    console.error('MP webhook: error consultando pago', body.data.id)
    return NextResponse.json({ ok: false }, { status: 502 })
  }

  const payment = await paymentRes.json()
  const pedidoId: string = payment.external_reference
  const status: string = payment.status // approved | pending | rejected | cancelled

  if (!pedidoId) return NextResponse.json({ ok: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (status === 'approved') {
    await supabase
      .from('pedidos')
      .update({ estado: 'confirmado', mp_payment_id: String(payment.id) })
      .eq('id', pedidoId)
  } else if (status === 'rejected' || status === 'cancelled') {
    await supabase
      .from('pedidos')
      .update({ estado: 'cancelado', mp_payment_id: String(payment.id) })
      .eq('id', pedidoId)
  }
  // pending: no cambiamos el estado, queda en "pendiente"

  return NextResponse.json({ ok: true })
}

// MP también manda GET para verificar la URL del webhook
export async function GET() {
  return NextResponse.json({ ok: true })
}
