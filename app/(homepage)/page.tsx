import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { getHomepageFeaturedCourses, getHomepageFeaturedPosts } from "@/actions/get-homepage-content";
import HomeHeroSectionRedesigned from "./components/HomeHeroSectionRedesigned";
import RemoveHashOnLoad from "./components/RemoveHashOnLoad";
import { HomeFooter } from "./HomeFooter";
import { FeaturedCoursesSection } from './featured-courses-section';
import { HomeNavbar } from './components/HomeNavbar';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';

/**
 * Homepage Metadata - Optimized for Google Search Rankings
 * Target keywords: AI learning platform, online courses, adaptive education
 */
export const metadata: Metadata = {
  title: 'Taxomind - AI-Powered Intelligent Learning Platform | Online Courses',
  description: 'Transform your learning journey with Taxomind, the AI-powered education platform. Discover adaptive courses, personalized learning paths, and SAM AI tutor. Join thousands of learners mastering new skills today.',
  keywords: [
    'AI learning platform',
    'online courses',
    'adaptive learning',
    'personalized education',
    'AI tutor',
    'e-learning platform',
    'online education',
    'skill development',
    'professional courses',
    'Taxomind',
    'intelligent tutoring system',
    'online certification',
  ],
  authors: [{ name: 'Taxomind', url: baseUrl }],
  creator: 'Taxomind',
  publisher: 'Taxomind',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Taxomind - Where Minds Are Forged Through Intelligence',
    description: 'Experience the future of education with AI-powered adaptive learning. Personalized courses, intelligent tutoring, and industry-recognized certificates.',
    url: baseUrl,
    siteName: 'Taxomind',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: `${baseUrl}/og-default.svg`,
        width: 1200,
        height: 630,
        alt: 'Taxomind - AI-Powered Intelligent Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taxomind - AI-Powered Learning Platform',
    description: 'Transform your learning with AI-powered adaptive education. Start your journey today.',
    images: [`${baseUrl}/og-default.svg`],
    creator: '@taxomind',
    site: '@taxomind',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: 'your-google-verification-code',
  },
  category: 'Education',
};

// Code split the blog posts section (below the fold)
// This reduces initial bundle size and improves LCP
const FeaturedBlogPostsSection = dynamic(
  () => import('./featured-blog-posts-section').then(mod => ({ default: mod.FeaturedBlogPostsSection })),
  {
    loading: () => (
      <div className="min-h-[400px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 animate-pulse">
        <div className="container mx-auto max-w-7xl px-4 py-20">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: true
  }
);

// Use Incremental Static Regeneration (ISR) for optimal performance
// Homepage will be statically generated and revalidated every 5 minutes
// This provides fast initial loads while keeping content fresh
export const revalidate = 300; // Re-generate homepage every 5 minutes

const Home = async () => {
  // Fetch in parallel for lower TTFB
  const [courses, posts] = await Promise.all([
    getHomepageFeaturedCourses(8),
    getHomepageFeaturedPosts(6),
  ]);

  return (
    <>
      <RemoveHashOnLoad />

      {/* Scroll-triggered navbar - Hidden initially, appears on scroll */}
      <HomeNavbar />

      <HomeHeroSectionRedesigned />

      <main id="main-content">
        {/* Enterprise Featured Courses Section with integrated navbar */}
        <FeaturedCoursesSection courses={courses} />

        {/* Featured Blog Posts Section */}
        <FeaturedBlogPostsSection posts={posts} />
      </main>

      <HomeFooter />
    </>
  );
};

export default Home;
