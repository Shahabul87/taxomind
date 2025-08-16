"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { ActivityItem, ActivityFilterOptions, DailyActivities } from './types';
import { fetchActivities } from './api-service';
import { groupActivitiesByDate, isActivityOverdue } from './utils';
import ActivityDateGroup from './ActivityDateGroup';
import ActivityFilters from './ActivityFilters';
import ActivityStats from './ActivityStats';
import ActivityForm from './ActivityForm';
import { logger } from '@/lib/logger';

interface ActivityDashboardProps {
  userId: string;
  initialActivities?: ActivityItem[];
}

const ActivityDashboard: React.FC<ActivityDashboardProps> = ({
  userId,
  initialActivities = []
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [groupedActivities, setGroupedActivities] = useState<DailyActivities[]>([]);
  const [filters, setFilters] = useState<ActivityFilterOptions>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completedCount: 0,
    overdueCount: 0,
    upcomingCount: 0,
    inProgressCount: 0,
  });
  
  // Load activities
  const loadActivities = useCallback(async (filterOptions?: ActivityFilterOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchActivities(userId, filterOptions);
      
      // Update activities and calculate stats
      const updatedActivities = response.activities.map(activity => {
        // Check for overdue activities
        if (isActivityOverdue(activity) && activity.status !== 'overdue') {
          return { ...activity, status: 'overdue' };
        }
        return activity;
      });
      
      setActivities(updatedActivities);
      
      // Calculate stats
      const inProgressCount = updatedActivities.filter(a => a.status === 'in-progress').length;
      const notStartedCount = updatedActivities.filter(a => a.status === 'not-started').length;
      
      setStats({
        total: updatedActivities.length,
        completedCount: updatedActivities.filter(a => a.status === 'completed').length,
        overdueCount: updatedActivities.filter(a => a.status === 'overdue').length,
        upcomingCount: notStartedCount,
        inProgressCount,
      });
      
    } catch (err) {
      setError('Failed to load activities. Please try again.');
      logger.error('Error loading activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  // Group activities by date whenever activities change
  useEffect(() => {
    const grouped = groupActivitiesByDate(activities);
    setGroupedActivities(grouped);
  }, [activities]);
  
  // Initial load
  useEffect(() => {
    loadActivities(filters);
  }, [userId, loadActivities, filters]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: ActivityFilterOptions) => {
    setFilters(newFilters);
    loadActivities(newFilters);
  };
  
  // Handle activity save (create/update)
  const handleActivitySave = (activity: ActivityItem) => {
    setActivities(prev => {
      // Check if it's an update
      const existingIndex = prev.findIndex(a => a.id === activity.id);
      
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = activity;
        return updated;
      } else {
        // Add new
        return [...prev, activity];
      }
    });
    
    setEditingActivity(null);
    setShowCreateForm(false);
  };
  
  // Handle activity delete
  const handleActivityDelete = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };
  
  // Handle activity status change
  const handleStatusChange = (id: string, status: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === id 
          ? { 
              ...activity, 
              status: status as any,
              ...(status === 'completed' ? { completedDate: new Date(), progress: 100 } : {})
            } 
          : activity
      )
    );
  };
  
  // Handle activity edit
  const handleEditActivity = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setShowCreateForm(true);
  };
  
  // Scroll to today
  const scrollToToday = () => {
    const todaySection = document.getElementById('today-section');
    if (todaySection) {
      todaySection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Scroll to past
  const scrollToPast = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollTo({
        top: timelineRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };
  
  // Scroll to future
  const scrollToFuture = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="relative">
      {/* Header with current date */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-900 via-slate-900/95 to-transparent pb-6 pt-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              <span>Activity Dashboard</span>
            </h1>
            <p className="text-slate-400 text-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium hover:from-indigo-700 hover:to-purple-800 transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Activity</span>
          </button>
        </div>
        
        {/* Stats Section */}
        <ActivityStats stats={stats} />
        
        {/* Filters */}
        <ActivityFilters 
          initialFilters={filters}
          onFilterChange={handleFilterChange}
        />
        
        {/* Timeline navigation controls */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={scrollToPast}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-sm"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Past</span>
          </button>
          
          <button
            onClick={scrollToToday}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm"
          >
            Today
          </button>
          
          <button
            onClick={scrollToFuture}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-sm"
          >
            <span>Future</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-purple-600 rounded-full mb-2"></div>
            <div className="h-4 w-24 bg-slate-700 rounded-md"></div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
          <p>{error}</p>
          <button 
            onClick={() => loadActivities(filters)}
            className="text-sm underline mt-2"
          >
            Try again
          </button>
        </div>
      )}
      
      {/* No activities state */}
      {!isLoading && !error && activities.length === 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
          <Calendar className="mx-auto w-12 h-12 text-slate-500 mb-3" />
          <h3 className="text-xl font-medium text-white mb-2">No Activities Found</h3>
          <p className="text-slate-400 mb-4">You don&apos;t have any activities yet or none match your current filters.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium hover:from-indigo-700 hover:to-purple-800 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Activity</span>
          </button>
        </div>
      )}
      
      {/* Timeline of activities */}
      {!isLoading && !error && activities.length > 0 && (
        <div 
          ref={timelineRef}
          className="pb-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"
        >
          {groupedActivities.map((dailyActivities, index) => {
            const formattedDate = new Date(dailyActivities.date).toDateString();
            const isToday = new Date().toDateString() === formattedDate;
            
            return (
              <div 
                key={formattedDate} 
                id={isToday ? 'today-section' : undefined}
              >
                <ActivityDateGroup
                  dailyActivities={dailyActivities}
                  onEditActivity={handleEditActivity}
                  onDeleteActivity={handleActivityDelete}
                  onStatusChange={handleStatusChange}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <ActivityForm
          activity={editingActivity || undefined}
          onClose={() => {
            setShowCreateForm(false);
            setEditingActivity(null);
          }}
          onSave={handleActivitySave}
          userId={userId}
        />
      )}
      
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
};

export default ActivityDashboard; 