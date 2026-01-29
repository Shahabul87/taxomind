"use client";

import { useState, useRef, useEffect } from "react";

import { useRouter } from "next/navigation";

import axios from "axios";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { useConfettiStore } from "@/hooks/use-confetti-store";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  courseId: string;
  chapterId: string;
  nextChapterId?: string;
  isLocked: boolean;
  completeOnEnd: boolean;
  title: string;
};

export const VideoPlayer = ({
  videoUrl,
  courseId,
  chapterId,
  nextChapterId,
  isLocked,
  completeOnEnd,
  title,
}: VideoPlayerProps): JSX.Element => {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const confetti = useConfettiStore();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onEnd = async (): Promise<void> => {
    try {
      if (completeOnEnd) {
        await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
          isCompleted: true,
        });

        // Prevent state updates after unmount
        if (!isMountedRef.current) return;

        if (!nextChapterId) {
          confetti.onOpen();
        }

        toast.success("Progress updated");
        router.refresh();

        if (nextChapterId) {
          router.push(`/courses/${courseId}/chapters/${nextChapterId}`)
        }
      }
    } catch {
      if (!isMountedRef.current) return;
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="relative aspect-video">
      {!isReady && !isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      )}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 flex-col gap-y-2 text-secondary">
          <Lock className="h-8 w-8" />
          <p className="text-sm">
            This chapter is locked
          </p>
        </div>
      )}
      {!isLocked && (
        <video
          title={title}
          className={cn(
            "w-full h-full",
            !isReady && "hidden"
          )}
          onCanPlay={() => setIsReady(true)}
          onEnded={() => { onEnd().catch(() => {}); }}
          autoPlay
          controls
          src={videoUrl}
        />
      )}
    </div>
  )
}