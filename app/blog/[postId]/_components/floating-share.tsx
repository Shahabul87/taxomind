"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Twitter, Facebook, Linkedin, Link2, Check, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FloatingShareProps {
  title: string;
  description?: string | null;
  url?: string;
}

interface ShareOption {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
  action: () => void;
}

export const FloatingShare = ({ title, description, url }: FloatingShareProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get current URL
  const currentUrl = typeof window !== "undefined" ? url || window.location.href : "";

  // Show floating share after scrolling 400px
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Copy to clipboard handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Share options
  const shareOptions: ShareOption[] = [
    {
      name: "Twitter",
      icon: Twitter,
      color: "text-[#1DA1F2]",
      hoverColor: "hover:bg-[#1DA1F2]/10",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-[#1877F2]",
      hoverColor: "hover:bg-[#1877F2]/10",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-[#0A66C2]",
      hoverColor: "hover:bg-[#0A66C2]/10",
      action: () => {
        window.open(
          `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(title)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "Email",
      icon: Mail,
      color: "text-blog-primary",
      hoverColor: "hover:bg-blog-primary/10",
      action: () => {
        const emailBody = description ? `${description}\n\nRead more: ${currentUrl}` : currentUrl;
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(emailBody)}`;
      },
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed left-4 sm:left-6 top-1/2 -translate-y-1/2 z-50"
        >
          <div className="flex flex-col items-center gap-2">
            {/* Main Share Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                isOpen
                  ? "bg-blog-primary text-white"
                  : "bg-blog-surface dark:bg-slate-800 text-blog-text dark:text-white border border-blog-border dark:border-slate-700"
              )}
              aria-label={isOpen ? "Close share menu" : "Open share menu"}
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              </motion.div>
            </motion.button>

            {/* Share Options */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-2"
                >
                  {shareOptions.map((option, index) => (
                    <motion.button
                      key={option.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={option.action}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center bg-blog-surface dark:bg-slate-800 border border-blog-border dark:border-slate-700 shadow-md transition-all duration-200",
                        option.hoverColor
                      )}
                      title={`Share on ${option.name}`}
                      aria-label={`Share on ${option.name}`}
                    >
                      <option.icon className={cn("w-4 h-4", option.color)} />
                    </motion.button>
                  ))}

                  {/* Copy Link Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: shareOptions.length * 0.05 }}
                    onClick={handleCopy}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-blog-surface dark:bg-slate-800 border border-blog-border dark:border-slate-700 shadow-md transition-all duration-200",
                      copied ? "bg-blog-accent/20 border-blog-accent" : "hover:bg-blog-accent/10"
                    )}
                    title="Copy link"
                    aria-label="Copy link to clipboard"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-blog-accent" />
                    ) : (
                      <Link2 className="w-4 h-4 text-blog-text-muted dark:text-gray-400" />
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingShare;
