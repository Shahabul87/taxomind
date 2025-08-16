/**
 * SAM Engine - Next.js Integration Example
 * This example shows how to integrate SAM Engine into a Next.js application
 */

// ============================================
// 1. Environment Configuration (.env.local)
// ============================================
/*
ANTHROPIC_API_KEY=your-api-key-here
OPENAI_API_KEY=your-openai-key-here
*/

// ============================================
// 2. Root Layout Provider (app/layout.tsx)
// ============================================
import { SAMProvider } from '@taxomind/sam-engine/react';
import { auth } from '@/auth'; // Your auth implementation

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <html lang="en">
      <body>
        <SAMProvider
          config={{
            apiKey: process.env.ANTHROPIC_API_KEY!,
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.7,
            cacheEnabled: true,
            rateLimitPerMinute: 60
          }}
          user={{
            id: session?.user?.id || 'anonymous',
            name: session?.user?.name,
            email: session?.user?.email,
            role: session?.user?.role || 'USER'
          }}
          onError={(error) => {
            console.error('SAM Error:', error);
            // Send to error tracking service
          }}
        >
          {children}
        </SAMProvider>
      </body>
    </html>
  );
}

// ============================================
// 3. Course Editor Page with SAM Integration
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useSAM } from '@taxomind/sam-engine/react';

export default function CourseEditorPage({ 
  params 
}: { 
  params: { courseId: string } 
}) {
  const { sendMessage, updateContext, messages, isLoading } = useSAM();
  const [course, setCourse] = useState<any>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  // Update SAM context when page loads
  useEffect(() => {
    updateContext({
      courseId: params.courseId,
      pageType: 'course-edit',
      entityType: 'course',
      entityData: course
    });
  }, [params.courseId, course, updateContext]);

  // Ask SAM for help
  const askForHelp = async (topic: string) => {
    const response = await sendMessage(
      `Help me with ${topic} for this course`,
      {
        formData: {
          title: course?.title,
          description: course?.description
        }
      }
    );

    // Use SAM's suggestions
    if (response?.suggestions) {
      console.log('SAM Suggestions:', response.suggestions);
    }
  };

  return (
    <div className="flex">
      {/* Main Editor */}
      <div className="flex-1 p-6">
        <h1>Edit Course: {course?.title}</h1>
        
        {/* Course Form */}
        <form>
          <input
            type="text"
            value={course?.title || ''}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            placeholder="Course Title"
          />
          
          <textarea
            value={course?.description || ''}
            onChange={(e) => setCourse({ ...course, description: e.target.value })}
            placeholder="Course Description"
          />
        </form>

        {/* Quick Actions */}
        <div className="mt-4 space-x-2">
          <button onClick={() => askForHelp('course structure')}>
            Help with Structure
          </button>
          <button onClick={() => askForHelp('learning objectives')}>
            Improve Objectives
          </button>
          <button onClick={() => askForHelp('student engagement')}>
            Engagement Ideas
          </button>
        </div>
      </div>

      {/* SAM Assistant Panel */}
      {showAssistant && (
        <div className="w-96 border-l p-4">
          <SAMChatPanel />
        </div>
      )}

      {/* Floating SAM Button */}
      <button
        onClick={() => setShowAssistant(!showAssistant)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full p-4"
      >
        Ask SAM
      </button>
    </div>
  );
}

// ============================================
// 4. SAM Chat Panel Component
// ============================================
import { SAMChat } from '@taxomind/sam-engine/react';

function SAMChatPanel() {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">SAM Assistant</h2>
      <SAMChat
        className="flex-1"
        placeholder="Ask SAM anything about your course..."
        showSuggestions={true}
        maxHeight="calc(100vh - 200px)"
        onSendMessage={(message, response) => {
          // Track interactions
          analytics.track('sam_interaction', {
            message,
            response: response.message,
            suggestions: response.suggestions
          });
        }}
      />
    </div>
  );
}

// ============================================
// 5. API Route for Server-Side SAM Usage
// ============================================
// app/api/sam/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createSAMEngine } from '@taxomind/sam-engine';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, analysisType } = await req.json();

  // Create SAM instance for server-side processing
  const sam = createSAMEngine({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    provider: 'anthropic'
  });

  await sam.initialize();

  try {
    const response = await sam.process(
      {
        user: {
          id: session.user.id,
          role: session.user.role
        },
        courseId
      },
      `Analyze this course for ${analysisType}`
    );

    return NextResponse.json({
      analysis: response.message,
      recommendations: response.suggestions,
      insights: response.contextInsights
    });
  } finally {
    await sam.destroy();
  }
}

// ============================================
// 6. Student Learning Page
// ============================================
'use client';

import { useEffect } from 'react';
import { useSAM, SAMFloatingAssistant } from '@taxomind/sam-engine/react';

export default function LearningPage({ 
  params 
}: { 
  params: { courseId: string; sectionId: string } 
}) {
  const { updateContext, sendMessage } = useSAM();

  useEffect(() => {
    // Update context for learning page
    updateContext({
      courseId: params.courseId,
      sectionId: params.sectionId,
      pageType: 'learning',
      entityType: 'section'
    });
  }, [params, updateContext]);

  const askForExplanation = async () => {
    const response = await sendMessage(
      'Can you explain this concept in simpler terms?'
    );
    // Display explanation to student
  };

  const requestPracticeProblems = async () => {
    const response = await sendMessage(
      'Give me some practice problems for this topic'
    );
    // Show practice problems
  };

  return (
    <div>
      {/* Learning content */}
      <div className="prose max-w-4xl mx-auto p-6">
        <h1>Learning Section</h1>
        {/* Section content here */}
      </div>

      {/* Learning assistance buttons */}
      <div className="fixed bottom-20 right-4 space-y-2">
        <button
          onClick={askForExplanation}
          className="block bg-green-500 text-white px-4 py-2 rounded"
        >
          Explain Simply
        </button>
        <button
          onClick={requestPracticeProblems}
          className="block bg-blue-500 text-white px-4 py-2 rounded"
        >
          Practice Problems
        </button>
      </div>

      {/* Floating SAM Assistant */}
      <SAMFloatingAssistant
        position="bottom-right"
        title="Learning Assistant"
        buttonText="Ask SAM"
      />
    </div>
  );
}

// ============================================
// 7. Custom Hook for SAM Integration
// ============================================
import { useCallback } from 'react';
import { useSAM } from '@taxomind/sam-engine/react';

export function useSAMAssistant(entityType: string, entityId: string) {
  const { sendMessage, updateContext, messages, isLoading } = useSAM();

  const askSAM = useCallback(async (question: string, additionalContext?: any) => {
    return await sendMessage(question, {
      entityType,
      entityId,
      ...additionalContext
    });
  }, [sendMessage, entityType, entityId]);

  const getContentSuggestions = useCallback(async () => {
    return await askSAM('What content should I add to improve this?');
  }, [askSAM]);

  const improveWriting = useCallback(async (text: string) => {
    return await askSAM(`Improve this text: "${text}"`);
  }, [askSAM]);

  const generateQuiz = useCallback(async (topic: string) => {
    return await askSAM(`Generate a quiz about ${topic}`);
  }, [askSAM]);

  return {
    askSAM,
    getContentSuggestions,
    improveWriting,
    generateQuiz,
    messages,
    isLoading
  };
}

// Usage in component
function ContentEditor() {
  const { 
    improveWriting, 
    getContentSuggestions,
    isLoading 
  } = useSAMAssistant('chapter', 'chapter-123');

  const handleImproveText = async () => {
    const improved = await improveWriting(currentText);
    setCurrentText(improved.message);
  };

  return (
    <div>
      <textarea value={currentText} onChange={e => setCurrentText(e.target.value)} />
      <button onClick={handleImproveText} disabled={isLoading}>
        Improve with SAM
      </button>
    </div>
  );
}

// ============================================
// 8. Middleware for SAM Context
// ============================================
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add SAM context headers
  const response = NextResponse.next();
  
  // Extract context from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  
  if (pathParts.includes('courses')) {
    response.headers.set('X-SAM-Context-Type', 'course');
    response.headers.set('X-SAM-Page-Type', 'course-management');
  } else if (pathParts.includes('learn')) {
    response.headers.set('X-SAM-Context-Type', 'learning');
    response.headers.set('X-SAM-Page-Type', 'student-learning');
  }

  return response;
}

export const config = {
  matcher: ['/courses/:path*', '/learn/:path*', '/teacher/:path*']
};