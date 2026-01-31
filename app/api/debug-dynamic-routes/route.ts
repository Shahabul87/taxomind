import { NextRequest, NextResponse } from "next/server";
import { isPublicRoute, isProtectedRoute } from "@/routes";
import { logger } from '@/lib/logger';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const url = new URL(request.url);
    
    // Test various dynamic route patterns that might be failing
    const testRoutes = [
      // Course routes
      '/courses/test-course-123',
      '/courses/abc123/learn',
      '/courses/abc123/learn/chapter1',
      '/courses/abc123/learn/chapter1/sections/section1',
      '/courses/abc123/chapters/sections/section1',
      
      // Blog and post routes
      '/blog/test-post-456',
      '/post/test-post-789',
      '/articles/article-123',
      
      // Teacher routes
      '/teacher/courses/course-101',
      '/teacher/courses/course-101/chapters/chapter1',
      '/teacher/courses/course-101/chapters/chapter1/section/section1',
      '/teacher/posts/post-123',
      '/teacher/posts/post-123/postchapters/chapter1',
      
      // Group routes
      '/groups/group-789',
      '/groups/group-789/settings',
      
      // User routes
      '/dashboard/user',
      '/my-courses',
      '/my-posts',
      '/profile',
      '/settings',
      
      // Test route
      '/test-dynamic/abc123'
    ];
    
    const routeAnalysis = testRoutes.map(route => {
      const isPublic = isPublicRoute(route);
      const isProtected = isProtectedRoute(route);
      
      // Find which pattern matches (if any)
      const publicRoutes = [
        "/",
        "/auth/new-verification",
        "/searchbar",
        "/api/webhook",
        "/portfolio",
        "/blog",
        "/blog/[postId]",
        "/courses",
        "/courses/[courseId]",
        "/courses/[courseId]/learn",
        "/courses/[courseId]/learn/[chapterId]",
        "/courses/[courseId]/learn/[chapterId]/sections/[sectionId]",
        "/courses/[courseId]/chapters/sections/[sectionId]",
        "/post",
        "/post/[postId]",
        "/post/all-posts",
        "/articles/[articleId]",
        "/about",
        "/dashboard",
        "/features",
        "/get-started",
        "/discover",
        "/resources",
        "/support",
        "/test-dynamic/[testId]",
      ];
      
      const protectedRoutes = [
        "/dashboard/user",
        "/my-courses",
        "/my-posts",
        "/profile",
        "/settings",
        "/messages",
        "/calendar",
        "/ai-tutor",
        "/groups",
        "/groups/[groupId]",
        "/groups/[groupId]/settings",
        "/groups/create",
        "/groups/my-groups",
        "/teacher/courses",
        "/teacher/courses/[courseId]",
        "/teacher/courses/[courseId]/chapters/[chapterId]",
        "/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]",
        "/teacher/create",
        "/teacher/createblog",
        "/teacher/posts/[postId]",
        "/teacher/posts/[postId]/postchapters/[postchapterId]",
        "/teacher/analytics",
        "/teacher/allposts",
        "/post/create-post",
        "/analytics/student",
      ];
      
      const matchingPublicPattern = publicRoutes.find(pattern => {
        const regex = new RegExp(`^${pattern.replace(/\[.*?\]/g, '[^/]+')}$`);
        return regex.test(route);
      });
      
      const matchingProtectedPattern = protectedRoutes.find(pattern => {
        const regex = new RegExp(`^${pattern.replace(/\[.*?\]/g, '[^/]+')}$`);
        return regex.test(route);
      });
      
      return {
        route,
        isPublic,
        isProtected,
        matchingPublicPattern: matchingPublicPattern || null,
        matchingProtectedPattern: matchingProtectedPattern || null,
        status: isPublic ? 'PUBLIC' : isProtected ? 'PROTECTED' : 'UNMATCHED',
        middlewareAction: isPublic ? 'ALLOW' : isProtected ? 'REQUIRE_AUTH' : 'REDIRECT_TO_LOGIN'
      };
    });
    
    // Analyze potential issues
    const issues = [];
    const unmatchedRoutes = routeAnalysis.filter(r => r.status === 'UNMATCHED');
    
    if (unmatchedRoutes.length > 0) {
      issues.push({
        type: 'UNMATCHED_ROUTES',
        description: 'Routes that don\'t match any pattern will redirect to login',
        routes: unmatchedRoutes.map(r => r.route)
      });
    }
    
    // Check for missing patterns
    const missingPatterns = [];
    if (!routeAnalysis.find(r => r.route.includes('/courses/') && r.route.includes('/learn/') && r.isPublic)) {
      missingPatterns.push('/courses/[courseId]/learn/[chapterId]');
    }
    
    if (missingPatterns.length > 0) {
      issues.push({
        type: 'MISSING_PATTERNS',
        description: 'Potentially missing route patterns',
        patterns: missingPatterns
      });
    }
    
    return NextResponse.json({
      message: "Dynamic Route Diagnostic Report",
      timestamp: new Date().toISOString(),
      summary: {
        totalRoutes: routeAnalysis.length,
        publicRoutes: routeAnalysis.filter(r => r.isPublic).length,
        protectedRoutes: routeAnalysis.filter(r => r.isProtected).length,
        unmatchedRoutes: unmatchedRoutes.length,
        issuesFound: issues.length
      },
      routeAnalysis,
      issues,
      recommendations: [
        "Check if unmatched routes need to be added to publicRoutes or protectedRoutes",
        "Verify that dynamic route patterns use correct syntax: [paramName]",
        "Ensure middleware is properly handling route matching",
        "Test specific failing routes to identify patterns"
      ]
    });
    
  } catch (error) {
    logger.error("Dynamic route diagnostic error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 