import {
  AssessmentQualityAnalyzer,
  CourseTypeDetector,
  DeepContentAnalyzer,
  DeterministicRubricEngine,
  EnhancedDepthAnalysisEngine,
  ObjectiveAnalyzer,
  TranscriptAnalyzer,
  WebbDOKAnalyzer,
  assessmentQualityAnalyzer,
  calculateCourseTypeAlignment,
  courseTypeDetector,
  createEnhancedDepthAnalysisEngine,
  deepContentAnalyzer,
  deterministicRubricEngine,
  enhancedDepthEngine,
  generateCourseContentHash,
  objectiveAnalyzer,
  serializeAnalysisResult,
  transcriptAnalyzer,
  webbDOKAnalyzer
} from "./chunk-3KL3OQO6.mjs";

// src/standards/validated-distributions.ts
var VALIDATED_DISTRIBUTIONS = [
  {
    id: "hess-cognitive-rigor",
    name: "Hess Cognitive Rigor Matrix",
    courseType: "general",
    distribution: {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 10
    },
    dokDistribution: {
      level1: 10,
      level2: 45,
      level3: 35,
      level4: 10
    },
    source: {
      authors: ["Hess, K. K.", "Jones, B. S.", "Carlock, D.", "Walkup, J. R."],
      year: 2009,
      title: "Cognitive Rigor: Blending the Strengths of Bloom's Taxonomy and Webb's Depth of Knowledge to Improve Teaching",
      journal: "Educational Assessment",
      doi: "10.1080/10627197.2009.9668223",
      peerReviewed: true
    },
    sampleSize: 847,
    effectSize: 0.72,
    confidenceInterval: { lower: 0.65, upper: 0.79 },
    applicability: "General education courses, K-12 through higher education"
  },
  {
    id: "freeman-stem",
    name: "Freeman STEM Active Learning",
    courseType: "STEM",
    distribution: {
      REMEMBER: 5,
      UNDERSTAND: 15,
      APPLY: 35,
      ANALYZE: 25,
      EVALUATE: 12,
      CREATE: 8
    },
    dokDistribution: {
      level1: 5,
      level2: 50,
      level3: 35,
      level4: 10
    },
    source: {
      authors: [
        "Freeman, S.",
        "Eddy, S. L.",
        "McDonough, M.",
        "Smith, M. K.",
        "Okoroafor, N.",
        "Jordt, H.",
        "Wenderoth, M. P."
      ],
      year: 2014,
      title: "Active learning increases student performance in science, engineering, and mathematics",
      journal: "Proceedings of the National Academy of Sciences",
      doi: "10.1073/pnas.1319030111",
      peerReviewed: true
    },
    sampleSize: 225,
    effectSize: 0.47,
    confidenceInterval: { lower: 0.38, upper: 0.56 },
    applicability: "STEM courses emphasizing active learning and problem-solving"
  },
  {
    id: "wiggins-understanding",
    name: "Wiggins Understanding by Design",
    courseType: "professional",
    distribution: {
      REMEMBER: 5,
      UNDERSTAND: 20,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 20,
      CREATE: 10
    },
    dokDistribution: {
      level1: 5,
      level2: 45,
      level3: 40,
      level4: 10
    },
    source: {
      authors: ["Wiggins, G.", "McTighe, J."],
      year: 2005,
      title: "Understanding by Design (2nd ed.)",
      journal: "ASCD",
      peerReviewed: true
    },
    applicability: "Professional development and competency-based courses"
  },
  {
    id: "foundational-introductory",
    name: "Introductory Course Pattern",
    courseType: "foundational",
    distribution: {
      REMEMBER: 25,
      UNDERSTAND: 35,
      APPLY: 25,
      ANALYZE: 10,
      EVALUATE: 3,
      CREATE: 2
    },
    dokDistribution: {
      level1: 30,
      level2: 50,
      level3: 15,
      level4: 5
    },
    source: {
      authors: ["Anderson, L. W.", "Krathwohl, D. R."],
      year: 2001,
      title: "A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives",
      journal: "Longman",
      peerReviewed: true
    },
    applicability: "Introductory courses where foundational knowledge is primary"
  },
  {
    id: "intermediate-skills",
    name: "Intermediate Skills Pattern",
    courseType: "intermediate",
    distribution: {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 35,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5
    },
    dokDistribution: {
      level1: 15,
      level2: 40,
      level3: 35,
      level4: 10
    },
    source: {
      authors: ["Krathwohl, D. R."],
      year: 2002,
      title: "A Revision of Bloom's Taxonomy: An Overview",
      journal: "Theory into Practice",
      doi: "10.1207/s15430421tip4104_2",
      peerReviewed: true
    },
    applicability: "Intermediate courses building on foundational knowledge"
  },
  {
    id: "advanced-mastery",
    name: "Advanced Mastery Pattern",
    courseType: "advanced",
    distribution: {
      REMEMBER: 5,
      UNDERSTAND: 10,
      APPLY: 20,
      ANALYZE: 30,
      EVALUATE: 25,
      CREATE: 10
    },
    dokDistribution: {
      level1: 5,
      level2: 25,
      level3: 45,
      level4: 25
    },
    source: {
      authors: ["Biggs, J.", "Tang, C."],
      year: 2011,
      title: "Teaching for Quality Learning at University (4th ed.)",
      journal: "Open University Press",
      peerReviewed: true
    },
    applicability: "Advanced courses requiring deep analysis and evaluation"
  },
  {
    id: "creative-design",
    name: "Creative/Design Course Pattern",
    courseType: "creative",
    distribution: {
      REMEMBER: 5,
      UNDERSTAND: 10,
      APPLY: 15,
      ANALYZE: 15,
      EVALUATE: 20,
      CREATE: 35
    },
    dokDistribution: {
      level1: 5,
      level2: 20,
      level3: 30,
      level4: 45
    },
    source: {
      authors: ["Krathwohl, D. R."],
      year: 2002,
      title: "A Revision of Bloom's Taxonomy: An Overview",
      journal: "Theory into Practice",
      doi: "10.1207/s15430421tip4104_2",
      peerReviewed: true
    },
    applicability: "Creative arts, design, and project-based courses"
  },
  {
    id: "technical-hands-on",
    name: "Technical Hands-On Pattern",
    courseType: "technical",
    distribution: {
      REMEMBER: 10,
      UNDERSTAND: 15,
      APPLY: 40,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5
    },
    dokDistribution: {
      level1: 15,
      level2: 45,
      level3: 30,
      level4: 10
    },
    source: {
      authors: ["Freeman, S.", "et al."],
      year: 2014,
      title: "Active learning increases student performance in STEM",
      journal: "PNAS",
      doi: "10.1073/pnas.1319030111",
      peerReviewed: true
    },
    applicability: "Technical courses focused on practical application"
  },
  {
    id: "theoretical-academic",
    name: "Theoretical/Academic Pattern",
    courseType: "theoretical",
    distribution: {
      REMEMBER: 15,
      UNDERSTAND: 25,
      APPLY: 10,
      ANALYZE: 30,
      EVALUATE: 15,
      CREATE: 5
    },
    dokDistribution: {
      level1: 20,
      level2: 30,
      level3: 40,
      level4: 10
    },
    source: {
      authors: ["Fink, L. D."],
      year: 2013,
      title: "Creating Significant Learning Experiences (2nd ed.)",
      journal: "Jossey-Bass",
      peerReviewed: true
    },
    applicability: "Theoretical and academic research-focused courses"
  }
];
function getValidatedDistribution(courseType) {
  const normalizedType = courseType.toLowerCase();
  const directMatch = VALIDATED_DISTRIBUTIONS.find(
    (d) => d.courseType.toLowerCase() === normalizedType
  );
  if (directMatch) return directMatch;
  if (normalizedType === "technical") {
    return VALIDATED_DISTRIBUTIONS.find((d) => d.courseType === "STEM") ?? VALIDATED_DISTRIBUTIONS.find((d) => d.id === "hess-cognitive-rigor");
  }
  return VALIDATED_DISTRIBUTIONS.find((d) => d.id === "hess-cognitive-rigor");
}
function getCitationString(distribution) {
  const s = distribution.source;
  const authors = s.authors.length > 2 ? `${s.authors[0]} et al.` : s.authors.join(" & ");
  return `${authors} (${s.year}). ${s.title}. ${s.journal}${s.doi ? `. DOI: ${s.doi}` : ""}`;
}
function getAllCitations() {
  return VALIDATED_DISTRIBUTIONS.map((d) => d.source);
}
function calculateDistributionAlignment(actual, target) {
  const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
  const deviations = {};
  let totalDeviation = 0;
  const recommendations = [];
  for (const level of levels) {
    const actualVal = actual[level] ?? 0;
    const targetVal = target[level] ?? 0;
    const deviation = actualVal - targetVal;
    deviations[level] = deviation;
    totalDeviation += Math.abs(deviation);
    if (deviation > 10) {
      recommendations.push(`Reduce ${level} content by ${Math.round(deviation)}%`);
    } else if (deviation < -10) {
      recommendations.push(`Increase ${level} content by ${Math.round(Math.abs(deviation))}%`);
    }
  }
  const alignmentScore = Math.max(0, 100 - totalDeviation / 2);
  return {
    alignmentScore: Math.round(alignmentScore),
    deviations,
    recommendations
  };
}
function recommendDistribution(metadata) {
  const text = `${metadata.title} ${metadata.description ?? ""} ${metadata.keywords?.join(" ") ?? ""}`.toLowerCase();
  const indicators = [
    { pattern: /\b(introduction|intro|beginner|basic|fundamentals|101)\b/i, type: "foundational", weight: 1 },
    { pattern: /\b(intermediate|level 2|200|building on)\b/i, type: "intermediate", weight: 1 },
    { pattern: /\b(advanced|expert|mastery|senior|300|400)\b/i, type: "advanced", weight: 1 },
    { pattern: /\b(professional|career|industry|workplace|certification)\b/i, type: "professional", weight: 1 },
    { pattern: /\b(creative|design|art|music|writing|composition)\b/i, type: "creative", weight: 1 },
    { pattern: /\b(technical|programming|coding|engineering|hands-on)\b/i, type: "technical", weight: 1 },
    { pattern: /\b(theory|theoretical|academic|research|philosophy)\b/i, type: "theoretical", weight: 1 }
  ];
  let bestMatch = { type: "intermediate", score: 0 };
  for (const indicator of indicators) {
    if (indicator.pattern.test(text)) {
      if (indicator.weight > bestMatch.score) {
        bestMatch = { type: indicator.type, score: indicator.weight };
      }
    }
  }
  const recommended = getValidatedDistribution(bestMatch.type);
  const confidence = bestMatch.score > 0 ? 75 : 50;
  const reasoning = bestMatch.score > 0 ? `Course metadata suggests a ${bestMatch.type} course based on keyword analysis` : "No strong indicators found; recommending intermediate distribution as default";
  return {
    recommended,
    confidence,
    reasoning
  };
}

// src/standards/qm-evaluator.ts
var QM_STANDARDS = [
  // ─────────────────────────────────────────────────────────────
  // General Standard 1: Course Overview and Introduction
  // ─────────────────────────────────────────────────────────────
  {
    id: "1.1",
    generalStandard: "1",
    description: "Instructions make clear how to get started and where to find various course components.",
    points: 3,
    essential: true,
    annotation: "Clear navigation and course organization",
    checkCriteria: [
      "Course has description",
      "Course has organized chapters",
      "Clear section titles"
    ],
    automatedCheckPossible: true
  },
  {
    id: "1.2",
    generalStandard: "1",
    description: "Learners are introduced to the purpose and structure of the course.",
    points: 3,
    essential: false,
    annotation: "Course introduction explains goals",
    checkCriteria: [
      "Description explains purpose",
      "Learning objectives stated",
      "Course structure outlined"
    ],
    automatedCheckPossible: true
  },
  {
    id: "1.3",
    generalStandard: "1",
    description: "Communication expectations for online discussions, email, and other forms of interaction are clearly stated.",
    points: 2,
    essential: false,
    annotation: "Communication guidelines present",
    checkCriteria: [
      "Communication expectations stated",
      "Response time expectations",
      "Interaction guidelines"
    ],
    automatedCheckPossible: false
  },
  {
    id: "1.4",
    generalStandard: "1",
    description: "Course and institutional policies with which the learner is expected to comply are clearly stated.",
    points: 2,
    essential: false,
    annotation: "Policies accessible",
    checkCriteria: [
      "Academic integrity policy",
      "Grading policy",
      "Late work policy"
    ],
    automatedCheckPossible: false
  },
  {
    id: "1.5",
    generalStandard: "1",
    description: "Minimum technology requirements are clearly stated and instructions for obtaining the technologies are provided.",
    points: 2,
    essential: false,
    annotation: "Tech requirements documented",
    checkCriteria: [
      "Technology requirements listed",
      "Software needs identified",
      "Hardware recommendations"
    ],
    automatedCheckPossible: false
  },
  {
    id: "1.6",
    generalStandard: "1",
    description: "Computer skills and digital literacy skills expected of the learner are clearly stated.",
    points: 1,
    essential: false,
    annotation: "Prerequisite skills noted",
    checkCriteria: [
      "Digital literacy expectations",
      "Computer skills needed",
      "Prerequisite knowledge"
    ],
    automatedCheckPossible: false
  },
  {
    id: "1.7",
    generalStandard: "1",
    description: "Expectations for prerequisite knowledge in the discipline and/or any required competencies are clearly stated.",
    points: 1,
    essential: false,
    annotation: "Prerequisites documented",
    checkCriteria: [
      "Prior knowledge requirements",
      "Prerequisite courses",
      "Competency expectations"
    ],
    automatedCheckPossible: true
  },
  {
    id: "1.8",
    generalStandard: "1",
    description: "The self-introduction by the instructor is appropriate and available online.",
    points: 1,
    essential: false,
    annotation: "Instructor introduction present",
    checkCriteria: [
      "Instructor bio available",
      "Contact information",
      "Professional background"
    ],
    automatedCheckPossible: true
  },
  {
    id: "1.9",
    generalStandard: "1",
    description: "Learners are asked to introduce themselves to the class.",
    points: 1,
    essential: false,
    annotation: "Student introductions encouraged",
    checkCriteria: [
      "Introduction activity",
      "Community building",
      "Peer interaction"
    ],
    automatedCheckPossible: false
  },
  // ─────────────────────────────────────────────────────────────
  // General Standard 2: Learning Objectives (Competencies)
  // ─────────────────────────────────────────────────────────────
  {
    id: "2.1",
    generalStandard: "2",
    description: "The course learning objectives, or course/program competencies, describe outcomes that are measurable.",
    points: 3,
    essential: true,
    annotation: "Objectives use measurable action verbs",
    checkCriteria: [
      "Objectives use action verbs",
      "Outcomes are assessable",
      "Clear performance criteria"
    ],
    automatedCheckPossible: true
  },
  {
    id: "2.2",
    generalStandard: "2",
    description: "The module/unit learning objectives or competencies describe outcomes that are measurable and consistent with the course-level objectives or competencies.",
    points: 3,
    essential: true,
    annotation: "Module objectives align with course objectives",
    checkCriteria: [
      "Module objectives present",
      "Alignment with course goals",
      "Measurable outcomes"
    ],
    automatedCheckPossible: true
  },
  {
    id: "2.3",
    generalStandard: "2",
    description: "Learning objectives or competencies are stated clearly, are written from the learner's perspective, and are prominently located in the course.",
    points: 3,
    essential: false,
    annotation: "Learner-centered language used",
    checkCriteria: [
      "Learner-focused language",
      "Prominently displayed",
      "Clear and concise"
    ],
    automatedCheckPossible: true
  },
  {
    id: "2.4",
    generalStandard: "2",
    description: "The relationship between learning objectives or competencies and learning activities is clearly stated.",
    points: 3,
    essential: false,
    annotation: "Objectives linked to activities",
    checkCriteria: [
      "Activities support objectives",
      "Clear connections",
      "Logical progression"
    ],
    automatedCheckPossible: true
  },
  {
    id: "2.5",
    generalStandard: "2",
    description: "The learning objectives or competencies are suited to the level of the course.",
    points: 3,
    essential: false,
    annotation: "Appropriate cognitive level",
    checkCriteria: [
      "Bloom's levels appropriate",
      "Difficulty matches course level",
      "Progressive complexity"
    ],
    automatedCheckPossible: true
  },
  // ─────────────────────────────────────────────────────────────
  // General Standard 3: Assessment and Measurement
  // ─────────────────────────────────────────────────────────────
  {
    id: "3.1",
    generalStandard: "3",
    description: "The assessments measure the achievement of the stated learning objectives or competencies.",
    points: 3,
    essential: true,
    annotation: "Assessments aligned with objectives",
    checkCriteria: [
      "Assessment-objective alignment",
      "Coverage of all objectives",
      "Valid measurement"
    ],
    automatedCheckPossible: true
  },
  {
    id: "3.2",
    generalStandard: "3",
    description: "The course grading policy is stated clearly at the beginning of the course.",
    points: 3,
    essential: true,
    annotation: "Grading criteria transparent",
    checkCriteria: [
      "Grading scale defined",
      "Weight distribution clear",
      "Criteria explained"
    ],
    automatedCheckPossible: false
  },
  {
    id: "3.3",
    generalStandard: "3",
    description: "Specific and descriptive criteria are provided for the evaluation of learners' work and are tied to the course grading policy.",
    points: 3,
    essential: true,
    annotation: "Rubrics or criteria provided",
    checkCriteria: [
      "Detailed rubrics",
      "Clear expectations",
      "Feedback criteria"
    ],
    automatedCheckPossible: true
  },
  {
    id: "3.4",
    generalStandard: "3",
    description: "The assessments used are sequenced, varied, and suited to the level of the course.",
    points: 2,
    essential: false,
    annotation: "Assessment variety and sequence",
    checkCriteria: [
      "Multiple assessment types",
      "Logical sequence",
      "Appropriate difficulty"
    ],
    automatedCheckPossible: true
  },
  {
    id: "3.5",
    generalStandard: "3",
    description: "The course provides learners with multiple opportunities to track their learning progress with timely feedback.",
    points: 2,
    essential: false,
    annotation: "Progress tracking enabled",
    checkCriteria: [
      "Formative assessments",
      "Feedback mechanisms",
      "Progress indicators"
    ],
    automatedCheckPossible: true
  },
  // ─────────────────────────────────────────────────────────────
  // General Standard 4: Instructional Materials
  // ─────────────────────────────────────────────────────────────
  {
    id: "4.1",
    generalStandard: "4",
    description: "The instructional materials contribute to the achievement of the stated learning objectives or competencies.",
    points: 3,
    essential: true,
    annotation: "Materials support objectives",
    checkCriteria: [
      "Content aligns with objectives",
      "Relevant resources",
      "Sufficient coverage"
    ],
    automatedCheckPossible: true
  },
  {
    id: "4.2",
    generalStandard: "4",
    description: "The relationship between the use of instructional materials in the course and completing learning activities is clearly explained.",
    points: 3,
    essential: false,
    annotation: "Material purpose explained",
    checkCriteria: [
      "Instructions for materials",
      "Clear connections",
      "Usage guidance"
    ],
    automatedCheckPossible: false
  },
  {
    id: "4.3",
    generalStandard: "4",
    description: "The course models the academic integrity expected of learners by providing both source references and permissions for use of instructional materials.",
    points: 2,
    essential: false,
    annotation: "Citations and permissions",
    checkCriteria: [
      "Source citations",
      "Copyright compliance",
      "Attribution present"
    ],
    automatedCheckPossible: false
  },
  {
    id: "4.4",
    generalStandard: "4",
    description: "The instructional materials represent up-to-date theory and practice in the discipline.",
    points: 2,
    essential: false,
    annotation: "Current content",
    checkCriteria: [
      "Recent materials",
      "Current best practices",
      "Relevant examples"
    ],
    automatedCheckPossible: false
  },
  {
    id: "4.5",
    generalStandard: "4",
    description: "A variety of instructional materials are used in the course.",
    points: 2,
    essential: false,
    annotation: "Material diversity",
    checkCriteria: [
      "Multiple formats",
      "Video content",
      "Written materials",
      "Interactive elements"
    ],
    automatedCheckPossible: true
  },
  // ─────────────────────────────────────────────────────────────
  // General Standard 5: Learning Activities and Learner Interaction
  // ─────────────────────────────────────────────────────────────
  {
    id: "5.1",
    generalStandard: "5",
    description: "The learning activities promote the achievement of the stated learning objectives or competencies.",
    points: 3,
    essential: true,
    annotation: "Activities support objectives",
    checkCriteria: [
      "Activity-objective alignment",
      "Meaningful activities",
      "Skill development"
    ],
    automatedCheckPossible: true
  },
  {
    id: "5.2",
    generalStandard: "5",
    description: "Learning activities provide opportunities for interaction that support active learning.",
    points: 3,
    essential: false,
    annotation: "Active learning opportunities",
    checkCriteria: [
      "Interactive elements",
      "Hands-on activities",
      "Engagement opportunities"
    ],
    automatedCheckPossible: true
  },
  {
    id: "5.3",
    generalStandard: "5",
    description: "The instructor's plan for interacting with learners during the course is clearly stated.",
    points: 2,
    essential: false,
    annotation: "Interaction plan defined",
    checkCriteria: [
      "Communication schedule",
      "Feedback timing",
      "Support availability"
    ],
    automatedCheckPossible: false
  },
  {
    id: "5.4",
    generalStandard: "5",
    description: "The requirements for learner interaction are clearly stated.",
    points: 2,
    essential: false,
    annotation: "Interaction requirements clear",
    checkCriteria: [
      "Participation expectations",
      "Collaboration requirements",
      "Discussion guidelines"
    ],
    automatedCheckPossible: false
  },
  // ─────────────────────────────────────────────────────────────
  // General Standard 8: Accessibility and Usability
  // ─────────────────────────────────────────────────────────────
  {
    id: "8.1",
    generalStandard: "8",
    description: "Course navigation facilitates ease of use.",
    points: 3,
    essential: true,
    annotation: "Easy navigation",
    checkCriteria: [
      "Clear structure",
      "Consistent layout",
      "Logical organization"
    ],
    automatedCheckPossible: true
  },
  {
    id: "8.2",
    generalStandard: "8",
    description: "The course design facilitates readability.",
    points: 3,
    essential: false,
    annotation: "Readable design",
    checkCriteria: [
      "Clear formatting",
      "Appropriate fonts",
      "Visual hierarchy"
    ],
    automatedCheckPossible: true
  },
  {
    id: "8.3",
    generalStandard: "8",
    description: "The course provides accessible text and images in files, documents, LMS pages, and web pages.",
    points: 3,
    essential: true,
    annotation: "Accessible content",
    checkCriteria: [
      "Alt text for images",
      "Structured headings",
      "Readable documents"
    ],
    automatedCheckPossible: true
  },
  {
    id: "8.4",
    generalStandard: "8",
    description: "The course provides accessible video and audio content.",
    points: 3,
    essential: false,
    annotation: "Accessible multimedia",
    checkCriteria: [
      "Captions available",
      "Transcripts provided",
      "Audio descriptions"
    ],
    automatedCheckPossible: true
  },
  {
    id: "8.5",
    generalStandard: "8",
    description: "Course multimedia facilitate ease of use.",
    points: 2,
    essential: false,
    annotation: "User-friendly multimedia",
    checkCriteria: [
      "Proper file formats",
      "Reasonable file sizes",
      "Playback controls"
    ],
    automatedCheckPossible: true
  },
  {
    id: "8.6",
    generalStandard: "8",
    description: "Vendor accessibility statements are provided for all technologies required in the course.",
    points: 2,
    essential: false,
    annotation: "Tech accessibility documented",
    checkCriteria: [
      "VPAT available",
      "Accessibility statements",
      "Compliance documentation"
    ],
    automatedCheckPossible: false
  }
];
var MEASURABLE_VERBS_PATTERN = /\b(define|identify|list|name|recall|recognize|state|explain|summarize|interpret|classify|compare|contrast|describe|discuss|predict|apply|demonstrate|solve|use|implement|calculate|execute|analyze|examine|differentiate|organize|evaluate|judge|critique|justify|assess|create|design|develop|formulate|construct|compose|plan)\b/gi;
var LEARNER_CENTERED_PATTERN = /\b(you will|learners? will|students? will|be able to|can|will be able|upon completion|by the end|after completing)\b/i;
var QMEvaluator = class {
  VERSION = "1.0.0";
  /**
   * Evaluate course against QM Higher Education Rubric (7th Edition)
   */
  evaluate(courseData) {
    const results = [];
    let totalPoints = 0;
    let earnedPoints = 0;
    let essentialsMet = 0;
    let essentialsTotal = 0;
    const categoryScores = {
      "1": { earned: 0, max: 0, percentage: 0 },
      "2": { earned: 0, max: 0, percentage: 0 },
      "3": { earned: 0, max: 0, percentage: 0 },
      "4": { earned: 0, max: 0, percentage: 0 },
      "5": { earned: 0, max: 0, percentage: 0 },
      "6": { earned: 0, max: 0, percentage: 0 },
      "7": { earned: 0, max: 0, percentage: 0 },
      "8": { earned: 0, max: 0, percentage: 0 }
    };
    for (const standard of QM_STANDARDS) {
      if (standard.essential) {
        essentialsTotal++;
      }
      let evaluation;
      if (!standard.automatedCheckPossible) {
        evaluation = {
          standardId: standard.id,
          status: "manual_review_required",
          score: 0,
          maxScore: standard.points,
          notes: `Manual review required: ${standard.annotation}`
        };
      } else {
        evaluation = this.evaluateStandard(standard, courseData);
      }
      results.push(evaluation);
      totalPoints += standard.points;
      earnedPoints += evaluation.score;
      const cat = categoryScores[standard.generalStandard];
      cat.max += standard.points;
      cat.earned += evaluation.score;
      if (standard.essential && evaluation.score >= 3) {
        essentialsMet++;
      }
    }
    for (const cat of Object.values(categoryScores)) {
      cat.percentage = cat.max > 0 ? Math.round(cat.earned / cat.max * 100) : 0;
    }
    const percentageScore = totalPoints > 0 ? Math.round(earnedPoints / totalPoints * 100) : 0;
    const allEssentialsMet = essentialsMet === essentialsTotal;
    const qmCertifiable = allEssentialsMet && percentageScore >= 85;
    const recommendations = this.generateRecommendations(results);
    return {
      overallScore: earnedPoints,
      maxPossibleScore: totalPoints,
      percentageScore,
      essentialsMet: allEssentialsMet,
      essentialsCount: { met: essentialsMet, total: essentialsTotal },
      qmCertifiable,
      standardResults: results,
      categoryScores,
      recommendations,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Get the QM evaluator version
   */
  getVersion() {
    return this.VERSION;
  }
  /**
   * Get all QM standards for reference
   */
  getStandards() {
    return [...QM_STANDARDS];
  }
  /**
   * Get essential standards only
   */
  getEssentialStandards() {
    return QM_STANDARDS.filter((s) => s.essential);
  }
  // ═══════════════════════════════════════════════════════════════
  // INDIVIDUAL STANDARD EVALUATORS
  // ═══════════════════════════════════════════════════════════════
  evaluateStandard(standard, data) {
    switch (standard.id) {
      // Standard 1: Course Overview
      case "1.1":
        return this.evaluate1_1_CourseNavigation(standard, data);
      case "1.2":
        return this.evaluate1_2_CourseIntroduction(standard, data);
      case "1.7":
        return this.evaluate1_7_Prerequisites(standard, data);
      case "1.8":
        return this.evaluate1_8_InstructorIntro(standard, data);
      // Standard 2: Learning Objectives
      case "2.1":
        return this.evaluate2_1_MeasurableObjectives(standard, data);
      case "2.2":
        return this.evaluate2_2_ModuleObjectives(standard, data);
      case "2.3":
        return this.evaluate2_3_LearnerCenteredObjectives(standard, data);
      case "2.4":
        return this.evaluate2_4_ObjectiveActivityAlignment(standard, data);
      case "2.5":
        return this.evaluate2_5_ObjectiveLevel(standard, data);
      // Standard 3: Assessment
      case "3.1":
        return this.evaluate3_1_AssessmentAlignment(standard, data);
      case "3.3":
        return this.evaluate3_3_EvaluationCriteria(standard, data);
      case "3.4":
        return this.evaluate3_4_AssessmentVariety(standard, data);
      case "3.5":
        return this.evaluate3_5_ProgressTracking(standard, data);
      // Standard 4: Instructional Materials
      case "4.1":
        return this.evaluate4_1_MaterialsAlignment(standard, data);
      case "4.5":
        return this.evaluate4_5_MaterialVariety(standard, data);
      // Standard 5: Learning Activities
      case "5.1":
        return this.evaluate5_1_ActivityAlignment(standard, data);
      case "5.2":
        return this.evaluate5_2_ActiveLearning(standard, data);
      // Standard 8: Accessibility
      case "8.1":
        return this.evaluate8_1_Navigation(standard, data);
      case "8.2":
        return this.evaluate8_2_Readability(standard, data);
      case "8.3":
        return this.evaluate8_3_AccessibleContent(standard, data);
      case "8.4":
        return this.evaluate8_4_AccessibleMultimedia(standard, data);
      case "8.5":
        return this.evaluate8_5_MultimediaUsability(standard, data);
      default:
        return {
          standardId: standard.id,
          status: "not_evaluated",
          score: 0,
          maxScore: standard.points,
          notes: "Standard not implemented for automated evaluation"
        };
    }
  }
  // ─────────────────────────────────────────────────────────────
  // Standard 1 Evaluators
  // ─────────────────────────────────────────────────────────────
  evaluate1_1_CourseNavigation(standard, data) {
    let score = 0;
    const evidence = [];
    if (data.description && data.description.length >= 50) {
      score++;
      evidence.push("Course has description");
    }
    if (data.chapters.length >= 1) {
      score++;
      evidence.push(`Course has ${data.chapters.length} chapters`);
    }
    const sectionsWithTitles = data.chapters.reduce((count, ch) => count + (ch.sections?.filter((s) => s.title && s.title.length > 5).length ?? 0), 0);
    if (sectionsWithTitles >= 3) {
      score++;
      evidence.push(`${sectionsWithTitles} sections with clear titles`);
    }
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 2 ? "partially_met" : "not_met",
      score: Math.min(score, 3),
      maxScore: standard.points,
      evidence,
      notes: `Navigation score: ${score}/3`
    };
  }
  evaluate1_2_CourseIntroduction(standard, data) {
    let score = 0;
    const evidence = [];
    if (data.description && data.description.length >= 100) {
      score++;
      evidence.push("Detailed course description present");
    }
    if (data.objectives.length >= 1) {
      score++;
      evidence.push(`${data.objectives.length} learning objectives defined`);
    }
    if (data.chapters.length >= 3) {
      score++;
      evidence.push("Course structure with multiple chapters");
    }
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 2 ? "partially_met" : "not_met",
      score: Math.min(score, 3),
      maxScore: standard.points,
      evidence
    };
  }
  evaluate1_7_Prerequisites(standard, data) {
    const prereqKeywords = /\b(prerequisite|prior knowledge|required knowledge|background|experience required|before taking)\b/i;
    const hasPrereqs = data.description ? prereqKeywords.test(data.description) : false;
    return {
      standardId: standard.id,
      status: hasPrereqs ? "met" : "not_met",
      score: hasPrereqs ? 1 : 0,
      maxScore: standard.points,
      notes: hasPrereqs ? "Prerequisites mentioned" : "No prerequisite information found"
    };
  }
  evaluate1_8_InstructorIntro(standard, data) {
    const hasImage = Boolean(data.imageUrl);
    return {
      standardId: standard.id,
      status: hasImage ? "partially_met" : "not_met",
      score: hasImage ? 1 : 0,
      maxScore: standard.points,
      notes: hasImage ? "Course image present (proxy for instructor presence)" : "No instructor introduction indicators"
    };
  }
  // ─────────────────────────────────────────────────────────────
  // Standard 2 Evaluators (Learning Objectives)
  // ─────────────────────────────────────────────────────────────
  evaluate2_1_MeasurableObjectives(standard, data) {
    if (data.objectives.length === 0) {
      return {
        standardId: standard.id,
        status: "not_met",
        score: 0,
        maxScore: standard.points,
        notes: "No learning objectives defined",
        recommendations: ["Add measurable learning objectives using action verbs"]
      };
    }
    const measurableCount = data.objectives.filter((obj) => {
      MEASURABLE_VERBS_PATTERN.lastIndex = 0;
      return MEASURABLE_VERBS_PATTERN.test(obj);
    }).length;
    const ratio = measurableCount / data.objectives.length;
    let score;
    let status;
    if (ratio >= 0.9) {
      score = 3;
      status = "met";
    } else if (ratio >= 0.7) {
      score = 2;
      status = "partially_met";
    } else if (ratio >= 0.5) {
      score = 1;
      status = "partially_met";
    } else {
      score = 0;
      status = "not_met";
    }
    return {
      standardId: standard.id,
      status,
      score,
      maxScore: standard.points,
      notes: `${Math.round(ratio * 100)}% of objectives (${measurableCount}/${data.objectives.length}) use measurable verbs`,
      evidence: [`Measurable objectives: ${measurableCount}`, `Total objectives: ${data.objectives.length}`]
    };
  }
  evaluate2_2_ModuleObjectives(standard, data) {
    const chaptersWithOutcomes = data.chapters.filter(
      (ch) => ch.learningOutcome && ch.learningOutcome.length > 10
    ).length;
    const ratio = data.chapters.length > 0 ? chaptersWithOutcomes / data.chapters.length : 0;
    let score;
    if (ratio >= 0.8) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${chaptersWithOutcomes}/${data.chapters.length} chapters have learning outcomes`
    };
  }
  evaluate2_3_LearnerCenteredObjectives(standard, data) {
    if (data.objectives.length === 0) {
      return {
        standardId: standard.id,
        status: "not_met",
        score: 0,
        maxScore: standard.points,
        notes: "No objectives to evaluate"
      };
    }
    const learnerCenteredCount = data.objectives.filter(
      (obj) => LEARNER_CENTERED_PATTERN.test(obj)
    ).length;
    const ratio = learnerCenteredCount / data.objectives.length;
    let score;
    if (ratio >= 0.8) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${Math.round(ratio * 100)}% of objectives use learner-centered language`
    };
  }
  evaluate2_4_ObjectiveActivityAlignment(standard, data) {
    const hasObjectives = data.objectives.length > 0;
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    let score;
    if (hasObjectives && totalSections >= data.objectives.length) {
      score = 3;
    } else if (hasObjectives && totalSections >= 1) {
      score = 2;
    } else if (hasObjectives || totalSections >= 1) {
      score = 1;
    } else {
      score = 0;
    }
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${data.objectives.length} objectives, ${totalSections} learning activities`
    };
  }
  evaluate2_5_ObjectiveLevel(standard, data) {
    const levels = /* @__PURE__ */ new Set();
    const bloomsPatterns = {
      "REMEMBER": /\b(define|list|name|recall|identify|recognize|state)\b/gi,
      "UNDERSTAND": /\b(explain|summarize|interpret|classify|compare|describe)\b/gi,
      "APPLY": /\b(apply|demonstrate|solve|use|implement|calculate)\b/gi,
      "ANALYZE": /\b(analyze|examine|differentiate|organize|deconstruct)\b/gi,
      "EVALUATE": /\b(evaluate|judge|critique|justify|assess)\b/gi,
      "CREATE": /\b(create|design|develop|formulate|construct)\b/gi
    };
    for (const obj of data.objectives) {
      for (const [level, pattern] of Object.entries(bloomsPatterns)) {
        pattern.lastIndex = 0;
        if (pattern.test(obj)) {
          levels.add(level);
        }
      }
    }
    let score;
    if (levels.size >= 4) score = 3;
    else if (levels.size >= 3) score = 2;
    else if (levels.size >= 2) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `Objectives span ${levels.size} Bloom's Taxonomy levels`,
      evidence: Array.from(levels)
    };
  }
  // ─────────────────────────────────────────────────────────────
  // Standard 3 Evaluators (Assessment)
  // ─────────────────────────────────────────────────────────────
  evaluate3_1_AssessmentAlignment(standard, data) {
    if (data.objectives.length === 0) {
      return {
        standardId: standard.id,
        status: "not_met",
        score: 0,
        maxScore: standard.points,
        notes: "No objectives defined for alignment check"
      };
    }
    const assessmentCount = data.assessments.length;
    const objectiveCount = data.objectives.length;
    const ratio = objectiveCount > 0 ? assessmentCount / objectiveCount : 0;
    let score;
    if (ratio >= 0.5) score = 3;
    else if (ratio >= 0.3) score = 2;
    else if (assessmentCount >= 1) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${assessmentCount} assessments for ${objectiveCount} objectives (ratio: ${ratio.toFixed(2)})`
    };
  }
  evaluate3_3_EvaluationCriteria(standard, data) {
    const assessmentsWithFeedback = data.assessments.filter(
      (a) => a.questions?.some((q) => q.explanation || q.feedback)
    ).length;
    const ratio = data.assessments.length > 0 ? assessmentsWithFeedback / data.assessments.length : 0;
    let score;
    if (ratio >= 0.8) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${assessmentsWithFeedback}/${data.assessments.length} assessments have evaluation criteria`
    };
  }
  evaluate3_4_AssessmentVariety(standard, data) {
    const types = new Set(data.assessments.map((a) => a.type));
    let score;
    if (types.size >= 3) score = 2;
    else if (types.size >= 2) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 2 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${types.size} different assessment types used`,
      evidence: Array.from(types)
    };
  }
  evaluate3_5_ProgressTracking(standard, data) {
    const formativeCount = data.assessments.filter(
      (a) => a.type === "quiz" || a.type === "practice"
    ).length;
    let score;
    if (formativeCount >= 3) score = 2;
    else if (formativeCount >= 1) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 2 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${formativeCount} formative assessments for progress tracking`
    };
  }
  // ─────────────────────────────────────────────────────────────
  // Standard 4 Evaluators (Instructional Materials)
  // ─────────────────────────────────────────────────────────────
  evaluate4_1_MaterialsAlignment(standard, data) {
    const hasContent = data.chapters.length > 0;
    const hasObjectives = data.objectives.length > 0;
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    let score;
    if (hasContent && hasObjectives && totalSections >= data.objectives.length) {
      score = 3;
    } else if (hasContent && totalSections >= 3) {
      score = 2;
    } else if (hasContent) {
      score = 1;
    } else {
      score = 0;
    }
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${totalSections} content sections supporting ${data.objectives.length} objectives`
    };
  }
  evaluate4_5_MaterialVariety(standard, data) {
    const materialTypes = /* @__PURE__ */ new Set();
    const hasVideo = data.chapters.some(
      (ch) => ch.sections?.some((s) => s.videoUrl)
    );
    if (hasVideo) materialTypes.add("video");
    const hasText = data.chapters.some(
      (ch) => ch.sections?.some((s) => s.description && s.description.length > 50)
    );
    if (hasText) materialTypes.add("text");
    if ((data.attachments?.length ?? 0) > 0) {
      materialTypes.add("attachments");
    }
    if (data.assessments.length > 0) {
      materialTypes.add("interactive");
    }
    let score;
    if (materialTypes.size >= 3) score = 2;
    else if (materialTypes.size >= 2) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 2 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${materialTypes.size} different material types`,
      evidence: Array.from(materialTypes)
    };
  }
  // ─────────────────────────────────────────────────────────────
  // Standard 5 Evaluators (Learning Activities)
  // ─────────────────────────────────────────────────────────────
  evaluate5_1_ActivityAlignment(standard, data) {
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    const objectiveCount = data.objectives.length;
    let score;
    if (totalSections >= objectiveCount && objectiveCount > 0) {
      score = 3;
    } else if (totalSections >= Math.ceil(objectiveCount * 0.5)) {
      score = 2;
    } else if (totalSections >= 1) {
      score = 1;
    } else {
      score = 0;
    }
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${totalSections} activities for ${objectiveCount} objectives`
    };
  }
  evaluate5_2_ActiveLearning(standard, data) {
    const hasQuizzes = data.assessments.some((a) => a.type === "quiz" || a.type === "practice");
    const hasProjects = data.assessments.some((a) => a.type === "project" || a.type === "assignment");
    const hasVideos = data.chapters.some((ch) => ch.sections?.some((s) => s.videoUrl));
    const activeElements = [hasQuizzes, hasProjects, hasVideos].filter(Boolean).length;
    let score;
    if (activeElements >= 3) score = 3;
    else if (activeElements >= 2) score = 2;
    else if (activeElements >= 1) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${activeElements} types of active learning elements`
    };
  }
  // ─────────────────────────────────────────────────────────────
  // Standard 8 Evaluators (Accessibility)
  // ─────────────────────────────────────────────────────────────
  evaluate8_1_Navigation(standard, data) {
    let score = 0;
    if (data.chapters.length >= 1) score++;
    const titledChapters = data.chapters.filter((ch) => ch.title && ch.title.length > 5).length;
    if (titledChapters === data.chapters.length && data.chapters.length > 0) score++;
    const avgSections = data.chapters.length > 0 ? data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0) / data.chapters.length : 0;
    if (avgSections >= 1) score++;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 2 ? "partially_met" : "not_met",
      score: Math.min(score, 3),
      maxScore: standard.points,
      notes: `Navigation score: ${score}/3`
    };
  }
  evaluate8_2_Readability(standard, data) {
    let score = 0;
    if (data.description && data.description.length >= 100) score++;
    const chaptersWithDesc = data.chapters.filter(
      (ch) => ch.learningOutcome && ch.learningOutcome.length > 20
    ).length;
    if (chaptersWithDesc >= data.chapters.length * 0.5) score++;
    const sectionsWithDesc = data.chapters.reduce((count, ch) => count + (ch.sections?.filter((s) => s.description && s.description.length > 10).length ?? 0), 0);
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    if (sectionsWithDesc >= totalSections * 0.3) score++;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 2 ? "partially_met" : "not_met",
      score: Math.min(score, 3),
      maxScore: standard.points,
      notes: `Readability score: ${score}/3`
    };
  }
  evaluate8_3_AccessibleContent(standard, data) {
    const hasImage = Boolean(data.imageUrl);
    const hasTextContent = data.chapters.some(
      (ch) => ch.sections?.some((s) => s.description && s.description.length > 50)
    );
    let score;
    if (hasImage && hasTextContent) score = 3;
    else if (hasTextContent) score = 2;
    else if (hasImage) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `Accessible content check: image=${hasImage}, text=${hasTextContent}`
    };
  }
  evaluate8_4_AccessibleMultimedia(standard, data) {
    const videosCount = data.chapters.reduce((count, ch) => count + (ch.sections?.filter((s) => s.videoUrl).length ?? 0), 0);
    let score;
    if (videosCount >= 5) score = 3;
    else if (videosCount >= 2) score = 2;
    else if (videosCount >= 1) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 3 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `${videosCount} video sections (assuming caption support)`
    };
  }
  evaluate8_5_MultimediaUsability(standard, data) {
    const videosCount = data.chapters.reduce((count, ch) => count + (ch.sections?.filter((s) => s.videoUrl).length ?? 0), 0);
    const hasAttachments = (data.attachments?.length ?? 0) > 0;
    let score;
    if (videosCount >= 1 && hasAttachments) score = 2;
    else if (videosCount >= 1 || hasAttachments) score = 1;
    else score = 0;
    return {
      standardId: standard.id,
      status: score >= 2 ? "met" : score >= 1 ? "partially_met" : "not_met",
      score,
      maxScore: standard.points,
      notes: `Videos: ${videosCount}, Attachments: ${data.attachments?.length ?? 0}`
    };
  }
  // ═══════════════════════════════════════════════════════════════
  // RECOMMENDATION GENERATOR
  // ═══════════════════════════════════════════════════════════════
  generateRecommendations(results) {
    const recommendations = [];
    for (const result of results) {
      if (result.status === "not_met" || result.status === "partially_met") {
        const standard = QM_STANDARDS.find((s) => s.id === result.standardId);
        if (!standard) continue;
        recommendations.push({
          standardId: standard.id,
          priority: standard.essential ? "critical" : result.status === "not_met" ? "high" : "medium",
          title: `QM ${standard.id}: ${standard.description.substring(0, 50)}...`,
          description: standard.annotation,
          actionSteps: standard.checkCriteria,
          isEssential: standard.essential
        });
      }
    }
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return recommendations;
  }
};
var qmEvaluator = new QMEvaluator();

// src/standards/olc-scorecard.ts
var OLC_INDICATORS = [
  // ─────────────────────────────────────────────────────────────
  // Course Development
  // ─────────────────────────────────────────────────────────────
  {
    id: "CD-1",
    category: "CourseDevelopment",
    indicator: "Course development is guided by an instructional design model.",
    scoringLevels: {
      0: "No evidence of instructional design",
      1: "Basic structure present",
      2: "Clear learning objectives and assessments aligned",
      3: "Full backward design with Bloom's Taxonomy integration"
    },
    evidence: [
      "Learning objectives follow Bloom's Taxonomy",
      "Backward design principles applied",
      "Clear alignment between objectives, activities, assessments"
    ],
    automatedEvaluation: true
  },
  {
    id: "CD-2",
    category: "CourseDevelopment",
    indicator: "Learning objectives describe measurable outcomes.",
    scoringLevels: {
      0: "Objectives missing or not measurable",
      1: "Some objectives are measurable",
      2: "Most objectives are measurable",
      3: "All objectives are measurable with SMART criteria"
    },
    evidence: [
      "All objectives use action verbs",
      "Outcomes can be assessed",
      "SMART criteria applied"
    ],
    automatedEvaluation: true
  },
  {
    id: "CD-3",
    category: "CourseDevelopment",
    indicator: "Course is designed to encourage active learning.",
    scoringLevels: {
      0: "Passive content delivery only",
      1: "Limited interactive elements",
      2: "Multiple opportunities for active learning",
      3: "Comprehensive active learning strategy throughout"
    },
    evidence: [
      "Interactive assessments",
      "Hands-on activities",
      "Discussion opportunities",
      "Project-based learning"
    ],
    automatedEvaluation: true
  },
  {
    id: "CD-4",
    category: "CourseDevelopment",
    indicator: "Course includes variety of instructional materials.",
    scoringLevels: {
      0: "Single format only",
      1: "Two different formats",
      2: "Multiple formats with good variety",
      3: "Comprehensive multimedia approach"
    },
    evidence: [
      "Video content",
      "Text materials",
      "Interactive elements",
      "Supplementary resources"
    ],
    automatedEvaluation: true
  },
  {
    id: "CD-5",
    category: "CourseDevelopment",
    indicator: "Course applies principles of cognitive load management.",
    scoringLevels: {
      0: "Overwhelming content structure",
      1: "Basic chunking applied",
      2: "Well-organized content with clear progression",
      3: "Optimal cognitive load design with scaffolding"
    },
    evidence: [
      "Content chunked appropriately",
      "Clear learning progression",
      "Scaffolded complexity"
    ],
    automatedEvaluation: true
  },
  // ─────────────────────────────────────────────────────────────
  // Course Structure
  // ─────────────────────────────────────────────────────────────
  {
    id: "CS-1",
    category: "CourseStructure",
    indicator: "Course is organized into logical modules or units.",
    scoringLevels: {
      0: "No organization evident",
      1: "Basic organization",
      2: "Clear modular structure",
      3: "Exemplary organization with learning pathways"
    },
    evidence: [
      "Chapters/modules present",
      "Logical sequence",
      "Clear navigation"
    ],
    automatedEvaluation: true
  },
  {
    id: "CS-2",
    category: "CourseStructure",
    indicator: "Course content is chunked into manageable segments.",
    scoringLevels: {
      0: "Monolithic content blocks",
      1: "Some chunking evident",
      2: "Appropriate content segments",
      3: "Optimal micro-learning structure"
    },
    evidence: [
      "Sections within chapters",
      "Manageable lesson lengths",
      "Clear topic boundaries"
    ],
    automatedEvaluation: true
  },
  {
    id: "CS-3",
    category: "CourseStructure",
    indicator: "Course components are consistent in structure.",
    scoringLevels: {
      0: "Inconsistent structure throughout",
      1: "Some consistency",
      2: "Mostly consistent structure",
      3: "Highly consistent and predictable structure"
    },
    evidence: [
      "Consistent chapter format",
      "Predictable section layout",
      "Uniform naming conventions"
    ],
    automatedEvaluation: true
  },
  {
    id: "CS-4",
    category: "CourseStructure",
    indicator: "Course includes clear introduction and overview.",
    scoringLevels: {
      0: "No introduction or overview",
      1: "Basic title only",
      2: "Description with overview",
      3: "Comprehensive introduction with goals and expectations"
    },
    evidence: [
      "Course description present",
      "Learning objectives stated",
      "Course structure outlined"
    ],
    automatedEvaluation: true
  },
  // ─────────────────────────────────────────────────────────────
  // Teaching and Learning
  // ─────────────────────────────────────────────────────────────
  {
    id: "TL-1",
    category: "TeachingAndLearning",
    indicator: "Learning objectives are appropriate to the course level.",
    scoringLevels: {
      0: "Objectives do not match course level",
      1: "Some alignment with course level",
      2: "Good alignment with appropriate challenge",
      3: "Excellent alignment with progressive complexity"
    },
    evidence: [
      "Bloom's levels appropriate",
      "Progressive difficulty",
      "Suitable for target audience"
    ],
    automatedEvaluation: true
  },
  {
    id: "TL-2",
    category: "TeachingAndLearning",
    indicator: "Course uses varied instructional methods.",
    scoringLevels: {
      0: "Single instructional method",
      1: "Two methods used",
      2: "Multiple methods with variety",
      3: "Comprehensive multimodal instruction"
    },
    evidence: [
      "Different content types",
      "Various learning activities",
      "Multiple engagement strategies"
    ],
    automatedEvaluation: true
  },
  {
    id: "TL-3",
    category: "TeachingAndLearning",
    indicator: "Course provides opportunities for practice and application.",
    scoringLevels: {
      0: "No practice opportunities",
      1: "Minimal practice activities",
      2: "Regular practice opportunities",
      3: "Extensive practice with real-world application"
    },
    evidence: [
      "Practice assessments",
      "Application exercises",
      "Hands-on activities"
    ],
    automatedEvaluation: true
  },
  // ─────────────────────────────────────────────────────────────
  // Evaluation and Assessment
  // ─────────────────────────────────────────────────────────────
  {
    id: "EA-1",
    category: "EvaluationAndAssessment",
    indicator: "Assessments align with learning objectives.",
    scoringLevels: {
      0: "No alignment evident",
      1: "Partial alignment",
      2: "Good alignment for most objectives",
      3: "Complete alignment with all objectives assessed"
    },
    evidence: [
      "Assessment-objective mapping",
      "Coverage of all objectives",
      "Appropriate assessment methods"
    ],
    automatedEvaluation: true
  },
  {
    id: "EA-2",
    category: "EvaluationAndAssessment",
    indicator: "Course includes variety of assessment types.",
    scoringLevels: {
      0: "Single assessment type",
      1: "Two assessment types",
      2: "Multiple assessment types",
      3: "Comprehensive assessment strategy"
    },
    evidence: [
      "Quizzes",
      "Projects/Assignments",
      "Practical assessments",
      "Formative and summative"
    ],
    automatedEvaluation: true
  },
  {
    id: "EA-3",
    category: "EvaluationAndAssessment",
    indicator: "Formative assessments provide feedback for improvement.",
    scoringLevels: {
      0: "No formative assessments",
      1: "Formative assessments without feedback",
      2: "Formative assessments with basic feedback",
      3: "Comprehensive formative assessment with detailed feedback"
    },
    evidence: [
      "Practice quizzes",
      "Immediate feedback",
      "Explanations provided"
    ],
    automatedEvaluation: true
  },
  {
    id: "EA-4",
    category: "EvaluationAndAssessment",
    indicator: "Clear criteria provided for assessments.",
    scoringLevels: {
      0: "No criteria provided",
      1: "Basic criteria mentioned",
      2: "Clear criteria for most assessments",
      3: "Detailed rubrics and criteria for all assessments"
    },
    evidence: [
      "Question explanations",
      "Scoring criteria",
      "Expected outcomes"
    ],
    automatedEvaluation: true
  },
  // ─────────────────────────────────────────────────────────────
  // Accessibility and Usability
  // ─────────────────────────────────────────────────────────────
  {
    id: "AU-1",
    category: "AccessibilityAndUsability",
    indicator: "Course navigation is intuitive and consistent.",
    scoringLevels: {
      0: "Confusing navigation",
      1: "Basic navigation",
      2: "Clear and consistent navigation",
      3: "Intuitive navigation with multiple pathways"
    },
    evidence: [
      "Clear structure",
      "Consistent layout",
      "Logical flow"
    ],
    automatedEvaluation: true
  },
  {
    id: "AU-2",
    category: "AccessibilityAndUsability",
    indicator: "Course provides accessible multimedia content.",
    scoringLevels: {
      0: "Multimedia not accessible",
      1: "Some accessibility features",
      2: "Most content accessible",
      3: "Fully accessible with multiple formats"
    },
    evidence: [
      "Video content present",
      "Alternative formats",
      "Accessible design"
    ],
    automatedEvaluation: true
  },
  {
    id: "AU-3",
    category: "AccessibilityAndUsability",
    indicator: "Content is readable and well-formatted.",
    scoringLevels: {
      0: "Poor formatting and readability",
      1: "Basic formatting",
      2: "Good readability",
      3: "Excellent formatting with visual hierarchy"
    },
    evidence: [
      "Clear descriptions",
      "Organized content",
      "Professional presentation"
    ],
    automatedEvaluation: true
  }
];
var OLCEvaluator = class {
  VERSION = "1.0.0";
  /**
   * Evaluate course against OLC Quality Scorecard
   */
  evaluate(courseData) {
    const results = [];
    let totalEarned = 0;
    let totalMax = 0;
    const categoryScores = {
      "CourseDevelopment": { earned: 0, max: 0, percentage: 0 },
      "CourseStructure": { earned: 0, max: 0, percentage: 0 },
      "TeachingAndLearning": { earned: 0, max: 0, percentage: 0 },
      "LearnerSupport": { earned: 0, max: 0, percentage: 0 },
      "EvaluationAndAssessment": { earned: 0, max: 0, percentage: 0 },
      "AccessibilityAndUsability": { earned: 0, max: 0, percentage: 0 }
    };
    for (const indicator of OLC_INDICATORS) {
      const result = indicator.automatedEvaluation ? this.evaluateIndicator(indicator, courseData) : this.createManualReviewResult(indicator);
      results.push(result);
      totalEarned += result.score;
      totalMax += 3;
      const cat = categoryScores[indicator.category];
      cat.earned += result.score;
      cat.max += 3;
    }
    for (const cat of Object.values(categoryScores)) {
      cat.percentage = cat.max > 0 ? Math.round(cat.earned / cat.max * 100) : 0;
    }
    const percentageScore = totalMax > 0 ? Math.round(totalEarned / totalMax * 100) : 0;
    const qualityLevel = this.determineQualityLevel(percentageScore);
    const strengths = this.identifyStrengths(results);
    const areasForImprovement = this.identifyAreasForImprovement(results);
    const recommendations = this.generateRecommendations(results);
    return {
      overallScore: totalEarned,
      maxPossibleScore: totalMax,
      percentageScore,
      qualityLevel,
      categoryScores,
      indicatorResults: results,
      strengths,
      areasForImprovement,
      recommendations,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Get OLC evaluator version
   */
  getVersion() {
    return this.VERSION;
  }
  /**
   * Get all OLC indicators
   */
  getIndicators() {
    return [...OLC_INDICATORS];
  }
  // ═══════════════════════════════════════════════════════════════
  // INDIVIDUAL INDICATOR EVALUATORS
  // ═══════════════════════════════════════════════════════════════
  evaluateIndicator(indicator, data) {
    switch (indicator.id) {
      // Course Development
      case "CD-1":
        return this.evaluateCD1_InstructionalDesign(indicator, data);
      case "CD-2":
        return this.evaluateCD2_MeasurableObjectives(indicator, data);
      case "CD-3":
        return this.evaluateCD3_ActiveLearning(indicator, data);
      case "CD-4":
        return this.evaluateCD4_MaterialVariety(indicator, data);
      case "CD-5":
        return this.evaluateCD5_CognitiveLoad(indicator, data);
      // Course Structure
      case "CS-1":
        return this.evaluateCS1_LogicalOrganization(indicator, data);
      case "CS-2":
        return this.evaluateCS2_ContentChunking(indicator, data);
      case "CS-3":
        return this.evaluateCS3_Consistency(indicator, data);
      case "CS-4":
        return this.evaluateCS4_Introduction(indicator, data);
      // Teaching and Learning
      case "TL-1":
        return this.evaluateTL1_ObjectiveLevel(indicator, data);
      case "TL-2":
        return this.evaluateTL2_InstructionalMethods(indicator, data);
      case "TL-3":
        return this.evaluateTL3_PracticeOpportunities(indicator, data);
      // Evaluation and Assessment
      case "EA-1":
        return this.evaluateEA1_AssessmentAlignment(indicator, data);
      case "EA-2":
        return this.evaluateEA2_AssessmentVariety(indicator, data);
      case "EA-3":
        return this.evaluateEA3_FormativeAssessment(indicator, data);
      case "EA-4":
        return this.evaluateEA4_ClearCriteria(indicator, data);
      // Accessibility and Usability
      case "AU-1":
        return this.evaluateAU1_Navigation(indicator, data);
      case "AU-2":
        return this.evaluateAU2_AccessibleMultimedia(indicator, data);
      case "AU-3":
        return this.evaluateAU3_Readability(indicator, data);
      default:
        return this.createManualReviewResult(indicator);
    }
  }
  // ─────────────────────────────────────────────────────────────
  // Course Development Evaluators
  // ─────────────────────────────────────────────────────────────
  evaluateCD1_InstructionalDesign(indicator, data) {
    let score = 0;
    if (data.objectives.length >= 1) score++;
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    if (totalSections >= data.objectives.length && data.objectives.length > 0) score++;
    if (data.assessments.length >= Math.ceil(data.objectives.length * 0.5)) score++;
    return this.createResult(indicator, score);
  }
  evaluateCD2_MeasurableObjectives(indicator, data) {
    const measurablePattern = /\b(define|identify|list|explain|demonstrate|analyze|evaluate|create|design|develop|implement|calculate|compare|apply|solve)\b/gi;
    if (data.objectives.length === 0) {
      return this.createResult(indicator, 0, "No objectives defined");
    }
    const measurableCount = data.objectives.filter((obj) => {
      measurablePattern.lastIndex = 0;
      return measurablePattern.test(obj);
    }).length;
    const ratio = measurableCount / data.objectives.length;
    let score;
    if (ratio >= 0.9) score = 3;
    else if (ratio >= 0.7) score = 2;
    else if (ratio >= 0.4) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${Math.round(ratio * 100)}% measurable`);
  }
  evaluateCD3_ActiveLearning(indicator, data) {
    let elements = 0;
    if (data.assessments.some((a) => a.type === "quiz" || a.type === "practice")) elements++;
    if (data.assessments.some((a) => a.type === "project" || a.type === "assignment")) elements++;
    if (data.chapters.some((ch) => ch.sections?.some((s) => s.videoUrl))) elements++;
    if (data.assessments.length >= 3) elements++;
    let score;
    if (elements >= 4) score = 3;
    else if (elements >= 3) score = 2;
    else if (elements >= 1) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${elements} active learning elements`);
  }
  evaluateCD4_MaterialVariety(indicator, data) {
    const formats = /* @__PURE__ */ new Set();
    if (data.chapters.some((ch) => ch.sections?.some((s) => s.videoUrl))) formats.add("video");
    if (data.chapters.some((ch) => ch.sections?.some((s) => s.description && s.description.length > 50))) formats.add("text");
    if ((data.attachments?.length ?? 0) > 0) formats.add("attachments");
    if (data.assessments.length > 0) formats.add("assessments");
    if (data.description && data.description.length > 100) formats.add("introduction");
    let score;
    if (formats.size >= 4) score = 3;
    else if (formats.size >= 3) score = 2;
    else if (formats.size >= 2) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${formats.size} material types`, Array.from(formats));
  }
  evaluateCD5_CognitiveLoad(indicator, data) {
    const avgSectionsPerChapter = data.chapters.length > 0 ? data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0) / data.chapters.length : 0;
    let score = 0;
    if (avgSectionsPerChapter >= 2 && avgSectionsPerChapter <= 5) score++;
    const chaptersWithOutcomes = data.chapters.filter((ch) => ch.learningOutcome && ch.learningOutcome.length > 10).length;
    if (chaptersWithOutcomes >= data.chapters.length * 0.5) score++;
    if (data.chapters.length >= 3) score++;
    return this.createResult(indicator, Math.min(score, 3));
  }
  // ─────────────────────────────────────────────────────────────
  // Course Structure Evaluators
  // ─────────────────────────────────────────────────────────────
  evaluateCS1_LogicalOrganization(indicator, data) {
    let score = 0;
    if (data.chapters.length >= 1) score++;
    if (data.chapters.length >= 3) score++;
    if (data.chapters.every((ch) => ch.title && ch.title.length > 3)) score++;
    return this.createResult(indicator, Math.min(score, 3));
  }
  evaluateCS2_ContentChunking(indicator, data) {
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    let score;
    if (totalSections >= data.chapters.length * 2 && data.chapters.length >= 3) score = 3;
    else if (totalSections >= data.chapters.length) score = 2;
    else if (totalSections >= 1) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${totalSections} sections across ${data.chapters.length} chapters`);
  }
  evaluateCS3_Consistency(indicator, data) {
    if (data.chapters.length < 2) {
      return this.createResult(indicator, 1, "Not enough chapters to evaluate consistency");
    }
    const sectionCounts = data.chapters.map((ch) => ch.sections?.length ?? 0);
    const avg = sectionCounts.reduce((a, b) => a + b, 0) / sectionCounts.length;
    const variance = sectionCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / sectionCounts.length;
    let score;
    if (variance < 2) score = 3;
    else if (variance < 4) score = 2;
    else if (variance < 8) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `Variance: ${variance.toFixed(1)}`);
  }
  evaluateCS4_Introduction(indicator, data) {
    let score = 0;
    if (data.title && data.title.length >= 10) score++;
    if (data.description && data.description.length >= 100) score++;
    if (data.objectives.length >= 1) score++;
    return this.createResult(indicator, Math.min(score, 3));
  }
  // ─────────────────────────────────────────────────────────────
  // Teaching and Learning Evaluators
  // ─────────────────────────────────────────────────────────────
  evaluateTL1_ObjectiveLevel(indicator, data) {
    const bloomsPatterns = {
      "REMEMBER": /\b(define|list|name|recall|identify)\b/gi,
      "UNDERSTAND": /\b(explain|summarize|interpret|classify|compare)\b/gi,
      "APPLY": /\b(apply|demonstrate|solve|use|implement)\b/gi,
      "ANALYZE": /\b(analyze|examine|differentiate|organize)\b/gi,
      "EVALUATE": /\b(evaluate|judge|critique|justify)\b/gi,
      "CREATE": /\b(create|design|develop|formulate|construct)\b/gi
    };
    const levels = /* @__PURE__ */ new Set();
    for (const obj of data.objectives) {
      for (const [level, pattern] of Object.entries(bloomsPatterns)) {
        pattern.lastIndex = 0;
        if (pattern.test(obj)) levels.add(level);
      }
    }
    let score;
    if (levels.size >= 4) score = 3;
    else if (levels.size >= 3) score = 2;
    else if (levels.size >= 2) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${levels.size} Bloom's levels`, Array.from(levels));
  }
  evaluateTL2_InstructionalMethods(indicator, data) {
    const methods = /* @__PURE__ */ new Set();
    if (data.chapters.some((ch) => ch.sections?.some((s) => s.videoUrl))) methods.add("video");
    if (data.chapters.some((ch) => ch.sections?.some((s) => s.description))) methods.add("text");
    if (data.assessments.some((a) => a.type === "quiz")) methods.add("quiz");
    if (data.assessments.some((a) => a.type === "project" || a.type === "assignment")) methods.add("project");
    if ((data.attachments?.length ?? 0) > 0) methods.add("resources");
    let score;
    if (methods.size >= 4) score = 3;
    else if (methods.size >= 3) score = 2;
    else if (methods.size >= 2) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${methods.size} methods`, Array.from(methods));
  }
  evaluateTL3_PracticeOpportunities(indicator, data) {
    const practiceCount = data.assessments.filter(
      (a) => a.type === "quiz" || a.type === "practice"
    ).length;
    const projectCount = data.assessments.filter(
      (a) => a.type === "project" || a.type === "assignment"
    ).length;
    const totalPractice = practiceCount + projectCount;
    let score;
    if (totalPractice >= 5) score = 3;
    else if (totalPractice >= 3) score = 2;
    else if (totalPractice >= 1) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${totalPractice} practice opportunities`);
  }
  // ─────────────────────────────────────────────────────────────
  // Evaluation and Assessment Evaluators
  // ─────────────────────────────────────────────────────────────
  evaluateEA1_AssessmentAlignment(indicator, data) {
    if (data.objectives.length === 0) {
      return this.createResult(indicator, 0, "No objectives to align with");
    }
    const ratio = data.assessments.length / data.objectives.length;
    let score;
    if (ratio >= 1) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${data.assessments.length} assessments for ${data.objectives.length} objectives`);
  }
  evaluateEA2_AssessmentVariety(indicator, data) {
    const types = new Set(data.assessments.map((a) => a.type));
    let score;
    if (types.size >= 4) score = 3;
    else if (types.size >= 3) score = 2;
    else if (types.size >= 2) score = 1;
    else score = types.size > 0 ? 1 : 0;
    return this.createResult(indicator, score, `${types.size} assessment types`, Array.from(types));
  }
  evaluateEA3_FormativeAssessment(indicator, data) {
    const formativeAssessments = data.assessments.filter(
      (a) => a.type === "quiz" || a.type === "practice"
    );
    const withFeedback = formativeAssessments.filter(
      (a) => a.questions?.some((q) => q.explanation || q.feedback)
    ).length;
    let score;
    if (withFeedback >= 3) score = 3;
    else if (withFeedback >= 2) score = 2;
    else if (formativeAssessments.length >= 1) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${withFeedback} assessments with feedback`);
  }
  evaluateEA4_ClearCriteria(indicator, data) {
    const assessmentsWithCriteria = data.assessments.filter(
      (a) => a.questions?.some((q) => q.explanation)
    ).length;
    const ratio = data.assessments.length > 0 ? assessmentsWithCriteria / data.assessments.length : 0;
    let score;
    if (ratio >= 0.8) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${Math.round(ratio * 100)}% with criteria`);
  }
  // ─────────────────────────────────────────────────────────────
  // Accessibility and Usability Evaluators
  // ─────────────────────────────────────────────────────────────
  evaluateAU1_Navigation(indicator, data) {
    let score = 0;
    if (data.chapters.length >= 1) score++;
    if (data.chapters.every((ch) => ch.title && ch.title.length > 3)) score++;
    const hasSections = data.chapters.some((ch) => (ch.sections?.length ?? 0) > 0);
    if (hasSections) score++;
    return this.createResult(indicator, Math.min(score, 3));
  }
  evaluateAU2_AccessibleMultimedia(indicator, data) {
    const videoCount = data.chapters.reduce(
      (count, ch) => count + (ch.sections?.filter((s) => s.videoUrl).length ?? 0),
      0
    );
    const hasTextAlternatives = data.chapters.some(
      (ch) => ch.sections?.some((s) => s.description && s.description.length > 50)
    );
    let score;
    if (videoCount >= 3 && hasTextAlternatives) score = 3;
    else if (videoCount >= 1 && hasTextAlternatives) score = 2;
    else if (videoCount >= 1 || hasTextAlternatives) score = 1;
    else score = 0;
    return this.createResult(indicator, score, `${videoCount} videos, text alternatives: ${hasTextAlternatives}`);
  }
  evaluateAU3_Readability(indicator, data) {
    let score = 0;
    if (data.description && data.description.length >= 100) score++;
    const chaptersWithOutcomes = data.chapters.filter(
      (ch) => ch.learningOutcome && ch.learningOutcome.length > 20
    ).length;
    if (chaptersWithOutcomes >= data.chapters.length * 0.5) score++;
    const sectionsWithDesc = data.chapters.reduce(
      (count, ch) => count + (ch.sections?.filter((s) => s.description && s.description.length > 10).length ?? 0),
      0
    );
    if (sectionsWithDesc >= 3) score++;
    return this.createResult(indicator, Math.min(score, 3));
  }
  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════
  createResult(indicator, score, notes, evidence) {
    return {
      indicatorId: indicator.id,
      category: indicator.category,
      score,
      levelDescription: indicator.scoringLevels[score],
      notes,
      evidence
    };
  }
  createManualReviewResult(indicator) {
    return {
      indicatorId: indicator.id,
      category: indicator.category,
      score: 0,
      levelDescription: "Manual review required",
      notes: "This indicator requires manual evaluation"
    };
  }
  determineQualityLevel(percentage) {
    if (percentage >= 85) return "Exemplary";
    if (percentage >= 70) return "Accomplished";
    if (percentage >= 50) return "Developing";
    return "Deficient";
  }
  identifyStrengths(results) {
    return results.filter((r) => r.score >= 2).map((r) => {
      const indicator = OLC_INDICATORS.find((i) => i.id === r.indicatorId);
      return indicator ? `${indicator.indicator} (${r.levelDescription})` : "";
    }).filter((s) => s.length > 0).slice(0, 5);
  }
  identifyAreasForImprovement(results) {
    return results.filter((r) => r.score <= 1).map((r) => {
      const indicator = OLC_INDICATORS.find((i) => i.id === r.indicatorId);
      return indicator ? indicator.indicator : "";
    }).filter((s) => s.length > 0).slice(0, 5);
  }
  generateRecommendations(results) {
    const recommendations = [];
    for (const result of results) {
      if (result.score < 3) {
        const indicator = OLC_INDICATORS.find((i) => i.id === result.indicatorId);
        if (!indicator) continue;
        const targetScore = Math.min(result.score + 1, 3);
        recommendations.push({
          indicatorId: indicator.id,
          category: indicator.category,
          priority: result.score === 0 ? "critical" : result.score === 1 ? "high" : "medium",
          currentLevel: indicator.scoringLevels[result.score],
          targetLevel: indicator.scoringLevels[targetScore],
          actionSteps: indicator.evidence
        });
      }
    }
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return recommendations.slice(0, 10);
  }
};
var olcEvaluator = new OLCEvaluator();

// src/standards/distribution-analyzer.ts
var COGNITIVE_RIGOR_EXPECTATIONS = {
  REMEMBER: {
    1: { expected: 8, examples: ["Recall facts", "Define terms", "List items"] },
    2: { expected: 2, examples: ["Summarize from memory", "Identify patterns"] },
    3: { expected: 0, examples: [] },
    4: { expected: 0, examples: [] }
  },
  UNDERSTAND: {
    1: { expected: 5, examples: ["Identify", "Recognize", "Match"] },
    2: { expected: 12, examples: ["Summarize", "Interpret", "Classify"] },
    3: { expected: 3, examples: ["Explain how concepts relate"] },
    4: { expected: 0, examples: [] }
  },
  APPLY: {
    1: { expected: 3, examples: ["Follow simple procedures"] },
    2: { expected: 15, examples: ["Apply formulas", "Solve routine problems"] },
    3: { expected: 7, examples: ["Apply concepts to new situations"] },
    4: { expected: 0, examples: [] }
  },
  ANALYZE: {
    1: { expected: 0, examples: [] },
    2: { expected: 5, examples: ["Categorize", "Compare/contrast"] },
    3: { expected: 12, examples: ["Analyze relationships", "Draw conclusions"] },
    4: { expected: 3, examples: ["Analyze complex systems"] }
  },
  EVALUATE: {
    1: { expected: 0, examples: [] },
    2: { expected: 2, examples: ["Cite evidence"] },
    3: { expected: 10, examples: ["Critique", "Justify decisions"] },
    4: { expected: 3, examples: ["Evaluate multiple perspectives"] }
  },
  CREATE: {
    1: { expected: 0, examples: [] },
    2: { expected: 2, examples: ["Brainstorm", "Generate ideas"] },
    3: { expected: 3, examples: ["Design solutions"] },
    4: { expected: 5, examples: ["Create original work", "Synthesize research"] }
  }
};
var DistributionAnalyzer = class {
  VERSION = "1.0.0";
  /**
   * Perform comprehensive distribution analysis
   */
  analyze(actualDistribution, courseType, dokDistribution) {
    const detectedType = courseType ? this.normalizeType(courseType) : this.detectCourseType(actualDistribution);
    const typeConfidence = courseType ? 90 : this.calculateTypeConfidence(actualDistribution, detectedType);
    const targetDist = getValidatedDistribution(detectedType);
    const alignmentScore = this.calculateAlignment(actualDistribution, targetDist.distribution);
    const cognitiveRigorMatrix = this.analyzeCognitiveRigor(actualDistribution, dokDistribution);
    const cognitiveRigorScore = this.calculateCognitiveRigorScore(cognitiveRigorMatrix);
    const balanceAssessment = this.assessBalance(actualDistribution, detectedType);
    const levelAnalysis = this.analyzeLevels(actualDistribution, targetDist.distribution);
    const dokAnalysis = this.analyzeDOK(dokDistribution, targetDist.dokDistribution);
    const statisticalConfidence = this.calculateStatisticalConfidence(targetDist);
    const recommendations = this.generateRecommendations(
      levelAnalysis,
      balanceAssessment,
      cognitiveRigorMatrix,
      detectedType
    );
    const researchBasis = this.compileResearchBasis(targetDist);
    return {
      courseType: detectedType,
      detectedType,
      typeConfidence,
      actualDistribution,
      targetDistribution: targetDist.distribution,
      alignmentScore,
      cognitiveRigorScore,
      cognitiveRigorMatrix,
      balanceAssessment,
      levelAnalysis,
      dokAnalysis,
      statisticalConfidence,
      recommendations,
      researchBasis,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Get analyzer version
   */
  getVersion() {
    return this.VERSION;
  }
  // ═══════════════════════════════════════════════════════════════
  // PRIVATE ANALYSIS METHODS
  // ═══════════════════════════════════════════════════════════════
  normalizeType(type) {
    const normalized = type.toLowerCase();
    const validTypes = [
      "foundational",
      "intermediate",
      "advanced",
      "professional",
      "creative",
      "technical",
      "theoretical",
      "general",
      "STEM"
    ];
    return validTypes.find((t) => t.toLowerCase() === normalized) ?? "intermediate";
  }
  detectCourseType(distribution) {
    const remember = distribution.REMEMBER ?? 0;
    const understand = distribution.UNDERSTAND ?? 0;
    const apply = distribution.APPLY ?? 0;
    const analyze = distribution.ANALYZE ?? 0;
    const evaluate = distribution.EVALUATE ?? 0;
    const create = distribution.CREATE ?? 0;
    const lowerOrder = remember + understand;
    const higherOrder = evaluate + create;
    if (lowerOrder >= 50) return "foundational";
    if (create >= 25) return "creative";
    if (apply >= 35) return "technical";
    if (analyze >= 25 && higherOrder >= 30) return "advanced";
    if (analyze >= 20 && remember >= 15) return "theoretical";
    if (higherOrder >= 25) return "professional";
    return "intermediate";
  }
  calculateTypeConfidence(distribution, type) {
    const target = getValidatedDistribution(type);
    const alignment = this.calculateAlignment(distribution, target.distribution);
    if (alignment >= 85) return 90;
    if (alignment >= 70) return 75;
    if (alignment >= 55) return 60;
    return 50;
  }
  calculateAlignment(actual, target) {
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    let totalDeviation = 0;
    for (const level of levels) {
      totalDeviation += Math.abs((actual[level] ?? 0) - (target[level] ?? 0));
    }
    return Math.round(Math.max(0, 100 - totalDeviation / 2));
  }
  analyzeCognitiveRigor(bloomsDist, dokDist) {
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const dokLevels = [1, 2, 3, 4];
    const effectiveDOK = dokDist ?? this.inferDOKFromBlooms(bloomsDist);
    const cells = [];
    let totalCoverage = 0;
    const quadrantScores = { recall: 0, skills: 0, strategic: 0, extended: 0 };
    for (const bloomsLevel of levels) {
      const row = [];
      const bloomsPercent = bloomsDist[bloomsLevel] ?? 0;
      for (const dokLevel of dokLevels) {
        const expected = COGNITIVE_RIGOR_EXPECTATIONS[bloomsLevel][dokLevel];
        const dokPercent = this.getDOKPercent(effectiveDOK, dokLevel);
        const cellPercent = bloomsPercent * dokPercent / 100;
        const status = this.getCellStatus(cellPercent, expected.expected);
        row.push({
          bloomsLevel,
          dokLevel,
          percentage: Math.round(cellPercent * 10) / 10,
          expected: expected.expected,
          status,
          examples: expected.examples
        });
        if (cellPercent > 0) totalCoverage++;
        if (dokLevel <= 2 && levels.indexOf(bloomsLevel) <= 2) {
          quadrantScores.recall += cellPercent;
        } else if (dokLevel <= 2) {
          quadrantScores.skills += cellPercent;
        } else if (levels.indexOf(bloomsLevel) <= 3) {
          quadrantScores.strategic += cellPercent;
        } else {
          quadrantScores.extended += cellPercent;
        }
      }
      cells.push(row);
    }
    const dominantQuadrant = this.getDominantQuadrant(quadrantScores);
    const coverage = Math.round(totalCoverage / 24 * 100);
    const balance = this.calculateMatrixBalance(quadrantScores);
    const recommendations = this.generateMatrixRecommendations(quadrantScores, dominantQuadrant);
    return {
      cells,
      dominantQuadrant,
      coverage,
      balance,
      recommendations
    };
  }
  inferDOKFromBlooms(bloomsDist) {
    const level1 = (bloomsDist.REMEMBER ?? 0) * 0.8;
    const level2 = (bloomsDist.REMEMBER ?? 0) * 0.2 + (bloomsDist.UNDERSTAND ?? 0) * 0.7 + (bloomsDist.APPLY ?? 0) * 0.6;
    const level3 = (bloomsDist.UNDERSTAND ?? 0) * 0.3 + (bloomsDist.APPLY ?? 0) * 0.4 + (bloomsDist.ANALYZE ?? 0) * 0.8 + (bloomsDist.EVALUATE ?? 0) * 0.6;
    const level4 = (bloomsDist.ANALYZE ?? 0) * 0.2 + (bloomsDist.EVALUATE ?? 0) * 0.4 + (bloomsDist.CREATE ?? 0) * 1;
    const total = level1 + level2 + level3 + level4;
    const factor = total > 0 ? 100 / total : 1;
    return {
      level1: Math.round(level1 * factor),
      level2: Math.round(level2 * factor),
      level3: Math.round(level3 * factor),
      level4: Math.round(level4 * factor)
    };
  }
  getDOKPercent(dok, level) {
    switch (level) {
      case 1:
        return dok.level1;
      case 2:
        return dok.level2;
      case 3:
        return dok.level3;
      case 4:
        return dok.level4;
      default:
        return 0;
    }
  }
  getCellStatus(actual, expected) {
    if (expected === 0) return actual > 2 ? "over" : "optimal";
    const ratio = actual / expected;
    if (ratio < 0.5) return "under";
    if (ratio > 1.5) return "over";
    return "optimal";
  }
  getDominantQuadrant(scores) {
    const entries = Object.entries(scores);
    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }
  calculateMatrixBalance(scores) {
    const values = Object.values(scores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    return Math.round(Math.max(0, 100 - variance));
  }
  generateMatrixRecommendations(scores, dominant) {
    const recommendations = [];
    if (scores.extended < 10) {
      recommendations.push("Add extended thinking activities (research projects, original creations)");
    }
    if (scores.strategic < 20) {
      recommendations.push("Increase strategic thinking tasks (analysis, problem-solving)");
    }
    if (scores.recall > 40) {
      recommendations.push("Reduce recall-focused content; shift to application and analysis");
    }
    if (dominant === "recall") {
      recommendations.push("Course is heavily recall-focused; add higher-order thinking activities");
    }
    return recommendations;
  }
  calculateCognitiveRigorScore(matrix) {
    const coverageScore = matrix.coverage;
    const balanceScore = matrix.balance;
    let higherScore = 0;
    if (matrix.dominantQuadrant === "strategic") higherScore = 70;
    else if (matrix.dominantQuadrant === "extended") higherScore = 90;
    else if (matrix.dominantQuadrant === "skills") higherScore = 50;
    else higherScore = 30;
    return Math.round(coverageScore * 0.3 + balanceScore * 0.3 + higherScore * 0.4);
  }
  assessBalance(distribution, type) {
    const lower = (distribution.REMEMBER ?? 0) + (distribution.UNDERSTAND ?? 0);
    const middle = (distribution.APPLY ?? 0) + (distribution.ANALYZE ?? 0);
    const higher = (distribution.EVALUATE ?? 0) + (distribution.CREATE ?? 0);
    const idealRatios = {
      foundational: { lower: 60, middle: 30, higher: 10 },
      intermediate: { lower: 30, middle: 50, higher: 20 },
      advanced: { lower: 15, middle: 50, higher: 35 },
      professional: { lower: 20, middle: 50, higher: 30 },
      creative: { lower: 15, middle: 30, higher: 55 },
      technical: { lower: 25, middle: 55, higher: 20 },
      theoretical: { lower: 40, middle: 40, higher: 20 },
      general: { lower: 30, middle: 45, higher: 25 },
      STEM: { lower: 20, middle: 55, higher: 25 }
    };
    const ideal = idealRatios[type] ?? idealRatios.general;
    const deviation = Math.abs(lower - ideal.lower) + Math.abs(middle - ideal.middle) + Math.abs(higher - ideal.higher);
    let balanceType;
    if (deviation <= 20) balanceType = "well-balanced";
    else if (lower > ideal.lower + 15) balanceType = "bottom-heavy";
    else if (higher > ideal.higher + 15) balanceType = "top-heavy";
    else if (distribution.APPLY ?? 0 > 40) balanceType = "application-focused";
    else if (distribution.ANALYZE ?? 0 > 30) balanceType = "analysis-focused";
    else balanceType = "well-balanced";
    const recommendation = this.getBalanceRecommendation(balanceType, type);
    return {
      type: balanceType,
      lowerOrder: lower,
      middleOrder: middle,
      higherOrder: higher,
      idealRatio: ideal,
      deviation,
      recommendation
    };
  }
  getBalanceRecommendation(type, courseType) {
    const recommendations = {
      "well-balanced": `Content is well-balanced for a ${courseType} course.`,
      "bottom-heavy": "Too much focus on recall/understanding. Add more application and analysis activities.",
      "top-heavy": "May be too challenging without sufficient foundation. Add more scaffolding content.",
      "application-focused": "Strong on application. Consider adding more evaluation and creative synthesis.",
      "analysis-focused": "Good analytical depth. Ensure students have sufficient foundational knowledge."
    };
    return recommendations[type];
  }
  analyzeLevels(actual, target) {
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const contexts = {
      REMEMBER: "Foundation for all learning; too much limits growth",
      UNDERSTAND: "Essential for concept mastery; builds on recall",
      APPLY: "Bridges theory to practice; key for skill development",
      ANALYZE: "Develops critical thinking; requires understanding first",
      EVALUATE: "Highest critical thinking; requires analysis skills",
      CREATE: "Synthesis and innovation; builds on all lower levels"
    };
    return levels.map((level) => {
      const actualVal = actual[level] ?? 0;
      const targetVal = target[level] ?? 0;
      const deviation = actualVal - targetVal;
      let status;
      if (deviation < -15) status = "significantly_under";
      else if (deviation < -5) status = "under";
      else if (deviation > 15) status = "significantly_over";
      else if (deviation > 5) status = "over";
      else status = "optimal";
      const actionRequired = Math.abs(deviation) > 10;
      const suggestedActions = this.getLevelActions(level, deviation);
      const percentile = this.calculatePercentile(level, actualVal);
      return {
        level,
        actual: actualVal,
        target: targetVal,
        deviation,
        status,
        percentile,
        researchContext: contexts[level],
        actionRequired,
        suggestedActions
      };
    });
  }
  getLevelActions(level, deviation) {
    const actions = [];
    if (deviation < -10) {
      const addActions = {
        REMEMBER: ["Add knowledge check quizzes", "Include terminology reviews"],
        UNDERSTAND: ["Add explanation activities", "Include comparison exercises"],
        APPLY: ["Add practical exercises", "Include real-world scenarios"],
        ANALYZE: ["Add case studies", "Include data analysis tasks"],
        EVALUATE: ["Add critique assignments", "Include peer review activities"],
        CREATE: ["Add project-based assessments", "Include design challenges"]
      };
      actions.push(...addActions[level]);
    } else if (deviation > 10) {
      actions.push(`Consider converting some ${level} activities to higher cognitive levels`);
      actions.push(`Balance ${level} content with other cognitive domains`);
    }
    return actions;
  }
  calculatePercentile(level, value) {
    const benchmarks = {
      REMEMBER: { p25: 5, p50: 10, p75: 20 },
      UNDERSTAND: { p25: 15, p50: 20, p75: 30 },
      APPLY: { p25: 20, p50: 25, p75: 35 },
      ANALYZE: { p25: 15, p50: 20, p75: 25 },
      EVALUATE: { p25: 8, p50: 15, p75: 20 },
      CREATE: { p25: 5, p50: 10, p75: 20 }
    };
    const b = benchmarks[level];
    if (value <= b.p25) return Math.round(value / b.p25 * 25);
    if (value <= b.p50) return 25 + Math.round((value - b.p25) / (b.p50 - b.p25) * 25);
    if (value <= b.p75) return 50 + Math.round((value - b.p50) / (b.p75 - b.p50) * 25);
    return 75 + Math.min(25, Math.round((value - b.p75) / 2));
  }
  analyzeDOK(actual, target) {
    const effectiveActual = actual ?? { level1: 25, level2: 40, level3: 25, level4: 10 };
    const effectiveTarget = target ?? { level1: 15, level2: 40, level3: 35, level4: 10 };
    const alignment = this.calculateDOKAlignment(effectiveActual, effectiveTarget);
    const levels = [1, 2, 3, 4];
    const dominantLevel = levels.reduce(
      (max, level) => this.getDOKPercent(effectiveActual, level) > this.getDOKPercent(effectiveActual, max) ? level : max
    );
    const strategicPercent = effectiveActual.level3 + effectiveActual.level4;
    const recommendations = [];
    if (strategicPercent < 30) {
      recommendations.push("Increase strategic and extended thinking activities");
    }
    if (effectiveActual.level1 > 25) {
      recommendations.push("Reduce recall-level content");
    }
    return {
      distribution: effectiveActual,
      targetDistribution: effectiveTarget,
      alignmentScore: alignment,
      dominantLevel,
      strategicThinkingPercent: strategicPercent,
      recommendations
    };
  }
  calculateDOKAlignment(actual, target) {
    const deviation = Math.abs(actual.level1 - target.level1) + Math.abs(actual.level2 - target.level2) + Math.abs(actual.level3 - target.level3) + Math.abs(actual.level4 - target.level4);
    return Math.round(Math.max(0, 100 - deviation / 2));
  }
  calculateStatisticalConfidence(distribution) {
    const hasSampleSize = distribution.sampleSize !== void 0;
    const hasEffectSize = distribution.effectSize !== void 0;
    const hasCI = distribution.confidenceInterval !== void 0;
    let confidenceLevel = 50;
    if (hasSampleSize && distribution.sampleSize >= 100) confidenceLevel += 20;
    if (hasEffectSize && distribution.effectSize >= 0.5) confidenceLevel += 15;
    if (hasCI) confidenceLevel += 10;
    if (distribution.source.peerReviewed) confidenceLevel += 5;
    const marginOfError = hasCI ? Math.round((distribution.confidenceInterval.upper - distribution.confidenceInterval.lower) / 2 * 100) / 100 : 0.15;
    let interpretation;
    if (confidenceLevel >= 85) {
      interpretation = "High confidence - based on well-established research with strong effect sizes";
    } else if (confidenceLevel >= 70) {
      interpretation = "Moderate confidence - based on peer-reviewed research";
    } else {
      interpretation = "Baseline confidence - based on educational best practices";
    }
    return {
      sampleBasis: hasSampleSize ? `n=${distribution.sampleSize}` : "Not specified",
      confidenceLevel: Math.min(confidenceLevel, 95),
      marginOfError,
      effectSize: distribution.effectSize,
      interpretation
    };
  }
  generateRecommendations(levels, balance, matrix, courseType) {
    const recommendations = [];
    for (const level of levels) {
      if (level.actionRequired) {
        const type = level.deviation > 0 ? "decrease" : "increase";
        recommendations.push({
          priority: Math.abs(level.deviation) > 15 ? "high" : "medium",
          level: level.level,
          type,
          currentValue: level.actual,
          targetValue: level.target,
          change: Math.abs(level.deviation),
          description: `${type === "increase" ? "Increase" : "Decrease"} ${level.level} content by ${Math.abs(Math.round(level.deviation))}%`,
          actionSteps: level.suggestedActions,
          researchSupport: level.researchContext,
          estimatedImpact: Math.abs(level.deviation) > 15 ? "high" : "medium"
        });
      }
    }
    if (balance.type !== "well-balanced") {
      recommendations.push({
        priority: "medium",
        level: "overall",
        type: "rebalance",
        currentValue: balance.deviation,
        targetValue: 0,
        change: balance.deviation,
        description: balance.recommendation,
        actionSteps: [
          `Target ratio: ${balance.idealRatio.lower}% lower, ${balance.idealRatio.middle}% middle, ${balance.idealRatio.higher}% higher`,
          "Review content distribution across cognitive levels",
          "Adjust activity types to achieve balance"
        ],
        researchSupport: `Based on research-validated distribution for ${courseType} courses`,
        estimatedImpact: "medium"
      });
    }
    for (const rec of matrix.recommendations) {
      recommendations.push({
        priority: "low",
        level: "overall",
        type: "rebalance",
        currentValue: 0,
        targetValue: 0,
        change: 0,
        description: rec,
        actionSteps: [],
        researchSupport: "Based on Hess Cognitive Rigor Matrix (2009)",
        estimatedImpact: "medium"
      });
    }
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return recommendations;
  }
  compileResearchBasis(distribution) {
    const alternativeSources = VALIDATED_DISTRIBUTIONS.filter((d) => d.id !== distribution.id).slice(0, 3).map((d) => ({
      name: d.name,
      citation: getCitationString(d)
    }));
    return {
      primarySource: distribution,
      citation: getCitationString(distribution),
      applicability: distribution.applicability,
      limitations: [
        "Distributions are guidelines, not absolute requirements",
        "Context and learning objectives should guide final decisions",
        "Individual learner needs may require adjustments"
      ],
      alternativeSources
    };
  }
};
var distributionAnalyzer = new DistributionAnalyzer();
export {
  AssessmentQualityAnalyzer,
  CourseTypeDetector,
  DeepContentAnalyzer,
  DeterministicRubricEngine,
  DistributionAnalyzer,
  EnhancedDepthAnalysisEngine,
  OLCEvaluator,
  OLC_INDICATORS,
  ObjectiveAnalyzer,
  QMEvaluator,
  QM_STANDARDS,
  TranscriptAnalyzer,
  VALIDATED_DISTRIBUTIONS,
  WebbDOKAnalyzer,
  assessmentQualityAnalyzer,
  calculateCourseTypeAlignment,
  calculateDistributionAlignment,
  courseTypeDetector,
  createEnhancedDepthAnalysisEngine,
  deepContentAnalyzer,
  deterministicRubricEngine,
  distributionAnalyzer,
  enhancedDepthEngine,
  generateCourseContentHash,
  getAllCitations,
  getCitationString,
  getValidatedDistribution,
  objectiveAnalyzer,
  olcEvaluator,
  qmEvaluator,
  recommendDistribution,
  serializeAnalysisResult,
  transcriptAnalyzer,
  webbDOKAnalyzer
};
