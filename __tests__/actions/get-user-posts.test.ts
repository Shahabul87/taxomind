import { getUserPosts } from '@/actions/get-user-posts';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

describe('getUserPosts action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserPosts = [
    {
      id: 'post-1',
      title: 'My First Blog Post',
      description: 'Introduction to my blog',
      imageUrl: 'https://example.com/post1.jpg',
      isPublished: true,
      userId: 'user-1',
      categoryId: 'cat-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      category: {
        id: 'cat-1',
        name: 'Personal',
      },
      postchapters: [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          isPublished: true,
          position: 1,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          isPublished: false,
          position: 2,
        },
      ],
      _count: {
        comments: 10,
        replies: 20,
        postchapters: 2,
      },
    },
    {
      id: 'post-2',
      title: 'Advanced Topics',
      description: 'Deep dive into advanced topics',
      imageUrl: 'https://example.com/post2.jpg',
      isPublished: false,
      userId: 'user-1',
      categoryId: 'cat-2',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
      category: {
        id: 'cat-2',
        name: 'Technical',
      },
      postchapters: [],
      _count: {
        comments: 0,
        replies: 0,
        postchapters: 0,
      },
    },
  ];

  it('should return all posts for a user', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockUserPosts);

    const result = await getUserPosts();

    expect(result).toEqual(mockUserPosts);
    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
      },
      include: {
        category: true,
        postchapters: {
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
            replies: true,
            postchapters: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should return empty array when user has no posts', async () => {
    prismaMock.post.findMany.mockResolvedValue([]);

    const result = await getUserPosts();

    expect(result).toEqual([]);
  });

  it('should filter by published status when specified', async () => {
    const publishedPosts = [mockUserPosts[0]];
    prismaMock.post.findMany.mockResolvedValue(publishedPosts);

    const result = await getUserPosts();

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isPublished: true,
      },
      include: {
        category: true,
        postchapters: {
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
            replies: true,
            postchapters: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(result).toEqual(publishedPosts);
  });

  it('should filter unpublished posts', async () => {
    const unpublishedPosts = [mockUserPosts[1]];
    prismaMock.post.findMany.mockResolvedValue(unpublishedPosts);

    const result = await getUserPosts();

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isPublished: false,
      },
      include: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(result.posts[0].isPublished).toBe(false);
  });

  it('should include post chapters ordered by position', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockUserPosts);

    const result = await getUserPosts();

    expect(result.posts[0].comments).toBe(2);
    expect(result.posts[1].comments).toBe(3);
  });

  it('should include category information', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockUserPosts);

    const result = await getUserPosts();

    expect(result.posts[0].categories).toContain('Personal');
    expect(result.posts[1].categories).toContain('Technical');
  });

  it('should include counts for comments and replies', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockUserPosts);

    const result = await getUserPosts();

    expect(result.posts[0].comments).toEqual({
      comments: 10,
      replies: 20,
      postchapters: 2,
    });
    expect(result.posts[1].comments).toEqual({
      comments: 0,
      replies: 0,
      postchapters: 0,
    });
  });

  it('should filter by category when categoryId provided', async () => {
    const categoryPosts = [mockUserPosts[0]];
    prismaMock.post.findMany.mockResolvedValue(categoryPosts);

    const result = await getUserPosts();

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        categoryId: 'cat-1',
      },
      include: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should limit results when limit provided', async () => {
    prismaMock.post.findMany.mockResolvedValue([mockUserPosts[0]]);

    const result = await getUserPosts();

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
      },
      include: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });
  });

  it('should handle pagination with skip and take', async () => {
    prismaMock.post.findMany.mockResolvedValue([mockUserPosts[1]]);

    const result = await getUserPosts();

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
      },
      include: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
      skip: 1,
      take: 1,
    });
  });

  it('should order by different field when specified', async () => {
    prismaMock.post.findMany.mockResolvedValue(mockUserPosts);

    const result = await getUserPosts();

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
      },
      include: expect.any(Object),
      orderBy: {
        title: 'asc',
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    prismaMock.post.findMany.mockRejectedValue(new Error('Database error'));

    await expect(getUserPosts()).rejects.toThrow('Database error');
  });

  it('should handle null userId', async () => {
    prismaMock.post.findMany.mockResolvedValue([]);

    const result = await getUserPosts();

    expect(result).toEqual([]);
    expect(prismaMock.post.findMany).not.toHaveBeenCalled();
  });

  it('should handle undefined userId', async () => {
    prismaMock.post.findMany.mockResolvedValue([]);

    const result = await getUserPosts();

    expect(result).toEqual([]);
    expect(prismaMock.post.findMany).not.toHaveBeenCalled();
  });
});