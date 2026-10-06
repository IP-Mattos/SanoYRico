// src/app/api/seguimiento/route.ts
// Seguimiento público de pedidos SIN datos personales: sin dirección, email ni notas;
// teléfono enmascarado y solo el primer nombre. Búsqueda por número o por teléfono exacto.
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import {
  enmascararTelefono,
  interpretarBusqueda,
  primerNombre,
  telefonoCoincide
} from '@/lib/pedidos/seguimiento'

const SIN_CACHE = { 'Cache-Control': 'no-store' }
const COLUMNAS = 'id, numero, nombre, telefono, metodo_pago, estado, total, created_at'

type FilaPedido = {
  id: string
  numero: number
  nombre: string | null
  telefono: string | null
  metodo_pago: string | null
  estado: string
  total: number
  created_at: string
}

export async function GET(req: NextRequest) {
  const busqueda = interpretarBusqueda(req.nextUrl.searchParams.get('q') ?? '')
  if (busqueda.tipo === 'invalida') {
    return NextResponse.json(
      { error: 'Ingresá un número de pedido o un teléfono de al menos 8 dígitos.' },
      { status: 400, headers: SIN_CACHE }
    )
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let fila: FilaPedido | undefined
  if (busqueda.tipo === 'numero') {
    const { data, error } = await supabase.from('pedidos').select(COLUMNAS).eq('numero', busqueda.numero).maybeSingle()
    if (error) {
      console.error('Seguimiento: error buscando por número', error)
      return NextResponse.json({ error: 'No pudimos consultar tu pedido. Intentá de nuevo.' }, { status: 500, headers: SIN_CACHE })
    }
    fila = data ?? undefined
  } else {
    // El teléfono se guarda con formatos distintos: el patrón con comodines entre dígitos
    // solo acota candidatos; la coincidencia EXACTA de dígitos se verifica abajo.
    const patron = `%${busqueda.digitos.split('').join('%')}%`
    const { data, error } = await supabase
      .from('pedidos')
      .select(COLUMNAS)
      .ilike('telefono', patron)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) {
      console.error('Seguimiento: error buscando por teléfono', error)
      return NextResponse.json({ error: 'No pudimos consultar tu pedido. Intentá de nuevo.' }, { status: 500, headers: SIN_CACHE })
    }
    fila = (data ?? []).find((p) => telefonoCoincide(p.telefono, busqueda.digitos))
  }

  if (!fila) {
    return NextResponse.json({ error: 'No encontramos ningún pedido con ese dato.' }, { status: 404, headers: SIN_CACHE })
  }

  const { data: items, error: errItems } = await supabase
    .from('pedido_items')
    .select('producto_nombre, producto_emoji, cantidad, precio_unitario, subtotal')
    .eq('pedido_id', fila.id)
  if (errItems) console.error('Seguimiento: error leyendo ítems', errItems)

  return NextResponse.json(
    {
      pedido: {
        numero: fila.numero,
        estado: fila.estado,
        metodo_pago: fila.metodo_pago,
        total: fila.total,
        created_at: fila.created_at,
        nombre: primerNombre(fila.nombre),
        telefono: enmascararTelefono(fila.telefono),
        items: items ?? []
      }
    },
    { headers: SIN_CACHE }
  )
}
