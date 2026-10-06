// src/lib/flyers/layout.ts
// Geometría pura del flyer: cuántas filas/columnas y qué tamaño tiene cada tile.
import type { FormatoFlyer } from './params'

export const DIMENSIONES: Record<FormatoFlyer, { w: number; h: number }> = {
  cuadrado: { w: 1080, h: 1080 },
  historia: { w: 1080, h: 1920 }
}

export const PAD = 52
export const GAP = 24

/** Cantidad de tiles por fila, según formato y cantidad de productos. */
export function filasDeGrilla(formato: FormatoFlyer, n: number): number[] {
  const mapa: Record<FormatoFlyer, Record<number, number[]>> = {
    cuadrado: { 1: [1], 2: [2], 3: [2, 1], 4: [2, 2], 5: [3, 2], 6: [3, 3] },
    historia: { 1: [1], 2: [1, 1], 3: [2, 1], 4: [2, 2], 5: [2, 2, 1], 6: [2, 2, 2] }
  }
  return mapa[formato][n] ?? [Math.max(1, n)]
}

export interface Geometria {
  w: number
  h: number
  filas: number[]
  tileW: number
  tileH: number
  headerH: number
  cuponH: number
  footerH: number
  gridH: number
}

export function calcularGeometria(formato: FormatoFlyer, n: number, conCupon: boolean): Geometria {
  const { w, h } = DIMENSIONES[formato]
  const filas = filasDeGrilla(formato, n)
  const headerH = formato === 'historia' ? 250 : 170
  const cuponH = conCupon ? (formato === 'historia' ? 96 : 76) : 0
  const footerH = formato === 'historia' ? 110 : 76
  const secciones = 2 + (conCupon ? 1 : 0) // gaps entre header / grilla / (cupón) / pie
  const gridH = h - PAD * 2 - headerH - cuponH - footerH - GAP * secciones
  const maxCols = Math.max(...filas)
  const tileW = Math.floor((w - PAD * 2 - GAP * (maxCols - 1)) / maxCols)
  const tileH = Math.floor((gridH - GAP * (filas.length - 1)) / filas.length)
  return { w, h, filas, tileW, tileH, headerH, cuponH, footerH, gridH }
}

/** Tile ancho y bajo: imagen a la izquierda y texto a la derecha. */
export function esHorizontal(tileW: number, tileH: number): boolean {
  return tileW > tileH * 1.3
}

export function formatearPrecio(n: number): string {
  const redondeado = Math.round(n * 100) / 100
  const [ent, dec] = (Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(2)).split('.')
  const miles = ent.replace(/\B(?=(\d{3})+$)/g, '.')
  return `$${miles}${dec ? `,${dec}` : ''}`
}

/** Hostname sin esquema ni "www." para el pie del flyer. */
export function hostnameDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  }
}
