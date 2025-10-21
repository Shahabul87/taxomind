'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  TrendingUp, 
  Brain, 
  FileText, 
  BookOpen,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface SAMQuickAccessProps {
  courseId?: string;
  userId: string;
  role: 'ADMIN' | 'USER';
  variant?: 'compact' | 'full';
}

export function SAMQuickAccess({ 
  courseId, 
  userId, 
  role, 
  variant = 'compact' 
}: SAMQuickAccessProps) {
  const router = useRouter();
  const { toast } = useToast();

  const quickActions = [
    {
      title: 'Market Analysis',
      icon: TrendingUp,
      description: 'Course positioning',
      action: () => {
        toast({
          title: 'Market Analysis',
          description: 'This feature will be available soon. SAM has the market analysis engine integrated.',
        });
      },
      access: ['ADMIN'],
      color: 'text-blue-600',
    },
    {
      title: 'Bloom&apos;s Analysis',
      icon: Brain,
      description: 'Cognitive depth',
      action: () => {
        toast({
          title: 'Bloom\'s Analysis',
          description: 'This feature will be available soon. SAM has the Bloom\'s taxonomy engine integrated.',
        });
      },
      access: ['ADMIN', 'USER'],
      color: 'text-purple-600',
    },
    {
      title: 'Generate Exam',
      icon: FileText,
      description: 'Adaptive testing',
      action: () => {
        toast({
          title: 'Generate Exam',
          description: 'This feature will be available soon. SAM has the advanced exam engine integrated.',
        });
      },
      access: ['ADMIN'],
      color: 'text-green-600',
    },
    {
      title: 'My Progress',
      icon: BarChart3,
      description: 'Learning dashboard',
      action: () => {
        toast({
          title: 'My Progress',
          description: 'This feature will be available soon. SAM has the student dashboard engine integrated.',
        });
      },
      access: ['USER'],
      color: 'text-orange-600',
    },
    {
      title: 'Course Guide',
      icon: BookOpen,
      description: 'Improvement insights',
      action: () => {
        toast({
          title: 'Course Guide',
          description: 'This feature will be available soon. SAM has the course guide engine integrated.',
        });
      },
      access: ['ADMIN'],
      color: 'text-indigo-600',
    },
  ];

  const availableActions = quickActions.filter(action => 
    action.access.includes(role)
  );

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            SAM AI Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  size="sm"
                  onClick={action.action}
                  disabled={!courseId && action.access.includes('ADMIN')}
                >
                  <Icon className={`w-4 h-4 mr-1 ${action.color}`} />
                  {action.title}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          SAM AI Intelligence Suite
        </CardTitle>
        <CardDescription>
          Access advanced AI-powered analysis and insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.title}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={action.action}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  <div>
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            );
          })}
        </div>

        {!courseId && role === 'ADMIN' && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Select a course to access all features
          </p>
        )}
      </CardContent>
    </Card>
  );
}