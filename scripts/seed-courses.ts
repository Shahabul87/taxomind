#!/usr/bin/env ts-node

import { db } from "../lib/db";

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
  },
  // NEW CATEGORIES START HERE
  {
    title: "UI/UX Design Masterclass",
    subtitle: "Create Beautiful and User-Friendly Designs",
    description: "Master the principles of user interface and user experience design. Learn Figma, Adobe XD, and design thinking methodologies.",
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    price: 74.99,
    level: "Beginner",
    duration: "32 hours",
    skills: "Figma,Adobe XD,Design Thinking,Prototyping,User Research",
    certificateOffered: true,
    difficulty: 2,
    isFeatured: true,
    category: "Design"
  },
  {
    title: "Cybersecurity Essentials",
    subtitle: "Protect Systems and Networks from Threats",
    description: "Learn essential cybersecurity concepts, ethical hacking, network security, and how to protect systems from cyber threats.",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
    price: 129.99,
    level: "Intermediate",
    duration: "55 hours",
    skills: "Ethical Hacking,Network Security,Penetration Testing,Cryptography,CISSP",
    certificateOffered: true,
    difficulty: 4,
    isFeatured: true,
    category: "Cybersecurity"
  },
  {
    title: "Digital Marketing Fundamentals",
    subtitle: "Master Modern Marketing Strategies",
    description: "Learn SEO, social media marketing, content marketing, email marketing, and analytics to grow your business online.",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    price: 64.99,
    level: "Beginner",
    duration: "28 hours",
    skills: "SEO,Social Media,Content Marketing,Google Analytics,Email Marketing",
    certificateOffered: true,
    difficulty: 2,
    isFeatured: false,
    category: "Marketing"
  },
  {
    title: "Game Development with Unity",
    subtitle: "Build 2D and 3D Games from Scratch",
    description: "Create professional games using Unity engine and C#. Learn game design, physics, animations, and publish to multiple platforms.",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
    price: 94.99,
    level: "Intermediate",
    duration: "48 hours",
    skills: "Unity,C#,Game Design,3D Modeling,Animation",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: true,
    category: "Game Development"
  },
  {
    title: "Business Analytics with Excel & Power BI",
    subtitle: "Data-Driven Decision Making for Businesses",
    description: "Master business analytics using Excel, Power BI, and SQL. Learn to create dashboards, perform data analysis, and make strategic decisions.",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    price: 79.99,
    level: "Beginner",
    duration: "35 hours",
    skills: "Excel,Power BI,SQL,Data Visualization,Business Intelligence",
    certificateOffered: true,
    difficulty: 2,
    isFeatured: false,
    category: "Business"
  },
  {
    title: "iOS Development with Swift",
    subtitle: "Build Native iPhone and iPad Applications",
    description: "Learn to develop native iOS applications using Swift and SwiftUI. Master the iOS ecosystem and publish apps to the App Store.",
    imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
    price: 89.99,
    level: "Intermediate",
    duration: "42 hours",
    skills: "Swift,SwiftUI,iOS,Xcode,App Store Publishing",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: false,
    category: "Mobile Development"
  },
  {
    title: "Artificial Intelligence & Deep Learning",
    subtitle: "Build Intelligent Systems with Neural Networks",
    description: "Dive deep into artificial intelligence and neural networks. Build chatbots, image recognition systems, and natural language processing applications.",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    price: 139.99,
    level: "Advanced",
    duration: "65 hours",
    skills: "PyTorch,TensorFlow,Neural Networks,NLP,Computer Vision",
    certificateOffered: true,
    difficulty: 5,
    isFeatured: true,
    category: "Artificial Intelligence"
  },
  {
    title: "Photography Masterclass",
    subtitle: "From Beginner to Professional Photographer",
    description: "Master photography fundamentals, composition, lighting, and post-processing. Learn to use professional cameras and editing software.",
    imageUrl: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800",
    price: 69.99,
    level: "Beginner",
    duration: "30 hours",
    skills: "Photography,Lightroom,Photoshop,Composition,Lighting",
    certificateOffered: true,
    difficulty: 2,
    isFeatured: false,
    category: "Creative Arts"
  },
  {
    title: "Project Management Professional (PMP)",
    subtitle: "Become a Certified Project Manager",
    description: "Prepare for PMP certification. Learn project management methodologies, Agile, Scrum, risk management, and leadership skills.",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
    price: 149.99,
    level: "Intermediate",
    duration: "50 hours",
    skills: "PMP,Agile,Scrum,Risk Management,Leadership",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: true,
    category: "Project Management"
  },
  {
    title: "Ethical Hacking & Penetration Testing",
    subtitle: "Learn to Think Like a Hacker",
    description: "Master ethical hacking techniques, penetration testing, vulnerability assessment, and security auditing. Prepare for CEH certification.",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    price: 139.99,
    level: "Advanced",
    duration: "60 hours",
    skills: "Kali Linux,Metasploit,Wireshark,CEH,Security Auditing",
    certificateOffered: true,
    difficulty: 4,
    isFeatured: true,
    category: "Cybersecurity"
  },
  {
    title: "Financial Modeling & Valuation",
    subtitle: "Master Corporate Finance and Investment Analysis",
    description: "Learn financial modeling, company valuation, investment banking techniques, and Excel modeling for financial analysis.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    price: 119.99,
    level: "Advanced",
    duration: "45 hours",
    skills: "Financial Modeling,Excel,Valuation,Investment Banking,DCF",
    certificateOffered: true,
    difficulty: 4,
    isFeatured: false,
    category: "Finance"
  },
  {
    title: "3D Animation with Blender",
    subtitle: "Create Stunning 3D Models and Animations",
    description: "Master Blender for 3D modeling, texturing, rigging, and animation. Create professional 3D content for games, films, and visualization.",
    imageUrl: "https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=800",
    price: 84.99,
    level: "Intermediate",
    duration: "40 hours",
    skills: "Blender,3D Modeling,Animation,Texturing,Rendering",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: false,
    category: "Creative Arts"
  },
  {
    title: "Full-Stack JavaScript Development",
    subtitle: "Build Complete Web Applications with MERN Stack",
    description: "Master MongoDB, Express.js, React, and Node.js. Build and deploy full-stack applications from scratch.",
    imageUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
    price: 99.99,
    level: "Intermediate",
    duration: "55 hours",
    skills: "MongoDB,Express.js,React,Node.js,REST API",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: true,
    category: "Web Development"
  },
  {
    title: "Cloud Computing with Azure",
    subtitle: "Microsoft Azure Administrator Certification Path",
    description: "Learn Microsoft Azure cloud services, virtual machines, storage, networking, and prepare for AZ-104 certification.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    price: 124.99,
    level: "Intermediate",
    duration: "48 hours",
    skills: "Azure,Cloud Computing,Virtual Machines,Networking,AZ-104",
    certificateOffered: true,
    difficulty: 3,
    isFeatured: false,
    category: "Cloud Computing"
  },
  {
    title: "Data Engineering with Apache Spark",
    subtitle: "Build Large-Scale Data Processing Pipelines",
    description: "Master big data processing with Apache Spark, Hadoop, and Kafka. Learn to build scalable data pipelines and ETL processes.",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    price: 109.99,
    level: "Advanced",
    duration: "50 hours",
    skills: "Apache Spark,Hadoop,Kafka,Python,Big Data",
    certificateOffered: true,
    difficulty: 4,
    isFeatured: false,
    category: "Data Engineering"
  },
  {
    title: "Product Management Essentials",
    subtitle: "From Idea to Launch - Complete Product Lifecycle",
    description: "Learn product strategy, roadmap planning, user research, agile methodologies, and how to launch successful products.",
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800",
    price: 89.99,
    level: "Beginner",
    duration: "35 hours",
    skills: "Product Strategy,User Research,Agile,Roadmapping,Analytics",
    certificateOffered: true,
    difficulty: 2,
    isFeatured: true,
    category: "Product Management"
  }
];

async function seedCourses() {
  try {
    console.log("🌱 Starting courses seeding...");

    // First, check if we have an admin user
    const adminUser = await db.user.findFirst({
      where: {
        role: "ADMIN"
      }
    });

    if (!adminUser) {
      console.error("❌ Admin user not found. Please run create-test-user.ts first");
      throw new Error("Admin user not found");
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
    throw error;
  } finally {
    await db.$disconnect();
  }
}

seedCourses().catch((error) => {
  console.error("Fatal error:", error);
  throw error;
});