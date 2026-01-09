"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, Video, Calendar as CalendarViewIcon, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewEventDialog } from "./new-event-dialog";
import { format, isFuture, isPast, isToday, parseISO, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { logger } from '@/lib/logger';

interface EventsProps {
  group: any;
  currentUser: any;
  isGroupMember: boolean;
}

// Example event structure (replace with actual API calls)
interface GroupEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  isOnline: boolean;
  organizerId: string;
  attendees: { id: string; userId: string; name: string; image?: string }[];
  createdAt: string;
}

export const Events = ({ group, currentUser, isGroupMember }: EventsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<"calendar" | "list" | "grid">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch events (mock data for now)
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call
      const mockEvents: GroupEvent[] = [
        {
          id: "1",
          title: "Weekly Study Session",
          description: "Join us for our regular study session covering recent topics.",
          date: "2024-04-22",
          startTime: "18:00",
          endTime: "20:00",
          location: "Online",
          isOnline: true,
          organizerId: group.creator.id,
          attendees: [
            { id: "1", userId: group.creator.id, name: group.creator.name, image: group.creator.image },
            { id: "2", userId: currentUser.id, name: currentUser.name, image: currentUser.image },
          ],
          createdAt: "2024-04-15T10:00:00Z",
        },
        {
          id: "2",
          title: "Group Project Meeting",
          description: "Discussion about the upcoming group project.",
          date: "2024-04-25",
          startTime: "14:00",
          endTime: "15:30",
          location: "Library Room 202",
          isOnline: false,
          organizerId: currentUser.id,
          attendees: [
            { id: "1", userId: group.creator.id, name: group.creator.name, image: group.creator.image },
            { id: "2", userId: currentUser.id, name: currentUser.name, image: currentUser.image },
          ],
          createdAt: "2024-04-16T14:20:00Z",
        },
      ];
      
      // Add future events
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      
      mockEvents.push({
        id: "3",
        title: "End of Term Celebration",
        description: "Let's celebrate our accomplishments this term!",
        date: format(nextMonthDate, "yyyy-MM-dd"),
        startTime: "19:00",
        endTime: "22:00",
        location: "Student Center",
        isOnline: false,
        organizerId: group.creator.id,
        attendees: [
          { id: "1", userId: group.creator.id, name: group.creator.name, image: group.creator.image },
        ],
        createdAt: "2024-04-10T09:30:00Z",
      });
      
      setEvents(mockEvents);
    } catch (error: any) {
      logger.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [group.creator.id, group.creator.image, group.creator.name, currentUser.id, currentUser.image, currentUser.name]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    
    return events.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  // Group events by upcoming and past
  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter(event => isFuture(new Date(`${event.date}T${event.startTime}`)));
  }, [filteredEvents]);
  
  const pastEvents = useMemo(() => {
    return filteredEvents.filter(event => isPast(new Date(`${event.date}T${event.endTime}`)));
  }, [filteredEvents]);

  // Calendar view helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);
  
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => {
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
  
  // Determine if the user is attending an event
  const isAttending = (event: GroupEvent) => {
    return event.attendees.some(attendee => attendee.userId === currentUser.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Group Events</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Plan and manage events with your group members</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-64">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-3 py-2 h-9"
            />
          </div>
          
          <Tabs defaultValue={viewType} onValueChange={(v) => setViewType(v as any)} className="w-auto">
            <TabsList className="bg-gray-100 dark:bg-gray-800 h-9 p-1">
              <TabsTrigger value="calendar" className="h-7 px-3">
                <CalendarViewIcon className="w-4 h-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="h-7 px-3">
                <List className="w-4 h-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="grid" className="h-7 px-3">
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grid
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {isGroupMember && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      {/* Calendar View */}
      {viewType === "calendar" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                    {isGroupMember && isCurrentMonth && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 rounded-full opacity-0 hover:opacity-100"
                        onClick={() => {
                          setIsDialogOpen(true);
                          // Pass the selected date
                        }}
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
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
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
      )}
      
      {/* List View */}
      {viewType === "list" && (
        <div className="space-y-6">
          {/* Upcoming events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Upcoming Events
              </h3>
            </div>
            
            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <h3 className="text-gray-500 dark:text-gray-400 font-medium">No upcoming events</h3>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  {isGroupMember ? "Create your first event to get started!" : "Check back later for group events."}
                </p>
                
                {isGroupMember && (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="mt-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Date column */}
                      <div className="md:w-32 flex-shrink-0">
                        <div className="flex flex-col items-center px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {format(parseISO(event.date), "EEE")}
                          </span>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {format(parseISO(event.date), "d")}
                          </span>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {format(parseISO(event.date), "MMM")}
                          </span>
                        </div>
                      </div>
                      
                      {/* Event details */}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{event.title}</h4>
                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{event.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" />
                            <span>{event.startTime} - {event.endTime}</span>
                          </div>
                          
                          <div className="flex items-center">
                            {event.isOnline ? (
                              <>
                                <Video className="w-4 h-4 mr-1.5" />
                                <span>{event.location || "Online"}</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4 mr-1.5" />
                                <span>{event.location}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span>{event.attendees.length} attendees</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        {isAttending(event) ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                            Attending
                          </Badge>
                        ) : isGroupMember && (
                          <Button variant="outline" size="sm">
                            RSVP
                          </Button>
                        )}
                        
                        {event.organizerId === currentUser.id && (
                          <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                            Edit Event
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Past events */}
          {pastEvents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                  Past Events
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {pastEvents.map((event) => (
                  <div key={event.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Date column */}
                      <div className="md:w-32 flex-shrink-0">
                        <div className="flex flex-col items-center px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center opacity-75">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {format(parseISO(event.date), "EEE")}
                          </span>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {format(parseISO(event.date), "d")}
                          </span>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {format(parseISO(event.date), "MMM")}
                          </span>
                        </div>
                      </div>
                      
                      {/* Event details */}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">{event.title}</h4>
                        {event.description && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{event.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" />
                            <span>{event.startTime} - {event.endTime}</span>
                          </div>
                          
                          <div className="flex items-center">
                            {event.isOnline ? (
                              <>
                                <Video className="w-4 h-4 mr-1.5" />
                                <span>{event.location || "Online"}</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4 mr-1.5" />
                                <span>{event.location}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span>{event.attendees.length} attended</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Grid View */}
      {viewType === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Upcoming events */}
          {filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="max-w-md mx-auto">
                <CalendarIcon className="w-16 h-16 mx-auto mb-6 text-indigo-300 dark:text-indigo-700" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No events found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchQuery 
                    ? "Try adjusting your search criteria."
                    : "There are no events scheduled in this group yet."}
                </p>
                
                {isGroupMember && (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </div>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div 
                key={event.id}
                className={cn(
                  "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden",
                  "hover:shadow-md transition-shadow duration-200",
                  isPast(new Date(`${event.date}T${event.endTime}`)) && "opacity-75"
                )}
              >
                <div className={cn(
                  "p-3 text-white font-medium flex justify-between items-center",
                  isPast(new Date(`${event.date}T${event.endTime}`))
                    ? "bg-gray-500 dark:bg-gray-700"
                    : event.isOnline
                      ? "bg-indigo-600 dark:bg-indigo-700"
                      : "bg-emerald-600 dark:bg-emerald-700"
                )}>
                  <div className="flex items-center gap-2">
                    {event.isOnline ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    <span>
                      {format(parseISO(event.date), "EEE, MMM d")} • {event.startTime}
                    </span>
                  </div>
                  
                  {isAttending(event) && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                      Attending
                    </Badge>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {event.title}
                  </h3>
                  
                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      {event.isOnline ? (
                        <>
                          <Video className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{event.location || "Online Meeting"}</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {event.attendees.slice(0, 3).map((attendee) => (
                          <Avatar key={attendee.id} className="h-7 w-7 border-2 border-white dark:border-gray-800">
                            <AvatarImage src={attendee.image} />
                            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                              {attendee.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        
                        {event.attendees.length > 3 && (
                          <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800">
                            +{event.attendees.length - 3}
                          </div>
                        )}
                      </div>
                      
                      {isGroupMember && !isPast(new Date(`${event.date}T${event.startTime}`)) && !isAttending(event) && (
                        <Button size="sm" variant="outline">
                          RSVP
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <NewEventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        groupId={group.id}
        currentUser={currentUser}
        onSuccess={() => {
          setIsDialogOpen(false);
          fetchEvents(); // Refresh events after creation
        }}
      />
    </motion.div>
  );
}; 