// Intelligent Features Menu - Quick access to all 18 AI features

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Briefcase, BarChart, Activity, Zap, BookOpen,
  Heart, Clock, MapPin, Star, Target, Cpu, Users
} from 'lucide-react';

export function IntelligentFeaturesMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const features = [
    {
      category: 'Student Features (8)',
      items: [
        {
          name: 'Student Learning Tools',
          icon: <BookOpen className="h-4 w-4" />,
          path: '/analytics/student?tab=student-features',
          badge: 'Personal',
          description: 'AI-powered learning assistance'
        },
        {
          name: 'Learning Analytics',
          icon: <BarChart className="h-4 w-4" />,
          path: '/analytics/student',
          badge: 'Live',
          description: 'Track your progress'
        }
      ]
    },
    {
      category: 'Teacher Features (7)',
      items: [
        {
          name: 'Teaching Intelligence',
          icon: <Users className="h-4 w-4" />,
          path: '/analytics/student?tab=teacher-features',
          badge: 'Classroom',
          description: 'Classroom management tools'
        },
        {
          name: 'Student Monitoring',
          icon: <Target className="h-4 w-4" />,
          path: '/analytics/student?tab=teacher-features',
          badge: 'Real-time',
          description: 'Monitor student progress'
        }
      ]
    },
    {
      category: 'Admin Features (3)',
      items: [
        {
          name: 'System Administration',
          icon: <Cpu className="h-4 w-4" />,
          path: '/analytics/student?tab=admin-features',
          badge: 'System',
          description: 'Infrastructure management'
        },
        {
          name: 'All Features Overview',
          icon: <Activity className="h-4 w-4" />,
          path: '/analytics/student?tab=features',
          badge: '18 Total',
          description: 'Complete feature status'
        }
      ]
    },
    {
      category: 'Career Intelligence',
      items: [
        {
          name: 'Job Market Mapping',
          icon: <Briefcase className="h-4 w-4" />,
          path: '/job-market-mapping',
          badge: 'AI-Powered',
          description: 'Career analysis & recommendations'
        },
        {
          name: 'Skills Assessment',
          icon: <Target className="h-4 w-4" />,
          path: '/analytics/student?tab=jobmarket',
          badge: 'New',
          description: 'Market-aligned skill analysis'
        }
      ]
    },
    {
      category: 'Adaptive Learning',
      items: [
        {
          name: 'Personalized Learning Path',
          icon: <Brain className="h-4 w-4" />,
          path: '/analytics/student?tab=cognitive',
          badge: 'ML',
          description: 'AI-optimized learning journey'
        },
        {
          name: 'Microlearning Modules',
          icon: <BookOpen className="h-4 w-4" />,
          path: '/microlearning',
          badge: 'Coming Soon',
          description: 'Bite-sized learning content'
        }
      ]
    },
    {
      category: 'Advanced Features',
      items: [
        {
          name: 'Emotion Detection',
          icon: <Heart className="h-4 w-4" />,
          path: '/emotion-insights',
          badge: 'Beta',
          description: 'Real-time sentiment analysis'
        },
        {
          name: 'Spaced Repetition',
          icon: <Clock className="h-4 w-4" />,
          path: '/spaced-learning',
          badge: 'Active',
          description: 'Optimized review scheduling'
        }
      ]
    }
  ];

  const handleNavigate = (path: string) => {
    if (path.includes('Coming Soon')) {
      alert('This feature is coming soon!');
    } else {
      router.push(path);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <Zap className="h-4 w-4 mr-2" />
          AI Features
          <Badge variant="secondary" className="ml-2 -mr-1">
            18
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-semibold">
          Intelligent Learning Platform
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {features.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            {categoryIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {category.category}
            </DropdownMenuLabel>
            {category.items.map((item, itemIndex) => (
              <DropdownMenuItem
                key={itemIndex}
                onClick={() => handleNavigate(item.path)}
                className="cursor-pointer py-3"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-0.5 text-muted-foreground">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.name}</span>
                      <Badge 
                        variant={item.badge === 'Live' ? 'default' : 
                                item.badge === 'New' ? 'destructive' :
                                item.badge === 'Beta' ? 'secondary' : 'outline'}
                        className="text-xs ml-2"
                      >
                        {item.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/analytics/student?tab=features')}
          className="cursor-pointer"
        >
          <Activity className="h-4 w-4 mr-2" />
          <span className="font-medium">View All Features Status</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}