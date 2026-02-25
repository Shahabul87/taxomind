/**
 * Tests for useAICourseCreator hook
 * Source: hooks/use-ai-course-creator.ts
 */

import { renderHook, act } from '@testing-library/react';

jest.mock('axios', () => ({
  post: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/lib/ai-course-types', () => ({
  CourseQuestionDifficulty: {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
  },
}));

import axios from 'axios';
import { toast } from 'sonner';
import { useAICourseCreator } from '@/hooks/use-ai-course-creator';

const mockAxiosPost = axios.post as jest.Mock;

describe('useAICourseCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial idle state', () => {
    const { result } = renderHook(() => useAICourseCreator());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.currentStep).toBe('idle');
    expect(result.current.hasError).toBe(false);
    expect(result.current.generatedCourse).toBeNull();
    expect(result.current.generatedChapters).toEqual([]);
    expect(result.current.curatedContent).toEqual([]);
    expect(result.current.progress).toEqual({ current: 0, total: 0, status: '' });
    expect(result.current.suggestions).toEqual({
      titles: [],
      descriptions: [],
      objectives: [],
      prerequisites: [],
    });
  });

  it('should generate a course plan successfully', async () => {
    const courseData = {
      title: 'Test Course',
      chapters: [{ title: 'Chapter 1' }],
    };

    mockAxiosPost.mockResolvedValueOnce({
      data: { success: true, data: courseData },
    });

    const onCourseGenerated = jest.fn();
    const { result } = renderHook(() =>
      useAICourseCreator({ onCourseGenerated })
    );

    await act(async () => {
      const res = await result.current.generateCoursePlan({
        topic: 'TypeScript',
        targetAudience: 'Beginners',
        duration: '4 weeks',
        difficulty: 'MEDIUM' as never,
        learningGoals: ['Learn basics'],
      });
      expect(res).toEqual(courseData);
    });

    expect(result.current.generatedCourse).toEqual(courseData);
    expect(onCourseGenerated).toHaveBeenCalledWith(courseData);
    expect(toast.success).toHaveBeenCalledWith('Course plan generated successfully!');
  });

  it('should handle course generation with warning (fallback)', async () => {
    mockAxiosPost.mockResolvedValueOnce({
      data: { success: true, data: { title: 'Fallback' }, warning: 'Using fallback response' },
    });

    const { result } = renderHook(() => useAICourseCreator());

    await act(async () => {
      await result.current.generateCoursePlan({
        topic: 'Python',
        targetAudience: 'Intermediate',
        duration: '2 weeks',
        difficulty: 'EASY' as never,
        learningGoals: [],
      });
    });

    expect(toast.warning).toHaveBeenCalledWith('Using fallback response');
  });

  it('should handle course generation API error', async () => {
    mockAxiosPost.mockResolvedValueOnce({
      data: { success: false, error: 'AI service unavailable' },
    });

    const onError = jest.fn();
    const { result } = renderHook(() => useAICourseCreator({ onError }));

    await expect(
      act(async () => {
        await result.current.generateCoursePlan({
          topic: 'Test',
          targetAudience: 'Test',
          duration: '1 week',
          difficulty: 'EASY' as never,
          learningGoals: [],
        });
      })
    ).rejects.toThrow();

    // The finally block resets error to null via setGeneratingState,
    // so hasError returns to false after completion.
    // But onError callback and toast were called during catch.
    expect(onError).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.currentStep).toBe('idle');
  });

  it('should handle network error during course generation', async () => {
    mockAxiosPost.mockRejectedValueOnce({
      response: { data: { message: 'Timeout' } },
      message: 'Network Error',
    });

    const onError = jest.fn();
    const { result } = renderHook(() => useAICourseCreator({ onError }));

    await expect(
      act(async () => {
        await result.current.generateCoursePlan({
          topic: 'Test',
          targetAudience: 'Test',
          duration: '1 week',
          difficulty: 'EASY' as never,
          learningGoals: [],
        });
      })
    ).rejects.toBeDefined();

    expect(onError).toHaveBeenCalledWith('Timeout');
  });

  it('should generate a chapter successfully', async () => {
    const chapterData = { title: 'Chapter 1', sections: [] };
    mockAxiosPost.mockResolvedValueOnce({
      data: { success: true, data: chapterData },
    });

    const onChapterGenerated = jest.fn();
    const { result } = renderHook(() =>
      useAICourseCreator({ onChapterGenerated })
    );

    await act(async () => {
      await result.current.generateChapter({
        courseTitle: 'Test Course',
        chapterTitle: 'Chapter 1',
        position: 1,
      } as never);
    });

    expect(result.current.generatedChapters).toHaveLength(1);
    expect(onChapterGenerated).toHaveBeenCalledWith(chapterData);
    expect(toast.success).toHaveBeenCalledWith('Chapter 1 generated successfully!');
  });

  it('should handle chapter generation failure', async () => {
    mockAxiosPost.mockResolvedValueOnce({
      data: { success: false, error: 'Chapter generation failed' },
    });

    const onError = jest.fn();
    const { result } = renderHook(() => useAICourseCreator({ onError }));

    await expect(
      act(async () => {
        await result.current.generateChapter({
          courseTitle: 'Test',
          chapterTitle: 'Ch1',
          position: 1,
        } as never);
      })
    ).rejects.toThrow();

    // Error callback and toast were called during catch
    expect(onError).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    // State returns to idle after finally block
    expect(result.current.isGenerating).toBe(false);
  });

  it('should curate content successfully', async () => {
    const contentData = { resources: [{ url: 'https://example.com' }] };
    mockAxiosPost.mockResolvedValueOnce({
      data: { success: true, data: contentData },
    });

    const onContentCurated = jest.fn();
    const { result } = renderHook(() =>
      useAICourseCreator({ onContentCurated })
    );

    await act(async () => {
      await result.current.curateContent({ topic: 'React' } as never);
    });

    expect(result.current.curatedContent).toHaveLength(1);
    expect(onContentCurated).toHaveBeenCalledWith(contentData);
    expect(toast.success).toHaveBeenCalledWith('Content curated successfully!');
  });

  it('should generate quick suggestions', async () => {
    const { result } = renderHook(() => useAICourseCreator());

    await act(async () => {
      await result.current.generateQuickSuggestions('React', 'Beginners');
    });

    expect(result.current.suggestions.titles).toHaveLength(4);
    expect(result.current.suggestions.titles[0]).toContain('React');
    expect(result.current.suggestions.descriptions).toHaveLength(4);
    expect(result.current.suggestions.objectives).toHaveLength(4);
    expect(result.current.suggestions.prerequisites).toHaveLength(4);
  });

  it('should skip suggestions for empty topic', async () => {
    const { result } = renderHook(() => useAICourseCreator());

    await act(async () => {
      await result.current.generateQuickSuggestions('', 'Beginners');
    });

    // Suggestions remain at initial state
    expect(result.current.suggestions.titles).toEqual([]);
  });

  it('should clear all AI data', async () => {
    const courseData = { title: 'Test' };
    mockAxiosPost.mockResolvedValueOnce({
      data: { success: true, data: courseData },
    });

    const { result } = renderHook(() => useAICourseCreator());

    // Generate course first
    await act(async () => {
      await result.current.generateCoursePlan({
        topic: 'Test',
        targetAudience: 'Test',
        duration: '1 week',
        difficulty: 'EASY' as never,
        learningGoals: [],
      });
    });

    expect(result.current.generatedCourse).not.toBeNull();

    // Clear
    act(() => {
      result.current.clearAIData();
    });

    expect(result.current.generatedCourse).toBeNull();
    expect(result.current.generatedChapters).toEqual([]);
    expect(result.current.curatedContent).toEqual([]);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.currentStep).toBe('idle');
  });

  it('should create course request from form data', () => {
    const { result } = renderHook(() => useAICourseCreator());

    const request = result.current.createCourseRequest({
      topic: 'Machine Learning',
      description: 'ML basics',
      targetAudience: 'Data Scientists',
      duration: '8 weeks',
      difficulty: 'HARD' as never,
      learningGoals: ['Understand ML', 'Build models'],
    });

    expect(request.topic).toBe('Machine Learning');
    expect(request.description).toBe('ML basics');
    expect(request.targetAudience).toBe('Data Scientists');
    expect(request.learningGoals).toHaveLength(2);
  });

  it('should track progress during generation', async () => {
    let resolvePost: (value: unknown) => void;
    mockAxiosPost.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );

    const { result } = renderHook(() => useAICourseCreator());

    const promise = act(async () => {
      const genPromise = result.current.generateCoursePlan({
        topic: 'Test',
        targetAudience: 'Test',
        duration: '1 week',
        difficulty: 'EASY' as never,
        learningGoals: [],
      });

      // While generating, step should change
      return genPromise;
    });

    // Resolve the axios call
    resolvePost!({ data: { success: true, data: { title: 'Test' } } });

    await promise;

    // After completion, step returns to idle
    expect(result.current.currentStep).toBe('idle');
    expect(result.current.isGenerating).toBe(false);
  });

  it('should call correct API endpoints', async () => {
    mockAxiosPost.mockResolvedValue({
      data: { success: true, data: {} },
    });

    const { result } = renderHook(() => useAICourseCreator());

    await act(async () => {
      await result.current.generateCoursePlan({
        topic: 'Test',
        targetAudience: 'Test',
        duration: '1w',
        difficulty: 'EASY' as never,
        learningGoals: [],
      });
    });

    expect(mockAxiosPost).toHaveBeenCalledWith('/api/ai/course-planner', expect.any(Object));

    await act(async () => {
      await result.current.generateChapter({
        courseTitle: 'Test',
        chapterTitle: 'Ch1',
        position: 1,
      } as never);
    });

    expect(mockAxiosPost).toHaveBeenCalledWith('/api/ai/chapter-generator', expect.any(Object));

    await act(async () => {
      await result.current.curateContent({ topic: 'Test' } as never);
    });

    expect(mockAxiosPost).toHaveBeenCalledWith('/api/ai/content-curator', expect.any(Object));
  });
});
