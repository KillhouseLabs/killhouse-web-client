/**
 * Application constants
 */

export const APP_NAME = "Killhouse";
export const APP_DESCRIPTION =
  "AI-powered security vulnerability analysis platform";

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  PROJECTS: "/projects",
  PROJECT_NEW: "/projects/new",
  MYPAGE: "/mypage",
  SUBSCRIPTION: "/subscription",
  PRICING: "/pricing",
} as const;

// API endpoints
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
    SESSION: "/api/auth/session",
  },
  USER: {
    PROFILE: "/api/user/profile",
    PASSWORD: "/api/user/password",
    DELETE: "/api/user/delete",
  },
  PROJECT: {
    LIST: "/api/projects",
    CREATE: "/api/projects",
    GET: (id: string) => `/api/projects/${id}`,
    UPDATE: (id: string) => `/api/projects/${id}`,
    DELETE: (id: string) => `/api/projects/${id}`,
  },
  ANALYSIS: {
    START: (projectId: string) => `/api/projects/${projectId}/analysis`,
    STATUS: (projectId: string, analysisId: string) =>
      `/api/projects/${projectId}/analysis/${analysisId}`,
    REPORT: (projectId: string, analysisId: string) =>
      `/api/projects/${projectId}/analysis/${analysisId}/report`,
  },
  SUBSCRIPTION: {
    CURRENT: "/api/subscription",
    CHECKOUT: "/api/subscription/checkout",
    PORTAL: "/api/subscription/portal",
    WEBHOOK: "/api/subscription/webhook",
  },
} as const;

// Subscription prices (in KRW)
export const SUBSCRIPTION_PRICES = {
  PRO: Number(process.env.NEXT_PUBLIC_PRO_PRICE) || 29000,
  ENTERPRISE: -1, // contact sales
} as const;

// Subscription plans
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
      projects: -1, // unlimited
      analysisPerMonth: 100,
      storageMB: 10240, // 10GB
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    price: SUBSCRIPTION_PRICES.ENTERPRISE, // contact
    limits: {
      projects: -1,
      analysisPerMonth: -1,
      storageMB: -1,
    },
  },
} as const;

// Helper functions for plan limits
export function formatLimit(value: number): string {
  return value === -1 ? "무제한" : value.toString();
}

export function formatStorage(mb: number): string {
  if (mb === -1) return "무제한";
  if (mb >= 1024) return `${mb / 1024}GB`;
  return `${mb}MB`;
}

export function formatPrice(price: number): string {
  if (price === -1) return "문의";
  return `₩${price.toLocaleString()}`;
}

// Vulnerability severity levels
export const SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

// Business information (통신판매업 필수 표시사항)
export const BUSINESS_INFO = {
  companyName: "킬하우스",
  representative: "홍길동",
  businessNumber: "123-45-67890",
  ecommerceRegistration: "제2025-서울강남-00000호",
  address: "서울특별시 강남구 테헤란로 123, 4층",
  email: "support@killhouse.com",
  phone: "02-1234-5678",
} as const;

// Refund policy
export const REFUND_POLICY = {
  withdrawalPeriodDays: 7,
  roundingUnit: 100,
} as const;

// Legal page routes
export const LEGAL_ROUTES = {
  TERMS: "/terms",
  PRIVACY: "/privacy",
} as const;
