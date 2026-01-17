import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  MILESTONE_BADGE_NAMES,
  MILESTONE_HOURS,
} from '@/lib/sam/stores/prisma-skill-mastery-10k-store';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ShareMilestoneSchema = z.object({
  platform: z.enum(['twitter', 'linkedin', 'copy', 'facebook']),
});

// ============================================================================
// TYPES
// ============================================================================

interface ShareContent {
  title: string;
  text: string;
  hashtags: string[];
  url: string;
  shareUrl: string;
}

// ============================================================================
// GET - Get shareable content for a milestone
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const milestone = await db.practiceMilestone.findUnique({
      where: { id },
      include: {
        skillMastery: true,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    if (milestone.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate share content
    const milestoneType = milestone.milestoneType as keyof typeof MILESTONE_HOURS;
    const hours = MILESTONE_HOURS[milestoneType] ?? milestone.hoursRequired;
    const badgeName = MILESTONE_BADGE_NAMES[milestoneType] ?? milestone.badgeName ?? 'Achievement';

    const shareContent = generateShareContent(
      hours,
      badgeName,
      milestone.skillName,
      session.user.name ?? 'A learner'
    );

    return NextResponse.json({
      success: true,
      data: {
        milestone: {
          id: milestone.id,
          type: milestone.milestoneType,
          hours,
          badgeName,
          skillName: milestone.skillName,
          unlockedAt: milestone.unlockedAt,
          shareCount: milestone.shareCount,
        },
        shareContent,
      },
    });
  } catch (error) {
    logger.error('Error fetching milestone share content:', error);
    return NextResponse.json({ error: 'Failed to fetch share content' }, { status: 500 });
  }
}

// ============================================================================
// POST - Record a share action
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await req.json();
    const data = ShareMilestoneSchema.parse(body);

    const milestone = await db.practiceMilestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    if (milestone.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Increment share count
    const updated = await db.practiceMilestone.update({
      where: { id },
      data: {
        shareCount: { increment: 1 },
      },
    });

    // Generate platform-specific share URL
    const milestoneType = milestone.milestoneType as keyof typeof MILESTONE_HOURS;
    const hours = MILESTONE_HOURS[milestoneType] ?? milestone.hoursRequired;
    const badgeName = MILESTONE_BADGE_NAMES[milestoneType] ?? milestone.badgeName ?? 'Achievement';

    const shareContent = generateShareContent(
      hours,
      badgeName,
      milestone.skillName,
      session.user.name ?? 'A learner'
    );

    const shareUrl = generateShareUrl(data.platform, shareContent);

    return NextResponse.json({
      success: true,
      data: {
        shareCount: updated.shareCount,
        shareUrl,
        platform: data.platform,
      },
    });
  } catch (error) {
    logger.error('Error recording milestone share:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to record share' }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateShareContent(
  hours: number,
  badgeName: string,
  skillName: string,
  userName: string
): ShareContent {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://taxomind.com';
  const profileUrl = `${baseUrl}/achievements`;

  const title = `${badgeName} Achievement Unlocked!`;

  const texts = [
    `I just hit ${hours.toLocaleString()} hours of quality practice in ${skillName}! Earned the "${badgeName}" badge on my journey to mastery.`,
    `${hours.toLocaleString()} hours of deliberate practice in ${skillName}! Just unlocked the "${badgeName}" achievement.`,
    `Milestone achieved! ${hours.toLocaleString()} quality hours in ${skillName}. The "${badgeName}" badge is mine!`,
  ];

  // Rotate text based on time for variety
  const textIndex = new Date().getHours() % texts.length;
  const text = texts[textIndex];

  const hashtags = [
    '10000HourRule',
    'DeliberatePractice',
    'LifelongLearning',
    skillName.replace(/\s+/g, ''),
    'Achievement',
  ];

  return {
    title,
    text,
    hashtags,
    url: profileUrl,
    shareUrl: profileUrl,
  };
}

function generateShareUrl(platform: string, content: ShareContent): string {
  const encodedText = encodeURIComponent(content.text);
  const encodedUrl = encodeURIComponent(content.url);
  const encodedHashtags = content.hashtags.join(',');

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=${encodedHashtags}`;

    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodeURIComponent(content.title)}&summary=${encodedText}`;

    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;

    case 'copy':
      return `${content.text}\n\n${content.url}\n\n#${content.hashtags.join(' #')}`;

    default:
      return content.url;
  }
}
