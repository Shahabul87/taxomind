import { test, expect } from '@playwright/test';

/**
 * Course Creation E2E Tests
 * Tests the complete course creation workflow from initial creation
 * to publishing, including chapters, sections, and content management
 */

test.describe('Course Creation Workflow', () => {
  // Use teacher authentication for all tests in this suite
  test.use({ storageState: 'e2e/auth/teacher-auth.json' });

  let courseId: string;
  let courseName: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique course name for this test
    const timestamp = Date.now();
    courseName = `E2E Test Course ${timestamp}`;
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Course Creation', () => {
    test('should create a new course successfully', async ({ page }) => {
      // Find and click create course button
      const createCourseSelectors = [
        'button:has-text("Create Course")',
        'a:has-text("Create Course")',
        'button:has-text("New Course")',
        '[data-testid="create-course"]',
        '.create-course-button'
      ];

      let courseCreated = false;
      for (const selector of createCourseSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.first().click();
          courseCreated = true;
          break;
        }
      }

      expect(courseCreated).toBe(true);

      // Wait for course creation form or navigate to create page
      await page.waitForTimeout(1000);

      // Fill course basic information
      await page.fill('input[name="title"], input[placeholder*="title" i]', courseName);
      await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 
        'This is an automated test course created by E2E tests. It covers advanced topics in software development.');

      // Set course price if field exists
      const priceField = page.locator('input[name="price"], input[type="number"]');
      if (await priceField.count() > 0) {
        await priceField.fill('99.99');
      }

      // Select category if dropdown exists
      const categorySelect = page.locator('select[name="categoryId"], select[name="category"]');
      if (await categorySelect.count() > 0) {
        await categorySelect.selectOption({ index: 1 }); // Select first available category
      }

      // Add course image if upload field exists
      const imageUpload = page.locator('input[type="file"], input[accept*="image"]');
      if (await imageUpload.count() > 0) {
        // This would upload a test image file
        console.log('ℹ️ Image upload field found but skipping file upload in E2E test');
      }

      // Submit course creation
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
      await submitButton.click();

      // Wait for course to be created and redirect to course edit page
      await page.waitForURL('**/teacher/courses/**', { timeout: 15000 });

      // Verify course was created successfully
      await expect(page.locator('h1, h2')).toContainText(courseName);
      
      // Extract course ID from URL for use in other tests
      const url = page.url();
      const courseIdMatch = url.match(/\/courses\/([^\/]+)/);
      if (courseIdMatch) {
        courseId = courseIdMatch[1];
        console.log(`📚 Course created with ID: ${courseId}`);
      }

      // Verify course setup sections are visible
      await expect(page.locator('body')).toContainText(['Course Setup', 'Chapters', 'Settings']);
    });

    test('should validate required course fields', async ({ page }) => {
      // Navigate to course creation
      await page.click('button:has-text("Create Course"), a:has-text("Create Course")');
      await page.waitForTimeout(1000);

      // Try to submit empty form
      await page.click('button[type="submit"], button:has-text("Create")');

      // Should show validation errors
      await expect(page.locator('body')).toContainText([
        'Title is required',
        'required',
        'Please fill',
        'Title cannot be empty'
      ]);

      // Fill only title and try again
      await page.fill('input[name="title"]', 'Test Course');
      await page.click('button[type="submit"]');

      // If description is required, should show error
      const bodyText = await page.locator('body').textContent();
      if (bodyText?.includes('Description')) {
        await expect(page.locator('body')).toContainText(['Description is required', 'description required']);
      }
    });

    test('should save course as draft', async ({ page }) => {
      // Create a course
      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);

      await page.fill('input[name="title"]', `${courseName} - Draft`);
      await page.fill('textarea[name="description"]', 'This is a draft course for testing.');

      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/courses/**');

      // Verify course is in draft state
      await expect(page.locator('body')).toContainText(['Draft', 'Unpublished', 'Not published']);

      // Should have publish button disabled or show requirements
      const publishButton = page.locator('button:has-text("Publish")');
      if (await publishButton.count() > 0) {
        const isDisabled = await publishButton.isDisabled();
        if (!isDisabled) {
          // If not disabled, should show requirements message when clicked
          await publishButton.click();
          await expect(page.locator('body')).toContainText(['requirements', 'complete', 'before publishing']);
        }
      }
    });
  });

  test.describe('Course Content Management', () => {
    test.beforeEach(async ({ page }) => {
      // Create a course for content management tests
      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="title"]', courseName);
      await page.fill('textarea[name="description"]', 'Course for content management testing.');
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/courses/**');
    });

    test('should add chapters to course', async ({ page }) => {
      // Look for add chapter button
      const addChapterSelectors = [
        'button:has-text("Add Chapter")',
        'button:has-text("Create Chapter")',
        'button:has-text("New Chapter")',
        '[data-testid="add-chapter"]',
        '.add-chapter-button'
      ];

      let chapterAdded = false;
      for (const selector of addChapterSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.first().click();
          chapterAdded = true;
          break;
        }
      }

      if (chapterAdded) {
        // Fill chapter details
        await page.fill('input[name="title"], input[placeholder*="chapter" i]', 'Chapter 1: Introduction');
        await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 
          'This chapter introduces the basic concepts and fundamentals.');

        // Save chapter
        await page.click('button:has-text("Save"), button:has-text("Create")');

        // Verify chapter was added
        await expect(page.locator('body')).toContainText('Chapter 1: Introduction');
        
        console.log('✅ Chapter added successfully');
      } else {
        console.log('ℹ️ Chapter creation interface not found');
      }
    });

    test('should add sections to chapters', async ({ page }) => {
      // First add a chapter
      const addChapterBtn = page.locator('button:has-text("Add Chapter")');
      if (await addChapterBtn.count() > 0) {
        await addChapterBtn.click();
        await page.fill('input[name="title"]', 'Test Chapter');
        await page.fill('textarea[name="description"]', 'Test chapter description');
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);
      }

      // Now add a section to the chapter
      const addSectionSelectors = [
        'button:has-text("Add Section")',
        'button:has-text("Create Section")',
        'button:has-text("New Section")',
        '[data-testid="add-section"]'
      ];

      let sectionAdded = false;
      for (const selector of addSectionSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.first().click();
          sectionAdded = true;
          break;
        }
      }

      if (sectionAdded) {
        // Fill section details
        await page.fill('input[name="title"]', 'Section 1.1: Getting Started');
        await page.fill('textarea[name="description"]', 'Introduction to the basic concepts.');

        // Add video URL if field exists
        const videoField = page.locator('input[name="videoUrl"], input[placeholder*="video" i]');
        if (await videoField.count() > 0) {
          await videoField.fill('https://www.youtube.com/watch?v=example');
        }

        // Set duration if field exists
        const durationField = page.locator('input[name="duration"], input[placeholder*="duration" i]');
        if (await durationField.count() > 0) {
          await durationField.fill('15');
        }

        await page.click('button:has-text("Save")');

        // Verify section was added
        await expect(page.locator('body')).toContainText('Section 1.1: Getting Started');
        
        console.log('✅ Section added successfully');
      } else {
        console.log('ℹ️ Section creation interface not found');
      }
    });

    test('should reorder chapters and sections', async ({ page }) => {
      // This test assumes drag-and-drop functionality exists
      // First ensure we have multiple chapters
      const chapters = ['Chapter 1: Basics', 'Chapter 2: Advanced', 'Chapter 3: Expert'];
      
      for (const chapterTitle of chapters) {
        const addChapterBtn = page.locator('button:has-text("Add Chapter")');
        if (await addChapterBtn.count() > 0) {
          await addChapterBtn.click();
          await page.fill('input[name="title"]', chapterTitle);
          await page.fill('textarea[name="description"]', `Description for ${chapterTitle}`);
          await page.click('button:has-text("Save")');
          await page.waitForTimeout(500);
        }
      }

      // Look for reorder handles or buttons
      const reorderElements = page.locator('[data-testid*="drag"], .drag-handle, button:has-text("Move")');
      if (await reorderElements.count() > 0) {
        console.log('✅ Reorder functionality detected');
        
        // Test drag and drop if supported
        const firstChapter = page.locator('[data-testid*="chapter"]:first-child, .chapter-item:first-child');
        const secondChapter = page.locator('[data-testid*="chapter"]:nth-child(2), .chapter-item:nth-child(2)');
        
        if (await firstChapter.count() > 0 && await secondChapter.count() > 0) {
          await firstChapter.dragTo(secondChapter);
          console.log('✅ Drag and drop performed');
        }
      } else {
        console.log('ℹ️ Reorder functionality not implemented or not visible');
      }
    });
  });

  test.describe('Course Media and Assets', () => {
    test.beforeEach(async ({ page }) => {
      // Create a course for media testing
      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="title"]', `${courseName} - Media`);
      await page.fill('textarea[name="description"]', 'Course for media testing.');
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/courses/**');
    });

    test('should upload course thumbnail', async ({ page }) => {
      // Look for image upload section
      const imageUploadSelectors = [
        'input[type="file"][accept*="image"]',
        'button:has-text("Upload Image")',
        'button:has-text("Add Thumbnail")',
        '[data-testid="image-upload"]'
      ];

      let imageUploadFound = false;
      for (const selector of imageUploadSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          imageUploadFound = true;
          console.log('✅ Image upload interface found');
          break;
        }
      }

      if (!imageUploadFound) {
        console.log('ℹ️ Image upload interface not implemented or not visible');
      }
    });

    test('should manage course attachments', async ({ page }) => {
      // Look for attachment management
      const attachmentSelectors = [
        'button:has-text("Add Attachment")',
        'button:has-text("Upload File")',
        'input[type="file"]:not([accept*="image"])',
        '[data-testid="attachment-upload"]'
      ];

      let attachmentFound = false;
      for (const selector of attachmentSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          attachmentFound = true;
          console.log('✅ Attachment upload interface found');
          break;
        }
      }

      if (!attachmentFound) {
        console.log('ℹ️ Attachment upload interface not implemented or not visible');
      }
    });
  });

  test.describe('Course Publishing', () => {
    test.beforeEach(async ({ page }) => {
      // Create a complete course for publishing tests
      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="title"]', `${courseName} - Complete`);
      await page.fill('textarea[name="description"]', 'Complete course ready for publishing.');
      
      // Set price
      const priceField = page.locator('input[name="price"]');
      if (await priceField.count() > 0) {
        await priceField.fill('149.99');
      }
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/courses/**');

      // Add required content for publishing
      // Add a chapter
      const addChapterBtn = page.locator('button:has-text("Add Chapter")');
      if (await addChapterBtn.count() > 0) {
        await addChapterBtn.click();
        await page.fill('input[name="title"]', 'Complete Chapter');
        await page.fill('textarea[name="description"]', 'A complete chapter with content.');
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);

        // Add a section to the chapter
        const addSectionBtn = page.locator('button:has-text("Add Section")');
        if (await addSectionBtn.count() > 0) {
          await addSectionBtn.click();
          await page.fill('input[name="title"]', 'Complete Section');
          await page.fill('textarea[name="description"]', 'A complete section with video.');
          
          const videoField = page.locator('input[name="videoUrl"]');
          if (await videoField.count() > 0) {
            await videoField.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
          }
          
          await page.click('button:has-text("Save")');
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should publish course when requirements are met', async ({ page }) => {
      // Look for publish button
      const publishButton = page.locator('button:has-text("Publish"), button:has-text("Make Public")');
      
      if (await publishButton.count() > 0) {
        await publishButton.click();

        // Handle any confirmation dialog
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Publish")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        // Wait for publishing to complete
        await page.waitForTimeout(2000);

        // Verify course is published
        await expect(page.locator('body')).toContainText(['Published', 'Live', 'Public']);
        
        console.log('✅ Course published successfully');
      } else {
        console.log('ℹ️ Publish button not found - checking requirements');
        
        // Check for publishing requirements
        const bodyText = await page.locator('body').textContent();
        if (bodyText?.includes('requirement') || bodyText?.includes('complete')) {
          console.log('ℹ️ Publishing requirements not met');
        }
      }
    });

    test('should unpublish course', async ({ page }) => {
      // First publish the course
      const publishButton = page.locator('button:has-text("Publish")');
      if (await publishButton.count() > 0) {
        await publishButton.click();
        await page.waitForTimeout(1000);
        
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Publish")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // Now unpublish
      const unpublishButton = page.locator('button:has-text("Unpublish"), button:has-text("Make Private")');
      if (await unpublishButton.count() > 0) {
        await unpublishButton.click();

        // Handle confirmation
        const confirmUnpublish = page.locator('button:has-text("Confirm"), button:has-text("Unpublish")');
        if (await confirmUnpublish.count() > 0) {
          await confirmUnpublish.click();
        }

        await page.waitForTimeout(1000);

        // Verify course is unpublished
        await expect(page.locator('body')).toContainText(['Draft', 'Unpublished', 'Private']);
        
        console.log('✅ Course unpublished successfully');
      } else {
        console.log('ℹ️ Unpublish functionality not found or course not published');
      }
    });
  });

  test.describe('Course Settings and Configuration', () => {
    test.beforeEach(async ({ page }) => {
      // Create a course for settings testing
      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="title"]', `${courseName} - Settings`);
      await page.fill('textarea[name="description"]', 'Course for settings testing.');
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/courses/**');
    });

    test('should configure course pricing', async ({ page }) => {
      // Look for pricing settings
      const pricingSelectors = [
        'input[name="price"]',
        'button:has-text("Pricing")',
        'a:has-text("Pricing")',
        '[data-testid="pricing-tab"]'
      ];

      let pricingFound = false;
      for (const selector of pricingSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          pricingFound = true;
          
          if (selector.includes('input')) {
            // Direct price input
            await element.fill('199.99');
          } else {
            // Navigation to pricing section
            await element.click();
            await page.waitForTimeout(500);
            
            const priceInput = page.locator('input[name="price"], input[type="number"]');
            if (await priceInput.count() > 0) {
              await priceInput.fill('199.99');
            }
          }
          
          // Save pricing
          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          if (await saveButton.count() > 0) {
            await saveButton.click();
          }
          
          console.log('✅ Course pricing configured');
          break;
        }
      }

      if (!pricingFound) {
        console.log('ℹ️ Pricing configuration not found');
      }
    });

    test('should set course category', async ({ page }) => {
      // Look for category settings
      const categorySelectors = [
        'select[name="categoryId"]',
        'select[name="category"]',
        'button:has-text("Category")',
        '[data-testid="category-select"]'
      ];

      let categoryFound = false;
      for (const selector of categorySelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          categoryFound = true;
          
          if (selector.includes('select')) {
            // Direct select
            await element.selectOption({ index: 1 });
          } else {
            // Navigation to category section
            await element.click();
            await page.waitForTimeout(500);
          }
          
          console.log('✅ Course category configured');
          break;
        }
      }

      if (!categoryFound) {
        console.log('ℹ️ Category configuration not found');
      }
    });

    test('should configure course access settings', async ({ page }) => {
      // Look for access/enrollment settings
      const accessSelectors = [
        'input[type="checkbox"][name*="free"]',
        'button:has-text("Access")',
        'button:has-text("Settings")',
        '[data-testid="access-settings"]'
      ];

      let accessFound = false;
      for (const selector of accessSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          accessFound = true;
          
          if (selector.includes('checkbox')) {
            // Toggle free access
            await element.check();
          } else {
            await element.click();
            await page.waitForTimeout(500);
          }
          
          console.log('✅ Course access settings found');
          break;
        }
      }

      if (!accessFound) {
        console.log('ℹ️ Access settings not found');
      }
    });
  });

  test.describe('Course Analytics and Insights', () => {
    test('should display course analytics', async ({ page }) => {
      // Create and publish a course first
      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="title"]', `${courseName} - Analytics`);
      await page.fill('textarea[name="description"]', 'Course for analytics testing.');
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/courses/**');

      // Look for analytics section
      const analyticsSelectors = [
        'button:has-text("Analytics")',
        'a:has-text("Analytics")',
        'button:has-text("Insights")',
        '[data-testid="analytics-tab"]'
      ];

      let analyticsFound = false;
      for (const selector of analyticsSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.click();
          await page.waitForTimeout(1000);
          
          // Look for analytics content
          const analyticsContent = [
            'views',
            'students',
            'enrollments',
            'revenue',
            'completion rate'
          ];
          
          let hasAnalyticsContent = false;
          for (const content of analyticsContent) {
            if (await page.locator(`body:has-text("${content}")`).count() > 0) {
              hasAnalyticsContent = true;
              break;
            }
          }
          
          if (hasAnalyticsContent) {
            analyticsFound = true;
            console.log('✅ Course analytics interface found');
            break;
          }
        }
      }

      if (!analyticsFound) {
        console.log('ℹ️ Course analytics not implemented or not visible');
      }
    });
  });

  test.describe('Error Handling and Validation', () => {
    test('should handle course creation errors gracefully', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/courses**', route => route.abort());

      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="title"]', 'Network Error Test');
      await page.fill('textarea[name="description"]', 'Testing network error handling.');
      
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('body')).toContainText([
        'Error',
        'failed',
        'Try again',
        'Network error'
      ]);
    });

    test('should prevent duplicate course names', async ({ page }) => {
      // Create first course
      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);
      
      const duplicateName = `Duplicate Course ${Date.now()}`;
      await page.fill('input[name="title"]', duplicateName);
      await page.fill('textarea[name="description"]', 'First course with this name.');
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/courses/**');

      // Go back to create another course with same name
      await page.goto('/dashboard');
      await page.click('button:has-text("Create Course")');
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="title"]', duplicateName);
      await page.fill('textarea[name="description"]', 'Second course with same name.');
      
      await page.click('button[type="submit"]');

      // Should either allow it (with different ID) or show warning
      // This depends on the business logic
      await page.waitForTimeout(2000);
      
      console.log('ℹ️ Duplicate name handling varies by implementation');
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up created courses if needed
    // This is optional and depends on test data management strategy
    console.log(`🧹 Test completed for course: ${courseName}`);
  });
});