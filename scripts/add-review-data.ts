import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get user ID
  const user = await prisma.user.findFirst({ where: { email: 'bob.learner@taxomind.com' } });
  if (!user) {
    console.log('User not found');
    return;
  }

  // Get some sections to use as concepts
  const sections = await prisma.section.findMany({ take: 5 });
  if (sections.length === 0) {
    console.log('No sections found');
    return;
  }

  console.log('Found ' + sections.length + ' sections for user ' + user.id);

  const now = new Date();

  // Create spaced repetition entries
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const daysOffset = i - 2; // -2, -1, 0, 1, 2 (overdue to upcoming)
    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + daysOffset);

    await prisma.spacedRepetitionSchedule.upsert({
      where: { userId_conceptId: { userId: user.id, conceptId: section.id } },
      create: {
        userId: user.id,
        conceptId: section.id,
        nextReviewDate,
        easeFactor: 2.5 - (i * 0.2),
        interval: 1 + i,
        repetitions: i,
        lastScore: i >= 2 ? 4 : null,
        retentionEstimate: 100 - (i * 15),
      },
      update: {
        nextReviewDate,
        easeFactor: 2.5 - (i * 0.2),
        interval: 1 + i,
        repetitions: i,
        lastScore: i >= 2 ? 4 : null,
        retentionEstimate: 100 - (i * 15),
      },
    });
    console.log('Created review for section: ' + section.title + ' - Due: ' + nextReviewDate.toDateString());
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
