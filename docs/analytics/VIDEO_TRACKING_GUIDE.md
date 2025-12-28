# Video Interaction Tracking Guide

## Overview
The video tracking system captures detailed analytics about how students interact with video content, including play/pause behavior, seeking patterns, engagement metrics, and struggle detection.

## Core Components

### 1. Video Tracking Hook (`useVideoTracking`)

The main hook that tracks all video interactions:

```typescript
import { useVideoTracking } from '@/hooks/use-video-tracking';

function VideoPlayer({ videoId, courseId }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { metrics, trackCustomEvent } = useVideoTracking(
    videoRef.current,
    {
      videoId,
      courseId,
      trackEngagement: true,
      trackQuality: true,
      trackSpeed: true,
      trackSeekBehavior: true,
      heartbeatInterval: 15 // seconds
    }
  );

  return (
    <video ref={videoRef} src="video.mp4" />
  );
}
```

### 2. Video Controls Tracking (`useVideoControlsTracking`)

Tracks user interactions with video controls:

```typescript
import { useVideoControlsTracking } from '@/hooks/use-video-tracking';

function VideoControls({ videoId, courseId }) {
  const { trackControlClick, trackVolumeChange } = useVideoControlsTracking(
    videoId,
    courseId
  );

  return (
    <div>
      <button onClick={() => trackControlClick('play')}>
        Play
      </button>
      <input
        type="range"
        onChange={(e) => trackVolumeChange(Number(e.target.value), currentVolume)}
      />
    </div>
  );
}
```

### 3. Complete Video Player (`TrackedVideoPlayer`)

A full-featured video player with integrated tracking:

```typescript
import { TrackedVideoPlayer } from '@/components/video/tracked-video-player';

function VideoLesson({ video, courseId }) {
  return (
    <TrackedVideoPlayer
      videoId={video.id}
      src={video.url}
      title={video.title}
      courseId={courseId}
      showAnalytics={true}
    />
  );
}
```

## Tracked Events

### Core Video Events

#### Session Events
- `video_session_start` - Video player initialized
- `video_play` - Video starts playing
- `video_pause` - Video paused
- `video_complete` - Video finished

#### Progress Events
- `video_progress` - Periodic progress updates (heartbeat)
- `video_seek` - User jumps to different time
- `video_speed_change` - Playback speed modified
- `video_quality_change` - Video quality changed

#### Control Events
- `video_control_click` - UI control interactions
- `video_interaction` - Custom interactions

### Event Properties

Each event includes detailed metadata:

```json
{
  "eventType": "video",
  "eventName": "video_pause",
  "properties": {
    "videoId": "video123",
    "currentTime": 125.5,
    "duration": 600,
    "watchDuration": 15000,
    "pauseCount": 3,
    "consecutiveWatchTime": 45.2,
    "playbackRate": 1.25,
    "volume": 0.8
  },
  "courseId": "course123",
  "sectionId": "section456"
}
```

## Metrics Tracked

### Real-time Metrics

```typescript
interface VideoMetrics {
  watchTime: number;                    // Total time watched (seconds)
  totalPauses: number;                  // Number of pause events
  totalSeeks: number;                   // Number of seek events
  engagementScore: number;              // 0-100 engagement score
  completionRate: number;               // Percentage completed
  averagePlaybackSpeed: number;         // Average speed (1.0 = normal)
  qualityChanges: number;               // Number of quality adjustments
  maxConsecutiveWatchTime: number;      // Longest uninterrupted viewing
  strugglingSegments: number[];         // Time points where user struggled
  rewatchedSegments: number[];          // Time points that were rewatched
}
```

### Engagement Score Calculation

The engagement score is calculated based on:
- **Progress (40%)**: How much of the video was watched
- **Pause penalty**: Excessive pausing reduces score
- **Seek penalty**: Too much seeking indicates confusion
- **Consistency bonus**: Long uninterrupted viewing sessions
- **Speed factor**: Optimal playback speed usage

```typescript
// Simplified calculation
function calculateEngagementScore(metrics: VideoMetrics): number {
  let score = (completionRate / 100) * 40; // Base from progress
  score -= Math.min(pauseRatio * 5, 20);   // Pause penalty
  score -= Math.min(seekRatio * 3, 15);    // Seek penalty
  score += Math.min(consecutiveTime / 60 * 10, 20); // Consistency bonus
  score += Math.min((1 - speedVariance) * 10, 10);  // Speed bonus
  
  return Math.max(0, Math.min(100, score));
}
```

## Struggle Detection

The system automatically detects when students are struggling:

### Struggle Indicators
1. **Multiple seeks in short time** (3+ seeks in 30 seconds)
2. **Short backward seeks** (< 30 seconds, indicating confusion)
3. **Frequent pausing** (multiple pauses with short watch time)
4. **Repeated section viewing** (seeking back to same segment)

### Automatic Flagging
When struggle is detected:
```typescript
// Automatically creates content flags
await db.contentFlag.create({
  data: {
    contentType: 'video',
    contentId: videoId,
    flagType: 'struggle_point',
    metadata: {
      timestamp: currentTime,
      studentCount: affectedStudents,
      avgStruggles: strugglesPerStudent
    }
  }
});
```

## Video Analytics Dashboard

### Teacher Analytics

The video analytics dashboard provides:

#### Overview Metrics
- Total views across all videos
- Average completion rates
- Engagement scores
- Watch time statistics

#### Per-Video Analytics
- **Viewer Segments**: Completed, partial, early exit
- **Drop-off Points**: Where students stop watching
- **Heatmap**: Most watched/rewatched segments
- **Struggle Points**: Areas where students have difficulty
- **Interaction Stats**: Pauses, seeks, speed changes

#### Visual Analytics
- Completion rate charts
- Engagement heatmaps
- Drop-off curves
- Interaction pattern analysis

### Usage Example

```typescript
import { VideoAnalyticsDashboard } from '@/components/video/video-analytics-dashboard';

function TeacherAnalytics({ courseId }) {
  return (
    <VideoAnalyticsDashboard 
      courseId={courseId} 
      isTeacher={true} 
    />
  );
}
```

## API Endpoints

### Get Video Analytics
```http
GET /api/analytics/video-analytics?courseId=123&timeRange=7d
```

**Response:**
```json
{
  "videos": [
    {
      "videoId": "video123",
      "title": "Introduction to React",
      "totalViews": 150,
      "uniqueViewers": 120,
      "averageWatchTime": 450,
      "completionRate": 78.5,
      "averageEngagementScore": 82.3,
      "dropOffPoints": [...],
      "heatmapData": [...],
      "interactionStats": {...},
      "strugglingSegments": [...]
    }
  ]
}
```

### Get Single Video Analytics
```http
GET /api/analytics/video-analytics?videoId=123&timeRange=30d
```

## Implementation Examples

### Basic Video with Tracking

```typescript
function SimpleVideoPlayer({ video, courseId }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { metrics } = useVideoTracking(videoRef.current, {
    videoId: video.id,
    courseId,
    trackEngagement: true
  });

  return (
    <div>
      <video ref={videoRef} src={video.url} controls />
      <div className="mt-2 text-sm text-muted-foreground">
        Engagement: {Math.round(metrics.engagementScore)}% | 
        Progress: {Math.round(metrics.completionRate)}%
      </div>
    </div>
  );
}
```

### Advanced Player with Custom Events

```typescript
function AdvancedVideoPlayer({ video, courseId, chapterId }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { metrics, trackCustomEvent } = useVideoTracking(
    videoRef.current,
    {
      videoId: video.id,
      courseId,
      chapterId,
      trackEngagement: true,
      heartbeatInterval: 10
    }
  );

  const handleChapterMarker = (chapterTime: number, chapterName: string) => {
    trackCustomEvent('chapter_reached', {
      chapterTime,
      chapterName,
      timeTaken: videoRef.current?.currentTime || 0
    });
  };

  const handleNoteBookmark = (time: number, note: string) => {
    trackCustomEvent('note_bookmark', {
      bookmarkTime: time,
      noteLength: note.length,
      hasText: note.length > 0
    });
  };

  return (
    <div>
      <video ref={videoRef} src={video.url} />
      {/* Chapter markers */}
      {video.chapters.map(chapter => (
        <button
          key={chapter.id}
          onClick={() => handleChapterMarker(chapter.time, chapter.title)}
        >
          {chapter.title}
        </button>
      ))}
      {/* Note taking */}
      <textarea
        onBlur={(e) => handleNoteBookmark(
          videoRef.current?.currentTime || 0,
          e.target.value
        )}
        placeholder="Take notes..."
      />
    </div>
  );
}
```

### Video with Interactive Elements

```typescript
function InteractiveVideo({ video, courseId }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  
  const { trackCustomEvent } = useVideoTracking(videoRef.current, {
    videoId: video.id,
    courseId
  });

  const handleQuizTrigger = (quizTime: number) => {
    setShowQuiz(true);
    trackCustomEvent('quiz_triggered', {
      triggerTime: quizTime,
      autoTriggered: true
    });
  };

  const handleQuizComplete = (score: number, timeTaken: number) => {
    setShowQuiz(false);
    trackCustomEvent('quiz_completed', {
      score,
      timeTaken,
      videoTime: videoRef.current?.currentTime || 0
    });
  };

  return (
    <div>
      <video ref={videoRef} src={video.url} />
      {showQuiz && (
        <QuizOverlay 
          onComplete={handleQuizComplete}
          onSkip={() => {
            setShowQuiz(false);
            trackCustomEvent('quiz_skipped', {
              skipTime: videoRef.current?.currentTime || 0
            });
          }}
        />
      )}
    </div>
  );
}
```

## Best Practices

### 1. Performance Optimization
- Use appropriate heartbeat intervals (10-30 seconds)
- Batch events when possible
- Throttle seek event tracking

### 2. Privacy Considerations
- Don't track personal video content
- Respect user privacy settings
- Clear tracking data on user request

### 3. Data Quality
- Validate video duration and timing data
- Handle edge cases (network issues, browser crashes)
- Filter out bot traffic

### 4. Teacher Insights
- Focus on actionable metrics
- Highlight struggling segments clearly
- Provide improvement recommendations

### 5. Student Experience
- Keep tracking transparent
- Show engagement feedback positively
- Use data to improve learning experience

## Troubleshooting

### Common Issues

1. **Events not firing**
   - Check video element reference
   - Ensure proper event listener setup
   - Verify courseId and videoId are provided

2. **Inaccurate metrics**
   - Check heartbeat interval settings
   - Verify duration calculation
   - Handle page refreshes properly

3. **Performance problems**
   - Reduce heartbeat frequency
   - Optimize event batching
   - Check for memory leaks

### Debug Mode

Enable debug logging in development:

```typescript
// In useVideoTracking hook
if (process.env.NODE_ENV === 'development') {
  console.log('Video Event:', eventName, properties);
}
```

This comprehensive video tracking system provides deep insights into student engagement while maintaining performance and user privacy.