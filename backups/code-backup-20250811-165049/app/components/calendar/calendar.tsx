"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { format, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isOnline?: boolean;
  color?: string; // Optional field for custom event color
}

interface CalendarProps {
  events: CalendarEvent[];
  onAddEvent?: (date: Date) => void;
  canAddEvent?: boolean;
  className?: string;
}

export const Calendar = ({ events, onAddEvent, canAddEvent = false, className }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar view helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);
  
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, day);
    });
  };
  
  const nextMonth = () => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    setCurrentDate(date);
  };
  
  const prevMonth = () => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - 1);
    setCurrentDate(date);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden", className)}>
      {/* Calendar header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {format(currentDate, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            Next
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 text-xs leading-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2.5 text-center font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 text-sm bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {calendarDays.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[6rem] p-2 border border-gray-200 dark:border-gray-700",
                !isCurrentMonth && "bg-gray-50 dark:bg-gray-900/20 text-gray-400 dark:text-gray-600",
                isToday && "bg-blue-50 dark:bg-blue-900/20",
                dayIdx === 0 && "border-l-0",
                dayIdx === calendarDays.length - 1 && "border-r-0"
              )}
            >
              <div className="flex justify-between">
                <time dateTime={format(day, "yyyy-MM-dd")}>
                  {format(day, "d")}
                </time>
                {canAddEvent && isCurrentMonth && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 rounded-full opacity-0 hover:opacity-100"
                    onClick={() => onAddEvent?.(day)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Display events for this day */}
              <div className="mt-2 space-y-1 max-h-[5rem] overflow-y-auto">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "px-2 py-1 text-xs rounded",
                      "truncate cursor-pointer",
                      event.isOnline 
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" 
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                      event.color // Apply custom color if provided
                    )}
                    title={`${event.title} (${event.startTime} - ${event.endTime})`}
                  >
                    {event.startTime} {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 