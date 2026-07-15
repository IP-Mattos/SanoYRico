// src/lib/whatsapp.ts
// Normalización de teléfonos uruguayos, links wa.me y plantillas de mensajes.
// El copy de los mensajes vive acá para no duplicarlo entre carrito, seguimiento y dashboard.

import { type EstadoPedido } from '@/lib/types'

// Convierte formatos habituales (099 123 456, +598 99 123 456, 0059899123456)
// a dígitos con código de país: "59899123456". Devuelve null si no parece un móvil UY.
export function normalizarTelefonoUY(telefono: string): string | null {
  let digitos = telefono.replace(/\D/g, '')
  // El orden importa: "0059899123456" debe quedar en "59899123456" (sacar 00 ANTES que 598)
  if (digitos.startsWith('00')) digitos = digitos.slice(2)
  if (digitos.startsWith('598')) digitos = digitos.slice(3)
  if (digitos.startsWith('0')) digitos = digitos.slice(1)
  // "059899123456" recién acá queda en "59899123456" — re-chequear el prefijo 598
  if (digitos.startsWith('598') && digitos.length > 9) digitos = digitos.slice(3)
  // Móvil UY: exactamente 8 dígitos empezando en 9 (09x xxx xxx sin el 0)
  if (!/^9\d{7}$/.test(digitos)) return null
  return `598${digitos}`
}

export function linkWhatsApp(telefono: string, mensaje: string): string | null {
  const numero = normalizarTelefonoUY(telefono)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

// ── Plantillas de mensajes ──────────────────────────────────────────────────

const METODO_LABEL: Record<string, string> = {
  transferencia: 'transferencia',
  deposito: 'depósito'
}

// Mensaje del CLIENTE al negocio: envía el comprobante del pago manual.
export function mensajeComprobante(numero: number, total: number, metodo: string): string {
  const label = METODO_LABEL[metodo] ?? metodo
  return `Hola! Hice el pedido #${numero} por $${total} (${label}). Te envío el comprobante del pago.`
}

// Mensaje del NEGOCIO al cliente: aviso de pedido confirmado.
// Para transferencia/depósito menciona que el comprobante fue recibido.
export function mensajeConfirmacion(
  nombre: string,
  total: number,
  esTransferencia: boolean,
  rastreo?: string
): string {
  const base = esTransferencia
    ? `Hola ${nombre}! Recibimos tu comprobante y tu pedido de Sano y Rico ya está confirmado. Total: $${total}.`
    : `Hola ${nombre}! Tu pedido de Sano y Rico fue confirmado. Total: $${total}.`
  const conRastreo = rastreo ? `${base} Número de rastreo: ${rastreo}.` : base
  return `${conRastreo} ¡Gracias por elegirnos! 🤗`
}

// Mensaje del NEGOCIO al cliente según el estado actual del pedido.
export function mensajeEstadoCliente(
  nombre: string,
  numero: number,
  total: number,
  estado: EstadoPedido,
  esTransferencia: boolean
): string {
  switch (estado) {
    case 'pendiente':
      return esTransferencia
        ? `Hola ${nombre}! Recibimos tu pedido #${numero} de Sano y Rico. Cuando puedas, envianos el comprobante del pago por acá así lo confirmamos.`
        : `Hola ${nombre}! Te escribimos por tu pedido #${numero} de Sano y Rico.`
    case 'confirmado':
      return mensajeConfirmacion(nombre, total, esTransferencia)
    case 'entregado':
      return `Hola ${nombre}! Tu pedido #${numero} de Sano y Rico fue entregado. ¡Gracias por elegirnos! 🌿`
    case 'cancelado':
      return `Hola ${nombre}! Tu pedido #${numero} de Sano y Rico fue cancelado. Escribinos si tenés alguna duda.`
  }
}
