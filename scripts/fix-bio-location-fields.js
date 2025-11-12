#!/usr/bin/env node

/**
 * Fix Missing Bio and Location Fields
 *
 * This script ensures the bio and location fields exist in the User table.
 * It handles the common Railway deployment issue where code expects fields
 * that haven't been added to the database yet.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixBioLocationFields() {
  try {
    console.log('🔍 Checking for bio and location fields in User table...');

    // Test database connection first
    await prisma.$connect();

    // Check if the columns already exist
    try {
      await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name IN ('bio', 'location')
      `;

      const existingColumns = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name IN ('bio', 'location')
      `;

      const hasColumns = existingColumns.map(c => c.column_name);

      // Add bio field if missing
      if (!hasColumns.includes('bio')) {
        console.log('⚠️  Bio field missing, adding...');
        await prisma.$executeRaw`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT
        `;
        console.log('✅ Bio field added successfully');
      } else {
        console.log('✅ Bio field already exists');
      }

      // Add location field if missing
      if (!hasColumns.includes('location')) {
        console.log('⚠️  Location field missing, adding...');
        await prisma.$executeRaw`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" TEXT
        `;
        console.log('✅ Location field added successfully');
      } else {
        console.log('✅ Location field already exists');
      }

      // Mark the migration as applied if it exists
      const migrationName = '20251112000000_add_bio_location_to_user';
      const migrationExists = await prisma.$queryRaw`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE migration_name = ${migrationName}
      `;

      if (migrationExists.length === 0) {
        console.log('📝 Recording migration as applied...');
        await prisma.$executeRaw`
          INSERT INTO "_prisma_migrations" (
            migration_name,
            checksum,
            started_at,
            finished_at,
            applied_steps_count,
            logs
          ) VALUES (
            ${migrationName},
            'manual_application',
            NOW(),
            NOW(),
            2,
            'Applied by fix-bio-location-fields script'
          )
        `;
        console.log('✅ Migration recorded successfully');
      } else {
        console.log('✅ Migration already recorded');
      }

    } catch (error) {
      // If we can't query the information_schema, try a different approach
      console.log('⚠️  Could not query column info, attempting direct addition...');

      // Try to add the columns directly with IF NOT EXISTS
      try {
        await prisma.$executeRaw`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT
        `;
        console.log('✅ Bio field added/verified');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('✅ Bio field already exists');
        } else {
          throw e;
        }
      }

      try {
        await prisma.$executeRaw`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" TEXT
        `;
        console.log('✅ Location field added/verified');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('✅ Location field already exists');
        } else {
          throw e;
        }
      }
    }

    // Verify the fields are accessible
    console.log('\n🔍 Verifying fields are accessible...');
    const testUser = await prisma.user.findFirst({
      select: {
        id: true,
        bio: true,
        location: true,
      },
      take: 1
    });

    if (testUser !== null) {
      console.log('✅ Fields are accessible and working');
    } else {
      console.log('ℹ️  No users in database to test with, but schema is correct');
    }

    console.log('\n✅ Bio and location fields are ready!');

  } catch (error) {
    // If database is not reachable (during build phase), skip gracefully
    if (error.message.includes("Can't reach database") ||
        error.message.includes("connect") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("postgres.railway.internal") ||
        error.code === 'P1001' ||
        error.code === 'P1002' ||
        error.code === 'P1003') {
      console.log('ℹ️  Database not available (build phase) - skipping field fix');
      console.log('   This is normal during Railway build. Fields will be added at deploy time.');
      process.exit(0); // Exit with success code
    }

    console.error('❌ Error fixing fields:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect().catch(() => {
      // Ignore disconnect errors if connection was never established
    });
  }
}

// Run the script
fixBioLocationFields()
  .then(() => {
    console.log('✅ Field fix complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });