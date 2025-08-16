const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment configuration for production issues...\n');

// Check for hardcoded localhost URLs in code
function checkForHardcodedUrls() {
  console.log('📍 Checking for hardcoded localhost URLs...');
  
  const filesToCheck = [
    'routes.ts',
    'middleware.ts',
    'next.config.js',
    'auth.config.ts',
    'auth.ts'
  ];
  
  let foundIssues = false;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for hardcoded localhost
      const localhostMatches = content.match(/localhost:3000/g);
      const httpLocalhostMatches = content.match(/http:\/\/localhost/g);
      
      if (localhostMatches || httpLocalhostMatches) {
        console.log(`❌ Found hardcoded localhost in ${file}:`);
        if (localhostMatches) {
          console.log(`   - "localhost:3000" found ${localhostMatches.length} times`);
        }
        if (httpLocalhostMatches) {
          console.log(`   - "http://localhost" found ${httpLocalhostMatches.length} times`);
        }
        foundIssues = true;
      } else {
        console.log(`✅ ${file} - No hardcoded localhost URLs`);
      }
    }
  });
  
  return foundIssues;
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n🌍 Checking environment variables...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  const optionalEnvVars = [
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'
  ];
  
  console.log('Required environment variables:');
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      // Check if it contains localhost
      if (value.includes('localhost')) {
        console.log(`⚠️  ${envVar}: Set but contains localhost (${value})`);
      } else {
        console.log(`✅ ${envVar}: Set correctly`);
      }
    } else {
      console.log(`❌ ${envVar}: Not set`);
    }
  });
  
  console.log('\nOptional environment variables:');
  optionalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`⚠️  ${envVar}: Not set`);
    }
  });
}

// Check axios configuration
function checkAxiosConfig() {
  console.log('\n🔧 Checking axios configuration...');
  
  // Look for axios.defaults.baseURL or axios.create with baseURL
  const filesToCheck = [
    'lib/axios.ts',
    'lib/api.ts',
    'utils/api.ts',
    'config/api.ts'
  ];
  
  let foundAxiosConfig = false;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('baseURL') || content.includes('axios.defaults')) {
        console.log(`📁 Found axios configuration in ${file}`);
        foundAxiosConfig = true;
        
        // Check if it has hardcoded URLs
        if (content.includes('localhost')) {
          console.log(`❌ Contains hardcoded localhost URL`);
        } else {
          console.log(`✅ No hardcoded URLs found`);
        }
      }
    }
  });
  
  if (!foundAxiosConfig) {
    console.log('✅ No global axios configuration found (using relative URLs)');
  }
}

// Check for relative vs absolute URLs in components
function checkApiCalls() {
  console.log('\n📡 Checking API call patterns...');
  
  // Sample a few key files
  const sampleFiles = [
    'app/(protected)/teacher/courses/[courseId]/_components/description-form.tsx',
    'app/(protected)/teacher/courses/[courseId]/_components/price-form.tsx'
  ];
  
  sampleFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Look for axios calls
      const axiosMatches = content.match(/axios\.(get|post|patch|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g);
      
      if (axiosMatches) {
        console.log(`📁 ${file}:`);
        axiosMatches.forEach(match => {
          const url = match.match(/['"`]([^'"`]+)['"`]/)[1];
          if (url.startsWith('/')) {
            console.log(`   ✅ Relative URL: ${url}`);
          } else if (url.startsWith('http')) {
            console.log(`   ❌ Absolute URL: ${url}`);
          } else {
            console.log(`   ⚠️  Variable URL: ${url}`);
          }
        });
      }
    }
  });
}

// Main execution
function main() {
  const hasHardcodedUrls = checkForHardcodedUrls();
  checkEnvironmentVariables();
  checkAxiosConfig();
  checkApiCalls();
  
  console.log('\n📋 Summary:');
  if (hasHardcodedUrls) {
    console.log('❌ Found hardcoded localhost URLs that need to be fixed');
    console.log('💡 Recommendation: Use environment variables instead');
  } else {
    console.log('✅ No hardcoded localhost URLs found');
  }
  
  console.log('\n🚀 For production deployment:');
  console.log('1. Set NEXT_PUBLIC_APP_URL=https://bdgenai.com');
  console.log('2. Set NEXTAUTH_URL=https://bdgenai.com');
  console.log('3. Ensure DATABASE_URL points to production database');
  console.log('4. Set a strong NEXTAUTH_SECRET');
  console.log('5. Deploy and test API endpoints');
}

main(); 