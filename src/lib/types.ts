// src/lib/types.ts
export type Categoria = 'barrita' | 'mix' | 'alfajor'

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  categoria: Categoria
  precio: number
  costo: number
  stock: number
  stock_minimo: number
  emoji: string | null
  badge: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Venta {
  id: string
  producto_id: string | null
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  costo_unitario: number
  total: number
  ganancia: number
  fecha: string
}

export interface MovimientoStock {
  id: string
  producto_id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  motivo: string | null
  fecha: string
}
