import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { withAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';

// GET can be public for user profiles (but could also be protected based on requirements)
export const GET = withPublicAPI(async (request, params) => {
  try {
    const { userId } = params;
    const userDetails = await db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profileLinks: true,
      },
    });

    return NextResponse.json(userDetails);
  } catch (error: any) {
    logger.error("[USER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}, {
  rateLimit: { requests: 100, window: 60000 } // Higher limit for profile views
});

export const PATCH = withOwnership(
  async (request, context, params) => {
    try {
      const { image } = await request.json();

      const updatedUser = await db.user.update({
        where: {
          id: params.userId
        },
        data: {
          image
        }
      });

      return NextResponse.json(updatedUser);
    } catch (error: any) {
      logger.error("[USER_PATCH]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  },
  async (request, params) => params?.userId, // Extract userId from params for ownership check
  {
    rateLimit: { requests: 10, window: 60000 }, // 10 profile updates per minute
    auditLog: true
  }
); 