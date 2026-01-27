import { createHash } from "crypto";
import { z } from "zod";
import {
  type AIAdapter,
} from "@sam-ai/core";
import {
  EmbeddingSourceType,
  EntityType,
  RelationshipType,
} from "@sam-ai/agentic";
import { getDefaultAdapter } from "@/lib/sam/providers/ai-factory";
import { logger } from "@/lib/logger";
import { getAgenticMemorySystem, buildMemoryMetadata } from "@/lib/sam/agentic-memory";

export interface MemoryIngestionInput {
  content: string;
  sourceId: string;
  sourceType: keyof typeof EmbeddingSourceType;
  userId?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  tags?: string[];
  language?: string;
  customMetadata?: Record<string, unknown>;
  enableSummary?: boolean;
  enableKnowledgeGraph?: boolean;
}

interface KnowledgeExtraction {
  nodes: Array<{
    name: string;
    type: (typeof EntityType)[keyof typeof EntityType];
    description?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: (typeof RelationshipType)[keyof typeof RelationshipType];
  }>;
}

const summarySchema = z.object({
  summary: z.string().min(1),
  keyConcepts: z.array(z.string()).optional(),
});

const knowledgeSchema = z.object({
  nodes: z.array(z.object({
    name: z.string().min(1),
    type: z.enum([
      EntityType.CONCEPT,
      EntityType.TOPIC,
      EntityType.SKILL,
      EntityType.COURSE,
      EntityType.CHAPTER,
      EntityType.SECTION,
      EntityType.RESOURCE,
      EntityType.LEARNING_OBJECTIVE,
    ]),
    description: z.string().optional(),
  })).default([]),
  edges: z.array(z.object({
    source: z.string().min(1),
    target: z.string().min(1),
    type: z.enum([
      RelationshipType.RELATED_TO,
      RelationshipType.PREREQUISITE_OF,
      RelationshipType.PART_OF,
      RelationshipType.REQUIRES,
      RelationshipType.TEACHES,
      RelationshipType.FOLLOWS,
      RelationshipType.REFERENCES,
    ]),
  })).default([]),
});

const ingestionQueue: MemoryIngestionInput[] = [];
let isProcessing = false;

const MAX_CHUNK_LENGTH = 1200;
const MAX_SUMMARY_LENGTH = 800;

let memoryAiAdapter: AIAdapter | null = null;

function getMemoryAiAdapter(): AIAdapter {
  if (memoryAiAdapter) return memoryAiAdapter;
  const adapter = getDefaultAdapter({ timeout: 60000, maxRetries: 1 });
  if (!adapter) {
    throw new Error("No AI provider is configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.");
  }
  memoryAiAdapter = adapter;
  return memoryAiAdapter;
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function chunkText(content: string): string[] {
  const paragraphs = content.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length <= MAX_CHUNK_LENGTH) {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (paragraph.length > MAX_CHUNK_LENGTH) {
      for (let i = 0; i < paragraph.length; i += MAX_CHUNK_LENGTH) {
        chunks.push(paragraph.slice(i, i + MAX_CHUNK_LENGTH));
      }
    } else {
      current = paragraph;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [content];
}

async function summarizeContent(content: string): Promise<{ summary: string; keyConcepts?: string[] } | null> {
  const adapter = getMemoryAiAdapter();
  const prompt = [
    "Summarize the following content for long-term memory.",
    "Return JSON: {\"summary\": \"...\", \"keyConcepts\": [\"...\"]}",
    content.slice(0, 4000),
  ].join("\n\n");

  const response = await adapter.chat({
    messages: [{ role: "user", content: prompt }],
    systemPrompt: "Return only JSON. No markdown.",
    temperature: 0.2,
    maxTokens: 800,
  });

  try {
    const json = response.content.trim().replace(/```json|```/g, "").trim();
    return summarySchema.parse(JSON.parse(json));
  } catch (error) {
    logger.warn("[MEMORY_INGESTION] Failed to parse summary:", error);
    return null;
  }
}

async function extractKnowledge(content: string): Promise<KnowledgeExtraction | null> {
  const adapter = getMemoryAiAdapter();
  const prompt = [
    "Extract knowledge graph nodes and relationships from the content.",
    "Use only the provided types.",
    "Return JSON: {\"nodes\": [{\"name\": \"\", \"type\": \"concept\", \"description\": \"\"}], \"edges\": [{\"source\": \"\", \"target\": \"\", \"type\": \"related_to\"}]}",
    content.slice(0, 4000),
  ].join("\n\n");

  const response = await adapter.chat({
    messages: [{ role: "user", content: prompt }],
    systemPrompt: "Return only JSON. No markdown.",
    temperature: 0.2,
    maxTokens: 800,
  });

  try {
    const json = response.content.trim().replace(/```json|```/g, "").trim();
    return knowledgeSchema.parse(JSON.parse(json));
  } catch (error) {
    logger.warn("[MEMORY_INGESTION] Failed to parse knowledge graph:", error);
    return null;
  }
}

async function storeEmbedding(content: string, input: MemoryIngestionInput, sourceId: string, tags?: string[]) {
  const memorySystem = await getAgenticMemorySystem();
  const contentHash = hashContent(content);

  const existingCount = await memorySystem.vectorStore.count({
    customFilters: {
      sourceId,
      contentHash,
    },
  });

  if (existingCount > 0) {
    return;
  }

  await memorySystem.vectorStore.insert(
    content,
    buildMemoryMetadata({
      sourceId,
      sourceType: input.sourceType,
      userId: input.userId,
      courseId: input.courseId,
      chapterId: input.chapterId,
      sectionId: input.sectionId,
      contentHash,
      tags: tags ?? input.tags,
      language: input.language,
      customMetadata: input.customMetadata,
    })
  );
}

async function upsertEntity(
  name: string,
  entityType: (typeof EntityType)[keyof typeof EntityType],
  description?: string
) {
  const memorySystem = await getAgenticMemorySystem();
  const existing = await memorySystem.knowledgeGraph.findEntities(entityType, name, 5);
  const match = existing.find(
    (entity) => entity.name.toLowerCase() === name.toLowerCase()
  );

  if (match) {
    return match.id;
  }

  const created = await memorySystem.knowledgeGraph.createEntity(
    entityType,
    name,
    { description }
  );
  return created.id;
}

async function processIngestion(input: MemoryIngestionInput) {
  const chunks = chunkText(input.content);

  await Promise.all(
    chunks.map((chunk, index) =>
      storeEmbedding(
        chunk,
        input,
        `${input.sourceId}:chunk:${index + 1}`,
        [...(input.tags ?? []), "chunk"]
      )
    )
  );

  if (input.enableSummary !== false && input.content.length > MAX_CHUNK_LENGTH) {
    const summary = await summarizeContent(input.content);
    if (summary?.summary) {
      await storeEmbedding(
        summary.summary.slice(0, MAX_SUMMARY_LENGTH),
        input,
        `${input.sourceId}:summary`,
        [...(input.tags ?? []), "summary"]
      );
    }
  }

  if (input.enableKnowledgeGraph) {
    const extraction = await extractKnowledge(input.content);
    if (extraction) {
      const entityIds = new Map<string, string>();

      for (const node of extraction.nodes) {
        const entityId = await upsertEntity(node.name, node.type, node.description);
        entityIds.set(node.name.toLowerCase(), entityId);
      }

      for (const edge of extraction.edges) {
        const sourceId = entityIds.get(edge.source.toLowerCase());
        const targetId = entityIds.get(edge.target.toLowerCase());
        if (!sourceId || !targetId) continue;

        try {
          const memorySystem = await getAgenticMemorySystem();
          await memorySystem.knowledgeGraph.createRelationship(
            sourceId,
            targetId,
            edge.type
          );
        } catch (error) {
          logger.warn("[MEMORY_INGESTION] Failed to create relationship:", error);
        }
      }
    }
  }
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (ingestionQueue.length > 0) {
    const job = ingestionQueue.shift();
    if (!job) continue;
    try {
      await processIngestion(job);
    } catch (error) {
      logger.warn("[MEMORY_INGESTION] Job failed:", error);
    }
  }

  isProcessing = false;
}

export async function processMemoryIngestion(input: MemoryIngestionInput): Promise<void> {
  await processIngestion(input);
}

async function enqueueMemoryJob(input: MemoryIngestionInput): Promise<boolean> {
  try {
    const { queueManager } = await import('@/lib/queue/queue-manager');
    const queueName = process.env.SAM_AGENTIC_QUEUE ?? 'agentic';
    await queueManager.addJob(
      queueName,
      'sam-memory-ingestion',
      {
        ...input,
        sourceType: input.sourceType,
      },
      { removeOnComplete: 100, removeOnFail: 50 }
    );
    return true;
  } catch (error) {
    logger.warn('[MEMORY_INGESTION] Queue unavailable, falling back to local queue:', error);
    return false;
  }
}

export function queueMemoryIngestion(input: MemoryIngestionInput) {
  const useQueue = process.env.SAM_USE_MEMORY_QUEUE === 'true';
  if (useQueue) {
    void enqueueMemoryJob(input);
    return;
  }

  ingestionQueue.push(input);
  if (!isProcessing) {
    setTimeout(() => {
      void processQueue();
    }, 0);
  }
}
