# Course Depth Analyzer Documentation

## Overview

The Course Depth Analyzer is a comprehensive AI-powered system that analyzes course content based on Bloom's Taxonomy principles to provide insights into cognitive learning depth and educational effectiveness. It combines three previously separate components into one unified system:

1. **Bloom's Taxonomy Progress Tracker** - Visual progress tracking
2. **Educational Design Assistant** - AI-powered design guidance  
3. **Advanced Course Analytics** - Deep content analysis

## Features

### 🧠 AI-Powered Analysis
- **Claude API Integration**: Uses Anthropic's Claude 3.5 Sonnet for sophisticated content analysis
- **Bloom's Taxonomy Assessment**: Analyzes content distribution across all 6 cognitive levels
- **Gap Detection**: Identifies missing or underrepresented cognitive levels
- **Content Quality Scoring**: Provides numerical scores for each chapter and overall course

### 📊 Interactive Visualizations
- **Pyramid Visualization**: Interactive pyramid showing distribution across Bloom's levels
- **Chapter Analysis**: Detailed breakdown of each chapter's cognitive depth
- **Progress Tracking**: Visual progress indicators with color-coded feedback
- **Real-time Updates**: Dynamic visualizations that update as content changes

### 🎯 Smart Recommendations
- **Prioritized Suggestions**: High/Medium/Low priority improvement recommendations
- **Implementation Timeline**: Structured roadmap for course improvements
- **Examples and Templates**: Specific examples for each recommendation
- **SAM Integration**: Direct connection to SAM AI assistant for implementation

### 🔄 SAM Assistant Integration
- **Contextual Suggestions**: SAM provides targeted suggestions based on analysis
- **Form Population**: SAM can directly update course content based on recommendations
- **Interactive Guidance**: Real-time assistance during course creation and editing
- **Implementation Support**: Step-by-step guidance for applying recommendations

## Architecture

### Component Structure
```
CourseDepthAnalyzer/
├── course-depth-analyzer.tsx          # Main orchestrator component
├── blooms-pyramid-visualization.tsx   # Interactive pyramid display
├── depth-insights-panel.tsx          # Insights and gap analysis
├── chapter-depth-analysis.tsx        # Chapter-by-chapter breakdown
├── improvement-recommendations.tsx    # Actionable suggestions
└── /api/course-depth-analysis/       # AI analysis endpoint
```

### API Endpoint
- **Route**: `/api/course-depth-analysis`
- **Method**: POST
- **AI Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **Input**: Course data (title, description, learning objectives, chapters)
- **Output**: Structured analysis with scores, gaps, and recommendations

## Bloom's Taxonomy Levels

The system analyzes content across six cognitive levels:

### 1. Remember (5-10% ideal)
- **Keywords**: define, duplicate, list, memorize, repeat, state
- **Description**: Recall facts and basic concepts
- **Color**: Red gradient

### 2. Understand (10-15% ideal)
- **Keywords**: interpret, summarize, infer, paraphrase, classify
- **Description**: Explain ideas or concepts
- **Color**: Yellow gradient

### 3. Apply (20-25% ideal)
- **Keywords**: implement, carry out, use, execute, solve
- **Description**: Use information in new situations
- **Color**: Green gradient

### 4. Analyze (20-25% ideal)
- **Keywords**: compare, organize, deconstruct, interrogate, find
- **Description**: Break information into parts to explore relationships
- **Color**: Cyan gradient

### 5. Evaluate (15-25% ideal)
- **Keywords**: check, critique, judge, justify, test, detect
- **Description**: Justify decisions or course of action
- **Color**: Blue gradient

### 6. Create (15-25% ideal)
- **Keywords**: design, construct, plan, produce, invent, devise
- **Description**: Generate new ideas, products, or ways of viewing things
- **Color**: Purple gradient

## Usage Guide

### 1. Initial Setup
The Course Depth Analyzer is automatically integrated into the course creation page at:
```
/teacher/courses/[courseId]
```

### 2. Running Analysis
1. Navigate to your course page
2. Ensure basic course information is completed (title, description, learning objectives)
3. The analyzer will automatically appear in the left column
4. Click "Analyze Course Depth" to trigger AI analysis

### 3. Understanding Results

#### Pyramid Visualization
- **Green sections**: Within ideal range
- **Dimmed sections**: Outside ideal range
- **Click levels**: Get specific suggestions for improvement
- **Hover**: See detailed descriptions and keywords

#### Chapter Analysis
- **Scores**: 0-100 scale for each chapter
- **Strengths**: What's working well
- **Weaknesses**: Areas needing improvement
- **Expandable cards**: Click to see detailed analysis

#### Recommendations
- **Priority levels**: High (critical), Medium (important), Low (nice-to-have)
- **Implementation timeline**: Immediate, short-term, long-term
- **Progress tracking**: Mark recommendations as implemented
- **SAM integration**: Direct "Implement with SAM" buttons

### 4. Working with SAM
1. Click "Get Suggestions" on any insight
2. Use "Implement with SAM" buttons for direct assistance
3. Ask SAM specific questions about improving cognitive depth
4. Let SAM guide you through implementing recommendations

## Technical Implementation

### Data Flow
1. **Course Data Collection**: Gathers title, description, learning objectives, chapters
2. **AI Analysis**: Sends structured data to Claude API
3. **Response Processing**: Parses AI response into structured format
4. **Visualization**: Renders interactive components with analysis results
5. **SAM Integration**: Provides context for AI assistant interactions

### API Request Format
```typescript
interface CourseAnalysisRequest {
  courseTitle: string;
  courseDescription: string;
  learningObjectives: string[];
  chapters: {
    title: string;
    description: string;
    sections: {
      title: string;
    }[];
  }[];
}
```

### API Response Format
```typescript
interface CourseAnalysisResponse {
  overallScore: number;
  bloomsDistribution: Record<string, number>;
  insights: string[];
  gaps: {
    level: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    type: 'content' | 'structure' | 'activity';
    title: string;
    description: string;
    examples: string[];
  }[];
  chapterAnalysis: {
    chapterTitle: string;
    bloomsLevel: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }[];
  improvementPlan: {
    immediate: Recommendation[];
    shortTerm: Recommendation[];
    longTerm: Recommendation[];
    timeline: string;
  };
}
```

## Benefits

### For Educators
- **Improved Course Quality**: Systematic approach to cognitive depth
- **Time Savings**: Automated analysis and recommendations
- **Learning Outcomes**: Better alignment with educational best practices
- **Student Engagement**: More balanced and effective learning experiences

### For Students
- **Cognitive Development**: Exposure to all levels of thinking
- **Skill Building**: Progressive development from basic to advanced concepts
- **Retention**: Better learning outcomes through balanced content
- **Preparation**: Better preparation for real-world problem solving

### For Institutions
- **Quality Assurance**: Systematic evaluation of course effectiveness
- **Standardization**: Consistent approach to course design
- **Metrics**: Quantifiable measures of educational quality
- **Continuous Improvement**: Data-driven course enhancement

## Configuration

### Environment Variables
```bash
# Required for AI analysis
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Adjust analysis parameters
BLOOM_ANALYSIS_TEMPERATURE=0.3
BLOOM_ANALYSIS_MAX_TOKENS=4000
```

### Customization Options
- **Ideal Ranges**: Adjust target percentages for each Bloom's level
- **Scoring Weights**: Modify how different factors contribute to scores
- **Analysis Depth**: Configure how detailed the AI analysis should be
- **Visualization Themes**: Customize colors and styling

## Troubleshooting

### Common Issues

#### Analysis Not Loading
1. Check Anthropic API key is set correctly
2. Verify course has sufficient content (title, description, chapters)
3. Check browser console for errors
4. Ensure network connectivity

#### Inaccurate Analysis
1. Provide more detailed course descriptions
2. Add specific learning objectives
3. Include chapter descriptions and content
4. Review and refine content based on feedback

#### SAM Integration Issues
1. Ensure SAM is properly configured
2. Check course context is being passed correctly
3. Verify SAM has access to form data
4. Test with simple requests first

### Performance Optimization
- **Caching**: Analysis results are cached for 15 minutes
- **Debouncing**: Prevents excessive API calls during editing
- **Lazy Loading**: Components load only when needed
- **Error Handling**: Graceful degradation when AI is unavailable

## Future Enhancements

### Planned Features
- **Multi-language Support**: Analysis in different languages
- **Export Capabilities**: PDF reports of analysis results
- **Batch Analysis**: Analyze multiple courses simultaneously
- **Integration APIs**: Connect with other educational tools
- **Advanced Metrics**: More sophisticated scoring algorithms

### Feedback and Contributions
- Report issues on GitHub
- Suggest improvements through feedback forms
- Contribute to open-source components
- Share best practices with the community

## Conclusion

The Course Depth Analyzer represents a significant advancement in educational technology, providing educators with powerful tools to create more effective, cognitively balanced learning experiences. By combining AI analysis with interactive visualizations and practical recommendations, it bridges the gap between educational theory and practical course design.

The system's integration with the SAM AI assistant ensures that insights translate into actionable improvements, making it not just an analysis tool but a comprehensive course development partner.

---

*Last updated: January 2025*  
*Version: 1.0.0*  
*Compatible with: Next.js 15, Claude 3.5 Sonnet, SAM AI Assistant*