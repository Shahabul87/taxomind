import { CalendarDemo } from "@/app/components/calendar";

export default function CalendarDemoPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Calendar Component Demo</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <CalendarDemo />
      </div>
    </div>
  );
} 