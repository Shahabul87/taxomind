"use client";

import React, { useState } from 'react';
import { Search, Filter, X, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { ActivityFilterOptions, ActivityStatus, ActivityType } from './types';

interface ActivityFiltersProps {
  initialFilters: ActivityFilterOptions;
  onFilterChange: (filters: ActivityFilterOptions) => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  initialFilters,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<ActivityFilterOptions>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ ...filters, searchTerm });
  };
  
  const handleTypeChange = (type: ActivityType) => {
    const currentTypes = filters.types || [];
    let newTypes: ActivityType[];
    
    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }
    
    setFilters(prev => ({ ...prev, types: newTypes }));
  };
  
  const handleStatusChange = (status: ActivityStatus) => {
    const currentStatuses = filters.status || [];
    let newStatuses: ActivityStatus[];
    
    if (currentStatuses.includes(status)) {
      newStatuses = currentStatuses.filter(s => s !== status);
    } else {
      newStatuses = [...currentStatuses, status];
    }
    
    setFilters(prev => ({ ...prev, status: newStatuses }));
  };
  
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange || { start: new Date(), end: new Date() },
        [name === 'startDate' ? 'start' : 'end']: value ? new Date(value) : undefined
      }
    }));
  };
  
  const resetFilters = () => {
    setFilters({});
    setSearchTerm('');
    onFilterChange({});
  };
  
  const applyFilters = (filtersToApply: ActivityFilterOptions) => {
    onFilterChange(filtersToApply);
  };
  
  const typeOptions: { value: ActivityType; label: string }[] = [
    { value: 'idea', label: 'Ideas' },
    { value: 'mind', label: 'Minds' },
    { value: 'script', label: 'Scripts' },
    { value: 'subscription', label: 'Subscriptions' },
    { value: 'billing', label: 'Billing' },
    { value: 'plan', label: 'Plans' },
  ];
  
  const statusOptions: { value: ActivityStatus; label: string }[] = [
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  
  // Format date for input
  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
      {/* Search bar always visible */}
      <div className="px-4 py-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          
          <button 
            type="button" 
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-3 top-2.5 p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </form>
      </div>
      
      {/* Expandable filters section */}
      {showFilters && (
        <div className="border-t border-slate-700 px-4 py-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Filters</h3>
            <button 
              onClick={resetFilters}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Reset all
            </button>
          </div>
          
          {/* Type filter */}
          <div>
            <h4 className="text-xs font-medium text-slate-300 mb-2">Type</h4>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map(option => {
                const isSelected = (filters.types || []).includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleTypeChange(option.value)}
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      isSelected 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    } transition-colors`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Status filter */}
          <div>
            <h4 className="text-xs font-medium text-slate-300 mb-2">Status</h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(option => {
                const isSelected = (filters.status || []).includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      isSelected 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    } transition-colors`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Date range filter */}
          <div>
            <h4 className="text-xs font-medium text-slate-300 mb-2">Date Range</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.dateRange?.start ? formatDateForInput(filters.dateRange.start) : ''}
                  onChange={handleDateRangeChange}
                  className="w-full pl-3 pr-9 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Calendar className="absolute right-3 top-1.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.dateRange?.end ? formatDateForInput(filters.dateRange.end) : ''}
                  onChange={handleDateRangeChange}
                  className="w-full pl-3 pr-9 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Calendar className="absolute right-3 top-1.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          
          {/* Apply button */}
          <div className="pt-2">
            <button
              onClick={() => applyFilters({ ...filters, searchTerm })}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium hover:from-indigo-700 hover:to-purple-800 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFilters; 