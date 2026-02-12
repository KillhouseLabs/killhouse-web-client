# Autopsy Agent Web Client

소프트웨어 보안 취약점 자동 분석 및 모의 침투 테스트 플랫폼

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js v5 (JWT strategy)
- **Database**: Prisma + SQLite/PostgreSQL
- **Payment**: PortOne V1 (아임포트)
- **Testing**: Jest + Playwright-BDD

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Run development server (port 3001)
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

---

## Third-Party Integrations

### 1. Authentication (NextAuth.js)

#### AUTH_SECRET 생성

```bash
openssl rand -base64 32
```

생성된 값을 `AUTH_SECRET`에 설정합니다.

### 2. Google OAuth

#### 설정 절차

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services > Credentials** 이동
4. **Create Credentials > OAuth client ID** 클릭
5. Application type: **Web application** 선택
6. 다음 정보 입력:
   - **Name**: `Autopsy Agent`
   - **Authorized JavaScript origins**:
     - `http://localhost:3001` (개발)
     - `https://your-domain.com` (프로덕션)
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/auth/callback/google` (개발)
     - `https://your-domain.com/api/auth/callback/google` (프로덕션)
7. **Create** 클릭 후 Client ID와 Client Secret 복사

#### 환경 변수

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 3. GitHub OAuth

#### 설정 절차

1. [GitHub Developer Settings](https://github.com/settings/developers) 접속
2. **OAuth Apps > New OAuth App** 클릭
3. 다음 정보 입력:
   - **Application name**: `Autopsy Agent`
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/api/auth/callback/github`
4. **Register application** 클릭
5. **Generate a new client secret** 클릭하여 Secret 생성
6. Client ID와 Client Secret 복사

#### 환경 변수

```env
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
```

### 4. GitLab OAuth

#### 설정 절차

1. [GitLab User Settings > Applications](https://gitlab.com/-/user_settings/applications) 접속
2. **Add new application** 클릭
3. 다음 정보 입력:
   - **Name**: `Autopsy Agent`
   - **Redirect URI**:
     ```
     http://localhost:3001/api/auth/callback/gitlab
     https://your-domain.com/api/auth/callback/gitlab
     ```
   - **Confidential**: 체크
   - **Scopes**: `read_api`, `read_user`, `read_repository`
4. **Save application** 클릭
5. Application ID와 Secret 복사

#### 환경 변수

```env
GITLAB_CLIENT_ID="your-application-id"
GITLAB_CLIENT_SECRET="your-secret"
```

### 5. PortOne 결제 (V1 아임포트)

#### 설정 절차

1. [PortOne 관리자 콘솔](https://admin.portone.io/) 회원가입/로그인
2. **결제 연동 > 테스트 연동 관리** 이동
3. **KG이니시스** 선택 후 채널 추가
4. **결제 연동 > 식별코드・API Keys** 이동
5. 다음 정보 확인:
   - **고객사 식별코드** (IMP_CODE): `impXXXXXXXX`
   - **REST API Key**
   - **REST API Secret**
6. **채널 관리**에서 채널 키 확인

#### PG사별 MID (테스트용)

| PG사 | 일반결제 MID | 정기결제 MID |
|------|-------------|-------------|
| KG이니시스 | `INIpayTest` | `INIBillTst` |

#### 환경 변수

```env
# PortOne V1 (아임포트)
NEXT_PUBLIC_IMP_CODE="impXXXXXXXX"
NEXT_PUBLIC_PORTONE_CHANNEL_KEY="channel-key-XXXX-XXXX"
PORTONE_REST_API_KEY="your-rest-api-key"
PORTONE_REST_API_SECRET="your-rest-api-secret"
```

#### 테스트 결제

- **테스트 환경**: 실제 카드로 결제 (당일 23:00~23:50 자동 취소)
- **신용카드 권장**: 체크카드는 즉시 출금되어 수동 환불 필요
- **환불 API**: `/api/payment/refund` (일수 기반 부분 환불 지원)

#### 참고 문서

- [PortOne 개발자센터](https://developers.portone.io/)
- [V1 API 문서](https://developers.portone.io/api/rest-v1)
- [KG이니시스 연동 가이드](https://developers.portone.io/opi/ko/integration/start/v1/auth)

---

## Environment Variables Reference

```env
# ===================
# Application
# ===================
PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3001

# ===================
# Database
# ===================
# SQLite (개발용)
DATABASE_URL="file:./dev.db"

# PostgreSQL (프로덕션용)
# DATABASE_URL="postgresql://user:password@localhost:5432/autopsy_agent"

# ===================
# Authentication
# ===================
AUTH_SECRET="openssl rand -base64 32 로 생성"
AUTH_URL="http://localhost:3001"

# ===================
# OAuth Providers
# ===================
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

GITLAB_CLIENT_ID=""
GITLAB_CLIENT_SECRET=""

# ===================
# Payment (PortOne V1)
# ===================
NEXT_PUBLIC_IMP_CODE=""
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=""
PORTONE_REST_API_KEY=""
PORTONE_REST_API_SECRET=""
```

---

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

---

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

docs/
├── ARCHITECTURE.md        # Architecture guide
└── e2e-test-architecture.md
```

---

## Features

- User authentication (Credentials + OAuth)
- GitHub/GitLab repository integration
- Multi-repository project support
- Security vulnerability scanning
- Subscription management with payment
- Pro-rata refund calculation

## License

MIT
