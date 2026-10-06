// src/app/api/flyers/route.ts
// Genera el flyer PNG de productos (requiere sesión de admin).
// La sesión se exige en src/proxy.ts y se vuelve a verificar acá (defensa en profundidad).
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { precioConPromo } from '@/lib/pedidos/descuentos'
import { parsearParamsFlyer, ordenarPorIds } from '@/lib/flyers/params'
import { hostnameDe } from '@/lib/flyers/layout'
import { cargarFuentes, cargarImagenProducto, cargarLogo } from '@/lib/flyers/assets'
import { renderFlyer, type ProductoFlyer } from '@/lib/flyers/render'
import type { Producto } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SIN_CACHE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: SIN_CACHE })

  const parsed = parsearParamsFlyer(req.nextUrl.searchParams)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400, headers: SIN_CACHE })
  const { ids, formato, titulo, cupon } = parsed.params

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, emoji, imagen_url, precio, descuento_pct, descuento_desde, descuento_hasta')
    .in('id', ids)
    .eq('activo', true)
  if (error) {
    console.error('Flyers: error leyendo productos', error)
    return NextResponse.json({ error: 'Error al leer los productos' }, { status: 500, headers: SIN_CACHE })
  }

  type Fila = Pick<Producto, 'id' | 'nombre' | 'emoji' | 'imagen_url' | 'precio' | 'descuento_pct' | 'descuento_desde' | 'descuento_hasta'>
  const filas = ordenarPorIds(ids, (data ?? []) as Fila[])
  if (filas.length === 0) {
    return NextResponse.json({ error: 'No se encontraron productos activos' }, { status: 404, headers: SIN_CACHE })
  }

  try {
    const origin = req.nextUrl.origin
    const ahora = new Date()
    const [fuentes, logo, imagenes] = await Promise.all([
      cargarFuentes(origin),
      cargarLogo(origin),
      Promise.all(filas.map((f) => cargarImagenProducto(f.imagen_url)))
    ])
    const productos: ProductoFlyer[] = filas.map((f, i) => {
      const { lista, precio, pct } = precioConPromo(f, ahora)
      return { nombre: f.nombre.trim(), emoji: f.emoji, imagen: imagenes[i], lista, precio, pct }
    })

    const host = hostnameDe(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sano-y-rico.vercel.app')
    const img = renderFlyer({ formato, titulo, cupon, productos, logo, host }, fuentes)
    img.headers.set('Cache-Control', 'no-store')
    return img
  } catch (err) {
    console.error('Flyers: error generando la imagen', err)
    return NextResponse.json({ error: 'No pudimos generar el flyer' }, { status: 500, headers: SIN_CACHE })
  }
}
