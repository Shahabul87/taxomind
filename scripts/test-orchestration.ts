/**
 * Test Script: Orchestration Loop Integration
 * Tests the full orchestration flow with an active plan
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing SAM Orchestration Loop...\n');

  // 1. Find a user to test with
  const user = await prisma.user.findFirst({
    where: { email: { not: null } },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    console.log('❌ No users found in database');
    return;
  }

  const userName = user.name || user.email || 'Unknown';
  console.log('👤 Testing with user: ' + userName + ' (' + user.id + ')\n');

  // 2. Check for existing active plans
  const existingPlans = await prisma.sAMExecutionPlan.findMany({
    where: { userId: user.id, status: 'ACTIVE' },
    include: {
      goal: true,
      steps: { orderBy: { order: 'asc' }, take: 3 },
    },
  });

  console.log('📋 Existing active plans: ' + existingPlans.length);

  if (existingPlans.length > 0) {
    const plan = existingPlans[0];
    console.log('   Plan ID: ' + plan.id);
    console.log('   Goal: ' + (plan.goal?.title || 'Unknown'));
    console.log('   Steps: ' + plan.steps.length);
    if (plan.steps.length > 0) {
      console.log('   First step: ' + plan.steps[0].title);
    }
    console.log('');
  }

  // 3. Check for goals that could be used
  const goals = await prisma.sAMLearningGoal.findMany({
    where: { userId: user.id },
    include: {
      subGoals: { take: 3 },
      plans: { take: 1 },
    },
    take: 5,
  });

  console.log('🎯 User goals: ' + goals.length);
  goals.forEach((goal, i) => {
    console.log('   ' + (i + 1) + '. ' + goal.title + ' (' + goal.status + ') - ' + goal.subGoals.length + ' sub-goals, ' + goal.plans.length + ' plans');
  });
  console.log('');

  // 4. If no active plan exists, create one for testing
  if (existingPlans.length === 0) {
    console.log('⚡ Creating test goal and plan...\n');

    // Find a course to associate with
    const course = await prisma.course.findFirst({
      where: { isPublished: true },
      select: { id: true, title: true },
    });

    // Create a test goal
    const testGoal = await prisma.sAMLearningGoal.create({
      data: {
        userId: user.id,
        title: 'Master JavaScript Fundamentals',
        description: 'Learn core JavaScript concepts including variables, functions, and async programming',
        status: 'ACTIVE',
        priority: 'HIGH',
        targetMastery: 'INTERMEDIATE',
        courseId: course?.id,
      },
    });

    console.log('✅ Created goal: ' + testGoal.title + ' (' + testGoal.id + ')');

    // Create sub-goals
    const subGoals = await Promise.all([
      prisma.sAMSubGoal.create({
        data: {
          goalId: testGoal.id,
          title: 'Understand Variables and Data Types',
          description: 'Learn about let, const, var and primitive vs reference types',
          status: 'PENDING',
          order: 1,
          estimatedMinutes: 30,
        },
      }),
      prisma.sAMSubGoal.create({
        data: {
          goalId: testGoal.id,
          title: 'Master Functions and Scope',
          description: 'Learn about function declarations, expressions, arrow functions, and closures',
          status: 'PENDING',
          order: 2,
          estimatedMinutes: 45,
        },
      }),
      prisma.sAMSubGoal.create({
        data: {
          goalId: testGoal.id,
          title: 'Understand Async Programming',
          description: 'Learn callbacks, promises, and async/await patterns',
          status: 'PENDING',
          order: 3,
          estimatedMinutes: 60,
        },
      }),
    ]);

    console.log('✅ Created ' + subGoals.length + ' sub-goals');

    // Create execution plan
    const testPlan = await prisma.sAMExecutionPlan.create({
      data: {
        userId: user.id,
        goalId: testGoal.id,
        status: 'ACTIVE',
        startDate: new Date(),
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    console.log('✅ Created plan: ' + testPlan.id);

    // Create plan steps from sub-goals
    const steps = await Promise.all(
      subGoals.map((subGoal, index) =>
        prisma.sAMPlanStep.create({
          data: {
            planId: testPlan.id,
            subGoalId: subGoal.id,
            title: subGoal.title,
            description: subGoal.description,
            type: index === 0 ? 'READ_CONTENT' : index === 1 ? 'PRACTICE_PROBLEM' : 'TAKE_QUIZ',
            order: index + 1,
            status: index === 0 ? 'IN_PROGRESS' : 'PENDING',
            estimatedMinutes: subGoal.estimatedMinutes ?? 30,
            metadata: {
              objectives: [
                'Understand ' + subGoal.title.toLowerCase(),
                'Complete related exercises',
                'Pass knowledge check',
              ],
            },
          },
        })
      )
    );

    console.log('✅ Created ' + steps.length + ' plan steps');
    console.log('');

    // Re-fetch the plan with all relations
    const createdPlan = await prisma.sAMExecutionPlan.findUnique({
      where: { id: testPlan.id },
      include: {
        goal: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });

    console.log('📋 Test Plan Ready:');
    console.log('   Plan ID: ' + createdPlan?.id);
    console.log('   Goal: ' + createdPlan?.goal?.title);
    console.log('   Status: ' + createdPlan?.status);
    console.log('   Steps:');
    createdPlan?.steps.forEach((step, i) => {
      console.log('     ' + (i + 1) + '. ' + step.title + ' (' + step.status + ')');
    });
    console.log('');
  }

  // 5. Final verification
  const activePlan = await prisma.sAMExecutionPlan.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    include: {
      goal: true,
      steps: { orderBy: { order: 'asc' } },
    },
  });

  if (activePlan) {
    console.log('✅ ORCHESTRATION TEST READY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Plan ID: ' + activePlan.id);
    console.log('Goal ID: ' + activePlan.goalId);
    console.log('User ID: ' + activePlan.userId);
    console.log('Goal: ' + activePlan.goal?.title);
    const currentStep = activePlan.steps.find(s => s.status === 'IN_PROGRESS');
    console.log('Current Step: ' + (currentStep?.title || 'None'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🧪 To test orchestration, send a request to /api/sam/unified');
    console.log('   The system will auto-detect this active plan.');
    console.log('');
  } else {
    console.log('❌ No active plan found - orchestration will not activate');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
