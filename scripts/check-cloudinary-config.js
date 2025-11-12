#!/usr/bin/env node

/**
 * Cloudinary Configuration Check
 *
 * This script validates that all required Cloudinary environment variables
 * are properly configured for production deployment.
 */

const required = [
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const warnings = [];
const errors = [];

console.log('\n🔍 Checking Cloudinary Configuration...\n');
console.log('=' .repeat(50));

// Check required variables
required.forEach(key => {
  const value = process.env[key];

  if (!value) {
    errors.push(`❌ Missing: ${key}`);
  } else if (value.includes('your_') || value.includes('_here')) {
    warnings.push(`⚠️  Placeholder value detected: ${key} = "${value}"`);
  } else {
    console.log(`✅ ${key}: Set (${value.substring(0, 4)}...)`);
  }
});

// Check for legacy/incorrect variable names
const legacyVars = [
  'CLOUDINARY_CLOUD_NAME', // Should be NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  'CLOUDINARY_URL'
];

legacyVars.forEach(key => {
  if (process.env[key]) {
    warnings.push(`⚠️  Legacy variable detected: ${key} (use NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME instead)`);
  }
});

// Check if cloud name matches expected format
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
if (cloudName) {
  if (!/^[a-z0-9]+$/.test(cloudName)) {
    warnings.push(`⚠️  Cloud name contains special characters: "${cloudName}"`);
  }

  // Log the expected Cloudinary domain
  console.log(`\n📍 Expected Cloudinary domain: https://res.cloudinary.com/${cloudName}/`);
  console.log(`   Alternative domain: https://${cloudName}.cloudinary.com/`);
}

// Print results
console.log('\n' + '='.repeat(50));

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:\n');
  errors.forEach(error => console.log('   ' + error));
  console.log('\n⚠️  Your Cloudinary configuration is incomplete!');
  console.log('   Images will not upload or display properly.\n');

  console.log('📝 Required in .env.production:');
  console.log('   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name');
  console.log('   CLOUDINARY_API_KEY=your_actual_api_key');
  console.log('   CLOUDINARY_API_SECRET=your_actual_api_secret\n');

  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach(warning => console.log('   ' + warning));
  console.log('\n');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ Cloudinary configuration looks good!\n');

  console.log('📋 Configuration Summary:');
  console.log(`   Cloud Name: ${cloudName}`);
  console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY?.substring(0, 6)}...`);
  console.log(`   Primary Domain: https://res.cloudinary.com/${cloudName}/`);
  console.log(`   Upload Preset: bdgenai_upload (if configured)\n`);
}

console.log('💡 Tips:');
console.log('   1. Ensure these variables are set in Railway/Vercel/your hosting platform');
console.log('   2. The cloud name must match exactly (case-sensitive)');
console.log('   3. Check next.config.js has the correct domain in remotePatterns');
console.log('   4. Test uploads work in development before deploying\n');

process.exit(errors.length > 0 ? 1 : 0);