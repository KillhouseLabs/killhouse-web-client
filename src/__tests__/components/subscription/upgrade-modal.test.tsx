/**
 * UpgradeModal Component Tests
 *
 * 구독 업그레이드 유도 모달 테스트
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { PLANS } from "@/config/constants";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) {
    return (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    );
  };
});

describe("UpgradeModal", () => {
  describe("모달 표시", () => {
    it("GIVEN isOpen=true WHEN 렌더링 THEN 모달이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<UpgradeModal isOpen={true} onClose={jest.fn()} type="project" />);

      // THEN
      expect(screen.getByText("프로젝트 생성 한도 초과")).toBeInTheDocument();
    });

    it("GIVEN isOpen=false WHEN 렌더링 THEN 모달이 표시되지 않아야 한다", () => {
      // GIVEN & WHEN
      render(
        <UpgradeModal isOpen={false} onClose={jest.fn()} type="project" />
      );

      // THEN
      expect(
        screen.queryByText("프로젝트 생성 한도 초과")
      ).not.toBeInTheDocument();
    });
  });

  describe("타입별 메시지", () => {
    it("GIVEN type=project WHEN 렌더링 THEN 프로젝트 관련 메시지 표시", () => {
      // GIVEN & WHEN
      render(<UpgradeModal isOpen={true} onClose={jest.fn()} type="project" />);

      // THEN
      expect(screen.getByText("프로젝트 생성 한도 초과")).toBeInTheDocument();
      expect(
        screen.getByText("무료 플랜의 프로젝트 생성 한도에 도달했습니다.")
      ).toBeInTheDocument();
    });

    it("GIVEN type=analysis WHEN 렌더링 THEN 분석 관련 메시지 표시", () => {
      // GIVEN & WHEN
      render(
        <UpgradeModal isOpen={true} onClose={jest.fn()} type="analysis" />
      );

      // THEN
      expect(screen.getByText("분석 한도 초과")).toBeInTheDocument();
      expect(
        screen.getByText("이번 달 분석 한도에 도달했습니다.")
      ).toBeInTheDocument();
    });
  });

  describe("사용량 정보", () => {
    it("GIVEN usage 정보 제공 WHEN 렌더링 THEN 사용량이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(
        <UpgradeModal
          isOpen={true}
          onClose={jest.fn()}
          type="project"
          usage={{ current: 3, limit: 3 }}
        />
      );

      // THEN
      expect(screen.getByText(/현재 3개 \/ 최대 3개/)).toBeInTheDocument();
    });
  });

  describe("Pro 플랜 혜택", () => {
    it("GIVEN 모달 열림 WHEN 렌더링 THEN Pro 플랜 혜택이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<UpgradeModal isOpen={true} onClose={jest.fn()} type="project" />);

      // THEN
      expect(screen.getByText(/무제한/)).toBeInTheDocument();
      expect(screen.getByText(/100회/)).toBeInTheDocument();
      expect(screen.getByText(/10GB/)).toBeInTheDocument();
    });

    it("GIVEN 모달 열림 WHEN 렌더링 THEN 가격이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<UpgradeModal isOpen={true} onClose={jest.fn()} type="project" />);

      // THEN
      const formattedPrice = PLANS.PRO.price.toLocaleString();
      expect(screen.getByText(new RegExp(`₩${formattedPrice}`))).toBeInTheDocument();
    });
  });

  describe("액션 버튼", () => {
    it("GIVEN 모달 열림 WHEN 플랜 업그레이드 클릭 THEN /pricing 링크가 있어야 한다", () => {
      // GIVEN & WHEN
      render(<UpgradeModal isOpen={true} onClose={jest.fn()} type="project" />);

      // THEN
      const upgradeLink = screen.getByRole("link", { name: /플랜 업그레이드/ });
      expect(upgradeLink).toHaveAttribute("href", "/pricing");
    });

    it("GIVEN 모달 열림 WHEN 나중에 버튼 클릭 THEN onClose가 호출되어야 한다", () => {
      // GIVEN
      const onClose = jest.fn();
      render(<UpgradeModal isOpen={true} onClose={onClose} type="project" />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: "나중에" }));

      // THEN
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("모달 닫기", () => {
    it("GIVEN 모달 열림 WHEN 백드롭 클릭 THEN onClose가 호출되어야 한다", () => {
      // GIVEN
      const onClose = jest.fn();
      render(<UpgradeModal isOpen={true} onClose={onClose} type="project" />);

      // WHEN
      const backdrop = document.querySelector(".fixed.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // THEN
      expect(onClose).toHaveBeenCalled();
    });
  });
});
