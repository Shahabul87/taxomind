import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Add these exports to make the endpoint publicly accessible and not cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// Make this route publicly accessible
export const runtime = 'nodejs';

// Mock search results
const mockResults = [
  {
    id: 'course-1',
    title: 'Introduction to JavaScript',
    type: 'course',
    snippet: 'Learn the basics of JavaScript programming language. This course covers variables, functions, objects, and more.',
    thumbnail: 'https://utfs.io/f/mock-course-1-image.jpg'
  },
  {
    id: 'course-2',
    title: 'Advanced React Development',
    type: 'course',
    snippet: 'Take your React skills to the next level with advanced techniques including hooks, context API, and performance optimization.',
    thumbnail: 'https://utfs.io/f/mock-course-2-image.jpg'
  },
  {
    id: 'blog-1',
    title: 'Understanding React Hooks',
    type: 'blog',
    snippet: 'A deep dive into React Hooks and how they can simplify your functional components.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee'
  },
  {
    id: 'blog-2',
    title: 'TypeScript Best Practices',
    type: 'blog',
    snippet: 'Learn how to effectively use TypeScript in your projects with these best practices and tips.',
    thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97'
  }
];

export async function GET(request: NextRequest) {
  // Simulate network delay (shorter for better UX)
  await new Promise(resolve => setTimeout(resolve, 200));

  // Always use JSON content type
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, max-age=0'
  };
  
  try {
    // Get search query from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    if (!query || query.length < 2) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Search query must be at least 2 characters',
          results: [],
          totalResults: 0
        }),
        { status: 400, headers }
      );
    }

    // Filter results based on query (case insensitive)
    const lowerQuery = query.toLowerCase();
    const filteredResults = mockResults.filter(result => 
      result.title.toLowerCase().includes(lowerQuery) || 
      result.snippet.toLowerCase().includes(lowerQuery)
    );
    
    // Create response with proper JSON structure
    const responseData = {
      results: filteredResults,
      totalResults: filteredResults.length,
    };
    
    // Return using the raw NextResponse to ensure headers are properly set
    return new NextResponse(
      JSON.stringify(responseData),
      { status: 200, headers }
    );
  } catch (error: any) {
    logger.error('Mock search API error:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'An error occurred while searching',
        results: [],
        totalResults: 0
      }),
      { status: 500, headers }
    );
  }
} 