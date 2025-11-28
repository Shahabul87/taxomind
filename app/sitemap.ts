import type { MetadataRoute } from 'next'
import { getSimplePostsForBlog } from '@/actions/get-simple-posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const posts = await getSimplePostsForBlog()
    for (const p of posts) {
      entries.push({
        url: `${base}/blog/${p.id}`,
        lastModified: new Date(p.updatedAt ?? p.createdAt),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
  } catch {
    // Fail silently; base routes still included
  }

  return entries
}

