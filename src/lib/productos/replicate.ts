// src/lib/productos/replicate.ts
// Llamadas a Replicate: foto de estudio para las fotos reales y modelo de quitar fondo (lo usa /api/remove-bg).
// El token viene solo de REPLICATE_API_TOKEN; la red y el reloj son inyectables para testear.

// Quitar fondo: modelo oficial de Replicate (sin versión fija). lucataco/remove-bg, el comunitario que se
// usaba, empezó a responder 503 de forma persistente en nov-2026.
export const REMOVE_BG_URL = 'https://api.replicate.com/v1/models/bria/remove-background/predictions'
export const PRESUPUESTO_MS = 90_000
const POLL_MS = 2000

export interface Deps {
  fetch: typeof fetch
  sleep: (ms: number) => Promise<void>
  token: () => string | undefined
}

export const depsReales: Deps = {
  fetch: (...a) => fetch(...a),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  token: () => process.env.REPLICATE_API_TOKEN
}

type Prediction = { id: string; status: string; output?: unknown }

/**
 * POST a Replicate. Reintenta en 429 y en 5xx: con poco crédito Replicate limita a ~1 pedido cada 10 s
 * y a veces responde ese límite como 503 "Internal server error" (con ratelimit-reset en los headers).
 */
export async function replicatePost(url: string, body: unknown, deps: Deps = depsReales, retries = 3): Promise<Response> {
  const token = deps.token()
  if (!token) throw new Error('Falta REPLICATE_API_TOKEN')
  for (let i = 0; ; i++) {
    const res = await deps.fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
      body: JSON.stringify(body)
    })
    const reintentable = res.status === 429 || res.status >= 500
    if (!reintentable) return res
    if (i === retries - 1) {
      if (res.status === 429) throw new Error('Rate limit: demasiados reintentos')
      return res
    }
    const data = await res.json().catch(() => ({}))
    const segundos = Number(data.retry_after ?? res.headers.get('ratelimit-reset') ?? 6) || 6
    await deps.sleep(segundos * 1000 + 500)
  }
}

/** Espera la predicción; el sondeo corta cuando se agota el presupuesto de tiempo. */
export async function waitForPrediction(
  prediction: Prediction,
  deps: Deps = depsReales,
  presupuestoMs = PRESUPUESTO_MS
): Promise<unknown> {
  if (prediction.status === 'succeeded') return prediction.output
  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    throw new Error(`Prediction ${prediction.status}`)
  }
  const token = deps.token()
  for (let gastado = 0; gastado < presupuestoMs; gastado += POLL_MS) {
    await deps.sleep(POLL_MS)
    const res = await deps.fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.status === 'succeeded') return data.output
    if (data.status === 'failed' || data.status === 'canceled') throw new Error(`Prediction ${data.status}`)
  }
  throw new Error('Timeout esperando el resultado')
}

export const FOTO_ESTUDIO_URL = 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions'

// Kontext redibuja la imagen entera: el prompt insiste en no tocar el producto (las fotos son "reales").
// El fondo sigue la marca (verde salvia, crema, amarillo cálido); el logo NO se pide a la IA, lo estampa sharp.
export const FOTO_ESTUDIO_PROMPT =
  'Replace only the background and lighting. Place this exact product, in the same position, on a natural cream ' +
  'linen cloth over a light wooden table, with a few fresh sage-green leaves softly out of focus at the edges of the ' +
  'frame (never touching or covering the product), warm soft natural daylight and a gentle natural shadow under the ' +
  'product, like a cozy artisanal healthy-food brand photo in sage green, cream and warm yellow tones. Do not modify ' +
  'the product in any way: keep every ingredient, seed, flake, grain, label and printed text in exactly the same ' +
  'position, size, shape and color, keep the packaging shape, wrinkles and reflections identical. Do not redraw, ' +
  'rearrange, add or remove anything on or inside the product. Same framing, same camera angle, same product scale. ' +
  'No text, no logos.'

/** Convierte la foto en foto de estudio (fondo crema, luz suave). Devuelve un JPG. Lanza si Replicate falla. */
export async function fotoEstudio(imagen: Buffer, mime: string, deps: Deps = depsReales): Promise<Buffer> {
  const dataUri = `data:${mime};base64,${imagen.toString('base64')}`
  const res = await replicatePost(
    FOTO_ESTUDIO_URL,
    { input: { input_image: dataUri, prompt: FOTO_ESTUDIO_PROMPT, output_format: 'jpg', aspect_ratio: 'match_input_image' } },
    deps
  )
  if (!res.ok) throw new Error(`Replicate respondió ${res.status}`)
  const salida = await waitForPrediction(await res.json(), deps)
  const url = Array.isArray(salida) ? (salida[0] as string) : (salida as string)
  if (typeof url !== 'string' || !url.startsWith('https://')) throw new Error('Respuesta inesperada de Replicate')
  const foto = await deps.fetch(url)
  if (!foto.ok) throw new Error('No se pudo descargar el resultado')
  return Buffer.from(await foto.arrayBuffer())
}
