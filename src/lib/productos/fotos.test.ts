import { describe, expect, it } from 'vitest'
import { chequearSubida, esPermutacion, fotosDe, rutaStorageDeUrl, MAX_BYTES_FOTO } from './fotos'

const ID = '11111111-1111-4111-8111-111111111111'
const base = 'https://abc.supabase.co/storage/v1/object/public/productos'

describe('fotosDe', () => {
  it('tolera null, undefined y valores raros', () => {
    expect(fotosDe(null)).toEqual([])
    expect(fotosDe(undefined)).toEqual([])
    expect(fotosDe('x')).toEqual([])
    expect(fotosDe(['a', 3, 'b'])).toEqual(['a', 'b'])
  })
})

describe('chequearSubida', () => {
  it('acepta un caso válido', () => {
    expect(chequearSubida(0, 1000, 'image/jpeg').ok).toBe(true)
    expect(chequearSubida(3, 1000, 'image/heic').ok).toBe(true)
  })
  it('rechaza tipo, tamaño y límite de 4', () => {
    expect(chequearSubida(0, 1000, 'application/pdf')).toMatchObject({ ok: false, status: 400 })
    expect(chequearSubida(0, MAX_BYTES_FOTO + 1, 'image/png')).toMatchObject({ ok: false, status: 400 })
    expect(chequearSubida(0, 0, 'image/png')).toMatchObject({ ok: false, status: 400 })
    expect(chequearSubida(4, 1000, 'image/png')).toMatchObject({ ok: false, status: 409 })
  })
})

describe('esPermutacion', () => {
  it('acepta reordenaciones', () => {
    expect(esPermutacion(['a', 'b', 'c'], ['c', 'a', 'b'])).toBe(true)
    expect(esPermutacion([], [])).toBe(true)
  })
  it('rechaza faltantes, extras, repetidos y no-arrays', () => {
    expect(esPermutacion(['a', 'b'], ['a'])).toBe(false)
    expect(esPermutacion(['a', 'b'], ['a', 'b', 'c'])).toBe(false)
    expect(esPermutacion(['a', 'b'], ['a', 'a'])).toBe(false)
    expect(esPermutacion(['a', 'b'], ['a', 'x'])).toBe(false)
    expect(esPermutacion(['a'], 'a')).toBe(false)
    expect(esPermutacion(['a'], [1])).toBe(false)
  })
})

describe('rutaStorageDeUrl', () => {
  it('extrae la ruta de una foto del producto', () => {
    expect(rutaStorageDeUrl(`${base}/fotos/${ID}/abc.jpg`, ID)).toBe(`fotos/${ID}/abc.jpg`)
  })
  it('rechaza otros productos, otras carpetas y URLs ajenas', () => {
    expect(rutaStorageDeUrl(`${base}/fotos/otro/abc.jpg`, ID)).toBeNull()
    expect(rutaStorageDeUrl(`${base}/${ID}.png`, ID)).toBeNull()
    expect(rutaStorageDeUrl('https://x.com/foo.jpg', ID)).toBeNull()
    expect(rutaStorageDeUrl('no-url', ID)).toBeNull()
  })
  it('rechaza path traversal y subcarpetas', () => {
    expect(rutaStorageDeUrl(`${base}/fotos/${ID}/..%2F..%2Fx.png`, ID)).toBeNull()
    expect(rutaStorageDeUrl(`${base}/fotos/${ID}/a/b.jpg`, ID)).toBeNull()
    expect(rutaStorageDeUrl(`${base}/fotos/${ID}/`, ID)).toBeNull()
  })
})
