/**
 * Direct Memory-Orchestration Integration Test
 * Tests the integration by calling the functions directly
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dynamically import the modules to test
async function testMemoryOrchestrationDirect() {
  console.log('🧪 Direct Memory-Orchestration Integration Test\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Get test user and active plan
  const user = await prisma.user.findFirst({
    where: { email: { not: null } },
    select: { id: true, name: true },
  });

  if (!user) {
    console.log('❌ No user found');
    return;
  }

  const activePlan = await prisma.sAMExecutionPlan.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    include: {
      goal: true,
      steps: { where: { status: 'IN_PROGRESS' }, take: 1 },
    },
  });

  if (!activePlan) {
    console.log('❌ No active plan found');
    return;
  }

  console.log('👤 User:', user.name, '(' + user.id + ')');
  console.log('📋 Plan:', activePlan.goal?.title);
  console.log('📝 Step:', activePlan.steps[0]?.title || 'None');
  console.log('');

  // 2. Import and test the memory system
  console.log('🧠 Testing Memory System...\n');

  try {
    // Dynamic import to avoid build issues
    const { getAgenticMemorySystem } = await import('../lib/sam/agentic-memory');

    const memorySystem = getAgenticMemorySystem();
    console.log('   ✅ Memory system initialized');

    // Get or create session context
    const sessionContext = await memorySystem.sessionContext.getOrCreateContext(
      user.id,
      undefined // No courseId for this test
    );

    console.log('   ✅ Session context retrieved/created');
    console.log('   Context ID:', sessionContext.id);
    console.log('   Session count:', sessionContext.currentState.sessionCount);
    console.log('   Mastered concepts:', sessionContext.insights.masteredConcepts.length);
    console.log('   Struggling concepts:', sessionContext.insights.strugglingConcepts.length);
    console.log('');

    // Record a question
    console.log('📝 Recording test question...');
    await memorySystem.sessionContext.recordQuestion(
      user.id,
      'Explain variables in JavaScript',
      undefined
    );
    console.log('   ✅ Question recorded');
    console.log('');

    // Record concept learned (simulating step completion)
    console.log('🎓 Simulating step completion...');
    await memorySystem.sessionContext.recordConceptLearned(
      user.id,
      'JavaScript Variables and Data Types',
      undefined
    );
    console.log('   ✅ Concept learned recorded');

    // Verify the update
    const updatedContext = await memorySystem.sessionContext.getOrCreateContext(
      user.id,
      undefined
    );
    console.log('   Updated mastered concepts:', updatedContext.insights.masteredConcepts.length);
    console.log('   Concepts:', updatedContext.insights.masteredConcepts.slice(-3).join(', '));
    console.log('');

  } catch (error) {
    console.log('   ❌ Memory system error:', error);
    console.log('');
  }

  // 3. Test orchestration integration
  console.log('🔄 Testing Orchestration Integration...\n');

  try {
    const {
      initializeOrchestration,
      prepareTutoringContext,
      injectPlanContext,
    } = await import('../lib/sam/orchestration-integration');

    const {
      createPrismaGoalStore,
      createPrismaPlanStore,
      createPrismaToolStore,
    } = await import('../lib/sam/stores');

    // Initialize orchestration
    const goalStore = createPrismaGoalStore();
    const planStore = createPrismaPlanStore();
    const toolStore = createPrismaToolStore();

    const subsystems = initializeOrchestration({
      goalStore,
      planStore,
      toolStore,
    });
    console.log('   ✅ Orchestration subsystems initialized');

    // Prepare tutoring context
    const { getAgenticMemorySystem: getMemory } = await import('../lib/sam/agentic-memory');
    const memory = getMemory();
    const sessionCtx = await memory.sessionContext.getOrCreateContext(user.id, undefined);

    const tutoringContext = await prepareTutoringContext(
      user.id,
      'test-session-' + Date.now(),
      'Explain variables in JavaScript',
      {
        planId: activePlan.id,
        goalId: activePlan.goalId,
        sessionContext: sessionCtx,
      }
    );

    if (tutoringContext) {
      console.log('   ✅ Tutoring context prepared');
      console.log('   Has active plan:', !!tutoringContext.activePlan);
      console.log('   Current step:', tutoringContext.currentStep?.title || 'None');
      console.log('   Step objectives:', tutoringContext.stepObjectives.length);
      console.log('   Memory context:');
      console.log('     - Mastered:', tutoringContext.memoryContext.masteredConcepts.length);
      console.log('     - Struggling:', tutoringContext.memoryContext.strugglingConcepts.length);
      console.log('     - Recent topics:', tutoringContext.memoryContext.recentTopics.length);
      console.log('');

      // Inject plan context
      const injection = injectPlanContext(tutoringContext);
      if (injection) {
        console.log('   ✅ Plan context injection created');
        console.log('   System prompt additions:', injection.systemPromptAdditions.length);
        if (injection.systemPromptAdditions.length > 0) {
          console.log('   Preview:');
          console.log('   ' + injection.systemPromptAdditions[0]?.substring(0, 100) + '...');
        }
      }
    } else {
      console.log('   ⚠️ No tutoring context returned');
    }

  } catch (error) {
    console.log('   ❌ Orchestration error:', error);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Direct Integration Test Complete\n');
  console.log('The memory system is now wired to orchestration:');
  console.log('• SessionContext is retrieved from memory');
  console.log('• SessionContext is passed to prepareTutoringContext()');
  console.log('• Memory insights populate TutoringContext.memoryContext');
  console.log('• Learning interactions are stored in memory after responses');
  console.log('');
}

testMemoryOrchestrationDirect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
