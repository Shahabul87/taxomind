import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAexport const POST = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const { title, blogUrl, description, rating } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First verify the section exists
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
    });

    if (!section) {
      return new NextResponse("Section not found", { status: 404 });
    }

    // Create the blog with only the fields defined in the schema
    const blog = await db.blog.create({
      data: {
        title,
        url: blogUrl,
        description,
        rating: Number(rating),
        sectionId: params.sectionId,
        userId: session.user.id,
        isPublished: true,
        position: 0, // Add a default position
      },
    });

    return NextResponse.json(blog);
  } catch (error: any) {
    logger.error("[BLOGS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ sectionId: string }> }) {
  const params = await props.params;
  try {
    const blogs = await db.blog.findMany({
      where: {
        sectionId: params.sectionId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(blogs);
  } catch (error: any) {
    logger.error("[BLOGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 