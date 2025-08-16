'use client';

// Example: Course Setup Page with Event Tracking

import { useEffect } from 'react';
import { usePageTracking, useClickTracking, useCourseTracking } from '@/lib/analytics/analytics-provider';
import { Button } from '@/components/ui/button';

interface CourseSetupWithTrackingProps {
  courseId: string;
  courseName: string;
}

export function CourseSetupWithTracking({ courseId, courseName }: CourseSetupWithTrackingProps) {
  // Set up page tracking
  usePageTracking(`course-setup-${courseId}`);
  
  // Set up click tracking
  const { trackClick, trackButtonClick } = useClickTracking();
  
  // Set up course-specific tracking
  const { trackVideoPlay, trackQuizStart } = useCourseTracking(courseId);

  // Track when user views important sections
  const trackSectionView = (sectionName: string) => {
    trackClick(`section-${sectionName}`, {
      courseId,
      sectionName,
      timestamp: new Date().toISOString()
    });
  };

  // Example: Track button clicks
  const handlePublishClick = () => {
    trackButtonClick('publish-course', 'publish');
    // ... rest of publish logic
  };

  const handlePreviewClick = () => {
    trackButtonClick('preview-course', 'preview');
    // ... rest of preview logic
  };

  // Example: Track form interactions
  const handleTitleChange = (value: string) => {
    trackClick('course-title-input', {
      action: 'edit',
      fieldName: 'title',
      hasValue: value.length > 0
    });
  };

  return (
    <div className="space-y-6">
      <div 
        className="p-6 border rounded-lg"
        onMouseEnter={() => trackSectionView('course-details')}
      >
        <h2 className="text-xl font-semibold mb-4">Course Details</h2>
        
        <input
          type="text"
          placeholder="Course Title"
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full p-2 border rounded"
        />
        
        <div className="mt-4 space-x-4">
          <Button onClick={handlePublishClick}>
            Publish Course
          </Button>
          
          <Button variant="outline" onClick={handlePreviewClick}>
            Preview
          </Button>
        </div>
      </div>

      {/* Example: Video tracking */}
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Course Introduction Video</h2>
        
        <video
          onPlay={(e) => {
            const video = e.target as HTMLVideoElement;
            trackVideoPlay('intro-video', video.currentTime);
          }}
          controls
          className="w-full"
        >
          {/* Video source */}
        </video>
      </div>

      {/* Example: Scroll tracking for long content */}
      <div 
        className="p-6 border rounded-lg h-96 overflow-y-auto"
        id="course-description"
      >
        <h2 className="text-xl font-semibold mb-4">Course Description</h2>
        {/* Long scrollable content */}
      </div>
    </div>
  );
}

// Usage in page component:
// <AnalyticsProvider>
//   <CourseSetupWithTracking courseId={courseId} courseName={courseName} />
// </AnalyticsProvider>