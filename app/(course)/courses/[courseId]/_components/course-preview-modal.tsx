"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircle,
  X,
  Clock,
  BookOpen,
  Users,
  Award,
  ChevronRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface CoursePreviewModalProps {
  courseTitle: string;
  previewVideoUrl?: string;
  courseDuration?: number;
  totalChapters?: number;
  totalStudents?: number;
  courseHighlights?: string[];
  onEnroll?: () => void;
}

export const CoursePreviewModal = ({
  courseTitle,
  previewVideoUrl,
  courseDuration = 0,
  totalChapters = 0,
  totalStudents = 0,
  courseHighlights = [],
  onEnroll
}: CoursePreviewModalProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setIsPlaying(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsPlaying(false);
  };

  return (
    <>
      {/* Preview Button with Pulse Animation */}
      <motion.button
        onClick={handleOpen}
        className="group relative inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <PlayCircle className="w-6 h-6 relative z-10" />
        <span className="font-medium relative z-10">Preview This Course</span>
        <Sparkles className="w-4 h-4 text-yellow-400 relative z-10" />
      </motion.button>

      {/* Preview Modal */}
      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gray-900/95 backdrop-blur-xl border border-white/10">
              <DialogTitle className="sr-only">{courseTitle} Preview</DialogTitle>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative">
                {/* Video Section */}
                {previewVideoUrl ? (
                  <div className="aspect-video bg-black relative">
                    {!isPlaying ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.button
                          onClick={() => setIsPlaying(true)}
                          className="group p-6 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PlayCircle className="w-16 h-16 text-white" />
                        </motion.button>
                      </div>
                    ) : (
                      <iframe
                        src={`${previewVideoUrl}?autoplay=1`}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                      />
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <PlayCircle className="w-24 h-24 mx-auto mb-4 opacity-50" />
                      <p className="text-xl font-semibold">Preview Coming Soon</p>
                    </div>
                  </div>
                )}

                {/* Course Info Section */}
                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{courseTitle}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.floor(courseDuration / 60)}h {courseDuration % 60}m
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {totalChapters} chapters
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {totalStudents.toLocaleString()} students
                      </span>
                    </div>
                  </div>

                  {/* Course Highlights */}
                  {courseHighlights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        What You&apos;ll Learn
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {courseHighlights.slice(0, 4).map((highlight, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2 text-sm text-gray-300"
                          >
                            <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{highlight}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Section */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Ready to start learning?</p>
                      <p className="text-lg font-semibold text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-400" />
                        Certificate of Completion Included
                      </p>
                    </div>
                    {onEnroll && (
                      <motion.button
                        onClick={onEnroll}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Enroll Now
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};