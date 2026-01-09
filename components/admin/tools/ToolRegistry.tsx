'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Filter,
  Grid3X3,
  List,
  Zap,
  Shield,
  AlertTriangle,
  Settings,
  ChevronRight,
  Package,
  Clock,
  Tag,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tool } from '@/app/dashboard/admin/tools/_components/ToolsClient';

interface ToolRegistryProps {
  tools: Tool[];
  isLoading: boolean;
  onSelectTool: (tool: Tool) => void;
  onRefresh: () => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  content: Package,
  assessment: Shield,
  memory: Zap,
  communication: Settings,
  analysis: Settings,
  course: Package,
  external: Package,
  admin: Shield,
  default: Package,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  content: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  assessment: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  memory: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  communication: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  analysis: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  course: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  external: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  admin: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  default: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

export function ToolRegistry({ tools, isLoading, onSelectTool, onRefresh }: ToolRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => {
    const cats = new Set(tools.map((t) => t.category));
    return ['all', ...Array.from(cats)];
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && tool.enabled && !tool.deprecated) ||
        (statusFilter === 'disabled' && !tool.enabled) ||
        (statusFilter === 'deprecated' && tool.deprecated);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tools, searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tools by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-slate-700">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-slate-700 focus:bg-slate-100">
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200 text-slate-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all" className="text-slate-700 focus:bg-slate-100">All Status</SelectItem>
            <SelectItem value="active" className="text-slate-700 focus:bg-slate-100">Active</SelectItem>
            <SelectItem value="disabled" className="text-slate-700 focus:bg-slate-100">Disabled</SelectItem>
            <SelectItem value="deprecated" className="text-slate-700 focus:bg-slate-100">Deprecated</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={cn(
              'px-2 h-8',
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(
              'px-2 h-8',
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600"
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="text-blue-600 font-mono">{filteredTools.length}</span> of{' '}
          <span className="font-mono">{tools.length}</span> tools
        </p>
      </div>

      {/* Tools Grid/List */}
      {isLoading ? (
        <ToolRegistrySkeleton viewMode={viewMode} />
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredTools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={index}
                  onSelect={() => onSelectTool(tool)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {filteredTools.map((tool, index) => (
                <ToolListItem
                  key={tool.id}
                  tool={tool}
                  index={index}
                  onSelect={() => onSelectTool(tool)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Empty State */}
      {!isLoading && filteredTools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-slate-100 mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700">No tools found</h3>
          <p className="text-sm text-slate-500 mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool, index, onSelect }: { tool: Tool; index: number; onSelect: () => void }) {
  const Icon = categoryIcons[tool.category] || categoryIcons.default;
  const colors = categoryColors[tool.category] || categoryColors.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        'group relative overflow-hidden rounded-xl cursor-pointer',
        'bg-white border border-slate-200',
        'hover:border-blue-300 hover:shadow-md',
        'transition-all duration-300 shadow-sm'
      )}
    >
      {/* Status Indicator */}
      <div className="absolute top-0 left-0 right-0 h-1">
        {tool.deprecated ? (
          <div className="w-full h-full bg-amber-500" />
        ) : tool.enabled ? (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-emerald-500" />
        ) : (
          <div className="w-full h-full bg-slate-300" />
        )}
      </div>

      <div className="p-5 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2.5 rounded-lg', colors.bg, colors.border, 'border')}>
            <Icon className={cn('w-5 h-5', colors.text)} />
          </div>
          <div className="flex items-center gap-2">
            {tool.deprecated && (
              <Badge variant="outline" className="border-amber-300 text-amber-600 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Deprecated
              </Badge>
            )}
            {!tool.enabled && !tool.deprecated && (
              <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs">
                Disabled
              </Badge>
            )}
            <Badge variant="outline" className="border-slate-200 text-slate-500 text-xs font-mono">
              v{tool.version}
            </Badge>
          </div>
        </div>

        {/* Name & Description */}
        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
          {tool.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{tool.description}</p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Tag className="w-3.5 h-3.5" />
            <span>{tool.category}</span>
          </div>
          {tool.timeoutMs && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{tool.timeoutMs}ms</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {tool.confirmationType === 'none' ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Auto</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>{tool.confirmationType}</span>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tool.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-md bg-slate-100 text-slate-500 border border-slate-200"
              >
                {tag}
              </span>
            ))}
            {tool.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-md bg-slate-100 text-slate-500">
                +{tool.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Hover Arrow */}
        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </motion.div>
  );
}

function ToolListItem({ tool, index, onSelect }: { tool: Tool; index: number; onSelect: () => void }) {
  const Icon = categoryIcons[tool.category] || categoryIcons.default;
  const colors = categoryColors[tool.category] || categoryColors.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl cursor-pointer',
        'bg-white border border-slate-200',
        'hover:border-blue-300 hover:shadow-md',
        'transition-all duration-300 shadow-sm'
      )}
    >
      {/* Status Line */}
      <div className="w-1 h-12 rounded-full overflow-hidden">
        {tool.deprecated ? (
          <div className="w-full h-full bg-amber-500" />
        ) : tool.enabled ? (
          <div className="w-full h-full bg-gradient-to-b from-blue-500 to-emerald-500" />
        ) : (
          <div className="w-full h-full bg-slate-300" />
        )}
      </div>

      {/* Icon */}
      <div className={cn('p-2.5 rounded-lg', colors.bg, colors.border, 'border')}>
        <Icon className={cn('w-5 h-5', colors.text)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
            {tool.name}
          </h3>
          <Badge variant="outline" className="border-slate-200 text-slate-500 text-xs font-mono shrink-0">
            v{tool.version}
          </Badge>
          {tool.deprecated && (
            <Badge variant="outline" className="border-amber-300 text-amber-600 text-xs shrink-0">
              Deprecated
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate">{tool.description}</p>
      </div>

      {/* Meta */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
        <span className="px-2 py-1 rounded bg-slate-100">{tool.category}</span>
        {tool.timeoutMs && <span>{tool.timeoutMs}ms</span>}
        <span className="flex items-center gap-1">
          {tool.confirmationType === 'none' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {tool.confirmationType}
        </span>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
    </motion.div>
  );
}

function ToolRegistrySkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  const items = Array.from({ length: 6 });

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((_, i) => (
          <div
            key={`grid-skeleton-${i}`}
            className="rounded-xl bg-white border border-slate-200 p-5 pt-6 animate-pulse shadow-sm"
          >
            <div className="h-1 bg-slate-200 rounded mb-4" />
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg" />
              <div className="w-16 h-5 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-slate-100 rounded mb-2" />
            <div className="h-4 w-full bg-slate-50 rounded mb-1" />
            <div className="h-4 w-2/3 bg-slate-50 rounded" />
            <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="h-4 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((_, i) => (
        <div
          key={`list-skeleton-${i}`}
          className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 animate-pulse shadow-sm"
        >
          <div className="w-1 h-12 bg-slate-200 rounded-full" />
          <div className="w-10 h-10 bg-slate-100 rounded-lg" />
          <div className="flex-1">
            <div className="h-5 w-1/3 bg-slate-100 rounded mb-2" />
            <div className="h-4 w-2/3 bg-slate-50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
