"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Briefcase,
  Code,
  Calculator,
  Palette,
  Globe,
  Search,
  Filter,
  Clock,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  EducationalPreset, 
  EducationalPresetManager,
  EDUCATIONAL_PRESETS 
} from '@/lib/educational-presets';

interface SmartPresetSelectorProps {
  onPresetSelect: (preset: EducationalPreset) => void;
  onCustomCreate: () => void;
  userProfile?: {
    experience?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
    previousCourses?: string[];
  };
  className?: string;
}

interface PresetCardProps {
  preset: EducationalPreset;
  onSelect: (preset: EducationalPreset) => void;
  isRecommended?: boolean;
  className?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'programming': return <Code className="w-5 h-5" />;
    case 'business': return <Briefcase className="w-5 h-5" />;
    case 'science': return <BookOpen className="w-5 h-5" />;
    case 'mathematics': return <Calculator className="w-5 h-5" />;
    case 'language': return <Globe className="w-5 h-5" />;
    case 'design': return <Palette className="w-5 h-5" />;
    default: return <BookOpen className="w-5 h-5" />;
  }
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'beginner': return 'bg-green-100 text-green-700 border-green-200';
    case 'intermediate': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'advanced': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'mixed': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getDurationInfo = (duration: string) => {
  switch (duration) {
    case 'short': return { text: '2-4 weeks', color: 'text-green-600' };
    case 'medium': return { text: '6-8 weeks', color: 'text-blue-600' };
    case 'long': return { text: '12+ weeks', color: 'text-purple-600' };
    default: return { text: 'Variable', color: 'text-gray-600' };
  }
};

const PresetCard: React.FC<PresetCardProps> = ({ preset, onSelect, isRecommended = false, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const durationInfo = getDurationInfo(preset.duration);
  
  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={cn(
        'h-full cursor-pointer transition-all duration-200 overflow-hidden',
        'hover:shadow-lg border-2',
        isRecommended 
          ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
      )}>
        {isRecommended && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-purple-600 text-white border-purple-700">
              <Star className="w-3 h-3 mr-1" />
              Recommended
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              )}>
                {getCategoryIcon(preset.category)}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {preset.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {preset.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn('border', getLevelColor(preset.level))}>
                {preset.level.charAt(0).toUpperCase() + preset.level.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {durationInfo.text}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {preset.targetAudience}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Learning Objectives</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {preset.learningObjectives.length} goals
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {preset.learningObjectives.slice(0, 3).map((objective, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      {objective}
                    </span>
                  </div>
                ))}
                {preset.learningObjectives.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                    +{preset.learningObjectives.length - 3} more objectives
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Course Structure</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {preset.courseStructure.length} modules
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {preset.courseStructure.slice(0, 2).map((module, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Target className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      {module.title}
                    </span>
                  </div>
                ))}
                {preset.courseStructure.length > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                    +{preset.courseStructure.length - 2} more modules
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Assessment Methods</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {preset.assessmentMethods.map((method, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {method}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={() => onSelect(preset)} 
                className={cn(
                  'w-full group transition-all duration-200',
                  isRecommended 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'
                )}
              >
                <span>Use This Preset</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const SmartPresetSelector = ({
  onPresetSelect,
  onCustomCreate,
  userProfile,
  className
}: SmartPresetSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recommended');

  const presetManager = useMemo(() => new EducationalPresetManager(), []);

  const filteredPresets = useMemo(() => {
    let filtered = EDUCATIONAL_PRESETS;

    if (searchTerm) {
      filtered = filtered.filter(preset => 
        preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        preset.learningObjectives.some(obj => 
          obj.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(preset => preset.category === selectedCategory);
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(preset => preset.level === selectedLevel);
    }

    if (selectedDuration !== 'all') {
      filtered = filtered.filter(preset => preset.duration === selectedDuration);
    }

    return filtered;
  }, [searchTerm, selectedCategory, selectedLevel, selectedDuration]);

  const recommendedPresets = useMemo(() => {
    if (!userProfile) return filteredPresets.slice(0, 3);
    
    return presetManager.getRecommendations(userProfile).slice(0, 3);
  }, [userProfile, presetManager, filteredPresets]);

  const categories = useMemo(() => {
    const cats = new Set(EDUCATIONAL_PRESETS.map(p => p.category));
    return Array.from(cats);
  }, []);

  const levels = ['beginner', 'intermediate', 'advanced', 'mixed'];
  const durations = ['short', 'medium', 'long'];

  return (
    <div className={cn('w-full space-y-6', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Choose Your Course Template
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select from our curated educational presets or create your own custom course
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="all">All Presets</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recommended for You
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Based on your profile and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedPresets.map((preset) => (
              <PresetCard 
                key={preset.id} 
                preset={preset} 
                onSelect={onPresetSelect}
                isRecommended={true}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search presets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                prefix={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Durations</SelectItem>
                  {durations.map(duration => (
                    <SelectItem key={duration} value={duration}>
                      {duration.charAt(0).toUpperCase() + duration.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPresets.map((preset) => (
              <PresetCard 
                key={preset.id} 
                preset={preset} 
                onSelect={onPresetSelect}
                isRecommended={recommendedPresets.some(r => r.id === preset.id)}
              />
            ))}
          </div>

          {filteredPresets.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400 mb-2">
                No presets found matching your criteria
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                  setSelectedDuration('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Custom Course
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Build your course from scratch with full customization
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Full Control
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Design every aspect of your course
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={onCustomCreate}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Start from Scratch
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};