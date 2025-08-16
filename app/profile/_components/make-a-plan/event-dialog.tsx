"use client";

import { useState, useEffect } from "react";
import { format, addHours, isValid, parseISO, formatISO, isSameDay, isBefore } from "date-fns";
import { CalendarEvent } from "@/app/actions/calendar-service";
import { createCalendarEvent, deleteCalendarEvent } from "@/app/actions/calendar-actions";
import { logger } from '@/lib/logger';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Trash2, 
  AlertTriangle,
  Repeat,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  event: CalendarEvent | null;
  onSave: () => void;
}

export function EventDialog({ 
  open, 
  onOpenChange, 
  selectedDate,
  event,
  onSave 
}: EventDialogProps) {
  // State for form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    location: "",
    category: "Meeting", // UI only - not stored in DB
    color: "#4f46e5",
    recurringType: "none" as "none" | "daily" | "weekly" | "monthly" | "yearly",
    recurringEndDate: "",
  });

  // Form validation states
  const [errors, setErrors] = useState({
    title: false,
    dates: false,
    pastDate: false
  });

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (open) {
      try {
        // Reset errors
        setErrors({
          title: false,
          dates: false,
          pastDate: false
        });
        
        if (event) {
          // Edit mode - populate form with event data
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          
          setFormData({
            title: event.title,
            description: event.description || "",
            startDate: format(startDate, "yyyy-MM-dd"),
            startTime: format(startDate, "HH:mm"),
            endDate: format(endDate, "yyyy-MM-dd"),
            endTime: format(endDate, "HH:mm"),
            allDay: event.allDay || event.isAllDay || false,
            location: event.location || "",
            category: event.category,
            color: event.color || "#4f46e5",
            recurringType: event.recurringType as any || "none",
            recurringEndDate: event.recurringEndDate ? format(new Date(event.recurringEndDate), "yyyy-MM-dd") : "",
          });
          
          setShowRecurring(event.recurringType !== "none" && event.recurringType !== undefined);
        } else if (selectedDate) {
          // New event mode - use selected date and add 1 hour for end time
          const endTime = addHours(selectedDate, 1);
          
          setFormData({
            title: "",
            description: "",
            startDate: format(selectedDate, "yyyy-MM-dd"),
            startTime: format(selectedDate, "HH:mm"),
            endDate: format(selectedDate, "yyyy-MM-dd"),
            endTime: format(endTime, "HH:mm"),
            allDay: false,
            location: "",
            category: "Meeting",
            color: "#4f46e5",
            recurringType: "none",
            recurringEndDate: "",
          });
          
          setShowRecurring(false);
        }
      } catch (error: any) {
        logger.error("Error setting up event form:", error);
        toast.error("There was a problem loading the event form");
        onOpenChange(false);
      }
    }
  }, [open, event, selectedDate, onOpenChange]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle all day toggle
  const handleAllDayToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, allDay: checked }));
  };
  
  // Event categories
  const eventCategories = [
    "Meeting",
    "Personal",
    "Deadline",
    "Task",
    "Course Planning",
    "Content Creation",
    "Research",
    "Marketing",
    "Admin"
  ];
  
  // Color options
  const colorOptions = [
    { name: "Blue", value: "#4f46e5" },
    { name: "Red", value: "#ef4444" },
    { name: "Green", value: "#10b981" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Yellow", value: "#eab308" },
    { name: "Gray", value: "#6b7280" },
  ];

  // Handle event deletion
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteCalendarEvent(eventId);
      toast.success("Event deleted successfully");
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      logger.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Reset errors
      setErrors({
        title: false,
        dates: false,
        pastDate: false
      });
      
      // Basic validation
      if (!formData.title.trim()) {
        setErrors(prev => ({ ...prev, title: true }));
        toast.error("Please enter an event title");
        return;
      }
      
      // Create dates from form data
      let startDate = new Date(`${formData.startDate}T${formData.startTime}`);
      let endDate = new Date(`${formData.endDate}T${formData.endTime}`);
      
      // Validate dates
      if (!isValid(startDate) || !isValid(endDate)) {
        setErrors(prev => ({ ...prev, dates: true }));
        toast.error("Please enter valid dates and times");
        return;
      }
      
      // Ensure end date is after start date
      if (endDate < startDate) {
        setErrors(prev => ({ ...prev, dates: true }));
        toast.error("End time must be after start time");
        return;
      }
      
      // Validate that the date is not in the past for new events
      if (!event) {
        const now = new Date();
        if (startDate < now && !isSameDay(startDate, now)) {
          setErrors(prev => ({ ...prev, pastDate: true }));
          toast.error("Cannot create events in the past");
          return;
        }
      }
      
      // For all-day events, adjust times
      if (formData.allDay) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      // Check recurring end date if applicable
      let recurringEndDate = null;
      if (showRecurring && formData.recurringType !== "none") {
        if (formData.recurringEndDate) {
          recurringEndDate = new Date(`${formData.recurringEndDate}T23:59:59`);
          
          if (!isValid(recurringEndDate)) {
            toast.error("Please enter a valid recurring end date");
            return;
          }
          
          if (recurringEndDate < endDate) {
            toast.error("Recurring end date must be after the event end date");
            return;
          }
        }
      }
      
      setIsSubmitting(true);
      
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        startDate,
        endDate,
        allDay: formData.allDay,
        location: formData.location || null,
        color: formData.color,
        category: formData.category,
        recurringType: showRecurring ? formData.recurringType : "none",
        recurringEndDate: recurringEndDate,
        taskId: null,
      };
      
      if (event) {
        // For existing events, we need to make an API call since server actions can't update
        try {
          const response = await fetch(`/api/calendar/events/${event.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update event');
          }
          
          toast.success("Event updated successfully");
        } catch (error: any) {
          logger.error("Error updating event:", error);
          toast.error("Failed to update event. Please try again.");
          throw error;
        }
      } else {
        // Create new event using server action
        await createCalendarEvent(eventData);
        toast.success("Event created successfully");
      }
      
      // Close dialog and refresh events
      onOpenChange(false);
      onSave();
    } catch (error: any) {
      logger.error("Error saving event:", error);
      toast.error("Failed to save event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className={errors.title ? "text-red-500" : ""}>
              Event Title *
            </Label>
            <Input 
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Add title"
              className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-500">Title is required</p>
            )}
          </div>
          
          {/* Date & Time Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className={errors.dates || errors.pastDate ? "text-red-500" : ""}>
                Start Date *
              </Label>
              <div className="flex flex-col space-y-2">
                <Input 
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={!event ? format(today, "yyyy-MM-dd") : undefined}
                  className={errors.dates || errors.pastDate ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {!formData.allDay && (
                  <Input 
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={errors.dates ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className={errors.dates ? "text-red-500" : ""}>
                End Date *
              </Label>
              <div className="flex flex-col space-y-2">
                <Input 
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className={errors.dates ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {!formData.allDay && (
                  <Input 
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={errors.dates ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                )}
              </div>
            </div>
          </div>
          
          {errors.dates && (
            <p className="text-xs text-red-500">Please ensure end time is after start time</p>
          )}
          
          {errors.pastDate && (
            <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-xs text-red-500">Cannot create events in the past</p>
            </div>
          )}
          
          {/* All Day Switch */}
          <div className="flex items-center justify-between">
            <Label htmlFor="all-day" className="cursor-pointer">All Day Event</Label>
            <Switch 
              id="all-day"
              checked={formData.allDay}
              onCheckedChange={handleAllDayToggle}
            />
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Add location"
                className="pl-8"
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add description"
              rows={3}
            />
          </div>
          
          {/* Category & Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Study">Study</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  "#4f46e5", // Indigo
                  "#ef4444", // Red
                  "#16a34a", // Green
                  "#f59e0b", // Amber
                  "#0ea5e9", // Blue
                  "#8b5cf6", // Purple
                  "#ec4899", // Pink
                  "#14b8a6", // Teal
                  "#f97316", // Orange
                  "#64748b", // Slate
                  "#84cc16", // Lime
                  "#6b7280", // Gray
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform",
                      formData.color === color 
                        ? "border-gray-900 dark:border-white scale-110 shadow-md" 
                        : "border-transparent hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color})}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Recurring Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring" className="cursor-pointer">Recurring Event</Label>
              <Switch 
                id="recurring"
                checked={showRecurring}
                onCheckedChange={setShowRecurring}
              />
            </div>
            
            {showRecurring && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="recurringType">Repeat Frequency</Label>
                  <Select
                    value={formData.recurringType}
                    onValueChange={(value: any) => setFormData({...formData, recurringType: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Do not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.recurringType !== "none" && (
                  <div className="space-y-2">
                    <Label htmlFor="recurringEndDate">End Repeat (Optional)</Label>
                    <Input 
                      id="recurringEndDate"
                      name="recurringEndDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={handleChange}
                      min={formData.endDate}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0 mt-6">
          {event && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this event?")) {
                  onOpenChange(false);
                  handleDeleteEvent(event.id);
                }
              }}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-initial"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                  Saving...
                </>
              ) : event ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 