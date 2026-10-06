// src/lib/pedidos/seguimiento.ts
// Helpers puros del seguimiento público: interpretación de la búsqueda y enmascarado de datos personales.

export type BusquedaSeguimiento =
  | { tipo: 'numero'; numero: number }
  | { tipo: 'telefono'; digitos: string }
  | { tipo: 'invalida' }

export const MIN_DIGITOS_TELEFONO = 8

// Deja solo dígitos y quita prefijo de país (598) y 0 inicial, para comparar formatos distintos.
export function normalizarTelefono(valor: string): string {
  return valor.replace(/\D/g, '').replace(/^598/, '').replace(/^0+/, '')
}

export function interpretarBusqueda(q: string): BusquedaSeguimiento {
  const v = q.trim()
  if (!v || v.length > 40) return { tipo: 'invalida' }
  if (/^\d{1,6}$/.test(v)) return { tipo: 'numero', numero: parseInt(v, 10) }
  const crudos = v.replace(/\D/g, '')
  if (crudos.length < MIN_DIGITOS_TELEFONO) return { tipo: 'invalida' }
  const digitos = normalizarTelefono(v)
  if (!digitos) return { tipo: 'invalida' }
  return { tipo: 'telefono', digitos }
}

export function telefonoCoincide(guardado: string | null | undefined, digitos: string): boolean {
  return !!guardado && normalizarTelefono(guardado) === digitos
}

export function primerNombre(nombre: string | null | undefined): string {
  return (nombre ?? '').trim().split(/\s+/)[0] ?? ''
}

export function enmascararTelefono(telefono: string | null | undefined): string {
  const d = (telefono ?? '').replace(/\D/g, '')
  return d.length > 3 ? `${'•'.repeat(Math.min(d.length - 3, 6))}${d.slice(-3)}` : ''
}
