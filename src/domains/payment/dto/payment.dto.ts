/**
 * Payment DTO
 *
 * 결제 관련 요청/응답 검증 스키마
 */

import { z } from "zod";
import { PLANS } from "@/domains/subscription/model/plan";

// 유료 플랜만 결제 가능
const paidPlanIds: string[] = Object.values(PLANS)
  .filter((plan) => plan.price > 0)
  .map((plan) => plan.id);

/**
 * 결제 생성 요청 스키마
 */
export const createPaymentSchema = z.object({
  planId: z
    .string()
    .min(1, "플랜을 선택해주세요")
    .refine((val) => paidPlanIds.includes(val), {
      message: "유료 플랜만 결제 가능합니다",
    }),
});

export type CreatePaymentRequest = z.infer<typeof createPaymentSchema>;

/**
 * 결제 검증 요청 스키마
 */
export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, "결제 ID가 필요합니다"),
  orderId: z.string().optional(),
});

export type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;

/**
 * 결제 취소 요청 스키마
 */
export const cancelPaymentSchema = z.object({
  paymentId: z.string().min(1, "결제 ID가 필요합니다"),
  reason: z.string().min(1, "취소 사유를 입력해주세요"),
});

export type CancelPaymentRequest = z.infer<typeof cancelPaymentSchema>;

/**
 * 웹훅 요청 스키마
 */
export const webhookPayloadSchema = z.object({
  type: z.string(),
  data: z.object({
    paymentId: z.string(),
    transactionId: z.string().optional(),
  }),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
