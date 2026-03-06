import React from 'react';
import { render, screen } from '@testing-library/react';

import QuickLinks from '@/components/dashboard/quick-links';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/** Create a mock favorites array of the given length. */
const buildFavorites = (count: number): Array<{ id: string }> =>
  Array.from({ length: count }, (_, i) => ({ id: `fav-${i}` }));

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

describe('QuickLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- 1. Renders 4 category links ------------------------------------
  it('renders exactly 4 category links', () => {
    render(<QuickLinks />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('renders the section heading "Favorites"', () => {
    render(<QuickLinks />);

    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('renders all 4 category titles', () => {
    render(<QuickLinks />);

    expect(screen.getByText('Favorite Videos')).toBeInTheDocument();
    expect(screen.getByText('Favorite Audios')).toBeInTheDocument();
    expect(screen.getByText('Favorite Blogs')).toBeInTheDocument();
    expect(screen.getByText('Favorite Articles')).toBeInTheDocument();
  });

  // -- 2. Shows correct count badges ---------------------------------
  it('shows count badges matching the provided array lengths', () => {
    render(
      <QuickLinks
        favoriteVideos={buildFavorites(5)}
        favoriteAudios={buildFavorites(12)}
        favoriteBlogs={buildFavorites(3)}
        favoriteArticles={buildFavorites(8)}
      />,
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  // -- 3. Links navigate to correct routes ----------------------------
  it('links each category to the correct route', () => {
    render(<QuickLinks />);

    const videosLink = screen.getByText('Favorite Videos').closest('a');
    expect(videosLink).toHaveAttribute('href', '/dashboard/user/favoritevideos');

    const audiosLink = screen.getByText('Favorite Audios').closest('a');
    expect(audiosLink).toHaveAttribute('href', '/dashboard/user/favoriteaudios');

    const blogsLink = screen.getByText('Favorite Blogs').closest('a');
    expect(blogsLink).toHaveAttribute('href', '/dashboard/user/favoriteblogs');

    const articlesLink = screen.getByText('Favorite Articles').closest('a');
    expect(articlesLink).toHaveAttribute('href', '/dashboard/user/favoritearticles');
  });

  // -- 4. Shows 0 count when arrays are empty/undefined ---------------
  it('shows 0 for all counts when no props are provided (defaults)', () => {
    render(<QuickLinks />);

    const zeroCounts = screen.getAllByText('0');
    expect(zeroCounts).toHaveLength(4);
  });

  it('shows 0 when arrays are explicitly empty', () => {
    render(
      <QuickLinks
        favoriteVideos={[]}
        favoriteAudios={[]}
        favoriteBlogs={[]}
        favoriteArticles={[]}
      />,
    );

    const zeroCounts = screen.getAllByText('0');
    expect(zeroCounts).toHaveLength(4);
  });

  it('shows 0 for undefined arrays while showing counts for defined ones', () => {
    render(
      <QuickLinks
        favoriteVideos={buildFavorites(7)}
        favoriteAudios={undefined}
        favoriteBlogs={buildFavorites(2)}
        favoriteArticles={undefined}
      />,
    );

    // Videos: 7, Audios: 0, Blogs: 2, Articles: 0
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    const zeroCounts = screen.getAllByText('0');
    expect(zeroCounts).toHaveLength(2);
  });

  // -- 5. Shows correct icons for each category ----------------------
  it('renders an icon for each category link', () => {
    render(<QuickLinks />);

    // The lucide-react mock renders <svg> elements for each icon.
    // Each category row has two SVGs: the category icon and a ChevronRight.
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      const svgs = link.querySelectorAll('svg');
      // Expect at least 2 SVGs per link: the category icon + the ChevronRight
      expect(svgs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders a total of 8 svg icons (4 category + 4 chevrons)', () => {
    const { container } = render(<QuickLinks />);

    // Each of 4 categories has 2 icons: a category-specific icon + ChevronRight
    const allSvgs = container.querySelectorAll('svg');
    expect(allSvgs).toHaveLength(8);
  });

  // -- Bonus: large counts render correctly ---------------------------
  it('renders large counts without truncation', () => {
    render(
      <QuickLinks
        favoriteVideos={buildFavorites(999)}
        favoriteAudios={buildFavorites(100)}
        favoriteBlogs={buildFavorites(50)}
        favoriteArticles={buildFavorites(1)}
      />,
    );

    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
