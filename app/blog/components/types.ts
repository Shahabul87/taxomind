/**
 * Shared Types and Theme Constants for Blog Components
 * Centralized type definitions and editorial styles
 */

// ============================================================================
// Theme Constants — CSS Variable-based (dark mode aware)
// ============================================================================

export const blogFonts = {
  headline: "var(--font-crimson, 'Crimson Text', Georgia, serif)",
  body: "var(--font-libre, 'Libre Baskerville', Georgia, serif)",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

export const blogColors = {
  cream: "hsl(var(--blog-newspaper-bg))",
  ink: "hsl(var(--blog-newspaper-ink))",
  accent: "hsl(var(--blog-newspaper-accent))",
  muted: "hsl(var(--blog-newspaper-muted))",
  rule: "hsl(var(--blog-newspaper-rule))",
  lightRule: "hsl(var(--blog-newspaper-light-rule))",
  warmBg: "hsl(var(--blog-newspaper-warm))",
};

// Paper texture SVG data URI
export const paperTexture = `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`;

// Reusable Tailwind class constants for editorial styles
export const blogClasses = {
  monoLabel: 'font-mono text-[10px] font-semibold uppercase tracking-[0.1em]',
  monoLabelWide: 'font-mono text-[10px] font-semibold uppercase tracking-[0.12em]',
  sectionHeader: 'font-blog-headline text-[11px] font-bold uppercase tracking-[0.15em] text-newspaper-ink',
  headlineMd: 'font-blog-headline text-[22px] font-bold text-newspaper-ink',
  bodyItalic: 'font-blog-serif text-[13px] italic text-newspaper-muted leading-[1.8]',
  editorialBtn: 'font-mono text-[12px] font-semibold uppercase tracking-[0.12em] border border-newspaper-ink text-newspaper-ink bg-transparent hover:bg-[hsl(var(--blog-newspaper-ink))] hover:text-[hsl(var(--blog-newspaper-bg))] transition-colors cursor-pointer',
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
  views: number;
  readingTime?: string;
  user: { name: string | null; image?: string };
  comments: { length: number };
  tags?: string[];
}

export interface BlogStatistics {
  totalArticles: number;
  publishedArticles: number;
  totalReaders: number;
  totalAuthors: number;
  totalViews: number;
  totalComments: number;
  averageViews: number;
  popularCategories: Array<{ category: string; count: number }>;
}

export interface ModernBlogPageProps {
  featuredPosts: BlogPost[];
  initialPosts: BlogPost[];
  categories: { id: string; name: string; count: number }[];
  trendingPosts: BlogPost[];
  userId?: string;
}
