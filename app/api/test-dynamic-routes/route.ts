import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Test various dynamic route patterns
    const testRoutes = [
      '/courses/test-course-123',
      '/courses/abc123/learn',
      '/courses/abc123/chapters/chapter1',
      '/post/test-post-456',
      '/groups/group-789',
      '/teacher/courses/course-101'
    ];
    
    const routeTests = testRoutes.map(route => {
      // Test against public routes pattern
      const publicRoutes = [
        "/",
        "/auth/new-verification",
        "/searchbar",
        "/api/webhook",
        "/portfolio",
        "/blog",
        "/courses",
        "/courses/[courseId]",
        "/about",
        "/dashboard",
      ];
      
      const isPublicRoute = publicRoutes.some(publicRoute => {
        const pattern = new RegExp(`^${publicRoute.replace(/\[.*?\]/g, '[^/]+')}$`);
        return pattern.test(route);
      });
      
      return {
        route,
        isPublicRoute,
        pattern: publicRoutes.find(publicRoute => {
          const pattern = new RegExp(`^${publicRoute.replace(/\[.*?\]/g, '[^/]+')}$`);
          return pattern.test(route);
        })
      };
    });
    
    return NextResponse.json({
      message: "Dynamic route testing",
      currentPath: pathname,
      testResults: routeTests,
      middlewareInfo: {
        note: "This tests how middleware handles dynamic routes",
        publicRoutePattern: "Routes with [courseId] should match /courses/[courseId] pattern"
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error("Dynamic route test error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 