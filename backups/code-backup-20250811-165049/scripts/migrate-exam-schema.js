// Migration script to update exam schema
// Run this after running "npx prisma db push"

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExamSchema() {
  try {
    console.log('🔄 Starting exam schema migration...');

    // Check if any old exam data exists that needs to be migrated
    const exams = await prisma.exam.findMany();
    
    console.log(`📊 Found ${exams.length} existing exams`);

    // Update any exams that might have null values for new required fields
    for (const exam of exams) {
      const updates = {};
      
      // Set default values for new fields if they're null/undefined
      if (exam.attempts === null || exam.attempts === undefined) {
        updates.attempts = 1;
      }
      
      if (exam.passingScore === null || exam.passingScore === undefined) {
        updates.passingScore = 70;
      }
      
      if (exam.shuffleQuestions === null || exam.shuffleQuestions === undefined) {
        updates.shuffleQuestions = false;
      }
      
      if (exam.showResults === null || exam.showResults === undefined) {
        updates.showResults = true;
      }
      
      if (exam.isActive === null || exam.isActive === undefined) {
        updates.isActive = true;
      }

      // Only update if there are changes needed
      if (Object.keys(updates).length > 0) {
        await prisma.exam.update({
          where: { id: exam.id },
          data: updates,
        });
        
        console.log(`✅ Updated exam: ${exam.title}`);
      }
    }

    // Create sample exam data for testing (optional)
    const sections = await prisma.section.findMany({
      take: 1, // Just get one section for demo
    });

    if (sections.length > 0 && exams.length === 0) {
      console.log('🎯 Creating sample exam...');
      
      const sampleExam = await prisma.exam.create({
        data: {
          title: 'Sample Quiz',
          description: 'A sample quiz to test the exam system',
          instructions: 'Please answer all questions to the best of your ability.',
          timeLimit: 30, // 30 minutes
          attempts: 3,
          passingScore: 70,
          shuffleQuestions: false,
          showResults: true,
          isPublished: true,
          isActive: true,
          sectionId: sections[0].id,
        },
      });

      // Create sample questions
      const questions = [
        {
          question: 'What is 2 + 2?',
          questionType: 'MULTIPLE_CHOICE',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          points: 1,
          order: 1,
          explanation: 'Basic arithmetic: 2 + 2 = 4',
        },
        {
          question: 'The sky is blue.',
          questionType: 'TRUE_FALSE',
          correctAnswer: true,
          points: 1,
          order: 2,
          explanation: 'The sky appears blue due to light scattering.',
        },
        {
          question: 'What is the capital of France?',
          questionType: 'SHORT_ANSWER',
          correctAnswer: 'Paris',
          points: 2,
          order: 3,
          explanation: 'Paris is the capital and largest city of France.',
        },
      ];

      for (const questionData of questions) {
        await prisma.examQuestion.create({
          data: {
            ...questionData,
            examId: sampleExam.id,
          },
        });
      }

      console.log('✅ Sample exam created with 3 questions');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateExamSchema()
    .then(() => {
      console.log('✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { migrateExamSchema }; 