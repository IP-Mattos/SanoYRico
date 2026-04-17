// src/app/layout.tsx
import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sano-y-rico.vercel.app'
// Plausible analytics: se activa solo si NEXT_PUBLIC_PLAUSIBLE_DOMAIN está seteada.
// Es privacy-friendly, sin cookies, sin consent banner.
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Sano y Rico — Snacks naturales hechos en Uruguay',
    template: '%s | Sano y Rico'
  },
  description:
    'Barras de cereal, mixes y alfajores artesanales. Sin azúcar refinada, sin conservantes. Envío a todo Uruguay.',
  keywords: ['barras de cereal', 'snacks saludables', 'sin azúcar', 'Uruguay', 'natural', 'alfajor saludable'],
  authors: [{ name: 'Sano y Rico' }],
  creator: 'Sano y Rico',
  openGraph: {
    type: 'website',
    locale: 'es_UY',
    url: BASE_URL,
    siteName: 'Sano y Rico',
    title: 'Sano y Rico — Snacks naturales hechos en Uruguay',
    description: 'Barras de cereal, mixes y alfajores artesanales. Sin azúcar refinada, sin conservantes.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Sano y Rico' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sano y Rico — Snacks naturales',
    description: 'Barras de cereal, mixes y alfajores artesanales.',
    images: ['/og.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <body suppressHydrationWarning>
        {children}
        {PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src='https://plausible.io/js/script.js'
            strategy='afterInteractive'
          />
        )}
      </body>
    </html>
  )
}
