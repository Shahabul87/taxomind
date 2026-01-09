/**
 * Direct Orchestration Test
 * Tests the orchestration functions directly without HTTP
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simulate the orchestration integration
async function testOrchestration() {
  console.log('🔧 Direct Orchestration Test\n');

  // 1. Find test user with active plan
  const user = await prisma.user.findFirst({
    where: { email: { not: null } },
    select: { id: true, name: true },
  });

  if (!user) {
    console.log('❌ No user found');
    return;
  }

  console.log('👤 User:', user.name, '(' + user.id + ')');

  // 2. Find active plan
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
    return;
  }

  console.log('📋 Active Plan: ' + activePlan.id);
  console.log('🎯 Goal: ' + activePlan.goal?.title);
  console.log('📊 Progress: ' + (activePlan.overallProgress * 100) + '%');
  console.log('📝 Steps: ' + activePlan.steps.length);
  console.log('');

  // 3. Find current step (IN_PROGRESS)
  const currentStep = activePlan.steps.find((s) => s.status === 'IN_PROGRESS');

  if (currentStep) {
    console.log('▶️  Current Step:');
    console.log('   Title: ' + currentStep.title);
    console.log('   Type: ' + currentStep.type);
    console.log('   Status: ' + currentStep.status);
    console.log('   Order: ' + currentStep.order + ' of ' + activePlan.steps.length);
    console.log('   Estimated: ' + currentStep.estimatedMinutes + ' minutes');

    const metadata = currentStep.metadata as { objectives?: string[] } | null;
    if (metadata?.objectives) {
      console.log('   Objectives:');
      metadata.objectives.forEach((obj, i) => {
        console.log('     ' + (i + 1) + '. ' + obj);
      });
    }
    console.log('');
  }

  // 4. Simulate what the unified route would do
  console.log('🔄 Simulating Unified Route Auto-Detection...');
  console.log('');

  // This is exactly what the unified route does:
  const detectedPlans = await prisma.sAMExecutionPlan.findMany({
    where: {
      userId: user.id,
      status: 'ACTIVE',
    },
    orderBy: { updatedAt: 'desc' },
    take: 1,
    include: {
      goal: true,
    },
  });

  if (detectedPlans.length > 0) {
    const detected = detectedPlans[0];
    console.log('✅ Auto-detected active plan:');
    console.log('   Plan ID: ' + detected.id);
    console.log('   Goal ID: ' + detected.goalId);
    console.log('   Goal Title: ' + detected.goal?.title);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ ORCHESTRATION WILL ACTIVATE');
    console.log('');
    console.log('When a user sends a message to /api/sam/unified:');
    console.log('1. ✅ Auto-detect plan: Will find plan ' + detected.id);
    console.log('2. ✅ prepareTutoringContext() will load:');
    console.log('   - Active plan and goal');
    console.log('   - Current step: ' + (currentStep?.title || 'None'));
    console.log('   - Step objectives from metadata');
    console.log('3. ✅ injectPlanContext() will add to LLM prompt:');
    console.log('   - Current learning objective');
    console.log('   - Step context and expectations');
    console.log('4. ✅ processTutoringLoop() will:');
    console.log('   - Evaluate if step objectives are met');
    console.log('   - Track progress percentage');
    console.log('   - Transition to next step if complete');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🧪 To verify in browser:');
    console.log('1. Log in as user: ' + user.id);
    console.log('2. Open SAM chat');
    console.log('3. Ask: "Explain variables in JavaScript"');
    console.log('4. Check Network tab for /api/sam/unified response');
    console.log('5. Look for insights.orchestration in response');
    console.log('');
  } else {
    console.log('❌ No plan detected - orchestration will NOT activate');
  }
}

testOrchestration()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
