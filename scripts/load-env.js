#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Loads the appropriate environment file based on NODE_ENV
 * Priority: .env.local > .env.{NODE_ENV} > .env
 */
function loadEnvironment() {
  const cwd = process.cwd();
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  console.log(`🔧 Loading environment for: ${nodeEnv}`);
  
  // Define environment files in priority order
  const envFiles = nodeEnv === 'production' 
    ? [
        `.env.${nodeEnv}.local`,  // .env.production.local (highest priority for prod)
        `.env.${nodeEnv}`,        // .env.production
        '.env'                    // Fallback
      ]
    : [
        `.env.${nodeEnv}.local`,  // .env.development.local (highest priority for dev)
        `.env.local`,             // .env.local (only for development)
        `.env.${nodeEnv}`,        // .env.development
        '.env'                    // Fallback
      ];
  
  let loadedFiles = [];
  
  for (const envFile of envFiles) {
    const envPath = path.join(cwd, envFile);
    
    if (fs.existsSync(envPath)) {
      console.log(`✅ Found: ${envFile}`);
      loadedFiles.push(envFile);
      
      // Load the environment file
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && !key.startsWith('#') && !process.env[key]) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      });
    }
  }
  
  if (loadedFiles.length === 0) {
    console.warn('⚠️  No environment files found');

    // In production, this is expected (Railway/Vercel inject env vars)
    if (nodeEnv === 'production') {
      console.log('📦 Running in production - using platform-injected environment variables');
    }
  }

  // Validate critical environment variables
  const critical = ['DATABASE_URL', 'AUTH_SECRET'];
  const missing = critical.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing critical environment variables: ${missing.join(', ')}`);

    // Only exit in development - in production, let the app handle missing vars
    if (nodeEnv !== 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  App may fail to start without these variables');
    }
  }
  
  // Show environment info
  const dbType = process.env.DATABASE_URL?.includes('localhost') ? 'Local' : 'Remote';
  const dbHost = process.env.DATABASE_URL?.includes('railway') ? 'Railway' : 
                 process.env.DATABASE_URL?.includes('localhost') ? 'Local Docker' : 'Unknown';
  
  console.log(`📊 Environment Summary:`);
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   Database: ${dbType} (${dbHost})`);
  console.log(`   App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
  console.log(`   Redis: ${process.env.DISABLE_REDIS === 'true' ? 'Disabled' : 'Enabled'}`);
  console.log(`   Files loaded: ${loadedFiles.join(', ')}`);
}

// Run if called directly
if (require.main === module) {
  loadEnvironment();
}

module.exports = { loadEnvironment };