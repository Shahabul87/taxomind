import { BlogPageRedesigned } from '../components/redesign/BlogPageRedesigned';

// Fetch posts from your data source
async function getPosts() {
  // This is where you would fetch your actual blog posts
  // For now, returning mock data
  return {
    featuredPosts: [
      {
        id: '1',
        title: 'Building Modern Web Applications with Next.js 15',
        description: 'Explore the latest features in Next.js 15 including the App Router, Server Components, and advanced optimization techniques for building blazing-fast web applications.',
        imageUrl: 'https://source.unsplash.com/random/1200x600?nextjs',
        category: 'Web Development',
        createdAt: new Date().toISOString(),
        views: 15234,
        readingTime: '8 min read',
        user: {
          name: 'Sarah Chen',
          image: 'https://source.unsplash.com/random/100x100?face'
        },
        comments: { length: 42 },
        tags: ['Next.js', 'React', 'Performance']
      },
      {
        id: '2',
        title: 'The Future of AI in Software Development',
        description: 'How artificial intelligence is revolutionizing the way we write, test, and deploy code. From GitHub Copilot to advanced testing frameworks.',
        imageUrl: 'https://source.unsplash.com/random/1200x600?ai,technology',
        category: 'AI & ML',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        views: 28456,
        readingTime: '12 min read',
        user: {
          name: 'Alex Thompson',
          image: 'https://source.unsplash.com/random/100x100?portrait'
        },
        comments: { length: 67 },
        tags: ['AI', 'Machine Learning', 'Development']
      },
      {
        id: '3',
        title: 'Mastering TypeScript Design Patterns',
        description: 'Deep dive into advanced TypeScript patterns including decorators, generics, and type gymnastics for building type-safe applications.',
        imageUrl: 'https://source.unsplash.com/random/1200x600?code,programming',
        category: 'Programming',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        views: 19876,
        readingTime: '15 min read',
        user: {
          name: 'Jordan Lee',
          image: 'https://source.unsplash.com/random/100x100?developer'
        },
        comments: { length: 31 },
        tags: ['TypeScript', 'Design Patterns', 'Best Practices']
      }
    ],
    posts: Array.from({ length: 20 }, (_, i) => ({
      id: `post-${i}`,
      title: `Amazing Blog Post Title ${i + 1}`,
      description: `This is an engaging description for blog post ${i + 1}. It contains valuable insights and practical examples that readers will find useful.`,
      imageUrl: `https://source.unsplash.com/random/800x600?tech&sig=${i}`,
      category: ['Web Development', 'AI & ML', 'Design', 'Database', 'Cloud Computing'][i % 5],
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      views: Math.floor(Math.random() * 10000) + 1000,
      readingTime: `${Math.floor(Math.random() * 10) + 5} min read`,
      user: {
        name: `Author ${i + 1}`,
        image: `https://source.unsplash.com/random/100x100?face&sig=${i}`
      },
      comments: { length: Math.floor(Math.random() * 50) },
      tags: ['React', 'Next.js', 'TypeScript'].slice(0, Math.floor(Math.random() * 3) + 1)
    })),
    categories: [
      { id: 'all', name: 'All', count: 156 },
      { id: 'web-development', name: 'Web Development', count: 45, trending: true },
      { id: 'ai-ml', name: 'AI & ML', count: 32, trending: true },
      { id: 'design', name: 'Design', count: 28 },
      { id: 'database', name: 'Database', count: 21 },
      { id: 'cloud-computing', name: 'Cloud Computing', count: 18 },
      { id: 'security', name: 'Security', count: 12 },
      { id: 'programming', name: 'Programming', count: 35 },
      { id: 'lifestyle', name: 'Lifestyle', count: 8 }
    ],
    trendingPosts: []
  };
}

export default async function BlogRedesignedPage() {
  const { featuredPosts, posts, categories, trendingPosts } = await getPosts();

  return (
    <BlogPageRedesigned
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