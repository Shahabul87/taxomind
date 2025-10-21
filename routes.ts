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
  "/courses", // Course listing - public for browsing
  // SECURITY FIX: Removed course learning routes - moved to protected
  // Course content requires authentication and purchase verification
  "/post",
  "/post/[postId]",
  "/articles/[articleId]",
  "/about",
  "/features",
  "/solutions",
  "/get-started",
  "/discover",
  "/ai-trends",
  "/ai-news",
  "/ai-research",
  "/api/search",
  "/api/search/mock",
  // SECURITY FIX: Debug/test endpoints removed from public routes
  // These should only be accessible in development or to admins
  // Moved to development-only or removed entirely
  // Phase 3: Admin auth routes must be public (accessible before login)
  "/admin/auth/login",
  "/admin/auth/error",
  "/admin/auth/reset",
  "/admin/auth/new-password",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes: string[] = [
  "/auth/login",
  "/auth/register",
  "/auth/register-teacher",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];

/**
 * Admin authentication routes - SEPARATE from user auth routes
 * These routes are specifically for administrator authentication
 * @type {string[]}
 */
export const adminAuthRoutes: string[] = [
  "/admin/auth/login",
  "/admin/auth/error",
  "/admin/auth/reset",
  "/admin/auth/new-password",
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
  "/admin/mfa-setup",
  "/admin/mfa-warning",
  "/admin/mfa-status",
];

/**
 * Protected routes that require authentication
 * @type {string[]}
 */
export const protectedRoutes: string[] = [
  "/dashboard",
  "/dashboard/user",
  "/dashboard/admin",
  "/become-instructor",
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
  // SECURITY FIX: Course learning routes now require authentication
  // These routes will also check for purchase/enrollment in the page component
  "/courses/[courseId]", // Course details page - requires auth to view full details
  "/courses/[courseId]/learn",
  "/courses/[courseId]/learn/[chapterId]",
  "/courses/[courseId]/learn/[chapterId]/sections/[sectionId]",
  "/courses/[courseId]/chapters/sections/[sectionId]",
  // Teacher routes
  "/teacher/courses",
  "/teacher/courses/[courseId]",
  "/teacher/courses/[courseId]/chapters/[chapterId]",
  "/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]",
  "/teacher/create",
  "/teacher/createblog",
  "/teacher/posts/[postId]",
  "/teacher/posts/[postId]/postchapters/[postchapterId]",
  "/teacher/analytics",
  "/teacher/posts/all-posts",
  "/teacher/posts/create-post",
  "/analytics",
  "/analytics/user",
  "/analytics/admin",
  "/resources",
  "/support",
  "/ai-tutor",
];

/**
 * Returns the default redirect path after logging in based on user role
 * @param role - The user's role (ADMIN or USER)
 * @returns {string} The redirect path
 */
const getDefaultRedirect = (role?: string): string => {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "USER":
    default:
      return "/dashboard";
  }
};

/**
 * The default redirect path after logging in
 * Now using the getDefaultRedirect function
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

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

/**
 * Check if a route is an admin auth route
 * @param pathname - The pathname to check
 * @returns {boolean} Whether the route is an admin auth route
 */
export const isAdminAuthRoute = (pathname: string): boolean => {
  return adminAuthRoutes.includes(pathname);
};

/**
 * Check if a route is an admin route (requires ADMIN role)
 * IMPORTANT: Admin auth routes (/admin/auth/*) are NOT admin routes
 * They must be accessible to non-admins attempting to log in
 * @param pathname - The pathname to check
 * @returns {boolean} Whether the route is an admin route
 */
export const isAdminRoute = (pathname: string): boolean => {
  // Admin auth routes should NOT be classified as admin routes
  // They need to be accessible to non-admins trying to log in
  if (isAdminAuthRoute(pathname)) {
    return false;
  }

  return adminRoutes.some(route => {
    const pattern = new RegExp(`^${route.replace(/\[.*?\]/g, '[^/]+')}$`);
    return pattern.test(pathname);
  }) || pathname.startsWith('/admin/') || pathname.startsWith('/dashboard/admin/');
};