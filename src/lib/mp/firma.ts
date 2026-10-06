// src/lib/mp/firma.ts
import { createHmac, timingSafeEqual } from 'crypto'

// x-signature formato: "ts=<timestamp>,v1=<hmac>"
export function firmaValida(args: {
  secret: string
  xSignature: string | null
  xRequestId: string | null
  dataId: string
}): boolean {
  const { secret, xSignature, xRequestId, dataId } = args
  if (!xSignature) return false

  const parts: Record<string, string> = {}
  xSignature.split(',').forEach((part) => {
    const [k, ...v] = part.split('=')
    parts[k.trim()] = v.join('=').trim()
  })
  const { ts, v1 } = parts
  if (!ts || !v1) return false

  let manifest = `id:${dataId};request-date:${ts};`
  if (xRequestId) manifest += `uid:${xRequestId};`

  const esperado = Buffer.from(createHmac('sha256', secret).update(manifest).digest('hex'), 'hex')
  const recibido = Buffer.from(v1, 'hex')
  if (recibido.length !== esperado.length) return false
  return timingSafeEqual(esperado, recibido)
}
