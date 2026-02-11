# Autopsy Agent Web Client - Implementation Plan

## Project Overview

**목적**: 취약점 분석 서비스 웹 클라이언트
**스타일**: Vercel 대시보드 형태
**핵심 기능**: 회원가입/로그인 → 프로젝트 생성 → 코드/컨테이너 업로드 → 취약점 분석 → 리포트

---

## Tech Stack

| Category | Technology | Rationale |
|----------|------------|-----------|
| Framework | Next.js 14+ (App Router) | Server Components, 최신 React 패턴 |
| Language | TypeScript | 타입 안전성 |
| Styling | Tailwind CSS + shadcn/ui | 빠른 개발, 높은 커스터마이징 |
| State | Zustand + TanStack Query | 경량 클라이언트 상태 + 서버 상태 관리 |
| Auth | NextAuth.js v5 | 다양한 provider 지원, 세션 관리 |
| Payment | Stripe | 글로벌 표준, 구독 관리 용이 |
| DB ORM | Prisma | 타입 안전한 DB 접근 |
| Validation | Zod + React Hook Form | 스키마 기반 검증 |
| Testing | Vitest + Playwright | 단위 + E2E 테스트 |
| CI/CD | GitHub Actions + Vercel | 자동화된 배포 파이프라인 |

---

## Project Structure

```
autopsy-agent-web-client/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # 인증 라우트 그룹
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # 인증 필수 영역
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── mypage/
│   │   │   ├── subscription/
│   │   │   └── layout.tsx
│   │   ├── (public)/                 # 공개 페이지
│   │   │   ├── page.tsx
│   │   │   └── pricing/
│   │   ├── api/                      # API Routes
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── domains/                      # Domain-Driven Design
│   │   ├── auth/
│   │   │   ├── model/
│   │   │   ├── usecase/
│   │   │   ├── repository/
│   │   │   └── dto/
│   │   ├── user/
│   │   ├── project/
│   │   ├── subscription/
│   │   └── analysis/
│   │
│   ├── infrastructure/               # External Systems
│   │   ├── api/
│   │   ├── database/
│   │   ├── payment/
│   │   └── storage/
│   │
│   ├── components/                   # UI Components
│   │   ├── common/
│   │   ├── layout/
│   │   └── features/
│   │
│   ├── hooks/                        # Custom Hooks
│   ├── lib/                          # Utilities
│   ├── types/                        # Type Definitions
│   └── config/                       # Configuration
│
├── public/                           # Static Assets
├── tests/                            # Test Files
├── .github/workflows/                # CI/CD
├── prisma/                           # Database Schema
└── [config files]
```

---

## Implementation Phases

### Phase 1: Foundation ✅ Current
- [x] Next.js 프로젝트 초기화
- [x] TypeScript 설정
- [x] ESLint + Prettier 설정
- [x] Tailwind CSS 설정
- [x] shadcn/ui 설정
- [x] 기본 레이아웃 구조
- [x] 환경변수 구조

**Deliverable**: 기본 랜딩 페이지가 표시되는 웹사이트

---

### Phase 2: Authentication
- [ ] NextAuth.js 설정
- [ ] Prisma + DB 설정
- [ ] User 모델 정의
- [ ] 회원가입 페이지/API
- [ ] 로그인 페이지/API
- [ ] 인증 미들웨어
- [ ] 세션 관리

**Deliverable**: 회원가입/로그인이 동작하는 인증 시스템

---

### Phase 3: User Management
- [ ] 마이페이지 UI
- [ ] 프로필 조회/수정
- [ ] 비밀번호 변경
- [ ] 계정 삭제

**Deliverable**: 사용자 정보 관리가 가능한 마이페이지

---

### Phase 4: Dashboard & Projects
- [ ] 대시보드 레이아웃
- [ ] 프로젝트 목록
- [ ] 프로젝트 생성/수정/삭제
- [ ] 프로젝트 상세 페이지

**Deliverable**: 프로젝트 CRUD가 가능한 대시보드

---

### Phase 5: Analysis Core
- [ ] 파일 업로드 컴포넌트
- [ ] 코드/컨테이너 업로드 API
- [ ] 분석 요청 기능
- [ ] 분석 상태 추적
- [ ] 결과 리포트 표시

**Deliverable**: 파일 업로드 및 분석 결과 확인 기능

---

### Phase 6: Subscription & Payment
- [ ] 플랜/가격 페이지
- [ ] Stripe 연동
- [ ] 구독 생성/관리
- [ ] 결제 이력
- [ ] 플랜별 기능 제한

**Deliverable**: 구독 결제가 가능한 결제 시스템

---

### Phase 7: CI/CD & Production
- [ ] GitHub Actions 워크플로우
- [ ] 테스트 자동화
- [ ] Preview 배포
- [ ] Production 배포
- [ ] 모니터링 설정

**Deliverable**: 자동화된 CI/CD 파이프라인

---

## Review Points per Phase

각 Phase 완료 시 다음 항목을 리뷰합니다:

1. **동작 확인**: 실제 웹사이트에서 기능 테스트
2. **코드 구조**: 파일/폴더 구조, 모듈화
3. **아키텍처**: DDD 원칙 준수, 레이어 분리
4. **타입 안전성**: TypeScript 활용
5. **성능**: 불필요한 리렌더링, 번들 크기
6. **보안**: 인증/인가, 입력 검증

---

## Commands

```bash
# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 린트
pnpm lint

# 테스트
pnpm test

# E2E 테스트
pnpm test:e2e
```

---

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

---

## Progress Tracking

| Phase | Status | Start Date | End Date |
|-------|--------|------------|----------|
| 1. Foundation | 🔄 In Progress | 2024-XX-XX | - |
| 2. Authentication | ⏳ Pending | - | - |
| 3. User Management | ⏳ Pending | - | - |
| 4. Dashboard | ⏳ Pending | - | - |
| 5. Analysis | ⏳ Pending | - | - |
| 6. Subscription | ⏳ Pending | - | - |
| 7. CI/CD | ⏳ Pending | - | - |
