import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    // Get current session
    const session = await auth();

    // Check if in development mode
    // NOTE: Admin access is handled separately via AdminAccount auth
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Only allow in development mode (admins use separate AdminAccount auth)
    if (!isDevelopment) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Debug endpoint only available in development mode'
        },
        { status: 403 }
      );
    }

    // Collect debug information
    const debugData: any = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        debugMode: isDevelopment ? 'development' : 'production-admin'
      },
      session: null,
      user: null,
      profileLinks: [],
      socialMediaAccounts: [],
      error: null
    };

    // Session information
    if (session) {
      debugData.session = {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          image: session.user?.image,
          // emailVerified: session.user?.emailVerified, // Not available on session user
          isTwoFactorEnabled: session.user?.isTwoFactorEnabled,
          isOAuth: session.user?.isOAuth
        },
        expires: session.expires
      };

      // Get comprehensive user data from database
      if (session.user?.id) {
        try {
          const userData = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
              accounts: {
                select: {
                  id: true,
                  type: true,
                  provider: true,
                  providerAccountId: true,
                  scope: true,
                  token_type: true,
                  userId: true,
                  refresh_token: true,
                  access_token: true,
                  expires_at: true,
                  id_token: true,
                  session_state: true
                }
              },
              profileLinks: {
                orderBy: { createdAt: 'desc' }
              },
              SocialMediaAccount: {
                select: {
                  id: true,
                  platform: true,
                  username: true,
                  displayName: true,
                  profileUrl: true,
                  followerCount: true,
                  followingCount: true,
                  postsCount: true,
                  isActive: true,
                  lastSyncAt: true,
                  createdAt: true
                }
              },
              Post: {
                select: {
                  id: true,
                  title: true,
                  createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              Comment: {
                select: {
                  id: true,
                  content: true,
                  createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              courses: {
                select: {
                  id: true,
                  title: true,
                  createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              // ideas: { // Not available in schema
              //   select: {
              //     id: true,
              //     title: true,
              //     createdAt: true
              //   },
              //   orderBy: { createdAt: 'desc' },
              //   take: 5
              // }
            }
          });

          if (userData) {
            debugData.user = {
              basic: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                image: userData.image,
                phone: userData.phone,
                emailVerified: userData.emailVerified,
                isTwoFactorEnabled: userData.isTwoFactorEnabled,
                createdAt: userData.createdAt,
                // updatedAt: userData.updatedAt // Not available in query result
              },
              accounts: userData.accounts,
              profileLinks: userData.profileLinks,
              socialMediaAccounts: userData.SocialMediaAccount,
              recentPosts: userData.Post,
              recentComments: userData.Comment,
              recentCourses: userData.courses,
              // recentIdeas: userData.ideas, // Not available in schema
              counts: {
                posts: userData.Post.length,
                comments: userData.Comment.length,
                courses: userData.courses.length,
                // ideas: userData.ideas.length, // Not available in schema
                profileLinks: userData.profileLinks.length,
                socialAccounts: userData.SocialMediaAccount.length,
                connectedProviders: userData.accounts.length
              }
            };

            debugData.profileLinks = userData.profileLinks;
            debugData.socialMediaAccounts = userData.SocialMediaAccount;
          } else {
            debugData.error = 'User not found in database';
          }

        } catch (dbError) {
          debugData.error = `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
          logger.error('Debug API database error:', dbError);
        }
      }
    } else {
      debugData.session = null;
      debugData.error = 'No active session';
    }

    // Additional debug info
    debugData.requestInfo = {
      url: request.url,
      method: request.method,
      headers: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin')
      }
    };

    // Database connection check
    try {
      await db.$queryRaw`SELECT 1`;
      debugData.database = { status: 'connected' };
    } catch (dbError) {
      debugData.database = { 
        status: 'error', 
        error: dbError instanceof Error ? dbError.message : 'Unknown error' 
      };
    }

    return NextResponse.json(debugData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    logger.error('Debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV 
      }, 
      { status: 500 }
    );
  }
}

// POST endpoint for testing data modifications
export async function POST(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const session = await auth();
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Only allow in development mode (admins use separate AdminAccount auth)
    if (!isDevelopment) {
      return NextResponse.json(
        { error: 'Unauthorized - debug endpoint only available in development' },
        { status: 403 }
      );
    }

    const { action, data } = await request.json();

    const result: any = {
      action,
      timestamp: new Date().toISOString(),
      success: false,
      result: null,
      error: null
    };

    if (!session?.user?.id) {
      result.error = 'No user session';
      return NextResponse.json(result, { status: 401 });
    }

    switch (action) {
      case 'refresh-session':
        // Force session refresh by returning current session
        const currentSession = await auth();
        result.success = true;
        result.result = currentSession;
        break;

      case 'test-profile-link':
        // Test adding a profile link
        if (data?.platform && data?.url) {
          const profileLink = await db.profileLink.create({
            data: {
              platform: data.platform,
              url: data.url,
              userId: session.user.id
            }
          });
          result.success = true;
          result.result = profileLink;
        } else {
          result.error = 'Missing platform or url in data';
        }
        break;

      case 'clear-profile-links':
        // Clear all profile links (development only)
        if (isDevelopment) {
          const deleted = await db.profileLink.deleteMany({
            where: { userId: session.user.id }
          });
          result.success = true;
          result.result = { deletedCount: deleted.count };
        } else {
          result.error = 'Clear action only available in development';
        }
        break;

      default:
        result.error = `Unknown action: ${action}`;
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });

  } catch (error) {
    logger.error('Debug API POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
} 