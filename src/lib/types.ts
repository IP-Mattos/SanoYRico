// src/lib/types.ts
export type Categoria = string

export interface CategoriaDB {
  id: string
  nombre: string
  slug: string
  icono: string
  orden: number
  activo: boolean
  created_at: string
}

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
  descuento_pct?: number | null
  descuento_desde?: string | null
  descuento_hasta?: string | null
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
  precio_lista?: number | null
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
  subtotal?: number | null
  descuento?: number | null
  cupon_codigo?: string | null
  descuento_tipo?: DescuentoTipo | null
  created_at: string
  items?: PedidoItem[]
}

export type DescuentoTipo = 'cupon' | 'monto'

export type CuponTipo = 'porcentaje' | 'monto'

export interface Cupon {
  id?: string
  codigo: string
  tipo: CuponTipo
  valor: number
  vence_at: string | null
  usos_max: number | null
  usos: number
  telefono: string | null
  activo: boolean
  created_at?: string
}

export interface CartItem {
  producto_id: string
  nombre: string
  emoji: string | null
  precio: number
  cantidad: number
}
