# 📱 Messages Page Redesign - Implementation Progress

**Project**: Taxomind LMS Messaging System Redesign
**Started**: January 2025
**Current Phase**: Phase 2 - Smart Features
**Status**: Phase 1 Complete ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 1: Core Improvements ✅](#phase-1-core-improvements-)
3. [Phase 2: Smart Features 🔄](#phase-2-smart-features-)
4. [Phase 3: AI Integration 📅](#phase-3-ai-integration-)
5. [Phase 4: Advanced Features 📅](#phase-4-advanced-features-)
6. [Technical Stack](#technical-stack)
7. [File Structure](#file-structure)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Design System](#design-system)
11. [Testing Checklist](#testing-checklist)

---

## Overview

Transforming the basic messaging interface into a **Course-Centric Communication Hub** that enables seamless learner-instructor interaction with AI-powered assistance, rich media support, and intelligent organization.

### Goals
- ✅ Modern, professional UI matching analytics page design
- ✅ Course-centric organization and filtering
- ✅ Smart categorization (Questions, Assignments, Feedback, etc.)
- ✅ Priority system (Normal, High, Urgent)
- 🔄 Real-time updates and notifications
- 📅 AI-powered suggestions and assistance
- 📅 Rich media support (images, files, videos)
- 📅 Video call integration

---

## Phase 1: Core Improvements ✅

**Timeline**: Completed January 2025
**Status**: ✅ COMPLETE

### 1.1 Database Schema Enhancements ✅

**File**: `prisma/schema.prisma`

#### Enhanced Message Model
```prisma
model Message {
  id                             String              @id
  content                        String
  read                           Boolean             @default(false)
  createdAt                      DateTime            @default(now())
  senderId                       String
  recipientId                    String
  courseId                       String?             // NEW
  category                       MessageCategory     @default(GENERAL)  // NEW
  priority                       MessagePriority     @default(NORMAL)   // NEW
  User_Message_recipientIdToUser User                @relation("Message_recipientIdToUser")
  User_Message_senderIdToUser    User                @relation("Message_senderIdToUser")
  Course                         Course?             @relation(fields: [courseId])
  MessageAttachment              MessageAttachment[] // NEW
}
```

#### New Enums
```prisma
enum MessageCategory {
  GENERAL
  QUESTION
  ASSIGNMENT
  FEEDBACK
  TECHNICAL_ISSUE
}

enum MessagePriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

#### New MessageAttachment Model
```prisma
model MessageAttachment {
  id        String   @id @default(cuid())
  messageId String
  fileName  String
  fileUrl   String
  fileType  String
  fileSize  Int
  createdAt DateTime @default(now())
  Message   Message  @relation(fields: [messageId])
}
```

**Migration**: Applied via `npx prisma db push` (no data loss)

---

### 1.2 API Routes ✅

**Files**:
- `app/api/messages/route.ts` - Main CRUD operations
- `app/api/messages/upload/route.ts` - File attachment management

#### GET /api/messages
**Features**:
- ✅ Query filtering by `courseId`, `category`, `priority`
- ✅ Returns messages for both sent and received
- ✅ Includes User, Course, and MessageAttachment relations
- ✅ Ordered by `createdAt DESC`
- ✅ Authentication required

**Query Parameters**:
```typescript
?courseId=course-123
&category=QUESTION
&priority=URGENT
```

**Response**:
```typescript
[
  {
    id: "msg_123",
    content: "Need help with assignment",
    category: "ASSIGNMENT",
    priority: "URGENT",
    courseId: "course-123",
    Course: { id: "...", title: "Web Development" },
    MessageAttachment: [...]
  }
]
```

#### POST /api/messages
**Features**:
- ✅ Zod validation (content 1-2000 chars)
- ✅ Optional `courseId`, `category`, `priority`
- ✅ Auto-generates unique message ID
- ✅ Returns created message with relations

**Request Body**:
```typescript
{
  recipientId: "user-456",
  content: "Question about Chapter 3",
  courseId: "course-123",        // optional
  category: "QUESTION",          // optional, default: GENERAL
  priority: "NORMAL"             // optional, default: NORMAL
}
```

#### PATCH /api/messages
**Features**:
- ✅ Mark message as read
- ✅ Authorization check (only recipient can mark as read)

#### POST /api/messages/upload
**Features**:
- ✅ File attachment metadata storage
- ✅ Max file size: 10MB
- ✅ Authorization check
- ✅ Returns attachment record

#### GET /api/messages/upload
**Features**:
- ✅ Fetch attachments for a message
- ✅ Authorization check

---

### 1.3 UI Components - Analytics Color Scheme ✅

**Design System**: Following `theme_color/analytics_page_color.md`

#### message-center.tsx (Main Container)
**Location**: `app/messages/_components/message-center.tsx`

**Features**:
- ✅ Glassmorphism design (`bg-white/80 backdrop-blur-sm`)
- ✅ Gradient header with MessageCircle icon
- ✅ Search input with icon
- ✅ Quick filter buttons (All, Questions, Assignments, Starred, Urgent)
- ✅ Sort dropdown (Recent, Unread, Priority, Course)
- ✅ New message button (blue-indigo gradient)
- ✅ Empty state with styled graphics
- ✅ Responsive layout

**Color Usage**:
```css
/* Sidebar */
bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
border-slate-200/50 dark:border-slate-700/50
rounded-3xl shadow-lg

/* Filter Buttons */
Questions:   from-blue-500 to-indigo-500
Assignments: from-purple-500 to-pink-500
Starred:     from-yellow-500 to-amber-500
Urgent:      from-orange-500 to-red-500
```

#### chat-list.tsx (Conversation List)
**Location**: `app/messages/_components/chat-list.tsx`

**Features**:
- ✅ Real API integration (no mock data)
- ✅ Conversation grouping by sender/recipient pair
- ✅ Course badge display
- ✅ Instructor badge with graduation cap icon
- ✅ Online status indicator (green dot)
- ✅ Category icons (HelpCircle, FileText, AlertCircle, MessageSquare)
- ✅ Priority badges (URGENT shows orange-red gradient)
- ✅ Unread count badge (blue-indigo gradient)
- ✅ Attachment count indicator
- ✅ "X time ago" formatting
- ✅ Search filtering (name, content, course)
- ✅ Multiple sort algorithms
- ✅ Loading state
- ✅ Empty state
- ✅ Hover effects
- ✅ Active conversation highlighting

**Conversation Card Structure**:
```tsx
<div className="relative p-4 rounded-xl">
  {/* Course Badge (top-right) */}
  {/* Instructor Avatar with badges */}
  {/* Instructor info (name, response time) */}
  {/* Timestamp + Priority badge */}
  {/* Category icon + label */}
  {/* Last message preview */}
  {/* Unread badge / Attachment count */}
</div>
```

#### chat-view.tsx (Message Interface)
**Location**: `app/messages/_components/chat-view.tsx`

**Features**:
- ✅ Smart header with instructor info
- ✅ Instructor badge (yellow-amber gradient)
- ✅ "Online" status display
- ✅ Average response time display
- ✅ More options dropdown (View Course, Schedule Meeting, Star)
- ✅ Message bubbles:
  - Own messages: blue-indigo gradient, right-aligned
  - Received: white/slate border, left-aligned
- ✅ Read receipts (Check = sent, CheckCheck = read)
- ✅ File attachment display with file type icons
- ✅ Category tags
- ✅ Timestamps
- ✅ Message category selector
- ✅ Urgent priority toggle button
- ✅ Character counter (0/2000)
- ✅ Emoji button (placeholder)
- ✅ Paperclip button (placeholder)
- ✅ Send button (blue-indigo gradient)
- ✅ Auto-scroll to latest message
- ✅ Enter to send, Shift+Enter for new line
- ✅ Loading state

**Message Bubble Design**:
```css
/* Own Message */
bg-gradient-to-r from-blue-500 to-indigo-500 text-white
rounded-2xl shadow-sm

/* Received Message */
bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
rounded-2xl shadow-sm
```

#### new-message-dialog.tsx (New Conversation)
**Location**: `app/messages/_components/new-message-dialog.tsx`

**Features**:
- ✅ Glassmorphism modal dialog
- ✅ Gradient header with GraduationCap icon
- ✅ Instructor search input
- ✅ Selected user preview card
- ✅ Instructor list with avatars
- ✅ Instructor badges (yellow-amber gradient)
- ✅ Remove selected user (X button)
- ✅ Loading state
- ✅ Empty state
- ✅ Cancel/Start Chat buttons
- ✅ Gradient CTA buttons

**Mock Data**: Currently using mock instructors (TODO: Replace with real API)

---

### 1.4 Design System Compliance ✅

**Reference**: `theme_color/analytics_page_color.md`

#### Page Background
```css
/* Light Mode */
background: linear-gradient(to bottom right,
  #f8fafc,     /* from-slate-50 */
  #dbeafe80,   /* via-blue-50/30 */
  #e0e7ff66    /* to-indigo-50/40 */
);

/* Dark Mode */
background: linear-gradient(to bottom right,
  #0f172a,     /* from-slate-900 */
  #1e293b,     /* via-slate-800 */
  #334155      /* to-slate-700 */
);
```

#### Card Backgrounds (Glassmorphism)
```css
/* Light Mode */
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(226, 232, 240, 0.5);
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
border-radius: 1.5rem;

/* Dark Mode */
background: rgba(30, 41, 59, 0.8);
border: 1px solid rgba(51, 65, 85, 0.5);
```

#### Color Palette Usage
| Purpose | Gradient | Usage |
|---------|----------|-------|
| Primary Actions | `from-blue-500 to-indigo-500` | Send button, New message, Filter (All) |
| Questions | `from-blue-500 to-indigo-500` | Question filter, Question badge |
| Assignments | `from-purple-500 to-pink-500` | Assignment filter |
| Starred | `from-yellow-500 to-amber-500` | Starred filter, Instructor badges |
| Urgent | `from-orange-500 to-red-500` | Urgent filter, Priority badges |
| Success/Sent | `from-emerald-500 to-teal-500` | Future use (message sent confirmation) |
| Online Status | `bg-emerald-500` | Green dot indicator |

#### Typography
```css
/* Headers */
text-lg font-semibold text-slate-900 dark:text-white

/* Body Text */
text-sm text-slate-600 dark:text-slate-400

/* Muted Text */
text-xs text-slate-400

/* Badge Text */
text-xs font-medium
```

#### Spacing
```css
/* Card Padding */
p-4

/* Component Gaps */
gap-2, gap-3, gap-4

/* Border Radius */
rounded-xl (12px) - Inputs, selects
rounded-2xl (16px) - Message bubbles
rounded-3xl (24px) - Main containers
```

---

### 1.5 Code Quality ✅

#### TypeScript Standards
- ✅ No `any` types (strict mode)
- ✅ Proper interface definitions
- ✅ Optional chaining for safety
- ✅ Type guards where needed

#### Validation
- ✅ Zod schemas on all API routes
- ✅ Content length limits (2000 chars)
- ✅ File size limits (10MB)
- ✅ Required field validation

#### Error Handling
- ✅ Try-catch blocks in all async functions
- ✅ Proper error logging
- ✅ User-friendly error messages
- ✅ Loading states
- ✅ Empty states

#### React Best Practices
- ✅ useEffect with proper dependencies (with eslint-disable where intentional)
- ✅ Proper cleanup functions
- ✅ Memoization where needed
- ✅ Framer Motion animations
- ✅ Accessible components (ARIA labels)

#### Linting
- ✅ 0 ESLint errors
- ✅ Intentional warnings suppressed with comments
- ✅ Pre-existing warnings documented

---

## Phase 2: Smart Features ✅

**Timeline**: January 2025
**Status**: ✅ COMPLETE (100%)

### ✅ Phase 2 Completed Features

| Feature | Status | Files Created | Description |
|---------|--------|---------------|-------------|
| Notification System | ✅ Complete | `app/api/notifications/route.ts`, `components/notifications/notification-dropdown.tsx` | Real-time notifications for new messages with badge UI |
| Message Templates | ✅ Complete | `app/api/messages/templates/route.ts`, `app/messages/_components/templates-popover.tsx`, `prisma/seeds/message-templates.ts` | Pre-written message templates with variables |
| Enhanced Read Receipts | ✅ Complete | Updated Message model with `deliveredAt`, `readAt` fields | Timestamp tracking for message read status |
| Real-Time Infrastructure | ✅ Complete | `lib/socket-client.ts`, `hooks/use-socket.ts`, `hooks/use-realtime-messages.ts` | Socket.io client setup with event handlers |
| Typing Indicators | ✅ Complete | `hooks/use-typing-indicator.ts`, `app/messages/_components/typing-indicator.tsx` | Debounced typing status with animated UI |
| Advanced Search | ✅ Complete | `app/api/messages/search/route.ts`, `app/messages/_components/search-dialog.tsx` | Full-text search with filters and highlighting |

---

### 2.1 Notification System ✅

**Status**: ✅ COMPLETE
**Completion Date**: January 2025

**Features Implemented**:
- ✅ In-app notification dropdown with bell icon
- ✅ Unread count badge with gradient styling
- ✅ Real-time notification polling (30s intervals)
- ✅ Mark as read functionality (single & bulk)
- ✅ Delete notifications
- ✅ Link to related messages
- ✅ Support for multiple notification types (NEW_MESSAGE, MESSAGE_REPLY, URGENT_MESSAGE, etc.)
- ✅ Beautiful UI with animations matching analytics page design

**Database Models**:
```prisma
model Notification {
  id                String                   @id @default(cuid())
  userId            String
  type              String
  notificationType  MessageNotificationType?
  title             String
  message           String
  content           String?
  read              Boolean                  @default(false)
  messageId         String?
  link              String?
  createdAt         DateTime                 @default(now())
  User              User                     @relation(fields: [userId])
  Message           Message?                 @relation(fields: [messageId])

  @@index([userId])
  @@index([read])
  @@index([createdAt])
}

enum MessageNotificationType {
  NEW_MESSAGE
  MESSAGE_REPLY
  URGENT_MESSAGE
  ASSIGNMENT_REMINDER
  COURSE_UPDATE
}
```

**API Endpoints**:
```typescript
// GET /api/notifications - Get notifications with filters
// Query params: unreadOnly (boolean), limit (number), offset (number)
// Returns: { notifications, unreadCount, total }

// POST /api/notifications - Create new notification
// Body: { title, message, content?, notificationType?, messageId?, link? }

// PATCH /api/notifications - Mark as read
// Body: { notificationId } | { notificationIds: [] } | { markAllAsRead: true }

// DELETE /api/notifications?id={id} - Delete notification
```

**UI Component** (`components/notifications/notification-dropdown.tsx`):
- Dropdown menu with bell icon trigger
- Animated unread badge with count
- Scrollable notification list with 400px max height
- Each notification shows:
  - Avatar (for message notifications)
  - Icon (for system notifications)
  - Title and content preview
  - Time ago (e.g., "5 minutes ago")
  - Category badge
  - Read/unread indicator
  - Quick actions (mark read, delete)
- "View all notifications" link
- "Mark all read" button
- Empty state with friendly message

**Color Scheme** (Analytics Page Theme):
```css
/* Unread badge */
.unread-badge { background: linear-gradient(to right, #f97316, #ef4444); }

/* Primary actions */
.primary-action { background: linear-gradient(to right, #3b82f6, #6366f1); }

/* Notification types */
.new-message { color: #3b82f6; }
.message-reply { color: #6366f1; }
.urgent { color: #ef4444; }
.assignment { color: #a855f7; }
.course-update { color: #f59e0b; }
```

**Usage Example**:
```tsx
import { NotificationDropdown } from "@/components/notifications";

// In navigation/header
<NotificationDropdown className="ml-auto" />
```

---

### 2.2 Message Templates System ✅

**Status**: ✅ COMPLETE
**Completion Date**: January 2025

**Features Implemented**:
- ✅ Pre-defined default templates for common scenarios
- ✅ User can create custom templates
- ✅ Template categories (GENERAL, QUESTION, ASSIGNMENT, TECHNICAL_ISSUE, FEEDBACK)
- ✅ Variable insertion ({{variable_name}} syntax)
- ✅ Template search and filtering
- ✅ Edit/delete custom templates
- ✅ Beautiful popover UI in chat view
- ✅ Automatic variable extraction and placeholder replacement

**Database Model**:
```prisma
model MessageTemplate {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  category    String
  variables   String[] @default([])
  isDefault   Boolean  @default(true)
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  User        User?    @relation("UserMessageTemplates", fields: [userId])

  @@index([category])
  @@index([userId])
}
```

**Default Templates** (8 pre-seeded):
1. **Question about Course Material** - For asking about topics
2. **Assignment Help Request** - For assignment-related questions
3. **Technical Issue Report** - For reporting bugs/issues
4. **Course Feedback** - For providing feedback
5. **General Inquiry** - For general questions
6. **Clarification Request** - For seeking clarifications
7. **Extension Request** - For requesting deadline extensions
8. **Thank You Note** - For thanking instructors

**API Endpoints**:
```typescript
// GET /api/messages/templates - Get templates
// Query params: category (string), includeDefaults (boolean, default: true)
// Returns: { templates }

// POST /api/messages/templates - Create template
// Body: { title, content, category, variables? }

// PATCH /api/messages/templates - Update template
// Body: { templateId, title?, content?, category?, variables? }

// DELETE /api/messages/templates?id={id} - Delete template
```

**UI Component** (`app/messages/_components/templates-popover.tsx`):
- Popover trigger with FileText icon
- Search bar for filtering templates
- Category dropdown filter
- Scrollable template list (400px max height)
- Each template shows:
  - Title with category badge
  - Content preview (2 lines max)
  - Variable tags
  - Edit/delete buttons (custom templates only)
- "New Template" button
- Template creation/editing dialog with:
  - Title input
  - Category selector
  - Content textarea with variable hints
  - Auto-detection of {{variable}} placeholders

**Variable System**:
```typescript
// Template content with variables:
"Hi {{instructor_name}},\n\nI have a question about {{topic}}..."

// On selection, variables are replaced with placeholders:
"Hi [INSTRUCTOR NAME],\n\nI have a question about [TOPIC]..."

// User fills in placeholders before sending
```

**Integration in Chat View**:
```tsx
// Added to chat-view.tsx input area:
<TemplatesPopover
  onSelectTemplate={(content) => setNewMessage(content)}
  currentCategory={category}
/>
```

**Seed Script** (`prisma/seeds/message-templates.ts`):
- Creates 8 default templates on first run
- Checks for existing templates to avoid duplicates
- Can be run via: `seedMessageTemplates()` function

---

### 2.3 Enhanced Read Receipts ✅

**Status**: ✅ COMPLETE
**Completion Date**: January 2025

**Features Implemented**:
- ✅ Timestamp tracking for message delivery
- ✅ Timestamp tracking for message read
- ✅ Enhanced Message model with new fields
- ✅ Visual indicators (Check vs CheckCheck icons)
- ✅ Ready for tooltip enhancement (infrastructure in place)

**Database Schema Update**:
```prisma
model Message {
  id          String   @id
  content     String
  read        Boolean  @default(false)
  deliveredAt DateTime?  // ✅ NEW
  readAt      DateTime?  // ✅ NEW
  createdAt   DateTime @default(now())
  // ... other fields
}
```

**Current Visual Implementation**:
```tsx
{isOwn && (
  <div className="flex items-center gap-1">
    {message.read ? (
      <CheckCheck className="w-3 h-3 text-blue-500" />
    ) : (
      <Check className="w-3 h-3 text-slate-400" />
    )}
  </div>
)}
```

**Future Enhancement (Planned)**:
```tsx
<Tooltip>
  <TooltipTrigger>
    {message.read ? (
      <CheckCheck className="w-3 h-3 text-blue-500" />
    ) : (
      <Check className="w-3 h-3 text-slate-400" />
    )}
  </TooltipTrigger>
  <TooltipContent>
    {message.readAt
      ? `Read at ${format(message.readAt, "MMM d, h:mm a")}`
      : message.deliveredAt
      ? `Delivered at ${format(message.deliveredAt, "MMM d, h:mm a")}`
      : 'Sent'
    }
  </TooltipContent>
</Tooltip>
```

**API Integration**:
- Message API automatically sets `deliveredAt` when message is created
- `readAt` can be set when marking messages as read
- Both timestamps are included in API responses

---

### 2.4 Real-Time Messaging Infrastructure ✅

**Status**: ✅ COMPLETE
**Completion Date**: January 2025

**Features Implemented**:
- ✅ Socket.io client setup and configuration
- ✅ Auto-reconnection with exponential backoff
- ✅ Event emitters for typing, message sent, message read
- ✅ Event listeners for new messages, typing status, read receipts
- ✅ React hooks for easy integration (`useSocket`, `useRealTimeMessages`)
- ✅ Connection state management
- ✅ Clean disconnection on unmount

**Socket.io Client** (`lib/socket-client.ts`):
```typescript
// Connection setup with auto-reconnect
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Event emitters
emitTyping(conversationId, userId)
emitStopTyping(conversationId, userId)
emitMessageSent(message)
emitMessageRead(messageId, conversationId)

// Event listeners
onNewMessage(callback)       // New message received
onTyping(callback)           // User started typing
onStopTyping(callback)       // User stopped typing
onMessageRead(callback)      // Message was read
onUserOnline(callback)       // User came online
onUserOffline(callback)      // User went offline
```

**React Hooks**:

1. **`useSocket`** - Main socket connection hook
```typescript
const { socket, isConnected } = useSocket();
// Manages connection lifecycle
// Auto-connects on mount, disconnects on unmount
```

2. **`useRealTimeMessages`** - Message sync hook
```typescript
const { sendMessage, markMessageAsRead } = useRealTimeMessages({
  conversationId,
  userId,
  onMessageReceived: (message) => addToMessages(message),
  onMessageReadUpdate: (data) => updateReadStatus(data),
});
```

**Environment Setup**:
```env
# .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Socket.io Server** ✅ COMPLETE (`server/socket-server.ts`):
- ✅ Socket.io server on port 3001
- ✅ Event broadcasting for conversations (typing, messages, read receipts)
- ✅ Room management for conversations (join/leave)
- ✅ Authentication middleware (userId/userName validation)
- ✅ User online/offline status tracking
- ✅ Health check endpoint at `/health`
- ✅ Graceful shutdown handling
- ✅ Comprehensive logging for all events

**Server Scripts**:
```bash
npm run socket:dev    # Start Socket.io server (development)
npm run socket:start  # Start Socket.io server (production)
```

**Health Check**:
```bash
curl http://localhost:3001/health
# Returns: { status, timestamp, connectedUsers, connections }
```

**Event Handlers**:
- `join_conversation` / `leave_conversation` - Room management
- `typing` / `stop_typing` - Typing indicators with broadcast
- `message_sent` - Real-time message delivery
- `message_read` - Read receipt tracking
- `user_online` / `user_offline` - User status tracking

**Documentation**: See `server/README.md` for complete guide

**Integration in Chat View** ✅:
- ✅ Socket connection on component mount
- ✅ Auto-join conversation room
- ✅ Typing indicator events on textarea
- ✅ Message broadcast via Socket.io
- ✅ Cleanup on unmount

---

### 2.5 Typing Indicators ✅

**Status**: ✅ COMPLETE
**Completion Date**: January 2025

**Features Implemented**:
- ✅ Debounced typing events (500ms delay)
- ✅ Auto-stop after 3 seconds of inactivity
- ✅ Multi-user typing support
- ✅ Beautiful animated UI with 3 bouncing dots
- ✅ Clean timeout management
- ✅ Automatic cleanup on unmount

**Typing Indicator Hook** (`hooks/use-typing-indicator.ts`):
```typescript
const { typingUsers, isAnyoneTyping, handleTyping, handleStopTyping } =
  useTypingIndicator(conversationId, currentUserId);

// Usage in input field
<Textarea
  onChange={() => handleTyping()}
  onBlur={() => handleStopTyping()}
/>
```

**Features**:
- **Debouncing**: 500ms delay before emitting typing event
- **Auto-Stop**: 3-second timeout clears typing status automatically
- **Multi-User**: Tracks multiple users typing simultaneously
- **Cleanup**: Automatic timestamp-based expiration of stale indicators

**Typing Indicator Component** (`app/messages/_components/typing-indicator.tsx`):
```tsx
<TypingIndicator typingUsers={typingUsers} userAvatar={avatar} />

// Displays:
// - User avatar
// - 3 animated bouncing dots
// - "{name} is typing..." or "{name} and 2 others are typing..."
// - Auto-hides when typing stops
```

**Animation**:
```tsx
// 3 dots with staggered bounce animation
<motion.div
  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
  transition={{ repeat: Infinity, duration: 1, delay: 0 }}  // Dot 1
  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} // Dot 2
  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} // Dot 3
/>
```

**Integration** ✅ COMPLETE:
- ✅ Integrated into `app/messages/_components/chat-view.tsx`
- ✅ Positioned below messages list with AnimatePresence wrapper
- ✅ Connected to textarea onChange and onBlur events
- ✅ Auto-stops typing on message send
- ✅ Displays other users' typing status in real-time

---

### 2.6 Advanced Search ✅

**Status**: ✅ COMPLETE
**Completion Date**: January 2025

**Features Implemented**:
- ✅ Full-text search in message content (case-insensitive)
- ✅ Filter by date range (from/to)
- ✅ Filter by course
- ✅ Filter by category (GENERAL, QUESTION, ASSIGNMENT, etc.)
- ✅ Filter by priority (LOW, NORMAL, HIGH, URGENT)
- ✅ Filter by attachment presence
- ✅ Filter unread messages only
- ✅ Search result highlighting with `<mark>` tags
- ✅ Beautiful search dialog with animations
- ✅ Pagination support
- ✅ Integrated into message center

**API Endpoint** (`app/api/messages/search/route.ts`):
```typescript
// GET /api/messages/search
{
  query: "search term",
  filters: {
    dateFrom: "2025-01-01",
    dateTo: "2025-01-31",
    courseId: "course_123",
    category: "QUESTION",
    priority: "URGENT",
    hasAttachments: true,
    unreadOnly: false
  },
  limit: 20,
  offset: 0
}

// Response:
{
  messages: [...],               // With highlightedContent field
  total: 45,
  query: "search term",
  filters: {...},
  pagination: {
    limit: 20,
    offset: 0,
    hasMore: true
  }
}
```

**Search Dialog** (`app/messages/_components/search-dialog.tsx`):
- **Search Input**: Focus-first with Enter key support
- **Filter Toggle**: Collapsible filter panel
- **Filters**:
  - Category dropdown (all, general, question, assignment, technical, feedback)
  - Priority dropdown (all, low, normal, high, urgent)
  - Has attachments checkbox
  - Unread only checkbox
- **Results List**:
  - Highlighted search matches
  - Message metadata (sender, date, course, category, priority)
  - Unread indicator
  - Attachment count badge
  - Click to navigate to message
- **Empty States**:
  - "Start searching" state
  - "No results found" state with helpful message
- **Loading State**: Spinner during search

**Search Highlighting**:
```typescript
// Server-side highlighting
const highlightedContent = message.content.replace(
  new RegExp(`(${query})`, "gi"),
  "<mark>$1</mark>"
);

// Rendered with dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
```

**UI Design**:
- Glassmorphism modal (max-width: 3xl, max-height: 80vh)
- Scrollable results area (max-height: 400px)
- Analytics page color scheme
- Smooth animations with Framer Motion
- Responsive layout

**Integration**:
```tsx
// In message-center.tsx
<Input
  placeholder="Filter conversations..."
  onFocus={() => setIsSearchDialogOpen(true)}
  readOnly
/>

<SearchDialog
  open={isSearchDialogOpen}
  onClose={() => setIsSearchDialogOpen(false)}
  onMessageSelect={(messageId) => navigateToMessage(messageId)}
/>
```

---

### 2.4 Message Templates 📅

**Goal**: Pre-written responses for common questions

**Template Categories**:
1. **Assignment Help**
   - "Could you explain [topic] from Chapter [X]?"
   - "I'm stuck on [assignment name]. Can you help?"
   - "When is the deadline for [assignment]?"

2. **Technical Issues**
   - "I'm encountering an error: [description]"
   - "The [feature] is not working as expected"
   - "I can't access [resource]"

3. **General Questions**
   - "Could you recommend resources for [topic]?"
   - "What are the prerequisites for [course/topic]?"
   - "How do I prepare for the exam?"

**UI Component**:
```tsx
<TemplatesPopover>
  <PopoverTrigger>
    <Button variant="ghost" size="sm">
      <FileText className="w-4 h-4 mr-2" />
      Templates
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Tabs>
      <TabsList>
        <TabsTrigger value="assignment">Assignment</TabsTrigger>
        <TabsTrigger value="technical">Technical</TabsTrigger>
        <TabsTrigger value="general">General</TabsTrigger>
      </TabsList>
      <TabsContent>
        {templates.map(template => (
          <Button onClick={() => insertTemplate(template)}>
            {template.title}
          </Button>
        ))}
      </TabsContent>
    </Tabs>
  </PopoverContent>
</TemplatesPopover>
```

**Database Model**:
```prisma
model MessageTemplate {
  id          String   @id @default(cuid())
  title       String
  content     String
  category    String
  variables   String[] // [topic], [assignment], etc.
  isDefault   Boolean  @default(true)
  userId      String?  // NULL for system templates
  createdAt   DateTime @default(now())
  User        User?    @relation(fields: [userId])
}
```

**Files to Create**:
- `app/messages/_components/templates-popover.tsx`
- `app/api/messages/templates/route.ts`
- `lib/message-templates.ts` - Default templates

---

### 2.5 Read Receipts (Enhanced) 📅

**Current**: Basic check icons
**Enhanced**:
- [ ] Timestamp when message was read
- [ ] "Read by [name] at [time]" tooltip
- [ ] Batch read status for multiple recipients (future group chats)

**Visual Enhancement**:
```tsx
<Tooltip>
  <TooltipTrigger>
    {message.read ? (
      <CheckCheck className="w-3 h-3 text-blue-500" />
    ) : (
      <Check className="w-3 h-3 text-slate-400" />
    )}
  </TooltipTrigger>
  <TooltipContent>
    {message.read
      ? `Read by ${recipient.name} at ${formatTime(message.readAt)}`
      : 'Delivered'
    }
  </TooltipContent>
</Tooltip>
```

**Database Update**:
```prisma
model Message {
  // ... existing fields
  deliveredAt DateTime?
  readAt      DateTime?
}
```

---

### 2.6 Notification System 📅

**Features to Implement**:
- [ ] In-app notification center
- [ ] Browser push notifications
- [ ] Email notifications (configurable)
- [ ] Notification preferences
- [ ] Notification grouping
- [ ] Mark all as read
- [ ] Notification sound toggle

**Notification Types**:
1. New message received
2. Message marked as urgent
3. Instructor replied
4. Assignment deadline reminder (via message)

**UI Component**:
```tsx
<NotificationDropdown>
  <NotificationBadge count={unreadCount} />
  <NotificationList>
    {notifications.map(notif => (
      <NotificationItem
        type={notif.type}
        message={notif.message}
        timestamp={notif.timestamp}
        read={notif.read}
        onClick={() => handleNotificationClick(notif)}
      />
    ))}
  </NotificationList>
</NotificationDropdown>
```

**Database Model**:
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // MESSAGE, URGENT, REPLY
  title     String
  content   String
  read      Boolean  @default(false)
  messageId String?
  createdAt DateTime @default(now())
  User      User     @relation(fields: [userId])
  Message   Message? @relation(fields: [messageId])
}
```

**Files to Create**:
- `app/messages/_components/notification-dropdown.tsx`
- `app/api/notifications/route.ts`
- `hooks/use-notifications.ts`
- `lib/notification-service.ts`

---

## Phase 3: AI Integration 📅

**Timeline**: Week 5-6
**Status**: 📅 PLANNED

### 3.1 AI-Powered Suggestions 📅

**Features**:
- [ ] Grammar and spell checking
- [ ] Tone adjustment (formal/casual)
- [ ] Auto-complete suggestions
- [ ] Smart reply (AI-generated quick responses)
- [ ] Message expansion (elaborate on point)
- [ ] Message summarization (TL;DR)

**Implementation**:
```typescript
// Using OpenAI API
const suggestions = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant that improves student-instructor communication."
    },
    {
      role: "user",
      content: `Improve this message: "${userMessage}"`
    }
  ]
});
```

**UI Component**:
```tsx
<AISuggestionBanner>
  <Sparkles className="w-4 h-4 text-purple-500" />
  <div>
    <h4>AI Suggestion</h4>
    <p>{aiSuggestion.text}</p>
  </div>
  <Button onClick={useSuggestion}>Use This</Button>
</AISuggestionBanner>
```

---

### 3.2 Auto-Categorization 📅

**Goal**: AI automatically categorizes incoming messages

**Features**:
- [ ] Analyze message content
- [ ] Assign category (QUESTION, ASSIGNMENT, etc.)
- [ ] Confidence score
- [ ] Manual override option

**Implementation**:
```typescript
const category = await classifyMessage(messageContent);
// Returns: { category: 'QUESTION', confidence: 0.95 }
```

---

### 3.3 Smart Search (Semantic) 📅

**Goal**: Natural language search

**Features**:
- [ ] "Show me all assignment questions from last week"
- [ ] "Find messages about React hooks"
- [ ] Vector search using embeddings
- [ ] Relevance scoring

**Implementation**:
- Use OpenAI embeddings
- Store vectors in database or vector DB (Pinecone, Weaviate)
- Cosine similarity search

---

### 3.4 Related Resources 📅

**Goal**: AI suggests relevant course materials

**Features**:
- [ ] Analyze message context
- [ ] Find related chapters/sections
- [ ] Suggest documentation
- [ ] Link to similar Q&A

**UI Component**:
```tsx
<AIResourcePanel>
  <h4>Related Resources</h4>
  {resources.map(resource => (
    <ResourceCard
      title={resource.title}
      chapter={resource.chapter}
      relevance={resource.relevance}
    />
  ))}
</AIResourcePanel>
```

---

### 3.5 Conversation Insights 📅

**Features**:
- [ ] Conversation summary
- [ ] Key topics discussed
- [ ] Action items extracted
- [ ] Sentiment analysis
- [ ] Response time analytics

**UI Component**:
```tsx
<ConversationInsights>
  <InsightCard title="Summary">
    <p>15 messages exchanged about React Hooks...</p>
  </InsightCard>
  <InsightCard title="Avg Response Time">
    <p>2.5 hours</p>
  </InsightCard>
  <InsightCard title="Topics">
    <Tag>useEffect</Tag>
    <Tag>useState</Tag>
  </InsightCard>
</ConversationInsights>
```

---

## Phase 4: Advanced Features 📅

**Timeline**: Week 7-8
**Status**: 📅 PLANNED

### 4.1 Video Call Integration 📅

**Features**:
- [ ] Schedule video meetings
- [ ] Instant video call button
- [ ] Integration with Zoom/Google Meet/Jitsi
- [ ] Calendar sync
- [ ] Meeting reminders
- [ ] Record meetings (optional)

**UI Component**:
```tsx
<VideoCallButton
  onClick={startVideoCall}
  className="bg-gradient-to-r from-green-500 to-emerald-500"
>
  <Video className="w-4 h-4 mr-2" />
  Start Video Call
</VideoCallButton>
```

---

### 4.2 Meeting Scheduling 📅

**Features**:
- [ ] Calendar picker
- [ ] Time zone handling
- [ ] Instructor availability
- [ ] Auto-send calendar invite
- [ ] Reschedule/cancel options

**Database Model**:
```prisma
model Meeting {
  id            String   @id @default(cuid())
  title         String
  description   String?
  startTime     DateTime
  endTime       DateTime
  timezone      String
  meetingUrl    String?
  instructorId  String
  studentId     String
  courseId      String?
  status        String   @default("SCHEDULED")
  createdAt     DateTime @default(now())
  Instructor    User     @relation("MeetingInstructor", fields: [instructorId])
  Student       User     @relation("MeetingStudent", fields: [studentId])
  Course        Course?  @relation(fields: [courseId])
}
```

---

### 4.3 Conversation Ratings 📅

**Features**:
- [ ] Rate instructor response quality
- [ ] Rate response helpfulness
- [ ] Rate response time
- [ ] Leave feedback
- [ ] Anonymous ratings

**UI Component**:
```tsx
<RatingDialog>
  <StarRating value={rating} onChange={setRating} />
  <Textarea placeholder="Leave feedback (optional)" />
  <Button>Submit Rating</Button>
</RatingDialog>
```

---

### 4.4 Analytics Dashboard 📅

**Features**:
- [ ] Message statistics
- [ ] Response time trends
- [ ] Category breakdown
- [ ] Course-wise analytics
- [ ] Instructor performance metrics
- [ ] Student engagement metrics

**Metrics**:
1. Total messages sent/received
2. Average response time
3. Messages by category
4. Peak messaging hours
5. Resolution rate
6. Satisfaction score

---

### 4.5 Mobile Optimization 📅

**Features**:
- [ ] Mobile-first responsive design
- [ ] Touch gestures (swipe to archive/delete)
- [ ] Bottom navigation
- [ ] Floating action button
- [ ] Pull-to-refresh
- [ ] Offline mode
- [ ] Service worker caching

**Breakpoints**:
```css
/* Mobile */
< 768px: Stack layout, show list OR chat

/* Tablet */
768px - 1024px: Collapsible sidebar

/* Desktop */
> 1024px: Full three-column layout
```

---

## Technical Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4
- **Components**: Radix UI primitives
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect, useContext)
- **Forms**: React Hook Form (future)
- **Validation**: Zod

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (via Prisma)
- **ORM**: Prisma 6.18.0
- **Authentication**: NextAuth.js v5
- **Real-time**: Socket.io / Pusher (planned)
- **File Storage**: AWS S3 / Cloudinary (planned)
- **AI**: OpenAI API (planned)

### DevOps
- **Hosting**: Vercel / Railway
- **Database**: Railway PostgreSQL
- **Monitoring**: Sentry (future)
- **Analytics**: Vercel Analytics (future)

---

## File Structure

```
app/
├── messages/
│   ├── page.tsx                        # Main page (✅)
│   └── _components/
│       ├── message-center.tsx          # Main container (✅)
│       ├── chat-list.tsx               # Conversation list (✅)
│       ├── chat-view.tsx               # Message interface (✅)
│       ├── new-message-dialog.tsx      # New conversation (✅)
│       ├── search-dialog.tsx           # Advanced search (📅)
│       ├── templates-popover.tsx       # Message templates (📅)
│       ├── notification-dropdown.tsx   # Notifications (📅)
│       ├── ai-suggestion-banner.tsx    # AI suggestions (📅)
│       ├── video-call-button.tsx       # Video call (📅)
│       └── rating-dialog.tsx           # Conversation rating (📅)
│
├── api/
│   └── messages/
│       ├── route.ts                    # CRUD operations (✅)
│       ├── upload/
│       │   └── route.ts                # File uploads (✅)
│       ├── search/
│       │   └── route.ts                # Advanced search (📅)
│       ├── templates/
│       │   └── route.ts                # Templates CRUD (📅)
│       └── ai/
│           ├── suggest/route.ts        # AI suggestions (📅)
│           └── categorize/route.ts     # Auto-categorize (📅)
│
hooks/
├── use-socket.ts                       # WebSocket connection (📅)
├── use-typing-indicator.ts             # Typing state (📅)
├── use-message-search.ts               # Search logic (📅)
└── use-notifications.ts                # Notification logic (📅)
│
lib/
├── socket.ts                           # Socket client (📅)
├── notification-service.ts             # Push notifications (📅)
└── message-templates.ts                # Default templates (📅)
│
prisma/
└── schema.prisma                       # Database schema (✅)
```

---

## Database Schema

### Current Models

```prisma
// ✅ IMPLEMENTED
model Message {
  id                             String              @id
  content                        String
  read                           Boolean             @default(false)
  createdAt                      DateTime            @default(now())
  senderId                       String
  recipientId                    String
  courseId                       String?
  category                       MessageCategory     @default(GENERAL)
  priority                       MessagePriority     @default(NORMAL)
  User_Message_recipientIdToUser User                @relation("Message_recipientIdToUser")
  User_Message_senderIdToUser    User                @relation("Message_senderIdToUser")
  Course                         Course?             @relation(fields: [courseId])
  MessageAttachment              MessageAttachment[]

  @@index([recipientId])
  @@index([senderId])
  @@index([courseId])
}

// ✅ IMPLEMENTED
model MessageAttachment {
  id        String   @id @default(cuid())
  messageId String
  fileName  String
  fileUrl   String
  fileType  String
  fileSize  Int
  createdAt DateTime @default(now())
  Message   Message  @relation(fields: [messageId])

  @@index([messageId])
}

// ✅ IMPLEMENTED
enum MessageCategory {
  GENERAL
  QUESTION
  ASSIGNMENT
  FEEDBACK
  TECHNICAL_ISSUE
}

// ✅ IMPLEMENTED
enum MessagePriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

### Planned Models

```prisma
// 📅 PHASE 2
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  content   String
  read      Boolean  @default(false)
  messageId String?
  createdAt DateTime @default(now())
  User      User     @relation(fields: [userId])
  Message   Message? @relation(fields: [messageId])

  @@index([userId])
  @@index([read])
}

// 📅 PHASE 2
model MessageTemplate {
  id          String   @id @default(cuid())
  title       String
  content     String
  category    String
  variables   String[]
  isDefault   Boolean  @default(true)
  userId      String?
  createdAt   DateTime @default(now())
  User        User?    @relation(fields: [userId])

  @@index([category])
}

// 📅 PHASE 4
model Meeting {
  id            String   @id @default(cuid())
  title         String
  description   String?
  startTime     DateTime
  endTime       DateTime
  timezone      String
  meetingUrl    String?
  instructorId  String
  studentId     String
  courseId      String?
  status        String   @default("SCHEDULED")
  createdAt     DateTime @default(now())
  Instructor    User     @relation("MeetingInstructor", fields: [instructorId])
  Student       User     @relation("MeetingStudent", fields: [studentId])
  Course        Course?  @relation(fields: [courseId])

  @@index([instructorId])
  @@index([studentId])
  @@index([courseId])
}

// 📅 PHASE 4
model ConversationRating {
  id             String   @id @default(cuid())
  messageId      String   @unique
  rating         Int      // 1-5
  feedback       String?
  responseTime   Int?     // seconds
  helpfulness    Int?     // 1-5
  createdAt      DateTime @default(now())
  Message        Message  @relation(fields: [messageId])

  @@index([rating])
}
```

---

## API Endpoints

### ✅ Implemented

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages` | Get all messages (with filters) | ✅ |
| POST | `/api/messages` | Send new message | ✅ |
| PATCH | `/api/messages` | Mark message as read | ✅ |
| POST | `/api/messages/upload` | Upload attachment metadata | ✅ |
| GET | `/api/messages/upload` | Get message attachments | ✅ |

### 📅 Planned (Phase 2)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/search` | Advanced search | ✅ |
| GET | `/api/messages/templates` | Get templates | ✅ |
| POST | `/api/messages/templates` | Create template | ✅ |
| GET | `/api/notifications` | Get notifications | ✅ |
| PATCH | `/api/notifications/[id]` | Mark notification as read | ✅ |

### 📅 Planned (Phase 3)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/messages/ai/suggest` | Get AI suggestions | ✅ |
| POST | `/api/messages/ai/categorize` | Auto-categorize message | ✅ |
| POST | `/api/messages/ai/summarize` | Summarize conversation | ✅ |

### 📅 Planned (Phase 4)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/meetings` | Schedule meeting | ✅ |
| GET | `/api/meetings` | Get user meetings | ✅ |
| PATCH | `/api/meetings/[id]` | Update meeting | ✅ |
| POST | `/api/messages/[id]/rate` | Rate conversation | ✅ |

---

## Design System

### Color Palette (from analytics_page_color.md)

```css
/* Primary Actions */
from-blue-500 to-indigo-500      /* #3b82f6 → #6366f1 */

/* Instructor/Teacher */
from-yellow-500 to-amber-500     /* #eab308 → #f59e0b */

/* Urgent/Priority */
from-orange-500 to-red-500       /* #f97316 → #ef4444 */

/* Assignments */
from-purple-500 to-pink-500      /* #a855f7 → #ec4899 */

/* Success/Online */
from-emerald-500 to-teal-500     /* #10b981 → #14b8a6 */

/* Backgrounds */
/* Light */ slate-50 → blue-50/30 → indigo-50/40
/* Dark */  slate-900 → slate-800 → slate-700

/* Cards */
/* Light */ white/80 + backdrop-blur
/* Dark */  slate-800/80 + backdrop-blur

/* Borders */
/* Light */ slate-200/50
/* Dark */  slate-700/50
```

### Component Patterns

```tsx
// Glassmorphism Card
<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
                border border-slate-200/50 dark:border-slate-700/50
                rounded-3xl shadow-lg">

// Gradient Button
<Button className="bg-gradient-to-r from-blue-500 to-indigo-500
                   hover:from-blue-600 hover:to-indigo-600
                   text-white shadow-md">

// Badge
<Badge className="bg-gradient-to-r from-yellow-500 to-amber-500
                  text-white text-xs">

// Avatar with Badge
<div className="relative">
  <Avatar />
  <div className="absolute -top-1 -left-1 bg-gradient-to-r from-yellow-500 to-amber-500
                  rounded-full p-1">
    <GraduationCap className="w-3 h-3 text-white" />
  </div>
</div>
```

---

## Testing Checklist

### Phase 1 Testing (✅ Complete)

#### Database
- [x] Message creation with all fields
- [x] Message with courseId association
- [x] Message with category and priority
- [x] MessageAttachment creation
- [x] Proper relations and cascading

#### API Routes
- [x] GET /api/messages returns correct data
- [x] GET /api/messages with filters works
- [x] POST /api/messages creates message
- [x] POST /api/messages validates input
- [x] PATCH /api/messages marks as read
- [x] POST /api/messages/upload stores attachment
- [x] Unauthorized requests return 401

#### UI Components
- [x] message-center renders correctly
- [x] Filter buttons update state
- [x] Sort dropdown works
- [x] New message button opens dialog
- [x] chat-list displays conversations
- [x] chat-list filters by search query
- [x] chat-list sorts correctly
- [x] chat-view displays messages
- [x] chat-view sends messages
- [x] Read receipts display correctly
- [x] Category selector works
- [x] Priority toggle works
- [x] new-message-dialog opens/closes
- [x] Instructor selection works
- [x] Responsive design (mobile, tablet, desktop)

#### Design System
- [x] Color scheme matches analytics page
- [x] Glassmorphism effects working
- [x] Gradients displaying correctly
- [x] Dark mode support
- [x] Animations smooth
- [x] Typography consistent

### Phase 2 Testing (📅 Planned)

#### Real-Time Features
- [ ] WebSocket connection establishes
- [ ] New messages appear without refresh
- [ ] Typing indicators show/hide correctly
- [ ] Online status updates in real-time
- [ ] Unread count updates live
- [ ] Message status updates (sent → read)
- [ ] Notification sounds play
- [ ] Browser notifications work

#### Search & Filters
- [ ] Full-text search returns results
- [ ] Date range filter works
- [ ] Course filter works
- [ ] Category filter works
- [ ] Search highlights matches
- [ ] Search history saves

#### Templates
- [ ] Templates load from database
- [ ] Variable insertion works
- [ ] Custom templates can be created
- [ ] Templates filter by category

#### Notifications
- [ ] Notifications appear on new message
- [ ] Notification badge updates
- [ ] Mark as read works
- [ ] Email notifications send (if enabled)
- [ ] Notification preferences save

---

## Next Steps

### Immediate (Phase 2)
1. ✅ Set up WebSocket infrastructure (Socket.io or Pusher)
2. ✅ Implement real-time message delivery
3. ✅ Add typing indicators
4. ✅ Create notification system
5. ✅ Build advanced search
6. ✅ Implement message templates

### Short-term (Phase 3)
1. Integrate OpenAI API for suggestions
2. Build AI categorization
3. Implement semantic search
4. Add resource recommendations
5. Create conversation insights

### Long-term (Phase 4)
1. Video call integration
2. Meeting scheduler
3. Rating system
4. Analytics dashboard
5. Mobile app optimization

---

## Contributing

When adding new features:

1. **Follow the design system** - Use colors from `analytics_page_color.md`
2. **Match existing patterns** - Consistent component structure
3. **Add TypeScript types** - No `any` types
4. **Validate inputs** - Use Zod schemas
5. **Handle errors** - Proper try-catch and user feedback
6. **Update this document** - Mark features as complete
7. **Write tests** - Unit and integration tests
8. **Check accessibility** - ARIA labels, keyboard navigation

---

## Resources

- [Design System Reference](./theme_color/analytics_page_color.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Radix UI Components](https://www.radix-ui.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Socket.io](https://socket.io/docs/)
- [OpenAI API](https://platform.openai.com/docs)

---

**Last Updated**: January 2025
**Maintained by**: Development Team
**Status**: Phase 1 Complete ✅ | Phase 2 In Progress 🔄
