// Knowledge Graph Builder

import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { 
  KnowledgeGraph, 
  KnowledgeNode, 
  KnowledgeEdge, 
  NodeType, 
  EdgeType,
  NodeMetadata,
  EdgeMetadata,
  DifficultyLevel,
  BloomsLevel,
  CognitiveLoad
} from './types';

export class KnowledgeGraphBuilder {
  private graph: KnowledgeGraph;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        nodeCount: 0,
        edgeCount: 0,
        density: 0,
        averageClusteringCoefficient: 0,
        longestPath: 0,
        domains: []
      }
    };
  }

  // Build knowledge graph from course structure
  async buildFromCourseStructure(courseId: string): Promise<KnowledgeGraph> {
    console.log(`Building knowledge graph for course: ${courseId}`);

    // Get course data
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: {
              include: {
                videos: true,
                attachments: true,
                quiz: {
                  include: {
                    questions: true
                  }
                }
              }
            }
          }
        },
        assignments: true
      }
    });

    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    // Create course node
    const courseNode = this.createCourseNode(course);
    this.addNode(courseNode);

    // Process chapters
    for (const chapter of course.chapters) {
      const chapterNode = this.createChapterNode(chapter, course);
      this.addNode(chapterNode);
      
      // Link chapter to course
      this.addEdge(this.createEdge(chapterNode.id, courseNode.id, 'part_of', 1.0, 'curriculum_design'));

      // Process sections
      for (const section of chapter.sections) {
        const sectionNode = this.createSectionNode(section, chapter);
        this.addNode(sectionNode);
        
        // Link section to chapter
        this.addEdge(this.createEdge(sectionNode.id, chapterNode.id, 'part_of', 1.0, 'curriculum_design'));

        // Create sequence relationships between sections
        const sectionIndex = chapter.sections.indexOf(section);
        if (sectionIndex > 0) {
          const previousSection = chapter.sections[sectionIndex - 1];
          this.addEdge(this.createEdge(
            sectionNode.id, 
            this.generateNodeId('section', previousSection.id), 
            'sequence', 
            0.9,
            'curriculum_design'
          ));
        }

        // Process videos
        for (const video of section.videos) {
          const videoNode = this.createVideoNode(video, section);
          this.addNode(videoNode);
          
          // Link video to section
          this.addEdge(this.createEdge(videoNode.id, sectionNode.id, 'part_of', 1.0, 'curriculum_design'));
        }

        // Process quiz
        if (section.quiz) {
          const quizNode = this.createQuizNode(section.quiz, section);
          this.addNode(quizNode);
          
          // Link quiz to section
          this.addEdge(this.createEdge(quizNode.id, sectionNode.id, 'part_of', 1.0, 'curriculum_design'));
          
          // Quiz depends on section content
          this.addEdge(this.createEdge(quizNode.id, sectionNode.id, 'depends_on', 0.8, 'curriculum_design'));
        }
      }
    }

    // Process assignments
    for (const assignment of course.assignments) {
      const assignmentNode = this.createAssignmentNode(assignment, course);
      this.addNode(assignmentNode);
      
      // Link assignment to course
      this.addEdge(this.createEdge(assignmentNode.id, courseNode.id, 'part_of', 1.0, 'curriculum_design'));
    }

    // Analyze content and create conceptual relationships
    await this.analyzeContentRelationships(courseId);

    // Update graph metadata
    this.updateGraphMetadata();

    // Cache the graph
    await this.cacheGraph(courseId);

    console.log(`Knowledge graph built: ${this.graph.nodes.size} nodes, ${this.graph.edges.size} edges`);
    
    return this.graph;
  }

  // Create course node
  private createCourseNode(course: any): KnowledgeNode {
    return {
      id: this.generateNodeId('course', course.id),
      type: 'course',
      title: course.title,
      description: course.description,
      metadata: {
        difficulty: this.inferDifficulty(course.level || 'intermediate'),
        estimatedTime: this.estimateCourseTime(course),
        bloomsLevel: 'apply',
        cognitiveLoad: 'medium',
        prerequisites: [],
        tags: course.categoryId ? [course.categoryId] : [],
        keywords: this.extractKeywords(course.title + ' ' + (course.description || '')),
        learningObjectives: this.extractLearningObjectives(course.description)
      },
      attributes: {
        level: course.level,
        categoryId: course.categoryId,
        price: course.price,
        isPublished: course.isPublished,
        enrollmentCount: 0 // Would be calculated from enrollments
      },
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
  }

  // Create chapter node
  private createChapterNode(chapter: any, course: any): KnowledgeNode {
    return {
      id: this.generateNodeId('topic', chapter.id),
      type: 'topic',
      title: chapter.title,
      description: chapter.description,
      metadata: {
        difficulty: this.inferDifficulty(course.level || 'intermediate'),
        estimatedTime: this.estimateChapterTime(chapter),
        bloomsLevel: 'understand',
        cognitiveLoad: 'medium',
        prerequisites: [],
        tags: [course.categoryId || 'general'].filter(Boolean),
        keywords: this.extractKeywords(chapter.title + ' ' + (chapter.description || '')),
        learningObjectives: this.extractLearningObjectives(chapter.description)
      },
      attributes: {
        position: chapter.position,
        sectionCount: chapter.sections?.length || 0,
        courseId: course.id
      },
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt
    };
  }

  // Create section node
  private createSectionNode(section: any, chapter: any): KnowledgeNode {
    return {
      id: this.generateNodeId('lesson', section.id),
      type: 'lesson',
      title: section.title,
      description: section.description,
      metadata: {
        difficulty: this.inferSectionDifficulty(section),
        estimatedTime: this.estimateSectionTime(section),
        bloomsLevel: this.inferBloomsLevel(section),
        cognitiveLoad: this.inferCognitiveLoad(section),
        prerequisites: [],
        tags: this.extractSectionTags(section),
        keywords: this.extractKeywords(section.title + ' ' + (section.description || '')),
        learningObjectives: this.extractLearningObjectives(section.description)
      },
      attributes: {
        position: section.position,
        chapterId: chapter.id,
        videoCount: section.videos?.length || 0,
        hasQuiz: !!section.quiz,
        isFree: section.isFree
      },
      createdAt: section.createdAt,
      updatedAt: section.updatedAt
    };
  }

  // Create video node
  private createVideoNode(video: any, section: any): KnowledgeNode {
    return {
      id: this.generateNodeId('video', video.id),
      type: 'video',
      title: video.title,
      description: video.description,
      metadata: {
        difficulty: this.inferVideoDifficulty(video),
        estimatedTime: this.parseVideoDuration(video.duration) / 60, // Convert to minutes
        bloomsLevel: 'remember',
        cognitiveLoad: 'low',
        prerequisites: [],
        tags: this.extractVideoTags(video),
        keywords: this.extractKeywords(video.title + ' ' + (video.description || '')),
        learningObjectives: []
      },
      attributes: {
        duration: video.duration,
        playbackUrl: video.playbackUrl,
        position: video.position,
        sectionId: section.id
      },
      createdAt: video.createdAt,
      updatedAt: video.updatedAt
    };
  }

  // Create quiz node
  private createQuizNode(quiz: any, section: any): KnowledgeNode {
    return {
      id: this.generateNodeId('quiz', quiz.id),
      type: 'quiz',
      title: `${section.title} - Quiz`,
      description: 'Assessment for ' + section.title,
      metadata: {
        difficulty: this.inferQuizDifficulty(quiz),
        estimatedTime: this.estimateQuizTime(quiz),
        bloomsLevel: 'apply',
        cognitiveLoad: 'medium',
        prerequisites: [this.generateNodeId('lesson', section.id)],
        tags: ['assessment'],
        keywords: this.extractKeywords(section.title),
        learningObjectives: ['Assess understanding of ' + section.title]
      },
      attributes: {
        questionCount: quiz.questions?.length || 0,
        sectionId: section.id,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore
      },
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt
    };
  }

  // Create assignment node
  private createAssignmentNode(assignment: any, course: any): KnowledgeNode {
    return {
      id: this.generateNodeId('assignment', assignment.id),
      type: 'assignment',
      title: assignment.title,
      description: assignment.description,
      metadata: {
        difficulty: this.inferAssignmentDifficulty(assignment),
        estimatedTime: this.estimateAssignmentTime(assignment),
        bloomsLevel: 'create',
        cognitiveLoad: 'high',
        prerequisites: [],
        tags: ['assignment', 'project'],
        keywords: this.extractKeywords(assignment.title + ' ' + (assignment.description || '')),
        learningObjectives: this.extractLearningObjectives(assignment.description)
      },
      attributes: {
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        courseId: course.id,
        submissionType: assignment.submissionType
      },
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt
    };
  }

  // Analyze content and create conceptual relationships
  private async analyzeContentRelationships(courseId: string): Promise<void> {
    const nodes = Array.from(this.graph.nodes.values());
    
    // Create prerequisite relationships based on content analysis
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Analyze semantic similarity
        const similarity = this.calculateSemanticSimilarity(node1, node2);
        
        if (similarity > 0.7) {
          this.addEdge(this.createEdge(
            node1.id, 
            node2.id, 
            'related_to', 
            similarity,
            'content_analysis'
          ));
        }
        
        // Detect prerequisite relationships
        const prerequisiteStrength = this.detectPrerequisiteRelationship(node1, node2);
        
        if (prerequisiteStrength > 0.6) {
          this.addEdge(this.createEdge(
            node2.id, 
            node1.id, 
            'prerequisite', 
            prerequisiteStrength,
            'content_analysis'
          ));
        }
      }
    }

    // Analyze student behavior to infer relationships
    await this.analyzeStudentBehaviorPatterns(courseId);
  }

  // Analyze student behavior patterns to infer relationships
  private async analyzeStudentBehaviorPatterns(courseId: string): Promise<void> {
    const interactions = await db.studentInteraction.findMany({
      where: { courseId },
      select: {
        studentId: true,
        sectionId: true,
        eventName: true,
        timestamp: true,
        metadata: true
      }
    });

    // Group interactions by student
    const studentInteractions = new Map<string, any[]>();
    interactions.forEach(interaction => {
      if (!studentInteractions.has(interaction.studentId)) {
        studentInteractions.set(interaction.studentId, []);
      }
      studentInteractions.get(interaction.studentId)!.push(interaction);
    });

    // Analyze sequential patterns
    studentInteractions.forEach((interactions, studentId) => {
      this.analyzeSequentialPatterns(interactions);
    });

    // Analyze struggle patterns
    await this.analyzeStrugglePatterns(courseId);
  }

  // Analyze sequential learning patterns
  private analyzeSequentialPatterns(interactions: any[]): void {
    // Sort interactions by timestamp
    interactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Find sequences where students consistently move from one section to another
    for (let i = 0; i < interactions.length - 1; i++) {
      const current = interactions[i];
      const next = interactions[i + 1];

      if (current.sectionId && next.sectionId && current.sectionId !== next.sectionId) {
        const currentNodeId = this.generateNodeId('lesson', current.sectionId);
        const nextNodeId = this.generateNodeId('lesson', next.sectionId);

        // Check if this edge already exists
        const existingEdge = this.findEdge(currentNodeId, nextNodeId, 'leads_to');
        
        if (existingEdge) {
          // Strengthen existing relationship
          existingEdge.weight = Math.min(1.0, existingEdge.weight + 0.1);
          existingEdge.metadata.confidence = Math.min(1.0, existingEdge.metadata.confidence + 0.05);
        } else {
          // Create new behavioral relationship
          this.addEdge(this.createEdge(
            currentNodeId,
            nextNodeId,
            'leads_to',
            0.3,
            'behavior_analysis'
          ));
        }
      }
    }
  }

  // Analyze struggle patterns to identify difficulty relationships
  private async analyzeStrugglePatterns(courseId: string): Promise<void> {
    const contentFlags = await db.contentFlag.findMany({
      where: {
        flagType: 'struggle_point',
        contentType: 'section'
      }
    });

    contentFlags.forEach(flag => {
      const nodeId = this.generateNodeId('lesson', flag.contentId);
      const node = this.graph.nodes.get(nodeId);
      
      if (node && flag.count >= 5) {
        // Increase difficulty based on struggle count
        const difficultyMultiplier = Math.min(2.0, 1 + (flag.count / 20));
        node.metadata.difficulty = this.adjustDifficulty(node.metadata.difficulty, difficultyMultiplier);
        node.metadata.cognitiveLoad = flag.count >= 10 ? 'high' : 'medium';
      }
    });
  }

  // Helper methods
  private generateNodeId(type: string, id: string): string {
    return `${type}_${id}`;
  }

  private createEdge(
    sourceId: string, 
    targetId: string, 
    type: EdgeType, 
    weight: number,
    source: string
  ): KnowledgeEdge {
    return {
      id: `${sourceId}_${type}_${targetId}`,
      sourceId,
      targetId,
      type,
      weight,
      metadata: {
        strength: weight,
        confidence: 0.8,
        source: source as any,
        verified: source === 'manual',
        learningPathRelevance: weight,
        conceptualDistance: 1 - weight
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private addNode(node: KnowledgeNode): void {
    this.graph.nodes.set(node.id, node);
  }

  private addEdge(edge: KnowledgeEdge): void {
    this.graph.edges.set(edge.id, edge);
  }

  private findEdge(sourceId: string, targetId: string, type: EdgeType): KnowledgeEdge | undefined {
    const edgeId = `${sourceId}_${type}_${targetId}`;
    return this.graph.edges.get(edgeId);
  }

  // Content analysis helpers
  private calculateSemanticSimilarity(node1: KnowledgeNode, node2: KnowledgeNode): number {
    // Simple keyword-based similarity
    const keywords1 = new Set(node1.metadata.keywords);
    const keywords2 = new Set(node2.metadata.keywords);
    
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private detectPrerequisiteRelationship(node1: KnowledgeNode, node2: KnowledgeNode): number {
    // Detect if node2 might be a prerequisite for node1
    const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const bloomsOrder = { 'remember': 1, 'understand': 2, 'apply': 3, 'analyze': 4, 'evaluate': 5, 'create': 6 };
    
    const difficultyDiff = difficultyOrder[node1.metadata.difficulty] - difficultyOrder[node2.metadata.difficulty];
    const bloomsDiff = bloomsOrder[node1.metadata.bloomsLevel] - bloomsOrder[node2.metadata.bloomsLevel];
    
    // If node1 is more complex than node2, node2 might be a prerequisite
    if (difficultyDiff > 0 || bloomsDiff > 0) {
      const semanticSimilarity = this.calculateSemanticSimilarity(node1, node2);
      return Math.min(0.8, semanticSimilarity * 0.7 + (difficultyDiff + bloomsDiff) * 0.1);
    }
    
    return 0;
  }

  // Utility methods for inference
  private inferDifficulty(level: string): DifficultyLevel {
    const mapping: Record<string, DifficultyLevel> = {
      'Beginner': 'beginner',
      'Intermediate': 'intermediate',
      'Advanced': 'advanced',
      'Expert': 'expert'
    };
    return mapping[level] || 'intermediate';
  }

  private inferSectionDifficulty(section: any): DifficultyLevel {
    // Infer difficulty based on section content
    const videoCount = section.videos?.length || 0;
    const hasQuiz = !!section.quiz;
    
    if (videoCount > 5 || hasQuiz) return 'intermediate';
    if (videoCount > 2) return 'beginner';
    return 'beginner';
  }

  private inferBloomsLevel(section: any): BloomsLevel {
    const hasQuiz = !!section.quiz;
    const videoCount = section.videos?.length || 0;
    
    if (hasQuiz) return 'apply';
    if (videoCount > 3) return 'understand';
    return 'remember';
  }

  private inferCognitiveLoad(section: any): CognitiveLoad {
    const complexity = (section.videos?.length || 0) + (section.quiz ? 2 : 0);
    
    if (complexity > 5) return 'high';
    if (complexity > 2) return 'medium';
    return 'low';
  }

  private inferVideoDifficulty(video: any): DifficultyLevel {
    const duration = this.parseVideoDuration(video.duration);
    
    if (duration > 30 * 60) return 'advanced'; // > 30 minutes
    if (duration > 15 * 60) return 'intermediate'; // > 15 minutes
    return 'beginner';
  }

  private inferQuizDifficulty(quiz: any): DifficultyLevel {
    const questionCount = quiz.questions?.length || 0;
    
    if (questionCount > 10) return 'advanced';
    if (questionCount > 5) return 'intermediate';
    return 'beginner';
  }

  private inferAssignmentDifficulty(assignment: any): DifficultyLevel {
    // Infer based on estimated time and description complexity
    const estimatedTime = this.estimateAssignmentTime(assignment);
    
    if (estimatedTime > 180) return 'expert'; // > 3 hours
    if (estimatedTime > 120) return 'advanced'; // > 2 hours
    if (estimatedTime > 60) return 'intermediate'; // > 1 hour
    return 'beginner';
  }

  // Time estimation methods
  private estimateCourseTime(course: any): number {
    // Estimate based on content volume
    return 480; // Default 8 hours for a course
  }

  private estimateChapterTime(chapter: any): number {
    const sectionCount = chapter.sections?.length || 0;
    return sectionCount * 30; // 30 minutes per section average
  }

  private estimateSectionTime(section: any): number {
    const videoCount = section.videos?.length || 0;
    const hasQuiz = !!section.quiz;
    
    return videoCount * 10 + (hasQuiz ? 15 : 0); // 10 min per video + 15 min for quiz
  }

  private estimateQuizTime(quiz: any): number {
    const questionCount = quiz.questions?.length || 0;
    return questionCount * 2; // 2 minutes per question
  }

  private estimateAssignmentTime(assignment: any): number {
    // Estimate based on description length and complexity
    const descriptionLength = assignment.description?.length || 0;
    return Math.max(60, descriptionLength / 10); // Minimum 1 hour
  }

  // Content extraction methods
  private extractKeywords(text: string): string[] {
    if (!text) return [];
    
    // Simple keyword extraction (in production, use NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    return [...new Set(words)].slice(0, 10);
  }

  private extractLearningObjectives(description: string): string[] {
    if (!description) return [];
    
    // Extract sentences that look like learning objectives
    const sentences = description.split(/[.!?]+/);
    return sentences
      .filter(sentence => 
        sentence.toLowerCase().includes('learn') ||
        sentence.toLowerCase().includes('understand') ||
        sentence.toLowerCase().includes('master')
      )
      .map(sentence => sentence.trim())
      .slice(0, 3);
  }

  private extractSectionTags(section: any): string[] {
    const tags = [];
    
    if (section.videos?.length > 0) tags.push('video');
    if (section.quiz) tags.push('assessment');
    if (section.isFree) tags.push('free');
    
    return tags;
  }

  private extractVideoTags(video: any): string[] {
    const tags = ['video'];
    
    const duration = this.parseVideoDuration(video.duration);
    if (duration > 20 * 60) tags.push('long-form');
    else if (duration < 5 * 60) tags.push('short-form');
    
    return tags;
  }

  private parseVideoDuration(duration: string): number {
    // Parse duration string like "PT10M30S" to seconds
    if (!duration) return 0;
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  private adjustDifficulty(current: DifficultyLevel, multiplier: number): DifficultyLevel {
    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(current);
    const newIndex = Math.min(levels.length - 1, Math.floor(currentIndex * multiplier));
    return levels[newIndex];
  }

  // Graph metadata updates
  private updateGraphMetadata(): void {
    const nodeCount = this.graph.nodes.size;
    const edgeCount = this.graph.edges.size;
    const possibleEdges = nodeCount * (nodeCount - 1);
    
    this.graph.metadata = {
      version: '1.0',
      lastUpdated: new Date(),
      nodeCount,
      edgeCount,
      density: possibleEdges > 0 ? edgeCount / possibleEdges : 0,
      averageClusteringCoefficient: this.calculateAverageClusteringCoefficient(),
      longestPath: this.calculateLongestPath(),
      domains: this.extractDomains()
    };
  }

  private calculateAverageClusteringCoefficient(): number {
    // Simplified clustering coefficient calculation
    return 0.3; // Placeholder
  }

  private calculateLongestPath(): number {
    // Simplified longest path calculation
    return Math.min(10, this.graph.nodes.size);
  }

  private extractDomains(): string[] {
    const domains = new Set<string>();
    
    this.graph.nodes.forEach(node => {
      if (node.attributes.categoryId) {
        domains.add(node.attributes.categoryId);
      }
    });
    
    return Array.from(domains);
  }

  // Cache the graph
  private async cacheGraph(courseId: string): Promise<void> {
    try {
      const graphData = {
        nodes: Array.from(this.graph.nodes.entries()),
        edges: Array.from(this.graph.edges.entries()),
        metadata: this.graph.metadata
      };
      
      await redis.setex(
        `knowledge_graph:${courseId}`,
        3600, // 1 hour TTL
        JSON.stringify(graphData)
      );
    } catch (error) {
      console.error('Failed to cache knowledge graph:', error);
    }
  }

  // Get the built graph
  getGraph(): KnowledgeGraph {
    return this.graph;
  }
}