import Link from "next/link";
import { Activity, BookOpen, Lightbulb, BarChart3 } from "lucide-react";

interface OverviewCardsProps {
  userData: any;
}

export default function OverviewCards({ userData }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard 
        title="Activities" 
        value={(userData?.activities?.length || 0).toString()} 
        icon={<Activity className="h-5 w-5 text-purple-500" />}
        change="+5% from last week"
        href="/profile?tab=activity"
      />
      <DashboardCard 
        title="Enrolled Courses" 
        value={(userData?.courses?.length || 0).toString()}
        icon={<BookOpen className="h-5 w-5 text-blue-500" />}
        change="2 new this month"
        href="/dashboard/student"
      />
      <DashboardCard 
        title="Created Ideas" 
        value={(userData?.ideas?.length || 0).toString()}
        icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
        change="+3 new ideas"
        href="/profile?tab=ideas"
      />
      <DashboardCard 
        title="Performance" 
        value="85%"
        icon={<BarChart3 className="h-5 w-5 text-green-500" />}
        change="+12% improvement"
        href="/analytics/student"
      />
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  href: string;
}

const DashboardCard = ({ title, value, icon, change, href }: DashboardCardProps) => {
  return (
    <Link 
      href={href || "#"}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{change}</p>
          )}
        </div>
        <div className="rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
          {icon}
        </div>
      </div>
    </Link>
  );
}; 