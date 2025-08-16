"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Zap,
  Brain,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  BookOpen,
  Code,
  Users,
  Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";

interface SkillGrowthTrackerProps {
  skills: any;
  growthMetrics: any;
  industryBenchmarks: any;
}

export default function SkillGrowthTracker({ 
  skills, 
  growthMetrics, 
  industryBenchmarks 
}: SkillGrowthTrackerProps) {
  // Mock skills data
  const mockSkills = [
    {
      id: "1",
      name: "React",
      category: "Frontend Development",
      currentLevel: 85,
      previousLevel: 75,
      industryBenchmark: 78,
      growth: "+10",
      status: "trending_up",
      experience: "2 years",
      projects: 8,
      certifications: 2,
      lastUpdated: "2 days ago"
    },
    {
      id: "2", 
      name: "TypeScript",
      category: "Programming Languages",
      currentLevel: 70,
      previousLevel: 60,
      industryBenchmark: 72,
      growth: "+10",
      status: "trending_up",
      experience: "1.5 years",
      projects: 5,
      certifications: 1,
      lastUpdated: "1 week ago"
    },
    {
      id: "3",
      name: "Node.js",
      category: "Backend Development", 
      currentLevel: 65,
      previousLevel: 68,
      industryBenchmark: 70,
      growth: "-3",
      status: "trending_down",
      experience: "1 year",
      projects: 3,
      certifications: 0,
      lastUpdated: "3 weeks ago"
    },
    {
      id: "4",
      name: "System Design",
      category: "Architecture",
      currentLevel: 45,
      previousLevel: 35,
      industryBenchmark: 60,
      growth: "+10",
      status: "trending_up",
      experience: "6 months",
      projects: 2,
      certifications: 0,
      lastUpdated: "1 day ago"
    }
  ];

  const displaySkills = skills || mockSkills;

  const getGrowthIcon = (status: string) => {
    switch (status) {
      case 'trending_up':
        return ArrowUp;
      case 'trending_down':
        return ArrowDown;
      case 'stable':
        return Minus;
      default:
        return ArrowUp;
    }
  };

  const getGrowthColor = (status: string) => {
    switch (status) {
      case 'trending_up':
        return 'text-green-600 dark:text-green-400';
      case 'trending_down':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getBenchmarkComparison = (current: number, benchmark: number) => {
    const diff = current - benchmark;
    if (diff > 0) {
      return { text: `+${diff} above average`, color: 'text-green-600 dark:text-green-400' };
    } else if (diff < 0) {
      return { text: `${diff} below average`, color: 'text-red-600 dark:text-red-400' };
    } else {
      return { text: 'At industry average', color: 'text-gray-600 dark:text-gray-400' };
    }
  };

  const getSkillLevelLabel = (level: number) => {
    if (level >= 90) return { label: 'Expert', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' };
    if (level >= 75) return { label: 'Advanced', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
    if (level >= 50) return { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
    if (level >= 25) return { label: 'Beginner', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
    return { label: 'Novice', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' };
  };

  const topSkills = displaySkills
    .sort((a: any, b: any) => b.currentLevel - a.currentLevel)
    .slice(0, 4);

  const averageGrowth = displaySkills.reduce((acc: number, skill: any) => {
    return acc + parseInt(skill.growth.replace('+', ''));
  }, 0) / displaySkills.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Skill Growth Tracker</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your skill development journey
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Brain className="h-3 w-3 mr-1" />
            AI Tracked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Growth Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              +{Math.round(averageGrowth)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Growth</p>
          </div>
          
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {displaySkills.reduce((acc: number, skill: any) => acc + skill.certifications, 0)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Certifications</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {displaySkills.filter((skill: any) => skill.currentLevel >= skill.industryBenchmark).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Above Average</p>
          </div>
        </div>

        {/* Top Skills */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-600" />
            Top Skills
          </h4>
          
          <div className="space-y-3">
            {topSkills.map((skill: any, index: number) => {
              const GrowthIcon = getGrowthIcon(skill.status);
              const growthColor = getGrowthColor(skill.status);
              const benchmark = getBenchmarkComparison(skill.currentLevel, skill.industryBenchmark);
              const levelInfo = getSkillLevelLabel(skill.currentLevel);
              
              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            {skill.name}
                          </h5>
                          <Badge variant="outline" className={levelInfo.color}>
                            {levelInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {skill.category}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 ${growthColor}`}>
                          <GrowthIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{skill.growth}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Current Level</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {skill.currentLevel}%
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={skill.currentLevel} className="h-2" />
                        {/* Industry benchmark indicator */}
                        <div 
                          className="absolute top-0 w-0.5 h-2 bg-gray-400 dark:bg-gray-500"
                          style={{ left: `${skill.industryBenchmark}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Previous: {skill.previousLevel}%</span>
                        <span className={benchmark.color}>
                          Industry avg: {skill.industryBenchmark}% ({benchmark.text})
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-gray-500">
                          <BookOpen className="h-3 w-3" />
                          <span>{skill.experience}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Code className="h-3 w-3" />
                          <span>{skill.projects} projects</span>
                        </div>
                        {skill.certifications > 0 && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Award className="h-3 w-3" />
                            <span>{skill.certifications} certs</span>
                          </div>
                        )}
                      </div>
                      <span className="text-gray-400">
                        Updated {skill.lastUpdated}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">AI Growth Recommendations</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/50 rounded mt-0.5">
                <Target className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Focus on Node.js improvement
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your backend skills are slightly behind industry standards. Consider taking an advanced Node.js course.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded mt-0.5">
                <Zap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Leverage your React expertise
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your React skills are above average. Consider mentoring others or creating content to boost your profile.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 