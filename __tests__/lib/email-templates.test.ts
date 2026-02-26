/**
 * Tests for lib/email-templates.ts
 *
 * Covers two exported functions:
 *   - generateEnrollmentConfirmationEmail(data: CourseEnrollmentEmailData)
 *   - generateWelcomeEmail(userName: string, coursesUrl: string)
 *
 * Each function returns { subject, html, text } where:
 *   - subject: email subject line
 *   - html: full HTML email template
 *   - text: plain text fallback
 *
 * We test:
 *   1. Correct subject lines
 *   2. HTML contains all required user/course data
 *   3. Plain text contains all required user/course data
 *   4. Free vs paid course rendering
 *   5. Date formatting in enrollment email
 *   6. URL inclusion (courseUrl, dashboardUrl, coursesUrl)
 *   7. Structure of returned object
 */

// Unmock the module under test
jest.unmock('@/lib/email-templates');

// We need to mock @prisma/client since the source file imports from it,
// but the jest.setup.js already provides a mock for it via moduleNameMapper.

import {
  generateEnrollmentConfirmationEmail,
  generateWelcomeEmail,
  type CourseEnrollmentEmailData,
} from '@/lib/email-templates';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function createEnrollmentData(
  overrides: Partial<CourseEnrollmentEmailData> = {}
): CourseEnrollmentEmailData {
  return {
    user: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    course: {
      title: 'Advanced TypeScript',
      description: 'Master TypeScript with advanced patterns',
      price: 49.99,
      thumbnail: 'https://example.com/thumb.jpg',
    },
    enrollmentDate: new Date('2026-01-15T10:00:00Z'),
    courseUrl: 'https://app.example.com/courses/ts-advanced',
    dashboardUrl: 'https://app.example.com/dashboard',
    ...overrides,
  };
}

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------

describe('lib/email-templates', () => {
  // ==============================================================
  // generateEnrollmentConfirmationEmail
  // ==============================================================

  describe('generateEnrollmentConfirmationEmail', () => {
    // ---- Return structure ----

    it('returns an object with subject, html, and text properties', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });

    it('returns strings for all three properties', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(typeof result.subject).toBe('string');
      expect(typeof result.html).toBe('string');
      expect(typeof result.text).toBe('string');
    });

    // ---- Subject line ----

    it('includes course title in subject line', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.subject).toContain('Advanced TypeScript');
    });

    it('subject follows "Welcome to <title>!" pattern', () => {
      const data = createEnrollmentData({
        course: { title: 'React Fundamentals' },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.subject).toBe('Welcome to React Fundamentals! \uD83C\uDF89');
    });

    // ---- HTML content ----

    it('HTML contains user name', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('John Doe');
    });

    it('HTML contains course title', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('Advanced TypeScript');
    });

    it('HTML contains course URL as link', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('https://app.example.com/courses/ts-advanced');
    });

    it('HTML contains dashboard URL as link', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('https://app.example.com/dashboard');
    });

    it('HTML contains enrollment date formatted correctly', () => {
      const data = createEnrollmentData({
        enrollmentDate: new Date('2026-01-15T10:00:00Z'),
      });
      const result = generateEnrollmentConfirmationEmail(data);

      // toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      // Should produce something like "January 15, 2026"
      expect(result.html).toContain('January');
      expect(result.html).toContain('2026');
    });

    it('HTML shows price for paid courses', () => {
      const data = createEnrollmentData({
        course: { title: 'Paid Course', price: 29.99 },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('$29.99');
      expect(result.html).toContain('Investment');
    });

    it('HTML shows "Free Course" when price is 0', () => {
      const data = createEnrollmentData({
        course: { title: 'Free Course', price: 0 },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('Free Course');
    });

    it('HTML shows "Free Course" when price is undefined', () => {
      const data = createEnrollmentData({
        course: { title: 'No Price Course' },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('Free Course');
    });

    it('HTML is valid HTML with DOCTYPE', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html>');
      expect(result.html).toContain('</html>');
    });

    it('HTML contains learning tips section', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('Tips for Success');
      expect(result.html).toContain('Set a Schedule');
      expect(result.html).toContain('Take Notes');
      expect(result.html).toContain('Practice Regularly');
    });

    it('HTML contains enrollment confirmed badge', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('Enrollment Confirmed');
    });

    // ---- Plain text content ----

    it('text contains user name', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.text).toContain('John Doe');
    });

    it('text contains course title', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.text).toContain('Advanced TypeScript');
    });

    it('text contains course URL', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.text).toContain('https://app.example.com/courses/ts-advanced');
    });

    it('text contains dashboard URL', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.text).toContain('https://app.example.com/dashboard');
    });

    it('text shows price for paid courses', () => {
      const data = createEnrollmentData({
        course: { title: 'Paid Course', price: 99 },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.text).toContain('$99');
      expect(result.text).toContain('Investment');
    });

    it('text shows "Free Course" when price is 0', () => {
      const data = createEnrollmentData({
        course: { title: 'Free Course', price: 0 },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.text).toContain('Free Course');
    });

    it('text shows "Free Course" when price is undefined', () => {
      const data = createEnrollmentData({
        course: { title: 'No Price Course' },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.text).toContain('Free Course');
    });

    it('text contains learning tips', () => {
      const data = createEnrollmentData();
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.text).toContain('Set a regular learning schedule');
      expect(result.text).toContain('Take notes');
    });

    // ---- Edge cases ----

    it('handles special characters in user name', () => {
      const data = createEnrollmentData({
        user: { name: "O'Brien & Co.", email: 'obrien@example.com' },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain("O'Brien & Co.");
      expect(result.text).toContain("O'Brien & Co.");
    });

    it('handles special characters in course title', () => {
      const data = createEnrollmentData({
        course: { title: 'C++ & Data Structures: <Advanced>', price: 0 },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain('C++ & Data Structures: <Advanced>');
      expect(result.subject).toContain('C++ & Data Structures: <Advanced>');
    });

    it('handles very long course titles', () => {
      const longTitle = 'A'.repeat(200);
      const data = createEnrollmentData({
        course: { title: longTitle, price: 10 },
      });
      const result = generateEnrollmentConfirmationEmail(data);

      expect(result.html).toContain(longTitle);
      expect(result.subject).toContain(longTitle);
    });
  });

  // ==============================================================
  // generateWelcomeEmail
  // ==============================================================

  describe('generateWelcomeEmail', () => {
    const userName = 'Jane Smith';
    const coursesUrl = 'https://app.example.com/courses';

    // ---- Return structure ----

    it('returns an object with subject, html, and text properties', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });

    it('returns strings for all three properties', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(typeof result.subject).toBe('string');
      expect(typeof result.html).toBe('string');
      expect(typeof result.text).toBe('string');
    });

    // ---- Subject line ----

    it('has correct welcome subject line', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.subject).toBe('Welcome to Your Learning Journey! \uD83C\uDF1F');
    });

    // ---- HTML content ----

    it('HTML contains user name', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.html).toContain('Jane Smith');
    });

    it('HTML contains courses URL as link', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.html).toContain('https://app.example.com/courses');
    });

    it('HTML contains "Explore Courses" call to action', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.html).toContain('Explore Courses');
    });

    it('HTML is valid HTML structure', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html>');
      expect(result.html).toContain('</html>');
    });

    it('HTML contains welcome header', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.html).toContain('Welcome to Your Learning Journey!');
    });

    it('HTML contains community message', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.html).toContain('community of learners');
    });

    // ---- Plain text content ----

    it('text contains user name', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.text).toContain('Jane Smith');
    });

    it('text contains courses URL', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.text).toContain('https://app.example.com/courses');
    });

    it('text contains welcome greeting', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.text).toContain('Welcome to Your Learning Journey!');
    });

    it('text contains community message', () => {
      const result = generateWelcomeEmail(userName, coursesUrl);

      expect(result.text).toContain('community of learners');
    });

    // ---- Edge cases ----

    it('handles special characters in user name', () => {
      const result = generateWelcomeEmail("O'Malley", coursesUrl);

      expect(result.html).toContain("O'Malley");
      expect(result.text).toContain("O'Malley");
    });

    it('handles different URL formats', () => {
      const result = generateWelcomeEmail(userName, 'http://localhost:3000/courses');

      expect(result.html).toContain('http://localhost:3000/courses');
      expect(result.text).toContain('http://localhost:3000/courses');
    });

    it('handles empty string user name', () => {
      const result = generateWelcomeEmail('', coursesUrl);

      // Should still return a valid email (just with empty name spot)
      expect(result.subject).toBeDefined();
      expect(result.html).toBeDefined();
      expect(result.text).toBeDefined();
    });
  });
});
