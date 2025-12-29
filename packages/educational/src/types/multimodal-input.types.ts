/**
 * SAM AI Educational Package - Multimodal Input Types
 *
 * Types for processing images, voice recordings, and handwriting
 * for educational assessments.
 */

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

/**
 * Types of multimodal input supported
 */
export type MultimodalInputType =
  | 'IMAGE'
  | 'VOICE'
  | 'HANDWRITING'
  | 'VIDEO'
  | 'DIAGRAM'
  | 'EQUATION'
  | 'CODE_SCREENSHOT'
  | 'DOCUMENT_SCAN';

/**
 * Processing status for multimodal inputs
 */
export type MultimodalProcessingStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REQUIRES_REVIEW'
  | 'PARTIALLY_PROCESSED';

/**
 * Quality level of processed input
 */
export type MultimodalQualityLevel =
  | 'EXCELLENT'
  | 'GOOD'
  | 'ACCEPTABLE'
  | 'POOR'
  | 'UNREADABLE';

/**
 * Language support for voice/text recognition
 */
export type MultimodalLanguage =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'hi'
  | 'pt'
  | 'ru'
  | 'it'
  | 'other';

/**
 * Types of image content for classification
 */
export type ImageContentType =
  | 'DIAGRAM'
  | 'CHART'
  | 'GRAPH'
  | 'PHOTOGRAPH'
  | 'SCREENSHOT'
  | 'HANDWRITTEN_TEXT'
  | 'PRINTED_TEXT'
  | 'EQUATION'
  | 'MAP'
  | 'ILLUSTRATION'
  | 'TABLE'
  | 'CODE'
  | 'MIXED'
  | 'UNKNOWN';

/**
 * Types of voice content
 */
export type VoiceContentType =
  | 'SPEECH'
  | 'LECTURE'
  | 'READING'
  | 'QUESTION_ANSWER'
  | 'DISCUSSION'
  | 'PRESENTATION'
  | 'DICTATION'
  | 'FOREIGN_LANGUAGE'
  | 'MUSIC'
  | 'OTHER';

/**
 * Types of handwriting
 */
export type HandwritingType =
  | 'CURSIVE'
  | 'PRINT'
  | 'MIXED'
  | 'SHORTHAND'
  | 'CALLIGRAPHY'
  | 'SYMBOLS'
  | 'EQUATIONS'
  | 'DIAGRAMS';

/**
 * Assessment context for multimodal input
 */
export type MultimodalAssessmentContext =
  | 'EXAM'
  | 'HOMEWORK'
  | 'PRACTICE'
  | 'PROJECT'
  | 'LAB_REPORT'
  | 'ESSAY'
  | 'PRESENTATION'
  | 'QUIZ'
  | 'PORTFOLIO'
  | 'SELF_ASSESSMENT';

/**
 * Accessibility requirements
 */
export type AccessibilityRequirement =
  | 'SCREEN_READER'
  | 'HIGH_CONTRAST'
  | 'LARGE_TEXT'
  | 'AUDIO_DESCRIPTION'
  | 'CAPTIONS'
  | 'SIGN_LANGUAGE'
  | 'SIMPLIFIED_INTERFACE'
  | 'KEYBOARD_ONLY';

// =============================================================================
// CORE INTERFACES
// =============================================================================

/**
 * Configuration for multimodal processing
 */
export interface MultimodalConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Allowed file formats */
  allowedFormats: string[];
  /** Enable OCR for images */
  enableOCR: boolean;
  /** Enable speech-to-text */
  enableSpeechToText: boolean;
  /** Enable handwriting recognition */
  enableHandwritingRecognition: boolean;
  /** Default language for processing */
  defaultLanguage: MultimodalLanguage;
  /** Quality threshold for acceptance */
  qualityThreshold: number;
  /** Enable AI-powered analysis */
  enableAIAnalysis: boolean;
  /** Processing timeout in seconds */
  processingTimeout: number;
  /** Accessibility options */
  accessibility: AccessibilityOptions;
  /** Storage configuration */
  storage: StorageConfig;
}

/**
 * Accessibility options for multimodal content
 */
export interface AccessibilityOptions {
  /** Generate alt text for images */
  generateAltText: boolean;
  /** Generate captions for audio/video */
  generateCaptions: boolean;
  /** Enable text-to-speech output */
  enableTextToSpeech: boolean;
  /** High contrast mode */
  highContrastMode: boolean;
  /** Required accessibility features */
  requirements: AccessibilityRequirement[];
}

/**
 * Storage configuration for multimodal files
 */
export interface StorageConfig {
  /** Storage provider */
  provider: 'local' | 's3' | 'gcs' | 'azure' | 'cloudinary';
  /** Bucket or container name */
  bucket?: string;
  /** Path prefix */
  pathPrefix: string;
  /** Enable CDN */
  enableCDN: boolean;
  /** Retention period in days */
  retentionDays: number;
  /** Enable encryption */
  enableEncryption: boolean;
}

/**
 * Base multimodal input submission
 */
export interface MultimodalInput {
  /** Unique identifier */
  id: string;
  /** User who submitted the input */
  userId: string;
  /** Type of input */
  type: MultimodalInputType;
  /** Original file name */
  fileName: string;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Storage URL or path */
  fileUrl: string;
  /** Processing status */
  status: MultimodalProcessingStatus;
  /** Assessment context */
  context?: MultimodalAssessmentContext;
  /** Associated course/assignment */
  courseId?: string;
  assignmentId?: string;
  questionId?: string;
  /** Metadata */
  metadata: MultimodalMetadata;
  /** Processing results */
  processingResult?: MultimodalProcessingResult;
  /** Quality assessment */
  quality?: MultimodalQualityAssessment;
  /** Timestamps */
  createdAt: Date;
  processedAt?: Date;
  expiresAt?: Date;
}

/**
 * Metadata for multimodal input
 */
export interface MultimodalMetadata {
  /** Original dimensions for images/video */
  width?: number;
  height?: number;
  /** Duration for audio/video in seconds */
  duration?: number;
  /** Detected language */
  language?: MultimodalLanguage;
  /** Device/source information */
  deviceInfo?: DeviceInfo;
  /** Geolocation if available */
  location?: GeolocationData;
  /** Custom metadata */
  custom?: Record<string, unknown>;
  /** Tags for organization */
  tags?: string[];
}

/**
 * Device information
 */
export interface DeviceInfo {
  /** Device type */
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  /** Operating system */
  os?: string;
  /** Browser or app */
  browser?: string;
  /** Camera/microphone info */
  captureDevice?: string;
}

/**
 * Geolocation data
 */
export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

/**
 * Processing result for multimodal input
 */
export interface MultimodalProcessingResult {
  /** Whether processing succeeded */
  success: boolean;
  /** Processing duration in ms */
  processingTime: number;
  /** Extracted text content */
  extractedText?: ExtractedText;
  /** Image analysis results */
  imageAnalysis?: ImageAnalysisResult;
  /** Voice/audio analysis results */
  voiceAnalysis?: VoiceAnalysisResult;
  /** Handwriting analysis results */
  handwritingAnalysis?: HandwritingAnalysisResult;
  /** AI-generated insights */
  aiInsights?: AIInsights;
  /** Errors if any */
  errors?: ProcessingError[];
  /** Warnings */
  warnings?: string[];
}

/**
 * Extracted text from any input
 */
export interface ExtractedText {
  /** Full extracted text */
  fullText: string;
  /** Text segments with position info */
  segments: TextSegment[];
  /** Detected language */
  language: MultimodalLanguage;
  /** Confidence score 0-1 */
  confidence: number;
  /** Word count */
  wordCount: number;
  /** Character count */
  characterCount: number;
}

/**
 * Text segment with position information
 */
export interface TextSegment {
  /** Segment text */
  text: string;
  /** Position in document/image */
  boundingBox?: BoundingBox;
  /** Timestamp for audio/video */
  timestamp?: TimeRange;
  /** Confidence score */
  confidence: number;
  /** Speaker ID for audio */
  speakerId?: string;
  /** Detected language for this segment */
  language?: MultimodalLanguage;
}

/**
 * Bounding box for spatial positioning
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rotation angle in degrees */
  rotation?: number;
}

/**
 * Time range for temporal positioning
 */
export interface TimeRange {
  start: number; // seconds
  end: number;
}

/**
 * Processing error details
 */
export interface ProcessingError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: 'warning' | 'error' | 'fatal';
  /** Component that generated the error */
  component: string;
  /** Additional context */
  details?: Record<string, unknown>;
}

// =============================================================================
// IMAGE PROCESSING
// =============================================================================

/**
 * Image analysis result
 */
export interface ImageAnalysisResult {
  /** Content type classification */
  contentType: ImageContentType;
  /** Detected objects */
  objects: DetectedObject[];
  /** Text regions (OCR) */
  textRegions: TextRegion[];
  /** Diagram/chart analysis */
  diagramAnalysis?: DiagramAnalysis;
  /** Equation detection */
  equations?: DetectedEquation[];
  /** Color analysis */
  colorAnalysis: ColorAnalysis;
  /** Quality metrics */
  qualityMetrics: ImageQualityMetrics;
  /** Educational content detection */
  educationalContent?: EducationalContentDetection;
  /** Potential issues or concerns */
  concerns?: ImageConcern[];
}

/**
 * Detected object in image
 */
export interface DetectedObject {
  /** Object label */
  label: string;
  /** Confidence score */
  confidence: number;
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Object category */
  category?: string;
  /** Attributes */
  attributes?: Record<string, string>;
}

/**
 * Text region detected in image
 */
export interface TextRegion {
  /** Detected text */
  text: string;
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Text type */
  type: 'printed' | 'handwritten' | 'mixed';
  /** Confidence score */
  confidence: number;
  /** Font/style info */
  fontInfo?: FontInfo;
  /** Reading order */
  readingOrder: number;
}

/**
 * Font information
 */
export interface FontInfo {
  /** Font family if detected */
  family?: string;
  /** Font size estimate */
  size?: number;
  /** Text style */
  style: 'normal' | 'bold' | 'italic' | 'bold-italic';
  /** Text color */
  color?: string;
}

/**
 * Diagram analysis result
 */
export interface DiagramAnalysis {
  /** Diagram type */
  type: DiagramType;
  /** Detected components */
  components: DiagramComponent[];
  /** Detected connections/relationships */
  connections: DiagramConnection[];
  /** Labels and text in diagram */
  labels: string[];
  /** Structural analysis */
  structure: DiagramStructure;
  /** Subject area detection */
  subjectArea?: string;
}

/**
 * Types of diagrams
 */
export type DiagramType =
  | 'FLOWCHART'
  | 'UML'
  | 'ER_DIAGRAM'
  | 'NETWORK'
  | 'ORGANIZATIONAL'
  | 'VENN'
  | 'TREE'
  | 'MIND_MAP'
  | 'SEQUENCE'
  | 'STATE'
  | 'CIRCUIT'
  | 'CHEMISTRY'
  | 'BIOLOGY'
  | 'PHYSICS'
  | 'MATH'
  | 'GEOGRAPHIC'
  | 'OTHER';

/**
 * Diagram component
 */
export interface DiagramComponent {
  /** Component ID */
  id: string;
  /** Component type */
  type: string;
  /** Component label */
  label?: string;
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Shape type */
  shape?: string;
  /** Properties */
  properties?: Record<string, unknown>;
}

/**
 * Connection between diagram components
 */
export interface DiagramConnection {
  /** Source component ID */
  sourceId: string;
  /** Target component ID */
  targetId: string;
  /** Connection type */
  type: 'directional' | 'bidirectional' | 'undirected';
  /** Label on connection */
  label?: string;
  /** Line style */
  style?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Diagram structure analysis
 */
export interface DiagramStructure {
  /** Hierarchy levels */
  hierarchyLevels: number;
  /** Component count */
  componentCount: number;
  /** Connection count */
  connectionCount: number;
  /** Symmetry score */
  symmetryScore: number;
  /** Completeness score */
  completenessScore: number;
}

/**
 * Detected equation in image
 */
export interface DetectedEquation {
  /** LaTeX representation */
  latex: string;
  /** MathML representation */
  mathml?: string;
  /** Plain text representation */
  plainText: string;
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Confidence score */
  confidence: number;
  /** Equation type */
  type: EquationType;
  /** Variables detected */
  variables?: string[];
  /** Operators used */
  operators?: string[];
}

/**
 * Types of equations
 */
export type EquationType =
  | 'ALGEBRAIC'
  | 'CALCULUS'
  | 'DIFFERENTIAL'
  | 'TRIGONOMETRIC'
  | 'STATISTICAL'
  | 'MATRIX'
  | 'SET_THEORY'
  | 'LOGIC'
  | 'CHEMICAL'
  | 'PHYSICS'
  | 'OTHER';

/**
 * Color analysis result
 */
export interface ColorAnalysis {
  /** Dominant colors */
  dominantColors: ColorInfo[];
  /** Color palette */
  palette: string[];
  /** Average brightness */
  brightness: number;
  /** Contrast ratio */
  contrastRatio: number;
  /** Is grayscale */
  isGrayscale: boolean;
}

/**
 * Color information
 */
export interface ColorInfo {
  /** Hex color code */
  hex: string;
  /** RGB values */
  rgb: { r: number; g: number; b: number };
  /** Percentage of image */
  percentage: number;
  /** Color name */
  name?: string;
}

/**
 * Image quality metrics
 */
export interface ImageQualityMetrics {
  /** Overall quality score 0-100 */
  overallScore: number;
  /** Sharpness score */
  sharpness: number;
  /** Noise level */
  noiseLevel: number;
  /** Exposure quality */
  exposure: 'underexposed' | 'normal' | 'overexposed';
  /** Resolution assessment */
  resolution: 'low' | 'medium' | 'high';
  /** Issues detected */
  issues: ImageQualityIssue[];
}

/**
 * Image quality issue
 */
export interface ImageQualityIssue {
  /** Issue type */
  type: 'blur' | 'noise' | 'lighting' | 'rotation' | 'cropping' | 'resolution';
  /** Severity */
  severity: 'minor' | 'moderate' | 'severe';
  /** Description */
  description: string;
  /** Suggested fix */
  suggestedFix?: string;
}

/**
 * Educational content detection
 */
export interface EducationalContentDetection {
  /** Subject area */
  subject?: string;
  /** Topic */
  topic?: string;
  /** Grade level estimate */
  gradeLevel?: string;
  /** Educational elements */
  elements: EducationalElement[];
  /** Alignment with standards */
  standardsAlignment?: StandardAlignment[];
}

/**
 * Educational element in content
 */
export interface EducationalElement {
  /** Element type */
  type: 'concept' | 'formula' | 'definition' | 'example' | 'diagram' | 'problem';
  /** Element content */
  content: string;
  /** Location */
  boundingBox?: BoundingBox;
  /** Related concepts */
  relatedConcepts?: string[];
}

/**
 * Standards alignment
 */
export interface StandardAlignment {
  /** Standard code */
  code: string;
  /** Standard description */
  description: string;
  /** Confidence */
  confidence: number;
}

/**
 * Image concern flags
 */
export interface ImageConcern {
  /** Concern type */
  type: 'inappropriate' | 'cheating' | 'plagiarism' | 'quality' | 'integrity';
  /** Confidence */
  confidence: number;
  /** Description */
  description: string;
  /** Recommended action */
  recommendedAction: string;
}

// =============================================================================
// VOICE/AUDIO PROCESSING
// =============================================================================

/**
 * Voice analysis result
 */
export interface VoiceAnalysisResult {
  /** Speech-to-text transcription */
  transcription: VoiceTranscription;
  /** Content type */
  contentType: VoiceContentType;
  /** Speaker analysis */
  speakerAnalysis: SpeakerAnalysis;
  /** Audio quality metrics */
  audioQuality: AudioQualityMetrics;
  /** Language detection */
  languageDetection: LanguageDetection;
  /** Speech metrics */
  speechMetrics: SpeechMetrics;
  /** Pronunciation analysis */
  pronunciationAnalysis?: PronunciationAnalysis;
  /** Fluency assessment */
  fluencyAssessment?: FluencyAssessment;
  /** Sentiment analysis */
  sentimentAnalysis?: VoiceSentimentAnalysis;
  /** Keywords and topics */
  keywordsAndTopics: KeywordsAndTopics;
}

/**
 * Voice transcription
 */
export interface VoiceTranscription {
  /** Full transcription text */
  text: string;
  /** Word-level transcription */
  words: TranscribedWord[];
  /** Sentence-level segments */
  sentences: TranscribedSentence[];
  /** Overall confidence */
  confidence: number;
  /** Detected language */
  language: MultimodalLanguage;
  /** Alternative transcriptions */
  alternatives?: string[];
}

/**
 * Transcribed word with timing
 */
export interface TranscribedWord {
  /** Word text */
  word: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Confidence score */
  confidence: number;
  /** Speaker ID */
  speakerId?: string;
  /** Is filler word */
  isFiller?: boolean;
}

/**
 * Transcribed sentence
 */
export interface TranscribedSentence {
  /** Sentence text */
  text: string;
  /** Start time */
  startTime: number;
  /** End time */
  endTime: number;
  /** Confidence */
  confidence: number;
  /** Speaker ID */
  speakerId?: string;
  /** Punctuation added */
  punctuated: boolean;
}

/**
 * Speaker analysis for multi-speaker audio
 */
export interface SpeakerAnalysis {
  /** Number of speakers detected */
  speakerCount: number;
  /** Speaker details */
  speakers: SpeakerInfo[];
  /** Speaker segments */
  segments: SpeakerSegment[];
}

/**
 * Speaker information
 */
export interface SpeakerInfo {
  /** Speaker ID */
  id: string;
  /** Speaker label */
  label: string;
  /** Total speaking time */
  speakingTime: number;
  /** Word count */
  wordCount: number;
  /** Voice characteristics */
  voiceCharacteristics?: VoiceCharacteristics;
}

/**
 * Voice characteristics
 */
export interface VoiceCharacteristics {
  /** Pitch range */
  pitchRange: { min: number; max: number; average: number };
  /** Speaking rate (words per minute) */
  speakingRate: number;
  /** Volume level */
  volumeLevel: 'soft' | 'normal' | 'loud';
  /** Voice quality */
  voiceQuality: 'clear' | 'hoarse' | 'nasal' | 'breathy';
}

/**
 * Speaker segment
 */
export interface SpeakerSegment {
  /** Speaker ID */
  speakerId: string;
  /** Start time */
  startTime: number;
  /** End time */
  endTime: number;
  /** Transcribed text */
  text: string;
}

/**
 * Audio quality metrics
 */
export interface AudioQualityMetrics {
  /** Overall quality score 0-100 */
  overallScore: number;
  /** Signal-to-noise ratio in dB */
  signalToNoiseRatio: number;
  /** Background noise level */
  backgroundNoiseLevel: 'none' | 'low' | 'moderate' | 'high';
  /** Audio clarity */
  clarity: 'clear' | 'slightly_muffled' | 'muffled' | 'unclear';
  /** Sample rate */
  sampleRate: number;
  /** Bit depth */
  bitDepth: number;
  /** Issues detected */
  issues: AudioQualityIssue[];
}

/**
 * Audio quality issue
 */
export interface AudioQualityIssue {
  /** Issue type */
  type: 'noise' | 'distortion' | 'clipping' | 'echo' | 'silence' | 'low_volume';
  /** Time range */
  timeRange?: TimeRange;
  /** Severity */
  severity: 'minor' | 'moderate' | 'severe';
  /** Description */
  description: string;
}

/**
 * Language detection result
 */
export interface LanguageDetection {
  /** Primary language */
  primaryLanguage: MultimodalLanguage;
  /** Primary language confidence */
  primaryConfidence: number;
  /** Other detected languages */
  otherLanguages: { language: MultimodalLanguage; confidence: number }[];
  /** Is multilingual */
  isMultilingual: boolean;
}

/**
 * Speech metrics
 */
export interface SpeechMetrics {
  /** Total duration in seconds */
  totalDuration: number;
  /** Speech duration (excluding silence) */
  speechDuration: number;
  /** Silence duration */
  silenceDuration: number;
  /** Words per minute */
  wordsPerMinute: number;
  /** Syllables per minute */
  syllablesPerMinute?: number;
  /** Pause analysis */
  pauseAnalysis: PauseAnalysis;
  /** Filler word count */
  fillerWordCount: number;
  /** Unique word count */
  uniqueWordCount: number;
  /** Vocabulary richness (type-token ratio) */
  vocabularyRichness: number;
}

/**
 * Pause analysis
 */
export interface PauseAnalysis {
  /** Total pauses */
  totalPauses: number;
  /** Average pause duration */
  averagePauseDuration: number;
  /** Longest pause */
  longestPause: { duration: number; timestamp: number };
  /** Pause frequency (pauses per minute) */
  pauseFrequency: number;
}

/**
 * Pronunciation analysis
 */
export interface PronunciationAnalysis {
  /** Overall pronunciation score 0-100 */
  overallScore: number;
  /** Word-level pronunciations */
  wordPronunciations: WordPronunciation[];
  /** Phoneme accuracy */
  phonemeAccuracy: PhonemeAccuracy;
  /** Common errors */
  commonErrors: PronunciationError[];
  /** Improvement suggestions */
  suggestions: string[];
}

/**
 * Word pronunciation assessment
 */
export interface WordPronunciation {
  /** Word */
  word: string;
  /** Pronunciation score */
  score: number;
  /** Expected phonemes */
  expectedPhonemes: string;
  /** Actual phonemes */
  actualPhonemes: string;
  /** Issues */
  issues?: string[];
  /** Timestamp */
  timestamp: number;
}

/**
 * Phoneme accuracy
 */
export interface PhonemeAccuracy {
  /** Overall accuracy */
  overall: number;
  /** Vowel accuracy */
  vowels: number;
  /** Consonant accuracy */
  consonants: number;
  /** Stress accuracy */
  stress: number;
  /** Intonation accuracy */
  intonation: number;
}

/**
 * Pronunciation error
 */
export interface PronunciationError {
  /** Error type */
  type: 'substitution' | 'omission' | 'insertion' | 'stress' | 'intonation';
  /** Phoneme or word affected */
  affected: string;
  /** Frequency */
  frequency: number;
  /** Examples */
  examples: string[];
}

/**
 * Fluency assessment
 */
export interface FluencyAssessment {
  /** Overall fluency score 0-100 */
  overallScore: number;
  /** Speaking rate assessment */
  speakingRate: 'too_slow' | 'appropriate' | 'too_fast';
  /** Rhythm assessment */
  rhythm: 'choppy' | 'somewhat_smooth' | 'smooth';
  /** Hesitation frequency */
  hesitationFrequency: 'frequent' | 'occasional' | 'rare';
  /** Self-corrections */
  selfCorrections: number;
  /** Repetitions */
  repetitions: number;
  /** Incomplete sentences */
  incompleteSentences: number;
}

/**
 * Voice sentiment analysis
 */
export interface VoiceSentimentAnalysis {
  /** Overall sentiment */
  overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  /** Sentiment score -1 to 1 */
  sentimentScore: number;
  /** Emotion detection */
  emotions: DetectedEmotion[];
  /** Confidence level */
  confidence: number;
  /** Sentiment over time */
  timeline?: SentimentTimeline[];
}

/**
 * Detected emotion
 */
export interface DetectedEmotion {
  /** Emotion type */
  type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral' | 'confident' | 'uncertain';
  /** Intensity 0-1 */
  intensity: number;
  /** Confidence */
  confidence: number;
}

/**
 * Sentiment timeline
 */
export interface SentimentTimeline {
  /** Time in seconds */
  time: number;
  /** Sentiment score */
  sentiment: number;
  /** Dominant emotion */
  emotion?: string;
}

/**
 * Keywords and topics extraction
 */
export interface KeywordsAndTopics {
  /** Extracted keywords */
  keywords: ExtractedKeyword[];
  /** Detected topics */
  topics: DetectedTopic[];
  /** Named entities */
  namedEntities: NamedEntity[];
  /** Key phrases */
  keyPhrases: string[];
}

/**
 * Extracted keyword
 */
export interface ExtractedKeyword {
  /** Keyword */
  keyword: string;
  /** Relevance score */
  relevance: number;
  /** Frequency */
  frequency: number;
  /** First occurrence timestamp */
  firstOccurrence?: number;
}

/**
 * Detected topic
 */
export interface DetectedTopic {
  /** Topic name */
  name: string;
  /** Confidence */
  confidence: number;
  /** Related keywords */
  relatedKeywords: string[];
  /** Time ranges */
  timeRanges?: TimeRange[];
}

/**
 * Named entity
 */
export interface NamedEntity {
  /** Entity text */
  text: string;
  /** Entity type */
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'NUMBER' | 'CONCEPT' | 'TERM' | 'OTHER';
  /** Confidence */
  confidence: number;
  /** Occurrences */
  occurrences: number;
}

// =============================================================================
// HANDWRITING PROCESSING
// =============================================================================

/**
 * Handwriting analysis result
 */
export interface HandwritingAnalysisResult {
  /** Recognized text */
  recognizedText: HandwritingRecognition;
  /** Handwriting type */
  handwritingType: HandwritingType;
  /** Writing quality assessment */
  writingQuality: WritingQualityAssessment;
  /** Character-level analysis */
  characterAnalysis: CharacterAnalysis;
  /** Line analysis */
  lineAnalysis: LineAnalysis;
  /** Detected elements */
  detectedElements: HandwritingElements;
  /** Writer profile estimation */
  writerProfile?: WriterProfile;
  /** Educational assessment */
  educationalAssessment?: HandwritingEducationalAssessment;
}

/**
 * Handwriting recognition result
 */
export interface HandwritingRecognition {
  /** Full recognized text */
  text: string;
  /** Line-by-line text */
  lines: RecognizedLine[];
  /** Word-level recognition */
  words: RecognizedWord[];
  /** Overall confidence */
  confidence: number;
  /** Alternative interpretations */
  alternatives?: string[];
  /** Uncertain regions */
  uncertainRegions: UncertainRegion[];
}

/**
 * Recognized line
 */
export interface RecognizedLine {
  /** Line number */
  lineNumber: number;
  /** Recognized text */
  text: string;
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Confidence */
  confidence: number;
  /** Line angle (degrees) */
  angle: number;
}

/**
 * Recognized word
 */
export interface RecognizedWord {
  /** Word text */
  text: string;
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Confidence */
  confidence: number;
  /** Alternative readings */
  alternatives?: string[];
  /** Stroke count */
  strokeCount?: number;
}

/**
 * Uncertain region in handwriting
 */
export interface UncertainRegion {
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Possible interpretations */
  possibleTexts: { text: string; confidence: number }[];
  /** Reason for uncertainty */
  reason: 'illegible' | 'overlapping' | 'incomplete' | 'unusual_style';
}

/**
 * Writing quality assessment
 */
export interface WritingQualityAssessment {
  /** Overall quality score 0-100 */
  overallScore: number;
  /** Legibility score */
  legibility: number;
  /** Consistency score */
  consistency: number;
  /** Neatness score */
  neatness: number;
  /** Spacing quality */
  spacing: SpacingQuality;
  /** Alignment quality */
  alignment: AlignmentQuality;
  /** Size consistency */
  sizeConsistency: number;
  /** Slant consistency */
  slantConsistency: number;
  /** Issues identified */
  issues: WritingQualityIssue[];
  /** Strengths */
  strengths: string[];
  /** Improvement suggestions */
  suggestions: string[];
}

/**
 * Spacing quality assessment
 */
export interface SpacingQuality {
  /** Letter spacing */
  letterSpacing: 'too_tight' | 'appropriate' | 'too_wide' | 'inconsistent';
  /** Word spacing */
  wordSpacing: 'too_tight' | 'appropriate' | 'too_wide' | 'inconsistent';
  /** Line spacing */
  lineSpacing: 'too_tight' | 'appropriate' | 'too_wide' | 'inconsistent';
  /** Overall spacing score */
  score: number;
}

/**
 * Alignment quality assessment
 */
export interface AlignmentQuality {
  /** Baseline alignment */
  baselineAlignment: 'poor' | 'moderate' | 'good' | 'excellent';
  /** Left margin alignment */
  leftMargin: 'poor' | 'moderate' | 'good' | 'excellent';
  /** Right margin alignment */
  rightMargin: 'poor' | 'moderate' | 'good' | 'excellent';
  /** Overall alignment score */
  score: number;
}

/**
 * Writing quality issue
 */
export interface WritingQualityIssue {
  /** Issue type */
  type: 'legibility' | 'spacing' | 'alignment' | 'size' | 'slant' | 'formation';
  /** Severity */
  severity: 'minor' | 'moderate' | 'severe';
  /** Description */
  description: string;
  /** Affected regions */
  affectedRegions?: BoundingBox[];
  /** Examples */
  examples?: string[];
}

/**
 * Character-level analysis
 */
export interface CharacterAnalysis {
  /** Total characters */
  totalCharacters: number;
  /** Character accuracy */
  accuracy: number;
  /** Problem characters */
  problemCharacters: ProblemCharacter[];
  /** Character formation patterns */
  formationPatterns: CharacterFormation[];
  /** Most consistent characters */
  consistentCharacters: string[];
  /** Least consistent characters */
  inconsistentCharacters: string[];
}

/**
 * Problem character analysis
 */
export interface ProblemCharacter {
  /** Character */
  character: string;
  /** Frequency of issues */
  issueFrequency: number;
  /** Issue types */
  issues: string[];
  /** Examples (bounding boxes) */
  examples: BoundingBox[];
  /** Suggestion */
  suggestion?: string;
}

/**
 * Character formation pattern
 */
export interface CharacterFormation {
  /** Character */
  character: string;
  /** Average width */
  avgWidth: number;
  /** Average height */
  avgHeight: number;
  /** Average slant */
  avgSlant: number;
  /** Consistency score */
  consistency: number;
  /** Stroke patterns */
  strokePatterns?: string[];
}

/**
 * Line analysis
 */
export interface LineAnalysis {
  /** Total lines */
  totalLines: number;
  /** Average line height */
  avgLineHeight: number;
  /** Average line spacing */
  avgLineSpacing: number;
  /** Line slope analysis */
  lineSlopes: LineSlope[];
  /** Line straightness score */
  straightnessScore: number;
  /** Line consistency score */
  consistencyScore: number;
}

/**
 * Line slope data
 */
export interface LineSlope {
  /** Line number */
  lineNumber: number;
  /** Slope angle in degrees */
  angle: number;
  /** Start Y position */
  startY: number;
  /** End Y position */
  endY: number;
}

/**
 * Handwriting elements detected
 */
export interface HandwritingElements {
  /** Text elements */
  textElements: TextElement[];
  /** Mathematical elements */
  mathElements: MathElement[];
  /** Diagram/drawing elements */
  diagramElements: DiagramElement[];
  /** Corrections/strikethroughs */
  corrections: CorrectionElement[];
  /** Annotations */
  annotations: AnnotationElement[];
}

/**
 * Text element
 */
export interface TextElement {
  /** Element type */
  type: 'paragraph' | 'list' | 'heading' | 'note' | 'label';
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Text content */
  content: string;
  /** Confidence */
  confidence: number;
}

/**
 * Mathematical element
 */
export interface MathElement {
  /** Element type */
  type: 'equation' | 'expression' | 'number' | 'symbol' | 'graph';
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Content (LaTeX or plain text) */
  content: string;
  /** LaTeX representation */
  latex?: string;
  /** Confidence */
  confidence: number;
}

/**
 * Diagram element
 */
export interface DiagramElement {
  /** Element type */
  type: 'shape' | 'arrow' | 'line' | 'curve' | 'freeform';
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Description */
  description?: string;
  /** Connected elements */
  connectedTo?: string[];
}

/**
 * Correction element (strikethrough, etc.)
 */
export interface CorrectionElement {
  /** Correction type */
  type: 'strikethrough' | 'scribble' | 'overwrite' | 'insertion' | 'deletion';
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Original text (if detectable) */
  originalText?: string;
  /** New text (if applicable) */
  newText?: string;
}

/**
 * Annotation element
 */
export interface AnnotationElement {
  /** Annotation type */
  type: 'underline' | 'highlight' | 'circle' | 'arrow' | 'bracket' | 'asterisk' | 'other';
  /** Bounding box */
  boundingBox: BoundingBox;
  /** Related text */
  relatedText?: string;
  /** Color if detectable */
  color?: string;
}

/**
 * Writer profile estimation
 */
export interface WriterProfile {
  /** Estimated age range */
  estimatedAgeRange?: string;
  /** Estimated proficiency level */
  proficiencyLevel: 'beginner' | 'developing' | 'proficient' | 'advanced';
  /** Handedness estimation */
  handedness?: 'left' | 'right' | 'unclear';
  /** Writing style characteristics */
  styleCharacteristics: string[];
  /** Consistency indicators */
  consistencyLevel: 'low' | 'moderate' | 'high';
  /** Fatigue indicators */
  fatigueIndicators?: FatigueIndicator[];
  /** Confidence in profile */
  confidence: number;
}

/**
 * Fatigue indicator
 */
export interface FatigueIndicator {
  /** Indicator type */
  type: 'size_change' | 'slant_change' | 'legibility_decrease' | 'spacing_change';
  /** Location in document */
  location: 'beginning' | 'middle' | 'end';
  /** Severity */
  severity: 'slight' | 'moderate' | 'significant';
}

/**
 * Handwriting educational assessment
 */
export interface HandwritingEducationalAssessment {
  /** Grade level appropriateness */
  gradeLevelAppropriate: boolean;
  /** Estimated grade level */
  estimatedGradeLevel?: string;
  /** Developmental stage */
  developmentalStage: 'pre_writing' | 'emergent' | 'developing' | 'fluent' | 'mature';
  /** Skills assessment */
  skillsAssessment: HandwritingSkillsAssessment;
  /** Recommendations */
  recommendations: HandwritingRecommendation[];
  /** Progress indicators */
  progressIndicators?: string[];
}

/**
 * Handwriting skills assessment
 */
export interface HandwritingSkillsAssessment {
  /** Letter formation */
  letterFormation: number;
  /** Letter sizing */
  letterSizing: number;
  /** Line adherence */
  lineAdherence: number;
  /** Spacing */
  spacing: number;
  /** Fluency */
  fluency: number;
  /** Speed */
  speed?: number;
  /** Overall score */
  overallScore: number;
}

/**
 * Handwriting recommendation
 */
export interface HandwritingRecommendation {
  /** Focus area */
  area: string;
  /** Recommendation */
  recommendation: string;
  /** Priority */
  priority: 'low' | 'medium' | 'high';
  /** Exercises */
  exercises?: string[];
}

// =============================================================================
// QUALITY ASSESSMENT
// =============================================================================

/**
 * Multimodal quality assessment
 */
export interface MultimodalQualityAssessment {
  /** Overall quality level */
  level: MultimodalQualityLevel;
  /** Overall score 0-100 */
  score: number;
  /** Usability for assessment */
  usableForAssessment: boolean;
  /** Issues that affect usability */
  usabilityIssues: UsabilityIssue[];
  /** Recommendations */
  recommendations: QualityRecommendation[];
  /** Automatic enhancements applied */
  enhancementsApplied?: string[];
}

/**
 * Usability issue
 */
export interface UsabilityIssue {
  /** Issue type */
  type: string;
  /** Severity */
  severity: 'minor' | 'moderate' | 'severe' | 'blocking';
  /** Description */
  description: string;
  /** Can be auto-fixed */
  canAutoFix: boolean;
}

/**
 * Quality recommendation
 */
export interface QualityRecommendation {
  /** Recommendation type */
  type: 'retake' | 'enhance' | 'manual_review' | 'accept';
  /** Description */
  description: string;
  /** Priority */
  priority: 'low' | 'medium' | 'high';
}

// =============================================================================
// AI INSIGHTS
// =============================================================================

/**
 * AI-generated insights
 */
export interface AIInsights {
  /** Content summary */
  summary: string;
  /** Key points */
  keyPoints: string[];
  /** Educational value assessment */
  educationalValue: EducationalValueAssessment;
  /** Suggested improvements */
  improvements: string[];
  /** Related concepts */
  relatedConcepts: string[];
  /** Difficulty level estimate */
  difficultyLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  /** Bloom's taxonomy level */
  bloomsLevel?: string;
  /** Misconception detection */
  possibleMisconceptions?: string[];
  /** Follow-up suggestions */
  followUpSuggestions?: string[];
}

/**
 * Educational value assessment
 */
export interface EducationalValueAssessment {
  /** Overall value score */
  score: number;
  /** Clarity of expression */
  clarity: number;
  /** Depth of understanding shown */
  depth: number;
  /** Accuracy of content */
  accuracy: number;
  /** Originality */
  originality: number;
  /** Critical thinking demonstrated */
  criticalThinking: number;
}

// =============================================================================
// INPUT/OUTPUT INTERFACES
// =============================================================================

/**
 * Input for processing multimodal content
 */
export interface ProcessMultimodalInput {
  /** File to process */
  file: MultimodalFile;
  /** Processing options */
  options: ProcessingOptions;
  /** User context */
  userId: string;
  /** Course/assignment context */
  courseId?: string;
  assignmentId?: string;
  questionId?: string;
  /** Expected content type hint */
  expectedType?: MultimodalInputType;
}

/**
 * Multimodal file for processing
 */
export interface MultimodalFile {
  /** File data (base64 or URL) */
  data: string;
  /** File name */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** File size */
  fileSize: number;
}

/**
 * Processing options
 */
export interface ProcessingOptions {
  /** Enable OCR */
  enableOCR?: boolean;
  /** Enable speech-to-text */
  enableSpeechToText?: boolean;
  /** Enable handwriting recognition */
  enableHandwritingRecognition?: boolean;
  /** Enable AI analysis */
  enableAIAnalysis?: boolean;
  /** Target language */
  language?: MultimodalLanguage;
  /** Quality threshold */
  qualityThreshold?: number;
  /** Custom processing hints */
  hints?: ProcessingHints;
}

/**
 * Processing hints
 */
export interface ProcessingHints {
  /** Subject area */
  subject?: string;
  /** Expected content */
  expectedContent?: string;
  /** Specific elements to look for */
  lookFor?: string[];
  /** Elements to ignore */
  ignore?: string[];
}

/**
 * Processing result output
 */
export interface ProcessMultimodalOutput {
  /** Success status */
  success: boolean;
  /** Processed input */
  input: MultimodalInput;
  /** Processing time */
  processingTime: number;
  /** Errors if any */
  errors?: ProcessingError[];
}

/**
 * Batch processing request
 */
export interface BatchProcessingRequest {
  /** Files to process */
  files: MultimodalFile[];
  /** Common options */
  options: ProcessingOptions;
  /** User context */
  userId: string;
  /** Course/assignment context */
  courseId?: string;
  assignmentId?: string;
}

/**
 * Batch processing result
 */
export interface BatchProcessingResult {
  /** Total files */
  totalFiles: number;
  /** Successfully processed */
  successCount: number;
  /** Failed */
  failedCount: number;
  /** Individual results */
  results: ProcessMultimodalOutput[];
  /** Total processing time */
  totalProcessingTime: number;
}

// =============================================================================
// ASSESSMENT INTEGRATION
// =============================================================================

/**
 * Multimodal assessment submission
 */
export interface MultimodalAssessmentSubmission {
  /** Submission ID */
  id: string;
  /** Student ID */
  studentId: string;
  /** Assessment ID */
  assessmentId: string;
  /** Question ID */
  questionId: string;
  /** Submitted inputs */
  inputs: MultimodalInput[];
  /** Combined extracted content */
  combinedContent: CombinedContent;
  /** AI assessment */
  aiAssessment?: AIAssessmentResult;
  /** Submission time */
  submittedAt: Date;
  /** Processing status */
  status: MultimodalProcessingStatus;
}

/**
 * Combined content from multiple inputs
 */
export interface CombinedContent {
  /** All text content */
  text: string;
  /** Text sources */
  textSources: { inputId: string; text: string; type: MultimodalInputType }[];
  /** All detected elements */
  elements: CombinedElement[];
  /** Word count */
  wordCount: number;
  /** Has equations */
  hasEquations: boolean;
  /** Has diagrams */
  hasDiagrams: boolean;
  /** Languages detected */
  languages: MultimodalLanguage[];
}

/**
 * Combined element from multiple inputs
 */
export interface CombinedElement {
  /** Element type */
  type: 'text' | 'equation' | 'diagram' | 'table' | 'code' | 'other';
  /** Content */
  content: string;
  /** Source input ID */
  sourceInputId: string;
  /** Order in submission */
  order: number;
}

/**
 * AI assessment result
 */
export interface AIAssessmentResult {
  /** Overall score */
  score: number;
  /** Score breakdown */
  breakdown: ScoreBreakdown[];
  /** Feedback */
  feedback: AssessmentFeedback;
  /** Detected concepts */
  conceptsCovered: string[];
  /** Missing concepts */
  missingConcepts: string[];
  /** Errors identified */
  errors: IdentifiedError[];
  /** Strengths */
  strengths: string[];
  /** Areas for improvement */
  areasForImprovement: string[];
  /** Suggested resources */
  suggestedResources?: SuggestedResource[];
  /** Confidence in assessment */
  confidence: number;
}

/**
 * Score breakdown
 */
export interface ScoreBreakdown {
  /** Criterion */
  criterion: string;
  /** Score */
  score: number;
  /** Max score */
  maxScore: number;
  /** Weight */
  weight: number;
  /** Comments */
  comments: string;
}

/**
 * Assessment feedback
 */
export interface AssessmentFeedback {
  /** Summary feedback */
  summary: string;
  /** Detailed feedback */
  detailed: string;
  /** Positive points */
  positives: string[];
  /** Points for improvement */
  improvements: string[];
  /** Next steps */
  nextSteps: string[];
}

/**
 * Identified error in submission
 */
export interface IdentifiedError {
  /** Error type */
  type: 'conceptual' | 'procedural' | 'factual' | 'formatting' | 'incomplete';
  /** Description */
  description: string;
  /** Location reference */
  location?: string;
  /** Severity */
  severity: 'minor' | 'moderate' | 'major';
  /** Correction */
  correction?: string;
}

/**
 * Suggested resource
 */
export interface SuggestedResource {
  /** Resource title */
  title: string;
  /** Resource type */
  type: 'video' | 'article' | 'practice' | 'tutorial' | 'other';
  /** URL or reference */
  reference: string;
  /** Relevance reason */
  reason: string;
}

// =============================================================================
// ENGINE INTERFACE
// =============================================================================

/**
 * Multimodal input engine interface
 */
export interface IMultimodalInputEngine {
  /** Process a single multimodal input */
  processInput(input: ProcessMultimodalInput): Promise<ProcessMultimodalOutput>;

  /** Process multiple inputs in batch */
  processBatch(request: BatchProcessingRequest): Promise<BatchProcessingResult>;

  /** Analyze image */
  analyzeImage(
    file: MultimodalFile,
    options?: Partial<ProcessingOptions>
  ): Promise<ImageAnalysisResult>;

  /** Analyze voice/audio */
  analyzeVoice(
    file: MultimodalFile,
    options?: Partial<ProcessingOptions>
  ): Promise<VoiceAnalysisResult>;

  /** Analyze handwriting */
  analyzeHandwriting(
    file: MultimodalFile,
    options?: Partial<ProcessingOptions>
  ): Promise<HandwritingAnalysisResult>;

  /** Extract text from any input */
  extractText(file: MultimodalFile): Promise<ExtractedText>;

  /** Generate accessibility content */
  generateAccessibilityContent(
    input: MultimodalInput
  ): Promise<AccessibilityContent>;

  /** Assess quality of input */
  assessQuality(file: MultimodalFile): Promise<MultimodalQualityAssessment>;

  /** Get AI insights */
  getAIInsights(
    input: MultimodalInput,
    context?: AssessmentContext
  ): Promise<AIInsights>;

  /** Create assessment submission */
  createAssessmentSubmission(
    studentId: string,
    assessmentId: string,
    questionId: string,
    inputs: MultimodalInput[]
  ): Promise<MultimodalAssessmentSubmission>;

  /** Grade submission with AI */
  gradeSubmission(
    submission: MultimodalAssessmentSubmission,
    rubric?: MultimodalGradingRubric
  ): Promise<AIAssessmentResult>;

  /** Validate input format */
  validateInput(file: MultimodalFile): Promise<ValidationResult>;

  /** Get processing status */
  getProcessingStatus(inputId: string): Promise<MultimodalProcessingStatus>;

  /** Cancel processing */
  cancelProcessing(inputId: string): Promise<boolean>;
}

/**
 * Accessibility content
 */
export interface AccessibilityContent {
  /** Alt text for images */
  altText?: string;
  /** Long description */
  longDescription?: string;
  /** Captions for audio/video */
  captions?: Caption[];
  /** Audio description */
  audioDescription?: string;
  /** Transcript */
  transcript?: string;
  /** Simplified version */
  simplifiedVersion?: string;
}

/**
 * Caption entry
 */
export interface Caption {
  /** Start time */
  startTime: number;
  /** End time */
  endTime: number;
  /** Text */
  text: string;
  /** Speaker ID */
  speakerId?: string;
}

/**
 * Assessment context
 */
export interface AssessmentContext {
  /** Subject */
  subject?: string;
  /** Topic */
  topic?: string;
  /** Learning objectives */
  learningObjectives?: string[];
  /** Expected concepts */
  expectedConcepts?: string[];
  /** Grade level */
  gradeLevel?: string;
  /** Additional context */
  additionalContext?: string;
}

/**
 * Grading rubric for multimodal assessments
 */
export interface MultimodalGradingRubric {
  /** Rubric ID */
  id: string;
  /** Criteria */
  criteria: MultimodalRubricCriterion[];
  /** Total points */
  totalPoints: number;
  /** Grading scale */
  gradingScale?: GradingScale;
}

/**
 * Rubric criterion for multimodal grading
 */
export interface MultimodalRubricCriterion {
  /** Criterion ID */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description: string;
  /** Max points */
  maxPoints: number;
  /** Weight */
  weight: number;
  /** Levels */
  levels: MultimodalRubricLevel[];
}

/**
 * Rubric level for multimodal grading
 */
export interface MultimodalRubricLevel {
  /** Level name */
  name: string;
  /** Points */
  points: number;
  /** Description */
  description: string;
}

/**
 * Grading scale
 */
export interface GradingScale {
  /** Scale type */
  type: 'percentage' | 'points' | 'letter' | 'pass_fail';
  /** Grade thresholds */
  thresholds: GradeThreshold[];
}

/**
 * Grade threshold
 */
export interface GradeThreshold {
  /** Grade name/letter */
  grade: string;
  /** Minimum score */
  minScore: number;
  /** Maximum score */
  maxScore: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  isValid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Warnings */
  warnings: string[];
  /** Suggested corrections */
  suggestions?: string[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Field */
  field?: string;
}

// =============================================================================
// STORAGE AND CACHING
// =============================================================================

/**
 * Cached processing result
 */
export interface CachedResult {
  /** Input hash */
  inputHash: string;
  /** Result */
  result: MultimodalProcessingResult;
  /** Cached at */
  cachedAt: Date;
  /** Expires at */
  expiresAt: Date;
  /** Hit count */
  hitCount: number;
}

/**
 * Storage quota
 */
export interface StorageQuota {
  /** User ID */
  userId: string;
  /** Total allowed bytes */
  totalAllowed: number;
  /** Used bytes */
  used: number;
  /** Files count */
  filesCount: number;
  /** Reset date */
  resetDate?: Date;
}

// =============================================================================
// EVENTS AND WEBHOOKS
// =============================================================================

/**
 * Multimodal processing event
 */
export interface MultimodalEvent {
  /** Event type */
  type: MultimodalEventType;
  /** Input ID */
  inputId: string;
  /** User ID */
  userId: string;
  /** Timestamp */
  timestamp: Date;
  /** Event data */
  data: Record<string, unknown>;
}

/**
 * Event types
 */
export type MultimodalEventType =
  | 'processing.started'
  | 'processing.completed'
  | 'processing.failed'
  | 'quality.assessed'
  | 'accessibility.generated'
  | 'assessment.graded'
  | 'file.uploaded'
  | 'file.deleted';

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;
  /** Events to subscribe */
  events: MultimodalEventType[];
  /** Secret for signing */
  secret?: string;
  /** Headers to include */
  headers?: Record<string, string>;
  /** Retry configuration */
  retryConfig?: RetryConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Max retries */
  maxRetries: number;
  /** Initial delay ms */
  initialDelay: number;
  /** Max delay ms */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}
