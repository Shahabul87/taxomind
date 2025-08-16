"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import { ActivityItem, ActivityStatus, ActivityType, ActivityPriority } from './types';
import { createActivity, updateActivity } from './api-service';
import { logger } from '@/lib/logger';

interface ActivityFormProps {
  activity?: Partial<ActivityItem>;
  onClose: () => void;
  onSave: (activity: ActivityItem) => void;
  userId: string;
}

const initialActivity: Partial<ActivityItem> = {
  title: '',
  description: '',
  type: 'plan',
  status: 'not-started',
  priority: 'medium',
  progress: 0,
  dueDate: undefined,
};

const ActivityForm: React.FC<ActivityFormProps> = ({
  activity = {},
  onClose,
  onSave,
  userId
}) => {
  const [formData, setFormData] = useState<Partial<ActivityItem>>({
    ...initialActivity,
    ...activity,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditMode = Boolean(activity.id);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (value) {
      setFormData(prev => ({ ...prev, [name]: new Date(value) }));
    } else {
      setFormData(prev => {
        const newData = { ...prev };
        delete newData[name as keyof typeof newData];
        return newData;
      });
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      setIsSubmitting(true);
      
      if (isEditMode && activity.id) {
        // Update existing activity
        const updatedActivity = await updateActivity(activity.id, formData);
        onSave(updatedActivity);
      } else {
        // Create new activity
        const newActivity = await createActivity({
          ...formData,
          userId,
          progress: formData.progress || 0,
        } as Omit<ActivityItem, 'id' | 'createdAt' | 'updatedAt'>);
        
        onSave(newActivity);
      }
      
      onClose();
    } catch (error) {
      logger.error('Error saving activity:', error);
      setErrors({ submit: 'Failed to save activity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for input
  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {isEditMode ? 'Edit Activity' : 'New Activity'}
          </h2>
          <button 
            className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-slate-900 border ${
                errors.title ? 'border-red-500' : 'border-slate-700'
              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Activity title"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Describe the activity"
            />
          </div>
          
          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type || 'plan'}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="idea">Idea</option>
                <option value="mind">Mind</option>
                <option value="script">Script</option>
                <option value="subscription">Subscription</option>
                <option value="billing">Billing</option>
                <option value="plan">Plan</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'not-started'}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {/* Priority and Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority || 'medium'}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="progress" className="block text-sm font-medium text-slate-300 mb-1">
                Progress
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  id="progress"
                  name="progress"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress || 0}
                  onChange={(e) => handleChange({
                    ...e,
                    target: { ...e.target, value: e.target.value, name: e.target.name },
                  })}
                  className="w-full"
                />
                <span className="text-white text-sm min-w-[40px] text-right">
                  {formData.progress || 0}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300 mb-1">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate ? formatDateForInput(formData.dueDate) : ''}
                onChange={handleDateChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Error message */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {errors.submit}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium hover:from-indigo-700 hover:to-purple-800 transition-colors flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{isEditMode ? 'Update' : 'Create'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm; 