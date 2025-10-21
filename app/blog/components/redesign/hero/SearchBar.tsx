"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Mic, Command, TrendingUp, Clock, Hash, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchSuggestion {
  type: 'recent' | 'trending' | 'category' | 'tag';
  value: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Search articles, topics, or ask a question..." }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock suggestions - In production, these would come from an API
  const mockSuggestions: SearchSuggestion[] = useMemo(() => [
    { type: 'trending', value: 'React 19 Features', icon: <TrendingUp className="w-4 h-4" />, count: 1250 },
    { type: 'trending', value: 'AI Development Guide', icon: <TrendingUp className="w-4 h-4" />, count: 980 },
    { type: 'recent', value: 'TypeScript Best Practices', icon: <Clock className="w-4 h-4" /> },
    { type: 'recent', value: 'Next.js Performance', icon: <Clock className="w-4 h-4" /> },
    { type: 'category', value: 'Web Development', icon: <Hash className="w-4 h-4" /> },
    { type: 'category', value: 'Machine Learning', icon: <Hash className="w-4 h-4" /> },
    { type: 'tag', value: 'tutorial', icon: <Hash className="w-4 h-4" /> },
    { type: 'tag', value: 'beginner-friendly', icon: <Hash className="w-4 h-4" /> },
  ], []);

  // Filter suggestions based on query
  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockSuggestions.filter(s =>
        s.value.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.length > 0 ? filtered : mockSuggestions.slice(0, 4));
    } else {
      setSuggestions(mockSuggestions.slice(0, 6));
    }
  }, [query, mockSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    // Simulate API delay
    setTimeout(() => {
      setIsSearching(false);
      onSearch?.(searchQuery);
      // Add to recent searches (in production, save to localStorage or API)
    }, 500);
  }, [onSearch]);

  // Handle voice search (mock implementation)
  const handleVoiceSearch = () => {
    setIsListening(!isListening);

    if (!isListening) {
      // Mock voice input
      setTimeout(() => {
        setQuery('AI powered search example');
        setIsListening(false);
      }, 2000);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape to clear/unfocus
      if (e.key === 'Escape') {
        if (query) {
          setQuery('');
        } else {
          inputRef.current?.blur();
        }
        setShowSuggestions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto">
      {/* Search Input Container */}
      <div className="relative group">
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 ${
          isFocused ? 'opacity-30' : ''
        }`} />

        {/* Search Input */}
        <div className={`relative flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border transition-all duration-300 ${
          isFocused
            ? 'border-purple-500/50 bg-white/15 shadow-2xl'
            : 'border-white/20 hover:border-white/30'
        }`}>
          {/* Search Icon */}
          <Search className={`w-5 h-5 transition-colors ${
            isFocused ? 'text-purple-400' : 'text-gray-400'
          }`} />

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query);
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-400 text-base"
            aria-label="Search"
          />

          {/* Loading Indicator */}
          {isSearching && (
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          )}

          {/* Clear Button */}
          {query && !isSearching && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Keyboard Shortcut */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-xs text-gray-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>

          {/* Voice Search */}
          <button
            onClick={handleVoiceSearch}
            className={`p-2 rounded-lg transition-all ${
              isListening
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            aria-label="Voice search"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50"
          >
            {/* Suggestions Header */}
            {query.length === 0 && (
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Quick Search
                </p>
              </div>
            )}

            {/* Suggestions List */}
            <div className="max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(suggestion.value);
                    handleSearch(suggestion.value);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left group"
                >
                  {/* Icon */}
                  <div className={`text-gray-400 group-hover:text-white transition-colors ${
                    suggestion.type === 'trending' ? 'text-orange-400' :
                    suggestion.type === 'recent' ? 'text-blue-400' :
                    suggestion.type === 'category' ? 'text-purple-400' :
                    'text-green-400'
                  }`}>
                    {suggestion.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="text-white group-hover:text-white transition-colors">
                      {suggestion.value}
                    </p>
                    {suggestion.count && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {suggestion.count.toLocaleString()} articles
                      </p>
                    )}
                  </div>

                  {/* Type Badge */}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    suggestion.type === 'trending'
                      ? 'bg-orange-500/20 text-orange-400'
                      : suggestion.type === 'recent'
                      ? 'bg-blue-500/20 text-blue-400'
                      : suggestion.type === 'category'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {suggestion.type}
                  </span>
                </button>
              ))}
            </div>

            {/* AI Assistant Footer */}
            <div className="px-4 py-3 border-t border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-xs text-gray-300">
                  AI Assistant ready to help with your search
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}