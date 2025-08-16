import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Enterprise Intelligence Suite Engine
// Provides organizational learning analytics, ROI calculations, and workforce development

interface OrganizationAnalytics {
  organizationId: string;
  totalLearners: number;
  activeLearners: number;
  engagementRate: number;
  completionRate: number;
  averageSkillGrowth: number;
  topPerformingDepartments: DepartmentMetrics[];
  skillGapAnalysis: SkillGap[];
  learningROI: ROIMetrics;
  complianceStatus: ComplianceMetrics;
  budgetAnalysis: BudgetMetrics;
}

interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  activeEmployees: number;
  averageProgress: number;
  skillsAcquired: number;
  performanceScore: number;
}

interface SkillGap {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  priority: "critical" | "high" | "medium" | "low";
  affectedEmployees: number;
  estimatedClosureTime: number; // in days
  recommendedCourses: string[];
}

interface ROIMetrics {
  totalInvestment: number;
  learningHours: number;
  productivityGains: number;
  costSavings: number;
  revenueImpact: number;
  roi: number; // percentage
  breakEvenPoint: Date;
  projectedAnnualReturn: number;
}

interface ComplianceMetrics {
  overallCompliance: number;
  mandatoryCourses: ComplianceCourse[];
  upcomingDeadlines: Deadline[];
  riskAreas: RiskArea[];
}

interface ComplianceCourse {
  courseId: string;
  courseName: string;
  completionRate: number;
  dueDate?: Date;
  atRiskEmployees: number;
}

interface Deadline {
  courseId: string;
  courseName: string;
  deadline: Date;
  affectedEmployees: number;
  completionRate: number;
}

interface RiskArea {
  area: string;
  riskLevel: "high" | "medium" | "low";
  affectedCount: number;
  recommendation: string;
}

interface BudgetMetrics {
  allocatedBudget: number;
  spentBudget: number;
  remainingBudget: number;
  costPerLearner: number;
  costPerCourse: number;
  budgetEfficiency: number;
  projectedOverrun?: number;
}

interface WorkforceDevelopment {
  currentCapabilities: CapabilityMatrix;
  futureNeeds: FutureSkillNeeds[];
  developmentPlan: DevelopmentPlan;
  talentPipeline: TalentMetrics;
}

interface CapabilityMatrix {
  skills: SkillDistribution[];
  competencyLevels: CompetencyLevel[];
  readinessScore: number;
}

interface SkillDistribution {
  skillCategory: string;
  employeeCount: number;
  averageProficiency: number;
  trend: "increasing" | "stable" | "decreasing";
}

interface CompetencyLevel {
  level: string;
  employeeCount: number;
  percentage: number;
}

interface FutureSkillNeeds {
  skill: string;
  demandLevel: "critical" | "high" | "medium" | "low";
  currentSupply: number;
  futuredemand: number;
  gap: number;
  timeframe: string;
}

interface DevelopmentPlan {
  initiatives: DevelopmentInitiative[];
  timeline: DevelopmentTimeline[];
  investmentRequired: number;
  expectedOutcomes: ExpectedOutcome[];
}

interface DevelopmentInitiative {
  id: string;
  name: string;
  targetSkills: string[];
  targetAudience: number;
  duration: number;
  cost: number;
  priority: "high" | "medium" | "low";
}

interface DevelopmentTimeline {
  milestone: string;
  targetDate: Date;
  dependencies: string[];
  status: "planned" | "in_progress" | "completed";
}

interface ExpectedOutcome {
  metric: string;
  currentValue: number;
  targetValue: number;
  timeframe: string;
}

interface TalentMetrics {
  highPerformers: number;
  emergingTalent: number;
  atRiskTalent: number;
  successionReadiness: number;
}

export class SAMEnterpriseEngine {
  async analyzeOrganization(
    organizationId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<OrganizationAnalytics> {
    try {
      // Get all users in the organization
      const users = await db.user.findMany({
        where: {
          metadata: {
            path: ["organizationId"],
            equals: organizationId,
          },
        },
        include: {
          Enrollment: {
            include: {
              Course: true,
            },
          },
          user_progress: true,
          user_achievements: true,
        },
      });

      const totalLearners = users.length;
      const activeLearners = users.filter(
        (u) => u.Enrollment.length > 0
      ).length;

      // Calculate engagement and completion rates
      const engagementRate = this.calculateEngagementRate(users, dateRange);
      const completionRate = this.calculateCompletionRate(users);
      const averageSkillGrowth = await this.calculateSkillGrowth(
        users,
        dateRange
      );

      // Department analysis
      const departmentMetrics = await this.analyzeDepartments(
        organizationId,
        users
      );

      // Skill gap analysis
      const skillGapAnalysis = await this.analyzeSkillGaps(organizationId);

      // ROI calculation
      const learningROI = await this.calculateROI(organizationId, dateRange);

      // Compliance status
      const complianceStatus = await this.analyzeCompliance(
        organizationId,
        users
      );

      // Budget analysis
      const budgetAnalysis = await this.analyzeBudget(organizationId, dateRange);

      return {
        organizationId,
        totalLearners,
        activeLearners,
        engagementRate,
        completionRate,
        averageSkillGrowth,
        topPerformingDepartments: departmentMetrics,
        skillGapAnalysis,
        learningROI,
        complianceStatus,
        budgetAnalysis,
      };
    } catch (error: any) {
      logger.error("Error analyzing organization:", error);
      throw new Error("Failed to analyze organization");
    }
  }

  async predictWorkforceDevelopment(
    organizationId: string,
    timeHorizon: number = 12 // months
  ): Promise<WorkforceDevelopment> {
    try {
      // Analyze current capabilities
      const currentCapabilities = await this.assessCurrentCapabilities(
        organizationId
      );

      // Predict future skill needs
      const futureNeeds = await this.predictFutureSkillNeeds(
        organizationId,
        timeHorizon
      );

      // Generate development plan
      const developmentPlan = await this.generateDevelopmentPlan(
        currentCapabilities,
        futureNeeds,
        timeHorizon
      );

      // Assess talent pipeline
      const talentPipeline = await this.assessTalentPipeline(organizationId);

      return {
        currentCapabilities,
        futureNeeds,
        developmentPlan,
        talentPipeline,
      };
    } catch (error: any) {
      logger.error("Error predicting workforce development:", error);
      throw new Error("Failed to predict workforce development");
    }
  }

  async generateExecutiveReport(
    organizationId: string,
    reportType: "monthly" | "quarterly" | "annual"
  ): Promise<ExecutiveReport> {
    const dateRange = this.getDateRangeForReport(reportType);
    
    const [
      organizationAnalytics,
      workforceDevelopment,
      trendAnalysis,
      recommendations,
    ] = await Promise.all([
      this.analyzeOrganization(organizationId, dateRange),
      this.predictWorkforceDevelopment(organizationId),
      this.analyzeTrends(organizationId, dateRange),
      this.generateRecommendations(organizationId),
    ]);

    return {
      reportId: `exec-${Date.now()}`,
      generatedAt: new Date(),
      period: reportType,
      executiveSummary: this.generateExecutiveSummary(
        organizationAnalytics,
        workforceDevelopment
      ),
      keyMetrics: this.extractKeyMetrics(organizationAnalytics),
      trends: trendAnalysis,
      recommendations,
      risks: this.identifyRisks(organizationAnalytics, workforceDevelopment),
      opportunities: this.identifyOpportunities(
        organizationAnalytics,
        workforceDevelopment
      ),
    };
  }

  private calculateEngagementRate(users: any[], dateRange?: any): number {
    const activeUsers = users.filter((user) => {
      const hasRecentActivity = user.user_progress.some((p: any) => {
        if (!dateRange) return true;
        const lastAccess = new Date(p.lastAccessedAt);
        return lastAccess >= dateRange.start && lastAccess <= dateRange.end;
      });
      return hasRecentActivity;
    });

    return users.length > 0 ? (activeUsers.length / users.length) * 100 : 0;
  }

  private calculateCompletionRate(users: any[]): number {
    let totalEnrollments = 0;
    let completedEnrollments = 0;

    users.forEach((user) => {
      totalEnrollments += user.Enrollment.length;
      completedEnrollments += user.Enrollment.filter(
        (e: any) => e.completedAt !== null
      ).length;
    });

    return totalEnrollments > 0
      ? (completedEnrollments / totalEnrollments) * 100
      : 0;
  }

  private async calculateSkillGrowth(
    users: any[],
    dateRange?: any
  ): Promise<number> {
    // Calculate average skill growth based on achievements and progress
    let totalGrowth = 0;
    let measurementCount = 0;

    for (const user of users) {
      const achievements = user.user_achievements.filter((a: any) => {
        if (!dateRange) return true;
        const achievedDate = new Date(a.achievedAt);
        return achievedDate >= dateRange.start && achievedDate <= dateRange.end;
      });

      if (achievements.length > 0) {
        // Simplified skill growth calculation
        totalGrowth += achievements.length * 10; // 10% per achievement
        measurementCount++;
      }
    }

    return measurementCount > 0 ? totalGrowth / measurementCount : 0;
  }

  private async analyzeDepartments(
    organizationId: string,
    users: any[]
  ): Promise<DepartmentMetrics[]> {
    // Group users by department
    const departmentGroups = new Map<string, any[]>();
    
    users.forEach((user) => {
      const dept = user.metadata?.department || "Unknown";
      if (!departmentGroups.has(dept)) {
        departmentGroups.set(dept, []);
      }
      departmentGroups.get(dept)!.push(user);
    });

    const metrics: DepartmentMetrics[] = [];
    
    for (const [deptName, deptUsers] of departmentGroups) {
      const activeCount = deptUsers.filter(
        (u) => u.Enrollment.length > 0
      ).length;
      
      const totalProgress = deptUsers.reduce((sum, user) => {
        const userProgress = user.user_progress.reduce(
          (pSum: number, p: any) => pSum + (p.progressPercentage || 0),
          0
        );
        return sum + userProgress / Math.max(1, user.user_progress.length);
      }, 0);

      const skillsAcquired = deptUsers.reduce(
        (sum, user) => sum + user.user_achievements.length,
        0
      );

      metrics.push({
        departmentId: deptName.toLowerCase().replace(/\s+/g, "-"),
        departmentName: deptName,
        totalEmployees: deptUsers.length,
        activeEmployees: activeCount,
        averageProgress: totalProgress / Math.max(1, deptUsers.length),
        skillsAcquired,
        performanceScore: this.calculateDepartmentScore(
          activeCount,
          deptUsers.length,
          skillsAcquired
        ),
      });
    }

    return metrics.sort((a, b) => b.performanceScore - a.performanceScore);
  }

  private calculateDepartmentScore(
    active: number,
    total: number,
    skills: number
  ): number {
    const engagementScore = (active / Math.max(1, total)) * 40;
    const skillScore = Math.min(40, (skills / Math.max(1, total)) * 10);
    const sizeBonus = Math.min(20, Math.log10(Math.max(1, total)) * 10);
    
    return engagementScore + skillScore + sizeBonus;
  }

  private async analyzeSkillGaps(organizationId: string): Promise<SkillGap[]> {
    // This would typically involve comparing current skills with required skills
    // For now, returning mock data
    return [
      {
        skillId: "ai-ml",
        skillName: "AI & Machine Learning",
        currentLevel: 2.5,
        targetLevel: 4.0,
        gap: 1.5,
        priority: "critical",
        affectedEmployees: 120,
        estimatedClosureTime: 180,
        recommendedCourses: ["intro-to-ai", "ml-fundamentals", "deep-learning"],
      },
      {
        skillId: "cloud-computing",
        skillName: "Cloud Computing",
        currentLevel: 3.0,
        targetLevel: 4.5,
        gap: 1.5,
        priority: "high",
        affectedEmployees: 85,
        estimatedClosureTime: 120,
        recommendedCourses: ["aws-basics", "azure-fundamentals", "cloud-architecture"],
      },
    ];
  }

  private async calculateROI(
    organizationId: string,
    dateRange?: any
  ): Promise<ROIMetrics> {
    // Simplified ROI calculation
    const totalInvestment = 500000; // Example investment
    const learningHours = 12000;
    const productivityGains = 180000;
    const costSavings = 75000;
    const revenueImpact = 320000;
    
    const totalReturns = productivityGains + costSavings + revenueImpact;
    const roi = ((totalReturns - totalInvestment) / totalInvestment) * 100;

    return {
      totalInvestment,
      learningHours,
      productivityGains,
      costSavings,
      revenueImpact,
      roi,
      breakEvenPoint: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      projectedAnnualReturn: totalReturns * 1.2,
    };
  }

  private async analyzeCompliance(
    organizationId: string,
    users: any[]
  ): Promise<ComplianceMetrics> {
    // Analyze compliance training completion
    const mandatoryCourses: ComplianceCourse[] = [
      {
        courseId: "security-awareness",
        courseName: "Security Awareness Training",
        completionRate: 87,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        atRiskEmployees: 23,
      },
      {
        courseId: "data-privacy",
        courseName: "Data Privacy Fundamentals",
        completionRate: 92,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        atRiskEmployees: 15,
      },
    ];

    const upcomingDeadlines: Deadline[] = mandatoryCourses
      .filter((c) => c.dueDate)
      .map((c) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        deadline: c.dueDate!,
        affectedEmployees: c.atRiskEmployees,
        completionRate: c.completionRate,
      }));

    const riskAreas: RiskArea[] = [];
    if (mandatoryCourses.some((c) => c.completionRate < 90)) {
      riskAreas.push({
        area: "Compliance Training",
        riskLevel: "high",
        affectedCount: mandatoryCourses.reduce((sum, c) => sum + c.atRiskEmployees, 0),
        recommendation: "Implement mandatory training reminders and escalation",
      });
    }

    const overallCompliance =
      mandatoryCourses.reduce((sum, c) => sum + c.completionRate, 0) /
      mandatoryCourses.length;

    return {
      overallCompliance,
      mandatoryCourses,
      upcomingDeadlines,
      riskAreas,
    };
  }

  private async analyzeBudget(
    organizationId: string,
    dateRange?: any
  ): Promise<BudgetMetrics> {
    // Example budget analysis
    const allocatedBudget = 1000000;
    const spentBudget = 650000;
    const remainingBudget = allocatedBudget - spentBudget;
    
    const users = await db.user.count({
      where: {
        metadata: {
          path: ["organizationId"],
          equals: organizationId,
        },
      },
    });

    const courses = await db.Course.count();

    return {
      allocatedBudget,
      spentBudget,
      remainingBudget,
      costPerLearner: spentBudget / Math.max(1, users),
      costPerCourse: spentBudget / Math.max(1, courses),
      budgetEfficiency: 85, // percentage
      projectedOverrun: undefined, // No overrun projected
    };
  }

  private async assessCurrentCapabilities(
    organizationId: string
  ): Promise<CapabilityMatrix> {
    // Assess current workforce capabilities
    const skills: SkillDistribution[] = [
      {
        skillCategory: "Technical",
        employeeCount: 450,
        averageProficiency: 3.2,
        trend: "increasing",
      },
      {
        skillCategory: "Leadership",
        employeeCount: 120,
        averageProficiency: 3.8,
        trend: "stable",
      },
      {
        skillCategory: "Communication",
        employeeCount: 600,
        averageProficiency: 3.5,
        trend: "increasing",
      },
    ];

    const competencyLevels: CompetencyLevel[] = [
      { level: "Expert", employeeCount: 50, percentage: 8 },
      { level: "Advanced", employeeCount: 150, percentage: 25 },
      { level: "Intermediate", employeeCount: 250, percentage: 42 },
      { level: "Beginner", employeeCount: 150, percentage: 25 },
    ];

    return {
      skills,
      competencyLevels,
      readinessScore: 72, // Overall readiness score
    };
  }

  private async predictFutureSkillNeeds(
    organizationId: string,
    timeHorizon: number
  ): Promise<FutureSkillNeeds[]> {
    // Predict future skill requirements
    return [
      {
        skill: "AI/ML Engineering",
        demandLevel: "critical",
        currentSupply: 25,
        futuredemand: 80,
        gap: 55,
        timeframe: `${timeHorizon} months`,
      },
      {
        skill: "Cloud Architecture",
        demandLevel: "high",
        currentSupply: 40,
        futuredemand: 65,
        gap: 25,
        timeframe: `${timeHorizon} months`,
      },
      {
        skill: "Data Analytics",
        demandLevel: "high",
        currentSupply: 60,
        futuredemand: 100,
        gap: 40,
        timeframe: `${timeHorizon} months`,
      },
    ];
  }

  private async generateDevelopmentPlan(
    currentCapabilities: CapabilityMatrix,
    futureNeeds: FutureSkillNeeds[],
    timeHorizon: number
  ): Promise<DevelopmentPlan> {
    const initiatives: DevelopmentInitiative[] = futureNeeds.map((need) => ({
      id: `init-${need.skill.toLowerCase().replace(/\s+/g, "-")}`,
      name: `${need.skill} Development Program`,
      targetSkills: [need.skill],
      targetAudience: need.gap,
      duration: Math.ceil(timeHorizon / 3), // months
      cost: need.gap * 5000, // $5000 per person
      priority: need.demandLevel === "critical" ? "high" : "medium",
    }));

    const timeline: DevelopmentTimeline[] = [
      {
        milestone: "Program Launch",
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dependencies: [],
        status: "planned",
      },
      {
        milestone: "Mid-point Review",
        targetDate: new Date(Date.now() + (timeHorizon / 2) * 30 * 24 * 60 * 60 * 1000),
        dependencies: ["Program Launch"],
        status: "planned",
      },
      {
        milestone: "Program Completion",
        targetDate: new Date(Date.now() + timeHorizon * 30 * 24 * 60 * 60 * 1000),
        dependencies: ["Mid-point Review"],
        status: "planned",
      },
    ];

    const investmentRequired = initiatives.reduce((sum, init) => sum + init.cost, 0);

    const expectedOutcomes: ExpectedOutcome[] = [
      {
        metric: "Skill Gap Closure",
        currentValue: 0,
        targetValue: 80,
        timeframe: `${timeHorizon} months`,
      },
      {
        metric: "Employee Readiness",
        currentValue: currentCapabilities.readinessScore,
        targetValue: 90,
        timeframe: `${timeHorizon} months`,
      },
    ];

    return {
      initiatives,
      timeline,
      investmentRequired,
      expectedOutcomes,
    };
  }

  private async assessTalentPipeline(
    organizationId: string
  ): Promise<TalentMetrics> {
    // Assess talent pipeline health
    return {
      highPerformers: 85,
      emergingTalent: 120,
      atRiskTalent: 25,
      successionReadiness: 72, // percentage
    };
  }

  private getDateRangeForReport(
    reportType: "monthly" | "quarterly" | "annual"
  ): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (reportType) {
      case "monthly":
        start.setMonth(start.getMonth() - 1);
        break;
      case "quarterly":
        start.setMonth(start.getMonth() - 3);
        break;
      case "annual":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  private async analyzeTrends(
    organizationId: string,
    dateRange: any
  ): Promise<TrendAnalysis> {
    return {
      engagementTrend: "increasing",
      completionTrend: "stable",
      skillGrowthTrend: "increasing",
      roiTrend: "increasing",
      topGrowthAreas: ["Technical Skills", "Leadership", "Innovation"],
      concernAreas: ["Compliance Training", "Soft Skills"],
    };
  }

  private generateExecutiveSummary(
    analytics: OrganizationAnalytics,
    workforce: WorkforceDevelopment
  ): string {
    return `Organization shows ${analytics.engagementRate.toFixed(1)}% engagement with ${
      analytics.averageSkillGrowth.toFixed(1)
    }% skill growth. ROI stands at ${analytics.learningROI.roi.toFixed(1)}%. 
    Key focus areas include closing ${workforce.futureNeeds.length} critical skill gaps 
    with an investment of $${workforce.developmentPlan.investmentRequired.toLocaleString()}.`;
  }

  private extractKeyMetrics(analytics: OrganizationAnalytics): KeyMetric[] {
    return [
      {
        name: "Engagement Rate",
        value: analytics.engagementRate,
        unit: "%",
        change: 5.2,
        trend: "up",
      },
      {
        name: "Learning ROI",
        value: analytics.learningROI.roi,
        unit: "%",
        change: 12.5,
        trend: "up",
      },
      {
        name: "Skill Growth",
        value: analytics.averageSkillGrowth,
        unit: "%",
        change: 3.8,
        trend: "up",
      },
      {
        name: "Compliance Rate",
        value: analytics.complianceStatus.overallCompliance,
        unit: "%",
        change: -2.1,
        trend: "down",
      },
    ];
  }

  private identifyRisks(
    analytics: OrganizationAnalytics,
    workforce: WorkforceDevelopment
  ): Risk[] {
    const risks: Risk[] = [];

    if (analytics.complianceStatus.overallCompliance < 95) {
      risks.push({
        area: "Compliance",
        severity: "high",
        description: "Compliance training below target threshold",
        mitigation: "Implement mandatory training escalation process",
      });
    }

    if (workforce.talentPipeline.atRiskTalent > 20) {
      risks.push({
        area: "Talent Retention",
        severity: "medium",
        description: "Elevated risk of talent attrition",
        mitigation: "Enhance engagement and career development programs",
      });
    }

    return risks;
  }

  private identifyOpportunities(
    analytics: OrganizationAnalytics,
    workforce: WorkforceDevelopment
  ): Opportunity[] {
    return [
      {
        area: "AI/ML Skills",
        potential: "high",
        description: "Growing demand for AI/ML capabilities",
        action: "Launch comprehensive AI/ML training program",
        expectedImpact: "$2.5M revenue impact",
      },
      {
        area: "Cross-functional Training",
        potential: "medium",
        description: "Improve collaboration through cross-training",
        action: "Implement department rotation program",
        expectedImpact: "15% productivity improvement",
      },
    ];
  }

  private async generateRecommendations(
    organizationId: string
  ): Promise<Recommendation[]> {
    return [
      {
        priority: "high",
        category: "Skills Development",
        recommendation: "Accelerate AI/ML training initiatives",
        rationale: "Critical skill gap affecting 55 employees",
        expectedBenefit: "Close skill gap within 6 months",
        requiredInvestment: 275000,
        timeframe: "6 months",
      },
      {
        priority: "medium",
        category: "Compliance",
        recommendation: "Implement automated compliance tracking",
        rationale: "Manual tracking causing delays and gaps",
        expectedBenefit: "Achieve 99% compliance rate",
        requiredInvestment: 50000,
        timeframe: "3 months",
      },
    ];
  }
}

// Type definitions for executive report
interface ExecutiveReport {
  reportId: string;
  generatedAt: Date;
  period: string;
  executiveSummary: string;
  keyMetrics: KeyMetric[];
  trends: TrendAnalysis;
  recommendations: Recommendation[];
  risks: Risk[];
  opportunities: Opportunity[];
}

interface KeyMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: "up" | "down" | "stable";
}

interface TrendAnalysis {
  engagementTrend: string;
  completionTrend: string;
  skillGrowthTrend: string;
  roiTrend: string;
  topGrowthAreas: string[];
  concernAreas: string[];
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  category: string;
  recommendation: string;
  rationale: string;
  expectedBenefit: string;
  requiredInvestment: number;
  timeframe: string;
}

interface Risk {
  area: string;
  severity: "high" | "medium" | "low";
  description: string;
  mitigation: string;
}

interface Opportunity {
  area: string;
  potential: "high" | "medium" | "low";
  description: string;
  action: string;
  expectedImpact: string;
}

// Export singleton instance
export const samEnterpriseEngine = new SAMEnterpriseEngine();