import { IncomingMessage } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { getSAMRealtimeServer } from "@/lib/sam/realtime";
import type { PresenceMetadata } from "@sam-ai/agentic";

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
  [key: string]: any;
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

// Track online users
const onlineUsers = new Map<string, UserStatus>();

// Create HTTP server
const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
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
  const userId = url?.searchParams.get("userId");

  if (!userId) {
    ws.close(1008, "userId required");
    return;
  }

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
    console.error("SAM WebSocket error:", error);
  });
});

// Authentication middleware - verify JWT token
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;
  const userName = socket.handshake.auth.userName;

  // If JWT_SECRET is configured, require and verify token
  const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;

  if (jwtSecret && token) {
    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        sub?: string;
        name?: string;
        [key: string]: unknown;
      };
      socket.data.userId = decoded.sub || userId;
      socket.data.userName = decoded.name || userName || "Unknown User";
      return next();
    } catch {
      console.warn("Socket.IO: Invalid JWT token, falling back to userId");
    }
  }

  // Fallback: require userId (backward compatible during migration)
  if (!userId) {
    return next(new Error("Authentication error: token or userId is required"));
  }

  socket.data.userId = userId;
  socket.data.userName = userName || "Unknown User";
  next();
});

io.on("connection", (socket: Socket) => {
  const userId = socket.data.userId as string;
  const userName = socket.data.userName as string;

  console.log(`✓ User connected: ${userName} (${userId}) - Socket: ${socket.id}`);

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

    console.log(`  → ${userName} joined conversation: ${conversationId}`);
  });

  // Leave conversation room
  socket.on("leave_conversation", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);

    const userStatus = onlineUsers.get(userId);
    if (userStatus) {
      userStatus.conversationIds.delete(conversationId);
    }

    console.log(`  ← ${userName} left conversation: ${conversationId}`);
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

    console.log(`  ⌨ ${userName} is typing in ${conversationId}`);
  });

  // Handle stop typing event
  socket.on("stop_typing", (data: TypingData) => {
    const { conversationId } = data;

    // Broadcast to all users in the conversation except sender
    socket.to(`conversation:${conversationId}`).emit("stop_typing", {
      conversationId,
      userId,
    });

    console.log(`  ✓ ${userName} stopped typing in ${conversationId}`);
  });

  // Handle message sent event
  socket.on("message_sent", (message: MessageData) => {
    const { conversationId, recipientId } = message;

    // Broadcast to all users in the conversation
    io.to(`conversation:${conversationId}`).emit("new_message", message);

    // If recipient is not in the conversation room, send direct notification
    const recipientStatus = onlineUsers.get(recipientId);
    if (recipientStatus && !recipientStatus.conversationIds.has(conversationId)) {
      io.to(recipientStatus.socketId).emit("new_message_notification", message);
    }

    console.log(`  ✉ ${userName} sent message in ${conversationId}`);
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

    console.log(`  ✓ ${userName} read message ${messageId} in ${conversationId}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`✗ User disconnected: ${userName} (${userId})`);

    // Remove from online users
    onlineUsers.delete(userId);

    // Broadcast user offline status
    io.emit("user_offline", userId);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket error for ${userName}:`, error);
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
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Socket.io Server Running                              ║
║                                                            ║
║   Port:     ${PORT}                                           ║
║   URL:      http://localhost:${PORT}                          ║
║   Health:   http://localhost:${PORT}/health                   ║
║                                                            ║
║   Status:   ✓ Ready to accept connections                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⚠ Shutting down Socket.io server...");

  // Close all connections
  io.close(() => {
    console.log("✓ Socket.io server closed");
    httpServer.close(() => {
      console.log("✓ HTTP server closed");
      process.exit(0);
    });
  });
});

process.on("SIGTERM", () => {
  console.log("\n⚠ SIGTERM received, shutting down...");
  io.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
});

export { io, httpServer };
