# Killhouse - Architecture Guide

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Route Group: Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       # Route Group: Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── mypage/
│   │   ├── projects/
│   │   └── subscription/
│   ├── (public)/          # Route Group: Public pages
│   │   ├── pricing/
│   │   ├── privacy/
│   │   └── terms/
│   └── api/               # API Routes
│       ├── auth/          # NextAuth & auth endpoints
│       ├── github/        # GitHub integration
│       ├── gitlab/        # GitLab integration
│       ├── payment/       # Payment processing
│       ├── projects/      # Project CRUD
│       ├── subscription/  # Subscription management
│       └── user/          # User management
│
├── components/            # React Components (by feature)
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components (sidebar, header)
│   ├── project/          # Project-related components
│   ├── providers/        # React context providers
│   ├── subscription/     # Subscription & payment components
│   └── user/             # User account components
│
├── config/               # Application Configuration
│   ├── constants.ts      # App-wide constants (PLANS, limits)
│   └── env.ts            # Environment variable validation
│
├── domains/              # Domain-Driven Design Layer
│   ├── auth/             # Authentication domain
│   │   ├── dto/         # Data Transfer Objects
│   │   ├── model/       # Domain models
│   │   ├── repository/  # Data access interfaces
│   │   └── usecase/     # Business logic
│   ├── payment/         # Payment domain
│   ├── project/         # Project domain
│   └── subscription/    # Subscription domain
│
├── infrastructure/       # Infrastructure Layer
│   ├── database/        # Prisma client
│   ├── github/          # GitHub API client
│   └── gitlab/          # GitLab API client
│
├── lib/                  # Shared Libraries
│   ├── api/             # API utilities (middleware)
│   ├── auth.ts          # NextAuth configuration
│   └── utils.ts         # General utilities
│
├── types/               # TypeScript Definitions
│   ├── index.ts         # Global types
│   └── next-auth.d.ts   # NextAuth type augmentation
│
└── middleware.ts        # Next.js Request Middleware
```

## Architecture Patterns

### 1. Domain-Driven Design (DDD)

The project uses a layered DDD approach:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│              (app/, components/, pages)                  │
├─────────────────────────────────────────────────────────┤
│                    Application Layer                     │
│                  (domains/*/usecase/)                    │
├─────────────────────────────────────────────────────────┤
│                      Domain Layer                        │
│              (domains/*/model/, domains/*/dto/)          │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                    │
│            (infrastructure/, domains/*/repository/)      │
└─────────────────────────────────────────────────────────┘
```

### 2. Data Flow

```
API Route → UseCase → Model → Repository → Database
    │           │         │          │
    │           │         │          └── Prisma Client
    │           │         └── Domain Rules & Validation
    │           └── Business Logic & Orchestration
    └── Request Parsing & Response Formatting
```

### 3. Route Groups

Next.js 14 route groups organize pages by access level:

| Group | Path | Purpose | Auth Required |
|-------|------|---------|---------------|
| `(auth)` | `/login`, `/signup` | Authentication flows | No |
| `(dashboard)` | `/dashboard`, `/projects` | Protected features | Yes |
| `(public)` | `/`, `/pricing` | Public content | No |

## Key Design Decisions

### Why DDD in Next.js?

1. **Separation of Concerns**: Business logic stays in `domains/`, not in API routes
2. **Testability**: UseCase and Model layers can be unit tested without HTTP
3. **Scalability**: New features are added by creating new domain modules
4. **Maintainability**: Clear boundaries prevent code coupling

### Component Organization

Components are organized by **feature/domain** rather than type:

```
✓ components/project/project-list.tsx
✓ components/project/project-detail.tsx

✗ components/lists/ProjectList.tsx  (avoided)
✗ components/cards/ProjectCard.tsx  (avoided)
```

### API Route Organization

API routes follow REST conventions:

```
GET    /api/projects           → List projects
POST   /api/projects           → Create project
GET    /api/projects/[id]      → Get project
PATCH  /api/projects/[id]      → Update project
DELETE /api/projects/[id]      → Delete project
```

## Testing Strategy

```
__tests__/
├── api/           # API route integration tests
├── components/    # Component unit tests
├── domains/       # Domain logic unit tests
└── lib/           # Utility function tests

e2e/
├── features/      # Cucumber/Gherkin feature files
├── steps/         # Step definitions
└── fixtures/      # Test fixtures (auth, pages)
```

### Test Location Rationale

Tests are in `__tests__/` directory (not co-located) because:
- Large test suites benefit from clear separation
- Parallel structure mirrors source structure
- IDE integration works well with both approaches

## Environment Configuration

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
AUTH_SECRET="..."
AUTH_URL="http://localhost:3001"

# OAuth Providers
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITLAB_CLIENT_ID="..."
GITLAB_CLIENT_SECRET="..."

# Payment (PortOne V1)
NEXT_PUBLIC_IMP_CODE="..."
NEXT_PUBLIC_PORTONE_CHANNEL_KEY="..."
PORTONE_REST_API_KEY="..."
PORTONE_REST_API_SECRET="..."
```

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 14.2.x |
| Language | TypeScript | 5.4.x |
| UI | React | 18.3.x |
| Database | Prisma + SQLite/PostgreSQL | 5.10.x |
| Auth | NextAuth.js | 5.0.0-beta |
| Testing | Jest + Playwright | 30.x / 1.42.x |
| Payment | PortOne (아임포트) V1 | - |

## Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `project-list.tsx` |
| Components | PascalCase | `export function ProjectList()` |
| Functions | camelCase | `handleSubmit()` |
| Types | PascalCase | `interface ProjectData` |
| Constants | UPPER_SNAKE | `const PLANS = {...}` |

### Code Style

- ESLint with strict TypeScript rules
- Prettier for formatting
- "use client" directive for client components
- Zod for runtime validation
