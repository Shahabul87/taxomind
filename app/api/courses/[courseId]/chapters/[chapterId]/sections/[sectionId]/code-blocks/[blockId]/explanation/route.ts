import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const ExplanationSchema = z.object({
  explanation: z.string()
    .min(10, 'Explanation must be at least 10 characters')
    .max(50000, 'Explanation must not exceed 50,000 characters')
});

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * POST/PATCH - Add or update explanation for a code block
 */
export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; blockId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = ExplanationSchema.parse(body);

    // Verify ownership
    const codeBlock = await db.codeExplanation.findUnique({
      where: { id: params.blockId },
      include: {
        section: {
          include: {
            chapter: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    if (!codeBlock || codeBlock.section.chapter.course.userId !== userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, { status: 403 });
    }

    // Update explanation
    const updated = await db.codeExplanation.update({
      where: { id: params.blockId },
      data: {
        explanation: validatedData.explanation,
        updatedAt: new Date()
      }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[CODE_BLOCK_EXPLANATION]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors as unknown as Record<string, unknown>
        }
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Update failed' }
    }, { status: 500 });
  }
}
