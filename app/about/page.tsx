import { Metadata } from 'next';
import { AboutHero } from "./_components/about-hero";
import { AboutMission } from "./_components/about-mission";
import { AboutTeam } from "./_components/about-team";
import { AboutValues } from "./_components/about-values";
import { AboutTestimonials } from "./_components/about-testimonials";
import { AboutCTA } from "./_components/about-cta";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';

/**
 * About Page Metadata - Build trust and brand authority
 */
export const metadata: Metadata = {
  title: 'About Taxomind - Our Mission to Transform Education with AI',
  description: 'Learn about Taxomind\'s mission to revolutionize education through AI-powered adaptive learning. Meet our team, discover our values, and see how we\'re shaping the future of online education.',
  keywords: [
    'about Taxomind',
    'AI education company',
    'online learning platform',
    'educational technology',
    'EdTech startup',
    'adaptive learning technology',
    'intelligent tutoring',
    'education innovation',
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Taxomind - Transforming Education with AI',
    description: 'Discover how Taxomind is revolutionizing online learning with AI-powered adaptive education and personalized learning paths.',
    url: `${baseUrl}/about`,
    siteName: 'Taxomind',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: `${baseUrl}/og-default.svg`,
        width: 1200,
        height: 630,
        alt: 'About Taxomind - AI Education Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Taxomind - Our Mission',
    description: 'Learn how we\'re transforming education with AI-powered adaptive learning.',
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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <AboutHero />
      <AboutMission />
      <AboutValues />
      <AboutTeam />
      <AboutTestimonials />
      <AboutCTA />
    </div>
  );
}