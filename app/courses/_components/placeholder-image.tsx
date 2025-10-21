"use client";

import { cn } from "@/lib/utils";

interface PlaceholderImageProps {
  text: string;
  className?: string;
  width?: number;
  height?: number;
  gradient?: string;
}

export function PlaceholderImage({
  text,
  className,
  width = 1200,
  height = 600,
  gradient = "from-blue-600 to-purple-600"
}: PlaceholderImageProps) {
  // Create an SVG data URL for the placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9333EA;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad1)"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="white"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${Math.min(width, height) / 10}px"
        font-weight="bold"
      >
        ${text}
      </text>
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

  return (
    <div
      className={cn("relative w-full h-full bg-gradient-to-br", gradient, className)}
      style={{
        backgroundImage: `url("${dataUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    />
  );
}

// Export preset placeholder URLs for static use
export const placeholderImages = {
  webDev: generatePlaceholderUrl("Web Development", "from-blue-600 to-cyan-500"),
  ai: generatePlaceholderUrl("AI & Machine Learning", "from-purple-600 to-pink-500"),
  marketing: generatePlaceholderUrl("Digital Marketing", "from-green-600 to-teal-500"),
  coursePlaceholder: generatePlaceholderUrl("Course", "from-gray-600 to-gray-400"),
  design: generatePlaceholderUrl("Design", "from-pink-600 to-rose-500"),
  business: generatePlaceholderUrl("Business", "from-orange-600 to-yellow-500"),
  photography: generatePlaceholderUrl("Photography", "from-indigo-600 to-blue-500"),
  music: generatePlaceholderUrl("Music", "from-red-600 to-pink-500"),
};

function generatePlaceholderUrl(text: string, gradientClasses: string): string {
  const svg = `
    <svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9333EA;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#grad1)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-size="60" font-weight="bold">
        ${text}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}