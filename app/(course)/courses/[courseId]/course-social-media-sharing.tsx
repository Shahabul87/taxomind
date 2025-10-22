"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share,
  Share2,
  Linkedin,
  MessageCircle,
  Camera,
  Link,
} from "lucide-react";

interface SocialShareProps {
  courseTitle: string;
}

const socialIcons = [
  {
    name: "Twitter",
    icon: Share,
    color: "hover:bg-black",
    textColor: "group-hover:text-white",
    tooltipBg: "bg-black",
    getUrl: (url: string, title: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    icon: Share2,
    color: "hover:bg-blue-600",
    textColor: "group-hover:text-white",
    tooltipBg: "bg-blue-600",
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "hover:bg-blue-700",
    textColor: "group-hover:text-white",
    tooltipBg: "bg-blue-700",
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    color: "hover:bg-green-500",
    textColor: "group-hover:text-white",
    tooltipBg: "bg-green-500",
    getUrl: (url: string, title: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(title)}%20${encodeURIComponent(url)}`,
  },
  {
    name: "Instagram",
    icon: Camera,
    color: "hover:bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500",
    textColor: "group-hover:text-white",
    tooltipBg: "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500",
    getUrl: () => "https://www.instagram.com/",
  },
];

export const CourseSocialMediaShare: React.FC<SocialShareProps> = ({ courseTitle }): JSX.Element => {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-6">
      <span className="text-gray-400 font-medium">Share via:</span>
      <div className="flex items-center gap-3">
        {socialIcons.map((social) => (
          <motion.div
            key={social.name}
            className="relative group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredIcon(social.name)}
            onHoverEnd={() => setHoveredIcon(null)}
          >
            <a
              href={social.getUrl?.(currentUrl, courseTitle)}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                block p-2 rounded-full transition-all duration-300
                ${social.color} group
                hover:shadow-lg hover:shadow-gray-800/20
              `}
              aria-label={`Share on ${social.name}`}
            >
              <social.icon
                className={`w-5 h-5 text-gray-600 transition-colors duration-300 ${social.textColor}`}
                strokeWidth={1.5}
              />
            </a>
            <AnimatePresence>
              {hoveredIcon === social.name && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute -top-12 left-1/2 -translate-x-1/2 
                    ${social.tooltipBg} text-white px-3 py-1 rounded-full text-xs font-semibold
                    whitespace-nowrap pointer-events-none shadow-lg backdrop-blur
                  `}
                >
                  <span className="relative z-10">{social.name}</span>
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${social.tooltipBg}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Copy Link Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyLink}
          onHoverStart={() => setHoveredIcon('copy')}
          onHoverEnd={() => setHoveredIcon(null)}
          className="relative group p-2 rounded-full hover:bg-gray-100 
            transition-all duration-300 hover:shadow-lg hover:shadow-gray-800/20"
          aria-label="Copy Link"
        >
          <Link
            className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors duration-300"
            strokeWidth={1.5}
          />
          <AnimatePresence>
            {hoveredIcon === 'copy' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 
                  bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-semibold
                  whitespace-nowrap pointer-events-none shadow-lg"
              >
                <span className="relative z-10">{copiedLink ? "Copied!" : "Copy Link"}</span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};
