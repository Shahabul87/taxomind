import type { ReactNode } from 'react';
import { Calculator, Code2, BarChart3, Atom, Pi, Binary, TrendingUp, FlaskConical } from 'lucide-react';

export type TabKey = 'math' | 'cs' | 'data' | 'science';

export interface CourseItem {
  id: string;
  title: string;
  icon?: ReactNode;
  href?: string;
}

export interface PathsTab {
  key: TabKey;
  label: string;
  heading: string;
  courses: CourseItem[];
  moreCount: number;
  cta: {
    label: string;
    href?: string;
  };
  demo: {
    type: TabKey;
  };
}

export const PATHS_TABS: PathsTab[] = [
  {
    key: 'math',
    label: 'Math',
    heading: 'Math Courses',
    courses: [
      {
        id: 'math-1',
        title: 'Mathematical Thinking',
        icon: <Pi className="h-5 w-5" />,
        href: '/courses/mathematical-thinking',
      },
      {
        id: 'math-2',
        title: 'Algebra Fundamentals',
        icon: <Calculator className="h-5 w-5" />,
        href: '/courses/algebra-fundamentals',
      },
      {
        id: 'math-3',
        title: 'Geometry Essentials',
        icon: <span className="text-lg">📐</span>,
        href: '/courses/geometry-essentials',
      },
      {
        id: 'math-4',
        title: 'Trigonometry Mastery',
        icon: <span className="text-lg">📊</span>,
        href: '/courses/trigonometry-mastery',
      },
      {
        id: 'math-5',
        title: 'Calculus Foundations',
        icon: <span className="text-lg">∫</span>,
        href: '/courses/calculus-foundations',
      },
      {
        id: 'math-6',
        title: 'Linear Algebra',
        icon: <span className="text-lg">🔢</span>,
        href: '/courses/linear-algebra',
      },
    ],
    moreCount: 12,
    cta: {
      label: 'Explore Angles',
      href: '/math/angles',
    },
    demo: {
      type: 'math',
    },
  },
  {
    key: 'cs',
    label: 'CS & Programming',
    heading: 'Computer Science Courses',
    courses: [
      {
        id: 'cs-1',
        title: 'Programming Fundamentals',
        icon: <Code2 className="h-5 w-5" />,
        href: '/courses/programming-fundamentals',
      },
      {
        id: 'cs-2',
        title: 'Algorithms & Data Structures',
        icon: <Binary className="h-5 w-5" />,
        href: '/courses/algorithms-data-structures',
      },
      {
        id: 'cs-3',
        title: 'Web Development',
        icon: <span className="text-lg">🌐</span>,
        href: '/courses/web-development',
      },
      {
        id: 'cs-4',
        title: 'Object-Oriented Programming',
        icon: <span className="text-lg">🏗️</span>,
        href: '/courses/oop',
      },
      {
        id: 'cs-5',
        title: 'Functional Programming',
        icon: <span className="text-lg">λ</span>,
        href: '/courses/functional-programming',
      },
      {
        id: 'cs-6',
        title: 'Software Architecture',
        icon: <span className="text-lg">🏛️</span>,
        href: '/courses/software-architecture',
      },
      {
        id: 'cs-7',
        title: 'Database Design',
        icon: <span className="text-lg">💾</span>,
        href: '/courses/database-design',
      },
    ],
    moreCount: 15,
    cta: {
      label: 'Graphics with Code',
      href: '/cs/graphics',
    },
    demo: {
      type: 'cs',
    },
  },
  {
    key: 'data',
    label: 'Data Analysis',
    heading: 'Data & Analytics Courses',
    courses: [
      {
        id: 'data-1',
        title: 'Data Analysis Foundations',
        icon: <BarChart3 className="h-5 w-5" />,
        href: '/courses/data-analysis-foundations',
      },
      {
        id: 'data-2',
        title: 'Statistics & Probability',
        icon: <TrendingUp className="h-5 w-5" />,
        href: '/courses/statistics-probability',
      },
      {
        id: 'data-3',
        title: 'Data Visualization',
        icon: <span className="text-lg">📈</span>,
        href: '/courses/data-visualization',
      },
      {
        id: 'data-4',
        title: 'Machine Learning Basics',
        icon: <span className="text-lg">🤖</span>,
        href: '/courses/machine-learning-basics',
      },
      {
        id: 'data-5',
        title: 'Python for Data Science',
        icon: <span className="text-lg">🐍</span>,
        href: '/courses/python-data-science',
      },
      {
        id: 'data-6',
        title: 'SQL for Analytics',
        icon: <span className="text-lg">🗄️</span>,
        href: '/courses/sql-analytics',
      },
    ],
    moreCount: 18,
    cta: {
      label: 'Interactive Charts',
      href: '/data/charts',
    },
    demo: {
      type: 'data',
    },
  },
  {
    key: 'science',
    label: 'Science',
    heading: 'Science & Engineering Courses',
    courses: [
      {
        id: 'science-1',
        title: 'Physics Fundamentals',
        icon: <Atom className="h-5 w-5" />,
        href: '/courses/physics-fundamentals',
      },
      {
        id: 'science-2',
        title: 'Chemistry Essentials',
        icon: <FlaskConical className="h-5 w-5" />,
        href: '/courses/chemistry-essentials',
      },
      {
        id: 'science-3',
        title: 'Biology Basics',
        icon: <span className="text-lg">🧬</span>,
        href: '/courses/biology-basics',
      },
      {
        id: 'science-4',
        title: 'Engineering Principles',
        icon: <span className="text-lg">⚙️</span>,
        href: '/courses/engineering-principles',
      },
      {
        id: 'science-5',
        title: 'Astronomy & Space',
        icon: <span className="text-lg">🌌</span>,
        href: '/courses/astronomy-space',
      },
      {
        id: 'science-6',
        title: 'Environmental Science',
        icon: <span className="text-lg">🌍</span>,
        href: '/courses/environmental-science',
      },
      {
        id: 'science-7',
        title: 'Materials Science',
        icon: <span className="text-lg">🔬</span>,
        href: '/courses/materials-science',
      },
    ],
    moreCount: 14,
    cta: {
      label: 'Explore Geometry',
      href: '/science/geometry',
    },
    demo: {
      type: 'science',
    },
  },
];
