// Job Market Tab - Integrated career analysis within existing analytics

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, Target, TrendingUp, DollarSign, MapPin, Star,
  Clock, Users, BookOpen, Zap, Brain, Award
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface JobMarketTabProps {
  user?: any;
  analytics?: any;
}

export function JobMarketTab({ user, analytics }: JobMarketTabProps) {
  const [jobMarketData, setJobMarketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchJobMarketData();
  }, []);

  const fetchJobMarketData = async () => {
    try {
      const response = await fetch('/api/job-market-mapping?action=get_market_mapping');
      const data = await response.json();
      if (data.success) {
        setJobMarketData(data);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch job market data:', error);
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
          options: { forceRefresh: true }
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchJobMarketData();
      }
    } catch (error) {
      console.error('Failed to generate mapping:', error);
    }
    setIsGenerating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing job market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">94%</p>
                <p className="text-sm text-muted-foreground">Career Readiness</p>
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
                <p className="text-sm text-muted-foreground">Avg Salary Match</p>
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
                <p className="text-sm text-muted-foreground">Career Pathways</p>
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
                <p className="text-sm text-muted-foreground">Job Matches</p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Assessment and Market Fit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Your Skills vs Market Demand</span>
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

        {/* Top Skills in Demand */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Market Value</CardTitle>
            <CardDescription>Top skills and their salary impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generateTopSkills().map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={skill.have ? 'default' : 'outline'}>
                        {skill.have ? 'Acquired' : 'Learn'}
                      </Badge>
                      <span className="text-sm text-green-600 font-medium">+${skill.salaryImpact}K</span>
                    </div>
                  </div>
                  <Progress value={skill.demand} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Career Pathways */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Career Pathways</CardTitle>
          <CardDescription>AI-generated pathways based on your skills and market trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generateCareerPathways().map((pathway, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">{pathway.title}</h4>
                      <Badge variant="default">{pathway.match}% match</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{pathway.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600 font-medium">{pathway.salary}</span>
                      <span className="text-muted-foreground">{pathway.growth}</span>
                    </div>
                    <div className="flex gap-2">
                      {pathway.skills.map((skill, skillIndex) => (
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

      {/* Salary Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Growth Projection</CardTitle>
          <CardDescription>Expected salary progression based on your career path</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={generateSalaryTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}K`} />
              <Line type="monotone" dataKey="salary" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={generateNewMapping} disabled={isGenerating}>
          <Zap className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Refresh Analysis'}
        </Button>
        <Button variant="outline" onClick={() => window.open('/job-market-mapping', '_blank')}>
          <Briefcase className="h-4 w-4 mr-2" />
          Open Full Job Market Tool
        </Button>
      </div>
    </div>
  );
}

// Mock data generators
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

function generateTopSkills() {
  return [
    { name: 'React/Next.js', demand: 95, have: true, salaryImpact: 15 },
    { name: 'TypeScript', demand: 88, have: true, salaryImpact: 10 },
    { name: 'AWS/Cloud', demand: 92, have: false, salaryImpact: 20 },
    { name: 'Python/AI', demand: 85, have: false, salaryImpact: 25 },
    { name: 'Docker/K8s', demand: 78, have: false, salaryImpact: 18 }
  ];
}

function generateCareerPathways() {
  return [
    {
      title: 'Senior Frontend Developer',
      description: 'Focus on advanced React and system architecture',
      match: 92,
      salary: '$95K - $120K',
      growth: '+25% demand',
      skills: ['React', 'TypeScript', 'System Design']
    },
    {
      title: 'Full Stack Engineer',
      description: 'Expand into backend and cloud technologies',
      match: 85,
      salary: '$100K - $130K',
      growth: '+30% demand',
      skills: ['Node.js', 'AWS', 'Databases']
    }
  ];
}

function generateSalaryTrends() {
  return [
    { year: 'Current', salary: 75 },
    { year: 'Year 1', salary: 85 },
    { year: 'Year 2', salary: 95 },
    { year: 'Year 3', salary: 110 },
    { year: 'Year 5', salary: 135 }
  ];
}