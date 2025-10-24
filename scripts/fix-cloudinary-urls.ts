import { db } from '../lib/db';

async function fixCloudinaryURLs() {
  try {
    console.log('🔧 Fixing HTTP Cloudinary URLs to HTTPS...\n');

    // Find courses with HTTP cloudinary URLs
    const coursesWithHttp = await db.course.findMany({
      where: {
        imageUrl: {
          startsWith: 'http://res.cloudinary.com'
        }
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
      },
    });

    console.log(`Found ${coursesWithHttp.length} courses with HTTP Cloudinary URLs\n`);

    if (coursesWithHttp.length === 0) {
      console.log('✅ All Cloudinary URLs are already HTTPS!');
      return;
    }

    // Update each course
    for (const course of coursesWithHttp) {
      const newUrl = course.imageUrl?.replace('http://', 'https://');

      console.log(`Updating: ${course.title}`);
      console.log(`  Old: ${course.imageUrl}`);
      console.log(`  New: ${newUrl}\n`);

      await db.course.update({
        where: { id: course.id },
        data: { imageUrl: newUrl },
      });
    }

    console.log(`✅ Successfully updated ${coursesWithHttp.length} course image URLs to HTTPS!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

fixCloudinaryURLs();
