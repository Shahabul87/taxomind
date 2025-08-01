# 🧠 MindForge - Intelligent Learning Platform

<div align="center">

![MindForge Logo](https://img.shields.io/badge/MindForge-Intelligent%20Learning-purple?style=for-the-badge&logo=brain&logoColor=white)

**Where Minds Are Forged Through Intelligence**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.8.2-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-5.0.0-purple?style=flat-square&logo=auth0)](https://next-auth.js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[🚀 Live Demo](https://mindforge.com) • [📖 Documentation](https://docs.mindforge.com) • [🎯 Features](#features) • [🛠️ Installation](#installation)

</div>

## 🌟 Overview

**MindForge** is a cutting-edge intelligent learning platform that revolutionizes education through AI-powered adaptive learning, real-time analytics, and personalized learning paths. Built for the future of education, MindForge transforms how students learn and how educators teach.

### 🎯 Mission
To democratize intelligent education by providing adaptive, personalized learning experiences that evolve with each learner's unique needs and capabilities.

## ✨ Key Features

### 🤖 AI-Powered Learning
- **Adaptive Question Generation** - AI creates personalized questions based on learning progress
- **Intelligent Content Curation** - Smart content recommendations tailored to individual learning styles
- **Real-time Difficulty Adjustment** - Dynamic difficulty scaling based on performance metrics
- **Context-Aware Tutoring** - AI tutor that understands learning context and provides targeted help

### 📊 Advanced Analytics
- **Real-time Learning Analytics** - Live insights into student engagement and progress
- **Predictive Performance Modeling** - AI-driven predictions for learning outcomes
- **Cognitive Load Analysis** - Monitor and optimize mental effort during learning
- **Learning Velocity Tracking** - Measure and improve learning speed and retention

### 🎓 Enterprise Learning Management
- **Role-Based Access Control** - Granular permissions for students, teachers, and administrators
- **Course Creation Workflows** - Streamlined course development with AI assistance
- **Progress Tracking** - Comprehensive learning journey visualization
- **Certification System** - Automated certificate generation and verification

### 🔒 Enterprise Security
- **Multi-Provider Authentication** - Google, GitHub, and credential-based login
- **Session Management** - Secure session handling with Redis caching
- **Data Protection** - GDPR-compliant data handling and privacy controls
- **Audit Logging** - Comprehensive activity tracking for compliance

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Next.js 15.3.5** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Radix UI** - Accessible component primitives

#### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database operations
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **NextAuth.js v5** - Authentication and authorization

#### AI & Analytics
- **OpenAI Integration** - GPT-powered content generation
- **Real-time Analytics** - Live performance monitoring
- **Machine Learning Models** - Predictive analytics and recommendations
- **Natural Language Processing** - Content analysis and generation

#### Infrastructure
- **Vercel Deployment** - Edge-optimized hosting
- **Cloudinary** - Media management and optimization
- **Upstash Redis** - Serverless Redis for caching
- **Prisma Cloud** - Database management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Redis instance (optional for development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mindforge/mindforge-platform.git
   cd mindforge-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/mindforge"
   
   # Authentication
   AUTH_SECRET="your-auth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   
   # Redis (optional for development)
   REDIS_URL="redis://localhost:6379"
   
   # AI Services
   OPENAI_API_KEY="your-openai-api-key"
   
   # Media Storage
   CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
   CLOUDINARY_API_KEY="your-cloudinary-key"
   CLOUDINARY_API_SECRET="your-cloudinary-secret"
   ```

4. **Database setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Platform Features

### For Students
- **Personalized Dashboard** - AI-curated learning path recommendations
- **Adaptive Assessments** - Questions that adapt to your skill level
- **Progress Analytics** - Detailed insights into learning journey
- **Interactive Content** - Rich media and interactive learning materials
- **Study Scheduling** - AI-optimized study plans and reminders

### For Teachers
- **AI Course Creator** - Generate courses with AI assistance
- **Student Analytics** - Deep insights into class performance
- **Content Management** - Rich text editor with multimedia support
- **Assessment Builder** - Create adaptive exams and quizzes
- **Real-time Monitoring** - Live view of student engagement

### For Administrators
- **Platform Analytics** - Comprehensive usage and performance metrics
- **User Management** - Advanced user roles and permissions
- **Content Governance** - Approval workflows and quality control
- **System Monitoring** - Performance and health monitoring
- **Compliance Tools** - GDPR and audit trail management

## 🔧 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run type-check   # TypeScript validation
```

### Project Structure
```
mindforge/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Authentication pages
│   ├── (course)/       # Course learning interface
│   ├── (dashboard)/    # User dashboards
│   ├── (protected)/    # Protected routes
│   └── api/           # API routes
├── components/         # Reusable UI components
├── lib/               # Utility functions and configurations
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── prisma/            # Database schema and migrations
└── public/            # Static assets
```

### Database Schema
The platform uses a comprehensive database schema with:
- **User Management** - Users, roles, permissions, sessions
- **Course Structure** - Courses, chapters, sections, content
- **Assessment System** - Exams, questions, attempts, analytics
- **AI Integration** - Learning patterns, preferences, analytics
- **Content Management** - Media, attachments, versioning

## 🔒 Security & Compliance

### Security Features
- **Authentication** - Multi-provider OAuth with secure session management
- **Authorization** - Role-based access control with granular permissions
- **Data Protection** - Encrypted sensitive data and secure API endpoints
- **Input Validation** - Comprehensive input sanitization and validation
- **Rate Limiting** - API rate limiting and DDoS protection

### Compliance
- **GDPR Ready** - Built-in privacy controls and data export/deletion
- **Audit Trails** - Comprehensive logging for compliance requirements
- **Data Retention** - Configurable data retention policies
- **Privacy Controls** - User-controlled privacy settings

## 📊 Performance & Monitoring

### Performance Optimizations
- **Edge Deployment** - Global CDN with edge computing
- **Image Optimization** - Automatic image compression and WebP conversion
- **Caching Strategy** - Multi-layer caching with Redis and CDN
- **Code Splitting** - Optimized bundle splitting for faster loads
- **Database Optimization** - Query optimization and connection pooling

### Monitoring
- **Real-time Analytics** - Live user engagement and system metrics
- **Error Tracking** - Comprehensive error monitoring and alerting
- **Performance Metrics** - Core Web Vitals and custom metrics
- **Health Checks** - Automated system health monitoring

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting with custom rules
- **Prettier** - Code formatting
- **Testing** - Unit and integration tests required

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Roadmap

### Q1 2024
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced AI tutoring features
- [ ] Collaborative learning tools
- [ ] Enhanced accessibility features

### Q2 2024
- [ ] Integration marketplace
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Enterprise SSO integration

### Q3 2024
- [ ] VR/AR learning experiences
- [ ] Blockchain certification
- [ ] Advanced AI models
- [ ] Global deployment

## 🆘 Support

### Documentation
- [📖 Full Documentation](https://docs.mindforge.com)
- [🔧 API Reference](https://api.mindforge.com/docs)
- [🎓 Tutorial Videos](https://learn.mindforge.com)

### Community
- [💬 Discord Community](https://discord.gg/mindforge)
- [📧 Email Support](mailto:support@mindforge.com)
- [🐛 Issue Tracker](https://github.com/mindforge/mindforge-platform/issues)

### Enterprise
For enterprise inquiries and custom solutions:
- **Sales**: sales@mindforge.com
- **Partnerships**: partners@mindforge.com
- **Enterprise Support**: enterprise@mindforge.com

---

<div align="center">

**Made with ❤️ by the MindForge Team**

[Website](https://mindforge.com) • [Documentation](https://docs.mindforge.com) • [Blog](https://blog.mindforge.com) • [Twitter](https://twitter.com/mindforge)

© 2024 MindForge. All rights reserved.

</div># MindForge
