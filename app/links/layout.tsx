import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TaxoMind Links | AI-Powered Learning Platform",
  description: "Connect with TaxoMind across all platforms. Start learning, explore courses, and join our community.",
  openGraph: {
    title: "TaxoMind Links",
    description: "Connect with TaxoMind across all platforms. AI-Powered Learning Platform.",
    type: "website",
    images: [
      {
        url: "/taxomind-logo.png",
        width: 512,
        height: 512,
        alt: "TaxoMind Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "TaxoMind Links",
    description: "Connect with TaxoMind across all platforms. AI-Powered Learning Platform.",
    images: ["/taxomind-logo.png"],
  },
};

export default function LinksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
