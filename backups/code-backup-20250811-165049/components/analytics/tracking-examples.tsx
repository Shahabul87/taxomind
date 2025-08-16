'use client';

// Example implementations of click and scroll tracking

import { useEffect, useRef } from 'react';
import { useClickTracking, useComponentClickTracking } from '@/hooks/use-click-tracking';
import { useScrollTracking, useContentVisibility } from '@/hooks/use-scroll-tracking';
import { useFormTracking, useQuizTracking } from '@/hooks/use-form-tracking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

// Example 1: Basic Click Tracking
export function TrackedButton({ courseId }: { courseId?: string }) {
  const { trackClick } = useClickTracking({ courseId });

  return (
    <Button
      onClick={() => {
        // Manual tracking for important actions
        trackClick('enroll-button', 'course_enroll_click', {
          courseId,
          buttonLocation: 'hero_section'
        });
      }}
    >
      Enroll Now
    </Button>
  );
}

// Example 2: Component with Automatic Click Tracking
export function CourseCard({ course }: { course: any }) {
  // This will automatically track clicks on buttons, links, etc.
  useClickTracking({
    courseId: course.id,
    trackAllClicks: true,
    excludeSelectors: ['.no-track', '[data-no-track]']
  });

  return (
    <Card data-course-id={course.id} className="p-4">
      <h3>{course.title}</h3>
      <Button>View Course</Button>
      <Link href={`/courses/${course.id}`}>Learn More</Link>
      <button className="no-track">Settings</button> {/* This won't be tracked */}
    </Card>
  );
}

// Example 3: Scroll Tracking for Content
export function ArticleContent({ articleId, content }: { articleId: string; content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { metrics, trackReadingComplete } = useScrollTracking({
    container: containerRef.current,
    thresholds: [10, 25, 50, 75, 90, 100],
    trackTime: true,
    trackDepth: true
  });

  useEffect(() => {
    // Track reading completion when user reaches 90%+ depth
    if (metrics.maxScrollDepth >= 90) {
      trackReadingComplete();
    }
  }, [metrics.maxScrollDepth, trackReadingComplete]);

  return (
    <div ref={containerRef} className="article-content max-h-[600px] overflow-y-auto">
      <div className="mb-2 text-sm text-muted-foreground">
        Reading Progress: {metrics.scrollPercentage}%
      </div>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

// Example 4: Content Visibility Tracking
export function VideoSection({ video, courseId }: { video: any; courseId: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { isVisible, visibilityTime } = useContentVisibility(sectionRef, {
    threshold: 0.5, // Track when 50% visible
    contentId: video.id,
    contentType: 'video',
    courseId,
    sectionId: video.sectionId
  });

  return (
    <div ref={sectionRef} className="video-section">
      <h4>{video.title}</h4>
      {isVisible && <p className="text-sm">Viewing for: {Math.floor(visibilityTime / 1000)}s</p>}
      <video src={video.url} controls />
    </div>
  );
}

// Example 5: Form Tracking
export function ContactForm({ courseId }: { courseId?: string }) {
  const {
    trackFormStart,
    trackFormSubmit,
    trackFormAbandon,
    createFieldTrackers
  } = useFormTracking({
    formId: 'contact-form',
    formName: 'Course Inquiry',
    courseId
  });

  const nameTrackers = createFieldTrackers('name', 'text');
  const emailTrackers = createFieldTrackers('email', 'email');
  const messageTrackers = createFieldTrackers('message', 'textarea');

  useEffect(() => {
    trackFormStart();

    // Track abandonment on unmount
    return () => {
      trackFormAbandon();
    };
  }, [trackFormStart, trackFormAbandon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Form submission logic
      await submitForm();
      trackFormSubmit(true);
    } catch (error) {
      trackFormSubmit(false, undefined, error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        placeholder="Your Name"
        {...nameTrackers}
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        {...emailTrackers}
      />
      <textarea
        name="message"
        placeholder="Message"
        {...messageTrackers}
      />
      <Button type="submit">Send Message</Button>
    </form>
  );
}

// Example 6: Quiz Tracking
export function QuizComponent({ quiz, courseId }: { quiz: any; courseId: string }) {
  const {
    trackQuizStart,
    trackQuestionView,
    trackAnswer,
    trackQuizComplete
  } = useQuizTracking(quiz.id, courseId);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    trackQuizStart();
  }, [trackQuizStart]);

  useEffect(() => {
    if (quiz.questions[currentQuestion]) {
      trackQuestionView(
        quiz.questions[currentQuestion].id,
        currentQuestion + 1
      );
    }
  }, [currentQuestion, quiz.questions, trackQuestionView]);

  const handleAnswer = (questionId: string, answer: any, isCorrect: boolean) => {
    trackAnswer(questionId, answer, isCorrect);
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    const finalScore = (score / quiz.questions.length) * 100;
    const passed = finalScore >= quiz.passingScore;
    
    trackQuizComplete(finalScore, passed);
  };

  return (
    <div className="quiz-container" data-quiz-id={quiz.id}>
      {/* Quiz UI implementation */}
    </div>
  );
}

// Example 7: Navigation Tracking with Component Hook
export function MainNavigation() {
  const { trackComponentClick } = useComponentClickTracking('main-navigation');

  return (
    <nav className="main-nav">
      <Link 
        href="/courses" 
        onClick={() => trackComponentClick('navigate', { destination: 'courses' })}
      >
        Courses
      </Link>
      <Link 
        href="/dashboard"
        onClick={() => trackComponentClick('navigate', { destination: 'dashboard' })}
      >
        Dashboard
      </Link>
    </nav>
  );
}

// Example 8: Advanced Scroll Tracking with Time Heatmap
export function LongFormContent({ content, sectionId }: { content: any; sectionId: string }) {
  const { metrics } = useScrollTracking({
    sectionId,
    trackTime: true,
    thresholds: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  });

  // Create a visual heatmap of time spent
  const timeHeatmap = Object.entries(metrics.timeAtPosition).map(([range, time]) => ({
    range,
    time,
    intensity: Math.min(time / 30, 1) // Cap at 30 seconds for full intensity
  }));

  return (
    <div className="relative">
      {/* Time heatmap visualization */}
      <div className="absolute right-0 top-0 w-4 h-full">
        {timeHeatmap.map(({ range, intensity }) => (
          <div
            key={range}
            className="w-full h-[10%]"
            style={{
              backgroundColor: `rgba(239, 68, 68, ${intensity})`,
              opacity: intensity
            }}
            title={`${range}% - Time: ${metrics.timeAtPosition[range]}s`}
          />
        ))}
      </div>
      
      <div className="pr-8">
        {content}
      </div>
    </div>
  );
}

// Example 9: Integrated Course Page with Full Tracking
export function TrackedCoursePage({ course }: { course: any }) {
  // Enable click tracking for the entire page
  useClickTracking({
    courseId: course.id,
    enabledSelectors: [
      'button',
      'a',
      '[role="button"]',
      '.video-control',
      '.quiz-option',
      '.tab-button'
    ]
  });

  // Track scroll behavior
  const { metrics } = useScrollTracking({
    courseId: course.id,
    trackDepth: true,
    trackTime: true
  });

  return (
    <div className="course-page" data-course-id={course.id}>
      <header>
        <h1>{course.title}</h1>
        <div className="text-sm text-muted-foreground">
          Scroll Depth: {metrics.maxScrollDepth}% | 
          Reading Velocity: {metrics.scrollVelocity.toFixed(2)} px/ms
        </div>
      </header>
      
      {/* Course content with automatic tracking */}
      <main>
        {course.sections.map((section: any) => (
          <section key={section.id} data-section-id={section.id}>
            {/* Content automatically tracked */}
          </section>
        ))}
      </main>
    </div>
  );
}

// Utility function for form submission (example)
async function submitForm() {
  // Simulated API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) {
        resolve({ success: true });
      } else {
        reject(new Error('Network error'));
      }
    }, 1000);
  });
}

import { useState } from 'react';

// Add this import at the top of the file to fix the error
// The useState was already being used but not imported