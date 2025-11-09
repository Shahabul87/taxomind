/**
 * Backfill Script: Create user_progress records for existing enrollments
 *
 * This script creates missing user_progress records for users who enrolled
 * before the enrollment worker was updated to automatically create progress tracking.
 *
 * Usage:
 *   npx tsx scripts/backfill-user-progress.ts
 */

import { db } from '@/lib/db';

async function backfillUserProgress() {
  console.log('🚀 Starting user_progress backfill...\n');

  try {
    // Get all enrollments
    const enrollments = await db.enrollment.findMany({
      select: {
        id: true,
        userId: true,
        courseId: true,
        User: {
          select: {
            email: true,
          },
        },
        Course: {
          select: {
            title: true,
            chapters: {
              select: {
                id: true,
                title: true,
                sections: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${enrollments.length} enrollments to process\n`);

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const enrollment of enrollments) {
      try {
        console.log(`\n👤 Processing: ${enrollment.User.email} → ${enrollment.Course.title}`);

        let createdForEnrollment = 0;

        for (const chapter of enrollment.Course.chapters) {
          for (const section of chapter.sections) {
            // Check if progress record already exists
            const existing = await db.user_progress.findFirst({
              where: {
                userId: enrollment.userId,
                courseId: enrollment.courseId,
                chapterId: chapter.id,
                sectionId: section.id,
              },
            });

            if (existing) {
              totalSkipped++;
              continue;
            }

            // Create progress record
            await db.user_progress.create({
              data: {
                id: crypto.randomUUID(),
                userId: enrollment.userId,
                courseId: enrollment.courseId,
                chapterId: chapter.id,
                sectionId: section.id,
                isCompleted: false,
                progressPercent: 0,
                timeSpent: 0,
                attempts: 0,
                currentStreak: 0,
                lastAccessedAt: new Date(),
                updatedAt: new Date(),
              },
            });

            createdForEnrollment++;
            totalCreated++;
          }
        }

        console.log(`   ✅ Created ${createdForEnrollment} progress records`);
      } catch (error) {
        console.error(`   ❌ Error processing enrollment ${enrollment.id}:`, error);
        totalErrors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Created:  ${totalCreated} progress records`);
    console.log(`⏭️  Skipped:  ${totalSkipped} (already exist)`);
    console.log(`❌ Errors:   ${totalErrors}`);
    console.log('='.repeat(60));
    console.log('\n✨ Backfill complete!');

  } catch (error) {
    console.error('💥 Fatal error during backfill:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the backfill
backfillUserProgress()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
