'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Eye,
  Clock,
  TrendingUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface VideoAnalytics {
  videoId: string;
  title: string;
  totalViews: number;
  uniqueViewers: number;
  averageWatchTime: number;
  completionRate: number;
  averageEngagementScore: number;
  dropOffPoints: Array<{
    time: number;
    percentage: number;
    viewers: number;
  }>;
  heatmapData: Array<{
    time: number;
    intensity: number;
    rewatches: number;
  }>;
  interactionStats: {
    totalPauses: number;
    totalSeeks: number;
    speedChanges: number;
    qualityChanges: number;
  };
  strugglingSegments: Array<{
    startTime: number;
    endTime: number;
    studentCount: number;
    avgStruggles: number;
  }>;
  viewerSegments: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

interface VideoAnalyticsDashboardProps {
  courseId: string;
  isTeacher?: boolean;
}

export function VideoAnalyticsDashboard({ courseId, isTeacher = false }: VideoAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<VideoAnalytics[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchVideoAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/video-analytics?courseId=${courseId}&timeRange=${timeRange}`
      );
      const data = await response.json();
      setAnalytics(data.videos || []);
      if (data.videos?.length > 0 && !selectedVideo) {
        setSelectedVideo(data.videos[0]);
      }
    } catch (error: any) {
      logger.error('Failed to fetch video analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId, timeRange, selectedVideo]);

  useEffect(() => {
    fetchVideoAnalytics();
  }, [fetchVideoAnalytics]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Video analytics are only available for course instructors.
        </p>
      </div>
    );
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Video Analytics</h2>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <Button onClick={fetchVideoAnalytics} size="sm" variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.reduce((sum, v) => sum + v.totalViews, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                analytics.reduce((sum, v) => sum + v.completionRate, 0) / analytics.length || 0
              )}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(
                analytics.reduce((sum, v) => sum + v.averageWatchTime, 0) / analytics.length || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {analytics.map((video) => (
              <div
                key={video.videoId}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedVideo?.videoId === video.videoId
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedVideo(video)}
              >
                <div className="font-medium text-sm mb-1 truncate">{video.title}</div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{video.totalViews} views</span>
                  <span>{Math.round(video.completionRate)}% completion</span>
                </div>
                <Progress value={video.completionRate} className="h-1 mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Selected Video Details */}
        {selectedVideo && (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedVideo.title}</span>
                  <Badge variant="secondary">
                    {selectedVideo.totalViews} views
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                    <TabsTrigger value="issues">Issues</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Unique Viewers</div>
                        <div className="text-2xl font-bold">{selectedVideo.uniqueViewers}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Watch Time</div>
                        <div className="text-2xl font-bold">
                          {formatTime(selectedVideo.averageWatchTime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                        <div className="text-2xl font-bold">{Math.round(selectedVideo.completionRate)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Engagement Score</div>
                        <div className="text-2xl font-bold">
                          {Math.round(selectedVideo.averageEngagementScore)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Viewer Segments</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            dataKey="value"
                            data={selectedVideo.viewerSegments}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                          >
                            {selectedVideo.viewerSegments.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedVideo.viewerSegments.map((segment, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: segment.color }}
                            />
                            <span>{segment.name}: {segment.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="engagement" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Interactions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Pauses</span>
                            <span className="font-medium">{selectedVideo.interactionStats.totalPauses}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Seeks</span>
                            <span className="font-medium">{selectedVideo.interactionStats.totalSeeks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Speed Changes</span>
                            <span className="font-medium">{selectedVideo.interactionStats.speedChanges}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Drop-off Points</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={120}>
                            <AreaChart data={selectedVideo.dropOffPoints}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="time"
                                tickFormatter={(value) => formatTime(value)}
                                fontSize={10}
                              />
                              <YAxis fontSize={10} />
                              <Tooltip
                                labelFormatter={(value) => `Time: ${formatTime(value)}`}
                                formatter={(value) => [`${value}%`, 'Viewers Remaining']}
                              />
                              <Area
                                type="monotone"
                                dataKey="percentage"
                                stroke="#8884d8"
                                fill="#8884d8"
                                fillOpacity={0.3}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="heatmap" className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Video Heatmap</h4>
                      <div className="relative h-8 bg-muted rounded overflow-hidden">
                        {selectedVideo.heatmapData.map((point, i) => (
                          <div
                            key={i}
                            className="absolute h-full"
                            style={{
                              left: `${(point.time / 1800) * 100}%`, // Assuming 30min video
                              width: '2px',
                              backgroundColor: `rgba(239, 68, 68, ${point.intensity})`,
                              opacity: point.intensity
                            }}
                            title={`${formatTime(point.time)}: ${point.rewatches} rewatches`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0:00</span>
                        <span>Most watched segments</span>
                        <span>End</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Top Rewatched Segments</h4>
                      <div className="space-y-2">
                        {selectedVideo.heatmapData
                          .sort((a, b) => b.rewatches - a.rewatches)
                          .slice(0, 5)
                          .map((segment, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span>{formatTime(segment.time)}</span>
                              <Badge variant="secondary">{segment.rewatches} rewatches</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="issues" className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Struggling Segments
                      </h4>
                      {selectedVideo.strugglingSegments.length > 0 ? (
                        <div className="space-y-2">
                          {selectedVideo.strugglingSegments.map((segment, i) => (
                            <Card key={i} className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-sm">
                                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {segment.studentCount} students struggling
                                  </div>
                                </div>
                                <Badge variant="destructive">
                                  {segment.avgStruggles.toFixed(1)} issues/student
                                </Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No struggling segments detected.
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                      <div className="space-y-2 text-sm">
                        {selectedVideo.completionRate < 50 && (
                          <div className="p-2 bg-orange-50 border border-orange-200 rounded text-orange-800">
                            Low completion rate. Consider breaking this video into shorter segments.
                          </div>
                        )}
                        {selectedVideo.strugglingSegments.length > 2 && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                            Multiple struggling segments detected. Review content clarity.
                          </div>
                        )}
                        {selectedVideo.averageEngagementScore < 60 && (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                            Low engagement score. Consider adding interactive elements.
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}