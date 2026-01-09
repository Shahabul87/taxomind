/**
 * SAM Agentic Tools Seed Script
 *
 * Seeds the AgentTool table with SAM AI Tutor tools
 *
 * Usage: npx tsx scripts/seed-agentic-tools.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env.development") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  inputSchema: string;
  outputSchema?: string;
  requiredPermissions: string[];
  confirmationType: "none" | "implicit" | "explicit" | "strict";
  timeoutMs?: number;
  maxRetries?: number;
  tags: string[];
  enabled: boolean;
  deprecated: boolean;
}

const samTools: ToolDefinition[] = [
  // Content Generation Tools
  {
    id: "generate_explanation",
    name: "Generate Explanation",
    description: "Generates detailed explanations for concepts, adapting complexity to student level using Bloom's taxonomy and scaffolding techniques.",
    category: "content",
    version: "1.2.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        concept: { type: "string", description: "The concept to explain" },
        difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
        context: { type: "string", description: "Course or subject context" },
        studentId: { type: "string", description: "Student ID for personalization" },
      },
      required: ["concept"],
    }),
    outputSchema: JSON.stringify({
      type: "object",
      properties: {
        explanation: { type: "string" },
        examples: { type: "array", items: { type: "string" } },
        followUpQuestions: { type: "array", items: { type: "string" } },
      },
    }),
    requiredPermissions: ["read", "execute"],
    confirmationType: "none",
    timeoutMs: 30000,
    maxRetries: 2,
    tags: ["ai", "content", "explanation", "pedagogy"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "create_practice_questions",
    name: "Create Practice Questions",
    description: "Generates practice questions and quizzes based on learning objectives and student mastery level.",
    category: "content",
    version: "1.1.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        topic: { type: "string" },
        questionCount: { type: "number", minimum: 1, maximum: 20 },
        difficulty: { type: "string", enum: ["easy", "medium", "hard", "mixed"] },
        questionTypes: { type: "array", items: { type: "string", enum: ["mcq", "short_answer", "true_false", "fill_blank"] } },
      },
      required: ["topic", "questionCount"],
    }),
    requiredPermissions: ["read", "execute"],
    confirmationType: "none",
    timeoutMs: 45000,
    maxRetries: 2,
    tags: ["ai", "assessment", "questions", "practice"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "generate_study_plan",
    name: "Generate Study Plan",
    description: "Creates personalized study plans based on learning goals, available time, and student preferences.",
    category: "content",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        courseId: { type: "string" },
        targetDate: { type: "string", format: "date" },
        hoursPerWeek: { type: "number" },
        focusAreas: { type: "array", items: { type: "string" } },
      },
      required: ["courseId"],
    }),
    requiredPermissions: ["read", "execute"],
    confirmationType: "implicit",
    timeoutMs: 20000,
    maxRetries: 2,
    tags: ["ai", "planning", "study", "personalization"],
    enabled: true,
    deprecated: false,
  },

  // Assessment Tools
  {
    id: "evaluate_answer",
    name: "Evaluate Answer",
    description: "Evaluates student answers using rubric-based assessment with detailed feedback and suggestions.",
    category: "assessment",
    version: "2.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        questionId: { type: "string" },
        studentAnswer: { type: "string" },
        rubricId: { type: "string" },
        provideFeedback: { type: "boolean", default: true },
      },
      required: ["questionId", "studentAnswer"],
    }),
    outputSchema: JSON.stringify({
      type: "object",
      properties: {
        score: { type: "number" },
        maxScore: { type: "number" },
        feedback: { type: "string" },
        suggestions: { type: "array", items: { type: "string" } },
        rubricBreakdown: { type: "object" },
      },
    }),
    requiredPermissions: ["read", "write", "execute"],
    confirmationType: "none",
    timeoutMs: 15000,
    maxRetries: 3,
    tags: ["ai", "assessment", "grading", "feedback"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "diagnose_misconception",
    name: "Diagnose Misconception",
    description: "Analyzes student responses to identify and diagnose common misconceptions and knowledge gaps.",
    category: "assessment",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        responses: { type: "array", items: { type: "object" } },
        topic: { type: "string" },
      },
      required: ["studentId", "responses"],
    }),
    requiredPermissions: ["read", "execute"],
    confirmationType: "none",
    timeoutMs: 25000,
    maxRetries: 2,
    tags: ["ai", "diagnosis", "misconception", "learning-analytics"],
    enabled: true,
    deprecated: false,
  },

  // Memory Tools
  {
    id: "recall_context",
    name: "Recall Context",
    description: "Retrieves relevant context from previous conversations and learning sessions for continuity.",
    category: "memory",
    version: "1.3.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        topic: { type: "string" },
        timeRange: { type: "string", enum: ["today", "week", "month", "all"] },
        limit: { type: "number", default: 10 },
      },
      required: ["studentId"],
    }),
    requiredPermissions: ["read"],
    confirmationType: "none",
    timeoutMs: 5000,
    maxRetries: 3,
    tags: ["memory", "context", "retrieval"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "update_mastery",
    name: "Update Mastery",
    description: "Updates student mastery levels based on assessment results and learning activities.",
    category: "memory",
    version: "1.1.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        conceptId: { type: "string" },
        evidence: { type: "object" },
        masteryDelta: { type: "number" },
      },
      required: ["studentId", "conceptId", "evidence"],
    }),
    requiredPermissions: ["read", "write"],
    confirmationType: "none",
    timeoutMs: 5000,
    maxRetries: 3,
    tags: ["memory", "mastery", "tracking"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "schedule_review",
    name: "Schedule Review",
    description: "Schedules spaced repetition reviews based on forgetting curve algorithms.",
    category: "memory",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        conceptIds: { type: "array", items: { type: "string" } },
        algorithm: { type: "string", enum: ["sm2", "fsrs", "custom"] },
      },
      required: ["studentId", "conceptIds"],
    }),
    requiredPermissions: ["read", "write"],
    confirmationType: "none",
    timeoutMs: 10000,
    maxRetries: 2,
    tags: ["memory", "spaced-repetition", "scheduling"],
    enabled: true,
    deprecated: false,
  },

  // Communication Tools
  {
    id: "send_notification",
    name: "Send Notification",
    description: "Sends notifications to students about study reminders, achievements, or important updates.",
    category: "communication",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        type: { type: "string", enum: ["reminder", "achievement", "alert", "info"] },
        title: { type: "string" },
        message: { type: "string" },
        priority: { type: "string", enum: ["low", "normal", "high"] },
      },
      required: ["studentId", "type", "title", "message"],
    }),
    requiredPermissions: ["execute"],
    confirmationType: "explicit",
    timeoutMs: 5000,
    maxRetries: 3,
    tags: ["communication", "notification", "engagement"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "generate_encouragement",
    name: "Generate Encouragement",
    description: "Generates personalized encouragement messages based on student progress and emotional state.",
    category: "communication",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        context: { type: "string", enum: ["struggling", "improving", "achieving", "returning"] },
        recentActivity: { type: "object" },
      },
      required: ["studentId", "context"],
    }),
    requiredPermissions: ["read", "execute"],
    confirmationType: "none",
    timeoutMs: 10000,
    maxRetries: 2,
    tags: ["ai", "communication", "motivation", "emotional-support"],
    enabled: true,
    deprecated: false,
  },

  // Analysis Tools
  {
    id: "analyze_learning_pattern",
    name: "Analyze Learning Pattern",
    description: "Analyzes student learning patterns to identify optimal study times, preferred content types, and learning style.",
    category: "analysis",
    version: "1.2.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        timeRange: { type: "string" },
        metrics: { type: "array", items: { type: "string" } },
      },
      required: ["studentId"],
    }),
    outputSchema: JSON.stringify({
      type: "object",
      properties: {
        optimalStudyTimes: { type: "array" },
        preferredContentTypes: { type: "array" },
        learningStyle: { type: "string" },
        recommendations: { type: "array" },
      },
    }),
    requiredPermissions: ["read"],
    confirmationType: "none",
    timeoutMs: 20000,
    maxRetries: 2,
    tags: ["analysis", "learning-analytics", "personalization"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "predict_performance",
    name: "Predict Performance",
    description: "Predicts student performance on upcoming assessments based on historical data and learning trajectory.",
    category: "analysis",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        assessmentId: { type: "string" },
        includeFactors: { type: "boolean", default: true },
      },
      required: ["studentId", "assessmentId"],
    }),
    requiredPermissions: ["read"],
    confirmationType: "none",
    timeoutMs: 15000,
    maxRetries: 2,
    tags: ["analysis", "prediction", "performance"],
    enabled: true,
    deprecated: false,
  },

  // Course Tools
  {
    id: "recommend_content",
    name: "Recommend Content",
    description: "Recommends relevant learning content based on student progress, interests, and goals.",
    category: "course",
    version: "1.1.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        currentCourseId: { type: "string" },
        contentTypes: { type: "array", items: { type: "string" } },
        limit: { type: "number", default: 5 },
      },
      required: ["studentId"],
    }),
    requiredPermissions: ["read"],
    confirmationType: "none",
    timeoutMs: 10000,
    maxRetries: 2,
    tags: ["recommendation", "content", "personalization"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "track_progress",
    name: "Track Progress",
    description: "Records and tracks student progress through course materials and learning objectives.",
    category: "course",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentId: { type: "string" },
        courseId: { type: "string" },
        chapterId: { type: "string" },
        completionPercentage: { type: "number" },
        timeSpent: { type: "number" },
      },
      required: ["studentId", "courseId"],
    }),
    requiredPermissions: ["read", "write"],
    confirmationType: "none",
    timeoutMs: 5000,
    maxRetries: 3,
    tags: ["progress", "tracking", "course"],
    enabled: true,
    deprecated: false,
  },

  // External Integration Tools
  {
    id: "search_knowledge_base",
    name: "Search Knowledge Base",
    description: "Searches external knowledge bases and documentation for supplementary learning materials.",
    category: "external",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        query: { type: "string" },
        sources: { type: "array", items: { type: "string" } },
        maxResults: { type: "number", default: 10 },
      },
      required: ["query"],
    }),
    requiredPermissions: ["read", "execute"],
    confirmationType: "implicit",
    timeoutMs: 30000,
    maxRetries: 2,
    tags: ["search", "knowledge", "external"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "fetch_resource",
    name: "Fetch Resource",
    description: "Fetches external educational resources from approved sources.",
    category: "external",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        resourceUrl: { type: "string", format: "uri" },
        resourceType: { type: "string", enum: ["article", "video", "document", "interactive"] },
      },
      required: ["resourceUrl"],
    }),
    requiredPermissions: ["read", "execute"],
    confirmationType: "explicit",
    timeoutMs: 60000,
    maxRetries: 1,
    tags: ["external", "resource", "fetch"],
    enabled: true,
    deprecated: false,
  },

  // Admin/System Tools
  {
    id: "export_progress_report",
    name: "Export Progress Report",
    description: "Generates and exports comprehensive progress reports for students or classes.",
    category: "admin",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentIds: { type: "array", items: { type: "string" } },
        courseId: { type: "string" },
        format: { type: "string", enum: ["pdf", "csv", "json"] },
        includeDetails: { type: "boolean", default: true },
      },
      required: ["format"],
    }),
    requiredPermissions: ["read", "admin"],
    confirmationType: "strict",
    timeoutMs: 120000,
    maxRetries: 1,
    tags: ["admin", "report", "export"],
    enabled: true,
    deprecated: false,
  },
  {
    id: "bulk_update_settings",
    name: "Bulk Update Settings",
    description: "Updates learning settings for multiple students at once.",
    category: "admin",
    version: "1.0.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        studentIds: { type: "array", items: { type: "string" } },
        settings: { type: "object" },
      },
      required: ["studentIds", "settings"],
    }),
    requiredPermissions: ["write", "admin"],
    confirmationType: "strict",
    timeoutMs: 30000,
    maxRetries: 1,
    tags: ["admin", "settings", "bulk"],
    enabled: true,
    deprecated: false,
  },

  // Deprecated Tool Example
  {
    id: "legacy_quiz_generator",
    name: "Legacy Quiz Generator",
    description: "Old quiz generation tool. Use 'Create Practice Questions' instead.",
    category: "content",
    version: "0.9.0",
    inputSchema: JSON.stringify({
      type: "object",
      properties: {
        topic: { type: "string" },
        count: { type: "number" },
      },
      required: ["topic"],
    }),
    requiredPermissions: ["execute"],
    confirmationType: "none",
    timeoutMs: 30000,
    maxRetries: 1,
    tags: ["deprecated", "quiz"],
    enabled: false,
    deprecated: true,
  },
];

async function main() {
  console.log("🤖 Seeding SAM Agentic Tools...\n");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const tool of samTools) {
    try {
      const existing = await prisma.agentTool.findUnique({
        where: { id: tool.id },
      });

      if (existing) {
        // Update existing tool
        await prisma.agentTool.update({
          where: { id: tool.id },
          data: {
            name: tool.name,
            description: tool.description,
            category: tool.category,
            version: tool.version,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema ?? null,
            requiredPermissions: tool.requiredPermissions,
            confirmationType: tool.confirmationType,
            timeoutMs: tool.timeoutMs ?? null,
            maxRetries: tool.maxRetries ?? null,
            tags: tool.tags,
            enabled: tool.enabled,
            deprecated: tool.deprecated,
            deprecationMessage: tool.deprecated ? "This tool is deprecated. Please use the newer alternative." : null,
          },
        });
        updated++;
        console.log(`   ↻ Updated: ${tool.name}`);
      } else {
        // Create new tool
        await prisma.agentTool.create({
          data: {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            category: tool.category,
            version: tool.version,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema ?? null,
            requiredPermissions: tool.requiredPermissions,
            confirmationType: tool.confirmationType,
            timeoutMs: tool.timeoutMs ?? null,
            maxRetries: tool.maxRetries ?? null,
            tags: tool.tags,
            enabled: tool.enabled,
            deprecated: tool.deprecated,
            deprecationMessage: tool.deprecated ? "This tool is deprecated. Please use the newer alternative." : null,
          },
        });
        created++;
        console.log(`   ✓ Created: ${tool.name}`);
      }
    } catch (error) {
      console.error(`   ✗ Failed: ${tool.name}`, error);
      skipped++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${samTools.length}`);

  // Show category breakdown
  const categories = samTools.reduce((acc, tool) => {
    acc[tool.category] = (acc[tool.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("\n📁 Tools by Category:");
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
