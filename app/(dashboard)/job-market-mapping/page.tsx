// Job Market Mapping Interface - Complete career analysis and recommendations

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '@/lib/logger';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Briefcase, Target, TrendingUp, DollarSign, MapPin, Star, 
  Clock, Users, BookOpen, Zap, Brain, Award, AlertCircle, CheckCircle
} from 'lucide-react';

interface JobMarketData {
  mapping: any;
  readiness: any;
  pathways: any;
  salaryInsights: any;
  marketTrends: any;
}

export default function JobMarketMappingInterface() {
  const [jobMarketData, setJobMarketData] = useState<JobMarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchJobMarketData();
  }, []);

  const fetchJobMarketData = async () => {
    try {
      const [mapping, readiness, pathways, trends] = await Promise.all([
        fetch('/api/job-market-mapping?action=get_market_mapping').then(res => res.json()),
        fetch('/api/job-market-mapping?action=analyze_career_readiness').then(res => res.json()),
        fetch('/api/job-market-mapping?action=get_career_pathways').then(res => res.json()),
        fetch('/api/job-market-mapping?action=track_market_trends').then(res => res.json())
      ]);

      setJobMarketData({
        mapping: mapping.mapping || {},
        readiness: readiness.readiness || {},
        pathways: pathways.pathways || [],
        salaryInsights: {},
        marketTrends: trends.trends || {
}
      });
      setIsLoading(false);
    } catch (error: any) {
      logger.error('Failed to fetch job market data:', error);
      setIsLoading(false);
    }
  };

  const generateNewMapping = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/job-market-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_mapping',
          options: {
            includeProjections: true,
            timeHorizon: 12,
            forceRefresh: true
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchJobMarketData();
      }
    } catch (error: any) {
      logger.error('Failed to generate mapping:', error);
    }
    setIsGenerating(false);
  };

  const getSalaryInsights = async (role: string) => {
    try {
      const response = await fetch(`/api/job-market-mapping?action=get_salary_insights&targetRole=${role}`);
      const result = await response.json();
      if (result.success) {
        setJobMarketData(prev => prev ? { ...prev, salaryInsights: result.insights } : null);
      }
    } catch (error: any) {
      logger.error('Failed to get salary insights:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Analyzing job market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Market Intelligence</h1>
          <p className="text-gray-600 mt-1">
            AI-powered career analysis and market insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={generateNewMapping} 
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>{isGenerating ? "Generating..." : "Refresh Analysis"}</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">94%</p>
                <p className="text-sm text-gray-600">Career Readiness</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">$95K</p>
                <p className="text-sm text-gray-600">Avg Salary Match</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">12</p>
                <p className="text-sm text-gray-600">Career Pathways</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">2.3K</p>
                <p className="text-sm text-gray-600">Job Matches</p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="readiness">Career Readiness</TabsTrigger>
          <TabsTrigger value="pathways">Career Pathways</TabsTrigger>
          <TabsTrigger value="skills">Skill Analysis</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Current Skills Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <span>Skills Assessment</span>
                </CardTitle>
                <CardDescription>Your current skill levels and market value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generateSkillsData().map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <Badge variant={skill.level >= 80 ? 'default' : skill.level >= 60 ? 'secondary' : 'outline'}>
                          {skill.level}%
                        </Badge>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Market Value: ${skill.marketValue}K</span>
                        <span>Demand: {skill.demand}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Job Market Fit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span>Job Market Fit Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={generateRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Your Skills" dataKey="current" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Radar name="Market Demand" dataKey="demand" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Job Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Job Recommendations</CardTitle>
              <CardDescription>Best matching opportunities based on your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generateJobRecommendations().map((job, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm">{job.title}</h4>
                          <Badge variant="outline">{job.match}% match</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-green-600 font-medium">{job.salary}</span>
                          <span className="text-gray-500">{job.location}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills.slice(0, 3).map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career Readiness Tab */}
        <TabsContent value="readiness" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Readiness Score */}
            <Card>
              <CardHeader>
                <CardTitle>Career Readiness Assessment</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                            strokeDasharray={`${2 * Math.PI * 56}`} strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.94)}`}
                            className="text-blue-600" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">94%</span>
                  </div>
                </div>
                <p className="text-lg font-semibold mt-4">Excellent Readiness</p>
                <p className="text-sm text-gray-600">You&apos;re well-prepared for your target roles</p>
              </CardContent>
            </Card>

            {/* Readiness Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Readiness Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ReadinessFactorItem 
                    icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                    title="Technical Skills"
                    score={96}
                    description="Strong programming and technical abilities"
                  />
                  <ReadinessFactorItem 
                    icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                    title="Experience Level"
                    score={88}
                    description="Good project and work experience"
                  />
                  <ReadinessFactorItem 
                    icon={<AlertCircle className="h-5 w-5 text-yellow-500" />}
                    title="Soft Skills"
                    score={72}
                    description="Room for improvement in communication"
                  />
                  <ReadinessFactorItem 
                    icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                    title="Industry Knowledge"
                    score={91}
                    description="Excellent understanding of industry trends"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Improvement Roadmap */}
          <Card>
            <CardHeader>
              <CardTitle>Improvement Roadmap</CardTitle>
              <CardDescription>Recommended steps to enhance your career readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generateImprovementRoadmap().map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.duration}</span>
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career Pathways Tab */}
        <TabsContent value="pathways" className="space-y-6">
          <div className="space-y-6">
            {generateCareerPathways().map((pathway, index) => (
              <Card key={index} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-purple-500" />
                        <span>{pathway.title}</span>
                      </CardTitle>
                      <CardDescription>{pathway.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="mb-2">{pathway.successRate}% success rate</Badge>
                      <p className="text-sm text-gray-600">Est. {pathway.timeToComplete}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Pathway Steps */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Key Steps</h4>
                      <div className="space-y-2">
                        {pathway.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Required Skills */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Required Skills</h4>
                      <div className="space-y-2">
                        {pathway.skills.map((skill, skillIndex) => (
                          <div key={skillIndex} className="flex justify-between items-center text-sm">
                            <span>{skill.name}</span>
                            <Badge variant={skill.have ? 'default' : 'outline'}>
                              {skill.have ? '✓' : 'Learn'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Salary Progression */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Salary Progression</h4>
                      <div className="space-y-2">
                        {pathway.salaryProgression.map((level, levelIndex) => (
                          <div key={levelIndex} className="flex justify-between items-center text-sm">
                            <span>{level.level}</span>
                            <span className="font-medium text-green-600">{level.salary}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button className="w-full" onClick={() => alert('Starting career pathway...')}>
                      Start This Pathway
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Skill Market Value */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Market Value Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateSkillValueData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Skill Gap Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Gap Analysis</CardTitle>
                <CardDescription>Skills to develop for your target roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generateSkillGaps().map((gap, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{gap.skill}</span>
                        <Badge variant={gap.priority === 'High' ? 'destructive' : gap.priority === 'Medium' ? 'default' : 'secondary'}>
                          {gap.priority}
                        </Badge>
                      </div>
                      <Progress value={gap.currentLevel} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Current: {gap.currentLevel}%</span>
                        <span>Target: {gap.targetLevel}%</span>
                      </div>
                      <p className="text-xs text-gray-600">{gap.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Personalized Learning Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generateLearningRecommendations().map((rec, index) => (
                  <Card key={index} className="border">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                        </div>
                        <p className="text-xs text-gray-600">{rec.description}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-purple-600 font-medium">{rec.duration}</span>
                          <Badge variant="outline">{rec.level}</Badge>
                        </div>
                        <Button size="sm" className="w-full mt-2">
                          Start Learning
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Salary Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Salary Trends</CardTitle>
                <CardDescription>Average salary trends for your skills</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={generateSalaryTrends()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="salary" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Industry Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Growth Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={generateIndustryGrowth()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="growth"
                      label={({ name, growth }) => `${name}: ${growth}%`}
                    >
                      {generateIndustryGrowth().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Market Insights & Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-semibold text-blue-800 mb-2">Emerging Technology</h4>
                  <p className="text-sm text-blue-600">AI and Machine Learning roles are experiencing 45% growth this year</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-semibold text-green-800 mb-2">Remote Work Trend</h4>
                  <p className="text-sm text-green-600">85% of tech companies now offer fully remote positions</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                  <h4 className="font-semibold text-purple-800 mb-2">Skill Demand</h4>
                  <p className="text-sm text-purple-600">Cloud computing skills command 25% salary premium</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <h4 className="font-semibold text-orange-800 mb-2">Career Mobility</h4>
                  <p className="text-sm text-orange-600">Average time to promotion decreased to 18 months</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <BookOpen className="h-6 w-6" />
              <span>Start Learning Path</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span>Network with Professionals</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Briefcase className="h-6 w-6" />
              <span>Apply to Jobs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function ReadinessFactorItem({ icon, title, score, description }: any) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-sm font-bold">{score}%</span>
        </div>
        <Progress value={score} className="h-2 mt-1" />
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

// Mock data generators
function generateSkillsData() {
  return [
    { name: 'JavaScript', level: 92, marketValue: 95, demand: 'High' },
    { name: 'React', level: 88, marketValue: 85, demand: 'High' },
    { name: 'Node.js', level: 76, marketValue: 80, demand: 'Medium' },
    { name: 'Python', level: 68, marketValue: 90, demand: 'High' },
    { name: 'AWS', level: 54, marketValue: 100, demand: 'Very High' }
  ];
}

function generateRadarData() {
  return [
    { skill: 'Frontend', current: 85, demand: 90 },
    { skill: 'Backend', current: 75, demand: 85 },
    { skill: 'DevOps', current: 60, demand: 95 },
    { skill: 'Mobile', current: 40, demand: 70 },
    { skill: 'AI/ML', current: 30, demand: 100 },
    { skill: 'Cloud', current: 55, demand: 95 }
  ];
}

function generateJobRecommendations() {
  return [
    {
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      salary: '$95K - $120K',
      location: 'Remote',
      match: 94,
      skills: ['React', 'TypeScript', 'GraphQL']
    },
    {
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      salary: '$85K - $110K',
      location: 'San Francisco',
      match: 89,
      skills: ['JavaScript', 'Node.js', 'AWS']
    },
    {
      title: 'React Developer',
      company: 'BigTech LLC',
      salary: '$100K - $130K',
      location: 'New York',
      match: 87,
      skills: ['React', 'Redux', 'Jest']
    }
  ];
}

function generateImprovementRoadmap() {
  return [
    {
      title: 'Improve Communication Skills',
      description: 'Take online communication course and practice presentation skills',
      duration: '2-3 months',
      priority: 'High'
    },
    {
      title: 'Learn Cloud Technologies',
      description: 'Get AWS certification to increase market value',
      duration: '4-6 months',
      priority: 'Medium'
    },
    {
      title: 'Build Portfolio Projects',
      description: 'Create 2-3 showcase projects demonstrating full-stack skills',
      duration: '3-4 months',
      priority: 'High'
    }
  ];
}

function generateCareerPathways() {
  return [
    {
      title: 'Senior Frontend Developer',
      description: 'Focus on advanced React and frontend technologies',
      successRate: 92,
      timeToComplete: '6-12 months',
      steps: [
        'Master advanced React patterns',
        'Learn TypeScript thoroughly',
        'Build complex portfolio projects',
        'Gain team leadership experience'
      ],
      skills: [
        { name: 'React', have: true },
        { name: 'TypeScript', have: false },
        { name: 'GraphQL', have: false },
        { name: 'Testing', have: true }
      ],
      salaryProgression: [
        { level: 'Current', salary: '$75K' },
        { level: '6 months', salary: '$85K' },
        { level: '12 months', salary: '$95K' }
      ]
    },
    {
      title: 'Full Stack Engineer',
      description: 'Develop both frontend and backend expertise',
      successRate: 85,
      timeToComplete: '8-15 months',
      steps: [
        'Strengthen backend skills',
        'Learn database design',
        'Master deployment processes',
        'Build full-stack applications'
      ],
      skills: [
        { name: 'Node.js', have: true },
        { name: 'Databases', have: false },
        { name: 'DevOps', have: false },
        { name: 'APIs', have: true }
      ],
      salaryProgression: [
        { level: 'Current', salary: '$75K' },
        { level: '8 months', salary: '$90K' },
        { level: '15 months', salary: '$105K' }
      ]
    }
  ];
}

function generateSkillValueData() {
  return [
    { skill: 'React', value: 85 },
    { skill: 'Node.js', value: 80 },
    { skill: 'Python', value: 90 },
    { skill: 'AWS', value: 100 },
    { skill: 'TypeScript', value: 75 }
  ];
}

function generateSkillGaps() {
  return [
    {
      skill: 'AWS/Cloud',
      currentLevel: 30,
      targetLevel: 80,
      priority: 'High',
      recommendation: 'Take AWS certification course and practice with real projects'
    },
    {
      skill: 'TypeScript',
      currentLevel: 45,
      targetLevel: 85,
      priority: 'Medium',
      recommendation: 'Convert existing projects to TypeScript and learn advanced types'
    },
    {
      skill: 'System Design',
      currentLevel: 25,
      targetLevel: 70,
      priority: 'High',
      recommendation: 'Study system design patterns and practice architectural decisions'
    }
  ];
}

function generateLearningRecommendations() {
  return [
    {
      title: 'AWS Cloud Practitioner',
      description: 'Learn cloud fundamentals and AWS services',
      duration: '4-6 weeks',
      level: 'Beginner'
    },
    {
      title: 'Advanced TypeScript',
      description: 'Master advanced TypeScript patterns and types',
      duration: '3-4 weeks',
      level: 'Intermediate'
    },
    {
      title: 'System Design Basics',
      description: 'Learn to design scalable systems',
      duration: '6-8 weeks',
      level: 'Intermediate'
    }
  ];
}

function generateSalaryTrends() {
  return [
    { year: '2020', salary: 75000 },
    { year: '2021', salary: 82000 },
    { year: '2022', salary: 89000 },
    { year: '2023', salary: 95000 },
    { year: '2024', salary: 102000 }
  ];
}

function generateIndustryGrowth() {
  return [
    { name: 'Tech', growth: 25 },
    { name: 'Finance', growth: 15 },
    { name: 'Healthcare', growth: 20 },
    { name: 'Education', growth: 18 },
    { name: 'Retail', growth: 8 }
  ];
}

function getColor(index: number) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  return colors[index % colors.length];
}