'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Lightbulb, 
  Zap, 
  Target, 
  Sparkles,
  TrendingUp,
  Award,
  Star
} from 'lucide-react';

interface SkillsInventoryProps {
  skillsInventory: {
    criticalThinking: number;
    creativity: number;
    problemSolving: number;
    comprehension: number;
    retention: number;
  };
  performancePatterns?: {
    trend: string;
    consistency: number;
    growthRate: number;
  };
  optimalLearningStyle?: string;
}

export function SkillsInventory({
  skillsInventory,
  performancePatterns,
  optimalLearningStyle = 'mixed',
}: SkillsInventoryProps) {
  const skills = [
    {
      name: 'Critical Thinking',
      value: skillsInventory.criticalThinking,
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Ability to analyze and evaluate information objectively',
    },
    {
      name: 'Creativity',
      value: skillsInventory.creativity,
      icon: Sparkles,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      description: 'Capacity to generate original ideas and solutions',
    },
    {
      name: 'Problem Solving',
      value: skillsInventory.problemSolving,
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Skills in finding solutions to complex challenges',
    },
    {
      name: 'Comprehension',
      value: skillsInventory.comprehension,
      icon: Lightbulb,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Understanding and interpreting information effectively',
    },
    {
      name: 'Retention',
      value: skillsInventory.retention,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Ability to remember and recall information',
    },
  ];

  const getSkillLevel = (value: number): string => {
    if (value >= 80) return 'Expert';
    if (value >= 60) return 'Proficient';
    if (value >= 40) return 'Developing';
    return 'Beginner';
  };

  const getSkillBadgeVariant = (value: number) => {
    if (value >= 80) return 'default';
    if (value >= 60) return 'secondary';
    if (value >= 40) return 'outline';
    return 'destructive';
  };

  const learningStyleDescriptions: Record<string, string> = {
    visual: 'You learn best through images, diagrams, and visual representations',
    auditory: 'You excel when learning through listening and verbal explanations',
    kinesthetic: 'You thrive with hands-on activities and practical applications',
    logical: 'You prefer structured, analytical approaches to learning',
    social: 'You learn effectively through collaboration and discussion',
    solitary: 'You achieve best results through independent study and reflection',
    mixed: 'You adapt well to various learning methods and contexts',
  };

  const topSkills = [...skills].sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Skills Inventory
          </CardTitle>
          <CardDescription>
            Your cognitive abilities assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {skills.map((skill) => {
              const Icon = skill.icon;
              const level = getSkillLevel(skill.value);
              
              return (
                <div key={skill.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${skill.bgColor}`}>
                        <Icon className={`w-5 h-5 ${skill.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{skill.name}</p>
                        <p className="text-xs text-gray-500">{skill.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSkillBadgeVariant(skill.value)}>
                        {level}
                      </Badge>
                      <span className="text-sm font-medium">{skill.value.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Progress value={skill.value} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Skills Highlight */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Your Strongest Skills
          </CardTitle>
          <CardDescription>
            Areas where you excel the most
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSkills.map((skill, index) => {
              const Icon = skill.icon;
              return (
                <div
                  key={skill.name}
                  className={`relative p-4 rounded-lg border ${skill.bgColor}`}
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <Icon className={`w-8 h-8 ${skill.color} mb-2`} />
                  <h4 className="font-semibold mb-1">{skill.name}</h4>
                  <p className="text-2xl font-bold">{skill.value.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Learning Style */}
      <Card>
        <CardHeader>
          <CardTitle>Optimal Learning Style</CardTitle>
          <CardDescription>
            Your most effective learning approach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-semibold capitalize text-lg">
                  {optimalLearningStyle} Learner
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {learningStyleDescriptions[optimalLearningStyle]}
                </p>
              </div>
              <div className="text-4xl">
                {optimalLearningStyle === 'visual' && '👁️'}
                {optimalLearningStyle === 'auditory' && '👂'}
                {optimalLearningStyle === 'kinesthetic' && '🤸'}
                {optimalLearningStyle === 'logical' && '🧮'}
                {optimalLearningStyle === 'social' && '👥'}
                {optimalLearningStyle === 'solitary' && '🧘'}
                {optimalLearningStyle === 'mixed' && '🎯'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Patterns */}
      {performancePatterns && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Patterns
            </CardTitle>
            <CardDescription>
              Your learning consistency and growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Overall Trend</p>
                <p className="text-2xl font-bold capitalize">
                  {performancePatterns.trend}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Consistency</p>
                <p className="text-2xl font-bold">
                  {performancePatterns.consistency.toFixed(0)}%
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
                <p className="text-2xl font-bold">
                  {performancePatterns.growthRate > 0 ? '+' : ''}
                  {performancePatterns.growthRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Development Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Development Tips</CardTitle>
          <CardDescription>
            Personalized recommendations to enhance your abilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {skills
              .filter(skill => skill.value < 60)
              .map(skill => (
                <div key={skill.name} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <div>
                    <p className="text-sm font-medium">Improve {skill.name}</p>
                    <p className="text-xs text-gray-600">
                      Focus on activities that challenge your {skill.name.toLowerCase()} abilities
                    </p>
                  </div>
                </div>
              ))}
            {skills.filter(skill => skill.value < 60).length === 0 && (
              <p className="text-sm text-gray-600">
                Great job! All your skills are well-developed. Continue practicing to maintain your expertise.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}