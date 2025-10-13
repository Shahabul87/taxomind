import { prismaMock } from '../utils/test-db';

// Mock the actions
jest.mock('@/actions/get-user-posts', () => ({
  getUserPublishedPosts: jest.fn(),
  getUserDraftPosts: jest.fn(),
  getUserPostsAnalytics: jest.fn(),
}));

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock the database
jest.mock('@/lib/db', () => ({
  db: prismaMock,
}));

import { getUserPublishedPosts, getUserDraftPosts, getUserPostsAnalytics } from '@/actions/get-user-posts';
import { db } from '@/lib/db';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;

describe('getUserPosts actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSession = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
    },
  };

  const mockPublishedPosts = [
    {
      id: 'post-1',
      title: 'My First Blog Post',
      description: 'Introduction to my blog',
      imageUrl: 'https://example.com/post1.jpg',
      published: true,
      userId: 'user-1',
      category: 'Personal',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      views: 150,
      Tag: [
        { name: 'personal' },
        { name: 'introduction' },
      ],
      comments: [
        { id: 'comment-1' },
        { id: 'comment-2' },
      ],
    },
  ];

  const mockDraftPosts = [
    {
      id: 'post-2',
      title: 'Advanced Topics',
      description: 'Deep dive into advanced topics',
      imageUrl: 'https://example.com/post2.jpg',
      published: false,
      userId: 'user-1',
      category: 'Technical',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
      Tag: [
        { name: 'technical' },
      ],
    },
  ];

  describe('getUserPublishedPosts', () => {
    it('should return published posts for user', async () => {
      mockAuth.mockResolvedValue(mockSession);
      prismaMock.post.findMany.mockResolvedValue(mockPublishedPosts);

      const result = await getUserPublishedPosts();

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toBe('My First Blog Post');
      expect(result.posts[0].isPublished).toBe(true);
      expect(result.posts[0].status).toBe('published');
      expect(result.error).toBeNull();

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          published: true,
        },
        include: {
          Tag: true,
          comments: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    });

    it('should return unauthorized error when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getUserPublishedPosts();

      expect(result.posts).toEqual([]);
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue(mockSession);
      prismaMock.post.findMany.mockRejectedValue(new Error('Database error'));

      const result = await getUserPublishedPosts();

      expect(result.posts).toEqual([]);
      expect(result.error).toBe('Failed to fetch published posts');
    });
  });

  describe('getUserDraftPosts', () => {
    it('should return draft posts for user', async () => {
      mockAuth.mockResolvedValue(mockSession);
      prismaMock.post.findMany.mockResolvedValue(mockDraftPosts);

      const result = await getUserDraftPosts();

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toBe('Advanced Topics');
      expect(result.posts[0].isPublished).toBe(false);
      expect(result.posts[0].status).toBe('draft');
      expect(result.error).toBeNull();

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          published: false,
        },
        include: {
          Tag: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    });

    it('should return unauthorized error when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getUserDraftPosts();

      expect(result.posts).toEqual([]);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('getUserPostsAnalytics', () => {
    it('should return analytics for published posts', async () => {
      mockAuth.mockResolvedValue(mockSession);
      prismaMock.post.findMany.mockResolvedValue(mockPublishedPosts);
      prismaMock.post.count.mockResolvedValue(1);

      const result = await getUserPostsAnalytics();

      expect(result.analytics).toBeDefined();
      expect(result.analytics?.totalPublished).toBe(1);
      expect(result.analytics?.totalDrafts).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should return empty analytics when no posts', async () => {
      mockAuth.mockResolvedValue(mockSession);
      prismaMock.post.findMany.mockResolvedValue([]);

      const result = await getUserPostsAnalytics();

      expect(result.analytics?.totalPublished).toBe(0);
      expect(result.analytics?.totalDrafts).toBe(0);
      expect(result.analytics?.totalViews).toBe(0);
      expect(result.analytics?.totalComments).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should return unauthorized error when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getUserPostsAnalytics();

      expect(result.analytics).toBeNull();
      expect(result.error).toBe('Unauthorized');
    });
  });
});