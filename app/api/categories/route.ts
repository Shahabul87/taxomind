import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    console.log("[CATEGORIES_POST] Request received");
    
    // Get user from session
    const user = await currentUser();
    
    if (!user?.id) {
      console.log("[CATEGORIES_POST] Authentication failed: No user ID");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    console.log("[CATEGORIES_POST] Authenticated user ID:", user.id);
    
    // Parse request body
    const body = await req.json();
    console.log("[CATEGORIES_POST] Request body:", body);
    
    const { name } = body;
    
    if (!name || typeof name !== "string") {
      console.log("[CATEGORIES_POST] Invalid name:", name);
      return new NextResponse("Name is required", { status: 400 });
    }
    
    // Check if category already exists
    try {
      console.log("[CATEGORIES_POST] Checking if category exists:", name);
      
      const existingCategory = await db.category.findFirst({
        where: {
          name: { 
            equals: name, 
            mode: 'insensitive' // Case insensitive search
          }
        }
      });
      
      if (existingCategory) {
        console.log("[CATEGORIES_POST] Category already exists:", existingCategory);
        // If the category already exists, just return it
        return NextResponse.json(existingCategory);
      }
      
      // Create slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '') // Remove special characters
        .replace(/\s+/g, '-'); // Replace spaces with hyphens
      
      console.log("[CATEGORIES_POST] Creating new category with name:", name);
      
      // Create a new category
      const category = await db.category.create({
        data: {
          name,
        }
      });
      
      console.log("[CATEGORIES_POST] New category created:", category);
      return NextResponse.json(category);
    } catch (dbError) {
      console.error("[CATEGORIES_POST] Database error:", dbError);
      return new NextResponse(`Database Error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`, { status: 500 });
    }
  } catch (error) {
    console.error("[CATEGORIES_POST] Detailed error:", error);
    if (error instanceof Error && error.name === "SyntaxError") {
      return new NextResponse("Invalid JSON in request body", { status: 400 });
    }
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        name: "asc"
      }
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 