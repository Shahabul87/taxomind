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
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: 'post-2',
      title: 'Optimized Post 2',
      description: 'Optimized Description 2',
      imageUrl: 'https://example.com/opt2.jpg',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
    },
  ];

  it('should return optimized post data', async () => {
    (getPostsOptimized as jest.Mock).mockResolvedValue(mockPosts);

    const result = await getPostsOptimized();

    expect(result).toEqual(mockPosts);
    expect(getPostsOptimized).toHaveBeenCalled();
  });

  it('should handle empty results', async () => {
    (getPostsOptimized as jest.Mock).mockResolvedValue([]);

    const result = await getPostsOptimized();

    expect(result).toEqual([]);
  });

  it('should handle pagination', async () => {
    const paginatedPosts = [mockPosts[0]];
    (getPostsOptimized as jest.Mock).mockResolvedValue(paginatedPosts);

    const result = await getPostsOptimized({ page: 1, limit: 1 });

    expect(result).toEqual(paginatedPosts);
  });

  it('should handle errors gracefully', async () => {
    (getPostsOptimized as jest.Mock).mockRejectedValue(new Error('Optimization failed'));

    await expect(getPostsOptimized()).rejects.toThrow('Optimization failed');
  });
});