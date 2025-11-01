"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Settings,
  ZoomIn,
  ZoomOut,
  Eye,
  Mic,
  Volume2,
  Minus,
  X,
  Palette,
  Sun,
  Moon,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ColorBlindMode = "normal" | "deuteranopia" | "protanopia" | "tritanopia";
type ContrastMode = "normal" | "high" | "higher";

interface AccessibilitySettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  readingGuide: boolean;
  colorBlindMode: ColorBlindMode;
  contrastMode: ContrastMode;
  reducedMotion: boolean;
  darkMode: boolean;
  voiceReading: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 100,
  lineHeight: 1.7,
  letterSpacing: 0,
  readingGuide: false,
  colorBlindMode: "normal",
  contrastMode: "normal",
  reducedMotion: false,
  darkMode: false,
  voiceReading: false,
};

export function EnhancedAccessibilityControls() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [mouseY, setMouseY] = useState(0);

  // Load settings from localStorage (only once on mount)
  useEffect(() => {
    const savedSettings = localStorage.getItem("accessibility-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error("Failed to load accessibility settings:", error);
      }
    } else {
      // Detect system preferences only if no saved settings
      const preferReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const preferHighContrast = window.matchMedia("(prefers-contrast: more)").matches;

      if (preferReducedMotion || preferHighContrast) {
        const updatedSettings = {
          ...DEFAULT_SETTINGS,
          reducedMotion: preferReducedMotion,
          contrastMode: preferHighContrast ? "high" as ContrastMode : "normal" as ContrastMode,
        };
        setSettings(updatedSettings);
        applySettings(updatedSettings);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save settings to localStorage and apply them (skip on initial mount)
  const isFirstRender = useRef(true);
  const prevSettingsRef = useRef(settings);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevSettingsRef.current = settings;
      return;
    }

    // Only update if settings actually changed
    if (JSON.stringify(prevSettingsRef.current) !== JSON.stringify(settings)) {
      localStorage.setItem("accessibility-settings", JSON.stringify(settings));
      applySettings(settings);
      prevSettingsRef.current = settings;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Track mouse position for reading guide
  useEffect(() => {
    if (!settings.readingGuide) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [settings.readingGuide]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    root.style.setProperty("--base-font-size", `${settings.fontSize}%`);

    // Line height
    root.style.setProperty("--base-line-height", `${settings.lineHeight}`);

    // Letter spacing
    root.style.setProperty("--base-letter-spacing", `${settings.letterSpacing}px`);

    // Color blind mode
    root.setAttribute("data-colorblind-mode", settings.colorBlindMode);

    // Contrast mode
    root.setAttribute("data-contrast-mode", settings.contrastMode);

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty("--animation-duration", "0.01ms");
    } else {
      root.style.removeProperty("--animation-duration");
    }

    // Dark mode
    if (settings.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <>
      {/* Floating Settings Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-20 right-6 z-50 rounded-full shadow-lg"
            aria-label="Accessibility Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Accessibility Settings</SheetTitle>
            <SheetDescription>
              Customize the reading experience to your preferences
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size" className="flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Font Size
                </Label>
                <span className="text-sm text-muted-foreground">
                  {settings.fontSize}%
                </span>
              </div>
              <Slider
                id="font-size"
                min={75}
                max={200}
                step={5}
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting("fontSize", value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateSetting("fontSize", Math.max(75, settings.fontSize - 10))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateSetting("fontSize", 100)}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateSetting("fontSize", Math.min(200, settings.fontSize + 10))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Line Height */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="line-height">Line Height</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.lineHeight.toFixed(1)}
                </span>
              </div>
              <Slider
                id="line-height"
                min={1.2}
                max={2.5}
                step={0.1}
                value={[settings.lineHeight]}
                onValueChange={([value]) => updateSetting("lineHeight", value)}
              />
            </div>

            <Separator />

            {/* Letter Spacing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="letter-spacing">Letter Spacing</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.letterSpacing}px
                </span>
              </div>
              <Slider
                id="letter-spacing"
                min={0}
                max={5}
                step={0.5}
                value={[settings.letterSpacing]}
                onValueChange={([value]) => updateSetting("letterSpacing", value)}
              />
            </div>

            <Separator />

            {/* Reading Guide */}
            <div className="flex items-center justify-between">
              <Label htmlFor="reading-guide" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Reading Guide Line
              </Label>
              <Switch
                id="reading-guide"
                checked={settings.readingGuide}
                onCheckedChange={(checked) => updateSetting("readingGuide", checked)}
              />
            </div>

            <Separator />

            {/* Color Blind Mode */}
            <div className="space-y-3">
              <Label htmlFor="colorblind-mode" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color Blind Mode
              </Label>
              <Select
                value={settings.colorBlindMode}
                onValueChange={(value: ColorBlindMode) =>
                  updateSetting("colorBlindMode", value)
                }
              >
                <SelectTrigger id="colorblind-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="deuteranopia">Deuteranopia (Red-Green)</SelectItem>
                  <SelectItem value="protanopia">Protanopia (Red-Blind)</SelectItem>
                  <SelectItem value="tritanopia">Tritanopia (Blue-Yellow)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* High Contrast Mode */}
            <div className="space-y-3">
              <Label htmlFor="contrast-mode">Contrast Mode</Label>
              <Select
                value={settings.contrastMode}
                onValueChange={(value: ContrastMode) =>
                  updateSetting("contrastMode", value)
                }
              >
                <SelectTrigger id="contrast-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Contrast</SelectItem>
                  <SelectItem value="higher">Higher Contrast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => updateSetting("darkMode", checked)}
              />
            </div>

            <Separator />

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion">Reduced Motion</Label>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting("reducedMotion", checked)}
              />
            </div>

            <Separator />

            {/* Voice Reading */}
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-reading" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Voice Reading (TTS)
              </Label>
              <Switch
                id="voice-reading"
                checked={settings.voiceReading}
                onCheckedChange={(checked) => updateSetting("voiceReading", checked)}
              />
            </div>

            <Separator />

            {/* Reset Button */}
            <Button variant="outline" onClick={resetSettings} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reading Guide Overlay */}
      {settings.readingGuide && (
        <div
          className="fixed left-0 right-0 pointer-events-none z-40"
          style={{
            top: `${mouseY}px`,
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.3)",
          }}
        />
      )}

      {/* Global Accessibility Styles */}
      <style jsx global>{`
        :root {
          --base-font-size: ${settings.fontSize}%;
          --base-line-height: ${settings.lineHeight};
          --base-letter-spacing: ${settings.letterSpacing}px;
        }

        article {
          font-size: var(--base-font-size);
          line-height: var(--base-line-height);
          letter-spacing: var(--base-letter-spacing);
        }

        /* Color Blind Filters */
        [data-colorblind-mode="deuteranopia"] {
          filter: url(#deuteranopia);
        }

        [data-colorblind-mode="protanopia"] {
          filter: url(#protanopia);
        }

        [data-colorblind-mode="tritanopia"] {
          filter: url(#tritanopia);
        }

        /* High Contrast Mode */
        [data-contrast-mode="high"] {
          --tw-text-opacity: 1;
          filter: contrast(1.2);
        }

        [data-contrast-mode="higher"] {
          --tw-text-opacity: 1;
          filter: contrast(1.5);
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* SVG Filters for Color Blind Modes */}
      <svg className="hidden">
        <defs>
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625 0.375 0 0 0
                      0.7 0.3 0 0 0
                      0 0.3 0.7 0 0
                      0 0 0 1 0"
            />
          </filter>
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567 0.433 0 0 0
                      0.558 0.442 0 0 0
                      0 0.242 0.758 0 0
                      0 0 0 1 0"
            />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95 0.05 0 0 0
                      0 0.433 0.567 0 0
                      0 0.475 0.525 0 0
                      0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>
    </>
  );
}
