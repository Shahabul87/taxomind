/**
 * SCORM 2004 4th Edition Wrapper for Taxomind LMS
 *
 * Provides SCORM-compliant content packaging and runtime communication
 * for seamless integration with SCORM-compliant LMS platforms.
 *
 * Standards: SCORM 2004 4th Edition, IEEE 1484.11.1-2004
 */

// SCORM 2004 Data Model Elements
export interface SCORMDataModel {
  // Learner Information
  'cmi.learner_id': string;
  'cmi.learner_name': string;
  'cmi.learner_preference.audio_level': number;
  'cmi.learner_preference.language': string;
  'cmi.learner_preference.delivery_speed': number;
  'cmi.learner_preference.audio_captioning': number;

  // Session Data
  'cmi.session_time': string; // ISO 8601 duration
  'cmi.total_time': string;
  'cmi.entry': 'ab-initio' | 'resume' | '';
  'cmi.exit': 'timeout' | 'suspend' | 'logout' | 'normal' | '';

  // Completion and Success
  'cmi.completion_status': 'completed' | 'incomplete' | 'not attempted' | 'unknown';
  'cmi.completion_threshold': number;
  'cmi.success_status': 'passed' | 'failed' | 'unknown';
  'cmi.scaled_passing_score': number;

  // Scoring
  'cmi.score.scaled': number; // -1.0 to 1.0
  'cmi.score.raw': number;
  'cmi.score.min': number;
  'cmi.score.max': number;

  // Progress
  'cmi.progress_measure': number; // 0.0 to 1.0
  'cmi.location': string; // bookmark
  'cmi.suspend_data': string; // max 64000 characters

  // Interactions (questions)
  'cmi.interactions._count': number;

  // Objectives
  'cmi.objectives._count': number;

  // Comments
  'cmi.comments_from_learner._count': number;
  'cmi.comments_from_lms._count': number;
}

export interface SCORMInteraction {
  id: string;
  type: 'true-false' | 'choice' | 'fill-in' | 'long-fill-in' | 'matching' |
        'performance' | 'sequencing' | 'likert' | 'numeric' | 'other';
  timestamp: string;
  weighting: number;
  learner_response: string;
  correct_responses: { pattern: string }[];
  result: 'correct' | 'incorrect' | 'unanticipated' | 'neutral' | number;
  latency: string; // ISO 8601 duration
  description: string;
  objectives: { id: string }[];
}

export interface SCORMObjective {
  id: string;
  score: {
    scaled?: number;
    raw?: number;
    min?: number;
    max?: number;
  };
  success_status: 'passed' | 'failed' | 'unknown';
  completion_status: 'completed' | 'incomplete' | 'not attempted' | 'unknown';
  progress_measure?: number;
  description?: string;
}

export interface SCORMComment {
  comment: string;
  timestamp: string;
  location?: string;
}

// SCORM Error Codes
export enum SCORMErrorCode {
  NO_ERROR = 0,
  GENERAL_EXCEPTION = 101,
  GENERAL_INITIALIZATION_FAILURE = 102,
  ALREADY_INITIALIZED = 103,
  CONTENT_INSTANCE_TERMINATED = 104,
  GENERAL_TERMINATION_FAILURE = 111,
  TERMINATION_BEFORE_INITIALIZATION = 112,
  TERMINATION_AFTER_TERMINATION = 113,
  RETRIEVE_DATA_BEFORE_INITIALIZATION = 122,
  RETRIEVE_DATA_AFTER_TERMINATION = 123,
  STORE_DATA_BEFORE_INITIALIZATION = 132,
  STORE_DATA_AFTER_TERMINATION = 133,
  COMMIT_BEFORE_INITIALIZATION = 142,
  COMMIT_AFTER_TERMINATION = 143,
  GENERAL_ARGUMENT_ERROR = 201,
  GENERAL_GET_FAILURE = 301,
  GENERAL_SET_FAILURE = 351,
  GENERAL_COMMIT_FAILURE = 391,
  UNDEFINED_DATA_MODEL_ELEMENT = 401,
  UNIMPLEMENTED_DATA_MODEL_ELEMENT = 402,
  DATA_MODEL_ELEMENT_VALUE_NOT_INITIALIZED = 403,
  DATA_MODEL_ELEMENT_IS_READ_ONLY = 404,
  DATA_MODEL_ELEMENT_IS_WRITE_ONLY = 405,
  DATA_MODEL_ELEMENT_TYPE_MISMATCH = 406,
  DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE = 407,
  DATA_MODEL_DEPENDENCY_NOT_ESTABLISHED = 408,
}

// SCORM API Wrapper Class
export class SCORMWrapper {
  private initialized: boolean = false;
  private terminated: boolean = false;
  private dataModel: Partial<SCORMDataModel> = {};
  private interactions: SCORMInteraction[] = [];
  private objectives: SCORMObjective[] = [];
  private learnerComments: SCORMComment[] = [];
  private lmsComments: SCORMComment[] = [];
  private lastError: SCORMErrorCode = SCORMErrorCode.NO_ERROR;
  private startTime: Date | null = null;

  // API callbacks for LMS communication
  private onCommit?: (data: Record<string, unknown>) => Promise<boolean>;
  private onTerminate?: (data: Record<string, unknown>) => Promise<boolean>;

  constructor(config?: {
    onCommit?: (data: Record<string, unknown>) => Promise<boolean>;
    onTerminate?: (data: Record<string, unknown>) => Promise<boolean>;
    initialData?: Partial<SCORMDataModel>;
    lmsComments?: SCORMComment[];
  }) {
    if (config?.onCommit) this.onCommit = config.onCommit;
    if (config?.onTerminate) this.onTerminate = config.onTerminate;
    if (config?.initialData) this.dataModel = { ...config.initialData };
    if (config?.lmsComments) this.lmsComments = config.lmsComments;
  }

  /**
   * Initialize communication with LMS
   */
  Initialize(param: string): 'true' | 'false' {
    if (param !== '') {
      this.lastError = SCORMErrorCode.GENERAL_ARGUMENT_ERROR;
      return 'false';
    }

    if (this.initialized) {
      this.lastError = SCORMErrorCode.ALREADY_INITIALIZED;
      return 'false';
    }

    if (this.terminated) {
      this.lastError = SCORMErrorCode.CONTENT_INSTANCE_TERMINATED;
      return 'false';
    }

    this.initialized = true;
    this.startTime = new Date();
    this.lastError = SCORMErrorCode.NO_ERROR;

    // Set entry status
    if (this.dataModel['cmi.location'] || this.dataModel['cmi.suspend_data']) {
      this.dataModel['cmi.entry'] = 'resume';
    } else {
      this.dataModel['cmi.entry'] = 'ab-initio';
    }

    return 'true';
  }

  /**
   * Terminate communication with LMS
   */
  async Terminate(param: string): Promise<'true' | 'false'> {
    if (param !== '') {
      this.lastError = SCORMErrorCode.GENERAL_ARGUMENT_ERROR;
      return 'false';
    }

    if (!this.initialized) {
      this.lastError = SCORMErrorCode.TERMINATION_BEFORE_INITIALIZATION;
      return 'false';
    }

    if (this.terminated) {
      this.lastError = SCORMErrorCode.TERMINATION_AFTER_TERMINATION;
      return 'false';
    }

    // Calculate session time
    if (this.startTime) {
      const sessionDuration = new Date().getTime() - this.startTime.getTime();
      this.dataModel['cmi.session_time'] = this.formatDuration(sessionDuration);
    }

    // Commit final data
    const commitResult = await this.Commit('');
    if (commitResult === 'false') {
      this.lastError = SCORMErrorCode.GENERAL_TERMINATION_FAILURE;
      return 'false';
    }

    // Call termination callback
    if (this.onTerminate) {
      try {
        await this.onTerminate(this.getAllData());
      } catch {
        this.lastError = SCORMErrorCode.GENERAL_TERMINATION_FAILURE;
        return 'false';
      }
    }

    this.terminated = true;
    this.initialized = false;
    this.lastError = SCORMErrorCode.NO_ERROR;

    return 'true';
  }

  /**
   * Get a value from the data model
   */
  GetValue(element: string): string {
    if (!this.initialized) {
      this.lastError = SCORMErrorCode.RETRIEVE_DATA_BEFORE_INITIALIZATION;
      return '';
    }

    if (this.terminated) {
      this.lastError = SCORMErrorCode.RETRIEVE_DATA_AFTER_TERMINATION;
      return '';
    }

    // Handle _count elements
    if (element === 'cmi.interactions._count') {
      return String(this.interactions.length);
    }
    if (element === 'cmi.objectives._count') {
      return String(this.objectives.length);
    }
    if (element === 'cmi.comments_from_learner._count') {
      return String(this.learnerComments.length);
    }
    if (element === 'cmi.comments_from_lms._count') {
      return String(this.lmsComments.length);
    }

    // Handle interaction elements
    const interactionMatch = element.match(/^cmi\.interactions\.(\d+)\.(.+)$/);
    if (interactionMatch) {
      const index = parseInt(interactionMatch[1], 10);
      const field = interactionMatch[2];
      return this.getInteractionValue(index, field);
    }

    // Handle objective elements
    const objectiveMatch = element.match(/^cmi\.objectives\.(\d+)\.(.+)$/);
    if (objectiveMatch) {
      const index = parseInt(objectiveMatch[1], 10);
      const field = objectiveMatch[2];
      return this.getObjectiveValue(index, field);
    }

    // Handle comment elements
    const learnerCommentMatch = element.match(/^cmi\.comments_from_learner\.(\d+)\.(.+)$/);
    if (learnerCommentMatch) {
      const index = parseInt(learnerCommentMatch[1], 10);
      const field = learnerCommentMatch[2];
      return this.getCommentValue(this.learnerComments, index, field);
    }

    const lmsCommentMatch = element.match(/^cmi\.comments_from_lms\.(\d+)\.(.+)$/);
    if (lmsCommentMatch) {
      const index = parseInt(lmsCommentMatch[1], 10);
      const field = lmsCommentMatch[2];
      return this.getCommentValue(this.lmsComments, index, field);
    }

    // Handle standard data model elements
    const value = this.dataModel[element as keyof SCORMDataModel];
    if (value === undefined) {
      this.lastError = SCORMErrorCode.DATA_MODEL_ELEMENT_VALUE_NOT_INITIALIZED;
      return '';
    }

    this.lastError = SCORMErrorCode.NO_ERROR;
    return String(value);
  }

  /**
   * Set a value in the data model
   */
  SetValue(element: string, value: string): 'true' | 'false' {
    if (!this.initialized) {
      this.lastError = SCORMErrorCode.STORE_DATA_BEFORE_INITIALIZATION;
      return 'false';
    }

    if (this.terminated) {
      this.lastError = SCORMErrorCode.STORE_DATA_AFTER_TERMINATION;
      return 'false';
    }

    // Read-only elements
    const readOnlyElements = [
      'cmi.learner_id',
      'cmi.learner_name',
      'cmi.total_time',
      'cmi.entry',
      'cmi.completion_threshold',
      'cmi.scaled_passing_score',
      'cmi.comments_from_lms._count',
    ];

    if (readOnlyElements.some(ro => element.startsWith(ro))) {
      this.lastError = SCORMErrorCode.DATA_MODEL_ELEMENT_IS_READ_ONLY;
      return 'false';
    }

    // Handle interaction elements
    const interactionMatch = element.match(/^cmi\.interactions\.(\d+)\.(.+)$/);
    if (interactionMatch) {
      const index = parseInt(interactionMatch[1], 10);
      const field = interactionMatch[2];
      return this.setInteractionValue(index, field, value);
    }

    // Handle objective elements
    const objectiveMatch = element.match(/^cmi\.objectives\.(\d+)\.(.+)$/);
    if (objectiveMatch) {
      const index = parseInt(objectiveMatch[1], 10);
      const field = objectiveMatch[2];
      return this.setObjectiveValue(index, field, value);
    }

    // Handle learner comment elements
    const learnerCommentMatch = element.match(/^cmi\.comments_from_learner\.(\d+)\.(.+)$/);
    if (learnerCommentMatch) {
      const index = parseInt(learnerCommentMatch[1], 10);
      const field = learnerCommentMatch[2];
      return this.setCommentValue(index, field, value);
    }

    // Validate and set standard elements
    if (!this.validateValue(element, value)) {
      return 'false';
    }

    // Use type assertion for dynamic assignment
    (this.dataModel as Record<string, string | number | boolean>)[element] = this.parseValue(element, value);
    this.lastError = SCORMErrorCode.NO_ERROR;
    return 'true';
  }

  /**
   * Commit data to the LMS
   */
  async Commit(param: string): Promise<'true' | 'false'> {
    if (param !== '') {
      this.lastError = SCORMErrorCode.GENERAL_ARGUMENT_ERROR;
      return 'false';
    }

    if (!this.initialized) {
      this.lastError = SCORMErrorCode.COMMIT_BEFORE_INITIALIZATION;
      return 'false';
    }

    if (this.terminated) {
      this.lastError = SCORMErrorCode.COMMIT_AFTER_TERMINATION;
      return 'false';
    }

    if (this.onCommit) {
      try {
        const success = await this.onCommit(this.getAllData());
        if (!success) {
          this.lastError = SCORMErrorCode.GENERAL_COMMIT_FAILURE;
          return 'false';
        }
      } catch {
        this.lastError = SCORMErrorCode.GENERAL_COMMIT_FAILURE;
        return 'false';
      }
    }

    this.lastError = SCORMErrorCode.NO_ERROR;
    return 'true';
  }

  /**
   * Get last error code
   */
  GetLastError(): string {
    return String(this.lastError);
  }

  /**
   * Get error string for error code
   */
  GetErrorString(errorCode: string): string {
    const code = parseInt(errorCode, 10) as SCORMErrorCode;
    const errorStrings: Record<SCORMErrorCode, string> = {
      [SCORMErrorCode.NO_ERROR]: 'No Error',
      [SCORMErrorCode.GENERAL_EXCEPTION]: 'General Exception',
      [SCORMErrorCode.GENERAL_INITIALIZATION_FAILURE]: 'General Initialization Failure',
      [SCORMErrorCode.ALREADY_INITIALIZED]: 'Already Initialized',
      [SCORMErrorCode.CONTENT_INSTANCE_TERMINATED]: 'Content Instance Terminated',
      [SCORMErrorCode.GENERAL_TERMINATION_FAILURE]: 'General Termination Failure',
      [SCORMErrorCode.TERMINATION_BEFORE_INITIALIZATION]: 'Termination Before Initialization',
      [SCORMErrorCode.TERMINATION_AFTER_TERMINATION]: 'Termination After Termination',
      [SCORMErrorCode.RETRIEVE_DATA_BEFORE_INITIALIZATION]: 'Retrieve Data Before Initialization',
      [SCORMErrorCode.RETRIEVE_DATA_AFTER_TERMINATION]: 'Retrieve Data After Termination',
      [SCORMErrorCode.STORE_DATA_BEFORE_INITIALIZATION]: 'Store Data Before Initialization',
      [SCORMErrorCode.STORE_DATA_AFTER_TERMINATION]: 'Store Data After Termination',
      [SCORMErrorCode.COMMIT_BEFORE_INITIALIZATION]: 'Commit Before Initialization',
      [SCORMErrorCode.COMMIT_AFTER_TERMINATION]: 'Commit After Termination',
      [SCORMErrorCode.GENERAL_ARGUMENT_ERROR]: 'General Argument Error',
      [SCORMErrorCode.GENERAL_GET_FAILURE]: 'General Get Failure',
      [SCORMErrorCode.GENERAL_SET_FAILURE]: 'General Set Failure',
      [SCORMErrorCode.GENERAL_COMMIT_FAILURE]: 'General Commit Failure',
      [SCORMErrorCode.UNDEFINED_DATA_MODEL_ELEMENT]: 'Undefined Data Model Element',
      [SCORMErrorCode.UNIMPLEMENTED_DATA_MODEL_ELEMENT]: 'Unimplemented Data Model Element',
      [SCORMErrorCode.DATA_MODEL_ELEMENT_VALUE_NOT_INITIALIZED]: 'Data Model Element Value Not Initialized',
      [SCORMErrorCode.DATA_MODEL_ELEMENT_IS_READ_ONLY]: 'Data Model Element Is Read Only',
      [SCORMErrorCode.DATA_MODEL_ELEMENT_IS_WRITE_ONLY]: 'Data Model Element Is Write Only',
      [SCORMErrorCode.DATA_MODEL_ELEMENT_TYPE_MISMATCH]: 'Data Model Element Type Mismatch',
      [SCORMErrorCode.DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE]: 'Data Model Element Value Out Of Range',
      [SCORMErrorCode.DATA_MODEL_DEPENDENCY_NOT_ESTABLISHED]: 'Data Model Dependency Not Established',
    };

    return errorStrings[code] || 'Unknown Error';
  }

  /**
   * Get diagnostic information for error code
   */
  GetDiagnostic(errorCode: string): string {
    return `Error ${errorCode}: ${this.GetErrorString(errorCode)}`;
  }

  // Helper methods

  private getInteractionValue(index: number, field: string): string {
    if (index >= this.interactions.length) {
      this.lastError = SCORMErrorCode.GENERAL_GET_FAILURE;
      return '';
    }

    const interaction = this.interactions[index];

    switch (field) {
      case 'id': return interaction.id;
      case 'type': return interaction.type;
      case 'timestamp': return interaction.timestamp;
      case 'weighting': return String(interaction.weighting);
      case 'learner_response': return interaction.learner_response;
      case 'result': return String(interaction.result);
      case 'latency': return interaction.latency;
      case 'description': return interaction.description;
      case 'correct_responses._count': return String(interaction.correct_responses.length);
      case 'objectives._count': return String(interaction.objectives.length);
      default:
        // Handle correct_responses.n.pattern
        const crMatch = field.match(/^correct_responses\.(\d+)\.pattern$/);
        if (crMatch) {
          const crIndex = parseInt(crMatch[1], 10);
          if (crIndex < interaction.correct_responses.length) {
            return interaction.correct_responses[crIndex].pattern;
          }
        }
        // Handle objectives.n.id
        const objMatch = field.match(/^objectives\.(\d+)\.id$/);
        if (objMatch) {
          const objIndex = parseInt(objMatch[1], 10);
          if (objIndex < interaction.objectives.length) {
            return interaction.objectives[objIndex].id;
          }
        }
        this.lastError = SCORMErrorCode.UNDEFINED_DATA_MODEL_ELEMENT;
        return '';
    }
  }

  private setInteractionValue(index: number, field: string, value: string): 'true' | 'false' {
    // Auto-create interaction if setting id
    while (this.interactions.length <= index) {
      this.interactions.push({
        id: '',
        type: 'other',
        timestamp: new Date().toISOString(),
        weighting: 1,
        learner_response: '',
        correct_responses: [],
        result: 'neutral',
        latency: 'PT0S',
        description: '',
        objectives: [],
      });
    }

    const interaction = this.interactions[index];

    switch (field) {
      case 'id':
        interaction.id = value;
        break;
      case 'type':
        interaction.type = value as SCORMInteraction['type'];
        break;
      case 'timestamp':
        interaction.timestamp = value;
        break;
      case 'weighting':
        interaction.weighting = parseFloat(value);
        break;
      case 'learner_response':
        interaction.learner_response = value;
        break;
      case 'result':
        interaction.result = isNaN(parseFloat(value)) ? value as 'correct' | 'incorrect' | 'unanticipated' | 'neutral' : parseFloat(value);
        break;
      case 'latency':
        interaction.latency = value;
        break;
      case 'description':
        interaction.description = value;
        break;
      default:
        // Handle correct_responses.n.pattern
        const crMatch = field.match(/^correct_responses\.(\d+)\.pattern$/);
        if (crMatch) {
          const crIndex = parseInt(crMatch[1], 10);
          while (interaction.correct_responses.length <= crIndex) {
            interaction.correct_responses.push({ pattern: '' });
          }
          interaction.correct_responses[crIndex].pattern = value;
          break;
        }
        // Handle objectives.n.id
        const objMatch = field.match(/^objectives\.(\d+)\.id$/);
        if (objMatch) {
          const objIndex = parseInt(objMatch[1], 10);
          while (interaction.objectives.length <= objIndex) {
            interaction.objectives.push({ id: '' });
          }
          interaction.objectives[objIndex].id = value;
          break;
        }
        this.lastError = SCORMErrorCode.UNDEFINED_DATA_MODEL_ELEMENT;
        return 'false';
    }

    this.lastError = SCORMErrorCode.NO_ERROR;
    return 'true';
  }

  private getObjectiveValue(index: number, field: string): string {
    if (index >= this.objectives.length) {
      this.lastError = SCORMErrorCode.GENERAL_GET_FAILURE;
      return '';
    }

    const objective = this.objectives[index];

    switch (field) {
      case 'id': return objective.id;
      case 'score.scaled': return String(objective.score.scaled ?? '');
      case 'score.raw': return String(objective.score.raw ?? '');
      case 'score.min': return String(objective.score.min ?? '');
      case 'score.max': return String(objective.score.max ?? '');
      case 'success_status': return objective.success_status;
      case 'completion_status': return objective.completion_status;
      case 'progress_measure': return String(objective.progress_measure ?? '');
      case 'description': return objective.description ?? '';
      default:
        this.lastError = SCORMErrorCode.UNDEFINED_DATA_MODEL_ELEMENT;
        return '';
    }
  }

  private setObjectiveValue(index: number, field: string, value: string): 'true' | 'false' {
    while (this.objectives.length <= index) {
      this.objectives.push({
        id: '',
        score: {},
        success_status: 'unknown',
        completion_status: 'unknown',
      });
    }

    const objective = this.objectives[index];

    switch (field) {
      case 'id':
        objective.id = value;
        break;
      case 'score.scaled':
        objective.score.scaled = parseFloat(value);
        break;
      case 'score.raw':
        objective.score.raw = parseFloat(value);
        break;
      case 'score.min':
        objective.score.min = parseFloat(value);
        break;
      case 'score.max':
        objective.score.max = parseFloat(value);
        break;
      case 'success_status':
        objective.success_status = value as SCORMObjective['success_status'];
        break;
      case 'completion_status':
        objective.completion_status = value as SCORMObjective['completion_status'];
        break;
      case 'progress_measure':
        objective.progress_measure = parseFloat(value);
        break;
      case 'description':
        objective.description = value;
        break;
      default:
        this.lastError = SCORMErrorCode.UNDEFINED_DATA_MODEL_ELEMENT;
        return 'false';
    }

    this.lastError = SCORMErrorCode.NO_ERROR;
    return 'true';
  }

  private getCommentValue(comments: SCORMComment[], index: number, field: string): string {
    if (index >= comments.length) {
      this.lastError = SCORMErrorCode.GENERAL_GET_FAILURE;
      return '';
    }

    const comment = comments[index];

    switch (field) {
      case 'comment': return comment.comment;
      case 'timestamp': return comment.timestamp;
      case 'location': return comment.location ?? '';
      default:
        this.lastError = SCORMErrorCode.UNDEFINED_DATA_MODEL_ELEMENT;
        return '';
    }
  }

  private setCommentValue(index: number, field: string, value: string): 'true' | 'false' {
    while (this.learnerComments.length <= index) {
      this.learnerComments.push({
        comment: '',
        timestamp: new Date().toISOString(),
      });
    }

    const comment = this.learnerComments[index];

    switch (field) {
      case 'comment':
        comment.comment = value;
        break;
      case 'timestamp':
        comment.timestamp = value;
        break;
      case 'location':
        comment.location = value;
        break;
      default:
        this.lastError = SCORMErrorCode.UNDEFINED_DATA_MODEL_ELEMENT;
        return 'false';
    }

    this.lastError = SCORMErrorCode.NO_ERROR;
    return 'true';
  }

  private validateValue(element: string, value: string): boolean {
    // Validate score.scaled (-1.0 to 1.0)
    if (element === 'cmi.score.scaled') {
      const num = parseFloat(value);
      if (isNaN(num) || num < -1 || num > 1) {
        this.lastError = SCORMErrorCode.DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE;
        return false;
      }
    }

    // Validate progress_measure (0.0 to 1.0)
    if (element === 'cmi.progress_measure') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 1) {
        this.lastError = SCORMErrorCode.DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE;
        return false;
      }
    }

    // Validate completion_status
    if (element === 'cmi.completion_status') {
      const validValues = ['completed', 'incomplete', 'not attempted', 'unknown'];
      if (!validValues.includes(value)) {
        this.lastError = SCORMErrorCode.DATA_MODEL_ELEMENT_TYPE_MISMATCH;
        return false;
      }
    }

    // Validate success_status
    if (element === 'cmi.success_status') {
      const validValues = ['passed', 'failed', 'unknown'];
      if (!validValues.includes(value)) {
        this.lastError = SCORMErrorCode.DATA_MODEL_ELEMENT_TYPE_MISMATCH;
        return false;
      }
    }

    // Validate exit
    if (element === 'cmi.exit') {
      const validValues = ['timeout', 'suspend', 'logout', 'normal', ''];
      if (!validValues.includes(value)) {
        this.lastError = SCORMErrorCode.DATA_MODEL_ELEMENT_TYPE_MISMATCH;
        return false;
      }
    }

    // Validate suspend_data length
    if (element === 'cmi.suspend_data' && value.length > 64000) {
      this.lastError = SCORMErrorCode.DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE;
      return false;
    }

    return true;
  }

  private parseValue(element: string, value: string): string | number | boolean {
    // Parse numeric values
    const numericElements = [
      'cmi.score.scaled',
      'cmi.score.raw',
      'cmi.score.min',
      'cmi.score.max',
      'cmi.progress_measure',
      'cmi.learner_preference.audio_level',
      'cmi.learner_preference.delivery_speed',
      'cmi.learner_preference.audio_captioning',
    ];

    if (numericElements.includes(element)) {
      return parseFloat(value);
    }

    return value;
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const s = seconds % 60;
    const m = minutes % 60;
    const h = hours;

    return `PT${h}H${m}M${s}S`;
  }

  private getAllData(): Record<string, unknown> {
    return {
      dataModel: this.dataModel,
      interactions: this.interactions,
      objectives: this.objectives,
      learnerComments: this.learnerComments,
    };
  }

  // Utility methods for Taxomind integration

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const progress = this.dataModel['cmi.progress_measure'];
    return progress !== undefined ? progress * 100 : 0;
  }

  /**
   * Check if learner passed
   */
  hasPassed(): boolean {
    return this.dataModel['cmi.success_status'] === 'passed';
  }

  /**
   * Get scaled score as percentage
   */
  getScorePercentage(): number {
    const scaled = this.dataModel['cmi.score.scaled'];
    return scaled !== undefined ? ((scaled + 1) / 2) * 100 : 0;
  }

  /**
   * Get all interactions as array
   */
  getInteractions(): SCORMInteraction[] {
    return [...this.interactions];
  }

  /**
   * Get all objectives as array
   */
  getObjectives(): SCORMObjective[] {
    return [...this.objectives];
  }
}

/**
 * SCORM Package Manifest Generator
 * Creates imsmanifest.xml for SCORM 2004 packages
 */
export class SCORMManifestGenerator {
  /**
   * Generate imsmanifest.xml content
   */
  generateManifest(config: {
    identifier: string;
    title: string;
    description?: string;
    version?: string;
    organization: {
      identifier: string;
      title: string;
      items: {
        identifier: string;
        title: string;
        resourceIdentifier: string;
        objectives?: { id: string; title: string; primary?: boolean }[];
      }[];
    };
    resources: {
      identifier: string;
      type: string;
      href: string;
      files: string[];
      dependencies?: string[];
    }[];
    sequencing?: {
      controlMode?: {
        choice?: boolean;
        flow?: boolean;
        forwardOnly?: boolean;
      };
      completionThreshold?: number;
      objectives?: {
        primaryId: string;
        minNormalizedMeasure?: number;
      };
    };
  }): string {
    const xmlns = {
      default: 'http://www.imsglobal.org/xsd/imscp_v1p1',
      adlcp: 'http://www.adlnet.org/xsd/adlcp_v1p3',
      adlseq: 'http://www.adlnet.org/xsd/adlseq_v1p3',
      adlnav: 'http://www.adlnet.org/xsd/adlnav_v1p3',
      imsss: 'http://www.imsglobal.org/xsd/imsss',
      xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${this.escapeXml(config.identifier)}"
  version="${config.version || '1.0'}"
  xmlns="${xmlns.default}"
  xmlns:adlcp="${xmlns.adlcp}"
  xmlns:adlseq="${xmlns.adlseq}"
  xmlns:adlnav="${xmlns.adlnav}"
  xmlns:imsss="${xmlns.imsss}"
  xmlns:xsi="${xmlns.xsi}"
  xsi:schemaLocation="${xmlns.default} imscp_v1p1.xsd
    ${xmlns.adlcp} adlcp_v1p3.xsd
    ${xmlns.adlseq} adlseq_v1p3.xsd
    ${xmlns.adlnav} adlnav_v1p3.xsd
    ${xmlns.imsss} imsss_v1p0.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>

  <organizations default="${this.escapeXml(config.organization.identifier)}">
    <organization identifier="${this.escapeXml(config.organization.identifier)}">
      <title>${this.escapeXml(config.organization.title)}</title>`;

    // Add items
    for (const item of config.organization.items) {
      xml += `
      <item identifier="${this.escapeXml(item.identifier)}" identifierref="${this.escapeXml(item.resourceIdentifier)}">
        <title>${this.escapeXml(item.title)}</title>`;

      // Add objectives if present
      if (item.objectives && item.objectives.length > 0) {
        xml += `
        <imsss:sequencing>
          <imsss:objectives>`;
        for (const obj of item.objectives) {
          if (obj.primary) {
            xml += `
            <imsss:primaryObjective objectiveID="${this.escapeXml(obj.id)}">
              <imsss:minNormalizedMeasure>${config.sequencing?.objectives?.minNormalizedMeasure ?? 0.7}</imsss:minNormalizedMeasure>
            </imsss:primaryObjective>`;
          } else {
            xml += `
            <imsss:objective objectiveID="${this.escapeXml(obj.id)}" />`;
          }
        }
        xml += `
          </imsss:objectives>
        </imsss:sequencing>`;
      }

      xml += `
      </item>`;
    }

    // Add sequencing rules if present
    if (config.sequencing) {
      xml += `
      <imsss:sequencing>`;

      if (config.sequencing.controlMode) {
        xml += `
        <imsss:controlMode
          choice="${config.sequencing.controlMode.choice ?? true}"
          flow="${config.sequencing.controlMode.flow ?? true}"
          forwardOnly="${config.sequencing.controlMode.forwardOnly ?? false}" />`;
      }

      if (config.sequencing.completionThreshold !== undefined) {
        xml += `
        <adlseq:completionThreshold completedByMeasure="true" minProgressMeasure="${config.sequencing.completionThreshold}" />`;
      }

      xml += `
      </imsss:sequencing>`;
    }

    xml += `
    </organization>
  </organizations>

  <resources>`;

    // Add resources
    for (const resource of config.resources) {
      xml += `
    <resource identifier="${this.escapeXml(resource.identifier)}"
      type="${this.escapeXml(resource.type)}"
      href="${this.escapeXml(resource.href)}"
      adlcp:scormType="sco">`;

      for (const file of resource.files) {
        xml += `
      <file href="${this.escapeXml(file)}" />`;
      }

      if (resource.dependencies) {
        for (const dep of resource.dependencies) {
          xml += `
      <dependency identifierref="${this.escapeXml(dep)}" />`;
        }
      }

      xml += `
    </resource>`;
    }

    xml += `
  </resources>
</manifest>`;

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Taxomind SCORM Service
 * High-level integration for Taxomind exams with SCORM
 */
export class TaxomindSCORMService {
  private manifestGenerator: SCORMManifestGenerator;

  constructor() {
    this.manifestGenerator = new SCORMManifestGenerator();
  }

  /**
   * Create a SCORM wrapper for a Taxomind exam
   */
  createExamWrapper(config: {
    examId: string;
    learnerId: string;
    learnerName: string;
    passingScore: number;
    onCommit: (data: Record<string, unknown>) => Promise<boolean>;
    onTerminate: (data: Record<string, unknown>) => Promise<boolean>;
    resumeData?: {
      location?: string;
      suspendData?: string;
      totalTime?: string;
    };
  }): SCORMWrapper {
    const initialData: Partial<SCORMDataModel> = {
      'cmi.learner_id': config.learnerId,
      'cmi.learner_name': config.learnerName,
      'cmi.scaled_passing_score': config.passingScore / 100,
      'cmi.completion_status': 'incomplete',
      'cmi.success_status': 'unknown',
    };

    if (config.resumeData) {
      if (config.resumeData.location) {
        initialData['cmi.location'] = config.resumeData.location;
      }
      if (config.resumeData.suspendData) {
        initialData['cmi.suspend_data'] = config.resumeData.suspendData;
      }
      if (config.resumeData.totalTime) {
        initialData['cmi.total_time'] = config.resumeData.totalTime;
      }
    }

    return new SCORMWrapper({
      initialData,
      onCommit: config.onCommit,
      onTerminate: config.onTerminate,
    });
  }

  /**
   * Record question answer in SCORM format
   */
  recordAnswer(
    wrapper: SCORMWrapper,
    interactionIndex: number,
    question: {
      id: string;
      type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'ESSAY' | 'MATCHING' | 'ORDERING' | 'CODING';
      text: string;
      correctAnswer?: string;
      weight?: number;
    },
    answer: {
      response: string;
      isCorrect?: boolean;
      score?: number;
      latencyMs?: number;
    }
  ): void {
    // Map Taxomind question types to SCORM interaction types
    const typeMap: Record<string, SCORMInteraction['type']> = {
      MULTIPLE_CHOICE: 'choice',
      TRUE_FALSE: 'true-false',
      FILL_BLANK: 'fill-in',
      ESSAY: 'long-fill-in',
      MATCHING: 'matching',
      ORDERING: 'sequencing',
      CODING: 'performance',
    };

    wrapper.SetValue(`cmi.interactions.${interactionIndex}.id`, question.id);
    wrapper.SetValue(`cmi.interactions.${interactionIndex}.type`, typeMap[question.type] || 'other');
    wrapper.SetValue(`cmi.interactions.${interactionIndex}.timestamp`, new Date().toISOString());
    wrapper.SetValue(`cmi.interactions.${interactionIndex}.weighting`, String(question.weight ?? 1));
    wrapper.SetValue(`cmi.interactions.${interactionIndex}.learner_response`, answer.response);
    wrapper.SetValue(`cmi.interactions.${interactionIndex}.description`, question.text);

    if (question.correctAnswer) {
      wrapper.SetValue(`cmi.interactions.${interactionIndex}.correct_responses.0.pattern`, question.correctAnswer);
    }

    if (answer.isCorrect !== undefined) {
      wrapper.SetValue(`cmi.interactions.${interactionIndex}.result`, answer.isCorrect ? 'correct' : 'incorrect');
    } else if (answer.score !== undefined) {
      wrapper.SetValue(`cmi.interactions.${interactionIndex}.result`, String(answer.score));
    }

    if (answer.latencyMs) {
      const seconds = Math.floor(answer.latencyMs / 1000);
      wrapper.SetValue(`cmi.interactions.${interactionIndex}.latency`, `PT${seconds}S`);
    }
  }

  /**
   * Record Bloom's taxonomy objective mastery
   */
  recordBloomsMastery(
    wrapper: SCORMWrapper,
    objectiveIndex: number,
    bloomsLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE',
    score: number,
    completed: boolean
  ): void {
    const objectiveId = `blooms_${bloomsLevel.toLowerCase()}`;

    wrapper.SetValue(`cmi.objectives.${objectiveIndex}.id`, objectiveId);
    wrapper.SetValue(`cmi.objectives.${objectiveIndex}.score.scaled`, String(score / 100));
    wrapper.SetValue(`cmi.objectives.${objectiveIndex}.success_status`, score >= 70 ? 'passed' : 'failed');
    wrapper.SetValue(`cmi.objectives.${objectiveIndex}.completion_status`, completed ? 'completed' : 'incomplete');
    wrapper.SetValue(`cmi.objectives.${objectiveIndex}.description`, `Bloom's Taxonomy: ${bloomsLevel}`);
  }

  /**
   * Set final exam results
   */
  setExamResults(
    wrapper: SCORMWrapper,
    results: {
      score: number;
      maxScore: number;
      passed: boolean;
      completionPercentage: number;
    }
  ): void {
    const scaledScore = (results.score / results.maxScore) * 2 - 1; // Convert to -1 to 1 scale

    wrapper.SetValue('cmi.score.raw', String(results.score));
    wrapper.SetValue('cmi.score.min', '0');
    wrapper.SetValue('cmi.score.max', String(results.maxScore));
    wrapper.SetValue('cmi.score.scaled', String(Math.max(-1, Math.min(1, scaledScore))));
    wrapper.SetValue('cmi.success_status', results.passed ? 'passed' : 'failed');
    wrapper.SetValue('cmi.completion_status', results.completionPercentage >= 100 ? 'completed' : 'incomplete');
    wrapper.SetValue('cmi.progress_measure', String(Math.min(1, results.completionPercentage / 100)));
  }

  /**
   * Generate SCORM package manifest for a Taxomind exam
   */
  generateExamManifest(exam: {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
    questions: {
      id: string;
      title: string;
      bloomsLevel?: string;
    }[];
    launchFile: string;
    files: string[];
  }): string {
    // Create objectives from Bloom's levels
    const bloomsLevels = new Set(exam.questions.map(q => q.bloomsLevel).filter(Boolean));
    const objectives = Array.from(bloomsLevels).map((level, index) => ({
      id: `blooms_${level?.toLowerCase()}`,
      title: `Bloom's: ${level}`,
      primary: index === 0,
    }));

    return this.manifestGenerator.generateManifest({
      identifier: `taxomind_exam_${exam.id}`,
      title: exam.title,
      description: exam.description,
      version: '1.0',
      organization: {
        identifier: `org_${exam.id}`,
        title: exam.title,
        items: [{
          identifier: `item_${exam.id}`,
          title: exam.title,
          resourceIdentifier: `resource_${exam.id}`,
          objectives: objectives.length > 0 ? objectives : undefined,
        }],
      },
      resources: [{
        identifier: `resource_${exam.id}`,
        type: 'webcontent',
        href: exam.launchFile,
        files: exam.files,
      }],
      sequencing: {
        controlMode: {
          choice: false,
          flow: true,
          forwardOnly: false,
        },
        completionThreshold: exam.passingScore / 100,
        objectives: objectives.length > 0 ? {
          primaryId: objectives[0].id,
          minNormalizedMeasure: exam.passingScore / 100,
        } : undefined,
      },
    });
  }
}

// Export singleton instance
export const taxomindSCORM = new TaxomindSCORMService();
