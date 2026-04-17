'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { type CartItem } from '@/lib/types'

interface CartContextType {
  items: CartItem[]
  agregar: (item: Omit<CartItem, 'cantidad'>) => void
  quitar: (producto_id: string) => void
  cambiarCantidad: (producto_id: string, cantidad: number) => void
  vaciar: () => void
  total: number
  cantidad: number
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  justAdded: CartItem | null
}

const CartContext = createContext<CartContextType | null>(null)
const STORAGE_KEY = 'sano-carrito'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [justAdded, setJustAdded] = useState<CartItem | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const montado = useRef(false)

  // Cargar desde localStorage tras el mount (evita hydration mismatch)
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado) setItems(JSON.parse(guardado))
    } catch {}
    montado.current = true
  }, [])

  // Persistir en localStorage cuando cambian los items (solo tras el mount)
  useEffect(() => {
    if (!montado.current) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const agregar = useCallback((item: Omit<CartItem, 'cantidad'>) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.producto_id === item.producto_id)
      if (existe) {
        return prev.map((i) => (i.producto_id === item.producto_id ? { ...i, cantidad: i.cantidad + 1 } : i))
      }
      return [...prev, { ...item, cantidad: 1 }]
    })
    // Feedback visual: toast "agregado" que se oculta solo.
    // Forzar nuevo objeto (timestamp) garantiza que React monte de nuevo el toast
    // si el usuario agrega el mismo producto dos veces → se re-dispara la animación.
    setJustAdded({ ...item, cantidad: 1 })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setJustAdded(null), 3200)
  }, [])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const quitar = useCallback((producto_id: string) => {
    setItems((prev) => prev.filter((i) => i.producto_id !== producto_id))
  }, [])

  const cambiarCantidad = useCallback((producto_id: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((i) => i.producto_id !== producto_id))
    } else {
      setItems((prev) => prev.map((i) => (i.producto_id === producto_id ? { ...i, cantidad } : i)))
    }
  }, [])

  const vaciar = useCallback(() => setItems([]), [])

  const total = items.reduce((a, i) => a + i.precio * i.cantidad, 0)
  const cantidad = items.reduce((a, i) => a + i.cantidad, 0)

  return (
    <CartContext.Provider value={{ items, agregar, quitar, cambiarCantidad, vaciar, total, cantidad, isOpen, setIsOpen, justAdded }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
