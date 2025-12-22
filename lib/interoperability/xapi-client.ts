/**
 * xAPI (Experience API / Tin Can) Client
 *
 * Implements the xAPI specification for learning activity tracking.
 * Enables interoperability with Learning Record Stores (LRS).
 *
 * @see https://xapi.com/overview/
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════
// XAPI TYPES AND INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface xAPIActor {
  objectType?: 'Agent' | 'Group';
  name?: string;
  mbox?: string; // mailto:email@example.com
  mbox_sha1sum?: string;
  openid?: string;
  account?: {
    homePage: string;
    name: string;
  };
  member?: xAPIActor[]; // For Group type
}

export interface xAPIVerb {
  id: string; // IRI
  display: Record<string, string>; // Language map
}

export interface xAPIObject {
  objectType?: 'Activity' | 'Agent' | 'Group' | 'SubStatement' | 'StatementRef';
  id: string; // IRI for Activity
  definition?: xAPIActivityDefinition;
}

export interface xAPIActivityDefinition {
  name?: Record<string, string>;
  description?: Record<string, string>;
  type?: string; // IRI
  moreInfo?: string; // IRL
  interactionType?: 'true-false' | 'choice' | 'fill-in' | 'long-fill-in' | 'matching' | 'performance' | 'sequencing' | 'likert' | 'numeric' | 'other';
  correctResponsesPattern?: string[];
  choices?: xAPIInteractionComponent[];
  scale?: xAPIInteractionComponent[];
  source?: xAPIInteractionComponent[];
  target?: xAPIInteractionComponent[];
  steps?: xAPIInteractionComponent[];
  extensions?: Record<string, unknown>;
}

export interface xAPIInteractionComponent {
  id: string;
  description?: Record<string, string>;
}

export interface xAPIResult {
  score?: {
    scaled?: number; // -1 to 1
    raw?: number;
    min?: number;
    max?: number;
  };
  success?: boolean;
  completion?: boolean;
  response?: string;
  duration?: string; // ISO 8601 duration
  extensions?: Record<string, unknown>;
}

export interface xAPIContext {
  registration?: string; // UUID
  instructor?: xAPIActor;
  team?: xAPIActor;
  contextActivities?: {
    parent?: xAPIObject[];
    grouping?: xAPIObject[];
    category?: xAPIObject[];
    other?: xAPIObject[];
  };
  revision?: string;
  platform?: string;
  language?: string;
  statement?: xAPIStatementRef;
  extensions?: Record<string, unknown>;
}

export interface xAPIStatementRef {
  objectType: 'StatementRef';
  id: string; // UUID
}

export interface xAPIStatement {
  id?: string; // UUID
  actor: xAPIActor;
  verb: xAPIVerb;
  object: xAPIObject;
  result?: xAPIResult;
  context?: xAPIContext;
  timestamp?: string; // ISO 8601
  stored?: string; // ISO 8601
  authority?: xAPIActor;
  version?: string;
  attachments?: xAPIAttachment[];
}

export interface xAPIAttachment {
  usageType: string; // IRI
  display: Record<string, string>;
  description?: Record<string, string>;
  contentType: string; // MIME type
  length: number;
  sha2: string;
  fileUrl?: string; // IRL
}

export interface xAPILRSConfig {
  endpoint: string;
  username?: string;
  password?: string;
  auth?: 'basic' | 'oauth';
  version?: string;
}

export interface xAPIStatementQuery {
  statementId?: string;
  voidedStatementId?: string;
  agent?: xAPIActor;
  verb?: string;
  activity?: string;
  registration?: string;
  related_activities?: boolean;
  related_agents?: boolean;
  since?: string;
  until?: string;
  limit?: number;
  format?: 'ids' | 'exact' | 'canonical';
  attachments?: boolean;
  ascending?: boolean;
}

export interface xAPIStatementResult {
  statements: xAPIStatement[];
  more?: string; // IRL for pagination
}

// ═══════════════════════════════════════════════════════════════
// COMMON XAPI VERBS (ADL Vocabulary)
// ═══════════════════════════════════════════════════════════════

export const XAPI_VERBS = {
  // Core verbs
  ANSWERED: {
    id: 'http://adlnet.gov/expapi/verbs/answered',
    display: { 'en-US': 'answered' }
  },
  ASKED: {
    id: 'http://adlnet.gov/expapi/verbs/asked',
    display: { 'en-US': 'asked' }
  },
  ATTEMPTED: {
    id: 'http://adlnet.gov/expapi/verbs/attempted',
    display: { 'en-US': 'attempted' }
  },
  COMPLETED: {
    id: 'http://adlnet.gov/expapi/verbs/completed',
    display: { 'en-US': 'completed' }
  },
  EXITED: {
    id: 'http://adlnet.gov/expapi/verbs/exited',
    display: { 'en-US': 'exited' }
  },
  EXPERIENCED: {
    id: 'http://adlnet.gov/expapi/verbs/experienced',
    display: { 'en-US': 'experienced' }
  },
  FAILED: {
    id: 'http://adlnet.gov/expapi/verbs/failed',
    display: { 'en-US': 'failed' }
  },
  INITIALIZED: {
    id: 'http://adlnet.gov/expapi/verbs/initialized',
    display: { 'en-US': 'initialized' }
  },
  INTERACTED: {
    id: 'http://adlnet.gov/expapi/verbs/interacted',
    display: { 'en-US': 'interacted' }
  },
  LAUNCHED: {
    id: 'http://adlnet.gov/expapi/verbs/launched',
    display: { 'en-US': 'launched' }
  },
  MASTERED: {
    id: 'http://adlnet.gov/expapi/verbs/mastered',
    display: { 'en-US': 'mastered' }
  },
  PASSED: {
    id: 'http://adlnet.gov/expapi/verbs/passed',
    display: { 'en-US': 'passed' }
  },
  PREFERRED: {
    id: 'http://adlnet.gov/expapi/verbs/preferred',
    display: { 'en-US': 'preferred' }
  },
  PROGRESSED: {
    id: 'http://adlnet.gov/expapi/verbs/progressed',
    display: { 'en-US': 'progressed' }
  },
  REGISTERED: {
    id: 'http://adlnet.gov/expapi/verbs/registered',
    display: { 'en-US': 'registered' }
  },
  RESPONDED: {
    id: 'http://adlnet.gov/expapi/verbs/responded',
    display: { 'en-US': 'responded' }
  },
  RESUMED: {
    id: 'http://adlnet.gov/expapi/verbs/resumed',
    display: { 'en-US': 'resumed' }
  },
  SCORED: {
    id: 'http://adlnet.gov/expapi/verbs/scored',
    display: { 'en-US': 'scored' }
  },
  SHARED: {
    id: 'http://adlnet.gov/expapi/verbs/shared',
    display: { 'en-US': 'shared' }
  },
  SUSPENDED: {
    id: 'http://adlnet.gov/expapi/verbs/suspended',
    display: { 'en-US': 'suspended' }
  },
  TERMINATED: {
    id: 'http://adlnet.gov/expapi/verbs/terminated',
    display: { 'en-US': 'terminated' }
  },
  VOIDED: {
    id: 'http://adlnet.gov/expapi/verbs/voided',
    display: { 'en-US': 'voided' }
  }
} as const;

// ═══════════════════════════════════════════════════════════════
// ACTIVITY TYPES
// ═══════════════════════════════════════════════════════════════

export const XAPI_ACTIVITY_TYPES = {
  ASSESSMENT: 'http://adlnet.gov/expapi/activities/assessment',
  COURSE: 'http://adlnet.gov/expapi/activities/course',
  FILE: 'http://adlnet.gov/expapi/activities/file',
  INTERACTION: 'http://adlnet.gov/expapi/activities/interaction',
  LESSON: 'http://adlnet.gov/expapi/activities/lesson',
  LINK: 'http://adlnet.gov/expapi/activities/link',
  MEDIA: 'http://adlnet.gov/expapi/activities/media',
  MEETING: 'http://adlnet.gov/expapi/activities/meeting',
  MODULE: 'http://adlnet.gov/expapi/activities/module',
  OBJECTIVE: 'http://adlnet.gov/expapi/activities/objective',
  PERFORMANCE: 'http://adlnet.gov/expapi/activities/performance',
  PROFILE: 'http://adlnet.gov/expapi/activities/profile',
  QUESTION: 'http://adlnet.gov/expapi/activities/question',
  SIMULATION: 'http://adlnet.gov/expapi/activities/simulation'
} as const;

// ═══════════════════════════════════════════════════════════════
// XAPI CLIENT CLASS
// ═══════════════════════════════════════════════════════════════

export class xAPIClient {
  private config: xAPILRSConfig;
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: xAPILRSConfig) {
    this.config = {
      version: '1.0.3',
      ...config
    };

    this.baseUrl = config.endpoint.replace(/\/$/, '');
    this.headers = this.buildHeaders();
  }

  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Experience-API-Version': this.config.version || '1.0.3'
    };

    if (this.config.auth === 'basic' && this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    return headers;
  }

  /**
   * Send a single xAPI statement
   */
  async sendStatement(statement: xAPIStatement): Promise<string[]> {
    // Generate UUID if not provided
    if (!statement.id) {
      statement.id = this.generateUUID();
    }

    // Add timestamp if not provided
    if (!statement.timestamp) {
      statement.timestamp = new Date().toISOString();
    }

    const response = await fetch(`${this.baseUrl}/statements`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(statement)
    });

    if (!response.ok) {
      throw new Error(`Failed to send statement: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send multiple xAPI statements
   */
  async sendStatements(statements: xAPIStatement[]): Promise<string[]> {
    // Add IDs and timestamps
    const preparedStatements = statements.map(s => ({
      ...s,
      id: s.id || this.generateUUID(),
      timestamp: s.timestamp || new Date().toISOString()
    }));

    const response = await fetch(`${this.baseUrl}/statements`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(preparedStatements)
    });

    if (!response.ok) {
      throw new Error(`Failed to send statements: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Query statements from LRS
   */
  async getStatements(query: xAPIStatementQuery = {}): Promise<xAPIStatementResult> {
    const params = new URLSearchParams();

    if (query.statementId) params.append('statementId', query.statementId);
    if (query.agent) params.append('agent', JSON.stringify(query.agent));
    if (query.verb) params.append('verb', query.verb);
    if (query.activity) params.append('activity', query.activity);
    if (query.registration) params.append('registration', query.registration);
    if (query.since) params.append('since', query.since);
    if (query.until) params.append('until', query.until);
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.format) params.append('format', query.format);
    if (query.ascending) params.append('ascending', query.ascending.toString());

    const response = await fetch(`${this.baseUrl}/statements?${params.toString()}`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to get statements: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Void a statement
   */
  async voidStatement(statementId: string, actor: xAPIActor): Promise<string[]> {
    const voidingStatement: xAPIStatement = {
      actor,
      verb: XAPI_VERBS.VOIDED,
      object: {
        objectType: 'StatementRef',
        id: statementId
      } as unknown as xAPIObject
    };

    return this.sendStatement(voidingStatement);
  }

  /**
   * Get state document
   */
  async getState(
    activityId: string,
    agent: xAPIActor,
    stateId: string,
    registration?: string
  ): Promise<unknown> {
    const params = new URLSearchParams({
      activityId,
      agent: JSON.stringify(agent),
      stateId
    });

    if (registration) params.append('registration', registration);

    const response = await fetch(`${this.baseUrl}/activities/state?${params.toString()}`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get state: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Set state document
   */
  async setState(
    activityId: string,
    agent: xAPIActor,
    stateId: string,
    state: unknown,
    registration?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      activityId,
      agent: JSON.stringify(agent),
      stateId
    });

    if (registration) params.append('registration', registration);

    const response = await fetch(`${this.baseUrl}/activities/state?${params.toString()}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      throw new Error(`Failed to set state: ${response.statusText}`);
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// TAXOMIND XAPI WRAPPER
// ═══════════════════════════════════════════════════════════════

export class TaxomindxAPIService {
  private client: xAPIClient | null = null;
  private platformId: string;
  private enabled: boolean = false;

  constructor() {
    this.platformId = process.env.NEXT_PUBLIC_XAPI_PLATFORM_ID || 'https://taxomind.com';
    this.initializeClient();
  }

  private initializeClient(): void {
    const endpoint = process.env.XAPI_LRS_ENDPOINT;
    const username = process.env.XAPI_LRS_USERNAME;
    const password = process.env.XAPI_LRS_PASSWORD;

    if (endpoint && username && password) {
      this.client = new xAPIClient({
        endpoint,
        username,
        password,
        auth: 'basic'
      });
      this.enabled = true;
    }
  }

  /**
   * Create actor from user data
   */
  createActor(user: { id: string; email: string; name?: string }): xAPIActor {
    return {
      objectType: 'Agent',
      name: user.name || user.email,
      account: {
        homePage: this.platformId,
        name: user.id
      }
    };
  }

  /**
   * Track exam started
   */
  async trackExamStarted(
    user: { id: string; email: string; name?: string },
    exam: { id: string; title: string; courseId: string },
    attemptId: string
  ): Promise<void> {
    if (!this.enabled || !this.client) return;

    const statement: xAPIStatement = {
      actor: this.createActor(user),
      verb: XAPI_VERBS.INITIALIZED,
      object: {
        objectType: 'Activity',
        id: `${this.platformId}/exams/${exam.id}`,
        definition: {
          name: { 'en-US': exam.title },
          type: XAPI_ACTIVITY_TYPES.ASSESSMENT
        }
      },
      context: {
        registration: attemptId,
        contextActivities: {
          parent: [{
            objectType: 'Activity',
            id: `${this.platformId}/courses/${exam.courseId}`,
            definition: { type: XAPI_ACTIVITY_TYPES.COURSE }
          }]
        },
        platform: 'Taxomind LMS',
        extensions: {
          [`${this.platformId}/extensions/attemptId`]: attemptId
        }
      }
    };

    await this.client.sendStatement(statement);
  }

  /**
   * Track question answered
   */
  async trackQuestionAnswered(
    user: { id: string; email: string; name?: string },
    question: {
      id: string;
      text: string;
      type: string;
      examId: string;
    },
    answer: {
      response: string;
      correct: boolean;
      score: number;
      maxScore: number;
      duration: number; // seconds
    },
    attemptId: string
  ): Promise<void> {
    if (!this.enabled || !this.client) return;

    const statement: xAPIStatement = {
      actor: this.createActor(user),
      verb: XAPI_VERBS.ANSWERED,
      object: {
        objectType: 'Activity',
        id: `${this.platformId}/questions/${question.id}`,
        definition: {
          name: { 'en-US': question.text.substring(0, 100) },
          type: XAPI_ACTIVITY_TYPES.QUESTION,
          interactionType: this.mapQuestionType(question.type)
        }
      },
      result: {
        success: answer.correct,
        score: {
          scaled: answer.maxScore > 0 ? answer.score / answer.maxScore : 0,
          raw: answer.score,
          max: answer.maxScore
        },
        response: answer.response,
        duration: `PT${answer.duration}S`
      },
      context: {
        registration: attemptId,
        contextActivities: {
          parent: [{
            objectType: 'Activity',
            id: `${this.platformId}/exams/${question.examId}`,
            definition: { type: XAPI_ACTIVITY_TYPES.ASSESSMENT }
          }]
        }
      }
    };

    await this.client.sendStatement(statement);
  }

  /**
   * Track exam completed
   */
  async trackExamCompleted(
    user: { id: string; email: string; name?: string },
    exam: { id: string; title: string },
    result: {
      score: number;
      maxScore: number;
      passed: boolean;
      duration: number; // seconds
      bloomsLevel?: string;
    },
    attemptId: string
  ): Promise<void> {
    if (!this.enabled || !this.client) return;

    const statement: xAPIStatement = {
      actor: this.createActor(user),
      verb: result.passed ? XAPI_VERBS.PASSED : XAPI_VERBS.FAILED,
      object: {
        objectType: 'Activity',
        id: `${this.platformId}/exams/${exam.id}`,
        definition: {
          name: { 'en-US': exam.title },
          type: XAPI_ACTIVITY_TYPES.ASSESSMENT
        }
      },
      result: {
        success: result.passed,
        completion: true,
        score: {
          scaled: result.maxScore > 0 ? result.score / result.maxScore : 0,
          raw: result.score,
          max: result.maxScore
        },
        duration: `PT${result.duration}S`
      },
      context: {
        registration: attemptId,
        extensions: result.bloomsLevel ? {
          [`${this.platformId}/extensions/bloomsLevel`]: result.bloomsLevel
        } : undefined
      }
    };

    await this.client.sendStatement(statement);
  }

  /**
   * Track cognitive level mastered
   */
  async trackBloomsMastery(
    user: { id: string; email: string; name?: string },
    bloomsLevel: string,
    concept: string,
    masteryScore: number
  ): Promise<void> {
    if (!this.enabled || !this.client) return;

    const statement: xAPIStatement = {
      actor: this.createActor(user),
      verb: XAPI_VERBS.MASTERED,
      object: {
        objectType: 'Activity',
        id: `${this.platformId}/objectives/blooms/${bloomsLevel}/${encodeURIComponent(concept)}`,
        definition: {
          name: { 'en-US': `${bloomsLevel}: ${concept}` },
          type: XAPI_ACTIVITY_TYPES.OBJECTIVE
        }
      },
      result: {
        score: { scaled: masteryScore / 100 },
        success: masteryScore >= 80
      }
    };

    await this.client.sendStatement(statement);
  }

  private mapQuestionType(type: string): xAPIActivityDefinition['interactionType'] {
    const mapping: Record<string, xAPIActivityDefinition['interactionType']> = {
      'MULTIPLE_CHOICE': 'choice',
      'TRUE_FALSE': 'true-false',
      'SHORT_ANSWER': 'fill-in',
      'ESSAY': 'long-fill-in',
      'FILL_IN_BLANK': 'fill-in',
      'MATCHING': 'matching',
      'ORDERING': 'sequencing'
    };
    return mapping[type] || 'other';
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let xapiService: TaxomindxAPIService | null = null;

export function getxAPIService(): TaxomindxAPIService {
  if (!xapiService) {
    xapiService = new TaxomindxAPIService();
  }
  return xapiService;
}

export default TaxomindxAPIService;
