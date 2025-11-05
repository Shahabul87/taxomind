/**
 * Metadata Generation for SEO
 *
 * Generates category-specific metadata for optimal SEO performance.
 * Includes OpenGraph, Twitter Cards, and JSON-LD structured data.
 */

import { Metadata } from 'next';
import { getCourseData, getCourseStats } from './data-fetchers';
import { getCategoryLayout } from '../_config/category-layouts';
import type { BaseCourse } from '../_types/course.types';

/**
 * Category-specific keywords for SEO
 */
const CATEGORY_KEYWORDS = {
  programming: [
    'programming course',
    'coding tutorial',
    'software development',
    'web development',
    'learn to code',
  ],
  'ai-ml': [
    'artificial intelligence',
    'machine learning course',
    'deep learning',
    'AI tutorial',
    'neural networks',
  ],
  'data-science': [
    'data science course',
    'data analysis',
    'statistics',
    'analytics tutorial',
    'big data',
  ],
  design: [
    'ui design course',
    'ux design',
    'graphic design',
    'product design',
    'design tutorial',
  ],
  business: [
    'business course',
    'management',
    'entrepreneurship',
    'leadership training',
    'business strategy',
  ],
  marketing: [
    'marketing course',
    'digital marketing',
    'seo tutorial',
    'content marketing',
    'social media marketing',
  ],
  default: [
    'online course',
    'education',
    'learning',
    'tutorial',
    'training',
  ],
} as const;

/**
 * Generate comprehensive metadata for a course page
 *
 * @param courseId - Course ID
 * @returns Next.js Metadata object
 */
export async function generateCourseMetadata(courseId: string): Promise<Metadata> {
  const course = await getCourseData(courseId);
  const layout = getCategoryLayout(course.category?.name);
  const stats = await getCourseStats(courseId);

  const title = `${course.title} | Taxomind`;
  const description = course.description ?? `Learn ${course.title} with Taxomind. ${stats.enrollmentCount} students enrolled.`;
  const imageUrl = course.imageUrl || '/og-image-default.png';
  const url = `/courses/${courseId}`;

  // Build comprehensive keywords
  const categoryKeywords = CATEGORY_KEYWORDS[layout.variant] || CATEGORY_KEYWORDS.default;
  const keywords = [
    course.title,
    course.category?.name || '',
    ...categoryKeywords,
    course.difficulty || '',
  ].filter(Boolean).join(', ');

  return {
    title,
    description,
    keywords,
    authors: course.user?.name ? [{ name: course.user.name }] : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'Taxomind',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
      publishedTime: course.createdAt.toISOString(),
      modifiedTime: course.updatedAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: course.user?.name || '@taxomind',
    },
    robots: {
      index: course.isPublished,
      follow: course.isPublished,
      nocache: !course.isPublished,
    },
  };
}

/**
 * Generate JSON-LD structured data for course
 *
 * @param course - Course data
 * @returns JSON-LD object for structured data
 */
export function generateCourseJsonLd(course: BaseCourse) {
  // Calculate average rating
  const avgRating = course.reviews && course.reviews.length > 0
    ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    image: course.imageUrl,
    provider: {
      '@type': 'Organization',
      name: 'Taxomind',
      sameAs: 'https://taxomind.com',
    },
    instructor: course.user ? {
      '@type': 'Person',
      name: course.user.name,
      image: course.user.image,
    } : undefined,
    aggregateRating: avgRating ? {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: course.reviews?.length || 0,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: `${course.chapters?.length || 0} chapters`,
      educationalLevel: course.difficulty || 'All Levels',
    },
    offers: course.price ? {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: course.createdAt.toISOString(),
    } : {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    numberOfCredits: course.chapters?.length || 0,
    about: {
      '@type': 'Thing',
      name: course.category?.name || 'General',
    },
    datePublished: course.createdAt.toISOString(),
    dateModified: course.updatedAt.toISOString(),
    inLanguage: 'en-US',
  };
}

/**
 * Generate breadcrumb structured data
 *
 * @param course - Course data
 * @returns JSON-LD breadcrumb list
 */
export function generateBreadcrumbJsonLd(course: BaseCourse) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://taxomind.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Courses',
        item: 'https://taxomind.com/courses',
      },
      course.category ? {
        '@type': 'ListItem',
        position: 3,
        name: course.category.name,
        item: `https://taxomind.com/courses?category=${course.categoryId}`,
      } : null,
      {
        '@type': 'ListItem',
        position: course.category ? 4 : 3,
        name: course.title,
        item: `https://taxomind.com/courses/${course.id}`,
      },
    ].filter(Boolean),
  };
}

/**
 * Generate FAQ structured data from course chapters
 *
 * @param course - Course data
 * @returns JSON-LD FAQ page (if applicable)
 */
export function generateFAQJsonLd(course: BaseCourse) {
  if (!course.chapters || course.chapters.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: course.chapters.slice(0, 5).map((chapter) => ({
      '@type': 'Question',
      name: `What will I learn in ${chapter.title}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: chapter.description || `Learn about ${chapter.title} in this comprehensive chapter.`,
      },
    })),
  };
}
