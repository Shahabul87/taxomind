import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const UpdateBlockSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  code: z.string().min(1).max(50000).optional(),
  language: z.string().min(1).max(50).optional(),
  explanation: z.string().optional(),
  position: z.number().int().min(0).optional(),
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
 * PATCH - Update a code block
 */
export async function PATCH(
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
    const validatedData = UpdateBlockSchema.parse(body);

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

    // Update block
    const updated = await db.codeExplanation.update({
      where: { id: params.blockId },
      data: validatedData
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[CODE_BLOCK_PATCH]', error);

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

/**
 * DELETE - Remove a code block
 */
export async function DELETE(
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

    // Delete block
    await db.codeExplanation.delete({
      where: { id: params.blockId }
    });

    // Recalculate line numbers for remaining blocks
    const remainingBlocks = await db.codeExplanation.findMany({
      where: { sectionId: params.sectionId },
      orderBy: { position: 'asc' }
    });

    if (remainingBlocks.length > 0) {
      let currentLine = 1;
      const lineNumbers = remainingBlocks.map((block) => {
        const lines = (block.code || '').split('\n').length;
        const lineStart = currentLine;
        const lineEnd = currentLine + lines - 1;
        currentLine = lineEnd + 2;
        return { id: block.id, lineStart, lineEnd };
      });

      await Promise.all(
        lineNumbers.map(({ id, lineStart, lineEnd }) =>
          db.codeExplanation.update({
            where: { id },
            data: { lineStart, lineEnd }
          })
        )
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    console.error('[CODE_BLOCK_DELETE]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Delete failed' }
    }, { status: 500 });
  }
}
