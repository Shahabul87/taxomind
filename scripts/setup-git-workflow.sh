#!/bin/bash

echo "🚀 Setting up Git Workflow for Taxomind"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run this script from the project root directory"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🔧 Setting up Git configuration...${NC}"
# Set up Git branch protection reminder
git config branch.main.protect true
git config branch.dev.protect true

echo -e "${YELLOW}🪝 Setting up pre-commit hooks...${NC}"
npx husky install

echo -e "${YELLOW}📋 Creating local environment file...${NC}"
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local from .env.example${NC}"
    echo -e "${YELLOW}⚠️  Please update .env.local with your local database credentials${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

echo -e "${YELLOW}🐳 Setting up local PostgreSQL database...${NC}"
npm run dev:docker:reset
echo -e "${GREEN}✅ Local PostgreSQL running on port 5433${NC}"

echo -e "${YELLOW}🗄️  Setting up database...${NC}"
npm run dev:setup
echo -e "${GREEN}✅ Database schema created and seeded${NC}"

echo -e "${YELLOW}📝 Quick Reference:${NC}"
echo "  - Development branch: dev"
echo "  - Create feature branches from dev"
echo "  - Commit format: feat|fix|docs|style|refactor|test|chore: description"
echo "  - Run 'npm run dev' to start development server"
echo "  - Run 'npm run dev:db:studio' to open Prisma Studio"

echo -e "${GREEN}✅ Git workflow setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your credentials"
echo "2. Run 'git checkout dev' to switch to development branch"
echo "3. Create a feature branch: 'git checkout -b feature/your-feature'"
echo "4. Start coding! 🎉"