# Autopsy Agent Web Client

소프트웨어 보안 취약점 자동 분석 및 모의 침투 테스트 플랫폼

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js v5 (JWT strategy)
- **Database**: Prisma + SQLite
- **Testing**: Jest + React Testing Library

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

Create a `.env.local` file with the following variables:

```env
# Server
PORT=3001

# Database
DATABASE_URL="file:./dev.db"

# NextAuth
AUTH_URL="http://localhost:3001"
AUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

포트를 변경하려면 `.env.local`의 `PORT` 값을 수정하세요.

## TODO: OAuth Redirect URI Configuration

프로덕션 배포 시 각 OAuth 제공자의 Redirect URI를 업데이트해야 합니다.

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. APIs & Services > Credentials로 이동
3. OAuth 2.0 Client ID 선택
4. **Authorized redirect URIs**에 다음 추가:
   - 개발: `http://localhost:3001/api/auth/callback/google`
   - 프로덕션: `https://your-domain.com/api/auth/callback/google`

### GitHub OAuth

1. [GitHub Developer Settings](https://github.com/settings/developers)에 접속
2. OAuth Apps에서 앱 선택 (또는 New OAuth App 클릭)
3. **Authorization callback URL** 설정:
   - 개발: `http://localhost:3001/api/auth/callback/github`
   - 프로덕션: `https://your-domain.com/api/auth/callback/github`
4. **Homepage URL** 설정:
   - 개발: `http://localhost:3001`
   - 프로덕션: `https://your-domain.com`

### Important Notes

- NextAuth.js v5는 `/api/auth/callback/[provider]` 형식의 callback URL을 사용합니다
- `NEXTAUTH_URL` 환경 변수가 실제 배포 URL과 일치해야 합니다
- 로컬 개발 시 `localhost:3001`을 사용하므로 OAuth 앱에도 이 URL을 등록해야 합니다

## Available Scripts

```bash
npm run dev          # Start development server (port 3001)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (public)/          # Public pages (home, pricing, terms, privacy)
│   └── api/               # API routes
├── components/            # React components
├── domains/               # Domain logic (DDD structure)
├── infrastructure/        # Database and external services
├── lib/                   # Utilities and auth config
└── __tests__/            # Test files
```

## Features

- User authentication (credentials + OAuth)
- GitHub/GitLab repository integration
- Security vulnerability scanning
- Sandbox-based penetration testing
- Vulnerability reports with severity levels

## License

MIT
