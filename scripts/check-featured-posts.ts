import { db } from '../lib/db';

async function checkFeaturedPosts() {
  try {
    console.log('🔍 Checking blog posts in database...\n');

    // Total posts
    const totalPosts = await db.post.count();
    console.log(`📊 Total posts: ${totalPosts}`);

    // Published posts
    const publishedPosts = await db.post.count({
      where: { published: true, isArchived: false }
    });
    console.log(`✅ Published posts (not archived): ${publishedPosts}\n`);

    // Get published posts details
    if (publishedPosts > 0) {
      const posts = await db.post.findMany({
        where: { published: true, isArchived: false },
        select: {
          id: true,
          title: true,
          published: true,
          isArchived: true,
          category: true,
        },
        take: 10,
      });

      console.log('Published blog posts found:');
      posts.forEach((post, idx) => {
        console.log(`  ${idx + 1}. ${post.title} (${post.category || 'No category'})`);
      });
    } else {
      console.log('⚠️  NO PUBLISHED BLOG POSTS FOUND!');
      console.log('\nTo fix this, you need to:');
      console.log('1. Create blog posts');
      console.log('2. Mark them as "Published"');
      console.log('3. Ensure they are not archived');
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkFeaturedPosts();
