"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  addDays, 
  subDays,
  addWeeks,
  subWeeks,
  addMonths, 
  subMonths, 
  format, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  isBefore,
  isAfter,
  differenceInMinutes
} from "date-fns";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  MapPin,
  Repeat,
  MoreHorizontal,
  Trash2,
  Edit,
  ArrowLeft,
  ArrowRight,
  Filter,
  Search,
  X,
  Calendar,
  LayoutGrid,
  PanelLeft,
  AlertTriangle
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarEvent } from "@/app/actions/calendar-service";
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from "@/app/actions/calendar-actions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDialog } from "./event-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { DebugCalendar } from "./debug-calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ViewType = "month" | "week" | "day";

interface CalendarViewProps {
  userId: string;
}

// Helper function for consistent date parsing
const parseEventDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  // Try to parse as ISO string or any other format
  return new Date(dateString);
};

// Helper function to check if an event is all-day
const getEventAllDay = (event: any): boolean => {
  // Handle both allDay and isAllDay for compatibility, prioritize allDay
  return event.allDay || event.isAllDay || false;
};

// Helper function to format event details for tooltip
const formatEventDetails = (event: CalendarEvent): React.ReactNode => {
  const startDate = parseEventDate(event.startDate);
  const endDate = parseEventDate(event.endDate);
  
  // Function to determine if a color is dark (to set appropriate text color)
  const isDarkColor = (color: string) => {
    // Default to false for light colors if we can't determine
    if (!color || !color.startsWith('#')) return false;
    
    // Convert hex to RGB and calculate luminance
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate perceived brightness (YIQ formula)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };
  
  const headerBgColor = event.color ? `${event.color}40` : '#4f46e540';
  const headerTextColor = isDarkColor(event.color || '') ? 'text-white' : 'text-gray-900 dark:text-white';
  
  return (
    <div className="w-full space-y-3">
      {/* Header with color accent */}
      <div 
        className={`relative py-3 px-4 -mx-3 -mt-3 mb-2 rounded-t-lg ${headerTextColor}`}
        style={{ 
          backgroundColor: headerBgColor,
          borderBottom: `2px solid ${event.color || '#4f46e5'}`
        }}
      >
        <h3 className="font-semibold text-base drop-shadow-sm">{event.title}</h3>
        {event.category && (
          <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm font-medium" style={{ color: event.color }}>
            {event.category}
          </span>
        )}
      </div>
      
      {/* Date/Time section */}
      <div className="flex gap-3">
        <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 mt-0.5">
          <Calendar className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{format(startDate, "EEEE, MMMM d, yyyy")}</div>
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {getEventAllDay(event) ? (
              "All day"
            ) : (
              <>{format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</>
            )}
          </div>
        </div>
      </div>
      
      {/* Location section */}
      {event.location && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 mt-0.5">
            <MapPin className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{event.location}</div>
        </div>
      )}
      
      {/* Description section */}
      {event.description && (
        <div className="mt-2">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Description</div>
          <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/70 p-2 rounded-md">
            {event.description}
          </div>
        </div>
      )}
      
      {/* Recurring info */}
      {event.recurringType && event.recurringType !== "none" && (
        <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 py-1.5 px-2 rounded-md mt-1">
          <Repeat className="h-3.5 w-3.5" />
          <span className="font-medium">Repeats {event.recurringType}</span>
          {event.recurringEndDate && (
            <span className="text-gray-600 dark:text-gray-400 ml-1">
              until {format(parseEventDate(event.recurringEndDate), "MMM d, yyyy")}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export function CalendarView({ userId }: CalendarViewProps) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewType>("month");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!userId) {
        console.error("Missing userId in CalendarView");
        setError("User ID is required for loading events");
        return;
      }
      
      // Determine date range based on view
      let start: Date, end: Date;
      
      if (view === "month") {
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
      } else if (view === "week") {
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else {
        // Day view shows just the current day
        start = currentDate;
        end = currentDate;
      }
      
      // Add padding for month view to show adjacent month days
      if (view === "month") {
        start = subDays(start, 7);
        end = addDays(end, 7);
      }
      
      console.log(`Fetching calendar events for user ${userId} from ${start.toISOString()} to ${end.toISOString()}`);
      
      // Use server action directly
      const fetchedEvents = await getCalendarEvents(start, end, userId);
      
      if (!fetchedEvents || !Array.isArray(fetchedEvents)) {
        console.error("Invalid events data received:", fetchedEvents);
        setError("Could not load calendar data. Please try again later.");
        return;
      }
      
      console.log(`Successfully loaded ${fetchedEvents.length} events`);
      
      // Log more detailed event information for debugging
      if (fetchedEvents.length > 0) {
        fetchedEvents.forEach(event => {
          console.log('Event found:', {
            title: event.title,
            startDate: new Date(event.startDate).toISOString(),
            formattedStartDate: format(new Date(event.startDate), 'yyyy-MM-dd HH:mm:ss'),
            category: event.category
          });
        });
      } else {
        console.log('No events found for the current date range');
      }
      
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load calendar events";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, view, userId]);
  
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  // Update sidebar visibility when screen size changes
  useEffect(() => {
    setShowSidebar(!isMobile);
  }, [isMobile]);
  
  // Navigation handlers
  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(prev => subMonths(prev, 1));
    } else if (view === "week") {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subDays(prev, 1));
    }
  };
  
  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (view === "week") {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Dialog handlers
  const handleNewEvent = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setDialogOpen(true);
  };
  
  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(new Date(event.startDate));
    setDialogOpen(true);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteCalendarEvent(eventId);
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    }
  };
  
  // Calendar title based on current view and date
  const calendarTitle = useMemo(() => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    } else if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, "d")} - ${format(weekEnd, "d MMMM yyyy")}`;
      } else {
        return `${format(weekStart, "d MMM")} - ${format(weekEnd, "d MMM yyyy")}`;
      }
    } else {
      return format(currentDate, "EEEE, d MMMM yyyy");
    }
  }, [currentDate, view]);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return events;
    
    // Filter by color instead of category since category doesn't exist in DB schema
    return events.filter(event => {
      // If the event color matches a known category color, consider it of that category
      if (event.color) {
        const matchesColor = 
          (eventFilter === "Meeting" && event.color === "#4f46e5") ||
          (eventFilter === "Personal" && event.color === "#16a34a") ||
          (eventFilter === "Work" && event.color === "#ef4444") ||
          (eventFilter === "Study" && event.color === "#f59e0b") ||
          (eventFilter === "Travel" && event.color === "#0ea5e9");
        return matchesColor;
      }
      return false;
    });
  }, [events, eventFilter]);
  
  // Event categories 
  const eventCategories = useMemo(() => {
    const categories = new Set<string>();
    
    // Derive categories from colors
    events.forEach(event => {
      if (event.color) {
        switch(event.color) {
          case "#4f46e5": categories.add("Meeting"); break;
          case "#16a34a": categories.add("Personal"); break;
          case "#ef4444": categories.add("Work"); break;
          case "#f59e0b": categories.add("Study"); break;
          case "#0ea5e9": categories.add("Travel"); break;
        }
      }
    });
    
    return Array.from(categories);
  }, [events]);
  
  // Get category color - this is important to keep in UI even if the DB doesn't store category
  const getCategoryColor = useCallback((categoryOrColor: string): string => {
    // If the input is a hex color, return it directly
    if (categoryOrColor.startsWith('#')) {
      return categoryOrColor;
    }
    
    // Otherwise, map category names to colors
    const categoryColors: Record<string, string> = {
      Meeting: "#4f46e5", // Indigo
      Personal: "#16a34a", // Green
      Work: "#ef4444",    // Red
      Study: "#f59e0b",   // Amber
      Travel: "#0ea5e9",  // Blue
      Other: "#8b5cf6"    // Purple
    };
    
    return categoryColors[categoryOrColor] || "#4f46e5";
  }, []);
  
  // Render Functions
  const renderEventBadge = (event: CalendarEvent) => {
    // Define color based on the event's color since category doesn't exist in DB
    const getEventColor = (color: string) => {
      // Map known color values to CSS classes
      switch (color) {
        case "#4f46e5": // Meeting (Indigo)
          return "bg-blue-500 dark:bg-blue-600";
        case "#16a34a": // Personal (Green)
          return "bg-purple-500 dark:bg-purple-600";
        case "#ef4444": // Work (Red)
          return "bg-red-500 dark:bg-red-600";
        case "#f59e0b": // Study (Amber)
          return "bg-amber-500 dark:bg-amber-600";
        case "#0ea5e9": // Travel (Blue)
          return "bg-blue-500 dark:bg-blue-600";
        case "#8b5cf6": // Purple
          return "bg-indigo-500 dark:bg-indigo-600";
        case "#ec4899": // Pink
          return "bg-pink-500 dark:bg-pink-600";
        case "#14b8a6": // Teal
          return "bg-teal-500 dark:bg-teal-600";
        default:
          return "bg-gray-500 dark:bg-gray-600";
      }
    };
    
    return getEventColor(event.color || "#4f46e5");
  };
  
  const renderMonthView = () => {
    // Get days in current month view
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const dateFormat = "d";
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const dayRows = [];
    
    let days = [];
    let day = startDate;
    let formattedDate = "";
    
    // Render days of week header
    const daysOfWeekHeader = (
      <div className="grid grid-cols-7 mb-2 text-sm font-medium text-center">
        {daysOfWeek.map((dayName) => (
          <div 
            key={dayName} 
            className="py-2 mx-1 text-gray-500 dark:text-gray-400"
          >
            {dayName}
          </div>
        ))}
        </div>
    );
    
    // Create calendar grid
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isPastDay = isBefore(day, today) && !isSameDay(day, today);
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        // Get events for this day
        const dayEvents = filteredEvents.filter(event => {
          // Use our helper function for consistent date parsing
          const eventStart = parseEventDate(event.startDate);
          return isSameDay(eventStart, day);
        });
            
        days.push(
              <div 
                key={day.toString()} 
                className={cn(
              "min-h-[120px] p-1 border border-gray-200 dark:border-gray-800 relative group transition-all duration-200",
              !isCurrentMonth && "bg-gray-50/70 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600",
              isCurrentMonth && !isPastDay && !isSameDay(day, today) && "hover:bg-gray-50 dark:hover:bg-gray-900/50",
              isSameDay(day, today) && "bg-blue-50 dark:bg-blue-900/20 relative",
              isPastDay && "bg-gray-100/80 dark:bg-gray-800/30"
            )}
            onClick={() => !isPastDay && handleNewEvent(cloneDay)}
          >
            <div className={cn(
              "flex justify-between items-start",
              isPastDay && "opacity-60"
            )}>
              <div
                    className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-full my-0.5 mb-1 text-sm font-medium",
                  isSameDay(day, today) && "bg-blue-600 text-white",
                  !isSameDay(day, today) && isCurrentMonth && !isPastDay && "hover:bg-gray-200 dark:hover:bg-gray-800/80 cursor-pointer"
                )}
              >
                {formattedDate}
                </div>
                
              {isPastDay && (
                <div className="absolute top-0 right-0 left-0 bottom-0 bg-gray-100/70 dark:bg-gray-900/60 z-10 backdrop-blur-[1px]">
                  <div className="absolute top-1 right-1">
                    <span className="text-xs text-gray-500 dark:text-gray-500">Past day</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Events for this day */}
            <div className={cn("space-y-1 overflow-y-auto max-h-[80px] relative")}>
              {dayEvents.length > 0 ? (
                dayEvents
                  .sort((a, b) => {
                    const aTime = new Date(a.startDate).getTime();
                    const bTime = new Date(b.startDate).getTime();
                    return aTime - bTime;
                  })
                  .slice(0, 3)
                  .map((event) => (
                    <TooltipProvider key={event.id}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "px-2 py-1 text-xs rounded-lg cursor-pointer truncate",
                              getEventAllDay(event) && "font-medium",
                              isPastDay && "opacity-60"
                            )}
                            style={{ 
                              backgroundColor: event.color ? `${event.color}20` : "#4f46e520",
                              borderLeft: `3px solid ${event.color || "#4f46e5"}`
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            {getEventAllDay(event) ? (
                              <span>{event.title}</span>
                            ) : (
                              <span>
                                {format(parseEventDate(event.startDate), "HH:mm")} {event.title}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          align="start" 
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-lg w-[300px] p-0 z-50"
                          sideOffset={5}
                        >
                          {formatEventDetails(event)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
              ) : null}
              
              {/* More indicator if needed */}
              {dayEvents.length > 3 && (
                <button
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Set view to day view and navigate to this day
                    setView("day");
                    setCurrentDate(cloneDay);
                  }}
                >
                  +{dayEvents.length - 3} more
                </button>
              )}
            </div>
            
            {/* Add button - only appear on hover and for current/future days */}
            {!isPastDay && isCurrentMonth && (
              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNewEvent(cloneDay);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        );
        
        day = addDays(day, 1);
      }
      
      dayRows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0">
          {days}
              </div>
            );
      days = [];
    }
    
    return (
      <div className="space-y-4">
        {daysOfWeekHeader}
        <div className="space-y-1">{dayRows}</div>
      </div>
    );
  };
  
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const today = new Date();
    
    // Get days of week headers
    const dayHeaders = days.map(day => {
      const isCurrentDay = isSameDay(day, today);
      const isPastDay = isBefore(day, today) && !isSameDay(day, today);
    
    return (
            <div 
              key={day.toString()} 
              className={cn(
            "text-center py-2 flex flex-col items-center",
            isCurrentDay && "text-blue-600 dark:text-blue-400",
            isPastDay && "text-gray-400 dark:text-gray-600"
          )}
        >
          <span className="text-xs font-medium mb-1">{format(day, "EEE")}</span>
          <button
                className={cn(
              "h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium",
              isCurrentDay && "bg-blue-600 text-white",
              !isCurrentDay && !isPastDay && "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
            onClick={() => {
              setCurrentDate(day);
              setView("day");
            }}
              >
                {format(day, "d")}
          </button>
          
          {isPastDay && (
            <div className="mt-1">
              <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto" />
                </div>
          )}
            </div>
      );
    });
    
    // Group events by day and hour for easier rendering
    const eventsByDayAndHour: Record<string, Record<number, CalendarEvent[]>> = {};
    
    // Initialize all days and hours
    days.forEach(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      eventsByDayAndHour[dayStr] = {};
      
      // All day events go to -1
      eventsByDayAndHour[dayStr][-1] = [];
      
      // Regular hours
      hours.forEach(hour => {
        eventsByDayAndHour[dayStr][hour] = [];
      });
    });
    
    // Sort events into their respective slots
    filteredEvents.forEach(event => {
      const startDate = parseEventDate(event.startDate);
      const eventDayStr = format(startDate, "yyyy-MM-dd");
      
      // If the event day is in our week view
      if (eventsByDayAndHour[eventDayStr]) {
        if (getEventAllDay(event)) {
          eventsByDayAndHour[eventDayStr][-1].push(event);
        } else {
          const hour = startDate.getHours();
          eventsByDayAndHour[eventDayStr][hour].push(event);
        }
      }
    });
    
    // Current time indicator position (only for today)
    const now = new Date();
    const currentTimePosition = !days.some(day => isSameDay(day, now)) 
      ? null 
      : ((now.getHours() * 60 + now.getMinutes()) / (24 * 60) * 100);
    
    return (
      <div className="space-y-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 pb-2">
          {dayHeaders}
        </div>
        
        {/* All day events */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 pb-2">
          {days.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const allDayEvents = eventsByDayAndHour[dayStr][-1];
            const isPastDay = isBefore(day, today) && !isSameDay(day, today);
            
                    return (
              <div 
                key={`all-day-${dayStr}`} 
                className={cn(
                  "px-1 min-h-[50px] relative",
                  isPastDay && "bg-gray-50 dark:bg-gray-900/20"
                )}
                onClick={() => {
                  if (!isPastDay) {
                    const newDate = new Date(day);
                    newDate.setHours(9, 0, 0, 0); // Default to 9 AM
                    handleNewEvent(newDate);
                  }
                }}
              >
                {allDayEvents.length > 0 ? (
                  <div className="space-y-1 py-1">
                    {allDayEvents.slice(0, 2).map(event => (
                      <TooltipProvider key={event.id}>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "px-2 py-1 text-xs rounded-md cursor-pointer truncate",
                                isPastDay && "opacity-60"
                              )}
                              style={{
                                backgroundColor: event.color ? `${event.color}15` : "#4f46e515",
                                borderLeft: `3px solid ${event.color || "#4f46e5"}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                            >
                              {event.title}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            align="center" 
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-lg w-[300px] p-0 z-50"
                            sideOffset={5}
                          >
                            {formatEventDetails(event)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {allDayEvents.length > 2 && (
                      <div className="text-xs text-center text-blue-600 dark:text-blue-400">
                        +{allDayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    {!isPastDay && (
                      <button 
                        className="opacity-0 hover:opacity-100 text-xs text-blue-600 dark:text-blue-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newDate = new Date(day);
                          newDate.setHours(0, 0, 0, 0);
                          handleNewEvent(newDate);
                        }}
                      >
                        <Plus className="h-3 w-3 mx-auto" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Disabled overlay for past days */}
                {isPastDay && (
                  <div className="absolute inset-0 bg-gray-100/40 dark:bg-gray-900/40 z-10" />
                )}
                </div>
                    );
                  })}
        </div>
        
        {/* Hour slots */}
        <div className="relative">
          {/* Current time indicator (red line) */}
          {currentTimePosition !== null && (
            <div 
              className="absolute z-30 w-full border-t-2 border-red-500 flex items-center pointer-events-none"
              style={{ top: `calc(40px + ${currentTimePosition}% * (24 * 40px) / 100)` }}
            >
              <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5 -mt-1.5" />
            </div>
          )}
          
          {hours.map(hour => {
            const hourStart = new Date();
            hourStart.setHours(hour, 0, 0, 0);
            
            return (
              <div 
                key={hour} 
                className="grid grid-cols-7 border-t border-gray-200 dark:border-gray-800"
                style={{ gridTemplateColumns: "auto repeat(7, 1fr)" }}
              >
                {/* Hour label */}
                <div className="py-2 pr-2 text-right text-xs text-gray-500 dark:text-gray-400 select-none w-10">
                  {format(hourStart, "h a")}
                </div>
                
                {/* Days */}
                {days.map(day => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const hourEvents = eventsByDayAndHour[dayStr][hour] || [];
                  const isPastDay = isBefore(day, today) && !isSameDay(day, today);
                  const isPastHourToday = isSameDay(day, today) && hour < new Date().getHours();
                  const isCurrentHour = hour === new Date().getHours() && isSameDay(day, new Date());
                  const isDisabled = isPastDay || isPastHourToday;
                  
                  return (
                    <div 
                      key={`${dayStr}-${hour}`} 
                      className={cn(
                        "min-h-[40px] relative group",
                        isCurrentHour && "bg-blue-50/30 dark:bg-blue-900/10",
                        isDisabled && "bg-gray-50/70 dark:bg-gray-900/30"
                      )}
                      onClick={() => {
                        if (!isDisabled) {
                          const newDate = new Date(day);
                          newDate.setHours(hour, 0, 0, 0);
                          handleNewEvent(newDate);
                        }
                      }}
                    >
                      {/* Events in this slot */}
                      {hourEvents.map(event => {
                        const startMinutes = new Date(event.startDate).getMinutes();
                        
                        return (
                          <TooltipProvider key={event.id}>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                    "absolute z-10 left-0.5 right-0.5 px-1.5 py-0.5 rounded-sm text-xs cursor-pointer truncate",
                                    isDisabled && "opacity-60"
                                  )}
                                  style={{ 
                                    backgroundColor: event.color ? `${event.color}20` : "#4f46e520",
                                    borderLeft: `2px solid ${event.color || "#4f46e5"}`,
                                    top: `${(startMinutes / 60) * 100}%`,
                                    minHeight: "18px"
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event);
                                  }}
                                >
                                  {format(new Date(event.startDate), "HH:mm")} {event.title}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent 
                                side="right" 
                                align="start" 
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-lg w-[300px] p-0 z-50"
                                sideOffset={5}
                              >
                                {formatEventDetails(event)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      
                      {/* Add event hover state - only for non-past days */}
                      {!isDisabled && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-gray-100/40 dark:bg-gray-800/40 cursor-pointer z-5">
                          <button className="text-[10px] text-blue-600 dark:text-blue-400">
                            <Plus className="h-3 w-3" />
                          </button>
                  </div>
                )}
                      
                      {/* Disabled overlay for past days/hours */}
                      {isDisabled && (
                        <div className="absolute inset-0 bg-gray-100/20 dark:bg-gray-900/20 z-20" />
                  )}
            </div>
          );
        })}
      </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const today = new Date();
    const isPastDay = isBefore(currentDate, today) && !isSameDay(currentDate, today);
    const currentHour = today.getHours();
    
    // Current time indicator position (only for today)
    const now = new Date();
    const currentTimePosition = !isSameDay(currentDate, now) 
      ? null 
      : ((now.getHours() * 60 + now.getMinutes()) / (24 * 60) * 100);
    
    // Group events by hour for easier rendering
    const hourMap: Record<number, CalendarEvent[]> = {};
    
    // Initialize all hours
    hours.forEach(hour => {
      hourMap[hour] = [];
    });
    
    console.log('Current date for day view:', format(currentDate, 'yyyy-MM-dd'));
    
    // Group events
    filteredEvents.forEach(event => {
      const startDate = parseEventDate(event.startDate);
      const isSameDayResult = isSameDay(startDate, currentDate);
      
      console.log(`Day view - checking event "${event.title}":`, {
        eventDate: format(startDate, 'yyyy-MM-dd'),
        currentDate: format(currentDate, 'yyyy-MM-dd'),
        matches: isSameDayResult
      });
      
      if (isSameDayResult) {
        if (getEventAllDay(event)) {
          // Place all-day events at the top
          if (!hourMap[-1]) hourMap[-1] = [];
          hourMap[-1].push(event);
        } else {
          const hour = startDate.getHours();
          hourMap[hour].push(event);
        }
      }
    });
    
    const eventsByHour = hourMap;
    
    return (
      <div className="relative">
        {/* Disabled overlay for completely past days */}
        {isPastDay && (
          <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center max-w-sm">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium">Past Date</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cannot create events in the past. Please select today or a future date.
              </p>
              <Button 
                onClick={handleToday}
                className="mt-4"
                variant="outline"
              >
                Go to Today
              </Button>
            </div>
          </div>
        )}
        
        {/* Day header with date */}
        <div className="p-3 mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-10 w-10 flex items-center justify-center rounded-full",
                isSameDay(currentDate, today) ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              )}>
                {format(currentDate, "d")}
              </div>
              <div>
                <h3 className="text-lg font-medium">{format(currentDate, "EEEE")}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{format(currentDate, "MMMM d, yyyy")}</p>
              </div>
            </div>
            
            {!isPastDay && (
              <Button
                onClick={() => handleNewEvent(currentDate)}
                className="gap-1"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add event
              </Button>
            )}
          </div>
        </div>
        
        {/* All day events section */}
        {eventsByHour[-1]?.length > 0 && (
          <div className="mb-4 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">ALL DAY</h3>
            </div>
            <div className="p-2 space-y-1 bg-white dark:bg-gray-950">
              {eventsByHour[-1].map(event => (
                <TooltipProvider key={event.id}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-900"
                        )}
                        style={{ 
                          borderLeft: `4px solid ${event.color || "#4f46e5"}`
                        }}
                        onClick={() => handleEditEvent(event)}
                      >
                        <div className="flex-1">
                          <span className="font-medium">{event.title}</span>
                          {event.location && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-500 focus:text-red-500"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this event?')) {
                                  handleDeleteEvent(event.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      align="start" 
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-lg w-[300px] p-0 z-50"
                      sideOffset={5}
                    >
                      {formatEventDetails(event)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
        
        {/* Hour slots */}
        <div className="relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
          {/* Current time indicator (red line) */}
          {currentTimePosition !== null && (
            <div 
              className="absolute z-20 w-full border-t-2 border-red-500 flex items-center pointer-events-none"
              style={{ top: `calc(${currentTimePosition}% * (24 * 50px) / 100)` }}
            >
              <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5 -mt-1.5" />
                </div>
          )}
          
          {hours.map(hour => {
            const hourStart = new Date(currentDate);
            hourStart.setHours(hour, 0, 0, 0);
            
            const hourEvents = eventsByHour[hour] || [];
            const isPastHour = isSameDay(currentDate, today) && hour < currentHour;
            
            return (
                <div 
                  key={hour} 
                className={cn(
                  "flex gap-2 group border-t border-gray-200 dark:border-gray-800 relative",
                  hour === currentHour && isSameDay(currentDate, today) && "bg-blue-50/30 dark:bg-blue-900/10",
                  isPastHour && "bg-gray-50/70 dark:bg-gray-900/30"
                )}
              >
                {/* Hour label */}
                <div className="w-16 py-3 pr-4 text-right text-xs text-gray-500 dark:text-gray-400 select-none">
                  {format(hourStart, "h a")}
                </div>
                
                {/* Events in this hour */}
                <div 
                  className="flex-1 min-h-[50px] relative group py-1"
                  onClick={() => {
                    if (!isPastHour) {
                    const newDate = new Date(currentDate);
                      newDate.setHours(hour, 0, 0, 0);
                    handleNewEvent(newDate);
                    }
                  }}
                >
                  {hourEvents.map((event, index) => (
                    <TooltipProvider key={event.id}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "absolute z-10 left-0 right-2 px-3 py-1 mb-1 rounded-md cursor-pointer"
                            )}
                            style={{
                              backgroundColor: event.color ? `${event.color}15` : "#4f46e515",
                              borderLeft: `3px solid ${event.color || "#4f46e5"}`,
                              top: `${(new Date(event.startDate).getMinutes() / 60) * 100}%`,
                              minHeight: "24px"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{event.title}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(event.startDate), "HH:mm")}
                              </span>
                            </div>
                            {event.location && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          align="start" 
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-lg w-[300px] p-0 z-50"
                          sideOffset={5}
                        >
                          {formatEventDetails(event)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  
                  {/* Click to add event - only for non-past hours */}
                  {!isPastHour && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-gray-100/40 dark:bg-gray-800/40 cursor-pointer">
                      <button className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                        <Plus className="h-3 w-3 mr-1" />
                        Add event
                      </button>
                        </div>
                      )}
                  
                  {/* Disabled overlay for past hours */}
                  {isPastHour && (
                    <div className="absolute inset-0 bg-gray-100/30 dark:bg-gray-900/30 z-5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
      </div>
    );
  };
  
  // Save event handler
  const handleSaveEvent = () => {
    fetchEvents();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex flex-col bg-white dark:bg-gray-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      {/* Only show debugging in development mode when explicitly enabled */}
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SHOW_DEBUG === "true" && (
        <div className="px-4 py-2">
          <DebugCalendar userId={userId} />
        </div>
      )}
      
      {error && (
        <div className="p-4 text-center bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setError(null);
              fetchEvents();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}
      
      {/* Google Calendar-like Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button
              variant="ghost" 
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="h-9 w-9 rounded-full"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Calendar</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={handleToday}
            className="h-9 rounded-lg text-sm font-medium"
          >
              Today
            </Button>
          
          <div className="flex items-center rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-9 w-9 rounded-none border-r border-gray-200 dark:border-gray-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-9 w-9 rounded-none"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <h3 className="text-base font-medium min-w-[140px] text-center text-gray-900 dark:text-gray-100">
            {calendarTitle}
          </h3>
          
          <div className="hidden sm:flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <TabsList className="h-8 bg-transparent">
              <TabsTrigger
                value="month"
                onClick={() => setView("month")}
                className={cn(
                  "h-7 px-3 rounded-md text-xs",
                  view === "month" ? "bg-white dark:bg-gray-700 shadow-sm" : "bg-transparent"
                )}
              >
                Month
              </TabsTrigger>
              <TabsTrigger
                value="week"
                onClick={() => setView("week")}
                className={cn(
                  "h-7 px-3 rounded-md text-xs",
                  view === "week" ? "bg-white dark:bg-gray-700 shadow-sm" : "bg-transparent"
                )}
              >
                Week
              </TabsTrigger>
              <TabsTrigger
                value="day"
                onClick={() => setView("day")}
                className={cn(
                  "h-7 px-3 rounded-md text-xs",
                  view === "day" ? "bg-white dark:bg-gray-700 shadow-sm" : "bg-transparent"
                )}
              >
                Day
              </TabsTrigger>
            </TabsList>
          </div>
          
          <Button 
            variant="outline"
            size="sm" 
            className="gap-1 h-9 ml-2 hidden md:flex"
            onClick={() => {
              handleNewEvent(currentDate);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Event</span>
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? "100%" : "240px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
                isMobile ? "absolute inset-0 z-20" : "relative"
              )}
            >
              <div className="p-4 space-y-6">
                {/* Mobile Close Button */}
                {isMobile && (
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Calendar</h3>
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowSidebar(false)}
                      className="h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4" />
                </Button>
                  </div>
                )}
                
                {/* Create Button */}
                <Button 
                  className="w-full justify-start gap-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-sm
                    dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700"
                  onClick={() => handleNewEvent(currentDate)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create event</span>
                </Button>
                
                {/* Mini Calendar (placeholder) */}
                <div className="p-3 border border-gray-200 dark:border-gray-800 rounded-md">
                  <p className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                    {format(currentDate, "MMMM yyyy")}
                  </p>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {["M", "T", "W", "Th", "F", "S", "Su"].map((day, index) => (
                      <div key={`weekday-${index}`} className="text-center text-gray-500 font-medium">
                        {day}
                      </div>
                    ))}
                    {eachDayOfInterval({
                      start: startOfMonth(currentDate),
                      end: endOfMonth(currentDate)
                    }).map((day) => (
                      <div 
                        key={day.toISOString()}
                        className={cn(
                          "h-6 w-6 flex items-center justify-center rounded-full",
                          isToday(day) && "bg-blue-600 text-white",
                          !isToday(day) && isSameMonth(day, currentDate) && "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                          !isSameMonth(day, currentDate) && "text-gray-400 dark:text-gray-600"
                        )}
                        onClick={() => {
                          setCurrentDate(day);
                          setView("day");
                        }}
                      >
                        {format(day, "d")}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Event Filters */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Calendars</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="cal-all" 
                        checked={eventFilter === "all"} 
                        onCheckedChange={() => setEventFilter("all")}
                      />
                      <label htmlFor="cal-all" className="text-sm cursor-pointer">All events</label>
                    </div>
                    {Array.from(eventCategories).map((category) => (
                      <div key={category} className="flex items-center gap-2">
                        <Checkbox 
                          id={`cal-${category}`} 
                          checked={eventFilter === category} 
                          onCheckedChange={() => setEventFilter(category)}
                        />
                        <label 
                          htmlFor={`cal-${category}`} 
                          className="text-sm flex items-center gap-2 cursor-pointer"
                        >
                          <span 
                            className="h-3 w-3 rounded-full" 
                            style={{ 
                              backgroundColor: getCategoryColor(category) 
                            }}
                          />
                    {category}
                        </label>
                      </div>
                ))}
        </div>
      </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
              </div>
        ) : (
          <>
            {view === "month" && renderMonthView()}
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
          </>
        )}
        </div>
      </div>
      
      {/* Event Dialog */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        event={selectedEvent}
        onSave={handleSaveEvent}
      />
    </motion.div>
  );
} 