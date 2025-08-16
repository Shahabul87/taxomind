import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
export const DELETE = withOwnership(
  async (request, context, params) => {
    
  },
  async (request, params) => params?.userId, // Extract userId for ownership check
  {
    rateLimit: { requests: 20, window: 60000 },
    auditLog: true
  }
); from '@/lib/api/with-api-auth';

export async function DELETE(req: Request, props: { params: Promise<{ profileLinkId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the profile link exists and belongs to the current user
    const profileLink = await db.profileLink.findUnique({
      where: {
        id: params.profileLinkId,
      },
    });

    if (!profileLink || profileLink.userId !== user.id) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    // Delete the profile link
    const deletedProfileLink = await db.profileLink.delete({
      where: {
        id: params.profileLinkId,
      },
    });

    return NextResponse.json(deletedProfileLink);
  } catexport const PATCH = withOwnership(
  async (request, context, params) => {
    
  },
  async (request, params) => params?.userId, // Extract userId for ownership check
  {
    rateLimit: { requests: 20, window: 60000 },
    auditLog: true
  }
);
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ userId: string, profileLinkId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { platform, url } = await req.json();

    //console.log(platform)

    // Check if the user is authenticated
    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate required fields for profile link update
    if (!platform || !url) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Update the existing profile link in the database
    const updatedProfileLink = await db.profileLink.update({
      where: { 
        id: params.profileLinkId,
        userId: user.id, // Ensure the link belongs to the authenticated user
      },
      data: {
        platform,
        url,
      },
    });

    // Return the updated profile link information
    return new NextResponse(JSON.stringify(updatedProfileLink), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    logger.error("[PATCH ERROR] Profile Link Update:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

