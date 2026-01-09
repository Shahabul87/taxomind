/**
 * Seed Gamification Data
 * Populates achievements, XP, and leaderboard entries for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Achievement definitions
const ACHIEVEMENTS = [
  // Streak achievements
  {
    name: 'First Steps',
    slug: 'first-steps',
    description: 'Complete your first learning session',
    icon: '🚀',
    category: 'STREAK',
    rarity: 'COMMON',
    criteria: { type: 'COUNT', target: 1, metric: 'sessions' },
    xpReward: 50,
    unlockMessage: 'Welcome to your learning journey!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 1,
    tier: 1,
  },
  {
    name: 'Week Warrior',
    slug: 'week-warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'STREAK',
    rarity: 'UNCOMMON',
    criteria: { type: 'STREAK', target: 7, metric: 'days' },
    xpReward: 200,
    unlockMessage: 'A full week of learning! Amazing dedication!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 2,
    tier: 2,
  },
  {
    name: 'Fortnight Focus',
    slug: 'fortnight-focus',
    description: 'Maintain a 14-day learning streak',
    icon: '⚡',
    category: 'STREAK',
    rarity: 'RARE',
    criteria: { type: 'STREAK', target: 14, metric: 'days' },
    xpReward: 500,
    unlockMessage: 'Two weeks strong! You are unstoppable!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 3,
    tier: 3,
  },
  {
    name: 'Monthly Master',
    slug: 'monthly-master',
    description: 'Maintain a 30-day learning streak',
    icon: '👑',
    category: 'STREAK',
    rarity: 'EPIC',
    criteria: { type: 'STREAK', target: 30, metric: 'days' },
    xpReward: 1000,
    unlockMessage: 'A full month! You are a true learning champion!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 4,
    tier: 4,
  },
  // Completion achievements
  {
    name: 'Lesson Learner',
    slug: 'lesson-learner',
    description: 'Complete your first lesson',
    icon: '📚',
    category: 'COMPLETION',
    rarity: 'COMMON',
    criteria: { type: 'COUNT', target: 1, metric: 'lessons' },
    xpReward: 25,
    unlockMessage: 'First lesson done! Keep going!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 5,
    tier: 1,
  },
  {
    name: 'Knowledge Seeker',
    slug: 'knowledge-seeker',
    description: 'Complete 10 lessons',
    icon: '🎯',
    category: 'COMPLETION',
    rarity: 'UNCOMMON',
    criteria: { type: 'COUNT', target: 10, metric: 'lessons' },
    xpReward: 150,
    unlockMessage: '10 lessons completed! You are on fire!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 6,
    tier: 2,
  },
  {
    name: 'Course Completer',
    slug: 'course-completer',
    description: 'Complete your first course',
    icon: '🏆',
    category: 'COMPLETION',
    rarity: 'RARE',
    criteria: { type: 'COUNT', target: 1, metric: 'courses' },
    xpReward: 500,
    unlockMessage: 'First course completed! Incredible achievement!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 7,
    tier: 3,
  },
  {
    name: 'Multi-Course Master',
    slug: 'multi-course-master',
    description: 'Complete 5 courses',
    icon: '🌟',
    category: 'COMPLETION',
    rarity: 'EPIC',
    criteria: { type: 'COUNT', target: 5, metric: 'courses' },
    xpReward: 2000,
    unlockMessage: '5 courses mastered! You are a learning legend!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 8,
    tier: 4,
  },
  // Mastery achievements
  {
    name: 'Quiz Whiz',
    slug: 'quiz-whiz',
    description: 'Score 100% on any quiz',
    icon: '💯',
    category: 'MASTERY',
    rarity: 'UNCOMMON',
    criteria: { type: 'PERCENTAGE', target: 100, metric: 'quiz_score' },
    xpReward: 100,
    unlockMessage: 'Perfect score! Brilliant work!',
    isHidden: false,
    isRepeatable: true,
    maxRepeats: 10,
    displayOrder: 9,
    tier: 2,
  },
  {
    name: 'Speed Demon',
    slug: 'speed-demon',
    description: 'Complete a lesson in under 5 minutes',
    icon: '⏱️',
    category: 'SPEED',
    rarity: 'RARE',
    criteria: { type: 'TIME', target: 300, metric: 'lesson_time' },
    xpReward: 75,
    unlockMessage: 'Lightning fast! Impressive speed!',
    isHidden: false,
    isRepeatable: true,
    maxRepeats: 20,
    displayOrder: 10,
    tier: 2,
  },
  // Engagement achievements
  {
    name: 'Early Bird',
    slug: 'early-bird',
    description: 'Start learning before 7 AM',
    icon: '🌅',
    category: 'ENGAGEMENT',
    rarity: 'UNCOMMON',
    criteria: { type: 'TIME', target: 7, metric: 'start_hour' },
    xpReward: 50,
    unlockMessage: 'Early morning learner! Great dedication!',
    isHidden: false,
    isRepeatable: true,
    maxRepeats: 30,
    displayOrder: 11,
    tier: 1,
  },
  {
    name: 'Night Owl',
    slug: 'night-owl',
    description: 'Study after 10 PM',
    icon: '🦉',
    category: 'ENGAGEMENT',
    rarity: 'UNCOMMON',
    criteria: { type: 'TIME', target: 22, metric: 'start_hour' },
    xpReward: 50,
    unlockMessage: 'Burning the midnight oil! Impressive!',
    isHidden: false,
    isRepeatable: true,
    maxRepeats: 30,
    displayOrder: 12,
    tier: 1,
  },
  // Special achievements
  {
    name: 'Level 5 Scholar',
    slug: 'level-5-scholar',
    description: 'Reach Level 5',
    icon: '📖',
    category: 'SPECIAL',
    rarity: 'RARE',
    criteria: { type: 'COUNT', target: 5, metric: 'level' },
    xpReward: 250,
    unlockMessage: 'Level 5! You are becoming a true scholar!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 13,
    tier: 3,
  },
  {
    name: 'XP Collector',
    slug: 'xp-collector',
    description: 'Earn 1000 total XP',
    icon: '💎',
    category: 'SPECIAL',
    rarity: 'RARE',
    criteria: { type: 'COUNT', target: 1000, metric: 'total_xp' },
    xpReward: 100,
    unlockMessage: '1000 XP collected! Keep climbing!',
    isHidden: false,
    isRepeatable: false,
    displayOrder: 14,
    tier: 3,
  },
  {
    name: 'Legendary Learner',
    slug: 'legendary-learner',
    description: 'Reach Level 10',
    icon: '🏅',
    category: 'SPECIAL',
    rarity: 'LEGENDARY',
    criteria: { type: 'COUNT', target: 10, metric: 'level' },
    xpReward: 1000,
    unlockMessage: 'LEGENDARY! You have achieved greatness!',
    isHidden: true,
    isRepeatable: false,
    displayOrder: 15,
    tier: 5,
  },
];

async function seedGamification() {
  console.log('🎮 Seeding gamification data...\n');

  // 1. Create achievements
  console.log('📦 Creating achievements...');
  for (const achievement of ACHIEVEMENTS) {
    await prisma.gamificationAchievement.upsert({
      where: { slug: achievement.slug },
      update: achievement,
      create: achievement,
    });
    console.log(`  ✓ ${achievement.name}`);
  }
  console.log(`\n✅ Created ${ACHIEVEMENTS.length} achievements\n`);

  // 2. Find a user to seed data for
  const user = await prisma.user.findFirst({
    where: { role: 'USER' },
    orderBy: { createdAt: 'desc' },
  });

  if (!user) {
    console.log('⚠️  No user found. Creating test XP without user achievements.');
    console.log('   Sign up or log in to see gamification data on your dashboard.\n');
    return;
  }

  console.log(`👤 Found user: ${user.name || user.email}\n`);

  // 3. Create or update user XP
  console.log('💰 Setting up user XP...');
  const userXP = await prisma.gamificationUserXP.upsert({
    where: { userId: user.id },
    update: {
      totalXP: 1250,
      currentLevel: 5,
      xpInCurrentLevel: 250,
      xpToNextLevel: 500,
      totalAchievements: 6,
      currentStreak: 8,
      longestStreak: 12,
      lastActivityDate: new Date(),
      streakFreezeCount: 2,
    },
    create: {
      userId: user.id,
      totalXP: 1250,
      currentLevel: 5,
      xpInCurrentLevel: 250,
      xpToNextLevel: 500,
      totalAchievements: 6,
      currentStreak: 8,
      longestStreak: 12,
      lastActivityDate: new Date(),
      streakFreezeCount: 2,
    },
  });
  console.log(`  ✓ XP: ${userXP.totalXP} | Level: ${userXP.currentLevel} | Streak: ${userXP.currentStreak} days\n`);

  // 4. Unlock some achievements for the user
  console.log('🏆 Unlocking achievements...');
  const achievementsToUnlock = [
    'first-steps',
    'week-warrior',
    'lesson-learner',
    'knowledge-seeker',
    'quiz-whiz',
    'early-bird',
  ];

  for (const slug of achievementsToUnlock) {
    const achievement = await prisma.gamificationAchievement.findUnique({
      where: { slug },
    });

    if (achievement) {
      await prisma.gamificationUserAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: user.id,
            achievementId: achievement.id,
          },
        },
        update: {
          isUnlocked: true,
          unlockedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          currentProgress: (achievement.criteria as { target?: number })?.target || 1,
          targetProgress: (achievement.criteria as { target?: number })?.target || 1,
          timesEarned: 1,
          isNew: slug === 'quiz-whiz', // Mark one as new
        },
        create: {
          userId: user.id,
          achievementId: achievement.id,
          isUnlocked: true,
          unlockedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          currentProgress: (achievement.criteria as { target?: number })?.target || 1,
          targetProgress: (achievement.criteria as { target?: number })?.target || 1,
          timesEarned: 1,
          isNew: slug === 'quiz-whiz',
        },
      });
      console.log(`  ✓ Unlocked: ${achievement.name}`);
    }
  }

  // 5. Create some in-progress achievements
  console.log('\n📊 Creating progress on achievements...');
  const achievementsInProgress = [
    { slug: 'fortnight-focus', progress: 8, target: 14 },
    { slug: 'course-completer', progress: 0.7, target: 1 },
    { slug: 'xp-collector', progress: 1250, target: 1000 },
  ];

  for (const { slug, progress, target } of achievementsInProgress) {
    const achievement = await prisma.gamificationAchievement.findUnique({
      where: { slug },
    });

    if (achievement) {
      await prisma.gamificationUserAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: user.id,
            achievementId: achievement.id,
          },
        },
        update: {
          currentProgress: progress,
          targetProgress: target,
          isUnlocked: false,
        },
        create: {
          userId: user.id,
          achievementId: achievement.id,
          currentProgress: progress,
          targetProgress: target,
          isUnlocked: false,
          timesEarned: 0,
        },
      });
      console.log(`  ✓ Progress: ${achievement.name} (${Math.round((progress / target) * 100)}%)`);
    }
  }

  // 6. Create leaderboard entries
  console.log('\n🏅 Creating leaderboard entries...');
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Weekly leaderboard entry
  await prisma.gamificationLeaderboardEntry.upsert({
    where: {
      userId_period_periodStart: {
        userId: user.id,
        period: 'WEEKLY',
        periodStart: weekStart,
      },
    },
    update: {
      xpEarned: 450,
      achievementsUnlocked: 2,
      lessonsCompleted: 8,
      quizzesTaken: 3,
      studyMinutes: 180,
      rank: 3,
      previousRank: 5,
      rankChange: 2,
    },
    create: {
      userId: user.id,
      period: 'WEEKLY',
      periodStart: weekStart,
      xpEarned: 450,
      achievementsUnlocked: 2,
      lessonsCompleted: 8,
      quizzesTaken: 3,
      studyMinutes: 180,
      rank: 3,
      previousRank: 5,
      rankChange: 2,
    },
  });
  console.log('  ✓ Weekly entry created');

  // Monthly leaderboard entry
  await prisma.gamificationLeaderboardEntry.upsert({
    where: {
      userId_period_periodStart: {
        userId: user.id,
        period: 'MONTHLY',
        periodStart: monthStart,
      },
    },
    update: {
      xpEarned: 1250,
      achievementsUnlocked: 6,
      lessonsCompleted: 25,
      quizzesTaken: 10,
      studyMinutes: 540,
      rank: 7,
      previousRank: 12,
      rankChange: 5,
    },
    create: {
      userId: user.id,
      period: 'MONTHLY',
      periodStart: monthStart,
      xpEarned: 1250,
      achievementsUnlocked: 6,
      lessonsCompleted: 25,
      quizzesTaken: 10,
      studyMinutes: 540,
      rank: 7,
      previousRank: 12,
      rankChange: 5,
    },
  });
  console.log('  ✓ Monthly entry created');

  // All-time leaderboard entry
  const allTimeStart = new Date(2020, 0, 1);
  await prisma.gamificationLeaderboardEntry.upsert({
    where: {
      userId_period_periodStart: {
        userId: user.id,
        period: 'ALL_TIME',
        periodStart: allTimeStart,
      },
    },
    update: {
      xpEarned: 1250,
      achievementsUnlocked: 6,
      lessonsCompleted: 25,
      quizzesTaken: 10,
      studyMinutes: 540,
      rank: 15,
    },
    create: {
      userId: user.id,
      period: 'ALL_TIME',
      periodStart: allTimeStart,
      xpEarned: 1250,
      achievementsUnlocked: 6,
      lessonsCompleted: 25,
      quizzesTaken: 10,
      studyMinutes: 540,
      rank: 15,
    },
  });
  console.log('  ✓ All-time entry created');

  // 7. Create some fake users for leaderboard
  console.log('\n👥 Creating sample leaderboard competitors...');
  const fakeUsers = [
    { name: 'Alex Chen', xp: 2500 },
    { name: 'Sarah Miller', xp: 1800 },
    { name: 'James Wilson', xp: 1600 },
    { name: 'Emma Davis', xp: 1400 },
    { name: 'Michael Brown', xp: 1100 },
    { name: 'Olivia Taylor', xp: 950 },
    { name: 'Daniel Garcia', xp: 800 },
  ];

  for (let i = 0; i < fakeUsers.length; i++) {
    const fake = fakeUsers[i];

    // Create or find fake user
    let fakeUser = await prisma.user.findFirst({
      where: { name: fake.name },
    });

    if (!fakeUser) {
      fakeUser = await prisma.user.create({
        data: {
          name: fake.name,
          email: `${fake.name.toLowerCase().replace(' ', '.')}@example.com`,
          role: 'USER',
        },
      });
    }

    // Create leaderboard entry
    await prisma.gamificationLeaderboardEntry.upsert({
      where: {
        userId_period_periodStart: {
          userId: fakeUser.id,
          period: 'WEEKLY',
          periodStart: weekStart,
        },
      },
      update: {
        xpEarned: fake.xp,
        rank: i + 1,
        lessonsCompleted: Math.floor(fake.xp / 50),
      },
      create: {
        userId: fakeUser.id,
        period: 'WEEKLY',
        periodStart: weekStart,
        xpEarned: fake.xp,
        rank: i + 1,
        lessonsCompleted: Math.floor(fake.xp / 50),
        achievementsUnlocked: Math.floor(fake.xp / 300),
        quizzesTaken: Math.floor(fake.xp / 200),
        studyMinutes: Math.floor(fake.xp / 5),
      },
    });
    console.log(`  ✓ ${fake.name} - ${fake.xp} XP (Rank #${i + 1})`);
  }

  // 8. Create user preferences
  console.log('\n⚙️  Setting up preferences...');
  await prisma.gamificationPreferences.upsert({
    where: { userId: user.id },
    update: {
      achievementNotifications: true,
      levelUpNotifications: true,
      streakReminders: true,
      leaderboardUpdates: true,
      showOnLeaderboard: true,
      showAchievements: true,
      showLevel: true,
      showStreak: true,
    },
    create: {
      userId: user.id,
      achievementNotifications: true,
      levelUpNotifications: true,
      streakReminders: true,
      leaderboardUpdates: true,
      showOnLeaderboard: true,
      showAchievements: true,
      showLevel: true,
      showStreak: true,
    },
  });
  console.log('  ✓ Preferences configured');

  console.log('\n✨ Gamification seed complete!');
  console.log('🌐 Visit http://localhost:3000/dashboard/user to see your gamification dashboard!\n');
}

seedGamification()
  .catch((e) => {
    console.error('❌ Error seeding gamification:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
