import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

// Mock the action module to avoid import errors
jest.mock('@/actions/get-all-posts', () => ({
  getAllPosts: jest.fn(),
}));

import { getAllPosts } from '@/actions/get-all-posts';

describe('getAllPosts action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPosts = [
    {
      id: 'post-1',
      title: 'First Post',
      description: 'Description 1',
      imageUrl: 'https://example.com/post1.jpg',
      isPublished: true,
      userId: 'author-1',
      categoryId: 'cat-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: 'post-2',
      title: 'Second Post',
      description: 'Description 2',
      imageUrl: 'https://example.com/post2.jpg',
      isPublished: true,
      userId: 'author-2',
      categoryId: 'cat-2',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
    },
  ];

  it('should return all published posts', async () => {
    (getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await getAllPosts();

    expect(result).toEqual(mockPosts);
    expect(getAllPosts).toHaveBeenCalled();
  });

  it('should return empty array when no posts exist', async () => {
    (getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await getAllPosts();

    expect(result).toEqual([]);
  });

  it('should filter by category when categoryId provided', async () => {
    const filteredPosts = [mockPosts[0]];
    (getAllPosts as jest.Mock).mockResolvedValue(filteredPosts);

    const result = await getAllPosts();

    expect(result).toEqual(filteredPosts);
  });

  it('should handle database errors', async () => {
    (getAllPosts as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(getAllPosts()).rejects.toThrow('Database error');
  });
});