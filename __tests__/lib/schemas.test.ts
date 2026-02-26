/**
 * Tests for lib/schemas/post.schemas.ts
 */

import {
  POST_VALIDATION,
  CreatePostClientSchema,
  CreatePostServerSchema,
  PostIdSchema,
  CategorySchema,
  validateCreatePostInput,
  safeValidateCreatePostInput,
  formatValidationErrors,
} from '@/lib/schemas/post.schemas';

describe('lib/schemas/post.schemas', () => {
  it('exposes expected validation constants', () => {
    expect(POST_VALIDATION.TITLE_MIN_LENGTH).toBe(3);
    expect(POST_VALIDATION.MAX_CATEGORIES).toBe(5);
  });

  it('sanitizes create post client input', () => {
    const data = CreatePostClientSchema.parse({
      title: '<b>Hello World</b>',
      categories: ['<script>AI</script>'],
    });

    expect(data.title).toBe('Hello World');
    expect(data.categories[0]).toBe('AI');
  });

  it('validates and sanitizes server input', () => {
    const out = validateCreatePostInput({
      title: '<h1>My Post</h1>',
      categories: ['Tech'],
    });

    expect(out.title).toBe('My Post');
  });

  it('safe validation returns error payload for invalid input', () => {
    const result = safeValidateCreatePostInput({ title: 'x' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    if (result.error) {
      const formatted = formatValidationErrors(result.error);
      expect(formatted.code).toBe('VALIDATION_ERROR');
      expect(formatted.details.title).toBeDefined();
    }
  });

  it('validates PostId and Category schemas', () => {
    expect(PostIdSchema.safeParse('not-a-uuid').success).toBe(false);

    const category = CategorySchema.parse('<b>Programming</b>');
    expect(category).toBe('Programming');
  });

  it('server schema enforces title length before sanitize', () => {
    expect(CreatePostServerSchema.safeParse({ title: 'ab' }).success).toBe(false);
    expect(CreatePostServerSchema.safeParse({ title: 'Valid Title' }).success).toBe(true);
  });
});
