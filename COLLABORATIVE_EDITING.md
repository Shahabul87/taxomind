# Collaborative Editing Features

This document describes the comprehensive collaborative editing system implemented in Taxomind LMS.

## 🌟 Features Overview

The collaborative editing system provides real-time, multi-user editing capabilities with:

- **Real-time Synchronization**: Live cursor tracking, typing indicators, and document updates
- **Operational Transformation**: Conflict-free concurrent editing using advanced OT algorithms
- **Conflict Resolution**: Automatic and manual conflict detection and resolution
- **Permission Management**: Role-based access control with fine-grained permissions
- **Comment System**: Threaded comments with position-based anchoring
- **Session Management**: Robust session handling with participant tracking
- **Analytics**: Comprehensive tracking of collaborative activities
- **Document Versioning**: YJS-based document state management with snapshots

## 🏗️ Architecture

### Core Components

```
lib/collaborative-editing/
├── websocket-server.ts          # Main WebSocket server with Socket.IO
├── session-manager.ts           # Session lifecycle and participant management
├── yjs-document-manager.ts      # YJS document state management
├── operational-transform.ts     # Operational transformation engine
├── conflict-resolver.ts         # Conflict detection and resolution
├── permission-manager.ts        # Role-based permission system
├── cursor-manager.ts           # Real-time cursor tracking
├── comment-manager.ts          # Collaborative commenting system
└── analytics.ts                # Activity tracking and metrics
```

### Database Schema

#### Core Models
- `CollaborativeSession` - Session metadata and state
- `SessionParticipant` - User participation in sessions
- `CollaborativeActivity` - Activity tracking and audit logs

#### New Models
- `CollaborativeCursor` - Real-time cursor positions
- `CollaborativeOperation` - Document operations for OT
- `CollaborativePermission` - User permissions for content
- `PermissionRule` - Permission rules and conditions
- `PermissionActivity` - Permission change audit log

#### Enhanced Models
- `SessionComment` - Enhanced with threading, positioning, and status
- `SessionConflict` - Enhanced with operations data and resolution tracking

## 🚀 Quick Start

### 1. Database Migration

Run the migration script to set up collaborative editing tables:

```bash
# Development
node scripts/migrate-collaborative-features.js

# Production
./scripts/deploy-collaborative-features.sh production
```

### 2. Environment Setup

Ensure these environment variables are configured:

```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"

# Optional
REDIS_URL="redis://..." # For scaling WebSocket sessions
```

### 3. Server Integration

The collaborative server is automatically initialized with your Next.js application:

```typescript
import { initializeCollaborativeServer } from '@/lib/collaborative-editing/websocket-server';

// In your server setup
const server = createServer();
const collaborativeServer = initializeCollaborativeServer(server);
```

## 💻 Client Usage

### Basic Collaboration

```typescript
import io from 'socket.io-client';

// Connect to collaborative session
const socket = io('/collaborative', {
  auth: {
    token: userToken
  }
});

// Join a session
socket.emit('join-session', {
  sessionId: 'course_123',
  contentType: 'course',
  contentId: '123'
});

// Handle session events
socket.on('session-joined', (data) => {
  console.log('Joined session:', data);
});

socket.on('user-joined', (data) => {
  console.log('User joined:', data.user);
});

socket.on('document-operation', (data) => {
  // Apply operation to your editor
  applyOperation(data.operation);
});
```

### Document Operations

```typescript
// Send document operation
socket.emit('document-operation', {
  sessionId: 'course_123',
  operation: {
    id: 'op_123',
    type: 'insert',
    position: 10,
    content: 'Hello, World!',
    userId: 'user_123',
    timestamp: new Date(),
    clientId: 'client_abc',
    revision: 1
  }
});

// Handle transformed operations
socket.on('document-operation', (data) => {
  if (data.userId !== currentUserId) {
    applyRemoteOperation(data.operation);
  }
});
```

### Cursor Tracking

```typescript
// Update cursor position
socket.emit('cursor-update', {
  sessionId: 'course_123',
  position: 25,
  line: 2,
  column: 15,
  selection: {
    start: 20,
    end: 30
  },
  isTyping: true
});

// Display other users' cursors
socket.on('cursor-update', (data) => {
  updateUserCursor(data.userId, {
    position: data.position,
    color: data.cursorColor,
    isTyping: data.isTyping
  });
});
```

### Comments

```typescript
// Add comment
socket.emit('add-comment', {
  sessionId: 'course_123',
  content: 'This needs clarification',
  position: 100,
  line: 5,
  column: 10,
  type: 'QUESTION',
  parentId: null // For replies
});

// Handle new comments
socket.on('comment-added', (data) => {
  displayComment(data.comment);
});

// Resolve comment
socket.emit('resolve-comment', {
  sessionId: 'course_123',
  commentId: 'comment_123'
});
```

### Locking

```typescript
// Request lock
socket.emit('request-lock', {
  sessionId: 'course_123',
  lockType: 'SOFT', // or 'HARD', 'SECTION'
  section: 'paragraph_1' // optional
});

// Handle lock status
socket.on('lock-granted', (data) => {
  enableEditing();
});

socket.on('lock-denied', (data) => {
  showLockMessage(data.reason);
});

// Release lock
socket.emit('release-lock', {
  sessionId: 'course_123'
});
```

## 🔒 Permission System

### Permission Types

- `READ` - View content
- `WRITE` - Edit content  
- `COMMENT` - Add comments
- `MODERATE` - Manage locks and resolve conflicts
- `ADMIN` - Full permissions including user management

### User Roles

- `VIEWER` - Read-only access
- `COMMENTER` - Can read and comment
- `EDITOR` - Can read, write, and comment
- `MODERATOR` - Can moderate sessions
- `ADMIN` - Full control

### Granting Permissions

```typescript
import { PermissionManager } from '@/lib/collaborative-editing/permission-manager';

const permissionManager = new PermissionManager();

// Grant permission
await permissionManager.grantPermission(
  'admin_user_id',
  'target_user_id', 
  'course',
  'course_123',
  ['READ', 'WRITE', 'COMMENT'],
  new Date('2024-12-31') // expiration
);

// Check permission
const hasPermission = await permissionManager.checkPermission(
  'user_id',
  'course',
  'course_123',
  'WRITE'
);
```

### Permission Rules

Create dynamic permission rules:

```typescript
// Rule: All enrolled users can read and comment
await permissionManager.createPermissionRule('admin_id', {
  contentType: 'course',
  contentId: 'course_123',
  userRole: 'USER',
  permissions: ['READ', 'COMMENT'],
  conditions: {
    enrollmentRequired: true,
    timeRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    }
  },
  isActive: true
});
```

## 📊 Analytics and Monitoring

### Session Metrics

```typescript
import { CollaborativeAnalytics } from '@/lib/collaborative-editing/analytics';

const analytics = new CollaborativeAnalytics();

// Get session metrics
const metrics = await analytics.getSessionMetrics('session_123');
console.log(metrics);
/*
{
  sessionId: 'session_123',
  totalEdits: 150,
  activeUsers: 3,
  averageEditTime: 2500,
  conflictCount: 2,
  lockCount: 5,
  totalSessionTime: 3600000,
  userContributions: {
    'user_1': 75,
    'user_2': 50,
    'user_3': 25
  },
  peakConcurrency: 3,
  documentLength: 5000
}
*/
```

### User Activity

```typescript
// Get user activity report
const activity = await analytics.getUserActivityReport('session_123', 'user_123');
console.log(activity);
/*
{
  userId: 'user_123',
  userName: 'John Doe',
  joinTime: Date,
  leaveTime: Date,
  editCount: 75,
  characterCount: 1250,
  lockRequests: 3,
  conflictsResolved: 1,
  commentsAdded: 5,
  timeActive: 1800000
}
*/
```

### Monitoring Script

```bash
# Monitor collaborative features
node scripts/monitor-collaborative.js

# Output:
# Collaborative Features Status: {
#   activeSessions: 12,
#   recentOperations: 145,
#   unresolvedConflicts: 0,
#   timestamp: '2024-01-15T10:30:00.000Z'
# }
```

## 🔧 Configuration

### WebSocket Server Configuration

```typescript
// In websocket-server.ts
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});
```

### Operational Transform Settings

```typescript
// In operational-transform.ts
class OperationalTransformEngine {
  // Concurrent operation detection window (milliseconds)
  private static CONCURRENCY_WINDOW = 5000;
  
  // Maximum operations to store in memory per session
  private static MAX_OPERATIONS_PER_SESSION = 1000;
}
```

### Session Management

```typescript
// In session-manager.ts
class CollaborativeSessionManager {
  // Session timeout (milliseconds)
  private static SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  
  // Maximum participants per session
  private static MAX_PARTICIPANTS = 50;
}
```

## 🧪 Testing

### Running Tests

```bash
# Run collaborative editing tests
npm test -- --testPathPattern=collaborative

# Run integration tests
npm run test:integration -- collaborative

# Run performance tests
npm run test:performance
```

### Manual Testing

1. **Multi-user Editing**
   - Open multiple browser tabs
   - Join same session from different users
   - Type simultaneously and verify synchronization

2. **Conflict Resolution**
   - Create overlapping edits
   - Verify automatic resolution
   - Test manual resolution UI

3. **Permission System**
   - Test different user roles
   - Verify permission enforcement
   - Test permission expiration

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   ```
   Error: WebSocket connection failed
   ```
   - Check CORS settings
   - Verify authentication token
   - Ensure server is running

2. **Database Permission Denied**
   ```
   Error: Permission denied for table "collaborativecursor"
   ```
   - Run migration script
   - Check database user permissions
   - Verify schema exists

3. **High Conflict Rate**
   ```
   Warning: High conflict rate detected
   ```
   - Check operation transformation logic
   - Review concurrent editing patterns
   - Consider adjusting conflict detection sensitivity

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
DEBUG=collaborative:*

// Or programmatically
import { logger } from '@/lib/logger';
logger.level = 'debug';
```

### Performance Monitoring

```typescript
// Monitor operation processing time
const start = performance.now();
await transformEngine.transform(operation, sessionId, userId);
const duration = performance.now() - start;

if (duration > 100) {
  logger.warn(`Slow operation processing: ${duration}ms`);
}
```

## 📚 API Reference

### WebSocket Events

#### Client → Server

- `join-session` - Join collaborative session
- `leave-session` - Leave session
- `document-operation` - Send document operation
- `cursor-update` - Update cursor position
- `add-comment` - Add comment
- `resolve-comment` - Resolve comment
- `request-lock` - Request editing lock
- `release-lock` - Release lock
- `resolve-conflict` - Resolve editing conflict
- `presence-update` - Update user presence

#### Server → Client

- `session-joined` - Session join confirmation
- `user-joined` - User joined session
- `user-left` - User left session
- `user-disconnected` - User disconnected
- `document-operation` - Document operation received
- `cursor-update` - Cursor position update
- `cursor-removed` - Cursor removed
- `comment-added` - Comment added
- `comment-resolved` - Comment resolved
- `comments-transformed` - Comments position updated
- `lock-acquired` - Lock granted
- `lock-released` - Lock released
- `conflict-detected` - Editing conflict detected
- `conflict-resolved` - Conflict resolved
- `presence-update` - User presence update
- `error` - Error occurred

### REST API Endpoints

```typescript
// Get session analytics
GET /api/collaborative/sessions/{sessionId}/analytics

// Get user permissions
GET /api/collaborative/permissions/{userId}/{contentType}/{contentId}

// Grant permission
POST /api/collaborative/permissions/grant

// Revoke permission  
POST /api/collaborative/permissions/revoke

// Get session history
GET /api/collaborative/sessions/{sessionId}/history

// Export session data
GET /api/collaborative/sessions/{sessionId}/export
```

## 🔄 Migration Guide

### From Non-Collaborative to Collaborative

1. **Backup existing data**
   ```bash
   pg_dump $DATABASE_URL > backup-pre-collaborative.sql
   ```

2. **Run migration**
   ```bash
   node scripts/migrate-collaborative-features.js
   ```

3. **Update application code**
   - Add WebSocket server initialization
   - Integrate collaborative components
   - Update permission checks

4. **Test thoroughly**
   - Verify existing functionality
   - Test collaborative features
   - Performance testing

### Version Compatibility

- **Database**: PostgreSQL 12+
- **Node.js**: 18+
- **Next.js**: 14+
- **Socket.IO**: 4+
- **Prisma**: 5+

## 📈 Performance Considerations

### Optimization Tips

1. **Limit Session Size**
   - Maximum 50 concurrent users per session
   - Consider splitting large documents

2. **Operation Batching**
   - Batch small operations together
   - Debounce rapid operations

3. **Memory Management**
   - Clean up old operations
   - Limit in-memory caches

4. **Database Optimization**
   - Index collaborative tables
   - Partition by session or date

### Scaling

For high-scale deployments:

1. **Redis for Session Storage**
   ```typescript
   // Configure Redis adapter
   const redisAdapter = require('@socket.io/redis-adapter');
   io.adapter(redisAdapter({ host: 'redis-server', port: 6379 }));
   ```

2. **Multiple Server Instances**
   - Use sticky sessions
   - Share state via Redis
   - Load balance WebSocket connections

3. **Database Sharding**
   - Shard by session ID
   - Separate analytics database

## 🤝 Contributing

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Set up database: `npm run dev:setup`
4. Run migrations: `node scripts/migrate-collaborative-features.js`
5. Start development: `npm run dev`

### Code Style

- Follow existing TypeScript patterns
- Add comprehensive JSDoc comments
- Write tests for new features
- Update documentation

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit PR with detailed description

## 📄 License

This collaborative editing system is part of Taxomind LMS and follows the same license terms.

---

For more information or support, please refer to the main project documentation or create an issue in the repository.