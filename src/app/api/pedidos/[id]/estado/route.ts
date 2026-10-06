// src/app/api/pedidos/[id]/estado/route.ts
// Cambia el estado de un pedido y ajusta el stock (requiere sesión de admin).
// La sesión se exige en src/proxy.ts y se vuelve a verificar acá (defensa en profundidad).
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { decidirCambioEstado, esEstadoPedido } from '@/lib/pedidos/transiciones'
import { descontarStockPedido, reponerStockPedido } from '@/lib/pedidos/stock'
import { liberarCupon } from '@/lib/pedidos/cupones'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  let estado: unknown
  try {
    estado = (await req.json()).estado
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!esEstadoPedido(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: pedido, error: errLectura } = await supabase
    .from('pedidos')
    .select('id, estado, cupon_codigo')
    .eq('id', id)
    .maybeSingle()
  if (errLectura) {
    console.error('Estado pedido: error leyendo', errLectura)
    return NextResponse.json({ error: 'Error al leer el pedido' }, { status: 500 })
  }
  if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  const decision = decidirCambioEstado(pedido.estado, estado)
  if (!decision.ok) return NextResponse.json({ error: decision.motivo }, { status: 409 })

  // Update condicional: solo quien gana la carrera toca el stock
  const { data: actualizado, error: errUpdate } = await supabase
    .from('pedidos')
    .update({ estado })
    .eq('id', id)
    .eq('estado', pedido.estado)
    .select('id')
  if (errUpdate) {
    console.error('Estado pedido: error actualizando', errUpdate)
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })
  }
  if (!actualizado || actualizado.length === 0) {
    return NextResponse.json({ error: 'El pedido ya cambió de estado. Recargá la lista.' }, { status: 409 })
  }

  let stockFallido: string[] = []
  if (decision.efectoStock === 'descontar') {
    stockFallido = await descontarStockPedido(supabase, id, `pedido ${id} (dashboard)`)
  } else if (decision.efectoStock === 'reponer') {
    stockFallido = await reponerStockPedido(supabase, id, `cancelación pedido ${id} (dashboard)`)
  }

  // Cancelar un pedido devuelve el uso del cupón (solo quien ganó la carrera de estado llega acá).
  // El estado 'cancelado' es terminal, así que no se libera dos veces.
  let cuponLiberado: boolean | undefined
  if (estado === 'cancelado' && pedido.cupon_codigo) {
    cuponLiberado = await liberarCupon(supabase, pedido.cupon_codigo)
  }

  return NextResponse.json({ ok: true, estado, stockFallido, ...(cuponLiberado === false ? { cuponSinLiberar: true } : {}) })
}
