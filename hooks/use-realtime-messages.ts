"use client";

import { useEffect, useCallback } from "react";
import { onNewMessage, onMessageRead, emitMessageSent, emitMessageRead } from "@/lib/socket-client";

interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  read: boolean;
  readAt?: string | null;
  [key: string]: any;
}

interface UseRealTimeMessagesProps {
  conversationId: string;
  userId: string;
  onMessageReceived: (message: Message) => void;
  onMessageReadUpdate: (data: { messageId: string; readAt: string }) => void;
}

export const useRealTimeMessages = ({
  conversationId,
  userId,
  onMessageReceived,
  onMessageReadUpdate,
}: UseRealTimeMessagesProps) => {
  // Listen for new messages
  useEffect(() => {
    const unsubscribe = onNewMessage((message: Message) => {
      // Only process messages for this conversation
      const isForThisConversation =
        (message.senderId === userId || message.recipientId === userId) &&
        (message.senderId === conversationId.split("-")[0] ||
          message.senderId === conversationId.split("-")[1] ||
          message.recipientId === conversationId.split("-")[0] ||
          message.recipientId === conversationId.split("-")[1]);

      if (isForThisConversation) {
        onMessageReceived(message);

        // Auto-mark as read if user is viewing the conversation and message is from other user
        if (message.senderId !== userId) {
          setTimeout(() => {
            markMessageAsRead(message.id);
          }, 1000);
        }
      }
    });

    return unsubscribe;
  }, [conversationId, userId, onMessageReceived]);

  // Listen for message read updates
  useEffect(() => {
    const unsubscribe = onMessageRead((data) => {
      if (data.conversationId === conversationId) {
        onMessageReadUpdate({
          messageId: data.messageId,
          readAt: data.readAt,
        });
      }
    });

    return unsubscribe;
  }, [conversationId, onMessageReadUpdate]);

  // Send new message via socket
  const sendMessage = useCallback((message: Message) => {
    emitMessageSent(message);
  }, []);

  // Mark message as read via socket
  const markMessageAsRead = useCallback(
    (messageId: string) => {
      emitMessageRead(messageId, conversationId);
    },
    [conversationId]
  );

  return {
    sendMessage,
    markMessageAsRead,
  };
};
