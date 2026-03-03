import { IncomingMessage } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getSAMRealtimeServer } from "@/lib/sam/realtime";
import type { PresenceMetadata } from "@sam-ai/agentic";
import { logger } from "@/lib/logger";

const MessageSchema = z.object({
  conversationId: z.string().min(1),
  recipientId: z.string().min(1),
  content: z.string().min(1).max(10000),
  type: z.enum(["text", "image", "file", "system"]).default("text"),
});

interface TypingData {
  conversationId: string;
  userId: string;
  userName?: string;
}

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  createdAt: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface MessageReadData {
  messageId: string;
  conversationId: string;
  readAt?: string;
}

interface UserStatus {
  userId: string;
  socketId: string;
  conversationIds: Set<string>;
}

interface JWTPayload {
  sub?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Shared JWT verification for both raw WebSocket and Socket.IO paths.
 * Returns decoded payload or null if verification fails.
 */
function verifySocketJWT(token: string | null | undefined): JWTPayload | null {
  if (!token) return null;
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}

// Track online users
const onlineUsers = new Map<string, UserStatus>();

// Create HTTP server
const httpServer = createServer();
if (process.env.NODE_ENV === 'production' && !process.env.SOCKET_CORS_ORIGINS) {
  logger.error('[SOCKET] WARNING: SOCKET_CORS_ORIGINS not set in production. Using wildcard CORS is insecure.');
}

const allowedOrigins = (process.env.SOCKET_CORS_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB max payload
});

// SAM realtime WebSocket server (raw WS on /ws/sam)
const samRealtimeServer = getSAMRealtimeServer();
samRealtimeServer.start();

const samWss = new WebSocketServer({ noServer: true });

const buildPresenceMetadata = (req: IncomingMessage): PresenceMetadata => {
  const ua = String(req.headers["user-agent"] ?? "").toLowerCase();
  let deviceType: PresenceMetadata["deviceType"] = "desktop";

  if (/tablet|ipad|playbook|silk/.test(ua)) {
    deviceType = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) {
    deviceType = "mobile";
  }

  let browser: string | undefined;
  if (ua.includes("edg")) {
    browser = "Edge";
  } else if (ua.includes("chrome")) {
    browser = "Chrome";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("safari")) {
    browser = "Safari";
  }

  return {
    deviceType,
    browser,
  };
};

httpServer.on("upgrade", (req, socket, head) => {
  const host = req.headers.host ?? "localhost";
  const url = req.url ? new URL(req.url, `http://${host}`) : null;

  if (!url || url.pathname !== "/ws/sam") {
    return;
  }

  samWss.handleUpgrade(req, socket, head, (ws) => {
    samWss.emit("connection", ws, req);
  });
});

samWss.on("connection", (ws, req) => {
  const host = req.headers.host ?? "localhost";
  const url = req.url ? new URL(req.url, `http://${host}`) : null;
  const token = url?.searchParams.get("token");
  const decoded = verifySocketJWT(token);

  if (!decoded?.sub) {
    ws.close(1008, "Valid JWT token required");
    return;
  }

  const userId = decoded.sub;

  const connectionId = uuidv4();
  const metadata = buildPresenceMetadata(req);

  void samRealtimeServer.handleConnection(connectionId, userId, ws, metadata);

  ws.on("message", (data) => {
    const message = typeof data === "string" ? data : data.toString();
    void samRealtimeServer.handleMessage(connectionId, message);
  });

  ws.on("close", (code, reason) => {
    const reasonText = reason.toString() || `code:${code}`;
    void samRealtimeServer.handleDisconnection(connectionId, reasonText);
  });

  ws.on("error", (error) => {
    logger.error("SAM WebSocket error", error);
  });
});

// Authentication middleware - verify JWT token (no anonymous fallback)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  const decoded = verifySocketJWT(token);
  if (!decoded?.sub) {
    return next(new Error("Authentication error: valid JWT token required"));
  }

  socket.data.userId = decoded.sub;
  socket.data.userName = decoded.name || "Unknown User";
  next();
});

io.on("connection", (socket: Socket) => {
  const userId = socket.data.userId as string;
  const userName = socket.data.userName as string;

  logger.info(`User connected: ${userName} (${userId}) - Socket: ${socket.id}`);

  // Track online user
  onlineUsers.set(userId, {
    userId,
    socketId: socket.id,
    conversationIds: new Set(),
  });

  // Broadcast user online status
  io.emit("user_online", userId);

  // Join conversation room
  socket.on("join_conversation", (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);

    const userStatus = onlineUsers.get(userId);
    if (userStatus) {
      userStatus.conversationIds.add(conversationId);
    }

    logger.debug(`${userName} joined conversation: ${conversationId}`);
  });

  // Leave conversation room
  socket.on("leave_conversation", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);

    const userStatus = onlineUsers.get(userId);
    if (userStatus) {
      userStatus.conversationIds.delete(conversationId);
    }

    logger.debug(`${userName} left conversation: ${conversationId}`);
  });

  // Handle typing event
  socket.on("typing", (data: TypingData) => {
    const { conversationId } = data;

    // Broadcast to all users in the conversation except sender
    socket.to(`conversation:${conversationId}`).emit("typing", {
      conversationId,
      userId,
      userName,
    });

    logger.debug(`${userName} is typing in ${conversationId}`);
  });

  // Handle stop typing event
  socket.on("stop_typing", (data: TypingData) => {
    const { conversationId } = data;

    // Broadcast to all users in the conversation except sender
    socket.to(`conversation:${conversationId}`).emit("stop_typing", {
      conversationId,
      userId,
    });

    logger.debug(`${userName} stopped typing in ${conversationId}`);
  });

  // Handle message sent event
  socket.on("message_sent", (message: MessageData) => {
    // Validate incoming message data
    const validation = MessageSchema.safeParse(message);
    if (!validation.success) {
      socket.emit("error", {
        type: "validation_error",
        message: "Invalid message data",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { conversationId, recipientId } = message;

    // Broadcast to all users in the conversation
    io.to(`conversation:${conversationId}`).emit("new_message", message);

    // If recipient is not in the conversation room, send direct notification
    const recipientStatus = onlineUsers.get(recipientId);
    if (recipientStatus && !recipientStatus.conversationIds.has(conversationId)) {
      io.to(recipientStatus.socketId).emit("new_message_notification", message);
    }

    logger.debug(`${userName} sent message in ${conversationId}`);
  });

  // Handle message read event
  socket.on("message_read", (data: MessageReadData) => {
    const { messageId, conversationId } = data;

    // Broadcast to all users in the conversation
    io.to(`conversation:${conversationId}`).emit("message_read", {
      messageId,
      conversationId,
      readAt: new Date().toISOString(),
      readBy: userId,
    });

    logger.debug(`${userName} read message ${messageId} in ${conversationId}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${userName} (${userId})`);

    // Remove from online users
    onlineUsers.delete(userId);

    // Broadcast user offline status
    io.emit("user_offline", userId);
  });

  // Handle errors
  socket.on("error", (error) => {
    logger.error(`Socket error for ${userName}`, error);
  });
});

// Health check endpoint
httpServer.on("request", (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        connectedUsers: onlineUsers.size,
        connections: io.engine.clientsCount,
      })
    );
  }
});

// Start server
const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`Socket.io server running on port ${PORT}`, {
    port: PORT,
    url: `http://localhost:${PORT}`,
    health: `http://localhost:${PORT}/health`,
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down Socket.io server...");

  // Close all connections
  io.close(() => {
    logger.info("Socket.io server closed");
    httpServer.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down...");
  io.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
});

export { io, httpServer };
