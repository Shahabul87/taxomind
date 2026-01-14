'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Video,
  Image as ImageIcon,
  FileAudio,
  FileText,
  Play,
  Pause,
  Download,
  Search,
  Filter,
  Plus,
  Clock,
  Eye,
  Heart,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Upload,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  Volume2,
  Film,
  Presentation,
  Music,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'image' | 'audio' | 'document' | 'presentation';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  size: string;
  views: number;
  likes: number;
  tags: string[];
  createdAt: string;
  isSaved: boolean;
  isAIGenerated: boolean;
}

interface GenerationRequest {
  type: 'video' | 'image' | 'audio' | 'presentation';
  prompt: string;
  style?: string;
  duration?: number;
}

interface MultimediaLibraryProps {
  userId: string;
  courseId?: string;
  className?: string;
}

export function MultimediaLibrary({ userId, courseId, className }: MultimediaLibraryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateType, setGenerateType] = useState<GenerationRequest['type']>('image');

  const isLoadingRef = useRef(false);

  const fetchMediaLibrary = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Simulated data - replace with actual API call
      const mockData: MediaItem[] = [
        {
          id: '1',
          title: 'Introduction to Machine Learning',
          description: 'A comprehensive video explaining ML fundamentals',
          type: 'video',
          url: '/media/ml-intro.mp4',
          thumbnailUrl: '/thumbnails/ml-intro.jpg',
          duration: 1245,
          size: '156 MB',
          views: 2456,
          likes: 342,
          tags: ['machine learning', 'AI', 'beginner'],
          createdAt: '2024-01-15',
          isSaved: true,
          isAIGenerated: false,
        },
        {
          id: '2',
          title: 'Neural Network Architecture Diagram',
          description: 'AI-generated visualization of neural network layers',
          type: 'image',
          url: '/media/nn-diagram.png',
          thumbnailUrl: '/thumbnails/nn-diagram.png',
          size: '2.4 MB',
          views: 1823,
          likes: 256,
          tags: ['neural networks', 'diagram', 'visualization'],
          createdAt: '2024-01-18',
          isSaved: false,
          isAIGenerated: true,
        },
        {
          id: '3',
          title: 'Data Structures Explained',
          description: 'Audio lecture covering arrays, trees, and graphs',
          type: 'audio',
          url: '/media/ds-lecture.mp3',
          duration: 2340,
          size: '45 MB',
          views: 987,
          likes: 145,
          tags: ['data structures', 'programming', 'lecture'],
          createdAt: '2024-01-20',
          isSaved: false,
          isAIGenerated: false,
        },
        {
          id: '4',
          title: 'Python Cheat Sheet',
          description: 'Quick reference guide for Python syntax',
          type: 'document',
          url: '/media/python-cheatsheet.pdf',
          size: '1.2 MB',
          views: 4521,
          likes: 678,
          tags: ['python', 'reference', 'programming'],
          createdAt: '2024-01-10',
          isSaved: true,
          isAIGenerated: false,
        },
        {
          id: '5',
          title: 'API Design Best Practices',
          description: 'AI-generated presentation on RESTful API design',
          type: 'presentation',
          url: '/media/api-design.pptx',
          size: '8.5 MB',
          views: 1234,
          likes: 189,
          tags: ['API', 'design', 'REST'],
          createdAt: '2024-01-22',
          isSaved: false,
          isAIGenerated: true,
        },
        {
          id: '6',
          title: 'Database Normalization Tutorial',
          description: 'Step-by-step video on database normalization forms',
          type: 'video',
          url: '/media/db-normalization.mp4',
          thumbnailUrl: '/thumbnails/db-normalization.jpg',
          duration: 1890,
          size: '234 MB',
          views: 3456,
          likes: 445,
          tags: ['database', 'SQL', 'normalization'],
          createdAt: '2024-01-12',
          isSaved: true,
          isAIGenerated: false,
        },
      ];

      setMediaItems(mockData);
      setFilteredItems(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media library');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

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
    (filter: string) => {
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

  const handleGenerate = useCallback(async () => {
    if (!generatePrompt.trim()) return;
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate generation progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      setIsGenerating(false);
      setShowGenerateModal(false);
      setGeneratePrompt('');
      setGenerationProgress(0);
      // Would add the generated item to the library
    }, 5000);
  }, [generatePrompt]);

  const getTypeIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'video':
        return Film;
      case 'image':
        return ImageIcon;
      case 'audio':
        return Music;
      case 'document':
        return FileText;
      case 'presentation':
        return Presentation;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: MediaItem['type']) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'image':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'audio':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'document':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'presentation':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load data on mount
  useState(() => {
    fetchMediaLibrary();
  });

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
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Multimedia Library</CardTitle>
              <CardDescription>Browse, generate, and manage learning media</CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <Film className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-600 font-medium">Videos</span>
            </div>
            <p className="text-2xl font-bold text-red-700">
              {mediaItems.filter((m) => m.type === 'video').length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Images</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {mediaItems.filter((m) => m.type === 'image').length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Music className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Audio</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {mediaItems.filter((m) => m.type === 'audio').length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Docs</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {mediaItems.filter((m) => m.type === 'document' || m.type === 'presentation').length}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Generate Modal */}
        {showGenerateModal && (
          <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              AI Media Generation
            </h4>

            {isGenerating ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Generating your {generateType}...</p>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-gray-500 text-center">{generationProgress}% complete</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['image', 'video', 'audio', 'presentation'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={generateType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGenerateType(type)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Describe what you want to generate..."
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleGenerate} disabled={!generatePrompt.trim()}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-3 mb-4">
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
          {['all', 'video', 'image', 'audio', 'document', 'presentation'].map((filter) => (
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
            <p className="text-gray-500">No media found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                    {item.isAIGenerated && (
                      <Badge className="absolute top-2 left-2 bg-indigo-500 text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary">
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
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {item.likes}
                      </span>
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
                      {item.isAIGenerated && (
                        <Badge className="bg-indigo-100 text-indigo-700 shrink-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{item.size}</span>
                      {item.duration && <span>{formatDuration(item.duration)}</span>}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.views}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
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
