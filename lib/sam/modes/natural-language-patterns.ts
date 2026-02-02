/**
 * Natural Language Patterns for Mode Classification
 *
 * Expanded natural language dictionaries for all 30 SAM modes.
 * These patterns capture conversational intent beyond simple keyword matching,
 * covering how users naturally express their needs.
 */

interface WeightedKeyword {
  pattern: RegExp;
  weight: number;
}

/**
 * Natural language patterns for all 30 SAM modes.
 * Each pattern is a regex with a weight (higher = stronger signal).
 */
export const NATURAL_LANGUAGE_VOCABULARIES: Record<string, WeightedKeyword[]> = {
  // ========================================================================
  // GENERAL
  // ========================================================================
  'general-assistant': [
    { pattern: /^(hi|hello|hey)\b/i, weight: 1 },
    { pattern: /\bhelp me\b/i, weight: 0.5 },
  ],

  // ========================================================================
  // CONTENT
  // ========================================================================
  'content-creator': [
    { pattern: /\b(write|draft|compose|author)\s+(a|an|some|the)\s+\w+/i, weight: 2 },
    { pattern: /\bcreate\s+(a\s+)?(lesson|module|material|content|outline)/i, weight: 2.5 },
    { pattern: /\bhelp me (write|create|develop|design)\b/i, weight: 2 },
    { pattern: /\bI need (a|an|some) (lesson|module|explanation|material)/i, weight: 2 },
  ],
  'adaptive-content': [
    { pattern: /\badapt (this|the|my) (content|material|lesson)/i, weight: 2.5 },
    { pattern: /\b(too|very) (easy|hard|difficult|simple|complex) for me\b/i, weight: 2 },
    { pattern: /\b(simplif|adjust|modify)\w* (the )?(difficulty|level|complexity)/i, weight: 2.5 },
    { pattern: /\bpersonalize (this|the|my)/i, weight: 2 },
    { pattern: /\bnot (at )?(my|the right) (level|pace|speed)\b/i, weight: 2 },
  ],
  'microlearning': [
    { pattern: /\b(quick|short|brief|bite-?sized?) (lesson|overview|summary|explanation)/i, weight: 2.5 },
    { pattern: /\b(5|five|ten|10)\s*min(ute)?\s*(lesson|overview|summary)/i, weight: 2 },
    { pattern: /\bI (only )?have (a few|limited|\d+) minutes/i, weight: 2 },
    { pattern: /\bgive me (the )?(key|main|essential) (points|takeaways|concepts)/i, weight: 2 },
  ],
  'multimedia': [
    { pattern: /\b(video|audio|visual|diagram|infographic|animation)/i, weight: 2 },
    { pattern: /\bcan you (show|illustrate|visualize|draw|diagram)/i, weight: 2 },
    { pattern: /\bI (learn|understand) better (with|through) (visuals|videos|pictures)/i, weight: 2.5 },
    { pattern: /\b(image|picture|chart|graph) (of|for|about)/i, weight: 1.5 },
  ],

  // ========================================================================
  // ANALYSIS
  // ========================================================================
  'blooms-analyzer': [
    { pattern: /\bwhat (cognitive|bloom'?s?) level/i, weight: 2.5 },
    { pattern: /\banalyze (the )?(cognitive|bloom'?s?|learning) (level|depth|complexity)/i, weight: 3 },
    { pattern: /\bhow deep(ly)? does (this|the) (cover|teach|address)/i, weight: 2 },
    { pattern: /\b(higher|lower)\s*order\s*thinking/i, weight: 2.5 },
  ],
  'depth-analysis': [
    { pattern: /\bhow (deep|thorough|comprehensive) (is|does)/i, weight: 2 },
    { pattern: /\b(depth|rigor|sophistication) (of|analysis)/i, weight: 2.5 },
    { pattern: /\bwebb'?s?\s*depth/i, weight: 3 },
    { pattern: /\bsolo\s*taxonomy/i, weight: 3 },
  ],
  'cognitive-load': [
    { pattern: /\b(overwhelm|overload|too much) (information|content|material)/i, weight: 2.5 },
    { pattern: /\bcognitive (load|overload|demand)/i, weight: 3 },
    { pattern: /\b(this|it) is (too )?(complex|overwhelming|dense)/i, weight: 2 },
    { pattern: /\bsimplify|break (it )?(down|up|into)/i, weight: 1.5 },
  ],
  'alignment-checker': [
    { pattern: /\b(align|match|map) (with|to) (the )?(objective|standard|outcome|goal)/i, weight: 2.5 },
    { pattern: /\bdoes (this|the) (content|lesson|material) (align|match|meet)/i, weight: 2 },
    { pattern: /\b(curriculum|standard|framework) alignment/i, weight: 3 },
    { pattern: /\bcommon\s*core|ngss|state\s*standard/i, weight: 2 },
  ],
  'scaffolding': [
    { pattern: /\bscaffold(ing|ed)?\b/i, weight: 3 },
    { pattern: /\bbuild up (to|from|gradually)/i, weight: 2 },
    { pattern: /\bstep[\s-]by[\s-]step (approach|guidance|instruction)/i, weight: 2 },
    { pattern: /\bgradual(ly)? (increase|build|add) (complexity|difficulty)/i, weight: 2.5 },
  ],
  'zpd-evaluator': [
    { pattern: /\bzone of proximal development/i, weight: 3 },
    { pattern: /\b(zpd|vygotsky)/i, weight: 3 },
    { pattern: /\bjust (beyond|above) (my|the|current) (level|ability|understanding)/i, weight: 2 },
    { pattern: /\bwhat (can|should) I (learn|tackle) next/i, weight: 2 },
  ],

  // ========================================================================
  // LEARNING
  // ========================================================================
  'learning-coach': [
    { pattern: /\bI('m| am) (struggling|stuck|lost|confused|having trouble)/i, weight: 2.5 },
    { pattern: /\bwhere (do|should) I start/i, weight: 2 },
    { pattern: /\bthis (is|seems) (too )?(hard|difficult|overwhelming|confusing)/i, weight: 2 },
    { pattern: /\bhow (can|do) I (learn|study|improve|get better)/i, weight: 2 },
    { pattern: /\bwhat am I (doing|getting) wrong/i, weight: 2 },
    { pattern: /\bI (don'?t|do not) (understand|get) (this|it|the|why)/i, weight: 2 },
    { pattern: /\bcan you (explain|help me understand|clarify)/i, weight: 1.5 },
  ],
  'socratic-tutor': [
    { pattern: /\bhelp me (think|figure|work) (through|out)/i, weight: 2.5 },
    { pattern: /\bdon'?t (just )?(give|tell) me (the )?answer/i, weight: 3 },
    { pattern: /\bwalk me through/i, weight: 2 },
    { pattern: /\bI want to (understand|figure out) (why|how)/i, weight: 2 },
    { pattern: /\bstep by step/i, weight: 1.5 },
    { pattern: /\bwhat questions should I (ask|consider)/i, weight: 2 },
    { pattern: /\bguide me (through|to)/i, weight: 2 },
    { pattern: /\bask me questions (to|about|instead)/i, weight: 2.5 },
  ],
  'study-planner': [
    { pattern: /\bplan (my|a) (study|learning|review) (session|schedule|routine)/i, weight: 2.5 },
    { pattern: /\bhow should I (prepare|study|organize) for/i, weight: 2 },
    { pattern: /\bI have (a|an) (exam|test|deadline) (in|on|next|coming)/i, weight: 2 },
    { pattern: /\bmake me a (study|learning|review) (plan|schedule)/i, weight: 3 },
  ],
  'mastery-tracker': [
    { pattern: /\bwhat (do|have) I (mastered|learned|know|understand)/i, weight: 2.5 },
    { pattern: /\b(show|check|track) (my )?(progress|mastery|understanding)/i, weight: 2 },
    { pattern: /\bhow (well )?am I doing/i, weight: 1.5 },
    { pattern: /\bwhat (topics|areas|concepts) (do I|should I) (review|work on|improve)/i, weight: 2 },
  ],
  'spaced-repetition': [
    { pattern: /\bwhen should I (review|revisit|practice|study) (this|these)/i, weight: 2.5 },
    { pattern: /\bspaced (repetition|review|practice)/i, weight: 3 },
    { pattern: /\bI keep (forgetting|losing|not remembering)/i, weight: 2 },
    { pattern: /\bhelp me (remember|retain|memorize)/i, weight: 2 },
  ],
  'metacognition': [
    { pattern: /\bhow (do|should) I (think about|approach|tackle) (learning|studying)/i, weight: 2.5 },
    { pattern: /\b(learning|study|thinking) strateg(y|ies)/i, weight: 2 },
    { pattern: /\bhow (can|do) I (learn|study) (more )?(effectively|efficiently|better)/i, weight: 2 },
    { pattern: /\breflect (on|about) (my|the) (learning|progress|understanding)/i, weight: 2.5 },
  ],
  'skill-tracker': [
    { pattern: /\bwhat skills (do I|have I|should I)/i, weight: 2.5 },
    { pattern: /\b(track|monitor|assess) (my )?(skills|competenc)/i, weight: 2 },
    { pattern: /\bskill (gap|assessment|map)/i, weight: 2.5 },
    { pattern: /\bhow proficient am I/i, weight: 2 },
  ],

  // ========================================================================
  // ASSESSMENT
  // ========================================================================
  'exam-builder': [
    { pattern: /\bmake (me )?(a|an|some) (quiz|test|exam|assessment)/i, weight: 3 },
    { pattern: /\bI need (practice )?questions (about|on|for)/i, weight: 2.5 },
    { pattern: /\btest my (knowledge|understanding) (of|on|about)/i, weight: 2.5 },
    { pattern: /\bcreate (an? )?(exam|quiz|test|assessment)/i, weight: 3 },
    { pattern: /\bgenerate\s+\d+\s+questions/i, weight: 2.5 },
  ],
  'practice-problems': [
    { pattern: /\bgive me (some |a )?(practice|more) (problems|exercises|questions)/i, weight: 2.5 },
    { pattern: /\bI (need|want) (to )?(practice|drill|exercise)/i, weight: 2 },
    { pattern: /\blet me (try|practice|work on) (some|a few|more)/i, weight: 2 },
    { pattern: /\bworked examples?\b/i, weight: 2 },
  ],
  'evaluation': [
    { pattern: /\bis (this|my answer|my response|my work) (correct|right|good|ok)/i, weight: 3 },
    { pattern: /\bcheck (this|my (work|answer|response|solution))/i, weight: 2.5 },
    { pattern: /\bwhat('s| is) wrong with (this|my)/i, weight: 2 },
    { pattern: /\bgrade (this|my|me)/i, weight: 2.5 },
    { pattern: /\b(evaluate|assess|review) (this|my) (answer|work|response|submission)/i, weight: 2.5 },
    { pattern: /\bhow (can|do) I improve (this|my)/i, weight: 1.5 },
  ],
  'integrity-checker': [
    { pattern: /\b(plagiar|academic integrity|citation check)/i, weight: 3 },
    { pattern: /\b(is|does) (this|it) (look like|seem like) (plagiar|copied|AI[\s-]generated)/i, weight: 2.5 },
    { pattern: /\bcheck (for|this for) (plagiar|original)/i, weight: 2.5 },
    { pattern: /\bAI[\s-]?(generated|written|content) (detection|check)/i, weight: 2.5 },
  ],

  // ========================================================================
  // RESEARCH
  // ========================================================================
  'research-assistant': [
    { pattern: /\bfind (me )?(research|studies|papers|evidence) (on|about|for)/i, weight: 2.5 },
    { pattern: /\bwhat does the research say/i, weight: 2 },
    { pattern: /\b(literature|systematic) review/i, weight: 3 },
    { pattern: /\bcite|citation|bibliography|reference list/i, weight: 2 },
  ],
  'resource-finder': [
    { pattern: /\b(find|recommend|suggest) (me )?(a|some) (resource|video|book|article|tutorial)/i, weight: 2.5 },
    { pattern: /\bwhere can I (learn|study|read|watch) (more )?(about|on)/i, weight: 2 },
    { pattern: /\bgood (resource|video|book|article|tutorial) (for|about|on)/i, weight: 2 },
    { pattern: /\bI want to (learn|read|watch) more about/i, weight: 1.5 },
  ],
  'trends-analyzer': [
    { pattern: /\bwhat (are the|is the) (latest|current|recent|new) trends/i, weight: 2.5 },
    { pattern: /\b(emerging|future|upcoming) (trends|developments|technologies)/i, weight: 2 },
    { pattern: /\bhow (is|has) (the field|this area|education) (chang|evolv)/i, weight: 2 },
    { pattern: /\btrend (analysis|report|data)/i, weight: 2.5 },
  ],

  // ========================================================================
  // COURSE DESIGN
  // ========================================================================
  'course-architect': [
    { pattern: /\bdesign (a|my|the) (course|curriculum|syllabus|program)/i, weight: 3 },
    { pattern: /\bhelp me (build|structure|organize) (a|my|the) course/i, weight: 2.5 },
    { pattern: /\bcourse (structure|outline|framework|architecture)/i, weight: 2.5 },
    { pattern: /\bbackward design/i, weight: 3 },
  ],
  'knowledge-graph': [
    { pattern: /\bshow (me )?(the )?(prerequisite|dependencies|relationship)/i, weight: 2 },
    { pattern: /\b(concept|knowledge) (map|graph|network)/i, weight: 3 },
    { pattern: /\bhow (does|do) (this|these) (concept|topic)s? relate/i, weight: 2 },
    { pattern: /\bwhat (should|do) I (need to )?know (before|first)/i, weight: 2 },
  ],
  'competency-mapper': [
    { pattern: /\bcompetenc(y|ies) (map|framework|matrix|model)/i, weight: 3 },
    { pattern: /\bmap (skills|competencies) (to|against|with)/i, weight: 2.5 },
    { pattern: /\blearning (outcomes?|objectives?) (map|alignment)/i, weight: 2 },
    { pattern: /\bwhat competencies (does|should)/i, weight: 2 },
  ],

  // ========================================================================
  // INSIGHTS
  // ========================================================================
  'analytics': [
    { pattern: /\b(show|view|see|get) (my )?(analytics|data|metrics|statistics)/i, weight: 2.5 },
    { pattern: /\b(learning|performance|engagement|usage) (analytics|data|metrics)/i, weight: 2 },
    { pattern: /\bhow (are|is) (my|the) (students?|learners?|class) (doing|performing)/i, weight: 2 },
    { pattern: /\bdashboard/i, weight: 1.5 },
  ],
  'predictive': [
    { pattern: /\b(predict|forecast|project|estimate) (my |the )?(performance|outcome|grade|success)/i, weight: 2.5 },
    { pattern: /\bam I (on track|going to|likely to) (pass|succeed|fail)/i, weight: 2 },
    { pattern: /\bwhat (are|is) my chances/i, weight: 2 },
    { pattern: /\b(at risk|at-risk|struggling) (student|learner)/i, weight: 2 },
  ],
  'market-analysis': [
    { pattern: /\b(market|industry|job) (analysis|research|trends|demand)/i, weight: 2.5 },
    { pattern: /\bwhat (skills|qualifications|competencies) (are|is) (in demand|employers want)/i, weight: 2 },
    { pattern: /\b(job|career|employment) (market|outlook|prospect)/i, weight: 2 },
    { pattern: /\b(salary|compensation|pay) (data|range|estimate)/i, weight: 2 },
  ],
  'collaboration': [
    { pattern: /\b(group|team|collaborative|peer) (work|learning|project|activity)/i, weight: 2.5 },
    { pattern: /\bhow (can|should) (we|I) (work|collaborate|learn) together/i, weight: 2 },
    { pattern: /\bpeer (review|feedback|assessment|learning)/i, weight: 2 },
    { pattern: /\b(study|learning) (group|partner|buddy)/i, weight: 2 },
  ],
};
