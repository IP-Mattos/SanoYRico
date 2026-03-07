// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lock, Mail, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
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
                  placeholder='admin@sanoyrico.com'
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] placeholder:text-[#c4b5a8] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] focus:border-transparent'
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
                  placeholder='••••••••'
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6d3] text-sm text-[#3d2b1f] placeholder:text-[#c4b5a8] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] focus:border-transparent'
                />
              </div>
            </div>

            {/* Error */}
            {error && <p className='text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl'>{error}</p>}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className='w-full bg-[#3d2b1f] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#c47c2b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading && <Loader2 className='h-4 w-4 animate-spin' />}
              {loading ? 'Entrando...' : 'Entrar al panel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
