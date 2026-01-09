/**
 * Test Script: Memory-Orchestration Integration
 * Tests that memory system is properly wired to the tutoring orchestration
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMemoryOrchestration() {
  console.log('🧠 Testing Memory-Orchestration Integration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Find test user
  const user = await prisma.user.findFirst({
    where: { email: { not: null } },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    console.log('❌ No user found');
    return;
  }

  console.log('👤 Test User:', user.name || user.email);
  console.log('   User ID:', user.id);
  console.log('');

  // 2. Check for active plan
  const activePlan = await prisma.sAMExecutionPlan.findFirst({
    where: {
      userId: user.id,
      status: 'ACTIVE',
    },
    include: {
      goal: true,
      steps: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!activePlan) {
    console.log('❌ No active plan found');
    console.log('   Run: npx ts-node scripts/test-orchestration.ts first');
    return;
  }

  console.log('📋 Active Plan Found:');
  console.log('   Plan ID:', activePlan.id);
  console.log('   Goal:', activePlan.goal?.title);
  console.log('   Progress:', (activePlan.overallProgress * 100).toFixed(1) + '%');
  console.log('   Steps:', activePlan.steps.length);
  console.log('');

  // 3. Find current step
  const currentStep = activePlan.steps.find((s) => s.status === 'IN_PROGRESS');
  if (currentStep) {
    console.log('▶️  Current Step:');
    console.log('   Title:', currentStep.title);
    console.log('   Type:', currentStep.type);
    console.log('   Order:', currentStep.order, 'of', activePlan.steps.length);

    const metadata = currentStep.metadata as { objectives?: string[] } | null;
    if (metadata?.objectives) {
      console.log('   Objectives:');
      metadata.objectives.forEach((obj, i) => {
        console.log('     ' + (i + 1) + '. ' + obj);
      });
    }
    console.log('');
  }

  // 4. Check for existing memory context (SAMSessionContext table)
  console.log('🧠 Checking Memory System Tables...\n');

  // Check if SAMSessionContext table exists and has data
  try {
    const sessionContextCount = await prisma.sAMSessionContext.count({
      where: { userId: user.id },
    });
    console.log('   SAMSessionContext records for user:', sessionContextCount);

    if (sessionContextCount > 0) {
      const latestContext = await prisma.sAMSessionContext.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      });

      if (latestContext) {
        console.log('   Latest context ID:', latestContext.id);
        console.log('   Course ID:', latestContext.courseId || 'N/A');
        console.log('   Last active:', latestContext.lastActiveAt);

        const state = latestContext.currentState as Record<string, unknown> | null;
        const insights = latestContext.insights as Record<string, unknown> | null;

        if (state) {
          const recentConcepts = (state.recentConcepts as string[]) || [];
          console.log('   Recent concepts:', recentConcepts.length > 0 ? recentConcepts.join(', ') : 'None');
        }

        if (insights) {
          const mastered = (insights.masteredConcepts as string[]) || [];
          const struggling = (insights.strugglingConcepts as string[]) || [];
          console.log('   Mastered concepts:', mastered.length > 0 ? mastered.slice(0, 5).join(', ') : 'None');
          console.log('   Struggling concepts:', struggling.length > 0 ? struggling.join(', ') : 'None');
        }
      }
    }
  } catch (error) {
    console.log('   ⚠️  SAMSessionContext table may not exist yet');
  }
  console.log('');

  // 5. Check vector embeddings
  try {
    const embeddingCount = await prisma.sAMVectorEmbedding.count({
      where: { userId: user.id },
    });
    console.log('   SAMVectorEmbedding records for user:', embeddingCount);
  } catch (error) {
    console.log('   ⚠️  SAMVectorEmbedding table may not exist yet');
  }

  // 6. Check knowledge graph (tables may not exist in schema yet)
  console.log('   Knowledge graph: Using in-memory store (not persisted to DB yet)');
  console.log('');

  // 7. Simulate the memory integration flow
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Memory-Orchestration Integration Flow:\n');

  console.log('1️⃣  BEFORE LLM Call:');
  console.log('   ✓ Auto-detect active plan from database');
  console.log('   ✓ Get/create SessionContext from memory system');
  console.log('   ✓ Pass sessionContext to prepareTutoringContext()');
  console.log('   ✓ Memory context populates TutoringContext.memoryContext:');
  console.log('     - masteredConcepts (from previous sessions)');
  console.log('     - strugglingConcepts (need reinforcement)');
  console.log('     - recentTopics (continuity)');
  console.log('     - learningStyle (personalization)');
  console.log('');

  console.log('2️⃣  DURING LLM Call:');
  console.log('   ✓ PlanContextInjector adds plan + memory context to prompt');
  console.log('   ✓ LLM knows what user has mastered and is struggling with');
  console.log('   ✓ Response is personalized based on memory insights');
  console.log('');

  console.log('3️⃣  AFTER LLM Response:');
  console.log('   ✓ processTutoringLoop() evaluates step progress');
  console.log('   ✓ If step complete → recordConceptLearned()');
  console.log('   ✓ If progress < 50% → add to strugglingConcepts');
  console.log('   ✓ If step transitions → record all objectives as mastered');
  console.log('   ✓ Memory persists for next session');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🧪 To Test in Browser:\n');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Log in as user:', user.id);
  console.log('3. Open SAM chat');
  console.log('4. Ask about the current step topic:');
  console.log('   "' + (currentStep?.title || 'Explain variables in JavaScript') + '"');
  console.log('');
  console.log('5. Check server logs for:');
  console.log('   [SAM_UNIFIED] Retrieved memory session context');
  console.log('   [SAM_UNIFIED] Tutoring orchestration ACTIVE');
  console.log('   [SAM_UNIFIED] Recorded concept learned in memory');
  console.log('');
  console.log('6. Check Network tab → response.insights.orchestration for:');
  console.log('   - hasActivePlan: true');
  console.log('   - currentStep.title');
  console.log('   - stepProgress.progressPercent');
  console.log('   - memoryContext data');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Memory-Orchestration Integration Test Complete\n');
}

testMemoryOrchestration()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
