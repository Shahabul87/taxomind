"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bot, 
  Sparkles, 
  Lightbulb, 
  Target, 
  Zap,
  BookOpen,
  Video,
  Code,
  FileText,
  CheckCircle,
  Loader2,
  Wand2,
  Brain,
  TrendingUp,
  Eye,
  Settings,
  Award,
  RefreshCw,
  Wand,
  Palette,
  Users,
  Clock,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Star,
  ThumbsUp,
  Edit,
  Save,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SectionData {
  id: string;
  title: string;
  description?: string;
  chapterId: string;
  courseId: string;
  position: number;
  isPublished: boolean;
  videos?: any[];
  blogs?: any[];
  codeExplanations?: any[];
  mathEquations?: any[];
}

interface AIContentSuggestion {
  type: 'video' | 'blog' | 'code' | 'math' | 'quiz' | 'exercise';
  title: string;
  description: string;
  content: string;
  bloomsLevel: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface ContentAnalysis {
  currentBloomsLevel: string;
  suggestedLevel: string;
  contentGaps: string[];
  strengthAreas: string[];
  recommendations: string[];
  engagementScore: number;
  clarityScore: number;
  completenessScore: number;
}

interface AISectionAssistantProps {
  section: SectionData;
  chapterTitle?: string;
  courseTitle?: string;
}

const CONTENT_TYPES = [
  { value: 'video', label: 'Video Content', icon: Video, description: 'Engaging video explanations and demonstrations' },
  { value: 'blog', label: 'Written Content', icon: FileText, description: 'Comprehensive articles and reading materials' },
  { value: 'code', label: 'Code Examples', icon: Code, description: 'Interactive code snippets and explanations' },
  { value: 'quiz', label: 'Assessment', icon: Target, description: 'Quizzes and knowledge checks' },
  { value: 'exercise', label: 'Practice Exercise', icon: Zap, description: 'Hands-on activities and assignments' }
];

const ENHANCEMENT_TYPES = [
  { id: 'clarity', label: 'Improve Clarity', icon: Eye, description: 'Make content clearer and easier to understand' },
  { id: 'engagement', label: 'Boost Engagement', icon: Star, description: 'Add interactive elements and activities' },
  { id: 'depth', label: 'Add Depth', icon: Brain, description: 'Expand with advanced concepts and examples' },
  { id: 'examples', label: 'More Examples', icon: Lightbulb, description: 'Include practical examples and use cases' },
  { id: 'assessment', label: 'Add Assessment', icon: Target, description: 'Create quizzes and knowledge checks' }
];

export const AISectionAssistant = ({ 
  section, 
  chapterTitle, 
  courseTitle 
}: AISectionAssistantProps) => {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AIContentSuggestion[]>([]);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showContentModal, setShowContentModal] = useState(false);

  const analyzeSection = async () => {
    setIsGenerating(true);
    try {
      console.log('Analyzing section with AI...', section);
      
      const response = await fetch('/api/sections/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId: section.id,
          chapterId: section.chapterId,
          courseId: section.courseId,
          sectionData: {
            title: section.title,
            description: section.description,
            videos: section.videos,
            blogs: section.blogs,
            codeExplanations: section.codeExplanations
          },
          context: {
            chapterTitle,
            courseTitle
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze section');
      }

      const result = await response.json();
      setAnalysis(result.analysis);
      setSuggestions(result.suggestions);
      
      toast.success("Section analysis completed!");
    } catch (error) {
      console.error('Error analyzing section:', error);
      toast.error('Failed to analyze section. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContent = async (type: string, enhancement?: string) => {
    setIsGenerating(true);
    try {
      console.log('Generating content...', { type, enhancement, customPrompt });
      
      const response = await fetch('/api/sections/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId: section.id,
          chapterId: section.chapterId,
          courseId: section.courseId,
          contentType: type,
          enhancement,
          customPrompt,
          context: {
            sectionTitle: section.title,
            sectionDescription: section.description,
            chapterTitle,
            courseTitle,
            existingContent: {
              videos: section.videos?.length || 0,
              blogs: section.blogs?.length || 0,
              codes: section.codeExplanations?.length || 0
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const result = await response.json();
      setGeneratedContent(result.content);
      setShowContentModal(true);
      
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyContent = async (content: string, type: string) => {
    try {
      // Here you would integrate with the appropriate content creation API
      // For now, we'll just show success
      toast.success(`${type} content applied successfully!`);
      setShowContentModal(false);
      setGeneratedContent('');
      
      // Refresh the page to show new content
      window.location.reload();
    } catch (error) {
      console.error('Error applying content:', error);
      toast.error('Failed to apply content. Please try again.');
    }
  };

  const SmartSuggestions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">AI Content Suggestions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Intelligent recommendations based on your section content
          </p>
        </div>
        <Button 
          onClick={analyzeSection}
          disabled={isGenerating}
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Analyze Section
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Content Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(analysis.engagementScore * 100)}%
                </div>
                <div className="text-xs text-gray-600">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {Math.round(analysis.clarityScore * 100)}%
                </div>
                <div className="text-xs text-gray-600">Clarity</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(analysis.completenessScore * 100)}%
                </div>
                <div className="text-xs text-gray-600">Completeness</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Current Level: <Badge variant="outline">{analysis.currentBloomsLevel}</Badge></span>
              <span>Suggested: <Badge className="bg-blue-100 text-blue-800">{analysis.suggestedLevel}</Badge></span>
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Recommended Content</h4>
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{suggestion.type}</Badge>
                      <Badge variant="outline">{suggestion.bloomsLevel}</Badge>
                      <span className="text-xs text-gray-500">{suggestion.estimatedTime}</span>
                    </div>
                    <h5 className="font-medium mb-1">{suggestion.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => generateContent(suggestion.type)}
                    disabled={isGenerating}
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const ContentGenerator = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Create New Content</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate specific types of content for this section
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONTENT_TYPES.map((type) => {
          const IconComponent = type.icon;
          return (
            <Card 
              key={type.value}
              className="cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
              onClick={() => generateContent(type.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">{type.label}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {type.label}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Content Generation</CardTitle>
          <CardDescription>
            Describe what specific content you need for this section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="E.g., Create a practical example showing how to implement authentication in React..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={() => generateContent('custom')}
            disabled={!customPrompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Custom Content...
              </>
            ) : (
              <>
                <Wand className="h-4 w-4 mr-2" />
                Generate Custom Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const ContentEnhancer = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Enhance Existing Content</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Improve your current section content with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ENHANCEMENT_TYPES.map((enhancement) => {
          const IconComponent = enhancement.icon;
          return (
            <Card 
              key={enhancement.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-green-300"
              onClick={() => generateContent('enhancement', enhancement.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <IconComponent className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">{enhancement.label}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {enhancement.description}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Palette className="h-4 w-4 mr-2" />
                      {enhancement.label}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {analysis && analysis.recommendations.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600" />
          AI Section Assistant
        </CardTitle>
        <CardDescription>
          Intelligent content creation and enhancement for &quot;{section.title}&quot;
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Smart Suggestions</TabsTrigger>
            <TabsTrigger value="generate">Content Generator</TabsTrigger>
            <TabsTrigger value="enhance">Content Enhancer</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-4">
            <SmartSuggestions />
          </TabsContent>

          <TabsContent value="generate" className="mt-4">
            <ContentGenerator />
          </TabsContent>

          <TabsContent value="enhance" className="mt-4">
            <ContentEnhancer />
          </TabsContent>
        </Tabs>

        {/* Generated Content Modal */}
        <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generated Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Review the generated content below. You can edit it before applying to your section.
                </AlertDescription>
              </Alert>
              
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowContentModal(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={() => applyContent(generatedContent, selectedType)}>
                  <Save className="h-4 w-4 mr-2" />
                  Apply Content
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};