// src/app/manifest.ts
import { type MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sano y Rico',
    short_name: 'Sano y Rico',
    description: 'Snacks naturales hechos en Uruguay',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#3d2b1f',
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
}
