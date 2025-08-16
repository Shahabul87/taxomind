const fs = require('fs');
const path = require('path');

// Function to recursively find all route.ts files in the api directory
function findApiRoutes(dir, routes = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findApiRoutes(filePath, routes);
    } else if (file === 'route.ts') {
      routes.push(filePath);
    }
  }
  
  return routes;
}

// Function to check if a file has runtime configuration
function hasRuntimeConfig(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes("export const runtime = 'nodejs'");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function checkRuntimeConfig() {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  
  if (!fs.existsSync(apiDir)) {
    console.error('API directory not found:', apiDir);
    return;
  }
  
  const apiRoutes = findApiRoutes(apiDir);
  
  console.log('🔍 Checking API routes for Node.js runtime configuration...\n');
  
  const withRuntime = [];
  const withoutRuntime = [];
  
  for (const route of apiRoutes) {
    const relativePath = path.relative(process.cwd(), route);
    
    if (hasRuntimeConfig(route)) {
      withRuntime.push(relativePath);
    } else {
      withoutRuntime.push(relativePath);
    }
  }
  
  console.log('✅ API routes WITH Node.js runtime configuration:');
  if (withRuntime.length === 0) {
    console.log('   None found');
  } else {
    withRuntime.forEach(route => console.log(`   ${route}`));
  }
  
  console.log('\n❌ API routes WITHOUT Node.js runtime configuration:');
  if (withoutRuntime.length === 0) {
    console.log('   None found - All routes are properly configured! 🎉');
  } else {
    withoutRuntime.forEach(route => console.log(`   ${route}`));
    
    console.log('\n💡 To fix these routes, add the following line after the imports:');
    console.log("   export const runtime = 'nodejs';");
  }
  
  console.log(`\n📊 Summary: ${withRuntime.length} configured, ${withoutRuntime.length} missing configuration`);
  
  if (withoutRuntime.length > 0) {
    console.log('\n⚠️  Routes without runtime configuration may fail in production!');
    process.exit(1);
  } else {
    console.log('\n🎉 All API routes are properly configured for production!');
  }
}

// Run the check
checkRuntimeConfig(); 