'use client';

import { useCourseCreation, getBloomsLevelColor, getBloomsLevelEmoji, getRecommendedBloomsLevel, type FieldContext, type BloomsAnalysisResponse } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { useState } from 'react';
import { X, Sparkles, TrendingUp, AlertCircle, Loader2, ChevronRight, BarChart3 } from 'lucide-react';
import { BloomsLevel } from '@prisma/client';

export function SAMContextualPanel() {
  const {
    currentField,
    bloomsAnalysis,
    isAnalyzing,
    samPanelOpen,
    setSamPanelOpen,
  } = useCourseCreation();

  if (!samPanelOpen) {
    return (
      <button
        onClick={() => setSamPanelOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="sam-contextual-panel w-96 border-l bg-gradient-to-b from-blue-50 to-white p-6 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-lg">SAM Assistant</h2>
        </div>
        <button
          onClick={() => setSamPanelOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Current Field Analysis */}
      {currentField && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Field Analysis</h3>
          <FieldAnalysisCard fieldContext={currentField} />
        </div>
      )}

      {/* Overall Course Analysis */}
      {bloomsAnalysis && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Course Overview</h3>
          <CourseBloomsOverview analysis={bloomsAnalysis} isAnalyzing={isAnalyzing} />
        </div>
      )}

      {/* Quick Actions */}
      {currentField && (
        <div className="mt-auto">
          <QuickActionsPanel fieldContext={currentField} />
        </div>
      )}

      {/* Empty state */}
      {!currentField && !bloomsAnalysis && (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
          <Sparkles className="w-12 h-12 mb-3 text-gray-300" />
          <p className="text-sm">Click on any field to get SAM&apos;s suggestions</p>
        </div>
      )}
    </div>
  );
}

interface FieldAnalysisCardProps {
  fieldContext: FieldContext;
}

function FieldAnalysisCard({ fieldContext }: FieldAnalysisCardProps) {
  const currentLevel = fieldContext.bloomsLevel;
  const recommendedLevel = getRecommendedBloomsLevel(fieldContext.fieldType);
  const isOptimal = currentLevel === recommendedLevel ||
                    (currentLevel && getBloomsHierarchy(currentLevel) >= getBloomsHierarchy(recommendedLevel));

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          {fieldContext.fieldName.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
        </span>
        <span className="text-xs text-gray-500">{fieldContext.fieldType}</span>
      </div>

      {/* Current Bloom's Level */}
      {currentLevel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Current Level:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getBloomsLevelColor(currentLevel)}`}>
              {getBloomsLevelEmoji(currentLevel)} {currentLevel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Recommended:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getBloomsLevelColor(recommendedLevel)}`}>
              {getBloomsLevelEmoji(recommendedLevel)} {recommendedLevel}
            </span>
          </div>

          {/* Status indicator */}
          {isOptimal ? (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 p-2 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>Excellent! This is at an appropriate cognitive level.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-2 rounded">
              <AlertCircle className="w-3 h-3" />
              <span>Consider elevating to {recommendedLevel} level</span>
            </div>
          )}
        </div>
      )}

      {/* No level detected */}
      {!currentLevel && fieldContext.fieldValue.length > 5 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          Keep typing... SAM will analyze the Bloom&apos;s level as you write.
        </div>
      )}
    </div>
  );
}

interface CourseBloomsOverviewProps {
  analysis: BloomsAnalysisResponse;
  isAnalyzing: boolean;
}

function CourseBloomsOverview({ analysis, isAnalyzing }: CourseBloomsOverviewProps) {
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-lg border p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-gray-600">Analyzing course...</span>
      </div>
    );
  }

  const { distribution, cognitiveDepth, balance } = analysis.courseLevel;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      {/* Bloom's Distribution Chart */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">Bloom&apos;s Distribution</span>
        </div>
        <div className="space-y-1">
          {Object.entries(distribution).map(([level, percentage]) => (
            <BloomsDistributionBar
              key={level}
              level={level as BloomsLevel}
              percentage={percentage as number}
            />
          ))}
        </div>
      </div>

      {/* Cognitive Depth */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Cognitive Depth:</span>
        <span className="font-semibold">{cognitiveDepth.toFixed(1)}/100</span>
      </div>

      {/* Balance Assessment */}
      <div>
        <div className="text-xs text-gray-600 mb-1">Balance:</div>
        {balance === 'well-balanced' ? (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 p-2 rounded">
            <TrendingUp className="w-3 h-3" />
            <span>Well-balanced course</span>
          </div>
        ) : balance === 'bottom-heavy' ? (
          <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>Too much focus on lower levels (REMEMBER/UNDERSTAND)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>Heavy focus on higher-order thinking</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BloomsDistributionBar({ level, percentage }: { level: BloomsLevel; percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-24 text-gray-600">
        {getBloomsLevelEmoji(level)} {level}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getBloomsLevelColor(level).split(' ')[0]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs w-10 text-right text-gray-600">{percentage.toFixed(0)}%</span>
    </div>
  );
}

interface QuickActionsPanelProps {
  fieldContext: FieldContext;
}

function QuickActionsPanel({ fieldContext }: QuickActionsPanelProps) {
  const [samResponse, setSamResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuickAction = async (prompt: string) => {
    setIsGenerating(true);
    setSamResponse('');

    try {
      const response = await fetch('/api/sam/contextual-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          fieldContext,
        }),
      });

      const data = await response.json();
      setSamResponse(data.response);
    } catch (error) {
      console.error('Failed to get SAM response:', error);
      setSamResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickActions = getQuickActionsForFieldType(fieldContext.fieldType);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Quick Actions</h4>

      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.prompt)}
            disabled={isGenerating}
            className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* SAM Response */}
      {(isGenerating || samResponse) && (
        <div className="mt-4 p-3 bg-white rounded-lg border">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SAM is thinking...</span>
            </div>
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{samResponse}</div>
          )}
        </div>
      )}
    </div>
  );
}

function getQuickActionsForFieldType(fieldType: string) {
  switch (fieldType) {
    case 'title':
      return [
        { label: '✨ Suggest Title', prompt: 'Suggest 3 engaging course titles based on the content I&apos;ve entered' },
        { label: '🔍 Check Clarity', prompt: 'Is this title clear and specific enough?' },
        { label: '📈 Elevate Level', prompt: 'Rewrite this title to show application or higher-order thinking' },
      ];

    case 'description':
      return [
        { label: '💡 Improve', prompt: 'How can I improve this course description?' },
        { label: '🎯 Add Outcomes', prompt: 'What learning outcomes should I explicitly state in this description?' },
        { label: '📊 Bloom&apos;s Check', prompt: 'What Bloom&apos;s level is this description targeting, and how can I improve it?' },
      ];

    case 'objective':
      return [
        { label: '⬆️ Higher Level', prompt: 'Rewrite this objective at a higher Bloom&apos;s level (ANALYZE, EVALUATE, or CREATE)' },
        { label: '📏 Make Measurable', prompt: 'Make this objective measurable with specific action verbs' },
        { label: '🔧 Better Verbs', prompt: 'Suggest better action verbs for this learning objective' },
      ];

    case 'chapter':
    case 'section':
      return [
        { label: '📝 Expand', prompt: 'Help me expand this section with more detail' },
        { label: '🎓 Add Activities', prompt: 'Suggest 3 learning activities for this section' },
        { label: '✅ Check Alignment', prompt: 'Does this align with the course objectives?' },
      ];

    case 'assessment':
      return [
        { label: '❓ Generate Questions', prompt: 'Generate 5 assessment questions at different Bloom&apos;s levels' },
        { label: '🎯 Diversify', prompt: 'How can I make this assessment test multiple cognitive levels?' },
        { label: '📊 Rubric', prompt: 'Create a grading rubric for this assessment' },
      ];

    default:
      return [
        { label: '✨ Analyze', prompt: 'Analyze this content with Bloom&apos;s Taxonomy' },
        { label: '💡 Suggest', prompt: 'How can I improve this content?' },
      ];
  }
}

// Helper function to get Bloom's hierarchy level (for comparison)
function getBloomsHierarchy(level: BloomsLevel): number {
  const hierarchy: Record<BloomsLevel, number> = {
    REMEMBER: 1,
    UNDERSTAND: 2,
    APPLY: 3,
    ANALYZE: 4,
    EVALUATE: 5,
    CREATE: 6,
  };
  return hierarchy[level];
}
