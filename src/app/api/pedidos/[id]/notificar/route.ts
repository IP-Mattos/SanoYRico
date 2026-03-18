// src/app/api/pedidos/[id]/notificar/route.ts
// Envía email al cliente cuando cambia el estado del pedido (requiere sesión de admin)
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { notificarClienteEstado } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let estado: string
  try {
    const body = await req.json()
    estado = body.estado
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (estado !== 'entregado' && estado !== 'cancelado') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('numero, nombre, email')
    .eq('id', id)
    .single()

  if (!pedido?.email) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await notificarClienteEstado({
    email: pedido.email,
    numero: pedido.numero,
    nombre: pedido.nombre,
    estado: estado as 'entregado' | 'cancelado'
  })

  return NextResponse.json({ ok: true })
}
