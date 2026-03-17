// src/app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lock, Mail, Loader2 } from 'lucide-react'

const MAX_INTENTOS = 5
const COOLDOWN_MS = 30_000

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className='min-h-screen bg-[#faf6ef] flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        {/* Logo */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-[#3d2b1f]'>
            Sano y <span className='text-[#c47c2b] italic'>Rico</span>
          </h1>
          <p className='text-[#8a7060] mt-2 text-sm'>Panel de administración</p>
        </div>

        {/* Card */}
        <div className='bg-white rounded-2xl shadow-sm border border-[#f0e6d3] p-8'>
          <h2 className='text-xl font-semibold text-[#3d2b1f] mb-6'>Iniciar sesión</h2>

          <div className='space-y-4'>
            {/* Email */}
            <div>
              <label className='block text-sm font-medium text-[#3d2b1f] mb-1.5'>Email</label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060]' />
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={bloqueado}
                  placeholder='admin@sanoyrico.com'
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] placeholder:text-[#c4b5a8] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] focus:border-transparent disabled:opacity-50'
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-medium text-[#3d2b1f] mb-1.5'>Contraseña</label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060]' />
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={bloqueado}
                  placeholder='••••••••'
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] placeholder:text-[#c4b5a8] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] focus:border-transparent disabled:opacity-50'
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className='text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl'>
                {error}
                {bloqueado && segundosRestantes > 0 && (
                  <span className='block text-xs mt-0.5 font-medium'>{segundosRestantes}s restantes</span>
                )}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading || bloqueado}
              className='w-full bg-[#3d2b1f] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading && <Loader2 className='h-4 w-4 animate-spin' />}
              {bloqueado ? `Bloqueado (${segundosRestantes}s)` : loading ? 'Entrando...' : 'Entrar al panel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
