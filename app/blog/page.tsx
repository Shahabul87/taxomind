import { BlogPageRedesigned } from './components/redesign/BlogPageRedesigned';
import { ModernBlogPage } from './components/modern-blog-page';
import { getSimplePostsForBlog } from '@/actions/get-simple-posts';

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
  const { featuredPosts, posts, categories, trendingPosts } = await getPosts();

  // Use modern design
  return (
    <ModernBlogPage
      featuredPosts={featuredPosts}
      initialPosts={posts}
      categories={categories}
      trendingPosts={trendingPosts.length > 0 ? trendingPosts : posts.slice(0, 5)}
    />
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
  },
};
