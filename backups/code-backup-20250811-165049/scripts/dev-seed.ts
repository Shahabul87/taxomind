// scripts/dev-seed.ts
const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Seeding development database...");

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      console.log("❌ This script only runs in development environment");
      return;
    }

    // Clear existing data (safe in development only)
    console.log("🗑️ Clearing existing data...");
    await database.user.deleteMany({});
    await database.course.deleteMany({});
    await database.category.deleteMany({});

    console.log("✅ Cleared existing data");

    // Seed categories
    const categories = await database.category.createMany({
      data: [
        { name: "Computer Science" },
        { name: "Artificial Intelligence" },
        { name: "Data Science" },
        { name: "Machine Learning" },
        { name: "Web Development" },
        { name: "Mobile Development" },
        { name: "Cybersecurity" },
        { name: "Mathematics" },
        { name: "Physics" },
        { name: "Psychology" },
        { name: "Philosophy" },
        { name: "Business" },
        { name: "Design" },
        { name: "Photography" },
        { name: "Music" },
        { name: "Accounting" },
        { name: "Engineering" },
        { name: "Filming" },
        { name: "Chemistry" },
        { name: "Biology" },
        { name: "Literature" },
        { name: "History" },
        { name: "Economics" },
        { name: "Political Science" },
        { name: "Sociology" },
        { name: "Environmental Science" },
        { name: "Art History" },
        { name: "Graphic Design" },
        { name: "Culinary Arts" },
        { name: "Fashion Design" },
      ]
    });

    console.log(`✅ Created ${categories.count} categories`);

    // Create development users with hashed passwords
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 12);

    const devUsers = await database.user.createMany({
      data: [
        {
          name: "Dev Teacher",
          email: "teacher@dev.local",
          role: "TEACHER",
          emailVerified: new Date(),
          password: hashedPassword,
        },
        {
          name: "Dev Student",
          email: "student@dev.local",
          role: "STUDENT", 
          emailVerified: new Date(),
          password: hashedPassword,
        },
        {
          name: "Dev Admin",
          email: "admin@dev.local",
          role: "ADMIN",
          emailVerified: new Date(),
          password: hashedPassword,
        },
        {
          name: "John Doe",
          email: "john@dev.local",
          role: "TEACHER",
          emailVerified: new Date(),
          password: hashedPassword,
        },
        {
          name: "Jane Smith",
          email: "jane@dev.local",
          role: "STUDENT",
          emailVerified: new Date(),
          password: hashedPassword,
        }
      ]
    });

    console.log(`✅ Created ${devUsers.count} development users`);
    console.log(`📧 Login credentials: email: teacher@dev.local, password: password123`);

    // Get created teacher for course creation
    const teacher = await database.user.findFirst({
      where: { email: "teacher@dev.local" }
    });

    const aiCategory = await database.category.findFirst({
      where: { name: "Artificial Intelligence" }
    });

    const webDevCategory = await database.category.findFirst({
      where: { name: "Web Development" }
    });

    // Create sample courses
    if (teacher && aiCategory && webDevCategory) {
      const courses = await database.course.createMany({
        data: [
          {
            userId: teacher.id,
            title: "Introduction to AI & Machine Learning",
            description: "Learn the fundamentals of AI and ML with hands-on projects using Python, TensorFlow, and real-world datasets.",
            imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
            price: 99.99,
            isPublished: true,
            categoryId: aiCategory.id,
          },
          {
            userId: teacher.id,
            title: "Full Stack Web Development with Next.js",
            description: "Master modern web development with Next.js, React, TypeScript, and deployment strategies.",
            imageUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
            price: 149.99,
            isPublished: true,
            categoryId: webDevCategory.id,
          },
          {
            userId: teacher.id,
            title: "Advanced Neural Networks",
            description: "Deep dive into neural network architectures, backpropagation, and advanced optimization techniques.",
            imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
            price: 199.99,
            isPublished: false, // Draft course
            categoryId: aiCategory.id,
          }
        ]
      });

      console.log(`✅ Created ${courses.count} sample courses`);
    }

    console.log("🎉 Development database seeded successfully!");
    console.log("\n📝 Summary:");
    console.log("- 30 course categories");
    console.log("- 5 test users (teacher@dev.local, student@dev.local, etc.)");
    console.log("- 3 sample courses");
    console.log("- Default password for all users: password123");
    console.log("\n🚀 Start development: npm run dev");

  } catch (error) {
    console.error("❌ Error seeding development database:", error);
  } finally {
    await database.$disconnect();
  }
}

main();