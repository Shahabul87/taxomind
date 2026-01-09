/**
 * AI Providers API Route
 * GET: Returns list of all available AI providers and their configuration status
 */

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getAllProviders } from "@/lib/sam/providers/ai-registry";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all providers with their configuration status
    const providers = getAllProviders().map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      models: provider.models,
      defaultModel: provider.defaultModel,
      capabilities: provider.capabilities,
      isConfigured: provider.isConfigured(),
    }));

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("[AI_PROVIDERS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
