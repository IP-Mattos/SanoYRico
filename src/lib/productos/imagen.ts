// src/lib/productos/imagen.ts
// Procesamiento de imágenes de fotos reales con sharp.
import sharp from 'sharp'

/** Orienta por EXIF y limita a 1600px de lado mayor. Salida JPEG (liviana para mandar a Replicate). */
export async function normalizarFoto(entrada: Buffer): Promise<Buffer> {
  return sharp(entrada, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 88 })
    .toBuffer()
}

/** Foto final sin recorte de fondo: JPEG q82, sin metadata. */
export async function fotoJpeg(normalizada: Buffer): Promise<Buffer> {
  return sharp(normalizada).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
}

/** Recorte con transparencia: quita márgenes transparentes, máx. 1200px, PNG comprimido al máximo. */
export async function recortePng(conAlfa: Buffer): Promise<Buffer> {
  return sharp(conAlfa)
    .ensureAlpha()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer()
}
