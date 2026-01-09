import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the goal we just created
  const goal = await prisma.sAMLearningGoal.findFirst({
    where: { title: 'Master TypeScript Generics' },
    orderBy: { createdAt: 'desc' }
  });

  if (!goal) {
    console.log('Goal not found');
    return;
  }

  console.log('Found goal:', goal.id);

  // Check if sub-goals already exist
  const existing = await prisma.sAMSubGoal.count({ where: { goalId: goal.id } });
  if (existing > 0) {
    console.log('Sub-goals already exist:', existing);
    return;
  }

  // Create test sub-goals
  // SAMSubGoalType: LEARN, PRACTICE, ASSESS, REVIEW, REFLECT, CREATE
  // SAMDifficulty: EASY, MEDIUM, HARD
  // SAMStepStatus: PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED, BLOCKED
  const subGoals = [
    {
      goalId: goal.id,
      title: 'Understand Basic Generics',
      description: 'Learn type parameters, generic functions, and generic classes',
      type: 'LEARN',
      order: 0,
      estimatedMinutes: 60,
      difficulty: 'EASY',
      status: 'PENDING',
      successCriteria: ['Can define generic functions', 'Can create generic interfaces']
    },
    {
      goalId: goal.id,
      title: 'Master Conditional Types',
      description: 'Learn infer keyword, conditional type distribution, and utility types',
      type: 'LEARN',
      order: 1,
      estimatedMinutes: 90,
      difficulty: 'MEDIUM',
      status: 'PENDING',
      successCriteria: ['Can use infer keyword', 'Can create custom conditional types']
    },
    {
      goalId: goal.id,
      title: 'Implement Mapped Types',
      description: 'Learn keyof, mapped types, and type transformations',
      type: 'PRACTICE',
      order: 2,
      estimatedMinutes: 75,
      difficulty: 'MEDIUM',
      status: 'PENDING',
      successCriteria: ['Can use keyof operator', 'Can create custom mapped types']
    },
    {
      goalId: goal.id,
      title: 'Build Type-Safe Utilities',
      description: 'Create real-world utility types combining all concepts',
      type: 'CREATE',
      order: 3,
      estimatedMinutes: 120,
      difficulty: 'HARD',
      status: 'PENDING',
      successCriteria: ['Can build complex type utilities', 'Can debug type errors']
    }
  ];

  const created = await prisma.sAMSubGoal.createMany({
    data: subGoals
  });

  console.log('Created', created.count, 'sub-goals');

  // List them
  const all = await prisma.sAMSubGoal.findMany({
    where: { goalId: goal.id },
    orderBy: { order: 'asc' }
  });

  console.log('Sub-goals:', all.map((sg) => ({ id: sg.id, title: sg.title, order: sg.order })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
