import dynamic from 'next/dynamic';
import { getHomepageFeaturedCourses, getHomepageFeaturedPosts } from "@/actions/get-homepage-content";
import HomeHeroSectionRedesigned from "./components/HomeHeroSectionRedesigned";
import RemoveHashOnLoad from "./components/RemoveHashOnLoad";
import { HomeFooter } from "./HomeFooter";
import { FeaturedCoursesSection } from './featured-courses-section';
import { HomeNavbar } from './components/HomeNavbar';

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
