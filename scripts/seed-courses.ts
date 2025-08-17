#!/usr/bin/env ts-node

import { db } from "../lib/db";
import { logger } from "../lib/logger";
import process from "process";

const courseData = [
  {
    title: "Complete Web Development Bootcamp",
    subtitle: "Master HTML, CSS, JavaScript, React, Node.js and More",
    description: "Learn web development from scratch. This comprehensive course covers everything you need to become a full-stack web developer.",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    price: 89.99,
    level: "Beginner",
    duration: "60 hours",
    skills: "HTML,CSS,JavaScript,React,Node.js,MongoDB",
    certificateOffered: true,
    difficulty: 2,
    isFeatured: true,
    category: "Web Development"
  },
  {
    title: "Machine Learning A-Z",
    subtitle: "Complete Guide to Machine Learning with Python",
    description: "Master Machine Learning on Python & R. Make accurate predictions, build robust machine learning models, and use them in real-world projects.",
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
    price: 99.99,
    level: "Intermediate",
    duration: "45 hours",
    skills: "Python,TensorFlow,Scikit-Learn,Neural Networks,Deep Learning",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: true,
    category: "Data Science"
  },
  {
    title: "React Native Mobile Development",
    subtitle: "Build iOS and Android Apps with React Native",
    description: "Learn to build native mobile apps for iOS and Android using React Native, Redux, and modern JavaScript.",
    imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
    price: 79.99,
    level: "Intermediate",
    duration: "35 hours",
    skills: "React Native,Redux,JavaScript,Mobile Development,Firebase",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: false,
    category: "Mobile Development"
  },
  {
    title: "Python for Data Science",
    subtitle: "Complete Python Programming for Data Analysis",
    description: "Learn Python programming with a focus on data science. Master pandas, NumPy, Matplotlib, and more.",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    price: 69.99,
    level: "Beginner",
    duration: "40 hours",
    skills: "Python,Pandas,NumPy,Matplotlib,Data Analysis",
    certificateOffered: true,
    difficulty: 2,
    isFeatured: false,
    category: "Programming"
  },
  {
    title: "AWS Cloud Architect Certification",
    subtitle: "Prepare for AWS Solutions Architect Certification",
    description: "Master AWS cloud services and prepare for the AWS Solutions Architect certification exam.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    price: 119.99,
    level: "Advanced",
    duration: "50 hours",
    skills: "AWS,Cloud Computing,DevOps,Security,Architecture",
    certificateOffered: true,
    difficulty: 4,
    isFeatured: true,
    category: "Cloud Computing"
  },
  {
    title: "TypeScript Complete Guide",
    subtitle: "Master TypeScript for Large-Scale Applications",
    description: "Learn TypeScript from basics to advanced concepts. Build type-safe applications with confidence.",
    imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
    price: 59.99,
    level: "Intermediate",
    duration: "25 hours",
    skills: "TypeScript,JavaScript,React,Node.js,Type Safety",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: false,
    category: "Programming"
  },
  {
    title: "Docker & Kubernetes Mastery",
    subtitle: "Container Orchestration for DevOps",
    description: "Master containerization with Docker and orchestration with Kubernetes for modern application deployment.",
    imageUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800",
    price: 89.99,
    level: "Intermediate",
    duration: "30 hours",
    skills: "Docker,Kubernetes,DevOps,CI/CD,Microservices",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: false,
    category: "DevOps"
  },
  {
    title: "Blockchain Development Fundamentals",
    subtitle: "Build Decentralized Applications with Ethereum",
    description: "Learn blockchain technology and build decentralized applications (DApps) on the Ethereum platform.",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
    price: 109.99,
    level: "Advanced",
    duration: "45 hours",
    skills: "Blockchain,Ethereum,Solidity,Smart Contracts,Web3",
    certificateOffered: true,
    difficulty: 4,
    isFeatured: false,
    category: "Blockchain"
  }
];

async function seedCourses() {
  try {
    console.log("🌱 Starting courses seeding...");

    // First, check if we have an admin user
    const adminUser = await db.user.findFirst({
      where: {
        email: "admin@example.com"
      }
    });

    if (!adminUser) {
      console.error("❌ Admin user not found. Please run create-test-user.ts first");
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser!.email}`);

    // Create or find categories
    const categoryMap: { [key: string]: string } = {};
    const categoryNames = [...new Set(courseData.map(c => c.category))];

    for (const categoryName of categoryNames) {
      let category = await db.category.findFirst({
        where: { name: categoryName }
      });

      if (!category) {
        category = await db.category.create({
          data: { name: categoryName }
        });
        console.log(`✅ Created category: ${categoryName}`);
      }

      categoryMap[categoryName] = category.id;
    }

    // Create courses
    for (const course of courseData) {
      const existingCourse = await db.course.findFirst({
        where: {
          title: course.title
        }
      });

      if (existingCourse) {
        console.log(`⏭️  Course already exists: ${course.title}`);
        continue;
      }

      const newCourse = await db.course.create({
        data: {
          userId: adminUser!.id,
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          cleanDescription: course.description.substring(0, 150) + '...',
          imageUrl: course.imageUrl,
          price: course.price,
          isFeatured: course.isFeatured,
          isPublished: true,
          categoryId: categoryMap[course.category],
          whatYouWillLearn: course.skills.split(',').map(s => s.trim())
        }
      });

      console.log(`✅ Created course: ${newCourse.title}`);

      // Add some sample chapters
      const chapterCount = Math.floor(Math.random() * 5) + 5; // 5-10 chapters
      for (let i = 0; i < chapterCount; i++) {
        await db.chapter.create({
          data: {
            courseId: newCourse.id,
            title: `Chapter ${i + 1}: ${['Introduction', 'Basics', 'Advanced Topics', 'Best Practices', 'Project Work', 'Testing', 'Deployment', 'Optimization', 'Security', 'Final Project'][i] || 'Additional Content'}`,
            description: `Learn important concepts in chapter ${i + 1}`,
            position: i,
            isPublished: true,
            isFree: i === 0 // First chapter is free
          }
        });
      }
      console.log(`   📚 Added ${chapterCount} chapters`);

      // Add some sample reviews
      const reviewCount = Math.floor(Math.random() * 3) + 2; // 2-5 reviews
      let totalRating = 0;
      for (let i = 0; i < reviewCount; i++) {
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
        totalRating += rating;
        await db.courseReview.create({
          data: {
            courseId: newCourse.id,
            userId: adminUser!.id,
            rating,
            comment: `Great course! Really helped me understand the concepts.`
          }
        });
      }
      console.log(`   ⭐ Added ${reviewCount} reviews (avg: ${(totalRating/reviewCount).toFixed(1)})`);
    }

    console.log("\n✨ Courses seeding completed successfully!");
    console.log(`📊 Total courses created: ${courseData.length}`);
    console.log("\n🌐 You can now visit http://localhost:3001/courses to see the courses");

  } catch (error) {
    console.error("❌ Error seeding courses:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seedCourses().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});