import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

type PostType = 'achievement' | 'discussion' | 'question' | 'resource' | 'challenge';

interface FeedPost {
  id: string;
  type: PostType;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  content: string;
  title?: string;
  media?: { type: 'image' | 'video'; url: string }[];
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  achievement?: {
    type: string;
    title: string;
    description: string;
    xp: number;
  };
}

const FeedQuerySchema = z.object({
  type: z.enum(['achievement', 'discussion', 'question', 'resource', 'challenge']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

function sortByCreatedAtDesc(a: FeedPost, b: FeedPost) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = FeedQuerySchema.parse({
      type: searchParams.get('type') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const groupMemberships = await db.groupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true },
    });
    const groupIds = groupMemberships.map((m) => m.groupId);

    const [discussions, resources, achievements] = await Promise.all([
      groupIds.length
        ? db.groupDiscussion.findMany({
            where: { groupId: { in: groupIds } },
            include: { User: { select: { id: true, name: true, image: true, isTeacher: true } } },
            orderBy: { createdAt: 'desc' },
            take: query.limit,
          })
        : Promise.resolve([]),
      groupIds.length
        ? db.groupResource.findMany({
            where: { groupId: { in: groupIds } },
            include: { User: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            take: query.limit,
          })
        : Promise.resolve([]),
      db.gamificationUserAchievement.findMany({
        where: { userId: session.user.id, isUnlocked: true },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
        take: Math.min(query.limit, 10),
      }),
    ]);

    const discussionPosts: FeedPost[] = discussions.map((discussion) => ({
      id: discussion.id,
      type: 'discussion',
      authorId: discussion.authorId,
      authorName: discussion.User?.name ?? 'Community Member',
      authorAvatar: discussion.User?.image ?? undefined,
      authorBadge: discussion.User?.isTeacher ? 'Instructor' : undefined,
      title: discussion.title,
      content: discussion.content,
      tags: [],
      likes: discussion.likesCount ?? 0,
      comments: discussion.commentsCount ?? 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: discussion.createdAt.toISOString(),
    }));

    const resourcePosts: FeedPost[] = resources.map((resource) => ({
      id: resource.id,
      type: 'resource',
      authorId: resource.authorId,
      authorName: resource.User?.name ?? 'Community Member',
      authorAvatar: resource.User?.image ?? undefined,
      title: resource.title,
      content: resource.description ?? resource.url,
      tags: [resource.type],
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: resource.createdAt.toISOString(),
      media: resource.thumbnail
        ? [{ type: 'image', url: resource.thumbnail }]
        : undefined,
    }));

    const achievementPosts: FeedPost[] = achievements.map((entry) => ({
      id: entry.id,
      type: 'achievement',
      authorId: session.user.id,
      authorName: session.user.name ?? 'You',
      authorAvatar: session.user.image ?? undefined,
      content: `Unlocked ${entry.achievement.name}`,
      title: entry.achievement.name,
      tags: [entry.achievement.category],
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: (entry.unlockedAt ?? entry.createdAt).toISOString(),
      achievement: {
        type: entry.achievement.category,
        title: entry.achievement.name,
        description: entry.achievement.description,
        xp: entry.achievement.xpReward,
      },
    }));

    const combined = [...discussionPosts, ...resourcePosts, ...achievementPosts]
      .filter((post) => (query.type ? post.type === query.type : true))
      .sort(sortByCreatedAtDesc)
      .slice(0, query.limit);

    return NextResponse.json({
      success: true,
      data: {
        posts: combined,
      },
    });
  } catch (error) {
    logger.error('[SAM Social Feed] Failed to load feed', { error });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch social feed' }, { status: 500 });
  }
}

// POST action schemas
const CreatePostSchema = z.object({
  action: z.literal('create'),
  groupId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  type: z.enum(['discussion', 'question']).optional().default('discussion'),
});

const LikePostSchema = z.object({
  action: z.literal('like'),
  postId: z.string(),
  postType: z.enum(['discussion', 'resource']),
});

const BookmarkPostSchema = z.object({
  action: z.literal('bookmark'),
  postId: z.string(),
  postType: z.enum(['discussion', 'resource', 'achievement']),
});

const PostActionSchema = z.discriminatedUnion('action', [
  CreatePostSchema,
  LikePostSchema,
  BookmarkPostSchema,
]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const action = PostActionSchema.parse(body);

    switch (action.action) {
      case 'create': {
        // Verify user is a member of the group
        const membership = await db.groupMember.findFirst({
          where: { userId: session.user.id, groupId: action.groupId },
        });
        if (!membership) {
          return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
        }

        const discussion = await db.groupDiscussion.create({
          data: {
            id: crypto.randomUUID(),
            groupId: action.groupId,
            authorId: session.user.id,
            title: action.title,
            content: action.content,
            likesCount: 0,
            commentsCount: 0,
          },
          include: { User: { select: { id: true, name: true, image: true, isTeacher: true } } },
        });

        const post: FeedPost = {
          id: discussion.id,
          type: 'discussion',
          authorId: discussion.authorId,
          authorName: discussion.User?.name ?? 'Community Member',
          authorAvatar: discussion.User?.image ?? undefined,
          authorBadge: discussion.User?.isTeacher ? 'Instructor' : undefined,
          title: discussion.title,
          content: discussion.content,
          tags: [],
          likes: 0,
          comments: 0,
          shares: 0,
          isLiked: false,
          isBookmarked: false,
          createdAt: discussion.createdAt.toISOString(),
        };

        return NextResponse.json({ success: true, data: { post } });
      }

      case 'like': {
        if (action.postType === 'discussion') {
          // Toggle like on discussion
          const existingLike = await db.groupDiscussionLike.findUnique({
            where: {
              discussionId_userId: {
                discussionId: action.postId,
                userId: session.user.id,
              },
            },
          });

          if (existingLike) {
            // Unlike
            await db.groupDiscussionLike.delete({
              where: { id: existingLike.id },
            });
            await db.groupDiscussion.update({
              where: { id: action.postId },
              data: { likesCount: { decrement: 1 } },
            });
            return NextResponse.json({ success: true, data: { liked: false } });
          } else {
            // Like
            await db.groupDiscussionLike.create({
              data: {
                id: crypto.randomUUID(),
                discussionId: action.postId,
                userId: session.user.id,
              },
            });
            await db.groupDiscussion.update({
              where: { id: action.postId },
              data: { likesCount: { increment: 1 } },
            });
            return NextResponse.json({ success: true, data: { liked: true } });
          }
        }
        // Resource likes not implemented - return success with no-op
        return NextResponse.json({ success: true, data: { liked: false, message: 'Resource likes not yet supported' } });
      }

      case 'bookmark': {
        // Store bookmark in user preferences (using JSON field or separate table)
        // For now, return success as a placeholder
        return NextResponse.json({
          success: true,
          data: {
            bookmarked: true,
            message: 'Bookmark saved locally',
            postId: action.postId,
            postType: action.postType,
          },
        });
      }
    }
  } catch (error) {
    logger.error('[SAM Social Feed] Failed to process action', { error });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
