import { Brain, Lightbulb, Wrench, Search, Scale, Rocket } from 'lucide-react';
import type { ReactNode } from 'react';

export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface BloomsTab {
  key: BloomsLevel;
  label: string;
  icon: ReactNode;
  description: string;
  color: string;
  examples: string[];
}

export const BLOOMS_LEVELS: BloomsTab[] = [
  {
    key: 'remember',
    label: 'Remember',
    icon: <Brain className="h-5 w-5" />,
    description: 'Recall facts and basic concepts',
    color: 'from-red-500 to-red-600',
    examples: ['Define', 'List', 'Recall', 'Identify'],
  },
  {
    key: 'understand',
    label: 'Understand',
    icon: <Lightbulb className="h-5 w-5" />,
    description: 'Explain ideas and concepts',
    color: 'from-orange-500 to-orange-600',
    examples: ['Describe', 'Explain', 'Summarize', 'Interpret'],
  },
  {
    key: 'apply',
    label: 'Apply',
    icon: <Wrench className="h-5 w-5" />,
    description: 'Use information in new situations',
    color: 'from-yellow-500 to-yellow-600',
    examples: ['Execute', 'Implement', 'Solve', 'Use'],
  },
  {
    key: 'analyze',
    label: 'Analyze',
    icon: <Search className="h-5 w-5" />,
    description: 'Draw connections among ideas',
    color: 'from-green-500 to-green-600',
    examples: ['Compare', 'Organize', 'Examine', 'Differentiate'],
  },
  {
    key: 'evaluate',
    label: 'Evaluate',
    icon: <Scale className="h-5 w-5" />,
    description: 'Justify a decision or course of action',
    color: 'from-blue-500 to-blue-600',
    examples: ['Judge', 'Critique', 'Defend', 'Assess'],
  },
  {
    key: 'create',
    label: 'Create',
    icon: <Rocket className="h-5 w-5" />,
    description: 'Produce new or original work',
    color: 'from-purple-500 to-purple-600',
    examples: ['Design', 'Construct', 'Develop', 'Formulate'],
  },
];
