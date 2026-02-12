"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// PortOne 테스트 환경 설정
const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "store-test";
const PORTONE_CHANNEL_KEY =
  process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "channel-test";

interface CheckoutButtonProps {
  planId: string;
  planName: string;
  className?: string;
}

interface CheckoutData {
  orderId: string;
  paymentId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  orderName: string;
  customer: {
    email: string;
    name: string;
  };
}

export function CheckoutButton({
  planId,
  planName,
  className = "",
}: CheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [portoneLoaded, setPortoneLoaded] = useState(false);

  // PortOne SDK 동적 로드
  useEffect(() => {
    async function loadPortOne() {
      try {
        const PortOne = await import("@portone/browser-sdk/v2");
        (window as unknown as Record<string, unknown>).PortOne = PortOne;
        setPortoneLoaded(true);
      } catch (error) {
        console.error("Failed to load PortOne SDK:", error);
      }
    }
    loadPortOne();
  }, []);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError("");

    try {
      // 1. 결제 주문 생성
      const checkoutResponse = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const checkoutResult = await checkoutResponse.json();

      if (!checkoutResponse.ok || !checkoutResult.success) {
        setError(checkoutResult.error || "결제 준비에 실패했습니다");
        return;
      }

      const checkoutData: CheckoutData = checkoutResult.data;

      // 2. PortOne 결제창 호출
      if (!portoneLoaded) {
        // SDK 로드 실패 시 테스트 모드로 처리
        await handleTestPayment(checkoutData);
        return;
      }

      const PortOne = (window as unknown as Record<string, unknown>).PortOne as {
        requestPayment: (params: unknown) => Promise<{ code?: string; message?: string }>;
      };

      const paymentResponse = await PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId: `payment_${checkoutData.orderId}`,
        orderName: checkoutData.orderName,
        totalAmount: checkoutData.amount,
        currency: checkoutData.currency,
        payMethod: "CARD",
        customer: {
          fullName: checkoutData.customer.name,
          email: checkoutData.customer.email,
        },
        customData: JSON.stringify({ orderId: checkoutData.orderId }),
        // 테스트 환경용 추가 설정
        bypass: {
          tosspayments: {
            useInternationalCardOnly: false,
          },
        },
      });

      // 3. 결제 결과 확인
      if (paymentResponse.code) {
        // 결제 실패 또는 취소
        setError(paymentResponse.message || "결제가 취소되었습니다");
        return;
      }

      // 4. 서버에서 결제 검증
      await verifyPayment(`payment_${checkoutData.orderId}`);
    } catch (err) {
      console.error("Checkout error:", err);
      setError("결제 처리 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 모드 결제 처리 (SDK 없이)
  const handleTestPayment = async (checkoutData: CheckoutData) => {
    // 테스트 환경에서는 바로 성공 처리
    const confirmed = window.confirm(
      `테스트 결제\n\n플랜: ${checkoutData.planName}\n금액: ₩${checkoutData.amount.toLocaleString()}\n\n결제를 진행하시겠습니까?`
    );

    if (!confirmed) {
      setError("결제가 취소되었습니다");
      return;
    }

    // 테스트 모드: 직접 구독 업그레이드 처리
    try {
      const verifyResponse = await fetch("/api/payment/test-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: checkoutData.orderId }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyResult.success) {
        setError(verifyResult.error || "결제 처리에 실패했습니다");
        return;
      }

      // 성공 시 새로고침
      router.refresh();
      alert(
        `${checkoutData.planName} 플랜으로 업그레이드되었습니다!`
      );
    } catch {
      setError("결제 처리 중 오류가 발생했습니다");
    }
  };

  const verifyPayment = async (paymentId: string) => {
    const verifyResponse = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });

    const verifyResult = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyResult.success) {
      setError(verifyResult.error || "결제 검증에 실패했습니다");
      return;
    }

    // 성공 시 새로고침
    router.refresh();
    alert(`${planName} 플랜으로 업그레이드되었습니다!`);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={`w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 ${className}`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            처리 중...
          </span>
        ) : (
          `${planName} 플랜 구독하기`
        )}
      </button>
      {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
