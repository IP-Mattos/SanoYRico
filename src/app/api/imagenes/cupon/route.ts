// src/app/api/imagenes/cupon/route.ts
// Imagen PNG de un cupón (requiere sesión de admin). El descuento se lee del servidor, nunca del cliente.
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { cargarFuentes, cargarLogo } from '@/lib/flyers/assets'
import { hostnameDe } from '@/lib/flyers/layout'
import { parsearParamsCupon } from '@/lib/imagenes/params'
import { renderCupon } from '@/lib/imagenes/render'
import { haySesion, SIN_CACHE } from '@/lib/imagenes/sesion'
import type { Cupon } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await haySesion(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: SIN_CACHE })

  const parsed = parsearParamsCupon(req.nextUrl.searchParams)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400, headers: SIN_CACHE })
  const { id, formato, saludo } = parsed.params

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase
    .from('cupones')
    .select('codigo, tipo, valor, vence_at, usos_max, telefono')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('Imagen cupón: error leyendo', error)
    return NextResponse.json({ error: 'Error al leer el cupón' }, { status: 500, headers: SIN_CACHE })
  }
  if (!data) return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404, headers: SIN_CACHE })
  const c = data as Pick<Cupon, 'codigo' | 'tipo' | 'valor' | 'vence_at' | 'usos_max' | 'telefono'>

  try {
    const origin = req.nextUrl.origin
    const [fuentes, logo] = await Promise.all([cargarFuentes(origin), cargarLogo(origin)])
    const host = hostnameDe(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sano-y-rico.vercel.app')
    const img = renderCupon(
      { codigo: c.codigo, tipo: c.tipo, valor: Number(c.valor), vence_at: c.vence_at, usos_max: c.usos_max, telefono: c.telefono, saludo, formato, logo, host },
      fuentes
    )
    img.headers.set('Cache-Control', 'no-store')
    return img
  } catch (err) {
    console.error('Imagen cupón: error generando la imagen', err)
    return NextResponse.json({ error: 'No pudimos generar la imagen' }, { status: 500, headers: SIN_CACHE })
  }
}
