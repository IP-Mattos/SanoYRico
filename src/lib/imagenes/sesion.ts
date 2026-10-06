// src/lib/imagenes/sesion.ts
// Verificación de sesión de admin en las rutas /api/imagenes (defensa en profundidad; el proxy ya la exige).
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export const SIN_CACHE = { 'Cache-Control': 'no-store' }

export async function haySesion(req: NextRequest): Promise<boolean> {
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await auth.auth.getUser()
  return !!user
}
