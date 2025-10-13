import { NextRequest, NextResponse } from 'next/server';
import { currentUser, currentRole } from '@/lib/auth';

export type AuthContext = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  session: any;
};

export type AuthenticatedHandler = (
  request: NextRequest,
  context?: any,
  authContext?: AuthContext
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler): AuthenticatedHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      const user = await currentUser();
      const role = await currentRole();
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          },
          { status: 401 }
        );
      }
      
      const authContext: AuthContext = {
        user: {
          id: user.id,
          email: user.email!,
          name: user.name ?? null,
          role: role || 'USER',
        },
        session: null,
      };
      
      return handler(request, { ...context, user: authContext.user }, authContext);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication error'
          }
        },
        { status: 500 }
      );
    }
  };
}

export function withAdminAuth(handler: AuthenticatedHandler): AuthenticatedHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      const user = await currentUser();
      const role = await currentRole();
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          },
          { status: 401 }
        );
      }
      
      if (role !== 'ADMIN') {
        return NextResponse.json(
          { 
            success: false, 
            error: {
              code: 'FORBIDDEN',
              message: 'Admin access required'
            }
          },
          { status: 403 }
        );
      }
      
      const authContext: AuthContext = {
        user: {
          id: user.id,
          email: user.email!,
          name: user.name ?? null,
          role: role,
        },
        session: null,
      };
      
      return handler(request, { ...context, user: authContext.user }, authContext);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication error'
          }
        },
        { status: 500 }
      );
    }
  };
}

export function withRateLimit(
  handler: AuthenticatedHandler,
  options?: { limit?: number; window?: number }
): AuthenticatedHandler {
  return async (request: NextRequest, context?: any, authContext?: AuthContext) => {
    // Mock rate limiting for tests
    const response = await handler(request, context, authContext);
    
    // Add rate limit headers if configured
    if (options?.limit) {
      response.headers.set('X-RateLimit-Limit', String(options.limit));
      response.headers.set('X-RateLimit-Remaining', String(options.limit - 1));
      response.headers.set('X-RateLimit-Reset', String(Date.now() + (options.window || 60000)));
    }
    
    return response;
  };
}

export function withOwnership(
  getUserId: (request: NextRequest, context?: any) => Promise<string | null>,
  handler: AuthenticatedHandler
): AuthenticatedHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      const user = await currentUser();
      const role = await currentRole();
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          },
          { status: 401 }
        );
      }
      
      // Admin can access any resource
      if (role === 'ADMIN') {
        const authContext: AuthContext = {
          user: {
            id: user.id,
            email: user.email!,
            name: user.name ?? null,
            role: role,
          },
          session: null,
        };
        return handler(request, context, authContext);
      }
      
      // Check ownership
      const resourceOwnerId = await getUserId(request, context);
      
      if (resourceOwnerId !== user.id) {
        return NextResponse.json(
          { 
            success: false, 
            error: {
              code: 'FORBIDDEN',
              message: 'You have insufficient permissions for this resource'
            }
          },
          { status: 403 }
        );
      }
      
      const authContext: AuthContext = {
        user: {
          id: user.id,
          email: user.email!,
          name: user.name ?? null,
          role: role || 'USER',
        },
        session: null,
      };
      
      return handler(request, context, authContext);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication error'
          }
        },
        { status: 500 }
      );
    }
  };
}

export function withPermissions(
  requiredPermissions: string[],
  handler: AuthenticatedHandler
): AuthenticatedHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      const user = await currentUser();
      const role = await currentRole();
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          },
          { status: 401 }
        );
      }
      
      // Admin has all permissions
      if (role === 'ADMIN') {
        const authContext: AuthContext = {
          user: {
            id: user.id,
            email: user.email!,
            name: user.name ?? null,
            role: role,
          },
          session: null,
        };
        return handler(request, context, authContext);
      }
      
      // Check permissions (mock implementation)
      const hasPermissions = requiredPermissions.every(perm => 
        perm === 'read' || (role === 'USER' && perm === 'read')
      );
      
      if (!hasPermissions) {
        return NextResponse.json(
          { 
            success: false, 
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          },
          { status: 403 }
        );
      }
      
      const authContext: AuthContext = {
        user: {
          id: user.id,
          email: user.email!,
          name: user.name ?? null,
          role: role || 'USER',
        },
        session: null,
      };
      
      return handler(request, context, authContext);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication error'
          }
        },
        { status: 500 }
      );
    }
  };
}

export function withPublicAPI(handler: AuthenticatedHandler): AuthenticatedHandler {
  return async (request: NextRequest, context?: any) => {
    // Public API - no authentication required
    const authContext: AuthContext = {
      user: {
        id: 'anonymous',
        email: 'anonymous@example.com',
        name: null,
        role: 'PUBLIC',
      },
      session: null,
    };
    
    return handler(request, context, authContext);
  };
}