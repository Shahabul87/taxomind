#!/usr/bin/env node

/**
 * Auto-apply authentication guards to API endpoints
 * This script scans for unprotected POST/PUT/PATCH/DELETE endpoints and applies appropriate guards
 */

const fs = require('fs');
const path = require('path');

// Rate limit configurations based on endpoint sensitivity
const RATE_LIMITS = {
  // High security/admin endpoints
  admin: { requests: 10, window: 60000 },
  enterprise: { requests: 15, window: 60000 },
  
  // User content creation
  courses: { requests: 5, window: 60000 },
  posts: { requests: 10, window: 60000 },
  
  // User profile/settings
  users: { requests: 20, window: 60000 },
  
  // AI/SAM endpoints (higher usage)
  sam: { requests: 25, window: 60000 },
  
  // Default for other endpoints
  default: { requests: 30, window: 60000 }
};

function getRateLimit(filePath) {
  if (filePath.includes('/admin/')) return RATE_LIMITS.admin;
  if (filePath.includes('/enterprise/')) return RATE_LIMITS.enterprise;
  if (filePath.includes('/courses/')) return RATE_LIMITS.courses;
  if (filePath.includes('/posts/')) return RATE_LIMITS.posts;
  if (filePath.includes('/users/')) return RATE_LIMITS.users;
  if (filePath.includes('/sam/')) return RATE_LIMITS.sam;
  return RATE_LIMITS.default;
}

function getAuthGuard(filePath, method) {
  // Admin endpoints
  if (filePath.includes('/admin/') || filePath.includes('/enterprise/')) {
    return 'withAdminAuth';
  }
  
  // User ownership endpoints
  if (filePath.includes('/users/[userId]/') && (method === 'PATCH' || method === 'PUT' || method === 'DELETE')) {
    return 'withOwnership';
  }
  
  // Regular authenticated endpoints
  return 'withAuth';
}

function transformEndpoint(content, filePath) {
  let hasChanges = false;
  let newContent = content;
  
  // Check if already using withAuth guards
  if (content.includes('withAuth') || content.includes('withAdminAuth') || content.includes('withOwnership')) {
    console.log(`  ✓ Already protected: ${filePath}`);
    return { content, hasChanges: false };
  }
  
  // Add import if not present
  if (!content.includes("from '@/lib/api/with-api-auth'")) {
    const importMatch = content.match(/^(import.*from.*;\n)+/m);
    if (importMatch) {
      const importSection = importMatch[0];
      if (!content.includes("withAuth")) {
        newContent = newContent.replace(
          importSection,
          importSection + "import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';\n"
        );
        hasChanges = true;
      }
    }
  }
  
  // Transform write methods
  const writeMethodsRegex = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/g;
  let match;
  const methods = [];
  
  while ((match = writeMethodsRegex.exec(content)) !== null) {
    methods.push({
      method: match[1],
      fullMatch: match[0],
      index: match.index
    });
  }
  
  if (methods.length === 0) {
    console.log(`  ○ No write methods found: ${filePath}`);
    return { content, hasChanges: false };
  }
  
  // Transform each method
  methods.reverse().forEach(({ method, fullMatch, index }) => {
    const guard = getAuthGuard(filePath, method);
    const rateLimit = getRateLimit(filePath);
    
    // Find the function body
    const beforeFunction = newContent.substring(0, index);
    const afterFunction = newContent.substring(index);
    
    // Extract the entire function
    let braceCount = 0;
    let functionEnd = index;
    let inFunction = false;
    
    for (let i = index; i < newContent.length; i++) {
      if (newContent[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (newContent[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          functionEnd = i + 1;
          break;
        }
      }
    }
    
    const originalFunction = newContent.substring(index, functionEnd);
    
    // Create the transformed function
    let transformedFunction;
    
    if (guard === 'withOwnership') {
      // Special handling for ownership validation
      transformedFunction = `export const ${method} = withOwnership(
  async (request, context, params) => {
    ${extractFunctionBody(originalFunction, method)}
  },
  async (request, params) => params?.userId, // Extract userId for ownership check
  {
    rateLimit: { requests: ${rateLimit.requests}, window: ${rateLimit.window} },
    auditLog: true
  }
);`;
    } else {
      transformedFunction = `export const ${method} = ${guard}(async (request, context${filePath.includes('[') ? ', params' : ''}) => {
  ${extractFunctionBody(originalFunction, method)}
}, {
  rateLimit: { requests: ${rateLimit.requests}, window: ${rateLimit.window} },
  auditLog: ${guard === 'withAdminAuth' ? 'true' : 'false'}
});`;
    }
    
    newContent = beforeFunction + transformedFunction + newContent.substring(functionEnd);
    hasChanges = true;
  });
  
  return { content: newContent, hasChanges };
}

function extractFunctionBody(functionCode, method) {
  // Extract the function body and adapt for new signature
  const lines = functionCode.split('\n');
  let bodyLines = [];
  let inBody = false;
  
  for (const line of lines) {
    if (line.includes('{')) {
      inBody = true;
      continue;
    }
    if (inBody && !line.trim().startsWith('}')) {
      let adaptedLine = line;
      
      // Replace common patterns
      adaptedLine = adaptedLine.replace(/const\s+session\s*=\s*await\s+auth\(\);?\s*/g, '');
      adaptedLine = adaptedLine.replace(/const\s+user\s*=\s*await\s+currentUser\(\);?\s*/g, '');
      adaptedLine = adaptedLine.replace(/session\.user/g, 'context.user');
      adaptedLine = adaptedLine.replace(/user\.id/g, 'context.user.id');
      adaptedLine = adaptedLine.replace(/const\s+body\s*=\s*await\s+req\.json\(\);?/g, 'const body = await request.json();');
      adaptedLine = adaptedLine.replace(/req\./g, 'request.');
      
      // Remove manual auth checks
      if (adaptedLine.includes('if (!session?.user') || 
          adaptedLine.includes('if (!user?.id') ||
          adaptedLine.includes('role !== \'ADMIN\'')) {
        continue;
      }
      
      bodyLines.push(adaptedLine);
    }
  }
  
  return bodyLines.join('\n').trim();
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = transformEndpoint(content, filePath);
    
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent);
      console.log(`  ✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findApiRoutes(dir) {
  const routes = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      routes.push(...findApiRoutes(fullPath));
    } else if (item === 'route.ts') {
      routes.push(fullPath);
    }
  }
  
  return routes;
}

// Main execution
console.log('🔒 Auto-applying API authentication guards...\n');

const apiDir = path.join(process.cwd(), 'app/api');
const routes = findApiRoutes(apiDir);

console.log(`Found ${routes.length} API route files\n`);

let updatedCount = 0;

// Process high-priority directories first
const priorities = ['/admin/', '/enterprise/', '/users/', '/courses/', '/sam/'];

priorities.forEach(priority => {
  const priorityRoutes = routes.filter(route => route.includes(priority));
  if (priorityRoutes.length > 0) {
    console.log(`📁 Processing ${priority} routes:`);
    priorityRoutes.forEach(route => {
      if (processFile(route)) {
        updatedCount++;
      }
    });
    console.log('');
  }
});

// Process remaining routes
const remainingRoutes = routes.filter(route => 
  !priorities.some(priority => route.includes(priority))
);

if (remainingRoutes.length > 0) {
  console.log('📁 Processing remaining routes:');
  remainingRoutes.slice(0, 10).forEach(route => { // Limit to prevent overwhelming output
    if (processFile(route)) {
      updatedCount++;
    }
  });
}

console.log(`\n🎉 Completed! Updated ${updatedCount} API endpoints with authentication guards.`);
console.log('\n📋 Summary of applied protections:');
console.log('  • Authentication validation');
console.log('  • Role-based access control');
console.log('  • Rate limiting');
console.log('  • Audit logging (for sensitive operations)');
console.log('\n⚠️  Note: Please review the changes and test thoroughly before deployment.');