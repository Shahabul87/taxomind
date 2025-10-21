import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanQAData() {
  console.log('🧹 Cleaning Q&A data...');

  try {
    // Delete all votes first (foreign key constraint)
    const votesDeleted = await prisma.questionVote.deleteMany({});
    console.log(`✅ Deleted ${votesDeleted.count} votes`);

    // Delete all answers
    const answersDeleted = await prisma.courseAnswer.deleteMany({});
    console.log(`✅ Deleted ${answersDeleted.count} answers`);

    // Delete all questions
    const questionsDeleted = await prisma.courseQuestion.deleteMany({});
    console.log(`✅ Deleted ${questionsDeleted.count} questions`);

    console.log('\n✅ Q&A data cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning Q&A data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanQAData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
