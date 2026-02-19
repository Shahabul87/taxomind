import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BloomsAligner } from "@sam-ai/pedagogy";
import { devOnlyGuard } from "@/lib/api/dev-only-guard";

// Request schema
const RequestSchema = z.object({
  content: z.string().min(20, "Content must be at least 20 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // Demo route — dev/staging only
    const blocked = devOnlyGuard();
    if (blocked) return blocked;

    const body = await req.json();

    // Validate request
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Analyze content using BloomsAligner
    const aligner = new BloomsAligner();
    const result = await aligner.evaluate({
      content,
      type: "explanation",
      targetBloomsLevel: "UNDERSTAND",
    });

    // Extract recommendations as gaps
    const gaps = result.recommendations || [];

    return NextResponse.json({
      distribution: result.detectedDistribution,
      dominantLevel: result.dominantLevel,
      gaps,
      verbCount: result.verbAnalysis.totalVerbs,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("Blooms analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
