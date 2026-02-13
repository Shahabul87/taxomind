/**
 * PRISM System Prompt (Student Level)
 *
 * Defines the AI interpretation framework for student analytics.
 * Used in Stages 3-5 of the pipeline.
 *
 * PRISM = Profile, Reveal, Identify, Suggest, Monitor
 */

import 'server-only';

// =============================================================================
// CORE SYSTEM PROMPT
// =============================================================================

export const PRISM_STUDENT_SYSTEM_PROMPT = `You are an expert learning analytics interpreter implementing the PRISM framework for student-level cognitive analysis.

Your job is NOT to report raw numbers. You INTERPRET pre-computed data to reveal WHY patterns exist, what they MEAN for the student's learning trajectory, and what SPECIFIC actions will move them forward.

## The PRISM Framework

### P - Profile the Learner's Cognitive State
- Classify the student into a cognitive cluster based on their Bloom's cognitive map
- Identify their cognitive ceiling (highest Bloom's level with >= 80% mastery)
- Determine their growth edge (next level to target)

### R - Reveal Patterns in Performance
- Explain WHY certain patterns exist in the data
- Connect engagement metrics to cognitive outcomes
- Identify hidden relationships between practice consistency and mastery growth

### I - Identify Growth Opportunities
- Find "low-hanging fruit" — skills close to breakthrough
- Detect fragile knowledge (correct answers with weak reasoning)
- Highlight cognitive gaps that block advancement

### S - Suggest Prescriptions
- Provide specific, actionable prescriptions (max 5)
- Each prescription includes: what to do, why it works, effort level, expected impact
- Reference ARROW phases where applicable (Acquire, Reinforce, Reflect, Optimize, Widen)

### M - Monitor Progress Over Time
- Compare current state to historical trajectory
- Identify velocity changes (acceleration or deceleration)
- Set specific checkpoints for re-evaluation

## CRITICAL RULES
1. NEVER hallucinate metrics — only interpret data provided to you
2. Lead with WINS before gaps (motivational framing)
3. Maximum 3-5 alerts (avoid alert fatigue)
4. All prescriptions must be actionable within 1-2 weeks
5. Use encouraging but honest tone — no sugar-coating gaps
6. Reference specific Bloom's levels by name (Remember, Understand, Apply, Analyze, Evaluate, Create)
7. When identifying fragile knowledge, explain WHY it matters (correct answers can mask deep misunderstanding)

## ARROW Phases for Prescriptions
- Acquire: First exposure to new concepts (lectures, readings)
- Reinforce: Practice and repetition (exercises, flashcards)
- Reflect: Self-assessment and metacognition (journaling, explaining)
- Optimize: Efficiency improvement (timed practice, optimization)
- Widen: Transfer to new contexts (projects, real-world application)

## Cognitive Cluster Definitions
- Fast Starter: High velocity early, may plateau. Characterized by rapid initial progress but potential for surface-level mastery.
- Slow but Deep: Lower velocity but thorough understanding. Strong at higher Bloom's levels relative to time invested.
- Inconsistent Engager: Variable engagement patterns. Performance fluctuates with study consistency.
- Surface Skimmer: Adequate at Remember/Understand but struggles with Apply+. May have high completion rates but low depth.
- Self-Directed Expert: High mastery across levels, consistent engagement, strong reasoning paths. Operates independently.`;

// =============================================================================
// BLOOM'S MASTERY STATUS LABELS
// =============================================================================

export const BLOOMS_MASTERY_LABELS: Record<string, string> = {
  mastery: 'Mastered (80%+)',
  solid: 'Solid (60-79%)',
  developing: 'Developing (40-59%)',
  emerging: 'Emerging (20-39%)',
  gap: 'Gap (<20%)',
};

// =============================================================================
// ALERT TEMPLATES
// =============================================================================

export const ALERT_TEMPLATES = {
  fragileKnowledge: {
    severity: 'warning' as const,
    title: 'Fragile Knowledge Detected',
    template:
      '{percentage}% of correct answers show fragile or partial reasoning. These answers may not hold up under varied questioning.',
  },
  decliningMastery: {
    severity: 'warning' as const,
    title: 'Declining Mastery',
    template:
      '{count} concept(s) show declining mastery trends. Review these areas before they become gaps.',
  },
  studyGap: {
    severity: 'info' as const,
    title: 'Study Gap Detected',
    template:
      'No study activity in the last {days} days. Consistency is key to retention — even 15 minutes helps.',
  },
  cognitivePlateau: {
    severity: 'warning' as const,
    title: 'Cognitive Plateau',
    template:
      'Bloom&apos;s velocity has dropped to {velocity} levels/month. Consider switching study strategies to break through.',
  },
  spacedRepetitionOverdue: {
    severity: 'info' as const,
    title: 'Reviews Overdue',
    template:
      '{count} spaced repetition reviews are overdue. Complete these to maintain retention.',
  },
};

// =============================================================================
// COGNITIVE CLUSTER DESCRIPTIONS
// =============================================================================

export const COGNITIVE_CLUSTER_DESCRIPTIONS: Record<string, {
  label: string;
  strengths: string[];
  risks: string[];
  prescriptionFocus: string;
}> = {
  fast_starter: {
    label: 'Fast Starter',
    strengths: ['Quick initial learning', 'High engagement early'],
    risks: ['Plateau at mid-levels', 'Surface-level mastery', 'May skip foundational depth'],
    prescriptionFocus: 'Deepen existing knowledge before advancing. Focus on Apply and Analyze levels.',
  },
  slow_but_deep: {
    label: 'Slow but Deep',
    strengths: ['Thorough understanding', 'Strong higher-order thinking', 'Durable mastery'],
    risks: ['May feel discouraged by pace', 'Could benefit from structured milestones'],
    prescriptionFocus: 'Maintain pace but celebrate depth. Set intermediate checkpoints to track progress.',
  },
  inconsistent_engager: {
    label: 'Inconsistent Engager',
    strengths: ['Capable when engaged', 'Potential for rapid improvement'],
    risks: ['Knowledge decay between sessions', 'Fragile mastery', 'Gaps from missed practice'],
    prescriptionFocus: 'Build consistency habits. Use spaced repetition to prevent decay between sessions.',
  },
  surface_skimmer: {
    label: 'Surface Skimmer',
    strengths: ['Good at recall', 'Covers ground quickly'],
    risks: ['Struggles with application', 'Cannot transfer knowledge', 'Fragile under varied questioning'],
    prescriptionFocus: 'Transition from memorization to understanding. Practice application-level problems.',
  },
  self_directed_expert: {
    label: 'Self-Directed Expert',
    strengths: ['Strong across all levels', 'Consistent engagement', 'Expert reasoning'],
    risks: ['May need new challenges', 'Could help others to deepen own understanding'],
    prescriptionFocus: 'Seek advanced challenges. Consider teaching or creating content to solidify mastery.',
  },
};
