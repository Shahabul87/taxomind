'use client';

import { useState, useCallback, useRef } from 'react';
import {
  BookOpen,
  Search,
  FileText,
  Quote,
  Link2,
  ExternalLink,
  Copy,
  Check,
  BookMarked,
  GraduationCap,
  Newspaper,
  Globe,
  Filter,
  SortAsc,
  Clock,
  Star,
  StarOff,
  Download,
  Plus,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
  Library,
  ScrollText,
  Users,
  Calendar,
  Hash,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Source {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: 'journal' | 'book' | 'conference' | 'website' | 'thesis';
  journal?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  citations: number;
  relevanceScore: number;
  isSaved: boolean;
}

interface Citation {
  id: string;
  sourceId: string;
  format: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee';
  text: string;
}

interface ResearchNote {
  id: string;
  sourceId: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface ResearchAssistantProps {
  userId: string;
  topicId?: string;
  className?: string;
}

export function ResearchAssistant({ userId, topicId, className }: ResearchAssistantProps) {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [savedSources, setSavedSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [citationFormat, setCitationFormat] = useState<Citation['format']>('apa');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'citations'>('relevance');

  const isLoadingRef = useRef(false);

  const searchSources = useCallback(async () => {
    if (!searchQuery.trim() || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Call the AI Research API
      const params = new URLSearchParams({
        action: 'search',
        query: searchQuery,
      });

      const response = await fetch(`/api/sam/ai-research?${params}`);

      if (!response.ok) {
        throw new Error('Failed to search academic sources');
      }

      const data = await response.json();

      // Transform API response to Source format
      const papers = data.papers || [];
      const transformedResults: Source[] = papers.map((paper: any) => ({
        id: paper.paperId || paper.id || crypto.randomUUID(),
        title: paper.title || 'Untitled',
        authors: paper.authors?.map((a: any) => a.name || a) || ['Unknown Author'],
        year: paper.publishDate ? new Date(paper.publishDate).getFullYear() : new Date().getFullYear(),
        type: mapPublicationType(paper.publication?.type || 'journal'),
        journal: paper.publication?.venue || paper.journal || undefined,
        doi: paper.publication?.doi || paper.doi || undefined,
        url: paper.publication?.url || paper.url || undefined,
        abstract: paper.abstract || undefined,
        citations: paper.citationCount || paper.citations || 0,
        relevanceScore: paper.relevanceScore || 80,
        isSaved: savedSources.some((s) => s.id === (paper.paperId || paper.id)),
      }));

      setSources(transformedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search sources');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [searchQuery, savedSources]);

  // Helper function to map publication types
  const mapPublicationType = (type: string): Source['type'] => {
    const typeMap: Record<string, Source['type']> = {
      journal: 'journal',
      conference: 'conference',
      book: 'book',
      thesis: 'thesis',
      website: 'website',
      preprint: 'journal',
      article: 'journal',
    };
    return typeMap[type.toLowerCase()] || 'journal';
  };

  const generateCitation = useCallback((source: Source, format: Citation['format']): string => {
    const authorsStr = source.authors.length > 2
      ? `${source.authors[0]} et al.`
      : source.authors.join(' & ');

    switch (format) {
      case 'apa':
        return `${authorsStr} (${source.year}). ${source.title}. ${source.journal || ''}${source.doi ? ` https://doi.org/${source.doi}` : ''}`;
      case 'mla':
        return `${source.authors.join(', ')}. "${source.title}." ${source.journal || ''}, ${source.year}.`;
      case 'chicago':
        return `${source.authors.join(', ')}. "${source.title}." ${source.journal || ''} (${source.year}).`;
      case 'harvard':
        return `${authorsStr}, ${source.year}. ${source.title}. ${source.journal || ''}.`;
      case 'ieee':
        return `${source.authors.map((a, i) => `[${i + 1}] ${a}`).join(', ')}, "${source.title}," ${source.journal || ''}, ${source.year}.`;
      default:
        return '';
    }
  }, []);

  const handleCopyCitation = useCallback(async (source: Source) => {
    const citation = generateCitation(source, citationFormat);
    await navigator.clipboard.writeText(citation);
    setCopiedId(source.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, [citationFormat, generateCitation]);

  const handleToggleSave = useCallback((sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, isSaved: !s.isSaved } : s))
    );
    const source = sources.find((s) => s.id === sourceId);
    if (source) {
      if (source.isSaved) {
        setSavedSources((prev) => prev.filter((s) => s.id !== sourceId));
      } else {
        setSavedSources((prev) => [...prev, { ...source, isSaved: true }]);
      }
    }
  }, [sources]);

  const getTypeIcon = (type: Source['type']) => {
    switch (type) {
      case 'journal':
        return ScrollText;
      case 'book':
        return BookOpen;
      case 'conference':
        return Users;
      case 'website':
        return Globe;
      case 'thesis':
        return GraduationCap;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: Source['type']) => {
    switch (type) {
      case 'journal':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'book':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'conference':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'website':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'thesis':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredSources = sources
    .filter((s) => sourceFilter === 'all' || s.type === sourceFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.year - a.year;
        case 'citations':
          return b.citations - a.citations;
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Research Assistant</CardTitle>
              <CardDescription>Find sources, generate citations, and organize research</CardDescription>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200">
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-4 w-4 text-cyan-600" />
              <span className="text-xs text-cyan-600 font-medium">Found</span>
            </div>
            <p className="text-2xl font-bold text-cyan-700">{sources.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Saved</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {sources.filter((s) => s.isSaved).length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Quote className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Citations</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {sources.filter((s) => s.isSaved).length}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="cite" className="flex items-center gap-2">
              <Quote className="h-4 w-4" />
              Cite
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search academic papers, books, and articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchSources()}
                  className="pl-9"
                />
              </div>
              <Button onClick={searchSources} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {/* Filters */}
            {sources.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Filter:</span>
                {['all', 'journal', 'book', 'conference', 'thesis'].map((filter) => (
                  <Button
                    key={filter}
                    variant={sourceFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort:</span>
                  <Button
                    variant={sortBy === 'relevance' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('relevance')}
                  >
                    Relevance
                  </Button>
                  <Button
                    variant={sortBy === 'date' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('date')}
                  >
                    Date
                  </Button>
                  <Button
                    variant={sortBy === 'citations' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('citations')}
                  >
                    Citations
                  </Button>
                </div>
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto mb-2" />
                <p className="text-gray-500">Searching academic databases...</p>
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Search for academic sources to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSources.map((source) => {
                  const TypeIcon = getTypeIcon(source.type);
                  return (
                    <div
                      key={source.id}
                      className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn('p-2 rounded-lg shrink-0', getTypeColor(source.type))}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 line-clamp-2">{source.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {source.authors.join(', ')} • {source.year}
                            </p>
                            {source.journal && (
                              <p className="text-sm text-gray-400 italic">{source.journal}</p>
                            )}
                            {source.abstract && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{source.abstract}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Quote className="h-3 w-3" />
                                {source.citations.toLocaleString()} citations
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {source.relevanceScore}% match
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSave(source.id)}
                          >
                            {source.isSaved ? (
                              <BookmarkCheck className="h-4 w-4 text-cyan-500" />
                            ) : (
                              <Bookmark className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCitation(source)}
                          >
                            {copiedId === source.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          {source.url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={source.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-4">
            {sources.filter((s) => s.isSaved).length === 0 ? (
              <div className="text-center py-12">
                <BookMarked className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved sources yet</p>
                <p className="text-sm text-gray-400">Save sources from search results to access them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sources
                  .filter((s) => s.isSaved)
                  .map((source) => {
                    const TypeIcon = getTypeIcon(source.type);
                    return (
                      <div
                        key={source.id}
                        className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-lg', getTypeColor(source.type))}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{source.title}</h4>
                            <p className="text-sm text-gray-500">
                              {source.authors.join(', ')} • {source.year}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSave(source.id)}
                          >
                            <BookmarkCheck className="h-4 w-4 text-cyan-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </TabsContent>

          {/* Cite Tab */}
          <TabsContent value="cite" className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Citation Format
              </h4>
              <div className="flex flex-wrap gap-2">
                {(['apa', 'mla', 'chicago', 'harvard', 'ieee'] as const).map((format) => (
                  <Button
                    key={format}
                    variant={citationFormat === format ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCitationFormat(format)}
                    className="uppercase"
                  >
                    {format}
                  </Button>
                ))}
              </div>
            </div>

            {sources.filter((s) => s.isSaved).length === 0 ? (
              <div className="text-center py-12">
                <Quote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No sources to cite</p>
                <p className="text-sm text-gray-400">Save sources to generate citations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sources
                  .filter((s) => s.isSaved)
                  .map((source) => (
                    <div
                      key={source.id}
                      className="p-4 rounded-xl border border-gray-200 bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{source.title}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCitation(source)}
                        >
                          {copiedId === source.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-700 font-mono">
                          {generateCitation(source, citationFormat)}
                        </p>
                      </div>
                    </div>
                  ))}

                {/* Export All */}
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Citations
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ResearchAssistant;
