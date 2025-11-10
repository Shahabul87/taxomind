"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { emitTyping, emitStopTyping, onTyping, onStopTyping } from "@/lib/socket-client";

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

const TYPING_TIMEOUT = 3000; // 3 seconds
const DEBOUNCE_DELAY = 500; // 500ms

export const useTypingIndicator = (conversationId: string, currentUserId: string) => {
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  // Clean up expired typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        let hasChanges = false;

        updated.forEach((user, userId) => {
          if (now - user.timestamp > TYPING_TIMEOUT) {
            updated.delete(userId);
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for typing events
  useEffect(() => {
    const unsubscribeTyping = onTyping((data) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.set(data.userId, {
            userId: data.userId,
            userName: data.userName,
            timestamp: Date.now(),
          });
          return updated;
        });
      }
    });

    const unsubscribeStopTyping = onStopTyping((data) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.delete(data.userId);
          return updated;
        });
      }
    });

    return () => {
      unsubscribeTyping();
      unsubscribeStopTyping();
    };
  }, [conversationId, currentUserId]);

  // Handle user typing
  const handleTyping = useCallback(() => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce typing event emission
    debounceTimeoutRef.current = setTimeout(() => {
      if (!isTypingRef.current) {
        emitTyping(conversationId, currentUserId);
        isTypingRef.current = true;
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after inactivity
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(conversationId, currentUserId);
        isTypingRef.current = false;
      }, TYPING_TIMEOUT);
    }, DEBOUNCE_DELAY);
  }, [conversationId, currentUserId]);

  // Handle user stopped typing
  const handleStopTyping = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTypingRef.current) {
      emitStopTyping(conversationId, currentUserId);
      isTypingRef.current = false;
    }
  }, [conversationId, currentUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        emitStopTyping(conversationId, currentUserId);
      }
    };
  }, [conversationId, currentUserId]);

  const typingUsersList = Array.from(typingUsers.values());

  return {
    typingUsers: typingUsersList,
    isAnyoneTyping: typingUsersList.length > 0,
    handleTyping,
    handleStopTyping,
  };
};
