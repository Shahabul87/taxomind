# Click and Scroll Tracking Implementation Guide

## Overview
This guide covers the implementation of click and scroll tracking in the LMS platform. These tracking systems capture user interactions to provide insights into content engagement and learning behavior.

## Click Tracking

### Basic Usage

```typescript
import { useClickTracking } from '@/hooks/use-click-tracking';

function MyComponent() {
  const { trackClick } = useClickTracking({
    courseId: 'course123',
    chapterId: 'chapter456',
    sectionId: 'section789'
  });

  return (
    <button onClick={() => trackClick('my-button', 'custom_action')}>
      Click Me
    </button>
  );
}
```

### Automatic Click Tracking

Enable automatic tracking for all interactive elements:

```typescript
function CourseContent({ courseId }) {
  // Automatically tracks clicks on buttons, links, etc.
  useClickTracking({
    courseId,
    trackAllClicks: true,
    excludeSelectors: ['.no-track', '[data-no-track]']
  });

  return <div>Your content here</div>;
}
```

### Configuration Options

```typescript
interface ClickTrackingOptions {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  enabledSelectors?: string[];  // CSS selectors to track
  excludeSelectors?: string[];  // CSS selectors to exclude
  trackAllClicks?: boolean;     // Track all clicks by default
}
```

### Tracked Click Events

The system automatically captures:
- Element type (button, link, input)
- Element text content
- Element ID and classes
- Click position (x, y coordinates)
- Navigation context
- Course/chapter/section context

### Data Attributes for Context

Add data attributes to provide tracking context:

```html
<div data-course-id="course123">
  <section data-chapter-id="chapter456">
    <div data-section-id="section789">
      <button data-track-type="quiz_submit">Submit Quiz</button>
    </div>
  </section>
</div>
```

## Scroll Tracking

### Basic Usage

```typescript
import { useScrollTracking } from '@/hooks/use-scroll-tracking';

function Article() {
  const { metrics, trackReadingComplete } = useScrollTracking({
    thresholds: [25, 50, 75, 100],
    trackTime: true,
    trackDepth: true
  });

  return (
    <div>
      <p>Reading Progress: {metrics.scrollPercentage}%</p>
      <article>Your content</article>
    </div>
  );
}
```

### Container-Specific Tracking

Track scrolling within specific containers:

```typescript
function ScrollableContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { metrics } = useScrollTracking({
    container: containerRef.current,
    thresholds: [10, 25, 50, 75, 90, 100]
  });

  return (
    <div ref={containerRef} className="overflow-y-auto h-96">
      Content here
    </div>
  );
}
```

### Configuration Options

```typescript
interface ScrollTrackingOptions {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  container?: HTMLElement | null;
  thresholds?: number[];      // Percentage milestones
  throttleMs?: number;        // Throttle scroll events
  trackDepth?: boolean;       // Track max scroll depth
  trackTime?: boolean;        // Track time at positions
  trackDirection?: boolean;   // Track scroll direction
}
```

### Tracked Scroll Metrics

```typescript
interface ScrollMetrics {
  scrollPercentage: number;      // Current scroll position
  maxScrollDepth: number;        // Maximum depth reached
  scrollDirection: 'up' | 'down' | null;
  timeAtPosition: Record<string, number>;  // Time spent at ranges
  totalScrollDistance: number;   // Total pixels scrolled
  scrollVelocity: number;        // Scroll speed
}
```

## Content Visibility Tracking

Track when content becomes visible in the viewport:

```typescript
import { useContentVisibility } from '@/hooks/use-scroll-tracking';

function VideoSection({ video }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { isVisible, visibilityTime } = useContentVisibility(sectionRef, {
    threshold: 0.5,  // 50% visible
    contentId: video.id,
    contentType: 'video',
    courseId: 'course123'
  });

  return (
    <div ref={sectionRef}>
      {isVisible && <p>Viewing for: {visibilityTime}ms</p>}
      <video src={video.url} />
    </div>
  );
}
```

## Form Tracking

### Basic Form Tracking

```typescript
import { useFormTracking } from '@/hooks/use-form-tracking';

function ContactForm() {
  const {
    trackFormStart,
    trackFormSubmit,
    trackFormAbandon,
    createFieldTrackers
  } = useFormTracking({
    formId: 'contact-form',
    formName: 'Contact Us'
  });

  const nameTrackers = createFieldTrackers('name', 'text');

  useEffect(() => {
    trackFormStart();
    return () => trackFormAbandon();
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <input {...nameTrackers} />
    </form>
  );
}
```

### Quiz Tracking

```typescript
import { useQuizTracking } from '@/hooks/use-form-tracking';

function Quiz({ quiz, courseId }) {
  const {
    trackQuizStart,
    trackQuestionView,
    trackAnswer,
    trackQuizComplete
  } = useQuizTracking(quiz.id, courseId);

  // Implementation...
}
```

## Events Generated

### Click Events
- `button_click` - Button interactions
- `link_click` - Link navigation
- `navigation_click` - Navigation menu items
- `video_control_click` - Video player controls
- `quiz_interaction_click` - Quiz options
- `component_action` - Custom component actions

### Scroll Events
- `scroll_milestone` - Reached scroll percentage
- `scroll_session_end` - Scroll session completed
- `reading_complete` - Content reading finished

### View Events
- `content_view` - Content becomes visible
- `content_view_time` - Time spent viewing content

### Form Events
- `form_start` - Form interaction begins
- `form_field_focus` - Field receives focus
- `form_validation_error` - Validation fails
- `form_submit_success` - Successful submission
- `form_submit_error` - Submission error
- `form_abandon` - Form abandoned

### Quiz Events
- `quiz_start` - Quiz begins
- `question_view` - Question displayed
- `question_answer` - Answer submitted
- `quiz_complete` - Quiz finished

## Best Practices

### 1. Performance Optimization
- Scroll events are throttled by default (500ms)
- Batch multiple tracking calls when possible
- Use visibility tracking for lazy-loaded content

### 2. Privacy Considerations
- Don't track sensitive form data
- Use `excludeSelectors` for private UI elements
- Respect user privacy settings

### 3. Context Enrichment
- Always provide course/chapter/section context
- Use meaningful event names
- Add relevant metadata to events

### 4. Implementation Patterns

#### Page-Level Tracking
```typescript
function CoursePage({ course }) {
  // Enable tracking for entire page
  useClickTracking({
    courseId: course.id,
    trackAllClicks: true
  });

  useScrollTracking({
    courseId: course.id,
    trackDepth: true,
    trackTime: true
  });

  return <div data-course-id={course.id}>...</div>;
}
```

#### Component-Level Tracking
```typescript
function InteractiveComponent() {
  const { trackComponentClick } = useComponentClickTracking(
    'video-player',
    'player-123'
  );

  return (
    <div>
      <button onClick={() => trackComponentClick('play')}>
        Play
      </button>
    </div>
  );
}
```

### 5. Testing Tracking

```typescript
// In development, log events to console
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('analytics:track', (event) => {
    console.log('Analytics Event:', event.detail);
  });
}
```

## Integration with Analytics

All tracking events are automatically:
1. Batched and sent to `/api/analytics/events`
2. Stored in the database for analysis
3. Used for real-time metrics updates
4. Available in analytics dashboards

## Troubleshooting

### Events Not Firing
1. Check if element has `no-track` class
2. Verify tracking hooks are properly initialized
3. Ensure course/section context is provided

### Performance Issues
1. Increase scroll throttle time
2. Reduce number of tracked selectors
3. Use container-specific scroll tracking

### Missing Context
1. Add data attributes to parent elements
2. Pass context explicitly to tracking hooks
3. Check for proper component hierarchy