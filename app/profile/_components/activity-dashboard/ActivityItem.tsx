"use client";

import React, { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, Check, X, MoreVertical } from 'lucide-react';
import { logger } from '@/lib/logger';
import { 
  Lightbulb, 
  Brain, 
  FilePen, 
  BadgeCheck, 
  DollarSign, 
  Activity,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ActivityItem as ActivityItemType } from './types';
import { formatDate, formatTime, getStatusColors, getPriorityColors } from './utils';
import { deleteActivity, updateActivityStatus, completeActivity } from './api-service';

interface ActivityItemProps {
  activity: ActivityItemType;
  onEdit: (activity: ActivityItemType) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  activity, 
  onEdit, 
  onDelete, 
  onStatusChange 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteActivity(activity.id);
      onDelete(activity.id);
    } catch (error: any) {
      logger.error('Failed to delete activity:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComplete = async () => {
    if (activity.status === 'completed') return;
    
    try {
      setIsCompleting(true);
      const updated = await completeActivity(activity.id);
      onStatusChange(activity.id, 'completed');
    } catch (error: any) {
      logger.error('Failed to complete activity:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const statusColors = getStatusColors(activity.status);
  const priorityColors = getPriorityColors(activity.priority);
  const typeIcons = {
    idea: <Lightbulb className="w-4 h-4" />,
    mind: <Brain className="w-4 h-4" />,
    script: <FilePen className="w-4 h-4" />,
    subscription: <BadgeCheck className="w-4 h-4" />,
    billing: <DollarSign className="w-4 h-4" />,
    plan: <Calendar className="w-4 h-4" />,
    default: <Activity className="w-4 h-4" />
  };

  return (
    <div 
      className={`relative border ${statusColors.border} rounded-xl p-4 transition-all hover:shadow-md ${statusColors.bg} group backdrop-blur-sm`}
    >
      {/* Priority badge */}
      <div className={`absolute -top-2 -left-2 ${priorityColors.bg} ${priorityColors.text} text-xs px-2 py-0.5 rounded-full font-medium z-10`}>
        {activity.priority.charAt(0).toUpperCase() + activity.priority.slice(1)}
      </div>
      
      {/* Actions buttons (visible on hover) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button 
              className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="bg-slate-800 backdrop-blur-sm border border-slate-700 rounded-lg p-1.5 shadow-xl min-w-[140px] z-50"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item 
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-slate-700 cursor-pointer text-slate-300 hover:text-white transition-colors"
                onClick={() => onEdit(activity)}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </DropdownMenu.Item>
              
              {activity.status !== 'completed' && (
                <DropdownMenu.Item 
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-green-700/30 cursor-pointer text-slate-300 hover:text-white transition-colors"
                  onClick={handleComplete}
                  disabled={isCompleting}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </DropdownMenu.Item>
              )}
              
              <DropdownMenu.Separator className="h-px bg-slate-700 my-1" />
              
              <DropdownMenu.Item 
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-red-700/30 cursor-pointer text-slate-300 hover:text-red-300 transition-colors"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      
      {/* Activity content */}
      <div className="flex items-start gap-3">
        {/* Left icon */}
        <div className={`mt-1 flex-shrink-0 w-9 h-9 rounded-full ${statusColors.bg} ${statusColors.text} flex items-center justify-center border ${statusColors.border}`}>
          {typeIcons[activity.type] || typeIcons.default}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${activity.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'}`}>
            {activity.title}
          </h3>
          
          {activity.description && (
            <p className={`text-sm mt-0.5 ${activity.status === 'completed' ? 'text-slate-500' : 'text-slate-300'}`}>
              {activity.description}
            </p>
          )}
          
          {/* Progress bar */}
          {activity.status !== 'completed' && (
            <div className="w-full h-1.5 bg-slate-700/50 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full ${activity.status === 'in-progress' ? 'bg-blue-500' : activity.status === 'overdue' ? 'bg-red-500' : 'bg-slate-500'} rounded-full`}
                style={{ width: `${activity.progress}%` }}
              ></div>
            </div>
          )}
          
          {/* Date & time info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
            {activity.dueDate && (
              <div className={`flex items-center gap-1.5 text-xs ${activity.status === 'overdue' ? 'text-red-400' : 'text-slate-400'}`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Due: {formatDate(activity.dueDate)} • {formatTime(activity.dueDate)}</span>
              </div>
            )}
            
            {activity.completedDate && (
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <Check className="w-3.5 h-3.5" />
                <span>Completed: {formatDate(activity.completedDate)} • {formatTime(activity.completedDate)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Created: {formatDate(activity.createdAt)} • {formatTime(activity.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem; 