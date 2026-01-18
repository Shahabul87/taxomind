"use client";

/**
 * MultimodalInputPanel
 *
 * Unified multimodal input interface supporting voice, image, handwriting,
 * and PDF document inputs with AI processing.
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mic,
  ImageIcon,
  PenTool,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  RotateCcw,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useMultimodal } from "@sam-ai/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageUploader } from "./ImageUploader";
import { HandwritingCanvas } from "./HandwritingCanvas";
import { PDFUploader } from "./PDFUploader";

export interface MultimodalInputPanelProps {
  courseId?: string;
  onInputProcessed?: (result: ProcessedResult) => void;
  onError?: (error: string) => void;
  enabledModes?: Array<"voice" | "image" | "handwriting" | "pdf">;
  defaultMode?: "voice" | "image" | "handwriting" | "pdf";
  showSettings?: boolean;
  compact?: boolean;
  className?: string;
}

export interface ProcessedResult {
  type: "voice" | "image" | "handwriting" | "pdf";
  text?: string;
  analysis?: {
    type: string;
    description: string;
    confidence: number;
  };
  summary?: string;
  originalFile?: {
    name: string;
    size: number;
    mimeType: string;
  };
}

type InputMode = "voice" | "image" | "handwriting" | "pdf";

const MODE_CONFIG: Record<
  InputMode,
  {
    icon: typeof Mic;
    label: string;
    description: string;
    color: string;
    gradient: string;
  }
> = {
  voice: {
    icon: Mic,
    label: "Voice",
    description: "Record your question or explanation",
    color: "rose",
    gradient: "from-rose-500 to-pink-500",
  },
  image: {
    icon: ImageIcon,
    label: "Image",
    description: "Upload an image for analysis or OCR",
    color: "violet",
    gradient: "from-violet-500 to-purple-500",
  },
  handwriting: {
    icon: PenTool,
    label: "Handwriting",
    description: "Write or draw for recognition",
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
  },
  pdf: {
    icon: FileText,
    label: "Document",
    description: "Upload a PDF for text extraction",
    color: "amber",
    gradient: "from-amber-500 to-orange-500",
  },
};

export function MultimodalInputPanel({
  courseId,
  onInputProcessed,
  onError,
  enabledModes = ["voice", "image", "handwriting", "pdf"],
  defaultMode = "voice",
  showSettings = true,
  compact = false,
  className,
}: MultimodalInputPanelProps) {
  const [activeMode, setActiveMode] = useState<InputMode>(defaultMode);
  const [showHelp, setShowHelp] = useState(false);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);

  // Processing options
  const [options, setOptions] = useState({
    enableOCR: true,
    enableSpeechToText: true,
    enableHandwritingRecognition: true,
    generateAccessibilityData: true,
  });

  // Use the multimodal hook
  const {
    isProcessing,
    error: hookError,
    processInput,
    extractText,
    fileToBase64,
    reset,
  } = useMultimodal({
    courseId,
    defaultOptions: options,
    onProcessingComplete: (result) => {
      const processed: ProcessedResult = {
        type: activeMode,
        text: result.extractedText?.text,
        analysis: result.analysis
          ? {
              type: result.analysis.type,
              description: result.analysis.content,
              confidence: result.analysis.confidence,
            }
          : undefined,
        originalFile: result.originalFile
          ? {
              name: result.originalFile.name,
              size: result.originalFile.size,
              mimeType: result.originalFile.mimeType,
            }
          : undefined,
      };
      setProcessedResult(processed);
      onInputProcessed?.(processed);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  // Handle voice recording complete
  const handleVoiceComplete = useCallback(
    async (audioBlob: Blob, duration: number) => {
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: "audio/webm",
      });
      const multimodalFile = await fileToBase64(file);
      await processInput(multimodalFile, { enableSpeechToText: true }, "VOICE");
    },
    [fileToBase64, processInput]
  );

  // Handle image selected
  const handleImageSelected = useCallback(
    async (file: File) => {
      const multimodalFile = await fileToBase64(file);
      await processInput(multimodalFile, { enableOCR: options.enableOCR }, "IMAGE");
    },
    [fileToBase64, processInput, options.enableOCR]
  );

  // Handle handwriting submit
  const handleHandwritingSubmit = useCallback(
    async (imageBlob: Blob) => {
      const file = new File([imageBlob], `handwriting-${Date.now()}.png`, {
        type: "image/png",
      });
      const multimodalFile = await fileToBase64(file);
      await processInput(
        multimodalFile,
        { enableHandwritingRecognition: true },
        "HANDWRITING"
      );
    },
    [fileToBase64, processInput]
  );

  // Handle PDF selected
  const handlePDFSelected = useCallback(
    async (file: File) => {
      const multimodalFile = await fileToBase64(file);
      await processInput(multimodalFile, { enableOCR: true }, "DOCUMENT");
    },
    [fileToBase64, processInput]
  );

  // Reset the panel
  const handleReset = useCallback(() => {
    reset();
    setProcessedResult(null);
  }, [reset]);

  // Filter enabled modes
  const availableModes = useMemo(
    () => enabledModes.filter((mode) => MODE_CONFIG[mode]),
    [enabledModes]
  );

  const currentConfig = MODE_CONFIG[activeMode];
  const Icon = currentConfig.icon;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Mode Tabs */}
      <div className="flex items-center justify-between">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50">
          {availableModes.map((mode) => {
            const config = MODE_CONFIG[mode];
            const ModeIcon = config.icon;
            const isActive = activeMode === mode;

            return (
              <TooltipProvider key={mode}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setActiveMode(mode);
                        handleReset();
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                        isActive
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      )}
                    >
                      <ModeIcon className="h-4 w-4" />
                      {!compact && (
                        <span className="text-sm font-medium">{config.label}</span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{config.description}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showSettings && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-slate-800 border-slate-700">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white">Processing Options</h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ocr" className="text-sm text-slate-300">
                        Enable OCR
                      </Label>
                      <Switch
                        id="ocr"
                        checked={options.enableOCR}
                        onCheckedChange={(checked) =>
                          setOptions((prev) => ({ ...prev, enableOCR: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="stt" className="text-sm text-slate-300">
                        Speech to Text
                      </Label>
                      <Switch
                        id="stt"
                        checked={options.enableSpeechToText}
                        onCheckedChange={(checked) =>
                          setOptions((prev) => ({ ...prev, enableSpeechToText: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="hwr" className="text-sm text-slate-300">
                        Handwriting Recognition
                      </Label>
                      <Switch
                        id="hwr"
                        checked={options.enableHandwritingRecognition}
                        onCheckedChange={(checked) =>
                          setOptions((prev) => ({
                            ...prev,
                            enableHandwritingRecognition: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="a11y" className="text-sm text-slate-300">
                        Generate Accessibility Data
                      </Label>
                      <Switch
                        id="a11y"
                        checked={options.generateAccessibilityData}
                        onCheckedChange={(checked) =>
                          setOptions((prev) => ({
                            ...prev,
                            generateAccessibilityData: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHelp(true)}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {processedResult && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    className="h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Mode Description */}
      <div className="flex items-center gap-2 px-1">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            `bg-${currentConfig.color}-500`
          )}
          style={{
            backgroundColor:
              currentConfig.color === "rose"
                ? "#f43f5e"
                : currentConfig.color === "violet"
                  ? "#8b5cf6"
                  : currentConfig.color === "blue"
                    ? "#3b82f6"
                    : "#f59e0b",
          }}
        />
        <p className="text-sm text-slate-400">{currentConfig.description}</p>
      </div>

      {/* Input Components */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeMode === "voice" && (
            <VoiceRecorder
              onRecordingComplete={handleVoiceComplete}
              isProcessing={isProcessing}
              transcriptText={processedResult?.text}
            />
          )}

          {activeMode === "image" && (
            <ImageUploader
              onImageSelected={handleImageSelected}
              onImageRemoved={handleReset}
              isProcessing={isProcessing}
              extractedText={processedResult?.text}
              analysisResult={processedResult?.analysis}
            />
          )}

          {activeMode === "handwriting" && (
            <HandwritingCanvas
              onCanvasSubmit={handleHandwritingSubmit}
              isProcessing={isProcessing}
              recognizedText={processedResult?.text}
            />
          )}

          {activeMode === "pdf" && (
            <PDFUploader
              onPDFSelected={handlePDFSelected}
              onPDFRemoved={handleReset}
              isProcessing={isProcessing}
              extractedText={processedResult?.text}
              summary={processedResult?.summary}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {hookError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-300">Processing Error</p>
              <p className="text-sm text-rose-300/70 mt-0.5">{hookError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="ml-auto text-rose-400 hover:text-rose-300"
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              Multimodal Input Guide
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Learn how to use different input modes with SAM AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {Object.entries(MODE_CONFIG).map(([mode, config]) => {
              const ModeIcon = config.icon;
              return (
                <div
                  key={mode}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                        config.gradient
                      )}
                    >
                      <ModeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{config.label}</h4>
                      <p className="text-xs text-slate-400">{config.description}</p>
                    </div>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-1 ml-13">
                    {mode === "voice" && (
                      <>
                        <li>• Record questions or explanations</li>
                        <li>• Automatic speech-to-text transcription</li>
                        <li>• Max 5 minute recordings</li>
                      </>
                    )}
                    {mode === "image" && (
                      <>
                        <li>• Upload photos of problems or diagrams</li>
                        <li>• OCR extracts text from images</li>
                        <li>• AI analyzes visual content</li>
                      </>
                    )}
                    {mode === "handwriting" && (
                      <>
                        <li>• Write math equations or notes</li>
                        <li>• Draw diagrams for analysis</li>
                        <li>• Touch-friendly canvas</li>
                      </>
                    )}
                    {mode === "pdf" && (
                      <>
                        <li>• Upload PDF documents</li>
                        <li>• Extract text and generate summaries</li>
                        <li>• Works with scanned documents (OCR)</li>
                      </>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
