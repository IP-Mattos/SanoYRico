// src/app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lock, Mail, Loader2, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react'

const MAX_INTENTOS = 5
const COOLDOWN_MS = 30_000

const input =
  'w-full h-12 pl-11 pr-4 rounded-xl border border-[#e8dcc8] bg-[#fdfbf7] text-[15px] text-[#3d2b1f] placeholder:text-[#b3a393] transition-colors focus:outline-none focus:bg-white focus:border-[#c47c2b] focus:ring-4 focus:ring-[#c47c2b]/15 disabled:opacity-50'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [intentos, setIntentos] = useState(0)
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null)
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Countdown cuando está bloqueado
  useEffect(() => {
    if (bloqueadoHasta === null) return
    const tick = () => {
      const remaining = Math.ceil((bloqueadoHasta - Date.now()) / 1000)
      if (remaining <= 0) {
        setBloqueadoHasta(null)
        setIntentos(0)
        setSegundosRestantes(0)
        setError('')
      } else {
        setSegundosRestantes(remaining)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [bloqueadoHasta])

  const bloqueado = segundosRestantes > 0

  const handleLogin = async () => {
    if (bloqueado) return
    if (!email.trim() || !password.trim()) {
      setError('Completá tu email y contraseña')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const nuevosIntentos = intentos + 1
      setIntentos(nuevosIntentos)
      if (nuevosIntentos >= MAX_INTENTOS) {
        setBloqueadoHasta(Date.now() + COOLDOWN_MS)
        setError('Demasiados intentos. Esperá 30 segundos.')
      } else {
        setError(`Email o contraseña incorrectos (intento ${nuevosIntentos}/${MAX_INTENTOS})`)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className='min-h-screen bg-[#faf6ef] lg:grid lg:grid-cols-[1.05fr_1fr]'>
      {/* Panel de marca (desktop) */}
      <aside className='relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#3d2b1f] text-white p-12 xl:p-16'>
        <div
          className='absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-[#c47c2b]/20 blur-3xl pointer-events-none'
          aria-hidden='true'
        />
        <div className='relative flex items-center gap-3'>
          <Image src='/logo-sano-y-rico-v2.png' alt='' width={40} height={40} className='h-10 w-10' />
          <span className='text-xl font-bold' style={{ fontFamily: 'var(--display)' }}>
            Sano y <span className='italic text-[#e8a832]'>Rico</span>
          </span>
        </div>

        <div className='relative flex flex-col items-center text-center'>
          <div className='relative flex items-center justify-center'>
            <div className='absolute w-[26rem] h-[26rem] rounded-full border border-white/10 animate-breathe' aria-hidden='true' />
            <div className='absolute w-[34rem] h-[34rem] rounded-full border border-white/5 animate-breathe [animation-delay:-3.5s]' aria-hidden='true' />
            <Image
              src='/logo-sano-y-rico-v2.png'
              alt='Sano y Rico'
              width={1178}
              height={1178}
              priority
              className='relative w-64 xl:w-72 h-auto animate-float-soft filter-[drop-shadow(0_24px_32px_rgba(0,0,0,0.35))]'
            />
          </div>
          <h2 className='mt-12 text-4xl xl:text-5xl font-bold leading-tight' style={{ fontFamily: 'var(--display)' }}>
            Tu tienda, <span className='italic text-[#e8a832]'>en orden</span>
          </h2>
          <p className='mt-3 max-w-sm text-white/75 text-[15px] leading-relaxed'>
            Pedidos, stock, descuentos y flyers en un solo lugar.
          </p>
        </div>

        <p className='relative text-xs text-white/50'>© {new Date().getFullYear()} Sano y Rico · Industria uruguaya</p>
      </aside>

      {/* Formulario */}
      <main className='flex flex-col min-h-screen lg:min-h-0 lg:items-center lg:justify-center lg:px-5 lg:py-10'>
        {/* Cabecera de marca (mobile/tablet): misma identidad que el panel de desktop */}
        <header className='lg:hidden relative overflow-hidden bg-[#3d2b1f] text-white px-6 pt-10 pb-16 flex flex-col items-center text-center'>
          <div
            className='absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-[#c47c2b]/25 blur-3xl pointer-events-none'
            aria-hidden='true'
          />
          <div className='relative flex items-center justify-center'>
            <div className='absolute w-56 h-56 rounded-full border border-white/10 animate-breathe' aria-hidden='true' />
            <div className='absolute w-72 h-72 rounded-full border border-white/5 animate-breathe [animation-delay:-3.5s]' aria-hidden='true' />
            <Image
              src='/logo-sano-y-rico-v2.png'
              alt='Sano y Rico'
              width={1178}
              height={1178}
              priority
              className='relative w-36 h-auto animate-float-soft filter-[drop-shadow(0_18px_24px_rgba(0,0,0,0.35))]'
            />
          </div>
          <p className='relative mt-6 text-2xl font-bold' style={{ fontFamily: 'var(--display)' }}>
            Tu tienda, <span className='italic text-[#e8a832]'>en orden</span>
          </p>
        </header>

        <div className='relative -mt-8 lg:mt-0 flex-1 lg:flex-none w-full lg:max-w-sm bg-[#faf6ef] rounded-t-3xl lg:rounded-none px-6 pt-8 pb-10 lg:p-0 sm:px-10 shadow-[0_-12px_30px_-18px_rgba(61,43,31,0.5)] lg:shadow-none'>
          <div className='w-full max-w-sm mx-auto'>

          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#a8661f]'>Panel de administración</p>
          <h1 className='mt-2 text-3xl sm:text-4xl font-bold text-[#3d2b1f]' style={{ fontFamily: 'var(--display)' }}>
            Hola de nuevo
          </h1>
          <p className='mt-2 text-[15px] text-[#6e5746]'>Ingresá con tu cuenta para gestionar la tienda.</p>

          <form
            className='mt-8 space-y-5'
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
          >
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-[#3d2b1f] mb-2'>
                Email
              </label>
              <div className='relative'>
                <Mail className='absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#8a7060]' aria-hidden='true' />
                <input
                  id='email'
                  type='email'
                  autoComplete='email'
                  inputMode='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={bloqueado}
                  placeholder='admin@sanoyrico.com'
                  className={input}
                />
              </div>
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-[#3d2b1f] mb-2'>
                Contraseña
              </label>
              <div className='relative'>
                <Lock className='absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#8a7060]' aria-hidden='true' />
                <input
                  id='password'
                  type={verPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={bloqueado}
                  placeholder='••••••••'
                  className={`${input} pr-12`}
                />
                <button
                  type='button'
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verPassword}
                  className='absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-lg text-[#8a7060] hover:text-[#3d2b1f] hover:bg-[#f0e6d3]/60 transition-colors'
                >
                  {verPassword ? <EyeOff className='h-[18px] w-[18px]' /> : <Eye className='h-[18px] w-[18px]' />}
                </button>
              </div>
            </div>

            {error && (
              <div role='alert' className='flex gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3 rounded-xl'>
                <AlertCircle className='h-4 w-4 mt-0.5 shrink-0' aria-hidden='true' />
                <p>
                  {error}
                  {bloqueado && segundosRestantes > 0 && (
                    <span className='block text-xs mt-0.5 font-medium'>{segundosRestantes}s restantes</span>
                  )}
                </p>
              </div>
            )}

            <button
              type='submit'
              disabled={loading || bloqueado}
              className='group w-full h-12 bg-[#3d2b1f] text-white rounded-xl text-[15px] font-semibold shadow-[0_10px_24px_-10px_rgba(61,43,31,0.6)] hover:bg-[#2e2017] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading && <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />}
              {bloqueado ? `Bloqueado (${segundosRestantes}s)` : loading ? 'Entrando...' : 'Entrar al panel'}
            </button>
          </form>

          <Link
            href='/'
            className='mt-8 inline-flex items-center gap-1.5 text-sm text-[#6e5746] hover:text-[#3d2b1f] transition-colors'
          >
            <ArrowLeft className='h-4 w-4' aria-hidden='true' /> Volver a la tienda
          </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
