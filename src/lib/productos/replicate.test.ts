import { describe, expect, it, vi } from 'vitest'
import {
  fotoEstudio,
  replicatePost,
  waitForPrediction,
  FOTO_ESTUDIO_PROMPT,
  FOTO_ESTUDIO_URL,
  REMOVE_BG_URL,
  type Deps
} from './replicate'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

function deps(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>, token: string | null = 't'): Deps & { sleeps: number[] } {
  const sleeps: number[] = []
  return {
    sleeps,
    fetch: vi.fn(fetchImpl) as unknown as typeof fetch,
    sleep: async (ms) => void sleeps.push(ms),
    token: () => token ?? undefined
  }
}

describe('replicatePost', () => {
  it('falla sin token y no llama a la red', async () => {
    const d = deps(async () => json({}), null)
    await expect(replicatePost('https://x', {}, d)).rejects.toThrow(/REPLICATE_API_TOKEN/)
    expect(d.fetch).not.toHaveBeenCalled()
  })
  it('reintenta en 429 respetando retry_after', async () => {
    let n = 0
    const d = deps(async () => (n++ === 0 ? json({ retry_after: 2 }, 429) : json({ ok: 1 })))
    const res = await replicatePost('https://x', {}, d)
    expect(res.status).toBe(200)
    expect(d.sleeps).toEqual([2500])
  })
  it('reintenta en 503 esperando ratelimit-reset', async () => {
    let n = 0
    const d = deps(async () =>
      n++ === 0
        ? new Response(JSON.stringify({ detail: 'Internal server error', status: 503 }), { status: 503, headers: { 'ratelimit-reset': '10' } })
        : json({ ok: 1 }, 201)
    )
    const res = await replicatePost('https://x', {}, d)
    expect(res.status).toBe(201)
    expect(d.fetch).toHaveBeenCalledTimes(2)
    expect(d.sleeps).toEqual([10500])
  })
  it('devuelve la última respuesta si el 5xx persiste', async () => {
    const d = deps(async () => json({ detail: 'Internal server error' }, 503))
    const res = await replicatePost('https://x', {}, d)
    expect(res.status).toBe(503)
    expect(d.fetch).toHaveBeenCalledTimes(3)
  })
  it('no reintenta errores 4xx que no son 429', async () => {
    const d = deps(async () => json({ detail: 'invalid' }, 422))
    const res = await replicatePost('https://x', {}, d)
    expect(res.status).toBe(422)
    expect(d.fetch).toHaveBeenCalledTimes(1)
  })
})

describe('waitForPrediction', () => {
  it('devuelve la salida si ya terminó', async () => {
    expect(await waitForPrediction({ id: '1', status: 'succeeded', output: 'u' }, deps(async () => json({})))).toBe('u')
  })
  it('sondea hasta que termina', async () => {
    let n = 0
    const d = deps(async () => json({ status: ++n < 3 ? 'processing' : 'succeeded', output: 'ok' }))
    expect(await waitForPrediction({ id: '1', status: 'processing' }, d)).toBe('ok')
  })
  it('corta por timeout', async () => {
    const d = deps(async () => json({ status: 'processing' }))
    await expect(waitForPrediction({ id: '1', status: 'processing' }, d, 6000)).rejects.toThrow(/Timeout/)
    expect(d.sleeps.length).toBe(3)
  })
  it('propaga fallos', async () => {
    await expect(waitForPrediction({ id: '1', status: 'failed' }, deps(async () => json({})))).rejects.toThrow(/failed/)
  })
})

describe('fotoEstudio', () => {
  it('pide a flux-kontext-pro la foto de estudio sin tocar el producto y descarga el JPG', async () => {
    const calls: string[] = []
    let body: { input: { input_image: string; prompt: string; output_format: string; aspect_ratio: string } } | undefined
    const d = deps(async (url, init) => {
      calls.push(url)
      if (url === FOTO_ESTUDIO_URL) {
        body = JSON.parse(String(init?.body))
        return json({ id: 'p', status: 'succeeded', output: 'https://replicate.delivery/out.jpg' })
      }
      return new Response(new Uint8Array([1, 2, 3]))
    })
    const out = await fotoEstudio(Buffer.from('abc'), 'image/jpeg', d)
    expect([...out]).toEqual([1, 2, 3])
    expect(FOTO_ESTUDIO_URL).toBe('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions')
    expect(body?.input.input_image.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(body?.input.prompt).toBe(FOTO_ESTUDIO_PROMPT)
    expect(FOTO_ESTUDIO_PROMPT).toMatch(/Do not modify the product/)
    // fondo de marca (lino crema, madera, hojas verde salvia) y sin logos inventados: el logo lo pone sharp
    expect(FOTO_ESTUDIO_PROMPT).toMatch(/cream linen cloth over a light wooden table/)
    expect(FOTO_ESTUDIO_PROMPT).toMatch(/sage-green leaves/)
    expect(FOTO_ESTUDIO_PROMPT).toMatch(/No text, no logos/)
    expect(body?.input.output_format).toBe('jpg')
    expect(body?.input.aspect_ratio).toBe('match_input_image')
    expect(calls).toEqual([FOTO_ESTUDIO_URL, 'https://replicate.delivery/out.jpg'])
  })
  it('falla si Replicate responde error', async () => {
    await expect(fotoEstudio(Buffer.from('a'), 'image/jpeg', deps(async () => json({}, 422)))).rejects.toThrow(/422/)
  })
  it('falla con el 5xx después de agotar los reintentos', async () => {
    const d = deps(async () => json({}, 503))
    await expect(fotoEstudio(Buffer.from('a'), 'image/jpeg', d)).rejects.toThrow(/503/)
    expect(d.fetch).toHaveBeenCalledTimes(3)
  })
  it('rechaza salidas que no son https', async () => {
    const d = deps(async () => json({ id: 'p', status: 'succeeded', output: 'http://x/y.jpg' }))
    await expect(fotoEstudio(Buffer.from('a'), 'image/jpeg', d)).rejects.toThrow(/inesperada/)
  })
})

describe('REMOVE_BG_URL', () => {
  it('sigue apuntando al modelo oficial de bria (lo usa el emoji)', () => {
    expect(REMOVE_BG_URL).toBe('https://api.replicate.com/v1/models/bria/remove-background/predictions')
  })
})
