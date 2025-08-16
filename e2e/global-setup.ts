import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();

  try {
    // Create a new page for setup
    const page = await browser.newPage();
    
    // Navigate to the application
    console.log(`📱 Navigating to ${baseURL}`);
    await page.goto(baseURL!);
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Verify the application is accessible
    const title = await page.title();
    console.log(`📋 Application loaded: ${title}`);
    
    // Setup test data if needed
    await setupTestData(page);
    
    // Create authenticated sessions for different user roles
    await createAuthenticatedSessions(page, baseURL!);
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error: any) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Setup test data in the database
 */
async function setupTestData(page: any) {
  console.log('📊 Setting up test data...');
  
  try {
    // Call API endpoint to seed test data
    const response = await page.request.post('/api/test/seed', {
      data: {
        environment: 'e2e',
        cleanup: true, // Clean existing test data first
      },
    });
    
    if (response.ok()) {
      const data = await response.json();
      console.log(`✅ Test data setup complete: ${data.message}`);
    } else {
      console.warn(`⚠️  Test data setup warning: ${response.status()}`);
    }
  } catch (error: any) {
    console.warn('⚠️  Could not setup test data via API, using existing data');
  }
}

/**
 * Create authenticated sessions for different user roles
 */
async function createAuthenticatedSessions(page: any, baseURL: string) {
  console.log('🔐 Creating authenticated sessions...');
  
  const sessions = [
    { role: 'admin', email: 'admin@test.com', password: 'admin123', file: 'admin-auth.json' },
    { role: 'teacher', email: 'teacher@test.com', password: 'teacher123', file: 'teacher-auth.json' },
    { role: 'student', email: 'student@test.com', password: 'student123', file: 'student-auth.json' },
  ];

  for (const session of sessions) {
    try {
      console.log(`👤 Creating ${session.role} session...`);
      
      // Navigate to login page
      await page.goto(`${baseURL}/auth/login`);
      await page.waitForLoadState('networkidle');
      
      // Fill login form
      await page.fill('input[name="email"]', session.email);
      await page.fill('input[name="password"]', session.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for successful login (redirect to dashboard)
      await page.waitForURL('**/dashboard/**', { timeout: 10000 });
      
      // Save the authenticated state
      await page.context().storageState({ path: `e2e/auth/${session.file}` });
      
      console.log(`✅ ${session.role} session created and saved`);
      
    } catch (error: any) {
      console.warn(`⚠️  Could not create ${session.role} session:`, error);
      // Continue with other sessions even if one fails
    }
  }
}

export default globalSetup;