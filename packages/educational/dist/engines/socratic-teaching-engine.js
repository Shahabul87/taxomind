/**
 * @sam-ai/educational - Socratic Teaching Engine
 * Guides discovery learning through strategic questioning
 */
/**
 * SocraticTeachingEngine - Guides learning through discovery questioning
 *
 * Features:
 * - Strategic question generation based on Socratic method
 * - Response analysis for understanding and misconceptions
 * - Progressive dialogue management
 * - Hint system for struggling learners
 * - Synthesis and insight tracking
 * - Performance analytics
 */
export class SocraticTeachingEngine {
    config;
    database;
    aiAdapter;
    dialogueCache = new Map();
    constructor(config = {}) {
        this.config = config;
        this.database = config.database;
        this.aiAdapter = config.aiAdapter;
    }
    /**
     * Start a new Socratic dialogue
     */
    async startDialogue(input) {
        const { userId, topic, learningObjective = `Understand the key concepts and implications of ${topic}`, priorKnowledge, targetBloomsLevel = 'ANALYZE', preferredStyle = 'balanced', } = input;
        // Generate key insights to discover
        const keyInsights = await this.generateKeyInsights(topic, learningObjective);
        // Create the dialogue
        const dialogue = {
            id: `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            topic,
            learningObjective,
            state: 'introduction',
            exchanges: [],
            discoveredInsights: [],
            remainingInsights: keyInsights,
            startedAt: new Date(),
        };
        // Cache the dialogue
        this.dialogueCache.set(dialogue.id, dialogue);
        // Save to database if available
        if (this.database) {
            await this.database.createDialogue(dialogue);
        }
        // Generate opening question
        const openingQuestion = await this.generateQuestion(topic, 'clarifying', {
            currentUnderstanding: priorKnowledge,
        });
        // Create first exchange
        const exchange = {
            order: 1,
            question: openingQuestion,
        };
        dialogue.exchanges.push(exchange);
        dialogue.state = 'exploration';
        // Update cache
        this.dialogueCache.set(dialogue.id, dialogue);
        return {
            state: dialogue.state,
            question: openingQuestion,
            feedback: this.getIntroductionMessage(topic, preferredStyle),
            encouragement: this.getEncouragement('start'),
            discoveredInsights: [],
            progress: 0,
            availableHints: openingQuestion.hints,
            isComplete: false,
        };
    }
    /**
     * Continue an existing dialogue
     */
    async continueDialogue(input) {
        const { dialogueId, response, requestedHint, skipQuestion } = input;
        // Get dialogue from cache or database
        let dialogue = this.dialogueCache.get(dialogueId);
        if (!dialogue && this.database) {
            dialogue = await this.database.getDialogue(dialogueId) || undefined;
        }
        if (!dialogue) {
            throw new Error(`Dialogue ${dialogueId} not found`);
        }
        const currentExchange = dialogue.exchanges[dialogue.exchanges.length - 1];
        const currentQuestion = currentExchange.question;
        // Handle hint request
        if (requestedHint) {
            const hintIndex = currentExchange.response?.usedHint ? 1 : 0;
            const hint = currentQuestion.hints[hintIndex] || currentQuestion.hints[0];
            return {
                state: dialogue.state,
                question: currentQuestion,
                feedback: `💡 Here's a hint: ${hint}`,
                discoveredInsights: dialogue.discoveredInsights,
                progress: this.calculateProgress(dialogue),
                availableHints: currentQuestion.hints.slice(hintIndex + 1),
                isComplete: false,
            };
        }
        // Handle skip request
        if (skipQuestion) {
            return this.moveToNextQuestion(dialogue, null);
        }
        // Analyze the response
        const analysis = await this.analyzeResponse(currentQuestion, response);
        // Update exchange with response and analysis
        currentExchange.response = {
            id: `resp_${Date.now()}`,
            questionId: currentQuestion.id,
            response,
            timestamp: new Date(),
            responseTime: 0,
            usedHint: false,
        };
        currentExchange.analysis = analysis;
        currentExchange.feedback = this.generateFeedback(analysis, this.config.encouragingMode ?? true);
        // Check for discovered insights
        if (analysis.reachedInsight) {
            const discoveredInsight = currentQuestion.keyInsights[0];
            if (discoveredInsight && !dialogue.discoveredInsights.includes(discoveredInsight)) {
                dialogue.discoveredInsights.push(discoveredInsight);
                dialogue.remainingInsights = dialogue.remainingInsights.filter((i) => i !== discoveredInsight);
            }
        }
        // Update dialogue state
        this.dialogueCache.set(dialogueId, dialogue);
        if (this.database) {
            await this.database.saveExchange(dialogueId, currentExchange);
        }
        // Check if dialogue should conclude
        if (this.shouldConclude(dialogue, analysis)) {
            return this.concludeDialogue(dialogue);
        }
        // Move to next question
        return this.moveToNextQuestion(dialogue, analysis);
    }
    /**
     * Get hint for current question
     */
    async getHint(dialogueId, hintIndex = 0) {
        const dialogue = this.dialogueCache.get(dialogueId);
        if (!dialogue) {
            throw new Error(`Dialogue ${dialogueId} not found`);
        }
        const currentExchange = dialogue.exchanges[dialogue.exchanges.length - 1];
        const hints = currentExchange.question.hints;
        return hints[hintIndex] || hints[0] || 'Try to think about the fundamental principles involved.';
    }
    /**
     * End dialogue and get summary
     */
    async endDialogue(dialogueId) {
        const dialogue = this.dialogueCache.get(dialogueId);
        if (!dialogue) {
            throw new Error(`Dialogue ${dialogueId} not found`);
        }
        dialogue.endedAt = new Date();
        dialogue.state = 'conclusion';
        const synthesis = await this.generateSynthesis(dialogue);
        const performance = this.calculatePerformance(dialogue);
        dialogue.synthesis = synthesis;
        dialogue.performance = performance;
        // Update storage
        this.dialogueCache.set(dialogueId, dialogue);
        if (this.database) {
            await this.database.updateDialogue(dialogueId, {
                state: 'conclusion',
                endedAt: dialogue.endedAt,
                synthesis,
                performance,
            });
        }
        return { synthesis, performance };
    }
    /**
     * Get dialogue by ID
     */
    async getDialogue(dialogueId) {
        let dialogue = this.dialogueCache.get(dialogueId);
        if (!dialogue && this.database) {
            dialogue = await this.database.getDialogue(dialogueId) || undefined;
        }
        return dialogue || null;
    }
    /**
     * Get user's dialogue history
     */
    async getUserDialogues(userId, limit = 10) {
        if (this.database) {
            return this.database.getUserDialogues(userId, { limit });
        }
        // Return from cache
        return Array.from(this.dialogueCache.values())
            .filter((d) => d.userId === userId)
            .slice(0, limit);
    }
    /**
     * Generate a Socratic question
     */
    async generateQuestion(topic, type, context) {
        if (this.aiAdapter) {
            return this.generateQuestionWithAI(topic, type, context);
        }
        return this.generateTemplateQuestion(topic, type, context);
    }
    /**
     * Analyze a student response
     */
    async analyzeResponse(question, response) {
        if (this.aiAdapter) {
            return this.analyzeWithAI(question, response);
        }
        return this.analyzeWithRules(question, response);
    }
    // Private helper methods
    async generateQuestionWithAI(topic, type, context) {
        const prompt = `
Generate a Socratic ${type} question about "${topic}".

Question Type Explanation:
- clarifying: Asks for clearer definitions or examples
- probing_assumptions: Challenges underlying assumptions
- probing_reasons: Asks for evidence or reasoning
- questioning_viewpoints: Explores alternative perspectives
- probing_implications: Explores consequences
- questioning_the_question: Examines why the question matters

${context?.previousQuestions?.length ? `Previous questions asked: ${context.previousQuestions.join(', ')}` : ''}
${context?.currentUnderstanding ? `Current student understanding: ${context.currentUnderstanding}` : ''}

Respond with JSON:
{
  "question": "The Socratic question",
  "purpose": "Why this question helps learning",
  "expectedDirection": "Where this should lead the student's thinking",
  "bloomsLevel": "remember|understand|apply|analyze|evaluate|create",
  "fallbackQuestions": ["simpler follow-up if student struggles"],
  "hints": ["hint 1", "hint 2", "hint 3"],
  "keyInsights": ["the insight this question aims to reveal"]
}
`;
        try {
            const response = await this.aiAdapter.chat({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a Socratic teacher. Generate thought-provoking questions that guide students to discover insights themselves. Respond only with valid JSON.',
                    },
                    { role: 'user', content: prompt },
                ],
            });
            const parsed = JSON.parse(this.extractJson(response.content));
            return {
                id: `q_${Date.now()}`,
                type,
                question: parsed.question,
                purpose: parsed.purpose,
                expectedDirection: parsed.expectedDirection,
                bloomsLevel: parsed.bloomsLevel?.toUpperCase() || 'ANALYZE',
                fallbackQuestions: parsed.fallbackQuestions || [],
                hints: parsed.hints || [],
                keyInsights: parsed.keyInsights || [],
            };
        }
        catch {
            return this.generateTemplateQuestion(topic, type, context);
        }
    }
    generateTemplateQuestion(topic, type, context) {
        const templates = {
            clarifying: (t) => ({
                id: `q_${Date.now()}`,
                type: 'clarifying',
                question: `What do you mean when you say "${t}"? Can you give a specific example?`,
                purpose: 'To ensure clear understanding of the concept',
                expectedDirection: 'Student should provide concrete examples',
                bloomsLevel: 'UNDERSTAND',
                fallbackQuestions: [`Can you describe ${t} in your own words?`],
                hints: [
                    'Think about a specific situation where this applies',
                    'Try to break it down into simpler parts',
                    'What is the most essential aspect?',
                ],
                keyInsights: [`Clear definition and practical examples of ${t}`],
            }),
            probing_assumptions: (t) => ({
                id: `q_${Date.now()}`,
                type: 'probing_assumptions',
                question: `What assumptions are you making about ${t}? Are these always true?`,
                purpose: 'To challenge underlying assumptions',
                expectedDirection: 'Student should identify hidden assumptions',
                bloomsLevel: 'ANALYZE',
                fallbackQuestions: [`What do you take for granted about ${t}?`],
                hints: [
                    'Consider what must be true for your view to hold',
                    'Think about edge cases or exceptions',
                    'What would need to change for this not to work?',
                ],
                keyInsights: [`Recognition of assumptions underlying ${t}`],
            }),
            probing_reasons: (t) => ({
                id: `q_${Date.now()}`,
                type: 'probing_reasons',
                question: `Why do you think ${t} works this way? What evidence supports this?`,
                purpose: 'To explore reasoning and evidence',
                expectedDirection: 'Student should provide reasoning and evidence',
                bloomsLevel: 'ANALYZE',
                fallbackQuestions: [`What makes you believe this about ${t}?`],
                hints: [
                    'Think about cause and effect relationships',
                    'What observations support this?',
                    'How could you test this?',
                ],
                keyInsights: [`Understanding the reasoning behind ${t}`],
            }),
            questioning_viewpoints: (t) => ({
                id: `q_${Date.now()}`,
                type: 'questioning_viewpoints',
                question: `How might someone with a different perspective view ${t}? What would they say?`,
                purpose: 'To explore alternative viewpoints',
                expectedDirection: 'Student should consider other perspectives',
                bloomsLevel: 'EVALUATE',
                fallbackQuestions: [`What's an alternative way to think about ${t}?`],
                hints: [
                    'Consider the opposite viewpoint',
                    'Think about different contexts or fields',
                    'What would a critic say?',
                ],
                keyInsights: [`Multiple perspectives on ${t}`],
            }),
            probing_implications: (t) => ({
                id: `q_${Date.now()}`,
                type: 'probing_implications',
                question: `If ${t} is true, what are the consequences? What else must follow?`,
                purpose: 'To explore implications and consequences',
                expectedDirection: 'Student should trace logical consequences',
                bloomsLevel: 'EVALUATE',
                fallbackQuestions: [`What happens if we apply ${t} broadly?`],
                hints: [
                    'Think about both immediate and long-term effects',
                    'Consider unintended consequences',
                    'What chains of events might this trigger?',
                ],
                keyInsights: [`Implications and consequences of ${t}`],
            }),
            questioning_the_question: (t) => ({
                id: `q_${Date.now()}`,
                type: 'questioning_the_question',
                question: `Why is understanding ${t} important? What problem does it solve?`,
                purpose: 'To examine the significance of the topic',
                expectedDirection: 'Student should reflect on importance and relevance',
                bloomsLevel: 'EVALUATE',
                fallbackQuestions: [`Who benefits from understanding ${t}?`],
                hints: [
                    'Think about practical applications',
                    'Consider what would be lost without this knowledge',
                    'How does this connect to larger goals?',
                ],
                keyInsights: [`Significance and relevance of ${t}`],
            }),
        };
        return templates[type](topic);
    }
    async analyzeWithAI(question, response) {
        const prompt = `
Analyze this student response to a Socratic question:

**Question:** ${question.question}
**Expected Direction:** ${question.expectedDirection}
**Key Insights to Discover:** ${question.keyInsights.join(', ')}

**Student Response:** ${response}

Analyze and respond with JSON:
{
  "qualityScore": 0-100,
  "thinkingDepth": 0-100,
  "understandingIndicators": ["what they understood"],
  "misconceptions": ["any misconceptions"],
  "reasoningGaps": ["gaps in reasoning"],
  "strengths": ["strong points"],
  "reachedInsight": true/false,
  "recommendedNextType": "clarifying|probing_assumptions|probing_reasons|questioning_viewpoints|probing_implications|questioning_the_question",
  "demonstratedBloomsLevel": "remember|understand|apply|analyze|evaluate|create"
}
`;
        try {
            const aiResponse = await this.aiAdapter.chat({
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing student responses in Socratic dialogues. Be constructive and identify both strengths and areas for growth. Respond only with valid JSON.',
                    },
                    { role: 'user', content: prompt },
                ],
            });
            const parsed = JSON.parse(this.extractJson(aiResponse.content));
            return {
                qualityScore: parsed.qualityScore || 50,
                thinkingDepth: parsed.thinkingDepth || 50,
                understandingIndicators: parsed.understandingIndicators || [],
                misconceptions: parsed.misconceptions || [],
                reasoningGaps: parsed.reasoningGaps || [],
                strengths: parsed.strengths || [],
                reachedInsight: parsed.reachedInsight || false,
                recommendedNextType: parsed.recommendedNextType || 'probing_reasons',
                demonstratedBloomsLevel: parsed.demonstratedBloomsLevel?.toUpperCase() || 'UNDERSTAND',
            };
        }
        catch {
            return this.analyzeWithRules(question, response);
        }
    }
    analyzeWithRules(question, response) {
        const wordCount = response.split(/\s+/).length;
        const hasExamples = /for example|such as|like|instance/i.test(response);
        const hasReasoning = /because|therefore|since|thus|so|as a result/i.test(response);
        const hasQuestion = /\?/.test(response);
        let qualityScore = 50;
        let thinkingDepth = 50;
        const understandingIndicators = [];
        const misconceptions = [];
        const reasoningGaps = [];
        const strengths = [];
        // Adjust based on length
        if (wordCount > 50) {
            qualityScore += 10;
            thinkingDepth += 10;
            strengths.push('Provided a detailed response');
        }
        else if (wordCount < 10) {
            qualityScore -= 20;
            reasoningGaps.push('Response was too brief');
        }
        // Check for examples
        if (hasExamples) {
            qualityScore += 15;
            understandingIndicators.push('Used concrete examples');
            strengths.push('Connected concepts to real examples');
        }
        // Check for reasoning
        if (hasReasoning) {
            thinkingDepth += 15;
            understandingIndicators.push('Showed causal reasoning');
            strengths.push('Demonstrated logical thinking');
        }
        // Check for inquiry (asking questions back)
        if (hasQuestion) {
            thinkingDepth += 10;
            strengths.push('Engaged with curiosity');
        }
        // Check if key insight terms appear
        const keyTermsFound = question.keyInsights.some((insight) => response.toLowerCase().includes(insight.toLowerCase().split(' ')[0]));
        const reachedInsight = keyTermsFound && qualityScore > 60;
        if (reachedInsight) {
            qualityScore += 10;
            understandingIndicators.push('Approached the key insight');
        }
        // Determine next question type
        let recommendedNextType = 'probing_reasons';
        if (qualityScore < 40) {
            recommendedNextType = 'clarifying';
        }
        else if (qualityScore > 70 && hasReasoning) {
            recommendedNextType = 'probing_implications';
        }
        // Determine Bloom's level
        let demonstratedBloomsLevel = 'UNDERSTAND';
        if (hasExamples && hasReasoning) {
            demonstratedBloomsLevel = 'APPLY';
        }
        if (qualityScore > 80 && thinkingDepth > 70) {
            demonstratedBloomsLevel = 'ANALYZE';
        }
        return {
            qualityScore: Math.min(100, Math.max(0, qualityScore)),
            thinkingDepth: Math.min(100, Math.max(0, thinkingDepth)),
            understandingIndicators,
            misconceptions,
            reasoningGaps,
            strengths,
            reachedInsight,
            recommendedNextType,
            demonstratedBloomsLevel,
        };
    }
    async generateKeyInsights(topic, objective) {
        if (this.aiAdapter) {
            try {
                const response = await this.aiAdapter.chat({
                    messages: [
                        {
                            role: 'system',
                            content: 'Generate 3-5 key insights a student should discover about a topic. Respond with a JSON array of strings.',
                        },
                        {
                            role: 'user',
                            content: `Topic: ${topic}\nLearning Objective: ${objective}\n\nGenerate key insights as a JSON array.`,
                        },
                    ],
                });
                const parsed = JSON.parse(this.extractJson(response.content));
                return Array.isArray(parsed) ? parsed : parsed.insights || [];
            }
            catch {
                // Fallback
            }
        }
        return [
            `Core definition and characteristics of ${topic}`,
            `How ${topic} relates to broader concepts`,
            `Practical applications of ${topic}`,
            `Common misconceptions about ${topic}`,
        ];
    }
    async generateSynthesis(dialogue) {
        const discoveredInsights = dialogue.discoveredInsights;
        const topic = dialogue.topic;
        if (this.aiAdapter) {
            try {
                const exchanges = dialogue.exchanges
                    .map((e) => `Q: ${e.question.question}\nA: ${e.response?.response || 'No response'}`)
                    .join('\n\n');
                const response = await this.aiAdapter.chat({
                    messages: [
                        {
                            role: 'system',
                            content: 'Synthesize the key learnings from a Socratic dialogue. Be encouraging and highlight growth.',
                        },
                        {
                            role: 'user',
                            content: `Topic: ${topic}\nDiscovered Insights: ${discoveredInsights.join(', ')}\n\nDialogue:\n${exchanges}\n\nProvide a synthesis of what was learned.`,
                        },
                    ],
                });
                return response.content;
            }
            catch {
                // Fallback
            }
        }
        return `Through our Socratic exploration of "${topic}", you've discovered several key insights:\n\n${discoveredInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\nThis journey of questioning and discovery has deepened your understanding. Keep questioning and exploring!`;
    }
    calculatePerformance(dialogue) {
        const exchanges = dialogue.exchanges;
        const totalExchanges = exchanges.length;
        const exchangesWithResponses = exchanges.filter((e) => e.response);
        const avgQuality = exchangesWithResponses.reduce((sum, e) => sum + (e.analysis?.qualityScore || 0), 0) /
            (exchangesWithResponses.length || 1);
        const avgDepth = exchangesWithResponses.reduce((sum, e) => sum + (e.analysis?.thinkingDepth || 0), 0) /
            (exchangesWithResponses.length || 1);
        const totalInsights = dialogue.discoveredInsights.length + dialogue.remainingInsights.length;
        const insightDiscoveryRate = totalInsights > 0 ? dialogue.discoveredInsights.length / totalInsights : 0;
        const completionTime = dialogue.endedAt
            ? (dialogue.endedAt.getTime() - dialogue.startedAt.getTime()) / 60000
            : 0;
        const hintsUsed = exchanges.filter((e) => e.response?.usedHint).length;
        // Find highest Bloom's level achieved
        const bloomsOrder = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        let highestBloomsLevel = 'REMEMBER';
        exchangesWithResponses.forEach((e) => {
            const level = e.analysis?.demonstratedBloomsLevel;
            if (level && bloomsOrder.indexOf(level) > bloomsOrder.indexOf(highestBloomsLevel)) {
                highestBloomsLevel = level;
            }
        });
        const growth = [];
        if (avgQuality > 70) {
            growth.push({ factor: 'Strong Responses', description: 'Consistently provided thoughtful answers' });
        }
        if (insightDiscoveryRate > 0.5) {
            growth.push({ factor: 'Insight Discovery', description: 'Successfully uncovered key insights' });
        }
        const improvementAreas = [];
        if (avgQuality < 50) {
            improvementAreas.push('Develop more detailed responses');
        }
        if (hintsUsed > totalExchanges / 2) {
            improvementAreas.push('Work on independent problem-solving');
        }
        return {
            totalExchanges,
            averageQuality: Math.round(avgQuality),
            averageDepth: Math.round(avgDepth),
            insightDiscoveryRate,
            completionTime,
            hintsUsed,
            highestBloomsLevel,
            growth,
            improvementAreas,
        };
    }
    calculateProgress(dialogue) {
        const total = dialogue.discoveredInsights.length + dialogue.remainingInsights.length;
        if (total === 0)
            return 0;
        return Math.round((dialogue.discoveredInsights.length / total) * 100);
    }
    shouldConclude(dialogue, analysis) {
        const maxQuestions = this.config.maxQuestions || 10;
        // Conclude if max questions reached
        if (dialogue.exchanges.length >= maxQuestions)
            return true;
        // Conclude if all insights discovered
        if (dialogue.remainingInsights.length === 0)
            return true;
        // Conclude if high-level thinking is consistently achieved
        if (dialogue.exchanges.length >= 5 &&
            analysis.qualityScore > 80 &&
            analysis.demonstratedBloomsLevel === 'EVALUATE') {
            return true;
        }
        return false;
    }
    concludeDialogue(dialogue) {
        dialogue.state = 'conclusion';
        dialogue.endedAt = new Date();
        const synthesis = `You've made excellent progress exploring "${dialogue.topic}"! You discovered these key insights:\n\n${dialogue.discoveredInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;
        return {
            state: 'conclusion',
            synthesis,
            feedback: 'Great work on this Socratic dialogue!',
            encouragement: this.getEncouragement('completion'),
            discoveredInsights: dialogue.discoveredInsights,
            progress: 100,
            isComplete: true,
        };
    }
    async moveToNextQuestion(dialogue, analysis) {
        // Determine next question type
        const nextType = analysis?.recommendedNextType || this.getNextQuestionType(dialogue);
        // Generate next question
        const previousQuestions = dialogue.exchanges.map((e) => e.question.question);
        const nextQuestion = await this.generateQuestion(dialogue.topic, nextType, {
            previousQuestions,
            currentUnderstanding: analysis ? `Quality: ${analysis.qualityScore}%, Depth: ${analysis.thinkingDepth}%` : undefined,
        });
        // Add new exchange
        const exchange = {
            order: dialogue.exchanges.length + 1,
            question: nextQuestion,
        };
        dialogue.exchanges.push(exchange);
        // Update state
        dialogue.state = this.determineDialogueState(dialogue);
        // Update cache
        this.dialogueCache.set(dialogue.id, dialogue);
        return {
            state: dialogue.state,
            question: nextQuestion,
            feedback: analysis ? this.generateFeedback(analysis, this.config.encouragingMode ?? true) : undefined,
            encouragement: this.getEncouragement(dialogue.state),
            discoveredInsights: dialogue.discoveredInsights,
            progress: this.calculateProgress(dialogue),
            availableHints: nextQuestion.hints,
            isComplete: false,
        };
    }
    getNextQuestionType(dialogue) {
        const exchangeCount = dialogue.exchanges.length;
        // Progression of question types
        if (exchangeCount <= 2)
            return 'clarifying';
        if (exchangeCount <= 4)
            return 'probing_reasons';
        if (exchangeCount <= 6)
            return 'probing_assumptions';
        if (exchangeCount <= 8)
            return 'questioning_viewpoints';
        return 'probing_implications';
    }
    determineDialogueState(dialogue) {
        const progress = this.calculateProgress(dialogue);
        const exchangeCount = dialogue.exchanges.length;
        if (exchangeCount <= 1)
            return 'introduction';
        if (exchangeCount <= 3)
            return 'exploration';
        if (progress < 50)
            return 'clarification';
        if (progress < 75)
            return 'challenge';
        if (progress < 100)
            return 'synthesis';
        return 'conclusion';
    }
    generateFeedback(analysis, encouraging) {
        let feedback = '';
        if (analysis.strengths.length > 0) {
            feedback += `✓ ${analysis.strengths[0]}. `;
        }
        if (analysis.misconceptions.length > 0) {
            feedback += `Consider: ${analysis.misconceptions[0]}. `;
        }
        else if (analysis.reasoningGaps.length > 0) {
            feedback += `To deepen your thinking: ${analysis.reasoningGaps[0]}. `;
        }
        if (encouraging && analysis.qualityScore < 50) {
            feedback += `Keep exploring - you're on the right track!`;
        }
        else if (analysis.qualityScore > 70) {
            feedback += `Excellent thinking!`;
        }
        return feedback || 'Interesting perspective. Let us explore further.';
    }
    getIntroductionMessage(topic, style) {
        switch (style) {
            case 'gentle':
                return `Let's explore "${topic}" together through a dialogue. There are no wrong answers - just opportunities to deepen our understanding.`;
            case 'challenging':
                return `Today we'll rigorously examine "${topic}". I'll challenge your assumptions and push your thinking. Are you ready?`;
            default:
                return `Welcome to our Socratic exploration of "${topic}". I'll guide you through questions designed to help you discover key insights yourself.`;
        }
    }
    getEncouragement(context) {
        const encouragements = {
            start: ['Great! Let\'s begin our journey of discovery.', 'I\'m excited to explore this with you!'],
            introduction: ['You\'re off to a good start!', 'Interesting first thoughts!'],
            exploration: ['Keep questioning!', 'You\'re digging deeper!'],
            clarification: ['Let\'s sharpen our understanding.', 'Good - clarity leads to insight.'],
            challenge: ['Now we\'re really thinking!', 'You\'re challenging your own assumptions!'],
            synthesis: ['You\'re connecting the dots!', 'Beautiful synthesis emerging!'],
            conclusion: ['What a journey of discovery!', 'You\'ve grown through this dialogue!'],
            completion: ['Congratulations on completing this dialogue!', 'Excellent work!'],
        };
        const options = encouragements[context] || encouragements.exploration;
        return options[Math.floor(Math.random() * options.length)];
    }
    extractJson(content) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
            content.match(/```\s*([\s\S]*?)\s*```/) ||
            content.match(/\{[\s\S]*\}/) ||
            content.match(/\[[\s\S]*\]/);
        return jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    }
}
/**
 * Factory function to create a SocraticTeachingEngine instance
 */
export function createSocraticTeachingEngine(config) {
    return new SocraticTeachingEngine(config);
}
