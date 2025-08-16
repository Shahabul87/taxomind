"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeInput, setTimeInput] = useState(
    value ? format(value, "HH:mm") : "12:00"
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = timeInput.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      onChange?.(newDate);
    } else {
      onChange?.(null);
    }
  };

  const handleTimeChange = (time: string) => {
    setTimeInput(time);
    if (value) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange?.(newDate);
    }
  };

  const handleClear = () => {
    onChange?.(null);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP 'at' HH:mm") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Time:</label>
            <Input
              type="time"
              value={timeInput}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}