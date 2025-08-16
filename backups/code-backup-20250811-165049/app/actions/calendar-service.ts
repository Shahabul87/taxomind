import { db } from "@/lib/db";

// Define CalendarEvent interface based on the Prisma schema
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string; // ISO string format
  endDate: string; // ISO string format
  allDay: boolean;
  isAllDay?: boolean;
  location: string | null;
  recurringType: string | null;
  recurringEndDate: string | null; // ISO string format
  color: string | null;
  taskId: string | null;
  userId: string;
  parentEventId: string | null;
  externalId: string | null;
  source: string | null;
  lastSync: string | null; // ISO string format
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  notification?: boolean;
  notificationTime?: number;
  isRecurring?: boolean;
  recurringPattern?: string | null;
  recurringInterval?: number | null;
  recurringDays?: number[];
  isRecurringInstance?: boolean;
  category: string;
}

export type CalendarEventInput = Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt" | "isRecurringInstance" | "parentEventId" | "externalId" | "source" | "lastSync">;

// This type is safe to use directly with Prisma
export type PrismaCalendarEventInput = Omit<CalendarEventInput, "isAllDay"> & { allDay: boolean };

/**
 * Calendar Event Utilities
 */
export class CalendarService {
  /**
   * Helper function to expand recurring events
   * This generates virtual instances of recurring events within a date range
   */
  static expandRecurringEvent(
    event: CalendarEvent, 
    rangeStart: Date, 
    rangeEnd: Date
  ): CalendarEvent[] {
    const expandedEvents: CalendarEvent[] = [];
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const eventDuration = endDate.getTime() - startDate.getTime();
    
    // Maximum date to consider for recurring events
    const maxDate = event.recurringEndDate ? new Date(event.recurringEndDate) : rangeEnd;
    
    // Early return if the recurring end date is before our range
    if (event.recurringEndDate && new Date(event.recurringEndDate) < rangeStart) {
      return [];
    }
    
    let currentDate = new Date(startDate);
    
    // Use any to bypass type checking for recurringType
    const recurringType = (event as any).recurringType;
    
    // Don't include the original event (it's already in the main array)
    if (recurringType === "daily") {
      // Start from the next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      while (currentDate <= maxDate && currentDate <= rangeEnd) {
        if (currentDate >= rangeStart) {
          const recurrentStartDate = new Date(currentDate);
          const recurrentEndDate = new Date(recurrentStartDate.getTime() + eventDuration);
          
          expandedEvents.push({
            ...event,
            id: `${event.id}_${currentDate.toISOString()}`,
            startDate: recurrentStartDate.toISOString(),
            endDate: recurrentEndDate.toISOString(),
            // Mark as generated instance
            isRecurringInstance: true,
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (recurringType === "weekly") {
      // Start from the next week
      currentDate.setDate(currentDate.getDate() + 7);
      
      while (currentDate <= maxDate && currentDate <= rangeEnd) {
        if (currentDate >= rangeStart) {
          const recurrentStartDate = new Date(currentDate);
          const recurrentEndDate = new Date(recurrentStartDate.getTime() + eventDuration);
          
          expandedEvents.push({
            ...event,
            id: `${event.id}_${currentDate.toISOString()}`,
            startDate: recurrentStartDate.toISOString(),
            endDate: recurrentEndDate.toISOString(),
            isRecurringInstance: true,
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else if (recurringType === "monthly") {
      // Start from the next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      while (currentDate <= maxDate && currentDate <= rangeEnd) {
        if (currentDate >= rangeStart) {
          const recurrentStartDate = new Date(currentDate);
          const recurrentEndDate = new Date(recurrentStartDate.getTime() + eventDuration);
          
          expandedEvents.push({
            ...event,
            id: `${event.id}_${currentDate.toISOString()}`,
            startDate: recurrentStartDate.toISOString(),
            endDate: recurrentEndDate.toISOString(),
            isRecurringInstance: true,
          });
        }
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else if (recurringType === "yearly") {
      // Start from the next year
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      
      while (currentDate <= maxDate && currentDate <= rangeEnd) {
        if (currentDate >= rangeStart) {
          const recurrentStartDate = new Date(currentDate);
          const recurrentEndDate = new Date(recurrentStartDate.getTime() + eventDuration);
          
          expandedEvents.push({
            ...event,
            id: `${event.id}_${currentDate.toISOString()}`,
            startDate: recurrentStartDate.toISOString(),
            endDate: recurrentEndDate.toISOString(),
            isRecurringInstance: true,
          });
        }
        
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }
    
    return expandedEvents;
  }
} 