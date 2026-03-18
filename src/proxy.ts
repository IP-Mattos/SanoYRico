// src/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Rate limiter en memoria ───────────────────────────────────────────────
// Nota: es por instancia. En producción multi-instancia usa Upstash Redis.
const rl = new Map<string, { n: number; exp: number }>()

function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const e = rl.get(key)
  if (!e || now > e.exp) {
    rl.set(key, { n: 1, exp: now + windowMs })
    return true
  }
  if (e.n >= max) return false
  e.n++
  return true
}

// Limpiar entradas expiradas cada 500 peticiones para evitar memory leak
let hits = 0
function maybeClean() {
  if (++hits % 500 !== 0) return
  const now = Date.now()
  for (const [k, v] of rl) if (now > v.exp) rl.delete(k)
}

// ─── Proxy ─────────────────────────────────────────────────────────────────
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'

  maybeClean()

  // ── Rate limiting en API routes ──────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (!allow(`api:${ip}`, 20, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }
    if (pathname === '/api/pedidos') {
      if (!allow(`pedidos:${ip}`, 5, 3_600_000)) {
        return new NextResponse(
          JSON.stringify({ error: 'Límite de pedidos alcanzado. Intentá de nuevo en una hora.' }),
          { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' } }
        )
      }
    }
  }

  // ── Rate limiting en login: 10 intentos / 15 minutos por IP ──────────────
  if (pathname === '/login' && req.method === 'POST') {
    if (!allow(`login:${ip}`, 10, 900_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiados intentos. Esperá 15 minutos.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '900' } }
      )
    }
  }

  // ── Auth Supabase ─────────────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Rutas de API que requieren sesión de admin ────────────────────────────
  const PROTECTED_APIS = ['/api/remove-bg', '/api/mp/create-preference']
  if (PROTECTED_APIS.some((p) => pathname.startsWith(p))) {
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/login',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
