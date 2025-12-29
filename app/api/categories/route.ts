import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {

    // Get user from session
    const user = await currentUser();
    
    if (!user?.id) {

      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    const { name, parentId } = body;

    if (!name || typeof name !== "string") {

      return new NextResponse("Name is required", { status: 400 });
    }

    // Check if category already exists
    try {

      // For subcategories, check if it exists under the same parent
      const existingCategory = await db.category.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive' // Case insensitive search
          },
          parentId: parentId || null, // Check under the same parent
        }
      });

      if (existingCategory) {

        // If the category already exists, just return it
        return NextResponse.json(existingCategory);
      }

      // If parentId is provided, verify the parent exists
      if (parentId) {
        const parentCategory = await db.category.findUnique({
          where: { id: parentId }
        });

        if (!parentCategory) {
          return new NextResponse("Parent category not found", { status: 404 });
        }
      }

      // Create a new category (or subcategory if parentId is provided)
      const category = await db.category.create({
        data: {
          name,
          parentId: parentId || null,
        }
      });

      return NextResponse.json(category);
    } catch (dbError) {
      logger.error("[CATEGORIES_POST] Database error:", dbError);
      return new NextResponse(`Database Error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`, { status: 500 });
    }
  } catch (error) {
    logger.error("[CATEGORIES_POST] Detailed error:", error);
    if (error instanceof Error && error.name === "SyntaxError") {
      return new NextResponse("Invalid JSON in request body", { status: 400 });
    }
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get all top-level categories (those without a parent)
    const categories = await db.category.findMany({
      where: {
        parentId: null, // Only get top-level categories
      },
      orderBy: {
        name: "asc"
      },
      include: {
        children: {
          orderBy: {
            name: "asc"
          }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    logger.error("[CATEGORIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 