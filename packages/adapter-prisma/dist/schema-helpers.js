/**
 * Prisma Schema Helpers
 *
 * Utility functions for generating SAM-compatible Prisma schemas.
 */
// ============================================================================
// SAM PRISMA MODELS
// ============================================================================
/**
 * Required Prisma models for SAM AI
 */
export const SAM_PRISMA_MODELS = {
    /**
     * Core models (required)
     */
    core: ['User', 'Course', 'Chapter', 'Section'],
    /**
     * SAM-specific models (optional but recommended)
     */
    sam: [
        'SAMInteraction',
        'StudentBloomsProgress',
        'CognitiveSkillProgress',
        'CourseBloomsAnalysis',
        'QuestionBank',
    ],
    /**
     * Calibration models (for quality tracking)
     */
    calibration: ['CalibrationSample'],
    /**
     * Memory models (for adaptive learning)
     */
    memory: ['StudentProfile', 'TopicMastery', 'LearningPathway', 'MemoryEntry', 'ReviewSchedule'],
    /**
     * Version control models (for testing)
     */
    versionControl: ['GoldenTestCase'],
};
// ============================================================================
// SCHEMA GENERATION
// ============================================================================
/**
 * Generate a Prisma schema snippet for SAM models
 *
 * @param options Schema generation options
 * @returns Prisma schema string
 */
export function generatePrismaSchema(options) {
    const { includeCalibration = true, includeMemory = true, includeVersionControl = false } = options ?? {};
    let schema = `
// ============================================================================
// SAM AI MODELS
// ============================================================================

// SAM Interaction Logging
model SAMInteraction {
  id              String   @id @default(cuid())
  userId          String
  interactionType String
  context         Json
  duration        Int?
  success         Boolean  @default(true)
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}

// Student Bloom's Progress
model StudentBloomsProgress {
  id              String   @id @default(cuid())
  userId          String
  courseId        String?
  bloomsScores    Json     // { remember, understand, apply, analyze, evaluate, create }
  strengthAreas   Json?
  weaknessAreas   Json?
  progressHistory Json?
  lastAssessedAt  DateTime
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          Course?  @relation(fields: [courseId], references: [id], onDelete: SetNull)

  @@unique([userId, courseId])
}

// Cognitive Skill Progress
model CognitiveSkillProgress {
  id              String    @id @default(cuid())
  userId          String
  conceptId       String
  overallMastery  Float     @default(0)
  totalAttempts   Int       @default(0)
  lastAttemptDate DateTime?
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, conceptId])
}

// Course Bloom's Analysis
model CourseBloomsAnalysis {
  id                 String   @id @default(cuid())
  courseId           String   @unique
  bloomsDistribution Json     // { remember, understand, apply, analyze, evaluate, create }
  cognitiveDepth     Float    @default(0)
  learningPathway    Json?
  skillsMatrix       Json?
  gapAnalysis        Json?
  recommendations    Json?
  analyzedAt         DateTime @default(now())

  course             Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
}

// Question Bank
model QuestionBank {
  id            String   @id @default(cuid())
  courseId      String?
  subject       String
  topic         String
  question      String
  questionType  String   // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY, FILL_IN_BLANK
  bloomsLevel   String   // REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE
  difficulty    String   // EASY, MEDIUM, HARD
  correctAnswer Json
  options       Json?
  explanation   String?
  tags          String[] @default([])
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  course        Course?  @relation(fields: [courseId], references: [id], onDelete: SetNull)

  @@index([courseId])
  @@index([bloomsLevel])
  @@index([difficulty])
}
`;
    if (includeCalibration) {
        schema += `
// ============================================================================
// CALIBRATION MODELS
// ============================================================================

model CalibrationSample {
  id               String    @id @default(cuid())
  evaluationId     String
  aiScore          Float
  humanScore       Float?
  aiFeedback       String
  humanFeedback    String?
  adjustmentReason String?
  context          Json
  versionInfo      Json
  tags             String[]  @default([])
  evaluatedAt      DateTime
  reviewedAt       DateTime?
  reviewerId       String?

  @@index([evaluatedAt])
  @@index([humanScore])
}
`;
    }
    if (includeMemory) {
        schema += `
// ============================================================================
// MEMORY & ADAPTIVE LEARNING MODELS
// ============================================================================

model StudentProfile {
  id                        String     @id @default(cuid())
  userId                    String     @unique
  cognitivePreferences      Json
  performanceMetrics        Json
  overallBloomsDistribution Json
  knowledgeGaps             String[]   @default([])
  strengths                 String[]   @default([])
  createdAt                 DateTime   @default(now())
  lastActiveAt              DateTime   @default(now())
  updatedAt                 DateTime   @updatedAt

  user                      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  masteryRecords            TopicMastery[]
  pathways                  LearningPathway[]
}

model TopicMastery {
  id              String    @id @default(cuid())
  studentId       String
  topicId         String
  level           String    // novice, beginner, intermediate, proficient, expert
  score           Float
  bloomsLevel     String
  assessmentCount Int       @default(0)
  averageScore    Float
  lastAssessedAt  DateTime
  trend           String    // improving, stable, declining
  confidence      Float     @default(0.5)

  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, topicId])
}

model LearningPathway {
  id               String    @id @default(cuid())
  studentId        String
  courseId         String
  steps            Json
  currentStepIndex Int       @default(0)
  progress         Float     @default(0)
  status           String    @default("active") // active, completed, paused
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  student          StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([status])
}

model MemoryEntry {
  id         String    @id @default(cuid())
  studentId  String
  type       String    // insight, preference, milestone, feedback, context
  importance String    // low, medium, high, critical
  content    String
  metadata   Json?
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([studentId])
  @@index([type])
  @@index([expiresAt])
}

model ReviewSchedule {
  id             String    @id @default(cuid())
  studentId      String
  topicId        String
  nextReviewAt   DateTime
  interval       Int       // days
  easeFactor     Float     @default(2.5)
  repetitions    Int       @default(0)
  lastReviewedAt DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([studentId, topicId])
  @@index([nextReviewAt])
}
`;
    }
    if (includeVersionControl) {
        schema += `
// ============================================================================
// VERSION CONTROL MODELS
// ============================================================================

model GoldenTestCase {
  id             String   @id @default(cuid())
  name           String
  description    String?
  category       String
  input          Json
  expectedResult Json
  tags           String[] @default([])
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([category])
  @@index([isActive])
}
`;
    }
    return schema.trim();
}
//# sourceMappingURL=schema-helpers.js.map