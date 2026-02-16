/**
 * Shared course category definitions.
 *
 * Extracted from the app-layer types to allow lib/ modules (orchestrator,
 * category-prompts, etc.) to import without violating the dependency rule.
 */

export interface CourseCategory {
  readonly value: string;
  readonly label: string;
  readonly subcategories: readonly string[];
}

export const COURSE_CATEGORIES: readonly CourseCategory[] = [
  {
    value: 'artificial-intelligence',
    label: 'Artificial Intelligence',
    subcategories: [
      'Machine Learning', 'Deep Learning', 'Generative AI', 'Natural Language Processing',
      'Computer Vision', 'Reinforcement Learning', 'Neural Networks', 'Transformers & LLMs',
      'AI Ethics & Safety', 'Prompt Engineering', 'AI Agents & Automation',
      'Diffusion Models', 'GANs', 'MLOps & Model Deployment', 'Federated Learning',
      'Knowledge Graphs', 'Recommendation Systems', 'Speech Recognition',
      'Image Processing', 'Signal Processing', 'Edge AI & TinyML',
      'AI for Healthcare', 'AI for Finance', 'Conversational AI'
    ]
  },
  {
    value: 'technology',
    label: 'Technology',
    subcategories: ['Web Development', 'Mobile Development', 'Data Science', 'DevOps', 'Cybersecurity', 'Cloud Computing', 'Blockchain', 'IoT']
  },
  {
    value: 'business',
    label: 'Business',
    subcategories: ['Marketing', 'Sales', 'Management', 'Entrepreneurship', 'Finance', 'Project Management', 'Business Strategy', 'E-Commerce']
  },
  {
    value: 'design',
    label: 'Design',
    subcategories: ['UI/UX Design', 'Graphic Design', 'Product Design', 'Web Design', 'Brand Design', 'Motion Graphics', '3D Design', 'Interior Design']
  },
  {
    value: 'health',
    label: 'Health & Wellness',
    subcategories: ['Fitness', 'Nutrition', 'Mental Health', 'Yoga', 'Meditation', 'Healthcare', 'Sports Science', 'First Aid']
  },
  {
    value: 'education',
    label: 'Education',
    subcategories: ['Teaching Methods', 'Curriculum Design', 'Educational Technology', 'Assessment', 'Learning Sciences', 'Special Education']
  },
  {
    value: 'science',
    label: 'Science & Engineering',
    subcategories: ['Physics', 'Chemistry', 'Biology', 'Environmental Science', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Robotics']
  },
  {
    value: 'mathematics',
    label: 'Mathematics',
    subcategories: ['Algebra', 'Calculus', 'Statistics', 'Probability', 'Linear Algebra', 'Discrete Mathematics', 'Number Theory']
  },
  {
    value: 'language',
    label: 'Language & Communication',
    subcategories: ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Public Speaking', 'Writing Skills']
  },
  {
    value: 'arts',
    label: 'Arts & Humanities',
    subcategories: ['History', 'Philosophy', 'Literature', 'Music Theory', 'Fine Arts', 'Photography', 'Film Studies', 'Creative Writing']
  },
  {
    value: 'personal-development',
    label: 'Personal Development',
    subcategories: ['Leadership', 'Productivity', 'Time Management', 'Communication Skills', 'Emotional Intelligence', 'Career Growth', 'Mindfulness']
  },
  {
    value: 'finance',
    label: 'Finance & Accounting',
    subcategories: ['Accounting', 'Investing', 'Financial Planning', 'Cryptocurrency', 'Taxation', 'Corporate Finance', 'Risk Management']
  },
  {
    value: 'data-analytics',
    label: 'Data & Analytics',
    subcategories: ['Data Analysis', 'Business Intelligence', 'Data Visualization', 'Big Data', 'SQL', 'Python for Data', 'Machine Learning', 'Statistical Modeling']
  },
  {
    value: 'music',
    label: 'Music',
    subcategories: ['Music Production', 'Guitar', 'Piano', 'Singing', 'Music Theory', 'DJing', 'Sound Design', 'Songwriting']
  },
  {
    value: 'lifestyle',
    label: 'Lifestyle',
    subcategories: ['Cooking', 'Travel', 'Gardening', 'Pet Care', 'Home Improvement', 'Fashion', 'Parenting']
  }
] as const;
