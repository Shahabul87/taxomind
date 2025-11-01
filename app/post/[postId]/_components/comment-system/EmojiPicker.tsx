"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// Common emoji sets
const emojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", 
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "❣️", "💕", "💞",
  "👍", "👎", "👏", "🙌", "🤝", "👊", "✌️", "🤞", "🤟", "🤘",
  "😍", "🥰", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
  "😎", "🤓", "🧐", "🤔", "🤨", "😐", "😑", "😶", "😏", "😒",
  "🔥", "✨", "🎉", "🎊", "💯", "💢", "💥", "💫", "💦", "💨",
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 w-[320px] max-h-[250px] overflow-y-auto"
    >
      <div className="grid grid-cols-8 gap-1">
        {emojis.map((emoji, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEmojiSelect(emoji)}
            onMouseEnter={() => setHoveredEmoji(emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
          >
            <span className="text-xl">{emoji}</span>
            {hoveredEmoji === emoji && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap"
              >
                {emoji}
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}; 