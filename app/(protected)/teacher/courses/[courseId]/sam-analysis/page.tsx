'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SAMAnalyticsDashboard } from '@/components/sam/sam-analytics-dashboard';
import { logger } from '@/lib/logger';
import {
  TrendingUp,
  Brain,
  BookOpen,
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  Plus,
  Trash2,
  ExternalLink,
  Users,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RubricBuilder } from '@/components/sam/rubric-builder';

interface Competitor {
  id: string;
  competitorName: string;
  competitorUrl?: string;
  price: number;
  rating?: number;
  enrollments?: number;
  features: string[];
  strengths: string[];
  weaknesses: string[];
  analyzedAt: string;
}

interface DetailedRecommendation {
  urgency?: string;
  priority?: string;
  type?: string;
  action?: string;
  title?: string;
  reason?: string;
  description?: string;
  tasks?: string[];
  actions?: string[];
  expectedImpact?: string;
  timeframe?: string;
}

export default function SAMAnalysisPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [detailedRecommendations, setDetailedRecommendations] = useState<any>(null);
  const [isLoadingCompetitors, setIsLoadingCompetitors] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    url: '',
    price: '',
    rating: '',
    enrollments: '',
    features: '',
  });
  const isLoadingRef = useRef(false);
  const { toast } = useToast();

  const loadLatestAnalysis = useCallback(async () => {
    try {
      const response = await fetch(`/api/sam/integrated-analysis?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data.data);
      }
    } catch (error: any) {
      logger.error('Error loading analysis:', error);
    }
  }, [courseId]);

  // Load competitors
  const loadCompetitors = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoadingCompetitors(true);
    try {
      const response = await fetch(`/api/sam/course-market-analysis/competitors?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCompetitors(data.data || []);
      }
    } catch (error: any) {
      logger.error('Error loading competitors:', error);
    } finally {
      setIsLoadingCompetitors(false);
      isLoadingRef.current = false;
    }
  }, [courseId]);

  // Load detailed recommendations
  const loadDetailedRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    try {
      const response = await fetch('/api/sam/course-guide/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, focusArea: 'all', detailed: true }),
      });
      if (response.ok) {
        const data = await response.json();
        setDetailedRecommendations(data.data);
      }
    } catch (error: any) {
      logger.error('Error loading recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [courseId]);

  // Add competitor
  const addCompetitor = async () => {
    if (!newCompetitor.name.trim()) {
      toast({
        title: 'Error',
        description: 'Competitor name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/sam/course-market-analysis/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          competitorData: {
            name: newCompetitor.name,
            url: newCompetitor.url || undefined,
            price: newCompetitor.price ? parseFloat(newCompetitor.price) : 0,
            rating: newCompetitor.rating ? parseFloat(newCompetitor.rating) : undefined,
            enrollments: newCompetitor.enrollments ? parseInt(newCompetitor.enrollments) : undefined,
            features: newCompetitor.features ? newCompetitor.features.split(',').map(f => f.trim()) : [],
          },
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Competitor added successfully',
        });
        setNewCompetitor({ name: '', url: '', price: '', rating: '', enrollments: '', features: '' });
        setShowAddCompetitor(false);
        loadCompetitors();
      } else {
        throw new Error('Failed to add competitor');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to add competitor',
        variant: 'destructive',
      });
    }
  };

  // Delete competitor
  const deleteCompetitor = async (competitorId: string) => {
    try {
      const response = await fetch(`/api/sam/course-market-analysis/competitors?id=${competitorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Competitor removed',
        });
        loadCompetitors();
      } else {
        throw new Error('Failed to delete competitor');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove competitor',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadLatestAnalysis();
    loadCompetitors();
  }, [loadLatestAnalysis, loadCompetitors]);

  const runAnalysis = async (engineType: string) => {
    setIsLoading(true);
    try {
      let endpoint = '';
      let body = { courseId };

      switch (engineType) {
        case 'market':
          endpoint = '/api/sam/course-market-analysis';
          break;
        case 'blooms':
          endpoint = '/api/sam/blooms-analysis';
          break;
        case 'guide':
          endpoint = '/api/sam/course-guide';
          break;
        case 'integrated':
          endpoint = '/api/sam/integrated-analysis';
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();
      
      toast({
        title: 'Analysis Complete',
        description: `${engineType} analysis completed successfully`,
      });

      // Reload data
      await loadLatestAnalysis();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to run analysis',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (format: 'json' | 'html' = 'html') => {
    try {
      const response = await fetch(`/api/sam/course-guide?courseId=${courseId}&format=${format}`);
      
      if (format === 'html') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `course-analysis-${courseId}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `course-analysis-${courseId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: 'Export Complete',
        description: 'Analysis report downloaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: 'Could not export the report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SAM AI Analysis</h1>
          <p className="text-gray-500">
            Comprehensive course insights powered by AI
          </p>
        </div>
        <div className="flex gap-2">
          <RubricBuilder
            courseId={courseId}
            onSave={(rubric) => {
              toast({
                title: 'Rubric Saved',
                description: `"${rubric.title}" has been created successfully`,
              });
            }}
          />
          <Button
            variant="outline"
            onClick={() => exportReport('html')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button
            onClick={() => runAnalysis('integrated')}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-2" />
            )}
            Run Full Analysis
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
          <TabsTrigger value="blooms">Bloom&apos;s Analysis</TabsTrigger>
          <TabsTrigger value="guide">Course Guide</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SAMAnalyticsDashboard 
            courseId={courseId}
          />
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Market Analysis
              </CardTitle>
              <CardDescription>
                Course market positioning and growth insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => runAnalysis('market')}
                disabled={isLoading}
                className="mb-4"
              >
                Run Market Analysis
              </Button>

              {analysisData?.marketInsights && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {analysisData.marketInsights.market?.value || 0}
                      </p>
                      <p className="text-sm text-gray-500">Market Value</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {analysisData.marketInsights.market?.growthRate || 0}%
                      </p>
                      <p className="text-sm text-gray-500">Growth Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        ${analysisData.marketInsights.pricing?.optimal || 0}
                      </p>
                      <p className="text-sm text-gray-500">Optimal Price</p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline">
                        {analysisData.marketInsights.competition?.position || 'Unknown'}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">Market Position</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competitor Analysis Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Competitor Analysis
                  </CardTitle>
                  <CardDescription>
                    Track and analyze competing courses
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCompetitor(!showAddCompetitor)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Competitor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Competitor Form */}
              {showAddCompetitor && (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="comp-name">Name *</Label>
                        <Input
                          id="comp-name"
                          placeholder="Competitor course name"
                          value={newCompetitor.name}
                          onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comp-url">URL</Label>
                        <Input
                          id="comp-url"
                          placeholder="https://..."
                          value={newCompetitor.url}
                          onChange={(e) => setNewCompetitor({ ...newCompetitor, url: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comp-price">Price ($)</Label>
                        <Input
                          id="comp-price"
                          type="number"
                          placeholder="99.99"
                          value={newCompetitor.price}
                          onChange={(e) => setNewCompetitor({ ...newCompetitor, price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comp-rating">Rating</Label>
                        <Input
                          id="comp-rating"
                          type="number"
                          step="0.1"
                          max="5"
                          placeholder="4.5"
                          value={newCompetitor.rating}
                          onChange={(e) => setNewCompetitor({ ...newCompetitor, rating: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comp-enrollments">Enrollments</Label>
                        <Input
                          id="comp-enrollments"
                          type="number"
                          placeholder="1000"
                          value={newCompetitor.enrollments}
                          onChange={(e) => setNewCompetitor({ ...newCompetitor, enrollments: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comp-features">Features (comma-separated)</Label>
                        <Input
                          id="comp-features"
                          placeholder="Feature 1, Feature 2"
                          value={newCompetitor.features}
                          onChange={(e) => setNewCompetitor({ ...newCompetitor, features: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={addCompetitor}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddCompetitor(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Competitors List */}
              {isLoadingCompetitors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : competitors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No competitors tracked yet. Add competitors to analyze the competitive landscape.
                </p>
              ) : (
                <div className="grid gap-4">
                  {competitors.map((competitor) => (
                    <Card key={competitor.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{competitor.competitorName}</h4>
                              {competitor.competitorUrl && (
                                <a
                                  href={competitor.competitorUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>${competitor.price}</span>
                              {competitor.rating !== undefined && (
                                <span>⭐ {competitor.rating}</span>
                              )}
                              {competitor.enrollments !== undefined && (
                                <span>{competitor.enrollments.toLocaleString()} students</span>
                              )}
                            </div>
                            {competitor.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {competitor.features.slice(0, 5).map((feature, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteCompetitor(competitor.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Bloom&apos;s Taxonomy Analysis
              </CardTitle>
              <CardDescription>
                Cognitive depth and learning effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => runAnalysis('blooms')}
                disabled={isLoading}
                className="mb-4"
              >
                Run Bloom&apos;s Analysis
              </Button>

              {analysisData?.bloomsProfile && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cognitive Balance</p>
                    <Badge variant={
                      analysisData.bloomsProfile.courseLevel?.balance === 'well-balanced' 
                        ? 'default' 
                        : 'secondary'
                    }>
                      {analysisData.bloomsProfile.courseLevel?.balance || 'Unknown'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cognitive Depth Score</p>
                    <Progress 
                      value={analysisData.bloomsProfile.courseLevel?.cognitiveDepth || 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Course Guide
              </CardTitle>
              <CardDescription>
                Comprehensive improvement insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => runAnalysis('guide')}
                disabled={isLoading}
                className="mb-4"
              >
                Generate Course Guide
              </Button>

              {analysisData?.courseGuide && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Content Depth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analysisData.courseGuide.metrics?.depth?.overallDepth?.toFixed(0) || 0}%
                      </div>
                      <Progress 
                        value={analysisData.courseGuide.metrics?.depth?.overallDepth || 0} 
                        className="mt-2 h-1"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analysisData.courseGuide.metrics?.engagement?.overallEngagement?.toFixed(0) || 0}%
                      </div>
                      <Progress 
                        value={analysisData.courseGuide.metrics?.engagement?.overallEngagement || 0} 
                        className="mt-2 h-1"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Market Acceptance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analysisData.courseGuide.metrics?.marketAcceptance?.overallAcceptance?.toFixed(0) || 0}%
                      </div>
                      <Progress 
                        value={analysisData.courseGuide.metrics?.marketAcceptance?.overallAcceptance || 0} 
                        className="mt-2 h-1"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Integrated Recommendations
                  </CardTitle>
                  <CardDescription>
                    Prioritized actions from all analysis engines
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDetailedRecommendations}
                  disabled={isLoadingRecommendations}
                >
                  {isLoadingRecommendations ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Get AI Recommendations
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analysisData?.integratedRecommendations ? (
                <div className="space-y-4">
                  {analysisData.integratedRecommendations
                    .slice(0, 5)
                    .map((rec: any, index: number) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{rec.title}</CardTitle>
                            <Badge variant={
                              rec.priority === 'critical' ? 'destructive' :
                              rec.priority === 'high' ? 'default' :
                              'secondary'
                            }>
                              {rec.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <p className="text-xs text-gray-500">
                            Expected Impact: {rec.expectedImpact}
                          </p>
                        </CardContent>
                      </Card>
                    ))}

                  {analysisData.integratedRecommendations.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      + {analysisData.integratedRecommendations.length - 5} more recommendations
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Run integrated analysis to see recommendations
                </p>
              )}
            </CardContent>
          </Card>

          {/* Detailed AI Recommendations */}
          {detailedRecommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI-Powered Detailed Recommendations
                </CardTitle>
                <CardDescription>
                  Deep analysis and actionable suggestions from SAM AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Immediate Actions */}
                {detailedRecommendations.immediateActions && detailedRecommendations.immediateActions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-600 flex items-center gap-2">
                      🚨 Immediate Actions
                    </h4>
                    <div className="space-y-2">
                      {detailedRecommendations.immediateActions.map((action: DetailedRecommendation, idx: number) => (
                        <Card key={idx} className="border-red-200 bg-red-50">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{action.title || action.action}</p>
                                <p className="text-sm text-gray-600">{action.reason || action.description}</p>
                              </div>
                              {action.urgency && (
                                <Badge variant="destructive">{action.urgency}</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* High Priority */}
                {detailedRecommendations.highPriority && detailedRecommendations.highPriority.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-600 flex items-center gap-2">
                      ⚡ High Priority
                    </h4>
                    <div className="space-y-2">
                      {detailedRecommendations.highPriority.map((action: DetailedRecommendation, idx: number) => (
                        <Card key={idx} className="border-orange-200 bg-orange-50">
                          <CardContent className="pt-4">
                            <p className="font-medium">{action.title || action.action}</p>
                            <p className="text-sm text-gray-600">{action.reason || action.description}</p>
                            {(action.tasks || action.actions) && (
                              <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                                {(action.tasks || action.actions || []).slice(0, 3).map((task: string, taskIdx: number) => (
                                  <li key={taskIdx}>{task}</li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medium Priority */}
                {detailedRecommendations.mediumPriority && detailedRecommendations.mediumPriority.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                      📋 Medium Priority
                    </h4>
                    <div className="space-y-2">
                      {detailedRecommendations.mediumPriority.map((action: DetailedRecommendation, idx: number) => (
                        <Card key={idx} className="border-blue-200 bg-blue-50">
                          <CardContent className="pt-4">
                            <p className="font-medium">{action.title || action.action}</p>
                            <p className="text-sm text-gray-600">{action.reason || action.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Long Term Goals */}
                {detailedRecommendations.longTermGoals && detailedRecommendations.longTermGoals.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600 flex items-center gap-2">
                      🎯 Long Term Goals
                    </h4>
                    <div className="space-y-2">
                      {detailedRecommendations.longTermGoals.map((goal: DetailedRecommendation, idx: number) => (
                        <Card key={idx} className="border-green-200 bg-green-50">
                          <CardContent className="pt-4">
                            <p className="font-medium">{goal.title || goal.action}</p>
                            <p className="text-sm text-gray-600">{goal.reason || goal.description}</p>
                            {goal.timeframe && (
                              <p className="text-xs text-gray-500 mt-1">Timeframe: {goal.timeframe}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}