// src/app/api/mp/webhook/route.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { decidirTransicionPago } from '@/lib/mp/decidir-transicion'
import { firmaValida } from '@/lib/mp/firma'

// Descuenta stock con update condicional (compara el stock leído) y registra el movimiento.
// Best-effort: un fallo se loguea pero no revierte la confirmación ya aplicada.
async function descontarStock(supabase: SupabaseClient, pedidoId: string) {
  const { data: items } = await supabase
    .from('pedido_items')
    .select('producto_id, cantidad')
    .eq('pedido_id', pedidoId)

  for (const it of items ?? []) {
    if (!it.producto_id) continue
    for (let intento = 0; intento < 3; intento++) {
      const { data: prod } = await supabase.from('productos').select('stock').eq('id', it.producto_id).maybeSingle()
      if (!prod) break
      const { data: ok } = await supabase
        .from('productos')
        .update({ stock: Math.max(0, prod.stock - it.cantidad) })
        .eq('id', it.producto_id)
        .eq('stock', prod.stock)
        .select('id')
      if (ok && ok.length > 0) {
        await supabase
          .from('movimientos_stock')
          .insert({ producto_id: it.producto_id, tipo: 'salida', cantidad: it.cantidad, motivo: `pedido ${pedidoId} (Mercado Pago)` })
        break
      }
      if (intento === 2) console.error('MP webhook: no se pudo descontar stock', it.producto_id)
    }
  }
}

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

  // ── Validar firma del webhook ─────────────────────────────────────────────
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('MP webhook: MERCADOPAGO_WEBHOOK_SECRET no configurado en producción')
      return NextResponse.json({ ok: false }, { status: 500 })
    }
    // Solo desarrollo local: se omite la validación
  } else if (
    !firmaValida({
      secret,
      xSignature: req.headers.get('x-signature'),
      xRequestId: req.headers.get('x-request-id'),
      dataId: String(body.data.id)
    })
  ) {
    console.warn('MP webhook: firma inválida')
    return NextResponse.json({ ok: false }, { status: 401 })
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
  const pedidoId: string | undefined = payment.external_reference

  if (!pedidoId) return NextResponse.json({ ok: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .select('id, estado, total, mp_payment_id')
    .eq('id', pedidoId)
    .maybeSingle()

  if (errPedido) {
    console.error('MP webhook: error leyendo pedido', errPedido)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  if (!pedido) return NextResponse.json({ ok: true })

  const decision = decidirTransicionPago(pedido, payment)
  if (decision.accion === 'ignorar') {
    if (decision.motivo === 'amount mismatch') {
      console.error('MP webhook: amount mismatch', { pedido: pedido.id, pago: payment.id })
    } else {
      console.warn('MP webhook: evento ignorado', decision.motivo, { pedido: pedido.id, pago: payment.id })
    }
    return NextResponse.json({ ok: true })
  }

  // Update condicional: solo la request que gana la carrera ejecuta los efectos secundarios
  const { data: confirmado, error: errUpdate } = await supabase
    .from('pedidos')
    .update({ estado: 'confirmado', mp_payment_id: String(payment.id) })
    .eq('id', pedido.id)
    .eq('estado', 'pendiente')
    .select('id')

  if (errUpdate) {
    console.error('MP webhook: error confirmando pedido', errUpdate)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  if (!confirmado || confirmado.length === 0) return NextResponse.json({ ok: true })

  await descontarStock(supabase, pedido.id)

  return NextResponse.json({ ok: true })
}

// MP también manda GET para verificar la URL del webhook
export async function GET() {
  return NextResponse.json({ ok: true })
}
