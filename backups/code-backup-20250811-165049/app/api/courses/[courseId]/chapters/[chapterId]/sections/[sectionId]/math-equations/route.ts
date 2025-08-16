import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const sectionOwner = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapter: {
          courseId: params.courseId
        }
      }
    });

    if (!sectionOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get math explanations using the proper MathExplanation model
    const mathEquations = await db.mathExplanation.findMany({
      where: {
        sectionId: params.sectionId,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(mathEquations);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { title, equation, explanation, imageUrl, content, mode } = await req.json();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const sectionOwner = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapter: {
          courseId: params.courseId
        }
      }
    });

    if (!sectionOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Prepare the data to be stored in MathExplanation model
    let contentData;
    let equationData;
    let imageUrlData;
    
    if (mode === "visual") {
      // Store visual mode data
      contentData = content || explanation || "";
      equationData = null; // No equation for visual mode
      imageUrlData = imageUrl || "";
    } else {
      // For equation mode, store LaTeX equation
      equationData = equation || "";
      contentData = explanation || "";
      imageUrlData = null; // No image for equation mode
    }

    // Use the proper MathExplanation model with new fields
    const mathEquation = await db.mathExplanation.create({
      data: {
        title: title,
        content: contentData,
        latex: equationData, // Keep backward compatibility with existing latex field
        equation: equationData, // New equation field
        imageUrl: imageUrlData, // New imageUrl field
        mode: mode || "equation", // New mode field
        sectionId: params.sectionId,
        isPublished: true, // Set as published by default
      }
    });

    return NextResponse.json(mathEquation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 