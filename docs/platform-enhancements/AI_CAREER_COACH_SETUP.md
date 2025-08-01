# AI Career Coach Setup & Configuration

## 🤖 Production-Ready AI Career Coach

This document outlines how to set up and configure the AI Career Coach feature that uses the Anthropic Claude API for real AI-powered career guidance.

## 📋 Prerequisites

1. **Anthropic API Key**: Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. **Database Access**: Ensure your database is properly configured
3. **Authentication**: User must be logged in to access the feature

## 🔧 Environment Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# AI Services
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Verify Installation

The `@anthropic-ai/sdk` package is already installed in your dependencies:
```json
"@anthropic-ai/sdk": "^0.19.2"
```

## 🚀 Features Overview

### **AI Career Coach Capabilities**

1. **Personalized Coaching**: Analyzes user's course portfolio and provides tailored advice
2. **Real-time Chat**: Interactive conversation with Claude AI
3. **Goal Setting**: Helps users set and track career objectives
4. **Data-Driven Insights**: Uses actual course completion and market data
5. **Fallback System**: Graceful error handling with smart fallback responses

### **API Endpoint**: `/api/ai-career-coach`

#### POST Request
```typescript
{
  "message": "How can I increase my salary?",
  "conversationHistory": [...],
  "goals": ["Increase salary by 30%", ...]
}
```

#### Response
```typescript
{
  "success": true,
  "response": "AI-generated response based on user data",
  "context": {
    "marketPercentile": 78,
    "salaryPotential": 95000,
    "careerReadiness": 85
  }
}
```

## 🎯 How It Works

### **1. Context Building**
The AI coach analyzes:
- User's course portfolio and completion rates
- Market demand for their skills
- Cognitive development levels (Bloom's Taxonomy)
- Career goals and conversation history
- Salary potential and market positioning

### **2. AI Prompt System**
```typescript
// The system builds a comprehensive prompt including:
- User profile and market position
- Course portfolio with completion rates
- Weakest cognitive areas needing improvement
- Top skill gaps in the market
- Conversation history for context
```

### **3. Smart Response Generation**
Claude AI provides:
- Personalized career advice
- Specific action items with timelines
- Salary impact estimates
- Skill development priorities
- Market positioning strategies

## 💡 Usage Examples

### **Salary Discussion**
**User**: "How can I increase my salary?"
**AI Coach**: "💰 Based on your current skill set, you're positioned for a $95K salary. To reach $125K+, focus on: 1) Completing your Data Science course (currently 65% done), 2) Adding cloud certifications, 3) Building a portfolio of real projects..."

### **Skill Development**
**User**: "What skills should I learn next?"
**AI Coach**: "🎯 Your skill development priority should be: 1) Docker & Kubernetes (High ROI: +$22K), 2) AWS Cloud Architecture (+$25K), 3) Advanced system design. These align with market demand and your current trajectory..."

### **Career Progression**
**User**: "Am I ready for a senior role?"
**AI Coach**: "🚀 You're 92% ready for a Senior Full Stack Developer role! Missing pieces: 1) System design experience, 2) Leadership/mentoring, 3) Advanced React patterns. I can help you create a 6-month plan..."

## 🛡️ Error Handling & Fallbacks

### **1. API Error Handling**
- Connection issues with Anthropic API
- Invalid API key or quota exceeded
- Network timeouts

### **2. Fallback Responses**
When the AI API is unavailable, the system provides intelligent fallback responses based on:
- Keyword analysis of user input
- Pre-built response templates
- User's actual course data

### **3. Loading States**
- Shows loading indicator during AI processing
- Handles long response times gracefully
- Provides progress feedback to users

## 📊 Data Integration

### **Course Data Analysis**
```typescript
interface UserCourseData {
  id: string;
  title: string;
  category: string;
  completionPercentage: number;
  skills: string[];
  marketDemand: number;
  averageSalary: number;
  cognitiveProgress: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  marketPercentile: number;
  competitivenessScore: number;
}
```

### **Market Insights Calculation**
- Average market percentile across courses
- Salary potential based on skill portfolio
- Strongest skill areas for leverage
- Weakest cognitive areas needing development
- Top skill gaps with highest market demand

## 🎨 Frontend Features

### **Interactive Chat Interface**
- Real-time conversation with Claude AI
- Message history and timestamps
- Loading indicators and animations
- Quick question buttons for common queries

### **Goal Management**
- Set career goals through chat or quick buttons
- Visual goal tracking and progress display
- Goal-oriented coaching recommendations

### **Recommendations Engine**
- Priority-ranked suggestions (High/Medium/Low)
- Actionable timelines and specific steps
- Market data integration for relevance

## 🔒 Security & Privacy

### **Data Protection**
- User conversations are processed securely
- No sensitive personal data sent to external APIs
- Optional conversation storage for learning improvements

### **API Security**
- Server-side API key management
- Rate limiting and error handling
- Secure session validation

## 🚦 Getting Started

### **1. Set Environment Variable**
```bash
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### **2. Access the Feature**
1. Navigate to `/analytics/user` (Job Market tab)
2. Click "AI Career Coach" button
3. Start chatting with the AI coach

### **3. Test Functionality**
Try these sample questions:
- "How can I increase my salary?"
- "What skills should I learn next?"
- "Am I ready for a senior role?"
- "Create a 6-month career plan"

## 📈 Performance Considerations

### **Response Times**
- Typical AI response: 2-5 seconds
- Loading indicators for user feedback
- Timeout handling for slow responses

### **Cost Optimization**
- Efficient prompt design for token usage
- Conversation history limiting (last 6 messages)
- Smart caching for repeated queries

## 🔧 Customization Options

### **Prompt Tuning**
Modify the system prompt in `/api/ai-career-coach/route.ts` to:
- Adjust coaching tone and style
- Add industry-specific guidance
- Customize response length and format

### **Fallback Responses**
Update fallback responses for:
- Better offline experience
- Domain-specific advice
- Company culture alignment

## 🎯 Future Enhancements

### **Planned Features**
1. **Learning Path Generation**: AI-created course sequences
2. **Interview Preparation**: Mock interview coaching
3. **Resume Optimization**: AI-powered resume feedback
4. **Networking Suggestions**: Career connection recommendations
5. **Salary Negotiation**: Compensation discussion coaching

---

## 🆘 Troubleshooting

### **Common Issues**

**1. API Key Not Working**
- Verify key is correct in `.env` file
- Check Anthropic Console for key status
- Ensure sufficient API credits

**2. Slow Responses**
- Check network connection
- Verify API rate limits not exceeded
- Monitor Anthropic service status

**3. Generic Responses**
- Ensure user has course data in database
- Check course completion percentages
- Verify market data calculations

### **Debug Mode**
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

---

The AI Career Coach is now production-ready and will provide personalized, data-driven career guidance using Claude AI's advanced language understanding capabilities!