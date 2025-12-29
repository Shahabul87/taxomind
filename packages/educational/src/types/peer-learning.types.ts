/**
 * @sam-ai/educational - Peer Learning Engine Types
 *
 * Comprehensive peer-to-peer learning system including:
 * - Peer matching and discovery
 * - Study groups and learning circles
 * - Peer tutoring and mentoring
 * - Collaborative projects
 * - Discussion forums and Q&A
 * - Peer assessments and reviews
 */

// ============================================================================
// Core Peer Types
// ============================================================================

/**
 * Peer profile for matching and collaboration
 */
export interface PeerProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  expertise: PeerExpertise[];
  learningGoals: PeerLearningGoal[];
  availability: PeerAvailability;
  preferences: PeerPreferences;
  stats: PeerStats;
  badges: PeerBadge[];
  reputation: ReputationScore;
  timezone?: string;
  languages: string[];
  isAvailableForMentoring: boolean;
  isSeekingMentor: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Area of expertise for a peer
 */
export interface PeerExpertise {
  subject: string;
  topic?: string;
  proficiencyLevel: PeerProficiencyLevel;
  yearsOfExperience?: number;
  credentials?: string[];
  endorsements: Endorsement[];
  isVerified: boolean;
}

/**
 * Proficiency levels for peer matching
 */
export type PeerProficiencyLevel =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT'
  | 'MASTER';

/**
 * Endorsement from another peer
 */
export interface Endorsement {
  id: string;
  endorserId: string;
  endorserName: string;
  subject: string;
  message?: string;
  createdAt: Date;
}

/**
 * Learning goal for matching purposes
 */
export interface PeerLearningGoal {
  id: string;
  subject: string;
  topic?: string;
  targetLevel: PeerProficiencyLevel;
  currentLevel?: PeerProficiencyLevel;
  deadline?: Date;
  priority: PeerGoalPriority;
  status: PeerGoalStatus;
}

export type PeerGoalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PeerGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';

/**
 * Peer availability schedule
 */
export interface PeerAvailability {
  schedule: WeeklySchedule;
  preferredSessionDuration: number; // minutes
  maxSessionsPerWeek: number;
  blackoutDates?: PeerDateRange[];
  isCurrentlyAvailable: boolean;
}

export interface WeeklySchedule {
  monday: PeerTimeSlot[];
  tuesday: PeerTimeSlot[];
  wednesday: PeerTimeSlot[];
  thursday: PeerTimeSlot[];
  friday: PeerTimeSlot[];
  saturday: PeerTimeSlot[];
  sunday: PeerTimeSlot[];
}

export interface PeerTimeSlot {
  startTime: string; // HH:mm format
  endTime: string;
}

export interface PeerDateRange {
  start: Date;
  end: Date;
  reason?: string;
}

/**
 * Peer preferences for matching
 */
export interface PeerPreferences {
  preferredGroupSize: GroupSizePreference;
  communicationStyle: CommunicationStyle;
  learningStyle: PeerLearningStyle;
  sessionFormat: SessionFormat[];
  ageRange?: AgeRange;
  preferSameTimezone: boolean;
  preferSameLanguage: boolean;
  interests?: string[];
}

export type GroupSizePreference = 'ONE_ON_ONE' | 'SMALL_GROUP' | 'LARGE_GROUP' | 'ANY';
export type CommunicationStyle = 'FORMAL' | 'CASUAL' | 'STRUCTURED' | 'FLEXIBLE';
export type PeerLearningStyle = 'VISUAL' | 'AUDITORY' | 'READING' | 'KINESTHETIC' | 'MIXED';
export type SessionFormat = 'VIDEO_CALL' | 'VOICE_CALL' | 'TEXT_CHAT' | 'IN_PERSON' | 'ASYNC';

export interface AgeRange {
  min?: number;
  max?: number;
}

/**
 * Peer statistics
 */
export interface PeerStats {
  totalSessions: number;
  totalStudyHours: number;
  groupsJoined: number;
  groupsCreated: number;
  questionsAsked: number;
  questionsAnswered: number;
  helpfulAnswers: number;
  projectsCompleted: number;
  peersHelped: number;
  reviewsGiven: number;
  reviewsReceived: number;
  averageRating: number;
  totalRatings: number;
}

/**
 * Peer badge/achievement
 */
export interface PeerBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  earnedAt: Date;
  criteria?: string;
}

export type BadgeCategory =
  | 'HELPER'
  | 'COLLABORATOR'
  | 'MENTOR'
  | 'LEARNER'
  | 'CONTRIBUTOR'
  | 'LEADER'
  | 'SPECIALIST';

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

/**
 * Reputation score system
 */
export interface ReputationScore {
  overall: number;
  helpfulness: number;
  reliability: number;
  expertise: number;
  communication: number;
  collaboration: number;
  history: ReputationChange[];
}

export interface ReputationChange {
  id: string;
  change: number;
  reason: string;
  category: ReputationCategory;
  timestamp: Date;
}

export type ReputationCategory =
  | 'SESSION_COMPLETED'
  | 'POSITIVE_FEEDBACK'
  | 'NEGATIVE_FEEDBACK'
  | 'ANSWER_ACCEPTED'
  | 'BADGE_EARNED'
  | 'PROJECT_COMPLETED'
  | 'NO_SHOW'
  | 'ENDORSEMENT_RECEIVED';

// ============================================================================
// Peer Matching Types
// ============================================================================

/**
 * Peer match result
 */
export interface PeerMatch {
  peerId: string;
  peerProfile: PeerProfile;
  matchScore: number;
  matchReasons: MatchReason[];
  commonSubjects: string[];
  complementarySkills: ComplementarySkill[];
  availabilityOverlap: number; // percentage
  compatibilityFactors: CompatibilityFactor[];
}

export interface MatchReason {
  factor: string;
  description: string;
  weight: number;
  score: number;
}

export interface ComplementarySkill {
  skill: string;
  myLevel: PeerProficiencyLevel;
  theirLevel: PeerProficiencyLevel;
  direction: 'CAN_TEACH' | 'CAN_LEARN' | 'MUTUAL';
}

export interface CompatibilityFactor {
  name: string;
  compatibility: number; // 0-1
  importance: number; // weight
}

/**
 * Peer matching criteria
 */
export interface PeerMatchCriteria {
  subjects?: string[];
  topics?: string[];
  proficiencyLevel?: PeerProficiencyLevel;
  matchType: MatchType;
  groupSizePreference?: GroupSizePreference;
  sessionFormat?: SessionFormat[];
  timezone?: string;
  languages?: string[];
  minReputationScore?: number;
  excludeUserIds?: string[];
  limit?: number;
}

export type MatchType =
  | 'STUDY_PARTNER'
  | 'MENTOR'
  | 'MENTEE'
  | 'PROJECT_COLLABORATOR'
  | 'TUTOR'
  | 'TUTEE'
  | 'ANY';

// ============================================================================
// Study Group Types
// ============================================================================

/**
 * Study group for collaborative learning
 */
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  topics: string[];
  coverImageUrl?: string;
  type: GroupType;
  visibility: GroupVisibility;
  status: GroupStatus;
  members: GroupMember[];
  maxMembers: number;
  minMembers?: number;
  owner: GroupMember;
  moderators: GroupMember[];
  schedule?: GroupSchedule;
  goals: GroupGoal[];
  rules?: string[];
  tags: string[];
  resources: GroupResource[];
  sessions: GroupSession[];
  discussions: DiscussionThread[];
  stats: GroupStats;
  settings: GroupSettings;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type GroupType =
  | 'STUDY_GROUP'
  | 'LEARNING_CIRCLE'
  | 'COHORT'
  | 'PROJECT_TEAM'
  | 'BOOK_CLUB'
  | 'ACCOUNTABILITY_GROUP';

export type GroupVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY' | 'SECRET';
export type GroupStatus = 'FORMING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

/**
 * Group member with role
 */
export interface GroupMember {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: GroupRole;
  joinedAt: Date;
  lastActiveAt: Date;
  contributions: number;
  attendance: AttendanceRecord;
}

export type GroupRole = 'OWNER' | 'MODERATOR' | 'MEMBER' | 'OBSERVER';

export interface AttendanceRecord {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  streakDays: number;
}

/**
 * Group schedule
 */
export interface GroupSchedule {
  frequency: ScheduleFrequency;
  dayOfWeek?: number; // 0-6
  timeOfDay: string; // HH:mm
  duration: number; // minutes
  timezone: string;
  nextSession?: Date;
  recurrenceRule?: string; // iCal RRULE
}

export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';

/**
 * Group goal
 */
export interface GroupGoal {
  id: string;
  title: string;
  description: string;
  targetDate?: Date;
  progress: number; // 0-100
  milestones: GroupMilestone[];
  status: PeerGoalStatus;
}

export interface GroupMilestone {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
}

/**
 * Shared resource in a group
 */
export interface GroupResource {
  id: string;
  title: string;
  description?: string;
  type: PeerResourceType;
  url?: string;
  content?: string;
  uploadedBy: string;
  uploadedAt: Date;
  downloads: number;
  likes: number;
}

export type PeerResourceType =
  | 'DOCUMENT'
  | 'VIDEO'
  | 'AUDIO'
  | 'LINK'
  | 'NOTE'
  | 'CODE'
  | 'PRESENTATION'
  | 'SPREADSHEET'
  | 'OTHER';

/**
 * Group study session
 */
export interface GroupSession {
  id: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  actualDuration?: number;
  status: SessionStatus;
  type: GroupSessionType;
  facilitator?: GroupMember;
  attendees: SessionAttendee[];
  agenda?: SessionAgenda[];
  notes?: string;
  recording?: SessionRecording;
  followUp?: SessionFollowUp;
  createdBy: string;
  createdAt: Date;
}

export type SessionStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED';

export type GroupSessionType =
  | 'STUDY_SESSION'
  | 'DISCUSSION'
  | 'PRESENTATION'
  | 'WORKSHOP'
  | 'Q_AND_A'
  | 'REVIEW'
  | 'BRAINSTORM'
  | 'PRACTICE';

export interface SessionAttendee {
  userId: string;
  displayName: string;
  status: AttendeeStatus;
  joinedAt?: Date;
  leftAt?: Date;
}

export type AttendeeStatus = 'INVITED' | 'CONFIRMED' | 'ATTENDED' | 'ABSENT' | 'EXCUSED';

export interface SessionAgenda {
  id: string;
  title: string;
  duration: number; // minutes
  presenter?: string;
  isCompleted: boolean;
}

export interface SessionRecording {
  url: string;
  duration: number;
  size: number; // bytes
  format: string;
}

export interface SessionFollowUp {
  actionItems: PeerActionItem[];
  assignedReadings?: string[];
  nextSessionTopics?: string[];
}

export interface PeerActionItem {
  id: string;
  title: string;
  assignee?: string;
  dueDate?: Date;
  isCompleted: boolean;
}

/**
 * Group statistics
 */
export interface GroupStats {
  totalSessions: number;
  totalStudyHours: number;
  averageAttendance: number;
  goalsCompleted: number;
  resourcesShared: number;
  discussionPosts: number;
  activeStreak: number; // days
  memberGrowth: number;
}

/**
 * Group settings
 */
export interface GroupSettings {
  allowJoinRequests: boolean;
  requireApproval: boolean;
  allowMemberInvites: boolean;
  allowResourceSharing: boolean;
  allowDiscussions: boolean;
  notificationPreferences: NotificationPreferences;
  contentModeration: ModerationSettings;
}

export interface NotificationPreferences {
  newMember: boolean;
  sessionReminder: boolean;
  newResource: boolean;
  newDiscussion: boolean;
  goalUpdate: boolean;
}

export interface ModerationSettings {
  autoModeration: boolean;
  requireApprovalForPosts: boolean;
  wordFilter: boolean;
  reportThreshold: number;
}

// ============================================================================
// Discussion & Q&A Types
// ============================================================================

/**
 * Discussion thread
 */
export interface DiscussionThread {
  id: string;
  title: string;
  content: string;
  author: ThreadAuthor;
  type: ThreadType;
  status: ThreadStatus;
  tags: string[];
  replies: DiscussionReply[];
  views: number;
  likes: number;
  isPinned: boolean;
  isLocked: boolean;
  acceptedAnswerId?: string;
  groupId?: string;
  courseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadAuthor {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reputation: number;
}

export type ThreadType = 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT' | 'POLL' | 'RESOURCE_SHARE';
export type ThreadStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'CLOSED';

/**
 * Reply to a discussion
 */
export interface DiscussionReply {
  id: string;
  content: string;
  author: ThreadAuthor;
  parentId?: string; // for nested replies
  likes: number;
  isAcceptedAnswer: boolean;
  isEdited: boolean;
  editHistory?: EditRecord[];
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EditRecord {
  editedAt: Date;
  previousContent: string;
}

export interface Reaction {
  type: ReactionType;
  count: number;
  userIds: string[];
}

export type ReactionType =
  | 'LIKE'
  | 'HELPFUL'
  | 'INSIGHTFUL'
  | 'CELEBRATE'
  | 'CONFUSED'
  | 'QUESTION';

// ============================================================================
// Mentoring Types
// ============================================================================

/**
 * Mentorship relationship
 */
export interface Mentorship {
  id: string;
  mentorId: string;
  menteeId: string;
  mentor: MentorProfile;
  mentee: MenteeProfile;
  status: MentorshipStatus;
  type: MentorshipType;
  subjects: string[];
  goals: MentorshipGoal[];
  sessions: MentoringSession[];
  feedback: MentorshipFeedback[];
  agreement?: MentorshipAgreement;
  startDate: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MentorshipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'TERMINATED';

export type MentorshipType =
  | 'FORMAL'
  | 'INFORMAL'
  | 'PEER_MENTORING'
  | 'GROUP_MENTORING'
  | 'REVERSE_MENTORING';

/**
 * Mentor profile
 */
export interface MentorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  expertise: PeerExpertise[];
  mentoringStyle: MentoringStyle;
  totalMentees: number;
  activeMentees: number;
  successfulMentorships: number;
  rating: number;
  testimonials: Testimonial[];
  availability: PeerAvailability;
  maxMentees: number;
}

export type MentoringStyle =
  | 'DIRECTIVE'
  | 'SUPPORTIVE'
  | 'COACHING'
  | 'DELEGATING'
  | 'COLLABORATIVE';

export interface Testimonial {
  id: string;
  menteeId: string;
  menteeName: string;
  content: string;
  rating: number;
  createdAt: Date;
}

/**
 * Mentee profile
 */
export interface MenteeProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  learningGoals: PeerLearningGoal[];
  currentLevel: PeerProficiencyLevel;
  preferredMentoringStyle?: MentoringStyle;
  previousMentorships: number;
  commitment: CommitmentLevel;
}

export type CommitmentLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

/**
 * Mentorship goal
 */
export interface MentorshipGoal {
  id: string;
  title: string;
  description: string;
  targetDate?: Date;
  progress: number;
  milestones: MentorshipMilestone[];
  status: PeerGoalStatus;
  notes?: string;
}

export interface MentorshipMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  feedback?: string;
}

/**
 * Mentoring session
 */
export interface MentoringSession {
  id: string;
  mentorshipId: string;
  scheduledAt: Date;
  duration: number; // minutes
  actualDuration?: number;
  status: SessionStatus;
  type: MentoringSessionType;
  agenda?: string[];
  notes?: string;
  actionItems: PeerActionItem[];
  feedback?: SessionFeedback;
  recording?: SessionRecording;
  createdAt: Date;
}

export type MentoringSessionType =
  | 'REGULAR'
  | 'GOAL_SETTING'
  | 'PROGRESS_REVIEW'
  | 'SKILL_DEVELOPMENT'
  | 'CAREER_GUIDANCE'
  | 'PROBLEM_SOLVING'
  | 'FINAL_REVIEW';

export interface SessionFeedback {
  rating: number;
  highlights?: string;
  improvements?: string;
  isPrivate: boolean;
}

/**
 * Mentorship feedback
 */
export interface MentorshipFeedback {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: FeedbackType;
  rating: number;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export type FeedbackType = 'MENTOR_TO_MENTEE' | 'MENTEE_TO_MENTOR' | 'SYSTEM';

/**
 * Mentorship agreement
 */
export interface MentorshipAgreement {
  id: string;
  expectations: AgreementExpectation[];
  meetingFrequency: string;
  communicationChannels: string[];
  confidentialityTerms: string;
  terminationTerms: string;
  signedByMentor: boolean;
  signedByMentee: boolean;
  signedAt?: Date;
}

export interface AgreementExpectation {
  party: 'MENTOR' | 'MENTEE' | 'BOTH';
  expectation: string;
}

// ============================================================================
// Peer Review & Assessment Types
// ============================================================================

/**
 * Peer review assignment
 */
export interface PeerReviewAssignment {
  id: string;
  title: string;
  description: string;
  type: PeerReviewType;
  submissionId: string;
  submission: ReviewSubmission;
  reviewerId: string;
  reviewer: PeerProfile;
  rubric: PeerReviewRubric;
  review?: PeerReview;
  status: ReviewAssignmentStatus;
  dueDate: Date;
  assignedAt: Date;
  completedAt?: Date;
}

export type PeerReviewType =
  | 'SINGLE_BLIND'
  | 'DOUBLE_BLIND'
  | 'OPEN'
  | 'COLLABORATIVE';

export type ReviewAssignmentStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'CALIBRATED'
  | 'LATE'
  | 'EXEMPTED';

/**
 * Submission for peer review
 */
export interface ReviewSubmission {
  id: string;
  authorId: string;
  authorName?: string; // hidden in blind reviews
  title: string;
  content: string;
  attachments?: SubmissionAttachment[];
  courseId?: string;
  assignmentId?: string;
  submittedAt: Date;
}

export interface SubmissionAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

/**
 * Peer review rubric
 */
export interface PeerReviewRubric {
  id: string;
  name: string;
  description?: string;
  criteria: ReviewCriterion[];
  totalPoints: number;
  passingScore: number;
  allowComments: boolean;
  requireComments: boolean;
}

export interface ReviewCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
  levels: CriterionLevel[];
}

export interface CriterionLevel {
  points: number;
  label: string;
  description: string;
}

/**
 * Completed peer review
 */
export interface PeerReview {
  id: string;
  assignmentId: string;
  reviewerId: string;
  scores: CriterionScore[];
  totalScore: number;
  overallFeedback: string;
  strengths?: string;
  areasForImprovement?: string;
  suggestions?: string;
  isAnonymous: boolean;
  confidence: PeerConfidenceLevel;
  timeSpent: number; // minutes
  submittedAt: Date;
}

export interface CriterionScore {
  criterionId: string;
  score: number;
  comment?: string;
}

export type PeerConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

/**
 * Review calibration for quality assurance
 */
export interface ReviewCalibration {
  id: string;
  reviewerId: string;
  calibrationSubmissionId: string;
  expectedScores: CriterionScore[];
  actualScores: CriterionScore[];
  deviation: number;
  isCalibrated: boolean;
  feedback?: string;
  completedAt: Date;
}

// ============================================================================
// Collaborative Project Types
// ============================================================================

/**
 * Collaborative project
 */
export interface CollaborativeProject {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  visibility: GroupVisibility;
  team: ProjectTeam;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  resources: ProjectResource[];
  repository?: RepositoryInfo;
  communications: ProjectCommunication[];
  reviews: ProjectReview[];
  startDate: Date;
  targetEndDate?: Date;
  actualEndDate?: Date;
  tags: string[];
  courseId?: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectType =
  | 'RESEARCH'
  | 'CODING'
  | 'DESIGN'
  | 'WRITING'
  | 'PRESENTATION'
  | 'CASE_STUDY'
  | 'CAPSTONE'
  | 'HACKATHON';

export type ProjectStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

/**
 * Project team
 */
export interface ProjectTeam {
  id: string;
  name?: string;
  members: ProjectMember[];
  roles: ProjectRoleDefinition[];
  skillMatrix: TeamSkillMatrix;
}

export interface ProjectMember {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  responsibilities: string[];
  contribution: number; // percentage
  joinedAt: Date;
  status: MemberStatus;
}

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'LEFT';

export interface ProjectRoleDefinition {
  name: string;
  description: string;
  responsibilities: string[];
  count: number;
}

export interface TeamSkillMatrix {
  skills: string[];
  memberSkills: MemberSkillEntry[];
}

export interface MemberSkillEntry {
  userId: string;
  skills: Record<string, PeerProficiencyLevel>;
}

/**
 * Project milestone
 */
export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: MilestoneStatus;
  deliverables: string[];
  completedAt?: Date;
  review?: MilestoneReview;
}

export type MilestoneStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'OVERDUE';

export interface MilestoneReview {
  reviewerId: string;
  rating: number;
  feedback: string;
  reviewedAt: Date;
}

/**
 * Project task
 */
export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  assignees: string[];
  status: TaskStatus;
  priority: TaskPriority;
  milestoneId?: string;
  dependencies: string[];
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  completedAt?: Date;
  comments: TaskComment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

/**
 * Project resource
 */
export interface ProjectResource {
  id: string;
  name: string;
  type: PeerResourceType;
  url?: string;
  content?: string;
  uploadedBy: string;
  createdAt: Date;
  version?: number;
  history?: ResourceVersion[];
}

export interface ResourceVersion {
  version: number;
  uploadedBy: string;
  uploadedAt: Date;
  changeDescription?: string;
}

/**
 * Repository integration
 */
export interface RepositoryInfo {
  platform: 'GITHUB' | 'GITLAB' | 'BITBUCKET';
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  lastCommitAt?: Date;
  contributors?: number;
}

/**
 * Project communication
 */
export interface ProjectCommunication {
  id: string;
  type: CommunicationType;
  title?: string;
  content: string;
  author: string;
  mentions?: string[];
  attachments?: SubmissionAttachment[];
  isPinned: boolean;
  createdAt: Date;
}

export type CommunicationType = 'UPDATE' | 'QUESTION' | 'DECISION' | 'BLOCKER' | 'CELEBRATION';

/**
 * Project review
 */
export interface ProjectReview {
  id: string;
  reviewerType: ReviewerType;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  feedback: string;
  criteria: ProjectReviewCriterion[];
  isPublic: boolean;
  createdAt: Date;
}

export type ReviewerType = 'PEER' | 'INSTRUCTOR' | 'MENTOR' | 'EXTERNAL';

export interface ProjectReviewCriterion {
  name: string;
  score: number;
  maxScore: number;
  comment?: string;
}

// ============================================================================
// Engine Configuration & Input Types
// ============================================================================

/**
 * Peer learning engine configuration
 */
export interface PeerLearningEngineConfig {
  matchingAlgorithm?: MatchingAlgorithm;
  defaultGroupSize?: number;
  maxGroupSize?: number;
  reputationWeights?: ReputationWeights;
  reviewCalibrationEnabled?: boolean;
  anonymousReviewsDefault?: boolean;
  mentoringEnabled?: boolean;
  projectsEnabled?: boolean;
  gamificationEnabled?: boolean;
}

export type MatchingAlgorithm = 'SIMPLE' | 'WEIGHTED' | 'GRAPH_BASED' | 'ML_ENHANCED';

export interface ReputationWeights {
  helpfulness: number;
  reliability: number;
  expertise: number;
  communication: number;
  collaboration: number;
}

/**
 * Input types for engine methods
 */
export interface CreatePeerProfileInput {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  expertise?: Omit<PeerExpertise, 'endorsements' | 'isVerified'>[];
  learningGoals?: Omit<PeerLearningGoal, 'id' | 'status'>[];
  availability?: Partial<PeerAvailability>;
  preferences?: Partial<PeerPreferences>;
  timezone?: string;
  languages?: string[];
}

export interface UpdatePeerProfileInput {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  languages?: string[];
  isAvailableForMentoring?: boolean;
  isSeekingMentor?: boolean;
}

export interface FindPeerMatchesInput {
  userId: string;
  criteria: PeerMatchCriteria;
}

export interface CreateStudyGroupInput {
  name: string;
  description: string;
  subject: string;
  topics?: string[];
  coverImageUrl?: string;
  type?: GroupType;
  visibility?: GroupVisibility;
  maxMembers?: number;
  minMembers?: number;
  ownerId: string;
  schedule?: Partial<GroupSchedule>;
  goals?: Omit<GroupGoal, 'id' | 'progress' | 'milestones' | 'status'>[];
  rules?: string[];
  tags?: string[];
  settings?: Partial<GroupSettings>;
}

export interface JoinGroupInput {
  groupId: string;
  userId: string;
  message?: string;
}

export interface CreateGroupSessionInput {
  groupId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  type?: GroupSessionType;
  facilitatorId?: string;
  agenda?: Omit<SessionAgenda, 'id' | 'isCompleted'>[];
  createdBy: string;
}

export interface CreateDiscussionInput {
  title: string;
  content: string;
  authorId: string;
  type?: ThreadType;
  tags?: string[];
  groupId?: string;
  courseId?: string;
}

export interface CreateReplyInput {
  threadId: string;
  content: string;
  authorId: string;
  parentId?: string;
}

export interface RequestMentorshipInput {
  mentorId: string;
  menteeId: string;
  type?: MentorshipType;
  subjects: string[];
  message?: string;
  goals?: Omit<MentorshipGoal, 'id' | 'progress' | 'milestones' | 'status'>[];
}

export interface CreatePeerReviewAssignmentInput {
  title: string;
  description: string;
  type?: PeerReviewType;
  submissionId: string;
  reviewerId: string;
  rubricId: string;
  dueDate: Date;
}

export interface SubmitPeerReviewInput {
  assignmentId: string;
  reviewerId: string;
  scores: CriterionScore[];
  overallFeedback: string;
  strengths?: string;
  areasForImprovement?: string;
  suggestions?: string;
  confidence?: PeerConfidenceLevel;
  timeSpent?: number;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  type?: ProjectType;
  visibility?: GroupVisibility;
  members: Omit<ProjectMember, 'contribution' | 'joinedAt' | 'status'>[];
  startDate: Date;
  targetEndDate?: Date;
  milestones?: Omit<ProjectMilestone, 'id' | 'status' | 'completedAt' | 'review'>[];
  tags?: string[];
  courseId?: string;
  groupId?: string;
  createdBy: string;
}

export interface CreateProjectTaskInput {
  projectId: string;
  title: string;
  description?: string;
  assignees?: string[];
  priority?: TaskPriority;
  milestoneId?: string;
  dependencies?: string[];
  estimatedHours?: number;
  dueDate?: Date;
  createdBy: string;
}

// ============================================================================
// Result Types
// ============================================================================

export interface PeerMatchResult {
  matches: PeerMatch[];
  totalCandidates: number;
  matchingTime: number;
  criteria: PeerMatchCriteria;
}

export interface GroupSearchResult {
  groups: StudyGroup[];
  totalCount: number;
  hasMore: boolean;
}

export interface DiscussionSearchResult {
  threads: DiscussionThread[];
  totalCount: number;
  hasMore: boolean;
}

export interface MentorSearchResult {
  mentors: MentorProfile[];
  totalCount: number;
  hasMore: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  change: number; // rank change from previous period
  badges: PeerBadge[];
}

export interface PeerLearningAnalytics {
  period: PeerDateRange;
  activeUsers: number;
  newProfiles: number;
  matchesMade: number;
  groupsCreated: number;
  sessionsCompleted: number;
  totalStudyHours: number;
  discussionPosts: number;
  reviewsCompleted: number;
  mentorshipsStarted: number;
  projectsCompleted: number;
  averageSatisfaction: number;
  topSubjects: SubjectActivity[];
  engagementTrend: TrendDataPoint[];
}

export interface SubjectActivity {
  subject: string;
  activeUsers: number;
  sessions: number;
  studyHours: number;
}

export interface TrendDataPoint {
  date: Date;
  value: number;
}
