#!/usr/bin/env node

/**
 * Script to add performance indexes to the database
 * Run after database is set up with schema
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addIndexes() {
  console.log('🚀 Adding performance indexes to database...\n');
  
  const indexes = [
    // Course-related indexes
    'CREATE INDEX IF NOT EXISTS "idx_Course_published_category" ON "Course"("isPublished", "categoryId")',
    'CREATE INDEX IF NOT EXISTS "idx_Course_user_published" ON "Course"("userId", "isPublished")',
    'CREATE INDEX IF NOT EXISTS "idx_Course_created_at" ON "Course"("createdAt" DESC)',
    
    // Chapter-related indexes
    'CREATE INDEX IF NOT EXISTS "idx_Chapter_course_published" ON "Chapter"("courseId", "isPublished")',
    'CREATE INDEX IF NOT EXISTS "idx_Chapter_course_position" ON "Chapter"("courseId", "position")',
    
    // Section-related indexes
    'CREATE INDEX IF NOT EXISTS "idx_Section_chapter_position" ON "Section"("chapterId", "position")',
    'CREATE INDEX IF NOT EXISTS "idx_Section_chapter_free" ON "Section"("chapterId", "isFree")',
    
    // Enrollment and Purchase indexes
    'CREATE INDEX IF NOT EXISTS "idx_Enrollment_user_course" ON "Enrollment"("userId", "courseId")',
    'CREATE INDEX IF NOT EXISTS "idx_Purchase_user_course" ON "Purchase"("userId", "courseId")',
    'CREATE INDEX IF NOT EXISTS "idx_Purchase_created_at" ON "Purchase"("createdAt" DESC)',
    
    // User Progress indexes
    'CREATE INDEX IF NOT EXISTS "idx_UserProgress_user_course" ON "UserProgress"("userId", "courseId")',
    'CREATE INDEX IF NOT EXISTS "idx_UserProgress_user_section" ON "UserProgress"("userId", "sectionId")',
    'CREATE INDEX IF NOT EXISTS "idx_UserProgress_completed" ON "UserProgress"("isCompleted", "userId")',
    
    // Analytics and Metrics indexes
    'CREATE INDEX IF NOT EXISTS "idx_LearningMetrics_user_date" ON "LearningMetrics"("userId", "lastActivityDate" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_LearningMetrics_course_date" ON "LearningMetrics"("courseId", "lastActivityDate" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_RealtimeActivity_timestamp" ON "RealtimeActivity"("timestamp" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_RealtimeActivity_user" ON "RealtimeActivity"("userId", "timestamp" DESC)',
    
    // Course Review indexes
    'CREATE INDEX IF NOT EXISTS "idx_CourseReview_course" ON "CourseReview"("courseId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_CourseReview_user" ON "CourseReview"("userId")',
    
    // Quiz and Assessment indexes
    'CREATE INDEX IF NOT EXISTS "idx_QuizAttempt_user_quiz" ON "QuizAttempt"("userId", "quizId")',
    'CREATE INDEX IF NOT EXISTS "idx_QuizAttempt_completed" ON "QuizAttempt"("completedAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_ExamAttempt_user_exam" ON "ExamAttempt"("userId", "examId")',
    
    // Attachment and Resource indexes
    'CREATE INDEX IF NOT EXISTS "idx_Attachment_course" ON "Attachment"("courseId")',
    'CREATE INDEX IF NOT EXISTS "idx_Resource_section" ON "Resource"("sectionId")',
    
    // Category index
    'CREATE INDEX IF NOT EXISTS "idx_Category_name" ON "Category"("name")',
    
    // User-related indexes for common queries
    'CREATE INDEX IF NOT EXISTS "idx_User_email" ON "User"("email")',
    'CREATE INDEX IF NOT EXISTS "idx_User_role" ON "User"("role")',
    
    // Composite indexes for complex queries
    'CREATE INDEX IF NOT EXISTS "idx_Course_full_query" ON "Course"("isPublished", "categoryId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_Enrollment_active" ON "Enrollment"("userId", "courseId", "enrolledAt" DESC)',
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const indexQuery of indexes) {
    try {
      await prisma.$executeRawUnsafe(indexQuery);
      const indexName = indexQuery.match(/"([^"]+)"/)[1];
      console.log(`✅ Added index: ${indexName}`);
      successCount++;
    } catch (error) {
      const indexName = indexQuery.match(/"([^"]+)"/)[1];
      if (error.message.includes('already exists')) {
        console.log(`⏭️  Index already exists: ${indexName}`);
      } else {
        console.error(`❌ Failed to add index ${indexName}: ${error.message}`);
        errorCount++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`✅ Successfully added: ${successCount} indexes`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} indexes`);
  }
  
  // Analyze current indexes
  console.log('\n📈 Analyzing current indexes...');
  const tableInfo = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;
  
  const tableCount = {};
  tableInfo.forEach(idx => {
    tableCount[idx.tablename] = (tableCount[idx.tablename] || 0) + 1;
  });
  
  console.log('\n📊 Index count per table:');
  Object.entries(tableCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([table, count]) => {
      console.log(`   ${table}: ${count} indexes`);
    });
  
  await prisma.$disconnect();
  console.log('\n✨ Performance indexes setup complete!');
}

addIndexes().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});