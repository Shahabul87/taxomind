/**
 * Development Database Seed Script
 * 
 * SIMPLE AUTHENTICATION STRUCTURE:
 * - ADMIN: Platform administrators (manage everything)
 * - USER: Regular users (students, teachers, etc.)
 * 
 * No complex role hierarchies - just two clear levels
 */

import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding development database with simple role structure...");

  try {
    // Clear existing data
    console.log("🗑️ Clearing existing data...");
    
    // Delete in correct order to respect foreign key constraints
    await prisma.enrollment.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.stripeCustomer.deleteMany();
    await prisma.userSubscription.deleteMany();
    await prisma.post.deleteMany();
    await prisma.course.deleteMany();
    await prisma.category.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.twoFactorConfirmation.deleteMany();
    await prisma.twoFactorToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    console.log("✅ Cleared existing data");

    // Create categories
    console.log("📚 Creating categories...");
    const categories = [
      // Main categories
      { name: "Web Development" },
      { name: "Mobile Development" },
      { name: "Data Science" },
      { name: "Machine Learning" },
      { name: "Cloud Computing" },
      { name: "DevOps" },
      { name: "Cybersecurity" },
      { name: "UI/UX Design" },
      { name: "Database" },
      { name: "Programming Languages" },
    ];

    await prisma.category.createMany({
      data: categories,
    });
    console.log(`✅ Created ${categories.length} categories`);

    // Create simple user structure
    console.log("👥 Creating users with simple roles...");
    
    const defaultPassword = await hash("password123", 12);

    // ========================================
    // ADMIN USERS (Platform Administrators)
    // ========================================
    const adminUsers = [
      {
        id: "admin001",
        email: "admin@taxomind.com",
        name: "Platform Admin",
        role: UserRole.ADMIN,
        password: defaultPassword,
        emailVerified: new Date(),
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      },
      {
        id: "admin002",
        email: "superadmin@taxomind.com",
        name: "Super Admin",
        role: UserRole.ADMIN,
        password: defaultPassword,
        emailVerified: new Date(),
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin",
      },
    ];

    for (const admin of adminUsers) {
      await prisma.user.create({ data: admin });
    }
    console.log(`✅ Created ${adminUsers.length} ADMIN users`);

    // ========================================
    // REGULAR USERS (Students, Teachers, etc.)
    // ========================================
    const regularUsers = [
      // Teachers (still USER role, but with teaching capability)
      {
        id: "user001",
        email: "john.teacher@taxomind.com",
        name: "John Teacher",
        role: UserRole.USER,
        password: defaultPassword,
        emailVerified: new Date(),
        isTeacher: true,
        teacherActivatedAt: new Date(),
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      },
      {
        id: "user002",
        email: "sarah.instructor@taxomind.com",
        name: "Sarah Instructor",
        role: UserRole.USER,
        password: defaultPassword,
        emailVerified: new Date(),
        isTeacher: true,
        teacherActivatedAt: new Date(),
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      },
      
      // Students (regular users)
      {
        id: "user003",
        email: "alice.student@taxomind.com",
        name: "Alice Student",
        role: UserRole.USER,
        password: defaultPassword,
        emailVerified: new Date(),
        isTeacher: false,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      },
      {
        id: "user004",
        email: "bob.learner@taxomind.com",
        name: "Bob Learner",
        role: UserRole.USER,
        password: defaultPassword,
        emailVerified: new Date(),
        isTeacher: false,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      },
      {
        id: "user005",
        email: "charlie.user@taxomind.com",
        name: "Charlie User",
        role: UserRole.USER,
        password: defaultPassword,
        emailVerified: new Date(),
        isTeacher: false,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
      },
      
      // Affiliate users (still USER role)
      {
        id: "user006",
        email: "david.affiliate@taxomind.com",
        name: "David Affiliate",
        role: UserRole.USER,
        password: defaultPassword,
        emailVerified: new Date(),
        isAffiliate: true,
        affiliateActivatedAt: new Date(),
        affiliateCode: "DAVID2024",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      },
    ];

    for (const user of regularUsers) {
      await prisma.user.create({ data: user });
    }
    console.log(`✅ Created ${regularUsers.length} USER accounts`);

    // Create sample courses by teachers
    console.log("📖 Creating sample courses...");
    
    const webDevCategory = await prisma.category.findFirst({
      where: { name: "Web Development" }
    });

    const mlCategory = await prisma.category.findFirst({
      where: { name: "Machine Learning" }
    });

    const courses = [
      {
        title: "Complete Next.js 15 Masterclass",
        description: "Learn to build production-ready applications with Next.js 15, React, and TypeScript",
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        price: 99.99,
        isPublished: true,
        userId: "user001", // John Teacher
        categoryId: webDevCategory?.id,
      },
      {
        title: "Python for Data Science",
        description: "Master Python programming for data analysis, visualization, and machine learning",
        imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
        price: 79.99,
        isPublished: true,
        userId: "user002", // Sarah Instructor
        categoryId: mlCategory?.id,
      },
      {
        title: "Free Web Development Basics",
        description: "Get started with HTML, CSS, and JavaScript fundamentals",
        imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
        price: 0,
        isPublished: true,
        userId: "user001", // John Teacher
        categoryId: webDevCategory?.id,
      },
    ];

    for (const course of courses) {
      await prisma.course.create({ data: course });
    }
    console.log(`✅ Created ${courses.length} sample courses`);

    // Summary
    console.log("\n🎉 Development database seeded successfully!");
    console.log("\n📝 Summary:");
    console.log("============================================");
    console.log("ADMIN ACCOUNTS (Platform Management):");
    console.log("--------------------------------------------");
    adminUsers.forEach(admin => {
      console.log(`  📧 ${admin.email}`);
      console.log(`     Password: password123`);
      console.log(`     Role: ADMIN (Full platform control)`);
      console.log("");
    });
    
    console.log("USER ACCOUNTS (Regular Platform Users):");
    console.log("--------------------------------------------");
    console.log("Teachers (can create courses):");
    regularUsers.filter(u => u.isTeacher).forEach(teacher => {
      console.log(`  📧 ${teacher.email}`);
      console.log(`     Password: password123`);
      console.log(`     Role: USER with teaching capability`);
    });
    
    console.log("\nStudents (can enroll in courses):");
    regularUsers.filter(u => !u.isTeacher && !u.isAffiliate).forEach(student => {
      console.log(`  📧 ${student.email}`);
      console.log(`     Password: password123`);
      console.log(`     Role: USER (student)`);
    });
    
    console.log("\nAffiliate:");
    regularUsers.filter(u => u.isAffiliate).forEach(affiliate => {
      console.log(`  📧 ${affiliate.email}`);
      console.log(`     Password: password123`);
      console.log(`     Role: USER with affiliate capability`);
      console.log(`     Affiliate Code: ${affiliate.affiliateCode}`);
    });
    
    console.log("\n============================================");
    console.log("🔑 Authentication Flow:");
    console.log("  - ADMIN users → /dashboard/admin");
    console.log("  - USER users → /dashboard");
    console.log("  - Teachers can switch to teacher context");
    console.log("  - Students stay in learning context");
    console.log("============================================");
    
    console.log("\n🚀 Start development: npm run dev");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });