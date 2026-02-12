# E2E Test Architecture: Playwright-BDD + TDD

## Overview

Playwright-BDD를 사용한 BDD 스타일 E2E 테스트 아키텍처.
TDD(Red-Green-Refactor) 방식으로 기능을 구현하기 전에 테스트를 먼저 작성.

## 디렉토리 구조

```
e2e/
├── features/                    # Gherkin feature 파일
│   ├── auth/
│   │   ├── login.feature        # @auth @smoke
│   │   ├── signup.feature       # @auth
│   │   └── oauth.feature        # @auth @oauth
│   ├── projects/
│   │   ├── create.feature       # @projects
│   │   ├── list.feature         # @projects @smoke
│   │   └── multi-repo.feature   # @projects @multi-repo
│   ├── repositories/
│   │   ├── connect.feature      # @repositories @integration
│   │   └── github.feature       # @repositories @github
│   ├── analyses/
│   │   ├── create.feature       # @analyses
│   │   └── limits.feature       # @analyses @subscription
│   └── subscription/
│       ├── upgrade.feature      # @subscription @payment
│       └── cancel.feature       # @subscription
├── steps/                       # Step definitions
│   ├── common.steps.ts          # 재사용 가능한 공통 스텝
│   ├── auth.steps.ts
│   ├── project.steps.ts
│   ├── repository.steps.ts
│   ├── analysis.steps.ts
│   └── subscription.steps.ts
├── pages/                       # Page Object Models
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── ProjectPage.ts
│   ├── RepositoryPage.ts
│   └── SubscriptionPage.ts
├── fixtures/                    # Test fixtures
│   ├── test-data.ts             # 테스트 데이터 팩토리
│   ├── auth.fixture.ts          # 인증 fixture
│   └── db.fixture.ts            # DB 시딩/정리
├── .auth/                       # 저장된 인증 상태
│   └── user.json
├── fixtures.ts                  # 통합 fixture 정의
└── global-setup.ts              # 전역 설정 (DB 시딩, 인증)
```

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install -D @playwright/test playwright-bdd
npx playwright install chromium
```

### 2. Playwright 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  outputDir: '.features-gen',
  featuresRoot: 'e2e/features',
  importTestFrom: './e2e/fixtures.ts',
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github' as const]] : []),
  ],

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

### 3. Package.json 스크립트

```json
{
  "scripts": {
    "e2e": "npx bddgen && npx playwright test",
    "e2e:ui": "npx bddgen && npx playwright test --ui",
    "e2e:debug": "npx bddgen && npx playwright test --debug",
    "e2e:headed": "npx bddgen && npx playwright test --headed",
    "e2e:report": "npx playwright show-report",
    "e2e:wip": "npx bddgen && npx playwright test --grep @wip",
    "e2e:smoke": "npx bddgen && npx playwright test --grep @smoke"
  }
}
```

## TDD 워크플로우

### Phase 1: RED - 실패하는 테스트 작성

```gherkin
# e2e/features/projects/create.feature
@projects @wip
Feature: 프로젝트 생성

  Background:
    Given 나는 로그인된 사용자다

  @smoke
  Scenario: 단일 저장소로 프로젝트 생성
    Given 나는 프로젝트 목록 페이지에 있다
    When "새 프로젝트" 버튼을 클릭한다
    And 프로젝트 이름으로 "테스트 프로젝트"를 입력한다
    And GitHub 저장소 "my-org/my-repo"를 선택한다
    And "생성" 버튼을 클릭한다
    Then "프로젝트가 생성되었습니다" 메시지가 표시되어야 한다
    And 프로젝트 상세 페이지로 이동해야 한다
    And 저장소 "my-org/my-repo"가 primary로 표시되어야 한다

  @multi-repo
  Scenario: 여러 저장소로 프로젝트 생성
    Given 나는 새 프로젝트 생성 페이지에 있다
    When 프로젝트 이름으로 "마이크로서비스"를 입력한다
    And 다음 저장소들을 추가한다:
      | provider | repository        | role     |
      | GITHUB   | my-org/frontend   | frontend |
      | GITHUB   | my-org/backend    | backend  |
      | GITLAB   | company/shared    | shared   |
    And "생성" 버튼을 클릭한다
    Then 프로젝트에 3개의 저장소가 연결되어야 한다
    And 첫 번째 저장소가 primary로 설정되어야 한다
```

### Phase 2: Step Definitions 작성

```typescript
// e2e/steps/project.steps.ts
import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures';
import { expect } from '@playwright/test';
import { DataTable } from '@cucumber/cucumber';

const { Given, When, Then } = createBdd(test);

Given('나는 프로젝트 목록 페이지에 있다', async ({ projectPage }) => {
  await projectPage.goto();
});

Given('나는 새 프로젝트 생성 페이지에 있다', async ({ projectPage }) => {
  await projectPage.gotoCreate();
});

When('"새 프로젝트" 버튼을 클릭한다', async ({ projectPage }) => {
  await projectPage.clickNewProject();
});

When('프로젝트 이름으로 {string}를 입력한다', async ({ projectPage }, name: string) => {
  await projectPage.fillProjectName(name);
});

When('GitHub 저장소 {string}를 선택한다', async ({ projectPage }, repo: string) => {
  await projectPage.selectGitHubRepository(repo);
});

When('다음 저장소들을 추가한다:', async ({ projectPage }, dataTable: DataTable) => {
  for (const row of dataTable.hashes()) {
    await projectPage.addRepository({
      provider: row.provider as 'GITHUB' | 'GITLAB',
      repository: row.repository,
      role: row.role,
    });
  }
});

When('"생성" 버튼을 클릭한다', async ({ projectPage }) => {
  await projectPage.submitCreate();
});

Then('{string} 메시지가 표시되어야 한다', async ({ page }, message: string) => {
  await expect(page.getByText(message)).toBeVisible();
});

Then('프로젝트 상세 페이지로 이동해야 한다', async ({ page }) => {
  await expect(page).toHaveURL(/\/projects\/[a-z0-9]+$/);
});

Then('저장소 {string}가 primary로 표시되어야 한다', async ({ page }, repoName: string) => {
  const primaryBadge = page.getByTestId('repository-item').filter({ hasText: repoName });
  await expect(primaryBadge.getByText('Primary')).toBeVisible();
});

Then('프로젝트에 {int}개의 저장소가 연결되어야 한다', async ({ page }, count: number) => {
  const repos = page.getByTestId('repository-item');
  await expect(repos).toHaveCount(count);
});

Then('첫 번째 저장소가 primary로 설정되어야 한다', async ({ page }) => {
  const firstRepo = page.getByTestId('repository-item').first();
  await expect(firstRepo.getByText('Primary')).toBeVisible();
});
```

### Phase 3: Page Object Model

```typescript
// e2e/pages/ProjectPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { Fixture, Given, When, Then } from 'playwright-bdd/decorators';
import type { test } from '../fixtures';

interface RepositoryInput {
  provider: 'GITHUB' | 'GITLAB';
  repository: string;
  role?: string;
}

export
@Fixture<typeof test>('projectPage')
class ProjectPage {
  readonly newProjectButton: Locator;
  readonly projectNameInput: Locator;
  readonly submitButton: Locator;
  readonly repositoryList: Locator;

  constructor(public page: Page) {
    this.newProjectButton = page.getByRole('button', { name: /새 프로젝트|New Project/i });
    this.projectNameInput = page.getByLabel(/프로젝트 이름|Project Name/i);
    this.submitButton = page.getByRole('button', { name: /생성|Create/i });
    this.repositoryList = page.getByTestId('repository-list');
  }

  async goto() {
    await this.page.goto('/projects');
    await expect(this.page).toHaveURL('/projects');
  }

  async gotoCreate() {
    await this.page.goto('/projects/new');
    await expect(this.page).toHaveURL('/projects/new');
  }

  async clickNewProject() {
    await this.newProjectButton.click();
  }

  async fillProjectName(name: string) {
    await this.projectNameInput.fill(name);
  }

  async selectGitHubRepository(repoFullName: string) {
    await this.page.getByRole('button', { name: /GitHub/ }).click();
    await this.page.getByRole('option', { name: repoFullName }).click();
  }

  async addRepository(input: RepositoryInput) {
    await this.page.getByRole('button', { name: /저장소 추가|Add Repository/i }).click();

    // Provider 선택
    await this.page.getByRole('tab', { name: input.provider }).click();

    // 저장소 검색 및 선택
    const searchInput = this.page.getByPlaceholder(/저장소 검색|Search/i);
    await searchInput.fill(input.repository);
    await this.page.getByRole('option', { name: input.repository }).click();

    // Role 설정 (optional)
    if (input.role) {
      await this.page.getByLabel(/역할|Role/i).fill(input.role);
    }

    await this.page.getByRole('button', { name: /추가|Add/i }).click();
  }

  async submitCreate() {
    await this.submitButton.click();
  }
}
```

### Phase 4: Fixtures 설정

```typescript
// e2e/fixtures.ts
import { test as base, expect } from 'playwright-bdd';
import { PrismaClient } from '@prisma/client';
import { ProjectPage } from './pages/ProjectPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

const prisma = new PrismaClient();

type TestFixtures = {
  projectPage: ProjectPage;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: ReturnType<typeof base.extend>;
  testUser: { id: string; email: string; name: string };
};

export const test = base.extend<TestFixtures>({
  // Page Objects
  projectPage: async ({ page }, use) => {
    await use(new ProjectPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  // Pre-authenticated page
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Test user fixture (created/cleaned per test)
  testUser: async ({}, use, testInfo) => {
    const uniqueEmail = `test-${testInfo.testId}-${Date.now()}@test.example.com`;

    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: `Test User ${testInfo.testId}`,
        password: 'hashedpassword', // Test password
      },
    });

    await use({ id: user.id, email: user.email, name: user.name ?? '' });

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  },
});

export { expect };
```

## 주요 테스트 시나리오

### 1. 인증 (auth/)

```gherkin
# login.feature
@auth @smoke
Feature: 사용자 로그인

  Scenario: 이메일/비밀번호로 로그인
    Given 나는 로그인 페이지에 있다
    When 이메일 "test@example.com"을 입력한다
    And 비밀번호 "Password123"을 입력한다
    And 로그인 버튼을 클릭한다
    Then 대시보드로 이동해야 한다

  Scenario: 잘못된 비밀번호로 로그인 실패
    Given 나는 로그인 페이지에 있다
    When 이메일 "test@example.com"을 입력한다
    And 비밀번호 "wrongpassword"를 입력한다
    And 로그인 버튼을 클릭한다
    Then "이메일 또는 비밀번호가 올바르지 않습니다" 에러가 표시되어야 한다

# oauth.feature
@auth @oauth
Feature: OAuth 로그인

  @github
  Scenario: GitHub으로 로그인
    Given 나는 로그인 페이지에 있다
    When "GitHub로 계속하기" 버튼을 클릭한다
    Then GitHub 인증 페이지로 리다이렉트되어야 한다

  @gitlab
  Scenario: GitLab으로 로그인
    Given 나는 로그인 페이지에 있다
    When "GitLab으로 계속하기" 버튼을 클릭한다
    Then GitLab 인증 페이지로 리다이렉트되어야 한다
```

### 2. 분석 (analyses/)

```gherkin
# create.feature
@analyses
Feature: 분석 생성

  Background:
    Given 나는 로그인된 사용자다
    And Pro 플랜을 구독 중이다
    And "테스트 프로젝트" 프로젝트가 존재한다

  @smoke
  Scenario: 분석 시작
    Given 나는 프로젝트 상세 페이지에 있다
    When "분석 시작" 버튼을 클릭한다
    And 브랜치 "main"을 선택한다
    And "시작" 버튼을 클릭한다
    Then 분석이 "PENDING" 상태로 생성되어야 한다
    And 분석 목록에 새 분석이 표시되어야 한다

# limits.feature
@analyses @subscription
Feature: 분석 제한

  Scenario: 무료 플랜 사용자가 월간 분석 한도 초과
    Given 나는 무료 플랜 사용자다
    And 이번 달에 10회 분석을 완료했다
    When 새 분석을 시작하려고 한다
    Then "월간 분석 한도를 초과했습니다" 메시지가 표시되어야 한다
    And 업그레이드 모달이 표시되어야 한다
```

### 3. 구독 (subscription/)

```gherkin
# upgrade.feature
@subscription @payment
Feature: 구독 업그레이드

  Scenario: Pro 플랜으로 업그레이드
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    When "Pro 플랜 구독하기" 버튼을 클릭한다
    And 결제를 완료한다
    Then "구독이 성공적으로 완료되었습니다" 메시지가 표시되어야 한다
    And 현재 플랜이 "Pro"로 표시되어야 한다
    And 프로젝트 제한이 "무제한"으로 변경되어야 한다

# cancel.feature
@subscription
Feature: 구독 해지

  Scenario: 구독 해지 후 무료 플랜으로 다운그레이드
    Given 나는 Pro 플랜 사용자다
    And 나는 구독 페이지에 있다
    When "구독 해지" 버튼을 클릭한다
    And 확인 팝업에서 "계속" 버튼을 클릭한다
    Then "구독이 해지되었습니다" 메시지가 표시되어야 한다
    And 현재 플랜이 "Free"로 표시되어야 한다
```

## 인증 처리

### Test API Route (개발 환경 전용)

```typescript
// src/app/api/auth/test-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 세션 생성 (NextAuth 내부 로직 사용)
  // ... session creation logic

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### Global Setup

```typescript
// e2e/global-setup.ts
import { test as setup } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

setup('create test user and authenticate', async ({ page }) => {
  // 1. 테스트 사용자 생성
  const hashedPassword = await bcrypt.hash('TestPassword123', 10);

  await prisma.user.upsert({
    where: { email: 'e2e-test@test.example.com' },
    update: {},
    create: {
      email: 'e2e-test@test.example.com',
      name: 'E2E Test User',
      password: hashedPassword,
    },
  });

  // 2. 로그인 및 상태 저장
  await page.goto('/api/auth/test-login?email=e2e-test@test.example.com');
  await page.waitForURL('/dashboard');

  // 3. 인증 상태 저장
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

## CI/CD 통합

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_e2e
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install chromium --with-deps

      - name: Setup database
        run: npx prisma db push
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_e2e

      - name: Generate BDD tests
        run: npx bddgen

      - name: Run E2E tests
        run: npx playwright test --grep-invert "@wip"
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_e2e
          AUTH_SECRET: test-secret-for-e2e
          AUTH_URL: http://localhost:3001

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## 예상 테스트 수

| 카테고리 | 시나리오 수 |
|---------|-----------|
| 인증 (3 providers) | 12 |
| 프로젝트 관리 | 8 |
| 저장소 관리 | 8 |
| 분석 워크플로우 | 6 |
| 구독/결제 | 10 |
| 사용자 계정 | 4 |
| 에러 핸들링 | 15 |
| **총계** | **~63** |

## 실행 방법

```bash
# 모든 E2E 테스트 실행
npm run e2e

# UI 모드로 실행 (디버깅)
npm run e2e:ui

# 특정 태그만 실행
npm run e2e:smoke     # @smoke 태그
npm run e2e:wip       # @wip 태그 (개발 중인 테스트)

# 특정 feature 파일 실행
npx bddgen && npx playwright test --grep "프로젝트 생성"
```
