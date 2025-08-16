# Context-Aware SAM Assistant - Implementation Guide

## Overview

The Context-Aware SAM Assistant is an intelligent AI system that provides personalized assistance across all teacher pages in the Taxomind LMS. SAM understands the context of each page and provides relevant, actionable assistance based on the user's current workflow and available data.

## Key Features

### 🎯 Context Awareness
- **Page Detection**: Automatically detects the current page type and context
- **Route Analysis**: Understands the current route structure and parent-child relationships
- **Data Integration**: Accesses relevant page data (courses, chapters, sections, etc.)
- **Capability Matching**: Provides assistance based on available page capabilities

### 🔄 Dynamic Adaptation
- **Real-time Context Updates**: Adapts as users navigate between pages
- **Workflow-Aware**: Understands the user's current position in their workflow
- **Progressive Assistance**: Builds on previous interactions and context

### 🛠️ Intelligent Actions
- **Page-Specific Suggestions**: Provides relevant quick actions for each page type
- **Navigation Assistance**: Helps users navigate to relevant pages
- **Form Integration**: Can interact with forms and populate data
- **Content Generation**: Creates contextually relevant content

## Architecture

```
GlobalSamProvider
├── Context Detection (Route Analysis)
├── Page Context Management
├── ContextAwareSamAssistant
│   ├── Page-Specific Actions
│   ├── Contextual Suggestions
│   ├── Intelligent Responses
│   └── Action Handling
└── API Integration
    ├── Context-Aware Prompts
    ├── Anthropic Claude Integration
    └── Response Processing
```

## Page Context Types

### 1. Courses Management (`/teacher/courses`)
**Context**: List of all courses with statistics
**Capabilities**:
- Course overview and analytics
- Course creation guidance
- Performance insights
- Bulk operations
- Student engagement analysis

**Available Actions**:
- Analyze My Courses
- Guide Course Creation
- Improve Course Performance
- Show Analytics Insights
- Bulk Course Operations

### 2. Course Detail (`/teacher/courses/[courseId]`)
**Context**: Specific course data, chapters, completion status
**Capabilities**:
- Learning objectives generation
- Chapter creation and management
- Course structure analysis
- Content improvement suggestions
- Course analytics and insights

**Available Actions**:
- Generate Learning Objectives
- Create Course Chapters
- Analyze Course Structure
- Improve Course Content
- Course Analytics

### 3. Chapter Detail (`/teacher/courses/[courseId]/chapters/[chapterId]`)
**Context**: Chapter data, sections, parent course context
**Capabilities**:
- Section creation and management
- Content generation
- Assessment creation
- Chapter performance analysis
- Learning progression optimization

**Available Actions**:
- Create Chapter Sections
- Generate Chapter Content
- Create Assessments
- Chapter Performance

### 4. Section Detail (`/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]`)
**Context**: Section data, parent chapter and course context
**Capabilities**:
- Video content management
- Blog post creation
- Exam and quiz creation
- Resource management
- Section-specific analytics

**Available Actions**:
- Add Video Content
- Create Blog Post
- Create Exam/Quiz
- Add Learning Resources

### 5. Course Creation (`/teacher/create`)
**Context**: Available templates, categories
**Capabilities**:
- Course planning and structure
- Target audience definition
- Learning path design
- Content strategy development
- Template selection guidance

**Available Actions**:
- Plan Course Structure
- Define Target Audience
- Design Learning Path
- Content Strategy

### 6. Analytics (`/teacher/analytics`)
**Context**: Analytics data, performance metrics
**Capabilities**:
- Performance insights and reporting
- Student analytics and tracking
- Course comparison and benchmarking
- Improvement recommendations
- Trend analysis

**Available Actions**:
- Performance Insights
- Student Analytics
- Compare Courses
- Improvement Recommendations

## Implementation Steps

### Step 1: Basic Setup (Already Done)
The global SAM provider is already integrated into the teacher layout:

```tsx
// app/(protected)/teacher/layout.tsx
import { GlobalSamProvider } from './_components/global-sam-provider';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSamProvider>
      <div className="">
        {children}
      </div>
    </GlobalSamProvider>
  );
}
```

### Step 2: Add Page Context (Optional Enhancement)
For pages that need to provide additional context to SAM:

```tsx
// Example: Enhanced course page
import { useCourseDetailPageContext } from './_components/use-sam-page-context';

export function CoursePage({ courseData, categories, completionStatus }) {
  // Provide rich context to SAM
  useCourseDetailPageContext(courseData, courseData.chapters, categories);
  
  // Update with additional context
  useEffect(() => {
    updatePageContext({
      dataContext: {
        completionStatus,
        healthScore: calculateHealthScore(completionStatus),
        // ... other relevant data
      }
    });
  }, [completionStatus]);

  return (
    <div>
      {/* Your page content */}
    </div>
  );
}
```

### Step 3: Form Integration (Optional)
For pages with forms that SAM should interact with:

```tsx
import { useFormContext } from './_components/use-sam-page-context';

export function CourseFormPage() {
  const form = useForm();
  
  // Provide form context to SAM
  useFormContext(form.getValues(), 'course');
  
  return (
    <form>
      {/* Form fields */}
    </form>
  );
}
```

## SAM Capabilities by Page

### Universal Capabilities (All Pages)
- General help and guidance
- Navigation assistance
- Feature explanations
- Best practice recommendations
- Platform orientation

### Page-Specific Capabilities

#### Courses Management
- **Course Analytics**: Analyze course performance and engagement
- **Course Creation**: Guide through course creation process
- **Bulk Operations**: Help with managing multiple courses
- **Performance Insights**: Provide actionable insights
- **Engagement Analysis**: Analyze student engagement patterns

#### Course Detail
- **Learning Objectives**: Generate using Bloom's taxonomy
- **Chapter Management**: Create, organize, and optimize chapters
- **Structure Analysis**: Analyze and improve course structure
- **Content Optimization**: Improve content quality and relevance
- **Publishing Workflow**: Guide through publishing process

#### Chapter Detail
- **Section Creation**: Create engaging chapter sections
- **Content Generation**: Generate chapter-specific content
- **Assessment Design**: Create assessments and quizzes
- **Learning Flow**: Optimize learning progression
- **Performance Tracking**: Monitor chapter performance

#### Section Detail
- **Video Integration**: Help with video content management
- **Blog Creation**: Assist with blog post creation
- **Exam Creation**: Design section-specific assessments
- **Resource Management**: Organize learning resources
- **Engagement Optimization**: Improve section engagement

## API Integration

### Context-Aware API Endpoint
```typescript
// app/api/sam/context-aware-assistant/route.ts
export async function POST(req: NextRequest) {
  const { message, pageContext, pathname, conversationHistory } = await req.json();
  
  // Context-aware system prompt
  const systemPrompt = buildContextAwarePrompt(pageContext, pathname);
  
  // Generate contextual response
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    system: systemPrompt,
    messages: [...conversationHistory, { role: "user", content: message }]
  });
  
  return {
    response: response.content[0].text,
    suggestions: generateContextualSuggestions(pageContext),
    action: generateAction(message, pageContext)
  };
}
```

### Context Data Structure
```typescript
interface PageContext {
  pageName: string;
  pageType: 'courses' | 'course-detail' | 'chapter-detail' | 'section-detail' | 'create' | 'analytics' | 'posts' | 'templates' | 'other';
  breadcrumbs: string[];
  capabilities: string[];
  dataContext: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    courses?: any[];
    course?: any;
    chapter?: any;
    section?: any;
    completionStatus?: any;
    stats?: any;
    // ... additional context data
  };
  currentRoute: string;
  parentContext?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  };
}
```

## User Experience

### Visual Indicators
- **Context Badge**: Shows current page context in SAM header
- **Capability Pills**: Displays available capabilities
- **Health Indicators**: Shows system status and context awareness
- **Action Buttons**: Page-specific quick actions

### Interaction Patterns
- **Contextual Welcome**: Different welcome messages based on page
- **Smart Suggestions**: Page-relevant suggestions in chat
- **Quick Actions**: Dropdown with page-specific actions
- **Progressive Assistance**: Builds on previous interactions

### Response Adaptation
- **Page-Aware Responses**: Responses tailored to current page
- **Workflow Integration**: Understands user's current workflow
- **Data-Driven Insights**: Uses available data for better responses
- **Navigation Guidance**: Provides relevant navigation suggestions

## Best Practices

### For Developers
1. **Always provide context**: Use page context hooks when available
2. **Update context dynamically**: Update context as data changes
3. **Leverage capabilities**: Use page-specific capabilities effectively
4. **Test context awareness**: Verify SAM understands page context

### For Users
1. **Use quick actions**: Leverage page-specific quick actions
2. **Provide context**: Include relevant details in queries
3. **Follow suggestions**: Use SAM's contextual suggestions
4. **Navigate efficiently**: Use SAM for navigation assistance

## Troubleshooting

### Common Issues
1. **SAM not context-aware**: Check if GlobalSamProvider is properly configured
2. **Wrong suggestions**: Verify page context is correctly detected
3. **Missing capabilities**: Ensure page-specific context is provided
4. **Navigation errors**: Check route analysis logic

### Debug Information
- Check browser console for context detection logs
- Verify page context in SAM header
- Test with different page types
- Monitor API responses for context accuracy

## Future Enhancements

### Planned Features
- **Cross-page memory**: Remember context across page navigations
- **Predictive assistance**: Anticipate user needs based on context
- **Advanced form integration**: Deeper form interaction capabilities
- **Multi-language support**: Context-aware multilingual assistance
- **Offline context**: Maintain context when offline

### Integration Opportunities
- **Calendar integration**: Context-aware scheduling
- **Email integration**: Context-aware communications
- **External tools**: Integration with external teaching tools
- **Mobile optimization**: Context-aware mobile experience

## Support and Maintenance

### Monitoring
- Page context detection accuracy
- Response relevance metrics
- User engagement with contextual features
- Performance impact of context awareness

### Updates
- Regular context detection improvements
- New page type support
- Enhanced capability matching
- Improved response quality

---

*This guide provides comprehensive information about implementing and using the Context-Aware SAM Assistant system. For additional support or feature requests, consult the development team.*