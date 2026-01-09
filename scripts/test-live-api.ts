/**
 * Test Script: Live API Memory-Orchestration Test
 * Makes a direct request to test the memory-orchestration integration
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLiveAPI() {
  console.log('🚀 Testing Live SAM API with Memory-Orchestration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Get the test user with active plan
  const user = await prisma.user.findFirst({
    where: {
      id: 'test-user-seed-001',
    },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    // Try any user with active plan
    const userWithPlan = await prisma.sAMExecutionPlan.findFirst({
      where: { status: 'ACTIVE' },
      select: {
        userId: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!userWithPlan) {
      console.log('❌ No user with active plan found');
      return;
    }

    console.log('👤 Using user:', userWithPlan.user?.name || userWithPlan.userId);
  } else {
    console.log('👤 Test user found:', user.name || user.email);
  }

  // 2. Get active plan details
  const activePlan = await prisma.sAMExecutionPlan.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      goal: true,
      steps: {
        where: { status: 'IN_PROGRESS' },
        take: 1,
      },
    },
  });

  if (!activePlan) {
    console.log('❌ No active plan found');
    return;
  }

  const currentStep = activePlan.steps[0];
  console.log('📋 Active Plan:', activePlan.goal?.title);
  console.log('📝 Current Step:', currentStep?.title || 'None');
  console.log('');

  // 3. Test request payload
  const testPayload = {
    message: 'Explain the difference between let, const, and var in JavaScript. When should I use each one?',
    pageContext: {
      type: 'learning',
      path: '/learning',
    },
    orchestrationContext: {
      autoDetectPlan: true,
    },
  };

  console.log('📤 Test Request:');
  console.log('   Message:', testPayload.message.substring(0, 60) + '...');
  console.log('   Auto-detect Plan: true');
  console.log('');

  // 4. Make the request
  console.log('🔄 Making request to http://localhost:3000/api/sam/unified...\n');

  try {
    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/sam/unified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail auth but we want to see the logs
      },
      body: JSON.stringify(testPayload),
    });

    const elapsed = Date.now() - startTime;
    const data = await response.json();

    console.log('📥 Response Status:', response.status);
    console.log('⏱️  Response Time:', elapsed + 'ms');
    console.log('');

    if (response.status === 401) {
      console.log('⚠️  Authentication required (expected for direct API call)');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📝 To test with authentication:\n');
      console.log('1. Open browser: http://localhost:3000');
      console.log('2. Log in with a test account');
      console.log('3. Open SAM chat assistant');
      console.log('4. Type: "Explain variables in JavaScript"');
      console.log('');
      console.log('5. Check terminal logs for:');
      console.log('   ✓ [SAM_UNIFIED] Auto-detected active plan');
      console.log('   ✓ [SAM_UNIFIED] Retrieved memory session context');
      console.log('   ✓ [SAM_UNIFIED] Tutoring orchestration ACTIVE');
      console.log('   ✓ [SAM_UNIFIED] Tutoring loop processed');
      console.log('   ✓ [SAM_UNIFIED] Recorded concept learned in memory');
      console.log('');
    } else if (data.success) {
      console.log('✅ SUCCESS!\n');

      // Check orchestration data
      if (data.insights?.orchestration) {
        const orch = data.insights.orchestration;
        console.log('🎯 ORCHESTRATION DATA:');
        console.log('   Has Active Plan:', orch.hasActivePlan);
        if (orch.currentStep) {
          console.log('   Current Step:', orch.currentStep.title);
          console.log('   Step Type:', orch.currentStep.type);
        }
        if (orch.stepProgress) {
          console.log('   Progress:', orch.stepProgress.progressPercent + '%');
          console.log('   Step Complete:', orch.stepProgress.stepComplete);
        }
        console.log('');
      }

      // Check memory data
      if (data.metadata?.subsystems) {
        console.log('📊 SUBSYSTEMS:');
        console.log('   Tutoring Orchestration:', data.metadata.subsystems.tutoringOrchestration || false);
        console.log('   Tutoring Context:', data.metadata.subsystems.tutoringContext || false);
        console.log('');
      }

      console.log('💬 Response Preview:');
      console.log(data.response?.substring(0, 300) + '...');
    } else {
      console.log('❌ Error:', data.error || data.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('💡 Check the dev server terminal for detailed logs!');
  console.log('');
}

testLiveAPI()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
