import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQAData() {
  console.log('🌱 Seeding Q&A data...');

  try {
    // Get first course
    const course = await prisma.course.findFirst({
      where: { isPublished: true },
      include: {
        chapters: {
          include: {
            sections: true,
          },
        },
        user: true,
      },
    });

    if (!course) {
      console.log('❌ No published courses found. Please create a course first.');
      return;
    }

    console.log(`✅ Found course: ${course.title}`);

    // Get or create a test user for Q&A
    let qaUser = await prisma.user.findFirst({
      where: { email: { contains: 'test' } },
    });

    if (!qaUser) {
      qaUser = await prisma.user.create({
        data: {
          id: 'qa-test-user-' + Date.now(),
          name: 'Test Student',
          email: 'qa.test@example.com',
          emailVerified: new Date(),
        },
      });
      console.log(`✅ Created test user: ${qaUser.email}`);
    } else {
      console.log(`✅ Using existing user: ${qaUser.email}`);
    }

    // Create enrollment for the user
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: qaUser.id,
        courseId: course.id,
      },
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          id: 'qa-enrollment-' + Date.now(),
          userId: qaUser.id,
          courseId: course.id,
          updatedAt: new Date(),
        },
      });
      console.log('✅ Created enrollment');
    }

    // Get a section for linking questions
    const section = course.chapters[0]?.sections[0];

    // Sample questions
    const questions = [
      {
        title: 'How do I get started with this course?',
        content:
          `I'm new to this topic and wondering what prerequisites I should have before starting. Are there any recommended resources I should review first?`,
        sectionId: section?.id,
      },
      {
        title: 'What is the best practice for implementing authentication?',
        content:
          `I'm working on the authentication module and want to make sure I'm following best practices. Should I use JWT tokens or session-based auth? What are the security considerations?`,
        sectionId: section?.id,
      },
      {
        title: 'Assignment submission deadline question',
        content: 'When is the final project due? I want to plan my schedule accordingly.',
        sectionId: null,
      },
    ];

    console.log('\n📝 Creating questions...');

    for (const questionData of questions) {
      const question = await prisma.courseQuestion.create({
        data: {
          courseId: course.id,
          userId: qaUser.id,
          title: questionData.title,
          content: questionData.content,
          sectionId: questionData.sectionId || undefined,
        },
      });

      console.log(`   ✅ Created: "${question.title}"`);

      // Add instructor answer to first question
      if (questions.indexOf(questionData) === 0) {
        const answer = await prisma.courseAnswer.create({
          data: {
            questionId: question.id,
            userId: course.userId,
            content:
              `Great question! The only prerequisite is basic programming knowledge. I recommend reviewing the introduction section first, which covers all the fundamentals you'll need. Feel free to ask if you have any specific questions!`,
            isInstructor: true,
            isBestAnswer: true,
          },
        });

        // Update question as answered
        await prisma.courseQuestion.update({
          where: { id: question.id },
          data: { isAnswered: true },
        });

        console.log('      ✅ Added instructor answer (marked as best)');

        // Add some votes
        await prisma.questionVote.create({
          data: {
            questionId: question.id,
            userId: course.userId,
            value: 1,
          },
        });

        await prisma.courseQuestion.update({
          where: { id: question.id },
          data: { upvotes: 1 },
        });

        console.log('      ✅ Added upvote');
      }

      // Add student answer to second question
      if (questions.indexOf(questionData) === 1) {
        await prisma.courseAnswer.create({
          data: {
            questionId: question.id,
            userId: qaUser.id,
            content:
              `I found that JWT tokens work well for stateless authentication. They're great for APIs and mobile apps. Just make sure to implement proper token refresh logic and secure storage!`,
            isInstructor: false,
          },
        });

        await prisma.courseQuestion.update({
          where: { id: question.id },
          data: { isAnswered: true },
        });

        console.log('      ✅ Added student answer');
      }

      // Pin the third question (instructor only)
      if (questions.indexOf(questionData) === 2) {
        await prisma.courseQuestion.update({
          where: { id: question.id },
          data: { isPinned: true },
        });
        console.log('      ✅ Pinned question');
      }
    }

    console.log('\n✅ Q&A seeding complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Course: ${course.title}`);
    console.log(`   - Questions created: ${questions.length}`);
    console.log(`   - Answers created: 2`);
    console.log(`   - Votes created: 1`);
    console.log(
      `\n🔗 View at: http://localhost:3000/courses/${course.id} (Q&A tab)`
    );
  } catch (error) {
    console.error('❌ Error seeding Q&A data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedQAData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
