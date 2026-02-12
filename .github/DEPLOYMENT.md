# CI/CD Guide

이 문서는 GitHub Actions CI 파이프라인 설정을 설명합니다.

## CI Pipeline Overview

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
│                    Security Pipeline                             │
├─────────────────────────────────────────────────────────────────┤
│  Dependency Audit → CodeQL Analysis → Secret Scanning           │
│  (npm audit)        (static analysis)  (gitleaks)               │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow Files

### 1. CI (`ci.yml`)

- **트리거**: Push to main/develop, PR to main/develop
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

## Local Development

### 환경 변수 설정

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 개발 서버 실행

```bash
npm run dev
```

### CI 체크 로컬 실행

```bash
# Format check
npm run format:check

# Lint
npm run lint

# Type check
npm run type-check

# Tests
npm run test:coverage

# Build
npm run build
```

## Branch Protection Rules (권장)

Repository Settings → Branches → Add rule:

- Branch name pattern: `main`
- Require status checks:
  - `Code Quality`
  - `Tests`
  - `Build`
- Require branches to be up to date
- Require pull request reviews: 1
