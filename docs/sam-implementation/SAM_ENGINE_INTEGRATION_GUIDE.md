# SAM AI Tutor - Engine Integration Guide

## Overview

This guide shows how to connect SAM AI tutor with all 5 engines, making SAM context-aware and capable of providing insights from market analysis, Bloom's taxonomy, exam generation, student progress, and course guidance.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SAM AI Tutor                          │
│                  (Conversational Interface)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  SAM Master Integration                      │
│               (sam-master-integration.ts)                    │
│                                                              │
│  • Context Enhancement                                       │
│  • Query Processing                                          │
│  • Recommendation Generation                                 │
│  • Action Suggestions                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┬─────────────┬─────────────┬─────────────┐
        ▼                           ▼             ▼             ▼             ▼
┌───────────────┐         ┌───────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│Market Analysis│         │Bloom's Engine │ │Exam Engine│ │Student DB │ │Course Guide│
└───────────────┘         └───────────────┘ └───────────┘ └───────────┘ └───────────┘
```

## Integration Steps

### Step 1: Update SAM Context Provider

In your existing SAM implementation, update the context provider:

```typescript
// In your SAM context file (e.g., sam-context-manager.ts)
import { samEngineIntegration } from '@/lib/sam-enhanced-context';

export async function getSAMContext(
  userId: string,
  courseId: string | null,
  interactionType: string,
  existingContext?: any
) {
  // Get your existing SAM context
  const baseContext = await getBaseContext(userId, courseId);
  
  // Enhance with engine insights
  const enhancedContext = await samEngineIntegration.enhanceContext(
    baseContext,
    userId,
    courseId,
    interactionType
  );
  
  return enhancedContext;
}
```

### Step 2: Update SAM Query Processing

In your SAM query handler:

```typescript
// In your SAM API route or query processor
import { samEngineIntegration } from '@/lib/sam-enhanced-context';

export async function handleSAMQuery(
  userId: string,
  courseId: string | null,
  query: string,
  interactionType: string
) {
  // Process query with engine integration
  const response = await samEngineIntegration.processQuery(
    userId,
    courseId,
    query,
    interactionType
  );
  
  // Your existing SAM response generation
  const samResponse = await generateSAMResponse({
    ...response,
    // Add your custom SAM features
  });
  
  return samResponse;
}
```

### Step 3: Update SAM Chat Interface

In your SAM chat component:

```typescript
// In your SAM chat component
import { samEngineIntegration } from '@/lib/sam-enhanced-context';

function SAMChat() {
  const [messages, setMessages] = useState([]);
  
  const sendMessage = async (message: string) => {
    // Get enhanced response
    const response = await fetch('/api/sam/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        courseId: currentCourseId,
        includeEngineInsights: true, // Enable engine integration
      }),
    });
    
    const data = await response.json();
    
    // Display response with actions
    setMessages([...messages, {
      role: 'assistant',
      content: data.message,
      actions: data.nextSteps, // Engine-suggested actions
      insights: data.insights, // Engine insights
    }]);
  };
  
  // Render actions from engines
  const renderActions = (actions: any[]) => {
    return actions.map(action => (
      <Button
        key={action.id}
        onClick={() => {
          if (action.route) {
            router.push(action.route);
          } else if (action.action) {
            action.action();
          }
        }}
      >
        {action.label}
      </Button>
    ));
  };
}
```

## Engine-Specific Integration Examples

### 1. Market Analysis Integration

SAM can now provide market insights:

```typescript
// SAM understands market context
User: "How is my course doing in the market?"
SAM: "Based on market analysis, your course has a 75% market value score 
     and is in a competitive position. Growth potential is 25%. 
     Would you like me to show competitor analysis?"
```

### 2. Bloom's Taxonomy Integration

SAM tracks cognitive development:

```typescript
// SAM knows student progress
User: "What should I focus on next?"
SAM: "Based on your learning profile, you're strong in REMEMBER and UNDERSTAND 
     but need to work on ANALYZE skills. I recommend these practice exercises..."
```

### 3. Exam Engine Integration

SAM can help with assessments:

```typescript
// SAM can generate exams
User: "Create a quiz for chapter 3"
SAM: "I'll create an adaptive quiz aligned with Bloom's taxonomy. 
     Based on the chapter content, I recommend 15 questions with this distribution..."
```

### 4. Course Guide Integration

SAM provides improvement suggestions:

```typescript
// SAM gives course insights
User: "How can I improve my course?"
SAM: "Your course guide shows 3 critical actions needed:
     1. Enhance content depth (currently 45%)
     2. Improve student engagement (40% completion rate)
     3. Adjust pricing based on market analysis"
```

## API Integration Points

### 1. Enhanced SAM Chat Endpoint

```typescript
// /api/sam/chat/route.ts
import { samMasterIntegration } from '@/lib/sam-master-integration';

export async function POST(request: Request) {
  const { message, courseId, userId } = await request.json();
  
  // Determine interaction type from message
  const interactionType = determineInteractionType(message);
  
  // Get enhanced SAM response
  const response = await samMasterIntegration.processSAMQuery(
    userId,
    courseId,
    message,
    interactionType
  );
  
  return Response.json(response);
}
```

### 2. Context Endpoint

```typescript
// /api/sam/context/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const userId = searchParams.get('userId');
  
  const context = await samMasterIntegration.getSAMContext(
    userId!,
    courseId,
    'GENERAL',
    ''
  );
  
  return Response.json(context);
}
```

## Interaction Type Mapping

Map user intents to interaction types for better engine selection:

```typescript
function determineInteractionType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('market') || lowerMessage.includes('competitor')) {
    return 'MARKET_ANALYSIS';
  }
  if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
    return 'PROGRESS_CHECK';
  }
  if (lowerMessage.includes('exam') || lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
    return 'EXAM_HELP';
  }
  if (lowerMessage.includes('improve') || lowerMessage.includes('guide')) {
    return 'COURSE_HELP';
  }
  
  return 'QUESTION_ASKED';
}
```

## Benefits of Integration

1. **Context-Aware Responses**: SAM now has access to comprehensive data
2. **Personalized Recommendations**: Based on actual progress and metrics
3. **Actionable Insights**: Direct links to relevant dashboards
4. **Role-Based Intelligence**: Different insights for students vs teachers
5. **Proactive Suggestions**: SAM can suggest actions before being asked

## Example Conversations

### Student Conversation
```
Student: "I'm struggling with the course material"
SAM: "I see you're having difficulty with ANALYZE level questions (45% accuracy). 
     Your visual learning style suggests you'd benefit from diagrams and flowcharts. 
     Would you like me to generate a visual study guide for your weak areas?"
[Button: Generate Visual Study Guide] [Button: Practice ANALYZE Questions]
```

### Teacher Conversation
```
Teacher: "Should I update my course?"
SAM: "Your course analysis shows:
     - Market Position: Follower (competitors have 40% more enrollments)
     - Content Depth: 55% (below recommended 70%)
     - Student Completion: 45% (industry average is 60%)
     
     I recommend focusing on content depth first. Would you like to see specific recommendations?"
[Button: View Full Analysis] [Button: Content Recommendations] [Button: Competitor Analysis]
```

## Testing the Integration

1. **Test Market Context**:
   ```
   Ask: "How competitive is my course?"
   Expected: Market position and competitor insights
   ```

2. **Test Progress Tracking**:
   ```
   Ask: "What are my weak areas?"
   Expected: Bloom's taxonomy breakdown with specific levels
   ```

3. **Test Recommendations**:
   ```
   Ask: "What should I do next?"
   Expected: Personalized actions based on role and progress
   ```

## Monitoring and Analytics

Track engine usage through SAM interactions:

```typescript
// SAM automatically logs engine usage
await db.sAMInteraction.create({
  data: {
    userId,
    courseId,
    interactionType,
    context: {
      enginesUsed: ['market', 'blooms', 'guide'],
      responseQuality: calculateResponseQuality(response),
    },
    result: response,
  },
});
```

## Conclusion

With this integration, SAM becomes a comprehensive AI assistant that:
- Understands course market position
- Tracks cognitive development
- Generates adaptive assessments
- Provides personalized learning paths
- Offers data-driven recommendations

The engines work seamlessly in the background, making SAM's responses more intelligent and actionable.