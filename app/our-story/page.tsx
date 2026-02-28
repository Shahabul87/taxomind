import { Metadata } from 'next';
import StoryHero from './_components/story-hero';
import StoryProblem from './_components/story-problem';
import StoryJourneyTimeline from './_components/story-journey-timeline';
import StoryEureka from './_components/story-eureka';
import StoryBuilding from './_components/story-building';
import StoryVision from './_components/story-vision';
import StoryCta from './_components/story-cta';

export const dynamic = 'force-static';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';

export const metadata: Metadata = {
  title: 'Our Story — 16 Years of Learning Led to TaxoMind',
  description:
    'The founder\'s journey from 16 years of learning struggles to building TaxoMind — an AI-powered platform that guides learners through real mastery using Bloom\'s Taxonomy.',
  keywords: [
    'TaxoMind founder story',
    'AI education origin',
    'Bloom\'s Taxonomy platform',
    'learning platform founder',
    'EdTech story',
    'adaptive learning journey',
  ],
  alternates: {
    canonical: '/our-story',
  },
  openGraph: {
    title: 'Our Story — From Learning Struggles to TaxoMind',
    description:
      'Discover how 16 years of learning frustrations led to building an AI-powered platform that actually works.',
    url: `${baseUrl}/our-story`,
    siteName: 'TaxoMind',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: `${baseUrl}/og-default.svg`,
        width: 1200,
        height: 630,
        alt: 'Our Story — TaxoMind',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Story — TaxoMind',
    description:
      '16 years of learning struggles led to building an AI-powered platform for real mastery.',
    images: [`${baseUrl}/og-default.svg`],
    creator: '@taxomind',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
};

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <StoryHero />
      <StoryProblem />
      <StoryJourneyTimeline />
      <StoryEureka />
      <StoryBuilding />
      <StoryVision />
      <StoryCta />
    </div>
  );
}
