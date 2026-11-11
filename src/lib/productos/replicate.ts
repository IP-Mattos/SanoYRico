// src/lib/productos/replicate.ts
// Quitar el fondo de una foto con Replicate (mismo modelo que /api/remove-bg).
// El token viene solo de REPLICATE_API_TOKEN; la red y el reloj son inyectables para testear.

// Modelo oficial de Replicate (sin versión fija). lucataco/remove-bg, el comunitario que se usaba,
// empezó a responder 503 de forma persistente en nov-2026.
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

/** Devuelve un PNG con fondo transparente. Lanza si Replicate falla o se agota el tiempo. */
export async function quitarFondo(imagen: Buffer, mime: string, deps: Deps = depsReales): Promise<Buffer> {
  const dataUri = `data:${mime};base64,${imagen.toString('base64')}`
  const res = await replicatePost(REMOVE_BG_URL, { input: { image: dataUri } }, deps)
  if (!res.ok) throw new Error(`Replicate respondió ${res.status}`)
  const salida = await waitForPrediction(await res.json(), deps)
  const url = Array.isArray(salida) ? (salida[0] as string) : (salida as string)
  if (typeof url !== 'string' || !url.startsWith('https://')) throw new Error('Respuesta inesperada de Replicate')
  const png = await deps.fetch(url)
  if (!png.ok) throw new Error('No se pudo descargar el resultado')
  return Buffer.from(await png.arrayBuffer())
}
