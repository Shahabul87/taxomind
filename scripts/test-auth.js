#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function testAuth() {
  console.log('\n🔐 Testing Authentication System\n');
  
  // Test password hashing
  const testPassword = 'Admin123!@#';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  console.log('✅ Password hashed successfully');
  
  // Test password verification
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log(`✅ Password verification: ${isValid ? 'PASSED' : 'FAILED'}`);
  
  // Display test credentials
  console.log('\n📋 Test Credentials:');
  console.log('────────────────────────────────────');
  console.log('Admin User:');
  console.log('  Email: admin@example.com');
  console.log('  Password: Admin123!@#');
  console.log('');
  console.log('Regular User:');
  console.log('  Email: testuser@example.com');
  console.log('  Password: User123!@#');
  console.log('────────────────────────────────────');
  
  console.log('\n🌐 Application URL: http://localhost:3001');
  console.log('📍 Login Page: http://localhost:3001/auth/login');
  console.log('\n✨ Authentication system is ready!\n');
}

testAuth().catch(console.error);