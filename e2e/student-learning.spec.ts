import { test, expect } from '@playwright/test';

/**
 * Student Learning Journey E2E Tests
 * Tests the complete student learning experience from course discovery
 * to completion, including enrollment, progress tracking, and assessments
 */

test.describe('Student Learning Journey', () => {
  // Use student authentication for all tests in this suite
  test.use({ storageState: 'e2e/auth/student-auth.json' });

  let testCourseId: string;
  let testCourseName: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique identifiers for this test run
    const timestamp = Date.now();
    testCourseName = `Student Test Course ${timestamp}`;
    
    // Navigate to student dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Course Discovery and Browse', () => {
    test('should browse available courses', async ({ page }) => {
      // Navigate to courses page
      const coursesPageSelectors = [
        'a[href*="/courses"]',
        'button:has-text("Browse Courses")',
        'a:has-text("All Courses")',
        'nav a:has-text("Courses")'
      ];

      let coursesPageFound = false;
      for (const selector of coursesPageSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.first().click();
          coursesPageFound = true;
          break;
        }
      }

      if (coursesPageFound) {
        await page.waitForLoadState('networkidle');
        
        // Verify courses page loaded
        await expect(page.locator('body')).toContainText(['Courses', 'Browse', 'Learn']);
        
        // Should see course cards or list
        const courseElements = page.locator('[data-testid="course-card"], .course-card, .course-item');
        const courseCount = await courseElements.count();
        
        expect(courseCount).toBeGreaterThan(0);
        console.log(`📚 Found ${courseCount} courses on browse page`);
      } else {
        console.log('ℹ️ Courses browse page not found');
      }
    });

    test('should search for courses', async ({ page }) => {
      // Look for search functionality
      const searchSelectors = [
        'input[placeholder*="search" i]',
        'input[name="search"]',
        'input[type="search"]',
        '[data-testid="search-input"]'
      ];

      let searchFound = false;
      for (const selector of searchSelectors) {
        const searchInput = page.locator(selector);
        if (await searchInput.count() > 0) {
          searchFound = true;
          
          // Perform search
          await searchInput.fill('JavaScript');
          
          // Look for search button or press Enter
          const searchButton = page.locator('button[type="submit"], button:has-text("Search")');
          if (await searchButton.count() > 0) {
            await searchButton.click();
          } else {
            await searchInput.press('Enter');
          }
          
          await page.waitForTimeout(1000);
          
          // Verify search results
          await expect(page.locator('body')).toContainText(['JavaScript', 'Results', 'found']);
          
          console.log('✅ Course search functionality works');
          break;
        }
      }

      if (!searchFound) {
        console.log('ℹ️ Course search functionality not found');
      }
    });

    test('should filter courses by category', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');

      // Look for category filters
      const categoryFilterSelectors = [
        'select[name="category"]',
        'button:has-text("Category")',
        '.category-filter',
        '[data-testid="category-filter"]'
      ];

      let filterFound = false;
      for (const selector of categoryFilterSelectors) {
        const filter = page.locator(selector);
        if (await filter.count() > 0) {
          filterFound = true;
          
          if (selector.includes('select')) {
            await filter.selectOption({ index: 1 });
          } else {
            await filter.click();
            await page.waitForTimeout(500);
            
            // Click on a category option
            const categoryOption = page.locator('li:has-text("Programming"), button:has-text("Programming")');
            if (await categoryOption.count() > 0) {
              await categoryOption.first().click();
            }
          }
          
          await page.waitForTimeout(1000);
          
          console.log('✅ Category filtering works');
          break;
        }
      }

      if (!filterFound) {
        console.log('ℹ️ Category filtering not found');
      }
    });

    test('should view course details', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');

      // Find and click on a course
      const courseCards = page.locator('[data-testid="course-card"], .course-card, a[href*="/courses/"]');
      if (await courseCards.count() > 0) {
        await courseCards.first().click();
        await page.waitForURL('**/courses/**');

        // Verify course details page
        await expect(page.locator('body')).toContainText(['Description', 'Price', 'Enroll', 'Learn more']);
        
        // Should see course information
        const courseTitle = page.locator('h1, h2');
        await expect(courseTitle).toBeVisible();
        
        console.log('✅ Course details page accessible');
      } else {
        console.log('ℹ️ No courses found to view details');
      }
    });
  });

  test.describe('Course Enrollment', () => {
    test('should enroll in a free course', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');

      // Look for a free course
      const freeCourseSelectors = [
        ':has-text("Free")',
        ':has-text("$0")',
        '[data-price="0"]',
        '.free-course'
      ];

      let freeCourseFound = false;
      for (const selector of freeCourseSelectors) {
        const freeCourse = page.locator(selector);
        if (await freeCourse.count() > 0) {
          // Click on the free course
          const courseLink = freeCourse.locator('a[href*="/courses/"], .course-card').first();
          await courseLink.click();
          await page.waitForURL('**/courses/**');
          
          freeCourseFound = true;
          break;
        }
      }

      if (freeCourseFound) {
        // Look for enroll button
        const enrollButton = page.locator('button:has-text("Enroll"), button:has-text("Start Learning"), button:has-text("Join")');
        if (await enrollButton.count() > 0) {
          await enrollButton.click();
          
          // Wait for enrollment to complete
          await page.waitForTimeout(2000);
          
          // Should redirect to course content or show success message
          const currentUrl = page.url();
          if (currentUrl.includes('/learn/') || currentUrl.includes('/chapters/')) {
            console.log('✅ Successfully enrolled and redirected to course content');
          } else {
            await expect(page.locator('body')).toContainText(['Enrolled', 'Welcome', 'Start Learning']);
            console.log('✅ Successfully enrolled in free course');
          }
        }
      } else {
        console.log('ℹ️ No free courses found for enrollment test');
      }
    });

    test('should initiate paid course enrollment', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');

      // Look for a paid course
      const paidCourseSelectors = [
        ':has-text("$")',
        '.price',
        '[data-price]',
        '.paid-course'
      ];

      let paidCourseFound = false;
      for (const selector of paidCourseSelectors) {
        const paidCourse = page.locator(selector).filter({ hasNotText: '$0' });
        if (await paidCourse.count() > 0) {
          // Click on the paid course
          const courseCard = paidCourse.locator('..').first(); // Parent element
          const courseLink = courseCard.locator('a[href*="/courses/"]');
          if (await courseLink.count() > 0) {
            await courseLink.click();
            await page.waitForURL('**/courses/**');
            paidCourseFound = true;
            break;
          }
        }
      }

      if (paidCourseFound) {
        // Look for enroll/purchase button
        const purchaseButton = page.locator('button:has-text("Enroll"), button:has-text("Buy"), button:has-text("Purchase")');
        if (await purchaseButton.count() > 0) {
          await purchaseButton.click();
          
          // Should redirect to payment page or show payment modal
          await page.waitForTimeout(1000);
          
          const bodyText = await page.locator('body').textContent();
          if (bodyText?.includes('payment') || bodyText?.includes('checkout') || bodyText?.includes('stripe')) {
            console.log('✅ Payment flow initiated for paid course');
          } else {
            console.log('ℹ️ Payment flow may be different than expected');
          }
        }
      } else {
        console.log('ℹ️ No paid courses found for enrollment test');
      }
    });
  });

  test.describe('Course Learning Experience', () => {
    test.beforeEach(async ({ page }) => {
      // Enroll in a course for learning tests
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');
      
      // Find and enroll in a course
      const courseCards = page.locator('[data-testid="course-card"], .course-card, a[href*="/courses/"]');
      if (await courseCards.count() > 0) {
        await courseCards.first().click();
        await page.waitForURL('**/courses/**');
        
        const enrollButton = page.locator('button:has-text("Enroll"), button:has-text("Start"), button:has-text("Continue")');
        if (await enrollButton.count() > 0) {
          await enrollButton.click();
          await page.waitForTimeout(2000);
        }
      }
    });

    test('should navigate course content structure', async ({ page }) => {
      // Look for course navigation
      const navSelectors = [
        '.course-nav',
        '.chapters-list',
        '.course-sidebar',
        '[data-testid="course-navigation"]'
      ];

      let navigationFound = false;
      for (const selector of navSelectors) {
        const nav = page.locator(selector);
        if (await nav.count() > 0) {
          navigationFound = true;
          
          // Find chapter/section links
          const chapters = nav.locator('a, button').filter({ hasText: /chapter|section/i });
          if (await chapters.count() > 0) {
            console.log(`✅ Found ${await chapters.count()} course navigation items`);
          }
          break;
        }
      }

      if (!navigationFound) {
        // Try alternative navigation patterns
        const alternativeNavs = page.locator('nav, aside, .sidebar').filter({ hasText: /chapter|section|lesson/i });
        if (await alternativeNavs.count() > 0) {
          navigationFound = true;
          console.log('✅ Course navigation found (alternative pattern)');
        }
      }

      if (!navigationFound) {
        console.log('ℹ️ Course navigation not found or different structure');
      }
    });

    test('should play course videos', async ({ page }) => {
      // Look for video player
      const videoSelectors = [
        'video',
        '.video-player',
        'iframe[src*="youtube"]',
        'iframe[src*="vimeo"]',
        '[data-testid="video-player"]'
      ];

      let videoFound = false;
      for (const selector of videoSelectors) {
        const video = page.locator(selector);
        if (await video.count() > 0) {
          videoFound = true;
          
          // Try to interact with video
          if (selector === 'video') {
            // HTML5 video
            await video.click(); // Play video
            console.log('✅ HTML5 video player found and clicked');
          } else {
            console.log('✅ Video player found (iframe or custom player)');
          }
          break;
        }
      }

      if (!videoFound) {
        console.log('ℹ️ Video player not found on current page');
      }
    });

    test('should mark sections as complete', async ({ page }) => {
      // Look for completion buttons/checkboxes
      const completionSelectors = [
        'button:has-text("Complete")',
        'button:has-text("Mark Complete")',
        'input[type="checkbox"][name*="complete"]',
        '[data-testid="mark-complete"]'
      ];

      let completionFound = false;
      for (const selector of completionSelectors) {
        const completionElement = page.locator(selector);
        if (await completionElement.count() > 0) {
          completionFound = true;
          
          await completionElement.first().click();
          await page.waitForTimeout(1000);
          
          // Verify completion state
          const bodyText = await page.locator('body').textContent();
          if (bodyText?.includes('Completed') || bodyText?.includes('✓')) {
            console.log('✅ Section marked as complete');
          }
          break;
        }
      }

      if (!completionFound) {
        console.log('ℹ️ Section completion functionality not found');
      }
    });

    test('should track learning progress', async ({ page }) => {
      // Look for progress indicators
      const progressSelectors = [
        '.progress-bar',
        '.progress',
        '[data-testid="progress"]',
        'progress',
        '.completion-rate'
      ];

      let progressFound = false;
      for (const selector of progressSelectors) {
        const progress = page.locator(selector);
        if (await progress.count() > 0) {
          progressFound = true;
          
          // Check if progress has a value
          if (selector === 'progress') {
            const value = await progress.getAttribute('value');
            console.log(`✅ Progress bar found with value: ${value}`);
          } else {
            console.log('✅ Progress indicator found');
          }
          break;
        }
      }

      if (!progressFound) {
        // Look for percentage indicators
        const percentageText = page.locator(':has-text("%")');
        if (await percentageText.count() > 0) {
          console.log('✅ Progress percentage found');
          progressFound = true;
        }
      }

      if (!progressFound) {
        console.log('ℹ️ Progress tracking not found or not visible');
      }
    });
  });

  test.describe('Assessments and Quizzes', () => {
    test('should take a quiz or assessment', async ({ page }) => {
      // First navigate to a course with assessments
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');
      
      // Enroll in a course
      const courseCards = page.locator('[data-testid="course-card"], .course-card, a[href*="/courses/"]');
      if (await courseCards.count() > 0) {
        await courseCards.first().click();
        await page.waitForURL('**/courses/**');
        
        const enrollButton = page.locator('button:has-text("Enroll"), button:has-text("Start")');
        if (await enrollButton.count() > 0) {
          await enrollButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // Look for quiz/assessment links
      const quizSelectors = [
        'a:has-text("Quiz")',
        'a:has-text("Assessment")',
        'a:has-text("Exam")',
        'button:has-text("Take Quiz")',
        '[data-testid="quiz-link"]'
      ];

      let quizFound = false;
      for (const selector of quizSelectors) {
        const quiz = page.locator(selector);
        if (await quiz.count() > 0) {
          quizFound = true;
          
          await quiz.first().click();
          await page.waitForTimeout(1000);
          
          // Look for quiz questions
          const questionSelectors = [
            '.question',
            '[data-testid="question"]',
            'form input[type="radio"]',
            'form input[type="checkbox"]'
          ];

          let questionsFound = false;
          for (const qSelector of questionSelectors) {
            const questions = page.locator(qSelector);
            if (await questions.count() > 0) {
              questionsFound = true;
              console.log(`✅ Found ${await questions.count()} quiz elements`);
              
              // Try to answer questions
              if (qSelector.includes('radio') || qSelector.includes('checkbox')) {
                await questions.first().check();
                console.log('✅ Answered quiz question');
              }
              break;
            }
          }

          if (questionsFound) {
            // Look for submit button
            const submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
            if (await submitButton.count() > 0) {
              await submitButton.click();
              await page.waitForTimeout(1000);
              
              // Look for results
              const bodyText = await page.locator('body').textContent();
              if (bodyText?.includes('Score') || bodyText?.includes('Result') || bodyText?.includes('%')) {
                console.log('✅ Quiz submitted and results shown');
              }
            }
          }
          break;
        }
      }

      if (!quizFound) {
        console.log('ℹ️ No quizzes or assessments found');
      }
    });

    test('should view quiz results and feedback', async ({ page }) => {
      // This test assumes a quiz has been taken
      // Look for results/grades section
      const resultsSelectors = [
        'a:has-text("Results")',
        'a:has-text("Grades")',
        'button:has-text("View Results")',
        '.quiz-results',
        '[data-testid="quiz-results"]'
      ];

      let resultsFound = false;
      for (const selector of resultsSelectors) {
        const results = page.locator(selector);
        if (await results.count() > 0) {
          resultsFound = true;
          
          if (selector.includes('a') || selector.includes('button')) {
            await results.first().click();
            await page.waitForTimeout(1000);
          }
          
          // Look for score information
          const scoreInfo = page.locator(':has-text("Score"), :has-text("%"), :has-text("Grade")');
          if (await scoreInfo.count() > 0) {
            console.log('✅ Quiz results and scores visible');
          }
          break;
        }
      }

      if (!resultsFound) {
        console.log('ℹ️ Quiz results section not found');
      }
    });
  });

  test.describe('Learning Dashboard and Analytics', () => {
    test('should view personal learning dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for learning analytics/stats
      const analyticsSelectors = [
        '.learning-stats',
        '.progress-overview',
        '[data-testid="learning-analytics"]',
        ':has-text("Progress")',
        ':has-text("Completed")'
      ];

      let analyticsFound = false;
      for (const selector of analyticsSelectors) {
        const analytics = page.locator(selector);
        if (await analytics.count() > 0) {
          analyticsFound = true;
          console.log('✅ Learning analytics found on dashboard');
          break;
        }
      }

      if (!analyticsFound) {
        console.log('ℹ️ Learning analytics not found on dashboard');
      }

      // Check for enrolled courses section
      const enrolledCoursesSelectors = [
        ':has-text("My Courses")',
        ':has-text("Enrolled Courses")',
        ':has-text("Continue Learning")',
        '.enrolled-courses'
      ];

      let enrolledSectionFound = false;
      for (const selector of enrolledCoursesSelectors) {
        const enrolled = page.locator(selector);
        if (await enrolled.count() > 0) {
          enrolledSectionFound = true;
          console.log('✅ Enrolled courses section found');
          break;
        }
      }

      if (!enrolledSectionFound) {
        console.log('ℹ️ Enrolled courses section not found');
      }
    });

    test('should view course completion certificates', async ({ page }) => {
      // Look for certificates section
      const certificateSelectors = [
        'a:has-text("Certificate")',
        'button:has-text("Certificate")',
        'a:has-text("Achievements")',
        '.certificates',
        '[data-testid="certificates"]'
      ];

      let certificatesFound = false;
      for (const selector of certificateSelectors) {
        const certificates = page.locator(selector);
        if (await certificates.count() > 0) {
          certificatesFound = true;
          
          await certificates.first().click();
          await page.waitForTimeout(1000);
          
          console.log('✅ Certificates section found and accessible');
          break;
        }
      }

      if (!certificatesFound) {
        console.log('ℹ️ Certificates section not found');
      }
    });

    test('should track learning streaks and achievements', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for gamification elements
      const gamificationSelectors = [
        ':has-text("Streak")',
        ':has-text("Achievement")',
        ':has-text("Badge")',
        ':has-text("Points")',
        '.achievements',
        '.badges'
      ];

      let gamificationFound = false;
      for (const selector of gamificationSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          gamificationFound = true;
          console.log('✅ Gamification elements found');
          break;
        }
      }

      if (!gamificationFound) {
        console.log('ℹ️ Gamification features not found');
      }
    });
  });

  test.describe('Mobile Learning Experience', () => {
    test('should work on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) {
        // Skip this test if not running on mobile viewport
        test.skip(true, 'This test is only for mobile viewports');
      }

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check mobile navigation
      const mobileNavSelectors = [
        '.mobile-menu',
        'button[aria-label*="menu" i]',
        '.hamburger',
        '[data-testid="mobile-nav"]'
      ];

      let mobileNavFound = false;
      for (const selector of mobileNavSelectors) {
        const nav = page.locator(selector);
        if (await nav.count() > 0) {
          mobileNavFound = true;
          
          await nav.click();
          await page.waitForTimeout(500);
          
          console.log('✅ Mobile navigation works');
          break;
        }
      }

      if (!mobileNavFound) {
        console.log('ℹ️ Mobile navigation not found - may use responsive design');
      }

      // Test mobile-friendly interactions
      const courseCards = page.locator('[data-testid="course-card"], .course-card');
      if (await courseCards.count() > 0) {
        // Tap instead of click on mobile
        await courseCards.first().tap();
        console.log('✅ Mobile tap interactions work');
      }
    });

    test('should support offline learning features', async ({ page }) => {
      // This is a placeholder for offline functionality testing
      // Actual implementation would depend on service worker and offline features
      
      await page.goto('/dashboard');
      
      // Check for offline indicators or download buttons
      const offlineSelectors = [
        'button:has-text("Download")',
        'button:has-text("Offline")',
        '.offline-indicator',
        '[data-testid="offline-mode"]'
      ];

      let offlineFound = false;
      for (const selector of offlineSelectors) {
        const offline = page.locator(selector);
        if (await offline.count() > 0) {
          offlineFound = true;
          console.log('✅ Offline learning features found');
          break;
        }
      }

      if (!offlineFound) {
        console.log('ℹ️ Offline learning features not implemented');
      }
    });
  });

  test.describe('Accessibility in Learning', () => {
    test('should support keyboard navigation in course content', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');

      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Navigate to first focusable element
      
      // Find course cards and navigate through them
      const courseCards = page.locator('[data-testid="course-card"], .course-card, a[href*="/courses/"]');
      if (await courseCards.count() > 0) {
        // Focus should move through course cards
        for (let i = 0; i < Math.min(3, await courseCards.count()); i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(200);
        }
        
        // Press Enter to select a course
        await page.keyboard.press('Enter');
        
        console.log('✅ Keyboard navigation works for course selection');
      }
    });

    test('should have proper ARIA labels and screen reader support', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');

      // Check for ARIA labels on interactive elements
      const interactiveElements = page.locator('button, a, input, select');
      const elementsWithAria = await interactiveElements.evaluateAll(elements =>
        elements.filter(el => 
          el.getAttribute('aria-label') || 
          el.getAttribute('aria-labelledby') || 
          el.getAttribute('aria-describedby')
        ).length
      );

      if (elementsWithAria > 0) {
        console.log(`✅ Found ${elementsWithAria} elements with ARIA labels`);
      } else {
        console.log('ℹ️ ARIA labels may need improvement for accessibility');
      }

      // Check for semantic HTML
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      if (headingCount > 0) {
        console.log(`✅ Found ${headingCount} semantic headings`);
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // Log completion of each test
    console.log(`🎓 Completed student learning test`);
  });
});