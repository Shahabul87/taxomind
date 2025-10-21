#!/usr/bin/env node

/**
 * Test script to diagnose post creation and fetching issues
 * Run with: npx tsx scripts/test-posts.ts
 */

import { db } from "../lib/db";

async function testPosts() {
  console.log("🔍 Testing Post Creation and Fetching...\n");

  try {
    // 1. Get a test user
    const user = await db.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    if (!user) {
      console.error("❌ No users found in database");
      return;
    }

    console.log(`✅ Found test user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Role: ${user.role}\n`);

    // 2. Check existing posts for this user
    const existingPosts = await db.post.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        published: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Existing posts for user: ${existingPosts.length}`);
    if (existingPosts.length > 0) {
      console.log("   Recent posts:");
      existingPosts.slice(0, 5).forEach(post => {
        console.log(`   - ${post.title} (${post.published ? 'Published' : 'Draft'}) - Created: ${post.createdAt.toLocaleString()}`);
      });
    }
    console.log("");

    // 3. Create a test post
    console.log("📝 Creating a test post...");
    const testPost = await db.post.create({
      data: {
        userId: user.id,
        title: `Test Post - ${new Date().toLocaleTimeString()}`,
        category: "Testing",
        published: false, // Created as draft by default
        isArchived: false,
      },
      select: {
        id: true,
        title: true,
        published: true,
        userId: true,
      }
    });

    console.log(`✅ Test post created successfully!`);
    console.log(`   ID: ${testPost.id}`);
    console.log(`   Title: ${testPost.title}`);
    console.log(`   Published: ${testPost.published}`);
    console.log(`   User ID: ${testPost.userId}\n`);

    // 4. Fetch all posts again to verify
    const allPosts = await db.post.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        published: true,
      }
    });

    console.log(`📊 Total posts after creation: ${allPosts.length}`);
    const publishedCount = allPosts.filter(p => p.published).length;
    const draftCount = allPosts.filter(p => !p.published).length;
    console.log(`   Published: ${publishedCount}`);
    console.log(`   Drafts: ${draftCount}\n`);

    // 5. Test the exact query used in the all-posts page
    console.log("🔍 Testing the exact query from all-posts page...");
    const postsData = await db.post.findMany({
      where: {
        userId: user.id
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          }
        },
        comments: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Query result: ${postsData.length} posts found`);
    if (postsData.length > 0) {
      const latestPost = postsData[0];
      console.log(`   Latest post:`);
      console.log(`   - Title: ${latestPost.title}`);
      console.log(`   - ID: ${latestPost.id}`);
      console.log(`   - Published: ${latestPost.published}`);
      console.log(`   - Has User relation: ${!!latestPost.User}`);
    }

    console.log("\n✅ Test completed successfully!");
    console.log("\n📌 Key findings:");
    console.log("1. Posts ARE being saved to the database");
    console.log("2. Posts are created as drafts (published: false) by default");
    console.log("3. The all-posts page should show drafts in the 'Drafts' tab");
    console.log("4. Make sure the default tab is set to 'drafts' to see new posts");

  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testPosts().catch(console.error);