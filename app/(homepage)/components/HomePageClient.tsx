'use client';

import HomeHeroSection from './HomeHeroSectionRedesigned';
import BloomsTaxonomySection from '../blooms-taxonomy-section';
import RemoveHashOnLoad from './RemoveHashOnLoad';
import { HomeFooter } from '../HomeFooter';
import { FeaturedCoursesSection } from '../featured-courses-section';
import { FeaturedBlogPostsSection } from '../featured-blog-posts-section';

interface HomePageClientProps {
  courses: any[];
  posts: any[];
}

export const HomePageClient = ({ courses, posts }: HomePageClientProps) => {
  return (
    <>
      <RemoveHashOnLoad />

      <div id="homepage-root">
        <HomeHeroSection />

        <main id="main-content">
          <BloomsTaxonomySection />

          <div className="min-h-screen">
            <FeaturedCoursesSection courses={courses} />
            <FeaturedBlogPostsSection posts={posts} />
          </div>
        </main>

        <HomeFooter />
      </div>
    </>
  );
};
