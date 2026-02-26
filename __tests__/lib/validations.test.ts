/**
 * Tests for validation modules under lib/validations
 */

import {
  SearchInputSchema,
  validateSearchQuery,
  NewsletterSubscriptionSchema,
  CommentCreateSchema,
} from '@/lib/validations/blog';
import {
  CreateCourseSchema,
  CourseQuerySchema,
  validateCreateCourse,
  safeParseCourseQuery,
} from '@/lib/validations/course-schemas';
import { CreatePostSchema, UpdatePostSchema, DeletePostSchema } from '@/lib/validations/post';
import { GeneratePracticeSetSchema, SubmitPracticeAttemptSchema } from '@/lib/validations/practice-problems';
import { activitySchema, coursePlanSchema, studyPlanSchema } from '@/lib/validations/dashboard';

describe('lib/validations', () => {
  it('validates blog search query and strips invalid format', () => {
    expect(SearchInputSchema.safeParse({ query: 'TypeScript intro' }).success).toBe(true);
    expect(validateSearchQuery('valid keywords')).toBe('valid keywords');
    expect(validateSearchQuery('<script>alert(1)</script>')).toBeNull();
  });

  it('validates newsletter and comment sanitization', () => {
    const email = NewsletterSubscriptionSchema.parse({ email: 'TEST@Example.com' });
    expect(email.email).toBe('test@example.com');
    expect(NewsletterSubscriptionSchema.safeParse({ email: 'TEST@Example.com ' }).success).toBe(false);

    const comment = CommentCreateSchema.parse({ content: '<script>x</script><p>Hello</p>' });
    expect(comment.content).toContain('Hello');
  });

  it('validates course create/query schemas', () => {
    const course = validateCreateCourse({
      title: 'Advanced JS',
      description: 'A very good course description',
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      price: 99,
    });
    expect(course.title).toBe('Advanced JS');

    const query = CourseQuerySchema.parse({ page: '2', pageSize: '5', status: 'published' });
    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(5);

    const invalid = safeParseCourseQuery({ page: 0 });
    expect(invalid.success).toBe(false);
  });

  it('validates post schemas', () => {
    expect(CreatePostSchema.parse({ title: 'Post', category: 'AI' }).title).toBe('Post');
    expect(UpdatePostSchema.safeParse({ imageUrl: 'not-url' }).success).toBe(false);
    expect(DeletePostSchema.safeParse({ postId: 'not-cuid' }).success).toBe(false);
  });

  it('validates practice problem schemas with defaults', () => {
    const generated = GeneratePracticeSetSchema.parse({ topic: 'Algebra' });
    expect(generated.count).toBe(5);
    expect(generated.difficulty).toBe('intermediate');

    const attempt = SubmitPracticeAttemptSchema.parse({
      answers: [{ questionId: 'q1', answer: '42' }],
      timeSpent: 120,
    });
    expect(attempt.answers[0].hintsUsed).toBe(0);
  });

  it('validates dashboard schemas', () => {
    const activity = activitySchema.parse({ type: 'QUIZ', title: 'Weekly quiz' });
    expect(activity.priority).toBe('MEDIUM');

    const plan = coursePlanSchema.parse({
      title: 'Frontend Plan',
      startDate: '2026-01-01',
      daysPerWeek: 3,
      timePerSession: 60,
      difficultyLevel: 'BEGINNER',
      courseType: 'VIDEO',
    });
    expect(plan.studyReminders).toBe(true);

    const study = studyPlanSchema.safeParse({
      planType: 'new',
      title: 'New course plan',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      weeklyHoursGoal: 8,
      newCourseTitle: 'DSA',
    });
    expect(study.success).toBe(true);
  });
});
