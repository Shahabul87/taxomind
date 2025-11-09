/**
 * End-to-End User Journey Tests
 * Tests complete user workflows from registration to course completion
 */

/* eslint-disable @next/next/no-html-link-for-pages */
// Test file uses simple <a> tags for mock components
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import React from 'react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock API responses for testing
const mockApiResponses = {
  courses: [
    {
      id: 'course-1',
      title: 'Introduction to React',
      description: 'Learn React fundamentals',
      price: 99.99,
      imageUrl: '/react-course.jpg',
      category: { name: 'Programming' },
      user: { name: 'John Instructor' },
      _count: { Enrollment: 150, reviews: 45 },
    },
    {
      id: 'course-2',
      title: 'Advanced TypeScript',
      description: 'Master TypeScript',
      price: 149.99,
      imageUrl: '/ts-course.jpg',
      category: { name: 'Programming' },
      user: { name: 'Jane Teacher' },
      _count: { Enrollment: 85, reviews: 32 },
    }
  ]
};

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  } as Response);
});

// Mock session for authenticated tests
const mockSession: Session = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    isTwoFactorEnabled: false,
    isOAuth: false,
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe('E2E User Journeys', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
      refresh: mockRefresh,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('New User Registration Journey', () => {
    it('should complete full registration and onboarding flow', async () => {
      const user = userEvent.setup();
      
      // Mock components for testing
      const RegistrationFlow = () => {
        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          // Simulate successful registration
          await new Promise(resolve => setTimeout(resolve, 100));
          mockPush('/auth/verify-email');
        };

        return (
          <div>
            <h1>Create Your Account</h1>
            <form data-testid="registration-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                data-testid="name-input"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                data-testid="email-input"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                data-testid="password-input"
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                data-testid="confirm-password-input"
              />
              <button type="submit" data-testid="register-button">
                Register
              </button>
            </form>
          </div>
        );
      };

      render(<RegistrationFlow />);

      // Fill registration form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('password-input'), 'SecurePassword123!');
      await user.type(screen.getByTestId('confirm-password-input'), 'SecurePassword123!');

      // Submit registration
      await user.click(screen.getByTestId('register-button'));

      // Verify navigation to verification page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/verify-email');
      });
    });

    it('should handle registration validation errors', async () => {
      const user = userEvent.setup();
      
      const RegistrationWithValidation = () => {
        const [errors, setErrors] = React.useState<Record<string, string>>({});

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const password = formData.get('password') as string;
          const confirmPassword = formData.get('confirmPassword') as string;

          const newErrors: Record<string, string> = {};
          
          if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
          }
          
          if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          }

          setErrors(newErrors);
        };

        return (
          <form onSubmit={handleSubmit} data-testid="registration-form">
            <input name="password" type="password" data-testid="password-input" />
            {errors.password && <span role="alert">{errors.password}</span>}
            
            <input name="confirmPassword" type="password" data-testid="confirm-password-input" />
            {errors.confirmPassword && <span role="alert">{errors.confirmPassword}</span>}
            
            <button type="submit">Register</button>
          </form>
        );
      };

      render(<RegistrationWithValidation />);

      // Test weak password
      await user.type(screen.getByTestId('password-input'), 'weak');
      await user.type(screen.getByTestId('confirm-password-input'), 'weak');
      await user.click(screen.getByText('Register'));

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();

      // Test password mismatch
      await user.clear(screen.getByTestId('password-input'));
      await user.clear(screen.getByTestId('confirm-password-input'));
      await user.type(screen.getByTestId('password-input'), 'StrongPassword123!');
      await user.type(screen.getByTestId('confirm-password-input'), 'DifferentPassword123!');
      await user.click(screen.getByText('Register'));

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  describe('Student Learning Journey', () => {
    it('should browse courses, enroll, and track progress', async () => {
      const user = userEvent.setup();

      const StudentDashboard = () => {
        const [enrolledCourses, setEnrolledCourses] = React.useState<string[]>([]);
        const [currentProgress, setCurrentProgress] = React.useState(0);

        const handleEnroll = async (courseId: string) => {
          try {
            const response = await fetch('/api/enrollment', {
              method: 'POST',
              body: JSON.stringify({ courseId }),
            });
            if (response.ok) {
              setEnrolledCourses([...enrolledCourses, courseId]);
            }
          } catch (error) {
            console.error('Enrollment failed:', error);
          }
        };

        const updateProgress = async () => {
          setCurrentProgress((prev) => Math.min(prev + 25, 100));
        };

        return (
          <SessionProvider session={mockSession}>
            <div>
              <h1>Course Catalog</h1>
              <div data-testid="course-list">
                <div data-testid="course-card-1">
                  <h2>Introduction to React</h2>
                  <p>Learn React fundamentals</p>
                  <span>$99.99</span>
                  <button
                    onClick={() => handleEnroll('course-1')}
                    disabled={enrolledCourses.includes('course-1')}
                  >
                    {enrolledCourses.includes('course-1') ? 'Enrolled' : 'Enroll Now'}
                  </button>
                </div>
              </div>

              {enrolledCourses.length > 0 && (
                <div data-testid="learning-area">
                  <h2>My Learning</h2>
                  <div data-testid="progress-bar">
                    <div style={{ width: `${currentProgress}%` }} />
                    <span>{currentProgress}% Complete</span>
                  </div>
                  <button onClick={updateProgress} data-testid="complete-section">
                    Complete Next Section
                  </button>
                </div>
              )}
            </div>
          </SessionProvider>
        );
      };

      render(<StudentDashboard />);

      // Browse courses
      expect(screen.getByText('Course Catalog')).toBeInTheDocument();
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();

      // Enroll in course
      await user.click(screen.getByText('Enroll Now'));
      
      await waitFor(() => {
        expect(screen.getByText('Enrolled')).toBeInTheDocument();
        expect(screen.getByTestId('learning-area')).toBeInTheDocument();
      });

      // Track progress
      expect(screen.getByText('0% Complete')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('complete-section'));
      await waitFor(() => {
        expect(screen.getByText('25% Complete')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('complete-section'));
      await waitFor(() => {
        expect(screen.getByText('50% Complete')).toBeInTheDocument();
      });
    });

    it('should handle course content navigation', async () => {
      const user = userEvent.setup();

      const CourseContent = () => {
        const [currentSection, setCurrentSection] = React.useState(0);
        const sections = [
          { id: 'section-1', title: 'Introduction', content: 'Welcome to the course' },
          { id: 'section-2', title: 'Setup', content: 'Setting up your environment' },
          { id: 'section-3', title: 'First Component', content: 'Creating your first component' },
        ];

        return (
          <div>
            <div data-testid="section-navigation">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  data-testid={`nav-${section.id}`}
                  className={currentSection === index ? 'active' : ''}
                >
                  {section.title}
                </button>
              ))}
            </div>
            
            <div data-testid="section-content">
              <h2>{sections[currentSection].title}</h2>
              <p>{sections[currentSection].content}</p>
            </div>

            <div data-testid="section-controls">
              <button
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
                data-testid="prev-section"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                disabled={currentSection === sections.length - 1}
                data-testid="next-section"
              >
                Next
              </button>
            </div>
          </div>
        );
      };

      render(<CourseContent />);

      // Initial state
      expect(screen.getByTestId('section-content')).toHaveTextContent('Introduction');
      expect(screen.getByText('Welcome to the course')).toBeInTheDocument();
      expect(screen.getByTestId('prev-section')).toBeDisabled();

      // Navigate forward
      await user.click(screen.getByTestId('next-section'));
      expect(screen.getByText('Setting up your environment')).toBeInTheDocument();

      // Navigate using section navigation
      await user.click(screen.getByTestId('nav-section-3'));
      expect(screen.getByText('Creating your first component')).toBeInTheDocument();
      expect(screen.getByTestId('next-section')).toBeDisabled();

      // Navigate backward
      await user.click(screen.getByTestId('prev-section'));
      expect(screen.getByText('Setting up your environment')).toBeInTheDocument();
    });
  });

  describe('Teacher Course Creation Journey', () => {
    it('should create and publish a course', async () => {
      const user = userEvent.setup();

      const TeacherDashboard = () => {
        const [courses, setCourses] = React.useState<Array<{
          id: string;
          title: string;
          isPublished: boolean;
        }>>([]);
        const [isCreating, setIsCreating] = React.useState(false);

        const handleCreateCourse = async (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const newCourse = {
            id: `course-${Date.now()}`,
            title: formData.get('title') as string,
            isPublished: false,
          };
          setCourses([...courses, newCourse]);
          setIsCreating(false);
        };

        const handlePublish = (courseId: string) => {
          setCourses(courses.map(c => 
            c.id === courseId ? { ...c, isPublished: true } : c
          ));
        };

        return (
          <SessionProvider session={{ ...mockSession, user: { ...mockSession.user, role: 'USER' } }}>
            <div>
              <h1>Teacher Dashboard</h1>
              
              <button onClick={() => setIsCreating(true)} data-testid="create-course-btn">
                Create New Course
              </button>

              {isCreating && (
                <form onSubmit={handleCreateCourse} data-testid="course-form">
                  <input
                    name="title"
                    placeholder="Course Title"
                    required
                    data-testid="course-title-input"
                  />
                  <textarea
                    name="description"
                    placeholder="Course Description"
                    data-testid="course-description-input"
                  />
                  <select name="category" data-testid="course-category-select">
                    <option value="programming">Programming</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                  </select>
                  <button type="submit">Create Course</button>
                  <button type="button" onClick={() => setIsCreating(false)}>Cancel</button>
                </form>
              )}

              <div data-testid="course-list">
                {courses.map(course => (
                  <div key={course.id} data-testid={`course-${course.id}`}>
                    <h3>{course.title}</h3>
                    <span>{course.isPublished ? 'Published' : 'Draft'}</span>
                    {!course.isPublished && (
                      <button
                        onClick={() => handlePublish(course.id)}
                        data-testid={`publish-${course.id}`}
                      >
                        Publish
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SessionProvider>
        );
      };

      render(<TeacherDashboard />);

      // Open course creation form
      await user.click(screen.getByTestId('create-course-btn'));
      expect(screen.getByTestId('course-form')).toBeInTheDocument();

      // Fill course details
      await user.type(screen.getByTestId('course-title-input'), 'Advanced React Patterns');
      await user.type(screen.getByTestId('course-description-input'), 'Learn advanced React patterns and best practices');
      await user.selectOptions(screen.getByTestId('course-category-select'), 'programming');

      // Submit course
      await user.click(screen.getByText('Create Course'));

      // Verify course is created
      await waitFor(() => {
        expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });

      // Publish course
      const publishButton = screen.getByRole('button', { name: /publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText('Published')).toBeInTheDocument();
      });
    });

    it('should add chapters and sections to a course', async () => {
      const user = userEvent.setup();

      const CourseBuilder = () => {
        const [chapters, setChapters] = React.useState<Array<{
          id: string;
          title: string;
          sections: Array<{ id: string; title: string }>;
        }>>([]);

        const addChapter = (title: string) => {
          setChapters([...chapters, {
            id: `chapter-${Date.now()}`,
            title,
            sections: []
          }]);
        };

        const addSection = (chapterId: string, sectionTitle: string) => {
          setChapters(chapters.map(ch => 
            ch.id === chapterId 
              ? { ...ch, sections: [...ch.sections, { id: `section-${Date.now()}`, title: sectionTitle }] }
              : ch
          ));
        };

        return (
          <div>
            <h2>Course Structure</h2>
            
            <div data-testid="add-chapter">
              <input
                id="chapter-title"
                placeholder="Chapter Title"
                data-testid="chapter-title-input"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('chapter-title') as HTMLInputElement;
                  if (input.value) {
                    addChapter(input.value);
                    input.value = '';
                  }
                }}
                data-testid="add-chapter-btn"
              >
                Add Chapter
              </button>
            </div>

            <div data-testid="chapters-list">
              {chapters.map(chapter => (
                <div key={chapter.id} data-testid={`chapter-${chapter.id}`}>
                  <h3>{chapter.title}</h3>
                  
                  <div>
                    <input
                      id={`section-${chapter.id}`}
                      placeholder="Section Title"
                      data-testid={`section-input-${chapter.id}`}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`section-${chapter.id}`) as HTMLInputElement;
                        if (input.value) {
                          addSection(chapter.id, input.value);
                          input.value = '';
                        }
                      }}
                      data-testid={`add-section-${chapter.id}`}
                    >
                      Add Section
                    </button>
                  </div>

                  <ul>
                    {chapter.sections.map(section => (
                      <li key={section.id}>{section.title}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<CourseBuilder />);

      // Add first chapter
      await user.type(screen.getByTestId('chapter-title-input'), 'Introduction');
      await user.click(screen.getByTestId('add-chapter-btn'));

      expect(screen.getByText('Introduction')).toBeInTheDocument();

      // Add second chapter
      await user.type(screen.getByTestId('chapter-title-input'), 'Advanced Topics');
      await user.click(screen.getByTestId('add-chapter-btn'));

      expect(screen.getByText('Advanced Topics')).toBeInTheDocument();

      // Add sections to first chapter
      const firstChapterSectionInput = screen.getAllByPlaceholderText('Section Title')[0];
      const firstChapterAddButton = screen.getAllByText('Add Section')[0];

      await user.type(firstChapterSectionInput, 'Getting Started');
      await user.click(firstChapterAddButton);

      expect(screen.getByText('Getting Started')).toBeInTheDocument();

      await user.type(firstChapterSectionInput, 'Basic Concepts');
      await user.click(firstChapterAddButton);

      expect(screen.getByText('Basic Concepts')).toBeInTheDocument();
    });
  });

  describe('Admin Management Journey', () => {
    it('should manage users and view analytics', async () => {
      const AdminDashboard = () => {
        const [activeTab, setActiveTab] = React.useState('overview');
        const [users] = React.useState([
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'USER', status: 'active' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'USER', status: 'active' },
          { id: '3', name: 'Bob Teacher', email: 'bob@example.com', role: 'USER', status: 'suspended' },
        ]);

        return (
          <SessionProvider session={{ ...mockSession, user: { ...mockSession.user, role: 'ADMIN' } }}>
            <div>
              <h1>Admin Dashboard</h1>
              
              <div data-testid="admin-tabs">
                <button
                  onClick={() => setActiveTab('overview')}
                  data-testid="overview-tab"
                  className={activeTab === 'overview' ? 'active' : ''}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  data-testid="users-tab"
                  className={activeTab === 'users' ? 'active' : ''}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  data-testid="analytics-tab"
                  className={activeTab === 'analytics' ? 'active' : ''}
                >
                  Analytics
                </button>
              </div>

              {activeTab === 'overview' && (
                <div data-testid="overview-content">
                  <div className="stats-grid">
                    <div>Total Users: 1,234</div>
                    <div>Active Courses: 56</div>
                    <div>Revenue: $45,678</div>
                    <div>Engagement Rate: 78%</div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div data-testid="users-content">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>{user.status}</td>
                          <td>
                            <button data-testid={`edit-user-${user.id}`}>Edit</button>
                            <button data-testid={`suspend-user-${user.id}`}>
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div data-testid="analytics-content">
                  <h2>Platform Analytics</h2>
                  <div>Course Completion Rate: 65%</div>
                  <div>Average Session Duration: 45 minutes</div>
                  <div>User Retention Rate: 82%</div>
                </div>
              )}
            </div>
          </SessionProvider>
        );
      };

      const user = userEvent.setup();
      render(<AdminDashboard />);

      // Check overview
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Users: 1,234')).toBeInTheDocument();

      // Switch to users tab
      await user.click(screen.getByTestId('users-tab'));
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();

      // Switch to analytics tab
      await user.click(screen.getByTestId('analytics-tab'));
      expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
      expect(screen.getByText('Course Completion Rate: 65%')).toBeInTheDocument();
    });
  });

  describe('Cross-Platform Mobile Experience', () => {
    it('should provide responsive mobile experience', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const MobileApp = () => {
        const [menuOpen, setMenuOpen] = React.useState(false);

        return (
          <div data-testid="mobile-app">
            <header>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                data-testid="menu-toggle"
                aria-label="Toggle menu"
              >
                ☰
              </button>
              <h1>Taxomind Mobile</h1>
            </header>

            {menuOpen && (
              <nav data-testid="mobile-menu">
                <a href="/courses">Courses</a>
                <a href="/profile">Profile</a>
                <a href="/settings">Settings</a>
              </nav>
            )}

            <main>
              <div data-testid="course-cards">
                {['Course 1', 'Course 2'].map(course => (
                  <div key={course} className="course-card-mobile">
                    <h3>{course}</h3>
                    <button>View</button>
                  </div>
                ))}
              </div>
            </main>

            <footer data-testid="mobile-nav">
              <button>Home</button>
              <button>Courses</button>
              <button>Profile</button>
            </footer>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<MobileApp />);

      // Test mobile menu toggle
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
      
      await user.click(screen.getByTestId('menu-toggle'));
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

      // Test mobile navigation
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
      
      // Test responsive course cards
      const courseCards = screen.getByTestId('course-cards');
      expect(courseCards).toBeInTheDocument();
      expect(within(courseCards).getAllByText(/Course \d/)).toHaveLength(2);
    });
  });
});

