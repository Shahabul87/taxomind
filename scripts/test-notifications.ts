/**
 * Test Script for Learning Notifications
 * Run with: npx tsx scripts/test-notifications.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get a user to create notifications for
  const user = await prisma.user.findFirst({
    where: {
      email: {
        not: undefined,
      },
    },
  });

  if (!user) {
    console.error('❌ No user found in database. Please sign up first.');
    process.exit(1);
  }

  console.log(`\n📧 Creating test notifications for: ${user.email}\n`);

  // Create test notifications
  const notifications = [
    {
      userId: user.id,
      type: 'REMINDER' as const,
      title: 'Upcoming Study Session',
      message: 'Your "React Hooks Deep Dive" session starts in 15 minutes.',
      icon: 'Bell',
      color: '#3B82F6',
      channels: ['IN_APP'] as const[],
      actionUrl: '/dashboard/user',
      actionLabel: 'View Schedule',
      deliveryStatus: 'delivered',
    },
    {
      userId: user.id,
      type: 'STREAK_WARNING' as const,
      title: "Don't lose your streak! 🔥",
      message: 'Complete a learning activity today to maintain your 7-day streak!',
      icon: 'Flame',
      color: '#F59E0B',
      channels: ['IN_APP', 'PUSH'] as const[],
      deliveryStatus: 'delivered',
    },
    {
      userId: user.id,
      type: 'GOAL_PROGRESS' as const,
      title: 'Goal Progress Update',
      message: "You're 75% towards your goal: Complete Advanced TypeScript Course",
      icon: 'Target',
      color: '#8B5CF6',
      channels: ['IN_APP'] as const[],
      actionUrl: '/dashboard/user/goals',
      actionLabel: 'View Goal',
      deliveryStatus: 'delivered',
    },
    {
      userId: user.id,
      type: 'STREAK_ACHIEVEMENT' as const,
      title: 'Streak Milestone! 🎉',
      message: "Amazing! You've reached a 7-day learning streak!",
      icon: 'Trophy',
      color: '#10B981',
      channels: ['IN_APP'] as const[],
      read: true, // This one is already read
      readAt: new Date(),
      deliveryStatus: 'delivered',
    },
    {
      userId: user.id,
      type: 'STUDY_SUGGESTION' as const,
      title: 'Learning Suggestion',
      message: 'Based on your progress, we recommend reviewing "State Management Patterns" next.',
      icon: 'Lightbulb',
      color: '#F59E0B',
      channels: ['IN_APP'] as const[],
      deliveryStatus: 'delivered',
    },
    {
      userId: user.id,
      type: 'BREAK_REMINDER' as const,
      title: 'Time for a Break ☕',
      message: "You've been learning for 60 minutes. Take a 5-minute break to recharge!",
      icon: 'Coffee',
      color: '#14B8A6',
      channels: ['IN_APP'] as const[],
      deliveryStatus: 'delivered',
    },
    {
      userId: user.id,
      type: 'DEADLINE' as const,
      title: 'Assignment Due Tomorrow',
      message: 'Your "TypeScript Generics Exercise" assignment is due in 24 hours.',
      icon: 'Clock',
      color: '#EF4444',
      channels: ['IN_APP', 'EMAIL'] as const[],
      actionUrl: '/courses',
      actionLabel: 'View Assignment',
      deliveryStatus: 'delivered',
    },
  ];

  // Clear existing test notifications first
  const deleted = await prisma.learningNotification.deleteMany({
    where: { userId: user.id },
  });
  console.log(`🗑️  Cleared ${deleted.count} existing notifications`);

  // Create new notifications
  for (const notification of notifications) {
    await prisma.learningNotification.create({
      data: notification,
    });
    console.log(`✅ Created: ${notification.title}`);
  }

  // Also ensure user has notification preferences
  await prisma.learningNotificationPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      enabled: true,
      timezone: 'UTC',
      remindersBefore: 15,
      streakReminders: true,
      goalUpdates: true,
      weeklySummary: true,
      dailyDigest: true,
      breakReminders: true,
      studySuggestions: true,
      breakIntervalMinutes: 60,
      breakDurationMinutes: 5,
      digestTime: '08:00',
      weeklyDigestDay: 1,
    },
    update: {},
  });
  console.log(`✅ Notification preferences ready`);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Test notifications created successfully!

To test:
1. Start the dev server: npm run dev
2. Go to: http://localhost:3000/dashboard/user
3. Click the bell icon (🔔) in the header
4. You should see ${notifications.length} notifications (${notifications.filter(n => !n.read).length} unread)

Features to test:
• Click a notification to mark as read
• Click "Mark all as read" button
• Dismiss notifications with X button
• Switch to Settings tab
• Open full settings dialog
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
