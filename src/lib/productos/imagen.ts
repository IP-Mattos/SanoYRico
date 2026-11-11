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

/**
 * Estampa el logo abajo a la derecha (17% del lado menor, con sombra suave). Se hace con sharp y no con IA
 * para que el logo salga siempre nítido e idéntico. Devuelve JPEG q82 del mismo tamaño.
 */
export async function estamparLogo(foto: Buffer, logo: Buffer): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(foto).metadata()
  const lado = Math.round(Math.min(width, height) * 0.17)
  const margen = Math.round(lado * 0.18)
  const logoChico = await sharp(logo).resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  const sombra = await sharp(logoChico)
    .ensureAlpha()
    .linear([0, 0, 0, 0.35], [0, 0, 0, 0])
    .blur(Math.max(0.3, lado * 0.04))
    .png()
    .toBuffer()
  const left = width - lado - margen
  const top = height - lado - margen
  return sharp(foto)
    .composite([
      { input: sombra, left: left + 2, top: top + 4 },
      { input: logoChico, left, top }
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
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
