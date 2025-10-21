import { db } from '../lib/db';

/**
 * Seed Script - Minimal Posts (Matching Actual Creation Flow)
 *
 * This script creates posts EXACTLY as they are created through the UI:
 * - Only title and category (no content, no chapters)
 * - published: false (all start as drafts)
 * - isArchived: false
 *
 * User then manually adds chapters on /teacher/posts/[postId] page
 */

const userId = 'cmgvy101v0000h4uvpd1enrp6';

// Real post titles with categories (as user would create them)
const postsToCreate = [
  {
    title: 'The Complete Guide to Modern Web Development',
    categories: ['Web Development', 'Programming', 'Technology'],
  },
  {
    title: 'Mastering React Performance Optimization',
    categories: ['React', 'Web Development', 'Programming'],
  },
  {
    title: 'Building Scalable Node.js Applications',
    categories: ['Backend', 'Node.js', 'Programming'],
  },
  {
    title: 'TypeScript for JavaScript Developers',
    categories: ['TypeScript', 'Programming', 'Web Development'],
  },
  {
    title: 'CSS Grid and Flexbox Mastery',
    categories: ['CSS', 'Web Development', 'UI/UX Design'],
  },
  {
    title: 'Git and Version Control Best Practices',
    categories: ['DevOps', 'Git', 'Programming'],
  },
  {
    title: 'RESTful API Design Principles',
    categories: ['API Development', 'Backend', 'Architecture'],
  },
  {
    title: 'Docker and Containerization',
    categories: ['DevOps', 'Docker', 'Cloud Computing'],
  },
  {
    title: 'GraphQL API Development',
    categories: ['API Development', 'GraphQL', 'Backend'],
  },
  {
    title: 'MongoDB and NoSQL Database Design',
    categories: ['Database', 'MongoDB', 'Backend'],
  },
  {
    title: 'Next.js 15 Complete Guide',
    categories: ['React', 'Next.js', 'Web Development'],
  },
  {
    title: 'Tailwind CSS Advanced Techniques',
    categories: ['CSS', 'Tailwind', 'UI/UX Design'],
  },
  {
    title: 'PostgreSQL Performance Tuning',
    categories: ['Database', 'PostgreSQL', 'Backend'],
  },
  {
    title: 'Testing Modern Web Applications',
    categories: ['Testing', 'Programming', 'Web Development'],
  },
  {
    title: 'Microservices Architecture Patterns',
    categories: ['Architecture', 'Microservices', 'Backend'],
  },
  {
    title: 'Redis Caching Strategies',
    categories: ['Backend', 'Redis', 'Database'],
  },
  {
    title: 'Kubernetes for Developers',
    categories: ['DevOps', 'Kubernetes', 'Cloud Computing'],
  },
  {
    title: 'OAuth 2.0 and Authentication',
    categories: ['Security', 'Authentication', 'Backend'],
  },
  {
    title: 'AWS Cloud Architecture',
    categories: ['Cloud', 'AWS', 'DevOps'],
  },
  {
    title: 'Web Security Best Practices',
    categories: ['Security', 'Web Development', 'Backend'],
  },
  {
    title: 'Progressive Web Apps (PWA)',
    categories: ['Web Development', 'PWA', 'Mobile Development'],
  },
  {
    title: 'Machine Learning Fundamentals',
    categories: ['AI & ML', 'Data Science', 'Programming'],
  },
  {
    title: 'Python for Data Analysis',
    categories: ['Python', 'Data Science', 'Programming'],
  },
  {
    title: 'Vue.js 3 Composition API',
    categories: ['Vue.js', 'Web Development', 'Programming'],
  },
  {
    title: 'Serverless Architecture with AWS Lambda',
    categories: ['Cloud', 'AWS', 'Architecture'],
  },
];

async function seedMinimalPosts() {
  try {
    console.log('🌱 Starting minimal post seeding (matching actual creation flow)...\n');

    // Step 1: Delete existing posts for this user
    console.log(`🗑️  Cleaning up existing posts for user: ${userId}`);

    await db.postChapterSection.deleteMany({
      where: {
        Post: {
          userId: userId,
        },
      },
    });

    await db.post.deleteMany({
      where: {
        userId: userId,
      },
    });

    console.log('✅ Cleanup complete\n');

    // Step 2: Create posts EXACTLY as the UI does
    console.log(`📝 Creating ${postsToCreate.length} posts (draft mode, no content)...\n`);

    for (const [index, postData] of postsToCreate.entries()) {
      // Join categories into a single string (matching the repository logic)
      const category = postData.categories.join(', ');

      // Create post with ONLY the fields the repository uses
      const post = await db.post.create({
        data: {
          userId: userId,
          title: postData.title,
          category: category,
          published: false,      // Always false (draft)
          isArchived: false,     // Always false
          // All other fields use schema defaults:
          // - description: null
          // - imageUrl: null
          // - views: 0
          // - body: ""
          // - createdAt: now()
          // - updatedAt: now()
        },
      });

      console.log(`   ✅ Created: "${post.title}"`);
      console.log(`      ID: ${post.id}`);
      console.log(`      Category: ${post.category}`);
      console.log(`      Status: Draft (published: false)`);
      console.log('');
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Posts created: ${postsToCreate.length}`);
    console.log(`   - All posts are DRAFTS (published: false)`);
    console.log(`   - No chapters created (as per actual UI flow)`);
    console.log(`   - User ID: ${userId}`);

    // Step 3: Verify
    const postCount = await db.post.count({ where: { userId } });
    console.log(`\n✅ Verification:`);
    console.log(`   - Posts in database: ${postCount}`);
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Visit: http://localhost:3001/teacher/posts/all-posts`);
    console.log(`   2. Click any post to edit it`);
    console.log(`   3. Add chapters manually (matching actual user flow)`);

  } catch (error) {
    console.error('❌ Error seeding posts:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

seedMinimalPosts();
