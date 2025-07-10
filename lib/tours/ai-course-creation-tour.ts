import { TourConfig } from "@/hooks/use-guided-tour";

export const aiCourseCreationTour: TourConfig = {
  id: "ai-course-creation",
  name: "AI-Powered Course Creation",
  autoStart: true,
  persistent: true,
  steps: [
    {
      id: "welcome",
      title: "Welcome to AI Course Creation!",
      content: "Let's explore how our AI can help you create engaging, pedagogically sound courses in minutes. This tour will show you the key AI features available.",
      target: "[data-tour='course-creation-header']",
      placement: "bottom",
      showPrev: false,
    },
    {
      id: "ai-management-hub",
      title: "AI Course Management Hub",
      content: "This intelligent hub analyzes your course portfolio and provides personalized recommendations. It adapts based on your progress and teaching goals.",
      target: "[data-tour='ai-management-hub']",
      placement: "top",
    },
    {
      id: "contextual-suggestions",
      title: "Context-Aware Suggestions",
      content: "Our AI provides different suggestions based on your current situation - whether you're just starting, have drafts to complete, or want to optimize existing courses.",
      target: "[data-tour='contextual-suggestions']",
      placement: "left",
    },
    {
      id: "ai-course-builder",
      title: "AI Course Builder",
      content: "Click this button to access our flagship AI course builder. It uses advanced pedagogy models to create comprehensive course structures automatically.",
      target: "[data-tour='ai-course-builder']",
      placement: "top",
    },
    {
      id: "quick-actions",
      title: "Quick AI Actions",
      content: "These one-click actions let you instantly access AI tools for content optimization, performance insights, and revenue analysis.",
      target: "[data-tour='quick-ai-actions']",
      placement: "top",
    },
  ],
};

export const aiChapterCreationTour: TourConfig = {
  id: "ai-chapter-creation",
  name: "AI Chapter Assistant",
  autoStart: false,
  persistent: true,
  steps: [
    {
      id: "chapter-assistant-intro",
      title: "Meet Your AI Chapter Assistant",
      content: "This AI assistant provides contextual help based on your chapter's completion status. It evolves as you progress, offering increasingly sophisticated suggestions.",
      target: "[data-tour='ai-chapter-assistant']",
      placement: "right",
    },
    {
      id: "progressive-suggestions",
      title: "Progressive AI Guidance",
      content: "Notice how the suggestions change based on your progress. From basic completion help to advanced optimization - AI adapts to your needs.",
      target: "[data-tour='progressive-suggestions']",
      placement: "left",
    },
    {
      id: "ai-writing-help",
      title: "AI Writing Assistant",
      content: "Get instant help with titles, descriptions, and learning outcomes. Our AI understands educational best practices and learning science.",
      target: "[data-tour='ai-writing-help']",
      placement: "top",
    },
    {
      id: "section-builder",
      title: "AI Section Builder",
      content: "Create comprehensive section structures with videos, articles, and assessments. AI ensures optimal learning progression and engagement.",
      target: "[data-tour='ai-section-builder']",
      placement: "top",
    },
    {
      id: "quick-ai-tools",
      title: "Quick AI Tools",
      content: "Access specialized AI tools for content ideas, quiz generation, learning goals, and progress tracking - all in one place.",
      target: "[data-tour='quick-ai-tools']",
      placement: "top",
    },
  ],
};

export const aiExamCreationTour: TourConfig = {
  id: "ai-exam-creation",
  name: "AI-Powered Assessment Creation",
  autoStart: false,
  persistent: true,
  steps: [
    {
      id: "exam-intro",
      title: "AI Assessment Revolution",
      content: "Create pedagogically sound assessments using Bloom's Taxonomy and cognitive science. Our AI ensures optimal learning measurement and student growth.",
      target: "[data-tour='exam-creation-header']",
      placement: "bottom",
    },
    {
      id: "blooms-distribution",
      title: "Optimal Bloom's Distribution",
      content: "See the recommended distribution of cognitive levels for effective assessment. This is based on educational research and best practices.",
      target: "[data-tour='blooms-distribution']",
      placement: "left",
    },
    {
      id: "ai-question-generation",
      title: "Intelligent Question Generation",
      content: "Generate questions that target specific cognitive levels. Our AI understands learning objectives and creates appropriate assessments.",
      target: "[data-tour='ai-question-generation']",
      placement: "right",
    },
    {
      id: "cognitive-analytics",
      title: "Cognitive Analytics Dashboard",
      content: "Track student cognitive development in real-time. See which Bloom's levels students are mastering and where they need support.",
      target: "[data-tour='cognitive-analytics']",
      placement: "top",
    },
    {
      id: "pathway-visualizer",
      title: "Learning Pathway Visualization",
      content: "Visualize how students progress through cognitive levels. This helps you understand learning patterns and optimize instruction.",
      target: "[data-tour='pathway-visualizer']",
      placement: "top",
    },
  ],
};

export const aiAnalyticsTour: TourConfig = {
  id: "ai-analytics",
  name: "AI Predictive Analytics",
  autoStart: false,
  persistent: true,
  steps: [
    {
      id: "analytics-intro",
      title: "AI-Powered Course Analytics",
      content: "Access predictive insights that help you understand student success patterns and optimize your teaching approach before problems occur.",
      target: "[data-tour='analytics-header']",
      placement: "bottom",
    },
    {
      id: "completion-prediction",
      title: "Course Completion Forecasting",
      content: "AI predicts which students are likely to complete your course based on engagement patterns, helping you intervene early.",
      target: "[data-tour='completion-prediction']",
      placement: "left",
    },
    {
      id: "cognitive-progression",
      title: "Cognitive Development Tracking",
      content: "Monitor how students advance through Bloom's taxonomy levels. Identify learning gaps and provide targeted support.",
      target: "[data-tour='cognitive-progression']",
      placement: "right",
    },
    {
      id: "risk-analysis",
      title: "At-Risk Student Identification",
      content: "AI identifies students who may struggle before they fall behind. Get specific intervention recommendations for each student.",
      target: "[data-tour='risk-analysis']",
      placement: "top",
    },
    {
      id: "smart-interventions",
      title: "Smart Intervention Suggestions",
      content: "Receive AI-powered recommendations for helping struggling students, including personalized learning paths and support strategies.",
      target: "[data-tour='smart-interventions']",
      placement: "top",
    },
  ],
};