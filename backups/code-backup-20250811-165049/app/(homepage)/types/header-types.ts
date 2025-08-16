export interface HeaderAfterLoginProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    isTwoFactorEnabled?: boolean;
    isOAuth?: boolean;
  } | null;
}

export interface SearchResult {
  id: string;
  title: string;
  type: 'course' | 'blog';
  snippet: string;
  thumbnail?: string;
}

export interface SearchOverlayProps {
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  searchError?: string | null;
  handleCloseSearch: () => void;
  navigateToResult: (result: SearchResult) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  highlightMatches: (text: string, query: string) => string;
  searchInputRef: React.RefObject<HTMLInputElement>;
  searchContainerRef: React.RefObject<HTMLDivElement>;
  performSearch: () => Promise<void>;
} 