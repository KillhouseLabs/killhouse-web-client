/**
 * Application constants
 */

export const APP_NAME = "Killhouse";
export const APP_DESCRIPTION = "AI-powered security vulnerability analysis platform";

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
// Set to 1 for testing, change to actual prices in production
export const SUBSCRIPTION_PRICES = {
  PRO: 1, // 테스트용 1원 (프로덕션: 29000)
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
