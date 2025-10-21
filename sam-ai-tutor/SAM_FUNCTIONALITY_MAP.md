# SAM Global Assistant - Complete Functionality Map

## 🔍 Analysis Summary

The old SAM Global Assistant has **extensive functionality** with 75+ API endpoints. Here's the complete breakdown:

---

## 📡 Core API Integration

### Primary API: `/api/sam/context-aware-assistant`
**Purpose**: Main conversational AI with full page context awareness

**Request Payload**:
```typescript
{
  message: string,
  pathname: string,
  pageContext: {
    pageName: string,
    pageType: string,  // 'courses' | 'course-detail' | 'chapter-detail' | etc.
    breadcrumbs: string[],
    capabilities: string[],
    dataContext: {
      forms: Array<{
        id: string,
        purpose: string,
        fields: Array<{
          name: string,
          type: string,
          value: string,
          label: string,
          placeholder: string,
          required: boolean
        }>
      }>,
      buttons: Array<{text: string, disabled: boolean}>,
      detectedAt: string
    },
    parentContext: {
      courseId?: string,
      chapterId?: string,
      sectionId?: string
    }
  },
  conversationHistory: Array<{role: 'user'|'assistant', content: string}>
}
```

**Response**:
```typescript
{
  response: string,           // AI-generated response
  suggestions: string[],      // Context-aware suggestions
  action?: {                  // Executable action
    type: 'form_update' | 'navigation' | 'page_action',
    details: any
  },
  metadata: {
    pageContext: string,
    processingTime: number,
    confidence: number
  }
}
```

---

## 🎯 Core Features

### 1. **Context Detection** (Existing in old component)
```typescript
// Runs every 5 seconds when open
const detectPageContext = () => {
  // Detects:
  - Page title
  - Current URL/pathname
  - All forms with fields
  - All buttons
  - Breadcrumbs
  - Extract courseId/chapterId/sectionId from URL
}
```

### 2. **Quick Actions Generation** (Existing)
```typescript
// Role-based actions
Teacher Actions:
- Generate Content (Sparkles icon)
- Analyze Content (Microscope icon)
- Create Assessment (Target icon)
- Fill Forms (Edit icon)
- Explain Page (HelpCircle icon)

Student Actions:
- Explain Concept (Lightbulb icon)
- Study Tips (Target icon)
- Practice Quiz (Brain icon)
- Explain Page (HelpCircle icon)
```

### 3. **Message Handling** (Existing)
```typescript
// Full conversation flow:
1. User sends message
2. Build context payload with:
   - Current message
   - Page context (forms, buttons, URL)
   - Parent context (courseId, chapterId, sectionId)
   - Last 5 messages for history
3. Send to /api/sam/context-aware-assistant
4. Receive AI response with suggestions
5. Display response with inline action chips
```

### 4. **Action Execution** (Needs implementation)
```typescript
// Action types from API:
'form_update': {
  - update_chapter_title
  - update_chapter_description
  - update_learning_outcomes
  - create_sections
  - publish_chapter
  - unpublish_chapter
  - update_chapter_access (free/paid)
}

'navigation': {
  - Navigate to specific routes
  - Dynamic URL construction
}

'page_action': {
  - refresh: Reload current page
}
```

### 5. **Fallback Responses** (Existing)
```typescript
// Smart fallbacks when API fails:
- Detects 'page' or 'where' → Shows page info
- Detects 'form' or 'field' → Lists forms
- Detects 'description' → Finds description field
- Default → Contextual help
```

---

## 🌐 All 75 SAM API Endpoints

### Chat & Conversation APIs
```
/api/sam/chat                            - Basic chat
/api/sam/chat-enhanced                   - Enhanced chat with engine
/api/sam/context-aware-assistant         - Full context awareness ⭐
/api/sam/conversation                    - Conversation management
/api/sam/conversations/[id]              - Specific conversation
/api/sam/conversations/[id]/messages     - Conversation messages
/api/sam/conversations/summaries         - Conversation summaries
/api/sam/unified-assistant               - Unified interface
/api/sam/enhanced-universal-assistant    - Universal assistant
/api/sam/intelligent-assistant           - Intelligent features
/api/sam/enterprise-intelligence         - Enterprise features
```

### Content Generation APIs
```
/api/sam/content-generation              - Content creation
/api/sam/generate-course-structure-complete - Full course structure
/api/sam/title-suggestions               - Title generation
/api/sam/overview-suggestions            - Overview generation
/api/sam/suggestions                     - General suggestions
/api/sam/learning-objectives             - Learning objectives
```

### Course Management APIs
```
/api/sam/course-assistant                - Course help
/api/sam/course-assistant-enhanced       - Enhanced course help
/api/sam/course-guide                    - Course guidance
/api/sam/course-guide/insights           - Course insights
/api/sam/course-guide/recommendations    - Course recommendations
/api/sam/course-market-analysis          - Market analysis
/api/sam/course-market-analysis/competitors - Competitor analysis
```

### AI Tutor APIs
```
/api/sam/ai-tutor/chat                   - Tutor chat
/api/sam/ai-tutor/achievements           - Student achievements
/api/sam/ai-tutor/adaptive-content       - Adaptive learning
/api/sam/ai-tutor/assessment-engine      - Assessments
/api/sam/ai-tutor/challenges             - Learning challenges
/api/sam/ai-tutor/content-analysis       - Content review
/api/sam/ai-tutor/content-companion      - Learning companion
/api/sam/ai-tutor/create-rubric          - Rubric generation
/api/sam/ai-tutor/detect-emotion         - Emotion detection
/api/sam/ai-tutor/detect-learning-style  - Learning style
/api/sam/ai-tutor/leaderboard            - Gamification leaderboard
/api/sam/ai-tutor/lesson-planner         - Lesson planning
/api/sam/ai-tutor/motivation-engine      - Student motivation
/api/sam/ai-tutor/practice-problems      - Practice generation
/api/sam/ai-tutor/socratic               - Socratic method
/api/sam/ai-tutor/student-insights       - Student analytics
/api/sam/ai-tutor/teacher-insights       - Teacher analytics
/api/sam/ai-tutor/track                  - Progress tracking
/api/sam/ai-tutor/visual-processor       - Visual processing
```

### Analysis & Intelligence APIs
```
/api/sam/blooms-analysis                 - Bloom's Taxonomy analysis
/api/sam/blooms-analysis/student         - Student-specific Bloom's
/api/sam/blooms-recommendations          - Bloom's recommendations
/api/sam/analytics/comprehensive         - Full analytics
/api/sam/collaboration-analytics         - Collaboration metrics
/api/sam/integrated-analysis             - Integrated insights
/api/sam/multimedia-analysis             - Media analysis
/api/sam/predictive-learning             - Predictive analytics
```

### Gamification APIs
```
/api/sam/gamification/achievements       - Achievement system
/api/sam/gamification/challenges         - Challenge system
/api/sam/gamification/challenges/start   - Start challenge
/api/sam/gamification/stats              - Gamification stats
/api/sam/badges                          - Badge system
/api/sam/points                          - Points system
/api/sam/streaks                         - Streak tracking
/api/sam/track-achievement               - Achievement tracking
```

### Assessment & Testing APIs
```
/api/sam/exam-engine                     - Exam generation
/api/sam/exam-engine/adaptive            - Adaptive testing
/api/sam/exam-engine/question-bank       - Question bank
/api/sam/exam-engine/study-guide         - Study guides
```

### AI Research & News APIs
```
/api/sam/ai-news                         - AI news feed
/api/sam/ai-research                     - AI research
/api/sam/ai-trends                       - AI trends
/api/sam/innovation-features             - Innovation tracking
```

### Intelligence & Personalization APIs
```
/api/sam/personalization                 - Personalization engine
/api/sam/learning-profile                - Learning profiles
/api/sam/resource-intelligence           - Resource recommendations
/api/sam/financial-intelligence          - Financial insights
```

### Utility APIs
```
/api/sam/interactions                    - User interactions
/api/sam/stats                           - Statistics
/api/sam/validate                        - Input validation
/api/sam/form-synchronization            - Form sync
```

---

## 🎨 UI Features to Implement

### ✅ Already in New Design
1. Large input field (80px)
2. Chat-first layout
3. Context chips display
4. Smart suggestions
5. Modern gradient design
6. Draggable window
7. Minimize/maximize
8. Dark/light theme

### ❌ Missing from New Design (Need to add)
1. **Full context detection**
   - Form field analysis
   - Button detection
   - URL parameter extraction

2. **API integration**
   - Connect to /api/sam/context-aware-assistant
   - Handle API responses
   - Error handling with fallbacks

3. **Action execution**
   - Form updates
   - Navigation actions
   - Page refresh

4. **Conversation history**
   - Store last 5 messages
   - Send with each request

5. **Inline suggestions**
   - Display API-returned suggestions
   - Clickable to auto-fill input

6. **Quick actions**
   - Role-based action buttons
   - Real API calls

7. **Page-specific capabilities**
   - Different features per page type
   - Contextual help text

---

## 🚀 Implementation Plan

### Phase 1: Core API Integration ✅
```typescript
// Add to redesigned component:
1. Context detection function
2. API call to /api/sam/context-aware-assistant
3. Response handling with suggestions
4. Error handling with smart fallbacks
```

### Phase 2: Quick Actions
```typescript
// Add action handlers:
1. Generate content action
2. Analyze content action
3. Create assessment action
4. Fill forms action
5. Explain page action
```

### Phase 3: Action Execution
```typescript
// Add action execution:
1. Form update actions
2. Navigation actions
3. Page refresh actions
4. Success/error feedback
```

### Phase 4: Advanced Features
```typescript
// Add advanced features:
1. Gamification integration
2. Analytics display
3. Bloom's analysis
4. Learning profile
```

---

## 📊 Feature Comparison

| Feature | Old Design | New Design (Current) | New Design (Target) |
|---------|-----------|---------------------|---------------------|
| Chat Interface | Tab-based | Chat-first ✅ | Chat-first ✅ |
| Input Size | 20px | 80px ✅ | 80px ✅ |
| Context Detection | ✅ Full | ❌ Basic | ✅ Full |
| API Integration | ✅ Complete | ❌ Mock | ✅ Complete |
| Quick Actions | ✅ Working | ✅ UI Only | ✅ Working |
| Action Execution | ✅ Working | ❌ None | ✅ Working |
| Suggestions | ✅ API-based | ✅ Static | ✅ API-based |
| Fallback Responses | ✅ Smart | ❌ Generic | ✅ Smart |
| Conversation History | ✅ 5 messages | ❌ None | ✅ 5 messages |
| Form Detection | ✅ Full | ❌ None | ✅ Full |
| URL Parsing | ✅ Full | ❌ None | ✅ Full |

---

## 🎯 Success Criteria

The new design will be complete when:
- ✅ All API endpoints are connected
- ✅ Context detection matches old component
- ✅ Quick actions trigger real API calls
- ✅ Action execution works (forms, navigation)
- ✅ Conversation history is maintained
- ✅ Fallback responses are smart
- ✅ UI remains clean and modern
- ✅ No functionality is lost

---

*Created for complete SAM functionality migration*
*Date: January 2025*
