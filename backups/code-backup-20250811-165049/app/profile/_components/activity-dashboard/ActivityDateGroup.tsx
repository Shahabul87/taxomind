import React from 'react';
import { DailyActivities } from './types';
import { formatDate } from './utils';
import ActivityItem from './ActivityItem';

interface ActivityDateGroupProps {
  dailyActivities: DailyActivities;
  onEditActivity: (activity: any) => void;
  onDeleteActivity: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const ActivityDateGroup: React.FC<ActivityDateGroupProps> = ({
  dailyActivities,
  onEditActivity,
  onDeleteActivity,
  onStatusChange
}) => {
  const { date, activities, completedCount, totalCount } = dailyActivities;
  const formattedDate = formatDate(date);
  const isToday = formattedDate === 'Today';
  
  return (
    <div className="mb-8">
      {/* Date header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-bold ${isToday ? 'text-purple-400' : 'text-white'}`}>
            {formattedDate}
          </h2>
          <div className="py-1 px-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
            {completedCount}/{totalCount} completed
          </div>
        </div>
        
        {isToday && (
          <div className="py-1 px-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium animate-pulse">
            Active Day
          </div>
        )}
      </div>
      
      {/* Activities for this date */}
      <div className="space-y-4">
        {activities.map(activity => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onEdit={onEditActivity}
            onDelete={onDeleteActivity}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ActivityDateGroup; 