import { ReactNode } from 'react';
import { HideHeader } from './_components/hide-header';
import './blog-post.css';

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
    <div className="blog-post-wrapper">
      <HideHeader />
      {children}
    </div>
  );
}
