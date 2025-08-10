"use client"

import React from 'react';
import Image from 'next/image';
import { Search, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SearchOverlayProps } from '../types/header-types';

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isSearchOpen,
  searchContainerRef,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  handleKeyDown,
  handleCloseSearch,
  isSearching,
  searchResults,
  searchError,
  navigateToResult,
  highlightMatches,
  performSearch
}) => {
  // Add debug logging

  if (!isSearchOpen) return null;

  return (
    <div 
      className="fixed top-16 left-0 right-0 z-60 w-full dark:bg-gray-900/95 bg-white/95 backdrop-blur-md border-b dark:border-gray-800 border-gray-200 shadow-lg transition-all"
      ref={searchContainerRef}
    >
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative">
          <div className="flex items-center border-b-2 dark:border-gray-700 border-gray-300 pb-2">
            <Search className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search courses, blogs, and more..."
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mr-2"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <button 
              onClick={handleCloseSearch}
              className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Search Results */}
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">Searching...</span>
              </div>
            ) : searchError ? (
              <div className="flex flex-col items-center justify-center py-8 text-red-500">
                <AlertCircle className="h-8 w-8 mb-2" />
                <div className="text-center mb-4">
                  <p className="font-medium">Error: {searchError}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Something went wrong with the search</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => performSearch()}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                  </button>
                  {process.env.NODE_ENV === 'development' && (
                    <a 
                      href="/api/db-check" 
                      target="_blank"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      <span>Check DB</span>
                    </a>
                  )}
                </div>
              </div>
            ) : searchQuery.length >= 2 && searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-300">
                <div>No results found for &quot;{searchQuery}&quot;</div>
                {/* Debug button - only visible in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 space-y-3">
                    <button 
                      onClick={() => {

                        performSearch();
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm"
                    >
                      Debug: Force Search
                    </button>
                    
                    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-left">
                      <h4 className="text-sm font-semibold mb-1">Developer Tools:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <a 
                          href={`/api/search?q=${encodeURIComponent(searchQuery)}`}
                          target="_blank"
                          className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                        >
                          Test Database API
                        </a>
                        <a 
                          href={`/api/search/mock?q=${encodeURIComponent(searchQuery)}`}
                          target="_blank"
                          className="p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded"
                        >
                          Test Mock API
                        </a>
                        <a 
                          href="/api/db-check"
                          target="_blank"
                          className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded"
                        >
                          Check Database
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div 
                    key={`${result.type}-${result.id}`}
                    className="flex items-start p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => navigateToResult(result)}
                  >
                    {result.thumbnail && (
                      <div className="flex-shrink-0 mr-4 relative h-14 w-14">
                        <Image 
                          src={result.thumbnail} 
                          alt={result.title}
                          fill
                          sizes="56px"
                          className="object-cover rounded-md"
                          unoptimized={result.thumbnail.startsWith('https://utfs.io') || 
                            result.thumbnail.startsWith('https://ui-avatars.com') || 
                            result.thumbnail.startsWith('https://images.unsplash.com') || 
                            result.thumbnail.startsWith('https://res.cloudinary.com') || 
                            result.thumbnail.startsWith('http://res.cloudinary.com') || 
                            !result.thumbnail.startsWith('/')}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <h4 
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                          dangerouslySetInnerHTML={{
                            __html: highlightMatches(result.title, searchQuery)
                          }}
                        />
                        <Badge 
                          className={`ml-2 ${
                            result.type === 'course' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          }`}
                        >
                          {result.type}
                        </Badge>
                      </div>
                      <div 
                        className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 prose-sm"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatches(result.snippet, searchQuery)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 