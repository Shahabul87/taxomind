/**
 * Manual mock for @sam-ai/react
 *
 * Provides a configurable useAgentic mock that tests can override
 * via the exported mockUseAgenticReturn object.
 *
 * Usage in tests:
 *   const { mockUseAgenticReturn } = require('@sam-ai/react');
 *   mockUseAgenticReturn.progressReport = { ... };
 */

const mockUseAgenticReturn = {
  // Goals
  goals: [],
  isLoadingGoals: false,
  fetchGoals: jest.fn(),
  createGoal: jest.fn(),
  updateGoal: jest.fn(),
  decomposeGoal: jest.fn(),
  deleteGoal: jest.fn(),

  // Plans
  plans: [],
  isLoadingPlans: false,
  fetchPlans: jest.fn(),
  createPlan: jest.fn(),
  startPlan: jest.fn(),
  pausePlan: jest.fn(),
  resumePlan: jest.fn(),

  // Recommendations
  recommendations: null,
  isLoadingRecommendations: false,
  fetchRecommendations: jest.fn(),
  dismissRecommendation: jest.fn(),

  // Progress
  progressReport: null,
  isLoadingProgress: false,
  fetchProgressReport: jest.fn(),

  // Skills
  skills: [],
  isLoadingSkills: false,
  fetchSkillMap: jest.fn(),

  // Check-ins
  checkIns: [],
  isLoadingCheckIns: false,
  fetchCheckIns: jest.fn(),
  respondToCheckIn: jest.fn(),
  dismissCheckIn: jest.fn(),

  // Utility
  error: null,
  clearError: jest.fn(),
};

const useAgentic = jest.fn(() => mockUseAgenticReturn);

module.exports = {
  __esModule: true,
  useAgentic,
  mockUseAgenticReturn,

  // Other hooks - stub them
  useSAM: jest.fn(() => ({})),
  useSAMChat: jest.fn(() => ({})),
  useSAMActions: jest.fn(() => ({})),
  useSAMPageContext: jest.fn(() => ({})),
  useSAMAutoContext: jest.fn(() => ({})),
  useSAMAnalysis: jest.fn(() => ({})),
  useSAMForm: jest.fn(() => ({})),
  useSAMFormSync: jest.fn(() => ({})),
  useSAMPageLinks: jest.fn(() => ({})),
  useSAMFormDataSync: jest.fn(() => ({})),
  useSAMFormDataEvents: jest.fn(() => ({})),
  useSAMFormAutoDetect: jest.fn(() => ({})),
  useSAMFormAutoFill: jest.fn(() => ({})),
  useSAMPracticeProblems: jest.fn(() => ({})),
  useSAMAdaptiveContent: jest.fn(() => ({})),
  useSAMSocraticDialogue: jest.fn(() => ({})),
  useBehaviorPatterns: jest.fn(() => ({})),
  useRecommendations: jest.fn(() => ({})),
  useNotifications: jest.fn(() => ({})),
  useSAMMemory: jest.fn(() => ({})),
  usePushNotifications: jest.fn(() => ({})),
  usePresence: jest.fn(() => ({})),
  useRealtime: jest.fn(() => ({})),
  useInterventions: jest.fn(() => ({})),
  useTutoringOrchestration: jest.fn(() => ({})),
  useCurrentStep: jest.fn(() => ({})),
  useStepProgress: jest.fn(() => ({})),
  useStepCelebration: jest.fn(() => ({})),
  useContextGathering: jest.fn(() => ({})),
  useContextMemorySync: jest.fn(() => ({})),
  useExamEngine: jest.fn(() => ({})),
  useQuestionBank: jest.fn(() => ({})),
  useInnovationFeatures: jest.fn(() => ({})),
  useMultimodal: jest.fn(() => ({})),

  // Providers
  SAMProvider: jest.fn(({ children }) => children),
  useSAMContext: jest.fn(() => ({})),
  SAMContext: {},
  TutoringOrchestrationProvider: jest.fn(({ children }) => children),
  useTutoringOrchestrationContext: jest.fn(() => ({})),

  // Utilities
  createContextDetector: jest.fn(),
  contextDetector: {},
  getCapabilities: jest.fn(() => []),
  hasCapability: jest.fn(() => false),
  SAM_FORM_DATA_EVENT: 'sam-form-data',
  emitSAMFormData: jest.fn(),

  // Version
  VERSION: '0.1.0-mock',
};
