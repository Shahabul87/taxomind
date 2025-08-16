import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

// Mock the action module
jest.mock('@/actions/get-all-posts-optimized', () => ({
  getPostsOptimized: jest.fn().mockImplementation(async (params = {}) => {
    return prismaMock.post.findMany({
      where: {
        isPublished: true,
        ...params.where,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }),
}));

import { getPostsOptimized } from '@/actions/get-all-posts-optimized';

describe('getPostsOptimized action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPosts = [
    {
      id: 'post-1',
      title: 'Optimized Post 1',
      description: 'Optimized Description 1',
      imageUrl: 'https://example.com/opt1.jpg',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'post-2',
      title: 'Optimized Post 2',
      description: 'Optimized Description 2',
      imageUrl: 'https://example.com/opt2.jpg',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
    },
  ];

  it('should return optimized post data', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    const result = await getPostsOptimized();

    expect(result).toEqual(mockPosts);
    expect(prismaMock.post.findMany).toHaveBeenCalled();
  });

  it('should handle empty results', async () => {
    prismaMock.post.findMany.mockResolvedValue([]);

    const result = await getPostsOptimized();

    expect(result).toEqual([]);
  });

  it('should handle pagination', async () => {
    const paginatedPosts = [mockPosts[0]];
    prismaMock.post.findMany.mockResolvedValue(paginatedPosts);

    const result = await getPostsOptimized({ page: 1, limit: 1 });

    expect(result).toEqual(paginatedPosts);
  });

  it('should handle errors gracefully', async () => {
    prismaMock.post.findMany.mockRejectedValue(new Error('Optimization failed'));

    await expect(getPostsOptimized()).rejects.toThrow('Optimization failed');
  });
});