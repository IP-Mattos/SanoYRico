import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { estamparLogo, fotoJpeg, normalizarFoto, recortePng } from './imagen'

const rojo = { r: 200, g: 30, b: 30 }

async function pixel(buf: Buffer, x: number, y: number) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const i = (y * info.width + x) * info.channels
  return { r: data[i], g: data[i + 1], b: data[i + 2] }
}

describe('estamparLogo', () => {
  it('pone el logo abajo a la derecha (17% del lado menor) sin tocar el resto ni el tamaño', async () => {
    const foto = await sharp({ create: { width: 1000, height: 800, channels: 3, background: rojo } }).jpeg({ quality: 100 }).toBuffer()
    const logo = await sharp({ create: { width: 300, height: 300, channels: 4, background: { r: 0, g: 200, b: 0, alpha: 1 } } }).png().toBuffer()
    const out = await estamparLogo(foto, logo)
    const m = await sharp(out).metadata()
    expect(m.format).toBe('jpeg')
    expect([m.width, m.height]).toEqual([1000, 800])
    // logo de 136px (17% de 800) con margen de 24px: su centro cae en (1000-24-68, 800-24-68)
    const enLogo = await pixel(out, 908, 708)
    expect(enLogo.g).toBeGreaterThan(150)
    expect(enLogo.r).toBeLessThan(60)
    const fuera = await pixel(out, 100, 100)
    expect(fuera.r).toBeGreaterThan(170)
    expect(fuera.g).toBeLessThan(60)
  })
})

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
