"use client";

import { useState } from "react";
import { Calendar, CalendarEvent } from "./calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

export const CalendarDemo = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Team Meeting",
      date: "2024-04-22",
      startTime: "14:00",
      endTime: "15:30",
      isOnline: true
    },
    {
      id: "2",
      title: "Project Deadline",
      date: "2024-04-25",
      startTime: "09:00",
      endTime: "18:00",
      isOnline: false
    },
    {
      id: "3",
      title: "Training Session",
      date: "2024-05-10",
      startTime: "10:00",
      endTime: "12:00",
      isOnline: true,
      color: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    }
  ]);

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    isOnline: false
  });

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setIsAddEventOpen(true);
  };

  const handleCreateEvent = () => {
    if (!selectedDate || !newEvent.title) return;
    
    const event: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title,
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      isOnline: newEvent.isOnline
    };
    
    setEvents([...events, event]);
    setIsAddEventOpen(false);
    setNewEvent({
      title: "",
      startTime: "09:00",
      endTime: "10:00",
      isOnline: false
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  value={newEvent.title} 
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Enter event title"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  <span>{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input 
                    id="startTime" 
                    type="time" 
                    value={newEvent.startTime} 
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input 
                    id="endTime" 
                    type="time" 
                    value={newEvent.endTime} 
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={newEvent.isOnline}
                  onChange={(e) => setNewEvent({...newEvent, isOnline: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isOnline">Online Event</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent}>
                Create Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Calendar 
        events={events} 
        onAddEvent={handleAddEvent}
        canAddEvent={true}
      />
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
        <div className="space-y-2">
          {events.map(event => (
            <div 
              key={event.id} 
              className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-gray-500">
                    {event.date} • {event.startTime} - {event.endTime}
                  </p>
                </div>
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.isOnline
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  }`}>
                    {event.isOnline ? "Online" : "In-person"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 