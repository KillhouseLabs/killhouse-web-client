/**
 * Footer Component Tests
 *
 * 공용 Footer 사업자정보 표시 및 법적 링크 테스트
 */

import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/footer";
import { BUSINESS_INFO, LEGAL_ROUTES } from "@/config/constants";

describe("Footer", () => {
  beforeEach(() => {
    render(<Footer />);
  });

  describe("사업자정보 표시", () => {
    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 상호가 표시되어야 한다", () => {
      expect(screen.getByText(BUSINESS_INFO.companyName)).toBeInTheDocument();
    });

    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 대표자명이 표시되어야 한다", () => {
      expect(
        screen.getByText(new RegExp(BUSINESS_INFO.representative))
      ).toBeInTheDocument();
    });

    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 사업자등록번호가 표시되어야 한다", () => {
      expect(
        screen.getByText(new RegExp(BUSINESS_INFO.businessNumber))
      ).toBeInTheDocument();
    });

    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 통신판매업 신고번호가 표시되어야 한다", () => {
      expect(
        screen.getByText(new RegExp(BUSINESS_INFO.ecommerceRegistration))
      ).toBeInTheDocument();
    });

    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 주소가 표시되어야 한다", () => {
      expect(
        screen.getByText(new RegExp(BUSINESS_INFO.address))
      ).toBeInTheDocument();
    });

    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 이메일이 표시되어야 한다", () => {
      expect(
        screen.getByText(new RegExp(BUSINESS_INFO.email))
      ).toBeInTheDocument();
    });
  });

  describe("법적 링크", () => {
    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 이용약관 링크가 있어야 한다", () => {
      const link = screen.getByRole("link", { name: "이용약관" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", LEGAL_ROUTES.TERMS);
    });

    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 개인정보처리방침 링크가 있어야 한다", () => {
      const link = screen.getByRole("link", { name: "개인정보처리방침" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", LEGAL_ROUTES.PRIVACY);
    });
  });

  describe("저작권 표시", () => {
    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN 동적 연도가 표시되어야 한다", () => {
      const currentYear = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    });

    it("GIVEN Footer 렌더링 WHEN 화면 확인 THEN Killhouse 저작권이 표시되어야 한다", () => {
      expect(screen.getByText(/Killhouse/)).toBeInTheDocument();
    });
  });
});
