"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  userAvatar?: string | null;
}

export const TypingIndicator = ({ typingUsers, userAvatar }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const firstUser = typingUsers[0];
  const otherCount = typingUsers.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 px-4 py-2"
    >
      <Avatar className="w-8 h-8">
        <AvatarImage src={userAvatar || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
          {firstUser.userName.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: 0,
              ease: "easeInOut",
            }}
            className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: 0.2,
              ease: "easeInOut",
            }}
            className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: 0.4,
              ease: "easeInOut",
            }}
            className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
          />
        </div>

        <span className="text-sm text-slate-600 dark:text-slate-400">
          {otherCount > 0
            ? `${firstUser.userName} and ${otherCount} other${otherCount > 1 ? "s" : ""} ${otherCount > 1 ? "are" : "is"} typing...`
            : `${firstUser.userName} is typing...`}
        </span>
      </div>
    </motion.div>
  );
};
