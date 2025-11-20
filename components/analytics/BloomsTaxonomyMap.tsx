"use client";

import { motion } from 'framer-motion';
import { 
  Eye, MessageSquare, Wrench, Search, Scale, Palette,
  TrendingUp, TrendingDown, Minus, ChevronRight, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface BloomsLevel {
  level: string;
  description: string;
  score: number;
  maxScore: number;
  questions: number;
  correct: number;
  color: string;
  improvements: string[];
  examples: string[];
}

interface BloomsTaxonomyMapProps {
  levels: BloomsLevel[];
}

const bloomsIcons = {
  "Remember": Eye,
  "Understand": MessageSquare,
  "Apply": Wrench,
  "Analyze": Search,
  "Evaluate": Scale,
  "Create": Palette
};

export function BloomsTaxonomyMap({ levels }: BloomsTaxonomyMapProps) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getTrendIcon = (score: number) => {
    if (score >= 80) return TrendingUp;
    if (score >= 60) return Minus;
    return TrendingDown;
  };

  // Define unique colors for each Bloom's level
  const getLevelCardColor = (level: string) => {
    switch(level) {
      case 'Remember': return 'border-emerald-200 dark:border-emerald-700 bg-white/80 dark:bg-slate-800/80';
      case 'Understand': return 'border-blue-200 dark:border-blue-700 bg-white/80 dark:bg-slate-800/80';
      case 'Apply': return 'border-purple-200 dark:border-purple-700 bg-white/80 dark:bg-slate-800/80';
      case 'Analyze': return 'border-amber-200 dark:border-amber-700 bg-white/80 dark:bg-slate-800/80';
      case 'Evaluate': return 'border-pink-200 dark:border-pink-700 bg-white/80 dark:bg-slate-800/80';
      case 'Create': return 'border-violet-200 dark:border-violet-700 bg-white/80 dark:bg-slate-800/80';
      default: return 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80';
    }
  };

  const getLevelTextColor = (level: string) => {
    switch(level) {
      case 'Remember': return 'text-emerald-700 dark:text-emerald-400';
      case 'Understand': return 'text-blue-700 dark:text-blue-400';
      case 'Apply': return 'text-purple-700 dark:text-purple-400';
      case 'Analyze': return 'text-amber-700 dark:text-amber-400';
      case 'Evaluate': return 'text-pink-700 dark:text-pink-400';
      case 'Create': return 'text-violet-700 dark:text-violet-400';
      default: return 'text-slate-700 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Pyramid Visualization */}
      <Card className="border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl">
        <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white text-base sm:text-lg md:text-xl">
            <div className="p-1.5 sm:p-2 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="break-words">Bloom&apos;s Taxonomy Cognitive Pyramid</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-2 sm:space-y-3">
            {levels.map((level, index) => {
              const Icon = bloomsIcons[level.level as keyof typeof bloomsIcons];
              const TrendIcon = getTrendIcon(level.score);
              const reversedIndex = levels.length - 1 - index;
              const width = `${60 + (reversedIndex * 8)}%`;
              
              return (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative mx-auto cursor-pointer transition-all duration-300 hover:scale-105 touch-manipulation active:scale-[0.98] ${
                    selectedLevel === level.level ? 'ring-2 ring-purple-400' : ''
                  }`}
                  style={{ width }}
                  onClick={() => setSelectedLevel(selectedLevel === level.level ? null : level.level)}
                >
                  <div className={`bg-gradient-to-r ${level.color} p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-purple-200 shadow-lg`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-blue-50 gap-3 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className="p-1.5 sm:p-2 bg-blue-50/30 rounded-lg flex-shrink-0">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm sm:text-base md:text-lg break-words">{level.level}</h3>
                          <p className="text-blue-50/90 text-xs sm:text-sm break-words leading-tight">{level.description}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto flex sm:block items-center justify-between sm:justify-end">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <TrendIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold">{level.score}%</span>
                        </div>
                        <div className="text-blue-50/90 text-xs">
                          {level.correct}/{level.questions} correct
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-3">
                      <Progress 
                        value={level.score} 
                        className="h-1.5 sm:h-2 bg-blue-50/30"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Level Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {levels.map((level, index) => {
          const Icon = bloomsIcons[level.level as keyof typeof bloomsIcons];
          const isExpanded = selectedLevel === level.level;
          const cardColor = getLevelCardColor(level.level);
          const textColor = getLevelTextColor(level.level);
          
          return (
            <motion.div
              key={level.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`transition-all duration-300 ${isExpanded ? 'md:col-span-2' : ''}`}
            >
              <Card className={`border-2 transition-all duration-300 ${cardColor} rounded-xl sm:rounded-2xl ${
                isExpanded 
                  ? 'border-opacity-80 shadow-lg' 
                  : 'hover:border-opacity-80'
              }`}>
                <CardHeader 
                  className="cursor-pointer px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 touch-manipulation"
                  onClick={() => setSelectedLevel(isExpanded ? null : level.level)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <div className={`p-1.5 sm:p-2 bg-gradient-to-r ${level.color} rounded-lg flex-shrink-0`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className={`${textColor} text-base sm:text-lg break-words`}>{level.level}</CardTitle>
                        <p className={`text-xs sm:text-sm ${textColor} opacity-80 break-words leading-tight`}>{level.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <Badge className={`${getPerformanceColor(level.score)} text-xs sm:text-sm`}>
                        {level.score}%
                      </Badge>
                      <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${textColor} opacity-70 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <h4 className={`font-semibold ${textColor} flex items-center gap-2 text-sm sm:text-base`}>
                          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                          Performance Insights
                        </h4>
                        <ul className="space-y-1.5">
                          {level.improvements.map((improvement, idx) => (
                            <li key={idx} className={`text-xs sm:text-sm ${textColor} opacity-80 flex items-start gap-2 leading-relaxed break-words`}>
                              <div className={`w-1.5 h-1.5 bg-current rounded-full mt-1.5 sm:mt-2 flex-shrink-0 opacity-60`}></div>
                              <span className="flex-1">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className={`font-semibold ${textColor} flex items-center gap-2 text-sm sm:text-base`}>
                          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                          Example Activities
                        </h4>
                        <ul className="space-y-1.5">
                          {level.examples.map((example, idx) => (
                            <li key={idx} className={`text-xs sm:text-sm ${textColor} opacity-80 flex items-start gap-2 leading-relaxed break-words`}>
                              <div className={`w-1.5 h-1.5 bg-current rounded-full mt-1.5 sm:mt-2 flex-shrink-0 opacity-60`}></div>
                              <span className="flex-1">{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className={`font-semibold ${textColor} text-sm sm:text-base`}>Performance Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className={`${textColor} opacity-80`}>Accuracy</span>
                            <span className={`font-medium ${textColor}`}>
                              {Math.round((level.correct / level.questions) * 100)}%
                            </span>
                          </div>
                          <Progress value={(level.correct / level.questions) * 100} className="h-1.5 sm:h-2" />
                          
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className={`${textColor} opacity-80`}>Questions Attempted</span>
                            <span className={`font-medium ${textColor}`}>{level.questions}</span>
                          </div>
                          
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className={`${textColor} opacity-80`}>Correct Answers</span>
                            <span className={`font-medium ${textColor}`}>{level.correct}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm font-medium touch-manipulation flex-1 sm:flex-none px-3 sm:px-4">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="break-words">Practice Lower Levels</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm font-medium touch-manipulation flex-1 sm:flex-none px-3 sm:px-4">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="break-words">Focus on Analysis</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm font-medium touch-manipulation flex-1 sm:flex-none px-3 sm:px-4">
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="break-words">Creative Exercises</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm font-medium touch-manipulation flex-1 sm:flex-none px-3 sm:px-4">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="break-words">Critical Thinking</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}