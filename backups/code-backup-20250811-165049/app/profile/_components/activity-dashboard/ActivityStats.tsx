import React from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, CalendarClock } from 'lucide-react';
import { ActivityResponse } from './types';

interface ActivityStatsProps {
  stats: {
    total: number;
    completedCount: number;
    overdueCount: number;
    upcomingCount: number;
    inProgressCount: number;
  };
}

const ActivityStats: React.FC<ActivityStatsProps> = ({ stats }) => {
  const { total, completedCount, overdueCount, upcomingCount, inProgressCount } = stats;
  
  // Calculate completion percentage
  const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  
  const statCards = [
    {
      label: 'Total Activities',
      value: total,
      icon: <Activity className="w-6 h-6 text-indigo-400" />,
      color: 'bg-gradient-to-br from-indigo-600/20 to-indigo-800/20',
      border: 'border-indigo-500/30',
      textColor: 'text-indigo-400',
    },
    {
      label: 'Completed',
      value: completedCount,
      percentage: `${completionPercentage}%`,
      icon: <CheckCircle className="w-6 h-6 text-green-400" />,
      color: 'bg-gradient-to-br from-green-600/20 to-green-800/20',
      border: 'border-green-500/30',
      textColor: 'text-green-400',
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      icon: <Clock className="w-6 h-6 text-blue-400" />,
      color: 'bg-gradient-to-br from-blue-600/20 to-blue-800/20',
      border: 'border-blue-500/30',
      textColor: 'text-blue-400',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      icon: <AlertCircle className="w-6 h-6 text-red-400" />,
      color: 'bg-gradient-to-br from-red-600/20 to-red-800/20',
      border: 'border-red-500/30',
      textColor: 'text-red-400',
    },
    {
      label: 'Upcoming',
      value: upcomingCount,
      icon: <CalendarClock className="w-6 h-6 text-amber-400" />,
      color: 'bg-gradient-to-br from-amber-600/20 to-amber-800/20',
      border: 'border-amber-500/30',
      textColor: 'text-amber-400',
    },
  ];
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
      {statCards.map((stat, index) => (
        <div 
          key={index}
          className={`border ${stat.border} ${stat.color} rounded-xl p-3 flex flex-col backdrop-blur-sm`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2 rounded-lg bg-slate-800 ${stat.textColor}`}>
              {stat.icon}
            </div>
            {stat.percentage && (
              <span className={`text-xs font-medium ${stat.textColor}`}>
                {stat.percentage}
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-white">{stat.value}</span>
          <span className="text-xs text-slate-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ActivityStats; 