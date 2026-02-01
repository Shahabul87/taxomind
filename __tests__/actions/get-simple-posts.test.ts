import { getSimplePosts } from '@/actions/get-simple-posts';
import { db } from '@/lib/db';

describe('getSimplePosts action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPosts = [
    {
      id: 'post-1',
      title: 'Understanding React Hooks',
      description: 'A comprehensive guide to React Hooks',
      imageUrl: 'https://example.com/hooks.jpg',
      isPublished: true,
      userId: 'author-1',
      categoryId: 'cat-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      category: {
        id: 'cat-1',
        name: 'Technology',
      },
      user: {
        id: 'author-1',
        name: 'Alice Johnson',
        image: 'https://example.com/alice.jpg',
      },
      _count: {
        comments: 25,
        replies: 50,
      },
    },
    {
      id: 'post-2',
      title: 'Vue.js Best Practices',
      description: 'Tips and tricks for Vue.js developers',
      imageUrl: 'https://example.com/vue.jpg',
      isPublished: true,
      userId: 'author-2',
      categoryId: 'cat-1',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
      category: {
        id: 'cat-1',
        name: 'Technology',
      },
      user: {
        id: 'author-2',
        name: 'Bob Smith',
        image: 'https://example.com/bob.jpg',
      },
      _count: {
        comments: 15,
        replies: 30,
      },
    },
  ];

  it('should return all published posts', async () => {
    (getSimplePosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await getSimplePosts();

    expect(result).toEqual(mockPosts);
    expect(getSimplePosts).toHaveBeenCalled();
  });

  it('should return empty array when no posts exist', async () => {
    (getSimplePosts as jest.Mock).mockResolvedValue([]);

    const result = await getSimplePosts();

    expect(result).toEqual([]);
  });

  it('should filter by userId when provided', async () => {
    const userPosts = [mockPosts[0]];
    (getSimplePosts as jest.Mock).mockResolvedValue(userPosts);

    const result = await getSimplePosts({ userId: 'author-1' });

    expect(getSimplePosts).toHaveBeenCalledWith({ userId: 'author-1' });
    expect(result).toEqual(userPosts);
  });

  it('should filter by category when categoryId provided', async () => {
    (getSimplePosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await getSimplePosts({ categoryId: 'cat-1' });

    expect(getSimplePosts).toHaveBeenCalledWith({ categoryId: 'cat-1' });
    expect(result).toEqual(mockPosts);
  });

  it('should limit results when take parameter provided', async () => {
    const limitedPosts = [mockPosts[0]];
    (getSimplePosts as jest.Mock).mockResolvedValue(limitedPosts);

    const result = await getSimplePosts({ take: 1 });

    expect(getSimplePosts).toHaveBeenCalledWith({ take: 1 });
    expect(result).toHaveLength(1);
  });

  it('should handle pagination with skip parameter', async () => {
    (getSimplePosts as jest.Mock).mockResolvedValue([mockPosts[1]]);

    const result = await getSimplePosts({ skip: 1, take: 1 });

    expect(getSimplePosts).toHaveBeenCalledWith({ skip: 1, take: 1 });
    expect(result).toEqual([mockPosts[1]]);
  });

  it('should order by updatedAt when specified', async () => {
    (getSimplePosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await getSimplePosts({ orderBy: 'updatedAt' });

    expect(getSimplePosts).toHaveBeenCalledWith({ orderBy: 'updatedAt' });
    expect(result).toEqual(mockPosts);
  });

  it('should handle database errors gracefully', async () => {
    (getSimplePosts as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(getSimplePosts()).rejects.toThrow('Database error');
  });

  it('should return post data with expected structure', async () => {
    (getSimplePosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await getSimplePosts();

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('description');
    expect(result[0]).toHaveProperty('category');
    expect(result[0]).toHaveProperty('user');
    expect(result[0]).toHaveProperty('_count');
  });

  it('should include comment and reply counts', async () => {
    (getSimplePosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await getSimplePosts();

    expect(result[0]._count.comments).toBe(25);
    expect(result[0]._count.replies).toBe(50);
    expect(result[1]._count.comments).toBe(15);
    expect(result[1]._count.replies).toBe(30);
  });

  it('should combine multiple filters', async () => {
    (getSimplePosts as jest.Mock).mockResolvedValue([mockPosts[0]]);

    const result = await getSimplePosts({
      userId: 'author-1',
      categoryId: 'cat-1',
      take: 5,
    });

    expect(getSimplePosts).toHaveBeenCalledWith({
      userId: 'author-1',
      categoryId: 'cat-1',
      take: 5,
    });
    expect(result).toEqual([mockPosts[0]]);
  });
});
