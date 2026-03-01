import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { EXPERIMENTS, getExperimentStats } from '@/lib/sam/course-creation/experiments';

export async function GET() {
  try {
    if (!await isAdmin()) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const results = await Promise.all(
      EXPERIMENTS.map(async (exp) => {
        const stats = await getExperimentStats(exp.id);
        return {
          id: exp.id,
          name: exp.name,
          description: exp.description,
          active: exp.active,
          variants: exp.variants,
          weights: exp.weights,
          autoGraduateAfterSamples: exp.autoGraduateAfterSamples,
          stats: stats ?? { experimentId: exp.id, variants: [], pValue: null, significant: false, minSamplesRequired: 10, message: 'No data collected yet' },
        };
      }),
    );

    return NextResponse.json({ success: true, experiments: results });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
