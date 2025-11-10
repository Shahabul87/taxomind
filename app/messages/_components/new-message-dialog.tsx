"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, GraduationCap, X, BookOpen, Users, ChevronLeft, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onChatStart?: (recipientIds: string[]) => void;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Course {
  id: string;
  title: string;
  imageUrl: string | null;
  role: "STUDENT" | "INSTRUCTOR";
  instructor: User;
  participants: User[];
}

interface CoursesData {
  enrolledCourses: Course[];
  createdCourses: Course[];
  total: number;
}

type Step = "courses" | "participants";

export const NewMessageDialog = ({ open, onClose, userId, onChatStart }: NewMessageDialogProps) => {
  const [step, setStep] = useState<Step>("courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [courses, setCourses] = useState<CoursesData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCourses();
      // Reset state when dialog opens
      setStep("courses");
      setSelectedCourse(null);
      setSelectedParticipants([]);
      setSearchQuery("");
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/messages/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const allCourses = courses
    ? [...courses.enrolledCourses, ...courses.createdCourses]
    : [];

  const filteredCourses = allCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParticipants = selectedCourse?.participants.filter(
    (participant) =>
      participant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setSearchQuery("");
    setStep("participants");
  };

  const handleParticipantToggle = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleStartChat = () => {
    if (selectedParticipants.length > 0 && onChatStart) {
      // Notify parent component to open the chat
      onChatStart(selectedParticipants);
    }
  };

  const handleBack = () => {
    setStep("courses");
    setSelectedCourse(null);
    setSelectedParticipants([]);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm
                                border-slate-200 dark:border-slate-700 max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            {step === "participants" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mr-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              {step === "courses" ? (
                <BookOpen className="w-5 h-5 text-white" />
              ) : (
                <Users className="w-5 h-5 text-white" />
              )}
            </div>
            {step === "courses" ? "Select a Course" : selectedCourse?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Participants Summary */}
          {step === "participants" && selectedParticipants.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20
                          dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedParticipants.length} {selectedParticipants.length === 1 ? "person" : "people"} selected
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedParticipants([])}
                  className="h-7 text-xs"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={step === "courses" ? "Search courses..." : "Search participants..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700
                       text-slate-900 dark:text-white"
            />
          </div>

          {/* Content */}
          <ScrollArea className="h-[400px] pr-4">
            {step === "courses" ? (
              // STEP 1: Course Selection
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Loading courses...
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No courses found</p>
                    <p className="text-sm">Enroll in a course to start messaging</p>
                  </div>
                ) : (
                  <>
                    {/* Enrolled Courses */}
                    {courses?.enrolledCourses && courses.enrolledCourses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          My Courses ({courses.enrolledCourses.length})
                        </h3>
                        <div className="space-y-2">
                          {courses.enrolledCourses
                            .filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((course) => (
                              <CourseCard
                                key={course.id}
                                course={course}
                                onClick={() => handleCourseSelect(course)}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Created Courses */}
                    {courses?.createdCourses && courses.createdCourses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Teaching ({courses.createdCourses.length})
                        </h3>
                        <div className="space-y-2">
                          {courses.createdCourses
                            .filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((course) => (
                              <CourseCard
                                key={course.id}
                                course={course}
                                onClick={() => handleCourseSelect(course)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // STEP 2: Participant Selection
              <div className="space-y-2">
                {filteredParticipants.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No participants found</p>
                    <p className="text-sm">No one to message in this course yet</p>
                  </div>
                ) : (
                  filteredParticipants.map((participant) => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      isInstructor={selectedCourse?.instructor.id === participant.id}
                      isSelected={selectedParticipants.includes(participant.id)}
                      onToggle={() => handleParticipantToggle(participant.id)}
                    />
                  ))
                )}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                       hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            {step === "participants" && (
              <Button
                disabled={selectedParticipants.length === 0}
                onClick={handleStartChat}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600
                         hover:to-indigo-600 text-white shadow-md disabled:opacity-50"
              >
                Start Chat ({selectedParticipants.length})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Course Card Component
interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

const CourseCard = ({ course, onClick }: CourseCardProps) => (
  <div
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all
              bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50
              border border-slate-200 dark:border-slate-700 hover:border-blue-200
              dark:hover:border-blue-800 hover:shadow-md group"
  >
    {/* Course Image */}
    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50">
      {course.imageUrl ? (
        <Image
          src={course.imageUrl}
          alt={course.title}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-blue-500" />
        </div>
      )}
    </div>

    {/* Course Info */}
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {course.title}
      </h4>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
          Instructor: {course.instructor.name}
        </p>
        <Badge
          variant="outline"
          className="text-xs"
        >
          {course.participants.length} {course.participants.length === 1 ? "person" : "people"}
        </Badge>
      </div>
    </div>

    {/* Role Badge */}
    <Badge className={
      course.role === "INSTRUCTOR"
        ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
        : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
    }>
      {course.role === "INSTRUCTOR" ? "Teaching" : "Enrolled"}
    </Badge>
  </div>
);

// Participant Card Component
interface ParticipantCardProps {
  participant: User;
  isInstructor: boolean;
  isSelected: boolean;
  onToggle: () => void;
}

const ParticipantCard = ({ participant, isInstructor, isSelected, onToggle }: ParticipantCardProps) => (
  <div
    onClick={onToggle}
    className={`
      flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
      ${isSelected
        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800"
        : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700"
      }
    `}
  >
    <Checkbox
      checked={isSelected}
      onCheckedChange={onToggle}
      className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
    />

    <div className="relative">
      <Avatar className="w-12 h-12">
        <AvatarImage src={participant.image || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          {participant.name?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      {isInstructor && (
        <div className="absolute -top-1 -left-1 bg-gradient-to-r from-yellow-500 to-amber-500
                      rounded-full p-1">
          <GraduationCap className="w-3 h-3 text-white" />
        </div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-slate-900 dark:text-white truncate">
        {participant.name || "Unknown User"}
      </h4>
      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
        {participant.email}
      </p>
    </div>

    {isInstructor && (
      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
        Instructor
      </Badge>
    )}

    {isSelected && (
      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
        <Check className="w-4 h-4 text-white" />
      </div>
    )}
  </div>
);
