"use client";

/**
 * ImageUploader
 *
 * Drag-and-drop image uploader with preview, crop, and OCR support.
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Crop,
  Loader2,
  CheckCircle2,
  FileImage,
  Camera,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  onImageRemoved?: () => void;
  isProcessing?: boolean;
  extractedText?: string;
  analysisResult?: {
    type: string;
    description: string;
    confidence: number;
  };
  maxSizeMB?: number;
  acceptedFormats?: string[];
  enableCamera?: boolean;
  className?: string;
}

interface ImageState {
  file: File | null;
  preview: string | null;
  zoom: number;
  rotation: number;
}

const DEFAULT_FORMATS = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ImageUploader({
  onImageSelected,
  onImageRemoved,
  isProcessing = false,
  extractedText,
  analysisResult,
  maxSizeMB = 10,
  acceptedFormats = DEFAULT_FORMATS,
  enableCamera = true,
  className,
}: ImageUploaderProps) {
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    preview: null,
    zoom: 1,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedFormats.includes(file.type)) {
        return `Invalid format. Accepted: ${acceptedFormats.map((f) => f.split("/")[1]).join(", ")}`;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File too large. Maximum size: ${maxSizeMB}MB`;
      }
      return null;
    },
    [acceptedFormats, maxSizeMB]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const preview = URL.createObjectURL(file);
      setImageState({
        file,
        preview,
        zoom: 1,
        rotation: 0,
      });
      onImageSelected(file);
    },
    [validateFile, onImageSelected]
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

  const removeImage = useCallback(() => {
    if (imageState.preview) {
      URL.revokeObjectURL(imageState.preview);
    }
    setImageState({
      file: null,
      preview: null,
      zoom: 1,
      rotation: 0,
    });
    setError(null);
    onImageRemoved?.();
  }, [imageState.preview, onImageRemoved]);

  const rotateImage = useCallback(() => {
    setImageState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!imageState.preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all duration-200",
              isDragging
                ? "border-violet-500 bg-violet-500/10"
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
                    ? "bg-violet-500/20"
                    : "bg-gradient-to-br from-slate-800 to-slate-700"
                )}
              >
                <ImageIcon
                  className={cn(
                    "h-8 w-8",
                    isDragging ? "text-violet-400" : "text-slate-400"
                  )}
                />
              </motion.div>

              <h3 className="text-lg font-medium text-white mb-1">
                {isDragging ? "Drop your image here" : "Upload an image"}
              </h3>
              <p className="text-sm text-slate-400 mb-4 text-center">
                Drag and drop or click to browse
              </p>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>

                {enableCamera && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => cameraInputRef.current?.click()}
                          className="border-slate-600 hover:bg-slate-700"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Take Photo</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-4">
                Max {maxSizeMB}MB • {acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")}
              </p>
            </div>

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(",")}
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
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
            className="relative rounded-2xl bg-slate-900 border border-slate-700/50 overflow-hidden"
          >
            {/* Image Preview */}
            <div
              className="relative aspect-video bg-slate-950 flex items-center justify-center cursor-pointer"
              onClick={() => setShowPreview(true)}
            >
              <motion.img
                src={imageState.preview}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
                style={{
                  transform: `scale(${imageState.zoom}) rotate(${imageState.rotation}deg)`,
                }}
                transition={{ duration: 0.2 }}
              />

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-violet-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-300">Analyzing image...</p>
                  </div>
                </div>
              )}

              {/* Zoom indicator */}
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-slate-800/80 text-slate-300">
                  <ZoomIn className="h-3 w-3 mr-1" />
                  Click to enlarge
                </Badge>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                {/* File Info */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <FileImage className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-[200px]">
                      {imageState.file?.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {imageState.file && formatFileSize(imageState.file.size)}
                    </p>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setImageState((prev) => ({
                              ...prev,
                              zoom: Math.max(0.5, prev.zoom - 0.25),
                            }))
                          }
                          className="h-8 w-8 text-slate-400 hover:text-white"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom Out</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <span className="text-xs text-slate-400 w-12 text-center">
                    {Math.round(imageState.zoom * 100)}%
                  </span>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setImageState((prev) => ({
                              ...prev,
                              zoom: Math.min(3, prev.zoom + 0.25),
                            }))
                          }
                          className="h-8 w-8 text-slate-400 hover:text-white"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom In</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="w-px h-6 bg-slate-700 mx-1" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={rotateImage}
                          className="h-8 w-8 text-slate-400 hover:text-white"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rotate</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={removeImage}
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
            </div>
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

      {/* Analysis Results */}
      <AnimatePresence>
        {(extractedText || analysisResult) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Analysis Result */}
            {analysisResult && (
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-400">AI Analysis</span>
                  <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 text-xs">
                    {Math.round(analysisResult.confidence * 100)}% confident
                  </Badge>
                </div>
                <p className="text-sm text-slate-300">{analysisResult.description}</p>
              </div>
            )}

            {/* Extracted Text */}
            {extractedText && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Extracted Text (OCR)</span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{extractedText}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {imageState.preview && (
              <Image
                src={imageState.preview}
                alt="Full preview"
                width={800}
                height={600}
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
                style={{
                  transform: `rotate(${imageState.rotation}deg)`,
                  width: "auto",
                  height: "auto",
                }}
                unoptimized // Required for blob URLs
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
