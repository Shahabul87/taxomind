"use client";

/**
 * VoiceRecorder
 *
 * High-quality voice recording component with real-time waveform visualization
 * and transcription capabilities.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Trash2,
  Send,
  Volume2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onTranscript?: (text: string) => void;
  maxDuration?: number; // seconds
  isProcessing?: boolean;
  transcriptText?: string;
  className?: string;
}

type RecordingState = "idle" | "recording" | "paused" | "recorded" | "playing";

export function VoiceRecorder({
  onRecordingComplete,
  onTranscript,
  maxDuration = 300, // 5 minutes default
  isProcessing = false,
  transcriptText,
  className,
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(32).fill(0));
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRecordingRef = useRef<() => void>(() => {});

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Update visualizer
  const updateVisualizer = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Take 32 samples from the frequency data
    const samples = [];
    const step = Math.floor(dataArray.length / 32);
    for (let i = 0; i < 32; i++) {
      samples.push(dataArray[i * step] / 255);
    }
    setVisualizerData(samples);

    // Calculate overall volume
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setVolume(avg / 255);

    if (recordingState === "recording") {
      animationRef.current = requestAnimationFrame(updateVisualizer);
    }
  }, [recordingState]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingState("recorded");
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingState("recording");
      setPermissionDenied(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecordingRef.current();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start visualizer
      animationRef.current = requestAnimationFrame(updateVisualizer);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setPermissionDenied(true);
    }
  }, [maxDuration, updateVisualizer]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setVisualizerData(new Array(32).fill(0));
    setVolume(0);
  }, []);

  // Keep stopRecording ref in sync for use in timer callback
  stopRecordingRef.current = stopRecording;

  // Play recorded audio
  const playAudio = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setRecordingState("recorded");
    }

    audioRef.current.play();
    setRecordingState("playing");
  }, [audioUrl]);

  // Pause playback
  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setRecordingState("recorded");
    }
  }, []);

  // Reset everything
  const resetRecording = useCallback(() => {
    stopRecording();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setRecordingState("idle");
  }, [audioUrl, stopRecording]);

  // Submit recording
  const submitRecording = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
    }
  }, [audioBlob, duration, onRecordingComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioUrl]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Recording Area */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 border border-slate-700/50">
        {/* Waveform Visualizer */}
        <div className="mb-6 flex items-center justify-center gap-[2px] h-16">
          {visualizerData.map((value, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-1.5 rounded-full",
                recordingState === "recording"
                  ? "bg-gradient-to-t from-rose-500 to-rose-400"
                  : "bg-slate-600"
              )}
              animate={{
                height: recordingState === "recording" ? Math.max(4, value * 64) : 4,
              }}
              transition={{ duration: 0.05 }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <motion.div
            className={cn(
              "text-4xl font-mono tracking-wider",
              recordingState === "recording" ? "text-rose-400" : "text-slate-300"
            )}
            animate={{
              opacity: recordingState === "recording" ? [1, 0.5, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: recordingState === "recording" ? Infinity : 0,
            }}
          >
            {formatTime(duration)}
          </motion.div>
          <p className="text-xs text-slate-500 mt-1">
            Max {formatTime(maxDuration)}
          </p>
        </div>

        {/* Progress Bar */}
        {recordingState === "recording" && (
          <div className="mb-6">
            <Progress
              value={(duration / maxDuration) * 100}
              className="h-1 bg-slate-700"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <AnimatePresence mode="wait">
            {recordingState === "idle" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        onClick={startRecording}
                        className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 shadow-lg shadow-rose-500/25"
                      >
                        <Mic className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Start Recording</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )}

            {recordingState === "recording" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-4"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        onClick={stopRecording}
                        className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600"
                      >
                        <Square className="h-5 w-5 fill-current" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop Recording</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Volume Indicator */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
                  <Volume2 className="h-4 w-4 text-slate-400" />
                  <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                      animate={{ width: `${volume * 100}%` }}
                      transition={{ duration: 0.05 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {recordingState === "recorded" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-3"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={resetRecording}
                        className="h-12 w-12 rounded-full border-slate-600 hover:bg-slate-700"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Record Again</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={playAudio}
                        className="h-12 w-12 rounded-full border-slate-600 hover:bg-slate-700"
                      >
                        <Play className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Play Recording</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        onClick={submitRecording}
                        disabled={isProcessing}
                        className="h-14 px-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <Send className="h-5 w-5 mr-2" />
                        )}
                        {isProcessing ? "Processing..." : "Send"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send for Transcription</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )}

            {recordingState === "playing" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-3"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={pauseAudio}
                        className="h-12 w-12 rounded-full border-slate-600 hover:bg-slate-700"
                      >
                        <Pause className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Pause</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Permission Denied Warning */}
        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2"
          >
            <MicOff className="h-4 w-4 text-rose-400" />
            <p className="text-sm text-rose-300">
              Microphone access denied. Please enable it in your browser settings.
            </p>
          </motion.div>
        )}
      </div>

      {/* Transcript Display */}
      <AnimatePresence>
        {transcriptText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Transcription</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{transcriptText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
