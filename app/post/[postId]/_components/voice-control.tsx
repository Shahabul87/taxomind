"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// TypeScript interface for SpeechRecognition API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

interface VoiceControlProps {
  onCommand?: (command: string) => void;
  enableTTS?: boolean;
}

type VoiceCommand = {
  pattern: RegExp;
  action: () => void;
  description: string;
};

export function VoiceControl({ onCommand, enableTTS = false }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Process voice commands
  const processCommand = useCallback(
    (text: string) => {
      console.log("Processing command:", text);

      // Helper: Check if element is in viewport
      const isInViewport = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
      };

      // Helper: Get visible content
      const getVisibleContent = (): string | null => {
        const article = document.querySelector("article");
        if (!article) return null;

        const paragraphs = article.querySelectorAll("p, h1, h2, h3, h4, h5, h6");
        const visibleText: string[] = [];

        paragraphs.forEach((p) => {
          if (isInViewport(p as HTMLElement)) {
            visibleText.push(p.textContent || "");
          }
        });

        return visibleText.join(" ");
      };

      // Define commands inline to avoid dependency issues
      const commandList: VoiceCommand[] = [
        {
          pattern: /scroll (up|down)/i,
          action: () => {
            const direction = text.includes("up") ? -300 : 300;
            window.scrollBy({ top: direction, behavior: "smooth" });
          },
          description: "Scroll up or down",
        },
        {
          pattern: /go to (top|bottom)/i,
          action: () => {
            const position = text.includes("top") ? 0 : document.body.scrollHeight;
            window.scrollTo({ top: position, behavior: "smooth" });
          },
          description: "Go to top or bottom of page",
        },
        {
          pattern: /next (chapter|section)/i,
          action: () => {
            const chapters = document.querySelectorAll("[data-chapter-index]");
            if (chapters.length > 0) {
              const current = Array.from(chapters).findIndex((el) =>
                isInViewport(el as HTMLElement)
              );
              const next = chapters[Math.min(current + 1, chapters.length - 1)];
              next?.scrollIntoView({ behavior: "smooth" });
            }
          },
          description: "Go to next chapter",
        },
        {
          pattern: /previous (chapter|section)/i,
          action: () => {
            const chapters = document.querySelectorAll("[data-chapter-index]");
            if (chapters.length > 0) {
              const current = Array.from(chapters).findIndex((el) =>
                isInViewport(el as HTMLElement)
              );
              const prev = chapters[Math.max(current - 1, 0)];
              prev?.scrollIntoView({ behavior: "smooth" });
            }
          },
          description: "Go to previous chapter",
        },
        {
          pattern: /read (this|aloud)/i,
          action: () => {
            const content = getVisibleContent();
            if (content) {
              speakText(content);
            }
          },
          description: "Read current content aloud",
        },
        {
          pattern: /stop (reading|speaking)/i,
          action: () => {
            stopSpeech();
          },
          description: "Stop reading",
        },
      ];

      for (const command of commandList) {
        if (command.pattern.test(text)) {
          command.action();
          onCommand?.(text);
          return;
        }
      }

      // If no command matched
      toast.info(`Command not recognized: "${text}"`);
    },
    [onCommand]
  );

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for speech recognition support
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("Voice recognition started");
        setIsListening(true);
      };

      recognition.onend = () => {
        console.log("Voice recognition ended");
        setIsListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          processCommand(transcriptText.toLowerCase());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        toast.error(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setIsSupported(true);
    }

    // Check for speech synthesis support
    if (window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [processCommand]);

  const toggleListening = () => {
    if (!isSupported) {
      toast.error("Voice recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      toast.success("Listening for voice commands...");
    }
  };

  const speakText = (text: string) => {
    if (!synthesisRef.current) {
      toast.error("Text-to-speech is not supported in your browser");
      return;
    }

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
    };

    synthesisRef.current.speak(utterance);
  };

  const stopSpeech = () => {
    synthesisRef.current?.cancel();
    setIsSpeaking(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-32 right-6 z-50 flex flex-col gap-2">
      {/* Voice Recognition Button */}
      <Button
        size="icon"
        variant={isListening ? "default" : "outline"}
        onClick={toggleListening}
        className={cn(
          "rounded-full shadow-lg transition-all",
          isListening && "animate-pulse bg-red-500 hover:bg-red-600"
        )}
        aria-label={isListening ? "Stop listening" : "Start voice control"}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>

      {/* Text-to-Speech Button */}
      {enableTTS && (
        <Button
          size="icon"
          variant={isSpeaking ? "default" : "outline"}
          onClick={() => {
            if (isSpeaking) {
              stopSpeech();
            } else {
              const article = document.querySelector("article");
              if (article) {
                const text = article.textContent || "";
                speakText(text.slice(0, 500)); // Speak first 500 chars
              }
            }
          }}
          className="rounded-full shadow-lg"
          aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      )}

      {/* Live transcript (for debugging) */}
      {isListening && transcript && (
        <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs">
          <p className="font-medium text-xs text-gray-500 dark:text-gray-400 mb-1">
            Listening...
          </p>
          <p className="text-gray-900 dark:text-gray-100">{transcript}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for Text-to-Speech functionality
 */
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string, options?: SpeechSynthesisUtterance) => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (options) {
      Object.assign(utterance, options);
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    synthesisRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    synthesisRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    synthesisRef.current?.resume();
  }, []);

  return { speak, stop, pause, resume, isSpeaking };
}
