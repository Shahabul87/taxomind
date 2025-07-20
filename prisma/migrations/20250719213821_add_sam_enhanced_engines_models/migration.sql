-- CreateTable
CREATE TABLE "CourseMarketAnalysis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "marketValue" DOUBLE PRECISION NOT NULL,
    "demandScore" DOUBLE PRECISION NOT NULL,
    "competitorAnalysis" JSONB NOT NULL,
    "pricingAnalysis" JSONB NOT NULL,
    "trendAnalysis" JSONB NOT NULL,
    "brandingScore" DOUBLE PRECISION NOT NULL,
    "targetAudienceMatch" DOUBLE PRECISION NOT NULL,
    "recommendedPrice" DOUBLE PRECISION NOT NULL,
    "marketPosition" TEXT NOT NULL,
    "opportunities" JSONB NOT NULL,
    "threats" JSONB NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseMarketAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCompetitor" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "competitorUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "enrollments" INTEGER,
    "features" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseBloomsAnalysis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "bloomsDistribution" JSONB NOT NULL,
    "cognitiveDepth" DOUBLE PRECISION NOT NULL,
    "learningPathway" JSONB NOT NULL,
    "skillsMatrix" JSONB NOT NULL,
    "gapAnalysis" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseBloomsAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionBloomsMapping" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "bloomsLevel" "BloomsLevel" NOT NULL,
    "primaryLevel" "BloomsLevel" NOT NULL,
    "secondaryLevels" JSONB NOT NULL,
    "activities" JSONB NOT NULL,
    "assessments" JSONB NOT NULL,
    "learningObjectives" JSONB NOT NULL,

    CONSTRAINT "SectionBloomsMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamBloomsProfile" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "targetDistribution" JSONB NOT NULL,
    "actualDistribution" JSONB NOT NULL,
    "difficultyMatrix" JSONB NOT NULL,
    "skillsAssessed" JSONB NOT NULL,
    "coverageMap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamBloomsProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "question" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "bloomsLevel" "BloomsLevel" NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "hints" JSONB,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "avgTimeSpent" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentBloomsProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "bloomsScores" JSONB NOT NULL,
    "strengthAreas" JSONB NOT NULL,
    "weaknessAreas" JSONB NOT NULL,
    "progressHistory" JSONB NOT NULL,
    "lastAssessedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentBloomsProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCognitiveProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallCognitiveLevel" DOUBLE PRECISION NOT NULL,
    "bloomsMastery" JSONB NOT NULL,
    "learningTrajectory" JSONB NOT NULL,
    "skillsInventory" JSONB NOT NULL,
    "performancePatterns" JSONB NOT NULL,
    "optimalLearningStyle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCognitiveProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloomsPerformanceMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "bloomsLevel" "BloomsLevel" NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "avgResponseTime" DOUBLE PRECISION NOT NULL,
    "totalAttempts" INTEGER NOT NULL,
    "successfulAttempts" INTEGER NOT NULL,
    "improvementRate" DOUBLE PRECISION NOT NULL,
    "challengeAreas" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloomsPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseGuideAnalysis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "depthScore" DOUBLE PRECISION NOT NULL,
    "engagementMetrics" JSONB NOT NULL,
    "marketAcceptance" JSONB NOT NULL,
    "studentOutcomes" JSONB NOT NULL,
    "contentQuality" JSONB NOT NULL,
    "improvementAreas" JSONB NOT NULL,
    "competitiveEdge" JSONB NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseGuideAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherInsights" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "actionable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherInsights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOptimizationSuggestion" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "implementation" JSONB NOT NULL,
    "estimatedEffort" TEXT NOT NULL,
    "expectedOutcome" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOptimizationSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseMarketAnalysis_courseId_key" ON "CourseMarketAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseMarketAnalysis_courseId_idx" ON "CourseMarketAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseCompetitor_courseId_idx" ON "CourseCompetitor"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseBloomsAnalysis_courseId_key" ON "CourseBloomsAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseBloomsAnalysis_courseId_idx" ON "CourseBloomsAnalysis"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionBloomsMapping_sectionId_key" ON "SectionBloomsMapping"("sectionId");

-- CreateIndex
CREATE INDEX "SectionBloomsMapping_sectionId_idx" ON "SectionBloomsMapping"("sectionId");

-- CreateIndex
CREATE INDEX "SectionBloomsMapping_bloomsLevel_idx" ON "SectionBloomsMapping"("bloomsLevel");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBloomsProfile_examId_key" ON "ExamBloomsProfile"("examId");

-- CreateIndex
CREATE INDEX "ExamBloomsProfile_examId_idx" ON "ExamBloomsProfile"("examId");

-- CreateIndex
CREATE INDEX "QuestionBank_courseId_subject_topic_idx" ON "QuestionBank"("courseId", "subject", "topic");

-- CreateIndex
CREATE INDEX "QuestionBank_bloomsLevel_difficulty_idx" ON "QuestionBank"("bloomsLevel", "difficulty");

-- CreateIndex
CREATE INDEX "QuestionBank_questionType_idx" ON "QuestionBank"("questionType");

-- CreateIndex
CREATE INDEX "StudentBloomsProgress_userId_idx" ON "StudentBloomsProgress"("userId");

-- CreateIndex
CREATE INDEX "StudentBloomsProgress_courseId_idx" ON "StudentBloomsProgress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentBloomsProgress_userId_courseId_key" ON "StudentBloomsProgress"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCognitiveProfile_userId_key" ON "StudentCognitiveProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentCognitiveProfile_userId_idx" ON "StudentCognitiveProfile"("userId");

-- CreateIndex
CREATE INDEX "BloomsPerformanceMetric_userId_courseId_idx" ON "BloomsPerformanceMetric"("userId", "courseId");

-- CreateIndex
CREATE INDEX "BloomsPerformanceMetric_bloomsLevel_idx" ON "BloomsPerformanceMetric"("bloomsLevel");

-- CreateIndex
CREATE UNIQUE INDEX "CourseGuideAnalysis_courseId_key" ON "CourseGuideAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseGuideAnalysis_courseId_idx" ON "CourseGuideAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "TeacherInsights_teacherId_courseId_idx" ON "TeacherInsights"("teacherId", "courseId");

-- CreateIndex
CREATE INDEX "TeacherInsights_insightType_idx" ON "TeacherInsights"("insightType");

-- CreateIndex
CREATE INDEX "CourseOptimizationSuggestion_courseId_status_idx" ON "CourseOptimizationSuggestion"("courseId", "status");

-- CreateIndex
CREATE INDEX "CourseOptimizationSuggestion_suggestionType_idx" ON "CourseOptimizationSuggestion"("suggestionType");

-- AddForeignKey
ALTER TABLE "CourseMarketAnalysis" ADD CONSTRAINT "CourseMarketAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCompetitor" ADD CONSTRAINT "CourseCompetitor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseBloomsAnalysis" ADD CONSTRAINT "CourseBloomsAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionBloomsMapping" ADD CONSTRAINT "SectionBloomsMapping_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamBloomsProfile" ADD CONSTRAINT "ExamBloomsProfile_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBloomsProgress" ADD CONSTRAINT "StudentBloomsProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBloomsProgress" ADD CONSTRAINT "StudentBloomsProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCognitiveProfile" ADD CONSTRAINT "StudentCognitiveProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloomsPerformanceMetric" ADD CONSTRAINT "BloomsPerformanceMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloomsPerformanceMetric" ADD CONSTRAINT "BloomsPerformanceMetric_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseGuideAnalysis" ADD CONSTRAINT "CourseGuideAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherInsights" ADD CONSTRAINT "TeacherInsights_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherInsights" ADD CONSTRAINT "TeacherInsights_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOptimizationSuggestion" ADD CONSTRAINT "CourseOptimizationSuggestion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
