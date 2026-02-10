import { ModernBlogPage } from './components/modern-blog-page';
import { getSimplePostsForBlog } from '@/actions/get-simple-posts';
import { currentUser } from '@/lib/auth';
import { PageWithMobileLayout } from '@/components/layouts/PageWithMobileLayout';
import Script from 'next/script';

// Fetch posts from database for initial SSR
async function getPosts() {
  const simple = await getSimplePostsForBlog();
  const posts = simple.map((p, i) => ({
    id: p.id,
    title: p.title,
    description: p.description || '',
    imageUrl: p.imageUrl || undefined,
    category: p.category || undefined,
    createdAt: new Date(p.createdAt),
    views: p.views,
    readingTime: p.description ? `${Math.max(2, Math.ceil(p.description.replace(/<[^>]*>/g, '').split(' ').length / 200))} min read` : undefined,
    user: { name: p.user?.name || null, image: undefined },
    comments: { length: p.comments.length },
    tags: [] as string[],
  }));

  // Featured = top 3 by views
  const featuredPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 3);
  // Trending = top 5 by recent + views (approx)
  const trendingPosts = [...posts].slice(0, 5);

  // Categories with counts
  const counts = posts.reduce<Record<string, number>>((acc, p) => {
    const key = p.category || 'Uncategorized';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const categories = [
    { id: 'all', name: 'All', count: posts.length },
    ...Object.entries(counts).map(([name, count]) => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name, count })),
  ];

  return { featuredPosts, posts, categories, trendingPosts };
}

export default async function BlogPage() {
  const [{ featuredPosts, posts, categories, trendingPosts }, user] = await Promise.all([
    getPosts(),
    currentUser(),
  ]);
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Taxomind Blog',
    url: `${base}/blog`,
    description: 'Modern tech insights, tutorials, and best practices.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Taxomind',
      url: base,
    },
    blogPost: posts.slice(0, 10).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      url: `${base}/blog/${p.id}`,
      datePublished: new Date(p.createdAt).toISOString(),
      author: p.user?.name ? { '@type': 'Person', name: p.user.name } : undefined,
      image: p.imageUrl ? [{ '@type': 'ImageObject', url: p.imageUrl }] : undefined,
    })),
  }

  // Use modern design - public page without navigation elements
  return (
    <PageWithMobileLayout
      showHeader={false}
      showSidebar={false}
      showBottomBar={false}
      enableGestures={false}
      contentClassName="bg-slate-50 dark:bg-slate-900"
    >
      <Script
        id="blog-ld-json"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ModernBlogPage
        featuredPosts={featuredPosts}
        initialPosts={posts}
        categories={categories}
        trendingPosts={trendingPosts.length > 0 ? trendingPosts : posts.slice(0, 5)}
        userId={user?.id}
      />
    </PageWithMobileLayout>
  );
}

export const metadata = {
  title: 'Blog - Modern Tech Insights & Tutorials',
  description: 'Explore our collection of articles on web development, AI, design, and more. Stay updated with the latest tech trends and best practices.',
  keywords: ['blog', 'technology', 'web development', 'AI', 'programming', 'tutorials'],
  openGraph: {
    title: 'Blog - Modern Tech Insights & Tutorials',
    description: 'Explore our collection of articles on web development, AI, design, and more.',
    type: 'website',
    url: '/blog',
  },
  alternates: {
    canonical: '/blog',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Enable ISR to improve TTFB and cache the blog listing for 1 hour
export const revalidate = 3600;
