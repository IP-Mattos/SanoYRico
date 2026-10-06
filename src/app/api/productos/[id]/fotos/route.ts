// src/app/api/productos/[id]/fotos/route.ts
// Fotos reales de un producto: subir (POST), borrar (DELETE) y reordenar (PATCH). Requiere sesión de admin.
// La sesión se exige en src/proxy.ts y se vuelve a verificar acá (defensa en profundidad).
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { fotoJpeg, normalizarFoto, recortePng } from '@/lib/productos/imagen'
import { quitarFondo } from '@/lib/productos/replicate'
import {
  BUCKET_PRODUCTOS,
  MAX_FOTOS,
  chequearSubida,
  esPermutacion,
  fotosDe,
  prefijoFotos,
  rutaStorageDeUrl
} from '@/lib/productos/fotos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120 // quitar el fondo puede tardar hasta ~90 s

type Ctx = { params: Promise<{ id: string }> }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function haySesion(req: NextRequest): Promise<boolean> {
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await auth.auth.getUser()
  return !!user
}

async function leerFotos(supabase: SupabaseClient, id: string): Promise<{ fotos: string[] } | NextResponse> {
  const { data, error } = await supabase.from('productos').select('id, fotos').eq('id', id).maybeSingle()
  if (error) {
    console.error('Fotos: error leyendo producto', error)
    return NextResponse.json({ error: 'Error al leer el producto' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  return { fotos: fotosDe((data as { fotos?: unknown }).fotos) }
}

async function guardarFotos(supabase: SupabaseClient, id: string, fotos: string[]): Promise<NextResponse | null> {
  const { error } = await supabase.from('productos').update({ fotos }).eq('id', id)
  if (error) {
    console.error('Fotos: error guardando', error)
    return NextResponse.json({ error: 'Error al guardar las fotos' }, { status: 500 })
  }
  return null
}

const cliente = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await haySesion(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No se recibió imagen' }, { status: 400 })

  const supabase = cliente()
  const actual = await leerFotos(supabase, id)
  if (actual instanceof NextResponse) return actual

  const chequeo = chequearSubida(actual.fotos.length, file.size, file.type)
  if (!chequeo.ok) return NextResponse.json({ error: chequeo.error }, { status: chequeo.status })

  // Por defecto se quita el fondo; "0" sube la foto tal cual (normalizada)
  const sinQuitarFondo = formData.get('quitarFondo') === '0'

  let normalizada: Buffer
  try {
    normalizada = await normalizarFoto(Buffer.from(await file.arrayBuffer()))
  } catch (e) {
    console.error('Fotos: no se pudo procesar la imagen', e)
    return NextResponse.json({ error: 'No pudimos procesar esa imagen. Probá con un JPG o PNG.' }, { status: 415 })
  }

  let contenido: Buffer
  let extension: 'png' | 'jpg'
  if (sinQuitarFondo) {
    contenido = await fotoJpeg(normalizada)
    extension = 'jpg'
  } else {
    try {
      contenido = await recortePng(await quitarFondo(normalizada, 'image/jpeg'))
      extension = 'png'
    } catch (e) {
      // Nunca se guarda el original en silencio: el cliente decide si reintenta sin quitar el fondo
      console.error('Fotos: error quitando el fondo', e)
      return NextResponse.json(
        { error: 'No pudimos quitar el fondo de la foto.', code: 'fondo_fallido' },
        { status: 502 }
      )
    }
  }

  const ruta = `${prefijoFotos(id)}${crypto.randomUUID()}.${extension}`
  const { error: errSubida } = await supabase.storage
    .from(BUCKET_PRODUCTOS)
    .upload(ruta, contenido, {
      contentType: extension === 'png' ? 'image/png' : 'image/jpeg',
      upsert: false,
      cacheControl: '31536000'
    })
  if (errSubida) {
    console.error('Fotos: error subiendo', errSubida)
    return NextResponse.json({ error: 'Error guardando la imagen' }, { status: 500 })
  }
  const { data: { publicUrl } } = supabase.storage.from(BUCKET_PRODUCTOS).getPublicUrl(ruta)

  // Se vuelve a leer justo antes de escribir para no pisar cambios hechos durante el procesamiento
  const ultimo = await leerFotos(supabase, id)
  if (ultimo instanceof NextResponse) {
    await supabase.storage.from(BUCKET_PRODUCTOS).remove([ruta])
    return ultimo
  }
  if (ultimo.fotos.length >= MAX_FOTOS) {
    await supabase.storage.from(BUCKET_PRODUCTOS).remove([ruta])
    return NextResponse.json({ error: `Máximo ${MAX_FOTOS} fotos por producto` }, { status: 409 })
  }
  const fotos = [...ultimo.fotos, publicUrl]
  const fallo = await guardarFotos(supabase, id, fotos)
  if (fallo) {
    await supabase.storage.from(BUCKET_PRODUCTOS).remove([ruta])
    return fallo
  }
  return NextResponse.json({ fotos })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await haySesion(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })

  let url: unknown
  try {
    url = (await req.json()).url
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (typeof url !== 'string') return NextResponse.json({ error: 'Falta la url' }, { status: 400 })

  const supabase = cliente()
  const actual = await leerFotos(supabase, id)
  if (actual instanceof NextResponse) return actual
  if (!actual.fotos.includes(url)) return NextResponse.json({ error: 'La foto no existe' }, { status: 404 })

  const fotos = actual.fotos.filter((f) => f !== url)
  const fallo = await guardarFotos(supabase, id, fotos)
  if (fallo) return fallo

  // Solo se borra el archivo si está bajo fotos/<producto_id>/ (nunca la ilustración u otros productos)
  const ruta = rutaStorageDeUrl(url, id)
  if (ruta) {
    const { error } = await supabase.storage.from(BUCKET_PRODUCTOS).remove([ruta])
    if (error) console.error('Fotos: no se pudo borrar el archivo', error)
  }
  return NextResponse.json({ fotos })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await haySesion(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })

  let nuevo: unknown
  try {
    nuevo = (await req.json()).fotos
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const supabase = cliente()
  const actual = await leerFotos(supabase, id)
  if (actual instanceof NextResponse) return actual
  if (!esPermutacion(actual.fotos, nuevo)) {
    return NextResponse.json({ error: 'El orden no coincide con las fotos actuales. Recargá e intentá de nuevo.' }, { status: 409 })
  }
  const fallo = await guardarFotos(supabase, id, nuevo)
  if (fallo) return fallo
  return NextResponse.json({ fotos: nuevo })
}
