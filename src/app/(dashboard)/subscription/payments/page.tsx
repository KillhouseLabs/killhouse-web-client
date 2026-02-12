"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/config/constants";

interface Payment {
  id: string;
  orderId: string;
  planId: string;
  amount: number;
  status: string;
  portonePaymentId: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

interface RefundEstimate {
  planName: string;
  originalAmount: number;
  refundAmount: number;
  usedDays: number;
  totalDays: number;
  usageRate: number;
  isFullRefund: boolean;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundEstimate, setRefundEstimate] = useState<RefundEstimate | null>(
    null
  );
  const [isRefunding, setIsRefunding] = useState(false);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payment/history");
      if (response.ok) {
        const data = await response.json();
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRefundEstimate = async (paymentId: string) => {
    setIsLoadingEstimate(true);
    try {
      const response = await fetch(
        `/api/payment/refund?paymentId=${paymentId}`
      );
      if (response.ok) {
        const data = await response.json();
        setRefundEstimate(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch refund estimate:", error);
    } finally {
      setIsLoadingEstimate(false);
    }
  };

  const handleRefundClick = async (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
    await fetchRefundEstimate(payment.id);
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;

    const confirmed = window.confirm(
      `환불을 진행하시겠습니까?\n\n` +
        `환불 금액: ₩${refundEstimate?.refundAmount.toLocaleString() || 0}\n` +
        `(사용일수: ${refundEstimate?.usedDays || 0}일 / ${refundEstimate?.totalDays || 30}일)\n\n` +
        `환불 후 즉시 Free 플랜으로 변경됩니다.`
    );

    if (!confirmed) return;

    setIsRefunding(true);
    try {
      const response = await fetch("/api/payment/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          reason: refundReason || "사용자 요청에 의한 환불",
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `환불이 완료되었습니다.\n\n` +
            `환불 금액: ₩${result.data.refundAmount.toLocaleString()}\n` +
            (result.data.isFullRefund ? "(전액 환불)" : "(부분 환불)")
        );
        setShowRefundModal(false);
        setSelectedPayment(null);
        setRefundEstimate(null);
        setRefundReason("");
        await fetchPayments();
        router.refresh();
      } else {
        alert(result.error || "환불 처리에 실패했습니다");
      }
    } catch (error) {
      console.error("Refund error:", error);
      alert("환불 처리 중 오류가 발생했습니다");
    } finally {
      setIsRefunding(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      REFUNDED: "bg-purple-100 text-purple-800",
    };
    const labels: Record<string, string> = {
      PENDING: "대기중",
      COMPLETED: "완료",
      FAILED: "실패",
      CANCELLED: "취소",
      REFUNDED: "환불됨",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || "bg-gray-100"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">결제 관리</h1>
          <p className="mt-1 text-muted-foreground">
            결제 내역을 확인하고 환불을 요청할 수 있습니다
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/subscription")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          ← 구독 관리로 돌아가기
        </button>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-border bg-card">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <h3 className="mb-1 font-medium">결제 내역이 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              유료 플랜을 구독하면 여기에 결제 내역이 표시됩니다
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    주문번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    플랜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    결제일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => {
                  const plan =
                    PLANS[payment.planId.toUpperCase() as keyof typeof PLANS];
                  return (
                    <tr key={payment.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm">
                        {payment.orderId.slice(0, 20)}...
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {plan?.name || payment.planId}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        ₩{payment.amount.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {payment.status === "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => handleRefundClick(payment)}
                            className="rounded-lg border border-destructive px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                          >
                            환불 요청
                          </button>
                        )}
                        {payment.status === "REFUNDED" &&
                          payment.cancelReason && (
                            <span className="text-xs text-muted-foreground">
                              {payment.cancelReason}
                            </span>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">환불 요청</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              구독 사용일수에 따라 부분 환불됩니다
            </p>

            {isLoadingEstimate ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : refundEstimate ? (
              <div className="mt-4 space-y-4">
                {/* 환불 정보 */}
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">플랜</p>
                      <p className="font-medium">{refundEstimate.planName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">결제 금액</p>
                      <p className="font-medium">
                        ₩{refundEstimate.originalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">사용 기간</p>
                      <p className="font-medium">
                        {refundEstimate.usedDays}일 / {refundEstimate.totalDays}
                        일
                        <span className="ml-1 text-muted-foreground">
                          ({refundEstimate.usageRate}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">환불 금액</p>
                      <p className="text-lg font-bold text-primary">
                        ₩{refundEstimate.refundAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 사용량 바 */}
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>사용량</span>
                      <span>{refundEstimate.usageRate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${refundEstimate.usageRate}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">사용</span>
                      <span className="font-medium text-primary">
                        환불 가능
                      </span>
                    </div>
                  </div>
                </div>

                {/* 환불 사유 */}
                <div>
                  <label
                    htmlFor="refundReason"
                    className="mb-1 block text-sm font-medium"
                  >
                    환불 사유 (선택)
                  </label>
                  <textarea
                    id="refundReason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="환불 사유를 입력해주세요"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={2}
                  />
                </div>

                {/* 경고 메시지 */}
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                  <strong>주의:</strong> 환불 후 즉시 Free 플랜으로 변경되며,
                  유료 기능을 사용할 수 없게 됩니다.
                </div>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                환불 정보를 불러올 수 없습니다
              </p>
            )}

            {/* 버튼 */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPayment(null);
                  setRefundEstimate(null);
                  setRefundReason("");
                }}
                disabled={isRefunding}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleRefund}
                disabled={isRefunding || !refundEstimate}
                className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isRefunding
                  ? "처리 중..."
                  : `₩${refundEstimate?.refundAmount.toLocaleString() || 0} 환불`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
