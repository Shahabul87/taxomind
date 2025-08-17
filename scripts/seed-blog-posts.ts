#!/usr/bin/env ts-node

import { db } from "../lib/db";
import { logger } from "../lib/logger";
import process from "process";

const categories = [
  "Web Development",
  "Data Science", 
  "Mobile Development",
  "DevOps",
  "Machine Learning",
  "Cloud Computing",
  "AI & Automation",
  "Programming"
];

const blogPosts = [
  {
    title: "Getting Started with Next.js 15",
    description: "Learn the fundamentals of Next.js 15 and how to build modern web applications with the latest features.",
    category: "Web Development",
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    views: 2500
  },
  {
    title: "Machine Learning for Beginners",
    description: "A comprehensive guide to understanding machine learning concepts and getting started with your first ML project.",
    category: "Machine Learning",
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
    views: 3200
  },
  {
    title: "Building Scalable APIs with Node.js",
    description: "Best practices for creating RESTful APIs that can handle millions of requests efficiently.",
    category: "Web Development",
    imageUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
    views: 1850
  },
  {
    title: "Introduction to Python Data Analysis",
    description: "Master data analysis with Python using pandas, NumPy, and visualization libraries.",
    category: "Data Science",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    views: 4100
  },
  {
    title: "Docker and Kubernetes Essentials",
    description: "Learn containerization and orchestration for modern application deployment.",
    category: "DevOps",
    imageUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800",
    views: 2750
  },
  {
    title: "React Native: Build Cross-Platform Apps",
    description: "Create native mobile applications for iOS and Android using React Native framework.",
    category: "Mobile Development",
    imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
    views: 1950
  },
  {
    title: "AWS Cloud Architecture Best Practices",
    description: "Design and implement scalable, secure cloud solutions on Amazon Web Services.",
    category: "Cloud Computing",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    views: 3500
  },
  {
    title: "TypeScript Advanced Patterns",
    description: "Deep dive into advanced TypeScript features and design patterns for enterprise applications.",
    category: "Programming",
    imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
    views: 2200
  },
  {
    title: "Building AI-Powered Applications",
    description: "Integrate artificial intelligence and machine learning into your applications effectively.",
    category: "AI & Automation",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    views: 5200
  },
  {
    title: "GraphQL vs REST: Making the Right Choice",
    description: "Compare GraphQL and REST APIs to determine the best approach for your project.",
    category: "Web Development",
    imageUrl: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800",
    views: 1650
  },
  {
    title: "Microservices Architecture Guide",
    description: "Learn how to design, build, and deploy microservices-based applications.",
    category: "DevOps",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    views: 2900
  },
  {
    title: "Flutter for Web Development",
    description: "Build beautiful, responsive web applications using Flutter framework.",
    category: "Mobile Development",
    imageUrl: "https://images.unsplash.com/photo-1617042375876-a13e36732a04?w=800",
    views: 1750
  }
];

async function seedBlogPosts() {
  try {
    console.log("🌱 Starting blog posts seeding...");

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

    // Create blog posts
    for (const postData of blogPosts) {
      const existingPost = await db.post.findFirst({
        where: {
          title: postData.title
        }
      });

      if (existingPost) {
        console.log(`⏭️  Post already exists: ${postData.title}`);
        continue;
      }

      const post = await db.post.create({
        data: {
          userId: adminUser!.id,
          title: postData.title,
          description: postData.description,
          category: postData.category,
          imageUrl: postData.imageUrl,
          views: postData.views,
          published: true,
          isArchived: false
        }
      });

      console.log(`✅ Created post: ${post.title}`);

      // Add some sample comments
      const commentCount = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < commentCount; i++) {
        await db.comment.create({
          data: {
            postId: post.id,
            userId: adminUser!.id,
            content: `This is a sample comment ${i + 1} for the post "${post.title}".`
          }
        });
      }
      console.log(`   📝 Added ${commentCount} comments`);
    }

    console.log("\n✨ Blog posts seeding completed successfully!");
    console.log(`📊 Total posts created: ${blogPosts.length}`);
    console.log("\n🌐 You can now visit http://localhost:3000/blog to see the posts");

  } catch (error) {
    console.error("❌ Error seeding blog posts:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seedBlogPosts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});