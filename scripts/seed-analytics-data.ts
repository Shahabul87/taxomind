/**
 * Seed Analytics Data Script
 * Phase 5: Learning Analytics & Insights
 *
 * This script seeds the database with sample analytics data for testing
 * the Learning Analytics Dashboard components.
 *
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/seed-analytics-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Helper to generate random number within range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate study sessions for a user
async function seedStudySessions(userId: string, courseIds: string[]) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const sessions = [];

  // Generate 60-120 study sessions over the past 90 days
  const sessionCount = randomInt(60, 120);

  for (let i = 0; i < sessionCount; i++) {
    const sessionDate = randomDate(ninetyDaysAgo, now);
    const duration = randomInt(15, 120); // 15-120 minutes
    const actualDuration = Math.max(duration - randomInt(-15, 30), 10);

    sessions.push({
      userId,
      courseId: courseIds[randomInt(0, courseIds.length - 1)],
      title: `Study Session ${i + 1}`,
      startTime: sessionDate,
      duration,
      actualDuration,
      status: 'completed' as const,
      type: ['study', 'review', 'practice'][randomInt(0, 2)] as
        | 'study'
        | 'review'
        | 'practice',
    });
  }

  // Create sessions in batch
  for (const session of sessions) {
    await prisma.dashboardStudySession.create({
      data: session,
    });
  }

  console.log(`  ✓ Created ${sessions.length} study sessions`);
  return sessions.length;
}

// Generate learning activity logs
async function seedActivityLogs(
  userId: string,
  courseIds: string[],
  sectionIds: string[]
) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const logs = [];
  const activityTypes = [
    'lesson_started',
    'lesson_completed',
    'quiz_started',
    'quiz_completed',
    'video_watched',
    'resource_accessed',
  ];

  // Generate 100-200 activity logs
  const logCount = randomInt(100, 200);

  for (let i = 0; i < logCount; i++) {
    const activityDate = randomDate(ninetyDaysAgo, now);
    const activityType =
      activityTypes[randomInt(0, activityTypes.length - 1)];

    logs.push({
      userId,
      courseId: courseIds[randomInt(0, courseIds.length - 1)],
      activityType,
      timestamp: activityDate,
      metadata: JSON.stringify({
        sectionId:
          sectionIds.length > 0
            ? sectionIds[randomInt(0, sectionIds.length - 1)]
            : undefined,
        duration: randomInt(5, 60),
      }),
    });
  }

  // Create logs in batch
  for (const log of logs) {
    await prisma.learningActivityLog.create({
      data: log,
    });
  }

  console.log(`  ✓ Created ${logs.length} activity logs`);
  return logs.length;
}

// Generate/update streak data
async function seedStreakData(userId: string) {
  const now = new Date();
  const currentStreak = randomInt(1, 45);
  const longestStreak = Math.max(currentStreak, randomInt(20, 60));

  // Calculate last activity date based on current streak
  const lastActivityDate = new Date(now);
  if (currentStreak > 0) {
    // If streak is active, last activity should be today or yesterday
    lastActivityDate.setDate(
      lastActivityDate.getDate() - (Math.random() > 0.7 ? 1 : 0)
    );
  }

  // Upsert streak data
  await prisma.study_streaks.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak,
      longestStreak,
      lastActivityDate,
      streakStartDate: new Date(
        now.getTime() - currentStreak * 24 * 60 * 60 * 1000
      ),
    },
    update: {
      currentStreak,
      longestStreak,
      lastActivityDate,
    },
  });

  console.log(
    `  ✓ Created streak data: ${currentStreak} days (longest: ${longestStreak})`
  );
  return { currentStreak, longestStreak };
}

// Generate user progress for sections
async function seedUserProgress(
  userId: string,
  sectionIds: string[]
) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Complete 40-80% of sections
  const sectionsToComplete = Math.floor(
    sectionIds.length * (0.4 + Math.random() * 0.4)
  );
  const shuffledSections = [...sectionIds].sort(() => Math.random() - 0.5);
  const completedSections = shuffledSections.slice(0, sectionsToComplete);

  for (const sectionId of completedSections) {
    const completedDate = randomDate(ninetyDaysAgo, now);

    await prisma.userProgress.upsert({
      where: {
        userId_sectionId: {
          userId,
          sectionId,
        },
      },
      create: {
        userId,
        sectionId,
        isCompleted: true,
        progressPercentage: 100,
        createdAt: completedDate,
        updatedAt: completedDate,
      },
      update: {
        isCompleted: true,
        progressPercentage: 100,
        updatedAt: completedDate,
      },
    });
  }

  console.log(
    `  ✓ Marked ${completedSections.length}/${sectionIds.length} sections as completed`
  );
  return completedSections.length;
}

// Generate dashboard goals
async function seedGoals(userId: string, courseIds: string[]) {
  const now = new Date();
  const goalTypes = ['course_completion', 'weekly_hours', 'lesson_count'];
  const goals = [];

  // Create 2-4 active goals
  const goalCount = randomInt(2, 4);

  for (let i = 0; i < goalCount; i++) {
    const goalType = goalTypes[i % goalTypes.length];
    const deadline = new Date(
      now.getTime() + randomInt(7, 60) * 24 * 60 * 60 * 1000
    );
    const progress = randomInt(20, 90);

    let title: string;
    let target: number;

    switch (goalType) {
      case 'course_completion':
        title = 'Complete Course Module';
        target = 100;
        break;
      case 'weekly_hours':
        title = 'Study 10 hours this week';
        target = 600; // 10 hours in minutes
        break;
      case 'lesson_count':
        title = 'Complete 20 lessons';
        target = 20;
        break;
      default:
        title = 'Learning Goal';
        target = 100;
    }

    goals.push({
      userId,
      courseId:
        goalType === 'course_completion'
          ? courseIds[randomInt(0, courseIds.length - 1)]
          : null,
      title,
      type: goalType,
      targetValue: target,
      currentValue: Math.floor((progress / 100) * target),
      progress,
      deadline,
      status: 'active' as const,
    });
  }

  for (const goal of goals) {
    await prisma.dashboardGoal.create({
      data: goal,
    });
  }

  console.log(`  ✓ Created ${goals.length} active goals`);
  return goals.length;
}

// Main seed function
async function seedAnalyticsData() {
  console.log('\n🚀 Starting Analytics Data Seed...\n');

  try {
    // Find a test user or create one
    let user = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'test',
        },
      },
    });

    if (!user) {
      // Use any existing user
      user = await prisma.user.findFirst();
    }

    if (!user) {
      console.log(
        '❌ No user found in database. Please create a user first.'
      );
      return;
    }

    console.log(`📌 Using user: ${user.email} (${user.id})\n`);

    // Get user's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            chapters: {
              include: {
                sections: true,
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      console.log('❌ User has no enrolled courses. Please enroll in courses first.');
      return;
    }

    const courseIds = enrollments.map((e) => e.courseId);
    const sectionIds = enrollments.flatMap((e) =>
      e.course.chapters.flatMap((ch) => ch.sections.map((s) => s.id))
    );

    console.log(`📚 Found ${courseIds.length} enrolled courses with ${sectionIds.length} sections\n`);

    // Clean existing analytics data (optional - comment out to append)
    console.log('🧹 Cleaning existing analytics data...');
    await prisma.dashboardStudySession.deleteMany({ where: { userId: user.id } });
    await prisma.learningActivityLog.deleteMany({ where: { userId: user.id } });
    await prisma.dashboardGoal.deleteMany({ where: { userId: user.id } });
    console.log('  ✓ Cleaned existing data\n');

    // Seed data
    console.log('📊 Seeding study sessions...');
    await seedStudySessions(user.id, courseIds);

    console.log('\n📝 Seeding activity logs...');
    await seedActivityLogs(user.id, courseIds, sectionIds);

    console.log('\n🔥 Seeding streak data...');
    await seedStreakData(user.id);

    console.log('\n✅ Seeding user progress...');
    await seedUserProgress(user.id, sectionIds);

    console.log('\n🎯 Seeding goals...');
    await seedGoals(user.id, courseIds);

    console.log('\n✨ Analytics data seeded successfully!\n');
    console.log('You can now test the Learning Analytics Dashboard with real data.');
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedAnalyticsData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
