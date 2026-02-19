import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';
import type { SkillDecayData, DecayRiskLevel } from '@/components/sam/learning-gap/types';
import type { SkillBuildProfile } from '@sam-ai/educational';

/** Type for profile records returned by getUserSkillProfiles */
type ProfileRecord = SkillBuildProfile;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetDecayQuerySchema = z.object({
  riskLevel: z.enum(['critical', 'high', 'medium', 'low', 'all']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

// ============================================================================
// GET - Get skills with decay predictions
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetDecayQuerySchema.parse({
      riskLevel: searchParams.get('riskLevel') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const skillBuildTrackStore = getStore('skillBuildTrack');

    // Fetch skill build profiles
    const profiles: ProfileRecord[] = await skillBuildTrackStore.getUserSkillProfiles(session.user.id);

    // Transform and calculate decay data
    let decayData: SkillDecayData[] = profiles
      .filter((profile): profile is ProfileRecord & { lastPracticedAt: Date } => !!profile.lastPracticedAt)
      .map((profile): SkillDecayData => {
        const daysSince = getDaysSince(profile.lastPracticedAt);
        const masteryScore = profile.dimensions.mastery ?? 0;
        const decayRate = calculateDecayRate(masteryScore);
        const riskLevel = calculateRiskLevel(daysSince, decayRate);

        return {
          skillId: profile.skillId,
          skillName: profile.skill?.name ?? 'Unknown Skill',
          currentMastery: masteryScore,
          riskLevel,
          daysSinceLastPractice: daysSince,
          decayRate,
          predictedDecayDate: calculateDecayDate(masteryScore, decayRate),
          predictions: generateDecayPredictions(masteryScore, decayRate),
          lastPracticedAt: profile.lastPracticedAt.toISOString(),
          reviewDeadline: daysSince > 7 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        };
      });

    // Filter by risk level
    if (query.riskLevel !== 'all') {
      decayData = decayData.filter((d) => d.riskLevel === query.riskLevel);
    }

    // Sort by risk (critical first)
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    decayData.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

    // Limit results
    decayData = decayData.slice(0, query.limit);

    // Calculate summary
    const allData: DecayRiskLevel[] = profiles.map((profile): DecayRiskLevel => {
      const daysSince = getDaysSince(profile.lastPracticedAt ?? null);
      const decayRate = calculateDecayRate(profile.dimensions.mastery ?? 0);
      return calculateRiskLevel(daysSince, decayRate);
    });

    const summary = {
      total: profiles.length,
      critical: allData.filter((r) => r === 'critical').length,
      high: allData.filter((r) => r === 'high').length,
      medium: allData.filter((r) => r === 'medium').length,
      low: allData.filter((r) => r === 'low').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        decayData,
        summary,
      },
    });
  } catch (error) {
    logger.error('Error fetching skill decay data:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch decay data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDaysSince(date: Date | null | undefined): number {
  if (!date) return 999;
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function calculateDecayRate(currentMastery: number): number {
  const baseRate = 2;
  const masteryFactor = 1 - (currentMastery / 100) * 0.5;
  return baseRate * masteryFactor;
}

function calculateRiskLevel(daysSince: number, decayRate: number): DecayRiskLevel {
  const projectedDecay = daysSince * decayRate;
  if (projectedDecay >= 30 || daysSince >= 30) return 'critical';
  if (projectedDecay >= 20 || daysSince >= 14) return 'high';
  if (projectedDecay >= 10 || daysSince >= 7) return 'medium';
  return 'low';
}

function calculateDecayDate(currentMastery: number, decayRate: number): string {
  const threshold = 60;
  if (currentMastery <= threshold) {
    return new Date().toISOString();
  }
  const daysToDecay = (currentMastery - threshold) / decayRate;
  return new Date(Date.now() + daysToDecay * 24 * 60 * 60 * 1000).toISOString();
}

function generateDecayPredictions(
  currentMastery: number,
  decayRate: number
): SkillDecayData['predictions'] {
  const predictions = [];
  for (let days = 7; days <= 28; days += 7) {
    const predictedMastery = Math.max(0, currentMastery - days * decayRate);
    predictions.push({
      date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      predictedMastery: Math.round(predictedMastery),
      confidence: Math.max(50, 95 - days * 1.5),
    });
  }
  return predictions;
}
