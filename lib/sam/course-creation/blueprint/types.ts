/**
 * Blueprint Module — Shared Types
 *
 * Interfaces for the course blueprint generation pipeline.
 */

import type { z } from 'zod';
import type { BlueprintRequestSchema } from './validation';

export interface BlueprintSection {
  position: number;
  title: string;
  keyTopics: string[];
  estimatedMinutes?: number;
  formativeAssessment?: { type: string; prompt: string };
}

export interface BlueprintChapter {
  position: number;
  title: string;
  goal: string;
  bloomsLevel: string;
  deliverable?: string;
  prerequisiteChapters?: number[];
  estimatedMinutes?: number;
  sections: BlueprintSection[];
}

export interface BlueprintResponse {
  chapters: BlueprintChapter[];
  northStarProject?: string;
  confidence: number;
  riskAreas: string[];
}

export type BlueprintRequestData = z.infer<typeof BlueprintRequestSchema>;
