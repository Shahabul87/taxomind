"use client";

import { useState, useEffect, useCallback } from "react";
import { OptimizedCalendar } from "./optimized-calendar";
import { NewEventDialog } from "./new-event-dialog";
import { handleCalendarError } from "../_lib/error-handler";
import { toast } from "sonner";
import { EventDetailsDialog } from "./event-details-dialog";
import { EditEventDialog } from "./edit-event-dialog";
import { ErrorScreen } from "./error-screen";
import { logger } from '@/lib/logger';

interface CalendarContainerProps {
  userId: string;
  filters: any;
  settings: any;
}

export const CalendarContainer = ({
  userId,
  filters,
  settings,
}: CalendarContainerProps) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null); // Reset error state
      
      // Make sure we have a valid userId
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Create a proper query string
      const searchParams = new URLSearchParams();
      
      // Add userId
      searchParams.append("userId", userId);
      
      // Add date range if available
      if (filters.dateRange && filters.dateRange.start) {
        searchParams.append("date", filters.dateRange.start.toISOString());
      }

      // Log the request URL for debugging
      console.log(`Fetching events from: /api/calendar/events?${searchParams.toString()}`);
      
      const response = await fetch(`/api/calendar/events?${searchParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        logger.error("API response not OK:", data);
        throw new Error(data.error || "Failed to fetch events");
      }

      if (data.success) {

        setEvents(data.data);
      } else {
        logger.error("API response indicated failure:", data);
        throw new Error(data.error || "Failed to fetch events");
      }
    } catch (error: any) {
      logger.error("Error fetching events:", error);
      setError(error instanceof Error ? error.message : "Failed to load calendar events");
      handleCalendarError(error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDateSelect = (date: Date) => {

    setSelectedDate(date);
    setIsNewEventOpen(true);
  };

  const handleEventMove = async (eventId: string, newDate: Date) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: newDate }),
      });

      if (!response.ok) throw new Error("Failed to update event");

      toast.success("Event moved successfully");
      fetchEvents();
    } catch (error: any) {
      handleCalendarError(error);
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleEventEdit = () => {
    setIsEditOpen(true);
  };

  const handleEventDelete = () => {
    fetchEvents();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={fetchEvents} />;
  }

  return (
    <>
      <OptimizedCalendar
        events={events}
        filters={filters}
        onEventMove={handleEventMove}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate || new Date()}
        onEventClick={handleEventClick}
      />

      <NewEventDialog
        open={isNewEventOpen}
        onClose={() => {
          setIsNewEventOpen(false);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
        userId={userId}
        onEventCreated={fetchEvents}
      />

      {selectedEvent && (
        <>
          <EventDetailsDialog
            event={selectedEvent}
            open={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            onEdit={handleEventEdit}
            onDelete={handleEventDelete}
          />

          <EditEventDialog
            event={selectedEvent}
            open={isEditOpen}
            onClose={() => {
              setIsEditOpen(false);
              setSelectedEvent(null);
            }}
            onEventUpdated={fetchEvents}
          />
        </>
      )}
    </>
  );
}; 