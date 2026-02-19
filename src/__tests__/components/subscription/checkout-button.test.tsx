/**
 * CheckoutButton Component Tests
 *
 * 결제 버튼 컴포넌트 테스트
 * - confirm 팝업 없이 바로 결제 처리
 * - 로딩 상태 표시
 * - 에러 처리
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckoutButton } from "@/components/subscription/checkout-button";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.confirm - should NOT be called
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

// Mock window.alert
const mockAlert = jest.fn();
window.alert = mockAlert;

describe("CheckoutButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it("GIVEN Pro 플랜 WHEN 렌더링 THEN 구독하기 버튼이 표시되어야 한다", () => {
    // GIVEN & WHEN
    render(<CheckoutButton planId="pro" planName="Pro" />);

    // THEN
    expect(
      screen.getByRole("button", { name: "Pro 플랜 구독하기" })
    ).toBeInTheDocument();
  });

  it("GIVEN Pro 플랜 WHEN 버튼 클릭 THEN checkout API를 호출해야 한다", async () => {
    // GIVEN
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          orderId: "order_123",
          paymentId: "pay_123",
          planId: "pro",
          planName: "Pro",
          amount: 29000,
          currency: "KRW",
          orderName: "Killhouse Pro 플랜",
          customer: { email: "test@test.com", name: "Test" },
        },
      }),
    });

    render(<CheckoutButton planId="pro" planName="Pro" />);

    // WHEN
    fireEvent.click(screen.getByRole("button", { name: "Pro 플랜 구독하기" }));

    // THEN
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/payment/checkout",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ planId: "pro" }),
        })
      );
    });
  });

  it("GIVEN 테스트 모드 WHEN 결제 진행 THEN window.confirm이 호출되지 않아야 한다", async () => {
    // GIVEN
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orderId: "order_123",
            paymentId: "pay_123",
            planId: "pro",
            planName: "Pro",
            amount: 29000,
            currency: "KRW",
            orderName: "Killhouse Pro 플랜",
            customer: { email: "test@test.com", name: "Test" },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            payment: { id: "pay_123", status: "COMPLETED" },
            subscription: { id: "sub_123", planId: "pro", status: "ACTIVE" },
          },
        }),
      });

    render(<CheckoutButton planId="pro" planName="Pro" />);

    // WHEN
    fireEvent.click(screen.getByRole("button", { name: "Pro 플랜 구독하기" }));

    // THEN - window.confirm이 호출되지 않아야 한다
    await waitFor(() => {
      expect(mockConfirm).not.toHaveBeenCalled();
    });
  });

  it("GIVEN 결제 실패 WHEN checkout API 오류 THEN 에러 메시지가 표시되어야 한다", async () => {
    // GIVEN
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: "결제 준비에 실패했습니다",
      }),
    });

    render(<CheckoutButton planId="pro" planName="Pro" />);

    // WHEN
    fireEvent.click(screen.getByRole("button", { name: "Pro 플랜 구독하기" }));

    // THEN
    await waitFor(() => {
      expect(screen.getByText("결제 준비에 실패했습니다")).toBeInTheDocument();
    });
  });

  it("GIVEN 버튼 클릭 WHEN 결제 진행 중 THEN 로딩 상태가 표시되어야 한다", async () => {
    // GIVEN - fetch가 resolve되지 않는 상태 유지
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves

    render(<CheckoutButton planId="pro" planName="Pro" />);

    // WHEN
    fireEvent.click(screen.getByRole("button", { name: "Pro 플랜 구독하기" }));

    // THEN
    await waitFor(() => {
      expect(screen.getByText("처리 중...")).toBeInTheDocument();
    });
  });
});
