import { db } from '../lib/db';

async function markCoursesAsFeatured() {
  try {
    console.log('🔧 Marking published courses as featured...\n');

    // Get all published courses
    const publishedCourses = await db.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        isFeatured: true,
      },
    });

    console.log(`Found ${publishedCourses.length} published courses\n`);

    // Mark all published courses as featured
    const result = await db.course.updateMany({
      where: { isPublished: true },
      data: { isFeatured: true },
    });

    console.log(`✅ Successfully marked ${result.count} courses as featured!\n`);

    // Verify the update
    const featuredCourses = await db.course.findMany({
      where: { isPublished: true, isFeatured: true },
      select: {
        id: true,
        title: true,
        price: true,
        imageUrl: true,
      },
    });

    console.log('Featured courses now in database:');
    featuredCourses.forEach((course, idx) => {
      console.log(`  ${idx + 1}. ${course.title} (${course.price ? '$' + course.price : 'Free'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

markCoursesAsFeatured();
