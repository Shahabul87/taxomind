/**
 * SAM Tool Discovery API
 *
 * GET: Returns list of available tools with their status, category, and metadata.
 * Useful for the chat UI to show which tools SAM has access to.
 */

import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  getExternalAPIToolIds,
} from '@/lib/sam/agentic-external-api-tools';
import {
  getAdapterDiscoverySummary,
  refreshAdapterAvailability,
} from '@/lib/sam/tools/adapters/tool-adapter-interface';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Refresh adapter availability before returning
    refreshAdapterAvailability();

    // Get built-in external API tools
    const builtInToolIds = getExternalAPIToolIds();
    const builtInTools = builtInToolIds.map((id) => ({
      id,
      name: formatToolName(id),
      category: categorizeBuiltInTool(id),
      available: true, // Built-in tools are always available
      requiresApiKey: false,
    }));

    // Get adapter-based tools
    const adapterTools = getAdapterDiscoverySummary();

    return NextResponse.json({
      tools: [
        ...builtInTools,
        ...adapterTools.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          available: t.available,
          requiresApiKey: t.metadata.requiresApiKey,
          description: t.description,
        })),
      ],
      totalAvailable: builtInTools.length + adapterTools.filter((t) => t.available).length,
      totalRegistered: builtInTools.length + adapterTools.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Tool Discovery] Error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to retrieve tool information' },
      { status: 500 },
    );
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function formatToolName(toolId: string): string {
  return toolId
    .replace('external-', '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function categorizeBuiltInTool(toolId: string): string {
  if (toolId.includes('search')) return 'search';
  if (toolId.includes('dictionary')) return 'reference';
  if (toolId.includes('wikipedia')) return 'reference';
  if (toolId.includes('calculator')) return 'calculation';
  if (toolId.includes('url') || toolId.includes('fetch')) return 'content';
  return 'general';
}
