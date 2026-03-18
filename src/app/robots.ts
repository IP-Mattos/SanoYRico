// src/app/robots.ts
import { type MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sano-y-rico.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/'] }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`
  }
}
