// src/app/api/imagenes/promo/route.ts
// Imagen PNG de la promo por monto a partir de valores (aún sin guardar) del editor. Requiere sesión de admin.
import { NextResponse, type NextRequest } from 'next/server'
import { cargarFuentes, cargarLogo } from '@/lib/flyers/assets'
import { hostnameDe } from '@/lib/flyers/layout'
import { parsearParamsPromo } from '@/lib/imagenes/params'
import { renderPromo } from '@/lib/imagenes/render'
import { haySesion, SIN_CACHE } from '@/lib/imagenes/sesion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await haySesion(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: SIN_CACHE })

  const parsed = parsearParamsPromo(req.nextUrl.searchParams)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400, headers: SIN_CACHE })

  try {
    const origin = req.nextUrl.origin
    const [fuentes, logo] = await Promise.all([cargarFuentes(origin), cargarLogo(origin)])
    const host = hostnameDe(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sano-y-rico.vercel.app')
    const img = renderPromo({ ...parsed.params, logo, host }, fuentes)
    img.headers.set('Cache-Control', 'no-store')
    return img
  } catch (err) {
    console.error('Imagen promo: error generando la imagen', err)
    return NextResponse.json({ error: 'No pudimos generar la imagen' }, { status: 500, headers: SIN_CACHE })
  }
}
