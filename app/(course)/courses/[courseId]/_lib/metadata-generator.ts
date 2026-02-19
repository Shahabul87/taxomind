/**
 * Metadata Generation for SEO
 *
 * Generates category-specific metadata for optimal SEO performance.
 * Includes OpenGraph, Twitter Cards, and JSON-LD structured data.
 */

import { Metadata } from 'next';
import { getCourseData, getCourseStats } from './data-fetchers';
import { getCategoryLayout } from '../_config/category-layouts';
import type { CategoryLayoutVariant } from '../_config/category-layouts';
import type { BaseCourse } from '../_types/course.types';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';

/**
 * Category-specific keywords for SEO
 */
const CATEGORY_KEYWORDS: Record<CategoryLayoutVariant, readonly string[]> = {
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
  math: [
    'mathematics course',
    'math tutorial',
    'algebra',
    'calculus',
    'geometry',
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

  // Calculate average rating for rich snippets
  const avgRating = course.reviews && course.reviews.length > 0
    ? (course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length).toFixed(1)
    : null;

  const title = `${course.title} | Taxomind`;

  // Build a compelling meta description with stats
  const descriptionParts = [
    course.description?.slice(0, 120) || `Learn ${course.title} with Taxomind.`,
    stats.enrollmentCount > 0 ? `${stats.enrollmentCount.toLocaleString()} students enrolled.` : '',
    avgRating ? `${avgRating}★ rating.` : '',
    course.chapters?.length ? `${course.chapters.length} chapters.` : '',
  ].filter(Boolean);
  const description = descriptionParts.join(' ').slice(0, 160);

  // Ensure absolute image URL
  const imageUrl = course.imageUrl?.startsWith('http')
    ? course.imageUrl
    : `${baseUrl}${course.imageUrl || '/og-default.png'}`;
  const url = `${baseUrl}/courses/${courseId}`;

  // Build comprehensive keywords array
  const categoryKeywords = CATEGORY_KEYWORDS[layout.variant] || CATEGORY_KEYWORDS.default;
  const keywords = [
    course.title,
    course.category?.name || '',
    ...categoryKeywords,
    course.difficulty || '',
    'Taxomind',
    'online learning',
    course.user?.name ? `${course.user.name} course` : '',
  ].filter(Boolean);

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords,
    authors: course.user?.name ? [{ name: course.user.name }] : [{ name: 'Taxomind' }],
    creator: course.user?.name || 'Taxomind',
    publisher: 'Taxomind',
    alternates: {
      canonical: `/courses/${courseId}`,
    },
    openGraph: {
      title: course.title,
      description,
      url,
      type: 'article',
      siteName: 'Taxomind',
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${course.title} - Online Course on Taxomind`,
        },
      ],
      publishedTime: course.createdAt.toISOString(),
      modifiedTime: course.updatedAt.toISOString(),
      authors: course.user?.name ? [course.user.name] : undefined,
      section: course.category?.name || 'Education',
      tags: keywords.slice(0, 6),
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description,
      images: [imageUrl],
      creator: '@taxomind',
      site: '@taxomind',
    },
    robots: {
      index: course.isPublished,
      follow: course.isPublished,
      nocache: !course.isPublished,
      googleBot: {
        index: course.isPublished,
        follow: course.isPublished,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    other: {
      // Additional meta tags for course-specific SEO
      'course:instructor': course.user?.name || '',
      'course:price': course.price?.toString() || '0',
      'course:currency': 'USD',
      'course:duration': `${course.chapters?.length || 0} chapters`,
      ...(avgRating && { 'course:rating': avgRating }),
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

  // Calculate total duration if available
  const totalSections = course.chapters?.reduce(
    (sum, ch) => sum + (ch.sections?.length || 0),
    0
  ) || 0;

  // Ensure absolute image URL
  const imageUrl = course.imageUrl?.startsWith('http')
    ? course.imageUrl
    : `${baseUrl}${course.imageUrl || '/og-default.png'}`;

  const courseUrl = `${baseUrl}/courses/${course.id}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': courseUrl,
    name: course.title,
    description: course.description || `Learn ${course.title} with Taxomind`,
    url: courseUrl,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    provider: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'Taxomind',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    ...(course.user && {
      instructor: {
        '@type': 'Person',
        name: course.user.name,
        image: course.user.image?.startsWith('http')
          ? course.user.image
          : `${baseUrl}${course.user.image || '/default-avatar.png'}`,
        url: `${baseUrl}/instructors/${course.user.id}`,
      },
    }),
    ...(avgRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        ratingCount: course.reviews?.length || 0,
        reviewCount: course.reviews?.length || 0,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${(course.chapters?.length || 1) * 2}H`, // ISO 8601 duration estimate
      educationalLevel: course.difficulty || 'Beginner',
      instructor: course.user ? {
        '@type': 'Person',
        name: course.user.name,
      } : undefined,
    },
    offers: {
      '@type': 'Offer',
      '@id': `${courseUrl}#offer`,
      price: (course.price || 0).toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: courseUrl,
      validFrom: course.createdAt.toISOString(),
      seller: {
        '@type': 'Organization',
        name: 'Taxomind',
      },
    },
    numberOfCredits: course.chapters?.length || 0,
    numberOfLessons: totalSections,
    about: {
      '@type': 'Thing',
      name: course.category?.name || 'General Education',
    },
    educationalLevel: course.difficulty || 'Beginner',
    teaches: course.title,
    assesses: course.category?.name || 'Skills',
    competencyRequired: 'None',
    datePublished: course.createdAt.toISOString(),
    dateModified: course.updatedAt.toISOString(),
    inLanguage: 'en',
    isAccessibleForFree: !course.price || course.price === 0,
    ...(course.chapters && course.chapters.length > 0 && {
      syllabusSections: course.chapters.slice(0, 10).map((chapter, index) => ({
        '@type': 'Syllabus',
        name: chapter.title,
        position: index + 1,
        description: chapter.description || `Chapter ${index + 1}: ${chapter.title}`,
      })),
    }),
  };
}

/**
 * Generate breadcrumb structured data
 *
 * @param course - Course data
 * @returns JSON-LD breadcrumb list
 */
export function generateBreadcrumbJsonLd(course: BaseCourse) {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Courses',
      item: `${baseUrl}/courses`,
    },
  ];

  if (course.category) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: course.category.name,
      item: `${baseUrl}/courses?category=${course.categoryId}`,
    });
  }

  items.push({
    '@type': 'ListItem',
    position: course.category ? 4 : 3,
    name: course.title,
    item: `${baseUrl}/courses/${course.id}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
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
