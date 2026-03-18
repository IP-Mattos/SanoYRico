// src/app/sitemap.ts
import { type MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sano-y-rico.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/pedido`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 }
  ]
}
