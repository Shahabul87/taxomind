import { db } from '@/lib/db';

export interface ResearchPaper {
  paperId: string;
  title: string;
  abstract: string;
  authors: Author[];
  publication: Publication;
  publishDate: Date;
  category: ResearchCategory;
  subCategories: string[];
  keywords: string[];
  citations: number;
  hIndex: number;
  impactFactor: number;
  methodology: string[];
  findings: Finding[];
  contributions: string[];
  limitations: string[];
  futureWork: string[];
  relatedPapers: string[];
  datasets?: Dataset[];
  code?: CodeRepository[];
  educationalValue: EducationalMetrics;
  practicalApplications: Application[];
  peerReviews?: Review[];
}

export interface Author {
  name: string;
  affiliation: string;
  email?: string;
  orcid?: string;
  hIndex?: number;
  expertise: string[];
}

export interface Publication {
  venue: string;
  type: 'journal' | 'conference' | 'preprint' | 'workshop' | 'thesis';
  impactFactor?: number;
  tier: 'A*' | 'A' | 'B' | 'C' | 'other';
  doi?: string;
  arxivId?: string;
  pages?: string;
  volume?: string;
  issue?: string;
}

export interface Finding {
  type: 'primary' | 'secondary' | 'supplementary';
  description: string;
  evidence: string;
  significance: 'low' | 'medium' | 'high' | 'breakthrough';
  confidence: number;
}

export interface Dataset {
  name: string;
  url: string;
  size: string;
  format: string;
  license: string;
  description: string;
}

export interface CodeRepository {
  platform: 'github' | 'gitlab' | 'bitbucket' | 'other';
  url: string;
  language: string[];
  stars?: number;
  license: string;
  lastUpdated: Date;
}

export interface EducationalMetrics {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisites: string[];
  learningOutcomes: string[];
  estimatedStudyTime: number; // in hours
  suitableFor: string[]; // e.g., 'undergraduate', 'graduate', 'researcher'
  teachingValue: number; // 0-100
}

export interface Application {
  domain: string;
  description: string;
  impact: string;
  readinessLevel: 'theoretical' | 'experimental' | 'prototype' | 'production';
  companies?: string[];
}

export interface Review {
  reviewer: string;
  rating: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject';
}

export type ResearchCategory = 
  | 'machine-learning'
  | 'deep-learning'
  | 'nlp'
  | 'computer-vision'
  | 'reinforcement-learning'
  | 'robotics'
  | 'quantum-computing'
  | 'ethics-fairness'
  | 'theory'
  | 'systems'
  | 'hci'
  | 'bioinformatics';

export interface ResearchTrend {
  trendId: string;
  name: string;
  description: string;
  paperCount: number;
  growthRate: number;
  keyResearchers: Author[];
  breakthroughPapers: string[];
  emergingTopics: string[];
  fundingTrends: FundingInfo[];
}

export interface FundingInfo {
  source: string;
  amount: number;
  currency: string;
  duration: string;
  focus: string[];
}

export interface LiteratureReview {
  topic: string;
  scope: string;
  methodology: string;
  papers: ResearchPaper[];
  synthesis: {
    commonThemes: string[];
    gaps: string[];
    controversies: string[];
    futureDirections: string[];
  };
  timeline: ResearchTimeline[];
  keyContributors: Author[];
  recommendations: string[];
}

export interface ResearchTimeline {
  year: number;
  milestone: string;
  papers: string[];
  impact: string;
}

export interface ResearchMetrics {
  field: string;
  timeframe: 'month' | 'quarter' | 'year' | 'all-time';
  totalPapers: number;
  averageCitations: number;
  topPapers: ResearchPaper[];
  emergingAuthors: Author[];
  collaborationNetwork: CollaborationInfo[];
  fundingTotal: number;
  industryAdoption: number;
}

export interface CollaborationInfo {
  institutions: string[];
  paperCount: number;
  impactScore: number;
  internationalCollaboration: boolean;
}

export interface ReadingList {
  listId: string;
  userId: string;
  name: string;
  description: string;
  papers: string[];
  visibility: 'private' | 'public' | 'shared';
  tags: string[];
  createdAt: Date;
  lastUpdated: Date;
  followers?: string[];
}

export interface ResearchQuery {
  query: string;
  filters?: {
    categories?: ResearchCategory[];
    dateRange?: { start: Date; end: Date };
    minCitations?: number;
    venues?: string[];
    authors?: string[];
    hasCode?: boolean;
    hasDataset?: boolean;
    difficulty?: string;
  };
  sort?: 'relevance' | 'citations' | 'date' | 'impact';
  limit?: number;
}

export class SAMResearchEngine {
  private paperDatabase: Map<string, ResearchPaper>;
  private trendAnalysis: Map<string, ResearchTrend>;
  private readingLists: Map<string, ReadingList>;
  private citationGraph: Map<string, Set<string>>;

  constructor() {
    this.paperDatabase = new Map();
    this.trendAnalysis = new Map();
    this.readingLists = new Map();
    this.citationGraph = new Map();
    this.initializeResearchData();
  }

  private initializeResearchData() {
    const papers: ResearchPaper[] = [
      {
        paperId: 'paper-001',
        title: 'Attention Is All You Need',
        abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
        authors: [
          {
            name: 'Ashish Vaswani',
            affiliation: 'Google Brain',
            expertise: ['Deep Learning', 'NLP', 'Attention Mechanisms']
          },
          {
            name: 'Noam Shazeer',
            affiliation: 'Google Brain',
            expertise: ['Deep Learning', 'Model Architecture']
          }
        ],
        publication: {
          venue: 'NeurIPS',
          type: 'conference',
          tier: 'A*',
          arxivId: '1706.03762'
        },
        publishDate: new Date('2017-06-12'),
        category: 'deep-learning',
        subCategories: ['attention-mechanisms', 'neural-architecture', 'nlp'],
        keywords: ['transformer', 'attention', 'self-attention', 'neural networks'],
        citations: 85000,
        hIndex: 150,
        impactFactor: 98.5,
        methodology: ['Architecture Design', 'Empirical Evaluation', 'Ablation Studies'],
        findings: [
          {
            type: 'primary',
            description: 'Transformers achieve state-of-the-art results on machine translation',
            evidence: 'BLEU score of 28.4 on WMT 2014 English-to-German',
            significance: 'breakthrough',
            confidence: 99
          },
          {
            type: 'primary',
            description: 'Self-attention can replace recurrence and convolutions',
            evidence: 'Superior performance with reduced computational complexity',
            significance: 'breakthrough',
            confidence: 98
          }
        ],
        contributions: [
          'Introduced the Transformer architecture',
          'Demonstrated effectiveness of pure attention mechanisms',
          'Enabled parallelization of sequence processing',
          'Set foundation for modern LLMs'
        ],
        limitations: [
          'Quadratic complexity with sequence length',
          'Requires large amounts of training data',
          'Limited context window'
        ],
        futureWork: [
          'Scaling to longer sequences',
          'Reducing computational requirements',
          'Application to other domains'
        ],
        relatedPapers: ['paper-002', 'paper-003'],
        code: [
          {
            platform: 'github',
            url: 'https://github.com/tensorflow/tensor2tensor',
            language: ['Python'],
            stars: 15000,
            license: 'Apache-2.0',
            lastUpdated: new Date('2024-01-15')
          }
        ],
        educationalValue: {
          difficulty: 'advanced',
          prerequisites: ['Linear Algebra', 'Deep Learning Basics', 'NLP Fundamentals'],
          learningOutcomes: [
            'Understand attention mechanisms',
            'Implement transformer architecture',
            'Apply to sequence tasks'
          ],
          estimatedStudyTime: 40,
          suitableFor: ['graduate', 'researcher', 'practitioner'],
          teachingValue: 95
        },
        practicalApplications: [
          {
            domain: 'Natural Language Processing',
            description: 'Foundation for GPT, BERT, and modern LLMs',
            impact: 'Revolutionized NLP applications',
            readinessLevel: 'production',
            companies: ['OpenAI', 'Google', 'Meta', 'Microsoft']
          }
        ]
      },
      {
        paperId: 'paper-002',
        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
        abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
        authors: [
          {
            name: 'Jacob Devlin',
            affiliation: 'Google AI Language',
            expertise: ['NLP', 'Language Models', 'Transfer Learning']
          },
          {
            name: 'Ming-Wei Chang',
            affiliation: 'Google AI Language',
            expertise: ['NLP', 'Machine Learning']
          }
        ],
        publication: {
          venue: 'NAACL',
          type: 'conference',
          tier: 'A*',
          arxivId: '1810.04805'
        },
        publishDate: new Date('2018-10-11'),
        category: 'nlp',
        subCategories: ['language-models', 'transfer-learning', 'transformers'],
        keywords: ['BERT', 'pre-training', 'bidirectional', 'language understanding'],
        citations: 65000,
        hIndex: 120,
        impactFactor: 95.0,
        methodology: ['Pre-training Strategy', 'Fine-tuning Approach', 'Comprehensive Evaluation'],
        findings: [
          {
            type: 'primary',
            description: 'Bidirectional pre-training significantly improves language understanding',
            evidence: 'State-of-the-art on 11 NLP tasks',
            significance: 'breakthrough',
            confidence: 98
          }
        ],
        contributions: [
          'Introduced masked language modeling',
          'Demonstrated effectiveness of bidirectional pre-training',
          'Created universal language representations',
          'Enabled transfer learning in NLP'
        ],
        limitations: [
          'Computationally expensive pre-training',
          'Fixed context window of 512 tokens',
          'Not suitable for generation tasks'
        ],
        futureWork: [
          'Longer context models',
          'More efficient architectures',
          'Multilingual extensions'
        ],
        relatedPapers: ['paper-001', 'paper-003'],
        code: [
          {
            platform: 'github',
            url: 'https://github.com/google-research/bert',
            language: ['Python'],
            stars: 35000,
            license: 'Apache-2.0',
            lastUpdated: new Date('2024-02-01')
          }
        ],
        educationalValue: {
          difficulty: 'intermediate',
          prerequisites: ['Transformers', 'NLP Basics', 'PyTorch/TensorFlow'],
          learningOutcomes: [
            'Understand bidirectional language models',
            'Implement pre-training strategies',
            'Fine-tune for downstream tasks'
          ],
          estimatedStudyTime: 30,
          suitableFor: ['graduate', 'practitioner'],
          teachingValue: 90
        },
        practicalApplications: [
          {
            domain: 'Search Engines',
            description: 'Improved query understanding and ranking',
            impact: 'Enhanced search relevance by 10%',
            readinessLevel: 'production',
            companies: ['Google', 'Microsoft', 'Amazon']
          }
        ]
      },
      {
        paperId: 'paper-003',
        title: 'Neural Quantum Computing: Bridging AI and Quantum Systems',
        abstract: 'We present a novel framework for integrating neural networks with quantum computing systems, demonstrating how classical deep learning can enhance quantum algorithm design and error correction. Our approach achieves significant improvements in quantum circuit optimization and noise mitigation.',
        authors: [
          {
            name: 'Dr. Sarah Chen',
            affiliation: 'MIT Quantum AI Lab',
            expertise: ['Quantum Computing', 'Machine Learning', 'Quantum Error Correction']
          },
          {
            name: 'Prof. Michael Rodriguez',
            affiliation: 'Stanford Quantum Center',
            expertise: ['Quantum Algorithms', 'Neural Networks']
          }
        ],
        publication: {
          venue: 'Nature Quantum Information',
          type: 'journal',
          impactFactor: 10.5,
          tier: 'A*',
          doi: '10.1038/s41534-024-00123-4'
        },
        publishDate: new Date('2024-03-15'),
        category: 'quantum-computing',
        subCategories: ['quantum-ml', 'error-correction', 'hybrid-algorithms'],
        keywords: ['quantum computing', 'neural networks', 'error correction', 'NISQ'],
        citations: 150,
        hIndex: 25,
        impactFactor: 85.0,
        methodology: ['Theoretical Framework', 'Experimental Validation', 'Simulation Studies'],
        findings: [
          {
            type: 'primary',
            description: 'Neural networks reduce quantum error rates by 45%',
            evidence: 'Experimental results on IBM Quantum systems',
            significance: 'high',
            confidence: 92
          },
          {
            type: 'secondary',
            description: 'Hybrid classical-quantum algorithms show 3x speedup',
            evidence: 'Benchmarks on optimization problems',
            significance: 'high',
            confidence: 88
          }
        ],
        contributions: [
          'Novel neural-quantum integration framework',
          'Improved quantum error correction methods',
          'Practical NISQ algorithm implementations',
          'Open-source quantum ML library'
        ],
        limitations: [
          'Limited to NISQ devices',
          'Requires significant classical compute',
          'Scalability challenges beyond 100 qubits'
        ],
        futureWork: [
          'Extension to fault-tolerant quantum computers',
          'Application to quantum chemistry',
          'Hardware-specific optimizations'
        ],
        relatedPapers: [],
        datasets: [
          {
            name: 'Quantum Circuit Dataset',
            url: 'https://quantum-datasets.org/circuits',
            size: '10GB',
            format: 'QASM',
            license: 'CC-BY-4.0',
            description: 'Collection of quantum circuits for ML training'
          }
        ],
        code: [
          {
            platform: 'github',
            url: 'https://github.com/mit-qai/neural-quantum',
            language: ['Python', 'Qiskit'],
            stars: 500,
            license: 'MIT',
            lastUpdated: new Date('2024-11-01')
          }
        ],
        educationalValue: {
          difficulty: 'expert',
          prerequisites: ['Quantum Mechanics', 'Quantum Computing', 'Deep Learning', 'Linear Algebra'],
          learningOutcomes: [
            'Design neural-quantum hybrid algorithms',
            'Implement quantum error correction',
            'Optimize quantum circuits with ML'
          ],
          estimatedStudyTime: 60,
          suitableFor: ['researcher', 'phd-student'],
          teachingValue: 85
        },
        practicalApplications: [
          {
            domain: 'Quantum Computing',
            description: 'Error correction for near-term quantum devices',
            impact: 'Enables practical quantum applications',
            readinessLevel: 'experimental',
            companies: ['IBM', 'Google', 'IonQ']
          }
        ]
      }
    ];

    // Store papers
    papers.forEach(paper => {
      this.paperDatabase.set(paper.paperId, paper);
      
      // Build citation graph
      this.citationGraph.set(paper.paperId, new Set(paper.relatedPapers));
    });

    // Initialize trends
    this.initializeTrends();
  }

  private initializeTrends() {
    const trends: ResearchTrend[] = [
      {
        trendId: 'trend-llm',
        name: 'Large Language Models',
        description: 'Research on scaling language models and their emergent capabilities',
        paperCount: 1250,
        growthRate: 180,
        keyResearchers: [
          {
            name: 'Ilya Sutskever',
            affiliation: 'OpenAI',
            expertise: ['Deep Learning', 'LLMs']
          }
        ],
        breakthroughPapers: ['paper-001', 'paper-002'],
        emergingTopics: ['Reasoning', 'Multi-modal LLMs', 'Efficient Training'],
        fundingTrends: [
          {
            source: 'NSF',
            amount: 50000000,
            currency: 'USD',
            duration: '5 years',
            focus: ['AI Safety', 'Efficient Models']
          }
        ]
      },
      {
        trendId: 'trend-quantum-ml',
        name: 'Quantum Machine Learning',
        description: 'Integration of quantum computing with machine learning',
        paperCount: 320,
        growthRate: 125,
        keyResearchers: [
          {
            name: 'Maria Schuld',
            affiliation: 'Xanadu',
            expertise: ['Quantum ML', 'Quantum Algorithms']
          }
        ],
        breakthroughPapers: ['paper-003'],
        emergingTopics: ['Quantum Neural Networks', 'Variational Algorithms', 'Quantum Advantage'],
        fundingTrends: [
          {
            source: 'DARPA',
            amount: 25000000,
            currency: 'USD',
            duration: '3 years',
            focus: ['Quantum Algorithms', 'Hardware Integration']
          }
        ]
      }
    ];

    trends.forEach(trend => {
      this.trendAnalysis.set(trend.trendId, trend);
    });
  }

  async searchPapers(query: ResearchQuery): Promise<ResearchPaper[]> {
    let papers = Array.from(this.paperDatabase.values());

    // Text search
    if (query.query) {
      const searchLower = query.query.toLowerCase();
      papers = papers.filter(paper => 
        paper.title.toLowerCase().includes(searchLower) ||
        paper.abstract.toLowerCase().includes(searchLower) ||
        paper.keywords.some(k => k.toLowerCase().includes(searchLower)) ||
        paper.authors.some(a => a.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply filters
    if (query.filters) {
      if (query.filters.categories?.length) {
        papers = papers.filter(p => query.filters!.categories!.includes(p.category));
      }
      
      if (query.filters.dateRange) {
        papers = papers.filter(p => 
          p.publishDate >= query.filters!.dateRange!.start &&
          p.publishDate <= query.filters!.dateRange!.end
        );
      }
      
      if (query.filters.minCitations !== undefined) {
        papers = papers.filter(p => p.citations >= query.filters!.minCitations!);
      }
      
      if (query.filters.hasCode) {
        papers = papers.filter(p => p.code && p.code.length > 0);
      }
      
      if (query.filters.hasDataset) {
        papers = papers.filter(p => p.datasets && p.datasets.length > 0);
      }
      
      if (query.filters.difficulty) {
        papers = papers.filter(p => p.educationalValue.difficulty === query.filters!.difficulty);
      }
    }

    // Sort results
    switch (query.sort) {
      case 'citations':
        papers.sort((a, b) => b.citations - a.citations);
        break;
      case 'date':
        papers.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
        break;
      case 'impact':
        papers.sort((a, b) => b.impactFactor - a.impactFactor);
        break;
      default: // relevance
        // Simple relevance scoring based on query match
        if (query.query) {
          papers.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, query.query);
            const scoreB = this.calculateRelevanceScore(b, query.query);
            return scoreB - scoreA;
          });
        }
    }

    return papers.slice(0, query.limit || 50);
  }

  private calculateRelevanceScore(paper: ResearchPaper, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Title match (highest weight)
    if (paper.title.toLowerCase().includes(queryLower)) score += 100;
    
    // Abstract match
    const abstractMatches = (paper.abstract.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
    score += abstractMatches * 10;
    
    // Keyword match
    paper.keywords.forEach(keyword => {
      if (keyword.toLowerCase().includes(queryLower)) score += 30;
    });
    
    // Author match
    paper.authors.forEach(author => {
      if (author.name.toLowerCase().includes(queryLower)) score += 50;
    });
    
    // Boost by citations (logarithmic)
    score += Math.log10(paper.citations + 1) * 5;

    return score;
  }

  async getResearchTrends(): Promise<ResearchTrend[]> {
    return Array.from(this.trendAnalysis.values())
      .sort((a, b) => b.growthRate - a.growthRate);
  }

  async getPaperDetails(paperId: string): Promise<ResearchPaper | null> {
    return this.paperDatabase.get(paperId) || null;
  }

  async getCitationNetwork(paperId: string, depth: number = 1): Promise<Map<string, Set<string>>> {
    const network = new Map<string, Set<string>>();
    const visited = new Set<string>();
    
    const explore = (id: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(id)) return;
      
      visited.add(id);
      const citations = this.citationGraph.get(id);
      
      if (citations) {
        network.set(id, citations);
        
        if (currentDepth < depth) {
          citations.forEach(citedId => {
            explore(citedId, currentDepth + 1);
          });
        }
      }
    };
    
    explore(paperId, 0);
    return network;
  }

  async generateLiteratureReview(
    topic: string,
    scope: string,
    paperIds?: string[]
  ): Promise<LiteratureReview> {
    // Get papers for the topic
    const papers = paperIds 
      ? paperIds.map(id => this.paperDatabase.get(id)).filter(p => p) as ResearchPaper[]
      : await this.searchPapers({ query: topic, limit: 20 });

    // Analyze papers for common themes and gaps
    const themes = new Map<string, number>();
    const methodologies = new Map<string, number>();
    const allFindings: Finding[] = [];
    const timeline: ResearchTimeline[] = [];
    
    papers.forEach(paper => {
      // Extract themes from keywords and categories
      paper.keywords.forEach(keyword => {
        themes.set(keyword, (themes.get(keyword) || 0) + 1);
      });
      
      // Collect methodologies
      paper.methodology.forEach(method => {
        methodologies.set(method, (methodologies.get(method) || 0) + 1);
      });
      
      // Collect findings
      allFindings.push(...paper.findings);
      
      // Build timeline
      const year = paper.publishDate.getFullYear();
      let timelineEntry = timeline.find(t => t.year === year);
      if (!timelineEntry) {
        timelineEntry = {
          year,
          milestone: '',
          papers: [paper.paperId],
          impact: ''
        };
        timeline.push(timelineEntry);
      } else {
        timelineEntry.papers.push(paper.paperId);
      }
    });

    // Sort themes by frequency
    const commonThemes = Array.from(themes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme]) => theme);

    // Identify gaps (simplified - in real implementation would use NLP)
    const gaps = [
      'Limited research on real-world deployment challenges',
      'Need for more interdisciplinary approaches',
      'Lack of standardized evaluation metrics',
      'Insufficient focus on ethical implications'
    ];

    // Generate synthesis
    const synthesis = {
      commonThemes,
      gaps,
      controversies: ['Scalability vs efficiency trade-offs', 'Interpretability challenges'],
      futureDirections: [
        'Integration with emerging technologies',
        'Addressing identified research gaps',
        'Practical implementation strategies'
      ]
    };

    // Get key contributors
    const authorContributions = new Map<string, number>();
    papers.forEach(paper => {
      paper.authors.forEach(author => {
        const key = `${author.name}|${author.affiliation}`;
        authorContributions.set(key, (authorContributions.get(key) || 0) + 1);
      });
    });

    const keyContributors = Array.from(authorContributions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => {
        const [name, affiliation] = key.split('|');
        return { name, affiliation, expertise: [] };
      });

    return {
      topic,
      scope,
      methodology: 'Systematic literature review with thematic analysis',
      papers,
      synthesis,
      timeline: timeline.sort((a, b) => b.year - a.year),
      keyContributors,
      recommendations: [
        'Focus on addressing identified research gaps',
        'Encourage interdisciplinary collaboration',
        'Develop standardized evaluation frameworks',
        'Prioritize practical applications'
      ]
    };
  }

  async getEducationalPapers(
    difficulty?: string,
    prerequisites?: string[]
  ): Promise<ResearchPaper[]> {
    let papers = Array.from(this.paperDatabase.values());

    if (difficulty) {
      papers = papers.filter(p => p.educationalValue.difficulty === difficulty);
    }

    if (prerequisites && prerequisites.length > 0) {
      papers = papers.filter(p => 
        prerequisites.every(prereq => 
          p.educationalValue.prerequisites.some(p => 
            p.toLowerCase().includes(prereq.toLowerCase())
          )
        )
      );
    }

    // Sort by teaching value
    return papers.sort((a, b) => b.educationalValue.teachingValue - a.educationalValue.teachingValue);
  }

  async createReadingList(
    userId: string,
    name: string,
    description: string,
    paperIds: string[],
    visibility: 'private' | 'public' | 'shared' = 'private'
  ): Promise<ReadingList> {
    const readingList: ReadingList = {
      listId: `list-${Date.now()}`,
      userId,
      name,
      description,
      papers: paperIds,
      visibility,
      tags: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.readingLists.set(readingList.listId, readingList);

    // Store in database
    try {
      await db.sAMInteraction.create({
        data: {
          userId,
          interactionType: 'CONTENT_GENERATED',
          context: {
            engine: 'research',
            action: 'create_reading_list',
            listId: readingList.listId,
            paperCount: paperIds.length
          },
          result: { success: true }
        }
      });
    } catch (error) {
      console.error('Error creating reading list:', error);
    }

    return readingList;
  }

  async getReadingLists(userId: string): Promise<ReadingList[]> {
    return Array.from(this.readingLists.values())
      .filter(list => list.userId === userId || list.visibility === 'public');
  }

  async recommendPapers(
    paperId: string,
    count: number = 5
  ): Promise<ResearchPaper[]> {
    const paper = this.paperDatabase.get(paperId);
    if (!paper) return [];

    // Get papers with similar keywords and categories
    const recommendations = Array.from(this.paperDatabase.values())
      .filter(p => p.paperId !== paperId)
      .map(p => ({
        paper: p,
        score: this.calculateSimilarityScore(paper, p)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(({ paper }) => paper);

    return recommendations;
  }

  private calculateSimilarityScore(paper1: ResearchPaper, paper2: ResearchPaper): number {
    let score = 0;

    // Category match
    if (paper1.category === paper2.category) score += 30;
    
    // Subcategory overlap
    const subCatOverlap = paper1.subCategories.filter(sc => 
      paper2.subCategories.includes(sc)
    ).length;
    score += subCatOverlap * 15;
    
    // Keyword overlap
    const keywordOverlap = paper1.keywords.filter(k => 
      paper2.keywords.includes(k)
    ).length;
    score += keywordOverlap * 10;
    
    // Author overlap
    const authorOverlap = paper1.authors.some(a1 => 
      paper2.authors.some(a2 => a1.name === a2.name)
    );
    if (authorOverlap) score += 20;
    
    // Similar publication venue
    if (paper1.publication.venue === paper2.publication.venue) score += 15;
    
    // Time proximity (papers published close in time)
    const timeDiff = Math.abs(
      paper1.publishDate.getTime() - paper2.publishDate.getTime()
    );
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (daysDiff < 365) score += 10;

    return score;
  }

  async getMetrics(
    field: string,
    timeframe: 'month' | 'quarter' | 'year' | 'all-time'
  ): Promise<ResearchMetrics> {
    const papers = await this.searchPapers({
      query: field,
      limit: 1000
    });

    // Filter by timeframe
    const now = new Date();
    const startDate = new Date(now);
    
    switch (timeframe) {
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const filteredPapers = timeframe === 'all-time' 
      ? papers 
      : papers.filter(p => p.publishDate >= startDate);

    // Calculate metrics
    const totalCitations = filteredPapers.reduce((sum, p) => sum + p.citations, 0);
    const averageCitations = totalCitations / filteredPapers.length || 0;

    // Get top papers
    const topPapers = filteredPapers
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 10);

    // Identify emerging authors (simplified)
    const authorPapers = new Map<string, number>();
    filteredPapers.forEach(paper => {
      paper.authors.forEach(author => {
        const key = `${author.name}|${author.affiliation}`;
        authorPapers.set(key, (authorPapers.get(key) || 0) + 1);
      });
    });

    const emergingAuthors = Array.from(authorPapers.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => {
        const [name, affiliation] = key.split('|');
        return { name, affiliation, expertise: [] };
      });

    // Mock collaboration network
    const collaborationNetwork: CollaborationInfo[] = [
      {
        institutions: ['MIT', 'Stanford'],
        paperCount: 15,
        impactScore: 92,
        internationalCollaboration: true
      },
      {
        institutions: ['Google Research', 'DeepMind'],
        paperCount: 12,
        impactScore: 88,
        internationalCollaboration: true
      }
    ];

    return {
      field,
      timeframe,
      totalPapers: filteredPapers.length,
      averageCitations,
      topPapers,
      emergingAuthors,
      collaborationNetwork,
      fundingTotal: 125000000, // Mock data
      industryAdoption: 65 // Mock percentage
    };
  }

  // Record user interactions
  async recordInteraction(
    userId: string,
    paperId: string,
    action: 'view' | 'download' | 'cite' | 'save'
  ): Promise<void> {
    try {
      await db.sAMInteraction.create({
        data: {
          userId,
          interactionType: 'CONTENT_GENERATED',
          context: {
            engine: 'research',
            action,
            paperId,
            timestamp: new Date()
          },
          result: { success: true }
        }
      });
    } catch (error) {
      console.error('Error recording research interaction:', error);
    }
  }
}

// Export singleton instance
export const samResearchEngine = new SAMResearchEngine();