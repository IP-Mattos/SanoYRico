// src/app/dashboard/descuentos/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { type Cupon, type CuponTipo } from '@/lib/types'
import { DEFAULT_CONFIG, type PromoMontoConfig } from '@/lib/site-config'
import { normalizarCodigoCupon, leerPromoMonto } from '@/lib/pedidos/cupones'
import { enmascararTelefono } from '@/lib/pedidos/seguimiento'
import { isoALocal, localAIso } from '@/lib/fechas-local'
import { revalidateSiteConfig } from '@/app/actions/revalidate'
import { Loader2, Copy, Check, Sparkles, AlertCircle, Plus } from 'lucide-react'

const inp = 'w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c47c2b]'
const lbl = 'block text-xs font-medium text-[#3d2b1f] mb-1.5'

// Sin caracteres ambiguos (0/O, 1/I/L). 32 símbolos → sin sesgo al usar un byte aleatorio.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function sufijoAleatorio(largo = 4): string {
  const bytes = crypto.getRandomValues(new Uint8Array(largo))
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('')
}

function prefijoDeNombre(nombre: string): string {
  const palabra = nombre
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)[0]
    ?.toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
  return palabra || 'CUPON'
}

const FORM_INICIAL = {
  codigo: '',
  tipo: 'porcentaje' as CuponTipo,
  valor: '',
  vence: '',
  usos_max: '',
  telefono: '',
  personal: false
}

function descripcionCupon(c: Cupon): string {
  return c.tipo === 'porcentaje' ? `${c.valor}%` : `$${c.valor}`
}

function fechaCorta(iso: string | null): string {
  if (!iso) return 'Sin vencimiento'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' })
}

export default function DescuentosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [cupones, setCupones] = useState<Cupon[]>([])
  const [form, setForm] = useState(FORM_INICIAL)
  const [cliente, setCliente] = useState('')
  const [aviso, setAviso] = useState('')
  const telefonoRef = useRef<HTMLInputElement>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState<string | null>(null)
  const [promo, setPromo] = useState<PromoMontoConfig>(DEFAULT_CONFIG.promoMonto)
  const [guardandoPromo, setGuardandoPromo] = useState(false)
  const [promoGuardada, setPromoGuardada] = useState(false)
  const [errorPromo, setErrorPromo] = useState('')

  const cargar = async () => {
    const { data, error: err } = await supabase.from('cupones').select('*').order('created_at', { ascending: false })
    if (err) setError('No pudimos cargar los cupones. ¿Aplicaste la migración de descuentos?')
    setCupones((data as Cupon[] | null) ?? [])
  }

  useEffect(() => {
    ;(async () => {
      const [, { data: cfg }] = await Promise.all([
        cargar(),
        supabase.from('configuracion').select('valor').eq('clave', 'promoMonto').maybeSingle()
      ])
      if (cfg?.valor) setPromo(leerPromoMonto(cfg.valor))
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generarPersonal = () => {
    const codigo = `${prefijoDeNombre(cliente)}-${sufijoAleatorio()}`
    setForm((f) => ({ ...f, codigo, usos_max: '1', personal: true }))
    setError('')
    // El botón solo prepara el formulario: se avisa y se lleva el foco al dato que falta
    setAviso(`Código ${codigo} listo (1 uso). Completá el teléfono del cliente y el descuento, y tocá Crear cupón.`)
    telefonoRef.current?.focus()
    telefonoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const crear = async () => {
    setError('')
    setAviso('')
    const codigo = normalizarCodigoCupon(form.codigo)
    if (!codigo) return setError('El código solo puede tener letras, números, guiones y guiones bajos (máx. 40).')
    const valor = Number(form.valor)
    if (!(valor > 0)) return setError('El valor debe ser mayor a 0.')
    if (form.tipo === 'porcentaje' && valor > 100) return setError('El porcentaje no puede superar 100.')
    const usosMax = form.usos_max.trim() === '' ? null : Number(form.usos_max)
    if (usosMax !== null && !(Number.isInteger(usosMax) && usosMax > 0)) return setError('Los usos máximos deben ser un entero mayor a 0.')
    const telefono = form.telefono.trim()
    if (form.personal && !telefono) return setError('Un cupón personal necesita el teléfono del cliente.')
    if (telefono && telefono.replace(/\D/g, '').length < 8) return setError('El teléfono tiene que tener al menos 8 dígitos.')

    setGuardando(true)
    const { error: err } = await supabase.from('cupones').insert({
      codigo,
      tipo: form.tipo,
      valor,
      vence_at: localAIso(form.vence),
      usos_max: usosMax,
      telefono: telefono || null,
      activo: true
    })
    setGuardando(false)
    if (err) {
      setError(err.code === '23505' ? 'Ya existe un cupón con ese código.' : err.message)
      return
    }
    setForm(FORM_INICIAL)
    setCliente('')
    await cargar()
  }

  const alternarActivo = async (c: Cupon) => {
    const { error: err } = await supabase.from('cupones').update({ activo: !c.activo }).eq('codigo', c.codigo)
    if (err) return setError(err.message)
    await cargar()
  }

  const copiar = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(codigo)
      setTimeout(() => setCopiado(null), 1500)
    } catch {
      // Sin permiso de portapapeles: el código igual queda visible en la tabla
    }
  }

  const guardarPromo = async () => {
    setErrorPromo('')
    if (promo.activo && !(promo.pct > 0 && promo.pct <= 100)) return setErrorPromo('El porcentaje debe estar entre 1 y 100.')
    if (promo.minimo < 0) return setErrorPromo('El monto mínimo no puede ser negativo.')
    if (promo.desde && promo.hasta && promo.hasta <= promo.desde) return setErrorPromo('"Hasta" tiene que ser posterior a "Desde".')
    setGuardandoPromo(true)
    const { error: err } = await supabase.from('configuracion').upsert({ clave: 'promoMonto', valor: promo }, { onConflict: 'clave' })
    if (err) {
      setGuardandoPromo(false)
      return setErrorPromo(err.message)
    }
    await revalidateSiteConfig()
    setGuardandoPromo(false)
    setPromoGuardada(true)
    setTimeout(() => setPromoGuardada(false), 2500)
  }

  if (loading) {
    return (
      <div className='flex justify-center py-24'>
        <Loader2 className='h-6 w-6 animate-spin text-[#c47c2b]' />
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-2xl font-bold text-[#3d2b1f]'>Descuentos</h2>
        <p className='text-[#8a7060] text-sm mt-1'>
          Cupones y promo por monto. Se aplican solo a productos sin promo propia, y no se acumulan: gana el descuento mayor.
        </p>
      </div>

      {/* ── Promo por monto ── */}
      <section className='bg-white rounded-2xl border border-[#f0e6d3] p-5 space-y-4'>
        <div>
          <h3 className='font-bold text-[#3d2b1f]'>Promo por monto del pedido</h3>
          <p className='text-xs text-[#8a7060] mt-0.5'>
            Si el carrito llega al monto mínimo, se descuenta el porcentaje sobre los productos sin promo.
          </p>
        </div>
        <label className='flex items-center gap-3 text-sm text-[#3d2b1f]'>
          <input
            type='checkbox'
            checked={promo.activo}
            onChange={(e) => setPromo((p) => ({ ...p, activo: e.target.checked }))}
            className='w-4 h-4 accent-[#c47c2b]'
          />
          Promo activa
        </label>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          <div>
            <label className={lbl}>Monto mínimo ($)</label>
            <input type='number' min={0} step={100} className={inp} value={promo.minimo} onChange={(e) => setPromo((p) => ({ ...p, minimo: Math.max(0, Number(e.target.value) || 0) }))} />
          </div>
          <div>
            <label className={lbl}>Descuento (%)</label>
            <input type='number' min={1} max={100} className={inp} value={promo.pct} onChange={(e) => setPromo((p) => ({ ...p, pct: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className={lbl}>Desde (opcional)</label>
            <input type='datetime-local' className={inp} value={isoALocal(promo.desde)} onChange={(e) => setPromo((p) => ({ ...p, desde: localAIso(e.target.value) ?? '' }))} />
          </div>
          <div>
            <label className={lbl}>Hasta (opcional)</label>
            <input type='datetime-local' className={inp} value={isoALocal(promo.hasta)} onChange={(e) => setPromo((p) => ({ ...p, hasta: localAIso(e.target.value) ?? '' }))} />
          </div>
        </div>
        {errorPromo && (
          <p className='flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl'>
            <AlertCircle className='h-4 w-4 shrink-0' />
            {errorPromo}
          </p>
        )}
        <button
          onClick={guardarPromo}
          disabled={guardandoPromo}
          className='inline-flex items-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60'
        >
          {guardandoPromo && <Loader2 className='h-4 w-4 animate-spin' />}
          {promoGuardada ? '✓ Guardado' : 'Guardar promo'}
        </button>
      </section>

      {/* ── Nuevo cupón ── */}
      <section className='bg-white rounded-2xl border border-[#f0e6d3] p-5 space-y-4'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h3 className='font-bold text-[#3d2b1f]'>Nuevo cupón</h3>
            <p className='text-xs text-[#8a7060] mt-0.5'>El código se guarda en mayúsculas. Con teléfono, solo lo puede usar ese cliente.</p>
          </div>
          <div className='flex items-end gap-2'>
            <div>
              <label className={lbl}>Cliente (para el código)</label>
              <input className={inp} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder='Ej: María' />
            </div>
            <button
              type='button'
              onClick={generarPersonal}
              className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fef3d0] text-[#8a5a1a] text-sm font-medium hover:bg-[#c47c2b] hover:text-white transition-colors whitespace-nowrap'
            >
              <Sparkles className='h-4 w-4' />
              Generar cupón personal
            </button>
          </div>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          <div className='col-span-2 sm:col-span-1'>
            <label className={lbl}>Código *</label>
            <input
              className={`${inp} uppercase font-mono`}
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
              placeholder='VERANO10'
              maxLength={40}
            />
          </div>
          <div>
            <label className={lbl}>Tipo</label>
            <select className={inp} value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as CuponTipo }))}>
              <option value='porcentaje'>Porcentaje (%)</option>
              <option value='monto'>Monto fijo ($)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Valor *</label>
            <input type='number' min={1} className={inp} value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} placeholder={form.tipo === 'porcentaje' ? '10' : '300'} />
          </div>
          <div>
            <label className={lbl}>Vence (opcional)</label>
            <input type='datetime-local' className={inp} value={form.vence} onChange={(e) => setForm((f) => ({ ...f, vence: e.target.value }))} />
          </div>
          <div>
            <label className={lbl}>Usos máximos (opcional)</label>
            <input type='number' min={1} step={1} className={inp} value={form.usos_max} onChange={(e) => setForm((f) => ({ ...f, usos_max: e.target.value }))} placeholder='Ilimitado' />
          </div>
          <div>
            <label className={lbl}>Teléfono del cliente {form.personal ? '*' : '(opcional)'}</label>
            <input ref={telefonoRef} type='tel' className={inp} value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} placeholder='099 123 456' />
          </div>
        </div>

        {aviso && !error && (
          <p role='status' className='flex items-center gap-2 text-sm text-green-800 bg-green-50 px-4 py-2.5 rounded-xl'>
            <Sparkles className='h-4 w-4 shrink-0' />
            {aviso}
          </p>
        )}
        {error && (
          <p role='alert' className='flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl'>
            <AlertCircle className='h-4 w-4 shrink-0' />
            {error}
          </p>
        )}
        <button
          onClick={crear}
          disabled={guardando}
          className='inline-flex items-center gap-2 bg-[#3d2b1f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60'
        >
          {guardando ? <Loader2 className='h-4 w-4 animate-spin' /> : <Plus className='h-4 w-4' />}
          Crear cupón
        </button>
      </section>

      {/* ── Lista ── */}
      <section className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
        <div className='px-5 py-4 border-b border-[#f0e6d3]'>
          <h3 className='font-bold text-[#3d2b1f]'>Cupones ({cupones.length})</h3>
        </div>
        {cupones.length === 0 ? (
          <p className='px-5 py-10 text-center text-sm text-[#8a7060]'>Todavía no creaste cupones.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-[#faf6ef] border-b border-[#f0e6d3] text-left text-xs font-semibold text-[#8a7060] uppercase tracking-wider'>
                  <th className='px-5 py-3'>Código</th>
                  <th className='px-5 py-3'>Descuento</th>
                  <th className='px-5 py-3'>Usos</th>
                  <th className='px-5 py-3'>Vence</th>
                  <th className='px-5 py-3'>Teléfono</th>
                  <th className='px-5 py-3'>Activo</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[#f0e6d3]'>
                {cupones.map((c) => (
                  <tr key={c.codigo} className={c.activo ? '' : 'opacity-60'}>
                    <td className='px-5 py-3'>
                      <span className='inline-flex items-center gap-2'>
                        <span className='font-mono font-semibold text-[#3d2b1f]'>{c.codigo}</span>
                        <button
                          type='button'
                          onClick={() => copiar(c.codigo)}
                          aria-label={`Copiar código ${c.codigo}`}
                          className='text-[#c47c2b] hover:text-[#8a5a1a]'
                        >
                          {copiado === c.codigo ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                        </button>
                      </span>
                    </td>
                    <td className='px-5 py-3 text-[#3d2b1f]'>{descripcionCupon(c)}</td>
                    <td className='px-5 py-3 text-[#3d2b1f]'>
                      {c.usos} / {c.usos_max ?? '∞'}
                    </td>
                    <td className='px-5 py-3 text-[#8a7060]'>{fechaCorta(c.vence_at)}</td>
                    <td className='px-5 py-3 text-[#8a7060] font-mono'>{c.telefono ? enmascararTelefono(c.telefono) : '—'}</td>
                    <td className='px-5 py-3'>
                      <button
                        type='button'
                        role='switch'
                        aria-checked={c.activo}
                        aria-label={`${c.activo ? 'Desactivar' : 'Activar'} cupón ${c.codigo}`}
                        onClick={() => alternarActivo(c)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${c.activo ? 'bg-[#4a6741]' : 'bg-[#d9cdbd]'}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${c.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
