'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Video,
  Image as ImageIcon,
  Play,
  Download,
  Search,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  Film,
  Music,
  Layers,
  Sparkles,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AccessibleCourse {
  id: string;
  title: string;
  description: string | null;
}

type MediaType = 'video' | 'audio' | 'interactive';

interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  url?: string;
  duration?: number;
  format?: string;
  tags: string[];
  createdAt: string;
  isSaved: boolean;
  engagementScore?: number;
  accessibilityScore?: number;
  effectivenessScore?: number;
}

interface MultimediaLibraryProps {
  userId: string;
  courseId?: string;
  className?: string;
}

const INTERACTIVE_TYPES = ['quiz', 'simulation', 'game', 'ar', 'vr', 'lab'] as const;

export function MultimediaLibrary({ userId: _userId, courseId, className }: MultimediaLibraryProps) {
  const [courses, setCourses] = useState<AccessibleCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId ?? '');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | MediaType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<MediaType>('video');
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [analysisFormat, setAnalysisFormat] = useState('');
  const [analysisDuration, setAnalysisDuration] = useState('');
  const [analysisInteractiveType, setAnalysisInteractiveType] = useState<(typeof INTERACTIVE_TYPES)[number]>('quiz');
  const [analysisElementCount, setAnalysisElementCount] = useState('3');
  const [analysisElementType, setAnalysisElementType] = useState('activity');

  const isLoadingRef = useRef(false);

  const fetchAccessibleCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/sam/courses/accessible');
      if (!response.ok) {
        throw new Error('Failed to load courses');
      }

      const payload = await response.json();
      const list = (payload.data ?? []) as AccessibleCourse[];
      setCourses(list);

      if (!selectedCourseId && list.length > 0) {
        setSelectedCourseId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    }
  }, [selectedCourseId]);

  const mapAnalysisToItem = (analysis: any): MediaItem => {
    const type = analysis.contentType as MediaType;
    const url = analysis.contentUrl || undefined;
    const metadata = analysis.metadata ?? {};
    const tagCandidates: string[] =
      analysis.analysis?.teachingMethods ||
      analysis.analysis?.keyTopics ||
      analysis.analysis?.skillsAssessed ||
      analysis.analysis?.bloomsLevels ||
      [];

    const titleSource = url ? url.split('/').pop() : null;
    const title = titleSource
      ? `${type.toUpperCase()} • ${titleSource}`
      : `${type.toUpperCase()} Analysis`;

    const recommendation =
      analysis.analysis?.recommendedImprovements?.[0] ||
      analysis.analysis?.recommendedEnhancements?.[0];

    return {
      id: analysis.id,
      title,
      description: recommendation ? `AI suggestion: ${recommendation}` : 'AI analysis ready',
      type,
      url,
      duration: typeof metadata.duration === 'number' ? metadata.duration : undefined,
      format: metadata.format,
      tags: tagCandidates.slice(0, 4),
      createdAt: analysis.createdAt,
      isSaved: false,
      engagementScore: analysis.engagementScore ?? undefined,
      accessibilityScore: analysis.accessibilityScore ?? undefined,
      effectivenessScore: analysis.effectivenessScore ?? undefined,
    };
  };

  const fetchMediaLibrary = useCallback(async () => {
    if (!selectedCourseId || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sam/multimedia-analysis?courseId=${selectedCourseId}&reportType=library`
      );

      if (!response.ok) {
        throw new Error('Failed to load media analyses');
      }

      const payload = await response.json();
      const items = (payload.data ?? []).map(mapAnalysisToItem);

      setMediaItems(items);
      setFilteredItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media library');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchAccessibleCourses();
  }, [fetchAccessibleCourses]);

  useEffect(() => {
    fetchMediaLibrary();
  }, [fetchMediaLibrary]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const filtered = mediaItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredItems(
        activeFilter === 'all' ? filtered : filtered.filter((item) => item.type === activeFilter)
      );
    },
    [mediaItems, activeFilter]
  );

  const handleFilterChange = useCallback(
    (filter: 'all' | MediaType) => {
      setActiveFilter(filter);
      const filtered =
        filter === 'all' ? mediaItems : mediaItems.filter((item) => item.type === filter);
      setFilteredItems(
        searchQuery
          ? filtered.filter(
              (item) =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : filtered
      );
    },
    [mediaItems, searchQuery]
  );

  const handleToggleSave = useCallback((itemId: string) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isSaved: !item.isSaved } : item))
    );
    setFilteredItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isSaved: !item.isSaved } : item))
    );
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedCourseId) {
      setAnalysisError('Select a course to analyze media.');
      return;
    }

    if (!analysisFormat.trim()) {
      setAnalysisError('Format is required.');
      return;
    }

    const durationValue = Number(analysisDuration);
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      setAnalysisError('Duration must be a positive number.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress(15);

    const contentData: Record<string, unknown> = {
      url: analysisUrl.trim() || undefined,
      duration: durationValue,
      format: analysisFormat.trim(),
    };

    if (analysisType === 'interactive') {
      const elementCount = Math.max(1, Number(analysisElementCount) || 1);
      const elements = Array.from({ length: elementCount }).map((_, index) => ({
        id: `element-${index + 1}`,
        type: analysisElementType.trim() || 'activity',
        properties: {},
        interactions: ['click'],
      }));

      contentData.type = analysisInteractiveType;
      contentData.elements = elements;
    }

    try {
      const response = await fetch('/api/sam/multimedia-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          contentType: analysisType,
          contentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      setAnalysisProgress(100);
      await fetchMediaLibrary();
      setShowAnalyzeModal(false);
      setAnalysisUrl('');
      setAnalysisFormat('');
      setAnalysisDuration('');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze media');
    } finally {
      setTimeout(() => setAnalysisProgress(0), 400);
      setIsAnalyzing(false);
    }
  }, [
    analysisDuration,
    analysisElementCount,
    analysisElementType,
    analysisFormat,
    analysisInteractiveType,
    analysisType,
    analysisUrl,
    fetchMediaLibrary,
    selectedCourseId,
  ]);

  const getTypeIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'video':
        return Film;
      case 'audio':
        return Music;
      case 'interactive':
        return Layers;
      default:
        return ImageIcon;
    }
  };

  const getTypeColor = (type: MediaItem['type']) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'audio':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'interactive':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const averageEngagement =
    mediaItems.length > 0
      ? Math.round(
          mediaItems.reduce((sum, item) => sum + (item.engagementScore ?? 0), 0) /
            mediaItems.length
        )
      : 0;

  if (isLoading && mediaItems.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-muted-foreground">Loading Media Library...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" onClick={fetchMediaLibrary} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg">
              <Video className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Multimedia Library</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Analyze and track your learning media quality</CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-full sm:w-[240px] text-xs sm:text-sm">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowAnalyzeModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 w-full sm:w-auto text-xs sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Analyze Media
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4 md:grid-cols-4">
          <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Film className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
              <span className="text-[10px] sm:text-xs text-red-600 font-medium">Videos</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-700">
              {mediaItems.filter((m) => m.type === 'video').length}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Music className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
              <span className="text-[10px] sm:text-xs text-purple-600 font-medium">Audio</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-700">
              {mediaItems.filter((m) => m.type === 'audio').length}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
              <span className="text-[10px] sm:text-xs text-amber-600 font-medium">Interactive</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-700">
              {mediaItems.filter((m) => m.type === 'interactive').length}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 shrink-0" />
              <span className="text-[10px] sm:text-xs text-indigo-600 font-medium">Avg Engagement</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-indigo-700">{averageEngagement}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Analyze Modal */}
        {showAnalyzeModal && (
          <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Media Analysis Setup
            </h4>

            {analysisError && (
              <div className="mb-3 text-sm text-red-600">{analysisError}</div>
            )}

            {isAnalyzing ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Analyzing your {analysisType}...</p>
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-xs text-gray-500 text-center">{analysisProgress}% complete</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(['video', 'audio', 'interactive'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={analysisType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAnalysisType(type)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>

                <Input
                  placeholder="Media URL (optional)"
                  value={analysisUrl}
                  onChange={(e) => setAnalysisUrl(e.target.value)}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Format (mp4, mp3, json)"
                    value={analysisFormat}
                    onChange={(e) => setAnalysisFormat(e.target.value)}
                  />
                  <Input
                    placeholder="Duration in seconds"
                    value={analysisDuration}
                    onChange={(e) => setAnalysisDuration(e.target.value)}
                  />
                </div>

                {analysisType === 'interactive' && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <Select value={analysisInteractiveType} onValueChange={(value) => setAnalysisInteractiveType(value as (typeof INTERACTIVE_TYPES)[number])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Interactive type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERACTIVE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Element type"
                      value={analysisElementType}
                      onChange={(e) => setAnalysisElementType(e.target.value)}
                    />
                    <Input
                      placeholder="Element count"
                      value={analysisElementCount}
                      onChange={(e) => setAnalysisElementCount(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleAnalyze} disabled={!selectedCourseId}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                  <Button variant="outline" onClick={() => setShowAnalyzeModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(['all', 'video', 'audio', 'interactive'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(filter)}
              className="capitalize shrink-0"
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Media Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No media analyses found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <TypeIcon className="h-12 w-12 text-gray-400" />
                    {item.duration && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                        {formatDuration(item.duration)}
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" disabled={!item.url}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{item.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => handleToggleSave(item.id)}
                      >
                        {item.isSaved ? (
                          <BookmarkCheck className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <Bookmark className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <Badge className={cn('text-xs', getTypeColor(item.type))}>{item.type}</Badge>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <span>Eng: {item.engagementScore ?? '—'}</span>
                      <span>Acc: {item.accessibilityScore ?? '—'}</span>
                      <span>Eff: {item.effectivenessScore ?? '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div
                    className={cn(
                      'p-3 rounded-lg shrink-0',
                      getTypeColor(item.type)
                    )}
                  >
                    <TypeIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{item.format || 'n/a'}</span>
                      {item.duration && <span>{formatDuration(item.duration)}</span>}
                      <span>Engagement: {item.engagementScore ?? '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={!item.url}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSave(item.id)}
                    >
                      {item.isSaved ? (
                        <BookmarkCheck className="h-4 w-4 text-indigo-500" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MultimediaLibrary;
