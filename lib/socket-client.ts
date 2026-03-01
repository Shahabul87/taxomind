"use client";

import type { Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = async (userId?: string, userName?: string): Promise<Socket> => {
  if (!socket) {
    const { io } = await import("socket.io-client");

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        userId: userId || "",
        userName: userName || "Anonymous",
      },
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  return socket;
};

export const connectSocket = async () => {
  const s = await getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

// Room management
export const joinConversation = (conversationId: string) => {
  socket?.emit("join_conversation", conversationId);
};

export const leaveConversation = (conversationId: string) => {
  socket?.emit("leave_conversation", conversationId);
};

// Event emitters
export const emitTyping = (conversationId: string, userId: string) => {
  socket?.emit("typing", { conversationId, userId });
};

export const emitStopTyping = (conversationId: string, userId: string) => {
  socket?.emit("stop_typing", { conversationId, userId });
};

export const emitMessageSent = (message: Record<string, unknown>) => {
  socket?.emit("message_sent", message);
};

export const emitMessageRead = (messageId: string, conversationId: string) => {
  socket?.emit("message_read", { messageId, conversationId });
};

// Event listeners
export const onNewMessage = (callback: (message: Record<string, unknown>) => void) => {
  socket?.on("new_message", callback);
  return () => {
    socket?.off("new_message", callback);
  };
};

export const onTyping = (callback: (data: { conversationId: string; userId: string; userName: string }) => void) => {
  socket?.on("typing", callback);
  return () => {
    socket?.off("typing", callback);
  };
};

export const onStopTyping = (callback: (data: { conversationId: string; userId: string }) => void) => {
  socket?.on("stop_typing", callback);
  return () => {
    socket?.off("stop_typing", callback);
  };
};

export const onMessageRead = (callback: (data: { messageId: string; conversationId: string; readAt: string }) => void) => {
  socket?.on("message_read", callback);
  return () => {
    socket?.off("message_read", callback);
  };
};

export const onUserOnline = (callback: (userId: string) => void) => {
  socket?.on("user_online", callback);
  return () => {
    socket?.off("user_online", callback);
  };
};

export const onUserOffline = (callback: (userId: string) => void) => {
  socket?.on("user_offline", callback);
  return () => {
    socket?.off("user_offline", callback);
  };
};
