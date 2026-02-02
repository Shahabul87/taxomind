"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/engine-maturity.ts
var engine_maturity_exports = {};
__export(engine_maturity_exports, {
  getEngineMaturity: () => getEngineMaturity,
  getEnginesByMaturity: () => getEnginesByMaturity,
  getModeMaturity: () => getModeMaturity
});
module.exports = __toCommonJS(engine_maturity_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getEngineMaturity,
  getEnginesByMaturity,
  getModeMaturity
});
