/**
 * E2E Test Types and Interfaces
 * Strict TypeScript types for Playwright E2E testing
 */

// User-related types based on Prisma schema
// NOTE: Users don't have roles - Admin auth is completely separate
export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  isTeacher: boolean;
  emailVerified: Date | null;
  image: string | null;
  isTwoFactorEnabled: boolean;
}

// Course-related types
export interface TestCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  isPublished: boolean;
  categoryId: string;
  imageUrl: string | null;
  userId: string; // course author
}

export interface TestChapter {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  courseId: string;
}

export interface TestSection {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  chapterId: string;
}

// Purchase and Enrollment types
export interface TestPurchase {
  id: string;
  userId: string;
  courseId: string;
  createdAt: Date;
}

export interface TestEnrollment {
  id: string;
  userId: string;
  courseId: string;
  createdAt: Date;
}

export interface TestUserCourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt: Date | null;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
}

// Progress tracking types
export interface TestUserChapterCompletion {
  id: string;
  userId: string;
  chapterId: string;
  startedAt: Date;
  completedAt: Date | null;
  progress: number;
  timeSpent: number;
}

export interface TestUserSectionCompletion {
  id: string;
  userId: string;
  sectionId: string;
  startedAt: Date;
  completedAt: Date | null;
  progress: number;
  timeSpent: number;
  attempts: number;
}

// AI Generation types
export interface TestAIContentGeneration {
  courseTitle: string;
  courseDescription: string;
  targetAudience: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  numberOfChapters: number;
  estimatedDuration: string;
}

export interface TestGeneratedCourse {
  title: string;
  description: string;
  chapters: Array<{
    title: string;
    description: string;
    sections: Array<{
      title: string;
      description: string;
      content: string;
    }>;
  }>;
}

// Page Object Model interfaces
export interface AuthPage {
  goto(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  register(userData: Partial<TestUser>): Promise<void>;
  logout(): Promise<void>;
  isLoggedIn(): Promise<boolean>;
}

export interface DashboardPage {
  goto(): Promise<void>;
  getCourseCount(): Promise<number>;
  getEnrolledCourses(): Promise<string[]>;
  navigateToSettings(): Promise<void>;
}

export interface CoursePage {
  goto(courseId: string): Promise<void>;
  enrollInCourse(): Promise<void>;
  startCourse(): Promise<void>;
  getProgress(): Promise<number>;
  completeChapter(chapterIndex: number): Promise<void>;
  isEnrolled(): Promise<boolean>;
}

export interface PaymentPage {
  goto(): Promise<void>;
  enterPaymentDetails(paymentData: PaymentDetails): Promise<void>;
  submitPayment(): Promise<void>;
  waitForPaymentConfirmation(): Promise<boolean>;
}

export interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  holderName: string;
  billingAddress: BillingAddress;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// AI Content Generation page interface
export interface AIContentPage {
  goto(): Promise<void>;
  fillCourseGenerationForm(data: TestAIContentGeneration): Promise<void>;
  generateCourse(): Promise<void>;
  waitForGeneration(): Promise<TestGeneratedCourse>;
  saveCourse(): Promise<string>; // returns courseId
}

// Test fixture types
export interface TestFixtures {
  users: TestUser[];
  courses: TestCourse[];
  chapters: TestChapter[];
  sections: TestSection[];
}

// Test context types
export interface E2ETestContext {
  user: TestUser | null;
  course: TestCourse | null;
  enrollment: TestUserCourseEnrollment | null;
  purchase: TestPurchase | null;
}

// Database operations interface
export interface DatabaseOperations {
  createUser(userData: Partial<TestUser>): Promise<TestUser>;
  createCourse(courseData: Partial<TestCourse>): Promise<TestCourse>;
  createChapter(chapterData: Partial<TestChapter>): Promise<TestChapter>;
  createSection(sectionData: Partial<TestSection>): Promise<TestSection>;
  enrollUserInCourse(userId: string, courseId: string): Promise<TestUserCourseEnrollment>;
  purchaseCourse(userId: string, courseId: string): Promise<TestPurchase>;
  getUserProgress(userId: string, courseId: string): Promise<TestUserCourseEnrollment | null>;
  cleanup(): Promise<void>;
}

// API response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Test result types
export interface E2ETestResult {
  testName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  error?: string;
  screenshots?: string[];
}

// Playwright page locators
export interface PageLocators {
  loginForm: {
    emailInput: string;
    passwordInput: string;
    submitButton: string;
    errorMessage: string;
  };
  registrationForm: {
    nameInput: string;
    emailInput: string;
    passwordInput: string;
    confirmPasswordInput: string;
    submitButton: string;
    successMessage: string;
  };
  coursePage: {
    enrollButton: string;
    startButton: string;
    progressBar: string;
    chapterList: string;
    completionStatus: string;
  };
  paymentForm: {
    cardNumberInput: string;
    expiryInput: string;
    cvvInput: string;
    nameInput: string;
    submitButton: string;
    successMessage: string;
    errorMessage: string;
  };
  aiContentForm: {
    titleInput: string;
    descriptionInput: string;
    audienceSelect: string;
    difficultySelect: string;
    chaptersInput: string;
    generateButton: string;
    saveButton: string;
    previewArea: string;
  };
}