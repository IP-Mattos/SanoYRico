// src/lib/flyers/assets.ts
// Carga de fuentes, logo e imágenes de producto para el flyer (solo servidor).
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export interface FuenteFlyer {
  name: string
  data: ArrayBuffer
  weight: 400 | 600 | 700
  style: 'normal'
}

const FUENTES = [
  { name: 'Playfair Display', archivo: 'playfair-display-700.woff', weight: 700 },
  { name: 'DM Sans', archivo: 'dm-sans-400.woff', weight: 400 },
  { name: 'DM Sans', archivo: 'dm-sans-600.woff', weight: 600 }
] as const

function aArrayBuffer(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
}

/** Lee un archivo de /public del disco; si el bundle no lo incluye, lo pide al propio sitio. */
async function leerPublico(rel: string, origin?: string): Promise<Buffer> {
  try {
    return await readFile(path.join(process.cwd(), 'public', ...rel.split('/')))
  } catch (err) {
    if (!origin) throw err
    const res = await fetch(`${origin}/${rel}`)
    if (!res.ok) throw new Error(`No se pudo cargar ${rel} (${res.status})`)
    return Buffer.from(await res.arrayBuffer())
  }
}

export async function cargarFuentes(origin?: string): Promise<FuenteFlyer[]> {
  return Promise.all(
    FUENTES.map(async (f) => ({
      name: f.name,
      weight: f.weight,
      style: 'normal' as const,
      data: aArrayBuffer(await leerPublico(`fonts/${f.archivo}`, origin))
    }))
  )
}

export async function cargarLogo(origin?: string): Promise<string> {
  const buf = await leerPublico('logo-sano-y-rico.png', origin)
  return `data:image/png;base64,${buf.toString('base64')}`
}

const MAX_BYTES = 5 * 1024 * 1024

/** Solo imágenes del bucket público de Supabase Storage (evita SSRF con URLs arbitrarias). */
function urlPermitida(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' && u.hostname.endsWith('.supabase.co') && u.pathname.startsWith('/storage/v1/object/public/')
  } catch {
    return false
  }
}

/** Devuelve la imagen como data URI si es PNG/JPEG; null (→ emoji) en cualquier otro caso. */
export async function cargarImagenProducto(url: string | null): Promise<string | null> {
  if (!url || !urlPermitida(url)) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0 || buf.length > MAX_BYTES) return null
    const esPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
    const esJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    if (!esPng && !esJpg) return null // WebP/AVIF/etc.: Satori no los renderiza de forma confiable
    return `data:${esPng ? 'image/png' : 'image/jpeg'};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}
