import { getHomepageFeaturedCourses, getHomepageFeaturedPosts } from "@/actions/get-homepage-content";
import HomeHeroSection from "./components/HomeHeroSection";
import BloomsTaxonomySection from "./components/BloomsTaxonomySection";
import RemoveHashOnLoad from "./components/RemoveHashOnLoad";
import { HomeFooter } from "./HomeFooter";
import { FeaturedCoursesSection } from './featured-courses-section';
import { FeaturedBlogPostsSection } from './featured-blog-posts-section';

// Use dynamic rendering to avoid build-time database queries
// This prevents build failures when database is not yet migrated
export const dynamic = 'force-dynamic';
export const revalidate = 180; // Re-generate homepage every 3 minutes

const Home = async () => {
  // Fetch in parallel for lower TTFB
  const [courses, posts] = await Promise.all([
    getHomepageFeaturedCourses(8),
    getHomepageFeaturedPosts(6),
  ]);

  return (
    <>
      <RemoveHashOnLoad />

      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 transition-all"
      >
        Skip to main content
      </a>

      <HomeHeroSection />

      <main id="main-content">
        <BloomsTaxonomySection />

        <div className="min-h-screen">
          <FeaturedCoursesSection courses={courses} />
          <FeaturedBlogPostsSection posts={posts} />
        </div>
      </main>

      <HomeFooter />
    </>
  );
};

export default Home;
