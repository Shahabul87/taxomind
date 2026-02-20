export type CategoryPalette = {
  primary: string; // main accent
  secondary: string; // secondary accent
  glow: string; // soft glow / mesh color
  subtle: string; // subtle complement
};

const PALETTES: Record<string, CategoryPalette> = {
  // Common tech categories
  programming: { primary: '#7c3aed', secondary: '#4f46e5', glow: '#a78bfa', subtle: '#22d3ee' },
  design: { primary: '#ec4899', secondary: '#8b5cf6', glow: '#f0abfc', subtle: '#34d399' },
  data: { primary: '#06b6d4', secondary: '#0ea5e9', glow: '#67e8f9', subtle: '#f59e0b' },
  business: { primary: '#f59e0b', secondary: '#ef4444', glow: '#fde68a', subtle: '#22c55e' },
  marketing: { primary: '#f97316', secondary: '#ef4444', glow: '#fdba74', subtle: '#60a5fa' },
  cloud: { primary: '#3b82f6', secondary: '#22d3ee', glow: '#93c5fd', subtle: '#a78bfa' },
  security: { primary: '#10b981', secondary: '#14b8a6', glow: '#6ee7b7', subtle: '#60a5fa' },
};

const DEFAULT_PALETTE: CategoryPalette = {
  primary: '#8b5cf6',
  secondary: '#6366f1',
  glow: '#a78bfa',
  subtle: '#22d3ee',
};

function slugify(input?: string | null): string {
  return (input || '').trim().toLowerCase().replace(/\s+/g, '-');
}

export function getCategoryPalette(categoryName?: string | null): CategoryPalette {
  const slug = slugify(categoryName);
  if (!slug) return DEFAULT_PALETTE;
  // Direct match or partial contains (e.g., "data-science" → data)
  if (PALETTES[slug]) return PALETTES[slug];
  for (const key of Object.keys(PALETTES)) {
    if (slug.includes(key)) return PALETTES[key];
  }
  return DEFAULT_PALETTE;
}
