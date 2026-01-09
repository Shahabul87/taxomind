import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Taxomind",
  description: "Learn about Taxomind&apos;s mission to transform education through AI-powered learning and adaptive teaching methods. We&apos;re dedicated to making personalized education accessible and effective for everyone.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com'),
  keywords: [
    "Taxomind",
    "AI-powered education",
    "adaptive learning",
    "intelligent tutoring",
    "online learning platform",
    "personalized education",
    "educational technology"
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: "About Us | Taxomind",
    description: "Discover how Taxomind is transforming education through AI-powered adaptive learning and personalized educational experiences.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Taxomind - Intelligent Learning Platform"
      }
    ],
    type: "website",
    locale: "en_US",
    siteName: "Taxomind"
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Taxomind",
    description: "Discover how Taxomind is transforming education through AI-powered adaptive learning.",
    images: ["/og-default.png"],
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

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 