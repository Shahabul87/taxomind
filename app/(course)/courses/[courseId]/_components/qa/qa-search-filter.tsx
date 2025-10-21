'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export type SortBy = 'recent' | 'top' | 'unanswered';

interface QASearchFilterProps {
  sections?: Array<{
    id: string;
    title: string;
  }>;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: SortBy) => void;
  onSectionChange: (sectionId: string) => void;
  defaultSort?: SortBy;
}

export const QASearchFilter = ({
  sections = [],
  onSearchChange,
  onSortChange,
  onSectionChange,
  defaultSort = 'recent',
}: QASearchFilterProps) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>(defaultSort);
  const [sectionId, setSectionId] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Notify parent of search changes
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleSortChange = (value: string) => {
    const newSort = value as SortBy;
    setSortBy(newSort);
    onSortChange(newSort);
  };

  const handleSectionChange = (value: string) => {
    setSectionId(value);
    onSectionChange(value === 'all' ? '' : value);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSortBy('recent');
    setSectionId('all');
    onSearchChange('');
    onSortChange('recent');
    onSectionChange('');
  };

  const hasActiveFilters = search !== '' || sortBy !== 'recent' || sectionId !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="top">Top Voted</SelectItem>
            <SelectItem value="unanswered">Unanswered</SelectItem>
          </SelectContent>
        </Select>

        {/* Section Filter */}
        {sections.length > 0 && (
          <Select value={sectionId} onValueChange={handleSectionChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="whitespace-nowrap"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {search && (
              <Badge variant="secondary">
                Search: {search}
                <button
                  onClick={() => setSearch('')}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {sortBy !== 'recent' && (
              <Badge variant="secondary">
                Sort: {sortBy === 'top' ? 'Top Voted' : 'Unanswered'}
                <button
                  onClick={() => handleSortChange('recent')}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {sectionId !== 'all' && (
              <Badge variant="secondary">
                Section: {sections.find((s) => s.id === sectionId)?.title}
                <button
                  onClick={() => handleSectionChange('all')}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
