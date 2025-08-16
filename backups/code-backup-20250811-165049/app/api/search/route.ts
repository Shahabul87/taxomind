import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Add these exports to make the endpoint publicly accessible and not cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// Make this route publicly accessible
export const runtime = 'nodejs';

// Search result interfaces
interface BaseSearchResult {
  id: string;
  title: string;
  type: 'course' | 'blog';
  snippet: string;
  thumbnail?: string;
}

interface CourseSearchResult extends BaseSearchResult {
  type: 'course';
}

interface BlogSearchResult extends BaseSearchResult {
  type: 'blog';
}

type SearchResult = CourseSearchResult | BlogSearchResult;

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
}

export async function GET(request: NextRequest) {

  try {
    // Get search query from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {

      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Process the search query

    const results = await performSearch(query);

    return NextResponse.json({
      results,
      totalResults: results.length,
    });
  } catch (error) {
    logger.error('❌ Search API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}

async function performSearch(query: string): Promise<SearchResult[]> {
  // Initialize an empty array for results
  const results: SearchResult[] = [];
  
  // Clean and prepare the query for better search
  const cleanQuery = query.trim().toLowerCase();
  const searchTerms = cleanQuery.split(/\s+/).filter(term => term.length >= 2);

  if (searchTerms.length === 0) {

    return [];
  }

  // Search courses
  try {

    // Simple search approach that will pass type checking
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          { description: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      },
      take: 15,
      include: {
        user: true,
        chapters: {
          where: { isPublished: true },
          select: { title: true, description: true }
        }
      }
    });

    // Transform courses to search results
    courses.forEach(course => {
      // Extract content from chapters for better snippets if needed
      let fullContent = course.description || '';
      if (course.chapters && course.chapters.length > 0) {
        fullContent += ' ' + course.chapters.map(ch => 
          `${ch.title} ${ch.description || ''}`
        ).join(' ');
      }
      
      results.push({
        id: course.id,
        title: course.title,
        type: 'course',
        snippet: createSnippet(stripHtmlTags(fullContent), cleanQuery),
        thumbnail: course.imageUrl || undefined
      });
    });
  } catch (error) {
    logger.error('Error searching courses:', error);
  }

  // Search blogs
  try {

    // Simple search approach that will pass type checking
    const blogs = await db.blog.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          { description: { contains: cleanQuery, mode: 'insensitive' } },
          { category: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      },
      take: 15,
      include: {
        User: true
      }
    });

    // Transform blogs to search results
    blogs.forEach(blog => {
      // Combine all searchable content for better snippets
      const fullContent = `${blog.title} ${blog.category || ''} ${blog.description || ''}`;
      
      results.push({
        id: blog.id,
        title: blog.title,
        type: 'blog',
        snippet: createSnippet(stripHtmlTags(fullContent), cleanQuery),
        thumbnail: blog.url || undefined
      });
    });
  } catch (error) {
    logger.error('Error searching blogs:', error);
  }

  // Sort results by relevance
  return sortResultsByRelevance(results, cleanQuery, searchTerms);
}

/**
 * Create a snippet of text around the search query
 * This extracts a portion of text where the query appears
 */
function createSnippet(text: string, query: string, length: number = 150): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Try to find the exact query
  let index = lowerText.indexOf(lowerQuery);
  
  // If not found, try to find any of the search terms
  if (index === -1) {
    const terms = lowerQuery.split(/\s+/).filter(t => t.length > 2);
    for (const term of terms) {
      index = lowerText.indexOf(term);
      if (index !== -1) break;
    }
  }
  
  // If still not found, use the beginning of the text
  if (index === -1) {
    return text.length > length ? text.slice(0, length) + '...' : text;
  }
  
  const start = Math.max(0, index - length / 2);
  const end = Math.min(text.length, index + query.length + length / 2);
  
  let snippet = text.slice(start, end);
  
  // Add ellipsis if needed
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
  // First replace common HTML entities
  const withEntities = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Then strip all HTML tags
  return withEntities.replace(/<[^>]*>/g, '');
}

/**
 * Sort search results by relevance
 */
function sortResultsByRelevance(results: SearchResult[], query: string, searchTerms: string[]): SearchResult[] {
  return results.sort((a, b) => {
    // Calculate scores for sorting
    const scoreA = calculateRelevanceScore(a, query, searchTerms);
    const scoreB = calculateRelevanceScore(b, query, searchTerms);
    
    // Higher score comes first
    return scoreB - scoreA;
  });
}

/**
 * Calculate a relevance score for a result
 */
function calculateRelevanceScore(result: SearchResult, query: string, searchTerms: string[]): number {
  let score = 0;
  const title = result.title.toLowerCase();
  const snippet = result.snippet.toLowerCase();
  
  // Exact match in title is most valuable
  if (title.includes(query)) {
    score += 100;
  }
  
  // Words that start with the query in title
  if (title.startsWith(query)) {
    score += 50;
  }
  
  // Each search term found in title adds points
  searchTerms.forEach(term => {
    if (title.includes(term)) {
      score += 30;
      
      // Bonus for terms at the beginning of the title
      if (title.startsWith(term + ' ')) {
        score += 15;
      }
    }
    
    // Terms in snippet add fewer points
    if (snippet.includes(term)) {
      score += 10;
    }
  });
  
  // Add points based on type if you want to prioritize certain content types
  if (result.type === 'course') {
    score += 5; // Small boost for courses if you want to prioritize them
  }
  
  // Factor in the overall length of the title as shorter titles that match are often more relevant
  const titleRelevanceFactor = Math.max(1, 20 - title.length) / 10;
  score *= titleRelevanceFactor;
  
  return score;
} 