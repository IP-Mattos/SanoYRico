'use server'

import { updateTag } from 'next/cache'

export async function revalidateSiteConfig() {
  updateTag('site-config')
}
