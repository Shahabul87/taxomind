import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

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
  } catch (error) {

    return new NextResponse("Internal Server Error", { status: 500 });
  }
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
  } catch (error) {
    logger.error("[PATCH ERROR] Profile Link Update:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

