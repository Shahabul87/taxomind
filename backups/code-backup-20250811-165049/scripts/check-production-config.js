#!/usr/bin/env node

/**
 * Production Configuration Checker
 * Validates environment-specific settings for bdGenAI
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Production Configuration...\n');

// Check required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET', 
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL'
];

const missingEnvVars = [];
const presentEnvVars = [];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    presentEnvVars.push(envVar);
  } else {
    missingEnvVars.push(envVar);
  }
});

// Check Next.js config
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
let nextConfigContent = '';

try {
  nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read next.config.js');
  process.exit(1);
}

// Check for serverActions allowedOrigins
const hasLocalhostOnly = nextConfigContent.includes("allowedOrigins: ['localhost:3000']");
const hasProductionOrigins = nextConfigContent.includes('bdgenai.com');

console.log('📋 Environment Variables Status:');
console.log('✅ Present:', presentEnvVars.join(', ') || 'None');
if (missingEnvVars.length > 0) {
  console.log('❌ Missing:', missingEnvVars.join(', '));
}

console.log('\n🔧 Next.js Configuration:');
if (hasLocalhostOnly) {
  console.log('❌ Server Actions only allow localhost - this will break production!');
} else if (hasProductionOrigins) {
  console.log('✅ Server Actions include production domains');
} else {
  console.log('⚠️  Server Actions configuration unclear');
}

// Check for runtime exports in API routes
const apiPath = path.join(process.cwd(), 'app/api');
const chaptersApiPath = path.join(apiPath, 'courses/[courseId]/chapters/route.ts');

try {
  const chaptersContent = fs.readFileSync(chaptersApiPath, 'utf8');
  if (chaptersContent.includes("export const runtime = 'nodejs'")) {
    console.log('✅ Chapters API uses Node.js runtime');
  } else {
    console.log('⚠️  Chapters API might be using Edge Runtime (could cause bcrypt issues)');
  }
} catch (error) {
  console.log('❌ Could not check chapters API configuration');
}

console.log('\n🎯 Production Checklist:');
console.log('- [ ] NEXTAUTH_URL set to https://www.bdgenai.com');
console.log('- [ ] NEXTAUTH_SECRET is a secure random string');
console.log('- [ ] DATABASE_URL points to production database');
console.log('- [ ] Server Actions allow production domains');
console.log('- [ ] API routes use Node.js runtime where needed');

if (missingEnvVars.length > 0 || hasLocalhostOnly) {
  console.log('\n❌ Configuration issues found that will cause production failures!');
  process.exit(1);
} else {
  console.log('\n✅ Configuration looks good for production!');
} 