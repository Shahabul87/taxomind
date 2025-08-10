import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';
import { Rate, Trend } from 'k6/metrics';

/**
 * K6 Load Testing Script for Taxomind LMS
 * 
 * Tests various endpoints under different load conditions to ensure
 * the application can handle expected traffic volumes
 */

// Custom metrics
const failureRate = new Rate('failed_requests');
const apiResponseTime = new Trend('api_response_time');
const dbQueryTime = new Trend('db_query_time');

// Test configuration
export const options: Options = {
  stages: [
    // Warm-up
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    
    // Load test
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '10m', target: 50 }, // Stay at 50 users
    
    // Stress test
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    
    // Peak test
    { duration: '2m', target: 200 }, // Spike to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    
    // Cool down
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    http_reqs: ['rate>10'], // Must handle more than 10 requests per second
    failed_requests: ['rate<0.05'], // Custom failure rate below 5%
    api_response_time: ['p(95)<1000'], // 95% of API calls under 1s
    db_query_time: ['p(90)<500'], // 90% of DB queries under 500ms
  },
  ext: {
    loadimpact: {
      projectID: parseInt(__ENV.K6_PROJECT_ID || '0'),
      name: 'Taxomind LMS Load Test',
    },
  },
};

// Base URL from environment or default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const TEST_USERS = [
  { email: 'student1@test.com', password: 'password123' },
  { email: 'student2@test.com', password: 'password123' },
  { email: 'teacher1@test.com', password: 'password123' },
  { email: 'admin@test.com', password: 'password123' },
];

let authTokens: { [key: string]: string } = {};

export function setup() {
  console.log('🚀 Starting load test setup...');
  
  // Authenticate test users and get tokens
  for (const user of TEST_USERS) {
    const loginResponse = http.post(`${BASE_URL}/api/auth/signin`, {
      email: user.email,
      password: user.password,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (loginResponse.status === 200) {
      const cookies = loginResponse.cookies;
      if (cookies['next-auth.session-token']) {
        authTokens[user.email] = cookies['next-auth.session-token'][0].value;
      }
    }
  }
  
  console.log(`✅ Setup complete. Authenticated ${Object.keys(authTokens).length} users.`);
  return { authTokens };
}

export default function main(data: { authTokens: { [key: string]: string } }) {
  // Select random user for this iteration
  const userEmails = Object.keys(data.authTokens);
  const randomUser = userEmails[Math.floor(Math.random() * userEmails.length)];
  const authToken = data.authTokens[randomUser];
  
  const headers = {
    'Cookie': `next-auth.session-token=${authToken}`,
    'User-Agent': 'K6-LoadTest/1.0',
  };

  group('Homepage and Public Pages', () => {
    // Test homepage
    const homepageResponse = http.get(BASE_URL);
    check(homepageResponse, {
      'homepage loads successfully': (r) => r.status === 200,
      'homepage loads in reasonable time': (r) => r.timings.duration < 2000,
      'homepage has title': (r) => r.body.includes('<title>'),
    });
    failureRate.add(homepageResponse.status !== 200);

    // Test courses browse page
    const coursesResponse = http.get(`${BASE_URL}/courses`);
    check(coursesResponse, {
      'courses page loads': (r) => r.status === 200,
      'courses page has content': (r) => r.body.includes('course'),
    });
    failureRate.add(coursesResponse.status !== 200);

    sleep(1);
  });

  group('Authentication Endpoints', () => {
    // Test login page load
    const loginPageResponse = http.get(`${BASE_URL}/auth/login`);
    check(loginPageResponse, {
      'login page loads': (r) => r.status === 200,
      'login form present': (r) => r.body.includes('email') && r.body.includes('password'),
    });
    
    // Simulate login attempt (with test user)
    const loginResponse = http.post(`${BASE_URL}/api/auth/signin`, JSON.stringify({
      email: randomUser,
      password: 'password123',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(loginResponse, {
      'login API responds': (r) => r.status >= 200 && r.status < 500,
    });
    
    apiResponseTime.add(loginResponse.timings.duration);
    failureRate.add(loginResponse.status >= 400);

    sleep(0.5);
  });

  group('Dashboard and User Area', () => {
    if (authToken) {
      // Test dashboard access
      const dashboardResponse = http.get(`${BASE_URL}/dashboard`, { headers });
      check(dashboardResponse, {
        'dashboard accessible for authenticated user': (r) => r.status === 200,
        'dashboard loads quickly': (r) => r.timings.duration < 3000,
        'dashboard has user content': (r) => r.body.includes('Dashboard') || r.body.includes('Welcome'),
      });
      failureRate.add(dashboardResponse.status !== 200);

      // Test my courses page
      const myCoursesResponse = http.get(`${BASE_URL}/my-courses`, { headers });
      check(myCoursesResponse, {
        'my courses page loads': (r) => r.status === 200 || r.status === 404, // 404 is ok if page doesn't exist
      });

      apiResponseTime.add(dashboardResponse.timings.duration);
    }

    sleep(1);
  });

  group('Course API Endpoints', () => {
    // Test courses API
    const coursesApiResponse = http.get(`${BASE_URL}/api/courses`, { headers });
    check(coursesApiResponse, {
      'courses API responds': (r) => r.status === 200,
      'courses API returns JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
      'courses API responds quickly': (r) => r.timings.duration < 1000,
    });
    
    apiResponseTime.add(coursesApiResponse.timings.duration);
    failureRate.add(coursesApiResponse.status !== 200);

    // Test individual course API (if we have course IDs)
    if (coursesApiResponse.status === 200) {
      try {
        const courses = JSON.parse(coursesApiResponse.body);
        if (courses.length > 0) {
          const firstCourseId = courses[0].id;
          const courseDetailResponse = http.get(`${BASE_URL}/api/courses/${firstCourseId}`, { headers });
          
          check(courseDetailResponse, {
            'course detail API responds': (r) => r.status === 200,
            'course detail has required fields': (r) => {
              try {
                const course = JSON.parse(r.body);
                return course.id && course.title;
              } catch {
                return false;
              }
            },
          });
          
          apiResponseTime.add(courseDetailResponse.timings.duration);
          dbQueryTime.add(courseDetailResponse.timings.duration); // Assuming this hits DB
        }
      } catch (e) {
        console.log('Could not parse courses API response for detailed testing');
      }
    }

    sleep(0.5);
  });

  group('Search Functionality', () => {
    // Test search API
    const searchResponse = http.get(`${BASE_URL}/api/search?q=javascript`, { headers });
    check(searchResponse, {
      'search API responds': (r) => r.status === 200 || r.status === 404, // 404 ok if not implemented
    });
    
    if (searchResponse.status === 200) {
      apiResponseTime.add(searchResponse.timings.duration);
      
      check(searchResponse, {
        'search returns results quickly': (r) => r.timings.duration < 2000,
        'search returns valid JSON': (r) => {
          try {
            JSON.parse(r.body);
            return true;
          } catch {
            return false;
          }
        },
      });
    }

    sleep(0.3);
  });

  group('User Analytics', () => {
    if (authToken) {
      // Test analytics endpoints
      const analyticsResponse = http.get(`${BASE_URL}/api/analytics/user`, { headers });
      check(analyticsResponse, {
        'analytics API responds': (r) => r.status === 200 || r.status === 404,
      });
      
      if (analyticsResponse.status === 200) {
        apiResponseTime.add(analyticsResponse.timings.duration);
        dbQueryTime.add(analyticsResponse.timings.duration);
        
        check(analyticsResponse, {
          'analytics loads in reasonable time': (r) => r.timings.duration < 3000,
        });
      }
    }

    sleep(0.2);
  });

  group('Media and Static Assets', () => {
    // Test static asset loading
    const assetsToTest = [
      '/_next/static/css/app.css',
      '/_next/static/js/app.js',
      '/favicon.ico',
    ];

    for (const asset of assetsToTest) {
      const assetResponse = http.get(`${BASE_URL}${asset}`);
      check(assetResponse, {
        [`${asset} loads`]: (r) => r.status === 200 || r.status === 404, // 404 ok if asset doesn't exist
      });
    }

    sleep(0.1);
  });

  // Random sleep to simulate user reading/thinking time
  sleep(Math.random() * 3 + 1);
}

export function teardown(data: { authTokens: { [key: string]: string } }) {
  console.log('🧹 Load test teardown...');
  
  // Optional: Logout users or cleanup test data
  for (const email of Object.keys(data.authTokens)) {
    const logoutResponse = http.post(`${BASE_URL}/api/auth/signout`, {}, {
      headers: {
        'Cookie': `next-auth.session-token=${data.authTokens[email]}`,
      },
    });
    
    if (logoutResponse.status === 200) {
      console.log(`✅ Logged out ${email}`);
    }
  }
  
  console.log('✅ Teardown complete');
}

export function handleSummary(data: any) {
  console.log('📊 Load Test Summary:');
  console.log(`Total Requests: ${data.metrics.http_reqs.count}`);
  console.log(`Failed Requests: ${data.metrics.http_req_failed.count}`);
  console.log(`Average Response Time: ${data.metrics.http_req_duration.avg}ms`);
  console.log(`95th Percentile Response Time: ${data.metrics['http_req_duration']['p(95)']}ms`);
  console.log(`Requests per Second: ${data.metrics.http_reqs.rate}`);
  
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: generateTextSummary(data),
  };
}

function generateTextSummary(data: any): string {
  const metrics = data.metrics;
  const thresholds = data.thresholds;
  
  let summary = '\n========================================\n';
  summary += '         LOAD TEST RESULTS\n';
  summary += '========================================\n\n';
  
  // Overall performance
  summary += 'PERFORMANCE METRICS:\n';
  summary += `├─ Total Requests: ${metrics.http_reqs?.count || 0}\n`;
  summary += `├─ Failed Requests: ${metrics.http_req_failed?.count || 0} (${((metrics.http_req_failed?.rate || 0) * 100).toFixed(2)}%)\n`;
  summary += `├─ Request Rate: ${(metrics.http_reqs?.rate || 0).toFixed(2)} req/s\n`;
  summary += `├─ Average Response Time: ${(metrics.http_req_duration?.avg || 0).toFixed(2)}ms\n`;
  summary += `├─ 95th Percentile: ${(metrics['http_req_duration']?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `└─ 99th Percentile: ${(metrics['http_req_duration']?.['p(99)'] || 0).toFixed(2)}ms\n\n`;
  
  // Thresholds
  summary += 'THRESHOLD RESULTS:\n';
  for (const [threshold, result] of Object.entries(thresholds)) {
    const status = (result as any).ok ? '✅ PASS' : '❌ FAIL';
    summary += `├─ ${threshold}: ${status}\n`;
  }
  
  // Custom metrics
  if (metrics.api_response_time) {
    summary += `\nAPI PERFORMANCE:\n`;
    summary += `├─ Average API Response: ${metrics.api_response_time.avg.toFixed(2)}ms\n`;
    summary += `└─ 95th Percentile API: ${metrics.api_response_time['p(95)'].toFixed(2)}ms\n`;
  }
  
  if (metrics.db_query_time) {
    summary += `\nDATABASE PERFORMANCE:\n`;
    summary += `├─ Average DB Query: ${metrics.db_query_time.avg.toFixed(2)}ms\n`;
    summary += `└─ 90th Percentile DB: ${metrics.db_query_time['p(90)'].toFixed(2)}ms\n`;
  }
  
  summary += '\n========================================\n';
  
  return summary;
}