// src/lib/productos/fotos.ts
// Reglas puras de las fotos reales de un producto (sin I/O).

export const MAX_FOTOS = 4
export const MAX_BYTES_FOTO = 10 * 1024 * 1024 // 10 MB
export const BUCKET_PRODUCTOS = 'productos'

const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

/** Normaliza el valor de la columna: puede venir null/undefined si la migración no corrió. */
export function fotosDe(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : []
}

export function tipoFotoPermitido(tipo: string): boolean {
  return TIPOS_FOTO.includes(tipo.toLowerCase())
}

export type ChequeoSubida = { ok: true } | { ok: false; error: string; status: number }

export function chequearSubida(actuales: number, bytes: number, tipo: string): ChequeoSubida {
  if (!tipoFotoPermitido(tipo)) return { ok: false, error: 'Solo JPG, PNG, WebP o HEIC', status: 400 }
  if (bytes <= 0) return { ok: false, error: 'La imagen está vacía', status: 400 }
  if (bytes > MAX_BYTES_FOTO) return { ok: false, error: 'Imagen demasiado grande (máx 10 MB)', status: 400 }
  if (actuales >= MAX_FOTOS) return { ok: false, error: `Máximo ${MAX_FOTOS} fotos por producto`, status: 409 }
  return { ok: true }
}

/** `true` si `nuevo` es una reordenación de `actual` (mismos elementos, sin repetir ni agregar). */
export function esPermutacion(actual: string[], nuevo: unknown): nuevo is string[] {
  if (!Array.isArray(nuevo) || nuevo.length !== actual.length) return false
  if (!nuevo.every((u) => typeof u === 'string')) return false
  if (new Set(nuevo).size !== nuevo.length) return false
  const base = new Set(actual)
  return nuevo.every((u) => base.has(u))
}

export function prefijoFotos(productoId: string): string {
  return `fotos/${productoId}/`
}

/**
 * Ruta de storage a partir de la URL pública, solo si pertenece a `fotos/<productoId>/`
 * dentro del bucket `productos`. Devuelve null en cualquier otro caso (incluye intentos de path traversal).
 */
export function rutaStorageDeUrl(url: string, productoId: string): string | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const marca = `/storage/v1/object/public/${BUCKET_PRODUCTOS}/`
  const i = u.pathname.indexOf(marca)
  if (i === -1) return null
  let ruta: string
  try {
    ruta = decodeURIComponent(u.pathname.slice(i + marca.length))
  } catch {
    return null
  }
  const prefijo = prefijoFotos(productoId)
  if (!ruta.startsWith(prefijo)) return null
  const resto = ruta.slice(prefijo.length)
  if (!resto || resto.includes('/') || resto.includes('..')) return null
  return ruta
}
