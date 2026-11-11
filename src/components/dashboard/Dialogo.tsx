// src/components/dashboard/Dialogo.tsx
// Reemplazo de window.confirm / window.alert con un modal propio del panel.
// Uso: const { confirmar, avisar } = useDialogo(); if (!(await confirmar({ mensaje: '¿Eliminar?' }))) return
'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertCircle, Trash2 } from 'lucide-react'

type OpcionesConfirmar = {
  mensaje: string
  titulo?: string
  confirmar?: string
  cancelar?: string
  /** Botón rojo para acciones destructivas */
  peligro?: boolean
}
type OpcionesAvisar = { mensaje: string; titulo?: string; boton?: string }

type Pedido =
  | ({ tipo: 'confirmar' } & OpcionesConfirmar & { resolver: (ok: boolean) => void })
  | ({ tipo: 'avisar' } & OpcionesAvisar & { resolver: () => void })

type Api = {
  confirmar: (o: OpcionesConfirmar) => Promise<boolean>
  avisar: (o: OpcionesAvisar) => Promise<void>
}

const DialogoContext = createContext<Api | null>(null)

export function useDialogo(): Api {
  const api = useContext(DialogoContext)
  if (!api) throw new Error('useDialogo debe usarse dentro de <DialogoProvider>')
  return api
}

export function DialogoProvider({ children }: { children: React.ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)

  const confirmar = useCallback(
    (o: OpcionesConfirmar) => new Promise<boolean>((resolver) => setPedido({ tipo: 'confirmar', ...o, resolver })),
    []
  )
  const avisar = useCallback(
    (o: OpcionesAvisar) => new Promise<void>((resolver) => setPedido({ tipo: 'avisar', ...o, resolver })),
    []
  )

  const cerrar = useCallback(
    (ok: boolean) => {
      if (!pedido) return
      if (pedido.tipo === 'confirmar') pedido.resolver(ok)
      else pedido.resolver()
      setPedido(null)
    },
    [pedido]
  )

  return (
    <DialogoContext.Provider value={{ confirmar, avisar }}>
      {children}
      {pedido && <Modal pedido={pedido} onCerrar={cerrar} />}
    </DialogoContext.Provider>
  )
}

function Modal({ pedido, onCerrar }: { pedido: Pedido; onCerrar: (ok: boolean) => void }) {
  const principal = useRef<HTMLButtonElement>(null)
  const peligro = pedido.tipo === 'confirmar' && pedido.peligro

  useEffect(() => {
    principal.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onCerrar(false)
      }
    }
    // captura: que Escape cierre este diálogo y no el modal que está debajo
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCerrar])

  const titulo = pedido.titulo ?? (pedido.tipo === 'confirmar' ? 'Confirmar' : 'Aviso')
  const Icono = peligro ? Trash2 : AlertCircle

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4' onClick={() => onCerrar(false)}>
      <div
        role={pedido.tipo === 'confirmar' ? 'alertdialog' : 'dialog'}
        aria-modal='true'
        aria-labelledby='dialogo-titulo'
        aria-describedby='dialogo-mensaje'
        className='bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-start gap-3'>
          <span
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${
              peligro ? 'bg-red-50 text-red-500' : 'bg-[#faf6ef] text-[#c47c2b]'
            }`}
          >
            <Icono className='h-5 w-5' />
          </span>
          <div className='pt-0.5'>
            <h3 id='dialogo-titulo' className='font-bold text-[#3d2b1f]'>{titulo}</h3>
            <p id='dialogo-mensaje' className='text-sm text-[#8a7060] mt-1'>{pedido.mensaje}</p>
          </div>
        </div>
        <div className='flex justify-end gap-2'>
          {pedido.tipo === 'confirmar' && (
            <button
              type='button'
              onClick={() => onCerrar(false)}
              className='h-10 px-4 rounded-xl border border-[#dccbb0] bg-white text-sm font-medium text-[#3d2b1f] hover:border-[#c47c2b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b]'
            >
              {pedido.cancelar ?? 'Cancelar'}
            </button>
          )}
          <button
            ref={principal}
            type='button'
            onClick={() => onCerrar(true)}
            className={`h-10 px-4 rounded-xl text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              peligro ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-500' : 'bg-[#3d2b1f] hover:bg-[#2a1d14] focus-visible:ring-[#c47c2b]'
            }`}
          >
            {pedido.tipo === 'confirmar' ? (pedido.confirmar ?? 'Aceptar') : (pedido.boton ?? 'Entendido')}
          </button>
        </div>
      </div>
    </div>
  )
}
