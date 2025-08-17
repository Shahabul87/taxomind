/**
 * K6 Load Testing Configuration for Taxomind LMS
 * 
 * This configuration tests critical user journeys and API endpoints
 * to ensure the system can handle expected load patterns.
 * 
 * Test Scenarios:
 * 1. Smoke Test - Minimal load to verify system works
 * 2. Load Test - Normal expected load
 * 3. Stress Test - Beyond normal load to find breaking point
 * 4. Spike Test - Sudden traffic spikes
 * 5. Soak Test - Extended duration for memory leaks
 */

import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const loginSuccess = new Rate('login_success_rate');
const courseCreationTime = new Trend('course_creation_time');
const enrollmentSuccess = new Rate('enrollment_success_rate');
const apiErrors = new Counter('api_errors');
const activeUsers = new Gauge('active_users');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_TYPE = __ENV.TEST_TYPE || 'smoke';

// Test configurations
const testConfigs = {
  smoke: {
    vus: 1,
    duration: '1m',
    thresholds: {
      http_req_duration: ['p(95)<500'],
      http_req_failed: ['rate<0.1'],
      login_success_rate: ['rate>0.95'],
    },
  },
  load: {
    stages: [
      { duration: '2m', target: 50 },  // Ramp up to 50 users
      { duration: '5m', target: 50 },  // Stay at 50 users
      { duration: '2m', target: 100 }, // Ramp up to 100 users
      { duration: '5m', target: 100 }, // Stay at 100 users
      { duration: '2m', target: 0 },   // Ramp down to 0 users
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000', 'p(99)<2000'],
      http_req_failed: ['rate<0.05'],
      login_success_rate: ['rate>0.90'],
      enrollment_success_rate: ['rate>0.85'],
    },
  },
  stress: {
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 300 },
      { duration: '5m', target: 300 },
      { duration: '10m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000', 'p(99)<5000'],
      http_req_failed: ['rate<0.10'],
    },
  },
  spike: {
    stages: [
      { duration: '10s', target: 10 },
      { duration: '10s', target: 500 }, // Spike to 500 users
      { duration: '30s', target: 500 }, // Stay at 500
      { duration: '10s', target: 10 },  // Back to normal
      { duration: '3m', target: 10 },
      { duration: '10s', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<3000'],
      http_req_failed: ['rate<0.15'],
    },
  },
  soak: {
    stages: [
      { duration: '5m', target: 100 },
      { duration: '2h', target: 100 }, // Stay at 100 users for 2 hours
      { duration: '5m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<1500'],
      http_req_failed: ['rate<0.02'],
    },
  },
};

// Export test options
export const options = testConfigs[TEST_TYPE];

// Test data
const testUsers = [
  { email: 'student1@test.com', password: 'Test123!@#', role: 'USER' },
  { email: 'student2@test.com', password: 'Test123!@#', role: 'USER' },
  { email: 'teacher1@test.com', password: 'Test123!@#', role: 'USER' },
  { email: 'admin@test.com', password: 'Admin123!@#', role: 'ADMIN' },
];

const sampleCourses = [
  {
    title: 'Introduction to Machine Learning',
    description: 'Learn the fundamentals of ML algorithms and applications',
    price: 99.99,
    level: 'BEGINNER',
    categoryId: 'programming',
  },
  {
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts and design patterns',
    price: 149.99,
    level: 'ADVANCED',
    categoryId: 'web-development',
  },
  {
    title: 'Data Science with Python',
    description: 'Complete data science bootcamp with Python',
    price: 199.99,
    level: 'INTERMEDIATE',
    categoryId: 'data-science',
  },
];

// Helper functions
function authenticate(user) {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const success = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'received auth token': (r) => r.json('token') !== undefined,
  });

  loginSuccess.add(success);

  if (!success) {
    apiErrors.add(1);
    console.error(`Login failed for ${user.email}: ${loginRes.status} ${loginRes.body}`);
    return null;
  }

  return loginRes.json('token');
}

function createHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

// Test Scenarios
export function setup() {
  // Setup code - create test data if needed
  console.log(`Starting ${TEST_TYPE} test against ${BASE_URL}`);
  
  // Verify endpoint is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    fail(`Health check failed: ${healthCheck.status}`);
  }

  return { startTime: new Date() };
}

export default function (data) {
  activeUsers.add(1);

  // Select a random test user
  const user = randomItem(testUsers);
  
  group('User Authentication Flow', () => {
    const token = authenticate(user);
    if (!token) return;

    // Get user profile
    const profileRes = http.get(`${BASE_URL}/api/profile`, {
      headers: createHeaders(token),
    });

    check(profileRes, {
      'profile retrieved': (r) => r.status === 200,
      'profile has user data': (r) => r.json('user.email') === user.email,
    });

    sleep(randomIntBetween(1, 3));
  });

  group('Course Browsing', () => {
    // Browse courses without authentication
    const coursesRes = http.get(`${BASE_URL}/api/courses`);
    
    check(coursesRes, {
      'courses loaded': (r) => r.status === 200,
      'courses array returned': (r) => Array.isArray(r.json('courses')),
    });

    // Search courses
    const searchRes = http.get(`${BASE_URL}/api/courses?search=python`);
    
    check(searchRes, {
      'search successful': (r) => r.status === 200,
    });

    sleep(randomIntBetween(2, 5));
  });

  // Teacher-specific actions
  if (user.email.includes('teacher')) {
    group('Course Creation (Teacher)', () => {
      const token = authenticate(user);
      if (!token) return;

      const course = randomItem(sampleCourses);
      const startTime = Date.now();
      
      const createRes = http.post(
        `${BASE_URL}/api/courses`,
        JSON.stringify(course),
        {
          headers: createHeaders(token),
        }
      );

      const creationTime = Date.now() - startTime;
      courseCreationTime.add(creationTime);

      const success = check(createRes, {
        'course created': (r) => r.status === 201,
        'course has id': (r) => r.json('id') !== undefined,
      });

      if (!success) {
        apiErrors.add(1);
        console.error(`Course creation failed: ${createRes.status}`);
      }

      sleep(randomIntBetween(1, 3));
    });
  }

  // Student-specific actions
  if (user.email.includes('student')) {
    group('Course Enrollment (Student)', () => {
      const token = authenticate(user);
      if (!token) return;

      // Get available courses
      const coursesRes = http.get(`${BASE_URL}/api/courses`, {
        headers: createHeaders(token),
      });

      if (coursesRes.status === 200) {
        const courses = coursesRes.json('courses');
        if (courses && courses.length > 0) {
          const courseToEnroll = randomItem(courses);
          
          // Attempt enrollment
          const enrollRes = http.post(
            `${BASE_URL}/api/enrollment`,
            JSON.stringify({ courseId: courseToEnroll.id }),
            {
              headers: createHeaders(token),
            }
          );

          const success = check(enrollRes, {
            'enrollment successful': (r) => r.status === 201 || r.status === 200,
          });

          enrollmentSuccess.add(success);

          if (!success) {
            apiErrors.add(1);
          }
        }
      }

      sleep(randomIntBetween(2, 4));
    });

    group('Learning Progress', () => {
      const token = authenticate(user);
      if (!token) return;

      // Get user's enrolled courses
      const enrolledRes = http.get(`${BASE_URL}/api/user/courses`, {
        headers: createHeaders(token),
      });

      if (enrolledRes.status === 200) {
        const enrolledCourses = enrolledRes.json('courses');
        if (enrolledCourses && enrolledCourses.length > 0) {
          const course = randomItem(enrolledCourses);
          
          // Get course content
          const contentRes = http.get(
            `${BASE_URL}/api/courses/${course.id}/content`,
            {
              headers: createHeaders(token),
            }
          );

          check(contentRes, {
            'content loaded': (r) => r.status === 200,
          });

          // Update progress
          const progressRes = http.post(
            `${BASE_URL}/api/progress/update`,
            JSON.stringify({
              courseId: course.id,
              sectionId: 'section-1',
              isCompleted: true,
            }),
            {
              headers: createHeaders(token),
            }
          );

          check(progressRes, {
            'progress updated': (r) => r.status === 200,
          });
        }
      }

      sleep(randomIntBetween(3, 6));
    });
  }

  // Admin-specific actions
  if (user.role === 'ADMIN') {
    group('Admin Dashboard', () => {
      const token = authenticate(user);
      if (!token) return;

      // Get analytics
      const analyticsRes = http.get(`${BASE_URL}/api/admin/analytics`, {
        headers: createHeaders(token),
      });

      check(analyticsRes, {
        'analytics loaded': (r) => r.status === 200,
      });

      // Get user management data
      const usersRes = http.get(`${BASE_URL}/api/admin/users`, {
        headers: createHeaders(token),
      });

      check(usersRes, {
        'users loaded': (r) => r.status === 200,
      });

      sleep(randomIntBetween(2, 4));
    });
  }

  // Common actions for all users
  group('API Performance Checks', () => {
    // Test critical endpoints
    const endpoints = [
      '/api/health',
      '/api/courses',
      '/api/categories',
    ];

    endpoints.forEach((endpoint) => {
      const res = http.get(`${BASE_URL}${endpoint}`);
      
      check(res, {
        [`${endpoint} responds`]: (r) => r.status === 200,
        [`${endpoint} fast response`]: (r) => r.timings.duration < 1000,
      });
    });

    sleep(randomIntBetween(1, 2));
  });

  activeUsers.add(-1);
  sleep(randomIntBetween(5, 10));
}

export function teardown(data) {
  // Cleanup code
  console.log(`Test completed. Duration: ${(new Date() - data.startTime) / 1000}s`);
  
  // Final metrics summary
  console.log('Test Summary:');
  console.log(`- Login Success Rate: ${loginSuccess.rate}`);
  console.log(`- Enrollment Success Rate: ${enrollmentSuccess.rate}`);
  console.log(`- API Errors: ${apiErrors.count}`);
}

// Custom scenarios for specific user journeys
export function studentJourney() {
  const student = testUsers.find(u => u.email.includes('student'));
  const token = authenticate(student);
  
  if (!token) return;

  // Complete student learning journey
  // 1. Browse courses
  const coursesRes = http.get(`${BASE_URL}/api/courses`);
  const courses = coursesRes.json('courses');
  
  // 2. View course details
  if (courses && courses.length > 0) {
    const course = courses[0];
    http.get(`${BASE_URL}/api/courses/${course.id}`);
    
    // 3. Enroll in course
    http.post(
      `${BASE_URL}/api/enrollment`,
      JSON.stringify({ courseId: course.id }),
      { headers: createHeaders(token) }
    );
    
    // 4. Access course content
    http.get(`${BASE_URL}/api/courses/${course.id}/chapters`, {
      headers: createHeaders(token),
    });
    
    // 5. Submit progress
    http.post(
      `${BASE_URL}/api/progress/update`,
      JSON.stringify({
        courseId: course.id,
        progress: 25,
      }),
      { headers: createHeaders(token) }
    );
  }
}

export function teacherJourney() {
  const teacher = testUsers.find(u => u.email.includes('teacher'));
  const token = authenticate(teacher);
  
  if (!token) return;

  // Complete teacher course creation journey
  // 1. Create course
  const courseData = sampleCourses[0];
  const createRes = http.post(
    `${BASE_URL}/api/courses`,
    JSON.stringify(courseData),
    { headers: createHeaders(token) }
  );
  
  if (createRes.status === 201) {
    const courseId = createRes.json('id');
    
    // 2. Add chapters
    http.post(
      `${BASE_URL}/api/courses/${courseId}/chapters`,
      JSON.stringify({
        title: 'Chapter 1: Introduction',
        description: 'Getting started',
      }),
      { headers: createHeaders(token) }
    );
    
    // 3. Publish course
    http.put(
      `${BASE_URL}/api/courses/${courseId}/publish`,
      JSON.stringify({ isPublished: true }),
      { headers: createHeaders(token) }
    );
    
    // 4. View analytics
    http.get(`${BASE_URL}/api/courses/${courseId}/analytics`, {
      headers: createHeaders(token),
    });
  }
}