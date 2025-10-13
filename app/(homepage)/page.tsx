import { getHomepageFeaturedCourses, getHomepageFeaturedPosts } from "@/actions/get-homepage-content";
import HeroSection from "./hero-section";
import HowItWorksSection from "./how-it-works-section";
import { HomeFooter } from "./HomeFooter";
import { FeaturedCoursesSection } from './featured-courses-section';
import { FeaturedBlogPostsSection } from './featured-blog-posts-section';
import TestimonialsSection from './testimonials-section';

export const dynamic = 'force-static';
export const revalidate = 180; // Re-generate homepage every 3 minutes

const Home = async () => {
  // Fetch in parallel for lower TTFB
  const [courses, posts] = await Promise.all([
    getHomepageFeaturedCourses(8),
    getHomepageFeaturedPosts(6),
  ]);

  return (
    <>
      <HeroSection />
      <HowItWorksSection />
     
      <div className="min-h-screen">
        <FeaturedCoursesSection courses={courses} />
        <FeaturedBlogPostsSection posts={posts} />
      </div>
      <TestimonialsSection />
      <HomeFooter />
    </>
  );
};

export default Home;
