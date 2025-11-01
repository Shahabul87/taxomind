"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

interface PresentationModeProps {
  chapters: Chapter[];
}

export default function PresentationMode({ chapters }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const chapter = chapters[currentSlide];

  const nextSlide = () => {
    if (currentSlide < chapters.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full flex items-center justify-center p-8"
        >
          <div className="max-w-6xl w-full h-full flex flex-col">
            {chapter.imageUrl ? (
              <div className="flex-1 relative rounded-xl overflow-hidden mb-8">
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            ) : null}

            <div className={chapter.imageUrl ? "max-h-1/3" : "flex-1 flex items-center justify-center"}>
              <div className="text-center">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  {chapter.title}
                </h2>
                {chapter.content || chapter.description ? (
                  <div
                    className="prose prose-lg prose-invert max-w-4xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: ((chapter.content || chapter.description || '').slice(0, 300) + "...") }}
                  />
                ) : (
                  <div className="bg-yellow-50/10 border border-yellow-200/30 rounded-lg p-4 max-w-2xl mx-auto">
                    <p className="text-yellow-200 text-sm">
                      ⚠️ No content available for this slide.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prevSlide}
        disabled={currentSlide === 0}
        className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full disabled:opacity-30 transition-all"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={nextSlide}
        disabled={currentSlide === chapters.length - 1}
        className="absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full disabled:opacity-30 transition-all"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {chapters.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/40"
            }`}
          />
        ))}
      </div>

      <div className="absolute top-8 right-8 text-white/60 text-sm">
        {currentSlide + 1} / {chapters.length}
      </div>
    </div>
  );
}
