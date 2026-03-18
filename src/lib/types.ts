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
  imagen_url: string | null
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

export type EstadoPedido = 'pendiente' | 'confirmado' | 'entregado' | 'cancelado'

export interface PedidoItem {
  id?: string
  producto_id: string | null
  producto_nombre: string
  producto_emoji: string | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type MetodoPago = 'transferencia' | 'deposito' | 'mercadopago'

export interface Pedido {
  id: string
  numero: number
  nombre: string
  telefono: string
  email?: string | null
  direccion: string
  notas: string | null
  metodo_pago: MetodoPago | null
  estado: EstadoPedido
  total: number
  created_at: string
  items?: PedidoItem[]
}

export interface CartItem {
  producto_id: string
  nombre: string
  emoji: string | null
  precio: number
  cantidad: number
}
