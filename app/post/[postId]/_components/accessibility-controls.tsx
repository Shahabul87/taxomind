"use client";

import { useState, useEffect } from "react";
import { Settings, ZoomIn, ZoomOut, Contrast, Type, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export function AccessibilityControls() {
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [readingLine, setReadingLine] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<"none" | "deuteranopia" | "protanopia" | "tritanopia">("none");

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem("accessibility-preferences");
    if (saved) {
      const prefs = JSON.parse(saved);
      setFontSize(prefs.fontSize || 100);
      setHighContrast(prefs.highContrast || false);
      setReducedMotion(prefs.reducedMotion || false);
      setReadingLine(prefs.readingLine || false);
      setColorBlindMode(prefs.colorBlindMode || "none");
    }

    // Check system preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
    }
  }, []);

  useEffect(() => {
    // Save preferences
    localStorage.setItem("accessibility-preferences", JSON.stringify({
      fontSize,
      highContrast,
      reducedMotion,
      readingLine,
      colorBlindMode,
    }));

    // Apply font size
    document.documentElement.style.fontSize = `${fontSize}%`;

    // Apply high contrast
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    // Apply color blind mode
    document.documentElement.setAttribute("data-color-blind-mode", colorBlindMode);
  }, [fontSize, highContrast, reducedMotion, readingLine, colorBlindMode]);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed right-4 bottom-20 z-50 rounded-full shadow-lg"
            aria-label="Accessibility settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Accessibility Settings</SheetTitle>
            <SheetDescription>
              Customize your reading experience
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Size
                </Label>
                <span className="text-sm text-gray-500">{fontSize}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFontSize(Math.max(75, fontSize - 10))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Slider
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={75}
                  max={200}
                  step={5}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFontSize(Math.min(200, fontSize + 10))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Contrast className="w-4 h-4" />
                High Contrast
              </Label>
              <Switch
                checked={highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Reduced Motion
              </Label>
              <Switch
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>

            {/* Reading Line */}
            <div className="flex items-center justify-between">
              <Label>Reading Line Guide</Label>
              <Switch
                checked={readingLine}
                onCheckedChange={setReadingLine}
              />
            </div>

            {/* Color Blind Mode */}
            <div className="space-y-3">
              <Label>Color Blind Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "none", label: "None" },
                  { value: "deuteranopia", label: "Deuteranopia" },
                  { value: "protanopia", label: "Protanopia" },
                  { value: "tritanopia", label: "Tritanopia" },
                ].map((mode) => (
                  <Button
                    key={mode.value}
                    variant={colorBlindMode === mode.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setColorBlindMode(mode.value as any)}
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setFontSize(100);
                setHighContrast(false);
                setReducedMotion(false);
                setReadingLine(false);
                setColorBlindMode("none");
              }}
            >
              Reset to Defaults
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reading Line Overlay */}
      {readingLine && (
        <div
          className="fixed left-0 right-0 h-8 bg-yellow-200/30 dark:bg-yellow-500/20 pointer-events-none z-40 transition-transform duration-100"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
      )}
    </>
  );
}
