import { getHomepageFeaturedCourses, getHomepageFeaturedPosts } from '../actions/get-homepage-content';

async function testHomepage() {
  try {
    console.log('🧪 Testing Homepage Data Fetching...\n');

    // Test featured courses
    console.log('📚 Fetching featured courses...');
    const courses = await getHomepageFeaturedCourses(8);
    console.log(`✅ Found ${courses.length} featured courses:`);
    courses.forEach((course, idx) => {
      console.log(`   ${idx + 1}. ${course.title}`);
    });

    console.log('\n📰 Fetching featured blog posts...');
    const posts = await getHomepageFeaturedPosts(6);
    console.log(`✅ Found ${posts.length} featured blog posts:`);
    posts.forEach((post, idx) => {
      console.log(`   ${idx + 1}. ${post.title}`);
    });

    console.log('\n✨ Homepage data is ready!');
    console.log(`\n🌐 Visit: http://localhost:3001 to see the featured content`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testHomepage();
