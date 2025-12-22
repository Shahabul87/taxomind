import { ReactNode } from 'react';
import { HideHeader } from './_components/hide-header';

/**
 * Blog Post Detail Layout
 * This layout wraps individual blog post pages to provide:
 * - Full-screen immersive reading experience
 * - No header interference from root layout
 * - Clean, distraction-free design
 */

interface BlogPostLayoutProps {
  children: ReactNode;
}

export default function BlogPostLayout({ children }: BlogPostLayoutProps) {
  return (
    <>
      {/* Inline critical CSS to eliminate render-blocking (80ms savings) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Hide header on blog detail pages for immersive reading experience */
            body:has(.blog-post-wrapper) header {
              display: none !important;
            }

            /* Remove all top spacing from main element on blog detail pages */
            body:has(.blog-post-wrapper) main {
              padding: 0 !important;
              margin: 0 !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: 100vh !important;
            }

            /* Ensure full-width layout with editorial background */
            .blog-post-wrapper {
              width: 100%;
              min-height: 100vh;
              padding: 0 !important;
              margin: 0 !important;
              background: hsl(var(--blog-bg, 35 30% 98%));
            }

            /* Dark mode support */
            .dark .blog-post-wrapper {
              background: linear-gradient(to bottom right, #0f172a, #1e293b, #334155);
            }
          `,
        }}
      />
      <div className="blog-post-wrapper">
        <HideHeader />
        {children}
      </div>
    </>
  );
}
