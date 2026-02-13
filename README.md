# Killhouse

AI 기반 보안 취약점 분석 및 모의 침투 테스트 플랫폼

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js v5 (JWT strategy)
- **Database**: Prisma + Supabase (PostgreSQL)
- **Payment**: PortOne V1 (아임포트)
- **Testing**: Jest + Playwright-BDD

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase 프로젝트 (PostgreSQL)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Push database schema to Supabase
npm run db:push

# Run development server (port 3001)
npm run dev
```

### Environment Variables

`.env.local`에 다음 환경 변수를 설정하세요:

```bash
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Authentication
AUTH_SECRET="openssl rand -base64 32 로 생성"
AUTH_URL="http://localhost:3001"

# OAuth (선택)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GITLAB_CLIENT_ID=""
GITLAB_CLIENT_SECRET=""

# Payment - PortOne V1
NEXT_PUBLIC_IMP_CODE=""
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=""
PORTONE_REST_API_KEY=""
PORTONE_REST_API_SECRET=""
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3001)
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run type-check       # TypeScript check

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
npm run test:e2e         # Run E2E tests (Playwright)

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (public)/          # Public pages
│   └── api/               # API routes
├── components/            # React components
├── config/                # Configuration
├── domains/               # Domain logic (DDD)
├── infrastructure/        # External services
├── lib/                   # Utilities
└── types/                 # TypeScript types

e2e/
├── features/              # Gherkin feature files
├── steps/                 # Step definitions
└── pages/                 # Page objects
```

## Features

- OAuth 인증 (GitHub, GitLab, Google)
- GitHub/GitLab 저장소 연동
- 멀티 저장소 프로젝트 지원
- 보안 취약점 스캐닝
- 구독 결제 관리 (PortOne)
- 일할 계산 환불

## Third-Party Setup

자세한 OAuth 및 결제 설정 가이드는 [docs/SETUP.md](docs/SETUP.md)를 참고하세요.

## License

MIT
