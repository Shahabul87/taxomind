import { logger } from '@/lib/logger';

export interface Recommendation {
  id: string;
  type: 'course' | 'content' | 'skill' | 'goal' | 'connection' | 'path';
  title: string;
  description: string;
  reason: string;
  confidence: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  category?: string;
  tags: string[];
  actionUrl: string;
  imageUrl?: string;
  estimatedTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface RecommendationContext {
  learningHistory: any[];
  interests: any[];
  skillLevel: any;
}

export async function getPersonalizedRecommendations(
  userData: any,
  context: RecommendationContext
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  try {
    // Generate course recommendations
    const courseRecs = await generateCourseRecommendations(userData, context);
    recommendations.push(...courseRecs);

    // Generate content recommendations
    const contentRecs = generateContentRecommendations(userData, context);
    recommendations.push(...contentRecs);

    // Generate skill development recommendations
    const skillRecs = generateSkillRecommendations(userData, context);
    recommendations.push(...skillRecs);

    // Generate learning path recommendations
    const pathRecs = generateLearningPathRecommendations(userData, context);
    recommendations.push(...pathRecs);

    // Generate goal recommendations
    const goalRecs = generateGoalRecommendations(userData, context);
    recommendations.push(...goalRecs);

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.confidence - a.confidence;
    });

    return recommendations.slice(0, 15); // Return top 15 recommendations
  } catch (error: any) {
    logger.error("Error generating recommendations:", error);
    return [];
  }
}

async function generateCourseRecommendations(
  userData: any,
  context: RecommendationContext
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Analyze user's learning patterns
  const completedCourses = context.learningHistory.filter(course => 
    calculateCourseCompletionRate(course) > 80
  );

  const preferredCategories = extractPreferredCategories(completedCourses);
  const currentSkillLevel = determineSkillLevel(completedCourses);

  // Recommend next level courses in preferred categories
  if (preferredCategories.length > 0) {
    preferredCategories.forEach(category => {
      recommendations.push({
        id: `course-${category}-${Date.now()}`,
        type: 'course',
        title: `Advanced ${category} Course`,
        description: `Take your ${category} skills to the next level with advanced concepts and real-world projects.`,
        reason: `Based on your success in ${category} courses`,
        confidence: 85,
        priority: 'high',
        category,
        tags: [category, 'advanced', 'skills'],
        actionUrl: `/discover?category=${category}&level=advanced`,
        estimatedTime: '6-8 weeks',
        difficulty: 'advanced',
        createdAt: new Date(),
        metadata: { category, skillLevel: currentSkillLevel }
      });
    });
  }

  // Recommend beginner courses if user is new
  if (completedCourses.length === 0) {
    const popularBeginnerCourses = [
      {
        title: 'Introduction to Web Development',
        category: 'Programming',
        description: 'Start your coding journey with HTML, CSS, and JavaScript fundamentals.'
      },
      {
        title: 'Digital Marketing Basics',
        category: 'Marketing',
        description: 'Learn the essentials of digital marketing and online brand building.'
      },
      {
        title: 'Data Science Foundations',
        category: 'Data Science',
        description: 'Discover the world of data analysis and visualization.'
      }
    ];

    popularBeginnerCourses.forEach(course => {
      recommendations.push({
        id: `beginner-${course.category.toLowerCase()}-${Date.now()}`,
        type: 'course',
        title: course.title,
        description: course.description,
        reason: 'Perfect starting point for new learners',
        confidence: 90,
        priority: 'high',
        category: course.category,
        tags: ['beginner', 'popular', course.category.toLowerCase()],
        actionUrl: `/discover?category=${course.category}&level=beginner`,
        estimatedTime: '4-6 weeks',
        difficulty: 'beginner',
        createdAt: new Date()
      });
    });
  }

  return recommendations;
}

function generateContentRecommendations(
  userData: any,
  context: RecommendationContext
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Analyze favorite content patterns
  const favoriteTypes = analyzeFavoriteContentTypes(context.interests);

  // Recommend similar content
  Object.entries(favoriteTypes).forEach(([type, count]) => {
    if (count > 0) {
      recommendations.push({
        id: `content-${type}-${Date.now()}`,
        type: 'content',
        title: `Discover More ${type}`,
        description: `Explore curated ${type.toLowerCase()} content that matches your interests.`,
        reason: `You've shown interest in ${type.toLowerCase()} content`,
        confidence: 75,
        priority: 'medium',
        tags: [type.toLowerCase(), 'content', 'discovery'],
        actionUrl: `/discover/${type.toLowerCase()}`,
        createdAt: new Date(),
        metadata: { contentType: type, userEngagement: count }
      });
    }
  });

  return recommendations;
}

function generateSkillRecommendations(
  userData: any,
  context: RecommendationContext
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Identify skill gaps based on user's goals and courses
  const currentSkills = extractSkillsFromCourses(context.learningHistory);
  const demandedSkills = getInDemandSkills(); // Would fetch from industry data

  const skillGaps = demandedSkills.filter(skill => 
    !currentSkills.some(current => current.toLowerCase().includes(skill.toLowerCase()))
  );

  skillGaps.slice(0, 3).forEach(skill => {
    recommendations.push({
      id: `skill-${skill.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      type: 'skill',
      title: `Develop ${skill} Skills`,
      description: `${skill} is in high demand. Add this valuable skill to your toolkit.`,
      reason: 'High-demand skill that complements your current abilities',
      confidence: 80,
      priority: 'high',
      tags: [skill.toLowerCase(), 'in-demand', 'career'],
      actionUrl: `/discover?skill=${encodeURIComponent(skill)}`,
      estimatedTime: '2-4 weeks',
      createdAt: new Date(),
      metadata: { skill, demandLevel: 'high' }
    });
  });

  return recommendations;
}

function generateLearningPathRecommendations(
  userData: any,
  context: RecommendationContext
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Suggest structured learning paths based on user interests
  const learningPaths = [
    {
      title: 'Full-Stack Developer Path',
      description: 'Complete journey from frontend to backend development',
      skills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Database Design'],
      estimatedTime: '12-16 weeks'
    },
    {
      title: 'Digital Marketing Specialist Path',
      description: 'Comprehensive digital marketing and growth strategy training',
      skills: ['SEO', 'Social Media Marketing', 'Analytics', 'Content Marketing'],
      estimatedTime: '8-10 weeks'
    },
    {
      title: 'Data Analyst Path',
      description: 'From data basics to advanced analytics and visualization',
      skills: ['Statistics', 'SQL', 'Python', 'Data Visualization', 'Machine Learning'],
      estimatedTime: '10-14 weeks'
    }
  ];

  // Recommend paths based on user's current interests
  const userInterests = extractUserInterests(userData, context);
  
  learningPaths.forEach(path => {
    const relevanceScore = calculatePathRelevance(path, userInterests);
    
    if (relevanceScore > 0.3) {
      recommendations.push({
        id: `path-${path.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        type: 'path',
        title: path.title,
        description: path.description,
        reason: 'Structured path aligned with your interests and career goals',
        confidence: Math.round(relevanceScore * 100),
        priority: relevanceScore > 0.7 ? 'high' : 'medium',
        tags: ['learning-path', 'structured', 'career'],
        actionUrl: `/paths/${path.title.replace(/\s+/g, '-').toLowerCase()}`,
        estimatedTime: path.estimatedTime,
        createdAt: new Date(),
        metadata: { skills: path.skills, relevanceScore }
      });
    }
  });

  return recommendations;
}

function generateGoalRecommendations(
  userData: any,
  context: RecommendationContext
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const currentGoals = userData.goals || [];
  
  // Suggest SMART goals based on user activity
  if (currentGoals.length === 0) {
    const suggestedGoals = [
      {
        title: 'Complete First Course',
        description: 'Finish your first online course within 30 days',
        category: 'learning'
      },
      {
        title: 'Build a Project',
        description: 'Create and showcase a personal project',
        category: 'practical'
      },
      {
        title: 'Join Community Discussions',
        description: 'Engage with 5 community discussions this month',
        category: 'social'
      }
    ];

    suggestedGoals.forEach(goal => {
      recommendations.push({
        id: `goal-${goal.category}-${Date.now()}`,
        type: 'goal',
        title: goal.title,
        description: goal.description,
        reason: 'Setting clear goals increases learning success by 42%',
        confidence: 85,
        priority: 'medium',
        category: goal.category,
        tags: ['goal-setting', goal.category, 'productivity'],
        actionUrl: '/goals/create',
        estimatedTime: '30 days',
        createdAt: new Date(),
        metadata: { goalType: goal.category }
      });
    });
  }

  return recommendations;
}

// Helper functions
function calculateCourseCompletionRate(Course: any): number {
  if (!course.chapters) return 0;
  
  const totalSections = course.chapters.reduce(
    (total: number, chapter: any) => total + (chapter.sections?.length || 0), 0
  );
  const completedSections = course.chapters.reduce(
    (total: number, chapter: any) => total + (chapter.sections?.filter(
      (section: any) => section.userProgress?.some((progress: any) => progress.isCompleted)
    ).length || 0), 0
  );
  
  return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
}

function extractPreferredCategories(courses: any[]): string[] {
  const categoryCount: Record<string, number> = {};
  
  courses.forEach(course => {
    const category = course.category?.name;
    if (category) {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  });
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
}

function determineSkillLevel(courses: any[]): 'beginner' | 'intermediate' | 'advanced' {
  if (courses.length === 0) return 'beginner';
  if (courses.length < 3) return 'beginner';
  if (courses.length < 6) return 'intermediate';
  return 'advanced';
}

function analyzeFavoriteContentTypes(interests: any[]): Record<string, number> {
  const types: Record<string, number> = {
    Videos: 0,
    Articles: 0,
    Blogs: 0,
    Audios: 0
  };
  
  // This would analyze the user's favorite content
  // For now, returning sample data
  return types;
}

function extractSkillsFromCourses(courses: any[]): string[] {
  const skills: string[] = [];
  
  courses.forEach(course => {
    // Extract skills from course titles and descriptions
    const title = course.title || '';
    const description = course.description || '';
    
    // Simple keyword extraction (in practice, this would be more sophisticated)
    const keywords = [...title.split(' '), ...description.split(' ')]
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase());
    
    skills.push(...keywords);
  });
  
  return [...new Set(skills)]; // Remove duplicates
}

function getInDemandSkills(): string[] {
  return [
    'React',
    'Python',
    'Machine Learning',
    'AWS',
    'Data Analysis',
    'Digital Marketing',
    'UI/UX Design',
    'Project Management',
    'SQL',
    'JavaScript'
  ];
}

function extractUserInterests(userData: any, context: RecommendationContext): string[] {
  const interests: string[] = [];
  
  // Extract from course categories
  context.learningHistory.forEach(course => {
    if (course.category?.name) {
      interests.push(course.category.name.toLowerCase());
    }
  });
  
  // Extract from content preferences
  if (userData.favoriteVideos?.length > 0) interests.push('videos');
  if (userData.favoriteArticles?.length > 0) interests.push('articles');
  if (userData.favoriteBlogs?.length > 0) interests.push('blogs');
  
  return [...new Set(interests)];
}

function calculatePathRelevance(path: any, userInterests: string[]): number {
  if (userInterests.length === 0) return 0.5; // Default relevance for new users
  
  const pathKeywords = [
    ...path.title.toLowerCase().split(' '),
    ...path.description.toLowerCase().split(' '),
    ...path.skills.map((skill: string) => skill.toLowerCase())
  ];
  
  const matches = userInterests.filter(interest => 
    pathKeywords.some(keyword => keyword.includes(interest) || interest.includes(keyword))
  );
  
  return matches.length / Math.max(userInterests.length, 1);
} 