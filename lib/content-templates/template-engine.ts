import { z } from 'zod';

// Template Block Schema
export const TemplateBlockSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'heading',
    'image',
    'video',
    'code',
    'quiz',
    'interactive',
    'download',
    'callout',
    'divider',
    'list',
    'table',
    'embed'
  ]),
  content: z.record(z.any()),
  config: z.record(z.any()).optional(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedTime: z.number().optional(),
    category: z.string().optional()
  }).optional()
});

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTime: z.number(),
  thumbnail: z.string().optional(),
  blocks: z.array(TemplateBlockSchema),
  metadata: z.object({
    author: z.string(),
    version: z.string(),
    lastModified: z.date(),
    usage: z.number().default(0),
    rating: z.number().optional(),
    isPublic: z.boolean().default(false),
    language: z.string().default('en')
  }),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  assessments: z.array(z.string()).optional()
});

export type TemplateBlock = z.infer<typeof TemplateBlockSchema>;
export type Template = z.infer<typeof TemplateSchema>;

// Template Engine Class
export class TemplateEngine {
  private templates: Map<string, Template> = new Map();
  private blockLibrary: Map<string, TemplateBlock> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // Template Management
  async createTemplate(template: Omit<Template, 'id' | 'metadata'>): Promise<Template> {
    const newTemplate: Template = {
      ...template,
      id: this.generateId(),
      metadata: {
        author: 'system',
        version: '1.0.0',
        lastModified: new Date(),
        usage: 0,
        isPublic: false,
        language: 'en'
      }
    };

    // Validate template
    const validatedTemplate = TemplateSchema.parse(newTemplate);
    this.templates.set(validatedTemplate.id, validatedTemplate);

    return validatedTemplate;
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error(`Template with id ${id} not found`);
    }

    const updated: Template = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        lastModified: new Date(),
        version: this.incrementVersion(existing.metadata.version)
      }
    };

    const validatedTemplate = TemplateSchema.parse(updated);
    this.templates.set(id, validatedTemplate);

    return validatedTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  async getTemplate(id: string): Promise<Template | null> {
    return this.templates.get(id) || null;
  }

  async listTemplates(filters?: {
    category?: string;
    difficulty?: string;
    tags?: string[];
    author?: string;
    isPublic?: boolean;
  }): Promise<Template[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.difficulty) {
        templates = templates.filter(t => t.difficulty === filters.difficulty);
      }
      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }
      if (filters.author) {
        templates = templates.filter(t => t.metadata.author === filters.author);
      }
      if (filters.isPublic !== undefined) {
        templates = templates.filter(t => t.metadata.isPublic === filters.isPublic);
      }
    }

    return templates.sort((a, b) => b.metadata.usage - a.metadata.usage);
  }

  // Block Management
  async createBlock(block: Omit<TemplateBlock, 'id'>): Promise<TemplateBlock> {
    const newBlock: TemplateBlock = {
      ...block,
      id: this.generateId()
    };

    const validatedBlock = TemplateBlockSchema.parse(newBlock);
    this.blockLibrary.set(validatedBlock.id, validatedBlock);

    return validatedBlock;
  }

  async getBlock(id: string): Promise<TemplateBlock | null> {
    return this.blockLibrary.get(id) || null;
  }

  async listBlocks(type?: string): Promise<TemplateBlock[]> {
    let blocks = Array.from(this.blockLibrary.values());
    
    if (type) {
      blocks = blocks.filter(b => b.type === type);
    }

    return blocks;
  }

  // Template Instantiation
  async instantiateTemplate(templateId: string, context?: Record<string, any>): Promise<{
    id: string;
    blocks: TemplateBlock[];
    metadata: any;
  }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Update usage counter
    await this.updateTemplate(templateId, {
      metadata: {
        ...template.metadata,
        usage: template.metadata.usage + 1
      }
    });

    // Process blocks with context
    const processedBlocks = await Promise.all(
      template.blocks.map(block => this.processBlock(block, context))
    );

    return {
      id: this.generateId(),
      blocks: processedBlocks,
      metadata: {
        templateId,
        instantiatedAt: new Date(),
        context: context || {}
      }
    };
  }

  // Template Composition
  async combineTemplates(templateIds: string[], options?: {
    mergeStrategy?: 'append' | 'interleave';
    addTransitions?: boolean;
  }): Promise<Template> {
    const templates = await Promise.all(
      templateIds.map(id => this.getTemplate(id))
    );

    const validTemplates = templates.filter(t => t !== null) as Template[];
    if (validTemplates.length === 0) {
      throw new Error('No valid templates found');
    }

    const mergeStrategy = options?.mergeStrategy || 'append';
    let combinedBlocks: TemplateBlock[] = [];

    if (mergeStrategy === 'append') {
      combinedBlocks = validTemplates.flatMap(t => t.blocks);
    } else if (mergeStrategy === 'interleave') {
      const maxBlocks = Math.max(...validTemplates.map(t => t.blocks.length));
      for (let i = 0; i < maxBlocks; i++) {
        for (const template of validTemplates) {
          if (template.blocks[i]) {
            combinedBlocks.push(template.blocks[i]);
          }
        }
      }
    }

    // Add transition blocks if requested
    if (options?.addTransitions) {
      const transitionBlocks: TemplateBlock[] = [];
      for (let i = 0; i < combinedBlocks.length - 1; i++) {
        transitionBlocks.push(combinedBlocks[i]);
        if (i < validTemplates.length - 1) {
          transitionBlocks.push(this.createTransitionBlock());
        }
      }
      transitionBlocks.push(combinedBlocks[combinedBlocks.length - 1]);
      combinedBlocks = transitionBlocks;
    }

    return await this.createTemplate({
      name: `Combined: ${validTemplates.map(t => t.name).join(' + ')}`,
      description: `Combined template from: ${validTemplates.map(t => t.name).join(', ')}`,
      category: validTemplates[0].category,
      tags: [...new Set(validTemplates.flatMap(t => t.tags))],
      difficulty: this.calculateCombinedDifficulty(validTemplates),
      estimatedTime: validTemplates.reduce((sum, t) => sum + t.estimatedTime, 0),
      blocks: combinedBlocks,
      prerequisites: [...new Set(validTemplates.flatMap(t => t.prerequisites || []))],
      learningObjectives: [...new Set(validTemplates.flatMap(t => t.learningObjectives || []))]
    });
  }

  // Template Analytics
  async getTemplateAnalytics(templateId: string): Promise<{
    usage: number;
    averageRating: number;
    completionRate: number;
    popularBlocks: { blockId: string; usage: number }[];
    feedback: any[];
  }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Mock analytics - replace with actual database queries
    return {
      usage: template.metadata.usage,
      averageRating: template.metadata.rating || 0,
      completionRate: 0.85,
      popularBlocks: template.blocks.map(block => ({
        blockId: block.id,
        usage: Math.floor(Math.random() * 100)
      })),
      feedback: []
    };
  }

  // Private Helper Methods
  private async processBlock(block: TemplateBlock, context?: Record<string, any>): Promise<TemplateBlock> {
    if (!context) return { ...block };

    // Process template variables in content
    const processedContent = this.processTemplateVariables(block.content, context);

    return {
      ...block,
      content: processedContent
    };
  }

  private processTemplateVariables(content: any, context: Record<string, any>): any {
    if (typeof content === 'string') {
      return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] || match;
      });
    }

    if (Array.isArray(content)) {
      return content.map(item => this.processTemplateVariables(item, context));
    }

    if (typeof content === 'object' && content !== null) {
      const processed: any = {};
      for (const [key, value] of Object.entries(content)) {
        processed[key] = this.processTemplateVariables(value, context);
      }
      return processed;
    }

    return content;
  }

  private createTransitionBlock(): TemplateBlock {
    return {
      id: this.generateId(),
      type: 'divider',
      content: {
        style: 'gradient',
        message: 'Continue to next section...'
      },
      metadata: {
        title: 'Section Transition',
        category: 'navigation'
      }
    };
  }

  private calculateCombinedDifficulty(templates: Template[]): 'beginner' | 'intermediate' | 'advanced' {
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const average = templates.reduce((sum, t) => sum + difficultyMap[t.difficulty], 0) / templates.length;
    
    if (average <= 1.5) return 'beginner';
    if (average <= 2.5) return 'intermediate';
    return 'advanced';
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private generateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultTemplates(): void {
    // Initialize with default templates and blocks
    this.createDefaultBlocks();
    this.createDefaultTemplates();
  }

  private createDefaultBlocks(): void {
    const defaultBlocks: Omit<TemplateBlock, 'id'>[] = [
      {
        type: 'heading',
        content: { text: '{{title}}', level: 1 },
        metadata: { title: 'Main Heading', category: 'text' }
      },
      {
        type: 'text',
        content: { text: '{{description}}' },
        metadata: { title: 'Description Text', category: 'text' }
      },
      {
        type: 'video',
        content: { url: '{{videoUrl}}', autoplay: false, controls: true },
        metadata: { title: 'Video Content', category: 'media' }
      },
      {
        type: 'quiz',
        content: { 
          questions: [],
          settings: { randomize: false, timeLimit: null }
        },
        metadata: { title: 'Quiz Block', category: 'assessment' }
      },
      {
        type: 'code',
        content: { 
          language: 'javascript',
          code: '// Your code here',
          runnable: true
        },
        metadata: { title: 'Code Block', category: 'interactive' }
      }
    ];

    defaultBlocks.forEach(block => {
      this.createBlock(block);
    });
  }

  private createDefaultTemplates(): void {
    // Default templates will be created here
    // This is just a placeholder for the actual implementation
  }
}

// Singleton instance
export const templateEngine = new TemplateEngine();