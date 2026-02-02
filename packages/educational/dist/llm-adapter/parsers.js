/**
 * LLM Response Parsers
 * Enhanced Depth Analysis - January 2026
 *
 * Parse and validate LLM responses into typed objects.
 */
// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════
/**
 * Extract JSON from LLM response (handles markdown code blocks)
 */
function extractJson(response) {
    // Try to extract from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        return jsonMatch[1].trim();
    }
    // Try to find JSON object/array directly
    const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
        return jsonObjectMatch[0];
    }
    return response.trim();
}
/**
 * Safe JSON parse with fallback
 */
function safeJsonParse(text, fallback) {
    try {
        const json = extractJson(text);
        return JSON.parse(json);
    }
    catch {
        console.warn('Failed to parse LLM response as JSON:', text.substring(0, 200));
        return fallback;
    }
}
/**
 * Clamp number to range
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/**
 * Normalize distribution to sum to 1
 */
function normalizeDistribution(dist) {
    const sum = Object.values(dist).reduce((a, b) => a + b, 0);
    if (sum === 0)
        return dist;
    const normalized = {};
    for (const [key, value] of Object.entries(dist)) {
        normalized[key] = value / sum;
    }
    return normalized;
}
const VALID_BLOOMS_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
// Map from lowercase/variations to canonical level
const BLOOMS_LEVEL_MAP = {
    remember: 'REMEMBER',
    understand: 'UNDERSTAND',
    apply: 'APPLY',
    analyze: 'ANALYZE',
    evaluate: 'EVALUATE',
    create: 'CREATE',
    knowledge: 'REMEMBER',
    comprehension: 'UNDERSTAND',
    application: 'APPLY',
    analysis: 'ANALYZE',
    synthesis: 'CREATE',
    evaluation: 'EVALUATE',
};
const DEFAULT_BLOOMS_DISTRIBUTION = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
};
/**
 * Parse Bloom's classification response
 */
export function parseBloomsResult(response, model, processingTimeMs) {
    const raw = safeJsonParse(response, {});
    // Parse level
    const level = parseBloomsLevel(raw.level);
    // Parse confidence
    const confidence = clamp(raw.confidence ?? 0.8, 0, 1);
    // Parse distribution
    const distribution = parseBloomsDistribution(raw.distribution, level);
    // Parse evidence
    const evidence = parseBloomsEvidence(raw.evidence);
    // Parse alternatives
    const alternatives = parseBloomsAlternatives(raw.alternatives);
    return {
        level,
        confidence,
        distribution,
        evidence,
        alternatives,
        model,
        processingTimeMs,
    };
}
function parseBloomsLevel(level) {
    if (!level)
        return 'UNDERSTAND';
    const normalized = level.toLowerCase().trim();
    // Direct uppercase match
    if (VALID_BLOOMS_LEVELS.includes(level.toUpperCase())) {
        return level.toUpperCase();
    }
    // Lookup in map
    if (BLOOMS_LEVEL_MAP[normalized]) {
        return BLOOMS_LEVEL_MAP[normalized];
    }
    return 'UNDERSTAND';
}
function parseBloomsDistribution(dist, primaryLevel) {
    const result = { ...DEFAULT_BLOOMS_DISTRIBUTION };
    if (dist) {
        for (const [key, value] of Object.entries(dist)) {
            const level = parseBloomsLevel(key);
            if (VALID_BLOOMS_LEVELS.includes(level)) {
                result[level] = clamp(value, 0, 1);
            }
        }
    }
    // If no distribution provided, use primary level
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    if (sum === 0 && primaryLevel) {
        result[primaryLevel] = 1;
    }
    return normalizeDistribution(result);
}
function parseBloomsEvidence(evidence) {
    if (!evidence || !Array.isArray(evidence))
        return [];
    return evidence
        .filter(e => e.text)
        .map(e => ({
        text: e.text ?? '',
        keywords: e.keywords ?? [],
        supportsLevel: parseBloomsLevel(e.supportsLevel),
        weight: clamp(e.weight ?? 0.5, 0, 1),
    }));
}
function parseBloomsAlternatives(alternatives) {
    if (!alternatives || !Array.isArray(alternatives))
        return [];
    return alternatives
        .filter(a => a.level)
        .map(a => ({
        level: parseBloomsLevel(a.level),
        confidence: clamp(a.confidence ?? 0.5, 0, 1),
        reason: a.reason ?? '',
    }));
}
const VALID_DOK_LEVELS = [1, 2, 3, 4];
// Map from names to numeric levels
const DOK_LEVEL_MAP = {
    recall: 1,
    level1: 1,
    '1': 1,
    skills_concepts: 2,
    skill_concept: 2,
    level2: 2,
    '2': 2,
    strategic_thinking: 3,
    strategic: 3,
    level3: 3,
    '3': 3,
    extended_thinking: 4,
    extended: 4,
    level4: 4,
    '4': 4,
};
const DEFAULT_DOK_DISTRIBUTION = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
};
/**
 * Parse DOK classification response
 */
export function parseDOKResult(response, model, processingTimeMs) {
    const raw = safeJsonParse(response, {});
    const level = parseDOKLevel(raw.level);
    const confidence = clamp(raw.confidence ?? 0.8, 0, 1);
    const distribution = parseDOKDistribution(raw.distribution, level);
    const evidence = parseDOKEvidence(raw.evidence);
    const alternatives = parseDOKAlternatives(raw.alternatives);
    return {
        level,
        confidence,
        distribution,
        evidence,
        alternatives,
        model,
        processingTimeMs,
    };
}
function parseDOKLevel(level) {
    if (level === undefined || level === null)
        return 2;
    // Direct numeric match
    if (typeof level === 'number' && VALID_DOK_LEVELS.includes(level)) {
        return level;
    }
    // String to number
    const normalized = String(level).toLowerCase().trim().replace(/\s+/g, '_');
    if (DOK_LEVEL_MAP[normalized] !== undefined) {
        return DOK_LEVEL_MAP[normalized];
    }
    // Partial matching
    if (normalized.includes('recall'))
        return 1;
    if (normalized.includes('skill') || normalized.includes('concept'))
        return 2;
    if (normalized.includes('strategic'))
        return 3;
    if (normalized.includes('extended'))
        return 4;
    return 2;
}
function parseDOKDistribution(dist, primaryLevel) {
    const result = { ...DEFAULT_DOK_DISTRIBUTION };
    if (dist) {
        for (const [key, value] of Object.entries(dist)) {
            const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
            // Map to level1-4 keys
            if (normalizedKey === 'recall' || normalizedKey === 'level1' || normalizedKey === '1') {
                result.level1 = clamp(value, 0, 1);
            }
            else if (normalizedKey === 'skills_concepts' || normalizedKey === 'level2' || normalizedKey === '2') {
                result.level2 = clamp(value, 0, 1);
            }
            else if (normalizedKey === 'strategic_thinking' || normalizedKey === 'level3' || normalizedKey === '3') {
                result.level3 = clamp(value, 0, 1);
            }
            else if (normalizedKey === 'extended_thinking' || normalizedKey === 'level4' || normalizedKey === '4') {
                result.level4 = clamp(value, 0, 1);
            }
        }
    }
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    if (sum === 0 && primaryLevel) {
        result[`level${primaryLevel}`] = 1;
    }
    return normalizeDistribution(result);
}
function parseDOKEvidence(evidence) {
    if (!evidence || !Array.isArray(evidence))
        return [];
    return evidence
        .filter(e => e.text)
        .map(e => ({
        text: e.text ?? '',
        indicators: e.indicators ?? [],
        supportsLevel: parseDOKLevel(e.supportsLevel),
        weight: clamp(e.weight ?? 0.5, 0, 1),
    }));
}
function parseDOKAlternatives(alternatives) {
    if (!alternatives || !Array.isArray(alternatives))
        return [];
    return alternatives
        .filter(a => a.level !== undefined)
        .map(a => ({
        level: parseDOKLevel(a.level),
        confidence: clamp(a.confidence ?? 0.5, 0, 1),
        reason: a.reason ?? '',
    }));
}
/**
 * Parse multi-framework classification response
 */
export function parseMultiFrameworkResult(response, model, processingTimeMs) {
    const raw = safeJsonParse(response, {});
    const frameworks = parseFrameworkDetails(raw.frameworks);
    const crossFrameworkAlignment = clamp(raw.crossFrameworkAlignment ?? 0.8, 0, 1);
    const compositeScore = clamp(raw.compositeScore ?? 0.5, 0, 1);
    return {
        frameworks,
        crossFrameworkAlignment,
        compositeScore,
        model,
        processingTimeMs,
    };
}
function parseFrameworkDetails(frameworks) {
    if (!frameworks || !Array.isArray(frameworks))
        return [];
    return frameworks
        .filter(f => f.framework)
        .map(f => ({
        framework: f.framework,
        level: f.level ?? 'unknown',
        confidence: clamp(f.confidence ?? 0.8, 0, 1),
        distribution: f.distribution ?? {},
        evidence: f.evidence?.map(e => ({
            text: e.text ?? '',
            indicators: e.indicators ?? [],
            level: e.level ?? '',
            weight: clamp(e.weight ?? 0.5, 0, 1),
        })),
    }));
}
/**
 * Parse keyword extraction response
 */
export function parseKeywordResult(response, model, processingTimeMs) {
    const raw = safeJsonParse(response, {});
    const keywords = parseKeywordGroups(raw.keywords);
    const totalCount = raw.totalCount ?? keywords.reduce((sum, g) => sum + g.keywords.length, 0);
    return {
        keywords,
        totalCount,
        model,
        processingTimeMs,
    };
}
function parseKeywordGroups(groups) {
    if (!groups || !Array.isArray(groups))
        return [];
    return groups
        .filter(g => g.type && g.keywords)
        .map(g => ({
        type: g.type,
        keywords: (g.keywords ?? [])
            .filter(k => k.text)
            .map(k => ({
            text: k.text ?? '',
            relevance: clamp(k.relevance ?? 0.5, 0, 1),
            position: k.position ? {
                start: k.position.start ?? 0,
                end: k.position.end ?? 0,
            } : undefined,
            associatedLevel: k.associatedLevel,
            context: k.context,
        })),
    }));
}
/**
 * Parse alignment analysis response
 */
export function parseAlignmentResult(response, model, processingTimeMs) {
    const raw = safeJsonParse(response, {});
    const objectiveAlignments = parseObjectiveAlignments(raw.objectiveAlignments);
    const assessmentAlignments = parseAssessmentAlignments(raw.assessmentAlignments);
    const gaps = parseAlignmentGaps(raw.gaps);
    const overallScore = clamp(raw.overallScore ?? 0.8, 0, 1);
    const summary = parseAlignmentSummary(raw.summary, objectiveAlignments, assessmentAlignments, gaps);
    return {
        objectiveAlignments,
        assessmentAlignments,
        gaps,
        overallScore,
        summary,
        model,
        processingTimeMs,
    };
}
function parseObjectiveAlignments(alignments) {
    if (!alignments || !Array.isArray(alignments))
        return [];
    return alignments
        .filter(a => a.objectiveId)
        .map(a => ({
        objectiveId: a.objectiveId ?? '',
        alignedSections: (a.alignedSections ?? []).map(s => ({
            id: s.id ?? '',
            strength: clamp(s.strength ?? 0.5, 0, 1),
            evidence: s.evidence ?? '',
        })),
        alignmentStrength: clamp(a.alignmentStrength ?? 0.5, 0, 1),
        missingCoverage: a.missingCoverage,
    }));
}
function parseAssessmentAlignments(alignments) {
    if (!alignments || !Array.isArray(alignments))
        return [];
    return alignments
        .filter(a => a.assessmentId)
        .map(a => ({
        assessmentId: a.assessmentId ?? '',
        alignedSections: (a.alignedSections ?? []).map(s => ({
            id: s.id ?? '',
            strength: clamp(s.strength ?? 0.5, 0, 1),
            evidence: s.evidence ?? '',
        })),
        alignedObjectives: (a.alignedObjectives ?? []).map(o => ({
            id: o.id ?? '',
            strength: clamp(o.strength ?? 0.5, 0, 1),
            evidence: o.evidence ?? '',
        })),
        alignmentStrength: clamp(a.alignmentStrength ?? 0.5, 0, 1),
    }));
}
function parseAlignmentGaps(gaps) {
    if (!gaps || !Array.isArray(gaps))
        return [];
    return gaps
        .filter(g => g.type && g.description)
        .map(g => ({
        type: g.type,
        severity: g.severity ?? 'medium',
        description: g.description ?? '',
        affectedItems: g.affectedItems ?? [],
        recommendation: g.recommendation ?? '',
    }));
}
function parseAlignmentSummary(summary, objectives, assessments, gaps) {
    if (summary) {
        return {
            totalObjectives: summary.totalObjectives ?? objectives.length,
            coveredObjectives: summary.coveredObjectives ?? objectives.filter(o => o.alignedSections.length > 0).length,
            totalSections: summary.totalSections ?? 0,
            assessedSections: summary.assessedSections ?? 0,
            averageAlignment: clamp(summary.averageAlignment ?? 0.8, 0, 1),
            gapsCount: summary.gapsCount ?? gaps.length,
        };
    }
    // Calculate from data if no summary provided
    const coveredObjectives = objectives.filter(o => o.alignedSections.length > 0).length;
    const avgStrength = objectives.length > 0
        ? objectives.reduce((sum, o) => sum + o.alignmentStrength, 0) / objectives.length
        : 0;
    return {
        totalObjectives: objectives.length,
        coveredObjectives,
        totalSections: 0,
        assessedSections: 0,
        averageAlignment: avgStrength,
        gapsCount: gaps.length,
    };
}
/**
 * Parse recommendations response
 */
export function parseRecommendationResult(response, model, processingTimeMs) {
    const raw = safeJsonParse(response, {});
    const recommendations = parseRecommendations(raw.recommendations);
    const currentStateSummary = raw.currentStateSummary ?? 'Analysis complete.';
    return {
        recommendations,
        currentStateSummary,
        model,
        processingTimeMs,
    };
}
function parseRecommendations(recs) {
    if (!recs || !Array.isArray(recs))
        return [];
    return recs
        .filter(r => r.title && r.description)
        .map((r, index) => ({
        id: r.id ?? `rec_${index + 1}`,
        priority: r.priority ?? 'medium',
        category: r.category ?? 'improve_alignment',
        title: r.title ?? '',
        description: r.description ?? '',
        actionItems: r.actionItems ?? [],
        expectedImpact: r.expectedImpact ?? '',
        affectedAreas: r.affectedAreas ?? [],
    }));
}
