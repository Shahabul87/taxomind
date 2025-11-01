import { ReactNode } from 'react';
// TODO: Uncomment when hide-header component is added to git
// import { HideHeader } from './_components/hide-header';
// import './blog-post.css';

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
    <div className="blog-post-wrapper min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/10 dark:to-purple-950/10">
      {/* <HideHeader /> */}
      {children}
    </div>
  );
}
