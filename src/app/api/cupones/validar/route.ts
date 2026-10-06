// src/app/api/cupones/validar/route.ts
// Vista previa pública del carrito con descuentos: calcula la MISMA cotización que /api/pedidos
// (precios, promos, cupón y promo por monto salen de la DB) pero no consume ni guarda nada.
// Pública y con rate limit propio en src/proxy.ts. Nunca revela si un cupón personal existe para otro teléfono.
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { cotizarPedido, type ProductoDB } from '@/lib/pedidos/cotizar'
import { MSG_CUPON_INVALIDO } from '@/lib/pedidos/descuentos'
import {
  COLUMNAS_PRODUCTO_COTIZACION,
  leerCupon,
  leerPromoMonto,
  normalizarCodigoCupon
} from '@/lib/pedidos/cupones'

const SIN_CACHE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ ok: false, mensaje: 'Content-Type inválido' }, { status: 400, headers: SIN_CACHE })
  }

  let body: { codigo?: unknown; telefono?: unknown; items?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'JSON inválido' }, { status: 400, headers: SIN_CACHE })
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    return NextResponse.json({ ok: false, mensaje: 'El carrito está vacío' }, { headers: SIN_CACHE })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const ids = [
    ...new Set(
      body.items
        .map((it) => (it as { producto_id?: unknown })?.producto_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 40)
    )
  ]
  const [{ data: productos, error: errProductos }, { data: cfgPromo }] = await Promise.all([
    supabase.from('productos').select(COLUMNAS_PRODUCTO_COTIZACION).in('id', ids),
    supabase.from('configuracion').select('valor').eq('clave', 'promoMonto').maybeSingle()
  ])
  if (errProductos) {
    console.error('Validar cupón: error leyendo productos', errProductos)
    return NextResponse.json({ ok: false, mensaje: 'No pudimos calcular tu pedido. Intentá de nuevo.' }, { status: 500, headers: SIN_CACHE })
  }

  const codigoCrudo = typeof body.codigo === 'string' ? body.codigo.trim() : ''
  const telefono = typeof body.telefono === 'string' ? body.telefono.trim().slice(0, 30) : ''

  let cupon: Awaited<ReturnType<typeof leerCupon>>['cupon'] | undefined
  if (codigoCrudo) {
    const codigo = normalizarCodigoCupon(codigoCrudo)
    if (!codigo) return NextResponse.json({ ok: false, mensaje: MSG_CUPON_INVALIDO }, { headers: SIN_CACHE })
    const lectura = await leerCupon(supabase, codigo)
    if (lectura.error) {
      return NextResponse.json({ ok: false, mensaje: 'No pudimos validar el cupón. Intentá de nuevo.' }, { status: 500, headers: SIN_CACHE })
    }
    cupon = lectura.cupon
  }

  // minimoPedido 0: acá solo se previsualiza; el mínimo lo exige /api/pedidos (y el carrito lo muestra).
  const cotizacion = cotizarPedido(body.items, (productos ?? []) as ProductoDB[], {
    minimoPedido: 0,
    promoMonto: leerPromoMonto(cfgPromo?.valor),
    telefono,
    ...(codigoCrudo ? { cupon: cupon ?? null, codigoCupon: codigoCrudo } : {})
  })
  if (!cotizacion.ok) {
    return NextResponse.json({ ok: false, mensaje: cotizacion.error }, { headers: SIN_CACHE })
  }

  const cuponAplicado = cotizacion.descuento_tipo === 'cupon'
  const mensaje = cuponAplicado
    ? `Cupón aplicado: -$${cotizacion.descuento}`
    : (cotizacion.aviso ?? (cotizacion.descuento_tipo === 'monto' ? `Promo por monto aplicada: -$${cotizacion.descuento}` : ''))

  return NextResponse.json(
    {
      ok: true,
      subtotal: cotizacion.subtotal,
      descuento: cotizacion.descuento,
      descuento_tipo: cotizacion.descuento_tipo,
      cupon_aplicado: cuponAplicado,
      total: cotizacion.total,
      mensaje
    },
    { headers: SIN_CACHE }
  )
}
