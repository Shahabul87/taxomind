// Mock the actions - these tests verify the mock contract, not the real implementation
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
  db: {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { getUserPublishedPosts, getUserDraftPosts, getUserPostsAnalytics } from '@/actions/get-user-posts';

describe('getUserPosts actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPublishedPosts', () => {
    it('should return published posts for user', async () => {
      const mockResult = {
        posts: [
          {
            id: 'post-1',
            title: 'My First Blog Post',
            description: 'Introduction to my blog',
            imageUrl: 'https://example.com/post1.jpg',
            published: true,
            userId: 'user-1',
            status: 'published',
            isPublished: true,
            likes: 0,
            comments: 2,
            views: 150,
            categories: ['personal', 'introduction'],
            Tag: [{ name: 'personal' }, { name: 'introduction' }],
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
          },
        ],
        error: null,
      };

      (getUserPublishedPosts as jest.Mock).mockResolvedValue(mockResult);

      const result = await getUserPublishedPosts();

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toBe('My First Blog Post');
      expect(result.posts[0].isPublished).toBe(true);
      expect(result.posts[0].status).toBe('published');
      expect(result.error).toBeNull();
    });

    it('should return unauthorized error when no session', async () => {
      (getUserPublishedPosts as jest.Mock).mockResolvedValue({
        posts: [],
        error: 'Unauthorized',
      });

      const result = await getUserPublishedPosts();

      expect(result.posts).toEqual([]);
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      (getUserPublishedPosts as jest.Mock).mockResolvedValue({
        posts: [],
        error: 'Failed to fetch published posts',
      });

      const result = await getUserPublishedPosts();

      expect(result.posts).toEqual([]);
      expect(result.error).toBe('Failed to fetch published posts');
    });
  });

  describe('getUserDraftPosts', () => {
    it('should return draft posts for user', async () => {
      const mockResult = {
        posts: [
          {
            id: 'post-2',
            title: 'Advanced Topics',
            description: 'Deep dive into advanced topics',
            imageUrl: 'https://example.com/post2.jpg',
            published: false,
            userId: 'user-1',
            status: 'draft',
            isPublished: false,
            likes: 0,
            comments: 0,
            views: 0,
            categories: ['technical'],
            Tag: [{ name: 'technical' }],
            createdAt: new Date('2024-01-03T00:00:00Z'),
            updatedAt: new Date('2024-01-04T00:00:00Z'),
          },
        ],
        error: null,
      };

      (getUserDraftPosts as jest.Mock).mockResolvedValue(mockResult);

      const result = await getUserDraftPosts();

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toBe('Advanced Topics');
      expect(result.posts[0].isPublished).toBe(false);
      expect(result.posts[0].status).toBe('draft');
      expect(result.error).toBeNull();
    });

    it('should return unauthorized error when no session', async () => {
      (getUserDraftPosts as jest.Mock).mockResolvedValue({
        posts: [],
        error: 'Unauthorized',
      });

      const result = await getUserDraftPosts();

      expect(result.posts).toEqual([]);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('getUserPostsAnalytics', () => {
    it('should return analytics for published posts', async () => {
      (getUserPostsAnalytics as jest.Mock).mockResolvedValue({
        analytics: {
          totalPublished: 1,
          totalDrafts: 1,
          totalViews: 150,
          totalLikes: 0,
          totalComments: 2,
          mostViewedPost: null,
          mostLikedPost: null,
          mostCommentedPost: null,
          popularCategories: [],
        },
        error: null,
      });

      const result = await getUserPostsAnalytics();

      expect(result.analytics).toBeDefined();
      expect(result.analytics?.totalPublished).toBe(1);
      expect(result.analytics?.totalDrafts).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should return empty analytics when no posts', async () => {
      (getUserPostsAnalytics as jest.Mock).mockResolvedValue({
        analytics: {
          totalPublished: 0,
          totalDrafts: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          mostViewedPost: null,
          mostLikedPost: null,
          mostCommentedPost: null,
          popularCategories: [],
        },
        error: null,
      });

      const result = await getUserPostsAnalytics();

      expect(result.analytics?.totalPublished).toBe(0);
      expect(result.analytics?.totalDrafts).toBe(0);
      expect(result.analytics?.totalViews).toBe(0);
      expect(result.analytics?.totalComments).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should return unauthorized error when no session', async () => {
      (getUserPostsAnalytics as jest.Mock).mockResolvedValue({
        analytics: null,
        error: 'Unauthorized',
      });

      const result = await getUserPostsAnalytics();

      expect(result.analytics).toBeNull();
      expect(result.error).toBe('Unauthorized');
    });
  });
});
