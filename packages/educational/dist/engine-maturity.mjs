// src/engine-maturity.ts
var ENGINE_MATURITY = {
  // Production — stable, fully tested
  "blooms-engine": "production",
  "unified-blooms": "production",
  "depth": "production",
  "personalization": "production",
  "content-gen": "production",
  "content": "production",
  "evaluation": "production",
  "exam": "production",
  "practice-problems": "production",
  "adaptive-content": "production",
  "response": "production",
  "context": "production",
  "assessment": "production",
  // Beta — functional, may have rough edges
  "analytics": "beta",
  "research": "beta",
  "resource": "beta",
  "knowledge-graph": "beta",
  "metacognition": "beta",
  "socratic": "beta",
  "competency": "beta",
  "skill-track": "beta",
  // Experimental — early implementation
  "collaboration": "experimental",
  "peer-learning": "experimental",
  "memory": "experimental",
  "multimedia": "experimental",
  "microlearning": "experimental",
  "predictive": "experimental",
  "achievement": "experimental",
  "multimodal": "experimental",
  "spaced-repetition": "experimental",
  // Scaffold — placeholder
  "social": "scaffold",
  "innovation": "scaffold",
  "market": "scaffold",
  "trends": "scaffold",
  "integrity": "scaffold"
};
function getEngineMaturity(engineId) {
  return ENGINE_MATURITY[engineId] ?? "scaffold";
}
function getModeMaturity(enginePreset) {
  const levels = enginePreset.map(
    (e) => ENGINE_MATURITY[e] ?? "scaffold"
  );
  const priority = {
    production: 3,
    beta: 2,
    experimental: 1,
    scaffold: 0
  };
  let minPriority = 3;
  for (const level of levels) {
    if (priority[level] < minPriority) {
      minPriority = priority[level];
    }
  }
  const reverseMap = {
    3: "production",
    2: "beta",
    1: "experimental",
    0: "scaffold"
  };
  return reverseMap[minPriority] ?? "scaffold";
}
function getEnginesByMaturity(level) {
  return Object.entries(ENGINE_MATURITY).filter(([, l]) => l === level).map(([id]) => id);
}
export {
  getEngineMaturity,
  getEnginesByMaturity,
  getModeMaturity
};
