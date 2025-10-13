# 🎓 Taxomind - Intelligent Learning Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> An enterprise-grade Learning Management System (LMS) with AI-powered adaptive learning, real-time analytics, and intelligent content generation.

## 🌟 Features

### 🤖 AI-Powered Learning
- **Adaptive Learning Paths**: Personalized course recommendations based on learning patterns
- **AI Content Generation**: Automated course and chapter creation using OpenAI and Anthropic
- **Intelligent Tutoring**: SAM AI assistant for personalized learning support
- **Smart Question Generation**: Adaptive difficulty adjustment based on learner performance

### 📚 Learning Management
- **Multi-Role Support**: Student, Teacher, and Administrator roles with comprehensive permissions
- **Course Catalog**: Rich course discovery with advanced filtering and search
- **Interactive Content**: Support for video, code, math equations (KaTeX), and markdown
- **Progress Tracking**: Real-time learning analytics and progress visualization
- **Enrollment System**: Course purchases and enrollments with Stripe integration

### 🎨 Modern User Experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark/Light Mode**: Full theme support with system preference detection
- **Real-time Updates**: WebSocket integration for live notifications
- **Rich Text Editor**: TipTap editor with collaborative editing support
- **Interactive Components**: Radix UI primitives for accessible components

### 🔒 Enterprise Security
- **Multi-Provider Auth**: NextAuth.js v5 with Google, GitHub, and credential providers
- **Role-Based Access Control**: Fine-grained permissions with capability-based authorization
- **2FA/MFA Support**: TOTP-based multi-factor authentication
- **Audit Logging**: Comprehensive activity tracking and compliance reporting
- **Rate Limiting**: API protection with Upstash Redis
- **GDPR Compliance**: Data protection and privacy controls

### 📊 Analytics & Monitoring
- **Real-time Analytics**: User engagement and learning metrics
- **Performance Monitoring**: OpenTelemetry integration with Sentry
- **Dashboard Analytics**: Teacher and admin dashboards with Chart.js visualizations
- **Predictive Analytics**: AI-powered learning outcome predictions

### 🏗️ Enterprise Architecture
- **Next.js 15 App Router**: Server Components and streaming SSR
- **Prisma ORM**: Type-safe database access with PostgreSQL
- **Queue System**: BullMQ for background job processing
- **Caching Strategy**: Redis caching with Upstash
- **CDN Integration**: Cloudinary for media asset management
- **Observability**: Comprehensive logging, metrics, and tracing

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 20.x or higher
- **Docker**: For local PostgreSQL database
- **npm**: 9.x or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shahabul87/taxomind.git
   cd taxomind
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start local PostgreSQL database**
   ```bash
   npm run dev:docker:start
   ```

5. **Set up database**
   ```bash
   npm run dev:setup
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 Documentation

### Project Structure
```
taxomind/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (course)/          # Course learning interface
│   ├── (dashboard)/       # Role-based dashboards
│   ├── (homepage)/        # Public homepage
│   ├── (protected)/       # Protected routes
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utility functions & configurations
├── actions/               # Server actions
├── hooks/                 # Custom React hooks
├── prisma/                # Database schema & migrations
├── __tests__/             # Test suites (111 test files)
├── docs/                  # Comprehensive documentation
│   ├── admin/            # Admin features & fixes
│   ├── auth/             # Authentication docs
│   ├── enterprise/       # Enterprise guides
│   ├── fixes/            # Bug fixes & solutions
│   ├── design/           # UI/UX design docs
│   ├── phases/           # Project phase reports
│   ├── testing/          # Test documentation
│   └── implementation/   # Implementation guides
└── scripts/               # Build & deployment scripts
```

### Available Commands

#### Development
```bash
npm run dev              # Start development server with Turbopack
npm run dev:setup        # Reset and seed database
npm run dev:db:studio    # Open Prisma Studio
```

#### Building
```bash
npm run build            # Production build with validation
npm run build:turbo      # Production build with Turbopack
npm run start            # Start production server
```

#### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:ci          # CI mode
```

#### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run typecheck        # TypeScript type checking
```

#### Database
```bash
npm run dev:db:reset     # Reset database
npm run dev:db:seed      # Seed with test data
npx prisma studio        # Visual database browser
npx prisma migrate dev   # Apply migrations
```

#### Enterprise Commands
```bash
npm run enterprise:validate           # Validate development setup
npm run enterprise:deploy:staging     # Deploy to staging
npm run enterprise:deploy:production  # Deploy to production
npm run enterprise:health            # System health check
npm run enterprise:audit             # View audit logs
```

### Key Documentation Files
- **[CLAUDE.md](CLAUDE.md)** - Project instructions and coding standards
- **[ROOT_DIRECTORY_ORGANIZATION.md](ROOT_DIRECTORY_ORGANIZATION.md)** - Complete file mapping
- **[docs/testing/TEST_ORGANIZATION.md](docs/testing/TEST_ORGANIZATION.md)** - Test structure guide
- **[docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Quick navigation guide

### Custom Commands
The project includes custom slash commands for AI-assisted navigation:
```bash
/find-docs [topic]       # Find documentation by topic
/find-docs auth          # Find authentication docs
/find-docs admin         # Find admin documentation
/find-docs tests         # Find test information
```

## 🏛️ Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router and Server Components
- **Language**: TypeScript 5.6.3 with strict mode
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: NextAuth.js v5 with multi-provider support
- **Styling**: Tailwind CSS 3.3 with Radix UI primitives
- **State Management**: Zustand for client state
- **API Integration**: OpenAI SDK, Anthropic SDK for AI features
- **Payment Processing**: Stripe integration
- **Media Management**: Cloudinary with Next.js optimization
- **Real-time**: Socket.io for live updates
- **Caching**: Upstash Redis for distributed caching
- **Queue System**: BullMQ for background jobs
- **Monitoring**: Sentry for error tracking, OpenTelemetry for observability
- **Testing**: Jest + React Testing Library + Playwright

### Database Schema
50+ models including:
- **Users & Authentication**: User, Account, Session, VerificationToken
- **Learning**: Course, Chapter, Section, Enrollment, Purchase
- **Content**: Post, BlogChapter, MathEquation, CodeExplanation
- **Analytics**: UserProgress, SAMAnalytics, BloomsAnalysis
- **Administration**: AuditLog, AdminAction, UserCapabilities

### Security Features
- **Authentication**: Multi-provider with NextAuth.js v5
- **Authorization**: Role-based with capability system
- **Data Protection**: Encryption at rest, HTTPS only
- **Input Validation**: Zod schema validation
- **SQL Injection**: Parameterized queries with Prisma
- **XSS Prevention**: Output sanitization
- **CSRF Protection**: Built-in Next.js protection
- **Rate Limiting**: API throttling with Upstash
- **Audit Logging**: Complete activity tracking
- **MFA Support**: TOTP-based 2FA

## 🧪 Testing

### Test Coverage
- **111 test files** organized by type
- **70%+ coverage** requirement (branches, functions, lines, statements)
- **Multiple test types**: Unit, Integration, Component, E2E

### Test Structure
```
__tests__/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── components/        # Component tests
├── hooks/            # Hook tests
├── actions/          # Server action tests
├── api/              # API route tests
└── middleware.test.ts # Middleware tests
```

### Running Tests
```bash
npm test                    # Run all tests
npm test __tests__/unit/    # Run unit tests only
npm run test:coverage       # Generate coverage report
npm run test:ci            # Run in CI mode
```

## 🌐 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/taxomind_dev"

# Authentication
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"

# Email
RESEND_API_KEY="your-resend-api-key"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Payment
STRIPE_API_KEY="your-stripe-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-public-key"

# Media
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-name"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

See `.env.example` for complete list of environment variables.

## 🚢 Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Environment-Specific Deployment
```bash
# Staging
npm run enterprise:deploy:staging

# Production
npm run enterprise:deploy:production
```

### Docker Support
```bash
# Start local PostgreSQL
npm run dev:docker:start

# Stop local PostgreSQL
npm run dev:docker:stop

# Reset local PostgreSQL
npm run dev:docker:reset
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow coding standards** (see [CLAUDE.md](CLAUDE.md))
4. **Write tests** for new features
5. **Run linting** (`npm run lint`)
6. **Run tests** (`npm test`)
7. **Commit changes** (`git commit -m 'Add amazing feature'`)
8. **Push to branch** (`git push origin feature/amazing-feature`)
9. **Open a Pull Request**

### Coding Standards
- **TypeScript**: Strict mode, no `any` types
- **ESLint**: Zero warnings policy
- **Prettier**: Consistent formatting
- **Testing**: 70%+ coverage required
- **Documentation**: Update docs for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

**Taxomind Team**
- GitHub: [@Shahabul87](https://github.com/Shahabul87)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Radix UI for accessible components
- Vercel for hosting and deployment
- Open source community for inspiration

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Shahabul87/taxomind/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Shahabul87/taxomind/discussions)

## 🗺️ Roadmap

- [ ] Mobile app with React Native
- [ ] Advanced AI features with Claude 3
- [ ] Gamification system
- [ ] Social learning features
- [ ] Live video sessions
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Offline mode support

---

**Built with ❤️ by the Taxomind Team**

⭐ Star us on GitHub — it motivates us a lot!
