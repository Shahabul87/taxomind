// Prerequisite Analyzer - Core logic for dependency tracking and validation

import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import {
  PrerequisiteRule,
  StudentPrerequisiteStatus,
  PrerequisiteCheck,
  PrerequisiteStatus,
  CheckEvidence,
  PrerequisiteRecommendation,
  PrerequisiteGraph,
  PrerequisiteNode,
  PrerequisiteEdge,
  LearningPath,
  LearningPathStep,
  PrerequisiteQuery,
  PrerequisiteValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  PrerequisiteType,
  PrerequisiteStrength,
  EvidenceType,
  RecommendationType,
  PathStepType
} from './types';

export class PrerequisiteAnalyzer {
  private graphCache = new Map<string, PrerequisiteGraph>();
  private rulesCache = new Map<string, PrerequisiteRule[]>();

  // Check if student meets prerequisites for specific content
  async checkStudentPrerequisites(
    studentId: string,
    contentId: string,
    courseId: string
  ): Promise<StudentPrerequisiteStatus> {
    // Get prerequisite rules for this content
    const prerequisites = await this.getPrerequisiteRules(contentId, courseId);
    
    // Check each prerequisite
    const checks: PrerequisiteCheck[] = [];
    for (const prereq of prerequisites) {
      const check = await this.evaluatePrerequisite(studentId, prereq);
      checks.push(check);
    }

    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(checks);
    const readinessScore = this.calculateReadinessScore(checks);
    const recommendations = await this.generateRecommendations(studentId, contentId, checks);

    return {
      studentId,
      contentId,
      prerequisites: checks,
      overallStatus,
      readinessScore,
      recommendations,
      lastUpdated: new Date()
    };
  }

  // Evaluate a single prerequisite for a student
  private async evaluatePrerequisite(
    studentId: string,
    rule: PrerequisiteRule
  ): Promise<PrerequisiteCheck> {
    const evidence = await this.collectEvidence(studentId, rule);
    const { met, progress, confidence } = this.analyzeEvidence(evidence, rule);
    
    const timeToComplete = met ? 0 : await this.estimateTimeToComplete(
      studentId, 
      rule.sourceContentId
    );

    return {
      prerequisiteId: rule.id,
      sourceContentId: rule.sourceContentId,
      required: rule.strength === 'critical' || rule.strength === 'important',
      met,
      progress,
      timeToComplete,
      confidence,
      evidence
    };
  }

  // Collect evidence for prerequisite evaluation
  private async collectEvidence(
    studentId: string,
    rule: PrerequisiteRule
  ): Promise<CheckEvidence[]> {
    const evidence: CheckEvidence[] = [];
    const sourceContentId = rule.sourceContentId;

    // Check completion status
    const completion = await db.studentInteraction.findFirst({
      where: {
        studentId,
        sectionId: sourceContentId,
        eventName: 'section_complete'
      },
      orderBy: { timestamp: 'desc' }
    });

    if (completion) {
      evidence.push({
        type: 'completion_record',
        value: true,
        timestamp: completion.timestamp,
        weight: 1.0,
        source: 'database'
      });
    }

    // Check quiz scores
    const quizResults = await db.studentInteraction.findMany({
      where: {
        studentId,
        sectionId: sourceContentId,
        eventName: 'quiz_complete'
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    if (quizResults.length > 0) {
      const avgScore = quizResults.reduce((sum, result) => {
        const score = result.data ? (result.data as any).score || 0 : 0;
        return sum + score;
      }, 0) / quizResults.length;

      evidence.push({
        type: 'quiz_score',
        value: avgScore,
        timestamp: quizResults[0].timestamp,
        weight: 0.8,
        source: 'database'
      });
    }

    // Check time spent
    const timeSpent = await this.calculateTimeSpent(studentId, sourceContentId);
    if (timeSpent > 0) {
      evidence.push({
        type: 'time_spent',
        value: timeSpent,
        timestamp: new Date(),
        weight: 0.6,
        source: 'analytics'
      });
    }

    // Check engagement metrics
    const engagementScore = await this.calculateEngagementScore(studentId, sourceContentId);
    if (engagementScore > 0) {
      evidence.push({
        type: 'engagement_metrics',
        value: engagementScore,
        timestamp: new Date(),
        weight: 0.7,
        source: 'analytics'
      });
    }

    // Check for help requests
    const helpRequests = await db.studentInteraction.count({
      where: {
        studentId,
        sectionId: sourceContentId,
        eventName: 'help_request'
      }
    });

    if (helpRequests > 0) {
      evidence.push({
        type: 'help_requests',
        value: helpRequests,
        timestamp: new Date(),
        weight: 0.5,
        source: 'database'
      });
    }

    return evidence;
  }

  // Analyze evidence to determine if prerequisite is met
  private analyzeEvidence(
    evidence: CheckEvidence[],
    rule: PrerequisiteRule
  ): { met: boolean; progress: number; confidence: number } {
    if (evidence.length === 0) {
      return { met: false, progress: 0, confidence: 1.0 };
    }

    let weightedScore = 0;
    let totalWeight = 0;
    let confidence = 0;

    // Evaluate each condition
    for (const condition of rule.conditions) {
      const relevantEvidence = evidence.filter(e => 
        this.isRelevantEvidence(e, condition)
      );

      if (relevantEvidence.length > 0) {
        const conditionMet = this.evaluateCondition(relevantEvidence, condition);
        weightedScore += conditionMet ? condition.weight : 0;
        totalWeight += condition.weight;
        confidence += relevantEvidence.reduce((sum, e) => sum + e.weight, 0) / relevantEvidence.length;
      }
    }

    const progress = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const met = this.determineIfMet(progress, rule.strength);
    
    return {
      met,
      progress,
      confidence: Math.min(confidence / rule.conditions.length, 1.0)
    };
  }

  // Determine if evidence is relevant to a condition
  private isRelevantEvidence(evidence: CheckEvidence, condition: any): boolean {
    const evidenceTypeMap: Record<string, EvidenceType[]> = {
      'completion_status': ['completion_record'],
      'mastery_level': ['quiz_score', 'assignment_grade'],
      'time_spent': ['time_spent'],
      'engagement_level': ['engagement_metrics'],
      'help_requests': ['help_requests']
    };

    const relevantTypes = evidenceTypeMap[condition.type] || [];
    return relevantTypes.includes(evidence.type);
  }

  // Evaluate a specific condition
  private evaluateCondition(evidence: CheckEvidence[], condition: any): boolean {
    if (evidence.length === 0) return false;

    const latestEvidence = evidence.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    switch (condition.operator) {
      case 'equals':
        return latestEvidence.value === condition.value;
      case 'greater_than':
        return Number(latestEvidence.value) > Number(condition.value);
      case 'less_than':
        return Number(latestEvidence.value) < Number(condition.value);
      case 'greater_equal':
        return Number(latestEvidence.value) >= Number(condition.value);
      case 'less_equal':
        return Number(latestEvidence.value) <= Number(condition.value);
      default:
        return false;
    }
  }

  // Determine if prerequisite is met based on progress and strength
  private determineIfMet(progress: number, strength: PrerequisiteStrength): boolean {
    const thresholds = {
      'critical': 0.9,
      'important': 0.8,
      'helpful': 0.7,
      'suggested': 0.6,
      'optional': 0.5
    };

    return progress >= thresholds[strength];
  }

  // Calculate overall prerequisite status
  private calculateOverallStatus(checks: PrerequisiteCheck[]): PrerequisiteStatus {
    const requiredChecks = checks.filter(check => check.required);
    const optionalChecks = checks.filter(check => !check.required);

    const requiredMet = requiredChecks.filter(check => check.met).length;
    const optionalMet = optionalChecks.filter(check => check.met).length;

    const requiredTotal = requiredChecks.length;
    const optionalTotal = optionalChecks.length;

    if (requiredTotal === 0) {
      return 'all_met';
    }

    if (requiredMet === requiredTotal) {
      if (optionalTotal === 0 || optionalMet / optionalTotal >= 0.7) {
        return 'all_met';
      }
      return 'mostly_met';
    }

    if (requiredMet / requiredTotal >= 0.7) {
      return 'mostly_met';
    }

    if (requiredMet > 0) {
      return 'partially_met';
    }

    if (checks.some(check => check.required && check.progress < 0.1)) {
      return 'blocked';
    }

    return 'not_met';
  }

  // Calculate readiness score (0-1)
  private calculateReadinessScore(checks: PrerequisiteCheck[]): number {
    if (checks.length === 0) return 1.0;

    let totalScore = 0;
    let totalWeight = 0;

    checks.forEach(check => {
      const weight = check.required ? 1.0 : 0.5;
      totalScore += check.progress * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  // Generate recommendations for student
  private async generateRecommendations(
    studentId: string,
    contentId: string,
    checks: PrerequisiteCheck[]
  ): Promise<PrerequisiteRecommendation[]> {
    const recommendations: PrerequisiteRecommendation[] = [];

    // Check for missing critical prerequisites
    const missingCritical = checks.filter(check => 
      check.required && !check.met && check.progress < 0.5
    );

    for (const check of missingCritical) {
      recommendations.push({
        type: 'complete_prerequisite',
        contentId: check.sourceContentId,
        priority: 'critical',
        reason: 'Critical prerequisite not met - must complete before proceeding',
        estimatedImpact: 0.8,
        estimatedTime: check.timeToComplete,
        difficulty: await this.getContentDifficulty(check.sourceContentId),
        alternativeOptions: await this.findAlternativeContent(check.sourceContentId)
      });
    }

    // Check for partially met prerequisites
    const partiallyMet = checks.filter(check =>
      check.required && !check.met && check.progress >= 0.5
    );

    for (const check of partiallyMet) {
      recommendations.push({
        type: 'review_content',
        contentId: check.sourceContentId,
        priority: 'high',
        reason: 'Prerequisite partially met - review recommended before proceeding',
        estimatedImpact: 0.6,
        estimatedTime: Math.ceil(check.timeToComplete * 0.5),
        difficulty: await this.getContentDifficulty(check.sourceContentId),
        alternativeOptions: []
      });
    }

    // Check if student can proceed with caution
    const readinessScore = this.calculateReadinessScore(checks);
    if (readinessScore > 0.6 && readinessScore < 0.8) {
      recommendations.push({
        type: 'proceed_with_caution',
        contentId: contentId,
        priority: 'medium',
        reason: 'Some prerequisites not fully met - proceed with additional support',
        estimatedImpact: 0.4,
        estimatedTime: 0,
        difficulty: await this.getContentDifficulty(contentId),
        alternativeOptions: await this.findEasierAlternatives(contentId)
      });
    }

    // Check if student should delay
    if (readinessScore < 0.4) {
      recommendations.push({
        type: 'delay_content',
        contentId: contentId,
        priority: 'critical',
        reason: 'Insufficient prerequisites met - focus on foundational content first',
        estimatedImpact: 0.9,
        estimatedTime: 0,
        difficulty: await this.getContentDifficulty(contentId),
        alternativeOptions: await this.findPrerequisitePath(studentId, contentId)
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Build prerequisite graph for a course
  async buildPrerequisiteGraph(courseId: string): Promise<PrerequisiteGraph> {
    // Check cache first
    if (this.graphCache.has(courseId)) {
      return this.graphCache.get(courseId)!;
    }

    console.log(`Building prerequisite graph for course: ${courseId}`);

    // Get all content for the course
    const sections = await db.section.findMany({
      where: { courseId },
      include: { chapter: true },
      orderBy: { position: 'asc' }
    });

    // Get prerequisite rules
    const rules = await this.getPrerequisiteRules(null, courseId);

    // Build nodes
    const nodes = new Map<string, PrerequisiteNode>();
    for (const section of sections) {
      const node: PrerequisiteNode = {
        id: section.id,
        contentId: section.id,
        type: 'lesson',
        title: section.title,
        description: section.description,
        metadata: {
          difficulty: this.inferDifficulty(section),
          estimatedTime: section.duration || 30,
          concepts: this.extractConcepts(section),
          skills: this.extractSkills(section),
          bloomsLevels: ['understand'],
          cognitiveLoad: {
            intrinsic: 0.6,
            extraneous: 0.3,
            germane: 0.7
          },
          successRate: await this.calculateSuccessRate(section.id),
          averageAttempts: await this.calculateAverageAttempts(section.id),
          dropoutRate: await this.calculateDropoutRate(section.id)
        },
        dependencies: [],
        dependents: [],
        level: 0
      };

      nodes.set(section.id, node);
    }

    // Build edges
    const edges = new Map<string, PrerequisiteEdge>();
    for (const rule of rules) {
      const edge: PrerequisiteEdge = {
        id: rule.id,
        sourceId: rule.sourceContentId,
        targetId: rule.targetContentId,
        type: rule.type,
        strength: rule.strength,
        weight: this.strengthToWeight(rule.strength),
        metadata: {
          confidence: rule.metadata.confidence,
          evidenceStrength: rule.metadata.impactOnSuccess,
          impactOnSuccess: rule.metadata.impactOnSuccess,
          created: rule.createdAt,
          lastValidated: rule.updatedAt,
          validationSource: rule.metadata.evidenceSource
        }
      };

      edges.set(rule.id, edge);

      // Update node dependencies
      const sourceNode = nodes.get(rule.sourceContentId);
      const targetNode = nodes.get(rule.targetContentId);
      
      if (sourceNode && targetNode) {
        sourceNode.dependents.push(rule.targetContentId);
        targetNode.dependencies.push(rule.sourceContentId);
      }
    }

    // Calculate levels using topological sort
    this.calculateNodeLevels(nodes, edges);

    const graph: PrerequisiteGraph = {
      nodes,
      edges,
      metadata: {
        courseId,
        totalNodes: nodes.size,
        totalEdges: edges.size,
        maxDepth: Math.max(...Array.from(nodes.values()).map(n => n.level)),
        averageDependencies: Array.from(nodes.values()).reduce((sum, n) => sum + n.dependencies.length, 0) / nodes.size,
        lastBuilt: new Date(),
        version: '1.0'
      }
    };

    // Cache the graph
    this.graphCache.set(courseId, graph);
    await this.saveGraphToCache(courseId, graph);

    return graph;
  }

  // Generate optimal learning path
  async generateLearningPath(
    studentId: string,
    targetContentId: string,
    courseId: string
  ): Promise<LearningPath> {
    const graph = await this.buildPrerequisiteGraph(courseId);
    const studentStatus = await this.getStudentProgress(studentId, courseId);
    
    // Find prerequisite chain to target
    const prerequisiteChain = this.findPrerequisiteChain(graph, targetContentId);
    
    // Filter out completed content
    const incompletePath = prerequisiteChain.filter(contentId => 
      !studentStatus.completedContent.includes(contentId)
    );

    // Build learning path steps
    const steps: LearningPathStep[] = [];
    for (let i = 0; i < incompletePath.length; i++) {
      const contentId = incompletePath[i];
      const node = graph.nodes.get(contentId);
      
      if (node) {
        const step: LearningPathStep = {
          stepNumber: i,
          contentId,
          type: this.determineStepType(contentId, i, incompletePath.length),
          isRequired: true,
          estimatedTime: node.metadata.estimatedTime,
          prerequisites: node.dependencies.filter(dep => 
            incompletePath.includes(dep) && incompletePath.indexOf(dep) < i
          ),
          unlocks: node.dependents.filter(dep => 
            incompletePath.includes(dep) && incompletePath.indexOf(dep) > i
          ),
          difficulty: node.metadata.difficulty,
          cognitiveLoad: node.metadata.cognitiveLoad,
          alternativeOptions: await this.findAlternativeContent(contentId),
          adaptiveAdjustments: []
        };

        steps.push(step);
      }
    }

    // Calculate path metrics
    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const difficultyProgression = steps.map(step => step.difficulty);
    const completionProbability = await this.estimateCompletionProbability(
      studentId, 
      steps
    );

    return {
      id: `path_${studentId}_${targetContentId}_${Date.now()}`,
      studentId,
      courseId,
      targetContentId,
      path: steps,
      totalEstimatedTime: totalTime,
      difficultyProgression,
      completionProbability,
      alternativePaths: await this.generateAlternativePaths(graph, targetContentId, studentStatus),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Validate prerequisite structure
  async validatePrerequisiteStructure(courseId: string): Promise<PrerequisiteValidationResult> {
    const graph = await this.buildPrerequisiteGraph(courseId);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check for circular dependencies
    const cycles = this.detectCircularDependencies(graph);
    cycles.forEach(cycle => {
      errors.push({
        type: 'circular_dependency',
        contentId: cycle[0],
        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
        severity: 'critical',
        suggestedFix: 'Remove one of the prerequisite relationships in the cycle'
      });
    });

    // Check for orphaned content
    const orphans = this.findOrphanedContent(graph);
    orphans.forEach(contentId => {
      warnings.push({
        type: 'orphaned_content',
        contentId,
        message: 'Content has no prerequisites or dependents',
        recommendation: 'Consider adding prerequisite relationships'
      });
    });

    // Check for impossible paths
    const unreachable = this.findUnreachableContent(graph);
    unreachable.forEach(contentId => {
      errors.push({
        type: 'impossible_path',
        contentId,
        message: 'Content cannot be reached due to prerequisite structure',
        severity: 'high',
        suggestedFix: 'Add prerequisite chain to make content reachable'
      });
    });

    // Calculate overall score
    const totalNodes = graph.nodes.size;
    const errorWeight = errors.length * 0.3;
    const warningWeight = warnings.length * 0.1;
    const overallScore = Math.max(0, 1 - (errorWeight + warningWeight) / totalNodes);

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings,
      suggestions,
      overallScore
    };
  }

  // Helper methods

  private async getPrerequisiteRules(
    contentId: string | null, 
    courseId: string
  ): Promise<PrerequisiteRule[]> {
    const cacheKey = `prereq_rules_${courseId}_${contentId || 'all'}`;
    
    if (this.rulesCache.has(cacheKey)) {
      return this.rulesCache.get(cacheKey)!;
    }

    // For now, create sample rules based on content position
    // In real implementation, this would come from database
    const sections = await db.section.findMany({
      where: { courseId },
      orderBy: { position: 'asc' }
    });

    const rules: PrerequisiteRule[] = [];
    
    // Create sequential prerequisites
    for (let i = 1; i < sections.length; i++) {
      const rule: PrerequisiteRule = {
        id: `rule_${sections[i-1].id}_${sections[i].id}`,
        sourceContentId: sections[i-1].id,
        targetContentId: sections[i].id,
        type: 'sequence_dependency',
        strength: 'important',
        metadata: {
          confidence: 0.8,
          evidenceSource: 'curriculum_analysis',
          impactOnSuccess: 0.7,
          difficulty: 'intermediate',
          estimatedTime: 30,
          successRate: 0.85,
          failureRate: 0.15,
          learningGap: 0.3,
          cognitiveLoad: {
            intrinsic: 0.6,
            extraneous: 0.2,
            germane: 0.8
          },
          bloomsTaxonomy: ['understand', 'apply']
        },
        conditions: [
          {
            id: `condition_${sections[i-1].id}_completion`,
            type: 'completion_status',
            field: 'completed',
            operator: 'equals',
            value: true,
            weight: 1.0,
            description: 'Must complete previous section'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      rules.push(rule);
    }

    this.rulesCache.set(cacheKey, rules);
    return rules;
  }

  private strengthToWeight(strength: PrerequisiteStrength): number {
    const weights = {
      'critical': 1.0,
      'important': 0.8,
      'helpful': 0.6,
      'suggested': 0.4,
      'optional': 0.2
    };
    return weights[strength];
  }

  private calculateNodeLevels(
    nodes: Map<string, PrerequisiteNode>,
    edges: Map<string, PrerequisiteEdge>
  ): void {
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (nodeId: string): number => {
      if (temp.has(nodeId)) return 0; // Circular dependency
      if (visited.has(nodeId)) return nodes.get(nodeId)?.level || 0;

      temp.add(nodeId);
      
      const node = nodes.get(nodeId);
      if (!node) return 0;

      let maxDepth = 0;
      for (const depId of node.dependencies) {
        maxDepth = Math.max(maxDepth, visit(depId) + 1);
      }

      node.level = maxDepth;
      temp.delete(nodeId);
      visited.add(nodeId);
      
      return maxDepth;
    };

    Array.from(nodes.keys()).forEach(visit);
  }

  private findPrerequisiteChain(
    graph: PrerequisiteGraph,
    targetContentId: string
  ): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();

    const traverse = (contentId: string) => {
      if (visited.has(contentId)) return;
      visited.add(contentId);

      const node = graph.nodes.get(contentId);
      if (node) {
        // Visit dependencies first
        node.dependencies.forEach(traverse);
        chain.push(contentId);
      }
    };

    traverse(targetContentId);
    return chain;
  }

  private determineStepType(
    contentId: string,
    position: number,
    totalSteps: number
  ): PathStepType {
    if (position === 0) return 'prerequisite';
    if (position === totalSteps - 1) return 'core_content';
    if (position % 3 === 0) return 'checkpoint';
    return 'core_content';
  }

  private detectCircularDependencies(graph: PrerequisiteGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart));
        return true;
      }
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = graph.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (hasCycle(depId)) return true;
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
      return false;
    };

    Array.from(graph.nodes.keys()).forEach(nodeId => {
      if (!visited.has(nodeId)) {
        hasCycle(nodeId);
      }
    });

    return cycles;
  }

  private findOrphanedContent(graph: PrerequisiteGraph): string[] {
    const connected = new Set<string>();
    
    graph.edges.forEach(edge => {
      connected.add(edge.sourceId);
      connected.add(edge.targetId);
    });

    return Array.from(graph.nodes.keys()).filter(nodeId => 
      !connected.has(nodeId)
    );
  }

  private findUnreachableContent(graph: PrerequisiteGraph): string[] {
    // Find content that has prerequisites but no path from entry points
    const entryPoints = Array.from(graph.nodes.values())
      .filter(node => node.dependencies.length === 0)
      .map(node => node.id);

    const reachable = new Set<string>();
    const queue = [...entryPoints];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (reachable.has(nodeId)) continue;
      
      reachable.add(nodeId);
      const node = graph.nodes.get(nodeId);
      if (node) {
        queue.push(...node.dependents);
      }
    }

    return Array.from(graph.nodes.keys()).filter(nodeId => 
      !reachable.has(nodeId) && graph.nodes.get(nodeId)!.dependencies.length > 0
    );
  }

  // Placeholder helper methods - would be implemented with actual data
  private async calculateTimeSpent(studentId: string, contentId: string): Promise<number> {
    const interactions = await db.studentInteraction.findMany({
      where: { studentId, sectionId: contentId },
      orderBy: { timestamp: 'asc' }
    });
    
    // Simple time calculation - would be more sophisticated in real implementation
    if (interactions.length < 2) return 0;
    
    const start = new Date(interactions[0].timestamp);
    const end = new Date(interactions[interactions.length - 1].timestamp);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  }

  private async calculateEngagementScore(studentId: string, contentId: string): Promise<number> {
    // Placeholder - would calculate based on various engagement metrics
    return 75;
  }

  private async estimateTimeToComplete(studentId: string, contentId: string): Promise<number> {
    // Placeholder - would estimate based on content metadata and student pace
    return 30;
  }

  private async getContentDifficulty(contentId: string): Promise<any> {
    // Placeholder
    return 'intermediate';
  }

  private async findAlternativeContent(contentId: string): Promise<string[]> {
    // Placeholder
    return [];
  }

  private async findEasierAlternatives(contentId: string): Promise<string[]> {
    // Placeholder
    return [];
  }

  private async findPrerequisitePath(studentId: string, contentId: string): Promise<string[]> {
    // Placeholder
    return [];
  }

  private inferDifficulty(section: any): any {
    if (section.position <= 3) return 'beginner';
    if (section.position <= 6) return 'intermediate';
    return 'advanced';
  }

  private extractConcepts(section: any): string[] {
    return [section.title];
  }

  private extractSkills(section: any): string[] {
    return [];
  }

  private async calculateSuccessRate(contentId: string): Promise<number> {
    return 0.8;
  }

  private async calculateAverageAttempts(contentId: string): Promise<number> {
    return 1.5;
  }

  private async calculateDropoutRate(contentId: string): Promise<number> {
    return 0.1;
  }

  private async getStudentProgress(studentId: string, courseId: string): Promise<any> {
    const completedSections = await db.studentInteraction.findMany({
      where: {
        studentId,
        courseId,
        eventName: 'section_complete'
      },
      distinct: ['sectionId']
    });

    return {
      completedContent: completedSections.map(s => s.sectionId).filter(Boolean)
    };
  }

  private async estimateCompletionProbability(
    studentId: string,
    steps: LearningPathStep[]
  ): Promise<number> {
    // Placeholder - would use ML model to predict completion probability
    return 0.85;
  }

  private async generateAlternativePaths(
    graph: PrerequisiteGraph,
    targetContentId: string,
    studentStatus: any
  ): Promise<any[]> {
    // Placeholder
    return [];
  }

  private async saveGraphToCache(courseId: string, graph: PrerequisiteGraph): Promise<void> {
    try {
      const data = {
        nodes: Array.from(graph.nodes.entries()),
        edges: Array.from(graph.edges.entries()),
        metadata: graph.metadata
      };
      
      await redis.setex(
        `prerequisite_graph:${courseId}`,
        3600, // 1 hour TTL
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save graph to cache:', error);
    }
  }
}