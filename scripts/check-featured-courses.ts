import { db } from '../lib/db';

async function checkFeaturedCourses() {
  try {
    console.log('🔍 Checking featured courses in database...\n');

    // Total courses
    const totalCourses = await db.course.count();
    console.log(`📊 Total courses: ${totalCourses}`);

    // Published courses
    const publishedCourses = await db.course.count({
      where: { isPublished: true }
    });
    console.log(`✅ Published courses: ${publishedCourses}`);

    // Featured courses
    const featuredCourses = await db.course.count({
      where: { isPublished: true, isFeatured: true }
    });
    console.log(`⭐ Featured courses: ${featuredCourses}\n`);

    // Get featured courses details
    if (featuredCourses > 0) {
      const courses = await db.course.findMany({
        where: { isPublished: true, isFeatured: true },
        select: {
          id: true,
          title: true,
          isPublished: true,
          isFeatured: true,
          imageUrl: true,
          price: true,
        },
        take: 10,
      });

      console.log('Featured courses found:');
      courses.forEach((course, idx) => {
        console.log(`  ${idx + 1}. ${course.title} (${course.price ? '$' + course.price : 'Free'})`);
      });
    } else {
      console.log('⚠️  NO FEATURED COURSES FOUND!');
      console.log('\nTo fix this, you need to:');
      console.log('1. Create courses in the admin panel');
      console.log('2. Mark them as "Published"');
      console.log('3. Mark them as "Featured"');
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkFeaturedCourses();
