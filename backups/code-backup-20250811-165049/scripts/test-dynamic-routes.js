const https = require('https');
const http = require('http');

// Test configuration
const baseUrl = process.env.NODE_ENV === 'production' ? 'https://bdgenai.com' : 'http://localhost:3000';
const testCourseId = 'test-course-123';

// Test endpoints
const testEndpoints = [
  `/api/test-course-route/${testCourseId}`,
  `/api/courses/${testCourseId}`,
  `/api/debug-course/${testCourseId}`,
];

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testDynamicRoutes() {
  console.log('🧪 Testing Dynamic Routes...');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=====================================\n');
  
  for (const endpoint of testEndpoints) {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`Testing: ${endpoint}`);
    
    try {
      const response = await makeRequest(fullUrl);
      
      console.log(`Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        console.log('✅ SUCCESS - Route accessible');
        try {
          const jsonData = JSON.parse(response.data);
          if (jsonData.courseId || jsonData.success) {
            console.log('✅ SUCCESS - Dynamic parameter working');
          }
        } catch (e) {
          console.log('⚠️  WARNING - Response not JSON');
        }
      } else if (response.statusCode === 404) {
        console.log('❌ FAILED - 404 Not Found (Middleware issue)');
      } else if (response.statusCode === 401) {
        console.log('🔒 AUTH - Requires authentication (Expected)');
      } else {
        console.log(`⚠️  UNEXPECTED - Status ${response.statusCode}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
    }
    
    console.log('-------------------------------------\n');
  }
  
  console.log('🎯 Test Summary:');
  console.log('- 200: Route working correctly');
  console.log('- 401: Authentication required (expected for protected routes)');
  console.log('- 404: PROBLEM - Middleware blocking route');
  console.log('\nTest completed!');
}

testDynamicRoutes().catch(console.error); 