'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface SkillDimensionRadarProps {
  /** Mastery score (0-100) */
  mastery: number;
  /** Retention score (0-100) */
  retention: number;
  /** Application score (0-100) */
  application: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Calibration score (0-100) */
  calibration: number;
  /** Optional height in pixels */
  height?: number;
}

/**
 * 5-dimension radar chart showing skill proficiency across:
 * Mastery, Retention, Application, Confidence, Calibration.
 *
 * These map to the SkillBuildProfile dimensions in the Prisma schema.
 */
export function SkillDimensionRadar({
  mastery,
  retention,
  application,
  confidence,
  calibration,
  height = 250,
}: SkillDimensionRadarProps) {
  const data = [
    { dimension: 'Mastery', value: mastery, fullMark: 100 },
    { dimension: 'Retention', value: retention, fullMark: 100 },
    { dimension: 'Application', value: application, fullMark: 100 },
    { dimension: 'Confidence', value: confidence, fullMark: 100 },
    { dimension: 'Calibration', value: calibration, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid
          stroke="#e2e8f0"
          strokeDasharray="3 3"
        />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11, fill: '#64748b' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 9, fill: '#94a3b8' }}
          tickCount={5}
        />
        <Radar
          name="Current"
          dataKey="value"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 3, fill: '#8b5cf6' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`${value}/100`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
