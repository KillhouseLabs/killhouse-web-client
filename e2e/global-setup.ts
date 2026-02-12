import { test as setup, expect } from "@playwright/test";

/**
 * Global Setup
 * E2E 테스트 실행 전 인증 상태 설정
 */
setup("authenticate", async ({ page }) => {
  // 테스트 로그인 API 사용 (개발 환경 전용)
  await page.goto("/api/auth/test-login?email=e2e-test@test.example.com");

  // 대시보드 또는 프로젝트 페이지로 리다이렉트 확인
  await expect(page).toHaveURL(/\/dashboard|\/projects|\/login/);

  // 로그인 페이지인 경우 (테스트 사용자 없음) - 회원가입 진행
  if (page.url().includes("/login")) {
    console.log("[Setup] Test user not found, creating via signup...");

    // 회원가입 페이지로 이동
    await page.goto("/signup");

    // 테스트 사용자 정보 입력
    await page.getByLabel(/이메일|email/i).fill("e2e-test@test.example.com");
    await page.getByLabel(/이름|name/i).fill("E2E Test User");
    await page.getByLabel(/비밀번호|password/i).first().fill("TestPassword123!");

    // 비밀번호 확인 필드가 있는 경우
    const confirmPassword = page.getByLabel(/비밀번호 확인|confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill("TestPassword123!");
    }

    // 약관 동의 체크박스가 있는 경우
    const termsCheckbox = page.getByLabel(/약관|terms/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // 회원가입 버튼 클릭
    await page.getByRole("button", { name: /회원가입|sign up|가입/i }).click();

    // 리다이렉트 대기
    await expect(page).toHaveURL(/\/dashboard|\/projects/, { timeout: 10000 });
  }

  // 인증 상태 저장
  await page.context().storageState({ path: "e2e/.auth/user.json" });

  console.log("[Setup] Authentication state saved to e2e/.auth/user.json");
});
