import { Eye, Download, FileText, Calendar } from "lucide-react";
import { TimeAgo } from "@/app/components/ui/time-ago";

type ActivityType = "view" | "download" | "submission" | "event";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities?: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  // Sample data if no activities are provided
  const defaultActivities: Activity[] = [
    {
      id: "1",
      type: "view",
      title: "Advanced Machine Learning Course",
      description: "Watched Lecture 3: Neural Networks",
      timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    },
    {
      id: "2",
      type: "download",
      title: "Python for Data Science Cheatsheet",
      timestamp: new Date(Date.now() - 3600000 * 24), // 1 day ago
    },
    {
      id: "3",
      type: "submission",
      title: "Web Development Project",
      description: "Submitted final project",
      timestamp: new Date(Date.now() - 3600000 * 48), // 2 days ago
    },
    {
      id: "4",
      type: "event",
      title: "AI Workshop",
      description: "Registered for upcoming workshop",
      timestamp: new Date(Date.now() - 3600000 * 72), // 3 days ago
    },
  ];

  const displayActivities = activities || defaultActivities;

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "view":
        return <Eye className="h-5 w-5 text-blue-500" />;
      case "download":
        return <Download className="h-5 w-5 text-green-500" />;
      case "submission":
        return <FileText className="h-5 w-5 text-purple-500" />;
      case "event":
        return <Calendar className="h-5 w-5 text-orange-500" />;
      default:
        return <Eye className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayActivities.length > 0 ? (
          displayActivities.map((activity) => (
            <div key={activity.id} className="px-4 py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {activity.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <TimeAgo date={activity.timestamp} />
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
} 