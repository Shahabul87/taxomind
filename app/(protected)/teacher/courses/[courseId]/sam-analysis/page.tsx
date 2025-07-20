'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SAMAnalyticsDashboard } from '@/components/sam/sam-analytics-dashboard';
import { 
  TrendingUp, 
  Brain, 
  BookOpen, 
  FileText,
  Download,
  RefreshCw,
  ChartBar
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SAMAnalysisPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadLatestAnalysis = useCallback(async () => {
    try {
      const response = await fetch(`/api/sam/integrated-analysis?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data.data);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  }, [courseId]);

  useEffect(() => {
    loadLatestAnalysis();
  }, [loadLatestAnalysis]);

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
    } catch (error) {
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
    } catch (error) {
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
              <ChartBar className="w-4 h-4 mr-2" />
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
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Integrated Recommendations
              </CardTitle>
              <CardDescription>
                Prioritized actions from all analysis engines
              </CardDescription>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}