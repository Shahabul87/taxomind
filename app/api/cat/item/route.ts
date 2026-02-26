/**
 * CAT Item API
 * GET /api/cat/item - Get next adaptive item
 * POST /api/cat/item - Submit response
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// IRT 3PL probability function
function calculateProbability(
  ability: number,
  difficulty: number,
  discrimination: number,
  guessing: number
): number {
  const exponent = discrimination * (ability - difficulty);
  return guessing + (1 - guessing) / (1 + Math.exp(-exponent));
}

// Fisher Information for item selection
function calculateInformation(
  ability: number,
  difficulty: number,
  discrimination: number,
  guessing: number
): number {
  const p = calculateProbability(ability, difficulty, discrimination, guessing);
  const q = 1 - p;
  const pStar = (p - guessing) / (1 - guessing);
  return Math.pow(discrimination, 2) * (Math.pow(pStar, 2) / p) * (q / (1 - guessing));
}

// Get next adaptive item
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Session ID required' } },
        { status: 400 }
      );
    }

    const session = await db.cATSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
        status: 'IN_PROGRESS',
      },
      include: {
        responses: { select: { itemId: true } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Active session not found' } },
        { status: 404 }
      );
    }

    // Get administered item IDs
    const administeredItemIds = session.responses.map((r) => r.itemId);

    // Fetch available items from bank
    const availableItems = await db.cATItem.findMany({
      where: {
        itemBankId: session.itemBankId,
        isActive: true,
        id: { notIn: administeredItemIds },
      },
      take: 50,
    });

    if (availableItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          complete: true,
          message: 'All items administered',
          currentTheta: session.currentTheta,
          currentSE: session.currentSE,
        },
      }, {
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      });
    }

    // Select item with maximum information at current ability
    let bestItem = availableItems[0];
    let maxInformation = 0;

    for (const item of availableItems) {
      const info = calculateInformation(
        session.currentTheta,
        item.difficulty,
        item.discrimination,
        item.guessing
      );
      if (info > maxInformation) {
        maxInformation = info;
        bestItem = item;
      }
    }

    // Get the actual question content
    const question = await db.question.findUnique({
      where: { id: bestItem.questionId },
      include: {
        Answer: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        itemId: bestItem.id,
        questionId: bestItem.questionId,
        question: question?.text,
        answers: question?.Answer?.map((a) => ({ id: a.id, text: a.text })),
        itemNumber: session.itemsAdministered + 1,
        currentTheta: session.currentTheta,
        currentSE: session.currentSE,
        expectedInformation: maxInformation,
      },
    }, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch (error) {
    console.error('[CAT_ITEM_GET]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get item' } },
      { status: 500 }
    );
  }
}

const ResponseSchema = z.object({
  sessionId: z.string().min(1),
  itemId: z.string().min(1),
  response: z.number().min(0).max(1), // 0 = incorrect, 1 = correct
  responseTime: z.number().min(0),
});

// Submit response
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = ResponseSchema.parse(body);

    const session = await db.cATSession.findFirst({
      where: {
        id: validatedData.sessionId,
        userId: user.id,
        status: 'IN_PROGRESS',
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Active session not found' } },
        { status: 404 }
      );
    }

    // Get item
    const item = await db.cATItem.findUnique({
      where: { id: validatedData.itemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } },
        { status: 404 }
      );
    }

    const isCorrect = validatedData.response === 1;

    // Update ability estimate using simplified EAP
    const newTheta = updateAbilityEstimate(
      session.currentTheta,
      isCorrect,
      item.difficulty,
      item.discrimination,
      item.guessing
    );

    // Calculate new standard error
    const newSE = calculateStandardError(session.currentSE, session.itemsAdministered + 1);

    // Record response
    await db.cATResponse.create({
      data: {
        sessionId: validatedData.sessionId,
        itemId: validatedData.itemId,
        response: validatedData.response,
        responseTime: validatedData.responseTime,
        abilityAfter: newTheta,
        seAfter: newSE,
      },
    });

    // Update item statistics
    await db.cATItem.update({
      where: { id: validatedData.itemId },
      data: {
        totalAttempts: { increment: 1 },
        correctResponses: isCorrect ? { increment: 1 } : undefined,
        exposureCount: { increment: 1 },
        lastUsed: new Date(),
      },
    });

    // Check stopping rules (simplified: min 10, max 30, SE < 0.3)
    const minItems = 10;
    const maxItems = 30;
    const minSE = 0.3;
    const itemsAdministered = session.itemsAdministered + 1;
    const correctResponses = session.correctResponses + (isCorrect ? 1 : 0);

    const shouldStop =
      (itemsAdministered >= minItems && newSE <= minSE) || itemsAdministered >= maxItems;

    // Update session
    await db.cATSession.update({
      where: { id: validatedData.sessionId },
      data: {
        currentTheta: newTheta,
        currentSE: newSE,
        itemsAdministered,
        correctResponses,
        ...(shouldStop && {
          status: 'COMPLETED',
          endTime: new Date(),
          totalTimeSeconds: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
        }),
      },
    });

    // Create score report if completed
    if (shouldStop) {
      const scaledScore = Math.round(50 + newTheta * 16.67); // Scale to 0-100
      const percentile = Math.round(normalCDF(newTheta) * 100);
      const accuracy = Math.round((correctResponses / itemsAdministered) * 100);

      await db.cATScoreReport.create({
        data: {
          sessionId: validatedData.sessionId,
          theta: newTheta,
          standardError: newSE,
          scaledScore: Math.max(0, Math.min(100, scaledScore)),
          percentile: Math.max(0, Math.min(100, percentile)),
          confidenceLower: newTheta - 1.96 * newSE,
          confidenceUpper: newTheta + 1.96 * newSE,
          itemsAdministered,
          correctResponses,
          accuracy,
          totalTimeSeconds: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
          averageResponseTime: 0, // Would need to calculate from responses
          bloomsPerformance: {},
          reliability: 1 - Math.pow(newSE, 2),
          classification: getClassification(newTheta),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        currentTheta: newTheta,
        currentSE: newSE,
        itemsAdministered,
        isComplete: shouldStop,
        ...(shouldStop && {
          finalScore: {
            theta: newTheta,
            scaledScore: Math.round(50 + newTheta * 16.67),
            percentile: Math.round(normalCDF(newTheta) * 100),
          },
        }),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
        },
        { status: 400 }
      );
    }

    console.error('[CAT_ITEM_POST]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit response' } },
      { status: 500 }
    );
  }
}

// Simplified ability update (Newton-Raphson step)
function updateAbilityEstimate(
  currentAbility: number,
  isCorrect: boolean,
  difficulty: number,
  discrimination: number,
  guessing: number
): number {
  const p = calculateProbability(currentAbility, difficulty, discrimination, guessing);
  const response = isCorrect ? 1 : 0;

  // Gradient and Hessian for single item
  const pStar = (p - guessing) / (1 - guessing);
  const gradient = discrimination * pStar * (response - p) / p;
  const info = calculateInformation(currentAbility, difficulty, discrimination, guessing);

  // Newton-Raphson update with bounds
  const update = gradient / Math.max(info, 0.1);
  const newAbility = currentAbility + update;

  // Bound ability between -4 and +4
  return Math.max(-4, Math.min(4, newAbility));
}

// Simplified SE calculation
function calculateStandardError(currentSE: number, itemCount: number): number {
  // SE decreases with more items (simplified)
  return Math.max(0.2, currentSE * Math.sqrt((itemCount - 1) / itemCount) * 0.95);
}

// Normal CDF for percentile calculation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Classification based on theta
function getClassification(theta: number): 'EXCELLENT' | 'PROFICIENT' | 'BASIC' | 'BELOW_BASIC' {
  if (theta >= 1.5) return 'EXCELLENT';
  if (theta >= 0.5) return 'PROFICIENT';
  if (theta >= -0.5) return 'BASIC';
  return 'BELOW_BASIC';
}
