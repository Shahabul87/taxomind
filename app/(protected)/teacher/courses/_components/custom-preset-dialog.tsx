"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Save,
  Trash2,
  Star,
  TrendingUp,
  DollarSign,
  Target,
  AlertCircle,
  BookOpen,
  Zap,
  Award,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FilterPreset, CourseFilters } from "@/types/course";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CustomPresetDialogProps {
  onPresetCreated: (preset: FilterPreset) => void;
  existingPresets: FilterPreset[];
}

const iconOptions: { name: string; icon: LucideIcon }[] = [
  { name: 'Star', icon: Star },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Target', icon: Target },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Zap', icon: Zap },
  { name: 'Award', icon: Award },
];

const colorOptions = [
  { name: 'Gray', value: 'gray' },
  { name: 'Red', value: 'red' },
  { name: 'Orange', value: 'amber' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Green', value: 'green' },
  { name: 'Blue', value: 'blue' },
  { name: 'Indigo', value: 'indigo' },
  { name: 'Purple', value: 'purple' },
  { name: 'Pink', value: 'pink' },
];

export const CustomPresetDialog = ({
  onPresetCreated,
  existingPresets,
}: CustomPresetDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Star');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [filters, setFilters] = useState<CourseFilters>({});

  // Filter criteria states
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minEnrollments, setMinEnrollments] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    // Check for duplicate names
    if (existingPresets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A preset with this name already exists');
      return;
    }

    // Build filters object
    const newFilters: CourseFilters = {};

    if (statusFilter !== 'all') {
      newFilters.status = [statusFilter as 'published' | 'draft'];
    }

    if (priceRange[0] > 0 || priceRange[1] < 1000) {
      newFilters.priceRange = priceRange;
    }

    if (minEnrollments > 0 || minRating > 0) {
      newFilters.performance = {};
      if (minEnrollments > 0) {
        newFilters.performance.minEnrollments = minEnrollments;
      }
      if (minRating > 0) {
        newFilters.rating = { min: minRating, max: 5 };
      }
    }

    const iconComponent = iconOptions.find(i => i.name === selectedIcon)?.icon || Star;

    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      icon: iconComponent,
      filters: newFilters,
      isCustom: true,
      createdAt: new Date(),
      color: selectedColor,
    };

    onPresetCreated(newPreset);
    toast.success('Custom preset created successfully');
    handleReset();
    setOpen(false);
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setSelectedIcon('Star');
    setSelectedColor('indigo');
    setStatusFilter('all');
    setPriceRange([0, 1000]);
    setMinEnrollments(0);
    setMinRating(0);
  };

  const SelectedIcon = iconOptions.find(i => i.name === selectedIcon)?.icon || Star;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-7 sm:h-8">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Create Preset</span>
          <span className="sm:hidden text-xs">Custom</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-lg sm:text-xl">Create Custom Filter Preset</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Create a reusable filter combination for quick access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
          {/* Basic Info */}
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">Preset Name *</Label>
              <Input
                id="name"
                placeholder="e.g., High-Value Courses"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="text-sm"
              />
              <p className="text-[10px] sm:text-xs text-gray-500">{name.length}/50 characters</p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this filter preset does"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={150}
                rows={2}
                className="text-sm resize-none"
              />
              <p className="text-[10px] sm:text-xs text-gray-500">{description.length}/150 characters</p>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Appearance</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="icon" className="text-xs sm:text-sm">Icon</Label>
                <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.name} value={option.name}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">{option.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="color" className="text-xs sm:text-sm">Color</Label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex-shrink-0"
                            style={{
                              backgroundColor: `rgb(var(--${option.value}-500))`,
                            }}
                          />
                          <span className="text-xs sm:text-sm">{option.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <Card className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-2">Preview</p>
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="p-1.5 sm:p-2 rounded-md bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  <SelectedIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold truncate">{name || 'Preset Name'}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">{description || 'Description'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filter Criteria */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Filter Criteria</h4>

            {/* Status */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Course Status</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Courses</SelectItem>
                  <SelectItem value="published" className="text-xs sm:text-sm">Published Only</SelectItem>
                  <SelectItem value="draft" className="text-xs sm:text-sm">Drafts Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">
                Price Range: ${priceRange[0]} - ${priceRange[1] === 1000 ? '1000+' : priceRange[1]}
              </Label>
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={1000}
                step={10}
                className="mt-1 sm:mt-2"
              />
            </div>

            {/* Minimum Enrollments */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Minimum Enrollments: {minEnrollments}</Label>
              <Slider
                value={[minEnrollments]}
                onValueChange={(value) => setMinEnrollments(value[0])}
                max={100}
                step={5}
                className="mt-1 sm:mt-2"
              />
            </div>

            {/* Minimum Rating */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Minimum Rating: {minRating.toFixed(1)} ⭐</Label>
              <Slider
                value={[minRating]}
                onValueChange={(value) => setMinRating(value[0])}
                max={5}
                step={0.5}
                className="mt-1 sm:mt-2"
              />
            </div>
          </div>

          {/* Summary */}
          <Card className="p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
            <h4 className="text-xs sm:text-sm font-semibold mb-2">Filter Summary</h4>
            <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              {statusFilter !== 'all' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">Status</Badge>
                  <span className="truncate">{statusFilter === 'published' ? 'Published only' : 'Drafts only'}</span>
                </div>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">Price</Badge>
                  <span className="truncate">${priceRange[0]} - ${priceRange[1]}</span>
                </div>
              )}
              {minEnrollments > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">Enrollments</Badge>
                  <span className="truncate">{minEnrollments}+ students</span>
                </div>
              )}
              {minRating > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">Rating</Badge>
                  <span className="truncate">{minRating.toFixed(1)}+ stars</span>
                </div>
              )}
              {statusFilter === 'all' && priceRange[0] === 0 && priceRange[1] === 1000 && minEnrollments === 0 && minRating === 0 && (
                <p className="text-[10px] sm:text-xs text-gray-500 italic">No filters selected (will show all courses)</p>
              )}
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto gap-2">
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Reset</span>
          </Button>
          <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Create Preset</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
