/**
 * AppFooter Component Tests
 *
 * 푸터 컴포넌트 렌더링 및 i18n 테스트
 */

import { screen } from "@testing-library/react";
import { AppFooter } from "@/components/layout/app-footer";
import { renderWithLocale } from "../../test-utils";
import { BUSINESS_INFO } from "@/config/constants";

describe("AppFooter", () => {
  describe("variant='full'", () => {
    it("GIVEN full variant WHEN 렌더링 THEN 사업자정보가 표시되어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="full" />);

      // THEN
      expect(screen.getByText(BUSINESS_INFO.companyName)).toBeInTheDocument();
      expect(
        screen.getByText(
          `대표: ${BUSINESS_INFO.representative} | 사업자등록번호: ${BUSINESS_INFO.businessNumber}`
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `통신판매업 신고번호: ${BUSINESS_INFO.ecommerceRegistration}`
        )
      ).toBeInTheDocument();
      expect(screen.getByText(BUSINESS_INFO.address)).toBeInTheDocument();
    });

    it("GIVEN full variant WHEN 렌더링 THEN 이용약관/개인정보처리방침 링크가 있어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="full" />);

      // THEN
      expect(screen.getByText("이용약관")).toBeInTheDocument();
      expect(screen.getByText("개인정보처리방침")).toBeInTheDocument();
    });

    it("GIVEN full variant WHEN 렌더링 THEN 제품/회사/법적 섹션 헤더가 표시되어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="full" />);

      // THEN
      expect(screen.getByText("제품")).toBeInTheDocument();
      expect(screen.getByText("회사")).toBeInTheDocument();
      expect(screen.getByText("법적 고지")).toBeInTheDocument();
    });

    it("GIVEN full variant WHEN 렌더링 THEN 저작권 표시가 있어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="full" />);

      // THEN
      expect(screen.getByText(/All rights reserved\./)).toBeInTheDocument();
    });

    it("GIVEN full variant WHEN 렌더링 THEN 시스템 상태 표시가 있어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="full" />);

      // THEN
      expect(screen.getByText("전체 시스템 정상 운영 중")).toBeInTheDocument();
    });
  });

  describe("variant='compact'", () => {
    it("GIVEN compact variant WHEN 렌더링 THEN 사업자정보가 표시되어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="compact" />);

      // THEN
      expect(screen.getByText(BUSINESS_INFO.companyName)).toBeInTheDocument();
      expect(
        screen.getByText(`사업자등록번호: ${BUSINESS_INFO.businessNumber}`)
      ).toBeInTheDocument();
    });

    it("GIVEN compact variant WHEN 렌더링 THEN 이용약관/개인정보처리방침 링크가 있어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="compact" />);

      // THEN
      expect(screen.getByText("이용약관")).toBeInTheDocument();
      expect(screen.getByText("개인정보처리방침")).toBeInTheDocument();
    });

    it("GIVEN compact variant WHEN 렌더링 THEN 저작권 표시가 있어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="compact" />);

      // THEN
      expect(screen.getByText(/All rights reserved\./)).toBeInTheDocument();
    });
  });

  describe("i18n", () => {
    it("GIVEN en locale WHEN full variant 렌더링 THEN 영어 링크 라벨이 표시되어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="full" />, "en");

      // THEN
      expect(screen.getByText("Terms of Service")).toBeInTheDocument();
      expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    });

    it("GIVEN ko locale WHEN full variant 렌더링 THEN 한국어 링크 라벨이 표시되어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="full" />, "ko");

      // THEN
      expect(screen.getByText("이용약관")).toBeInTheDocument();
      expect(screen.getByText("개인정보처리방침")).toBeInTheDocument();
    });

    it("GIVEN en locale WHEN 렌더링 THEN 사업자정보는 여전히 한국어여야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<AppFooter variant="full" />, "en");

      // THEN - 법적 요구사항으로 사업자 정보는 항상 한국어
      expect(screen.getByText(BUSINESS_INFO.companyName)).toBeInTheDocument();
      expect(
        screen.getByText(
          `대표: ${BUSINESS_INFO.representative} | 사업자등록번호: ${BUSINESS_INFO.businessNumber}`
        )
      ).toBeInTheDocument();
    });
  });
});
