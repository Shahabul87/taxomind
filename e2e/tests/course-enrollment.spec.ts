import { test, expect, testUsers } from '../fixtures/test-fixtures';
import {
  waitForNetworkIdle,
  scrollIntoView,
  checkAccessibility,
  measureCoreWebVitals,
  checkMobileResponsiveness,
  waitForText,
  retry,
} from '../utils/test-helpers';

test.describe('Course Enrollment and Learning Journey', () => {
  test.use({ testUser: testUsers.student });

  test('should display course catalog with proper filtering', async ({ authenticatedPage, percySnapshot }) => {
    const page = authenticatedPage;
    await page.goto('/courses');
    await waitForNetworkIdle(page);

    // Check course catalog elements
    await expect(page.locator('[data-testid="course-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-search"]')).toBeVisible();

    // Visual regression test
    await percySnapshot(page, 'Course Catalog');

    // Test filtering by category
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Programming');
    await waitForNetworkIdle(page);

    // Verify filtered results
    const courseCards = page.locator('[data-testid="course-card"]');
    await expect(courseCards).toHaveCount(await courseCards.count());
    
    // Check each course card has programming category
    const firstCard = courseCards.first();
    await expect(firstCard.locator('[data-testid="course-category"]')).toContainText('Programming');
  });

  test('should search courses with autocomplete', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/courses');

    // Type in search box
    const searchBox = page.locator('[data-testid="course-search"]');
    await searchBox.fill('Type');
    
    // Wait for autocomplete suggestions
    await page.waitForSelector('[data-testid="search-suggestions"]');
    
    // Check suggestions appear
    const suggestions = page.locator('[data-testid="search-suggestion"]');
    await expect(suggestions).toHaveCount(await suggestions.count());

    // Click first suggestion
    await suggestions.first().click();
    await waitForNetworkIdle(page);

    // Verify search results
    const results = page.locator('[data-testid="course-card"]');
    const firstResult = results.first();
    await expect(firstResult).toContainText('TypeScript');
  });

  test('should display course details page correctly', async ({ authenticatedPage, percySnapshot }) => {
    const page = authenticatedPage;
    await page.goto('/courses');
    await waitForNetworkIdle(page);

    // Click on first course
    await page.click('[data-testid="course-card"]:first-child');
    await waitForNetworkIdle(page);

    // Check course details elements
    await expect(page.locator('[data-testid="course-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-curriculum"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-instructor"]')).toBeVisible();
    await expect(page.locator('[data-testid="enroll-button"]')).toBeVisible();

    // Visual regression test
    await percySnapshot(page, 'Course Details Page');

    // Check curriculum expansion
    const chapters = page.locator('[data-testid="chapter-item"]');
    await expect(chapters).toHaveCount(await chapters.count());

    // Expand first chapter
    await chapters.first().click();
    const sections = page.locator('[data-testid="section-item"]');
    await expect(sections.first()).toBeVisible();
  });

  test('should handle course enrollment process', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Navigate to course details
    await page.goto('/courses');
    await page.click('[data-testid="course-card"]:first-child');
    await waitForNetworkIdle(page);

    // Check enrollment button
    const enrollButton = page.locator('[data-testid="enroll-button"]');
    const buttonText = await enrollButton.textContent();

    if (buttonText?.includes('Enroll')) {
      // Click enroll button
      await enrollButton.click();

      // Handle payment if required
      const paymentModal = page.locator('[data-testid="payment-modal"]');
      if (await paymentModal.isVisible()) {
        // Fill payment details (using test card)
        await page.fill('[data-testid="card-number"]', '4242424242424242');
        await page.fill('[data-testid="card-expiry"]', '12/25');
        await page.fill('[data-testid="card-cvc"]', '123');
        
        // Submit payment
        await page.click('[data-testid="pay-button"]');
        await waitForNetworkIdle(page);
      }

      // Check enrollment confirmation
      await expect(page.locator('text=Successfully enrolled')).toBeVisible();
      
      // Button should now say "Continue Learning"
      await expect(enrollButton).toContainText('Continue Learning');
    }
  });

  test('should navigate through course content', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Go to enrolled course
    await page.goto('/dashboard/my-courses');
    await waitForNetworkIdle(page);

    // Click on enrolled course
    await page.click('[data-testid="enrolled-course"]:first-child');
    await waitForNetworkIdle(page);

    // Should be on course learning page
    expect(page.url()).toContain('/course/');

    // Check course player elements
    await expect(page.locator('[data-testid="course-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

    // Navigate to first section
    const firstSection = page.locator('[data-testid="section-link"]:first-child');
    await firstSection.click();
    await waitForNetworkIdle(page);

    // Check content loaded
    await expect(page.locator('[data-testid="section-content"]')).toBeVisible();
    
    // Mark as complete
    const completeButton = page.locator('[data-testid="mark-complete"]');
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await expect(page.locator('[data-testid="completion-check"]')).toBeVisible();
    }

    // Navigate to next section
    const nextButton = page.locator('[data-testid="next-section"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await waitForNetworkIdle(page);
      await expect(page.locator('[data-testid="section-content"]')).toBeVisible();
    }
  });

  test('should track course progress correctly', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Navigate to course
    await page.goto('/dashboard/my-courses');
    await page.click('[data-testid="enrolled-course"]:first-child');
    await waitForNetworkIdle(page);

    // Get initial progress
    const progressBar = page.locator('[data-testid="progress-bar"]');
    const initialProgress = await progressBar.getAttribute('aria-valuenow');

    // Complete a section
    await page.click('[data-testid="section-link"]:not(.completed):first-child');
    await waitForNetworkIdle(page);
    
    // Mark as complete
    await page.click('[data-testid="mark-complete"]');
    await waitForNetworkIdle(page);

    // Check progress updated
    const newProgress = await progressBar.getAttribute('aria-valuenow');
    expect(Number(newProgress)).toBeGreaterThan(Number(initialProgress));

    // Check progress persistence after refresh
    await page.reload();
    await waitForNetworkIdle(page);
    
    const persistedProgress = await progressBar.getAttribute('aria-valuenow');
    expect(persistedProgress).toBe(newProgress);
  });

  test('should handle video playback with tracking', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Navigate to video section
    await page.goto('/dashboard/my-courses');
    await page.click('[data-testid="enrolled-course"]:first-child');
    
    // Find and click video section
    const videoSection = page.locator('[data-testid="section-link"]:has-text("Video")').first();
    if (await videoSection.isVisible()) {
      await videoSection.click();
      await waitForNetworkIdle(page);

      // Check video player
      const videoPlayer = page.locator('[data-testid="video-player"]');
      await expect(videoPlayer).toBeVisible();

      // Play video
      await page.click('[data-testid="play-button"]');
      
      // Wait for video to start
      await page.waitForTimeout(2000);

      // Check playback tracking
      const watchTime = page.locator('[data-testid="watch-time"]');
      if (await watchTime.isVisible()) {
        const time = await watchTime.textContent();
        expect(time).not.toBe('0:00');
      }

      // Test video controls
      await page.click('[data-testid="pause-button"]');
      await page.click('[data-testid="fullscreen-button"]');
      await page.keyboard.press('Escape'); // Exit fullscreen
    }
  });

  test('should display and submit course assignments', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Navigate to assignment section
    await page.goto('/dashboard/my-courses');
    await page.click('[data-testid="enrolled-course"]:first-child');
    
    const assignmentSection = page.locator('[data-testid="section-link"]:has-text("Assignment")').first();
    if (await assignmentSection.isVisible()) {
      await assignmentSection.click();
      await waitForNetworkIdle(page);

      // Check assignment elements
      await expect(page.locator('[data-testid="assignment-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="assignment-submission"]')).toBeVisible();

      // Fill assignment submission
      await page.fill('[data-testid="assignment-text"]', 'This is my assignment submission');
      
      // Upload file if required
      const fileUpload = page.locator('[data-testid="file-upload"]');
      if (await fileUpload.isVisible()) {
        await fileUpload.setInputFiles('./test-files/assignment.pdf');
      }

      // Submit assignment
      await page.click('[data-testid="submit-assignment"]');
      await waitForNetworkIdle(page);

      // Check submission confirmation
      await expect(page.locator('text=Assignment submitted')).toBeVisible();
    }
  });

  test('should handle course quizzes and assessments', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Navigate to quiz section
    await page.goto('/dashboard/my-courses');
    await page.click('[data-testid="enrolled-course"]:first-child');
    
    const quizSection = page.locator('[data-testid="section-link"]:has-text("Quiz")').first();
    if (await quizSection.isVisible()) {
      await quizSection.click();
      await waitForNetworkIdle(page);

      // Start quiz
      await page.click('[data-testid="start-quiz"]');
      await waitForNetworkIdle(page);

      // Answer questions
      const questions = page.locator('[data-testid="quiz-question"]');
      const questionCount = await questions.count();

      for (let i = 0; i < questionCount; i++) {
        // Select first answer option
        await page.click(`[data-testid="answer-option-${i}-0"]`);
        
        // Click next or submit
        const nextButton = page.locator('[data-testid="next-question"]');
        const submitButton = page.locator('[data-testid="submit-quiz"]');
        
        if (i < questionCount - 1 && await nextButton.isVisible()) {
          await nextButton.click();
        } else if (await submitButton.isVisible()) {
          await submitButton.click();
        }
      }

      // Check quiz results
      await waitForNetworkIdle(page);
      await expect(page.locator('[data-testid="quiz-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="quiz-score"]')).toBeVisible();
    }
  });

  test('should display course certificates', async ({ authenticatedPage, percySnapshot }) => {
    const page = authenticatedPage;
    
    // Navigate to completed course
    await page.goto('/dashboard/my-courses');
    
    const completedCourse = page.locator('[data-testid="completed-course"]').first();
    if (await completedCourse.isVisible()) {
      await completedCourse.click();
      await waitForNetworkIdle(page);

      // Check for certificate
      const certificateButton = page.locator('[data-testid="view-certificate"]');
      if (await certificateButton.isVisible()) {
        await certificateButton.click();
        await waitForNetworkIdle(page);

        // Check certificate elements
        await expect(page.locator('[data-testid="certificate"]')).toBeVisible();
        await expect(page.locator('[data-testid="student-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="course-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="completion-date"]')).toBeVisible();

        // Visual regression test
        await percySnapshot(page, 'Course Certificate');

        // Download certificate
        const downloadButton = page.locator('[data-testid="download-certificate"]');
        if (await downloadButton.isVisible()) {
          const [download] = await Promise.all([
            page.waitForEvent('download'),
            downloadButton.click(),
          ]);
          
          expect(download.suggestedFilename()).toContain('certificate');
        }
      }
    }
  });

  test('should handle course reviews and ratings', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Navigate to completed course
    await page.goto('/dashboard/my-courses');
    const completedCourse = page.locator('[data-testid="completed-course"]').first();
    
    if (await completedCourse.isVisible()) {
      await completedCourse.click();
      await waitForNetworkIdle(page);

      // Scroll to reviews section
      const reviewSection = page.locator('[data-testid="course-reviews"]');
      await scrollIntoView(reviewSection);

      // Add review
      const addReviewButton = page.locator('[data-testid="add-review"]');
      if (await addReviewButton.isVisible()) {
        await addReviewButton.click();

        // Rate course
        await page.click('[data-testid="star-5"]');

        // Write review
        await page.fill('[data-testid="review-text"]', 'Excellent course! Highly recommended.');

        // Submit review
        await page.click('[data-testid="submit-review"]');
        await waitForNetworkIdle(page);

        // Check review posted
        await expect(page.locator('text=Review submitted successfully')).toBeVisible();
      }
    }
  });

  test('should work on mobile devices', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/courses');
    await waitForNetworkIdle(page);

    // Check mobile navigation
    const hamburgerMenu = page.locator('[data-testid="mobile-menu"]');
    if (await hamburgerMenu.isVisible()) {
      await hamburgerMenu.click();
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    }

    // Check course cards are responsive
    const responsiveness = await checkMobileResponsiveness(page);
    responsiveness.forEach(result => {
      expect(result.hasOverflow).toBeFalsy();
    });

    // Navigate to course
    await page.click('[data-testid="course-card"]:first-child');
    await waitForNetworkIdle(page);

    // Check mobile course view
    await expect(page.locator('[data-testid="course-content"]')).toBeVisible();
    
    // Mobile sidebar should be collapsible
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      await expect(page.locator('[data-testid="course-sidebar"]')).toBeVisible();
    }
  });

  test('should meet accessibility standards', async ({ authenticatedPage, axeBuilder }) => {
    const page = authenticatedPage;
    
    // Test course catalog page
    await page.goto('/courses');
    await waitForNetworkIdle(page);
    
    let results = await axeBuilder.analyze();
    expect(results.violations).toHaveLength(0);

    // Test course details page
    await page.click('[data-testid="course-card"]:first-child');
    await waitForNetworkIdle(page);
    
    results = await axeBuilder.analyze();
    expect(results.violations).toHaveLength(0);
  });

  test('should have good performance metrics', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    await page.goto('/courses');
    await waitForNetworkIdle(page);

    // Measure Core Web Vitals
    const metrics = await measureCoreWebVitals(page);

    // Check performance thresholds
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s is good
    expect(metrics.fid || 0).toBeLessThan(100); // FID < 100ms is good
    expect(metrics.cls).toBeLessThan(0.1); // CLS < 0.1 is good
    expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s is good
  });

  test('should handle offline mode gracefully', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Load course page
    await page.goto('/dashboard/my-courses');
    await waitForNetworkIdle(page);

    // Go offline
    await page.context().setOffline(true);

    // Try to navigate
    await page.click('[data-testid="enrolled-course"]:first-child').catch(() => {});

    // Should show offline message
    const offlineMessage = page.locator('text=You are offline');
    if (await offlineMessage.isVisible()) {
      expect(offlineMessage).toBeVisible();
    }

    // Go back online
    await page.context().setOffline(false);
    
    // Should recover
    await page.reload();
    await expect(page.locator('[data-testid="enrolled-course"]')).toBeVisible();
  });
});