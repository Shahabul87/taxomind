"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import type { BloomsLevel } from "@sam-ai/pedagogy";

interface AnalysisResult {
  distribution: Record<BloomsLevel, number>;
  dominantLevel: BloomsLevel;
  gaps: string[];
  verbCount: number;
  confidence: number;
}

const levelLabels: Record<BloomsLevel, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
};

const levelColors: Record<BloomsLevel, string> = {
  REMEMBER: "bg-violet-500",
  UNDERSTAND: "bg-blue-500",
  APPLY: "bg-emerald-500",
  ANALYZE: "bg-amber-500",
  EVALUATE: "bg-rose-500",
  CREATE: "bg-fuchsia-500",
};

const sampleContent = `In this lesson, students will learn to analyze complex data sets and evaluate different statistical methods.
They should be able to identify patterns in the data, compare various approaches, and justify their choice of analysis technique.
By the end, learners will create their own data visualization project that demonstrates understanding of key concepts.
Students will also recall fundamental statistical terms and explain how different methods apply to real-world scenarios.`;

export const EngineDemo = () => {
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeContent = useCallback(async () => {
    if (!content.trim() || content.trim().length < 20) {
      setError("Please enter at least 20 characters to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/blooms/demo-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Please try again.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  }, [content]);

  const loadSample = () => {
    setContent(sampleContent);
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">Try It Yourself</h4>
        <button
          onClick={loadSample}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Load Sample Content
        </button>
      </div>

      {/* Input Area */}
      <div className="relative mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your educational content here to analyze its cognitive level distribution..."
          className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
          {content.length} characters
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={analyzeContent}
        disabled={isAnalyzing || content.trim().length < 20}
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Analyze Content
          </>
        )}
      </button>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 space-y-6"
          >
            {/* Distribution Chart */}
            <div>
              <h5 className="text-sm font-medium text-gray-400 mb-3">
                Cognitive Level Distribution
              </h5>
              <div className="space-y-2">
                {(Object.keys(levelLabels) as BloomsLevel[]).map((level) => {
                  const percentage = result.distribution[level] ?? 0;
                  const isMax = level === result.dominantLevel;
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-gray-400">{levelLabels[level]}</div>
                      <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, percentage)}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className={`h-full ${levelColors[level]} ${isMax ? "opacity-100" : "opacity-60"}`}
                        />
                        {isMax && (
                          <div className="absolute inset-y-0 right-2 flex items-center">
                            <span className="text-xs font-semibold text-white/80">Dominant</span>
                          </div>
                        )}
                      </div>
                      <div className="w-12 text-right text-xs text-gray-400">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{result.verbCount}</div>
                <div className="text-xs text-gray-500 mt-1">Verbs Detected</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {(result.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Confidence</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {levelLabels[result.dominantLevel]}
                </div>
                <div className="text-xs text-gray-500 mt-1">Primary Level</div>
              </div>
            </div>

            {/* Gaps */}
            {result.gaps && result.gaps.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    Improvement Opportunities
                  </span>
                </div>
                <ul className="space-y-1">
                  {result.gaps.slice(0, 3).map((gap, i) => (
                    <li key={i} className="text-xs text-amber-300/80 flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
