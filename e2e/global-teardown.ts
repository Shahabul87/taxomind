import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * Global teardown for Playwright E2E tests
 * Runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Clean up authentication files
    await cleanupAuthFiles();
    
    // Clean up test data if needed
    await cleanupTestData(config);
    
    // Clean up temporary files
    await cleanupTempFiles();
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw to avoid failing the entire test run
  }
}

/**
 * Clean up authentication state files
 */
async function cleanupAuthFiles() {
  console.log('🔐 Cleaning up authentication files...');
  
  const authDir = 'e2e/auth';
  
  try {
    const files = await fs.readdir(authDir);
    const authFiles = files.filter(file => file.endsWith('-auth.json'));
    
    for (const file of authFiles) {
      const filePath = path.join(authDir, file);
      await fs.unlink(filePath);
      console.log(`🗑️  Deleted auth file: ${file}`);
    }
    
    console.log('✅ Authentication files cleaned up');
    
  } catch (error) {
    // Directory might not exist or be empty
    console.log('ℹ️  No authentication files to clean up');
  }
}

/**
 * Clean up test data from database
 */
async function cleanupTestData(config: FullConfig) {
  console.log('📊 Cleaning up test data...');
  
  // Only clean up in test environments
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'e2e') {
    console.log('ℹ️  Skipping test data cleanup (not in test environment)');
    return;
  }
  
  try {
    const { baseURL } = config.projects[0].use;
    
    // Make API call to clean up test data
    const response = await fetch(`${baseURL}/api/test/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        environment: 'e2e',
        confirm: true,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Test data cleanup complete: ${data.message}`);
    } else {
      console.warn(`⚠️  Test data cleanup warning: ${response.status}`);
    }
    
  } catch (error) {
    console.warn('⚠️  Could not cleanup test data via API:', error);
  }
}

/**
 * Clean up temporary files created during tests
 */
async function cleanupTempFiles() {
  console.log('🗂️  Cleaning up temporary files...');
  
  const tempDirs = [
    'test-results',
    'playwright-report/data',
    'coverage/tmp',
  ];
  
  for (const dir of tempDirs) {
    try {
      const stats = await fs.stat(dir);
      if (stats.isDirectory()) {
        // Only remove specific temporary files, not the entire directory
        await cleanupDirectory(dir);
      }
    } catch (error) {
      // Directory doesn't exist, skip
      continue;
    }
  }
  
  console.log('✅ Temporary files cleaned up');
}

/**
 * Clean up files in a directory without removing the directory itself
 */
async function cleanupDirectory(dirPath: string) {
  try {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      // Only remove old files (older than 24 hours)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      if (stats.mtime.getTime() < oneDayAgo) {
        if (stats.isFile()) {
          await fs.unlink(filePath);
        } else if (stats.isDirectory()) {
          await fs.rmdir(filePath, { recursive: true });
        }
      }
    }
    
  } catch (error) {
    console.warn(`⚠️  Could not clean directory ${dirPath}:`, error);
  }
}

export default globalTeardown;