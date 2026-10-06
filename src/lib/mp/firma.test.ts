import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { firmaValida } from './firma'

const secret = 's3cret'
const firmar = (id: string, ts: string, rid: string) =>
  createHmac('sha256', secret).update(`id:${id};request-date:${ts};uid:${rid};`).digest('hex')

describe('firmaValida', () => {
  it('acepta una firma correcta', () => {
    const v1 = firmar('9', '100', 'r1')
    expect(firmaValida({ secret, xSignature: `ts=100,v1=${v1}`, xRequestId: 'r1', dataId: '9' })).toBe(true)
  })
  it('rechaza firma incorrecta, de otro largo, o ausente', () => {
    expect(firmaValida({ secret, xSignature: 'ts=100,v1=abcd', xRequestId: 'r1', dataId: '9' })).toBe(false)
    expect(firmaValida({ secret, xSignature: `ts=100,v1=${firmar('8', '100', 'r1')}`, xRequestId: 'r1', dataId: '9' })).toBe(false)
    expect(firmaValida({ secret, xSignature: null, xRequestId: 'r1', dataId: '9' })).toBe(false)
  })
})
