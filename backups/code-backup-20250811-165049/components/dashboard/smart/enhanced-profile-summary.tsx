"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  User,
  MapPin,
  Calendar,
  Globe,
  Github,
  Twitter,
  Linkedin,
  ExternalLink,
  Edit,
  Mail,
  Phone,
  Award,
  Star,
  TrendingUp,
  Users,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { User as AuthUser } from "next-auth";

interface EnhancedProfileSummaryProps {
  user: AuthUser;
  userData: any;
  socialAccounts: any[];
  achievements: any[];
}

export default function EnhancedProfileSummary({ 
  user, 
  userData, 
  socialAccounts, 
  achievements 
}: EnhancedProfileSummaryProps) {
  const profileCompleteness = calculateProfileCompleteness(user, userData, socialAccounts);
  
  const socialPlatforms = [
    { 
      name: 'GitHub', 
      icon: Github, 
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      account: socialAccounts?.find(acc => acc.platform === 'GITHUB')
    },
    { 
      name: 'Twitter', 
      icon: Twitter, 
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
      account: socialAccounts?.find(acc => acc.platform === 'TWITTER')
    },
    { 
      name: 'LinkedIn', 
      icon: Linkedin, 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      account: socialAccounts?.find(acc => acc.platform === 'LINKEDIN')
    }
  ];

  const recentAchievements = achievements?.slice(0, 3) || [
    { title: "Course Creator", description: "Created first course", icon: "🎓" },
    { title: "Community Helper", description: "50+ helpful comments", icon: "🤝" },
    { title: "Fast Learner", description: "Completed course in record time", icon: "⚡" }
  ];

  const stats = [
    {
      label: "Courses Created",
      value: userData?.courses?.length || 0,
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      label: "Posts Shared",
      value: userData?.posts?.length || 0,
      icon: Edit,
      color: "text-green-600 dark:text-green-400"
    },
    {
      label: "Community Comments",
      value: userData?.posts?.reduce((total: number, post: any) => total + (post.comments?.length || 0), 0) || 0,
      icon: Star,
      color: "text-yellow-600 dark:text-yellow-400"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Profile Summary</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your learning identity
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-indigo-200 dark:ring-indigo-800">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-semibold">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-5 h-5 border-2 border-white dark:border-gray-800" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {user.name || "Anonymous User"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
            
            {userData?.phone && (
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {userData.phone}
              </p>
            )}
          </div>
          
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>

        {/* Profile Completeness */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Profile Completeness</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {profileCompleteness}%
            </span>
          </div>
          <Progress value={profileCompleteness} className="h-2" />
          {profileCompleteness < 100 && (
            <p className="text-xs text-gray-500">
              Complete your profile to unlock more features
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={`stat-${stat.label}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center space-y-1"
            >
              <div className={`mx-auto w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stat.value}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Social Media Accounts */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            Social Profiles
          </h4>
          <div className="space-y-2">
            {socialPlatforms.map((platform, index) => (
              <div key={`social-${platform.name}-${index}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${platform.color}`}>
                    <platform.icon className="h-3 w-3" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {platform.name}
                  </span>
                </div>
                {platform.account ? (
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                    Not connected
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            Recent Achievements
          </h4>
          <div className="space-y-2">
            {recentAchievements.map((achievement, index) => (
              <motion.div
                key={`achievement-${achievement.title}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <span className="text-lg">{achievement.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Profile Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Link href="/profile">
            <Button variant="outline" size="sm" className="w-full">
              <User className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function calculateProfileCompleteness(user: AuthUser, userData: any, socialAccounts: any[]): number {
  let completeness = 0;
  const totalFields = 8;
  
  if (user.name) completeness++;
  if (user.email) completeness++;
  if (user.image) completeness++;
  if (userData?.phone) completeness++;
  if (userData?.profileLinks?.length > 0) completeness++;
  if (socialAccounts?.length > 0) completeness++;
  if (userData?.posts?.length > 0) completeness++;
  if (userData?.courses?.length > 0) completeness++;
  
  return Math.round((completeness / totalFields) * 100);
} 