"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// PortOne V1 (아임포트) 설정
const IMP_CODE = process.env.NEXT_PUBLIC_IMP_CODE;
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
const PG_MID = process.env.NEXT_PUBLIC_PG_MID || "html5_inicis.INIpayTest";
const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE;

// Feature flag: IMP_CODE가 설정되어 있으면 실제 모드, 아니면 PAYMENT_MODE로 판단
const USE_TEST_MODE = IMP_CODE ? false : PAYMENT_MODE !== "real";

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

// 아임포트 V1 SDK 타입 정의
interface IMP {
  init: (impCode: string) => void;
  request_pay: (
    params: {
      channelKey?: string;
      pg: string;
      pay_method: string;
      merchant_uid: string;
      name: string;
      amount: number;
      buyer_email: string;
      buyer_name: string;
      buyer_tel: string;
    },
    callback: (response: IMPResponse) => void
  ) => void;
}

interface IMPResponse {
  success: boolean;
  imp_uid?: string;
  merchant_uid?: string;
  error_msg?: string;
  error_code?: string;
}

declare global {
  interface Window {
    IMP?: IMP;
  }
}

export function CheckoutButton({
  planId,
  planName,
  className = "",
}: CheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // 아임포트 SDK 동적 로드
  useEffect(() => {
    if (USE_TEST_MODE) {
      console.log("[Checkout] Test mode enabled - IMP SDK not loaded");
      console.log("[Checkout] IMP_CODE:", IMP_CODE);
      return;
    }

    // 이미 로드된 경우
    if (window.IMP) {
      window.IMP.init(IMP_CODE!);
      setSdkLoaded(true);
      console.log("[Checkout] IMP SDK already loaded, initialized");
      return;
    }

    // SDK 스크립트 로드
    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    script.onload = () => {
      if (window.IMP) {
        window.IMP.init(IMP_CODE!);
        setSdkLoaded(true);
        console.log("[Checkout] IMP SDK loaded and initialized");
      }
    };
    script.onerror = () => {
      console.error("[Checkout] Failed to load IMP SDK");
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: 스크립트는 제거하지 않음 (재사용)
    };
  }, []);

  // 테스트 모드 결제 처리 (SDK 없이, 확인 팝업 없이 바로 결제)
  const handleTestPayment = useCallback(
    async (checkoutData: CheckoutData) => {
      try {
        const verifyResponse = await fetch("/api/payment/test-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: checkoutData.orderId }),
          credentials: "include",
        });

        const verifyResult = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyResult.success) {
          setError(verifyResult.error || "결제 처리에 실패했습니다");
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        alert(`${checkoutData.planName} 플랜으로 업그레이드되었습니다!`);
        router.refresh();
      } catch (err) {
        console.error("[Checkout] Test payment error:", err);
        setError(
          `결제 처리 중 오류: ${err instanceof Error ? err.message : String(err)}`
        );
        setIsLoading(false);
      }
    },
    [router]
  );

  // 결제 검증
  const verifyPayment = useCallback(
    async (impUid: string, merchantUid: string) => {
      const verifyResponse = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impUid, merchantUid }),
        credentials: "include",
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyResult.success) {
        setError(verifyResult.error || "결제 검증에 실패했습니다");
        return false;
      }

      alert(`${planName} 플랜으로 업그레이드되었습니다!`);
      router.refresh();
      return true;
    },
    [planName, router]
  );

  const handleCheckout = async () => {
    setIsLoading(true);
    setError("");

    try {
      // 1. 결제 주문 생성
      const checkoutResponse = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
        credentials: "include",
      });

      const checkoutResult = await checkoutResponse.json();

      if (!checkoutResponse.ok || !checkoutResult.success) {
        setError(checkoutResult.error || "결제 준비에 실패했습니다");
        setIsLoading(false);
        return;
      }

      const checkoutData: CheckoutData = checkoutResult.data;
      console.log("[Checkout] Order created:", checkoutData.orderId);

      // 2. 테스트 모드 또는 SDK 미로드 시 테스트 결제 처리
      if (USE_TEST_MODE || !sdkLoaded || !window.IMP) {
        console.log(
          "[Checkout] Using test mode payment, USE_TEST_MODE:",
          USE_TEST_MODE,
          "SDK loaded:",
          sdkLoaded
        );
        await handleTestPayment(checkoutData);
        return;
      }

      // 3. 아임포트 결제창 호출
      console.log("[Checkout] Opening IMP payment window...");
      console.log("[Checkout] IMP_CODE:", IMP_CODE);

      window.IMP.request_pay(
        {
          channelKey: CHANNEL_KEY!, // 포트원 콘솔에서 생성된 채널 키
          pg: PG_MID,
          pay_method: "card",
          merchant_uid: checkoutData.orderId,
          name: checkoutData.orderName,
          amount: checkoutData.amount,
          buyer_email: checkoutData.customer.email,
          buyer_name: checkoutData.customer.name,
          buyer_tel: "010-0000-1234",
        },
        async (response: IMPResponse) => {
          console.log("[Checkout] Payment response:", response);

          if (response.success && response.imp_uid) {
            // 4. 결제 성공 - 서버에서 검증
            console.log("[Checkout] Payment success, verifying...");
            const verified = await verifyPayment(
              response.imp_uid,
              response.merchant_uid || checkoutData.orderId
            );
            if (!verified) {
              setIsLoading(false);
            }
          } else {
            // 결제 실패 또는 취소
            console.log("[Checkout] Payment failed:", response.error_msg);
            setError(response.error_msg || "결제가 취소되었습니다");
            setIsLoading(false);
          }
        }
      );
    } catch (err) {
      console.error("[Checkout] Error:", err);
      setError("결제 처리 중 오류가 발생했습니다");
      setIsLoading(false);
    }
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
      {error && (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
