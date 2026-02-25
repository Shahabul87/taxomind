import type { MetadataRoute } from 'next'
import { getSimplePostsForBlog } from '@/actions/get-simple-posts'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com').replace(/\/$/, '')

  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    // Core pages
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/courses`, changeFrequency: 'daily', priority: 0.95 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.9 },

    // Marketing/Info pages
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/ai-features`, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/ai-tutor`, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/blooms-taxonomy`, changeFrequency: 'monthly', priority: 0.7 },

    // Educational content pages
    { url: `${base}/intelligent-lms/overview`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/intelligent-lms/adaptive-learning`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/intelligent-lms/sam-ai-assistant`, changeFrequency: 'monthly', priority: 0.7 },

    // User action pages
    { url: `${base}/become-instructor`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/get-started`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/support`, changeFrequency: 'monthly', priority: 0.5 },

    // Auth pages (lower priority but important for crawling)
    { url: `${base}/auth/login`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/auth/register`, changeFrequency: 'monthly', priority: 0.4 },
  ]

  const entries: MetadataRoute.Sitemap = [...staticPages]

  // Add published courses
  try {
    const courses = await db.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    })

    for (const course of courses) {
      entries.push({
        url: `${base}/courses/${course.id}`,
        lastModified: new Date(course.updatedAt ?? course.createdAt),
        changeFrequency: 'weekly',
        priority: 0.85,
      })
    }
  } catch {
    // Fail silently; continue with other entries
  }

  // Add blog posts
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
