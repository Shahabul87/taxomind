"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  GraduationCap,
  BookOpen,
  Users,
  ChevronLeft,
  Check,
  Sparkles,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
      <DialogContent className={cn(
        "max-w-2xl w-full p-0 overflow-hidden",
        "bg-[hsl(var(--msg-surface))]/95 backdrop-blur-xl",
        "border-[hsl(var(--msg-border))]",
        "shadow-2xl shadow-[hsl(var(--msg-primary))]/10"
      )}>
        {/* Premium Header */}
        <DialogHeader className="p-5 border-b border-[hsl(var(--msg-border-subtle))] msg-header-gradient">
          <DialogTitle className="flex items-center gap-3 text-white">
            <AnimatePresence mode="wait">
              {step === "participants" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              {step === "courses" ? (
                <BookOpen className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {step === "courses" ? "Select a Course" : selectedCourse?.title}
              </h3>
              <p className="text-sm text-white/70 font-normal">
                {step === "courses"
                  ? "Choose a course to start messaging"
                  : `${selectedCourse?.participants.length || 0} participants`}
              </p>
            </div>

            {step === "courses" && (
              <div className="flex items-center gap-1.5 text-sm text-white/80">
                <Sparkles className="w-4 h-4" />
                <span>{allCourses.length} courses</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Selected Participants Summary */}
          <AnimatePresence>
            {step === "participants" && selectedParticipants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={cn(
                  "p-3.5 rounded-xl",
                  "bg-gradient-to-r from-[hsl(var(--msg-primary-muted))] to-[hsl(var(--msg-cyan))]/10",
                  "border border-[hsl(var(--msg-primary))]/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--msg-primary))] flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-medium text-[hsl(var(--msg-text))]">
                      {selectedParticipants.length} {selectedParticipants.length === 1 ? "person" : "people"} selected
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedParticipants([])}
                    className="h-8 text-xs text-[hsl(var(--msg-text-muted))] hover:text-[hsl(var(--msg-rose))]"
                  >
                    Clear all
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--msg-text-subtle))]" />
            <Input
              placeholder={step === "courses" ? "Search courses..." : "Search participants..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-11 rounded-xl",
                "bg-[hsl(var(--msg-surface-hover))]",
                "border-[hsl(var(--msg-border))]",
                "text-[hsl(var(--msg-text))]",
                "placeholder:text-[hsl(var(--msg-text-subtle))]",
                "focus:border-[hsl(var(--msg-primary))]",
                "focus:ring-2 focus:ring-[hsl(var(--msg-primary))]/10"
              )}
            />
          </div>

          {/* Content */}
          <ScrollArea className="h-[400px] pr-4 msg-scrollbar">
            <AnimatePresence mode="wait">
              {step === "courses" ? (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 text-[hsl(var(--msg-primary))] animate-spin mb-3" />
                      <p className="text-sm text-[hsl(var(--msg-text-muted))]">Loading courses...</p>
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 msg-empty-state">
                      <div className="msg-empty-icon mb-4">
                        <BookOpen className="w-8 h-8 text-[hsl(var(--msg-primary))]" />
                      </div>
                      <h4 className="font-semibold text-[hsl(var(--msg-text))] mb-1">No courses found</h4>
                      <p className="text-sm text-[hsl(var(--msg-text-muted))] text-center max-w-[200px]">
                        Enroll in a course to start messaging
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Enrolled Courses */}
                      {courses?.enrolledCourses && courses.enrolledCourses.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-[hsl(var(--msg-text-subtle))] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            My Courses ({courses.enrolledCourses.length})
                          </h3>
                          <div className="space-y-2">
                            {courses.enrolledCourses
                              .filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((course, index) => (
                                <motion.div
                                  key={course.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <CourseCard
                                    course={course}
                                    onClick={() => handleCourseSelect(course)}
                                  />
                                </motion.div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Created Courses */}
                      {courses?.createdCourses && courses.createdCourses.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-[hsl(var(--msg-text-subtle))] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Teaching ({courses.createdCourses.length})
                          </h3>
                          <div className="space-y-2">
                            {courses.createdCourses
                              .filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((course, index) => (
                                <motion.div
                                  key={course.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <CourseCard
                                    course={course}
                                    onClick={() => handleCourseSelect(course)}
                                  />
                                </motion.div>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="participants"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  {filteredParticipants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 msg-empty-state">
                      <div className="msg-empty-icon mb-4">
                        <Users className="w-8 h-8 text-[hsl(var(--msg-primary))]" />
                      </div>
                      <h4 className="font-semibold text-[hsl(var(--msg-text))] mb-1">No participants found</h4>
                      <p className="text-sm text-[hsl(var(--msg-text-muted))] text-center max-w-[200px]">
                        No one to message in this course yet
                      </p>
                    </div>
                  ) : (
                    filteredParticipants.map((participant, index) => (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <ParticipantCard
                          participant={participant}
                          isInstructor={selectedCourse?.instructor.id === participant.id}
                          isSelected={selectedParticipants.includes(participant.id)}
                          onToggle={() => handleParticipantToggle(participant.id)}
                        />
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[hsl(var(--msg-border-subtle))]">
            <Button
              variant="outline"
              onClick={onClose}
              className={cn(
                "h-10 px-5 rounded-xl",
                "border-[hsl(var(--msg-border))]",
                "text-[hsl(var(--msg-text-muted))]",
                "hover:border-[hsl(var(--msg-text-muted))]",
                "hover:bg-[hsl(var(--msg-surface-hover))]"
              )}
            >
              Cancel
            </Button>
            {step === "participants" && (
              <Button
                disabled={selectedParticipants.length === 0}
                onClick={handleStartChat}
                className={cn(
                  "msg-send-btn h-10 px-6 rounded-xl",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
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
    className={cn(
      "msg-conversation-card group",
      "cursor-pointer"
    )}
  >
    <div className="flex items-center gap-4">
      {/* Course Image */}
      <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-[hsl(var(--msg-primary-muted))] to-[hsl(var(--msg-cyan))]/20">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[hsl(var(--msg-primary))]" />
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[hsl(var(--msg-text))] truncate group-hover:text-[hsl(var(--msg-primary))] transition-colors">
          {course.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-[hsl(var(--msg-text-muted))] truncate">
            {course.instructor.name}
          </p>
          <Badge
            variant="outline"
            className="text-[10px] border-[hsl(var(--msg-border))] text-[hsl(var(--msg-text-subtle))]"
          >
            {course.participants.length} {course.participants.length === 1 ? "person" : "people"}
          </Badge>
        </div>
      </div>

      {/* Role Badge */}
      <Badge className={cn(
        "h-6 px-2.5 text-[10px] font-semibold border-0",
        course.role === "INSTRUCTOR"
          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
          : "bg-gradient-to-r from-[hsl(var(--msg-primary))] to-[hsl(var(--msg-cyan))] text-white"
      )}>
        {course.role === "INSTRUCTOR" ? "Teaching" : "Enrolled"}
      </Badge>
    </div>
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
    className={cn(
      "flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200",
      isSelected
        ? "bg-gradient-to-r from-[hsl(var(--msg-primary-muted))] to-[hsl(var(--msg-cyan))]/10 border-2 border-[hsl(var(--msg-primary))]/30"
        : "msg-conversation-card"
    )}
  >
    <Checkbox
      checked={isSelected}
      onCheckedChange={onToggle}
      className={cn(
        "data-[state=checked]:bg-[hsl(var(--msg-primary))]",
        "data-[state=checked]:border-[hsl(var(--msg-primary))]"
      )}
    />

    <div className="relative msg-avatar-ring">
      <Avatar className="w-11 h-11">
        <AvatarImage src={participant.image || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--msg-primary))] to-[hsl(var(--msg-cyan))] text-white font-semibold">
          {participant.name?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      {isInstructor && (
        <div className="absolute -top-1 -left-1 p-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm">
          <GraduationCap className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-[hsl(var(--msg-text))] truncate">
        {participant.name || "Unknown User"}
      </h4>
      <p className="text-sm text-[hsl(var(--msg-text-muted))] truncate">
        {participant.email}
      </p>
    </div>

    {isInstructor && (
      <Badge className="h-5 px-2 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
        Instructor
      </Badge>
    )}

    <AnimatePresence>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="flex-shrink-0 w-6 h-6 bg-[hsl(var(--msg-primary))] rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
