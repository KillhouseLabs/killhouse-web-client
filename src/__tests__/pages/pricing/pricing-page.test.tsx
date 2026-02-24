/**
 * Pricing Page - Pro CTA 동적 라우팅 테스트
 *
 * 로그인 상태에 따라 Pro CTA 버튼의 링크 대상이 달라야 한다:
 * - 로그인된 사용자: /subscription (구독 관리)
 * - 미로그인 사용자: /signup (회원가입)
 */

import { screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import PricingPage from "@/app/(public)/pricing/page";
import { renderWithLocale } from "@/__tests__/test-utils";

describe("Pricing Page - Pro CTA 동적 라우팅", () => {
  it("GIVEN 미로그인 사용자 WHEN Pricing 페이지 렌더링 THEN Pro CTA는 /signup으로 링크되어야 한다", () => {
    // GIVEN - jest.setup.js 기본값: unauthenticated
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    // WHEN
    renderWithLocale(<PricingPage />);

    // THEN
    const proCta = screen.getAllByRole("link").find((link) => {
      const href = link.getAttribute("href");
      return href === "/signup" || href === "/subscription";
    });
    expect(proCta).toBeDefined();
    expect(proCta!.getAttribute("href")).toBe("/signup");
  });

  it("GIVEN 로그인된 사용자 WHEN Pricing 페이지 렌더링 THEN Pro CTA는 /subscription으로 링크되어야 한다", () => {
    // GIVEN
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-123", email: "test@test.com", name: "Test User" },
        expires: "2099-01-01",
      },
      status: "authenticated",
    });

    // WHEN
    renderWithLocale(<PricingPage />);

    // THEN - Pro 카드의 CTA 링크를 찾아야 함
    const links = screen.getAllByRole("link");
    const proCta = links.find((link) => {
      const href = link.getAttribute("href");
      return href === "/subscription";
    });
    expect(proCta).toBeDefined();
    expect(proCta!.getAttribute("href")).toBe("/subscription");
  });

  it("GIVEN 세션 로딩 중 WHEN Pricing 페이지 렌더링 THEN Pro CTA는 /signup으로 링크되어야 한다", () => {
    // GIVEN
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "loading",
    });

    // WHEN
    renderWithLocale(<PricingPage />);

    // THEN - 로딩 중에는 기본값인 /signup 유지
    const links = screen.getAllByRole("link");
    const proCta = links.find((link) => {
      const href = link.getAttribute("href");
      return href === "/signup" || href === "/subscription";
    });
    expect(proCta).toBeDefined();
    expect(proCta!.getAttribute("href")).toBe("/signup");
  });
});
