/**
 * Plan — 구독 플랜 도메인 모델
 *
 * 플랜별 가격, 한도, 포맷팅은 구독 도메인 지식이다.
 * -1은 "무제한"을 의미하는 도메인 규약.
 */

export interface PlanLimits {
  readonly projects: number;
  readonly analysisPerMonth: number;
  readonly storageMB: number;
}

export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly limits: PlanLimits;
}

const UNLIMITED = -1;
const CONTACT_SALES = -1;

const SUBSCRIPTION_PRICES = {
  PRO: Number(process.env.NEXT_PUBLIC_PRO_PRICE) || 29000,
  ENTERPRISE: CONTACT_SALES,
} as const;

export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    limits: {
      projects: 3,
      analysisPerMonth: 10,
      storageMB: 100,
    },
  },
  PRO: {
    id: "pro",
    name: "Pro",
    price: SUBSCRIPTION_PRICES.PRO,
    limits: {
      projects: UNLIMITED,
      analysisPerMonth: 100,
      storageMB: 10240,
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    price: SUBSCRIPTION_PRICES.ENTERPRISE,
    limits: {
      projects: UNLIMITED,
      analysisPerMonth: UNLIMITED,
      storageMB: UNLIMITED,
    },
  },
} as const;

export function isUnlimitedValue(value: number): boolean {
  return value === UNLIMITED;
}

export function formatLimit(value: number): string {
  return isUnlimitedValue(value) ? "무제한" : value.toString();
}

export function formatStorage(mb: number): string {
  if (isUnlimitedValue(mb)) return "무제한";
  if (mb >= 1024) return `${mb / 1024}GB`;
  return `${mb}MB`;
}

export function formatPrice(price: number): string {
  if (price === CONTACT_SALES) return "문의";
  return `₩${price.toLocaleString()}`;
}
