'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { 
  User, 
  BookOpen, 
  Award, 
  Calendar, 
  Settings, 
  Activity,
  TrendingUp,
  Clock,
  Target,
  Trophy,
  Star,
  ChevronRight,
  Edit2,
  Camera,
  Mail,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Github,
  Globe,
  BarChart3,
  Users,
  FileText,
  Video,
  MessageSquare,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  role: string;
  createdAt: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  totalLearningHours: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  recentActivity: Activity[];
  skills: Skill[];
  courses: EnrolledCourse[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Activity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  progress?: number;
}

interface Skill {
  name: string;
  level: number;
  progress: number;
}

interface EnrolledCourse {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  thumbnail: string;
  lastAccessed: string;
  totalChapters: number;
  completedChapters: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }
  }, [status]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      // Mock data for demonstration
      setProfile({
        id: session.user.id,
        name: session.user.name || 'User',
        email: session.user.email || '',
        image: session.user.image || '',
        bio: 'Passionate learner and technology enthusiast. Always eager to explore new concepts and share knowledge with the community.',
        location: 'San Francisco, CA',
        website: 'https://myportfolio.com',
        twitter: '@myhandle',
        linkedin: 'in/myprofile',
        github: 'mygithub',
        role: session.user.role || 'USER',
        createdAt: '2024-01-15',
        coursesEnrolled: 12,
        coursesCompleted: 8,
        certificatesEarned: 6,
        totalLearningHours: 156,
        currentStreak: 7,
        longestStreak: 21,
        achievements: [
          {
            id: '1',
            title: 'Fast Learner',
            description: 'Complete 5 courses in 30 days',
            icon: '🚀',
            earnedAt: '2024-10-01',
            rarity: 'rare'
          },
          {
            id: '2',
            title: 'Knowledge Seeker',
            description: 'Complete 10 courses',
            icon: '📚',
            earnedAt: '2024-09-15',
            rarity: 'epic'
          },
          {
            id: '3',
            title: 'Consistent Learner',
            description: 'Maintain a 21-day learning streak',
            icon: '🔥',
            earnedAt: '2024-08-20',
            rarity: 'legendary'
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'course_progress',
            title: 'Continued "Advanced React Patterns"',
            timestamp: '2 hours ago',
            progress: 75
          },
          {
            id: '2',
            type: 'course_completed',
            title: 'Completed "TypeScript Fundamentals"',
            timestamp: '1 day ago'
          },
          {
            id: '3',
            type: 'certificate_earned',
            title: 'Earned certificate for "Node.js Masterclass"',
            timestamp: '3 days ago'
          }
        ],
        skills: [
          { name: 'React', level: 85, progress: 85 },
          { name: 'TypeScript', level: 75, progress: 75 },
          { name: 'Node.js', level: 70, progress: 70 },
          { name: 'Python', level: 60, progress: 60 },
          { name: 'AWS', level: 50, progress: 50 }
        ],
        courses: [
          {
            id: '1',
            title: 'Advanced React Patterns',
            instructor: 'John Doe',
            progress: 75,
            thumbnail: '/api/placeholder/400/225',
            lastAccessed: '2 hours ago',
            totalChapters: 12,
            completedChapters: 9
          },
          {
            id: '2',
            title: 'Node.js Microservices',
            instructor: 'Jane Smith',
            progress: 45,
            thumbnail: '/api/placeholder/400/225',
            lastAccessed: '1 day ago',
            totalChapters: 15,
            completedChapters: 7
          },
          {
            id: '3',
            title: 'Machine Learning Basics',
            instructor: 'Dr. Alan Turing',
            progress: 30,
            thumbnail: '/api/placeholder/400/225',
            lastAccessed: '3 days ago',
            totalChapters: 20,
            completedChapters: 6
          }
        ]
      });
      setIsLoading(false);
    }
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No profile data available</p>
      </div>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20" />
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-background rounded-xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Picture */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.image} alt={profile.name} />
                <AvatarFallback className="text-3xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => toast.info('Profile picture upload coming soon!')}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground mt-1">{profile.email}</p>
                  <p className="mt-3 max-w-2xl">{profile.bio}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a href={profile.website} className="hover:text-primary">
                          Portfolio
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-2 mt-4">
                    {profile.twitter && (
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Twitter className="h-4 w-4" />
                      </Button>
                    )}
                    {profile.linkedin && (
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    )}
                    {profile.github && (
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Github className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-8 pt-8 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.coursesEnrolled}</div>
              <div className="text-sm text-muted-foreground">Courses Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.coursesCompleted}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.certificatesEarned}</div>
              <div className="text-sm text-muted-foreground">Certificates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.totalLearningHours}h</div>
              <div className="text-sm text-muted-foreground">Learning Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {profile.currentStreak}
                <span className="text-orange-500">🔥</span>
              </div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Continue Learning */}
              <Card>
                <CardHeader>
                  <CardTitle>Continue Learning</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.courses.slice(0, 2).map((course) => (
                    <div key={course.id} className="flex gap-4">
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-muted">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{course.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {course.completedChapters}/{course.totalChapters} chapters
                        </p>
                        <Progress value={course.progress} className="h-2 mt-2" />
                      </div>
                      <Button size="sm" variant="ghost">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Achievements</CardTitle>
                  <CardDescription>Your latest accomplishments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-4">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Learning Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Learning Analytics</CardTitle>
                  <CardDescription>Your progress this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Weekly Goal</span>
                        <span className="font-semibold">15/20 hours</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Monthly Progress</span>
                        <span className="font-semibold">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">92%</div>
                          <div className="text-xs text-muted-foreground">Completion Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">4.8</div>
                          <div className="text-xs text-muted-foreground">Avg. Rating Given</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Skills</CardTitle>
                  <CardDescription>Your skill progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.skills.slice(0, 5).map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{skill.name}</span>
                          <span className="font-semibold">{skill.level}%</span>
                        </div>
                        <Progress value={skill.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">My Courses</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">All</Button>
                <Button variant="outline" size="sm">In Progress</Button>
                <Button variant="outline" size="sm">Completed</Button>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profile.courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge variant="secondary" className="mb-2">
                        {course.progress}% Complete
                      </Badge>
                      <h3 className="font-bold text-lg text-white">{course.title}</h3>
                      <p className="text-sm text-white/80">by {course.instructor}</p>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{course.completedChapters}/{course.totalChapters} chapters</span>
                        <span>{course.lastAccessed}</span>
                      </div>
                      <Button className="w-full">Continue Learning</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profile.achievements.map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="text-5xl">{achievement.icon}</div>
                      <div>
                        <h3 className="font-bold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                      </div>
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Skill Development</CardTitle>
                <CardDescription>Track your expertise across different technologies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {profile.skills.map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{skill.name}</span>
                        <Badge variant={skill.level >= 70 ? 'default' : 'secondary'}>
                          Level {Math.floor(skill.level / 20) + 1}
                        </Badge>
                      </div>
                      <Progress value={skill.progress} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {100 - skill.progress}% to next level
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === 'course_progress' && <BookOpen className="h-5 w-5 text-primary" />}
                        {activity.type === 'course_completed' && <Trophy className="h-5 w-5 text-primary" />}
                        {activity.type === 'certificate_earned' && <Award className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                        {activity.progress && (
                          <Progress value={activity.progress} className="h-2 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}