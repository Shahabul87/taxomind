"use client";

/**
 * PDFUploader
 *
 * PDF document uploader with page preview, text extraction, and summarization.
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FileText,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  BookOpen,
  Sparkles,
  List,
  Grid,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PDFUploaderProps {
  onPDFSelected: (file: File) => void;
  onPDFRemoved?: () => void;
  isProcessing?: boolean;
  extractedText?: string;
  summary?: string;
  pageCount?: number;
  processingProgress?: number;
  maxSizeMB?: number;
  className?: string;
}

interface PDFState {
  file: File | null;
  name: string | null;
  size: number;
  pageCount: number;
}

export function PDFUploader({
  onPDFSelected,
  onPDFRemoved,
  isProcessing = false,
  extractedText,
  summary,
  pageCount = 0,
  processingProgress = 0,
  maxSizeMB = 50,
  className,
}: PDFUploaderProps) {
  const [pdfState, setPdfState] = useState<PDFState>({
    file: null,
    name: null,
    size: 0,
    pageCount: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "text">("summary");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.type !== "application/pdf") {
        return "Only PDF files are accepted";
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File too large. Maximum size: ${maxSizeMB}MB`;
      }
      return null;
    },
    [maxSizeMB]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setPdfState({
        file,
        name: file.name,
        size: file.size,
        pageCount: 0,
      });
      onPDFSelected(file);
    },
    [validateFile, onPDFSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const removePDF = useCallback(() => {
    setPdfState({
      file: null,
      name: null,
      size: 0,
      pageCount: 0,
    });
    setError(null);
    onPDFRemoved?.();
  }, [onPDFRemoved]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!pdfState.file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all duration-200",
              isDragging
                ? "border-amber-500 bg-amber-500/10"
                : "border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <motion.div
                animate={{
                  scale: isDragging ? 1.1 : 1,
                  y: isDragging ? -5 : 0,
                }}
                className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center mb-4",
                  isDragging
                    ? "bg-amber-500/20"
                    : "bg-gradient-to-br from-slate-800 to-slate-700"
                )}
              >
                <FileText
                  className={cn(
                    "h-8 w-8",
                    isDragging ? "text-amber-400" : "text-slate-400"
                  )}
                />
              </motion.div>

              <h3 className="text-lg font-medium text-white mb-1">
                {isDragging ? "Drop your PDF here" : "Upload a PDF document"}
              </h3>
              <p className="text-sm text-slate-400 mb-4 text-center">
                Drag and drop or click to browse
              </p>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-slate-600 hover:bg-slate-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>

              <p className="text-xs text-slate-500 mt-4">
                Max {maxSizeMB}MB • PDF only
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl bg-slate-900 border border-slate-700/50 overflow-hidden"
          >
            {/* PDF Info Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white truncate max-w-[300px]">
                      {pdfState.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                        {formatFileSize(pdfState.size)}
                      </Badge>
                      {pageCount > 0 && (
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                          {pageCount} pages
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removePDF}
                        className="h-8 w-8 text-slate-400 hover:text-rose-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
                  <span className="text-sm text-slate-300">Processing document...</span>
                  <span className="text-sm text-amber-400 ml-auto">
                    {Math.round(processingProgress)}%
                  </span>
                </div>
                <Progress value={processingProgress} className="h-1.5 bg-slate-700" />
              </div>
            )}

            {/* Results Tabs */}
            {(extractedText || summary) && !isProcessing && (
              <div className="p-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                    <TabsTrigger
                      value="summary"
                      className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Summary
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                    >
                      <FileSearch className="h-4 w-4 mr-2" />
                      Extracted Text
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-4">
                    {summary ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-400">
                            Document Summary
                          </span>
                        </div>
                        <ScrollArea className="h-[200px] rounded-lg bg-slate-800/50 p-4">
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {summary}
                          </p>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No summary available</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="text" className="mt-4">
                    {extractedText ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-400">
                              Extracted Text
                            </span>
                          </div>
                          <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                            {extractedText.length.toLocaleString()} characters
                          </Badge>
                        </div>
                        <ScrollArea className="h-[200px] rounded-lg bg-slate-800/50 p-4">
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                            {extractedText}
                          </p>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileSearch className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No text extracted yet</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Waiting State */}
            {!isProcessing && !extractedText && !summary && (
              <div className="p-8 text-center">
                <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  PDF uploaded. Click &quot;Process&quot; to extract text and generate summary.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Info */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <FileSearch className="h-5 w-5 text-amber-400 mb-2" />
          <p className="text-xs font-medium text-white">Text Extraction</p>
          <p className="text-xs text-slate-400 mt-1">OCR support for scanned PDFs</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <Sparkles className="h-5 w-5 text-purple-400 mb-2" />
          <p className="text-xs font-medium text-white">AI Summary</p>
          <p className="text-xs text-slate-400 mt-1">Smart document summarization</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <List className="h-5 w-5 text-emerald-400 mb-2" />
          <p className="text-xs font-medium text-white">Key Points</p>
          <p className="text-xs text-slate-400 mt-1">Extract main takeaways</p>
        </div>
      </div>
    </div>
  );
}
