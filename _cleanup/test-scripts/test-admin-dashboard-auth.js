// Test script to simulate admin dashboard access with auth
const https = require('https');

// This will trigger the actual page render with auth
console.log('Testing admin dashboard page load...\n');

// Check if server is running
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/dashboard/admin',
  method: 'GET',
  headers: {
    'Cookie': 'admin-session-token=test',
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  res.on('data', (chunk) => {
    const data = chunk.toString();
    if (data.includes('Error') || data.includes('error')) {
      console.log('\n🔴 Error detected in response:');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error);
});

req.end();
