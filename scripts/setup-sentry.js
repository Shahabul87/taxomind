#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('\n🚀 Sentry Setup Helper for Taxomind LMS\n');
console.log('This script will help you configure Sentry for error tracking and APM.\n');

async function setupSentry() {
  try {
    // Check if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local');
    const envExists = fs.existsSync(envPath);
    
    if (!envExists) {
      console.log('📝 Creating .env.local file...\n');
      fs.writeFileSync(envPath, '');
    }

    console.log('Please provide your Sentry configuration:\n');
    
    // Get Sentry DSN
    console.log('1. Get your DSN from: https://sentry.io/settings/[org]/projects/[project]/keys/');
    const dsn = await question('Enter your Sentry DSN (or press Enter to skip): ');
    
    if (!dsn) {
      console.log('\n⚠️  Skipping Sentry setup. You can configure it later by adding SENTRY_DSN to your .env.local\n');
      rl.close();
      return;
    }

    // Validate DSN format
    if (!dsn.includes('ingest.sentry.io')) {
      console.log('\n⚠️  Warning: DSN format looks incorrect. Make sure it starts with https:// and includes ingest.sentry.io\n');
    }

    // Get optional configuration
    const setupAdvanced = await question('\nDo you want to set up advanced features? (y/N): ');
    
    let org = '';
    let project = '';
    let authToken = '';
    
    if (setupAdvanced.toLowerCase() === 'y') {
      console.log('\n2. Find your organization slug in your Sentry URL: sentry.io/organizations/[org-slug]/');
      org = await question('Enter your Sentry organization slug (optional): ');
      
      console.log('\n3. Enter your project name as it appears in Sentry');
      project = await question('Enter your Sentry project name (optional): ');
      
      console.log('\n4. Generate auth token at: https://sentry.io/settings/account/api/auth-tokens/');
      console.log('   Required scopes: project:releases, org:read');
      authToken = await question('Enter your Sentry auth token (optional): ');
    }

    // Read existing env file
    let envContent = '';
    if (envExists) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check for existing Sentry configuration
    if (envContent.includes('SENTRY_DSN')) {
      const overwrite = await question('\n⚠️  Sentry configuration already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('\n✅ Keeping existing configuration.\n');
        rl.close();
        return;
      }
      // Remove existing Sentry configuration
      envContent = envContent.replace(/^.*SENTRY.*$/gm, '').replace(/\n\n+/g, '\n\n');
    }

    // Add Sentry configuration
    const sentryConfig = `
# Sentry Error Tracking & APM
SENTRY_DSN=${dsn}
NEXT_PUBLIC_SENTRY_DSN=${dsn}${org ? `
SENTRY_ORG=${org}` : ''}${project ? `
SENTRY_PROJECT=${project}` : ''}${authToken ? `
SENTRY_AUTH_TOKEN=${authToken}` : ''}
`;

    // Append to env file
    fs.writeFileSync(envPath, envContent + sentryConfig);
    
    console.log('\n✅ Sentry configuration added to .env.local\n');
    
    // Provide next steps
    console.log('📋 Next steps:\n');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Visit http://localhost:3000/sentry-test to test the integration');
    console.log('3. Check your Sentry dashboard for incoming events');
    console.log('\n📚 For more information, see docs/SENTRY_SETUP.md\n');
    
    // Test connection option
    const testNow = await question('Would you like to send a test event to Sentry now? (y/N): ');
    
    if (testNow.toLowerCase() === 'y') {
      console.log('\n🔄 Sending test event...\n');
      
      // Set environment variables for this process
      process.env.SENTRY_DSN = dsn;
      process.env.NEXT_PUBLIC_SENTRY_DSN = dsn;
      
      // Initialize Sentry
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: dsn,
        environment: 'setup-test',
      });
      
      // Send test event
      Sentry.captureMessage('Sentry setup test from Taxomind LMS', 'info');
      
      // Wait for event to be sent
      await Sentry.flush(2000);
      
      console.log('✅ Test event sent! Check your Sentry dashboard.\n');
      console.log(`🔗 Dashboard: https://sentry.io/organizations/${org || 'YOUR_ORG'}/issues/\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
  } finally {
    rl.close();
  }
}

setupSentry();