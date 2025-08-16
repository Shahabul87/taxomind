import Link from "next/link";
import { ChevronRight, Activity, Rocket, Brain, FileText, Lightbulb, CreditCard, BadgeCheck } from "lucide-react";

interface ActivityProps {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  progress: number;
}

interface RecentActivitiesProps {
  activities: ActivityProps[];
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <DashboardSection title="Recent Activities" viewAllLink="/profile?tab=activity">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activities.length > 0 ? (
            activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors">
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:dark:text-gray-100">{activity.title}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:dark:text-gray-300">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 group-hover:dark:text-gray-300">{activity.description}</p>
                    <div className="mt-2 flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(activity.status)}`} 
                          style={{ width: `${activity.progress}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:dark:text-gray-300">{activity.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              No recent activities found
            </div>
          )}
        </div>
      </div>
    </DashboardSection>
  );
}

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  viewAllLink?: string;
}

const DashboardSection = ({ title, children, viewAllLink }: DashboardSectionProps) => {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        {viewAllLink && (
          <Link 
            href={viewAllLink}
            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 inline-flex items-center"
          >
            View all <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
};

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric'
  }).format(date);
};

const getActivityColor = (type: string) => {
  const colors: {[key: string]: string} = {
    'plan': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    'mind': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    'script': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    'idea': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    'billing': 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    'subscription': 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  };
  
  return colors[type] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
};

const getActivityIcon = (type: string) => {
  const icons: {[key: string]: JSX.Element} = {
    'plan': <Rocket className="h-5 w-5" />,
    'mind': <Brain className="h-5 w-5" />,
    'script': <FileText className="h-5 w-5" />,
    'idea': <Lightbulb className="h-5 w-5" />,
    'billing': <CreditCard className="h-5 w-5" />,
    'subscription': <BadgeCheck className="h-5 w-5" />,
  };
  
  return icons[type] || <Activity className="h-5 w-5" />;
};

const getStatusColor = (status: string) => {
  const colors: {[key: string]: string} = {
    'in-progress': 'bg-blue-500',
    'not-started': 'bg-gray-500',
    'completed': 'bg-green-500',
    'overdue': 'bg-red-500',
  };
  
  return colors[status] || 'bg-gray-500';
}; 