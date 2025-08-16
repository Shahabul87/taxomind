import { getSimplePosts } from '@/actions/get-simple-posts';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
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
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
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
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    const result = await getSimplePosts();

    expect(result).toEqual(mockPosts);
    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        isPublished: true,
        userId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should return empty array when no posts exist', async () => {
    prismaMock.post.findMany.mockResolvedValue([]);

    const result = await getSimplePosts();

    expect(result).toEqual([]);
  });

  it('should filter by userId when provided', async () => {
    const userPosts = [mockPosts[0]];
    prismaMock.post.findMany.mockResolvedValue(userPosts);

    const result = await getSimplePosts({ userId: 'author-1' });

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        userId: 'author-1',
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(result).toEqual(userPosts);
  });

  it('should filter by category when categoryId provided', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    const result = await getSimplePosts({ categoryId: 'cat-1' });

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        categoryId: 'cat-1',
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should limit results when take parameter provided', async () => {
    const limitedPosts = [mockPosts[0]];
    prismaMock.post.findMany.mockResolvedValue(limitedPosts);

    const result = await getSimplePosts({ take: 1 });

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    expect(result).toHaveLength(1);
  });

  it('should handle pagination with skip parameter', async () => {
    prismaMock.post.findMany.mockResolvedValue([mockPosts[1]]);

    const result = await getSimplePosts({ skip: 1, take: 1 });

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
      skip: 1,
      take: 1,
    });
  });

  it('should order by updatedAt when specified', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    const result = await getSimplePosts({ orderBy: 'updatedAt' });

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
      },
      select: expect.any(Object),
      orderBy: {
        updatedAt: 'desc',
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    prismaMock.post.findMany.mockRejectedValue(new Error('Database error'));

    await expect(getSimplePosts()).rejects.toThrow('Database error');
  });

  it('should only select minimal post data', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    await getSimplePosts();

    const calledWith = prismaMock.post.findMany.mock.calls[0][0];
    
    // Verify only selecting what's needed
    expect(calledWith.select).not.toHaveProperty('content');
    expect(calledWith.select).not.toHaveProperty('postchapters');
    expect(calledWith.select).toHaveProperty('id');
    expect(calledWith.select).toHaveProperty('title');
    expect(calledWith.select).toHaveProperty('description');
  });

  it('should include comment and reply counts', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    const result = await getSimplePosts();

    expect(result[0].comments).toHaveLength(1);
    expect(result[1].comments).toHaveLength(1);
  });

  it('should combine multiple filters', async () => {
    prismaMock.post.findMany.mockResolvedValue([mockPosts[0]]);

    const result = await getSimplePosts({
      userId: 'author-1',
      categoryId: 'cat-1',
      take: 5,
    });

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        userId: 'author-1',
        categoryId: 'cat-1',
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
  });
});