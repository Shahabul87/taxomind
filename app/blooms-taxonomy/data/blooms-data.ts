import {
  Brain,
  Lightbulb,
  Target,
  Puzzle,
  FlaskConical,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  BLOOMS_VERBS,
  BLOOMS_ACTIVITIES,
  type BloomsLevel,
} from "@sam-ai/pedagogy";

export interface TaxonomyLevel {
  level: number;
  key: BloomsLevel;
  name: string;
  icon: LucideIcon;
  color: string;
  glowColor: string;
  accentColor: string;
  description: string;
  longDescription: string;
  examples: string[];
  platformFeatures: string[];
  percentage: number;
  cognitiveVerbs: string[];
  activityTypes: string[];
  exampleQuestions: string[];
}

export const taxonomyLevels: TaxonomyLevel[] = [
  {
    level: 1,
    key: "REMEMBER",
    name: "Remember",
    icon: Brain,
    color: "from-violet-500 to-purple-600",
    glowColor: "shadow-purple-500/50",
    accentColor: "text-purple-400",
    description: "Recall facts and basic concepts",
    longDescription:
      "The foundation of knowledge. Our AI reinforces your memory pathways through smart repetition and active recall, ensuring core concepts are locked in for future learning.",
    examples: ["Define terms", "List features", "Identify components"],
    platformFeatures: ["Smart Flashcards", "Recall Quizzes", "Memory Anchors"],
    percentage: 15,
    cognitiveVerbs: BLOOMS_VERBS.REMEMBER.slice(0, 12),
    activityTypes: BLOOMS_ACTIVITIES.REMEMBER,
    exampleQuestions: [
      "What is the definition of...?",
      "List the main components of...",
      "Name the key features of...",
      "Can you recall the steps for...?",
    ],
  },
  {
    level: 2,
    key: "UNDERSTAND",
    name: "Understand",
    icon: Lightbulb,
    color: "from-blue-500 to-cyan-500",
    glowColor: "shadow-blue-500/50",
    accentColor: "text-blue-400",
    description: "Explain ideas and concepts",
    longDescription:
      "True comprehension goes beyond memorization. We verify you can explain complex topics in your own words, building robust mental models that connect ideas.",
    examples: ["Summarize content", "Explain processes", "Give examples"],
    platformFeatures: ["AI Explanations", "Concept Mapping", "Visual Analogies"],
    percentage: 20,
    cognitiveVerbs: BLOOMS_VERBS.UNDERSTAND.slice(0, 12),
    activityTypes: BLOOMS_ACTIVITIES.UNDERSTAND,
    exampleQuestions: [
      "Can you explain why...?",
      "How would you summarize...?",
      "What is the difference between...?",
      "Give an example of...",
    ],
  },
  {
    level: 3,
    key: "APPLY",
    name: "Apply",
    icon: Target,
    color: "from-emerald-400 to-green-500",
    glowColor: "shadow-emerald-500/50",
    accentColor: "text-emerald-400",
    description: "Use information in new situations",
    longDescription:
      "Knowledge in action. We simulate real-world scenarios where you must apply your learning to solve practical, dynamic problems in authentic contexts.",
    examples: ["Solve problems", "Apply methods", "Implement solutions"],
    platformFeatures: ["Simulations", "Code Sandboxes", "Scenario Challenges"],
    percentage: 25,
    cognitiveVerbs: BLOOMS_VERBS.APPLY.slice(0, 12),
    activityTypes: BLOOMS_ACTIVITIES.APPLY,
    exampleQuestions: [
      "How would you use this to solve...?",
      "What would happen if you...?",
      "Can you demonstrate...?",
      "How would you apply this to...?",
    ],
  },
  {
    level: 4,
    key: "ANALYZE",
    name: "Analyze",
    icon: Puzzle,
    color: "from-amber-400 to-orange-500",
    glowColor: "shadow-amber-500/50",
    accentColor: "text-amber-400",
    description: "Draw connections among ideas",
    longDescription:
      "Deep analytical thinking. Our tools help you deconstruct complex systems, identify patterns, and understand the underlying structure of knowledge.",
    examples: ["Compare concepts", "Identify patterns", "Break down problems"],
    platformFeatures: ["Data Analysis", "Pattern Recognition", "System Debugging"],
    percentage: 20,
    cognitiveVerbs: BLOOMS_VERBS.ANALYZE.slice(0, 12),
    activityTypes: BLOOMS_ACTIVITIES.ANALYZE,
    exampleQuestions: [
      "What patterns do you notice...?",
      "How does this compare to...?",
      "What are the causes of...?",
      "Can you break down the components of...?",
    ],
  },
  {
    level: 5,
    key: "EVALUATE",
    name: "Evaluate",
    icon: FlaskConical,
    color: "from-rose-500 to-red-600",
    glowColor: "shadow-rose-500/50",
    accentColor: "text-rose-400",
    description: "Justify decisions and judgments",
    longDescription:
      "Critical thinking at its finest. Learn to critique, defend, and make evidence-based judgments using established criteria and professional standards.",
    examples: ["Critique work", "Make judgments", "Defend positions"],
    platformFeatures: ["Peer Review", "Debate Mode", "Critical Essays"],
    percentage: 15,
    cognitiveVerbs: BLOOMS_VERBS.EVALUATE.slice(0, 12),
    activityTypes: BLOOMS_ACTIVITIES.EVALUATE,
    exampleQuestions: [
      "What criteria would you use to...?",
      "Do you agree with...? Why?",
      "What evidence supports...?",
      "How would you prioritize...?",
    ],
  },
  {
    level: 6,
    key: "CREATE",
    name: "Create",
    icon: Sparkles,
    color: "from-fuchsia-500 to-pink-600",
    glowColor: "shadow-fuchsia-500/50",
    accentColor: "text-fuchsia-400",
    description: "Produce original work",
    longDescription:
      "The pinnacle of cognitive mastery. Synthesize everything you have learned to design, build, and invent novel solutions. This is where true expertise emerges.",
    examples: ["Design solutions", "Build projects", "Generate ideas"],
    platformFeatures: ["Project Studio", "Innovation Labs", "Portfolio Builder"],
    percentage: 5,
    cognitiveVerbs: BLOOMS_VERBS.CREATE.slice(0, 12),
    activityTypes: BLOOMS_ACTIVITIES.CREATE,
    exampleQuestions: [
      "How would you design a...?",
      "What would you propose to...?",
      "Can you create a plan for...?",
      "How would you improve...?",
    ],
  },
];

// Quick lookup by key
export const taxonomyByKey: Record<BloomsLevel, TaxonomyLevel> = taxonomyLevels.reduce(
  (acc, level) => {
    acc[level.key] = level;
    return acc;
  },
  {} as Record<BloomsLevel, TaxonomyLevel>
);

// Stats for the hero section
export const bloomsStats = [
  { value: "70+", label: "Years of Research" },
  { value: "10M+", label: "Educators Worldwide" },
  { value: "<10ms", label: "Analysis Speed" },
];

// Engine features for the features section
export const engineFeatures = [
  {
    title: "Course-Level Analysis",
    description:
      "Analyze entire courses with chapter-by-chapter breakdown, identifying cognitive level progression and gaps.",
    icon: "Layers" as const,
    iconColor: "text-purple-400",
  },
  {
    title: "SM-2 Spaced Repetition",
    description:
      "Optimal review scheduling algorithm that adapts to your memory patterns for maximum retention.",
    icon: "Clock" as const,
    iconColor: "text-blue-400",
  },
  {
    title: "Gap Detection",
    description:
      "Identifies missing cognitive levels in your learning materials to ensure comprehensive coverage.",
    icon: "Search" as const,
    iconColor: "text-emerald-400",
  },
  {
    title: "Cognitive Profiling",
    description:
      "Track your progress across all 6 levels with personalized insights and growth recommendations.",
    icon: "Brain" as const,
    iconColor: "text-amber-400",
  },
  {
    title: "Career Alignment",
    description:
      "Maps your cognitive skills to career paths, showing which competencies to develop next.",
    icon: "Compass" as const,
    iconColor: "text-rose-400",
  },
  {
    title: "Learning Pathways",
    description:
      "AI-generated progression plans that guide you from foundational knowledge to creative mastery.",
    icon: "Route" as const,
    iconColor: "text-fuchsia-400",
  },
];

// Journey stages for the timeline
export const journeyStages = [
  {
    level: 1,
    stage: "Foundation",
    name: "Building Knowledge Base",
    description:
      "Establish core concepts through smart flashcards and active recall techniques.",
    activities: ["Flashcard mastery", "Term recognition", "Concept mapping"],
    milestone: "100 core concepts retained",
  },
  {
    level: 2,
    stage: "Comprehension",
    name: "Deepening Understanding",
    description:
      "Move beyond memorization to true comprehension with AI-powered explanations.",
    activities: ["Summarization practice", "Analogy building", "Example generation"],
    milestone: "Explain concepts in own words",
  },
  {
    level: 3,
    stage: "Application",
    name: "Real-World Practice",
    description:
      "Apply knowledge to solve practical problems in simulated environments.",
    activities: ["Problem solving", "Simulations", "Case studies"],
    milestone: "Solve 50 practical challenges",
  },
  {
    level: 4,
    stage: "Analysis",
    name: "Pattern Recognition",
    description:
      "Develop analytical skills to break down complex systems and identify patterns.",
    activities: ["Data analysis", "Comparative studies", "Root cause investigation"],
    milestone: "Identify patterns across domains",
  },
  {
    level: 5,
    stage: "Evaluation",
    name: "Critical Thinking",
    description:
      "Learn to make evidence-based judgments and defend your positions.",
    activities: ["Peer review", "Debate preparation", "Criteria-based assessment"],
    milestone: "Evaluate solutions with evidence",
  },
  {
    level: 6,
    stage: "Creation",
    name: "Innovation & Mastery",
    description:
      "Synthesize knowledge to create original solutions and contribute new ideas.",
    activities: ["Project building", "Innovation challenges", "Portfolio creation"],
    milestone: "Publish original work",
  },
];

// Outcome stats for the journey section
export const outcomeStats = [
  { value: "3.2x", label: "Faster Skill Acquisition" },
  { value: "89%", label: "Long-term Retention" },
  { value: "47%", label: "Higher Test Scores" },
  { value: "2.1x", label: "Career Advancement" },
];
