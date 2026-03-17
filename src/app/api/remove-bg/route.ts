// src/app/api/remove-bg/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const REPLICATE_HEADERS = {
  Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
  'Content-Type': 'application/json',
  Prefer: 'wait'
}

// POST a Replicate con retry automático en 429
async function replicatePost(url: string, body: unknown, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: REPLICATE_HEADERS,
      body: JSON.stringify(body)
    })
    if (res.status === 429) {
      const data = await res.json()
      const wait = ((data.retry_after as number) ?? 6) * 1000 + 500
      console.log(`Rate limited, esperando ${wait}ms...`)
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    return res
  }
  throw new Error('Rate limit: demasiados reintentos')
}

// Espera hasta que una predicción de Replicate termine (polling si no resolvió en 60s)
async function waitForPrediction(prediction: { id: string; status: string; output?: unknown }): Promise<unknown> {
  if (prediction.status === 'succeeded') return prediction.output
  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    throw new Error(`Prediction ${prediction.status}`)
  }
  // Polling cada 2s hasta 90s total
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }
    })
    const data = await res.json()
    if (data.status === 'succeeded') return data.output
    if (data.status === 'failed' || data.status === 'canceled') throw new Error(`Prediction ${data.status}`)
  }
  throw new Error('Timeout esperando resultado de IA')
}

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }

  const file = formData.get('imagen') as File | null
  if (!file) return NextResponse.json({ error: 'No se recibió imagen' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Solo JPG, PNG o WebP' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Imagen demasiado grande (máx 10 MB)' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

  // ── Paso 1: Convertir a estilo emoji con flux-kontext ──────────────────────
  let emojiUrl: string
  try {
    const emojiRes = await replicatePost(
      'https://api.replicate.com/v1/models/flux-kontext-apps/kontext-emoji-maker/predictions',
      { input: { input_image: base64, prompt: 'Create a high-quality vector illustration in a clean official emoji style (inspired by Apple, Google or Samsung emojis) of the object shown in the image. The subject must be perfectly centered and isolated on a transparent background. Simplify the shape and texture of the object using sharp lines, defined edges and soft smooth gradients to give it a clean friendly 3D look, not photorealistic. Use a vibrant color palette faithful to the reference image but slightly more saturated for the emoji style. The final image must look like a professional emoji icon, clear and polished, ready to use in a messaging interface.' } }
    )
    if (!emojiRes.ok) {
      const err = await emojiRes.text()
      console.error('Emoji maker error:', err)
      return NextResponse.json({ error: 'Error al estilizar la imagen' }, { status: 502 })
    }
    const emojiPrediction = await emojiRes.json()
    const emojiOutput = await waitForPrediction(emojiPrediction)
    emojiUrl = Array.isArray(emojiOutput) ? (emojiOutput[0] as string) : (emojiOutput as string)
  } catch (e) {
    console.error('Emoji step failed:', e)
    return NextResponse.json({ error: 'Error generando estilo emoji' }, { status: 502 })
  }

  // ── Paso 2: Eliminar fondo del emoji generado ──────────────────────────────
  let transparentUrl: string
  try {
    const bgRes = await replicatePost(
      'https://api.replicate.com/v1/predictions',
      { version: '95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1', input: { image: emojiUrl } }
    )
    if (!bgRes.ok) {
      const err = await bgRes.text()
      console.error('Remove-bg error:', err)
      return NextResponse.json({ error: 'Error eliminando fondo' }, { status: 502 })
    }
    const bgPrediction = await bgRes.json()
    transparentUrl = (await waitForPrediction(bgPrediction)) as string
  } catch (e) {
    console.error('Remove-bg step failed:', e)
    return NextResponse.json({ error: 'Error eliminando fondo' }, { status: 502 })
  }

  // ── Paso 3: Descargar y subir a Supabase Storage ───────────────────────────
  const pngRes = await fetch(transparentUrl)
  if (!pngRes.ok) return NextResponse.json({ error: 'Error descargando resultado' }, { status: 502 })

  const pngBuffer = Buffer.from(await pngRes.arrayBuffer())
  const filename = `${crypto.randomUUID()}.png`

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: storageError } = await supabase.storage
    .from('productos')
    .upload(filename, pngBuffer, { contentType: 'image/png', upsert: false })

  if (storageError) {
    console.error('Storage error:', storageError)
    return NextResponse.json({ error: 'Error guardando la imagen' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl }, { status: 200 })
}
