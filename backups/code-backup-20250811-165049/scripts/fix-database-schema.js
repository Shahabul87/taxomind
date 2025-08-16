/**
 * Database Schema Fix Script
 * This script helps fix common database schema issues
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // ====== POST TABLE CHECKS ======
    console.log('\n📝 Checking Post table...');
    
    // Check if Post table exists
    const postTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Post'
      );
    `;
    
    console.log('Post table exists:', postTableExists[0]?.exists);
    
    if (!postTableExists[0]?.exists) {
      console.log('❌ Post table does not exist. Please run: npx prisma migrate dev');
      return;
    }
    
    // Check and fix Post columns
    const postColumns = {
      body: { type: 'TEXT', default: "''", nullable: false },
      isArchived: { type: 'BOOLEAN', default: 'false', nullable: false },
      authorId: { type: 'TEXT', default: null, nullable: true }
    };
    
    for (const [columnName, columnSpec] of Object.entries(postColumns)) {
      const columnExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Post'
          AND column_name = ${columnName}
        );
      `;
      
      console.log(`Post.${columnName} column exists:`, columnExists[0]?.exists);
      
      if (!columnExists[0]?.exists) {
        console.log(`⚠️  Adding missing ${columnName} column to Post table...`);
        
        const nullable = columnSpec.nullable ? '' : 'NOT NULL';
        const defaultValue = columnSpec.default ? `DEFAULT ${columnSpec.default}` : '';
        
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Post" 
          ADD COLUMN "${columnName}" ${columnSpec.type} ${nullable} ${defaultValue};
        `);
        
        console.log(`✅ Added ${columnName} column to Post table`);
      }
    }
    
    // ====== COURSE TABLE CHECKS ======
    console.log('\n📚 Checking Course table...');
    
    // Check if Course table exists
    const courseTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Course'
      );
    `;
    
    console.log('Course table exists:', courseTableExists[0]?.exists);
    
    if (!courseTableExists[0]?.exists) {
      console.log('❌ Course table does not exist. Please run: npx prisma migrate dev');
      return;
    }
    
    // Check and fix Course columns
    const courseColumns = {
      slug: { type: 'TEXT', default: null, nullable: true },
      subtitle: { type: 'TEXT', default: null, nullable: true },
      isFeatured: { type: 'BOOLEAN', default: 'false', nullable: false }
    };
    
    for (const [columnName, columnSpec] of Object.entries(courseColumns)) {
      const columnExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Course'
          AND column_name = ${columnName}
        );
      `;
      
      console.log(`Course.${columnName} column exists:`, columnExists[0]?.exists);
      
      if (!columnExists[0]?.exists) {
        console.log(`⚠️  Adding missing ${columnName} column to Course table...`);
        
        const nullable = columnSpec.nullable ? '' : 'NOT NULL';
        const defaultValue = columnSpec.default ? `DEFAULT ${columnSpec.default}` : '';
        
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Course" 
          ADD COLUMN "${columnName}" ${columnSpec.type} ${nullable} ${defaultValue};
        `);
        
        console.log(`✅ Added ${columnName} column to Course table`);
      }
    }
    
    // ====== DISPLAY CURRENT STRUCTURES ======
    console.log('\n📋 Current table structures:');
    
    // Post table structure
    const postStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Post'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📝 Post table structure:');
    console.table(postStructure);
    
    // Course table structure
    const courseStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Course'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📚 Course table structure:');
    console.table(courseStructure);
    
    // ====== TEST BASIC OPERATIONS ======
    console.log('\n🧪 Testing basic operations...');
    
    const postCount = await prisma.post.count();
    console.log(`📊 Total posts: ${postCount}`);
    
    const courseCount = await prisma.course.count();
    console.log(`📊 Total courses: ${courseCount}`);
    
    if (postCount > 0) {
      const samplePost = await prisma.post.findFirst({
        select: {
          id: true,
          title: true,
          body: true,
          published: true,
          isArchived: true,
          authorId: true,
          createdAt: true
        }
      });
      
      console.log('\n📄 Sample post:');
      console.log(samplePost);
    }
    
    if (courseCount > 0) {
      const sampleCourse = await prisma.course.findFirst({
        select: {
          id: true,
          title: true,
          description: true,
          isPublished: true,
          createdAt: true
        }
      });
      
      console.log('\n📚 Sample course:');
      console.log(sampleCourse);
    }
    
    console.log('\n✅ Database schema check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking/fixing schema:', error);
    
    if (error.code === 'P2022') {
      console.log('\n💡 Solution: The database schema is not in sync with your Prisma schema.');
      console.log('   Run one of the following commands:');
      console.log('   1. npx prisma db push (for development)');
      console.log('   2. npx prisma migrate dev (for proper migrations)');
      console.log('   3. npx prisma migrate reset (to reset and reseed)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAndFixSchema().catch(console.error);