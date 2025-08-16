/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
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
  "/solutions",
  "/get-started",
  "/discover",
  "/resources",
  "/support",
  "/ai-tutor",
  "/ai-trends", 
  "/ai-news",
  "/ai-research",
  "/api/search",
  "/api/search/mock",
  "/api/db-check",
  "/api-test",
  "/api/simple-test",
  "/api/debug-course-update",
  "/api/env-check",
  "/api/minimal-test",
  "/api/auth-test",
  "/api/course-update",
  "/api/test-dynamic-routes",
  "/api/debug-dynamic-routes",
  "/test-dynamic/[testId]",
  "/test-css",
  "/simple-test",
  "/minimal-test",
  "/basic-test",
  "/simple-css-test",
  "/css-debug",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes: string[] = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * Admin-specific routes that should only be accessible to admin users
 * @type {string[]}
 */
export const adminRoutes: string[] = [
  "/dashboard/admin",
  "/admin",
  "/admin/dashboard",
];

/**
 * Protected routes that require authentication
 * @type {string[]}
 */
export const protectedRoutes: string[] = [
  "/dashboard/user",
  "/my-courses",
  "/my-posts",
  "/profile",
  "/settings",
  "/messages",
  "/calendar",
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
  "/analytics/user",
  "/analytics/admin",
];

/**
 * Returns the default redirect path after logging in based on user role
 * @param role - The user's role (ADMIN or USER)
 * @returns {string} The redirect path
 */
const getDefaultRedirect = (role?: string): string => {
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/user";
};

/**
 * The default redirect path after logging in
 * Now using the getDefaultRedirect function
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard/user";

/**
 * Get redirect URL based on role
 * @param role - The user's role
 */
export const getRedirectUrl = (role?: string) => {
  return getDefaultRedirect(role);
};

/**
 * Check if a route is public (doesn't require authentication)
 * @param pathname - The pathname to check
 * @returns {boolean} Whether the route is public
 */
export const isPublicRoute = (pathname: string): boolean => {
  // ALL API routes should be handled by their own authentication logic
  if (pathname.startsWith('/api/')) {
    return true; // Don't process API routes in middleware
  }
  
  return publicRoutes.some(route => {
    // Convert route pattern to regex for dynamic routes
    const pattern = new RegExp(`^${route.replace(/\[.*?\]/g, '[^/]+')}$`);
    return pattern.test(pathname);
  });
};

/**
 * Check if a route is protected (requires authentication)
 * @param pathname - The pathname to check
 * @returns {boolean} Whether the route is protected
 */
export const isProtectedRoute = (pathname: string): boolean => {
  // API routes should not be processed by middleware
  if (pathname.startsWith('/api/')) {
    return false;
  }
  
  return protectedRoutes.some(route => {
    // Convert route pattern to regex for dynamic routes
    const pattern = new RegExp(`^${route.replace(/\[.*?\]/g, '[^/]+')}$`);
    return pattern.test(pathname);
  });
};