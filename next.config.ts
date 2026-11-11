import type { NextConfig } from 'next'

// sharp carga libvips-cpp.so con dlopen y el trazado de Next no lo detecta (con pnpm queda fuera
// del bundle y sharp falla en Vercel con ERR_DLOPEN_FAILED). Se incluye a mano en cada ruta que usa sharp.
const LIBVIPS_LINUX = ['./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/lib/**']

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // El generador de flyers lee fuentes y logo con fs: asegurar que viajen en el bundle de la función
  outputFileTracingIncludes: {
    '/api/flyers': ['./public/fonts/**', './public/logo-sano-y-rico-v2.png', ...LIBVIPS_LINUX],
    '/api/imagenes/cupon': ['./public/fonts/**', './public/logo-sano-y-rico-v2.png', ...LIBVIPS_LINUX],
    '/api/imagenes/promo': ['./public/fonts/**', './public/logo-sano-y-rico-v2.png', ...LIBVIPS_LINUX],
    // Las claves son globs: "[id]" literal no matchea (sería una clase de caracteres), por eso el "*"
    '/api/productos/*/fotos': LIBVIPS_LINUX
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ]
      }
    ]
  }
}

export default nextConfig
