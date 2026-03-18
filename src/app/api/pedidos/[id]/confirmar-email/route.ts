// src/app/api/pedidos/[id]/confirmar-email/route.ts
// Envía email de confirmación al cliente (requiere sesión de admin)
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { notificarClienteConfirmacion } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let nroRastreo: string | undefined
  try {
    const body = await req.json()
    nroRastreo = body.nroRastreo?.trim() || undefined
  } catch {
    // body opcional
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Obtener pedido con items
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('numero, nombre, email, total')
    .eq('id', id)
    .single()

  if (!pedido?.email) {
    return NextResponse.json({ ok: true, skipped: true }) // sin email, nada que hacer
  }

  const { data: itemsRaw } = await supabase
    .from('pedido_items')
    .select('producto_nombre, producto_emoji, cantidad, subtotal')
    .eq('pedido_id', id)

  await notificarClienteConfirmacion({
    email: pedido.email,
    numero: pedido.numero,
    nombre: pedido.nombre,
    total: pedido.total,
    nroRastreo,
    items: (itemsRaw ?? []).map((i) => ({
      emoji: i.producto_emoji ?? '',
      nombre: i.producto_nombre,
      cantidad: i.cantidad,
      subtotal: i.subtotal
    }))
  })

  return NextResponse.json({ ok: true })
}
