"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface KeyboardNavigationProps {
  onPlayPause?: () => void;
  onNextSection?: () => void;
  onPrevSection?: () => void;
  onToggleSidebar?: () => void;
  onToggleFullscreen?: () => void;
  onTabSwitch?: (tab: string) => void;
  tabs?: string[];
  currentTab?: number;
}

export function KeyboardNavigation({
  onPlayPause,
  onNextSection,
  onPrevSection,
  onToggleSidebar,
  onToggleFullscreen,
  onTabSwitch,
  tabs = [],
  currentTab = 0,
}: KeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      // Keyboard shortcuts mapping
      const shortcuts: Record<string, () => void> = {
        // Navigation
        "ArrowLeft": () => {
          if (e.ctrlKey || e.metaKey) {
            onPrevSection?.();
            showToast("Previous section");
          }
        },
        "ArrowRight": () => {
          if (e.ctrlKey || e.metaKey) {
            onNextSection?.();
            showToast("Next section");
          }
        },

        // Video controls
        " ": () => { // Space key
          e.preventDefault();
          onPlayPause?.();
        },
        "k": () => { // YouTube-style play/pause
          onPlayPause?.();
        },

        // Tab navigation
        "1": () => switchToTab(0),
        "2": () => switchToTab(1),
        "3": () => switchToTab(2),
        "4": () => switchToTab(3),
        "5": () => switchToTab(4),
        "6": () => switchToTab(5),
        "7": () => switchToTab(6),

        // UI toggles
        "b": () => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onToggleSidebar?.();
            showToast("Toggled sidebar");
          }
        },
        "f": () => {
          if (!e.ctrlKey && !e.metaKey) {
            onToggleFullscreen?.();
            showToast("Toggle fullscreen");
          }
        },

        // Help
        "?": () => {
          if (e.shiftKey) {
            showHelp();
          }
        },
        "h": () => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            showHelp();
          }
        },
      };

      // Execute shortcut if exists
      const key = e.key;
      if (shortcuts[key]) {
        shortcuts[key]();
      }
    };

    const switchToTab = (index: number) => {
      if (tabs[index] && onTabSwitch) {
        onTabSwitch(tabs[index]);
        showToast(`Switched to ${tabs[index]} tab`);
      }
    };

    const showToast = (message: string) => {
      toast.info(message, {
        duration: 1000,
        position: "bottom-center",
      });
    };

    const showHelp = () => {
      toast.info(
        <div className="space-y-2">
          <p className="font-semibold mb-2">Keyboard Shortcuts</p>
          <div className="text-xs space-y-1">
            <div><kbd>Space</kbd> or <kbd>K</kbd> - Play/Pause video</div>
            <div><kbd>Ctrl</kbd>+<kbd>←</kbd>/<kbd>→</kbd> - Previous/Next section</div>
            <div><kbd>1-7</kbd> - Switch tabs</div>
            <div><kbd>Ctrl</kbd>+<kbd>B</kbd> - Toggle sidebar</div>
            <div><kbd>F</kbd> - Fullscreen</div>
            <div><kbd>?</kbd> - Show this help</div>
          </div>
        </div>,
        {
          duration: 5000,
          position: "top-center",
        }
      );
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [
    onPlayPause,
    onNextSection,
    onPrevSection,
    onToggleSidebar,
    onToggleFullscreen,
    onTabSwitch,
    tabs,
    currentTab,
  ]);

  return null; // This is a hook-only component
}

/**
 * Hook version for easier integration
 */
export function useKeyboardNavigation(props: KeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if typing in input
      const isTyping =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true";

      if (isTyping) return;

      // Navigation shortcuts
      if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        props.onPrevSection?.();
      }
      if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        props.onNextSection?.();
      }

      // Video controls
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        props.onPlayPause?.();
      }

      // Tab switching (1-7 keys)
      const tabNumber = parseInt(e.key);
      if (tabNumber >= 1 && tabNumber <= 7 && props.tabs && props.onTabSwitch) {
        const tabIndex = tabNumber - 1;
        if (props.tabs[tabIndex]) {
          props.onTabSwitch(props.tabs[tabIndex]);
        }
      }

      // UI toggles
      if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        props.onToggleSidebar?.();
      }
      if (e.key === "f" && !e.ctrlKey && !e.metaKey) {
        props.onToggleFullscreen?.();
      }

      // Help
      if (e.key === "?" && e.shiftKey) {
        showKeyboardHelp();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [props]);
}

function showKeyboardHelp() {
  const helpContent = `
Keyboard Shortcuts:
━━━━━━━━━━━━━━━━━━━
Navigation:
• Ctrl/⌘ + ← → - Previous/Next section
• 1-7 - Switch content tabs
• Tab - Navigate through elements

Video:
• Space or K - Play/Pause
• F - Fullscreen
• ← → - Seek backward/forward

Interface:
• Ctrl/⌘ + B - Toggle sidebar
• Esc - Exit fullscreen
• ? - Show help
  `.trim();

  toast.info(
    <pre className="text-xs font-mono whitespace-pre">{helpContent}</pre>,
    {
      duration: 5000,
      position: "top-center",
      className: "!max-w-sm",
    }
  );
}