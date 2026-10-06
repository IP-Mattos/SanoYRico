import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // El generador de flyers lee fuentes y logo con fs: asegurar que viajen en el bundle de la función
  outputFileTracingIncludes: {
    '/api/flyers': ['./public/fonts/**', './public/logo-sano-y-rico-v2.png'],
    '/api/imagenes/cupon': ['./public/fonts/**', './public/logo-sano-y-rico-v2.png'],
    '/api/imagenes/promo': ['./public/fonts/**', './public/logo-sano-y-rico-v2.png']
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
