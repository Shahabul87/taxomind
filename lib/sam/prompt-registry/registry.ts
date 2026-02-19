/**
 * Prompt Registry
 *
 * In-memory registry that maps PromptTaskType → PromptProfile.
 * Provides registration, lookup, and system-prompt composition.
 */

import type { KnowledgeModule, PromptProfile, PromptTaskType } from './types';
import { KNOWLEDGE_MODULES } from './knowledge';

// ============================================================================
// Internal state
// ============================================================================

const profiles = new Map<string, PromptProfile<Record<string, unknown>, unknown>>();

const knowledgeIndex = new Map<string, KnowledgeModule>();

// Build the knowledge module index once
function ensureKnowledgeIndex(): void {
  if (knowledgeIndex.size > 0) return;
  for (const mod of KNOWLEDGE_MODULES) {
    knowledgeIndex.set(mod.id, mod);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Register a PromptProfile. Overwrites if same taskType already registered.
 */
export function registerProfile<TInput, TOutput>(
  profile: PromptProfile<TInput, TOutput>,
): void {
  profiles.set(profile.taskType, profile as PromptProfile<Record<string, unknown>, unknown>);
}

/**
 * Retrieve a profile by task type. Returns undefined if not registered.
 */
export function getProfile<TInput = Record<string, unknown>, TOutput = unknown>(
  taskType: PromptTaskType,
): PromptProfile<TInput, TOutput> | undefined {
  return profiles.get(taskType) as
    | PromptProfile<TInput, TOutput>
    | undefined;
}

/**
 * Compose the full system prompt for a profile by concatenating
 * the base systemPrompt with all referenced knowledge module contents.
 */
export function composeSystemPrompt<TInput, TOutput>(
  profile: PromptProfile<TInput, TOutput>,
): string {
  ensureKnowledgeIndex();

  if (profile.knowledgeModules.length === 0) {
    return profile.systemPrompt;
  }

  const knowledgeSections: string[] = [];
  for (const id of profile.knowledgeModules) {
    const mod = knowledgeIndex.get(id);
    if (mod) {
      knowledgeSections.push(`\n--- ${mod.name} ---\n${mod.content}`);
    }
  }

  if (knowledgeSections.length === 0) {
    return profile.systemPrompt;
  }

  return `${profile.systemPrompt}\n\n${knowledgeSections.join('\n')}`;
}

/**
 * List all registered profiles (for debugging / admin introspection).
 */
export function listProfiles(): { taskType: string; description: string }[] {
  return Array.from(profiles.values()).map((p) => ({
    taskType: p.taskType,
    description: p.description,
  }));
}
