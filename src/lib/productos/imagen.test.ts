import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { fotoJpeg, normalizarFoto, recortePng } from './imagen'

const rojo = { r: 200, g: 30, b: 30 }

describe('imagen', () => {
  it('normalizarFoto limita el lado mayor a 1600 y devuelve JPEG', async () => {
    const grande = await sharp({ create: { width: 3200, height: 1600, channels: 3, background: rojo } }).png().toBuffer()
    const out = await normalizarFoto(grande)
    const m = await sharp(out).metadata()
    expect(m.format).toBe('jpeg')
    expect(m.width).toBe(1600)
    expect(m.height).toBe(800)
  })

  it('fotoJpeg produce JPEG', async () => {
    const buf = await sharp({ create: { width: 50, height: 50, channels: 3, background: rojo } }).jpeg().toBuffer()
    expect((await sharp(await fotoJpeg(buf)).metadata()).format).toBe('jpeg')
  })

  it('recortePng quita márgenes transparentes y conserva el alfa', async () => {
    const objeto = await sharp({ create: { width: 100, height: 60, channels: 4, background: { ...rojo, alpha: 1 } } }).png().toBuffer()
    const lienzo = await sharp({ create: { width: 400, height: 400, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: objeto, left: 150, top: 170 }])
      .png()
      .toBuffer()
    const out = await recortePng(lienzo)
    const m = await sharp(out).metadata()
    expect(m.format).toBe('png')
    expect(m.hasAlpha).toBe(true)
    expect(m.width).toBe(100)
    expect(m.height).toBe(60)
  })

  it('recortePng limita a 1200px', async () => {
    const ancho = await sharp({ create: { width: 2400, height: 600, channels: 4, background: { ...rojo, alpha: 1 } } }).png().toBuffer()
    const m = await sharp(await recortePng(ancho)).metadata()
    expect(m.width).toBe(1200)
    expect(m.height).toBe(300)
  })
})
