# Deployment Guide

이 문서는 GitHub Actions와 Vercel을 사용한 CI/CD 파이프라인 설정 방법을 설명합니다.

## CI/CD Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CI Pipeline                              │
├─────────────────────────────────────────────────────────────────┤
│  Push/PR → Quality Check → Tests → Build                        │
│            (lint, format,  (jest)  (next build)                 │
│             type-check)                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Deploy Pipeline                             │
├─────────────────────────────────────────────────────────────────┤
│  PR → Preview Deployment    │    Main → Production Deployment   │
│       (vercel preview)      │           (vercel --prod)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Security Pipeline                             │
├─────────────────────────────────────────────────────────────────┤
│  Dependency Audit → CodeQL Analysis → Secret Scanning           │
│  (npm audit)        (static analysis)  (gitleaks)               │
└─────────────────────────────────────────────────────────────────┘
```

## Required GitHub Secrets

Repository Settings → Secrets and variables → Actions에서 다음 시크릿을 설정하세요:

### Vercel Deployment

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API 토큰 | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel 조직 ID | `.vercel/project.json` 또는 Vercel Dashboard |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | `.vercel/project.json` 또는 Vercel Dashboard |

### Optional Secrets

| Secret | Description |
|--------|-------------|
| `CODECOV_TOKEN` | Codecov 커버리지 리포트 업로드 |
| `GITLEAKS_LICENSE` | Gitleaks Pro 라이선스 (선택) |

## Vercel 설정

### 1. Vercel CLI 설치

```bash
npm install -g vercel@latest
```

### 2. Vercel 프로젝트 연결

```bash
vercel link
```

이 명령어는 `.vercel/project.json` 파일을 생성하며, 여기서 `orgId`와 `projectId`를 확인할 수 있습니다.

### 3. 환경 변수 설정

Vercel Dashboard → Project → Settings → Environment Variables에서 다음 환경 변수를 설정하세요:

#### Production & Preview 공통

```
DATABASE_URL=postgresql://...
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
AUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Autopsy Agent
```

#### OAuth Providers (선택)

```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
```

## Workflow Files

### 1. CI (`ci.yml`)

- **트리거**: Push, PR
- **작업**:
  - Format Check (`npm run format:check`)
  - Lint (`npm run lint`)
  - Type Check (`npm run type-check`)
  - Test with Coverage (`npm run test:coverage`)
  - Build (`npm run build`)

### 2. Security (`security.yml`)

- **트리거**: Push to main, PR to main, 매주 월요일
- **작업**:
  - npm audit (의존성 취약점 검사)
  - CodeQL Analysis (정적 코드 분석)
  - Gitleaks (시크릿 스캐닝)

### 3. Deploy (`deploy.yml`)

- **트리거**: Push to main, PR to main
- **작업**:
  - PR → Preview 배포 + PR 코멘트
  - Main → Production 배포

## Local Development

### 환경 변수 설정

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Vercel 로컬 개발

```bash
vercel dev
```

## Troubleshooting

### Build 실패 시

1. Prisma Client 생성 확인:
   ```bash
   npm run db:generate
   ```

2. 환경 변수 확인:
   ```bash
   vercel env pull
   ```

### Preview 배포 URL이 안 나올 때

1. `VERCEL_TOKEN` 권한 확인
2. `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 확인

### CodeQL 분석 실패 시

1. Repository Settings → Code security and analysis → CodeQL 활성화
2. `security-events: write` 권한 확인

## Branch Protection Rules (권장)

Repository Settings → Branches → Add rule:

- Branch name pattern: `main`
- Require status checks:
  - `Code Quality`
  - `Tests`
  - `Build`
- Require branches to be up to date
- Require pull request reviews: 1

## Monitoring

- **Vercel Dashboard**: 배포 상태, 로그, 성능 메트릭
- **GitHub Actions**: 워크플로우 실행 기록
- **Codecov**: 테스트 커버리지 추이
