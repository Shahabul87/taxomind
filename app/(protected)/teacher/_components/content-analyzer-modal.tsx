"use client";

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '@/lib/logger';
import { 
  Video, 
  FileText, 
  Code, 
  Image, 
  FileCheck, 
  HelpCircle, 
  Globe, 
  Upload,
  Microscope,
  Sparkles,
  BarChart3,
  Lightbulb,
  PlayCircle,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysis: any) => void;
  learningContext: any;
  tutorMode: 'teacher' | 'student';
}

export function ContentAnalyzerModal({ 
  isOpen, 
  onClose, 
  onAnalysisComplete, 
  learningContext, 
  tutorMode 
}: ContentAnalyzerModalProps) {
  const [selectedContentType, setSelectedContentType] = useState<string>('video');
  const [contentData, setContentData] = useState<any>({});
  const [analysisType, setAnalysisType] = useState<string>('comprehensive');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const contentTypes = [
    { id: 'video', label: 'Video', icon: Video, description: 'Analyze video content and transcripts' },
    { id: 'text', label: 'Text', icon: FileText, description: 'Analyze text documents and articles' },
    { id: 'code', label: 'Code', icon: Code, description: 'Analyze programming code and examples' },
    { id: 'image', label: 'Image', icon: Image, description: 'Analyze images and visual content' },
    { id: 'pdf', label: 'PDF', icon: FileCheck, description: 'Analyze PDF documents and papers' },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Analyze quizzes and assessments' },
    { id: 'webpage', label: 'Web Page', icon: Globe, description: 'Analyze web pages and online content' }
  ];

  const analysisTypes = [
    { id: 'comprehensive', label: 'Comprehensive Analysis', description: 'Full analysis with all features' },
    { id: 'educational', label: 'Educational Focus', description: 'Focus on learning objectives and pedagogy' },
    { id: 'accessibility', label: 'Accessibility Check', description: 'Analyze for accessibility and inclusion' },
    { id: 'difficulty', label: 'Difficulty Assessment', description: 'Assess complexity and difficulty level' },
    { id: 'engagement', label: 'Engagement Analysis', description: 'Analyze engagement and interaction potential' }
  ];

  const handleContentDataChange = useCallback((field: string, value: any) => {
    setContentData((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!contentData.title && !contentData.content && !contentData.url) {
      toast.error('Please provide content to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/sam/ai-tutor/content-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: selectedContentType,
          contentData,
          analysisType,
          learningContext,
          userRole: tutorMode
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults(data);
        onAnalysisComplete(data);
        toast.success('Content analysis completed successfully!');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      logger.error('Analysis error:', error);
      toast.error('Failed to analyze content. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedContentType, contentData, analysisType, learningContext, tutorMode, onAnalysisComplete]);

  const renderContentInput = () => {
    const ContentIcon = contentTypes.find(type => type.id === selectedContentType)?.icon || FileText;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <ContentIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">
            {contentTypes.find(type => type.id === selectedContentType)?.label} Analysis
          </h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter content title"
              value={contentData.title || ''}
              onChange={(e) => handleContentDataChange('title', e.target.value)}
            />
          </div>
          
          {selectedContentType === 'video' && (
            <>
              <div>
                <Label htmlFor="url">Video URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/video.mp4"
                  value={contentData.url || ''}
                  onChange={(e) => handleContentDataChange('url', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="15:30"
                  value={contentData.duration || ''}
                  onChange={(e) => handleContentDataChange('duration', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="transcript">Transcript (optional)</Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste video transcript here..."
                  value={contentData.transcript || ''}
                  onChange={(e) => handleContentDataChange('transcript', e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}
          
          {selectedContentType === 'text' && (
            <>
              <div>
                <Label htmlFor="content">Text Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste text content here..."
                  value={contentData.content || ''}
                  onChange={(e) => handleContentDataChange('content', e.target.value)}
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="type">Text Type</Label>
                <Select value={contentData.type || ''} onValueChange={(value) => handleContentDataChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select text type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="textbook">Textbook</SelectItem>
                    <SelectItem value="research">Research Paper</SelectItem>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {selectedContentType === 'code' && (
            <>
              <div>
                <Label htmlFor="code">Code</Label>
                <Textarea
                  id="code"
                  placeholder="Paste code here..."
                  value={contentData.code || ''}
                  onChange={(e) => handleContentDataChange('code', e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="language">Programming Language</Label>
                <Select value={contentData.language || ''} onValueChange={(value) => handleContentDataChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="nodejs">Node.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {selectedContentType === 'image' && (
            <>
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={contentData.url || ''}
                  onChange={(e) => handleContentDataChange('url', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the image content..."
                  value={contentData.description || ''}
                  onChange={(e) => handleContentDataChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  placeholder="Alternative text for accessibility"
                  value={contentData.altText || ''}
                  onChange={(e) => handleContentDataChange('altText', e.target.value)}
                />
              </div>
            </>
          )}
          
          {selectedContentType === 'webpage' && (
            <>
              <div>
                <Label htmlFor="webUrl">Website URL</Label>
                <Input
                  id="webUrl"
                  placeholder="https://example.com"
                  value={contentData.url || ''}
                  onChange={(e) => handleContentDataChange('url', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the webpage content..."
                  value={contentData.description || ''}
                  onChange={(e) => handleContentDataChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
          
          <div>
            <Label htmlFor="description">Additional Description</Label>
            <Textarea
              id="description"
              placeholder="Add any additional context or specific analysis requirements..."
              value={contentData.description || ''}
              onChange={(e) => handleContentDataChange('description', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysisResults = () => {
    if (!analysisResults) return null;
    
    const { analysis, suggestions } = analysisResults;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Analysis Results</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {analysis.keyTopics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Key Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyTopics.map((topic: string, index: number) => (
                    <Badge key={index} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {analysis.difficultyLevel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Difficulty Level</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={
                  analysis.difficultyLevel === 'beginner' ? 'default' :
                  analysis.difficultyLevel === 'intermediate' ? 'secondary' : 'destructive'
                }>
                  {analysis.difficultyLevel}
                </Badge>
              </CardContent>
            </Card>
          )}
          
          {analysis.learningObjectives && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {analysis.learningObjectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {analysis.studyQuestions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Study Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {analysis.studyQuestions.map((question: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{question}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {suggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestions.map((suggestion: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => toast.info(`Suggestion: ${suggestion}`)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Microscope className="w-5 h-5" />
            <span>SAM AI Content Analyzer</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="input">Content Input</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Type</CardTitle>
                <CardDescription>Select the type of content you want to analyze</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.id}
                        variant={selectedContentType === type.id ? "default" : "outline"}
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => setSelectedContentType(type.id)}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Analysis Type</CardTitle>
                <CardDescription>Choose the type of analysis to perform</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="input" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Input</CardTitle>
                <CardDescription>Provide the content you want to analyze</CardDescription>
              </CardHeader>
              <CardContent>
                {renderContentInput()}
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Content
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            {analysisResults ? renderAnalysisResults() : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No analysis results yet. Complete the content input and analysis first.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}