# Socket.io Real-Time Server

## Overview

This Socket.io server provides real-time messaging capabilities for the Taxomind LMS. It handles:

- **Typing Indicators**: Show when users are typing in conversations
- **Real-Time Messages**: Instant message delivery without page refresh
- **Read Receipts**: Track when messages are read
- **Online Status**: Monitor user online/offline status
- **Room Management**: Organize conversations by chat rooms

## Quick Start

### 1. Environment Setup

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
```

### 2. Start the Server

**Development Mode:**
```bash
npm run socket:dev
```

**Production Mode:**
```bash
npm run socket:start
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Socket.io Server Running                              ║
║                                                            ║
║   Port:     3001                                           ║
║   URL:      http://localhost:3001                          ║
║   Health:   http://localhost:3001/health                   ║
║                                                            ║
║   Status:   ✓ Ready to accept connections                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 3. Run with Next.js App

Open **two terminals**:

**Terminal 1 - Next.js App:**
```bash
npm run dev
```

**Terminal 2 - Socket.io Server:**
```bash
npm run socket:dev
```

## Server Architecture

### Event Flow

```
Client                    Server                    Clients in Room
  |                         |                            |
  |--- connect ------------>|                            |
  |<-- user_online ---------|--------------------------->|
  |                         |                            |
  |--- join_conversation -->|                            |
  |                         |                            |
  |--- typing ------------->|                            |
  |                         |--- typing ---------------->|
  |                         |                            |
  |--- message_sent ------->|                            |
  |                         |--- new_message ----------->|
  |                         |                            |
  |--- message_read ------->|                            |
  |                         |--- message_read ---------->|
  |                         |                            |
  |--- disconnect --------->|                            |
  |                         |--- user_offline ---------->|
```

### Event Handlers

#### Client Events (Received by Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `conversationId: string` | Join a conversation room |
| `leave_conversation` | `conversationId: string` | Leave a conversation room |
| `typing` | `{ conversationId, userId }` | User started typing |
| `stop_typing` | `{ conversationId, userId }` | User stopped typing |
| `message_sent` | `Message object` | New message sent |
| `message_read` | `{ messageId, conversationId }` | Message marked as read |

#### Server Events (Emitted to Clients)

| Event | Payload | Description |
|-------|---------|-------------|
| `user_online` | `userId: string` | User came online |
| `user_offline` | `userId: string` | User went offline |
| `typing` | `{ conversationId, userId, userName }` | User is typing |
| `stop_typing` | `{ conversationId, userId }` | User stopped typing |
| `new_message` | `Message object` | New message received |
| `new_message_notification` | `Message object` | Direct notification for offline recipients |
| `message_read` | `{ messageId, conversationId, readAt, readBy }` | Message was read |

## Authentication

The server uses authentication middleware to verify user connections:

```typescript
// Client-side authentication
const socket = io("http://localhost:3001", {
  auth: {
    userId: "user-123",
    userName: "John Doe"
  }
});
```

**Required Auth Fields:**
- `userId` (required): Unique user identifier
- `userName` (optional): User's display name

## Room Management

### Conversation Rooms

Rooms are named as: `conversation:{conversationId}`

**Join a conversation:**
```javascript
socket.emit("join_conversation", "user1-user2");
```

**Leave a conversation:**
```javascript
socket.emit("leave_conversation", "user1-user2");
```

### Broadcasting

- Events broadcast to **conversation room** only reach users in that conversation
- Events broadcast **globally** reach all connected users
- **Direct messages** sent to specific socket IDs

## Health Check

Check server health:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "connectedUsers": 5,
  "connections": 5
}
```

## Testing

### Manual Testing with Socket.io Client

```javascript
// test-socket.js
const io = require("socket.io-client");

const socket = io("http://localhost:3001", {
  auth: {
    userId: "test-user-1",
    userName: "Test User"
  }
});

socket.on("connect", () => {
  console.log("✓ Connected:", socket.id);

  // Join conversation
  socket.emit("join_conversation", "test-conv-1");

  // Test typing
  socket.emit("typing", { conversationId: "test-conv-1", userId: "test-user-1" });
});

socket.on("typing", (data) => {
  console.log("Someone is typing:", data);
});

socket.on("new_message", (message) => {
  console.log("New message:", message);
});
```

Run:
```bash
node test-socket.js
```

### Browser Console Testing

1. Open browser console on `/messages` page
2. Run:

```javascript
// Test typing event
window.socket.emit("typing", {
  conversationId: "user1-user2",
  userId: "user1"
});

// Listen for events
window.socket.on("new_message", (msg) => console.log("Message:", msg));
window.socket.on("typing", (data) => console.log("Typing:", data));
```

## Production Deployment

### Environment Variables

```bash
# Production Socket.io server
NEXT_PUBLIC_SOCKET_URL=wss://socket.yourdomain.com
SOCKET_PORT=3001

# CORS allowed origin
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY server ./server
COPY lib ./lib

EXPOSE 3001

CMD ["node", "-r", "ts-node/register", "server/index.ts"]
```

**Docker Compose:**
```yaml
services:
  socket-server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - SOCKET_PORT=3001
      - NODE_ENV=production
    restart: unless-stopped
```

### Railway Deployment

1. Create new service: `Socket.io Server`
2. Set environment variables:
   - `SOCKET_PORT=3001`
   - `NODE_ENV=production`
3. Set start command: `npm run socket:start`
4. Deploy

## Monitoring

### Console Logs

The server logs all major events:

```
✓ User connected: John Doe (user-123) - Socket: abc123
  → John Doe joined conversation: conv-456
  ⌨ John Doe is typing in conv-456
  ✓ John Doe stopped typing in conv-456
  ✉ John Doe sent message in conv-456
  ✓ John Doe read message msg-789 in conv-456
  ← John Doe left conversation: conv-456
✗ User disconnected: John Doe (user-123)
```

### Metrics to Monitor

- **Connected Users**: Number of unique users online
- **Total Connections**: Number of socket connections
- **Room Occupancy**: Users per conversation room
- **Event Rate**: Messages/typing events per second
- **Latency**: Time between emit and receive

## Troubleshooting

### Connection Issues

**Problem**: Client can't connect

**Solutions**:
1. Check server is running: `curl http://localhost:3001/health`
2. Verify `NEXT_PUBLIC_SOCKET_URL` environment variable
3. Check CORS settings in `server/socket-server.ts`
4. Ensure port 3001 is not in use: `lsof -i :3001`

### Authentication Errors

**Problem**: "Authentication error: userId is required"

**Solution**: Ensure client passes auth object:
```javascript
const socket = io(url, {
  auth: {
    userId: currentUser.id,
    userName: currentUser.name
  }
});
```

### Events Not Received

**Problem**: Client doesn't receive events

**Solutions**:
1. Check user joined conversation room
2. Verify event names match exactly (case-sensitive)
3. Check socket is connected: `socket.connected`
4. Review server logs for errors

### Memory Leaks

**Problem**: Server memory increases over time

**Solutions**:
1. Ensure clients properly disconnect
2. Clean up event listeners in useEffect cleanup
3. Monitor `onlineUsers` Map size
4. Restart server periodically in production

## Code Examples

### Client Usage

```typescript
import { useEffect } from "react";
import { connectSocket, joinConversation, emitTyping } from "@/lib/socket-client";

function ChatComponent() {
  useEffect(() => {
    // Connect and join
    const socket = connectSocket();
    joinConversation("conv-123");

    // Listen for events
    socket.on("new_message", handleMessage);
    socket.on("typing", handleTyping);

    // Cleanup
    return () => {
      socket.off("new_message", handleMessage);
      socket.off("typing", handleTyping);
      leaveConversation("conv-123");
    };
  }, []);
}
```

### Hook Usage

```typescript
import { useTypingIndicator } from "@/hooks/use-typing-indicator";

function MessageInput({ chatId, userId }) {
  const { handleTyping, handleStopTyping, typingUsers } =
    useTypingIndicator(chatId, userId);

  return (
    <>
      <textarea
        onChange={handleTyping}
        onBlur={handleStopTyping}
      />
      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}
    </>
  );
}
```

## Performance Optimization

### Best Practices

1. **Debounce typing events**: 500ms delay prevents spam
2. **Auto-stop typing**: 3-second timeout cleans up stale indicators
3. **Room-based broadcasting**: Only send to relevant users
4. **Cleanup listeners**: Remove event listeners in useEffect cleanup
5. **Limit reconnection attempts**: Prevent infinite retry loops

### Configuration

```typescript
// Recommended production settings
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
});
```

## Security

### Best Practices

1. **Validate auth tokens**: Verify JWT tokens in middleware
2. **Rate limiting**: Prevent spam/abuse
3. **Input validation**: Sanitize all event data
4. **CORS restrictions**: Limit allowed origins
5. **HTTPS only**: Use WSS in production

### Example Auth Middleware

```typescript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const user = await verifyToken(token);
    socket.data.userId = user.id;
    socket.data.userName = user.name;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});
```

## Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Real-Time Features Guide](../MESSAGES_REDESIGN_PROGRESS.md)
- [Client Library](../lib/socket-client.ts)
- [React Hooks](../hooks/use-socket.ts)

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Production Ready
