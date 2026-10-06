import { describe, expect, it, vi } from 'vitest'
import { quitarFondo, replicatePost, waitForPrediction, REMOVE_BG_VERSION, type Deps } from './replicate'

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

describe('quitarFondo', () => {
  it('usa la versión fijada y descarga el PNG resultante', async () => {
    const calls: string[] = []
    let body: { version: string; input: { image: string } } | undefined
    const d = deps(async (url, init) => {
      calls.push(url)
      if (url.endsWith('/v1/predictions')) {
        body = JSON.parse(String(init?.body))
        return json({ id: 'p', status: 'succeeded', output: 'https://replicate.delivery/out.png' })
      }
      return new Response(new Uint8Array([1, 2, 3]))
    })
    const out = await quitarFondo(Buffer.from('abc'), 'image/jpeg', d)
    expect([...out]).toEqual([1, 2, 3])
    expect(body?.version).toBe(REMOVE_BG_VERSION)
    expect(body?.input.image.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(calls).toHaveLength(2)
  })
  it('falla si Replicate responde error', async () => {
    await expect(quitarFondo(Buffer.from('a'), 'image/jpeg', deps(async () => json({}, 500)))).rejects.toThrow(/500/)
  })
  it('rechaza salidas que no son https', async () => {
    const d = deps(async () => json({ id: 'p', status: 'succeeded', output: 'http://x/y.png' }))
    await expect(quitarFondo(Buffer.from('a'), 'image/jpeg', d)).rejects.toThrow(/inesperada/)
  })
})
