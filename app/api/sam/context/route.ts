/**
 * SAM Context Snapshot API Route
 *
 * Dedicated endpoint for receiving page context snapshots from the client.
 * Called automatically by useContextMemorySync, not by user messages.
 *
 * POST /api/sam/context
 * Body: { snapshot: PageContextSnapshot }
 * Response: { success: boolean, contextId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUserOrAdmin } from '@/lib/auth';
import { z } from 'zod';
import {
  createSAMConfig,
  type PageContextSnapshot,
} from '@sam-ai/core';
import { getSAMAdapter } from '@/lib/sam/ai-provider';
import { processContextSnapshot } from '@/lib/sam/context-gathering-integration';

// ============================================================================
// VALIDATION
// ============================================================================

const SnapshotSchema = z.object({
  version: z.string(),
  timestamp: z.number(),
  contentHash: z.string(),
  page: z.object({
    type: z.string(),
    path: z.string(),
    title: z.string(),
    entityId: z.string().optional(),
    parentEntityId: z.string().optional(),
    grandParentEntityId: z.string().optional(),
    capabilities: z.array(z.string()),
    breadcrumb: z.array(z.string()),
    state: z.object({
      isEditing: z.boolean(),
      isDraft: z.boolean(),
      isPublished: z.boolean(),
      hasUnsavedChanges: z.boolean(),
      permissions: z.array(z.string()),
      step: z.number().optional(),
      totalSteps: z.number().optional(),
    }),
    meta: z.record(z.string()),
  }),
  forms: z.array(z.object({
    formId: z.string(),
    formName: z.string(),
    purpose: z.string(),
    action: z.string().optional(),
    method: z.string().optional(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      value: z.unknown(),
      label: z.string(),
      placeholder: z.string().optional(),
      helpText: z.string().optional(),
      required: z.boolean(),
      disabled: z.boolean(),
      readOnly: z.boolean(),
      hidden: z.boolean(),
      validationState: z.enum(['valid', 'invalid', 'pending', 'untouched']),
      errors: z.array(z.string()),
      options: z.array(z.object({
        value: z.string(),
        label: z.string(),
        selected: z.boolean(),
      })).optional(),
      min: z.union([z.number(), z.string()]).optional(),
      max: z.union([z.number(), z.string()]).optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      step: z.number().optional(),
      group: z.string().optional(),
      order: z.number(),
      dataAttributes: z.record(z.string()),
    })),
    fieldGroups: z.array(z.object({
      name: z.string(),
      label: z.string().optional(),
      fields: z.array(z.string()),
      order: z.number(),
    })),
    state: z.object({
      isDirty: z.boolean(),
      isValid: z.boolean(),
      isSubmitting: z.boolean(),
      completionPercent: z.number(),
      errorCount: z.number(),
    }),
    validation: z.object({
      rules: z.record(z.array(z.object({
        type: z.string(),
        value: z.union([z.string(), z.number()]).optional(),
        message: z.string().optional(),
      }))),
      dependencies: z.array(z.object({
        sourceField: z.string(),
        targetField: z.string(),
        type: z.string(),
        condition: z.string(),
      })),
    }),
  })),
  content: z.object({
    headings: z.array(z.object({
      level: z.number(),
      text: z.string(),
      id: z.string().optional(),
    })),
    tables: z.array(z.object({
      caption: z.string().optional(),
      headers: z.array(z.string()),
      rowCount: z.number(),
    })),
    codeBlocks: z.array(z.object({
      language: z.string().optional(),
      preview: z.string(),
    })),
    images: z.array(z.object({
      alt: z.string(),
      src: z.string(),
    })),
    textSummary: z.string(),
    wordCount: z.number(),
    readingTimeMinutes: z.number(),
  }),
  navigation: z.object({
    links: z.array(z.object({
      href: z.string(),
      text: z.string(),
      category: z.enum(['navigation', 'action', 'external', 'resource', 'breadcrumb', 'pagination']),
      ariaLabel: z.string().optional(),
      isActive: z.boolean(),
    })),
    pagination: z.object({
      current: z.number(),
      total: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }).optional(),
    tabs: z.array(z.object({
      label: z.string(),
      isActive: z.boolean(),
      href: z.string().optional(),
    })).optional(),
    sidebar: z.array(z.object({
      label: z.string(),
      href: z.string(),
      isActive: z.boolean(),
      depth: z.number(),
    })).optional(),
  }),
  interaction: z.object({
    scrollPosition: z.number(),
    viewportHeight: z.number(),
    focusedElement: z.string().optional(),
    selectedText: z.string().optional(),
    timeOnPage: z.number(),
  }),
  custom: z.record(z.unknown()),
});

const RequestSchema = z.object({
  snapshot: SnapshotSchema,
});

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const user = await currentUserOrAdmin();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid snapshot data',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { snapshot } = parsed.data;

    // Build SAM config (lightweight — no AI calls needed for context processing)
    const aiAdapter = await getSAMAdapter({ userId: user.id, capability: 'chat' });
    const samConfig = createSAMConfig({ ai: aiAdapter });

    // Process the snapshot
    const output = await processContextSnapshot(
      snapshot as PageContextSnapshot,
      {
        samConfig,
        userId: user.id,
        userRole: user.role ?? 'USER',
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        contextId: output.snapshot.contentHash,
        pageIntent: output.pageIntent,
        confidence: output.contextConfidence,
        availableActions: output.availableActions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}
